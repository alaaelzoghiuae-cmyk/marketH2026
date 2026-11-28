import React, { useMemo, useRef, useState } from 'react';
import {
  Palette, Type, LayoutGrid, FileText, History, Save, Eye, EyeOff, Upload, Download,
  RotateCcw, RefreshCw, CheckCircle2, AlertTriangle, Globe, Plus, Trash2, SlidersHorizontal
} from 'lucide-react';
import {
  useSiteConfig, DEFAULT_SITE_CONFIG, ALLOWED_ARABIC_FONTS, ALLOWED_LATIN_FONTS,
  validateThemeContrast, isValidHex
} from '../context/SiteConfigContext.jsx';

const PALETTE_FIELDS = [
  ['bg', 'الخلفية'],
  ['surface', 'السطح / الكروت'],
  ['surface2', 'سطح ثانوي'],
  ['fg', 'النص الأساسي'],
  ['muted', 'النص الثانوي'],
  ['line', 'الحدود والفواصل'],
  ['accent', 'اللون الرئيسي'],
  ['accentText', 'لون الروابط']
];

const clone = (o) => JSON.parse(JSON.stringify(o));

export default function AdminSiteControl({ showToast, adminCredentials, sbUrl, sbKey }) {
  const sc = useSiteConfig();
  const toast = (m, t) => { if (showToast) showToast(m, t); };
  const base = sc.draft || sc.config;
  const [local, setLocal] = useState(() => clone(base));
  const [note, setNote] = useState('');
  const [serverBusy, setServerBusy] = useState(false);
  const [serverMsg, setServerMsg] = useState('');
  const [newBlockKey, setNewBlockKey] = useState('');
  const fileRef = useRef(null);

  const dirty = useMemo(
    () => JSON.stringify(local) !== JSON.stringify(base),
    [local, base]
  );
  const warnings = useMemo(() => validateThemeContrast(local.theme || {}), [local.theme]);

  const setPalette = (mode, key, val) =>
    setLocal(p => ({ ...p, theme: { ...p.theme, [mode]: { ...(p.theme?.[mode] || {}), [key]: val } } }));
  const setTypo = (key, val) =>
    setLocal(p => ({ ...p, theme: { ...p.theme, typography: { ...(p.theme?.typography || {}), [key]: val } } }));
  const setLayout = (key, val) =>
    setLocal(p => ({ ...p, theme: { ...p.theme, layout: { ...(p.theme?.layout || {}), [key]: val } } }));
  const setBlock = (key, field, val) =>
    setLocal(p => ({ ...p, blocks: { ...p.blocks, [key]: { ...(p.blocks?.[key] || { ar: '', en: '' }), [field]: val } } }));
  const removeBlock = (key) =>
    setLocal(p => { const b = { ...p.blocks }; delete b[key]; return { ...p, blocks: b }; });

  const doSaveDraft = () => {
    sc.saveDraft(local);
    toast('اتحفظت كمسودة — فعّل «معاينة المسودة» عشان تشوفها على الموقع قبل النشر', 'success');
  };

  const doPublish = async () => {
    sc.publishDraft(note || 'نشر من لوحة التحكم الشامل');
    setNote('');
    toast('اتنشر على الجهاز ده وبيظهر فورًا في أي تاب مفتوح', 'success');
    // Best-effort server publish (needs SQL 07 + 07b on Supabase)
    if (!sbUrl || !sbKey || !adminCredentials?.username || !adminCredentials?.password) {
      setServerMsg('النشر على السيرفر: بيانات اتصال Supabase أو بيانات الأدمن مش متاحة في الجلسة دي — النشر المحلي تم عادي.');
      return;
    }
    setServerBusy(true);
    try {
      const r = await fetch(`${String(sbUrl).replace(/\/+$/, '')}/rest/v1/rpc/admin_publish_site_config`, {
        method: 'POST',
        headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          p_username: adminCredentials.username,
          p_password: adminCredentials.password,
          p_config: local,
          p_note: note || ''
        })
      });
      if (r.status === 404) {
        setServerMsg('النشر على السيرفر لسه مش مفعّل — شغّل ملف 07_site_control_system.sql وبعده 07b_site_control_publish.sql في Supabase وهيشتغل من هنا على طول.');
      } else {
        const j = await r.json().catch(() => null);
        if (j && j.ok) {
          setServerMsg(`اتنشر على السيرفر بنجاح (إصدار رقم ${j.version}) — هيوصل لكل الزوار مع تحديث الصفحة.`);
          toast('اتنشر على السيرفر لكل الزوار', 'success');
        } else {
          setServerMsg(`السيرفر رفض النشر: ${(j && j.error) || ('HTTP ' + r.status)}`);
        }
      }
    } catch (e) {
      setServerMsg('تعذّر الاتصال بالسيرفر أثناء النشر — النشر المحلي تم، جرّب تاني من شبكة مستقرة.');
    }
    setServerBusy(false);
  };

  const doRollback = (v) => {
    if (sc.rollbackVersion(v.id)) {
      setLocal(clone(v.snapshot));
      toast('تم الاسترجاع للنسخة المختارة', 'success');
    }
  };

  const doReset = () => {
    sc.resetToDefaults();
    setLocal(clone(DEFAULT_SITE_CONFIG));
    toast('رجعنا للإعدادات الافتراضية', 'success');
  };

  const doExport = () => {
    const blob = new Blob([JSON.stringify(local, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elzoghbi-site-control-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImportFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const res = sc.importConfigJson(text);
      if (!res.ok) { toast(res.error || 'ملف غير صالح', 'error'); return; }
      try {
        const parsed = JSON.parse(text);
        setLocal({
          ...clone(DEFAULT_SITE_CONFIG),
          ...parsed,
          theme: { ...clone(DEFAULT_SITE_CONFIG.theme), ...(parsed.theme || {}) },
          blocks: { ...clone(DEFAULT_SITE_CONFIG.blocks), ...(parsed.blocks || {}) }
        });
        toast('تم استيراد الملف كمسودة — راجعه وبعدين انشر', 'success');
      } catch { toast('تعذّر قراءة الملف', 'error'); }
    };
    reader.readAsText(file);
  };

  const paletteEditor = (mode, title) => (
    <div className="bg-surface2 border border-line rounded-2xl p-4 space-y-3">
      <div className="text-sm font-black text-fg">{title}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {PALETTE_FIELDS.map(([key, label]) => {
          const val = local.theme?.[mode]?.[key] || '';
          return (
            <label key={key} className="flex items-center gap-2 bg-surface border border-line rounded-xl px-2.5 py-2">
              <input
                type="color"
                value={isValidHex(val) ? val : '#0071e3'}
                onChange={e => setPalette(mode, key, e.target.value)}
                className="w-9 h-9 rounded-lg border border-line bg-transparent cursor-pointer shrink-0"
              />
              <span className="flex-1 min-w-0">
                <span className="block text-[11px] font-black text-fg">{label}</span>
                <input
                  value={val}
                  onChange={e => setPalette(mode, key, e.target.value)}
                  dir="ltr"
                  className={`w-full bg-transparent text-[11px] font-bold focus:outline-none ${val && !isValidHex(val) ? 'text-rose-600' : 'text-muted'}`}
                />
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );

  const numField = (label, value, onChange, min, max, step = 1) => (
    <label className="block">
      <span className="block text-[11px] font-black text-muted mb-1">{label}</span>
      <input
        type="number" min={min} max={max} step={step} value={value ?? ''}
        onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-sm font-bold text-fg focus:outline-none focus:border-[#0071E3]"
      />
    </label>
  );

  const sections = Array.isArray(local.sections) ? local.sections : [];
  const blockKeys = Object.keys(local.blocks || {});

  return (
    <div className="space-y-4">
      {/* Header + status */}
      <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
        <div className="flex items-start gap-3 flex-wrap">
          <span className="w-11 h-11 rounded-2xl bg-[#0071E3] flex items-center justify-center shrink-0">
            <SlidersHorizontal className="w-5 h-5 text-white" />
          </span>
          <div className="flex-1 min-w-[220px]">
            <h2 className="text-base font-black text-fg">التحكم الشامل في الموقع (Site Control)</h2>
            <p className="text-xs font-bold text-muted leading-relaxed mt-0.5">
              محرك واحد للثيمات والنصوص والأقسام: عدّل، احفظ مسودة، عاين، وبعدين انشر — مع سجل نسخ واسترجاع فوري.
              التعديلات هنا بتتطبق على متغيرات التصميم الحية ونصوص الواجهة الرئيسية (الهيرو) فور النشر.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-[11px] font-black">
          <span className="px-2.5 py-1 rounded-full bg-surface2 border border-line text-fg">الإصدار الحالي: {sc.config?.version ?? 1}</span>
          <span className={`px-2.5 py-1 rounded-full border ${sc.draft ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-300' : 'bg-surface2 border-line text-muted'}`}>
            {sc.draft ? 'في مسودة محفوظة' : 'مفيش مسودة'}
          </span>
          <span className={`px-2.5 py-1 rounded-full border ${sc.isDraftPreview ? 'bg-[#0071E3]/10 border-[#0071E3]/40 text-[#0066CC]' : 'bg-surface2 border-line text-muted'}`}>
            معاينة المسودة: {sc.isDraftPreview ? 'مفعّلة' : 'مقفولة'}
          </span>
          {dirty && <span className="px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/40 text-rose-700 dark:text-rose-300">في تعديلات لسه ما اتحفظتش</span>}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={doSaveDraft} disabled={!dirty} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface2 border border-line text-xs font-black text-fg disabled:opacity-40 hover:border-[#0071E3] transition">
            <Save className="w-4 h-4" /> حفظ كمسودة
          </button>
          <button type="button" onClick={() => sc.setDraftPreview(!sc.isDraftPreview)} disabled={!sc.draft && !dirty} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface2 border border-line text-xs font-black text-fg disabled:opacity-40 hover:border-[#0071E3] transition">
            {sc.isDraftPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />} {sc.isDraftPreview ? 'إيقاف المعاينة' : 'معاينة المسودة'}
          </button>
          <input
            value={note} onChange={e => setNote(e.target.value)} placeholder="ملحوظة الإصدار (اختياري)"
            className="flex-1 min-w-[160px] bg-surface2 border border-line rounded-xl px-3 py-2.5 text-xs font-bold text-fg focus:outline-none focus:border-[#0071E3]"
          />
          <button type="button" onClick={doPublish} disabled={dirty || serverBusy} title={dirty ? 'احفظ المسودة الأول' : ''} className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0071E3] text-white text-xs font-black disabled:opacity-40 hover:bg-[#0066CC] transition">
            {serverBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />} نشر
          </button>
          <button type="button" onClick={doExport} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface2 border border-line text-xs font-black text-fg hover:border-[#0071E3] transition">
            <Download className="w-4 h-4" /> تصدير
          </button>
          <button type="button" onClick={() => fileRef.current && fileRef.current.click()} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface2 border border-line text-xs font-black text-fg hover:border-[#0071E3] transition">
            <Upload className="w-4 h-4" /> استيراد
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={e => { doImportFile(e.target.files?.[0]); e.target.value = ''; }} />
          <button type="button" onClick={doReset} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-surface2 border border-rose-500/40 text-xs font-black text-rose-700 dark:text-rose-300 hover:bg-rose-500/10 transition">
            <RotateCcw className="w-4 h-4" /> الافتراضي
          </button>
        </div>

        {serverMsg && (
          <div className="flex items-start gap-2 rounded-xl border border-line bg-surface2 p-3 text-[11px] font-bold text-fg leading-relaxed">
            <Globe className="w-4 h-4 shrink-0 mt-0.5 text-[#0066CC]" /> <span>{serverMsg}</span>
          </div>
        )}
        {warnings.length > 0 && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 space-y-1">
            {warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {w.message}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Theme */}
      <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-[#0066CC]" />
          <h3 className="text-sm font-black text-fg">الثيم والألوان والخطوط</h3>
        </div>
        <div className="grid lg:grid-cols-2 gap-3">
          {paletteEditor('tokens_light', 'الوضع الفاتح')}
          {paletteEditor('tokens_dark', 'الوضع الداكن')}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <label className="block">
            <span className="block text-[11px] font-black text-muted mb-1">الخط العربي</span>
            <select value={local.theme?.typography?.arabicFont || ''} onChange={e => setTypo('arabicFont', e.target.value)} className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-sm font-bold text-fg focus:outline-none">
              {ALLOWED_ARABIC_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-[11px] font-black text-muted mb-1">الخط اللاتيني</span>
            <select value={local.theme?.typography?.latinFont || ''} onChange={e => setTypo('latinFont', e.target.value)} className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-sm font-bold text-fg focus:outline-none">
              {ALLOWED_LATIN_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </label>
          {numField('حجم الخط الأساسي (px)', local.theme?.typography?.baseSizePx, v => setTypo('baseSizePx', v), 12, 20)}
          {numField('ارتفاع السطر العربي', local.theme?.typography?.arabicLineHeight, v => setTypo('arabicLineHeight', v), 1.2, 2.2, 0.05)}
          {numField('أقصى عرض للمحتوى (px)', local.theme?.layout?.maxWidthPx, v => setLayout('maxWidthPx', v), 960, 1440)}
          {numField('انحناء الكروت (px)', local.theme?.layout?.cardRadiusPx, v => setLayout('cardRadiusPx', v), 8, 28)}
          {numField('انحناء الأزرار (px)', local.theme?.layout?.controlRadiusPx, v => setLayout('controlRadiusPx', v), 4, 20)}
          {numField('منتجات في الصفحة', local.theme?.layout?.productsPerPage, v => setLayout('productsPerPage', v), 8, 60)}
        </div>
        <p className="text-[11px] font-bold text-muted leading-relaxed">
          الألوان والتخطيط بيتطبقوا فورًا على متغيرات التصميم الحية للموقع بعد النشر. الخطوط من قائمة آمنة معتمدة فقط.
        </p>
      </div>

      {/* Content blocks */}
      <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-[#0066CC]" />
          <h3 className="text-sm font-black text-fg">نصوص الواجهة (Content Blocks)</h3>
        </div>
        <div className="space-y-2.5">
          {blockKeys.map(key => (
            <div key={key} className="bg-surface2 border border-line rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span dir="ltr" className="text-[11px] font-black text-muted">{key}</span>
                {!key.startsWith('home.hero.') && (
                  <button type="button" onClick={() => removeBlock(key)} className="text-rose-600 hover:text-rose-700"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                <input value={local.blocks[key]?.ar || ''} onChange={e => setBlock(key, 'ar', e.target.value)} placeholder="النص بالعربي" className="bg-surface border border-line rounded-xl px-3 py-2 text-sm font-bold text-fg focus:outline-none focus:border-[#0071E3]" />
                <input value={local.blocks[key]?.en || ''} onChange={e => setBlock(key, 'en', e.target.value)} placeholder="English text" dir="ltr" className="bg-surface border border-line rounded-xl px-3 py-2 text-sm font-bold text-fg focus:outline-none focus:border-[#0071E3]" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input value={newBlockKey} onChange={e => setNewBlockKey(e.target.value)} placeholder="مفتاح جديد — مثال: home.promo.text" dir="ltr" className="flex-1 min-w-[200px] bg-surface2 border border-line rounded-xl px-3 py-2.5 text-xs font-bold text-fg focus:outline-none focus:border-[#0071E3]" />
          <button
            type="button"
            onClick={() => { const k = newBlockKey.trim(); if (k && !local.blocks?.[k]) { setBlock(k, 'ar', ''); setNewBlockKey(''); } }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface2 border border-line text-xs font-black text-fg hover:border-[#0071E3] transition"
          >
            <Plus className="w-4 h-4" /> إضافة كتلة نص
          </button>
        </div>
        <p className="text-[11px] font-bold text-muted leading-relaxed">
          كتل الهيرو الأربع (badge / title / subtitle / cta) وكتل عنوان الواجهة التعريفية (home.showcase.headline / sub) مربوطة فعليًا بواجهة المتجر وبتتغير مع النشر. أي كتلة جديدة هتتحفظ وتتنشر على السيرفر وجاهزة للربط في أي قسم.
        </p>
      </div>

      {/* Sections from server */}
      <div className="bg-surface border border-line rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-5 h-5 text-[#0066CC]" />
          <h3 className="text-sm font-black text-fg">أقسام الصفحات المنشورة على السيرفر</h3>
        </div>
        {sections.length === 0 ? (
          <p className="text-xs font-bold text-muted leading-relaxed">
            لسه مفيش أقسام راجعة من السيرفر — دي بتظهر هنا بعد تشغيل SQL 07 ونشر أول إعدادات من السيرفر.
            ترتيب أقسام الصفحة الرئيسية وإظهارها شغال دلوقتي من «منشئ الصفحات والأقسام» و«المحرر المرئي».
          </p>
        ) : (
          <div className="space-y-1.5">
            {sections.map((s, i) => (
              <div key={s.id || i} className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3 py-2 text-xs font-bold text-fg">
                <FileText className="w-4 h-4 text-muted shrink-0" />
                <span className="flex-1 truncate">{s.section_key || s.sectionKey || s.id}</span>
                <span className="text-muted">{s.page_slug || 'home'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${s.is_visible === false ? 'bg-rose-500/10 text-rose-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                  {s.is_visible === false ? 'مخفي' : 'ظاهر'}
                </span>
                <span className="text-muted">#{s.sort_order ?? i}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Versions */}
      <div className="bg-surface border border-line rounded-3xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#0066CC]" />
          <h3 className="text-sm font-black text-fg">سجل النسخ والاسترجاع</h3>
        </div>
        {(sc.versions || []).length === 0 ? (
          <p className="text-xs font-bold text-muted">مفيش نسخ سابقة لسه — كل نشر بيحفظ النسخة اللي قبله هنا تلقائيًا (لحد 25 نسخة).</p>
        ) : (
          <div className="space-y-1.5">
            {sc.versions.map(v => (
              <div key={v.id} className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-3 py-2.5 flex-wrap">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="flex-1 min-w-[140px] text-xs font-black text-fg truncate">{v.note || 'نشر'}</span>
                <span className="text-[11px] font-bold text-muted">{v.createdAt ? new Date(v.createdAt).toLocaleString('ar-EG') : ''}</span>
                <button type="button" onClick={() => doRollback(v)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface border border-line text-[11px] font-black text-fg hover:border-[#0071E3] transition">
                  <RotateCcw className="w-3.5 h-3.5" /> استرجاع
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
