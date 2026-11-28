import { Share2, Bell, ShoppingCart, Plus, Minus, ChevronDown, ChevronLeft, Search, Shield, Phone, User, X, RefreshCw, CheckCircle2, Truck, Sparkles, Filter, Award, Clock, MapPin } from 'lucide-react';
import { buildHomeSectionCss } from '../lib/adminControlCenter.js';
import { OR_BRAND_IMAGES } from '../orCatalogData';
import React from 'react';
import { DEFAULT_HOME_SHORTCUT_ICONS, ELZOGHBI_LOGO, PART_IMAGES, SHORTCUT_ICON_PRESETS } from '../data/constants.jsx';
import { AdContent, BlurFitImage, ImageViewer } from '../components/widgets.jsx';
import { Bidi } from '../i18n.jsx';
import { adInSchedule, getAdTheme, getSourcingBanner } from '../lib/utils.jsx';
import { AppleAdMosaic } from '../components/AppleAds.jsx';
import { AppleCardsCarousel, ClassicHeroBanner } from '../components/AdsShowcase.jsx';
import { ADS_MODE_CLASSIC, resolveAdsMode, resolveCarouselCfg, resolveClassicCfg } from '../lib/adsDisplay.js';
import { normalizePartCategory, stripOrPrefix } from '../lib/catalogUtils.js';
import { mergeKaramboCfg, getOrderedKaramboServices } from '../data/karamboConfig.js';
import { ServicesNav, AppleHomeShowcase } from '../components/AppleStore.jsx';

export function renderVvipBrandEmblem(ctx, size = 'md', forceLightText = false) {
  const { getHeaderConfig, siteSettings } = ctx;
    const isLg = size === 'lg';
    const hCfg = getHeaderConfig(siteSettings);
    const titleTxt = hCfg.brandTitle || siteSettings.storeName || 'ELZOGHBI';
    const subTxt = hCfg.brandSubtitle || 'E-COMMERCE';
    return (
      <div className="flex items-center gap-3 select-none group">
        {hCfg.logoMode !== 'text_only' && (
          <div className={`relative ${isLg ? 'w-13 h-13 rounded-2xl' : 'w-11 h-11 rounded-xl'} bg-[#1D1D1F] p-1 shadow-[0_6px_22px_rgba(37,99,235,0.38)] flex items-center justify-center shrink-0 border border-[#2997FF]/45 overflow-hidden group-hover:scale-105 transition duration-300`}>
            {hCfg.logoMode === 'custom_image' && hCfg.customLogoUrl ? (
              <img src={hCfg.customLogoUrl} alt={titleTxt} className="w-full h-full object-contain rounded-lg" />
            ) : hCfg.logoMode === 'emblem_webp' ? (
              <img src="/elzoghbi-emblem.webp" onError={e => { e.currentTarget.src = ELZOGHBI_LOGO; }} alt={titleTxt} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <svg viewBox="0 0 120 120" className={`${isLg ? 'w-9 h-9' : 'w-8 h-8'}`} fill="none">
                <defs>
                  <linearGradient id="elzGeoBlue" x1="15" y1="15" x2="105" y2="105" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#1E4E8C" />
                    <stop offset="52%" stopColor="#7FB0E8" />
                    <stop offset="100%" stopColor="#163B6B" />
                  </linearGradient>
                  <linearGradient id="elzGeoPlat" x1="20" y1="18" x2="100" y2="102" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="50%" stopColor="#94A3B8" />
                    <stop offset="100%" stopColor="#E2E8F0" />
                  </linearGradient>
                </defs>
                <path d="M20 20H82L40 88H96L82 65" stroke="url(#elzGeoBlue)" strokeWidth="8.5" strokeLinecap="square" strokeLinejoin="miter" />
                <path d="M33 43L20 20" stroke="url(#elzGeoBlue)" strokeWidth="7.5" strokeLinecap="square" />
                <path d="M100 20L68 71" stroke="url(#elzGeoPlat)" strokeWidth="7.5" strokeLinecap="square" />
                <path d="M51 50L20 100H80" stroke="url(#elzGeoPlat)" strokeWidth="7.5" strokeLinecap="square" strokeLinejoin="miter" />
                <path d="M43 36H66" stroke="url(#elzGeoPlat)" strokeWidth="6" strokeLinecap="square" />
              </svg>
            )}
          </div>
        )}
        <div className="leading-none text-right">
          <div className={`${isLg ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'} font-black tracking-wider ${forceLightText ? 'text-white' : 'text-fg'} uppercase flex items-center gap-1`}>
            <span>{titleTxt}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#2997FF] inline-block shadow-[0_0_8px_#7FB0E8]" />
          </div>
          {hCfg.showSubtitle && (
            <div className="text-[9px] sm:text-[10px] font-extrabold tracking-[0.24em] text-[#0066CC] dark:text-[#2997FF] uppercase mt-1">
              {subTxt}
            </div>
          )}
        </div>
      </div>
    );
  
}

export function renderRoleSwitcherBar(ctx) {
  const {  } = ctx;
  return (null);
}

export function renderClientAvatar(ctx, clientObj, sizeClass = 'w-10 h-10 text-sm') {
  const {  } = ctx;
    if (!clientObj) return null;
    if (clientObj.avatarImage) {
      return (
        <img
          src={clientObj.avatarImage}
          alt={clientObj.name}
          className={`${sizeClass} rounded-xl object-cover border border-line shadow-xs shrink-0`}
        />
      );
    }
    return (
      <div
        className={`${sizeClass} rounded-xl bg-gradient-to-br ${
          clientObj.avatarBg || 'from-blue-600 to-slate-700'
        } text-white font-extrabold flex items-center justify-center shadow-xs shrink-0`}
      >
        {clientObj.avatar || clientObj.name.slice(0, 2)}
      </div>
    );
  
}

export function renderProductCard(ctx, part, cardIdx = 0) {
  const { calculatePartPrice, cardImageIdx, cart, currencies, currentGroup, getPartCashbackPct, getPartImagesList, getPartQualityTiers, hasCustomerRegisteredRestock, isPartCashbackEnabled, isPartFavorited, openCustomerRestockModal, recordRecentlyViewedPart, selectedQualityTiers, setCardImageIdx, setCart, setCartQtyDirect, setDetailImageIdx, setSelectedDetailItem, setSelectedQualityTiers, sharePartViaWhatsApp, showToast, siteSettings, toggleFavoritePart, updateCartQty, useFlag } = ctx;
    const qualityFlagOn = useFlag('quality_tiers').enabled && siteSettings.enableQualityTiers !== false;
    const cashbackFlagOn = useFlag('wallet_cashback').enabled && siteSettings.enableWalletCashback !== false;
    const trustFlagOn = useFlag('trust_badges').enabled && siteSettings.enableTrustBadges !== false;

    const basePriceInfo = calculatePartPrice(part, currentGroup);
    const qualityTiers = getPartQualityTiers(part, basePriceInfo.baseEgpPrice);
    const activeTierId = selectedQualityTiers[part.id] || cart[part.id]?.qualityTier || 'original';
    const activeTierObj = (qualityFlagOn && qualityTiers.find(t => t.id === activeTierId)) || qualityTiers[0];
    const currObj = currencies[currentGroup?.currency || 'EGP'] || currencies.EGP;
    const tierDisplayPrice = Number((activeTierObj.priceEgp * currObj.rateFromBase).toFixed(currObj.code === 'EGP' ? 0 : 2));
    const priceInfo = {
      ...basePriceInfo,
      baseEgpPrice: activeTierObj.priceEgp,
      displayPrice: tierDisplayPrice
    };
    const imagesList = getPartImagesList(part);
    const currentImgIdx = (cardImageIdx[part.id] || 0) % imagesList.length;
    const currentDisplayImg = imagesList[currentImgIdx] || part.image;
    const inCartQty = cart[part.id]?.qty || 0;
    const isOutOfStock = part.stock <= 0 || Boolean(part.soldOut);
    const isFav = isPartFavorited(part.id);
    const partFitMode = part.imageFit || siteSettings.productImageFit || siteSettings.globalImageFit || 'contain';

    const showRealDiscount = priceInfo.hasDiscount && priceInfo.displayOldPrice > priceInfo.displayPrice;
    const partCbOn = cashbackFlagOn && isPartCashbackEnabled(part);
    const partCbPct = getPartCashbackPct(part);
    const lowStockLimit = Number(part.lowStockThreshold) || 5;
    const isLowStock = !isOutOfStock && part.stock > 0 && part.stock <= lowStockLimit;

    return (
      <div
        key={part.id}
        onClick={() => {
          recordRecentlyViewedPart(part.id);
          setDetailImageIdx(currentImgIdx);
          setSelectedDetailItem({ type: 'part', part });
        }}
        className={`hm-card elz-pcard group bg-surface text-fg rounded-[28px] p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between cursor-pointer h-full ${
          inCartQty > 0
            ? 'ring-2 ring-[#0071E3]'
            : 'ring-0 hover:shadow-[0_14px_40px_-12px_rgba(0,0,0,0.18)]'
        }`}
      >
        {/* Top Studio Product Stage (Pure White Studio Card so white-bg & transparent product photos both look crisp!) */}
        <div>
          <div className="elz-pstage relative h-48 sm:h-56 p-3 flex items-center justify-center overflow-hidden mb-4">
            <BlurFitImage
              key={`${part.id}_${currentImgIdx}_${partFitMode}`}
              src={currentDisplayImg}
              alt={stripOrPrefix(part.name)}
              fit={partFitMode}
              imgClassName={`${
                partFitMode === 'cover' ? 'w-full h-full object-cover' : 'max-h-40 sm:max-h-48 w-auto object-contain p-1 mix-blend-multiply'
              } group-hover:scale-105 transition duration-500`}
            />

            {/* Top-Right Real Discount Badge (Shown ONLY when an actual discount exists!) */}
            <div className="absolute top-1 end-1 flex flex-col items-end gap-1 z-10 pointer-events-none">
              {showRealDiscount && (
                <span className="px-2.5 py-0.5 rounded-full bg-[#FF3B30] text-white text-[11px] font-semibold">
                  خصم {priceInfo.discountPercent}%
                </span>
              )}
              {partCbOn && (
                <span className="px-2 py-0.5 rounded-full bg-[#34C759]/15 text-[#248A3D] dark:text-[#30D158] text-[10px] font-semibold">
                  💰 كاش باك {partCbPct}%
                </span>
              )}
            </div>

            {/* Top-Left Circular Wishlist Heart Button */}
            <button
              type="button"
              onClick={(e) => toggleFavoritePart(part.id, e)}
              className={`absolute top-1 start-1 w-11 h-11 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-all duration-200 border z-10 ${
                isFav
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md scale-105'
                  : 'bg-white/95 text-slate-500 hover:text-rose-500 border-slate-200 shadow-sm'
              }`}
              title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </button>

            {/* Quick Viral WhatsApp Share Circle Button */}
            <button
              type="button"
              onClick={(e) => sharePartViaWhatsApp(part, e)}
              className="absolute top-[54px] start-1 w-11 h-11 sm:top-11 sm:w-9 sm:h-9 rounded-full bg-white/95 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-slate-200 shadow-sm flex items-center justify-center transition-all duration-200 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 z-10"
              title="مشاركة المنتج والسعر عبر واتساب"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* Multi-Image Quick Arrows & Counter */}
            {imagesList.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCardImageIdx(prev => ({ ...prev, [part.id]: (currentImgIdx - 1 + imagesList.length) % imagesList.length }));
                  }}
                  className="absolute start-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/70 hover:bg-[#0071E3] text-white text-xs font-black flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover:opacity-100 transition z-10"
                  title="الصورة السابقة"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCardImageIdx(prev => ({ ...prev, [part.id]: (currentImgIdx + 1) % imagesList.length }));
                  }}
                  className="absolute end-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-slate-900/70 hover:bg-[#0071E3] text-white text-xs font-black flex items-center justify-center opacity-85 sm:opacity-0 sm:group-hover:opacity-100 transition z-10"
                  title="الصورة التالية"
                >
                  ›
                </button>
                <span className="absolute bottom-1 start-1 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur text-white text-[10px] font-bold z-10" dir="ltr">
                  {currentImgIdx + 1}/{imagesList.length}
                </span>
              </>
            )}

            {/* Low-Stock / Out-of-Stock Pill */}
            {(isOutOfStock || (trustFlagOn && isLowStock)) && (
              <span
                className={`absolute bottom-1 end-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold z-10 ${
                  isOutOfStock ? 'bg-slate-900/85 text-amber-300' : 'bg-amber-500 text-slate-950'
                }`}
              >
                {isOutOfStock ? 'نفدت الكمية' : `باقي ${part.stock} فقط`}
              </span>
            )}
          </div>

          {/* Category + Title */}
          <div className="space-y-1.5 px-0.5 text-start">
            <div className="flex items-center justify-between gap-1.5 text-[11px] text-muted font-medium">
              <span className="truncate uppercase tracking-wide">{part.category || 'منتج أصلي'}</span>
              {part.sku && <span className="font-mono text-[10px] opacity-75 shrink-0">{part.sku}</span>}
            </div>
            <h3 className="text-[15px] sm:text-[17px] font-semibold text-fg leading-snug tracking-tight line-clamp-2 min-h-[2.8rem] transition">
              <Bidi text={stripOrPrefix(part.name)} />
            </h3>
          </div>

          {/* Interactive 3 Quality Tiers Selector (When Enabled in Feature Flags) */}
          {qualityFlagOn && qualityTiers.length > 1 && (
            <div
              onClick={e => e.stopPropagation()}
              className="grid grid-cols-3 gap-0.5 mt-3 p-0.5 rounded-full bg-surface2"
            >
              {qualityTiers.map(tier => {
                const isSel = activeTierObj.id === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedQualityTiers(prev => ({ ...prev, [part.id]: tier.id }));
                      if (cart[part.id]?.qty > 0) {
                        setCart(prev => ({
                          ...prev,
                          [part.id]: { ...prev[part.id], qualityTier: tier.id, qualityLabel: tier.label }
                        }));
                      }
                    }}
                    className={`py-1 px-1 rounded-full text-[10px] font-semibold truncate transition ${
                      isSel
                        ? 'bg-bg text-fg shadow-sm'
                        : 'text-muted hover:text-fg'
                    }`}
                  >
                    {tier.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Price + Unified CTA / Quantity Stepper */}
        <div className="pt-3 mt-3 space-y-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-baseline justify-between gap-2 flex-wrap">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-semibold text-fg tracking-tight tabular-nums">
                {priceInfo.displayPrice.toLocaleString()}
              </span>
              <span className="text-[12px] font-medium text-muted">
                {priceInfo.currencySymbol}
              </span>
            </div>
            {showRealDiscount && (
              <span className="text-xs font-medium tabular-nums text-muted line-through">
                {priceInfo.displayOldPrice.toLocaleString()} {priceInfo.currencySymbol}
              </span>
            )}
          </div>

          {isOutOfStock ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (hasCustomerRegisteredRestock(part)) {
                  showToast(`✅ تم تسجيل طلب تنبيهك للمنتج "${stripOrPrefix(part.name)}" بالفعل!`, 'info');
                } else {
                  openCustomerRestockModal(part);
                }
              }}
              className="w-full py-2.5 px-4 rounded-full bg-amber-500/15 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-slate-950 border border-amber-500/40 text-xs font-extrabold flex items-center justify-center gap-1.5 transition"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{hasCustomerRegisteredRestock(part) ? 'تم تسجيل تنبيهك ✓' : 'نبّهني عند التوفر'}</span>
            </button>
          ) : inCartQty === 0 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                updateCartQty(part.id, 1);
              }}
              className="w-full py-2.5 px-4 rounded-full bg-[#0071E3] hover:bg-[#0077ED] active:scale-[0.98] text-white text-[13px] sm:text-sm font-medium flex items-center justify-center gap-2 transition"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>أضف إلى السلة</span>
            </button>
          ) : (
            <div className="flex items-center justify-between gap-2 bg-[#0071E3]/10 dark:bg-[#2C2C2E] rounded-full p-1">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); updateCartQty(part.id, 1); }}
                className="w-8 h-8 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white flex items-center justify-center transition"
                title="زيادة الكمية"
              >
                <Plus className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  value={inCartQty}
                  onFocus={e => e.target.select()}
                  onClick={e => e.stopPropagation()}
                  onChange={e => setCartQtyDirect(part.id, e.target.value)}
                  className="w-10 text-center font-black text-sm text-fg bg-transparent border-0 focus:outline-none"
                />
                <span className="text-[11px] font-extrabold text-[#0066CC] dark:text-[#2997FF]">بالسلة</span>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); updateCartQty(part.id, -1); }}
                className="w-8 h-8 rounded-full bg-surface text-fg border border-line hover:border-rose-500 hover:text-rose-500 flex items-center justify-center transition"
                title="تقليل الكمية"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  
}

export function renderSocialIconsGroup(ctx) {
  const { siteSettings } = ctx;
  return (<div className="flex items-center gap-1.5">
      {siteSettings.whatsappUrl && (
        <a
          href={siteSettings.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="كلّمنا على واتساب"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition duration-200 hover:scale-105 bg-nav2 text-nav-cyan border border-navline hover:bg-nav-cyan hover:text-nav-cyan-ink"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86s.274.072.376-.043c.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.1.824z" />
          </svg>
        </a>
      )}
      {siteSettings.facebookUrl && (
        <a
          href={siteSettings.facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="صفحتنا على فيسبوك"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition duration-200 hover:scale-105 bg-nav2 text-nav-cyan border border-navline hover:bg-nav-cyan hover:text-nav-cyan-ink"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5z" />
          </svg>
        </a>
      )}
      {siteSettings.instagramUrl && (
        <a
          href={siteSettings.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="تابعنا على إنستجرام"
          className="w-9 h-9 rounded-xl flex items-center justify-center transition duration-200 hover:scale-105 bg-nav2 text-nav-cyan border border-navline hover:bg-nav-cyan hover:text-nav-cyan-ink"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        </a>
      )}
    </div>);
}

let _karamboNavMemo = { cfg: undefined, setter: null, items: [] };

export function renderClientHeader(ctx) {
  const { categoryEmoji, fetchSparePartsSliceOnDemand, getTopCategories, publicBrands, publicModels, publicParts, publicPartCountByModelIdMap, resolvePartModelObj, selectedBrand, selectedCategory, setStorePage, activeFamilyDevices, cartSummary, changeLang, clientTab, currentClient, favoritePartIds, getHeaderConfig, headerInnerRef, lang, notifications, pendingScrollToProductsRef, renderVvipBrandEmblem, searchQuery, setAccountSubTab, setAuthModalTab, setCartDrawerOpen, setClientTab, setFamilyModalOpen, setLoginModalOpen, setSearchQuery, setSelectedBrand, setSelectedCategory, setSelectedModelId, setSourcingFormOpen, setStoreStockFilter, setWarrantyModalOpen, siteSettings, storeStockFilter, toggleUiTheme, uiTheme, vipLinkUnlocked } = ctx;
    const hCfg = getHeaderConfig(siteSettings);
    const clientTarget = currentClient ? currentClient.id : 'guest';
    const myNotifs = notifications.filter(n => n.target === clientTarget);
    const unreadCount = myNotifs.filter(n => !n.read).length;

    const scrollToSection = (sectionId) => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        setClientTab('home');
        setTimeout(() => {
          const target = document.getElementById(sectionId);
          if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
      }
    };

    const navLinkCls = (isActive) =>
      `relative py-2 transition ${
        isActive
          ? hCfg.forceDarkHeader ? 'text-[#2997FF]' : 'text-[#0066CC] dark:text-white'
          : hCfg.forceDarkHeader ? 'text-slate-200 hover:text-white' : 'text-slate-600 dark:text-slate-300 hover:text-[#0066CC] dark:hover:text-white'
      }`;

    const karamboNavItems = (() => {
      if (_karamboNavMemo.cfg === ctx.karamboCfg && _karamboNavMemo.setter === ctx.setKaramboUi) return _karamboNavMemo.items;
      let items = [];
      try {
        const kc = mergeKaramboCfg(ctx.karamboCfg);
        const svcs = kc.enabled === false ? [] : getOrderedKaramboServices(kc).filter(x => x.enabled);
        if (svcs.length) {
        const goK = (page) => {
          if (ctx.trackKaramboEvent) ctx.trackKaramboEvent('visit', page);
          ctx.setKaramboUi(p => ({ ...p, page }));
          ctx.setClientTab('karambo');
          window.scrollTo({ top: 0 });
        };
        items = [{
          id: 'karambo',
          label: String(kc.title || 'كرومبو').split(' ')[0],
          img: kc.mascotUrl || '/karambo.png',
          go: () => goK('hub'),
          alwaysGo: true,
          children: () => [{ id: 'karambo>hub', label: 'كل خدمات ' + String(kc.title || 'كرومبو'), emoji: '🧭', go: () => goK('hub') }, ...svcs.map(x => ({ id: 'karambo>' + x.id, label: x.title, emoji: '✦', go: () => goK(x.id) }))],
        }];
        }
      } catch (e) { items = []; }
      items = [...items, { id: 'sell', label: 'بيع عندنا', emoji: '🏷️', go: () => { window.location.hash = '#/sell'; ctx.setClientTab('sell'); window.scrollTo({ top: 0 }); } }];
      _karamboNavMemo = { cfg: ctx.karamboCfg, setter: ctx.setKaramboUi, items };
      return items;
    })();

    return (
      <header
        className={`${hCfg.stickyHeader ? 'sticky top-0' : 'relative'} z-40 w-full max-w-[100vw] ${
          hCfg.forceDarkHeader
            ? 'bg-[#161617]/95 text-white border-b border-[#38383A]'
            : 'bg-white/95 dark:bg-[#161617]/95 text-fg border-b border-slate-200/80 dark:border-[#38383A]'
        } backdrop-blur-xl transition-colors duration-200`}
      >
        <div ref={headerInnerRef} className="w-full max-w-full">
          <div className={`max-w-[1380px] mx-auto px-3 sm:px-8 ${hCfg.compactHeight ? 'h-12 sm:h-14' : 'h-14 sm:h-[60px]'} flex items-center justify-between gap-2 sm:gap-4`}>
            {/* Right: Brand Logo + Customizable Navigation Links */}
            <div className="flex items-center gap-3 lg:gap-8 min-w-0 shrink">
              <div
                onClick={() => {
                  setStoreStockFilter('ALL');
                  setClientTab('home');
                }}
                className="cursor-pointer shrink-0 scale-90 sm:scale-100 origin-right"
              >
                {renderVvipBrandEmblem('md', hCfg.forceDarkHeader)}
              </div>

              <nav className="hidden lg:flex items-center gap-6 text-sm font-extrabold">
                {hCfg.showHomeLink && (
                  <button
                    type="button"
                    onClick={() => {
                      setStoreStockFilter('ALL');
                      setClientTab('home');
                    }}
                    className={navLinkCls(clientTab === 'home' || clientTab === 'store')}
                  >
                    <span>{hCfg.homeLabel}</span>
                    {(clientTab === 'home' || clientTab === 'store') && (
                      <span className="absolute inset-x-0 -bottom-1 h-[3px] rounded-full bg-[#0071E3] shadow-[0_0_12px_#2F6BB3]" />
                    )}
                  </button>
                )}

                {hCfg.showProductsLink && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBrand('ALL');
                      setSelectedModelId('ALL');
                      setSelectedCategory('ALL');
                      setStoreStockFilter('ALL');
                      setClientTab('search');
                    }}
                    className={`${navLinkCls(clientTab === 'search' && storeStockFilter === 'ALL')} flex items-center gap-1`}
                  >
                    <span>{hCfg.productsLabel}</span>
                    {clientTab === 'search' && storeStockFilter === 'ALL' && (
                      <span className="absolute inset-x-0 -bottom-1 h-[3px] rounded-full bg-[#0071E3] shadow-[0_0_12px_#2F6BB3]" />
                    )}
                  </button>
                )}

                {hCfg.showOffersLink && (
                  <button
                    type="button"
                    onClick={() => {
                      setStoreStockFilter('DISCOUNTS');
                      setClientTab('search');
                    }}
                    className={navLinkCls(clientTab === 'search' && storeStockFilter === 'DISCOUNTS')}
                  >
                    <span>{hCfg.offersLabel}</span>
                  </button>
                )}

                {hCfg.showCategoriesMenu && (
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => scrollToSection('vvip-categories-section')}
                      className={`py-2 flex items-center gap-1.5 ${
                        hCfg.forceDarkHeader ? 'text-slate-200 hover:text-white' : 'text-slate-600 dark:text-slate-300 hover:text-[#0066CC] dark:hover:text-white'
                      } transition`}
                    >
                      <span>{hCfg.categoriesLabel}</span>
                      <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                    </button>
                    <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute right-0 top-full pt-2 w-60 z-50">
                      <div className="bg-surface dark:bg-[#1D1D1F] border border-line dark:border-[#424245] rounded-2xl shadow-2xl p-2 space-y-1 text-xs font-extrabold">
                        <button
                          type="button"
                          onClick={() => { setStoreStockFilter('BEST_SELLERS'); setClientTab('search'); }}
                          className="w-full px-3 py-2 rounded-xl hover:bg-surface2 text-right flex items-center justify-between text-fg"
                        >
                          <span>الأكثر مبيعاً</span>
                          <ChevronLeft className="w-3.5 h-3.5 text-muted" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setStoreStockFilter('DISCOUNTS'); setClientTab('search'); }}
                          className="w-full px-3 py-2 rounded-xl hover:bg-surface2 text-right flex items-center justify-between text-fg"
                        >
                          <span>🏷️ العروض والخصومات</span>
                          <ChevronLeft className="w-3.5 h-3.5 text-muted" />
                        </button>
                        {siteSettings.enableWarrantyLookup !== false && (
                          <button
                            type="button"
                            onClick={() => setWarrantyModalOpen(true)}
                            className="w-full px-3 py-2 rounded-xl hover:bg-surface2 text-right flex items-center justify-between text-fg"
                          >
                            <span>🛡️ فحص الضمان بالرقم</span>
                            <ChevronLeft className="w-3.5 h-3.5 text-muted" />
                          </button>
                        )}
                        {siteSettings.enableFamilySavedDevices !== false && (
                          <button
                            type="button"
                            onClick={() => setFamilyModalOpen(true)}
                            className="w-full px-3 py-2 rounded-xl hover:bg-surface2 text-right flex items-center justify-between text-fg"
                          >
                            <span>👨‍👩‍👧‍👦 أجهزتي وعائلتي ({activeFamilyDevices.length})</span>
                            <ChevronLeft className="w-3.5 h-3.5 text-muted" />
                          </button>
                        )}
                        {vipLinkUnlocked && (
                          <button
                            type="button"
                            onClick={() => setClientTab('vip')}
                            className="w-full px-3 py-2 rounded-xl bg-amber-400/15 text-amber-500 text-right flex items-center justify-between"
                          >
                            <span>👑 قسم عروض VIP</span>
                            <ChevronLeft className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {hCfg.showAboutLink && (
                  <button
                    type="button"
                    onClick={() => scrollToSection('store-contact-footer')}
                    className={navLinkCls(false)}
                  >
                    <span>{hCfg.aboutLabel}</span>
                  </button>
                )}

                {hCfg.showContactLink && (
                  <button
                    type="button"
                    onClick={() => scrollToSection('store-contact-footer')}
                    className={navLinkCls(false)}
                  >
                    <span>{hCfg.contactLabel}</span>
                  </button>
                )}

                {hCfg.customNavEnabled && hCfg.customNavLabel && (
                  hCfg.customNavTarget === 'EXTERNAL' && hCfg.customNavExternalUrl ? (
                    <a
                      href={hCfg.customNavExternalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-full bg-[#0071E3]/15 text-[#0066CC] dark:text-[#2997FF] border border-[#0071E3]/30 text-xs font-black hover:bg-[#0071E3] hover:text-white transition"
                    >
                      {hCfg.customNavLabel}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (hCfg.customNavTarget === 'SOURCING') {
                          setSourcingFormOpen(true);
                        } else if (hCfg.customNavTarget === 'WARRANTY') {
                          setWarrantyModalOpen(true);
                        } else {
                          setStoreStockFilter(hCfg.customNavTarget || 'BEST_SELLERS');
                          setClientTab('search');
                        }
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#0071E3]/15 text-[#0066CC] dark:text-[#2997FF] border border-[#0071E3]/30 text-xs font-black hover:bg-[#0071E3] hover:text-white transition"
                    >
                      {hCfg.customNavLabel}
                    </button>
                  )
                )}
              </nav>
            </div>

            {/* Center: Customizable Search Bar */}
            {hCfg.showSearchBar && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setClientTab('search');
                }}
                className={`hidden md:flex flex-1 max-w-[340px] items-center ${
                  hCfg.forceDarkHeader
                    ? 'bg-[#1D1D1F] border-[#424245] text-white'
                    : 'bg-[#E8F0FE] dark:bg-[#1D1D1F] border-slate-200/80 dark:border-[#424245] text-fg'
                } border focus-within:border-[#0071E3] rounded-full px-4 py-2 gap-2.5 transition`}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (clientTab !== 'search' && e.target.value.trim().length > 1) {
                      setClientTab('search');
                    }
                  }}
                  placeholder={hCfg.searchPlaceholder}
                  className="flex-1 bg-transparent border-0 text-xs sm:text-sm font-bold placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  type="submit"
                  className="text-slate-500 dark:text-slate-300 hover:text-[#0066CC] transition shrink-0"
                  title="بحث"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Left: Cleanly Ordered Utility Buttons (All Icons Clearly Visible on Mobile & Desktop) */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {hCfg.showWarrantyBtn && siteSettings.enableWarrantyLookup !== false && (
                <button
                  type="button"
                  onClick={() => setWarrantyModalOpen(true)}
                  className="hidden sm:flex h-9 sm:h-10 px-3 rounded-full bg-surface2 dark:bg-[#1D1D1F] hover:border-[#0071E3] text-fg border border-slate-200 dark:border-[#424245] items-center gap-1.5 text-xs font-extrabold transition"
                  title="فحص الضمان بالرقم"
                >
                  <Shield className="w-3.5 h-3.5 text-[#0066CC]" />
                  <span className="hidden xl:inline">الضمان</span>
                </button>
              )}

              {hCfg.showWhatsappBtn && siteSettings.whatsappUrl && (
                <a
                  href={siteSettings.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-500/15 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-white border border-emerald-500/30 items-center justify-center transition"
                  title="تواصل معنا عبر واتساب"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}

              {hCfg.showCartBtn && (
                <button
                  type="button"
                  onClick={() => setCartDrawerOpen(true)}
                  className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface2 dark:bg-[#1D1D1F] hover:border-[#0071E3] text-fg border border-slate-200 dark:border-[#424245] flex items-center justify-center transition"
                  title="سلة المشتريات"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#0071E3] text-white text-[9px] font-black flex items-center justify-center shadow">
                    {cartSummary.totalQty}
                  </span>
                </button>
              )}

              {hCfg.showWishlistBtn && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrand('ALL');
                    setSelectedModelId('ALL');
                    setSelectedCategory('ALL');
                    setStoreStockFilter(storeStockFilter === 'FAVORITES' ? 'ALL' : 'FAVORITES');
                    pendingScrollToProductsRef.current = true;
                    setClientTab('search');
                  }}
                  className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition ${
                    storeStockFilter === 'FAVORITES' && clientTab === 'search'
                      ? 'bg-rose-500 text-white border-rose-400'
                      : 'bg-surface2 dark:bg-[#1D1D1F] hover:border-rose-400 text-fg border-slate-200 dark:border-[#424245]'
                  }`}
                  title="قائمة المفضلة"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill={favoritePartIds.length > 0 ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                  {favoritePartIds.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                      {favoritePartIds.length}
                    </span>
                  )}
                </button>
              )}

              {hCfg.showAccountBtn && (
                <button
                  type="button"
                  onClick={() => {
                    if (currentClient) {
                      setClientTab('account');
                      setAccountSubTab('profile');
                    } else {
                      setAuthModalTab('login');
                      setLoginModalOpen(true);
                    }
                  }}
                  className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full border flex items-center justify-center transition ${
                    clientTab === 'account'
                      ? 'bg-[#0071E3] text-white border-[#0071E3]'
                      : 'bg-surface2 dark:bg-[#1D1D1F] hover:border-[#0071E3] text-fg border-slate-200 dark:border-[#424245]'
                  }`}
                  title={currentClient ? currentClient.name : 'حساب العميل / تسجيل الدخول'}
                >
                  <User className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => changeLang(lang === 'en' ? 'ar' : 'en')}
                className="h-9 sm:h-10 px-3 rounded-full bg-surface2 dark:bg-[#1D1D1F] hover:border-[#0071E3] border border-slate-200 dark:border-[#424245] flex items-center justify-center text-xs font-black text-fg transition"
                title={lang === 'en' ? 'التبديل إلى العربية' : 'Switch to English'}
              >
                {lang === 'en' ? 'عربي' : 'EN'}
              </button>

              {hCfg.showThemeToggle && (
                <button
                  type="button"
                  onClick={toggleUiTheme}
                  className="w-9 h-9 sm:w-auto sm:h-10 sm:px-2.5 rounded-full bg-surface2 dark:bg-[#1D1D1F] hover:border-[#0071E3] border border-slate-200 dark:border-[#424245] flex items-center justify-center gap-1 transition"
                  title={uiTheme === 'dark' ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الليلي'}
                >
                  <span className={`sm:hidden text-sm`}>{uiTheme === 'dark' ? '🌙' : '☀️'}</span>
                  <span className={`hidden sm:flex w-6 h-6 rounded-full items-center justify-center text-xs transition-all ${uiTheme === 'dark' ? 'bg-[#0071E3] text-white shadow' : 'text-slate-400'}`}>
                    🌙
                  </span>
                  <span className={`hidden sm:flex w-6 h-6 rounded-full items-center justify-center text-xs transition-all ${uiTheme === 'light' ? 'bg-amber-400 text-slate-950 shadow' : 'text-slate-500'}`}>
                    ☀️
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Dedicated Full-Width Search Bar Directly Below Header (Mobile & Tablet) */}
          {hCfg.showSearchBar && (
            <div className="md:hidden px-3 pb-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  pendingScrollToProductsRef.current = true;
                  setClientTab('search');
                }}
                className={`flex items-center gap-2 rounded-2xl px-3 py-1.5 border transition ${
                  hCfg.forceDarkHeader
                    ? 'bg-[#1D1D1F] border-[#424245] text-white'
                    : 'bg-surface2 dark:bg-[#1D1D1F] border-line dark:border-[#424245] text-fg'
                } focus-within:border-[#0071E3]`}
              >
                <Search className="w-4 h-4 text-[#0066CC] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (clientTab !== 'search' && e.target.value.trim().length > 1) {
                      setClientTab('search');
                    }
                  }}
                  placeholder={hCfg.searchPlaceholder || 'ابحث باسم المنتج أو البراند أو الموديل...'}
                  className="flex-1 bg-transparent border-0 text-xs font-bold placeholder:text-slate-400 focus:outline-none py-1"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-full bg-surface text-muted hover:text-fg"
                    title="مسح"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="submit"
                  className="px-3 py-1 rounded-xl bg-[#0071E3] text-white text-[11px] font-extrabold shrink-0"
                >
                  بحث
                </button>
              </form>
            </div>
          )}

          {/* Mobile Quick Navigation Strip (Clean & Reachable on Phones) */}
          <div className="lg:hidden flex items-center gap-1.5 px-3 pb-2.5 overflow-x-auto no-scrollbar text-xs font-extrabold">
            {hCfg.showHomeLink && (
              <button
                type="button"
                onClick={() => { setStoreStockFilter('ALL'); setClientTab('home'); }}
                className={`px-3 py-1.5 rounded-full shrink-0 transition ${(clientTab === 'home' || clientTab === 'store') ? 'bg-[#0071E3] text-white' : 'bg-surface2 text-fg border border-line'}`}
              >
                {hCfg.homeLabel}
              </button>
            )}
            {hCfg.showProductsLink && (
              <button
                type="button"
                onClick={() => { setStoreStockFilter('ALL'); setClientTab('search'); }}
                className={`px-3 py-1.5 rounded-full shrink-0 transition ${clientTab === 'search' && storeStockFilter === 'ALL' ? 'bg-[#0071E3] text-white' : 'bg-surface2 text-fg border border-line'}`}
              >
                {hCfg.productsLabel}
              </button>
            )}
            <button
              type="button"
              onClick={() => { setStoreStockFilter('DISCOUNTS'); setClientTab('search'); }}
              className={`px-3 py-1.5 rounded-full shrink-0 transition ${clientTab === 'search' && storeStockFilter === 'DISCOUNTS' ? 'bg-rose-600 text-white' : 'bg-surface2 text-fg border border-line'}`}
            >
              🏷️ العروض
            </button>
            {siteSettings.enableWarrantyLookup !== false && (
              <button
                type="button"
                onClick={() => setWarrantyModalOpen(true)}
                className="px-3 py-1.5 rounded-full shrink-0 bg-surface2 text-fg border border-line"
              >
                🛡️ الضمان
              </button>
            )}
          </div>
        </div>

        {/* Apple-Store style services strip + cascading mega menu (presentation only; all actions reuse the existing store state) */}
        {siteSettings.showServicesNav !== false && (
          <ServicesNav
            rtl={!ctx.i18nActive}
            extraItems={karamboNavItems}
            brands={publicBrands}
            models={publicModels}
            modelCounts={publicPartCountByModelIdMap}
            parts={publicParts}
            resolveModel={resolvePartModelObj}
            getTopCategories={getTopCategories}
            categoryEmoji={categoryEmoji}
            getBrandImg={(b) => (siteSettings.brandImages && siteSettings.brandImages[b]) || OR_BRAND_IMAGES[b] || ''}
            active={{ tab: clientTab, brand: selectedBrand, category: selectedCategory, filter: storeStockFilter }}
            actions={(() => {
              const go = ({ brand = 'ALL', modelId = 'ALL', category = 'ALL', filter = 'ALL' }) => {
                setSelectedBrand(brand);
                setSelectedModelId(modelId);
                setSelectedCategory(category);
                setSearchQuery('');
                setStoreStockFilter(filter);
                setStorePage(1);
                if (modelId !== 'ALL') fetchSparePartsSliceOnDemand({ modelId, limit: 200 });
                else if (brand !== 'ALL') fetchSparePartsSliceOnDemand({ brand, limit: 250 });
                pendingScrollToProductsRef.current = true;
                setClientTab('search');
              };
              return {
                showAll: () => go({}),
                showFilter: (f) => go({ filter: f }),
                showBrand: (b) => go({ brand: b }),
                showModel: (m) => go({ brand: m.brand || 'ALL', modelId: m.id }),
                showCategory: (c) => go({ category: c }),
                showBrandCategory: (b, c) => go({ brand: b, category: c }),
                showModelCategory: (m, c) => go({ brand: m.brand || 'ALL', modelId: m.id, category: c }),
              };
            })()}
          />
        )}
      </header>
    );
  
}

export function renderCheckoutFooter(ctx) {
  const { setClientTab, siteSettings } = ctx;
  return (<footer className="bg-nav text-nav-fg border-t border-navline mt-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4 text-center">
        <div className="flex items-center justify-center gap-3">
          <img src={ELZOGHBI_LOGO} alt="Logo" className="w-10 h-10 rounded-xl object-cover border border-navline" />
          <span className="font-extrabold text-nav-cyan">{siteSettings.storeName || 'ELZOGHBI'}</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
          <span className="px-3 py-1.5 rounded-full bg-nav2 text-nav-cyan border border-navline flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" /> طلبك مؤمّن
          </span>
          <span className="px-3 py-1.5 rounded-full bg-nav2 text-nav-fg border border-navline">معاينة عند الاستلام</span>
          <span className="px-3 py-1.5 rounded-full bg-nav2 text-nav-fg border border-navline">ضمان على المنتجات</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setClientTab('search')}
            className="px-4 py-2.5 rounded-xl bg-nav2 hover:bg-navline text-nav-fg border border-navline text-xs font-bold"
          >
            ← كمّل تسوّق
          </button>
          {siteSettings.whatsappUrl && (
            <a
              href={siteSettings.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-nav-cyan hover:opacity-95 text-nav-cyan-ink text-xs font-extrabold"
            >
              محتاج مساعدة؟ كلّمنا على واتساب
            </a>
          )}
        </div>
        <p className="text-[10px] text-nav-fg/60">© {siteSettings.storeName || 'ELZOGHBI'}</p>
      </div>
    </footer>);
}

export function renderAnnouncements(ctx) {
  const { bannerClosedText, i18nActive, setBannerClosedText, siteSettings } = ctx;
    const tickerItems = (siteSettings.tickerText || '')
      .split('\n')
      .map(t => t.trim())
      .filter(Boolean)
      .join('   •   ');
    const bannerText = (siteSettings.bannerText || '').trim();
    const tickerOn = !!siteSettings.tickerEnabled && tickerItems !== '';
    const bannerOn = !!siteSettings.bannerEnabled && bannerText !== '' && bannerClosedText !== bannerText;
    const TICKER_COLORS = { blue: '#1e4e8c', green: '#16a34a', amber: '#d97706', red: '#be123c', dark: '#111827', purple: '#7c3aed', teal: '#0d9488' };
    const BANNER_THEMES = {
      amber: { bg: '#fbbf24', fg: '#2b1d00' },
      blue: { bg: '#1e4e8c', fg: '#ffffff' },
      green: { bg: '#16a34a', fg: '#ffffff' },
      red: { bg: '#dc2626', fg: '#ffffff' },
      dark: { bg: '#111827', fg: '#ffffff' }
    };
    const bannerTheme = BANNER_THEMES[siteSettings.bannerColor] || BANNER_THEMES.amber;
    if (!tickerOn && !bannerOn) return null;
    return (
      <div>
        {bannerOn && (
          <div style={{ backgroundColor: bannerTheme.bg, color: bannerTheme.fg }} className="px-4 py-2.5 flex items-center justify-center gap-3 text-xs sm:text-sm font-extrabold">
            <span className="whitespace-pre-line text-center">{bannerText}</span>
            <button
              type="button"
              onClick={() => {
                setBannerClosedText(bannerText);
                try { sessionStorage.setItem('hm_banner_closed', bannerText); } catch (e) {}
              }}
              style={{ color: bannerTheme.fg }}
              className="shrink-0 w-7 h-7 rounded-full bg-black/15 hover:bg-black/25 flex items-center justify-center font-black"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {tickerOn && (() => {
          const resolvedTickerBg =
            (siteSettings.tickerColor && siteSettings.tickerColor.startsWith('#')
              ? siteSettings.tickerColor
              : TICKER_COLORS[siteSettings.tickerColor]) ||
            siteSettings.tickerBgColor ||
            '#1e4e8c';
          const tickerDurationSec = Math.max(8, Number(siteSettings.tickerSpeed) || Number(siteSettings.tickerSpeedSeconds) || 26);
          return (
            <div
              dir="ltr"
              style={{ backgroundColor: resolvedTickerBg, color: '#ffffff' }}
              className="hm-ticker-wrap relative overflow-hidden py-2 text-xs sm:text-sm font-extrabold select-none border-b border-white/10"
            >
              <div
                className="hm-ticker-track flex items-center whitespace-nowrap w-max"
                style={{
                  '--hm-ticker-duration': `${tickerDurationSec}s`,
                  animationDuration: `${tickerDurationSec}s`
                }}
              >
                {[0, 1].map(halfIdx => (
                  <div key={halfIdx} className="inline-flex items-center shrink-0">
                    {[0, 1, 2, 3].map(repIdx => (
                      <span key={repIdx} dir={i18nActive ? 'ltr' : 'rtl'} className="inline-flex items-center px-6 gap-4">
                        <span>📢 <Bidi text={tickerItems} /></span>
                        <span className="opacity-60">✦</span>
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
    );
  
}

export function renderRecentlyViewedStrip(ctx) {
  const { calculatePartPrice, currentGroup, publicParts, recentlyViewedIds, setDetailImageIdx, setRecentlyViewedIds, setSelectedDetailItem } = ctx;
    if (!Array.isArray(recentlyViewedIds) || recentlyViewedIds.length === 0) return null;
    const recentItems = recentlyViewedIds
      .map(id => publicParts.find(p => String(p.id) === String(id)))
      .filter(Boolean)
      .slice(0, 6);
    if (recentItems.length === 0) return null;
    return (
      <section className="pt-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-surface border border-line shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">👀</span>
              <h3 className="text-sm sm:text-base font-black text-fg">منتجات شاهدتها مؤخراً</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setRecentlyViewedIds([]);
                try { window.localStorage.removeItem('elzoghbi_recent_parts_v1'); } catch (e) {}
              }}
              className="text-[11px] font-bold text-muted hover:text-rose-500"
            >
              مسح السجل
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {recentItems.map(rp => {
              const rpPrice = calculatePartPrice(rp, currentGroup);
              return (
                <div
                  key={`rv_${rp.id}`}
                  onClick={() => {
                    setDetailImageIdx(0);
                    setSelectedDetailItem({ type: 'part', part: rp });
                  }}
                  className="p-2.5 rounded-2xl bg-bg hover:border-[#0071E3] border border-line cursor-pointer transition flex flex-col justify-between gap-2 group"
                >
                  <div className="h-20 rounded-xl bg-white p-1.5 flex items-center justify-center overflow-hidden">
                    <img src={rp.image || PART_IMAGES.screen} alt={rp.name} loading="lazy" className="max-h-full max-w-full object-contain group-hover:scale-105 transition" />
                  </div>
                  <div>
                    <div className="text-[11px] font-extrabold text-fg line-clamp-1">{rp.name}</div>
                    <div className="text-xs font-black text-[#0066CC] dark:text-[#2997FF] font-mono mt-0.5">
                      {rpPrice.displayPrice.toLocaleString()} {rpPrice.currencySymbol}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  
}

export function renderHomeView(ctx) {
  const { categoryEmoji, getTopCategories, calculatePartPrice, cartSummary, currentGroup, fetchSparePartsSliceOnDemand, handleNewsletterSubscribe, heroAdIndex, i18nActive, isInitialCloudBooting, models, newsletterEmail, openSourcing, parts, pendingScrollToProductsRef, publicBrands, publicPartCountByBrandMap, publicParts, renderKaramboStrip, renderProductCard, renderRecentlyViewedStrip, renderStickyCartBar, resolvePartModelObj, setClientTab, setDetailImageIdx, setHeroAdIndex, setNewsletterEmail, setSearchQuery, setSelectedBrand, setSelectedCategory, setSelectedDetailItem, setSelectedModelId, setStorePage, setStoreStockFilter, showcaseBars, siteSettings, storeAds, swipeProps, swipeSuppressRef, uiTheme } = ctx;
    const activeAds = storeAds.filter(a => a.active && adInSchedule(a));
    const heroAssignedAds = activeAds.filter(a => !a.placement || a.placement === 'hero' || a.placement === 'both');
    const promoSplitAds = activeAds.filter(a => a.placement === 'promo_split' || a.placement === 'both');
    const activeBars = showcaseBars.filter(b => b.active);

    if (isInitialCloudBooting) {
      return (
        <div className="max-w-[1380px] mx-auto px-4 sm:px-8 py-12 space-y-8 w-full max-w-[100vw] overflow-x-hidden text-center">
          <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-surface border border-line shadow-md">
            <RefreshCw className="w-5 h-5 text-[#0066CC] animate-spin" />
            <span className="text-xs sm:text-sm font-black text-fg">جاري تحميل أحدث المنتجات والعروض...</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-80 rounded-[24px] bg-surface border border-line animate-pulse p-5 flex flex-col justify-between">
                <div className="h-48 rounded-2xl bg-surface2" />
                <div className="h-4 w-3/4 mx-auto rounded bg-surface2" />
                <div className="h-11 w-full rounded-xl bg-surface2" />
              </div>
            ))}
          </div>
        </div>
      );
    }

    const flagshipHeroSlide = {
      id: 'flagship_vvip_slide',
      isFlagship: true,
      layout: 'icon_3d_studio',
      iconPreset: 'flagship_iphones',
      theme: uiTheme === 'light' ? 'light' : 'indigo',
      badge: 'جودة مضمونة وأسعار تنافسية ⚡',
      title: `تسوق بذكاء .. عيش تجربة أفضل`,
      subtitle: 'تشكيلة متكاملة من أحدث المنتجات والأجهزة ومستلزماتها بضمان حقيقي وشحن سريع لكل المحافظات',
      buttonText: 'تصفح كل المنتجات'
    };

    const heroSlides =
      heroAssignedAds.length > 0
        ? siteSettings.includeDefaultHeroSlide
          ? [...heroAssignedAds, flagshipHeroSlide]
          : heroAssignedAds
        : [flagshipHeroSlide];
    // Ads display system: Apple Cards Carousel (default) or the preserved Classic Hero Banner.
    const adsMode = resolveAdsMode(siteSettings);
    const adsCarouselCfg = resolveCarouselCfg(siteSettings);
    const adsClassicCfg = resolveClassicCfg(siteSettings);
    const heroSlideIds = new Set(heroSlides.map(a => a.id));
    const cardPromoAds = promoSplitAds.filter(a => !heroSlideIds.has(a.id));
    const currentSlideIdx = heroAdIndex % heroSlides.length;
    const currentSlide = heroSlides[currentSlideIdx] || flagshipHeroSlide;

    const handleOpenAdDetails = (targetAd) => {
      if (!targetAd || targetAd.isFlagship) {
        setClientTab('search');
        return;
      }
      const rawLink = String(targetAd.linkedPartId || '').trim();
      if (rawLink.startsWith('mdl:')) {
        const mdlId = rawLink.slice(4);
        const linkedMdl = models.find(m => String(m.id) === String(mdlId));
        if (linkedMdl) {
          setSelectedBrand(linkedMdl.brand || 'ALL');
          setSelectedModelId(linkedMdl.id);
          setSelectedCategory('ALL');
          setClientTab('search');
          return;
        }
      }
      const linkedPart = rawLink ? parts.find(p => String(p.id) === rawLink) : null;
      if (!rawLink && !targetAd.image) {
        setClientTab('search');
        return;
      }
      const fallbackAdPart = linkedPart || {
        id: `ad_promo_${targetAd.id}`,
        sku: 'PROMO',
        name: targetAd.title || 'عرض خاص من ELZOGHBI',
        category: targetAd.badge || 'عروض وإعلانات المتجر',
        qualityGrade: 'عرض حصري',
        description: targetAd.subtitle || targetAd.title || '',
        warrantyText: 'ضمان شامل وأفضل سعر في السوق',
        image: targetAd.image || PART_IMAGES.screen,
        image_url: targetAd.image || PART_IMAGES.screen,
        images: [targetAd.image || PART_IMAGES.screen],
        basePrice: parts[0]?.basePrice || 450,
        stock: 10,
        lowStockThreshold: 2,
        colors: ['قياسي'],
        compatibleModels: ['جميع الخيارات المتاحة']
      };
      setDetailImageIdx(0);
      setSelectedDetailItem({ type: 'ad', ad: targetAd, part: fallbackAdPart });
    };

    const bestSellerParts = publicParts.slice(0, 4);
    const currentHeroTheme = getAdTheme(currentSlide);

    return (
      <div className="elz-home max-w-[1380px] mx-auto px-4 sm:px-8 py-3 sm:py-6 space-y-5 sm:space-y-16 w-full max-w-[100vw] overflow-x-hidden min-w-0">
        {/* 1. APPLE-STYLE HERO CAMPAIGN (dynamic ads from the admin dashboard) + WHY-SHOP ROW */}
        <div data-home-sec="hero_ads" className="empty:hidden">
        {siteSettings.showHomeHeroAds !== false && siteSettings.showHomeAds !== false && (
          <div className="space-y-6">
            {adsMode === ADS_MODE_CLASSIC ? (
              <ClassicHeroBanner
                slides={heroSlides}
                index={currentSlideIdx}
                setIndex={(v) => setHeroAdIndex(((v % heroSlides.length) + heroSlides.length) % heroSlides.length)}
                onOpen={handleOpenAdDetails}
                rtl={!i18nActive}
                swipeProps={swipeProps(
                  () => setHeroAdIndex(prev => (prev + 1) % heroSlides.length),
                  () => setHeroAdIndex(prev => (prev - 1 + heroSlides.length) % heroSlides.length)
                )}
                swipeSuppressRef={swipeSuppressRef}
                cfg={adsClassicCfg}
              />
            ) : (
              <AppleCardsCarousel
                ads={heroSlides}
                cfg={adsCarouselCfg}
                onOpen={handleOpenAdDetails}
                rtl={!i18nActive}
                label={i18nActive ? 'Featured campaigns' : 'العروض المميزة'}
              />
            )}
          </div>
        )}

        </div>
        {/* 1.5 KARAMBO EL-SHOGHLAANA STRIP (under the search layer) */}
        <div data-home-sec="karambo_strip" className="empty:hidden">
        {renderKaramboStrip && renderKaramboStrip()}
        </div>

        {/* 2. COMPACT QUICK CATEGORY SHORTCUTS STRIP (Compact on Mobile + Scrolls Directly to Products!) */}
        {siteSettings.showLegacyHomeStrips === true && siteSettings.showHomeShortcuts !== false && siteSettings.showHomeModels !== false && (() => {
          const shortcutsList = (Array.isArray(siteSettings.homeShortcutIcons) && siteSettings.homeShortcutIcons.length > 0
            ? siteSettings.homeShortcutIcons
            : DEFAULT_HOME_SHORTCUT_ICONS
          ).filter(sc => sc && sc.visible !== false);
          if (shortcutsList.length === 0) return null;
          return (
            <section id="vvip-categories-section" className="space-y-2.5">
              <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-2.5 items-stretch">
                {shortcutsList.map((sc, idx) => {
                  const presetObj = SHORTCUT_ICON_PRESETS[sc.preset] || SHORTCUT_ICON_PRESETS.phone;
                  const useCustomImg = sc.mode === 'image' && sc.image;
                  return (
                    <button
                      key={sc.id || idx}
                      type="button"
                      onClick={() => {
                        setSelectedBrand('ALL');
                        setSelectedModelId('ALL');
                        setSearchQuery('');
                        setStoreStockFilter(sc.filterMode || 'ALL');
                        setSelectedCategory(normalizePartCategory(sc.category || 'ALL'));
                        setStorePage(1);
                        pendingScrollToProductsRef.current = true;
                        setClientTab('search');
                      }}
                      className="hm-card group h-[76px] sm:h-[96px] p-1.5 sm:p-2.5 rounded-2xl bg-surface border border-line hover:border-[#0071E3] flex flex-col items-center justify-between text-center gap-1"
                    >
                      <div className="flex-1 w-full flex items-center justify-center overflow-hidden group-hover:scale-105 transition duration-300">
                        {useCustomImg ? (
                          <img
                            src={sc.image}
                            alt={sc.label}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="max-h-9 sm:max-h-11 max-w-full w-auto h-auto object-contain rounded-lg"
                          />
                        ) : (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full">
                            {presetObj.svg || (typeof presetObj.render === 'function' ? presetObj.render() : null)}
                          </div>
                        )}
                      </div>
                      <div className="text-[10px] sm:text-xs font-extrabold text-fg group-hover:text-[#0066CC] dark:group-hover:text-[#2997FF] truncate w-full leading-tight">
                        {sc.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* 2B. ORGANIZED BRANDS BAR UNDER CATEGORY ICONS (Full Dashboard Control: Order & Visibility) */}
        {siteSettings.showLegacyHomeStrips === true && siteSettings.showHomeBrandsBar !== false && siteSettings.showHomeModels !== false && (() => {
          const configuredBrands = Array.isArray(siteSettings.homeFeaturedBrands) && siteSettings.homeFeaturedBrands.length > 0
            ? siteSettings.homeFeaturedBrands.filter(b => publicBrands.includes(b))
            : publicBrands;
          if (configuredBrands.length === 0) return null;
          return (
            <section id="vvip-brands-section" className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-black text-fg flex items-center gap-1.5">
                  <span>🏷️</span>
                  <span>تصفح حسب البراند</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrand('ALL');
                    setSelectedCategory('ALL');
                    pendingScrollToProductsRef.current = true;
                    setClientTab('search');
                  }}
                  className="text-[11px] font-extrabold text-[#0066CC] dark:text-[#2997FF] hover:underline"
                >
                  عرض كل البراندات
                </button>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
                {configuredBrands.map(br => {
                  const cleanBrLabel = String(br).replace(/^OR\s*-\s*/i, '').trim();
                  const brImg = (siteSettings.brandImages && siteSettings.brandImages[br]) || OR_BRAND_IMAGES[br] || '';
                  const brCnt = publicPartCountByBrandMap.get(br) || 0;
                  return (
                    <button
                      key={`home_br_${br}`}
                      type="button"
                      onClick={() => {
                        setSelectedBrand(br);
                        setSelectedModelId('ALL');
                        setSelectedCategory('ALL');
                        setSearchQuery('');
                        setStoreStockFilter('ALL');
                        setStorePage(1);
                        fetchSparePartsSliceOnDemand({ brand: br, limit: 250 });
                        pendingScrollToProductsRef.current = true;
                        setClientTab('search');
                      }}
                      className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-surface hover:bg-[#0071E3] text-fg hover:text-white border border-line hover:border-[#0071E3] shadow-2xs transition text-[11px] sm:text-xs font-extrabold group"
                    >
                      {brImg ? (
                        <img
                          src={brImg}
                          alt={cleanBrLabel}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-5 h-5 rounded-full object-cover bg-white border border-line/60 shrink-0"
                        />
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-[#0071E3]/15 text-[#0066CC] group-hover:bg-white/20 group-hover:text-white flex items-center justify-center text-[10px] font-black shrink-0">
                          {cleanBrLabel.charAt(0)}
                        </span>
                      )}
                      <span className="whitespace-nowrap">{cleanBrLabel}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })()}

        {/* 2C. "اطلب منتجك" — Apple-style service tile */}
        <div data-home-sec="sourcing_tile" className="empty:hidden">
        {siteSettings.showHomeSourcing !== false && (
          <section
            role="button"
            tabIndex={0}
            onClick={openSourcing}
            onKeyDown={(e) => { if (e.key === 'Enter') openSourcing(); }}
            className="elz-tile elz-tile-dark group rounded-[28px] px-6 py-7 sm:px-12 sm:py-9 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
          >
            <div className="flex items-center gap-5 min-w-0">
              <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-[22px] bg-white/10 flex items-center justify-center text-3xl shrink-0 overflow-hidden" aria-hidden="true">{(() => { const sb = getSourcingBanner(siteSettings); return sb && sb.image ? <img src={sb.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-contain p-1" /> : '🌍'; })()}</div>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-[#ffb340]">استيراد وتوفير خاص</div>
                <div className="text-[22px] sm:text-[28px] font-semibold tracking-tight leading-tight text-white">خدمة اطلب منتجك</div>
                <p className="text-[14px] sm:text-[16px] text-white/70 mt-1 line-clamp-2">ملقتش المنتج اللي بتدور عليه؟ ابعتلنا اسمه أو صورته وهنوفرهولك بأفضل سعر.</p>
              </div>
            </div>
            <span className="shrink-0 self-start sm:self-center px-6 py-2.5 rounded-full bg-[#0071E3] group-hover:bg-[#0077ED] text-white text-[15px] font-medium whitespace-nowrap transition">اطلب منتجك</span>
          </section>
        )}

        </div>
        {/* 2D. APPLE-STORE STYLE EDITORIAL SHOWCASE (categories, bento offers, horizontal rails — real catalogue data only) */}
        <div data-home-sec="editorial_showcase" className="empty:hidden">
        {siteSettings.showHomeShowcase !== false && (
          <AppleHomeShowcase
            categoryIcons={siteSettings.categoryIcons}
            headTitle={siteSettings.homeStoreTitle}
            headSub={siteSettings.homeStoreSubtitle}
            showHead={siteSettings.showHomeStoreHeadline !== false}
            showCats={siteSettings.showHomeCategoryRow !== false}
            rtl={!i18nActive}
            parts={publicParts}
            calculatePartPrice={calculatePartPrice}
            currentGroup={currentGroup}
            getTopCategories={getTopCategories}
            categoryEmoji={categoryEmoji}
            brands={publicBrands}
            getBrandImg={(b) => (siteSettings.brandImages && siteSettings.brandImages[b]) || OR_BRAND_IMAGES[b] || ''}
            renderProductCard={renderProductCard}
            actions={(() => {
              const go = ({ brand = 'ALL', category = 'ALL', filter = 'ALL' }) => {
                setSelectedBrand(brand);
                setSelectedModelId('ALL');
                setSelectedCategory(category);
                setSearchQuery('');
                setStoreStockFilter(filter);
                setStorePage(1);
                if (brand !== 'ALL') fetchSparePartsSliceOnDemand({ brand, limit: 250 });
                pendingScrollToProductsRef.current = true;
                setClientTab('search');
              };
              return {
                showAll: () => go({}),
                showFilter: (f) => go({ filter: f }),
                showBrand: (b) => go({ brand: b }),
                showCategory: (c) => go({ category: c }),
              };
            })()}
          />
        )}

        </div>
        {/* 3. PROMOTIONAL MOSAIC (large + small tiles, driven by ads with placement promo_split / both) */}
        <div data-home-sec="promo_split" className="empty:hidden">
        {siteSettings.showHomePromoSplit !== false && adsMode === ADS_MODE_CLASSIC && adsClassicCfg.mosaic && promoSplitAds.length > 0 && (
          <AppleAdMosaic ads={promoSplitAds} onOpen={handleOpenAdDetails} rtl={!i18nActive} />
        )}
        {siteSettings.showHomePromoSplit !== false && adsMode !== ADS_MODE_CLASSIC && cardPromoAds.length > 0 && (
          <AppleCardsCarousel
            ads={cardPromoAds}
            cfg={adsCarouselCfg}
            onOpen={handleOpenAdDetails}
            rtl={!i18nActive}
            label={i18nActive ? 'Promotions' : 'عروض'}
            eagerFirst={false}
          />
        )}

        </div>
        {/* 4. BEST SELLERS 4-COLUMN PRODUCT GRID */}
        <div data-home-sec="best_sellers" className="empty:hidden">
        {siteSettings.showHomeBestSellers !== false && bestSellerParts.length > 0 && (
          <section className="space-y-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="elz-h3 text-fg flex items-center gap-2">
                  <span></span>
                  <span>الأكثر مبيعاً وطلباً</span>
                </h3>
                <p className="text-xs text-muted font-semibold mt-0.5">منتجات مختارة بأعلى تقييم وسحب فوري من المخزن</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedBrand('ALL');
                  setSelectedModelId('ALL');
                  setSelectedCategory('ALL');
                  setStoreStockFilter('BEST_SELLERS');
                  setClientTab('search');
                }}
                className="elz-link text-[15px] font-medium inline-flex items-center gap-0.5"
              >
                <span>عرض الكل</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="elz-rail-track flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2">
              {bestSellerParts.map((part, idx) => (
                <div key={part.id || idx} className="snap-start shrink-0 w-[min(272px,78vw)] lg:flex-1 lg:w-auto lg:min-w-0">{renderProductCard(part, idx)}</div>
              ))}
            </div>
          </section>
        )}

        </div>
        {/* 5. ADMIN-CURATED SHOWCASE BARS */}
        {siteSettings.showHomeShowcaseBars !== false && activeBars.map((bar, barIdx) => {
          const rawIds = Array.isArray(bar.partIds) ? bar.partIds : [];
          const barLimit = Math.max(1, Number(bar.maxItems) || 4);
          let barParts = [];

          if (bar.sourceType === 'category' && bar.sourceValue) {
            const targetCat = normalizePartCategory(bar.sourceValue);
            barParts = publicParts.filter(p => p.category === bar.sourceValue || normalizePartCategory(p.category, p.name) === targetCat).slice(0, barLimit);
          } else if (bar.sourceType === 'brand' && bar.sourceValue) {
            const targetBrand = stripOrPrefix(bar.sourceValue).toLowerCase();
            barParts = publicParts.filter(p => {
              const mObj = resolvePartModelObj(p);
              const bVal = mObj?.brand || p.brand || '';
              return bVal === bar.sourceValue || stripOrPrefix(bVal).toLowerCase() === targetBrand;
            }).slice(0, barLimit);
          } else if (bar.sourceType === 'model' && bar.sourceValue) {
            barParts = publicParts.filter(p => {
              const mObj = resolvePartModelObj(p);
              return String(mObj ? mObj.id : p.modelId) === String(bar.sourceValue);
            }).slice(0, barLimit);
          } else if (bar.sourceType === 'discounts') {
            barParts = publicParts.filter(p => calculatePartPrice(p, currentGroup).hasDiscount).slice(0, barLimit);
          } else {
            barParts = rawIds
              .map(pid => publicParts.find(p => String(p.id) === String(pid)))
              .filter(Boolean)
              .slice(0, barLimit);
          }

          if (barParts.length === 0) return null;

          return (
            <section key={bar.id} className="space-y-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="elz-h3 text-fg flex items-center gap-2">
                  <span className="text-[#0066CC]">✦</span>
                  <span>{bar.title}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setClientTab('search')}
                  className="elz-link text-[15px] font-medium inline-flex items-center gap-0.5"
                >
                  <span>عرض الكل</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {barParts.slice(0, barLimit).map((part, idx) => renderProductCard(part, idx))}
              </div>
            </section>
          );
        })}

        {/* Compact Sourcing Bar is now prominently displayed near the top of Homepage */}

        {/* 6. CUSTOM SECTIONS ADDED VIA VISUAL EDITOR / SECTION BUILDER */}
        {Array.isArray(siteSettings?.homeSectionsConfig) && siteSettings.homeSectionsConfig
          .filter((s) => s && s.id && String(s.id).startsWith('custom_') && s.visible !== false)
          .map((sec) => {
            const dev = sec.devices || { desktop: true, tablet: true, mobile: true };
            const devCls = [
              dev.mobile === false ? 'hidden sm:block' : '',
              dev.tablet === false ? 'sm:hidden lg:block' : '',
              dev.desktop === false ? 'lg:hidden' : ''
            ].filter(Boolean).join(' ');
            return (
              <section key={sec.id} className={`rounded-[28px] p-6 sm:p-10 border border-line ${devCls} ${sec.style?.bgMode === 'dark' ? 'bg-[#1D1D1F] text-white' : sec.style?.bgMode === 'accent' ? 'text-white' : 'bg-surface text-fg'}`} style={sec.style?.bgMode === 'accent' ? { backgroundColor: sec.style?.accentColor || '#0071E3' } : undefined}>
                {sec.type === 'custom_banner' && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      {sec.content?.eyebrow && <div className="text-xs font-bold opacity-80">{sec.content.eyebrow}</div>}
                      <h3 className="text-xl sm:text-2xl font-black">{sec.content?.title}</h3>
                      {sec.content?.subtitle && <p className="text-sm opacity-80">{sec.content.subtitle}</p>}
                    </div>
                    {sec.content?.ctaText && (
                      <button type="button" onClick={() => setClientTab(sec.content.ctaAction || 'search')} className="px-6 py-2.5 rounded-full bg-white text-slate-900 text-sm font-bold shrink-0 self-start sm:self-center">
                        {sec.content.ctaText}
                      </button>
                    )}
                  </div>
                )}
                {sec.type === 'custom_features' && (
                  <div className="space-y-4">
                    {sec.content?.title && <h3 className="elz-h3">{sec.content.title}</h3>}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {(sec.content?.items || []).map((it, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-bg/80 text-fg border border-line space-y-1">
                          <div className="text-xl">{it.icon}</div>
                          <div className="font-black text-sm">{it.title}</div>
                          <div className="text-xs text-muted">{it.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {sec.type === 'custom_faq' && (
                  <div className="space-y-3">
                    {sec.content?.title && <h3 className="elz-h3">{sec.content.title}</h3>}
                    <div className="space-y-2">
                      {(sec.content?.items || []).map((it, i) => (
                        <details key={i} className="p-4 rounded-2xl bg-bg text-fg border border-line">
                          <summary className="font-black text-sm cursor-pointer">{it.q}</summary>
                          <p className="text-xs text-muted mt-2">{it.a}</p>
                        </details>
                      ))}
                    </div>
                  </div>
                )}
                {sec.type === 'custom_products' && (
                  <div className="space-y-4">
                    {sec.content?.title && <h3 className="elz-h3">{sec.content.title}</h3>}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {publicParts.slice(0, Number(sec.content?.limit) || 4).map((part, idx) => renderProductCard(part, idx))}
                    </div>
                  </div>
                )}
              </section>
            );
          })}

        {/* 6.5 TRUST STRIP (moved to the bottom of the home page, above the newsletter) */}
        <div data-home-sec="trust_strip" className="empty:hidden">
        {siteSettings.showHomeHeroAds !== false && siteSettings.showHomeAds !== false && (
          <div className="space-y-6">
            {(() => {
              const heroCfg = Array.isArray(siteSettings?.homeSectionsConfig) ? siteSettings.homeSectionsConfig.find(s => s.id === 'hero_ads') : null;
              if (heroCfg && heroCfg.content && heroCfg.content.showTrustStrip === false) return null;
              const iconMap = { check: CheckCircle2, truck: Truck, shield: Shield, phone: Phone };
              const customBadges = Array.isArray(siteSettings?.discoveredControls?.trustBadges) && siteSettings.discoveredControls.trustBadges.length > 0
                ? siteSettings.discoveredControls.trustBadges.filter(b => b && b.visible !== false)
                : [
                    { id: 'tb1', icon: 'check', title: 'ضمان حقيقي معتمد', desc: 'استبدال وفحص فوري' },
                    { id: 'tb2', icon: 'truck', title: 'شحن سريع ومؤمّن', desc: 'لجميع المحافظات' },
                    { id: 'tb3', icon: 'shield', title: 'معاينة ودفع آمن', desc: 'عند الاستلام أو بالمحفظة' },
                    { id: 'tb4', icon: 'phone', title: 'دعم ومتابعة مستمرة', desc: 'خدمة عملاء سريعة' }
                  ];
              return (
                <ul className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-3 sm:gap-x-6 sm:gap-y-5 rounded-[20px] sm:rounded-[28px] bg-surface px-4 py-4 sm:px-10 sm:py-6">
                  {customBadges.map((b) => {
                    const Icon = iconMap[b.icon] || CheckCircle2;
                    return (
                      <li key={b.id || b.title} className="flex items-start gap-3">
                        <Icon className="w-5 h-5 sm:w-7 sm:h-7 shrink-0 text-fg" strokeWidth={1.4} aria-hidden="true" />
                        <div>
                          <div className="text-[12.5px] sm:text-[14px] font-semibold text-fg leading-snug">{b.title}</div>
                          <div className="text-[11px] sm:text-[12px] text-muted leading-snug">{b.desc}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              );
            })()}
          </div>
        )}

        </div>
        {/* 7. NEWSLETTER */}
        <div data-home-sec="newsletter" className="empty:hidden">
        {siteSettings.showHomeNewsletter !== false && (
          <section className="rounded-[28px] bg-surface px-6 py-10 sm:px-14 sm:py-14 text-center">
            <h3 className="elz-display">اشترك في نشرتنا البريدية</h3>
            <p className="text-[15px] sm:text-[17px] text-muted mt-3 max-w-xl mx-auto">ليصلك أحدث العروض والمنتجات الجديدة وكوبونات الخصم أولاً بأول.</p>
            <form onSubmit={handleNewsletterSubscribe} className="mt-7 mx-auto w-full max-w-md flex items-center bg-bg p-1.5 rounded-full border border-line focus-within:ring-2 focus-within:ring-[#0071E3]/50 transition">
              <input
                type="text"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="بريدك الإلكتروني أو رقم واتساب"
                aria-label="البريد الإلكتروني أو رقم واتساب"
                className="flex-1 min-w-0 bg-transparent border-0 px-4 py-2 text-[15px] text-fg placeholder:text-muted focus:outline-none"
              />
              <button type="submit" className="px-6 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-[14px] font-medium transition shrink-0">اشترك</button>
            </form>
          </section>
        )}
        </div>

        <style data-home-sections-css>{buildHomeSectionCss(siteSettings?.homeSectionsConfig)}</style>
        {renderRecentlyViewedStrip()}
        {cartSummary.totalQty > 0 && renderStickyCartBar()}
      </div>
    );
  
}

export function renderStickyCartBar(ctx) {
  const { cartSummary, formatMoney, setCartDrawerOpen } = ctx;
  return (<button
      type="button"
      onClick={() => setCartDrawerOpen(true)}
      className="fixed bottom-6 left-6 z-40 group flex items-center gap-3 bg-gradient-to-l from-[#1D1D1F] via-[#1D1D1F] to-[#0071E3] hover:from-[#0071E3] hover:to-[#0077ED] text-white p-3.5 rounded-full shadow-2xl border-2 border-[#2997FF]/70 hover:scale-105 transition-all duration-300"
      title="اضغط لفتح السلة ومراجعة الأصناف"
    >
      <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-[#0071E3] text-white shadow-md">
        <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
        <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 rounded-full bg-rose-600 text-white text-[11px] font-black flex items-center justify-center border-2 border-white shadow">
          {cartSummary.totalQty}
        </span>
      </div>
      <div className="text-right pe-1 ps-2 hidden sm:block">
        <div className="text-[10px] text-blue-200 font-bold leading-none mb-1">سلة المشتريات</div>
        <div className="text-xs font-black text-white font-mono leading-none">
          {formatMoney(cartSummary.subtotalBase)}
        </div>
      </div>
    </button>);
}

export function renderStorefront(ctx) {
  const { calculatePartPrice, cartSummary, changeCols, currentGroup, favoritePartIds, fetchSparePartsSliceOnDemand, filteredParts, isCategoryHidden, isPartCashbackEnabled, mobileCols, mobileFiltersExpanded, partPassesStoreFilters, productsGridAnchorRef, publicBrands, publicModels, publicPartCountByModelIdMap, publicParts, renderProductCard, renderSourcingBanner, renderStickyCartBar, searchQuery, selectedBrand, selectedCategory, selectedModelId, setMobileFiltersExpanded, setSearchQuery, setSelectedBrand, setSelectedCategory, setSelectedModelId, setStoreExtraEightShown, setStorePage, setStorePriceRangeFilter, setStoreSortBy, setStoreStockFilter, siteSettings, storeExtraEightShown, storeGridTopRef, storePage, storePriceRangeFilter, storeSortBy, storeStockFilter } = ctx;
    const catCounts = {};
    publicParts.filter(p => partPassesStoreFilters(p, true)).forEach(p => {
      const normCat = normalizePartCategory(p.category, p.name);
      if (normCat && !isCategoryHidden(normCat) && !isCategoryHidden(p.category)) {
        catCounts[normCat] = (catCounts[normCat] || 0) + 1;
      }
    });
    (Array.isArray(siteSettings.customCategories) ? siteSettings.customCategories : []).forEach(cc => {
      const cleanC = String(cc || '').trim();
      if (cleanC && !isCategoryHidden(cleanC) && catCounts[cleanC] === undefined) {
        catCounts[cleanC] = 0;
      }
    });
    const facetTotal = Object.values(catCounts).reduce((a, b) => a + b, 0);
    const dynamicCategories = ['ALL', ...Object.keys(catCounts)];
    if (selectedCategory !== 'ALL' && !dynamicCategories.includes(selectedCategory) && !isCategoryHidden(selectedCategory)) {
      dynamicCategories.push(selectedCategory);
    }

    const modelsForSelectedBrand = publicModels.filter(m => (selectedBrand === 'ALL' || m.brand === selectedBrand) && (publicPartCountByModelIdMap.get(String(m.id)) || 0) > 0);
    const hasActiveFilters =
      selectedBrand !== 'ALL' || selectedModelId !== 'ALL' || selectedCategory !== 'ALL' || searchQuery.trim() !== '' || storeStockFilter !== 'ALL';
    const clearAllStoreFilters = () => {
      setSelectedBrand('ALL');
      setSelectedModelId('ALL');
      setSelectedCategory('ALL');
      setSearchQuery('');
      setStoreStockFilter('ALL');
      setStorePriceRangeFilter('ALL');
    };

    const FIRST_PAGE_INITIAL = Number(siteSettings.storeFirstPageLimit) || 18;
    const LOAD_MORE_STEP = 8;
    const FIRST_PAGE_MAX = FIRST_PAGE_INITIAL + LOAD_MORE_STEP;
    const NEXT_PAGE_SIZE = 8;

    const budgetFilteredParts = filteredParts.filter(p => {
      if (storePriceRangeFilter === 'ALL') return true;
      if (storePriceRangeFilter === 'CASHBACK_ONLY') return isPartCashbackEnabled(p);
      const egp = calculatePartPrice(p, currentGroup).baseEgpPrice;
      if (storePriceRangeFilter === 'UNDER_300') return egp < 300;
      if (storePriceRangeFilter === '300_800') return egp >= 300 && egp <= 800;
      if (storePriceRangeFilter === 'OVER_800') return egp > 800;
      return true;
    });
    const totalItems = budgetFilteredParts.length;
    const totalPages = totalItems <= FIRST_PAGE_MAX
      ? 1
      : 1 + Math.ceil((totalItems - FIRST_PAGE_MAX) / NEXT_PAGE_SIZE);

    const safePage = Math.min(Math.max(1, storePage), totalPages);
    let visibleParts = [];
    let rangeStart = 0;
    let rangeEnd = 0;

    if (safePage === 1) {
      const limitOnPage1 = storeExtraEightShown ? FIRST_PAGE_MAX : FIRST_PAGE_INITIAL;
      visibleParts = budgetFilteredParts.slice(0, limitOnPage1);
      rangeStart = totalItems > 0 ? 1 : 0;
      rangeEnd = visibleParts.length;
    } else {
      rangeStart = FIRST_PAGE_MAX + (safePage - 2) * NEXT_PAGE_SIZE + 1;
      rangeEnd = Math.min(totalItems, rangeStart + NEXT_PAGE_SIZE - 1);
      visibleParts = budgetFilteredParts.slice(rangeStart - 1, rangeEnd);
    }

    const canShowMoreEightOnPage1 = safePage === 1 && !storeExtraEightShown && totalItems > FIRST_PAGE_INITIAL;
    const showPageNavigator = (storeExtraEightShown && totalItems > FIRST_PAGE_INITIAL) || safePage > 1;

    return (
      <div className="elz-catalog max-w-[1380px] mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6 w-full max-w-[100vw] overflow-x-hidden min-w-0">
        {/* Editorial page header: breadcrumb + large title + result count */}
        {(() => {
          const mdl = selectedModelId !== 'ALL' ? publicModels.find(m => String(m.id) === String(selectedModelId)) : null;
          const crumbs = [];
          if (selectedBrand !== 'ALL') crumbs.push(String(selectedBrand).replace(/^OR\s*-\s*/i, ''));
          if (mdl) crumbs.push(mdl.name);
          if (selectedCategory !== 'ALL') crumbs.push(selectedCategory);
          const modeTitle = { FAVORITES: 'قائمة منتجاتك المفضلة', DISCOUNTS: 'العروض والخصومات', BEST_SELLERS: 'الأكثر مبيعاً وطلباً', IN_STOCK: 'متاح في المخزن فوراً' }[storeStockFilter];
          const title = searchQuery.trim() ? ('نتائج البحث: ' + searchQuery.trim()) : (crumbs.length ? crumbs[crumbs.length - 1] : (modeTitle || 'كل المنتجات'));
          return (
            <header className="pt-2 pb-2">
              <nav aria-label="breadcrumb" className="flex items-center flex-wrap gap-1.5 text-[13px] text-muted mb-3">
                <button type="button" onClick={() => ctx.setClientTab('home')} className="elz-link">الرئيسية</button>
                <span aria-hidden="true">›</span>
                <button type="button" onClick={() => { clearAllStoreFilters(); }} className={crumbs.length || modeTitle ? 'elz-link' : 'text-fg'}>المتجر</button>
                {crumbs.map((c, i) => (<React.Fragment key={c + i}><span aria-hidden="true">›</span><span className={i === crumbs.length - 1 ? 'text-fg' : ''}>{c}</span></React.Fragment>))}
              </nav>
              <h1 className="elz-display text-fg">{title}</h1>
              <p className="text-[15px] sm:text-[17px] text-muted mt-2">{budgetFilteredParts.length.toLocaleString()} منتج {hasActiveFilters ? 'مطابق للفلاتر المختارة' : 'متاح للطلب بضمان وشحن لكل المحافظات'}</p>
            </header>
          );
        })()}
        {siteSettings.showSearchSourcing !== false && renderSourcingBanner()}

        {/* VVIP Quick Mode Pills (كل المنتجات / الأكثر مبيعاً / العروض والخصومات / المفضلة / المتاح في المخزن) */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'ALL', label: `كل المنتجات (${publicParts.length})` },
            { id: 'BEST_SELLERS', label: 'الأكثر مبيعاً' },
            { id: 'DISCOUNTS', label: '🏷️ العروض والخصومات' },
            { id: 'FAVORITES', label: `❤️ المفضلة (${favoritePartIds.length})` },
            { id: 'IN_STOCK', label: '✅ متاح في المخزن فوراً' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStoreStockFilter(tab.id);
                setStorePage(1);
              }}
              className={`shrink-0 px-4 py-2 rounded-full text-[13px] font-medium transition ${
                storeStockFilter === tab.id
                  ? 'bg-fg text-bg'
                  : 'bg-surface text-fg hover:bg-surface2'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Compact Search & 1-Tap Quick Shortcuts Bar (Mobile-Friendly!) */}
        <div className="bg-surface rounded-[28px] p-4 sm:p-6 text-fg space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm sm:text-lg font-black text-fg truncate">
              {storeStockFilter === 'FAVORITES'
                ? '❤️ قائمة منتجاتك المفضلة'
                : storeStockFilter === 'DISCOUNTS'
                ? 'أقوى العروض والخصومات الحصرية'
                : storeStockFilter === 'BEST_SELLERS'
                ? '⭐ المنتجات الأكثر مبيعاً وطلباً'
                : 'ابحث وفلتر المنتجات بسرعة'}
            </h2>
            <div className="flex items-center gap-1.5 shrink-0">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllStoreFilters}
                  className="px-2.5 py-1 rounded-full bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/30 text-[11px] font-extrabold transition"
                >
                  × مسح الفلاتر
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileFiltersExpanded(prev => !prev)}
                className={`sm:hidden px-2.5 py-1 rounded-full border text-[11px] font-extrabold flex items-center gap-1 transition ${
                  mobileFiltersExpanded
                    ? 'bg-[#0071E3] text-white border-[#0071E3]'
                    : 'bg-surface2 text-fg border-line'
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>{mobileFiltersExpanded ? 'إخفاء الفلاتر' : 'فلاتر متقدمة'}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم المنتج، الموديل، أو الكود..."
                className="w-full pe-9 ps-12 py-2 sm:py-2.5 rounded-full bg-bg text-fg placeholder:text-muted border border-line text-xs sm:text-sm font-bold focus:outline-none focus:border-[#0071E3]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-surface2 hover:bg-line text-fg text-xs font-bold"
                  title="مسح"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                const t = productsGridAnchorRef.current || storeGridTopRef.current;
                if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white font-extrabold text-xs sm:text-sm shadow shadow-blue-600/20 transition shrink-0"
            >
              بحث
            </button>
          </div>

          {/* 1-Tap Category Icon Shortcuts (Dashboard-Controlled) */}
          {(() => {
            const allSc = (Array.isArray(siteSettings.homeShortcutIcons) && siteSettings.homeShortcutIcons.length > 0
              ? siteSettings.homeShortcutIcons
              : DEFAULT_HOME_SHORTCUT_ICONS
            ).filter(sc => sc && sc.visible !== false && sc.showInSearch !== false && sc.category && sc.category !== 'ALL');
            if (allSc.length === 0) return null;
            return (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
                <button
                  type="button"
                  onClick={() => { setSelectedCategory('ALL'); setStorePage(1); }}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-extrabold border transition ${
                    selectedCategory === 'ALL'
                      ? 'bg-[#0071E3] text-white border-[#0071E3]'
                      : 'bg-surface2 text-fg border-line hover:border-[#0071E3]'
                  }`}
                >
                  الكل
                </button>
                {allSc.map((sc, idx) => {
                  const normC = normalizePartCategory(sc.category);
                  const isAct = normalizePartCategory(selectedCategory) === normC;
                  const presetObj = SHORTCUT_ICON_PRESETS[sc.preset] || SHORTCUT_ICON_PRESETS.phone;
                  return (
                    <button
                      key={`srch_cat_${sc.id || idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(isAct ? 'ALL' : normC);
                        setStorePage(1);
                      }}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-extrabold border flex items-center gap-1.5 transition ${
                        isAct
                          ? 'bg-[#0071E3] text-white border-[#0071E3] shadow-sm'
                          : 'bg-surface2 text-fg border-line hover:border-[#0071E3]'
                      }`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center [&>svg]:w-full [&>svg]:h-full shrink-0">
                        {sc.mode === 'image' && sc.image
                          ? <img src={sc.image} alt="" className="w-4 h-4 object-contain rounded" />
                          : (presetObj.svg || (typeof presetObj.render === 'function' ? presetObj.render() : null))}
                      </span>
                      <span className="whitespace-nowrap">{sc.label}</span>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {/* 1-Tap Brand Shortcuts (Dashboard-Controlled) */}
          {(() => {
            const searchBrands = Array.isArray(siteSettings.searchShortcutBrands) && siteSettings.searchShortcutBrands.length > 0
              ? siteSettings.searchShortcutBrands.filter(b => publicBrands.includes(b))
              : publicBrands.slice(0, 12);
            if (searchBrands.length === 0) return null;
            return (
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] font-extrabold text-muted shrink-0">البراند:</span>
                <button
                  type="button"
                  onClick={() => { setSelectedBrand('ALL'); setSelectedModelId('ALL'); setStorePage(1); }}
                  className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold border transition ${
                    selectedBrand === 'ALL'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-bg text-fg border-line hover:border-emerald-500'
                  }`}
                >
                  كل البراندات
                </button>
                {searchBrands.map(br => {
                  const isAct = selectedBrand === br;
                  const cleanBr = String(br).replace(/^OR\s*-\s*/i, '').trim();
                  return (
                    <button
                      key={`srch_br_${br}`}
                      type="button"
                      onClick={() => {
                        const nextBr = isAct ? 'ALL' : br;
                        setSelectedBrand(nextBr);
                        setSelectedModelId('ALL');
                        setStorePage(1);
                        if (nextBr !== 'ALL') fetchSparePartsSliceOnDemand({ brand: nextBr, limit: 250 });
                      }}
                      className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-extrabold border transition whitespace-nowrap ${
                        isAct
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-bg text-fg border-line hover:border-emerald-500'
                      }`}
                    >
                      {cleanBr}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Collapsible Advanced Filter Bar on Mobile (Always Open on Desktop) */}
        <div ref={storeGridTopRef} className={`${mobileFiltersExpanded ? 'block' : 'hidden sm:block'} bg-surface rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-line shadow-sm space-y-3`}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.65rem' }}>
            {/* 1. البراند */}
            <div>
              <label className="block text-xs font-extrabold text-muted mb-1.5">1. البراند (الماركة):</label>
              <div className="relative">
                <select
                  value={selectedBrand}
                  onChange={e => {
                    const nextBr = e.target.value;
                    setSelectedBrand(nextBr);
                    setSelectedModelId('ALL');
                    setSelectedCategory('ALL');
                    if (nextBr !== 'ALL') {
                      fetchSparePartsSliceOnDemand({ brand: nextBr, limit: 250 });
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-line bg-bg text-fg font-extrabold text-xs appearance-none pe-3 ps-8 focus:outline-none focus:border-[#0071E3]"
                >
                  <option value="ALL">كل البراندات</option>
                  {publicBrands.map(br => (
                    <option key={br} value={br}>
                      {br}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 2. الجهاز (الموديل) */}
            <div>
              <label className="block text-xs font-extrabold text-muted mb-1.5">2. الجهاز (الموديل):</label>
              <div className="relative">
                <select
                  value={selectedModelId}
                  onChange={e => {
                    const nextMid = e.target.value;
                    setSelectedModelId(nextMid);
                    setSelectedCategory('ALL');
                    if (nextMid !== 'ALL') {
                      fetchSparePartsSliceOnDemand({ modelId: nextMid, limit: 200 });
                    }
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-line bg-bg text-fg font-extrabold text-xs appearance-none pe-3 ps-8 focus:outline-none focus:border-[#0071E3]"
                >
                  <option value="ALL">
                    {selectedBrand === 'ALL'
                      ? 'اختر الموديل المناسب — كل الأجهزة'
                      : `اختر الموديل المناسب — أجهزة ${selectedBrand}`}
                  </option>
                  {modelsForSelectedBrand.map(mdl => (
                    <option key={mdl.id} value={mdl.id}>
                      {mdl.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 3. التصنيف */}
            <div>
              <label className="block text-xs font-extrabold text-muted mb-1.5">3. التصنيف:</label>
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-line bg-bg text-fg font-extrabold text-xs appearance-none pe-3 ps-8 focus:outline-none focus:border-[#0071E3]"
                >
                  <option value="ALL">كل التصنيفات</option>
                  {dynamicCategories.filter(c => c !== 'ALL').map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 4. ترتيب حسب */}
            <div>
              <label className="block text-xs font-extrabold text-muted mb-1.5">4. ترتيب حسب:</label>
              <div className="relative">
                <select
                  value={storeSortBy}
                  onChange={e => setStoreSortBy(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-line bg-bg text-fg font-extrabold text-xs appearance-none pe-3 ps-8 focus:outline-none focus:border-[#0071E3]"
                >
                  <option value="date_desc">الأحدث أولاً</option>
                  <option value="best_selling">الأكثر مبيعاً</option>
                  <option value="price_asc">السعر: من الأقل للأعلى</option>
                  <option value="price_desc">السعر: من الأعلى للأقل</option>
                  <option value="stock_desc">الكمية: الأكثر توفراً</option>
                  <option value="stock_asc">الكمية: الأقل توفراً</option>
                  <option value="name_asc">الاسم: (أ - ي)</option>
                  <option value="name_desc">الاسم: (ي - أ)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Quick Customer Budget & Cashback Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-line/60 text-[11px] font-extrabold">
            <span className="text-muted ms-1">فلتر سريع بالسعر:</span>
            {[
              ['ALL', 'كل الأسعار'],
              ['UNDER_300', 'أقل من 300 ج.م'],
              ['300_800', '300 – 800 ج.م'],
              ['OVER_800', 'أعلى من 800 ج.م'],
              ['CASHBACK_ONLY', '💰 منتجات بكاش باك']
            ].map(([rk, rLbl]) => (
              <button
                key={rk}
                type="button"
                onClick={() => setStorePriceRangeFilter(rk)}
                className={`px-3 py-1 rounded-full border transition ${
                  storePriceRangeFilter === rk
                    ? 'bg-[#0071E3] text-white border-[#0071E3]'
                    : 'bg-surface2 text-fg border-line hover:border-[#0071E3]'
                }`}
              >
                {rLbl}
              </button>
            ))}
          </div>

          {/* Results Summary + Mobile View Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-line text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-muted font-bold">
                النتائج: <span className="text-accent-text font-extrabold">{totalItems}</span>
                {totalItems > 0 && (
                  <span className="text-muted me-1">
                    (عرض {rangeStart} – {rangeEnd})
                  </span>
                )}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllStoreFilters}
                  className="px-3 py-1 rounded-full bg-surface2 hover:bg-line text-fg border border-line font-extrabold text-[11px]"
                >
                  × مسح الفلاتر
                </button>
              )}
            </div>

            <div className="sm:hidden flex items-center bg-surface2 rounded-full p-1 border border-line gap-1">
              <button
                type="button"
                onClick={() => changeCols(1)}
                className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition flex items-center gap-1 ${
                  mobileCols === 1 ? 'bg-[#0071E3] text-white' : 'text-muted'
                }`}
              >
                <span>☰</span>
                <span>كبير</span>
              </button>
              <button
                type="button"
                onClick={() => changeCols(2)}
                className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition flex items-center gap-1 ${
                  mobileCols === 2 ? 'bg-[#0071E3] text-white' : 'text-muted'
                }`}
              >
                <span>▦</span>
                <span>مربعات</span>
              </button>
            </div>
          </div>
        </div>

        {/* Direct Scroll Target: Always-Visible Anchor at Start of Products Grid (Mobile & Desktop!) */}
        <div ref={productsGridAnchorRef} className="scroll-mt-28" />
        <div className="flex items-center justify-between gap-2 sm:hidden px-1">
          <span className="text-xs text-muted font-bold">
            المنتجات: <span className="text-accent-text font-black">{totalItems}</span>
            {selectedCategory !== 'ALL' && <span className="me-1.5 text-[11px] text-[#0066CC] font-extrabold">• {selectedCategory}</span>}
            {selectedBrand !== 'ALL' && <span className="me-1.5 text-[11px] text-emerald-500 font-extrabold">• {String(selectedBrand).replace(/^OR\s*-\s*/i, '')}</span>}
          </span>
          <div className="flex items-center bg-surface2 rounded-full p-0.5 border border-line gap-0.5">
            <button type="button" onClick={() => changeCols(1)} className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${mobileCols === 1 ? 'bg-[#0071E3] text-white' : 'text-muted'}`}>☰</button>
            <button type="button" onClick={() => changeCols(2)} className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${mobileCols === 2 ? 'bg-[#0071E3] text-white' : 'text-muted'}`}>▦</button>
          </div>
        </div>

        {/* Product Grid (4 Columns on Desktop matching Reference Mockups!) */}
        {totalItems === 0 ? (
          <div className="bg-surface rounded-3xl p-12 text-center border border-line space-y-3">
            <Search className="w-12 h-12 text-[#0066CC] mx-auto" />
            <h3 className="text-base font-black text-fg">
              {storeStockFilter === 'FAVORITES'
                ? 'قائمة المفضلة فارغة حالياً — اضغط على رمز القلب ❤️ على أي منتج لحفظه هنا'
                : 'لا توجد منتجات مطابقة لبحثك حالياً'}
            </h3>
            <button
              onClick={clearAllStoreFilters}
              className="px-6 py-2.5 rounded-full bg-[#0071E3] text-white text-xs font-extrabold shadow-md shadow-blue-600/25"
            >
              عرض كل المنتجات
            </button>
          </div>
        ) : (
          <div className="space-y-6 pb-6">
            <div className={`grid ${mobileCols === 2 ? 'grid-cols-2 hm-grid2 gap-3' : 'grid-cols-1 gap-5'} sm:grid-cols-2 lg:grid-cols-4 sm:gap-5`}>
              {visibleParts.map((part, idx) => renderProductCard(part, idx))}
            </div>

            {canShowMoreEightOnPage1 && (
              <div className="flex justify-center py-4">
                <button
                  type="button"
                  onClick={() => setStoreExtraEightShown(true)}
                  className="px-7 py-3 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-blue-600/25 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>إظهار المزيد (+{Math.min(LOAD_MORE_STEP, totalItems - FIRST_PAGE_INITIAL)} منتجات)</span>
                </button>
              </div>
            )}

            {showPageNavigator && totalPages > 1 && (
              <div className="bg-surface rounded-3xl p-4 border border-line flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-bold text-muted">
                  صفحة <span className="font-extrabold text-accent-text">{safePage}</span> من <span className="font-extrabold text-fg">{totalPages}</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setStorePage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 rounded-full border border-line bg-surface2 hover:border-[#0071E3] text-fg text-xs font-extrabold disabled:opacity-35"
                  >
                    السابق
                  </button>

                  {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 2)
                    .map((p, idx, arr) => (
                      <React.Fragment key={p}>
                        {idx > 0 && arr[idx - 1] !== p - 1 && (
                          <span className="px-1 text-muted font-bold">...</span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setStorePage(p);
                            setStoreExtraEightShown(true);
                          }}
                          className={`w-9 h-9 rounded-full text-xs font-extrabold transition ${
                            safePage === p
                              ? 'bg-[#0071E3] text-white shadow'
                              : 'bg-surface border border-line text-fg hover:border-[#0071E3]'
                          }`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}

                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => {
                      setStoreExtraEightShown(true);
                      setStorePage(p => Math.min(totalPages, p + 1));
                    }}
                    className="px-5 py-2 rounded-full bg-[#0071E3] text-white text-xs font-extrabold disabled:opacity-35 transition"
                  >
                    الصفحة التالية ←
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {cartSummary.totalQty > 0 && renderStickyCartBar()}
      </div>
    );
  
}

export function renderFreeShippingProgressBar(ctx) {
  const { cartSummary, formatMoney, siteSettings } = ctx;
    if (siteSettings.enableFreeShippingBar === false || cartSummary.items.length === 0) return null;
    const isUnlocked = cartSummary.isFreeShippingUnlocked;
    const pct = cartSummary.freeShippingProgressPct;
    const rem = cartSummary.remainingForFreeShippingBase;

    return (
      <div className={`p-3.5 rounded-2xl border transition-all ${
        isUnlocked
          ? 'bg-[#0071E3]/10 border-[#0071E3]/40 text-fg'
          : 'bg-surface2 border-line text-fg'
      } space-y-2`}>
        <div className="flex items-center justify-between gap-2 text-xs font-extrabold">
          {isUnlocked ? (
            <div className="flex items-center gap-1.5 text-[#0066CC] dark:text-[#2997FF]">
              <span>🎉</span>
              <span>
                {cartSummary.isDiamondFreeShip
                  ? 'شحن مجاني دائم مفعّل بفضل مستواك الألماسي !'
                  : cartSummary.deliveryFeeBase > 0
                  ? `مبروك! حصلت على خصم توصيل — المتبقي عليك ${formatMoney(cartSummary.deliveryFeeBase)} فقط على هذا الطلب!`
                  : 'مبروك! حصلت على شحن مجاني بالكامل (0 ج.م) على هذا الطلب!'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span>🚚</span>
              <span>
                أضف منتجات بقيمة <span className="text-[#0066CC] dark:text-[#2997FF] font-black">{formatMoney(rem)}</span> فقط للحصول على <span className="text-[#0066CC] dark:text-[#2997FF] font-black">شحن مجاني!</span>
              </span>
            </div>
          )}
          <span className="font-mono text-[11px] font-black text-[#0066CC] dark:text-[#2997FF] shrink-0">{isUnlocked ? '100%' : `${pct}%`}</span>
        </div>
        <div className="w-full h-2.5 bg-bg rounded-full overflow-hidden border border-line">
          <div
            className="h-full transition-all duration-500 rounded-full bg-gradient-to-r from-[#0071E3] to-[#2997FF]"
            style={{ width: `${Math.max(6, isUnlocked ? 100 : pct)}%` }}
          />
        </div>
      </div>
    );
  
}

export function renderSmartCrossSellBundles(ctx) {
  const { calculatePartPrice, currentGroup, formatMoney, getSmartCrossSellSuggestions, handleAddCrossSellBundleItem, siteSettings } = ctx;
    const suggestions = getSmartCrossSellSuggestions();
    if (suggestions.length === 0) return null;
    const discPct = Number(siteSettings.crossSellBundleDiscountPct) || 10;

    return (
      <div className="p-3.5 rounded-2xl bg-surface2/70 border border-[#0071E3]/35 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-extrabold text-fg flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#0066CC] shrink-0" />
            <span>🎁 باقة مقترحة تكمل طلبك بخصم خاص (-{discPct}%)</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full bg-[#0071E3] text-white text-[10px] font-black">
            خصم فوري بالسلة ⚡
          </span>
        </div>
        <p className="text-[11px] text-muted">
          أضف أي منتج من الباقة المقترحة الآن وسيُخصم <b>{discPct}%</b> من سعره فوراً داخل فاتورتك:
        </p>

        <div className="space-y-2">
          {suggestions.map(sug => {
            const pInfo = calculatePartPrice(sug, currentGroup);
            const bundledEgp = Math.max(1, Math.round(pInfo.baseEgpPrice * (1 - discPct / 100)));
            const savedEgp = Math.max(1, pInfo.baseEgpPrice - bundledEgp);
            return (
              <div
                key={sug.id}
                className="p-2.5 rounded-xl bg-surface border border-line flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={sug.image || PART_IMAGES.screen}
                    alt={sug.name}
                    loading="lazy"
                    onError={e => { e.currentTarget.src = PART_IMAGES.screen; }}
                    className="w-12 h-12 rounded-xl object-contain bg-surface2 border border-line p-1 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-fg truncate">{sug.name}</div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs font-black text-[#0066CC] dark:text-[#2997FF]">
                        {formatMoney(bundledEgp)}
                      </span>
                      <span className="text-[10px] text-muted line-through font-mono">
                        {formatMoney(pInfo.baseEgpPrice)}
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-[#0071E3]/15 text-[#0066CC] dark:text-[#2997FF] text-[9px] font-black">
                        وفّر {formatMoney(savedEgp)}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAddCrossSellBundleItem(sug)}
                  className="px-3.5 py-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-[11px] font-black shrink-0 flex items-center gap-1 shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>أضف بـ {formatMoney(bundledEgp)}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  
}

export function renderCashierImpulseShelf(ctx) {
  const { calculatePartPrice, currentGroup, formatMoney, getCashierImpulseItems, getPartQualityTiers, setSelectedQualityTiers, showToast, siteSettings, updateCartQty } = ctx;
    const impulseItems = getCashierImpulseItems();
    if (impulseItems.length === 0) return null;

    return (
      <div className="p-3.5 rounded-2xl bg-surface2/70 border border-line space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-black text-fg flex items-center gap-1.5">
            <span>🛒</span>
            <span>رف الكاشير السريع — منتجات مفيدة أضفها لطلبك</span>
          </div>
          <span className="text-[10px] font-bold text-accent-text">أقل من {(Number(siteSettings.cashierMaxPrice) || 1000).toLocaleString()} ج.م</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {impulseItems.map(imp => {
            const pInfo = calculatePartPrice(imp, currentGroup);
            const tiers = getPartQualityTiers(imp, pInfo.baseEgpPrice);
            const econTier = siteSettings.enableQualityTiers !== false && Number(pInfo.baseEgpPrice) > (Number(siteSettings.cashierMaxPrice) || 1000)
              ? tiers[2]
              : tiers[0];
            const displayPriceEgp = econTier ? econTier.priceEgp : pInfo.baseEgpPrice;

            return (
              <div
                key={imp.id}
                className="p-2.5 rounded-xl bg-surface border border-line hover:border-[#0071E3] flex flex-col justify-between gap-2 transition"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={imp.image || PART_IMAGES.screen}
                    alt={imp.name}
                    loading="lazy"
                    onError={e => { e.currentTarget.src = PART_IMAGES.screen; }}
                    className="w-10 h-10 rounded-lg object-contain bg-surface2 border border-line p-0.5 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[11px] font-extrabold text-fg line-clamp-2 leading-tight">{imp.name}</div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-1 pt-1 border-t border-line">
                  <span className="text-xs font-black text-accent-text">{formatMoney(displayPriceEgp)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      if (econTier && econTier.id !== 'original') {
                        setSelectedQualityTiers(prev => ({ ...prev, [imp.id]: econTier.id }));
                      }
                      updateCartQty(imp.id, 1);
                      showToast(`🛒 تمت إضافة "${imp.name}" لطلبك من رف الكاشير!`, 'success');
                    }}
                    className="px-3 py-1 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-[10px] font-black transition"
                  >
                    + أضف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  
}

export function renderCartDrawer(ctx) {
  const { appliedPromo, applySpinPrizePromo, cartDrawerOpen, cartSummary, currentClient, formatMoney, renderCashierImpulseShelf, renderFreeShippingProgressBar, renderSmartCrossSellBundles, setCartDrawerOpen, setCartQtyDirect, setClientTab, setLoginModalOpen, siteSettings, spinWheelState, updateCartQty } = ctx;
    if (!cartDrawerOpen) return null;
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex justify-end" onClick={() => setCartDrawerOpen(false)}>
        <div className="w-full max-w-md bg-surface text-fg h-full shadow-2xl border-r border-line flex flex-col justify-between p-5" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-line pb-3.5">
            <h3 className="text-base font-black text-fg flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#0071E3]/15 text-[#0066CC] dark:text-[#2997FF] flex items-center justify-center">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <span>سلة المشتريات ({cartSummary.totalQty} قطع)</span>
            </h3>
            <button
              onClick={() => setCartDrawerOpen(false)}
              className="w-8 h-8 rounded-full bg-surface2 hover:bg-[#0071E3] text-muted hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-3">
            {renderFreeShippingProgressBar()}

            {spinWheelState?.spun && spinWheelState?.prize && !appliedPromo && (
              <div className="p-3 rounded-2xl bg-[#0071E3]/10 border border-[#0071E3]/35 flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-fg">
                  🎁 هديتك من العجلة جاهزة: <b>{spinWheelState.prize.shortLabel}</b>
                </span>
                <button
                  type="button"
                  onClick={() => applySpinPrizePromo(spinWheelState.prize, false)}
                  className="px-3 py-1 rounded-full bg-[#0071E3] text-white font-black text-[11px]"
                >
                  تطبيق الهدية
                </button>
              </div>
            )}

            {cartSummary.items.length === 0 ? (
              <div className="text-center py-14 space-y-2 text-xs text-muted">
                <ShoppingCart className="w-10 h-10 text-muted/50 mx-auto" />
                <div className="font-bold">سلة المشتريات فارغة حالياً</div>
              </div>
            ) : (
              cartSummary.items.map(item => (
                <div
                  key={item.part.id}
                  className="p-3.5 rounded-2xl bg-surface2/50 border border-line space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs min-w-0">
                      <div className="font-extrabold text-fg flex items-center gap-1.5 flex-wrap">
                        <span className="truncate">{item.part.name}</span>
                        {item.qualityTierLabel && (
                          <span className="px-2 py-0.5 rounded-full bg-surface text-accent-text border border-line text-[9px] font-black">
                            {item.qualityTierLabel}
                          </span>
                        )}
                        {item.bundlePct > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#0071E3] text-white text-[9px] font-black">
                            🎁 خصم الباقة -{item.bundlePct}%
                          </span>
                        )}
                        {item.qtyDiscountPct > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#0071E3]/15 text-[#0066CC] dark:text-[#2997FF] text-[9px] font-black">
                            🏷️ خصم الكميات -{item.qtyDiscountPct}%
                          </span>
                        )}
                        {item.cashbackEnabled && (
                          <span className="px-2 py-0.5 rounded-full bg-[#0071E3]/15 text-[#0066CC] dark:text-[#2997FF] border border-[#0071E3]/30 text-[9px] font-black">
                            💰 كاش باك {item.cashbackPct}% (+{formatMoney(item.lineCashbackBase)})
                          </span>
                        )}
                      </div>
                      <div className="text-muted mt-1 flex items-center gap-2">
                        <span>اللون: {item.color} • السعر: <b className="text-fg">{formatMoney(item.priceInfo.baseEgpPrice)}</b></span>
                        {item.originalUnitBase > item.priceInfo.baseEgpPrice && (
                          <span className="line-through text-[10px] font-mono">{formatMoney(item.originalUnitBase)}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-surface border border-line rounded-full p-1 shrink-0">
                      <button
                        onClick={() => updateCartQty(item.part.id, 1)}
                        className="w-7 h-7 rounded-full bg-[#0071E3] hover:bg-[#0071E3] text-white flex items-center justify-center transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={item.qty}
                        onFocus={e => e.target.select()}
                        onChange={e => setCartQtyDirect(item.part.id, e.target.value)}
                        className="w-10 text-center text-xs font-black bg-transparent border-0 focus:outline-none"
                      />
                      <button
                        onClick={() => updateCartQty(item.part.id, -1)}
                        className="w-7 h-7 rounded-full bg-surface2 text-fg hover:text-rose-500 flex items-center justify-center transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {siteSettings.enableBuyMoreSaveMore !== false && item.qty < (Number(siteSettings.qtyTier3Min) || 3) && (
                    <div className="pt-2 border-t border-line/70 flex items-center justify-between gap-2 text-[10px]">
                      <span className="text-muted font-bold">
                        {item.qty === 1
                          ? `💡 اشتري ${siteSettings.qtyTier2Min || 2} بخصم ${siteSettings.qtyTier2DiscountPct || 5}%، أو ${siteSettings.qtyTier3Min || 3} بخصم ${siteSettings.qtyTier3DiscountPct || 10}%`
                          : `زوّد قطعة كمان واحصل على خصم ${siteSettings.qtyTier3DiscountPct || 10}%!`}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.part.id, 1)}
                        className="px-2.5 py-1 rounded-full bg-[#0071E3]/15 hover:bg-[#0071E3] text-[#0066CC] dark:text-[#2997FF] hover:text-white font-black shrink-0 transition"
                      >
                        + زوّد قطعة ووفّر
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}

            {renderSmartCrossSellBundles()}
            {renderCashierImpulseShelf()}
          </div>

          <div className="border-t border-line pt-3.5 space-y-2.5">
            {(cartSummary.bundleDiscountTotalBase > 0 || cartSummary.qtyDiscountTotalBase > 0) && (
              <div className="p-2.5 rounded-2xl bg-[#0071E3]/10 border border-[#0071E3]/30 text-[11px] font-bold text-[#0066CC] dark:text-[#2997FF] space-y-0.5">
                {cartSummary.bundleDiscountTotalBase > 0 && (
                  <div className="flex justify-between">
                    <span>🎁 وفّرت من خصم الباقة الذكية:</span>
                    <span>-{formatMoney(cartSummary.bundleDiscountTotalBase)}</span>
                  </div>
                )}
                {cartSummary.qtyDiscountTotalBase > 0 && (
                  <div className="flex justify-between">
                    <span>🏷️ وفّرت من خصم الكميات:</span>
                    <span>-{formatMoney(cartSummary.qtyDiscountTotalBase)}</span>
                  </div>
                )}
              </div>
            )}
            {cartSummary.expectedCashbackBase > 0 && (
              <div className="p-2.5 rounded-2xl bg-surface2 border border-[#0071E3]/35 flex items-center justify-between text-xs font-extrabold text-[#0066CC] dark:text-[#2997FF]">
                <span>💰 كاش باك يُضاف لمحفظتك فور الاستلام:</span>
                <span>+{formatMoney(cartSummary.expectedCashbackBase)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline text-sm font-black text-fg px-1">
              <span>إجمالي السلة الصافي:</span>
              <span className="text-lg font-black text-[#0066CC] dark:text-[#2997FF] font-mono">{formatMoney(cartSummary.subtotalBase)}</span>
            </div>
            <button
              onClick={() => {
                setCartDrawerOpen(false);
                if (!currentClient) {
                  setLoginModalOpen(true);
                } else {
                  setClientTab('checkout');
                }
              }}
              className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#0071E3] to-[#0077ED] hover:from-[#0071E3] hover:to-[#0071E3] text-white text-xs sm:text-sm font-black shadow-[0_8px_22px_rgba(37,99,235,0.38)] transition"
            >
              إتمام الطلب والدفع ←
            </button>
          </div>
        </div>
      </div>
    );
  
}

export function renderVipRouteView(ctx) {
  const { clientCompletedOrderCount, publicParts, renderProductCard, setClientTab, vipCatalogParts, vipMinOrders } = ctx;
    const progressPct = Math.min(100, Math.round((clientCompletedOrderCount / vipMinOrders) * 100));
    const remainingOrders = Math.max(0, vipMinOrders - clientCompletedOrderCount);
    const displayVipItems = vipCatalogParts.length > 0 ? vipCatalogParts : publicParts.slice(0, 8);

    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-slate-950 to-slate-900 text-white p-6 sm:p-8 border-2 border-amber-400/50 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
                <Award className="w-4 h-4" />
                <span>👑 الرابط الخاص لنادي كبار العملاء — ELZOGHBI PRIVATE VIP</span>
              </div>
              <h1 className="text-xl sm:text-3xl font-black tracking-wide text-amber-300">
                عروض وباكدجات حصرية وأسعار خاصة لعملائنا المميزين
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                وصلت إلى هذا القسم عبر <b>الرابط الخاص لعملاء الـ VIP</b> (المخصص للعملاء الذين أتموا {vipMinOrders} طلبات فأكثر). جميع الأسعار هنا مخفضة حصرياً لك ولا تظهر للزوار العاديين.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 min-w-[270px] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-300">حالة الرابط الخاص:</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-400 text-slate-950">
                  👑 مفعّل لك الآن ✓
                </span>
              </div>
              <div className="text-[11px] text-accent-text font-bold">
                ✓ استمتع بأسعار الـ VIP الحصرية وأولوية التجهيز والشحن الفوري
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base sm:text-lg font-black text-fg flex items-center gap-2">
              <span>👑</span>
              <span>منتجات وباكدجات الـ VIP الحصرية ({displayVipItems.length} عروض)</span>
            </h2>
            <button
              type="button"
              onClick={() => setClientTab('home')}
              className="text-xs font-extrabold text-accent-text hover:underline"
            >
              ← العودة للرئيسية
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayVipItems.map(part => renderProductCard(part))}
          </div>
        </div>
      </div>
    );
  
}

export function renderFilterSheet(ctx) {
  const { filterSheet, filterSheetQuery, isCategoryHidden, partPassesStoreFilters, publicBrands, publicModels, publicParts, selectedBrand, selectedCategory, selectedModelId, setFilterSheet, setFilterSheetQuery, setSelectedBrand, setSelectedCategory, setSelectedModelId } = ctx;
    if (!filterSheet) return null;
    const q = filterSheetQuery.trim().toLowerCase();
    let title = '';
    let rows = [];
    let current = 'ALL';
    let pick = () => {};
    if (filterSheet === 'brand') {
      title = 'اختار الماركة';
      rows = [{ id: 'ALL', label: 'كل الماركات' }, ...publicBrands.map(b => ({ id: b, label: b }))];
      current = selectedBrand;
      pick = id => { setSelectedBrand(id); setSelectedModelId('ALL'); setSelectedCategory('ALL'); };
    } else if (filterSheet === 'category') {
      title = 'اختار التصنيف';
      const counts = {};
      publicParts.filter(pt => partPassesStoreFilters(pt, true)).forEach(pt => {
        const nc = normalizePartCategory(pt.category, pt.name);
        if (nc && !isCategoryHidden(nc)) {
          counts[nc] = (counts[nc] || 0) + 1;
        }
      });
      rows = [{ id: 'ALL', label: 'كل التصنيفات' }, ...Object.keys(counts).map(c => ({ id: c, label: c }))];
      current = selectedCategory;
      pick = id => setSelectedCategory(id);
    } else {
      title = 'اختار الموديل';
      rows = [
        { id: 'ALL', label: 'كل الموديلات' },
        ...publicModels
          .filter(m => selectedBrand === 'ALL' || m.brand === selectedBrand)
          .map(m => ({ id: m.id, label: m.name, sub: m.brand, image: m.image || PART_IMAGES.screen }))
      ];
      current = selectedModelId;
      pick = id => { setSelectedModelId(id); setSelectedCategory('ALL'); };
    }
    const shown = rows.filter(r => !q || r.label.toLowerCase().includes(q) || (r.sub || '').toLowerCase().includes(q));
    return (
      <div className="fixed inset-0 z-[60] bg-nav flex items-end sm:items-center justify-center sm:p-4" onClick={() => setFilterSheet(null)}>
        <div onClick={e => e.stopPropagation()} className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[80vh] flex flex-col overflow-hidden shadow-2xl">
          <div className="shrink-0 p-4 pb-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-fg">{title}</h3>
              <button type="button" onClick={() => setFilterSheet(null)} className="w-10 h-10 rounded-xl bg-surface2 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
            {rows.length > 8 && (
              <input
                type="text"
                value={filterSheetQuery}
                onChange={e => setFilterSheetQuery(e.target.value)}
                placeholder="دوّر هنا..."
                className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface2 text-sm"
              />
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-2 space-y-1">
            {shown.length === 0 && <div className="py-8 text-center text-xs text-muted">مفيش نتايج</div>}
            {shown.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => { pick(r.id); setFilterSheet(null); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-right transition ${current === r.id ? 'bg-blue-50 border border-blue-300' : 'hover:bg-surface2 border border-transparent'}`}
              >
                {r.image && <img src={r.image} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />}
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-extrabold text-fg truncate">{r.label}</span>
                  {r.sub && <span className="block text-[11px] text-muted">{r.sub}</span>}
                </span>
                {current === r.id && <span className="text-blue-600 font-black shrink-0">✓</span>}
              </button>
            ))}
          </div>
          <div className="shrink-0 p-3 border-t border-line" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
            <button type="button" onClick={() => setFilterSheet(null)} className="w-full py-3 rounded-xl bg-blue-600 text-white font-extrabold text-sm">
              عرض النتايج
            </button>
          </div>
        </div>
      </div>
    );
  
}

export function renderLightbox(ctx) {
  const { lightbox, setLightbox } = ctx;
    if (!lightbox || !lightbox.list || lightbox.list.length === 0) return null;
    return (
      <ImageViewer
        images={lightbox.list}
        index={lightbox.index}
        onClose={() => setLightbox(null)}
        onIndexChange={i => setLightbox(prev => ({ ...prev, index: i }))}
      />
    );
  
}

export function renderClientFooter(ctx, isPreview = false) {
  const { favoritePartIds, getFooterConfig, renderSocialIconsGroup, renderVvipBrandEmblem, setClientTab, setStoreStockFilter, setWarrantyModalOpen, showToast, siteSettings, switchPortal } = ctx;
    const fCfg = getFooterConfig(siteSettings);
    if (!fCfg.showFooter && !isPreview) return null;
    const forceDark = fCfg.footerTheme === 'dark';
    const forceLight = fCfg.footerTheme === 'light';
    const ftrWrapCls = forceDark
      ? 'bg-[#161617] text-white border-[#38383A]'
      : forceLight
      ? 'bg-white text-slate-900 border-slate-200/80'
      : 'bg-white dark:bg-[#161617] text-fg border-slate-200/80 dark:border-[#38383A]';
    const mutedCls = forceDark ? 'text-slate-400' : forceLight ? 'text-slate-600' : 'text-muted';
    const titleCls = forceDark ? 'text-white' : forceLight ? 'text-slate-900' : 'text-fg';

    return (
      <footer
        id={isPreview ? undefined : 'store-contact-footer'}
        className={`${isPreview ? '' : 'mt-12'} ${ftrWrapCls} border-t pt-12 ${isPreview ? 'pb-6' : 'pb-24 sm:pb-20'} relative`}
      >
        <div className="max-w-[1380px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-200/80 dark:border-[#38383A]">
            {/* Column 1: معلومات التواصل */}
            {fCfg.showContactCol && (
              <div className="space-y-3">
                <h4 className={`text-sm font-black ${titleCls}`}>{fCfg.contactColTitle}</h4>
                <div className={`space-y-2.5 text-xs font-bold ${mutedCls}`}>
                  {(fCfg.customFooterPhone || siteSettings.whatsappNumber) && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#0066CC] shrink-0" />
                      <span className="font-mono" dir="ltr">{fCfg.customFooterPhone || siteSettings.whatsappNumber}</span>
                    </div>
                  )}
                  {(fCfg.customFooterHours || siteSettings.workingHours) && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#0066CC] shrink-0" />
                      <span>{fCfg.customFooterHours || siteSettings.workingHours}</span>
                    </div>
                  )}
                  {fCfg.footerLocationText && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#0066CC] shrink-0" />
                      <span>{fCfg.footerLocationText}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Column 2: طرق الدفع الآمنة */}
            {fCfg.showPaymentsCol && (
              <div className="space-y-3">
                <h4 className={`text-sm font-black ${titleCls}`}>{fCfg.paymentsColTitle}</h4>
                <div className="flex flex-wrap items-center gap-2" dir="ltr">
                  {fCfg.showBadgeVisa && (
                    <span className="h-8 px-3 rounded-lg bg-surface2 dark:bg-[#1D1D1F] border border-line text-[11px] font-black tracking-wider text-[#004F9F] dark:text-[#2997FF] inline-flex items-center justify-center">
                      VISA
                    </span>
                  )}
                  {fCfg.showBadgeMastercard && (
                    <span className="h-8 px-2.5 rounded-lg bg-surface2 dark:bg-[#1D1D1F] border border-line inline-flex items-center justify-center" title="Mastercard">
                      <span className="w-3.5 h-3.5 rounded-full bg-[#EB001B] inline-block" />
                      <span className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] -ms-1.5 inline-block opacity-90" />
                    </span>
                  )}
                  {fCfg.showBadgeApplePay && (
                    <span className="h-8 px-2.5 rounded-lg bg-surface2 dark:bg-[#1D1D1F] border border-line text-[11px] font-black text-fg inline-flex items-center gap-1" title="Apple Pay">
                      <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                      </svg>
                      <span>Pay</span>
                    </span>
                  )}
                  {fCfg.showBadgeInstaPay && (
                    <span className="h-8 px-2.5 rounded-lg bg-slate-500/10 border border-slate-500/30 text-[10px] font-black text-slate-700 dark:text-slate-300 inline-flex items-center">
                      InstaPay
                    </span>
                  )}
                  {fCfg.showBadgeVCash && (
                    <span className="h-8 px-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[10px] font-black text-rose-600 dark:text-rose-300 inline-flex items-center">
                      V-Cash
                    </span>
                  )}
                </div>
                {fCfg.codNoteText && (
                  <div className={`text-xs font-bold ${mutedCls} pt-1`}>
                    {fCfg.codNoteText}
                  </div>
                )}
              </div>
            )}

            {/* Column 3: خدمة العملاء */}
            {fCfg.showSupportCol && (
              <div className="space-y-3">
                <h4 className={`text-sm font-black ${titleCls}`}>{fCfg.supportColTitle}</h4>
                <ul className={`space-y-2 text-xs font-bold ${mutedCls}`}>
                  {fCfg.showWarrantyLink && (
                    <li>
                      <button type="button" onClick={() => setWarrantyModalOpen(true)} className="hover:text-[#0066CC] transition">
                        فحص الضمان بالرقم
                      </button>
                    </li>
                  )}
                  {fCfg.showReturnPolicyLink && (
                    <li>
                      <button type="button" onClick={() => showToast(`${siteSettings.returnPolicyTitle}: ${siteSettings.returnPolicyText}`, 'info')} className="hover:text-[#0066CC] transition">
                        سياسة الاسترجاع
                      </button>
                    </li>
                  )}
                  {fCfg.showTermsLink && (
                    <>
                      <li>
                        <button type="button" onClick={() => showToast(`${siteSettings.termsTitle}: ${siteSettings.termsText}`, 'info')} className="hover:text-[#0066CC] transition">
                          شروط الاستخدام والضمان
                        </button>
                      </li>
                      <li>
                        <button type="button" onClick={() => { window.location.hash = '#/sell/terms'; setClientTab('sell'); }} className="hover:text-[#0066CC] transition">
                          شروط إعلانات «بيع عندنا»
                        </button>
                      </li>
                    </>
                  )}
                  {fCfg.showShippingPolicyLink && (
                    <li>
                      <button type="button" onClick={() => showToast(`${siteSettings.deliveryPolicyTitle}: ${siteSettings.deliveryPolicyText}`, 'info')} className="hover:text-[#0066CC] transition">
                        سياسة الشحن والتوصيل
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Column 4: روابط سريعة */}
            {fCfg.showQuickLinksCol && (
              <div className="space-y-3">
                <h4 className={`text-sm font-black ${titleCls}`}>{fCfg.quickLinksTitle}</h4>
                <ul className={`space-y-2 text-xs font-bold ${mutedCls}`}>
                  {fCfg.showLinkHome && (
                    <li>
                      <button type="button" onClick={() => { setStoreStockFilter('ALL'); setClientTab('home'); }} className="hover:text-[#0066CC] transition">
                        الرئيسية
                      </button>
                    </li>
                  )}
                  {fCfg.showLinkProducts && (
                    <li>
                      <button type="button" onClick={() => { setStoreStockFilter('ALL'); setClientTab('search'); }} className="hover:text-[#0066CC] transition">
                        المنتجات
                      </button>
                    </li>
                  )}
                  {fCfg.showLinkBestSellers && (
                    <li>
                      <button type="button" onClick={() => { setStoreStockFilter('BEST_SELLERS'); setClientTab('search'); }} className="hover:text-[#0066CC] transition">
                        الأكثر مبيعاً
                      </button>
                    </li>
                  )}
                  {fCfg.showLinkOffers && (
                    <li>
                      <button type="button" onClick={() => { setStoreStockFilter('DISCOUNTS'); setClientTab('search'); }} className="hover:text-[#0066CC] transition">
                        العروض والخصومات
                      </button>
                    </li>
                  )}
                  {fCfg.showLinkFavorites && (
                    <li>
                      <button type="button" onClick={() => { setStoreStockFilter('FAVORITES'); setClientTab('search'); }} className="hover:text-[#0066CC] transition">
                        المفضلة ({favoritePartIds.length})
                      </button>
                    </li>
                  )}
                  {fCfg.customFooterLinkLabel && fCfg.customFooterLinkUrl && (
                    <li>
                      <a href={fCfg.customFooterLinkUrl} target="_blank" rel="noopener noreferrer" className="text-[#0066CC] dark:text-[#2997FF] hover:underline">
                        {fCfg.customFooterLinkLabel}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Column 5: Brand Emblem + Social Icons */}
            {fCfg.showBrandCol && (
              <div className="space-y-4">
                {fCfg.showFooterLogo && renderVvipBrandEmblem('lg', forceDark)}
                {fCfg.footerDescription && (
                  <p className={`text-xs ${mutedCls} leading-relaxed`}>
                    {fCfg.footerDescription}
                  </p>
                )}
                {fCfg.showSocialIcons && (
                  <div className="flex items-center gap-2 pt-1">
                    {renderSocialIconsGroup()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Copyright Bar (Centered / Spaced Cleanly So Floating Widgets Never Overlap!) */}
          <div className={`pt-6 flex flex-wrap items-center justify-between gap-4 text-xs ${mutedCls}`}>
            <div className={`font-extrabold ${titleCls}`}>
              {fCfg.bottomSloganPrefix} <span className="text-[#0066CC] dark:text-[#0066CC]">{siteSettings.storeName || 'ELZOGHBI'}</span>
            </div>

            <div className="flex items-center gap-3">
              <span
                onDoubleClick={() => switchPortal('admin')}
                className="select-none cursor-default font-bold"
                title="ELZOGHBI"
              >
                {fCfg.copyrightText || `© ${new Date().getFullYear()} جميع الحقوق محفوظة لمتجر ${siteSettings.storeName || 'ELZOGHBI'}.`}
              </span>
              <button
                type="button"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-9 h-9 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white flex items-center justify-center shadow-md shadow-blue-600/30 transition"
                title="الصعود لأعلى الصفحة"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      </footer>
    );
  
}
