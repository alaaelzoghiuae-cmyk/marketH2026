// =============================================================================
// ELZOGHBI MARKET — Advanced Admin Control Center Engine
// Centralized Design Tokens, Section/Page Registries, Discovered Controls,
// Version History & Backup, Advanced RBAC Roles, Per-Admin UI Preferences,
// and Global Deep-Link Control Search Index.
// =============================================================================

export const DEFAULT_THEME_TOKENS = {
  light: {
    primary: '#0071E3',
    secondary: '#1D1D1F',
    accent: '#0066CC',
    bg: '#FFFFFF',
    surface: '#F5F5F7',
    surface2: '#E8E8ED',
    text: '#1D1D1F',
    muted: '#6E6E73',
    border: '#D9D9DE',
    buttonBg: '#0071E3',
    buttonText: '#FFFFFF',
    link: '#0066CC',
    cardBg: '#F5F5F7',
    headerBg: 'rgba(255, 255, 255, 0.82)',
    footerBg: '#F5F5F7',
    alertBg: '#FFF4E5',
    badgeBg: '#FF3B30'
  },
  dark: {
    primary: '#0071E3',
    secondary: '#F5F5F7',
    accent: '#2997FF',
    bg: '#000000',
    surface: '#1D1D1F',
    surface2: '#2C2C2E',
    text: '#F5F5F7',
    muted: '#A1A1A6',
    border: '#38383A',
    buttonBg: '#0071E3',
    buttonText: '#FFFFFF',
    link: '#2997FF',
    cardBg: '#1D1D1F',
    headerBg: 'rgba(22, 22, 23, 0.82)',
    footerBg: '#161617',
    alertBg: '#2C2112',
    badgeBg: '#FF453A'
  },
  typography: {
    fontAr: "'IBM Plex Sans Arabic', 'Cairo', 'SF Arabic', system-ui, sans-serif",
    fontEn: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif",
    headingScale: 1.0,
    bodySize: 15,
    mobileBodySize: 14,
    fontWeightHeading: 700,
    lineHeight: 1.55
  },
  components: {
    cardRadius: 20,
    buttonRadius: 980,
    inputRadius: 12,
    cardShadow: 'subtle', // 'none' | 'subtle' | 'elevated'
    productCardDensity: 'comfortable', // 'compact' | 'comfortable' | 'spacious'
    badgeStyle: 'pill', // 'pill' | 'rounded' | 'square'
    navStyle: 'glass' // 'glass' | 'solid' | 'bordered'
  }
};

export const ARABIC_FONT_PRESETS = [
  { id: 'ibm', label: 'IBM Plex Sans Arabic (افتراضي احترافي)', value: "'IBM Plex Sans Arabic', 'Cairo', system-ui, sans-serif" },
  { id: 'cairo', label: 'Cairo (عصري وواضح)', value: "'Cairo', 'IBM Plex Sans Arabic', system-ui, sans-serif" },
  { id: 'tajawal', label: 'Tajawal (ناعم ومقروء)', value: "'Tajawal', 'Cairo', system-ui, sans-serif" },
  { id: 'system', label: 'خط النظام الأصلي (SF Arabic / Segoe)', value: "-apple-system, BlinkMacSystemFont, 'SF Arabic', system-ui, sans-serif" }
];

export const ENGLISH_FONT_PRESETS = [
  { id: 'sf', label: 'SF Pro / Inter (Apple Style)', value: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif" },
  { id: 'inter', label: 'Inter (Clean UI)', value: "'Inter', system-ui, sans-serif" },
  { id: 'jakarta', label: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" },
  { id: 'mono', label: 'SF Mono / Technical', value: "ui-monospace, 'SF Mono', Menlo, monospace" }
];

// Convert #RRGGBB to "R G B" triplet for Tailwind rgb(var(--...)) tokens
export function hexToRgbTriplet(hex) {
  if (!hex || typeof hex !== 'string') return null;
  const clean = hex.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function normalizeThemeTokens(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    light: { ...DEFAULT_THEME_TOKENS.light, ...(src.light || {}) },
    dark: { ...DEFAULT_THEME_TOKENS.dark, ...(src.dark || {}) },
    typography: { ...DEFAULT_THEME_TOKENS.typography, ...(src.typography || {}) },
    components: { ...DEFAULT_THEME_TOKENS.components, ...(src.components || {}) }
  };
}

// Live DOM injection of Design Tokens (respects Light & Dark independently without breaking Admin UI)
export function applyThemeTokensToDocument(rawTokens, mode = 'light') {
  if (typeof document === 'undefined') return;
  const tokens = normalizeThemeTokens(rawTokens);
  const styleId = 'elz-live-theme-tokens-style';
  let el = document.getElementById(styleId);
  if (!el) {
    el = document.createElement('style');
    el.id = styleId;
    document.head.appendChild(el);
  }

  const buildModeVars = (m) => {
    const pairs = [
      ['--bg', hexToRgbTriplet(m.bg)],
      ['--surface', hexToRgbTriplet(m.surface)],
      ['--surface2', hexToRgbTriplet(m.surface2)],
      ['--fg', hexToRgbTriplet(m.text)],
      ['--muted', hexToRgbTriplet(m.muted)],
      ['--line', hexToRgbTriplet(m.border)],
      ['--accent', hexToRgbTriplet(m.primary)],
      ['--accent-text', hexToRgbTriplet(m.accent)],
      ['--go', hexToRgbTriplet(m.buttonBg)],
      ['--go-ink', hexToRgbTriplet(m.buttonText)],
      ['--sale', hexToRgbTriplet(m.badgeBg)]
    ].filter(([, v]) => Boolean(v));
    const direct = [
      m.headerBg ? `--nav-glass: ${m.headerBg};` : '',
      m.footerBg ? `--elz-footer-bg: ${m.footerBg};` : '',
      m.cardBg ? `--elz-card-bg: ${m.cardBg};` : '',
      m.link ? `--elz-link-color: ${m.link};` : ''
    ].filter(Boolean);
    return [...pairs.map(([k, v]) => `${k}: ${v};`), ...direct].join('\n  ');
  };

  const t = tokens.typography;
  const c = tokens.components;
  const shadowVal = c.cardShadow === 'elevated'
    ? '0 10px 30px rgba(0,0,0,0.12)'
    : c.cardShadow === 'subtle'
      ? '0 2px 10px rgba(0,0,0,0.05)'
      : 'none';

  el.textContent = `
:root {
  ${buildModeVars(tokens.light)}
  --radius-card: ${Number(c.cardRadius) || 20}px;
  --radius-ctrl: ${Number(c.inputRadius) || 12}px;
  --r-pill: ${Number(c.buttonRadius) || 980}px;
  --shadow-card: ${shadowVal};
  --font-sans: ${t.fontEn}, ${t.fontAr};
  --elz-font-ar: ${t.fontAr};
  --elz-font-en: ${t.fontEn};
  --elz-body-size: ${Number(t.bodySize) || 15}px;
  --elz-mobile-body-size: ${Number(t.mobileBodySize) || 14}px;
  --elz-heading-scale: ${Number(t.headingScale) || 1};
  --elz-line-height: ${Number(t.lineHeight) || 1.55};
}
.dark {
  ${buildModeVars(tokens.dark)}
}
[dir="rtl"] body, html[lang="ar"] body {
  font-family: var(--elz-font-ar);
  line-height: var(--elz-line-height);
}
[dir="ltr"] body, html[lang="en"] body {
  font-family: var(--elz-font-en);
  line-height: var(--elz-line-height);
}
.elz-home { font-size: var(--elz-body-size); }
@media (max-width: 639px) { .elz-home { font-size: var(--elz-mobile-body-size); } }
`.trim();
  return mode;
}

// =============================================================================
// HOMEPAGE SECTION BUILDER REGISTRY (Connected directly to Storefront.jsx!)
// =============================================================================
export const DEFAULT_HOME_SECTIONS = [
  {
    id: 'hero_ads',
    type: 'hero_ads',
    labelAr: 'البانر الرئيسي والإعلانات المميزة',
    labelEn: 'Hero Campaigns & Featured Ads',
    visible: true,
    devices: { desktop: true, tablet: true, mobile: true },
    style: { paddingY: 'normal', bgMode: 'default', accentColor: '' },
    content: { showTrustStrip: true }
  },
  {
    id: 'karambo_strip',
    type: 'karambo_strip',
    labelAr: 'شريط خدمات كرومبو الشغلانة',
    labelEn: 'Karambo Smart Services Strip',
    visible: true,
    devices: { desktop: true, tablet: true, mobile: true },
    style: { paddingY: 'normal', bgMode: 'default', accentColor: '' },
    content: {}
  },
  {
    id: 'legacy_strips',
    type: 'legacy_strips',
    labelAr: 'اختصارات الأقسام وشريط البراندات',
    labelEn: 'Category Shortcuts & Brands Bar',
    visible: true,
    devices: { desktop: true, tablet: true, mobile: true },
    style: { paddingY: 'compact', bgMode: 'default', accentColor: '' },
    content: { brandsHeading: 'تصفح حسب البراند', brandsCta: 'عرض كل البراندات' }
  },
  {
    id: 'sourcing_tile',
    type: 'sourcing_tile',
    labelAr: 'قسم خدمة «اطلب منتجك» (الاستيراد الخاص)',
    labelEn: 'Special Sourcing Service Tile',
    visible: true,
    devices: { desktop: true, tablet: true, mobile: true },
    style: { paddingY: 'normal', bgMode: 'dark', accentColor: '#0071E3' },
    content: {
      eyebrow: 'استيراد وتوفير خاص',
      title: 'خدمة اطلب منتجك',
      subtitle: 'ملقتش المنتج اللي بتدور عليه؟ ابعتلنا اسمه أو صورته وهنوفرهولك بأفضل سعر.',
      ctaText: 'اطلب منتجك'
    }
  },
  {
    id: 'editorial_showcase',
    type: 'editorial_showcase',
    labelAr: 'المعرض التحريري (الأقسام وعروض البنتو)',
    labelEn: 'Apple-Style Editorial Showcase',
    visible: true,
    devices: { desktop: true, tablet: true, mobile: true },
    style: { paddingY: 'normal', bgMode: 'default', accentColor: '' },
    content: {}
  },
  {
    id: 'promo_split',
    type: 'promo_split',
    labelAr: 'العروض الترويجية المقسّمة',
    labelEn: 'Promotional Banners Split',
    visible: true,
    devices: { desktop: true, tablet: true, mobile: true },
    style: { paddingY: 'normal', bgMode: 'default', accentColor: '' },
    content: {}
  },
  {
    id: 'best_sellers',
    type: 'best_sellers',
    labelAr: 'الأكثر مبيعاً وطلباً',
    labelEn: 'Best Sellers Grid',
    visible: true,
    devices: { desktop: true, tablet: true, mobile: true },
    style: { paddingY: 'normal', bgMode: 'default', accentColor: '' },
    content: {
      title: 'الأكثر مبيعاً وطلباً',
      subtitle: 'منتجات مختارة بأعلى تقييم وسحب فوري من المخزن',
      ctaText: 'عرض الكل',
      limit: 4,
      layout: 'rail' // 'rail' | 'grid'
    }
  },
  {
    id: 'showcase_bars',
    type: 'showcase_bars',
    labelAr: 'بارات عرض المنتجات المختارة',
    labelEn: 'Curated Product Showcase Bars',
    visible: true,
    devices: { desktop: true, tablet: true, mobile: true },
    style: { paddingY: 'normal', bgMode: 'default', accentColor: '' },
    content: {}
  },
  {
    id: 'newsletter',
    type: 'newsletter',
    labelAr: 'النشرة البريدية والعروض',
    labelEn: 'Newsletter Subscription',
    visible: true,
    devices: { desktop: true, tablet: true, mobile: true },
    style: { paddingY: 'normal', bgMode: 'surface', accentColor: '#0071E3' },
    content: {
      title: 'اشترك في نشرتنا البريدية',
      subtitle: 'ليصلك أحدث العروض والمنتجات الجديدة وكوبونات الخصم أولاً بأول.',
      placeholder: 'بريدك الإلكتروني أو رقم واتساب',
      ctaText: 'اشترك'
    }
  }
];

export const CUSTOM_SECTION_TEMPLATES = [
  {
    type: 'custom_banner',
    labelAr: 'بانر ترويجي مخصص (صورة + عنوان + زر)',
    labelEn: 'Custom Promo Banner',
    defaultContent: {
      eyebrow: 'عرض حصري',
      title: 'تخفيضات الموسم على قطع الغيار الأصلية',
      subtitle: 'اطلب الآن واستمتع بشحن سريع وضمان حقيقي من الزغبي ماركت.',
      ctaText: 'تصفح العروض',
      ctaAction: 'search',
      imageUrl: ''
    },
    defaultStyle: { bgMode: 'accent', paddingY: 'normal', accentColor: '#0071E3' }
  },
  {
    type: 'custom_products',
    labelAr: 'قسم منتجات ديناميكي (حسب القسم أو الخصم)',
    labelEn: 'Dynamic Products Section',
    defaultContent: {
      title: 'عروض مختارة لك',
      subtitle: 'أفضل المنتجات المتاحة الآن في المخزن',
      sourceType: 'discounts', // 'discounts' | 'latest' | 'category'
      sourceValue: '',
      limit: 4,
      layout: 'grid'
    },
    defaultStyle: { bgMode: 'default', paddingY: 'normal', accentColor: '#0071E3' }
  },
  {
    type: 'custom_features',
    labelAr: 'شبكة مميزات / خدمات (4 كروت)',
    labelEn: 'Features / Services Grid',
    defaultContent: {
      title: 'لماذا تختار الزغبي ماركت؟',
      items: [
        { icon: '⚡', title: 'تجهيز فوري', desc: 'شحن في نفس اليوم لجميع المحافظات' },
        { icon: '🛡️', title: 'ضمان استبدال', desc: 'فحص شامل قبل وبعد الاستلام' },
        { icon: '💎', title: 'جودة أصلية', desc: 'درجات جودة واضحة ومعتمدة' },
        { icon: '💬', title: 'دعم فني مباشر', desc: 'رد سريع عبر واتساب طوال الأسبوع' }
      ]
    },
    defaultStyle: { bgMode: 'surface', paddingY: 'normal', accentColor: '#0071E3' }
  },
  {
    type: 'custom_faq',
    labelAr: 'قسم الأسئلة الشائعة (FAQ)',
    labelEn: 'FAQ Accordion',
    defaultContent: {
      title: 'الأسئلة الشائعة',
      items: [
        { q: 'كيف أتأكد من توافق قطعة الغيار مع جهازي؟', a: 'يمكنك استخدام أداة فحص التوافق في كرومبو الشغلانة أو التواصل معنا عبر واتساب.' },
        { q: 'ما هي مدة التوصيل للمحافظات؟', a: 'من 24 إلى 48 ساعة عمل لمعظم المحافظات مع إمكانية المعاينة قبل الاستلام.' }
      ]
    },
    defaultStyle: { bgMode: 'default', paddingY: 'normal', accentColor: '#0071E3' }
  }
];

export const DEFAULT_TRUST_BADGES = [
  { id: 'tb1', icon: 'check', title: 'ضمان حقيقي معتمد', desc: 'استبدال وفحص فوري', visible: true },
  { id: 'tb2', icon: 'truck', title: 'شحن سريع ومؤمّن', desc: 'لجميع المحافظات', visible: true },
  { id: 'tb3', icon: 'shield', title: 'معاينة ودفع آمن', desc: 'عند الاستلام أو بالمحفظة', visible: true },
  { id: 'tb4', icon: 'phone', title: 'دعم ومتابعة مستمرة', desc: 'خدمة عملاء سريعة', visible: true }
];

export const DEFAULT_DISCOVERED_CONTROLS = {
  trustBadges: DEFAULT_TRUST_BADGES,
  emptyStates: {
    searchNoResultsTitle: 'لم نجد منتجات مطابقة لبحثك',
    searchNoResultsSubtitle: 'جرّب كلمة بحث أخرى أو اطلب توفير المنتج عبر خدمة «اطلب منتجك».',
    cartEmptyTitle: 'سلة التسوق فارغة حالياً',
    cartEmptySubtitle: 'أضف قطع الغيار أو الإكسسوارات التي تحتاجها للبدء.',
    ordersEmptyTitle: 'لا توجد طلبات مسجلة بعد'
  },
  errorMessages: {
    networkError: 'تعذر الاتصال بالسيرفر، تأكد من اتصالك بالإنترنت وحاول مرة أخرى.',
    loginRequired: 'يرجى تسجيل الدخول أولاً لإتمام هذه العملية.',
    outOfStock: 'عذراً، هذا المنتج غير متوفر حالياً بالمخزن.'
  },
  seo: {
    siteTitle: 'ELZOGHBI MARKET — الزغبي ماركت لقطع غيار وإكسسوارات الموبايل',
    metaDescription: 'أكبر منصة لقطع غيار وإكسسوارات الموبايل الأصلية، دليل الموبايلات، وخدمات كرومبو الشغلانة في مصر.',
    ogImage: '/elzoghbi-logo-full.webp',
    canonicalUrl: 'https://elzoghbi.market-h.com/'
  },
  legalPages: {
    privacyPolicy: 'نلتزم في الزغبي ماركت بحماية خصوصية بيانات عملائنا وعدم مشاركتها مع أي طرف ثالث إلا لغرض توصيل الطلبات.',
    returnPolicy: 'يحق للعميل استبدال أو استرجاع المنتج خلال 14 يوماً وفق شروط الضمان والمعاينة المعتمدة.',
    termsOfUse: 'باستخدامك لموقع الزغبي ماركت فإنك توافق على سياسات التسعير والشحن والضمان الموضحة في المتجر.'
  },
  productDisplay: {
    showSkuOnCard: false,
    showStockBadge: true,
    showQuickAddBtn: true,
    showCompareBtn: true,
    gridDesktopCols: 4,
    gridMobileCols: 2
  }
};

export const DEFAULT_CMS_PAGES = [
  {
    id: 'page_about',
    slug: 'about-elzoghbi',
    titleAr: 'عن الزغبي ماركت',
    titleEn: 'About Elzoghbi Market',
    template: 'about',
    status: 'published',
    showInHeader: false,
    showInFooter: true,
    seoTitle: 'عن الزغبي ماركت | Elzoghbi Market',
    seoDescription: 'تعرف على قصة الزغبي ماركت وخدمات قطع غيار وإكسسوارات الموبايل الأصلية.',
    sections: [
      {
        id: 'sec_about_hero',
        type: 'custom_banner',
        visible: true,
        devices: { desktop: true, tablet: true, mobile: true },
        style: { bgMode: 'accent', paddingY: 'normal', accentColor: '#0071E3' },
        content: {
          eyebrow: 'من نحن',
          title: 'الزغبي ماركت — شريكك الموثوق في عالم الموبايل',
          subtitle: 'نوفر قطع غيار أصلية وإكسسوارات معتمدة للتجار والأفراد بأفضل الأسعار وضمان حقيقي.',
          ctaText: 'تصفح المنتجات',
          ctaAction: 'search'
        }
      }
    ]
  },
  {
    id: 'page_warranty',
    slug: 'warranty-policy',
    titleAr: 'سياسة الضمان والاستبدال',
    titleEn: 'Warranty & Returns',
    template: 'legal',
    status: 'published',
    showInHeader: false,
    showInFooter: true,
    seoTitle: 'سياسة الضمان والاستبدال | Elzoghbi Market',
    seoDescription: 'تفاصيل ضمان الفحص والاستبدال في الزغبي ماركت.',
    sections: [
      {
        id: 'sec_warr_faq',
        type: 'custom_faq',
        visible: true,
        devices: { desktop: true, tablet: true, mobile: true },
        style: { bgMode: 'default', paddingY: 'normal', accentColor: '#0071E3' },
        content: {
          title: 'شروط الضمان والاستبدال',
          items: [
            { q: 'مدة الضمان على قطع الغيار', a: 'تخضع جميع الشاشات والبطاريات الأصلية لضمان فحص واستبدال فوري ضد عيوب الصناعة.' },
            { q: 'خطوات تقديم طلب مرتجع', a: 'من حسابك الشخصي اختر «المرتجعات والضمان» أو تواصل معنا مباشرة برقم الفاتورة.' }
          ]
        }
      }
    ]
  }
];

export const PAGE_TEMPLATES = [
  { id: 'landing', labelAr: 'صفحة هبوط لعرض أو حملة (Landing Page)', sections: [CUSTOM_SECTION_TEMPLATES[0], CUSTOM_SECTION_TEMPLATES[1], CUSTOM_SECTION_TEMPLATES[2]] },
  { id: 'service', labelAr: 'صفحة خدمة متخصصة (Service Page)', sections: [CUSTOM_SECTION_TEMPLATES[0], CUSTOM_SECTION_TEMPLATES[2], CUSTOM_SECTION_TEMPLATES[3]] },
  { id: 'legal', labelAr: 'صفحة معلومات / أسئلة شائعة (Info & FAQ)', sections: [CUSTOM_SECTION_TEMPLATES[3]] },
  { id: 'blank', labelAr: 'صفحة فارغة (Blank)', sections: [] }
];

// =============================================================================
// ADVANCED RBAC — 9 STANDARD ROLES + GRANULAR CAPABILITIES
// =============================================================================
export const ADVANCED_RBAC_ROLES = [
  {
    id: 'super_admin',
    nameAr: 'مدير عام (Super Admin)',
    nameEn: 'Super Admin',
    color: 'blue',
    desc: 'تحكم كامل في الموقع والبيانات والصلاحيات والتصميم والإصدارات',
    pages: ['*'],
    capabilities: { canView: true, canEdit: true, canDelete: true, canPublish: true, canManageUsers: true, canEditTheme: true, canManagePermissions: true, canRestoreVersions: true }
  },
  {
    id: 'website_manager',
    nameAr: 'مدير الموقع (Website Manager)',
    nameEn: 'Website Manager',
    color: 'indigo',
    desc: 'إدارة الصفحات والأقسام والمحرر المرئي والإعدادات والخدمات',
    pages: ['overview', 'visual_editor', 'theme_editor', 'page_builder', 'storefront_cms', 'site_settings', 'karambo', 'version_history'],
    capabilities: { canView: true, canEdit: true, canDelete: false, canPublish: true, canManageUsers: false, canEditTheme: true, canManagePermissions: false, canRestoreVersions: true }
  },
  {
    id: 'design_manager',
    nameAr: 'مدير التصميم (Design Manager)',
    nameEn: 'Design Manager',
    color: 'violet',
    desc: 'إدارة الألوان والخطوط والوضع الليلي والنهاري والمحرر المرئي',
    pages: ['overview', 'visual_editor', 'theme_editor', 'page_builder', 'storefront_cms', 'version_history'],
    capabilities: { canView: true, canEdit: true, canDelete: false, canPublish: true, canManageUsers: false, canEditTheme: true, canManagePermissions: false, canRestoreVersions: true }
  },
  {
    id: 'advertisement_manager',
    nameAr: 'مدير الإعلانات (Advertisement Manager)',
    nameEn: 'Advertisement Manager',
    color: 'amber',
    desc: 'إدارة البنرات الإعلانية ومراجعة إعلانات بيع الموبايلات والكوبونات',
    pages: ['overview', 'storefront_cms', 'marketplace', 'promos', 'feature_flags'],
    capabilities: { canView: true, canEdit: true, canDelete: true, canPublish: true, canManageUsers: false, canEditTheme: false, canManagePermissions: false, canRestoreVersions: false }
  },
  {
    id: 'products_manager',
    nameAr: 'مدير المنتجات (Products Manager)',
    nameEn: 'Products Manager',
    color: 'emerald',
    desc: 'إدارة الكتالوج والمخزون والتسعير الذكي والاستيراد وجودة الصور',
    pages: ['overview', 'catalog', 'excel_products', 'smart_pricing', 'ai_product_sourcing', 'bulk_importer', 'quality_images', 'quick_stock', 'restock_alerts', 'groups'],
    capabilities: { canView: true, canEdit: true, canDelete: true, canPublish: true, canManageUsers: false, canEditTheme: false, canManagePermissions: false, canRestoreVersions: false }
  },
  {
    id: 'orders_manager',
    nameAr: 'مدير الطلبات (Orders Manager)',
    nameEn: 'Orders Manager',
    color: 'sky',
    desc: 'إدارة الطلبات والفواتير وسير العمل Kanban والتقارير',
    pages: ['overview', 'orders', 'order_workflow', 'sourcing', 'returns', 'reports', 'bi_analytics'],
    capabilities: { canView: true, canEdit: true, canDelete: false, canPublish: false, canManageUsers: false, canEditTheme: false, canManagePermissions: false, canRestoreVersions: false }
  },
  {
    id: 'services_manager',
    nameAr: 'مدير الخدمات (Services Manager)',
    nameEn: 'Services Manager',
    color: 'cyan',
    desc: 'إدارة كرومبو الشغلانة ودليل الموبايلات وطلبات الاستيراد وبيع عندنا',
    pages: ['overview', 'karambo', 'sourcing', 'marketplace', 'storefront_cms'],
    capabilities: { canView: true, canEdit: true, canDelete: false, canPublish: true, canManageUsers: false, canEditTheme: false, canManagePermissions: false, canRestoreVersions: false }
  },
  {
    id: 'content_manager',
    nameAr: 'مدير المحتوى (Content Manager)',
    nameEn: 'Content Manager',
    color: 'teal',
    desc: 'تعديل الصفحات والنصوص والـ SEO والنشرة البريدية والسياسات',
    pages: ['overview', 'visual_editor', 'page_builder', 'storefront_cms', 'site_settings', 'karambo'],
    capabilities: { canView: true, canEdit: true, canDelete: false, canPublish: true, canManageUsers: false, canEditTheme: false, canManagePermissions: false, canRestoreVersions: false }
  },
  {
    id: 'support_manager',
    nameAr: 'مدير الدعم (Support Manager)',
    nameEn: 'Support Manager',
    color: 'rose',
    desc: 'إدارة حسابات العملاء والمرتجعات والشكاوى وقوائم الانتظار',
    pages: ['overview', 'clients', 'returns', 'orders', 'restock_alerts', 'sourcing'],
    capabilities: { canView: true, canEdit: true, canDelete: false, canPublish: false, canManageUsers: false, canEditTheme: false, canManagePermissions: false, canRestoreVersions: false }
  }
];

export const CAPABILITY_LABELS = [
  ['canView', 'عرض البيانات والتقارير'],
  ['canEdit', 'تعديل الإعدادات والمحتوى'],
  ['canDelete', 'حذف السجلات والعناصر'],
  ['canPublish', 'نشر التعديلات للموقع العام'],
  ['canManageUsers', 'إدارة العملاء والمستخدمين'],
  ['canEditTheme', 'تعديل التصميم العام والألوان'],
  ['canManagePermissions', 'إدارة الأدوار والصلاحيات'],
  ['canRestoreVersions', 'استعادة النسخ الاحتياطية']
];

// =============================================================================
// VERSION HISTORY & BACKUP HELPERS (Local + SiteSettings Synced)
// =============================================================================
const VERSION_STORAGE_KEY = 'elzoghbi_admin_version_history_v1';
const ADMIN_PREFS_PREFIX = 'elzoghbi_admin_ui_prefs_v1_';

export function readVersionHistory(siteSettings) {
  const fromSettings = Array.isArray(siteSettings?.adminVersionHistory) ? siteSettings.adminVersionHistory : [];
  let fromLocal = [];
  try {
    fromLocal = JSON.parse(window.localStorage.getItem(VERSION_STORAGE_KEY) || '[]');
  } catch (e) { fromLocal = []; }
  const map = new Map();
  [...fromSettings, ...fromLocal].forEach((item) => {
    if (item && item.id) map.set(item.id, item);
  });
  return Array.from(map.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 60);
}

export function createVersionSnapshot({ scope, label, actorName, actorRole, previousValue, newValue, isMajorBackup = false }) {
  const entry = {
    id: `ver_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    scope: scope || 'settings',
    label: label || 'تحديث إعدادات',
    actorName: actorName || 'المالك',
    actorRole: actorRole || 'super_admin',
    previousValue: previousValue ?? null,
    newValue: newValue ?? null,
    isMajorBackup: !!isMajorBackup,
    createdAt: new Date().toISOString()
  };
  try {
    const existing = JSON.parse(window.localStorage.getItem(VERSION_STORAGE_KEY) || '[]');
    const next = [entry, ...existing].slice(0, 60);
    window.localStorage.setItem(VERSION_STORAGE_KEY, JSON.stringify(next));
  } catch (e) { /* storage full */ }
  return entry;
}

export function computeJsonDiff(prevObj, nextObj) {
  const diffs = [];
  const a = prevObj && typeof prevObj === 'object' ? prevObj : {};
  const b = nextObj && typeof nextObj === 'object' ? nextObj : {};
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
  keys.forEach((k) => {
    const va = a[k];
    const vb = b[k];
    if (JSON.stringify(va) !== JSON.stringify(vb)) {
      diffs.push({
        key: k,
        before: typeof va === 'object' ? JSON.stringify(va)?.slice(0, 120) : String(va ?? '—'),
        after: typeof vb === 'object' ? JSON.stringify(vb)?.slice(0, 120) : String(vb ?? '—')
      });
    }
  });
  return diffs;
}

// =============================================================================
// PER-ADMIN UI PREFERENCES (Dashboard Customization, Isolated from Storefront)
// =============================================================================
export const DEFAULT_ADMIN_WIDGETS = [
  { id: 'kpi_summary', label: 'مؤشرات الأداء الرئيسية (KPIs)', visible: true },
  { id: 'quick_actions', label: 'أدوات الوصول السريع (Quick Actions)', visible: true },
  { id: 'recent_activity', label: 'آخر التعديلات والنشاط الإداري', visible: true },
  { id: 'visitor_stats', label: 'إحصائيات الزيارات ومصادر الترافيك', visible: true },
  { id: 'urgent_alerts', label: 'التنبيهات العاجلة والنواقص', visible: true },
  { id: 'recent_orders', label: 'أحدث الطلبات الواردة', visible: true }
];

export function loadAdminUiPrefs(adminKey = 'owner') {
  const safeKey = String(adminKey || 'owner').toLowerCase().replace(/[^a-z0-9_@.-]/g, '_');
  const defaults = {
    widgetOrder: DEFAULT_ADMIN_WIDGETS.map((w) => w.id),
    hiddenWidgets: [],
    favoritePages: ['overview', 'visual_editor', 'theme_editor', 'orders', 'marketplace'],
    recentlyEdited: [],
    tableDensity: 'comfortable', // 'compact' | 'comfortable'
    visibleOrderCols: ['id', 'client', 'total', 'status', 'date']
  };
  try {
    const saved = JSON.parse(window.localStorage.getItem(ADMIN_PREFS_PREFIX + safeKey) || 'null');
    if (saved && typeof saved === 'object') return { ...defaults, ...saved };
  } catch (e) { /* ignore */ }
  return defaults;
}

export function saveAdminUiPrefs(adminKey = 'owner', prefs) {
  const safeKey = String(adminKey || 'owner').toLowerCase().replace(/[^a-z0-9_@.-]/g, '_');
  try {
    window.localStorage.setItem(ADMIN_PREFS_PREFIX + safeKey, JSON.stringify(prefs));
  } catch (e) { /* ignore */ }
  return prefs;
}

// =============================================================================
// GLOBAL CONTROL DISCOVERY SEARCH INDEX (Natural Arabic + English Queries)
// =============================================================================
export const GLOBAL_CONTROL_SEARCH_INDEX = [
  { id: 'gs_visual', label: 'المحرر المرئي للموقع (تعديل العناصر والبانرات مباشرة)', tab: 'visual_editor', kw: 'محرر مرئي visual editor بانر زر تعديل مباشر معاينة' },
  { id: 'gs_theme_header', label: 'تغيير لون الهيدر والألوان الأساسية والوضع الليلي', tab: 'theme_editor', kw: 'تغيير لون الهيدر الوان ثيم theme dark mode light mode خطوط typography' },
  { id: 'gs_theme_fonts', label: 'التحكم في الخط العربي والخط الإنجليزي وأحجام النصوص', tab: 'theme_editor', kw: 'خطوط عربي انجليزي حجم الخط font typography' },
  { id: 'gs_sections', label: 'ترتيب وإخفاء وإضافة أقسام الصفحة الرئيسية (Section Builder)', tab: 'page_builder', kw: 'اقسام الرئيسية ترتيب سحب افلات section builder اخفاء اظهار' },
  { id: 'gs_pages', label: 'إنشاء وتعديل صفحات الموقع والـ SEO (Page Builder)', tab: 'page_builder', kw: 'انشاء صفحة جديدة page builder seo روابط قوائم' },
  { id: 'gs_discovered', label: 'إدارة النصوص والشارات وحالات الفراغ ورسائل الخطأ (Discovered Controls)', tab: 'page_builder', kw: 'شارات الضمان نصوص حالات فارغة رسائل خطا سياسات قانونية seo' },
  { id: 'gs_versions', label: 'سجل الإصدارات والنسخ الاحتياطي واستعادة التعديلات', tab: 'version_history', kw: 'سجل تعديلات نسخ احتياطي استعادة تراجع version history backup undo' },
  { id: 'gs_rbac', label: 'الأدوار والصلاحيات وفريق العمل (RBAC)', tab: 'team', kw: 'صلاحيات ادوار موظفين فريق super admin rbac permissions' },
  { id: 'gs_marketplace', label: 'مراجعة إعلانات بيع الموبايلات والبلاغات (بيع عندنا)', tab: 'marketplace', kw: 'مراجعة اعلانات بيع عندنا موبايلات مستعملة بلاغات marketplace' },
  { id: 'gs_header_studio', label: 'التحكم في الهيدر والشعار وروابط التنقل', tab: 'storefront_cms', subTab: 'header_studio', kw: 'هيدر شعار لوجو روابط قوائم بحث' },
  { id: 'gs_footer_studio', label: 'التحكم في الفوتر وروابط التواصل والدفع', tab: 'storefront_cms', subTab: 'footer_studio', kw: 'فوتر اسفل الموقع حقوق تواصل سوشيال' },
  { id: 'gs_ads', label: 'إدارة البنرات والإعلانات الترويجية', tab: 'storefront_cms', subTab: 'ads', kw: 'اعلانات بنرات صور عروض ترويجية' },
  { id: 'gs_karambo', label: 'إدارة خدمات كرومبو الشغلانة ودليل الموبايلات', tab: 'karambo', kw: 'كرومبو دليل موبايلات خدمات مقارنة اسعار' },
  { id: 'gs_payments', label: 'طرق الدفع وإعدادات المتجر والشروط', tab: 'site_settings', subTab: 'payments_auth', kw: 'دفع فودافون انستا باي شروط تسجيل' },
  { id: 'gs_mobile_push', label: 'إشعارات الموبايل الفورية للطلبات (Telegram / ntfy)', tab: 'site_settings', subTab: 'mobile_push', kw: 'اشعارات موبايل تليجرام اوردر تنبيهات' },
  { id: 'gs_orders', label: 'إدارة الطلبات والفواتير وسير العمل', tab: 'orders', kw: 'طلبات فواتير اوردرات شحن تسليم' },
  { id: 'gs_catalog', label: 'إدارة المنتجات والكتالوج والبراندات والموديلات', tab: 'catalog', kw: 'منتجات كتالوج براندات موديلات صور تصنيفات' },
  { id: 'gs_stock', label: 'الجرد السريع للمخزن وتعديل الأسعار', tab: 'quick_stock', kw: 'جرد مخزن كميات اسعار ستوك' },
  { id: 'gs_promos', label: 'الكوبونات وأكواد الخصم وحماية الربح', tab: 'promos', kw: 'كوبونات خصم اكواد حماية ربح' },
  { id: 'gs_loyalty', label: 'محرك المبيعات والولاء والكاش باك وعجلة الحظ', tab: 'feature_flags', kw: 'كاش باك ولاء عجلة حظ vip جودة' }
];
