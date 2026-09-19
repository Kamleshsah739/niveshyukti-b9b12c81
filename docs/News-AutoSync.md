# Market News Auto Sync

1. Run `docs/News-Schema.sql` in the Supabase SQL editor.
2. Set Cloudflare/Nitro runtime secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `IPO_SYNC_TOKEN`.
3. Optional: set `MARKET_NEWS_RSS_URLS` to a comma-separated list of trusted RSS feeds. Without it, the sync uses India-focused Google News RSS queries.
4. Schedule `POST https://<your-domain>/api/news-sync` every 30–60 minutes with header `x-sync-token: <IPO_SYNC_TOKEN>`.

News is published automatically on first sync. A super admin can later unpublish or feature an item directly in Supabase; future syncs preserve those choices.
