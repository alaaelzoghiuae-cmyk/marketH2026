import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Watch, Headphones, Search, Star, RefreshCw, ShoppingCart, ExternalLink, BatteryFull, Info } from 'lucide-react';
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
export default function KaramboWearablesView({ formatMoney, onRequestOrder, cfg }) {
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
