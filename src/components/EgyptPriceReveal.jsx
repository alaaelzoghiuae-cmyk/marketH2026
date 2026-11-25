import React, { useState } from 'react';
import { DollarSign, RefreshCw, Info } from 'lucide-react';
import { fetchLiveEgyptPrice } from '../services/karamboLiveClient.js';

// "اعرف السعر في مصر" — NO request is made until the visitor presses the button.
// Result is cached (localStorage, 6h) so repeated presses / other visitors' devices never refetch needlessly.
const TTL = 6 * 60 * 60 * 1000;
const KEY = 'elzoghbi_egp_v1_';
const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

const readCache = (name) => {
  try {
    const j = JSON.parse(window.localStorage.getItem(KEY + norm(name)) || 'null');
    return j && Date.now() - j.ts < TTL ? j : null;
  } catch (e) { return null; }
};
const writeCache = (name, v) => { try { window.localStorage.setItem(KEY + norm(name), JSON.stringify({ ...v, ts: Date.now() })); } catch (e) { /* quota */ } };

export default function EgyptPriceReveal({ name, curatedPrice = 0, curatedDate = '', formatMoney, unavailableLabel = 'غير متوفر في مصر حالياً', compact = false, children = null }) {
  const [st, setSt] = useState(() => readCache(name) ? { phase: 'done', ...readCache(name) } : { phase: 'idle' });

  const run = async (force) => {
    if (!force) { const c = readCache(name); if (c) { setSt({ phase: 'done', ...c }); return; } }
    setSt({ phase: 'loading' });
    let res = null;
    try { res = await fetchLiveEgyptPrice(name); } catch (e) { res = null; }
    const offers = Array.isArray(res && res.offers) ? res.offers.filter((o) => o && Number(o.price) > 0).slice(0, 3) : [];
    const live = res && res.found && Number(res.price) > 0 ? Number(res.price) : 0;
    const out = live
      ? { found: true, price: live, offers, source: (offers[0] && offers[0].store) || res.source || '', checkedAt: Date.now(), kind: 'live' }
      : (curatedPrice > 0 && curatedDate
        ? { found: true, price: curatedPrice, offers: [], source: 'مراجعة فريق كرومبو', checkedAt: Date.now(), kind: 'curated', date: curatedDate }
        : { found: false, checkedAt: Date.now() });
    if (res && res.ok !== false) writeCache(name, out); // never cache a failed request
    setSt({ phase: 'done', ...out, failed: !res || res.ok === false });
  };

  if (st.phase === 'idle') {
    return (
      <button type="button" onClick={(e) => { e.stopPropagation(); run(false); }}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 font-black transition ${compact ? 'px-2.5 py-1 text-[10px]' : 'px-4 py-2.5 text-xs w-full'}`}>
        <DollarSign className={compact ? 'w-3 h-3' : 'w-4 h-4'} /> اعرف السعر في مصر
      </button>
    );
  }
  if (st.phase === 'loading') {
    return <div className="text-[11px] font-bold text-muted flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin text-[#0066CC]" /> جاري مراجعة المتاجر المصرية...</div>;
  }
  if (!st.found) {
    return (
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-black text-rose-600 dark:text-rose-400">{unavailableLabel}</div>
        {st.failed && <button type="button" onClick={() => run(true)} className="block text-[10px] font-black text-[#0066CC] hover:underline">إعادة المحاولة</button>}
      </div>
    );
  }
  const when = st.kind === 'curated' ? `آخر مراجعة ${st.date}` : `تم الفحص ${new Date(st.checkedAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}`;
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-bold text-muted">السعر في مصر (استرشادي)</div>
      <div className={`${compact ? 'text-base' : 'text-xl'} font-black text-emerald-600 dark:text-emerald-400`}>{formatMoney ? formatMoney(st.price) : `${st.price} ج.م`}</div>
      <div className="text-[10px] font-bold text-muted">{st.source ? `المصدر: ${st.source} · ` : ''}{when}</div>
      {st.offers && st.offers.length > 1 && <div className="text-[10px] font-bold text-muted">أسعار أخرى: {st.offers.slice(1).map((o) => `${o.store} ${formatMoney ? formatMoney(o.price) : o.price}`).join(' · ')}</div>}
      {children}
      <div className="flex items-start gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300"><Info className="w-3 h-3 shrink-0 mt-0.5" /> السعر غير رسمي وقد يختلف من متجر لآخر.</div>
    </div>
  );
}
