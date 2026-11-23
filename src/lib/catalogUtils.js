import { OR_IMPORTED_BRANDS, OR_IMPORTED_MODELS, OR_IMPORTED_PARTS } from '../orCatalogData';

export const readPersistedDeletedSliceMap = (sliceKey) => {
  try {
    const raw = window.localStorage.getItem('hm_deleted_ids_v8') || window.sessionStorage.getItem('hm_deleted_ids_v8');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed[sliceKey]) return parsed[sliceKey];
    }
  } catch (e) {}
  return {};
};

export const isOrCatalogDisabledInStorage = () => {
  try {
    const raw = window.localStorage.getItem('elzoghbi_v2_siteSettings');
    if (raw) {
      const parsed = JSON.parse(raw);
      return Boolean(parsed && parsed.disableBundledOrCatalog);
    }
  } catch (e) {}
  return false;
};

export const mergeOrBrandsList = (baseBrands, delMap = {}, disabled = false) => {
  const list = Array.isArray(baseBrands) ? [...baseBrands] : [];
  if (disabled) return list;
  const seen = new Set(list.map(b => String(typeof b === 'object' && b !== null ? (b.name || b.id || '') : b).trim()));
  for (const ob of OR_IMPORTED_BRANDS) {
    const key = String(ob).trim();
    if (key && !seen.has(key) && !delMap[key]) {
      list.push(key);
      seen.add(key);
    }
  }
  return list;
};

export const mergeOrModelsList = (baseModels, delMap = {}, disabled = false) => {
  const list = Array.isArray(baseModels) ? [...baseModels] : [];
  if (disabled) return list;
  const seen = new Set(list.map(m => String(m?.id || '').trim()));
  for (const om of OR_IMPORTED_MODELS) {
    const id = String(om?.id || '').trim();
    if (id && !seen.has(id) && !delMap[id]) {
      list.push(om);
      seen.add(id);
    }
  }
  return list;
};

export const normalizePartCategory = (rawCat, partName = '') => {
  const cleaned = String(rawCat || '').replace(/^OR\s*-\s*/i, '').trim();
  const full = `${partName || ''} ${cleaned}`.toLowerCase();
  if (!cleaned) return '';
  if (cleaned === 'ALL') return 'ALL';

  // Keep spare-parts categories distinct
  if (cleaned === 'شاشات أصلية' || cleaned === 'شاشات كاملة') return 'شاشات كاملة';
  if (['بطاريات', 'فلاتات وبورد شحن', 'ظهر وشاسيه وبصمة', 'كاميرات', 'عروض وباكدجات VIP'].includes(cleaned)) {
    return cleaned;
  }

  // Exact unified accessory categories
  const directMap = {
    'باور بانك': 'باور بانك',
    'كابلات ومحولات': 'كابلات ومحولات',
    'شواحن': 'شواحن',
    'شواحن سريعة ولاسلكية': 'شواحن',
    'اسكرينات وحماية كاميرا': 'اسكرينات وحماية كاميرا',
    'جرابات الموبايل': 'جرابات الموبايل',
    'سماعات ومايكات': 'سماعات ومايكات',
    'سماعات': 'سماعات ومايكات',
    'سبيكر ومكبرات صوت': 'سبيكر ومكبرات صوت',
    'ساعات وأساور ذكية': 'ساعات وأساور ذكية',
    'إكسسوارات سيارة وحوامل وتصوير': 'إكسسوارات سيارة وحوامل وتصوير',
    'ماوس وكيبورد وجيمنج': 'ماوس وكيبورد وجيمنج',
    'مشتركات وأجهزة ذكية ومكتبية': 'مشتركات وأجهزة ذكية ومكتبية',
    'ماكينات حلاقة وعناية': 'ماكينات حلاقة وعناية',
    'إكسسوارات وعناية': 'ماكينات حلاقة وعناية'
  };
  if (directMap[cleaned]) return directMap[cleaned];

  // Legacy combined categories -> smart split
  if (cleaned === 'شواحن وكابلات' || cleaned === 'شواحن وكابلات أصلية') {
    if (/(cable|كابل|وصلة|محول|otg|hub|aux|hdmi)/i.test(full) && !/(charger|شاحن)/i.test(full)) return 'كابلات ومحولات';
    return 'شواحن';
  }
  if (cleaned === 'سماعات وساعات ذكية') {
    if (/(watch|ساعة|ساعات|سوار|band|strap)/i.test(full)) return 'ساعات وأساور ذكية';
    return 'سماعات ومايكات';
  }
  if (['جرابات وإكسسوارات حماية', 'جرابات واكسسوارات حماية', 'جرابات وحمايات'].includes(cleaned)) {
    if (/(screen|glass|اسكرين|سكرين|عدسة|كاميرا)/i.test(full)) return 'اسكرينات وحماية كاميرا';
    return 'جرابات الموبايل';
  }

  // English spare-parts / device leftovers -> unified Arabic taxonomy
  const lowerCleaned = cleaned.toLowerCase();
  const enMap = {
    'screens': 'شاشات كاملة', 'screen': 'شاشات كاملة',
    'batteries': 'بطاريات', 'battery': 'بطاريات',
    'back glass': 'ظهر وشاسيه وبصمة', 'back cover': 'ظهر وشاسيه وبصمة',
    'charging flex': 'فلاتات وبورد شحن', 'charging port': 'فلاتات وبورد شحن', 'flex': 'فلاتات وبورد شحن',
    'cameras': 'كاميرات', 'camera': 'كاميرات',
    'smartwatch': 'ساعات وأساور ذكية', 'smart watch': 'ساعات وأساور ذكية', 'apple watch': 'ساعات وأساور ذكية',
    'health and fitness tracker': 'ساعات وأساور ذكية', 'fitness tracker': 'ساعات وأساور ذكية',
    'ring light': 'إكسسوارات سيارة وحوامل وتصوير'
  };
  if (enMap[lowerCleaned]) return enMap[lowerCleaned];

  // Arabic spare-parts synonyms -> unified spare categories
  const arMap = {
    'شاشات': 'شاشات كاملة', 'باغات وتتشات': 'شاشات كاملة', 'باغات': 'شاشات كاملة', 'تتشات': 'شاشات كاملة',
    'هاوسينج': 'ظهر وشاسيه وبصمة', 'هاوسنج': 'ظهر وشاسيه وبصمة',
    'فلاتات موصلة': 'فلاتات وبورد شحن', 'فلاتات بور': 'فلاتات وبورد شحن',
    'فالاتات فوليوم': 'فلاتات وبورد شحن', 'فلاتات فوليوم': 'فلاتات وبورد شحن', 'سماعة وجرس': 'فلاتات وبورد شحن',
    'اسكرينات': 'اسكرينات وحماية كاميرا', 'جرابات': 'جرابات الموبايل',
    'وصلة شحن': 'كابلات ومحولات', 'عدسات': 'كاميرات'
  };
  if (arMap[cleaned]) return arMap[cleaned];

  // Generic / foreign / model-name buckets carry no type information:
  // classify from the product name so the product joins its cross-brand
  // type group (e.g. any brand's headphones land in 'سماعات ومايكات').
  const genericBuckets = ['أقسام عامة', 'اكسسوارات', '1', 'tools', 'iphone', 'macbook', 'samsung', 'xiaomi', 'huawei', 'oppo', 'realme', 'infinix', 'tecno', 'apple', 'general', 'other', 'misc', 'accessories'];
  if (genericBuckets.includes(lowerCleaned) || genericBuckets.includes(cleaned)) {
    const n = full.replace(/[ً-ْ]/g, '');
    if (/(فلاتة|فلاتات|بورد شحن)/i.test(n)) return 'فلاتات وبورد شحن';
    if (/(اسكرين|سكرين|واقي|screen protector|tempered|lens protector|حماية عدسة|حماية كاميرا)/i.test(n)) return 'اسكرينات وحماية كاميرا';
    if (/(شاشة|شاشات|باغة|باغات|\blcd\b|\boled\b|تاتش)/i.test(n)) return 'شاشات كاملة';
    if (/(بطارية|battery)/i.test(n)) return 'بطاريات';
    if (/(ظهر|شاسيه|بصمة|هاوس|back glass)/i.test(n)) return 'ظهر وشاسيه وبصمة';
    if (/(سماع|ايربود|إيربود|airpod|earbud|earphone|headphone|headset|مايك|microphone|\bbuds\b)/i.test(n)) return 'سماعات ومايكات';
    if (/(سبيكر|مكبر صوت|speaker|soundbar)/i.test(n)) return 'سبيكر ومكبرات صوت';
    if (/(ساعة|ساعات|سوار|smart ?watch|\bwatch\b|fitness tracker|تراكر|\bband\b|strap|whoop)/i.test(n)) return 'ساعات وأساور ذكية';
    if (/(باور بانك|power ?bank)/i.test(n)) return 'باور بانك';
    if (/(شاحن|charger|charging)/i.test(n)) return 'شواحن';
    if (/(كابل|كيبل|وصلة|cable|otg|aux|hdmi|محول|adapter)/i.test(n)) return 'كابلات ومحولات';
    if (/(جراب|كفر|غطاء|cover|\bcase\b|bumper)/i.test(n)) return 'جرابات الموبايل';
    if (/(حامل|ستاند|holder|stand|mount|ring light|رينج لايت|سيلفي|selfie|tripod|ترايبود)/i.test(n)) return 'إكسسوارات سيارة وحوامل وتصوير';
    if (/(ماوس|كيبورد|mouse|keyboard|جيمنج|gaming|يد تحكم|controller)/i.test(n)) return 'ماوس وكيبورد وجيمنج';
    if (/(حلاقة|trimmer|shaver|قص شعر)/i.test(n)) return 'ماكينات حلاقة وعناية';
    if (/(مشترك|\bhub\b|موزع|card reader|قارئ)/i.test(n)) return 'مشتركات وأجهزة ذكية ومكتبية';
    if (/(كاميرا|camera)/i.test(n)) return 'كاميرات';
    return '';
  }
  return cleaned;
};

export const mergeOrPartsList = (baseParts, delMap = {}, disabled = false) => {
  const list = Array.isArray(baseParts) ? [...baseParts] : [];
  if (disabled) return list;
  const seen = new Set(list.map(p => String(p?.id || '').trim()));
  for (const op of OR_IMPORTED_PARTS) {
    const id = String(op?.id || '').trim();
    if (id && !seen.has(id) && !delMap[id]) {
      list.push(op);
      seen.add(id);
    }
  }
  return list;
};

export const isOrPrefixedName = v => /^OR[\s\-_]/.test(String(v || '').toUpperCase());
