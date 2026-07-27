create extension if not exists pgcrypto;

create table if not exists public.master_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null unique,
  personal jsonb not null default '{}'::jsonb,
  address jsonb not null default '{}'::jsonb,
  education jsonb not null default '[]'::jsonb,
  work_history jsonb not null default '[]'::jsonb,
  custom_qa_pairs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_master_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_master_profiles_updated_at on public.master_profiles;

create trigger trg_master_profiles_updated_at
before update on public.master_profiles
for each row
execute procedure public.set_master_profiles_updated_at();

alter table public.master_profiles enable row level security;

-- For Phase 1 local development, the web server uses service role key.
-- Add user-based RLS policies when auth is enabled in Phase 2.

-- See web/supabase/migrations/20260727120000_create_user_profiles.sql for user_profiles,
-- auth-linked master_profiles.user_id, RLS policies, and signup trigger.
