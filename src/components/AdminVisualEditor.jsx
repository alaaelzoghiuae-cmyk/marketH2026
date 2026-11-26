import React, { useMemo, useState } from 'react';
import {
  Monitor, Tablet, Smartphone, Eye, EyeOff, Save, Rocket, RotateCcw,
  Layers, Type, Palette, Image as ImageIcon, ArrowUp, ArrowDown,
  Plus, Trash2, CheckCircle2, Sparkles, Sliders, ExternalLink, MousePointerClick
} from 'lucide-react';
import {
  DEFAULT_HOME_SECTIONS,
  DEFAULT_TRUST_BADGES,
  CUSTOM_SECTION_TEMPLATES,
  normalizeThemeTokens,
  createVersionSnapshot
} from '../lib/adminControlCenter.js';

const VIEWPORT_WIDTHS = {
  desktop: 'w-full',
  tablet: 'w-[768px] max-w-full mx-auto',
  mobile: 'w-[390px] max-w-full mx-auto'
};

export default function AdminVisualEditor({
  siteSettings,
  setSiteSettings,
  saveSiteSettingsImmediate,
  storeAds,
  parts,
  adminSession,
  showToast,
  onOpenStorefront,
  onNavigateTab
}) {
  const initialSections = useMemo(() => {
    const saved = Array.isArray(siteSettings?.homeSectionsConfig) && siteSettings.homeSectionsConfig.length > 0
      ? siteSettings.homeSectionsConfig
      : DEFAULT_HOME_SECTIONS;
    return saved;
  }, [siteSettings?.homeSectionsConfig]);

  const initialTrust = useMemo(() => {
    return Array.isArray(siteSettings?.discoveredControls?.trustBadges) && siteSettings.discoveredControls.trustBadges.length > 0
      ? siteSettings.discoveredControls.trustBadges
      : DEFAULT_TRUST_BADGES;
  }, [siteSettings?.discoveredControls?.trustBadges]);

  const [viewport, setViewport] = useState('desktop');
  const [selectedPage, setSelectedPage] = useState('home');
  const [draftSections, setDraftSections] = useState(initialSections);
  const [draftTrustBadges, setDraftTrustBadges] = useState(initialTrust);
  const [draftHeader, setDraftHeader] = useState(() => ({
    storeName: siteSettings?.storeName || 'ELZOGHBI',
    tickerText: siteSettings?.tickerText || '',
    tickerEnabled: !!siteSettings?.tickerEnabled,
    bannerText: siteSettings?.bannerText || '',
    bannerEnabled: !!siteSettings?.bannerEnabled
  }));
  const [selectedElementId, setSelectedElementId] = useState('hero_ads');
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [previewDark, setPreviewDark] = useState(false);

  const tokens = useMemo(() => normalizeThemeTokens(siteSettings?.themeTokens), [siteSettings?.themeTokens]);
  const activePalette = previewDark ? tokens.dark : tokens.light;

  const cmsPages = Array.isArray(siteSettings?.cmsPages) ? siteSettings.cmsPages : [];

  const selectedSection = useMemo(
    () => draftSections.find((s) => s.id === selectedElementId) || null,
    [draftSections, selectedElementId]
  );

  const updateSection = (id, patch) => {
    setDraftSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setHasUnsaved(true);
  };

  const updateSectionContent = (id, contentPatch) => {
    setDraftSections((prev) => prev.map((s) => (s.id === id ? { ...s, content: { ...(s.content || {}), ...contentPatch } } : s)));
    setHasUnsaved(true);
  };

  const updateSectionStyle = (id, stylePatch) => {
    setDraftSections((prev) => prev.map((s) => (s.id === id ? { ...s, style: { ...(s.style || {}), ...stylePatch } } : s)));
    setHasUnsaved(true);
  };

  const moveSection = (idx, dir) => {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= draftSections.length) return;
    setDraftSections((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.splice(nextIdx, 0, item);
      return copy;
    });
    setHasUnsaved(true);
  };

  const addCustomSection = (tpl) => {
    const newSec = {
      id: `custom_${tpl.type}_${Date.now()}`,
      type: tpl.type,
      labelAr: tpl.labelAr,
      labelEn: tpl.labelEn,
      visible: true,
      devices: { desktop: true, tablet: true, mobile: true },
      style: { ...tpl.defaultStyle },
      content: JSON.parse(JSON.stringify(tpl.defaultContent))
    };
    setDraftSections((prev) => [...prev, newSec]);
    setSelectedElementId(newSec.id);
    setHasUnsaved(true);
    showToast && showToast(`تمت إضافة القسم «${tpl.labelAr}» إلى المسودة`, 'success');
  };

  const deleteSection = (id) => {
    if (!id.startsWith('custom_')) {
      updateSection(id, { visible: false });
      showToast && showToast('الأقسام الأساسية تُخفى بدلاً من حذفها للحفاظ على بيانات الموقع.', 'info');
      return;
    }
    setDraftSections((prev) => prev.filter((s) => s.id !== id));
    setSelectedElementId('hero_ads');
    setHasUnsaved(true);
  };

  const handleSave = (publish = true) => {
    const prevSnapshot = {
      homeSectionsConfig: siteSettings?.homeSectionsConfig || DEFAULT_HOME_SECTIONS,
      trustBadges: siteSettings?.discoveredControls?.trustBadges || DEFAULT_TRUST_BADGES,
      storeName: siteSettings?.storeName,
      tickerText: siteSettings?.tickerText,
      bannerText: siteSettings?.bannerText
    };
    const nextSnapshot = {
      homeSectionsConfig: draftSections,
      trustBadges: draftTrustBadges,
      storeName: draftHeader.storeName,
      tickerText: draftHeader.tickerText,
      bannerText: draftHeader.bannerText
    };
    const verEntry = createVersionSnapshot({
      scope: 'visual_editor',
      label: publish ? 'نشر تعديلات المحرر المرئي' : 'حفظ مسودة المحرر المرئي',
      actorName: adminSession?.displayName || adminSession?.username || 'المالك',
      actorRole: adminSession?.roleLabel || 'super_admin',
      previousValue: prevSnapshot,
      newValue: nextSnapshot,
      isMajorBackup: publish
    });

    const prevHistory = Array.isArray(siteSettings?.adminVersionHistory) ? siteSettings.adminVersionHistory : [];
    const patch = publish
      ? {
          storeName: draftHeader.storeName,
          tickerText: draftHeader.tickerText,
          tickerEnabled: draftHeader.tickerEnabled,
          bannerText: draftHeader.bannerText,
          bannerEnabled: draftHeader.bannerEnabled,
          homeSectionsConfig: draftSections,
          discoveredControls: {
            ...(siteSettings?.discoveredControls || {}),
            trustBadges: draftTrustBadges
          },
          visualEditorDraft: null,
          adminVersionHistory: [verEntry, ...prevHistory].slice(0, 60)
        }
      : {
          visualEditorDraft: {
            homeSectionsConfig: draftSections,
            trustBadges: draftTrustBadges,
            header: draftHeader,
            savedAt: new Date().toISOString()
          },
          adminVersionHistory: [verEntry, ...prevHistory].slice(0, 60)
        };

    setSiteSettings((prev) => ({ ...prev, ...patch }));
    if (saveSiteSettingsImmediate) saveSiteSettingsImmediate(patch);
    setHasUnsaved(false);
    showToast && showToast(publish ? 'تم نشر تعديلات المحرر المرئي على الموقع الفعلي ✓' : 'تم حفظ المسودة بنجاح (لم تُنشر للزوار بعد)', 'success');
  };

  const resetChanges = () => {
    setDraftSections(initialSections);
    setDraftTrustBadges(initialTrust);
    setHasUnsaved(false);
    showToast && showToast('تم التراجع عن التعديلات غير المحفوظة', 'info');
  };

  const activeAds = Array.isArray(storeAds) ? storeAds.filter((a) => a && a.active !== false) : [];
  const sampleParts = Array.isArray(parts) ? parts.slice(0, 4) : [];

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="elz-admin-card !p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-[#0071E3]/15 text-[#0071E3] flex items-center justify-center">
              <MousePointerClick className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-sm font-black text-fg">المحرر المرئي للموقع (Visual Website Editor)</h2>
              <p className="text-[11px] text-muted">اضغط على أي عنصر أو قسم في المعاينة لتعديله فوراً ورؤية النتيجة مباشرة</p>
            </div>
          </div>

          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-surface2 border border-line text-xs font-extrabold text-fg"
          >
            <option value="home">الصفحة الرئيسية (Homepage)</option>
            {cmsPages.map((pg) => (
              <option key={pg.id} value={pg.id}>صفحة: {pg.titleAr}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Device Viewport Switcher */}
          <div className="flex items-center bg-surface2 border border-line rounded-xl p-1 gap-1">
            {[
              ['desktop', Monitor, 'كمبيوتر'],
              ['tablet', Tablet, 'تابلت'],
              ['mobile', Smartphone, 'موبايل']
            ].map(([k, Icon, lbl]) => (
              <button
                key={k}
                type="button"
                onClick={() => setViewport(k)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition ${
                  viewport === k ? 'bg-[#0071E3] text-white' : 'text-muted hover:text-fg'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lbl}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPreviewDark((p) => !p)}
            className="px-2.5 py-1.5 rounded-xl bg-surface2 border border-line text-xs font-bold text-fg"
            title="تبديل وضع المعاينة (نهاري / ليلي)"
          >
            {previewDark ? '🌙 ليلي' : '☀️ نهاري'}
          </button>

          {hasUnsaved && (
            <button type="button" onClick={resetChanges} className="px-3 py-1.5 rounded-xl bg-surface2 border border-line text-xs font-bold text-muted hover:text-fg inline-flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> تراجع
            </button>
          )}

          <button
            type="button"
            onClick={() => handleSave(false)}
            className="px-3 py-1.5 rounded-xl bg-surface2 hover:border-[#0071E3] border border-line text-xs font-extrabold text-fg inline-flex items-center gap-1"
          >
            <Save className="w-3.5 h-3.5 text-[#0071E3]" /> حفظ كمسودة
          </button>

          <button
            type="button"
            onClick={() => handleSave(true)}
            className="px-4 py-1.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-black inline-flex items-center gap-1.5 shadow-sm"
          >
            <Rocket className="w-3.5 h-3.5" /> نشر التعديلات
          </button>

          {onOpenStorefront && (
            <button
              type="button"
              onClick={onOpenStorefront}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold inline-flex items-center gap-1"
            >
              <ExternalLink className="w-3.5 h-3.5" /> فتح الموقع
            </button>
          )}
        </div>
      </div>

      {/* Main Split Workspace: Live Interactive Canvas + Right/Left Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Live Interactive Preview Canvas (8 cols) */}
        <div className="xl:col-span-8 bg-surface2/60 border border-line rounded-3xl p-3 sm:p-5">
          <div
            className={`${VIEWPORT_WIDTHS[viewport]} rounded-2xl border border-line overflow-hidden shadow-lg transition-all duration-300`}
            style={{ backgroundColor: activePalette.bg, color: activePalette.text }}
          >
            {/* Clickable Header & Announcement Bar */}
            <div
              onClick={() => setSelectedElementId('__header__')}
              className={`cursor-pointer transition border-b p-3 flex items-center justify-between gap-2 ${
                selectedElementId === '__header__' ? 'ring-2 ring-[#0071E3] ring-inset' : 'hover:ring-1 hover:ring-[#0071E3]/50'
              }`}
              style={{ backgroundColor: activePalette.surface, borderColor: activePalette.border }}
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#0071E3] text-white">Header</span>
                <span className="font-black text-sm">{draftHeader.storeName || 'ELZOGHBI'}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] opacity-75">
                {draftHeader.tickerEnabled && <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600">شريط متحرك مفعل</span>}
                <span>اضغط لتعديل الهيدر والإعلانات العلوية</span>
              </div>
            </div>

            {/* Interactive Sections List */}
            <div className="p-3 sm:p-4 space-y-3">
              {draftSections.map((sec, idx) => {
                const isSelected = selectedElementId === sec.id;
                const deviceHidden = sec.devices && sec.devices[viewport] === false;
                return (
                  <div
                    key={sec.id}
                    onClick={() => setSelectedElementId(sec.id)}
                    className={`relative rounded-2xl border p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#0071E3] ring-2 ring-[#0071E3]/30'
                        : 'border-line/70 hover:border-[#0071E3]/60'
                    } ${!sec.visible || deviceHidden ? 'opacity-45 border-dashed' : ''}`}
                    style={{
                      backgroundColor: sec.style?.bgMode === 'dark'
                        ? '#1D1D1F'
                        : sec.style?.bgMode === 'accent'
                          ? (sec.style?.accentColor || activePalette.primary)
                          : activePalette.surface,
                      color: (sec.style?.bgMode === 'dark' || sec.style?.bgMode === 'accent') ? '#FFFFFF' : activePalette.text
                    }}
                  >
                    {/* Section Floating Mini Controls */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#0071E3] text-white">
                          #{idx + 1} · {sec.labelAr || sec.type}
                        </span>
                        {!sec.visible && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-400">مخفي</span>}
                        {deviceHidden && <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-400">مخفي على {viewport}</span>}
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => moveSection(idx, -1)} disabled={idx === 0} className="p-1 rounded-lg bg-black/10 hover:bg-black/20 disabled:opacity-30" title="تحريك لأعلى"><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => moveSection(idx, 1)} disabled={idx === draftSections.length - 1} className="p-1 rounded-lg bg-black/10 hover:bg-black/20 disabled:opacity-30" title="تحريك لأسفل"><ArrowDown className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => updateSection(sec.id, { visible: !sec.visible })} className="p-1 rounded-lg bg-black/10 hover:bg-black/20" title={sec.visible ? 'إخفاء القسم' : 'إظهار القسم'}>
                          {sec.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        {sec.id.startsWith('custom_') && (
                          <button type="button" onClick={() => deleteSection(sec.id)} className="p-1 rounded-lg bg-rose-500/20 text-rose-500 hover:bg-rose-600 hover:text-white" title="حذف القسم">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Real Data Preview per Section Type */}
                    {sec.type === 'hero_ads' && (
                      <div className="space-y-2.5">
                        <div className="rounded-xl p-4 bg-black/5 dark:bg-white/5 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-xs font-bold opacity-70">العروض والبانر الرئيسي ({activeAds.length} إعلان نشط)</div>
                            <div className="text-base font-black mt-0.5">{activeAds[0]?.title || 'بانر الزغبي ماركت الرئيسي'}</div>
                            <div className="text-xs opacity-75">{activeAds[0]?.subtitle || 'اضغط لتعديل الإعلانات أو شارات الثقة أسفل البانر'}</div>
                          </div>
                          {activeAds[0]?.image && (
                            <img src={activeAds[0].image} alt="" className="w-16 h-16 rounded-xl object-contain bg-white/80 p-1 shrink-0" />
                          )}
                        </div>
                        {sec.content?.showTrustStrip !== false && (
                          <div className={`grid ${viewport === 'mobile' ? 'grid-cols-2' : 'grid-cols-4'} gap-2`}>
                            {draftTrustBadges.filter((b) => b.visible !== false).map((tb) => (
                              <div key={tb.id} className="rounded-xl px-2.5 py-2 bg-black/5 dark:bg-white/5 text-[11px]">
                                <div className="font-black truncate">{tb.title}</div>
                                <div className="opacity-70 truncate">{tb.desc}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {sec.type === 'sourcing_tile' && (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-bold text-amber-400">{sec.content?.eyebrow || 'استيراد وتوفير خاص'}</div>
                          <div className="text-base font-black">{sec.content?.title || 'خدمة اطلب منتجك'}</div>
                          <div className="text-xs opacity-75">{sec.content?.subtitle || 'ملقتش المنتج اللي بتدور عليه؟ ابعتلنا اسمه أو صورته.'}</div>
                        </div>
                        <span className="px-4 py-1.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: sec.style?.accentColor || activePalette.primary }}>
                          {sec.content?.ctaText || 'اطلب منتجك'}
                        </span>
                      </div>
                    )}

                    {sec.type === 'best_sellers' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-black text-sm">{sec.content?.title || 'الأكثر مبيعاً وطلباً'}</div>
                            <div className="text-[11px] opacity-70">{sec.content?.subtitle || 'منتجات مختارة بأعلى تقييم'}</div>
                          </div>
                          <span className="text-xs font-bold" style={{ color: activePalette.accent }}>{sec.content?.ctaText || 'عرض الكل'}</span>
                        </div>
                        <div className={`grid ${viewport === 'mobile' ? 'grid-cols-2' : 'grid-cols-4'} gap-2`}>
                          {sampleParts.slice(0, Number(sec.content?.limit) || 4).map((p) => (
                            <div key={p.id} className="rounded-xl p-2 bg-black/5 dark:bg-white/5 text-[11px]">
                              <div className="font-bold truncate">{p.name}</div>
                              <div className="font-black mt-0.5" style={{ color: activePalette.primary }}>{Number(p.basePrice || 0).toLocaleString('ar-EG')} ج.م</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sec.type === 'newsletter' && (
                      <div className="text-center py-2 space-y-1">
                        <div className="font-black text-sm">{sec.content?.title || 'اشترك في نشرتنا البريدية'}</div>
                        <div className="text-xs opacity-75">{sec.content?.subtitle || 'ليصلك أحدث العروض والمنتجات الجديدة.'}</div>
                        <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 rounded-full bg-black/10 text-[11px]">
                          <span>{sec.content?.placeholder || 'بريدك الإلكتروني أو رقم واتساب'}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-white font-bold" style={{ backgroundColor: sec.style?.accentColor || activePalette.primary }}>
                            {sec.content?.ctaText || 'اشترك'}
                          </span>
                        </div>
                      </div>
                    )}

                    {sec.type === 'custom_banner' && (
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="text-[11px] font-bold opacity-80">{sec.content?.eyebrow}</div>
                          <div className="text-base font-black">{sec.content?.title}</div>
                          <div className="text-xs opacity-80">{sec.content?.subtitle}</div>
                        </div>
                        <span className="px-4 py-1.5 rounded-full bg-white text-slate-900 text-xs font-black">{sec.content?.ctaText || 'تصفح'}</span>
                      </div>
                    )}

                    {sec.type === 'custom_products' && (
                      <div className="text-xs opacity-80">
                        <div className="font-black text-sm">{sec.content?.title}</div>
                        <div>مصدر المنتجات: {sec.content?.sourceType || 'discounts'} · عدد العناصر: {sec.content?.limit || 4}</div>
                      </div>
                    )}

                    {sec.type === 'custom_features' && (
                      <div className="space-y-1.5">
                        <div className="font-black text-sm">{sec.content?.title}</div>
                        <div className={`grid ${viewport === 'mobile' ? 'grid-cols-2' : 'grid-cols-4'} gap-2`}>
                          {(sec.content?.items || []).map((it, i) => (
                            <div key={i} className="rounded-xl p-2 bg-black/5 dark:bg-white/5 text-[11px]">
                              <div className="font-bold">{it.icon} {it.title}</div>
                              <div className="opacity-70 truncate">{it.desc}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sec.type === 'custom_faq' && (
                      <div className="space-y-1">
                        <div className="font-black text-sm">{sec.content?.title}</div>
                        {(sec.content?.items || []).slice(0, 2).map((it, i) => (
                          <div key={i} className="text-[11px] opacity-80">• {it.q}</div>
                        ))}
                      </div>
                    )}

                    {['karambo_strip', 'legacy_strips', 'editorial_showcase', 'promo_split', 'showcase_bars'].includes(sec.type) && (
                      <div className="text-xs opacity-75">
                        قسم حي متصل مباشرة ببيانات المتجر الفعلية — يمكنك إظهاره/إخفاؤه أو تغيير ترتيبه أو تحديد الأجهزة التي يظهر عليها.
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add Section Bar */}
              <div className="rounded-2xl border-2 border-dashed border-[#0071E3]/40 p-3 text-center space-y-2">
                <div className="text-xs font-black text-[#0071E3] flex items-center justify-center gap-1.5">
                  <Plus className="w-4 h-4" /> إضافة قسم جديد إلى الصفحة الرئيسية
                </div>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {CUSTOM_SECTION_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.type}
                      type="button"
                      onClick={() => addCustomSection(tpl)}
                      className="px-3 py-1.5 rounded-xl bg-[#0071E3]/10 hover:bg-[#0071E3] text-[#0071E3] hover:text-white text-[11px] font-extrabold transition"
                    >
                      + {tpl.labelAr}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Element Inspector Panel (4 cols) */}
        <div className="xl:col-span-4 elz-admin-card space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#0071E3]" />
              <h3 className="text-sm font-black text-fg">خصائص العنصر المحدد</h3>
            </div>
            {hasUnsaved && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600">تغييرات غير منشورة</span>
            )}
          </div>

          {selectedElementId === '__header__' ? (
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-extrabold text-muted block">اسم المتجر في الهيدر</label>
                <input
                  value={draftHeader.storeName}
                  onChange={(e) => { setDraftHeader((p) => ({ ...p, storeName: e.target.value })); setHasUnsaved(true); }}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-fg font-bold"
                />
              </div>
              <label className="flex items-center gap-2 font-bold text-fg cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftHeader.tickerEnabled}
                  onChange={(e) => { setDraftHeader((p) => ({ ...p, tickerEnabled: e.target.checked })); setHasUnsaved(true); }}
                />
                تفعيل الشريط المتحرك العلوي
              </label>
              <div className="space-y-1">
                <label className="font-extrabold text-muted block">نص الشريط المتحرك</label>
                <textarea
                  rows={2}
                  value={draftHeader.tickerText}
                  onChange={(e) => { setDraftHeader((p) => ({ ...p, tickerText: e.target.value })); setHasUnsaved(true); }}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-fg font-bold"
                />
              </div>
              <label className="flex items-center gap-2 font-bold text-fg cursor-pointer">
                <input
                  type="checkbox"
                  checked={draftHeader.bannerEnabled}
                  onChange={(e) => { setDraftHeader((p) => ({ ...p, bannerEnabled: e.target.checked })); setHasUnsaved(true); }}
                />
                تفعيل بانر التنبيه العلوي
              </label>
              <div className="space-y-1">
                <label className="font-extrabold text-muted block">نص بانر التنبيه العلوي</label>
                <input
                  value={draftHeader.bannerText}
                  onChange={(e) => { setDraftHeader((p) => ({ ...p, bannerText: e.target.value })); setHasUnsaved(true); }}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-fg font-bold"
                />
              </div>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab('theme_editor')}
                  className="w-full py-2 rounded-xl bg-[#0071E3]/10 text-[#0071E3] font-extrabold inline-flex items-center justify-center gap-1.5"
                >
                  <Palette className="w-3.5 h-3.5" /> فتح محرر الألوان والخطوط الكامل
                </button>
              )}
            </div>
          ) : selectedSection ? (
            <div className="space-y-3.5 text-xs">
              <div className="rounded-xl bg-surface2 p-3 space-y-2">
                <div className="font-black text-fg">{selectedSection.labelAr}</div>
                <label className="flex items-center gap-2 font-bold text-fg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSection.visible !== false}
                    onChange={(e) => updateSection(selectedSection.id, { visible: e.target.checked })}
                  />
                  إظهار القسم في الموقع
                </label>
              </div>

              {/* Device Visibility */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-muted block">الأجهزة التي يظهر عليها القسم</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[['desktop', 'كمبيوتر'], ['tablet', 'تابلت'], ['mobile', 'موبايل']].map(([dk, dl]) => {
                    const active = selectedSection.devices?.[dk] !== false;
                    return (
                      <button
                        key={dk}
                        type="button"
                        onClick={() => updateSection(selectedSection.id, { devices: { desktop: true, tablet: true, mobile: true, ...(selectedSection.devices || {}), [dk]: !active } })}
                        className={`py-1.5 rounded-xl border font-extrabold transition ${
                          active ? 'bg-[#0071E3]/15 border-[#0071E3] text-[#0071E3]' : 'bg-surface2 border-line text-muted'
                        }`}
                      >
                        {dl}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Visual Style Controls */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-extrabold text-muted block">خلفية القسم</label>
                  <select
                    value={selectedSection.style?.bgMode || 'default'}
                    onChange={(e) => updateSectionStyle(selectedSection.id, { bgMode: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl border border-line bg-bg text-fg font-bold"
                  >
                    <option value="default">افتراضي الموقع</option>
                    <option value="surface">سطح ناعم (Surface)</option>
                    <option value="dark">داكن (Apple Dark)</option>
                    <option value="accent">لون مميز (Accent)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold text-muted block">اللون المميز / الزر</label>
                  <input
                    type="color"
                    value={selectedSection.style?.accentColor || '#0071E3'}
                    onChange={(e) => updateSectionStyle(selectedSection.id, { accentColor: e.target.value })}
                    className="w-full h-9 rounded-xl border border-line bg-bg cursor-pointer"
                  />
                </div>
              </div>

              {/* Size / colour controls (applied live on the storefront) */}
              <div className="grid grid-cols-2 gap-2 border-t border-line pt-3">
                {[['paddingTop','مسافة داخلية أعلى (px)',0,200],['paddingBottom','مسافة داخلية أسفل (px)',0,200],['marginTop','مسافة فوق القسم (px)',-40,200],['minHeight','أقل ارتفاع (px)',0,1200],['radius','انحناء الحواف (px)',0,80],['widthPct','عرض القسم (%)',30,100]].map(([k,l,mn,mx]) => (
                  <div key={k} className="space-y-1">
                    <label className="font-extrabold text-muted block">{l}</label>
                    <input type="number" min={mn} max={mx} value={selectedSection.style?.[k] ?? ''} placeholder="تلقائي"
                      onChange={(e) => updateSectionStyle(selectedSection.id, { [k]: e.target.value === '' ? '' : Number(e.target.value) })}
                      className="w-full px-2.5 py-2 rounded-xl border border-line bg-bg text-fg font-bold" />
                  </div>
                ))}
                {[['bgColor','لون الخلفية'],['textColor','لون النص']].map(([k,l]) => (
                  <div key={k} className="space-y-1">
                    <label className="font-extrabold text-muted block">{l}</label>
                    <div className="flex gap-1">
                      <input type="color" value={selectedSection.style?.[k] || '#ffffff'} onChange={(e) => updateSectionStyle(selectedSection.id, { [k]: e.target.value })} className="flex-1 h-9 rounded-xl border border-line bg-bg cursor-pointer" />
                      <button type="button" onClick={() => updateSectionStyle(selectedSection.id, { [k]: '' })} className="px-2 rounded-xl border border-line bg-surface2 text-muted font-bold">مسح</button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Dynamic Content Fields per Section Type */}
              {selectedSection.type === 'hero_ads' && (
                <div className="space-y-2.5 border-t border-line pt-3">
                  <label className="flex items-center gap-2 font-bold text-fg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSection.content?.showTrustStrip !== false}
                      onChange={(e) => updateSectionContent(selectedSection.id, { showTrustStrip: e.target.checked })}
                    />
                    إظهار شريط شارات الثقة (4 مربعات) أسفل البانر
                  </label>
                  <div className="space-y-2">
                    <div className="font-extrabold text-muted">تعديل نصوص شارات الثقة:</div>
                    {draftTrustBadges.map((tb, i) => (
                      <div key={tb.id} className="p-2 rounded-xl bg-surface2 space-y-1.5">
                        <input
                          value={tb.title}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDraftTrustBadges((prev) => prev.map((x, idx) => (idx === i ? { ...x, title: v } : x)));
                            setHasUnsaved(true);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-surface text-fg font-bold"
                          placeholder="العنوان"
                        />
                        <input
                          value={tb.desc}
                          onChange={(e) => {
                            const v = e.target.value;
                            setDraftTrustBadges((prev) => prev.map((x, idx) => (idx === i ? { ...x, desc: v } : x)));
                            setHasUnsaved(true);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-line bg-surface text-muted font-semibold"
                          placeholder="الوصف المختصر"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {['sourcing_tile', 'custom_banner'].includes(selectedSection.type) && (
                <div className="space-y-2 border-t border-line pt-3">
                  <div className="space-y-1">
                    <label className="font-extrabold text-muted block">النص التعريفي الصغير (Eyebrow)</label>
                    <input value={selectedSection.content?.eyebrow || ''} onChange={(e) => updateSectionContent(selectedSection.id, { eyebrow: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line bg-bg font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-muted block">العنوان الرئيسي</label>
                    <input value={selectedSection.content?.title || ''} onChange={(e) => updateSectionContent(selectedSection.id, { title: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line bg-bg font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-muted block">الوصف</label>
                    <textarea rows={2} value={selectedSection.content?.subtitle || ''} onChange={(e) => updateSectionContent(selectedSection.id, { subtitle: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line bg-bg font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-muted block">نص الزر (CTA)</label>
                    <input value={selectedSection.content?.ctaText || ''} onChange={(e) => updateSectionContent(selectedSection.id, { ctaText: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line bg-bg font-bold" />
                  </div>
                </div>
              )}

              {['best_sellers', 'custom_products'].includes(selectedSection.type) && (
                <div className="space-y-2 border-t border-line pt-3">
                  <div className="space-y-1">
                    <label className="font-extrabold text-muted block">عنوان القسم</label>
                    <input value={selectedSection.content?.title || ''} onChange={(e) => updateSectionContent(selectedSection.id, { title: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line bg-bg font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-muted block">الوصف الفرعي</label>
                    <input value={selectedSection.content?.subtitle || ''} onChange={(e) => updateSectionContent(selectedSection.id, { subtitle: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line bg-bg font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="font-extrabold text-muted block">عدد المنتجات</label>
                      <input type="number" min={2} max={12} value={selectedSection.content?.limit || 4} onChange={(e) => updateSectionContent(selectedSection.id, { limit: Number(e.target.value) || 4 })} className="w-full px-3 py-2 rounded-xl border border-line bg-bg font-bold" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-extrabold text-muted block">طريقة العرض</label>
                      <select value={selectedSection.content?.layout || 'rail'} onChange={(e) => updateSectionContent(selectedSection.id, { layout: e.target.value })} className="w-full px-2.5 py-2 rounded-xl border border-line bg-bg font-bold">
                        <option value="rail">شريط أفقي (Rail)</option>
                        <option value="grid">شبكة منظمة (Grid)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {selectedSection.type === 'newsletter' && (
                <div className="space-y-2 border-t border-line pt-3">
                  <div className="space-y-1">
                    <label className="font-extrabold text-muted block">عنوان النشرة</label>
                    <input value={selectedSection.content?.title || ''} onChange={(e) => updateSectionContent(selectedSection.id, { title: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line bg-bg font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-muted block">الوصف</label>
                    <textarea rows={2} value={selectedSection.content?.subtitle || ''} onChange={(e) => updateSectionContent(selectedSection.id, { subtitle: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line bg-bg font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-muted block">نص الحقل (Placeholder)</label>
                    <input value={selectedSection.content?.placeholder || ''} onChange={(e) => updateSectionContent(selectedSection.id, { placeholder: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line bg-bg font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-muted block">نص زر الاشتراك</label>
                    <input value={selectedSection.content?.ctaText || ''} onChange={(e) => updateSectionContent(selectedSection.id, { ctaText: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line bg-bg font-bold" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted">اختر أي عنصر من المعاينة لتعديله.</p>
          )}
        </div>
      </div>
    </div>
  );
}
