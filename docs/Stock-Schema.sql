-- Free stock-price snapshots, synced by /api/stock-sync.
create table if not exists public.stock_snapshots (
  symbol text primary key,
  name text not null,
  exchange text not null default 'NSE',
  currency text not null default 'INR',
  price numeric not null,
  previous_close numeric,
  change numeric,
  change_percent numeric,
  day_high numeric,
  day_low numeric,
  volume bigint,
  source text not null,
  synced_at timestamptz not null default now()
);

alter table public.stock_snapshots enable row level security;
create policy "Public can read stock snapshots" on public.stock_snapshots for select using (true);

-- The scheduled Worker writes with the Supabase service_role key.
grant usage on schema public to service_role;
grant select, insert, update on public.stock_snapshots to service_role;
grant select on public.stock_snapshots to anon, authenticated;
