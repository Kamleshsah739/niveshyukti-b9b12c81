import { createClient } from "@supabase/supabase-js";

type Runtime = Record<string, unknown>;

type FeedItem = {
  title: string;
  summary: string | null;
  source_name: string | null;
  source_url: string;
  category: string;
  published_at: string | null;
};

const defaultFeeds = [
  "https://news.google.com/rss/search?q=Indian%20stock%20market%20when%3A1d&hl=en-IN&gl=IN&ceid=IN%3Aen",
  "https://news.google.com/rss/search?q=India%20IPO%20when%3A7d&hl=en-IN&gl=IN&ceid=IN%3Aen",
];

function value(runtime: Runtime, key: string): string | null {
  const candidate = runtime[key] ?? (runtime.env as Record<string, unknown> | undefined)?.[key] ?? (typeof process !== "undefined" ? process.env[key] : undefined);
  return typeof candidate === "string" && candidate.trim() ? candidate.trim() : null;
}

function decodeXml(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function tag(block: string, name: string): string | null {
  const match = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${name}>`, "i"));
  return match?.[1] ? decodeXml(match[1]).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || null : null;
}

function parseRss(xml: string, category: string): FeedItem[] {
  return Array.from(xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi)).flatMap((match) => {
    const item = match[1];
    const title = tag(item, "title");
    const source_url = tag(item, "link");
    if (!title || !source_url || !source_url.startsWith("http")) return [];
    const date = tag(item, "pubDate");
    const parsedDate = date && !Number.isNaN(Date.parse(date)) ? new Date(date).toISOString() : null;
    return [{
      title,
      source_url,
      summary: tag(item, "description"),
      source_name: tag(item, "source"),
      category,
      published_at: parsedDate,
    }];
  });
}

export async function runNewsFeedSync(runtime: Runtime) {
  const url = value(runtime, "SUPABASE_URL") ?? value(runtime, "VITE_SUPABASE_URL");
  const key = value(runtime, "SUPABASE_SERVICE_ROLE_KEY") ?? value(runtime, "SUPABASE_SERVICE_KEY");
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY runtime secret.");

  const configured = value(runtime, "MARKET_NEWS_RSS_URLS");
  const feeds = configured ? configured.split(",").map((entry) => entry.trim()).filter(Boolean) : defaultFeeds;
  const payloads = await Promise.all(feeds.map(async (feed) => {
    const response = await fetch(feed, { headers: { Accept: "application/rss+xml, application/xml, text/xml" } });
    if (!response.ok) throw new Error(`News feed request failed (${response.status})`);
    return { feed, xml: await response.text() };
  }));

  const items = payloads.flatMap(({ feed, xml }) => parseRss(xml, /ipo/i.test(feed) ? "IPO" : "Markets"));
  const deduped = Array.from(new Map(items.map((item) => [item.source_url, item])).values()).slice(0, 40);
  if (deduped.length === 0) return { synced: 0, feeds: feeds.length };

  const db = createClient(url, key);
  const { data: existing, error: existingError } = await db.from("market_news").select("source_url,published,featured").in("source_url", deduped.map((item) => item.source_url));
  if (existingError) throw existingError;
  const existingByUrl = new Map((existing ?? []).map((item) => [item.source_url, item]));
  const now = new Date().toISOString();
  const rows = deduped.map((item) => {
    const current = existingByUrl.get(item.source_url);
    return { ...item, published: current?.published ?? true, featured: current?.featured ?? false, synced_at: now, updated_at: now };
  });
  const { error } = await db.from("market_news").upsert(rows, { onConflict: "source_url" });
  if (error) throw error;
  return { synced: rows.length, feeds: feeds.length };
}
