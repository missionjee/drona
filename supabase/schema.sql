-- =========================================================================
-- MISSION JEET / DRONA SUPABASE SCHEMA
-- Project Reference: ukoxijpkxmdckamcmczz
-- Host: https://ukoxijpkxmdckamcmczz.supabase.co
-- =========================================================================

-- 1. USER PROFILES
create table if not exists public.user_profiles (
  email text primary key,
  name text not null,
  stream text not null default 'jee',
  class_level text not null default '12',
  target_college text,
  target_rank text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 2. IMMUTABLE TEST HISTORY & PERFORMANCE MARKS (NO DELETIONS)
create table if not exists public.test_history (
  id text primary key,
  timestamp bigint not null,
  exam_type text not null,
  title text not null,
  total_score numeric not null,
  max_score numeric not null,
  percentage numeric not null,
  accuracy numeric not null,
  predicted_percentile numeric,
  predicted_rank integer,
  total_attempted integer,
  total_correct integer,
  total_incorrect integer,
  total_unattempted integer,
  time_spent_seconds integer,
  subject_scores jsonb,
  weak_chapters text[],
  strong_chapters text[],
  ai_recommendations text[],
  proctor_strikes integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. STUDY NOTES & FORMULA CHEATSHEETS
create table if not exists public.study_notes (
  id text primary key,
  title text not null,
  subject text not null,
  content text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS)
alter table public.user_profiles enable row level security;
alter table public.test_history enable row level security;
alter table public.study_notes enable row level security;

-- Anon Policies for Direct App Deck Interaction
create policy if not exists "Allow anon read/write on user_profiles"
  on public.user_profiles for all using (true) with check (true);

create policy if not exists "Allow anon read/insert on test_history"
  on public.test_history for all using (true) with check (true);

create policy if not exists "Allow anon read/write on study_notes"
  on public.study_notes for all using (true) with check (true);
