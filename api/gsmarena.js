/**
 * ELZOGHBI MARKET — GSMArena Live Comparison & Specs API (/api/gsmarena)
 *
 * Powers ALL Karambo ("كرمبو الشغلانة") phone pickers, search, specs & comparisons
 * directly from m.gsmarena.com / www.gsmarena.com in the background.
 *
 * Multi-tier search resilience:
 *  Tier 1: GSMArena official AUTOCOMPLETE_LIST_URL (quicksearch-*.jpg JSON index — 13,000+ phones, cached 12h)
 *  Tier 2: https://www.gsmarena.com/res.php3?sSearch=...
 *  Tier 3: https://m.gsmarena.com/res.php3?sSearch=...
 *  Tier 4: https://m.gsmarena.com/results.php3?sQuickSearch=yes&sName=...
 *
 * Supported actions:
 *  - action=search&q=...         : Live search across GSMArena's full phone database (Arabic & English)
 *  - action=device&slug=...      : Full structured specs + numeric metrics + Arabic labels (supports slug OR numeric id)
 *  - action=compare&slugs=a,b,c  : Parallel fetch of up to 3 devices
 *  - action=popular              : Trending / latest devices from GSMArena
 */

import http from 'node:http';
import https from 'node:https';
import zlib from 'node:zlib';

const ALLOWED_HOSTS = new Set([
  'm.gsmarena.com',
  'www.gsmarena.com',
  'gsmarena.com',
  'fdn2.gsmarena.com',
  'fdn.gsmarena.com'
]);

const MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const TIMEOUT_MS = 9500;
const MAX_BODY_BYTES = 5 * 1024 * 1024; // 5 MB (quicksearch index can be ~1.5 MB)
const MAX_REDIRECTS = 5;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_REQ = 60;

const SEARCH_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
const DEVICE_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours
const INDEX_CACHE_TTL = 12 * 60 * 60 * 1000; // 12 hours
const POPULAR_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

const rateMap = new Map();
const memCache = new Map();

function cacheGet(key) {
  const entry = memCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.exp) {
    memCache.delete(key);
    return null;
  }
  return entry.val;
}

function cacheSet(key, val, ttl) {
  if (memCache.size > 500) {
    const oldest = memCache.keys().next().value;
    if (oldest) memCache.delete(oldest);
  }
  memCache.set(key, { val, exp: Date.now() + ttl });
}

function checkRateLimit(req) {
  const ip =
    String((req.headers && req.headers['x-forwarded-for']) || req.socket?.remoteAddress || 'local')
      .split(',')[0]
      .trim();
  const now = Date.now();
  const bucket = rateMap.get(ip) || { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + RATE_WINDOW_MS;
  }
  bucket.count++;
  rateMap.set(ip, bucket);
  return bucket.count <= RATE_MAX_REQ;
}

// ---------- Arabic -> English Smart Phone Query Translator ----------
const AR_NUM_MAP = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };

const AR_PHONE_DICT = [
  ['ايفون', 'iphone'], ['آيفون', 'iphone'], ['أيفون', 'iphone'], ['ابل', 'apple'], ['آبل', 'apple'],
  ['ايباد', 'ipad'], ['آيباد', 'ipad'], ['سامسونج', 'samsung'], ['سامسونغ', 'samsung'],
  ['جالاكسي', 'galaxy'], ['جالكسي', 'galaxy'], ['جلاكسي', 'galaxy'],
  ['شاومي', 'xiaomi'], ['شياومي', 'xiaomi'], ['ريدمي', 'redmi'], ['بوكو', 'poco'],
  ['اوبو', 'oppo'], ['أوبو', 'oppo'], ['رينو', 'reno'], ['فايند', 'find'],
  ['ريلمي', 'realme'], ['فيفو', 'vivo'], ['ايكو', 'iqoo'], ['هونر', 'honor'], ['ماجيك', 'magic'],
  ['انفنكس', 'infinix'], ['إنفينيكس', 'infinix'], ['انفينكس', 'infinix'], ['هوت', 'hot'], ['زيرو', 'zero'], ['سمارت', 'smart'],
  ['تكنو', 'tecno'], ['سبارك', 'spark'], ['كامون', 'camon'], ['بوفا', 'pova'], ['فانتوم', 'phantom'],
  ['هواوي', 'huawei'], ['نوفا', 'nova'], ['ميت', 'mate'], ['بورا', 'pura'],
  ['جوجل', 'google'], ['بيكسل', 'pixel'], ['ون بلس', 'oneplus'], ['وان بلس', 'oneplus'], ['نورد', 'nord'],
  ['نوثينج', 'nothing'], ['ناثينج', 'nothing'], ['موتورولا', 'motorola'], ['موتو', 'moto'], ['ايدج', 'edge'],
  ['نوكيا', 'nokia'], ['سوني', 'sony'], ['اكسبيريا', 'xperia'], ['اسوس', 'asus'], ['روج', 'rog'], ['زينفون', 'zenfone'],
  ['ايتل', 'itel'], ['آيتل', 'itel'], ['لينوفو', 'lenovo'], ['زد تي اي', 'zte'], ['نوبيا', 'nubia'],
  ['برو ماكس', 'pro max'], ['برو بلس', 'pro plus'], ['برو', 'pro'], ['ماكس', 'max'],
  ['الترا', 'ultra'], ['ألترا', 'ultra'], ['بلس', 'plus'], ['نوت', 'note'],
  ['ميني', 'mini'], ['لايت', 'lite'], ['نيو', 'neo'], ['تيربو', 'turbo'],
  ['فولد', 'fold'], ['فليب', 'flip'], ['تاب', 'tab'], ['باد', 'pad'],
  ['اف اي', 'fe'], ['إف إي', 'fe'], ['اس اي', 'se'], ['إس إي', 'se'],
  ['جي تي', 'gt'], ['فايف جي', '5g'], ['فور جي', '4g'],
  ['اس', 's'], ['إس', 's'], ['ايه', 'a'], ['إيه', 'a'], ['ام', 'm'], ['اف', 'f'], ['زد', 'z'], ['سي', 'c'], ['تي', 't'], ['اكس', 'x']
];

export function translateArabicPhoneQuery(raw) {
  let q = String(raw || '').trim();
  if (!q) return '';
  q = q.replace(/[٠-٩]/g, d => AR_NUM_MAP[d] || d);
  q = q.replace(/[\u064B-\u065F\u0670]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
  if (/[\u0600-\u06FF]/.test(q)) {
    for (const [ar, en] of AR_PHONE_DICT) {
      const arNorm = ar.replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه');
      const re = new RegExp(`(^|\\s)${arNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$|\\d)`, 'g');
      q = q.replace(re, `$1${en}`);
    }
    if (/[a-zA-Z0-9]/.test(q)) {
      q = q.replace(/[\u0600-\u06FF]+/g, ' ');
    }
  }
  q = q.replace(/\b([samfzctx])\s+(\d{1,3})\b/gi, '$1$2');
  return q.replace(/\s+/g, ' ').trim();
}

// ---------- HTML Helpers ----------
function decodeEntities(str) {
  const once = (x) => String(x || '')
    .replace(/&nbsp;|&thinsp;|&hairsp;|&ensp;|&emsp;/gi, ' ')
    .replace(/&ndash;/gi, '-')
    .replace(/&mdash;/gi, '-')
    .replace(/&euro;/gi, '€')
    .replace(/&pound;/gi, '£')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
  // Run twice: the source page sometimes double-escapes (e.g. "&amp;thinsp;").
  return once(once(str));
}

function stripTags(html) {
  return decodeEntities(
    String(html || '')
      .replace(/<br\s*\/?>/gi, ' | ')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s*\|\s*/g, ' · ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeImageUrl(src) {
  if (!src) return '';
  let u = String(src).trim();
  if (u.startsWith('//')) u = 'https:' + u;
  else if (u.startsWith('/')) u = 'https://fdn2.gsmarena.com' + u;
  else if (!/^https?:\/\//i.test(u)) u = 'https://fdn2.gsmarena.com/vv/bigpic/' + u;
  return u;
}

// ---------- Safe HTTP Fetch (strict GSMArena allowlist) ----------
function fetchGsmarenaHtml(targetUrl, useMobile = true, redirectsLeft = MAX_REDIRECTS) {
  return new Promise((resolve, reject) => {
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch {
      return reject(new Error('رابط غير صالح'));
    }
    if (!ALLOWED_HOSTS.has(parsed.hostname)) {
      return reject(new Error('النطاق غير مسموح به'));
    }
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: 'GET',
        family: 4,
        timeout: TIMEOUT_MS,
        headers: {
          'User-Agent': useMobile ? MOBILE_UA : DESKTOP_UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': useMobile ? 'https://m.gsmarena.com/' : 'https://www.gsmarena.com/',
          'Cache-Control': 'no-cache'
        }
      },
      (res) => {
        const status = res.statusCode || 0;
        if (status >= 300 && status < 400 && res.headers.location && redirectsLeft > 0) {
          res.resume();
          const nextUrl = new URL(res.headers.location, parsed).toString();
          return fetchGsmarenaHtml(nextUrl, useMobile, redirectsLeft - 1).then(resolve, reject);
        }
        const chunks = [];
        let total = 0;
        let stream = res;
        const enc = String(res.headers['content-encoding'] || '').toLowerCase();
        if (enc === 'gzip') stream = res.pipe(zlib.createGunzip());
        else if (enc === 'deflate') stream = res.pipe(zlib.createInflate());
        else if (enc === 'br' && zlib.createBrotliDecompress) stream = res.pipe(zlib.createBrotliDecompress());

        stream.on('data', (chunk) => {
          total += chunk.length;
          if (total <= MAX_BODY_BYTES) chunks.push(chunk);
          else res.destroy();
        });
        stream.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({ status, html: body, finalUrl: parsed.toString() });
        });
        stream.on('error', reject);
      }
    );
    req.on('timeout', () => {
      req.destroy(new Error('انتهى وقت الاتصال بقاعدة بيانات المواصفات'));
    });
    req.on('error', reject);
    req.end();
  });
}

// ---------- Tier 1: GSMArena Official Quicksearch JSON Index (13,000+ phones!) ----------
export function parseQuicksearchIndex(rawJsonText) {
  try {
    const data = JSON.parse(String(rawJsonText || ''));
    if (!Array.isArray(data) || data.length < 2) return [];
    const makers = data[0] || {};
    const phones = Array.isArray(data[1]) ? data[1] : [];
    const out = [];
    for (const row of phones) {
      if (!Array.isArray(row) || row.length < 3) continue;
      const brandId = row[0];
      const phoneId = String(row[1] || '').trim();
      const modelName = String(row[2] || '').trim();
      const extraSearch = String(row[3] || '').trim();
      const imgFile = String(row[4] || '').trim();
      if (!phoneId || !modelName) continue;
      const brandName = String(makers[brandId] || '').trim();
      const fullName = brandName && !modelName.toLowerCase().startsWith(brandName.toLowerCase())
        ? `${brandName} ${modelName}`
        : modelName;
      const slugBase = fullName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      const slug = `${slugBase}-${phoneId}`;
      out.push({
        id: `gsm_${phoneId}`,
        gsmId: phoneId,
        slug,
        name: fullName,
        brand: brandName || fullName.split(' ')[0] || '',
        img: imgFile ? normalizeImageUrl(imgFile) : '',
        url: `https://m.gsmarena.com/${slug}.php`,
        searchKey: `${fullName} ${extraSearch}`.toLowerCase(),
        source: 'gsmarena'
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function getQuicksearchIndex() {
  const cached = cacheGet('gsm:quicksearch_index');
  if (cached) return cached;

  // Discover AUTOCOMPLETE_LIST_URL from desktop or mobile homepage
  let homeHtml = '';
  try {
    const r1 = await fetchGsmarenaHtml('https://www.gsmarena.com/', false);
    if (r1.status === 200) homeHtml = r1.html;
  } catch {}
  if (!homeHtml) {
    try {
      const r2 = await fetchGsmarenaHtml('https://m.gsmarena.com/', true);
      if (r2.status === 200) homeHtml = r2.html;
    } catch {}
  }
  if (!homeHtml) return null;

  const urlMatch =
    homeHtml.match(/AUTOCOMPLETE_LIST_URL\s*=\s*["']([^"']+)["']/i) ||
    homeHtml.match(/["']([^"']*quicksearch-[^"']+\.(?:jpg|json))["']/i);
  if (!urlMatch || !urlMatch[1]) return null;

  const idxUrl = new URL(urlMatch[1], 'https://www.gsmarena.com/').toString();
  const idxRes = await fetchGsmarenaHtml(idxUrl, false);
  if (idxRes.status !== 200 || !idxRes.html) return null;

  const parsed = parseQuicksearchIndex(idxRes.html);
  if (parsed.length > 100) {
    cacheSet('gsm:quicksearch_index', parsed, INDEX_CACHE_TTL);
    return parsed;
  }
  return null;
}

function searchInQuicksearchIndex(index, enQuery) {
  const words = String(enQuery || '').toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const matches = [];
  for (let i = 0; i < index.length; i++) {
    const item = index[i];
    let ok = true;
    for (let w = 0; w < words.length; w++) {
      if (!item.searchKey.includes(words[w])) { ok = false; break; }
    }
    if (ok) {
      // Score higher if newer (larger numeric gsmId) or exact prefix match
      const starts = item.name.toLowerCase().startsWith(enQuery.toLowerCase()) ? 1 : 0;
      matches.push({ item, starts, numId: parseInt(item.gsmId, 10) || 0 });
    }
  }
  matches.sort((a, b) => (b.starts - a.starts) || (b.numId - a.numId));
  return matches.slice(0, 24).map(({ item }) => {
    const { searchKey, ...clean } = item;
    return clean;
  });
}

// ---------- HTML Parsers (exported for unit testing) ----------
export function parseGsmarenaSearchHtml(html) {
  const results = [];
  const seen = new Set();
  const src = String(html || '');

  // Pattern 1: <li><a href="..."><img ...><strong><span>...</span></strong></a></li>
  const liRegex = /<li[^>]*>\s*<a[^>]+href=["']([^"']+?-\d+\.php)["'][^>]*>([\s\S]*?)<\/a>\s*<\/li>/gi;
  let m;
  while ((m = liRegex.exec(src)) !== null) {
    const href = m[1].trim();
    const inner = m[2];
    const slugMatch = href.match(/([a-z0-9_.-]+-(\d+))\.php$/i);
    if (!slugMatch) continue;
    const slug = slugMatch[1];
    const numericId = slugMatch[2];
    if (seen.has(slug)) continue;
    seen.add(slug);

    const imgMatch = inner.match(/<img[^>]+(?:data-src|src)=["']([^"']+)["']/i);
    const img = imgMatch ? normalizeImageUrl(imgMatch[1]) : '';
    const titleMatch =
      inner.match(/<strong>([\s\S]*?)<\/strong>/i) ||
      inner.match(/<span>([\s\S]*?)<\/span>/i) ||
      inner.match(/title=["']([^"']+)["']/i);
    let name = titleMatch ? stripTags(titleMatch[1]).replace(/\s*·\s*/g, ' ') : '';
    if (!name) {
      name = slug.replace(/-\d+$/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }
    const brand = name.split(' ')[0] || '';
    results.push({
      id: `gsm_${numericId}`,
      gsmId: numericId,
      slug,
      name,
      brand,
      img,
      url: `https://m.gsmarena.com/${slug}.php`,
      source: 'gsmarena'
    });
    if (results.length >= 24) break;
  }

  // Pattern 2: Generic anchors matching phone slug pattern (e.g. mobile cards / div layouts)
  if (results.length === 0) {
    const aRegex = /<a[^>]+href=["'](?:https?:\/\/(?:m|www)\.gsmarena\.com\/)?([a-z0-9_]+-(\d+))\.php["'][^>]*>([\s\S]*?)<\/a>/gi;
    while ((m = aRegex.exec(src)) !== null) {
      const slug = m[1];
      const numericId = m[2];
      const inner = m[3];
      if (seen.has(slug) || /^(news|review|glossary|compare|makers|deals|rumored|piccmp)/i.test(slug)) continue;
      const imgMatch = inner.match(/<img[^>]+(?:data-src|src)=["']([^"']+)["']/i);
      const text = stripTags(inner).replace(/\s*·\s*/g, ' ');
      if (!text || text.length < 3 || text.length > 90) continue;
      seen.add(slug);
      results.push({
        id: `gsm_${numericId}`,
        gsmId: numericId,
        slug,
        name: text,
        brand: text.split(' ')[0] || '',
        img: imgMatch ? normalizeImageUrl(imgMatch[1]) : '',
        url: `https://m.gsmarena.com/${slug}.php`,
        source: 'gsmarena'
      });
      if (results.length >= 24) break;
    }
  }

  return results;
}

const GROUP_AR_MAP = {
  network: 'الشبكات والاتصال',
  launch: 'الإعلان والتوفر',
  body: 'التصميم والأبعاد',
  display: 'الشاشة',
  platform: 'المعالج والنظام',
  memory: 'الذاكرة والتخزين',
  'main camera': 'الكاميرا الخلفية',
  'selfie camera': 'الكاميرا الأمامية',
  sound: 'الصوت',
  comms: 'الاتصالات والمنافذ',
  features: 'المميزات والمستشعرات',
  battery: 'البطارية والشحن',
  misc: 'معلومات إضافية',
  tests: 'اختبارات الأداء'
};

const SPEC_KEY_AR_MAP = {
  technology: 'التقنية',
  announced: 'تاريخ الإعلان',
  status: 'حالة التوفر',
  dimensions: 'الأبعاد',
  weight: 'الوزن',
  build: 'خامات التصنيع',
  sim: 'الشرائح',
  type: 'النوع',
  size: 'الحجم',
  resolution: 'الدقة',
  protection: 'طبقة الحماية',
  os: 'نظام التشغيل',
  chipset: 'المعالج (Chipset)',
  cpu: 'وحدة المعالجة (CPU)',
  gpu: 'معالج الرسوميات (GPU)',
  'card slot': 'كارت الميموري',
  internal: 'التخزين والرام',
  single: 'عدسة أحادية',
  dual: 'عدسة ثنائية',
  triple: 'كاميرا ثلاثية',
  quad: 'كاميرا رباعية',
  features: 'المميزات',
  video: 'تصوير الفيديو',
  loudspeaker: 'السماعات الخارجية',
  '3.5mm jack': 'منفذ 3.5 ملم',
  wlan: 'الواي فاي',
  bluetooth: 'البلوتوث',
  positioning: 'تحديد المواقع (GPS)',
  nfc: 'NFC',
  'infrared port': 'منفذ IR',
  radio: 'الراديو',
  usb: 'منفذ الشحن (USB)',
  sensors: 'المستشعرات',
  charging: 'الشحن السريع',
  colors: 'الألوان',
  models: 'أرقام الموديل',
  price: 'السعر العالمي الاسترشادي'
};

const firstNum = (s) => {
  const m = String(s || '').replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : null;
};

export function parseGsmarenaDeviceHtml(html, slug = '') {
  const src = String(html || '');
  const numericMatch = String(slug).match(/-(\d+)$/);
  const gsmId = numericMatch ? numericMatch[1] : String(slug || '').replace(/\D+/g, '') || Date.now().toString();

  const titleMatch =
    src.match(/<h1[^>]*class=["'][^"']*specs-phone-name-title[^"']*["'][^>]*>([\s\S]*?)<\/h1>/i) ||
    src.match(/<h1[^>]*data-spec=["']modelname["'][^>]*>([\s\S]*?)<\/h1>/i) ||
    src.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
    src.match(/<title>([\s\S]*?)<\/title>/i);
  let name = titleMatch ? stripTags(titleMatch[1]).replace(/\s*-\s*Full phone specifications.*$/i, '').replace(/\s*-\s*GSMArena\.com.*$/i, '').trim() : '';
  if (!name) {
    name = slug.replace(/-\d+$/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  const ogImg = src.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const photoMain = src.match(/<div[^>]+class=["'][^"']*specs-photo-main[^"']*["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
  const img = normalizeImageUrl((photoMain && photoMain[1]) || (ogImg && ogImg[1]) || '');

  const specsListMatch = src.match(/<div[^>]+id=["']specs-list["'][^>]*>([\s\S]*?)(?:<div[^>]+class=["'][^"']*note[^"']*["']|<p[^>]+class=["']note|<\/section>|$)/i);
  const specsHtml = specsListMatch ? specsListMatch[1] : src;

  const specs = [];
  const flatEn = {};
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tm;
  while ((tm = tableRegex.exec(specsHtml)) !== null) {
    const tbl = tm[1];
    const thMatch = tbl.match(/<th[^>]*>([\s\S]*?)<\/th>/i);
    if (!thMatch) continue;
    const rawGroup = stripTags(thMatch[1]).trim();
    if (!rawGroup) continue;
    const groupKey = rawGroup.toLowerCase();
    const groupAr = GROUP_AR_MAP[groupKey] || rawGroup;

    const rows = [];
    const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rm;
    while ((rm = trRegex.exec(tbl)) !== null) {
      const tr = rm[1];
      const ttlMatch = tr.match(/<td[^>]+class=["'][^"']*ttl[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
      const nfoMatch = tr.match(/<td[^>]+class=["'][^"']*nfo[^"']*["'][^>]*>([\s\S]*?)<\/td>/i);
      if (!nfoMatch) continue;
      const rawKey = ttlMatch ? stripTags(ttlMatch[1]).trim() : '';
      const val = stripTags(nfoMatch[1]).trim();
      if (!val) continue;
      const keyClean = rawKey || (rows.length > 0 ? 'تفاصيل إضافية' : groupAr);
      const keyAr = SPEC_KEY_AR_MAP[keyClean.toLowerCase()] || keyClean;
      rows.push([keyAr, val]);
      flatEn[`${groupKey}.${keyClean.toLowerCase()}`] = val;
      if (!flatEn[keyClean.toLowerCase()]) flatEn[keyClean.toLowerCase()] = val;
    }
    if (rows.length > 0) {
      specs.push({ group: groupAr, groupEn: rawGroup, rows });
    }
  }

  const dispSizeStr = flatEn['display.size'] || '';
  const dispTypeStr = flatEn['display.type'] || '';
  const weightStr = flatEn['body.weight'] || '';
  const batTypeStr = flatEn['battery.type'] || '';
  const batChargeStr = flatEn['battery.charging'] || '';
  const memInternalStr = flatEn['memory.internal'] || '';
  const mainCamStr =
    flatEn['main camera.quad'] ||
    flatEn['main camera.triple'] ||
    flatEn['main camera.dual'] ||
    flatEn['main camera.single'] ||
    '';
  const selfieCamStr =
    flatEn['selfie camera.dual'] ||
    flatEn['selfie camera.single'] ||
    '';
  const chipsetStr = flatEn['platform.chipset'] || '';
  const osStr = flatEn['platform.os'] || '';
  const bodyOther = Object.entries(flatEn).filter(([k]) => k.startsWith('body.')).map(([, v]) => v).join(' ');
  const ipMatch = bodyOther.match(/IP\d{2}[A-Z]?/i);
  const netStr = flatEn['network.technology'] || '';
  const usbStr = flatEn['comms.usb'] || '';
  const simStr = flatEn['body.sim'] || '';
  const priceStr = flatEn['misc.price'] || '';
  const announcedStr = flatEn['launch.announced'] || '';

  const screen = firstNum((dispSizeStr.match(/(\d+(?:\.\d+)?)\s*inches/i) || [])[1] || dispSizeStr);
  const refreshMatch = dispTypeStr.match(/(\d{2,3})\s*Hz/i);
  const refresh = refreshMatch ? parseInt(refreshMatch[1], 10) : null;
  const batteryMatch = batTypeStr.match(/(\d{4,5})\s*mAh/i);
  const battery = batteryMatch ? parseInt(batteryMatch[1], 10) : null;
  const chargeMatches = [...batChargeStr.matchAll(/(\d{1,3}(?:\.\d+)?)\s*W\b/gi)].map(x => parseFloat(x[1]));
  const chargeW = chargeMatches.length ? Math.max(...chargeMatches) : null;
  const camMatches = [...mainCamStr.matchAll(/(\d{1,3})\s*MP/gi)].map(x => parseInt(x[1], 10));
  const camera = camMatches.length ? Math.max(...camMatches) : null;
  const selfieMatches = [...selfieCamStr.matchAll(/(\d{1,3})\s*MP/gi)].map(x => parseInt(x[1], 10));
  const selfieCamera = selfieMatches.length ? Math.max(...selfieMatches) : null;
  const weightMatch = weightStr.match(/(\d{2,3}(?:\.\d+)?)\s*g/i);
  const weight = weightMatch ? Math.round(parseFloat(weightMatch[1])) : null;
  const ramMatches = [...memInternalStr.matchAll(/(\d{1,2})\s*GB\s*RAM/gi)].map(x => parseInt(x[1], 10));
  const ramMax = ramMatches.length ? Math.max(...ramMatches) : null;
  const tbMatches = [...memInternalStr.matchAll(/(\d)\s*TB/gi)].map(x => parseInt(x[1], 10) * 1024);
  const gbStorageMatches = [...memInternalStr.matchAll(/(\d{2,4})\s*GB(?!\s*RAM)/gi)].map(x => parseInt(x[1], 10));
  const storageMax = [...tbMatches, ...gbStorageMatches].length ? Math.max(...tbMatches, ...gbStorageMatches) : null;

  const brand = name.split(' ')[0] || '';
  const brandSlug = brand.toLowerCase();

  return {
    id: `gsm_${gsmId}`,
    gsmId,
    slug: slug || `phone-${gsmId}`,
    name,
    brand,
    brandSlug,
    images: img ? [img] : [],
    specs,
    screen,
    refresh,
    displayType: dispTypeStr,
    camera,
    selfieCamera,
    battery,
    chargeW,
    weight,
    ramMax,
    storageMax,
    chipset: chipsetStr,
    os: osStr,
    ip: ipMatch ? ipMatch[0].toUpperCase() : '',
    sim: simStr,
    usb: usbStr,
    has5G: /5G/i.test(netStr),
    announced: announcedStr,
    priceGlobal: priceStr,
    price: 0,
    source: 'gsmarena',
    sourceUrl: `https://m.gsmarena.com/${slug}.php`
  };
}

async function fetchDeviceDetail(slugOrId) {
  let clean = String(slugOrId || '').trim().replace(/\.php$/i, '').replace(/^https?:\/\/[^/]+\//i, '');
  if (/^\d+$/.test(clean)) clean = `phone-${clean}`;
  if (!clean || !/^[a-z0-9_.-]+$/i.test(clean)) {
    throw new Error('معرّف الجهاز غير صالح');
  }
  const cacheKey = `device:${clean}`;
  const cached = cacheGet(cacheKey);
  if (cached) return { ...cached, cached: true };

  // Try desktop first (most consistent #specs-list), then mobile
  let resp = await fetchGsmarenaHtml(`https://www.gsmarena.com/${clean}.php`, false);
  if (resp.status !== 200 || !resp.html.includes('specs-list')) {
    resp = await fetchGsmarenaHtml(`https://m.gsmarena.com/${clean}.php`, true);
  }
  if (resp.status === 429) {
    throw new Error('قاعدة بيانات المواصفات مشغولة مؤقتاً — جرّب بعد لحظات.');
  }
  if (resp.status !== 200) {
    throw new Error(`تعذر جلب مواصفات الجهاز (${resp.status})`);
  }
  // Resolve final canonical slug if GSMArena redirected (e.g. phone-13322.php -> samsung_galaxy_s25_ultra-13322.php)
  const finalSlugMatch = String(resp.finalUrl || '').match(/\/([a-z0-9_.-]+-\d+)\.php$/i);
  const finalSlug = finalSlugMatch ? finalSlugMatch[1] : clean;

  const parsed = parseGsmarenaDeviceHtml(resp.html, finalSlug);
  if (!parsed.specs.length) {
    throw new Error('لم يتم العثور على جدول المواصفات لهذا الجهاز');
  }
  cacheSet(cacheKey, parsed, DEVICE_CACHE_TTL);
  return parsed;
}

// ---------- Featured ordering for the guide's first page ----------
const NON_PHONE_RE = /\b(watch|band|pad|tab|tablet|buds|airpods|fit|ring|glasses|earbuds|ipad|pencil|vision|speaker|tv|laptop)\b/i;
const MIDRANGE_RULES = [
  { brand: 'samsung', re: /galaxy\s+(a\d{2}|m\d{2}|f\d{2}|s\d{2}\s+fe)\b/i },
  { brand: 'xiaomi', re: /(redmi\s+(note\s+)?\d+|poco\s+[xmf]\d+|xiaomi\s+\d+[a-z]?\s*(lite)?)/i },
  { brand: 'oppo', re: /oppo\s+(reno\s*\d+|a\d+)/i },
  { brand: 'realme', re: /realme\s+(\d+|note|c\d+|gt)/i },
  { brand: 'honor', re: /honor\s+(x\d+|\d{2,3}\b|play|90|200|400)/i },
  { brand: 'infinix', re: /infinix\s+(note|hot|zero|smart|gt)/i },
  { brand: 'tecno', re: /tecno\s+(spark|camon|pova|phantom)/i },
  { brand: 'vivo', re: /vivo\s+(y\d+|v\d+|t\d+)/i }
];

function featuredOrder(list) {
  const phones = list.filter(it => !NON_PHONE_RE.test(it.name || '') && !/\((china|india|japan|korea|vietnam|taiwan|russia|indonesia|brazil)/i.test(it.name || '') && !/\b(refresh|hd)\b/i.test(it.name || '') && !/\b(pro\s*max\s*mini)\b/i.test(it.name || ''));
  const maxId = Math.max(...phones.map(p => parseInt(p.gsmId, 10) || 0), 0);
  const recent = phones.filter(p => (parseInt(p.gsmId, 10) || 0) >= maxId - 2600);
  const iphones = phones.filter(p => /^apple iphone/i.test(p.name || '') && !/\bse\b|\bmini\b/i.test(p.name || ''));
  const topIphones = iphones.slice(0, 8);
  const topSet = new Set(topIphones.map(p => p.id));

  // Mid-range Android, interleaved by brand so the page is varied (newest first inside each brand)
  const buckets = MIDRANGE_RULES.map(rule => recent.filter(p => (p.brand || '').toLowerCase() === rule.brand && rule.re.test(p.name || '') && !/\b(ultra|fold|flip|pro\+|magic)\b/i.test(p.name || '')));
  const mid = [];
  for (let i = 0; i < 6; i++) buckets.forEach(b => { if (b[i]) mid.push(b[i]); });
  const midSet = new Set(mid.map(p => p.id));

  const rest = phones.filter(p => !topSet.has(p.id) && !midSet.has(p.id));
  // remaining Apple + flagship first, then everything else by recency
  const restApple = rest.filter(p => /^apple iphone/i.test(p.name || ''));
  const restOther = rest.filter(p => !/^apple iphone/i.test(p.name || ''));
  return [...topIphones, ...mid, ...restApple.slice(0, 12), ...restOther, ...restApple.slice(12)];
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!checkRateLimit(req)) {
    return res.status(429).json({ ok: false, error: 'تم تجاوز عدد الطلبات المسموح به في الدقيقة — انتظر قليلاً.' });
  }

  const action = String(req.query?.action || req.body?.action || '').trim().toLowerCase();

  try {
    // 1. LIVE SEARCH (4-tier cascade: Quicksearch Index -> Desktop res.php3 -> Mobile res.php3 -> Mobile results.php3)
    if (action === 'search') {
      const rawQ = String(req.query?.q || req.body?.q || '').trim();
      if (rawQ.length < 2) {
        return res.status(200).json({ ok: true, query: rawQ, translatedQuery: rawQ, results: [] });
      }
      const enQ = translateArabicPhoneQuery(rawQ);
      const cacheKey = `search:${enQ.toLowerCase()}`;
      const cached = cacheGet(cacheKey);
      if (cached) {
        return res.status(200).json({ ok: true, query: rawQ, translatedQuery: enQ, results: cached, cached: true, source: 'gsmarena' });
      }

      let results = [];
      let strategy = '';
      let lastStatus = 200;

      // Tier 1: Official GSMArena Quicksearch JSON index (13,000+ phones, fast & zero per-query rate limit!)
      try {
        const idx = await getQuicksearchIndex();
        if (idx && idx.length > 0) {
          results = searchInQuicksearchIndex(idx, enQ);
          strategy = 'quicksearch_index';
        }
      } catch {}

      // Tier 2: Desktop res.php3
      if (results.length === 0) {
        try {
          const r2 = await fetchGsmarenaHtml(`https://www.gsmarena.com/res.php3?sSearch=${encodeURIComponent(enQ)}`, false);
          lastStatus = r2.status;
          if (r2.status === 200) {
            results = parseGsmarenaSearchHtml(r2.html);
            if (results.length) strategy = 'desktop_res';
          }
        } catch {}
      }

      // Tier 3: Mobile res.php3
      if (results.length === 0) {
        try {
          const r3 = await fetchGsmarenaHtml(`https://m.gsmarena.com/res.php3?sSearch=${encodeURIComponent(enQ)}`, true);
          lastStatus = r3.status;
          if (r3.status === 200) {
            results = parseGsmarenaSearchHtml(r3.html);
            if (results.length) strategy = 'mobile_res';
          }
        } catch {}
      }

      // Tier 4: Mobile quick results.php3
      if (results.length === 0) {
        try {
          const r4 = await fetchGsmarenaHtml(`https://m.gsmarena.com/results.php3?sQuickSearch=yes&sName=${encodeURIComponent(enQ)}`, true);
          lastStatus = r4.status;
          if (r4.status === 200) {
            results = parseGsmarenaSearchHtml(r4.html);
            if (results.length) strategy = 'mobile_results';
          }
        } catch {}
      }

      if (results.length === 0 && lastStatus === 429) {
        return res.status(200).json({ ok: false, rateLimited: true, error: 'قاعدة بيانات الأجهزة مشغولة مؤقتاً — جرّب بعد لحظات.' });
      }
      if (results.length > 0) cacheSet(cacheKey, results, SEARCH_CACHE_TTL);
      return res.status(200).json({ ok: true, query: rawQ, translatedQuery: enQ, results, strategy, source: 'gsmarena' });
    }

    // 2. SINGLE DEVICE SPECS (supports slug or numeric id)
    if (action === 'device') {
      const slug = String(req.query?.slug || req.body?.slug || req.query?.id || req.body?.id || '').trim();
      const device = await fetchDeviceDetail(slug);
      return res.status(200).json({ ok: true, device, source: 'gsmarena' });
    }

    // 3. COMPARE UP TO 3 DEVICES
    if (action === 'compare') {
      const rawSlugs = String(req.query?.slugs || req.body?.slugs || '').trim();
      const slugs = rawSlugs.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3);
      if (slugs.length === 0) {
        return res.status(400).json({ ok: false, error: 'أرسل جهازاً واحداً على الأقل للمقارنة.' });
      }
      const settled = await Promise.allSettled(slugs.map(s => fetchDeviceDetail(s)));
      const devices = settled.filter(r => r.status === 'fulfilled').map(r => r.value);
      const errors = settled.filter(r => r.status === 'rejected').map(r => r.reason?.message || 'خطأ غير معروف');
      return res.status(200).json({ ok: devices.length > 0, devices, errors, source: 'gsmarena' });
    }

    // 3b. FULL GLOBAL CATALOG BROWSE (brand + query + pagination from 13,000+ phone index)
    if (action === 'catalog') {
      const brand = String(req.query?.brand || '').trim().toLowerCase();
      const rawQ = String(req.query?.q || '').trim();
      const enQ = rawQ ? translateArabicPhoneQuery(rawQ).toLowerCase() : '';
      const page = Math.max(1, parseInt(req.query?.page || '1', 10) || 1);
      const limit = Math.min(36, Math.max(8, parseInt(req.query?.limit || '24', 10) || 24));

      const idx = await getQuicksearchIndex();
      if (!idx || idx.length === 0) {
        return res.status(200).json({ ok: false, results: [], total: 0, brands: [] });
      }
      // Compute top brands list
      const brandCounts = new Map();
      for (const it of idx) {
        if (it.brand) brandCounts.set(it.brand, (brandCounts.get(it.brand) || 0) + 1);
      }
      const topBrands = [...brandCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 24)
        .map(([b]) => b);

      let list = idx;
      if (brand && brand !== 'all') {
        list = list.filter(it => (it.brand || '').toLowerCase() === brand);
      }
      if (enQ) {
        const words = enQ.split(/\s+/).filter(Boolean);
        list = list.filter(it => words.every(w => it.searchKey.includes(w)));
      }
      // Sort newest first (highest numeric ID)
      let sorted = [...list].sort((a, b) => (parseInt(b.gsmId, 10) || 0) - (parseInt(a.gsmId, 10) || 0));
      // Default storefront view: iPhones first, then the mid-range Android phones people actually buy in Egypt.
      // (Newest-ID order surfaced obscure rugged phones / watches that have no Egyptian price at all.)
      if ((!brand || brand === 'all') && !enQ) sorted = featuredOrder(sorted);
      const total = sorted.length;
      const start = (page - 1) * limit;
      const slice = sorted.slice(start, start + limit).map(({ searchKey, ...clean }) => clean);

      return res.status(200).json({
        ok: true,
        results: slice,
        total,
        page,
        hasMore: start + limit < total,
        brands: topBrands
      });
    }

    // 4. POPULAR / LATEST DEVICES
    if (action === 'popular') {
      const cached = cacheGet('popular:home');
      if (cached) return res.status(200).json({ ok: true, results: cached, cached: true, source: 'gsmarena' });

      let results = [];
      // Try quicksearch index newest devices first (super fast & reliable!)
      try {
        const idx = await getQuicksearchIndex();
        if (idx && idx.length > 0) {
          results = [...idx]
            .sort((a, b) => (parseInt(b.gsmId, 10) || 0) - (parseInt(a.gsmId, 10) || 0))
            .slice(0, 16)
            .map(({ searchKey, ...clean }) => clean);
        }
      } catch {}

      if (results.length === 0) {
        try {
          const resp = await fetchGsmarenaHtml('https://m.gsmarena.com/', true);
          if (resp.status === 200) results = parseGsmarenaSearchHtml(resp.html).slice(0, 16);
        } catch {}
      }

      if (results.length > 0) cacheSet('popular:home', results, POPULAR_CACHE_TTL);
      return res.status(200).json({ ok: results.length > 0, results, source: 'gsmarena' });
    }

    return res.status(400).json({ ok: false, error: 'العملية غير مدعومة. استخدم search أو device أو compare أو popular.' });
  } catch (err) {
    return res.status(200).json({ ok: false, error: err?.message || 'حدث خطأ أثناء جلب بيانات الأجهزة.' });
  }
}
