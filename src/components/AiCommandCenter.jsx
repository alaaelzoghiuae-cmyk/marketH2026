import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sparkles, X, Search, AlertTriangle, TrendingUp, Package, ClipboardList,
  DollarSign, Check, RefreshCw, ArrowUpRight, Layers, Plus, Filter
} from 'lucide-react';

/**
 * FEATURE 1 — AI COMMAND CENTER (ELZOGHBI MARKET)
 * Persistent operational AI assistant querying REAL live store state (parts, orders, clients, models).
 * Never hallucinates stats; requires explicit confirmation before any mutation.
 */
export default function AiCommandCenter({
  open,
  onClose,
  parts = [],
  orders = [],
  clients = [],
  models = [],
  brands = [],
  normalizePartCategory,
  onNavigateTab,
  onCreateProductFromAi,
  onApplyBulkPriceChange,
  showToast
}) {
  const [input, setInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'أهلاً بك في مركز الأوامر الذكي لمتجر ELZOGHBI. كل الإجابات هنا مبنية مباشرة على بيانات مخزنك وطلباتك الحقيقية، وأي تعديل على الأسعار أو المنتجات يتطلب موافقتك أولاً.',
      chips: [
        'المنتجات ذات المخزون المنخفض',
        'المنتجات ذات هامش ربح ضعيف',
        'ملخص طلبات اليوم',
        'أكثر المنتجات مبيعاً',
        'منتجات ينقصها صور أو وصف',
        'منتجات لم تُبع مؤخراً',
        'تنظيم التصنيفات',
        'تحليل مبيعات هذا الأسبوع'
      ]
    }
  ]);
  const listRef = useRef(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, open, pendingAction]);

  // Precompute REAL store analytics once per state change
  const liveMetrics = useMemo(() => {
    const cairoDay = (d) => {
      try { return d.toLocaleDateString('en-CA', { timeZone: 'Africa/Cairo' }); } catch (e) { return d.toISOString().slice(0, 10); }
    };
    const parseOrderTs = (raw) => {
      const c = String(raw || '').trim();
      if (!c) return NaN;
      let iso = c.replace(' ', 'T');
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(iso) && !/(Z|[+-]\d{2}:?\d{2})$/.test(iso)) iso += 'Z';
      return Date.parse(iso);
    };
    const todayStr = cairoDay(new Date());
    const weekAgoTs = Date.now() - 7 * 86400000;
    const soldQtyBySku = new Map();
    const soldRevBySku = new Map();
    let todayOrders = [];
    let weekOrders = [];
    let attentionOrders = [];

    for (const o of orders) {
      const created = String(o.createdAt || o.created_at || o.date || '');
      const status = String(o.status || '');
      const parsedTs0 = parseOrderTs(created);
      if (!Number.isNaN(parsedTs0) && cairoDay(new Date(parsedTs0)) === todayStr) todayOrders.push(o);
      const parsedTs = parsedTs0;
      if (!Number.isNaN(parsedTs) && parsedTs >= weekAgoTs) weekOrders.push(o);
      if (['تم الاستلام', 'جديد', 'قيد المراجعة', 'pending'].includes(status)) attentionOrders.push(o);
      if (status !== 'ملغي') {
        for (const it of (o.items || [])) {
          const sku = String(it.sku || it.partId || it.name || '');
          const qty = Number(it.qty || it.quantity || 1);
          const price = Number(it.unitPriceBase || it.unitPrice || it.price || 0);
          soldQtyBySku.set(sku, (soldQtyBySku.get(sku) || 0) + qty);
          soldRevBySku.set(sku, (soldRevBySku.get(sku) || 0) + qty * price);
        }
      }
    }

    const lowStock = parts.filter(p => Number(p.stock || 0) <= Number(p.lowStockThreshold || 2));
    const outOfStock = parts.filter(p => Number(p.stock || 0) <= 0);
    const lowMargin = parts.filter(p => {
      const cost = Number(p.costPrice || 0);
      const base = Number(p.basePrice || 0);
      if (cost <= 0 || base <= 0) return false;
      const marginPct = ((base - cost) / base) * 100;
      return marginPct < 15;
    });
    const missingImages = parts.filter(p => {
      const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
      return imgs.length === 0 && !p.image && !p.imageUrl;
    });
    const singleImage = parts.filter(p => {
      const imgs = Array.isArray(p.images) ? p.images.filter(Boolean) : (p.image ? [p.image] : []);
      return imgs.length <= 1;
    });
    const weakDesc = parts.filter(p => String(p.description || '').trim().length < 25);
    const unsold = parts.filter(p => !soldQtyBySku.has(String(p.sku || '')) && !soldQtyBySku.has(String(p.id || '')));
    const topSellers = [...parts]
      .map(p => ({
        part: p,
        soldQty: soldQtyBySku.get(String(p.sku || '')) || soldQtyBySku.get(String(p.id || '')) || 0,
        rev: soldRevBySku.get(String(p.sku || '')) || soldRevBySku.get(String(p.id || '')) || 0
      }))
      .filter(x => x.soldQty > 0)
      .sort((a, b) => b.soldQty - a.soldQty)
      .slice(0, 8);

    const catCounts = {};
    for (const p of parts) {
      const c = normalizePartCategory ? normalizePartCategory(p.category, p.name) : (p.category || 'غير مصنف');
      catCounts[c] = (catCounts[c] || 0) + 1;
    }

    return {
      todayOrders,
      weekOrders,
      attentionOrders,
      lowStock,
      outOfStock,
      lowMargin,
      missingImages,
      singleImage,
      weakDesc,
      unsold,
      topSellers,
      catCounts
    };
  }, [parts, orders, normalizePartCategory]);

  const handleCommand = (rawQuery) => {
    const q = String(rawQuery || input).trim();
    if (!q) return;
    setPendingAction(null);
    setInput('');
    const low = q.toLowerCase();
    const userMsg = { id: `u_${Date.now()}`, role: 'user', text: q };

    let reply = { id: `a_${Date.now() + 1}`, role: 'assistant', text: '', items: [], cta: null };

    // 1. Create product from image URL
    const urlMatch = q.match(/https?:\/\/[^\s]+/i);
    if (urlMatch && /(انشئ|أنشئ|اضف|أضف|منتج|create|add|product)/i.test(low)) {
      const imgUrl = urlMatch[0].replace(/[.,;!?)]+$/, '');
      const isSafeImg = /^https?:\/\/[^\s"'<>]+$/i.test(imgUrl);
      const guessedTitle = q.replace(imgUrl, '').replace(/(انشئ|أنشئ|اضف|أضف|منتج|جديد|بصورة|من|رابط|create|add|product|with|image|url)/gi, '').trim() || 'منتج جديد من رابط صورة';
      reply.text = `جهّزت لك مسودة منتج جديد باستخدام الرابط المرفق. راجع التفاصيل واضغط تأكيد لإضافته للمخزن:`;
      setPendingAction({
        type: 'CREATE_PRODUCT',
        label: `إضافة منتج: ${guessedTitle} — سعر بيع 350 ج.م • تكلفة 250 ج.م • مخزون 5 (قيم افتراضية مؤقتة، عدّلها من إدارة المنتجات بعد الإنشاء)`,
        payload: {
          name: guessedTitle,
          image: isSafeImg ? imgUrl : '',
          category: normalizePartCategory ? normalizePartCategory('', guessedTitle) || 'شواحن' : 'شواحن',
          basePrice: 350,
          costPrice: 250,
          stock: 5
        }
      });
    }
    // 2. Low stock / out of stock
    else if (/(مخزون|نقص|منخفض|نفد|low\s*stock|out\s*of\s*stock|inventory)/i.test(low)) {
      const list = liveMetrics.lowStock.slice(0, 10);
      reply.text = `إجمالي المنتجات منخفضة المخزون حالياً: ${liveMetrics.lowStock.length} منتج (منهم ${liveMetrics.outOfStock.length} نفد بالكامل من إجمالي ${parts.length} منتج).`;
      reply.items = list.map(p => ({
        title: p.name,
        meta: `SKU: ${p.sku || p.id} • المخزون: ${p.stock} • السعر: ${Number(p.basePrice || 0).toLocaleString()} ج.م`,
        badge: Number(p.stock || 0) <= 0 ? 'نفد' : 'منخفض',
        badgeTone: Number(p.stock || 0) <= 0 ? 'rose' : 'amber'
      }));
      reply.cta = { label: 'فتح جدول إدارة المنتجات (Excel)', tab: 'excel_products' };
    }
    // 3. Low profit margin
    else if (/(هامش|ربح|margin|profit|تسعير|سعر|price)/i.test(low)) {
      if (/(رفع|زود|تحديث|increase|update).*\d+\s*%/i.test(low)) {
        const pctMatch = low.match(/(\d+)\s*%/);
        const pct = pctMatch ? Number(pctMatch[1]) : 10;
        const targetCount = liveMetrics.lowMargin.length || parts.length;
        reply.text = `اقتراح تعديل أسعار: زيادة بنسبة +${pct}% على ${liveMetrics.lowMargin.length > 0 ? `${liveMetrics.lowMargin.length} منتج ضعيف الهامش` : `كل المنتجات (${targetCount})`}. لن يتم تطبيق أي تعديل إلا بعد موافقتك:`;
        setPendingAction({
          type: 'BULK_PRICE_PCT',
          label: `زيادة الأسعار بنسبة +${pct}% (${liveMetrics.lowMargin.length > 0 ? 'المنتجات ضعيفة الهامش' : 'الكتالوج'})`,
          payload: { pct, ids: (liveMetrics.lowMargin.length > 0 ? liveMetrics.lowMargin : parts).map(p => p.id) }
        });
      } else {
        const list = liveMetrics.lowMargin.slice(0, 10);
        reply.text = list.length > 0
          ? `تم رصد ${liveMetrics.lowMargin.length} منتج بهامش ربح أقل من 15% (بناءً على سعر التكلفة وسعر البيع الفعليين):`
          : `ممتاز! لا توجد منتجات بهامش ربح أقل من 15% بين المنتجات التي تحتوي على سعر تكلفة مسجل.`;
        reply.items = list.map(p => {
          const base = Number(p.basePrice || 0);
          const cost = Number(p.costPrice || 0);
          const m = base > 0 ? (((base - cost) / base) * 100).toFixed(1) : '0';
          return {
            title: p.name,
            meta: `التكلفة: ${cost.toLocaleString()} ج.م • البيع: ${base.toLocaleString()} ج.م`,
            badge: `هامش ${m}%`,
            badgeTone: 'rose'
          };
        });
        reply.cta = { label: 'فتح محرك التسعير الذكي', tab: 'smart_pricing' };
      }
    }
    // 4. Today's orders / attention orders
    else if (/(طلبات|اوردرات|أوردرات|اليوم|تحتاج|متابعة|orders|today|attention)/i.test(low)) {
      const isAttention = /(تحتاج|متابعة|معلقة|جديد|attention|pending)/i.test(low);
      const list = isAttention ? liveMetrics.attentionOrders : liveMetrics.todayOrders;
      const sum = list.reduce((acc, o) => acc + Number(o.total || o.grandTotal || 0), 0);
      reply.text = isAttention
        ? `يوجد ${list.length} طلب يحتاج لمراجعة أو تجهيز حالياً بإجمالي ${sum.toLocaleString()} ج.م (من أصل ${orders.length} طلب مسجل).`
        : `طلبات اليوم: ${list.length} طلب بإجمالي ${sum.toLocaleString()} ج.م. إجمالي الطلبات التي تحتاج متابعة حالياً: ${liveMetrics.attentionOrders.length}.`;
      reply.items = list.slice(0, 8).map(o => ({
        title: `طلب #${o.id || o.orderNumber || ''} — ${o.customerName || o.clientName || 'عميل'}`,
        meta: `الإجمالي: ${Number(o.total || o.grandTotal || 0).toLocaleString()} ج.م • ${o.createdAt || ''}`,
        badge: o.status || 'جديد',
        badgeTone: 'blue'
      }));
      reply.cta = { label: 'فتح لوحة سير الطلبات (Kanban)', tab: 'order_workflow' };
    }
    // 5. Best sellers
    else if (/(أكثر مبيع|الأكثر|مبيعا|best\s*sell|top)/i.test(low)) {
      reply.text = liveMetrics.topSellers.length > 0
        ? `أكثر المنتجات مبيعاً بناءً على سجل الطلبات الفعلي (${orders.length} طلب):`
        : `لا توجد مبيعات مسجلة كافية في سجل الطلبات الحالي لتصنيف الأكثر مبيعاً.`;
      reply.items = liveMetrics.topSellers.map(x => ({
        title: x.part.name,
        meta: `إيراد فعلي: ${x.rev.toLocaleString()} ج.م • المخزون المتبقي: ${x.part.stock}`,
        badge: `${x.soldQty} قطعة`,
        badgeTone: 'emerald'
      }));
      reply.cta = { label: 'فتح تحليلات الأعمال (BI)', tab: 'bi_analytics' };
    }
    // 6. Weekly sales summary
    else if (/(أسبوع|اسبوع|مبيعات|تحليل|week|sales|revenue|summarize)/i.test(low)) {
      const validWeek = liveMetrics.weekOrders.filter(o => o.status !== 'ملغي');
      const weekRev = validWeek.reduce((s, o) => s + Number(o.total || o.grandTotal || 0), 0);
      const aov = validWeek.length > 0 ? Math.round(weekRev / validWeek.length) : 0;
      reply.text = `ملخص آخر 7 أيام (بيانات فعلية): ${validWeek.length} طلب غير ملغي بإجمالي مبيعات ${weekRev.toLocaleString()} ج.م، ومتوسط قيمة الطلب (AOV): ${aov.toLocaleString()} ج.م. إجمالي العملاء المسجلين: ${clients.length}.`;
      reply.cta = { label: 'فتح لوحة تحليلات الأعمال (BI)', tab: 'bi_analytics' };
    }
    // 7. Missing images / incomplete descriptions
    else if (/(صور|وصف|ناقص|جودة|missing|image|description|incomplete)/i.test(low)) {
      reply.text = `نتائج فحص جودة الكتالوج (${parts.length} منتج): • بدون صور نهائياً: ${liveMetrics.missingImages.length} • بصورة واحدة فقط: ${liveMetrics.singleImage.length} • بوصف قصير أو ناقص: ${liveMetrics.weakDesc.length}.`;
      reply.items = [...new Map([...liveMetrics.missingImages, ...liveMetrics.weakDesc].map(p => [p.id, p])).values()].slice(0, 8).map(p => ({
        title: p.name,
        meta: `التصنيف: ${p.category || 'غير مصنف'} • الصور: ${(p.images || []).length || (p.image ? 1 : 0)}`,
        badge: 'يحتاج تحسين',
        badgeTone: 'amber'
      }));
      reply.cta = { label: 'فتح مساعد جودة المنتجات والصور', tab: 'quality_images' };
    }
    // 8. Slow moving / unsold
    else if (/(لم تُبع|راكد|بطيء|unsold|slow|haven)/i.test(low)) {
      reply.text = `يوجد ${liveMetrics.unsold.length} منتج لم يسجل مبيعات في سجل الطلبات الحالي. يُنصح بعمل عروض ترويجية أو تفعيل الكاش باك على أبرزها:`;
      reply.items = liveMetrics.unsold.slice(0, 8).map(p => ({
        title: p.name,
        meta: `المخزون: ${p.stock} • السعر: ${Number(p.basePrice || 0).toLocaleString()} ج.م`,
        badge: 'بدون مبيعات',
        badgeTone: 'slate'
      }));
      reply.cta = { label: 'فتح تحليلات الأعمال (BI)', tab: 'bi_analytics' };
    }
    // 9. Categories organization
    else if (/(تصنيف|أقسام|اقسام|categor|organiz)/i.test(low)) {
      const entries = Object.entries(liveMetrics.catCounts).sort((a, b) => b[1] - a[1]);
      reply.text = `لديك حالياً ${entries.length} تصنيف موحّد ونظيف تغطي ${parts.length} منتجاً:`;
      reply.items = entries.slice(0, 12).map(([c, cnt]) => ({
        title: c,
        meta: `تمثل ${((cnt / Math.max(1, parts.length)) * 100).toFixed(1)}% من الكتالوج`,
        badge: `${cnt} منتج`,
        badgeTone: 'blue'
      }));
    }
    // Default helpful summary
    else {
      reply.text = `حالة المتجر الحالية: ${parts.length} منتج عبر ${brands.length} براند، ${orders.length} طلب (${liveMetrics.attentionOrders.length} بانتظار المراجعة)، و${liveMetrics.lowStock.length} منتج منخفض المخزون. جرب أحد الأوامر السريعة بالأسفل أو اكتب "أضف منتج [الاسم] [رابط الصورة]".`;
      reply.chips = ['المنتجات ذات المخزون المنخفض', 'ملخص طلبات اليوم', 'منتجات ينقصها صور أو وصف', 'المنتجات ذات هامش ربح ضعيف'];
    }

    setMessages(prev => [...prev, userMsg, reply]);
  };

  const confirmPendingAction = () => {
    if (!pendingAction) return;
    if (pendingAction.type === 'CREATE_PRODUCT' && typeof onCreateProductFromAi === 'function') {
      onCreateProductFromAi(pendingAction.payload);
      setMessages(prev => [...prev, {
        id: `ok_${Date.now()}`,
        role: 'assistant',
        text: `✅ تم إنشاء المنتج "${pendingAction.payload.name}" وإضافته للكتالوج بنجاح.`
      }]);
    } else if (pendingAction.type === 'BULK_PRICE_PCT' && typeof onApplyBulkPriceChange === 'function') {
      onApplyBulkPriceChange(pendingAction.payload.ids, pendingAction.payload.pct);
      setMessages(prev => [...prev, {
        id: `ok_${Date.now()}`,
        role: 'assistant',
        text: `✅ تم تحديث أسعار ${pendingAction.payload.ids.length} منتج بنسبة +${pendingAction.payload.pct}% بنجاح.`
      }]);
    }
    const executed =
      (pendingAction.type === 'CREATE_PRODUCT' && typeof onCreateProductFromAi === 'function') ||
      (pendingAction.type === 'BULK_PRICE_PCT' && typeof onApplyBulkPriceChange === 'function');
    setPendingAction(null);
    if (showToast) {
      if (executed) showToast('تم تنفيذ الإجراء بعد تأكيدك ✓', 'success');
      else showToast('⚠️ تعذّر تنفيذ الإجراء — المعالج غير متاح حالياً.', 'error');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-[460px] h-full bg-surface dark:bg-[#070D1D] border-r border-line shadow-2xl flex flex-col elz-slide-up"
      >
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-line flex items-center justify-between gap-2 bg-gradient-to-l from-[#0B1F52] to-[#1E3A8A] text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black truncate">مركز الأوامر الذكي (AI Command Center)</h3>
              <p className="text-[10px] text-blue-100/85 truncate">متصل ببيانات المتجر الفعلية • {parts.length} منتج • {orders.length} طلب</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Quick Stats Strip */}
        <div className="px-3 py-2 border-b border-line bg-surface2/60 grid grid-cols-3 gap-2 text-center text-[10px] font-extrabold">
          <button type="button" onClick={() => handleCommand('المنتجات ذات المخزون المنخفض')} className="p-1.5 rounded-xl bg-surface border border-line hover:border-amber-500 transition">
            <div className="text-amber-500 text-xs font-black">{liveMetrics.lowStock.length}</div>
            <div className="text-muted">مخزون منخفض</div>
          </button>
          <button type="button" onClick={() => handleCommand('طلبات تحتاج متابعة')} className="p-1.5 rounded-xl bg-surface border border-line hover:border-[#1E4E8C] transition">
            <div className="text-[#1E4E8C] dark:text-[#7FB0E8] text-xs font-black">{liveMetrics.attentionOrders.length}</div>
            <div className="text-muted">طلبات للمتابعة</div>
          </button>
          <button type="button" onClick={() => handleCommand('منتجات ينقصها صور أو وصف')} className="p-1.5 rounded-xl bg-surface border border-line hover:border-rose-500 transition">
            <div className="text-rose-500 text-xs font-black">{liveMetrics.weakDesc.length + liveMetrics.missingImages.length}</div>
            <div className="text-muted">تحتاج تحسين</div>
          </button>
        </div>

        {/* Conversation Feed */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
          {messages.map(m => (
            <div key={m.id} className={`flex flex-col ${m.role === 'user' ? 'items-start' : 'items-end'}`}>
              <div
                className={`max-w-[92%] rounded-2xl p-3 space-y-2 ${
                  m.role === 'user'
                    ? 'bg-[#1E4E8C] text-white font-bold'
                    : 'bg-surface2 border border-line text-fg'
                }`}
              >
                <p className="leading-relaxed font-semibold">{m.text}</p>

                {Array.isArray(m.items) && m.items.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {m.items.map((it, idx) => (
                      <div key={idx} className="p-2 rounded-xl bg-surface border border-line flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-extrabold text-[11px] text-fg truncate">{it.title}</div>
                          <div className="text-[10px] text-muted truncate">{it.meta}</div>
                        </div>
                        {it.badge && (
                          <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black ${
                            it.badgeTone === 'rose' ? 'bg-rose-500/15 text-rose-500' :
                            it.badgeTone === 'amber' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                            it.badgeTone === 'emerald' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' :
                            'bg-[#1E4E8C]/15 text-[#1E4E8C] dark:text-[#7FB0E8]'
                          }`}>
                            {it.badge}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {m.cta && onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => { onNavigateTab(m.cta.tab); onClose(); }}
                    className="w-full py-1.5 px-3 rounded-xl bg-[#1E4E8C] hover:bg-[#163B6B] text-white font-extrabold text-[11px] flex items-center justify-center gap-1 transition"
                  >
                    <span>{m.cta.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {Array.isArray(m.chips) && m.chips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.chips.map((ch, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleCommand(ch)}
                        className="px-2.5 py-1 rounded-full bg-surface hover:bg-[#1E4E8C] text-fg hover:text-white border border-line hover:border-[#1E4E8C] text-[10px] font-extrabold transition"
                      >
                        {ch}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Explicit Confirmation Gate for Mutations */}
          {pendingAction && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border-2 border-amber-500/50 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>تأكيد مطلوب قبل التنفيذ</span>
              </div>
              <p className="text-[11px] font-bold text-fg">{pendingAction.label}</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={confirmPendingAction}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>موافق — نفّذ الآن</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  className="px-3 py-2 rounded-xl bg-surface border border-line text-muted hover:text-fg font-bold text-xs"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Command Input */}
        <form
          onSubmit={e => { e.preventDefault(); handleCommand(); }}
          className="p-3 border-t border-line bg-surface flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="اسأل عن المخزون، الطلبات، الأرباح، أو أضف منتج برابط..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-bg border border-line text-fg text-xs font-bold focus:outline-none focus:border-[#1E4E8C]"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[#1E4E8C] hover:bg-[#163B6B] text-white font-extrabold text-xs shrink-0 transition"
          >
            إرسال
          </button>
        </form>
      </div>
    </div>
  );
}
