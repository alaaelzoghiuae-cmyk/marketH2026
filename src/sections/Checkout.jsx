import { Lock, ChevronLeft, MapPin, Wallet, CreditCard, CheckCircle2, Minus, Plus, Trash2 } from 'lucide-react';
import { getPaymentMethods } from '../lib/utils.jsx';
import { CREDIT_PAYMENT_ID } from '../data/constants.jsx';

export function renderCheckoutView(ctx) {
  const { appliedPromo, appliedReferralClient, cartSummary, checkoutAddressChoice, currentClient, customAddressText, formatMoney, handleApplyReferralCode, handlePlaceOrder, hasClientAlreadyUsedReferral, orderNotes, paymentMethod, placingOrder, promoCodeInput, promoCodes, referralCodeInput, renderCashierImpulseShelf, renderFreeShippingProgressBar, renderSmartCrossSellBundles, setAppliedPromo, setAppliedReferralClient, setCart, setCheckoutAddressChoice, setClientTab, setCustomAddressText, setLoginModalOpen, setOrderNotes, setPaymentMethod, setPromoCodeInput, setReferralCodeInput, setUseWalletBalance, showToast, siteSettings, updateCartQty, useFlag, useWalletBalance } = ctx;
    if (!currentClient) {
      return (
        <div className="max-w-xl mx-auto my-12 bg-surface p-8 rounded-2xl border border-line text-center space-y-4">
          <Lock className="w-12 h-12 text-blue-600 mx-auto" />
          <h2 className="text-lg font-extrabold text-fg">
            سجّل دخولك الأول عشان تكمّل الطلب وتشوف أسعار مجموعتك
          </h2>
          <p className="text-xs text-muted">
            أول ما تدخل بحساب التاجر، أسعار السلة وعملتها هتتغيّر لوحدها على حسب شريحة الخصم بتاعتك.
          </p>
          <button
            onClick={() => setLoginModalOpen(true)}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold"
          >
            سجّل دخول دلوقتي
          </button>
        </div>
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-fg">
              كمّل الطلب وادفع — {currentClient.name}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              راجع عنوان التوصيل واختار طريقة الدفع وابعت الطلب للمخزن
            </p>
          </div>
          <button
            onClick={() => setClientTab('store')}
            className="px-3.5 py-2 rounded-xl bg-surface2 hover:bg-surface2 text-muted text-xs font-bold flex items-center gap-1"
          >
            ارجع ضيف قطع تانية
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Right 2 Columns: Address, Notes, Wallet & Payment */}
          <div className="lg:col-span-2 space-y-5">
            {/* 1. Saved Shop Address */}
            <div className="bg-surface rounded-2xl p-5 border border-line space-y-3">
              <h3 className="text-sm font-extrabold text-fg flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                1. عنوان توصيل الطلب (عناوين المحل المسجّلة)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label
                  onClick={() => setCheckoutAddressChoice('primary')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    checkoutAddressChoice === 'primary'
                      ? 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
                      : 'border-line hover:bg-surface2'
                  }`}
                >
                  <div className="text-xs font-bold text-fg">العنوان الأساسي للمحل</div>
                  <div className="text-xs text-muted mt-1">{currentClient.address}</div>
                </label>

                <label
                  onClick={() => setCheckoutAddressChoice('secondary')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    checkoutAddressChoice === 'secondary'
                      ? 'border-slate-500 bg-slate-500/10 ring-2 ring-slate-500/20'
                      : 'border-line hover:bg-surface2'
                  }`}
                >
                  <div className="text-xs font-bold text-fg">عنوان الفرع الثاني</div>
                  <div className="text-xs text-muted mt-1">{currentClient.secondaryAddress}</div>
                </label>
              </div>

              <button
                onClick={() => setCheckoutAddressChoice('custom')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                + وصّل لعنوان تاني للفاتورة دي بس
              </button>

              {checkoutAddressChoice === 'custom' && (
                <input
                  type="text"
                  value={customAddressText}
                  onChange={e => setCustomAddressText(e.target.value)}
                  placeholder="اكتب العنوان بالتفصيل ورقم تليفون اللي هيستلم..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line text-xs"
                />
              )}
            </div>

            {/* 2. Wallet & Credit Limit Status */}
            <div className="bg-surface rounded-2xl p-5 border border-line space-y-3">
              <h3 className="text-sm font-extrabold text-fg flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                2. حالة المحفظة والآجل (ليك / عليك)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-surface2 p-3.5 rounded-xl border border-line text-xs">
                <div>
                  <span className="text-muted block">رصيد حسابك دلوقتي:</span>
                  <span
                    className={`text-sm font-extrabold ${
                      currentClient.walletBalance >= 0 ? 'text-accent-text' : 'text-rose-500 dark:text-rose-400'
                    }`}
                  >
                    {currentClient.walletBalance >= 0 ? 'دائن (ليك): ' : 'مدين (عليك): '}
                    {formatMoney(Math.abs(currentClient.walletBalance))}
                  </span>
                </div>
                <div>
                  <span className="text-muted block">سقف الآجل المسموح:</span>
                  <span className="text-sm font-extrabold text-fg">
                    {formatMoney(currentClient.creditLimit)}
                  </span>
                </div>
                <div>
                  <span className="text-muted block">المتاح تسحبه آجل:</span>
                  <span className="text-sm font-extrabold text-accent-text">
                    {formatMoney(cartSummary.remainingCreditLimitBase)}
                  </span>
                </div>
              </div>

              {currentClient.walletBalance > 0 && (
                <label className="flex items-center justify-between p-3 rounded-xl bg-accent/10 border border-accent/30 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={useWalletBalance}
                      onChange={e => setUseWalletBalance(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600"
                    />
                    <span className="text-xs font-bold text-fg">
                      استخدم رصيدك الدائن في المحفظة ({formatMoney(currentClient.walletBalance)}) واخصمه من الفاتورة
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-accent-text">
                    -{formatMoney(cartSummary.walletDeductedBase)}
                  </span>
                </label>
              )}
            </div>

            {/* 3. Payment Methods */}
            <div className="bg-surface rounded-2xl p-5 border border-line space-y-3">
              <h3 className="text-sm font-extrabold text-fg flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-slate-600" />
                3. طريقة الدفع
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {getPaymentMethods(siteSettings)
                  .filter(m => m.enabled)
                  .map(m => ({
                    id: m.id,
                    label: m.label || m.id,
                    desc:
                      m.id === CREDIT_PAYMENT_ID
                        ? cartSummary.canOrderOnCredit
                          ? m.desc
                          : 'مش متاح: الفاتورة أكبر من سقف الآجل المتبقي'
                        : m.desc,
                    disabled: m.id === CREDIT_PAYMENT_ID && !cartSummary.canOrderOnCredit
                  }))
                  .map(pm => {
                  // Distinct accent per payment kind (owner: checkout options
                  // were all one color) — used for the selected ring/border
                  // and a permanent color dot next to the label.
                  const pmId = String(pm.id || '').toLowerCase();
                  const pmAccent =
                    pmId.includes('cod') || pmId.includes('cash') || pmId.includes('عند الاستلام')
                      ? { sel: 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/25', dot: 'bg-emerald-500', check: 'text-emerald-500' }
                      : pmId.includes('wallet') || pmId.includes('محفظة')
                      ? { sel: 'border-slate-500 bg-slate-500/10 ring-2 ring-slate-500/25', dot: 'bg-slate-500', check: 'text-slate-500' }
                      : pmId.includes('credit') || pmId.includes('آجل') || pmId.includes('اجل')
                      ? { sel: 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/25', dot: 'bg-amber-500', check: 'text-amber-500' }
                      : pmId.includes('bank') || pmId.includes('transfer') || pmId.includes('insta') || pmId.includes('تحويل')
                      ? { sel: 'border-slate-500 bg-slate-500/10 ring-2 ring-slate-500/25', dot: 'bg-slate-500', check: 'text-slate-500' }
                      : pmId.includes('card') || pmId.includes('visa') || pmId.includes('كارت')
                      ? { sel: 'border-slate-500 bg-slate-500/10 ring-2 ring-slate-500/25', dot: 'bg-slate-500', check: 'text-slate-500' }
                      : { sel: 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/25', dot: 'bg-blue-500', check: 'text-blue-500' };
                  return (
                  <button
                    key={pm.id}
                    disabled={pm.disabled}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`p-3.5 rounded-xl border text-right transition flex flex-col justify-between ${
                      pm.disabled
                        ? 'bg-surface2 border-line opacity-50 cursor-not-allowed'
                        : paymentMethod === pm.id
                        ? pmAccent.sel
                        : 'border-line hover:bg-surface2'
                    }`}
                  >
                    <div className="font-extrabold text-fg flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${pmAccent.dot}`} />
                        {pm.label}
                      </span>
                      {paymentMethod === pm.id && <CheckCircle2 className={`w-4 h-4 ${pmAccent.check}`} />}
                    </div>
                    <div className="text-[11px] text-muted mt-1">{pm.desc}</div>
                  </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Order Notes */}
            <div className="bg-surface rounded-2xl p-5 border border-line space-y-2">
              <label className="text-xs font-extrabold text-fg block">
                4. ملاحظات على الفاتورة أو تعليمات التغليف للمخزن:
              </label>
              <textarea
                rows={2}
                value={orderNotes}
                onChange={e => setOrderNotes(e.target.value)}
                placeholder="مثلاً: ابعتلي لزق وتربروف مع الشاشات، أو كلّمني قبل ما المندوب يوصل بنص ساعة..."
                className="w-full p-3 rounded-xl border border-line text-xs"
              />
            </div>
          </div>

          {/* Left Column: Invoice Summary & Promo Code */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-surface rounded-2xl p-5 border border-line shadow-sm space-y-4 sticky top-28">
              <h3 className="text-sm font-extrabold text-fg border-b border-line pb-3 flex items-center justify-between">
                <span>ملخص الفاتورة ({cartSummary.totalQty} قطع)</span>
                {siteSettings.enableTrustBadges !== false && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-black">
                    👁️ معاينة قبل الدفع
                  </span>
                )}
              </h3>

              {renderFreeShippingProgressBar()}

              <div className="space-y-2.5 max-h-60 overflow-y-auto pl-1">
                {cartSummary.items.map(item => (
                  <div
                    key={item.part.id}
                    className="flex items-center justify-between gap-2 text-xs border-b border-line pb-2"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-fg">{item.part.name}</div>
                      <div className="text-[11px] text-muted">
                        الكمية: {item.qty} × {formatMoney(item.priceInfo.baseEgpPrice)} ({item.color})
                      </div>
                      {/* Owner request: the customer can adjust or remove
                          items right from the checkout summary. */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <button
                          type="button"
                          title="قلّل الكمية"
                          onClick={() => {
                            const pid = item.part.id;
                            setCart(prev => {
                              const cur = prev[pid];
                              if (!cur) return prev;
                              const nq = (Number(cur.qty) || 1) - 1;
                              if (nq <= 0) {
                                const { [pid]: _removed, ...rest } = prev;
                                return rest;
                              }
                              return { ...prev, [pid]: { ...cur, qty: nq } };
                            });
                          }}
                          className="w-6 h-6 rounded-lg bg-surface2 border border-line text-fg font-black flex items-center justify-center hover:bg-surface"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-black text-fg min-w-[1.25rem] text-center">{item.qty}</span>
                        <button
                          type="button"
                          title="زوّد الكمية"
                          onClick={() => updateCartQty(item.part.id, 1)}
                          className="w-6 h-6 rounded-lg bg-surface2 border border-line text-fg font-black flex items-center justify-center hover:bg-surface"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="امسح المنتج من الفاتورة"
                          onClick={() => {
                            const pid = item.part.id;
                            setCart(prev => {
                              const { [pid]: _removed, ...rest } = prev;
                              return rest;
                            });
                          }}
                          className="h-6 px-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 font-black flex items-center gap-1 hover:bg-rose-500/20 mr-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          مسح
                        </button>
                      </div>
                    </div>
                    <div className="font-extrabold text-fg shrink-0">
                      {formatMoney(item.lineTotalBase)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code Engine (Percentage, Fixed Amount, Free/Discounted Delivery, Max Cap) */}
              <div className="space-y-2 pt-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCodeInput}
                    onChange={e => setPromoCodeInput(e.target.value)}
                    placeholder="كود خصم (مثال: VIP5 أو CASH200 أو FREESHIP)"
                    className="flex-1 px-3 py-2 rounded-xl border border-line text-xs font-mono uppercase font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!currentClient) {
                        showToast('⚠️ لازم تسجّل دخول برقم تليفونك أو حسابك الأول قبل استخدام أي كوبون أو هدية!', 'warning');
                        setLoginModalOpen(true);
                        return;
                      }
                      const codeClean = promoCodeInput.trim().toUpperCase();
                      const foundPromo = promoCodes.find(
                        p => p.code.toUpperCase() === codeClean && p.active
                      );
                      if (!foundPromo) {
                        showToast('كود الخصم مش صالح أو غير مفعّل!', 'warning');
                        return;
                      }
                      if (foundPromo.sourceFeature && foundPromo.sourceFeature !== 'admin' && !useFlag(foundPromo.sourceFeature).enabled) {
                        showToast('الميزة الخاصة بهذا الكوبون متوقفة حالياً من الإدارة.', 'error');
                        return;
                      }
                      const todayStr = new Date().toISOString().slice(0, 10);
                      if (foundPromo.expiryDate && foundPromo.expiryDate < todayStr) {
                        showToast(`كود الخصم (${foundPromo.code}) انتهت صلاحيته يوم ${foundPromo.expiryDate}.`, 'error');
                        return;
                      }
                      if (Number(foundPromo.usedCount || 0) >= Number(foundPromo.usageLimit || 10000)) {
                        showToast('معلش، الكود ده وصل للحد الأقصى من مرات الاستخدام الكلي.', 'warning');
                        return;
                      }
                      if (foundPromo.assignedUserId && String(foundPromo.assignedUserId) !== String(currentClient.id) && String(foundPromo.assignedUserId) !== String(currentClient.phone)) {
                        showToast('هذا الكوبون مسجل باسم مستخدم آخر ولا يمكن استخدامه على حسابك.', 'error');
                        return;
                      }
                      const redemptionsList = Array.isArray(siteSettings.couponRedemptions) ? siteSettings.couponRedemptions : [];
                      const userUsesCount = redemptionsList.filter(
                        r => (r.couponId === foundPromo.id || r.couponCode === foundPromo.code) &&
                             (String(r.userId) === String(currentClient.id) || String(r.userId) === String(currentClient.phone))
                      ).length;
                      const maxPerUser = Math.max(1, Number(foundPromo.maxUsesPerUser) || 1);
                      if (userUsesCount >= maxPerUser) {
                        showToast(`لقد استخدمت الكوبون (${foundPromo.code}) من قبل، وهو مخصص للاستخدام (${maxPerUser}) مرة فقط لكل عميل!`, 'error');
                        return;
                      }
                      if (cartSummary.subtotalBase < Number(foundPromo.minOrderAmount || 0)) {
                        showToast(
                          `أقل فاتورة عشان الكود يشتغل (${foundPromo.code}) هو ${formatMoney(foundPromo.minOrderAmount)}`,
                          'warning'
                        );
                        return;
                      }
                      setAppliedPromo(foundPromo);
                      showToast(`فعّلنا كود الخصم (${foundPromo.code}): ${foundPromo.description}`, 'success');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-nav2 hover:bg-nav2 text-white text-xs font-bold"
                  >
                    تطبيق
                  </button>
                </div>

                {appliedPromo && (
                  <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-between text-[11px] text-fg font-bold">
                    <span>✓ مفعل: {appliedPromo.code} ({appliedPromo.description})</span>
                    <button
                      type="button"
                      onClick={() => setAppliedPromo(null)}
                      className="text-rose-600 hover:underline"
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>

              {/* Refer-a-Friend ("هات صاحبك") Code Input inside Checkout — ONLY shown on the customer's very first order! */}
              {siteSettings.enableReferralProgram !== false && !hasClientAlreadyUsedReferral && (
                <div className="space-y-1.5 pt-1 border-t border-line">
                  <label className="text-[11px] font-extrabold text-fg flex items-center gap-1">
                    <span>🤝 كود دعوة صديق ("هات صاحبك" — مكافأة في المحفظة لك ولصديقك):</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralCodeInput}
                      onChange={e => setReferralCodeInput(e.target.value)}
                      placeholder="مثال: REF-10123 أو رقم موبايل صديقك..."
                      className="flex-1 px-3 py-2 rounded-xl border border-line text-xs font-mono uppercase font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyReferralCode(referralCodeInput)}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black"
                    >
                      ربط الدعوة
                    </button>
                  </div>
                  {appliedReferralClient && (
                    <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                      <span>✓ مرتبط بدعوة صديقك: {appliedReferralClient.name}</span>
                      <button type="button" onClick={() => setAppliedReferralClient(null)} className="text-rose-500 underline">إلغاء</button>
                    </div>
                  )}
                </div>
              )}

              {/* Financial Breakdown */}
              <div className="space-y-2 text-xs pt-2 border-t border-line">
                {(cartSummary.bundleDiscountTotalBase > 0 || cartSummary.qtyDiscountTotalBase > 0) && (
                  <div className="flex justify-between text-muted">
                    <span>إجمالي الأصناف قبل خصم الباقات والكميات:</span>
                    <span className="font-mono line-through">{formatMoney(cartSummary.subtotalBeforeItemDiscountsBase)}</span>
                  </div>
                )}
                {cartSummary.bundleDiscountTotalBase > 0 && (
                  <div className="flex justify-between text-amber-600 dark:text-amber-400 font-extrabold">
                    <span>🎁 خصم الباقة الذكية المقترحة:</span>
                    <span>-{formatMoney(cartSummary.bundleDiscountTotalBase)}</span>
                  </div>
                )}
                {cartSummary.qtyDiscountTotalBase > 0 && (
                  <div className="flex justify-between text-[#163B6B] dark:text-[#2F6BB3] font-extrabold">
                    <span>🏷️ خصم الكميات (اشتري أكتر ووفّر):</span>
                    <span>-{formatMoney(cartSummary.qtyDiscountTotalBase)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted">
                  <span>صافي قيمة الأصناف:</span>
                  <span className="font-bold">{formatMoney(cartSummary.subtotalBase)}</span>
                </div>
                {cartSummary.discountBase > 0 && (
                  <>
                    {Math.min(cartSummary.loyaltyAutoDiscountBase || 0, cartSummary.discountBase) > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>🏆 خصم الولاء التلقائي:</span>
                        <span>-{formatMoney(Math.min(cartSummary.loyaltyAutoDiscountBase || 0, cartSummary.discountBase))}</span>
                      </div>
                    )}
                    {cartSummary.discountBase - Math.min(cartSummary.loyaltyAutoDiscountBase || 0, cartSummary.discountBase) > 0 && (
                      <div className="flex justify-between text-emerald-600 font-bold">
                        <span>كوبون الخصم{appliedPromo?.code ? ` (${appliedPromo.code})` : ''}:</span>
                        <span>-{formatMoney(cartSummary.discountBase - Math.min(cartSummary.loyaltyAutoDiscountBase || 0, cartSummary.discountBase))}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex justify-between text-muted">
                  <span>مصاريف التوصيل السريع:</span>
                  <span className="font-bold">{cartSummary.deliveryFeeBase === 0 ? 'مجاني (0 ج.م) 🎉' : formatMoney(cartSummary.deliveryFeeBase)}</span>
                </div>
                {cartSummary.walletDeductedBase > 0 && (
                  <div className="flex justify-between text-accent-text font-bold">
                    <span>متخصوم من رصيد المحفظة:</span>
                    <span>-{formatMoney(cartSummary.walletDeductedBase)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-fg pt-2 border-t border-line">
                  <span>الصافي اللي هتدفعه:</span>
                  <span className="text-blue-600">{formatMoney(cartSummary.finalPayableBase)}</span>
                </div>
                {cartSummary.expectedCashbackBase > 0 && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                    <span>💰 مكافأة كاش باك تضاف لمحفظتك فور الاستلام:</span>
                    <span>+{formatMoney(cartSummary.expectedCashbackBase)}</span>
                  </div>
                )}
              </div>

              {renderSmartCrossSellBundles()}
              {renderCashierImpulseShelf()}

              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder}
                className="w-full py-3.5 rounded-xl bg-[#1E4E8C] hover:bg-[#163B6B] text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                أكّد وابعت الطلب
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  
}
