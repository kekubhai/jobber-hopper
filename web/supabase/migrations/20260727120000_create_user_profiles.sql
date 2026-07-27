-- App account row per auth user (metadata + link to master profile data).

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text not null default '',
  avatar_url text,
  master_profile_id uuid references public.master_profiles (id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_profiles_master_profile_id_idx
  on public.user_profiles (master_profile_id);

alter table public.master_profiles
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

create unique index if not exists master_profiles_user_id_key
  on public.master_profiles (user_id)
  where user_id is not null;

create or replace function public.set_user_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;

create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row
execute procedure public.set_user_profiles_updated_at();

alter table public.user_profiles enable row level security;

create policy "user_profiles_select_own"
  on public.user_profiles
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_profiles_insert_own"
  on public.user_profiles
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_profiles_update_own"
  on public.user_profiles
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "master_profiles_select_own"
  on public.master_profiles
  for select
  to authenticated
  using (user_id is not null and auth.uid() = user_id);

create policy "master_profiles_insert_own"
  on public.master_profiles
  for insert
  to authenticated
  with check (user_id is not null and auth.uid() = user_id);

create policy "master_profiles_update_own"
  on public.master_profiles
  for update
  to authenticated
  using (user_id is not null and auth.uid() = user_id)
  with check (user_id is not null and auth.uid() = user_id);

create policy "master_profiles_delete_own"
  on public.master_profiles
  for delete
  to authenticated
  using (user_id is not null and auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (user_id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (user_id) do update
  set
    email = excluded.email,
    display_name = case
      when excluded.display_name <> '' then excluded.display_name
      else public.user_profiles.display_name
    end,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();
