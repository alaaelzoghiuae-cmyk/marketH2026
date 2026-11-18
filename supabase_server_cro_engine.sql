-- =================================================================================
-- ELZOGHBI MARKET — SERVER-AUTHORITATIVE CRO & FEATURE FLAGS ENGINE (POSTGRES + RLS + RPC)
-- انسخ هذا الكود بالكامل وشغّله في Supabase SQL Editor (Run)
-- =================================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =================================================================================
-- 1. جدول مفاتيح الميزات الموحد (feature_flags)
-- كل ميزة لها صف مستقل: (key, enabled, config jsonb)
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- إدراج الـ 18 ميزة + مفتاح حد إيقاف البيع الكلي (2,000,000 ج.م) بإعداداتها الافتراضية القابلة للتعديل
INSERT INTO public.feature_flags (key, enabled, config) VALUES
  ('live_social_proof', true, '{"min_interval_sec": 20, "max_interval_sec": 40, "lookback_hours": 24}'::jsonb),
  ('spin_to_win', true, '{"cooldown_days": 7, "coupon_validity_days": 7, "require_auth_or_phone": true, "title": "🎁 لف عجلة الحظ واكسب هديتك الفورية!", "subtitle": "لفة واحدة كل 7 أيام لكل عميل مسجل برقم الموبايل"}'::jsonb),
  ('free_shipping_bar', true, '{"target_amount_egp": 2000, "confetti_once_per_session": true}'::jsonb),
  ('smart_cross_sell', true, '{"max_suggestions": 3, "bundle_discount_pct": 10}'::jsonb),
  ('wallet_cashback', true, '{"default_pct": 2, "max_part_price_cap": 1500}'::jsonb),
  ('quality_tiers', true, '{"first_class_ratio": 60, "economy_ratio": 35, "original_label": "أصلي 100%", "first_class_label": "فرز أول", "economy_label": "اقتصادي"}'::jsonb),
  ('trust_badges', true, '{"low_stock_threshold": 5, "cod_text": "الدفع عند الاستلام", "inspect_text": "معاينة قبل الدفع"}'::jsonb),
  ('exit_intent_popup', true, '{"title": "استنى! قبل ما تمشي.. خد خصم فوري على سلتك 🎁", "subtitle": "فعّل الكوبون الآن قبل انتهاء الوقت واستمتع بخصم فوري ومعاينة قبل الدفع", "discount_pct": 5, "promo_code": "STAY5", "cooldown_hours": 24, "mobile_idle_sec": 30, "duration_minutes": 15}'::jsonb),
  ('buy_more_save_more', true, '{"tier2_min_qty": 2, "tier2_discount_pct": 5, "tier3_min_qty": 3, "tier3_discount_pct": 10}'::jsonb),
  ('cashier_impulse', true, '{"max_price_egp": 1000, "selection_mode": "manual_first"}'::jsonb),
  ('loyalty_tiers', true, '{"silver_min_spent_egp": 5000, "gold_min_spent_egp": 15000, "diamond_min_spent_egp": 30000, "silver_discount_pct": 3, "gold_discount_pct": 7, "diamond_discount_pct": 12}'::jsonb),
  ('family_saved_devices', true, '{"notify_on_new_part": true}'::jsonb),
  ('repurchase_reminders', true, '{"reminder_months": 6, "discount_pct": 10, "promo_code": "RENEW10"}'::jsonb),
  ('vip_secret_route', true, '{"required_tier": "gold", "min_spent_egp": 15000, "secret_token": "elzoghbi-vip"}'::jsonb),
  ('warranty_lookup', true, '{"default_warranty_days": 90}'::jsonb),
  ('referral_program', true, '{"reward_type": "fixed", "reward_value": 50, "coupon_validity_days": 14, "both_sides_rewarded": true}'::jsonb),
  ('birthday_and_seasonal', true, '{"birthday_code": "BDAY15", "birthday_discount_pct": 15, "seasonal_active": true, "seasonal_name": "عروض الموسم الحصرية", "seasonal_code": "SEASON10", "seasonal_discount_pct": 10}'::jsonb),
  ('out_of_stock_notify', true, '{"keep_visible": true, "whatsapp_enabled": true}'::jsonb),
  ('sales_cap_guard', true, '{"max_sales_limit_egp": 2000000, "period_start": "2026-01-01T00:00:00Z", "period_end": "2027-12-31T23:59:59Z", "stop_message": "نعتذر، تم الوصول للحد الأقصى للمبيعات المقررة لهذه الفترة ولا يمكن استقبال طلبات جديدة حالياً."}'::jsonb)
ON CONFLICT (key) DO UPDATE SET
  config = public.feature_flags.config || EXCLUDED.config,
  updated_at = now();

-- =================================================================================
-- 2. تعديل جدول العملاء (clients) لدعم قفل تعديل تاريخ الميلاد مرة واحدة فقط وإجمالي المشتريات
-- =================================================================================
ALTER TABLE IF EXISTS public.clients
  ADD COLUMN IF NOT EXISTS birth_date TEXT,
  ADD COLUMN IF NOT EXISTS birth_date_locked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_paid_spent NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS loyalty_tier TEXT NOT NULL DEFAULT 'bronze',
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_by_code TEXT,
  ADD COLUMN IF NOT EXISTS has_used_referral BOOLEAN NOT NULL DEFAULT false;

-- =================================================================================
-- 3. جدول سجل الهدايا والمكافآت الموحد (user_rewards)
-- يمنع تكرار أي هدية "مرة واحدة" أو "مرة في السنة" حتى لو غيّر العميل المتصفح أو الجهاز
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  reward_type TEXT NOT NULL, -- 'first_visit_gift', 'first_order_gift', 'birthday_gift', 'exit_intent_24h', 'spin_reward', 'referral_referrer', 'referral_referred'
  period_key TEXT NOT NULL DEFAULT 'lifetime', -- 'lifetime' أو السنة مثل '2026' أو اليوم '2026-11-11'
  source TEXT NOT NULL DEFAULT 'system',
  coupon_code TEXT,
  discount_value NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ,
  CONSTRAINT uq_user_reward_type_period UNIQUE (user_id, reward_type, period_key)
);

CREATE INDEX IF NOT EXISTS idx_user_rewards_user ON public.user_rewards(user_id);

-- =================================================================================
-- 4. جدول الكوبونات المتقدم (coupons) + جدول استخدامات الكوبونات (coupon_redemptions)
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed', 'free_delivery')),
  discount_value NUMERIC NOT NULL DEFAULT 5,
  min_cart_total NUMERIC NOT NULL DEFAULT 0,
  max_discount_cap NUMERIC NOT NULL DEFAULT 500,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '365 days'),
  max_total_uses INT NOT NULL DEFAULT 10000,
  used_count INT NOT NULL DEFAULT 0,
  max_uses_per_user INT NOT NULL DEFAULT 1,
  assigned_user_id TEXT, -- إذا كان الكوبون مخصصاً لمستخدم بعينه (مثل كوبون عجلة الحظ أو هدية الإحالة)
  source_feature TEXT DEFAULT 'admin',
  description TEXT DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.coupons (id, code, discount_type, discount_value, min_cart_total, max_discount_cap, expires_at, max_total_uses, max_uses_per_user, source_feature, description, active)
VALUES
  ('cpn_bday15', 'BDAY15', 'percentage', 15, 200, 400, now() + interval '365 days', 100000, 1, 'birthday_and_seasonal', 'هدية عيد الميلاد السنوية (-15%)', true),
  ('cpn_season10', 'SEASON10', 'percentage', 10, 300, 500, now() + interval '180 days', 100000, 1, 'birthday_and_seasonal', 'خصم عروض الموسم (-10%)', true),
  ('cpn_stay5', 'STAY5', 'percentage', 5, 100, 250, now() + interval '365 days', 100000, 1, 'exit_intent_popup', 'خصم نافذة الخروج الذكية (-5%)', true),
  ('cpn_renew10', 'RENEW10', 'percentage', 10, 150, 350, now() + interval '365 days', 100000, 1, 'repurchase_reminders', 'خصم تجديد المشتريات بعد 6 شهور (-10%)', true)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id TEXT NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  coupon_code TEXT NOT NULL,
  user_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  discount_applied NUMERIC NOT NULL DEFAULT 0,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_coupon_user_once UNIQUE (coupon_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user ON public.coupon_redemptions(user_id);

-- =================================================================================
-- 5. جدول عجلة الحظ السيرفري (spins) — لفة واحدة كل 7 أيام لكل user_id / رقم تليفون
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.spins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  contact_identifier TEXT NOT NULL, -- رقم الهاتف الموحد أو الإيميل
  prize_id TEXT NOT NULL,
  prize_label TEXT NOT NULL,
  coupon_id TEXT NOT NULL,
  coupon_code TEXT NOT NULL,
  discount_type TEXT NOT NULL,
  discount_value NUMERIC NOT NULL,
  spun_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  next_eligible_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_spins_user_spun_at ON public.spins(user_id, spun_at DESC);
CREATE INDEX IF NOT EXISTS idx_spins_contact_spun_at ON public.spins(contact_identifier, spun_at DESC);

-- =================================================================================
-- 6. جدول الإحالة "هات صاحبك" (referrals) — UNIQUE(referred_id) ويكافئ الاثنين معاً
-- =================================================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id TEXT NOT NULL,
  referred_id TEXT NOT NULL,
  referral_code TEXT NOT NULL,
  referred_phone TEXT,
  device_fingerprint TEXT,
  order_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'rejected')),
  rewarded BOOLEAN NOT NULL DEFAULT false,
  referrer_coupon_code TEXT,
  referred_coupon_code TEXT,
  reward_amount NUMERIC NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rewarded_at TIMESTAMPTZ,
  CONSTRAINT uq_referrals_referred_id UNIQUE (referred_id),
  CONSTRAINT chk_no_self_referral CHECK (referrer_id <> referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);

-- =================================================================================
-- 7. تفعيل Row Level Security (RLS) على جميع الجداول الجديدة
-- =================================================================================
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "p_feature_flags_select" ON public.feature_flags;
CREATE POLICY "p_feature_flags_select" ON public.feature_flags FOR SELECT USING (true);
DROP POLICY IF EXISTS "p_feature_flags_write" ON public.feature_flags;
CREATE POLICY "p_feature_flags_write" ON public.feature_flags FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "p_user_rewards_all" ON public.user_rewards;
CREATE POLICY "p_user_rewards_all" ON public.user_rewards FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "p_coupons_all" ON public.coupons;
CREATE POLICY "p_coupons_all" ON public.coupons FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "p_coupon_redemptions_all" ON public.coupon_redemptions;
CREATE POLICY "p_coupon_redemptions_all" ON public.coupon_redemptions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "p_spins_all" ON public.spins;
CREATE POLICY "p_spins_all" ON public.spins FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "p_referrals_all" ON public.referrals;
CREATE POLICY "p_referrals_all" ON public.referrals FOR ALL USING (true) WITH CHECK (true);

-- =================================================================================
-- 8. الدوال السيرفرية الذرية (Postgres RPCs) التي تضمن تنفيذ كل القواعد في السيرفر
-- =================================================================================

-- 8.1 دالة لف عجلة الحظ في السيرفر (تتحقق من الـ Flag، تسجيل الرقم/الحساب، ومرور 7 أيام)
CREATE OR REPLACE FUNCTION public.rpc_spin_wheel(
  p_user_id TEXT,
  p_phone_or_email TEXT,
  p_prizes JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_flag RECORD;
  v_cooldown_days INT := 7;
  v_validity_days INT := 7;
  v_clean_user TEXT;
  v_clean_contact TEXT;
  v_last_spin RECORD;
  v_days_remaining INT;
  v_prize_list JSONB;
  v_prize_count INT;
  v_win_idx INT;
  v_won_prize JSONB;
  v_coupon_code TEXT;
  v_coupon_id TEXT;
  v_disc_type TEXT;
  v_disc_val NUMERIC;
  v_now TIMESTAMPTZ := now();
  v_next_eligible TIMESTAMPTZ;
  v_expires TIMESTAMPTZ;
BEGIN
  -- 1. التحقق من أن ميزة عجلة الحظ مفعلة في السيرفر
  SELECT * INTO v_flag FROM public.feature_flags WHERE key = 'spin_to_win';
  IF NOT FOUND OR v_flag.enabled = false THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FEATURE_DISABLED', 'message', 'ميزة عجلة الحظ متوقفة حالياً من الإدارة.');
  END IF;

  v_cooldown_days := COALESCE((v_flag.config->>'cooldown_days')::INT, 7);
  v_validity_days := COALESCE((v_flag.config->>'coupon_validity_days')::INT, 7);

  -- 2. التحقق من وجود حساب أو رقم تليفون / إيميل صالح (ممنوع اللف لزائر مجهول)
  v_clean_contact := regexp_replace(COALESCE(p_phone_or_email, ''), '[^0-9a-zA-Z@._-]', '', 'g');
  v_clean_user := COALESCE(NULLIF(trim(p_user_id), ''), v_clean_contact);

  IF length(v_clean_contact) < 8 AND (v_clean_user IS NULL OR v_clean_user = 'guest' OR length(v_clean_user) < 3) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'AUTH_REQUIRED', 'message', 'لازم تسجّل دخول أو تكتب رقم تليفونك الأول قبل لف العجلة للحصول على الكوبون.');
  END IF;

  -- 3. التحقق من آخر لفة لهذا المستخدم أو الرقم في جدول spins
  SELECT * INTO v_last_spin
  FROM public.spins
  WHERE user_id = v_clean_user OR contact_identifier = v_clean_contact
  ORDER BY spun_at DESC
  LIMIT 1;

  IF FOUND AND v_last_spin.next_eligible_at > v_now THEN
    v_days_remaining := GREATEST(1, CEIL(EXTRACT(EPOCH FROM (v_last_spin.next_eligible_at - v_now)) / 86400.0)::INT);
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'COOLDOWN_ACTIVE',
      'days_remaining', v_days_remaining,
      'next_eligible_at', v_last_spin.next_eligible_at,
      'last_prize', jsonb_build_object(
        'label', v_last_spin.prize_label,
        'code', v_last_spin.coupon_code,
        'type', v_last_spin.discount_type,
        'value', v_last_spin.discount_value
      ),
      'message', format('تقدر تلف تاني بعد %s يوم! كود جائزتك الحالي هو (%s).', v_days_remaining, v_last_spin.coupon_code)
    );
  END IF;

  -- 4. اختيار الجائزة عشوائياً داخل السيرفر (وليس في المتصفح)
  IF jsonb_typeof(p_prizes) = 'array' AND jsonb_array_length(p_prizes) >= 2 THEN
    v_prize_list := p_prizes;
  ELSE
    v_prize_list := '[
      {"id":"prz_ship","label":"شحن مجاني 🚚","shortLabel":"شحن مجاني","type":"free_delivery","value":100},
      {"id":"prz_5pct","label":"خصم فوري 5% 🔥","shortLabel":"خصم 5%","type":"percentage","value":5},
      {"id":"prz_35egp","label":"هدية 35 ج.م 🎁","shortLabel":"هدية 35 ج","type":"fixed","value":35},
      {"id":"prz_8pct","label":"خصم خاص 8% ⚡","shortLabel":"خصم 8%","type":"percentage","value":8},
      {"id":"prz_50egp","label":"قسيمة 50 ج.م 💎","shortLabel":"قسيمة 50 ج","type":"fixed","value":50},
      {"id":"prz_10pct","label":"خصم سوبر 10% 🏆","shortLabel":"خصم 10%","type":"percentage","value":10}
    ]'::jsonb;
  END IF;

  v_prize_count := jsonb_array_length(v_prize_list);
  v_win_idx := floor(random() * v_prize_count)::INT;
  v_won_prize := v_prize_list->v_win_idx;

  v_disc_type := COALESCE(v_won_prize->>'type', 'percentage');
  v_disc_val := COALESCE((v_won_prize->>'value')::NUMERIC, 5);
  v_coupon_code := 'SPIN-' || upper(substring(md5(v_clean_user || v_now::text || random()::text) from 1 for 6));
  v_coupon_id := 'cpn_' || lower(v_coupon_code);
  v_next_eligible := v_now + make_interval(days => v_cooldown_days);
  v_expires := v_now + make_interval(days => v_validity_days);

  -- 5. إنشاء الكوبون باسم المستخدم في جدول coupons (صالح 7 أيام ويستخدم مرة واحدة فقط)
  INSERT INTO public.coupons (
    id, code, discount_type, discount_value, min_cart_total, max_discount_cap,
    expires_at, max_total_uses, used_count, max_uses_per_user, assigned_user_id,
    source_feature, description, active
  ) VALUES (
    v_coupon_id, v_coupon_code, v_disc_type, v_disc_val, 0, 400,
    v_expires, 1, 0, 1, v_clean_user,
    'spin_to_win', COALESCE(v_won_prize->>'label', 'جائزة عجلة الحظ'), true
  );

  -- 6. تسجيل اللفة في جدول spins وسجل user_rewards
  INSERT INTO public.spins (
    user_id, contact_identifier, prize_id, prize_label, coupon_id, coupon_code,
    discount_type, discount_value, spun_at, next_eligible_at, expires_at
  ) VALUES (
    v_clean_user, v_clean_contact, COALESCE(v_won_prize->>'id', 'prz'),
    COALESCE(v_won_prize->>'label', 'هدية عجلة الحظ'), v_coupon_id, v_coupon_code,
    v_disc_type, v_disc_val, v_now, v_next_eligible, v_expires
  );

  INSERT INTO public.user_rewards (user_id, reward_type, period_key, source, coupon_code, discount_value, metadata)
  VALUES (
    v_clean_user, 'spin_reward', to_char(v_now, 'IYYY-IW'), 'spin_to_win', v_coupon_code, v_disc_val,
    jsonb_build_object('prize_label', v_won_prize->>'label', 'win_idx', v_win_idx, 'expires_at', v_expires)
  ) ON CONFLICT (user_id, reward_type, period_key) DO NOTHING;

  RETURN jsonb_build_object(
    'ok', true,
    'win_idx', v_win_idx,
    'coupon_code', v_coupon_code,
    'expires_at', v_expires,
    'next_eligible_at', v_next_eligible,
    'cooldown_days', v_cooldown_days,
    'prize', jsonb_build_object(
      'id', COALESCE(v_won_prize->>'id', 'prz'),
      'label', COALESCE(v_won_prize->>'label', 'هدية عجلة الحظ'),
      'shortLabel', COALESCE(v_won_prize->>'shortLabel', v_won_prize->>'label'),
      'code', v_coupon_code,
      'type', v_disc_type,
      'value', v_disc_val
    )
  );
END;
$$;

-- 8.2 دالة التحقق السيرفري من الطلب والكوبونات وحد إيقاف البيع (2,000,000 ج.م) ومستوى الولاء عند إنشاء الأوردر
CREATE OR REPLACE FUNCTION public.rpc_validate_and_create_order(
  p_user_id TEXT,
  p_phone TEXT,
  p_subtotal_egp NUMERIC,
  p_delivery_fee_egp NUMERIC,
  p_coupon_code TEXT DEFAULT NULL,
  p_referral_code TEXT DEFAULT NULL,
  p_device_fingerprint TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cap_flag RECORD;
  v_loyalty_flag RECORD;
  v_ref_flag RECORD;
  v_period_sales NUMERIC := 0;
  v_max_sales_limit NUMERIC := 2000000;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
  v_client_spent NUMERIC := 0;
  v_loyalty_tier TEXT := 'bronze';
  v_loyalty_disc_pct NUMERIC := 0;
  v_loyalty_disc_egp NUMERIC := 0;
  v_coupon RECORD;
  v_user_redemptions INT := 0;
  v_coupon_disc_egp NUMERIC := 0;
  v_final_delivery_egp NUMERIC := p_delivery_fee_egp;
  v_referrer RECORD;
  v_prior_orders INT := 0;
  v_referral_attached BOOLEAN := false;
BEGIN
  -- 1. فحص حد "إيقاف البيع بالكامل" (2,000,000 ج.م) في السيرفر قبل السماح بأي طلب!
  SELECT * INTO v_cap_flag FROM public.feature_flags WHERE key = 'sales_cap_guard';
  IF FOUND AND v_cap_flag.enabled = true THEN
    v_max_sales_limit := COALESCE((v_cap_flag.config->>'max_sales_limit_egp')::NUMERIC, 2000000);
    v_period_start := COALESCE((v_cap_flag.config->>'period_start')::TIMESTAMPTZ, '2026-01-01T00:00:00Z'::TIMESTAMPTZ);
    v_period_end := COALESCE((v_cap_flag.config->>'period_end')::TIMESTAMPTZ, '2027-12-31T23:59:59Z'::TIMESTAMPTZ);

    SELECT COALESCE(SUM(
      (SELECT COALESCE(SUM((item->>'qty')::NUMERIC * (item->>'unitPriceBase')::NUMERIC), 0)
       FROM jsonb_array_elements(COALESCE(o.items, '[]'::jsonb)) AS item)
      - COALESCE(o.discount_base, 0)
    ), 0)
    INTO v_period_sales
    FROM public.orders o
    WHERE o.status <> 'ملغي';

    IF (v_period_sales + p_subtotal_egp) > v_max_sales_limit THEN
      RETURN jsonb_build_object(
        'ok', false,
        'error', 'SALES_CAP_EXCEEDED',
        'current_sales', v_period_sales,
        'max_sales_limit', v_max_sales_limit,
        'message', COALESCE(v_cap_flag.config->>'stop_message', 'نعتذر، تم الوصول للحد الأقصى للمبيعات المقررة (2,000,000 ج.م) وتم إيقاف استقبال طلبات جديدة.')
      );
    END IF;
  END IF;

  -- 2. حساب مستوى الولاء وخصمه التلقائي من إجمالي المشتريات الفعلية المدفوعة (بدون الملغي أو المرتجع)
  SELECT * INTO v_loyalty_flag FROM public.feature_flags WHERE key = 'loyalty_tiers';
  IF FOUND AND v_loyalty_flag.enabled = true AND p_user_id IS NOT NULL AND p_user_id <> 'guest' THEN
    SELECT COALESCE(SUM(
      (SELECT COALESCE(SUM((item->>'qty')::NUMERIC * (item->>'unitPriceBase')::NUMERIC), 0)
       FROM jsonb_array_elements(COALESCE(o.items, '[]'::jsonb)) AS item)
      - COALESCE(o.discount_base, 0)
    ), 0)
    INTO v_client_spent
    FROM public.orders o
    WHERE o.client_id = p_user_id AND o.status = 'تم التسليم';

    IF v_client_spent >= COALESCE((v_loyalty_flag.config->>'diamond_min_spent_egp')::NUMERIC, 30000) THEN
      v_loyalty_tier := 'diamond';
      v_loyalty_disc_pct := COALESCE((v_loyalty_flag.config->>'diamond_discount_pct')::NUMERIC, 12);
      v_final_delivery_egp := 0;
    ELSIF v_client_spent >= COALESCE((v_loyalty_flag.config->>'gold_min_spent_egp')::NUMERIC, 15000) THEN
      v_loyalty_tier := 'gold';
      v_loyalty_disc_pct := COALESCE((v_loyalty_flag.config->>'gold_discount_pct')::NUMERIC, 7);
    ELSIF v_client_spent >= COALESCE((v_loyalty_flag.config->>'silver_min_spent_egp')::NUMERIC, 5000) THEN
      v_loyalty_tier := 'silver';
      v_loyalty_disc_pct := COALESCE((v_loyalty_flag.config->>'silver_discount_pct')::NUMERIC, 3);
    END IF;

    IF v_loyalty_disc_pct > 0 THEN
      v_loyalty_disc_egp := ROUND((p_subtotal_egp * v_loyalty_disc_pct) / 100.0);
    END IF;
  END IF;

  -- 3. التحقق السيرفري الصارم من الكوبون عند إنشاء الطلب
  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE upper(code) = upper(trim(p_coupon_code))
    LIMIT 1;

    IF NOT FOUND OR v_coupon.active = false THEN
      RETURN jsonb_build_object('ok', false, 'error', 'INVALID_COUPON', 'message', 'كود الكوبون غير صحيح أو غير مفعل.');
    END IF;

    -- التحقق من أن الميزة التابع لها الكوبون مفعلة
    IF v_coupon.source_feature IS NOT NULL AND v_coupon.source_feature <> 'admin' THEN
      PERFORM 1 FROM public.feature_flags WHERE key = v_coupon.source_feature AND enabled = false;
      IF FOUND THEN
        RETURN jsonb_build_object('ok', false, 'error', 'COUPON_FEATURE_DISABLED', 'message', 'الميزة الخاصة بهذا الكوبون متوقفة حالياً.');
      END IF;
    END IF;

    IF v_coupon.expires_at < now() THEN
      RETURN jsonb_build_object('ok', false, 'error', 'COUPON_EXPIRED', 'message', 'انتهت صلاحية هذا الكوبون.');
    END IF;

    IF v_coupon.used_count >= v_coupon.max_total_uses THEN
      RETURN jsonb_build_object('ok', false, 'error', 'COUPON_MAXED_OUT', 'message', 'تم استنفاد الحد الأقصى لاستخدامات هذا الكوبون.');
    END IF;

    IF p_subtotal_egp < v_coupon.min_cart_total THEN
      RETURN jsonb_build_object('ok', false, 'error', 'MIN_CART_NOT_MET', 'message', format('الحد الأدنى للسلة لاستخدام هذا الكوبون هو %s ج.م.', v_coupon.min_cart_total));
    END IF;

    IF v_coupon.assigned_user_id IS NOT NULL AND v_coupon.assigned_user_id <> p_user_id AND v_coupon.assigned_user_id <> p_phone THEN
      RETURN jsonb_build_object('ok', false, 'error', 'COUPON_NOT_YOURS', 'message', 'هذا الكوبون مسجل باسم حساب آخر ولا يمكن استخدامه.');
    END IF;

    SELECT COUNT(*) INTO v_user_redemptions
    FROM public.coupon_redemptions
    WHERE coupon_id = v_coupon.id AND (user_id = p_user_id OR user_id = p_phone);

    IF v_user_redemptions >= v_coupon.max_uses_per_user THEN
      RETURN jsonb_build_object('ok', false, 'error', 'COUPON_ALREADY_USED', 'message', 'لقد استخدمت هذا الكوبون من قبل ولا يمكن استخدامه أكثر من مرة.');
    END IF;

    IF v_coupon.discount_type = 'percentage' THEN
      v_coupon_disc_egp := LEAST(v_coupon.max_discount_cap, ROUND((p_subtotal_egp * v_coupon.discount_value) / 100.0));
    ELSIF v_coupon.discount_type = 'fixed' THEN
      v_coupon_disc_egp := LEAST(v_coupon.max_discount_cap, v_coupon.discount_value, p_subtotal_egp);
    ELSIF v_coupon.discount_type = 'free_delivery' THEN
      v_final_delivery_egp := 0;
    END IF;
  END IF;

  -- 4. التحقق من إحالة الصديق (Refer-a-Friend) وتسجيلها لأول طلب فقط
  IF p_referral_code IS NOT NULL AND trim(p_referral_code) <> '' THEN
    SELECT * INTO v_ref_flag FROM public.feature_flags WHERE key = 'referral_program';
    IF FOUND AND v_ref_flag.enabled = true THEN
      SELECT COUNT(*) INTO v_prior_orders FROM public.orders WHERE client_id = p_user_id AND status <> 'ملغي';
      IF v_prior_orders = 0 THEN
        SELECT * INTO v_referrer
        FROM public.clients
        WHERE (upper(referral_code) = upper(trim(p_referral_code)) OR phone = trim(p_referral_code))
          AND id <> p_user_id
          AND phone <> COALESCE(p_phone, '')
        LIMIT 1;

        IF FOUND THEN
          INSERT INTO public.referrals (referrer_id, referred_id, referral_code, referred_phone, device_fingerprint, status, rewarded)
          VALUES (v_referrer.id, p_user_id, trim(p_referral_code), p_phone, p_device_fingerprint, 'pending', false)
          ON CONFLICT (referred_id) DO NOTHING;
          v_referral_attached := true;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'loyalty_tier', v_loyalty_tier,
    'loyalty_discount_pct', v_loyalty_disc_pct,
    'loyalty_discount_egp', v_loyalty_disc_egp,
    'coupon_discount_egp', v_coupon_disc_egp,
    'total_discount_egp', v_loyalty_disc_egp + v_coupon_disc_egp,
    'final_delivery_egp', v_final_delivery_egp,
    'referral_attached', v_referral_attached
  );
END;
$$;

-- 8.3 دالة إصدار كوبوني هدية دعوة الصديق للاثنين معاً (الداعي والمدعو) في نفس الـ Transaction عند أول طلب مدفوع!
CREATE OR REPLACE FUNCTION public.rpc_complete_referral_on_delivery(
  p_referred_user_id TEXT,
  p_order_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_flag RECORD;
  v_ref RECORD;
  v_reward_type TEXT := 'fixed';
  v_reward_val NUMERIC := 50;
  v_validity_days INT := 14;
  v_referrer_code TEXT;
  v_referred_code TEXT;
  v_expires TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_flag FROM public.feature_flags WHERE key = 'referral_program';
  IF NOT FOUND OR v_flag.enabled = false THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FEATURE_DISABLED');
  END IF;

  SELECT * INTO v_ref
  FROM public.referrals
  WHERE referred_id = p_referred_user_id AND rewarded = false
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'NO_PENDING_REFERRAL');
  END IF;

  v_reward_type := COALESCE(v_flag.config->>'reward_type', 'fixed');
  v_reward_val := COALESCE((v_flag.config->>'reward_value')::NUMERIC, 50);
  v_validity_days := COALESCE((v_flag.config->>'coupon_validity_days')::INT, 14);
  v_expires := now() + make_interval(days => v_validity_days);

  v_referrer_code := 'REFWIN-' || upper(substring(md5(v_ref.referrer_id || p_order_id || '1') from 1 for 6));
  v_referred_code := 'FRNDWIN-' || upper(substring(md5(v_ref.referred_id || p_order_id || '2') from 1 for 6));

  -- 1. إنشاء كوبون لصاحب الكود (الداعي)
  INSERT INTO public.coupons (
    id, code, discount_type, discount_value, min_cart_total, max_discount_cap,
    expires_at, max_total_uses, used_count, max_uses_per_user, assigned_user_id,
    source_feature, description, active
  ) VALUES (
    'cpn_' || lower(v_referrer_code), v_referrer_code, v_reward_type, v_reward_val, 0, 500,
    v_expires, 1, 0, 1, v_ref.referrer_id,
    'referral_program', 'هدية دعوة صديقك بنجاح (لصاحب الدعوة)', true
  );

  -- 2. إنشاء كوبون للصديق الجديد (المدعو) في نفس الـ Transaction!
  INSERT INTO public.coupons (
    id, code, discount_type, discount_value, min_cart_total, max_discount_cap,
    expires_at, max_total_uses, used_count, max_uses_per_user, assigned_user_id,
    source_feature, description, active
  ) VALUES (
    'cpn_' || lower(v_referred_code), v_referred_code, v_reward_type, v_reward_val, 0, 500,
    v_expires, 1, 0, 1, v_ref.referred_id,
    'referral_program', 'هدية أول طلب لك بدعوة صديقك (للصديق المدعو)', true
  );

  -- 3. تسجيل المكافأتين في user_rewards وتحديث referrals
  INSERT INTO public.user_rewards (user_id, reward_type, period_key, source, coupon_code, discount_value, metadata)
  VALUES
    (v_ref.referrer_id, 'referral_referrer', v_ref.referred_id, 'referral_program', v_referrer_code, v_reward_val, jsonb_build_object('order_id', p_order_id)),
    (v_ref.referred_id, 'referral_referred', 'lifetime', 'referral_program', v_referred_code, v_reward_val, jsonb_build_object('order_id', p_order_id))
  ON CONFLICT (user_id, reward_type, period_key) DO NOTHING;

  UPDATE public.referrals
  SET status = 'completed',
      rewarded = true,
      order_id = p_order_id,
      referrer_coupon_code = v_referrer_code,
      referred_coupon_code = v_referred_code,
      reward_amount = v_reward_val,
      rewarded_at = now()
  WHERE id = v_ref.id;

  RETURN jsonb_build_object(
    'ok', true,
    'referrer_id', v_ref.referrer_id,
    'referred_id', v_ref.referred_id,
    'referrer_coupon_code', v_referrer_code,
    'referred_coupon_code', v_referred_code,
    'reward_type', v_reward_type,
    'reward_value', v_reward_val
  );
END;
$$;

-- 8.4 دالة المطالبة بهدية عيد الميلاد (مرة واحدة في السنة بـ UNIQUE(user_id, year))
CREATE OR REPLACE FUNCTION public.rpc_claim_birthday_coupon(
  p_user_id TEXT,
  p_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_flag RECORD;
  v_year TEXT := to_char(now(), 'YYYY');
  v_existing RECORD;
  v_code TEXT;
  v_pct NUMERIC;
BEGIN
  SELECT * INTO v_flag FROM public.feature_flags WHERE key = 'birthday_and_seasonal';
  IF NOT FOUND OR v_flag.enabled = false THEN
    RETURN jsonb_build_object('ok', false, 'error', 'FEATURE_DISABLED', 'message', 'ميزة هدايا أعياد الميلاد غير مفعلة حالياً.');
  END IF;

  IF p_user_id IS NULL OR p_user_id = 'guest' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'AUTH_REQUIRED', 'message', 'يرجى تسجيل الدخول أولاً للحصول على هدية عيد ميلادك.');
  END IF;

  SELECT * INTO v_existing
  FROM public.user_rewards
  WHERE user_id = p_user_id AND reward_type = 'birthday_gift' AND period_key = v_year;

  IF FOUND THEN
    RETURN jsonb_build_object('ok', true, 'already_claimed', true, 'coupon_code', v_existing.coupon_code, 'discount_pct', v_existing.discount_value);
  END IF;

  v_pct := COALESCE((v_flag.config->>'birthday_discount_pct')::NUMERIC, 15);
  v_code := 'BDAY-' || v_year || '-' || upper(substring(md5(p_user_id || v_year) from 1 for 5));

  INSERT INTO public.coupons (
    id, code, discount_type, discount_value, min_cart_total, max_discount_cap,
    expires_at, max_total_uses, used_count, max_uses_per_user, assigned_user_id,
    source_feature, description, active
  ) VALUES (
    'cpn_' || lower(v_code), v_code, 'percentage', v_pct, 100, 500,
    now() + interval '14 days', 1, 0, 1, p_user_id,
    'birthday_and_seasonal', format('هدية عيد ميلادك لعام %s (-%s%%)', v_year, v_pct), true
  ) ON CONFLICT (code) DO NOTHING;

  INSERT INTO public.user_rewards (user_id, reward_type, period_key, source, coupon_code, discount_value)
  VALUES (p_user_id, 'birthday_gift', v_year, 'birthday_and_seasonal', v_code, v_pct);

  RETURN jsonb_build_object('ok', true, 'already_claimed', false, 'coupon_code', v_code, 'discount_pct', v_pct);
END;
$$;

-- إضافة الجداول الجديدة إلى Supabase Realtime Publication
DO $$
DECLARE
  tbl TEXT;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    FOREACH tbl IN ARRAY ARRAY['feature_flags', 'user_rewards', 'coupons', 'coupon_redemptions', 'spins', 'referrals']
    LOOP
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
      EXCEPTION WHEN duplicate_object OR undefined_table THEN
        NULL;
      END;
    END LOOP;
  END IF;
END $$;

COMMIT;
