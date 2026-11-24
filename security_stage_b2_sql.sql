-- =====================================================================
-- ELZOGHBI — Security Fix #7, Stage B2.1 (small follow-up SQL)
-- Run in Supabase → SQL Editor, same as Part 1. Safe to run any time:
-- it only widens client_login so the login identifier can be a phone
-- number OR an email (the storefront login accepts both).
-- =====================================================================
create or replace function public.client_login(p_phone text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.clients%rowtype;
begin
  if coalesce(trim(p_phone), '') = '' then
    return null;
  end if;
  select * into rec
    from public.clients
   where (
           regexp_replace(coalesce(phone, ''), '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
           or lower(trim(coalesce(email, ''))) = lower(trim(p_phone))
         )
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
