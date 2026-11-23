import { Search, Package, Printer, Ban, RefreshCw, RotateCcw, Plus, Upload, Save, Lock, User, Wallet, Globe, MessageSquare, LogOut } from 'lucide-react';
import { AVATAR_PRESETS, ORDER_STATUSES } from '../data/constants.jsx';
import { PasswordInput } from '../components/widgets.jsx';

export function renderClientOrdersView(ctx) {
  const { clientOrdersSearch, clientOrdersSort, clientOrdersStatusFilter, currentClient, expandedClientOrders, formatMoney, handleQuickReorder, handleUpdateOrderStatus, orders, renderClientSourcingSection, setClientOrdersSearch, setClientOrdersSort, setClientOrdersStatusFilter, setExpandedClientOrders, setPrintModalOrder, setReturnModalOrder } = ctx;
    const rawMyOrders = orders.filter(o => o.clientId === currentClient?.id);
    const steps = ['تم الاستلام', 'جاري التجهيز', 'جاهز للتسليم', 'في الطريق (دليفري)', 'تم التسليم'];

    const filteredMyOrders = rawMyOrders
      .filter(o => {
        if (clientOrdersStatusFilter !== 'ALL' && o.status !== clientOrdersStatusFilter) return false;
        if (clientOrdersSearch.trim() !== '') {
          const q = clientOrdersSearch.trim().toLowerCase();
          const itemsText = o.items.map(i => `${i.name} ${i.sku}`).join(' ');
          const hay = `${o.id} ${o.createdAt} ${o.status} ${itemsText}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const totA = a.items.reduce((s, i) => s + i.qty * i.unitPriceBase, 0) + a.deliveryFeeBase - a.discountBase;
        const totB = b.items.reduce((s, i) => s + i.qty * i.unitPriceBase, 0) + b.deliveryFeeBase - b.discountBase;
        if (clientOrdersSort === 'date_asc') return a.createdAt.localeCompare(b.createdAt);
        if (clientOrdersSort === 'total_desc') return totB - totA;
        if (clientOrdersSort === 'total_asc') return totA - totB;
        return b.createdAt.localeCompare(a.createdAt);
      });

    const toggleOrderExpand = (orderId) => {
      setExpandedClientOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
    };

    return (
      <div className="space-y-4">
        {renderClientSourcingSection()}
        {/* Header + Filter & Collapse All Toolbar */}
        <div className="bg-surface rounded-2xl p-5 border border-line shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-fg">سجل طلباتك وفواتيرك</h2>
              <p className="text-xs text-muted mt-0.5">
                دوس على زرار <span className="font-mono font-bold">[ + / - ]</span> جنب أي طلب عشان تفتح أو تقفل تفاصيله، وتقدر تدوّر وتفلتر وتلغي الطلب قبل ما يتوصّل
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const allOpen = {};
                  rawMyOrders.forEach(o => { allOpen[o.id] = true; });
                  setExpandedClientOrders(allOpen);
                }}
                className="px-3 py-1.5 rounded-xl bg-surface2 hover:bg-surface2 text-muted text-xs font-bold"
              >
                + افتح الكل
              </button>
              <button
                type="button"
                onClick={() => setExpandedClientOrders({})}
                className="px-3 py-1.5 rounded-xl bg-surface2 hover:bg-surface2 text-muted text-xs font-bold"
              >
                - اقفل الكل
              </button>
            </div>
          </div>

          {/* Search & Status Filter Bar for Client Orders */}
          <div className="pt-3 border-t border-line flex flex-wrap items-center gap-2 text-xs">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={clientOrdersSearch}
                onChange={e => setClientOrdersSearch(e.target.value)}
                placeholder="دوّر برقم الفاتورة (INV-...) أو اسم القطعة أو التاريخ..."
                className="w-full pr-9 pl-3 py-2 rounded-xl border border-line bg-surface2"
              />
            </div>

            <select
              value={clientOrdersStatusFilter}
              onChange={e => setClientOrdersStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-line bg-surface2 font-bold"
            >
              <option value="ALL">جميع الحالات ({rawMyOrders.length})</option>
              {ORDER_STATUSES.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            <select
              value={clientOrdersSort}
              onChange={e => setClientOrdersSort(e.target.value)}
              className="px-3 py-2 rounded-xl border border-line bg-surface2 font-bold"
            >
              <option value="date_desc">الأحدث الأول</option>
              <option value="date_asc">الأقدم الأول</option>
              <option value="total_desc">الأعلى قيمة</option>
              <option value="total_asc">الأقل قيمة</option>
            </select>
          </div>
        </div>

        {filteredMyOrders.length === 0 ? (
          <div className="bg-surface rounded-2xl p-12 text-center border border-line space-y-3">
            <Package className="w-10 h-10 text-muted mx-auto" />
            <div className="text-sm font-bold text-muted">مفيش طلبات مطابقة للفلتر ده</div>
            <button
              onClick={() => {
                setClientOrdersSearch('');
                setClientOrdersStatusFilter('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              اعرض كل الطلبات
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMyOrders.map(order => {
              const orderTotalBase =
                order.items.reduce((s, i) => s + i.qty * i.unitPriceBase, 0) +
                order.deliveryFeeBase -
                order.discountBase;
              const totalPieces = order.items.reduce((s, i) => s + i.qty, 0);
              const currentStepIdx = steps.indexOf(order.status);
              const isExpanded = !!expandedClientOrders[order.id];

              // Client can cancel before 'في الطريق (دليفري)' and before 'تم التسليم'
              const canClientCancel = ['تم الاستلام', 'جاري التجهيز', 'جاهز للتسليم'].includes(order.status);
              // Invoice Print ONLY appears to client after 'تم التسليم'
              const canClientPrintInvoice = order.status === 'تم التسليم';

              return (
                <div
                  key={order.id}
                  className="bg-surface rounded-2xl border border-line shadow-xs overflow-hidden transition-all"
                >
                  {/* Collapsible Order Header Row */}
                  <div className="p-4 bg-surface2 flex flex-wrap items-center justify-between gap-3">
                    <div
                      onClick={() => toggleOrderExpand(order.id)}
                      className="flex items-center gap-3 cursor-pointer select-none"
                    >
                      <button
                        type="button"
                        className={`w-8 h-8 rounded-xl font-mono font-extrabold text-sm flex items-center justify-center border transition ${
                          isExpanded
                            ? 'bg-nav2 text-white border-line'
                            : 'bg-surface text-fg border-line hover:bg-surface2'
                        }`}
                        title={isExpanded ? 'اقفل تفاصيل الطلب (-)' : 'افتح تفاصيل الطلب (+)'}
                      >
                        {isExpanded ? '−' : '+'}
                      </button>

                      <span className="px-3 py-1 rounded-xl bg-nav2 text-white font-mono font-extrabold text-xs">
                        {order.id}
                      </span>

                      <div className="text-xs">
                        <div className="font-extrabold text-fg flex items-center gap-2">
                          <span>{order.createdAt}</span>
                          <span className="text-blue-600">({totalPieces} قطع • {formatMoney(orderTotalBase)})</span>
                        </div>
                        <div className="text-muted">
                          الحالة: <b className="text-fg">{order.status}</b> • السداد: {order.paymentMethod}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Print Invoice Button ONLY shown after delivery ('تم التسليم') */}
                      {canClientPrintInvoice && (
                        <button
                          onClick={() => setPrintModalOrder({ order, mode: 'invoice', isClientView: true })}
                          className="px-3 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          اطبع الفاتورة الرسمية
                        </button>
                      )}

                      {/* Cancel Order Button available before delivery stage */}
                      {canClientCancel && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, 'ملغي', true)}
                          className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-200 text-xs font-bold flex items-center gap-1 transition"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          إلغي الطلب قبل الشحن
                        </button>
                      )}

                      <button
                        onClick={() => handleQuickReorder(order)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        اطلب تاني
                      </button>

                      {order.status === 'تم التسليم' && (
                        <button
                          onClick={() => setReturnModalOrder(order)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          اطلب استرجاع بالضمان
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Order Body */}
                  {isExpanded && (
                    <div className="border-t border-line">
                      {order.adminEdited && (
                        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center gap-2 text-xs text-amber-600 dark:text-amber-300 font-semibold">
                          <RefreshCw className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>تعديل من الإدارة على الفاتورة: {order.adminEditNote}</span>
                        </div>
                      )}

                      <div className="p-4 border-b border-line">
                        {order.status === 'ملغي' ? (
                          <div className="p-3 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-300 font-bold text-xs flex items-center gap-2">
                            <Ban className="w-4 h-4" />
                            الطلب ده اتلغى والكميات رجعت المخزن والحساب اتسوّى.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                            {steps.map((st, idx) => {
                              const done = idx <= currentStepIdx;
                              return (
                                <div
                                  key={st}
                                  className={`p-2 rounded-xl text-center border text-[11px] font-bold transition ${
                                    done
                                      ? 'bg-accent/15 border-accent/30 text-accent-text'
                                      : 'bg-surface2 border-line text-muted'
                                  }`}
                                >
                                  <div>{idx + 1}. {({ 'تم الاستلام': 'استلمنا طلبك', 'جاري التجهيز': 'طلبك بيتجهز', 'جاهز للتسليم': 'طلبك اتجهز', 'في الطريق (دليفري)': 'خرج مع المندوب', 'تم التسليم': 'اتسلّم بنجاح' })[st] || st}</div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="p-4 overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="text-muted border-b border-line">
                              <th className="pb-2">الكود</th>
                              <th className="pb-2">الصنف والجودة</th>
                              <th className="pb-2">اللون</th>
                              <th className="pb-2">الكمية</th>
                              <th className="pb-2">سعر الوحدة</th>
                              <th className="pb-2">الإجمالي</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-line">
                            {order.items.map((item, idx) => (
                              <tr key={idx}>
                                <td className="py-2.5 font-mono text-[11px] text-muted">{item.sku}</td>
                                <td className="py-2.5 font-bold text-fg">
                                  {item.name}
                                  <span className="mr-2 px-2 py-0.5 rounded bg-surface2 text-muted text-[10px]">
                                    {item.qualityGrade}
                                  </span>
                                </td>
                                <td className="py-2.5 text-muted">{item.color}</td>
                                <td className="py-2.5 font-extrabold">{item.qty}</td>
                                <td className="py-2.5">{formatMoney(item.unitPriceBase)}</td>
                                <td className="py-2.5 font-extrabold text-fg">
                                  {formatMoney(item.qty * item.unitPriceBase)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="mt-3 pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="text-muted">
                            عنوان التوصيل: {order.address} {order.notes && ` • ملاحظات: ${order.notes}`}
                            {!canClientPrintInvoice && order.status !== 'ملغي' && (
                              <span className="block text-[11px] text-amber-600 dark:text-amber-300 font-semibold mt-0.5">
                                * تقدر تطبع الفاتورة الرسمية أول ما تأكّد إنك استلمت الطلب (تم التسليم).
                              </span>
                            )}
                          </div>
                          <div className="text-sm font-extrabold text-fg">
                            إجمالي الفاتورة شامل التوصيل: <span className="text-blue-600">{formatMoney(orderTotalBase)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  
}

export function renderClientLedgerView(ctx) {
  const { cartSummary, currentClient, currentCurrency, formatMoney } = ctx;
    if (!currentClient) return null;
    const isCredit = currentClient.walletBalance >= 0;

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface p-5 rounded-2xl border border-line shadow-xs">
            <div className="text-xs text-muted font-semibold">صافي رصيد المحفظة والحساب</div>
            <div
              className={`text-2xl font-extrabold mt-1 ${
                isCredit ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isCredit ? 'رصيد دائن (ليك): ' : 'مديونية (عليك): '}
              {formatMoney(Math.abs(currentClient.walletBalance))}
            </div>
            <div className="text-[11px] text-muted mt-1">
              بيتحدّث لوحده مع الفواتير والمدفوعات والمرتجعات
            </div>
          </div>

          <div className="bg-surface p-5 rounded-2xl border border-line shadow-xs">
            <div className="text-xs text-muted font-semibold">سقف الآجل المسموح</div>
            <div className="text-2xl font-extrabold text-fg mt-1">
              {formatMoney(currentClient.creditLimit)}
            </div>
            <div className="text-[11px] text-muted mt-1">
              المتاح تسحبه آجل دلوقتي: <span className="font-bold text-blue-600">{formatMoney(cartSummary.remainingCreditLimitBase)}</span>
            </div>
          </div>

          <div className="bg-surface p-5 rounded-2xl border border-line shadow-xs">
            <div className="text-xs text-muted font-semibold">عملة التعامل في الفواتير</div>
            <div className="text-xl font-extrabold text-blue-600 mt-1">
              {currentCurrency.name} ({currentCurrency.symbol})
            </div>
            <div className="text-[11px] text-muted mt-1">
              كل الفواتير وكشف الحساب معروضة بعملة حسابك
            </div>
          </div>
        </div>

        <div className="bg-surface rounded-2xl border border-line shadow-xs overflow-hidden">
          <div className="p-4 bg-surface2 border-b border-line flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-fg">
              كشف الحساب التفصيلي وحركات المحفظة
            </h3>
            <span className="text-xs text-muted">{currentClient.ledger.length} حركات مالية</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-surface2 text-muted border-b border-line">
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">رقم المرجع</th>
                  <th className="p-3">البيان والتفاصيل</th>
                  <th className="p-3">قيمة الحركة</th>
                  <th className="p-3">الرصيد بعد الحركة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {currentClient.ledger.map(entry => (
                  <tr key={entry.id} className="hover:bg-surface2">
                    <td className="p-3 font-mono text-muted">{entry.date}</td>
                    <td className="p-3 font-mono font-bold text-fg">{entry.ref}</td>
                    <td className="p-3 font-medium text-fg">{entry.desc}</td>
                    <td
                      className={`p-3 font-extrabold ${
                        entry.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {entry.amount >= 0 ? '+' : ''}
                      {formatMoney(entry.amount)}
                    </td>
                    <td className="p-3 font-extrabold text-fg">
                      {entry.balanceAfter >= 0 ? 'له ' : 'عليه '}
                      {formatMoney(Math.abs(entry.balanceAfter))}
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

export function renderClientReturnsView(ctx) {
  const { currentClient, formatMoney, orders, returnsList, setReturnModalOrder } = ctx;
    const myReturns = returnsList.filter(r => r.clientId === currentClient?.id);
    const deliveredOrders = orders.filter(
      o => o.clientId === currentClient?.id && o.status === 'تم التسليم'
    );

    return (
      <div className="space-y-5">
        <div className="bg-surface rounded-2xl p-5 border border-line shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-fg">
              الاسترجاع وضمان المنتجات (في خلال 7 أيام من التسليم)
            </h2>
            <p className="text-xs text-muted mt-0.5">
              عشان تستبدل أو ترجّع لازم القطعة تبقى زي ما جت من المصنع وعليها الختم الأصلي ومن غير لحام أو تركيب نهائي
            </p>
          </div>
          {deliveredOrders.length > 0 && (
            <button
              onClick={() => setReturnModalOrder(deliveredOrders[0])}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              قدّم طلب مرتجع جديد
            </button>
          )}
        </div>

        <div className="space-y-3">
          {myReturns.length === 0 ? (
            <div className="bg-surface rounded-2xl p-10 text-center border border-line text-xs text-muted">
              مفيش طلبات استرجاع مسجّلة.
            </div>
          ) : (
            myReturns.map(ret => (
              <div
                key={ret.id}
                className="bg-surface rounded-2xl p-5 border border-line shadow-xs space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-nav2 text-white font-mono text-xs font-bold">
                      {ret.id}
                    </span>
                    <span className="text-xs font-bold text-muted">
                      فاتورة رقم: {ret.orderId} • {ret.createdAt}
                    </span>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                      ret.status === 'مقبول'
                        ? 'bg-accent/15 text-accent-text border border-accent/30'
                        : ret.status === 'مرفوض'
                        ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    حالة الطلب: {ret.status}
                  </span>
                </div>

                <div className="text-sm font-extrabold text-fg">
                  {ret.partName} (الكمية: {ret.qty} • القيمة: {formatMoney(ret.refundAmountBase)})
                </div>

                <div className="text-xs text-muted bg-surface2 p-3 rounded-xl">
                  <span className="font-bold text-fg">سبب الاسترجاع: </span>
                  {ret.reason}
                </div>

                {ret.adminResponse && (
                  <div className="text-xs bg-surface2 border border-line text-fg p-3 rounded-xl font-medium">
                    <span className="font-extrabold">رد قسم الضمان والفحص الفني: </span>
                    {ret.adminResponse}
                  </div>
                )}

                {Array.isArray(ret.replies) && ret.replies.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-extrabold text-muted">سجل الردود والمتابعة على هذا المرتجع:</div>
                    {ret.replies.map(rep => (
                      <div key={rep.id} className="text-xs bg-surface2 border border-line text-fg p-2.5 rounded-xl">
                        <span className="font-bold">
                          {rep.sender === 'admin' ? 'قسم الضمان والفحص الفني' : 'أنت'} • {rep.date}
                        </span>
                        <div className="mt-0.5 font-medium">{rep.text}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  
}

export function renderClientComplaintsView(ctx) {
  const { clientFollowupText, complaints, currentClient, markLocalUpsert, newComplaintMsg, newComplaintSubject, newComplaintType, sbUpsert, setClientFollowupText, setComplaints, setNewComplaintMsg, setNewComplaintSubject, setNewComplaintType, setNotifications, showToast, submittingCustomerActionRef } = ctx;
    const myTickets = complaints.filter(c => c.clientId === currentClient?.id);

    const handleSendComplaint = async (e) => {
      e.preventDefault();
      if (!currentClient || submittingCustomerActionRef.current) return;
      if (!newComplaintSubject.trim() || !newComplaintMsg.trim()) return;
      submittingCustomerActionRef.current = true;
      try {
        const newTck = {
          id: `TCK-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 4).toUpperCase()}`,
          clientId: currentClient.id,
          clientName: currentClient.name,
          type: newComplaintType,
          subject: newComplaintSubject.trim(),
          message: newComplaintMsg.trim(),
          status: 'مفتوح',
          adminReply: '',
          replies: [],
          createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
        const savedOk = await sbUpsert('complaints', newTck);
        if (!savedOk) {
          showToast('معلش، رسالتك ماوصلتش للسيرفر. اتأكد من النت وجرّب تاني.', 'error');
          return;
        }
        setComplaints(prev => [newTck, ...prev]);
        markLocalUpsert('complaints', newTck);
        setNotifications(prev => [
          {
            id: `ntf_tck_${Date.now()}`,
            target: 'admin',
            type: 'complaint',
            title: `💬 رسالة عميل جديدة (${newTck.id})`,
            msg: `${newTck.clientName}: ${newTck.subject}`,
            time: 'الآن',
            read: false
          },
          ...prev
        ]);
        setNewComplaintSubject('');
        setNewComplaintMsg('');
        showToast('رسالتك وصلت للإدارة وهنرد عليك قريب.', 'success');
      } finally {
        submittingCustomerActionRef.current = false;
      }
    };

    const handleClientSendFollowup = async (ticketId) => {
      const txt = (clientFollowupText[ticketId] || '').trim();
      if (!txt || !currentClient || submittingCustomerActionRef.current) return;
      const target = complaints.find(t => t.id === ticketId);
      if (!target) return;
      submittingCustomerActionRef.current = true;
      try {
        const replyObj = {
          id: `rep_${Date.now()}`,
          sender: 'client',
          senderName: currentClient.name,
          text: txt,
          date: new Date().toISOString().slice(0, 16).replace('T', ' ')
        };
        const updatedTck = {
          ...target,
          status: 'مفتوح',
          replies: [...(target.replies || []), replyObj]
        };
        const savedOk = await sbUpsert('complaints', updatedTck);
        if (!savedOk) {
          showToast('معلش، ردّك ماوصلش للسيرفر. اتأكد من النت وجرّب تاني.', 'error');
          return;
        }
        markLocalUpsert('complaints', updatedTck);
        setComplaints(prev =>
          prev.map(t =>
            t.id === ticketId
              ? { ...t, status: 'مفتوح', replies: [...(t.replies || []), replyObj] }
              : t
          )
        );
        setClientFollowupText(prev => ({ ...prev, [ticketId]: '' }));
        showToast('ردّك اتبعت!', 'success');
      } finally {
        submittingCustomerActionRef.current = false;
      }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <form
          onSubmit={handleSendComplaint}
          className="bg-surface rounded-2xl p-5 border border-line shadow-xs space-y-3 h-fit"
        >
          <h3 className="text-sm font-extrabold text-fg">ابعت شكوى أو اطلب صنف</h3>
          <div>
            <label className="text-xs text-muted block mb-1">نوع الرسالة:</label>
            <select
              value={newComplaintType}
              onChange={e => setNewComplaintType(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-line text-xs font-bold"
            >
              <option>مقترح توفير صنف</option>
              <option>شكوى شحن وتوصيل</option>
              <option>استفسار مالي / فواتير</option>
              <option>أخرى</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">العنوان:</label>
            <input
              type="text"
              required
              value={newComplaintSubject}
              onChange={e => setNewComplaintSubject(e.target.value)}
              placeholder="عنوان مختصر للرسالة..."
              className="w-full p-2.5 rounded-xl border border-line text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-muted block mb-1">التفاصيل:</label>
            <textarea
              rows={3}
              required
              value={newComplaintMsg}
              onChange={e => setNewComplaintMsg(e.target.value)}
              placeholder="اكتب تفاصيل الشكوى أو الصنف اللي عايزه يتوفّر..."
              className="w-full p-2.5 rounded-xl border border-line text-xs"
            />
          </div>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold"
          >
            ابعت للإدارة
          </button>
        </form>

        <div className="md:col-span-2 space-y-3">
          <h3 className="text-sm font-extrabold text-fg">رسائلي وتذاكر الدعم السابقة</h3>
          {myTickets.length === 0 ? (
            <div className="bg-surface rounded-2xl p-8 text-center border border-line text-xs text-muted">
              مفيش رسائل قبل كده.
            </div>
          ) : (
            myTickets.map(tck => (
              <div key={tck.id} className="bg-surface rounded-2xl p-4 border border-line shadow-xs space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-blue-600">
                    {tck.id} • {tck.type}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      tck.status === 'تم الرد'
                        ? 'bg-accent/15 text-accent-text border border-accent/30'
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {tck.status}
                  </span>
                </div>
                <div className="text-sm font-extrabold text-fg">{tck.subject}</div>
                <p className="text-xs text-muted bg-surface2 p-3 rounded-xl">{tck.message}</p>

                {/* Conversation Thread Replies */}
                {(tck.replies || []).length > 0 && (
                  <div className="space-y-2 pr-3 border-r-2 border-blue-200">
                    {tck.replies.map(rep => (
                      <div
                        key={rep.id}
                        className={`p-2.5 rounded-xl text-xs ${
                          rep.sender === 'admin'
                            ? 'bg-accent/15 border border-accent/30 text-fg'
                            : 'bg-surface2 border border-line text-fg'
                        }`}
                      >
                        <div className="flex justify-between text-[10px] font-bold opacity-75 mb-0.5">
                          <span>{rep.sender === 'admin' ? '🛡️ رد الإدارة' : `👤 ${rep.senderName}`}</span>
                          <span>{rep.date}</span>
                        </div>
                        <div>{rep.text}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add another reply */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={clientFollowupText[tck.id] || ''}
                    onChange={e =>
                      setClientFollowupText(prev => ({ ...prev, [tck.id]: e.target.value }))
                    }
                    placeholder="ضيف رد أو سؤال تاني في الرسالة دي..."
                    className="flex-1 px-3 py-2 rounded-xl border border-line text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleClientSendFollowup(tck.id)}
                    className="px-3.5 py-2 rounded-xl bg-nav2 text-white text-xs font-bold"
                  >
                    ابعت الرد
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  
}

export function renderClientProfileSettingsView(ctx) {
  const { currentClient, handleChangeClientPassword, handleClientAvatarFileUpload, handleSaveClientProfile, passwordForm, profileForm, renderClientAvatar, setPasswordForm, setProfileForm } = ctx;
    if (!currentClient || !profileForm) return null;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Right 2 Columns: Edit Shop Info, Avatar & Addresses */}
        <form
          onSubmit={handleSaveClientProfile}
          className="lg:col-span-2 bg-surface rounded-2xl p-6 border border-line shadow-xs space-y-5"
        >
          <div className="flex items-center justify-between border-b border-line pb-4">
            <div>
              <h3 className="text-base font-extrabold text-fg">
                البيانات الأساسية والصورة الشخصية والعناوين
              </h3>
              <p className="text-xs text-muted mt-0.5">
                عدّل اسم المحل أو المركز والصورة وأرقام التواصل وعناوين الشحن
              </p>
            </div>
          </div>

          {/* Avatar Picker & Upload */}
          <div className="p-3 rounded-2xl bg-surface2 border border-line flex items-start gap-3">
            {renderClientAvatar({ ...currentClient, ...profileForm }, 'w-14 h-14 text-lg')}
            <div className="flex-1 space-y-2">
              <div className="text-xs font-extrabold text-fg">صورة الحساب / شعار المحل:</div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  ارفع صورة من جهازك
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleClientAvatarFileUpload}
                    className="hidden"
                  />
                </label>

                {profileForm.avatarImage && (
                  <button
                    type="button"
                    onClick={() => setProfileForm(prev => ({ ...prev, avatarImage: '' }))}
                    className="px-2.5 py-1.5 rounded-xl bg-surface2 text-muted text-xs font-bold"
                  >
                    استخدم الأيقونة الملوّنة
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-muted">أو اختار لون الشعار:</span>
                {AVATAR_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      setProfileForm(prev => ({ ...prev, avatarBg: preset.bg, avatarImage: '' }))
                    }
                    className={`w-6 h-6 rounded-lg bg-gradient-to-br ${preset.bg} ${
                      profileForm.avatarBg === preset.bg && !profileForm.avatarImage
                        ? 'ring-2 ring-line scale-110'
                        : 'opacity-75'
                    }`}
                    title={preset.label}
                  />
                ))}
                <input
                  type="text"
                  maxLength={3}
                  value={profileForm.avatar}
                  onChange={e => setProfileForm(prev => ({ ...prev, avatar: e.target.value }))}
                  placeholder="حروف الشعار"
                  className="w-16 px-2 py-1 rounded-lg border border-line text-xs font-extrabold text-center bg-surface"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-muted block mb-1">اسم المحل / الشركة / المركز:</label>
              <input
                type="text"
                required
                value={profileForm.name}
                onChange={e => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">اسم المسؤول / صاحب الحساب:</label>
              <input
                type="text"
                required
                value={profileForm.owner}
                onChange={e => setProfileForm(prev => ({ ...prev, owner: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">رقم الموبايل (المستخدم للدخول):</label>
              <input
                type="text"
                required
                value={profileForm.phone}
                onChange={e => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">البريد الإلكتروني:</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={e => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line"
              />
            </div>

            <div className="sm:col-span-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
              <div>
                <label className="font-black text-fg block">🎂 تاريخ الميلاد (يُعدّل مرة واحدة فقط — للحصول على هدية عيد ميلادك سنوياً):</label>
                <span className="text-[11px] text-muted">
                  {currentClient.birthDateLocked && currentClient.birthDate
                    ? '🔒 تم تسجيل وتأكيد تاريخ ميلادك مسبقاً (لا يمكن تغييره مرة أخرى لضمان عدم تكرار الهدية السنوية).'
                    : 'سجّل تاريخ ميلادك الصحيح (مسموح بتحديده مرة واحدة فقط) ليصلك كوبون هدية خصم خاص في عيد ميلادك كل سنة!'}
                </span>
              </div>
              <input
                type="date"
                disabled={Boolean(currentClient.birthDateLocked && currentClient.birthDate)}
                value={profileForm.birthDate || ''}
                onChange={e => {
                  if (currentClient.birthDateLocked && currentClient.birthDate) return;
                  setProfileForm(prev => ({ ...prev, birthDate: e.target.value }));
                }}
                className="p-2.5 rounded-xl border border-amber-500/40 font-mono font-black text-xs disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-muted block mb-1">العنوان الأساسي للتوصيل:</label>
              <input
                type="text"
                required
                value={profileForm.address}
                onChange={e => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold text-muted block mb-1">عنوان الفرع الثاني (اختياري):</label>
              <input
                type="text"
                value={profileForm.secondaryAddress}
                onChange={e => setProfileForm(prev => ({ ...prev, secondaryAddress: e.target.value }))}
                className="w-full p-2.5 rounded-xl border border-line"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-xs flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            احفظ التغييرات
          </button>
        </form>

        {/* Left Column: Password Change Card */}
        <form
          onSubmit={handleChangeClientPassword}
          className="bg-surface rounded-2xl p-6 border border-line shadow-xs space-y-4 h-fit"
        >
          <div className="border-b border-line pb-3">
            <h3 className="text-base font-extrabold text-fg flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              تغيير كلمة المرور والأمان
            </h3>
            <p className="text-xs text-muted mt-0.5">
              تقدر تغيّر كلمة السر في أي وقت
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-muted block mb-1">كلمة المرور الحالية:</label>
              <PasswordInput
                type="password"
                required
                value={passwordForm.current}
                onChange={e => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
                placeholder="اكتب كلمة المرور الحالية..."
                className="w-full p-2.5 rounded-xl border border-line"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">كلمة المرور الجديدة:</label>
              <PasswordInput
                type="password"
                required
                value={passwordForm.next}
                onChange={e => setPasswordForm(prev => ({ ...prev, next: e.target.value }))}
                placeholder="اكتب كلمة المرور الجديدة..."
                className="w-full p-2.5 rounded-xl border border-line"
              />
            </div>

            <div>
              <label className="font-bold text-muted block mb-1">تأكيد كلمة المرور الجديدة:</label>
              <PasswordInput
                type="password"
                required
                value={passwordForm.confirm}
                onChange={e => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                placeholder="اكتب كلمة المرور الجديدة تاني..."
                className="w-full p-2.5 rounded-xl border border-line"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-nav2 hover:bg-nav2 text-white text-xs font-extrabold"
          >
            غيّر كلمة المرور
          </button>
        </form>
      </div>
    );
  
}

export function renderClientAccountPortal(ctx) {
  const { accountSubTab, activeFamilyDevices, clientLoyaltyInfo, complaints, currentClient, formatMoney, orders, renderClientAvatar, renderClientComplaintsView, renderClientLedgerView, renderClientOrdersView, renderClientProfileSettingsView, renderClientReturnsView, renderClientSourcingSection, returnsList, setAccountSubTab, setActiveRole, setAuthModalTab, setClientTab, setFamilyModalOpen, setLoginModalOpen, showToast, siteSettings, sourcingRequests } = ctx;
    if (!currentClient) {
      return (
        <div className="max-w-md mx-auto my-12 bg-surface p-8 rounded-2xl border border-line text-center space-y-4">
          <Lock className="w-10 h-10 text-blue-600 mx-auto" />
          <h3 className="text-base font-extrabold text-fg">سجّل دخولك عشان تفتح حسابك</h3>
          <button
            onClick={() => {
              setAuthModalTab('login');
              setLoginModalOpen(true);
            }}
            className="px-6 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-extrabold"
          >
            سجّل دخول دلوقتي
          </button>
        </div>
      );
    }

    const myOrdersCount = orders.filter(o => o.clientId === currentClient.id).length;
    const myReturnsCount = returnsList.filter(r => r.clientId === currentClient.id).length;
    const myTicketsCount = complaints.filter(c => c.clientId === currentClient.id).length;

    const sidebarMenu = [
      { id: 'profile', label: 'البروفايل وإعدادات الحساب', icon: User, badge: null },
      { id: 'orders', label: 'طلباتي وفواتيري', icon: Package, badge: myOrdersCount },
      { id: 'ledger', label: 'المحفظة وكشف الحساب', icon: Wallet, badge: null },
      { id: 'returns', label: 'المرتجعات والضمان', icon: RotateCcw, badge: myReturnsCount },
      { id: 'sourcing', label: 'اطلب منتجك', icon: Globe, badge: sourcingRequests.filter(r => r.clientId === currentClient?.id).length },
      { id: 'complaints', label: 'الشكاوى وطلبات الأصناف', icon: MessageSquare, badge: myTicketsCount }
    ];

    return (
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Top Clean Profile Summary Banner (High-Contrast in Light & Dark Mode!) */}
        <div className="bg-surface text-fg border-2 border-accent rounded-2xl p-5 sm:p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {renderClientAvatar(currentClient, 'w-16 h-16 text-xl shadow-sm')}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-fg">{currentClient.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-go/15 text-go border border-go/30 text-[11px] font-extrabold">
                  حساب معتمد نشط ✓
                </span>
              </div>
              <p className="text-xs text-muted font-bold mt-1.5">
                المسؤول: <span className="text-fg font-extrabold">{currentClient.owner}</span> • الجوال: <span className="font-mono text-fg font-extrabold">{currentClient.phone}</span> • <span className="text-fg">{currentClient.address}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-surface2 px-4 py-3 rounded-xl border border-line">
            <div>
              <div className="text-[11px] font-bold text-muted">صافي رصيد المحفظة</div>
              <div
                className={`text-base font-black ${
                  currentClient.walletBalance >= 0 ? 'text-go' : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {currentClient.walletBalance >= 0 ? 'رصيد ليك: ' : 'مديونية: '}
                {formatMoney(Math.abs(currentClient.walletBalance))}
              </div>
            </div>
            <div className="h-8 w-px bg-line mx-1" />
            <button
              onClick={() => setClientTab('store')}
              className="px-4 py-2.5 rounded-xl bg-go hover:brightness-110 text-go-ink text-xs font-extrabold transition shadow-xs"
            >
              + اطلب منتجات جديدة
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveRole('guest');
              setClientTab('home');
              showToast('خرجت من حسابك.', 'info');
            }}
            className="hidden sm:flex w-auto px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-400/40 text-xs font-extrabold items-center justify-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" /> تسجيل الخروج
          </button>
        </div>

        {/* Loyalty Tiers (20 Orders Scale + 3-Month Inactivity Rule) & Refer-a-Friend ("هات صاحبك") Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {siteSettings.enableLoyaltyTiers !== false && (
            <div className="bg-surface rounded-2xl p-5 border-2 border-amber-400/50 shadow-xs space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{clientLoyaltyInfo.currentTier.icon}</span>
                  <div>
                    <div className="text-sm font-black text-fg">
                      مستوى الولاء الحالي: <span className="text-amber-500">{clientLoyaltyInfo.currentTier.name}</span>
                    </div>
                    <div className="text-[11px] text-muted">
                      {clientLoyaltyInfo.nextTier
                        ? `أنت ${clientLoyaltyInfo.currentTier.name} ${clientLoyaltyInfo.currentTier.icon} — باقي ${clientLoyaltyInfo.ordersToNextTier} أوردر وتبقى ${clientLoyaltyInfo.nextTier.name} ${clientLoyaltyInfo.nextTier.icon}!`
                        : 'أنت في أعلى مستوى ولاء (الألماسي 💎) — شحن مجاني دائم وأعلى كاش باك!'}
                    </div>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[11px]">
                  طلباتك: {clientLoyaltyInfo.deliveredCount} / {clientLoyaltyInfo.diamondMin} أوردر
                </span>
              </div>

              <div className="w-full h-3 bg-surface2 rounded-full overflow-hidden border border-line">
                <div
                  className={`h-full bg-gradient-to-r ${clientLoyaltyInfo.currentTier.color} transition-all duration-500`}
                  style={{ width: `${Math.max(8, clientLoyaltyInfo.progressToDiamondPct)}%` }}
                />
              </div>

              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                {clientLoyaltyInfo.tiers.map(t => {
                  const isCurrent = t.id === clientLoyaltyInfo.currentTier.id;
                  return (
                    <div
                      key={t.id}
                      className={`p-2 rounded-xl border ${
                        isCurrent ? 'bg-amber-400/15 border-amber-400 font-black text-fg' : 'bg-surface2 border-line text-muted font-bold'
                      }`}
                    >
                      <div>{t.icon} {t.name}</div>
                      <div className="font-mono text-[9px]">{t.minOrders}+ أوردر</div>
                      <div className="text-[9px] text-emerald-500">{t.freeShipping ? 'شحن مجاني' : `+${t.bonusCashbackPct}% كاش باك`}</div>
                    </div>
                  );
                })}
              </div>

              {clientLoyaltyInfo.wasDowngraded ? (
                <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-500 font-bold text-[11px]">
                  ⚠️ نزل مستواك درجة واحدة لمرور أكثر من 3 شهور ({clientLoyaltyInfo.daysSinceLastOrder} يوم) بدون طلبات. اطلب الآن لاستعادة مستواك فوراً!
                </div>
              ) : (
                <div className="text-[10px] text-muted font-bold">
                  💡 ملاحظة: حافظ على طلب واحد على الأقل كل 3 شهور للحفاظ على مستواك ومزايا الكاش باك الإضافية.
                </div>
              )}
            </div>
          )}

          {siteSettings.enableReferralProgram !== false && (
            <div className="bg-surface rounded-2xl p-5 border border-line shadow-xs space-y-3 text-xs flex flex-col justify-between">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-fg flex items-center gap-1.5">
                    <span>🤝</span>
                    <span>هات صاحبك واكسبوا سوا رصيد في المحفظة!</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-black text-[10px]">
                    {siteSettings.referralRewardType === 'percentage'
                      ? `مكافأة ${siteSettings.referralRewardPct || 5}% لكليكما`
                      : `مكافأة ${siteSettings.referralRewardFixedAmount || 50} ج.م لكليكما`}
                  </span>
                </div>
                <p className="text-[11px] text-muted leading-relaxed">
                  ابعت كود الدعوة الخاص بك لصاحبك. أول ما يطلب أول أوردر ويستلمه، هينزل في محفظتك ومحفظته رصيد مجاني تلقائياً!
                </p>
              </div>

              <div className="p-3 rounded-xl bg-surface2 border border-line flex items-center justify-between gap-2">
                <div>
                  <div className="text-[10px] text-muted font-bold">كود الدعوة الخاص بك:</div>
                  <div className="font-mono font-black text-base text-accent-text">
                    {currentClient.referralCode || `REF-${String(currentClient.phone || '').slice(-5)}`}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const myCode = currentClient.referralCode || `REF-${String(currentClient.phone || '').slice(-5)}`;
                      try { navigator.clipboard.writeText(myCode); } catch (e) {}
                      showToast(`📋 تم نسخ كود الدعوة (${myCode})!`, 'success');
                    }}
                    className="px-3 py-2 rounded-xl bg-surface border border-line font-black text-[11px]"
                  >
                    نسخ الكود
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const myCode = currentClient.referralCode || `REF-${String(currentClient.phone || '').slice(-5)}`;
                      const shareUrl = `${window.location.origin}/?ref=${myCode}`;
                      const rewardTxt = siteSettings.referralRewardType === 'percentage'
                        ? `${siteSettings.referralRewardPct || 5}%`
                        : `${siteSettings.referralRewardFixedAmount || 50} ج.م`;
                      const waText = `جرب تطلب من موقع ${siteSettings.storeName || 'ELZOGHBI'} واستخدم كود الدعوة بتاعي (${myCode}) عشان ناخد إحنا الاتنين هدية ${rewardTxt} في المحفظة! ${shareUrl}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(waText)}`, '_blank');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black text-[11px]"
                  >
                    📲 ابعت لصاحبك واتساب
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-line">
                <span className="text-muted font-bold">🎂 تاريخ ميلادك المسجل لهدايا المناسبات: <b className="font-mono text-fg">{currentClient.birthDate || '1996-12-30'}</b></span>
                <button
                  type="button"
                  onClick={() => setFamilyModalOpen(true)}
                  className="text-accent-text font-black hover:underline"
                >
                  👨‍👩‍👧‍👦 أجهزتي وعائلتي ({activeFamilyDevices.length})
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Account Navigation Layout (Sidebar + Main Panel) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-surface rounded-2xl border border-line p-3 space-y-1.5 h-fit shadow-xs">
            <div className="px-3 py-2 text-[11px] font-extrabold text-muted uppercase">
              لوحة تحكم الحساب
            </div>
            {sidebarMenu.map(item => {
              const IconComp = item.icon;
              const active = accountSubTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setAccountSubTab(item.id)}
                  className={`w-full px-3.5 py-3 rounded-xl text-xs font-extrabold transition flex items-center justify-between ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-muted hover:bg-surface2'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] ${
                        active ? 'bg-surface text-accent-text' : 'bg-surface2 text-muted'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-3">
            {accountSubTab === 'profile' && renderClientProfileSettingsView()}
            {accountSubTab === 'orders' && renderClientOrdersView()}
            {accountSubTab === 'ledger' && renderClientLedgerView()}
            {accountSubTab === 'returns' && renderClientReturnsView()}
            {accountSubTab === 'sourcing' && renderClientSourcingSection()}
            {accountSubTab === 'complaints' && renderClientComplaintsView()}
          </div>
        </div>

        {/* Mobile Logout Button at the VERY END of the Account Page (Not at the top!) */}
        <div className="sm:hidden pt-4 border-t border-line">
          <button
            type="button"
            onClick={() => {
              setActiveRole('guest');
              setClientTab('home');
              showToast('خرجت من حسابك.', 'info');
            }}
            className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج من الحساب</span>
          </button>
        </div>
      </div>
    );
  
}
