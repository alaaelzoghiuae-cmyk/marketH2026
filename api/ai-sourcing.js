/**
 * ELZOGHBI MARKET — AI Product Sourcing Serverless API (/api/ai-sourcing)
 *
 * Compliant, SSRF-hardened backend endpoint for:
 *  - action=discover       : Multi-strategy product discovery (Shopify/WooCommerce APIs, XML/JSON feeds, JSON-LD, OpenGraph/HTML)
 *  - action=validate-images: SSRF-safe image URL reachability, content-type, and quality validation
 *  - action=exchange-rate  : Live verified exchange rate lookup (never fabricated)
 *  - action=enrich         : Optional server-side AI enrichment when GEMINI_API_KEY or OPENAI_API_KEY is configured
 *
 * v19.2 Speed & Vercel Timeout Fix:
 *  - Direct fast IPv4 HTTP/HTTPS client (no double 14s+14s Undici fallback stall)
 *  - Short per-stage timeouts (robots.txt 2.5s, API probes 4.5s, direct page 7.5s) to stay safely inside Vercel limits
 *  - Parallel robots.txt + Shopify/WooCommerce JSON probing
 */

import dns from 'node:dns/promises';
import net from 'node:net';
import http from 'node:http';
import https from 'node:https';
import zlib from 'node:zlib';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const DEFAULT_TIMEOUT_MS = 7500;
const ROBOTS_TIMEOUT_MS = 2500;
const PROBE_TIMEOUT_MS = 4500;
const MAX_BODY_BYTES = 3 * 1024 * 1024; // 3 MB
const MAX_REDIRECTS = 4;
const MAX_EXTRACTED_ITEMS = 250;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQ = 30;

const rateLimitStore = new Map();

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'ip6-localhost',
  'ip6-loopback',
  'metadata.google.internal',
  'metadata.goog',
  'metadata',
  'instance-data',
  '169.254.169.254'
]);

export function isPrivateOrReservedIp(ip) {
  if (!ip || typeof ip !== 'string') return true;
  const clean = ip.trim().toLowerCase();

  if (clean.startsWith('::ffff:')) {
    return isPrivateOrReservedIp(clean.slice(7));
  }

  const version = net.isIP(clean);
  if (version === 4) {
    const parts = clean.split('.').map(Number);
    if (parts.length !== 4 || parts.some(n => Number.isNaN(n) || n < 0 || n > 255)) return true;
    const [a, b] = parts;
    if (a === 0) return true;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a >= 224) return true;
    return false;
  }

  if (version === 6) {
    if (clean === '::1' || clean === '::') return true;
    if (clean.startsWith('fc') || clean.startsWith('fd')) return true;
    if (clean.startsWith('fe8') || clean.startsWith('fe9') || clean.startsWith('fea') || clean.startsWith('feb')) return true;
    if (clean.startsWith('ff')) return true;
    return false;
  }

  return true;
}

export async function validateSafePublicUrl(rawUrl, options = {}) {
  const { skipDns = false } = options;
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { ok: false, reason: 'الرابط فارغ أو غير صالح.' };
  }
  const trimmed = rawUrl.trim();
  if (trimmed.length > 2048) {
    return { ok: false, reason: 'طول الرابط يتجاوز الحد المسموح به (2048 حرف).' };
  }

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, reason: 'صيغة الرابط غير صالحة. يجب أن يبدأ بـ https:// أو http://.' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, reason: `البروتوكول "${parsed.protocol}" غير مسموح به. يُسمح فقط بـ http و https.` };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: 'لا يُسمح بروابط تحتوي على بيانات اعتماد مدمجة (username/password).' };
  }

  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (
    BLOCKED_HOSTNAMES.has(host) ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    host.endsWith('.localhost') ||
    host.endsWith('.arpa')
  ) {
    return { ok: false, reason: 'تم حظر الرابط لحماية الشبكة الداخلية (SSRF Protection).' };
  }

  if (net.isIP(host)) {
    if (isPrivateOrReservedIp(host)) {
      return { ok: false, reason: 'تم حظر عنوان IP خاص أو محجوز (Private IP / Metadata Protection).' };
    }
    return { ok: true, url: parsed.toString(), hostname: host };
  }

  if (!skipDns) {
    try {
      const records = await dns.lookup(host, { all: true });
      if (!records || records.length === 0) {
        return { ok: false, reason: 'تعذر حل اسم النطاق عبر DNS.' };
      }
      for (const rec of records) {
        if (isPrivateOrReservedIp(rec.address)) {
          return { ok: false, reason: `تم حظر النطاق لأنه يشير إلى عنوان IP داخلي (${rec.address}).` };
        }
      }
    } catch {
      return { ok: false, reason: 'تعذر التحقق من DNS للنطاق المطلوب (تأكد من كتابة الرابط بشكل صحيح).' };
    }
  }

  return { ok: true, url: parsed.toString(), hostname: host };
}

function formatNetworkErrorArabic(err) {
  const code = err?.cause?.code || err?.code || '';
  const msg = err?.cause?.message || err?.message || '';
  if (err?.name === 'AbortError' || code === 'ETIMEDOUT' || code === 'UND_ERR_CONNECT_TIMEOUT' || code === 'UND_ERR_HEADERS_TIMEOUT') {
    return 'انتهت مهلة الاتصال بالموقع المصدر (Timeout). غالباً الموقع يحجب خوادم الاستضافة السحابية (Datacenter IP) أو بطيء جداً — الحل السريع: افتح رابط /products.json أو الكتالوج من متصفحك وانسخه في خانة "أو الصق بيانات CSV / JSON Feed".';
  }
  if (code === 'ECONNRESET' || code === 'UND_ERR_SOCKET') {
    return 'أغلق الموقع المصدر الاتصال فجأة (ECONNRESET) بسبب جدار حماية (Cloudflare/WAF). استخدم بديل CSV / JSON Feed المصرح به.';
  }
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
    return 'تعذر العثور على النطاق (DNS ENOTFOUND) — تأكد من صحة رابط الموقع.';
  }
  if (code === 'ECONNREFUSED') {
    return 'رفض الخادم المصدر الاتصال (ECONNREFUSED).';
  }
  if (/CERT|TLS|SSL/i.test(code) || /certificate|TLS|SSL/i.test(msg)) {
    return `مشكلة في شهادة الأمان (SSL/TLS) للموقع المصدر (${code || msg}).`;
  }
  return msg && msg !== 'fetch failed'
    ? `تعذر جلب المصدر: ${msg}${code ? ` (${code})` : ''}`
    : `تعذر الاتصال بالموقع المصدر (${code || 'Network/TLS error'}). جرب لصق بيانات CSV / JSON Feed.`;
}

/**
 * Direct fast IPv4 Node http/https request with hard timeout & gzip/br decompression
 */
function nodeHttpRequest(targetUrl, method = 'GET', customHeaders = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(targetUrl);
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
        path: `${parsed.pathname}${parsed.search}`,
        method,
        family: 4,
        timeout: timeoutMs,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json, application/xml, text/xml, text/html;q=0.9, */*;q=0.8',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'close',
          ...customHeaders
        }
      },
      (res) => {
        const status = res.statusCode || 0;
        const headersMap = new Map();
        for (const [k, v] of Object.entries(res.headers || {})) {
          headersMap.set(k.toLowerCase(), Array.isArray(v) ? v.join(', ') : String(v ?? ''));
        }
        const headers = { get: (k) => headersMap.get(String(k).toLowerCase()) || null };

        if (method === 'HEAD' || [301, 302, 303, 307, 308].includes(status)) {
          res.resume();
          return resolve({
            ok: status >= 200 && status < 300,
            status,
            headers,
            text: async () => '',
            json: async () => ({})
          });
        }

        let stream = res;
        const enc = (res.headers['content-encoding'] || '').toLowerCase();
        if (enc === 'gzip') stream = res.pipe(zlib.createGunzip());
        else if (enc === 'deflate') stream = res.pipe(zlib.createInflate());
        else if (enc === 'br') stream = res.pipe(zlib.createBrotliDecompress());

        const chunks = [];
        let totalBytes = 0;
        stream.on('data', (chunk) => {
          totalBytes += chunk.length;
          if (totalBytes <= MAX_BODY_BYTES) chunks.push(chunk);
          else stream.destroy();
        });
        stream.on('end', () => {
          const bodyStr = Buffer.concat(chunks).toString('utf8');
          resolve({
            ok: status >= 200 && status < 300,
            status,
            headers,
            text: async () => bodyStr,
            json: async () => JSON.parse(bodyStr)
          });
        });
        stream.on('error', reject);
      }
    );
    req.on('timeout', () => {
      const err = new Error('Timeout');
      err.code = 'ETIMEDOUT';
      req.destroy(err);
    });
    req.on('error', reject);
    req.end();
  });
}

async function safeFetch(rawUrl, init = {}, hops = 0) {
  if (hops > MAX_REDIRECTS) {
    throw new Error('تم تجاوز الحد الأقصى لإعادة التوجيه (Max redirects exceeded).');
  }
  const check = await validateSafePublicUrl(rawUrl);
  if (!check.ok) {
    throw new Error(check.reason);
  }

  const method = (init.method || 'GET').toUpperCase();
  const timeoutMs = Number(init.timeoutMs || DEFAULT_TIMEOUT_MS);
  const headers = init.headers || {};

  let res;
  try {
    res = await nodeHttpRequest(check.url, method, headers, timeoutMs);
  } catch (err) {
    throw new Error(formatNetworkErrorArabic(err));
  }

  if ([301, 302, 303, 307, 308].includes(res.status)) {
    const location = res.headers.get('location');
    if (!location) throw new Error('إعادة توجيه غير صالحة بدون وجهة.');
    const nextUrl = new URL(location, check.url).toString();
    return safeFetch(nextUrl, init, hops + 1);
  }

  return { res, finalUrl: check.url };
}

async function readLimitedText(res) {
  const lenHeader = Number(res.headers.get('content-length') || 0);
  if (lenHeader > MAX_BODY_BYTES) {
    throw new Error('حجم استجابة المصدر يتجاوز الحد الآمن المسموح به (3MB).');
  }
  const text = await res.text();
  if (Buffer.byteLength(text, 'utf8') > MAX_BODY_BYTES) {
    return text.slice(0, MAX_BODY_BYTES);
  }
  return text;
}

async function checkRobotsAllowed(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    const robotsUrl = `${parsed.origin}/robots.txt`;
    const { res } = await safeFetch(robotsUrl, { method: 'GET', timeoutMs: ROBOTS_TIMEOUT_MS });
    if (!res.ok) return { allowed: true, note: 'لا يوجد robots.txt مقيد.' };
    const txt = await readLimitedText(res);
    const lines = txt.split(/\r?\n/);
    let applies = false;
    const disallowed = [];
    for (const raw of lines) {
      const line = raw.split('#')[0].trim();
      if (!line) continue;
      if (/^user-agent\s*:/i.test(line)) {
        const ua = line.split(':')[1].trim().toLowerCase();
        applies = ua === '*' || ua.includes('elzoghbi');
      } else if (applies && /^disallow\s*:/i.test(line)) {
        const path = line.split(':').slice(1).join(':').trim();
        if (path) disallowed.push(path);
      }
    }
    const targetPath = parsed.pathname || '/';
    const blockedRule = disallowed.find(rule => rule === '/' || (rule.length > 1 && targetPath.startsWith(rule)));
    if (blockedRule) {
      return {
        allowed: false,
        note: `ملف robots.txt يمنع الوصول الآلي إلى المسار (${blockedRule}). يرجى استخدام ملف CSV / XML / API مصرح به من المورد.`
      };
    }
    return { allowed: true, note: 'مسموح حسب robots.txt.' };
  } catch {
    return { allowed: true, note: 'تخطي robots.txt السريع.' };
  }
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeImageList(rawImages, baseUrl) {
  const out = [];
  const seen = new Set();
  const arr = Array.isArray(rawImages) ? rawImages : rawImages ? [rawImages] : [];
  for (const item of arr) {
    const src = typeof item === 'string' ? item : item?.src || item?.url || item?.contentUrl || '';
    if (!src) continue;
    try {
      const abs = new URL(src, baseUrl).toString();
      if ((abs.startsWith('http://') || abs.startsWith('https://')) && !seen.has(abs)) {
        seen.add(abs);
        out.push(abs);
      }
    } catch {
      // ignore invalid URL
    }
  }
  return out;
}

function detectAccessRestriction(status, html) {
  if (status === 401 || status === 403 || status === 429) {
    return `المصدر يرفض الوصول الآلي حالياً (HTTP ${status}) بسبب قيود حماية أو صلاحيات. لا يتجاوز النظام الحماية؛ يمكنك استيراد الكتالوج عبر CSV أو XML أو JSON Feed مصرح به.`;
  }
  const low = String(html || '').toLowerCase();
  if (
    low.includes('cf-browser-verification') ||
    low.includes('just a moment...') ||
    low.includes('captcha') ||
    low.includes('g-recaptcha') ||
    low.includes('hcaptcha') ||
    low.includes('perimeterx') ||
    low.includes('access denied')
  ) {
    return 'المصدر محمي ببوابة تحقق بشري (CAPTCHA / Anti-Bot) ولا يقوم النظام بتجاوزها التزاماً بسياسات الأمان. يمكنك تزويد النظام بملف CSV أو XML/JSON Feed أو API رسمي من المورد.';
  }
  return null;
}

function extractJsonLdProducts(html, sourceUrl) {
  const products = [];
  const scriptRe = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptRe.exec(html)) !== null) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) {
        const node = queue.shift();
        if (!node || typeof node !== 'object') continue;
        if (Array.isArray(node['@graph'])) queue.push(...node['@graph']);
        if (Array.isArray(node.itemListElement)) {
          for (const el of node.itemListElement) {
            if (el?.item) queue.push(el.item);
            else queue.push(el);
          }
        }
        const typeField = Array.isArray(node['@type']) ? node['@type'] : [node['@type']];
        if (typeField.some(t => String(t || '').toLowerCase() === 'product')) {
          const offer = Array.isArray(node.offers) ? node.offers[0] : node.offers || {};
          const price = Number(offer?.price ?? offer?.lowPrice ?? 0) || 0;
          const origPrice = Number(offer?.highPrice ?? offer?.price ?? 0) || price;
          const availStr = String(offer?.availability || '').toLowerCase();
          const inStock = availStr ? !availStr.includes('outofstock') && !availStr.includes('discontinued') : true;
          const images = normalizeImageList(node.image, sourceUrl);
          const brandName = typeof node.brand === 'string' ? node.brand : node.brand?.name || '';
          products.push({
            name: String(node.name || '').trim(),
            brand: String(brandName || '').trim(),
            model: String(node.model || node.mpn || '').trim(),
            sku: String(node.sku || node.mpn || '').trim(),
            gtin: String(node.gtin || node.gtin13 || node.gtin14 || node.gtin12 || '').trim(),
            ean: String(node.gtin13 || '').trim(),
            upc: String(node.gtin12 || '').trim(),
            productUrl: node.url ? new URL(node.url, sourceUrl).toString() : sourceUrl,
            sourceUrl,
            originalDescription: stripHtml(node.description || ''),
            images,
            price,
            originalPrice: origPrice,
            salePrice: price < origPrice ? price : 0,
            currency: String(offer?.priceCurrency || 'USD').toUpperCase(),
            availability: inStock ? 'in_stock' : 'out_of_stock',
            stockStatus: inStock ? 'متوفر' : 'غير متوفر',
            category: String(node.category || '').trim(),
            specifications: {},
            variants: [],
            color: String(node.color || '').trim(),
            weight: typeof node.weight === 'object' ? String(node.weight?.value || '') : String(node.weight || ''),
            warranty: '',
            rating: Number(node.aggregateRating?.ratingValue || 0) || null,
            reviewCount: Number(node.aggregateRating?.reviewCount || 0) || null,
            extractionMethod: 'json_ld',
            sourceVerifiedFields: ['name', 'productUrl', ...(price ? ['price'] : []), ...(images.length ? ['images'] : []), ...(node.sku ? ['sku'] : []), ...(brandName ? ['brand'] : [])]
          });
        }
      }
    } catch {
      // ignore malformed JSON-LD block
    }
  }
  return products;
}

function extractShopifyProducts(jsonData, sourceUrl) {
  const list = Array.isArray(jsonData?.products)
    ? jsonData.products
    : jsonData?.product
      ? [jsonData.product]
      : [];
  const origin = new URL(sourceUrl).origin;
  return list.slice(0, MAX_EXTRACTED_ITEMS).map(p => {
    const variants = Array.isArray(p.variants) ? p.variants : [];
    const firstVar = variants[0] || {};
    const price = Number(firstVar.price || 0) || 0;
    const compareAt = Number(firstVar.compare_at_price || 0) || 0;
    const anyAvailable = variants.length ? variants.some(v => v.available !== false) : true;
    const images = normalizeImageList((p.images || []).map(i => i.src || i), origin);
    const specs = {};
    if (p.product_type) specs['النوع'] = p.product_type;
    if (p.vendor) specs['العلامة التجارية'] = p.vendor;
    if (firstVar.grams) specs['الوزن'] = `${firstVar.grams}g`;
    if (Array.isArray(p.options)) {
      p.options.forEach(opt => {
        if (opt?.name && opt.name !== 'Title' && Array.isArray(opt.values)) {
          specs[opt.name] = opt.values.join(', ');
        }
      });
    }
    return {
      name: String(p.title || '').trim(),
      brand: String(p.vendor || '').trim(),
      model: String(firstVar.sku || p.handle || '').trim(),
      sku: String(firstVar.sku || '').trim(),
      gtin: String(firstVar.barcode || '').trim(),
      ean: String(firstVar.barcode || '').length === 13 ? String(firstVar.barcode) : '',
      upc: String(firstVar.barcode || '').length === 12 ? String(firstVar.barcode) : '',
      productUrl: p.handle ? `${origin}/products/${p.handle}` : sourceUrl,
      sourceUrl,
      originalDescription: stripHtml(p.body_html || ''),
      images,
      price,
      originalPrice: compareAt > price ? compareAt : price,
      salePrice: compareAt > price ? price : 0,
      currency: 'EGP',
      availability: anyAvailable ? 'in_stock' : 'out_of_stock',
      stockStatus: anyAvailable ? 'متوفر' : 'غير متوفر',
      category: String(p.product_type || '').trim(),
      specifications: specs,
      variants: variants.map(v => ({
        title: v.title,
        sku: v.sku || '',
        price: Number(v.price || 0),
        available: v.available !== false
      })),
      color: '',
      weight: firstVar.grams ? `${firstVar.grams}g` : '',
      warranty: '',
      rating: null,
      reviewCount: null,
      extractionMethod: 'shopify_json_api',
      sourceVerifiedFields: ['name', 'productUrl', ...(price ? ['price'] : []), ...(images.length ? ['images'] : []), ...(firstVar.sku ? ['sku'] : []), ...(p.vendor ? ['brand'] : [])]
    };
  });
}

function extractWooProducts(arr, sourceUrl) {
  if (!Array.isArray(arr)) return [];
  return arr.slice(0, MAX_EXTRACTED_ITEMS).map(p => {
    const minorUnit = Number(p?.prices?.currency_minor_unit ?? 2);
    const divisor = Math.pow(10, minorUnit);
    const rawP = Number(p?.prices?.price || 0);
    const price = rawP > 0 ? rawP / divisor : 0;
    const origRaw = Number(p?.prices?.regular_price || rawP || 0);
    const origPrice = origRaw > 0 ? origRaw / divisor : price;
    const images = normalizeImageList((p.images || []).map(i => i.src || i), sourceUrl);
    const inStock = p.is_in_stock !== false;
    return {
      name: stripHtml(p.name || ''),
      brand: stripHtml(p.brands?.[0]?.name || ''),
      model: String(p.sku || p.slug || '').trim(),
      sku: String(p.sku || '').trim(),
      gtin: '',
      ean: '',
      upc: '',
      productUrl: p.permalink || sourceUrl,
      sourceUrl,
      originalDescription: stripHtml(p.short_description || p.description || ''),
      images,
      price,
      originalPrice: origPrice,
      salePrice: price < origPrice ? price : 0,
      currency: String(p?.prices?.currency_code || 'EGP').toUpperCase(),
      availability: inStock ? 'in_stock' : 'out_of_stock',
      stockStatus: inStock ? 'متوفر' : 'غير متوفر',
      category: stripHtml(p.categories?.[0]?.name || ''),
      specifications: {},
      variants: [],
      color: '',
      weight: '',
      warranty: '',
      rating: Number(p.average_rating || 0) || null,
      reviewCount: Number(p.review_count || 0) || null,
      extractionMethod: 'woocommerce_store_api',
      sourceVerifiedFields: ['name', 'productUrl', ...(price ? ['price'] : []), ...(images.length ? ['images'] : []), ...(p.sku ? ['sku'] : [])]
    };
  }).filter(p => p.name);
}

function extractXmlFeedProducts(xmlText, sourceUrl) {
  const items = [];
  const itemRe = /<(?:item|entry)>([\s\S]*?)<\/(?:item|entry)>/gi;
  const pickTag = (block, names) => {
    for (const tag of names) {
      const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
      const m = block.match(re);
      if (m && m[1]) {
        return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim();
      }
    }
    return '';
  };
  let m;
  while ((m = itemRe.exec(xmlText)) !== null && items.length < MAX_EXTRACTED_ITEMS) {
    const b = m[1];
    const name = stripHtml(pickTag(b, ['g:title', 'title']));
    if (!name) continue;
    const rawPrice = pickTag(b, ['g:sale_price', 'g:price', 'price']);
    const priceNum = Number(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;
    const currMatch = String(rawPrice).match(/[A-Z]{3}/);
    const imgMain = pickTag(b, ['g:image_link', 'image', 'media:content']);
    const extraImgs = [];
    const extraRe = /<g:additional_image_link>([\s\S]*?)<\/g:additional_image_link>/gi;
    let em;
    while ((em = extraRe.exec(b)) !== null) extraImgs.push(em[1].trim());
    const images = normalizeImageList([imgMain, ...extraImgs], sourceUrl);
    const avail = pickTag(b, ['g:availability', 'availability']).toLowerCase();
    const inStock = !avail || avail.includes('in stock') || avail.includes('in_stock');
    items.push({
      name,
      brand: stripHtml(pickTag(b, ['g:brand', 'brand'])),
      model: stripHtml(pickTag(b, ['g:mpn', 'mpn', 'model'])),
      sku: stripHtml(pickTag(b, ['g:id', 'sku', 'id'])),
      gtin: stripHtml(pickTag(b, ['g:gtin', 'gtin'])),
      ean: '',
      upc: '',
      productUrl: pickTag(b, ['g:link', 'link']) || sourceUrl,
      sourceUrl,
      originalDescription: stripHtml(pickTag(b, ['g:description', 'description'])),
      images,
      price: priceNum,
      originalPrice: priceNum,
      salePrice: 0,
      currency: currMatch ? currMatch[0] : 'USD',
      availability: inStock ? 'in_stock' : 'out_of_stock',
      stockStatus: inStock ? 'متوفر' : 'غير متوفر',
      category: stripHtml(pickTag(b, ['g:product_type', 'g:google_product_category', 'category'])),
      specifications: {},
      variants: [],
      color: stripHtml(pickTag(b, ['g:color', 'color'])),
      weight: stripHtml(pickTag(b, ['g:shipping_weight', 'weight'])),
      warranty: '',
      rating: null,
      reviewCount: null,
      extractionMethod: 'xml_product_feed',
      sourceVerifiedFields: ['name', 'productUrl', ...(priceNum ? ['price'] : []), ...(images.length ? ['images'] : [])]
    });
  }
  return items;
}

function extractOpenGraphFallback(html, sourceUrl) {
  const getMeta = (prop) => {
    const re = new RegExp(`<meta[^>]*(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, 'i');
    const m = html.match(re);
    return m ? m[1].trim() : '';
  };
  const title = getMeta('og:title') || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || '').trim();
  const desc = getMeta('og:description') || getMeta('description');
  const img = getMeta('og:image') || getMeta('twitter:image');
  const price = Number(getMeta('product:price:amount') || getMeta('og:price:amount') || 0) || 0;
  const currency = (getMeta('product:price:currency') || getMeta('og:price:currency') || 'USD').toUpperCase();
  if (!title) return [];
  return [{
    name: stripHtml(title),
    brand: getMeta('product:brand') || '',
    model: '',
    sku: getMeta('product:retailer_item_id') || '',
    gtin: '',
    ean: '',
    upc: '',
    productUrl: sourceUrl,
    sourceUrl,
    originalDescription: stripHtml(desc),
    images: normalizeImageList(img ? [img] : [], sourceUrl),
    price,
    originalPrice: price,
    salePrice: 0,
    currency,
    availability: 'in_stock',
    stockStatus: 'متوفر',
    category: getMeta('product:category') || '',
    specifications: {},
    variants: [],
    color: '',
    weight: '',
    warranty: '',
    rating: null,
    reviewCount: null,
    extractionMethod: 'opengraph_meta',
    sourceVerifiedFields: ['name', 'productUrl', ...(price ? ['price'] : []), ...(img ? ['images'] : [])]
  }];
}

function classifySourceType(url, extractionMethod, count) {
  const low = url.toLowerCase();
  if (extractionMethod === 'xml_product_feed' || low.endsWith('.xml') || low.includes('feed')) return 'product_feed';
  if (extractionMethod === 'shopify_json_api' && low.includes('/collections/')) return 'collection';
  if (low.includes('/search') || low.includes('?q=') || low.includes('?s=')) return 'search_page';
  if (low.includes('/category') || low.includes('/collections') || low.includes('/catalog')) return 'category_listing';
  if (count === 1 || low.includes('/product/') || low.includes('/products/')) return 'single_product';
  return 'product_listing';
}

function checkRateLimit(req) {
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const bucket = (rateLimitStore.get(ip) || []).filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  if (bucket.length >= RATE_LIMIT_MAX_REQ) {
    return false;
  }
  bucket.push(now);
  rateLimitStore.set(ip, bucket);
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ ok: true });
  }

  if (!checkRateLimit(req)) {
    return res.status(429).json({
      ok: false,
      error: 'تم تجاوز حد الطلبات المسموح به في الدقيقة (Rate Limit). انتظر قليلاً ثم أعد المحاولة.'
    });
  }

  const action = String(req.query?.action || req.body?.action || 'discover');

  try {
    // 1. LIVE VERIFIED EXCHANGE RATE
    if (action === 'exchange-rate') {
      const base = String(req.query?.base || req.body?.base || 'USD').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
      const target = String(req.query?.target || req.body?.target || 'EGP').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
      if (base === target) {
        return res.status(200).json({
          ok: true,
          base,
          target,
          rate: 1,
          source: 'same_currency',
          conversionDate: new Date().toISOString()
        });
      }
      const { res: fxRes } = await safeFetch(`https://open.er-api.com/v6/latest/${base}`, { timeoutMs: 5000 });
      if (!fxRes.ok) {
        return res.status(200).json({
          ok: false,
          error: 'تعذر جلب سعر الصرف الموثق حالياً. يرجى إدخال سعر الصرف يدوياً.'
        });
      }
      const fxJson = await fxRes.json();
      const rate = Number(fxJson?.rates?.[target]);
      if (!rate || !Number.isFinite(rate)) {
        return res.status(200).json({
          ok: false,
          error: `سعر الصرف غير متاح للعملة ${base} → ${target}. يرجى إدخاله يدوياً.`
        });
      }
      return res.status(200).json({
        ok: true,
        base,
        target,
        rate,
        source: 'ExchangeRate-API (open.er-api.com)',
        conversionDate: fxJson.time_last_update_utc || new Date().toISOString()
      });
    }

    // 2. VALIDATE IMAGES (SSRF-SAFE HEAD CHECK)
    if (action === 'validate-images') {
      const urls = Array.isArray(req.body?.urls) ? req.body.urls.slice(0, 40) : [];
      const results = await Promise.all(
        urls.map(async (u) => {
          const check = await validateSafePublicUrl(u);
          if (!check.ok) {
            return { url: u, valid: false, status: 0, error: check.reason };
          }
          try {
            const { res: imgRes } = await safeFetch(check.url, { method: 'HEAD', timeoutMs: 4500 });
            const ct = imgRes.headers.get('content-type') || '';
            const bytes = Number(imgRes.headers.get('content-length') || 0);
            const isImage = ct.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|avif)(\?|$)/i.test(check.url);
            return {
              url: check.url,
              valid: imgRes.ok && isImage,
              status: imgRes.status,
              contentType: ct,
              bytes,
              lowQualityHint: bytes > 0 && bytes < 8000
            };
          } catch (err) {
            return { url: check.url, valid: false, status: 0, error: err.message };
          }
        })
      );
      return res.status(200).json({ ok: true, results });
    }

    // 3. DISCOVER & EXTRACT PRODUCTS FROM AUTHORIZED PUBLIC URL (PARALLEL FAST PROBE)
    if (action === 'discover') {
      const rawUrl = String(req.body?.url || req.query?.url || '').trim();
      const urlCheck = await validateSafePublicUrl(rawUrl);
      if (!urlCheck.ok) {
        return res.status(400).json({ ok: false, error: urlCheck.reason, blockedBySecurity: true });
      }

      const parsed = new URL(urlCheck.url);
      const logs = [`تم التحقق الأمني من الرابط (SSRF + DNS): ${urlCheck.url}`];

      // Build parallel probe list (robots.txt + Shopify/Woo JSON if applicable)
      const shopifyProbeUrl = parsed.pathname.includes('/collections/')
        ? `${parsed.origin}${parsed.pathname.replace(/\/$/, '')}/products.json?limit=250`
        : (parsed.pathname === '/' || parsed.pathname === '')
          ? `${parsed.origin}/products.json?limit=250`
          : null;

      const [robotsRes, shopifyRes] = await Promise.allSettled([
        checkRobotsAllowed(urlCheck.url),
        shopifyProbeUrl ? safeFetch(shopifyProbeUrl, { timeoutMs: PROBE_TIMEOUT_MS }) : Promise.resolve(null)
      ]);

      const robots = robotsRes.status === 'fulfilled' ? robotsRes.value : { allowed: true };
      if (!robots.allowed) {
        return res.status(403).json({
          ok: false,
          error: robots.note,
          alternatives: ['CSV', 'XML Product Feed', 'JSON API', 'Manual Paste']
        });
      }

      // Check Shopify parallel probe result first
      if (shopifyRes.status === 'fulfilled' && shopifyRes.value?.res?.ok) {
        const sRes = shopifyRes.value.res;
        if ((sRes.headers.get('content-type') || '').includes('json')) {
          try {
            const text = await readLimitedText(sRes);
            const json = JSON.parse(text);
            const items = extractShopifyProducts(json, urlCheck.url);
            if (items.length > 0) {
              logs.push(`تم الاستخراج السريع عبر Shopify JSON API (${items.length} منتج).`);
              return res.status(200).json({
                ok: true,
                sourceUrl: urlCheck.url,
                sourceType: classifySourceType(urlCheck.url, 'shopify_json_api', items.length),
                extractionMethod: 'shopify_json_api',
                products: items,
                logs
              });
            }
          } catch {
            // fall through to direct fetch
          }
        }
      }

      // Direct fetch of provided URL
      const { res: pageRes, finalUrl } = await safeFetch(urlCheck.url, { timeoutMs: DEFAULT_TIMEOUT_MS });
      const contentType = (pageRes.headers.get('content-type') || '').toLowerCase();
      const bodyText = await readLimitedText(pageRes);

      const restriction = detectAccessRestriction(pageRes.status, bodyText);
      if (restriction) {
        return res.status(422).json({
          ok: false,
          error: restriction,
          alternatives: ['CSV', 'XML Product Feed', 'JSON API', 'Manual Paste'],
          logs
        });
      }

      if (!pageRes.ok) {
        return res.status(502).json({
          ok: false,
          error: `تعذر جلب المصدر (HTTP ${pageRes.status}).`,
          alternatives: ['CSV', 'XML Product Feed', 'JSON API', 'Manual Paste'],
          logs
        });
      }

      // JSON API / Feed
      if (contentType.includes('json') || bodyText.trim().startsWith('{') || bodyText.trim().startsWith('[')) {
        try {
          const parsedJson = JSON.parse(bodyText);
          const items = parsedJson.products || parsedJson.product
            ? extractShopifyProducts(parsedJson, finalUrl)
            : Array.isArray(parsedJson) && parsedJson[0]?.prices?.currency_code
              ? extractWooProducts(parsedJson, finalUrl)
              : (Array.isArray(parsedJson) ? parsedJson : parsedJson.items || []).slice(0, MAX_EXTRACTED_ITEMS).map(it => ({
                  name: String(it.name || it.title || '').trim(),
                  brand: String(it.brand || it.vendor || '').trim(),
                  model: String(it.model || it.mpn || '').trim(),
                  sku: String(it.sku || it.id || '').trim(),
                  gtin: String(it.gtin || it.barcode || '').trim(),
                  ean: String(it.ean || '').trim(),
                  upc: String(it.upc || '').trim(),
                  productUrl: it.url || it.productUrl || finalUrl,
                  sourceUrl: finalUrl,
                  originalDescription: stripHtml(it.description || ''),
                  images: normalizeImageList(it.images || it.image, finalUrl),
                  price: Number(it.price || 0) || 0,
                  originalPrice: Number(it.originalPrice || it.compare_at_price || it.price || 0) || 0,
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
                  extractionMethod: 'json_feed',
                  sourceVerifiedFields: ['name', 'productUrl']
                }));
          logs.push(`تم تحليل خلاصة JSON واستخراج ${items.length} منتج.`);
          return res.status(200).json({
            ok: true,
            sourceUrl: finalUrl,
            sourceType: 'product_feed',
            extractionMethod: 'json_feed',
            products: items,
            logs
          });
        } catch {
          // continue to XML/HTML
        }
      }

      // XML / RSS / Google Merchant Feed
      if (contentType.includes('xml') || bodyText.trim().startsWith('<?xml') || bodyText.includes('<rss') || bodyText.includes('<feed')) {
        const items = extractXmlFeedProducts(bodyText, finalUrl);
        logs.push(`تم تحليل خلاصة XML/Feed واستخراج ${items.length} منتج.`);
        return res.status(200).json({
          ok: true,
          sourceUrl: finalUrl,
          sourceType: 'product_feed',
          extractionMethod: 'xml_product_feed',
          products: items,
          logs
        });
      }

      // Structured JSON-LD from HTML
      let products = extractJsonLdProducts(bodyText, finalUrl);
      let method = 'json_ld';
      if (products.length === 0) {
        products = extractOpenGraphFallback(bodyText, finalUrl);
        method = 'opengraph_meta';
      }

      if (products.length === 0) {
        return res.status(200).json({
          ok: false,
          error: 'لم يتم العثور على بيانات منتجات منظمة (JSON-LD / API / Feed) في هذه الصفحة. يمكنك استخدام ملف CSV أو XML Feed أو لصق بيانات المنتجات يدوياً.',
          alternatives: ['CSV', 'XML Product Feed', 'JSON Feed', 'Manual Paste'],
          logs
        });
      }

      logs.push(`تم استخراج ${products.length} منتج عبر ${method}.`);
      return res.status(200).json({
        ok: true,
        sourceUrl: finalUrl,
        sourceType: classifySourceType(finalUrl, method, products.length),
        extractionMethod: method,
        products: products.slice(0, MAX_EXTRACTED_ITEMS),
        logs
      });
    }

    // 4. OPTIONAL SERVER-SIDE AI ENRICHMENT
    if (action === 'enrich') {
      const hasGemini = Boolean(process.env.GEMINI_API_KEY);
      const hasOpenAi = Boolean(process.env.OPENAI_API_KEY);
      if (!hasGemini && !hasOpenAi) {
        return res.status(200).json({
          ok: true,
          mode: 'local_deterministic',
          note: 'لا يوجد مفتاح AI خارجي مضاف في إعدادات السيرفر؛ تم استخدام محرك الإثراء المدمج الدقيق.'
        });
      }
      if (hasGemini && req.body?.product) {
        const p = req.body.product;
        const prompt = `أنت خبير منتجات إلكترونية لمتجر مصري (Elzoghbi Market). اعتماداً فقط على بيانات المصدر التالية بدون اختراع أي مواصفات أو ضمان غير مذكور، أرجع JSON يحتوي على: titleAr, descriptionAr, seoTitle, seoDescription, tags (array).\nبيانات المصدر: ${JSON.stringify({
          name: p.name,
          brand: p.brand,
          model: p.model,
          category: p.category,
          description: p.originalDescription,
          specifications: p.specifications
        })}`;
        const gRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(process.env.GEMINI_API_KEY)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: 'application/json' }
            })
          }
        );
        if (gRes.ok) {
          const gJson = await gRes.json();
          const txt = gJson?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
          return res.status(200).json({
            ok: true,
            mode: 'gemini_api',
            enriched: JSON.parse(txt)
          });
        }
      }
      return res.status(200).json({ ok: true, mode: 'local_deterministic' });
    }

    return res.status(400).json({ ok: false, error: `إجراء غير معروف: ${action}` });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: formatNetworkErrorArabic(err)
    });
  }
}
