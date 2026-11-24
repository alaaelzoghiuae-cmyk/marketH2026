-- =====================================================================
-- ELZOGHBI — Fix: admin settings saves reverting after refresh
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- WHY: After the security fix #7 column lock, the public key can no
-- longer write the site_settings.credentials column. The app was still
-- including `credentials` in every settings upsert, so PostgREST
-- rejected the WHOLE upsert (42501) — every dashboard edit made while
-- logged in as admin (announcements, loyalty flags, store settings)
-- silently failed to save and reverted on refresh.
--
-- The app update removes `credentials` from all settings upserts.
-- This function is the new, gated way to change the admin username /
-- password: it verifies the CURRENT credentials on the server before
-- updating them, exactly like verify_admin_login / admin_client_passwords.
-- =====================================================================

create or replace function public.admin_update_credentials(
  p_current_username text,
  p_current_password text,
  p_new_username text,
  p_new_password text
)
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
  -- Verify the caller knows the CURRENT credentials.
  if lower(trim(coalesce(creds->>'username', ''))) <> lower(trim(coalesce(p_current_username, '')))
     or coalesce(creds->>'password', '') <> coalesce(p_current_password, '') then
    return false;
  end if;
  if coalesce(trim(p_new_username), '') = '' or coalesce(p_new_password, '') = '' then
    return false;
  end if;
  update public.site_settings
     set credentials = jsonb_build_object('username', trim(p_new_username), 'password', p_new_password),
         updated_at = now()
   where id = (select id from public.site_settings limit 1);
  return true;
end;
$$;

revoke all on function public.admin_update_credentials(text, text, text, text) from public;
grant execute on function public.admin_update_credentials(text, text, text, text) to anon, authenticated;
