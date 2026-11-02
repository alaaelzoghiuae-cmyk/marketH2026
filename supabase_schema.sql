-- ============================================================================
-- H-market ERP & B2B/B2C Storefront — Complete Supabase PostgreSQL + Storage Schema (v6.0)
-- ============================================================================
-- طريقة الاستخدام:
-- 1. افتح مشروعك في Supabase (https://supabase.com)
-- 2. ادخل على قسم (SQL Editor) من القائمة الجانبية واضغط (New Query)
-- 3. انسخ هذا الكود بالكامل والصقه هناك ثم اضغط (Run)
-- ملاحظة: هذا السكريبت آمن للتشغيل عدة مرات (Idempotent) بدون أي أخطاء!
-- ============================================================================

-- 1. جدول العملات وأسعار الصرف
CREATE TABLE IF NOT EXISTS public.currencies (
  code TEXT PRIMARY KEY,
  symbol TEXT NOT NULL,
  name TEXT NOT NULL,
  rate_from_base NUMERIC(12, 6) NOT NULL DEFAULT 1.0
);

-- 2. جدول مجموعات التسعير ورسوم التوصيل لكل مجموعة
CREATE TABLE IF NOT EXISTS public.pricing_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  currency TEXT NOT NULL REFERENCES public.currencies(code) ON UPDATE CASCADE,
  modifier_type TEXT NOT NULL DEFAULT 'none',
  modifier_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  delivery_fee_base NUMERIC(12, 2) NOT NULL DEFAULT 50,
  is_default BOOLEAN NOT NULL DEFAULT false,
  description TEXT
);

-- 3. جدول موديلات الهواتف
CREATE TABLE IF NOT EXISTS public.mobile_models (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  aliases TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. جدول قطع الغيار والمخزون
CREATE TABLE IF NOT EXISTS public.spare_parts (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  model_id TEXT REFERENCES public.mobile_models(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  quality_grade TEXT NOT NULL,
  colors JSONB NOT NULL DEFAULT '["قياسي"]'::jsonb,
  compatible_models JSONB NOT NULL DEFAULT '[]'::jsonb,
  search_aliases TEXT,
  description TEXT,
  warranty_text TEXT,
  image TEXT,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  max_order_qty INTEGER NOT NULL DEFAULT 10,
  cost_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  base_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  custom_group_prices JSONB NOT NULL DEFAULT '{}'::jsonb,
  waitlist_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT
);

-- 5. جدول حسابات التجار والعملاء وكشوف الحساب (تم تصحيح ON DELETE SET NULL)
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  password TEXT NOT NULL,
  address TEXT,
  secondary_address TEXT,
  group_id TEXT REFERENCES public.pricing_groups(id) ON DELETE SET NULL,
  wallet_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  credit_limit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  avatar TEXT,
  avatar_bg TEXT,
  avatar_image TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT,
  ledger JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 6. جدول طلبات فتح الحسابات الجديدة
CREATE TABLE IF NOT EXISTS public.account_requests (
  id TEXT PRIMARY KEY,
  shop_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  requested_password TEXT NOT NULL,
  address TEXT,
  shop_type TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT
);

-- 7. جدول الطلبات والفواتير اللحظية (تم تصحيح ON DELETE SET NULL)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  group_id TEXT,
  currency TEXT NOT NULL DEFAULT 'EGP',
  exchange_rate_used NUMERIC(12, 6) NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'تم الاستلام',
  payment_method TEXT NOT NULL,
  address TEXT,
  notes TEXT,
  delivery_fee_base NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_base NUMERIC(12, 2) NOT NULL DEFAULT 0,
  wallet_used_base NUMERIC(12, 2) NOT NULL DEFAULT 0,
  admin_edited BOOLEAN NOT NULL DEFAULT false,
  admin_edit_note TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- 8. جدول المرتجعات والضمان
CREATE TABLE IF NOT EXISTS public.returns_list (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  client_id TEXT,
  client_name TEXT,
  part_id TEXT,
  part_name TEXT,
  qty INTEGER NOT NULL DEFAULT 1,
  refund_amount_base NUMERIC(12, 2) NOT NULL DEFAULT 0,
  reason TEXT,
  warranty_confirmed BOOLEAN NOT NULL DEFAULT true,
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'قيد المراجعة',
  resolution_type TEXT,
  admin_response TEXT,
  replies JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TEXT
);

-- 9. جدول الشكاوى والمقترحات
CREATE TABLE IF NOT EXISTS public.complaints (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  client_name TEXT,
  type TEXT,
  subject TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'مفتوح',
  admin_reply TEXT,
  replies JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TEXT
);

-- 10. جدول أكواد الخصم والكوبونات
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL DEFAULT 'percentage',
  value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  max_discount_cap NUMERIC(12, 2) NOT NULL DEFAULT 500,
  min_order_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  usage_limit INTEGER NOT NULL DEFAULT 100,
  used_count INTEGER NOT NULL DEFAULT 0,
  expiry_date TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  description TEXT
);

-- 11. جدول مخزن الحالة المتزامنة اللحظية (Realtime App State Store)
CREATE TABLE IF NOT EXISTS public.app_state_sync (
  id TEXT PRIMARY KEY DEFAULT 'main_store',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- فهرس لتسريع استعلام الـ Polling الخفيف على updated_at
CREATE INDEX IF NOT EXISTS idx_app_state_sync_updated_at ON public.app_state_sync (id, updated_at);

-- تفعيل القراءة والكتابة لجدول المزامنة
ALTER TABLE public.app_state_sync ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read/write for app_state_sync" ON public.app_state_sync;
CREATE POLICY "Allow public read/write for app_state_sync"
  ON public.app_state_sync
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- إنشاء سجل البداية الافتراضي
INSERT INTO public.app_state_sync (id, payload)
VALUES ('main_store', '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 12. تفعيل خاصية التحديث اللحظي (Supabase Realtime) بشكل آمن لا يفشل عند التكرار
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'app_state_sync'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_state_sync;
  END IF;
END $$;

-- ============================================================================
-- 13. إعداد Supabase Storage Bucket (product-images) لرفع الصور خارج قاعدة البيانات
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit per compressed image
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880;

-- سياسات الأمان لـ Storage Bucket (قراءة عامة + رفع وتحديث وحذف)
DROP POLICY IF EXISTS "Public Read Access for product-images" ON storage.objects;
CREATE POLICY "Public Read Access for product-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public Insert Access for product-images" ON storage.objects;
CREATE POLICY "Public Insert Access for product-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public Update Access for product-images" ON storage.objects;
CREATE POLICY "Public Update Access for product-images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public Delete Access for product-images" ON storage.objects;
CREATE POLICY "Public Delete Access for product-images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images');

-- ============================================================================
-- استعلام فحص حجم صف البيانات الحالي (للتأكد من خفة الصف بعد نقل الصور):
-- SELECT id, pg_size_pretty(pg_column_size(payload)) AS payload_size, updated_at FROM public.app_state_sync;
-- ============================================================================
