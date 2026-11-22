import React, { useState, useMemo } from 'react';
import { DollarSign, Percent, AlertTriangle, Check, TrendingUp } from 'lucide-react';

/**
 * FEATURE 4 — AI SMART PRICING ENGINE
 * Real cost/price/profit/margin/markup analyzer + configurable rule simulator.
 * Never alters published prices without explicit review and confirmation.
 */
export default function SmartPricingEngine({
  parts = [],
  categories = [],
  normalizePartCategory,
  onApplyPricingMap,
  showToast
}) {
  const [catFilter, setCatFilter] = useState('ALL');
  const [onlyWeakMargin, setOnlyWeakMargin] = useState(false);
  const [ruleType, setRuleType] = useState('target_margin'); // 'target_margin' | 'markup_pct' | 'discount_pct'
  const [ruleValue, setRuleValue] = useState(25);
  const [roundStep, setRoundStep] = useState(5); // 1 | 5 | 10 | 25 | 50
  const [priceFloor, setPriceFloor] = useState(50);
  const [weakThreshold, setWeakThreshold] = useState(18);
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmApply, setConfirmApply] = useState(false);

  const roundPrice = (val, step) => {
    const s = Math.max(1, Number(step) || 1);
    return Math.ceil(val / s) * s;
  };

  const rows = useMemo(() => {
    return parts
      .filter(p => {
        const c = normalizePartCategory ? normalizePartCategory(p.category, p.name) : p.category;
        if (catFilter !== 'ALL' && c !== catFilter) return false;
        const cost = Number(p.costPrice || 0);
        const cur = Number(p.basePrice || 0);
        const curMargin = cur > 0 && cost > 0 ? ((cur - cost) / cur) * 100 : null;
        if (onlyWeakMargin && (curMargin === null || curMargin >= weakThreshold)) return false;
        return true;
      })
      .map(p => {
        const cost = Number(p.costPrice || 0);
        const cur = Number(p.basePrice || 0);
        const hasCost = cost > 0;
        const curProfit = hasCost ? cur - cost : null;
        const curMargin = hasCost && cur > 0 ? ((cur - cost) / cur) * 100 : null;
        const curMarkup = hasCost ? ((cur - cost) / cost) * 100 : null;

        // A rule value of 0 is a real value (0% markup/discount) — only a
        // missing/non-numeric value falls back to the default.
        const rv = ruleValue === '' || ruleValue === null || ruleValue === undefined || Number.isNaN(Number(ruleValue))
          ? null
          : Number(ruleValue);
        // No cost basis (margin/markup) or no current price => the rule has
        // nothing to compute from; never invent a price for such rows.
        const applicable = cur > 0 && (ruleType === 'discount_pct' || hasCost);

        let rawProposed = cur;
        if (ruleType === 'target_margin' && hasCost) {
          const m = Math.min(85, Math.max(0, rv ?? 25)) / 100;
          rawProposed = cost / (1 - m);
        } else if (ruleType === 'markup_pct' && hasCost) {
          const mk = Math.min(500, Math.max(0, rv ?? 25)) / 100;
          rawProposed = cost * (1 + mk);
        } else if (ruleType === 'discount_pct') {
          const d = Math.min(80, Math.max(0, rv ?? 10)) / 100;
          rawProposed = cur * (1 - d);
        }

        let proposed;
        if (!applicable) {
          proposed = cur;
        } else if (ruleType === 'discount_pct') {
          // A discount must never raise the price: round DOWN to the step,
          // skip the floor, and cap at the current price.
          const s2 = Math.max(1, Number(roundStep) || 1);
          proposed = Math.min(cur, Math.floor(rawProposed / s2) * s2);
        } else {
          proposed = Math.max(Number(priceFloor) || 0, roundPrice(rawProposed, roundStep));
        }
        const newProfit = hasCost ? proposed - cost : null;
        const newMargin = hasCost && proposed > 0 ? ((proposed - cost) / proposed) * 100 : null;
        const delta = proposed - cur;

        return {
          part: p,
          cost,
          hasCost,
          cur,
          curProfit,
          curMargin,
          curMarkup,
          proposed,
          newProfit,
          newMargin,
          delta,
          applicable,
          isWeak: curMargin !== null && curMargin < weakThreshold
        };
      });
  }, [parts, catFilter, onlyWeakMargin, ruleType, ruleValue, roundStep, priceFloor, weakThreshold, normalizePartCategory]);

  const stats = useMemo(() => {
    const withCost = rows.filter(r => r.hasCost);
    const avgMargin = withCost.length > 0
      ? withCost.reduce((s, r) => s + (r.curMargin || 0), 0) / withCost.length
      : 0;
    const weakCount = withCost.filter(r => r.isWeak).length;
    const missingCost = rows.length - withCost.length;
    return { avgMargin, weakCount, missingCost };
  }, [rows]);

  const toggleAllVisible = () => {
    const ids = rows.slice(0, 100).filter(r => r.applicable && r.delta !== 0).map(r => r.part.id);
    const allSel = ids.every(id => selectedIds.includes(id));
    setSelectedIds(allSel ? [] : ids);
  };

  const applyApprovedPrices = async () => {
    const targets = rows.filter(r => selectedIds.includes(r.part.id) && r.applicable && r.delta !== 0);
    if (targets.length === 0) {
      if (showToast) showToast('اختر منتجات لها فرق سعر مقترح أولاً', 'info');
      setConfirmApply(false);
      return;
    }
    const priceMap = {};
    for (const r of targets) {
      priceMap[r.part.id] = { basePrice: r.proposed };
    }
    let ok = true;
    if (typeof onApplyPricingMap === 'function') {
      try {
        ok = (await onApplyPricingMap(priceMap)) !== false;
      } catch {
        ok = false;
      }
    }
    setConfirmApply(false);
    if (ok) {
      setSelectedIds([]);
      if (showToast) showToast(`تم اعتماد وتحديث أسعار ${targets.length} منتج وحفظها بنجاح ✓`, 'success');
    } else if (showToast) {
      showToast('⚠️ تم تحديث الأسعار على الشاشة لكن الحفظ في قاعدة البيانات فشل — تحقق من الاتصال وحاول تاني.', 'error');
    }
  };

  return (
    <div className="space-y-4 text-xs elz-fade-in">
      {/* Header & KPIs */}
      <div className="bg-surface rounded-3xl p-4 sm:p-5 border border-line shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-black text-fg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              <span>محرك التسعير الذكي ومحاكاة الهوامش (AI Smart Pricing Engine)</span>
            </h2>
            <p className="text-[11px] text-muted">احسب هوامش الربح الحقيقية، اكتشف المنتجات ضعيفة الربحية، وحاكِ قواعد التسعير قبل اعتماد أي تغيير.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-bg border border-line">
            <div className="text-[10px] text-muted font-bold">متوسط هامش الربح الفعلي</div>
            <div className="text-lg font-black text-emerald-500 font-mono mt-0.5">{stats.avgMargin.toFixed(1)}%</div>
          </div>
          <div className="p-3 rounded-2xl bg-bg border border-line">
            <div className="text-[10px] text-muted font-bold">منتجات بهامش أقل من {weakThreshold}%</div>
            <div className="text-lg font-black text-rose-500 font-mono mt-0.5">{stats.weakCount}</div>
          </div>
          <div className="p-3 rounded-2xl bg-bg border border-line">
            <div className="text-[10px] text-muted font-bold">منتجات بدون تكلفة مسجلة</div>
            <div className="text-lg font-black text-amber-500 font-mono mt-0.5">{stats.missingCost}</div>
          </div>
          <div className="p-3 rounded-2xl bg-bg border border-line">
            <div className="text-[10px] text-muted font-bold">المحدد لتطبيق التسعير</div>
            <div className="text-lg font-black text-[#2563EB] dark:text-[#60A5FA] font-mono mt-0.5">{selectedIds.length}</div>
          </div>
        </div>

        {/* Configurable Pricing Rules */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 p-3.5 rounded-2xl bg-surface2/70 border border-line">
          <div>
            <label className="block text-[10px] font-extrabold text-muted mb-1">التصنيف:</label>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="w-full px-2.5 py-1.5 rounded-xl bg-surface border border-line font-bold">
              <option value="ALL">كل التصنيفات</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-muted mb-1">قاعدة التسعير:</label>
            <select value={ruleType} onChange={e => setRuleType(e.target.value)} className="w-full px-2.5 py-1.5 rounded-xl bg-surface border border-line font-bold">
              <option value="target_margin">هامش ربح مستهدف (%)</option>
              <option value="markup_pct">نسبة ربح فوق التكلفة (%)</option>
              <option value="discount_pct">خصم ترويجي (%)</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-muted mb-1">النسبة (%):</label>
            <input type="number" min="0" max={ruleType === 'target_margin' ? 85 : ruleType === 'discount_pct' ? 80 : 500} value={ruleValue} onChange={e => setRuleValue(e.target.value === '' ? '' : Number(e.target.value))} className="w-full px-2.5 py-1.5 rounded-xl bg-surface border border-line font-mono font-black" />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-muted mb-1">تقريب السعر لأعلى (لأقرب خطوة):</label>
            <select value={roundStep} onChange={e => setRoundStep(Number(e.target.value))} className="w-full px-2.5 py-1.5 rounded-xl bg-surface border border-line font-bold">
              <option value={1}>بدون تقريب (1 ج.م)</option>
              <option value={5}>أقرب 5 ج.م</option>
              <option value={10}>أقرب 10 ج.م</option>
              <option value={25}>أقرب 25 ج.م</option>
              <option value={50}>أقرب 50 ج.م</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-muted mb-1">عتبة الهامش الضعيف (%):</label>
            <input type="number" min="0" max="90" value={weakThreshold} onChange={e => setWeakThreshold(Number(e.target.value) || 0)} className="w-full px-2.5 py-1.5 rounded-xl bg-surface border border-line font-mono font-bold" />
          </div>
          <div>
            <label className="block text-[10px] font-extrabold text-muted mb-1">الحد الأدنى للسعر (Floor):</label>
            <input type="number" min="0" value={priceFloor} onChange={e => setPriceFloor(Number(e.target.value))} className="w-full px-2.5 py-1.5 rounded-xl bg-surface border border-line font-mono font-black" />
          </div>
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface border border-line cursor-pointer font-extrabold text-[11px]">
              <input type="checkbox" checked={onlyWeakMargin} onChange={e => setOnlyWeakMargin(e.target.checked)} />
              <span>ضعيف الهامش فقط</span>
            </label>
          </div>
        </div>

        {/* Approval Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-muted">
            ملاحظة: يتم عرض المحاكاة أولاً ولن يتغير أي سعر منشور قبل الضغط على زر الاعتماد والتأكيد.
          </span>
          {!confirmApply ? (
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={() => setConfirmApply(true)}
              className="px-5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white font-black text-xs transition"
            >
              مراجعة واعتماد الأسعار المقترحة ({selectedIds.length})
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={applyApprovedPrices}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد وتحديث الأسعار الآن</span>
              </button>
              <button
                type="button"
                onClick={() => setConfirmApply(false)}
                className="px-3 py-2 rounded-xl bg-surface2 border border-line text-muted font-bold"
              >
                إلغاء
              </button>
            </div>
          )}
        </div>
      </div>

      {rows.length > 100 && (
        <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold text-[11px]">
          ⚠️ يُعرض أول 100 منتج فقط من أصل {rows.length} — صفِّ بالقسم أو ضعّف الهامش للوصول لباقي المنتجات.
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
          <table className="w-full text-right border-collapse min-w-[780px]">
            <thead className="sticky top-0 z-10 bg-surface2 border-b border-line text-[11px] font-black text-muted">
              <tr>
                <th className="p-2.5 w-9 text-center">
                  <input type="checkbox" onChange={toggleAllVisible} checked={rows.length > 0 && selectedIds.length >= Math.min(rows.length, 100)} />
                </th>
                <th className="p-2.5">المنتج</th>
                <th className="p-2.5">التكلفة</th>
                <th className="p-2.5">السعر الحالي</th>
                <th className="p-2.5">الربح / الهامش الحالي</th>
                <th className="p-2.5">السعر المقترح</th>
                <th className="p-2.5">الفرق</th>
                <th className="p-2.5">الهامش الجديد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.slice(0, 100).map(r => (
                <tr key={r.part.id} className={`hover:bg-surface2/40 ${r.isWeak ? 'bg-rose-500/5' : ''}`}>
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      disabled={!r.applicable || r.delta === 0}
                      checked={selectedIds.includes(r.part.id)}
                      onChange={() => setSelectedIds(prev => prev.includes(r.part.id) ? prev.filter(x => x !== r.part.id) : [...prev, r.part.id])}
                    />
                  </td>
                  <td className="p-2 font-extrabold text-fg max-w-[240px] truncate">{r.part.name}</td>
                  <td className="p-2 font-mono text-muted">
                    {r.hasCost ? `${r.cost.toLocaleString()} ج.م` : <span className="text-amber-500 text-[10px]">غير مسجلة</span>}
                  </td>
                  <td className="p-2 font-mono font-bold text-fg">{r.cur.toLocaleString()} ج.م</td>
                  <td className="p-2 font-mono">
                    {r.hasCost ? (
                      <span className={r.isWeak ? 'text-rose-500 font-black' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
                        {r.curProfit.toLocaleString()} ج.م ({r.curMargin.toFixed(1)}%)
                      </span>
                    ) : '—'}
                  </td>
                  <td className="p-2 font-mono font-black text-[#2563EB] dark:text-[#60A5FA]">{r.applicable ? `${r.proposed.toLocaleString()} ج.م` : <span className="text-amber-500 text-[10px] font-bold">يلزم تكلفة/سعر أولاً</span>}</td>
                  <td className="p-2 font-mono font-black">
                    <span className={r.delta > 0 ? 'text-emerald-500' : r.delta < 0 ? 'text-rose-500' : 'text-muted'}>
                      {r.delta > 0 ? `+${r.delta}` : r.delta} ج.م
                    </span>
                  </td>
                  <td className="p-2 font-mono font-black">
                    {r.newMargin !== null ? `${r.newMargin.toFixed(1)}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
