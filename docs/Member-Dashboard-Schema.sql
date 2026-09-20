-- Signed-in member dashboard: official Bulk/Block Deal records and personal saved items.
-- Run this in the Supabase SQL Editor. Import only official exchange reports or a licensed feed.

create table if not exists public.market_deals (
  id uuid primary key default gen_random_uuid(),
  exchange text not null check (exchange in ('NSE', 'BSE')),
  deal_type text not null check (deal_type in ('bulk', 'block')),
  trade_date date not null,
  symbol text,
  security_name text not null,
  client_name text,
  side text check (side in ('buy', 'sell')),
  quantity numeric check (quantity is null or quantity >= 0),
  trade_price numeric check (trade_price is null or trade_price >= 0),
  source_url text not null,
  source_published_at timestamptz,
  imported_at timestamptz not null default now()
);

create index if not exists market_deals_trade_date_idx on public.market_deals (trade_date desc);
create index if not exists market_deals_symbol_idx on public.market_deals (symbol);
create index if not exists market_deals_deal_type_idx on public.market_deals (deal_type);

create table if not exists public.user_saved_market_deals (
  user_id uuid not null references auth.users(id) on delete cascade,
  deal_id uuid not null references public.market_deals(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, deal_id)
);

create table if not exists public.user_stock_watchlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, symbol)
);

alter table public.market_deals enable row level security;
alter table public.user_saved_market_deals enable row level security;
alter table public.user_stock_watchlist enable row level security;

drop policy if exists "Authenticated users can read market deals" on public.market_deals;
drop policy if exists "Users can read their saved market deals" on public.user_saved_market_deals;
drop policy if exists "Users can save market deals" on public.user_saved_market_deals;
drop policy if exists "Users can remove their saved market deals" on public.user_saved_market_deals;
drop policy if exists "Users can read their stock watchlist" on public.user_stock_watchlist;
drop policy if exists "Users can add stocks to their watchlist" on public.user_stock_watchlist;
drop policy if exists "Users can remove stocks from their watchlist" on public.user_stock_watchlist;

create policy "Authenticated users can read market deals"
  on public.market_deals for select to authenticated using (true);

create policy "Users can read their saved market deals"
  on public.user_saved_market_deals for select to authenticated using (auth.uid() = user_id);

create policy "Users can save market deals"
  on public.user_saved_market_deals for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can remove their saved market deals"
  on public.user_saved_market_deals for delete to authenticated using (auth.uid() = user_id);

create policy "Users can read their stock watchlist"
  on public.user_stock_watchlist for select to authenticated using (auth.uid() = user_id);

create policy "Users can add stocks to their watchlist"
  on public.user_stock_watchlist for insert to authenticated with check (auth.uid() = user_id);

create policy "Users can remove stocks from their watchlist"
  on public.user_stock_watchlist for delete to authenticated using (auth.uid() = user_id);

-- Use the service role only in a trusted server/Worker to import official records.
-- Keep source_url and source_published_at for each import for compliance and auditability.
