# IPO Auto Sync Setup

This project now includes a secure server endpoint:

- `POST /api/ipo-sync`
- `POST /api/ipo-sync-manual`
- `GET /api/ipo-sync-health`

It pulls IPO data from free market feeds, merges the results, and upserts into `ipo_entries`.

Configured sources:

- Financial Modeling Prep IPO Calendar
- Alpha Vantage IPO Calendar
- Finnhub IPO Calendar

The sync engine deduplicates rows by symbol + company + open date, preserves `my_recommendation`, and keeps existing publish state.

## Security Model

The endpoint requires an `x-sync-token` header that matches runtime secret `IPO_SYNC_TOKEN`.

The manual endpoint requires a logged-in `super_admin` bearer token and is used by the Admin IPO panel.

It also requires runtime secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `IPO_SYNC_TOKEN`

Optional but recommended free-feed keys for fuller data:

- `FMP_API_KEY` default falls back to `demo`
- `ALPHA_VANTAGE_API_KEY`
- `FINNHUB_API_KEY`

`my_recommendation` is preserved during sync so only super admin controls that field.

## 1) Add Runtime Secrets

Set these in your deployment environment (Cloudflare / Nitro runtime env):

- `SUPABASE_URL=<your_supabase_project_url>`
- `SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>`
- `SUPABASE_ANON_KEY=<your_supabase_anon_key>`
- `IPO_SYNC_TOKEN=<long-random-secret>`
- `FMP_API_KEY=<optional_fmp_key_or_demo>`
- `ALPHA_VANTAGE_API_KEY=<optional_alpha_vantage_key>`
- `FINNHUB_API_KEY=<optional_finnhub_key>`

Do not expose service role key in client env (`VITE_*`).

## 2) Set Up Cron Trigger (cron-job.org example)

Create a job:

- Method: `POST`
- URL: `https://<your-domain>/api/ipo-sync`
- Schedule: every 1 hour (or as needed)
- Header: `x-sync-token: <IPO_SYNC_TOKEN>`

Optional start schedule:

- Every day: 07:00 to 20:00 IST
- Interval: 30-60 min

## 2B) Cloudflare Worker Cron Trigger (recommended)

If deployed on Cloudflare Workers, configure a Cron Trigger in the dashboard:

- Cron expression: `*/30 * * * *`

The Worker Cron invokes the deployed Worker `scheduled()` handler directly. It runs IPO, stock and news syncs together, so there is no URL target or header to enter in Cloudflare.

Use health check endpoint before enabling cron:

```powershell
curl -X GET https://<your-domain>/api/ipo-sync-health -H "Authorization: Bearer <super_admin_access_token>"
```

Expected health response includes role + runtime key availability flags.

## 3) Verify

Run once manually from terminal:

```powershell
curl -X POST https://<your-domain>/api/ipo-sync -H "x-sync-token: <IPO_SYNC_TOKEN>"
```

Expected response:

```json
{ "ok": true, "synced": 12, "sources": ["financialmodelingprep", "alphavantage"] }
```

In Super Admin -> IPO section, the `Last Auto Sync Status` card shows:

- last run time
- success/failure
- synced row count
- latest error (if any)

Manual admin sync uses the same backend aggregator and returns the contributing source list in the status banner.

## Notes

- FMP `demo` has strict limits and incomplete coverage; add your own `FMP_API_KEY` for better reliability.
- Alpha Vantage and Finnhub are optional free enrichers. If their keys are absent, sync still runs using whichever sources are available.
- Free APIs can still be delayed or incomplete, so some fields like GMP or subscription may still require admin curation.
- Super admin can still manually edit and publish IPO rows from Admin IPO panel.
