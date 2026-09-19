# Stock Auto Sync

The server syncs a curated NSE watchlist from Yahoo Finance's public chart endpoint into Supabase. It is intended for display/research data, not trade execution or tick-level pricing.

## One-time setup

1. Run [Stock-Schema.sql](./Stock-Schema.sql) in Supabase SQL Editor.
2. Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `IPO_SYNC_TOKEN` as deployment secrets. The existing sync token is reused.
3. Schedule a `POST` request to `https://<your-domain>/api/stock-sync` with header `x-sync-token: <IPO_SYNC_TOKEN>` every 15–30 minutes during market hours.

## Manual use

A signed-in Super Admin can call the same endpoint with a Supabase bearer token instead of the sync token.

The initial list is Reliance, TCS, Infosys, HDFC Bank, ICICI Bank, SBI, ITC, and Bharti Airtel. Change the `symbols` constant in `src/lib/stock-feed.ts` to curate the list.

Free sources can be delayed, rate-limited, or changed without notice. Always show the `synced_at` time and retain a market-data disclaimer.
