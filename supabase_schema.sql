-- ============================================================================
-- H-Market Production Database Schema (v7.0.0 Normalized Tables)
-- Fixes Supabase Egress Quota by transitioning from monolithic JSON to independent tables
-- ============================================================================

-- 1. SPACING PARTS / PRODUCTS (قطع الغيار والمنتجات)
CREATE TABLE IF NOT EXISTS public.parts (
  id TEXT PRIMARY KEY,
  "createdAt" TEXT,
  sku TEXT,
  "modelId" TEXT,
  category TEXT,
  name TEXT,
  "qualityGrade" TEXT,
  colors JSONB DEFAULT '[]'::jsonb,
  "compatibleModels" JSONB DEFAULT '[]'::jsonb,
  "searchAliases" TEXT,
  description TEXT,
  "warrantyText" TEXT,
  image TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  stock INTEGER DEFAULT 0,
  "lowStockThreshold" INTEGER DEFAULT 5,
  "costPrice" NUMERIC DEFAULT 0,
  "basePrice" NUMERIC DEFAULT 0,
  "maxOrderQty" INTEGER,
  "customGroupPrices" JSONB DEFAULT '{}'::jsonb,
  "waitlistCount" INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MOBILE MODELS (الموديلات)
CREATE TABLE IF NOT EXISTS public.models (
  id TEXT PRIMARY KEY,
  brand TEXT,
  name TEXT,
  aliases TEXT,
  image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BRANDS (الماركات)
CREATE TABLE IF NOT EXISTS public.brands (
  name TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PRICING GROUPS (مجموعات التسعير)
CREATE TABLE IF NOT EXISTS public.pricing_groups (
  id TEXT PRIMARY KEY,
  name TEXT,
  currency TEXT DEFAULT 'EGP',
  "modifierType" TEXT DEFAULT 'none',
  "modifierValue" NUMERIC DEFAULT 0,
  "deliveryFeeBase" NUMERIC DEFAULT 75,
  "isDefault" BOOLEAN DEFAULT FALSE,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. CLIENTS / SHOPS (العملاء والمحلات المسجلة)
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  name TEXT,
  owner TEXT,
  phone TEXT,
  email TEXT,
  password TEXT,
  address TEXT,
  "secondaryAddress" TEXT,
  "groupId" TEXT,
  "creditLimit" NUMERIC DEFAULT 0,
  "walletBalance" NUMERIC DEFAULT 0,
  ledger JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active',
  type TEXT DEFAULT 'shop',
  avatar TEXT,
  "avatarBg" TEXT,
  "avatarImage" TEXT,
  "createdAt" TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ACCOUNT REQUESTS (طلبات فتح الحسابات الجديدة)
CREATE TABLE IF NOT EXISTS public.account_requests (
  id TEXT PRIMARY KEY,
  name TEXT,
  owner TEXT,
  phone TEXT,
  email TEXT,
  password TEXT,
  address TEXT,
  type TEXT DEFAULT 'shop',
  status TEXT DEFAULT 'pending',
  "assignedGroupId" TEXT,
  "creditLimit" NUMERIC DEFAULT 0,
  "createdAt" TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ORDERS / INVOICES (الطلبات والفواتير)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  "clientId" TEXT,
  "clientName" TEXT,
  "groupId" TEXT,
  currency TEXT DEFAULT 'EGP',
  "exchangeRateUsed" NUMERIC DEFAULT 1,
  status TEXT DEFAULT 'تم الاستلام',
  "paymentMethod" TEXT,
  address TEXT,
  notes TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  "deliveryFeeBase" NUMERIC DEFAULT 0,
  "discountBase" NUMERIC DEFAULT 0,
  "walletUsedBase" NUMERIC DEFAULT 0,
  "adminEdited" BOOLEAN DEFAULT FALSE,
  "adminEditNote" TEXT,
  "createdAt" TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. RETURNS (المرتجعات والضمان)
CREATE TABLE IF NOT EXISTS public.returns_list (
  id TEXT PRIMARY KEY,
  "orderId" TEXT,
  "clientId" TEXT,
  "clientName" TEXT,
  "partId" TEXT,
  "partName" TEXT,
  qty INTEGER DEFAULT 1,
  "refundAmountBase" NUMERIC DEFAULT 0,
  reason TEXT,
  status TEXT DEFAULT 'قيد المراجعة',
  photos JSONB DEFAULT '[]'::jsonb,
  "adminResponse" TEXT,
  "resolutionType" TEXT,
  "warrantyConfirmed" BOOLEAN DEFAULT TRUE,
  "createdAt" TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. COMPLAINTS & TICKETS (الشكاوى والمقترحات)
CREATE TABLE IF NOT EXISTS public.complaints (
  id TEXT PRIMARY KEY,
  "clientId" TEXT,
  "clientName" TEXT,
  type TEXT,
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'قيد المتابعة',
  "adminReply" TEXT,
  replies JSONB DEFAULT '[]'::jsonb,
  "createdAt" TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. PROMO CODES (أكواد الخصم)
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE,
  type TEXT,
  value NUMERIC,
  "maxDiscountCap" NUMERIC,
  "minOrderAmount" NUMERIC,
  "usageLimit" INTEGER,
  "usedCount" INTEGER DEFAULT 0,
  "expiryDate" TEXT,
  description TEXT,
  active BOOLEAN DEFAULT TRUE
);

-- 11. STORE ADS / BANNERS (الإعلانات والبنرات)
CREATE TABLE IF NOT EXISTS public.store_ads (
  id TEXT PRIMARY KEY,
  badge TEXT,
  title TEXT,
  subtitle TEXT,
  gradient TEXT,
  image TEXT,
  "buttonText" TEXT,
  "linkedPartId" TEXT,
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

-- 12. SHOWCASE BARS (بارات عرض المنتجات)
CREATE TABLE IF NOT EXISTS public.showcase_bars (
  id TEXT PRIMARY KEY,
  title TEXT,
  subtitle TEXT,
  "badgeColor" TEXT,
  "partIds" JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0
);

-- 13. AUTO TEMPLATES (تمبلت قطع الغيار التلقائي)
CREATE TABLE IF NOT EXISTS public.auto_templates (
  id TEXT PRIMARY KEY,
  "skuPrefix" TEXT,
  category TEXT,
  "namePattern" TEXT,
  "qualityGrade" TEXT,
  colors JSONB DEFAULT '[]'::jsonb,
  "warrantyText" TEXT,
  "imageKey" TEXT,
  "costPrice" NUMERIC DEFAULT 0,
  "basePrice" NUMERIC DEFAULT 0,
  "defaultStock" INTEGER DEFAULT 0,
  "lowStockThreshold" INTEGER DEFAULT 5,
  "maxOrderQty" INTEGER,
  enabled BOOLEAN DEFAULT TRUE
);

-- 14. SOURCING REQUESTS (طلبات توفير النواقص)
CREATE TABLE IF NOT EXISTS public.sourcing_requests (
  id TEXT PRIMARY KEY,
  "clientId" TEXT,
  "clientName" TEXT,
  "clientPhone" TEXT,
  "partId" TEXT,
  "partName" TEXT,
  notes TEXT,
  "createdAt" TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. SITE SETTINGS & CREDENTIALS (إعدادات الموقع والحسابات)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  settings JSONB DEFAULT '{}'::jsonb,
  credentials JSONB DEFAULT '{}'::jsonb,
  currencies JSONB DEFAULT '{}'::jsonb,
  notifications JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. SYNC METADATA (جدول التحديثات الذكي الفائق الخفة لمنع الـ Egress)
CREATE TABLE IF NOT EXISTS public.sync_meta (
  table_name TEXT PRIMARY KEY,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Initialize sync_meta with all tables
INSERT INTO public.sync_meta (table_name, updated_at) VALUES
  ('parts', NOW()),
  ('models', NOW()),
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
ON CONFLICT (table_name) DO NOTHING;

-- Trigger Function to automatically touch sync_meta whenever any table changes
CREATE OR REPLACE FUNCTION public.notify_sync_meta()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.sync_meta (table_name, updated_at)
  VALUES (TG_TABLE_NAME, NOW())
  ON CONFLICT (table_name) DO UPDATE SET updated_at = NOW();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Attach triggers to all tables
DROP TRIGGER IF EXISTS trg_parts_sync_meta ON public.parts;
CREATE TRIGGER trg_parts_sync_meta AFTER INSERT OR UPDATE OR DELETE ON public.parts FOR EACH STATEMENT EXECUTE FUNCTION public.notify_sync_meta();

DROP TRIGGER IF EXISTS trg_models_sync_meta ON public.models;
CREATE TRIGGER trg_models_sync_meta AFTER INSERT OR UPDATE OR DELETE ON public.models FOR EACH STATEMENT EXECUTE FUNCTION public.notify_sync_meta();

DROP TRIGGER IF EXISTS trg_groups_sync_meta ON public.pricing_groups;
CREATE TRIGGER trg_groups_sync_meta AFTER INSERT OR UPDATE OR DELETE ON public.pricing_groups FOR EACH STATEMENT EXECUTE FUNCTION public.notify_sync_meta();

DROP TRIGGER IF EXISTS trg_clients_sync_meta ON public.clients;
CREATE TRIGGER trg_clients_sync_meta AFTER INSERT OR UPDATE OR DELETE ON public.clients FOR EACH STATEMENT EXECUTE FUNCTION public.notify_sync_meta();

DROP TRIGGER IF EXISTS trg_orders_sync_meta ON public.orders;
CREATE TRIGGER trg_orders_sync_meta AFTER INSERT OR UPDATE OR DELETE ON public.orders FOR EACH STATEMENT EXECUTE FUNCTION public.notify_sync_meta();

DROP TRIGGER IF EXISTS trg_account_requests_sync_meta ON public.account_requests;
CREATE TRIGGER trg_account_requests_sync_meta AFTER INSERT OR UPDATE OR DELETE ON public.account_requests FOR EACH STATEMENT EXECUTE FUNCTION public.notify_sync_meta();

DROP TRIGGER IF EXISTS trg_returns_list_sync_meta ON public.returns_list;
CREATE TRIGGER trg_returns_list_sync_meta AFTER INSERT OR UPDATE OR DELETE ON public.returns_list FOR EACH STATEMENT EXECUTE FUNCTION public.notify_sync_meta();

DROP TRIGGER IF EXISTS trg_complaints_sync_meta ON public.complaints;
CREATE TRIGGER trg_complaints_sync_meta AFTER INSERT OR UPDATE OR DELETE ON public.complaints FOR EACH STATEMENT EXECUTE FUNCTION public.notify_sync_meta();

DROP TRIGGER IF EXISTS trg_store_ads_sync_meta ON public.store_ads;
CREATE TRIGGER trg_store_ads_sync_meta AFTER INSERT OR UPDATE OR DELETE ON public.store_ads FOR EACH STATEMENT EXECUTE FUNCTION public.notify_sync_meta();

DROP TRIGGER IF EXISTS trg_showcase_bars_sync_meta ON public.showcase_bars;
CREATE TRIGGER trg_showcase_bars_sync_meta AFTER INSERT OR UPDATE OR DELETE ON public.showcase_bars FOR EACH STATEMENT EXECUTE FUNCTION public.notify_sync_meta();

DROP TRIGGER IF EXISTS trg_site_settings_sync_meta ON public.site_settings;
CREATE TRIGGER trg_site_settings_sync_meta AFTER INSERT OR UPDATE OR DELETE ON public.site_settings FOR EACH STATEMENT EXECUTE FUNCTION public.notify_sync_meta();

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showcase_bars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sourcing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_meta ENABLE ROW LEVEL SECURITY;

-- Allow public read/write policies for seamless operation with anon key
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'parts', 'models', 'brands', 'pricing_groups', 'clients', 'account_requests',
      'orders', 'returns_list', 'complaints', 'promo_codes', 'store_ads',
      'showcase_bars', 'auto_templates', 'sourcing_requests', 'site_settings', 'sync_meta'
    ])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow public full access %I" ON public.%I', tbl, tbl);
    EXECUTE format('CREATE POLICY "Allow public full access %I" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl, tbl);
  END LOOP;
END;
$$;

-- ============================================================================
-- AUTOMATED DATA MIGRATION FROM app_state_sync (إنقاذ ونقل كافة البيانات السابقة)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.migrate_from_app_state_sync()
RETURNS TEXT AS $$
DECLARE
  v_payload JSONB;
BEGIN
  -- Check if app_state_sync table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'app_state_sync'
  ) THEN
    RETURN 'جدول app_state_sync غير موجود، تم تخطي الترحيل.';
  END IF;

  SELECT payload INTO v_payload FROM public.app_state_sync WHERE id = 'main_store' LIMIT 1;
  IF v_payload IS NULL THEN
    RETURN 'لا توجد بيانات قديمة داخل app_state_sync لنقلها.';
  END IF;

  -- 1. Brands
  IF v_payload ? 'brands' AND jsonb_typeof(v_payload->'brands') = 'array' THEN
    INSERT INTO public.brands (name)
    SELECT value FROM jsonb_array_elements_text(v_payload->'brands') AS value
    ON CONFLICT (name) DO NOTHING;
  END IF;

  -- 2. Groups
  IF v_payload ? 'groups' AND jsonb_typeof(v_payload->'groups') = 'array' THEN
    INSERT INTO public.pricing_groups SELECT * FROM jsonb_populate_recordset(null::public.pricing_groups, v_payload->'groups')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 3. Models
  IF v_payload ? 'models' AND jsonb_typeof(v_payload->'models') = 'array' THEN
    INSERT INTO public.models SELECT * FROM jsonb_populate_recordset(null::public.models, v_payload->'models')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 4. Parts
  IF v_payload ? 'parts' AND jsonb_typeof(v_payload->'parts') = 'array' THEN
    INSERT INTO public.parts SELECT * FROM jsonb_populate_recordset(null::public.parts, v_payload->'parts')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 5. Clients
  IF v_payload ? 'clients' AND jsonb_typeof(v_payload->'clients') = 'array' THEN
    INSERT INTO public.clients SELECT * FROM jsonb_populate_recordset(null::public.clients, v_payload->'clients')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 6. Account Requests
  IF v_payload ? 'accountRequests' AND jsonb_typeof(v_payload->'accountRequests') = 'array' THEN
    INSERT INTO public.account_requests SELECT * FROM jsonb_populate_recordset(null::public.account_requests, v_payload->'accountRequests')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 7. Orders
  IF v_payload ? 'orders' AND jsonb_typeof(v_payload->'orders') = 'array' THEN
    INSERT INTO public.orders SELECT * FROM jsonb_populate_recordset(null::public.orders, v_payload->'orders')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 8. Returns
  IF v_payload ? 'returnsList' AND jsonb_typeof(v_payload->'returnsList') = 'array' THEN
    INSERT INTO public.returns_list SELECT * FROM jsonb_populate_recordset(null::public.returns_list, v_payload->'returnsList')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 9. Complaints
  IF v_payload ? 'complaints' AND jsonb_typeof(v_payload->'complaints') = 'array' THEN
    INSERT INTO public.complaints SELECT * FROM jsonb_populate_recordset(null::public.complaints, v_payload->'complaints')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 10. Promo Codes
  IF v_payload ? 'promoCodes' AND jsonb_typeof(v_payload->'promoCodes') = 'array' THEN
    INSERT INTO public.promo_codes SELECT * FROM jsonb_populate_recordset(null::public.promo_codes, v_payload->'promoCodes')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 11. Store Ads
  IF v_payload ? 'storeAds' AND jsonb_typeof(v_payload->'storeAds') = 'array' THEN
    INSERT INTO public.store_ads SELECT * FROM jsonb_populate_recordset(null::public.store_ads, v_payload->'storeAds')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 12. Showcase Bars
  IF v_payload ? 'showcaseBars' AND jsonb_typeof(v_payload->'showcaseBars') = 'array' THEN
    INSERT INTO public.showcase_bars SELECT * FROM jsonb_populate_recordset(null::public.showcase_bars, v_payload->'showcaseBars')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 13. Auto Templates
  IF v_payload ? 'autoTemplates' AND jsonb_typeof(v_payload->'autoTemplates') = 'array' THEN
    INSERT INTO public.auto_templates SELECT * FROM jsonb_populate_recordset(null::public.auto_templates, v_payload->'autoTemplates')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 14. Sourcing Requests
  IF v_payload ? 'sourcingRequests' AND jsonb_typeof(v_payload->'sourcingRequests') = 'array' THEN
    INSERT INTO public.sourcing_requests SELECT * FROM jsonb_populate_recordset(null::public.sourcing_requests, v_payload->'sourcingRequests')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- 15. Site Settings
  INSERT INTO public.site_settings (id, settings, credentials, currencies, notifications)
  VALUES (
    'main',
    COALESCE(v_payload->'siteSettings', '{}'::jsonb),
    COALESCE(v_payload->'adminCredentials', '{}'::jsonb),
    COALESCE(v_payload->'currencies', '{}'::jsonb),
    COALESCE(v_payload->'notifications', '[]'::jsonb)
  )
  ON CONFLICT (id) DO UPDATE SET
    settings = EXCLUDED.settings,
    credentials = EXCLUDED.credentials,
    currencies = EXCLUDED.currencies,
    notifications = EXCLUDED.notifications,
    updated_at = NOW();

  RETURN 'تم نقل وترحيل جميع البيانات من app_state_sync إلى الجداول المستقلة بنجاح!';
END;
$$ LANGUAGE plpgsql;

-- Execute migration immediately if data exists
SELECT public.migrate_from_app_state_sync();

-- ============================================================================
-- Supabase Storage Setup (Buckets & Policies for images)
-- ============================================================================
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

-- ============================================================================
-- Realtime Publication for instant cross-device updates
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE
        public.parts,
        public.models,
        public.pricing_groups,
        public.orders,
        public.clients,
        public.account_requests,
        public.store_ads,
        public.showcase_bars,
        public.site_settings,
        public.sync_meta;
    EXCEPTION WHEN duplicate_object THEN
      NULL;
    END;
  END IF;
END;
$$;
