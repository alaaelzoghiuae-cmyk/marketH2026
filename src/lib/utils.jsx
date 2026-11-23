import { Edit } from 'lucide-react';
import { AD_THEMES, DEFAULT_SOURCING_BANNER, INITIAL_PAYMENT_METHODS } from '../data/constants.jsx';

export const Edit3 = Edit;

export const getAdTheme = ad => {
  if (ad && ad.theme && AD_THEMES[ad.theme]) return AD_THEMES[ad.theme];
  if (ad && ad.gradient) {
    const matchedKey = Object.keys(AD_THEMES).find(k => AD_THEMES[k].grad === ad.gradient);
    if (matchedKey) return AD_THEMES[matchedKey];
  }
  return AD_THEMES.indigo;
};

export const isFullBleedAdLayout = (ad) => {
  if (!ad) return false;
  const ly = ad.layout || 'editorial_split';
  return (ly === 'full_clean' || ly === 'full') && !!ad.image;
};

export const adInSchedule = ad => {
  const today = new Date().toISOString().slice(0, 10);
  if (ad.startDate && today < ad.startDate) return false;
  if (ad.endDate && today > ad.endDate) return false;
  return true;
};

export const localDayKey = (offset = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const detectVisitSource = () => {
  try {
    const qs = new URLSearchParams(window.location.search);
    const u = (qs.get('utm_source') || qs.get('ref') || qs.get('src') || '').toLowerCase().trim();
    if (u) {
      // Normalize utm aliases to the canonical source keys so the same
      // channel never splits into two counters (e.g. 'ig' vs 'instagram').
      const alias = { ig: 'instagram', insta: 'instagram', instagram: 'instagram', fb: 'facebook', facebook: 'facebook', wa: 'whatsapp', whatsapp: 'whatsapp', tt: 'tiktok', tiktok: 'tiktok', yt: 'youtube', youtube: 'youtube', x: 'twitter', twitter: 'twitter', google: 'google' };
      return alias[u] || u.slice(0, 24);
    }
    const ref = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : '';
    if (!ref || ref === window.location.hostname) return 'direct';
    if (/facebook|fb\.com|fb\.me/.test(ref)) return 'facebook';
    if (/instagram/.test(ref)) return 'instagram';
    if (/google/.test(ref)) return 'google';
    if (/tiktok/.test(ref)) return 'tiktok';
    if (/whatsapp|wa\.me/.test(ref)) return 'whatsapp';
    if (/t\.co|twitter|x\.com/.test(ref)) return 'twitter';
    if (/youtube/.test(ref)) return 'youtube';
    return 'other';
  } catch (e) {
    return 'direct';
  }
};

export const applyVisit = (cur, info) => {
  const base = cur && typeof cur === 'object' ? cur : {};
  const days = { ...(base.days || {}) };
  const day = { visits: 0, uniq: 0, newU: 0, ...(days[info.today] || {}) };
  day.visits += 1;
  if (info.firstToday) day.uniq += 1;
  if (info.isNewDevice) day.newU += 1;
  days[info.today] = day;
  const keep = {};
  Object.keys(days).sort().slice(-120).forEach(k => { keep[k] = days[k]; });
  const sources = { ...(base.sources || {}) };
  sources[info.source] = (sources[info.source] || 0) + 1;
  const t = { visits: 0, uniq: 0, newU: 0, ...(base.totals || {}) };
  t.visits += 1;
  if (info.firstToday) t.uniq += 1;
  if (info.isNewDevice) t.newU += 1;
  return { days: keep, sources, totals: t };
};

export const nowStamp = () => {
  const d = new Date();
  return `${localDayKey(0)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const readFileAsDataUrl = file =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(file);
  });

export const waLink = ph => `https://wa.me/20${String(ph || '').replace(/\D/g, '').replace(/^0/, '')}`;

export const getSourcingBanner = st => ({ ...DEFAULT_SOURCING_BANNER, ...((st && st.sourcingBanner) || {}) });

export const B64_UPLOAD_CACHE = new Map();

export const b64Key = str => {
  let h = 5381;
  const step = Math.max(1, Math.floor(str.length / 4000));
  for (let i = 0; i < str.length; i += step) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return `${str.length}_${h}`;
};

export const getPaymentMethods = (settings) =>
  settings && Array.isArray(settings.paymentMethods) && settings.paymentMethods.length > 0
    ? settings.paymentMethods
    : INITIAL_PAYMENT_METHODS;

export const normalizeDigits = (str) =>
  String(str || '')
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

export const generateAiProductDetails = (rawName, modelName = '', brandName = '', existingCategory = '') => {
  const n = String(rawName || '').trim();
  const low = `${n} ${existingCategory} ${brandName} ${modelName}`.toLowerCase();
  const cleanTitle = n || `${brandName} ${modelName}`.trim() || 'منتج أصلي من ELZOGHBI';

  let category = existingCategory || 'إكسسوارات ومستلزمات ذكية';
  let qualityGrade = 'أصلي توكيل';
  let warrantyText = 'ضمان 3 شهور ضد عيوب الصناعة والاستبدال الفوري';
  let colorsText = 'أسود, أبيض';
  let description = '';

  if (/ring\s*light|led|رينج|اضاءه|إضاءة|plokama/i.test(low)) {
    category = existingCategory || 'إضاءة وتصوير احترافي (Ring Light)';
    qualityGrade = 'أصلي معتمد';
    warrantyText = 'ضمان تجربة 14 يوم وضمان 3 شهور ضد عيوب الصناعة';
    colorsText = 'أسود';
    description = `✨ ${cleanTitle} — إضاءة LED احترافية عالية السطوع مع تحكم دقيق في درجات حرارة اللون (دافئ / محايد / أبيض ناصع) لتصوير الفيديو، الريلز، البث المباشر، ومكالمات العمل بجودة استوديو فائقة. تصميم عملي متين مع ثبات ممتاز وتشغيل مستقر لفترات طويلة.`;
  } else if (/iphone|ايفون|آيفون|used|كسر زيرو|gb|تيرا/i.test(low)) {
    category = existingCategory || 'أجهزة كسر زيرو وموبايلات';
    qualityGrade = 'أصلي أبل 100%';
    warrantyText = 'ضمان تجربة 14 يوم (فحص شامل لجميع الوظائف بدون فتح)';
    colorsText = 'تيتانيوم طبيعي, أسود, أبيض, أزرق';
    description = `📱 ${cleanTitle} — جهاز أصلي مفحوص بالكامل بأعلى معايير الجودة، حالة ممتازة ونظافة فائقة، كاميرات وشاشة وأداء سريع ومستقر، خالٍ تماماً من أي صيانة أو عيوب مع إمكانية المعاينة الكاملة قبل الاستلام.`;
  } else if (/شاش|screen|oled|incell|display|lcd/i.test(low)) {
    category = existingCategory || 'شاشات أصلية';
    qualityGrade = 'أصلي 100% (OLED)';
    warrantyText = 'ضمان 14 يوم تجربة قبل التركيب بدون آثار لحام أو نزع استيكر';
    colorsText = 'أسود';
    description = `📲 ${cleanTitle} — شاشة فائقة الوضوح بألوان مشبعة وسطوع عالٍ واستجابة لمس دقيقة وسريعة جداً، متوافقة تماماً مع الإطار الأصلي للجهاز ${modelName ? `(${modelName})` : ''} لضمان تركيب مثالي وأداء مطابق لشاشة المصنع.`;
  } else if (/بطاري|battery|mah|باور/i.test(low)) {
    category = existingCategory || 'بطاريات أصلية';
    qualityGrade = 'أصلي سعة حقيقية 100%';
    warrantyText = 'ضمان 3 شهور ضد انتفاخ البطارية أو ضعف الشحن';
    colorsText = 'قياسي';
    description = `🔋 ${cleanTitle} — بطارية عالية الكفاءة بسعة حقيقية معتمدة ودوائر حماية ذكية ضد الشحن الزائد وارتفاع الحرارة، تمنح جهازك عمراً أطول وأداءً مستقراً طوال اليوم.`;
  } else if (/شاحن|كابل|cable|charger|pd|gan|watt|18w|20w|45w|65w/i.test(low)) {
    category = existingCategory || 'شواحن وكابلات أصلية';
    qualityGrade = 'أصلي شحن فائق السرعة';
    warrantyText = 'ضمان 6 شهور استبدال فوري ضد عيوب الصناعة';
    colorsText = 'أبيض, أسود';
    description = `⚡ ${cleanTitle} — تقنية شحن سريع ذكية وآمنة تحافظ على صحة البطارية وتمنع السخونة الزائدة، مصنوع من خامات عالية التحمل مع نقل بيانات سريع ومستقر وتوافق كامل مع الأجهزة الحديثة.`;
  } else if (/سماع|airpods|buds|earphone|headphone|anc|ميكروفون/i.test(low)) {
    category = existingCategory || 'سماعات وساعات ذكية';
    qualityGrade = 'أصلي صوت نقي HD';
    warrantyText = 'ضمان 3 شهور ضد عيوب الصوت والبطارية';
    colorsText = 'أبيض, أسود';
    description = `🎧 ${cleanTitle} — جودة صوت محيطية نقية مع باس عميق وعزل فعال للضوضاء، مايكروفون واضح للمكالمات وبطارية تدوم لساعات طويلة مع اتصال بلوتوث فائق الثبات.`;
  } else {
    description = `⭐ ${cleanTitle} — منتج أصلي عالي الجودة مختار بعناية من متجر ELZOGHBI، خامات متينة وأداء موثوق مع فحص شامل قبل الشحن وضمان حقيقي لراحة بالك.`;
  }

  const compatibleText = [modelName, brandName].filter(Boolean).join(', ') || 'جميع الموديلات المتوافقة';
  return { category, qualityGrade, warrantyText, colorsText, compatibleText, description };
};

export const escapeHtml = (val) =>
  String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export const openCleanA4PrintWindow = (docTitle, bodyHtml) => {
  const win = window.open('', '_blank', 'width=1024,height=840');
  if (!win) {
    window.print();
    return;
  }
  win.document.open();
  win.document.write(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(docTitle)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
  <style>
    @page { size: A4 portrait; margin: 14mm 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 20px;
      background: #ffffff;
      color: #0f172a;
      font-family: 'Cairo', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.55;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .report-wrap { max-width: 900px; margin: 0 auto; }
    .hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #1d4ed8; padding-bottom: 14px; margin-bottom: 18px; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand-badge { width: 46px; height: 46px; border-radius: 12px; background: #1d4ed8; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 20px; }
    .hdr h1 { margin: 0; font-size: 20px; font-weight: 900; color: #0f172a; }
    .hdr p { margin: 2px 0 0; font-size: 11px; color: #475569; font-weight: 700; }
    .meta { text-align: left; font-size: 11px; color: #334155; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
    .kpi-box { border: 1px solid #cbd5e1; border-radius: 12px; padding: 10px 12px; background: #f8fafc; page-break-inside: avoid; }
    .kpi-label { font-size: 10px; color: #475569; font-weight: 700; }
    .kpi-val { font-size: 17px; font-weight: 900; color: #0f172a; margin-top: 2px; }
    .sec { margin-bottom: 18px; page-break-inside: avoid; }
    .sec-title { font-size: 13px; font-weight: 900; color: #1e3a8a; background: #eff6ff; border-right: 4px solid #2563eb; padding: 6px 10px; border-radius: 6px; margin-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #0f172a; color: #ffffff; text-align: right; padding: 7px 9px; font-weight: 800; border: 1px solid #1e293b; }
    td { padding: 6px 9px; border: 1px solid #cbd5e1; color: #0f172a; }
    tr:nth-child(even) td { background: #f8fafc; }
    .footer-sign { margin-top: 28px; padding-top: 12px; border-top: 1px dashed #94a3b8; display: flex; justify-content: space-between; font-size: 11px; color: #475569; font-weight: 700; }
    @media print {
      body { padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="report-wrap">${bodyHtml}</div>
  <script>
    setTimeout(function() { window.focus(); window.print(); }, 450);
  </script>
</body>
</html>`);
  win.document.close();
};

export const loadPersisted = (key, fallbackVal) => {
  try {
    const raw = window.localStorage.getItem('elzoghbi_v2_' + key) || window.localStorage.getItem('elzoghbi_v2_' + key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (key === 'siteSettings' && parsed && typeof parsed === 'object') {
        if (!parsed.storeName || /h-?market/i.test(parsed.storeName)) {
          parsed.storeName = 'ELZOGHBI';
        }
        if (parsed.storeSubtitle === 'MOBILE ACCESSORIES & SPARE PARTS SHOP') {
          parsed.storeSubtitle = 'SMART SHOPPING & ORIGINAL PRODUCTS';
        }
        if (parsed.storeTagline && parsed.storeTagline.includes('كل اللي محتاجه لموبايلك')) {
          parsed.storeTagline = 'تشكيلة مختارة من المنتجات الأصلية بأعلى معايير الجودة • ضمان معتمد وشحن سريع لجميع المحافظات';
        }
        return { ...fallbackVal, ...parsed };
      }
      if (key === 'clients' && Array.isArray(parsed)) {
        return parsed.map(c => ({
          ...c,
          birthDate: c?.birthDate || '1996-12-30',
          referralCode: c?.referralCode || `REF-${String(c?.phone || c?.id || '1000').replace(/[^0-9]/g, '').slice(-5) || '1000'}`,
          savedFamilyDevices: Array.isArray(c?.savedFamilyDevices) ? c.savedFamilyDevices : []
        }));
      }
      if (Array.isArray(fallbackVal)) {
        return Array.isArray(parsed) ? parsed : fallbackVal;
      }
      if (fallbackVal && typeof fallbackVal === 'object') {
        return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : fallbackVal;
      }
      return parsed !== undefined && parsed !== null ? parsed : fallbackVal;
    }
  } catch (err) {}
  return fallbackVal;
};
