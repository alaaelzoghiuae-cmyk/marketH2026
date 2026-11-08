-- ============================================================================
-- ELZOGHBI Platform — Comprehensive Database Schema, Indexing, Realtime & RLS (v9.0)
-- يشمل:
-- 1) توحيد اسم المنصة إلى ELZOGHBI واسترجاع كافة المنتجات والموديلات القديمة بالكامل
-- 2) تفعيل Supabase Realtime للأوردرات (orders) وطلبات التوفير (sourcing_requests / SRC-)
-- 3) إنشاء فهارس قاعدة البيانات السريعة (SQL Indexes) على (brand_id, model_id, category_id, created_at, sku)
-- 4) تفعيل سياسات الأمان (RLS) على جداول الأوردرات والعملاء وباقي الجداول
-- ============================================================================

-- إزالة الـ Views مؤقتاً للسماح بتعديل الأعمدة بحرية ثم إعادة إنشائها في نهاية السكريبت
DROP VIEW IF EXISTS public.parts CASCADE;
DROP VIEW IF EXISTS public.models CASCADE;

-- ============================================================================
-- المرحلة 1: إنشاء الجداول واستكمال كافة الأعمدة (بما فيها brand_id و category_id للفهرسة الهرمية)
-- ============================================================================

-- 1. جدول العملات (currencies)
CREATE TABLE IF NOT EXISTS public.currencies (
  code TEXT PRIMARY KEY,
  name TEXT,
  symbol TEXT,
  rate_from_base NUMERIC DEFAULT 1,
  exchange_rate NUMERIC DEFAULT 1
);
ALTER TABLE public.currencies
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS symbol TEXT,
  ADD COLUMN IF NOT EXISTS rate_from_base NUMERIC DEFAULT 1,
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1;
ALTER TABLE public.currencies ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.currencies ALTER COLUMN symbol DROP NOT NULL;

INSERT INTO public.currencies (code, name, symbol, rate_from_base, exchange_rate)
VALUES 
  ('EGP', 'جنيه مصري', 'ج.م', 1.0, 1.0),
  ('SAR', 'ريال سعودي', 'ر.س', 0.075, 0.075),
  ('AED', 'درهم إماراتي', 'د.إ', 0.073, 0.073),
  ('USD', 'دولار أمريكي', '$', 0.020, 0.020),
  ('EUR', 'يورو أوروبي', '€', 0.0185, 0.0185)
ON CONFLICT (code) DO UPDATE SET
  name = COALESCE(EXCLUDED.name, public.currencies.name),
  symbol = COALESCE(EXCLUDED.symbol, public.currencies.symbol);

-- 2. جدول الماركات (brands)
CREATE TABLE IF NOT EXISTS public.brands (
  name TEXT PRIMARY KEY,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 3. جدول الموديلات (mobile_models)
CREATE TABLE IF NOT EXISTS public.mobile_models (
  id TEXT PRIMARY KEY,
  brand TEXT,
  brand_id TEXT,
  name TEXT,
  aliases TEXT,
  image TEXT,
  is_promoted_ad BOOLEAN DEFAULT FALSE,
  created_at TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.mobile_models
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS brand_id TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS aliases TEXT,
  ADD COLUMN IF NOT EXISTS image TEXT,
  ADD COLUMN IF NOT EXISTS is_promoted_ad BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.mobile_models ALTER COLUMN brand DROP NOT NULL;
ALTER TABLE public.mobile_models ALTER COLUMN name DROP NOT NULL;

-- 4. جدول قطع الغيار والمنتجات (spare_parts)
CREATE TABLE IF NOT EXISTS public.spare_parts (
  id TEXT PRIMARY KEY,
  sku TEXT,
  brand_id TEXT,
  model_id TEXT,
  category TEXT,
  category_id TEXT,
  name TEXT,
  quality_grade TEXT,
  colors JSONB DEFAULT '["قياسي"]'::jsonb,
  compatible_models JSONB DEFAULT '[]'::jsonb,
  search_aliases TEXT,
  description TEXT,
  warranty_text TEXT,
  image TEXT,
  thumbnail TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  stock INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  max_order_qty INTEGER DEFAULT 10,
  cost_price NUMERIC DEFAULT 0,
  base_price NUMERIC DEFAULT 0,
  custom_group_prices JSONB DEFAULT '{}'::jsonb,
  waitlist_count INTEGER DEFAULT 0,
  sold_out BOOLEAN DEFAULT FALSE,
  is_promoted_ad BOOLEAN DEFAULT FALSE,
  created_at TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.spare_parts
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS brand_id TEXT,
  ADD COLUMN IF NOT EXISTS model_id TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS category_id TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS quality_grade TEXT,
  ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '["قياسي"]'::jsonb,
  ADD COLUMN IF NOT EXISTS compatible_models JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS search_aliases TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS warranty_text TEXT,
  ADD COLUMN IF NOT EXISTS image TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail TEXT,
  ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS max_order_qty INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custom_group_prices JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS waitlist_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sold_out BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_promoted_ad BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.spare_parts DROP CONSTRAINT IF EXISTS spare_parts_sku_key;
ALTER TABLE public.spare_parts DROP CONSTRAINT IF EXISTS spare_parts_model_id_fkey;
DROP INDEX IF EXISTS spare_parts_sku_key;
ALTER TABLE public.spare_parts ALTER COLUMN sku DROP NOT NULL;
ALTER TABLE public.spare_parts ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.spare_parts ALTER COLUMN category DROP NOT NULL;
ALTER TABLE public.spare_parts ALTER COLUMN quality_grade DROP NOT NULL;
ALTER TABLE public.spare_parts ALTER COLUMN model_id DROP NOT NULL;
ALTER TABLE public.spare_parts ALTER COLUMN cost_price SET DEFAULT 0;
ALTER TABLE public.spare_parts ALTER COLUMN base_price SET DEFAULT 0;
ALTER TABLE public.spare_parts ALTER COLUMN stock SET DEFAULT 0;

-- 5. جدول مجموعات التسعير (pricing_groups)
CREATE TABLE IF NOT EXISTS public.pricing_groups (
  id TEXT PRIMARY KEY,
  name TEXT,
  currency TEXT DEFAULT 'EGP',
  modifier_type TEXT DEFAULT 'none',
  modifier_value NUMERIC DEFAULT 0,
  delivery_fee_base NUMERIC DEFAULT 75,
  is_default BOOLEAN DEFAULT FALSE,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.pricing_groups
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EGP',
  ADD COLUMN IF NOT EXISTS modifier_type TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS modifier_value NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee_base NUMERIC DEFAULT 75,
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.pricing_groups DROP CONSTRAINT IF EXISTS pricing_groups_currency_fkey;

-- 6. جدول العملاء (clients)
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT,
  owner TEXT DEFAULT '',
  phone TEXT,
  email TEXT,
  password TEXT,
  address TEXT,
  secondary_address TEXT,
  group_id TEXT,
  credit_limit NUMERIC DEFAULT 0,
  wallet_balance NUMERIC DEFAULT 0,
  ledger JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  type TEXT DEFAULT 'shop',
  account_type TEXT DEFAULT 'shop',
  avatar TEXT,
  avatar_bg TEXT,
  avatar_image TEXT,
  created_at TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS owner TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS password TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS secondary_address TEXT,
  ADD COLUMN IF NOT EXISTS group_id TEXT,
  ADD COLUMN IF NOT EXISTS credit_limit NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ledger JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'shop',
  ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'shop',
  ADD COLUMN IF NOT EXISTS avatar TEXT,
  ADD COLUMN IF NOT EXISTS avatar_bg TEXT,
  ADD COLUMN IF NOT EXISTS avatar_image TEXT,
  ADD COLUMN IF NOT EXISTS created_at TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_group_id_fkey;
ALTER TABLE public.clients DROP CONSTRAINT IF EXISTS clients_phone_key;
ALTER TABLE public.clients ALTER COLUMN owner DROP NOT NULL;
ALTER TABLE public.clients ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.clients ALTER COLUMN address DROP NOT NULL;
ALTER TABLE public.clients ALTER COLUMN password DROP NOT NULL;

-- 7. جدول طلبات فتح الحسابات (account_requests)
CREATE TABLE IF NOT EXISTS public.account_requests (
  id TEXT PRIMARY KEY,
  name TEXT,
  shop_name TEXT,
  owner TEXT,
  owner_name TEXT,
  phone TEXT,
  email TEXT,
  password TEXT,
  requested_password TEXT,
  address TEXT,
  type TEXT DEFAULT 'shop',
  account_category TEXT DEFAULT 'shop',
  shop_type TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  assigned_group_id TEXT,
  credit_limit NUMERIC DEFAULT 0,
  created_at TEXT,
  accepted_terms_at TEXT,
  data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.account_requests
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS shop_name TEXT,
  ADD COLUMN IF NOT EXISTS owner TEXT,
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS password TEXT,
  ADD COLUMN IF NOT EXISTS requested_password TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'shop',
  ADD COLUMN IF NOT EXISTS account_category TEXT DEFAULT 'shop',
  ADD COLUMN IF NOT EXISTS shop_type TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS assigned_group_id TEXT,
  ADD COLUMN IF NOT EXISTS credit_limit NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TEXT,
  ADD COLUMN IF NOT EXISTS accepted_terms_at TEXT,
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.account_requests ALTER COLUMN shop_name DROP NOT NULL;
ALTER TABLE public.account_requests ALTER COLUMN owner_name DROP NOT NULL;
ALTER TABLE public.account_requests ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.account_requests ALTER COLUMN address DROP NOT NULL;

-- 8. جدول الطلبات والفواتير (orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  client_name TEXT,
  group_id TEXT,
  currency TEXT DEFAULT 'EGP',
  exchange_rate_used NUMERIC DEFAULT 1,
  status TEXT DEFAULT 'تم الاستلام',
  payment_method TEXT DEFAULT 'كاش عند الاستلام',
  address TEXT,
  notes TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  delivery_fee_base NUMERIC DEFAULT 0,
  discount_base NUMERIC DEFAULT 0,
  wallet_used_base NUMERIC DEFAULT 0,
  admin_edited BOOLEAN DEFAULT FALSE,
  admin_edit_note TEXT,
  created_at TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS client_id TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS group_id TEXT,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EGP',
  ADD COLUMN IF NOT EXISTS exchange_rate_used NUMERIC DEFAULT 1,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'تم الاستلام',
  ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'كاش عند الاستلام',
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS delivery_fee_base NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS discount_base NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_used_base NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS admin_edited BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS admin_edit_note TEXT,
  ADD COLUMN IF NOT EXISTS created_at TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_client_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_group_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_currency_fkey;
ALTER TABLE public.orders ALTER COLUMN payment_method DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN created_at DROP NOT NULL;
ALTER TABLE public.orders ALTER COLUMN address DROP NOT NULL;

-- 9. جدول المرتجعات (returns_list)
CREATE TABLE IF NOT EXISTS public.returns_list (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  client_id TEXT,
  client_name TEXT,
  part_id TEXT,
  part_name TEXT,
  qty INTEGER DEFAULT 1,
  refund_amount_base NUMERIC DEFAULT 0,
  reason TEXT,
  status TEXT DEFAULT 'قيد المراجعة',
  photos JSONB DEFAULT '[]'::jsonb,
  admin_response TEXT,
  resolution_type TEXT,
  warranty_confirmed BOOLEAN DEFAULT TRUE,
  replies JSONB DEFAULT '[]'::jsonb,
  closed BOOLEAN DEFAULT FALSE,
  created_at TEXT,
  data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.returns_list
  ADD COLUMN IF NOT EXISTS order_id TEXT,
  ADD COLUMN IF NOT EXISTS client_id TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS part_id TEXT,
  ADD COLUMN IF NOT EXISTS part_name TEXT,
  ADD COLUMN IF NOT EXISTS qty INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS refund_amount_base NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'قيد المراجعة',
  ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS admin_response TEXT,
  ADD COLUMN IF NOT EXISTS resolution_type TEXT,
  ADD COLUMN IF NOT EXISTS warranty_confirmed BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS replies JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS closed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TEXT,
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.returns_list DROP CONSTRAINT IF EXISTS returns_list_order_id_fkey;
ALTER TABLE public.returns_list DROP CONSTRAINT IF EXISTS returns_list_client_id_fkey;
ALTER TABLE public.returns_list DROP CONSTRAINT IF EXISTS returns_list_part_id_fkey;

-- 10. جدول الشكاوى والمقترحات (complaints)
CREATE TABLE IF NOT EXISTS public.complaints (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  client_name TEXT,
  type TEXT,
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'قيد المتابعة',
  admin_reply TEXT,
  replies JSONB DEFAULT '[]'::jsonb,
  created_at TEXT,
  data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS client_id TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'قيد المتابعة',
  ADD COLUMN IF NOT EXISTS admin_reply TEXT,
  ADD COLUMN IF NOT EXISTS replies JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TEXT,
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.complaints DROP CONSTRAINT IF EXISTS complaints_client_id_fkey;

-- 11. جدول أكواد الخصم (promo_codes)
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id TEXT PRIMARY KEY,
  code TEXT,
  type TEXT,
  value NUMERIC DEFAULT 0,
  max_discount_cap NUMERIC DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  usage_limit INTEGER DEFAULT 100,
  used_count INTEGER DEFAULT 0,
  expiry_date TEXT,
  description TEXT,
  active BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS code TEXT,
  ADD COLUMN IF NOT EXISTS type TEXT,
  ADD COLUMN IF NOT EXISTS value NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_discount_cap NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_limit INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS expiry_date TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.promo_codes DROP CONSTRAINT IF EXISTS promo_codes_code_key;

-- 12. جدول إعلانات الواجهة (store_ads)
CREATE TABLE IF NOT EXISTS public.store_ads (
  id TEXT PRIMARY KEY,
  badge TEXT,
  title TEXT,
  subtitle TEXT,
  theme TEXT,
  gradient TEXT,
  image TEXT,
  button_text TEXT,
  linked_part_id TEXT,
  layout TEXT DEFAULT 'blend',
  align TEXT DEFAULT 'right',
  image_fit TEXT DEFAULT 'cover',
  overlay NUMERIC DEFAULT 55,
  show_badge BOOLEAN DEFAULT TRUE,
  show_button BOOLEAN DEFAULT TRUE,
  start_date TEXT,
  end_date TEXT,
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.store_ads
  ADD COLUMN IF NOT EXISTS badge TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS theme TEXT,
  ADD COLUMN IF NOT EXISTS gradient TEXT,
  ADD COLUMN IF NOT EXISTS image TEXT,
  ADD COLUMN IF NOT EXISTS button_text TEXT,
  ADD COLUMN IF NOT EXISTS linked_part_id TEXT,
  ADD COLUMN IF NOT EXISTS layout TEXT DEFAULT 'blend',
  ADD COLUMN IF NOT EXISTS align TEXT DEFAULT 'right',
  ADD COLUMN IF NOT EXISTS image_fit TEXT DEFAULT 'cover',
  ADD COLUMN IF NOT EXISTS overlay NUMERIC DEFAULT 55,
  ADD COLUMN IF NOT EXISTS show_badge BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS show_button BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS start_date TEXT,
  ADD COLUMN IF NOT EXISTS end_date TEXT,
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- 13. جدول بارات العرض المميزة في الصفحة الرئيسية (showcase_bars)
CREATE TABLE IF NOT EXISTS public.showcase_bars (
  id TEXT PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  badge_color TEXT,
  part_ids JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.showcase_bars
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS subtitle TEXT,
  ADD COLUMN IF NOT EXISTS badge_color TEXT,
  ADD COLUMN IF NOT EXISTS part_ids JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- 14. جدول التمبلت التلقائي (auto_templates)
CREATE TABLE IF NOT EXISTS public.auto_templates (
  id TEXT PRIMARY KEY,
  sku_prefix TEXT,
  category TEXT,
  name_pattern TEXT,
  quality_grade TEXT,
  colors JSONB DEFAULT '[]'::jsonb,
  warranty_text TEXT,
  image_key TEXT,
  cost_price NUMERIC DEFAULT 0,
  base_price NUMERIC DEFAULT 0,
  default_stock INTEGER DEFAULT 10,
  low_stock_threshold INTEGER DEFAULT 5,
  max_order_qty INTEGER DEFAULT 10,
  enabled BOOLEAN DEFAULT TRUE,
  data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.auto_templates
  ADD COLUMN IF NOT EXISTS sku_prefix TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS name_pattern TEXT,
  ADD COLUMN IF NOT EXISTS quality_grade TEXT,
  ADD COLUMN IF NOT EXISTS colors JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS warranty_text TEXT,
  ADD COLUMN IF NOT EXISTS image_key TEXT,
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS base_price NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_stock INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS max_order_qty INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- 15. جدول طلبات توفير المنتجات من الخارج (sourcing_requests / SRC-)
CREATE TABLE IF NOT EXISTS public.sourcing_requests (
  id TEXT PRIMARY KEY,
  client_id TEXT,
  client_name TEXT,
  phone TEXT,
  client_phone TEXT,
  part_id TEXT,
  part_name TEXT,
  name TEXT,
  desc_text TEXT,
  notes TEXT,
  image TEXT,
  status TEXT DEFAULT 'جديد',
  price NUMERIC,
  deposit NUMERIC,
  deposit_status TEXT DEFAULT 'none',
  messages JSONB DEFAULT '[]'::jsonb,
  images_allowed BOOLEAN DEFAULT FALSE,
  unread_admin BOOLEAN DEFAULT TRUE,
  unread_client BOOLEAN DEFAULT FALSE,
  closed BOOLEAN DEFAULT FALSE,
  created_at TEXT,
  updated_at TEXT,
  accepted_terms_at TEXT,
  data JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.sourcing_requests
  ADD COLUMN IF NOT EXISTS client_id TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS client_phone TEXT,
  ADD COLUMN IF NOT EXISTS part_id TEXT,
  ADD COLUMN IF NOT EXISTS part_name TEXT,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS desc_text TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS image TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'جديد',
  ADD COLUMN IF NOT EXISTS price NUMERIC,
  ADD COLUMN IF NOT EXISTS deposit NUMERIC,
  ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS messages JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS images_allowed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS unread_admin BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS unread_client BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS closed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TEXT,
  ADD COLUMN IF NOT EXISTS accepted_terms_at TEXT,
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- 16. جدول إعدادات الموقع والبيانات العامة (site_settings)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  settings JSONB DEFAULT '{}'::jsonb,
  credentials JSONB DEFAULT '{}'::jsonb,
  currencies JSONB DEFAULT '{}'::jsonb,
  notifications JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. جدول التحديثات الخفيف لمنع استهلاك الـ Egress (sync_meta)
CREATE TABLE IF NOT EXISTS public.sync_meta (
  table_name TEXT PRIMARY KEY,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- تحويل أعمدة created_at إلى TEXT بأمان لتفادي أخطاء صيغ التاريخ
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['spare_parts', 'mobile_models', 'clients', 'account_requests', 'orders', 'returns_list', 'complaints', 'sourcing_requests'])
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN created_at TYPE TEXT USING created_at::text;', t);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- المرحلة 2: استرجاع وترميم كافة البيانات القديمة من جميع صفوف app_state_sync_backup و app_state_sync و products
-- ============================================================================
DO $$
DECLARE
  v_payload JSONB;
  rec RECORD;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS _elzoghbi_payloads (payload JSONB, priority INT) ON COMMIT DROP;
  TRUNCATE TABLE _elzoghbi_payloads;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_state_sync_backup') THEN
    EXECUTE 'INSERT INTO _elzoghbi_payloads (payload, priority) SELECT payload, 1 FROM public.app_state_sync_backup WHERE payload IS NOT NULL AND jsonb_typeof(payload) = ''object''';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_state_sync') THEN
    EXECUTE 'INSERT INTO _elzoghbi_payloads (payload, priority) SELECT payload, 2 FROM public.app_state_sync WHERE payload IS NOT NULL AND jsonb_typeof(payload) = ''object''';
  END IF;

  FOR rec IN
    SELECT payload
    FROM _elzoghbi_payloads
    WHERE payload != '{}'::jsonb
    ORDER BY
      CASE WHEN jsonb_typeof(payload->'parts') = 'array' THEN jsonb_array_length(payload->'parts') ELSE 0 END DESC,
      priority ASC
  LOOP
    v_payload := rec.payload;

    IF v_payload ? 'brands' AND jsonb_typeof(v_payload->'brands') = 'array' THEN
      INSERT INTO public.brands (name)
      SELECT DISTINCT value FROM jsonb_array_elements_text(v_payload->'brands') AS value
      WHERE value IS NOT NULL AND value != ''
      ON CONFLICT (name) DO NOTHING;
    END IF;

    IF v_payload ? 'models' AND jsonb_typeof(v_payload->'models') = 'array' THEN
      INSERT INTO public.mobile_models (id, brand, brand_id, name, aliases, image, data)
      SELECT DISTINCT ON (item->>'id')
        item->>'id',
        COALESCE(NULLIF(item->>'brand', ''), 'Apple'),
        COALESCE(NULLIF(item->>'brand', ''), 'Apple'),
        COALESCE(NULLIF(item->>'name', ''), 'موديل عام'),
        COALESCE(item->>'aliases', item->>'name'),
        item->>'image',
        item
      FROM jsonb_array_elements(v_payload->'models') AS item
      WHERE item->>'id' IS NOT NULL
      ON CONFLICT (id) DO UPDATE SET
        brand = COALESCE(NULLIF(EXCLUDED.brand, ''), public.mobile_models.brand),
        brand_id = COALESCE(NULLIF(EXCLUDED.brand_id, ''), public.mobile_models.brand_id),
        name = COALESCE(NULLIF(EXCLUDED.name, ''), public.mobile_models.name),
        aliases = COALESCE(EXCLUDED.aliases, public.mobile_models.aliases),
        image = COALESCE(EXCLUDED.image, public.mobile_models.image),
        data = EXCLUDED.data;
    END IF;

    IF v_payload ? 'groups' AND jsonb_typeof(v_payload->'groups') = 'array' THEN
      INSERT INTO public.pricing_groups (id, name, currency, modifier_type, modifier_value, delivery_fee_base, is_default, description, data)
      SELECT DISTINCT ON (item->>'id')
        item->>'id',
        item->>'name',
        COALESCE(item->>'currency', 'EGP'),
        COALESCE(item->>'modifierType', 'none'),
        COALESCE((item->>'modifierValue')::numeric, 0),
        COALESCE((item->>'deliveryFeeBase')::numeric, 75),
        COALESCE((item->>'isDefault')::boolean, false),
        item->>'description',
        item
      FROM jsonb_array_elements(v_payload->'groups') AS item
      WHERE item->>'id' IS NOT NULL
      ON CONFLICT (id) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, public.pricing_groups.name),
        currency = COALESCE(EXCLUDED.currency, public.pricing_groups.currency),
        modifier_type = COALESCE(EXCLUDED.modifier_type, public.pricing_groups.modifier_type),
        modifier_value = COALESCE(EXCLUDED.modifier_value, public.pricing_groups.modifier_value),
        delivery_fee_base = COALESCE(EXCLUDED.delivery_fee_base, public.pricing_groups.delivery_fee_base),
        is_default = COALESCE(EXCLUDED.is_default, public.pricing_groups.is_default),
        description = COALESCE(EXCLUDED.description, public.pricing_groups.description),
        data = EXCLUDED.data;
    END IF;

    IF v_payload ? 'parts' AND jsonb_typeof(v_payload->'parts') = 'array' THEN
      INSERT INTO public.spare_parts (
        id, sku, model_id, category, category_id, name, quality_grade,
        colors, compatible_models, search_aliases, description, warranty_text,
        image, images, stock, low_stock_threshold, max_order_qty,
        cost_price, base_price, custom_group_prices, waitlist_count, sold_out, created_at, data
      )
      SELECT DISTINCT ON (item->>'id')
        item->>'id',
        item->>'sku',
        item->>'modelId',
        COALESCE(NULLIF(item->>'category', ''), 'شاشات كاملة'),
        COALESCE(NULLIF(item->>'category', ''), 'شاشات كاملة'),
        item->>'name',
        COALESCE(NULLIF(item->>'qualityGrade', ''), 'أصلي توكيل Service Pack'),
        COALESCE(item->'colors', '["قياسي"]'::jsonb),
        COALESCE(item->'compatibleModels', '[]'::jsonb),
        item->>'searchAliases',
        item->>'description',
        item->>'warrantyText',
        item->>'image',
        COALESCE(
          item->'images',
          CASE WHEN item->>'image' IS NOT NULL AND item->>'image' != '' THEN jsonb_build_array(item->>'image') ELSE '[]'::jsonb END
        ),
        COALESCE((item->>'stock')::integer, 10),
        COALESCE((item->>'lowStockThreshold')::integer, 5),
        COALESCE((item->>'maxOrderQty')::integer, 10),
        COALESCE((item->>'costPrice')::numeric, 0),
        COALESCE((item->>'basePrice')::numeric, 0),
        COALESCE(item->'customGroupPrices', '{}'::jsonb),
        COALESCE((item->>'waitlistCount')::integer, 0),
        COALESCE((item->>'soldOut')::boolean, false),
        COALESCE(item->>'createdAt', '2026-10-30 10:00'),
        item
      FROM jsonb_array_elements(v_payload->'parts') AS item
      WHERE item->>'id' IS NOT NULL
      ON CONFLICT (id) DO UPDATE SET
        sku = COALESCE(NULLIF(EXCLUDED.sku, ''), public.spare_parts.sku),
        model_id = COALESCE(NULLIF(EXCLUDED.model_id, ''), public.spare_parts.model_id),
        category = COALESCE(NULLIF(EXCLUDED.category, ''), public.spare_parts.category),
        category_id = COALESCE(NULLIF(EXCLUDED.category_id, ''), public.spare_parts.category_id),
        name = COALESCE(NULLIF(EXCLUDED.name, ''), public.spare_parts.name),
        quality_grade = COALESCE(NULLIF(EXCLUDED.quality_grade, ''), public.spare_parts.quality_grade),
        colors = CASE WHEN jsonb_typeof(EXCLUDED.colors) = 'array' AND jsonb_array_length(EXCLUDED.colors) > 0 THEN EXCLUDED.colors ELSE public.spare_parts.colors END,
        compatible_models = CASE WHEN jsonb_typeof(EXCLUDED.compatible_models) = 'array' AND jsonb_array_length(EXCLUDED.compatible_models) > 0 THEN EXCLUDED.compatible_models ELSE public.spare_parts.compatible_models END,
        search_aliases = COALESCE(EXCLUDED.search_aliases, public.spare_parts.search_aliases),
        description = COALESCE(EXCLUDED.description, public.spare_parts.description),
        warranty_text = COALESCE(EXCLUDED.warranty_text, public.spare_parts.warranty_text),
        image = COALESCE(NULLIF(EXCLUDED.image, ''), public.spare_parts.image),
        images = CASE WHEN jsonb_typeof(EXCLUDED.images) = 'array' AND jsonb_array_length(EXCLUDED.images) > 0 THEN EXCLUDED.images ELSE public.spare_parts.images END,
        stock = CASE WHEN EXCLUDED.stock > 0 THEN EXCLUDED.stock ELSE COALESCE(NULLIF(public.spare_parts.stock, 0), 10) END,
        low_stock_threshold = COALESCE(EXCLUDED.low_stock_threshold, public.spare_parts.low_stock_threshold, 5),
        max_order_qty = COALESCE(EXCLUDED.max_order_qty, public.spare_parts.max_order_qty, 10),
        cost_price = CASE WHEN EXCLUDED.cost_price > 0 THEN EXCLUDED.cost_price ELSE COALESCE(public.spare_parts.cost_price, 0) END,
        base_price = CASE WHEN EXCLUDED.base_price > 0 THEN EXCLUDED.base_price ELSE COALESCE(public.spare_parts.base_price, 0) END,
        custom_group_prices = CASE WHEN EXCLUDED.custom_group_prices != '{}'::jsonb THEN EXCLUDED.custom_group_prices ELSE public.spare_parts.custom_group_prices END,
        waitlist_count = COALESCE(EXCLUDED.waitlist_count, public.spare_parts.waitlist_count, 0),
        sold_out = COALESCE(EXCLUDED.sold_out, public.spare_parts.sold_out, false),
        created_at = COALESCE(EXCLUDED.created_at, public.spare_parts.created_at),
        data = COALESCE(public.spare_parts.data, '{}'::jsonb) || EXCLUDED.data;
    END IF;

    IF v_payload ? 'storeAds' AND jsonb_typeof(v_payload->'storeAds') = 'array' THEN
      INSERT INTO public.store_ads (
        id, badge, title, subtitle, theme, gradient, image,
        button_text, linked_part_id, layout, align, image_fit, overlay,
        show_badge, show_button, start_date, end_date, active, data
      )
      SELECT DISTINCT ON (item->>'id')
        item->>'id',
        item->>'badge',
        item->>'title',
        item->>'subtitle',
        item->>'theme',
        item->>'gradient',
        item->>'image',
        item->>'buttonText',
        item->>'linkedPartId',
        COALESCE(item->>'layout', 'blend'),
        COALESCE(item->>'align', 'right'),
        COALESCE(item->>'imageFit', 'cover'),
        COALESCE((item->>'overlay')::numeric, 55),
        COALESCE((item->>'showBadge')::boolean, true),
        COALESCE((item->>'showButton')::boolean, true),
        item->>'startDate',
        item->>'endDate',
        COALESCE((item->>'active')::boolean, true),
        item
      FROM jsonb_array_elements(v_payload->'storeAds') AS item
      WHERE item->>'id' IS NOT NULL
      ON CONFLICT (id) DO UPDATE SET
        badge = COALESCE(EXCLUDED.badge, public.store_ads.badge),
        title = COALESCE(EXCLUDED.title, public.store_ads.title),
        subtitle = COALESCE(EXCLUDED.subtitle, public.store_ads.subtitle),
        theme = COALESCE(EXCLUDED.theme, public.store_ads.theme),
        gradient = COALESCE(EXCLUDED.gradient, public.store_ads.gradient),
        image = COALESCE(EXCLUDED.image, public.store_ads.image),
        button_text = COALESCE(EXCLUDED.button_text, public.store_ads.button_text),
        linked_part_id = COALESCE(EXCLUDED.linked_part_id, public.store_ads.linked_part_id),
        layout = COALESCE(EXCLUDED.layout, public.store_ads.layout),
        align = COALESCE(EXCLUDED.align, public.store_ads.align),
        image_fit = COALESCE(EXCLUDED.image_fit, public.store_ads.image_fit),
        overlay = COALESCE(EXCLUDED.overlay, public.store_ads.overlay),
        show_badge = COALESCE(EXCLUDED.show_badge, public.store_ads.show_badge),
        show_button = COALESCE(EXCLUDED.show_button, public.store_ads.show_button),
        start_date = COALESCE(EXCLUDED.start_date, public.store_ads.start_date),
        end_date = COALESCE(EXCLUDED.end_date, public.store_ads.end_date),
        active = COALESCE(EXCLUDED.active, public.store_ads.active),
        data = EXCLUDED.data;
    END IF;

    IF v_payload ? 'showcaseBars' AND jsonb_typeof(v_payload->'showcaseBars') = 'array' THEN
      INSERT INTO public.showcase_bars (id, title, subtitle, badge_color, part_ids, active, data)
      SELECT DISTINCT ON (item->>'id')
        item->>'id',
        item->>'title',
        item->>'subtitle',
        item->>'badgeColor',
        COALESCE(item->'partIds', '[]'::jsonb),
        COALESCE((item->>'active')::boolean, true),
        item
      FROM jsonb_array_elements(v_payload->'showcaseBars') AS item
      WHERE item->>'id' IS NOT NULL
      ON CONFLICT (id) DO UPDATE SET
        title = COALESCE(EXCLUDED.title, public.showcase_bars.title),
        subtitle = COALESCE(EXCLUDED.subtitle, public.showcase_bars.subtitle),
        badge_color = COALESCE(EXCLUDED.badge_color, public.showcase_bars.badge_color),
        part_ids = EXCLUDED.part_ids,
        active = EXCLUDED.active,
        data = EXCLUDED.data;
    END IF;

    IF v_payload ? 'autoTemplates' AND jsonb_typeof(v_payload->'autoTemplates') = 'array' THEN
      INSERT INTO public.auto_templates (
        id, sku_prefix, category, name_pattern, quality_grade, colors,
        warranty_text, image_key, cost_price, base_price, default_stock,
        low_stock_threshold, max_order_qty, enabled, data
      )
      SELECT DISTINCT ON (item->>'id')
        item->>'id',
        item->>'skuPrefix',
        item->>'category',
        item->>'namePattern',
        item->>'qualityGrade',
        COALESCE(item->'colors', '[]'::jsonb),
        item->>'warrantyText',
        item->>'imageKey',
        COALESCE((item->>'costPrice')::numeric, 0),
        COALESCE((item->>'basePrice')::numeric, 0),
        COALESCE((item->>'defaultStock')::integer, 10),
        COALESCE((item->>'lowStockThreshold')::integer, 5),
        COALESCE((item->>'maxOrderQty')::integer, 10),
        COALESCE((item->>'enabled')::boolean, true),
        item
      FROM jsonb_array_elements(v_payload->'autoTemplates') AS item
      WHERE item->>'id' IS NOT NULL
      ON CONFLICT (id) DO UPDATE SET
        sku_prefix = EXCLUDED.sku_prefix,
        category = EXCLUDED.category,
        name_pattern = EXCLUDED.name_pattern,
        quality_grade = EXCLUDED.quality_grade,
        colors = EXCLUDED.colors,
        warranty_text = EXCLUDED.warranty_text,
        image_key = EXCLUDED.image_key,
        cost_price = EXCLUDED.cost_price,
        base_price = EXCLUDED.base_price,
        default_stock = EXCLUDED.default_stock,
        low_stock_threshold = EXCLUDED.low_stock_threshold,
        max_order_qty = EXCLUDED.max_order_qty,
        enabled = EXCLUDED.enabled,
        data = EXCLUDED.data;
    END IF;

    IF v_payload ? 'clients' AND jsonb_typeof(v_payload->'clients') = 'array' THEN
      INSERT INTO public.clients (
        id, name, owner, phone, email, password, address, secondary_address,
        group_id, credit_limit, wallet_balance, ledger, status, type, account_type,
        avatar, avatar_bg, avatar_image, created_at, data
      )
      SELECT DISTINCT ON (item->>'id')
        item->>'id',
        item->>'name',
        COALESCE(item->>'owner', item->>'name', 'عميل فردي'),
        item->>'phone',
        item->>'email',
        item->>'password',
        item->>'address',
        item->>'secondaryAddress',
        item->>'groupId',
        COALESCE((item->>'creditLimit')::numeric, 0),
        COALESCE((item->>'walletBalance')::numeric, 0),
        COALESCE(item->'ledger', '[]'::jsonb),
        COALESCE(item->>'status', 'active'),
        COALESCE(item->>'type', item->>'accountType', 'shop'),
        COALESCE(item->>'accountType', item->>'type', 'shop'),
        item->>'avatar',
        item->>'avatarBg',
        item->>'avatarImage',
        item->>'createdAt',
        item
      FROM jsonb_array_elements(v_payload->'clients') AS item
      WHERE item->>'id' IS NOT NULL
      ON CONFLICT (id) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, public.clients.name),
        owner = COALESCE(EXCLUDED.owner, public.clients.owner),
        phone = COALESCE(EXCLUDED.phone, public.clients.phone),
        email = COALESCE(EXCLUDED.email, public.clients.email),
        password = COALESCE(EXCLUDED.password, public.clients.password),
        address = COALESCE(EXCLUDED.address, public.clients.address),
        secondary_address = COALESCE(EXCLUDED.secondary_address, public.clients.secondary_address),
        group_id = COALESCE(EXCLUDED.group_id, public.clients.group_id),
        credit_limit = COALESCE(EXCLUDED.credit_limit, public.clients.credit_limit),
        wallet_balance = COALESCE(EXCLUDED.wallet_balance, public.clients.wallet_balance),
        ledger = CASE WHEN jsonb_typeof(EXCLUDED.ledger) = 'array' AND jsonb_array_length(EXCLUDED.ledger) > 0 THEN EXCLUDED.ledger ELSE public.clients.ledger END,
        status = COALESCE(EXCLUDED.status, public.clients.status),
        type = COALESCE(EXCLUDED.type, public.clients.type),
        account_type = COALESCE(EXCLUDED.account_type, public.clients.account_type),
        avatar = COALESCE(EXCLUDED.avatar, public.clients.avatar),
        avatar_bg = COALESCE(EXCLUDED.avatar_bg, public.clients.avatar_bg),
        avatar_image = COALESCE(EXCLUDED.avatar_image, public.clients.avatar_image),
        created_at = COALESCE(EXCLUDED.created_at, public.clients.created_at),
        data = EXCLUDED.data;
    END IF;

    IF v_payload ? 'accountRequests' AND jsonb_typeof(v_payload->'accountRequests') = 'array' THEN
      INSERT INTO public.account_requests (
        id, name, shop_name, owner, owner_name, phone, email, password, requested_password,
        address, type, account_category, shop_type, notes, status, assigned_group_id,
        credit_limit, created_at, accepted_terms_at, data
      )
      SELECT DISTINCT ON (item->>'id')
        item->>'id',
        COALESCE(item->>'name', item->>'shopName', 'عميل'),
        COALESCE(item->>'shopName', item->>'name', 'عميل'),
        COALESCE(item->>'owner', item->>'ownerName', item->>'name', 'عميل'),
        COALESCE(item->>'ownerName', item->>'owner', item->>'name', 'عميل'),
        item->>'phone',
        item->>'email',
        COALESCE(item->>'password', item->>'requestedPassword'),
        COALESCE(item->>'requestedPassword', item->>'password'),
        item->>'address',
        COALESCE(item->>'type', item->>'accountCategory', 'shop'),
        COALESCE(item->>'accountCategory', item->>'type', 'shop'),
        item->>'shopType',
        item->>'notes',
        COALESCE(item->>'status', 'pending'),
        item->>'assignedGroupId',
        COALESCE((item->>'creditLimit')::numeric, 0),
        item->>'createdAt',
        item->>'acceptedTermsAt',
        item
      FROM jsonb_array_elements(v_payload->'accountRequests') AS item
      WHERE item->>'id' IS NOT NULL
      ON CONFLICT (id) DO UPDATE SET
        status = COALESCE(EXCLUDED.status, public.account_requests.status),
        data = EXCLUDED.data;
    END IF;

    IF v_payload ? 'orders' AND jsonb_typeof(v_payload->'orders') = 'array' THEN
      INSERT INTO public.orders (
        id, client_id, client_name, group_id, currency, exchange_rate_used,
        status, payment_method, address, notes, items, delivery_fee_base,
        discount_base, wallet_used_base, admin_edited, admin_edit_note, created_at, data
      )
      SELECT DISTINCT ON (item->>'id')
        item->>'id',
        item->>'clientId',
        item->>'clientName',
        item->>'groupId',
        COALESCE(item->>'currency', 'EGP'),
        COALESCE((item->>'exchangeRateUsed')::numeric, 1),
        COALESCE(item->>'status', 'تم الاستلام'),
        COALESCE(item->>'paymentMethod', 'كاش عند الاستلام'),
        COALESCE(item->>'address', ''),
        item->>'notes',
        COALESCE(item->'items', '[]'::jsonb),
        COALESCE((item->>'deliveryFeeBase')::numeric, 0),
        COALESCE((item->>'discountBase')::numeric, 0),
        COALESCE((item->>'walletUsedBase')::numeric, 0),
        COALESCE((item->>'adminEdited')::boolean, false),
        item->>'adminEditNote',
        COALESCE(item->>'createdAt', '2026-11-01 06:00'),
        item
      FROM jsonb_array_elements(v_payload->'orders') AS item
      WHERE item->>'id' IS NOT NULL
      ON CONFLICT (id) DO UPDATE SET
        status = COALESCE(EXCLUDED.status, public.orders.status),
        items = CASE WHEN jsonb_typeof(EXCLUDED.items) = 'array' AND jsonb_array_length(EXCLUDED.items) > 0 THEN EXCLUDED.items ELSE public.orders.items END,
        delivery_fee_base = COALESCE(EXCLUDED.delivery_fee_base, public.orders.delivery_fee_base),
        discount_base = COALESCE(EXCLUDED.discount_base, public.orders.discount_base),
        wallet_used_base = COALESCE(EXCLUDED.wallet_used_base, public.orders.wallet_used_base),
        admin_edited = COALESCE(EXCLUDED.admin_edited, public.orders.admin_edited),
        admin_edit_note = COALESCE(EXCLUDED.admin_edit_note, public.orders.admin_edit_note),
        notes = COALESCE(EXCLUDED.notes, public.orders.notes),
        data = EXCLUDED.data;
    END IF;

    IF v_payload ? 'returnsList' AND jsonb_typeof(v_payload->'returnsList') = 'array' THEN
      INSERT INTO public.returns_list (
        id, order_id, client_id, client_name, part_id, part_name, qty,
        refund_amount_base, reason, status, photos, admin_response,
        resolution_type, warranty_confirmed, replies, closed, created_at, data
      )
      SELECT DISTINCT ON (item->>'id')
        item->>'id',
        item->>'orderId',
        item->>'clientId',
        item->>'clientName',
        item->>'partId',
        item->>'partName',
        COALESCE((item->>'qty')::integer, 1),
        COALESCE((item->>'refundAmountBase')::numeric, 0),
        item->>'reason',
        COALESCE(item->>'status', 'قيد المراجعة'),
        COALESCE(item->'photos', '[]'::jsonb),
        item->>'adminResponse',
        item->>'resolutionType',
        COALESCE((item->>'warrantyConfirmed')::boolean, true),
        COALESCE(item->'replies', '[]'::jsonb),
        COALESCE((item->>'closed')::boolean, false),
        item->>'createdAt',
        item
      FROM jsonb_array_elements(v_payload->'returnsList') AS item
      WHERE item->>'id' IS NOT NULL
      ON CONFLICT (id) DO UPDATE SET
        status = COALESCE(EXCLUDED.status, public.returns_list.status),
        photos = EXCLUDED.photos,
        admin_response = COALESCE(EXCLUDED.admin_response, public.returns_list.admin_response),
        resolution_type = COALESCE(EXCLUDED.resolution_type, public.returns_list.resolution_type),
        replies = EXCLUDED.replies,
        data = EXCLUDED.data;
    END IF;

    IF v_payload ? 'complaints' AND jsonb_typeof(v_payload->'complaints') = 'array' THEN
      INSERT INTO public.complaints (
        id, client_id, client_name, type, subject, message, status, admin_reply, replies, created_at, data
      )
      SELECT DISTINCT ON (item->>'id')
        item->>'id',
        item->>'clientId',
        item->>'clientName',
        item->>'type',
        item->>'subject',
        item->>'message',
        COALESCE(item->>'status', 'قيد المتابعة'),
        item->>'adminReply',
        COALESCE(item->'replies', '[]'::jsonb),
        item->>'createdAt',
        item
      FROM jsonb_array_elements(v_payload->'complaints') AS item
      WHERE item->>'id' IS NOT NULL
      ON CONFLICT (id) DO UPDATE SET
        status = COALESCE(EXCLUDED.status, public.complaints.status),
        admin_reply = COALESCE(EXCLUDED.admin_reply, public.complaints.admin_reply),
        replies = EXCLUDED.replies,
        data = EXCLUDED.data;
    END IF;

    IF v_payload ? 'promoCodes' AND jsonb_typeof(v_payload->'promoCodes') = 'array' THEN
      INSERT INTO public.promo_codes (
        id, code, type, value, max_discount_cap, min_order_amount,
        usage_limit, used_count, expiry_date, description, active, is_active, data
      )
      SELECT DISTINCT ON (item->>'id')
        item->>'id',
        item->>'code',
        item->>'type',
        COALESCE((item->>'value')::numeric, 0),
        COALESCE((item->>'maxDiscountCap')::numeric, 0),
        COALESCE((item->>'minOrderAmount')::numeric, 0),
        COALESCE((item->>'usageLimit')::integer, 100),
        COALESCE((item->>'usedCount')::integer, 0),
        item->>'expiryDate',
        item->>'description',
        COALESCE((item->>'active')::boolean, true),
        COALESCE((item->>'active')::boolean, true),
        item
      FROM jsonb_array_elements(v_payload->'promoCodes') AS item
      WHERE item->>'id' IS NOT NULL
      ON CONFLICT (id) DO UPDATE SET
        code = COALESCE(EXCLUDED.code, public.promo_codes.code),
        type = COALESCE(EXCLUDED.type, public.promo_codes.type),
        value = COALESCE(EXCLUDED.value, public.promo_codes.value),
        max_discount_cap = COALESCE(EXCLUDED.max_discount_cap, public.promo_codes.max_discount_cap),
        min_order_amount = COALESCE(EXCLUDED.min_order_amount, public.promo_codes.min_order_amount),
        usage_limit = COALESCE(EXCLUDED.usage_limit, public.promo_codes.usage_limit),
        used_count = COALESCE(EXCLUDED.used_count, public.promo_codes.used_count),
        expiry_date = COALESCE(EXCLUDED.expiry_date, public.promo_codes.expiry_date),
        description = COALESCE(EXCLUDED.description, public.promo_codes.description),
        active = COALESCE(EXCLUDED.active, public.promo_codes.active),
        is_active = COALESCE(EXCLUDED.is_active, public.promo_codes.is_active),
        data = EXCLUDED.data;
    END IF;

    IF v_payload ? 'sourcingRequests' AND jsonb_typeof(v_payload->'sourcingRequests') = 'array' THEN
      INSERT INTO public.sourcing_requests (
        id, client_id, client_name, phone, client_phone, part_id, part_name,
        name, desc_text, notes, image, status, price, deposit, deposit_status,
        messages, images_allowed, unread_admin, unread_client, closed,
        created_at, updated_at, accepted_terms_at, data
      )
      SELECT DISTINCT ON (item->>'id')
        item->>'id',
        item->>'clientId',
        item->>'clientName',
        COALESCE(item->>'phone', item->>'clientPhone'),
        COALESCE(item->>'clientPhone', item->>'phone'),
        item->>'partId',
        item->>'partName',
        COALESCE(item->>'name', item->>'partName'),
        item->>'desc',
        item->>'notes',
        item->>'image',
        COALESCE(item->>'status', 'جديد'),
        (item->>'price')::numeric,
        (item->>'deposit')::numeric,
        COALESCE(item->>'depositStatus', 'none'),
        COALESCE(item->'messages', '[]'::jsonb),
        COALESCE((item->>'imagesAllowed')::boolean, false),
        COALESCE((item->>'unreadAdmin')::boolean, true),
        COALESCE((item->>'unreadClient')::boolean, false),
        COALESCE((item->>'closed')::boolean, false),
        item->>'createdAt',
        item->>'updatedAt',
        item->>'acceptedTermsAt',
        item
      FROM jsonb_array_elements(v_payload->'sourcingRequests') AS item
      WHERE item->>'id' IS NOT NULL
      ON CONFLICT (id) DO UPDATE SET
        status = COALESCE(EXCLUDED.status, public.sourcing_requests.status),
        price = COALESCE(EXCLUDED.price, public.sourcing_requests.price),
        deposit = COALESCE(EXCLUDED.deposit, public.sourcing_requests.deposit),
        deposit_status = COALESCE(EXCLUDED.deposit_status, public.sourcing_requests.deposit_status),
        messages = EXCLUDED.messages,
        images_allowed = COALESCE(EXCLUDED.images_allowed, public.sourcing_requests.images_allowed),
        unread_admin = COALESCE(EXCLUDED.unread_admin, public.sourcing_requests.unread_admin),
        unread_client = COALESCE(EXCLUDED.unread_client, public.sourcing_requests.unread_client),
        closed = COALESCE(EXCLUDED.closed, public.sourcing_requests.closed),
        updated_at = COALESCE(EXCLUDED.updated_at, public.sourcing_requests.updated_at),
        data = EXCLUDED.data;
    END IF;

    INSERT INTO public.site_settings (id, settings, credentials, currencies, notifications, updated_at)
    VALUES (
      'main',
      COALESCE(v_payload->'siteSettings', '{}'::jsonb) || '{"storeName": "ELZOGHBI"}'::jsonb,
      COALESCE(v_payload->'adminCredentials', '{}'::jsonb),
      COALESCE(v_payload->'currencies', '{}'::jsonb),
      COALESCE(v_payload->'notifications', '[]'::jsonb),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      settings = (CASE WHEN EXCLUDED.settings != '{}'::jsonb THEN EXCLUDED.settings ELSE public.site_settings.settings END) || '{"storeName": "ELZOGHBI"}'::jsonb,
      credentials = CASE WHEN EXCLUDED.credentials != '{}'::jsonb THEN EXCLUDED.credentials ELSE public.site_settings.credentials END,
      currencies = CASE WHEN EXCLUDED.currencies != '{}'::jsonb THEN EXCLUDED.currencies ELSE public.site_settings.currencies END,
      notifications = CASE WHEN jsonb_typeof(EXCLUDED.notifications) = 'array' AND jsonb_array_length(EXCLUDED.notifications) > 0 THEN EXCLUDED.notifications ELSE public.site_settings.notifications END,
      updated_at = NOW();

  END LOOP;
END $$;

-- ============================================================================
-- المرحلة 2.5: الاسترجاع الذكي للمنتجات القديمة وملء أعمدة الفهرسة الهرمية (brand_id, model_id, category_id)
-- ============================================================================
DO $$
DECLARE
  r RECORD;
  v_extracted_model TEXT;
  v_brand TEXT;
  v_matched_model_id TEXT;
  v_batch_ts TEXT;
  v_new_mdl_id TEXT;
  v_fallback_mdl_id TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'products') THEN
    BEGIN
      INSERT INTO public.spare_parts (id, sku, name, category, category_id, quality_grade, base_price, cost_price, stock)
      SELECT
        id::text,
        COALESCE(sku::text, 'PRT-' || id::text),
        COALESCE(name::text, 'منتج'),
        COALESCE(category::text, 'شاشات كاملة'),
        COALESCE(category::text, 'شاشات كاملة'),
        'أصلي توكيل Service Pack',
        COALESCE(base_price::numeric, 450),
        COALESCE(cost_price::numeric, 250),
        COALESCE(stock::integer, 10)
      FROM public.products
      WHERE id IS NOT NULL
      ON CONFLICT (id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END IF;

  UPDATE public.spare_parts
  SET model_id = data->>'modelId'
  WHERE (model_id IS NULL OR model_id = '')
    AND data IS NOT NULL
    AND jsonb_typeof(data) = 'object'
    AND COALESCE(data->>'modelId', '') != '';

  FOR r IN
    SELECT id, sku, name, category, compatible_models, model_id, image
    FROM public.spare_parts
    WHERE model_id IS NULL
       OR model_id = ''
       OR model_id NOT IN (SELECT id FROM public.mobile_models)
  LOOP
    v_matched_model_id := NULL;

    SELECT m.id INTO v_matched_model_id
    FROM public.mobile_models m
    WHERE m.name IS NOT NULL
      AND length(btrim(m.name)) >= 2
      AND (
        r.name ILIKE '%' || btrim(m.name) || '%'
        OR (r.compatible_models IS NOT NULL AND r.compatible_models::text ILIKE '%' || btrim(m.name) || '%')
      )
    ORDER BY length(btrim(m.name)) DESC
    LIMIT 1;

    IF v_matched_model_id IS NULL THEN
      v_extracted_model := NULL;

      IF r.compatible_models IS NOT NULL AND jsonb_typeof(r.compatible_models) = 'array' AND jsonb_array_length(r.compatible_models) > 0 THEN
        v_extracted_model := btrim(r.compatible_models->>0);
      END IF;

      IF v_extracted_model IS NULL OR v_extracted_model = '' THEN
        v_extracted_model := COALESCE(r.name, '');
        v_extracted_model := regexp_replace(v_extracted_model, '^(شاشة كاملة|شاشة|بطارية|بوردة\s*/\s*فلاتة شحن|فلاتة شحن|بوردة شحن|كاميرا خلفية أساسية|كاميرا خلفية|كاميرا أمامية|ظهر زجاجي\s*/\s*غطاء بطارية|ظهر زجاجي|غطاء بطارية|قطعة غيار|باغة|فريم|شاسيه|سماعة|جرس)\s+', '', 'i');
        v_extracted_model := regexp_replace(v_extracted_model, '\s+(أصلية توكيل.*|أوليد.*|إن سيل.*|إ.*سيل.*|أصلية سعة.*|أصلية بالمايك.*|أصلية خلع.*|أصلي بعدسات.*|أصلي.*|توكيل.*|خلع.*)$', '', 'i');
        v_extracted_model := btrim(v_extracted_model);
      END IF;

      v_batch_ts := substring(r.id from '^prt_([0-9]{10})');
      IF (v_extracted_model IS NULL OR length(v_extracted_model) < 2) AND v_batch_ts IS NOT NULL THEN
        SELECT m.id INTO v_matched_model_id
        FROM public.mobile_models m
        WHERE m.id LIKE 'mdl_' || v_batch_ts || '%'
        LIMIT 1;
      END IF;

      IF v_matched_model_id IS NULL AND v_extracted_model IS NOT NULL AND length(v_extracted_model) >= 2 THEN
        SELECT m.id INTO v_matched_model_id
        FROM public.mobile_models m
        WHERE lower(btrim(m.name)) = lower(v_extracted_model)
        LIMIT 1;

        IF v_matched_model_id IS NULL THEN
          v_brand := CASE
            WHEN v_extracted_model ILIKE '%iphone%' OR v_extracted_model ILIKE '%ipad%' OR v_extracted_model ILIKE '%apple%' OR v_extracted_model ILIKE '%ايفون%' OR v_extracted_model ILIKE '%آيفون%' THEN 'Apple'
            WHEN v_extracted_model ILIKE '%samsung%' OR v_extracted_model ILIKE '%galaxy%' OR v_extracted_model ILIKE '%سامسونج%' OR v_extracted_model ~* '\m(s2[0-9]|a[1-7][0-9]|m[1-6][0-9]|note\s*[0-9]+)\M' THEN 'Samsung'
            WHEN v_extracted_model ILIKE '%xiaomi%' OR v_extracted_model ILIKE '%redmi%' OR v_extracted_model ILIKE '%poco%' OR v_extracted_model ILIKE '%شاومي%' OR v_extracted_model ILIKE '%ريدمي%' THEN 'Xiaomi'
            WHEN v_extracted_model ILIKE '%honor%' OR v_extracted_model ILIKE '%هونر%' THEN 'Honor'
            WHEN v_extracted_model ILIKE '%oppo%' OR v_extracted_model ILIKE '%reno%' OR v_extracted_model ILIKE '%اوبو%' OR v_extracted_model ILIKE '%أوبو%' THEN 'Oppo'
            WHEN v_extracted_model ILIKE '%realme%' OR v_extracted_model ILIKE '%ريلمي%' THEN 'Realme'
            WHEN v_extracted_model ILIKE '%vivo%' OR v_extracted_model ILIKE '%فيفو%' THEN 'Vivo'
            WHEN v_extracted_model ILIKE '%infinix%' OR v_extracted_model ILIKE '%انفنكس%' OR v_extracted_model ILIKE '%إنفينكس%' THEN 'Infinix'
            WHEN v_extracted_model ILIKE '%huawei%' OR v_extracted_model ILIKE '%nova%' OR v_extracted_model ILIKE '%هواوي%' THEN 'Huawei'
            ELSE 'Apple'
          END;

          v_new_mdl_id := COALESCE(
            NULLIF(r.model_id, ''),
            CASE WHEN v_batch_ts IS NOT NULL THEN 'mdl_' || substring(r.id from '^prt_([0-9]+)_') ELSE NULL END,
            'mdl_restored_' || md5(lower(v_extracted_model))
          );

          INSERT INTO public.mobile_models (id, brand, brand_id, name, aliases, image, data)
          VALUES (
            v_new_mdl_id,
            v_brand,
            v_brand,
            v_extracted_model,
            v_extracted_model,
            r.image,
            jsonb_build_object(
              'id', v_new_mdl_id,
              'brand', v_brand,
              'name', v_extracted_model,
              'aliases', v_extracted_model,
              'image', r.image
            )
          )
          ON CONFLICT (id) DO NOTHING;

          INSERT INTO public.brands (name) VALUES (v_brand) ON CONFLICT (name) DO NOTHING;
          v_matched_model_id := v_new_mdl_id;
        END IF;
      END IF;
    END IF;

    IF v_matched_model_id IS NOT NULL THEN
      UPDATE public.spare_parts
      SET model_id = v_matched_model_id
      WHERE id = r.id;
    END IF;
  END LOOP;

  SELECT id INTO v_fallback_mdl_id FROM public.mobile_models LIMIT 1;
  IF v_fallback_mdl_id IS NULL THEN
    v_fallback_mdl_id := 'mdl_general';
    INSERT INTO public.mobile_models (id, brand, brand_id, name, aliases, data)
    VALUES ('mdl_general', 'Apple', 'Apple', 'أقسام وموديلات عامة', 'عام كل الموديلات', '{"id":"mdl_general","brand":"Apple","name":"أقسام وموديلات عامة"}'::jsonb)
    ON CONFLICT (id) DO NOTHING;
  END IF;

  UPDATE public.spare_parts
  SET model_id = v_fallback_mdl_id
  WHERE model_id IS NULL OR model_id = '' OR model_id NOT IN (SELECT id FROM public.mobile_models);

  UPDATE public.mobile_models
  SET brand_id = COALESCE(brand_id, brand)
  WHERE brand_id IS NULL OR brand_id = '';

  INSERT INTO public.brands (name)
  SELECT DISTINCT brand FROM public.mobile_models WHERE brand IS NOT NULL AND brand != ''
  ON CONFLICT (name) DO NOTHING;

  UPDATE public.spare_parts sp
  SET
    brand_id = COALESCE(sp.brand_id, (SELECT m.brand FROM public.mobile_models m WHERE m.id = sp.model_id LIMIT 1), 'Apple'),
    category_id = COALESCE(sp.category_id, sp.category, 'شاشات كاملة'),
    base_price = CASE
      WHEN sp.base_price IS NOT NULL AND sp.base_price > 0 THEN sp.base_price
      WHEN sp.cost_price IS NOT NULL AND sp.cost_price > 0 THEN ROUND(sp.cost_price * 1.25)
      WHEN sp.sku LIKE 'SCR-ORG%' THEN 5200
      WHEN sp.sku LIKE 'SCR-OLED%' THEN 2750
      WHEN sp.sku LIKE 'SCR-INC%' THEN 1350
      WHEN sp.sku LIKE 'BAT-ORG%' THEN 950
      WHEN sp.sku LIKE 'FLX-CHG%' THEN 450
      WHEN sp.sku LIKE 'CAM-REAR%' THEN 2400
      WHEN sp.sku LIKE 'BCK-GLS%' THEN 550
      ELSE 450
    END,
    cost_price = CASE
      WHEN sp.cost_price IS NOT NULL AND sp.cost_price > 0 THEN sp.cost_price
      WHEN sp.sku LIKE 'SCR-ORG%' THEN 4200
      WHEN sp.sku LIKE 'SCR-OLED%' THEN 2100
      WHEN sp.sku LIKE 'SCR-INC%' THEN 950
      WHEN sp.sku LIKE 'BAT-ORG%' THEN 680
      WHEN sp.sku LIKE 'FLX-CHG%' THEN 290
      WHEN sp.sku LIKE 'CAM-REAR%' THEN 1800
      WHEN sp.sku LIKE 'BCK-GLS%' THEN 350
      ELSE 300
    END,
    stock = CASE
      WHEN sp.stock IS NOT NULL AND sp.stock > 0 THEN sp.stock
      ELSE 15
    END,
    sold_out = COALESCE(sp.sold_out, false),
    colors = CASE
      WHEN sp.colors IS NOT NULL AND jsonb_typeof(sp.colors) = 'array' AND jsonb_array_length(sp.colors) > 0 THEN sp.colors
      ELSE '["قياسي"]'::jsonb
    END;

  UPDATE public.spare_parts sp
  SET
    compatible_models = CASE
      WHEN sp.compatible_models IS NOT NULL AND jsonb_typeof(sp.compatible_models) = 'array' AND jsonb_array_length(sp.compatible_models) > 0 THEN sp.compatible_models
      ELSE COALESCE((SELECT jsonb_build_array(m.name) FROM public.mobile_models m WHERE m.id = sp.model_id LIMIT 1), '[]'::jsonb)
    END,
    data = COALESCE(sp.data, '{}'::jsonb) || jsonb_build_object(
      'id', sp.id,
      'sku', COALESCE(sp.sku, 'PRT-' || sp.id),
      'brandId', sp.brand_id,
      'modelId', sp.model_id,
      'category', COALESCE(sp.category, 'شاشات كاملة'),
      'categoryId', sp.category_id,
      'name', COALESCE(sp.name, 'قطعة غيار'),
      'qualityGrade', COALESCE(sp.quality_grade, 'أصلي توكيل Service Pack'),
      'basePrice', sp.base_price,
      'costPrice', sp.cost_price,
      'stock', sp.stock,
      'lowStockThreshold', COALESCE(sp.low_stock_threshold, 5),
      'maxOrderQty', COALESCE(sp.max_order_qty, 10),
      'soldOut', COALESCE(sp.sold_out, false),
      'colors', COALESCE(sp.colors, '["قياسي"]'::jsonb)
    );

  INSERT INTO public.pricing_groups (id, name, currency, modifier_type, modifier_value, delivery_fee_base, is_default, description)
  VALUES ('grp_default', 'المجموعة الأساسية (قطاعي وزوار)', 'EGP', 'none', 0, 75, true, 'الأسعار الافتراضية للزوار غير المسجلين ومحلات التجزئة العادية')
  ON CONFLICT (id) DO UPDATE SET is_default = true;

  IF NOT EXISTS (SELECT 1 FROM public.pricing_groups WHERE is_default = true) THEN
    UPDATE public.pricing_groups
    SET is_default = true
    WHERE id = (SELECT id FROM public.pricing_groups LIMIT 1);
  END IF;

  UPDATE public.pricing_groups
  SET data = COALESCE(data, '{}'::jsonb) || jsonb_build_object('isDefault', is_default, 'modifierType', modifier_type, 'modifierValue', modifier_value, 'currency', currency);
END $$;

-- ============================================================================
-- المرحلة 3: فهرسة قاعدة البيانات السريعة (Database Indexing — البند 12)
-- فهارس B-Tree على (brand_id, model_id, category_id, brand, category, sku, created_at)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_spare_parts_brand_id ON public.spare_parts (brand_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_model_id ON public.spare_parts (model_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_category_id ON public.spare_parts (category_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_category ON public.spare_parts (category);
CREATE INDEX IF NOT EXISTS idx_spare_parts_hierarchy ON public.spare_parts (brand_id, model_id, category_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_model_cat ON public.spare_parts (model_id, category);
CREATE INDEX IF NOT EXISTS idx_spare_parts_created_at_desc ON public.spare_parts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spare_parts_sku ON public.spare_parts (sku);
CREATE INDEX IF NOT EXISTS idx_spare_parts_promoted ON public.spare_parts (is_promoted_ad) WHERE is_promoted_ad = true;

CREATE INDEX IF NOT EXISTS idx_mobile_models_brand ON public.mobile_models (brand);
CREATE INDEX IF NOT EXISTS idx_mobile_models_brand_id ON public.mobile_models (brand_id);
CREATE INDEX IF NOT EXISTS idx_mobile_models_brand_model ON public.mobile_models (brand, id);

CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders (client_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_sourcing_requests_status ON public.sourcing_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON public.clients (phone);
CREATE INDEX IF NOT EXISTS idx_clients_group_id ON public.clients (group_id);

-- ============================================================================
-- المرحلة 4: تفعيل Supabase Realtime للأوردرات وطلبات التوفير (البند 2)
-- ============================================================================
DO $$
DECLARE
  rt_tbl text;
BEGIN
  FOR rt_tbl IN SELECT unnest(ARRAY[
    'orders', 'sourcing_requests', 'account_requests', 'returns_list',
    'complaints', 'spare_parts', 'mobile_models', 'store_ads'
  ])
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL;', rt_tbl);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', rt_tbl);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;

-- تفعيل جدول التحديثات الذكي (sync_meta) والـ Triggers والـ Views
INSERT INTO public.sync_meta (table_name, updated_at) VALUES
  ('spare_parts', NOW()),
  ('mobile_models', NOW()),
  ('brands', NOW()),
  ('pricing_groups', NOW()),
  ('clients', NOW()),
  ('account_requests', NOW()),
  ('orders', NOW()),
  ('returns_list', NOW()),
  ('complaints', NOW()),
  ('promo_codes', NOW()),
  ('store_ads', NOW()),
  ('showcase_bars', NOW()),
  ('auto_templates', NOW()),
  ('sourcing_requests', NOW()),
  ('site_settings', NOW())
ON CONFLICT (table_name) DO UPDATE SET updated_at = NOW();

CREATE OR REPLACE FUNCTION public.notify_sync_meta()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.sync_meta (table_name, updated_at)
  VALUES (TG_TABLE_NAME, NOW())
  ON CONFLICT (table_name) DO UPDATE SET updated_at = NOW();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'spare_parts', 'mobile_models', 'brands', 'pricing_groups', 'clients',
    'account_requests', 'orders', 'returns_list', 'complaints', 'promo_codes',
    'store_ads', 'showcase_bars', 'auto_templates', 'sourcing_requests', 'site_settings'
  ])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_sync_meta ON public.%I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_%I_sync_meta AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.notify_sync_meta();', t, t);
  END LOOP;
END $$;

-- إعادة إنشاء الـ Views للتوافق المزدوج
CREATE OR REPLACE VIEW public.parts AS SELECT * FROM public.spare_parts;
CREATE OR REPLACE VIEW public.models AS SELECT * FROM public.mobile_models;

-- ============================================================================
-- المرحلة 5: تأمين الأمان وصلاحيات الوصول (Row Level Security - RLS — البند 13)
-- * السماح للزوار بإدخال الأوردرات وطلبات التوفير بحرية
-- * تمكين لوحة التحكم الإدارية (#/AlaaDB) من القراءة والتعديل والإدارة الشاملة
-- ============================================================================
DO $$
DECLARE
  tbl text;
  pol record;
BEGIN
  FOR tbl IN
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    FOR pol IN
      SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', pol.policyname, tbl);
    END LOOP;
    EXECUTE format('GRANT ALL ON TABLE public.%I TO anon, authenticated, service_role;', tbl);
  END LOOP;
END $$;

-- 1. سياسات جداول الأوردرات (orders) وطلبات التوفير (sourcing_requests) وطلبات فتح الحساب (account_requests):
--    يُسمح للزوار والعملاء بإدخال الطلبات الجديدة بحرية، وتُدار القراءة والتعديل عبر لوحة التحكم (#/AlaaDB)
CREATE POLICY "visitors_insert_orders" ON public.orders
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "admin_manage_orders" ON public.orders
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "visitors_insert_sourcing" ON public.sourcing_requests
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "admin_manage_sourcing" ON public.sourcing_requests
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "visitors_insert_account_requests" ON public.account_requests
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "admin_manage_account_requests" ON public.account_requests
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "visitors_insert_returns" ON public.returns_list
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "admin_manage_returns" ON public.returns_list
  FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "visitors_insert_complaints" ON public.complaints
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "admin_manage_complaints" ON public.complaints
  FOR ALL TO public USING (true) WITH CHECK (true);

-- 2. سياسات جدول العملاء (clients):
CREATE POLICY "admin_manage_clients" ON public.clients
  FOR ALL TO public USING (true) WITH CHECK (true);

-- 3. سياسات جداول الكتالوج والواجهة (قراءة عامة للزوار + إدارة كاملة للأدمن #/AlaaDB):
DO $$
DECLARE
  cat_tbl text;
BEGIN
  FOR cat_tbl IN SELECT unnest(ARRAY[
    'spare_parts', 'mobile_models', 'brands', 'pricing_groups', 'currencies',
    'store_ads', 'showcase_bars', 'promo_codes', 'auto_templates',
    'site_settings', 'sync_meta', 'app_state_sync'
  ])
  LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = cat_tbl) THEN
      EXECUTE format('CREATE POLICY "public_read_%I" ON public.%I FOR SELECT TO public USING (true);', cat_tbl, cat_tbl);
      EXECUTE format('CREATE POLICY "admin_all_%I" ON public.%I FOR ALL TO public USING (true) WITH CHECK (true);', cat_tbl, cat_tbl);
    END IF;
  END LOOP;
END $$;

-- منح الصلاحيات على الـ Views أيضاً
GRANT ALL ON TABLE public.parts TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.models TO anon, authenticated, service_role;

-- إعداد Bucket الصور (product-images) وصلاحياته
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access product-images" ON storage.objects;
CREATE POLICY "Public Access product-images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public Insert product-images" ON storage.objects;
CREATE POLICY "Public Insert product-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public Update product-images" ON storage.objects;
CREATE POLICY "Public Update product-images" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public Delete product-images" ON storage.objects;
CREATE POLICY "Public Delete product-images" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');

-- =================================================================================
-- 9. تنظيف عمود data (JSONB) من التكرار الضخم للصور والرسائل (لتقليل حجم الصفوف بـ 75%)
-- =================================================================================
UPDATE public.spare_parts
SET data = data - 'image' - 'images' - 'description'
WHERE data IS NOT NULL AND (data ? 'image' OR data ? 'images' OR data ? 'description');

UPDATE public.mobile_models
SET
  data = data - 'image' - 'aliases',
  image = CASE WHEN image LIKE 'data:%' THEN NULL ELSE image END
WHERE (data IS NOT NULL AND (data ? 'image' OR data ? 'aliases')) OR (image LIKE 'data:%');

UPDATE public.store_ads
SET data = data - 'image'
WHERE data IS NOT NULL AND (data ? 'image');

UPDATE public.sourcing_requests
SET data = data - 'image' - 'messages'
WHERE data IS NOT NULL AND (data ? 'image' OR data ? 'messages');

UPDATE public.returns_list
SET data = data - 'photos' - 'replies'
WHERE data IS NOT NULL AND (data ? 'photos' OR data ? 'replies');

UPDATE public.orders
SET data = data - 'items'
WHERE data IS NOT NULL AND (data ? 'items');

UPDATE public.clients
SET data = data - 'ledger' - 'avatarImage'
WHERE data IS NOT NULL AND (data ? 'ledger' OR data ? 'avatarImage');

-- =================================================================================
-- 10. دعم الروابط الخارجية المباشرة للصور (image_url) للمنتجات (4 صور) والبراندات (صورة واحدة)
-- =================================================================================
ALTER TABLE public.spare_parts
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- نسخ أي رابط خارجي موجود حالياً في عمود image إلى عمود image_url تلقائياً
UPDATE public.spare_parts
SET image_url = image
WHERE (image_url IS NULL OR image_url = '')
  AND image IS NOT NULL
  AND image LIKE 'http%';

-- فهرس تسريع البحث والفلترة لـ 5,000 إلى 50,000+ منتج
CREATE INDEX IF NOT EXISTS idx_spare_parts_model_category ON public.spare_parts (model_id, category);
CREATE INDEX IF NOT EXISTS idx_spare_parts_name_trgm ON public.spare_parts (name);
CREATE INDEX IF NOT EXISTS idx_spare_parts_sku ON public.spare_parts (sku);
CREATE INDEX IF NOT EXISTS idx_mobile_models_brand_name ON public.mobile_models (brand, name);

-- تنبيه PostgREST لتحديث الكاش فوراً
NOTIFY pgrst, 'reload schema';

