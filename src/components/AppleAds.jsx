import React from 'react';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { getAdTheme } from '../lib/utils.jsx';

/* =====================================================================
   Apple-style promotional presentation for the storefront.
   Pure presentation — every ad still comes from the admin "store_ads"
   data (image, title, subtitle, badge, button, theme, schedule, link…)
   managed in the dashboard. Click handling is delegated to `onOpen`.
   • AppleHero        : full-width editorial hero campaign (carousel)
   • AppleAdMosaic    : large + small promotional tiles (adaptive grid)
   ===================================================================== */

const daysLeft = (ad) => {
  if (!ad || !ad.endDate) return null;
  const end = new Date(`${ad.endDate}T23:59:59`);
  const d = Math.ceil((end.getTime() - Date.now()) / 86400000);
  return Number.isFinite(d) && d >= 0 && d <= 30 ? d : null;
};

const isLight = (ad, th) => Boolean(th.light) && ad.layout !== 'full';

function Countdown({ ad, light, rtl }) {
  const d = daysLeft(ad);
  if (d === null) return null;
  const label = d === 0 ? (rtl ? 'ينتهي اليوم' : 'Ends today') : (rtl ? `ينتهي خلال ${d} ${d === 1 ? 'يوم' : 'أيام'}` : `Ends in ${d} day${d === 1 ? '' : 's'}`);
  return (
    <span className={`inline-flex items-center gap-1 text-[12px] font-medium ${light ? 'text-[#b64400]' : 'text-[#ffb340]'}`}>
      <Clock className="w-3.5 h-3.5" aria-hidden="true" />{label}
    </span>
  );
}

function CtaLink({ ad, light, rtl, big }) {
  if (ad.showButton === false) return null;
  const Arrow = rtl ? ChevronLeft : ChevronRight;
  const text = ad.buttonText || (rtl ? 'اكتشف المزيد' : 'Learn more');
  return big ? (
    <span className="inline-flex items-center gap-1.5 self-start px-5 py-2.5 rounded-full bg-[#0071E3] group-hover:bg-[#0077ED] text-white text-[15px] font-medium transition">
      {text}
    </span>
  ) : (
    <span className={`inline-flex items-center gap-0.5 text-[15px] font-medium ${light ? 'text-[#0066CC]' : 'text-[#2997FF]'} group-hover:underline`}>
      {text}<Arrow className="w-4 h-4" aria-hidden="true" />
    </span>
  );
}

function Backdrop({ th, light }) {
  return (
    <>
      <div className="absolute inset-0" style={{ background: th.cssGrad }} aria-hidden="true" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: light
            ? 'radial-gradient(90% 80% at 85% 10%, rgba(255,255,255,0.9), transparent 60%)'
            : `radial-gradient(80% 90% at 85% 100%, ${th.accentColor || '#2997ff'}55, transparent 62%)`,
        }}
        aria-hidden="true"
      />
    </>
  );
}

function AdImage({ ad, className = '', maxH = '' }) {
  if (!ad.image) return null;
  const scale = Math.min(155, Math.max(60, Number(ad.imageScale) || 100)) / 100;
  const cover = ad.imageFit === 'cover';
  return (
    <img
      src={ad.image}
      alt=""
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      draggable={false}
      className={`${cover ? 'w-full h-full object-cover' : `max-w-full ${maxH} object-contain drop-shadow-[0_24px_36px_rgba(0,0,0,0.35)]`} transition-transform duration-700 ease-out group-hover:scale-[1.04] ${className}`}
      style={{ objectPosition: ad.imageFocal || 'center', transform: scale !== 1 ? `scale(${scale})` : undefined }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Hero campaign                                                      */
/* ------------------------------------------------------------------ */
const HERO_HEIGHTS = {
  compact: 'h-[420px] sm:h-[430px] lg:h-[400px]',
  standard: 'h-[500px] sm:h-[520px] lg:h-[460px]',
  tall: 'h-[560px] sm:h-[580px] lg:h-[540px]',
};
const HERO_IMG_MAXH = {
  compact: 'max-h-[170px] sm:max-h-[210px] lg:max-h-[300px]',
  standard: 'max-h-[200px] sm:max-h-[250px] lg:max-h-[380px]',
  tall: 'max-h-[240px] sm:max-h-[300px] lg:max-h-[440px]',
};

export function AppleHero({ slides, index, setIndex, onOpen, rtl = true, swipeProps, swipeSuppressRef, heightMode = 'standard', showControls = true }) {
  const n = slides.length;
  const i = ((index % n) + n) % n;
  const ad = slides[i] || slides[0];
  const th = getAdTheme(ad);
  const light = isLight(ad, th);
  const hasImage = Boolean(ad.image) && ad.layout !== 'text' && ad.layout !== 'icon_3d_studio';
  const fullBleed = hasImage && (ad.layout === 'full' || ad.layout === 'full_clean') && ad.imageFit !== 'contain';
  const center = ad.align === 'center';
  const imgFirst = ad.imagePos === 'left' || !ad.imagePos;
  const dir = rtl ? 'rtl' : 'ltr';
  const PrevI = rtl ? ArrowRight : ArrowLeft;
  const NextI = rtl ? ArrowLeft : ArrowRight;
  const fg = fullBleed || !light ? 'text-white' : 'text-[#1d1d1f]';
  const sub = fullBleed || !light ? 'text-white/80' : 'text-[#424245]';
  const open = () => { if (swipeSuppressRef && swipeSuppressRef.current) return; onOpen(ad); };

  const text = (
    <div dir={dir} className={`relative z-10 flex flex-col gap-4 justify-center ${center ? 'items-center text-center' : 'items-start text-start'} ${fg} ${hasImage && !fullBleed && !center ? 'lg:w-1/2' : 'max-w-2xl'} px-7 sm:px-12 py-8`}>
      {ad.showBadge !== false && ad.badge && (
        <span className={`text-[13px] font-semibold tracking-wide ${light && !fullBleed ? 'text-[#b64400]' : 'text-[#ffb340]'}`}>{ad.badge}</span>
      )}
      <h2 className="text-[30px] sm:text-[44px] lg:text-[52px] font-semibold tracking-tight leading-[1.15] line-clamp-3">{ad.title}</h2>
      {ad.subtitle && <p className={`text-[15px] sm:text-[19px] leading-snug line-clamp-3 ${sub}`}>{ad.subtitle}</p>}
      <div className="flex items-center gap-4 flex-wrap mt-1">
        <CtaLink ad={ad} light={light && !fullBleed} rtl={rtl} big />
        <Countdown ad={ad} light={light && !fullBleed} rtl={rtl} />
      </div>
    </div>
  );

  return (
    <section className="elz-hero-wrap" aria-roledescription="carousel" aria-label={rtl ? 'العروض المميزة' : 'Featured campaigns'}>
      <div
        {...(swipeProps || {})}
        role="group"
        tabIndex={0}
        onClick={open}
        onKeyDown={(e) => { if (e.key === 'Enter') onOpen(ad); if (e.key === 'ArrowRight') setIndex(rtl ? i - 1 : i + 1); if (e.key === 'ArrowLeft') setIndex(rtl ? i + 1 : i - 1); }}
        className={`group relative isolate overflow-hidden rounded-[28px] cursor-pointer select-none ${HERO_HEIGHTS[heightMode] || HERO_HEIGHTS.standard} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0071E3]`}
      >
        <Backdrop th={th} light={light && !fullBleed} />
        {fullBleed ? (
          <>
            <div className="absolute inset-0"><AdImage ad={{ ...ad, imageScale: 100 }} /></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/10" aria-hidden="true" />
            <div className="absolute inset-x-0 bottom-0 pb-6 sm:pb-8">{text}</div>
          </>
        ) : hasImage ? (
          <div dir="ltr" className={`relative h-full flex flex-col ${center ? 'lg:flex-col' : imgFirst ? 'lg:flex-row' : 'lg:flex-row-reverse'} justify-between`}>
            {text}
            <div className={`relative flex-1 min-h-0 flex items-center justify-center p-4 sm:p-8 ${center ? 'pb-6' : ''} order-last ${center ? '' : imgFirst ? 'lg:order-first' : 'lg:order-last'}`}>
              <AdImage ad={ad} maxH={HERO_IMG_MAXH[heightMode] || HERO_IMG_MAXH.standard} />
            </div>
          </div>
        ) : (
          <div className={`relative h-full flex items-center ${center ? 'justify-center' : ''}`}>{text}</div>
        )}
      </div>

      {n > 1 && showControls && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button type="button" onClick={() => setIndex(i - 1)} aria-label={rtl ? 'السابق' : 'Previous'} className="w-9 h-9 rounded-full bg-surface hover:bg-surface2 text-fg flex items-center justify-center transition active:scale-95">
            <PrevI className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-4 h-9 rounded-full bg-surface" role="tablist">
            {slides.slice(0, 10).map((s, idx) => (
              <button
                key={s.id || idx}
                type="button"
                role="tab"
                aria-selected={idx === i}
                aria-label={s.title || `${idx + 1}`}
                onClick={() => setIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${idx === i ? 'w-6 bg-fg' : 'w-2 bg-fg/25 hover:bg-fg/50'}`}
              />
            ))}
          </div>
          <button type="button" onClick={() => setIndex(i + 1)} aria-label={rtl ? 'التالي' : 'Next'} className="w-9 h-9 rounded-full bg-surface hover:bg-surface2 text-fg flex items-center justify-center transition active:scale-95">
            <NextI className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Promo mosaic (large + small tiles)                                 */
/* ------------------------------------------------------------------ */
function PromoTile({ ad, onOpen, rtl, size }) {
  const th = getAdTheme(ad);
  const light = isLight(ad, th);
  const hasImage = Boolean(ad.image) && ad.layout !== 'text' && ad.layout !== 'icon_3d_studio';
  const dir = rtl ? 'rtl' : 'ltr';
  const fg = light ? 'text-[#1d1d1f]' : 'text-white';
  const sub = light ? 'text-[#515154]' : 'text-white/75';
  const big = size === 'lg';
  const wide = size === 'wide';
  return (
    <article
      role="link"
      tabIndex={0}
      onClick={() => onOpen(ad)}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(ad); }}
      className={`elz-tile group relative isolate overflow-hidden rounded-[28px] cursor-pointer flex ${wide ? 'flex-col sm:flex-row sm:items-center min-h-[300px]' : 'flex-col'} ${big ? 'min-h-[420px] lg:min-h-[560px] h-full' : wide ? '' : 'min-h-[300px] lg:min-h-[270px]'}`}
    >
      <Backdrop th={th} light={light} />
      <div dir={dir} className={`relative z-10 flex flex-col gap-2 p-7 sm:p-9 ${fg} ${wide ? 'sm:w-1/2' : ''} ${big ? 'items-center text-center' : 'items-start text-start'}`}>
        {ad.showBadge !== false && ad.badge && <span className={`text-[12px] font-semibold ${light ? 'text-[#b64400]' : 'text-[#ffb340]'}`}>{ad.badge}</span>}
        <h3 className={`font-semibold tracking-tight leading-[1.2] line-clamp-3 ${big ? 'text-[32px] sm:text-[40px]' : 'text-[24px] sm:text-[28px]'}`}>{ad.title}</h3>
        {ad.subtitle && <p className={`text-[14px] sm:text-[16px] leading-snug line-clamp-2 ${sub}`}>{ad.subtitle}</p>}
        <div className={`flex items-center gap-3 flex-wrap mt-2 ${big ? 'justify-center' : ''}`}>
          <CtaLink ad={ad} light={light} rtl={rtl} />
          <Countdown ad={ad} light={light} rtl={rtl} />
        </div>
      </div>
      {hasImage && (
        <div className={`relative flex-1 min-h-[150px] flex items-end justify-center px-6 ${wide ? 'sm:w-1/2 sm:items-center pb-4 sm:pb-0' : 'pb-0'}`}>
          <AdImage ad={ad} maxH={big ? 'max-h-[300px] lg:max-h-[330px]' : 'max-h-[170px] sm:max-h-[190px]'} className={wide ? '' : 'translate-y-3'} />
        </div>
      )}
    </article>
  );
}

export function AppleAdMosaic({ ads, onOpen, rtl = true }) {
  const list = ads.slice(0, 5);
  if (!list.length) return null;
  const n = list.length;
  const label = rtl ? 'عروض' : 'Promotions';
  if (n === 1) return <section aria-label={label}><PromoTile ad={list[0]} onOpen={onOpen} rtl={rtl} size="wide" /></section>;
  if (n === 2) {
    return (
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4" aria-label={label}>
        {list.map((a) => <PromoTile key={a.id} ad={a} onOpen={onOpen} rtl={rtl} size="sm" />)}
      </section>
    );
  }
  if (n === 3) {
    return (
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4" aria-label={label}>
        <div className="lg:row-span-2 flex flex-col"><PromoTile ad={list[0]} onOpen={onOpen} rtl={rtl} size="lg" /></div>
        <PromoTile ad={list[1]} onOpen={onOpen} rtl={rtl} size="sm" />
        <PromoTile ad={list[2]} onOpen={onOpen} rtl={rtl} size="sm" />
      </section>
    );
  }
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-4" aria-label={label}>
      {list.slice(0, 4).map((a) => <PromoTile key={a.id} ad={a} onOpen={onOpen} rtl={rtl} size="sm" />)}
      {n === 5 && <div className="sm:col-span-2"><PromoTile ad={list[4]} onOpen={onOpen} rtl={rtl} size="wide" /></div>}
    </section>
  );
}
