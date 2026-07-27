-- Clerk sign-in/sign-up metadata mirrored in Supabase (service role writes).

create table if not exists public.clerk_user_profiles (
  clerk_user_id text primary key,
  email text,
  display_name text not null default '',
  avatar_url text,
  master_profile_id uuid references public.master_profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists clerk_user_profiles_email_idx
  on public.clerk_user_profiles (email);

alter table public.master_profiles
  add column if not exists clerk_user_id text;

create unique index if not exists master_profiles_clerk_user_id_key
  on public.master_profiles (clerk_user_id)
  where clerk_user_id is not null;

create or replace function public.set_clerk_user_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_clerk_user_profiles_updated_at on public.clerk_user_profiles;

create trigger trg_clerk_user_profiles_updated_at
before update on public.clerk_user_profiles
for each row
execute procedure public.set_clerk_user_profiles_updated_at();

alter table public.clerk_user_profiles enable row level security;
