import React, { useState, useEffect } from 'react';
import {
  Search, Smartphone, Scale, X, RefreshCw, Megaphone, ChevronLeft, Globe, Sparkles, DollarSign, ShoppingCart } from 'lucide-react';
import { fetchGlobalCatalog, fetchLiveEgyptPrice, fetchLiveNews, fetchPricesBatch } from '../services/karamboLiveClient.js';
import { matchesPhoneSearch } from '../services/gsmarenaClient.js';

/**
 * Fast Global Phone Guide View (v22 — Instant Open, Zero 60s Freeze!)
 * - Browses, searches, and filters ALL 13,000+ global smartphone models
 * - Instantly shows Egypt price for local matches + fast 1-click "اعرف السعر في مصر" per card
 *   (never floods the browser with 12 simultaneous requests!)
 * - Clicking any phone opens its detail page IMMEDIATELY (<50ms) while specs & live Egypt price stream in
 * - Includes "آخر الأخبار" editorial news ticker banner at the top
 */
export default function KaramboLiveGuideView({
  cfg,
  localPhones = [],
  formatMoney,
  onOpenPhone,
  onOpenNews,
  onOpenComparePage,
  onRequestImport,
  renderLocalPhoneCard
}) {
  const gCfg = (cfg && cfg.guideCfg) || {};
  const nCfg = (cfg && cfg.newsCfg) || {};
  const notInEgyptLabel = gCfg.notInEgyptLabel || 'غير متوفر في مصر حالياً';

  const [mode, setMode] = useState(gCfg.enableGlobalCatalog !== false ? 'global' : 'local');
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState('all');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [brands, setBrands] = useState(['Apple', 'Samsung', 'Xiaomi', 'Oppo', 'Realme', 'Honor', 'Vivo', 'Infinix', 'Tecno', 'Huawei', 'Google', 'OnePlus', 'Motorola', 'Nothing']);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [egyptPrices, setEgyptPrices] = useState({});
  const [newsList, setNewsList] = useState(() => (nCfg.customArticles || []).slice(0, 6));

  useEffect(() => {
    if (gCfg.showNewsBannerInGuide === false) return;
    let alive = true;
    (async () => {
      const r = await fetchLiveNews(8);
      if (!alive) return;
      const merged = [...(nCfg.customArticles || []), ...(r.articles || [])].slice(0, 8);
      setNewsList(merged);
    })();
    return () => { alive = false; };
  }, [gCfg.showNewsBannerInGuide]);

  useEffect(() => {
    if (mode !== 'global') return;
    let alive = true;
    const t = setTimeout(async () => {
      setLoading(true);
      const r = await fetchGlobalCatalog({ brand, q: query.trim(), page, limit: 24 });
      if (!alive) return;
      setLoading(false);
      if (r.ok) {
        setItems(prev => page === 1 ? (r.results || []) : [...prev, ...(r.results || [])]);
        setTotal(r.total || 0);
        setHasMore(!!r.hasMore);
        if (Array.isArray(r.brands) && r.brands.length > 0) setBrands(r.brands);
      } else if (page === 1) {
        setItems([]);
        setHasMore(false);
      }
    }, query.trim() ? 260 : 40);
    return () => { alive = false; clearTimeout(t); };
  }, [mode, brand, query, page]);

  // Auto-check Egypt prices for the visible grid (batched, never floods the browser)
  const checkedRef = React.useRef(new Set());
  useEffect(() => {
    if (mode !== 'global' || gCfg.autoFetchEgyptPrice === false) return;
    const todo = items.filter(it => !checkedRef.current.has(it.id) && !(localPhones.find(lp => lp.slug === it.slug && lp.price > 0)));
    if (!todo.length) return;
    let alive = true;
    todo.forEach(it => checkedRef.current.add(it.id));
    setEgyptPrices(p => { const n = { ...p }; todo.forEach(it => { if (!n[it.id]) n[it.id] = { loading: true }; }); return n; });
    (async () => {
      for (let i = 0; i < todo.length; i += 6) {
        const chunk = todo.slice(i, i + 6);
        const res = await fetchPricesBatch(chunk.map(c => c.name));
        if (!alive) return;
        setEgyptPrices(p => {
          const n = { ...p };
          chunk.forEach(c => { const r = res[c.name]; n[c.id] = r && r.found ? { loading: false, found: true, price: r.price, offers: r.offers || [], source: r.source } : { loading: false, found: false, price: 0 }; });
          return n;
        });
      }
    })();
    return () => { alive = false; };
  }, [items, mode]);

  const checkCardPrice = async (it, e) => {
    e && e.stopPropagation();
    setEgyptPrices(p => ({ ...p, [it.id]: { loading: true } }));
    const res = await fetchLiveEgyptPrice(it.name);
    setEgyptPrices(p => ({ ...p, [it.id]: { loading: false, found: !!res.found, price: res.price || 0 } }));
  };

  // INSTANT navigation (<50ms): passes lightweight device immediately, Phone Detail loads full specs & Egypt price asynchronously!
  const handleOpenGlobalDevice = (it) => {
    const localMatch = localPhones.find(lp =>
      lp.slug === it.slug || (lp.name && it.name && lp.name.toLowerCase() === it.name.toLowerCase())
    );
    const cachedPrice = egyptPrices[it.id] && egyptPrices[it.id].found ? egyptPrices[it.id].price : 0;
    const initialDev = localMatch
      ? { ...localMatch, price: cachedPrice || localMatch.price || 0 }
      : {
          id: it.id,
          slug: it.slug,
          gsmId: it.gsmId,
          name: it.name,
          brand: it.brand,
          brandSlug: String(it.brand || '').toLowerCase(),
          images: it.img ? [it.img] : [],
          specs: [],
          price: cachedPrice,
          loadingSpecs: true,
          loadingPrice: !cachedPrice && gCfg.autoFetchEgyptPrice !== false,
          source: 'gsmarena'
        };
    onOpenPhone && onOpenPhone(initialDev);
  };

  const filteredLocal = localPhones.filter(p => {
    if (brand !== 'all' && p.brand !== brand && (p.brandSlug || '').toLowerCase() !== brand.toLowerCase()) return false;
    if (query.trim() && !matchesPhoneSearch(p, query.trim())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Editorial News Banner inside Guide */}
      {gCfg.showNewsBannerInGuide !== false && newsList.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-l from-[#163B6B]/15 via-[#1E4E8C]/10 to-[#2F6BB3]/15 border border-[#1E4E8C]/30 p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-[#1E4E8C] text-white flex items-center justify-center shrink-0"><Megaphone className="w-4 h-4" /></span>
              <span className="text-xs sm:text-sm font-black text-fg">{nCfg.bannerTitle || 'آخر أخبار الموبايلات'}</span>
            </div>
            <button type="button" onClick={() => onOpenNews && onOpenNews()} className="inline-flex items-center gap-1 text-xs font-black text-[#1E4E8C] dark:text-[#7FB0E8] hover:underline">
              عرض كل الأخبار <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
            {newsList.map(art => (
              <button
                key={art.id}
                type="button"
                onClick={() => onOpenNews && onOpenNews(art)}
                className="w-64 shrink-0 flex items-center gap-2.5 p-2 rounded-2xl bg-surface border border-line hover:border-[#2F6BB3] text-start transition"
              >
                {art.image ? (
                  <img src={art.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-14 h-14 rounded-xl object-cover shrink-0 bg-surface2" />
                ) : (
                  <span className="w-14 h-14 rounded-xl bg-[#1E4E8C]/10 flex items-center justify-center shrink-0"><Megaphone className="w-5 h-5 text-[#1E4E8C]" /></span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-black text-fg line-clamp-2 leading-snug">{art.title}</div>
                  <div className="text-[9px] font-bold text-muted mt-0.5">{art.category} {art.date ? `· ${art.date}` : ''}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search + Mode Switcher */}
      <div className="flex flex-col md:flex-row gap-2.5">
        <div className="flex items-center gap-2 flex-1 rounded-2xl px-3.5 py-2 bg-surface border border-line focus-within:border-[#2F6BB3]">
          <Search className="w-4 h-4 text-[#2F6BB3] shrink-0" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(1); }}
            placeholder="ابحث عن أي موديل بالعربي أو الإنجليزي... (آيفون 16، S25 Ultra، ريدمي نوت 14)"
            className="flex-1 bg-transparent border-0 text-sm font-bold focus:outline-none py-1"
          />
          {query && <button type="button" onClick={() => { setQuery(''); setPage(1); }}><X className="w-4 h-4 text-muted" /></button>}
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => { setMode('global'); setPage(1); }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black border transition ${mode === 'global' ? 'bg-[#1E4E8C] text-white border-[#1E4E8C] shadow' : 'bg-surface border-line text-fg'}`}
          >
            <Globe className="w-4 h-4" /> كل موديلات العالم {total > 0 ? `(${total.toLocaleString('en-US')})` : ''}
          </button>
          <button
            type="button"
            onClick={() => { setMode('local'); setPage(1); }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black border transition ${mode === 'local' ? 'bg-emerald-600 text-white border-emerald-600 shadow' : 'bg-surface border-line text-fg'}`}
          >
            <Sparkles className="w-4 h-4" /> دليل المتجر ({localPhones.length})
          </button>
        </div>
      </div>

      {/* Brand Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => { setBrand('all'); setPage(1); }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-black shrink-0 transition ${brand === 'all' ? 'bg-[#1E4E8C] text-white' : 'bg-surface2 text-fg border border-line'}`}
        >
          كل الماركات
        </button>
        {brands.map(b => (
          <button
            key={b}
            type="button"
            onClick={() => { setBrand(b); setPage(1); }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black shrink-0 transition ${brand.toLowerCase() === b.toLowerCase() ? 'bg-[#1E4E8C] text-white' : 'bg-surface2 text-fg border border-line'}`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* GLOBAL CATALOG GRID */}
      {mode === 'global' ? (
        loading && items.length === 0 ? (
          <div className="bg-surface border border-line rounded-3xl p-12 text-center space-y-2">
            <RefreshCw className="w-8 h-8 text-[#1E4E8C] animate-spin mx-auto" />
            <div className="text-sm font-black text-fg">جاري تحميل موديلات الموبايلات...</div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-surface border border-line rounded-3xl p-8 text-center space-y-3">
            <div className="text-sm font-black text-muted">لم تظهر نتائج من الكتالوج الشامل — يمكنك التبديل لدليل المتجر أو توسيع البحث</div>
            <button type="button" onClick={() => setMode('local')} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black">عرض أجهزة دليل المتجر ({localPhones.length})</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {items.map(it => {
                const localMatch = localPhones.find(lp => lp.slug === it.slug);
                const pr = egyptPrices[it.id] || (localMatch && localMatch.price > 0 ? { loading: false, found: true, price: localMatch.price } : null);
                return (
                  <div key={it.id} className="bg-surface border border-line rounded-3xl overflow-hidden flex flex-col hover:border-[#2F6BB3] transition group">
                    <button
                      type="button"
                      onClick={() => handleOpenGlobalDevice(it)}
                      className="relative bg-white dark:bg-[#0D1528] aspect-[4/3] flex items-center justify-center overflow-hidden p-2"
                    >
                      {it.img
                        ? <img src={it.img} alt={it.name} loading="lazy" referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300" />
                        : <Smartphone className="w-12 h-12 text-muted" />}
                      <span className="absolute top-2 start-2 px-2 py-0.5 rounded-full bg-[#1E4E8C] text-white text-[10px] font-black">{it.brand}</span>
                    </button>
                    <div className="p-3.5 flex flex-col gap-2 flex-1">
                      <button type="button" onClick={() => handleOpenGlobalDevice(it)} className="text-start font-black text-sm text-fg leading-snug hover:text-[#1E4E8C] line-clamp-2">
                        {it.name}
                      </button>

                      {/* Fast On-Demand or Cached Egypt Price */}
                      <div className="mt-auto pt-1.5 border-t border-line/60">
                        {!pr ? (
                          <button
                            type="button"
                            onClick={(e) => checkCardPrice(it, e)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 text-[10px] font-black transition"
                          >
                            <DollarSign className="w-3 h-3" /> اعرف السعر في مصر
                          </button>
                        ) : pr.loading ? (
                          <div className="text-[11px] font-bold text-muted flex items-center gap-1.5">
                            <RefreshCw className="w-3 h-3 animate-spin text-[#1E4E8C]" /> جاري فحص السعر...
                          </div>
                        ) : pr.found && pr.price > 0 ? (
                          <div>
                            <div className="text-[10px] font-bold text-muted">السعر في مصر</div>
                            <div className="text-base font-black text-emerald-600 dark:text-emerald-400">{formatMoney(pr.price)}</div>
                            {pr.offers && pr.offers[0] && <div className="text-[9px] font-bold text-muted">متاح أيضاً على {pr.offers[0].store}</div>}
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] font-black text-rose-600 dark:text-rose-400">
                            {notInEgyptLabel}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenGlobalDevice(it)}
                          className="flex-1 py-2 rounded-xl bg-[#1E4E8C] hover:bg-[#163B6B] text-white text-xs font-black transition"
                        >
                          المواصفات والسعر
                        </button>
                        {onRequestImport && gCfg.allowImportCta !== false && (
                          <button
                            type="button"
                            onClick={() => onRequestImport(it.name, pr && pr.found ? pr.price : 0)}
                            className="px-2.5 py-2 rounded-xl bg-surface2 border border-line hover:border-emerald-500 text-fg text-xs font-black transition inline-flex items-center gap-1"
                            title="اطلب الجهاز ده — هنأكد التوفر والسعر"
                          >
                            <ShoppingCart className="w-4 h-4" /><span className="hidden sm:inline">اطلبه</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenComparePage && onOpenComparePage([it.slug])}
                          className="px-2.5 py-2 rounded-xl bg-surface2 border border-line hover:border-slate-500 text-fg text-xs font-black transition"
                          title="قارن هذا الجهاز"
                        >
                          <Scale className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setPage(p => p + 1)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-surface2 hover:bg-[#1E4E8C] hover:text-white border border-line text-xs font-black text-fg transition"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                  {loading ? 'جاري تحميل المزيد...' : `عرض المزيد من الموديلات (${items.length} من ${total.toLocaleString('en-US')})`}
                </button>
              </div>
            )}
          </div>
        )
      ) : (
        filteredLocal.length === 0 ? (
          <div className="bg-surface border border-line rounded-3xl p-10 text-center text-muted font-bold">مفيش أجهزة مطابقة في دليل المتجر — جرّب البحث في «كل موديلات العالم»</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredLocal.map(p => renderLocalPhoneCard(p))}
          </div>
        )
      )}
    </div>
  );
}
