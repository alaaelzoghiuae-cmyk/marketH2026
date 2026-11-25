// ===================== Korombo Shared Config & Defaults (11 Services — 100% White-Labeled) =====================

export const KARAMBO_SERVICES = [
  { id: 'guide', title: 'دليل الموبايلات', desc: 'كل موديلات العالم بمواصفاتها وأسعارها في مصر', icon: 'Smartphone', color: 'bg-slate-700', badge: 'شامل' },
  { id: 'compare', title: 'قارن بنفسك', desc: 'قارن أي موبايل في العالم بالتفصيل', icon: 'Scale', color: 'bg-slate-700', badge: 'مباشر' },
  { id: 'reviews', title: 'تحريات كرومبو: تقييم المحلات', desc: 'اعرف تجارب الناس مع المحلات والمنصات قبل ما تشتري', icon: 'Shield', color: 'bg-slate-700', badge: 'جديد' },
  { id: 'news', title: 'آخر الأخبار', desc: 'أحدث أخبار ومراجعات وإطلاقات الموبايلات', icon: 'Megaphone', color: 'bg-slate-700', badge: '' },
  { id: 'wearables', title: 'ساعات وسماعات ذكية', desc: 'ساعات وسماعات أصلية من أشهر الماركات العالمية بالسعر وتقييم العملاء', icon: 'Watch', color: 'bg-slate-700', badge: 'جديد' },
  { id: 'choose', title: 'ساعدني أختار', desc: 'ترشيحات حية من السوق المصري على قد ميزانيتك', icon: 'Sparkles', color: 'bg-slate-700', badge: '' },
  { id: 'radar', title: 'رادار الأسعار', desc: 'مؤشر البورصة الحية: إيه نزل وإيه طلع النهاردة', icon: 'TrendingDown', color: 'bg-slate-700', badge: 'حي' },
  { id: 'gulf', title: 'من الخليج ولا مصر؟', desc: 'أسعار الخليج ومصر التلقائية مع حاسبة الجمارك والصرف', icon: 'Globe', color: 'bg-slate-700', badge: '' },
  { id: 'tradein', title: 'قيّم موبايلك القديم', desc: 'سعر بيع موبايلك العادل وفرق الاستبدال تلقائياً', icon: 'RotateCcw', color: 'bg-slate-700', badge: '' },
  { id: 'compatibility', title: 'فاحص التوافق', desc: 'إكسسوارات وشواحن متجرنا المتوافقة مع جهازك', icon: 'Cpu', color: 'bg-slate-700', badge: '' },
  { id: 'budget', title: 'على قد ميزانيتك', desc: 'منتجات وباكدجات المتجر جوه حدود سعرك', icon: 'Wallet', color: 'bg-slate-700', badge: '' },
  { id: 'installment', title: 'حاسبة التقسيط', desc: 'مقدم وخطط تقسيط وجدول شهور فوري', icon: 'Calculator', color: 'bg-slate-700', badge: '' }
];

export const KARAMBO_THEMES = {
  blue: { label: 'أزرق مؤسسي', from: '#0071E3', via: '#0071E3', to: '#0071E3', border: 'rgba(0,113,227,0.45)', text: '#FFFFFF' },
  dark: { label: 'فحمي داكن', from: '#1D1D1F', via: '#1D1D1F', to: '#1D1D1F', border: 'rgba(148,163,184,0.30)', text: '#FFFFFF' },
  emerald: { label: 'أخضر ثقة', from: '#248A3D', via: '#248A3D', to: '#248A3D', border: 'rgba(16,185,129,0.40)', text: '#FFFFFF' },
  violet: { label: 'بنفسجي هادئ', from: '#5E5CE6', via: '#5E5CE6', to: '#5E5CE6', border: 'rgba(100,96,170,0.40)', text: '#FFFFFF' },
  sunset: { label: 'برتقالي ترابي', from: '#C93400', via: '#C93400', to: '#C93400', border: 'rgba(200,100,30,0.40)', text: '#FFFFFF' },
  custom: { label: 'ألوان مخصصة', from: '#0071E3', via: '#0071E3', to: '#0071E3', border: 'rgba(0,113,227,0.45)', text: '#FFFFFF' }
};

export const KARAMBO_ICON_OPTIONS = [
  'Smartphone', 'Scale', 'Shield', 'Megaphone', 'Sparkles', 'Cpu', 'Wallet', 'TrendingDown',
  'Calculator', 'Globe', 'RotateCcw', 'Watch', 'Headphones', 'Zap', 'Award', 'Package', 'Tag', 'Layers', 'Gauge'
];

export const KARAMBO_COLOR_OPTIONS = [
  { id: 'bg-sky-500', label: 'سماوي' },
  { id: 'bg-blue-600', label: 'أزرق' },
  { id: 'bg-violet-500', label: 'بنفسجي' },
  { id: 'bg-indigo-500', label: 'نيلي' },
  { id: 'bg-amber-500', label: 'ذهبي' },
  { id: 'bg-orange-500', label: 'برتقالي' },
  { id: 'bg-emerald-500', label: 'زمردي' },
  { id: 'bg-emerald-600', label: 'أخضر ثقة' },
  { id: 'bg-teal-500', label: 'فيروزي' },
  { id: 'bg-rose-500', label: 'وردي' },
  { id: 'bg-cyan-600', label: 'سماوي غامق' },
  { id: 'bg-slate-700', label: 'رمادي داكن' }
];

export const DEFAULT_INSTALLMENT_PLANS = [
  { id: 'store_0', name: 'تقسيط بدون فوائد (6 شهور)', annualRatePct: 0, adminFeePct: 3, minDownPct: 20, months: [6] },
  { id: 'valu', name: 'فاليو (valU)', annualRatePct: 24, adminFeePct: 5, minDownPct: 0, months: [6, 12, 18, 24, 36] },
  { id: 'aman', name: 'أمان / سهولة', annualRatePct: 26, adminFeePct: 4, minDownPct: 10, months: [6, 12, 18, 24, 36] },
  { id: 'bank', name: 'تقسيط بنكي (بطاقة ائتمان)', annualRatePct: 18, adminFeePct: 2, minDownPct: 0, months: [6, 12, 18, 24, 36] }
];

export const DEFAULT_QUICK_COMPARISONS = [
  { id: 'qc_1', label: 'iPhone 16 Pro Max vs Galaxy S25 Ultra', slugs: ['apple_iphone_16_pro_max-13123', 'samsung_galaxy_s25_ultra-13322'] },
  { id: 'qc_2', label: 'Galaxy A55 vs Redmi Note 14 Pro', slugs: ['samsung_galaxy_a55-12824', 'xiaomi_redmi_note_14_pro_5g-13393'] },
  { id: 'qc_3', label: 'iPhone 16 vs Galaxy S25', slugs: ['apple_iphone_16-13317', 'samsung_galaxy_s25-13610'] }
];

export const DEFAULT_GULF_FX = { AED: 13.05, SAR: 12.7, KWD: 156, QAR: 13.15, OMR: 123, BHD: 127 };

export const DEFAULT_KARAMBO_CFG = {
  enabled: true,
  title: 'كرومبو الشغلانة',
  subtitle: 'كرومبو المحقق بيدوّر في كل موبايلات العالم، يقارن، يرصد الأسعار والأخبار، ويكشف تقييمات المحلات قبل ما تشتري',
  badgeText: 'أدوات ذكية مجانية',
  disclaimer: 'الأسعار المعروضة استرشادية للسوق المصري والعالمي — والأجهزة المعروضة في الدليل ليست للبيع المباشر لدينا',
  layout: 'full',
  showMascot: true,
  mascotUrl: '/karambo.png',
  theme: 'blue',
  customFrom: '#1E4E8C',
  customTo: '#1E4E8C',
  services: {},
  serviceOrder: KARAMBO_SERVICES.map(s => s.id),
  serviceOverrides: {},
  installmentRatePct: 0,
  installmentPlans: DEFAULT_INSTALLMENT_PLANS,
  installmentWhatsApp: '',
  installmentDisclaimer: 'دي حاسبة استرشادية لتوضيح الصورة — شروط التقسيط الفعلية (البنك/الشركة والموافقات) بتتأكد مع خدمة العملاء قبل إتمام أي طلب.',
  compareCfg: {
    gsmarenaLive: true,
    maxDevices: 3,
    defaultDiffOnly: false,
    showVerdict: true,
    showAccessoriesCta: true,
    quickComparisons: DEFAULT_QUICK_COMPARISONS
  },
  gulfCfg: {
    defaultTaxPct: 38.5,
    defaultShippingEgp: 0,
    enableLiveFx: true,
    autoFetchPrices: true,
    customsWarningText: 'تنبيه هام: توجد ضريبة جمركية/اتصالات بحوالي 38.5% تُحسب على القيمة التقديرية التي تحددها الجمارك المصرية (وقد تختلف عن سعر الفاتورة الفعلي).',
    fxRates: DEFAULT_GULF_FX
  },
  guideCfg: {
    enableGlobalCatalog: true,
    autoFetchEgyptPrice: false,
    notInEgyptLabel: 'غير متوفر في مصر حالياً',
    showNewsBannerInGuide: true,
    allowImportCta: true,
    allowPriceAlerts: true,
    valueWeights: { camera: 30, battery: 25, screen: 20, ram: 25 },
    storeBudgets: [500, 1000, 2000, 5000, 10000],
    enableBundleBuilder: true
  },
  newsCfg: {
    enabledLive: true,
    bannerTitle: 'آخر أخبار الموبايلات',
    maxArticles: 18,
    customArticles: []
  },
  marketCfg: {
    enableLiveAdvisor: true,
    enableLiveRadar: true
  },
  tradeInCfg: {
    autoFetchEgyptPrice: true,
    whatsapp: '',
    condMult: { mint: 0.78, good: 0.68, fair: 0.56, cracked: 0.38 },
    noBoxPenaltyPct: 5,
    lowBatteryPenaltyPct: 7,
    agePenaltyPerYearPct: 8
  },
  reviewsCfg: {
    requireApproval: true,
    requireLoginToReview: true,
    googlePlacesApiKey: '', // Moderation queue by default
    allowNewStoreSubmission: true,
    allowProofUpload: true,
    loyaltyRewardNote: 'التقييمات الموثّقة والمفيدة بتتراجع وبتاخد أولوية ونقاط مكافأة في حسابك!',
    showGoogleRatings: true,
    showStoreCta: true
  }
};

export function mergeKaramboCfg(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    ...DEFAULT_KARAMBO_CFG,
    ...r,
    services: { ...(r.services || {}) },
    serviceOrder: Array.isArray(r.serviceOrder) && r.serviceOrder.length ? r.serviceOrder : DEFAULT_KARAMBO_CFG.serviceOrder,
    serviceOverrides: { ...(r.serviceOverrides || {}) },
    installmentPlans: Array.isArray(r.installmentPlans) && r.installmentPlans.length ? r.installmentPlans : DEFAULT_INSTALLMENT_PLANS,
    compareCfg: { ...DEFAULT_KARAMBO_CFG.compareCfg, ...(r.compareCfg || {}) },
    gulfCfg: {
      ...DEFAULT_KARAMBO_CFG.gulfCfg,
      ...(r.gulfCfg || {}),
      fxRates: { ...DEFAULT_GULF_FX, ...((r.gulfCfg && r.gulfCfg.fxRates) || {}) }
    },
    guideCfg: {
      ...DEFAULT_KARAMBO_CFG.guideCfg,
      ...(r.guideCfg || {}),
      valueWeights: { ...DEFAULT_KARAMBO_CFG.guideCfg.valueWeights, ...((r.guideCfg && r.guideCfg.valueWeights) || {}) }
    },
    newsCfg: {
      ...DEFAULT_KARAMBO_CFG.newsCfg,
      ...(r.newsCfg || {}),
      customArticles: Array.isArray(r.newsCfg && r.newsCfg.customArticles) ? r.newsCfg.customArticles : []
    },
    marketCfg: { ...DEFAULT_KARAMBO_CFG.marketCfg, ...(r.marketCfg || {}) },
    tradeInCfg: {
      ...DEFAULT_KARAMBO_CFG.tradeInCfg,
      ...(r.tradeInCfg || {}),
      condMult: { ...DEFAULT_KARAMBO_CFG.tradeInCfg.condMult, ...((r.tradeInCfg && r.tradeInCfg.condMult) || {}) }
    },
    reviewsCfg: { ...DEFAULT_KARAMBO_CFG.reviewsCfg, ...(r.reviewsCfg || {}) }
  };
}

export function getOrderedKaramboServices(rawCfg) {
  const cfg = mergeKaramboCfg(rawCfg);
  const byId = new Map(KARAMBO_SERVICES.map(s => [s.id, s]));
  const orderedIds = [...new Set([...(cfg.serviceOrder || []), ...KARAMBO_SERVICES.map(s => s.id)])];
  return orderedIds
    .map(id => {
      const base = byId.get(id);
      if (!base) return null;
      const ov = (cfg.serviceOverrides && cfg.serviceOverrides[id]) || {};
      return {
        ...base,
        title: ov.title !== undefined && ov.title !== '' ? ov.title : base.title,
        desc: ov.desc !== undefined && ov.desc !== '' ? ov.desc : base.desc,
        icon: ov.icon || base.icon,
        color: ov.color || base.color,
        badge: ov.badge !== undefined ? ov.badge : base.badge,
        enabled: !cfg.services || cfg.services[id] !== false
      };
    })
    .filter(Boolean);
}

export function resolveKaramboBarStyle(rawCfg) {
  const cfg = mergeKaramboCfg(rawCfg);
  const preset = KARAMBO_THEMES[cfg.theme] || KARAMBO_THEMES.blue;
  const from = cfg.theme === 'custom' ? (cfg.customFrom || '#1D4ED8') : preset.from;
  const to = cfg.theme === 'custom' ? (cfg.customTo || '#0EA5E9') : preset.to;
  const via = cfg.theme === 'custom' ? from : preset.via;
  return {
    background: `linear-gradient(to left, ${from}, ${via}, ${to})`,
    borderColor: preset.border,
    color: preset.text
  };
}
