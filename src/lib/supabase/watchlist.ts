import { supabase } from "./client";

export async function getWatchlistSymbols(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("user_stock_watchlist").select("symbol").eq("user_id", userId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => String(row.symbol));
}

export async function addWatchlistSymbol(userId: string, symbol: string): Promise<void> {
  const { error } = await supabase.from("user_stock_watchlist").upsert({ user_id: userId, symbol });
  if (error) throw error;
}

export async function removeWatchlistSymbol(userId: string, symbol: string): Promise<void> {
  const { error } = await supabase.from("user_stock_watchlist").delete().eq("user_id", userId).eq("symbol", symbol);
  if (error) throw error;
}
