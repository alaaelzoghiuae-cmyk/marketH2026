import React, { useState } from 'react';
import {
  Upload, Sparkles, Check, AlertTriangle, Trash2, Plus, Eye, Layers, RefreshCw
} from 'lucide-react';

/**
 * FEATURE 2 — INTELLIGENT BULK PRODUCT IMPORTER
 * Multi-step guided workflow:
 * Step 1: Paste multiple image URLs or CSV rows (zero forced uploads)
 * Step 2: Live image preview + broken URL detection + AI-assisted copy/category/SEO generation
 * Step 3: Review, edit & validate all rows
 * Step 4: Confirm import & view detailed success/failure summary
 */
export default function BulkProductImporter({
  brands = [],
  models = [],
  categories = [],
  normalizePartCategory,
  generateAiDetails,
  onConfirmImport,
  showToast
}) {
  const [step, setStep] = useState(1);
  const [rawInput, setRawInput] = useState('');
  const [defaultBrand, setDefaultBrand] = useState(brands[0] || 'OR - Majentik');
  const [defaultStock, setDefaultStock] = useState(5);
  const [rows, setRows] = useState([]);
  const [brokenImgMap, setBrokenImgMap] = useState({});
  const [importSummary, setImportSummary] = useState(null);

  const isSafeHttpUrl = (u) => /^https?:\/\/[^\s"'<>]+$/i.test(String(u || '').trim());

  // Minimal CSV splitter that honors double-quoted fields: a comma inside
  // quotes stays in the field and "" is an escaped quote. (A naive split(',')
  // shifted every field after a product name containing a comma.)
  const splitCsvLine = (line) => {
    const out = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; }
          else inQuotes = false;
        } else cur += ch;
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        out.push(cur.trim());
        cur = '';
      } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };

  const parseInputToRows = () => {
    const lines = rawInput.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      if (showToast) showToast('الصق روابط صور أو سطور CSV أولاً', 'error');
      return;
    }

    const parsed = lines.map((line, idx) => {
      // Support CSV: Title, Price, Cost, Stock, Category, URL1 | URL2 | URL3 | URL4
      // OR pure URL lines (each line is 1 or more space/pipe-separated image URLs)
      const parts = line.includes(',') && !line.startsWith('http')
        ? splitCsvLine(line)
        : null;

      if (parts && parts.length >= 2) {
        const name = parts[0] || `منتج جديد #${idx + 1}`;
        const basePrice = Math.max(0, Number(parts[1]) || 0);
        const rawCost = String(parts[2] ?? '').trim();
        const costPrice = rawCost === '' ? 0 : Math.max(0, Number(rawCost) || 0);
        const rawStock = String(parts[3] ?? '').trim();
        const stock = rawStock === '' ? (Number(defaultStock) || 5) : Math.max(0, Number(rawStock) || 0);
        const rawCat = parts[4] || '';
        const urls = (parts.slice(5).join('|').split(/[\s|;]+/)).filter(isSafeHttpUrl).slice(0, 8);
        const category = normalizePartCategory ? (normalizePartCategory(rawCat, name) || 'شواحن') : (rawCat || 'شواحن');
        return {
          tempId: `imp_${Date.now()}_${idx}`,
          name,
          brand: defaultBrand,
          category,
          basePrice,
          costPrice,
          stock,
          sku: `IMP-${Date.now().toString().slice(-4)}${idx + 1}`,
          images: urls,
          description: '',
          seoTags: '',
          selected: true
        };
      } else {
        // Pure URL(s) on a line (optionally with "Title | url1 | url2")
        const tokens = line.split(/[\s|;]+/).filter(Boolean);
        const urls = tokens.filter(isSafeHttpUrl).slice(0, 8);
        const nonUrlText = tokens.filter(t => !isSafeHttpUrl(t)).join(' ').trim();
        const urlSlug = urls[0]
          ? decodeURIComponent(urls[0].split('/').pop().split('?')[0].replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ')).trim()
          : '';
        const name = nonUrlText || urlSlug || `منتج مستورد #${idx + 1}`;
        const category = normalizePartCategory ? (normalizePartCategory('', name) || 'شواحن') : 'شواحن';
        return {
          tempId: `imp_${Date.now()}_${idx}`,
          name,
          brand: defaultBrand,
          category,
          basePrice: 0,
          costPrice: 0,
          stock: Number(defaultStock) || 5,
          sku: `IMP-${Date.now().toString().slice(-4)}${idx + 1}`,
          images: urls,
          description: '',
          seoTags: '',
          selected: true
        };
      }
    });

    setRows(parsed);
    setBrokenImgMap({});
    setImportSummary(null);
    setStep(2);
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setRawInput(String(reader.result || ''));
      if (showToast) showToast(`تم تحميل ملف ${file.name} بنجاح ✓`, 'info');
    };
    reader.readAsText(file, 'UTF-8');
  };

  const runAiEnrichAll = () => {
    setRows(prev => prev.map(r => {
      const ai = typeof generateAiDetails === 'function'
        ? generateAiDetails(r.name, '', r.brand, r.category)
        : null;
      const smartCat = normalizePartCategory ? normalizePartCategory(ai?.category || r.category, r.name) : (ai?.category || r.category);
      return {
        ...r,
        category: smartCat || r.category || 'شواحن',
        description: r.description || ai?.description || `${r.name} — منتج أصلي معتمد بجودة عالية وضمان من متجر ELZOGHBI.`,
        seoTags: r.seoTags || `${r.brand}, ${smartCat}, ${r.name}`.replace(/OR\s*-\s*/gi, '')
      };
    }));
    if (showToast) showToast('تم توليد الأوصاف والتصنيفات المقترحة بالذكاء الاصطناعي — راجعها قبل الاعتماد ✓', 'success');
  };

  const updateRow = (tempId, patch) => {
    setRows(prev => prev.map(r => (r.tempId === tempId ? { ...r, ...patch } : r)));
  };

  const removeRow = (tempId) => {
    setRows(prev => prev.filter(r => r.tempId !== tempId));
  };

  const validateRow = (r) => {
    const errs = [];
    if (!String(r.name || '').trim()) errs.push('الاسم مطلوب');
    if (Number(r.basePrice) <= 0) errs.push('السعر يجب أن يكون أكبر من 0');
    if (!r.images || r.images.length === 0) errs.push('لا يوجد رابط صورة');
    return errs;
  };

  const executeImport = () => {
    const selectedRows = rows.filter(r => r.selected);
    const valid = [];
    const failed = [];
    for (const r of selectedRows) {
      const errs = validateRow(r);
      if (!models.some(m => m.brand === r.brand)) errs.push('لا يوجد أي موديل لهذا البراند — أنشئ موديلاً من شاشة الكتالوج أولاً');
      if (errs.length > 0) failed.push({ name: r.name, reason: errs.join('، ') });
      else valid.push(r);
    }

    if (valid.length === 0) {
      if (showToast) showToast('لا توجد منتجات صالحة للاستيراد — تأكد من إدخال الأسعار والصور', 'error');
      return;
    }

    const newParts = valid.map((r, i) => {
      const targetModel = models.find(m => m.brand === r.brand);
      const id = `imp_prt_${Date.now()}_${i}`;
      return {
        id,
        sku: r.sku || `SKU-${Date.now().toString().slice(-5)}-${i}`,
        modelId: targetModel.id,
        brand: r.brand,
        category: r.category || 'شواحن',
        name: r.name.trim(),
        qualityGrade: 'أصلي معتمد',
        colors: ['قياسي'],
        compatibleModels: [r.brand],
        searchAliases: `${r.name} ${r.brand} ${r.category} ${r.seoTags}`,
        description: r.description || `${r.name} — متوفر بضمان متجر ELZOGHBI.`,
        warrantyText: 'ضمان استبدال ومعاينة معتمد من متجر الزغبي',
        image: r.images[0] || '',
        imageUrl: r.images[0] || '',
        images: r.images,
        stock: r.stock === undefined || r.stock === null || r.stock === '' ? (Number(defaultStock) || 5) : Math.max(0, Number(r.stock) || 0),
        lowStockThreshold: 5,
        maxOrderQty: 5,
        costPrice: Math.max(0, Number(r.costPrice) || 0),
        basePrice: Number(r.basePrice),
        customGroupPrices: { _images: r.images },
        createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        waitlistCount: 0
      };
    });

    if (typeof onConfirmImport === 'function') {
      onConfirmImport(newParts);
    }
    const unselectedCount = rows.length - selectedRows.length;
    if (unselectedCount > 0) failed.push({ name: `${unselectedCount} صف`, reason: 'لم يتم تحديده للاستيراد' });
    setImportSummary({ imported: newParts.length, failed });
    setStep(4);
  };

  return (
    <div className="space-y-4 text-xs elz-fade-in">
      {/* Header & Progress Stepper */}
      <div className="bg-surface rounded-3xl p-4 sm:p-5 border border-line shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm sm:text-base font-black text-fg flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#2563EB]" />
              <span>المستورد الذكي للمنتجات وروابط الصور (Bulk Product Importer)</span>
            </h2>
            <p className="text-[11px] text-muted mt-0.5">
              أضف عشرات المنتجات دفعة واحدة عبر لصق روابط الصور أو ملف CSV — مع معاينة فورية وكشف الروابط المعطوبة وتعبئة ذكية بالذكاء الاصطناعي بدون استهلاك مساحة تخزين.
            </p>
          </div>
          {step > 1 && (
            <button
              type="button"
              onClick={() => { setStep(1); setImportSummary(null); }}
              className="px-3 py-1.5 rounded-xl bg-surface2 border border-line text-fg font-bold text-xs"
            >
              ↺ بدء استيراد جديد
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            [1, '1. إدخال الروابط / CSV'],
            [2, '2. المعاينة وتوليد AI'],
            [3, '3. المراجعة والتحقق'],
            [4, '4. ملخص الاستيراد']
          ].map(([sNum, sLabel]) => (
            <div
              key={sNum}
              className={`px-2.5 py-2 rounded-xl border text-center font-extrabold text-[10px] sm:text-xs transition ${
                step === sNum
                  ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-sm'
                  : step > sNum
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  : 'bg-surface2 text-muted border-line'
              }`}
            >
              {sLabel}
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: Input URLs or CSV */}
      {step === 1 && (
        <div className="bg-surface rounded-3xl p-4 sm:p-5 border border-line space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-extrabold text-muted mb-1">البراند الافتراضي للمنتجات:</label>
              <select
                value={defaultBrand}
                onChange={e => setDefaultBrand(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg border border-line text-fg font-bold"
              >
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-extrabold text-muted mb-1">المخزون الافتراضي:</label>
              <input
                type="number"
                min="0"
                value={defaultStock}
                onChange={e => setDefaultStock(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-bg border border-line text-fg font-bold"
              />
            </div>
            <div>
              <label className="block font-extrabold text-muted mb-1">أو استيراد ملف CSV:</label>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleCsvUpload}
                className="w-full px-2.5 py-1.5 rounded-xl bg-bg border border-line text-fg text-[11px]"
              />
            </div>
          </div>

          <div>
            <label className="block font-extrabold text-fg mb-1.5">
              الصق روابط الصور (حتى 4 روابط في كل سطر مفصولة بمسافة أو |) أو سطور CSV بصيغة: <span className="text-[#2563EB]" dir="ltr">Name, Price, Cost, Stock, Category, URL1|URL2</span>
            </label>
            <textarea
              rows={8}
              value={rawInput}
              onChange={e => setRawInput(e.target.value)}
              placeholder={`مثال سطر CSV:\nشاحن سريع 65 واط GaN, 850, 620, 10, شواحن, https://example.com/img1.jpg|https://example.com/img2.jpg\n\nأو لصق روابط صور مباشرة (كل سطر = منتج):\nhttps://example.com/cable1.jpg https://example.com/cable2.jpg`}
              className="w-full p-3.5 rounded-2xl bg-bg border border-line text-fg font-mono text-xs focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={parseInputToRows}
              className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black text-xs shadow transition"
            >
              تحليل ومعاينة المنتجات ←
            </button>
          </div>
        </div>
      )}

      {/* STEP 2 & 3: Preview, AI Enrich, Edit & Validate */}
      {(step === 2 || step === 3) && (
        <div className="bg-surface rounded-3xl p-4 sm:p-5 border border-line space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line">
            <span className="font-black text-fg">تم تحليل {rows.length} منتج — راجع الصور والأسعار قبل الاعتماد</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={runAiEnrichAll}
                className="px-3.5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold flex items-center gap-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تعبئة ذكية للوصف والتصنيف (AI)</span>
              </button>
              {step === 2 ? (
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-extrabold"
                >
                  التحقق والمراجعة ←
                </button>
              ) : (
                <button
                  type="button"
                  onClick={executeImport}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center gap-1.5 shadow"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد واستيراد المنتجات الصالحة</span>
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
            {rows.map((r, idx) => {
              const errs = validateRow(r);
              return (
                <div
                  key={r.tempId}
                  className={`p-3.5 rounded-2xl border space-y-2.5 ${
                    errs.length > 0 && step === 3
                      ? 'bg-rose-500/5 border-rose-500/40'
                      : 'bg-bg border-line'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 font-black text-fg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={r.selected}
                        onChange={e => updateRow(r.tempId, { selected: e.target.checked })}
                      />
                      <span>#{idx + 1}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface2 text-muted font-mono">{r.sku}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      {errs.length > 0 ? (
                        <span className="text-[10px] font-black text-rose-500 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {errs.join(' • ')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-black text-emerald-500">✓ جاهز للاستيراد</span>
                      )}
                      <button type="button" onClick={() => removeRow(r.tempId)} className="text-rose-500 hover:bg-rose-500/10 p-1 rounded-lg">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Image URLs Visual Preview Strip */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {r.images.map((url, imIdx) => {
                      const brokenKey = `${r.tempId}_${imIdx}`;
                      return (
                        <div key={imIdx} className="relative w-14 h-14 rounded-xl bg-white border border-line p-1 shrink-0 flex items-center justify-center">
                          {brokenImgMap[brokenKey] ? (
                            <span className="text-[9px] text-rose-600 font-black text-center leading-tight">رابط معطوب</span>
                          ) : (
                            <img
                              src={url}
                              alt=""
                              onError={() => setBrokenImgMap(prev => ({ ...prev, [brokenKey]: true }))}
                              className="max-w-full max-h-full object-contain"
                            />
                          )}
                          {imIdx === 0 && (
                            <span className="absolute -top-1 -right-1 px-1 rounded bg-[#2563EB] text-white text-[8px] font-black">رئيسية</span>
                          )}
                        </div>
                      );
                    })}
                    {r.images.length === 0 && (
                      <span className="text-[11px] text-rose-500 font-bold">لا توجد صور — أضف روابط صور</span>
                    )}
                  </div>

                  {/* Editable Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    <input
                      type="text"
                      value={r.name}
                      onChange={e => updateRow(r.tempId, { name: e.target.value })}
                      placeholder="اسم المنتج"
                      className="lg:col-span-2 px-2.5 py-1.5 rounded-xl bg-surface border border-line font-bold"
                    />
                    <select
                      value={r.category}
                      onChange={e => updateRow(r.tempId, { category: e.target.value })}
                      className="px-2.5 py-1.5 rounded-xl bg-surface border border-line font-bold"
                    >
                      {Array.from(new Set([...categories, r.category].filter(Boolean))).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={r.basePrice}
                      onChange={e => updateRow(r.tempId, { basePrice: Number(e.target.value) })}
                      placeholder="سعر البيع (ج.م)"
                      className="px-2.5 py-1.5 rounded-xl bg-surface border border-line font-bold"
                    />
                    <input
                      type="number"
                      value={r.stock}
                      onChange={e => updateRow(r.tempId, { stock: Number(e.target.value) })}
                      placeholder="المخزون"
                      className="px-2.5 py-1.5 rounded-xl bg-surface border border-line font-bold"
                    />
                  </div>
                  <input
                    type="text"
                    value={r.description}
                    onChange={e => updateRow(r.tempId, { description: e.target.value })}
                    placeholder="وصف المنتج (اضغط تعبئة ذكية AI لتوليده تلقائياً)"
                    className="w-full px-2.5 py-1.5 rounded-xl bg-surface border border-line text-[11px]"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: Import Summary */}
      {step === 4 && importSummary && (
        <div className="bg-surface rounded-3xl p-6 border border-line text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-fg">اكتمل الاستيراد بنجاح!</h3>
          <p className="text-xs text-muted font-bold">
            تمت إضافة <span className="text-emerald-500 font-black">{importSummary.imported}</span> منتج جديد إلى الكتالوج.
            {importSummary.failed.length > 0 && (
              <span className="text-rose-500 mr-1">وتم تخطي {importSummary.failed.length} منتج لوجود بيانات ناقصة.</span>
            )}
          </p>
          {importSummary.failed.length > 0 && (
            <div className="max-w-lg mx-auto text-right bg-rose-500/5 border border-rose-500/30 rounded-2xl p-3 space-y-1">
              {importSummary.failed.map((f, i) => (
                <div key={i} className="text-[11px] font-bold text-rose-500">• {f.name}: {f.reason}</div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => { setStep(1); setRawInput(''); setRows([]); setImportSummary(null); }}
            className="px-5 py-2.5 rounded-xl bg-[#2563EB] text-white font-extrabold text-xs"
          >
            استيراد دفعة جديدة
          </button>
        </div>
      )}
    </div>
  );
}
