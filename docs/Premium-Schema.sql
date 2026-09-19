-- Run this in Supabase SQL Editor before enabling premium access.
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('active', 'cancelled', 'expired', 'past_due')),
  plan_name text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can view their own subscription"
  on public.subscriptions for select to authenticated
  using (auth.uid() = user_id);

create policy "Super admins manage subscriptions"
  on public.subscriptions for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'));

-- Example: grant a user premium access for one year.
-- insert into public.subscriptions (user_id, status, plan_name, current_period_end)
-- values ('USER_UUID', 'active', 'Annual', now() + interval '1 year');
