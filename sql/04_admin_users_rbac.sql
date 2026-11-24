-- ============================================================
-- ELZOGHBI — خطوة 04: حسابات موظفين الداشبورد + الصلاحيات (RBAC)
-- ============================================================
-- ايه اللي بيعمله الملف ده؟
-- 1) جدول جديد admin_users لحسابات الموظفين (اسم دخول + كلمة مرور
--    مشفرة باتجاه واحد Salted SHA-256 + صلاحيات كل موظف كقائمة أقسام).
-- 2) الجدول مقفول تمامًا على المفتاح العام: محدش يقدر يقرأه أو يعدله
--    مباشرة — الوصول الوحيد عن طريق الدوال الآمنة تحت.
-- 3) دوال: دخول الموظف، وعرض/حفظ/حذف الموظفين (الإدارة مقفولة
--    ببيانات المالك نفسه — نفس نمط admin_client_passwords).
-- حساب المالك الحالي (alaa) مش بيتأثر خالص وبيفضل يدخل زي ما هو
-- وبصلاحيات كاملة، وهو الوحيد اللي يقدر يدير حسابات الموظفين.
--
-- طريقة التشغيل: انسخ الملف كله والصقه في Supabase SQL Editor
-- واضغط Run مرة واحدة. آمن للتشغيل أكتر من مرة.
-- ============================================================

-- 1) الجدول
create table if not exists public.admin_users (
  id            text primary key,
  username      text not null unique,
  display_name  text not null default '',
  role_label    text not null default '',
  pass_salt     text not null,
  pass_hash     text not null,
  permissions   jsonb not null default '[]'::jsonb,
  is_active     boolean not null default true,
  last_login_at timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2) قفل الجدول على المفتاح العام
alter table public.admin_users enable row level security;
revoke all on table public.admin_users from anon, authenticated;

-- 3) دوال مساعدة داخلية (مش متاحة للمفتاح العام)
create or replace function public._admin_owner_ok(p_username text, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare v_cred jsonb;
begin
  select credentials into v_cred from public.site_settings where id = 'main';
  if v_cred is null then return false; end if;
  return lower(coalesce(v_cred->>'username', '')) = lower(coalesce(p_username, ''))
     and coalesce(v_cred->>'password', '') = coalesce(p_password, '');
end;
$$;
revoke all on function public._admin_owner_ok(text, text) from public, anon, authenticated;

create or replace function public._admin_hash_pw(p_salt text, p_password text)
returns text
language sql
immutable
as $$
  select encode(sha256(convert_to(coalesce(p_salt, '') || ':' || coalesce(p_password, ''), 'UTF8')), 'hex');
$$;
revoke all on function public._admin_hash_pw(text, text) from public, anon, authenticated;

-- 4) دخول الموظف: بترجع بياناته وصلاحياته لو البيانات صح والحساب نشط
create or replace function public.admin_user_login(p_username text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_user public.admin_users%rowtype;
begin
  select * into v_user from public.admin_users
   where lower(username) = lower(coalesce(p_username, ''));
  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;
  if not v_user.is_active then
    return jsonb_build_object('ok', false, 'error', 'inactive');
  end if;
  if public._admin_hash_pw(v_user.pass_salt, p_password) <> v_user.pass_hash then
    return jsonb_build_object('ok', false, 'error', 'invalid');
  end if;
  update public.admin_users set last_login_at = now() where id = v_user.id;
  return jsonb_build_object(
    'ok', true,
    'id', v_user.id,
    'username', v_user.username,
    'display_name', v_user.display_name,
    'role_label', v_user.role_label,
    'permissions', v_user.permissions
  );
end;
$$;

-- 5) عرض الموظفين (للمالك فقط — من غير أي كلمات مرور)
create or replace function public.admin_users_list(p_owner_username text, p_owner_password text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public._admin_owner_ok(p_owner_username, p_owner_password) then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;
  return jsonb_build_object('ok', true, 'users', coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', id,
      'username', username,
      'display_name', display_name,
      'role_label', role_label,
      'permissions', permissions,
      'is_active', is_active,
      'last_login_at', last_login_at,
      'created_at', created_at
    ) order by created_at)
    from public.admin_users
  ), '[]'::jsonb));
end;
$$;

-- 6) إنشاء / تعديل موظف (للمالك فقط)
--    p_id فاضي = إنشاء (كلمة المرور إجبارية)
--    p_new_password فاضية في التعديل = الاحتفاظ بكلمة المرور الحالية
create or replace function public.admin_user_save(
  p_owner_username text,
  p_owner_password text,
  p_id text,
  p_username text,
  p_display_name text,
  p_role_label text,
  p_permissions jsonb,
  p_is_active boolean,
  p_new_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare v_id text; v_salt text; v_owner_name text;
begin
  if not public._admin_owner_ok(p_owner_username, p_owner_password) then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;
  if coalesce(trim(p_username), '') = '' then
    return jsonb_build_object('ok', false, 'error', 'username_required');
  end if;
  select lower(coalesce(credentials->>'username', ''))
    into v_owner_name from public.site_settings where id = 'main';
  if lower(trim(p_username)) = coalesce(v_owner_name, '') then
    return jsonb_build_object('ok', false, 'error', 'username_is_owner');
  end if;

  if p_id is null or p_id = '' then
    if coalesce(p_new_password, '') = '' then
      return jsonb_build_object('ok', false, 'error', 'password_required');
    end if;
    if exists (select 1 from public.admin_users where lower(username) = lower(trim(p_username))) then
      return jsonb_build_object('ok', false, 'error', 'username_taken');
    end if;
    v_id := 'usr_' || floor(extract(epoch from clock_timestamp()) * 1000)::bigint
            || '_' || substr(md5(random()::text), 1, 6);
    v_salt := md5(random()::text || clock_timestamp()::text);
    insert into public.admin_users
      (id, username, display_name, role_label, pass_salt, pass_hash, permissions, is_active)
    values
      (v_id, trim(p_username), coalesce(p_display_name, ''), coalesce(p_role_label, ''),
       v_salt, public._admin_hash_pw(v_salt, p_new_password),
       coalesce(p_permissions, '[]'::jsonb), coalesce(p_is_active, true));
    return jsonb_build_object('ok', true, 'id', v_id);
  end if;

  if exists (select 1 from public.admin_users
              where lower(username) = lower(trim(p_username)) and id <> p_id) then
    return jsonb_build_object('ok', false, 'error', 'username_taken');
  end if;

  if coalesce(p_new_password, '') <> '' then
    v_salt := md5(random()::text || clock_timestamp()::text);
    update public.admin_users set
      username = trim(p_username),
      display_name = coalesce(p_display_name, ''),
      role_label = coalesce(p_role_label, ''),
      permissions = coalesce(p_permissions, '[]'::jsonb),
      is_active = coalesce(p_is_active, true),
      pass_salt = v_salt,
      pass_hash = public._admin_hash_pw(v_salt, p_new_password),
      updated_at = now()
    where id = p_id;
  else
    update public.admin_users set
      username = trim(p_username),
      display_name = coalesce(p_display_name, ''),
      role_label = coalesce(p_role_label, ''),
      permissions = coalesce(p_permissions, '[]'::jsonb),
      is_active = coalesce(p_is_active, true),
      updated_at = now()
    where id = p_id;
  end if;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  return jsonb_build_object('ok', true, 'id', p_id);
end;
$$;

-- 7) حذف موظف (للمالك فقط)
create or replace function public.admin_user_delete(
  p_owner_username text,
  p_owner_password text,
  p_id text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public._admin_owner_ok(p_owner_username, p_owner_password) then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;
  delete from public.admin_users where id = p_id;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

-- 8) السماح للمفتاح العام بتنفيذ دوال الدخول/الإدارة
--    (الدوال نفسها هي اللي بتتحقق من الهوية من جوّه)
grant execute on function public.admin_user_login(text, text) to anon, authenticated;
grant execute on function public.admin_users_list(text, text) to anon, authenticated;
grant execute on function public.admin_user_save(text, text, text, text, text, text, jsonb, boolean, text) to anon, authenticated;
grant execute on function public.admin_user_delete(text, text, text) to anon, authenticated;

-- ============================================================
-- تحقق سريع بعد التشغيل (اختياري):
--   select count(*) from public.admin_users;   -- المفروض 0 في الأول
-- وبعد ما تنشئ أول موظف من الداشبورد جرّب:
--   select public.admin_user_login('اسم_الموظف', 'كلمة_مرور_غلط');
--   -- المفروض يرجع {"ok": false, "error": "invalid"}
-- ============================================================
