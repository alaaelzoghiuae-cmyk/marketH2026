/**
 * ELZOGHBI MARKET — GSMArena & Smart Comparison Client Service
 *
 * Bridges the Karambo UI with /api/gsmarena (live m.gsmarena.com backend),
 * provides Arabic<->English phone query normalization, session caching,
 * graceful local-guide fallback, winner scoring, and WhatsApp/Print exports.
 */

const CLIENT_CACHE_PREFIX = 'elz_gsm_v1_';
const memCache = new Map();

function readCache(key) {
  if (memCache.has(key)) return memCache.get(key);
  try {
    const raw = window.sessionStorage.getItem(CLIENT_CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.exp > Date.now()) {
      memCache.set(key, parsed.val);
      return parsed.val;
    }
  } catch {}
  return null;
}

function writeCache(key, val, ttlMs = 30 * 60 * 1000) {
  memCache.set(key, val);
  try {
    window.sessionStorage.setItem(CLIENT_CACHE_PREFIX + key, JSON.stringify({ val, exp: Date.now() + ttlMs }));
  } catch {}
}

const AR_NUMS = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };

export function normalizePhoneText(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[٠-٩]/g, d => AR_NUMS[d] || d)
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/\s+/g, ' ')
    .trim();
}

const AR_TO_EN_TOKENS = [
  ['ايفون', 'iphone'], ['ابل', 'apple'], ['ايباد', 'ipad'],
  ['سامسونج', 'samsung'], ['سامسونغ', 'samsung'], ['جالاكسي', 'galaxy'], ['جالكسي', 'galaxy'], ['جلاكسي', 'galaxy'],
  ['شاومي', 'xiaomi'], ['شياومي', 'xiaomi'], ['ريدمي', 'redmi'], ['بوكو', 'poco'],
  ['اوبو', 'oppo'], ['رينو', 'reno'], ['ريلمي', 'realme'], ['فيفو', 'vivo'],
  ['هونر', 'honor'], ['ماجيك', 'magic'], ['انفنكس', 'infinix'], ['انفينيكس', 'infinix'],
  ['تكنو', 'tecno'], ['هواوي', 'huawei'], ['جوجل', 'google'], ['بيكسل', 'pixel'],
  ['ون بلس', 'oneplus'], ['نوثينج', 'nothing'], ['موتورولا', 'motorola'], ['نوكيا', 'nokia'],
  ['سوني', 'sony'], ['اسوس', 'asus'], ['ايتل', 'itel'],
  ['برو ماكس', 'pro max'], ['برو', 'pro'], ['ماكس', 'max'], ['الترا', 'ultra'],
  ['بلس', 'plus'], ['نوت', 'note'], ['ميني', 'mini'], ['لايت', 'lite'],
  ['فولد', 'fold'], ['فليب', 'flip'], ['اف اي', 'fe'], ['اس اي', 'se'],
  ['اس', 's'], ['ايه', 'a'], ['ام', 'm'], ['اف', 'f'], ['زد', 'z']
];

export function toEnglishPhoneQuery(raw) {
  let q = normalizePhoneText(raw);
  if (!q) return '';
  if (/[\u0600-\u06FF]/.test(q)) {
    for (const [ar, en] of AR_TO_EN_TOKENS) {
      const re = new RegExp(`(^|\\s)${ar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|$|\\d)`, 'g');
      q = q.replace(re, `$1${en}`);
    }
  }
  q = q.replace(/\b([samfzctx])\s+(\d{1,3})\b/gi, '$1$2');
  return q.replace(/\s+/g, ' ').trim();
}

export function matchesPhoneSearch(phone, rawQuery) {
  const qNorm = normalizePhoneText(rawQuery);
  if (!qNorm) return true;
  const qEn = toEnglishPhoneQuery(rawQuery);
  const hay = normalizePhoneText(`${phone.name || ''} ${phone.brand || ''} ${phone.slug || ''} ${phone.chipset || ''}`);
  const hayEn = toEnglishPhoneQuery(hay);
  const wordsNorm = qNorm.split(' ').filter(Boolean);
  const wordsEn = qEn.split(' ').filter(Boolean);
  const matchNorm = wordsNorm.every(w => hay.includes(w));
  const matchEn = wordsEn.length > 0 && wordsEn.every(w => hay.includes(w) || hayEn.includes(w));
  return matchNorm || matchEn;
}

export async function searchGsmarenaPhones(query, localPhones = []) {
  const q = String(query || '').trim();
  const localMatches = (localPhones || [])
    .filter(p => matchesPhoneSearch(p, q))
    .slice(0, 8)
    .map(p => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: p.brand,
      img: (p.images && p.images[0]) || '',
      price: p.price || 0,
      source: 'local',
      localPhone: p
    }));

  if (q.length < 2) {
    return { ok: true, live: false, results: localMatches, gsmCount: 0, localCount: localMatches.length };
  }

  const cacheKey = `q:${normalizePhoneText(q)}`;
  const cached = readCache(cacheKey);
  if (cached) {
    return mergeSearchResults(cached, localMatches, true);
  }

  try {
    const res = await fetch(`/api/gsmarena?action=search&q=${encodeURIComponent(q)}`);
    const ct = String(res.headers.get('content-type') || '');
    if (!res.ok || !ct.includes('application/json')) {
      return {
        ok: true,
        live: false,
        fallbackReason: 'local_dev',
        results: localMatches,
        gsmCount: 0,
        localCount: localMatches.length
      };
    }
    const data = await res.json();
    if (!data || !data.ok) {
      return {
        ok: true,
        live: false,
        fallbackReason: data?.rateLimited ? 'rate_limit' : 'error',
        error: data?.error || '',
        results: localMatches,
        gsmCount: 0,
        localCount: localMatches.length
      };
    }
    const gsmResults = Array.isArray(data.results) ? data.results : [];
    if (gsmResults.length > 0) writeCache(cacheKey, gsmResults, 30 * 60 * 1000);
    return mergeSearchResults(gsmResults, localMatches, true, data.translatedQuery);
  } catch {
    return {
      ok: true,
      live: false,
      fallbackReason: 'network',
      results: localMatches,
      gsmCount: 0,
      localCount: localMatches.length
    };
  }
}

function mergeSearchResults(gsmResults, localMatches, live, translatedQuery = '') {
  const merged = [];
  const seenNames = new Set();
  for (const item of gsmResults) {
    const key = normalizePhoneText(item.name);
    if (seenNames.has(key)) continue;
    seenNames.add(key);
    merged.push({ ...item, source: 'gsmarena' });
  }
  for (const loc of localMatches) {
    const key = normalizePhoneText(loc.name);
    if (seenNames.has(key)) continue;
    seenNames.add(key);
    merged.push(loc);
  }
  return {
    ok: true,
    live,
    translatedQuery,
    results: merged.slice(0, 24),
    gsmCount: gsmResults.length,
    localCount: localMatches.length
  };
}

export async function fetchGsmarenaDevice(slug) {
  const clean = String(slug || '').trim();
  if (!clean) return { ok: false, error: 'معرّف الجهاز فارغ' };
  const cacheKey = `dev:${clean}`;
  const cached = readCache(cacheKey);
  if (cached) return { ok: true, device: cached, cached: true };

  try {
    const res = await fetch(`/api/gsmarena?action=device&slug=${encodeURIComponent(clean)}`);
    const ct = String(res.headers.get('content-type') || '');
    if (!res.ok || !ct.includes('application/json')) {
      return { ok: false, error: 'خدمة المواصفات الحية غير متاحة مؤقتاً — جرّب بعد لحظات.' };
    }
    const data = await res.json();
    if (data && data.ok && data.device) {
      writeCache(cacheKey, data.device, 60 * 60 * 1000);
      return { ok: true, device: data.device };
    }
    return { ok: false, error: data?.error || 'تعذر جلب مواصفات الجهاز' };
  } catch {
    return { ok: false, error: 'تعذر الاتصال بخادم المواصفات' };
  }
}

export async function fetchGsmarenaPopular() {
  const cacheKey = 'popular';
  const cached = readCache(cacheKey);
  if (cached) return { ok: true, results: cached };
  try {
    const res = await fetch('/api/gsmarena?action=popular');
    const ct = String(res.headers.get('content-type') || '');
    if (!res.ok || !ct.includes('application/json')) return { ok: false, results: [] };
    const data = await res.json();
    if (data && data.ok && Array.isArray(data.results)) {
      writeCache(cacheKey, data.results, 30 * 60 * 1000);
      return { ok: true, results: data.results };
    }
    return { ok: false, results: [] };
  } catch {
    return { ok: false, results: [] };
  }
}

// ---------- Side-by-Side Comparison Matrix & Winner Scoring ----------
export function buildComparisonAnalysis(devices, formatMoney = (v) => `${Number(v || 0).toLocaleString('en-US')} ج.م`) {
  const list = (devices || []).filter(Boolean);
  if (list.length === 0) return { keyRows: [], groups: [], scores: {}, winnerId: null, verdict: '' };

  const scores = {};
  list.forEach(d => { scores[d.id] = 0; });

  const evalMetric = (vals, mode = 'max') => {
    const nums = vals.map(v => (typeof v === 'number' && isFinite(v) && v > 0 ? v : null));
    const valid = nums.filter(v => v !== null);
    if (valid.length < 2) return nums.map(() => false);
    const best = mode === 'min' ? Math.min(...valid) : Math.max(...valid);
    const worst = mode === 'min' ? Math.max(...valid) : Math.min(...valid);
    if (best === worst) return nums.map(() => false); // tie
    return nums.map(v => v === best);
  };

  const keyDefs = [
    { label: 'السعر الاسترشادي', raw: d => d.price || 0, fmt: d => d.price ? formatMoney(d.price) : (d.priceGlobal || '—'), mode: 'min' },
    { label: 'المعالج (Chipset)', raw: () => null, fmt: d => d.chipset || findSpecVal(d, ['المعالج', 'Chipset']) || '—', mode: 'none' },
    { label: 'حجم الشاشة', raw: d => d.screen || 0, fmt: d => d.screen ? `${d.screen} بوصة` : '—', mode: 'max' },
    { label: 'معدل التحديث', raw: d => d.refresh || 0, fmt: d => d.refresh ? `${d.refresh} هرتز` : '—', mode: 'max' },
    { label: 'الكاميرا الرئيسية', raw: d => d.camera || 0, fmt: d => d.camera ? `${d.camera} ميجا` : '—', mode: 'max' },
    { label: 'كاميرا السيلفي', raw: d => d.selfieCamera || 0, fmt: d => d.selfieCamera ? `${d.selfieCamera} ميجا` : (findSpecVal(d, ['السيلفي', 'الأمامية', 'Selfie']) || '—'), mode: 'max' },
    { label: 'البطارية', raw: d => d.battery || 0, fmt: d => d.battery ? `${Number(d.battery).toLocaleString('en-US')} مللي أمبير` : '—', mode: 'max' },
    { label: 'الشحن السريع', raw: d => d.chargeW || 0, fmt: d => d.chargeW ? `${d.chargeW} وات` : '—', mode: 'max' },
    { label: 'أعلى رام', raw: d => d.ramMax || 0, fmt: d => d.ramMax ? `${d.ramMax} جيجا` : '—', mode: 'max' },
    { label: 'أعلى تخزين', raw: d => d.storageMax || 0, fmt: d => d.storageMax ? (d.storageMax >= 1024 ? `${Math.round(d.storageMax / 1024)} تيرا` : `${d.storageMax} جيجا`) : '—', mode: 'max' },
    { label: 'الوزن (الأخف أفضل)', raw: d => d.weight || 0, fmt: d => d.weight ? `${d.weight} جرام` : '—', mode: 'min' },
    { label: 'مقاومة الماء والغبار', raw: () => null, fmt: d => d.ip || findSpecVal(d, ['مقاومة', 'IP68', 'IP67']) || '—', mode: 'none' },
    { label: 'دعم 5G', raw: d => (d.has5G ? 1 : 0), fmt: d => (d.has5G ? 'نعم (5G)' : (findSpecVal(d, ['التقنية', 'الشبكة']) || '—')), mode: 'none' }
  ];

  const keyRows = keyDefs.map(def => {
    const values = list.map(d => def.fmt(d));
    const wins = def.mode === 'none' ? list.map(() => false) : evalMetric(list.map(d => def.raw(d)), def.mode);
    wins.forEach((w, idx) => { if (w) scores[list[idx].id] = (scores[list[idx].id] || 0) + 1; });
    const allSame = values.every(v => v === values[0]);
    return { label: def.label, values, wins, isDiff: !allSame };
  });

  // Merge full spec groups across all compared devices
  const groupOrder = [];
  const groupMap = new Map();
  list.forEach((dev, di) => {
    (dev.specs || []).forEach(grp => {
      const gName = grp.group || 'مواصفات';
      if (!groupMap.has(gName)) {
        groupMap.set(gName, { group: gName, rowOrder: [], rowsMap: new Map() });
        groupOrder.push(gName);
      }
      const gObj = groupMap.get(gName);
      (grp.rows || []).forEach(([k, v]) => {
        if (!k) return;
        if (!gObj.rowsMap.has(k)) {
          gObj.rowsMap.set(k, list.map(() => '—'));
          gObj.rowOrder.push(k);
        }
        gObj.rowsMap.get(k)[di] = v || '—';
      });
    });
  });

  const groups = groupOrder.map(gName => {
    const gObj = groupMap.get(gName);
    const rows = gObj.rowOrder.map(k => {
      const values = gObj.rowsMap.get(k);
      const isDiff = !values.every(v => normalizePhoneText(v) === normalizePhoneText(values[0]));
      return { label: k, values, isDiff };
    });
    return { group: gName, rows };
  });

  // Determine overall winner
  let winnerId = null;
  let maxScore = -1;
  let tie = false;
  list.forEach(d => {
    const sc = scores[d.id] || 0;
    if (sc > maxScore) { maxScore = sc; winnerId = d.id; tie = false; }
    else if (sc === maxScore) { tie = true; }
  });
  const winner = list.find(d => d.id === winnerId);
  let verdict = '';
  if (list.length >= 2) {
    if (tie || maxScore <= 0) {
      verdict = 'الأجهزة متقاربة جداً في المواصفات الأساسية — القرار النهائي يعتمد على تفضيلك لنظام التشغيل والسعر المتاح حالياً.';
    } else if (winner) {
      verdict = `كرومبو يرجّح «${winner.name}» بتفوقه في ${maxScore} نقاط مقارنة أساسية (مع مراجعة السعر الفعلي والضمان قبل الشراء).`;
    }
  }

  return { keyRows, groups, scores, winnerId: tie ? null : winnerId, verdict };
}

function findSpecVal(device, keywords) {
  for (const grp of (device.specs || [])) {
    for (const [k, v] of (grp.rows || [])) {
      if (keywords.some(kw => String(k || '').toLowerCase().includes(kw.toLowerCase()))) return v;
    }
  }
  return '';
}

export function buildWhatsAppCompareText(devices, analysis, shareUrl = '') {
  const names = (devices || []).map(d => d.name).join(' 🆚 ');
  const lines = [
    `📊 *مقارنة كرومبو الشغلانة — ELZOGHBI MARKET*`,
    `📱 ${names}`,
    ''
  ];
  (analysis.keyRows || []).slice(0, 8).forEach(row => {
    lines.push(`• *${row.label}*: ${row.values.join(' | ')}`);
  });
  if (analysis.verdict) {
    lines.push('', `🕵️‍♂️ *حكم كرومبو*: ${analysis.verdict}`);
  }
  if (shareUrl) {
    lines.push('', `🔗 رابط المقارنة: ${shareUrl}`);
  }
  return lines.join('\n');
}

export function openPrintableComparisonWindow(devices, analysis) {
  const esc = (s) => String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const headers = devices.map(d => `<th style="padding:10px;border:1px solid #cbd5e1;background:#eff6ff;font-size:13px;">${esc(d.name)}<div style="font-size:11px;color:#1e4e8c;margin-top:4px;">نقاط التفوق: ${analysis.scores[d.id] || 0}</div></th>`).join('');
  const rowsHtml = (analysis.keyRows || []).map((r, i) => `
    <tr style="background:${i % 2 ? '#f8fafc' : '#fff'}">
      <td style="padding:8px 10px;border:1px solid #cbd5e1;font-weight:700;color:#475569;">${esc(r.label)}</td>
      ${r.values.map((v, vi) => `<td style="padding:8px 10px;border:1px solid #cbd5e1;${r.wins[vi] ? 'background:#ecfdf5;color:#047857;font-weight:800;' : ''}">${esc(v)}${r.wins[vi] ? ' ✓' : ''}</td>`).join('')}
    </tr>`).join('');
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>مقارنة كرومبو — ELZOGHBI MARKET</title>
  <style>body{font-family:Tahoma,Arial,sans-serif;padding:24px;color:#0f172a;} table{width:100%;border-collapse:collapse;margin-top:16px;} @media print{button{display:none!important;}}</style>
  </head><body>
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #1e4e8c;padding-bottom:12px;">
      <div><h1 style="margin:0;font-size:20px;color:#163b6b;">مقارنة كرومبو الشغلانة — ELZOGHBI MARKET</h1><div style="font-size:12px;color:#64748b;margin-top:4px;">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')}</div></div>
      <button onclick="window.print()" style="padding:8px 16px;background:#1e4e8c;color:#fff;border:0;border-radius:8px;font-weight:700;cursor:pointer;">طباعة / حفظ PDF</button>
    </div>
    ${analysis.verdict ? `<div style="margin-top:14px;padding:12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;font-size:13px;font-weight:700;color:#1e40af;">🕵️‍♂️ حكم كرومبو: ${esc(analysis.verdict)}</div>` : ''}
    <table><thead><tr><th style="padding:10px;border:1px solid #cbd5e1;background:#f1f5f9;">وجه المقارنة</th>${headers}</tr></thead><tbody>${rowsHtml}</tbody></table>
  </body></html>`;
  const w = window.open('', '_blank', 'width=960,height=740');
  if (w) { w.document.open(); w.document.write(html); w.document.close(); }
}
