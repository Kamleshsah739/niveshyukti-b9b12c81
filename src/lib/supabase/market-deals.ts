import { supabase } from "./client";

export type DealType = "bulk" | "block";
export type MarketDeal = {
  id: string;
  exchange: "NSE" | "BSE";
  deal_type: DealType;
  trade_date: string;
  symbol: string | null;
  security_name: string;
  client_name: string | null;
  side: "buy" | "sell" | null;
  quantity: number | null;
  trade_price: number | null;
  source_url: string;
  source_published_at: string | null;
  imported_at: string;
};

export async function getMarketDeals(): Promise<MarketDeal[]> {
  const { data, error } = await supabase
    .from("market_deals")
    .select("*")
    .order("trade_date", { ascending: false })
    .order("imported_at", { ascending: false })
    .limit(250);
  if (error) throw error;
  return (data ?? []) as MarketDeal[];
}

export async function getSavedDealIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("user_saved_market_deals")
    .select("deal_id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((row) => String(row.deal_id));
}

export async function saveDeal(userId: string, dealId: string): Promise<void> {
  const { error } = await supabase.from("user_saved_market_deals").upsert({ user_id: userId, deal_id: dealId });
  if (error) throw error;
}

export async function removeSavedDeal(userId: string, dealId: string): Promise<void> {
  const { error } = await supabase.from("user_saved_market_deals").delete().eq("user_id", userId).eq("deal_id", dealId);
  if (error) throw error;
}
