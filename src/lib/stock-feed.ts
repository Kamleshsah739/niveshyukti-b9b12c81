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

  const rows = await Promise.all(symbols.map(async (symbol) => {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`);
    if (!response.ok) throw new Error(`Yahoo Finance request failed for ${symbol}`);
    const payload = await response.json() as { chart?: { result?: Array<{ meta?: Record<string, unknown> }> } };
    const meta = payload.chart?.result?.[0]?.meta;
    if (!meta) throw new Error(`Missing quote data for ${symbol}`);
    const price = Number(meta.regularMarketPrice);
    const previousClose = Number(meta.previousClose ?? price);
    return {
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
    };
  }));

  const { error } = await db.from("stock_snapshots").upsert(rows, { onConflict: "symbol" });
  if (error) throw error;
  return { synced: rows.length, source: "yahoo_finance" };
}
