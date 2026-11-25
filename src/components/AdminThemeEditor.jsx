import React, { useEffect, useState } from 'react';
import { Palette, Sun, Moon, Type, Layers, RotateCcw, Rocket, Save, CheckCircle2 } from 'lucide-react';
import {
  DEFAULT_THEME_TOKENS,
  ARABIC_FONT_PRESETS,
  ENGLISH_FONT_PRESETS,
  normalizeThemeTokens,
  applyThemeTokensToDocument,
  createVersionSnapshot
} from '../lib/adminControlCenter.js';

const COLOR_FIELDS = [
  ['primary', 'اللون الأساسي (Primary)'],
  ['secondary', 'اللون الثانوي (Secondary)'],
  ['accent', 'اللون المميز (Accent)'],
  ['bg', 'خلفية الصفحة (Background)'],
  ['surface', 'سطح الكروت (Surface)'],
  ['surface2', 'السطح الثانوي (Surface 2)'],
  ['text', 'لون النصوص (Text)'],
  ['muted', 'النصوص الثانوية (Muted)'],
  ['border', 'لون الحدود (Borders)'],
  ['buttonBg', 'خلفية الأزرار (Buttons)'],
  ['buttonText', 'نص الأزرار (Button Text)'],
  ['link', 'لون الروابط (Links)'],
  ['cardBg', 'خلفية البطاقات (Cards)'],
  ['footerBg', 'خلفية الفوتر (Footer)'],
  ['alertBg', 'خلفية التنبيهات (Alerts)'],
  ['badgeBg', 'لون الشارات والخصم (Badges)']
];

export default function AdminThemeEditor({
  siteSettings,
  setSiteSettings,
  saveSiteSettingsImmediate,
  adminSession,
  showToast
}) {
  const [tokens, setTokens] = useState(() => normalizeThemeTokens(siteSettings?.themeTokens));
  const [editMode, setEditMode] = useState('light'); // 'light' | 'dark'
  const [subSection, setSubSection] = useState('colors'); // 'colors' | 'typography' | 'components'
  const [liveApply, setLiveApply] = useState(true);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (liveApply) {
      applyThemeTokensToDocument(tokens, editMode);
    }
  }, [tokens, editMode, liveApply]);

  const updateColor = (key, val) => {
    setTokens((prev) => ({
      ...prev,
      [editMode]: { ...prev[editMode], [key]: val }
    }));
    setDirty(true);
  };

  const updateTypo = (key, val) => {
    setTokens((prev) => ({
      ...prev,
      typography: { ...prev.typography, [key]: val }
    }));
    setDirty(true);
  };

  const updateComp = (key, val) => {
    setTokens((prev) => ({
      ...prev,
      components: { ...prev.components, [key]: val }
    }));
    setDirty(true);
  };

  const handlePublish = (asDraft = false) => {
    const prevTokens = normalizeThemeTokens(siteSettings?.themeTokens);
    const ver = createVersionSnapshot({
      scope: 'theme',
      label: asDraft ? 'حفظ مسودة الهوية البصرية والألوان' : 'نشر تعديلات محرر الهوية البصرية (Theme)',
      actorName: adminSession?.displayName || adminSession?.username || 'المالك',
      actorRole: adminSession?.roleLabel || 'super_admin',
      previousValue: prevTokens,
      newValue: tokens,
      isMajorBackup: !asDraft
    });
    const prevHistory = Array.isArray(siteSettings?.adminVersionHistory) ? siteSettings.adminVersionHistory : [];
    const patch = asDraft
      ? { themeTokensDraft: tokens, adminVersionHistory: [ver, ...prevHistory].slice(0, 60) }
      : { themeTokens: tokens, themeTokensDraft: null, adminVersionHistory: [ver, ...prevHistory].slice(0, 60) };

    setSiteSettings((prev) => ({ ...prev, ...patch }));
    if (saveSiteSettingsImmediate) saveSiteSettingsImmediate(patch);
    if (!asDraft) applyThemeTokensToDocument(tokens, editMode);
    setDirty(false);
    showToast && showToast(asDraft ? 'تم حفظ مسودة الثيم بنجاح' : 'تم نشر الهوية البصرية الجديدة على كامل الموقع ✓', 'success');
  };

  const handleReset = () => {
    if (!window.confirm('هل تريد استعادة ألوان وخطوط Elzoghbi Market الافتراضية؟')) return;
    setTokens(normalizeThemeTokens(DEFAULT_THEME_TOKENS));
    setDirty(true);
    showToast && showToast('تمت استعادة الإعدادات الافتراضية — اضغط «نشر» لاعتمادها', 'info');
  };

  const pal = tokens[editMode];

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="elz-admin-card !p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center">
            <Palette className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-black text-fg">محرر الهوية البصرية المباشر (Live Theme Editor)</h2>
            <p className="text-xs text-muted">تحكم مستقل في ألوان الوضع النهاري والليلي، الخطوط العربية والإنجليزية، وتصميم المكونات عبر Design Tokens</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs font-bold text-fg px-3 py-1.5 rounded-xl bg-surface2 border border-line cursor-pointer">
            <input type="checkbox" checked={liveApply} onChange={(e) => setLiveApply(e.target.checked)} />
            معاينة فورية حية
          </label>
          <button type="button" onClick={handleReset} className="px-3 py-2 rounded-xl bg-surface2 border border-line text-xs font-extrabold text-fg inline-flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" /> افتراضي
          </button>
          <button type="button" onClick={() => handlePublish(true)} className="px-3 py-2 rounded-xl bg-surface2 border border-line text-xs font-extrabold text-fg inline-flex items-center gap-1">
            <Save className="w-3.5 h-3.5 text-[#0071E3]" /> مسودة
          </button>
          <button type="button" onClick={() => handlePublish(false)} className="px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-black inline-flex items-center gap-1.5">
            <Rocket className="w-3.5 h-3.5" /> نشر الهوية البصرية {dirty ? '•' : ''}
          </button>
        </div>
      </div>

      {/* Sub-navigation + Light/Dark Switch */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {[
            ['colors', Palette, 'الألوان (Light & Dark)'],
            ['typography', Type, 'الخطوط والأحجام (Typography)'],
            ['components', Layers, 'المكونات والكروت (Components)']
          ].map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSubSection(id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold border inline-flex items-center gap-1.5 transition ${
                subSection === id ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-surface border-line text-fg hover:border-[#0071E3]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-surface border border-line rounded-xl p-1 gap-1">
          <button
            type="button"
            onClick={() => setEditMode('light')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold inline-flex items-center gap-1.5 ${
              editMode === 'light' ? 'bg-amber-400 text-slate-950' : 'text-muted hover:text-fg'
            }`}
          >
            <Sun className="w-3.5 h-3.5" /> الوضع النهاري (Light)
          </button>
          <button
            type="button"
            onClick={() => setEditMode('dark')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold inline-flex items-center gap-1.5 ${
              editMode === 'dark' ? 'bg-slate-800 text-white' : 'text-muted hover:text-fg'
            }`}
          >
            <Moon className="w-3.5 h-3.5" /> الوضع الليلي (Dark)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Controls Column (7 cols) */}
        <div className="xl:col-span-7 elz-admin-card space-y-4">
          {subSection === 'colors' && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-fg">
                  ألوان {editMode === 'light' ? 'الوضع النهاري (Light Mode)' : 'الوضع الليلي (Dark Mode)'}
                </h3>
                <span className="text-[11px] font-bold text-muted">كل وضع مستقل تماماً ولا يؤثر على الآخر</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COLOR_FIELDS.map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface2/70 border border-line">
                    <div className="min-w-0">
                      <div className="text-xs font-extrabold text-fg truncate">{label}</div>
                      <div className="text-[10.5px] font-mono text-muted" dir="ltr">{pal[key]}</div>
                    </div>
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(pal[key] || '') ? pal[key] : '#0071E3'}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="w-10 h-9 rounded-lg border border-line cursor-pointer shrink-0 bg-transparent"
                    />
                  </div>
                ))}
                <div className="sm:col-span-2 p-2.5 rounded-xl bg-surface2/70 border border-line space-y-1">
                  <label className="text-xs font-extrabold text-fg block">لون/شفافية الهيدر (Header Glass / Background)</label>
                  <input
                    value={pal.headerBg || ''}
                    onChange={(e) => updateColor('headerBg', e.target.value)}
                    dir="ltr"
                    className="w-full px-3 py-1.5 rounded-lg border border-line bg-surface text-xs font-mono text-fg"
                    placeholder="rgba(255, 255, 255, 0.82)"
                  />
                </div>
              </div>
            </>
          )}

          {subSection === 'typography' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-muted block">الخط العربي (Arabic Font)</label>
                  <select value={tokens.typography.fontAr} onChange={(e) => updateTypo('fontAr', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-line bg-bg font-bold">
                    {ARABIC_FONT_PRESETS.map((f) => <option key={f.id} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold text-muted block">الخط الإنجليزي (English Font)</label>
                  <select value={tokens.typography.fontEn} onChange={(e) => updateTypo('fontEn', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-line bg-bg font-bold">
                    {ENGLISH_FONT_PRESETS.map((f) => <option key={f.id} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-muted block">حجم النص (Desktop): {tokens.typography.bodySize}px</label>
                  <input type="range" min={13} max={18} step={1} value={tokens.typography.bodySize} onChange={(e) => updateTypo('bodySize', Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold text-muted block">حجم النص (Mobile): {tokens.typography.mobileBodySize}px</label>
                  <input type="range" min={12} max={17} step={1} value={tokens.typography.mobileBodySize} onChange={(e) => updateTypo('mobileBodySize', Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold text-muted block">ارتفاع السطر: {tokens.typography.lineHeight}</label>
                  <input type="range" min={1.2} max={1.9} step={0.05} value={tokens.typography.lineHeight} onChange={(e) => updateTypo('lineHeight', Number(e.target.value))} className="w-full" />
                </div>
              </div>
            </div>
          )}

          {subSection === 'components' && (
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-muted block">انحناء الكروت: {tokens.components.cardRadius}px</label>
                  <input type="range" min={8} max={32} value={tokens.components.cardRadius} onChange={(e) => updateComp('cardRadius', Number(e.target.value))} className="w-full" />
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold text-muted block">انحناء الأزرار: {tokens.components.buttonRadius >= 100 ? 'كبسولة (Pill)' : `${tokens.components.buttonRadius}px`}</label>
                  <select value={tokens.components.buttonRadius} onChange={(e) => updateComp('buttonRadius', Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-line bg-bg font-bold">
                    <option value={980}>كبسولة كاملة (Apple Pill)</option>
                    <option value={14}>مستدير حديث (14px)</option>
                    <option value={8}>كلاسيكي (8px)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold text-muted block">ظلال الكروت (Shadows)</label>
                  <select value={tokens.components.cardShadow} onChange={(e) => updateComp('cardShadow', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-line bg-bg font-bold">
                    <option value="none">مسطح بدون ظل</option>
                    <option value="subtle">ظل ناعم (افتراضي)</option>
                    <option value="elevated">ظل بارز (Elevated)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-extrabold text-muted block">كثافة كروت المنتجات</label>
                  <select value={tokens.components.productCardDensity} onChange={(e) => updateComp('productCardDensity', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-line bg-bg font-bold">
                    <option value="compact">مضغوط (Compact)</option>
                    <option value="comfortable">مريح (Comfortable)</option>
                    <option value="spacious">واسع (Spacious)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-extrabold text-muted block">نمط شريط التنقل (Header Style)</label>
                  <select value={tokens.components.navStyle} onChange={(e) => updateComp('navStyle', e.target.value)} className="w-full px-3 py-2 rounded-xl border border-line bg-bg font-bold">
                    <option value="glass">زجاجي شفاف (Glass)</option>
                    <option value="solid">لون صلب (Solid)</option>
                    <option value="bordered">محدد بحافة واضحة</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Preview Sandbox (5 cols) */}
        <div className="xl:col-span-5 elz-admin-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-fg">معاينة حية ({editMode === 'light' ? 'الوضع النهاري' : 'الوضع الليلي'})</h3>
            <span className="text-[11px] font-bold text-emerald-500 inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> متزامن</span>
          </div>

          <div
            className="rounded-2xl border overflow-hidden transition-all"
            style={{
              backgroundColor: pal.bg,
              color: pal.text,
              borderColor: pal.border,
              fontFamily: tokens.typography.fontAr,
              lineHeight: tokens.typography.lineHeight
            }}
          >
            {/* Preview Header */}
            <div className="px-4 py-3 border-b flex items-center justify-between" style={{ background: pal.headerBg, borderColor: pal.border }}>
              <span className="font-black text-sm">ELZOGHBI MARKET</span>
              <span className="px-2.5 py-0.5 text-[10px] font-black text-white rounded-full" style={{ backgroundColor: pal.badgeBg }}>عرض حصري</span>
            </div>

            {/* Preview Body */}
            <div className="p-4 space-y-3">
              <div
                className="p-4 border"
                style={{
                  backgroundColor: pal.cardBg,
                  borderColor: pal.border,
                  borderRadius: `${tokens.components.cardRadius}px`
                }}
              >
                <div className="text-xs font-bold" style={{ color: pal.accent }}>شاشة أصلية معتمدة</div>
                <div className="text-base font-black mt-0.5">iPhone 15 Pro Max OLED Display</div>
                <p className="text-xs mt-1" style={{ color: pal.muted }}>ضمان فحص واستبدال فوري مع شحن سريع لجميع المحافظات.</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-black text-base" style={{ color: pal.primary }}>4,850 ج.م</span>
                  <button
                    type="button"
                    className="px-4 py-1.5 text-xs font-bold"
                    style={{
                      backgroundColor: pal.buttonBg,
                      color: pal.buttonText,
                      borderRadius: `${tokens.components.buttonRadius}px`
                    }}
                  >
                    أضف للسلة
                  </button>
                </div>
              </div>

              <div className="rounded-xl p-3 text-xs font-bold" style={{ backgroundColor: pal.alertBg, color: pal.text }}>
                تنبيه: شحن مجاني للطلبات فوق 1,500 ج.م · <span style={{ color: pal.link, textDecoration: 'underline' }}>التفاصيل</span>
              </div>
            </div>

            {/* Preview Footer */}
            <div className="px-4 py-2.5 text-[11px] border-t text-center" style={{ backgroundColor: pal.footerBg, borderColor: pal.border, color: pal.muted }}>
              © ELZOGHBI MARKET — جميع الحقوق محفوظة
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
