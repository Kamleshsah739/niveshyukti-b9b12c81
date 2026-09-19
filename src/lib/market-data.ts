export type StockSnapshot = {
  symbol: string;
  name: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  high: number;
  low: number;
  volume: number;
  history: Array<{ date: string; close: number }>;
  source: "live" | "synced" | "fallback";
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: Record<string, unknown>;
      timestamp?: number[];
      indicators?: { quote?: Array<{ close?: Array<number | null> }> };
    }>;
  };
};

const fallback: Record<string, Omit<StockSnapshot, "symbol" | "source">> = {
  "RELIANCE.NS": { name: "Reliance Industries", currency: "INR", price: 1432.7, change: 11.4, changePercent: 0.8, previousClose: 1421.3, high: 1442.4, low: 1410.2, volume: 5421800, history: [1386, 1394, 1381, 1402, 1417, 1408, 1421, 1433].map((close, index) => ({ date: `Day ${index + 1}`, close })) },
  "TCS.NS": { name: "Tata Consultancy Services", currency: "INR", price: 3568.2, change: -18.6, changePercent: -0.52, previousClose: 3586.8, high: 3600.5, low: 3547.1, volume: 1293000, history: [3610, 3592, 3605, 3574, 3555, 3581, 3587, 3568].map((close, index) => ({ date: `Day ${index + 1}`, close })) },
  "INFY.NS": { name: "Infosys", currency: "INR", price: 1514.8, change: 9.1, changePercent: 0.6, previousClose: 1505.7, high: 1522.3, low: 1499.6, volume: 4721000, history: [1476, 1488, 1480, 1495, 1508, 1501, 1506, 1515].map((close, index) => ({ date: `Day ${index + 1}`, close })) },
};

export async function getStockSnapshot(symbol: string): Promise<StockSnapshot> {
  const selectedFallback = fallback[symbol] ?? fallback["RELIANCE.NS"];
  const { data: syncedSnapshot } = await supabase
    .from("stock_snapshots")
    .select("name, currency, price, previous_close, change, change_percent, day_high, day_low, volume")
    .eq("symbol", symbol)
    .maybeSingle();

  if (syncedSnapshot) {
    return {
      symbol,
      name: syncedSnapshot.name,
      currency: syncedSnapshot.currency,
      price: Number(syncedSnapshot.price),
      change: Number(syncedSnapshot.change ?? 0),
      changePercent: Number(syncedSnapshot.change_percent ?? 0),
      previousClose: Number(syncedSnapshot.previous_close ?? syncedSnapshot.price),
      high: Number(syncedSnapshot.day_high ?? syncedSnapshot.price),
      low: Number(syncedSnapshot.day_low ?? syncedSnapshot.price),
      volume: Number(syncedSnapshot.volume ?? 0),
      history: selectedFallback.history,
      source: "synced",
    };
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Market data unavailable");
    const payload = (await response.json()) as YahooChartResponse;
    const result = payload.chart?.result?.[0];
    const meta = result?.meta;
    const closes = result?.indicators?.quote?.[0]?.close;
    if (!meta || !closes?.length) throw new Error("Incomplete market data");

    const history = (result.timestamp ?? []).flatMap((timestamp, index) => {
      const close = closes[index];
      return typeof close === "number" ? [{ date: new Date(timestamp * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short" }), close: Number(close.toFixed(2)) }] : [];
    });
    const price = Number(meta.regularMarketPrice ?? history.at(-1)?.close);
    const previousClose = Number(meta.previousClose ?? price);
    if (!Number.isFinite(price)) throw new Error("Missing price");
    const change = price - previousClose;
    return {
      symbol,
      name: String(meta.longName ?? meta.shortName ?? selectedFallback.name),
      currency: String(meta.currency ?? "INR"),
      price,
      change,
      changePercent: previousClose ? (change / previousClose) * 100 : 0,
      previousClose,
      high: Number(meta.regularMarketDayHigh ?? price),
      low: Number(meta.regularMarketDayLow ?? price),
      volume: Number(meta.regularMarketVolume ?? 0),
      history,
      source: "live",
    };
  } catch {
    return { symbol, ...selectedFallback, source: "fallback" };
  }
}
import { supabase } from "@/lib/supabase/client";
