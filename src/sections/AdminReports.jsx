import { Printer } from 'lucide-react';
import { ELZOGHBI_LOGO } from '../data/constants.jsx';
import { escapeHtml, openCleanA4PrintWindow } from '../lib/utils.jsx';

export function renderGmReportDocumentContent(ctx, rep, forPrintModal = false) {
  const { currentPeriodTotalSalesEgp, formatMoney, gmReportCustomNotes, gmReportSections, isPartCashbackEnabled, parts, promoCodes, siteSettings } = ctx;
    const selectedCount = Object.values(gmReportSections).filter(Boolean).length;
    return (
      <div className={`space-y-6 text-xs ${forPrintModal ? 'text-slate-900 bg-white p-6' : ''}`}>
        {/* Formal Report Header */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-nav via-nav2 to-nav text-white border-2 border-[#3B82F6]/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img src={ELZOGHBI_LOGO} alt="Logo" className="w-14 h-14 rounded-2xl object-cover border-2 border-[#3B82F6] shadow-md" />
            <div>
              <div className="text-[11px] font-black text-amber-300 tracking-wide">
                EXECUTIVE GENERAL MANAGER REPORT • تقرير الإدارة العامة التنفيذي
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                {siteSettings.storeName || 'ELZOGHBI'} — التقرير الشامل للمبيعات والأرباح والمخازن
              </h2>
              <div className="text-[11px] text-cyan-200 font-bold mt-1">
                الفترة من: <span className="font-mono text-white">{rep.fromStr}</span> إلى: <span className="font-mono text-white">{rep.toStr}</span> • تاريخ الإصدار: <span className="font-mono text-white">{new Date().toISOString().slice(0, 16).replace('T', ' ')}</span>
              </div>
            </div>
          </div>
          <div className="text-left space-y-1">
            <div className="px-3 py-1 rounded-xl bg-white/10 border border-white/20 font-black text-[#60A5FA] text-xs">
              الأقسام المضمنة: {selectedCount} / 12 قسم
            </div>
            <div className="text-[11px] text-muted font-bold">
              إعداد ومراجعة: إدارة {siteSettings.storeName || 'ELZOGHBI'}
            </div>
          </div>
        </div>

        {/* 1. Financial Summary & Net Profit */}
        {gmReportSections.financialSummary && (
          <div className="bg-surface rounded-2xl p-5 border border-line space-y-4">
            <h3 className="text-sm sm:text-base font-black text-fg border-b border-line pb-2.5 flex items-center justify-between">
              <span>💰 أولاً: الملخص المالي التنفيذي وصافي الأرباح (Financial & Profit Summary)</span>
              <span className="text-xs font-black text-emerald-500">هامش الربح الصافي: {rep.profitMarginPct}%</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-surface2 border border-line space-y-1">
                <div className="text-[11px] text-muted font-bold">إجمالي المبيعات (قبل الخصم)</div>
                <div className="text-lg font-black text-fg">{formatMoney(rep.grossItemsRevenueBase)}</div>
                <div className="text-[10px] text-muted">{rep.periodValidOrders.length} فاتورة • {rep.totalUnitsSold} قطعة</div>
              </div>
              <div className="p-3.5 rounded-xl bg-surface2 border border-line space-y-1">
                <div className="text-[11px] text-muted font-bold">الخصومات والكوبونات الممنوحة</div>
                <div className="text-lg font-black text-rose-500">-{formatMoney(rep.totalDiscountsGivenBase)}</div>
                <div className="text-[10px] text-muted">صافي المبيعات: {formatMoney(rep.netSalesAfterDiscountBase)}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-surface2 border border-line space-y-1">
                <div className="text-[11px] text-muted font-bold">تكلفة البضاعة المباعة (COGS)</div>
                <div className="text-lg font-black text-amber-500">{formatMoney(rep.totalCogsCostBase)}</div>
                <div className="text-[10px] text-muted">المرتجعات المعتمدة: {formatMoney(rep.approvedReturnsLossBase)}</div>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-line space-y-1">
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black">صافي الربح الفعلي للخزينة</div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">+{formatMoney(rep.netOperatingProfitBase)}</div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-300 font-bold">متوسط الفاتورة (AOV): {formatMoney(rep.averageOrderValueBase)}</div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Orders Status Breakdown */}
        {gmReportSections.ordersStatus && (
          <div className="bg-surface rounded-2xl p-5 border border-line space-y-3">
            <h3 className="text-sm sm:text-base font-black text-fg border-b border-line pb-2.5 flex items-center justify-between">
              <span>📦 ثانياً: تفصيل حالات الطلبات وكفاءة التسليم ({rep.periodAllOrders.length} طلب إجمالي)</span>
              <span className="text-xs font-bold text-accent-text">نسبة التسليم: {rep.deliverySuccessRatePct}% • نسبة الإلغاء: {rep.cancellationRatePct}%</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {rep.statusBreakdown.map(st => (
                <div key={st.status} className="p-3 rounded-xl bg-surface2 border border-line text-center space-y-1">
                  <div className="text-[11px] font-extrabold text-muted">{st.status}</div>
                  <div className="text-lg font-black text-fg">{st.count} طلب</div>
                  <div className="text-[11px] font-mono font-bold text-accent-text">{formatMoney(st.totalValueBase)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Payment Methods & Cash Flow */}
        {gmReportSections.paymentMethods && (
          <div className="bg-surface rounded-2xl p-5 border border-line space-y-3">
            <h3 className="text-sm sm:text-base font-black text-fg border-b border-line pb-2.5">
              💳 ثالثاً: السيولة النقدية وتوزيع المبيعات حسب طرق الدفع والتحصيل
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-surface2 text-muted border-b border-line">
                    <th className="p-2.5 font-extrabold">طريقة الدفع</th>
                    <th className="p-2.5 font-extrabold">عدد الفواتير</th>
                    <th className="p-2.5 font-extrabold">إجمالي قيمة الفواتير</th>
                    <th className="p-2.5 font-extrabold">النقدية المحصلة / المطلوب تحصيلها</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rep.paymentMethodsBreakdown.map(pm => (
                    <tr key={pm.method}>
                      <td className="p-2.5 font-black text-fg">{pm.method}</td>
                      <td className="p-2.5 font-mono font-bold">{pm.ordersCount}</td>
                      <td className="p-2.5 font-mono font-bold text-fg">{formatMoney(pm.totalAmountBase)}</td>
                      <td className="p-2.5 font-mono font-black text-emerald-600 dark:text-emerald-400">{formatMoney(pm.cashToCollectBase)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4. Top Selling & Most Profitable Products */}
        {gmReportSections.topProducts && (
          <div className="bg-surface rounded-2xl p-5 border border-line space-y-3">
            <h3 className="text-sm sm:text-base font-black text-fg border-b border-line pb-2.5">
              🏆 رابعاً: الأصناف الأكثر مبيعاً والأعلى ربحية خلال الفترة (Top 15 Products)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-surface2 text-muted border-b border-line">
                    <th className="p-2.5 font-extrabold">#</th>
                    <th className="p-2.5 font-extrabold">اسم الصنف</th>
                    <th className="p-2.5 font-extrabold">التصنيف</th>
                    <th className="p-2.5 font-extrabold">الكمية المباعة</th>
                    <th className="p-2.5 font-extrabold">إجمالي المبيعات</th>
                    <th className="p-2.5 font-extrabold">التكلفة</th>
                    <th className="p-2.5 font-extrabold">صافي الربح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rep.topProductsByProfit.map((prod, idx) => (
                    <tr key={prod.id}>
                      <td className="p-2.5 font-mono font-bold text-muted">{idx + 1}</td>
                      <td className="p-2.5 font-black text-fg">{prod.name}</td>
                      <td className="p-2.5 text-muted font-bold">{prod.category}</td>
                      <td className="p-2.5 font-mono font-black text-accent-text">{prod.qtySold} قطعة</td>
                      <td className="p-2.5 font-mono font-bold">{formatMoney(prod.revenueBase)}</td>
                      <td className="p-2.5 font-mono text-muted">{formatMoney(prod.costBase)}</td>
                      <td className="p-2.5 font-mono font-black text-emerald-600 dark:text-emerald-400">+{formatMoney(prod.profitBase)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Sales by Category & Brand */}
        {gmReportSections.categoriesAndBrands && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-surface rounded-2xl p-5 border border-line space-y-3">
              <h3 className="text-sm font-black text-fg border-b border-line pb-2">📊 خامساً (أ): المبيعات والأرباح حسب القسم</h3>
              <div className="space-y-2">
                {rep.categoriesBreakdown.slice(0, 10).map(cat => (
                  <div key={cat.category} className="p-2.5 rounded-xl bg-surface2 border border-line flex items-center justify-between">
                    <div>
                      <span className="font-black text-fg">{cat.category}</span>
                      <span className="text-[11px] text-muted mr-2">({cat.qtySold} قطعة)</span>
                    </div>
                    <div className="text-left">
                      <span className="font-mono font-bold text-fg ml-3">{formatMoney(cat.revenueBase)}</span>
                      <span className="font-mono font-black text-emerald-500">ربح: +{formatMoney(cat.profitBase)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-5 border border-line space-y-3">
              <h3 className="text-sm font-black text-fg border-b border-line pb-2">🏷️ خامساً (ب): المبيعات والأرباح حسب الماركة</h3>
              <div className="space-y-2">
                {rep.brandsBreakdown.slice(0, 10).map(br => (
                  <div key={br.brand} className="p-2.5 rounded-xl bg-surface2 border border-line flex items-center justify-between">
                    <div>
                      <span className="font-black text-fg">{br.brand}</span>
                      <span className="text-[11px] text-muted mr-2">({br.qtySold} قطعة)</span>
                    </div>
                    <div className="text-left">
                      <span className="font-mono font-bold text-fg ml-3">{formatMoney(br.revenueBase)}</span>
                      <span className="font-mono font-black text-emerald-500">ربح: +{formatMoney(br.profitBase)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 6. Top Clients & Receivables / Wallet Balances */}
        {gmReportSections.clientsAndDebts && (
          <div className="bg-surface rounded-2xl p-5 border border-line space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
              <h3 className="text-sm sm:text-base font-black text-fg">
                👥 سادساً: كبار العملاء + كشف المديونيات الآجل المستحقة للتحصيل وأرصدة المحافظ
              </h3>
              <div className="flex gap-3 text-xs font-black">
                <span className="text-rose-500">إجمالي مديونيات الآجل لنا: {formatMoney(rep.totalReceivablesDebtBase)}</span>
                <span className="text-emerald-500">أرصدة دائنة للعملاء بالمحفظة: {formatMoney(rep.totalPositiveWalletLiabilityBase)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <div className="font-black text-fg mb-2">🥇 أعلى العملاء مساهمة في المبيعات والربح خلال الفترة:</div>
                <div className="space-y-2">
                  {rep.topClientsInPeriod.slice(0, 8).map(c => (
                    <div key={c.clientId} className="p-2.5 rounded-xl bg-surface2 border border-line flex items-center justify-between">
                      <div>
                        <div className="font-black text-fg">{c.clientName}</div>
                        <div className="text-[10px] text-muted">{c.ordersCount} فواتير • {c.unitsCount} قطعة</div>
                      </div>
                      <div className="text-left">
                        <div className="font-mono font-black text-fg">{formatMoney(c.totalSpentBase)}</div>
                        <div className="text-[10px] font-mono font-bold text-emerald-500">ربح محقق: +{formatMoney(c.profitGeneratedBase)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="font-black text-rose-500 mb-2">⚠️ كشف العملاء المطالبين بمديونيات آجل (مستحقة للتحصيل):</div>
                {rep.debtorClients.length === 0 ? (
                  <div className="p-4 rounded-xl bg-surface2 text-emerald-500 font-bold text-center">لا توجد أي مديونيات متأخرة على العملاء حالياً ✓</div>
                ) : (
                  <div className="space-y-2">
                    {rep.debtorClients.map(dc => (
                      <div key={dc.id} className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                        <div>
                          <div className="font-black text-fg">{dc.name}</div>
                          <div className="text-[10px] text-muted font-mono">{dc.phone} • حد الائتمان: {formatMoney(dc.creditLimit)}</div>
                        </div>
                        <div className="font-mono font-black text-rose-500 text-sm">
                          مطلوب سداده: {formatMoney(dc.debtAmount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 7. CRO & Marketing Performance */}
        {gmReportSections.croAndMarketing && (
          <div className="bg-surface rounded-2xl p-5 border border-line space-y-3">
            <h3 className="text-sm sm:text-base font-black text-fg border-b border-line pb-2.5">
              🚀 سابعاً: أداء الميزات التسويقية والكوبونات والكاش باك وسقف المبيعات
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-surface2 border border-line">
                <div className="text-[11px] text-muted font-bold">السلات المسترجعة (Exit / Spin / Cross-Sell)</div>
                <div className="text-base font-black text-amber-500">{Number(siteSettings.analyticsRecoveredCartsCount) || 0} سلة</div>
                <div className="text-[10px] text-muted">بقيمة: {formatMoney(Number(siteSettings.analyticsRecoveredCartsValue) || 0)}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface2 border border-line">
                <div className="text-[11px] text-muted font-bold">الكوبونات المستخدمة في الفترة</div>
                <div className="text-base font-black text-accent-text">{formatMoney(rep.totalDiscountsGivenBase)}</div>
                <div className="text-[10px] text-muted">إجمالي مرات استخدام الكوبونات: {Math.max(Number(siteSettings.analyticsCouponsUsedCount) || 0, promoCodes.reduce((a, p) => a + (Number(p.usedCount) || 0), 0))}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface2 border border-line">
                <div className="text-[11px] text-muted font-bold">الكاش باك الممنوح للعملاء</div>
                <div className="text-base font-black text-emerald-500">{formatMoney(rep.totalCashbackAwardedInOrdersBase)}</div>
                <div className="text-[10px] text-muted">مفعّل على {parts.filter(p => isPartCashbackEnabled(p)).length} صنف</div>
              </div>
              <div className="p-3 rounded-xl bg-surface2 border border-line">
                <div className="text-[11px] text-muted font-bold">حالة سقف إيقاف البيع الكلي</div>
                <div className="text-base font-black text-fg">{formatMoney(currentPeriodTotalSalesEgp)}</div>
                <div className="text-[10px] text-muted">من أصل {formatMoney(Number(siteSettings.salesCapMaxLimitEgp) || 2000000)}</div>
              </div>
            </div>
          </div>
        )}

        {/* 8. Returns, Warranty Claims & Complaints */}
        {gmReportSections.returnsAndWarranty && (
          <div className="bg-surface rounded-2xl p-5 border border-line space-y-3">
            <h3 className="text-sm sm:text-base font-black text-fg border-b border-line pb-2.5 flex items-center justify-between">
              <span>🔄 ثامناً: تقرير المرتجعات وطلبات استبدال الضمان ({rep.periodReturns.length} طلب في الفترة)</span>
              <span className="text-xs font-black text-rose-500">إجمالي تعويضات المرتجعات المقبولة: {formatMoney(rep.approvedReturnsLossBase)}</span>
            </h3>
            {rep.periodReturns.length === 0 ? (
              <div className="p-4 rounded-xl bg-surface2 text-muted font-bold text-center">لا توجد مرتجعات مسجلة خلال هذه الفترة.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {rep.periodReturns.map(ret => (
                  <div key={ret.id} className="p-3 rounded-xl bg-surface2 border border-line flex items-center justify-between gap-2">
                    <div>
                      <div className="font-black text-fg">{ret.partName} (الكمية: {ret.qty})</div>
                      <div className="text-[11px] text-muted">العميل: {ret.clientName} • فاتورة #{ret.orderId}</div>
                      <div className="text-[10px] text-muted">{ret.reason}</div>
                    </div>
                    <div className="text-left shrink-0">
                      <div className="font-mono font-black text-rose-500">{formatMoney(ret.refundAmountBase)}</div>
                      <span className="px-2 py-0.5 rounded bg-surface border border-line text-[10px] font-bold">{ret.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 9. Inventory Valuation & Shortages */}
        {gmReportSections.inventoryValuation && (
          <div className="bg-surface rounded-2xl p-5 border border-line space-y-4">
            <h3 className="text-sm sm:text-base font-black text-fg border-b border-line pb-2.5">
              🏭 تاسعاً: تقييم أصول المخزن الحالي والنواقص الحرجة (Inventory Valuation & Shortages)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-surface2 border border-line">
                <div className="text-[11px] text-muted font-bold">إجمالي القطع المتوفرة بالمخزن</div>
                <div className="text-lg font-black text-fg">{rep.totalInventoryUnits.toLocaleString()} قطعة</div>
                <div className="text-[10px] text-muted">في {parts.length} صنف مسجل</div>
              </div>
              <div className="p-3 rounded-xl bg-surface2 border border-line">
                <div className="text-[11px] text-muted font-bold">رأس مال البضاعة بالمخزن (بالتكلفة)</div>
                <div className="text-lg font-black text-amber-500">{formatMoney(rep.totalInventoryCostValueBase)}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface2 border border-line">
                <div className="text-[11px] text-muted font-bold">القيمة البيعية للبضاعة بالمخزن</div>
                <div className="text-lg font-black text-accent-text">{formatMoney(rep.totalInventoryRetailValueBase)}</div>
                <div className="text-[10px] text-emerald-500 font-bold">ربح متوقع: +{formatMoney(rep.expectedInventoryProfitBase)}</div>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <div className="text-[11px] text-rose-500 font-bold">نواقص وأصناف نفدت</div>
                <div className="text-lg font-black text-rose-500">{rep.outOfStockPartsList.length} نفد • {rep.lowStockPartsList.length} وشك النفاد</div>
              </div>
            </div>

            {(rep.outOfStockPartsList.length > 0 || rep.lowStockPartsList.length > 0) && (
              <div className="space-y-2">
                <div className="font-black text-fg">⚠️ قائمة الأصناف المطلوب إعادة توريدها للمخزن فوراً:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {[...rep.outOfStockPartsList, ...rep.lowStockPartsList].slice(0, 15).map(p => (
                    <div key={p.id} className="p-2.5 rounded-xl bg-surface2 border border-line flex items-center justify-between">
                      <span className="font-bold text-fg truncate">{p.name}</span>
                      <span className={`px-2 py-0.5 rounded font-mono font-black text-[10px] shrink-0 ${
                        (Number(p.stock) || 0) <= 0 ? 'bg-rose-600 text-white' : 'bg-amber-500/20 text-amber-500'
                      }`}>
                        الرصيد: {p.stock}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 10. Restock Waitlist & External Sourcing Requests */}
        {gmReportSections.restockAndSourcing && (
          <div className="bg-surface rounded-2xl p-5 border border-line space-y-3">
            <h3 className="text-sm sm:text-base font-black text-fg border-b border-line pb-2.5">
              🔔 عاشراً: طلبات العملاء لمنتجات غير متوفرة ("نبّهني عند التوفر": {rep.waitlistEntries.length} • "طلبات من برّه": {rep.activeSourcingList.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-surface2 border border-line space-y-1.5">
                <div className="font-black text-amber-500">أحدث المسجلين في قائمة "نبّهني عند التوفر":</div>
                {rep.waitlistEntries.length === 0 ? (
                  <div className="text-muted">لا توجد طلبات مسجلة حالياً.</div>
                ) : (
                  rep.waitlistEntries.slice(0, 8).map(w => (
                    <div key={w.id} className="flex items-center justify-between border-b border-line pb-1">
                      <span className="font-bold text-fg">{w.partName}</span>
                      <span className="font-mono text-[11px] text-accent-text">{w.clientName} ({w.phone})</span>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 rounded-xl bg-surface2 border border-line space-y-1.5">
                <div className="font-black text-[#2563EB]">طلبات التوفير الخاصة من الخارج (Sourcing):</div>
                {rep.activeSourcingList.length === 0 ? (
                  <div className="text-muted">لا توجد طلبات توفير مفتوحة.</div>
                ) : (
                  rep.activeSourcingList.slice(0, 8).map(s => (
                    <div key={s.id} className="flex items-center justify-between border-b border-line pb-1">
                      <span className="font-bold text-fg">{s.partName || s.modelName} (×{s.qty})</span>
                      <span className="text-[11px] text-muted">{s.clientName} • {s.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* 11. Detailed Invoices Table */}
        {gmReportSections.detailedInvoices && (
          <div className="bg-surface rounded-2xl p-5 border border-line space-y-3">
            <h3 className="text-sm sm:text-base font-black text-fg border-b border-line pb-2.5">
              🧾 الحادي عشر: كشف الفواتير التفصيلي للفترة ({rep.detailedInvoices.length} فاتورة)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-surface2 text-muted border-b border-line">
                    <th className="p-2 font-extrabold">رقم الفاتورة</th>
                    <th className="p-2 font-extrabold">التاريخ</th>
                    <th className="p-2 font-extrabold">العميل</th>
                    <th className="p-2 font-extrabold">المدينة</th>
                    <th className="p-2 font-extrabold">الدفع</th>
                    <th className="p-2 font-extrabold">الحالة</th>
                    <th className="p-2 font-extrabold">القطع</th>
                    <th className="p-2 font-extrabold">صافي الفاتورة</th>
                    <th className="p-2 font-extrabold">التكلفة</th>
                    <th className="p-2 font-extrabold">صافي الربح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rep.detailedInvoices.map(inv => (
                    <tr key={inv.id}>
                      <td className="p-2 font-mono font-bold text-accent-text">{inv.id}</td>
                      <td className="p-2 font-mono text-[11px] text-muted">{inv.createdAt}</td>
                      <td className="p-2 font-bold text-fg">{inv.clientName}</td>
                      <td className="p-2 text-muted">{inv.city}</td>
                      <td className="p-2 text-[11px]">{inv.paymentMethod}</td>
                      <td className="p-2 font-bold">{inv.status}</td>
                      <td className="p-2 font-mono font-bold">{inv.qty}</td>
                      <td className="p-2 font-mono font-black text-fg">{formatMoney(inv.netTotalBase)}</td>
                      <td className="p-2 font-mono text-muted">{formatMoney(inv.costBase)}</td>
                      <td className="p-2 font-mono font-black text-emerald-600 dark:text-emerald-400">+{formatMoney(inv.profitBase)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 12. GM Recommendations & Signature Block */}
        {gmReportSections.gmRecommendations && (
          <div className="bg-surface rounded-2xl p-5 border-2 border-amber-400/50 space-y-4">
            <h3 className="text-sm sm:text-base font-black text-fg border-b border-line pb-2.5">
              🧠 الثاني عشر: توصيات وتنبيهات المدير العام الذكية والاعتماد الرسمي
            </h3>
            <ul className="space-y-2">
              {rep.gmInsights.map((ins, idx) => (
                <li key={idx} className="p-2.5 rounded-xl bg-surface2 border border-line font-bold text-fg">
                  {ins}
                </li>
              ))}
            </ul>
            {gmReportCustomNotes && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                <div className="font-black text-amber-500 mb-1">📝 ملاحظات وتوجيهات المدير العام:</div>
                <p className="text-fg font-bold whitespace-pre-wrap">{gmReportCustomNotes}</p>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-line text-center">
              <div className="space-y-6">
                <div className="font-extrabold text-muted">إعداد مسؤول الحسابات / المخزن</div>
                <div className="border-b border-dashed border-line w-40 mx-auto" />
              </div>
              <div className="space-y-6">
                <div className="font-extrabold text-muted">مراجعة مدير المبيعات</div>
                <div className="border-b border-dashed border-line w-40 mx-auto" />
              </div>
              <div className="space-y-6">
                <div className="font-black text-fg">يعتمد، المدير العام ({siteSettings.storeName || 'ELZOGHBI'})</div>
                <div className="border-b border-dashed border-line w-40 mx-auto" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  
}

export function renderAdminExecutiveReportsView(ctx) {
  const { computeGmReportData, gmReportCustomNotes, gmReportDateFrom, gmReportDateTo, gmReportOrderFilter, gmReportPreset, gmReportSections, handleExportGmReportCsv, handleSelectGmReportPreset, renderGmReportDocumentContent, setGmReportCustomNotes, setGmReportDateFrom, setGmReportDateTo, setGmReportOrderFilter, setGmReportPreset, setGmReportPrintPreviewOpen, setGmReportSections } = ctx;
    const rep = computeGmReportData();
    const sectionOptions = [
      { key: 'financialSummary', icon: '💰', label: '1. الملخص المالي وصافي الأرباح والهامش %' },
      { key: 'ordersStatus', icon: '📦', label: '2. تفصيل حالات الطلبات ونسب التسليم والإلغاء' },
      { key: 'paymentMethods', icon: '💳', label: '3. السيولة النقدية وطرق الدفع والتحصيل' },
      { key: 'topProducts', icon: '🏆', label: '4. الأصناف الأكثر مبيعاً والأعلى ربحية' },
      { key: 'categoriesAndBrands', icon: '📊', label: '5. أداء المبيعات والأرباح حسب الأقسام والماركات' },
      { key: 'clientsAndDebts', icon: '👥', label: '6. كبار العملاء + مديونيات الآجل وأرصدة المحافظ' },
      { key: 'croAndMarketing', icon: '🚀', label: '7. أداء العروض والكوبونات والكاش باك وسقف المبيعات' },
      { key: 'returnsAndWarranty', icon: '🔄', label: '8. تقرير المرتجعات وطلبات الضمان والتعويضات' },
      { key: 'inventoryValuation', icon: '🏭', label: '9. تقييم أصول المخزن الحالي والنواقص الحرجة' },
      { key: 'restockAndSourcing', icon: '🔔', label: '10. طلبات "نبّهني عند التوفر" وطلبات التوفير الخارجي' },
      { key: 'detailedInvoices', icon: '🧾', label: '11. جدول الفواتير التفصيلي للفترة بالتكلفة والربح' },
      { key: 'gmRecommendations', icon: '🧠', label: '12. توصيات المدير العام الذكية وخانات التوقيع والاعتماد' }
    ];

    return (
      <div className="space-y-5 text-xs">
        {/* Builder Controls Card */}
        <div className="bg-surface rounded-3xl p-6 border-2 border-[#3B82F6]/45 shadow-lg space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[11px]">
                📊 EXECUTIVE GM REPORT BUILDER & PRINTER
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-fg mt-2">
                بناء وتخصيص وطباعة تقرير المدير العام (يومي أو بتحديد تواريخ)
              </h2>
              <p className="text-xs text-muted mt-0.5">
                حدّد الفترة الزمنية، اختر الأقسام التي تهمك كمدير عام لضمها في التقرير، ثم اضغط طباعة (A4 / PDF) أو تصدير لـ Excel.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setGmReportPrintPreviewOpen(true)}
                className="px-5 py-3 rounded-xl bg-gradient-to-l from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs flex items-center gap-2 shadow-lg"
              >
                <Printer className="w-4 h-4" />
                <span>🖨️ معاينة وطباعة التقرير الرسمي (A4 / PDF)</span>
              </button>
              <button
                type="button"
                onClick={handleExportGmReportCsv}
                className="px-4 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black text-xs flex items-center gap-1.5 shadow-md"
              >
                <span>📥 تصدير التقرير لـ Excel (CSV)</span>
              </button>
            </div>
          </div>

          {/* Step 1: Date Range Presets & Custom Dates */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-2">
              <label className="font-black text-fg block">📅 أولاً: اختر الفترة الزمنية للتقرير (يومي أو مخصص):</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'today', label: '📅 تقرير اليوم' },
                  { id: 'yesterday', label: '⏪ تقرير أمس' },
                  { id: 'last7', label: '📆 آخر 7 أيام' },
                  { id: 'month', label: '🗓️ هذا الشهر' },
                  { id: 'all', label: '♾️ كل الفترات (شامل)' },
                  { id: 'custom', label: '🎯 تحديد تواريخ يدوياً' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectGmReportPreset(p.id)}
                    className={`px-3.5 py-2 rounded-xl font-black border transition ${
                      gmReportPreset === p.id
                        ? 'bg-accent text-accent-ink border-accent shadow-xs'
                        : 'bg-surface2 text-fg border-line hover:border-accent'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-bold text-muted block mb-1">من تاريخ (From Date):</label>
                  <input
                    type="date"
                    value={gmReportDateFrom}
                    onChange={e => { setGmReportPreset('custom'); setGmReportDateFrom(e.target.value); }}
                    className="w-full p-2.5 rounded-xl border border-line font-mono font-black"
                  />
                </div>
                <div>
                  <label className="font-bold text-muted block mb-1">إلى تاريخ (To Date):</label>
                  <input
                    type="date"
                    value={gmReportDateTo}
                    onChange={e => { setGmReportPreset('custom'); setGmReportDateTo(e.target.value); }}
                    className="w-full p-2.5 rounded-xl border border-line font-mono font-black"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-black text-fg block mb-1">🎯 نطاق الفواتير المحسوبة في الأرباح:</label>
                <select
                  value={gmReportOrderFilter}
                  onChange={e => setGmReportOrderFilter(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-line font-black"
                >
                  <option value="valid_all">كل الطلبات النشطة والمسلمة (بدون الملغي)</option>
                  <option value="delivered_only">الطلبات المسلمة والمحصلة فعلياً فقط (تم التسليم)</option>
                  <option value="all_including_cancelled">جميع الطلبات شاملة الملغي</option>
                </select>
              </div>
              <div>
                <label className="font-black text-fg block mb-1">📝 ملاحظات المدير العام (تظهر في التقرير المطبوع):</label>
                <textarea
                  rows={2}
                  value={gmReportCustomNotes}
                  onChange={e => setGmReportCustomNotes(e.target.value)}
                  placeholder="اكتب أي توجيهات للمخزن أو المبيعات لتظهر أسفل التقرير..."
                  className="w-full p-2.5 rounded-xl border border-line font-bold"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Checkboxes for What the Report Should Include */}
          <div className="space-y-3 pt-3 border-t border-line">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="font-black text-fg text-sm">
                ☑️ ثانياً: حدّد ماذا تريد أن يضم التقرير (اختر الأقسام التي تهمك كمدير عام):
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allOn = {};
                    sectionOptions.forEach(s => { allOn[s.key] = true; });
                    setGmReportSections(allOn);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 font-black text-[11px]"
                >
                  ✓ تحديد كل الأقسام (تقرير شامل)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setGmReportSections({
                      financialSummary: true,
                      ordersStatus: true,
                      paymentMethods: true,
                      topProducts: true,
                      categoriesAndBrands: false,
                      clientsAndDebts: true,
                      croAndMarketing: false,
                      returnsAndWarranty: false,
                      inventoryValuation: true,
                      restockAndSourcing: false,
                      detailedInvoices: false,
                      gmRecommendations: true
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 font-black text-[11px]"
                >
                  ⚡ تقرير مالي وتنفيذي مختصر (ورقة واحدة)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {sectionOptions.map(sec => {
                const checked = Boolean(gmReportSections[sec.key]);
                return (
                  <label
                    key={sec.key}
                    className={`p-3 rounded-2xl border-2 cursor-pointer flex items-center gap-2.5 transition select-none ${
                      checked
                        ? 'bg-accent/10 border-accent text-fg font-black'
                        : 'bg-surface2 border-line text-muted font-bold opacity-75'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={e => setGmReportSections(prev => ({ ...prev, [sec.key]: e.target.checked }))}
                      className="w-4 h-4 accent-cyan-500 shrink-0"
                    />
                    <span>{sec.icon}</span>
                    <span className="leading-snug">{sec.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Interactive Report Preview */}
        {renderGmReportDocumentContent(rep, false)}
      </div>
    );
  
}

export function renderGmReportPrintModal(ctx) {
  const { computeGmReportData, gmReportPrintPreviewOpen, gmReportSections, handleExportGmReportCsv, renderGmReportDocumentContent, setGmReportPrintPreviewOpen, siteSettings } = ctx;
    if (!gmReportPrintPreviewOpen) return null;
    const rep = computeGmReportData();
    return (
      <div className="fixed inset-0 bg-nav/90 backdrop-blur-xs z-[230] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div className="bg-surface rounded-3xl max-w-5xl w-full p-4 sm:p-6 border-2 border-[#3B82F6] shadow-2xl space-y-4 my-auto max-h-[94vh] flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3 print:hidden">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-accent-text" />
              <h3 className="text-base font-black text-fg">
                معاينة وطباعة تقرير المدير العام الرسمي (من {rep.fromStr} إلى {rep.toStr})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const showSec = (k) => !gmReportSections || gmReportSections[k] !== false;
                  const invRows = (rep.detailedInvoices || []).slice(0, 80).map(o => `
                    <tr>
                      <td>${escapeHtml(o.id)}</td>
                      <td>${escapeHtml(o.createdAt || '')}</td>
                      <td>${escapeHtml(o.clientName || 'زائر')}</td>
                      <td>${escapeHtml(o.paymentMethod || '')}</td>
                      <td>${escapeHtml(o.status || '')}</td>
                      <td>${Number(o.netTotalBase || 0).toLocaleString()} ج.م</td>
                      <td>${Number(o.profitBase || 0).toLocaleString()} ج.م</td>
                    </tr>`).join('');
                  const topProdRows = (rep.topProductsByQty || []).slice(0, 20).map(tp => `
                    <tr>
                      <td>${escapeHtml(tp.name)}</td>
                      <td>${Number(tp.qtySold) || 0}</td>
                      <td>${Number(tp.revenueBase || 0).toLocaleString()} ج.م</td>
                      <td>${Number(tp.profitBase || 0).toLocaleString()} ج.م</td>
                    </tr>`).join('');
                  const catRows = (rep.categoriesBreakdown || []).slice(0, 15).map(c => `
                    <tr>
                      <td>${escapeHtml(c.category)}</td>
                      <td>${Number(c.qtySold) || 0}</td>
                      <td>${Number(c.revenueBase || 0).toLocaleString()} ج.م</td>
                      <td>${Number(c.profitBase || 0).toLocaleString()} ج.م</td>
                    </tr>`).join('');
                  const lowStockRows = [...(rep.outOfStockPartsList || []), ...(rep.lowStockPartsList || [])].slice(0, 35).map(p => `
                    <tr>
                      <td>${escapeHtml(p.sku || p.id)}</td>
                      <td>${escapeHtml(p.name)}</td>
                      <td>${Number(p.stock) || 0}</td>
                      <td>${Number(p.basePrice || 0).toLocaleString()} ج.م</td>
                    </tr>`).join('');
                  const topClientsRows = (rep.topClientsInPeriod || []).slice(0, 15).map(cl => `
                    <tr>
                      <td>${escapeHtml(cl.clientName || cl.name || 'عميل')}</td>
                      <td>${Number(cl.ordersCount) || 0}</td>
                      <td>${Number(cl.totalSpentBase || 0).toLocaleString()} ج.م</td>
                    </tr>`).join('');
                  const insightsHtml = (rep.gmInsights || []).map(ins => `<li style="margin-bottom:4px;">${escapeHtml(ins)}</li>`).join('');
                  const htmlBody = `
                    <div class="hdr">
                      <div class="brand">
                        <div class="brand-badge">E</div>
                        <div>
                          <h1>${escapeHtml(siteSettings.storeName || 'ELZOGHBI')} — التقرير التنفيذي للمدير العام</h1>
                          <p>نموذج رسمي معتمد للطباعة والحفظ كـ PDF (A4)</p>
                        </div>
                      </div>
                      <div class="meta">
                        <div><strong>الفترة:</strong> من ${escapeHtml(rep.fromStr)} إلى ${escapeHtml(rep.toStr)}</div>
                        <div><strong>تاريخ الإصدار:</strong> ${escapeHtml(new Date().toLocaleString('ar-EG'))}</div>
                      </div>
                    </div>
                    <div class="kpi-grid">
                      <div class="kpi-box"><div class="kpi-label">صافي المبيعات</div><div class="kpi-val">${Number(rep.netSalesAfterDiscountBase || 0).toLocaleString()} ج.م</div></div>
                      <div class="kpi-box"><div class="kpi-label">صافي الأرباح (${Number(rep.profitMarginPct) || 0}%)</div><div class="kpi-val">${Number(rep.netOperatingProfitBase || 0).toLocaleString()} ج.م</div></div>
                      <div class="kpi-box"><div class="kpi-label">الطلبات الصالحة / المسلّمة</div><div class="kpi-val">${(rep.periodValidOrders || []).length} طلب (${Number(rep.deliveredOrdersCount) || 0} مُسلّم)</div></div>
                      <div class="kpi-box"><div class="kpi-label">قيمة المخزون الحالي</div><div class="kpi-val">${Number(rep.totalInventoryRetailValueBase || 0).toLocaleString()} ج.م (${Number(rep.totalInventoryUnits) || 0} قطعة)</div></div>
                    </div>
                    ${insightsHtml ? `<div class="sec"><div class="sec-title">ملخص وتوصيات المدير العام</div><ul style="margin:6px 0 0;padding-right:18px;">${insightsHtml}</ul></div>` : ''}
                    ${showSec('detailedInvoices') && invRows ? `<div class="sec"><div class="sec-title">سجل الفواتير والطلبات (${(rep.detailedInvoices || []).length})</div><table><thead><tr><th>رقم الفاتورة</th><th>التاريخ</th><th>العميل</th><th>الدفع</th><th>الحالة</th><th>الإجمالي</th><th>الربح</th></tr></thead><tbody>${invRows}</tbody></table></div>` : ''}
                    ${showSec('topProducts') && topProdRows ? `<div class="sec"><div class="sec-title">الأصناف الأكثر مبيعاً</div><table><thead><tr><th>اسم الصنف</th><th>الكمية المباعة</th><th>الإيراد</th><th>الربح</th></tr></thead><tbody>${topProdRows}</tbody></table></div>` : ''}
                    ${showSec('categoriesAndBrands') && catRows ? `<div class="sec"><div class="sec-title">أداء التصنيفات</div><table><thead><tr><th>التصنيف</th><th>القطع المباعة</th><th>الإيراد</th><th>الربح</th></tr></thead><tbody>${catRows}</tbody></table></div>` : ''}
                    ${showSec('clientsAndDebts') && topClientsRows ? `<div class="sec"><div class="sec-title">أعلى العملاء شراءً</div><table><thead><tr><th>اسم العميل</th><th>عدد الطلبات</th><th>إجمالي المشتريات</th></tr></thead><tbody>${topClientsRows}</tbody></table></div>` : ''}
                    ${showSec('inventoryValuation') && lowStockRows ? `<div class="sec"><div class="sec-title">تنبيهات المخزون المنخفض والمنتهي</div><table><thead><tr><th>الكود</th><th>الصنف</th><th>الرصيد</th><th>سعر البيع</th></tr></thead><tbody>${lowStockRows}</tbody></table></div>` : ''}
                    <div class="footer-sign">
                      <span>توقيع المدير العام: _______________________</span>
                      <span>اعتماد إدارة المتجر — ${escapeHtml(siteSettings.storeName || 'ELZOGHBI')}</span>
                    </div>`;
                  openCleanA4PrintWindow(`تقرير_ELZOGHBI_${rep.fromStr}_${rep.toStr}`, htmlBody);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black text-xs flex items-center gap-1.5 shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>🖨️ طباعة تقرير A4 احترافي / تصدير PDF</span>
              </button>
              <button
                type="button"
                onClick={handleExportGmReportCsv}
                className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-black text-xs"
              >
                📥 تحميل Excel
              </button>
              <button
                type="button"
                onClick={() => setGmReportPrintPreviewOpen(false)}
                className="px-3.5 py-2.5 rounded-xl bg-surface2 text-muted hover:text-fg font-bold text-xs"
              >
                إغلاق
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {renderGmReportDocumentContent(rep, false)}
          </div>
        </div>
      </div>
    );
  
}

export function renderAdminDatabaseSchema(ctx) {
  const {  } = ctx;
  return (<div className="bg-nav2 text-nav-fg rounded-2xl p-6 border border-line space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">
            مخطط مرجعي مقترح (Prisma) — ليس قاعدة البيانات الفعلية (الإنتاج يعمل على Supabase)
          </h2>
          <p className="text-xs text-muted">
            يغطي نظام العملات المتعددة، مجموعات التسعير، التوافق المشترك للموديلات، حركات المخزون، وكشف الحساب المالي (Ledger)
          </p>
        </div>
      </div>
      <pre dir="ltr" className="bg-nav p-4 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto leading-relaxed">
{`// Prisma Schema for B2B/B2C Mobile Spare Parts & Inventory ERP

model Currency {
  code           String         @id // 'EGP', 'SAR', 'AED', 'USD', 'EUR'
  nameAr         String
  symbol         String
  rateFromBase   Decimal        @db.Decimal(12, 6) // Base Currency = EGP (1.0)
  pricingGroups  PricingGroup[]
}

model PricingGroup {
  id             String               @id @default(cuid())
  name           String
  currencyCode   String
  currency       Currency             @relation(fields: [currencyCode], references: [code])
  isDefault      Boolean              @default(false)
  modifierType   ModifierType         @default(PERCENTAGE) // PERCENTAGE | FLAT
  modifierValue  Decimal              @db.Decimal(10, 2)
  clients        Client[]
  partOverrides  PartGroupPrice[]
}

model MobileModel {
  id             String      @id @default(cuid())
  brand          String
  name           String
  searchAliases  String      // Bilingual & Board codes (e.g. "15pm A2849 ايفون 15 برو ماكس")
  spareParts     SparePart[]
}

model SparePart {
  id                 String           @id @default(cuid())
  sku                String           @unique
  primaryModelId     String
  primaryModel       MobileModel      @relation(fields: [primaryModelId], references: [id])
  category           String           // شاشات، بطاريات، فلاتات شحن، كاميرات
  name               String
  qualityGrade       String           // Service Pack, Pulled, OLED, In-Cell
  colors             String[]
  compatibleModels   String[]         // Cross-compatibility shared stock tags
  warrantyTerms      String
  stockQty           Int              @default(0)
  lowStockThreshold  Int              @default(5)
  maxOrderQty        Int              @default(10)
  costPriceBase      Decimal          @db.Decimal(12, 2) // Strictly Admin-only
  basePrice          Decimal          @db.Decimal(12, 2)
  waitlistCount      Int              @default(0)
  groupOverrides     PartGroupPrice[]
}

model Client {
  id             String         @id @default(cuid())
  shopName       String
  ownerName      String
  phone          String         @unique
  address        String
  groupId        String
  pricingGroup   PricingGroup   @relation(fields: [groupId], references: [id])
  walletBalance  Decimal        @default(0) @db.Decimal(12, 2) // + Credit (له) / - Debt (عليه)
  creditLimit    Decimal        @default(0) @db.Decimal(12, 2)
  orders         OrderInvoice[]
  ledgerEntries  LedgerEntry[]
}

model OrderInvoice {
  id               String      @id // e.g., INV-1045
  clientId         String
  client           Client      @relation(fields: [clientId], references: [id])
  status           OrderStatus // RECEIVED, PREPARING, READY, IN_DELIVERY, DELIVERED, CANCELLED
  paymentMethod    String
  exchangeRateUsed Decimal     @db.Decimal(12, 6)
  adminEdited      Boolean     @default(false)
  adminEditNote    String?
  items            OrderItem[]
  createdAt        DateTime    @default(now())
}`}
      </pre>
    </div>);
}
