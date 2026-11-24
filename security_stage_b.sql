-- =====================================================================
-- ELZOGHBI — Security Fix #7, Stage B (Supabase SQL)
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
-- Order matters: run PART 1 now. Run PART 2 ONLY AFTER the matching
-- app update (Stage B2) is deployed — the app must stop selecting the
-- 'credentials' and 'password' columns before they are revoked,
-- otherwise login breaks.
-- =====================================================================

-- ---------------------------------------------------------------------
-- PART 1 — Server-side login verification functions (safe to run now;
-- they change nothing about how the current app works)
-- ---------------------------------------------------------------------

-- 1a) Admin login check: compares against site_settings.credentials
--     on the server, so the app never needs to download the credentials.
create or replace function public.verify_admin_login(p_username text, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  creds jsonb;
begin
  select credentials into creds from public.site_settings limit 1;
  if creds is null then
    return false;
  end if;
  return lower(trim(coalesce(creds->>'username', ''))) = lower(trim(coalesce(p_username, '')))
     and coalesce(creds->>'password', '') = coalesce(p_password, '');
end;
$$;

revoke all on function public.verify_admin_login(text, text) from public;
grant execute on function public.verify_admin_login(text, text) to anon, authenticated;

-- 1b) Customer login check: returns the customer's own row WITHOUT the
--     password column, so the app never downloads the clients table
--     (or anyone's password) to sign a customer in.
create or replace function public.client_login(p_phone text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.clients%rowtype;
begin
  select * into rec
    from public.clients
   where regexp_replace(coalesce(phone, ''), '\D', '', 'g') = regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')
     and coalesce(password, '') = coalesce(p_password, '')
   limit 1;
  if not found then
    return null;
  end if;
  return (to_jsonb(rec) - 'password');
end;
$$;

revoke all on function public.client_login(text, text) from public;
grant execute on function public.client_login(text, text) to anon, authenticated;

-- ---------------------------------------------------------------------
-- PART 2 — Lock the exposed columns (ONLY after Stage B2 app deploy)
-- ---------------------------------------------------------------------
-- revoke select (credentials) on public.site_settings from anon;
-- revoke select (password)    on public.clients      from anon;
--
-- Rollback if anything breaks:
-- grant select (credentials) on public.site_settings to anon;
-- grant select (password)    on public.clients      to anon;
--
-- NOTE: after revoking SELECT on site_settings.credentials, test the
-- dashboard "change admin password" flow. If saving the new password
-- fails (PostgREST updates usually return the row, which needs SELECT),
-- password changes move to a security-definer RPC as well — ask Muse
-- for admin_change_credentials() before revoking.
-- =====================================================================
