import { createClient } from "@supabase/supabase-js";

const symbols = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "HDFCBANK.NS", "ICICIBANK.NS", "SBIN.NS", "ITC.NS", "BHARTIARTL.NS"];

type Runtime = Record<string, unknown>;

function read(runtime: Runtime, key: string): string | null {
  const value = runtime[key] ?? (runtime.env as Record<string, unknown> | undefined)?.[key] ?? (typeof process !== "undefined" ? process.env[key] : undefined);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function runStockFeedSync(runtime: Runtime) {
  const url = read(runtime, "SUPABASE_URL") ?? read(runtime, "VITE_SUPABASE_URL");
  const key = read(runtime, "SUPABASE_SERVICE_ROLE_KEY") ?? read(runtime, "SUPABASE_SERVICE_KEY");
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY runtime secret.");
  const db = createClient(url, key);

  const results = await Promise.all(symbols.map(async (symbol) => {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d`);
    if (!response.ok) throw new Error(`Yahoo Finance request failed for ${symbol}`);
    const payload = await response.json() as {
      chart?: {
        result?: Array<{
          meta?: Record<string, unknown>;
          indicators?: { quote?: Array<{ close?: Array<number | null>; high?: Array<number | null>; low?: Array<number | null> }> };
        }>;
      };
    };
    const result = payload.chart?.result?.[0];
    const meta = result?.meta;
    if (!meta) throw new Error(`Missing quote data for ${symbol}`);
    const price = Number(meta.regularMarketPrice);
    const previousClose = Number(meta.previousClose ?? price);
    const closes = (result?.indicators?.quote?.[0]?.close ?? []).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const highs = (result?.indicators?.quote?.[0]?.high ?? []).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    const lows = (result?.indicators?.quote?.[0]?.low ?? []).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    return {
      snapshot: {
      symbol,
      name: String(meta.longName ?? meta.shortName ?? symbol),
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
      synced_at: new Date().toISOString(),
      },
      metrics: {
        symbol,
        rsi_14: calculateRsi(closes, 14),
        sma_50: average(closes.slice(-50)),
        sma_200: average(closes.slice(-200)),
        fifty_two_week_high: highs.length ? Math.max(...highs) : null,
        fifty_two_week_low: lows.length ? Math.min(...lows) : null,
        fundamentals_as_of: new Date().toISOString().slice(0, 10),
        source: "yahoo_finance_eod",
        synced_at: new Date().toISOString(),
      },
    };
  }));

  const { error } = await db.from("stock_snapshots").upsert(results.map((result) => result.snapshot), { onConflict: "symbol" });
  if (error) throw error;

  // The screener table is optional during the rollout; its richer fundamental fields
  // can be supplied by a permitted EOD provider without being overwritten here.
  const { error: metricsError } = await db.from("stock_screener_metrics").upsert(
    results.map((result) => result.metrics),
    { onConflict: "symbol" },
  );
  if (metricsError && metricsError.code !== "42P01") throw metricsError;
  return { synced: results.length, source: "yahoo_finance" };
}

function average(values: number[]): number | null {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function calculateRsi(closes: number[], period: number): number | null {
  if (closes.length <= period) return null;
  const changes = closes.slice(-(period + 1)).slice(1).map((close, index) => close - closes.slice(-(period + 1))[index]);
  const gains = changes.map((change) => Math.max(change, 0));
  const losses = changes.map((change) => Math.max(-change, 0));
  const averageGain = average(gains) ?? 0;
  const averageLoss = average(losses) ?? 0;
  if (averageLoss === 0) return 100;
  return 100 - 100 / (1 + averageGain / averageLoss);
}
