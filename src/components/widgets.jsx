import React, { useState, useEffect } from 'react';
import { EyeOff, Eye, X, Minus, Plus, ChevronLeft } from 'lucide-react';
import { getAdTheme } from '../lib/utils.jsx';
import { PART_IMAGES, SHORTCUT_ICON_PRESETS } from '../data/constants.jsx';
import { Bidi } from '../i18n.jsx';

export function PasswordInput({ value, onChange, className = '', ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...rest} type={show ? 'text' : 'password'} value={value} onChange={onChange} className={`${className} pl-10`} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow(v => !v)}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-muted"
        title={show ? 'إخفاء كلمة السر' : 'إظهار كلمة السر'}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export function ImageViewer({ images, index, onClose, onIndexChange }) {
  const total = images.length;
  const idx = ((index % total) + total) % total;
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ptrs = React.useRef(new Map());
  const g = React.useRef({ startDist: 0, startScale: 1, startPos: { x: 0, y: 0 }, startPt: { x: 0, y: 0 }, moved: false, swipe: null });
  const lastTap = React.useRef(0);

  const go = d => onIndexChange((idx + d + total) % total);
  const resetZoom = () => { setScale(1); setPos({ x: 0, y: 0 }); };
  const zoomBy = f => {
    setScale(sc => {
      const n = Math.min(6, Math.max(1, sc * f));
      if (n <= 1) setPos({ x: 0, y: 0 });
      return n;
    });
  };

  useEffect(() => { resetZoom(); }, [idx]);
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onPointerDown = e => {
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {}
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const st = g.current;
    if (ptrs.current.size === 1) {
      st.startPt = { x: e.clientX, y: e.clientY };
      st.startPos = { ...pos };
      st.moved = false;
      st.swipe = { x: e.clientX, y: e.clientY };
    } else if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()];
      st.startDist = Math.hypot(a.x - b.x, a.y - b.y);
      st.startScale = scale;
      st.swipe = null;
      st.moved = true;
    }
  };
  const onPointerMove = e => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const st = g.current;
    if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (st.startDist > 0) setScale(Math.min(6, Math.max(1, (st.startScale * d) / st.startDist)));
    } else if (ptrs.current.size === 1) {
      const dx = e.clientX - st.startPt.x;
      const dy = e.clientY - st.startPt.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) st.moved = true;
      if (scale > 1) setPos({ x: st.startPos.x + dx, y: st.startPos.y + dy });
    }
  };
  const onPointerUp = e => {
    if (!ptrs.current.has(e.pointerId)) return;
    ptrs.current.delete(e.pointerId);
    const st = g.current;
    if (ptrs.current.size > 0) return;
    if (scale <= 1.02 && st.swipe) {
      const dx = e.clientX - st.swipe.x;
      const dy = e.clientY - st.swipe.y;
      if (total > 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        st.swipe = null;
        go(dx < 0 ? 1 : -1);
        return;
      }
    }
    if (!st.moved) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        if (scale > 1) resetZoom();
        else setScale(2.5);
        lastTap.current = 0;
      } else {
        lastTap.current = now;
      }
    }
    if (scale <= 1.02) resetZoom();
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/95 flex flex-col" dir="ltr">
      <div className="flex items-center justify-between p-3 text-white gap-2">
        <button type="button" onClick={onClose} className="w-11 h-11 rounded-full bg-surface hover:bg-surface flex items-center justify-center" title="إغلاق">
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => zoomBy(0.75)} className="w-10 h-10 rounded-full bg-surface hover:bg-surface flex items-center justify-center" title="تصغير">
            <Minus className="w-5 h-5" />
          </button>
          <span className="text-xs font-bold w-12 text-center">{Math.round(scale * 100)}%</span>
          <button type="button" onClick={() => zoomBy(1.4)} className="w-10 h-10 rounded-full bg-surface hover:bg-surface flex items-center justify-center" title="تكبير">
            <Plus className="w-5 h-5" />
          </button>
          <button type="button" onClick={resetZoom} className="px-3 h-10 rounded-full bg-surface hover:bg-surface text-xs font-bold">
            1:1
          </button>
        </div>
        <span className="text-xs font-bold bg-surface rounded-full px-3 py-2">{idx + 1} / {total}</span>
      </div>

      <div className="flex-1 relative">
        <div
          className="absolute inset-0 overflow-hidden select-none"
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={e => zoomBy(e.deltaY < 0 ? 1.15 : 0.87)}
        >
          <img
            src={images[idx]}
            alt=""
            draggable={false}
            className="absolute inset-0 m-auto max-w-full max-h-full object-contain"
            style={{
              transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
              transition: ptrs.current.size ? 'none' : 'transform 0.15s ease-out',
              cursor: scale > 1 ? 'grab' : 'zoom-in'
            }}
          />
        </div>
        {total > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-surface hover:bg-surface text-white text-3xl flex items-center justify-center">‹</button>
            <button type="button" onClick={() => go(1)} className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-surface hover:bg-surface text-white text-3xl flex items-center justify-center">›</button>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-2 p-3">
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt=""
              onClick={() => onIndexChange(i)}
              className={`w-12 h-12 rounded-lg object-cover cursor-pointer border-2 ${i === idx ? 'border-[#3B82F6]' : 'border-transparent opacity-60'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdContent({ ad = {}, compact = false, rtl = true, isPromoCard = false, heroFixed = false }) {
  const th = getAdTheme(ad);
  const rawLayout = ad.layout || (ad.image ? 'editorial_split' : 'icon_3d_studio');

  // Map legacy v10/v11 template keys cleanly into architectural v12 modes + frame styles
  let layout = rawLayout;
  let defaultFrameFromLegacy = 'white_pedestal';
  if (rawLayout === 'studio_card_white') {
    layout = 'editorial_split';
    defaultFrameFromLegacy = 'white_pedestal';
  } else if (rawLayout === 'vip_glass') {
    layout = 'editorial_split';
    defaultFrameFromLegacy = 'frosted_glass';
  } else if (rawLayout === 'framed') {
    layout = 'editorial_split';
    defaultFrameFromLegacy = 'ambient_fill';
  } else if (rawLayout === 'circle_spotlight') {
    layout = 'editorial_split';
    defaultFrameFromLegacy = 'circle_pedestal';
  } else if (rawLayout === 'blend') {
    layout = 'seamless_blend';
    defaultFrameFromLegacy = 'clean_float';
  } else if (rawLayout === 'flagship_3d') {
    if (ad.mediaMode === 'icon_only' || !ad.image) {
      layout = 'icon_3d_studio';
    } else {
      layout = 'editorial_split';
      defaultFrameFromLegacy = 'white_pedestal';
    }
  }

  const dark = !(th.light && layout !== 'full');
  const hasImage = Boolean(ad.image && String(ad.image).trim() !== '') && layout !== 'text' && layout !== 'icon_3d_studio';
  const center = ad.align === 'center';
  const isCover = ad.imageFit === 'cover';
  const focalPoint = ad.imageFocal || 'center';
  const frameStyle = ad.imageFrameStyle || defaultFrameFromLegacy;
  const imgPos = ad.imagePos || 'left'; // 'left' (default in RTL: text right, image left) | 'right' | 'top'
  const imgScale = Math.min(155, Math.max(60, Number(ad.imageScale) || 100));
  const offsetX = Math.min(60, Math.max(-60, Number(ad.imageOffsetX) || 0));
  const offsetY = Math.min(60, Math.max(-60, Number(ad.imageOffsetY) || 0));
  const widthPct = [36, 44, 52].includes(Number(ad.imageWidthPct)) ? Number(ad.imageWidthPct) : 44;
  const overlay = Math.min(90, Math.max(0, Number(ad.overlay === undefined ? 52 : ad.overlay)));
  const showBadge = ad.showBadge !== false && Boolean(ad.badge);
  const showButton = ad.showButton !== false;
  const radiusKey = ad.imageRadius || 'xl';
  const radiusCls =
    frameStyle === 'circle_pedestal' || radiusKey === 'full'
      ? 'rounded-full'
      : radiusKey === 'none'
      ? 'rounded-none'
      : radiusKey === 'md'
      ? 'rounded-2xl'
      : 'rounded-[24px]';

  const bannerHeightMode = ad.bannerHeight || 'standard';
  // Hero carousel: one fixed height for every slide so flipping between ads
  // never resizes the banner (each ad's own bannerHeight used to win).
  const heightCls = heroFixed
    ? 'h-[470px] sm:h-[500px] lg:h-[370px]'
    : compact
    ? 'min-h-[110px]'
    : isPromoCard
    ? 'min-h-[145px] sm:min-h-[195px]'
    : bannerHeightMode === 'compact'
    ? 'min-h-[150px] sm:min-h-[210px]'
    : bannerHeightMode === 'tall'
    ? 'min-h-[215px] sm:min-h-[300px]'
    : 'min-h-[168px] sm:min-h-[245px]';

  const iconKey = ad.iconPreset && SHORTCUT_ICON_PRESETS[ad.iconPreset] ? ad.iconPreset : 'flagship_iphones';
  const iconPresetObj = SHORTCUT_ICON_PRESETS[iconKey] || SHORTCUT_ICON_PRESETS.flagship_iphones;

  const imgTransformStyle = {
    objectPosition: focalPoint,
    transform:
      imgScale !== 100 || offsetX !== 0 || offsetY !== 0
        ? `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${imgScale / 100})`
        : undefined,
    transformOrigin: 'center center'
  };

  const renderAmbientWaves = () => (
    <>
      <svg className="pointer-events-none absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none" viewBox="0 0 1440 540" fill="none">
        <path d="M-80 410 C 340 160, 720 500, 1520 110" stroke={th.accentColor || '#60A5FA'} strokeWidth="2" strokeOpacity="0.5" />
        <path d="M-80 470 C 420 220, 800 540, 1520 190" stroke={th.accentColor || '#3B82F6'} strokeWidth="1.2" strokeOpacity="0.3" />
      </svg>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(48% 72% at 24% 50%, ${th.accentColor || '#3B82F6'}2e 0%, transparent 72%)`
        }}
      />
    </>
  );

  const renderCopyBlock = (extraCls = '') => (
    <div
      className={`relative z-10 flex flex-col justify-center ${
        compact ? 'space-y-1.5' : isPromoCard ? 'space-y-2.5' : 'space-y-3.5 sm:space-y-4'
      } ${center || imgPos === 'top' ? 'items-center text-center mx-auto' : rtl ? 'items-start text-right' : 'items-start text-left'} ${extraCls}`}
    >
      {showBadge && (
        <span
          className={`inline-flex w-fit items-center gap-1.5 rounded-full font-extrabold tracking-wide ${
            compact ? 'px-2.5 py-0.5 text-[10px]' : 'px-3.5 py-1 text-xs'
          } ${
            dark
              ? 'bg-white/12 text-blue-200 border border-white/20 backdrop-blur-md'
              : 'bg-[#2563EB]/12 text-[#1D4ED8] border border-[#2563EB]/25'
          }`}
        >
          <Bidi text={ad.badge} />
        </span>
      )}

      {ad.title && (
        <h2
          className={`font-black tracking-tight whitespace-pre-line leading-[1.22] ${
            dark ? 'text-white' : 'text-slate-900'
          } ${
            compact
              ? 'text-sm sm:text-base line-clamp-2'
              : isPromoCard
              ? 'text-xl sm:text-2xl lg:text-[28px] line-clamp-2'
              : 'text-2xl sm:text-4xl lg:text-[42px]'
          }`}
        >
          <Bidi text={ad.title} />
        </h2>
      )}

      {ad.subtitle && (
        <p
          className={`font-semibold leading-relaxed max-w-xl ${
            dark ? 'text-slate-200/90' : 'text-slate-700'
          } ${compact ? 'text-[10px] line-clamp-1' : isPromoCard ? 'text-xs sm:text-sm line-clamp-2' : 'text-xs sm:text-base line-clamp-3'}`}
        >
          <Bidi text={ad.subtitle} />
        </p>
      )}

      {showButton && (
        <div className={compact ? 'pt-0.5' : 'pt-1.5'}>
          <span
            className={`inline-flex w-fit items-center gap-2 rounded-full font-extrabold transition-all shadow-lg ${
              compact ? 'px-3.5 py-1 text-[10px]' : isPromoCard ? 'px-5 py-2.5 text-xs sm:text-sm' : 'px-7 py-3 text-xs sm:text-sm'
            } ${
              dark
                ? 'bg-white text-slate-950 hover:bg-blue-50 shadow-black/25'
                : 'bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-slate-900/20'
            }`}
          >
            <span>{ad.buttonText || 'تسوق الآن'}</span>
            <ChevronLeft className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
          </span>
        </div>
      )}
    </div>
  );

  // 1. FULL-BLEED READY-MADE POSTER (`full_clean` — 100% edge-to-edge, zero cropping or ambient-filled)
  if (layout === 'full_clean' && hasImage) {
    return (
      <div className={`relative w-full ${heightCls} flex items-end overflow-hidden select-none`}>
        {!isCover && (
          <img
            src={ad.image}
            alt=""
            aria-hidden="true"
            referrerPolicy="no-referrer"
            className="pointer-events-none absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-55"
          />
        )}
        <img
          src={ad.image}
          alt={ad.title || ''}
          draggable={false}
          referrerPolicy="no-referrer"
          style={imgTransformStyle}
          className={`absolute inset-0 w-full h-full ${isCover ? 'object-cover' : 'object-contain'} pointer-events-none select-none transition-transform duration-300`}
        />
        {(ad.showOverlayOnClean || false) && (showBadge || showButton) && (
          <div className="relative z-10 w-full p-4 sm:p-6 bg-gradient-to-t from-black/55 via-black/15 to-transparent flex items-center justify-between gap-3">
            {showBadge ? (
              <span className="px-3.5 py-1 rounded-full bg-black/65 backdrop-blur-md text-white text-xs font-extrabold border border-white/20">
                <Bidi text={ad.badge} />
              </span>
            ) : <span />}
            {showButton && (
              <span className="px-6 py-2.5 rounded-full bg-white text-slate-950 text-xs sm:text-sm font-black shadow-xl inline-flex items-center gap-1.5">
                <span>{ad.buttonText || 'تسوق الآن'}</span>
                <ChevronLeft className="w-4 h-4" />
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // 2. FULL BACKGROUND PHOTO + SCRIM OVERLAY (`full`)
  if (layout === 'full' && hasImage) {
    return (
      <div className={`relative w-full ${heightCls} flex items-center overflow-hidden ${compact ? 'p-4' : isPromoCard ? 'p-6 sm:p-8' : 'px-6 sm:px-12 py-8 sm:py-10'}`}>
        <img
          src={ad.image}
          alt=""
          draggable={false}
          referrerPolicy="no-referrer"
          style={imgTransformStyle}
          className={`absolute inset-0 w-full h-full ${isCover ? 'object-cover' : 'object-contain'} pointer-events-none select-none`}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: center
              ? `rgba(6, 13, 36, ${Math.max(0.25, overlay / 100)})`
              : `linear-gradient(${rtl ? '270deg' : '90deg'}, rgba(6,13,36,${Math.min(0.95, (overlay + 20) / 100)}) 0%, rgba(6,13,36,${Math.max(0.2, overlay / 100)}) 55%, rgba(6,13,36,0.18) 100%)`
          }}
        />
        <div className={`relative z-10 w-full ${center ? 'max-w-2xl mx-auto' : 'max-w-xl'}`}>
          {renderCopyBlock()}
        </div>
      </div>
    );
  }

  // 3. SEAMLESS DIRECTIONAL CINEMATIC BLEND (`seamless_blend`)
  if (layout === 'seamless_blend' && hasImage) {
    const imgOnRight = imgPos === 'right';
    const fadeDir = rtl ? (imgOnRight ? 'to left' : 'to right') : (imgOnRight ? 'to left' : 'to right');
    const dirMask = `linear-gradient(${fadeDir}, rgba(0,0,0,1) 52%, rgba(0,0,0,0.65) 76%, rgba(0,0,0,0) 100%)`;

    return (
      <div className={`relative w-full ${heightCls} flex items-center overflow-hidden ${compact ? 'p-3.5' : isPromoCard ? 'p-6 sm:p-8' : 'px-6 sm:px-12 py-7 sm:py-9'}`}>
        {renderAmbientWaves()}
        {/* Blended Side Visual */}
        <div
          className={`hidden sm:block absolute inset-y-0 ${
            imgOnRight ? 'right-0' : 'left-0'
          } pointer-events-none overflow-hidden`}
          style={{
            width: `${Math.min(62, widthPct + 10)}%`,
            WebkitMaskImage: dirMask,
            maskImage: dirMask
          }}
        >
          <img
            src={ad.image}
            alt={ad.title || ''}
            draggable={false}
            referrerPolicy="no-referrer"
            style={imgTransformStyle}
            className={`w-full h-full ${isCover ? 'object-cover' : 'object-contain p-4'} select-none`}
          />
        </div>

        <div className={`relative z-10 w-full flex flex-col sm:flex-row items-center justify-between gap-6 ${imgOnRight ? 'sm:flex-row-reverse' : ''}`}>
          <div className="w-full sm:w-[56%]">{renderCopyBlock()}</div>
          {/* Mobile Crisp Preview Fallback */}
          <div className="sm:hidden w-full h-44 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-md p-2 flex items-center justify-center">
            <img
              src={ad.image}
              alt={ad.title || ''}
              referrerPolicy="no-referrer"
              style={imgTransformStyle}
              className={`max-w-full max-h-full ${isCover ? 'w-full h-full object-cover' : 'object-contain'} rounded-xl`}
            />
          </div>
        </div>
      </div>
    );
  }

  // 4. 3D VECTOR ICON STUDIO (`icon_3d_studio` — or when no image is uploaded and layout !== 'text')
  if (layout === 'icon_3d_studio' || (!hasImage && layout !== 'text')) {
    const isTop = imgPos === 'top';
    const reverseRow = imgPos === 'right';
    return (
      <div className={`relative w-full ${heightCls} flex items-center overflow-hidden ${compact ? 'p-3.5' : isPromoCard ? 'p-6 sm:p-8' : 'px-6 sm:px-12 py-7 sm:py-10'}`}>
        {renderAmbientWaves()}
        <div
          className={`relative z-10 w-full ${heroFixed ? 'h-full min-h-0' : ''} flex ${
            compact
              ? `flex-row items-center justify-between gap-3 ${reverseRow ? 'flex-row-reverse' : ''}`
              : isTop
              ? 'flex-col-reverse items-center text-center gap-5'
              : `flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10 ${reverseRow ? 'lg:flex-row-reverse' : ''}`
          }`}
        >
          <div className={compact ? 'w-[58%]' : isTop ? 'w-full max-w-2xl' : 'w-full lg:w-[55%]'}>
            {renderCopyBlock()}
          </div>
          <div className={`${compact ? 'w-[38%] h-24' : isPromoCard ? 'w-36 h-36 sm:w-44 sm:h-44' : 'w-48 h-48 sm:w-64 sm:h-64 lg:w-[42%] lg:h-[290px]'} ${heroFixed && !compact && !isPromoCard ? 'max-lg:w-full max-lg:flex-1 max-lg:min-h-0 max-lg:h-auto' : ''} relative flex items-center justify-center shrink-0`}>
            <div className="pointer-events-none absolute w-40 h-40 sm:w-60 sm:h-60 rounded-full blur-3xl opacity-35" style={{ backgroundColor: th.accentColor || '#3B82F6' }} />
            <div
              style={imgTransformStyle}
              className={`${
                iconKey === 'flagship_iphones'
                  ? 'w-full h-full max-w-[340px] max-h-[270px]'
                  : compact
                  ? 'w-20 h-20 rounded-2xl bg-white/10 border border-white/20 p-3'
                  : 'w-36 h-36 sm:w-48 sm:h-48 rounded-[30px] bg-white/10 backdrop-blur-xl border border-white/20 p-5 shadow-2xl'
              } flex items-center justify-center [&>svg]:w-full [&>svg]:h-full`}
            >
              {iconPresetObj.svg || (typeof iconPresetObj.render === 'function' ? iconPresetObj.render() : null)}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 5. EDITORIAL STUDIO SPLIT (`editorial_split` — Precision Controlled Image Stage + Copy)
  if (hasImage && layout !== 'text') {
    const isTop = imgPos === 'top';
    const reverseRow = imgPos === 'right';
    const copyWidthStyle = !compact && !isTop && !isPromoCard ? { flexBasis: `${100 - widthPct}%` } : undefined;
    const stageWidthStyle = !compact && !isTop && !isPromoCard ? { flexBasis: `${widthPct}%` } : undefined;

    const frameContainerCls =
      frameStyle === 'white_pedestal'
        ? `bg-white shadow-[0_22px_50px_-12px_rgba(0,0,0,0.42)] ring-1 ring-black/5 ${compact ? 'p-1.5' : 'p-3 sm:p-4'}`
        : frameStyle === 'white_cutout'
        ? `bg-gradient-to-br from-white via-slate-50 to-blue-50/95 shadow-[0_20px_48px_-10px_rgba(0,0,0,0.48)] ring-2 ring-white/60 ${compact ? 'p-2' : 'p-4 sm:p-5'}`
        : frameStyle === 'frosted_glass'
        ? `bg-white/12 backdrop-blur-xl border border-white/25 shadow-[0_22px_50px_-12px_rgba(0,0,0,0.45)] ${compact ? 'p-1.5' : 'p-3 sm:p-4'}`
        : frameStyle === 'ambient_fill'
        ? `bg-black/20 border border-white/20 shadow-[0_22px_50px_-12px_rgba(0,0,0,0.45)] p-0`
        : frameStyle === 'circle_pedestal'
        ? `bg-white shadow-[0_22px_50px_-12px_rgba(0,0,0,0.45)] ring-4 ring-white/30 aspect-square ${compact ? 'p-2' : 'p-4'}`
        : `bg-transparent`;

    const stageHeightCls = compact
      ? 'h-24 w-28 sm:w-32'
      : isPromoCard
      ? 'h-36 sm:h-44 w-36 sm:w-44'
      : bannerHeightMode === 'compact'
      ? 'h-44 sm:h-52 w-full max-w-[360px]'
      : bannerHeightMode === 'tall'
      ? 'h-56 sm:h-72 lg:h-80 w-full max-w-[460px]'
      : 'h-48 sm:h-60 lg:h-64 w-full max-w-[410px]';

    return (
      <div className={`relative w-full ${heightCls} flex items-center overflow-hidden ${compact ? 'p-3.5' : isPromoCard ? 'p-6 sm:p-8' : 'px-6 sm:px-12 py-7 sm:py-9'}`}>
        {renderAmbientWaves()}
        <div
          className={`relative z-10 w-full ${heroFixed ? 'h-full min-h-0' : ''} flex ${
            compact
              ? `flex-row items-center justify-between gap-3 ${reverseRow ? 'flex-row-reverse' : ''}`
              : isPromoCard
              ? `flex-row items-center justify-between gap-4 sm:gap-6 ${reverseRow ? 'flex-row-reverse' : ''}`
              : isTop
              ? 'flex-col-reverse items-center text-center gap-6'
              : `flex-col lg:flex-row items-center justify-between gap-6 lg:gap-10 ${reverseRow ? 'lg:flex-row-reverse' : ''}`
          }`}
        >
          {/* Copy Side */}
          <div
            style={copyWidthStyle}
            className={compact ? 'w-[58%] min-w-0' : isPromoCard ? 'flex-1 min-w-0' : isTop ? 'w-full max-w-2xl' : 'w-full lg:flex-1 min-w-0'}
          >
            {renderCopyBlock()}
          </div>

          {/* Precision Product Visual Stage */}
          <div
            style={stageWidthStyle}
            className={`relative flex items-center justify-center shrink-0 ${heroFixed && !compact && !isPromoCard ? 'max-lg:flex-1 max-lg:min-h-0 max-lg:w-full' : ''} ${
              compact ? '' : isPromoCard ? '' : isTop ? 'w-full flex justify-center' : 'w-full lg:w-auto flex justify-center'
            }`}
          >
            <div
              className="pointer-events-none absolute w-36 h-36 sm:w-56 sm:h-56 rounded-full blur-3xl opacity-30"
              style={{ backgroundColor: th.accentColor || '#3B82F6' }}
            />
            <div
              className={`relative flex items-center justify-center overflow-hidden transition-all duration-300 ${stageHeightCls}${heroFixed && !compact && !isPromoCard ? ' max-lg:h-full max-lg:max-h-[190px]' : ''} ${radiusCls} ${frameContainerCls}`}
            >
              {frameStyle === 'ambient_fill' && !isCover && (
                <img
                  src={ad.image}
                  alt=""
                  aria-hidden="true"
                  referrerPolicy="no-referrer"
                  className="pointer-events-none absolute inset-0 w-full h-full object-cover scale-125 blur-2xl opacity-65"
                />
              )}
              <img
                src={ad.image}
                alt={ad.title || ''}
                draggable={false}
                referrerPolicy="no-referrer"
                style={imgTransformStyle}
                className={`relative z-10 select-none transition-transform duration-300 ${
                  isCover
                    ? 'w-full h-full object-cover'
                    : frameStyle === 'clean_float'
                    ? 'max-w-full max-h-full w-auto h-auto object-contain drop-shadow-[0_22px_34px_rgba(0,0,0,0.45)]'
                    : `max-w-full max-h-full w-auto h-auto object-contain ${frameStyle === 'white_cutout' || ad.blendWhiteBg ? 'mix-blend-multiply contrast-105' : ''}`
                } ${frameStyle === 'ambient_fill' && !isCover ? 'p-2.5' : ''} ${
                  frameStyle === 'circle_pedestal' ? 'rounded-full' : isCover ? '' : 'rounded-xl'
                }`}
              />
            </div>

            {ad.mediaMode === 'image_and_icon' && !compact && !isPromoCard && (
              <div className="hidden sm:flex absolute -bottom-2 -left-2 z-20 w-16 h-16 rounded-2xl bg-[#08122B]/95 border border-white/25 p-2.5 shadow-xl items-center justify-center [&>svg]:w-full [&>svg]:h-full">
                {iconPresetObj.svg || (typeof iconPresetObj.render === 'function' ? iconPresetObj.render() : null)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 6. MINIMAL TYPOGRAPHIC BANNER (`text`)
  return (
    <div className={`relative w-full ${compact ? 'min-h-[115px] p-3.5' : isPromoCard ? 'min-h-[220px] p-6 sm:p-8' : 'min-h-[240px] sm:min-h-[290px] px-6 sm:px-12 py-8'} flex items-center overflow-hidden`}>
      {renderAmbientWaves()}
      <div className={`relative z-10 w-full ${center ? 'max-w-2xl mx-auto' : 'max-w-2xl'}`}>
        {renderCopyBlock()}
      </div>
    </div>
  );
}

export function BlurFitImage({ src, alt, fit = 'contain', className = '', imgClassName = '', draggable }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const effectiveSrc = (!src || failed) ? PART_IMAGES.screen : src;
  const normalizedFit = String(fit || 'contain').trim().toLowerCase();
  const isCover = normalizedFit === 'cover' || normalizedFit === 'fill';
  const fitClass = isCover ? 'object-cover object-center' : 'object-contain object-center';

  return (
    <div className={`relative w-full h-full flex items-center justify-center overflow-hidden bg-transparent ${className}`}>
      {!loaded && (
        <div className="absolute inset-2 rounded-2xl animate-pulse bg-surface2/40 pointer-events-none" />
      )}
      <img
        src={effectiveSrc}
        alt={alt || ''}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        draggable={draggable}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!failed) setFailed(true);
          setLoaded(true);
        }}
        className={`relative z-[1] w-full h-full ${fitClass} rounded-xl transition-all duration-300 ${loaded ? 'opacity-100' : 'opacity-90'} ${imgClassName}`}
      />
    </div>
  );
}

export function ClampedSpecsText({ text }) {
  const [expanded, setExpanded] = useState(false);
  const str = String(text || '');
  const isLong = str.length > 320;
  return (
    <div>
      <p
        className="text-muted leading-relaxed bg-surface p-3 rounded-xl border border-line"
        style={!expanded && isLong ? { display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : undefined}
      >
        {str}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="mt-1.5 text-[11px] font-extrabold text-accent-text hover:underline"
        >
          {expanded ? 'عرض أقل' : 'عرض كل المواصفات'}
        </button>
      )}
    </div>
  );
}
