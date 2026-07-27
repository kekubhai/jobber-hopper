-- Phase 6: cached LLM form → profile schema mappings (per domain + form hash).
create table if not exists public.form_field_mapping_cache (
  id uuid primary key default gen_random_uuid(),
  domain text not null,
  form_hash text not null,
  platform text,
  mappings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint form_field_mapping_cache_domain_hash_key unique (domain, form_hash)
);

create index if not exists form_field_mapping_cache_domain_idx
  on public.form_field_mapping_cache (domain);

create or replace function public.set_form_field_mapping_cache_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_form_field_mapping_cache_updated_at on public.form_field_mapping_cache;

create trigger trg_form_field_mapping_cache_updated_at
before update on public.form_field_mapping_cache
for each row
execute procedure public.set_form_field_mapping_cache_updated_at();

alter table public.form_field_mapping_cache enable row level security;

-- Phase 7: short-lived codes to link extension to Supabase auth session.
create table if not exists public.extension_pairing_codes (
  code text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists extension_pairing_codes_user_id_idx
  on public.extension_pairing_codes (user_id);

alter table public.extension_pairing_codes enable row level security;
