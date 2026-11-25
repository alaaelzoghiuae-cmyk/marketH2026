// Accessory ↔ phone matching based on REAL relations (model id / compatible list / exact model tokens).
// A brand name alone never links a product to a phone (that was the "AirPods 4 on every phone" bug).
const STOP = new Set(['apple', 'samsung', 'galaxy', 'xiaomi', 'oppo', 'realme', 'honor', 'vivo', 'infinix', 'tecno', 'huawei', 'google', 'oneplus', 'motorola', 'nokia', 'nothing', 'phone', 'mobile', 'smartphone', '5g', '4g', 'lte', 'dual', 'sim', 'global', 'ايفون', 'آيفون', 'موبايل', 'هاتف', 'تليفون', 'سامسونج', 'شاومي', 'جالاكسي', 'for', 'case', 'جراب', 'كفر', 'cover']);
const VARIANTS = new Set(['pro', 'max', 'plus', 'ultra', 'mini', 'fe', 'lite', 'se', 'edge', 'fold', 'flip', 'note', 'برو', 'ماكس', 'بلس', 'الترا', 'ميني']);
export const toks = (s) => String(s || '').toLowerCase().normalize('NFKC').replace(/[^a-z0-9\u0600-\u06ff]+/g, ' ').split(' ').filter((t) => t && !STOP.has(t));
const setEq = (a, b) => a.length === b.length && a.length > 0 && a.every((t) => b.includes(t));

// exact same model (token sets equal) — "iPhone 16 Pro" ≠ "iPhone 16 Pro Max" ≠ "iPhone 16"
export const sameModel = (a, b) => setEq(toks(a), toks(b));

// part title mentions this exact phone: all phone tokens present, no *extra* variant words (pro/max/...) in the title
export function titleMentionsPhone(title, phoneName) {
  const P = toks(phoneName); const T = toks(title);
  if (P.length < 2 || !P.some((t) => /\d/.test(t))) return false;
  if (!P.every((t) => T.includes(t))) return false;
  return !T.some((t) => VARIANTS.has(t) && !P.includes(t));
}
const listOf = (v) => (Array.isArray(v) ? v : String(v || '').split(/[,\n;|]/)).map((x) => String(x).trim()).filter(Boolean);

export function modelsForPhone(models, phone) {
  const name = phone && (phone.name || phone.slug || '');
  return (models || []).filter((m) => m && (sameModel(m.name, name) || listOf(m.aliases).some((a) => sameModel(a, name))));
}

// Level: 'model' (linked by model_id) | 'list' (in compatible_models) | 'title' (exact model in the title) | null
export function partMatchLevel(part, phone, models, modelById) {
  const name = phone && (phone.name || phone.slug || '');
  if (!name) return null;
  const mdl = modelById && part.modelId !== undefined && part.modelId !== null ? modelById.get(String(part.modelId)) : null;
  if (mdl && (sameModel(mdl.name, name) || listOf(mdl.aliases).some((a) => sameModel(a, name)))) return 'model';
  if (listOf(part.compatibleModels).some((c) => sameModel(c, name))) return 'list';
  if (titleMentionsPhone(part.name, name)) return 'title';
  return null;
}
