import React, { useState, useEffect, useRef } from 'react';
import { Search, Smartphone, Globe, RefreshCw, X, AlertTriangle } from 'lucide-react';
import {
  searchGsmarenaPhones,
  fetchGsmarenaDevice,
  fetchGsmarenaPopular
} from '../services/gsmarenaClient.js';

/**
 * Unified Live GSMArena Phone Picker used across ALL Karambo services:
 * Compare, Compatibility Checker, Installment Calculator, Gulf Calculator, Trade-In, and Guide.
 *
 * - Always queries GSMArena live (via /api/gsmarena, works in both `npm run dev` and Vercel)
 * - Loads live GSMArena popular/latest phones on focus (never shows only local 30 phones!)
 * - Supports Arabic & English queries with automatic translation
 * - Optional full-specs fetch on selection (for Compare, Compatibility, Phone Detail)
 */
export default function GsmarenaPhonePicker({
  value = null, // selected phone object { id, slug, name, images, img, price, source, ... }
  onSelect,
  onClear,
  localPhones = [],
  placeholder = 'ابحث عن أي موبايل في العالم (عربي أو إنجليزي)...',
  label = '',
  fetchFullSpecs = false,
  gsmarenaLive = true,
  formatMoney = (v) => `${Number(v || 0).toLocaleString('en-US')} ج.م`,
  showToast,
  compact = false
}) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingSpec, setFetchingSpec] = useState(false);
  const [results, setResults] = useState([]);
  const [popular, setPopular] = useState([]);
  const [sourceFilter, setSourceFilter] = useState('all'); // 'all' | 'gsmarena' | 'local'
  const [statusNote, setStatusNote] = useState('');
  const [isLive, setIsLive] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Load GSMArena popular devices once when user opens picker
  const ensurePopular = async () => {
    if (!gsmarenaLive || popular.length > 0) return;
    setLoading(true);
    const r = await fetchGsmarenaPopular();
    setLoading(false);
    if (r.ok && r.results && r.results.length > 0) {
      setPopular(r.results.map(x => ({ ...x, source: 'gsmarena' })));
      setIsLive(true);
      setStatusNote('');
    } else {
      setIsLive(false);
      setStatusNote('يتم عرض دليل المتجر المحلي حالياً.');
    }
  };

  const runSearch = (val) => {
    setQuery(val);
    setOpen(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!val || val.trim().length < 2) {
      setResults([]);
      ensurePopular();
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const r = await searchGsmarenaPhones(val.trim(), gsmarenaLive ? localPhones : localPhones);
      setLoading(false);
      setIsLive(!!r.live && (r.gsmCount || 0) > 0);
      if (r.live && (r.gsmCount || 0) > 0) {
        setStatusNote(r.translatedQuery && r.translatedQuery !== val.trim() ? `نتائج البحث العالمي لـ: ${r.translatedQuery}` : '');
      } else if (r.fallbackReason) {
        setStatusNote(r.error || 'يتم عرض نتائج دليل المتجر المحلي.');
      } else {
        setStatusNote('');
      }
      setResults(r.results || []);
    }, 300);
  };

  const handlePick = async (item) => {
    setOpen(false);
    setQuery('');

    // If local phone directly
    if (item.source === 'local' && item.localPhone) {
      onSelect && onSelect(item.localPhone);
      return;
    }

    // If GSMArena phone & we need full specs (Compare / Compatibility / Detail)
    if (fetchFullSpecs) {
      setFetchingSpec(true);
      const res = await fetchGsmarenaDevice(item.slug || item.gsmId);
      setFetchingSpec(false);
      if (res.ok && res.device) {
        const localMatch = (localPhones || []).find(lp =>
          lp.slug === res.device.slug ||
          (lp.name && res.device.name && lp.name.toLowerCase() === res.device.name.toLowerCase())
        );
        const enriched = localMatch
          ? { ...res.device, price: localMatch.price || 0, localId: localMatch.id }
          : res.device;
        onSelect && onSelect(enriched);
      } else {
        showToast && showToast(res.error || 'تعذر جلب مواصفات الجهاز حالياً', 'warning');
        // Still pass lightweight GSMArena item so user is never blocked
        onSelect && onSelect({
          id: item.id,
          gsmId: item.gsmId,
          slug: item.slug,
          name: item.name,
          brand: item.brand,
          brandSlug: String(item.brand || '').toLowerCase(),
          images: item.img ? [item.img] : [],
          price: item.price || 0,
          source: 'gsmarena'
        });
      }
      return;
    }

    // Lightweight selection (Installment / Gulf / Trade-In) — check if Egypt price exists locally
    const localMatch = (localPhones || []).find(lp =>
      lp.slug === item.slug ||
      (lp.name && item.name && lp.name.toLowerCase() === item.name.toLowerCase())
    );
    onSelect && onSelect({
      id: item.id,
      gsmId: item.gsmId,
      slug: item.slug,
      name: item.name,
      brand: item.brand,
      brandSlug: String(item.brand || '').toLowerCase(),
      images: item.img ? [item.img] : (localMatch && localMatch.images ? localMatch.images : []),
      price: localMatch ? (localMatch.price || 0) : (item.price || 0),
      localId: localMatch ? localMatch.id : null,
      source: 'gsmarena'
    });
  };

  // Build visible dropdown list (GSMArena ALWAYS first!)
  const localDefaults = (localPhones || []).slice(0, 8).map(p => ({
    id: p.id, slug: p.slug, name: p.name, brand: p.brand,
    img: (p.images && p.images[0]) || '', price: p.price || 0, source: 'local', localPhone: p
  }));

  const rawList = query.trim().length >= 2
    ? results
    : [...popular, ...localDefaults];

  const visibleList = rawList.filter(item => {
    if (sourceFilter === 'gsmarena') return item.source === 'gsmarena';
    if (sourceFilter === 'local') return item.source === 'local';
    return true;
  });

  const selectedImg = value ? ((value.images && value.images[0]) || value.img || '') : '';

  return (
    <div ref={wrapRef} className="relative space-y-1.5">
      {label && <label className="text-xs font-black text-muted block">{label}</label>}

      {fetchingSpec ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl px-3.5 py-2.5 bg-surface2 border border-violet-400 text-xs font-black text-violet-600 dark:text-violet-300">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>جاري جلب المواصفات الكاملة للجهاز...</span>
        </div>
      ) : value ? (
        <div className={`flex items-center gap-2.5 rounded-2xl border border-[#2563EB]/40 bg-surface2/80 ${compact ? 'p-2' : 'p-2.5'}`}>
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#0D1528] border border-line flex items-center justify-center overflow-hidden shrink-0">
            {selectedImg ? <img src={selectedImg} alt={value.name} referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" /> : <Smartphone className="w-5 h-5 text-muted" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-black text-fg truncate">{value.name}</span>
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black text-white ${value.source === 'gsmarena' ? 'bg-violet-600' : 'bg-sky-600'}`}>
                {value.source === 'gsmarena' ? 'كتالوج عالمي' : 'دليلنا'}
              </span>
            </div>
            <div className="text-[10px] font-bold text-muted">
              {value.price ? `سعر مصر الاسترشادي: ${formatMoney(value.price)}` : (value.priceGlobal || 'اختر جهاز آخر أو اكتب السعر يدوياً')}
            </div>
          </div>
          {onClear && (
            <button type="button" onClick={onClear} className="p-1.5 rounded-xl bg-surface hover:bg-rose-500 hover:text-white text-muted border border-line transition shrink-0" title="تغيير الموبايل">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl px-3 py-2 bg-surface2 border border-line focus-within:border-violet-500 transition">
          <Globe className="w-4 h-4 text-violet-500 shrink-0" />
          <input
            value={query}
            onFocus={() => { setOpen(true); if (query.trim().length < 2) ensurePopular(); }}
            onChange={e => runSearch(e.target.value)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-0 text-xs sm:text-sm font-bold text-fg focus:outline-none min-w-0 py-0.5"
          />
          {loading ? (
            <RefreshCw className="w-4 h-4 text-violet-500 animate-spin shrink-0" />
          ) : query ? (
            <button type="button" onClick={() => { setQuery(''); setResults([]); }} className="text-muted hover:text-fg"><X className="w-4 h-4" /></button>
          ) : (
            <Search className="w-4 h-4 text-muted shrink-0" />
          )}
        </div>
      )}

      {/* Live Dropdown */}
      {open && !value && (
        <div className="absolute start-0 end-0 top-full mt-1.5 z-40 bg-surface border border-line rounded-2xl shadow-2xl overflow-hidden">
          {/* Source filter tabs inside dropdown */}
          <div className="flex items-center justify-between gap-1 px-2.5 py-2 bg-surface2/80 border-b border-line">
            <div className="flex gap-1">
              {[['all', 'الكل'], ['gsmarena', 'الكتالوج العالمي'], ['local', 'دليلنا المحلي']].map(([k, lbl]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSourceFilter(k)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black transition ${sourceFilter === k ? 'bg-violet-600 text-white' : 'bg-surface text-muted hover:text-fg'}`}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <span className="text-[9px] font-black text-muted flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isLive ? 'متصل مباشر' : 'بحث'}
            </span>
          </div>

          {statusNote && (
            <div className="px-3 py-1.5 bg-amber-500/10 border-b border-line text-[10px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{statusNote}</span>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto p-1.5 space-y-1">
            {loading ? (
              <div className="p-5 text-center text-xs font-bold text-muted flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-violet-500" /> جاري البحث في قاعدة البيانات العالمية...
              </div>
            ) : visibleList.length === 0 ? (
              <div className="p-5 text-center text-xs font-bold text-muted">
                {query.trim().length < 2
                  ? 'اكتب اسم أي موبايل (مثل: iPhone 16 Pro Max أو سامسونج S25 أو Redmi Note 14)'
                  : 'مفيش نتائج مطابقة — جرّب اسم الموديل بالإنجليزي أو غيّر الفلتر'}
              </div>
            ) : (
              visibleList.map(item => (
                <button
                  key={`${item.source}_${item.slug || item.id}`}
                  type="button"
                  onClick={() => handlePick(item)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface2 text-start transition"
                >
                  <div className="w-9 h-9 rounded-lg bg-white border border-line flex items-center justify-center overflow-hidden shrink-0">
                    {item.img
                      ? <img src={item.img} alt="" loading="lazy" referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" />
                      : <Smartphone className="w-4 h-4 text-muted" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-fg truncate">{item.name}</div>
                    <div className="text-[10px] font-bold text-muted flex items-center gap-1.5">
                      <span className={item.source === 'gsmarena' ? 'text-violet-600 dark:text-violet-400 font-black' : 'text-sky-600 dark:text-sky-400'}>
                        {item.source === 'gsmarena' ? 'قاعدة البيانات العالمية' : 'دليل السوق المصري'}
                      </span>
                      {item.price ? <span>· {formatMoney(item.price)}</span> : null}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <button type="button" onClick={() => setOpen(false)} className="w-full py-1.5 text-center text-[10px] font-black text-muted hover:text-fg border-t border-line bg-surface2/50">
            إغلاق القائمة
          </button>
        </div>
      )}
    </div>
  );
}
