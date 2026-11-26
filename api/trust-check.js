/**
 * ELZOGHBI MARKET — Phone number / social page / website checker (/api/trust-check?q=...)
 * "فاحص الأرقام وصفحات السوشيال قبل تحويل أي عربون"
 *
 * Works with zero API keys. For every query it combines independent signals:
 *   - Egyptian number format + carrier detection
 *   - Public web mentions of the number / page next to scam keywords (نصب، نصاب، احتيال ...)
 *   - Website age through RDAP, HTTPS, URL shorteners, risky TLDs
 *   - Public page metadata (followers / likes, description wording) when the platform exposes it
 * The result is a risk score + the list of signals, never a "guarantee".
 */
import dns from 'node:dns/promises';
import net from 'node:net';
import { httpGet, decodeText } from './_lib/shops.js';

const cache = new Map();
const TTL = 3 * 60 * 60 * 1000;

const SHORTENERS = new Set(['bit.ly', 'tinyurl.com', 't.co', 'cutt.ly', 'rb.gy', 'is.gd', 'shorturl.at', 'goo.gl', 'ow.ly', 'rebrand.ly', 'linktr.ee', 'lnk.bio', 'beacons.ai']);
const RISKY_TLDS = new Set(['xyz', 'top', 'click', 'shop', 'online', 'site', 'icu', 'buzz', 'rest', 'fun', 'cfd', 'sbs', 'live', 'store', 'vip', 'cc', 'tk', 'ml', 'ga', 'cf', 'gq']);
const PLATFORMS = [
  { id: 'facebook', label: 'فيسبوك', re: /(^|\.)(facebook\.com|fb\.com|fb\.me|m\.facebook\.com)$/ },
  { id: 'instagram', label: 'إنستجرام', re: /(^|\.)instagram\.com$/ },
  { id: 'tiktok', label: 'تيك توك', re: /(^|\.)tiktok\.com$/ },
  { id: 'whatsapp', label: 'واتساب', re: /(^|\.)(wa\.me|whatsapp\.com)$/ },
  { id: 'telegram', label: 'تيليجرام', re: /(^|\.)(t\.me|telegram\.me)$/ },
  { id: 'youtube', label: 'يوتيوب', re: /(^|\.)(youtube\.com|youtu\.be)$/ },
  { id: 'olx', label: 'OLX', re: /(^|\.)olx\.com\.eg$/ },
];
const SCAM_WORDS = /نصب|نصاب|نصابين|احتيال|محتال|حرامي|سرقة|سرق|اتنصب|اتنصبت|scam|fraud|fake|beware|stolen/i;
const BAIT_WORDS = /عربون فقط|تحويل مسبق|حول الأول|بدون معاينة|خصم\s*[6-9]0\s*%|اخر قطعة|آخر قطعة|عرض لمدة ساعة|ربح مضمون|هدية مجانية|ايفون\s*بـ?\s*[1-9],?\d{3}\s*جنيه/i;

function normDigits(s) {
  return String(s || '').replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
}

function classify(raw) {
  const q = normDigits(raw).trim();
  const digits = q.replace(/[\s\-().+]/g, '');
  if (/^\d{8,15}$/.test(digits) && !/[a-z]/i.test(q)) return { kind: 'phone', value: digits };
  if (/^(https?:\/\/)/i.test(q) || /^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(q) || /^www\./i.test(q)) {
    const url = /^https?:\/\//i.test(q) ? q : `https://${q}`;
    try {
      return { kind: 'url', value: new URL(url).toString() };
    } catch {
      /* fallthrough */
    }
  }
  if (/^@?[a-z0-9._]{3,40}$/i.test(q) && !/\s/.test(q)) return { kind: 'handle', value: q.replace(/^@/, '') };
  return { kind: 'name', value: q };
}

function egyptianPhone(digits) {
  let d = digits;
  if (d.startsWith('0020')) d = '0' + d.slice(4);
  else if (d.startsWith('20') && d.length === 12) d = '0' + d.slice(2);
  const m = d.match(/^(01[0125])(\d{8})$/);
  if (!m) return null;
  const carriers = { '010': 'فودافون', '011': 'اتصالات', '012': 'أورنج', '015': 'وي (WE)' };
  return { local: d, intl: `+20${d.slice(1)}`, carrier: carriers[m[1]] };
}

async function isPublicHost(host) {
  if (!host || host === 'localhost' || /\.(local|internal|lan)$/.test(host)) return false;
  if (net.isIP(host)) return false;
  try {
    const addrs = await dns.lookup(host, { all: true });
    return addrs.every((a) => !/^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|fc|fd|fe80)/i.test(a.address));
  } catch {
    return false;
  }
}

async function ddgSearch(query) {
  const r = await httpGet(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { timeout: 7000, headers: { 'Accept-Language': 'ar,en;q=0.8' } });
  if (r.status !== 200) return null;
  const results = [];
  const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(r.body)) && results.length < 10) {
    let href = m[1];
    const u = href.match(/uddg=([^&]+)/);
    if (u) href = decodeURIComponent(u[1]);
    results.push({ title: decodeText(m[2]), url: href, text: decodeText(m[3]) });
  }
  return results;
}

async function bingSearch(query) {
  const r = await httpGet(`https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=ar&cc=EG`, { timeout: 7000, headers: { 'Accept-Language': 'ar-EG,ar;q=0.9,en;q=0.7' } });
  if (r.status !== 200) return null;
  const results = [];
  const blocks = r.body.split('<li class="b_algo"').slice(1);
  for (const b of blocks) {
    const a = b.match(/<h2[^>]*>\s*<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (!a) continue;
    const p = b.match(/<p[^>]*>([\s\S]*?)<\/p>/) || b.match(/class="b_caption"[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/);
    results.push({ title: decodeText(a[2]), url: a[1], text: p ? decodeText(p[1]) : '' });
    if (results.length >= 10) break;
  }
  return results;
}

async function webMentions(query) {
  for (const engine of [ddgSearch, bingSearch]) {
    try {
      const results = await engine(query);
      if (results && results.length) return { ok: true, results };
    } catch {
      /* next engine */
    }
  }
  return { ok: false, results: [] };
}

async function domainAge(host) {
  const parts = host.split('.');
  const root = parts.length > 2 && !/^(com|co|net|org|gov|edu)$/.test(parts[parts.length - 2]) ? parts.slice(-2).join('.') : parts.slice(-3).join('.');
  try {
    const r = await httpGet(`https://rdap.org/domain/${root}`, { timeout: 6000, headers: { Accept: 'application/rdap+json, application/json' } });
    if (r.status !== 200) return null;
    const j = JSON.parse(r.body);
    const ev = (j.events || []).find((e) => /registration/i.test(e.eventAction));
    if (!ev) return null;
    const d = new Date(ev.eventDate);
    if (isNaN(d)) return null;
    return { created: d.toISOString().slice(0, 10), days: Math.floor((Date.now() - d.getTime()) / 86400000), root };
  } catch {
    return null;
  }
}

function metaTag(html, prop) {
  const m =
    html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']*)["']`, 'i')) ||
    html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, 'i'));
  return m ? decodeText(m[1]) : '';
}

async function pageMeta(url, platform) {
  try {
    const ua = platform ? 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uagent.php)' : undefined;
    const r = await httpGet(url, { timeout: 7000, maxBytes: 1.5 * 1024 * 1024, headers: ua ? { 'User-Agent': ua } : {} });
    if (r.status >= 400) return { reachable: false, status: r.status };
    const html = r.body;
    const title = metaTag(html, 'og:title') || decodeText((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '');
    const description = metaTag(html, 'og:description') || metaTag(html, 'description');
    const image = metaTag(html, 'og:image');
    const hay = `${title} ${description}`;
    const num = (re) => {
      const m = hay.match(re);
      if (!m) return 0;
      const n = parseFloat(m[1].replace(/,/g, ''));
      const u = (m[2] || '').toUpperCase();
      return Math.round(u === 'K' ? n * 1e3 : u === 'M' ? n * 1e6 : n);
    };
    const followers = num(/([\d.,]+)\s*([KM]?)\s*(?:followers|متابع)/i) || num(/(?:متابع(?:ين)?|followers)\s*[:：]?\s*([\d.,]+)\s*([KM]?)/i);
    const likes = num(/([\d.,]+)\s*([KM]?)\s*(?:likes|إعجاب|اعجاب)/i);
    return { reachable: true, status: r.status, title, description, image, followers, likes };
  } catch {
    return { reachable: false, status: 0 };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  const raw = String(req.query?.q || '').trim().slice(0, 300);
  if (raw.length < 3) return res.status(200).json({ ok: false, error: 'اكتب رقم أو رابط أو اسم الصفحة' });
  const key = raw.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() < hit.exp) return res.status(200).json(hit.val);

  const c = classify(raw);
  const signals = [];
  let risk = 40;
  const add = (level, text, delta = 0) => {
    signals.push({ level, text });
    risk += delta;
  };
  let meta = null;
  let snippets = [];
  let searched = false;
  let platform = null;
  let normalized = c.value;
  let host = '';

  try {
    if (c.kind === 'phone') {
      const eg = egyptianPhone(c.value);
      if (eg) {
        normalized = eg.local;
        add('info', `رقم مصري صحيح الصيغة (${eg.intl}) — شبكة ${eg.carrier}`);
        add('info', 'فودافون كاش وإنستاباي وأي محفظة بتكون على نفس الرقم — اتأكد إن اسم صاحب المحفظة يطابق اسم المحل قبل التحويل');
      } else {
        add('warn', 'الصيغة مش رقم موبايل مصري عادي (01x + 8 أرقام) — اتأكد إنك كاتب الرقم صح', 10);
      }
      const variants = eg ? [eg.local, eg.intl] : [c.value];
      const found = await webMentions(`"${variants[0]}" OR "${variants[1] || variants[0]}" نصب OR نصاب OR تقييم`);
      searched = found.ok;
      const related = found.results.filter((r) => variants.some((v) => `${r.title} ${r.text}`.replace(/[\s\-]/g, '').includes(v.replace('+', ''))));
      snippets = (related.length ? related : []).slice(0, 4);
      const bad = related.filter((r) => SCAM_WORDS.test(`${r.title} ${r.text}`));
      if (bad.length) add('bad', `ظهر الرقم في ${bad.length} نتيجة بحث مقترنة بكلمات نصب/احتيال — راجع النتائج بالأسفل`, Math.min(55, 28 * bad.length));
      else if (related.length) add('info', `الرقم مذكور في ${related.length} صفحة على الإنترنت بدون كلمات تحذير ظاهرة`, -8);
      else if (found.ok) add('info', 'مفيش أي ذكر عام للرقم ده على الإنترنت — ده معناه إنه غير معروف، مش إنه آمن', 5);
      else add('info', 'محرك البحث مردّش دلوقتي — جرّب تاني بعد شوية');
    } else {
      let urlStr = c.kind === 'url' ? c.value : '';
      if (c.kind === 'handle') {
        urlStr = `https://www.facebook.com/${c.value}`;
        add('info', `اتعامل مع «${c.value}» كصفحة فيسبوك — لو هي على منصة تانية الصق الرابط كامل`);
      }
      if (urlStr) {
        const u = new URL(urlStr);
        host = u.hostname.toLowerCase().replace(/^www\./, '');
        normalized = urlStr;
        platform = PLATFORMS.find((p) => p.re.test(host)) || null;
        if (u.protocol !== 'https:') add('warn', 'الموقع بدون HTTPS (اتصال غير مشفّر)', 15);
        if (SHORTENERS.has(host)) add('warn', 'رابط مختصر/وسيط بيخبّي الوجهة الحقيقية', 20);
        const tld = host.split('.').pop();
        if (!platform && RISKY_TLDS.has(tld)) add('warn', `امتداد النطاق .${tld} شائع في المواقع المؤقتة والمشبوهة`, 10);
        if (platform) add('info', `الرابط ده على منصة ${platform.label}`);
        if (!(await isPublicHost(host))) {
          add('bad', 'الرابط مش بيشاور على موقع عام يتفتح (أو النطاق مش موجود)', 25);
        } else {
          const [m, age] = await Promise.all([pageMeta(urlStr, !!platform), platform ? Promise.resolve(null) : domainAge(host)]);
          meta = m;
          if (m && !m.reachable) add('warn', 'مقدرناش نفتح الصفحة — ممكن تكون محذوفة أو خاصة أو بتحجب الفحص الآلي', 12);
          if (m && m.reachable) {
            if (m.title) add('info', `اسم الصفحة المعلن: ${m.title}`);
            if (m.followers) add(m.followers >= 5000 ? 'good' : m.followers < 300 ? 'warn' : 'info', `عدد المتابعين المعلن: ${m.followers.toLocaleString('en-US')}`, m.followers >= 5000 ? -10 : m.followers < 300 ? 10 : 0);
            if (m.likes && !m.followers) add(m.likes >= 5000 ? 'good' : m.likes < 300 ? 'warn' : 'info', `عدد الإعجابات المعلن: ${m.likes.toLocaleString('en-US')}`, m.likes >= 5000 ? -8 : m.likes < 300 ? 8 : 0);
            if (BAIT_WORDS.test(`${m.title} ${m.description}`)) add('bad', 'وصف الصفحة فيه عبارات ضغط/إغراء شائعة عند النصابين (تحويل مسبق، خصومات خيالية...)', 15);
            if (!platform && m.status === 200) add('good', 'الموقع شغال ويفتح بشكل طبيعي', -3);
          }
          if (age) {
            if (age.days < 90) add('bad', `النطاق ${age.root} اتسجّل من ${age.days} يوم بس (${age.created}) — مواقع النصب غالباً جديدة جداً`, 30);
            else if (age.days < 365) add('warn', `النطاق ${age.root} عمره أقل من سنة (${age.created})`, 10);
            else add('good', `النطاق ${age.root} عمره ${Math.floor(age.days / 365)} سنة (${age.created})`, -15);
          } else if (!platform) add('info', 'تعذّر معرفة عمر النطاق');
        }
      }
      const nameQ = (meta && meta.title) || (c.kind === 'name' ? c.value : host);
      if (nameQ) {
        const found = await webMentions(`${nameQ} نصب OR نصاب OR احتيال OR تقييم`);
        searched = found.ok;
        const key2 = nameQ.toLowerCase().split(/\s+/).filter((w) => w.length > 2)[0] || '';
        const related = found.results.filter((r) => key2 && `${r.title} ${r.text}`.toLowerCase().includes(key2));
        snippets = related.slice(0, 4);
        const bad = related.filter((r) => SCAM_WORDS.test(`${r.title} ${r.text}`));
        if (bad.length) add('bad', `في ${bad.length} نتيجة بحث بتربط الاسم بكلمات نصب/احتيال — راجعها قبل أي تحويل`, Math.min(50, 25 * bad.length));
        else if (related.length) add('info', `الاسم له ${related.length} ذكر على الإنترنت بدون تحذيرات ظاهرة`, -5);
        else if (found.ok) add('info', 'مفيش ذكر عام كافي للاسم ده — صفحة غير معروفة', 5);
      }
    }
  } catch (e) {
    add('info', 'حصل خطأ جزئي أثناء الفحص — النتيجة أدناه مبنية على المتاح');
  }

  risk = Math.max(3, Math.min(97, Math.round(risk)));
  const hasEvidence = searched || (meta && meta.reachable) || signals.some((x) => x.level === 'good' || x.level === 'bad');
  const verdict = risk >= 65 ? 'high' : risk >= 42 ? 'medium' : hasEvidence ? 'low' : 'unknown';
  const out = {
    ok: true,
    kind: c.kind,
    normalized,
    platform: platform ? platform.label : null,
    riskScore: risk,
    verdict,
    verdictText:
      verdict === 'high'
        ? 'خطر مرتفع — متحولش أي مبلغ قبل المعاينة والتأكد'
        : verdict === 'medium'
        ? 'غير موثّق — ادفع عند الاستلام أو بعد المعاينة فقط'
        : verdict === 'low'
        ? 'مفيش مؤشرات خطر ظاهرة — لكن ده مش ضمان، اتأكد دايماً قبل الدفع'
        : 'مفيش بيانات كافية عن الرقم/الصفحة دي — اعتبرها غير موثّقة وادفع بعد المعاينة فقط',
    signals,
    meta: meta && meta.reachable ? { title: meta.title, description: (meta.description || '').slice(0, 220), image: meta.image, followers: meta.followers, likes: meta.likes } : null,
    snippets,
    searched,
    checkedAt: Date.now(),
  };
  if (cache.size > 300) cache.delete(cache.keys().next().value);
  cache.set(key, { val: out, exp: Date.now() + TTL });
  return res.status(200).json(out);
}
