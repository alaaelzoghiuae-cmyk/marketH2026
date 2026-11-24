-- =====================================================================
-- ELZOGHBI — Stage C (Part 1): تنظيف الأسرار المسرّبة من قاعدة البيانات
-- التاريخ: 2026-11-22 — بعد نشر Round 8 (كوميت 33c4a3d)
--
-- لماذا هذا الملف؟
--   Round 8 أوقف التسريب الجديد (الكود لم يعد ينسخ كلمات السر وأكواد OTP
--   داخل حقل data عند الحفظ)، لكن الأسرار القديمة ما زالت قاعدة في
--   قاعدة البيانات ومقروءة بالمفتاح العام، ومنها كود OTP حي لعميل حقيقي
--   (طلب إعادة تعيين مقدَّم اليوم 05:59 — تقرير QA).
--   هذا الملف يمسحها من البيانات الحالية. الكود وحده لا يستطيع ذلك.
--
-- كيف تشغّله (كما تفضّل دائماً):
--   Supabase Dashboard → SQL Editor → New query → الصق → Run
--   شغّل الخطوات بالترتيب، ولا تتخطَّ خطوة التحقق الأولى.
--
-- تحذيران قبل التشغيل:
--   1) أغلق كل تبويبات الموقع القديمة أو حدّثها بقوة (Ctrl+Shift+R)
--      قبل التشغيل: تبويب قديم ما زال يعمل بالحزمة قبل Round 8 يمكنه
--      عند حفظ عميل أن يعيد نسخ الأسرار داخل data من جديد.
--   2) المسح سيزيل كلمة السر المطلوبة وكود OTP من بطاقة اعتماد إعادة
--      التعيين عند الأدمن (المسار نفسه صار كذلك للحفظ الجديد بعد Round 8).
--      قبل الخطوة 1، راجع من نتيجة خطوة 0 أي طلبات إعادة تعيين معلّقة
--      وخلّصها أولاً (اعتمدها بكلمة سر تختارها أنت من الداشبورد).
--   هذا الملف لا يمسّ عمود clients.password نفسه ولا عمود
--   account_requests.requested_password — اعتماد الحسابات وكلمات سر
--   العملاء عند الأدمن (عبر admin_client_passwords) يعملان كما هما.
-- =====================================================================

-- =====================================================================
-- الخطوة 0 — تحقق أولاً (قراءة فقط، آمنة): كم صفاً فيه أسرار؟
-- =====================================================================

-- (أ) عملاء لديهم أسرار داخل data
select count(*) as clients_with_secrets_in_data
from public.clients
where data ?| array['password','resetOtp','reset_otp',
                    'resetOtpExpires','reset_otp_expires',
                    'requestedNewPassword','requested_new_password'];

-- (ب) طلبات إعادة تعيين معلّقة — خلّصها قبل المسح (انظر التحذير 2)
select id, name, phone, email,
       data->>'passwordResetRequest' as reset_requested,
       data->>'createdAt' as requested_at
from public.clients
where (data->>'passwordResetRequest')::boolean is true
   or data ?| array['resetOtp','reset_otp','requestedNewPassword'];

-- (ج) طلبات فتح حساب لديها أسرار داخل data
select count(*) as account_requests_with_secrets_in_data
from public.account_requests
where data ?| array['password','requestedPassword','requested_password'];

-- (د) الأعمدة الفعلية في account_requests (للمقارنة قبل أي قفل مستقبلي)
select column_name, data_type
from information_schema.columns
where table_schema = 'public' and table_name = 'account_requests'
order by ordinal_position;

-- =====================================================================
-- الخطوة 1 — مسح أسرار clients.data
-- المفاتيح مطابقة تماماً لقائمة الاستبعاد في Round 8 (toSnakeCaseRow):
--   password, resetOtp, reset_otp, resetOtpExpires, reset_otp_expires,
--   requestedNewPassword, requested_new_password
-- يبقي علم passwordResetRequest كما هو حتى تظل الطلبات المعلّقة ظاهرة.
-- =====================================================================
update public.clients
set data = data
  - 'password'
  - 'resetOtp' - 'reset_otp'
  - 'resetOtpExpires' - 'reset_otp_expires'
  - 'requestedNewPassword' - 'requested_new_password'
where data ?| array['password','resetOtp','reset_otp',
                    'resetOtpExpires','reset_otp_expires',
                    'requestedNewPassword','requested_new_password'];

-- =====================================================================
-- الخطوة 2 — مسح أسرار account_requests.data
-- المفاتيح مطابقة لقائمة الاستبعاد في Round 8 لنفس الجدول.
-- عمود requested_password نفسه لا يُمس — اعتماد الحسابات يعتمد عليه.
-- =====================================================================
update public.account_requests
set data = data
  - 'password'
  - 'requestedPassword' - 'requested_password'
where data ?| array['password','requestedPassword','requested_password'];

-- =====================================================================
-- الخطوة 3 — تحقق بعد المسح: يجب أن ترجع كلها 0
-- =====================================================================
select count(*) as clients_still_leaking
from public.clients
where data ?| array['password','resetOtp','reset_otp',
                    'resetOtpExpires','reset_otp_expires',
                    'requestedNewPassword','requested_new_password'];

select count(*) as account_requests_still_leaking
from public.account_requests
where data ?| array['password','requestedPassword','requested_password'];

-- =====================================================================
-- الخطوة 4 — قفل أعمدة account_requests (Stage C) — مسودة فقط:
-- ⛔ لا تشغّل ما تحت هذا السطر الآن ⛔
-- السبب: الداشبورد يجلب requested_password بالمفتاح العام عند فتح
-- نافذة اعتماد الحساب، فالقفل وحده سيكسر الاعتماد. يلزم أولاً:
--   (1) إنشاء دالة admin_account_request_passwords أدناه،
--   (2) تعديل في الكود: حذف requested_password من جلب الاعتماد
--       واستدعاء الدالة لحظة فتح النافذة (كما في FIXES_QA.md).
-- القائمة أدناه من TABLE_ALLOWED_COLUMNS في App.jsx (Round 8)؛ قارنها
-- مع نتيجة الخطوة 0 (د) قبل تشغيلها مستقبلاً، لأن أي عمود جديد في
-- الجدول لن يكون مقروءاً للعامة حتى يُمنح هنا.
-- =====================================================================

-- -- (1) دالة محروسة للأدمن فقط — على نمط admin_client_passwords:
-- create or replace function public.admin_account_request_passwords(
--   p_username text, p_password text)
-- returns jsonb
-- language plpgsql
-- security definer
-- set search_path = public
-- as $$
-- declare
--   creds jsonb;
--   result jsonb;
-- begin
--   select credentials into creds from public.site_settings where id = 'main';
--   if creds is null
--      or lower(trim(coalesce(creds->>'username', ''))) <> lower(trim(coalesce(p_username, '')))
--      or coalesce(creds->>'password', '') <> coalesce(p_password, '') then
--     return null;
--   end if;
--   select coalesce(jsonb_agg(jsonb_build_object(
--            'id', id, 'requested_password', requested_password)), '[]'::jsonb)
--     into result
--     from public.account_requests;
--   return result;
-- end;
-- $$;
--
-- revoke all on function public.admin_account_request_passwords(text, text) from public;
-- grant execute on function public.admin_account_request_passwords(text, text) to anon, authenticated;
--
-- -- (2) القفل — بعد تعديل الكود ونشره والتحقق حياً فقط:
-- revoke select on public.account_requests from anon, authenticated;
-- grant select (id, name, shop_name, owner, owner_name, phone, email,
--               address, type, account_category, shop_type, notes, status,
--               assigned_group_id, credit_limit, created_at,
--               accepted_terms_at, data)
--   on public.account_requests to anon, authenticated;
--
-- -- ROLLBACK (only if something breaks):
-- -- grant select on public.account_requests to anon, authenticated;

-- =====================================================================
-- تذكير منفصل (ملف موجود أصلاً، لم يُشغَّل بعد):
--   elzoghbi_fix/security_admin_update_credentials.sql
--   — يلزم فقط لتغيير كلمة سر الأدمن من الداشبورد؛ كل شيء آخر يعمل بدونه.
-- =====================================================================
