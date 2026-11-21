import React, { useState, useMemo } from 'react';
import {
  Shield, AlertTriangle, Sparkles, Check, Trash2, Plus, Eye, Camera, RefreshCw
} from 'lucide-react';

/**
 * FEATURES 8 & 11 — PRODUCT QUALITY ASSISTANT + SMART MULTI-IMAGE URL MANAGER
 * Transparent 0-100 quality audit + visual multi-URL image paste, preview, broken-link detection, reordering & main-image selection.
 */
export default function ProductQualityAndImages({
  parts = [],
  normalizePartCategory,
  generateAiDetails,
  onUpdatePart,
  showToast
}) {
  const [issueFilter, setIssueFilter] = useState('ALL'); // 'ALL' | 'NO_IMG' | 'ONE_IMG' | 'WEAK_DESC' | 'NO_COST' | 'DUP'
  const [editingPartId, setEditingPartId] = useState(null);
  const [pasteUrlsText, setPasteUrlsText] = useState('');
  const [brokenUrls, setBrokenUrls] = useState({});

  // Audit every product transparently
  const audited = useMemo(() => {
    const nameFreq = new Map();
    for (const p of parts) {
      const k = String(p.name || '').replace(/^OR\s*-\s*/i, '').trim().toLowerCase();
      nameFreq.set(k, (nameFreq.get(k) || 0) + 1);
    }

    return parts.map(p => {
      const imgs = Array.from(new Set(
        [...(Array.isArray(p.images) ? p.images : []), p.image, p.imageUrl]
          .filter(u => u && String(u).trim().length > 4)
      ));
      const descLen = String(p.description || '').trim().length;
      const cat = normalizePartCategory ? normalizePartCategory(p.category, p.name) : String(p.category || '').trim();
      const base = Number(p.basePrice || 0);
      const cost = Number(p.costPrice || 0);
      const normName = String(p.name || '').replace(/^OR\s*-\s*/i, '').trim().toLowerCase();
      const isDup = (nameFreq.get(normName) || 0) > 1;

      const issues = [];
      let score = 0;
      if (imgs.length >= 2) score += 25;
      else if (imgs.length === 1) { score += 15; issues.push('صورة واحدة فقط'); }
      else issues.push('بدون صور');

      if (descLen >= 35) score += 25;
      else issues.push('وصف قصير أو ناقص');

      if (cat) score += 20;
      else issues.push('بدون تصنيف');

      if (base > 0) score += 15;
      else issues.push('سعر غير محدد');

      if (cost > 0 && !isDup) score += 15;
      else {
        if (cost <= 0) issues.push('تكلفة غير مسجلة');
        if (isDup) issues.push('اسم مكرر محتمل');
      }

      return { part: p, imgs, score, issues, isDup, descLen, cost };
    });
  }, [parts, normalizePartCategory]);

  const summary = useMemo(() => {
    const avg = audited.length ? Math.round(audited.reduce((s, a) => s + a.score, 0) / audited.length) : 0;
    return {
      avg,
      noImg: audited.filter(a => a.imgs.length === 0).length,
      oneImg: audited.filter(a => a.imgs.length === 1).length,
      weakDesc: audited.filter(a => a.descLen < 35).length,
      noCost: audited.filter(a => a.cost <= 0).length,
      dups: audited.filter(a => a.isDup).length
    };
  }, [audited]);

  const visibleList = useMemo(() => {
    return audited.filter(a => {
      if (issueFilter === 'NO_IMG') return a.imgs.length === 0;
      if (issueFilter === 'ONE_IMG') return a.imgs.length === 1;
      if (issueFilter === 'WEAK_DESC') return a.descLen < 35;
      if (issueFilter === 'NO_COST') return a.cost <= 0;
      if (issueFilter === 'DUP') return a.isDup;
      return true;
    }).sort((a, b) => a.score - b.score);
  }, [audited, issueFilter]);

  const editingItem = audited.find(a => a.part.id === editingPartId) || null;

  const saveImagesForPart = (part, nextImgs) => {
    const clean = Array.from(new Set(nextImgs.filter(Boolean)));
    if (typeof onUpdatePart === 'function') {
      onUpdatePart(part.id, {
        images: clean,
        image: clean[0] || '',
        imageUrl: clean[0] || '',
        customGroupPrices: { ...(part.customGroupPrices || {}), _images: clean }
      });
    }
  };

  const handlePasteUrls = () => {
    if (!editingItem) return;
    const urls = pasteUrlsText
      .split(/[\s\n,|;]+/)
      .map(s => s.trim())
      .filter(u => /^https?:\/\/[^\s"'<>]+$/i.test(u));
    if (urls.length === 0) {
      if (showToast) showToast('لم يتم العثور على روابط صور صالحة (يجب أن تبدأ بـ http/https)', 'error');
      return;
    }
    const merged = Array.from(new Set([...editingItem.imgs, ...urls])).slice(0, 8);
    saveImagesForPart(editingItem.part, merged);
    setPasteUrlsText('');
    if (showToast) showToast(`تمت إضافة ${urls.length} رابط صورة للمنتج بنجاح ✓`, 'success');
  };

  const handleAiFixDescription = (part) => {
    if (typeof generateAiDetails !== 'function' || typeof onUpdatePart !== 'function') return;
    const ai = generateAiDetails(part.name, '', part.brand || '', part.category || '');
    if (ai?.description) {
      onUpdatePart(part.id, { description: ai.description });
      if (showToast) showToast('تم تحسين وصف المنتج بالذكاء الاصطناعي ✓', 'success');
    }
  };

  return (
    <div className="space-y-4 text-xs elz-fade-in">
      {/* Quality Score Overview */}
      <div className="bg-surface rounded-3xl p-4 sm:p-5 border border-line shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-black text-fg flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#2563EB]" />
              <span>مساعد جودة الكتالوج وإدارة روابط الصور المتعددة</span>
            </h2>
            <p className="text-[11px] text-muted">فحص شفاف لجودة بيانات الكتالوج (الصور، الأوصاف، التكلفة، التكرارات) مع محرر مرئي لروابط الصور بدون استهلاك مساحة تخزين.</p>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/30 text-center">
            <div className="text-[10px] font-bold text-muted">متوسط جودة الكتالوج</div>
            <div className="text-lg font-black text-[#2563EB] dark:text-[#60A5FA] font-mono">{summary.avg} / 100</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ['ALL', `الكل (${parts.length})`],
            ['NO_IMG', `بدون صور (${summary.noImg})`],
            ['ONE_IMG', `صورة واحدة فقط (${summary.oneImg})`],
            ['WEAK_DESC', `وصف ناقص (${summary.weakDesc})`],
            ['NO_COST', `بدون تكلفة (${summary.noCost})`],
            ['DUP', `تكرار محتمل (${summary.dups})`]
          ].map(([k, lbl]) => (
            <button
              key={k}
              type="button"
              onClick={() => setIssueFilter(k)}
              className={`px-3 py-1.5 rounded-full font-extrabold border transition ${
                issueFilter === k
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-surface2 text-fg border-line hover:border-[#3B82F6]'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Multi-Image URL Editor Panel */}
      {editingItem && (
        <div className="bg-surface rounded-3xl p-4 sm:p-5 border-2 border-[#2563EB]/45 shadow-md space-y-4">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-line">
            <div>
              <span className="text-[10px] font-black text-[#2563EB]">محرر الصور المرئي (روابط CDN مباشرة)</span>
              <h3 className="text-sm font-black text-fg">{editingItem.part.name}</h3>
            </div>
            <button type="button" onClick={() => setEditingPartId(null)} className="px-3 py-1 rounded-xl bg-surface2 font-bold">إغلاق</button>
          </div>

          {/* Current Images with Reorder, Main Select & Broken Detection */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {editingItem.imgs.map((u, idx) => {
              const isDataUrl = String(u).startsWith('data:');
              const isBroken = Boolean(brokenUrls[u]);
              return (
                <div key={u + idx} className={`p-2.5 rounded-2xl border space-y-2 ${idx === 0 ? 'border-[#2563EB] bg-[#2563EB]/5' : 'border-line bg-bg'}`}>
                  <div className="relative h-28 rounded-xl bg-white flex items-center justify-center p-1 overflow-hidden">
                    {isBroken ? (
                      <span className="text-[10px] font-black text-rose-500 text-center">⚠️ رابط صورة معطوب</span>
                    ) : (
                      <img
                        src={u}
                        alt=""
                        onError={() => setBrokenUrls(prev => ({ ...prev, [u]: true }))}
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                    <span className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-black ${isDataUrl ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white'}`}>
                      {isDataUrl ? 'ملف مرفوع' : 'رابط URL'}
                    </span>
                    {idx === 0 && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-[#2563EB] text-white text-[9px] font-black">الرئيسية</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => {
                        const next = [u, ...editingItem.imgs.filter((_, i) => i !== idx)];
                        saveImagesForPart(editingItem.part, next);
                      }}
                      className="px-2 py-1 rounded-lg bg-surface border border-line disabled:opacity-40 hover:border-[#2563EB]"
                    >
                      تعيين رئيسية
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const next = editingItem.imgs.filter((_, i) => i !== idx);
                        saveImagesForPart(editingItem.part, next);
                      }}
                      className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10"
                      title="حذف الصورة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paste Multiple Image URLs */}
          <div className="space-y-2">
            <label className="block font-extrabold text-fg">لصق رابط أو عدة روابط صور (سطر لكل رابط):</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <textarea
                rows={2}
                value={pasteUrlsText}
                onChange={e => setPasteUrlsText(e.target.value)}
                placeholder="https://majentik.com/cdn/shop/files/img1.jpg&#10;https://majentik.com/cdn/shop/files/img2.jpg"
                className="flex-1 p-2.5 rounded-xl bg-bg border border-line font-mono text-[11px]"
              />
              <button
                type="button"
                onClick={handlePasteUrls}
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black shrink-0"
              >
                + إضافة الروابط
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audited Products List */}
      <div className="bg-surface rounded-3xl border border-line shadow-sm divide-y divide-line max-h-[520px] overflow-y-auto">
        {visibleList.slice(0, 80).map(a => (
          <div key={a.part.id} className="p-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-surface2/40 transition">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-xl bg-white border border-line p-1 flex items-center justify-center shrink-0">
                {a.imgs[0] ? (
                  <img src={a.imgs[0]} alt="" loading="lazy" className="max-w-full max-h-full object-contain" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-fg truncate">{a.part.name}</div>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    a.score >= 85 ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                    a.score >= 60 ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                    'bg-rose-500/15 text-rose-500'
                  }`}>
                    الجودة: {a.score}/100
                  </span>
                  <span className="text-[10px] text-muted font-bold">الصور: {a.imgs.length}</span>
                  {a.issues.map((iss, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-full bg-surface2 border border-line text-[10px] font-bold text-muted">
                      {iss}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setEditingPartId(a.part.id)}
                className="px-3 py-1.5 rounded-xl bg-[#2563EB]/15 hover:bg-[#2563EB] text-[#2563EB] hover:text-white font-extrabold text-[11px] transition"
              >
                إدارة الصور ({a.imgs.length})
              </button>
              {a.descLen < 35 && (
                <button
                  type="button"
                  onClick={() => handleAiFixDescription(a.part)}
                  className="px-3 py-1.5 rounded-xl bg-violet-600/15 hover:bg-violet-600 text-violet-600 dark:text-violet-400 hover:text-white font-extrabold text-[11px] flex items-center gap-1 transition"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>تحسين الوصف AI</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
