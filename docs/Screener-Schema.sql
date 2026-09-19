-- Phase 1: end-of-day Indian stock screener.
-- Run this after Stock-Schema.sql in the Supabase SQL Editor.

create table if not exists public.stock_screener_metrics (
  symbol text primary key references public.stock_snapshots(symbol) on delete cascade,
  sector text,
  industry text,
  market_cap numeric,
  pe_ratio numeric,
  pb_ratio numeric,
  roe_percent numeric,
  roce_percent numeric,
  debt_to_equity numeric,
  dividend_yield_percent numeric,
  revenue_growth_percent numeric,
  profit_growth_percent numeric,
  rsi_14 numeric,
  sma_50 numeric,
  sma_200 numeric,
  fifty_two_week_high numeric,
  fifty_two_week_low numeric,
  fundamentals_as_of date,
  source text not null default 'manual_or_licensed_feed',
  synced_at timestamptz not null default now()
);

alter table public.stock_screener_metrics enable row level security;

create policy "Public can read stock screener metrics"
  on public.stock_screener_metrics for select using (true);

-- Import/update metrics using your licensed or permitted EOD provider.
-- Store symbols exactly as in stock_snapshots, for example RELIANCE.NS.
