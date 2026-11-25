import { X, Minus, Plus } from 'lucide-react';
import { getAdTheme, getSourcingBanner, waLink } from '../lib/utils.jsx';
import { AdContent } from '../components/widgets.jsx';
import { AD_THEMES, DEFAULT_SOURCING_DEPOSIT_INFO, DEFAULT_SOURCING_TERMS, DEFAULT_SOURCING_TERMS_EN, SRC_DEPOSIT_LABEL, SRC_STATUSES, SRC_STATUS_STYLE, SRC_STEPS, STUDIO_AD_LAYOUT_TEMPLATES } from '../data/constants.jsx';

export function renderSrcChat(ctx, req, side) {
  const { pickSrcImages, pickSrcPdf, sendSourcingMessage, setLightbox, setSrcDraftImgs, setSrcDraftPdf, setSrcDrafts, srcDraftImgs, srcDraftPdf, srcDrafts } = ctx;
    const msgs = req.messages || [];
    const draft = srcDrafts[req.id] || '';
    const imgs = srcDraftImgs[req.id] || [];
    const pdf = srcDraftPdf[req.id] || null;
    const locked = req.closed && side === 'client';
    return (
      <div className="rounded-xl border border-line bg-surface2 p-3 space-y-2">
        <div className="text-[11px] font-extrabold text-muted">المحادثة</div>
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {msgs.length === 0 && <div className="text-center text-[11px] text-muted py-4">مفيش رسائل لسه. ابدأ المحادثة 👇</div>}
          {msgs.map(m => {
            const mine = m.from === side;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs space-y-1.5 ${mine ? 'bg-blue-600 text-white' : 'bg-surface border border-line text-fg'}`}>
                  <div className={`text-[10px] font-bold ${mine ? 'text-blue-100' : 'text-muted'}`}>{m.from === 'admin' ? 'الإدارة' : req.clientName}</div>
                  {m.text && <div className="whitespace-pre-line leading-relaxed">{m.text}</div>}
                  {(m.images || []).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {m.images.map((im, i) => (
                        <img key={i} src={im} alt="" onClick={() => setLightbox({ list: m.images, index: i })} className="w-20 h-20 rounded-lg object-cover cursor-pointer border border-white/30" />
                      ))}
                    </div>
                  )}
                  {m.pdf && (
                    <a href={m.pdf.data} download={m.pdf.name} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold ${mine ? 'bg-surface text-white' : 'bg-surface2 text-fg'}`}>
                      📄 {m.pdf.name}
                    </a>
                  )}
                  <div className={`text-[9px] ${mine ? 'text-blue-200' : 'text-muted'}`}>{m.at}</div>
                </div>
              </div>
            );
          })}
        </div>
        {locked ? (
          <div className="text-center text-[11px] text-muted font-bold">الطلب مقفول.</div>
        ) : (
          <div className="space-y-2">
            {(imgs.length > 0 || pdf) && (
              <div className="flex flex-wrap items-center gap-2">
                {imgs.map((im, i) => (
                  <div key={i} className="relative">
                    <img src={im} alt="" className="w-14 h-14 rounded-lg object-cover border border-line" />
                    <button type="button" onClick={() => setSrcDraftImgs(prev => ({ ...prev, [req.id]: (prev[req.id] || []).filter((_, k) => k !== i) }))} className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {pdf && (
                  <span className="px-2.5 py-1.5 rounded-lg bg-surface2 text-[11px] font-bold flex items-center gap-1.5">
                    📄 {pdf.name}
                    <button type="button" onClick={() => setSrcDraftPdf(prev => ({ ...prev, [req.id]: null }))}><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>
            )}
            {side === 'client' && !req.imagesAllowed && <div className="text-[10px] text-muted">رفع الصور مقفول دلوقتي. لما الإدارة تحتاج صور هتفتحه لك.</div>}
            <div className="flex items-end gap-2">
              <textarea
                rows={1}
                value={draft}
                onChange={e => setSrcDrafts(prev => ({ ...prev, [req.id]: e.target.value }))}
                placeholder="اكتب رسالتك..."
                className="flex-1 px-3 py-2.5 rounded-xl border border-line bg-surface text-xs resize-none"
              />
              {(side === 'admin' || req.imagesAllowed) && (
                <label className="w-10 h-10 shrink-0 rounded-xl bg-surface border border-line flex items-center justify-center cursor-pointer text-base" title="صورة">
                  📷
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => pickSrcImages(req.id, e)} />
                </label>
              )}
              {side === 'admin' && (
                <label className="w-10 h-10 shrink-0 rounded-xl bg-surface border border-line flex items-center justify-center cursor-pointer text-base" title="PDF">
                  📄
                  <input type="file" accept="application/pdf" className="hidden" onChange={e => pickSrcPdf(req.id, e)} />
                </label>
              )}
              <button type="button" onClick={() => sendSourcingMessage(req.id, side)} className="h-10 px-4 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold">
                إرسال
              </button>
            </div>
          </div>
        )}
      </div>
    );
  
}

export function renderSourcingBanner(ctx) {
  const { i18nActive, openSourcing, siteSettings } = ctx;
    const b = getSourcingBanner(siteSettings);
    if (!b.active) return null;
    const th = getAdTheme(b);
    return (
      <div
        onClick={openSourcing}
        style={{ background: th.cssGrad }}
        className="relative rounded-[26px] overflow-hidden cursor-pointer border border-line shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <AdContent ad={{ ...b, bannerHeight: b.bannerHeight || 'compact', linkedPartId: 'x' }} isPromoCard rtl={!i18nActive} />
      </div>
    );
  
}

export function renderSourcingFormModal(ctx) {
  const { handleSrcFormImage, lang, setSourcingFormOpen, setSrcForm, setSrcSheetDrag, setSrcSheetDragging, setSrcSheetExp, siteSettings, sourcingFormOpen, srcForm, srcSheetDrag, srcSheetDragging, srcSheetExp, srcSheetStartRef, submitSourcingRequest } = ctx;
    if (!sourcingFormOpen) return null;
    const termsText =
      lang === 'en' && (!siteSettings.sourcingTerms || siteSettings.sourcingTerms === DEFAULT_SOURCING_TERMS)
        ? DEFAULT_SOURCING_TERMS_EN
        : siteSettings.sourcingTerms || DEFAULT_SOURCING_TERMS;
    return (
      <div className="fixed inset-0 z-[70] bg-nav flex items-end sm:items-center justify-center sm:p-4" onClick={() => setSourcingFormOpen(false)}>
        <form
          onSubmit={submitSourcingRequest}
          onClick={e => e.stopPropagation()}
          className="bg-surface w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[72vh] sm:max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
          style={
            window.innerWidth < 640
              ? (() => {
                  const vh = window.innerHeight / 100;
                  const h = Math.min(94 * vh, Math.max(32 * vh, (srcSheetExp ? 92 : 72) * vh - srcSheetDrag));
                  return { height: h, maxHeight: 'none', transition: srcSheetDragging ? 'none' : 'height 0.25s ease' };
                })()
              : undefined
          }
        >
          <div
            className="shrink-0 select-none"
            style={{ touchAction: 'none' }}
            onPointerDown={e => {
              if (window.innerWidth >= 640) return;
              try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
              srcSheetStartRef.current = e.clientY;
              setSrcSheetDragging(true);
            }}
            onPointerMove={e => { if (srcSheetDragging) setSrcSheetDrag(e.clientY - srcSheetStartRef.current); }}
            onPointerUp={() => {
              if (!srcSheetDragging) return;
              const dy = srcSheetDrag;
              setSrcSheetDragging(false);
              setSrcSheetDrag(0);
              if (dy < -50) setSrcSheetExp(true);
              else if (dy > 50) { if (srcSheetExp) setSrcSheetExp(false); else setSourcingFormOpen(false); }
            }}
            onPointerCancel={() => { setSrcSheetDragging(false); setSrcSheetDrag(0); }}
          >
          <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-slate-950"><span className="w-12 h-1.5 rounded-full bg-surface" /></div>
          <div className="flex items-center justify-between px-4 py-2.5 sm:py-3 border-b border-line bg-gradient-to-l from-slate-950 to-slate-900 text-white">
            <div>
              <div className="text-[11px] text-slate-200 font-bold">🌍 اطلب منتجك من أي مكان</div>
              <div className="font-extrabold">ابعت طلبك</div>
            </div>
            <button type="button" onClick={() => setSourcingFormOpen(false)} className="hidden sm:flex w-10 h-10 rounded-xl bg-surface items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>
          </div>
          <div
            onScroll={e => { if (e.currentTarget.scrollTop > 30 && !srcSheetExp && window.innerWidth < 640) setSrcSheetExp(true); }}
            className="flex-1 overflow-y-auto p-4 space-y-3 text-xs"
          >
            <label className="block space-y-1 font-bold text-muted">
              اسم المنتج *
              <input type="text" value={srcForm.name} onChange={e => setSrcForm(p => ({ ...p, name: e.target.value }))} placeholder="مثلاً: شاحن أيفون أصلي 40W سريع (USB-C PD)" className="w-full px-3 py-2.5 rounded-xl border border-line" />
            </label>
            <label className="block space-y-1 font-bold text-muted">
              وصف المنتج والمواصفات *
              <textarea rows={4} value={srcForm.desc} onChange={e => setSrcForm(p => ({ ...p, desc: e.target.value }))} placeholder="اشرح بالتفصيل: الموديل، القدرة (وات)، اللون، الكمية، أو رابط المنتج لو معاك..." className="w-full px-3 py-2.5 rounded-xl border border-line" />
            </label>
            <label className="block space-y-1 font-bold text-muted">
              رقم الموبايل للتواصل *
              <input type="tel" inputMode="tel" value={srcForm.phone} onChange={e => setSrcForm(p => ({ ...p, phone: e.target.value }))} placeholder="01012345678" className="w-full px-3 py-2.5 rounded-xl border border-line" />
            </label>
            <div className="space-y-1.5">
              <div className="font-bold text-muted">صورة المنتج (اختياري — بتتضغط تلقائي)</div>
              <div className="flex items-center gap-3">
                {srcForm.image ? (
                  <div className="relative">
                    <img src={srcForm.image} alt="" className="w-20 h-20 rounded-xl object-cover border border-line" />
                    <button type="button" onClick={() => setSrcForm(p => ({ ...p, image: '' }))} className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="w-20 h-20 rounded-xl border-2 border-dashed border-line hover:border-slate-500 flex items-center justify-center text-3xl text-muted cursor-pointer">
                    +
                    <input type="file" accept="image/*" className="hidden" onChange={handleSrcFormImage} />
                  </label>
                )}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-surface2 border border-line text-fg leading-relaxed">
              <b>العربون:</b> {siteSettings.sourcingDepositInfo || DEFAULT_SOURCING_DEPOSIT_INFO}
            </div>
            <div className="rounded-xl border border-line bg-surface2 p-3 space-y-2">
              <div className="font-extrabold text-fg">شروط الخدمة</div>
              <div className="max-h-40 overflow-y-auto p-2.5 rounded-lg bg-surface border border-line text-[11px] leading-relaxed text-muted whitespace-pre-line">{termsText}</div>
              <label className="flex items-start gap-2 cursor-pointer font-bold text-fg">
                <input type="checkbox" checked={srcForm.accept} onChange={e => setSrcForm(p => ({ ...p, accept: e.target.checked }))} className="w-4 h-4 mt-0.5 accent-slate-600" />
                <span>قرأت شروط الخدمة وموافق عليها *</span>
              </label>
            </div>
          </div>
          <div className="shrink-0 p-3 border-t border-line bg-surface" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => setSourcingFormOpen(false)} className="py-3.5 rounded-xl bg-surface2 text-fg font-extrabold text-sm">
                إغلاق
              </button>
              <button type="submit" className="col-span-2 py-3.5 rounded-xl bg-gradient-to-l from-slate-600 to-slate-600 text-white font-extrabold text-sm">
                ابعت الطلب
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  
}

export function renderClientSourcingSection(ctx) {
  const { cancelSourcingByClient, currentClient, markSrcRead, openAdminCards, openSourcing, renderSrcChat, setConfirmDialog, setLightbox, siteSettings, sourcingRequests, toggleAdminCard } = ctx;
    const mine = sourcingRequests.filter(r => r.clientId === currentClient?.id);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-extrabold text-fg flex items-center gap-2">🌍 طلباتي من برّه ({mine.length})</h3>
          <button type="button" onClick={openSourcing} className="px-3.5 py-2 rounded-xl bg-slate-600 hover:bg-slate-700 text-white text-xs font-extrabold">
            + اطلب منتج جديد
          </button>
        </div>
        {mine.length === 0 && (
          <div className="p-4 rounded-2xl border border-dashed border-line text-center text-xs text-muted">
            مفيش طلبات من برّه لسه. دوس "اطلب منتج جديد" وابعتلنا اللي عايزه من أي مكان في العالم.
          </div>
        )}
        {mine.map(req => {
          const key = `src_${req.id}`;
          const open = !!openAdminCards[key];
          const stepIdx = SRC_STEPS.indexOf(req.status);
          const cancellable = !req.closed && ['جديد', 'قيد المراجعة', 'تم تحديد السعر', 'تم استلام العربون', 'جاري التجهيز'].includes(req.status);
          return (
            <div key={req.id} className="bg-surface rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  toggleAdminCard(key);
                  if (!open) markSrcRead(req.id, 'client');
                }}
                className="w-full flex items-center justify-between gap-2 p-4 text-right"
              >
                <span className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span className="font-mono text-xs font-extrabold text-fg">{req.id}</span>
                  <span className="text-xs font-bold text-muted truncate">{req.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${SRC_STATUS_STYLE[req.status] || 'bg-surface2'}`}>{req.status}</span>
                  {req.unreadClient && <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />}
                </span>
                <span className="w-7 h-7 shrink-0 rounded-lg bg-nav2 text-white flex items-center justify-center">
                  {open ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
              </button>
              {open && (
                <div className="px-4 pb-4 space-y-3 text-xs">
                  {req.status !== 'ملغي' && (
                    <div className="flex flex-wrap items-center gap-1.5 pb-1">
                      {SRC_STEPS.map((st, i) => (
                        <div key={st} className="flex items-center gap-1 shrink-0">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold ${i <= stepIdx ? 'bg-slate-600 text-white' : 'bg-surface2 text-muted'}`}>{st}</span>
                          {i < SRC_STEPS.length - 1 && <span className="text-muted">›</span>}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3">
                    {req.image && <img src={req.image} alt="" onClick={() => setLightbox({ list: [req.image], index: 0 })} className="w-20 h-20 rounded-xl object-cover border border-line cursor-pointer shrink-0" />}
                    <div className="space-y-1 min-w-0">
                      <div className="font-extrabold text-fg">{req.name}</div>
                      <div className="text-muted whitespace-pre-line leading-relaxed">{req.desc}</div>
                      <div className="text-[10px] text-muted">اتبعت: {req.createdAt} — موبايل: {req.phone}</div>
                    </div>
                  </div>
                  {req.price > 0 && (
                    <div className="p-3 rounded-xl bg-surface2 border border-line space-y-1.5">
                      <div className="flex justify-between font-extrabold text-fg">
                        <span>سعر المنتج المتفق عليه</span>
                        <span>{Number(req.price).toLocaleString()} ج.م</span>
                      </div>
                      {req.deposit > 0 && (
                        <div className="flex justify-between font-bold text-fg">
                          <span>العربون</span>
                          <span>{Number(req.deposit).toLocaleString()} ج.م</span>
                        </div>
                      )}
                      <div className="font-bold text-muted">حالة العربون: {SRC_DEPOSIT_LABEL[req.depositStatus] || '—'}</div>
                      {req.depositStatus === 'requested' && (
                        <div className="text-[11px] text-fg leading-relaxed">{siteSettings.sourcingDepositInfo || DEFAULT_SOURCING_DEPOSIT_INFO}</div>
                      )}
                      <div className="text-[10px] text-muted">العربون مسترد بالكامل لحد ما الطلب يتحوّل لـ "جاري التوصيل".</div>
                    </div>
                  )}
                  {renderSrcChat(req, 'client')}
                  {cancellable && (
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDialog({
                          title: 'إلغاء الطلب',
                          message: req.depositStatus === 'received' ? 'هتلغي الطلب والعربون هيتردلك.' : 'هتلغي الطلب؟',
                          confirmText: 'أيوه، الغي',
                          onConfirm: () => { cancelSourcingByClient(req); setConfirmDialog(null); }
                        })
                      }
                      className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 border border-rose-500/30 font-extrabold"
                    >
                      إلغاء الطلب
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  
}

export function renderAdminSourcing(ctx) {
  const { adminSaveSrcPrice, adminSetDeposit, adminSetSrcStatus, adminSourcingSubTab, adminToggleSrcImages, downloadImage, markSrcRead, openAdminCards, processAndUploadImage, renderAdminSubTabBar, renderSrcChat, reqAllImages, sbDelete, setAdminSourcingSubTab, setConfirmDialog, setLightbox, setSiteSettings, setSourcingRequests, setSrcFilter, setSrcPriceDraft, setSrcSettingsOpen, siteSettings, sourcingRequests, srcFilter, srcPriceDraft, srcSettingsOpen, toggleAdminCard } = ctx;
    const banner = getSourcingBanner(siteSettings);
    const setBanner = patch => setSiteSettings(prev => ({ ...prev, sourcingBanner: { ...getSourcingBanner(prev), ...patch } }));
    const active = r => !r.closed && !['تم التسليم', 'ملغي'].includes(r.status);
    const list = sourcingRequests.filter(r => (srcFilter === 'all' ? true : srcFilter === 'active' ? active(r) : !active(r)));
    const th = getAdTheme(banner);
    const seg = (label, key, options) => (
      <div className="space-y-1">
        <div className="font-bold text-muted">{label}</div>
        <div className="flex flex-wrap gap-1.5">
          {options.map(([val, txt]) => (
            <button key={String(val)} type="button" onClick={() => setBanner({ [key]: val })} className={`px-3 py-1.5 rounded-lg border font-bold ${banner[key] === val ? 'bg-nav2 text-white border-line' : 'bg-surface text-muted border-line'}`}>
              {txt}
            </button>
          ))}
        </div>
      </div>
    );
    const check = (label, key) => (
      <label className="flex items-center gap-2 font-bold text-muted cursor-pointer">
        <input type="checkbox" checked={banner[key] !== false} onChange={e => setBanner({ [key]: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
        {label}
      </label>
    );
    return (
      <div className="space-y-4">
        {renderAdminSubTabBar(
          [
            { id: 'requests', icon: '📦', label: 'طلبات الاستيراد ومحادثات العملاء', badge: sourcingRequests.length },
            { id: 'banner_terms', icon: '⚙️', label: 'تصميم البانر وشروط العربون' }
          ],
          adminSourcingSubTab,
          setAdminSourcingSubTab
        )}
        {adminSourcingSubTab === 'banner_terms' && (<>
        {/* Service settings */}
        <div className="rounded-2xl border border-line bg-surface p-4 space-y-3 text-xs">
          <button type="button" onClick={() => setSrcSettingsOpen(o => !o)} className="w-full flex items-center justify-between gap-2 font-extrabold text-fg">
            <span className="flex items-center gap-2">⚙️ إعدادات الخدمة (البنر، الشروط، العربون) {banner.active ? <span className="text-[11px] text-accent-text">(البنر ظاهر)</span> : <span className="text-[11px] text-muted">(البنر مخفي)</span>}</span>
            <span className="w-7 h-7 rounded-lg bg-nav2 text-white flex items-center justify-center">{srcSettingsOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}</span>
          </button>
          {srcSettingsOpen && (
            <div className="space-y-4">
              <div>
                <div className="font-bold text-muted mb-1.5">معاينة البنر (فوق البحث عند العميل):</div>
                <div style={{ background: th.cssGrad }} className={`relative rounded-3xl overflow-hidden ${th.light && banner.layout !== 'full' ? 'text-slate-900' : 'text-white'} p-5 sm:p-8 min-h-[220px] flex flex-col justify-center shadow-lg ${banner.active ? '' : 'opacity-50 grayscale'}`}>
                  <AdContent ad={{ ...banner, linkedPartId: 'x' }} rtl />
                </div>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {check('البنر ظاهر للعملاء', 'active')}
                {check('إظهار الشارة', 'showBadge')}
                {check('إظهار الزرار', 'showButton')}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" value={banner.title} onChange={e => setBanner({ title: e.target.value })} placeholder="العنوان" className="p-2.5 rounded-xl border border-line font-bold" />
                <input type="text" value={banner.subtitle} onChange={e => setBanner({ subtitle: e.target.value })} placeholder="الوصف" className="p-2.5 rounded-xl border border-line" />
                <input type="text" value={banner.badge} onChange={e => setBanner({ badge: e.target.value })} placeholder="الشارة" className="p-2.5 rounded-xl border border-line" />
                <input type="text" value={banner.buttonText} onChange={e => setBanner({ buttonText: e.target.value })} placeholder="نص الزرار" className="p-2.5 rounded-xl border border-line" />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                {banner.image ? <img src={banner.image} alt="" className="w-16 h-16 rounded-xl object-cover border border-line" /> : <div className="w-16 h-16 rounded-xl border-2 border-dashed border-line flex items-center justify-center text-muted">بدون</div>}
                <label className="px-3.5 py-2 rounded-xl bg-nav2 text-white font-bold cursor-pointer">
                  ارفع صورة
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async e => {
                      const file = e.target.files && e.target.files[0];
                      e.target.value = '';
                      if (!file) return;
                      const url = await processAndUploadImage(file, 'ads');
                      if (url) setBanner({ image: url, layout: banner.layout === 'text' ? 'blend' : banner.layout });
                    }}
                  />
                </label>
                {banner.image && <button type="button" onClick={() => setBanner({ image: '' })} className="px-3.5 py-2 rounded-xl bg-surface border border-line font-bold">شيل الصورة</button>}
              </div>
              {seg('قالب وشكل البنر (8 قوالب احترافية جاهزة)', 'layout', STUDIO_AD_LAYOUT_TEMPLATES)}
              <div className="space-y-1">
                <div className="font-bold text-muted">لون الخلفية</div>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(AD_THEMES).map(k => (
                    <button key={k} type="button" onClick={() => setBanner({ theme: k })} title={AD_THEMES[k].label} style={{ background: AD_THEMES[k].cssGrad }} className={`px-3 py-2 rounded-xl border-2 flex items-center gap-2 text-xs font-extrabold transition ${banner.theme === k ? 'border-[#2F6BB3] ring-2 ring-[#2F6BB3]/40 scale-105' : 'border-white/20 opacity-85 hover:opacity-100'} ${AD_THEMES[k].light ? 'text-slate-900' : 'text-white'}`}><span className="w-3.5 h-3.5 rounded-full border border-white/40" style={{ background: AD_THEMES[k].accentColor }} /><span>{AD_THEMES[k].label}</span></button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {seg('محاذاة النص', 'align', [['start', 'على الجنب'], ['center', 'في النص']])}
                {seg('عرض الصورة', 'imageFit', [['cover', 'تملا المساحة'], ['contain', 'كاملة من غير قص']])}
              </div>
              {banner.layout === 'full' && (
                <div className="space-y-1">
                  <div className="font-bold text-muted">تعتيم الصورة ({banner.overlay}%)</div>
                  <input type="range" min="0" max="90" value={banner.overlay} onChange={e => setBanner({ overlay: Number(e.target.value) })} className="w-full accent-blue-600" />
                </div>
              )}
              <div className="space-y-1">
                <div className="font-bold text-muted">شروط الخدمة (العميل لازم يوافق عليها):</div>
                <textarea rows={14} value={siteSettings.sourcingTerms || DEFAULT_SOURCING_TERMS} onChange={e => setSiteSettings(prev => ({ ...prev, sourcingTerms: e.target.value }))} className="w-full p-2.5 rounded-xl border border-line leading-relaxed" />
                <button type="button" onClick={() => setSiteSettings(prev => ({ ...prev, sourcingTerms: DEFAULT_SOURCING_TERMS }))} className="px-3 py-1.5 rounded-xl bg-surface2 font-bold">رجّع النص الأصلي</button>
              </div>
              <div className="space-y-1">
                <div className="font-bold text-muted">تعليمات دفع العربون (بتظهر للعميل):</div>
                <textarea rows={3} value={siteSettings.sourcingDepositInfo || DEFAULT_SOURCING_DEPOSIT_INFO} onChange={e => setSiteSettings(prev => ({ ...prev, sourcingDepositInfo: e.target.value }))} className="w-full p-2.5 rounded-xl border border-line" />
              </div>
              <p className="text-muted">بعد التعديل دوس "حفظ" فوق عشان يظهر للعملاء. النص ده صيغة عامة ومش بديل لمراجعة محامي.</p>
            </div>
          )}
        </div>

        </>)}
        {adminSourcingSubTab === 'requests' && (<>
        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-extrabold">
          {[['active', `شغّالة (${sourcingRequests.filter(active).length})`], ['closed', 'منتهية / ملغية'], ['all', 'الكل']].map(([k, t]) => (
            <button key={k} type="button" onClick={() => setSrcFilter(k)} className={`px-3.5 py-2 rounded-xl border ${srcFilter === k ? 'bg-nav2 text-white border-line' : 'bg-surface text-muted border-line'}`}>{t}</button>
          ))}
        </div>

        {list.length === 0 && <div className="p-8 text-center text-xs text-muted bg-surface rounded-2xl border border-line">مفيش طلبات هنا.</div>}

        {list.map(req => {
          const key = `src_${req.id}`;
          const open = !!openAdminCards[key];
          const draft = srcPriceDraft[req.id] || { price: req.price || '', deposit: req.deposit || '' };
          return (
            <div key={req.id} className="bg-surface rounded-2xl border border-line shadow-xs overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  toggleAdminCard(key);
                  if (!open) markSrcRead(req.id, 'admin');
                }}
                className="w-full flex items-center justify-between gap-2 p-4 text-right"
              >
                <span className="flex items-center gap-2 min-w-0 flex-wrap">
                  <span className="font-mono text-xs font-extrabold text-fg">{req.id}</span>
                  <span className="text-xs font-bold text-accent-text truncate">{req.clientName}</span>
                  <span className="text-xs text-muted truncate">— {req.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${SRC_STATUS_STYLE[req.status] || 'bg-surface2'}`}>{req.status}</span>
                  {req.depositStatus === 'refund_due' && <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white">رد العربون</span>}
                  {req.unreadAdmin && <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />}
                </span>
                <span className="w-7 h-7 shrink-0 rounded-lg bg-nav2 text-white flex items-center justify-center">{open ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}</span>
              </button>
              {open && (
                <div className="px-4 pb-4 space-y-3 text-xs">
                  <div className="flex gap-3">
                    {req.image && <img src={req.image} alt="" onClick={() => setLightbox({ list: [req.image], index: 0 })} className="w-24 h-24 rounded-xl object-cover border border-line cursor-pointer shrink-0" />}
                    <div className="space-y-1 min-w-0">
                      <div className="font-extrabold text-fg text-sm">{req.name}</div>
                      <div className="text-muted whitespace-pre-line leading-relaxed">{req.desc}</div>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <a href={`tel:${req.phone}`} className="px-2.5 py-1 rounded-lg bg-surface2 font-bold text-fg">📞 {req.phone}</a>
                        <a href={waLink(req.phone)} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded-lg bg-accent/15 text-accent-text border border-accent/30 font-bold">واتساب</a>
                        <span className="text-[10px] text-muted">{req.createdAt} • وافق على الشروط ✓</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end p-3 rounded-xl bg-surface2 border border-line">
                    <label className="space-y-1 font-bold text-fg">
                      السعر (ج.م)
                      <input type="number" min="0" value={draft.price} onChange={e => setSrcPriceDraft(prev => ({ ...prev, [req.id]: { ...draft, price: e.target.value } }))} className="w-full p-2 rounded-lg border border-line bg-bg text-fg" />
                    </label>
                    <label className="space-y-1 font-bold text-fg">
                      العربون (ج.م)
                      <input type="number" min="0" value={draft.deposit} onChange={e => setSrcPriceDraft(prev => ({ ...prev, [req.id]: { ...draft, deposit: e.target.value } }))} className="w-full p-2 rounded-lg border border-line bg-bg text-fg" />
                    </label>
                    <button type="button" onClick={() => adminSaveSrcPrice(req)} className="sm:col-span-2 py-2.5 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-extrabold">
                      احفظ السعر وبلّغ العميل
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <label className="font-bold text-muted flex items-center gap-2">
                      الحالة:
                      <select value={req.status} onChange={e => adminSetSrcStatus(req, e.target.value)} className="p-2 rounded-lg border border-line font-bold">
                        {SRC_STATUSES.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </label>
                    <span className="font-bold text-muted">العربون: <span className="text-accent-text">{SRC_DEPOSIT_LABEL[req.depositStatus] || '—'}</span></span>
                    <button type="button" onClick={() => adminSetDeposit(req, 'received')} className="px-3 py-1.5 rounded-lg bg-surface2 text-fg border border-line font-bold">استلمت العربون</button>
                    <button type="button" onClick={() => adminSetDeposit(req, 'refunded')} className="px-3 py-1.5 rounded-lg bg-surface2 text-fg border border-line font-bold">رجّعت العربون</button>
                    <button type="button" onClick={() => adminToggleSrcImages(req)} className={`px-3 py-1.5 rounded-lg border font-bold ${req.imagesAllowed ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-300' : 'bg-surface text-fg border-line'}`}>
                      {req.imagesAllowed ? '🔓 رفع الصور مفتوح للعميل (اقفله)' : '🔒 افتح رفع الصور للعميل'}
                    </button>
                  </div>

                  {reqAllImages(req).length > 0 && (
                    <div className="rounded-xl border border-line bg-surface2 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="font-extrabold text-muted">📷 كل الصور ({reqAllImages(req).length})</div>
                        <button
                          type="button"
                          onClick={async () => {
                            const all = reqAllImages(req);
                            for (let i = 0; i < all.length; i++) {
                              await downloadImage(all[i], `${req.id}-${i + 1}.jpg`);
                              await new Promise(r => setTimeout(r, 350));
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-nav2 text-white font-bold"
                        >
                          ⬇ حمّل كل الصور
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {reqAllImages(req).map((im, i, arr) => (
                          <div key={i} className="relative group">
                            <img src={im} alt="" onClick={() => setLightbox({ list: arr, index: i })} className="w-24 h-24 rounded-xl object-cover border border-line cursor-pointer" />
                            <button type="button" onClick={() => downloadImage(im, `${req.id}-${i + 1}.jpg`)} className="absolute bottom-1 left-1 w-7 h-7 rounded-full bg-nav2 text-white text-xs flex items-center justify-center" title="تحميل">⬇</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {renderSrcChat(req, 'admin')}

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-line font-extrabold">
                    <button type="button" onClick={() => setSourcingRequests(prev => prev.map(r => (r.id === req.id ? { ...r, closed: !r.closed } : r)))} className="px-3.5 py-2 rounded-xl bg-surface2 hover:bg-surface2 text-fg">
                      {req.closed ? 'افتح الطلب تاني' : 'اقفل الطلب'}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDialog({
                          title: 'مسح الطلب',
                          message: `هتمسح الطلب ${req.id} مع المحادثة نهائياً.`,
                          confirmText: 'امسح',
                          onConfirm: () => { setSourcingRequests(prev => prev.filter(r => r.id !== req.id)); sbDelete('sourcing_requests', req.id); setConfirmDialog(null); }
                        })
                      }
                      className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 border border-rose-500/30"
                    >
                      مسح الطلب
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        </>) }
      </div>
    );
  
}
