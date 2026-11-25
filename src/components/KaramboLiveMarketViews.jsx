import React, { useState, useEffect } from 'react';
import {
  Search, Scale, Sparkles, TrendingDown, TrendingUp, Globe, Smartphone, RefreshCw,
  PhoneCall, Check, Star, AlertTriangle, MessageSquare, CheckCircle2, X
} from 'lucide-react';
import {
  fetchLiveMarketPhones,
  fetchLiveRadar,
  fetchLiveGulfAndEgyptPrices,
  fetchLiveEgyptPrice
} from '../services/karamboLiveClient.js';
import GsmarenaPhonePicker from './GsmarenaPhonePicker.jsx';

// ===================== 1. LIVE MARKET ADVISOR ("ساعدني أختار") =====================
export function KaramboLiveAdvisorView({
  cfg,
  localPhones = [],
  formatMoney,
  onOpenPhone,
  onToggleCompare,
  onCompareIds,
  renderLocalPhoneCard
}) {
  const mCfg = (cfg && cfg.marketCfg) || {};
  const budgets = [8000, 12000, 15000, 20000, 30000, 50000, 80000, 120000];
  const [budget, setBudget] = useState(20000);
  const [brand, setBrand] = useState('ALL');
  const [prio, setPrio] = useState('value');
  const [liveItems, setLiveItems] = useState([]);
  const [loading, setLoading] = useState(mCfg.enableLiveAdvisor !== false);
  const [searchQ, setSearchQ] = useState('');

  const loadMarket = async () => {
    if (mCfg.enableLiveAdvisor === false) { setLoading(false); return; }
    setLoading(true);
    const r = await fetchLiveMarketPhones({ q: searchQ.trim(), maxPrice: budget, brand: brand === 'ALL' ? '' : brand });
    setLoading(false);
    if (r.ok && Array.isArray(r.items)) setLiveItems(r.items);
  };

  useEffect(() => {
    const t = setTimeout(loadMarket, 250);
    return () => clearTimeout(t);
  }, [budget, brand, searchQ, mCfg.enableLiveAdvisor]);

  const brands = ['ALL', 'Samsung', 'Apple', 'Xiaomi', 'Oppo', 'Realme', 'Honor', 'Vivo', 'Infinix', 'Tecno'];
  const PRIOS = [
    ['value', 'أفضل قيمة مقابل السعر'],
    ['priceLow', 'الأوفر في الميزانية'],
    ['priceHigh', 'الأعلى فئة في الميزانية'],
    ['drops', 'اللي سعره نزل مؤخراً']
  ];

  // Combine live market phones with local guide matches
  const localInBudget = localPhones.filter(p => {
    if (p.price > budget) return false;
    if (brand !== 'ALL' && !`${p.name} ${p.brand} ${p.brandSlug}`.toLowerCase().includes(brand.toLowerCase())) return false;
    if (searchQ.trim() && !`${p.name} ${p.brand}`.toLowerCase().includes(searchQ.trim().toLowerCase())) return false;
    return true;
  });

  const sortedLive = [...liveItems]
    .filter(it => it.price > 0 && it.price <= budget)
    .sort((a, b) =>
      prio === 'priceLow' ? a.price - b.price
        : prio === 'drops' ? ((b.trend === 'down' ? 1 : 0) - (a.trend === 'down' ? 1 : 0)) || (b.pct - a.pct)
        : b.price - a.price
    );

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-line rounded-3xl p-4 sm:p-5 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs font-black text-muted">ميزانيتك لحد كام في السوق المصري؟</div>
            <div className="flex items-center gap-2">
              <input type="number" min="3000" max="200000" step="1000" value={budget} onChange={e => setBudget(Math.max(2000, Number(e.target.value) || 0))} className="w-28 px-2.5 py-1 rounded-xl border border-line bg-surface2 text-xs font-black text-fg" />
              <span className="text-xs font-black text-[#1E4E8C]">{formatMoney(budget)}</span>
            </div>
          </div>
          <input type="range" min="4000" max="150000" step="1000" value={Math.min(150000, budget)} onChange={e => setBudget(Number(e.target.value))} className="w-full accent-[#1E4E8C]" />
          <div className="flex flex-wrap gap-1.5">
            {budgets.map(b => (
              <button key={b} type="button" onClick={() => setBudget(b)} className={`px-3 py-1 rounded-full text-[11px] font-black transition ${budget === b ? 'bg-[#1E4E8C] text-white' : 'bg-surface2 text-fg border border-line'}`}>
                {formatMoney(b)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-2xl px-3 py-2 bg-surface2 border border-line">
            <Search className="w-4 h-4 text-[#2F6BB3] shrink-0" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="فلترة بكلمة محددة (مثال: 5G أو 256GB أو Pro)..." className="flex-1 bg-transparent border-0 text-xs font-bold focus:outline-none" />
            {searchQ && <button type="button" onClick={() => setSearchQ('')}><X className="w-3.5 h-3.5 text-muted" /></button>}
          </div>
          <div className="flex flex-wrap gap-1.5 items-center">
            {PRIOS.map(([v, l]) => (
              <button key={v} type="button" onClick={() => setPrio(v)} className={`px-2.5 py-1.5 rounded-full text-[11px] font-black transition ${prio === v ? 'bg-amber-500 text-white' : 'bg-surface2 text-fg border border-line'}`}>{l}</button>
            ))}
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
          {brands.map(b => (
            <button key={b} type="button" onClick={() => setBrand(b)} className={`px-3 py-1 rounded-full text-xs font-black shrink-0 border transition ${brand === b ? 'bg-[#1E4E8C] text-white border-[#1E4E8C]' : 'bg-surface2 text-fg border-line'}`}>
              {b === 'ALL' ? 'كل الماركات' : b}
            </button>
          ))}
        </div>
      </div>

      {/* Live Market Results */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-black text-fg flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            ترشيحات السوق المصري الحي تحت {formatMoney(budget)} ({sortedLive.length})
          </h3>
          <button type="button" onClick={loadMarket} disabled={loading} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface2 border border-line text-[11px] font-black text-fg">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> تحديث الأسعار
          </button>
        </div>

        {loading && sortedLive.length === 0 ? (
          <div className="bg-surface border border-line rounded-3xl p-10 text-center space-y-2">
            <RefreshCw className="w-7 h-7 text-amber-500 animate-spin mx-auto" />
            <div className="text-xs font-black text-muted">كرومبو بيفلتر لك أفضل الموبايلات المتاحة في السوق المصري الآن...</div>
          </div>
        ) : sortedLive.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {sortedLive.slice(0, 24).map((it, idx) => (
              <div key={it.id} className="relative bg-surface border border-line rounded-3xl overflow-hidden flex flex-col p-3.5 gap-2 hover:border-amber-500 transition">
                {idx === 0 && (
                  <span className="absolute top-2 start-2 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black shadow"><Star className="w-3 h-3" /> ترشيح كرومبو</span>
                )}
                <div className="aspect-[4/3] rounded-2xl bg-white dark:bg-[#0D1528] flex items-center justify-center overflow-hidden p-2">
                  {it.image ? <img src={it.image} alt={it.name} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = "none"; }} className="max-h-full max-w-full object-contain" /> : <Smartphone className="w-10 h-10 text-muted" />}
                </div>
                <div className="text-xs font-black text-fg line-clamp-2 leading-snug">{it.name}</div>
                <div className="mt-auto space-y-1.5 pt-1 border-t border-line/60">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-base font-black text-[#1E4E8C] dark:text-[#7FB0E8]">{formatMoney(it.price)}</span>
                    {it.trend === 'down' && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black"><TrendingDown className="w-3 h-3" /> نزل {it.pct ? `${it.pct}%` : ''}</span>}
                    {it.trend === 'up' && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-black"><TrendingUp className="w-3 h-3" /> طلع {it.pct ? `${it.pct}%` : ''}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Curated Local Guide Recommendations */}
      {localInBudget.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-black text-fg">أفضل ترشيحات دليل كرومبو المفصّل تحت {formatMoney(budget)}</h3>
            {localInBudget.length >= 2 && onCompareIds && (
              <button type="button" onClick={() => onCompareIds(localInBudget.slice(0, 3).map(p => p.id))} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-600 text-white text-xs font-black">
                <Scale className="w-3.5 h-3.5" /> قارن أفضل 3 ترشيحات
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {localInBudget.slice(0, 3).map((p, i) => (
              <div key={p.id} className="relative">
                {i === 0 && <span className="absolute -top-2 start-3 z-10 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black shadow"><Star className="w-3 h-3" /> الأعلى قيمة</span>}
                {renderLocalPhoneCard(p)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== 2. LIVE STOCK-STYLE PRICE RADAR ("رادار الأسعار") =====================
export function KaramboLiveRadarView({
  cfg,
  localPhones = [],
  storeDeals = [],
  formatMoney,
  onOpenPhone,
  onSelectStorePart,
  renderLocalPhoneCard
}) {
  const mCfg = (cfg && cfg.marketCfg) || {};
  const [tab, setTab] = useState('all'); // 'all' | 'down' | 'up' | 'store'
  const [radarItems, setRadarItems] = useState([]);
  const [loading, setLoading] = useState(mCfg.enableLiveRadar !== false);

  const loadRadar = async () => {
    if (mCfg.enableLiveRadar === false) { setLoading(false); return; }
    setLoading(true);
    const r = await fetchLiveRadar();
    setLoading(false);
    if (r.ok && Array.isArray(r.items)) setRadarItems(r.items);
  };

  useEffect(() => { loadRadar(); }, [mCfg.enableLiveRadar]);

  // Also merge local priceHistory movements
  const localMoves = localPhones.map(p => {
    const h = p.priceHistory || [];
    if (h.length < 2) return null;
    const last = h[h.length - 1], prev = h[h.length - 2];
    const diff = last.price - prev.price;
    if (diff === 0) return null;
    const pct = prev.price > 0 ? Math.round((Math.abs(diff) / prev.price) * 100) : 0;
    return {
      id: p.id, name: p.name, price: p.price, oldPrice: prev.price, diff, pct,
      trend: diff < 0 ? 'down' : 'up', image: (p.images && p.images[0]) || '', localPhoneId: p.id
    };
  }).filter(Boolean);

  const combined = [...radarItems, ...localMoves];
  const drops = combined.filter(x => x.trend === 'down');
  const rises = combined.filter(x => x.trend === 'up');
  const visible = tab === 'down' ? drops : tab === 'up' ? rises : combined;

  return (
    <div className="space-y-5">
      {/* Stock Ticker KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-surface border border-line rounded-2xl p-3 text-center">
          <div className="text-[11px] font-bold text-muted">موبايلات مرصودة حياً</div>
          <div className="text-xl font-black text-fg">{combined.length}</div>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3 text-center">
          <div className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1"><TrendingDown className="w-3.5 h-3.5" /> سهم نازل (انخفاض)</div>
          <div className="text-xl font-black text-emerald-600">{drops.length}</div>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-3 text-center">
          <div className="text-[11px] font-black text-rose-700 dark:text-rose-300 flex items-center justify-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> سهم طالع (ارتفاع)</div>
          <div className="text-xl font-black text-rose-600">{rises.length}</div>
        </div>
        <div className="bg-surface border border-line rounded-2xl p-3 text-center">
          <div className="text-[11px] font-bold text-muted">تخفيضات المتجر</div>
          <div className="text-xl font-black text-[#1E4E8C]">{storeDeals.length}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[['all', `الكل (${combined.length})`], ['down', `↘ اللي سعره نزل (${drops.length})`], ['up', `↗ اللي سعره طلع (${rises.length})`], ['store', `تخفيضات المتجر (${storeDeals.length})`]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`px-3.5 py-1.5 rounded-full text-xs font-black border transition ${tab === k ? 'bg-rose-600 text-white border-rose-600 shadow' : 'bg-surface border-line text-fg'}`}>{l}</button>
        ))}
        <button type="button" onClick={loadRadar} disabled={loading} className="ms-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface2 border border-line text-[11px] font-black text-fg">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> تحديث البورصة
        </button>
      </div>

      {tab !== 'store' && (
        <div className="space-y-2.5">
          <h3 className="font-black text-fg">بورصة أسعار الموبايلات اليوم</h3>
          {loading && visible.length === 0 ? (
            <div className="bg-surface border border-line rounded-3xl p-10 text-center space-y-2">
              <RefreshCw className="w-7 h-7 text-rose-500 animate-spin mx-auto" />
              <div className="text-xs font-black text-muted">جاري رصد حركة أسعار السوق المصري الآن...</div>
            </div>
          ) : visible.length === 0 ? (
            <div className="bg-surface border border-line rounded-3xl p-6 text-center text-muted text-sm font-bold">لا توجد حركات أسعار في هذا التصنيف حالياً</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2.5">
              {visible.slice(0, 96).map(item => {
                const isDown = item.trend === 'down';
                const isUp = item.trend === 'up';
                return (
                  <div
                    key={item.id}
                    onClick={() => item.localPhoneId && onOpenPhone && onOpenPhone(item.localPhoneId)}
                    className={`relative aspect-square bg-surface border border-line rounded-xl p-2.5 flex flex-col transition ${item.localPhoneId ? 'cursor-pointer hover:border-slate-400' : ''}`}
                  >
                    <span className={`absolute top-2 end-2 z-10 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-black ${isDown ? 'bg-emerald-600 text-white' : isUp ? 'bg-rose-600 text-white' : 'bg-surface2 text-muted border border-line'}`}>
                      {isDown ? <TrendingDown className="w-3 h-3" /> : isUp ? <TrendingUp className="w-3 h-3" /> : null}
                      {isDown ? `-${item.pct > 0 ? item.pct + '%' : (item.diff ? formatMoney(Math.abs(item.diff)) : '')}` : isUp ? `+${item.pct > 0 ? item.pct + '%' : (item.diff ? formatMoney(Math.abs(item.diff)) : '')}` : 'مستقر'}
                    </span>
                    <div className="flex-1 min-h-0 rounded-lg bg-white dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                      {item.image ? <img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = "none"; }} className="max-h-full max-w-full object-contain p-1" /> : <Smartphone className="w-8 h-8 text-muted" />}
                    </div>
                    <div className="pt-1.5 space-y-0.5">
                      <div className="text-[11px] font-black text-fg leading-tight line-clamp-2 min-h-[1.75rem]">{item.name}</div>
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-sm font-black text-fg">{formatMoney(item.price)}</span>
                        {item.oldPrice && item.oldPrice !== item.price && <span className="text-[10px] font-bold text-muted line-through">{formatMoney(item.oldPrice)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {(tab === 'all' || tab === 'store') && storeDeals.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="font-black text-fg">تخفيضات شغالة في متجرنا دلوقتي</h3>
          <div className="grid sm:grid-cols-2 gap-2.5">
            {storeDeals.map(({ p, price, oldPrice }, i) => (
              <button key={p.id || i} type="button" onClick={() => onSelectStorePart && onSelectStorePart(p)} className="flex items-center gap-3 bg-surface border border-line rounded-2xl p-3 text-start hover:border-rose-400 transition">
                <span className="flex-1 min-w-0"><span className="block font-black text-fg truncate text-sm">{p.name}</span><span className="text-[11px] font-bold text-muted line-through">{formatMoney(oldPrice)}</span></span>
                <span className="font-black text-rose-600">{formatMoney(price)}</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black">وفّر {formatMoney(oldPrice - price)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== 3. SMART GULF VS EGYPT CALCULATOR ("من الخليج ولا مصر؟") =====================
export function KaramboGulfView({
  cfg,
  localPhones = [],
  initialPhone = null,
  formatMoney,
  showToast,
  onOpenSourcing
}) {
  const gCfg = (cfg && cfg.gulfCfg) || {};
  const FX_MAP = gCfg.fxRates || { AED: 13.05, SAR: 12.7, KWD: 156, QAR: 13.15, OMR: 123, BHD: 127 };
  const CUR_LABELS = { AED: 'درهم إماراتي (AED)', SAR: 'ريال سعودي (SAR)', KWD: 'دينار كويتي (KWD)', QAR: 'ريال قطري (QAR)', OMR: 'ريال عماني (OMR)', BHD: 'دينار بحريني (BHD)' };

  const [selectedPhone, setSelectedPhone] = useState(initialPhone);
  const [cur, setCur] = useState('AED');
  const [gulfPrice, setGulfPrice] = useState('');
  const [gulfRegionNote, setGulfRegionNote] = useState('');
  const [egyptPrice, setEgyptPrice] = useState(initialPhone && initialPhone.price ? String(initialPhone.price) : '');
  const [egyptNote, setEgyptNote] = useState('');
  const [fx, setFx] = useState(String(FX_MAP.AED || 13.05));
  const [taxPct, setTaxPct] = useState(String(gCfg.defaultTaxPct ?? 38.5));
  const [customsBaseEgp, setCustomsBaseEgp] = useState('');
  const [shipping, setShipping] = useState(String(gCfg.defaultShippingEgp || 0));
  const [fetchingPrices, setFetchingPrices] = useState(false);
  const [fetchingFx, setFetchingFx] = useState(false);

  const handleSelectPhone = async (dev) => {
    setSelectedPhone(dev);
    setGulfRegionNote('');
    setEgyptNote('');
    if (gCfg.autoFetchPrices === false) return;

    setFetchingPrices(true);
    const res = await fetchLiveGulfAndEgyptPrices(dev.name);
    setFetchingPrices(false);

    if (res && res.gulf && res.gulf.found && res.gulf.price > 0) {
      const detectedCur = res.gulf.currency || 'AED';
      setCur(detectedCur);
      setGulfPrice(String(res.gulf.price));
      setFx(String(FX_MAP[detectedCur] || 13));
      setGulfRegionNote(`تم جلب السعر تلقائياً من سوق ${res.gulf.region || 'الخليج'} (${detectedCur})`);
    } else {
      setGulfPrice('0');
      setGulfRegionNote('غير متوفر بسعر تلقائي في الخليج — يمكنك كتابة السعر يدوياً');
    }

    if (res && res.egypt && res.egypt.found && res.egypt.price > 0) {
      setEgyptPrice(String(res.egypt.price));
      setEgyptNote('تم جلب السعر الحالي في مصر تلقائياً');
    } else if (dev.price > 0) {
      setEgyptPrice(String(dev.price));
      setEgyptNote('سعر استرشادي من دليل المتجر');
    } else {
      setEgyptPrice('0');
      setEgyptNote('غير متوفر بسعر تلقائي في مصر — يمكنك كتابة السعر يدوياً');
    }
  };

  const handleCurrencyChange = (nextCur) => {
    const oldRate = parseFloat(fx) || FX_MAP[cur] || 1;
    const newRate = FX_MAP[nextCur] || 1;
    const curVal = parseFloat(gulfPrice) || 0;
    // Dynamically convert existing Gulf price to the new currency using exchange rate ratio!
    if (curVal > 0 && oldRate > 0 && newRate > 0) {
      const converted = Math.round((curVal * oldRate) / newRate);
      setGulfPrice(String(converted));
    }
    setCur(nextCur);
    setFx(String(newRate));
  };

  const fetchLiveFx = async () => {
    setFetchingFx(true);
    try {
      const r = await fetch(`/api/ai-sourcing?action=exchange-rate&base=${encodeURIComponent(cur)}&target=EGP`);
      const j = await r.json();
      if (j && j.ok && j.rate) {
        setFx(String(Number(j.rate).toFixed(2)));
        showToast && showToast(`تم تحديث سعر صرف ${cur} الحي: ${Number(j.rate).toFixed(2)} ج.م`, 'success');
        setFetchingFx(false);
        return;
      }
    } catch {}
    setFetchingFx(false);
    showToast && showToast('تعذر جلب الصرف الحي حالياً — يمكنك تعديل سعر الصرف يدوياً.', 'info');
  };

  const gpNum = parseFloat(gulfPrice) || 0;
  const fxNum = parseFloat(fx) || 0;
  const egNum = parseFloat(egyptPrice) || 0;
  const taxNum = parseFloat(taxPct) || 0;
  const shipNum = parseFloat(shipping) || 0;
  const baseEgp = gpNum * fxNum;
  const taxValuationBase = (parseFloat(customsBaseEgp) || 0) > 0 ? parseFloat(customsBaseEgp) : baseEgp;
  const taxEgp = taxValuationBase * (taxNum / 100);
  const exemptTotal = baseEgp + shipNum;
  const taxedTotal = baseEgp + taxEgp + shipNum;
  const diffTaxed = egNum - taxedTotal;
  const diffExempt = egNum - exemptTotal;

  return (
    <div className="max-w-[860px] mx-auto space-y-4">
      {/* Prominent 38.5% Customs Warning Banner */}
      <div className="rounded-2xl bg-amber-500/12 border border-amber-500/40 p-3.5 flex items-start gap-2.5 text-xs font-bold text-amber-900 dark:text-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          {gCfg.customsWarningText || 'تنبيه هام: توجد ضريبة جمركية/اتصالات بحوالي 38.5% تُحسب على القيمة التقديرية التي تحددها الجمارك المصرية (وقد تختلف عن سعر الشراء الفعلي).'}
        </div>
      </div>

      <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
        <GsmarenaPhonePicker
          label="اختار الموبايل (بيجيب سعر الخليج تلقائياً من الإمارات ثم السعودية، وسعر مصر تلقائياً)"
          value={selectedPhone}
          localPhones={localPhones}
          fetchFullSpecs={false}
          gsmarenaLive={cfg.compareCfg.gsmarenaLive !== false}
          formatMoney={formatMoney}
          showToast={showToast}
          placeholder="ابحث عن أي موبايل بالعربي أو الإنجليزي..."
          onSelect={handleSelectPhone}
          onClear={() => { setSelectedPhone(null); setGulfPrice(''); setEgyptPrice(''); setGulfRegionNote(''); setEgyptNote(''); }}
        />

        {fetchingPrices && (
          <div className="flex items-center gap-2 text-xs font-black text-slate-600 dark:text-slate-400">
            <RefreshCw className="w-4 h-4 animate-spin" /> جاري البحث التلقائي عن أسعار الخليج ومصر...
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-black text-muted block mb-1.5">سعره في الخليج + اختيار عملة البلد</label>
            <div className="flex gap-2">
              <input type="number" min="0" value={gulfPrice} onChange={e => setGulfPrice(e.target.value)} placeholder="0" className="flex-1 rounded-2xl px-3 py-2.5 bg-surface2 border border-line text-sm font-black text-fg min-w-0" />
              <select value={cur} onChange={e => handleCurrencyChange(e.target.value)} className="rounded-2xl px-2.5 py-2.5 bg-surface2 border border-line text-xs font-black text-fg">
                {Object.keys(FX_MAP).map(c => <option key={c} value={c}>{CUR_LABELS[c] || c}</option>)}
              </select>
            </div>
            {gulfRegionNote && <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-1">{gulfRegionNote}</div>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-muted">سعر الصرف بالجنيه ({cur} → ج.م)</label>
              {gCfg.enableLiveFx !== false && (
                <button type="button" disabled={fetchingFx} onClick={fetchLiveFx} className="inline-flex items-center gap-1 text-[10px] font-black text-slate-600 dark:text-slate-400 hover:underline">
                  <RefreshCw className={`w-3 h-3 ${fetchingFx ? 'animate-spin' : ''}`} /> تحديث الصرف الحي
                </button>
              )}
            </div>
            <input type="number" step="0.01" min="0" value={fx} onChange={e => setFx(e.target.value)} className="w-full rounded-2xl px-3 py-2.5 bg-surface2 border border-line text-sm font-black text-fg" />
          </div>

          <div>
            <label className="text-xs font-black text-muted block mb-1.5">نسبة الضريبة الجمركية %</label>
            <input type="number" step="0.1" min="0" value={taxPct} onChange={e => setTaxPct(e.target.value)} className="w-full rounded-2xl px-3 py-2.5 bg-surface2 border border-line text-sm font-black text-fg" />
          </div>

          <div>
            <label className="text-xs font-black text-muted block mb-1.5">التقييم الجمركي بالجنيه (اختياري — لو مختلف عن سعر الشراء)</label>
            <input type="number" min="0" value={customsBaseEgp} onChange={e => setCustomsBaseEgp(e.target.value)} placeholder={baseEgp > 0 ? String(Math.round(baseEgp)) : 'يحسب على سعر الشراء تلقائياً'} className="w-full rounded-2xl px-3 py-2.5 bg-surface2 border border-line text-sm font-black text-fg" />
          </div>

          <div>
            <label className="text-xs font-black text-muted block mb-1.5">تكلفة الشحن / العمولة (جنيه)</label>
            <input type="number" min="0" value={shipping} onChange={e => setShipping(e.target.value)} placeholder="0" className="w-full rounded-2xl px-3 py-2.5 bg-surface2 border border-line text-sm font-black text-fg" />
          </div>

          <div>
            <label className="text-xs font-black text-muted block mb-1.5">سعره في مصر (جنيه)</label>
            <input type="number" min="0" value={egyptPrice} onChange={e => setEgyptPrice(e.target.value)} placeholder="0" className="w-full rounded-2xl px-3 py-2.5 bg-surface2 border border-line text-sm font-black text-fg" />
            {egyptNote && <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">{egyptNote}</div>}
          </div>
        </div>

        {gpNum > 0 && (
          <div className="space-y-3 pt-2">
            <div className="grid sm:grid-cols-3 gap-2.5">
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-center space-y-1">
                <div className="text-[11px] font-black text-emerald-700 dark:text-emerald-300">1. هاتف شخصي معفي</div>
                <div className="text-xl font-black text-fg">{formatMoney(Math.round(exemptTotal))}</div>
                <div className="text-[10px] font-bold text-muted">ثمن الجهاز بالمصري + الشحن</div>
                {egNum > 0 && <div className={`text-[11px] font-black ${diffExempt > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{diffExempt > 0 ? `أوفر بـ ${formatMoney(Math.round(diffExempt))}` : `أغلى بـ ${formatMoney(Math.round(-diffExempt))}`}</div>}
              </div>

              <div className="rounded-2xl bg-slate-500/10 border border-slate-500/30 p-3.5 text-center space-y-1">
                <div className="text-[11px] font-black text-slate-700 dark:text-slate-300">2. بالضريبة الجمركية ({taxNum}%)</div>
                <div className="text-xl font-black text-fg">{formatMoney(Math.round(taxedTotal))}</div>
                <div className="text-[10px] font-bold text-muted">الضريبة وحدها: {formatMoney(Math.round(taxEgp))}</div>
                {egNum > 0 && <div className={`text-[11px] font-black ${diffTaxed > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{diffTaxed > 0 ? `أوفر بـ ${formatMoney(Math.round(diffTaxed))}` : `أغلى بـ ${formatMoney(Math.round(-diffTaxed))}`}</div>}
              </div>

              <div className="rounded-2xl bg-slate-500/10 border border-slate-500/30 p-3.5 text-center space-y-1">
                <div className="text-[11px] font-black text-slate-700 dark:text-slate-300">3. الشراء من مصر (بضمان)</div>
                <div className="text-xl font-black text-fg">{egNum > 0 ? formatMoney(Math.round(egNum)) : '—'}</div>
                <div className="text-[10px] font-bold text-muted">بفاتورة وضمان محلي معتمد</div>
              </div>
            </div>

            {egNum > 0 && (
              <div className="rounded-2xl bg-surface2 border border-line p-3.5 text-center space-y-2">
                <div className={`text-sm font-black ${diffTaxed > 2000 ? 'text-emerald-600' : 'text-[#1E4E8C]'}`}>
                  {diffTaxed > 2000
                    ? `حتى بعد الضريبة الجمركية، الخليج أوفر بـ ${formatMoney(Math.round(diffTaxed))} — بس خد بالك من الضمان المحلي.`
                    : diffTaxed < 0
                      ? `بعد الضريبة، الشراء من مصر أوفر بـ ${formatMoney(Math.round(-diffTaxed))} ومعاك ضمان محلي!`
                      : 'الفرق بسيط جداً — الشراء من مصر بضمان وفاتورة أريح وأضمن.'}
                </div>
                {onOpenSourcing && (
                  <button type="button" onClick={() => onOpenSourcing(selectedPhone ? selectedPhone.name : 'طلب استيراد موبايل', `سعر الخليج: ${gpNum} ${cur} — التكلفة بالضريبة: ${formatMoney(Math.round(taxedTotal))}`)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-600 hover:bg-slate-500 text-white text-xs font-black transition">
                    <PhoneCall className="w-4 h-4" /> عايز تستورده؟ اطلب تسعير استيراد من ELZOGHBI
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== 4. TRADE-IN ESTIMATOR WITH AUTO EGYPT PRICE ("قيّم موبايلك القديم") =====================
export function KaramboTradeInView({
  cfg,
  localPhones = [],
  formatMoney,
  showToast,
  whatsappNumber = ''
}) {
  const tCfg = (cfg && cfg.tradeInCfg) || {};
  const mults = tCfg.condMult || { mint: 0.78, good: 0.68, fair: 0.56, cracked: 0.38 };

  const [oldPhone, setOldPhone] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [priceNote, setPriceNote] = useState('');
  const [loadingOldPrice, setLoadingOldPrice] = useState(false);

  const [targetPhone, setTargetPhone] = useState(null);
  const [targetPrice, setTargetPrice] = useState(0);
  const [loadingTargetPrice, setLoadingTargetPrice] = useState(false);

  const [cond, setCond] = useState('good');
  const [hasBox, setHasBox] = useState(true);
  const [batOk, setBatOk] = useState(true);
  const [ageYrs, setAgeYrs] = useState(1);

  const handleSelectOldPhone = async (dev) => {
    setOldPhone(dev);
    setPriceNote('');
    if (tCfg.autoFetchEgyptPrice === false) {
      setNewPrice(dev.price ? String(dev.price) : '');
      return;
    }
    setLoadingOldPrice(true);
    const res = await fetchLiveEgyptPrice(dev.name);
    setLoadingOldPrice(false);
    if (res && res.found && res.price > 0) {
      setNewPrice(String(res.price));
      setPriceNote('تم جلب سعره جديد في مصر تلقائياً');
    } else if (dev.price > 0) {
      setNewPrice(String(dev.price));
      setPriceNote('سعر استرشادي من الدليل');
    } else {
      setNewPrice('');
      setPriceNote('غير متوفر بسعر تلقائي في مصر حالياً — اكتب سعره جديد يدوياً');
    }
  };

  const handleSelectTargetPhone = async (dev) => {
    setTargetPhone(dev);
    setLoadingTargetPrice(true);
    const res = await fetchLiveEgyptPrice(dev.name);
    setLoadingTargetPrice(false);
    if (res && res.found && res.price > 0) setTargetPrice(res.price);
    else setTargetPrice(dev.price || 0);
  };

  const baseNewPrice = parseFloat(newPrice) || 0;
  let est = baseNewPrice * (mults[cond] || 0.65);
  if (!hasBox) est *= (1 - (Number(tCfg.noBoxPenaltyPct || 5) / 100));
  if (!batOk) est *= (1 - (Number(tCfg.lowBatteryPenaltyPct || 7) / 100));
  if (ageYrs > 1) est *= Math.max(0.65, 1 - ((ageYrs - 1) * (Number(tCfg.agePenaltyPerYearPct || 8) / 100)));
  est = Math.round(est / 50) * 50;
  const lowEst = Math.round(est * 0.93 / 50) * 50;
  const highEst = Math.round(est * 1.07 / 50) * 50;
  const upgradeDiff = targetPhone && targetPrice > 0 && est > 0 ? Math.max(0, targetPrice - est) : null;

  const sendTradeInWA = () => {
    const oldName = oldPhone ? oldPhone.name : 'موبايلي الحالي';
    const condLbl = { mint: 'ممتاز كالزيرو', good: 'جيد جداً', fair: 'خدوش ظاهرة', cracked: 'شاشة مكسورة' }[cond];
    const txt = `مرحباً 👋 عرض تقييم/استبدال من كرومبو:\n• جهازي: ${oldName}\n• الحالة: ${condLbl} | العلبة: ${hasBox ? 'موجودة' : 'لا'} | البطارية: ${batOk ? '80% فأكثر' : 'أقل من 80%'}\n• التقييم الاسترشادي: ${formatMoney(lowEst)} – ${formatMoney(highEst)}${targetPhone ? `\n• الجهاز المطلوب للاستبدال: ${targetPhone.name}${upgradeDiff !== null ? ` (فرق تقريبي: ${formatMoney(upgradeDiff)})` : ''}` : ''}`;
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="max-w-[840px] mx-auto space-y-4">
      <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <GsmarenaPhonePicker
              label="اختار موبايلك الحالي (بيجيب سعره جديد في مصر تلقائياً)"
              value={oldPhone}
              localPhones={localPhones}
              fetchFullSpecs={false}
              gsmarenaLive={cfg.compareCfg.gsmarenaLive !== false}
              formatMoney={formatMoney}
              showToast={showToast}
              compact={true}
              placeholder="ابحث عن موبايلك الحالي..."
              onSelect={handleSelectOldPhone}
              onClear={() => { setOldPhone(null); setNewPrice(''); setPriceNote(''); }}
            />
          </div>
          <div>
            <label className="text-xs font-black text-muted block mb-1.5">
              سعره جديد حالياً في مصر (جنيه) {loadingOldPrice ? '— جاري الجلب...' : ''}
            </label>
            <input type="number" min="0" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="اكتب السعر لو مش ظاهر تلقائياً" className="w-full rounded-2xl px-3 py-2.5 bg-surface2 border border-line text-sm font-black text-fg" />
            {priceNote && <div className="text-[10px] font-bold text-orange-600 dark:text-orange-400 mt-1">{priceNote}</div>}
          </div>
        </div>

        <div>
          <div className="text-xs font-black text-muted mb-2">حالة الجهاز الخارجية والشاشة</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[['mint', 'ممتاز كالزيرو'], ['good', 'جيد جداً'], ['fair', 'خدوش ظاهرة'], ['cracked', 'شاشة مكسورة']].map(([k, l]) => (
              <button key={k} type="button" onClick={() => setCond(k)} className={`py-2.5 px-2 rounded-2xl text-xs font-black border transition ${cond === k ? 'bg-orange-500 text-white border-orange-500 shadow' : 'bg-surface2 border-line text-fg'}`}>{l}</button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <div className="text-xs font-black text-muted mb-1.5">العلبة والشاحن الأصلي</div>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setHasBox(true)} className={`flex-1 py-2 rounded-xl text-xs font-black border ${hasBox ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-surface2 border-line text-fg'}`}>موجودين</button>
              <button type="button" onClick={() => setHasBox(false)} className={`flex-1 py-2 rounded-xl text-xs font-black border ${!hasBox ? 'bg-rose-600 text-white border-rose-600' : 'bg-surface2 border-line text-fg'}`}>بدون علبة</button>
            </div>
          </div>
          <div>
            <div className="text-xs font-black text-muted mb-1.5">صحة البطارية</div>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setBatOk(true)} className={`flex-1 py-2 rounded-xl text-xs font-black border ${batOk ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-surface2 border-line text-fg'}`}>80% فأكثر</button>
              <button type="button" onClick={() => setBatOk(false)} className={`flex-1 py-2 rounded-xl text-xs font-black border ${!batOk ? 'bg-amber-500 text-white border-amber-500' : 'bg-surface2 border-line text-fg'}`}>أقل من 80%</button>
            </div>
          </div>
          <div>
            <div className="text-xs font-black text-muted mb-1.5">مدة الاستخدام</div>
            <select value={ageYrs} onChange={e => setAgeYrs(Number(e.target.value))} className="w-full py-2 px-3 rounded-xl bg-surface2 border border-line text-xs font-black text-fg">
              <option value={0.5}>أقل من 6 شهور</option>
              <option value={1}>حوالي سنة</option>
              <option value={2}>سنتين</option>
              <option value={3}>3 سنين فأكثر</option>
            </select>
          </div>
        </div>

        <GsmarenaPhonePicker
          label={`عايز تبدّل بموبايل تاني؟ (اختياري — يحسبلك الفرق فوراً) ${loadingTargetPrice ? '— جاري جلب سعره...' : ''}`}
          value={targetPhone}
          localPhones={localPhones}
          fetchFullSpecs={false}
          gsmarenaLive={cfg.compareCfg.gsmarenaLive !== false}
          formatMoney={formatMoney}
          showToast={showToast}
          compact={true}
          placeholder="ابحث عن الموبايل الجديد المطلوب..."
          onSelect={handleSelectTargetPhone}
          onClear={() => { setTargetPhone(null); setTargetPrice(0); }}
        />

        {baseNewPrice > 0 && (
          <div className="rounded-2xl bg-orange-500/10 border border-orange-500/30 p-4 text-center space-y-2">
            <div className="text-xs font-black text-muted">السعر العادل التقريبي لبيع موبايلك في السوق</div>
            <div className="text-2xl sm:text-3xl font-black text-orange-600 dark:text-orange-400">{formatMoney(lowEst)} — {formatMoney(highEst)}</div>
            {upgradeDiff !== null && targetPhone && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-line text-xs font-black text-fg">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>للترقية إلى {targetPhone.name} هتزود تقريباً: <strong className="text-[#1E4E8C]">{formatMoney(upgradeDiff)}</strong></span>
              </div>
            )}
            <div className="pt-1">
              <button type="button" onClick={sendTradeInWA} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition">
                <MessageSquare className="w-4 h-4" /> ابعت التقييم على واتساب للاستبدال أو التسعير الفعلي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
