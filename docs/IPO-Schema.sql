-- Run in Supabase SQL editor.
-- Creates IPO table used by website, app dashboard, and super-admin panel.

create table if not exists public.ipo_entries (
  id uuid primary key default gen_random_uuid(),
  source_key text unique,
  company_name text not null,
  symbol text,
  issue_open_date date,
  issue_close_date date,
  listing_date date,
  price_band text,
  lot_size text,
  issue_size text,
  gmp text,
  merchant_banker text,
  anchor_investors text,
  subscription text,
  status text check (status in ('upcoming', 'open', 'closed', 'listed')) default 'upcoming',
  source_name text,
  external_url text,
  summary text,
  my_recommendation text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ipo_sync_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'cron',
  status text not null check (status in ('success', 'failure')),
  synced_count integer not null default 0,
  error_message text,
  ran_at timestamptz not null default now()
);

create index if not exists idx_ipo_entries_published on public.ipo_entries(published);
create index if not exists idx_ipo_entries_open_date on public.ipo_entries(issue_open_date);
create index if not exists idx_ipo_entries_source_name on public.ipo_entries(source_name);
create index if not exists idx_ipo_sync_runs_ran_at on public.ipo_sync_runs(ran_at desc);

alter table public.ipo_entries enable row level security;
alter table public.ipo_sync_runs enable row level security;

-- Ensure baseline privileges exist; RLS policies still enforce row-level access.
grant usage on schema public to anon, authenticated;
grant select on public.ipo_entries to anon;
grant select, insert, update, delete on public.ipo_entries to authenticated;
grant select on public.ipo_sync_runs to authenticated;
grant insert on public.ipo_sync_runs to authenticated;

-- Public users can read only published IPO entries.
drop policy if exists "Public read published IPO" on public.ipo_entries;
create policy "Public read published IPO"
on public.ipo_entries
for select
using (published = true);

-- Authenticated users can also read published rows.
drop policy if exists "Authenticated read published IPO" on public.ipo_entries;
create policy "Authenticated read published IPO"
on public.ipo_entries
for select
to authenticated
using (published = true);

-- Super admin full access based on profiles.role.
drop policy if exists "Super admin full IPO access" on public.ipo_entries;
create policy "Super admin full IPO access"
on public.ipo_entries
for all
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
  )
);

-- Public users should not read sync internals.
drop policy if exists "No public IPO sync runs" on public.ipo_sync_runs;
create policy "No public IPO sync runs"
on public.ipo_sync_runs
for select
to anon
using (false);

-- Super admin can view sync logs.
drop policy if exists "Super admin read IPO sync runs" on public.ipo_sync_runs;
create policy "Super admin read IPO sync runs"
on public.ipo_sync_runs
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
  )
);

-- Service role/cron endpoint inserts rows using service role key.
drop policy if exists "Service role insert IPO sync runs" on public.ipo_sync_runs;
create policy "Service role insert IPO sync runs"
on public.ipo_sync_runs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'super_admin'
  )
);
