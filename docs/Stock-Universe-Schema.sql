-- Free NSE universe and sync queue.
-- Run this once in Supabase SQL Editor, after Stock-Schema.sql and Screener-Schema.sql.
-- The Worker imports NSE's official equity and SME symbol lists automatically.

create table if not exists public.stock_universe (
  symbol text primary key,
  name text not null,
  exchange text not null default 'NSE',
  series text,
  active boolean not null default true,
  source text not null default 'nse_security_list',
  listed_at timestamptz,
  last_synced_at timestamptz,
  last_error text
);

alter table public.stock_universe enable row level security;

drop policy if exists "Public can read stock universe" on public.stock_universe;
create policy "Public can read stock universe"
  on public.stock_universe for select using (true);

grant usage on schema public to service_role;
grant select, insert, update on public.stock_universe to service_role;
grant select on public.stock_universe to anon, authenticated;
