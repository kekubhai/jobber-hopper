create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null,
  job_url text not null,
  domain text not null,
  platform text not null default 'generic',
  company text not null default '',
  role text not null default '',
  status text not null default 'draft'
    check (status in ('draft', 'applied', 'interview', 'offer', 'rejected', 'withdrawn')),
  first_filled_at timestamptz not null default timezone('utc', now()),
  last_filled_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint job_applications_profile_job_url_key unique (profile_id, job_url)
);

create index if not exists job_applications_profile_updated_idx
  on public.job_applications (profile_id, updated_at desc);

create index if not exists job_applications_platform_idx
  on public.job_applications (platform, last_filled_at desc);

create or replace function public.set_job_applications_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists trg_job_applications_updated_at on public.job_applications;

create trigger trg_job_applications_updated_at
before update on public.job_applications
for each row
execute procedure public.set_job_applications_updated_at();

alter table public.job_applications enable row level security;
