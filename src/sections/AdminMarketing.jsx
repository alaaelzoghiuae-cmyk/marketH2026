import { Percent, Save, Trash2 } from 'lucide-react';
import { PART_IMAGES } from '../data/constants.jsx';

export function renderAdminPromoCodes(ctx) {
  const { askConfirmDelete, handleCreatePromoCode, newPromoForm, promoCodes, pushToSupabaseCloud, renderProfitProtectionShieldCard, setNewPromoForm, setPromoCodes } = ctx;
  return (<div className="space-y-6">
      {renderProfitProtectionShieldCard()}
      <form
        onSubmit={handleCreatePromoCode}
        className="bg-surface rounded-2xl p-5 border border-line shadow-xs space-y-4"
      >
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-extrabold text-fg flex items-center gap-2">
              <Percent className="w-5 h-5 text-rose-600" />
              إنشاء وإدارة أكواد الخصم والكوبونات الذكية
            </h2>
            <button
              type="button"
              onClick={() => pushToSupabaseCloud(null, true)}
              className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
            >
              <Save className="w-4 h-4" />
              <span>حفظ وتأكيد الكوبونات في السيرفر ✓</span>
            </button>
          </div>
          <p className="text-xs text-muted mt-0.5">
            أنشئ أكواد خصم بنسبة مئوية (%)، أو مبلغ نقدي ثابت، أو توصيل مجاني/مخفض، مع تحديد الحد الأقصى لمبلغ الخصم والحد الأدنى للطلب وعدد مرات الاستخدام
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="font-bold text-muted block mb-1">كود الكوبون (Code) *</label>
            <input
              type="text"
              required
              value={newPromoForm.code}
              onChange={e => setNewPromoForm(prev => ({ ...prev, code: e.target.value }))}
              placeholder="مثال: RAMADAN15 أو FREE100"
              className="w-full p-2.5 rounded-xl border border-line font-mono uppercase font-extrabold"
            />
          </div>

          <div>
            <label className="font-bold text-muted block mb-1">نوع الخصم *</label>
            <select
              value={newPromoForm.type}
              onChange={e => setNewPromoForm(prev => ({ ...prev, type: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-line font-bold"
            >
              <option value="percentage">خصم نسبة مئوية (%)</option>
              <option value="fixed">خصم مبلغ مالي ثابت (ج.م)</option>
              <option value="free_delivery">إعفاء كامل من رسوم الدليفري (توصيل مجاني)</option>
              <option value="delivery_discount">خصم نسبة % على رسوم الدليفري</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-muted block mb-1">
              قيمة الخصم ({newPromoForm.type === 'fixed' ? 'ج.م' : '%'}):
            </label>
            <input
              type="number"
              min={0}
              disabled={newPromoForm.type === 'free_delivery'}
              value={newPromoForm.type === 'free_delivery' ? 100 : newPromoForm.value}
              onChange={e => setNewPromoForm(prev => ({ ...prev, value: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-line font-extrabold disabled:bg-surface2"
            />
          </div>

          <div>
            <label className="font-bold text-rose-500 dark:text-rose-400 block mb-1">
              الحد الأقصى لمبلغ الخصم (ج.م):
            </label>
            <input
              type="number"
              min={0}
              value={newPromoForm.maxDiscountCap}
              onChange={e => setNewPromoForm(prev => ({ ...prev, maxDiscountCap: e.target.value }))}
              placeholder="مثال: 500 ج.م أقصى خصم"
              className="w-full p-2.5 rounded-xl border border-line bg-bg font-extrabold text-fg"
            />
          </div>

          <div>
            <label className="font-bold text-muted block mb-1">الحد الأدنى لقيمة الفاتورة (ج.م):</label>
            <input
              type="number"
              min={0}
              value={newPromoForm.minOrderAmount}
              onChange={e => setNewPromoForm(prev => ({ ...prev, minOrderAmount: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-line font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-muted block mb-1">أقصى عدد مرات استخدام:</label>
            <input
              type="number"
              min={1}
              value={newPromoForm.usageLimit}
              onChange={e => setNewPromoForm(prev => ({ ...prev, usageLimit: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-line font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-muted block mb-1">تاريخ الانتهاء:</label>
            <input
              type="date"
              value={newPromoForm.expiryDate}
              onChange={e => setNewPromoForm(prev => ({ ...prev, expiryDate: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-line font-mono"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-xs"
            >
              + إنشاء وتفعيل الكوبون
            </button>
          </div>
        </div>
      </form>

      {/* Active Promo Codes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {promoCodes.map(prm => (
          <div
            key={prm.id}
            className={`bg-surface rounded-2xl p-5 border shadow-xs flex flex-col justify-between gap-3 ${
              prm.active ? 'border-line' : 'border-line opacity-60 bg-surface2'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-xl bg-rose-600 text-white font-mono font-extrabold text-sm">
                  {prm.code}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    prm.active ? 'bg-accent/15 text-accent-text border border-accent/30' : 'bg-surface2 text-muted'
                  }`}
                >
                  {prm.active ? 'فعال بالمتجر' : 'معطل'}
                </span>
              </div>

              <div className="text-xs font-extrabold text-fg">{prm.description}</div>

              <div className="grid grid-cols-2 gap-2 text-[11px] bg-surface2 p-3 rounded-xl border border-line">
                <div>
                  <label className="block text-[10px] text-muted font-bold mb-0.5">نوع الخصم:</label>
                  <select
                    value={prm.type || 'percentage'}
                    onChange={e => setPromoCodes(prev => prev.map(p => p.id === prm.id ? { ...p, type: e.target.value } : p))}
                    className="w-full px-2 py-1 rounded-lg border border-line font-bold text-[11px]"
                  >
                    <option value="percentage">نسبة (%)</option>
                    <option value="fixed">مبلغ ثابت (ج.م)</option>
                    <option value="free_delivery">شحن مجاني</option>
                    <option value="delivery_discount">خصم نسبة % على رسوم الدليفري</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-muted font-bold mb-0.5">القيمة ({prm.type === 'fixed' ? 'ج.م' : '%'}):</label>
                  <input
                    type="number"
                    min="0"
                    value={prm.value ?? 0}
                    onChange={e => setPromoCodes(prev => prev.map(p => p.id === prm.id ? { ...p, value: Number(e.target.value) || 0 } : p))}
                    className="w-full px-2 py-1 rounded-lg border border-line font-mono font-black text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-rose-500 font-bold mb-0.5">أقصى خصم (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={prm.maxDiscountCap ?? 0}
                    onChange={e => setPromoCodes(prev => prev.map(p => p.id === prm.id ? { ...p, maxDiscountCap: Number(e.target.value) || 0 } : p))}
                    className="w-full px-2 py-1 rounded-lg border border-line font-mono font-black text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-muted font-bold mb-0.5">أقل فاتورة (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={prm.minOrderAmount ?? 0}
                    onChange={e => setPromoCodes(prev => prev.map(p => p.id === prm.id ? { ...p, minOrderAmount: Number(e.target.value) || 0 } : p))}
                    className="w-full px-2 py-1 rounded-lg border border-line font-mono font-black text-[11px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-line text-xs">
              <button
                onClick={() =>
                  setPromoCodes(prev =>
                    prev.map(p => (p.id === prm.id ? { ...p, active: !p.active } : p))
                  )
                }
                className={`px-3 py-1.5 rounded-xl font-bold ${
                  prm.active
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 hover:bg-amber-200'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {prm.active ? 'إيقاف مؤقت' : 'إعادة تفعيل'}
              </button>

              <button
                onClick={() =>
                  askConfirmDelete(
                    'حذف كود الخصم',
                    `هل أنت متأكد من حذف كود الخصم "${prm.code}" نهائياً؟`,
                    () => setPromoCodes(prev => prev.filter(p => p.id !== prm.id))
                  )
                }
                className="p-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-500 hover:text-white transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>);
}

export function renderAdSeg(ctx, label, key, options) {
  const { adForm, setAdForm } = ctx;
  return (<div className="space-y-1">
      <div className="font-bold text-muted">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([val, txt]) => (
          <button
            key={String(val)}
            type="button"
            onClick={() => setAdForm(p => ({ ...p, [key]: val }))}
            className={`px-3 py-1.5 rounded-lg border font-bold ${adForm[key] === val ? 'bg-nav2 text-white border-line' : 'bg-surface text-muted border-line'}`}
          >
            {txt}
          </button>
        ))}
      </div>
    </div>);
}

export function renderAdToggle(ctx, label, key) {
  const { adForm, setAdForm } = ctx;
  return (<label className="flex items-center gap-2 font-bold text-muted cursor-pointer">
      <input
        type="checkbox"
        checked={adForm[key] !== false}
        onChange={e => setAdForm(p => ({ ...p, [key]: e.target.checked }))}
        className="w-4 h-4 accent-emerald-600"
      />
      {label}
    </label>);
}

export function renderAdminRestockAlertsView(ctx) {
  const { askConfirmDelete, formatMoney, markLocalUpsert, parts, saveSiteSettingsImmediate, sbUpsert, sendAdminRestockWhatsappToEntry, setAdminRestockWhatsappPart, setAdminTab, setParts, showToast, siteSettings } = ctx;
    const rawWaitlist = Array.isArray(siteSettings.restockWaitlist) ? siteSettings.restockWaitlist : [];
    const groupedByPartMap = new Map();

    rawWaitlist.forEach(entry => {
      if (!entry) return;
      const pid = String(entry.partId || 'unknown');
      if (!groupedByPartMap.has(pid)) {
        const foundPart = parts.find(p => String(p.id) === pid);
        groupedByPartMap.set(pid, {
          partId: pid,
          partName: entry.partName || foundPart?.name || 'منتج مطلوب',
          partSku: entry.partSku || foundPart?.sku || '',
          partObj: foundPart || null,
          entries: []
        });
      }
      groupedByPartMap.get(pid).entries.push(entry);
    });

    // Also include any part that has waitlistCount > 0 even if no individual phone row was stored yet
    parts.forEach(p => {
      const pid = String(p.id);
      if ((Number(p.waitlistCount) || 0) > 0 && !groupedByPartMap.has(pid)) {
        groupedByPartMap.set(pid, {
          partId: pid,
          partName: p.name,
          partSku: p.sku || '',
          partObj: p,
          entries: []
        });
      }
    });

    const groupedProducts = Array.from(groupedByPartMap.values()).sort(
      (a, b) => (b.entries.length || Number(b.partObj?.waitlistCount) || 0) - (a.entries.length || Number(a.partObj?.waitlistCount) || 0)
    );

    return (
      <div className="space-y-5 text-xs">
        <div className="bg-gradient-to-r from-nav via-nav2 to-nav text-white rounded-3xl p-6 border-2 border-amber-400/50 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[11px]">
              🔔 مركز تنبيهات "نبّهني عند التوفر" الموحد
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-amber-300 mt-2">
              جميع المنتجات المنتظرة وطلبات العملاء ({groupedProducts.reduce((a, g) => a + Math.max(g.entries.length, Number(g.partObj?.waitlistCount) || 0), 0)} طلب مسجل في {groupedProducts.length} منتج)
            </h2>
            <p className="text-xs text-muted mt-1">
              هنا تجد كل المنتجات التي نفدت كميتها وضغط العملاء عليها "نبّهني لما يرجع"، مع إمكانية تزويد المخزون وإرسال رسائل واتساب للعملاء بضغطة زر واحدة.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {rawWaitlist.length > 0 && (
              <button
                type="button"
                onClick={() => setAdminRestockWhatsappPart({ id: 'ALL', name: 'كل قوائم الانتظار' })}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black"
              >
                📲 إرسال واتساب جماعي لكل القائمة ({rawWaitlist.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => setAdminTab('feature_flags')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold border border-white/20"
            >
              🚀 فتح تحكم المميزات
            </button>
          </div>
        </div>

        {groupedProducts.length === 0 ? (
          <div className="bg-surface rounded-2xl p-10 border border-line text-center space-y-3">
            <div className="text-4xl">🔔</div>
            <div className="text-base font-black text-fg">لا توجد طلبات "نبّهني عند التوفر" حالياً</div>
            <p className="text-xs text-muted max-w-md mx-auto">
              عندما ينفد أي منتج (الكمية = 0) ويضغط العميل على زر "🔔 نبّهني لما يرجع" ويسجل اسمه ورقمه، سيظهر لك المنتج وبيانات العميل هنا فوراً مع تنبيه صوتي.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {groupedProducts.map(grp => {
              const pObj = grp.partObj;
              const currentStock = Number(pObj?.stock) || 0;
              const waitCount = Math.max(grp.entries.length, Number(pObj?.waitlistCount) || 0);
              return (
                <div key={grp.partId} className="bg-surface rounded-2xl p-5 border-2 border-line hover:border-amber-400/50 transition space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={pObj?.image || PART_IMAGES.screen}
                        alt={grp.partName}
                        className="w-14 h-14 rounded-xl object-contain bg-surface2 border border-line p-1 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-black text-fg">{grp.partName}</h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-black text-[11px]">
                            🔔 {waitCount} عميل منتظر
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                            currentStock > 0 ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500'
                          }`}>
                            {currentStock > 0 ? `متوفر الآن بالمخزن (${currentStock} قطعة)` : 'الكمية بالمخزن: 0 (غير متوفر)'}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted mt-1">
                          كود الصنف: <span className="font-mono font-bold">{grp.partSku || grp.partId}</span>
                          {pObj && <span> • السعر الأساسي: <b className="text-fg">{formatMoney(pObj.basePrice)}</b></span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {pObj && (
                        <button
                          type="button"
                          onClick={() => {
                            const nextStock = (Number(pObj.stock) || 0) + 10;
                            setParts(prev => prev.map(x => {
                              if (String(x.id) !== String(pObj.id)) return x;
                              const up = { ...x, stock: nextStock, soldOut: false };
                              markLocalUpsert('parts', up);
                              sbUpsert('spare_parts', up);
                              return up;
                            }));
                            showToast(`✅ تم تزويد رصيد "${pObj.name}" بـ +10 قطع (الرصيد الآن: ${nextStock})! يمكنك الآن إرسال واتساب للمنتظرين.`, 'success');
                          }}
                          className="px-3 py-2 rounded-xl bg-accent text-accent-ink font-black text-[11px]"
                        >
                          + تزويد المخزون (+10 سريع)
                        </button>
                      )}
                      {grp.entries.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setAdminRestockWhatsappPart({ id: grp.partId, name: grp.partName })}
                          className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black text-[11px]"
                        >
                          📲 مراسلة كل منتظري هذا المنتج ({grp.entries.length})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          askConfirmDelete(
                            'مسح قائمة الانتظار',
                            `هل أنت متأكد من مسح قائمة انتظار "${grp.partName}"؟ سيتم حذف كل طلبات التنبيه المسجلة لهذا المنتج.`,
                            () => {
                              saveSiteSettingsImmediate(prev => ({
                                ...prev,
                                restockWaitlist: (Array.isArray(prev.restockWaitlist) ? prev.restockWaitlist : []).filter(w => String(w.partId) !== String(grp.partId))
                              }));
                              if (pObj) {
                                setParts(prev => prev.map(x => (String(x.id) === String(pObj.id) ? { ...x, waitlistCount: 0 } : x)));
                              }
                              showToast(`تم مسح قائمة الانتظار الخاصة بـ "${grp.partName}".`, 'info');
                            }
                          );
                        }}
                        className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-500 hover:bg-rose-600 hover:text-white font-bold text-[11px]"
                      >
                        مسح القائمة
                      </button>
                    </div>
                  </div>

                  {grp.entries.length === 0 ? (
                    <div className="p-3 rounded-xl bg-surface2 text-muted font-bold">
                      يوجد عداد انتظار ({waitCount}) على هذا المنتج. الطلبات الجديدة ستظهر هنا بالاسم ورقم الواتساب والتاريخ.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {grp.entries.map(entry => (
                        <div key={entry.id} className="p-3 rounded-xl bg-surface2 border border-line flex items-center justify-between gap-2">
                          <div>
                            <div className="font-black text-fg">{entry.clientName}</div>
                            <div className="font-mono font-bold text-accent-text text-[11px]">{entry.phone}</div>
                            <div className="text-[10px] text-muted">{entry.createdAt}</div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {entry.notified && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[9px] font-bold">تم الإرسال ✓</span>
                            )}
                            <button
                              type="button"
                              onClick={() => sendAdminRestockWhatsappToEntry(entry)}
                              className="px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black text-[11px]"
                            >
                              📲 واتساب
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  
}

export function renderAdminFeatureFlagsDashboard(ctx) {
  const { SPIN_STORAGE_KEY, activeSpinPrizes, adminFamilyModelId, adminFamilyOwnerLabel, adminFamilyTargetClientId, adminFlagsSubTab, askConfirmDelete, clients, currentPeriodTotalSalesEgp, formatMoney, guestFamilyDevices, handleAdminAddClientFamilyDevice, handleBulkDisableExpensiveCashback, handleBulkEnableAffordableCashback, handleRemoveFamilyDevice, isPartCashbackEnabled, isPartPinnedToCashier, isPartVipOnly, markLocalUpsert, models, openFeatureSections, orders, parts, promoCodes, renderAdminSubTabBar, renderProfitProtectionShieldCard, repurchaseShowAllMode, saveSiteSettingsImmediate, sbUpsert, setAdminFamilyModelId, setAdminFamilyOwnerLabel, setAdminFamilyTargetClientId, setAdminFlagsSubTab, setAdminTab, setClients, setConfirmDialog, setExitIntentModalOpen, setOpenFeatureSections, setRepurchaseShowAllMode, setSpinModalOpen, setSpinRotationDeg, setSpinWheelState, setWarrantyModalOpen, showToast, siteSettings, switchPortal, toggleFeatureSection, togglePartCashierPin, triggerLiveSocialToastImmediate, useFlag } = ctx;
    const cashbackEnabledPartsCount = parts.filter(p => isPartCashbackEnabled(p)).length;
    const vipOnlyPartsCount = parts.filter(p => isPartVipOnly(p)).length;
    const pinnedCashierCount = parts.filter(p => isPartPinnedToCashier(p)).length;
    const waitlistEntries = Array.isArray(siteSettings.restockWaitlist) ? siteSettings.restockWaitlist : [];
    const totalCouponUses = Math.max(
      Number(siteSettings.analyticsCouponsUsedCount) || 0,
      promoCodes.reduce((acc, p) => acc + (Number(p.usedCount) || 0), 0)
    );
    const totalCashbackPaid = clients.reduce((acc, c) => acc + (Number(c.cashbackEarned) || 0), 0);
    const recoveredCount = Number(siteSettings.analyticsRecoveredCartsCount) || 0;
    const recoveredVal = Number(siteSettings.analyticsRecoveredCartsValue) || 0;
    const secretVipUrl = `${window.location.origin}/?vip=${encodeURIComponent(siteSettings.vipSecretToken || 'elzoghbi-vip')}`;

    const minDaysForRepurchase = repurchaseShowAllMode ? 0 : Math.max(30, (Number(siteSettings.repurchaseReminderMonths) || 6) * 30);
    const repurchaseCandidates = orders
      .filter(o => o.status === 'تم التسليم')
      .flatMap(o => {
        const cli = clients.find(c => String(c.id) === String(o.clientId));
        const phone = o.clientPhone || cli?.phone || '';
        const ordTs = Date.parse(String(o.createdAt || '').replace(' ', 'T'));
        const daysAgo = !Number.isNaN(ordTs) ? Math.max(0, Math.floor((Date.now() - ordTs) / (1000 * 60 * 60 * 24))) : 185;
        if (daysAgo < minDaysForRepurchase) return [];
        return (o.items || []).map(it => ({
          id: `${o.id}_${it.partId}`,
          orderId: o.id,
          clientName: o.clientName || cli?.name || 'عميل',
          phone,
          itemName: it.name,
          daysAgo,
          createdAt: o.createdAt
        }));
      });

    const flagSwitches = [
      { key: 'enableLiveSocialProof', icon: '🔔', title: '1. إشعارات المبيعات الحية (Live Social Proof)', desc: 'عرض إشعارات فورية للزوار بالطلبات الجديدة والمحاكاة التلقائية' },
      { key: 'enableSpinToWin', icon: '🎰', title: '2. عجلة الحظ للزوار الجدد (Spin-to-Win)', desc: 'عجلة هدايا تفاعلية تظهر مرة واحدة لكل زائر جديد وتحفظ الكوبون' },
      { key: 'enableFreeShippingBar', icon: '🚚', title: '3. شريط الشحن المجاني التفاعلي + Confetti', desc: 'حساب المبلغ المتبقي للشحن المجاني داخل السلة وتصفير الشحن تلقائياً' },
      { key: 'enableSmartCrossSell', icon: '🎁', title: '4. اقتراحات الباقات الذكية داخل السلة (Cross-Sell)', desc: 'اقتراح منتجات مكملة بخصم باقة فوري يُخصم مباشرة من الفاتورة' },
      { key: 'enableWalletCashback', icon: '💰', title: '5. نظام الكاش باك الانتقائي في المحفظة', desc: 'إضافة رصيد كاش باك للمحفظة عند تسليم الطلب فقط للمنتجات المحددة' },
      { key: 'enableQualityTiers', icon: '✨', title: '6. اختيار الجودة (أصلي / فرز أول / اقتصادي)', desc: 'عرض 3 درجات جودة بأسعار مختلفة لنفس المنتج داخل كارت المنتج' },
      { key: 'enableTrustBadges', icon: '🤝', title: '7. عناصر الثقة والاستعجال (Trust & Scarcity)', desc: 'إظهار الدفع عند الاستلام ومعاينة قبل الدفع وباقي X قطع في المخزن' },
      { key: 'enableExitIntentPopup', icon: '✋', title: '8. نافذة الخروج الذكية (بعد دخول السلة فقط)', desc: 'تظهر فقط إذا أضاف العميل منتجات للسلة وحاول الخروج من المتجر' },
      { key: 'enableBuyMoreSaveMore', icon: '🏷️', title: '9. اشتري أكتر ووفّر (خصم الكميات)', desc: 'خصم 5% عند شراء قطعتين و10% عند شراء 3 قطع أو أكثر تلقائياً' },
      { key: 'enableCashierImpulse', icon: '🛒', title: '10. رف الكاشير السريع قبل الدفع', desc: 'عرض المنتجات التي تحددها يدوياً أو الأقل من السقف السعري في السلة والدفع' },
      { key: 'enableLoyaltyTiers', icon: '🏆', title: '11. مستويات الولاء (برونزي / فضي / ذهبي / ألماسي)', desc: 'سلم ولاء حتى 20 أوردر مع كاش باك إضافي ونزول تلقائي بعد 3 شهور خمول' },
      { key: 'enableFamilySavedDevices', icon: '👨‍👩‍👧‍👦', title: '12. اختياراتي وعائلتي (إشعارات المنتجات الجديدة)', desc: 'حفظ العميل لأقسامه المفضلة وتلقي إشعار فور إضافة منتج جديد' },
      { key: 'enableRepurchaseReminders', icon: '🔄', title: '13. تذكير إعادة الشراء بعد 6 شهور عبر واتساب', desc: 'إرسال رسالة تجديد بخصم 10% للعملاء الذين اشتروا منذ 6 شهور' },
      { key: 'enableVipSecretRoute', icon: '👑', title: '14. الرابط السري لقسم الـ VIP الخاص', desc: 'إخفاء قسم VIP عن الزوار العاديين وفتحه فقط عبر الرابط السري الخاص' },
      { key: 'enableWarrantyLookup', icon: '🛡️', title: '15. فحص الضمان بالرقم وطلب استبدال', desc: 'صفحة لفحص سريان الضمان برقم الهاتف وتقديم طلب استبدال فوري' },
      { key: 'enableReferralProgram', icon: '🤝', title: '16. نظام "هات صاحبك" (لأول أوردر فقط)', desc: 'منح رصيد محفظة لصاحب الكود وصديقه فور تسليم أول أوردر، ثم تختفي الخانة' },
      { key: 'enableBirthdayAndSeasonal', icon: '🎂', title: '17. قسائم أعياد الميلاد والمواسم التلقائية', desc: 'إرسال هدية عيد الميلاد وإدارة تواريخ ميلاد العملاء وعروض المواسم' },
      { key: 'keepOutOfStockVisible', icon: '📦', title: '18. إبقاء المنتج المنتهي ظاهراً + "نبهني على واتساب"', desc: 'عدم إخفاء المنتج عند نفاد الكمية وإتاحة زر نبهني مرة واحدة لكل عميل' }
    ];

    const renderCollapsibleHeader = (secKey, icon, title, subtitle, badgeText = '') => {
      const isOpen = Boolean(openFeatureSections[secKey]);
      return (
        <div
          onClick={() => toggleFeatureSection(secKey)}
          className="flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
        >
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base">{icon}</span>
              <h3 className="text-sm sm:text-base font-black text-fg">{title}</h3>
              {badgeText && (
                <span className="px-2.5 py-0.5 rounded-full bg-accent/15 text-accent-text font-black text-[11px]">
                  {badgeText}
                </span>
              )}
            </div>
            {subtitle && <p className="text-[11px] text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleFeatureSection(secKey); }}
            className={`w-9 h-9 rounded-xl font-black text-base flex items-center justify-center border transition shrink-0 ${
              isOpen
                ? 'bg-accent text-accent-ink border-accent shadow-xs'
                : 'bg-surface2 text-fg border-line hover:border-accent'
            }`}
            title={isOpen ? 'طي القسم (−)' : 'فتح القسم (+)'}
          >
            {isOpen ? '−' : '+'}
          </button>
        </div>
      );
    };

    return (
      <div className="space-y-4 text-xs">
        {/* Top Executive Header & Live Analytics Cards */}
        <div className="bg-surface dark:bg-[#0B1224] text-fg rounded-3xl p-6 border border-[#3B82F6]/40 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[11px]">
                🚀 SUPER ADMIN FEATURE FLAGS & CRO CENTER
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#60A5FA] mt-2">
                مركز التحكم المقسّم والمنظم في جميع ميزات الموقع (اضغط + أو − لفتح أو طي أي قسم)
              </h2>
              <p className="text-xs text-muted mt-1">
                كل ميزة مقسمة في مربع مستقل قابل للطي والفتح `[ + / − ]` لسهولة التحكم في الكاش باك، رف الكاشير، أعياد الميلاد، أجهزتي وعائلتي، وتنبيهات التوفر.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setOpenFeatureSections({
                    flags: true,
                    cashback: true,
                    exit_and_sales_cap: true,
                    social_spin: true,
                    cashier_tiers: true,
                    birthday_seasonal: true,
                    family_garage: true,
                    referral_vip: true,
                    repurchase_waitlist: true
                  })
                }
                className="px-4 py-2 rounded-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black shadow-sm"
              >
                + فتح كل الأقسام
              </button>
              <button
                type="button"
                onClick={() =>
                  setOpenFeatureSections({
                    flags: false,
                    cashback: false,
                    exit_and_sales_cap: false,
                    social_spin: false,
                    cashier_tiers: false,
                    birthday_seasonal: false,
                    family_garage: false,
                    referral_vip: false,
                    repurchase_waitlist: false
                  })
                }
                className="px-4 py-2 rounded-full bg-surface2 hover:border-[#3B82F6] text-fg font-bold border border-line"
              >
                − طي كل الأقسام
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDialog({
                    title: 'تشغيل كل الميزات',
                    message: `هيتم تفعيل كل الميزات الـ ${flagSwitches.length} مرة واحدة على المتجر كله. متأكد؟`,
                    confirmText: 'أيوه، شغّل الكل',
                    onConfirm: () => {
                      const nextState = {};
                      flagSwitches.forEach(f => { nextState[f.key] = true; });
                      saveSiteSettingsImmediate(prev => ({ ...prev, ...nextState }));
                      showToast(`🚀 تم تشغيل وتفعيل جميع الميزات الـ ${flagSwitches.length} بالكامل!`, 'success');
                      setConfirmDialog(null);
                    }
                  });
                }}
                className="px-4 py-2 rounded-full bg-[#2563EB]/15 hover:bg-[#2563EB] text-[#2563EB] dark:text-[#60A5FA] hover:text-white border border-[#3B82F6]/35 font-black transition"
              >
                ✅ تشغيل كل الميزات
              </button>
              <button
                type="button"
                onClick={() => setAdminTab('restock_alerts')}
                className="px-4 py-2 rounded-full bg-surface2 hover:border-[#3B82F6] text-fg border border-line font-black transition"
              >
                🔔 صفحة نبهني عند التوفر ({waitlistEntries.length})
              </button>
            </div>
          </div>

          {/* 4 Analytics KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-surface2/80 border border-line space-y-1">
              <div className="text-[11px] text-muted font-bold">🛒 السلات المسترجعة (Recovered Carts)</div>
              <div className="text-2xl font-black text-fg">{recoveredCount} سلة</div>
              <div className="text-[11px] text-accent-text font-bold">بقيمة تقديرية: {formatMoney(recoveredVal)}</div>
            </div>
            <div className="p-4 rounded-2xl bg-surface2/80 border border-line space-y-1">
              <div className="text-[11px] text-muted font-bold">🎟️ الكوبونات المستخدمة (Coupons Used)</div>
              <div className="text-2xl font-black text-[#2563EB] dark:text-[#60A5FA]">{totalCouponUses} مرة</div>
              <div className="text-[11px] text-muted font-bold">من إجمالي {promoCodes.length} كود نشط</div>
            </div>
            <div className="p-4 rounded-2xl bg-surface2/80 border border-line space-y-1">
              <div className="text-[11px] text-muted font-bold">💰 المنتجات المفعل عليها كاش باك</div>
              <div className="text-2xl font-black text-[#60A5FA]">{cashbackEnabledPartsCount} / {parts.length}</div>
              <div className="text-[11px] text-accent-text font-bold">إجمالي كاش باك ممنوح: {formatMoney(totalCashbackPaid)}</div>
            </div>
            <div
              onClick={() => setAdminTab('restock_alerts')}
              className="p-4 rounded-2xl bg-surface2/80 hover:border-[#3B82F6] border border-line space-y-1 cursor-pointer transition"
            >
              <div className="text-[11px] text-accent-text font-bold">🔔 طلبات نبهني عند التوفر (اضغط للفتح)</div>
              <div className="text-2xl font-black text-rose-300">{waitlistEntries.length} طلب</div>
              <div className="text-[11px] text-muted font-bold">اضغط لعرض كل المنتجات المنتظرة ←</div>
            </div>
          </div>
        </div>

        {renderProfitProtectionShieldCard()}
        {/* Clean 5-Tab Navigation for the 18 Growth & Retention Tools */}
        {renderAdminSubTabBar(
          [
            { id: 'switchboard', icon: '⚡', label: 'لوحة المفاتيح السريعة (18 ميزة)', badge: '18' },
            { id: 'cashback_cap', icon: '💰', label: 'الكاش باك وحارس المبيعات' },
            { id: 'cart_tiers', icon: '🛒', label: 'درجات الجودة والكاشير والكميات' },
            { id: 'spin_social', icon: '🎡', label: 'عجلة الحظ والإشعارات الحية' },
            { id: 'loyalty_wa', icon: '👑', label: 'الولاء والـ VIP والواتساب والمواسم' }
          ],
          adminFlagsSubTab,
          setAdminFlagsSubTab
        )}

        {adminFlagsSubTab === 'switchboard' && (
        <>
        <div className="bg-surface rounded-2xl p-5 border border-line shadow-xs space-y-4">
          {renderCollapsibleHeader(
            'flags',
            '⚡',
            '1. مفاتيح التشغيل والإيقاف الفوري للميزات الـ 18 (Feature Flags)',
            'اضغط على أي مفتاح لتشغيل أو إيقاف الميزة فوراً لدى جميع الزوار',
            `${flagSwitches.filter(f => siteSettings[f.key] !== false).length} / ${flagSwitches.length} مفعّل`
          )}
          {Boolean(openFeatureSections.flags) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-line">
              {flagSwitches.map(f => {
                const isOn = siteSettings[f.key] !== false;
                return (
                  <div
                    key={f.key}
                    onClick={() => saveSiteSettingsImmediate(prev => ({ ...prev, [f.key]: !isOn }))}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-start justify-between gap-3 ${
                      isOn ? 'bg-[#2563EB]/[0.07] border-[#3B82F6]/45 shadow-2xs' : 'bg-surface2/60 border-line opacity-75'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-black text-fg flex items-center gap-1.5">
                        <span>{f.icon}</span>
                        <span>{f.title}</span>
                      </div>
                      <p className="text-[11px] text-muted leading-relaxed">{f.desc}</p>
                    </div>
                    <button
                      type="button"
                      className={`px-3 py-1 rounded-full font-black text-[10px] shrink-0 ${
                        isOn ? 'bg-[#2563EB] text-white shadow-xs' : 'bg-surface text-muted border border-line'
                      }`}
                    >
                      {isOn ? 'مفعّل ✓' : 'متوقف ✕'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        </>
        )}
        {adminFlagsSubTab === 'cashback_cap' && (
        <>
        {/* BOX 2: Cashback Control & Instant O(1) Bulk Price Guard */}
        <div className="bg-surface rounded-2xl p-5 border border-line space-y-4">
          {renderCollapsibleHeader(
            'cashback',
            '💰',
            '2. التحكم في الكاش باك الانتقائي وحماية المنتجات الغالية (سريع فوري بدون تهنيج)',
            'حدد السقف السعري واضغط للتفعيل أو الإيقاف الفوري في أقل من جزء من الثانية، أو تحكم في كل منتج من الكتالوج',
            `مفعّل على ${cashbackEnabledPartsCount} منتج`
          )}
          {Boolean(openFeatureSections.cashback) && (
            <div className="space-y-3 pt-3 border-t border-line">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-muted block mb-1">نسبة الكاش باك الافتراضية (%):</label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={siteSettings.defaultCashbackPct ?? 2}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, defaultCashbackPct: Number(e.target.value) || 2 }))}
                    className="w-full p-2.5 rounded-xl border border-line font-mono font-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">سقف سعر المنتج للكاش باك (ج.م):</label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={siteSettings.cashbackMaxPartPrice ?? 1500}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, cashbackMaxPartPrice: Number(e.target.value) || 0 }))}
                    className="w-full p-2.5 rounded-xl border border-line font-mono font-black"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    askConfirmDelete(
                      'إيقاف الكاش باك عن المنتجات الغالية',
                      `هيتم إيقاف الكاش باك عن كل منتج سعره أعلى من ${(siteSettings.cashbackMaxPartPrice || 1500).toLocaleString()} ج.م في الكتالوج كله. متأكد؟`,
                      () => handleBulkDisableExpensiveCashback(siteSettings.cashbackMaxPartPrice || 1500),
                      'نعم، نفّذ على الكل'
                    )
                  }
                  className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-sm"
                >
                  🛡️ إيقاف الكاش باك فوراً عن الأغلى من {(Number(siteSettings.cashbackMaxPartPrice) || 1500).toLocaleString()} ج.م
                </button>
                <button
                  type="button"
                  onClick={() =>
                    askConfirmDelete(
                      'تفعيل الكاش باك للمنتجات المناسبة',
                      `هيتم تفعيل الكاش باك على كل منتج سعره ${(siteSettings.cashbackMaxPartPrice || 1500).toLocaleString()} ج.م فأقل في الكتالوج كله (النسب المخصصة لكل منتج هتفضل زي ما هي). متأكد؟`,
                      () => handleBulkEnableAffordableCashback(siteSettings.cashbackMaxPartPrice || 1500),
                      'نعم، نفّذ على الكل'
                    )
                  }
                  className="py-3 px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black text-xs shadow-sm"
                >
                  ✅ تفعيل الكاش باك فوراً للأرخص من {(Number(siteSettings.cashbackMaxPartPrice) || 1500).toLocaleString()} ج.م فقط
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BOX 2B: Exit-Intent Full Customizer + 2,000,000 EGP Sales Cap Stop Guard */}
        <div className="bg-surface rounded-2xl p-5 border border-line space-y-4">
          {renderCollapsibleHeader(
            'exit_and_sales_cap',
            '✋',
            '2B. إعدادات نافذة الخروج الذكية (Exit-Intent) + حد إيقاف البيع الكلي (2,000,000 ج.م)',
            'تحكم في عنوان ونص وكود وخصم نافذة الخروج (للكمبيوتر والموبايل بعد 30 ثانية خمول)، وحد إيقاف استقبال الطلبات في السيرفر',
            `المبيعات الحالية: ${currentPeriodTotalSalesEgp.toLocaleString()} / ${(Number(siteSettings.salesCapMaxLimitEgp) || 2000000).toLocaleString()} ج.م`
          )}
          {Boolean(openFeatureSections.exit_and_sales_cap) && (
            <div className="space-y-4 pt-3 border-t border-line">
              <div className="p-4 rounded-2xl bg-surface2 border border-line space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-black text-fg text-sm flex items-center gap-2">
                    <span>✋ التحكم الكامل في نافذة الخروج الذكية (Exit-Intent):</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => useFlag('exit_intent_popup').updateFlag(!useFlag('exit_intent_popup').enabled)}
                      className={`px-3 py-1.5 rounded-xl font-black text-[11px] ${
                        useFlag('exit_intent_popup').enabled ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {useFlag('exit_intent_popup').enabled ? 'النافذة مفعّلة ✓' : 'النافذة متوقفة ✕'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExitIntentModalOpen(true);
                        switchPortal('storefront');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-[11px]"
                    >
                      👁️ معاينة النافذة الآن
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-muted block mb-1">عنوان نافذة الخروج:</label>
                    <input
                      type="text"
                      value={siteSettings.exitIntentTitle || 'استنى! قبل ما تمشي.. خد خصم فوري على سلتك 🎁'}
                      onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, exitIntentTitle: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-line font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted block mb-1">النص التوضيحي داخل النافذة:</label>
                    <input
                      type="text"
                      value={siteSettings.exitIntentSubtitle || 'لا تفوّت الفرصة! فعّل الكوبون الآن واستمتع بأفضل جودة مع معاينة قبل الدفع.'}
                      onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, exitIntentSubtitle: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-line font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="font-bold text-muted block mb-1">قيمة الخصم (%):</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={siteSettings.exitIntentDiscountPct ?? 5}
                      onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, exitIntentDiscountPct: Number(e.target.value) || 5 }))}
                      className="w-full p-2 rounded-xl border border-line font-mono font-black"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted block mb-1">كود الكوبون:</label>
                    <input
                      type="text"
                      dir="ltr"
                      value={siteSettings.exitIntentPromoCode || 'STAY5'}
                      onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, exitIntentPromoCode: e.target.value.toUpperCase() }))}
                      className="w-full p-2 rounded-xl border border-line font-mono font-black"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted block mb-1">مدة صلاحية العرض (دقيقة):</label>
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={siteSettings.exitIntentDurationMinutes ?? 15}
                      onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, exitIntentDurationMinutes: Number(e.target.value) || 15 }))}
                      className="w-full p-2 rounded-xl border border-line font-mono font-black"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted block mb-1">خمول الموبايل للظهور (ثانية):</label>
                    <input
                      type="number"
                      min="15"
                      max="180"
                      value={siteSettings.exitIntentMobileIdleSec ?? 30}
                      onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, exitIntentMobileIdleSec: Number(e.target.value) || 30 }))}
                      className="w-full p-2 rounded-xl border border-line font-mono font-black"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-black text-fg text-sm">🛑 حد "إيقاف البيع بالكامل" التلقائي في السيرفر (Sales Cap Guard):</div>
                    <p className="text-[11px] text-muted">يُحسب من إجمالي مبيعات الفترة المحددة، وعند الوصول للحد يرفض السيرفر إنشاء أي طلبات جديدة:</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => useFlag('sales_cap_guard').updateFlag(!useFlag('sales_cap_guard').enabled)}
                    className={`px-3 py-1.5 rounded-xl font-black text-[11px] ${
                      useFlag('sales_cap_guard').enabled ? 'bg-emerald-600 text-white' : 'bg-surface2 text-muted border border-line'
                    }`}
                  >
                    {useFlag('sales_cap_guard').enabled ? 'حارس حد المبيعات مفعّل ✓' : 'متوقف'}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-muted block mb-1">الحد الأقصى لإيقاف البيع (ج.م):</label>
                    <input
                      type="number"
                      step="50000"
                      value={siteSettings.salesCapMaxLimitEgp ?? 2000000}
                      onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, salesCapMaxLimitEgp: Number(e.target.value) || 2000000 }))}
                      className="w-full p-2 rounded-xl border border-line font-mono font-black"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted block mb-1">من تاريخ:</label>
                    <input
                      type="date"
                      value={siteSettings.salesCapPeriodStart || '2026-01-01'}
                      onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, salesCapPeriodStart: e.target.value }))}
                      className="w-full p-2 rounded-xl border border-line font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-muted block mb-1">إلى تاريخ:</label>
                    <input
                      type="date"
                      value={siteSettings.salesCapPeriodEnd || '2027-12-31'}
                      onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, salesCapPeriodEnd: e.target.value }))}
                      className="w-full p-2 rounded-xl border border-line font-mono font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        </>
        )}
        {adminFlagsSubTab === 'cart_tiers' && (
        <>
        {/* BOX 3: Cashier Impulse Shelf Manual Product Picker + Quality Tiers + Buy More Save More */}
        <div className="bg-surface rounded-2xl p-5 border-2 border-[#3B82F6]/45 space-y-4">
          {renderCollapsibleHeader(
            'cashier_tiers',
            '🛒',
            '3. التحكم في منتجات رف الكاشير السريع + درجات الجودة + خصم الكميات',
            'اختر المنتجات التي تظهر في رف الكاشير بنفسك أو حسب السعر، وتحكم في نسب الفرز الأول والاقتصادي',
            `${pinnedCashierCount} منتج مثبت في الكاشير`
          )}
          {Boolean(openFeatureSections.cashier_tiers) && (
            <div className="space-y-4 pt-3 border-t border-line">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div>
                  <label className="font-bold text-muted block mb-1">نظام عرض رف الكاشير:</label>
                  <select
                    value={siteSettings.cashierSelectionMode || 'manual_first'}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, cashierSelectionMode: e.target.value }))}
                    className="w-full p-2 rounded-xl border border-line font-black"
                  >
                    <option value="manual_first">المثبت يدوياً أولاً ثم الأقل سعراً</option>
                    <option value="manual_only">المنتجات المثبتة يدوياً فقط</option>
                    <option value="auto_price">تلقائي حسب السقف السعري</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">سقف رف الكاشير (ج.م):</label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    value={siteSettings.cashierMaxPrice ?? 1000}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, cashierMaxPrice: Number(e.target.value) || 1000 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">نسبة الفرز الأول (%):</label>
                  <input
                    type="number"
                    min="20"
                    max="95"
                    value={siteSettings.tierFirstClassRatio ?? 60}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, tierFirstClassRatio: Number(e.target.value) || 60 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">نسبة الاقتصادي (%):</label>
                  <input
                    type="number"
                    min="10"
                    max="90"
                    value={siteSettings.tierEconomyRatio ?? 35}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, tierEconomyRatio: Number(e.target.value) || 35 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">خصم قطعتين (%):</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={siteSettings.qtyTier2DiscountPct ?? 5}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, qtyTier2DiscountPct: Number(e.target.value) || 5 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">خصم 3 قطع+ (%):</label>
                  <input
                    type="number"
                    min="2"
                    max="60"
                    value={siteSettings.qtyTier3DiscountPct ?? 10}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, qtyTier3DiscountPct: Number(e.target.value) || 10 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
              </div>

              {/* Manual Cashier Shelf Product Selector */}
              <div className="p-3.5 rounded-2xl bg-surface2 border border-line space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-black text-fg">
                    🛒 اختر المنتجات التي تظهر للعميل في "رف الكاشير السريع" (اضغط لتثبيت أو إلغاء تثبيت أي منتج):
                  </div>
                  <span className="text-[11px] font-bold text-[#2563EB]">
                    مثبت حالياً: {pinnedCashierCount} منتج
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 rounded-xl bg-surface border border-line">
                  {parts.slice(0, 120).map(p => {
                    const pinned = isPartPinnedToCashier(p);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={(e) => togglePartCashierPin(p, e)}
                        className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition ${
                          pinned
                            ? 'bg-[#2563EB] text-slate-950 border-[#3B82F6] font-black shadow-xs'
                            : 'bg-surface2 text-muted border-line hover:text-fg'
                        }`}
                      >
                        <span>{pinned ? '🛒 مثبت ✓' : '+'}</span>
                        <span>{p.name}</span>
                        <span className="font-mono text-[10px] opacity-80">({p.basePrice} ج.م)</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        </>
        )}
        {adminFlagsSubTab === 'loyalty_wa' && (
        <>
        {/* BOX 4: Birthday Coupons & Client Birthdays Manager (Fix 6 & Fix 7) */}
        <div className="bg-surface rounded-2xl p-5 border-2 border-amber-400/50 space-y-4">
          {renderCollapsibleHeader(
            'birthday_seasonal',
            '🎂',
            '4. إدارة قسيمة عيد الميلاد وتعديل تواريخ ميلاد العملاء + عروض المواسم',
            'تحكم في كود ونسبة قسيمة عيد الميلاد، وعدّل تاريخ ميلاد أي عميل، وأرسل له هدية عيد ميلاده على واتساب بضغطة زر!',
            `كود: ${siteSettings.birthdayCouponCode || 'BDAY15'} (-${siteSettings.birthdayDiscountPct || 15}%)`
          )}
          {Boolean(openFeatureSections.birthday_seasonal) && (
            <div className="space-y-4 pt-3 border-t border-line">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-muted block mb-1">كود قسيمة عيد الميلاد:</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={siteSettings.birthdayCouponCode || 'BDAY15'}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, birthdayCouponCode: e.target.value.toUpperCase() }))}
                    className="w-full p-2.5 rounded-xl border border-line font-mono font-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">نسبة خصم قسيمة عيد الميلاد (%):</label>
                  <input
                    type="number"
                    min="1"
                    max="70"
                    value={siteSettings.birthdayDiscountPct ?? 15}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, birthdayDiscountPct: Number(e.target.value) || 15 }))}
                    className="w-full p-2.5 rounded-xl border border-line font-mono font-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">عدد أيام ظهور الهدية قبل/بعد عيد الميلاد:</label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    value={siteSettings.birthdayWindowDays ?? 3}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, birthdayWindowDays: Number(e.target.value) || 3 }))}
                    className="w-full p-2.5 rounded-xl border border-line font-mono font-black"
                  />
                </div>
              </div>

              {/* Seasonal Campaign Toggle */}
              <div className="p-3 rounded-2xl bg-surface2 border border-line flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 font-black text-fg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(siteSettings.seasonalCampaignActive)}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, seasonalCampaignActive: e.target.checked }))}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span>🌙 تفعيل بنر وكوبون الموسم العام لكل العملاء الآن:</span>
                </label>
                <input
                  type="text"
                  value={siteSettings.seasonalCampaignName || 'عروض الجمعة البيضاء والموسم 🖤'}
                  onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, seasonalCampaignName: e.target.value }))}
                  className="px-3 py-1.5 rounded-xl border border-line font-bold text-xs flex-1 min-w-[180px]"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={siteSettings.seasonalCouponCode || 'SEASON10'}
                  onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, seasonalCouponCode: e.target.value.toUpperCase() }))}
                  placeholder="SEASON10"
                  className="w-28 px-2.5 py-1.5 rounded-xl border border-line font-mono font-black text-xs"
                />
              </div>

              {/* Clients Birthday Table & 1-Click WhatsApp Coupon Sender */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-fg">🎂 جدول أعياد ميلاد العملاء وإرسال القسيمة الفورية على واتساب:</span>
                  <span className="text-[11px] text-muted">عدّل تاريخ ميلاد أي عميل مباشرة أو اضغط "إرسال قسيمة عيد الميلاد"</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto p-1">
                  {clients.map(cli => {
                    const bCode = siteSettings.birthdayCouponCode || 'BDAY15';
                    const bPct = Number(siteSettings.birthdayDiscountPct) || 15;
                    return (
                      <div key={cli.id} className="p-3 rounded-2xl bg-surface2 border border-line flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-black text-fg">{cli.name}</div>
                          <div className="text-[11px] text-muted font-mono">{cli.phone}</div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="date"
                            value={cli.birthDate || ''}
                            onChange={e => {
                              const nextDate = e.target.value;
                              setClients(prev =>
                                prev.map(c => {
                                  if (c.id !== cli.id) return c;
                                  const up = { ...c, birthDate: nextDate };
                                  markLocalUpsert('clients', up);
                                  sbUpsert('clients', up);
                                  return up;
                                })
                              );
                              showToast(`🎂 تم تحديث تاريخ ميلاد "${cli.name}" إلى ${nextDate}!`, 'success');
                            }}
                            className="px-2.5 py-1.5 rounded-xl border border-line font-mono text-[11px] font-bold"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const cleanP = String(cli.phone || '').replace(/[^0-9]/g, '');
                              const waPhone = cleanP.startsWith('0') ? `2${cleanP}` : cleanP;
                              const msg = `كل سنة وأنت طيب يا ${cli.name} بمناسبة عيد ميلادك! 🎂🎉 هدية خاصة من ${siteSettings.storeName || 'ELZOGHBI'}: قسيمة خصم ${bPct}% فوري على طلبك القادم بكود (${bCode}) 🎁. استمتع بهديتك الآن: ${window.location.origin}`;
                              window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px]"
                          >
                            📲 إرسال قسيمة عيد الميلاد
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOX 5: Family Saved Models / Interests ("أجهزتي وعائلتي") Admin Manager (Fix 7) */}
        <div className="bg-surface rounded-2xl p-5 border border-line space-y-4">
          {renderCollapsibleHeader(
            'family_garage',
            '👨‍👩‍👧‍👦',
            '5. إدارة ميزة "اختياراتي وعائلتي" في الداشبورد (الأقسام والموديلات المحفوظة للعملاء)',
            'شاهد ما حفظه كل عميل له ولعائلته، أضف قسماً لأي عميل، أو أرسل له تنبيهاً على واتساب بوصول منتج جديد لقسمه المحفوظ!',
            `${clients.reduce((s, c) => s + ((c.savedFamilyDevices || []).length), 0) + guestFamilyDevices.length} اختيار محفوظ`
          )}
          {Boolean(openFeatureSections.family_garage) && (
            <div className="space-y-4 pt-3 border-t border-line">
              {/* Quick Add Saved Model/Category to Any Client */}
              <div className="p-3.5 rounded-2xl bg-surface2 border border-line space-y-2.5">
                <div className="font-black text-fg">➕ إضافة قسم / موديل محفوظ لحساب عميل من الداشبورد:</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <select
                    value={adminFamilyTargetClientId || clients[0]?.id || ''}
                    onChange={e => setAdminFamilyTargetClientId(e.target.value)}
                    className="p-2 rounded-xl border border-line font-bold"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                    ))}
                  </select>
                  <select
                    value={adminFamilyOwnerLabel}
                    onChange={e => setAdminFamilyOwnerLabel(e.target.value)}
                    className="p-2 rounded-xl border border-line font-bold"
                  >
                    {['اختياراتي الشخصية', 'اختيارات زوجتي', 'اختيارات أخي', 'اختيارات أختي', 'اختيارات العائلة', 'احتياجات العمل / المكتب'].map(lbl => (
                      <option key={lbl} value={lbl}>{lbl}</option>
                    ))}
                  </select>
                  <select
                    value={adminFamilyModelId || models[0]?.id || ''}
                    onChange={e => setAdminFamilyModelId(e.target.value)}
                    className="p-2 rounded-xl border border-line font-bold"
                  >
                    {models.map(m => (
                      <option key={m.id} value={m.id}>{m.brand} — {m.name}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() =>
                      handleAdminAddClientFamilyDevice(
                        adminFamilyTargetClientId || clients[0]?.id,
                        adminFamilyOwnerLabel,
                        adminFamilyModelId || models[0]?.id
                      )
                    }
                    className="px-4 py-2 rounded-xl bg-accent text-accent-ink font-black"
                  >
                    + حفظ للعميل
                  </button>
                </div>
              </div>

              {/* List of All Clients' Saved Family Models & 1-Click WhatsApp New Arrival Sender */}
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {clients.map(cli => {
                  const savedList = Array.isArray(cli.savedFamilyDevices) ? cli.savedFamilyDevices : [];
                  if (savedList.length === 0) return null;
                  return (
                    <div key={cli.id} className="p-3.5 rounded-2xl bg-surface2 border border-line space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-fg">{cli.name} • <span className="font-mono text-accent-text">{cli.phone}</span></span>
                        <span className="text-[11px] text-muted">{savedList.length} اختيارات محفوظة</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {savedList.map(dev => (
                          <div key={dev.id} className="p-2.5 rounded-xl bg-surface border border-line flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-[#2563EB]/15 text-[#2563EB] font-black text-[10px]">{dev.ownerLabel}</span>
                            <span className="font-black text-fg">{dev.modelName}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const cleanP = String(cli.phone || '').replace(/[^0-9]/g, '');
                                const waPhone = cleanP.startsWith('0') ? `2${cleanP}` : cleanP;
                                const msg = `مرحباً ${cli.name} 👋، وصلنا اليوم منتج جديد مميز لقسم (${dev.modelName} — ${dev.ownerLabel}) الذي قمت بحفظه في قائمة اهتماماتك لدى ${siteSettings.storeName || 'ELZOGHBI'} 🔥! تصفحه الآن: ${window.location.origin}`;
                                window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black text-[10px]"
                            >
                              📲 إشعار واتساب بمنتج جديد
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFamilyDevice(dev.id, cli.id)}
                              className="text-rose-500 hover:underline text-[10px] font-bold"
                            >
                              حذف
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        </>
        )}
        {adminFlagsSubTab === 'spin_social' && (
        <>
        {/* BOX 6: Live Social Proof & Spin-to-Win Wheel Customizer */}
        <div className="bg-surface rounded-2xl p-5 border border-line space-y-4">
          {renderCollapsibleHeader(
            'social_spin',
            '🎰',
            '6. محرر جوائز عجلة الحظ (Spin-to-Win) + إشعارات المبيعات الحية (Live Social Proof)',
            'تحكم في نصوص وأكواد عجلة الحظ والفاصل الزمني لإشعارات المبيعات الحية وجربها فوراً',
            `${activeSpinPrizes.length} جوائز`
          )}
          {Boolean(openFeatureSections.social_spin) && (
            <div className="space-y-5 pt-3 border-t border-line">
              <div className="p-4 rounded-2xl bg-surface2 border border-line space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-black text-fg">🔔 إعدادات وتجربة إشعارات المبيعات الحية (Live Social Proof):</span>
                  <button
                    type="button"
                    onClick={() => triggerLiveSocialToastImmediate(null, true)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-cyan-400 text-slate-950 font-black text-[11px]"
                  >
                    🔔 اضغط لتجربة الإشعار أمامك الآن!
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-muted block mb-1">الفاصل الزمني (بالثواني):</label>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      value={siteSettings.socialProofIntervalSec ?? 35}
                      onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, socialProofIntervalSec: Number(e.target.value) || 35 }))}
                      className="w-full p-2 rounded-xl border border-line font-mono font-black"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="font-bold text-muted block mb-1">المدن والمحافظات التي تظهر في الإشعارات (مفصولة بفاصلة):</label>
                    <input
                      type="text"
                      value={siteSettings.socialProofCustomCities || ''}
                      onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, socialProofCustomCities: e.target.value }))}
                      className="w-full p-2 rounded-xl border border-line font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-black text-fg">🎰 محرر جوائز ونصوص عجلة الحظ:</span>
                    <div className="flex items-center gap-1.5 bg-surface2 px-3 py-1 rounded-xl border border-line">
                      <span className="text-[11px] font-bold text-muted">مدة الانتظار بين كل لفة (بالأيام):</span>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={siteSettings.spinCooldownDays ?? 7}
                        onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, spinCooldownDays: Math.max(1, Number(e.target.value) || 7) }))}
                        className="w-16 p-1 rounded-lg border border-line font-mono font-black text-center"
                      />
                      <span className="text-[11px] font-bold text-amber-500">يوم</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        window.localStorage.removeItem(SPIN_STORAGE_KEY);
                        window.sessionStorage.removeItem('elzoghbi_spin_prompted_once');
                      } catch (e) {}
                      setSpinWheelState(null);
                      setSpinRotationDeg(0);
                      setSpinModalOpen(true);
                      switchPortal('storefront');
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs"
                  >
                    🔄 تصفير العجلة وفتحها للتجربة الآن
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {activeSpinPrizes.map((prz, idx) => (
                    <div key={prz.id || idx} className="p-3.5 rounded-2xl bg-surface2 border border-line space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-fg">الخانة #{idx + 1}</span>
                        <input
                          type="color"
                          value={prz.color || '#0284c7'}
                          onChange={e => {
                            const nextPrizes = activeSpinPrizes.map((p, i) => (i === idx ? { ...p, color: e.target.value } : p));
                            saveSiteSettingsImmediate(prev => ({ ...prev, spinWheelPrizes: nextPrizes }));
                          }}
                          className="w-8 h-6 rounded cursor-pointer border border-line"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted block mb-0.5">النص المكتوب على العجلة:</label>
                        <input
                          type="text"
                          value={prz.shortLabel || ''}
                          onChange={e => {
                            const nextPrizes = activeSpinPrizes.map((p, i) => (i === idx ? { ...p, shortLabel: e.target.value, label: e.target.value } : p));
                            saveSiteSettingsImmediate(prev => ({ ...prev, spinWheelPrizes: nextPrizes }));
                          }}
                          className="w-full p-2 rounded-xl border border-line font-black"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-muted block mb-0.5">كود الكوبون:</label>
                          <input
                            type="text"
                            dir="ltr"
                            value={prz.code || ''}
                            onChange={e => {
                              const nextPrizes = activeSpinPrizes.map((p, i) => (i === idx ? { ...p, code: e.target.value.toUpperCase() } : p));
                              saveSiteSettingsImmediate(prev => ({ ...prev, spinWheelPrizes: nextPrizes }));
                            }}
                            className="w-full p-2 rounded-xl border border-line font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-muted block mb-0.5">القيمة (ج.م أو %):</label>
                          <input
                            type="number"
                            value={prz.value ?? 5}
                            onChange={e => {
                              const nextPrizes = activeSpinPrizes.map((p, i) => (i === idx ? { ...p, value: Number(e.target.value) || 0 } : p));
                              saveSiteSettingsImmediate(prev => ({ ...prev, spinWheelPrizes: nextPrizes }));
                            }}
                            className="w-full p-2 rounded-xl border border-line font-mono font-black"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        </>
        )}
        {adminFlagsSubTab === 'loyalty_wa' && (
        <>
        {/* BOX 7: Refer-a-Friend ("هات صاحبك") + Secret VIP Link + Loyalty Tiers */}
        <div className="bg-surface rounded-2xl p-5 border border-line space-y-4">
          {renderCollapsibleHeader(
            'referral_vip',
            '🤝',
            '7. تحكم "هات صاحبك" (لأول طلب فقط) + الرابط السري لـ VIP + مستويات الولاء',
            'تحديد مكافأة دعوة الصديق ونسخ الرابط السري لقسم VIP وتحديد عدد أوردرات المستوى الألماسي',
            `VIP: ${vipOnlyPartsCount} منتج`
          )}
          {Boolean(openFeatureSections.referral_vip) && (
            <div className="space-y-4 pt-3 border-t border-line">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-muted block mb-1">نوع مكافأة "هات صاحبك":</label>
                  <select
                    value={siteSettings.referralRewardType || 'fixed'}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, referralRewardType: e.target.value }))}
                    className="w-full p-2 rounded-xl border border-line font-black"
                  >
                    <option value="fixed">مبلغ ثابت (ج.م)</option>
                    <option value="percentage">نسبة مئوية من الطلب (%)</option>
                  </select>
                </div>
                {siteSettings.referralRewardType === 'percentage' ? (
                  <div>
                    <label className="font-bold text-muted block mb-1">نسبة مكافأة الإحالة (%):</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={siteSettings.referralRewardPct ?? 5}
                      onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, referralRewardPct: Number(e.target.value) || 5 }))}
                      className="w-full p-2 rounded-xl border border-line font-mono font-black"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="font-bold text-muted block mb-1">المبلغ الثابت لكل صديق (ج.م):</label>
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={siteSettings.referralRewardFixedAmount ?? 50}
                      onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, referralRewardFixedAmount: Number(e.target.value) || 50 }))}
                      className="w-full p-2 rounded-xl border border-line font-mono font-black"
                    />
                  </div>
                )}
                <div>
                  <label className="font-bold text-muted block mb-1">حد المشتريات للفضي 🥈 (ج.م) وخصمه (%):</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      step="500"
                      value={siteSettings.loyaltySilverMinSpentEgp ?? 5000}
                      onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, loyaltySilverMinSpentEgp: Number(e.target.value) || 5000 }))}
                      className="w-full p-2 rounded-xl border border-line font-mono font-black"
                      title="إجمالي المشتريات المدفوعة للوصول للفضي"
                    />
                    <input
                      type="number"
                      min="1"
                      max="25"
                      value={siteSettings.loyaltySilverDiscountPct ?? 3}
                      onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, loyaltySilverDiscountPct: Number(e.target.value) || 3 }))}
                      className="w-16 p-2 rounded-xl border border-line font-mono font-black text-center"
                      title="نسبة الخصم التلقائي في السلة (%)"
                    />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">حد المشتريات للذهبي 🥇 و VIP (ج.م) وخصمه (%):</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      step="1000"
                      value={siteSettings.loyaltyGoldMinSpentEgp ?? 15000}
                      onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, loyaltyGoldMinSpentEgp: Number(e.target.value) || 15000, vipMinSpentEgp: Number(e.target.value) || 15000 }))}
                      className="w-full p-2 rounded-xl border border-line font-mono font-black"
                      title="إجمالي المشتريات المدفوعة للوصول للذهبي وقسم VIP"
                    />
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={siteSettings.loyaltyGoldDiscountPct ?? 7}
                      onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, loyaltyGoldDiscountPct: Number(e.target.value) || 7 }))}
                      className="w-16 p-2 rounded-xl border border-line font-mono font-black text-center"
                      title="نسبة الخصم التلقائي في السلة (%)"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-400/10 border border-amber-400/40 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-amber-500">👑 الرابط السري الخاص بعملاء الـ VIP (مخفي عن الزوار العاديين):</span>
                  <button
                    type="button"
                    onClick={() => {
                      try { navigator.clipboard.writeText(secretVipUrl); } catch (e) {}
                      showToast('📋 تم نسخ رابط الـ VIP السري! يمكنك إرساله لعملائك المميزين.', 'success');
                    }}
                    className="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-[11px]"
                  >
                    📋 نسخ الرابط السري
                  </button>
                </div>
                <div dir="ltr" className="p-2 rounded-xl bg-surface border border-line font-mono text-[11px] text-fg select-all truncate">
                  {secretVipUrl}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setExitIntentModalOpen(true);
                    switchPortal('storefront');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500/15 text-rose-500 border border-rose-500/30 font-black"
                >
                  ✋ معاينة نافذة الخروج (Exit-Intent)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWarrantyModalOpen(true);
                    switchPortal('storefront');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-black"
                >
                  🛡️ معاينة صفحة فحص الضمان بالرقم
                </button>
              </div>
            </div>
          )}
        </div>

        {/* BOX 8: 6-Month Repurchase Reminder via WhatsApp */}
        <div className="bg-surface rounded-2xl p-5 border border-line space-y-4">
          {renderCollapsibleHeader(
            'repurchase_waitlist',
            '🔄',
            `8. تذكير إعادة الشراء والتجديد عبر واتساب (خصم ${siteSettings.repurchaseDiscountPct || 10}%)`,
            'فكّر العميل بتجديد المنتج الذي اشتراه بضغطة زر على واتساب مع كوبون RENEW10',
            `${repurchaseCandidates.length} مرشح`
          )}
          {Boolean(openFeatureSections.repurchase_waitlist) && siteSettings.enableRepurchaseReminders === false && (
            <div className="pt-3 border-t border-line text-center text-muted font-bold text-xs">
              ⏸️ ميزة تذكير إعادة الشراء متوقفة حالياً من مفتاح «13. تذكير إعادة الشراء» في اللوحة السريعة بالأعلى — فعّلها لعرض المرشحين وأزرار الواتساب.
            </div>
          )}
          {Boolean(openFeatureSections.repurchase_waitlist) && siteSettings.enableRepurchaseReminders !== false && (
            <div className="space-y-3 pt-3 border-t border-line">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setRepurchaseShowAllMode(prev => !prev)}
                  className="px-3 py-1.5 rounded-xl bg-surface2 border border-line font-black text-[11px]"
                >
                  {repurchaseShowAllMode ? 'الوضع الحالي: عرض كل الطلبات المسلمة للتجربة' : 'الوضع الحالي: طلبات مر عليها 6 شهور فقط'}
                </button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {repurchaseCandidates.length === 0 ? (
                  <div className="py-6 text-center text-muted font-bold">لا توجد طلبات مسلمة مطابقة حالياً.</div>
                ) : (
                  repurchaseCandidates.slice(0, 15).map(cand => (
                    <div key={cand.id} className="p-3 rounded-xl bg-surface2 border border-line flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="font-black text-fg">{cand.clientName} • <span className="text-accent-text">{cand.itemName}</span></div>
                        <div className="text-[10px] text-muted">فاتورة #{cand.orderId} • التاريخ: {cand.createdAt}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const cleanP = String(cand.phone || '01012345678').replace(/[^0-9]/g, '');
                          const waPhone = cleanP.startsWith('0') ? `2${cleanP}` : cleanP;
                          const msg = `مرحباً ${cand.clientName} 👋، "${cand.itemName}" اللي اشتريته مننا في ${siteSettings.storeName || 'ELZOGHBI'} بقاله فترة، تحب تجدده النهاردة بخصم خاص ${siteSettings.repurchaseDiscountPct || 10}% بكود (${siteSettings.repurchasePromoCode || 'RENEW10'})؟ 🎁 اطلبه الآن: ${window.location.origin}`;
                          window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black text-[11px]"
                      >
                        📲 إرسال تذكير التجديد على واتساب (-{siteSettings.repurchaseDiscountPct || 10}%)
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        </>
        )}
      </div>
    );
  
}
