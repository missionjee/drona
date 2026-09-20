-- Run this once in Supabase Dashboard > SQL Editor for project ukoxijpkxmdckamcmczz.
-- The current web app uses the publishable key directly (it does not exchange a
-- Supabase Auth session), so these policies intentionally allow anon access.
-- Restrict them after moving the app to Supabase Auth.

create table if not exists public.global_signals (
  issue_number text primary key,
  strategy text not null,
  predicted_type text,
  confidence numeric,
  status text,
  stake_units text,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.global_signals enable row level security;

drop policy if exists "drona anon read" on public.global_signals;
drop policy if exists "drona anon insert" on public.global_signals;
drop policy if exists "drona anon update" on public.global_signals;
drop policy if exists "drona anon delete" on public.global_signals;

create policy "drona anon read" on public.global_signals for select to anon using (true);
create policy "drona anon insert" on public.global_signals for insert to anon with check (true);
create policy "drona anon update" on public.global_signals for update to anon using (true) with check (true);
create policy "drona anon delete" on public.global_signals for delete to anon using (true);
