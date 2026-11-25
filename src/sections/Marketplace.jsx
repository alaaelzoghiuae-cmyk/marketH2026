import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, ShieldAlert, MessageCircle, Flag, MapPin, Smartphone, Plus, Upload, Check, Loader2, Star, Clock, Pencil, BadgeCheck, ChevronLeft, FileText, Eye, EyeOff } from 'lucide-react';
import { compressImageFile } from '../lib/imageCompress.js';
import { MP_CLAUSES, MP_SAFETY_TIPS, MP_SAFETY_TITLE, MP_DISCLAIMER, MP_TERMS_SECTIONS, MP_LEGAL_NOTE, MP_TERMS_VERSION } from '../data/marketplaceTerms.js';

// ----------------------------------------------------------------------------- constants
export const STATUS_META = {
  pending_review: { label: 'قيد المراجعة', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30' },
  approved: { label: 'تمت الموافقة', cls: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30' },
  rejected: { label: 'مرفوض', cls: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30' },
  published: { label: 'منشور', cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30' },
  sold: { label: 'تم البيع', cls: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30' },
  expired: { label: 'منتهي', cls: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30' },
  hidden: { label: 'مخفي', cls: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30' }
};
export const COND = { like_new: 'كالجديد', excellent: 'ممتاز', good: 'جيد', fair: 'مقبول', poor: 'يحتاج صيانة' };
export const SCREEN = { perfect: 'سليمة تمامًا', minor_scratches: 'خدوش خفيفة', scratched: 'خدوش واضحة', cracked: 'مكسورة' };
export const BODY = { perfect: 'سليم تمامًا', minor_wear: 'استخدام خفيف', worn: 'علامات استخدام واضحة', dented: 'خبطات / كسر' };
const BRANDS = ['Apple', 'Samsung', 'Xiaomi', 'Oppo', 'Realme', 'Honor', 'Vivo', 'Infinix', 'Tecno', 'Huawei', 'Google', 'OnePlus', 'Motorola', 'Nokia', 'أخرى'];
const STORAGES = ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB'];
const CITIES = ['القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الشرقية', 'الدقهلية', 'الغربية', 'المنوفية', 'البحيرة', 'كفر الشيخ', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'مطروح', 'جنوب سيناء', 'شمال سيناء', 'البحر الأحمر', 'الوادي الجديد', 'أخرى'];
const REPORT_REASONS = { scam: 'احتيال / نصب', fake_device: 'جهاز مقلد', stolen: 'جهاز مسروق', wrong_info: 'بيانات غير صحيحة', spam: 'إعلان مكرر / مزعج', abusive: 'محتوى مسيء', other: 'سبب آخر' };

const money = (n) => `${Number(n || 0).toLocaleString('ar-EG')} ج.م`;
const dateAr = (d) => { try { return new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return ''; } };
const inputCls = 'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm font-semibold text-fg outline-none focus:border-[#0071E3] focus:ring-2 focus:ring-[#0071E3]/20';
const labelCls = 'block text-[12px] font-bold text-muted mb-1';

// ----------------------------------------------------------------------------- API helpers
export async function mpApi(action, body = {}) {
  try {
    const r = await fetch('/api/marketplace', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...body }) });
    const j = await r.json().catch(() => ({}));
    return { ...j, ok: r.ok && j.ok !== false, status: r.status };
  } catch (e) { return { ok: false, error: 'تعذر الاتصال بالسيرفر — تأكد من الإنترنت' }; }
}
const TOKEN_KEY = 'elz_mp_token';
export const getMpToken = () => { try { return window.sessionStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } };
const setMpToken = (t) => { try { if (t) window.sessionStorage.setItem(TOKEN_KEY, t); else window.sessionStorage.removeItem(TOKEN_KEY); } catch (e) { /* ignore */ } };
export async function mpLogin(phone, password) {
  const r = await mpApi('auth', { phone, password });
  if (r.ok && r.token) setMpToken(r.token);
  return r;
}
export const openSellPhone = (detail = {}) => window.dispatchEvent(new CustomEvent('elz:sell-open', { detail }));

let _listCache = { ts: 0, rows: null };
async function fetchPublicListings(sbUrl, sbKey, force) {
  if (!force && _listCache.rows && Date.now() - _listCache.ts < 60_000) return { rows: _listCache.rows };
  try {
    const r = await fetch(`${sbUrl}/rest/v1/marketplace_public_listings?select=*&order=published_at.desc&limit=300`, { headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}` } });
    if (r.status === 404) return { rows: [], notReady: true };
    if (!r.ok) return { rows: [], error: true };
    const rows = await r.json();
    _listCache = { ts: Date.now(), rows };
    return { rows };
  } catch (e) { return { rows: [], error: true }; }
}

// ----------------------------------------------------------------------------- small UI parts
export function SafetyBox({ compact = false }) {
  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-start">
      <div className="flex items-center gap-2 font-black text-[14px] text-amber-800 dark:text-amber-200"><ShieldAlert className="w-5 h-5 shrink-0" /> {MP_SAFETY_TITLE}</div>
      {!compact && (
        <ul className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[12.5px] font-semibold text-fg/90 list-disc ps-5">
          {MP_SAFETY_TIPS.map((t) => <li key={t}>{t}</li>)}
        </ul>
      )}
      <p className="mt-2 text-[11.5px] font-bold text-amber-900/80 dark:text-amber-100/80 leading-relaxed">{MP_DISCLAIMER}</p>
    </div>
  );
}

export function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending_review;
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-black ${m.cls}`}>{m.label}</span>;
}

// Professional image stage: never square-crops the phone — contained, with a soft blurred backdrop (works in dark mode).
export function PhoneStage({ src, alt, ratio = 'aspect-[4/3]', className = '' }) {
  return (
    <div className={`relative ${ratio} w-full overflow-hidden rounded-[22px] bg-gradient-to-b from-[#f5f5f7] to-[#e4e4ea] dark:from-[#2c2c2f] dark:to-[#1c1c1e] ring-1 ring-black/5 dark:ring-white/10 ${className}`}>
      {src ? (
        <>
          <img src={src} alt="" aria-hidden="true" loading="lazy" className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40 dark:opacity-30" />
          <img src={src} alt={alt || ''} loading="lazy" decoding="async" className="relative z-10 w-full h-full object-contain p-2" />
        </>
      ) : <div className="absolute inset-0 flex items-center justify-center text-muted"><Smartphone className="w-12 h-12" strokeWidth={1.25} /></div>}
    </div>
  );
}

function Modal({ open, onClose, title, children, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`bg-bg text-fg w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-xl'} max-h-[94vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] border border-line shadow-2xl`}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-4 bg-bg/95 backdrop-blur border-b border-line">
          <h3 className="font-black text-[17px]">{title}</h3>
          <button type="button" onClick={onClose} aria-label="إغلاق" className="w-9 h-9 rounded-full bg-surface2 hover:bg-line flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export function MarketTermsModal({ open, onClose }) {
  return (
    <Modal open={open} onClose={onClose} title="شروط إعلانات المستخدمين — بيع عندنا" wide>
      <div className="space-y-4 text-[13.5px] leading-relaxed">
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-[12px] font-bold">{MP_LEGAL_NOTE} (إصدار: {MP_TERMS_VERSION})</div>
        {MP_TERMS_SECTIONS.map((s, i) => (<section key={s.title}><h4 className="font-black mb-1">{i + 1}. {s.title}</h4><p className="text-muted font-semibold">{s.body}</p></section>))}
        <section><h4 className="font-black mb-1">إقرارات صاحب الإعلان (إلزامية قبل النشر)</h4>
          <ol className="list-decimal ps-5 space-y-1 text-muted font-semibold">{MP_CLAUSES.map((c) => <li key={c}>{c}</li>)}</ol></section>
        <SafetyBox compact />
      </div>
    </Modal>
  );
}

// ----------------------------------------------------------------------------- report dialog
function ReportDialog({ open, onClose, listing, showToast }) {
  const [kind, setKind] = useState('listing'); const [reason, setReason] = useState('scam'); const [details, setDetails] = useState(''); const [busy, setBusy] = useState(false);
  if (!listing) return null;
  const send = async () => {
    setBusy(true);
    const r = await mpApi('report', { id: listing.public_id, kind, reason, details, token: getMpToken() });
    setBusy(false);
    if (r.ok) { showToast && showToast('وصلنا بلاغك — شكرًا لمساعدتك في حماية المجتمع', 'success'); onClose(); setDetails(''); }
    else showToast && showToast(r.error || 'تعذر إرسال البلاغ', 'error');
  };
  return (
    <Modal open={open} onClose={onClose} title="إبلاغ عن إعلان / بائع">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {[['listing', 'الإعلان نفسه'], ['seller', 'البائع']].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setKind(k)} className={`py-2 rounded-xl text-xs font-black border ${kind === k ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-surface border-line text-fg'}`}>{l}</button>
          ))}
        </div>
        <div><label className={labelCls}>السبب</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls}>{Object.entries(REPORT_REASONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
        <div><label className={labelCls}>تفاصيل (اختياري)</label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value.slice(0, 600))} rows={3} className={inputCls} placeholder="اكتب ما حدث باختصار — لا تكتب بيانات شخصية حساسة" /></div>
        <button type="button" disabled={busy} onClick={send} className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 disabled:opacity-60 text-white font-black text-sm">{busy ? 'جاري الإرسال...' : 'إرسال البلاغ'}</button>
      </div>
    </Modal>
  );
}

// ----------------------------------------------------------------------------- sell / edit modal
const blankForm = { title: '', brand: 'Apple', model: '', storage: '128GB', condition: 'good', battery_health: '', screen_condition: 'perfect', body_condition: 'perfect', has_repairs: 'false', defects: '', description: '', price: '', city: 'القاهرة', area: '', contact_phone: '', show_contact: true };

export function SellPhoneModal({ open, onClose, currentClient, openLogin, showToast, editing = null }) {
  const [f, setF] = useState(blankForm);
  const [img, setImg] = useState(null); // {dataUrl, bytes, width, height}
  const [imgBusy, setImgBusy] = useState(false);
  const [agree, setAgree] = useState(false);
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [termsOpen, setTermsOpen] = useState(false);
  const fileRef = useRef(null);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!open) return;
    setDone(null); setImg(null); setAgree(false); setPw('');
    if (editing) {
      setF({ ...blankForm, ...Object.fromEntries(Object.keys(blankForm).map((k) => [k, editing[k] === null || editing[k] === undefined ? blankForm[k] : (typeof editing[k] === 'boolean' && k === 'has_repairs' ? String(editing[k]) : editing[k])])) });
    } else {
      setF({ ...blankForm, contact_phone: (currentClient && currentClient.phone) || '' });
    }
  }, [open, editing, currentClient]);

  const pickFile = async (file) => {
    if (!file) return;
    setImgBusy(true);
    try { setImg(await compressImageFile(file)); } catch (e) { showToast && showToast(e.message || 'تعذر معالجة الصورة', 'error'); }
    setImgBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!currentClient) { openLogin && openLogin(); return; }
    if (!editing) {
      if (!img) { showToast && showToast('أضف صورة الجهاز أولًا', 'warning'); return; }
      if (!agree) { showToast && showToast('لازم توافق على البنود الـ 12 قبل النشر', 'warning'); return; }
    }
    setBusy(true);
    let token = getMpToken();
    if (!token) {
      if (!pw) { setBusy(false); showToast && showToast('اكتب كلمة مرور حسابك لتأكيد هويتك', 'warning'); return; }
      const a = await mpLogin(currentClient.phone, pw);
      if (!a.ok) { setBusy(false); showToast && showToast(a.error || 'كلمة المرور غير صحيحة', 'error'); return; }
      token = a.token;
    }
    const payload = { ...f, has_repairs: f.has_repairs === 'true' };
    let r;
    if (editing) {
      const patch = {};
      Object.keys(payload).forEach((k) => { const o = editing[k]; if (String(payload[k] ?? '') !== String(o ?? '')) patch[k] = payload[k]; });
      r = await mpApi('update', { token, op: 'edit', listingId: editing.id, patch, image: img ? img.dataUrl : undefined });
    } else {
      r = await mpApi('submit', { token, payload, image: img.dataUrl, clauses: MP_CLAUSES.map(() => true) });
    }
    setBusy(false);
    if (r.needAuth) { setMpToken(''); showToast && showToast('انتهت جلسة التأكيد — اكتب كلمة المرور مرة أخرى', 'warning'); return; }
    if (!r.ok) { showToast && showToast(r.error || 'تعذر الحفظ', 'error'); return; }
    window.dispatchEvent(new Event('elz:mp-changed'));
    setDone(editing ? { edit: true, resubmitted: r.result && r.result.resubmitted } : { public_id: r.listing && r.listing.public_id });
  };

  if (!open) return null;
  if (done) {
    return (
      <Modal open onClose={onClose} title={editing ? 'تم حفظ التعديل' : 'تم استلام إعلانك'}>
        <div className="text-center space-y-3 py-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500 flex items-center justify-center"><Check className="w-9 h-9 text-white" strokeWidth={3} /></div>
          <p className="font-black text-lg">{editing ? (done.resubmitted ? 'التعديل جوهري — الإعلان رجع للمراجعة' : 'تم تحديث إعلانك') : 'إعلانك الآن قيد المراجعة'}</p>
          <p className="text-sm text-muted font-semibold">{editing ? '' : `رقم الإعلان #${done.public_id || ''} — لن يظهر للجمهور إلا بعد موافقة الإدارة. تابع حالته من حسابك ← إعلاناتي للبيع.`}</p>
          <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-full bg-[#0071E3] text-white font-black text-sm">تمام</button>
        </div>
      </Modal>
    );
  }
  return (
    <>
      <Modal open onClose={onClose} title={editing ? `تعديل الإعلان #${editing.public_id}` : 'اعرض موبايلك للبيع'} wide>
        {!currentClient ? (
          <div className="text-center space-y-3 py-6">
            <p className="font-bold">لازم تسجّل دخولك الأول عشان تعرض موبايلك للبيع (بنتحقق من هوية كل بائع).</p>
            <button type="button" onClick={() => { onClose(); openLogin && openLogin(); }} className="px-6 py-2.5 rounded-full bg-[#0071E3] text-white font-black text-sm">تسجيل الدخول / إنشاء حساب</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <SafetyBox compact />
            {editing && editing.status !== 'sold' && <p className="text-[12px] font-bold text-muted rounded-xl bg-surface2 p-3">تعديل (الجهاز / الصورة / الحالة / المدينة / رقم التواصل) هيرجّع الإعلان للمراجعة. تعديل السعر والوصف بس بيتحدّث فورًا.</p>}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><label className={labelCls}>اسم الموبايل *</label><input required minLength={3} maxLength={90} value={f.title} onChange={(e) => set('title', e.target.value)} className={inputCls} placeholder="مثال: iPhone 13 Pro 256GB أزرق" /></div>
              <div><label className={labelCls}>الماركة *</label><select value={f.brand} onChange={(e) => set('brand', e.target.value)} className={inputCls}>{BRANDS.map((b) => <option key={b}>{b}</option>)}</select></div>
              <div><label className={labelCls}>الموديل *</label><input required maxLength={60} value={f.model} onChange={(e) => set('model', e.target.value)} className={inputCls} placeholder="iPhone 13 Pro" /></div>
              <div><label className={labelCls}>سعة التخزين *</label><select value={f.storage} onChange={(e) => set('storage', e.target.value)} className={inputCls}>{STORAGES.map((b) => <option key={b}>{b}</option>)}</select></div>
              <div><label className={labelCls}>حالة الجهاز *</label><select value={f.condition} onChange={(e) => set('condition', e.target.value)} className={inputCls}>{Object.entries(COND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label className={labelCls}>حالة الشاشة *</label><select value={f.screen_condition} onChange={(e) => set('screen_condition', e.target.value)} className={inputCls}>{Object.entries(SCREEN).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label className={labelCls}>حالة الهيكل الخارجي *</label><select value={f.body_condition} onChange={(e) => set('body_condition', e.target.value)} className={inputCls}>{Object.entries(BODY).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label className={labelCls}>صحة البطارية % (إن وُجدت)</label><input type="number" min="1" max="100" value={f.battery_health} onChange={(e) => set('battery_health', e.target.value)} className={inputCls} placeholder="مثال: 87" /></div>
              <div><label className={labelCls}>إصلاحات سابقة؟</label><select value={f.has_repairs} onChange={(e) => set('has_repairs', e.target.value)} className={inputCls}><option value="false">لا، لم يُصلح من قبل</option><option value="true">نعم، تم إصلاحه</option></select></div>
              <div className="sm:col-span-2"><label className={labelCls}>العيوب (إن وُجدت)</label><input maxLength={600} value={f.defects} onChange={(e) => set('defects', e.target.value)} className={inputCls} placeholder="اذكر أي عيب بصراحة — ده بيزوّد ثقة المشتري" /></div>
              <div className="sm:col-span-2"><label className={labelCls}>وصف إضافي</label><textarea rows={2} maxLength={1200} value={f.description} onChange={(e) => set('description', e.target.value)} className={inputCls} placeholder="الملحقات، الضمان، سبب البيع..." /></div>
              <div><label className={labelCls}>السعر المطلوب (جنيه) *</label><input required type="number" min="100" max="2000000" value={f.price} onChange={(e) => set('price', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>رقم واتساب للتواصل *</label><input required inputMode="tel" value={f.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} className={inputCls} placeholder="01012345678" dir="ltr" /></div>
              <div><label className={labelCls}>المدينة *</label><select value={f.city} onChange={(e) => set('city', e.target.value)} className={inputCls}>{CITIES.map((b) => <option key={b}>{b}</option>)}</select></div>
              <div><label className={labelCls}>المنطقة</label><input maxLength={60} value={f.area} onChange={(e) => set('area', e.target.value)} className={inputCls} placeholder="مثال: مدينة نصر" /></div>
              <label className="sm:col-span-2 flex items-center gap-2 text-[12.5px] font-bold"><input type="checkbox" checked={f.show_contact} onChange={(e) => set('show_contact', e.target.checked)} /> أسمح للمشترين بالتواصل معي عبر واتساب (الرقم لا يظهر كنص — بيُستخدم لفتح المحادثة فقط)</label>
            </div>

            <div>
              <label className={labelCls}>صورة الجهاز {editing ? '(اختياري — تغييرها يرجّع الإعلان للمراجعة)' : '*'} — صورة واحدة فقط</label>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { if (e.target.files && e.target.files.length > 1) showToast && showToast('مسموح بصورة واحدة فقط — هنستخدم الأولى', 'warning'); pickFile(e.target.files && e.target.files[0]); }} />
              {img || (editing && editing.image_url) ? (
                <div className="grid sm:grid-cols-[220px,1fr] gap-3 items-center">
                  <PhoneStage src={img ? img.dataUrl : editing.image_url} alt="معاينة" />
                  <div className="space-y-2 text-[12px] font-bold text-muted">
                    {img && <p>تم الضغط تلقائيًا: {(img.bytes / 1024).toFixed(0)} ك.ب · {img.width}×{img.height} · {img.type.replace('image/', '').toUpperCase()} (قبل الضغط {(img.originalBytes / 1024).toFixed(0)} ك.ب)</p>}
                    <button type="button" onClick={() => fileRef.current && fileRef.current.click()} className="px-4 py-2 rounded-xl bg-surface2 hover:bg-line text-fg font-black text-xs">تغيير الصورة</button>
                  </div>
                </div>
              ) : (
                <button type="button" disabled={imgBusy} onClick={() => fileRef.current && fileRef.current.click()} className="w-full rounded-2xl border-2 border-dashed border-line hover:border-[#0071E3] py-8 flex flex-col items-center gap-2 text-muted font-bold text-sm">
                  {imgBusy ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}{imgBusy ? 'جاري الضغط...' : 'اضغط لاختيار صورة (JPG / PNG / WebP)'}
                </button>
              )}
            </div>

            {!editing && (
              <div className="rounded-2xl border border-line bg-surface p-3 space-y-2">
                <div className="flex items-center justify-between"><span className="font-black text-sm">إقرارات وموافقة قانونية (إلزامية)</span>
                  <button type="button" onClick={() => setTermsOpen(true)} className="text-[11px] font-black text-[#0066CC] hover:underline flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> الشروط الكاملة</button></div>
                <ol className="list-decimal ps-5 space-y-1 text-[12px] font-semibold text-muted max-h-44 overflow-y-auto pe-2">{MP_CLAUSES.map((c) => <li key={c}>{c}</li>)}</ol>
                <label className="flex items-start gap-2 text-[13px] font-black"><input type="checkbox" className="mt-1" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> أقر وأوافق على جميع البنود الـ 12 أعلاه (إصدار {MP_TERMS_VERSION})</label>
              </div>
            )}

            {!getMpToken() && (
              <div><label className={labelCls}>كلمة مرور حسابك (لتأكيد هويتك — ما بتتخزنش)</label><input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} /></div>
            )}
            <button type="submit" disabled={busy || imgBusy} className="w-full py-3.5 rounded-2xl bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-60 text-white font-black text-[15px]">{busy ? 'جاري الإرسال...' : editing ? 'حفظ التعديلات' : 'أرسل الإعلان للمراجعة'}</button>
          </form>
        )}
      </Modal>
      <MarketTermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
    </>
  );
}

// Mounted once in App: opens the sell/edit modal from anywhere via openSellPhone().
export function MarketplaceHost({ currentClient, openLogin, showToast }) {
  const [st, setSt] = useState({ open: false, editing: null });
  useEffect(() => {
    const on = (e) => setSt({ open: true, editing: (e.detail && e.detail.editing) || null });
    window.addEventListener('elz:sell-open', on);
    return () => window.removeEventListener('elz:sell-open', on);
  }, []);
  return <SellPhoneModal open={st.open} editing={st.editing} onClose={() => setSt({ open: false, editing: null })} currentClient={currentClient} openLogin={openLogin} showToast={showToast} />;
}

// ----------------------------------------------------------------------------- public marketplace page
function ListingCard({ l, onOpen }) {
  return (
    <article className="group rounded-[26px] bg-surface border border-line overflow-hidden flex flex-col hover:shadow-[0_18px_40px_-18px_rgba(0,0,0,0.35)] transition">
      <button type="button" onClick={() => onOpen(l)} className="block p-2.5 pb-0"><PhoneStage src={l.image_url} alt={l.title} /></button>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-black">
          {l.is_featured && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white"><Star className="w-3 h-3" /> مميز</span>}
          <span className="px-2 py-0.5 rounded-full bg-surface2 text-muted">{l.brand}</span>
          <span className="px-2 py-0.5 rounded-full bg-surface2 text-muted">{l.storage}</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">{COND[l.condition] || l.condition}</span>
        </div>
        <button type="button" onClick={() => onOpen(l)} className="text-start font-black text-[15px] leading-snug text-fg line-clamp-2 hover:text-[#0066CC]">{l.title}</button>
        <div className="text-[12px] font-bold text-muted">{l.model}</div>
        <div className="mt-auto pt-2 flex items-end justify-between gap-2">
          <div><div className="text-xl font-black text-[#0066CC] dark:text-[#2997FF]">{money(l.price)}</div>
            <div className="text-[11px] font-bold text-muted flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{l.city}{l.area ? ` · ${l.area}` : ''} · <Clock className="w-3 h-3" />{dateAr(l.published_at)}</div></div>
          <button type="button" onClick={() => onOpen(l)} className="shrink-0 px-4 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-black">عرض التفاصيل</button>
        </div>
      </div>
    </article>
  );
}

function ListingDetail({ l, onBack, showToast }) {
  const [report, setReport] = useState(false);
  const [wa, setWa] = useState(false);
  const contact = async () => {
    const w = window.open('', '_blank'); // opened synchronously to avoid popup blockers
    setWa(true);
    try {
      const r = await fetch(`/api/marketplace?action=contact&id=${encodeURIComponent(l.public_id)}`);
      const j = await r.json();
      if (j && j.ok && /^https:\/\/wa\.me\/\d{10,15}\?text=/.test(j.url)) { if (w) w.location.href = j.url; else window.location.href = j.url; }
      else { if (w) w.close(); showToast && showToast((j && j.error) || 'التواصل غير متاح لهذا الإعلان', 'error'); }
    } catch (e) { if (w) w.close(); showToast && showToast('تعذر فتح واتساب الآن', 'error'); }
    setWa(false);
  };
  const rows = [['الماركة', l.brand], ['الموديل', l.model], ['السعة', l.storage], ['حالة الجهاز', COND[l.condition]], ['حالة الشاشة', SCREEN[l.screen_condition]], ['حالة الهيكل', BODY[l.body_condition]], ['صحة البطارية', l.battery_health ? `${l.battery_health}%` : 'غير محددة'], ['إصلاحات سابقة', l.has_repairs ? 'نعم' : 'لا'], ['المدينة', `${l.city}${l.area ? ' — ' + l.area : ''}`], ['تاريخ الإعلان', dateAr(l.published_at)], ['رقم الإعلان', `#${l.public_id}`]];
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm font-black text-[#0066CC] dark:text-[#2997FF]"><ChevronLeft className="w-4 h-4 rotate-180" /> الرجوع لبيع عندنا</button>
      <div className="grid lg:grid-cols-2 gap-6">
        <PhoneStage src={l.image_url} alt={l.title} ratio="aspect-[4/3] lg:aspect-[5/4]" />
        <div className="space-y-4">
          <div><h1 className="text-2xl sm:text-3xl font-black leading-tight">{l.title}</h1><div className="text-3xl font-black text-[#0066CC] dark:text-[#2997FF] mt-2">{money(l.price)}</div></div>
          {l.show_contact ? (
            <button type="button" disabled={wa} onClick={contact} className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#25D366] hover:bg-[#1ebe5b] text-white font-black text-[15px] disabled:opacity-70"><MessageCircle className="w-5 h-5" /> {wa ? 'جاري الفتح...' : 'تواصل مع البائع عبر WhatsApp'}</button>
          ) : <div className="rounded-2xl bg-surface2 p-3 text-sm font-bold text-muted text-center">البائع لم يفعّل التواصل المباشر لهذا الإعلان.</div>}
          <p className="text-[11.5px] font-bold text-muted">التواصل والاتفاق النهائي يتمان بينك وبين البائع خارج الموقع وعلى مسؤوليتكما.</p>
          <div className="rounded-2xl border border-line bg-surface divide-y divide-line">{rows.map(([k, v]) => (<div key={k} className="flex justify-between gap-3 px-4 py-2.5 text-[13px]"><span className="font-bold text-muted">{k}</span><span className="font-black text-end">{v}</span></div>))}</div>
        </div>
      </div>
      {(l.defects || l.description) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {l.defects && <div className="rounded-2xl bg-rose-500/10 border border-rose-500/25 p-4"><div className="font-black text-sm text-rose-700 dark:text-rose-300 mb-1">العيوب المذكورة</div><p className="text-[13px] font-semibold whitespace-pre-line">{l.defects}</p></div>}
          {l.description && <div className="rounded-2xl bg-surface border border-line p-4"><div className="font-black text-sm mb-1">وصف البائع</div><p className="text-[13px] font-semibold text-muted whitespace-pre-line">{l.description}</p></div>}
        </div>
      )}
      <div className="rounded-2xl bg-surface border border-line p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3"><span className="w-11 h-11 rounded-full bg-[#0071E3]/15 text-[#0066CC] flex items-center justify-center font-black">{String(l.seller_name || 'ب').charAt(0)}</span>
          <div><div className="font-black text-sm flex items-center gap-1">{l.seller_name}<BadgeCheck className="w-4 h-4 text-[#0071E3]" aria-label="حساب مسجّل" /></div><div className="text-[11px] font-bold text-muted">{l.city} · عضو منذ {dateAr(l.seller_since)} · {Number(l.seller_approved_count || 0)} إعلان معتمد</div></div></div>
        <div className="flex gap-2"><button type="button" onClick={() => setReport(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-700 dark:text-rose-300 text-xs font-black"><Flag className="w-3.5 h-3.5" /> إبلاغ عن الإعلان / البائع</button></div>
      </div>
      <SafetyBox />
      <ReportDialog open={report} onClose={() => setReport(false)} listing={l} showToast={showToast} />
    </div>
  );
}

export function MarketplacePage({ sbUrl, sbKey, currentClient, openLogin, showToast, goHome }) {
  const [rows, setRows] = useState(null); const [state, setState] = useState({});
  const [q, setQ] = useState(''); const [brand, setBrand] = useState('ALL'); const [city, setCity] = useState('ALL'); const [cond, setCond] = useState('ALL'); const [model, setModel] = useState('');
  const [pMin, setPMin] = useState(''); const [pMax, setPMax] = useState(''); const [sort, setSort] = useState('new');
  const [route, setRoute] = useState(() => window.location.hash);
  const [termsOpen, setTermsOpen] = useState(false);

  const load = useCallback(async (force) => { const r = await fetchPublicListings(sbUrl, sbKey, force); setRows(r.rows); setState({ notReady: r.notReady, error: r.error }); }, [sbUrl, sbKey]);
  useEffect(() => { load(false); }, [load]);
  useEffect(() => { const on = () => setRoute(window.location.hash); window.addEventListener('hashchange', on); return () => window.removeEventListener('hashchange', on); }, []);
  useEffect(() => { if (/#\/sell\/terms/.test(route)) setTermsOpen(true); }, [route]);

  const m = /#\/sell\/(\d+)/.exec(route || '');
  const detailId = m ? Number(m[1]) : null;
  const open = (l) => { window.location.hash = `#/sell/${l.public_id}`; window.scrollTo({ top: 0 }); };
  const back = () => { window.location.hash = '#/sell'; };

  const filtered = useMemo(() => {
    let a = (rows || []).filter((l) => {
      if (brand !== 'ALL' && l.brand !== brand) return false;
      if (city !== 'ALL' && l.city !== city) return false;
      if (cond !== 'ALL' && l.condition !== cond) return false;
      if (model && !`${l.model} ${l.title}`.toLowerCase().includes(model.toLowerCase())) return false;
      if (pMin && l.price < Number(pMin)) return false;
      if (pMax && l.price > Number(pMax)) return false;
      if (q && !`${l.title} ${l.brand} ${l.model} ${l.city} ${l.area || ''}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
    if (sort === 'low') a = [...a].sort((x, y) => x.price - y.price);
    else if (sort === 'high') a = [...a].sort((x, y) => y.price - x.price);
    return a;
  }, [rows, brand, city, cond, model, pMin, pMax, q, sort]);

  const brands = useMemo(() => [...new Set((rows || []).map((l) => l.brand))], [rows]);
  const cities = useMemo(() => [...new Set((rows || []).map((l) => l.city))], [rows]);
  const featured = (rows || []).filter((l) => l.is_featured).slice(0, 6);
  const latest = (rows || []).slice(0, 6);
  const filtersOn = q || model || pMin || pMax || brand !== 'ALL' || city !== 'ALL' || cond !== 'ALL';

  if (detailId) {
    const l = (rows || []).find((x) => x.public_id === detailId);
    if (rows === null) return <div className="py-24 text-center text-muted font-bold"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
    if (!l) return (<div className="max-w-xl mx-auto py-20 px-4 text-center space-y-3"><p className="font-black text-lg">الإعلان غير متاح (ممكن يكون اتباع أو انتهى)</p><button type="button" onClick={back} className="px-6 py-2.5 rounded-full bg-[#0071E3] text-white font-black text-sm">تصفح كل الإعلانات</button></div>);
    return <ListingDetail l={l} onBack={back} showToast={showToast} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10 space-y-8">
      <header className="text-center max-w-3xl mx-auto space-y-3">
        <p className="text-[12px] font-semibold text-[#0066CC] dark:text-[#2997FF]">سوق الموبايلات المستعملة</p>
        <h1 className="text-[34px] sm:text-[52px] font-semibold tracking-tight leading-tight">بيع عندنا</h1>
        <p className="text-muted text-[15px] sm:text-[17px] font-medium">موبايلات مستعملة بيعرضها مستخدمون وبتتراجع من إدارتنا قبل النشر. اعرض موبايلك أو دوّر على صفقتك — والتواصل بيتم مباشرة عبر واتساب.</p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button type="button" onClick={() => openSellPhone()} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-black text-sm"><Plus className="w-4 h-4" /> اعرض موبايلك للبيع</button>
          <button type="button" onClick={() => setTermsOpen(true)} className="px-5 py-3 rounded-full bg-surface2 hover:bg-line font-black text-sm">شروط الإعلانات</button>
        </div>
      </header>

      <SafetyBox />

      <section className="rounded-[26px] bg-surface border border-line p-4 space-y-3">
        <div className="relative"><Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم الموبايل أو الماركة أو المدينة..." className={`${inputCls} ps-9`} /></div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['ALL', ...brands].map((b) => (<button key={b} type="button" onClick={() => setBrand(b)} className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-black border ${brand === b ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-bg border-line text-fg'}`}>{b === 'ALL' ? 'كل الماركات' : b}</button>))}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2">
          <select value={city} onChange={(e) => setCity(e.target.value)} className={inputCls}><option value="ALL">كل المدن</option>{cities.map((c) => <option key={c}>{c}</option>)}</select>
          <select value={cond} onChange={(e) => setCond(e.target.value)} className={inputCls}><option value="ALL">كل الحالات</option>{Object.entries(COND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
          <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="الموديل" className={inputCls} />
          <input type="number" value={pMin} onChange={(e) => setPMin(e.target.value)} placeholder="أقل سعر" className={inputCls} />
          <input type="number" value={pMax} onChange={(e) => setPMax(e.target.value)} placeholder="أعلى سعر" className={inputCls} />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={inputCls}><option value="new">الأحدث</option><option value="low">الأقل سعرًا</option><option value="high">الأعلى سعرًا</option></select>
        </div>
      </section>

      {rows === null && <div className="py-16 text-center text-muted"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}
      {state.notReady && <div className="rounded-2xl bg-surface border border-line p-8 text-center font-bold text-muted">خدمة «بيع عندنا» قيد التفعيل — جاري تجهيز قاعدة البيانات.</div>}
      {state.error && <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-6 text-center font-bold">تعذر تحميل الإعلانات الآن. <button type="button" className="underline" onClick={() => load(true)}>إعادة المحاولة</button></div>}

      {!filtersOn && featured.length > 0 && (<section className="space-y-3"><h2 className="text-xl font-black flex items-center gap-2"><Star className="w-5 h-5 text-amber-500" /> موبايلات مميزة</h2><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{featured.map((l) => <ListingCard key={l.id} l={l} onOpen={open} />)}</div></section>)}
      {!filtersOn && latest.length > 0 && (<section className="space-y-3"><h2 className="text-xl font-black">أحدث الإعلانات</h2><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{latest.map((l) => <ListingCard key={l.id} l={l} onOpen={open} />)}</div></section>)}
      {rows !== null && !state.notReady && (
        <section className="space-y-3">
          <h2 className="text-xl font-black">{filtersOn ? `النتائج (${filtered.length})` : `كل الموبايلات المتاحة (${filtered.length})`}</h2>
          {filtered.length === 0 ? <div className="rounded-2xl bg-surface border border-line p-10 text-center font-bold text-muted">لا توجد إعلانات مطابقة حاليًا.</div>
            : <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">{filtered.map((l) => <ListingCard key={l.id} l={l} onOpen={open} />)}</div>}
        </section>
      )}
      <MarketTermsModal open={termsOpen} onClose={() => { setTermsOpen(false); if (/terms/.test(window.location.hash)) window.location.hash = '#/sell'; }} />
    </div>
  );
}

// ----------------------------------------------------------------------------- "إعلاناتي للبيع" (profile)
const TABS = [['all', 'الكل'], ['pending_review', 'قيد المراجعة'], ['approved', 'المقبولة'], ['published', 'المنشورة'], ['rejected', 'المرفوضة'], ['sold', 'المباعة'], ['hidden', 'المخفية']];

export function MyListingsPanel({ currentClient, showToast }) {
  const [rows, setRows] = useState(null); const [tab, setTab] = useState('all'); const [pw, setPw] = useState(''); const [needAuth, setNeedAuth] = useState(!getMpToken()); const [busy, setBusy] = useState('');
  const load = useCallback(async () => {
    const t = getMpToken(); if (!t) { setNeedAuth(true); return; }
    const r = await mpApi('mine', { token: t });
    if (r.needAuth) { setMpToken(''); setNeedAuth(true); return; }
    if (r.ok) { setRows(r.listings || []); setNeedAuth(false); } else showToast && showToast(r.error || 'تعذر جلب الإعلانات', 'error');
  }, [showToast]);
  useEffect(() => { if (!needAuth) load(); }, [needAuth, load]);
  useEffect(() => { const on = () => load(); window.addEventListener('elz:mp-changed', on); return () => window.removeEventListener('elz:mp-changed', on); }, [load]);

  const unlock = async (e) => { e.preventDefault(); setBusy('auth'); const r = await mpLogin(currentClient.phone, pw); setBusy(''); if (r.ok) { setPw(''); setNeedAuth(false); } else showToast && showToast(r.error || 'كلمة المرور غير صحيحة', 'error'); };
  const act = async (l, op) => { setBusy(l.id + op); const r = await mpApi('update', { token: getMpToken(), op, listingId: l.id }); setBusy(''); if (r.ok) { showToast && showToast('تم التحديث', 'success'); load(); } else showToast && showToast(r.error || 'تعذر التنفيذ', 'error'); };

  if (needAuth) return (
    <form onSubmit={unlock} className="max-w-md mx-auto bg-surface border border-line rounded-3xl p-6 space-y-3 text-center">
      <p className="font-black">اكتب كلمة مرور حسابك لعرض إعلاناتك</p>
      <input type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className={inputCls} />
      <button type="submit" disabled={busy === 'auth'} className="w-full py-2.5 rounded-xl bg-[#0071E3] text-white font-black text-sm">{busy === 'auth' ? '...' : 'عرض إعلاناتي'}</button>
    </form>);
  if (rows === null) return <div className="py-12 text-center text-muted"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>;
  const list = rows.filter((l) => tab === 'all' || l.status === tab);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-black text-lg">إعلاناتي للبيع</h3>
        <button type="button" onClick={() => openSellPhone()} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0071E3] text-white font-black text-xs"><Plus className="w-4 h-4" /> إعلان جديد</button>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">{TABS.map(([k, l]) => (<button key={k} type="button" onClick={() => setTab(k)} className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-black border ${tab === k ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-surface border-line'}`}>{l} {k === 'all' ? rows.length : rows.filter((x) => x.status === k).length}</button>))}</div>
      {list.length === 0 && <div className="rounded-2xl bg-surface border border-line p-10 text-center font-bold text-muted">لا توجد إعلانات في هذا القسم.</div>}
      <div className="grid md:grid-cols-2 gap-4">
        {list.map((l) => (
          <div key={l.id} className="rounded-3xl bg-surface border border-line p-3 flex gap-3">
            <div className="w-28 shrink-0"><PhoneStage src={l.image_url} alt={l.title} ratio="aspect-square" /></div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-start justify-between gap-2"><div className="font-black text-sm leading-snug line-clamp-2">{l.title}</div><StatusBadge status={l.status} /></div>
              <div className="text-[#0066CC] dark:text-[#2997FF] font-black">{money(l.price)}</div>
              <div className="text-[11px] font-bold text-muted">#{l.public_id} · {l.city} · {dateAr(l.created_at)}</div>
              {l.status === 'rejected' && l.reject_reason && <div className="text-[12px] font-bold text-rose-700 dark:text-rose-300 bg-rose-500/10 rounded-lg p-2">سبب الرفض: {l.reject_reason}</div>}
              {l.status === 'hidden' && l.hidden_by === 'admin' && <div className="text-[11px] font-bold text-muted">تم إخفاء الإعلان من الإدارة.</div>}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {l.status === 'published' && <a href={`#/sell/${l.public_id}`} className="px-3 py-1.5 rounded-lg bg-surface2 text-xs font-black">عرض</a>}
                {!['sold', 'expired'].includes(l.status) && <button type="button" onClick={() => openSellPhone({ editing: l })} className="px-3 py-1.5 rounded-lg bg-surface2 text-xs font-black inline-flex items-center gap-1"><Pencil className="w-3 h-3" /> تعديل</button>}
                {['published', 'approved', 'hidden'].includes(l.status) && <button type="button" disabled={!!busy} onClick={() => act(l, 'mark_sold')} className="px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-700 dark:text-violet-300 text-xs font-black">تم البيع</button>}
                {['published', 'approved'].includes(l.status) && <button type="button" disabled={!!busy} onClick={() => act(l, 'request_hide')} className="px-3 py-1.5 rounded-lg bg-surface2 text-xs font-black inline-flex items-center gap-1"><EyeOff className="w-3 h-3" /> إخفاء</button>}
                {l.status === 'hidden' && l.hidden_by === 'seller' && <button type="button" disabled={!!busy} onClick={() => act(l, 'reactivate')} className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-black inline-flex items-center gap-1"><Eye className="w-3 h-3" /> إعادة تفعيل</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
