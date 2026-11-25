import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppleHero, AppleAdMosaic } from './AppleAds.jsx';
import { AdContent } from './widgets.jsx';
import { AppleAdCard, AppleCardsCarousel, ClassicHeroBanner } from './AdsShowcase.jsx';
import { getAdTheme } from '../lib/utils.jsx';
import {
  ADS_MODE_APPLE,
  ADS_MODE_CLASSIC,
  DEFAULT_ADS_CAROUSEL,
  DEFAULT_ADS_CLASSIC,
  resolveAdsMode,
  resolveCarouselCfg,
  resolveClassicCfg,
  snapshotAdsSettings,
} from '../lib/adsDisplay.js';

/* =====================================================================
   Dashboard side of the ads display system.
   Every control below is wired to a real setting used by the storefront:
   - AdsDisplayPanel  → siteSettings.adsDisplayMode / adsCarousel / adsClassic
   - AppleCardFields  → per-ad card fields (stored in the ad's data JSON)
   - AdPreviewPanel   → live preview (cards / classic / studio, 4 devices, light + dark)
   ===================================================================== */

const inputCls = 'w-full px-3 py-2 rounded-xl border border-line text-xs font-bold';
const labelCls = 'block text-[11px] font-bold text-muted mb-1';

function Seg({ value, onChange, options }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold border transition ${value === v ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-surface text-fg border-line hover:border-[#0071E3]'}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-[11px] font-bold text-fg cursor-pointer select-none">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-[#0071E3]" />
      <span>{label}</span>
    </label>
  );
}

function Range({ label, value, min, max, step = 1, unit = '', onChange }) {
  return (
    <div>
      <label className={labelCls}>{label}: <span className="text-fg">{value}{unit}</span></label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#0071E3]" />
    </div>
  );
}

function ColorField({ label, value, onChange, placeholder }) {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value || '') ? value : '';
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={hex.length === 7 ? hex : '#ffffff'} onChange={(e) => onChange(e.target.value)} className="w-9 h-9 rounded-lg border border-line p-0.5 bg-transparent cursor-pointer" aria-label={label} />
        <input type="text" dir="ltr" value={value || ''} placeholder={placeholder || '#RRGGBB'} onChange={(e) => onChange(e.target.value.trim())} className={`${inputCls} font-mono`} />
        {value ? <button type="button" onClick={() => onChange('')} className="px-2 py-1.5 rounded-lg border border-line text-[11px] font-bold text-muted hover:text-rose-500">مسح</button> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Device frame: renders children at a REAL device width then scales  */
/* ------------------------------------------------------------------ */
export const DEVICE_WIDTHS = { desktop: 1380, laptop: 1024, tablet: 768, mobile: 390 };

export function DeviceFrame({ device = 'desktop', dark = false, children }) {
  const width = DEVICE_WIDTHS[device] || DEVICE_WIDTHS.desktop;
  const outerRef = useRef(null);
  const innerRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [h, setH] = useState(0);
  useEffect(() => {
    const o = outerRef.current;
    const i = innerRef.current;
    if (!o || !i) return undefined;
    const upd = () => { setScale(Math.min(1, o.clientWidth / width)); setH(i.offsetHeight); };
    upd();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(upd);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [width]);
  const pad = width >= 700 ? 32 : 16;
  return (
    <div ref={outerRef} className="w-full flex justify-center items-start overflow-hidden rounded-2xl border border-line" style={{ height: h ? h * scale : undefined }}>
      <div
        ref={innerRef}
        className={dark ? 'dark' : ''}
        style={{ width, flex: 'none', transform: `scale(${scale})`, transformOrigin: 'top center', background: 'rgb(var(--bg))', color: 'rgb(var(--fg))', padding: `${pad / 2}px ${pad}px`, minWidth: 0 }}
      >
        {children}
      </div>
    </div>
  );
}

function PreviewToolbar({ device, setDevice, dark, setDark, children }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {children}
      <div className="flex gap-1">
        {[['desktop', '🖥️ كمبيوتر'], ['laptop', '💻 لابتوب'], ['tablet', '📱 تابلت'], ['mobile', '📲 موبايل']].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setDevice(k)} className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition ${device === k ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-surface text-fg border-line'}`}>{l}</button>
        ))}
      </div>
      <button type="button" onClick={() => setDark(!dark)} className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold border border-line bg-surface text-fg">
        {dark ? '🌙 معاينة داكنة' : '☀️ معاينة فاتحة'}
      </button>
    </div>
  );
}

const noop = () => {};

/* ------------------------------------------------------------------ */
/*  Global display settings (mode + carousel + classic) with draft /   */
/*  publish / reset / version history                                  */
/* ------------------------------------------------------------------ */
export function AdsDisplayPanel({ siteSettings, saveSettings, activeAds, onToast }) {
  const live = useMemo(() => ({
    mode: resolveAdsMode(siteSettings),
    carousel: resolveCarouselCfg(siteSettings),
    classic: resolveClassicCfg(siteSettings),
  }), [siteSettings]);
  const liveKey = JSON.stringify(live);
  const [draft, setDraft] = useState(live);
  useEffect(() => { setDraft(live); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveKey]);
  const [device, setDevice] = useState('desktop');
  const [dark, setDark] = useState(false);
  const [previewMode, setPreviewMode] = useState(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const [historyOpen, setHistoryOpen] = useState(false);
  const dirty = JSON.stringify(draft) !== liveKey;
  const shownMode = previewMode || draft.mode;

  const setC = (patch) => setDraft((d) => ({ ...d, carousel: { ...d.carousel, ...patch } }));
  const setK = (patch) => setDraft((d) => ({ ...d, classic: { ...d.classic, ...patch } }));

  const history = Array.isArray(siteSettings.adsHistory) ? siteSettings.adsHistory : [];

  const publish = () => {
    saveSettings((prev) => ({
      ...prev,
      adsDisplayMode: draft.mode,
      adsCarousel: draft.carousel,
      adsClassic: draft.classic,
      adsHistory: [snapshotAdsSettings(prev), ...(Array.isArray(prev.adsHistory) ? prev.adsHistory : [])].slice(0, 10),
    }));
    if (onToast) onToast('تم نشر إعدادات عرض الإعلانات — ظهرت للزوار فوراً ✓', 'success');
  };
  const restore = (entry) => {
    saveSettings((prev) => ({
      ...prev,
      adsDisplayMode: entry.mode,
      adsCarousel: entry.carousel,
      adsClassic: entry.classic,
      adsHistory: [snapshotAdsSettings(prev), ...(Array.isArray(prev.adsHistory) ? prev.adsHistory.filter((e) => e.ts !== entry.ts) : [])].slice(0, 10),
    }));
    if (onToast) onToast('تمت استعادة النسخة السابقة ✓', 'success');
  };

  const heroAds = activeAds.filter((a) => !a.placement || a.placement === 'hero' || a.placement === 'both');
  const promoAds = activeAds.filter((a) => a.placement === 'promo_split' || a.placement === 'both');
  const heroIds = new Set(heroAds.map((a) => a.id));
  const cardPromo = promoAds.filter((a) => !heroIds.has(a.id));

  const modeCard = (key, title, desc, icon) => (
    <button
      key={key}
      type="button"
      onClick={() => setDraft((d) => ({ ...d, mode: key }))}
      className={`text-start p-3.5 rounded-2xl border-2 transition ${draft.mode === key ? 'border-[#0071E3] bg-[#0071E3]/8' : 'border-line bg-surface hover:border-[#0071E3]/50'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-black text-fg text-xs">{icon} {title}</span>
        {live.mode === key && <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold">المنشور حالياً</span>}
      </div>
      <p className="text-[11px] text-muted mt-1 leading-relaxed">{desc}</p>
    </button>
  );

  return (
    <div className="rounded-3xl border border-line bg-surface2/30 p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-black text-fg text-sm">🍎 طريقة عرض الإعلانات في الموقع</h3>
          <p className="text-[11px] text-muted mt-0.5">اختر القالب وعدّل إعداداته وشاهد النتيجة، ثم اضغط «نشر» لتظهر للزوار. إعدادات كل قالب محفوظة بشكل مستقل.</p>
        </div>
        {dirty && <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-extrabold">● تعديلات غير منشورة (مسودة)</span>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {modeCard(ADS_MODE_APPLE, 'Apple Cards Carousel (الافتراضي)', 'بطاقات أفقية متراصة بحواف ناعمة مع سحب وأسهم ومؤشرات، ويظهر جزء من البطاقة التالية.', '🍎')}
        {modeCard(ADS_MODE_CLASSIC, 'Classic Hero Banner (البانر الكبير)', 'البانر الكبير الأصلي مع البنرات المزدوجة — محفوظ بكامل إمكانياته وجاهز للعودة إليه.', '🖼️')}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Apple cards settings */}
        <div className="rounded-2xl border border-line bg-surface p-3.5 space-y-3">
          <div className="font-extrabold text-fg text-xs">🍎 إعدادات Apple Cards Carousel</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[['desktop', 'كمبيوتر', 6], ['laptop', 'لابتوب', 6], ['tablet', 'تابلت', 4], ['mobile', 'موبايل', 2]].map(([k, l, mx]) => (
              <div key={k}>
                <label className={labelCls}>بطاقات {l}</label>
                <select value={draft.carousel[k]} onChange={(e) => setC({ [k]: Number(e.target.value) })} className={inputCls}>
                  {Array.from({ length: mx }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Range label="المسافة بين البطاقات" value={draft.carousel.gap} min={4} max={40} unit="px" onChange={(v) => setC({ gap: v })} />
            <Range label="سرعة الانتقال" value={draft.carousel.speedMs} min={150} max={1500} step={50} unit="ms" onChange={(v) => setC({ speedMs: v })} />
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Toggle label="إظهار جزء من البطاقة التالية" checked={draft.carousel.peek} onChange={(v) => setC({ peek: v })} />
            <Toggle label="إظهار الأسهم" checked={draft.carousel.arrows} onChange={(v) => setC({ arrows: v })} />
            <Toggle label="إظهار المؤشرات" checked={draft.carousel.dots} onChange={(v) => setC({ dots: v })} />
            <Toggle label="تشغيل تلقائي (يتوقف عند تفاعل الزائر)" checked={draft.carousel.autoplay} onChange={(v) => setC({ autoplay: v })} />
          </div>
          {draft.carousel.autoplay && <Range label="مدة بقاء كل عرض" value={draft.carousel.intervalSec} min={2} max={20} unit="ث" onChange={(v) => setC({ intervalSec: v })} />}
        </div>

        {/* Classic settings */}
        <div className="rounded-2xl border border-line bg-surface p-3.5 space-y-3">
          <div className="font-extrabold text-fg text-xs">🖼️ إعدادات Classic Hero Banner</div>
          <div>
            <label className={labelCls}>ارتفاع البانر الكبير</label>
            <Seg value={draft.classic.height} onChange={(v) => setK({ height: v })} options={[['compact', 'مضغوط'], ['standard', 'قياسي'], ['tall', 'سينمائي']]} />
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Toggle label="إظهار الأسهم والمؤشرات" checked={draft.classic.controls} onChange={(v) => setK({ controls: v })} />
            <Toggle label="إظهار البنرات المزدوجة أسفل البانر" checked={draft.classic.mosaic} onChange={(v) => setK({ mosaic: v })} />
            <Toggle label="تشغيل تلقائي" checked={draft.classic.autoplay} onChange={(v) => setK({ autoplay: v })} />
          </div>
          {draft.classic.autoplay && <Range label="مدة بقاء كل بانر" value={draft.classic.intervalSec} min={2} max={20} unit="ث" onChange={(v) => setK({ intervalSec: v })} />}
          <p className="text-[11px] text-muted leading-relaxed">تصميم كل إعلان (الصورة، الإطار، التدرج…) يظل من استوديو الإعلان بالأسفل ويؤثر على هذا القالب فقط.</p>
        </div>
      </div>

      {/* Live preview */}
      <div className="space-y-2">
        <PreviewToolbar device={device} setDevice={setDevice} dark={dark} setDark={setDark}>
          <div className="flex gap-1">
            {[[ADS_MODE_APPLE, '🍎 معاينة البطاقات'], [ADS_MODE_CLASSIC, '🖼️ معاينة البانر']].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setPreviewMode(k)} className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition ${shownMode === k ? 'bg-fg text-bg border-fg' : 'bg-surface text-fg border-line'}`}>{l}</button>
            ))}
          </div>
        </PreviewToolbar>
        {activeAds.length === 0 ? (
          <div className="p-6 text-center rounded-2xl border border-dashed border-line text-xs text-muted">لا توجد إعلانات نشطة حالياً — أنشئ إعلاناً أو فعّل أحد الإعلانات لتظهر المعاينة.</div>
        ) : (
          <DeviceFrame device={device} dark={dark}>
            <div className="space-y-8" dir="rtl">
              {shownMode === ADS_MODE_CLASSIC ? (
                <>
                  {heroAds.length > 0 && (
                    <ClassicHeroBanner slides={heroAds} index={heroIdx % heroAds.length} setIndex={(v) => setHeroIdx(((v % heroAds.length) + heroAds.length) % heroAds.length)} onOpen={noop} rtl cfg={{ ...draft.classic, autoplay: false }} />
                  )}
                  {draft.classic.mosaic && promoAds.length > 0 && <AppleAdMosaic ads={promoAds} onOpen={noop} rtl />}
                </>
              ) : (
                <>
                  {heroAds.length > 0 && <AppleCardsCarousel ads={heroAds} cfg={draft.carousel} onOpen={noop} rtl forceNoAutoplay />}
                  {cardPromo.length > 0 && <AppleCardsCarousel ads={cardPromo} cfg={draft.carousel} onOpen={noop} rtl forceNoAutoplay eagerFirst={false} />}
                </>
              )}
            </div>
          </DeviceFrame>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={!dirty} onClick={publish} className="px-5 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] disabled:opacity-40 text-white font-extrabold text-xs shadow-md transition">نشر الآن للزوار ✓</button>
        <button type="button" disabled={!dirty} onClick={() => { setDraft(live); setPreviewMode(null); }} className="px-4 py-2.5 rounded-xl bg-surface border border-line text-fg font-bold text-xs disabled:opacity-40">إلغاء التغييرات</button>
        <button
          type="button"
          onClick={() => setDraft({ mode: ADS_MODE_APPLE, carousel: { ...DEFAULT_ADS_CAROUSEL }, classic: { ...DEFAULT_ADS_CLASSIC } })}
          className="px-4 py-2.5 rounded-xl bg-surface border border-line text-fg font-bold text-xs"
        >استعادة الإعدادات الافتراضية</button>
        <button type="button" onClick={() => setHistoryOpen((o) => !o)} className="px-4 py-2.5 rounded-xl bg-surface border border-line text-fg font-bold text-xs mr-auto">🕘 سجل النسخ ({history.length})</button>
      </div>

      {historyOpen && (
        <div className="rounded-2xl border border-line bg-surface p-3 space-y-2">
          {history.length === 0 ? <p className="text-[11px] text-muted">لا توجد نسخ سابقة بعد — تُسجَّل نسخة تلقائياً عند كل نشر.</p> : history.map((h) => (
            <div key={h.ts} className="flex flex-wrap items-center justify-between gap-2 text-[11px] border-b border-line/60 pb-2 last:border-0 last:pb-0">
              <div className="font-bold text-fg">
                {new Date(h.ts).toLocaleString('ar-EG')} — {h.mode === ADS_MODE_CLASSIC ? 'Classic Hero Banner' : 'Apple Cards Carousel'}
                <span className="text-muted font-medium"> · كمبيوتر {h.carousel?.desktop} / تابلت {h.carousel?.tablet} / موبايل {h.carousel?.mobile}</span>
              </div>
              <button type="button" onClick={() => restore(h)} className="px-3 py-1 rounded-lg bg-[#0071E3] text-white font-extrabold">استعادة بضغطة</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Per-ad card controls                                               */
/* ------------------------------------------------------------------ */
export function AppleCardFields({ ad, setAd, onUploadMobile }) {
  const set = (patch) => setAd((p) => ({ ...p, ...patch }));
  const tpl = ad.cardTemplate || 'auto';
  return (
    <div className="p-4 rounded-2xl bg-surface border border-line space-y-4">
      <div className="font-extrabold text-fg text-xs">🍎 بطاقة Apple Cards لهذا الإعلان <span className="text-muted font-bold">(تؤثر على قالب البطاقات فقط، وتبقى إعدادات البانر القديم كما هي)</span></div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>قالب البطاقة (الخلفية)</label>
          <Seg value={tpl} onChange={(v) => set({ cardTemplate: v })} options={[['auto', 'تلقائي (حسب الوضع)'], ['light', 'فاتح'], ['dark', 'داكن'], ['theme', 'لون الإعلان'], ['custom', 'ألوان مخصصة']]} />
        </div>
        <div>
          <label className={labelCls}>حجم البطاقة</label>
          <Seg value={ad.cardSize || 'md'} onChange={(v) => set({ cardSize: v })} options={[['sm', 'صغير'], ['md', 'متوسط'], ['lg', 'كبير']]} />
        </div>
        <div>
          <label className={labelCls}>مكان الصورة</label>
          <Seg value={ad.cardImagePos || 'auto'} onChange={(v) => set({ cardImagePos: v === 'auto' ? '' : v })} options={[['auto', 'تلقائي'], ['bottom', 'أسفل'], ['top', 'أعلى'], ['side', 'بجانب النص'], ['full', 'خلفية كاملة']]} />
        </div>
        <div>
          <label className={labelCls}>ملاءمة الصورة</label>
          <Seg value={ad.cardImageFit || 'auto'} onChange={(v) => set({ cardImageFit: v === 'auto' ? '' : v })} options={[['auto', 'تلقائي'], ['contain', 'كاملة بدون قص (contain)'], ['cover', 'تغطية (cover)']]} />
        </div>
        <div>
          <label className={labelCls}>شكل زر التفاعل</label>
          <Seg value={ad.cardButtonStyle || 'plus'} onChange={(v) => set({ cardButtonStyle: v })} options={[['plus', 'أيقونة +'], ['pill', 'زر بنص'], ['link', 'رابط بنص'], ['none', 'بدون']]} />
          <p className="text-[10px] text-muted mt-1">نص الزر ورابطه من حقول «نص زر الإجراء» و«عند ضغط العميل يفتح». إخفاء «زر التسوق» يخفيه هنا أيضاً.</p>
        </div>
        <div>
          <label className={labelCls}>تصنيف الإعلان (سطر صغير فوق العنوان)</label>
          <input type="text" value={ad.cardCategory || ''} placeholder={ad.badge || 'مثال: جديد'} onChange={(e) => set({ cardCategory: e.target.value })} className={inputCls} />
        </div>
      </div>

      {tpl === 'custom' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-surface2/50 border border-line">
          <ColorField label="لون خلفية البطاقة (الوضع الفاتح)" value={ad.cardBg} onChange={(v) => set({ cardBg: v })} />
          <ColorField label="لون الخلفية في الوضع الداكن (اختياري)" value={ad.cardBgDark} onChange={(v) => set({ cardBgDark: v })} />
          <ColorField label="لون النص (اختياري — يُحسب تلقائياً للوضوح)" value={ad.cardTextColor} onChange={(v) => set({ cardTextColor: v })} />
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ColorField label="لون زر البطاقة (اختياري)" value={ad.cardBtnColor} onChange={(v) => set({ cardBtnColor: v })} />
        <div>
          <label className={labelCls}>رابط اختياري للبطاقة (يتقدّم على «عند ضغط العميل يفتح»)</label>
          <input type="text" dir="ltr" value={ad.cardLinkUrl || ''} placeholder="https://…  أو  #/page" onChange={(e) => set({ cardLinkUrl: e.target.value })} className={inputCls} />
          {ad.cardLinkUrl && !/^(https?:\/\/\S+|\/(?!\/)\S*|#\/\S*)$/i.test(ad.cardLinkUrl.trim()) && <p className="text-[10px] text-rose-500 mt-1 font-bold">رابط غير صالح — لن يُستخدم (مسموح: https:// أو مسار داخلي).</p>}
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>صورة مختلفة للموبايل (اختياري)</label>
          <div className="flex items-center gap-2">
            <input type="text" dir="ltr" value={ad.cardImageMobile || ''} placeholder="رابط صورة الموبايل" onChange={(e) => set({ cardImageMobile: e.target.value })} className={inputCls} />
            {onUploadMobile && <label className="px-3 py-2 rounded-xl border border-line text-[11px] font-extrabold cursor-pointer bg-surface whitespace-nowrap">رفع<input type="file" accept="image/*" className="hidden" onChange={onUploadMobile} /></label>}
          </div>
        </div>
      </div>
      <Toggle label="دمج الخلفية البيضاء للصورة مع البطاقة الفاتحة (يُطبّق في الوضع الفاتح فقط)" checked={ad.cardImageBlend !== false} onChange={(v) => set({ cardImageBlend: v })} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Editor live preview (draft ad, before publishing)                  */
/* ------------------------------------------------------------------ */
export function AdPreviewPanel({ ad, device: deviceProp, siteSettings, otherAds = [] }) {
  const [tab, setTab] = useState(resolveAdsMode(siteSettings) === ADS_MODE_CLASSIC ? 'classic' : 'cards');
  const [device, setDevice] = useState(deviceProp === 'mobile' ? 'mobile' : 'desktop');
  const [dark, setDark] = useState(false);
  useEffect(() => { setDevice(deviceProp === 'mobile' ? 'mobile' : 'desktop'); }, [deviceProp]);
  const cfg = resolveCarouselCfg(siteSettings);
  const classicCfg = resolveClassicCfg(siteSettings);
  const others = otherAds.filter((a) => a.id !== ad.id).slice(0, 3);
  const th = getAdTheme(ad);
  return (
    <div className="w-full space-y-2">
      <PreviewToolbar device={device} setDevice={setDevice} dark={dark} setDark={setDark}>
        <div className="flex gap-1">
          {[['cards', '🍎 Apple Cards'], ['classic', '🖼️ Classic Banner'], ['studio', '🎨 الاستوديو']].map(([k, l]) => (
            <button key={k} type="button" onClick={() => setTab(k)} className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border transition ${tab === k ? 'bg-fg text-bg border-fg' : 'bg-surface text-fg border-line'}`}>{l}</button>
          ))}
        </div>
      </PreviewToolbar>
      {tab === 'studio' ? (
        <div className={`mx-auto w-full ${device === 'mobile' ? 'max-w-[380px]' : ''}`}>
          <div style={{ background: th.cssGrad }} className="relative rounded-[26px] overflow-hidden border border-white/15 shadow-xl">
            <AdContent ad={ad} isPromoCard={ad.placement === 'promo_split'} rtl />
          </div>
        </div>
      ) : (
        <DeviceFrame device={device} dark={dark}>
          <div dir="rtl">
            {tab === 'cards' ? (
              <AppleCardsCarousel ads={[{ ...ad, id: ad.id || '__draft__' }, ...others]} cfg={cfg} onOpen={noop} rtl forceNoAutoplay />
            ) : (
              <AppleHero slides={[ad]} index={0} setIndex={noop} onOpen={noop} rtl heightMode={classicCfg.height} showControls={false} />
            )}
          </div>
        </DeviceFrame>
      )}
      <p className="text-[10px] text-muted text-center">{tab === 'cards' ? 'المعاينة تعرض بطاقتك أولاً ثم باقي الإعلانات النشطة بنفس إعدادات الموقع الفعلية.' : tab === 'classic' ? 'معاينة البانر الكبير الأصلي.' : 'معاينة استوديو التصميم الأصلي.'}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Saved-ads list thumbnail (matches the active display mode)         */
/* ------------------------------------------------------------------ */
export function AdListThumb({ ad, siteSettings }) {
  const th = getAdTheme(ad);
  if (resolveAdsMode(siteSettings) === ADS_MODE_APPLE) {
    return (
      <div className="p-4 bg-bg/60 pointer-events-none">
        <div className="max-w-[340px] mx-auto"><AppleAdCard ad={ad} rtl eager={false} /></div>
      </div>
    );
  }
  return (
    <div style={{ background: th.cssGrad }} className="relative overflow-hidden">
      <AdContent ad={ad} compact rtl />
    </div>
  );
}
