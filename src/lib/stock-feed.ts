import { createClient } from "@supabase/supabase-js";

const NSE_UNIVERSE_SOURCES = [
  "https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv",
  "https://nsearchives.nseindia.com/emerge/corporates/content/SME_EQUITY_L.csv",
] as const;
const BATCH_SIZE = 12;
const STARTER_UNIVERSE = [
  ["RELIANCE.NS", "Reliance Industries Limited"],
  ["TCS.NS", "Tata Consultancy Services Limited"],
  ["INFY.NS", "Infosys Limited"],
  ["HDFCBANK.NS", "HDFC Bank Limited"],
  ["ICICIBANK.NS", "ICICI Bank Limited"],
  ["SBIN.NS", "State Bank of India"],
  ["ITC.NS", "ITC Limited"],
  ["BHARTIARTL.NS", "Bharti Airtel Limited"],
] as const;

type Runtime = Record<string, unknown>;
type UniverseRow = { symbol: string; name: string; series: string; exchange: "NSE" };
type YahooResult = { snapshot: Record<string, unknown>; metrics: Record<string, unknown> };

function read(runtime: Runtime, key: string): string | null {
  const value =
    runtime[key] ??
    (runtime.env as Record<string, unknown> | undefined)?.[key] ??
    (typeof process !== "undefined" ? process.env[key] : undefined);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Free, best-effort EOD sync. It is batched so a free endpoint is not hammered with thousands of requests. */
export async function runStockFeedSync(runtime: Runtime) {
  const url = read(runtime, "SUPABASE_URL") ?? read(runtime, "VITE_SUPABASE_URL");
  const key = read(runtime, "SUPABASE_SERVICE_ROLE_KEY") ?? read(runtime, "SUPABASE_SERVICE_KEY");
  if (!url || !key)
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY runtime secret.");
  const db = createClient(url, key);

  const universeProbe = await db.from("stock_universe").select("symbol").limit(1);
  if (universeProbe.error?.code === "42P01") return runStarterSync(db);
  if (universeProbe.error) throw universeProbe.error;

  const imported = await refreshNseUniverse(db);
  const { data: queued, error: queueError } = await db
    .from("stock_universe")
    .select("symbol, name, exchange")
    .eq("exchange", "NSE")
    .eq("active", true)
    .order("last_synced_at", { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE);
  if (queueError) throw queueError;

  const results: YahooResult[] = [];
  let failed = 0;
  for (const entry of queued ?? []) {
    try {
      results.push(await fetchStock(String(entry.symbol), String(entry.name)));
      await db
        .from("stock_universe")
        .update({ last_synced_at: new Date().toISOString(), last_error: null })
        .eq("symbol", entry.symbol);
    } catch (error) {
      failed += 1;
      const message =
        error instanceof Error ? error.message.slice(0, 500) : "Yahoo Finance request failed";
      await db
        .from("stock_universe")
        .update({ last_synced_at: new Date().toISOString(), last_error: message })
        .eq("symbol", entry.symbol);
    }
  }

  if (results.length) {
    const { error } = await db.from("stock_snapshots").upsert(
      results.map((result) => result.snapshot),
      { onConflict: "symbol" },
    );
    if (error) throw error;
    const { error: metricsError } = await db.from("stock_screener_metrics").upsert(
      results.map((result) => result.metrics),
      { onConflict: "symbol" },
    );
    if (metricsError && metricsError.code !== "42P01") throw metricsError;
  }

  const { count: universe } = await db
    .from("stock_universe")
    .select("symbol", { count: "exact", head: true })
    .eq("exchange", "NSE")
    .eq("active", true);
  return {
    imported,
    attempted: (queued ?? []).length,
    synced: results.length,
    failed,
    universe: universe ?? 0,
    source: "nse_universe+yahoo_finance",
  };
}

async function runStarterSync(db: ReturnType<typeof createClient>) {
  const results = await Promise.all(
    STARTER_UNIVERSE.map(([symbol, name]) => fetchStock(symbol, name)),
  );
  const { error } = await db.from("stock_snapshots").upsert(
    results.map((result) => result.snapshot),
    { onConflict: "symbol" },
  );
  if (error) throw error;
  const { error: metricsError } = await db.from("stock_screener_metrics").upsert(
    results.map((result) => result.metrics),
    { onConflict: "symbol" },
  );
  if (metricsError && metricsError.code !== "42P01") throw metricsError;
  return {
    imported: 0,
    attempted: results.length,
    synced: results.length,
    failed: 0,
    universe: results.length,
    source: "starter+yahoo_finance",
  };
}

async function refreshNseUniverse(db: ReturnType<typeof createClient>): Promise<number> {
  // The NSE list changes far less often than prices. Refresh it at most once a
  // calendar day so the free Supabase quota is spent on actual price updates.
  const today = new Date().toISOString().slice(0, 10);
  const { data: latest, error: latestError } = await db
    .from("stock_universe")
    .select("listed_at")
    .order("listed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (latestError) throw latestError;
  if (typeof latest?.listed_at === "string" && latest.listed_at.slice(0, 10) === today) {
    const { count } = await db
      .from("stock_universe")
      .select("symbol", { count: "exact", head: true })
      .eq("exchange", "NSE")
      .eq("active", true);
    return count ?? 0;
  }

  const rows = (await Promise.all(NSE_UNIVERSE_SOURCES.map(fetchNseCsv))).flat();
  const unique = Array.from(new Map(rows.map((row) => [row.symbol, row])).values());
  if (!unique.length) throw new Error("NSE security list returned no eligible equity symbols.");
  const { error } = await db.from("stock_universe").upsert(
    unique.map((row) => ({
      ...row,
      active: true,
      source: "nse_security_list",
      listed_at: new Date().toISOString(),
    })),
    { onConflict: "symbol" },
  );
  if (error) throw error;
  return unique.length;
}

async function fetchNseCsv(url: string): Promise<UniverseRow[]> {
  const response = await fetch(url, {
    headers: {
      Accept: "text/csv,*/*",
      "User-Agent": "Mozilla/5.0 (compatible; NiveshYuktiResearch/1.0)",
    },
  });
  if (!response.ok) throw new Error(`NSE security list request failed: HTTP ${response.status}`);
  const [headerLine, ...lines] = (await response.text())
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean);
  const headers = parseCsvLine(headerLine).map((value) => value.trim().toUpperCase());
  const symbolIndex = headers.indexOf("SYMBOL");
  const nameIndex = headers.findIndex(
    (header) => header === "NAME OF COMPANY" || header === "NAME",
  );
  const seriesIndex = headers.indexOf("SERIES");
  if (symbolIndex < 0 || nameIndex < 0)
    throw new Error("NSE security list has an unexpected CSV format.");

  return lines.flatMap((line) => {
    const fields = parseCsvLine(line);
    const rawSymbol = fields[symbolIndex]?.trim().toUpperCase();
    const name = fields[nameIndex]?.trim();
    const series = seriesIndex >= 0 ? fields[seriesIndex]?.trim().toUpperCase() || "EQ" : "EQ";
    if (!rawSymbol || !name || !/^[A-Z0-9&-]+$/.test(rawSymbol) || !isEquitySeries(series))
      return [];
    return [{ symbol: `${rawSymbol}.NS`, name, series, exchange: "NSE" as const }];
  });
}

function isEquitySeries(series: string): boolean {
  return ["EQ", "BE", "BZ", "SM", "ST", "MT", "MZ", "IV", "RR"].includes(series);
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) {
      fields.push(value);
      value = "";
    } else value += character;
  }
  fields.push(value);
  return fields;
}

async function fetchStock(symbol: string, fallbackName: string): Promise<YahooResult> {
  const payload = (await fetchYahooChart(symbol)) as {
    chart?: {
      result?: Array<{
        meta?: Record<string, unknown>;
        indicators?: {
          quote?: Array<{
            close?: Array<number | null>;
            high?: Array<number | null>;
            low?: Array<number | null>;
          }>;
        };
      }>;
    };
  };
  const result = payload.chart?.result?.[0];
  const meta = result?.meta;
  if (!meta) throw new Error(`Missing quote data for ${symbol}`);
  const price = Number(meta.regularMarketPrice);
  if (!Number.isFinite(price)) throw new Error(`Invalid quote data for ${symbol}`);
  const previousClose = Number(meta.previousClose ?? price);
  const quote = result?.indicators?.quote?.[0];
  const closes = (quote?.close ?? []).filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  const highs = (quote?.high ?? []).filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  const lows = (quote?.low ?? []).filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
  const now = new Date().toISOString();
  return {
    snapshot: {
      symbol,
      name: String(meta.longName ?? meta.shortName ?? fallbackName),
      exchange: "NSE",
      currency: String(meta.currency ?? "INR"),
      price,
      previous_close: previousClose,
      change: price - previousClose,
      change_percent: previousClose ? ((price - previousClose) / previousClose) * 100 : 0,
      day_high: Number(meta.regularMarketDayHigh ?? price),
      day_low: Number(meta.regularMarketDayLow ?? price),
      volume: Number(meta.regularMarketVolume ?? 0),
      source: "yahoo_finance",
      synced_at: now,
    },
    metrics: {
      symbol,
      rsi_14: calculateRsi(closes, 14),
      sma_50: average(closes.slice(-50)),
      sma_200: average(closes.slice(-200)),
      fifty_two_week_high: highs.length ? Math.max(...highs) : null,
      fifty_two_week_low: lows.length ? Math.min(...lows) : null,
      fundamentals_as_of: now.slice(0, 10),
      source: "yahoo_finance_eod",
      synced_at: now,
    },
  };
}

async function fetchYahooChart(symbol: string): Promise<unknown> {
  const path = `/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d`;
  const headers = {
    Accept: "application/json",
    "User-Agent": "Mozilla/5.0 (compatible; NiveshYuktiResearch/1.0; +https://niveshyukti.com)",
  };
  const failures: string[] = [];
  for (const host of ["query1.finance.yahoo.com", "query2.finance.yahoo.com"]) {
    try {
      const response = await fetch(`https://${host}${path}`, { headers });
      if (response.ok) return response.json();
      failures.push(`${host}: HTTP ${response.status}`);
    } catch (error) {
      failures.push(`${host}: ${error instanceof Error ? error.message : "network error"}`);
    }
  }
  throw new Error(`Yahoo Finance request failed for ${symbol} (${failures.join("; ")})`);
}

function average(values: number[]): number | null {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function calculateRsi(closes: number[], period: number): number | null {
  if (closes.length <= period) return null;
  const window = closes.slice(-(period + 1));
  const changes = window.slice(1).map((close, index) => close - window[index]);
  const averageGain = average(changes.map((change) => Math.max(change, 0))) ?? 0;
  const averageLoss = average(changes.map((change) => Math.max(-change, 0))) ?? 0;
  return averageLoss === 0 ? 100 : 100 - 100 / (1 + averageGain / averageLoss);
}
