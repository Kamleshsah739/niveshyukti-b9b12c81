import { supabase } from "./client";

export type ScreenerStock = {
  symbol: string;
  name: string;
  exchange: string;
  price: number;
  changePercent: number | null;
  volume: number | null;
  syncedAt: string | null;
  sector: string | null;
  marketCap: number | null;
  peRatio: number | null;
  pbRatio: number | null;
  roePercent: number | null;
  rocePercent: number | null;
  debtToEquity: number | null;
  dividendYieldPercent: number | null;
  revenueGrowthPercent: number | null;
  profitGrowthPercent: number | null;
  rsi14: number | null;
  sma50: number | null;
  sma200: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  fundamentalsAsOf: string | null;
};

const numberOrNull = (value: unknown): number | null => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export async function getScreenerStocks(): Promise<ScreenerStock[]> {
  const [snapshotsResult, metricsResult] = await Promise.all([
    supabase
      .from("stock_snapshots")
      .select("symbol, name, exchange, price, change_percent, volume, synced_at")
      .eq("exchange", "NSE")
      .order("symbol"),
    supabase.from("stock_screener_metrics").select("*"),
  ]);

  if (snapshotsResult.error) throw snapshotsResult.error;
  if (metricsResult.error) throw metricsResult.error;

  const metricsBySymbol = new Map((metricsResult.data ?? []).map((metric) => [metric.symbol, metric]));
  return (snapshotsResult.data ?? []).map((snapshot) => {
    const metric = metricsBySymbol.get(snapshot.symbol) ?? {};
    return {
      symbol: snapshot.symbol,
      name: snapshot.name,
      exchange: snapshot.exchange,
      price: numberOrNull(snapshot.price) ?? 0,
      changePercent: numberOrNull(snapshot.change_percent),
      volume: numberOrNull(snapshot.volume),
      syncedAt: snapshot.synced_at,
      sector: typeof metric.sector === "string" ? metric.sector : null,
      marketCap: numberOrNull(metric.market_cap),
      peRatio: numberOrNull(metric.pe_ratio),
      pbRatio: numberOrNull(metric.pb_ratio),
      roePercent: numberOrNull(metric.roe_percent),
      rocePercent: numberOrNull(metric.roce_percent),
      debtToEquity: numberOrNull(metric.debt_to_equity),
      dividendYieldPercent: numberOrNull(metric.dividend_yield_percent),
      revenueGrowthPercent: numberOrNull(metric.revenue_growth_percent),
      profitGrowthPercent: numberOrNull(metric.profit_growth_percent),
      rsi14: numberOrNull(metric.rsi_14),
      sma50: numberOrNull(metric.sma_50),
      sma200: numberOrNull(metric.sma_200),
      fiftyTwoWeekHigh: numberOrNull(metric.fifty_two_week_high),
      fiftyTwoWeekLow: numberOrNull(metric.fifty_two_week_low),
      fundamentalsAsOf: typeof metric.fundamentals_as_of === "string" ? metric.fundamentals_as_of : null,
    };
  });
}
