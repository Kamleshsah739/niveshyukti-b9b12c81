# Cloudflare Free Setup

The Cloudflare Workers Free plan is sufficient for this project while traffic is small. It includes 100,000 requests per day and five Cron Triggers.

## 1. Deploy the current build

Deploy the connected branch to Cloudflare. The Worker now includes a native `scheduled()` handler that refreshes stocks, IPOs and market news.

## 2. Add Worker secrets

In **Cloudflare Dashboard → Workers & Pages → your Worker → Settings → Variables and Secrets**, add these as **Secrets** (not plain text variables):

- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role key
- `SUPABASE_ANON_KEY` — Supabase publishable/anon key
- `IPO_SYNC_TOKEN` — a long random secret used for manual sync endpoints

Optional keys for broader IPO coverage:

- `FMP_API_KEY`
- `ALPHA_VANTAGE_API_KEY`
- `FINNHUB_API_KEY`

Optional custom sources:

- `MARKET_NEWS_RSS_URLS` — comma-separated trusted RSS URLs. Leave blank to use the built-in India-market news feeds.

Never add the service-role key with a `VITE_` prefix or expose it in client-side code.

## 3. Add a schedule

In **Settings → Triggers → Cron Triggers**, add:

```
0 * * * *
```

This runs once per hour (UTC). It refreshes market news, stock snapshots and IPO data. Cron schedules use UTC; an hourly job needs no IST conversion.

## 4. Confirm it worked

After the first run, open Supabase → Table Editor → `market_news`. New rows should appear. The website’s News section will display published rows automatically.
