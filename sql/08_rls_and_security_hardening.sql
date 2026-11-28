-- ============================================================
-- ELZOGHBI — خطوة 08: تشديد الأمان التدريجي (Hash للمالك + RLS جدولًا بجدول)
-- ============================================================
-- تعليمات التشغيل الآمن:
-- 1) نفّذ القسم (أ) أولًا لترقية دالة _admin_owner_ok لتدعم التحقق بالهاش
--    مع إبقاء المقارنة القديمة مؤقتًا حتى تتأكد من نجاح الدخول بالهاش.
-- 2) نفّذ القسم (ب) جدولًا بجدول وجرّب الموقع على Vercel Preview بعد كل جدول.
-- 3) يوجد في أسفل الملف أوامر التراجع الفوري (Rollback) لكل جدول عند الحاجة.
-- ============================================================

-- ============================================================
-- القسم (أ): ترقية _admin_owner_ok لتدعم Salted SHA-256 مع توافق خلفي مؤقت
-- ============================================================
create or replace function public._admin_owner_ok(p_username text, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cred jsonb;
  v_salt text;
  v_hash text;
begin
  select credentials into v_cred from public.site_settings where id = 'main';
  if v_cred is null then return false; end if;

  if lower(coalesce(v_cred->>'username', '')) <> lower(coalesce(p_username, '')) then
    return false;
  end if;

  -- المسار الجديد الآمن: التحقق بالهاش (Salted SHA-256)
  v_salt := coalesce(v_cred->>'password_salt', '');
  v_hash := coalesce(v_cred->>'password_hash', '');
  if v_salt <> '' and v_hash <> '' then
    return public._admin_hash_pw(v_salt, p_password) = v_hash;
  end if;

  -- مسار التوافق المؤقت (يُزال بعد تفعيل password_hash والتأكد من نجاح الدخول)
  return coalesce(v_cred->>'password', '') = coalesce(p_password, '');
end;
$$;
revoke all on function public._admin_owner_ok(text, text) from public, anon, authenticated;

-- دالة مساعدة لتعيين هاش كلمة مرور المالك بأمان (تشغّلها مرة واحدة من SQL Editor):
-- select public.set_owner_password_hash('كلمة_المرور_الحالية', 'كلمة_المرور_الجديدة');
create or replace function public.set_owner_password_hash(p_current_password text, p_new_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cred jsonb;
  v_salt text;
  v_hash text;
begin
  select credentials into v_cred from public.site_settings where id = 'main';
  if v_cred is null then return false; end if;
  if not public._admin_owner_ok(coalesce(v_cred->>'username', ''), p_current_password) then
    return false;
  end if;
  v_salt := encode(gen_random_bytes(16), 'hex');
  v_hash := public._admin_hash_pw(v_salt, p_new_password);
  update public.site_settings
     set credentials = (v_cred - 'password') || jsonb_build_object('password_salt', v_salt, 'password_hash', v_hash)
   where id = 'main';
  return true;
end;
$$;
revoke all on function public.set_owner_password_hash(text, text) from public, anon, authenticated;

-- ============================================================
-- القسم (ب): تفعيل RLS تدريجيًا على جداول sql/05 و sql/06 (قراءة عامة، كتابة عبر Service Role/RPC فقط)
-- جرّب كل بلوك منفردًا على Vercel Preview قبل الانتقال للتالي!
-- ============================================================

-- [جدول 1]: guide_phones
alter table if exists public.guide_phones enable row level security;
drop policy if exists "public_read_guide_phones" on public.guide_phones;
create policy "public_read_guide_phones" on public.guide_phones for select using (true);

-- [جدول 2]: price_alerts (إدخال عام للتنبيهات، بدون قراءة بيانات الآخرين)
alter table if exists public.price_alerts enable row level security;
drop policy if exists "public_insert_price_alerts" on public.price_alerts;
create policy "public_insert_price_alerts" on public.price_alerts for insert with check (true);

-- [جدول 3]: store_review_entities
alter table if exists public.store_review_entities enable row level security;
drop policy if exists "public_read_store_review_entities" on public.store_review_entities;
create policy "public_read_store_review_entities" on public.store_review_entities for select using (true);

-- [جدول 4]: store_review_entries
alter table if exists public.store_review_entries enable row level security;
drop policy if exists "public_read_store_review_entries" on public.store_review_entries;
create policy "public_read_store_review_entries" on public.store_review_entries for select using (true);

-- [جدول 5]: store_review_questions
alter table if exists public.store_review_questions enable row level security;
drop policy if exists "public_read_store_review_questions" on public.store_review_questions;
create policy "public_read_store_review_questions" on public.store_review_questions for select using (true);

-- ============================================================
-- أوامر التراجع الفوري (Rollback) في حال حدوث أي مشكلة على Preview:
-- alter table public.guide_phones disable row level security;
-- alter table public.price_alerts disable row level security;
-- alter table public.store_review_entities disable row level security;
-- alter table public.store_review_entries disable row level security;
-- alter table public.store_review_questions disable row level security;
-- ============================================================
