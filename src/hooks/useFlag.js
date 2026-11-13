// =================================================================================
// UNIFIED FEATURE FLAGS HOOK: `src/hooks/useFlag.js`
// هوك موحد لكل الـ 18 ميزة يقرأ مباشرة من جدول `feature_flags` في السيرفر
// ويتحدث لحظياً عبر Supabase Realtime بدون الاعتماد على أي كاش قديم
// =================================================================================

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const DEFAULT_FEATURE_FLAGS_MAP = {
  live_social_proof: {
    enabled: true,
    config: { min_interval_sec: 20, max_interval_sec: 40, lookback_hours: 24 }
  },
  spin_to_win: {
    enabled: true,
    config: { cooldown_days: 7, coupon_validity_days: 7, require_auth_or_phone: true }
  },
  free_shipping_bar: {
    enabled: true,
    config: { target_amount_egp: 2000, confetti_once_per_session: true }
  },
  smart_cross_sell: {
    enabled: true,
    config: { max_suggestions: 3, bundle_discount_pct: 10 }
  },
  wallet_cashback: {
    enabled: true,
    config: { default_pct: 2, max_part_price_cap: 1500 }
  },
  quality_tiers: {
    enabled: true,
    config: { first_class_ratio: 60, economy_ratio: 35, original_label: 'أصلي 100%', first_class_label: 'فرز أول', economy_label: 'اقتصادي' }
  },
  trust_badges: {
    enabled: true,
    config: { low_stock_threshold: 5 }
  },
  exit_intent_popup: {
    enabled: true,
    config: {
      title: 'استنى! قبل ما تمشي.. خد خصم فوري على سلتك 🎁',
      subtitle: 'فعّل الكوبون الآن قبل انتهاء الوقت واستمتع بخصم فوري ومعاينة قبل الدفع',
      discount_pct: 5,
      promo_code: 'STAY5',
      cooldown_hours: 24,
      mobile_idle_sec: 30,
      duration_minutes: 15
    }
  },
  buy_more_save_more: {
    enabled: true,
    config: { tier2_min_qty: 2, tier2_discount_pct: 5, tier3_min_qty: 3, tier3_discount_pct: 10 }
  },
  cashier_impulse: {
    enabled: true,
    config: { max_price_egp: 1000, selection_mode: 'manual_first' }
  },
  loyalty_tiers: {
    enabled: true,
    config: {
      silver_min_spent_egp: 5000,
      gold_min_spent_egp: 15000,
      diamond_min_spent_egp: 30000,
      silver_discount_pct: 3,
      gold_discount_pct: 7,
      diamond_discount_pct: 12
    }
  },
  family_saved_devices: {
    enabled: true,
    config: { notify_on_new_part: true }
  },
  repurchase_reminders: {
    enabled: true,
    config: { reminder_months: 6, discount_pct: 10, promo_code: 'RENEW10' }
  },
  vip_secret_route: {
    enabled: true,
    config: { required_tier: 'gold', min_spent_egp: 15000, secret_token: 'elzoghbi-vip' }
  },
  warranty_lookup: {
    enabled: true,
    config: { default_warranty_days: 90 }
  },
  referral_program: {
    enabled: true,
    config: { reward_type: 'fixed', reward_value: 50, coupon_validity_days: 14, both_sides_rewarded: true }
  },
  birthday_and_seasonal: {
    enabled: true,
    config: {
      birthday_code: 'BDAY15',
      birthday_discount_pct: 15,
      seasonal_active: true,
      seasonal_name: 'عروض الموسم الحصرية',
      seasonal_code: 'SEASON10',
      seasonal_discount_pct: 10
    }
  },
  out_of_stock_notify: {
    enabled: true,
    config: { keep_visible: true, whatsapp_enabled: true }
  },
  sales_cap_guard: {
    enabled: true,
    config: {
      max_sales_limit_egp: 2000000,
      period_start: '2026-01-01',
      period_end: '2027-12-31',
      stop_message: 'نعتذر، تم الوصول للحد الأقصى للمبيعات المقررة لهذه الفترة (2,000,000 ج.م) ولا يمكن استقبال طلبات جديدة حالياً.'
    }
  }
};

export const FeatureFlagsContext = createContext({
  flagsMap: DEFAULT_FEATURE_FLAGS_MAP,
  useFlag: (key) => DEFAULT_FEATURE_FLAGS_MAP[key] || { enabled: false, config: {} },
  updateFlag: async () => {},
  refreshFlags: async () => {}
});

export function useFlag(flagKey) {
  const ctx = useContext(FeatureFlagsContext);
  const entry = ctx?.flagsMap?.[flagKey] || DEFAULT_FEATURE_FLAGS_MAP[flagKey] || { enabled: false, config: {} };
  return {
    key: flagKey,
    enabled: Boolean(entry.enabled),
    config: entry.config || {},
    updateFlag: (nextEnabled, nextConfigPatch) => ctx?.updateFlag?.(flagKey, nextEnabled, nextConfigPatch),
    refreshFlags: ctx?.refreshFlags
  };
}
