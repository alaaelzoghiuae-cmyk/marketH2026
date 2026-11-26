-- ============================================================================
-- ELZOGHBI — Stage D (Security Phase 3): RLS for customer-data tables
-- ----------------------------------------------------------------------------
-- Covers the tables that SQL 09 deliberately left open (orders, clients,
-- complaints, returns_list, account_requests, sourcing_requests, price_alerts):
-- customers write with the public anon key and customer login is custom
-- (RPC-based, not Supabase Auth), so these tables are closed by routing every
-- privileged read/write through the security-definer RPCs below instead:
--
--   * Visitors (anon key) can only INSERT new rows where the storefront needs
--     it (new order / complaint / return / sourcing request / account
--     request / price alert). They can no longer SELECT, UPDATE or DELETE
--     anything in these tables.
--   * The dashboard keeps full access through gated_rows / gated_upsert /
--     gated_patch / gated_delete, authenticated by ANY existing admin mode:
--       - the owner credentials (verify_admin_login pattern),
--       - an RBAC employee account (admin_users, SQL 04, permission-checked),
--       - a Supabase Auth admin session (admin_profiles, SQL 07 — the RPC
--         reuses public.admin_has_permission() when called with the JWT).
--   * Logged-in customers keep access to THEIR OWN rows through client_rows
--     and client-mode gated_upsert (own complaints / returns / sourcing /
--     profile), authenticated with their client id + password (the same
--     credentials client_login already verifies).
--
-- RUN ORDER: deploy the app version that calls these RPCs FIRST (it falls
-- back to direct table access while the RPCs do not exist yet), then run
-- this file in the Supabase SQL Editor.
--
-- HOW TO TEST after running (replace <ANON_KEY> with the publishable key):
--   curl "https://pomuumsgsujcgvamaxmr.supabase.co/rest/v1/orders?select=id&limit=3" \
--     -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>"
--   -> must return [] (before this file it returned real orders).
--   curl "https://pomuumsgsujcgvamaxmr.supabase.co/rest/v1/clients?select=id&limit=3" \
--     -H "apikey: <ANON_KEY>" -H "Authorization: Bearer <ANON_KEY>"
--   -> must return [].
--   Then open the dashboard, log in, and confirm orders/clients load and an
--   order status change saves (those go through the RPCs).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) Auth helpers
-- ---------------------------------------------------------------------------
create or replace function public._gated_table_perm(p_table text)
returns text language sql immutable as $$
  select case p_table
    when 'orders' then 'orders'
    when 'complaints' then 'returns'
    when 'returns_list' then 'returns'
    when 'sourcing_requests' then 'sourcing'
    when 'account_requests' then 'clients'
    when 'clients' then 'clients'
    when 'price_alerts' then 'karambo'
    when 'guide_phones' then 'karambo'
    else null end;
$$;

create or replace function public._gated_admin_auth(p_username text, p_password text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  creds jsonb;
  u public.admin_users%rowtype;
begin
  -- (a) Supabase Auth admin session (SQL 07): the caller sent its JWT.
  if auth.uid() is not null and to_regclass('public.admin_profiles') is not null then
    if public.is_admin() then
      return jsonb_build_object('ok', true, 'jwt', true);
    end if;
  end if;

  if coalesce(trim(p_username), '') = '' or coalesce(p_password, '') = '' then
    return null;
  end if;

  -- (b) Owner credentials (same check as admin_client_passwords).
  select credentials into creds from public.site_settings where id = 'main';
  if creds is not null
     and lower(trim(coalesce(creds->>'username', ''))) = lower(trim(p_username))
     and coalesce(creds->>'password', '') = p_password then
    return jsonb_build_object('ok', true, 'is_owner', true, 'permissions', null);
  end if;

  -- (c) RBAC employee (SQL 04).
  if to_regclass('public.admin_users') is not null then
    select * into u from public.admin_users
     where lower(username) = lower(trim(p_username)) and is_active
     limit 1;
    if found and public._admin_hash_pw(u.pass_salt, p_password) = u.pass_hash then
      return jsonb_build_object('ok', true, 'is_owner', false, 'permissions', u.permissions);
    end if;
  end if;

  return null;
end;
$$;

create or replace function public._gated_can(p_auth jsonb, p_table text)
returns boolean language plpgsql security definer set search_path = public as $$
declare perm text;
begin
  if p_auth is null or coalesce((p_auth->>'ok')::boolean, false) is not true then
    return false;
  end if;
  if coalesce((p_auth->>'is_owner')::boolean, false) then return true; end if;
  perm := public._gated_table_perm(p_table);
  if perm is null then return false; end if;
  if coalesce((p_auth->>'jwt')::boolean, false) then
    -- Reuse the phase-1 permission model (owner/admin roles pass inside it).
    return public.admin_has_permission(perm);
  end if;
  return coalesce((p_auth->'permissions') @> jsonb_build_array(perm), false);
end;
$$;

create or replace function public._gated_client_auth(p_client_id text, p_password text)
returns boolean language plpgsql security definer set search_path = public as $$
declare c public.clients%rowtype;
begin
  if coalesce(trim(p_client_id), '') = '' or coalesce(p_password, '') = '' then
    return false;
  end if;
  select * into c from public.clients where id = p_client_id limit 1;
  return found and coalesce(c.password, '') = p_password;
end;
$$;

-- ---------------------------------------------------------------------------
-- 2) Internal upsert over a full row (jsonb_populate_record keeps column
--    types correct and ignores keys that are not real columns).
-- ---------------------------------------------------------------------------
create or replace function public._gated_upsert_record(p_table text, p_row jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
declare upd text;
begin
  select string_agg(quote_ident(column_name) || ' = excluded.' || quote_ident(column_name), ', ')
    into upd
    from information_schema.columns
   where table_schema = 'public' and table_name = p_table and column_name <> 'id';
  if upd is null then return false; end if;
  execute format(
    'insert into public.%I select * from jsonb_populate_record(null::public.%I, $1)
     on conflict (id) do update set %s', p_table, p_table, upd)
    using p_row;
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3) Public RPCs used by the app
-- ---------------------------------------------------------------------------
create or replace function public.gated_rows(
  p_username text, p_password text, p_table text,
  p_limit int default 500, p_offset int default 0)
returns jsonb language plpgsql security definer set search_path = public as $$
declare auth jsonb; result jsonb;
begin
  if public._gated_table_perm(p_table) is null then return null; end if;
  auth := public._gated_admin_auth(p_username, p_password);
  if not public._gated_can(auth, p_table) then return null; end if;
  execute format(
    'select coalesce(jsonb_agg(t), ''[]''::jsonb)
       from (select * from public.%I order by created_at desc limit $1 offset $2) t', p_table)
    into result
    using greatest(1, least(coalesce(p_limit, 500), 2000)), greatest(0, coalesce(p_offset, 0));
  return result;
end;
$$;

create or replace function public.client_rows(
  p_client_id text, p_password text, p_table text, p_limit int default 200)
returns jsonb language plpgsql security definer set search_path = public as $$
declare result jsonb;
begin
  if p_table not in ('orders', 'complaints', 'returns_list', 'sourcing_requests', 'clients') then
    return null;
  end if;
  if not public._gated_client_auth(p_client_id, p_password) then return null; end if;
  if p_table = 'clients' then
    execute format(
      'select coalesce(jsonb_agg(t), ''[]''::jsonb)
         from (select * from public.%I where id = $1 limit 1) t', p_table)
      into result using p_client_id;
  else
    execute format(
      'select coalesce(jsonb_agg(t), ''[]''::jsonb)
         from (select * from public.%I where client_id = $1 order by created_at desc limit $2) t', p_table)
      into result using p_client_id, greatest(1, least(coalesce(p_limit, 200), 1000));
  end if;
  return result;
end;
$$;

create or replace function public.gated_upsert(
  p_username text, p_password text, p_table text, p_row jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
declare auth jsonb;
begin
  if public._gated_table_perm(p_table) is null then return false; end if;
  if p_row is null or coalesce(p_row->>'id', '') = '' then return false; end if;

  auth := public._gated_admin_auth(p_username, p_password);
  if auth is not null then
    if not public._gated_can(auth, p_table) then return false; end if;
    return public._gated_upsert_record(p_table, p_row);
  end if;

  -- Client mode: own rows only, self-service tables only. Order rows are
  -- created by the anon INSERT policy instead and never updated by clients.
  if p_table = 'clients' then
    if not public._gated_client_auth(p_row->>'id', p_password) then return false; end if;
  elsif p_table in ('complaints', 'returns_list', 'sourcing_requests') then
    if not public._gated_client_auth(p_row->>'client_id', p_password) then return false; end if;
  else
    return false;
  end if;
  return public._gated_upsert_record(p_table, p_row);
end;
$$;

create or replace function public.gated_patch(
  p_username text, p_password text, p_table text, p_id text, p_patch jsonb)
returns boolean language plpgsql security definer set search_path = public as $$
declare auth jsonb; existing jsonb; v_client_id text;
begin
  if public._gated_table_perm(p_table) is null then return false; end if;
  if coalesce(p_id, '') = '' or p_patch is null then return false; end if;
  auth := public._gated_admin_auth(p_username, p_password);
  if auth is not null then
    if not public._gated_can(auth, p_table) then return false; end if;
  else
    -- Client mode: patch own row only (merge over the existing row, so a
    -- partial patch can never null out other columns).
    if p_table = 'clients' then
      if not public._gated_client_auth(p_id, p_password) then return false; end if;
    elsif p_table in ('complaints', 'returns_list', 'sourcing_requests') then
      execute format('select client_id from public.%I where id = $1', p_table) into v_client_id using p_id;
      if v_client_id is null or not public._gated_client_auth(v_client_id, p_password) then return false; end if;
    else
      return false;
    end if;
  end if;
  execute format('select to_jsonb(t) from public.%I t where id = $1', p_table) into existing using p_id;
  if existing is null then return false; end if;
  return public._gated_upsert_record(p_table, existing || p_patch);
end;
$$;

create or replace function public.gated_delete(
  p_username text, p_password text, p_table text, p_id text)
returns boolean language plpgsql security definer set search_path = public as $$
declare auth jsonb;
begin
  if public._gated_table_perm(p_table) is null then return false; end if;
  if coalesce(p_id, '') = '' then return false; end if;
  auth := public._gated_admin_auth(p_username, p_password);
  if not public._gated_can(auth, p_table) then return false; end if;
  execute format('delete from public.%I where id = $1', p_table) using p_id;
  return true;
end;
$$;

revoke all on function public._gated_admin_auth(text, text) from public;
revoke all on function public._gated_can(jsonb, text) from public;
revoke all on function public._gated_client_auth(text, text) from public;
revoke all on function public._gated_upsert_record(text, jsonb) from public;
grant execute on function public.gated_rows(text, text, text, int, int) to anon, authenticated;
grant execute on function public.client_rows(text, text, text, int) to anon, authenticated;
grant execute on function public.gated_upsert(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.gated_patch(text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.gated_delete(text, text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) Row Level Security
--    Anon/authenticated keep only the access each table truly needs in
--    public; everything else flows through the RPCs above (security
--    definer, so they bypass RLS after authenticating the caller).
-- ---------------------------------------------------------------------------
do $$
declare t text; pol record;
begin
  foreach t in array array['orders','complaints','returns_list','sourcing_requests',
                           'account_requests','price_alerts','clients','guide_phones'] loop
    if to_regclass('public.'||t) is null then continue; end if;
    execute format('alter table public.%I enable row level security', t);
    for pol in select policyname from pg_policies where schemaname = 'public' and tablename = t loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, t);
    end loop;
  end loop;
end $$;

-- Customer submits: INSERT only (a new row), never read/update/delete.
create policy anon_insert_only on public.orders           for insert to anon, authenticated with check (true);
create policy anon_insert_only on public.complaints       for insert to anon, authenticated with check (true);
create policy anon_insert_only on public.returns_list     for insert to anon, authenticated with check (true);
create policy anon_insert_only on public.sourcing_requests for insert to anon, authenticated with check (true);
create policy anon_insert_only on public.account_requests for insert to anon, authenticated with check (true);
create policy anon_insert_only on public.price_alerts     for insert to anon, authenticated with check (true);

-- Guide phones are public display data: readable by everyone, writable
-- only through the gated RPCs (dashboard).
create policy public_read on public.guide_phones for select to anon, authenticated using (true);

-- clients: no anon policies at all — reads/writes go through the RPCs
-- (client_login / client_rows / gated_*) only.

-- ============================================================================
-- After running: test with the curl commands in the header, then confirm in
-- the dashboard that orders, clients, complaints, returns and sourcing load
-- and save normally for the owner, an employee, and a Supabase Auth admin.
-- ============================================================================
