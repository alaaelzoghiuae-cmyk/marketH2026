import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowLeft, ArrowRight, BadgePercent, ChevronDown, ChevronLeft, ChevronRight, Flame, LayoutGrid, Layers, X,
} from 'lucide-react';
import { normalizePartCategory } from '../lib/catalogUtils.js';

/* =====================================================================
   Krombo / ELZOGHBI — Storefront presentation components (Apple-Store style)
   • ServicesNav        : sticky horizontal services strip + cascading mega menu
   • AppleHomeShowcase  : editorial bento + horizontal rails (real data only)
   Pure presentation. All navigation is delegated to the existing state
   setters via the `actions` prop — no business logic lives here.
   ===================================================================== */

const COL_W = 288;
const cleanBrand = (b) => String(b || '').replace(/^OR\s*-\s*/i, '').trim();
const partImage = (p) => (p && (p.image_url || p.image || (Array.isArray(p.images) && p.images[0]))) || '';

function useMedia(query) {
  const [match, setMatch] = useState(() => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false));
  useEffect(() => {
    if (!window.matchMedia) return undefined;
    const mq = window.matchMedia(query);
    const on = () => setMatch(mq.matches);
    on();
    if (mq.addEventListener) mq.addEventListener('change', on); else mq.addListener(on);
    return () => (mq.removeEventListener ? mq.removeEventListener('change', on) : mq.removeListener(on));
  }, [query]);
  return match;
}

function Thumb({ node, size = 'md' }) {
  const dim = size === 'lg' ? 'w-12 h-12 sm:w-[52px] sm:h-[52px]' : 'w-8 h-8';
  const Icon = node.icon;
  return (
    <span className={`${dim} shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-surface2 text-fg border border-line/70`}>
      {node.img ? (
        <img src={node.img} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover bg-white" />
      ) : Icon ? (
        <Icon className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} strokeWidth={1.75} />
      ) : node.emoji ? (
        <span className={size === 'lg' ? 'text-xl' : 'text-base'} aria-hidden="true">{node.emoji}</span>
      ) : (
        <span className="text-xs font-semibold text-muted">{String(node.label || '?').charAt(0)}</span>
      )}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Services strip + cascading menu                                    */
/* ------------------------------------------------------------------ */
export function ServicesNav({
  rtl = true, brands = [], getBrandImg, models = [], parts = [], resolveModel, getTopCategories, categoryEmoji,
  active = {}, actions, labels, modelCounts, extraItems = [],
}) {
  const L = labels || (rtl
    ? { all: 'كل المنتجات', offers: 'العروض', best: 'الأكثر مبيعاً', cats: 'التصنيفات', viewAll: 'عرض الكل', back: 'رجوع', close: 'إغلاق', aria: 'خدمات وتصنيفات المتجر' }
    : { all: 'All products', offers: 'Offers', best: 'Best sellers', cats: 'Categories', viewAll: 'View all', back: 'Back', close: 'Close', aria: 'Store services and categories' });

  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const liveModels = useMemo(() => (modelCounts ? models.filter((m) => (modelCounts.get(String(m.id)) || 0) > 0) : models), [models, modelCounts]);
  const dir = rtl ? 'rtl' : 'ltr';
  const compact = useMedia('(max-width: 1023px)');
  const Next = rtl ? ChevronLeft : ChevronRight;
  const stripRef = useRef(null);
  const panelRef = useRef(null);
  const closeTimer = useRef(null);
  const hoverTimer = useRef(null);
  const triggerEls = useRef(new Map());
  const [trail, setTrail] = useState([]);
  const [anchor, setAnchor] = useState(null);
  const [edge, setEdge] = useState({ start: true, end: true });
  const [vw, setVw] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);

  // lazy caches reset whenever the underlying catalogue changes
  const cache = useMemo(() => ({ modelCats: new Map(), catBrands: new Map(), kids: new Map() }), [parts, liveModels, brands]);

  const partsOfModel = useCallback((m) => {
    const id = String(m.id);
    return parts.filter((p) => String(resolveModel ? ((resolveModel(p) || {}).id ?? p.modelId) : p.modelId) === id);
  }, [parts, resolveModel]);

  const topItems = useMemo(() => {
    const catNode = (norm) => ({
      id: `cat:${norm}`, label: norm, emoji: categoryEmoji ? categoryEmoji(norm) : '', go: () => actionsRef.current.showCategory(norm),
      children: () => {
        if (cache.catBrands.has(norm)) return cache.catBrands.get(norm);
        const set = new Set();
        parts.forEach((p) => {
          if (normalizePartCategory(p.category, p.name) !== norm) return;
          const b = (resolveModel && (resolveModel(p) || {}).brand) || p.brand;
          if (b && brands.includes(b)) set.add(b);
        });
        const list = brands.filter((b) => set.has(b)).map((b) => ({
          id: `cat:${norm}>br:${b}`, label: cleanBrand(b), img: getBrandImg && getBrandImg(b), go: () => actionsRef.current.showBrandCategory(b, norm),
        }));
        cache.catBrands.set(norm, list);
        return list;
      },
    });
    const brandNode = (b) => ({
      id: `br:${b}`, label: cleanBrand(b), img: getBrandImg && getBrandImg(b), go: () => actionsRef.current.showBrand(b),
      children: () => {
        const key = `br:${b}`;
        if (cache.kids.has(key)) return cache.kids.get(key);
        const list = liveModels.filter((m) => m.brand === b).map((m) => ({
          id: `br:${b}>md:${m.id}`, label: m.name, img: m.image || m.image_url || '', go: () => actionsRef.current.showModel(m),
          children: () => {
            const mk = String(m.id);
            if (cache.modelCats.has(mk)) return cache.modelCats.get(mk);
            const seen = new Set();
            partsOfModel(m).forEach((p) => {
              const c = normalizePartCategory(p.category, p.name);
              if (c) seen.add(c);
            });
            const cl = [...seen].map((c) => ({
              id: `md:${mk}>cat:${c}`, label: c, emoji: categoryEmoji ? categoryEmoji(c) : '', go: () => actionsRef.current.showModelCategory(m, c),
            }));
            cache.modelCats.set(mk, cl);
            return cl;
          },
        }));
        cache.kids.set(key, list);
        return list;
      },
    });
    const cats = [];
    const seenCats = new Set();
    (getTopCategories ? getTopCategories(14) : []).forEach((c) => {
      const n = normalizePartCategory(c.cat);
      if (!n || seenCats.has(n)) return;
      seenCats.add(n);
      cats.push(catNode(n));
    });
    const out = [
      { id: 'all', label: L.all, icon: LayoutGrid, go: () => actionsRef.current.showAll() },
      { id: 'offers', label: L.offers, icon: BadgePercent, go: () => actionsRef.current.showFilter('DISCOUNTS') },
      { id: 'best', label: L.best, icon: Flame, go: () => actionsRef.current.showFilter('BEST_SELLERS') },
    ];
    if (cats.length) out.push({ id: 'cats', label: L.cats, icon: Layers, go: () => actionsRef.current.showAll(), children: () => cats });
    (extraItems || []).forEach((x) => out.push(x));
    brands.forEach((b) => out.push(brandNode(b)));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brands, liveModels, parts, cache, rtl, extraItems]);

  const kidsOf = useCallback((n) => (n && typeof n.children === 'function' ? n.children() : []), []);

  const close = useCallback(() => { clearTimeout(closeTimer.current); clearTimeout(hoverTimer.current); setTrail([]); setAnchor(null); }, []);
  const scheduleClose = () => { clearTimeout(closeTimer.current); closeTimer.current = setTimeout(close, 240); };
  const cancelClose = () => clearTimeout(closeTimer.current);

  const openTop = (node, el) => {
    if (!node || kidsOf(node).length === 0) { close(); return; }
    const target = el || triggerEls.current.get(node.id);
    const r = target && target.getBoundingClientRect();
    if (r) setAnchor({ left: r.left, right: r.right, bottom: r.bottom });
    setTrail([node]);
  };

  const activate = (node) => { close(); if (node && node.go) node.go(); };

  // outside click / scroll / resize / Escape
  useEffect(() => {
    if (!trail.length) return undefined;
    const down = (e) => {
      if (panelRef.current && panelRef.current.contains(e.target)) return;
      if (stripRef.current && stripRef.current.contains(e.target)) return;
      close();
    };
    const esc = (e) => {
      if (e.key !== 'Escape') return;
      const el = triggerEls.current.get(trail[0].id);
      close();
      if (el) el.focus();
    };
    const dismiss = () => close();
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', dismiss, { passive: true });
    window.addEventListener('resize', dismiss);
    return () => {
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', dismiss);
      window.removeEventListener('resize', dismiss);
    };
  }, [trail, close]);

  useEffect(() => {
    const on = () => setVw(window.innerWidth);
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('resize', on); clearTimeout(closeTimer.current); clearTimeout(hoverTimer.current); };
  }, []);

  // lock page scroll while the mobile sheet is open
  useEffect(() => {
    if (!(compact && trail.length)) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [compact, trail.length]);

  // scroll-edge detection for the strip arrows
  const measure = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    setEdge({ start: pos < 4, end: max <= 4 || pos > max - 4 });
  }, []);
  useLayoutEffect(() => {
    measure();
    const el = stripRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure, topItems]);
  const nudge = (d) => { if (stripRef.current) stripRef.current.scrollBy({ left: d * 320 * (rtl ? -1 : 1), behavior: 'smooth' }); };

  // keep the active item visible
  const activeId = (() => {
    if (active.tab === 'karambo') return 'karambo';
    if (active.tab !== 'search') return '';
    if (active.filter === 'DISCOUNTS') return 'offers';
    if (active.filter === 'BEST_SELLERS') return 'best';
    if (active.brand && active.brand !== 'ALL') return `br:${active.brand}`;
    if (active.category && active.category !== 'ALL') return 'cats';
    return 'all';
  })();
  useEffect(() => {
    const el = triggerEls.current.get(activeId);
    if (el && el.scrollIntoView) { try { el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' }); } catch (e) { /* noop */ } }
  }, [activeId]);

  /* ---- keyboard handling inside columns ---- */
  const focusCol = (col, idx) => {
    const panel = panelRef.current;
    const list = panel && panel.querySelectorAll(`[data-col="${col}"] [role="menuitem"]`);
    if (list && list[idx]) list[idx].focus();
  };
  const onItemKey = (e, node, col, idx, siblingsLen) => {
    const nextKey = rtl ? 'ArrowLeft' : 'ArrowRight';
    const prevKey = rtl ? 'ArrowRight' : 'ArrowLeft';
    const n = siblingsLen + 1;
    if (e.key === 'ArrowDown') { e.preventDefault(); focusCol(col, (idx + 1) % n); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); focusCol(col, (idx - 1 + n) % n); }
    else if (e.key === nextKey && node && kidsOf(node).length) {
      e.preventDefault();
      setTrail((t) => t.slice(0, col + 1).concat([node]));
      setTimeout(() => focusCol(col + 1, 1), 30);
    } else if (e.key === prevKey && col > 0) {
      e.preventDefault();
      setTrail((t) => t.slice(0, col));
      setTimeout(() => focusCol(col - 1, 0), 30);
    }
  };
  const onTopKey = (e, node) => {
    if ((e.key === 'ArrowDown' || e.key === ' ') && kidsOf(node).length) {
      e.preventDefault();
      openTop(node, e.currentTarget);
      setTimeout(() => focusCol(0, 0), 40);
    }
  };

  /* ---- one column of the cascade ---- */
  const renderColumn = (parent, col) => {
    const items = kidsOf(parent);
    const selected = trail[col + 1];
    return (
      <div key={parent.id} data-col={col} role="menu" aria-label={parent.label}
        className="elz-fade-in flex flex-col py-2 px-2 overflow-y-auto overscroll-contain"
        style={{ width: COL_W, maxHeight: 'inherit', borderInlineStart: col ? '1px solid var(--nav-hairline)' : 'none' }}>
        <button type="button" role="menuitem" onClick={() => activate(parent)}
          onKeyDown={(e) => onItemKey(e, null, col, 0, items.length)}
          className="elz-menu-item elz-menu-all">
          <span className="truncate">{L.viewAll} · {parent.label}</span>
          {rtl ? <ArrowLeft className="w-3.5 h-3.5 shrink-0" /> : <ArrowRight className="w-3.5 h-3.5 shrink-0" />}
        </button>
        {items.map((n, i) => {
          const hasKids = kidsOf(n).length > 0;
          const isSel = selected && selected.id === n.id;
          return (
            <button key={n.id} type="button" role="menuitem" aria-haspopup={hasKids ? 'menu' : undefined} aria-expanded={hasKids ? !!isSel : undefined}
              data-selected={isSel ? 'true' : undefined}
              onPointerEnter={(e) => {
                if (e.pointerType === 'touch') return;
                clearTimeout(hoverTimer.current);
                hoverTimer.current = setTimeout(() => setTrail((t) => t.slice(0, col + 1).concat(hasKids ? [n] : [])), 60);
              }}
              onClick={(e) => {
                const pt = e.nativeEvent && e.nativeEvent.pointerType;
                if (hasKids && (pt === 'touch' || pt === 'pen')) { setTrail((t) => t.slice(0, col + 1).concat([n])); return; }
                activate(n);
              }}
              onKeyDown={(e) => onItemKey(e, n, col, i + 1, items.length)}
              className="elz-menu-item">
              <Thumb node={n} />
              <span className="flex-1 min-w-0 truncate text-start">{n.label}</span>
              {hasKids && <Next className="w-4 h-4 shrink-0 text-muted" aria-hidden="true" />}
            </button>
          );
        })}
      </div>
    );
  };

  /* ---- desktop panel placement (stays inside the viewport, RTL aware) ---- */
  const desktopPanel = (() => {
    if (compact || !trail.length || !anchor || typeof document === 'undefined') return null;
    const cols = trail.length;
    const w = Math.min(cols * COL_W, vw - 24);
    const style = { position: 'fixed', top: anchor.bottom + 6, width: w, maxHeight: `min(70vh, calc(100vh - ${Math.round(anchor.bottom) + 24}px))`, zIndex: 70, direction: dir };
    if (rtl) style.right = Math.max(12, Math.min(vw - anchor.right, vw - w - 12));
    else style.left = Math.max(12, Math.min(anchor.left, vw - w - 12));
    return createPortal(
      <div ref={panelRef} dir={dir} style={style} className="elz-mega" onPointerEnter={cancelClose} onPointerLeave={(e) => { if (e.pointerType !== 'touch') scheduleClose(); }}>
        <div className="flex" style={{ maxHeight: 'inherit' }}>
          {trail.map((n, i) => renderColumn(n, i))}
        </div>
      </div>,
      document.body,
    );
  })();

  /* ---- mobile / touch drill-down sheet ---- */
  const sheet = (() => {
    if (!compact || !trail.length || typeof document === 'undefined') return null;
    const cur = trail[trail.length - 1];
    const items = kidsOf(cur);
    return createPortal(
      <div ref={panelRef} dir={dir} className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={cur.label}>
        <div className="absolute inset-0 elz-sheet-scrim" onClick={close} />
        <div className="elz-sheet elz-slide-up relative w-full sm:max-w-md max-h-[82vh] flex flex-col">
          <div className="flex items-center gap-2 px-3 pt-3 pb-2">
            <button type="button" onClick={() => (trail.length > 1 ? setTrail(trail.slice(0, -1)) : close())}
              className="h-9 px-3 rounded-full bg-surface2 text-fg text-xs font-medium flex items-center gap-1" aria-label={L.back}>
              {rtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>{L.back}</span>
            </button>
            <h3 className="flex-1 text-center text-sm font-semibold truncate">{cur.label}</h3>
            <button type="button" onClick={close} className="w-9 h-9 rounded-full bg-surface2 text-fg flex items-center justify-center" aria-label={L.close}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-y-auto overscroll-contain px-2 pb-4">
            <button type="button" onClick={() => activate(cur)} className="elz-menu-item elz-menu-all">
              <span className="truncate">{L.viewAll} · {cur.label}</span>
              {rtl ? <ArrowLeft className="w-4 h-4 shrink-0" /> : <ArrowRight className="w-4 h-4 shrink-0" />}
            </button>
            {items.map((n) => {
              const hasKids = kidsOf(n).length > 0;
              return (
                <button key={n.id} type="button" onClick={() => (hasKids ? setTrail([...trail, n]) : activate(n))} className="elz-menu-item py-3">
                  <Thumb node={n} />
                  <span className="flex-1 min-w-0 truncate text-start">{n.label}</span>
                  {hasKids && <Next className="w-4 h-4 shrink-0 text-muted" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>,
      document.body,
    );
  })();

  return (
    <nav aria-label={L.aria} dir={dir} className="elz-services-nav relative">
      <div className="max-w-[1380px] mx-auto px-2 sm:px-6 relative">
        {!edge.start && (
          <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => nudge(-1)}
            className="hidden lg:flex elz-strip-arrow start-1">
            {rtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
        <div ref={stripRef} onScroll={measure} className="elz-strip flex items-start gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2.5 sm:py-3 snap-x scroll-smooth">
          {topItems.map((n) => {
            const hasKids = typeof n.children === 'function' && kidsOf(n).length > 0;
            const isActive = activeId === n.id;
            const isOpen = trail[0] && trail[0].id === n.id;
            return (
              <button key={n.id} type="button" ref={(el) => { if (el) triggerEls.current.set(n.id, el); else triggerEls.current.delete(n.id); }}
                aria-haspopup={hasKids ? 'menu' : undefined} aria-expanded={hasKids ? !!isOpen : undefined} aria-current={isActive ? 'page' : undefined}
                data-active={isActive ? 'true' : undefined}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'touch' || compact) return;
                  cancelClose();
                  clearTimeout(hoverTimer.current);
                  const el = e.currentTarget;
                  hoverTimer.current = setTimeout(() => openTop(n, el), 90);
                }}
                onPointerLeave={(e) => { if (e.pointerType !== 'touch' && !compact) { clearTimeout(hoverTimer.current); scheduleClose(); } }}
                onKeyDown={(e) => onTopKey(e, n)}
                onClick={(e) => {
                  const pt = e.nativeEvent && e.nativeEvent.pointerType;
                  if (hasKids && (compact || pt === 'touch' || pt === 'pen')) { if (isOpen) close(); else openTop(n, e.currentTarget); return; }
                  activate(n);
                }}
                className="elz-strip-item snap-start">
                <Thumb node={n} size="lg" />
                <span className="flex items-center gap-0.5 max-w-[84px] sm:max-w-[104px]">
                  <span className="truncate">{n.label}</span>
                  {hasKids && <ChevronDown className="w-3 h-3 shrink-0 opacity-60" aria-hidden="true" />}
                </span>
              </button>
            );
          })}
        </div>
        {!edge.end && (
          <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => nudge(1)}
            className="hidden lg:flex elz-strip-arrow end-1">
            {rtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        )}
      </div>
      {desktopPanel}
      {sheet}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Horizontal rail (scroll-snap) used across the home page            */
/* ------------------------------------------------------------------ */
export function HRail({ rtl = true, title, subtitle, onViewAll, viewAllLabel, children, itemWidth = 272 }) {
  const ref = useRef(null);
  const by = (d) => { if (ref.current) ref.current.scrollBy({ left: d * (itemWidth + 20) * 2 * (rtl ? -1 : 1), behavior: 'smooth' }); };
  return (
    <section className="elz-rail space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="elz-h3">{title}</h3>
          {subtitle && <p className="text-xs sm:text-sm text-muted mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onViewAll && <button type="button" onClick={onViewAll} className="elz-link text-xs sm:text-sm font-medium">{viewAllLabel}</button>}
          <button type="button" onClick={() => by(-1)} aria-label="prev" className="hidden sm:flex w-9 h-9 rounded-full bg-surface2 hover:bg-line text-fg items-center justify-center">
            {rtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <button type="button" onClick={() => by(1)} aria-label="next" className="hidden sm:flex w-9 h-9 rounded-full bg-surface2 hover:bg-line text-fg items-center justify-center">
            {rtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div ref={ref} className="elz-rail-track flex gap-4 sm:gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth pb-2">
        {React.Children.map(children, (c) => (c ? <div className="snap-start shrink-0" style={{ width: `min(${itemWidth}px, 78vw)` }}>{c}</div> : null))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Home page — editorial store sections                               */
/* ------------------------------------------------------------------ */
export function AppleHomeShowcase({
  rtl = true, parts = [], calculatePartPrice, currentGroup, getTopCategories, categoryEmoji, brands = [], getBrandImg,
  renderProductCard, actions,
}) {
  const t = rtl
    ? {
        eyebrow: 'المتجر', headline: 'اكتشف ما تحب. بأفضل طريقة للشراء.',
        sub: 'تصفّح التصنيفات والعروض والمنتجات المختارة بضمان حقيقي وشحن لكل المحافظات.',
        offers: 'العروض والخصومات', offersCta: 'تسوّق العروض', best: 'الأكثر مبيعاً', bestCta: 'اكتشف الآن',
        brands: 'تسوّق حسب البراند', brandsCta: 'كل البراندات', offersRail: 'عروض مختارة', moreRail: 'مختارات من المتجر',
        viewAll: 'عرض الكل', off: 'خصم', cats: 'تصفّح حسب التصنيف',
      }
    : {
        eyebrow: 'Store', headline: 'Discover what you love. The best way to buy.',
        sub: 'Browse categories, offers and curated products with genuine warranty and nationwide delivery.',
        offers: 'Offers & discounts', offersCta: 'Shop offers', best: 'Best sellers', bestCta: 'Discover now',
        brands: 'Shop by brand', brandsCta: 'All brands', offersRail: 'Selected offers', moreRail: 'Store picks',
        viewAll: 'View all', off: 'OFF', cats: 'Browse by category',
      };

  const data = useMemo(() => {
    const priced = parts.map((p) => ({ p, pr: calculatePartPrice(p, currentGroup) })).filter((x) => x.pr.baseEgpPrice > 0);
    const disc = priced.filter((x) => x.pr.hasDiscount).sort((a, b) => b.pr.discountPercent - a.pr.discountPercent);
    return { disc, best: priced.slice(0, 12), more: priced.slice(4, 16) };
  }, [parts, calculatePartPrice, currentGroup]);

  const cats = useMemo(() => (getTopCategories ? getTopCategories(12) : []), [getTopCategories, parts]);
  const heroDeal = data.disc[0];
  const heroBest = data.best[0];
  const lead = heroDeal || heroBest;
  const brandTiles = brands.slice(0, 6);
  const money = (pr) => (
    <span className="inline-flex items-baseline gap-2 flex-wrap">
      <span className="font-semibold">{pr.displayPrice.toLocaleString()} {pr.currencySymbol}</span>
      {pr.hasDiscount && <span className="text-xs opacity-60 line-through">{pr.displayOldPrice.toLocaleString()}</span>}
    </span>
  );
  const kb = (fn) => ({ role: 'button', tabIndex: 0, onClick: fn, onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); } } });

  if (!parts.length) return null;

  return (
    <div className="elz-showcase space-y-10 sm:space-y-14">
      <header className="text-center max-w-3xl mx-auto pt-2 sm:pt-6">
        <p className="elz-eyebrow">{t.eyebrow}</p>
        <h2 className="elz-display">{t.headline}</h2>
        <p className="text-sm sm:text-base text-muted mt-3">{t.sub}</p>
      </header>

      {cats.length > 0 && (
        <section aria-label={t.cats}>
          <div className="elz-cat-rail flex gap-4 sm:gap-7 overflow-x-auto no-scrollbar snap-x justify-start lg:justify-center px-1 pb-1">
            {cats.map((c) => (
              <button key={c.cat} type="button" onClick={() => actions.showCategory(normalizePartCategory(c.cat))} className="elz-cat-tile snap-start group">
                <span className="elz-cat-disc"><span aria-hidden="true">{categoryEmoji ? categoryEmoji(c.cat) : '•'}</span></span>
                <span className="text-[11px] sm:text-xs font-medium text-fg max-w-[88px] truncate">{c.cat}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {lead && (
          <article {...kb(() => actions.showFilter(heroDeal ? 'DISCOUNTS' : 'BEST_SELLERS'))}
            className="elz-tile elz-tile-dark lg:col-span-7 lg:row-span-2 min-h-[380px] sm:min-h-[520px]">
            <div className="relative z-10 p-6 sm:p-10 max-w-[70%] sm:max-w-[60%]">
              {heroDeal && <span className="elz-pill">{t.off} {heroDeal.pr.discountPercent}%</span>}
              <h3 className="elz-tile-title mt-3">{heroDeal ? t.offers : t.best}</h3>
              <p className="text-sm sm:text-base opacity-80 mt-2 line-clamp-2">{lead.p.name}</p>
              <p className="mt-2 text-sm">{money(lead.pr)}</p>
              <span className="elz-btn mt-5">{heroDeal ? t.offersCta : t.bestCta}</span>
            </div>
            {partImage(lead.p) && (
              <img src={partImage(lead.p)} alt="" loading="lazy" referrerPolicy="no-referrer"
                className="elz-tile-img absolute bottom-3 end-3 sm:bottom-6 sm:end-6 w-[46%] max-h-[62%] object-contain" />
            )}
          </article>
        )}

        {heroBest && (
          <article {...kb(() => actions.showFilter('BEST_SELLERS'))} className="elz-tile elz-tile-light lg:col-span-5 min-h-[250px]">
            <div className="relative z-10 p-6 sm:p-8 max-w-[62%]">
              <h3 className="elz-tile-title text-[26px] sm:text-[32px]">{t.best}</h3>
              <p className="text-sm text-muted mt-2 line-clamp-2">{heroBest.p.name}</p>
              <span className="elz-link mt-4 inline-block text-sm font-medium">{t.bestCta} {rtl ? '‹' : '›'}</span>
            </div>
            {partImage(heroBest.p) && (
              <img src={partImage(heroBest.p)} alt="" loading="lazy" referrerPolicy="no-referrer"
                className="elz-tile-img absolute bottom-3 end-3 w-[40%] max-h-[70%] object-contain" />
            )}
          </article>
        )}

        {brandTiles.length > 0 && (
          <article className="elz-tile elz-tile-tint lg:col-span-5 min-h-[250px]">
            <div className="relative z-10 p-6 sm:p-8">
              <h3 className="elz-tile-title text-[26px] sm:text-[32px]">{t.brands}</h3>
              <div className="grid grid-cols-3 gap-2.5 mt-4">
                {brandTiles.map((b) => {
                  const img = getBrandImg && getBrandImg(b);
                  return (
                    <button key={b} type="button" onClick={() => actions.showBrand(b)} className="elz-brand-chip">
                      {img
                        ? <img src={img} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-7 h-7 rounded-full object-cover bg-white" />
                        : <span className="w-7 h-7 rounded-full bg-surface2 flex items-center justify-center text-xs font-semibold">{cleanBrand(b).charAt(0)}</span>}
                      <span className="truncate text-[11px] font-medium">{cleanBrand(b)}</span>
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={actions.showAll} className="elz-link mt-4 text-sm font-medium">{t.brandsCta} {rtl ? '‹' : '›'}</button>
            </div>
          </article>
        )}
      </section>

      {data.disc.length > 0 && (
        <HRail rtl={rtl} title={t.offersRail} onViewAll={() => actions.showFilter('DISCOUNTS')} viewAllLabel={t.viewAll}>
          {data.disc.slice(0, 12).map((x, i) => renderProductCard(x.p, i))}
        </HRail>
      )}

      {data.more.length > 0 && (
        <HRail rtl={rtl} title={t.moreRail} onViewAll={actions.showAll} viewAllLabel={t.viewAll}>
          {data.more.map((x, i) => renderProductCard(x.p, i + 4))}
        </HRail>
      )}
    </div>
  );
}
