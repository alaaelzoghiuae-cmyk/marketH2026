// Vercel Serverless API — 100% Zero-Key Automatic Background Store Discovery & Real Reviews Engine
// Works completely out-of-the-box with ZERO API keys, ZERO signups, and ZERO credit cards:
//   Store Discovery (Parallel):
//     1) YellowPages Egypt (yellowpages.com.eg) — Real Egyptian mobile shops, addresses & phones
//     2) Photon + OpenStreetMap Overpass/Nominatim Egypt — Live physical mobile shops in every governorate
//     3) Trustpilot Public Search — Online stores & platforms with live TrustScore
//     4) Optional Google Maps Places API (New) — silently active if GOOGLE_PLACES_API_KEY is set
//   Real Customer Reviews & Experiences (Parallel):
//     1) Trustpilot Public Reviews (__NEXT_DATA__ / JSON-LD) — Real 1-5★ reviews + verified badges + company replies
//     2) Reddit Egypt Public JSON API (r/Egypt, r/Cairo, r/PersonalFinanceEgypt) — Real Egyptian buyers' reviews & warnings
//     3) Public Web Review Snippets (DuckDuckGo HTML) — Additional Egyptian buyer feedback snippets
//     4) Optional Google Maps Place Details — silently active if GOOGLE_PLACES_API_KEY is set

import https from 'node:https';

const CACHE = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function getCache(key) {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    CACHE.delete(key);
    return null;
  }
  return hit.data;
}

function setCache(key, data) {
  if (CACHE.size > 400) {
    const firstKey = CACHE.keys().next().value;
    if (firstKey) CACHE.delete(firstKey);
  }
  CACHE.set(key, { ts: Date.now(), data });
}

function httpRequest(urlStr, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const req = https.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + u.search,
        method: opts.method || 'GET',
        headers: {
          'User-Agent': opts.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept': opts.accept || 'application/json, text/html;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7',
          ...(opts.headers || {})
        },
        timeout: opts.timeout || 8000
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && (opts.redirects || 0) < 3) {
          const nextUrl = new URL(res.headers.location, urlStr).toString();
          res.resume();
          return httpRequest(nextUrl, { ...opts, redirects: (opts.redirects || 0) + 1 }).then(resolve, reject);
        }
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({ status: res.statusCode || 0, body, headers: res.headers });
        });
      }
    );
    req.on('timeout', () => { req.destroy(new Error('Request timeout')); });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const EGYPT_GOV_COORDS = {
  'القاهرة': { lat: 30.0444, lon: 31.2357, bbox: [29.92, 31.18, 30.16, 31.42] },
  'الجيزة': { lat: 30.0131, lon: 31.2089, bbox: [29.94, 31.10, 30.12, 31.24] },
  'الإسكندرية': { lat: 31.2001, lon: 29.9187, bbox: [31.14, 29.85, 31.29, 30.05] },
  'الدقهلية': { lat: 31.0409, lon: 31.3785, bbox: [30.92, 31.25, 31.10, 31.46] },
  'دمياط': { lat: 31.4175, lon: 31.8144, bbox: [31.36, 31.76, 31.46, 31.86] },
  'بورسعيد': { lat: 31.2653, lon: 32.3019, bbox: [31.22, 32.25, 31.29, 32.33] },
  'الشرقية': { lat: 30.5877, lon: 31.5020, bbox: [30.54, 31.45, 30.63, 31.55] },
  'الغربية': { lat: 30.7865, lon: 31.0004, bbox: [30.75, 30.95, 30.84, 31.04] },
  'المنوفية': { lat: 30.5526, lon: 31.0101, bbox: [30.52, 30.96, 30.60, 31.05] },
  'أسيوط': { lat: 27.1809, lon: 31.1837, bbox: [27.15, 31.14, 27.22, 31.22] }
};

export function cleanDomain(raw) {
  if (!raw) return '';
  let s = String(raw).trim().toLowerCase();
  s = s.replace(/^https?:\/\//, '').replace(/^www\./, '');
  s = s.split('/')[0].split('?')[0].split('#')[0];
  if (!s.includes('.') || s.includes(' ')) return '';
  return s;
}

// ---------------- Trustpilot Parsers (Zero API Key) ----------------
export function extractTrustpilotFromHtml(html, domain) {
  const out = {
    source: 'trustpilot',
    domain,
    rating: 0,
    reviewCount: 0,
    reviews: [],
    profileUrl: `https://www.trustpilot.com/review/${domain}`
  };
  if (!html || html.length < 80) return out;

  const nextMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nextMatch && nextMatch[1]) {
    try {
      const json = JSON.parse(nextMatch[1]);
      const pp = json?.props?.pageProps || {};
      const bu = pp.businessUnit || {};
      if (bu.trustScore) out.rating = Number(bu.trustScore) || 0;
      if (bu.numberOfReviews) out.reviewCount = Number(bu.numberOfReviews) || 0;
      if (bu.displayName) out.displayName = String(bu.displayName);

      const revs = Array.isArray(pp.reviews) ? pp.reviews : [];
      for (const r of revs.slice(0, 12)) {
        const text = String(r.text || '').trim();
        const title = String(r.title || '').trim();
        if (!text && !title) continue;
        out.reviews.push({
          id: 'tp_' + String(r.id || Math.random().toString(36).slice(2, 8)),
          authorName: String(r.consumer?.displayName || 'مستخدم موثّق'),
          rating: Number(r.rating || 0),
          title,
          text: text || title,
          date: String(r.dates?.publishedDate || r.dates?.experiencedDate || '').slice(0, 10),
          verified: Boolean(r.labels?.verification?.isVerified),
          reply: r.reply?.message ? String(r.reply.message).trim() : '',
          source: 'تقييم موثّق',
          sourceUrl: out.profileUrl
        });
      }
      if (out.reviews.length > 0 || out.rating > 0) return out;
    } catch {}
  }

  const ldMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of ldMatches) {
    try {
      const data = JSON.parse(m[1]);
      const nodes = Array.isArray(data) ? data : (Array.isArray(data['@graph']) ? data['@graph'] : [data]);
      for (const node of nodes) {
        if (node?.aggregateRating) {
          out.rating = out.rating || Number(node.aggregateRating.ratingValue || 0);
          out.reviewCount = out.reviewCount || Number(node.aggregateRating.reviewCount || 0);
        }
        if (node?.['@type'] === 'Review' && (node.reviewBody || node.headline)) {
          out.reviews.push({
            id: 'tpld_' + out.reviews.length,
            authorName: String(node.author?.name || 'عميل'),
            rating: Number(node.reviewRating?.ratingValue || 0),
            title: String(node.headline || ''),
            text: String(node.reviewBody || node.headline || ''),
            date: String(node.datePublished || '').slice(0, 10),
            verified: false,
            reply: '',
            source: 'تقييم موثّق',
            sourceUrl: out.profileUrl
          });
        }
      }
    } catch {}
  }
  return out;
}

export function extractTrustpilotSearchFromHtml(html) {
  const results = [];
  if (!html) return results;
  const nextMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!nextMatch || !nextMatch[1]) return results;
  try {
    const json = JSON.parse(nextMatch[1]);
    const units = json?.props?.pageProps?.businessUnits || [];
    for (const u of units.slice(0, 8)) {
      if (!u.displayName) continue;
      const dom = cleanDomain(u.identifyingName || u.websiteUrl || '');
      results.push({
        id: 'ext_tp_' + (dom || u.businessUnitId || Math.random().toString(36).slice(2, 7)).replace(/[^a-z0-9]/gi, '_'),
        name: String(u.displayName),
        type: 'online',
        governorate: 'أونلاين (كل مصر)',
        branches: [u.location?.city || 'أونلاين'],
        phones: u.contact?.phone ? [String(u.contact.phone)] : [],
        socialUrl: dom ? `https://${dom}` : '',
        domain: dom,
        mapsQuery: `${u.displayName} Egypt`,
        googleRating: Number(u.trustScore || 0),
        googleReviewCount: Number(u.numberOfReviews || 0),
        externalSource: 'trustpilot',
        externalSourceLabel: 'تقييمات موثّقة أونلاين',
        isExternal: true,
        approved: true,
        description: `متجر/منصة مُكتشفة تلقائياً — تقييم ${u.trustScore || '—'}/5 من ${Number(u.numberOfReviews || 0).toLocaleString('en-US')} تقييم حقيقي.`
      });
    }
  } catch {}
  return results;
}

// ---------------- YellowPages Egypt Parser (Zero API Key) ----------------
export function extractYellowPagesEgyptStores(html, gov = 'مصر') {
  const results = [];
  if (!html || html.length < 200) return results;

  // 1) JSON-LD ItemList / LocalBusiness blocks on YellowPages Egypt
  const ldMatches = html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of ldMatches) {
    try {
      const data = JSON.parse(m[1]);
      const items = Array.isArray(data)
        ? data
        : (Array.isArray(data.itemListElement) ? data.itemListElement.map(x => x.item || x) : [data]);
      for (const it of items) {
        if (!it || !it.name) continue;
        const t = String(it['@type'] || '');
        if (!/LocalBusiness|Store|Organization|MobilePhoneStore|ElectronicsStore/i.test(t) && !it.address) continue;
        const addr = typeof it.address === 'string'
          ? it.address
          : [it.address?.streetAddress, it.address?.addressLocality, it.address?.addressRegion].filter(Boolean).join('، ');
        const phone = it.telephone ? String(it.telephone) : '';
        results.push({
          id: 'ext_yp_' + String(it.name).toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, '').slice(0, 18) + '_' + results.length,
          name: String(it.name).trim(),
          type: 'store',
          governorate: gov && gov !== 'الكل' ? gov : 'مصر',
          branches: [addr || (gov !== 'الكل' ? gov : 'مصر')],
          phones: phone ? [phone] : [],
          socialUrl: it.url ? String(it.url) : '',
          domain: cleanDomain(it.sameAs || it.url || ''),
          googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${it.name} ${addr || 'Egypt'}`)}`,
          mapsQuery: `${it.name} ${addr || 'Egypt'}`,
          googleRating: Number(it.aggregateRating?.ratingValue || 0),
          googleReviewCount: Number(it.aggregateRating?.reviewCount || 0),
          externalSource: 'yellowpages_eg',
          externalSourceLabel: 'دليل محلات مصر الحي',
          isExternal: true,
          approved: true,
          description: `محل مسجل في دليل أعمال مصر${addr ? ` — ${addr}` : ''}`
        });
      }
    } catch {}
  }

  // 2) HTML anchor fallback for YellowPages profile cards
  if (results.length === 0) {
    const cardRe = /<a[^>]+href="(\/(?:en|ar)\/profile\/[^"]+)"[^>]*class="[^"]*item-title[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    const seen = new Set();
    while ((m = cardRe.exec(html)) !== null && results.length < 15) {
      const name = stripHtml(m[2]);
      if (!name || name.length < 2 || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      results.push({
        id: 'ext_yp_' + results.length + '_' + Date.now().toString(36).slice(-4),
        name,
        type: 'store',
        governorate: gov && gov !== 'الكل' ? gov : 'مصر',
        branches: [gov && gov !== 'الكل' ? gov : 'مصر'],
        phones: [],
        socialUrl: `https://yellowpages.com.eg${m[1]}`,
        domain: '',
        googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} Egypt`)}`,
        mapsQuery: `${name} Egypt`,
        googleRating: 0,
        googleReviewCount: 0,
        externalSource: 'yellowpages_eg',
        externalSourceLabel: 'دليل محلات مصر الحي',
        isExternal: true,
        approved: true,
        description: `محل موبايلات مسجل في دليل مصر (${gov !== 'الكل' ? gov : 'مصر'}).`
      });
    }
  }
  return results;
}

async function searchYellowPagesEgypt(query, gov) {
  try {
    const q = query ? `${query} mobile` : 'mobiles and accessories';
    const url = `https://yellowpages.com.eg/en/search/${encodeURIComponent(q)}`;
    const res = await httpRequest(url, { timeout: 6500 });
    if (res.status !== 200) return [];
    return extractYellowPagesEgyptStores(res.body, gov);
  } catch {
    return [];
  }
}

// ---------------- Photon + OpenStreetMap Egypt (Zero API Key) ----------------
async function searchPhotonEgypt(query, gov) {
  if (!query || query.trim().length < 2) return [];
  try {
    const coords = EGYPT_GOV_COORDS[gov] || EGYPT_GOV_COORDS['القاهرة'];
    const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&lat=${coords.lat}&lon=${coords.lon}&limit=12`;
    const res = await httpRequest(url, { timeout: 6000 });
    if (res.status !== 200) return [];
    const json = JSON.parse(res.body || '{}');
    const feats = Array.isArray(json.features) ? json.features : [];
    const out = [];
    for (const f of feats) {
      const p = f.properties || {};
      if (p.countrycode && String(p.countrycode).toUpperCase() !== 'EG') continue;
      const name = String(p.name || '').trim();
      if (!name) continue;
      const addr = [p.street, p.district, p.city, p.state].filter(Boolean).join('، ');
      const [lon, lat] = Array.isArray(f.geometry?.coordinates) ? f.geometry.coordinates : [null, null];
      out.push({
        id: 'ext_ph_' + String(p.osm_id || Math.random().toString(36).slice(2, 8)),
        name,
        type: 'store',
        governorate: p.state || p.city || (gov !== 'الكل' ? gov : 'مصر'),
        branches: [addr || 'مصر'],
        phones: [],
        socialUrl: '',
        domain: '',
        googleMapsUri: lat && lon
          ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} Egypt`)}`,
        mapsQuery: `${name} ${addr || 'Egypt'}`,
        googleRating: 0,
        googleReviewCount: 0,
        externalSource: 'osm_egypt',
        externalSourceLabel: 'خريطة محلات مصر الحية',
        isExternal: true,
        approved: true,
        description: `محل / موقع فعلي على خريطة مصر${addr ? ` — ${addr}` : ''}`
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function searchOpenStreetMapEgypt(query, gov) {
  const results = [];
  try {
    if (query && query.trim().length >= 2) {
      const qFull = `${query.trim()} ${gov && gov !== 'الكل' && !gov.includes('أونلاين') ? gov : ''} Egypt`.trim();
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(qFull)}&countrycodes=eg&format=json&addressdetails=1&extratags=1&limit=12&accept-language=ar`;
      const res = await httpRequest(url, { timeout: 6500, userAgent: 'ElzoghbiMarketKorombo/1.0 (+https://elzoghbi.market-h.com)' });
      if (res.status === 200) {
        const arr = JSON.parse(res.body || '[]');
        for (const item of arr) {
          const name = item.namedetails?.['name:ar'] || item.name || (item.display_name || '').split(',')[0].trim();
          if (!name) continue;
          const addr = item.display_name || '';
          const phone = item.extratags?.phone || item.extratags?.['contact:phone'] || '';
          const website = item.extratags?.website || item.extratags?.['contact:website'] || '';
          const city = item.address?.state || item.address?.city || gov || 'مصر';
          results.push({
            id: 'ext_osm_' + String(item.osm_id || Math.random().toString(36).slice(2, 8)),
            name,
            type: 'store',
            governorate: city,
            branches: [addr.split(',').slice(0, 3).join('، ')],
            phones: phone ? [String(phone)] : [],
            socialUrl: String(website || ''),
            domain: cleanDomain(website),
            googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${city} Egypt`)}`,
            mapsQuery: `${name} ${city} Egypt`,
            googleRating: 0,
            googleReviewCount: 0,
            externalSource: 'osm_egypt',
            externalSourceLabel: 'خريطة محلات مصر الحية',
            isExternal: true,
            approved: true,
            description: `محل / موقع فعلي مسجل على الخريطة — ${addr.split(',').slice(0, 3).join('، ')}`
          });
        }
      }
    } else {
      const govObj = EGYPT_GOV_COORDS[gov] || EGYPT_GOV_COORDS['القاهرة'];
      const ovQuery = `[out:json][timeout:7];(node["shop"~"mobile_phone|electronics|telecommunication"]["name"](${govObj.bbox.join(',')});way["shop"~"mobile_phone|electronics"]["name"](${govObj.bbox.join(',')}););out center 22;`;
      const res = await httpRequest('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'data=' + encodeURIComponent(ovQuery),
        timeout: 7500
      });
      if (res.status === 200) {
        const json = JSON.parse(res.body || '{}');
        const seen = new Set();
        for (const el of (json.elements || [])) {
          const tags = el.tags || {};
          const name = tags['name:ar'] || tags.name || tags['name:en'] || '';
          if (!name || seen.has(name.toLowerCase())) continue;
          seen.add(name.toLowerCase());
          const street = [tags['addr:street'], tags['addr:district'], tags['addr:city']].filter(Boolean).join('، ');
          const phone = tags.phone || tags['contact:phone'] || '';
          const website = tags.website || tags['contact:website'] || '';
          const lat = el.lat || el.center?.lat;
          const lon = el.lon || el.center?.lon;
          results.push({
            id: 'ext_osm_' + String(el.id),
            name,
            type: 'store',
            governorate: gov && gov !== 'الكل' ? gov : 'القاهرة',
            branches: [street || (gov && gov !== 'الكل' ? gov : 'القاهرة')],
            phones: phone ? [String(phone)] : [],
            socialUrl: String(website || ''),
            domain: cleanDomain(website),
            googleMapsUri: lat && lon
              ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`
              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${gov || 'مصر'}`)}`,
            mapsQuery: `${name} ${gov || 'Egypt'}`,
            googleRating: 0,
            googleReviewCount: 0,
            externalSource: 'osm_egypt',
            externalSourceLabel: 'خريطة محلات مصر الحية',
            isExternal: true,
            approved: true,
            description: `محل موبايلات وإلكترونيات فعلي على الخريطة${street ? ` — ${street}` : ''}`
          });
        }
      }
    }
  } catch {}
  return results;
}

// ---------------- Reddit Egypt Real Buyer Experiences (Zero API Key) ----------------
export function extractRedditReviews(jsonObj) {
  const out = [];
  const children = jsonObj?.data?.children || [];
  for (const ch of children) {
    const d = ch?.data;
    if (!d || !d.title) continue;
    const body = String(d.selftext || '').trim();
    const text = body ? (body.length > 360 ? body.slice(0, 360) + '...' : body) : String(d.title);
    const created = d.created_utc ? new Date(d.created_utc * 1000).toISOString().slice(0, 10) : '';
    const combined = `${d.title} ${text}`.toLowerCase();
    // Simple sentiment heuristic for rating display (3 to 5 or 1 to 2)
    const isNeg = /(نصب|سيء|مشكلة|مشكله|تعبان|بلاش|احذر|تحذير|تأخير|زبالة|scam|bad|avoid|terrible|worst|broken|fake)/i.test(combined);
    const isPos = /(ممتاز|محترم|كويس|أصلي|مضمون|أنصح|great|good|legit|authentic|recommend|trusted)/i.test(combined);
    const rating = isNeg && !isPos ? 2 : (isPos && !isNeg ? 5 : 4);
    out.push({
      id: 'rd_' + String(d.id || out.length),
      authorName: d.author && d.author !== '[deleted]' ? `مستخدم (${d.author})` : 'مستخدم مصري',
      rating,
      title: String(d.title).slice(0, 140),
      text,
      date: created,
      verified: Number(d.ups || 0) >= 3,
      reply: '',
      source: 'تجربة مستخدم في مصر',
      sourceUrl: d.permalink ? `https://www.reddit.com${d.permalink}` : ''
    });
    if (out.length >= 6) break;
  }
  return out;
}

async function fetchRedditEgyptExperiences(storeName) {
  if (!storeName || storeName.trim().length < 2) return [];
  // Clean parenthetical Arabic/English variants to get crisp search term
  const cleanName = storeName.replace(/\([^)]*\)/g, '').trim();
  const parenMatch = storeName.match(/\(([^)]+)\)/);
  const altName = parenMatch ? parenMatch[1].replace(/Apple Reseller|تقييم عام/gi, '').trim() : '';
  const queryTerm = altName && altName.length >= 2 ? altName : cleanName;

  try {
    const url = `https://www.reddit.com/r/Egypt+PersonalFinanceEgypt+Cairo/search.json?q=${encodeURIComponent(queryTerm)}&restrict_sr=1&sort=relevance&limit=10`;
    const res = await httpRequest(url, {
      timeout: 6500,
      userAgent: 'web:elzoghbi.korombo:v1.0 (by /u/elzoghbi_market)'
    });
    if (res.status !== 200) return [];
    const json = JSON.parse(res.body || '{}');
    return extractRedditReviews(json);
  } catch {
    return [];
  }
}

// ---------------- Trustpilot Live Fetch (Zero API Key) ----------------
async function fetchTrustpilotForDomain(domain, fallbackName = '') {
  let dom = cleanDomain(domain);
  if (!dom && fallbackName) {
    const hits = await searchTrustpilot(fallbackName);
    if (hits.length > 0 && hits[0].domain) dom = hits[0].domain;
  }
  if (!dom) return null;
  try {
    const res = await httpRequest(`https://www.trustpilot.com/review/${encodeURIComponent(dom)}`, { timeout: 7000 });
    if (res.status !== 200) return null;
    const parsed = extractTrustpilotFromHtml(res.body, dom);
    if (parsed.reviews.length > 0 || parsed.rating > 0) return parsed;
  } catch {}
  return null;
}

async function searchTrustpilot(query) {
  if (!query || query.trim().length < 2) return [];
  try {
    const res = await httpRequest(`https://www.trustpilot.com/search?query=${encodeURIComponent(query.trim())}`, { timeout: 6500 });
    if (res.status !== 200) return [];
    return extractTrustpilotSearchFromHtml(res.body);
  } catch {
    return [];
  }
}

// ---------------- DuckDuckGo Public Egyptian Feedback Snippets (Zero API Key) ----------------
async function fetchPublicWebFeedback(storeName) {
  if (!storeName || storeName.trim().length < 2) return [];
  const cleanName = storeName.replace(/\([^)]*\)/g, '').trim();
  try {
    const q = `"${cleanName}" تجربة OR تقييم OR ضمان مصر`;
    const res = await httpRequest(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`, { timeout: 6500 });
    if (res.status !== 200) return [];
    const out = [];
    const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
    let m;
    while ((m = re.exec(res.body)) !== null && out.length < 4) {
      const title = stripHtml(m[2]);
      const snippet = stripHtml(m[3]);
      if (!snippet || snippet.length < 30) continue;
      let href = m[1];
      const uddg = href.match(/uddg=([^&]+)/);
      if (uddg) { try { href = decodeURIComponent(uddg[1]); } catch {} }
      out.push({
        id: 'web_' + out.length + '_' + Date.now().toString(36).slice(-4),
        authorName: 'رأي منشور على الإنترنت',
        rating: 4,
        title: title.slice(0, 110),
        text: snippet.slice(0, 300),
        date: '',
        verified: false,
        reply: '',
        source: 'منصات وتقييمات مصر',
        sourceUrl: href.startsWith('http') ? href : ''
      });
    }
    return out;
  } catch {
    return [];
  }
}

// ---------------- Optional Google Maps Places API (New) — Silent Bonus if Configured ----------------
async function searchGooglePlaces(query, gov, apiKey) {
  if (!apiKey) return [];
  const textQuery = `${query ? query : 'محلات موبايلات'} ${gov && gov !== 'الكل' && !gov.includes('أونلاين') ? gov : ''} مصر`.trim();
  const res = await httpRequest('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.nationalPhoneNumber,places.websiteUri,places.googleMapsUri,places.primaryTypeDisplayName'
    },
    body: JSON.stringify({ textQuery, languageCode: 'ar', regionCode: 'EG', maxResultCount: 16 })
  });
  if (res.status !== 200) return [];
  const json = JSON.parse(res.body || '{}');
  return (Array.isArray(json.places) ? json.places : []).map((p) => ({
    id: 'ext_gp_' + String(p.id || '').replace(/[^a-zA-Z0-9_-]/g, ''),
    googlePlaceId: String(p.id || ''),
    name: String(p.displayName?.text || 'متجر موبايلات'),
    type: 'store',
    governorate: gov && gov !== 'الكل' ? gov : 'مصر',
    branches: p.formattedAddress ? [String(p.formattedAddress)] : ['مصر'],
    phones: p.nationalPhoneNumber ? [String(p.nationalPhoneNumber)] : [],
    socialUrl: String(p.websiteUri || ''),
    domain: cleanDomain(p.websiteUri || ''),
    googleMapsUri: String(p.googleMapsUri || ''),
    mapsQuery: String(p.displayName?.text || '') + ' ' + String(p.formattedAddress || 'Egypt'),
    googleRating: Number(p.rating || 0),
    googleReviewCount: Number(p.userRatingCount || 0),
    externalSource: 'google_maps',
    externalSourceLabel: 'خرائط جوجل (مباشر)',
    isExternal: true,
    approved: true,
    description: `${p.primaryTypeDisplayName?.text || 'متجر موبايلات وإلكترونيات'} — ${p.formattedAddress || 'مصر'}`
  }));
}

async function fetchGooglePlaceDetails(placeId, name, gov, apiKey) {
  if (!apiKey) return null;
  let resolvedId = placeId;
  if (!resolvedId && name) {
    const found = await searchGooglePlaces(name, gov, apiKey);
    if (found.length > 0 && found[0].googlePlaceId) resolvedId = found[0].googlePlaceId;
  }
  if (!resolvedId) return null;

  const res = await httpRequest(`https://places.googleapis.com/v1/places/${encodeURIComponent(resolvedId)}?languageCode=ar`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,rating,userRatingCount,nationalPhoneNumber,websiteUri,googleMapsUri,reviews'
    }
  });
  if (res.status !== 200) return null;
  const p = JSON.parse(res.body || '{}');
  return {
    source: 'google_maps',
    address: String(p.formattedAddress || ''),
    phone: String(p.nationalPhoneNumber || ''),
    website: String(p.websiteUri || ''),
    googleMapsUri: String(p.googleMapsUri || ''),
    rating: Number(p.rating || 0),
    reviewCount: Number(p.userRatingCount || 0),
    reviews: (Array.isArray(p.reviews) ? p.reviews : []).map((r, idx) => ({
      id: 'gprev_' + idx,
      authorName: String(r.authorAttribution?.displayName || 'مستخدم خرائط جوجل'),
      rating: Number(r.rating || 0),
      title: '',
      text: String(r.text?.text || r.originalText?.text || '').trim(),
      date: String(r.relativePublishTimeDescription || String(r.publishTime || '').slice(0, 10)),
      verified: true,
      reply: '',
      source: 'خرائط جوجل',
      sourceUrl: String(p.googleMapsUri || '')
    })).filter(r => r.text || r.rating > 0)
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-google-places-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  const qObj = req.query || {};
  const action = String(qObj.action || 'status');
  const headerKey = req.headers && (req.headers['x-google-places-key'] || req.headers['X-Google-Places-Key']);
  const apiKey = String(process.env.GOOGLE_PLACES_API_KEY || headerKey || qObj.apiKey || '').trim();

  if (action === 'status') {
    return res.status(200).json({
      ok: true,
      zeroKeyMode: true,
      googlePlacesConnected: Boolean(apiKey),
      engines: {
        yellowPagesEgypt: true,
        openStreetMapEgypt: true,
        photonEgypt: true,
        trustpilot: true,
        redditEgypt: true,
        webFeedback: true,
        googleMaps: Boolean(apiKey)
      }
    });
  }

  if (action === 'search') {
    const q = String(qObj.q || '').trim();
    const gov = String(qObj.gov || 'الكل').trim();
    const cacheKey = `search:${q.toLowerCase()}:${gov}:${apiKey ? 'gp' : 'zero'}`;
    const cached = getCache(cacheKey);
    if (cached) return res.status(200).json({ ...cached, cached: true });

    const tasks = [
      searchYellowPagesEgypt(q, gov).catch(() => []),
      searchOpenStreetMapEgypt(q, gov).catch(() => [])
    ];
    if (q.length >= 2) {
      tasks.push(searchPhotonEgypt(q, gov).catch(() => []));
      tasks.push(searchTrustpilot(q).catch(() => []));
    }
    if (apiKey) {
      tasks.unshift(searchGooglePlaces(q, gov, apiKey).catch(() => []));
    }

    const settled = await Promise.all(tasks);
    const merged = [];
    const seenNames = new Set();
    for (const batch of settled) {
      for (const item of (batch || [])) {
        const key = String(item.name || '').trim().toLowerCase();
        if (!key || seenNames.has(key)) continue;
        seenNames.add(key);
        merged.push(item);
      }
    }

    const payload = {
      ok: true,
      zeroKeyMode: true,
      googlePlacesConnected: Boolean(apiKey),
      count: merged.length,
      stores: merged.slice(0, 24)
    };
    setCache(cacheKey, payload);
    return res.status(200).json(payload);
  }

  if (action === 'details') {
    const placeId = String(qObj.placeId || '').trim();
    const domain = cleanDomain(qObj.domain || '');
    const name = String(qObj.name || '').trim();
    const gov = String(qObj.gov || '').trim();

    const cacheKey = `details:${placeId}:${domain}:${name.toLowerCase()}:${apiKey ? 'gp' : 'zero'}`;
    const cached = getCache(cacheKey);
    if (cached) return res.status(200).json({ ...cached, cached: true });

    const [gpData, tpData, redditRevs, webRevs] = await Promise.all([
      apiKey ? fetchGooglePlaceDetails(placeId, name, gov, apiKey).catch(() => null) : Promise.resolve(null),
      fetchTrustpilotForDomain(domain, name).catch(() => null),
      fetchRedditEgyptExperiences(name).catch(() => []),
      fetchPublicWebFeedback(name).catch(() => [])
    ]);

    const externalReviews = [
      ...(gpData?.reviews || []),
      ...(tpData?.reviews || []),
      ...(redditRevs || []),
      ...((gpData?.reviews?.length || 0) + (tpData?.reviews?.length || 0) + (redditRevs?.length || 0) < 3 ? (webRevs || []) : [])
    ];

    const payload = {
      ok: true,
      zeroKeyMode: true,
      googlePlacesConnected: Boolean(apiKey),
      liveRating: gpData?.rating || tpData?.rating || 0,
      liveReviewCount: gpData?.reviewCount || tpData?.reviewCount || externalReviews.length,
      primarySource: gpData ? 'google_maps' : (tpData ? 'trustpilot' : (redditRevs.length ? 'reddit_egypt' : 'web')),
      address: gpData?.address || '',
      phone: gpData?.phone || '',
      website: gpData?.website || (domain ? `https://${domain}` : ''),
      googleMapsUri: gpData?.googleMapsUri || (name ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${gov || 'Egypt'}`)}` : ''),
      trustpilotUrl: tpData?.profileUrl || '',
      externalReviews: externalReviews.slice(0, 14)
    };
    setCache(cacheKey, payload);
    return res.status(200).json(payload);
  }

    if (action === 'scam_check') {
    const q = String(qObj.q || '').trim();
    if (q.length < 3) return res.status(200).json({ ok: true, riskLevel: 'unknown', signals: [], matches: [], advice: '' });

    const cacheKey = `scam:${q.toLowerCase()}`;
    const cached = getCache(cacheKey);
    if (cached) return res.status(200).json({ ...cached, cached: true });

    const isUrl = /facebook\.com|fb\.com|instagram\.com|tiktok\.com|http|www\./i.test(q);
    const digits = q.replace(/\D+/g, '');
    const isPhone = digits.length >= 8;
    const cleanQ = q.replace(/^https?:\/\/(?:www\.|m\.)?/, '').replace(/\/$/, '');

    const [ypHits, tpHits, redditHits, webHits] = await Promise.all([
      searchYellowPagesEgypt(cleanQ, 'الكل').catch(() => []),
      searchTrustpilot(cleanQ).catch(() => []),
      fetchRedditEgyptExperiences(cleanQ).catch(() => []),
      (async () => {
        try {
          const dQ = `"${cleanQ}" نصب OR احتيال OR تحذير OR مضمون OR تجربة مصر`;
          const r = await httpRequest(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(dQ)}`, { timeout: 6000 });
          if (r.status !== 200) return [];
          const out = [];
          const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
          let m;
          while ((m = re.exec(r.body)) !== null && out.length < 6) {
            const title = stripHtml(m[2]);
            const snippet = stripHtml(m[3]);
            if (!snippet) continue;
            let href = m[1];
            const uddg = href.match(/uddg=([^&]+)/);
            if (uddg) { try { href = decodeURIComponent(uddg[1]); } catch {} }
            const txt = `${title} ${snippet}`.toLowerCase();
            const isWarning = /(نصب|نصاب|احتيال|تحذير|بلاش|مضروب|مغشوش|حرامي|scam|fraud|fake)/i.test(txt);
            out.push({ title, snippet, url: href.startsWith('http') ? href : '', isWarning });
          }
          return out;
        } catch { return []; }
      })()
    ]);

    const warningCount = webHits.filter(w => w.isWarning).length + redditHits.filter(r => r.rating <= 2).length;
    const positiveCount = ypHits.length + tpHits.filter(t => t.googleRating >= 3.8).length + redditHits.filter(r => r.rating >= 4).length;

    let riskLevel = 'unknown';
    let advice = 'مفيش بلاغات مسجلة بالاسم أو الرقم ده على الويب المفتوح، لكن دايماً استلم وافحص الجهاز بنفسك قبل دفع أي عربون.';
    if (warningCount >= 1) {
      riskLevel = 'high';
      advice = 'تحذير: ظهرت إشارات أو تجارب سلبية/تحذيرات مرتبطة بالبحث ده على الإنترنت — راجع النتائج تحت كويس وماتحولش أي عربون قبل التأكد.';
    } else if (positiveCount >= 1) {
      riskLevel = 'low';
      advice = 'المتجر أو الرقم ظاهر في أدلة رسمية وتجارب إيجابية — برضه اتأكد إنك بتتعامل مع الحساب الرسمي والفاتورة الضريبية.';
    } else if (isUrl || isPhone) {
      riskLevel = 'medium';
      advice = isUrl
        ? 'الصفحة دي مش مسجلة في الأدلة التجارية الرسمية — افحص تاريخ إنشاء الصفحة وتفاعل التعليقات الحقيقي وماتحولش فودافون كاش أو إنستاباي قبل الاستلام.'
        : 'الرقم ده مش مسجل كخط ساخن رسمي لمتجر معروف — اطلب عنوان فرع حقيقي أو دفع عند الاستلام مع فتح العلبة.';
    }

    const payload = {
      ok: true,
      query: q,
      riskLevel,
      advice,
      warningCount,
      positiveCount,
      storesFound: [...ypHits.slice(0, 4), ...tpHits.slice(0, 3)],
      communitySignals: redditHits.slice(0, 4),
      webSignals: webHits.slice(0, 5)
    };
    setCache(cacheKey, payload);
    return res.status(200).json(payload);
  }

  return res.status(400).json({ ok: false, error: 'Invalid action' });
}
