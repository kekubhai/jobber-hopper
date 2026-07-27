-- Optional cleanup: profile data belongs only in master_profiles JSON columns.
-- Safe to run if child tables were created earlier and are unused.

drop table if exists public.master_profile_custom_qa cascade;
drop table if exists public.master_profile_work_history cascade;
drop table if exists public.master_profile_education cascade;
