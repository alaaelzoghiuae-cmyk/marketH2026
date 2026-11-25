import React, { useState, useMemo } from 'react';
import {
  Search, Check, RotateCcw, Eye, EyeOff, Plus, Layers, AlertTriangle, Save
} from 'lucide-react';

/**
 * FEATURE 3 — EXCEL-STYLE PRODUCT MANAGEMENT
 * Spreadsheet-grade inline & bulk editor for ELZOGHBI catalog with Undo stack & confirmation gate.
 */
export default function ExcelProductManager({
  parts = [],
  categories = [],
  hiddenPartIds = [],
  normalizePartCategory,
  onUpdatePart,
  onBulkUpdateParts,
  onToggleHideParts,
  onDuplicateParts,
  showToast
}) {
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('name_asc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [undoSnapshot, setUndoSnapshot] = useState(null);
  const [gridVersion, setGridVersion] = useState(0);

  // Bulk operation controls
  const [bulkMode, setBulkMode] = useState('price_pct'); // 'price_pct' | 'stock_set' | 'category'
  const [bulkVal, setBulkVal] = useState('10');
  const [bulkCat, setBulkCat] = useState(categories[0] || 'شواحن');
  const [confirmBulk, setConfirmBulk] = useState(false);

  const hiddenSet = useMemo(() => new Set((hiddenPartIds || []).map(String)), [hiddenPartIds]);
  const PAGE_SIZE = 40;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return parts
      .filter(p => {
        if (q && !`${p.name || ''} ${p.sku || ''} ${p.brand || ''} ${p.category || ''}`.toLowerCase().includes(q)) return false;
        const normC = normalizePartCategory ? normalizePartCategory(p.category, p.name) : p.category;
        if (catFilter !== 'ALL' && normC !== catFilter) return false;
        if (stockFilter === 'LOW' && Number(p.stock || 0) > (Number(p.lowStockThreshold) || 5)) return false;
        if (stockFilter === 'OUT' && Number(p.stock || 0) > 0) return false;
        if (stockFilter === 'HIDDEN' && !hiddenSet.has(String(p.id))) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return Number(a.basePrice || 0) - Number(b.basePrice || 0);
        if (sortBy === 'price_desc') return Number(b.basePrice || 0) - Number(a.basePrice || 0);
        if (sortBy === 'stock_asc') return Number(a.stock || 0) - Number(b.stock || 0);
        if (sortBy === 'stock_desc') return Number(b.stock || 0) - Number(a.stock || 0);
        return String(a.name || '').localeCompare(String(b.name || ''), 'ar');
      });
  }, [parts, query, catFilter, stockFilter, sortBy, hiddenSet, normalizePartCategory]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSelect = (id) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const toggleSelectPage = () => {
    const pageIds = pageItems.map(p => p.id);
    const allSelected = pageIds.every(id => selectedIds.includes(id));
    if (allSelected) setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    else setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
  };

  const applyInlineField = (part, field, value) => {
    if (typeof onUpdatePart === 'function') {
      onUpdatePart(part.id, { [field]: value });
    }
  };

  const executeBulkAction = () => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    // Save snapshot for Undo
    const fieldByMode = { price_pct: 'basePrice', stock_set: 'stock', category: 'category' };
    const snapshot = {
      field: fieldByMode[bulkMode] || 'basePrice',
      items: parts.filter(p => idSet.has(p.id)).map(p => ({
        id: p.id,
        basePrice: p.basePrice,
        stock: p.stock,
        category: p.category
      }))
    };
    setUndoSnapshot(snapshot);

    const patches = {};
    for (const p of parts) {
      if (!idSet.has(p.id)) continue;
      if (bulkMode === 'price_pct') {
        const pct = Number(bulkVal) || 0;
        const nextPrice = Math.max(1, Math.round(Number(p.basePrice || 0) * (1 + pct / 100)));
        patches[p.id] = { basePrice: nextPrice };
      } else if (bulkMode === 'stock_set') {
        patches[p.id] = { stock: Math.max(0, Number(bulkVal) || 0) };
      } else if (bulkMode === 'category') {
        patches[p.id] = { category: bulkCat };
      }
    }

    if (typeof onBulkUpdateParts === 'function') {
      onBulkUpdateParts(patches);
    }
    setConfirmBulk(false);
    setSelectedIds([]);
    setGridVersion(v => v + 1);
    if (showToast) showToast(`تم تطبيق التعديل الجماعي على ${selectedIds.length} منتج ✓`, 'success');
  };

  const handleUndo = () => {
    if (!undoSnapshot || !undoSnapshot.items || undoSnapshot.items.length === 0) return;
    const patches = {};
    for (const item of undoSnapshot.items) {
      patches[item.id] = { [undoSnapshot.field]: item[undoSnapshot.field] };
    }
    if (typeof onBulkUpdateParts === 'function') onBulkUpdateParts(patches);
    setUndoSnapshot(null);
    setGridVersion(v => v + 1);
    if (showToast) showToast('تم التراجع عن آخر تعديل جماعي بنجاح ↺', 'info');
  };

  return (
    <div className="space-y-4 text-xs elz-fade-in">
      {/* Header & Filters */}
      <div className="bg-surface rounded-3xl p-4 sm:p-5 border border-line shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-black text-fg flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#1E4E8C]" />
              <span>إدارة المنتجات السريعة بنمط Excel ({filtered.length} / {parts.length})</span>
            </h2>
            <p className="text-[11px] text-muted">عدّل الاسم أو السعر أو التكلفة أو المخزون أو التصنيف مباشرة في الجدول بدون فتح كل منتج منفرداً.</p>
          </div>
          {undoSnapshot && (
            <button
              type="button"
              onClick={handleUndo}
              className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-white border border-amber-500/30 font-extrabold flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تراجع عن آخر تعديل جماعي ({undoSnapshot.items?.length || 0})</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setPage(1); }}
              placeholder="بحث بالاسم، SKU، أو البراند..."
              className="w-full pr-9 pl-3 py-2 rounded-xl bg-bg border border-line text-fg font-bold"
            />
          </div>
          <select
            value={catFilter}
            onChange={e => { setCatFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-bg border border-line text-fg font-bold"
          >
            <option value="ALL">كل التصنيفات</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={stockFilter}
            onChange={e => { setStockFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-bg border border-line text-fg font-bold"
          >
            <option value="ALL">كل حالات المخزون</option>
            <option value="LOW">مخزون منخفض (≤ الحد)</option>
            <option value="OUT">نفد المخزون (0)</option>
            <option value="HIDDEN">المنتجات المخفية</option>
          </select>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-bg border border-line text-fg font-bold"
          >
            <option value="name_asc">الاسم (أ - ي)</option>
            <option value="price_asc">السعر: الأقل أولاً</option>
            <option value="price_desc">السعر: الأعلى أولاً</option>
            <option value="stock_asc">المخزون: الأقل أولاً</option>
            <option value="stock_desc">المخزون: الأكثر أولاً</option>
          </select>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.length > 0 && (
          <div className="p-3 rounded-2xl bg-[#1E4E8C]/10 border border-[#1E4E8C]/35 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-full bg-[#1E4E8C] text-white font-black text-[11px]">
                تم تحديد {selectedIds.length} منتج
              </span>
              <select
                value={bulkMode}
                onChange={e => setBulkMode(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-surface border border-line font-extrabold"
              >
                <option value="price_pct">تعديل السعر بنسبة (%)</option>
                <option value="stock_set">تعيين المخزون إلى</option>
                <option value="category">نقل إلى تصنيف</option>
              </select>
              {bulkMode === 'category' ? (
                <select
                  value={bulkCat}
                  onChange={e => setBulkCat(e.target.value)}
                  className="px-2.5 py-1.5 rounded-xl bg-surface border border-line font-extrabold"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input
                  type="number"
                  value={bulkVal}
                  onChange={e => setBulkVal(e.target.value)}
                  placeholder={bulkMode === 'price_pct' ? 'مثال: 10 أو -10' : 'الكمية'}
                  className="w-24 px-2.5 py-1.5 rounded-xl bg-surface border border-line font-mono font-black"
                />
              )}
              {!confirmBulk ? (
                <button
                  type="button"
                  onClick={() => setConfirmBulk(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#1E4E8C] text-white font-extrabold"
                >
                  تطبيق التعديل
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={executeBulkAction}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-black flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>تأكيد نهائي</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmBulk(false)}
                    className="px-2.5 py-1.5 rounded-xl bg-surface border border-line text-muted font-bold"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {typeof onToggleHideParts === 'function' && (
                <>
                  <button
                    type="button"
                    onClick={() => onToggleHideParts(selectedIds, true)}
                    className="px-2.5 py-1.5 rounded-xl bg-surface border border-line hover:border-rose-400 text-fg font-bold"
                  >
                    إخفاء المحدد
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleHideParts(selectedIds, false)}
                    className="px-2.5 py-1.5 rounded-xl bg-surface border border-line hover:border-emerald-400 text-fg font-bold"
                  >
                    إظهار المحدد
                  </button>
                </>
              )}
              {typeof onDuplicateParts === 'function' && (
                <button
                  type="button"
                  onClick={() => { onDuplicateParts(selectedIds); setSelectedIds([]); }}
                  className="px-2.5 py-1.5 rounded-xl bg-surface border border-line hover:border-[#1E4E8C] text-fg font-bold"
                >
                  نسخ المحدد
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="px-2.5 py-1.5 rounded-xl text-rose-500 font-bold"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Spreadsheet Table */}
      <div className="bg-surface rounded-3xl border border-line shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[820px]">
            <thead className="bg-surface2 border-b border-line text-[11px] font-black text-muted">
              <tr>
                <th className="p-2.5 w-9 text-center">
                  <input
                    type="checkbox"
                    checked={pageItems.length > 0 && pageItems.every(p => selectedIds.includes(p.id))}
                    onChange={toggleSelectPage}
                  />
                </th>
                <th className="p-2.5">المنتج (تعديل مباشر)</th>
                <th className="p-2.5 w-24">SKU</th>
                <th className="p-2.5 w-44">التصنيف</th>
                <th className="p-2.5 w-28">سعر البيع</th>
                <th className="p-2.5 w-28">التكلفة</th>
                <th className="p-2.5 w-20">الربح%</th>
                <th className="p-2.5 w-24">المخزون</th>
                <th className="p-2.5 w-20 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pageItems.map(p => {
                const isHidden = hiddenSet.has(String(p.id));
                const base = Number(p.basePrice || 0);
                const cost = Number(p.costPrice || 0);
                const margin = base > 0 && cost > 0 ? Math.round(((base - cost) / base) * 100) : null;
                const normCat = normalizePartCategory ? normalizePartCategory(p.category, p.name) : (p.category || '');
                return (
                  <tr key={`${p.id}_${gridVersion}`} className={`hover:bg-surface2/50 transition ${selectedIds.includes(p.id) ? 'bg-[#1E4E8C]/5' : ''}`}>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={p.image || p.imageUrl || (p.images && p.images[0]) || ''}
                          alt=""
                          loading="lazy"
                          className="w-9 h-9 rounded-lg object-contain bg-white border border-line p-0.5 shrink-0"
                        />
                        <input
                          type="text"
                          defaultValue={p.name}
                          onBlur={e => {
                            const v = e.target.value.trim();
                            if (v && v !== p.name) applyInlineField(p, 'name', v);
                          }}
                          className="w-full px-2 py-1 rounded-lg bg-transparent hover:bg-bg focus:bg-bg border border-transparent focus:border-[#1E4E8C] font-extrabold text-fg text-xs"
                        />
                      </div>
                    </td>
                    <td className="p-2 font-mono text-[10px] text-muted">{p.sku || p.id}</td>
                    <td className="p-2">
                      <select
                        value={normCat}
                        onChange={e => applyInlineField(p, 'category', e.target.value)}
                        className="w-full px-2 py-1 rounded-lg bg-bg border border-line text-[11px] font-bold text-fg"
                      >
                        {Array.from(new Set([...categories, normCat].filter(Boolean))).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        defaultValue={base}
                        onBlur={e => {
                          const v = Math.max(0, Number(e.target.value) || 0);
                          if (v !== base) applyInlineField(p, 'basePrice', v);
                        }}
                        className="w-full px-2 py-1 rounded-lg bg-bg border border-line font-mono font-black text-[#1E4E8C] dark:text-[#7FB0E8]"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        defaultValue={cost}
                        onBlur={e => {
                          const v = Math.max(0, Number(e.target.value) || 0);
                          if (v !== cost) applyInlineField(p, 'costPrice', v);
                        }}
                        className="w-full px-2 py-1 rounded-lg bg-bg border border-line font-mono font-bold text-muted"
                      />
                    </td>
                    <td className="p-2 font-mono font-black">
                      {margin === null ? (
                        <span className="text-muted text-[10px]">—</span>
                      ) : (
                        <span className={margin < 15 ? 'text-rose-500' : 'text-emerald-500'}>{margin}%</span>
                      )}
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        defaultValue={Number(p.stock || 0)}
                        onBlur={e => {
                          const v = Math.max(0, Number(e.target.value) || 0);
                          if (v !== Number(p.stock || 0)) applyInlineField(p, 'stock', v);
                        }}
                        className={`w-full px-2 py-1 rounded-lg bg-bg border font-mono font-black ${
                          Number(p.stock || 0) <= 0 ? 'border-rose-500 text-rose-500' :
                          Number(p.stock || 0) <= (Number(p.lowStockThreshold) || 5) ? 'border-amber-500 text-amber-500' :
                          'border-line text-fg'
                        }`}
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleHideParts && onToggleHideParts([p.id], !isHidden)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black inline-flex items-center gap-1 ${
                          isHidden ? 'bg-rose-500/15 text-rose-500' : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isHidden ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{isHidden ? 'مخفي' : 'ظاهر'}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-line bg-surface2/50 flex items-center justify-between text-xs font-bold">
          <span className="text-muted">صفحة {safePage} من {totalPages} ({filtered.length} منتج)</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 rounded-lg bg-surface border border-line disabled:opacity-40"
            >
              السابق
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 rounded-lg bg-surface border border-line disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
