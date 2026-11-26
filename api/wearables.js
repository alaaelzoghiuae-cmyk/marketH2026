/**
 * ELZOGHBI MARKET — Smartwatches & Earbuds guide API (/api/wearables)
 *
 *  action=list           -> curated catalogue of global-brand watches & earbuds (instant, no network)
 *  action=live&id=...    -> live data for one product: Amazon (Egypt / UAE / KSA) price + real customer star rating
 *
 * Where do the stars come from?
 *  1) Live: the star rating + number of ratings shown on Amazon for the same product (real customers).
 *  2) Fallback: an editorial score curated from the major tech reviewers' consensus, clearly labelled as such.
 */
import { liveStoreOffers } from './_lib/shops.js';

const ITEMS = [
  // ---------- Earbuds & headphones ----------
  { id: 'airpods-pro-2', type: 'earbuds', brand: 'Apple', name: 'Apple AirPods Pro 2', q: 'AirPods Pro 2', usd: 249, rating: 4.7, tags: ['عزل ضوضاء ممتاز', 'شحن USB-C', 'أفضل لمستخدمي آيفون'], battery: '6 ساعات (30 مع العلبة)', anc: true },
  { id: 'airpods-4', type: 'earbuds', brand: 'Apple', name: 'Apple AirPods 4', q: 'AirPods 4', usd: 129, rating: 4.5, tags: ['تصميم مريح مفتوح', 'نسخة بعزل ضوضاء متاحة', 'ميزانية آيفون'], battery: '5 ساعات (30 مع العلبة)', anc: false },
  { id: 'airpods-max', type: 'earbuds', brand: 'Apple', name: 'Apple AirPods Max', q: 'AirPods Max', usd: 549, rating: 4.5, tags: ['صوت فاخر', 'عزل ضوضاء قوي', 'سماعة رأس'], battery: '20 ساعة', anc: true },
  { id: 'galaxy-buds3-pro', type: 'earbuds', brand: 'Samsung', name: 'Samsung Galaxy Buds3 Pro', q: 'Galaxy Buds3 Pro', usd: 249, rating: 4.4, tags: ['أفضل مع سامسونج', 'عزل ذكي', 'صوت 24-bit'], battery: '6 ساعات (30 مع العلبة)', anc: true },
  { id: 'galaxy-buds-fe', type: 'earbuds', brand: 'Samsung', name: 'Samsung Galaxy Buds FE', q: 'Galaxy Buds FE', usd: 99, rating: 4.3, tags: ['اقتصادية', 'عزل ضوضاء', 'مناسبة للأندرويد'], battery: '8.5 ساعة (30 مع العلبة)', anc: true },
  { id: 'sony-wf-1000xm5', type: 'earbuds', brand: 'Sony', name: 'Sony WF-1000XM5', q: 'Sony WF-1000XM5', usd: 299, rating: 4.6, tags: ['أفضل عزل ضوضاء', 'صوت LDAC', 'حجم صغير'], battery: '8 ساعات (24 مع العلبة)', anc: true },
  { id: 'sony-wh-1000xm5', type: 'earbuds', brand: 'Sony', name: 'Sony WH-1000XM5', q: 'Sony WH-1000XM5', usd: 399, rating: 4.6, tags: ['سماعة رأس مرجعية', 'بطارية 30 ساعة', 'مكالمات واضحة'], battery: '30 ساعة', anc: true },
  { id: 'bose-qc-ultra-earbuds', type: 'earbuds', brand: 'Bose', name: 'Bose QuietComfort Ultra Earbuds', q: 'Bose QuietComfort Ultra Earbuds', usd: 299, rating: 4.5, tags: ['عزل ضوضاء رائد', 'صوت مكاني', 'راحة طويلة'], battery: '6 ساعات (24 مع العلبة)', anc: true },
  { id: 'pixel-buds-pro-2', type: 'earbuds', brand: 'Google', name: 'Google Pixel Buds Pro 2', q: 'Pixel Buds Pro 2', usd: 229, rating: 4.4, tags: ['خفيفة ومريحة', 'مساعد جوجل', 'عزل ضوضاء'], battery: '8 ساعات (30 مع العلبة)', anc: true },
  { id: 'soundcore-liberty-4-nc', type: 'earbuds', brand: 'Anker', name: 'Anker Soundcore Liberty 4 NC', q: 'Soundcore Liberty 4 NC', usd: 99, rating: 4.4, tags: ['قيمة ممتازة', 'بطارية قوية', 'عزل جيد'], battery: '10 ساعات (50 مع العلبة)', anc: true },
  { id: 'jbl-tour-pro-3', type: 'earbuds', brand: 'JBL', name: 'JBL Tour Pro 3', q: 'JBL Tour Pro 3', usd: 249, rating: 4.3, tags: ['علبة بشاشة', 'باس قوي', 'عزل تكيفي'], battery: '11 ساعة (44 مع العلبة)', anc: true },
  { id: 'huawei-freebuds-pro-4', type: 'earbuds', brand: 'Huawei', name: 'Huawei FreeBuds Pro 4', q: 'Huawei FreeBuds Pro 4', usd: 199, rating: 4.3, tags: ['صوت مفصل', 'عزل ذكي', 'مكالمات ممتازة'], battery: '6.5 ساعة (33 مع العلبة)', anc: true },
  { id: 'nothing-ear', type: 'earbuds', brand: 'Nothing', name: 'Nothing Ear (a)', q: 'Nothing Ear (a)', usd: 99, rating: 4.2, tags: ['تصميم مميز', 'سعر معقول', 'باس جيد'], battery: '9.5 ساعة (42.5 مع العلبة)', anc: true },
  { id: 'oneplus-buds-3', type: 'earbuds', brand: 'OnePlus', name: 'OnePlus Buds 3', q: 'OnePlus Buds 3', usd: 69, rating: 4.2, tags: ['اقتصادية', 'بطارية ممتازة', 'عزل 49dB'], battery: '10 ساعات (44 مع العلبة)', anc: true },
  { id: 'redmi-buds-6-pro', type: 'earbuds', brand: 'Xiaomi', name: 'Xiaomi Redmi Buds 6 Pro', q: 'Redmi Buds 6 Pro', usd: 59, rating: 4.1, tags: ['أرخص عزل ضوضاء', 'سائقين مزدوجين', 'قيمة مقابل سعر'], battery: '9 ساعات (36 مع العلبة)', anc: true },

  // ---------- Smart watches ----------
  { id: 'apple-watch-s10', type: 'watch', brand: 'Apple', name: 'Apple Watch Series 10', q: 'Apple Watch Series 10', usd: 399, rating: 4.7, tags: ['شاشة أكبر وأنحف', 'مستشعرات صحية', 'للآيفون فقط'], battery: '18 ساعة', gps: true },
  { id: 'apple-watch-ultra-2', type: 'watch', brand: 'Apple', name: 'Apple Watch Ultra 2', q: 'Apple Watch Ultra 2', usd: 799, rating: 4.8, tags: ['تيتانيوم', 'بطارية 36 ساعة', 'للرياضيين والغوص'], battery: '36 ساعة', gps: true },
  { id: 'apple-watch-se-2', type: 'watch', brand: 'Apple', name: 'Apple Watch SE (2nd gen)', q: 'Apple Watch SE 2nd generation', usd: 249, rating: 4.6, tags: ['أرخص ساعة أبل', 'مناسبة للبداية', 'كل الأساسيات'], battery: '18 ساعة', gps: true },
  { id: 'galaxy-watch7', type: 'watch', brand: 'Samsung', name: 'Samsung Galaxy Watch7', q: 'Galaxy Watch7', usd: 299, rating: 4.4, tags: ['تحليل جسم', 'شاشة AMOLED', 'أندرويد'], battery: '40 ساعة', gps: true },
  { id: 'galaxy-watch-ultra', type: 'watch', brand: 'Samsung', name: 'Samsung Galaxy Watch Ultra', q: 'Galaxy Watch Ultra', usd: 649, rating: 4.4, tags: ['تيتانيوم', 'متانة عالية', 'بطارية 60 ساعة'], battery: '60 ساعة', gps: true },
  { id: 'pixel-watch-3', type: 'watch', brand: 'Google', name: 'Google Pixel Watch 3', q: 'Pixel Watch 3', usd: 349, rating: 4.4, tags: ['شاشة مضيئة', 'تتبع رياضي', 'Fitbit'], battery: '24 ساعة', gps: true },
  { id: 'garmin-venu-3', type: 'watch', brand: 'Garmin', name: 'Garmin Venu 3', q: 'Garmin Venu 3', usd: 449, rating: 4.5, tags: ['بطارية 14 يوم', 'تتبع نوم دقيق', 'متوافقة مع الجميع'], battery: '14 يوم', gps: true },
  { id: 'garmin-forerunner-265', type: 'watch', brand: 'Garmin', name: 'Garmin Forerunner 265', q: 'Garmin Forerunner 265', usd: 449, rating: 4.7, tags: ['للجري', 'GPS دقيق', 'شاشة AMOLED'], battery: '13 يوم', gps: true },
  { id: 'huawei-watch-gt-5-pro', type: 'watch', brand: 'Huawei', name: 'Huawei Watch GT 5 Pro', q: 'Huawei Watch GT 5 Pro', usd: 299, rating: 4.4, tags: ['تيتانيوم', 'بطارية أسبوعين', 'تتبع صحي'], battery: '14 يوم', gps: true },
  { id: 'amazfit-balance', type: 'watch', brand: 'Amazfit', name: 'Amazfit Balance', q: 'Amazfit Balance', usd: 229, rating: 4.2, tags: ['قيمة جيدة', 'بطارية 14 يوم', 'تحليل جسم'], battery: '14 يوم', gps: true },
  { id: 'fitbit-charge-6', type: 'watch', brand: 'Fitbit', name: 'Fitbit Charge 6', q: 'Fitbit Charge 6', usd: 159, rating: 4.2, tags: ['سوار نشاط', 'تتبع قلب', 'خفيفة'], battery: '7 أيام', gps: true },
  { id: 'redmi-watch-5', type: 'watch', brand: 'Xiaomi', name: 'Xiaomi Redmi Watch 5', q: 'Redmi Watch 5', usd: 99, rating: 4.1, tags: ['اقتصادية', 'شاشة AMOLED', 'بطارية 24 يوم'], battery: '24 يوم', gps: true },
];

const FX_DEFAULT = { EGP_PER_USD: 50, AED_PER_USD: 3.6725 };

function publicItem(it) {
  return {
    id: it.id,
    type: it.type,
    brand: it.brand,
    name: it.name,
    q: it.q,
    msrpUsd: it.usd,
    editorialRating: it.rating,
    tags: it.tags,
    battery: it.battery,
    anc: !!it.anc,
  };
}

const cache = new Map();
function cget(k) {
  const e = cache.get(k);
  if (!e || Date.now() > e.exp) return null;
  return e.val;
}

async function liveFor(it) {
  const ck = `wl:${it.id}`;
  const c = cget(ck);
  if (c) return c;
  const opts = { minPrice: 5, minCoverage: 0.75 };
  // Amazon throttles parallel requests from one IP, so ask region by region.
  const eg = await liveStoreOffers('eg', it.q, { ...opts, minPrice: 300 }).catch(() => []);
  const ae = await liveStoreOffers('ae', it.q, opts).catch(() => []);
  const sa = ae.length ? [] : await liveStoreOffers('sa', it.q, opts).catch(() => []);
  const all = [...eg, ...ae, ...sa];
  // Real rating: pick the offer with the most customer ratings
  const rated = all.filter((o) => o.rating > 0 && o.reviews > 0).sort((a, b) => b.reviews - a.reviews)[0];
  const slim = (o) => ({ store: o.storeLabel, price: o.price, currency: o.currency, url: o.url, rating: o.rating, reviews: o.reviews });
  const result = {
    ok: true,
    id: it.id,
    egypt: eg[0] ? slim(eg[0]) : null,
    uae: ae[0] ? slim(ae[0]) : null,
    ksa: sa[0] ? slim(sa[0]) : null,
    image: (all.find((o) => o.image) || {}).image || '',
    liveRating: rated ? { value: rated.rating, count: rated.reviews, source: rated.storeLabel } : null,
    estimatedEgpFromMsrp: Math.round((it.usd * FX_DEFAULT.EGP_PER_USD * 1.12) / 50) * 50,
    updatedAt: Date.now(),
  };
  const found = result.egypt || result.uae || result.ksa || result.liveRating;
  cache.set(ck, { val: result, exp: Date.now() + (found ? 6 * 3600 * 1000 : 5 * 60 * 1000) });
  return result;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  const action = String(req.query?.action || 'list').toLowerCase();
  try {
    if (action === 'list') {
      res.setHeader('Cache-Control', 'public, max-age=300');
      return res.status(200).json({ ok: true, items: ITEMS.map(publicItem) });
    }
    if (action === 'live') {
      const it = ITEMS.find((x) => x.id === String(req.query?.id || ''));
      if (!it) return res.status(404).json({ ok: false, error: 'المنتج غير موجود' });
      return res.status(200).json(await liveFor(it));
    }
    return res.status(400).json({ ok: false, error: 'عملية غير مدعومة' });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e?.message || 'تعذر جلب البيانات' });
  }
}
