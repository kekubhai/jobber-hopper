create table if not exists public.extension_funnel_events (
  id uuid primary key default gen_random_uuid(),
  profile_id text not null,
  session_id text not null,
  event_name text not null
    check (event_name in ('form_detected', 'fields_reviewed', 'autofill_accepted', 'application_submitted')),
  page_url text not null,
  domain text not null,
  platform text not null default 'generic',
  fields_detected integer not null default 0 check (fields_detected >= 0),
  fields_matched integer not null default 0 check (fields_matched >= 0),
  fields_safe integer not null default 0 check (fields_safe >= 0),
  fields_filled integer not null default 0 check (fields_filled >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  constraint extension_funnel_events_session_page_event_key
    unique (session_id, page_url, event_name)
);

create index if not exists extension_funnel_events_profile_created_idx
  on public.extension_funnel_events (profile_id, created_at desc);

create index if not exists extension_funnel_events_platform_created_idx
  on public.extension_funnel_events (platform, created_at desc);

alter table public.extension_funnel_events enable row level security;
