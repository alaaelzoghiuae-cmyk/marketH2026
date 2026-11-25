import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { getAdTheme } from '../lib/utils.jsx';
import { SHORTCUT_ICON_PRESETS } from '../data/constants.jsx';
import { AppleHero } from './AppleAds.jsx';
import { cleanHex, countdownDays, inkFor, resolveCardOptions } from '../lib/adsDisplay.js';

/* =====================================================================
   Ads presentation — two independent systems that read the SAME ad data:
   • AppleCardsCarousel : Apple-Store style stacked cards (default)
   • ClassicHeroBanner  : the original large hero banner (AppleHero),
                          kept 100% intact and selectable from the dashboard
   Every visual option is wired to a dashboard setting (see adsDisplay.js).
   ===================================================================== */

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Navigate for the optional per-ad link (sanitised by safeAdLink). */
export const followAdLink = (url) => {
  if (!url || typeof window === 'undefined') return;
  if (url.startsWith('#/')) { window.location.hash = url.slice(1); return; }
  if (url.startsWith('/')) { window.location.assign(url); return; }
  window.open(url, '_blank', 'noopener,noreferrer');
};

/* ------------------------------------------------------------------ */
/*  Single card                                                        */
/* ------------------------------------------------------------------ */
export function AppleAdCard({ ad, rtl = true, onActivate, eager = false, className = '' }) {
  const o = resolveCardOptions(ad);
  const th = getAdTheme(ad);
  const style = {};

  if (o.template === 'theme') {
    style['--ac-bg'] = th.cssGrad;
    style['--ac-fg'] = th.light ? '#1d1d1f' : '#ffffff';
    style['--ac-warn'] = th.light ? '#b64400' : '#ffb340';
    style['--ac-btn-ink'] = inkFor(th.light ? '#1d1d1f' : '#ffffff');
  } else if (o.template === 'custom') {
    const bg = cleanHex(ad.cardBg) || th.endColor || '#1d1d1f';
    const bgD = cleanHex(ad.cardBgDark);
    const fixedFg = cleanHex(ad.cardTextColor);
    const fg = fixedFg || inkFor(bg);
    style['--ac-bg0'] = bg;
    style['--ac-fg0'] = fg;
    if (bgD) { style['--ac-bg-d'] = bgD; style['--ac-fg-d'] = fixedFg || inkFor(bgD); }
    const warnFor = (f) => (inkFor(f) === '#ffffff' ? '#b64400' : '#ffb340');
    style['--ac-warn0'] = warnFor(fg);
    style['--ac-warn-d'] = warnFor(bgD ? (fixedFg || inkFor(bgD)) : fg);
  }
  if (o.template === 'auto' || o.template === 'theme') {
    const acc = cleanHex(th.accentColor);
    if (acc && acc.length === 7) style['--ac-glow'] = `${acc}33`;
  }
  const btnColor = cleanHex(ad.cardBtnColor);
  if (btnColor) { style['--ac-btn-bg'] = btnColor; style['--ac-btn-ink'] = inkFor(btnColor); }
  const scale = Math.min(155, Math.max(60, Number(ad.imageScale) || 100)) / 100;
  if (scale !== 1 && o.imagePos !== 'full') style['--s'] = scale;

  const useIcon = !ad.image && ad.layout === 'icon_3d_studio';
  const iconObj = useIcon ? (SHORTCUT_ICON_PRESETS[ad.iconPreset] || SHORTCUT_ICON_PRESETS.flagship_iphones) : null;
  const iconNode = iconObj ? (iconObj.svg || (typeof iconObj.render === 'function' ? iconObj.render() : null)) : null;
  const days = countdownDays(ad);
  const btnText = ad.buttonText || (rtl ? 'اكتشف المزيد' : 'Learn more');
  const Arrow = rtl ? ChevronLeft : ChevronRight;
  const countLabel = days === null ? '' : days === 0
    ? (rtl ? 'ينتهي اليوم' : 'Ends today')
    : (rtl ? `ينتهي خلال ${days} ${days === 1 ? 'يوم' : 'أيام'}` : `Ends in ${days} day${days === 1 ? '' : 's'}`);

  const activate = (e) => { if (onActivate) onActivate(ad, e); };

  return (
    <article
      role="link"
      tabIndex={0}
      aria-label={ad.title || btnText}
      data-tpl={o.template}
      data-pos={o.imagePos}
      data-size={o.size}
      data-blend={o.blend ? 'on' : 'off'}
      dir={rtl ? 'rtl' : 'ltr'}
      onClick={activate}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); activate(e); } }}
      className={`elz-ac-card ${className}`}
      style={style}
    >
      <div className="elz-ac-inner">
        <div className="elz-ac-text">
          {ad.showBadge !== false && o.category && <span className="elz-ac-cat">{o.category}</span>}
          {ad.title && <h3 className="elz-ac-title">{ad.title}</h3>}
          {ad.subtitle && <p className="elz-ac-sub">{ad.subtitle}</p>}
          {countLabel && <span className="elz-ac-count"><Clock className="w-3.5 h-3.5" aria-hidden="true" />{countLabel}</span>}
          {o.buttonStyle === 'pill' && <span className="elz-ac-pill">{btnText}</span>}
          {o.buttonStyle === 'link' && <span className="elz-ac-link">{btnText}<Arrow className="w-4 h-4" aria-hidden="true" /></span>}
        </div>
        <div className="elz-ac-media">
          {ad.image ? (
            <picture>
              {o.imageMobile && <source media="(max-width: 639px)" srcSet={o.imageMobile} />}
              <img
                className="elz-ac-img"
                data-fit={o.imageFit}
                src={ad.image}
                alt=""
                loading={eager ? 'eager' : 'lazy'}
                decoding="async"
                fetchpriority={eager ? 'high' : 'auto'}
                referrerPolicy="no-referrer"
                draggable={false}
                style={o.imageFit === 'cover' && ad.imageFocal ? { objectPosition: ad.imageFocal } : undefined}
              />
            </picture>
          ) : iconNode ? (
            <div className="elz-ac-icon" aria-hidden="true">{iconNode}</div>
          ) : null}
        </div>
      </div>
      {o.buttonStyle === 'plus' && (
        <span className="elz-ac-plus" aria-hidden="true"><Plus className="w-[18px] h-[18px]" strokeWidth={2.4} /></span>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Carousel                                                           */
/* ------------------------------------------------------------------ */
const BREAKPOINTS = [
  ['mobile', 0],
  ['tablet', 600],
  ['laptop', 900],
  ['desktop', 1200],
];

const widthFor = (visible, count, gap, peek) => {
  const n = Math.max(1, Math.min(visible, count));
  const hasPeek = peek && count > visible;
  if (hasPeek) return `calc((100% - ${n}*var(--gap)) / ${n + 0.14})`;
  return n === 1 ? '100%' : `calc((100% - ${n - 1}*var(--gap)) / ${n})`;
};

export function AppleCardsCarousel({ ads, cfg, onOpen, rtl = true, label, eagerFirst = true, forceNoAutoplay = false }) {
  const uid = `elzac${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const trackRef = useRef(null);
  const st = useRef({ interacted: false, hover: false, visible: true, raf: 0, suppress: false }).current;
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(0);
  const [edge, setEdge] = useState({ start: true, end: true });
  const count = ads.length;
  const sign = rtl ? -1 : 1;

  const metrics = useCallback(() => {
    const el = trackRef.current;
    if (!el) return null;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const first = el.firstElementChild;
    const step = first ? first.getBoundingClientRect().width + cfg.gap : el.clientWidth;
    return { el, max, step: Math.max(1, step), pos: Math.abs(el.scrollLeft) };
  }, [cfg.gap]);

  const measure = useCallback(() => {
    const m = metrics();
    if (!m) return;
    const total = m.max <= 2 ? 1 : Math.ceil(m.max / Math.max(1, m.el.clientWidth - 2)) + 1;
    setPages(total);
    setPage(total <= 1 ? 0 : Math.min(total - 1, Math.round((m.pos / m.max) * (total - 1))));
    setEdge({ start: m.pos <= 2, end: m.pos >= m.max - 2 });
  }, [metrics]);

  const animateTo = useCallback((abs, instant) => {
    const m = metrics();
    if (!m) return;
    const { el, max } = m;
    const from = Math.abs(el.scrollLeft);
    const to = Math.max(0, Math.min(abs, max));
    cancelAnimationFrame(st.raf);
    const dur = instant || prefersReducedMotion() ? 0 : cfg.speedMs;
    if (!dur || Math.abs(to - from) < 1) { delete el.dataset.anim; el.scrollLeft = sign * to; return; }
    el.dataset.anim = 'true';
    const t0 = performance.now();
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      el.scrollLeft = sign * (from + (to - from) * ease(p));
      if (p < 1) st.raf = requestAnimationFrame(tick);
      else delete el.dataset.anim;
    };
    st.raf = requestAnimationFrame(tick);
  }, [metrics, cfg.speedMs, sign, st]);

  const stopAnim = useCallback(() => {
    cancelAnimationFrame(st.raf);
    if (trackRef.current) delete trackRef.current.dataset.anim;
  }, [st]);

  const userTouched = useCallback(() => { st.interacted = true; }, [st]);

  const go = useCallback((dir, fromUser = true) => {
    const m = metrics();
    if (!m) return;
    if (fromUser) userTouched();
    const vis = Math.max(1, Math.round((m.el.clientWidth + cfg.gap) / m.step));
    const idx = Math.round(m.pos / m.step);
    if (dir > 0 && m.pos >= m.max - 2) { if (!fromUser) animateTo(0); return; }
    animateTo(dir > 0 ? Math.min(m.max, (idx + vis) * m.step) : Math.max(0, (idx - vis) * m.step));
  }, [metrics, cfg.gap, animateTo, userTouched]);

  const goPage = (i) => {
    const m = metrics();
    if (!m || pages <= 1) return;
    userTouched();
    const target = i >= pages - 1 ? m.max : Math.round(((m.max * i) / (pages - 1)) / m.step) * m.step;
    animateTo(Math.min(m.max, target));
  };

  // measure on mount / resize / scroll
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    let raf = 0;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(measure); };
    el.addEventListener('scroll', onScroll, { passive: true });
    let ro;
    if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(onScroll); ro.observe(el); }
    measure();
    return () => { cancelAnimationFrame(raf); el.removeEventListener('scroll', onScroll); if (ro) ro.disconnect(); };
  }, [measure, count, cfg]);

  // visibility (don't autoplay off-screen)
  useEffect(() => {
    const el = trackRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([en]) => { st.visible = en.isIntersecting; }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [st]);

  // autoplay (stops for good once the visitor interacts)
  useEffect(() => {
    if (!cfg.autoplay || forceNoAutoplay || count < 2 || prefersReducedMotion()) return undefined;
    const t = setInterval(() => {
      if (st.interacted || st.hover || st.visible === false || (typeof document !== 'undefined' && document.hidden)) return;
      go(1, false);
    }, Math.max(2000, cfg.intervalSec * 1000));
    return () => clearInterval(t);
  }, [cfg.autoplay, cfg.intervalSec, count, forceNoAutoplay, go, st]);

  useEffect(() => () => cancelAnimationFrame(st.raf), [st]);

  // mouse drag (touch uses native momentum scrolling + snap)
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    const m = metrics();
    if (!m || m.max <= 2) return;
    stopAnim();
    userTouched();
    const { el } = m;
    const startX = e.clientX;
    const startLeft = el.scrollLeft;
    let moved = false;
    const move = (ev) => {
      const dx = ev.clientX - startX;
      if (!moved && Math.abs(dx) > 5) { moved = true; el.dataset.drag = 'true'; }
      if (moved) el.scrollLeft = startLeft - dx;
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (!moved) return;
      st.suppress = true;
      setTimeout(() => { st.suppress = false; }, 60);
      const mm = metrics();
      delete el.dataset.drag;
      if (mm) {
        const idx = Math.round(mm.pos / mm.step);
        el.scrollLeft = sign * mm.pos; // keep position when snapping is re-enabled
        animateTo(Math.min(mm.max, idx * mm.step));
      }
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  };

  const onKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    const next = rtl ? 'ArrowLeft' : 'ArrowRight';
    const prev = rtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === next) { e.preventDefault(); go(1); }
    else if (e.key === prev) { e.preventDefault(); go(-1); }
    else if (e.key === 'Home') { e.preventDefault(); userTouched(); animateTo(0); }
    else if (e.key === 'End') { e.preventDefault(); userTouched(); const m = metrics(); if (m) animateTo(m.max); }
  };

  const activate = (ad) => {
    if (st.suppress) return;
    const o = resolveCardOptions(ad);
    if (o.link) { followAdLink(o.link); return; }
    if (onOpen) onOpen(ad);
  };

  if (!count) return null;

  const css = BREAKPOINTS.map(([bp, minW]) => {
    const w = widthFor(cfg[bp], count, cfg.gap, cfg.peek);
    return minW === 0
      ? `#${uid} .elz-ac-track{--gap:${cfg.gap}px;--w:${w}}`
      : `@container ${uid} (min-width:${minW}px){#${uid} .elz-ac-track{--w:${w}}}`;
  }).join('');

  const PrevI = rtl ? ChevronRight : ChevronLeft;
  const NextI = rtl ? ChevronLeft : ChevronRight;
  const showDots = cfg.dots && pages > 1;
  const showArrows = cfg.arrows && pages > 1;
  const only = showDots && showArrows ? 'both' : showDots ? 'dots' : 'arrows';

  return (
    <section id={uid} className="elz-ac" aria-roledescription="carousel" aria-label={label || (rtl ? 'العروض والإعلانات' : 'Promotions')}>
      <style>{css}</style>
      <div className="elz-ac-viewport" style={{ containerName: uid }}>
        <div
          ref={trackRef}
          dir={rtl ? 'rtl' : 'ltr'}
          tabIndex={0}
          role="group"
          aria-label={rtl ? 'استخدم الأسهم للتنقل بين البطاقات' : 'Use arrow keys to browse cards'}
          className="elz-ac-track"
          onPointerDown={onPointerDown}
          onTouchStart={() => { stopAnim(); userTouched(); }}
          onWheel={() => { stopAnim(); userTouched(); }}
          onKeyDown={onKeyDown}
          onMouseEnter={() => { st.hover = true; }}
          onMouseLeave={() => { st.hover = false; }}
          onFocus={() => { st.hover = true; }}
          onBlur={() => { st.hover = false; }}
        >
          {ads.map((ad, i) => (
            <AppleAdCard key={ad.id || i} ad={ad} rtl={rtl} onActivate={activate} eager={eagerFirst && i < 2} />
          ))}
        </div>
      </div>

      {(showDots || showArrows) && (
        <div className="elz-ac-controls" data-only={only} dir={rtl ? 'rtl' : 'ltr'}>
          {showDots && (
            <div className="elz-ac-dots" role="tablist" aria-label={rtl ? 'صفحات العروض' : 'Pages'}>
              {Array.from({ length: pages }).map((_, i) => (
                <button key={i} type="button" role="tab" className="elz-ac-dot" aria-selected={i === page} aria-label={`${i + 1} / ${pages}`} onClick={() => goPage(i)} />
              ))}
            </div>
          )}
          {showArrows && (
            <div className="elz-ac-arrows">
              <button type="button" className="elz-ac-arrow" disabled={edge.start} onClick={() => go(-1)} aria-label={rtl ? 'السابق' : 'Previous'}><PrevI className="w-4 h-4" /></button>
              <button type="button" className="elz-ac-arrow" disabled={edge.end} onClick={() => go(1)} aria-label={rtl ? 'التالي' : 'Next'}><NextI className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Classic Hero Banner (original AppleHero, + dashboard options)      */
/* ------------------------------------------------------------------ */
export function ClassicHeroBanner({ slides, index, setIndex, onOpen, rtl = true, swipeProps, swipeSuppressRef, cfg }) {
  const n = slides.length;
  useEffect(() => {
    if (!cfg || !cfg.autoplay || n < 2 || prefersReducedMotion()) return undefined;
    const t = setTimeout(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      setIndex(index + 1);
    }, Math.max(2000, cfg.intervalSec * 1000));
    return () => clearTimeout(t);
  }, [cfg, n, index, setIndex]);
  return (
    <AppleHero
      slides={slides}
      index={index}
      setIndex={setIndex}
      onOpen={onOpen}
      rtl={rtl}
      swipeProps={swipeProps}
      swipeSuppressRef={swipeSuppressRef}
      heightMode={cfg ? cfg.height : 'standard'}
      showControls={cfg ? cfg.controls : true}
    />
  );
}
