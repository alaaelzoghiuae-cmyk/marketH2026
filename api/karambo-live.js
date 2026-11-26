/**
 * ELZOGHBI MARKET — Korombo Live Market Intelligence API (/api/karambo-live) v25
 *
 * Exhaustive Multi-Store Live Market Engine (Egypt + UAE) — 100% White-Labeled:
 *  - Egypt Cached Open JSON Catalogs (600–1,000+ live phones, 30m cache):
 *      Dream 2000 + iPalace Store (iPhones incl. 13/14/15/16/17) + Shiko Store
 *  - Egypt Exhaustive Parallel Fallback Search (before ever returning "غير متوفر في مصر"):
 *      Shopify Predictive Search (Dream2000, iPalace, Shiko) + B.TECH + Esterad + MobileMasr + Aman Stores + Open Arabic Review API
 *  - UAE Open JSON Catalogs (Ecity + Techorbit + Playgame + MDS Mobile)
 *  - Rewritten & Analyzed Mobile News Feed
 */

import http from 'node:http';
import https from 'node:https';
import zlib from 'node:zlib';
import { translateArabicPhoneQuery } from './gsmarena.js';
import { liveStoreOffers, httpGet } from './_lib/shops.js';

const ALLOWED_HOSTS = new Set([
  // Egypt stores
  'dream2000.com', 'www.dream2000.com',
  'ipalacestore.com', 'www.ipalacestore.com',
  'shikostore.com', 'www.shikostore.com',
  'btech.com', 'www.btech.com',
  'esterad.com.eg', 'www.esterad.com.eg',
  'mobilemasr.com', 'www.mobilemasr.com',
  'amanstores.com', 'www.amanstores.com',
  // UAE stores
  'ecityuae.ae', 'www.ecityuae.ae',
  'techorbitonline.net', 'www.techorbitonline.net',
  'playgame.ae', 'www.playgame.ae',
  'mdsmobile.ae', 'www.mdsmobile.ae',
  // News & optional price radar
  'mobizil.com', 'www.mobizil.com',
  'www.kanbkam.com', 'kanbkam.com'
]);

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const FAST_TIMEOUT_MS = 4500;
const MAX_BODY_BYTES = 4 * 1024 * 1024;
const MAX_REDIRECTS = 4;

const CACHE_TTL_CATALOG = 30 * 60 * 1000;
const CACHE_TTL_PRICE = 60 * 60 * 1000;
const CACHE_TTL_NEWS = 30 * 60 * 1000;

const memCache = new Map();
function cacheGet(k) {
  const e = memCache.get(k);
  if (!e) return null;
  if (Date.now() > e.exp) { memCache.delete(k); return null; }
  return e.val;
}
function cacheSet(k, val, ttl) {
  if (memCache.size > 700) {
    const first = memCache.keys().next().value;
    if (first) memCache.delete(first);
  }
  memCache.set(k, { val, exp: Date.now() + ttl });
}

// ---------- Strict White-Label Brand Scrubber ----------
export function scrubExternalBrands(text) {
  return String(text || '')
    .replace(/\b(?:gsmarena(?:\.com)?|mobizil(?:\.com)?|kanbkam(?:\.com)?|kabbkam(?:\.com)?|noon(?:\.com)?|amazon(?:\.eg|\.ae|\.sa|\.com)?|jumia(?:\.com\.eg)?|mobi3araby(?:\.com)?|dream\s*2000(?:\.com)?|ipalace(?:store)?(?:\.com)?|shiko(?:store)?(?:\.com)?|b\.?tech(?:\.com)?|esterad(?:\.com\.eg)?|mobilemasr(?:\.com)?|amanstores(?:\.com)?|ecity(?:uae)?(?:\.ae)?|techorbit(?:online)?(?:\.net)?|playgame(?:\.ae)?|mdsmobile(?:\.ae)?)\b/gi, '')
    .replace(/(?:موبيزيل|دوبيزيل|كان\s*بكام|كابكام|جي\s*اس\s*ام\s*ارينا|موبي\s*عربي|موقع\s*نون|متجر\s*نون|نوون|أمازون|امازون|جوميا|دريم\s*2000|بي\s*تك|موبايل\s*مصر|شيكو\s*ستور|أمان\s*ستورز|اي\s*بالاس)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s\-–—:|·،]+|[\s\-–—:|·،]+$/g, '')
    .trim();
}

function decodeEntities(str) {
  return String(str || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;|&#8217;/gi, "'")
    .replace(/&#8211;|&#8212;/gi, '-')
    .replace(/&#8220;|&#8221;/gi, '"')
    .replace(/&laquo;|&raquo;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function stripHtml(html) {
  return decodeEntities(
    String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim();
}

function safeRequest(targetUrl, extraHeaders = {}, timeoutMs = FAST_TIMEOUT_MS, redirectsLeft = MAX_REDIRECTS) {
  return new Promise((resolve, reject) => {
    let parsed;
    try { parsed = new URL(targetUrl); } catch { return reject(new Error('رابط غير صالح')); }
    if (!ALLOWED_HOSTS.has(parsed.hostname)) return reject(new Error('نطاق غير مسموح به'));

    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'GET',
        family: 4,
        timeout: timeoutMs,
        headers: {
          'User-Agent': DESKTOP_UA,
          'Accept': 'application/json, text/html, application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          ...extraHeaders
        }
      },
      (res) => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400 && res.headers.location && redirectsLeft > 0) {
          res.resume();
          const nextUrl = new URL(res.headers.location, parsed).toString();
          return safeRequest(nextUrl, extraHeaders, timeoutMs, redirectsLeft - 1).then(resolve, reject);
        }
        const chunks = [];
        let total = 0;
        let stream = res;
        const enc = String(res.headers['content-encoding'] || '').toLowerCase();
        if (enc === 'gzip') stream = res.pipe(zlib.createGunzip());
        else if (enc === 'deflate') stream = res.pipe(zlib.createInflate());
        else if (enc === 'br' && zlib.createBrotliDecompress) stream = res.pipe(zlib.createBrotliDecompress());

        stream.on('data', (c) => {
          total += c.length;
          if (total <= MAX_BODY_BYTES) chunks.push(c);
          else res.destroy();
        });
        stream.on('end', () => resolve({ status, body: Buffer.concat(chunks).toString('utf8'), finalUrl: parsed.toString() }));
        stream.on('error', reject);
      }
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

// ---------- Smart Model Name Cleaner & Strict Model-Number Phone Matcher ----------
const ACCESSORY_RE = /\b(case|cover|bumper|pouch|sleeve|protector|tempered|glass|screen\s*guard|film|lens|charger|adapter|cable|cord|wire|holder|stand|mount|tripod|earbuds|headphone|airpods|buds|watch|band|strap|skin|sticker|battery|replacement|lcd|digitizer|flex|power\s*bank|speaker|router|modem|tablet|ipad|tab\s+s|tab\s+a|laptop|macbook|tv|fridge|washer)\b|جراب|كفر|اسكرين|حماية|واقيات|شاحن|كابل|وصلة|حامل|استيكر|سماعة|ساعة|باور\s*بانك|تابلت|لابتوب/i;

export function buildCleanPhoneQuery(raw) {
  let q = translateArabicPhoneQuery(raw);
  q = q
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(5g|4g|lte|dual\s*sim|global|china|india|edition|version|smartphone|mobile|phone|middle\s*east|uae|egypt|ksa)\b/gi, ' ')
    .replace(/^apple\s+(?=iphone)/i, '')
    .replace(/^xiaomi\s+(?=redmi|poco)/i, '')
    .replace(/^samsung\s+(?=galaxy)/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  return q;
}

function extractCoreTokens(str) {
  const clean = buildCleanPhoneQuery(str).toLowerCase();
  const ignore = new Set([
    'apple', 'samsung', 'xiaomi', 'oppo', 'vivo', 'realme', 'honor', 'huawei',
    'infinix', 'tecno', 'google', 'oneplus', 'motorola', 'nokia', 'sony', 'nothing',
    'galaxy', 'the', 'with', 'ram', 'rom', 'gb', 'tb', 'dual', 'sim', 'black', 'white',
    'blue', 'green', 'gold', 'silver', 'gray', 'grey', 'titanium', 'desert', 'natural',
    'ai', 'new', 'original', 'warranty', 'official', 'used', 'sealed'
  ]);
  const all = clean.split(/[^a-z0-9]+/).filter(t => t.length >= 1);
  const core = all.filter(t => !ignore.has(t));
  return core.length ? core : all;
}

export function pickBestPhonePriceHit(hits, query, minPhonePrice = 2200) {
  const cleanQ = buildCleanPhoneQuery(query).toLowerCase();
  const coreTokens = extractCoreTokens(query);
  if (!coreTokens.length) return null;

  const qHasPro = /\bpro\b/.test(cleanQ);
  const qHasMax = /\bmax\b/.test(cleanQ);
  const qHasUltra = /\bultra\b/.test(cleanQ);
  const qHasPlus = /\bplus\b|\+/.test(cleanQ);
  const qHasMini = /\bmini\b/.test(cleanQ);
  const qHasFe = /\bfe\b/.test(cleanQ);
  const qHasLite = /\blite\b/.test(cleanQ);
  const qHasAir = /\bair\b/.test(cleanQ);
  const qHasFold = /\bfold\b/.test(cleanQ);
  const qHasFlip = /\bflip\b/.test(cleanQ);

  const candidates = [];
  for (const h of (hits || [])) {
    const rawTitle = String(h.name || h.title || '').trim();
    const price = Number(h.sale_price || h.price || 0);
    if (!rawTitle || !isFinite(price) || price < minPhonePrice) continue;
    if (ACCESSORY_RE.test(rawTitle)) continue;
    if (/\b(used|renewed|refurbished|pre-owned|open box)\b|مستعمل|مجدد/i.test(rawTitle)) continue;

    const normTitle = `${rawTitle} ${translateArabicPhoneQuery(rawTitle)}`.toLowerCase();
    const qNums = coreTokens.filter(t => /^\d+$/.test(t));
    if (qNums.length > 0) {
      const allNumsMatch = qNums.every(n => new RegExp(`(?:^|[^0-9])${n}(?:[^0-9]|$)`).test(normTitle));
      if (!allNumsMatch) continue;
    }

    let matched = 0;
    for (const t of coreTokens) {
      if (normTitle.includes(t)) matched++;
    }
    const coverage = matched / coreTokens.length;
    if (coverage < 0.65) continue;

    let penalty = 0;
    if (!qHasPro && /\bpro\b|برو/.test(normTitle)) penalty += 0.3;
    if (!qHasMax && /\bmax\b|ماكس/.test(normTitle)) penalty += 0.3;
    if (!qHasUltra && /\bultra\b|الترا|ألترا/.test(normTitle)) penalty += 0.35;
    if (!qHasPlus && /\bplus\b|\+|بلس/.test(normTitle)) penalty += 0.25;
    if (!qHasMini && /\bmini\b|ميني/.test(normTitle)) penalty += 0.25;
    if (!qHasFe && /\bfe\b/.test(normTitle)) penalty += 0.3;
    if (!qHasLite && /\blite\b|لايت/.test(normTitle)) penalty += 0.25;
    if (!qHasAir && /\bair\b/.test(normTitle)) penalty += 0.25;
    if (!qHasFold && /\bfold\b|فولد/.test(normTitle)) penalty += 0.35;
    if (!qHasFlip && /\bflip\b|فليب/.test(normTitle)) penalty += 0.35;

    const finalScore = coverage - penalty;
    if (finalScore >= 0.5) {
      candidates.push({ title: scrubExternalBrands(rawTitle), price: Math.round(price), score: finalScore });
    }
  }
  if (!candidates.length) return null;
  candidates.sort((a, b) => (b.score - a.score) || (a.price - b.price));
  return candidates[0];
}

// ---------- Shopify Open JSON Catalog Parser ----------
export function parseShopifyProductsJson(jsonObj, minPrice = 2200) {
  const products = Array.isArray(jsonObj?.products) ? jsonObj.products : [];
  const out = [];
  for (const prod of products) {
    const title = scrubExternalBrands(prod.title || '');
    if (!title || ACCESSORY_RE.test(title)) continue;
    const variants = Array.isArray(prod.variants) ? prod.variants : [];
    if (!variants.length) continue;

    const validVars = variants
      .map(v => ({
        price: Math.round(parseFloat(v.price) || 0),
        compareAt: Math.round(parseFloat(v.compare_at_price) || 0),
        available: v.available !== false
      }))
      .filter(v => v.price >= minPrice && v.price <= 300000);
    if (!validVars.length) continue;

    validVars.sort((a, b) => (b.available - a.available) || (a.price - b.price));
    const chosen = validVars[0];
    const oldPrice = chosen.compareAt > chosen.price ? chosen.compareAt : chosen.price;
    const diff = oldPrice > chosen.price ? -(oldPrice - chosen.price) : 0;
    const pct = oldPrice > chosen.price ? Math.round(((oldPrice - chosen.price) / oldPrice) * 100) : 0;
    const image = (Array.isArray(prod.images) && prod.images[0] && prod.images[0].src) ? prod.images[0].src : '';
    const brand = scrubExternalBrands(prod.vendor || title.split(' ')[0] || '');

    out.push({
      id: `shp_${prod.id}`,
      name: title,
      brand,
      price: chosen.price,
      oldPrice,
      diff,
      pct,
      trend: diff < 0 ? 'down' : 'stable',
      available: chosen.available,
      image,
      updatedAt: String(prod.updated_at || '').slice(0, 10)
    });
  }
  return out;
}

// ---------- Universal HTML / JSON-LD / Next.js Product Price Extractor (B.TECH, Esterad, MobileMasr, Aman) ----------
const EGP_PRICE_RE = /(\d{1,3}(?:,\d{3})+|\d{4,6})(?:\.\d{1,2})?\s*(?:جني[هة]\s*مصر[يیى]?|جنيه|جنية|ج\.م|EGP|LE)/gi;

export function parseGenericEgyptStoreHtml(html, minPrice = 2200) {
  const src = String(html || '');
  const hits = [];
  const seen = new Set();

  // 1. JSON-LD Product / ItemList
  const ldRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let lm;
  while ((lm = ldRe.exec(src)) !== null) {
    try {
      const data = JSON.parse(lm[1]);
      const arr = Array.isArray(data) ? data : (data['@graph'] || data.itemListElement || [data]);
      for (const el of arr) {
        const it = el?.item || el;
        if (!it || !it.name) continue;
        const off = Array.isArray(it.offers) ? it.offers[0] : (it.offers || {});
        const price = Math.round(Number(off.price || off.lowPrice || 0));
        if (price < minPrice || price > 300000) continue;
        const name = scrubExternalBrands(stripHtml(it.name));
        if (!name || ACCESSORY_RE.test(name) || seen.has(name.toLowerCase())) continue;
        seen.add(name.toLowerCase());
        hits.push({ name, price });
      }
    } catch {}
  }

  // 2. Embedded __NEXT_DATA__ JSON (used by MobileMasr & modern storefronts)
  const nextM = src.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (nextM) {
    const pairRe = /"(?:name|title)"\s*:\s*"([^"]{6,140})"[^}]{0,350}?"(?:price|sale_price|final_price|min_price)"\s*:\s*(\d{4,6}(?:\.\d+)?)/g;
    let pm;
    while ((pm = pairRe.exec(nextM[1])) !== null && hits.length < 40) {
      const name = scrubExternalBrands(pm[1]);
      const price = Math.round(parseFloat(pm[2]));
      if (!name || price < minPrice || price > 300000 || ACCESSORY_RE.test(name)) continue;
      if (!seen.has(name.toLowerCase())) { seen.add(name.toLowerCase()); hits.push({ name, price }); }
    }
  }

  // 3. Price-anchored HTML fallback (Magento / B.TECH / Esterad / Aman)
  if (hits.length < 4) {
    const re = new RegExp(EGP_PRICE_RE.source, 'gi');
    let m;
    while ((m = re.exec(src)) !== null && hits.length < 40) {
      const price = Math.round(parseFloat(m[1].replace(/,/g, '')));
      if (price < minPrice || price > 300000) continue;
      const before = src.slice(Math.max(0, m.index - 1200), m.index);
      const tMatches = [
        ...[...before.matchAll(/<h[2-5][^>]*>([\s\S]*?)<\/h[2-5]>/gi)].map(x => x[1]),
        ...[...before.matchAll(/title=["']([^"']{8,200})["']/gi)].map(x => x[1]),
        ...[...before.matchAll(/alt=["']([^"']{8,200})["']/gi)].map(x => x[1])
      ];
      const rawT = tMatches.length ? tMatches[tMatches.length - 1] : '';
      const name = scrubExternalBrands(stripHtml(rawT));
      if (!name || name.length < 6 || ACCESSORY_RE.test(name) || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      hits.push({ name, price });
    }
  }
  return hits;
}

// ---------- Combined Live Egypt Smartphone Catalog (Dream 2000 + iPalace + Shiko Store — 600–1,000+ phones!) ----------
async function getLiveEgyptCatalog() {
  const ck = 'eg_multi_shopify_v25';
  const cached = cacheGet(ck);
  if (cached) return cached;

  const endpoints = [
    'https://dream2000.com/collections/mobiles/products.json?limit=250&page=1',
    'https://dream2000.com/collections/mobiles/products.json?limit=250&page=2',
    'https://ipalacestore.com/collections/iphone/products.json?limit=250&page=1',
    'https://ipalacestore.com/products.json?limit=250&page=1',
    'https://shikostore.com/collections/mobile-phone/products.json?limit=250&page=1',
    'https://shikostore.com/products.json?limit=250&page=1'
  ];

  const settled = await Promise.allSettled(
    endpoints.map(async (url) => {
      const r = await safeRequest(url, {}, 5000);
      if (r.status === 200 && r.body.trim().startsWith('{')) {
        return parseShopifyProductsJson(JSON.parse(r.body), 2200);
      }
      return [];
    })
  );

  const items = [];
  const seen = new Set();
  for (const s of settled) {
    if (s.status === 'fulfilled' && Array.isArray(s.value)) {
      for (const it of s.value) {
        const key = `${it.name.toLowerCase().slice(0, 50)}_${it.price}`;
        if (!seen.has(key)) { seen.add(key); items.push(it); }
      }
    }
  }

  if (items.length > 0) cacheSet(ck, items, CACHE_TTL_CATALOG);
  return items;
}

// ---------- Live UAE Smartphone Catalog ----------
async function getLiveUaeCatalog() {
  const ck = 'ae_shopify_catalog_v25';
  const cached = cacheGet(ck);
  if (cached) return cached;

  const endpoints = [
    'https://ecityuae.ae/collections/mobile-phones/products.json?limit=250&page=1',
    'https://techorbitonline.net/collections/mobile-phones/products.json?limit=250&page=1',
    'https://playgame.ae/collections/smartphones/products.json?limit=250&page=1',
    'https://mdsmobile.ae/collections/smartphones/products.json?limit=250&page=1'
  ];

  const settled = await Promise.allSettled(
    endpoints.map(async (u) => {
      const r = await safeRequest(u, {}, 4500);
      if (r.status === 200 && r.body.trim().startsWith('{')) {
        return parseShopifyProductsJson(JSON.parse(r.body), 200);
      }
      return [];
    })
  );

  const items = [];
  const seen = new Set();
  for (const s of settled) {
    if (s.status === 'fulfilled' && Array.isArray(s.value)) {
      for (const it of s.value) {
        const key = `${it.name.toLowerCase().slice(0, 45)}_${it.price}`;
        if (!seen.has(key)) { seen.add(key); items.push(it); }
      }
    }
  }

  if (items.length > 0) cacheSet(ck, items, CACHE_TTL_CATALOG);
  return items;
}

export function extractRegionalPricesFromText(text) {
  const clean = String(text || '').replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
  const out = { eg: 0, ae: 0, sa: 0 };

  const egMatch =
    clean.match(/في\s*مصر[\s\S]{0,140}?(\d{1,3}(?:,\d{3})+|\d{4,6})\s*(?:جني[هة]|ج\.م)/i) ||
    clean.match(/السعر[\s\S]{0,80}?(\d{1,3}(?:,\d{3})+|\d{4,6})\s*(?:جني[هة]|ج\.م)/i);
  if (egMatch) {
    const n = parseInt(egMatch[1].replace(/,/g, ''), 10);
    if (n >= 2200 && n <= 250000) out.eg = n;
  }
  const aeMatch = clean.match(/في\s*(?:الامارات|الإمارات)[\s\S]{0,140}?(\d{1,3}(?:,\d{3})+|\d{3,5})\s*(?:درهم|AED)/i);
  if (aeMatch) {
    const n = parseInt(aeMatch[1].replace(/,/g, ''), 10);
    if (n >= 200 && n <= 20000) out.ae = n;
  }
  const saMatch = clean.match(/في\s*(?:السعودية|السعوديه)[\s\S]{0,140}?(\d{1,3}(?:,\d{3})+|\d{3,5})\s*(?:ريال|SAR)/i);
  if (saMatch) {
    const n = parseInt(saMatch[1].replace(/,/g, ''), 10);
    if (n >= 200 && n <= 20000) out.sa = n;
  }
  return out;
}

async function fetchShopifySuggestSearch(domain, cleanQ, minPrice) {
  try {
    const r = await safeRequest(`https://${domain}/search/suggest.json?q=${encodeURIComponent(cleanQ)}&resources[type]=product&resources[limit]=10`, {}, 3500);
    if (r.status === 200 && r.body.trim().startsWith('{')) {
      const j = JSON.parse(r.body);
      const prods = j?.resources?.results?.products || [];
      return prods
        .map(p => ({ name: p.title || '', price: Math.round(parseFloat(p.price) || 0) }))
        .filter(x => x.name && x.price >= minPrice);
    }
  } catch {}
  return [];
}

// ---------- Exhaustive Multi-Store Region Price Lookup (NEVER says "غير متوفر" until ALL stores are checked!) ----------
async function fetchSmartRegionPrice(rawQuery, region = 'eg') {
  const cleanQ = buildCleanPhoneQuery(rawQuery);
  const meta = {
    eg: { currency: 'EGP', minPrice: 2200, label: 'مصر' },
    ae: { currency: 'AED', minPrice: 200, label: 'الإمارات' },
    sa: { currency: 'SAR', minPrice: 200, label: 'السعودية' }
  }[region] || { currency: 'EGP', minPrice: 2200, label: 'مصر' };

  if (!cleanQ || cleanQ.length < 2) return { found: false, price: 0, currency: meta.currency, region: meta.label };

  const ck = `price_v25:${region}:${cleanQ.toLowerCase()}`;
  const cached = cacheGet(ck);
  if (cached) return { ...cached, cached: true };

  let best = null;

  if (region === 'eg') {
    // Stage 1: Instant check across combined cached Egypt catalogs (Dream 2000 + iPalace + Shiko Store)
    const egCat = await getLiveEgyptCatalog();
    best = pickBestPhonePriceHit(egCat, cleanQ, meta.minPrice);

    // Stage 2: If not found in cached catalogs, race ALL 7 Egyptian stores in PARALLEL (3.8s max!)
    if (!best) {
      const probes = [
        fetchShopifySuggestSearch('dream2000.com', cleanQ, meta.minPrice),
        fetchShopifySuggestSearch('ipalacestore.com', cleanQ, meta.minPrice),
        fetchShopifySuggestSearch('shikostore.com', cleanQ, meta.minPrice),
        (async () => {
          const r = await safeRequest(`https://btech.com/ar/catalogsearch/result/?q=${encodeURIComponent(cleanQ)}`, {}, 3800);
          return r.status === 200 ? parseGenericEgyptStoreHtml(r.body, meta.minPrice) : [];
        })(),
        (async () => {
          const r = await safeRequest(`https://esterad.com.eg/ar/catalogsearch/result/?q=${encodeURIComponent(cleanQ)}`, {}, 3800);
          return r.status === 200 ? parseGenericEgyptStoreHtml(r.body, meta.minPrice) : [];
        })(),
        (async () => {
          const r = await safeRequest(`https://mobilemasr.com/search?q=${encodeURIComponent(cleanQ)}`, {}, 3800);
          return r.status === 200 ? parseGenericEgyptStoreHtml(r.body, meta.minPrice) : [];
        })(),
        (async () => {
          const r = await safeRequest(`https://www.amanstores.com/ar/catalogsearch/result/?q=${encodeURIComponent(cleanQ)}`, {}, 3800);
          return r.status === 200 ? parseGenericEgyptStoreHtml(r.body, meta.minPrice) : [];
        })()
      ];
      const settled = await Promise.allSettled(probes);
      const allHits = [];
      for (const s of settled) {
        if (s.status === 'fulfilled' && Array.isArray(s.value)) allHits.push(...s.value);
      }
      best = pickBestPhonePriceHit(allHits, cleanQ, meta.minPrice);
    }
  } else if (region === 'ae') {
    const aeCat = await getLiveUaeCatalog();
    best = pickBestPhonePriceHit(aeCat, cleanQ, meta.minPrice);
    if (!best) {
      const suggestHits = await fetchShopifySuggestSearch('ecityuae.ae', cleanQ, meta.minPrice);
      best = pickBestPhonePriceHit(suggestHits, cleanQ, meta.minPrice);
    }
  }

  // Stage 3: Secondary open Arabic review price fallback (EG / AE / SA)
  if (!best) {
    try {
      const r = await safeRequest(`https://mobizil.com/wp-json/wp/v2/posts?search=${encodeURIComponent(cleanQ)}&per_page=4&_fields=id,title,content,excerpt`, {}, 3200);
      if (r.status === 200 && r.body.trim().startsWith('[')) {
        const posts = JSON.parse(r.body);
        const coreTokens = extractCoreTokens(cleanQ);
        for (const p of posts) {
          const title = stripHtml(p?.title?.rendered || '');
          const norm = `${title} ${translateArabicPhoneQuery(title)}`.toLowerCase();
          const hits = coreTokens.filter(t => norm.includes(t)).length;
          if (coreTokens.length && hits / coreTokens.length < 0.65) continue;
          const prices = extractRegionalPricesFromText(stripHtml(p?.content?.rendered || p?.excerpt?.rendered || ''));
          if (prices[region] > 0) {
            best = { price: prices[region], title: scrubExternalBrands(title) };
            break;
          }
        }
      }
    } catch {}
  }

  const result = best
    ? { found: true, price: best.price, currency: meta.currency, region: meta.label, matchedTitle: best.title }
    : { found: false, price: 0, currency: meta.currency, region: meta.label };

  cacheSet(ck, result, CACHE_TTL_PRICE);
  return result;
}

// ---------- Multi-store price lookup: Egyptian catalogs + Amazon + Noon (Egypt / UAE / KSA) ----------
const REGION_META = {
  eg: { currency: 'EGP', minPrice: 2200, maxPrice: 300000, label: 'مصر' },
  ae: { currency: 'AED', minPrice: 200, maxPrice: 20000, label: 'الإمارات' },
  sa: { currency: 'SAR', minPrice: 200, maxPrice: 20000, label: 'السعودية' }
};

async function fetchPriceMulti(rawQuery, region = 'eg') {
  const meta = REGION_META[region] || REGION_META.eg;
  const cleanQ = buildCleanPhoneQuery(rawQuery);
  if (!cleanQ || cleanQ.length < 2) return { found: false, price: 0, currency: meta.currency, region: meta.label, offers: [] };
  const ck = `pm_v1:${region}:${cleanQ.toLowerCase()}`;
  const cached = cacheGet(ck);
  if (cached) return { ...cached, cached: true };

  const [base, live] = await Promise.all([
    fetchSmartRegionPrice(rawQuery, region),
    liveStoreOffers(region, cleanQ, { minPrice: meta.minPrice, maxPrice: meta.maxPrice }).catch(() => [])
  ]);

  const offers = (live || []).map(o => ({ store: o.storeLabel, price: o.price, currency: o.currency, url: o.url, rating: o.rating || 0, reviews: o.reviews || 0, title: o.name, image: o.image }));
  let price = 0;
  let matchedTitle = '';
  let source = '';
  if (base && base.found) {
    price = base.price; matchedTitle = base.matchedTitle || ''; source = 'local-stores';
  }
  if (offers.length) {
    const cheapest = offers[0];
    if (!price) { price = cheapest.price; matchedTitle = cheapest.title; source = cheapest.store; }
  }
  const image = (offers.find(o => o.image) || {}).image || '';
  const result = price > 0
    ? { found: true, price, currency: meta.currency, region: meta.label, matchedTitle: scrubExternalBrands(matchedTitle), offers, image, source }
    : { found: false, price: 0, currency: meta.currency, region: meta.label, offers: [] };
  cacheSet(ck, result, price > 0 ? CACHE_TTL_PRICE : 8 * 60 * 1000);
  return result;
}

async function mapLimit(list, limit, fn) {
  const out = new Array(list.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, list.length) }, async () => {
    while (i < list.length) {
      const idx = i++;
      try { out[idx] = await fn(list[idx], idx); } catch { out[idx] = null; }
    }
  }));
  return out;
}

// ---------- Editorial News Rewriter & Analyzer ----------
export function rewriteAndAnalyzeArticle({ id, rawTitle, rawExcerpt, rawHtml, image, category, date }) {
  const title = scrubExternalBrands(stripHtml(rawTitle));
  if (!title || title.length < 5) return null;

  const html = String(rawHtml || rawExcerpt || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<figure[\s\S]*?<\/figure>/gi, '');

  const blocks = [];
  const blockRe = /<(h2|h3|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let bm;
  while ((bm = blockRe.exec(html)) !== null && blocks.length < 40) {
    const tag = bm[1].toLowerCase();
    const txt = scrubExternalBrands(stripHtml(bm[2]));
    if (!txt || txt.length < 12) continue;
    if (/اشترك|تابعنا|تواصل معنا|المصدر|اقرأ أيضا|اقرأ أيضاً|شاهد الفيديو/i.test(txt)) continue;
    blocks.push({ type: (tag === 'h2' || tag === 'h3') ? 'heading' : tag === 'li' ? 'bullet' : 'paragraph', text: txt });
  }

  if (blocks.length === 0) {
    const plain = scrubExternalBrands(stripHtml(rawHtml || rawExcerpt || ''));
    const sentences = plain.split(/(?<=[.!؟])\s+/).filter(s => s.length > 15);
    for (let i = 0; i < sentences.length; i += 2) {
      blocks.push({ type: 'paragraph', text: sentences.slice(i, i + 2).join(' ') });
    }
  }

  const fullText = blocks.map(b => b.text).join(' ');
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;
  const readTimeMin = Math.max(1, Math.min(8, Math.round(wordCount / 160)));

  const highlights = [];
  const pushChip = (label, val) => { if (val && highlights.length < 6 && !highlights.some(h => h.label === label)) highlights.push({ label, val }); };
  const batM = fullText.match(/(\d{4,5})\s*(?:مللي|ملي|mAh)/i);
  if (batM) pushChip('البطارية', `${Number(batM[1]).toLocaleString('en-US')} mAh`);
  const chgM = fullText.match(/(\d{2,3})\s*(?:وات|واط|W\b)/i);
  if (chgM) pushChip('الشحن', `${chgM[1]} وات`);
  const camM = fullText.match(/(\d{2,3})\s*(?:ميجا\s*ب?كسل|ميجا|MP)/i);
  if (camM) pushChip('الكاميرا', `${camM[1]} ميجا`);
  const hzM = fullText.match(/(90|120|144|165)\s*(?:هرتز|Hz)/i);
  if (hzM) pushChip('التردد', `${hzM[1]} هرتز`);
  const scrM = fullText.match(/(6\.\d{1,2})\s*(?:بوصة|انش|إنش|inch)/i);
  if (scrM) pushChip('الشاشة', `${scrM[1]} بوصة`);
  const prM = fullText.match(/(\d{1,3}(?:,\d{3})+|\d{4,5})\s*(?:جني[هة]|دولار|USD|\$)/i);
  if (prM) pushChip('السعر المذكور', prM[0]);

  const keyPoints = [];
  const bulletBlocks = blocks.filter(b => b.type === 'bullet' && b.text.length >= 18 && b.text.length <= 160);
  for (const b of bulletBlocks) { if (keyPoints.length < 3) keyPoints.push(b.text); }
  if (keyPoints.length < 3) {
    const paraSentences = blocks
      .filter(b => b.type === 'paragraph')
      .flatMap(b => b.text.split(/(?<=[.!؟])\s+/))
      .map(s => s.trim())
      .filter(s => s.length >= 25 && s.length <= 170);
    for (const s of paraSentences) {
      if (keyPoints.length < 3 && !keyPoints.includes(s)) keyPoints.push(s);
    }
  }

  let karamboAnalysis = 'تابع هذا التحديث ضمن مقارنات كرومبو وقارن المواصفات والسعر الفعلي في مصر قبل اتخاذ قرار الشراء.';
  if (/سعر|تخفيض|خصم|انخفاض|ارتفاع/i.test(title + ' ' + fullText)) {
    karamboAnalysis = 'تحليل كرومبو: تحركات الأسعار في السوق المصري بتتغير أسبوعياً — راجع «رادار الأسعار» و«من الخليج ولا مصر؟» قبل ما تشتري عشان تضمن أفضل صفقة.';
  } else if (/إطلاق|رسمياً|رسميا|مواصفات|هاتف|موبايل/i.test(title)) {
    karamboAnalysis = 'تحليل كرومبو: لو بتفكر في الجهاز ده، قارنه فوراً بمنافسيه في نفس الفئة السعرية من قسم «قارن بنفسك» وتأكد من توافر إكسسواراته وقطع غياره في السوق المصري.';
  } else if (/تحديث|أندرويد|اندرويد|iOS|نظام|ذكاء/i.test(title)) {
    karamboAnalysis = 'تحليل كرومبو: تحديثات النظام والذكاء الاصطناعي بترفع عمر الجهاز وقيمته عند إعادة البيع — ميزة مهمة تاخدها في حسابك قبل الاختيار.';
  }

  const cleanExcerpt = keyPoints[0] || scrubExternalBrands(stripHtml(rawExcerpt || fullText)).slice(0, 180);

  return {
    id, title, excerpt: cleanExcerpt, image: image || '',
    category: scrubExternalBrands(category) || 'أخبار الموبايلات',
    date: String(date || '').slice(0, 10),
    readTimeMin, keyPoints, highlights, sections: blocks.slice(0, 18), karamboAnalysis
  };
}

export function parseWpPostsToNews(posts) {
  if (!Array.isArray(posts)) return [];
  return posts.map(p => {
    const featured = p?._embedded?.['wp:featuredmedia']?.[0]?.source_url || p?.jetpack_featured_media_url || '';
    const terms = p?._embedded?.['wp:term']?.[0] || [];
    return rewriteAndAnalyzeArticle({
      id: `news_${p.id || Date.now()}`,
      rawTitle: p?.title?.rendered || '',
      rawExcerpt: p?.excerpt?.rendered || '',
      rawHtml: p?.content?.rendered || p?.excerpt?.rendered || '',
      image: featured,
      category: terms[0]?.name || 'أخبار الموبايلات',
      date: p.date || ''
    });
  }).filter(Boolean);
}

// ---------- Multi-source Arabic mobile news (auto refreshed, cached, de-duplicated) ----------
const NEWS_RSS_SOURCES = [
  { id: 'arabhardware', name: 'عرب هاردوير', url: 'https://arabhardware.net/feed', filter: true },
  { id: 'tech-wd', name: 'تك دبليو دي', url: 'https://www.tech-wd.com/wd/feed/', filter: true },
  { id: 'aitnews', name: 'عالم التقنية', url: 'https://aitnews.com/feed/', filter: true },
  { id: 'youm7', name: 'اليوم السابع - تكنولوجيا', url: 'https://www.youm7.com/rss/SectionRss?SectionID=332', filter: true },
  { id: 'gsmarena', name: 'GSMArena', url: 'https://www.gsmarena.com/rss-news-reviews.php3', filter: false, lang: 'en', max: 4 },
  // Google News (Arabic / Egypt edition) aggregates many Arabic outlets; each item keeps its real outlet name and links to the original article.
  { id: 'gn_mobile', name: 'أخبار الموبايلات', url: 'https://news.google.com/rss/search?q=' + encodeURIComponent('موبايلات OR هواتف OR آيفون OR سامسونج OR شاومي when:7d') + '&hl=ar&gl=EG&ceid=EG:ar', filter: false, gnews: true, max: 20 },
  { id: 'gn_tech', name: 'أخبار التقنية', url: 'https://news.google.com/rss/search?q=' + encodeURIComponent('تكنولوجيا الهواتف الذكية والذكاء الاصطناعي when:3d') + '&hl=ar&gl=EG&ceid=EG:ar', filter: false, gnews: true, max: 14 }
];
const NEWS_MOBILE_RE = /موبايل|هاتف|هواتف|جوال|آيفون|ايفون|iphone|سامسونج|samsung|galaxy|جالاكسي|شاومي|xiaomi|redmi|poco|ريدمي|ريلمي|realme|أوبو|اوبو|oppo|فيفو|vivo|هونر|honor|هواوي|huawei|انفينكس|infinix|تكنو|tecno|ون بلس|oneplus|بيكسل|pixel|موتورولا|motorola|nothing|اندرويد|أندرويد|android|ios|سماعة|سماعات|ايربودز|airpods|buds|ساعة ذكية|ساعات ذكية|smartwatch|apple watch|هونر|معالج|سناب دراجون|snapdragon|ديمنسيتي|dimensity|شحن|بطارية/i;

function rssTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  if (!m) return '';
  let v = m[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
  if (/&lt;\w+/.test(v) && !/<\w+/.test(v)) v = v.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  return v;
}

export function parseRssToNews(xml, src) {
  const items = String(xml || '').split(/<item[\s>]/i).slice(1);
  const out = [];
  for (const raw of items.slice(0, 40)) {
    const title = rssTag(raw, 'title');
    const link = rssTag(raw, 'link') || (raw.match(/<link>([^<]+)</) || [])[1] || '';
    const html = rssTag(raw, 'content:encoded') || rssTag(raw, 'description');
    const pub = rssTag(raw, 'pubDate');
    const cat = stripHtml(rssTag(raw, 'category')) || 'أخبار الموبايلات';
    const img =
      (raw.match(/<enclosure[^>]+url=["']([^"']+\.(?:jpe?g|png|webp)[^"']*)["']/i) || [])[1] ||
      (raw.match(/<media:content[^>]+url=["']([^"']+)["']/i) || [])[1] ||
      (html.match(/<img[^>]+src=["']([^"']+)["']/i) || [])[1] || '';
    const text = `${title} ${stripHtml(html)}`;
    if (src.filter && !NEWS_MOBILE_RE.test(text)) continue;
    const d = pub ? new Date(pub) : null;
    const art = rewriteAndAnalyzeArticle({
      id: `news_${src.id}_${Buffer.from(link || title).toString('base64').replace(/[^a-z0-9]/gi, '').slice(-14)}`,
      rawTitle: title,
      rawExcerpt: html,
      rawHtml: html,
      image: img,
      category: src.lang === 'en' ? 'أخبار عالمية' : cat,
      date: d && !isNaN(d) ? d.toISOString() : ''
    });
    if (!art) continue;
    art.source = src.name;
    if (src.gnews) {
      const sn = stripHtml(rssTag(raw, 'source'));
      // Keep only Arabic-language outlets (drop foreign or unnamed domains).
      if (!sn || !(/[\u0600-\u06FF]/.test(sn) || /arabic|arabia/i.test(sn))) continue;
      art.source = sn;
      const sfx = sn ? new RegExp('\\s*[-–|]\\s*' + sn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$') : null;
      if (sfx && art.title) art.title = art.title.replace(sfx, '').trim();
    }
    art.sourceUrl = link;
    art.lang = src.lang || 'ar';
    art.ts = d && !isNaN(d) ? d.getTime() : 0;
    out.push(art);
  }
  return out;
}

async function fetchRssSource(src) {
  try {
    const r = await httpGet(src.url, { timeout: 6000, headers: { Accept: 'application/rss+xml, application/xml, text/xml, */*', 'Accept-Language': 'ar,en;q=0.8' } });
    if (r.status !== 200 || !/<item[\s>]/i.test(r.body)) return [];
    const arts = parseRssToNews(r.body, src);
    return src.max ? arts.slice(0, src.max) : arts;
  } catch { return []; }
}

function titleKey(t) {
  return String(t || '').toLowerCase().replace(/[^\u0600-\u06FFa-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 2).slice(0, 7).join(' ');
}

let lastGoodNews = [];
async function fetchLiveNews(limit = 16) {
  const ck = `news_v27:${limit}`;
  const cached = cacheGet(ck);
  if (cached) return { ok: true, articles: cached, cached: true, updatedAt: cached._t };

  const [wp, ...rss] = await Promise.all([
    (async () => {
      try {
        const r = await safeRequest(`https://mobizil.com/wp-json/wp/v2/posts?_embed&per_page=${Math.min(30, limit)}`, {}, 6000);
        if (r.status === 200 && r.body.trim().startsWith('[')) {
          return parseWpPostsToNews(JSON.parse(r.body)).map(a => {
            const raw = a.date ? new Date(a.date).getTime() : 0;
            return { ...a, source: 'موبيزل', sourceUrl: '', lang: 'ar', ts: raw };
          });
        }
      } catch {}
      return [];
    })(),
    ...NEWS_RSS_SOURCES.map(fetchRssSource)
  ]);

  const all = [...wp, ...rss.flat()];
  const seen = new Set();
  const uniq = [];
  for (const a of all) {
    const k = titleKey(a.title);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    uniq.push(a);
  }
  // newest first, Arabic sources first on ties, but keep every source represented
  const rank = (a) => (a.ts || 0) - (a.lang === 'en' ? 18 * 3600 * 1000 : 0);
  uniq.sort((a, b) => rank(b) - rank(a));
  // Guarantee every source (mobizil included) is represented, then fill by recency
  const articles = [];
  const taken = new Set();
  const perSource = {};
  for (const a of uniq) {
    perSource[a.source] = (perSource[a.source] || 0) + 1;
    if (perSource[a.source] <= 3 && articles.length < limit) { articles.push(a); taken.add(a.id); }
  }
  for (const a of uniq) {
    if (articles.length >= limit) break;
    if (!taken.has(a.id)) { articles.push(a); taken.add(a.id); }
  }
  articles.sort((a, b) => rank(b) - rank(a));

  if (articles.length > 0) {
    lastGoodNews = articles;
    cacheSet(ck, articles, CACHE_TTL_NEWS);
  }
  const final = articles.length ? articles : lastGoodNews.slice(0, limit);
  return { ok: final.length > 0, articles: final, updatedAt: Date.now(), sources: [...new Set(final.map(a => a.source))] };
}

export function parseKanbkamHtml(html, minPrice = 2200) {
  const src = String(html || '');
  const items = [];
  const seen = new Set();
  const re = new RegExp(EGP_PRICE_RE.source, 'gi');
  let m;
  while ((m = re.exec(src)) !== null && items.length < 50) {
    const price = Math.round(parseFloat(m[1].replace(/,/g, '')));
    if (price < minPrice || price > 300000) continue;
    const before = src.slice(Math.max(0, m.index - 1400), m.index);
    const after = src.slice(m.index + m[0].length, Math.min(src.length, m.index + 450));
    const titleMatches = [
      ...[...before.matchAll(/<h[2-5][^>]*>([\s\S]*?)<\/h[2-5]>/gi)].map(x => x[1]),
      ...[...before.matchAll(/title=["']([^"']{8,220})["']/gi)].map(x => x[1])
    ];
    const rawTitle = titleMatches.length ? titleMatches[titleMatches.length - 1] : '';
    const name = scrubExternalBrands(stripHtml(rawTitle)).replace(/^(?:اشتري|شراء|Buy)\s+/i, '').trim();
    if (!name || name.length < 6 || ACCESSORY_RE.test(name)) continue;
    const key = name.toLowerCase().slice(0, 50);
    if (seen.has(key)) continue;
    seen.add(key);
    const imgMatches = [...before.matchAll(/<img[^>]+(?:data-src|src)=["'](https?:\/\/[^"']+)["']/gi)];
    const pctDownM = after.match(/-\s*(\d{1,2})\s*%/);
    const pctUpM = after.match(/\+\s*(\d{1,2})\s*%/);
    const isDown = Boolean(pctDownM);
    const isUp = !isDown && Boolean(pctUpM);
    const pct = pctDownM ? parseInt(pctDownM[1], 10) : pctUpM ? parseInt(pctUpM[1], 10) : 0;
    const oldPrice = isDown && pct > 0 ? Math.round(price / (1 - pct / 100)) : price;
    items.push({
      id: `knb_${items.length}_${price}`,
      name,
      brand: name.split(' ')[0] || '',
      price,
      oldPrice,
      diff: isDown ? -(oldPrice - price) : 0,
      pct,
      trend: isDown ? 'down' : isUp ? 'up' : 'stable',
      image: imgMatches.length ? imgMatches[imgMatches.length - 1][1] : ''
    });
  }
  return items;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const action = String(req.query?.action || req.body?.action || '').trim().toLowerCase();

  try {
    if (action === 'egypt-price') {
      const q = String(req.query?.q || req.body?.q || '').trim();
      const data = await fetchPriceMulti(q, 'eg');
      return res.status(200).json({ ok: true, ...data });
    }

    if (action === 'gulf-prices') {
      const q = String(req.query?.q || req.body?.q || '').trim();
      const [egypt, uae, ksa] = await Promise.all([
        fetchPriceMulti(q, 'eg'),
        fetchPriceMulti(q, 'ae'),
        fetchPriceMulti(q, 'sa')
      ]);
      const gulf = uae.found ? uae : ksa;
      return res.status(200).json({
        ok: true,
        gulf: gulf.found ? gulf : { found: false, price: 0, currency: 'AED', region: '', offers: [] },
        egypt: egypt.found ? egypt : { found: false, price: 0, currency: 'EGP', region: 'مصر', offers: [] },
        uae: uae.found ? uae : null,
        ksa: ksa.found ? ksa : null
      });
    }

    // Batch Egypt prices for a grid of phones (one request, limited concurrency, shared cache)
    if (action === 'prices-batch') {
      const names = String(req.query?.names || req.body?.names || '').split('|').map(x => x.trim()).filter(Boolean).slice(0, 30);
      const region = ['eg', 'ae', 'sa'].includes(String(req.query?.region)) ? String(req.query.region) : 'eg';
      const results = await mapLimit(names, 4, (n) => fetchPriceMulti(n, region));
      const prices = {};
      names.forEach((n, i) => {
        const r = results[i];
        prices[n] = r && r.found
          ? { found: true, price: r.price, currency: r.currency, offers: (r.offers || []).slice(0, 3), source: r.source || '' }
          : { found: false, price: 0 };
      });
      return res.status(200).json({ ok: true, region, prices });
    }

    if (action === 'news') {
      const limit = Math.min(60, Math.max(4, parseInt(req.query?.limit || '16', 10) || 16));
      const data = await fetchLiveNews(limit);
      return res.status(200).json(data);
    }

    if (action === 'market-phones') {
      const q = String(req.query?.q || '').trim();
      const minPrice = Number(req.query?.minPrice || 0);
      const maxPrice = Number(req.query?.maxPrice || 0);
      const brand = String(req.query?.brand || '').trim().toLowerCase();

      let items = await getLiveEgyptCatalog();
      if (q) {
        const qEn = buildCleanPhoneQuery(q).toLowerCase();
        const words = qEn.split(/\s+/).filter(Boolean);
        items = items.filter(it => {
          const hay = `${it.name} ${it.brand} ${translateArabicPhoneQuery(it.name)}`.toLowerCase();
          return words.every(w => hay.includes(w));
        });
      }
      if (minPrice > 0) items = items.filter(x => x.price >= minPrice);
      if (maxPrice > 0) items = items.filter(x => x.price <= maxPrice);
      if (brand && brand !== 'all') {
        const brandEn = translateArabicPhoneQuery(brand).toLowerCase();
        items = items.filter(x => {
          const hay = `${x.name} ${x.brand}`.toLowerCase();
          return hay.includes(brand) || (brandEn && hay.includes(brandEn));
        });
      }
      return res.status(200).json({ ok: true, total: items.length, items: items.slice(0, 100) });
    }

    if (action === 'radar') {
      const [egCat, kanbItems] = await Promise.all([
        getLiveEgyptCatalog(),
        (async () => {
          try {
            const r = await safeRequest('https://www.kanbkam.com/eg/ar/mobile-phone/l', { Referer: 'https://www.kanbkam.com/eg/ar/' }, 3500);
            return (r.status === 200 && r.body) ? parseKanbkamHtml(r.body, 2200) : [];
          } catch { return []; }
        })()
      ]);

      const merged = [...kanbItems];
      const seen = new Set(merged.map(i => i.name.toLowerCase().slice(0, 35)));
      for (const it of egCat) {
        const k = it.name.toLowerCase().slice(0, 35);
        if (!seen.has(k)) { seen.add(k); merged.push(it); }
      }

      merged.sort((a, b) => {
        const score = (t) => t === 'down' ? 2 : t === 'up' ? 1 : 0;
        return (score(b.trend) - score(a.trend)) || (b.pct - a.pct) || (b.price - a.price);
      });

      return res.status(200).json({ ok: true, total: merged.length, items: merged.slice(0, 150) });
    }

    return res.status(400).json({ ok: false, error: 'العملية غير مدعومة.' });
  } catch (err) {
    return res.status(200).json({ ok: false, error: err?.message || 'حدث خطأ أثناء جلب بيانات السوق.' });
  }
}
