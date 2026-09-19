create table if not exists public.market_news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  source_name text,
  source_url text not null unique,
  category text,
  published_at timestamptz,
  image_url text,
  featured boolean not null default false,
  published boolean not null default true,
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.market_news enable row level security;
create policy "Public can read published market news" on public.market_news for select using (published = true);
create policy "Super admins can manage market news" on public.market_news for all to authenticated using ((select role from public.profiles where id = auth.uid()) = 'super_admin') with check ((select role from public.profiles where id = auth.uid()) = 'super_admin');
