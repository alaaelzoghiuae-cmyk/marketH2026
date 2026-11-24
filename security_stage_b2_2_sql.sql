-- =====================================================================
-- ELZOGHBI — Security Fix #7, Stage B2.2 SQL
-- PART A (this function): run any time — before or after the app update.
-- It lets the ADMIN DASHBOARD (and only someone with the real admin
-- username/password) load customer passwords, so the owner keeps full
-- visibility and control exactly as today, while the public storefront
-- no longer receives them.
-- PART B (the lock) is a separate file: security_stage_b_part2_lock.sql
-- — run it ONLY after the B2.2 app update is live and verified.
-- =====================================================================
create or replace function public.admin_client_passwords(p_username text, p_password text)
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
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'password', password)), '[]'::jsonb)
    into result
    from public.clients;
  return result;
end;
$$;

revoke all on function public.admin_client_passwords(text, text) from public;
grant execute on function public.admin_client_passwords(text, text) to anon, authenticated;
