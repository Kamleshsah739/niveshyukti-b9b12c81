# Stock Auto Sync

The server imports the active NSE equity and SME security lists, then syncs a small scheduled batch from Yahoo Finance's public chart endpoint into Supabase. It is intended for display/research data, not trade execution or tick-level pricing.

## One-time setup

1. Run [Stock-Schema.sql](./Stock-Schema.sql) in Supabase SQL Editor.
2. Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `IPO_SYNC_TOKEN` as deployment secrets. The existing sync token is reused.
3. Run `docs/Stock-Universe-Schema.sql` in Supabase SQL Editor.
4. Schedule a `POST` request to `https://<your-domain>/api/stock-sync` with header `x-sync-token: <IPO_SYNC_TOKEN>` every 30 minutes during market hours.

## Manual use

A signed-in Super Admin can call the same endpoint with a Supabase bearer token instead of the sync token.

Each run imports the current official NSE lists and refreshes 12 queued symbols. This deliberately avoids thousands of simultaneous requests to a free source. The first full pass can take several days; a paid/licensed bulk EOD feed is required for rapid, guaranteed full-market coverage.

Free sources can be delayed, rate-limited, or changed without notice. Always show the `synced_at` time and retain a market-data disclaimer.
