import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Watch, Headphones, Search, Star, RefreshCw, ShoppingCart, ExternalLink, BatteryFull, Info, Plus, Minus, ChevronDown, ChevronUp, Store } from 'lucide-react';
import { fetchWearablesList, fetchWearableLive } from '../services/karamboLiveClient.js';

const TYPES = [
  ['all', 'الكل'],
  ['earbuds', 'سماعات'],
  ['watch', 'ساعات ذكية']
];

function Stars({ value, size = 'w-3.5 h-3.5' }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${v} من 5`}>
      {[1, 2, 3, 4, 5].map(i => {
        const fill = Math.max(0, Math.min(1, v - (i - 1)));
        return (
          <span key={i} className={`relative inline-block ${size}`}>
            <Star className={`absolute inset-0 ${size} text-line`} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={`${size} text-amber-500 fill-amber-500`} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

/**
 * Smart watches + earbuds from global brands.
 * Stars = real customer rating on Amazon when we can read it (source shown), otherwise the editorial score.
 */
function GlobalWearables({ formatMoney, onRequestOrder, cfg }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('all');
  const [brand, setBrand] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('rating');
  const [live, setLive] = useState({});
  const queue = useRef([]);
  const running = useRef(false);

  useEffect(() => {
    let alive = true;
    fetchWearablesList().then(r => { if (alive) { setItems(r.items || []); setLoading(false); } });
    return () => { alive = false; };
  }, []);

  const pump = async () => {
    if (running.current) return;
    running.current = true;
    while (queue.current.length) {
      const id = queue.current.shift();
      const r = await fetchWearableLive(id);
      setLive(p => ({ ...p, [id]: { loading: false, ...r } }));
      await new Promise(res => setTimeout(res, 350));
    }
    running.current = false;
  };
  const request = (id) => {
    if (live[id] || queue.current.includes(id)) return;
    setLive(p => ({ ...p, [id]: { loading: true } }));
    queue.current.push(id);
    pump();
  };

  const brands = useMemo(() => ['all', ...new Set(items.map(i => i.brand))], [items]);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = items.filter(i =>
      (type === 'all' || i.type === type) &&
      (brand === 'all' || i.brand === brand) &&
      (!t || `${i.name} ${i.brand}`.toLowerCase().includes(t))
    );
    const rating = (i) => (live[i.id] && live[i.id].liveRating ? live[i.id].liveRating.value : i.editorialRating);
    return [...list].sort((a, b) => sort === 'price' ? a.msrpUsd - b.msrpUsd : sort === 'price_desc' ? b.msrpUsd - a.msrpUsd : rating(b) - rating(a));
  }, [items, type, brand, q, sort, live]);

  // Load live price + rating for the first visible cards automatically (one at a time to stay polite to the shops)
  useEffect(() => {
    filtered.slice(0, 8).forEach(i => request(i.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered.map(i => i.id).join(',')]);

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-line rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex-1 flex items-center gap-2 rounded-lg px-3 py-2 bg-surface2 border border-line">
            <Search className="w-4 h-4 text-muted shrink-0" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث: AirPods، Galaxy Watch، Sony..." className="flex-1 bg-transparent border-0 text-sm font-bold focus:outline-none" />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)} className="rounded-lg px-3 py-2 bg-surface2 border border-line text-xs font-black text-fg">
            <option value="rating">الأعلى تقييماً</option>
            <option value="price">الأرخص أولاً</option>
            <option value="price_desc">الأغلى أولاً</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map(([k, l]) => (
            <button key={k} type="button" onClick={() => setType(k)} className={`px-3.5 py-1.5 rounded-full text-xs font-black border transition ${type === k ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900' : 'bg-surface border-line text-fg'}`}>{l}</button>
          ))}
          <span className="w-px bg-line mx-1" />
          {brands.map(b => (
            <button key={b} type="button" onClick={() => setBrand(b)} className={`px-3 py-1.5 rounded-full text-xs font-black border transition ${brand === b ? 'bg-slate-900 text-white border-slate-900 dark:bg-slate-100 dark:text-slate-900' : 'bg-surface border-line text-fg'}`}>{b === 'all' ? 'كل الماركات' : b}</button>
          ))}
        </div>
        <div className="flex items-start gap-2 text-[11px] font-bold text-muted leading-relaxed">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>النجوم المكتوب جنبها «تقييم عملاء أمازون» حقيقية ومسحوبة تلقائياً من صفحة المنتج. لو مقدرناش نقراها بنعرض «تقييم تحريري» مبني على إجماع المراجعين، وبنوضّح ده على الكارت.</span>
        </div>
      </div>

      {loading ? (
        <div className="bg-surface border border-line rounded-xl p-10 text-center text-xs font-black text-muted"><RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" /> جاري تحميل المنتجات...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-line rounded-xl p-10 text-center text-sm font-bold text-muted">مفيش منتجات مطابقة للبحث</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map(it => {
            const lv = live[it.id] || null;
            const Icon = it.type === 'watch' ? Watch : Headphones;
            const rate = lv && lv.liveRating ? lv.liveRating : null;
            const stars = rate ? rate.value : it.editorialRating;
            const price = lv && lv.egypt ? { v: lv.egypt.price, cur: 'EGP', src: lv.egypt.store, url: lv.egypt.url, kind: 'eg' }
              : lv && (lv.uae || lv.ksa) ? { v: (lv.uae || lv.ksa).price, cur: (lv.uae || lv.ksa).currency, src: (lv.uae || lv.ksa).store, url: (lv.uae || lv.ksa).url, kind: 'gulf' } : null;
            const estimate = lv && lv.estimatedEgpFromMsrp ? lv.estimatedEgpFromMsrp : 0;
            return (
              <div key={it.id} className="bg-surface border border-line rounded-xl overflow-hidden flex flex-col">
                <div className="relative bg-white dark:bg-slate-900 aspect-[4/3] flex items-center justify-center p-3 border-b border-line">
                  {lv && lv.image ? <img src={lv.image} alt={it.name} loading="lazy" referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" /> : <Icon className="w-12 h-12 text-muted" />}
                  <span className="absolute top-2 start-2 px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-black">{it.brand}</span>
                </div>
                <div className="p-3 flex flex-col gap-2 flex-1">
                  <div className="font-black text-sm text-fg leading-snug line-clamp-2 min-h-[2.5rem]">{it.name}</div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <Stars value={stars} />
                      <span className="text-xs font-black text-fg">{Number(stars).toFixed(1)}</span>
                    </div>
                    <div className="text-[10px] font-bold text-muted">
                      {rate ? `تقييم عملاء ${rate.source} · ${rate.count.toLocaleString('en-US')} تقييم` : lv && lv.loading ? 'جاري قراءة تقييم العملاء...' : 'تقييم تحريري'}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-muted"><BatteryFull className="w-3 h-3" /> {it.battery}</div>
                  <div className="flex flex-wrap gap-1">
                    {it.tags.slice(0, 2).map(t => <span key={t} className="px-1.5 py-0.5 rounded bg-surface2 border border-line text-[10px] font-bold text-muted">{t}</span>)}
                  </div>
                  <div className="mt-auto pt-2 border-t border-line">
                    {lv && lv.loading ? (
                      <div className="text-[11px] font-bold text-muted flex items-center gap-1.5"><RefreshCw className="w-3 h-3 animate-spin" /> فحص السعر...</div>
                    ) : price ? (
                      <div>
                        <div className="text-[10px] font-bold text-muted">{price.kind === 'eg' ? 'السعر في مصر' : 'السعر في الخليج'} · {price.src}</div>
                        <div className="text-base font-black text-fg">{price.cur === 'EGP' ? formatMoney(price.v) : `${price.v.toLocaleString('en-US')} ${price.cur}`}</div>
                      </div>
                    ) : lv ? (
                      <div>
                        <div className="text-[10px] font-bold text-muted">لا سعر مباشر حالياً — تقدير مبدئي</div>
                        <div className="text-sm font-black text-fg">≈ {formatMoney(estimate)}</div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => request(it.id)} className="text-[11px] font-black text-fg underline">اعرف السعر والتقييم</button>
                    )}
                    <div className="flex gap-1.5 mt-2">
                      <button type="button" onClick={() => onRequestOrder && onRequestOrder(it.name, price && price.cur === 'EGP' ? price.v : estimate)} className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 text-white text-[11px] font-black transition">
                        <ShoppingCart className="w-3.5 h-3.5" /> اطلبه لي
                      </button>
                      {price && price.url && (
                        <a href={price.url} target="_blank" rel="noopener noreferrer nofollow" className="px-2.5 py-2 rounded-lg bg-surface2 border border-line text-fg" title="صفحة المنتج"><ExternalLink className="w-3.5 h-3.5" /></a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {cfg && cfg.disclaimer && <div className="text-[10px] font-bold text-muted text-center">{cfg.disclaimer}</div>}
    </div>
  );
}


// ---------------------------------------------------------------------------
// Real store products (smart watches + earbuds/headphones) with compact filters.
// ---------------------------------------------------------------------------
const WATCH_RE = /ساعة|ساعات|سوار|أساور|اساور|watch|smartwatch|smart watch|band|kospet|kieslect|amazfit/i;
const AUDIO_RE = /سماع|earbud|airpod|buds|headphone|headset|هيدفون|ايربود|neckband|earphone|airdots|tws|speaker|سبيكر/i;

function classify(p) {
  const cat = String(p.category || '');
  const text = `${cat} ${p.name || ''}`;
  if (/ساعات|ساعة|أساور/.test(cat) || (WATCH_RE.test(p.name || '') && !AUDIO_RE.test(p.name || ''))) return 'watch';
  if (/سماع/.test(cat) || AUDIO_RE.test(text)) return 'audio';
  return '';
}

function brandOf(p) {
  const n = String(p.name || '').replace(/^OR\s*-\s*/i, '').trim();
  const first = n.split(/[\s\-–/]+/)[0] || '';
  return first.length > 1 ? first : 'أخرى';
}

export default function KaramboWearablesView({ ctx, formatMoney, onRequestOrder, cfg }) {
  // Watches/earbuds are often attached to an admin-hidden "model" (e.g. the AI-sourcing import model), which made them vanish from publicParts.
  // So: respect part-level, category-level and price rules, but ignore model/brand hide rules for this page.
  const parts = (() => {
    if (!ctx) return [];
    const all = Array.isArray(ctx.parts) ? ctx.parts : (Array.isArray(ctx.publicParts) ? ctx.publicParts : []);
    return all.filter((p) => p && !p.hidden && !(p.customGroupPrices && p.customGroupPrices._hidden)
      && !(ctx.hiddenPartIdsSet && ctx.hiddenPartIdsSet.has(String(p.id || '').trim()))
      && !(p.category && ctx.isCategoryHidden && ctx.isCategoryHidden(p.category))
      && !(ctx.isPartVipOnly && ctx.isPartVipOnly(p) && !ctx.isCurrentClientVip)
      && Number(p.basePrice) > 0
      && !(p._isOrCatalog && ctx.siteSettings && ctx.siteSettings.disableBundledOrCatalog === true));
  })();
  const [type, setType] = useState('all');
  const [brand, setBrand] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('new');
  const [showGlobal, setShowGlobal] = useState(false);
  const [limit, setLimit] = useState(24);

  const priceOf = (p) => {
    try { const pi = ctx.calculatePartPrice(p, ctx.currentGroup); return Number(pi && pi.displayPrice) || 0; } catch (e) { return Number(p.basePrice) || 0; }
  };
  const base = useMemo(() => parts.filter(p => p && classify(p) && Number(p.basePrice) > 0).map(p => ({ p, kind: classify(p), brand: brandOf(p) })), [parts]);
  const counts = useMemo(() => ({ all: base.length, watch: base.filter(x => x.kind === 'watch').length, audio: base.filter(x => x.kind === 'audio').length }), [base]);
  const brands = useMemo(() => {
    const m = {};
    base.filter(x => type === 'all' || x.kind === type).forEach(x => { m[x.brand] = (m[x.brand] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 14).map(e => e[0]);
  }, [base, type]);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    const out = base.filter(x => (type === 'all' || x.kind === type) && (brand === 'all' || x.brand === brand) && (!t || `${x.p.name} ${x.p.category}`.toLowerCase().includes(t)));
    if (sort === 'price') out.sort((a, b) => priceOf(a.p) - priceOf(b.p));
    else if (sort === 'price_desc') out.sort((a, b) => priceOf(b.p) - priceOf(a.p));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, type, brand, q, sort]);
  useEffect(() => { setLimit(24); }, [type, brand, q, sort]);

  const seg = (k, l, n) => (
    <button key={k} type="button" onClick={() => { setType(k); setBrand('all'); }} className={`flex-1 px-2 py-1.5 rounded-lg text-[12px] font-black transition whitespace-nowrap ${type === k ? 'bg-surface text-fg shadow-sm' : 'text-muted'}`}>{l} <span className="opacity-60">({n})</span></button>
  );

  const money = ctx && ctx.formatMoney ? ctx.formatMoney : formatMoney;

  return (
    <div className="space-y-3">
      <div className="bg-surface border border-line rounded-2xl p-2.5 sm:p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-2 rounded-xl px-3 py-2 bg-surface2 border border-line">
            <Search className="w-4 h-4 text-muted shrink-0" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="ابحث في ساعاتنا وسماعاتنا..." className="flex-1 min-w-0 bg-transparent border-0 text-[13px] font-bold focus:outline-none text-fg" />
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)} className="shrink-0 rounded-xl px-2 py-2 bg-surface2 border border-line text-[11px] font-black text-fg max-w-[104px]">
            <option value="new">الافتراضي</option>
            <option value="price">الأرخص</option>
            <option value="price_desc">الأغلى</option>
          </select>
        </div>
        <div className="flex gap-1 p-1 rounded-xl bg-surface2">
          {seg('all', 'الكل', counts.all)}{seg('watch', 'ساعات', counts.watch)}{seg('audio', 'سماعات', counts.audio)}
        </div>
        {brands.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5">
            <button type="button" onClick={() => setBrand('all')} className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-black border ${brand === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-surface border-line text-fg'}`}>كل الماركات</button>
            {brands.map(b => (
              <button key={b} type="button" onClick={() => setBrand(b)} className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-black border ${brand === b ? 'bg-slate-900 text-white border-slate-900' : 'bg-surface border-line text-fg'}`}>{b}</button>
            ))}
          </div>
        )}
      </div>

      {base.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-8 text-center space-y-2">
          <Store className="w-8 h-8 mx-auto text-muted" />
          <div className="text-sm font-black text-fg">لسه مفيش ساعات أو سماعات في المتجر</div>
          <div className="text-xs font-bold text-muted">أول ما تضيف منتجات في قسم «ساعات» أو «سماعات» هتظهر هنا لوحدها.</div>
        </div>
      ) : list.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl p-8 text-center text-sm font-bold text-muted">مفيش منتجات مطابقة للبحث</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
            {list.slice(0, limit).map(({ p }) => {
              const price = priceOf(p);
              const imgs = ctx.getPartImagesList ? ctx.getPartImagesList(p) : [p.image];
              const img = (imgs && imgs[0]) || p.image;
              const out = Number(p.stock) <= 0 || !!p.soldOut;
              const qty = (ctx.cart && ctx.cart[p.id] && ctx.cart[p.id].qty) || 0;
              return (
                <div key={p.id} className="bg-surface border border-line rounded-2xl overflow-hidden flex flex-col">
                  <button type="button" onClick={() => { try { ctx.recordRecentlyViewedPart && ctx.recordRecentlyViewedPart(p.id); ctx.setDetailImageIdx && ctx.setDetailImageIdx(0); ctx.setSelectedDetailItem({ type: 'part', part: p }); } catch (e) {} }} className="relative bg-white dark:bg-slate-900 aspect-square flex items-center justify-center p-2 border-b border-line">
                    {img ? <img src={img} alt={p.name} loading="lazy" referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" /> : <Watch className="w-10 h-10 text-muted" />}
                    {out && <span className="absolute top-1.5 start-1.5 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black">نفدت الكمية</span>}
                  </button>
                  <div className="p-2.5 flex flex-col gap-1.5 flex-1">
                    <div className="font-black text-[12.5px] text-fg leading-snug line-clamp-2 min-h-[2.2rem]">{String(p.name || '').replace(/^OR\s*-\s*/i, '')}</div>
                    <div className="mt-auto text-[15px] font-black text-fg tabular-nums">{money(price)}</div>
                    {out ? (
                      <div className="text-[11px] font-bold text-muted">غير متاح حالياً</div>
                    ) : qty === 0 ? (
                      <button type="button" onClick={() => ctx.updateCartQty(p.id, 1)} className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-[12px] font-black"><ShoppingCart className="w-3.5 h-3.5" /> أضف للسلة</button>
                    ) : (
                      <div className="flex items-center justify-between rounded-xl bg-[#0071E3]/10 p-1">
                        <button type="button" onClick={() => ctx.updateCartQty(p.id, -1)} className="w-8 h-8 rounded-lg bg-[#0071E3] text-white flex items-center justify-center"><Minus className="w-4 h-4" /></button>
                        <span className="text-sm font-black text-fg tabular-nums">{qty}</span>
                        <button type="button" onClick={() => ctx.updateCartQty(p.id, 1)} className="w-8 h-8 rounded-lg bg-[#0071E3] text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {list.length > limit && (
            <button type="button" onClick={() => setLimit(l => l + 24)} className="w-full py-2.5 rounded-xl bg-surface border border-line text-[13px] font-black text-fg">عرض المزيد ({list.length - limit})</button>
          )}
        </>
      )}

      <div className="rounded-2xl border border-line bg-surface overflow-hidden">
        <button type="button" onClick={() => setShowGlobal(v => !v)} className="w-full flex items-center justify-between gap-2 px-4 py-3 text-start">
          <span className="min-w-0"><span className="block text-[13px] font-black text-fg">موديلات عالمية بأسعار تقريبية</span><span className="block text-[11px] font-bold text-muted">مش في المتجر دلوقتي، تقدر تطلبها استيراد</span></span>
          {showGlobal ? <ChevronUp className="w-4 h-4 text-muted shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted shrink-0" />}
        </button>
        {showGlobal && <div className="p-3 border-t border-line"><GlobalWearables formatMoney={formatMoney} onRequestOrder={onRequestOrder} cfg={cfg} /></div>}
      </div>
    </div>
  );
}
