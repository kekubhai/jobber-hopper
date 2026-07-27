-- Clerk user ids are strings (user_...), not Supabase auth UUIDs.
alter table public.extension_pairing_codes
  drop constraint if exists extension_pairing_codes_user_id_fkey;

alter table public.extension_pairing_codes
  alter column user_id type text using user_id::text;

alter table public.extension_pairing_codes
  alter column refresh_token drop not null;
