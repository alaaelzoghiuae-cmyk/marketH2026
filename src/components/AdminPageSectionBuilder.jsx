import React, { useMemo, useState } from 'react';
import {
  Layers, FileText, Sliders, Plus, Copy, Trash2, Eye, EyeOff,
  ArrowUp, ArrowDown, Save, Globe, Search, CheckCircle2, Sparkles, Monitor, Tablet, Smartphone
} from 'lucide-react';
import {
  DEFAULT_HOME_SECTIONS,
  DEFAULT_CMS_PAGES,
  DEFAULT_DISCOVERED_CONTROLS,
  CUSTOM_SECTION_TEMPLATES,
  PAGE_TEMPLATES,
  createVersionSnapshot
} from '../lib/adminControlCenter.js';

export default function AdminPageSectionBuilder({
  siteSettings,
  setSiteSettings,
  saveSiteSettingsImmediate,
  adminSession,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('sections'); // 'sections' | 'pages' | 'controls'
  const [sections, setSections] = useState(() =>
    Array.isArray(siteSettings?.homeSectionsConfig) && siteSettings.homeSectionsConfig.length > 0
      ? siteSettings.homeSectionsConfig
      : DEFAULT_HOME_SECTIONS
  );
  const [pages, setPages] = useState(() =>
    Array.isArray(siteSettings?.cmsPages) && siteSettings.cmsPages.length > 0
      ? siteSettings.cmsPages
      : DEFAULT_CMS_PAGES
  );
  const [controls, setControls] = useState(() => ({
    ...DEFAULT_DISCOVERED_CONTROLS,
    ...(siteSettings?.discoveredControls || {}),
    emptyStates: { ...DEFAULT_DISCOVERED_CONTROLS.emptyStates, ...(siteSettings?.discoveredControls?.emptyStates || {}) },
    errorMessages: { ...DEFAULT_DISCOVERED_CONTROLS.errorMessages, ...(siteSettings?.discoveredControls?.errorMessages || {}) },
    seo: { ...DEFAULT_DISCOVERED_CONTROLS.seo, ...(siteSettings?.discoveredControls?.seo || {}) },
    legalPages: { ...DEFAULT_DISCOVERED_CONTROLS.legalPages, ...(siteSettings?.discoveredControls?.legalPages || {}) },
    productDisplay: { ...DEFAULT_DISCOVERED_CONTROLS.productDisplay, ...(siteSettings?.discoveredControls?.productDisplay || {}) }
  }));

  const [selectedPageId, setSelectedPageId] = useState(() => pages[0]?.id || null);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageTemplate, setNewPageTemplate] = useState('landing');
  const [dragIdx, setDragIdx] = useState(null);

  const selectedPage = useMemo(() => pages.find((p) => p.id === selectedPageId) || null, [pages, selectedPageId]);

  const commitAll = (scope, label, patch) => {
    const ver = createVersionSnapshot({
      scope,
      label,
      actorName: adminSession?.displayName || adminSession?.username || 'المالك',
      actorRole: adminSession?.roleLabel || 'super_admin',
      previousValue: {
        homeSectionsConfig: siteSettings?.homeSectionsConfig,
        cmsPages: siteSettings?.cmsPages,
        discoveredControls: siteSettings?.discoveredControls
      },
      newValue: patch,
      isMajorBackup: true
    });
    const prevHistory = Array.isArray(siteSettings?.adminVersionHistory) ? siteSettings.adminVersionHistory : [];
    const fullPatch = { ...patch, adminVersionHistory: [ver, ...prevHistory].slice(0, 60) };
    setSiteSettings((prev) => ({ ...prev, ...fullPatch }));
    if (saveSiteSettingsImmediate) saveSiteSettingsImmediate(fullPatch);
    showToast && showToast(`${label} ✓`, 'success');
  };

  // --- Section Builder handlers ---
  const moveSection = (from, to) => {
    if (to < 0 || to >= sections.length || from === to) return;
    setSections((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const duplicateSection = (sec) => {
    const copy = {
      ...JSON.parse(JSON.stringify(sec)),
      id: `custom_${sec.type}_${Date.now()}`,
      labelAr: `${sec.labelAr} (نسخة)`
    };
    setSections((prev) => [...prev, copy]);
    showToast && showToast('تم نسخ القسم بنجاح', 'success');
  };

  const addSectionFromTemplate = (tpl) => {
    const item = {
      id: `custom_${tpl.type}_${Date.now()}`,
      type: tpl.type,
      labelAr: tpl.labelAr,
      labelEn: tpl.labelEn,
      visible: true,
      devices: { desktop: true, tablet: true, mobile: true },
      style: { ...tpl.defaultStyle },
      content: JSON.parse(JSON.stringify(tpl.defaultContent))
    };
    setSections((prev) => [...prev, item]);
    showToast && showToast(`تمت إضافة «${tpl.labelAr}»`, 'success');
  };

  // --- Page Builder handlers ---
  const createPage = () => {
    const title = newPageTitle.trim();
    if (!title) { showToast && showToast('اكتب عنوان الصفحة أولاً', 'warning'); return; }
    const slug = (newPageSlug.trim() || title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')).replace(/^-|-$/g, '') || `page-${Date.now()}`;
    const tpl = PAGE_TEMPLATES.find((t) => t.id === newPageTemplate) || PAGE_TEMPLATES[0];
    const pageObj = {
      id: `pg_${Date.now()}`,
      slug,
      titleAr: title,
      titleEn: slug,
      template: tpl.id,
      status: 'published',
      showInHeader: false,
      showInFooter: true,
      seoTitle: `${title} | ELZOGHBI MARKET`,
      seoDescription: `${title} — الزغبي ماركت لقطع غيار وإكسسوارات الموبايل`,
      sections: tpl.sections.map((s, idx) => ({
        id: `psec_${Date.now()}_${idx}`,
        type: s.type,
        visible: true,
        devices: { desktop: true, tablet: true, mobile: true },
        style: { ...s.defaultStyle },
        content: JSON.parse(JSON.stringify(s.defaultContent))
      }))
    };
    setPages((prev) => [pageObj, ...prev]);
    setSelectedPageId(pageObj.id);
    setNewPageTitle('');
    setNewPageSlug('');
    showToast && showToast(`تم إنشاء الصفحة «${title}» — اضغط حفظ الصفحات لنشرها`, 'success');
  };

  const updatePage = (id, patch) => {
    setPages((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const deletePage = (id) => {
    if (!window.confirm('هل تريد حذف هذه الصفحة المخصصة؟')) return;
    setPages((prev) => prev.filter((p) => p.id !== id));
    if (selectedPageId === id) setSelectedPageId(null);
  };

  const inp = 'w-full px-3 py-2 rounded-xl border border-line bg-bg text-fg text-xs font-bold outline-none focus:border-[#0071E3]';

  return (
    <div className="space-y-4">
      {/* Header & Sub-Tabs */}
      <div className="elz-admin-card !p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-fg flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#0071E3]" />
            منشئ الصفحات والأقسام وأدوات التحكم المكتشفة
          </h2>
          <p className="text-xs text-muted mt-0.5">إدارة ترتيب أقسام الرئيسية بالسحب والإفلات، إنشاء صفحات جديدة مع SEO، والتحكم في النصوص والشارات وحالات الفراغ</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ['sections', Layers, `منشئ الأقسام (${sections.length})`],
            ['pages', FileText, `منشئ الصفحات (${pages.length})`],
            ['controls', Sliders, 'أدوات التحكم المكتشفة والـ SEO']
          ].map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border inline-flex items-center gap-1.5 transition ${
                activeTab === id ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-surface2 border-line text-fg hover:border-[#0071E3]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: SECTION BUILDER */}
      {activeTab === 'sections' && (
        <div className="space-y-4">
          <div className="elz-admin-card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-black text-fg">اسحب وأفلت الأقسام لتغيير ترتيبها في الصفحة الرئيسية أو استخدم الأسهم:</div>
              <button
                type="button"
                onClick={() => commitAll('sections', 'حفظ ترتيب وإعدادات أقسام الرئيسية', { homeSectionsConfig: sections })}
                className="px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-black inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> حفظ ونشر الأقسام
              </button>
            </div>

            <div className="space-y-2">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  draggable
                  onDragStart={() => setDragIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (dragIdx !== null) moveSection(dragIdx, idx); setDragIdx(null); }}
                  className={`p-3 rounded-2xl border bg-surface2/60 flex flex-wrap items-center justify-between gap-3 cursor-grab active:cursor-grabbing transition ${
                    sec.visible !== false ? 'border-line' : 'border-dashed border-line opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-[#0071E3]/15 text-[#0071E3] font-mono text-xs font-black flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-fg truncate">{sec.labelAr}</div>
                      <div className="text-[10.5px] text-muted font-mono">{sec.type}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Device visibility toggles */}
                    {[
                      ['desktop', Monitor, 'كمبيوتر'],
                      ['tablet', Tablet, 'تابلت'],
                      ['mobile', Smartphone, 'موبايل']
                    ].map(([dk, Icon, title]) => {
                      const on = sec.devices?.[dk] !== false;
                      return (
                        <button
                          key={dk}
                          type="button"
                          title={`إظهار على ${title}`}
                          onClick={() => setSections((prev) => prev.map((x) => (x.id === sec.id ? { ...x, devices: { desktop: true, tablet: true, mobile: true, ...(x.devices || {}), [dk]: !on } } : x)))}
                          className={`p-1.5 rounded-lg border text-[10px] ${on ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600' : 'bg-surface border-line text-muted'}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}

                    <button type="button" onClick={() => moveSection(idx, idx - 1)} disabled={idx === 0} className="p-1.5 rounded-lg bg-surface border border-line disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => moveSection(idx, idx + 1)} disabled={idx === sections.length - 1} className="p-1.5 rounded-lg bg-surface border border-line disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => duplicateSection(sec)} className="p-1.5 rounded-lg bg-surface border border-line" title="نسخ القسم"><Copy className="w-3.5 h-3.5" /></button>
                    <button
                      type="button"
                      onClick={() => setSections((prev) => prev.map((x) => (x.id === sec.id ? { ...x, visible: !(x.visible !== false) } : x)))}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold border inline-flex items-center gap-1 ${
                        sec.visible !== false ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                      }`}
                    >
                      {sec.visible !== false ? <><Eye className="w-3.5 h-3.5" /> ظاهر</> : <><EyeOff className="w-3.5 h-3.5" /> مخفي</>}
                    </button>
                    {sec.id.startsWith('custom_') && (
                      <button type="button" onClick={() => setSections((prev) => prev.filter((x) => x.id !== sec.id))} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-600 hover:text-white"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-line space-y-2">
              <div className="text-xs font-black text-muted">إضافة قسم جديد جاهز ومتصل ببيانات المتجر:</div>
              <div className="flex flex-wrap gap-2">
                {CUSTOM_SECTION_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.type}
                    type="button"
                    onClick={() => addSectionFromTemplate(tpl)}
                    className="px-3 py-2 rounded-xl bg-[#0071E3]/10 hover:bg-[#0071E3] text-[#0071E3] hover:text-white text-xs font-extrabold inline-flex items-center gap-1.5 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> {tpl.labelAr}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAGE BUILDER */}
      {activeTab === 'pages' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
          {/* Pages list & Create form */}
          <div className="xl:col-span-5 elz-admin-card space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-black text-fg">إنشاء صفحة جديدة</h3>
              <input value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} placeholder="عنوان الصفحة (مثال: عروض الصيانة)" className={inp} />
              <input value={newPageSlug} onChange={(e) => setNewPageSlug(e.target.value)} placeholder="الرابط المختصر Slug (مثال: repair-offers)" dir="ltr" className={inp} />
              <select value={newPageTemplate} onChange={(e) => setNewPageTemplate(e.target.value)} className={inp}>
                {PAGE_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.labelAr}</option>)}
              </select>
              <button type="button" onClick={createPage} className="w-full py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-black inline-flex items-center justify-center gap-1.5">
                <Plus className="w-4 h-4" /> إنشاء الصفحة
              </button>
            </div>

            <div className="border-t border-line pt-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-muted">الصفحات الحالية ({pages.length})</span>
                <button
                  type="button"
                  onClick={() => commitAll('pages', 'حفظ ونشر صفحات الموقع (Page Builder)', { cmsPages: pages })}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-[11px] font-black inline-flex items-center gap-1"
                >
                  <Save className="w-3 h-3" /> حفظ الكل
                </button>
              </div>
              {pages.map((pg) => (
                <button
                  key={pg.id}
                  type="button"
                  onClick={() => setSelectedPageId(pg.id)}
                  className={`w-full text-start p-3 rounded-xl border transition flex items-center justify-between gap-2 ${
                    selectedPageId === pg.id ? 'border-[#0071E3] bg-[#0071E3]/10' : 'border-line bg-surface2/50 hover:border-[#0071E3]/50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-black text-fg truncate">{pg.titleAr}</div>
                    <div className="text-[10.5px] font-mono text-muted" dir="ltr">#/page/{pg.slug}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${pg.status === 'published' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'}`}>
                    {pg.status === 'published' ? 'منشورة' : 'مسودة'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Page Editor */}
          <div className="xl:col-span-7 elz-admin-card space-y-4">
            {selectedPage ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
                  <h3 className="text-sm font-black text-fg">تعديل صفحة: {selectedPage.titleAr}</h3>
                  <button type="button" onClick={() => deletePage(selectedPage.id)} className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-extrabold inline-flex items-center gap-1">
                    <Trash2 className="w-3.5 h-3.5" /> حذف الصفحة
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-extrabold text-muted">عنوان الصفحة (عربي)</label>
                    <input value={selectedPage.titleAr} onChange={(e) => updatePage(selectedPage.id, { titleAr: e.target.value })} className={inp} />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-muted">الرابط المختصر (Slug)</label>
                    <input value={selectedPage.slug} onChange={(e) => updatePage(selectedPage.id, { slug: e.target.value })} dir="ltr" className={inp} />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-muted">حالة الظهور</label>
                    <select value={selectedPage.status} onChange={(e) => updatePage(selectedPage.id, { status: e.target.value })} className={inp}>
                      <option value="published">منشورة للجميع</option>
                      <option value="draft">مسودة (مخفية)</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-4 pb-2">
                    <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                      <input type="checkbox" checked={!!selectedPage.showInHeader} onChange={(e) => updatePage(selectedPage.id, { showInHeader: e.target.checked })} />
                      إظهار في القائمة العلوية
                    </label>
                    <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                      <input type="checkbox" checked={selectedPage.showInFooter !== false} onChange={(e) => updatePage(selectedPage.id, { showInFooter: e.target.checked })} />
                      إظهار في الفوتر
                    </label>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-extrabold text-muted">عنوان محركات البحث (SEO Title)</label>
                    <input value={selectedPage.seoTitle || ''} onChange={(e) => updatePage(selectedPage.id, { seoTitle: e.target.value })} className={inp} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-extrabold text-muted">وصف محركات البحث (SEO Meta Description)</label>
                    <textarea rows={2} value={selectedPage.seoDescription || ''} onChange={(e) => updatePage(selectedPage.id, { seoDescription: e.target.value })} className={inp} />
                  </div>
                </div>

                <div className="border-t border-line pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-fg">أقسام الصفحة ({(selectedPage.sections || []).length})</span>
                    <div className="flex flex-wrap gap-1">
                      {CUSTOM_SECTION_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.type}
                          type="button"
                          onClick={() => updatePage(selectedPage.id, {
                            sections: [...(selectedPage.sections || []), {
                              id: `psec_${Date.now()}`,
                              type: tpl.type,
                              visible: true,
                              devices: { desktop: true, tablet: true, mobile: true },
                              style: { ...tpl.defaultStyle },
                              content: JSON.parse(JSON.stringify(tpl.defaultContent))
                            }]
                          })}
                          className="px-2 py-1 rounded-lg bg-[#0071E3]/10 text-[#0071E3] text-[10.5px] font-extrabold"
                        >
                          + {tpl.labelAr.split('(')[0].trim()}
                        </button>
                      ))}
                    </div>
                  </div>
                  {(selectedPage.sections || []).map((ps, sIdx) => (
                    <div key={ps.id} className="p-3 rounded-xl bg-surface2 border border-line space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-fg">قسم #{sIdx + 1}: {ps.type}</span>
                        <button
                          type="button"
                          onClick={() => updatePage(selectedPage.id, { sections: selectedPage.sections.filter((x) => x.id !== ps.id) })}
                          className="text-rose-500 text-[11px] font-extrabold"
                        >
                          حذف
                        </button>
                      </div>
                      {ps.content?.title !== undefined && (
                        <input
                          value={ps.content.title}
                          onChange={(e) => updatePage(selectedPage.id, {
                            sections: selectedPage.sections.map((x) => (x.id === ps.id ? { ...x, content: { ...x.content, title: e.target.value } } : x))
                          })}
                          placeholder="عنوان القسم"
                          className={inp}
                        />
                      )}
                      {ps.content?.subtitle !== undefined && (
                        <textarea
                          rows={2}
                          value={ps.content.subtitle}
                          onChange={(e) => updatePage(selectedPage.id, {
                            sections: selectedPage.sections.map((x) => (x.id === ps.id ? { ...x, content: { ...x.content, subtitle: e.target.value } } : x))
                          })}
                          placeholder="وصف القسم"
                          className={inp}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted">اختر صفحة من القائمة أو أنشئ صفحة جديدة.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DISCOVERED CONTROLS & COMPLETE SITE COPY */}
      {activeTab === 'controls' && (
        <div className="space-y-4">
          <div className="elz-admin-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
              <div>
                <h3 className="text-sm font-black text-fg">أدوات التحكم المكتشفة تلقائياً (Intelligent Control Discovery)</h3>
                <p className="text-[11px] text-muted">عناصر كانت ثابتة داخل الكود وتم تحويلها إلى إعدادات إدارية متصلة بالموقع الفعلي</p>
              </div>
              <button
                type="button"
                onClick={() => commitAll('settings', 'حفظ إعدادات التحكم المكتشفة والـ SEO والسياسات', { discoveredControls: controls })}
                className="px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-black inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> حفظ جميع الإعدادات
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
              {/* SEO Settings */}
              <div className="p-4 rounded-2xl bg-surface2/60 border border-line space-y-2.5">
                <div className="font-black text-fg flex items-center gap-1.5"><Globe className="w-4 h-4 text-[#0071E3]" /> إعدادات SEO العامة</div>
                <input value={controls.seo.siteTitle} onChange={(e) => setControls((p) => ({ ...p, seo: { ...p.seo, siteTitle: e.target.value } }))} placeholder="عنوان الموقع (Title Tag)" className={inp} />
                <textarea rows={2} value={controls.seo.metaDescription} onChange={(e) => setControls((p) => ({ ...p, seo: { ...p.seo, metaDescription: e.target.value } }))} placeholder="الوصف لمحركات البحث" className={inp} />
                <input value={controls.seo.canonicalUrl} onChange={(e) => setControls((p) => ({ ...p, seo: { ...p.seo, canonicalUrl: e.target.value } }))} dir="ltr" placeholder="Canonical URL" className={inp} />
              </div>

              {/* Product Display Controls */}
              <div className="p-4 rounded-2xl bg-surface2/60 border border-line space-y-2.5">
                <div className="font-black text-fg flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-emerald-500" /> إعدادات عرض بطاقات المنتجات</div>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    ['showSkuOnCard', 'إظهار كود المنتج (SKU)'],
                    ['showStockBadge', 'إظهار شارة التوفر بالمخزن'],
                    ['showQuickAddBtn', 'إظهار زر الإضافة السريعة'],
                    ['showCompareBtn', 'إظهار زر المقارنة السريعة']
                  ].map(([k, lbl]) => (
                    <label key={k} className="flex items-center gap-2 font-bold cursor-pointer p-2 rounded-xl bg-surface border border-line">
                      <input type="checkbox" checked={!!controls.productDisplay[k]} onChange={(e) => setControls((p) => ({ ...p, productDisplay: { ...p.productDisplay, [k]: e.target.checked } }))} />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Empty States */}
              <div className="p-4 rounded-2xl bg-surface2/60 border border-line space-y-2.5">
                <div className="font-black text-fg flex items-center gap-1.5"><Search className="w-4 h-4 text-amber-500" /> نصوص حالات الفراغ (Empty States)</div>
                <input value={controls.emptyStates.searchNoResultsTitle} onChange={(e) => setControls((p) => ({ ...p, emptyStates: { ...p.emptyStates, searchNoResultsTitle: e.target.value } }))} placeholder="عنوان عدم وجود نتائج بحث" className={inp} />
                <input value={controls.emptyStates.searchNoResultsSubtitle} onChange={(e) => setControls((p) => ({ ...p, emptyStates: { ...p.emptyStates, searchNoResultsSubtitle: e.target.value } }))} placeholder="وصف عدم وجود نتائج بحث" className={inp} />
                <input value={controls.emptyStates.cartEmptyTitle} onChange={(e) => setControls((p) => ({ ...p, emptyStates: { ...p.emptyStates, cartEmptyTitle: e.target.value } }))} placeholder="نص السلة الفارغة" className={inp} />
              </div>

              {/* Error Messages */}
              <div className="p-4 rounded-2xl bg-surface2/60 border border-line space-y-2.5">
                <div className="font-black text-fg flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-rose-500" /> رسائل الخطأ والتنبيهات (Error Messages)</div>
                <input value={controls.errorMessages.networkError} onChange={(e) => setControls((p) => ({ ...p, errorMessages: { ...p.errorMessages, networkError: e.target.value } }))} placeholder="رسالة خطأ الاتصال" className={inp} />
                <input value={controls.errorMessages.loginRequired} onChange={(e) => setControls((p) => ({ ...p, errorMessages: { ...p.errorMessages, loginRequired: e.target.value } }))} placeholder="رسالة طلب تسجيل الدخول" className={inp} />
                <input value={controls.errorMessages.outOfStock} onChange={(e) => setControls((p) => ({ ...p, errorMessages: { ...p.errorMessages, outOfStock: e.target.value } }))} placeholder="رسالة نفاد المخزون" className={inp} />
              </div>

              {/* Legal Pages */}
              <div className="lg:col-span-2 p-4 rounded-2xl bg-surface2/60 border border-line space-y-2.5">
                <div className="font-black text-fg">الصفحات القانونية والسياسات (Legal Pages)</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-extrabold text-muted">سياسة الخصوصية</label>
                    <textarea rows={3} value={controls.legalPages.privacyPolicy} onChange={(e) => setControls((p) => ({ ...p, legalPages: { ...p.legalPages, privacyPolicy: e.target.value } }))} className={inp} />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-muted">سياسة الاستبدال والاسترجاع</label>
                    <textarea rows={3} value={controls.legalPages.returnPolicy} onChange={(e) => setControls((p) => ({ ...p, legalPages: { ...p.legalPages, returnPolicy: e.target.value } }))} className={inp} />
                  </div>
                  <div className="space-y-1">
                    <label className="font-extrabold text-muted">شروط الاستخدام</label>
                    <textarea rows={3} value={controls.legalPages.termsOfUse} onChange={(e) => setControls((p) => ({ ...p, legalPages: { ...p.legalPages, termsOfUse: e.target.value } }))} className={inp} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
