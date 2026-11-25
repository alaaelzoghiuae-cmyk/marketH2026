import { X, Download, Printer, Share2, Search, Shield, Bell, Minus, Plus, ShoppingCart, AlertTriangle, Trash2, Layers, Smartphone, Upload, Sparkles } from 'lucide-react';
import { ELZOGHBI_LOGO, PART_IMAGES, QUALITY_GRADE_SUGGESTIONS } from '../data/constants.jsx';
import { Edit3, generateAiProductDetails, getAdTheme } from '../lib/utils.jsx';
import { BlurFitImage, ClampedSpecsText } from '../components/widgets.jsx';
import { Bidi } from '../i18n.jsx';

export function renderPrintModal(ctx) {
  const { clients, handleDownloadInvoicePdf, handlePrintInvoice, printModalOrder, setPrintModalOrder, siteSettings } = ctx;
    if (!printModalOrder) return null;
    const { order, mode, isClientView } = printModalOrder;
    const effectiveMode = isClientView ? 'invoice' : mode;
    const clientObj = clients.find(c => c.id === order.clientId);
    const itemsSubtotalBase = order.items.reduce((s, i) => s + i.qty * i.unitPriceBase, 0);
    const totalBase = itemsSubtotalBase + order.deliveryFeeBase - order.discountBase;
    const totalPieces = order.items.reduce((s, i) => s + i.qty, 0);

    return (
      <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              {!isClientView ? (
                <>
                  <button
                    onClick={() => setPrintModalOrder({ order, mode: 'invoice', isClientView: false })}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                      effectiveMode === 'invoice'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    فاتورة مبيعات رسمية (A4 / PDF)
                  </button>
                  <button
                    onClick={() => setPrintModalOrder({ order, mode: 'picking', isClientView: false })}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                      effectiveMode === 'picking'
                        ? 'bg-slate-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    إذن تحضير مخزني (بدون أسعار لعمال المخزن)
                  </button>
                </>
              ) : (
                <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold">
                  نسخة الفاتورة الرسمية المعتمدة للعميل (بعد الاستلام)
                </span>
              )}
            </div>
            <button onClick={() => setPrintModalOrder(null)} className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* High-Contrast Professional Printable Sheet */}
          <div
            id="elzoghbi-printable-invoice-area"
            className="border-2 border-slate-900 rounded-2xl p-6 space-y-5 text-xs bg-white text-slate-900 shadow-inner"
          >
            {/* Invoice Top Letterhead with ELZOGHBI Official Logo */}
            <div className="flex flex-wrap justify-between items-start gap-4 border-b-2 border-slate-900 pb-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={ELZOGHBI_LOGO}
                  alt="ELZOGHBI Logo"
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-300 shadow-xs"
                />
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    {siteSettings.storeName || 'ELZOGHBI'} — {siteSettings.storeSubtitle || 'لأحدث المنتجات الأصلية والعروض الحصرية'}
                  </h2>
                  <p className="text-[11px] text-slate-600">
                    {effectiveMode === 'picking'
                      ? 'مستند داخلي للمخازن: إذن تحضير ومراجعة وفحص أصناف'
                      : `فاتورة مبيعات وضمان معتمدة — واتساب / خدمة العملاء: ${siteSettings.whatsappNumber || '01012345678'}`}
                  </p>
                </div>
              </div>

              <div className="text-left bg-slate-100 p-3 rounded-xl border border-slate-300">
                <div className="font-mono font-extrabold text-sm text-slate-900">
                  رقم الفاتورة: {order.id}
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">التاريخ: {order.createdAt}</div>
                <div className="text-[11px] font-bold text-emerald-700 mt-0.5">
                  حالة الطلب: {order.status}
                </div>
              </div>
            </div>

            {/* Client & Shipping Details Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <div className="text-[10px] text-slate-500 font-bold">بيانات المحل / العميل المستلم:</div>
                <div className="font-extrabold text-sm text-slate-900 mt-0.5">{order.clientName}</div>
                <div className="text-slate-700 mt-0.5">العنوان: {order.address}</div>
              </div>
              <div className="sm:text-left">
                <div className="text-[10px] text-slate-500 font-bold">تفاصيل الشحنة والسداد:</div>
                <div className="font-bold text-slate-900 mt-0.5">طريقة الدفع: {order.paymentMethod}</div>
                <div className="text-slate-700 mt-0.5">إجمالي عدد القطع بالفاتورة: <b>{totalPieces} قطع</b></div>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px]">
                    <th className="p-2.5 rounded-r-lg">#</th>
                    <th className="p-2.5">كود SKU</th>
                    <th className="p-2.5">بيان الصنف ودرجة الجودة</th>
                    <th className="p-2.5">اللون</th>
                    <th className="p-2.5 text-center">الكمية</th>
                    {effectiveMode === 'invoice' ? (
                      <>
                        <th className="p-2.5">سعر الوحدة</th>
                        <th className="p-2.5 rounded-l-lg">الإجمالي</th>
                      </>
                    ) : (
                      <th className="p-2.5 rounded-l-lg">مراجعة وفحص المخزن</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {order.items.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-500">{i + 1}</td>
                      <td className="p-2.5 font-mono font-bold text-slate-800">{item.sku}</td>
                      <td className="p-2.5 font-extrabold text-slate-900">
                        {item.name}
                        <span className="mr-1.5 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">
                          {item.qualityGrade}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-700">{item.color}</td>
                      <td className="p-2.5 text-center font-extrabold text-sm">{item.qty}</td>
                      {effectiveMode === 'invoice' ? (
                        <>
                          <td className="p-2.5 font-semibold">{item.unitPriceBase.toLocaleString()} ج.م</td>
                          <td className="p-2.5 font-extrabold text-slate-900">
                            {(item.qty * item.unitPriceBase).toLocaleString()} ج.م
                          </td>
                        </>
                      ) : (
                        <td className="p-2.5 font-mono text-[11px]">[ &nbsp; ] سليم ومختوم بختم الضمان</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary or Warehouse Signatures */}
            {effectiveMode === 'invoice' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t-2 border-slate-900 items-center">
                <div className="space-y-1 text-[11px] text-slate-600">
                  <div className="font-bold text-slate-900">شروط الضمان والاسترجاع ({siteSettings.storeName}):</div>
                  <p>• {siteSettings.returnPolicyText}</p>
                  <p>
                    • الموقف المالي الحالي للحساب:{' '}
                    <b className="text-slate-900">
                      {clientObj?.walletBalance >= 0 ? 'رصيد دائن لكم ' : 'مديونية عليكم '}
                      {Math.abs(clientObj?.walletBalance || 0).toLocaleString()} ج.م
                    </b>
                  </p>
                </div>

                <div className="bg-slate-100 p-3.5 rounded-xl border border-slate-300 space-y-1.5">
                  <div className="flex justify-between text-slate-700">
                    <span>إجمالي قيمة الأصناف:</span>
                    <span className="font-bold">{itemsSubtotalBase.toLocaleString()} ج.م</span>
                  </div>
                  {order.discountBase > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>الخصم المطبق:</span>
                      <span>-{order.discountBase.toLocaleString()} ج.م</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-700">
                    <span>رسوم الشحن والتوصيل:</span>
                    <span className="font-bold">{order.deliveryFeeBase.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1.5 border-t border-slate-300">
                    <span>الصافي النهائي للفاتورة:</span>
                    <span className="text-blue-700">{totalBase.toLocaleString()} ج.م</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t-2 border-slate-900 text-slate-700 flex flex-wrap justify-between gap-4">
                <span>توقيع محضر المخزن: ............................</span>
                <span>توقيع مسؤول الفحص والختم: ............................</span>
                <span>توقيع مندوب التوصيل: ............................</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2.5">
            <button
              onClick={() => handleDownloadInvoicePdf(order, effectiveMode)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 border-2 border-slate-900 text-sm font-extrabold flex items-center justify-center gap-2 transition"
            >
              <Download className="w-5 h-5" />
              تحميل PDF
            </button>
            <button
              onClick={() => handlePrintInvoice(order, effectiveMode)}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-extrabold flex items-center justify-center gap-2 shadow-md transition"
            >
              <Printer className="w-5 h-5" />
              طباعة الفاتورة
            </button>
          </div>
        </div>
      </div>
    );
  
}

export function renderProductOrAdDetailModal(ctx) {
  const { calculatePartPrice, cart, cartSummary, currencies, currentGroup, detailImageIdx, getPartImagesList, getPartQualityTiers, handleShareProduct, handleWaitlistRequest, models, parts, selectedColors, selectedDetailItem, selectedQualityTiers, setCart, setCartDrawerOpen, setCartQtyDirect, setDetailImageIdx, setLightbox, setSelectedColors, setSelectedDetailItem, setSheetDrag, setSheetDragging, setSheetExpanded, sharePartViaWhatsApp, sheetDrag, sheetDragging, sheetExpanded, sheetStartYRef, showToast, siteSettings, swipeProps, swipeSuppressRef, updateCartQty } = ctx;
    if (!selectedDetailItem) return null;
    const { type, part, ad } = selectedDetailItem;
    const targetPart = part || parts[0];
    const baseModalPriceInfo = calculatePartPrice(targetPart, currentGroup);
    const modalQualityTiers = getPartQualityTiers(targetPart, baseModalPriceInfo.baseEgpPrice);
    const activeModalTierId = selectedQualityTiers[targetPart.id] || cart[targetPart.id]?.qualityTier || 'original';
    const activeModalTierObj = (siteSettings.enableQualityTiers !== false && modalQualityTiers.find(t => t.id === activeModalTierId)) || modalQualityTiers[0];
    const modalCurrObj = currencies[currentGroup?.currency || 'EGP'] || currencies.EGP;
    const priceInfo = {
      ...baseModalPriceInfo,
      baseEgpPrice: activeModalTierObj.priceEgp,
      displayPrice: Number((activeModalTierObj.priceEgp * modalCurrObj.rateFromBase).toFixed(modalCurrObj.code === 'EGP' ? 0 : 2))
    };
    const inCartQty = cart[targetPart.id]?.qty || 0;
    const isOutOfStock = targetPart.stock <= 0 || !!targetPart.soldOut;
    const activeColor = selectedColors[targetPart.id] || cart[targetPart.id]?.color || targetPart.colors[0];
    const modelObj = models.find(m => m.id === targetPart.modelId);
    const imagesList = getPartImagesList(targetPart);
    const safeIdx = detailImageIdx % imagesList.length;
    const activeModalImg = imagesList[safeIdx] || targetPart.image;

    return (
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-md z-50 flex items-end sm:items-center justify-center sm:p-6 elz-modal-backdrop"
        onClick={() => setSelectedDetailItem(null)}
      >
        <div
          onClick={e => e.stopPropagation()}
          className="bg-bg text-fg w-full sm:max-w-5xl rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] elz-modal-panel max-h-[72vh] sm:max-h-[90vh] flex flex-col"
          style={
            window.innerWidth < 640
              ? (() => {
                  const vh = window.innerHeight / 100;
                  const h = Math.min(94 * vh, Math.max(32 * vh, (sheetExpanded ? 92 : 72) * vh - sheetDrag));
                  return { height: h, maxHeight: 'none', transition: sheetDragging ? 'none' : 'height 0.25s ease' };
                })()
              : undefined
          }
        >
          {/* شريط السحب: اسحبه لفوق يكبّر ولتحت يصغّر أو يقفل */}
          <div
            className="shrink-0 bg-surface select-none sm:cursor-default"
            style={{ touchAction: 'none' }}
            onPointerDown={e => {
              if (window.innerWidth >= 640) return;
              try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
              sheetStartYRef.current = e.clientY;
              setSheetDragging(true);
            }}
            onPointerMove={e => {
              if (!sheetDragging) return;
              setSheetDrag(e.clientY - sheetStartYRef.current);
            }}
            onPointerUp={() => {
              if (!sheetDragging) return;
              const dy = sheetDrag;
              setSheetDragging(false);
              setSheetDrag(0);
              if (dy < -50) setSheetExpanded(true);
              else if (dy > 50) {
                if (sheetExpanded) setSheetExpanded(false);
                else setSelectedDetailItem(null);
              }
            }}
            onPointerCancel={() => { setSheetDragging(false); setSheetDrag(0); }}
          >
          <div className="sm:hidden pt-2.5 pb-1 flex justify-center"><span className="w-12 h-1.5 rounded-full bg-line" /></div>
          {/* Sticky top bar */}
          <div className="flex items-center justify-between gap-2 px-5 sm:px-8 py-3 sm:py-4 border-b border-line/60 bg-bg/80 backdrop-blur">
            <div className="min-w-0">
              <div className="text-[11px] text-accent-text font-extrabold truncate">{targetPart.category}</div>
              <div className="font-semibold text-fg text-[15px] sm:text-[17px] truncate">{targetPart.name}</div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleShareProduct(targetPart)}
                className="w-10 h-10 rounded-full bg-surface hover:bg-surface2 text-fg flex items-center justify-center transition"
                title="شارك المنتج"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className="w-10 h-10 rounded-full bg-surface hover:bg-surface2 text-fg flex items-center justify-center transition"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          </div>

          {/* Top Ad Banner Header if opened from an Ad */}
          {type === 'ad' && ad && (
            <div className={`bg-gradient-to-l ${getAdTheme(ad).grad} ${getAdTheme(ad).light ? 'text-fg' : 'text-white'} px-6 py-4 flex items-center justify-between`}>
              <div>
                <span className="px-2.5 py-0.5 rounded bg-amber-400 text-accent-ink font-extrabold text-[11px]">
                  {ad.badge}
                </span>
                <h3 className="text-base font-extrabold mt-1">{ad.title}</h3>
                <p className="text-xs text-slate-300">{ad.subtitle}</p>
              </div>
            </div>
          )}


          {/* Scrollable body */}
          <div
            onScroll={e => { if (e.currentTarget.scrollTop > 30 && !sheetExpanded && window.innerWidth < 640) setSheetExpanded(true); }}
            className="flex-1 overflow-y-auto p-5 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-start"
          >
            {/* Large Product Image Preview */}
            <div className="space-y-3">
              <div
                {...swipeProps(
                  () => setDetailImageIdx(prev => (prev + 1) % imagesList.length),
                  () => setDetailImageIdx(prev => (prev - 1 + imagesList.length) % imagesList.length)
                )}
                onClick={() => {
                  if (swipeSuppressRef.current) return;
                  setLightbox({ list: imagesList, index: safeIdx });
                }}
                className="relative rounded-[28px] overflow-hidden bg-white dark:bg-white h-72 sm:h-[440px] p-4 cursor-zoom-in flex items-center justify-center"
              >
                <BlurFitImage src={activeModalImg} alt={targetPart.name} fit={targetPart.imageFit || siteSettings.productImageFit || "contain"} draggable={false} imgClassName="select-none max-h-full max-w-full" />
                <div className="absolute bottom-3 right-3 z-20 px-2.5 py-1 rounded-xl bg-nav/90 text-white text-[11px] font-bold flex items-center gap-1 shadow">
                  <Search className="w-3 h-3" /> دوس عشان تكبّر الصورة
                </div>
                {imagesList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setDetailImageIdx(prev => (prev - 1 + imagesList.length) % imagesList.length); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-nav/85 hover:bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-lg z-10 transition border border-white/20"
                      title="الصورة السابقة"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setDetailImageIdx(prev => (prev + 1) % imagesList.length); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-nav/85 hover:bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-lg z-10 transition border border-white/20"
                      title="الصورة التالية"
                    >
                      ›
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-nav/85 px-2.5 py-1 rounded-full z-10">
                      {imagesList.map((_, i) => (
                        <div
                          key={i}
                          onClick={e => { e.stopPropagation(); setDetailImageIdx(i); }}
                          className={`w-2 h-2 rounded-full cursor-pointer transition ${i === safeIdx ? 'bg-slate-400 w-4' : 'bg-surface/50'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
                <div className="absolute top-3 right-3 flex flex-wrap gap-1.5">
                  {priceInfo.hasDiscount && (
                    <span className="px-3 py-1 rounded-xl bg-rose-600 text-white text-xs font-black shadow">
                      خصم {priceInfo.discountPercent}%
                    </span>
                  )}
                  <span className="px-3 py-1 rounded-xl bg-nav/90 text-white text-xs font-extrabold">
                    {targetPart.qualityGrade}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-blue-600 text-white text-xs font-mono font-bold">
                    {targetPart.sku}
                  </span>
                </div>
              </div>

              {/* Clickable Multi-Image Thumbnail Strip so customer can flip between all product images effortlessly! */}
              {imagesList.length > 1 && (
                <div className="flex flex-wrap items-center gap-2 pb-1">
                  {imagesList.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setDetailImageIdx(idx)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                        idx === safeIdx
                          ? 'border-accent ring-2 ring-accent/30 scale-105'
                          : 'border-line opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={imgUrl} alt="" className="w-full h-full object-contain bg-surface2 p-1" />
                    </button>
                  ))}
                </div>
              )}

              {modelObj && (
                <div className="p-3 rounded-xl bg-surface2 border border-line flex items-center gap-3 text-xs">
                  <img
                    src={modelObj.image || PART_IMAGES.screen}
                    alt={modelObj.name}
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div>
                    <div className="text-muted">الموديل الأساسي:</div>
                    <div className="font-extrabold text-fg"><Bidi text={modelObj.brand} /> — <Bidi text={modelObj.name} /></div>
                  </div>
                </div>
              )}
            </div>


            {/* Product Specs */}
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-surface2 border border-line flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted font-bold">سعر الوحدة:</span>
                    {priceInfo.hasDiscount && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">
                        خصم {priceInfo.discountPercent}% (وفّر {(priceInfo.displayOldPrice - priceInfo.displayPrice).toLocaleString()} {priceInfo.currencySymbol})
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2.5 mt-0.5 flex-wrap">
                    <div className="text-2xl font-extrabold text-fg">
                      {priceInfo.displayPrice.toLocaleString()}{' '}
                      <span className="text-sm text-accent-text">{priceInfo.currencySymbol}</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => sharePartViaWhatsApp(targetPart, e)}
                      className="px-3 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white border border-emerald-500/30 text-[11px] font-extrabold inline-flex items-center gap-1 transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>شارك على واتساب</span>
                    </button>
                    {priceInfo.hasDiscount && (
                      <span className="text-sm font-bold font-mono text-muted line-through decoration-rose-500 decoration-2">
                        {priceInfo.displayOldPrice.toLocaleString()} {priceInfo.currencySymbol}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  {isOutOfStock ? (
                    <span className="px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30 font-extrabold">
                      {targetPart.soldOut ? 'تم البيع' : 'نفذت الكمية حالياً'}
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl bg-accent/15 text-accent-text border border-accent/30 font-extrabold">
                      متوفر بالمخزن ({targetPart.stock} قطع)
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="font-extrabold text-fg">المواصفات الفنية والتفاصيل:</div>
                <ClampedSpecsText text={targetPart.description} />
              </div>

              <div className="space-y-1.5">
                <div className="font-extrabold text-fg">الموديلات المتوافقة معها القطعة:</div>
                <div className="flex flex-wrap gap-1.5">
                  {targetPart.compatibleModels.map(cm => (
                    <span
                      key={cm}
                      className="px-2.5 py-1 rounded-lg bg-surface2 text-fg border border-line font-bold"
                    >
                      {cm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Color Selection */}
              <div className="space-y-1.5">
                <div className="font-extrabold text-fg">اختر اللون / النسخة:</div>
                <div className="flex flex-wrap gap-2">
                  {targetPart.colors.map(clr => (
                    <button
                      key={clr}
                      type="button"
                      onClick={() => {
                        setSelectedColors(prev => ({ ...prev, [targetPart.id]: clr }));
                        if (cart[targetPart.id]) {
                          setCart(prev => ({
                            ...prev,
                            [targetPart.id]: { ...prev[targetPart.id], color: clr }
                          }));
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold border transition ${
                        activeColor === clr
                          ? 'bg-accent text-accent-ink border-accent'
                          : 'bg-surface text-fg border-line'
                      }`}
                    >
                      {clr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-accent/15 border border-accent/30 text-fg flex items-center gap-2 font-semibold">
                <Shield className="w-4 h-4 text-accent-text shrink-0" />
                <span>{targetPart.warrantyText}</span>
              </div>

            </div>
          </div>

          {/* إغلاق ومشاركة: في نص الشاشة فوق السعر (موبايل) */}
          <div className="sm:hidden shrink-0 grid grid-cols-2 gap-2 px-4 py-2 bg-surface2 border-t border-line">
            <button
              type="button"
              onClick={() => setSelectedDetailItem(null)}
              className="py-2.5 rounded-xl bg-surface border border-line text-fg font-extrabold text-xs flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" /> إغلاق
            </button>
            <button
              type="button"
              onClick={() => handleShareProduct(targetPart)}
              className="py-2.5 rounded-xl bg-surface2 text-accent-text border border-line font-extrabold text-xs flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4" /> مشاركة
            </button>
          </div>

          {/* Sticky add-to-cart bar */}
          <div
            className="shrink-0 border-t border-line bg-surface px-4 pt-3 flex items-center gap-2.5"
            style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
          >
            {isOutOfStock ? (
              <button
                onClick={() => handleWaitlistRequest(targetPart.id)}
                className="w-full py-3 rounded-xl bg-amber-500 text-accent-ink font-extrabold flex items-center justify-center gap-2 text-xs"
              >
                <Bell className="w-4 h-4" />
                🔔 نبّهني على واتساب فور توفر المنتج بالمخزن
              </button>
            ) : (
              <>
                <div className="shrink-0">
                  <div className="text-[10px] text-muted">السعر</div>
                  <div className="font-extrabold text-fg text-sm whitespace-nowrap">
                    {priceInfo.displayPrice.toLocaleString()} <span className="text-accent-text text-xs">{priceInfo.currencySymbol}</span>
                  </div>
                </div>
                {inCartQty > 0 && (
                <div className="flex items-center bg-surface2 rounded-xl border border-line shrink-0">
                  <button
                    type="button"
                    onClick={() => updateCartQty(targetPart.id, -1)}
                    disabled={inCartQty === 0}
                    className="w-9 h-10 flex items-center justify-center text-fg disabled:opacity-30"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={inCartQty}
                    onFocus={e => e.target.select()}
                    onChange={e => setCartQtyDirect(targetPart.id, e.target.value)}
                    className="w-12 h-10 text-center font-extrabold text-sm bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => updateCartQty(targetPart.id, 1)}
                    className="w-9 h-10 flex items-center justify-center text-accent-text"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                )}
                {inCartQty === 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      updateCartQty(targetPart.id, 1);
                      showToast(`ضفنا "${targetPart.name}" للسلة`, 'success');
                    }}
                    className="flex-1 py-3 rounded-xl bg-go hover:opacity-95 text-go-ink font-extrabold text-xs shadow-md flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    إضافة للسلة
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDetailItem(null);
                      setCartDrawerOpen(true);
                    }}
                    className="flex-1 py-3 rounded-xl bg-accent hover:opacity-95 text-accent-ink font-extrabold text-xs shadow-md flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    عرض السلة ({cartSummary.totalQty})
                  </button>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    );
  
}

export function renderPartGroupPricesModal(ctx) {
  const { calculatePartPrice, groupModalSearchQuery, groups, partGroupPricesModalPart, parts, setGroupModalSearchQuery, setPartGroupPricesModalPart, setParts } = ctx;
    if (!partGroupPricesModalPart) return null;
    const part = parts.find(p => p.id === partGroupPricesModalPart);
    if (!part) return null;

    const matchingGroups = groups.filter(
      g =>
        !groupModalSearchQuery.trim() ||
        `${g.name} ${g.currency}`.toLowerCase().includes(groupModalSearchQuery.trim().toLowerCase())
    );

    return (
      <div className="fixed inset-0 bg-nav/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col text-xs">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="text-base font-extrabold text-fg">
                إدارة أسعار جميع المجموعات للصنف: <span className="text-accent-text">{part.name}</span>
              </h3>
              <p className="text-muted mt-0.5">
                سعر التكلفة: <b className="text-rose-500">{part.costPrice} ج.م</b> • السعر الأساسي: <b>{part.basePrice} ج.م</b>
              </p>
            </div>
            <button onClick={() => setPartGroupPricesModalPart(null)} className="p-1 text-muted">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={groupModalSearchQuery}
              onChange={e => setGroupModalSearchQuery(e.target.value)}
              placeholder="ابحث عن اسم المجموعة لتغيير سعرها فوراً (يدعم +20 مجموعة)..."
              className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-line font-bold"
            />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-line border border-line rounded-xl">
            {matchingGroups.map(g => {
              const calc = calculatePartPrice(part, g);
              return (
                <div key={g.id} className="p-3 flex items-center justify-between gap-3 hover:bg-surface2">
                  <div>
                    <div className="font-extrabold text-fg">{g.name}</div>
                    <div className="text-[11px] text-muted">
                      العملة: {g.currency} • يظهر للعميل: <b>{calc.displayPrice} {calc.currencySymbol}</b>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={
                        part.customGroupPrices?.[g.id] !== undefined
                          ? part.customGroupPrices[g.id]
                          : calc.baseEgpPrice
                      }
                      onChange={e => {
                        const val = Number(e.target.value);
                        setParts(prev =>
                          prev.map(p =>
                            p.id === part.id
                              ? {
                                  ...p,
                                  customGroupPrices: {
                                    ...(p.customGroupPrices || {}),
                                    [g.id]: val
                                  }
                                }
                              : p
                          )
                        );
                      }}
                      className={`w-28 px-3 py-1.5 rounded-xl border font-extrabold ${
                        calc.isBelowCost
                          ? 'border-rose-500 bg-bg text-fg'
                          : calc.hasCustomOverride
                          ? 'border-accent bg-bg text-fg'
                          : 'border-line'
                      }`}
                    />
                    <span className="text-muted font-bold">ج.م</span>
                    {calc.hasCustomOverride && (
                      <button
                        type="button"
                        onClick={() => {
                          setParts(prev =>
                            prev.map(p => {
                              if (p.id !== part.id) return p;
                              const copy = { ...(p.customGroupPrices || {}) };
                              delete copy[g.id];
                              return { ...p, customGroupPrices: copy };
                            })
                          );
                        }}
                        className="text-[11px] text-rose-600 hover:underline font-bold"
                      >
                        إعادة للافتراضي
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setPartGroupPricesModalPart(null)}
            className="w-full py-3 rounded-xl bg-accent text-accent-ink font-extrabold"
          >
            تم الحفظ وإغلاق النافذة
          </button>
        </div>
      </div>
    );
  
}

export function renderBrandManagerModal(ctx) {
  const { brandDeleteProtectionModal, brandManagerOpen, brands, editingBrandIdx, editingBrandText, isBrandHidden, models, newBrandInput, parts, setBrandDeleteProtectionModal, setBrandManagerOpen, setBrands, setEditingBrandIdx, setEditingBrandText, setModels, setNewBrandInput, setNewModelBrand, setParts, showToast, toggleHideBrand } = ctx;
    if (!brandManagerOpen) return null;

    const handleAddBrand = (e) => {
      e.preventDefault();
      const val = newBrandInput.trim();
      if (!val) return;
      if (brands.includes(val)) {
        showToast('هذه الماركة مسجلة بالفعل!', 'warning');
        return;
      }
      setBrands(prev => [...prev, val]);
      setNewModelBrand(val);
      setNewBrandInput('');
      showToast(`تمت إضافة ماركة "${val}" بنجاح!`, 'success');
    };

    const handleSaveBrandEdit = (idx) => {
      const oldBrand = brands[idx];
      const nextBrand = editingBrandText.trim();
      if (!nextBrand) return;
      setBrands(prev => prev.map((b, i) => (i === idx ? nextBrand : b)));
      setModels(prev => prev.map(m => (m.brand === oldBrand ? { ...m, brand: nextBrand } : m)));
      setEditingBrandIdx(null);
      showToast(`تم تعديل اسم الماركة من "${oldBrand}" إلى "${nextBrand}" وتحديث الموديلات التابعة لها!`, 'success');
    };

    const handleAttemptDeleteBrand = (brandName) => {
      const brandModels = models.filter(m => m.brand === brandName);
      const modelIds = new Set(brandModels.map(m => String(m.id)));
      const brandParts = parts.filter(p => modelIds.has(String(p.modelId)));

      if (brandModels.length > 0 || brandParts.length > 0) {
        const fallbackBrand = brands.find(b => b !== brandName) || 'أخرى';
        setBrandDeleteProtectionModal({
          brandName,
          affectedModelsCount: brandModels.length,
          affectedPartsCount: brandParts.length,
          targetBrand: fallbackBrand
        });
        return;
      }

      setBrands(prev => prev.filter(b => b !== brandName));
      showToast(`تم حذف ماركة "${brandName}" بنجاح.`, 'info');
    };

    return (
      <div className="fixed inset-0 bg-nav backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="text-base font-extrabold text-fg">
                إدارة الماركات والأقسام الرئيسية (إضافة / تعديل / حذف آمن)
              </h3>
              <p className="text-xs text-muted">
                عند محاولة حذف ماركة تحتوي على أقسام أو منتجات، سيظهر لك تحذير بـ 3 خيارات (مسح الكل، أو نقل وتعديل الماركة، أو إلغاء)
              </p>
            </div>
            <button onClick={() => setBrandManagerOpen(false)} className="p-1 text-muted">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3-Option Brand Delete Warning Box */}
          {brandDeleteProtectionModal && (
            <div className="p-4 rounded-2xl bg-surface2 border-2 border-rose-500 space-y-3 text-xs">
              <div className="flex items-start gap-2 text-fg">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm">
                    تحذير! الماركة "{brandDeleteProtectionModal.brandName}" مرتبطة ببيانات في المخزن
                  </h4>
                  <p className="mt-1">
                    تحتوي هذه الماركة على <b>{brandDeleteProtectionModal.affectedModelsCount} موديلات</b> و{' '}
                    <b>{brandDeleteProtectionModal.affectedPartsCount} منتجات</b> مسجلة. اختر الإجراء المناسب:
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-surface p-2.5 rounded-xl border border-rose-200">
                <span className="font-bold text-muted">نقل الموديلات والقطع إلى ماركة:</span>
                <select
                  value={brandDeleteProtectionModal.targetBrand}
                  onChange={e =>
                    setBrandDeleteProtectionModal(prev => ({ ...prev, targetBrand: e.target.value }))
                  }
                  className="flex-1 p-1.5 rounded-lg border border-line font-bold"
                >
                  {brands
                    .filter(b => b !== brandDeleteProtectionModal.brandName)
                    .map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const bName = brandDeleteProtectionModal.brandName;
                    const affectedModelIds = new Set(
                      models.filter(m => m.brand === bName).map(m => String(m.id))
                    );
                    setParts(prev => prev.filter(p => !affectedModelIds.has(String(p.modelId))));
                    setModels(prev => prev.filter(m => m.brand !== bName));
                    setBrands(prev => prev.filter(b => b !== bName));
                    setBrandDeleteProtectionModal(null);
                    showToast(`تم مسح الماركة "${bName}" وجميع الموديلات وقطع الغيار التابعة لها بالكامل.`, 'info');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold"
                >
                  1. مسح الماركة وقطعها
                </button>

                <button
                  type="button"
                  disabled={!brands.some(b => b === brandDeleteProtectionModal.targetBrand)}
                  onClick={() => {
                    const bName = brandDeleteProtectionModal.brandName;
                    const targetB = brandDeleteProtectionModal.targetBrand;
                    if (!brands.some(b => b === targetB)) {
                      showToast('⚠️ اختر ماركة حقيقية للنقل إليها الأول (مفيش ماركة تانية متاحة).', 'error');
                      return;
                    }
                    setModels(prev =>
                      prev.map(m => (m.brand === bName ? { ...m, brand: targetB } : m))
                    );
                    setBrands(prev => prev.filter(b => b !== bName));
                    setBrandDeleteProtectionModal(null);
                    showToast(`تم تعديل ونقل جميع الموديلات والقطع إلى ماركة "${targetB}" وحذف "${bName}" بأمان!`, 'success');
                  }}
                  className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  2. تعديل ونقل للماركة المختارة
                </button>

                <button
                  type="button"
                  onClick={() => setBrandDeleteProtectionModal(null)}
                  className="py-2.5 px-3 rounded-xl bg-surface2 hover:bg-surface2 text-fg font-extrabold"
                >
                  3. إلغاء الأمر
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleAddBrand} className="flex gap-2 text-xs">
            <input
              type="text"
              value={newBrandInput}
              onChange={e => setNewBrandInput(e.target.value)}
              placeholder="اكتب اسم الماركة الجديدة (مثال: Tecno أو Nothing Phone)..."
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-line font-bold"
            />
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold"
            >
              + إضافة الماركة
            </button>
          </form>

          <div className="flex-1 overflow-y-auto divide-y divide-line border border-line rounded-xl">
            {brands.map((b, idx) => {
              const bModels = models.filter(m => m.brand === b);
              const bModelIds = new Set(bModels.map(m => m.id));
              const bPartsCount = parts.filter(p => bModelIds.has(p.modelId)).length;
              return (
                <div key={b} className="p-3 flex items-center justify-between text-xs hover:bg-surface2">
                  {editingBrandIdx === idx ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingBrandText}
                        onChange={e => setEditingBrandText(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-blue-400 font-bold"
                      />
                      <button
                        onClick={() => handleSaveBrandEdit(idx)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold"
                      >
                        حفظ
                      </button>
                      <button
                        onClick={() => setEditingBrandIdx(null)}
                        className="px-2.5 py-1.5 rounded-lg bg-surface2 text-muted font-bold"
                      >
                        إلغاء
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-fg text-sm">{b}</span>
                        <span className="text-[11px] text-muted">
                          ({bModels.length} موديلات • {bPartsCount} منتج)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => toggleHideBrand(b, e)}
                          className={`px-2.5 py-1 rounded-lg font-extrabold border text-[11px] transition ${
                            isBrandHidden(b)
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-surface2 text-go border-line'
                          }`}
                        >
                          {isBrandHidden(b) ? '🚫 مخفي عن العميل' : '👁️ ظاهر للعميل'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingBrandIdx(idx);
                            setEditingBrandText(b);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-surface2 hover:bg-surface text-muted hover:text-accent-text font-bold flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          تعديل
                        </button>
                        <button
                          onClick={() => handleAttemptDeleteBrand(b)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-500 hover:text-white font-bold flex items-center gap-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          حذف
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  
}

export function renderTemplateManagerModal(ctx) {
  const { askConfirmDelete, autoTemplates, newTplBasePrice, newTplCategory, newTplCost, newTplImageKey, newTplNamePattern, newTplQuality, newTplSkuPrefix, newTplStock, setAutoTemplates, setNewTplBasePrice, setNewTplCategory, setNewTplCost, setNewTplImageKey, setNewTplNamePattern, setNewTplQuality, setNewTplSkuPrefix, setNewTplStock, setTemplateManagerOpen, showToast, templateManagerOpen } = ctx;
    if (!templateManagerOpen) return null;

    const handleAddTemplateItem = (e) => {
      e.preventDefault();
      if (!newTplNamePattern.trim()) return;
      const pattern = newTplNamePattern.includes('{model}')
        ? newTplNamePattern.trim()
        : `${newTplNamePattern.trim()} {model}`;

      const newTpl = {
        id: `tpl_${Date.now()}`,
        skuPrefix: newTplSkuPrefix.trim().toUpperCase() || 'PRT',
        category: newTplCategory.trim() || 'منتجات مختارة',
        namePattern: pattern,
        qualityGrade: newTplQuality,
        colors: ['أسود', 'أصلي'],
        warrantyText: 'ضمان تجربة 14 يوم قبل التركيب',
        imageKey: newTplImageKey,
        defaultStock: Number(newTplStock) || 10,
        lowStockThreshold: 5,
        maxOrderQty: 10,
        costPrice: Number(newTplCost) || 100,
        basePrice: Number(newTplBasePrice) || 200,
        enabled: true
      };
      setAutoTemplates(prev => [...prev, newTpl]);
      setNewTplNamePattern('');
      showToast('تمت إضافة البند الجديد إلى التمبلت التلقائي!', 'success');
    };

    return (
      <div className="fixed inset-0 bg-nav backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl max-w-5xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <div>
              <h3 className="text-base font-extrabold text-fg flex items-center gap-2">
                <Layers className="w-5 h-5 text-slate-600" />
                إدارة وتخصيص التمبلت التلقائي لقطع الغيار (Auto-Template Builder)
              </h3>
              <p className="text-xs text-muted">
                حدد وعدّل القطع القياسية التي تنزل أوتوماتيكياً بمجرد إضافة أي موديل جديد
              </p>
            </div>
            <button onClick={() => setTemplateManagerOpen(false)} className="p-1 text-muted">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleAddTemplateItem} className="bg-surface2 p-4 rounded-xl border border-line space-y-3 text-xs">
            <div className="font-extrabold text-fg">
              + إضافة قطعة غيار جديدة لقائمة التمبلت التلقائي (استخدم رمز {'{model}'} ليتم استبداله باسم الموديل):
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
              <input
                type="text"
                value={newTplCategory}
                onChange={e => setNewTplCategory(e.target.value)}
                placeholder="التصنيف"
                className="p-2 rounded-lg border border-line bg-surface font-bold"
              />
              <input
                type="text"
                required
                value={newTplNamePattern}
                onChange={e => setNewTplNamePattern(e.target.value)}
                placeholder="الاسم (مثال: فلاتة باور {model})"
                className="md:col-span-2 p-2 rounded-lg border border-line bg-surface font-bold"
              />
              <div>
                <input
                  type="text"
                  list="quality-grade-datalist"
                  value={newTplQuality}
                  onChange={e => setNewTplQuality(e.target.value)}
                  placeholder="درجة الجودة (اكتب أو اختر)..."
                  className="w-full p-2 rounded-lg border border-line bg-surface font-bold"
                />
                <datalist id="quality-grade-datalist">
                  {QUALITY_GRADE_SUGGESTIONS.map(s => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div className="flex gap-1">
                <input
                  type="number"
                  value={newTplCost}
                  onChange={e => setNewTplCost(e.target.value)}
                  placeholder="التكلفة"
                  className="w-1/2 p-2 rounded-lg border border-line bg-surface"
                />
                <input
                  type="number"
                  value={newTplBasePrice}
                  onChange={e => setNewTplBasePrice(e.target.value)}
                  placeholder="البيع"
                  className="w-1/2 p-2 rounded-lg border border-line bg-surface font-bold"
                />
              </div>
              <button
                type="submit"
                className="p-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white font-extrabold"
              >
                + إضافة للتمبلت
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="text"
                value={newTplSkuPrefix}
                onChange={e => setNewTplSkuPrefix(e.target.value)}
                placeholder="بادئة كود SKU (مثال: GLS-ORG)"
                className="p-2 rounded-lg border border-line bg-surface font-bold"
              />
              <input
                type="number"
                min={0}
                value={newTplStock}
                onChange={e => setNewTplStock(e.target.value)}
                placeholder="المخزون الافتراضي عند التوليد"
                className="p-2 rounded-lg border border-line bg-surface font-bold"
              />
              <select
                value={newTplImageKey}
                onChange={e => setNewTplImageKey(e.target.value)}
                className="p-2 rounded-lg border border-line bg-surface font-bold"
              >
                <option value="screen">صورة افتراضية: شاشة</option>
                <option value="battery">صورة افتراضية: بطارية</option>
                <option value="flex">صورة افتراضية: فلاتة</option>
                <option value="camera">صورة افتراضية: كاميرا</option>
                <option value="logo">صورة افتراضية: لوجو المتجر</option>
              </select>
            </div>
          </form>

          <div className="flex-1 overflow-y-auto border border-line rounded-xl">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-surface2 text-muted border-b border-line">
                  <th className="p-2.5">مفعل؟</th>
                  <th className="p-2.5">بادئة الكود</th>
                  <th className="p-2.5">التصنيف</th>
                  <th className="p-2.5">نمط اسم القطعة</th>
                  <th className="p-2.5">درجة الجودة</th>
                  <th className="p-2.5">الرصيد الافتراضي</th>
                  <th className="p-2.5">التكلفة</th>
                  <th className="p-2.5">سعر البيع</th>
                  <th className="p-2.5">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {autoTemplates.map(tpl => (
                  <tr key={tpl.id} className={tpl.enabled ? 'bg-surface' : 'bg-surface2 opacity-60'}>
                    <td className="p-2.5">
                      <input
                        type="checkbox"
                        checked={tpl.enabled}
                        onChange={e => {
                          const checked = e.target.checked;
                          setAutoTemplates(prev =>
                            prev.map(t => (t.id === tpl.id ? { ...t, enabled: checked } : t))
                          );
                        }}
                        className="w-4 h-4 accent-slate-600 cursor-pointer"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={tpl.skuPrefix}
                        onChange={e => {
                          const val = e.target.value;
                          setAutoTemplates(prev =>
                            prev.map(t => (t.id === tpl.id ? { ...t, skuPrefix: val } : t))
                          );
                        }}
                        className="w-20 px-2 py-1 rounded border border-line font-mono text-[11px]"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={tpl.category}
                        onChange={e => {
                          const val = e.target.value;
                          setAutoTemplates(prev =>
                            prev.map(t => (t.id === tpl.id ? { ...t, category: val } : t))
                          );
                        }}
                        className="w-28 px-2 py-1 rounded border border-line font-bold"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="text"
                        value={tpl.namePattern}
                        onChange={e => {
                          const val = e.target.value;
                          setAutoTemplates(prev =>
                            prev.map(t => (t.id === tpl.id ? { ...t, namePattern: val } : t))
                          );
                        }}
                        className="w-full min-w-[220px] px-2.5 py-1 rounded border border-line font-bold text-fg"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="text"
                        list="quality-grade-datalist"
                        value={tpl.qualityGrade}
                        onChange={e => {
                          const val = e.target.value;
                          setAutoTemplates(prev =>
                            prev.map(t => (t.id === tpl.id ? { ...t, qualityGrade: val } : t))
                          );
                        }}
                        placeholder="اكتب درجة الجودة..."
                        className="w-40 px-2 py-1 rounded border border-line font-bold"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        value={tpl.defaultStock}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setAutoTemplates(prev =>
                            prev.map(t => (t.id === tpl.id ? { ...t, defaultStock: val } : t))
                          );
                        }}
                        className="w-16 px-2 py-1 rounded border border-line font-bold"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        value={tpl.costPrice}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setAutoTemplates(prev =>
                            prev.map(t => (t.id === tpl.id ? { ...t, costPrice: val } : t))
                          );
                        }}
                        className="w-20 px-2 py-1 rounded border border-line font-mono text-fg bg-bg"
                      />
                    </td>
                    <td className="p-2.5">
                      <input
                        type="number"
                        value={tpl.basePrice}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setAutoTemplates(prev =>
                            prev.map(t => (t.id === tpl.id ? { ...t, basePrice: val } : t))
                          );
                        }}
                        className="w-20 px-2 py-1 rounded border border-line font-extrabold text-fg"
                      />
                    </td>
                    <td className="p-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          askConfirmDelete(
                            'حذف بند من التمبلت التلقائي',
                            `هل أنت متأكد من حذف البند "${tpl.namePattern}" من التمبلت؟`,
                            () => setAutoTemplates(prev => prev.filter(t => t.id !== tpl.id))
                          )
                        }
                        className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-500 hover:text-white transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setTemplateManagerOpen(false)}
              className="px-6 py-2.5 rounded-xl bg-nav2 text-white text-xs font-extrabold"
            >
              حفظ وإغلاق نافذة التمبلت
            </button>
          </div>
        </div>
      </div>
    );
  
}

export function renderBrandImageModal(ctx) {
  const { brands, editingBrandImageFor, processAndUploadImage, sbUpsert, setBrandImages, setEditingBrandImageFor, showToast } = ctx;
    if (!editingBrandImageFor) return null;
    const { brandName, imageUrl } = editingBrandImageFor;

    const handleUploadBrandLocalImg = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      showToast('جاري ضغط وتجهيز صورة البراند...', 'info');
      const uploadedUrl = await processAndUploadImage(file, 'brands');
      if (uploadedUrl) {
        setEditingBrandImageFor(prev => (prev ? { ...prev, imageUrl: uploadedUrl } : prev));
        showToast('تم تجهيز صورة البراند بنجاح ✓', 'success');
      }
    };

    const handleSaveBrandImage = (e) => {
      e.preventDefault();
      const trimmedUrl = (imageUrl || '').trim();
      setBrandImages(prev => {
        const next = { ...prev };
        if (trimmedUrl) next[brandName] = trimmedUrl;
        else delete next[brandName];
        try { window.localStorage.setItem('elzoghbi_v2_brandImages', JSON.stringify(next)); } catch (err) {}
        return next;
      });
      sbUpsert('brands', [{ name: brandName, sort_order: Math.max(0, brands.indexOf(brandName)), image_url: trimmedUrl }]);
      setEditingBrandImageFor(null);
      showToast(`تم حفظ صورة براند "${brandName}" بنجاح ✓`, 'success');
    };

    return (
      <div className="fixed inset-0 bg-nav backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <form onSubmit={handleSaveBrandImage} className="bg-surface rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-xs">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="text-sm font-extrabold text-fg">
              صورة البراند: <span className="text-slate-600">{brandName}</span> (صورة واحدة للبراند)
            </h3>
            <button type="button" onClick={() => setEditingBrandImageFor(null)} className="p-1 text-muted hover:text-muted">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface2 border border-line">
            <div className="w-16 h-16 rounded-xl bg-surface border border-line overflow-hidden flex items-center justify-center shrink-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={brandName}
                  loading="lazy"
                  onError={e => { e.currentTarget.src = PART_IMAGES.screen; }}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <Smartphone className="w-7 h-7 text-muted" />
              )}
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="font-extrabold text-fg">مرونة كاملة (رابط خارجي أو رفع محلي):</div>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-nav2 hover:bg-nav2 text-white font-bold cursor-pointer transition">
                <Upload className="w-3.5 h-3.5" />
                <span>أو رفع صورة محلية للبراند</span>
                <input type="file" accept="image/*" onChange={handleUploadBrandLocalImg} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="font-extrabold text-fg block mb-1">
              الرابط الخارجي المباشر لصورة البراند (External Image URL):
            </label>
            <input
              type="text"
              dir="ltr"
              value={imageUrl}
              onChange={e => setEditingBrandImageFor(prev => (prev ? { ...prev, imageUrl: e.target.value } : prev))}
              placeholder="https://example.com/brand-logo.webp"
              className="w-full p-2.5 rounded-xl border border-line font-mono text-fg"
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-extrabold">
              حفظ صورة البراند ✓
            </button>
            {imageUrl && (
              <button
                type="button"
                onClick={() => setEditingBrandImageFor(prev => (prev ? { ...prev, imageUrl: '' } : prev))}
                className="px-3.5 py-2.5 rounded-xl bg-rose-500/15 text-rose-500 font-bold"
              >
                مسح
              </button>
            )}
          </div>
        </form>
      </div>
    );
  
}

export function renderAddPartToModelModal(ctx) {
  const { addingPartToModel, clients, markLocalUpsert, processAndUploadImage, saveSiteSettingsImmediate, setAddingPartToModel, setNotifications, setParts, showToast, siteSettings } = ctx;
    if (!addingPartToModel) return null;

    const getFourSlots = (obj) => {
      const list = Array.isArray(obj.imagesList) ? [...obj.imagesList] : [];
      if (list.length === 0 && (obj.image_url || obj.customImage)) {
        list.push(obj.image_url || obj.customImage);
      }
      while (list.length < 8) list.push('');
      return list.slice(0, 8);
    };

    const fourSlots = getFourSlots(addingPartToModel);

    const setSlotUrl = (slotIdx, urlVal) => {
      setAddingPartToModel(prev => {
        if (!prev) return prev;
        const slots = getFourSlots(prev);
        slots[slotIdx] = urlVal;
        const nonEmpty = slots.map(s => s.trim()).filter(Boolean);
        return {
          ...prev,
          image_url: slots[0]?.trim() || nonEmpty[0] || '',
          customImage: slots[0]?.trim() || nonEmpty[0] || '',
          imagesList: slots
        };
      });
    };

    const handleUploadSlotImage = async (slotIdx, e) => {
      const files = Array.from(e.target.files || []).slice(0, Math.max(0, 8 - slotIdx));
      if (files.length === 0) return;
      showToast('جاري ضغط وتجهيز الصورة محلياً...', 'info');
      for (let i = 0; i < files.length; i++) {
        const uploadedUrl = await processAndUploadImage(files[i], 'parts');
        if (uploadedUrl) {
          setSlotUrl(Math.min(7, slotIdx + i), uploadedUrl);
        }
      }
      showToast('تم رفع وتجهيز الصورة بنجاح ✓', 'success');
    };

    const handleSaveNewPart = (e) => {
      e.preventDefault();
      const colorsArr = (addingPartToModel.colorsText || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const compatArr = (addingPartToModel.compatibleText || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const cleanImages = fourSlots.map(s => String(s || '').trim()).filter(Boolean).slice(0, 8);
      const primaryImgUrl =
        cleanImages[0] ||
        (addingPartToModel.image_url || '').trim() ||
        addingPartToModel.customImage ||
        PART_IMAGES[addingPartToModel.imageKey] ||
        PART_IMAGES.screen;

      const finalImgsList = cleanImages.length > 0 ? cleanImages : [primaryImgUrl];
      const parsedOldPrice = Number(addingPartToModel.oldPrice) > 0 ? Number(addingPartToModel.oldPrice) : 0;
      const isHiddenFlag = Boolean(addingPartToModel.hidden);
      const newPartId = `prt_${Date.now()}`;

      const newPart = {
        id: newPartId,
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        sku: (addingPartToModel.sku || '').trim() || `PRT-${Date.now()}`,
        modelId: addingPartToModel.model.id,
        category: addingPartToModel.category,
        name: addingPartToModel.name.trim(),
        qualityGrade: addingPartToModel.qualityGrade,
        colors: colorsArr.length > 0 ? colorsArr : ['قياسي'],
        compatibleModels: compatArr.length > 0 ? compatArr : [addingPartToModel.model.name],
        searchAliases: `${addingPartToModel.name} ${addingPartToModel.model.name} ${addingPartToModel.category}`,
        warrantyText: addingPartToModel.warrantyText,
        description: addingPartToModel.description || `${addingPartToModel.name} (${addingPartToModel.qualityGrade})`,
        image_url: primaryImgUrl,
        imageUrl: primaryImgUrl,
        image: primaryImgUrl,
        imageFit: addingPartToModel.imageFit || siteSettings.productImageFit || 'contain',
        images: finalImgsList,
        stock: Number(addingPartToModel.stock) || 0,
        lowStockThreshold: Number(addingPartToModel.lowStockThreshold) || 5,
        maxOrderQty: Number(addingPartToModel.maxOrderQty) || 10,
        costPrice: Number(addingPartToModel.costPrice) || 0,
        basePrice: Number(addingPartToModel.basePrice) || 0,
        oldPrice: parsedOldPrice,
        hidden: isHiddenFlag,
        _isCustomUploaded: true,
        cashbackEnabled: Boolean(addingPartToModel.cashbackEnabled),
        cashbackPct: Number(addingPartToModel.cashbackPct) || Number(siteSettings.defaultCashbackPct) || 2,
        isVipOnly: Boolean(addingPartToModel.isVipOnly),
        vipPrice: Number(addingPartToModel.vipPrice) || 0,
        customGroupPrices: {
          _images: finalImgsList,
          _oldPrice: parsedOldPrice,
          _hidden: isHiddenFlag,
          _cashbackEnabled: Boolean(addingPartToModel.cashbackEnabled),
          _cashbackPct: Number(addingPartToModel.cashbackPct) || Number(siteSettings.defaultCashbackPct) || 2,
          _isVipOnly: Boolean(addingPartToModel.isVipOnly),
          _vipPrice: Number(addingPartToModel.vipPrice) || 0,
          _tierOriginalPrice: Number(addingPartToModel.basePrice) || 0,
          _tierFirstClassPrice: Number(addingPartToModel.tierFirstClassPrice) || 0,
          _tierEconomyPrice: Number(addingPartToModel.tierEconomyPrice) || 0
        },
        waitlistCount: 0
      };

      setParts(prev => [newPart, ...prev]);
      markLocalUpsert('parts', newPart);
      saveSiteSettingsImmediate(prev => ({
        ...prev,
        hiddenPartIds: isHiddenFlag
          ? Array.from(new Set([...(prev.hiddenPartIds || []), newPartId]))
          : (prev.hiddenPartIds || []),
        cashbackPartMap: {
          ...(prev.cashbackPartMap || {}),
          [newPartId]: Boolean(addingPartToModel.cashbackEnabled)
        },
        partExtraMeta: {
          ...(prev.partExtraMeta || {}),
          [newPartId]: {
            images: finalImgsList,
            oldPrice: parsedOldPrice,
            cashbackEnabled: Boolean(addingPartToModel.cashbackEnabled),
            cashbackPct: Number(addingPartToModel.cashbackPct) || 2,
            isVipOnly: Boolean(addingPartToModel.isVipOnly),
            vipPrice: Number(addingPartToModel.vipPrice) || 0
          }
        }
      }));

      // Automatically notify all customers who saved this model in their Family Devices ("موبايلي وموبايل مراتي وأخويا")!
      if (siteSettings.enableFamilySavedDevices !== false) {
        const famNotifs = [];
        clients.forEach(cli => {
          (cli.savedFamilyDevices || []).forEach(dev => {
            if (String(dev.modelId) === String(addingPartToModel.model.id)) {
              famNotifs.push({
                id: `ntf_fam_${Date.now()}_${cli.id}`,
                target: cli.id,
                type: 'family_arrival',
                title: `🎉 نزل منتج جديد لـ (${dev.ownerLabel})!`,
                msg: `توفر الآن "${newPart.name}" مناسب لـ ${dev.ownerLabel} (${dev.modelName}) بسعر ${newPart.basePrice} ج.م!`,
                time: 'الآن',
                read: false
              });
            }
          });
        });
        if (famNotifs.length > 0) {
          setNotifications(prev => [...famNotifs, ...prev]);
        }
      }
      setAddingPartToModel(null);
      showToast(`تمت إضافة "${newPart.name}" داخل موديل "${addingPartToModel.model.name}" بنجاح!`, 'success');
    };

    const previewImg =
      fourSlots.map(s => s.trim()).find(Boolean) ||
      PART_IMAGES[addingPartToModel.imageKey] ||
      PART_IMAGES.screen;

    return (
      <div className="fixed inset-0 bg-nav backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
        <form
          onSubmit={handleSaveNewPart}
          className="bg-surface rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-xs"
        >
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="text-base font-extrabold text-fg">
              إضافة منتج جديد داخل: <span className="text-slate-600">{addingPartToModel.model.name}</span>
            </h3>
            <button type="button" onClick={() => setAddingPartToModel(null)} className="p-1.5 rounded-lg bg-surface2 hover:bg-rose-500/15 text-muted hover:text-rose-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 4-Slot Product Image Manager: External URL (image_url) OR Local Upload */}
          <div className="p-4 rounded-2xl bg-surface2 border border-line space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={previewImg}
                  alt="معاينة القطعة"
                  loading="lazy"
                  onError={e => { e.currentTarget.src = PART_IMAGES.screen; }}
                  className="w-14 h-14 rounded-xl object-contain border border-line bg-surface p-1"
                />
                <div>
                  <div className="font-extrabold text-fg">
                    صور المنتج (حتى 8 صور لكل منتج — رابط خارجي مباشر `image_url` أو رفع محلي):
                  </div>
                  <div className="text-[11px] text-muted">
                    الصق رابط الصورة الخارجي مباشرة (مثل علي بابا أو CDN بدون استهلاك تخزين) أو ارفع صورة من جهازك
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {[0, 1, 2, 3, 4, 5, 6, 7].map(slotIdx => (
                <div key={slotIdx} className="p-2.5 rounded-xl bg-surface border border-line space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[11px] text-fg">
                      {slotIdx === 0 ? '⭐ الصورة 1 الأساسية (image_url):' : `الصورة الإضافية ${slotIdx + 1}:`}
                    </span>
                    <div className="flex items-center gap-1">
                      <label className="px-2 py-0.5 rounded-lg bg-nav2 hover:bg-nav2 text-white text-[10px] font-bold cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>رفع محلي</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleUploadSlotImage(slotIdx, e)}
                          className="hidden"
                        />
                      </label>
                      {fourSlots[slotIdx] && (
                        <button
                          type="button"
                          onClick={() => setSlotUrl(slotIdx, '')}
                          className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 text-[10px] font-bold"
                        >
                          مسح
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <img
                      src={fourSlots[slotIdx] || PART_IMAGES.screen}
                      alt=""
                      loading="lazy"
                      onError={e => { e.currentTarget.src = PART_IMAGES.screen; }}
                      className="w-9 h-9 rounded-lg object-contain border border-line bg-surface2 shrink-0"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={fourSlots[slotIdx]}
                      onChange={e => setSlotUrl(slotIdx, e.target.value)}
                      placeholder="https://... الصق الرابط الخارجي للصورة"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-line font-mono text-[11px] text-fg"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="font-bold text-muted">عرض الصورة في الكارت:</span>
              {[['contain', 'كاملة من غير قص'], ['cover', 'تملا المساحة']].map(([val, txt]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAddingPartToModel(prev => ({ ...prev, imageFit: val }))}
                  className={`px-3 py-1 rounded-lg border font-bold ${
                    (addingPartToModel.imageFit || siteSettings.productImageFit || 'contain') === val
                      ? 'bg-accent text-accent-ink border-accent'
                      : 'bg-surface text-fg border-line'
                  }`}
                >
                  {txt}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label className="font-bold text-muted">اسم المنتج:</label>
                <button
                  type="button"
                  onClick={() => {
                    const ai = generateAiProductDetails(
                      addingPartToModel.name,
                      addingPartToModel.model?.name || '',
                      addingPartToModel.model?.brand || '',
                      addingPartToModel.category
                    );
                    setAddingPartToModel(prev => ({
                      ...prev,
                      category: ai.category || prev.category,
                      qualityGrade: ai.qualityGrade || prev.qualityGrade,
                      warrantyText: ai.warrantyText || prev.warrantyText,
                      colorsText: ai.colorsText || prev.colorsText,
                      compatibleText: ai.compatibleText || prev.compatibleText,
                      description: ai.description
                    }));
                    showToast('تم توليد الوصف وتعبئة المواصفات والضمان بالذكاء الاصطناعي ✓', 'success');
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#0071E3] to-slate-600 hover:from-[#0071E3] hover:to-slate-500 text-white text-[11px] font-black shadow-md shadow-blue-600/25 flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>توليد الوصف وتعبئة الخانات بالذكاء الاصطناعي (AI)</span>
                </button>
              </div>
              <input
                type="text"
                required
                value={addingPartToModel.name}
                onChange={e => setAddingPartToModel(prev => ({ ...prev, name: e.target.value }))}
                placeholder="اكتب اسم المنتج ثم اضغط زر الذكاء الاصطناعي..."
                className="w-full p-2.5 rounded-xl border border-line font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">التصنيف:</label>
              <input
                type="text"
                value={addingPartToModel.category}
                onChange={e => setAddingPartToModel(prev => ({ ...prev, category: e.target.value }))}
                placeholder="إلكترونيات، مستلزمات ذكية، إكسسوارات، عروض خاصة..."
                className="w-full p-2.5 rounded-xl border border-line font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">كود الصنف (SKU):</label>
              <input
                type="text"
                value={addingPartToModel.sku}
                onChange={e => setAddingPartToModel(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line font-mono"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-bold text-muted block">درجة الجودة (اكتبها يدوياً أو اختر من المقترحات):</label>
              <input
                type="text"
                required
                value={addingPartToModel.qualityGrade}
                onChange={e => setAddingPartToModel(prev => ({ ...prev, qualityGrade: e.target.value }))}
                placeholder="اكتب درجة الجودة (مثال: أصلي توكيل، سعة أصلية 100%، أوليد، High Copy، خلع جهاز...)"
                className="w-full p-2.5 rounded-xl border border-line font-bold"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-muted font-bold">مقترحات:</span>
                {QUALITY_GRADE_SUGGESTIONS.map(sug => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setAddingPartToModel(prev => ({ ...prev, qualityGrade: sug }))}
                    className="px-2 py-0.5 rounded-lg bg-surface2 hover:bg-surface text-muted hover:text-accent-text text-[10px] font-bold transition"
                  >
                    + {sug}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">سعر التكلفة (ج.م):</label>
              <input
                type="number"
                value={addingPartToModel.costPrice}
                onChange={e => setAddingPartToModel(prev => ({ ...prev, costPrice: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line font-mono text-fg font-bold bg-bg"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">سعر البيع الأساسي (ج.م):</label>
              <input
                type="number"
                value={addingPartToModel.basePrice}
                onChange={e => setAddingPartToModel(prev => ({ ...prev, basePrice: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line font-extrabold"
              />
            </div>

            <div>
              <label className="font-bold text-rose-500 dark:text-rose-400 block mb-1">
                السعر قبل الخصم (اختياري — للخصم المشطوب):
              </label>
              <input
                type="number"
                min="0"
                value={addingPartToModel.oldPrice || ''}
                onChange={e => setAddingPartToModel(prev => ({ ...prev, oldPrice: e.target.value }))}
                placeholder="اتركه فارغاً إذا لم يوجد خصم..."
                className="w-full p-2.5 rounded-xl border border-rose-500/40 font-mono font-extrabold"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 font-extrabold text-fg cursor-pointer select-none p-2.5 rounded-xl bg-surface2 border border-line w-full">
                <input
                  type="checkbox"
                  checked={!!addingPartToModel.hidden}
                  onChange={e => setAddingPartToModel(prev => ({ ...prev, hidden: e.target.checked }))}
                  className="w-4 h-4 accent-rose-600"
                />
                <span>🚫 إخفاء هذا المنتج عن واجهة العميل مؤقتاً</span>
              </label>
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">الكمية المتاحة بالمخزن:</label>
              <input
                type="number"
                value={addingPartToModel.stock}
                onChange={e => setAddingPartToModel(prev => ({ ...prev, stock: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line font-extrabold"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">الألوان (مفصولة بفاصلة):</label>
              <input
                type="text"
                value={addingPartToModel.colorsText}
                onChange={e => setAddingPartToModel(prev => ({ ...prev, colorsText: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-muted block mb-1">شروط وفترة الضمان (تظهر بوضوح للعميل):</label>
              <input
                type="text"
                value={addingPartToModel.warrantyText || ''}
                onChange={e => setAddingPartToModel(prev => ({ ...prev, warrantyText: e.target.value }))}
                placeholder="مثال: ضمان 6 شهور استبدال فوري ضد الانتفاخ، أو ضمان معاينة وتجربة 14 يوم بحالته الأصلية..."
                className="w-full p-2.5 rounded-xl border border-line font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-muted block mb-1">المواصفات الفنية والتفاصيل:</label>
              <textarea
                rows={2}
                value={addingPartToModel.description || ''}
                onChange={e => setAddingPartToModel(prev => ({ ...prev, description: e.target.value }))}
                placeholder="اكتب كافة المواصفات والتفاصيل والمميزات التي تهم العميل..."
                className="w-full p-2.5 rounded-xl border border-line"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-muted block mb-1">الموديلات المتوافقة معها (مفصولة بفاصلة):</label>
              <input
                type="text"
                value={addingPartToModel.compatibleText}
                onChange={e => setAddingPartToModel(prev => ({ ...prev, compatibleText: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-extrabold"
          >
            حفظ وإدراج المنتج الآن ✓
          </button>
        </form>
      </div>
    );
  
}

export function renderEditPartModal(ctx) {
  const { editingPartObj, models, processAndUploadImage, saveSiteSettingsImmediate, setEditingPartObj, setParts, showToast, siteSettings } = ctx;
    if (!editingPartObj) return null;

    const getEditFourSlots = (obj) => {
      const baseArr = Array.isArray(obj.imagesList) && obj.imagesList.length > 0
        ? [...obj.imagesList]
        : [obj.image_url || obj.imageUrl || obj.image || ''].filter(Boolean);
      while (baseArr.length < 8) baseArr.push('');
      return baseArr.slice(0, 8);
    };

    const editFourSlots = getEditFourSlots(editingPartObj);

    const setEditSlotUrl = (slotIdx, urlVal) => {
      setEditingPartObj(prev => {
        if (!prev) return prev;
        const slots = getEditFourSlots(prev);
        slots[slotIdx] = urlVal;
        const nonEmpty = slots.map(s => s.trim()).filter(Boolean);
        const primary = slots[0]?.trim() || nonEmpty[0] || '';
        return {
          ...prev,
          image_url: primary,
          imageUrl: primary,
          image: primary,
          imagesList: slots
        };
      });
    };

    const handleEditSlotUpload = async (slotIdx, e) => {
      const files = Array.from(e.target.files || []).slice(0, Math.max(0, 8 - slotIdx));
      if (files.length === 0) return;
      showToast('جاري ضغط وتجهيز الصورة محلياً...', 'info');
      for (let i = 0; i < files.length; i++) {
        const uploadedUrl = await processAndUploadImage(files[i], 'parts');
        if (uploadedUrl) {
          setEditSlotUrl(Math.min(7, slotIdx + i), uploadedUrl);
        }
      }
      showToast('تم رفع وتجهيز الصورة بنجاح ✓', 'success');
    };

    const handleSaveEditedPart = (e) => {
      e.preventDefault();
      const colorsArr = (editingPartObj.colorsText || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const compatArr = (editingPartObj.compatibleText || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const cleanImages = editFourSlots.map(s => String(s || '').trim()).filter(Boolean).slice(0, 8);
      const primaryImgUrl = cleanImages[0] || editingPartObj.image_url || editingPartObj.image || PART_IMAGES.screen;
      const finalImgsList = cleanImages.length > 0 ? cleanImages : [primaryImgUrl];
      const parsedOldPrice = Number(editingPartObj.oldPrice) > 0 ? Number(editingPartObj.oldPrice) : 0;
      const isHiddenFlag = Boolean(editingPartObj.hidden);
      const targetPid = String(editingPartObj.id);

      setParts(prev =>
        prev.map(p =>
          p.id === editingPartObj.id
            ? {
                ...p,
                name: editingPartObj.name,
                sku: editingPartObj.sku,
                modelId: editingPartObj.modelId || p.modelId,
                category: editingPartObj.category,
                qualityGrade: editingPartObj.qualityGrade,
                warrantyText: editingPartObj.warrantyText !== undefined ? editingPartObj.warrantyText : p.warrantyText,
                description: editingPartObj.description !== undefined ? editingPartObj.description : p.description,
                image_url: primaryImgUrl,
                imageUrl: primaryImgUrl,
                image: primaryImgUrl,
                imageFit: editingPartObj.imageFit || p.imageFit || siteSettings.productImageFit || 'contain',
                images: finalImgsList,
                stock: Number(editingPartObj.stock),
                costPrice: Number(editingPartObj.costPrice),
                basePrice: Number(editingPartObj.basePrice),
                oldPrice: parsedOldPrice,
                cashbackEnabled: Boolean(editingPartObj.cashbackEnabled),
                cashbackPct: Number(editingPartObj.cashbackPct) || 2,
                isVipOnly: Boolean(editingPartObj.isVipOnly),
                vipPrice: Number(editingPartObj.vipPrice) || 0,
                tierOriginalPrice: Number(editingPartObj.basePrice) || 0,
                tierFirstClassPrice: Number(editingPartObj.tierFirstClassPrice) || 0,
                tierEconomyPrice: Number(editingPartObj.tierEconomyPrice) || 0,
                hidden: isHiddenFlag,
                _isCustomUploaded: true,
                customGroupPrices: {
                  ...(p.customGroupPrices || {}),
                  _images: finalImgsList,
                  _oldPrice: parsedOldPrice,
                  _hidden: isHiddenFlag,
                  _cashbackEnabled: Boolean(editingPartObj.cashbackEnabled),
                  _cashbackPct: Number(editingPartObj.cashbackPct) || 2,
                  _isVipOnly: Boolean(editingPartObj.isVipOnly),
                  _vipPrice: Number(editingPartObj.vipPrice) || 0,
                  _tierOriginalPrice: Number(editingPartObj.basePrice) || 0,
                  _tierFirstClassPrice: Number(editingPartObj.tierFirstClassPrice) || 0,
                  _tierEconomyPrice: Number(editingPartObj.tierEconomyPrice) || 0
                },
                colors: colorsArr.length > 0 ? colorsArr : ['قياسي'],
                compatibleModels: compatArr.length > 0 ? compatArr : p.compatibleModels
              }
            : p
        )
      );
      saveSiteSettingsImmediate(prev => {
        const curHidden = Array.isArray(prev.hiddenPartIds) ? prev.hiddenPartIds : [];
        const nextHidden = isHiddenFlag
          ? Array.from(new Set([...curHidden, targetPid]))
          : curHidden.filter(id => String(id) !== targetPid);
        return {
          ...prev,
          hiddenPartIds: nextHidden,
          cashbackPartMap: {
            ...(prev.cashbackPartMap || {}),
            [targetPid]: Boolean(editingPartObj.cashbackEnabled)
          },
          partExtraMeta: {
            ...(prev.partExtraMeta || {}),
            [targetPid]: {
              ...(prev.partExtraMeta?.[targetPid] || {}),
              images: finalImgsList,
              oldPrice: parsedOldPrice,
              cashbackEnabled: Boolean(editingPartObj.cashbackEnabled),
              cashbackPct: Number(editingPartObj.cashbackPct) || 2,
              isVipOnly: Boolean(editingPartObj.isVipOnly),
              vipPrice: Number(editingPartObj.vipPrice) || 0,
              tierOriginalPrice: Number(editingPartObj.basePrice) || 0,
              tierFirstClassPrice: Number(editingPartObj.tierFirstClassPrice) || 0,
              tierEconomyPrice: Number(editingPartObj.tierEconomyPrice) || 0
            }
          }
        };
      });
      setEditingPartObj(null);
      showToast('تم حفظ تعديلات وروابط صور المنتج بنجاح ✓', 'success');
    };

    const currentPreview = editFourSlots.map(s => s.trim()).find(Boolean) || PART_IMAGES.screen;

    return (
      <div className="fixed inset-0 bg-nav backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
        <form
          onSubmit={handleSaveEditedPart}
          className="bg-surface rounded-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="text-base font-extrabold text-fg">تعديل بيانات وصور المنتج (حتى 8 صور)</h3>
            <button type="button" onClick={() => setEditingPartObj(null)} className="p-1.5 rounded-lg bg-surface2 hover:bg-rose-500/15 text-muted hover:text-rose-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 4-Slot Product Image Editor: External URL (image_url) OR Local Upload */}
          <div className="p-4 rounded-2xl bg-surface2 border border-line space-y-3">
            <div className="flex items-center gap-3">
              <img
                src={currentPreview}
                alt={editingPartObj.name}
                loading="lazy"
                onError={e => { e.currentTarget.src = PART_IMAGES.screen; }}
                className="w-14 h-14 rounded-xl object-contain border border-line bg-surface p-1"
              />
              <div>
                <div className="font-extrabold text-fg">
                  روابط وصور المنتج (حتى 8 صور — رابط خارجي مباشر `image_url` أو رفع محلي):
                </div>
                <div className="text-[11px] text-muted">
                  الصق رابط الصورة الخارجي مباشرة (صفر استهلاك تخزين وEgress) أو ارفع صورة من جهازك
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[0, 1, 2, 3, 4, 5, 6, 7].map(slotIdx => (
                <div key={slotIdx} className="p-2.5 rounded-xl bg-surface border border-line space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[11px] text-fg">
                      {slotIdx === 0 ? '⭐ الصورة 1 الأساسية (image_url):' : `الصورة الإضافية ${slotIdx + 1}:`}
                    </span>
                    <div className="flex items-center gap-1">
                      <label className="px-2 py-0.5 rounded-lg bg-nav2 hover:bg-nav2 text-white text-[10px] font-bold cursor-pointer flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>رفع محلي</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => handleEditSlotUpload(slotIdx, e)}
                          className="hidden"
                        />
                      </label>
                      {editFourSlots[slotIdx] && (
                        <button
                          type="button"
                          onClick={() => setEditSlotUrl(slotIdx, '')}
                          className="px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-500 text-[10px] font-bold"
                        >
                          مسح
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <img
                      src={editFourSlots[slotIdx] || PART_IMAGES.screen}
                      alt=""
                      loading="lazy"
                      onError={e => { e.currentTarget.src = PART_IMAGES.screen; }}
                      className="w-9 h-9 rounded-lg object-contain border border-line bg-surface2 shrink-0"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={editFourSlots[slotIdx]}
                      onChange={e => setEditSlotUrl(slotIdx, e.target.value)}
                      placeholder="https://... الصق الرابط الخارجي للصورة"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-line font-mono text-[11px] text-fg"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="font-bold text-muted">عرض الصورة في الكارت:</span>
              {[['contain', 'كاملة من غير قص'], ['cover', 'تملا المساحة']].map(([val, txt]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setEditingPartObj(prev => ({ ...prev, imageFit: val }))}
                  className={`px-3 py-1 rounded-lg border font-bold ${
                    (editingPartObj.imageFit || siteSettings.productImageFit || 'contain') === val
                      ? 'bg-accent text-accent-ink border-accent'
                      : 'bg-surface text-fg border-line'
                  }`}
                >
                  {txt}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label className="font-bold text-muted">اسم القطعة / المنتج:</label>
                <button
                  type="button"
                  onClick={() => {
                    const mdl = models.find(m => String(m.id) === String(editingPartObj.modelId));
                    const ai = generateAiProductDetails(
                      editingPartObj.name,
                      mdl?.name || '',
                      mdl?.brand || '',
                      editingPartObj.category
                    );
                    setEditingPartObj(prev => ({
                      ...prev,
                      category: prev.category || ai.category,
                      qualityGrade: prev.qualityGrade || ai.qualityGrade,
                      warrantyText: prev.warrantyText || ai.warrantyText,
                      colorsText: prev.colorsText || ai.colorsText,
                      compatibleText: prev.compatibleText || ai.compatibleText,
                      description: ai.description
                    }));
                    showToast('تم توليد وصف جديد وتعبئة الخانات الفاضية فقط — بيانات المنتج الحالية لم تتغير.', 'success');
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#0071E3] to-slate-600 hover:from-[#0071E3] hover:to-slate-500 text-white text-[11px] font-black shadow-md shadow-blue-600/25 flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>توليد الوصف والمواصفات بالذكاء الاصطناعي (AI)</span>
                </button>
              </div>
              <input
                type="text"
                value={editingPartObj.name}
                onChange={e => setEditingPartObj(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">الموديل المرتبط:</label>
              <select
                value={editingPartObj.modelId || ''}
                onChange={e => setEditingPartObj(prev => ({ ...prev, modelId: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line font-bold bg-surface"
              >
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.brand} — {m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">التصنيف:</label>
              <input
                type="text"
                value={editingPartObj.category}
                onChange={e => setEditingPartObj(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">سعر التكلفة (ج.م):</label>
              <input
                type="number"
                value={editingPartObj.costPrice ?? 0}
                onChange={e => setEditingPartObj(prev => ({ ...prev, costPrice: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line font-mono text-fg font-bold bg-bg"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">سعر البيع الأساسي (ج.م):</label>
              <input
                type="number"
                value={editingPartObj.basePrice ?? 0}
                onChange={e => setEditingPartObj(prev => ({ ...prev, basePrice: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line font-extrabold text-fg bg-bg"
              />
            </div>

            <div>
              <label className="font-bold text-rose-500 dark:text-rose-400 block mb-1">
                السعر قبل الخصم (اختياري — للخصم المشطوب):
              </label>
              <input
                type="number"
                min="0"
                value={editingPartObj.oldPrice ?? ''}
                onChange={e => setEditingPartObj(prev => ({ ...prev, oldPrice: e.target.value }))}
                placeholder="اتركه فارغاً إذا لم يوجد خصم..."
                className="w-full p-2.5 rounded-xl border border-rose-500/40 font-mono font-extrabold text-fg bg-bg"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 font-extrabold text-fg cursor-pointer select-none p-2.5 rounded-xl bg-surface2 border border-line w-full">
                <input
                  type="checkbox"
                  checked={!!editingPartObj.hidden}
                  onChange={e => setEditingPartObj(prev => ({ ...prev, hidden: e.target.checked }))}
                  className="w-4 h-4 accent-rose-600"
                />
                <span>🚫 إخفاء هذا المنتج عن واجهة العميل</span>
              </label>
            </div>

            {/* Per-Product Cashback, VIP & 3 Quality Tiers Price Box */}
            <div className="sm:col-span-2 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface border border-line font-black cursor-pointer">
                  <span>💰 تفعيل الكاش باك على هذا المنتج:</span>
                  <input
                    type="checkbox"
                    checked={Boolean(editingPartObj.cashbackEnabled)}
                    onChange={e => setEditingPartObj(prev => ({ ...prev, cashbackEnabled: e.target.checked, cashbackPct: prev.cashbackPct || 2 }))}
                    className="w-4 h-4 accent-emerald-600"
                  />
                </label>
                {editingPartObj.cashbackEnabled && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-muted shrink-0">نسبة الكاش باك (%):</span>
                    <input
                      type="number"
                      min="1"
                      max="25"
                      value={editingPartObj.cashbackPct ?? 2}
                      onChange={e => setEditingPartObj(prev => ({ ...prev, cashbackPct: e.target.value }))}
                      className="w-full p-2 rounded-xl border border-line font-mono font-black"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surface border border-line font-black cursor-pointer">
                  <span>👑 منتج VIP فقط (يظهر في قسم الـ VIP):</span>
                  <input
                    type="checkbox"
                    checked={Boolean(editingPartObj.isVipOnly)}
                    onChange={e => setEditingPartObj(prev => ({ ...prev, isVipOnly: e.target.checked }))}
                    className="w-4 h-4 accent-amber-500"
                  />
                </label>
                {editingPartObj.isVipOnly && (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-muted shrink-0">سعر الـ VIP الخاص (ج.م):</span>
                    <input
                      type="number"
                      min="0"
                      value={editingPartObj.vipPrice ?? ''}
                      onChange={e => setEditingPartObj(prev => ({ ...prev, vipPrice: e.target.value }))}
                      placeholder="فارغ = السعر العادي"
                      className="w-full p-2 rounded-xl border border-line font-mono font-black"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-line">
                <div>
                  <label className="text-[10px] font-bold text-muted block mb-1">سعر الأصلي 100% (ج.م):</label>
                  <input
                    type="number"
                    value={editingPartObj.basePrice ?? 0}
                    onChange={e => setEditingPartObj(prev => ({ ...prev, basePrice: e.target.value }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted block mb-1">⭐ سعر الفرز الأول (اختياري):</label>
                  <input
                    type="number"
                    value={editingPartObj.tierFirstClassPrice ?? ''}
                    onChange={e => setEditingPartObj(prev => ({ ...prev, tierFirstClassPrice: e.target.value }))}
                    placeholder="اتركه فارغاً للحساب التلقائي"
                    className="w-full p-2 rounded-xl border border-line font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted block mb-1">💡 سعر الاقتصادي (اختياري):</label>
                  <input
                    type="number"
                    value={editingPartObj.tierEconomyPrice ?? ''}
                    onChange={e => setEditingPartObj(prev => ({ ...prev, tierEconomyPrice: e.target.value }))}
                    placeholder="اتركه فارغاً للحساب التلقائي"
                    className="w-full p-2 rounded-xl border border-line font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">الكمية بالمخزن:</label>
              <input
                type="number"
                value={editingPartObj.stock ?? 0}
                onChange={e => setEditingPartObj(prev => ({ ...prev, stock: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line font-extrabold"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">كود الصنف (SKU):</label>
              <input
                type="text"
                value={editingPartObj.sku || ''}
                onChange={e => setEditingPartObj(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line font-mono"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-bold text-muted block">درجة الجودة:</label>
              <input
                type="text"
                required
                value={editingPartObj.qualityGrade}
                onChange={e => setEditingPartObj(prev => ({ ...prev, qualityGrade: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-muted block mb-1">شروط وفترة الضمان:</label>
              <input
                type="text"
                value={editingPartObj.warrantyText || ''}
                onChange={e => setEditingPartObj(prev => ({ ...prev, warrantyText: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-muted block mb-1">المواصفات الفنية والتفاصيل:</label>
              <textarea
                rows={2}
                value={editingPartObj.description || ''}
                onChange={e => setEditingPartObj(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">الألوان (مفصولة بفاصلة):</label>
              <input
                type="text"
                value={editingPartObj.colorsText}
                onChange={e => setEditingPartObj(prev => ({ ...prev, colorsText: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">الموديلات المتوافقة:</label>
              <input
                type="text"
                value={editingPartObj.compatibleText}
                onChange={e => setEditingPartObj(prev => ({ ...prev, compatibleText: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line"
              />
            </div>
          </div>

          <button type="submit" className="w-full py-3 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-extrabold">
            حفظ التعديلات وروابط الصور ✓
          </button>
        </form>
      </div>
    );
  
}

export function renderEditModelModal(ctx) {
  const { brands, editingModelObj, processAndUploadImage, setEditingModelObj, setModels, showToast } = ctx;
    if (!editingModelObj) return null;

    const handleEditModelImageUpload = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const uploadedUrl = await processAndUploadImage(file, 'models');
      if (uploadedUrl) {
        setEditingModelObj(prev => (prev ? { ...prev, image: uploadedUrl } : prev));
        showToast('تم ضغط ورفع صورة الموديل بنجاح ✓', 'success');
      }
    };

    const handleSaveModel = (e) => {
      e.preventDefault();
      setModels(prev =>
        prev.map(m => (m.id === editingModelObj.id ? { ...editingModelObj } : m))
      );
      setEditingModelObj(null);
      showToast('تم تحديث بيانات وصورة الموديل بنجاح!', 'success');
    };

    return (
      <div className="fixed inset-0 bg-nav backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <form
          onSubmit={handleSaveModel}
          className="bg-surface rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs"
        >
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h3 className="text-base font-extrabold text-fg">تعديل بيانات وصورة الموديل</h3>
            <button type="button" onClick={() => setEditingModelObj(null)} className="p-1 text-muted">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Model Image Upload */}
          <div className="p-3.5 rounded-xl bg-surface2 border border-line flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src={editingModelObj.image || PART_IMAGES.screen}
                alt={editingModelObj.name}
                className="w-12 h-12 rounded-xl object-cover border border-line bg-nav2"
              />
              <span className="font-bold text-fg">صورة الموديل:</span>
            </div>
            <label className="px-3 py-2 rounded-xl bg-nav2 text-white font-bold cursor-pointer flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" />
              رفع صورة
              <input
                type="file"
                accept="image/*"
                onChange={handleEditModelImageUpload}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <label className="font-bold text-muted block mb-1">الماركة / النوع:</label>
            <select
              value={editingModelObj.brand}
              onChange={e => setEditingModelObj(prev => ({ ...prev, brand: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-line font-bold"
            >
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-bold text-muted block mb-1">اسم الموديل:</label>
            <input
              type="text"
              required
              value={editingModelObj.name}
              onChange={e => setEditingModelObj(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-line font-bold"
            />
          </div>
          <div>
            <label className="font-bold text-muted block mb-1">مرادفات البحث والأكواد:</label>
            <input
              type="text"
              value={editingModelObj.aliases || ''}
              onChange={e => setEditingModelObj(prev => ({ ...prev, aliases: e.target.value }))}
              className="w-full p-2.5 rounded-xl border border-line"
            />
          </div>
          <button type="submit" className="w-full py-3 rounded-xl bg-blue-600 text-white font-extrabold">
            حفظ تعديلات وصورة الموديل
          </button>
        </form>
      </div>
    );
  
}
