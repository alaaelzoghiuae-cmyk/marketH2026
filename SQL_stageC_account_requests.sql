-- =====================================================================
-- ELZOGHBI — Stage C: lock account_requests passwords (item #3)
-- Run this in Supabase SQL Editor AFTER deploying the final code build.
-- What it does:
--   1) Creates admin_account_request_passwords(p_username, p_password):
--      a security-definer function that returns the requested passwords
--      ONLY when the supplied admin credentials match site_settings.
--   2) Revokes table-level SELECT on public.account_requests from
--      anon + authenticated, then grants SELECT back on every column
--      EXCEPT password and requested_password.
-- INSERT/UPDATE/DELETE grants are NOT touched, so customer registration
-- (which inserts a new request incl. its requested password) keeps
-- working exactly as today, and the admin keeps full control.
-- =====================================================================

-- Step 1: gated function (same verification pattern as admin_client_passwords)
create or replace function public.admin_account_request_passwords(p_username text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  creds jsonb;
  result jsonb;
begin
  select credentials into creds from public.site_settings where id = 'main';
  if creds is null
     or lower(trim(coalesce(creds->>'username', ''))) <> lower(trim(coalesce(p_username, '')))
     or coalesce(creds->>'password', '') <> coalesce(p_password, '') then
    return null;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'requested_password', requested_password)), '[]'::jsonb)
    into result
    from public.account_requests;
  return result;
end;
$$;

revoke all on function public.admin_account_request_passwords(text, text) from public;
grant execute on function public.admin_account_request_passwords(text, text) to anon, authenticated;

-- Step 2: SELECT lock with dynamic grant-back (safe even if one of the
-- two password columns does not exist in your table)
do $$
declare
  cols text;
begin
  select string_agg(quote_ident(column_name), ', ')
    into cols
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'account_requests'
     and column_name not in ('password', 'requested_password');

  execute 'revoke select on table public.account_requests from anon, authenticated';
  execute format('grant select (%s) on table public.account_requests to anon, authenticated', cols);
end $$;

-- Step 3: verify (run these two lines separately after the steps above)
-- 3a) With the PUBLIC key (REST), this must now FAIL with 42501:
--     GET /rest/v1/account_requests?select=requested_password
-- 3b) This must still return 200 with the normal columns:
--     GET /rest/v1/account_requests?select=id,name,phone,status
-- 3c) In the dashboard (signed in as admin), open Account Requests:
--     the requested password must still be visible on each request,
--     and approving a request must create the client with that password.
