/**
 * ELZOGHBI MARKET — AI Product Sourcing & Smart Import Core Engine
 *
 * Pure ES module implementing Phases 1–15:
 *  - Natural-language task parser (Arabic & English) + clarification & conflict detection
 *  - Dynamic structured execution plan generator
 *  - Compliant Feed/JSON/XML/CSV parser + isolated test dataset (never used as production data)
 *  - Natural-language filtering engine (Include/Exclude, AND/OR, model version checks)
 *  - 6-tier Smart Duplicate Detection & Catalog Intelligence
 *  - Zero-hallucination Arabic & English Product Enrichment + SEO + Provenance confidence
 *  - Advanced Image Intelligence (dedup, main selection, broken/low-res/watermark heuristics)
 *  - 10-mode Intelligent Pricing & Explicit Currency Conversion Engine
 *  - Smart Catalog Update Mode (side-by-side field diff & approval report)
 *  - Safe Idempotent Draft Import Builder
 *  - Reusable Task Presets (including user's 3 Arabic workflows) & Source Profiles
 */

export const DUPLICATE_STATUS = {
  NEW_PRODUCT: 'NEW_PRODUCT',
  EXACT_DUPLICATE: 'EXACT_DUPLICATE',
  POSSIBLE_DUPLICATE: 'POSSIBLE_DUPLICATE',
  EXISTING_NEEDS_UPDATE: 'EXISTING_NEEDS_UPDATE',
  VARIANT_OF_EXISTING: 'VARIANT_OF_EXISTING',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA'
};

export const DUPLICATE_LABELS_AR = {
  NEW_PRODUCT: 'منتج جديد',
  EXACT_DUPLICATE: 'مكرر مطابق تماماً',
  POSSIBLE_DUPLICATE: 'احتمال تكرار',
  EXISTING_NEEDS_UPDATE: 'موجود وقد يحتاج تحديثاً',
  VARIANT_OF_EXISTING: 'إصدار/متغير لمنتج موجود',
  INSUFFICIENT_DATA: 'بيانات غير كافية للمطابقة'
};

export const IMAGE_HANDLING_MODES = [
  { id: 'keep_external_urls', label: 'خيار A: الاحتفاظ بروابط الصور الخارجية (موصى به لتقليل التخزين)', short: 'روابط خارجية' },
  { id: 'import_to_storage', label: 'خيار B: حفظ الصور في نظام التخزين عند السماح', short: 'استيراد للتخزين' },
  { id: 'import_selected_only', label: 'خيار C: استيراد الصور المحددة فقط', short: 'المحددة فقط' },
  { id: 'skip_images', label: 'خيار D: تخطي استيراد الصور', short: 'تخطي الصور' }
];

export const PRICING_MODES = [
  { id: 'same_price', label: 'نفس سعر المصدر (بدون تعديل)' },
  { id: 'percent_increase', label: 'زيادة نسبة مئوية (+%)' },
  { id: 'percent_decrease', label: 'تخفيض نسبة مئوية (-%)' },
  { id: 'fixed_increase', label: 'إضافة مبلغ ثابت (+ ج.م)' },
  { id: 'fixed_decrease', label: 'خصم مبلغ ثابت (- ج.م)' },
  { id: 'custom_price', label: 'سعر مخصص لكل منتج' },
  { id: 'ai_suggested', label: 'سعر مقترح بالذكاء الاصطناعي (يتطلب موافقة)' },
  { id: 'category_specific', label: 'تسعير مخصص حسب التصنيف' },
  { id: 'brand_specific', label: 'تسعير مخصص حسب العلامة التجارية' },
  { id: 'conditional', label: 'تسعير مشروط حسب شريحة السعر' }
];

export const DEFAULT_SOURCE_PROFILES = [
  {
    id: 'prof_majentik',
    name: 'Majentik Store',
    website: 'https://majentik.com/',
    extractionMethod: 'shopify_json_api',
    defaultCurrency: 'EGP',
    defaultPricingRule: { mode: 'same_price', value: 0, roundingStep: 0 },
    defaultImageHandling: 'keep_external_urls',
    notes: 'مورد إكسسوارات موبايلات — لم يتم اختباره تلقائياً عبر الوكيل بعد.',
    verifiedCapability: false,
    lastTestedAt: null
  },
  {
    id: 'prof_trust_egypt',
    name: 'Trust Egypt (Joyroom)',
    website: 'https://trust-egypt.com/collections/joyroom-products',
    extractionMethod: 'shopify_json_api',
    defaultCurrency: 'EGP',
    defaultPricingRule: { mode: 'same_price', value: 0, roundingStep: 0 },
    defaultImageHandling: 'keep_external_urls',
    notes: 'مجموعة Joyroom — يتطلب اختبار الاتصال قبل الاعتماد.',
    verifiedCapability: false,
    lastTestedAt: null
  },
  {
    id: 'prof_three_egypt',
    name: 'Three Egypt Collections',
    website: 'https://three-egypt.com/collections',
    extractionMethod: 'shopify_json_api',
    defaultCurrency: 'EGP',
    defaultPricingRule: { mode: 'same_price', value: 0, roundingStep: 0 },
    defaultImageHandling: 'keep_external_urls',
    notes: 'مورد إكسسوارات — يتطلب اختبار الاتصال قبل الاعتماد.',
    verifiedCapability: false,
    lastTestedAt: null
  },
  {
    id: 'prof_vontx',
    name: 'Vontx Store',
    website: 'https://vontx.com/',
    extractionMethod: 'auto',
    defaultCurrency: 'EGP',
    defaultPricingRule: { mode: 'same_price', value: 0, roundingStep: 0 },
    defaultImageHandling: 'keep_external_urls',
    notes: 'مورد إكسسوارات — يتطلب اختبار الاتصال قبل الاعتماد.',
    verifiedCapability: false,
    lastTestedAt: null
  },
  {
    id: 'prof_bia3',
    name: 'Bia3 Store',
    website: 'https://www.bia3.net/',
    extractionMethod: 'auto',
    defaultCurrency: 'EGP',
    defaultPricingRule: { mode: 'same_price', value: 0, roundingStep: 0 },
    defaultImageHandling: 'keep_external_urls',
    notes: 'مورد عام — يتطلب اختبار الاتصال قبل الاعتماد.',
    verifiedCapability: false,
    lastTestedAt: null
  }
];

export const DEFAULT_SOURCING_PRESETS = [
  {
    id: 'preset_google_watches_buds_ar',
    title: 'استيراد ساعات وسماعات Google (+15% وتقريب 50 ج.م)',
    badge: 'استيراد ذكي',
    mode: 'import_new',
    instruction:
      'عايز أستورد منتجات Google Watches وGoogle Pixel Buds فقط من الرابط ده.\n' +
      '- تجاهل أي منتجات مش ساعات أو سماعات.\n' +
      '- تجاهل المنتجات الموجودة بالفعل في متجري.\n' +
      '- استخرج صور المنتجات والمواصفات.\n' +
      '- اكتب وصف احترافي باللغة العربية.\n' +
      '- استخدم التصنيف المناسب الموجود بالفعل.\n' +
      '- زوّد السعر بنسبة 15% بعد تحويل العملة إلى جنيه مصري باستخدام سعر صرف موثوق ومحدد.\n' +
      '- قرّب السعر لأقرب 50 جنيه.\n' +
      '- جهّز المنتجات كمسودات.\n' +
      '- اعرض عليّ كل المنتجات والأسعار والصور قبل الاستيراد.'
  },
  {
    id: 'preset_google_price_audit_ar',
    title: 'مراجعة ومقارنة أسعار Google (+10% مقترح)',
    badge: 'تحديث الكتالوج',
    mode: 'catalog_update',
    instruction:
      'راجع منتجات Google الموجودة بالفعل في متجري وقارن أسعارها بالمصدر ده.\n' +
      '- طابق المنتجات باستخدام الموديل وSKU إن وجد.\n' +
      '- اعرض فرق السعر.\n' +
      '- اقترح تحديث السعر بنسبة 10% فوق سعر المصدر.\n' +
      '- لا تغير أسعار المنتجات فعليًا.\n' +
      '- اعرض جدول بالتغييرات المقترحة وانتظر موافقتي.'
  },
  {
    id: 'preset_discover_new_electronics_ar',
    title: 'تحليل واكتشاف إلكترونيات جديدة (بدون استيراد)',
    badge: 'استكشاف فقط',
    mode: 'analyze_only',
    instruction:
      'حلل الموقع ده وابحث عن المنتجات الجديدة المناسبة لمتجري في مجال الإلكترونيات.\n' +
      '- ابحث عن المنتجات المتاحة.\n' +
      '- ركّز على المنتجات التي لم أضفها بعد.\n' +
      '- استبعد المنتجات منخفضة الجودة أو التي لا تتوفر لها بيانات كافية.\n' +
      '- اعرض أسماء المنتجات وموديلاتها وصورها وأسعارها.\n' +
      '- رشح أفضل المنتجات.\n' +
      '- لا تستورد أي شيء الآن.'
  },
  {
    id: 'preset_watches_only',
    title: 'Watches Only — ساعات ذكية فقط',
    badge: 'ساعات',
    mode: 'import_new',
    instruction: 'Find smartwatches only, exclude chargers, straps, cases, and accessories. Only in stock. Prepare as drafts.'
  },
  {
    id: 'preset_headphones_only',
    title: 'Headphones & Earbuds Only — سماعات فقط',
    badge: 'سماعات',
    mode: 'import_new',
    instruction: 'Find wireless earbuds and headphones only, exclude cases and cables. Write Arabic descriptions and prepare as drafts.'
  },
  {
    id: 'preset_new_products_only',
    title: 'New Products Only — المنتجات الجديدة فقط',
    badge: 'جديد فقط',
    mode: 'import_new',
    instruction: 'Compare discovered products with my existing catalog and exclude existing products. Prepare new products as drafts.'
  },
  {
    id: 'preset_catalog_refresh',
    title: 'Catalog Refresh — فحص تحديثات الكتالوج',
    badge: 'مراجعة تغييرات',
    mode: 'catalog_update',
    instruction: 'Compare this source with my existing catalog to detect price changes, availability changes, description changes, and image changes. Do not overwrite anything without approval.'
  }
];

/**
 * Isolated Sandbox Test Dataset — ONLY used when admin explicitly clicks
 * "تشغيل بيانات اختبار معزولة (Isolated Test Mode)" for testing the workflow without external network.
 * Clearly labeled as isolated test data and NEVER mixed into live production automatically.
 */
export const ISOLATED_TEST_PRODUCTS = [
  {
    name: 'Google Pixel Watch 3 (45mm, Wi-Fi, Matte Black Aluminum)',
    brand: 'Google',
    model: 'Pixel Watch 3',
    sku: 'GA05785-US',
    gtin: '0840353912854',
    ean: '0840353912854',
    upc: '840353912854',
    productUrl: 'https://example-authorized-supplier.test/products/google-pixel-watch-3-45mm',
    sourceUrl: 'https://example-authorized-supplier.test/collections/google',
    originalDescription: 'Actua display with 2,000 nits peak brightness, Wear OS 5, advanced Fitbit running metrics, 24-hour battery with always-on display, Bluetooth 5.3 and Wi-Fi.',
    images: [
      'https://lh3.googleusercontent.com/pixel-watch-3-main.webp',
      'https://lh3.googleusercontent.com/pixel-watch-3-side.webp',
      'https://lh3.googleusercontent.com/pixel-watch-3-strap.webp'
    ],
    price: 399,
    originalPrice: 399,
    salePrice: 0,
    currency: 'USD',
    availability: 'in_stock',
    stockStatus: 'متوفر',
    category: 'Smartwatches',
    specifications: {
      Display: '1.4" Actua AMOLED, 2000 nits',
      Battery: '420 mAh (up to 24 hours AOD)',
      Connectivity: 'Wi-Fi 6, Bluetooth 5.3, NFC, GPS',
      Sensors: 'Optical heart rate, ECG, SpO2, Skin temperature',
      Dimensions: '45mm diameter x 12.3mm',
      Weight: '37g (without band)',
      Material: '100% recycled aluminum',
      Color: 'Matte Black'
    },
    variants: [{ title: '45mm Matte Black', sku: 'GA05785-US', price: 399, available: true }],
    color: 'Matte Black',
    weight: '37g',
    warranty: '',
    rating: 4.8,
    reviewCount: 214,
    extractionMethod: 'isolated_test_fixture',
    sourceVerifiedFields: ['name', 'brand', 'model', 'sku', 'gtin', 'price', 'images', 'specifications', 'availability']
  },
  {
    name: 'Google Pixel Buds Pro 2 — Active Noise Cancellation Wireless Earbuds',
    brand: 'Google',
    model: 'Pixel Buds Pro 2',
    sku: 'GA05760-US',
    gtin: '0840353911925',
    ean: '0840353911925',
    upc: '840353911925',
    productUrl: 'https://example-authorized-supplier.test/products/google-pixel-buds-pro-2',
    sourceUrl: 'https://example-authorized-supplier.test/collections/google',
    originalDescription: 'Powered by Google Tensor A1 chip with Silent Seal 2.0 Active Noise Cancellation, 11mm dynamic speaker drivers, up to 30 hours total battery life with charging case, IP54 sweat and water resistant.',
    images: [
      'https://lh3.googleusercontent.com/pixel-buds-pro-2-porcelain.webp',
      'https://lh3.googleusercontent.com/pixel-buds-pro-2-case.webp',
      'https://lh3.googleusercontent.com/pixel-buds-pro-2-in-ear.webp'
    ],
    price: 229,
    originalPrice: 229,
    salePrice: 0,
    currency: 'USD',
    availability: 'in_stock',
    stockStatus: 'متوفر',
    category: 'Wireless Earbuds',
    specifications: {
      Chip: 'Google Tensor A1',
      Audio: '11mm custom dynamic drivers + Silent Seal 2.0 ANC',
      Battery: 'Up to 8h ANC on / 30h with case',
      Connectivity: 'Bluetooth 5.4, Multipoint',
      WaterResistance: 'IP54 earbuds, IPX4 case',
      Weight: '4.7g per earbud',
      Color: 'Porcelain'
    },
    variants: [{ title: 'Porcelain', sku: 'GA05760-US', price: 229, available: true }],
    color: 'Porcelain',
    weight: '4.7g',
    warranty: '',
    rating: 4.7,
    reviewCount: 168,
    extractionMethod: 'isolated_test_fixture',
    sourceVerifiedFields: ['name', 'brand', 'model', 'sku', 'gtin', 'price', 'images', 'specifications', 'availability']
  },
  {
    name: 'Google Pixel Watch 2 USB-C Magnetic Fast Charging Cable',
    brand: 'Google',
    model: 'Pixel Watch Charger',
    sku: 'GA05044-US',
    gtin: '0840244706616',
    ean: '',
    upc: '',
    productUrl: 'https://example-authorized-supplier.test/products/pixel-watch-usb-c-charger',
    sourceUrl: 'https://example-authorized-supplier.test/collections/google',
    originalDescription: 'Replacement USB-C magnetic fast charging cable accessory for Pixel Watch 2 and Pixel Watch 3.',
    images: ['https://lh3.googleusercontent.com/pixel-watch-charger.webp'],
    price: 29,
    originalPrice: 29,
    salePrice: 0,
    currency: 'USD',
    availability: 'in_stock',
    stockStatus: 'متوفر',
    category: 'Accessories / Chargers',
    specifications: { Connectivity: 'USB-C', Color: 'White' },
    variants: [],
    color: 'White',
    weight: '28g',
    warranty: '',
    rating: 4.4,
    reviewCount: 52,
    extractionMethod: 'isolated_test_fixture',
    sourceVerifiedFields: ['name', 'brand', 'sku', 'price', 'images']
  },
  {
    name: 'Google Pixel Watch 2 (41mm, Refurbished, Polished Silver)',
    brand: 'Google',
    model: 'Pixel Watch 2',
    sku: 'GA05029-RFB',
    gtin: '',
    ean: '',
    upc: '',
    productUrl: 'https://example-authorized-supplier.test/products/pixel-watch-2-refurbished',
    sourceUrl: 'https://example-authorized-supplier.test/collections/google',
    originalDescription: 'Certified refurbished Pixel Watch 2 41mm Wi-Fi smartwatch with heart rate sensor.',
    images: ['https://lh3.googleusercontent.com/pixel-watch-2-silver.webp'],
    price: 179,
    originalPrice: 249,
    salePrice: 179,
    currency: 'USD',
    availability: 'out_of_stock',
    stockStatus: 'غير متوفر',
    category: 'Smartwatches',
    specifications: { Display: '1.2" AMOLED', Color: 'Polished Silver' },
    variants: [],
    color: 'Polished Silver',
    weight: '31g',
    warranty: '',
    rating: 4.1,
    reviewCount: 19,
    extractionMethod: 'isolated_test_fixture',
    sourceVerifiedFields: ['name', 'brand', 'model', 'sku', 'price', 'images', 'availability']
  },
  {
    name: 'Sony WF-1000XM5 Wireless Noise Cancelling Earbuds',
    brand: 'Sony',
    model: 'WF-1000XM5',
    sku: 'SONY-WF1000XM5-B',
    gtin: '0027242925601',
    ean: '',
    upc: '027242925601',
    productUrl: 'https://example-authorized-supplier.test/products/sony-wf-1000xm5',
    sourceUrl: 'https://example-authorized-supplier.test/collections/audio',
    originalDescription: 'Industry-leading noise cancellation with Integrated Processor V2, 8.4mm Dynamic Driver X, LDAC Hi-Res Audio, 8 hours battery (24h with case), IPX4.',
    images: [
      'https://example-authorized-supplier.test/img/sony-xm5-1.jpg',
      'https://example-authorized-supplier.test/img/sony-xm5-2.jpg',
      'https://example-authorized-supplier.test/img/sony-xm5-3.jpg'
    ],
    price: 299,
    originalPrice: 299,
    salePrice: 0,
    currency: 'USD',
    availability: 'in_stock',
    stockStatus: 'متوفر',
    category: 'Wireless Earbuds',
    specifications: {
      Audio: '8.4mm Dynamic Driver X, LDAC',
      Battery: '8h earbuds / 24h with case',
      Connectivity: 'Bluetooth 5.3, Multipoint',
      WaterResistance: 'IPX4',
      Color: 'Black'
    },
    variants: [],
    color: 'Black',
    weight: '5.9g',
    warranty: '',
    rating: 4.7,
    reviewCount: 310,
    extractionMethod: 'isolated_test_fixture',
    sourceVerifiedFields: ['name', 'brand', 'model', 'sku', 'gtin', 'price', 'images', 'specifications', 'availability']
  }
];

// ============================================================================
// PHASE 1 & 2 — NATURAL-LANGUAGE TASK PARSER & EXECUTION PLAN GENERATOR
// ============================================================================

const KNOWN_BRANDS = [
  'Google', 'Apple', 'Samsung', 'Sony', 'Anker', 'Joyroom', 'Baseus', 'Ugreen',
  'Oraimo', 'Xiaomi', 'Huawei', 'JBL', 'Beats', 'Bose', 'Realme', 'Oppo', 'OnePlus', 'Honor', 'Belkin'
];

const PRODUCT_TYPE_MAP = [
  { key: 'watch', labelAr: 'ساعات ذكية', patterns: [/watch/i, /smartwatch/i, /ساع(?:ة|ات)/i, /pixel\s*watch/i] },
  { key: 'earbuds', labelAr: 'سماعات أذن ولاسلكية', patterns: [/buds/i, /earbuds/i, /airpods/i, /headphone/i, /سماع(?:ة|ات)/i, /هيدفون/i, /pixel\s*buds/i] },
  { key: 'tablet', labelAr: 'تابلت', patterns: [/tablet/i, /ipad/i, /تابلت/i] },
  { key: 'charger', labelAr: 'شواحن', patterns: [/charger/i, /adapter/i, /شاحن|شواحن/i] },
  { key: 'cable', labelAr: 'كابلات', patterns: [/cable/i, /كابل|كابلات/i] },
  { key: 'powerbank', labelAr: 'باور بانك', patterns: [/power\s*bank/i, /باور\s*بانك/i] },
  { key: 'speaker', labelAr: 'سبيكر', patterns: [/speaker/i, /سبيكر|مكبر/i] }
];

export function parseSourcingInstruction(rawText = '', explicitUrls = []) {
  const text = String(rawText || '').trim();
  const low = text.toLowerCase();

  // Extract inline URLs from instruction + explicit URLs
  const inlineUrls = (text.match(/https?:\/\/[^\s"'<>]+/gi) || []).map(u => u.replace(/[.,;)]+$/, ''));
  const sourceUrls = Array.from(new Set([...(explicitUrls || []), ...inlineUrls].map(s => String(s || '').trim()).filter(Boolean)));

  // Detect workflow mode
  let mode = 'import_new';
  if (
    /لا تستورد|do not import|don't import|analyze only|حلل الموقع|رشح أفضل|بدون استيراد/i.test(text) &&
    !/جهّز.*مسود|prepare.*draft/i.test(text)
  ) {
    mode = 'analyze_only';
  } else if (
    /راجع منتجات|قارن أسعار|compare.*existing|price changes|فرق السعر|اقترح تحديث السعر|discontinued|no longer available|catalog refresh/i.test(text)
  ) {
    mode = 'catalog_update';
  }

  // Detect brands
  const brands = KNOWN_BRANDS.filter(b => new RegExp(`\\b${b}\\b`, 'i').test(text));
  if (/جوجل|غوغل/i.test(text) && !brands.includes('Google')) brands.push('Google');
  if (/سامسونج/i.test(text) && !brands.includes('Samsung')) brands.push('Samsung');
  if (/أبل|ايفون|آيفون/i.test(text) && !brands.includes('Apple')) brands.push('Apple');
  if (/سوني/i.test(text) && !brands.includes('Sony')) brands.push('Sony');

  // Detect included product types
  const productTypes = [];
  for (const pt of PRODUCT_TYPE_MAP) {
    // Skip if only mentioned in an exclude clause
    const inText = pt.patterns.some(re => re.test(text));
    if (!inText) continue;
    const onlyExcluded = new RegExp(`(?:exclude|تجاهل|استبعد|بدون)[^.\\n]*?(?:${pt.patterns.map(r => r.source).join('|')})`, 'i').test(text) &&
      !new RegExp(`(?:import|find|only|أستورد|ابحث عن|منتجات|فقط)[^.\\n]*?(?:${pt.patterns.map(r => r.source).join('|')})`, 'i').test(text);
    if (!onlyExcluded) productTypes.push(pt.key);
  }

  // Include keywords (only add model keywords when they do not conflict with broader productTypes)
  const includeKeywords = [];
  if (/pixel\s*watch/i.test(text) || (/google\s*watch/i.test(text) && /pixel\s*buds/i.test(text))) includeKeywords.push('Pixel Watch');
  if (/pixel\s*buds/i.test(text)) includeKeywords.push('Pixel Buds');
  const minModelMatch = text.match(/(pixel\s*watch|galaxy\s*watch|iphone)\s*(\d+)\s*(?:and newer|or newer|فأحدث|وأحدث)/i);
  const minModelVersion = minModelMatch ? { series: minModelMatch[1].trim(), minVersion: Number(minModelMatch[2]) } : null;

  // Excluded keywords
  const excludeKeywords = [];
  if (/exclude\s+accessories|تجاهل.*إكسسوار|استبعد.*إكسسوار|تجاهل أي منتجات مش ساعات أو سماعات/i.test(text)) {
    excludeKeywords.push('charger', 'cable', 'strap', 'band', 'case', 'cover', 'adapter', 'screen protector', 'dock', 'شاحن', 'كابل', 'جراب', 'سير');
  }
  if (/refurbished|مجدد|مستعمل/i.test(text)) {
    excludeKeywords.push('refurbished', 'renewed', 'used', 'pre-owned', 'مجدد', 'مستعمل');
  }
  if (/exclude[^.\n]*charger/i.test(text)) excludeKeywords.push('charger', 'شاحن');
  if (/exclude[^.\n]*case/i.test(text)) excludeKeywords.push('case', 'cover', 'جراب');

  // Price restrictions
  let minPrice = null;
  let maxPrice = null;
  let priceCurrency = /\$|usd|دولار/i.test(text) ? 'USD' : /egp|جنيه|ج\.م/i.test(text) ? 'EGP' : null;
  const betweenMatch = text.match(/(?:between|بين)\s*\$?(\d+(?:\.\d+)?)\s*(?:and|to|و|-)\s*\$?(\d+(?:\.\d+)?)/i);
  if (betweenMatch) {
    minPrice = Number(betweenMatch[1]);
    maxPrice = Number(betweenMatch[2]);
  } else {
    const underMatch = text.match(/(?:under|below|less than|أقل من|تحت)\s*\$?(\d+(?:\.\d+)?)/i);
    if (underMatch) maxPrice = Number(underMatch[1]);
    const overMatch = text.match(/(?:over|above|more than|أعلى من|فوق)\s*\$?(\d+(?:\.\d+)?)/i);
    if (overMatch) minPrice = Number(overMatch[1]);
  }

  // Availability / quality / duplicate rules
  const inStockOnly = /in stock|available|المتاحة|متوفر/i.test(text);
  const excludeDuplicates =
    /not already in my|exclude.*already|تجاهل المنتجات الموجودة|لم أضفها بعد|only include new|new products only|المنتجات الجديدة/i.test(text);
  const minImagesMatch = text.match(/(?:at least|على الأقل)\s*(\d+)\s*(?:product\s*)?(?:images|صور)/i);
  const minImages = minImagesMatch ? Number(minImagesMatch[1]) : (/with images|استخرج صور/i.test(text) ? 1 : 0);
  const requireSpecs = /technical specifications|with.*specifications|المواصفات|بيانات كافية/i.test(text);
  const requireVerifiedPrice = /verified source price|سعر موثق/i.test(text);
  const excludeLowQuality = /منخفضة الجودة|low quality|بيانات كافية/i.test(text);

  // Content language
  let contentLanguage = 'ar';
  if (/arabic and english|عربي وإنجليزي|both languages/i.test(text)) contentLanguage = 'both';
  else if (/english description|in english/i.test(text) && !/arabic|عربي|باللغة العربية/i.test(text)) contentLanguage = 'en';

  // Pricing rule parsing
  let pricingMode = 'same_price';
  let pricingValue = 0;
  const pctInc =
    text.match(/(?:increase|markup|زوّد السعر|زود السعر|رفع السعر|فوق سعر المصدر|تحديث السعر)[^.\n%]*?(\d+(?:\.\d+)?)\s*%/i) ||
    text.match(/\+\s*(\d+(?:\.\d+)?)\s*%/);
  const pctDec = text.match(/(?:reduce|decrease|discount|خصم|خفض السعر)[^.\n%]*?(\d+(?:\.\d+)?)\s*%/i);
  const fixInc = text.match(/(?:add|fixed|markup|إضافة|أضف|زيادة ثابتة)[^.\n]*?(\d+(?:\.\d+)?)\s*(?:egp|جنيه|ج\.م)/i);
  const fixDec = text.match(/(?:subtract|deduct|خصم ثابت)[^.\n]*?(\d+(?:\.\d+)?)\s*(?:egp|جنيه|ج\.م)/i);

  if (pctInc) {
    pricingMode = 'percent_increase';
    pricingValue = Number(pctInc[1]);
  } else if (pctDec) {
    pricingMode = 'percent_decrease';
    pricingValue = Number(pctDec[1]);
  } else if (fixInc) {
    pricingMode = 'fixed_increase';
    pricingValue = Number(fixInc[1]);
  } else if (fixDec) {
    pricingMode = 'fixed_decrease';
    pricingValue = Number(fixDec[1]);
  } else if (/ai.*suggest.*price|سعر مقترح/i.test(text)) {
    pricingMode = 'ai_suggested';
  }

  const convertToEgp = /convert.*egp|تحويل العملة إلى جنيه|جنيه مصري|to egp/i.test(text);
  const roundMatch = text.match(/(?:round.*nearest|قرّب.*لأقرب|قرب.*لأقرب|تقريب)\s*(\d+)/i);
  const roundingStep = roundMatch ? Number(roundMatch[1]) : 0;

  // Import status (ALWAYS defaults to draft for safety)
  const importStatus = 'draft';
  const requiresApproval = true;

  // Detect conflicts & missing essential information
  const conflicts = [];
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    conflicts.push(`تعارض في فلتر السعر: الحد الأدنى (${minPrice}) أكبر من الحد الأقصى (${maxPrice}).`);
  }
  const overlappingKw = includeKeywords.filter(k =>
    excludeKeywords.some(ex => k.toLowerCase().includes(ex.toLowerCase()) && ex.length > 2)
  );
  if (overlappingKw.length > 0) {
    conflicts.push(`تعارض في الكلمات المفتاحية: (${overlappingKw.join(', ')}) موجودة في التضمين والاستبعاد معاً.`);
  }

  const missingQuestions = [];
  if (sourceUrls.length === 0) {
    missingQuestions.push('أدخل رابط مصدر واحد على الأقل (أو الصق بيانات CSV / XML / JSON أو جرّب وضع الاختبار المعزول).');
  }

  return {
    rawInstruction: text,
    mode,
    sourceUrls,
    filters: {
      combinator: 'AND',
      brands,
      productTypes,
      includeKeywords,
      excludeKeywords: Array.from(new Set(excludeKeywords)),
      minModelVersion,
      minPrice,
      maxPrice,
      priceCurrency,
      inStockOnly,
      excludeDuplicates,
      minImages,
      requireSpecs,
      requireVerifiedPrice,
      excludeLowQuality,
      category: ''
    },
    enrichment: {
      language: contentLanguage,
      generateArabicTitle: contentLanguage === 'ar' || contentLanguage === 'both',
      generateArabicDescription: contentLanguage === 'ar' || contentLanguage === 'both',
      generateSeo: true,
      matchExistingCategories: true,
      allowNewCategories: false
    },
    pricing: {
      mode: pricingMode,
      value: pricingValue,
      targetCurrency: convertToEgp ? 'EGP' : 'EGP',
      convertCurrency: convertToEgp,
      exchangeRate: null, // Must be fetched live or set explicitly by admin — NEVER fabricated
      exchangeRateSource: '',
      exchangeRateDate: '',
      roundingStep,
      minFinalPrice: null,
      maxFinalPrice: null,
      categoryOverrides: {},
      brandOverrides: {}
    },
    imageHandling: 'keep_external_urls',
    importStatus,
    requiresApproval,
    conflicts,
    missingQuestions
  };
}

export function buildExecutionPlan(workflow) {
  if (!workflow) return [];
  if (workflow.mode === 'catalog_update') {
    return [
      { id: 'validate', label: 'التحقق الأمني من روابط المصدر (SSRF & robots.txt)' },
      { id: 'discover', label: 'تحليل المصدر واستخراج بيانات المنتجات والأسعار المتاحة' },
      { id: 'filter', label: 'تصفية المنتجات حسب العلامة التجارية والشروط المحددة' },
      { id: 'compare', label: 'مطابقة المنتجات مع كتالوج Elzoghbi Market عبر SKU والموديل والاسم' },
      { id: 'diff', label: 'رصد فروق الأسعار، التوفر، الصور، والمواصفات' },
      { id: 'pricing', label: 'حساب الأسعار المقترحة بشفافية (بدون تعديل الأسعار الفعلية)' },
      { id: 'review', label: 'عرض جدول التغييرات المقترحة وانتظار موافقة المدير لكل منتج/حقل' }
    ];
  }
  if (workflow.mode === 'analyze_only') {
    return [
      { id: 'validate', label: 'التحقق الأمني من المصدر وصلاحية الوصول' },
      { id: 'discover', label: 'تحليل الموقع واكتشاف المنتجات المتاحة' },
      { id: 'filter', label: 'استبعاد المنتجات منخفضة الجودة أو ناقصة البيانات' },
      { id: 'compare', label: 'مقارنة المنتجات مع الكتالوج الحالي للتركيز على المنتجات الجديدة' },
      { id: 'images', label: 'فحص جودة الصور والروابط المستخرجة' },
      { id: 'review', label: 'عرض توصيات أفضل المنتجات وأسعارها بدون تنفيذ أي استيراد' }
    ];
  }
  return [
    { id: 'validate', label: 'التحقق الأمني من روابط المصدر (URL / SSRF / robots.txt)' },
    { id: 'discover', label: 'تحليل المصدر واكتشاف صفحات وبيانات المنتجات' },
    { id: 'filter', label: 'تطبيق قواعد الفلترة الذكية (التضمين والاستبعاد والأسعار والتوفر)' },
    { id: 'compare', label: 'مقارنة المنتجات مع كتالوج المتجر وكشف التكرارات (6 مستويات)' },
    { id: 'images', label: 'تحليل وتنقية الصور وتحديد الصورة الرئيسية وكشف الروابط المعطوبة' },
    { id: 'enrich', label: 'إثراء العناوين والأوصاف العربية والمواصفات وSEO ومطابقة التصنيفات' },
    { id: 'pricing', label: 'تطبيق قواعد التسعير وتحويل العملة والتقريب مع عرض المعادلة' },
    { id: 'review', label: 'تجهيز المسودات وعرض شاشة المراجعة الشاملة وانتظار موافقة المدير' }
  ];
}

// ============================================================================
// PHASE 3 — CLIENT-SIDE COMPLIANT FEED / CSV / JSON / XML PARSER
// ============================================================================

export function parseStructuredSourceInput(rawText, sourceLabel = 'manual_feed') {
  const txt = String(rawText || '').trim();
  if (!txt) return { ok: false, products: [], error: 'النص فارغ.' };

  // JSON array or { products: [...] }
  if (txt.startsWith('{') || txt.startsWith('[')) {
    try {
      const parsed = JSON.parse(txt);
      const list = Array.isArray(parsed) ? parsed : parsed.products || parsed.items || [];
      if (!Array.isArray(list) || list.length === 0) {
        return { ok: false, products: [], error: 'ملف JSON لا يحتوي على مصفوفة منتجات صالحة.' };
      }
      const products = list.map((it, idx) => ({
        name: String(it.name || it.title || `منتج #${idx + 1}`).trim(),
        brand: String(it.brand || it.vendor || '').trim(),
        model: String(it.model || it.mpn || '').trim(),
        sku: String(it.sku || it.id || '').trim(),
        gtin: String(it.gtin || it.barcode || '').trim(),
        ean: String(it.ean || '').trim(),
        upc: String(it.upc || '').trim(),
        productUrl: String(it.productUrl || it.url || '').trim(),
        sourceUrl: sourceLabel,
        originalDescription: String(it.originalDescription || it.description || '').trim(),
        images: Array.isArray(it.images) ? it.images.filter(Boolean) : it.image ? [it.image] : [],
        price: Number(it.price || 0) || 0,
        originalPrice: Number(it.originalPrice || it.price || 0) || 0,
        salePrice: Number(it.salePrice || 0) || 0,
        currency: String(it.currency || 'USD').toUpperCase(),
        availability: it.availability === 'out_of_stock' || it.inStock === false ? 'out_of_stock' : 'in_stock',
        stockStatus: it.availability === 'out_of_stock' || it.inStock === false ? 'غير متوفر' : 'متوفر',
        category: String(it.category || '').trim(),
        specifications: typeof it.specifications === 'object' && it.specifications ? it.specifications : {},
        variants: Array.isArray(it.variants) ? it.variants : [],
        color: String(it.color || '').trim(),
        weight: String(it.weight || '').trim(),
        warranty: String(it.warranty || '').trim(),
        rating: Number(it.rating || 0) || null,
        reviewCount: Number(it.reviewCount || 0) || null,
        extractionMethod: 'imported_json_feed',
        sourceVerifiedFields: ['name', ...(it.price ? ['price'] : []), ...(it.sku ? ['sku'] : []), ...(it.images?.length || it.image ? ['images'] : [])]
      }));
      return { ok: true, products, method: 'imported_json_feed' };
    } catch (e) {
      return { ok: false, products: [], error: `خطأ في صيغة JSON: ${e.message}` };
    }
  }

  // CSV / TSV
  const lines = txt.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) {
    return { ok: false, products: [], error: 'يرجى إدخال سطر العناوين وسطراً واحداً على الأقل للمنتجات (CSV) أو JSON صالح.' };
  }
  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const splitRow = (line) => {
    const out = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQ = !inQ;
      } else if (ch === delimiter && !inQ) {
        out.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };

  const headers = splitRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9_]/g, ''));
  const products = lines.slice(1).map((line) => {
    const cols = splitRow(line);
    const get = (...keys) => {
      for (const k of keys) {
        const idx = headers.indexOf(k);
        if (idx >= 0 && cols[idx]) return cols[idx];
      }
      return '';
    };
    const imgRaw = get('images', 'image', 'imageurl', 'image_url');
    const images = imgRaw ? imgRaw.split(/[|;]/).map(s => s.trim()).filter(Boolean) : [];
    const price = Number(String(get('price', 'baseprice', 'sourceprice')).replace(/[^0-9.]/g, '')) || 0;
    const availRaw = get('availability', 'stockstatus', 'stock').toLowerCase();
    const inStock = !availRaw || (!availRaw.includes('out') && availRaw !== '0' && availRaw !== 'false');
    return {
      name: get('name', 'title', 'productname'),
      brand: get('brand', 'vendor'),
      model: get('model', 'mpn'),
      sku: get('sku', 'id'),
      gtin: get('gtin', 'barcode', 'ean', 'upc'),
      ean: get('ean'),
      upc: get('upc'),
      productUrl: get('url', 'producturl', 'link'),
      sourceUrl: sourceLabel,
      originalDescription: get('description', 'desc'),
      images,
      price,
      originalPrice: price,
      salePrice: 0,
      currency: (get('currency') || 'USD').toUpperCase(),
      availability: inStock ? 'in_stock' : 'out_of_stock',
      stockStatus: inStock ? 'متوفر' : 'غير متوفر',
      category: get('category', 'type'),
      specifications: {},
      variants: [],
      color: get('color'),
      weight: get('weight'),
      warranty: '',
      rating: null,
      reviewCount: null,
      extractionMethod: 'imported_csv_feed',
      sourceVerifiedFields: ['name', ...(price ? ['price'] : []), ...(images.length ? ['images'] : [])]
    };
  }).filter(p => p.name);

  return { ok: products.length > 0, products, method: 'imported_csv_feed', error: products.length ? null : 'لم يتم العثور على منتجات صالحة في ملف CSV.' };
}

// ============================================================================
// PHASE 4 — AI NATURAL-LANGUAGE FILTERING ENGINE
// ============================================================================

export function detectFilterConflicts(filters) {
  const conflicts = [];
  if (!filters) return conflicts;
  if (filters.minPrice !== null && filters.minPrice !== '' && filters.maxPrice !== null && filters.maxPrice !== '') {
    if (Number(filters.minPrice) > Number(filters.maxPrice)) {
      conflicts.push(`الحد الأدنى للسعر (${filters.minPrice}) أكبر من الحد الأقصى (${filters.maxPrice}).`);
    }
  }
  const inc = (filters.includeKeywords || []).map(k => String(k).toLowerCase().trim()).filter(Boolean);
  const exc = (filters.excludeKeywords || []).map(k => String(k).toLowerCase().trim()).filter(Boolean);
  const overlap = inc.filter(k => exc.includes(k));
  if (overlap.length) {
    conflicts.push(`الكلمات التالية موجودة في التضمين والاستبعاد معاً: ${overlap.join('، ')}`);
  }
  return conflicts;
}

export function applyProductFilters(products, filters = {}) {
  const passed = [];
  const excluded = [];
  const combinator = filters.combinator === 'OR' ? 'OR' : 'AND';

  const brands = (filters.brands || []).map(b => String(b).toLowerCase().trim()).filter(Boolean);
  const types = (filters.productTypes || []).filter(Boolean);
  const incKw = (filters.includeKeywords || []).map(k => String(k).toLowerCase().trim()).filter(Boolean);
  const excKw = (filters.excludeKeywords || []).map(k => String(k).toLowerCase().trim()).filter(Boolean);

  for (const p of products) {
    const haystack = `${p.name || ''} ${p.brand || ''} ${p.model || ''} ${p.category || ''} ${p.originalDescription || ''}`.toLowerCase();
    const reasons = [];

    // Always-enforced negative exclusions (check title/category for accessory terms to avoid false positives like "charging case" in earbud descriptions; check full text for condition terms)
    const titleCatLow = `${p.name || ''} ${p.category || ''} ${p.model || ''}`.toLowerCase();
    const conditionTerms = new Set(['refurbished', 'renewed', 'used', 'pre-owned', 'مجدد', 'مستعمل']);
    for (const bad of excKw) {
      const target = conditionTerms.has(bad) ? haystack : titleCatLow;
      if (target.includes(bad)) {
        reasons.push(`مطابق لكلمة مستبعدة ("${bad}")`);
        break;
      }
    }

    // Availability
    if (filters.inStockOnly && p.availability === 'out_of_stock') {
      reasons.push('غير متوفر في المخزون حالياً');
    }

    // Verified price
    if (filters.requireVerifiedPrice && (!p.price || Number(p.price) <= 0)) {
      reasons.push('لا يوجد سعر مصدر موثق');
    }

    // Price range
    if (filters.minPrice !== null && filters.minPrice !== '' && Number(p.price) < Number(filters.minPrice)) {
      reasons.push(`السعر (${p.price}) أقل من الحد الأدنى (${filters.minPrice})`);
    }
    if (filters.maxPrice !== null && filters.maxPrice !== '' && Number(p.price) > Number(filters.maxPrice)) {
      reasons.push(`السعر (${p.price}) أعلى من الحد الأقصى (${filters.maxPrice})`);
    }

    // Min images
    if (filters.minImages > 0 && (!Array.isArray(p.images) || p.images.length < Number(filters.minImages))) {
      reasons.push(`عدد الصور (${(p.images || []).length}) أقل من المطلوب (${filters.minImages})`);
    }

    // Specs / quality
    const specCount = p.specifications ? Object.keys(p.specifications).length : 0;
    if (filters.requireSpecs && specCount === 0 && (!p.originalDescription || p.originalDescription.length < 25)) {
      reasons.push('تفتقر إلى مواصفات تقنية كافية');
    }
    if (filters.excludeLowQuality && (!p.images?.length || (!p.price && !specCount))) {
      reasons.push('بيانات المنتج غير مكتملة أو منخفضة الجودة');
    }

    // Model minimum version (e.g. Pixel Watch 3 and newer)
    if (filters.minModelVersion?.series && filters.minModelVersion?.minVersion) {
      const ser = filters.minModelVersion.series.toLowerCase();
      if (haystack.includes(ser)) {
        const verMatch = haystack.match(new RegExp(`${ser.replace(/\s+/g, '\\s*')}\\s*(\\d+)`));
        if (verMatch && Number(verMatch[1]) < filters.minModelVersion.minVersion) {
          reasons.push(`إصدار أقدم من المطلوب (${filters.minModelVersion.series} ${filters.minModelVersion.minVersion}+)`);
        }
      }
    }

    // Positive inclusion checks (AND vs OR)
    const positiveChecks = [];
    if (brands.length > 0) {
      const ok = brands.some(b => haystack.includes(b));
      positiveChecks.push({ ok, failMsg: `العلامة التجارية ليست ضمن (${filters.brands.join('، ')})` });
    }
    if (types.length > 0) {
      const ok = types.some(tKey => {
        const def = PRODUCT_TYPE_MAP.find(m => m.key === tKey);
        return def ? def.patterns.some(re => re.test(haystack)) : haystack.includes(tKey);
      });
      positiveChecks.push({ ok, failMsg: `نوع المنتج ليس ضمن الأنواع المطلوبة` });
    }
    if (incKw.length > 0) {
      const ok = incKw.some(k => haystack.includes(k));
      positiveChecks.push({ ok, failMsg: `لا يحتوي على الكلمات المطلوبة (${filters.includeKeywords.join('، ')})` });
    }

    if (positiveChecks.length > 0) {
      if (combinator === 'AND') {
        positiveChecks.filter(c => !c.ok).forEach(c => reasons.push(c.failMsg));
      } else {
        const anyOk = positiveChecks.some(c => c.ok);
        if (!anyOk) reasons.push(positiveChecks.map(c => c.failMsg).join(' أو '));
      }
    }

    if (reasons.length > 0) {
      excluded.push({ ...p, exclusionReasons: reasons });
    } else {
      passed.push(p);
    }
  }

  return { passed, excluded };
}

// ============================================================================
// PHASE 5 — SMART DUPLICATE DETECTION & CATALOG INTELLIGENCE
// ============================================================================

function tokenizeName(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

export function nameSimilarity(a, b) {
  const ta = new Set(tokenizeName(a));
  const tb = new Set(tokenizeName(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let common = 0;
  ta.forEach(t => { if (tb.has(t)) common++; });
  return (2 * common) / (ta.size + tb.size);
}

export function classifyDuplicate(candidate, existingParts = []) {
  if (!candidate || (!candidate.name && !candidate.sku && !candidate.gtin)) {
    return {
      status: DUPLICATE_STATUS.INSUFFICIENT_DATA,
      labelAr: DUPLICATE_LABELS_AR.INSUFFICIENT_DATA,
      reason: 'لا توجد بيانات كافية (اسم أو SKU أو GTIN) لإجراء المطابقة.',
      matchedPart: null,
      score: 0,
      recommendedAction: 'manual_review'
    };
  }

  const cSku = String(candidate.sku || '').trim().toLowerCase();
  const cGtin = String(candidate.gtin || candidate.ean || candidate.upc || '').trim().toLowerCase();
  const cUrl = String(candidate.productUrl || '').trim().toLowerCase();
  const cModel = String(candidate.model || '').trim().toLowerCase();
  const cBrand = String(candidate.brand || '').trim().toLowerCase();

  let bestMatch = null;
  let bestScore = 0;
  let bestReason = '';
  let bestStatus = DUPLICATE_STATUS.NEW_PRODUCT;

  for (const part of existingParts) {
    const pSku = String(part.sku || part.sourceSku || '').trim().toLowerCase();
    const pGtin = String(part.gtin || '').trim().toLowerCase();
    const pUrl = String(part.sourceUrl || '').trim().toLowerCase();
    const pName = String(part.name || '');

    // 1. Exact SKU or GTIN or Source URL match
    if ((cSku && pSku && cSku === pSku) || (cGtin && pGtin && cGtin === pGtin) || (cUrl && pUrl && cUrl === pUrl)) {
      const priceDiff = candidate.price && part.basePrice && Math.abs(Number(candidate.price) - Number(part.basePrice)) > 1;
      const status = priceDiff ? DUPLICATE_STATUS.EXISTING_NEEDS_UPDATE : DUPLICATE_STATUS.EXACT_DUPLICATE;
      return {
        status,
        labelAr: DUPLICATE_LABELS_AR[status],
        reason: cSku && pSku && cSku === pSku
          ? `تطابق كامل في رمز المنتج SKU (${candidate.sku})`
          : cGtin && pGtin && cGtin === pGtin
            ? `تطابق كامل في رمز GTIN/EAN (${candidate.gtin})`
            : 'تطابق كامل في رابط المصدر للمنتج',
        matchedPart: part,
        score: 1,
        recommendedAction: status === DUPLICATE_STATUS.EXISTING_NEEDS_UPDATE ? 'update_existing' : 'skip'
      };
    }

    // 2. Brand + Model + Name similarity
    const sim = nameSimilarity(candidate.name, pName);
    const modelHit = cModel.length >= 3 && pName.toLowerCase().includes(cModel) && (!cBrand || pName.toLowerCase().includes(cBrand));

    if (sim >= 0.85) {
      if (sim > bestScore) {
        bestScore = sim;
        bestMatch = part;
        bestStatus = DUPLICATE_STATUS.EXACT_DUPLICATE;
        bestReason = `تشابه اسم عالٍ جداً (${Math.round(sim * 100)}%) مع "${part.name}"`;
      }
    } else if (modelHit && candidate.color && !pName.toLowerCase().includes(candidate.color.toLowerCase())) {
      if (0.78 > bestScore) {
        bestScore = 0.78;
        bestMatch = part;
        bestStatus = DUPLICATE_STATUS.VARIANT_OF_EXISTING;
        bestReason = `نفس الموديل (${candidate.model}) بلون/إصدار مختلف (${candidate.color}) عن "${part.name}"`;
      }
    } else if (sim >= 0.62 || modelHit) {
      const sc = Math.max(sim, modelHit ? 0.7 : 0);
      if (sc > bestScore) {
        bestScore = sc;
        bestMatch = part;
        bestStatus = DUPLICATE_STATUS.POSSIBLE_DUPLICATE;
        bestReason = modelHit
          ? `تطابق الموديل (${candidate.model}) مع المنتج الحالي "${part.name}"`
          : `تشابه في الاسم (${Math.round(sim * 100)}%) مع "${part.name}"`;
      }
    }
  }

  if (bestMatch) {
    return {
      status: bestStatus,
      labelAr: DUPLICATE_LABELS_AR[bestStatus],
      reason: bestReason,
      matchedPart: bestMatch,
      score: Number(bestScore.toFixed(2)),
      recommendedAction: bestStatus === DUPLICATE_STATUS.EXACT_DUPLICATE ? 'skip' : bestStatus === DUPLICATE_STATUS.VARIANT_OF_EXISTING ? 'add_variant' : 'manual_review'
    };
  }

  return {
    status: DUPLICATE_STATUS.NEW_PRODUCT,
    labelAr: DUPLICATE_LABELS_AR.NEW_PRODUCT,
    reason: 'لم يتم العثور على منتج مطابق في كتالوج المتجر الحالي.',
    matchedPart: null,
    score: 0,
    recommendedAction: 'import_new'
  };
}

// ============================================================================
// PHASE 6 — AI PRODUCT ENRICHMENT ENGINE (ZERO HALLUCINATION + PROVENANCE)
// ============================================================================

const ARABIC_TYPE_LABELS = {
  watch: 'ساعة ذكية',
  earbuds: 'سماعة لاسلكية',
  tablet: 'تابلت',
  charger: 'شاحن سريع',
  cable: 'كابل شحن وبيانات',
  powerbank: 'باور بانك',
  speaker: 'سبيكر بلوتوث'
};

export function inferStoreCategory(product, normalizePartCategory, existingCategories = []) {
  const combined = `${product.category || ''} ${product.name || ''} ${product.originalDescription || ''}`;
  if (typeof normalizePartCategory === 'function') {
    const mapped = normalizePartCategory(product.category || '', product.name || '');
    if (mapped) return mapped;
  }
  const low = combined.toLowerCase();
  if (/watch|ساع/i.test(low)) return 'ساعات وأساور ذكية';
  if (/buds|earbuds|airpods|headphone|سماع/i.test(low)) return 'سماعات ومايكات';
  if (/speaker|سبيكر/i.test(low)) return 'سبيكر ومكبرات صوت';
  if (/charger|adapter|شاحن/i.test(low)) return 'شواحن';
  if (/cable|كابل/i.test(low)) return 'كابلات ومحولات';
  if (/power\s*bank|باور/i.test(low)) return 'باور بانك';
  if (/case|cover|جراب/i.test(low)) return 'جرابات الموبايل';
  if (/screen|protector|اسكرين/i.test(low)) return 'اسكرينات وحماية كاميرا';
  return existingCategories[0] || 'مشتركات وأجهزة ذكية ومكتبية';
}

export function slugifyUrl(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72);
}

export function enrichProductData(product, options = {}) {
  const { normalizePartCategory, existingCategories = [], language = 'ar' } = options;
  const matchedCategory = inferStoreCategory(product, normalizePartCategory, existingCategories);

  // Detect product type for natural Arabic title prefix
  const low = `${product.name || ''} ${product.category || ''}`.toLowerCase();
  let arPrefix = '';
  for (const pt of PRODUCT_TYPE_MAP) {
    if (pt.patterns.some(re => re.test(low))) {
      arPrefix = ARABIC_TYPE_LABELS[pt.key] || '';
      break;
    }
  }

  const baseName = String(product.name || '').trim();
  const hasArabic = /[\u0600-\u06FF]/.test(baseName);
  const titleEn = baseName;
  const titleAr = hasArabic
    ? baseName
    : arPrefix
      ? `${arPrefix} ${baseName}`.trim()
      : baseName;

  // Build structured specs strictly from verified source data (NEVER invent specs!)
  const specs = {};
  if (product.brand) specs['العلامة التجارية'] = product.brand;
  if (product.model) specs['الموديل'] = product.model;
  if (product.sku) specs['رمز المنتج (SKU)'] = product.sku;
  if (product.color) specs['اللون'] = product.color;
  if (product.weight) specs['الوزن'] = product.weight;
  if (product.dimensions) specs['الأبعاد'] = product.dimensions;
  if (product.specifications && typeof product.specifications === 'object') {
    Object.entries(product.specifications).forEach(([k, v]) => {
      if (v && !specs[k]) specs[k] = String(v);
    });
  }

  // Professional Arabic description grounded strictly in verified source info
  const specLines = Object.entries(specs)
    .slice(0, 8)
    .map(([k, v]) => `• ${k}: ${v}`)
    .join('\n');

  const descPartsAr = [
    `${titleAr} — متوفر ضمن قسم ${matchedCategory} في متجر Elzoghbi Market.`
  ];
  if (product.originalDescription) {
    descPartsAr.push(`نظرة عامة بناءً على بيانات المصدر:\n${product.originalDescription}`);
  }
  if (specLines) {
    descPartsAr.push(`المواصفات التقنية الموثقة من المصدر:\n${specLines}`);
  }
  if (product.warranty) {
    descPartsAr.push(`معلومات الضمان المذكورة في المصدر: ${product.warranty}`);
  }

  const descriptionAr = descPartsAr.join('\n\n');
  const descriptionEn = product.originalDescription || `${titleEn} — ${matchedCategory}.`;

  // SEO fields (clean, no keyword stuffing)
  const seoTitle = `${titleAr} | Elzoghbi Market`.slice(0, 65);
  const seoDescription = `${titleAr}${product.brand ? ` من ${product.brand}` : ''} — اكتشف المواصفات والسعر في Elzoghbi Market.`.slice(0, 155);
  const urlSlug = slugifyUrl(`${product.brand || ''} ${product.model || product.name || ''}`);

  // Tags
  const tags = Array.from(new Set([
    product.brand,
    product.model,
    matchedCategory,
    arPrefix,
    product.color
  ].map(s => String(s || '').trim()).filter(Boolean)));

  // Provenance & Completeness Indicator (transparent, never fabricated certainty)
  const verifiedFields = [];
  const missingFields = [];
  const unverifiedFields = [];

  if (product.name) verifiedFields.push('الاسم'); else missingFields.push('الاسم');
  if (product.brand) verifiedFields.push('العلامة التجارية'); else missingFields.push('العلامة التجارية');
  if (product.model || product.sku) verifiedFields.push('الموديل/SKU'); else missingFields.push('الموديل/SKU');
  if (product.price > 0) verifiedFields.push('سعر المصدر'); else missingFields.push('سعر المصدر');
  if (Array.isArray(product.images) && product.images.length > 0) verifiedFields.push(`الصور (${product.images.length})`); else missingFields.push('الصور');
  if (Object.keys(specs).length >= 2) verifiedFields.push('المواصفات'); else missingFields.push('المواصفات التقنية');
  if (!product.warranty) unverifiedFields.push('تفاصيل الضمان (غير مذكورة بالمصدر)');
  if (!product.gtin && !product.ean && !product.upc) unverifiedFields.push('GTIN/EAN/UPC');

  const completenessScore = Math.round((verifiedFields.length / 6) * 100);

  return {
    titleAr,
    titleEn,
    displayTitle: language === 'en' ? titleEn : titleAr,
    descriptionAr,
    descriptionEn,
    displayDescription: language === 'en' ? descriptionEn : descriptionAr,
    matchedCategory,
    specifications: specs,
    seo: {
      seoTitle,
      seoDescription,
      urlSlug,
      keywords: tags
    },
    tags,
    provenance: {
      sourceVerified: verifiedFields,
      aiGeneratedFromSource: ['العنوان المنسق', 'الوصف العربي المنظم', 'بيانات SEO والوسوم', 'مطابقة التصنيف'],
      missing: missingFields,
      unverified: unverifiedFields,
      completenessScore
    }
  };
}

// ============================================================================
// PHASE 7 — ADVANCED PRODUCT IMAGE INTELLIGENCE
// ============================================================================

export function analyzeProductImages(rawImages = []) {
  const seen = new Set();
  const analyzed = [];

  for (let i = 0; i < rawImages.length; i++) {
    const url = String(rawImages[i] || '').trim();
    if (!url) continue;
    const norm = url.split('#')[0];
    const isDuplicate = seen.has(norm);
    seen.add(norm);

    const isHttp = /^https?:\/\//i.test(url);
    const low = url.toLowerCase();
    const isLowResHint = /(_thumb|_small|_tiny|50x50|100x100|150x150|thumbnail|icon)/i.test(low);
    const isWatermarkHint = /(watermark|promo|banner|badge|logo|placeholder|no-image|sprite)/i.test(low);
    const isVariantHint = /(black|white|silver|gold|porcelain|hazel|obsidian|blue|green|pink|red)/i.test(low);

    let status = 'valid_unverified';
    const warnings = [];
    if (!isHttp) {
      status = 'broken';
      warnings.push('رابط غير صالح (يجب أن يبدأ بـ http/https)');
    }
    if (isDuplicate) warnings.push('صورة مكررة');
    if (isLowResHint) warnings.push('احتمال دقة منخفضة (Thumbnail)');
    if (isWatermarkHint) warnings.push('احتمال وجود شعار أو علامة ترويجية');

    analyzed.push({
      id: `img_${i}_${norm.slice(-8).replace(/[^a-z0-9]/gi, '')}`,
      url,
      selected: isHttp && !isDuplicate && !isWatermarkHint,
      isMain: false,
      isDuplicate,
      isLowResHint,
      isWatermarkHint,
      isVariantHint,
      status,
      warnings
    });
  }

  // Pick first clean image as main
  const firstGood = analyzed.find(im => im.selected) || analyzed[0];
  if (firstGood) firstGood.isMain = true;

  return analyzed;
}

// ============================================================================
// PHASE 8 — INTELLIGENT PRICING & EXPLICIT CURRENCY ENGINE
// ============================================================================

export function roundToStep(value, step) {
  const s = Number(step || 0);
  if (!s || s <= 0) return Math.round(value);
  return Math.round(value / s) * s;
}

export function calculateProductPricing(product, pricingConfig = {}, matchedCategory = '') {
  const sourcePrice = Number(product.price || 0);
  const sourceCurrency = String(product.currency || 'USD').toUpperCase();
  const targetCurrency = String(pricingConfig.targetCurrency || 'EGP').toUpperCase();
  const needsConversion = sourceCurrency !== targetCurrency;

  // Never silently convert or fabricate exchange rates!
  const rate = needsConversion ? Number(pricingConfig.exchangeRate || 0) : 1;
  if (sourcePrice <= 0) {
    return {
      ok: false,
      error: 'سعر المصدر غير متوفر أو يساوي صفراً.',
      sourcePrice: 0,
      sourceCurrency,
      targetCurrency,
      exchangeRate: rate || null,
      convertedPrice: 0,
      calculatedPrice: 0,
      finalPrice: 0,
      steps: ['سعر المصدر مفقود — يتطلب إدخال سعر يدوي.']
    };
  }

  if (needsConversion && (!rate || rate <= 0)) {
    return {
      ok: false,
      error: `يلزم تحديد أو جلب سعر صرف موثق لتحويل (${sourceCurrency} → ${targetCurrency}) قبل حساب السعر النهائي.`,
      sourcePrice,
      sourceCurrency,
      targetCurrency,
      exchangeRate: null,
      convertedPrice: null,
      calculatedPrice: null,
      finalPrice: null,
      steps: [`سعر المصدر: ${sourcePrice} ${sourceCurrency}`, `⚠️ بانتظار سعر صرف موثق (${sourceCurrency} → ${targetCurrency})`]
    };
  }

  const convertedPrice = Number((sourcePrice * rate).toFixed(2));
  const steps = [`سعر المصدر: ${sourcePrice.toLocaleString('en-US')} ${sourceCurrency}`];
  if (needsConversion) {
    steps.push(`سعر الصرف (${pricingConfig.exchangeRateSource || 'محدد من المدير'}): ${rate} ${targetCurrency}/${sourceCurrency}`);
    steps.push(`السعر المحوّل: ${convertedPrice.toLocaleString('en-US')} ${targetCurrency}`);
  }

  // Resolve effective mode & value (supporting category/brand/conditional overrides)
  let effMode = pricingConfig.mode || 'same_price';
  let effVal = Number(pricingConfig.value || 0);

  if (effMode === 'category_specific' && pricingConfig.categoryOverrides?.[matchedCategory] !== undefined) {
    effMode = 'percent_increase';
    effVal = Number(pricingConfig.categoryOverrides[matchedCategory]);
  } else if (effMode === 'brand_specific' && pricingConfig.brandOverrides?.[product.brand] !== undefined) {
    effMode = 'percent_increase';
    effVal = Number(pricingConfig.brandOverrides[product.brand]);
  } else if (effMode === 'conditional') {
    effMode = 'percent_increase';
    effVal = convertedPrice < 1000 ? 25 : convertedPrice < 5000 ? 18 : 12;
  }

  let calculatedPrice = convertedPrice;
  let markupLabel = 'بدون تعديل (0%)';
  let aiSuggestedPrice = null;

  if (effMode === 'percent_increase') {
    calculatedPrice = convertedPrice * (1 + effVal / 100);
    markupLabel = `+${effVal}%`;
    steps.push(`هامش الزيادة: +${effVal}% → ${Math.round(calculatedPrice).toLocaleString('en-US')} ${targetCurrency}`);
  } else if (effMode === 'percent_decrease') {
    calculatedPrice = convertedPrice * (1 - effVal / 100);
    markupLabel = `-${effVal}%`;
    steps.push(`نسبة الخصم: -${effVal}% → ${Math.round(calculatedPrice).toLocaleString('en-US')} ${targetCurrency}`);
  } else if (effMode === 'fixed_increase') {
    calculatedPrice = convertedPrice + effVal;
    markupLabel = `+${effVal} ${targetCurrency}`;
    steps.push(`زيادة ثابتة: +${effVal} ${targetCurrency} → ${Math.round(calculatedPrice).toLocaleString('en-US')} ${targetCurrency}`);
  } else if (effMode === 'fixed_decrease') {
    calculatedPrice = Math.max(0, convertedPrice - effVal);
    markupLabel = `-${effVal} ${targetCurrency}`;
    steps.push(`خصم ثابت: -${effVal} ${targetCurrency} → ${Math.round(calculatedPrice).toLocaleString('en-US')} ${targetCurrency}`);
  } else if (effMode === 'ai_suggested') {
    // Suggested competitive margin (15%) — NEVER auto-applied without approval
    aiSuggestedPrice = roundToStep(convertedPrice * 1.15, pricingConfig.roundingStep || 50);
    markupLabel = 'اقتراح AI (+15% بانتظار الموافقة)';
    steps.push(`السعر المقترح من AI: ${aiSuggestedPrice.toLocaleString('en-US')} ${targetCurrency} (غير مطبّق تلقائياً)`);
  }

  let finalPrice = roundToStep(calculatedPrice, pricingConfig.roundingStep || 0);
  if (pricingConfig.roundingStep > 0) {
    steps.push(`التقريب لأقرب ${pricingConfig.roundingStep} ${targetCurrency}: ${finalPrice.toLocaleString('en-US')} ${targetCurrency}`);
  }

  if (pricingConfig.minFinalPrice && finalPrice < Number(pricingConfig.minFinalPrice)) {
    finalPrice = Number(pricingConfig.minFinalPrice);
    steps.push(`تطبيق الحد الأدنى للسعر: ${finalPrice.toLocaleString('en-US')} ${targetCurrency}`);
  }
  if (pricingConfig.maxFinalPrice && finalPrice > Number(pricingConfig.maxFinalPrice)) {
    finalPrice = Number(pricingConfig.maxFinalPrice);
    steps.push(`تطبيق الحد الأقصى للسعر: ${finalPrice.toLocaleString('en-US')} ${targetCurrency}`);
  }

  return {
    ok: true,
    error: null,
    sourcePrice,
    sourceCurrency,
    targetCurrency,
    exchangeRate: rate,
    exchangeRateSource: pricingConfig.exchangeRateSource || (needsConversion ? 'محدد من المدير' : 'نفس العملة'),
    exchangeRateDate: pricingConfig.exchangeRateDate || new Date().toISOString().slice(0, 10),
    convertedPrice,
    markupLabel,
    calculatedPrice: Math.round(calculatedPrice),
    roundingStep: Number(pricingConfig.roundingStep || 0),
    finalPrice,
    aiSuggestedPrice,
    steps
  };
}

// ============================================================================
// PHASE 11 — SMART CATALOG UPDATE MODE (CHANGE COMPARISON REPORT)
// ============================================================================

export function buildCatalogUpdateProposals(discoveredProducts, existingParts, pricingConfig = {}) {
  const proposals = [];
  for (const src of discoveredProducts) {
    const dup = classifyDuplicate(src, existingParts);
    if (!dup.matchedPart) continue;
    const existing = dup.matchedPart;
    const priceCalc = calculateProductPricing(src, pricingConfig, existing.category);
    const changes = [];

    if (priceCalc.ok && priceCalc.finalPrice && Number(existing.basePrice) !== Number(priceCalc.finalPrice)) {
      const diff = priceCalc.finalPrice - Number(existing.basePrice || 0);
      const pct = existing.basePrice ? Math.round((diff / Number(existing.basePrice)) * 100) : 0;
      changes.push({
        field: 'basePrice',
        fieldLabel: 'السعر',
        existingValue: `${Number(existing.basePrice || 0).toLocaleString('en-US')} ج.م`,
        sourceValue: `${src.price} ${src.currency}`,
        proposedValue: `${priceCalc.finalPrice.toLocaleString('en-US')} ج.م`,
        rawProposed: priceCalc.finalPrice,
        deltaLabel: `${diff >= 0 ? '+' : ''}${diff.toLocaleString('en-US')} ج.م (${pct >= 0 ? '+' : ''}${pct}%)`,
        approved: false
      });
    }

    const existingOut = Boolean(existing.soldOut || Number(existing.stock) <= 0);
    const srcOut = src.availability === 'out_of_stock';
    if (existingOut !== srcOut) {
      changes.push({
        field: 'soldOut',
        fieldLabel: 'حالة التوفر',
        existingValue: existingOut ? 'غير متوفر' : 'متوفر',
        sourceValue: srcOut ? 'غير متوفر بالمصدر' : 'متوفر بالمصدر',
        proposedValue: srcOut ? 'تحديد كغير متوفر / مراجعة المخزون' : 'متوفر',
        rawProposed: srcOut,
        deltaLabel: srcOut ? 'نفد من المصدر' : 'عاد للتوفر',
        approved: false
      });
    }

    const existingImgs = Array.isArray(existing.images) ? existing.images : existing.image ? [existing.image] : [];
    if (Array.isArray(src.images) && src.images.length > existingImgs.length) {
      changes.push({
        field: 'images',
        fieldLabel: 'الصور',
        existingValue: `${existingImgs.length} صورة`,
        sourceValue: `${src.images.length} صورة`,
        proposedValue: `تحديث إلى ${src.images.length} صور من المصدر`,
        rawProposed: src.images.slice(0, 6),
        deltaLabel: `+${src.images.length - existingImgs.length} صور`,
        approved: false
      });
    }

    if (changes.length > 0) {
      proposals.push({
        id: `upd_${existing.id}`,
        existingPartId: existing.id,
        existingPartName: existing.name,
        existingSku: existing.sku || '',
        sourceName: src.name,
        sourceUrl: src.productUrl || src.sourceUrl,
        matchReason: dup.reason,
        confidence: dup.score,
        changes
      });
    }
  }
  return proposals;
}

// ============================================================================
// PHASE 12 — SAFE IDEMPOTENT DRAFT IMPORT PAYLOAD BUILDER
// ============================================================================

export function computeIdempotencyKey(item) {
  const seed = `${item.sku || ''}|${item.gtin || ''}|${item.productUrl || ''}|${(item.enriched?.titleAr || item.name || '').toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return `aisrc_${Math.abs(hash).toString(36)}`;
}

export function buildSafeImportPart(stagedItem, taskId, options = {}) {
  const { asDraft = true, defaultModelId = 'mdl_general', imageHandling = 'keep_external_urls' } = options;
  const idempotencyKey = computeIdempotencyKey(stagedItem);
  const selectedImgs = imageHandling === 'skip_images'
    ? []
    : (stagedItem.analyzedImages || []).filter(im => im.selected).sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0)).map(im => im.url);
  const mainImg = selectedImgs[0] || '';
  const finalPrice = Number(stagedItem.customPrice ?? stagedItem.pricing?.finalPrice ?? 0) || 0;
  const costPrice = Number(stagedItem.pricing?.convertedPrice ?? 0) || 0;

  return {
    id: `part_${idempotencyKey}`,
    sku: stagedItem.sku || `AI-${idempotencyKey.slice(-6).toUpperCase()}`,
    sourceSku: stagedItem.sku || '',
    gtin: stagedItem.gtin || stagedItem.ean || stagedItem.upc || '',
    modelId: stagedItem.modelId || defaultModelId,
    brandName: stagedItem.brand || '',
    modelName: stagedItem.model || '',
    category: stagedItem.editedCategory || stagedItem.enriched?.matchedCategory || 'مشتركات وأجهزة ذكية ومكتبية',
    name: stagedItem.editedTitle || stagedItem.enriched?.titleAr || stagedItem.name,
    qualityGrade: 'أصلي معتمد',
    colors: stagedItem.color ? [stagedItem.color] : ['قياسي'],
    compatibleModels: [],
    searchAliases: (stagedItem.enriched?.tags || []).join(' '),
    description: stagedItem.editedDescription || stagedItem.enriched?.descriptionAr || '',
    warrantyText: stagedItem.warranty || 'حسب سياسة المتجر والمصدر',
    imageUrl: mainImg,
    image: mainImg,
    images: selectedImgs.slice(0, 8),
    stock: stagedItem.availability === 'out_of_stock' ? 0 : 5,
    lowStockThreshold: 2,
    maxOrderQty: 5,
    costPrice: Math.round(costPrice),
    basePrice: Math.round(finalPrice),
    customGroupPrices: {},
    waitlistCount: 0,
    soldOut: stagedItem.availability === 'out_of_stock',
    isPromotedAd: false,
    isDraft: Boolean(asDraft),
    sourceUrl: stagedItem.productUrl || stagedItem.sourceUrl || '',
    specsJson: stagedItem.enriched?.specifications || {},
    seoTitle: stagedItem.enriched?.seo?.seoTitle || '',
    seoDescription: stagedItem.enriched?.seo?.seoDescription || '',
    urlSlug: stagedItem.enriched?.seo?.urlSlug || '',
    sourcingTaskId: taskId || '',
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
  };
}
