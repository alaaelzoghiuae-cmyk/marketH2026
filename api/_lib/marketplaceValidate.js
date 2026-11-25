// Pure validation helpers for the marketplace API (no I/O → unit-testable).

export const CONDITIONS = ['like_new', 'excellent', 'good', 'fair', 'poor'];
export const SCREEN = ['perfect', 'minor_scratches', 'scratched', 'cracked'];
export const BODY = ['perfect', 'minor_wear', 'worn', 'dented'];
export const REPORT_REASONS = ['scam', 'fake_device', 'stolen', 'wrong_info', 'spam', 'abusive', 'other'];
export const MAX_IMAGE_BYTES = 350 * 1024;
export const MAX_IMAGE_SIDE = 1600;
export const MIN_IMAGE_SIDE = 200;

const URL_RE = /(https?:\/\/|www\.|\.com\b|\.net\b|t\.me\/|wa\.me\/|bit\.ly|@[a-z0-9_]{4,})/i;
const LONG_DIGITS_RE = /\d[\d\s\-]{8,}\d/;

export function normalizePhone(raw) {
  let d = String(raw || '').replace(/[٠-٩]/g, (c) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(c))).replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = '20' + d.slice(1);
  else if (d.length === 10 && d.startsWith('1')) d = '20' + d;
  if (!/^[1-9][0-9]{9,14}$/.test(d)) return null;
  if (d.startsWith('20') && !/^20(10|11|12|15)[0-9]{8}$/.test(d)) return null;
  return d;
}

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);

export function validateListingPayload(p, { partial = false } = {}) {
  const errors = [];
  const out = {};
  const need = (k, cond, msg) => { if (!partial || p[k] !== undefined) { if (!cond) errors.push(msg); } };
  const has = (k) => p[k] !== undefined && p[k] !== null;

  if (!partial || has('title')) { out.title = clean(p.title, 90); need('title', out.title.length >= 3, 'اسم الموبايل قصير جدًا'); }
  if (!partial || has('brand')) { out.brand = clean(p.brand, 40); need('brand', out.brand.length >= 2, 'اختر الماركة'); }
  if (!partial || has('model')) { out.model = clean(p.model, 60); need('model', out.model.length >= 1, 'اكتب الموديل'); }
  if (!partial || has('storage')) { out.storage = clean(p.storage, 12); need('storage', /^\d{1,4}\s?(GB|TB|MB)$/i.test(out.storage), 'اختر سعة التخزين'); }
  if (!partial || has('condition')) { out.condition = p.condition; need('condition', CONDITIONS.includes(p.condition), 'اختر حالة الجهاز'); }
  if (!partial || has('screen_condition')) { out.screen_condition = p.screen_condition; need('screen_condition', SCREEN.includes(p.screen_condition), 'اختر حالة الشاشة'); }
  if (!partial || has('body_condition')) { out.body_condition = p.body_condition; need('body_condition', BODY.includes(p.body_condition), 'اختر حالة الهيكل'); }
  if (has('battery_health') && p.battery_health !== '') {
    const b = Number(p.battery_health);
    if (!Number.isFinite(b) || b < 1 || b > 100) errors.push('صحة البطارية من 1 إلى 100');
    else out.battery_health = Math.round(b);
  } else if (has('battery_health')) out.battery_health = null;
  if (has('has_repairs')) out.has_repairs = p.has_repairs === true || p.has_repairs === 'true';
  if (has('defects')) out.defects = clean(p.defects, 600) || null;
  if (has('description')) out.description = clean(p.description, 1200) || null;
  if (!partial || has('price')) {
    const price = Number(p.price);
    out.price = price;
    need('price', Number.isFinite(price) && price >= 100 && price <= 2000000, 'السعر لازم يكون بين 100 و 2,000,000 جنيه');
  }
  if (!partial || has('city')) { out.city = clean(p.city, 40); need('city', out.city.length >= 2, 'اختر المدينة'); }
  if (has('area')) out.area = clean(p.area, 60) || null;
  if (!partial || has('contact_phone')) {
    const ph = normalizePhone(p.contact_phone);
    out.contact_phone = ph;
    need('contact_phone', !!ph, 'رقم واتساب غير صحيح (مثال: 01012345678)');
  }
  if (has('show_contact')) out.show_contact = p.show_contact !== false && p.show_contact !== 'false';

  for (const k of ['title', 'description', 'defects', 'area']) {
    const v = out[k];
    if (v && (URL_RE.test(v) || LONG_DIGITS_RE.test(v))) errors.push('ممنوع وضع روابط أو أرقام تواصل داخل النص — التواصل بيتم عبر زر واتساب');
  }
  return { ok: errors.length === 0, errors: [...new Set(errors)], value: out };
}

// ---------------------------- image inspection -----------------------------
export function inspectImage(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 32) return { ok: false, error: 'ملف الصورة غير صالح' };
  if (buf.length > MAX_IMAGE_BYTES) return { ok: false, error: 'حجم الصورة أكبر من الحد المسموح (350 ك.ب بعد الضغط)' };
  let type = null; let w = 0; let h = 0;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    type = 'image/jpeg';
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const m = buf[i + 1];
      if (m === 0xe1 && buf.slice(i + 4, i + 10).toString('latin1') === 'Exif\u0000\u0000') return { ok: false, error: 'الصورة تحتوي بيانات EXIF — أعد تحميلها من صفحة الرفع ليتم تنظيفها' };
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) { h = buf.readUInt16BE(i + 5); w = buf.readUInt16BE(i + 7); break; }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  } else if (buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    type = 'image/png'; w = buf.readUInt32BE(16); h = buf.readUInt32BE(20);
  } else if (buf.slice(0, 4).toString('latin1') === 'RIFF' && buf.slice(8, 12).toString('latin1') === 'WEBP') {
    type = 'image/webp';
    const chunk = buf.slice(12, 16).toString('latin1');
    if (chunk === 'VP8 ') { w = buf.readUInt16LE(26) & 0x3fff; h = buf.readUInt16LE(28) & 0x3fff; }
    else if (chunk === 'VP8L') { const b = buf.readUInt32LE(21); w = (b & 0x3fff) + 1; h = ((b >> 14) & 0x3fff) + 1; }
    else if (chunk === 'VP8X') { w = 1 + buf.readUIntLE(24, 3); h = 1 + buf.readUIntLE(27, 3); }
    const head = buf.slice(0, Math.min(buf.length, 4096)).toString('latin1');
    if (head.includes('EXIF') || head.includes('XMP ')) return { ok: false, error: 'الصورة تحتوي بيانات وصفية غير مسموحة' };
  }
  if (!type) return { ok: false, error: 'نوع الملف غير مسموح — الصيغ المسموحة: WebP / JPEG / PNG' };
  if (!w || !h) return { ok: false, error: 'تعذر قراءة أبعاد الصورة' };
  if (Math.max(w, h) > MAX_IMAGE_SIDE) return { ok: false, error: 'أبعاد الصورة كبيرة جدًا' };
  if (Math.min(w, h) < MIN_IMAGE_SIDE) return { ok: false, error: 'الصورة صغيرة جدًا — اختر صورة أوضح للجهاز' };
  return { ok: true, type, width: w, height: h, ext: type === 'image/webp' ? 'webp' : type === 'image/png' ? 'png' : 'jpg' };
}

export function decodeDataUrl(s) {
  const m = /^data:(image\/(?:webp|jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(String(s || ''));
  if (!m) return null;
  return Buffer.from(m[2], 'base64');
}

// ------------------------------ WhatsApp link ------------------------------
export function buildWhatsAppUrl({ phone, title, publicId, price }) {
  const p = normalizePhone(phone);
  if (!p) return null;
  const priceTxt = Number(price).toLocaleString('en-US', { maximumFractionDigits: 0 });
  const msg = [
    'مرحباً، رأيت إعلان موبايلك على Elzoghbi Market وأرغب في الاستفسار عنه.',
    `اسم الجهاز: ${clean(title, 90)}`,
    `رقم الإعلان: ${Number(publicId)}`,
    `السعر المعروض: ${priceTxt} جنيه`,
    'هل الجهاز ما زال متاحاً؟'
  ].join('\n');
  return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
}
