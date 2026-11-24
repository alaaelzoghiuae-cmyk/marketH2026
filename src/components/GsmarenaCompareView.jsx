import React, { useState, useEffect, useRef } from 'react';
import {
  Scale, X, Check, Award, Share2, Printer,
  RefreshCw, Smartphone, Globe, PhoneCall, Cpu, ChevronDown, Sparkles, ClipboardList
} from 'lucide-react';
import {
  fetchGsmarenaDevice,
  buildComparisonAnalysis,
  buildWhatsAppCompareText,
  openPrintableComparisonWindow
} from '../services/gsmarenaClient.js';
import GsmarenaPhonePicker from './GsmarenaPhonePicker.jsx';

/**
 * Interactive GSMArena-backed Phone Comparison Component
 * Uses GsmarenaPhonePicker so every slot searches GSMArena live (13,000+ phones)
 * and shows live GSMArena trending devices immediately on click!
 */
export default function GsmarenaCompareView({
  cfg,
  localPhones = [],
  initialIds = [],
  initialSlugs = [],
  formatMoney,
  showToast,
  onOpenPhoneDetail,
  onOpenCompatibility,
  onOpenSourcing,
  onSyncCompareIds,
  onTrackEvent
}) {
  const cCfg = (cfg && cfg.compareCfg) || {};
  const maxDevices = cCfg.maxDevices === 2 ? 2 : 3;
  const liveEnabled = cCfg.gsmarenaLive !== false;

  const [slots, setSlots] = useState(() => {
    const arr = [];
    for (let i = 0; i < maxDevices; i++) {
      const id = initialIds[i];
      const found = id ? localPhones.find(p => p.id === id) : null;
      arr.push(found || null);
    }
    return arr;
  });
  const [slotLoading, setSlotLoading] = useState({});
  const [diffOnly, setDiffOnly] = useState(!!cCfg.defaultDiffOnly);
  const [showFullSpecs, setShowFullSpecs] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const initSlugsLoadedRef = useRef(false);

  useEffect(() => {
    setSlots(prev => {
      if (prev.length === maxDevices) return prev;
      const next = prev.slice(0, maxDevices);
      while (next.length < maxDevices) next.push(null);
      return next;
    });
  }, [maxDevices]);

  useEffect(() => {
    if (initSlugsLoadedRef.current || !initialSlugs || !initialSlugs.length) return;
    initSlugsLoadedRef.current = true;
    loadQuickComparison(initialSlugs.slice(0, maxDevices));
  }, [initialSlugs]);

  useEffect(() => {
    if (!onSyncCompareIds) return;
    const localIds = slots.filter(s => s && s.source !== 'gsmarena').map(s => s.id);
    onSyncCompareIds(localIds);
  }, [slots]);

  const loadQuickComparison = async (slugs) => {
    const target = (slugs || []).slice(0, maxDevices);
    if (!target.length) return;
    const loadingMap = {};
    target.forEach((_, idx) => { loadingMap[idx] = true; });
    setSlotLoading(loadingMap);

    const fetched = await Promise.all(target.map(async (slug) => {
      const local = localPhones.find(p => p.slug === slug || p.id === slug);
      if (liveEnabled) {
        const r = await fetchGsmarenaDevice(slug);
        if (r.ok && r.device) return local ? { ...r.device, price: local.price || 0, localId: local.id } : r.device;
      }
      return local || null;
    }));

    setSlotLoading({});
    if (fetched.some(Boolean)) {
      const next = [];
      for (let i = 0; i < maxDevices; i++) next.push(fetched[i] || null);
      setSlots(next);
    } else {
      showToast && showToast('تعذر تحميل المقارنة السريعة حالياً — جرّب البحث عن الأجهزة يدوياً.', 'warning');
    }
  };

  const setSlotDevice = (idx, dev) => {
    if (dev && onTrackEvent) onTrackEvent('compare_device', dev.name);
    setSlots(prev => {
      const next = [...prev];
      next[idx] = dev;
      return next;
    });
  };

  const clearAll = () => setSlots(Array(maxDevices).fill(null));

  const selectedDevices = slots.filter(Boolean);
  const analysis = buildComparisonAnalysis(selectedDevices, formatMoney);

  const buildShareUrl = () => {
    try {
      const slugs = selectedDevices.map(d => d.slug || d.id).filter(Boolean).join(',');
      const base = `${window.location.origin}${window.location.pathname}`;
      return `${base}#/karambo?page=compare&slugs=${encodeURIComponent(slugs)}`;
    } catch {
      return '';
    }
  };

  const handleCopyLink = async () => {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      showToast && showToast('تم نسخ رابط المقارنة — أي عميل يفتحه هيشوف نفس المقارنة فوراً', 'success');
    } catch {
      showToast && showToast(url, 'info');
    }
  };

  const handleShareWhatsApp = () => {
    const txt = buildWhatsAppCompareText(selectedDevices, analysis, buildShareUrl());
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank', 'noopener,noreferrer');
  };

  const quickPresets = Array.isArray(cCfg.quickComparisons) ? cCfg.quickComparisons : [];

  return (
    <div className="space-y-4">
      {/* Live GSMArena status banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-surface border border-line px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-black text-fg">
          <span className={`w-2.5 h-2.5 rounded-full ${liveEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <Globe className="w-4 h-4 text-violet-600" />
          <span>
            {liveEnabled
              ? 'محرك مقارنة شامل لقاعدة البيانات العالمية (أكثر من 13,000 جهاز)'
              : 'وضع المقارنة من الدليل المحلي'}
          </span>
        </div>
        <span className="text-[11px] font-bold text-muted">
          اكتب اسم أي موبايل بالعربي أو الإنجليزي (مثلاً: ايفون 16 برو ماكس، S25 Ultra، Redmi Note 14)
        </span>
      </div>

      {/* Quick Popular Comparisons */}
      {quickPresets.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-black text-muted flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> مقارنات سريعة جاهزة:</span>
          {quickPresets.map(q => (
            <button
              key={q.id}
              type="button"
              onClick={() => loadQuickComparison(q.slugs)}
              className="px-3 py-1.5 rounded-full bg-surface2 hover:bg-violet-600 hover:text-white border border-line text-[11px] font-black text-fg transition"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}

      {/* 2 or 3 Live GSMArena Slots */}
      <div className={`grid gap-3 ${maxDevices === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
        {slots.map((dev, idx) => {
          const isLoading = !!slotLoading[idx];
          const score = dev ? (analysis.scores[dev.id] || 0) : 0;
          const isWinner = dev && analysis.winnerId === dev.id && selectedDevices.length >= 2;

          return (
            <div key={idx} className={`relative bg-surface rounded-3xl border p-3.5 transition ${isWinner ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-line'}`}>
              {isWinner && (
                <span className="absolute -top-2.5 start-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black shadow">
                  <Award className="w-3 h-3" /> الأعلى نقاطاً ({score})
                </span>
              )}

              {isLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-xs font-black text-muted">
                  <RefreshCw className="w-6 h-6 text-violet-600 animate-spin" />
                  <span>جاري جلب المواصفات الكاملة للجهاز...</span>
                </div>
              ) : dev ? (
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#0D1528] border border-line flex items-center justify-center overflow-hidden shrink-0">
                      {dev.images && dev.images[0]
                        ? <img src={dev.images[0]} alt={dev.name} referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" />
                        : <Smartphone className="w-8 h-8 text-muted" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 flex-wrap mb-0.5">
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black text-white ${dev.source === 'gsmarena' ? 'bg-violet-600' : 'bg-sky-600'}`}>
                          {dev.source === 'gsmarena' ? 'كتالوج عالمي' : 'دليلنا'}
                        </span>
                        {selectedDevices.length >= 2 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[9px] font-black">
                            {score} نقطة تفوق
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-black text-fg leading-snug line-clamp-2">{dev.name}</div>
                      <div className="text-xs font-black text-[#2563EB] dark:text-[#60A5FA] mt-0.5">
                        {dev.price ? formatMoney(dev.price) : (dev.priceGlobal || 'مواصفات كاملة')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSlotDevice(idx, null)}
                      className="p-1.5 rounded-xl bg-surface2 hover:bg-rose-500 hover:text-white text-muted transition shrink-0"
                      title="إزالة الجهاز"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-line">
                    {cCfg.showAccessoriesCta !== false && onOpenCompatibility && (
                      <button
                        type="button"
                        onClick={() => onOpenCompatibility(dev)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-600/15 hover:bg-teal-600 hover:text-white text-teal-700 dark:text-teal-300 text-[11px] font-black transition"
                      >
                        <Cpu className="w-3.5 h-3.5" /> إكسسواراته
                      </button>
                    )}
                    {onOpenSourcing && (
                      <button
                        type="button"
                        onClick={() => onOpenSourcing(dev)}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#2563EB]/15 hover:bg-[#2563EB] hover:text-white text-[#2563EB] dark:text-[#60A5FA] text-[11px] font-black transition"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> اطلبه استيراد
                      </button>
                    )}
                    {(dev.source !== 'gsmarena' || dev.localId) && onOpenPhoneDetail && (
                      <button
                        type="button"
                        onClick={() => onOpenPhoneDetail(dev.localId || dev.id)}
                        className="px-2.5 py-1.5 rounded-xl bg-surface2 border border-line text-[11px] font-black text-fg hover:border-[#3B82F6] transition"
                      >
                        التفاصيل
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <GsmarenaPhonePicker
                  label={`الموبايل ${idx + 1} (بحث شامل)`}
                  placeholder="اكتب اسم أي موبايل..."
                  localPhones={localPhones}
                  fetchFullSpecs={true}
                  gsmarenaLive={liveEnabled}
                  formatMoney={formatMoney}
                  showToast={showToast}
                  onSelect={(fullDev) => setSlotDevice(idx, fullDev)}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {selectedDevices.length < 2 ? (
        <div className="bg-surface border border-line rounded-3xl p-8 text-center space-y-2">
          <Scale className="w-10 h-10 text-violet-500 mx-auto" />
          <div className="text-sm font-black text-fg">اختار موبايلين على الأقل وكرومبو هيقارنلك كل تفصيلة</div>
          <p className="text-xs font-bold text-muted">تقدر تبحث وتقارن بين أي أجهزة في العالم مع إبراز الفائز في كل بند تلقائياً</p>
        </div>
      ) : (
        <div className="space-y-4">
          {cCfg.showVerdict !== false && analysis.verdict && (
            <div className="rounded-3xl bg-gradient-to-l from-emerald-600/15 via-[#2563EB]/10 to-violet-600/15 border border-[#2563EB]/30 p-4 flex items-start gap-3">
              <Award className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="text-xs font-black text-[#2563EB] dark:text-[#60A5FA]">حكم كرومبو النهائي</div>
                <div className="text-sm font-black text-fg leading-relaxed">{analysis.verdict}</div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-line text-xs font-black text-fg cursor-pointer">
              <input type="checkbox" checked={diffOnly} onChange={e => setDiffOnly(e.target.checked)} className="w-4 h-4 accent-[#2563EB]" />
              <span>إظهار الاختلافات فقط</span>
            </label>
            <button
              type="button"
              onClick={() => setShowFullSpecs(v => !v)}
              className={`px-3 py-2 rounded-xl border text-xs font-black transition ${showFullSpecs ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-surface border-line text-fg'}`}
            >
              {showFullSpecs ? 'إخفاء الجدول التفصيلي' : 'عرض كل المواصفات التفصيلية'}
            </button>
            <div className="ms-auto flex flex-wrap gap-1.5">
              <button type="button" onClick={handleShareWhatsApp} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition">
                <Share2 className="w-3.5 h-3.5" /> واتساب
              </button>
              <button type="button" onClick={handleCopyLink} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface2 border border-line hover:border-[#3B82F6] text-fg text-xs font-black transition">
                <ClipboardList className="w-3.5 h-3.5" /> نسخ الرابط
              </button>
              <button type="button" onClick={() => openPrintableComparisonWindow(selectedDevices, analysis)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface2 border border-line hover:border-[#3B82F6] text-fg text-xs font-black transition">
                <Printer className="w-3.5 h-3.5" /> طباعة / PDF
              </button>
              <button type="button" onClick={clearAll} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 hover:text-white text-rose-600 text-xs font-black transition">
                <X className="w-3.5 h-3.5" /> مسح
              </button>
            </div>
          </div>

          <div className="bg-surface border border-line rounded-3xl overflow-x-auto">
            <table className="w-full text-xs font-bold min-w-[560px]">
              <thead>
                <tr className="border-b border-line bg-surface2/60">
                  <th className="p-3 text-start text-muted w-40">وجه المقارنة</th>
                  {selectedDevices.map(d => (
                    <th key={d.id} className="p-3 text-start">
                      <div className="flex items-center gap-2">
                        {d.images && d.images[0] && <img src={d.images[0]} alt="" referrerPolicy="no-referrer" className="w-8 h-8 object-contain bg-white rounded-lg shrink-0" />}
                        <span className="text-fg font-black">{d.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {analysis.keyRows.filter(r => !diffOnly || r.isDiff).map((row, ri) => (
                  <tr key={ri} className={ri % 2 ? 'bg-surface2/40' : ''}>
                    <td className="p-3 text-muted font-black">{row.label}</td>
                    {row.values.map((val, vi) => (
                      <td
                        key={vi}
                        className={`p-3 ${row.wins[vi] ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 font-black' : 'text-fg'}`}
                      >
                        <span className="inline-flex items-center gap-1">
                          {val}
                          {row.wins[vi] && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showFullSpecs && analysis.groups.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="text-sm font-black text-fg">المواصفات التفصيلية الكاملة</h3>
              {analysis.groups.map((grp, gi) => {
                const visibleRows = grp.rows.filter(r => !diffOnly || r.isDiff);
                if (visibleRows.length === 0) return null;
                const isCollapsed = !!collapsedGroups[grp.group];
                return (
                  <div key={gi} className="bg-surface border border-line rounded-2xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setCollapsedGroups(p => ({ ...p, [grp.group]: !p[grp.group] }))}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-surface2/70 text-xs font-black text-[#2563EB] dark:text-[#60A5FA]"
                    >
                      <span>{grp.group} ({visibleRows.length})</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
                    </button>
                    {!isCollapsed && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs font-bold min-w-[560px]">
                          <tbody>
                            {visibleRows.map((row, ri) => (
                              <tr key={ri} className={`border-t border-line/60 ${ri % 2 ? 'bg-surface2/30' : ''}`}>
                                <td className="p-2.5 text-muted w-40 align-top">{row.label}</td>
                                {row.values.map((v, vi) => (
                                  <td key={vi} className="p-2.5 text-fg align-top">{v}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
