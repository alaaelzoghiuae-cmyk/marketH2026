import React, { useState, useMemo, useEffect } from 'react';
import {
  ClipboardList, Search, Download, TrendingUp, AlertTriangle, Bell, X,
  CheckCircle2, Clock, Truck, Ban, Sparkles, ArrowUpRight, Layers, Users, Package
} from 'lucide-react';

// Board stages MUST be the store's real order statuses (App.jsx
// ORDER_STATUS_FLOW) — writing any other value breaks customer tracking.
const ORDER_STAGES = [
  { id: 'تم الاستلام', label: 'جديد — تم الاستلام', tone: 'blue' },
  { id: 'جاري التجهيز', label: 'جاري التجهيز', tone: 'violet' },
  { id: 'جاهز للتسليم', label: 'جاهز للتسليم', tone: 'amber' },
  { id: 'في الطريق (دليفري)', label: 'في الطريق (دليفري)', tone: 'cyan' },
  { id: 'تم التسليم', label: 'تم التسليم', tone: 'emerald' },
  { id: 'ملغي', label: 'ملغي', tone: 'rose' }
];

const normalizeStage = (st) => {
  const s = String(st || '').trim();
  // Legacy board values heal to the closest real status on read.
  if (!s || s === 'pending' || s === 'جديد' || s === 'قيد المراجعة') return 'تم الاستلام';
  if (s === 'Delivered') return 'تم التسليم';
  if (s === 'جاري التوصيل') return 'في الطريق (دليفري)';
  if (ORDER_STAGES.some(x => x.id === s)) return s;
  return 'تم الاستلام';
};

// Orders carry no total field — the invoice total is computed from items.
const orderTotal = (o) => {
  const direct = Number(o?.total || o?.grandTotal || 0);
  if (direct > 0) return direct;
  const itemsSum = (Array.isArray(o?.items) ? o.items : []).reduce(
    (sum, i) => sum + (Number(i.qty) || 0) * (Number(i.unitPriceBase) || 0), 0);
  return Math.max(0, itemsSum + (Number(o?.deliveryFeeBase) || 0) - (Number(o?.discountBase) || 0));
};

const orderPhone = (o) => o?.clientPhone || o?.phone || o?.customerPhone || '';

/**
 * FEATURE 5 — ORDER WORKFLOW MANAGEMENT (Kanban + Table View + CSV Export)
 */
export function OrderWorkflowBoard({ orders = [], onUpdateOrderStatus, showToast }) {
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter(o => {
      const st = normalizeStage(o.status);
      if (stageFilter !== 'ALL' && st !== stageFilter) return false;
      if (!q) return true;
      return `${o.id || ''} ${o.customerName || o.clientName || ''} ${orderPhone(o)} ${o.address || ''}`
        .toLowerCase()
        .includes(q);
    });
  }, [orders, search, stageFilter]);

  const exportCsv = () => {
    const header = ['Order ID', 'Customer', 'Phone', 'Status', 'Total EGP', 'Date'];
    const rows = filteredOrders.map(o => [
      o.id || '',
      `"${String(o.customerName || o.clientName || '').replace(/"/g, '""')}"`,
      orderPhone(o),
      normalizeStage(o.status),
      orderTotal(o),
      o.createdAt || ''
    ]);
    const csv = '\uFEFF' + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elzoghbi_orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    if (showToast) showToast('تم تصدير ملف الطلبات CSV بنجاح ✓', 'success');
  };

  return (
    <div className="space-y-4 text-xs elz-fade-in">
      <div className="bg-surface rounded-3xl p-4 sm:p-5 border border-line shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-black text-fg flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#2563EB]" />
              <span>لوحة سير عمل الطلبات (Order Workflow — {filteredOrders.length})</span>
            </h2>
            <p className="text-[11px] text-muted">تبديل فوري بين عرض المراحل (Kanban) وعرض الجدول، مع تحديث حالة الطلب بضغطة واحدة وتصدير CSV.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-surface2 p-1 rounded-xl border border-line">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 rounded-lg font-extrabold ${viewMode === 'kanban' ? 'bg-[#2563EB] text-white' : 'text-muted'}`}
              >
                مراحل (Kanban)
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg font-extrabold ${viewMode === 'table' ? 'bg-[#2563EB] text-white' : 'text-muted'}`}
              >
                جدول
              </button>
            </div>
            <button
              type="button"
              onClick={exportCsv}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تصدير CSV</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="بحث برقم الطلب أو اسم العميل أو الهاتف..."
              className="w-full pr-9 pl-3 py-2 rounded-xl bg-bg border border-line font-bold"
            />
          </div>
          <select
            value={stageFilter}
            onChange={e => setStageFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-bg border border-line font-bold"
          >
            <option value="ALL">كل المراحل</option>
            {ORDER_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {ORDER_STAGES.filter(st => stageFilter === 'ALL' || stageFilter === st.id).map(stage => {
            const colOrders = filteredOrders.filter(o => normalizeStage(o.status) === stage.id);
            return (
              <div key={stage.id} className="bg-surface rounded-2xl border border-line p-3 space-y-2.5 flex flex-col max-h-[540px]">
                <div className="flex items-center justify-between pb-2 border-b border-line">
                  <span className="font-black text-fg">{stage.label}</span>
                  <span className="px-2 py-0.5 rounded-full bg-surface2 text-muted font-black text-[10px]">{colOrders.length}</span>
                </div>
                <div className="space-y-2 overflow-y-auto flex-1">
                  {colOrders.length === 0 && (
                    <div className="py-8 text-center text-muted text-[11px] font-bold">لا توجد طلبات في هذه المرحلة</div>
                  )}
                  {colOrders.map(o => (
                    <div key={o.id} className="p-3 rounded-xl bg-bg border border-line space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-black text-[#2563EB] dark:text-[#60A5FA]">#{o.id}</span>
                        <span className="font-mono font-black text-fg">{orderTotal(o).toLocaleString()} ج.م</span>
                      </div>
                      <div className="font-extrabold text-fg truncate">{o.customerName || o.clientName || 'عميل'}</div>
                      <div className="text-[10px] text-muted flex items-center justify-between">
                        <span>{orderPhone(o) || '—'}</span>
                        <span>{(o.items || []).length} صنف</span>
                      </div>
                      {typeof onUpdateOrderStatus === 'function' && (
                        <select
                          value={normalizeStage(o.status)}
                          onChange={e => onUpdateOrderStatus(o.id, e.target.value)}
                          className="w-full px-2 py-1 rounded-lg bg-surface border border-line text-[11px] font-extrabold text-fg"
                        >
                          {ORDER_STAGES.map(s => <option key={s.id} value={s.id}>نقل إلى: {s.label}</option>)}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-surface rounded-3xl border border-line overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[680px]">
            <thead className="bg-surface2 border-b border-line text-[11px] font-black text-muted">
              <tr>
                <th className="p-3">رقم الطلب</th>
                <th className="p-3">العميل</th>
                <th className="p-3">الهاتف</th>
                <th className="p-3">الأصناف</th>
                <th className="p-3">الإجمالي</th>
                <th className="p-3">المرحلة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredOrders.map(o => (
                <tr key={o.id} className="hover:bg-surface2/40">
                  <td className="p-3 font-mono font-black text-[#2563EB]">#{o.id}</td>
                  <td className="p-3 font-extrabold text-fg">{o.customerName || o.clientName || 'عميل'}</td>
                  <td className="p-3 font-mono text-muted">{orderPhone(o) || '—'}</td>
                  <td className="p-3 font-bold">{(o.items || []).length}</td>
                  <td className="p-3 font-mono font-black">{orderTotal(o).toLocaleString()} ج.م</td>
                  <td className="p-3">
                    {typeof onUpdateOrderStatus === 'function' ? (
                      <select
                        value={normalizeStage(o.status)}
                        onChange={e => onUpdateOrderStatus(o.id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg bg-bg border border-line font-extrabold"
                      >
                        {ORDER_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    ) : normalizeStage(o.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * FEATURE 7 — BUSINESS INTELLIGENCE & EXECUTIVE ANALYTICS (100% Real Data)
 */
export function BusinessIntelligenceView({ parts = [], orders = [], clients = [], normalizePartCategory }) {
  const [dateRange, setDateRange] = useState('ALL'); // 'ALL' | 'TODAY' | '7D' | '30D' | 'THIS_MONTH'

  const filteredOrders = useMemo(() => {
    const now = new Date();
    const pad2 = n => String(n).padStart(2, '0');
    const todayStr = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
    const thisMonthStr = todayStr.slice(0, 7);
    const nowTs = now.getTime();
    return orders.filter(o => {
      if (dateRange === 'ALL') return true;
      const d = String(o.createdAt || o.created_at || o.date || '');
      if (dateRange === 'TODAY') return d.startsWith(todayStr);
      if (dateRange === 'THIS_MONTH') return d.startsWith(thisMonthStr);
      const ts = Date.parse(d.replace(' ', 'T'));
      if (Number.isNaN(ts)) return false;
      if (dateRange === '7D') return ts <= nowTs && nowTs - ts <= 7 * 86400000;
      if (dateRange === '30D') return ts <= nowTs && nowTs - ts <= 30 * 86400000;
      return true;
    });
  }, [orders, dateRange]);

  const bi = useMemo(() => {
    const valid = filteredOrders.filter(o => normalizeStage(o.status) !== 'ملغي');
    const cancelled = filteredOrders.filter(o => normalizeStage(o.status) === 'ملغي');
    const delivered = filteredOrders.filter(o => normalizeStage(o.status) === 'تم التسليم');
    const revenue = valid.reduce((s, o) => s + orderTotal(o), 0);
    const deliveredRevenue = delivered.reduce((s, o) => s + orderTotal(o), 0);
    const aov = valid.length ? Math.round(revenue / valid.length) : 0;

    // Category distribution & inventory value
    const catMap = {};
    let totalInventoryCost = 0;
    let totalInventoryRetail = 0;
    let weakMarginCount = 0;
    let lowStockCount = 0;

    for (const p of parts) {
      const c = normalizePartCategory ? normalizePartCategory(p.category, p.name) : (p.category || 'أخرى');
      const st = Math.max(0, Number(p.stock || 0));
      const base = Number(p.basePrice || 0);
      const cost = Number(p.costPrice || 0);
      totalInventoryRetail += st * base;
      totalInventoryCost += st * cost;
      if (st > 0 && st <= Number(p.lowStockThreshold || 5)) lowStockCount++;
      if (cost > 0 && base > 0 && ((base - cost) / base) * 100 < 15) weakMarginCount++;
      if (!catMap[c]) catMap[c] = { name: c, count: 0, stock: 0, value: 0 };
      catMap[c].count += 1;
      catMap[c].stock += st;
      catMap[c].value += st * base;
    }

    const topCategories = Object.values(catMap).sort((a, b) => b.count - a.count).slice(0, 8);
    const maxCatCount = Math.max(1, ...topCategories.map(x => x.count));

    const stageDist = ORDER_STAGES.map(st => ({
      ...st,
      count: filteredOrders.filter(o => normalizeStage(o.status) === st.id).length
    }));

    return {
      revenue,
      deliveredRevenue,
      aov,
      validCount: valid.length,
      deliveredCount: delivered.length,
      cancelledCount: cancelled.length,
      totalInventoryRetail,
      totalInventoryCost,
      weakMarginCount,
      lowStockCount,
      topCategories,
      maxCatCount,
      stageDist
    };
  }, [filteredOrders, parts, normalizePartCategory]);

  return (
    <div className="space-y-4 text-xs elz-fade-in">
      {/* Header + Date Filter */}
      <div className="bg-surface rounded-3xl p-4 sm:p-5 border border-line shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-black text-fg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#2563EB]" />
            <span>لوحة تحليلات الأعمال الحقيقية (Business Intelligence)</span>
          </h2>
          <p className="text-[11px] text-muted">جميع الأرقام محسوبة مباشرة من قاعدة بياناتك الفعلية بدون أي أرقام تقديرية وهمية.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            ['ALL', 'كل الفترات'],
            ['TODAY', 'اليوم'],
            ['7D', 'آخر 7 أيام'],
            ['30D', 'آخر 30 يوم'],
            ['THIS_MONTH', 'هذا الشهر']
          ].map(([k, lbl]) => (
            <button
              key={k}
              type="button"
              onClick={() => setDateRange(k)}
              className={`px-3 py-1.5 rounded-xl font-extrabold border transition ${
                dateRange === k ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-surface2 text-fg border-line'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* Real KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-sm">
          <div className="text-[11px] font-bold text-muted">قيمة الطلبات (غير الملغاة)</div>
          <div className="text-xl font-black text-[#2563EB] dark:text-[#60A5FA] font-mono mt-1">{bi.revenue.toLocaleString()} ج.م</div>
          <div className="text-[10px] text-muted mt-1">{bi.validCount} طلب فعال • {bi.cancelledCount} ملغي • منها مُسلّمة فعلياً: {bi.deliveredRevenue.toLocaleString()} ج.م</div>
        </div>
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-sm">
          <div className="text-[11px] font-bold text-muted">متوسط قيمة الطلب (AOV)</div>
          <div className="text-xl font-black text-emerald-500 font-mono mt-1">{bi.aov.toLocaleString()} ج.م</div>
          <div className="text-[10px] text-muted mt-1">تم التسليم: {bi.deliveredCount} طلب</div>
        </div>
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-sm">
          <div className="text-[11px] font-bold text-muted">قيمة المخزون الحالية (سعر بيع)</div>
          <div className="text-xl font-black text-fg font-mono mt-1">{bi.totalInventoryRetail.toLocaleString()} ج.م</div>
          <div className="text-[10px] text-muted mt-1">التكلفة المسجلة: {bi.totalInventoryCost.toLocaleString()} ج.م</div>
        </div>
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-sm">
          <div className="text-[11px] font-bold text-muted">العملاء المسجلون</div>
          <div className="text-xl font-black text-violet-500 font-mono mt-1">{clients.length}</div>
          <div className="text-[10px] text-muted mt-1">مخزون منخفض: {bi.lowStockCount} منتج</div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Performance Bar Chart */}
        <div className="bg-surface rounded-3xl p-4 sm:p-5 border border-line space-y-3">
          <h3 className="font-black text-sm text-fg">توزيع المنتجات وقيمة المخزون حسب التصنيف</h3>
          <div className="space-y-2.5">
            {bi.topCategories.map(cat => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-extrabold">
                  <span className="text-fg">{cat.name}</span>
                  <span className="text-muted font-mono">{cat.count} منتج • {cat.value.toLocaleString()} ج.م</span>
                </div>
                <div className="h-2.5 rounded-full bg-surface2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-l from-[#2563EB] to-[#60A5FA]"
                    style={{ width: `${Math.max(6, (cat.count / bi.maxCatCount) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Distribution + AI Insights */}
        <div className="space-y-4">
          <div className="bg-surface rounded-3xl p-4 sm:p-5 border border-line space-y-3">
            <h3 className="font-black text-sm text-fg">توزيع حالات الطلبات في الفترة المحددة</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {bi.stageDist.map(s => (
                <div key={s.id} className="p-2.5 rounded-xl bg-bg border border-line text-center">
                  <div className="text-base font-black text-fg font-mono">{s.count}</div>
                  <div className="text-[10px] font-bold text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-l from-[#0B1F52] to-[#1E3A8A] text-white rounded-3xl p-4 sm:p-5 border border-[#3B82F6]/40 space-y-2">
            <div className="flex items-center gap-1.5 font-black text-xs text-amber-300">
              <Sparkles className="w-4 h-4" />
              <span>توصيات الذكاء الاصطناعي التشغيلية (مبنية على بياناتك)</span>
            </div>
            <ul className="space-y-1.5 text-[11px] font-semibold text-blue-100 list-disc pr-4">
              {bi.lowStockCount > 0 && <li>لديك {bi.lowStockCount} منتج بمخزون منخفض يحتاج إعادة تعبئة قبل نفاده.</li>}
              {bi.weakMarginCount > 0 && <li>يوجد {bi.weakMarginCount} منتج بهامش ربح أقل من 15% — راجعها في محرك التسعير الذكي لتحسين صافي الربح.</li>}
              {bi.topCategories[0] && <li>تصنيف "{bi.topCategories[0].name}" هو الأكبر في متجرك ({bi.topCategories[0].count} منتج) — اجعله ضمن اختصارات البحث السريعة لرفع معدل التحويل.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * FEATURE 10 — GLOBAL KEYBOARD COMMAND PALETTE (Ctrl+K)
 */
export function AdminCommandPalette({ open, onClose, parts = [], orders = [], clients = [], onNavigateTab, onOpenAi }) {
  const [q, setQ] = useState('');

  useEffect(() => {
    if (open) setQ('');
  }, [open]);

  if (!open) return null;

  const low = q.trim().toLowerCase();
  const quickCommands = [
    { label: 'فتح مركز الأوامر الذكي (AI Command Center)', action: () => { onClose(); onOpenAi && onOpenAi(); } },
    { label: 'وكيل الاستيراد الذكي من المواقع (AI Product Sourcing)', action: () => { onNavigateTab('ai_product_sourcing'); onClose(); } },
    { label: 'استيراد منتجات جديدة بروابط الصور (Bulk Importer)', action: () => { onNavigateTab('bulk_importer'); onClose(); } },
    { label: 'إدارة المنتجات السريعة (جدول Excel)', action: () => { onNavigateTab('excel_products'); onClose(); } },
    { label: 'محرك التسعير الذكي ومحاكاة الأرباح', action: () => { onNavigateTab('smart_pricing'); onClose(); } },
    { label: 'فحص جودة الكتالوج وإدارة الصور', action: () => { onNavigateTab('quality_images'); onClose(); } },
    { label: 'لوحة سير الطلبات (Kanban)', action: () => { onNavigateTab('order_workflow'); onClose(); } },
    { label: 'تحليلات الأعمال الحقيقية (BI)', action: () => { onNavigateTab('bi_analytics'); onClose(); } },
    { label: 'استوديو الواجهة والإعلانات والبراندات', action: () => { onNavigateTab('storefront_cms'); onClose(); } }
  ].filter(c => !low || c.label.toLowerCase().includes(low));

  const matchedParts = low
    ? parts.filter(p => `${p.name || ''} ${p.sku || ''}`.toLowerCase().includes(low)).slice(0, 6)
    : [];
  const matchedOrders = low
    ? orders.filter(o => `${o.id || ''} ${o.customerName || o.clientName || ''} ${o.phone || ''}`.toLowerCase().includes(low)).slice(0, 5)
    : [];
  const matchedClients = low
    ? clients.filter(c => `${c.name || ''} ${c.phone || ''}`.toLowerCase().includes(low)).slice(0, 4)
    : [];

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16 px-3" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-xl bg-surface dark:bg-[#070D1D] border-2 border-[#3B82F6]/45 rounded-3xl shadow-2xl overflow-hidden elz-slide-up">
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-line">
          <Search className="w-4 h-4 text-[#2563EB] shrink-0" />
          <input
            autoFocus
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="ابحث عن منتج، SKU، طلب، عميل، أو نفّذ أمراً سريعاً..."
            className="flex-1 bg-transparent text-fg text-xs sm:text-sm font-bold focus:outline-none"
          />
          <span className="text-[10px] px-2 py-0.5 rounded bg-surface2 text-muted font-mono">ESC</span>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-3 text-xs">
          <div className="space-y-1">
            <div className="text-[10px] font-black text-muted px-2">أوامر سريعة</div>
            {quickCommands.map((cmd, idx) => (
              <button
                key={idx}
                type="button"
                onClick={cmd.action}
                className="w-full px-3 py-2 rounded-xl hover:bg-[#2563EB] hover:text-white text-right font-extrabold text-fg flex items-center justify-between transition"
              >
                <span>{cmd.label}</span>
                <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
              </button>
            ))}
          </div>

          {matchedParts.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-line">
              <div className="text-[10px] font-black text-muted px-2">المنتجات ({matchedParts.length})</div>
              {matchedParts.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onNavigateTab('excel_products'); onClose(); }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-surface2 text-right flex items-center justify-between"
                >
                  <span className="font-bold text-fg truncate">{p.name}</span>
                  <span className="font-mono text-[11px] text-[#2563EB] shrink-0">{Number(p.basePrice || 0).toLocaleString()} ج.م</span>
                </button>
              ))}
            </div>
          )}

          {matchedOrders.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-line">
              <div className="text-[10px] font-black text-muted px-2">الطلبات ({matchedOrders.length})</div>
              {matchedOrders.map(o => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => { onNavigateTab('order_workflow'); onClose(); }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-surface2 text-right flex items-center justify-between"
                >
                  <span className="font-bold text-fg">#{o.id} — {o.customerName || o.clientName || 'عميل'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface2 text-muted font-black">{normalizeStage(o.status)}</span>
                </button>
              ))}
            </div>
          )}

          {matchedClients.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-line">
              <div className="text-[10px] font-black text-muted px-2">العملاء ({matchedClients.length})</div>
              {matchedClients.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { onNavigateTab('clients'); onClose(); }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-surface2 text-right flex items-center justify-between"
                >
                  <span className="font-bold text-fg">{c.name}</span>
                  <span className="font-mono text-[11px] text-muted">{c.phone}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * FEATURE 9 — ACTIONABLE SMART NOTIFICATIONS CENTER
 */
export function SmartNotificationsPopover({ open, onClose, parts = [], orders = [], onNavigateTab }) {
  if (!open) return null;

  const outOfStock = parts.filter(p => Number(p.stock || 0) <= 0).length;
  const lowStock = parts.filter(p => Number(p.stock || 0) > 0 && Number(p.stock || 0) <= Number(p.lowStockThreshold || 5)).length;
  const newOrders = orders.filter(o => normalizeStage(o.status) === 'تم الاستلام').length;
  const missingImages = parts.filter(p => (!Array.isArray(p.images) || p.images.length === 0) && !p.image && !p.imageUrl).length;

  const alerts = [
    newOrders > 0 && { title: `${newOrders} طلب جديد بانتظار المراجعة`, desc: 'اضغط لفتح لوحة سير الطلبات', tone: 'blue', tab: 'order_workflow' },
    outOfStock > 0 && { title: `${outOfStock} منتج نفد مخزونه (0)`, desc: 'اضغط لتحديث الكميات فوراً في جدول Excel', tone: 'rose', tab: 'excel_products' },
    lowStock > 0 && { title: `${lowStock} منتج بمخزون منخفض`, desc: 'يُنصح بإعادة التوفير قبل النفاد', tone: 'amber', tab: 'excel_products' },
    missingImages > 0 && { title: `${missingImages} منتج بدون صور`, desc: 'اضغط لإضافة روابط صور من مساعد الجودة', tone: 'violet', tab: 'quality_images' }
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-[75]" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="absolute top-16 left-4 w-[320px] max-w-[92vw] bg-surface dark:bg-[#0B1224] border border-line rounded-2xl shadow-2xl p-3 space-y-2 elz-fade-in"
      >
        <div className="flex items-center justify-between pb-2 border-b border-line">
          <span className="font-black text-xs text-fg flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-[#2563EB]" />
            <span>التنبيهات الذكية ({alerts.length})</span>
          </span>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-surface2">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {alerts.length === 0 ? (
          <div className="py-6 text-center text-xs text-emerald-500 font-extrabold">
            ✓ كل شيء يعمل بشكل ممتاز ولا توجد تنبيهات عاجلة
          </div>
        ) : (
          <div className="space-y-1.5">
            {alerts.map((al, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => { onNavigateTab(al.tab); onClose(); }}
                className="w-full p-2.5 rounded-xl bg-bg hover:bg-surface2 border border-line text-right transition flex items-center justify-between gap-2"
              >
                <div>
                  <div className="font-extrabold text-xs text-fg">{al.title}</div>
                  <div className="text-[10px] text-muted">{al.desc}</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-[#2563EB] shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
