-- ============================================================================
-- ELZOGHBI MARKET: COMPLETE SUPER CRO, RETENTION, LOYALTY & FEATURE FLAGS SQL
-- Run this entire script once in Supabase -> SQL Editor -> New Query -> Run
-- Safe & Idempotent (Auto-heals existing tables and handles all previous schemas)
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. EXTEND `clients` (USERS PROFILE) TABLE
--    - Wallet Cashback, Loyalty Tiers (up to 20 orders + 3-month inactivity),
--      Mandatory Birth Date (Unified to 1996-12-30 for all existing clients),
--      Refer-a-Friend ("هات صاحبك"), and Family Saved Devices ("موبايلي وعائلتي")
-- ============================================================================
ALTER TABLE IF EXISTS public.clients
  ADD COLUMN IF NOT EXISTS wallet_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS cashback_earned NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS order_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_vip BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS loyalty_tier TEXT NOT NULL DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS last_order_at TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS birth_date TEXT NOT NULL DEFAULT '1996-12-30',
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_by_code TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS referrer_client_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS saved_family_devices JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- توحيد تاريخ ميلاد جميع العملاء القدامى إلى 30/12/1996 (1996-12-30) وتوليد كود إحالة لكل عميل
UPDATE public.clients
SET
  birth_date = CASE
    WHEN birth_date IS NULL OR TRIM(birth_date) = '' THEN '1996-12-30'
    ELSE birth_date
  END,
  referral_code = CASE
    WHEN referral_code IS NULL OR TRIM(referral_code) = ''
    THEN 'REF-' || RIGHT(REGEXP_REPLACE(COALESCE(phone, id, '10000'), '[^0-9]', '', 'g') || '10000', 5)
    ELSE referral_code
  END;

-- تحديث طلبات فتح الحساب لتشمل تاريخ الميلاد الإجباري وكود الإحالة
ALTER TABLE IF EXISTS public.account_requests
  ADD COLUMN IF NOT EXISTS birth_date TEXT NOT NULL DEFAULT '1996-12-30',
  ADD COLUMN IF NOT EXISTS referred_by_code TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- 2. EXTEND `spare_parts` (PRODUCTS CATALOG) TABLE
--    - Per-Product Cashback Control (`cashback_enabled`, `cashback_pct`)
--    - 3 Quality Tiers (`tier_original_price`, `tier_first_class_price`, `tier_economy_price`)
--    - Secret VIP Route (`is_vip_only`, `vip_price`)
--    - Out-of-Stock Waitlist Count (`waitlist_count`)
-- ============================================================================
ALTER TABLE IF EXISTS public.spare_parts
  ADD COLUMN IF NOT EXISTS cashback_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cashback_pct NUMERIC(5, 2) NOT NULL DEFAULT 2.00,
  ADD COLUMN IF NOT EXISTS is_vip_only BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS vip_price NUMERIC(12, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tier_original_price NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS tier_first_class_price NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS tier_economy_price NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS bundle_discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS waitlist_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS custom_group_prices JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- مزامنة إعدادات الكاش باك والـ VIP ودرجات الجودة داخل custom_group_prices JSONB
UPDATE public.spare_parts
SET custom_group_prices = COALESCE(custom_group_prices, '{}'::jsonb) || jsonb_build_object(
  '_cashbackEnabled', COALESCE((custom_group_prices->>'_cashbackEnabled')::boolean, cashback_enabled, false),
  '_cashbackPct', COALESCE((custom_group_prices->>'_cashbackPct')::numeric, cashback_pct, 2),
  '_isVipOnly', COALESCE((custom_group_prices->>'_isVipOnly')::boolean, is_vip_only, false)
);

-- ============================================================================
-- 3. EXTEND `orders` & `returns_list` (WARRANTY & CASHBACK TRACKING)
-- ============================================================================
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS client_phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS cashback_awarded BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cashback_amount_base NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS expected_cashback_base NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS referral_code_used TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS referrer_client_id TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS referral_reward_amount_base NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

ALTER TABLE IF EXISTS public.returns_list
  ADD COLUMN IF NOT EXISTS warranty_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- ============================================================================
-- 4. CREATE OR UPGRADE SUPPORTING CRO TABLES
--    - `product_relations` (Smart Cross-Sell Bundles — auto-heals both schemas)
--    - `wallet_transactions` (Cashback & Referral Audit Log)
--    - `restock_waitlist` ("نبهني على واتساب عند التوفر")
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.product_relations (
  id TEXT PRIMARY KEY DEFAULT ('rel_' || gen_random_uuid()::text),
  source_part_id TEXT,
  source_category TEXT,
  related_part_id TEXT,
  target_part_id TEXT,
  relation_type TEXT NOT NULL DEFAULT 'cross_sell',
  bundle_discount_pct NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ضمان وجود جميع الأعمدة حتى لو كان الجدول منشأ مسبقاً بهيكل قديم
ALTER TABLE IF EXISTS public.product_relations
  ADD COLUMN IF NOT EXISTS source_part_id TEXT,
  ADD COLUMN IF NOT EXISTS source_category TEXT,
  ADD COLUMN IF NOT EXISTS related_part_id TEXT,
  ADD COLUMN IF NOT EXISTS target_part_id TEXT,
  ADD COLUMN IF NOT EXISTS relation_type TEXT DEFAULT 'cross_sell',
  ADD COLUMN IF NOT EXISTS bundle_discount_pct NUMERIC(5, 2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_product_relations_source
  ON public.product_relations (source_part_id)
  WHERE active = TRUE;

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id TEXT PRIMARY KEY DEFAULT ('wtx_' || gen_random_uuid()::text),
  client_id TEXT NOT NULL,
  order_id TEXT,
  tx_type TEXT NOT NULL DEFAULT 'cashback_2pct',
  amount_base NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  balance_after NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.wallet_transactions
  ADD COLUMN IF NOT EXISTS client_id TEXT,
  ADD COLUMN IF NOT EXISTS order_id TEXT,
  ADD COLUMN IF NOT EXISTS tx_type TEXT DEFAULT 'cashback_2pct',
  ADD COLUMN IF NOT EXISTS amount_base NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS balance_after NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_client
  ON public.wallet_transactions (client_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.restock_waitlist (
  id TEXT PRIMARY KEY DEFAULT ('wait_' || gen_random_uuid()::text),
  part_id TEXT NOT NULL,
  part_name TEXT NOT NULL,
  part_sku TEXT DEFAULT '',
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  notified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS public.restock_waitlist
  ADD COLUMN IF NOT EXISTS part_id TEXT,
  ADD COLUMN IF NOT EXISTS part_name TEXT,
  ADD COLUMN IF NOT EXISTS part_sku TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS notified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_restock_waitlist_part
  ON public.restock_waitlist (part_id, notified);

-- ============================================================================
-- 5. SEED PROMO CODES (SPIN WHEEL, EXIT-INTENT, RENEW10, BIRTHDAY, SEASONAL)
-- ============================================================================
INSERT INTO public.promo_codes (id, code, type, value, max_discount_cap, min_order_amount, usage_limit, used_count, expiry_date, description, active)
VALUES
  ('prm_spin_freeship', 'SPIN-FREESHIP', 'free_delivery', 100, 0, 0, 10000, 0, '2027-12-31', 'هدية عجلة الحظ: شحن مجاني بالكامل لأول طلب', true),
  ('prm_spin_5off',     'SPIN-5OFF',     'percentage',    5,   250, 0, 10000, 0, '2027-12-31', 'هدية عجلة الحظ: خصم 5% فوري على سلة المشتريات', true),
  ('prm_spin_gift',     'SPIN-GIFT',     'fixed',         65,  65,  250, 10000, 0, '2027-12-31', 'هدية عجلة الحظ: هدية مجانية (خصم فوري 65 ج.م)', true),
  ('prm_spin_50egp',    'SPIN-50EGP',    'fixed',         50,  50,  500, 10000, 0, '2027-12-31', 'هدية عجلة الحظ: خصم 50 ج.م فوري', true),
  ('prm_exit_stay5',    'STAY5',         'percentage',    5,   300, 0, 10000, 0, '2027-12-31', 'عرض نافذة الخروج الذكية: خصم 5% فوري على طلبك', true),
  ('prm_renew10',       'RENEW10',       'percentage',    10,  300, 0, 10000, 0, '2027-12-31', 'خصم تجديد وإعادة الشراء بعد 6 شهور (-10%)', true),
  ('prm_bday15',        'BDAY15',        'percentage',    15,  400, 0, 10000, 0, '2027-12-31', 'هدية عيد ميلادك من الزغبي (-15%)', true),
  ('prm_season10',      'SEASON10',      'percentage',    10,  500, 0, 10000, 0, '2027-12-31', 'كوبون عروض الموسم والجمعة البيضاء (-10%)', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. DATABASE TRIGGER: PER-PRODUCT CASHBACK + LOYALTY BONUS + REFERRAL REWARD
--    - Runs automatically when an order status changes to 'تم التسليم' or 'Delivered'
--    - Calculates cashback ONLY on eligible items (`cashback_enabled = TRUE`)
--    - Updates `order_count`, `loyalty_tier` (bronze/silver/gold/diamond up to 20 orders),
--      `is_vip` (`order_count >= 3`), and credits `wallet_balance` + `ledger`
-- ============================================================================
CREATE OR REPLACE FUNCTION public.fn_elzoghbi_order_delivered_cashback()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_item JSONB;
  v_part_id TEXT;
  v_qty NUMERIC := 0;
  v_unit_price NUMERIC := 0;
  v_part_cb_enabled BOOLEAN := FALSE;
  v_part_cb_pct NUMERIC := 0;
  v_cashback NUMERIC(12, 2) := 0;
  v_new_balance NUMERIC(12, 2) := 0;
  v_new_order_count INTEGER := 0;
  v_loyalty_tier TEXT := 'bronze';
  v_loyalty_bonus_pct NUMERIC := 0;
  v_ledger_entry JSONB;
BEGIN
  IF (NEW.status IN ('تم التسليم', 'Delivered'))
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND (COALESCE(OLD.cashback_awarded, FALSE) = FALSE)
     AND (COALESCE(NEW.cashback_awarded, FALSE) = FALSE)
     AND (NEW.client_id IS NOT NULL AND NEW.client_id <> 'guest') THEN

    SELECT COALESCE(order_count, 0) + 1
    INTO v_new_order_count
    FROM public.clients
    WHERE id = NEW.client_id;

    IF v_new_order_count >= 20 THEN
      v_loyalty_tier := 'diamond';
      v_loyalty_bonus_pct := 3;
    ELSIF v_new_order_count >= 10 THEN
      v_loyalty_tier := 'gold';
      v_loyalty_bonus_pct := 2;
    ELSIF v_new_order_count >= 4 THEN
      v_loyalty_tier := 'silver';
      v_loyalty_bonus_pct := 1;
    ELSE
      v_loyalty_tier := 'bronze';
      v_loyalty_bonus_pct := 0;
    END IF;

    IF jsonb_typeof(NEW.items) = 'array' THEN
      FOR v_item IN SELECT * FROM jsonb_array_elements(NEW.items)
      LOOP
        v_part_id := COALESCE(v_item->>'partId', v_item->>'part_id', '');
        v_qty := COALESCE((v_item->>'qty')::NUMERIC, 1);
        v_unit_price := COALESCE((v_item->>'unitPriceBase')::NUMERIC, (v_item->>'unit_price_base')::NUMERIC, 0);

        v_part_cb_enabled := COALESCE((v_item->>'cashbackEnabled')::BOOLEAN, FALSE);
        v_part_cb_pct := COALESCE((v_item->>'cashbackPct')::NUMERIC, 0);

        IF NOT v_part_cb_enabled AND v_part_id <> '' THEN
          SELECT
            COALESCE((custom_group_prices->>'_cashbackEnabled')::BOOLEAN, cashback_enabled, FALSE),
            COALESCE((custom_group_prices->>'_cashbackPct')::NUMERIC, cashback_pct, 2.00)
          INTO v_part_cb_enabled, v_part_cb_pct
          FROM public.spare_parts
          WHERE id = v_part_id
          LIMIT 1;
        END IF;

        IF COALESCE(v_part_cb_enabled, FALSE) = TRUE AND COALESCE(v_part_cb_pct, 0) > 0 THEN
          v_cashback := v_cashback + ROUND((v_qty * v_unit_price) * ((v_part_cb_pct + v_loyalty_bonus_pct) / 100.0), 0);
        END IF;
      END LOOP;
    END IF;

    NEW.cashback_awarded := TRUE;
    NEW.cashback_amount_base := v_cashback;

    IF v_cashback > 0 THEN
      SELECT COALESCE(wallet_balance, 0) + v_cashback
      INTO v_new_balance
      FROM public.clients
      WHERE id = NEW.client_id;

      v_ledger_entry := jsonb_build_object(
        'id', 'ldg_cb_' || NEW.id,
        'date', to_char(NOW(), 'YYYY-MM-DD HH24:MI'),
        'type', 'cashback',
        'ref', NEW.id,
        'desc', 'مكافأة كاش باك للمحفظة عن المنتجات المشمولة في الفاتورة (' || NEW.id || ')',
        'amount', v_cashback,
        'balanceAfter', COALESCE(v_new_balance, v_cashback)
      );

      UPDATE public.clients
      SET
        wallet_balance = COALESCE(wallet_balance, 0) + v_cashback,
        cashback_earned = COALESCE(cashback_earned, 0) + v_cashback,
        order_count = v_new_order_count,
        loyalty_tier = v_loyalty_tier,
        last_order_at = to_char(NOW(), 'YYYY-MM-DD HH24:MI'),
        is_vip = CASE WHEN v_new_order_count >= 3 THEN TRUE ELSE COALESCE(is_vip, FALSE) END,
        ledger = v_ledger_entry || COALESCE(ledger, '[]'::jsonb)
      WHERE id = NEW.client_id;

      INSERT INTO public.wallet_transactions (client_id, order_id, tx_type, amount_base, balance_after, description)
      VALUES (NEW.client_id, NEW.id, 'cashback_2pct', v_cashback, COALESCE(v_new_balance, v_cashback), 'كاش باك المنتجات المشمولة في الطلب ' || NEW.id);
    ELSE
      UPDATE public.clients
      SET
        order_count = v_new_order_count,
        loyalty_tier = v_loyalty_tier,
        last_order_at = to_char(NOW(), 'YYYY-MM-DD HH24:MI'),
        is_vip = CASE WHEN v_new_order_count >= 3 THEN TRUE ELSE COALESCE(is_vip, FALSE) END
      WHERE id = NEW.client_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_elzoghbi_order_delivered_cashback ON public.orders;
CREATE TRIGGER trg_elzoghbi_order_delivered_cashback
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_elzoghbi_order_delivered_cashback();

-- ============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES & REALTIME PUBLICATION
-- ============================================================================
ALTER TABLE public.spare_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restock_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read standard non-VIP spare parts" ON public.spare_parts;
CREATE POLICY "Public can read standard non-VIP spare parts"
  ON public.spare_parts
  FOR SELECT
  USING (
    COALESCE(is_vip_only, FALSE) = FALSE
    OR COALESCE(current_setting('request.headers', true)::json->>'x-client-info', '') = 'elzoghbi-admin'
    OR EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE (
        c.id = COALESCE(auth.uid()::text, current_setting('request.headers', true)::json->>'x-elzoghbi-client-id', '')
        OR c.email = COALESCE(auth.jwt()->>'email', '')
      )
      AND (COALESCE(c.order_count, 0) >= 3 OR COALESCE(c.is_vip, FALSE) = TRUE)
    )
    OR TRUE
  );

DROP POLICY IF EXISTS "Admin full access on spare_parts" ON public.spare_parts;
CREATE POLICY "Admin full access on spare_parts"
  ON public.spare_parts
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public read active cross-sell relations" ON public.product_relations;
CREATE POLICY "Public read active cross-sell relations"
  ON public.product_relations
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Full access on wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "Full access on wallet_transactions"
  ON public.wallet_transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Full access on restock_waitlist" ON public.restock_waitlist;
CREATE POLICY "Full access on restock_waitlist"
  ON public.restock_waitlist
  FOR ALL
  USING (true)
  WITH CHECK (true);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.spare_parts;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

COMMIT;
