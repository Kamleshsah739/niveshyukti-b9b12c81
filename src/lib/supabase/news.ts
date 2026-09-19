import { supabase } from "./client";

export interface MarketNewsItem {
  id: string;
  title: string;
  summary: string | null;
  source_name: string | null;
  source_url: string;
  category: string | null;
  published_at: string | null;
  image_url: string | null;
  featured: boolean;
  published: boolean;
}

export async function getPublishedMarketNews(limit = 6): Promise<MarketNewsItem[]> {
  const { data, error } = await supabase
    .from("market_news")
    .select("id,title,summary,source_name,source_url,category,published_at,image_url,featured,published")
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as MarketNewsItem[];
}
