import { Trash2, X, Sparkles, Bell, Shield, Lock, CheckCircle2, AlertTriangle, User, Building2, Check } from 'lucide-react';
import { DEFAULT_REGISTRATION_TERMS, DEFAULT_REGISTRATION_TERMS_EN, PART_IMAGES } from '../data/constants.jsx';
import { normalizeDigits } from '../lib/utils.jsx';
import { PasswordInput } from '../components/widgets.jsx';

export function renderConfirmDialogModal(ctx) {
  const { confirmDialog, setConfirmDialog } = ctx;
    if (!confirmDialog) return null;
    return (
      <div className="fixed inset-0 bg-nav backdrop-blur-xs z-[70] flex items-center justify-center p-4">
        <div className="bg-surface rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-line animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-fg">{confirmDialog.title}</h3>
              <p className="text-xs text-muted mt-0.5">أكّد عشان تكمّل، الإجراء ده نهائي.</p>
            </div>
          </div>
          <div className="p-3.5 bg-surface2 rounded-2xl border border-line text-xs font-bold text-muted leading-relaxed">
            {confirmDialog.message}
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={confirmDialog.onConfirm}
              className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>{confirmDialog.confirmText}</span>
            </button>
            <button
              type="button"
              onClick={() => setConfirmDialog(null)}
              className="py-3 px-5 rounded-xl bg-surface2 hover:bg-surface2 text-muted font-extrabold text-xs transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    );
  
}

export function renderSpinToWinModal(ctx) {
  const { activeSpinPrizes, applySpinPrizePromo, currentClient, handleSpinTheWheel, isSpinningWheel, setSpinContactInput, setSpinModalOpen, siteSettings, spinContactInput, spinCooldownMessage, spinModalOpen, spinRotationDeg, spinWheelState } = ctx;
    if (!spinModalOpen || siteSettings.enableSpinToWin === false) return null;
    const slicesCount = activeSpinPrizes.length;
    const sliceDeg = 360 / slicesCount;

    return (
      <div className="fixed inset-0 bg-nav/85 backdrop-blur-xs z-[160] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-surface rounded-3xl max-w-lg w-full p-5 sm:p-6 border-2 border-[#0071E3] shadow-2xl space-y-4 text-center relative my-auto">
          <button
            type="button"
            onClick={() => setSpinModalOpen(false)}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-surface2 text-muted hover:text-fg flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>هدية الزوار الجدد من {siteSettings.storeName || 'ELZOGHBI'}</span>
            </span>
            <h3 className="text-lg sm:text-xl font-black text-fg pt-1">
              {siteSettings.spinWheelTitle || '🎁 لف عجلة الحظ واكسب هديتك الفورية!'}
            </h3>
            <p className="text-xs text-muted font-bold">
              {siteSettings.spinWheelSubtitle || 'فرصة حقيقية لكل زائر: شحن مجاني، خصم فوري، أو هدية مجانية!'}
            </p>
          </div>

          {/* Large 310x310 High-Clarity SVG Wheel */}
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto flex items-center justify-center">
            {/* Top Pointer Arrow */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-[#0071E3] drop-shadow-lg" />

            <div
              className="w-full h-full rounded-full border-[6px] border-[#0071E3] shadow-[0_0_30px_rgba(37,99,235,0.4)] relative overflow-hidden"
              style={{
                transform: `rotate(${spinRotationDeg}deg)`,
                transition: isSpinningWheel ? 'transform 4s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                background: `conic-gradient(${activeSpinPrizes
                  .map((p, idx) => `${p.color || '#1e4e8c'} ${idx * sliceDeg}deg ${(idx + 1) * sliceDeg}deg`)
                  .join(', ')})`
              }}
            >
              {/* Divider Lines & Crisp Radial Labels */}
              {activeSpinPrizes.map((prz, idx) => {
                const midAngle = idx * sliceDeg + sliceDeg / 2;
                return (
                  <div
                    key={prz.id || idx}
                    className="absolute inset-0 pointer-events-none flex items-center justify-center"
                    style={{ transform: `rotate(${midAngle}deg)` }}
                  >
                    <div
                      className="px-2.5 py-1 rounded-full bg-slate-950/75 border border-white/30 text-white font-black text-xs sm:text-[13px] tracking-wide shadow-md whitespace-nowrap"
                      style={{ transform: 'translateY(-92px)' }}
                    >
                      {prz.shortLabel || prz.label}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              disabled={isSpinningWheel || Boolean(spinWheelState?.spun)}
              onClick={handleSpinTheWheel}
              className="absolute w-20 h-20 rounded-full bg-[#1D1D1F] border-4 border-[#0071E3] text-white font-black text-sm shadow-2xl flex items-center justify-center z-10 hover:scale-105 transition disabled:opacity-80"
            >
              {isSpinningWheel ? '🎰...' : spinWheelState?.spun ? '✓ مبروك' : 'لفّ الآن'}
            </button>
          </div>

          {/* Mandatory Phone/Email Input for Visitors Before Spinning + 7-Day Cooldown Notice */}
          {!currentClient && !spinWheelState?.spun && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-right space-y-1.5">
              <label className="text-[11px] font-black text-fg block">
                📱 سجّل رقم موبايلك أو إيميلك الأول عشان الكوبون يتسجل باسمك (لفة واحدة كل {siteSettings.spinCooldownDays || 7} أيام):
              </label>
              <input
                type="text"
                dir="ltr"
                value={spinContactInput}
                onChange={e => setSpinContactInput(e.target.value)}
                placeholder="01012345678 أو email@example.com"
                className="w-full p-2.5 rounded-xl border border-line font-mono font-black text-xs text-center"
              />
            </div>
          )}

          {spinCooldownMessage && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 font-black text-xs">
              ⏳ {spinCooldownMessage} (صلاحية الكوبون {siteSettings.spinCooldownDays || 7} أيام ويُستخدم مرة واحدة)
            </div>
          )}

          {/* Clear Prize Legend Chips so customer can read every single option clearly */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-[11px]">
            {activeSpinPrizes.map((prz, idx) => (
              <div
                key={prz.id || idx}
                className="px-2.5 py-1.5 rounded-xl bg-surface2 border border-line font-extrabold text-fg flex items-center gap-1.5 justify-center"
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: prz.color || '#1e4e8c' }} />
                <span className="truncate">{prz.label}</span>
              </div>
            ))}
          </div>

          {spinWheelState?.spun && spinWheelState?.prize ? (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-line space-y-2.5">
              <div className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                🎉 جائزتك المحفوظة: {spinWheelState.prize.label}
              </div>
              <div className="text-xs text-fg font-bold">
                كود الجائزة المفعّل: <span className="font-mono font-black px-2.5 py-1 rounded-lg bg-surface border border-line text-sm">{spinWheelState.prize.code}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  applySpinPrizePromo(spinWheelState.prize, false);
                  setSpinModalOpen(false);
                }}
                className="w-full py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs sm:text-sm font-black shadow-md"
              >
                تفعيل الجائزة ومتابعة التسوق ✓
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={isSpinningWheel}
              onClick={handleSpinTheWheel}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#0071E3] to-[#0077ED] hover:from-[#0071E3] hover:to-[#0071E3] text-white font-black text-sm sm:text-base shadow-lg shadow-blue-600/30 transition"
            >
              {isSpinningWheel ? 'جاري لف العجلة... 🎰' : '🎰 اضغط للف العجلة وربح هديتك الآن!'}
            </button>
          )}
        </div>
      </div>
    );
  
}

export function renderFloatingSpinTrigger(ctx) {
  const { appPortal, setSpinModalOpen, siteSettings, spinWheelState } = ctx;
    if (appPortal === 'admin' || siteSettings.enableSpinToWin === false) return null;
    return (
      <button
        type="button"
        onClick={() => setSpinModalOpen(true)}
        className="fixed bottom-6 right-5 z-40 px-5 py-3 rounded-full bg-gradient-to-r from-[#1D1D1F] via-[#0077ED] to-[#0071E3] text-white font-black text-xs shadow-2xl border border-[#2997FF]/60 flex items-center gap-2 hover:scale-105 transition"
        title="عجلة الحظ وهدايا الزوار الجدد"
      >
        <span>🎁</span>
        <span>{spinWheelState?.spun ? `هديتك: ${spinWheelState.prize?.shortLabel}` : 'لف العجلة واكسب!'}</span>
      </button>
    );
  
}

export function renderLiveSocialProofToast(ctx) {
  const { appPortal, liveSocialToast, parts, setDetailImageIdx, setLiveSocialToast, setSelectedDetailItem, siteSettings } = ctx;
    if (!liveSocialToast || siteSettings.enableLiveSocialProof === false) return null;
    if (appPortal === 'admin' && !liveSocialToast.forceShowInAdmin) return null;

    return (
      <div className="fixed bottom-20 right-4 z-[220] max-w-xs sm:max-w-sm w-full px-2 animate-bounce">
        <div
          onClick={() => {
            if (liveSocialToast.partId && appPortal !== 'admin') {
              const targetP = parts.find(p => String(p.id) === String(liveSocialToast.partId));
              if (targetP) {
                setDetailImageIdx(0);
                setSelectedDetailItem({ type: 'part', part: targetP });
              }
            }
            setLiveSocialToast(null);
          }}
          className="p-3.5 rounded-2xl bg-nav text-nav-fg border-2 border-nav-cyan shadow-2xl flex items-center gap-3 cursor-pointer"
        >
          <img
            src={liveSocialToast.productImage || PART_IMAGES.screen}
            alt={liveSocialToast.productName}
            loading="lazy"
            onError={e => { e.currentTarget.src = PART_IMAGES.screen; }}
            className="w-12 h-12 rounded-xl object-contain bg-nav2 border border-navline p-1 shrink-0"
          />
          <div className="min-w-0 flex-1 text-right">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-black text-nav-cyan flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>اشترى الآن من {siteSettings.storeName || 'ELZOGHBI'}</span>
              </span>
              <span className="text-[9px] text-nav-fg/70 font-bold">{liveSocialToast.timeLabel}</span>
            </div>
            <div className="text-xs font-extrabold text-white truncate mt-0.5">
              عميل ({liveSocialToast.customerInitial || 'أ.'}) من <span className="text-amber-300">{liveSocialToast.city}</span> طلب:
            </div>
            <div className="text-xs font-black text-nav-cyan truncate">
              {liveSocialToast.productName}
            </div>
          </div>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setLiveSocialToast(null);
            }}
            className="p-1 text-nav-fg/60 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  
}

export function renderExitIntentModal(ctx) {
  const { currentClient, exitIntentContactInput, exitIntentModalOpen, handleApplyExitIntentOffer, setExitIntentContactInput, setExitIntentModalOpen, siteSettings } = ctx;
    if (!exitIntentModalOpen || siteSettings.enableExitIntentPopup === false) return null;
    const pct = Number(siteSettings.exitIntentDiscountPct) || 5;
    const codeStr = siteSettings.exitIntentPromoCode || 'STAY5';

    return (
      <div className="fixed inset-0 bg-nav/85 backdrop-blur-xs z-[190] flex items-center justify-center p-4">
        <div className="bg-surface rounded-3xl max-w-md w-full p-6 border-2 border-rose-500 shadow-2xl text-center space-y-4 relative">
          <button
            type="button"
            onClick={() => setExitIntentModalOpen(false)}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-surface2 text-muted hover:text-fg flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto text-3xl">
            ✋
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xl font-black text-fg">
              {siteSettings.exitIntentTitle || `استنى! قبل ما تمشي.. خد خصم ${pct}% فوري على طلبك 🎁`}
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              {siteSettings.exitIntentSubtitle || 'لا تفوّت الفرصة! فعّل العرض الحصري الآن واستمتع بأفضل جودة مع ضمان كامل ومعاينة قبل الدفع.'}
            </p>
          </div>

          {!currentClient && (
            <div className="p-3 rounded-2xl bg-surface2 border border-line text-right space-y-1">
              <label className="text-[11px] font-black text-fg block">📱 اكتب رقم تليفونك أو إيميلك لتفعيل الكوبون باسمك:</label>
              <input
                type="text"
                dir="ltr"
                value={exitIntentContactInput}
                onChange={e => setExitIntentContactInput(e.target.value)}
                placeholder="01012345678 أو البريد الإلكتروني"
                className="w-full p-2 rounded-xl border border-line font-mono font-black text-xs text-center"
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-extrabold">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">🤝 الدفع عند الاستلام</span>
            <span className="px-2.5 py-1 rounded-xl bg-[#0071E3]/15 text-[#004F9F] dark:text-[#0066CC]">👁️ معاينة قبل الدفع</span>
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">🛡️ ضمان بالرقم</span>
          </div>

          <div className="p-3 rounded-2xl bg-surface2 border border-dashed border-accent flex items-center justify-between">
            <span className="text-xs font-bold text-muted">كود الخصم الفوري:</span>
            <span className="font-mono font-black text-base text-accent-text">{codeStr} (-{pct}%)</span>
          </div>

          <button
            type="button"
            onClick={handleApplyExitIntentOffer}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0071E3] to-[#0077ED] hover:from-emerald-500 hover:to-slate-500 text-white font-black text-sm shadow-lg transition"
          >
            🎁 تفعيل خصم {pct}% الآن وإكمال التسوق
          </button>
        </div>
      </div>
    );
  
}

export function renderCustomerRestockNotifyModal(ctx) {
  const { formatMoney, handleSubmitCustomerRestockNotify, restockNotifyModalPart, restockVisitorName, restockVisitorPhone, setRestockNotifyModalPart, setRestockVisitorName, setRestockVisitorPhone } = ctx;
    if (!restockNotifyModalPart) return null;
    return (
      <div className="fixed inset-0 bg-nav/80 backdrop-blur-xs z-[185] flex items-center justify-center p-4">
        <form
          onSubmit={handleSubmitCustomerRestockNotify}
          className="bg-surface rounded-3xl max-w-md w-full p-6 border border-line shadow-2xl space-y-4 text-xs"
        >
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm sm:text-base font-black text-fg">🔔 نبّهني على واتساب فور توفر المنتج</h3>
            </div>
            <button type="button" onClick={() => setRestockNotifyModalPart(null)} className="p-1.5 rounded-lg bg-surface2 text-muted">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-surface2 border border-line flex items-center gap-3">
            <img
              src={restockNotifyModalPart.image || PART_IMAGES.screen}
              alt={restockNotifyModalPart.name}
              className="w-12 h-12 rounded-xl object-contain bg-surface border border-line p-1 shrink-0"
            />
            <div>
              <div className="font-extrabold text-fg text-xs">{restockNotifyModalPart.name}</div>
              <div className="text-[11px] text-muted mt-0.5">السعر: {formatMoney(restockNotifyModalPart.basePrice)}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="font-bold text-muted block mb-1">اسمك الكريم:</label>
              <input
                type="text"
                required
                value={restockVisitorName}
                onChange={e => setRestockVisitorName(e.target.value)}
                placeholder="اكتب اسمك..."
                className="w-full p-2.5 rounded-xl border border-line font-bold"
              />
            </div>
            <div>
              <label className="font-bold text-muted block mb-1">رقم الواتساب لتلقي رسالة التوفر فوراً *:</label>
              <input
                type="tel"
                required
                dir="ltr"
                value={restockVisitorPhone}
                onChange={e => setRestockVisitorPhone(e.target.value)}
                placeholder="01012345678"
                className="w-full p-2.5 rounded-xl border border-line font-mono font-black text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-black text-xs shadow-md"
          >
            📲 سجّل رقمي وأرسل لي واتساب فور توفره ✓
          </button>
        </form>
      </div>
    );
  
}

export function renderAdminRestockWhatsappModal(ctx) {
  const { adminRestockWhatsappPart, sendAdminRestockWhatsappToEntry, setAdminRestockWhatsappPart, siteSettings } = ctx;
    if (!adminRestockWhatsappPart) return null;
    const allWaitlist = Array.isArray(siteSettings.restockWaitlist) ? siteSettings.restockWaitlist : [];
    const partWaitlist = adminRestockWhatsappPart.id === 'ALL'
      ? allWaitlist
      : allWaitlist.filter(w => String(w.partId) === String(adminRestockWhatsappPart.id));

    return (
      <div className="fixed inset-0 bg-nav/80 backdrop-blur-xs z-[195] flex items-center justify-center p-4">
        <div className="bg-surface rounded-3xl max-w-xl w-full p-6 border border-line shadow-2xl space-y-4 text-xs max-h-[85vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="text-base font-black text-fg flex items-center gap-2">
                <span>📲</span>
                <span>إرسال رسائل واتساب للمنتظرين ({partWaitlist.length} عميل)</span>
              </h3>
              <p className="text-[11px] text-muted mt-0.5">
                {adminRestockWhatsappPart.id === 'ALL' ? 'جميع طلبات "نبّهني عند التوفر" المسجلة من العملاء' : `المنتج: ${adminRestockWhatsappPart.name}`}
              </p>
            </div>
            <button type="button" onClick={() => setAdminRestockWhatsappPart(null)} className="p-1.5 rounded-lg bg-surface2 text-muted">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {partWaitlist.length === 0 ? (
              <div className="py-10 text-center text-muted font-bold">
                لا يوجد عملاء مسجلون في قائمة انتظار هذا المنتج حالياً.
              </div>
            ) : (
              partWaitlist.map(entry => (
                <div key={entry.id} className="p-3 rounded-2xl bg-surface2 border border-line flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-black text-fg">{entry.clientName} • <span className="font-mono text-accent-text">{entry.phone}</span></div>
                    <div className="text-[11px] text-muted">{entry.partName} • {entry.createdAt}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.notified && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 text-[10px] font-bold">تم الإرسال ✓</span>
                    )}
                    <button
                      type="button"
                      onClick={() => sendAdminRestockWhatsappToEntry(entry)}
                      className="px-3 py-1.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-black text-[11px] flex items-center gap-1"
                    >
                      <span>📲 ابعت واتساب الآن</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {partWaitlist.length > 0 && (
            <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  partWaitlist.forEach((entry, idx) => {
                    setTimeout(() => sendAdminRestockWhatsappToEntry(entry), idx * 600);
                  });
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-black text-xs"
              >
                فتح وإرسال واتساب لكل القائمة ({partWaitlist.length} عملاء)
              </button>
              <button
                type="button"
                onClick={() => setAdminRestockWhatsappPart(null)}
                className="px-4 py-2.5 rounded-xl bg-surface2 text-muted font-bold"
              >
                إغلاق
              </button>
            </div>
          )}
        </div>
      </div>
    );
  
}

export function renderWarrantyLookupModal(ctx) {
  const { clients, currentClient, handleRequestWarrantyReplacement, orders, parts, returnsList, setWarrantyClaimNotes, setWarrantyModalOpen, setWarrantyPhoneQuery, siteSettings, warrantyClaimNotes, warrantyModalOpen, warrantyPhoneQuery } = ctx;
    if (!warrantyModalOpen) return null;
    const cleanQ = normalizeDigits(warrantyPhoneQuery || currentClient?.phone || '').trim();
    const matchedOrders = cleanQ.length >= 4
      ? orders.filter(o => {
          const cli = clients.find(c => String(c.id) === String(o.clientId));
          const phoneMatch = normalizeDigits(String(o.clientPhone || cli?.phone || '')).includes(cleanQ);
          const idMatch = String(o.id || '').toLowerCase().includes(cleanQ.toLowerCase());
          return phoneMatch || idMatch;
        })
      : [];

    const defaultWarrDays = Math.max(7, Number(siteSettings.defaultWarrantyDays) || 90);

    return (
      <div className="fixed inset-0 bg-nav/85 backdrop-blur-xs z-[185] flex items-center justify-center p-4">
        <div className="bg-surface rounded-3xl max-w-2xl w-full p-6 border border-line shadow-2xl space-y-4 text-xs max-h-[88vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-fg">🛡️ فحص الضمان الإلكتروني بالرقم وطلب استبدال فوري</h3>
                <p className="text-[11px] text-muted">اكتب رقم موبايلك أو رقم الفاتورة لمعرفة حالة الضمان وطلب استبدال بضغطة زر</p>
              </div>
            </div>
            <button type="button" onClick={() => setWarrantyModalOpen(false)} className="p-1.5 rounded-lg bg-surface2 text-muted">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              dir="ltr"
              value={warrantyPhoneQuery}
              onChange={e => setWarrantyPhoneQuery(e.target.value)}
              placeholder={currentClient?.phone || 'اكتب رقم الموبايل (مثال: 01012345678) أو رقم الفاتورة INV-...'}
              className="flex-1 p-3 rounded-xl border border-line font-mono font-black text-sm"
            />
            {currentClient?.phone && warrantyPhoneQuery !== currentClient.phone && (
              <button
                type="button"
                onClick={() => setWarrantyPhoneQuery(currentClient.phone)}
                className="px-3.5 py-2 rounded-xl bg-accent text-accent-ink font-black"
              >
                فحص برقمي
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {cleanQ.length < 4 ? (
              <div className="py-10 text-center text-muted font-bold">
                أدخل رقم الموبايل أو رقم الفاتورة بالأعلى لعرض جميع مشترياتك وحالة الضمان لكل قطعة.
              </div>
            ) : matchedOrders.length === 0 ? (
              <div className="py-10 text-center text-muted font-bold">
                لا توجد فواتير مسجلة بهذا الرقم ({cleanQ}). تأكد من الرقم الصحيح.
              </div>
            ) : (
              matchedOrders.map(ord => {
                const ordTs = Date.parse(String(ord.createdAt || '').replace(' ', 'T'));
                const daysElapsed = !Number.isNaN(ordTs) ? Math.max(0, Math.floor((Date.now() - ordTs) / (1000 * 60 * 60 * 24))) : 5;

                return (
                  <div key={ord.id} className="p-4 rounded-2xl bg-surface2 border border-line space-y-3">
                    <div className="flex items-center justify-between border-b border-line pb-2">
                      <span className="font-black text-fg">فاتورة #{ord.id} • {ord.clientName}</span>
                      <span className="text-[11px] text-muted font-mono">{ord.createdAt} (منذ {daysElapsed} يوم)</span>
                    </div>
                    <div className="space-y-2">
                      {(ord.items || []).map((it, idx) => {
                        const partObj = parts.find(p => String(p.id) === String(it.partId));
                        const wText = String(partObj?.warrantyText || '');
                        const wDays = wText.includes('سنة') ? 365 : wText.includes('6 شهور') ? 180 : wText.includes('60') ? 60 : wText.includes('30') ? 30 : defaultWarrDays;
                        const remainingDays = Math.max(0, wDays - daysElapsed);
                        const isValidWarranty = remainingDays > 0;
                        const claimKey = `${ord.id}_${it.partId}`;
                        const alreadyClaimed = returnsList.some(r => r.orderId === ord.id && String(r.partId) === String(it.partId));

                        return (
                          <div key={idx} className="p-3 rounded-xl bg-surface border border-line space-y-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <div className="font-extrabold text-fg">{it.name} (الكمية: {it.qty})</div>
                                <div className="text-[11px] text-muted">{partObj?.warrantyText || `ضمان استبدال معتمد لمدة ${wDays} يوم`}</div>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                                isValidWarranty ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-500'
                              }`}>
                                {isValidWarranty ? `✅ الضمان ساري (متبقي ${remainingDays} يوم)` : '⏰ انتهت فترة الضمان'}
                              </span>
                            </div>

                            {isValidWarranty && (
                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                {alreadyClaimed ? (
                                  <span className="text-[11px] font-black text-amber-500">⏳ تم إرسال طلب استبدال بالضمان لهذا المنتج وهو قيد المراجعة</span>
                                ) : (
                                  <>
                                    <input
                                      type="text"
                                      value={warrantyClaimNotes[claimKey] || ''}
                                      onChange={e => setWarrantyClaimNotes(prev => ({ ...prev, [claimKey]: e.target.value }))}
                                      placeholder="اكتب سبب الاستبدال باختصار (مثال: الجراب أو الكابل فيه مشكلة)..."
                                      className="flex-1 px-3 py-1.5 rounded-xl border border-line text-[11px]"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleRequestWarrantyReplacement(ord, it)}
                                      className="px-3.5 py-1.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-black text-[11px] shrink-0"
                                    >
                                      🔄 اطلب استبدال فوري
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  
}

export function renderFamilyDevicesModal(ctx) {
  const { activeFamilyDevices, familyModalOpen, formatMoney, handleAddFamilyDevice, handleRemoveFamilyDevice, models, newFamilyModelId, newFamilyOwnerLabel, publicParts, setClientTab, setFamilyModalOpen, setNewFamilyModelId, setNewFamilyOwnerLabel, setSelectedModelId, showToast, updateCartQty } = ctx;
    if (!familyModalOpen) return null;
    const ownerPresets = ['اختياراتي الشخصية', 'اختيارات زوجتي', 'اختيارات أخي', 'اختيارات أختي', 'اختيارات والدي / والدتي', 'احتياجات العمل / المكتب'];

    return (
      <div className="fixed inset-0 bg-nav/85 backdrop-blur-xs z-[185] flex items-center justify-center p-4">
        <div className="bg-surface rounded-3xl max-w-lg w-full p-6 border-2 border-[#0071E3]/45 shadow-2xl space-y-4 text-xs max-h-[88vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="text-base font-black text-fg flex items-center gap-2">
                <span>👨‍👩‍👧‍👦</span>
                <span>اختياراتي وعائلتي (تنبيهات المنتجات الجديدة)</span>
              </h3>
              <p className="text-[11px] text-muted mt-0.5">
                احفظ الأقسام أو الموديلات المفضلة لك ولعائلتك، وأول ما ينزل منتج جديد في أي قسم منها هيوصلك إشعار فوري!
              </p>
            </div>
            <button type="button" onClick={() => setFamilyModalOpen(false)} className="p-1.5 rounded-lg bg-surface2 text-muted">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleAddFamilyDevice} className="p-3.5 rounded-2xl bg-surface2 border border-line space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="font-bold text-muted block mb-1">صاحب الجهاز / الوصف:</label>
                <select
                  value={newFamilyOwnerLabel}
                  onChange={e => setNewFamilyOwnerLabel(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-line font-bold"
                >
                  {ownerPresets.map(lbl => (
                    <option key={lbl} value={lbl}>{lbl}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-muted block mb-1">اختر الموديل / القسم:</label>
                <select
                  value={newFamilyModelId || (models[0]?.id || '')}
                  onChange={e => setNewFamilyModelId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-line font-bold"
                >
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.brand} — {m.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-accent text-accent-ink font-black text-xs shadow-xs"
            >
              + حفظ الجهاز وتفعيل إشعارات المنتجات الجديدة 🔔
            </button>
          </form>

          <div className="flex-1 overflow-y-auto space-y-2">
            {activeFamilyDevices.length === 0 ? (
              <div className="py-8 text-center text-muted font-bold">
                لم تقم بحفظ أي أجهزة بعد. أضف جهازك أو جهاز عائلتك بالأعلى!
              </div>
            ) : (
              activeFamilyDevices.map(dev => {
                const matchingParts = publicParts.filter(p => String(p.modelId) === String(dev.modelId));
                const latestPart = matchingParts[0];
                return (
                  <div key={dev.id} className="p-3 rounded-2xl bg-surface2 border border-line space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="px-2 py-0.5 rounded-full bg-[#0071E3]/15 text-[#0066CC] font-black text-[10px] ms-2">
                          {dev.ownerLabel}
                        </span>
                        <span className="font-black text-fg text-xs">{dev.modelName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedModelId(dev.modelId);
                            setClientTab('search');
                            setFamilyModalOpen(false);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-accent text-accent-ink font-black text-[10px]"
                        >
                          عرض المنتجات ({matchingParts.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFamilyDevice(dev.id)}
                          className="p-1 text-rose-500 hover:bg-rose-500/15 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    {latestPart && (
                      <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2 text-[11px]">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold truncate">
                          🔔 متاح لـ {dev.ownerLabel}: <b>{latestPart.name}</b> ({formatMoney(latestPart.basePrice)})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            updateCartQty(latestPart.id, 1);
                            showToast(`تمت إضافة "${latestPart.name}" لـ (${dev.ownerLabel}) في السلة!`, 'success');
                          }}
                          className="px-2 py-0.5 rounded bg-emerald-600 text-white font-black shrink-0"
                        >
                          + أضف للسلة
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  
}

export function renderConfettiOverlay(ctx) {
  const { confettiActive } = ctx;
    if (!confettiActive) return null;
    const pieces = Array.from({ length: 36 }, (_, i) => i);
    const colors = ['#10b981', '#22d3ee', '#fbbf24', '#f43f5e', '#a855f7', '#2f6bb3'];
    return (
      <div className="fixed inset-0 pointer-events-none z-[250] overflow-hidden">
        {pieces.map(i => {
          const left = (i * 2.8) % 100;
          const delay = (i % 7) * 0.12;
          const bg = colors[i % colors.length];
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                top: '-16px',
                left: `${left}%`,
                width: i % 2 === 0 ? '10px' : '8px',
                height: i % 3 === 0 ? '18px' : '10px',
                backgroundColor: bg,
                borderRadius: '3px',
                animation: `hm-confetti-fall 2.6s ease-in ${delay}s forwards`
              }}
            />
          );
        })}
      </div>
    );
  
}

export function renderLoginModal(ctx) {
  const { authModalTab, clientLoginIdentifier, clientLoginPassword, forgotConfirmPassword, forgotIdentityVerify, forgotNewPassword, forgotOtpCode, forgotPhone, forgotStepStatus, handleClientLoginSubmit, handleForgotPasswordSubmit, handleSubmitRegistrationRequest, lang, loginModalOpen, regErrors, regForm, setAuthModalTab, setClientLoginIdentifier, setClientLoginPassword, setForgotConfirmPassword, setForgotIdentityVerify, setForgotNewPassword, setForgotOtpCode, setForgotPhone, setLoginModalOpen, setRegErrors, setRegForm, siteSettings } = ctx;
    if (!loginModalOpen) return null;
    return (
      <div
        onClick={() => setLoginModalOpen(false)}
        className="fixed inset-0 bg-nav backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-2 sm:p-4"
      >
        <div
          onClick={e => e.stopPropagation()}
          className="bg-surface rounded-t-3xl sm:rounded-3xl max-w-md sm:max-w-2xl lg:max-w-3xl w-full shadow-2xl max-h-[76vh] sm:max-h-[88vh] flex flex-col overflow-hidden border border-line"
        >
          {/* Sticky Compact Header with Drag Handle & Prominent Close Button */}
          <div className="sticky top-0 z-20 bg-surface backdrop-blur px-4 pt-2.5 pb-3 border-b border-line shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-surface2 mx-auto mb-2.5 sm:hidden" />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-600 text-white flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-fg">
                    تسجيل الدخول أو فتح حساب جديد
                  </h3>
                  <p className="text-[11px] text-muted">
                    اسحب للأعلى للتمرير السريع أو اضغط إغلاق باليسار
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLoginModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-200 font-extrabold text-xs flex items-center gap-1 transition shrink-0 shadow-2xs"
                title="إغلاق النافذة"
              >
                <X className="w-4 h-4" />
                <span>إغلاق</span>
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3.5 overflow-y-auto overscroll-contain touch-pan-y flex-1">

          {/* Tabs: Login vs Request New Account vs Forgot Password */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-surface2 rounded-2xl text-[11px] sm:text-xs font-extrabold">
            <button
              type="button"
              onClick={() => setAuthModalTab('login')}
              className={`py-2.5 px-2 rounded-xl transition ${
                authModalTab === 'login'
                  ? 'bg-surface text-fg shadow-xs'
                  : 'text-muted hover:text-fg'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => setAuthModalTab('register')}
              className={`py-2.5 px-2 rounded-xl transition ${
                authModalTab === 'register'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-muted hover:text-fg'
              }`}
            >
              طلب فتح حساب
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthModalTab('forgot');
                if (clientLoginIdentifier && !forgotPhone) setForgotPhone(clientLoginIdentifier);
              }}
              className={`py-2.5 px-2 rounded-xl transition ${
                authModalTab === 'forgot'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-muted hover:text-fg'
              }`}
            >
              نسيت كلمة السر؟
            </button>
          </div>

          {authModalTab === 'login' ? (
            <form onSubmit={handleClientLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-muted block mb-1.5">
                  رقم الموبايل أو الإيميل المسجّل:
                </label>
                <input
                  type="text"
                  required
                  value={clientLoginIdentifier}
                  onChange={e => setClientLoginIdentifier(e.target.value)}
                  placeholder="اكتب رقم الموبايل (مثلاً: 01012345678)..."
                  className="w-full px-3.5 py-3 rounded-xl border border-line font-mono font-bold text-fg"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-muted">
                    كلمة المرور (Password):
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalTab('forgot');
                      if (clientLoginIdentifier && !forgotPhone) setForgotPhone(clientLoginIdentifier);
                    }}
                    className="text-[11px] font-extrabold text-accent-text hover:underline"
                  >
                    هل نسيت كلمة السر؟
                  </button>
                </div>
                <PasswordInput
                  type="password"
                  required
                  value={clientLoginPassword}
                  onChange={e => setClientLoginPassword(e.target.value)}
                  placeholder="اكتب كلمة المرور..."
                  className="w-full px-3.5 py-3 rounded-xl border border-line font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-go hover:brightness-110 text-go-ink font-extrabold text-sm shadow-md transition"
              >
                ادخل وحدّث الأسعار
              </button>

              <div className="pt-2 border-t border-line flex flex-wrap items-center justify-between gap-2 text-center">
                <div>
                  <span className="text-muted">لسه معندكش حساب؟ </span>
                  <button
                    type="button"
                    onClick={() => setAuthModalTab('register')}
                    className="font-extrabold text-accent-text hover:underline"
                  >
                    اطلب فتح حساب
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthModalTab('forgot');
                    if (clientLoginIdentifier && !forgotPhone) setForgotPhone(clientLoginIdentifier);
                  }}
                  className="font-extrabold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  🔑 استعادة كلمة المرور
                </button>
              </div>
            </form>
          ) : authModalTab === 'forgot' ? (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-surface2 border border-line space-y-1">
                <div className="font-extrabold text-fg flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-accent-text" />
                  <span>استعادة وتغيير كلمة المرور بأمان</span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  أدخل رقم موبايلك المسجل مع اسم المحل/المسؤول (أو كود التحقق السري OTP المرسل من الإدارة) لتعيين كلمة مرور جديدة لحسابك.
                </p>
              </div>

              {forgotStepStatus?.type === 'requested' && (
                <div className="p-3.5 rounded-2xl bg-go/15 border border-go/30 text-fg space-y-2.5">
                  <div className="font-extrabold text-go flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>تم تسجيل طلب استعادة كلمة السر لحساب "{forgotStepStatus.clientName}"!</span>
                  </div>
                  <p className="text-[11px] text-muted leading-relaxed">
                    وصل إشعار فوري للإدارة لاعتماد كلمة المرور الجديدة، أو يمكنك استلام كود التفعيل الفوري (OTP) عبر واتساب وإدخاله بالأسفل:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`https://wa.me/${String(siteSettings.whatsappNumber || '201000000000').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً إدارة ${siteSettings.storeName || 'ELZOGHBI'}، قمت بطلب استعادة كلمة المرور لحساب: ${forgotStepStatus.clientName} (${forgotStepStatus.phone})، يرجى التفعيل أو إرسال كود OTP.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2 px-3 rounded-xl bg-go text-go-ink font-extrabold text-center shadow-xs"
                    >
                      💬 تواصل واتساب للتفعيل الفوري
                    </a>
                    <button
                      type="button"
                      onClick={() => setAuthModalTab('login')}
                      className="py-2 px-3 rounded-xl bg-surface border border-line text-fg font-extrabold"
                    >
                      العودة للدخول
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-muted block mb-1">
                  1. رقم الموبايل المسجّل بالحساب *:
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  value={forgotPhone}
                  onChange={e => setForgotPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line font-mono font-bold text-fg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-muted block mb-1">
                    2. اسم المحل أو المسؤول المسجّل:
                  </label>
                  <input
                    type="text"
                    value={forgotIdentityVerify}
                    onChange={e => setForgotIdentityVerify(e.target.value)}
                    placeholder="لتأكيد ملكية الحساب..."
                    className="w-full px-3 py-2.5 rounded-xl border border-line font-bold text-fg"
                  />
                </div>
                <div>
                  <label className="font-bold text-accent-text block mb-1">
                    أو كود التحقق السري (OTP):
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={forgotOtpCode}
                    onChange={e => setForgotOtpCode(e.target.value)}
                    placeholder="كود 6 أرقام للتفعيل الفوري"
                    className="w-full px-3 py-2.5 rounded-xl border border-accent font-mono font-extrabold text-fg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="font-bold text-muted block mb-1">
                    3. كلمة المرور الجديدة *:
                  </label>
                  <PasswordInput
                    type="password"
                    required
                    value={forgotNewPassword}
                    onChange={e => setForgotNewPassword(e.target.value)}
                    placeholder="كلمة السر الجديدة..."
                    className="w-full px-3 py-2.5 rounded-xl border border-line font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">
                    تأكيد كلمة المرور الجديدة *:
                  </label>
                  <PasswordInput
                    type="password"
                    required
                    value={forgotConfirmPassword}
                    onChange={e => setForgotConfirmPassword(e.target.value)}
                    placeholder="أعد كتابة كلمة السر..."
                    className="w-full px-3 py-2.5 rounded-xl border border-line font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-accent hover:brightness-110 text-accent-ink font-black text-xs sm:text-sm shadow-md transition"
              >
                {forgotOtpCode.trim().length >= 4
                  ? '✓ تأكيد الكود (OTP) وتغيير كلمة السر فوراً'
                  : '🔑 إرسال طلب استعادة وتغيير كلمة المرور'}
              </button>

              <div className="pt-2 border-t border-line text-center">
                <button
                  type="button"
                  onClick={() => setAuthModalTab('login')}
                  className="font-extrabold text-accent-text hover:underline"
                >
                  ← الرجوع لتسجيل الدخول
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitRegistrationRequest} className="space-y-4 text-xs">
              {Object.values(regErrors).some(Boolean) && (
                <div
                  id="reg-form-top"
                  className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-300 font-bold flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>في بيانات ناقصة أو غلط، راجع الحقول الحمرا تحت وصحّحها.</span>
                </div>
              )}
              {/* Persona Selector: Individual vs Merchant */}
              <div>
                <label className="font-extrabold text-fg block mb-2">اختار نوع الحساب:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => {
                      setRegForm(p => ({
                        ...p,
                        accountCategory: 'individual',
                        shopType: 'عميل فردي (استخدام شخصي)'
                      }));
                      setRegErrors({});
                    }}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                      regForm.accountCategory === 'individual'
                        ? 'border-accent bg-accent/10 shadow-sm'
                        : 'border-line hover:border-line bg-surface'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      regForm.accountCategory === 'individual' ? 'bg-emerald-600 text-white' : 'bg-surface2 text-muted'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-black text-fg text-xs">شخص عادي (استخدام شخصي)</div>
                      <div className="text-[10px] text-muted leading-relaxed mt-0.5">
                        تسوّق جميع المنتجات المختارة بأسعار القطاعي، والحساب بيتفتح فوراً من غير موافقة
                      </div>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      setRegForm(p => ({
                        ...p,
                        accountCategory: 'shop',
                        shopType: 'تاجر / موزع ومبيعات معتمد'
                      }));
                      setRegErrors({});
                    }}
                    className={`p-3 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3 ${
                      regForm.accountCategory === 'shop'
                        ? 'border-accent bg-accent/10 shadow-sm'
                        : 'border-line hover:border-line bg-surface'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      regForm.accountCategory === 'shop' ? 'bg-blue-600 text-white' : 'bg-surface2 text-muted'
                    }`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-black text-fg text-xs">حساب تجاري / تاجر وموزع</div>
                      <div className="text-[10px] text-muted leading-relaxed mt-0.5">
                        حساب تاجر عشان تاخد أسعار الجملة وخصومات التوزيع
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {regForm.accountCategory === 'shop' && (
                  <div className="sm:col-span-2">
                    <label className="font-bold text-muted block mb-1">اسم النشاط التجاري / المعرض / الشركة *</label>
                    <input
                      type="text"
                      required
                      value={regForm.shopName}
                      onChange={e => {
                        setRegForm(p => ({ ...p, shopName: e.target.value }));
                        if (regErrors.shopName) setRegErrors(p => ({ ...p, shopName: null }));
                      }}
                      placeholder="مثلاً: شركة أو معرض الأهرام للتجارة..."
                      className={`w-full p-2.5 rounded-xl border font-bold text-fg transition ${
                        regErrors.shopName ? 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-400' : 'border-line'
                      }`}
                    />
                    {regErrors.shopName && (
                      <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> {regErrors.shopName}
                      </p>
                    )}
                  </div>
                )}

                <div className={regForm.accountCategory === 'individual' ? 'sm:col-span-2' : ''}>
                  <label className="font-bold text-muted block mb-1">
                    {regForm.accountCategory === 'individual' ? 'الاسم بالكامل (ثنائي أو ثلاثي) *' : 'اسم المالك أو الفني المسؤول *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.ownerName}
                    onChange={e => {
                      setRegForm(p => ({ ...p, ownerName: e.target.value }));
                      if (regErrors.name) setRegErrors(p => ({ ...p, name: null }));
                    }}
                    placeholder={regForm.accountCategory === 'individual' ? 'مثلاً: محمود أحمد حسن...' : 'مثلاً: م. محمد إبراهيم...'}
                    className={`w-full p-2.5 rounded-xl border font-bold text-fg transition ${
                      regErrors.name ? 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-400' : 'border-line'
                    }`}
                  />
                  {regErrors.name && (
                    <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" /> {regErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-muted block mb-1">رقم الموبايل (للتواصل والدخول) *</label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={regForm.phone}
                    onChange={e => {
                      setRegForm(p => ({ ...p, phone: e.target.value }));
                      if (regErrors.phone) setRegErrors(p => ({ ...p, phone: null }));
                    }}
                    placeholder="01012345678"
                    className={`w-full p-2.5 rounded-xl border font-mono font-bold text-fg transition ${
                      regErrors.phone ? 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-400' : 'border-line'
                    }`}
                  />
                  {regErrors.phone && (
                    <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" /> {regErrors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-muted block mb-1">🎂 تاريخ الميلاد (إجباري لهدايا عيد ميلادك) *</label>
                  <input
                    type="date"
                    required
                    value={regForm.birthDate || ''}
                    onChange={e => {
                      setRegForm(p => ({ ...p, birthDate: e.target.value }));
                      if (regErrors.birthDate) setRegErrors(p => ({ ...p, birthDate: null }));
                    }}
                    className={`w-full p-2.5 rounded-xl border font-mono font-bold text-fg transition ${
                      regErrors.birthDate ? 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-400' : 'border-line'
                    }`}
                  />
                  {regErrors.birthDate && (
                    <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" /> {regErrors.birthDate}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-muted block mb-1">🤝 كود دعوة صديق — هات صاحبك (اختياري لربح رصيد بالمحفظة):</label>
                  <input
                    type="text"
                    dir="ltr"
                    value={regForm.referredByCode || ''}
                    onChange={e => setRegForm(p => ({ ...p, referredByCode: e.target.value.toUpperCase() }))}
                    placeholder="مثال: REF-10123 (إن وجد)"
                    className="w-full p-2.5 rounded-xl border border-line font-mono font-bold text-fg"
                  />
                </div>

                {regForm.accountCategory === 'shop' && (
                  <div>
                    <label className="font-bold text-muted block mb-1">نوع النشاط التجاري:</label>
                    <select
                      value={regForm.shopType}
                      onChange={e => setRegForm(p => ({ ...p, shopType: e.target.value }))}
                      className="w-full p-2.5 rounded-xl border border-line font-bold"
                    >
                      <option>تاجر / موزع ومبيعات معتمد</option>
                      <option>محل إكسسوارات وجوالات</option>
                      <option>تاجر جملة وموزع محلي</option>
                      <option>موزع / عميل جملة معتمد</option>
                    </select>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="font-bold text-muted block mb-1">العنوان بالتفصيل (المحافظة - المدينة - اسم الشارع) *</label>
                  <input
                    type="text"
                    required
                    value={regForm.address}
                    onChange={e => {
                      setRegForm(p => ({ ...p, address: e.target.value }));
                      if (regErrors.address) setRegErrors(p => ({ ...p, address: null }));
                    }}
                    placeholder="مثلاً: الدقهلية، أجا، شارع الجيش جنب مسجد النور..."
                    className={`w-full p-2.5 rounded-xl border font-medium text-fg transition ${
                      regErrors.address ? 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-400' : 'border-line'
                    }`}
                  />
                  {regErrors.address && (
                    <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" /> {regErrors.address}
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-muted block mb-1">كلمة المرور (6 على الأقل) *</label>
                  <PasswordInput
                    type="password"
                    required
                    value={regForm.password}
                    onChange={e => {
                      setRegForm(p => ({ ...p, password: e.target.value }));
                      if (regErrors.password) setRegErrors(p => ({ ...p, password: null }));
                    }}
                    placeholder="اختار كلمة مرور قوية..."
                    className={`w-full p-2.5 rounded-xl border font-mono transition ${
                      regErrors.password ? 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-400' : 'border-line'
                    }`}
                  />
                  {regErrors.password && (
                    <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" /> {regErrors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="font-bold text-muted block mb-1">تأكيد كلمة المرور *</label>
                  <PasswordInput
                    type="password"
                    required
                    value={regForm.confirmPassword}
                    onChange={e => {
                      setRegForm(p => ({ ...p, confirmPassword: e.target.value }));
                      if (regErrors.confirmPassword) setRegErrors(p => ({ ...p, confirmPassword: null }));
                    }}
                    placeholder="اكتب نفس كلمة المرور تاني..."
                    className={`w-full p-2.5 rounded-xl border font-mono transition ${
                      regErrors.confirmPassword ? 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-400' : 'border-line'
                    }`}
                  />
                  {regErrors.confirmPassword && (
                    <p className="text-[11px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 shrink-0" /> {regErrors.confirmPassword}
                    </p>
                  )}
                </div>
              </div>

              {/* Terms & Conditions (mandatory) */}
              <div className={`rounded-2xl border p-3 space-y-2 ${regErrors.terms ? 'border-rose-500 bg-rose-500/10' : 'border-line bg-surface2'}`}>
                <div className="font-extrabold text-fg">
                  {siteSettings.registrationTermsTitle || 'الشروط والأحكام'}
                </div>
                <div className="max-h-20 overflow-y-auto p-2 rounded-xl bg-surface border border-line text-[10px] leading-relaxed text-muted whitespace-pre-line">
                  {lang === 'en' && (!siteSettings.registrationTermsText || siteSettings.registrationTermsText === DEFAULT_REGISTRATION_TERMS)
                    ? DEFAULT_REGISTRATION_TERMS_EN
                    : siteSettings.registrationTermsText || DEFAULT_REGISTRATION_TERMS}
                </div>
                <label className="flex items-start gap-2 cursor-pointer font-bold text-fg">
                  <input
                    type="checkbox"
                    checked={!!regForm.acceptTerms}
                    onChange={e => {
                      setRegForm(p => ({ ...p, acceptTerms: e.target.checked }));
                      if (regErrors.terms) setRegErrors(p => ({ ...p, terms: null }));
                    }}
                    className="w-4 h-4 mt-0.5 accent-emerald-600"
                  />
                  <span>قرأت الشروط والأحكام وموافق عليها *</span>
                </label>
                {regErrors.terms && (
                  <p className="text-[11px] text-rose-600 font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" /> {regErrors.terms}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className={`w-full py-3.5 rounded-2xl text-white font-extrabold text-sm shadow-lg transition flex items-center justify-center gap-2 ${
                  regForm.accountCategory === 'individual'
                    ? 'bg-gradient-to-l from-[#0071E3] to-[#0077ED] hover:from-emerald-700 hover:to-slate-700 shadow-emerald-600/30'
                    : 'bg-gradient-to-l from-blue-600 to-slate-600 hover:from-blue-700 hover:to-slate-700 shadow-blue-600/30'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                {regForm.accountCategory === 'individual' ? 'اعمل الحساب وادخل على طول' : 'ابعت طلب فتح حساب المحل للإدارة'}
              </button>
            </form>
          )}
          </div>
        </div>
      </div>
    );
  
}

export function renderReturnRequestModal(ctx) {
  const { markLocalUpsert, processAndUploadImage, retPartId, retPhotos, retReason, returnModalOrder, sbUpsert, setAccountSubTab, setClientTab, setLightbox, setNotifications, setRetPartId, setRetPhotos, setRetReason, setReturnModalOrder, setReturnsList, showToast, submittingCustomerActionRef } = ctx;
    if (!returnModalOrder) return null;
    const selectedItem =
      returnModalOrder.items.find(i => i.partId === retPartId) || returnModalOrder.items[0];

    const handleSubmitReturn = async (e) => {
      e.preventDefault();
      if (!selectedItem || submittingCustomerActionRef.current) return;
      submittingCustomerActionRef.current = true;
      try {
      const newRet = {
        id: `RET-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        orderId: returnModalOrder.id,
        clientId: returnModalOrder.clientId,
        clientName: returnModalOrder.clientName,
        partId: selectedItem.partId,
        partName: selectedItem.name,
        qty: 1,
        refundAmountBase: selectedItem.unitPriceBase,
        reason: retReason.trim() || 'مفيش وصف',
        warrantyConfirmed: false,
        replies: [],
        closed: false,
        photos: retPhotos,
        status: 'قيد المراجعة',
        resolutionType: '',
        adminResponse: '',
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
      };
      // Await the server write: on failure keep the form open and say so
      // (fire-and-forget used to show success while nothing arrived).
      const savedOk = await sbUpsert('returns_list', newRet);
      if (!savedOk) {
        showToast('معلش، طلب الإرجاع ماوصلش للسيرفر. اتأكد من النت وجرّب تاني.', 'error');
        return;
      }
      setReturnsList(prev => [newRet, ...prev]);
      markLocalUpsert('returnsList', newRet);
      setNotifications(prev => [
        {
          id: `ntf_ret_${Date.now()}`,
          target: 'admin',
          type: 'return',
          title: `↩️ طلب إرجاع جديد (${newRet.id})`,
          msg: `العميل "${newRet.clientName}" طلب إرجاع "${newRet.partName}" من فاتورة ${newRet.orderId}.`,
          time: 'الآن',
          read: false
        },
        ...prev
      ]);
      setReturnModalOrder(null);
      setRetReason('');
      setRetPhotos([]);
      setClientTab('account');
      setAccountSubTab('returns');
      showToast('طلب الاسترجاع والصور وصلوا لقسم الضمان!', 'success');
      } finally {
        submittingCustomerActionRef.current = false;
      }
    };

    return (
      <div className="fixed inset-0 bg-nav backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <form
          onSubmit={handleSubmitReturn}
          className="bg-surface rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="text-base font-extrabold text-fg">
              طلب استرجاع بالضمان — فاتورة {returnModalOrder.id}
            </h3>
            <button
              type="button"
              onClick={() => { setReturnModalOrder(null); setRetPhotos([]); }}
              className="p-1 text-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-muted block mb-1">اختار القطعة اللي عايز ترجّعها:</label>
              <select
                value={selectedItem.partId}
                onChange={e => setRetPartId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-line font-bold"
              >
                {returnModalOrder.items.map(i => (
                  <option key={i.partId} value={i.partId}>
                    {i.name} (سعر الفاتورة: {i.unitPriceBase} ج.م)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">اشرح حالة القطعة والعيب:</label>
              <textarea
                rows={3}
                required
                value={retReason}
                onChange={e => setRetReason(e.target.value)}
                placeholder="اكتب حالة القطعة والعيب اللي ظهر..."
                className="w-full p-2.5 rounded-xl border border-line"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-muted">صور للقطعة (اختياري — من 1 لـ 5):</label>
                <span className="text-[11px] font-bold text-muted">{retPhotos.length}/5</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {retPhotos.map((img, i) => (
                  <div key={i} className="relative">
                    <img
                      src={img}
                      alt="صورة"
                      onClick={() => setLightbox({ list: retPhotos, index: i })}
                      className="w-16 h-16 rounded-lg object-cover border border-line cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setRetPhotos(prev => prev.filter((_, k) => k !== i))}
                      className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {retPhotos.length < 5 && (
                  <label className="w-16 h-16 rounded-lg border-2 border-dashed border-line hover:border-blue-500 text-muted hover:text-blue-600 flex items-center justify-center cursor-pointer text-2xl font-bold">
                    +
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={async e => {
                        const files = Array.from(e.target.files || []).slice(0, 5 - retPhotos.length);
                        e.target.value = '';
                        const done = [];
                        for (const f of files) {
                          try {
                            const u = await processAndUploadImage(f, 'returns');
                            if (u) done.push(u);
                          } catch (err) {}
                        }
                        setRetPhotos(prev => [...prev, ...done].slice(0, 5));
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-blue-600 text-white text-xs font-extrabold"
          >
            ابعت طلب الاسترجاع للمراجعة
          </button>
        </form>
      </div>
    );
  
}
