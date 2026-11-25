/**
 * Shared live-shop helpers (Amazon Egypt / UAE / KSA + Noon best-effort).
 * Used by /api/karambo-live (phone prices) and /api/wearables (watch + earbuds prices & ratings).
 * Zero API keys required — prices and star ratings are read from the public search result pages.
 */
import https from 'node:https';
import zlib from 'node:zlib';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export function httpGet(urlStr, { headers = {}, timeout = 6500, maxBytes = 6 * 1024 * 1024, redirects = 3 } = {}) {
  return new Promise((resolve, reject) => {
    let u;
    try {
      u = new URL(urlStr);
    } catch {
      return reject(new Error('bad url'));
    }
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method: 'GET',
        family: 4,
        timeout,
        headers: {
          'User-Agent': UA,
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          ...headers,
        },
      },
      (res) => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400 && res.headers.location && redirects > 0) {
          res.resume();
          const next = new URL(res.headers.location, u).toString();
          return httpGet(next, { headers, timeout, maxBytes, redirects: redirects - 1 }).then(resolve, reject);
        }
        const enc = String(res.headers['content-encoding'] || '').toLowerCase();
        let stream = res;
        if (enc === 'gzip') stream = res.pipe(zlib.createGunzip());
        else if (enc === 'deflate') stream = res.pipe(zlib.createInflate());
        else if (enc === 'br') stream = res.pipe(zlib.createBrotliDecompress());
        const chunks = [];
        let total = 0;
        stream.on('data', (c) => {
          total += c.length;
          if (total > maxBytes) {
            req.destroy();
            return resolve({ status, body: Buffer.concat(chunks).toString('utf8'), headers: res.headers, truncated: true });
          }
          chunks.push(c);
        });
        stream.on('end', () => resolve({ status, body: Buffer.concat(chunks).toString('utf8'), headers: res.headers }));
        stream.on('error', reject);
      }
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

export function decodeText(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCount(raw) {
  const s = String(raw || '').replace(/,/g, '').trim();
  if (!s) return 0;
  const m = s.match(/^([\d.]+)\s*([KkMm]?)$/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const u = m[2].toLowerCase();
  return Math.round(u === 'k' ? n * 1000 : u === 'm' ? n * 1e6 : n);
}

export const AMAZON = {
  eg: { host: 'www.amazon.eg', currency: 'EGP', label: 'أمازون مصر', store: 'amazon.eg' },
  ae: { host: 'www.amazon.ae', currency: 'AED', label: 'أمازون الإمارات', store: 'amazon.ae' },
  sa: { host: 'www.amazon.sa', currency: 'SAR', label: 'أمازون السعودية', store: 'amazon.sa' },
};

export function parseAmazonSearchHtml(html, region) {
  const meta = AMAZON[region];
  const parts = String(html || '').split('data-component-type="s-search-result"').slice(1);
  const out = [];
  for (const b of parts) {
    const asin = (b.match(/data-asin="([A-Z0-9]{8,12})"/) || [])[1];
    if (!asin) continue;
    let name = (b.match(/<h2[^>]*aria-label="([^"]+)"/) || [])[1];
    if (!name) {
      const h2 = b.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
      name = h2 ? decodeText(h2[1]) : '';
    }
    name = decodeText(name);
    const priceRaw = (b.match(/a-price-whole">([\d,]+)/) || [])[1];
    const price = priceRaw ? parseInt(priceRaw.replace(/,/g, ''), 10) : 0;
    if (!name || !price) continue;
    const rating = parseFloat((b.match(/a-icon-alt">([\d.]+) out of 5/) || [])[1] || '0') || 0;
    const reviews = parseCount(
      (b.match(/aria-label="([\d,.]+[KkMm]?) ratings?"/) || [])[1] ||
        (b.match(/s-underline-text">\s*\(?([\d,.]+[KkMm]?)\)?\s*</) || [])[1]
    );
    const image = (b.match(/class="s-image"[^>]*src="([^"]+)"/) || [])[1] || '';
    out.push({
      name,
      price,
      rating,
      reviews,
      image,
      url: `https://${meta.host}/dp/${asin}`,
      store: meta.store,
      storeLabel: meta.label,
      currency: meta.currency,
    });
    if (out.length >= 30) break;
  }
  return out;
}

const searchCache = new Map();
function cget(k) {
  const e = searchCache.get(k);
  if (!e) return null;
  if (Date.now() > e.exp) {
    searchCache.delete(k);
    return null;
  }
  return e.val;
}
function cset(k, val, ttl) {
  if (searchCache.size > 500) searchCache.delete(searchCache.keys().next().value);
  searchCache.set(k, { val, exp: Date.now() + ttl });
}

export async function amazonSearch(region, q) {
  const meta = AMAZON[region];
  if (!meta) return [];
  const key = `amz:${region}:${q.toLowerCase()}`;
  const hit = cget(key);
  if (hit) return hit;
  const url = `https://${meta.host}/s?k=${encodeURIComponent(q)}`;
  let items = [];
  for (let attempt = 0; attempt < 2 && !items.length; attempt++) {
    try {
      const r = await httpGet(url, { timeout: 7000 });
      if (r.status === 200 && r.body.length > 40000) items = parseAmazonSearchHtml(r.body, region);
    } catch {
      /* try again */
    }
    if (!items.length && attempt === 0) await new Promise((r) => setTimeout(r, 600));
  }
  // Short negative cache so a temporary robot-check does not stick for hours
  cset(key, items, items.length ? 60 * 60 * 1000 : 3 * 60 * 1000);
  return items;
}

const NOON = {
  eg: { path: 'egypt-en', currency: 'EGP', label: 'نون مصر', store: 'noon.eg' },
  ae: { path: 'uae-en', currency: 'AED', label: 'نون الإمارات', store: 'noon.ae' },
  sa: { path: 'saudi-en', currency: 'SAR', label: 'نون السعودية', store: 'noon.sa' },
};

function walkNoon(node, out, depth = 0) {
  if (!node || depth > 14 || out.length >= 40) return;
  if (Array.isArray(node)) {
    for (const n of node) walkNoon(n, out, depth + 1);
    return;
  }
  if (typeof node === 'object') {
    if (node.name && (node.sale_price || node.price) && (node.sku || node.catalog_sku || node.url)) {
      out.push(node);
      return;
    }
    for (const k of Object.keys(node)) walkNoon(node[k], out, depth + 1);
  }
}

/** Best effort — Noon protects its pages aggressively; when blocked this simply returns []. */
export async function noonSearch(region, q) {
  const meta = NOON[region];
  if (!meta) return [];
  const key = `noon:${region}:${q.toLowerCase()}`;
  const hit = cget(key);
  if (hit) return hit;
  let items = [];
  try {
    const r = await httpGet(`https://www.noon.com/${meta.path}/search/?q=${encodeURIComponent(q)}`, { timeout: 5500 });
    if (r.status === 200) {
      const m = r.body.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (m) {
        const raw = [];
        walkNoon(JSON.parse(m[1]), raw);
        items = raw
          .map((p) => {
            const price = Math.round(Number(p.sale_price || p.price) || 0);
            return {
              name: decodeText(p.name),
              price,
              rating: Number(p.product_rating?.value || p.rating || 0) || 0,
              reviews: Number(p.product_rating?.count || p.rating_count || 0) || 0,
              image: p.image_key ? `https://f.nooncdn.com/p/${p.image_key}.jpg` : '',
              url: p.url
                ? `https://www.noon.com/${meta.path}/${String(p.url).replace(/^\//, '')}`
                : `https://www.noon.com/${meta.path}/search/?q=${encodeURIComponent(q)}`,
              store: meta.store,
              storeLabel: meta.label,
              currency: meta.currency,
            };
          })
          .filter((x) => x.name && x.price > 0);
      }
    }
  } catch {
    /* blocked or unreachable */
  }
  cset(key, items, items.length ? 60 * 60 * 1000 : 5 * 60 * 1000);
  return items;
}

const JUNK_RE =
  /\b(case|cover|strap|band for|protector|screen guard|replacement|compatible with|silicone|skin|film|ear\s?tips?|ear\s?hooks?|holder|stand|dock|charging cable|sticker|pouch|lanyard|keychain|bumper)\b|جراب|كفر|اسكرينة|استيك/i;
const USED_RE = /\b(used|renewed|refurbished|pre-owned|open box|second hand)\b|مستعمل|مجدد/i;

function tokens(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .split(/[^a-z0-9+]+/)
    .filter(Boolean);
}

/**
 * Picks the best matching listing for a product name.
 * - every number in the query must exist in the title (stops "iPhone 16" matching "iPhone 15")
 * - rejects accessories / used / refurbished listings
 */
export function pickBestHit(hits, query, { minPrice = 0, maxPrice = 1e9, minCoverage = 0.72, allowJunk = false } = {}) {
  const qt = tokens(query);
  if (!qt.length) return null;
  const nums = qt.filter((t) => /^\d+$/.test(t));
  const mods = ['pro', 'max', 'ultra', 'plus', 'mini', 'fe', 'lite', 'air', 'fold', 'flip', 'se'];
  const scored = [];
  for (const h of hits || []) {
    if (!h || !h.name || !(h.price >= minPrice && h.price <= maxPrice)) continue;
    if (USED_RE.test(h.name)) continue;
    if (!allowJunk && JUNK_RE.test(h.name)) continue;
    const tt = tokens(h.name);
    const set = new Set(tt);
    if (nums.length && !nums.every((n) => set.has(n))) continue;
    const matched = qt.filter((t) => set.has(t)).length;
    const coverage = matched / qt.length;
    if (coverage < minCoverage) continue;
    let penalty = 0;
    for (const m of mods) {
      if (set.has(m) && !qt.includes(m)) penalty += 0.25;
    }
    penalty += Math.max(0, tt.length - qt.length - 8) * 0.01;
    scored.push({ ...h, score: coverage - penalty });
  }
  if (!scored.length) return null;
  scored.sort((a, b) => b.score - a.score || a.price - b.price);
  const top = scored[0].score;
  const close = scored.filter((s) => s.score >= top - 0.06).sort((a, b) => a.price - b.price);
  const chosen = close[0];
  const rated = close
    .filter((c) => c.reviews > 0 && c.price <= chosen.price * 1.12)
    .sort((a, b) => b.reviews - a.reviews)[0];
  return rated || chosen;
}

/** Runs Amazon (+ Noon best effort) for one region and returns the best offer per store. */
export async function liveStoreOffers(region, query, opts = {}) {
  const [amz, noon] = await Promise.all([
    amazonSearch(region, query),
    opts.noon === false ? Promise.resolve([]) : noonSearch(region, query),
  ]);
  const offers = [];
  const a = pickBestHit(amz, query, opts);
  if (a) offers.push(a);
  const n = pickBestHit(noon, query, opts);
  if (n) offers.push(n);
  return offers.sort((x, y) => x.price - y.price);
}
