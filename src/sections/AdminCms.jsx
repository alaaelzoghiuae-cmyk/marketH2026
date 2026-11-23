import { Save, Megaphone, Minus, Plus, Eye, CreditCard, Trash2, FileText, Database, Upload, Zap, Bell, Download, X } from 'lucide-react';
import { getAdTheme, getPaymentMethods, getSourcingBanner } from '../lib/utils.jsx';
import { AD_IMAGE_FRAME_OPTIONS, AD_THEMES, DEFAULT_HOME_SHORTCUT_ICONS, DEFAULT_REGISTRATION_TERMS, SHORTCUT_ICON_PRESETS } from '../data/constants.jsx';
import { AdContent } from '../components/widgets.jsx';
import { normalizePartCategory } from '../lib/catalogUtils.js';

export function renderAdminSiteSettings(ctx) {
  const { adminSettingsSubTab, announceBoxOpen, askConfirmDelete, getMobilePushConfig, handleMigrateAllBase64ImagesToStorage, handleOptimizeAllSiteImagesToWebP, migratingImages, migrationProgress, models, parts, paymentBoxOpen, pushToSupabaseCloud, renderAdminSubTabBar, runSiteImagesAudit, saveSiteSettingsImmediate, sendMobileOrderPushAlert, setAdminSettingsSubTab, setAnnounceBoxOpen, setPaymentBoxOpen, setSiteSettings, setTermsBoxOpen, setVisibilityBoxOpen, showToast, siteImageAuditStats, siteSettings, termsBoxOpen, updatePaymentMethods, visibilityBoxOpen } = ctx;
  return (<div className="space-y-4">
      {renderAdminSubTabBar(
        [
          { id: 'identity', icon: '🏪', label: 'هوية المتجر والشريط المتحرك' },
          { id: 'payments_auth', icon: '💳', label: 'طرق الدفع والتسجيل' },
          { id: 'policies', icon: '📜', label: 'الشروط وسياسات الشحن والاسترجاع' },
          { id: 'mobile_push', icon: '📲', label: 'إشعارات الموبايل الفورية (والموقع مغلق)' },
          { id: 'cloud', icon: '☁️', label: 'ضغط الصور وتقليل استهلاك Egress' }
        ],
        adminSettingsSubTab,
        setAdminSettingsSubTab
      )}

      <div className="bg-surface rounded-2xl p-5 sm:p-6 border border-line shadow-xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <h2 className="text-base font-extrabold text-fg">
              إعدادات هوية ELZOGHBI، روابط السوشيال ميديا، والشروط والأحكام
            </h2>
            <p className="text-xs text-muted mt-0.5">
              عدّل روابط واتساب وفيسبوك وإنستجرام وشروط العمل وسياسة الاسترجاع والدليفري التي تظهر في أسفل الموقع
            </p>
          </div>
          <button
            type="button"
            onClick={() => pushToSupabaseCloud(null, true)}
            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            <span>حفظ وتأكيد الإعدادات في السيرفر ✓</span>
          </button>
        </div>

        {adminSettingsSubTab === 'identity' && (<>
        {/* Text Announcements Control */}
        <div className="rounded-2xl border border-line bg-surface2 p-4 space-y-3 text-xs">
          <button
            type="button"
            onClick={() => setAnnounceBoxOpen(o => !o)}
            className="w-full flex items-center justify-between gap-2 font-extrabold text-fg"
          >
            <span className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-600" />
              الإعلانات النصية (شريط متحرك + بنر ثابت)
              {(siteSettings.tickerEnabled || siteSettings.bannerEnabled) && (
                <span className="text-[11px] font-bold text-accent-text">(شغّالة)</span>
              )}
            </span>
            <span className="w-7 h-7 rounded-lg bg-nav2 text-white flex items-center justify-center">
              {announceBoxOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </span>
          </button>
          {announceBoxOpen && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-surface border border-line space-y-2.5">
                <label className="flex items-center gap-2 font-extrabold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!siteSettings.tickerEnabled}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, tickerEnabled: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  الشريط المتحرك (بيجري فوق الموقع)
                </label>
                <textarea
                  rows={3}
                  value={siteSettings.tickerText || ''}
                  onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, tickerText: e.target.value }))}
                  placeholder="اكتب الإعلان هنا. كل سطر هيظهر كرسالة منفصلة في الشريط."
                  className="w-full p-2.5 rounded-xl border border-line"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={siteSettings.tickerSpeed || 25}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, tickerSpeed: Number(e.target.value) }))}
                    className="p-2 rounded-lg border border-line font-bold bg-surface text-fg"
                  >
                    <option value={40}>السرعة: بطيء</option>
                    <option value={25}>السرعة: متوسط</option>
                    <option value={14}>السرعة: سريع</option>
                  </select>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={['blue', 'green', 'amber', 'red', 'dark', 'purple', 'teal'].includes(siteSettings.tickerColor) ? siteSettings.tickerColor : 'custom'}
                      onChange={e => {
                        const val = e.target.value;
                        if (val !== 'custom') {
                          saveSiteSettingsImmediate(prev => ({ ...prev, tickerColor: val, tickerBgColor: '' }));
                        }
                      }}
                      className="flex-1 p-2 rounded-lg border border-line font-bold bg-surface text-fg"
                    >
                      <option value="blue">اللون: أزرق</option>
                      <option value="green">اللون: أخضر</option>
                      <option value="amber">اللون: ذهبي</option>
                      <option value="red">اللون: أحمر</option>
                      <option value="purple">اللون: بنفسجي</option>
                      <option value="teal">اللون: تركواز</option>
                      <option value="dark">اللون: داكن</option>
                      <option value="custom">لون مخصص</option>
                    </select>
                    <input
                      type="color"
                      title="اختر أي لون مخصص للشريط"
                      value={
                        (siteSettings.tickerColor && siteSettings.tickerColor.startsWith('#'))
                          ? siteSettings.tickerColor
                          : ({ blue: '#2563eb', green: '#16a34a', amber: '#d97706', red: '#be123c', dark: '#111827', purple: '#7c3aed', teal: '#0d9488' }[siteSettings.tickerColor] || '#2563eb')
                      }
                      onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, tickerColor: e.target.value, tickerBgColor: e.target.value }))}
                      className="w-10 h-9 p-0.5 rounded-lg border border-line cursor-pointer bg-surface shrink-0"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface border border-line space-y-2">
                <label className="flex items-center gap-2 font-extrabold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!siteSettings.bannerEnabled}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, bannerEnabled: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  البنر الثابت (العميل يقدر يقفله)
                </label>
                <textarea
                  rows={2}
                  value={siteSettings.bannerText || ''}
                  onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, bannerText: e.target.value }))}
                  placeholder="اكتب نص البنر الثابت هنا..."
                  className="w-full p-2.5 rounded-xl border border-line"
                />
                <select
                  value={siteSettings.bannerColor || 'amber'}
                  onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, bannerColor: e.target.value }))}
                  className="p-2 rounded-lg border border-line font-bold"
                >
                  <option value="amber">اللون: ذهبي</option>
                  <option value="blue">اللون: أزرق</option>
                  <option value="green">اللون: أخضر</option>
                  <option value="red">اللون: أحمر</option>
                  <option value="dark">اللون: داكن</option>
                </select>
              </div>
              <p className="text-muted">بعد التعديل دوس على "حفظ" عشان يظهر للعملاء.</p>
            </div>
          )}
        </div>

        {/* Storefront Sections Visibility */}
        <div className="rounded-2xl border border-line bg-surface2 p-4 space-y-3 text-xs">
          <button
            type="button"
            onClick={() => setVisibilityBoxOpen(o => !o)}
            className="w-full flex items-center justify-between gap-2 font-extrabold text-fg"
          >
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-600" />
              الأقسام اللي بتظهر في صفحة العميل
            </span>
            <span className="w-7 h-7 rounded-lg bg-nav2 text-white flex items-center justify-center">
              {visibilityBoxOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </span>
          </button>
          {visibilityBoxOpen && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={siteSettings.showHomeAds !== false}
                  onChange={e => setSiteSettings(prev => ({ ...prev, showHomeAds: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-600"
                />
                إظهار الإعلانات (البانر) في الصفحة الرئيسية
              </label>
              <label className="flex items-center gap-2 font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={siteSettings.showHomeModels !== false}
                  onChange={e => setSiteSettings(prev => ({ ...prev, showHomeModels: e.target.checked }))}
                  className="w-4 h-4 accent-emerald-600"
                />
                إظهار الأقسام والموديلات (في الرئيسية وفي فلتر البحث)
              </label>
              <p className="text-muted">بعد التعديل دوس على "حفظ" عشان يتسجّل.</p>
            </div>
          )}
        </div>

        </>) }
        {adminSettingsSubTab === 'payments_auth' && (<>
        {/* Payment Methods Control */}
        <div className="rounded-2xl border border-line bg-surface2 p-4 space-y-3 text-xs">
          <button
            type="button"
            onClick={() => setPaymentBoxOpen(o => !o)}
            className="w-full flex items-center justify-between gap-2 font-extrabold text-fg"
          >
            <span className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              طرق الدفع اللي بتظهر للعميل
              <span className="text-[11px] font-bold text-accent-text">
                ({getPaymentMethods(siteSettings).filter(m => m.enabled).length} شغّالة)
              </span>
            </span>
            <span className="w-7 h-7 rounded-lg bg-nav2 text-white flex items-center justify-center">
              {paymentBoxOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </span>
          </button>
          {paymentBoxOpen && (
            <div className="space-y-3">
              <div className="flex justify-end">
            <button
              type="button"
              onClick={() =>
                updatePaymentMethods(list => [
                  ...list,
                  {
                    id: `custom_${Date.now()}`,
                    label: 'طريقة دفع جديدة',
                    desc: 'اكتب هنا تفاصيل الدفع (رقم المحفظة، اسم الحساب...)',
                    enabled: true,
                    type: 'custom'
                  }
                ])
              }
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold"
            >
              + ضيف طريقة دفع
            </button>
              </div>
          <p className="text-muted">
            شغّل أو اقفل أي طريقة، وعدّل اسمها ووصفها. الطرق المقفولة مش هتظهر للعميل في صفحة الدفع. بعد التعديل دوس على زرار "حفظ" عشان يتسجّل.
          </p>
          {getPaymentMethods(siteSettings).filter(m => m.enabled).length === 0 && (
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 font-bold">
              تنبيه: كل طرق الدفع مقفولة، العميل مش هيعرف يكمّل الطلب. شغّل طريقة واحدة على الأقل.
            </div>
          )}
          <div className="space-y-2.5">
            {getPaymentMethods(siteSettings).map(pm => (
              <div
                key={pm.id}
                className={`p-3 rounded-xl border bg-surface grid grid-cols-1 md:grid-cols-12 gap-2 items-center ${
                  pm.enabled ? 'border-emerald-300' : 'border-line opacity-70'
                }`}
              >
                <label className="md:col-span-2 flex items-center gap-2 font-extrabold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!pm.enabled}
                    onChange={e =>
                      updatePaymentMethods(list =>
                        list.map(x => (x.id === pm.id ? { ...x, enabled: e.target.checked } : x))
                      )
                    }
                    className="w-4 h-4 accent-emerald-600"
                  />
                  {pm.enabled ? 'شغّالة' : 'مقفولة'}
                </label>
                <input
                  type="text"
                  value={pm.label || ''}
                  onChange={e =>
                    updatePaymentMethods(list =>
                      list.map(x => (x.id === pm.id ? { ...x, label: e.target.value } : x))
                    )
                  }
                  placeholder="اسم الطريقة"
                  className="md:col-span-3 p-2 rounded-lg border border-line font-bold"
                />
                <input
                  type="text"
                  value={pm.desc || ''}
                  onChange={e =>
                    updatePaymentMethods(list =>
                      list.map(x => (x.id === pm.id ? { ...x, desc: e.target.value } : x))
                    )
                  }
                  placeholder="الوصف اللي هيظهر للعميل"
                  className="md:col-span-6 p-2 rounded-lg border border-line"
                />
                {pm.type === 'custom' ? (
                  <button
                    type="button"
                    onClick={() =>
                      askConfirmDelete(
                        'حذف طريقة دفع',
                        `هل أنت متأكد من حذف طريقة الدفع "${pm.label || pm.id}"؟ هتختفي من خيارات الدفع للعملاء فوراً.`,
                        () => updatePaymentMethods(list => list.filter(x => x.id !== pm.id)),
                        'نعم، احذف الطريقة'
                      )
                    }
                    className="md:col-span-1 p-2 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 flex items-center justify-center"
                    title="امسح الطريقة دي"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="md:col-span-1" />
                )}
              </div>
            ))}
          </div>
            </div>
          )}
        </div>

        {/* Registration Terms Control */}
        <div className="rounded-2xl border border-line bg-surface2 p-4 space-y-3 text-xs">
          <button
            type="button"
            onClick={() => setTermsBoxOpen(o => !o)}
            className="w-full flex items-center justify-between gap-2 font-extrabold text-fg"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              الشروط والأحكام اللي العميل لازم يوافق عليها وقت التسجيل
            </span>
            <span className="w-7 h-7 rounded-lg bg-nav2 text-white flex items-center justify-center">
              {termsBoxOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </span>
          </button>
          {termsBoxOpen && (
            <div className="space-y-2.5">
              <p className="text-muted">
                عدّل النص زي ما تحب. العميل مش هيعرف يعمل حساب غير لما يعلّم على "موافق". النص ده صيغة عامة ومش بديل لمراجعة محامي.
              </p>
              <input
                type="text"
                value={siteSettings.registrationTermsTitle || ''}
                onChange={e => setSiteSettings(prev => ({ ...prev, registrationTermsTitle: e.target.value }))}
                placeholder="عنوان الشروط"
                className="w-full p-2.5 rounded-xl border border-line font-extrabold"
              />
              <textarea
                rows={16}
                value={siteSettings.registrationTermsText || ''}
                onChange={e => setSiteSettings(prev => ({ ...prev, registrationTermsText: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line leading-relaxed"
              />
              <button
                type="button"
                onClick={() =>
                  setSiteSettings(prev => ({
                    ...prev,
                    registrationTermsTitle: 'الشروط والأحكام',
                    registrationTermsText: DEFAULT_REGISTRATION_TERMS
                  }))
                }
                className="px-3 py-1.5 rounded-xl bg-surface2 hover:bg-surface2 font-bold text-fg"
              >
                رجّع النص الأصلي
              </button>
            </div>
          )}
        </div>

        </>) }
        {adminSettingsSubTab === 'identity' && (<>
        {/* Store Name & Social Media Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-bold text-muted block mb-1">اسم المتجر الرسمي:</label>
            <input
              type="text"
              value={siteSettings.storeName}
              onChange={e => setSiteSettings(prev => ({ ...prev, storeName: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-line font-extrabold"
            />
          </div>

          <div>
            <label className="font-bold text-muted block mb-1">الوصف المختصر تحت الشعار:</label>
            <input
              type="text"
              value={siteSettings.storeTagline}
              onChange={e => setSiteSettings(prev => ({ ...prev, storeTagline: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-line"
            />
          </div>

          <div>
            <label className="font-bold text-accent-text block mb-1">رابط واتساب الرسمي (WhatsApp URL):</label>
            <input
              type="text"
              dir="ltr"
              value={siteSettings.whatsappUrl}
              onChange={e => setSiteSettings(prev => ({ ...prev, whatsappUrl: e.target.value }))}
              placeholder="https://wa.me/201012345678"
              className="w-full p-2.5 rounded-xl border border-line bg-bg text-fg font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-muted block mb-1">رقم الواتساب / خدمة العملاء للعرض:</label>
            <input
              type="text"
              value={siteSettings.whatsappNumber}
              onChange={e => setSiteSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))}
              placeholder="01012345678"
              className="w-full p-2.5 rounded-xl border border-line font-mono font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-accent-text block mb-1">رابط صفحة فيسبوك (Facebook URL):</label>
            <input
              type="text"
              dir="ltr"
              value={siteSettings.facebookUrl}
              onChange={e => setSiteSettings(prev => ({ ...prev, facebookUrl: e.target.value }))}
              placeholder="https://facebook.com/..."
              className="w-full p-2.5 rounded-xl border border-line bg-bg text-fg font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-pink-700 block mb-1">رابط حساب إنستجرام (Instagram URL):</label>
            <input
              type="text"
              dir="ltr"
              value={siteSettings.instagramUrl}
              onChange={e => setSiteSettings(prev => ({ ...prev, instagramUrl: e.target.value }))}
              placeholder="https://instagram.com/..."
              className="w-full p-2.5 rounded-xl border border-pink-300 bg-pink-50/30 font-mono"
            />
          </div>
        </div>

        </>) }
        {adminSettingsSubTab === 'policies' && (<>
        {/* Business Rules, Terms, Return Policy & Delivery Policy */}
        <div className="pt-4 border-t border-line space-y-4 text-xs">
          <h3 className="text-sm font-extrabold text-fg">
            قواعد العمل والشروط والأحكام وسياسة المرتجعات والدليفري (تظهر في الفوتر بأسفل الموقع):
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 bg-surface2 p-4 rounded-xl border border-line">
              <input
                type="text"
                value={siteSettings.termsTitle}
                onChange={e => setSiteSettings(prev => ({ ...prev, termsTitle: e.target.value }))}
                className="w-full p-2 rounded-lg border border-line bg-surface font-extrabold"
              />
              <textarea
                rows={4}
                value={siteSettings.termsText}
                onChange={e => setSiteSettings(prev => ({ ...prev, termsText: e.target.value }))}
                className="w-full p-2 rounded-lg border border-line bg-surface leading-relaxed"
              />
            </div>

            <div className="space-y-2 bg-surface2 p-4 rounded-xl border border-line">
              <input
                type="text"
                value={siteSettings.returnPolicyTitle}
                onChange={e => setSiteSettings(prev => ({ ...prev, returnPolicyTitle: e.target.value }))}
                className="w-full p-2 rounded-lg border border-line bg-surface font-extrabold"
              />
              <textarea
                rows={4}
                value={siteSettings.returnPolicyText}
                onChange={e => setSiteSettings(prev => ({ ...prev, returnPolicyText: e.target.value }))}
                className="w-full p-2 rounded-lg border border-line bg-surface leading-relaxed"
              />
            </div>

            <div className="space-y-2 bg-surface2 p-4 rounded-xl border border-line">
              <input
                type="text"
                value={siteSettings.deliveryPolicyTitle}
                onChange={e => setSiteSettings(prev => ({ ...prev, deliveryPolicyTitle: e.target.value }))}
                className="w-full p-2 rounded-lg border border-line bg-surface font-extrabold"
              />
              <textarea
                rows={4}
                value={siteSettings.deliveryPolicyText}
                onChange={e => setSiteSettings(prev => ({ ...prev, deliveryPolicyText: e.target.value }))}
                className="w-full p-2 rounded-lg border border-line bg-surface leading-relaxed"
              />
            </div>
          </div>
        </div>

        </>) }
        {adminSettingsSubTab === 'cloud' && (<>
        {/* Supabase Cloud Connection Settings (Optional for Multi-Device Cloud Sync) */}
        <div className="pt-4 border-t border-line space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-fg">
                ربط قاعدة البيانات السحابية المباشرة (Supabase Cloud Sync)
              </h3>
              <p className="text-muted">
                البيانات محفوظة تلقائياً في المتصفح ولا تضيع مع الـ Refresh. ولمزامنتها بين أجهزة وموبايلات متعددة على الإنترنت، ضع رابط ومفتاح مشروعك في Supabase هنا:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-muted block mb-1">Supabase Project URL:</label>
              <input
                type="text"
                dir="ltr"
                value={siteSettings.supabaseUrl || ''}
                onChange={e => setSiteSettings(prev => ({ ...prev, supabaseUrl: e.target.value }))}
                placeholder="https://xxxxxxxxxxxx.supabase.co"
                className="w-full p-2.5 rounded-xl border border-line font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-muted block mb-1">Supabase Anon Public Key:</label>
              <input
                type="text"
                dir="ltr"
                value={siteSettings.supabaseAnonKey || ''}
                onChange={e => setSiteSettings(prev => ({ ...prev, supabaseAnonKey: e.target.value }))}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full p-2.5 rounded-xl border border-line font-mono"
              />
            </div>
          </div>

          {/* One-Click Batch Migration of Old Base64 Images to Supabase Storage */}
          <div className="p-4 rounded-2xl bg-surface2 border border-line flex flex-wrap items-center justify-between gap-3 mt-3">
            <div className="space-y-1 max-w-xl">
              <div className="font-extrabold text-fg text-xs flex items-center gap-1.5">
                <Database className="w-4 h-4 text-indigo-600" />
                <span>أداة تنظيف وتصغير حجم الصف ونقل الصور القديمة إلى Supabase Storage</span>
              </div>
              <p className="text-[11px] text-fg leading-relaxed">
                إذا كان لديك صور منتجات أو إعلانات قديمة مخزنة بصيغة Base64 كبيرة داخل الصف، اضغط هذا الزر ليقوم النظام بضغطها (900px وجودة 72%) ورفعها إلى Bucket <span className="font-mono font-bold">product-images</span> واستبدالها بروابط خفيفة وحفظ الصف فوراً.
              </p>
            </div>
            <button
              type="button"
              disabled={migratingImages}
              onClick={handleMigrateAllBase64ImagesToStorage}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-sm flex items-center gap-1.5 transition shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>{migratingImages ? migrationProgress || 'جاري نقل الصور...' : 'نقل صور Base64 فقط'}</span>
            </button>
          </div>

          {/* Comprehensive Anti-Egress Dashboard & Whole-Site WebP Image Optimizer */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#2563EB]/10 via-surface2 to-emerald-500/10 border-2 border-[#2563EB]/35 space-y-4 mt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1 max-w-2xl">
                <div className="font-black text-fg text-sm flex items-center gap-2">
                  <span>🚀 درع خفض استهلاك باقة Supabase Egress (+92% توفير فعلي) + ضغط كل صور الموقع لـ WebP</span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  تم تفعيل الكاش الذكي المشترك بين التبويبات (`35 دقيقة`)، وإيقاف سحب جدول العملاء المتكرر، وتحويل زر الحفظ ليرفع التعديلات الجديدة فقط، وضبط كاش الصور لمدة سنة كاملة (`max-age=31536000, immutable`). اضغط الزر بالأسفل لفحص وضغط جميع صور الإعلانات والمنتجات الحالية (بما فيها ملفات `.jpg` و`.png` الكبيرة في Storage) إلى صيغة `WebP` فائقة الخفة!
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={runSiteImagesAudit}
                  className="px-3.5 py-2.5 rounded-xl bg-surface hover:border-[#2563EB] border border-line text-fg font-extrabold text-xs transition"
                >
                  🔍 فحص حالة صور الموقع
                </button>
                <button
                  type="button"
                  disabled={migratingImages}
                  onClick={handleOptimizeAllSiteImagesToWebP}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs shadow-md flex items-center gap-1.5 transition"
                >
                  <Zap className="w-4 h-4" />
                  <span>{migratingImages ? migrationProgress || 'جاري الضغط والتحويل...' : '⚡ ضغط وتحويل كل صور الموقع لـ WebP خفيف الآن'}</span>
                </button>
              </div>
            </div>

            {siteImageAuditStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <div className="p-3 rounded-xl bg-surface border border-line text-center">
                  <div className="text-lg font-black text-emerald-500">{siteImageAuditStats.optimizedWebpCount}</div>
                  <div className="text-[11px] font-bold text-muted">صور WebP خفيفة ومخبأة ✓</div>
                </div>
                <div className="p-3 rounded-xl bg-surface border border-line text-center">
                  <div className="text-lg font-black text-amber-500">{siteImageAuditStats.nonWebpStorageCount}</div>
                  <div className="text-[11px] font-bold text-muted">صور JPG/PNG في Storage تقبل الضغط</div>
                </div>
                <div className="p-3 rounded-xl bg-surface border border-line text-center">
                  <div className="text-lg font-black text-rose-500">{siteImageAuditStats.base64Count}</div>
                  <div className="text-[11px] font-bold text-muted">صور Base64 خام داخل الجداول</div>
                </div>
                <div className="p-3 rounded-xl bg-surface border border-line text-center">
                  <div className="text-lg font-black text-[#2563EB]">{siteImageAuditStats.externalCdnCount}</div>
                  <div className="text-[11px] font-bold text-muted">روابط خارجية (صفر Egress)</div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-line/60 text-[11px]">
              <span className="text-muted font-bold">هل تحتاج لرفع كافة الـ {parts.length} منتج والـ {models.length} موديل دفعة واحدة للسيرفر (مزامنة شاملة استثنائية)؟</span>
              <button
                type="button"
                onClick={() => pushToSupabaseCloud({ forceFullCatalog: true }, true)}
                className="px-3.5 py-1.5 rounded-xl bg-surface hover:bg-surface2 border border-line text-fg font-extrabold transition"
              >
                ☁️ مزامنة شاملة لكل الكتالوج (يدوي)
              </button>
            </div>
          </div>
        </div>
        </>)}

        {adminSettingsSubTab === 'mobile_push' && (() => {
          const pCfg = getMobilePushConfig(siteSettings);
          const updatePushCfg = (patch) => {
            saveSiteSettingsImmediate(prev => ({
              ...prev,
              mobilePushConfig: { ...getMobilePushConfig(prev), ...patch }
            }));
          };
          const ntfyWebUrl = `https://ntfy.sh/${encodeURIComponent(pCfg.ntfyTopic)}`;
          return (
            <div className="pt-2 space-y-5 text-xs">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-surface2 to-[#2563EB]/10 border-2 border-emerald-500/35 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">يعمل مجاناً 100% حتى والموقع والمتصفح مغلقان تماماً!</span>
                    <h3 className="text-base sm:text-lg font-black text-fg mt-1.5">📲 نظام إشعارات الموبايل الفورية للطلبات الجديدة</h3>
                    <p className="text-xs text-muted mt-0.5">
                      بمجرد أن يضغط العميل «تأكيد الطلب» في المتجر، يرن موبايلك فوراً بإشعار يحتوي على رقم الفاتورة واسم العميل ورقمه والمبلغ والأصناف حتى لو قافل المتصفح وشاشة الموبايل مقفولة!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await sendMobileOrderPushAlert({
                        eventType: 'order',
                        title: '🔔 تجربة ناجحة! إشعارات متجر الزغبي تعمل الآن',
                        body: 'مبروك! سيصلك نفس هذا التنبيه الفوري على موبايلك مع كل أوردر جديد حتى والموقع مغلق تماماً 🚀'
                      });
                      if (ok) showToast('✅ تم إرسال الإشعار التجريبي لموبايلك الآن! تفقد تطبيق ntfy أو تليجرام.', 'success');
                      else showToast('يرجى تفعيل قناة ntfy أو كتابة بيانات بوت تليجرام أولاً.', 'warning');
                    }}
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition shrink-0"
                  >
                    <Bell className="w-4 h-4" />
                    <span>🔔 إرسال إشعار تجريبي لموبايلي الآن</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Method 1: ntfy.sh (Zero API Keys, 30 Seconds Setup!) */}
                <div className="p-4 rounded-2xl bg-surface2/60 border border-line space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-black text-sm text-fg">⚡ الطريقة 1 (الأسهل — في 30 ثانية بدون حساب): تطبيق ntfy</div>
                    <button
                      type="button"
                      onClick={() => updatePushCfg({ ntfyEnabled: !pCfg.ntfyEnabled })}
                      className={`px-3 py-1 rounded-lg font-extrabold text-[11px] border ${
                        pCfg.ntfyEnabled ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-surface text-muted border-line'
                      }`}
                    >
                      {pCfg.ntfyEnabled ? 'مفعّل ✓' : 'متوقف'}
                    </button>
                  </div>

                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-fg/90 font-bold bg-surface p-3 rounded-xl border border-line">
                    <li>حمّل تطبيق <b>ntfy</b> المجاني على موبايلك (<a href="https://play.google.com/store/apps/details?id=io.heckel.ntfy" target="_blank" rel="noopener noreferrer" className="text-[#2563EB] underline">أندرويد Google Play</a> أو <a href="https://apps.apple.com/app/ntfy/id1625396347" target="_blank" rel="noopener noreferrer" className="text-[#2563EB] underline">آيفون App Store</a>).</li>
                    <li>افتح التطبيق واضغط <b>(+)</b> واكتب كود قناتك السري الموجود بالأسفل تماماً.</li>
                    <li>اضغط زر <b>«إرسال إشعار تجريبي»</b> بالأعلى لتسمع رنّة الإشعار على موبايلك فوراً!</li>
                  </ol>

                  <div className="space-y-1.5">
                    <label className="block font-extrabold text-muted text-[11px]">كود قناتك السري الخاص (لا تشاركه مع غير فريق العمل):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        autoComplete="off"
                        dir="ltr"
                        value={pCfg.ntfyTopic}
                        onChange={e => updatePushCfg({ ntfyTopic: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '_') })}
                        className="flex-1 px-3.5 py-2.5 rounded-xl border border-line font-mono font-black text-xs bg-surface"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(pCfg.ntfyTopic);
                          showToast('تم نسخ كود القناة السري! الصقه داخل تطبيق ntfy في موبايلك.', 'success');
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-[#2563EB] text-white font-extrabold text-xs shrink-0"
                      >
                        نسخ الكود
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const rnd = `elzoghbi_vip_${Math.random().toString(36).slice(2, 9)}`;
                          updatePushCfg({ ntfyTopic: rnd });
                        }}
                        className="px-3 py-2.5 rounded-xl bg-surface border border-line text-fg font-bold text-xs shrink-0"
                        title="توليد كود سري جديد"
                      >
                        🔄 جديد
                      </button>
                    </div>
                    <div className="pt-1">
                      <a href={ntfyWebUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] font-extrabold text-[#2563EB] hover:underline">
                        🔗 أو افتح صفحة القناة مباشرة في المتصفح ({ntfyWebUrl})
                      </a>
                    </div>
                  </div>
                </div>

                {/* Method 2: Telegram Bot Push */}
                <div className="p-4 rounded-2xl bg-surface2/60 border border-line space-y-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-black text-sm text-fg">✈️ الطريقة 2 (اختياري إضافي): بوت تليجرام فوري</div>
                    <button
                      type="button"
                      onClick={() => updatePushCfg({ telegramEnabled: !pCfg.telegramEnabled })}
                      className={`px-3 py-1 rounded-lg font-extrabold text-[11px] border ${
                        pCfg.telegramEnabled ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-surface text-muted border-line'
                      }`}
                    >
                      {pCfg.telegramEnabled ? 'مفعّل ✓' : 'غير مفعّل'}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    يمكنك أيضاً ربط بوت تليجرام من <b>@BotFather</b> ليصلك ملخص كل فاتورة كرسالة تليجرام فورية على موبايلك بجانب ntfy:
                  </p>
                  <div className="space-y-2.5">
                    <div>
                      <label className="block font-bold text-muted text-[11px] mb-1">Telegram Bot Token:</label>
                      <input
                        type="password"
                        autoComplete="off"
                        dir="ltr"
                        value={pCfg.telegramBotToken}
                        onChange={e => updatePushCfg({ telegramBotToken: e.target.value, telegramEnabled: Boolean(e.target.value.trim()) })}
                        placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                        className="w-full px-3.5 py-2 rounded-xl border border-line font-mono text-xs bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-muted text-[11px] mb-1">Telegram Chat ID (معرف حسابك أو جروب الإدارة):</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={pCfg.telegramChatId}
                        onChange={e => updatePushCfg({ telegramChatId: e.target.value })}
                        placeholder="مثال: 987654321"
                        className="w-full px-3.5 py-2 rounded-xl border border-line font-mono text-xs bg-surface"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Types Toggles */}
              <div className="p-4 rounded-2xl bg-surface2/50 border border-line flex flex-wrap items-center gap-4">
                <span className="font-black text-fg">أرسل إشعاراً لموبايلي فور وصول:</span>
                {[
                  ['notifyOnOrders', '🛒 أوردر شراء جديد'],
                  ['notifyOnSourcing', '🌍 طلب استيراد من الخارج'],
                  ['notifyOnReturns', '🔄 طلب مرتجع أو ضمان'],
                  ['notifyOnAccounts', '👤 طلب فتح حساب تاجر/عميل']
                ].map(([ek, elbl]) => (
                  <label key={ek} className="flex items-center gap-2 font-bold text-fg cursor-pointer bg-surface px-3 py-2 rounded-xl border border-line">
                    <input
                      type="checkbox"
                      checked={Boolean(pCfg[ek])}
                      onChange={e => updatePushCfg({ [ek]: e.target.checked })}
                      className="w-4 h-4 accent-[#2563EB]"
                    />
                    <span>{elbl}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    </div>);
}

export function renderCmsAccordionHeader(ctx, secKey, icon, title, subtitle, badgeTxt = '') {
  const { openCmsSections, toggleCmsSection } = ctx;
    const isOpen = openCmsSections[secKey] !== false;
    return (
      <div
        onClick={() => toggleCmsSection(secKey)}
        className="flex items-center justify-between gap-3 pb-3 border-b border-line cursor-pointer select-none"
      >
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">{icon}</span>
            <h3 className="text-sm sm:text-base font-black text-fg">{title}</h3>
            {badgeTxt && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#2563EB]/15 text-[#2563EB] dark:text-[#60A5FA] font-black text-[11px]">
                {badgeTxt}
              </span>
            )}
          </div>
          {subtitle && <p className="text-[11px] text-muted">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); toggleCmsSection(secKey); }}
          className={`w-9 h-9 rounded-xl font-mono font-black text-base flex items-center justify-center border transition shrink-0 ${
            isOpen
              ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
              : 'bg-surface2 text-fg border-line hover:border-[#3B82F6]'
          }`}
          title={isOpen ? 'طي القسم (−)' : 'فتح القسم (+)'}
        >
          {isOpen ? '−' : '+'}
        </button>
      </div>
    );
  
}

export function renderPrecisionImageControls(ctx, targetObj, patchObj, onUploadFile, isSourcing = false) {
  const {  } = ctx;
    const hasImg = Boolean(targetObj.image && String(targetObj.image).trim() !== '');
    const curScale = Number(targetObj.imageScale) || 100;
    const curOffX = Number(targetObj.imageOffsetX) || 0;
    const curOffY = Number(targetObj.imageOffsetY) || 0;
    const curLayout = targetObj.layout || 'editorial_split';

    const miniPill = (active, onClick, label, extraCls = '') => (
      <button
        type="button"
        onClick={onClick}
        className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-extrabold transition ${
          active
            ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-2xs'
            : 'bg-bg text-fg border-line hover:border-[#3B82F6]'
        } ${extraCls}`}
      >
        {label}
      </button>
    );

    return (
      <div className="space-y-3">
        {/* 3-Column Side-by-Side Control Deck Right Under Live Preview! */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
          {/* DECK 1: Image Upload + 1-Click Smart Presets */}
          <div className="p-3 rounded-2xl bg-surface border border-line space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-black text-fg text-xs">🖼️ 1. الصورة والضبط الذكي السريع</span>
              {hasImg && (
                <button
                  type="button"
                  onClick={() => patchObj({ image: '', layout: isSourcing ? 'text' : 'icon_3d_studio' })}
                  className="px-2 py-0.5 rounded-md bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white text-[10px] font-bold transition"
                >
                  حذف الصورة
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label className="px-3 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-[11px] cursor-pointer transition inline-flex items-center gap-1.5 shrink-0">
                <Upload className="w-3.5 h-3.5" />
                <span>رفع صورة (تُضغط WebP)</span>
                <input type="file" accept="image/*" onChange={onUploadFile} className="hidden" />
              </label>
              <input
                type="url"
                dir="ltr"
                value={targetObj.image && !String(targetObj.image).startsWith('data:') ? targetObj.image : ''}
                onChange={e =>
                  patchObj({
                    image: e.target.value,
                    layout: targetObj.layout === 'text' || targetObj.layout === 'icon_3d_studio' ? 'editorial_split' : targetObj.layout
                  })
                }
                placeholder="https://... أو رابط مباشر"
                className="flex-1 min-w-0 px-2.5 py-2 rounded-xl border border-line text-[11px] font-mono bg-bg"
              />
            </div>

            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {miniPill(
                curLayout === 'editorial_split' && targetObj.imageFrameStyle === 'white_cutout',
                () => patchObj({ layout: 'editorial_split', imageFrameStyle: 'white_cutout', blendWhiteBg: true, imageFit: 'contain', imageScale: 104, imageOffsetX: 0, imageOffsetY: 0 }),
                '✨ عزل خلفية بيضاء'
              )}
              {miniPill(
                curLayout === 'editorial_split' && (targetObj.imageFrameStyle || 'white_pedestal') === 'white_pedestal' && !targetObj.blendWhiteBg,
                () => patchObj({ layout: 'editorial_split', imageFrameStyle: 'white_pedestal', blendWhiteBg: false, imageFit: 'contain', imageScale: 100, imageOffsetX: 0, imageOffsetY: 0 }),
                '🤍 كارت أبيض متناسق'
              )}
              {miniPill(
                curLayout === 'editorial_split' && targetObj.imageFrameStyle === 'clean_float',
                () => patchObj({ layout: 'editorial_split', imageFrameStyle: 'clean_float', blendWhiteBg: false, imageFit: 'contain', imageScale: 108, imageOffsetX: 0, imageOffsetY: 0 }),
                '🦋 شفافة مفرغة PNG'
              )}
              {miniPill(
                curLayout === 'full_clean',
                () => patchObj({ layout: 'full_clean', imageFit: 'contain', imageScale: 100, imageOffsetX: 0, imageOffsetY: 0, showOverlayOnClean: false }),
                '🖼️ بانر جاهز كامل'
              )}
              {miniPill(
                curLayout === 'seamless_blend',
                () => patchObj({ layout: 'seamless_blend', imageFit: 'cover', blendWhiteBg: false, imageScale: 100 }),
                '🌊 دمج انسيابي'
              )}
              {miniPill(
                curLayout === 'icon_3d_studio',
                () => patchObj({ layout: 'icon_3d_studio', mediaMode: 'icon_only' }),
                '💎 أيقونة 3D جاهزة'
              )}
            </div>
          </div>

          {/* DECK 2: Position, Fit, Width & Frame Side-by-Side */}
          <div className="p-3 rounded-2xl bg-surface border border-line space-y-2.5">
            <div className="font-black text-fg text-xs">📐 2. الموضع والإطار وملاءمة الأبعاد</div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-muted ml-1">التخطيط:</span>
              {[
                ['editorial_split', 'صورة + نص'],
                ['full', 'خلفية كاملة'],
                ['full_clean', 'بوستر صافي'],
                ['seamless_blend', 'تلاشي جانبي'],
                ['text', 'نص فقط']
              ].map(([vk, vlbl]) => miniPill(curLayout === vk, () => patchObj({ layout: vk }), vlbl))}
            </div>

            {curLayout !== 'text' && curLayout !== 'full_clean' && curLayout !== 'full' && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-muted ml-1">الجهة:</span>
                {miniPill((targetObj.imagePos || 'left') === 'left', () => patchObj({ imagePos: 'left' }), '⬅️ يسار')}
                {miniPill(targetObj.imagePos === 'right', () => patchObj({ imagePos: 'right' }), '➡️ يمين')}
                {miniPill(targetObj.imagePos === 'top', () => patchObj({ imagePos: 'top' }), '⬆️ أعلى')}
                <span className="text-[10px] font-bold text-muted mr-1">المساحة:</span>
                {miniPill(Number(targetObj.imageWidthPct) === 36, () => patchObj({ imageWidthPct: 36 }), '36%')}
                {miniPill((Number(targetObj.imageWidthPct) || 44) === 44, () => patchObj({ imageWidthPct: 44 }), '44%')}
                {miniPill(Number(targetObj.imageWidthPct) === 52, () => patchObj({ imageWidthPct: 52 }), '52%')}
              </div>
            )}

            {hasImg && curLayout !== 'text' && curLayout !== 'icon_3d_studio' && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-muted ml-1">الأبعاد:</span>
                {miniPill((targetObj.imageFit || 'contain') === 'contain', () => patchObj({ imageFit: 'contain' }), 'كاملة بدون قص')}
                {miniPill(targetObj.imageFit === 'cover', () => patchObj({ imageFit: 'cover' }), 'ملء الإطار')}
                {curLayout === 'editorial_split' && (
                  <>
                    <span className="text-[10px] font-bold text-muted mr-1">الإطار:</span>
                    {AD_IMAGE_FRAME_OPTIONS.map(([fKey, fLbl]) =>
                      miniPill((targetObj.imageFrameStyle || 'white_pedestal') === fKey, () => patchObj({ imageFrameStyle: fKey, blendWhiteBg: fKey === 'white_cutout' }), fLbl)
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* DECK 3: Live Sliders Side-by-Side (Scale + X + Y + Reset) */}
          <div className="p-3 rounded-2xl bg-surface border border-line space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-black text-fg text-xs">🎯 3. تحريك وتكبير الصورة بالمللي</span>
              <button
                type="button"
                onClick={() => patchObj({ imageScale: 100, imageOffsetX: 0, imageOffsetY: 0, imageFocal: 'center', imageWidthPct: 44, imagePos: 'left' })}
                className="px-2.5 py-0.5 rounded-lg bg-surface2 hover:bg-[#2563EB] text-fg hover:text-white border border-line text-[10px] font-extrabold transition"
              >
                ↺ تصفير 100%
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[10px] font-extrabold mb-0.5">
                  <span className="text-muted">الحجم (Zoom):</span>
                  <span className="font-mono text-[#2563EB] dark:text-[#60A5FA]">{curScale}%</span>
                </div>
                <input type="range" min="65" max="150" value={curScale} onChange={e => patchObj({ imageScale: Number(e.target.value) })} className="w-full hm-range" />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <div className="flex justify-between text-[10px] font-extrabold mb-0.5">
                    <span className="text-muted">يمين / يسار (X):</span>
                    <span className="font-mono text-[#2563EB] dark:text-[#60A5FA]" dir="ltr">{curOffX}px</span>
                  </div>
                  <input type="range" min="-55" max="55" value={curOffX} onChange={e => patchObj({ imageOffsetX: Number(e.target.value) })} className="w-full hm-range" />
                </div>
                <div>
                  <div className="flex justify-between text-[10px] font-extrabold mb-0.5">
                    <span className="text-muted">أعلى / أسفل (Y):</span>
                    <span className="font-mono text-[#2563EB] dark:text-[#60A5FA]" dir="ltr">{curOffY}px</span>
                  </div>
                  <input type="range" min="-55" max="55" value={curOffY} onChange={e => patchObj({ imageOffsetY: Number(e.target.value) })} className="w-full hm-range" />
                </div>
              </div>

              {targetObj.imageFit === 'cover' && (
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] font-bold text-muted">التركيز:</span>
                  {[['center', 'وسط'], ['top', 'أعلى'], ['bottom', 'أسفل'], ['right', 'يمين'], ['left', 'يسار']].map(([fp, lbl]) =>
                    miniPill((targetObj.imageFocal || 'center') === fp, () => patchObj({ imageFocal: fp }), lbl)
                  )}
                </div>
              )}

              {curLayout === 'full' && (
                <div>
                  <div className="flex justify-between text-[10px] font-extrabold mb-0.5">
                    <span className="text-muted">تعتيم خلف النص:</span>
                    <span className="font-mono text-[#2563EB]">{targetObj.overlay ?? 52}%</span>
                  </div>
                  <input type="range" min="15" max="88" value={targetObj.overlay ?? 52} onChange={e => patchObj({ overlay: Number(e.target.value) })} className="w-full hm-range" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 41 3D Icons Compact Picker (Only when Icon Studio is selected) */}
        {(curLayout === 'icon_3d_studio' || targetObj.mediaMode === 'image_and_icon') && (
          <div className="p-3 rounded-2xl bg-surface border border-line space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-extrabold text-fg text-xs">💎 اختر الأيقونة ثلاثية الأبعاد (41 شكل جاهز):</span>
              <span className="text-[11px] font-bold text-[#2563EB] dark:text-[#60A5FA]">
                {(SHORTCUT_ICON_PRESETS[targetObj.iconPreset || 'flagship_iphones'] || SHORTCUT_ICON_PRESETS.flagship_iphones).label}
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5 max-h-40 overflow-y-auto p-1.5 rounded-xl bg-bg border border-line">
              {Object.entries(SHORTCUT_ICON_PRESETS).map(([k, v]) => {
                const selected = (targetObj.iconPreset || 'flagship_iphones') === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => patchObj({ iconPreset: k })}
                    className={`p-1.5 rounded-xl border flex flex-col items-center justify-center gap-0.5 text-center transition ${
                      selected ? 'bg-[#2563EB]/20 border-[#2563EB]' : 'bg-surface hover:bg-surface2 border-line'
                    }`}
                  >
                    <div className="w-7 h-7 flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6">
                      {v.svg || (typeof v.render === 'function' ? v.render() : null)}
                    </div>
                    <span className="text-[8px] font-bold line-clamp-1 text-fg">{v.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  
}

export function renderAdminStorefrontCms(ctx) {
  const { adEditorOpen, adForm, adPreviewDevice, adminCmsSubTab, askConfirmDelete, brands, duplicateAd, getFooterConfig, getHeaderConfig, handleAdImageUpload, isCategoryHidden, models, moveAd, newBarForm, nlBody, nlPromoCode, nlSubject, openCmsSections, openEditAd, openNewAd, parts, processAndUploadImage, promoCodes, renderAdSeg, renderAdToggle, renderAdminSubTabBar, renderClientFooter, renderClientHeader, renderCmsAccordionHeader, renderPrecisionImageControls, saveAdForm, saveSiteSettingsImmediate, setAdEditorOpen, setAdForm, setAdPreviewDevice, setAdminCmsSubTab, setNewBarForm, setNlBody, setNlPromoCode, setNlSubject, setParts, setShowcaseBars, setStoreAds, showToast, showcaseBars, siteSettings, storeAds, toggleHideCategory } = ctx;
    const srcBanner = getSourcingBanner(siteSettings);
    const updateSrcBanner = (patch) => {
      saveSiteSettingsImmediate(prev => ({
        ...prev,
        sourcingBanner: { ...getSourcingBanner(prev), ...patch }
      }));
    };

    return (
      <div className="space-y-4 text-xs">
        {/* Clean 5-Tab Segmented Navigation for Storefront Design & Marketing */}
        {renderAdminSubTabBar(
          [
            { id: 'ads', icon: '🖼️', label: 'استوديو البنرات والإعلانات', badge: storeAds.length },
            { id: 'header_studio', icon: '🎛️', label: 'التحكم الكامل في الهيدر والشعار' },
            { id: 'footer_studio', icon: '🦶', label: 'التحكم الكامل في الفوتر (أسفل الموقع)' },
            { id: 'home_layout', icon: '🏠', label: 'أقسام الرئيسية والـ 8 اختصارات' },
            { id: 'bars_cats', icon: '✨', label: 'بارات العرض والتصنيفات', badge: showcaseBars.length },
            { id: 'sourcing_banner', icon: '🌍', label: 'بانر الاستيراد من الخارج' },
            { id: 'newsletter', icon: '📧', label: 'النشرة البريدية والحملات' }
          ],
          adminCmsSubTab,
          setAdminCmsSubTab
        )}

        
        {/* SUB-TAB: FULL HEADER & BRAND LOGO CUSTOMIZER (Req 3 & 4) */}
        {adminCmsSubTab === 'header_studio' && (() => {
          const hCfg = getHeaderConfig(siteSettings);
          const updateHdr = (patch) => {
            saveSiteSettingsImmediate(prev => ({
              ...prev,
              headerConfig: { ...getHeaderConfig(prev), ...patch }
            }));
          };
          return (
            <div className="bg-surface rounded-3xl p-5 sm:p-6 border border-line shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
                <div>
                  <h2 className="text-sm sm:text-base font-black text-fg">🎛️ استوديو التحكم الكامل في الهيدر والشعار والقوائم العلوية</h2>
                  <p className="text-[11px] text-muted mt-0.5">تحكم في شكل اللوجو، اسم المتجر، شريط البحث، الأزرار العلوية، وروابط التنقل مع معاينة فورية</p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="/elzoghbi-logo-full.webp"
                    download="ELZOGHBI_Brand_Logo.webp"
                    className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل نسخة اللوجو الجديد</span>
                  </a>
                  <button
                    type="button"
                    onClick={() =>
                      askConfirmDelete(
                        'إعادة ضبط الهيدر للافتراضي',
                        'هيتم مسح كل تخصيصات الهيدر الحالية والرجوع للوضع الافتراضي. متأكد؟',
                        () => saveSiteSettingsImmediate(prev => ({ ...prev, headerConfig: {} })),
                        'نعم، إعادة الضبط'
                      )
                    }
                    className="px-3 py-2 rounded-xl bg-surface2 border border-line text-muted hover:text-fg font-bold text-xs"
                  >
                    ↺ الوضع الافتراضي
                  </button>
                </div>
              </div>

              {/* Live Header Preview */}
              <div className="rounded-2xl border-2 border-[#2563EB]/35 overflow-hidden shadow-md">
                <div className="px-3 py-1.5 bg-surface2 text-[10px] font-extrabold text-muted border-b border-line">👁️ معاينة حية لهيدر العميل الآن:</div>
                <div className="pointer-events-none">{renderClientHeader()}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Col 1: Brand Logo & Title */}
                <div className="p-4 rounded-2xl bg-surface2/50 border border-line space-y-3">
                  <div className="font-black text-fg text-xs">✨ 1. الشعار (Logo) واسم الهيدر</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      ['geometric_svg', '💎 شعار Z الهندسي (SVG)'],
                      ['emblem_webp', '🖼️ أيقونة الشعار (WebP)'],
                      ['custom_image', '📤 رفع شعار مخصص'],
                      ['text_only', '🔤 نص العلامة فقط']
                    ].map(([mk, mlbl]) => (
                      <button
                        key={mk}
                        type="button"
                        onClick={() => updateHdr({ logoMode: mk })}
                        className={`p-2 rounded-xl border text-[11px] font-extrabold text-right transition ${
                          hCfg.logoMode === mk ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-surface text-fg border-line'
                        }`}
                      >
                        {mlbl}
                      </button>
                    ))}
                  </div>

                  {hCfg.logoMode === 'custom_image' && (
                    <div className="space-y-2 pt-1">
                      <input
                        type="url"
                        dir="ltr"
                        value={hCfg.customLogoUrl}
                        onChange={e => updateHdr({ customLogoUrl: e.target.value })}
                        placeholder="https://... رابط صورة اللوجو"
                        className="w-full px-3 py-2 rounded-xl border border-line text-xs font-mono bg-surface"
                      />
                      <label className="w-full py-2 px-3 rounded-xl bg-[#2563EB] text-white font-extrabold text-xs cursor-pointer flex items-center justify-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>أو ارفع لوجو من جهازك</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async e => {
                            const f = e.target.files?.[0];
                            e.target.value = '';
                            if (!f) return;
                            const u = await processAndUploadImage(f, 'brands');
                            if (u) updateHdr({ customLogoUrl: u, logoMode: 'custom_image' });
                          }}
                        />
                      </label>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-muted mb-1">الاسم الرئيسي بالهيدر:</label>
                      <input
                        type="text"
                        value={hCfg.brandTitle}
                        onChange={e => updateHdr({ brandTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-line font-black text-xs bg-surface"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-muted mb-1">الوصف أسفل الاسم:</label>
                      <input
                        type="text"
                        value={hCfg.brandSubtitle}
                        onChange={e => updateHdr({ brandSubtitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-line font-bold text-xs bg-surface"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {[
                      ['showSubtitle', 'إظهار السطر الفرعي'],
                      ['stickyHeader', 'تثبيت الهيدر عند النزول'],
                      ['compactHeight', 'هيدر رشيق مضغوط'],
                      ['forceDarkHeader', 'خلفية كحلي ملكي دائماً']
                    ].map(([fk, flbl]) => (
                      <label key={fk} className="flex items-center gap-1.5 bg-surface px-2.5 py-1.5 rounded-lg border border-line font-bold text-[11px] cursor-pointer">
                        <input type="checkbox" checked={Boolean(hCfg[fk])} onChange={e => updateHdr({ [fk]: e.target.checked })} className="w-3.5 h-3.5 accent-[#2563EB]" />
                        <span>{flbl}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Col 2: Search Bar & Utility Icons */}
                <div className="p-4 rounded-2xl bg-surface2/50 border border-line space-y-3">
                  <div className="font-black text-fg text-xs">🔍 2. شريط البحث وأيقونات الأدوات</div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted mb-1">نص خانة البحث في الهيدر:</label>
                    <input
                      type="text"
                      value={hCfg.searchPlaceholder}
                      onChange={e => updateHdr({ searchPlaceholder: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-line font-bold text-xs bg-surface"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ['showSearchBar', '🔍 شريط البحث'],
                      ['showCartBtn', '🛒 أيقونة السلة'],
                      ['showWishlistBtn', '❤️ المفضلة'],
                      ['showAccountBtn', '👤 حساب العميل'],
                      ['showThemeToggle', '🌙 زر الوضع الليلي/الفاتح'],
                      ['showWhatsappBtn', '💬 زر واتساب بالهيدر'],
                      ['showWarrantyBtn', '🛡️ زر فحص الضمان']
                    ].map(([ik, ilbl]) => (
                      <label key={ik} className="flex items-center gap-1.5 bg-surface px-2.5 py-2 rounded-xl border border-line font-bold text-[11px] cursor-pointer">
                        <input type="checkbox" checked={Boolean(hCfg[ik])} onChange={e => updateHdr({ [ik]: e.target.checked })} className="w-3.5 h-3.5 accent-[#2563EB]" />
                        <span>{ilbl}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Col 3: Navigation Links & Custom CTA */}
                <div className="p-4 rounded-2xl bg-surface2/50 border border-line space-y-2.5">
                  <div className="font-black text-fg text-xs">🧭 3. روابط الهيدر وتعديل مسمياتها</div>
                  {[
                    ['showHomeLink', 'homeLabel', 'الرئيسية'],
                    ['showProductsLink', 'productsLabel', 'المنتجات'],
                    ['showCategoriesMenu', 'categoriesLabel', 'الأقسام المنسدلة'],
                    ['showOffersLink', 'offersLabel', 'العروض'],
                    ['showAboutLink', 'aboutLabel', 'من نحن'],
                    ['showContactLink', 'contactLabel', 'تواصل معنا']
                  ].map(([toggleK, labelK, ph]) => (
                    <div key={toggleK} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={Boolean(hCfg[toggleK])}
                        onChange={e => updateHdr({ [toggleK]: e.target.checked })}
                        className="w-4 h-4 accent-[#2563EB] shrink-0"
                      />
                      <input
                        type="text"
                        value={hCfg[labelK]}
                        onChange={e => updateHdr({ [labelK]: e.target.value })}
                        placeholder={ph}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-line text-xs font-bold bg-surface"
                      />
                    </div>
                  ))}

                  <div className="pt-2 border-t border-line space-y-2">
                    <label className="flex items-center gap-2 font-extrabold text-fg text-[11px] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(hCfg.customNavEnabled)}
                        onChange={e => updateHdr({ customNavEnabled: e.target.checked })}
                        className="w-4 h-4 accent-[#2563EB]"
                      />
                      <span>➕ إضافة زر مميز إضافي في الهيدر:</span>
                    </label>
                    {hCfg.customNavEnabled && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={hCfg.customNavLabel}
                          onChange={e => updateHdr({ customNavLabel: e.target.value })}
                          placeholder="مثال: 🔥 عروض الجمعة"
                          className="px-2.5 py-1.5 rounded-lg border border-line text-xs font-bold bg-surface"
                        />
                        <select
                          value={hCfg.customNavTarget}
                          onChange={e => updateHdr({ customNavTarget: e.target.value })}
                          className="px-2 py-1.5 rounded-lg border border-line text-xs font-bold bg-surface"
                        >
                          <option value="BEST_SELLERS">الأكثر مبيعاً</option>
                          <option value="DISCOUNTS">العروض والخصومات</option>
                          <option value="SOURCING">نافذة الاستيراد من الخارج</option>
                          <option value="WARRANTY">نافذة فحص الضمان</option>
                          <option value="EXTERNAL">رابط خارجي مخصص</option>
                        </select>
                        {hCfg.customNavTarget === 'EXTERNAL' && (
                          <input
                            type="url"
                            dir="ltr"
                            value={hCfg.customNavExternalUrl}
                            onChange={e => updateHdr({ customNavExternalUrl: e.target.value })}
                            placeholder="https://..."
                            className="col-span-2 px-2.5 py-1.5 rounded-lg border border-line text-xs font-mono bg-surface"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        
        {/* SUB-TAB: FULL FOOTER (BOTTOM SECTION) CUSTOMIZER */}
        {adminCmsSubTab === 'footer_studio' && (() => {
          const fCfg = getFooterConfig(siteSettings);
          const updateFtr = (patch) => {
            saveSiteSettingsImmediate(prev => ({
              ...prev,
              footerConfig: { ...getFooterConfig(prev), ...patch }
            }));
          };
          return (
            <div className="bg-surface rounded-3xl p-5 sm:p-6 border border-line shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
                <div>
                  <h2 className="text-sm sm:text-base font-black text-fg">🦶 استوديو التحكم الكامل في الجزء السفلي للموقع (Footer)</h2>
                  <p className="text-[11px] text-muted mt-0.5">تحكم في جميع أعمدة الفوتر، النصوص، الروابط السريعة، شارات الدفع، بيانات التواصل، والأزرار العائمة مع معاينة حية</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateFtr({ showFooter: !fCfg.showFooter })}
                    className={`px-3.5 py-2 rounded-xl font-extrabold text-xs border transition ${
                      fCfg.showFooter ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                    }`}
                  >
                    {fCfg.showFooter ? '✓ الفوتر ظاهر في الموقع' : '✕ الفوتر مخفي حالياً'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      askConfirmDelete(
                        'إعادة ضبط الفوتر للافتراضي',
                        'هيتم مسح كل تخصيصات الفوتر الحالية والرجوع للوضع الافتراضي. متأكد؟',
                        () => saveSiteSettingsImmediate(prev => ({ ...prev, footerConfig: {} })),
                        'نعم، إعادة الضبط'
                      )
                    }
                    className="px-3 py-2 rounded-xl bg-surface2 border border-line text-muted hover:text-fg font-bold text-xs"
                  >
                    ↺ استعادة الافتراضي
                  </button>
                </div>
              </div>

              {/* Live Footer Preview */}
              <div className="rounded-2xl border-2 border-indigo-500/35 overflow-hidden shadow-md">
                <div className="px-3 py-1.5 bg-surface2 text-[10px] font-extrabold text-muted border-b border-line">👁️ معاينة حية للجزء السفلي (الفوتر) كما يراه العميل:</div>
                <div className="max-h-[380px] overflow-y-auto">{renderClientFooter(true)}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {/* Card 1: Brand Column & Theme */}
                <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-fg text-xs">🏪 1. عمود الهوية ولون الفوتر</span>
                    <input type="checkbox" checked={fCfg.showBrandCol} onChange={e => updateFtr({ showBrandCol: e.target.checked })} className="w-4 h-4 accent-[#2563EB]" />
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      ['auto', 'تلقائي ذكي'],
                      ['dark', 'داكن دائماً'],
                      ['light', 'فاتح دائماً']
                    ].map(([tk, tlbl]) => (
                      <button
                        key={tk}
                        type="button"
                        onClick={() => updateFtr({ footerTheme: tk })}
                        className={`py-1.5 px-2 rounded-lg border text-[11px] font-extrabold ${
                          fCfg.footerTheme === tk ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-surface text-fg border-line'
                        }`}
                      >
                        {tlbl}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted mb-1">الوصف التعريفي تحت اللوجو بالفوتر:</label>
                    <textarea
                      rows={2}
                      value={fCfg.footerDescription}
                      onChange={e => updateFtr({ footerDescription: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-line text-xs font-bold bg-surface"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="flex items-center gap-1.5 bg-surface px-2.5 py-1.5 rounded-lg border border-line font-bold text-[11px] cursor-pointer">
                      <input type="checkbox" checked={fCfg.showFooterLogo} onChange={e => updateFtr({ showFooterLogo: e.target.checked })} className="w-3.5 h-3.5 accent-[#2563EB]" />
                      <span>إظهار اللوجو</span>
                    </label>
                    <label className="flex items-center gap-1.5 bg-surface px-2.5 py-1.5 rounded-lg border border-line font-bold text-[11px] cursor-pointer">
                      <input type="checkbox" checked={fCfg.showSocialIcons} onChange={e => updateFtr({ showSocialIcons: e.target.checked })} className="w-3.5 h-3.5 accent-[#2563EB]" />
                      <span>أيقونات السوشيال ميديا</span>
                    </label>
                  </div>
                </div>

                {/* Card 2: Quick Links & Support Columns */}
                <div className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20 space-y-3">
                  <div className="font-black text-fg text-xs">🔗 2. عمودا الروابط السريعة وخدمة العملاء</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-1.5">
                      <input type="checkbox" checked={fCfg.showQuickLinksCol} onChange={e => updateFtr({ showQuickLinksCol: e.target.checked })} className="w-4 h-4 accent-violet-600" />
                      <input type="text" value={fCfg.quickLinksTitle} onChange={e => updateFtr({ quickLinksTitle: e.target.value })} className="w-full px-2 py-1.5 rounded-lg border border-line text-xs font-black bg-surface" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input type="checkbox" checked={fCfg.showSupportCol} onChange={e => updateFtr({ showSupportCol: e.target.checked })} className="w-4 h-4 accent-violet-600" />
                      <input type="text" value={fCfg.supportColTitle} onChange={e => updateFtr({ supportColTitle: e.target.value })} className="w-full px-2 py-1.5 rounded-lg border border-line text-xs font-black bg-surface" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      ['showLinkHome', 'رابط الرئيسية'],
                      ['showLinkProducts', 'رابط المنتجات'],
                      ['showLinkBestSellers', 'الأكثر مبيعاً'],
                      ['showLinkOffers', 'العروض والخصومات'],
                      ['showLinkFavorites', 'قائمة المفضلة'],
                      ['showWarrantyLink', 'فحص الضمان بالرقم'],
                      ['showReturnPolicyLink', 'سياسة الاسترجاع'],
                      ['showTermsLink', 'شروط الاستخدام'],
                      ['showShippingPolicyLink', 'سياسة الشحن']
                    ].map(([lk, llbl]) => (
                      <label key={lk} className="flex items-center gap-1.5 bg-surface px-2 py-1.5 rounded-lg border border-line font-bold text-[11px] cursor-pointer">
                        <input type="checkbox" checked={Boolean(fCfg[lk])} onChange={e => updateFtr({ [lk]: e.target.checked })} className="w-3.5 h-3.5 accent-violet-600" />
                        <span className="truncate">{llbl}</span>
                      </label>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-line/60">
                    <input type="text" value={fCfg.customFooterLinkLabel} onChange={e => updateFtr({ customFooterLinkLabel: e.target.value })} placeholder="اسم رابط إضافي..." className="px-2.5 py-1.5 rounded-lg border border-line text-xs font-bold bg-surface" />
                    <input type="url" dir="ltr" value={fCfg.customFooterLinkUrl} onChange={e => updateFtr({ customFooterLinkUrl: e.target.value })} placeholder="https://..." className="px-2.5 py-1.5 rounded-lg border border-line text-xs font-mono bg-surface" />
                  </div>
                </div>

                {/* Card 3: Payments, Contact & Copyright/Floating */}
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                  <div className="font-black text-fg text-xs">💳 3. طرق الدفع، التواصل، والحقوق السفلية</div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      ['showBadgeVisa', 'VISA'],
                      ['showBadgeMastercard', 'Mastercard'],
                      ['showBadgeApplePay', 'Apple Pay'],
                      ['showBadgeInstaPay', 'InstaPay'],
                      ['showBadgeVCash', 'V-Cash']
                    ].map(([pk, plbl]) => (
                      <label key={pk} className="flex items-center gap-1 bg-surface px-2 py-1 rounded-lg border border-line font-extrabold text-[11px] cursor-pointer">
                        <input type="checkbox" checked={Boolean(fCfg[pk])} onChange={e => updateFtr({ [pk]: e.target.checked })} className="w-3.5 h-3.5 accent-emerald-600" />
                        <span>{plbl}</span>
                      </label>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={fCfg.codNoteText}
                    onChange={e => updateFtr({ codNoteText: e.target.value })}
                    placeholder="جملة الدفع عند الاستلام..."
                    className="w-full px-2.5 py-1.5 rounded-lg border border-line text-xs font-bold bg-surface"
                  />

                  <div className="grid grid-cols-3 gap-1.5">
                    <input
                      type="text"
                      dir="ltr"
                      value={fCfg.customFooterPhone || siteSettings.whatsappNumber || ''}
                      onChange={e => updateFtr({ customFooterPhone: e.target.value })}
                      placeholder="رقم التواصل"
                      className="px-2 py-1.5 rounded-lg border border-line text-xs font-mono bg-surface"
                    />
                    <input
                      type="text"
                      value={fCfg.customFooterHours || siteSettings.workingHours || ''}
                      onChange={e => updateFtr({ customFooterHours: e.target.value })}
                      placeholder="مواعيد العمل"
                      className="px-2 py-1.5 rounded-lg border border-line text-xs font-bold bg-surface"
                    />
                    <input
                      type="text"
                      value={fCfg.footerLocationText}
                      onChange={e => updateFtr({ footerLocationText: e.target.value })}
                      placeholder="العنوان / الدولة"
                      className="px-2 py-1.5 rounded-lg border border-line text-xs font-bold bg-surface"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-line/60">
                    <input
                      type="text"
                      value={fCfg.bottomSloganPrefix}
                      onChange={e => updateFtr({ bottomSloganPrefix: e.target.value })}
                      placeholder="شعار اليمين (تسوّق بذكاء..)"
                      className="px-2 py-1.5 rounded-lg border border-line text-xs font-bold bg-surface"
                    />
                    <input
                      type="text"
                      value={fCfg.copyrightText}
                      onChange={e => updateFtr({ copyrightText: e.target.value })}
                      placeholder="نص حقوق الملكية (اختياري)"
                      className="px-2 py-1.5 rounded-lg border border-line text-xs font-bold bg-surface"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <label className="flex items-center gap-1.5 bg-surface px-2.5 py-1.5 rounded-lg border border-line font-bold text-[11px] cursor-pointer">
                      <input type="checkbox" checked={fCfg.showScrollTopButton} onChange={e => updateFtr({ showScrollTopButton: e.target.checked })} className="w-3.5 h-3.5 accent-emerald-600" />
                      <span>زر «↑ أول الصفحة» العائم</span>
                    </label>
                    <label className="flex items-center gap-1.5 bg-surface px-2.5 py-1.5 rounded-lg border border-line font-bold text-[11px] cursor-pointer">
                      <input type="checkbox" checked={fCfg.showFloatingWhatsapp} onChange={e => updateFtr({ showFloatingWhatsapp: e.target.checked })} className="w-3.5 h-3.5 accent-emerald-600" />
                      <span>زر واتساب العائم بالأسفل</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* SUB-TAB 1: ARCHITECTURAL AD STUDIO & SAVED ADS */}
        {adminCmsSubTab === 'ads' && (
          <div className="bg-surface rounded-3xl p-5 sm:p-6 border border-line shadow-xs space-y-5">
            <div className="flex items-center justify-between gap-3 flex-wrap pb-3 border-b border-line">
              <div>
                <h2 className="text-sm sm:text-base font-black text-fg">استوديو تصميم البنرات والإعلانات الاحترافي</h2>
                <p className="text-[11px] text-muted mt-0.5">
                  تحكم كامل في موضع الصورة وحجمها وإطارها ودمجها مع معاينة حية مطابقة 100% لشاشة العميل على الكمبيوتر والموبايل
                </p>
              </div>
              {!adEditorOpen && (
                <button
                  type="button"
                  onClick={openNewAd}
                  className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold shadow-md shadow-blue-600/20 transition"
                >
                  + إنشاء إعلان أو بانر جديد
                </button>
              )}
            </div>

            {adEditorOpen && (
              <form onSubmit={saveAdForm} className="rounded-3xl border-2 border-[#2563EB]/40 bg-surface2/40 p-4 sm:p-6 space-y-5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="font-black text-fg text-sm sm:text-base">
                    {adForm.id ? '✏️ تعديل تصميم الإعلان والصورة' : '✨ تصميم إعلان جديد'}
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAdPreviewDevice('desktop')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition ${
                        adPreviewDevice === 'desktop' ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-surface text-fg border-line'
                      }`}
                    >
                      💻 معاينة الكمبيوتر
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdPreviewDevice('mobile')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition ${
                        adPreviewDevice === 'mobile' ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-surface text-fg border-line'
                      }`}
                    >
                      📱 معاينة الموبايل
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdEditorOpen(false)}
                      className="w-8 h-8 rounded-xl bg-surface border border-line flex items-center justify-center text-fg hover:text-rose-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sticky Live Preview Directly Above Side-by-Side Controls (Zero Up/Down Scrolling!) */}
                <div className="sticky top-[104px] z-20 p-2.5 sm:p-3 rounded-2xl bg-bg/95 backdrop-blur-md border-2 border-[#2563EB]/35 shadow-lg flex flex-col items-center">
                  <div
                    style={{ background: getAdTheme(adForm).cssGrad }}
                    className={`relative rounded-[26px] overflow-hidden border border-white/15 shadow-xl transition-all duration-300 ${
                      adPreviewDevice === 'mobile' ? 'w-full max-w-[380px]' : 'w-full'
                    }`}
                  >
                    <AdContent ad={adForm} isPromoCard={adForm.placement === 'promo_split'} rtl />
                  </div>
                </div>

                {/* Precision Image & Layout Studio */}
                {renderPrecisionImageControls(adForm, (patch) => setAdForm(prev => ({ ...prev, ...patch })), handleAdImageUpload, false)}

                {/* Copy, Link, Placement & Theme Controls */}
                <div className="p-4 rounded-2xl bg-surface border border-line space-y-4">
                  <div className="font-extrabold text-fg text-xs">📝 4. نصوص الإعلان، مكان ظهوره، ولون البانر:</div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-muted mb-1">عنوان الإعلان الرئيسي:</label>
                      <input
                        type="text"
                        value={adForm.title}
                        onChange={e => setAdForm(p => ({ ...p, title: e.target.value }))}
                        placeholder="مثال: أقوى عروض الشاشات والأجهزة الأصلية"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted mb-1">الوصف الفرعي:</label>
                      <input
                        type="text"
                        value={adForm.subtitle}
                        onChange={e => setAdForm(p => ({ ...p, subtitle: e.target.value }))}
                        placeholder="مثال: ضمان حقيقي وشحن سريع لجميع المحافظات"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted mb-1">الشارة العلوية (Badge):</label>
                      <input
                        type="text"
                        value={adForm.badge}
                        onChange={e => setAdForm(p => ({ ...p, badge: e.target.value }))}
                        placeholder="عرض حصري 🔥"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted mb-1">نص زر الإجراء:</label>
                      <input
                        type="text"
                        value={adForm.buttonText}
                        onChange={e => setAdForm(p => ({ ...p, buttonText: e.target.value }))}
                        placeholder="تسوق الآن"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Placement */}
                    <div>
                      <label className="block text-[11px] font-bold text-muted mb-1">مكان ظهور الإعلان في الرئيسية:</label>
                      <select
                        value={adForm.placement || 'hero'}
                        onChange={e => setAdForm(p => ({ ...p, placement: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-line font-bold text-xs"
                      >
                        <option value="hero">السلايدر الرئيسي الكبير (أعلى الصفحة)</option>
                        <option value="promo_split">البنرات المزدوجة (منتصف الرئيسية)</option>
                        <option value="both">الاثنين معاً (السلايدر + البنرات المزدوجة)</option>
                      </select>
                    </div>

                    {/* Linked Product/Model */}
                    <div>
                      <label className="block text-[11px] font-bold text-muted mb-1">عند ضغط العميل يفتح:</label>
                      <select
                        value={adForm.linkedPartId}
                        onChange={e => setAdForm(p => ({ ...p, linkedPartId: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-line font-bold text-xs"
                      >
                        <option value="">صفحة المنتجات / نافذة العرض</option>
                        {models.filter(m => m.isPromotedAd || `mdl:${m.id}` === adForm.linkedPartId).length > 0 && (
                          <optgroup label="📱 الموديلات المعلمة بنجمة (⭐)">
                            {models
                              .filter(m => m.isPromotedAd || `mdl:${m.id}` === adForm.linkedPartId)
                              .map(m => (
                                <option key={`mdl_${m.id}`} value={`mdl:${m.id}`}>
                                  ⭐ الموديل: {m.brand} — {m.name}
                                </option>
                              ))}
                          </optgroup>
                        )}
                        {parts.filter(pt => pt.isPromotedAd || pt.id === adForm.linkedPartId).length > 0 && (
                          <optgroup label="🧩 المنتجات المعلمة بنجمة (⭐)">
                            {parts
                              .filter(pt => pt.isPromotedAd || pt.id === adForm.linkedPartId)
                              .map(pt => (
                                <option key={`prm_${pt.id}`} value={pt.id}>
                                  ⭐ المنتج: {pt.name}
                                </option>
                              ))}
                          </optgroup>
                        )}
                      </select>
                    </div>

                    {/* Banner Height */}
                    <div>
                      <label className="block text-[11px] font-bold text-muted mb-1">ارتفاع البانر:</label>
                      <select
                        value={adForm.bannerHeight || 'standard'}
                        onChange={e => setAdForm(p => ({ ...p, bannerHeight: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-line font-bold text-xs"
                      >
                        <option value="compact">أنيق مضغوط</option>
                        <option value="standard">قياسي متوازن (موصى به)</option>
                        <option value="tall">سينمائي كبير</option>
                      </select>
                    </div>
                  </div>

                  {/* Theme Swatches */}
                  <div className="space-y-1.5">
                    <div className="font-bold text-muted text-[11px]">لون وتدرج خلفية البانر:</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(AD_THEMES).map(k => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setAdForm(p => ({ ...p, theme: k }))}
                          title={AD_THEMES[k].label}
                          style={{ background: AD_THEMES[k].cssGrad }}
                          className={`h-9 px-3 rounded-xl border-2 text-[11px] font-extrabold flex items-center gap-1.5 transition ${
                            adForm.theme === k ? 'border-[#2563EB] ring-2 ring-[#2563EB]/40 scale-105' : 'border-white/20 opacity-85 hover:opacity-100'
                          } ${AD_THEMES[k].light ? 'text-slate-900' : 'text-white'}`}
                        >
                          <span>{AD_THEMES[k].label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 border-t border-line">
                    {renderAdSeg('محاذاة النصوص', 'align', [['start', 'جانبية منسقة'], ['center', 'توسيط']])}
                    {renderAdToggle('إظهار الشارة العلوية', 'showBadge')}
                    {renderAdToggle('إظهار زر التسوق', 'showButton')}
                    {renderAdToggle('نشر الإعلان للعملاء فوراً', 'active')}
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/20 transition"
                  >
                    {adForm.id ? 'حفظ تعديلات الإعلان ✓' : 'اعتماد ونشر الإعلان الآن ✓'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdEditorOpen(false)}
                    className="px-6 py-3 rounded-xl bg-surface border border-line text-fg font-bold text-xs"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            )}

            {/* Existing Ads Clean Grid (Using Exact cssGrad so cards match storefront 100%) */}
            {storeAds.length === 0 ? (
              <div className="p-10 text-center rounded-2xl bg-surface2/40 border border-dashed border-line space-y-2">
                <div className="text-sm font-extrabold text-fg">لا توجد إعلانات مخصصة حالياً</div>
                <p className="text-xs text-muted">اضغط على «+ إنشاء إعلان أو بانر جديد» لإضافة أول بانر احترافي لمتجرك</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {storeAds.map((ad, idx) => {
                  const th = getAdTheme(ad);
                  const placeLbl =
                    ad.placement === 'promo_split'
                      ? 'البنرات المزدوجة'
                      : ad.placement === 'both'
                      ? 'السلايدر + المزدوجة'
                      : 'السلايدر الرئيسي';
                  return (
                    <div key={ad.id} className="rounded-2xl border border-line bg-surface2/30 overflow-hidden flex flex-col justify-between">
                      <div style={{ background: th.cssGrad }} className="relative overflow-hidden">
                        <AdContent ad={ad} compact rtl />
                      </div>
                      <div className="p-3.5 space-y-2.5 bg-surface border-t border-line">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setStoreAds(prev => prev.map(a => (a.id === ad.id ? { ...a, active: !a.active } : a)))}
                              className={`px-3 py-1 rounded-lg font-extrabold text-[11px] border transition ${
                                ad.active
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : 'bg-surface2 text-muted border-line'
                              }`}
                            >
                              {ad.active ? '✓ نشط وظاهر' : '✕ مخفي مؤقتاً'}
                            </button>
                            <span className="px-2.5 py-1 rounded-lg bg-[#2563EB]/10 text-[#2563EB] dark:text-[#60A5FA] font-bold text-[10px]">
                              {placeLbl}
                            </span>
                          </div>
                          <span className="text-[11px] font-bold text-muted">ترتيب #{idx + 1}</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 font-bold">
                          <button
                            type="button"
                            onClick={() => openEditAd(ad)}
                            className="px-4 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-extrabold transition"
                          >
                            ✏️ تعديل التصميم والصورة
                          </button>
                          <button
                            type="button"
                            onClick={() => duplicateAd(ad)}
                            className="px-3 py-1.5 rounded-xl bg-surface2 hover:border-[#3B82F6] border border-line text-fg text-xs"
                          >
                            نسخ
                          </button>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveAd(ad.id, -1)}
                            className="px-2.5 py-1.5 rounded-xl bg-surface2 border border-line disabled:opacity-40 text-fg"
                            title="تقديم للأعلى"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            disabled={idx === storeAds.length - 1}
                            onClick={() => moveAd(ad.id, 1)}
                            className="px-2.5 py-1.5 rounded-xl bg-surface2 border border-line disabled:opacity-40 text-fg"
                            title="تأخير للأسفل"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            onClick={() => askConfirmDelete('حذف الإعلان', `هل تريد حذف الإعلان "${ad.title || 'البانر'}" نهائياً؟`, () => setStoreAds(prev => prev.filter(a => a.id !== ad.id)))}
                            className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white mr-auto transition"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SUB-TAB 4: SOURCING BANNER STUDIO */}
        {adminCmsSubTab === 'sourcing_banner' && (
          <div className="bg-surface rounded-3xl p-5 sm:p-6 border border-line shadow-xs space-y-5">
            {renderCmsAccordionHeader(
              'sourcing_banner',
              '🌍',
              'استوديو بانر «اطلب منتجك من الخارج / الصين»',
              'تحكم كامل في ظهور البانر بالرئيسية وصفحة المنتجات مع ضبط دقيق للصورة والألوان',
              srcBanner.active ? 'مفعّل ✓' : 'متوقف'
            )}

            <div className="sticky top-[104px] z-20 p-2.5 sm:p-3 rounded-2xl bg-bg/95 backdrop-blur-md border-2 border-[#2563EB]/35 shadow-lg">
              <div className="flex items-center justify-between text-[11px] font-bold text-muted mb-1.5">
                <span>👁️ معاينة حية ثابتة (حرّك الأزرار بالأسفل وشاهد التغيير فوراً بدون نزول أو طلوع):</span>
                <span className="text-[#2563EB] dark:text-[#60A5FA] font-extrabold">مباشر 100%</span>
              </div>
              <div style={{ background: getAdTheme(srcBanner).cssGrad }} className="relative rounded-[24px] overflow-hidden shadow-md">
                <AdContent ad={{ ...srcBanner, bannerHeight: srcBanner.bannerHeight || 'compact', linkedPartId: 'x' }} isPromoCard rtl />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateSrcBanner({ active: !srcBanner.active })}
                className={`px-4 py-2 rounded-xl font-extrabold border ${
                  srcBanner.active ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-surface2 text-muted border-line'
                }`}
              >
                {srcBanner.active ? '✓ البانر مفعّل' : '✕ البانر متوقف'}
              </button>
              <button
                type="button"
                onClick={() => saveSiteSettingsImmediate(prev => ({ ...prev, showHomeSourcing: !(prev.showHomeSourcing !== false) }))}
                className={`px-4 py-2 rounded-xl font-extrabold border ${
                  siteSettings.showHomeSourcing !== false ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-surface2 text-fg border-line'
                }`}
              >
                {siteSettings.showHomeSourcing !== false ? 'ظاهر في الصفحة الرئيسية ✓' : 'مخفي من الرئيسية'}
              </button>
              <button
                type="button"
                onClick={() => saveSiteSettingsImmediate(prev => ({ ...prev, showSearchSourcing: !(prev.showSearchSourcing !== false) }))}
                className={`px-4 py-2 rounded-xl font-extrabold border ${
                  siteSettings.showSearchSourcing !== false ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-surface2 text-fg border-line'
                }`}
              >
                {siteSettings.showSearchSourcing !== false ? 'ظاهر في صفحة المنتجات ✓' : 'مخفي من صفحة المنتجات'}
              </button>
            </div>

            {renderPrecisionImageControls(
              srcBanner,
              updateSrcBanner,
              async e => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                const url = await processAndUploadImage(file, 'ads');
                if (url) updateSrcBanner({ image: url, layout: 'editorial_split', imageFrameStyle: 'white_cutout', blendWhiteBg: true, imageFit: 'contain' });
              },
              true
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-surface2/40 border border-line">
              <div>
                <label className="block text-[10px] font-bold text-muted mb-1">عنوان البانر:</label>
                <input type="text" value={srcBanner.title || ''} onChange={e => updateSrcBanner({ title: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line text-xs font-bold bg-surface" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted mb-1">الوصف الفرعي:</label>
                <input type="text" value={srcBanner.subtitle || ''} onChange={e => updateSrcBanner({ subtitle: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line text-xs font-bold bg-surface" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted mb-1">الشارة العلوية:</label>
                <input type="text" value={srcBanner.badge || ''} onChange={e => updateSrcBanner({ badge: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line text-xs font-bold bg-surface" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-muted mb-1">نص الزر:</label>
                <input type="text" value={srcBanner.buttonText || ''} onChange={e => updateSrcBanner({ buttonText: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line text-xs font-bold bg-surface" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="font-bold text-muted text-[11px]">لون خلفية البانر:</div>
              <div className="flex flex-wrap gap-2">
                {Object.keys(AD_THEMES).map(k => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => updateSrcBanner({ theme: k })}
                    style={{ background: AD_THEMES[k].cssGrad }}
                    className={`h-9 px-3 rounded-xl border-2 text-[11px] font-extrabold transition ${
                      srcBanner.theme === k ? 'border-[#2563EB] ring-2 ring-[#2563EB]/40' : 'border-white/20 opacity-85'
                    } ${AD_THEMES[k].light ? 'text-slate-900' : 'text-white'}`}
                  >
                    {AD_THEMES[k].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {adminCmsSubTab === 'home_layout' && (
        <>
        {/* SECTION 3: 40 Shortcut Icons Controller */}
        <div className="bg-surface rounded-3xl p-5 border border-line shadow-sm space-y-4">
          {renderCmsAccordionHeader(
            'shortcuts',
            '🎯',
            '3. التحكم في الأيقونات المختصرة بالصفحة الرئيسية (40 شكل جاهز أو صور مخصصة)',
            'اختر من بين 40 أيقونة ثلاثية الأبعاد مخصصة للموبايلات وقطع الغيار والإكسسوارات أو ارفع صورة وعدّل النص',
            `${(Array.isArray(siteSettings.homeShortcutIcons) && siteSettings.homeShortcutIcons.length > 0 ? siteSettings.homeShortcutIcons : DEFAULT_HOME_SHORTCUT_ICONS).length} أيقونات`
          )}

          {openCmsSections.shortcuts !== false && (
            <div className="space-y-4 pt-3 border-t border-line">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-muted font-bold">يمكنك اختيار أي من الـ 40 شكلاً الجاهزة أو رفع صورة خاصة لكل اختصار:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = Array.isArray(siteSettings.homeShortcutIcons) && siteSettings.homeShortcutIcons.length > 0
                        ? siteSettings.homeShortcutIcons
                        : DEFAULT_HOME_SHORTCUT_ICONS;
                      const next = [...cur, { id: `sc_${Date.now()}`, label: 'قسم جديد', mode: 'preset', preset: 'phone', image: '', category: 'ALL', filterMode: 'ALL', visible: true }];
                      saveSiteSettingsImmediate(prev => ({ ...prev, homeShortcutIcons: next }));
                    }}
                    className="px-4 py-2 rounded-full bg-[#2563EB] text-white text-xs font-extrabold hover:bg-[#1D4ED8] transition"
                  >
                    + إضافة أيقونة جديدة
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      saveSiteSettingsImmediate(prev => ({ ...prev, homeShortcutIcons: DEFAULT_HOME_SHORTCUT_ICONS }));
                      showToast('تم استعادة الأيقونات المختصرة الافتراضية ✓', 'info');
                    }}
                    className="px-4 py-2 rounded-full bg-surface2 border border-line text-fg text-xs font-bold hover:border-[#3B82F6]"
                  >
                    استعادة الافتراضي
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                {(Array.isArray(siteSettings.homeShortcutIcons) && siteSettings.homeShortcutIcons.length > 0
                  ? siteSettings.homeShortcutIcons
                  : DEFAULT_HOME_SHORTCUT_ICONS
                ).map((sc, scIdx, arrRef) => {
                  const updateShortcut = (patch) => {
                    const updated = arrRef.map((item, i) => (i === scIdx ? { ...item, ...patch } : item));
                    saveSiteSettingsImmediate(prev => ({ ...prev, homeShortcutIcons: updated }));
                  };
                  const presetObj = SHORTCUT_ICON_PRESETS[sc.preset] || SHORTCUT_ICON_PRESETS.phone;
                  return (
                    <div key={sc.id || scIdx} className="p-3.5 rounded-2xl bg-surface2/70 border border-line space-y-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-11 h-11 rounded-xl bg-surface border border-line flex items-center justify-center overflow-hidden p-1 shrink-0">
                            {sc.mode === 'image' && sc.image ? (
                              <img src={sc.image} alt="" className="max-w-full max-h-full object-contain" />
                            ) : (
                              <div className="scale-75">{presetObj.render()}</div>
                            )}
                          </div>
                          <span className="font-black text-fg">أيقونة #{scIdx + 1}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateShortcut({ visible: sc.visible === false })}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${sc.visible !== false ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'}`}
                          >
                            {sc.visible !== false ? 'ظاهرة' : 'مخفية'}
                          </button>
                          {arrRef.length > 1 && (
                            <button
                              type="button"
                              onClick={() => saveSiteSettingsImmediate(prev => ({ ...prev, homeShortcutIcons: arrRef.filter((_, i) => i !== scIdx) }))}
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/15"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-muted mb-1">النص المكتوب تحت الأيقونة:</label>
                        <input
                          type="text"
                          value={sc.label || ''}
                          onChange={e => updateShortcut({ label: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-line font-bold text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateShortcut({ mode: 'preset' })}
                          className={`py-1.5 rounded-lg font-extrabold border ${sc.mode !== 'image' ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-surface text-fg border-line'}`}
                        >
                          40 شكل جاهز (3D)
                        </button>
                        <button
                          type="button"
                          onClick={() => updateShortcut({ mode: 'image' })}
                          className={`py-1.5 rounded-lg font-extrabold border ${sc.mode === 'image' ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-surface text-fg border-line'}`}
                        >
                          صورة مخصصة
                        </button>
                      </div>

                      {sc.mode === 'image' ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            dir="ltr"
                            value={sc.image || ''}
                            onChange={e => updateShortcut({ image: e.target.value })}
                            placeholder="https://... رابط الصورة"
                            className="flex-1 px-2 py-1.5 rounded-lg border border-line font-mono text-[10px]"
                          />
                          <label className="px-2.5 py-1.5 rounded-lg bg-[#2563EB] text-white font-bold cursor-pointer shrink-0">
                            رفع
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                const url = await processAndUploadImage(f, 'categories');
                                if (url) updateShortcut({ image: url, mode: 'image' });
                              }}
                            />
                          </label>
                        </div>
                      ) : (
                        <select
                          value={sc.preset || 'phone'}
                          onChange={e => updateShortcut({ preset: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-line font-bold text-xs"
                        >
                          {Object.entries(SHORTCUT_ICON_PRESETS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-muted mb-1">القسم / الفلتر عند الضغط:</label>
                        <select
                          value={sc.filterMode === 'DISCOUNTS' ? '__DISCOUNTS__' : (sc.category || 'ALL')}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '__DISCOUNTS__') updateShortcut({ category: 'ALL', filterMode: 'DISCOUNTS' });
                            else updateShortcut({ category: val, filterMode: 'ALL' });
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-line font-bold text-xs"
                        >
                          <option value="ALL">كل المنتجات</option>
                          <option value="__DISCOUNTS__">العروض والخصومات 🔥</option>
                          {Array.from(new Set([...(Array.isArray(siteSettings.customCategories) ? siteSettings.customCategories : []), ...parts.map(p => p.category).filter(Boolean)])).map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3B: Full Dashboard Control — Brands Bar Under Icons + Search Filter Quick Shortcuts */}
        <div className="bg-surface rounded-3xl p-5 border border-line shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
            <div>
              <h3 className="text-sm sm:text-base font-black text-fg">🏷️ التحكم الكامل في شريط البراندات (تحت الأيقونات) واختصارات البحث السريعة</h3>
              <p className="text-[11px] text-muted mt-0.5">اختر البراندات التي تظهر تحت أيقونات الصفحة الرئيسية ورتبها، وتحكم في البراندات وأيقونات التصنيفات الظاهرة كاختصارات بضغطة واحدة في شريط البحث</p>
            </div>
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface2 border border-line cursor-pointer font-extrabold text-xs">
              <input
                type="checkbox"
                checked={siteSettings.showHomeBrandsBar !== false}
                onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, showHomeBrandsBar: e.target.checked }))}
              />
              <span>إظهار شريط البراندات بالرئيسية</span>
            </label>
          </div>

          {/* A. Homepage Brands Bar Manager */}
          {(() => {
            const selectedHomeBrands = Array.isArray(siteSettings.homeFeaturedBrands) && siteSettings.homeFeaturedBrands.length > 0
              ? siteSettings.homeFeaturedBrands.filter(b => brands.includes(b))
              : brands;
            const toggleHomeBrand = (br) => {
              const exists = selectedHomeBrands.includes(br);
              const next = exists ? selectedHomeBrands.filter(x => x !== br) : [...selectedHomeBrands, br];
              saveSiteSettingsImmediate(prev => ({ ...prev, homeFeaturedBrands: next }));
            };
            const moveHomeBrand = (idx, dir) => {
              const target = idx + dir;
              if (target < 0 || target >= selectedHomeBrands.length) return;
              const copy = [...selectedHomeBrands];
              [copy[idx], copy[target]] = [copy[target], copy[idx]];
              saveSiteSettingsImmediate(prev => ({ ...prev, homeFeaturedBrands: copy }));
            };
            return (
              <div className="space-y-3 p-4 rounded-2xl bg-bg border border-line">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-black text-xs text-fg">1. براندات الصفحة الرئيسية تحت الأيقونات ({selectedHomeBrands.length} / {brands.length})</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => saveSiteSettingsImmediate(prev => ({ ...prev, homeFeaturedBrands: [...brands] }))}
                      className="px-2.5 py-1 rounded-lg bg-[#2563EB]/15 text-[#2563EB] font-extrabold text-[11px]"
                    >
                      تحديد الكل
                    </button>
                    <button
                      type="button"
                      onClick={() => saveSiteSettingsImmediate(prev => ({ ...prev, homeFeaturedBrands: [] }))}
                      className="px-2.5 py-1 rounded-lg bg-surface2 border border-line text-muted font-bold text-[11px]"
                    >
                      استعادة الترتيب الافتراضي
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedHomeBrands.map((br, idx) => (
                    <div key={`hb_ord_${br}`} className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2563EB]/15 border border-[#2563EB]/40 text-fg text-[11px] font-extrabold">
                      <button type="button" onClick={() => moveHomeBrand(idx, -1)} disabled={idx === 0} className="px-1 hover:text-[#2563EB] disabled:opacity-30" title="تقديم">→</button>
                      <span>{String(br).replace(/^OR\s*-\s*/i, '')}</span>
                      <button type="button" onClick={() => moveHomeBrand(idx, 1)} disabled={idx === selectedHomeBrands.length - 1} className="px-1 hover:text-[#2563EB] disabled:opacity-30" title="تأخير">←</button>
                      <button type="button" onClick={() => toggleHomeBrand(br)} className="text-rose-500 hover:text-rose-600 pr-0.5" title="إخفاء">×</button>
                    </div>
                  ))}
                </div>
                {brands.filter(b => !selectedHomeBrands.includes(b)).length > 0 && (
                  <div className="pt-2 border-t border-line/60 space-y-1.5">
                    <span className="text-[10px] font-bold text-muted">براندات مخفية (اضغط لإظهارها):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {brands.filter(b => !selectedHomeBrands.includes(b)).map(br => (
                        <button
                          key={`hb_hid_${br}`}
                          type="button"
                          onClick={() => toggleHomeBrand(br)}
                          className="px-2.5 py-1 rounded-full bg-surface2 border border-line text-muted hover:text-fg hover:border-[#3B82F6] text-[11px] font-bold"
                        >
                          + {String(br).replace(/^OR\s*-\s*/i, '')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* B. Search Filter 1-Tap Brand Shortcuts Manager */}
          {(() => {
            const selectedSearchBrands = Array.isArray(siteSettings.searchShortcutBrands) && siteSettings.searchShortcutBrands.length > 0
              ? siteSettings.searchShortcutBrands.filter(b => brands.includes(b))
              : brands.slice(0, 12);
            const toggleSearchBrand = (br) => {
              const exists = selectedSearchBrands.includes(br);
              const next = exists ? selectedSearchBrands.filter(x => x !== br) : [...selectedSearchBrands, br];
              saveSiteSettingsImmediate(prev => ({ ...prev, searchShortcutBrands: next }));
            };
            return (
              <div className="space-y-2.5 p-4 rounded-2xl bg-bg border border-line">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-black text-xs text-fg">2. اختصارات البراندات في واجهة البحث ({selectedSearchBrands.length} براند ظاهر للعميل)</span>
                  <button
                    type="button"
                    onClick={() => saveSiteSettingsImmediate(prev => ({ ...prev, searchShortcutBrands: brands.slice(0, 12) }))}
                    className="px-2.5 py-1 rounded-lg bg-surface2 border border-line text-muted font-bold text-[11px]"
                  >
                    استعادة الافتراضي
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {brands.map(br => {
                    const active = selectedSearchBrands.includes(br);
                    return (
                      <button
                        key={`sb_tog_${br}`}
                        type="button"
                        onClick={() => toggleSearchBrand(br)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border transition ${
                          active
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-surface2 text-muted border-line hover:text-fg'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}{String(br).replace(/^OR\s*-\s*/i, '')}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* C. Search Filter 1-Tap Category Icons Toggle */}
          {(() => {
            const curSc = Array.isArray(siteSettings.homeShortcutIcons) && siteSettings.homeShortcutIcons.length > 0
              ? siteSettings.homeShortcutIcons
              : DEFAULT_HOME_SHORTCUT_ICONS;
            return (
              <div className="space-y-2.5 p-4 rounded-2xl bg-bg border border-line">
                <span className="font-black text-xs text-fg block">3. اختصارات أيقونات التصنيفات في شريط البحث (مثل السماعات والشواحن):</span>
                <div className="flex flex-wrap gap-1.5">
                  {curSc.filter(sc => sc && sc.category && sc.category !== 'ALL').map((sc, idx) => {
                    const active = sc.showInSearch !== false;
                    return (
                      <button
                        key={`sc_srch_tog_${sc.id || idx}`}
                        type="button"
                        onClick={() => {
                          const updated = curSc.map(item => item.id === sc.id ? { ...item, showInSearch: !active } : item);
                          saveSiteSettingsImmediate(prev => ({ ...prev, homeShortcutIcons: updated }));
                        }}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold border transition ${
                          active
                            ? 'bg-[#2563EB] text-white border-[#2563EB]'
                            : 'bg-surface2 text-muted border-line hover:text-fg'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}{sc.label} ({normalizePartCategory(sc.category)})
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        </>
        )}
        {adminCmsSubTab === 'bars_cats' && (
        <>
        {/* SECTION 4: Curated Product Showcase Bars */}
        <div className="bg-surface rounded-3xl p-5 border border-line shadow-sm space-y-4">
          {renderCmsAccordionHeader(
            'showcase_bars',
            '📦',
            '4. بارات وأقسام عرض المنتجات في الواجهة الرئيسية (Showcase Bars)',
            'إنشاء وتعديل وترتيب صفوف المنتجات المميزة في الصفحة الرئيسية وربطها بتصنيف أو براند أو عروض',
            `${showcaseBars.length} بار عرض`
          )}

          {openCmsSections.showcase_bars !== false && (
            <div className="space-y-4 pt-3 border-t border-line">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (!newBarForm.title.trim()) return;
                  const srcType = newBarForm.sourceType || 'manual';
                  if (srcType === 'manual' && newBarForm.selectedPartIds.length === 0) {
                    showToast('اختر منتجاً واحداً على الأقل أو اختر مصدر تلقائي للبار.', 'warning');
                    return;
                  }
                  const createdBar = {
                    id: newBarForm.editingId || `bar_${Date.now()}`,
                    title: newBarForm.title.trim(),
                    subtitle: newBarForm.subtitle.trim() || 'منتجات مختارة بعناية من الإدارة',
                    badgeColor: newBarForm.badgeColor || 'bg-[#2563EB] text-white',
                    sourceType: srcType,
                    sourceValue: newBarForm.sourceValue || '',
                    maxItems: Number(newBarForm.maxItems) || 8,
                    partIds: newBarForm.selectedPartIds,
                    active: newBarForm.editingId
                      ? (showcaseBars.find(b => b.id === newBarForm.editingId)?.active ?? true)
                      : true
                  };
                  if (newBarForm.editingId) {
                    setShowcaseBars(prev => prev.map(b => (b.id === newBarForm.editingId ? createdBar : b)));
                    showToast('تم حفظ تعديلات بار العرض بنجاح ✓', 'success');
                  } else {
                    setShowcaseBars(prev => [...prev, createdBar]);
                    showToast('تم إنشاء بار عرض المنتجات الجديد وإضافته للواجهة الرئيسية!', 'success');
                  }
                  setNewBarForm({ title: '', subtitle: '', sourceType: 'manual', sourceValue: '', maxItems: 8, selectedPartIds: [] });
                }}
                className="bg-surface2/70 p-4 rounded-2xl border border-line space-y-3 text-xs"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={newBarForm.title}
                    onChange={e => setNewBarForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="عنوان البار (مثال: 🔥 أقوى عروض الشاشات والإكسسوارات)..."
                    className="p-2.5 rounded-xl border border-line bg-surface font-bold"
                  />
                  <input
                    type="text"
                    value={newBarForm.subtitle}
                    onChange={e => setNewBarForm(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="وصف مختصر تحت عنوان البار..."
                    className="p-2.5 rounded-xl border border-line bg-surface"
                  />
                  <select
                    value={newBarForm.sourceType || 'manual'}
                    onChange={e => setNewBarForm(prev => ({ ...prev, sourceType: e.target.value, sourceValue: '' }))}
                    className="p-2.5 rounded-xl border border-line bg-surface font-extrabold"
                  >
                    <option value="manual">اختيار منتجات محددة يدوياً</option>
                    <option value="discounts">🔥 عرض المنتجات التي عليها خصم تلقائياً</option>
                    <option value="category">📂 عرض منتجات تصنيف معين تلقائياً</option>
                    <option value="brand">📱 عرض منتجات براند معين تلقائياً</option>
                  </select>
                </div>

                {newBarForm.sourceType === 'category' && (
                  <select
                    value={newBarForm.sourceValue || ''}
                    onChange={e => setNewBarForm(prev => ({ ...prev, sourceValue: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-line font-bold"
                  >
                    <option value="">-- اختر التصنيف --</option>
                    {Array.from(new Set(parts.map(p => p.category).filter(Boolean))).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                )}

                {newBarForm.sourceType === 'brand' && (
                  <select
                    value={newBarForm.sourceValue || ''}
                    onChange={e => setNewBarForm(prev => ({ ...prev, sourceValue: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-line font-bold"
                  >
                    <option value="">-- اختر البراند --</option>
                    {brands.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                )}

                {(!newBarForm.sourceType || newBarForm.sourceType === 'manual') && (
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-surface rounded-xl border border-line">
                    {parts.slice(0, 60).map(pt => {
                      const selected = newBarForm.selectedPartIds.includes(pt.id);
                      return (
                        <button
                          key={pt.id}
                          type="button"
                          onClick={() =>
                            setNewBarForm(prev => ({
                              ...prev,
                              selectedPartIds: selected
                                ? prev.selectedPartIds.filter(id => id !== pt.id)
                                : [...prev.selectedPartIds, pt.id]
                            }))
                          }
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition ${
                            selected ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-surface2 text-muted border-line'
                          }`}
                        >
                          {selected ? '✓ ' : '+ '} {pt.name}
                        </button>
                      );
                    })}
                  </div>
                )}

                <button type="submit" className="px-6 py-2.5 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black shadow-sm">
                  {newBarForm.editingId ? 'حفظ تعديلات البار ✓' : '+ إنشاء بار عرض جديد'}
                </button>
              </form>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {showcaseBars.map(bar => (
                  <div key={bar.id} className="p-4 rounded-2xl border border-line bg-surface2/50 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-fg text-sm">{bar.title}</div>
                      <div className="text-[11px] text-muted">{bar.subtitle}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setNewBarForm({
                          editingId: bar.id,
                          title: bar.title || '',
                          subtitle: bar.subtitle || '',
                          badgeColor: bar.badgeColor || '',
                          sourceType: bar.sourceType || 'manual',
                          sourceValue: bar.sourceValue || '',
                          maxItems: bar.maxItems || 8,
                          selectedPartIds: Array.isArray(bar.partIds) ? bar.partIds : []
                        })}
                        className="px-3 py-1 rounded-full font-extrabold text-[11px] bg-[#2563EB]/15 text-[#2563EB] dark:text-[#60A5FA]"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowcaseBars(prev => prev.map(b => (b.id === bar.id ? { ...b, active: !b.active } : b)))}
                        className={`px-3 py-1 rounded-full font-extrabold text-[11px] ${bar.active ? 'bg-emerald-500/15 text-emerald-500' : 'bg-surface text-muted border border-line'}`}
                      >
                        {bar.active ? 'ظاهر ✓' : 'مخفي'}
                      </button>
                      <button
                        type="button"
                        onClick={() => askConfirmDelete('حذف بار العرض', `هل تريد حذف بار "${bar.title}"؟`, () => setShowcaseBars(prev => prev.filter(b => b.id !== bar.id)))}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/15"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        </>
        )}
        {adminCmsSubTab === 'newsletter' && (
        <>
        {/* SECTION 5: Newsletter Subscribers & Email Campaign Controller */}
        <div className="bg-surface rounded-3xl p-5 border border-line shadow-sm space-y-4">
          {renderCmsAccordionHeader(
            'newsletter',
            '📧',
            '5. إدارة النشرة البريدية وإرسال الإيميلات الترويجية للمشتركين',
            'استعرض قائمة المشتركين في النشرة البريدية وأرسل لهم رسائل العروض وأكواد الخصم بضغطة زر',
            `${Array.isArray(siteSettings.newsletterSubscribers) ? siteSettings.newsletterSubscribers.length : 0} مشترك`
          )}

          {openCmsSections.newsletter !== false && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-line">
              <div className="p-4 rounded-2xl bg-surface2/60 border border-line space-y-3">
                <div className="font-black text-fg">✍️ تجهيز وإرسال رسالة النشرة البريدية:</div>
                <div>
                  <label className="block text-[11px] font-bold text-muted mb-1">عنوان الإيميل (Subject):</label>
                  <input type="text" value={nlSubject} onChange={e => setNlSubject(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-line font-bold" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted mb-1">كود خصم مرفق (اختياري):</label>
                  <select value={nlPromoCode} onChange={e => setNlPromoCode(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-line font-bold">
                    <option value="">بدون كود خصم</option>
                    {promoCodes.filter(p => p.active).map(p => (
                      <option key={p.id} value={p.code}>{p.code} — {p.description}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted mb-1">نص الرسالة:</label>
                  <textarea rows={4} value={nlBody} onChange={e => setNlBody(e.target.value)} className="w-full px-3 py-2 rounded-xl border border-line font-bold" />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const subs = Array.isArray(siteSettings.newsletterSubscribers) ? siteSettings.newsletterSubscribers : [];
                      const emails = subs.map(s => String(s.email || s).trim()).filter(v => v.includes('@'));
                      if (emails.length === 0) {
                        showToast('لا يوجد مشتركين ببريد إلكتروني (@) حتى الآن.', 'warning');
                        return;
                      }
                      const finalBody = `${nlBody}${nlPromoCode ? `\n\n🎁 استخدم كود الخصم: ${nlPromoCode}` : ''}\n\nتسوق الآن: ${window.location.origin}`;
                      const mailtoUrl = `mailto:?bcc=${encodeURIComponent(emails.join(','))}&subject=${encodeURIComponent(nlSubject)}&body=${encodeURIComponent(finalBody)}`;
                      window.open(mailtoUrl, '_blank');
                      showToast(`📧 تم فتح برنامج البريد لإرسال الحملة إلى (${emails.length}) مشترك ✓`, 'success');
                    }}
                    className="flex-1 py-2.5 px-4 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black shadow-md transition"
                  >
                    📧 إرسال الإيميل لجميع المشتركين الآن
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface2/60 border border-line space-y-2.5 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="font-black text-fg">📋 قائمة المشتركين المسجلين:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const manual = window.prompt('أدخل البريد الإلكتروني لإضافته للنشرة البريدية:');
                      if (!manual || !manual.trim()) return;
                      saveSiteSettingsImmediate(prev => ({
                        ...prev,
                        newsletterSubscribers: [{ id: `nl_${Date.now()}`, email: manual.trim(), joinedAt: new Date().toISOString().slice(0, 10) }, ...(Array.isArray(prev.newsletterSubscribers) ? prev.newsletterSubscribers : [])]
                      }));
                      showToast('تمت إضافة المشترك ✓', 'success');
                    }}
                    className="px-3 py-1 rounded-full bg-[#2563EB]/15 text-[#2563EB] dark:text-[#60A5FA] font-extrabold"
                  >
                    + إضافة يدوي
                  </button>
                </div>
                <div className="flex-1 max-h-56 overflow-y-auto space-y-1.5 pr-1">
                  {(!Array.isArray(siteSettings.newsletterSubscribers) || siteSettings.newsletterSubscribers.length === 0) ? (
                    <div className="py-8 text-center text-muted">لا يوجد مشتركين في النشرة البريدية حتى الآن</div>
                  ) : (
                    siteSettings.newsletterSubscribers.map((sub, sIdx) => (
                      <div key={sub.id || sIdx} className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-surface border border-line">
                        <div className="min-w-0">
                          <div className="font-bold text-fg truncate" dir="ltr">{sub.email || sub}</div>
                          {sub.joinedAt && <div className="text-[10px] text-muted">{sub.joinedAt}</div>}
                        </div>
                        <button
                          type="button"
                          onClick={() => saveSiteSettingsImmediate(prev => ({ ...prev, newsletterSubscribers: (prev.newsletterSubscribers || []).filter((_, i) => i !== sIdx) }))}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/15"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        </>
        )}
        {(adminCmsSubTab === 'home_layout' || adminCmsSubTab === 'bars_cats') && (
        <>
        {/* SECTION 6: Storefront Sections Visibility, Image Fit & Categories Management */}
        <div className="bg-surface rounded-3xl p-5 border border-line shadow-sm space-y-4">
          {renderCmsAccordionHeader(
            'sections_cats',
            '⚙️',
            '6. إعدادات أقسام الواجهة، طريقة عرض صور الكروت، وإظهار/إخفاء التصنيفات والبراندات',
            'إظهار أو إخفاء أي قسم أو تصنيف أو براند، والتحكم في عدد المنتجات في الصفحة وطريقة عرض الصور',
            'إعدادات عامة'
          )}

          {openCmsSections.sections_cats !== false && (
            <div className="space-y-4 pt-3 border-t border-line">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-muted">عرض صور المنتجات في الكروت:</span>
                {[['contain', 'كاملة بدون قص (استوديو احترافي)'], ['cover', 'تملأ المساحة بالكامل']].map(([val, label]) => {
                  const activeFit = (siteSettings.productImageFit || 'contain') === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        saveSiteSettingsImmediate(prev => ({ ...prev, productImageFit: val }));
                        setParts(prev => prev.map(p => ({ ...p, imageFit: val })));
                        showToast(`تم تفعيل وضع "${label}" لكل كروت المنتجات ✓`, 'success');
                      }}
                      className={`px-4 py-2 rounded-full border font-extrabold transition ${
                        activeFit ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-surface2 text-fg border-line'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {[
                  ['showHomeAds', 'البنرات الإعلانية العلوية (Hero Ads)'],
                  ['showHomeSourcing', 'بانر "اطلب منتجك من الخارج" بالرئيسية'],
                  ['showSearchSourcing', 'بانر "اطلب منتجك من الخارج" بصفحة البحث'],
                  ['showHomeShowcaseBars', 'بارات عرض المنتجات المميزة (Showcase Bars)'],
                  ['hideOutOfStockInStore', 'إخفاء المنتجات المنتهية (كمية 0) تلقائياً']
                ].map(([settingKey, labelTxt]) => {
                  const isBoolReverse = settingKey === 'hideOutOfStockInStore';
                  const isEnabled = isBoolReverse ? !!siteSettings[settingKey] : siteSettings[settingKey] !== false;
                  return (
                    <button
                      key={settingKey}
                      type="button"
                      onClick={() => {
                        const nextVal = isBoolReverse ? !siteSettings[settingKey] : !(siteSettings[settingKey] !== false);
                        saveSiteSettingsImmediate(prev => ({ ...prev, [settingKey]: nextVal }));
                      }}
                      className={`p-3 rounded-2xl border text-right flex items-center justify-between gap-2 font-extrabold transition ${
                        isEnabled ? 'bg-[#2563EB]/10 border-[#3B82F6]/40 text-fg' : 'bg-surface2 border-line text-muted'
                      }`}
                    >
                      <span>{labelTxt}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] ${isEnabled ? 'bg-[#2563EB] text-white' : 'bg-surface text-muted'}`}>
                        {isEnabled ? 'مفعّل ✓' : 'مغلق'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Quick Category Visibility & Pinning */}
              <div className="p-4 rounded-2xl bg-surface2/60 border border-line space-y-3">
                <div className="font-extrabold text-fg">إدارة التصنيفات (تثبيت ⭐ أو إخفاء عن العميل 🚫):</div>
                <div className="flex flex-wrap gap-2 max-h-52 overflow-y-auto p-2 bg-surface rounded-xl border border-line">
                  {Array.from(new Set([
                    ...(Array.isArray(siteSettings.customCategories) ? siteSettings.customCategories : []),
                    ...parts.map(p => p.category).filter(Boolean)
                  ])).map(catName => {
                    const hiddenCat = isCategoryHidden(catName);
                    return (
                      <div key={catName} className={`px-3 py-1.5 rounded-full border flex items-center gap-2 ${hiddenCat ? 'bg-rose-500/10 border-rose-500/40 opacity-75' : 'bg-surface2 border-line'}`}>
                        <span className="font-extrabold text-fg">{catName}</span>
                        <button
                          type="button"
                          onClick={(e) => toggleHideCategory(catName, e)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${hiddenCat ? 'bg-rose-600 text-white' : 'bg-[#2563EB]/15 text-[#2563EB] dark:text-[#60A5FA]'}`}
                        >
                          {hiddenCat ? '🚫 مخفي' : '👁️ ظاهر'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
        </>
        )}
      </div>
    );
  
}
