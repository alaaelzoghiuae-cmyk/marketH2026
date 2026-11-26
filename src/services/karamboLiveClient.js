/**
 * ELZOGHBI MARKET — Karambo Live Market Client
 * Client-side cached bridge for:
 *  - Global Phone Catalog browse/filter/pagination (/api/gsmarena?action=catalog)
 *  - Live Egypt Market Price (/api/karambo-live?action=egypt-price)
 *  - Live Gulf (UAE -> KSA) + Egypt Prices (/api/karambo-live?action=gulf-prices)
 *  - Live Mobile News (/api/karambo-live?action=news)
 *  - Live Market Phones & Budget Advisor (/api/karambo-live?action=market-phones)
 *  - Live Stock-Style Price Radar (/api/karambo-live?action=radar)
 */

const PREFIX = 'elz_klive_v1_';
const mem = new Map();

function getCache(k) {
  if (mem.has(k)) return mem.get(k);
  try {
    const raw = window.sessionStorage.getItem(PREFIX + k);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj && obj.exp > Date.now()) { mem.set(k, obj.val); return obj.val; }
  } catch {}
  return null;
}

function setCache(k, val, ttlMs = 30 * 60 * 1000) {
  mem.set(k, val);
  try { window.sessionStorage.setItem(PREFIX + k, JSON.stringify({ val, exp: Date.now() + ttlMs })); } catch {}
}

async function fetchJsonSafe(url) {
  try {
    const r = await fetch(url);
    const ct = String(r.headers.get('content-type') || '');
    if (!r.ok || !ct.includes('application/json')) return null;
    return await r.json();
  } catch {
    return null;
  }
}

export async function fetchGlobalCatalog({ brand = 'all', q = '', page = 1, limit = 24 } = {}) {
  const ck = `cat:${brand}:${q}:${page}:${limit}`;
  const c = getCache(ck);
  if (c) return c;
  const params = new URLSearchParams({ action: 'catalog', brand, q, page: String(page), limit: String(limit) });
  const data = await fetchJsonSafe(`/api/gsmarena?${params.toString()}`);
  if (data && data.ok) {
    setCache(ck, data, 30 * 60 * 1000);
    return data;
  }
  return { ok: false, results: [], total: 0, brands: [], hasMore: false };
}

export async function fetchLiveEgyptPrice(phoneName) {
  const q = String(phoneName || '').trim();
  if (!q) return { ok: true, found: false, price: 0 };
  const ck = `egp:${q.toLowerCase()}`;
  const c = getCache(ck);
  if (c) return c;
  const data = await fetchJsonSafe(`/api/karambo-live?action=egypt-price&q=${encodeURIComponent(q)}`);
  if (data && data.ok) {
    setCache(ck, data, 45 * 60 * 1000);
    return data;
  }
  return { ok: false, found: false, price: 0 };
}

export async function fetchLiveGulfAndEgyptPrices(phoneName) {
  const q = String(phoneName || '').trim();
  if (!q) return { ok: false, gulf: { found: false, price: 0 }, egypt: { found: false, price: 0 } };
  const ck = `gulf:${q.toLowerCase()}`;
  const c = getCache(ck);
  if (c) return c;
  const data = await fetchJsonSafe(`/api/karambo-live?action=gulf-prices&q=${encodeURIComponent(q)}`);
  if (data && data.ok) {
    setCache(ck, data, 45 * 60 * 1000);
    return data;
  }
  return { ok: false, gulf: { found: false, price: 0, currency: 'AED' }, egypt: { found: false, price: 0, currency: 'EGP' } };
}

export async function fetchLiveNews(limit = 18) {
  const ck = `news:${limit}`;
  const c = getCache(ck);
  if (c) return c;
  const data = await fetchJsonSafe(`/api/karambo-live?action=news&limit=${limit}`);
  if (data && data.ok && Array.isArray(data.articles)) {
    setCache(ck, data, 20 * 60 * 1000);
    return data;
  }
  return { ok: false, articles: [] };
}

export async function fetchLiveMarketPhones({ q = '', minPrice = 0, maxPrice = 0, brand = 'all' } = {}) {
  const ck = `mkt:${q}:${minPrice}:${maxPrice}:${brand}`;
  const c = getCache(ck);
  if (c) return c;
  const params = new URLSearchParams({
    action: 'market-phones',
    q,
    minPrice: String(minPrice || 0),
    maxPrice: String(maxPrice || 0),
    brand
  });
  const data = await fetchJsonSafe(`/api/karambo-live?${params.toString()}`);
  if (data && data.ok && Array.isArray(data.items)) {
    setCache(ck, data, 25 * 60 * 1000);
    return data;
  }
  return { ok: false, items: [] };
}

export async function fetchLiveRadar() {
  const ck = 'radar:main';
  const c = getCache(ck);
  if (c) return c;
  const data = await fetchJsonSafe('/api/karambo-live?action=radar');
  if (data && data.ok && Array.isArray(data.items)) {
    setCache(ck, data, 20 * 60 * 1000);
    return data;
  }
  return { ok: false, items: [] };
}

// ---------- v27 additions: batch prices, wearables, trust checker, resilient news ----------

/** One request for a whole grid of phones (server shares cache + limits concurrency). */
export async function fetchPricesBatch(names, region = 'eg') {
  const list = [...new Set((names || []).map(n => String(n || '').trim()).filter(Boolean))].slice(0, 30);
  if (!list.length) return {};
  const out = {};
  const missing = [];
  for (const n of list) {
    const c = getCache(`pb:${region}:${n.toLowerCase()}`);
    if (c) out[n] = c; else missing.push(n);
  }
  if (!missing.length) return out;
  const data = await fetchJsonSafe(`/api/karambo-live?action=prices-batch&region=${region}&names=${encodeURIComponent(missing.join('|'))}`);
  if (data && data.ok && data.prices) {
    for (const n of missing) {
      const v = data.prices[n];
      if (v) { out[n] = v; setCache(`pb:${region}:${n.toLowerCase()}`, v, v.found ? 45 * 60 * 1000 : 10 * 60 * 1000); }
    }
  }
  return out;
}

export async function fetchWearablesList() {
  const c = getCache('wear:list');
  if (c) return c;
  const data = await fetchJsonSafe('/api/wearables?action=list');
  if (data && data.ok && Array.isArray(data.items)) { setCache('wear:list', data, 60 * 60 * 1000); return data; }
  return { ok: false, items: [] };
}

export async function fetchWearableLive(id) {
  const c = getCache(`wear:${id}`);
  if (c) return c;
  const data = await fetchJsonSafe(`/api/wearables?action=live&id=${encodeURIComponent(id)}`);
  if (data && data.ok) { setCache(`wear:${id}`, data, 3 * 60 * 60 * 1000); return data; }
  return { ok: false };
}

export async function checkTrust(q) {
  const query = String(q || '').trim();
  if (query.length < 3) return { ok: false, error: 'اكتب رقم أو رابط أو اسم الصفحة' };
  const data = await fetchJsonSafe(`/api/trust-check?q=${encodeURIComponent(query)}`);
  return data || { ok: false, error: 'تعذّر الاتصال بخدمة الفحص الآن — جرّب تاني' };
}

/** Last good news list survives server hiccups (stored on the device). */
const NEWS_LS = 'elz_news_last_good_v2';
export function readLastGoodNews() {
  try { const o = JSON.parse(window.localStorage.getItem(NEWS_LS) || 'null'); return o && Array.isArray(o.articles) ? o : null; } catch { return null; }
}
export async function fetchLiveNewsResilient(limit = 18, force = false) {
  if (force) { try { window.sessionStorage.removeItem(PREFIX + `news:${limit}`); mem.delete(`news:${limit}`); } catch {} }
  const r = await fetchLiveNews(limit);
  if (r.ok && r.articles.length) {
    try { window.localStorage.setItem(NEWS_LS, JSON.stringify({ articles: r.articles.slice(0, 60), at: Date.now() })); } catch {}
    return { ...r, stale: false };
  }
  const last = readLastGoodNews();
  return last ? { ok: true, articles: last.articles, stale: true, updatedAt: last.at } : { ok: false, articles: [] };
}
