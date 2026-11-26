import { Database, RefreshCw, Save, Smartphone, Layers, Upload, Search, Plus, Trash2, Tag, TrendingUp } from 'lucide-react';
import { isOrPrefixedName } from '../lib/catalogUtils.js';
import { PART_IMAGES } from '../data/constants.jsx';
import { BlurFitImage } from '../components/widgets.jsx';
import { Edit3 } from '../lib/utils.jsx';

export function renderAdminCatalog(ctx) {
  const { activeCatalogPricingGroupId, adminCatalogBrand, adminCatalogSearch, adminCatalogSort, adminOrFilterMode, adminStockFilter, askConfirmDelete, autoGenerateParts, autoTemplates, brandImages, brands, calculatePartPrice, expandedAdminBrands, expandedAdminModels, fetchSparePartsSliceOnDemand, fetchedModelPartsSetRef, getPartCashbackPct, getPartImagesList, groups, handleCloudSyncOrCatalog, handleCreateModelWithTemplate, handleDeleteModel, handleDeletePart, handleInjectMissingTemplatesIntoModel, handleLiveFetchMoreOrProducts, handleNewModelImageFileUpload, handleToggleTargetedAdModel, handleToggleTargetedAdPart, isBrandHidden, isModelHidden, isPartCashbackEnabled, isPartHidden, isPartPinnedToCashier, isPartVipOnly, models, newModelAliases, newModelBrand, newModelImage, newModelName, orCloudSyncState, orLiveFetchState, partCountByBrandMap, partCountByModelIdMap, parts, pushToSupabaseCloud, resolvePartModelObj, sbDelete, setActiveCatalogPricingGroupId, setAddingPartToModel, setAdminCatalogBrand, setAdminCatalogSearch, setAdminCatalogSort, setAdminOrFilterMode, setAdminRestockWhatsappPart, setAdminStockFilter, setAutoGenerateParts, setBrandManagerOpen, setBrands, setEditingBrandImageFor, setEditingModelObj, setEditingPartObj, setExpandedAdminBrands, setExpandedAdminModels, setGroupModalSearchQuery, setModels, setNewModelAliases, setNewModelBrand, setNewModelImage, setNewModelName, setPartGroupPricesModalPart, setParts, setTemplateManagerOpen, showToast, siteSettings, toggleHideBrand, toggleHideModel, toggleHidePart, togglePartCashback, togglePartCashierPin, togglePartVipOnly } = ctx;
    const enabledCount = autoTemplates.filter(t => t.enabled).length;
    const nonDefaultGroups = groups.filter(g => !g.isDefault);
    const displayedGroupsInTable =
      activeCatalogPricingGroupId === 'ALL'
        ? nonDefaultGroups.slice(0, 2)
        : nonDefaultGroups.filter(g => g.id === activeCatalogPricingGroupId);

    const searchQ = adminCatalogSearch.trim().toLowerCase();
    const orPartsTotalCount = parts.filter(p => p?._isOrCatalog || String(p?.id || '').startsWith('or_prt_') || isOrPrefixedName(p?.name)).length;
    const orBrandsTotalCount = brands.filter(b => isOrPrefixedName(b)).length;
    const orModelsTotalCount = models.filter(m => String(m?.id || '').startsWith('or_mdl_') || isOrPrefixedName(m?.brand)).length;

    const visibleBrands = brands.filter(b => {
      const isOrBrand = isOrPrefixedName(b);
      if (adminOrFilterMode === 'OR_ONLY' && !isOrBrand) return false;
      if (adminOrFilterMode === 'NON_OR' && isOrBrand) return false;
      if (adminCatalogBrand !== 'ALL' && b !== adminCatalogBrand) return false;
      if (searchQ !== '') {
        if (b.toLowerCase().includes(searchQ)) return true;
        const bModels = models.filter(m => m.brand === b);
        return bModels.some(m => {
          const mMatch = `${m.brand} ${m.name} ${m.aliases || ''}`.toLowerCase().includes(searchQ);
          if (mMatch) return true;
          return parts
            .filter(p => String(p.modelId) === String(m.id))
            .some(p => `${p.name} ${p.sku} ${p.category} ${p.qualityGrade}`.toLowerCase().includes(searchQ));
        });
      }
      return true;
    });

    const toggleBrandBar = (brandName) => {
      const willOpen = !expandedAdminBrands[brandName];
      setExpandedAdminBrands(prev => ({ ...prev, [brandName]: willOpen }));
      if (willOpen) {
        fetchSparePartsSliceOnDemand({ brand: brandName, limit: 500 });
      }
    };

    const toggleModelBar = (modelId) => {
      const willOpen = !expandedAdminModels[modelId];
      setExpandedAdminModels(prev => ({ ...prev, [modelId]: willOpen }));
      if (willOpen && !fetchedModelPartsSetRef.current.has(String(modelId))) {
        fetchedModelPartsSetRef.current.add(String(modelId));
        Promise.resolve(fetchSparePartsSliceOnDemand({ modelId, limit: 100 })).catch(() => {
          fetchedModelPartsSetRef.current.delete(String(modelId));
        });
      }
    };

    const collapseAllBars = () => {
      setExpandedAdminBrands({});
      setExpandedAdminModels({});
    };

    return (
      <div className="space-y-5">
        {/* OR Multi-Store Catalog Control Center (Zero Storage Egress) */}
        <div className="bg-gradient-to-l from-slate-950/90 via-slate-900 to-emerald-950/80 rounded-2xl p-4 border border-slate-500/35 shadow-sm text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-black tracking-wide">
                  OR CATALOG
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-white">
                  كتالوج المنتجات المدمج من المتاجر الـ 4 (بادئة OR • كمية 5 قطع • نفس سعر المصدر)
                </h3>
              </div>
              <p className="text-xs text-slate-300">
                إجمالي مدمج الآن: <strong className="text-amber-300">{orPartsTotalCount} منتج فريد</strong> مصنف في{' '}
                <strong className="text-slate-300">{orBrandsTotalCount} نوع/ماركة (OR)</strong> و{' '}
                <strong className="text-emerald-300">{orModelsTotalCount} موديل (OR)</strong> — جميع الصور مرتبطة مباشرة بروابط CDN المواقع الأصلية (صفر استهلاك Supabase Storage).
              </p>
              {(orCloudSyncState.msg || orLiveFetchState.msg) && (
                <p className="text-xs font-bold text-amber-300 pt-0.5">
                  {orCloudSyncState.busy ? orCloudSyncState.msg : (orLiveFetchState.msg || orCloudSyncState.msg)}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setAdminOrFilterMode(prev => (prev === 'OR_ONLY' ? 'ALL' : 'OR_ONLY'))}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition ${
                  adminOrFilterMode === 'OR_ONLY'
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                {adminOrFilterMode === 'OR_ONLY' ? '✓ معروض: منتجات OR فقط (إظهار الكل)' : `🔍 فلتر منتجات OR فقط (${orPartsTotalCount})`}
              </button>

              <button
                type="button"
                onClick={() => setAdminOrFilterMode(prev => (prev === 'NON_OR' ? 'ALL' : 'NON_OR'))}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition ${
                  adminOrFilterMode === 'NON_OR'
                    ? 'bg-slate-400 text-slate-950 border-slate-300 shadow-sm'
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
              >
                {adminOrFilterMode === 'NON_OR' ? '✓ معروض: منتجاتي الأصلية فقط' : '📱 منتجاتي الأصلية بدون OR'}
              </button>

              <button
                type="button"
                disabled={orCloudSyncState.busy}
                onClick={handleCloudSyncOrCatalog}
                className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-sm transition"
              >
                <Database className="w-4 h-4" />
                <span>
                  {orCloudSyncState.busy
                    ? `جاري الرفع (${orCloudSyncState.done}/${orCloudSyncState.total})...`
                    : `☁️ تثبيت وحفظ كتالوج OR في Supabase (${orPartsTotalCount})`}
                </span>
              </button>

              <button
                type="button"
                disabled={orLiveFetchState.busy}
                onClick={handleLiveFetchMoreOrProducts}
                className="px-3 py-2 rounded-xl bg-slate-500/30 hover:bg-slate-500/50 disabled:opacity-60 text-slate-100 border border-slate-400/40 text-xs font-extrabold flex items-center gap-1.5 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${orLiveFetchState.busy ? 'animate-spin' : ''}`} />
                <span>استكمال أي صفحات إضافية من المتاجر الـ 4</span>
              </button>
            </div>
          </div>
        </div>

        {/* Top Control Header: Add Model Form, Brands Manager & Auto-Template Customizer */}
        <div className="bg-surface rounded-2xl p-5 border border-line shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <h2 className="text-base font-extrabold text-fg">
                البراندات والموديلات والمنتجات (شرائط قابلة للتوسع عند الضغط على +)
              </h2>
              <p className="text-xs text-muted mt-0.5">
                جميع الشرائط في الوضع المصغر افتراضياً لسرعة التصفح — اضغط <span className="font-mono font-bold">[ + ]</span> على البراند لإظهار موديلاته، ثم اضغط <span className="font-mono font-bold">[ + ]</span> على الموديل لإظهار منتجاته
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const allOpen = {};
                  visibleBrands.forEach(b => { allOpen[b] = true; });
                  setExpandedAdminBrands(allOpen);
                }}
                className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-slate-950 border border-amber-500/30 text-xs font-extrabold transition"
              >
                + فتح كل البراندات
              </button>
              <button
                type="button"
                onClick={collapseAllBars}
                className="px-3 py-2 rounded-xl bg-surface2 hover:bg-line text-fg border border-line text-xs font-extrabold transition"
              >
                − طي كل الشرائط
              </button>

              <button
                type="button"
                onClick={() => pushToSupabaseCloud(null, true)}
                className="px-4 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
              >
                <Save className="w-4 h-4" />
                <span>حفظ وتأكيد الكتالوج ✓</span>
              </button>

              <button
                onClick={() => setBrandManagerOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-nav2 hover:bg-nav2 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs"
              >
                <Smartphone className="w-4 h-4 text-amber-400" />
                إدارة البراندات ({brands.length})
              </button>

              <button
                onClick={() => setTemplateManagerOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-600 hover:bg-slate-700 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-xs"
              >
                <Layers className="w-4 h-4" />
                تخصيص التمبلت التلقائي ({enabledCount})
              </button>
            </div>
          </div>

          {/* Add New Mobile Model Form */}
          <form onSubmit={handleCreateModelWithTemplate} className="bg-surface2 p-4 rounded-xl border border-line space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-fg">
                + إضافة موديل هاتف جديد للبراند ({newModelBrand}):
              </span>
              <div className="flex items-center gap-2 text-xs">
                <img
                  src={newModelImage}
                  alt="صورة الموديل"
                  className="w-8 h-8 rounded-lg object-cover border border-line"
                />
                <label className="px-2.5 py-1 rounded-lg bg-nav2 text-white font-bold cursor-pointer flex items-center gap-1">
                  <Upload className="w-3 h-3" />
                  رفع صورة للموديل
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleNewModelImageFileUpload}
                    className="hidden"
                  />
                </label>
                <select
                  value={newModelImage}
                  onChange={e => setNewModelImage(e.target.value)}
                  className="p-1 rounded-lg border border-line bg-surface text-[11px] font-bold"
                >
                  <option value={PART_IMAGES.screen}>صورة افتراضية: شاشة</option>
                  <option value={PART_IMAGES.camera}>صورة افتراضية: كاميرا</option>
                  <option value={PART_IMAGES.battery}>صورة افتراضية: بطارية</option>
                  <option value={PART_IMAGES.flex}>صورة افتراضية: فلاتة</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 text-xs">
              <div className="flex gap-1.5">
                <select
                  value={newModelBrand}
                  onChange={e => setNewModelBrand(e.target.value)}
                  className="flex-1 p-2.5 rounded-xl border border-line bg-surface font-bold"
                >
                  {brands.map(b => (
                    <option key={b} value={b}>
                      البراند: {b}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setBrandManagerOpen(true)}
                  className="px-2.5 py-2 rounded-xl bg-surface2 hover:bg-surface2 text-fg font-bold"
                  title="إضافة أو تعديل براند"
                >
                  + نوع
                </button>
              </div>

              <input
                id="elzoghbi-new-model-name-input"
                type="text"
                required
                value={newModelName}
                onChange={e => setNewModelName(e.target.value)}
                placeholder="اسم الموديل (مثال: iPhone 16 Pro Max)..."
                className="p-2.5 rounded-xl border border-line bg-surface font-bold"
              />

              <input
                type="text"
                value={newModelAliases}
                onChange={e => setNewModelAliases(e.target.value)}
                placeholder="مرادفات البحث بالعربي ورقم البوردة..."
                className="p-2.5 rounded-xl border border-line bg-surface"
              />

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs text-fg font-bold bg-surface px-3 py-2 rounded-xl border border-line cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoGenerateParts}
                    onChange={e => setAutoGenerateParts(e.target.checked)}
                    className="accent-slate-600 w-4 h-4"
                  />
                  <span>تنزيل التمبلت ({enabledCount})</span>
                </label>

                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-xs"
                >
                  + إضافة الموديل
                </button>
              </div>
            </div>
          </form>

          {/* Search, Filter & Pricing Group Selector */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 text-xs">
            <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:flex-wrap sm:items-center flex-1 [&>select]:w-full [&>select]:min-w-0 [&>select]:text-xs sm:[&>select]:w-auto sm:[&>select]:text-sm">
              <div className="relative col-span-2 flex-1 min-w-0 sm:min-w-[200px]">
                <Search className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={adminCatalogSearch}
                  onChange={e => setAdminCatalogSearch(e.target.value)}
                  placeholder="ابحث باسم البراند، الموديل، اسم القطعة، أو الكود SKU..."
                  className="w-full pr-9 pl-3 py-2 rounded-xl border border-line font-bold"
                />
              </div>

              <select
                value={adminCatalogBrand}
                onChange={e => setAdminCatalogBrand(e.target.value)}
                className="px-3 py-2 rounded-xl border border-line bg-surface2 font-bold"
              >
                <option value="ALL">البراند: الكل ({brands.length})</option>
                {brands.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>

              <select
                value={adminStockFilter}
                onChange={e => setAdminStockFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-line bg-surface2 font-bold"
              >
                <option value="ALL">المخزون: الكل</option>
                <option value="IN_STOCK">متوفر بالمخزن (&gt; 0)</option>
                <option value="LOW_STOCK">نواقص المخزن</option>
                <option value="OUT_OF_STOCK">نفذت الكمية (0)</option>
              </select>

              <select
                value={adminCatalogSort}
                onChange={e => setAdminCatalogSort(e.target.value)}
                className="px-3 py-2 rounded-xl border border-line bg-surface2 font-bold"
              >
                <option value="date_desc">الترتيب: الأحدث إضافة</option>
                <option value="name_asc">الترتيب بالاسم (أ - ي)</option>
                <option value="stock_desc">العدد: الأكثر مخزوناً</option>
                <option value="stock_asc">العدد: الأقل مخزوناً</option>
                <option value="price_desc">السعر: الأعلى أولاً</option>
                <option value="price_asc">السعر: الأقل أولاً</option>
              </select>

              <select
                value={activeCatalogPricingGroupId}
                onChange={e => setActiveCatalogPricingGroupId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-line bg-bg text-fg font-extrabold"
              >
                <option value="ALL">عرض أول مجموعتين بالجدول (من {nonDefaultGroups.length})</option>
                {nonDefaultGroups.map(g => (
                  <option key={g.id} value={g.id}>
                    تركيز تعديل أسعار: {g.name} ({g.currency})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stacked Collapsible Brand Bars -> Click [+] to reveal Model Bars -> Click [+] to reveal Products */}
        <div className="space-y-3">
          {visibleBrands.map(brandName => {
            const isBrandOpen = !!expandedAdminBrands[brandName];
            const brandModels = models.filter(m => {
              if (m.brand !== brandName) return false;
              if (searchQ !== '') {
                const mMatch = `${m.brand} ${m.name} ${m.aliases || ''}`.toLowerCase().includes(searchQ);
                if (mMatch) return true;
                return parts
                  .filter(p => String(p.modelId) === String(m.id))
                  .some(p => `${p.name} ${p.sku} ${p.category} ${p.qualityGrade}`.toLowerCase().includes(searchQ));
              }
              return true;
            });
            const brandModelIds = new Set(brandModels.map(m => String(m.id)));
            const brandPartsCount = searchQ === "" ? (partCountByBrandMap.get(brandName) || 0) : brandModels.reduce((acc, m) => acc + (partCountByModelIdMap.get(String(m.id)) || 0), 0);

            return (
              <div key={brandName} className="bg-surface rounded-2xl border border-line overflow-hidden shadow-xs">
                {/* Level 1: Collapsible Brand Bar Header (High Contrast in Light & Dark Mode!) */}
                <div className="p-3.5 sm:p-4 bg-surface2 text-fg border-b border-line flex flex-wrap items-center justify-between gap-3">
                  <div
                    onClick={() => toggleBrandBar(brandName)}
                    className="flex items-center gap-3 cursor-pointer select-none flex-1 min-w-[200px]"
                  >
                    <button
                      type="button"
                      className={`w-9 h-9 rounded-xl font-mono font-black text-lg flex items-center justify-center transition ${
                        isBrandOpen
                          ? 'bg-accent text-accent-ink shadow-sm'
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm'
                      }`}
                      title={isBrandOpen ? 'إغلاق شريط البراند (−)' : 'فتح شريط البراند وعرض الموديلات (+)'}
                    >
                      {isBrandOpen ? '−' : '+'}
                    </button>

                    <div className="w-10 h-10 rounded-xl bg-surface border border-line overflow-hidden flex items-center justify-center shrink-0">
                      {brandImages[brandName] ? (
                        <img
                          src={brandImages[brandName]}
                          alt={brandName}
                          loading="lazy"
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                          className="w-full h-full object-contain bg-surface p-0.5"
                        />
                      ) : (
                        <Smartphone className="w-5 h-5 text-accent-text" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-base sm:text-lg tracking-wide text-fg">{brandName}</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-accent/15 text-accent-text text-[11px] font-extrabold border border-accent/30">
                          {brandModels.length} موديل
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-go/15 text-go text-[11px] font-extrabold border border-go/30">
                          {brandPartsCount} منتج
                        </span>
                      </div>
                      <div className="hidden sm:block text-[11px] text-muted font-bold mt-0.5">
                        {isBrandOpen ? 'اضغط (−) لإغلاق شريط البراند' : 'اضغط (+) لإظهار شرائط الموديلات التابعة لهذا البراند'}
                      </div>
                    </div>
                  </div>

                  {/* Buttons inside Brand Bar: Hide/Show Brand + Brand Image + Add Model + Delete Entire Brand */}
                  <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto sm:flex sm:flex-wrap sm:items-center sm:gap-2 [&>button]:justify-center [&>button]:px-2 [&>button]:py-1.5 [&>button]:text-[11px] sm:[&>button]:px-3 sm:[&>button]:py-2 sm:[&>button]:text-xs">
                    <button
                      type="button"
                      onClick={(e) => toggleHideBrand(brandName, e)}
                      className={`px-3 py-2 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition ${
                        isBrandHidden(brandName)
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-surface hover:bg-bg text-go border-line'
                      }`}
                      title={isBrandHidden(brandName) ? 'البراند مخفي عن واجهة العميل (اضغط لإظهاره)' : 'البراند ظاهر للعميل (اضغط لإخفائه بالكامل من واجهة العميل)'}
                    >
                      <span>{isBrandHidden(brandName) ? '🚫 مخفي عن العميل' : '👁️ ظاهر للعميل'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingBrandImageFor({
                          brandName,
                          imageUrl: brandImages[brandName] || ''
                        });
                      }}
                      className="px-3 py-2 rounded-xl bg-surface hover:bg-bg text-fg border border-line text-xs font-extrabold flex items-center gap-1.5 transition shadow-2xs"
                      title="تحديد صورة البراند (رابط خارجي مباشر أو رفع صورة محلية)"
                    >
                      <Upload className="w-3.5 h-3.5 text-accent-text" />
                      <span>صورة البراند</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNewModelBrand(brandName);
                        const inputEl = document.getElementById('elzoghbi-new-model-name-input');
                        if (inputEl) {
                          inputEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          inputEl.focus();
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-surface0 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>إضافة موديل في {brandName}</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        askConfirmDelete(
                          `حذف براند "${brandName}" بالكامل`,
                          `هل أنت متأكد من حذف براند "${brandName}" وجميع الموديلات (${models.filter(m => m.brand === brandName).length} موديل) والمنتجات (${partCountByBrandMap.get(brandName) || 0} منتج) التابعة له نهائياً؟`,
                          () => {
                            const affectedModelIds = new Set(models.filter(m => m.brand === brandName).map(m => String(m.id)));
                            const affectedPartIds = parts.filter(p => affectedModelIds.has(String(p.modelId))).map(p => p.id);
                            setParts(prev => prev.filter(p => !affectedModelIds.has(String(p.modelId))));
                            setModels(prev => prev.filter(m => m.brand !== brandName));
                            setBrands(prev => prev.filter(b => b !== brandName));
                            affectedPartIds.forEach(pid => sbDelete('spare_parts', pid));
                            Array.from(affectedModelIds).forEach(mid => sbDelete('mobile_models', mid));
                            sbDelete('brands', brandName);
                            showToast(`🗑️ تم حذف براند "${brandName}" بجميع موديلاته ومنتجاته نهائياً.`, 'info');
                          }
                        );
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition"
                      title={`حذف براند ${brandName} بالكامل`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف البراند</span>
                    </button>
                  </div>
                </div>

                {/* Level 2: Collapsible Model Bars inside Brand (Mounted ONLY when Brand Bar is opened via +) */}
                {isBrandOpen && (
                  <div className="p-3 sm:p-4 bg-surface2 space-y-2.5 border-t border-line">
                    {brandModels.length === 0 ? (
                      <div className="py-6 text-center text-xs text-muted font-bold">
                        لا توجد موديلات مضافة داخل براند {brandName} حالياً. اضغط "إضافة موديل" بالأعلى لإضافة أول جهاز.
                      </div>
                    ) : (
                      brandModels.map(model => {
                        const isModelOpen = !!expandedAdminModels[model.id];
                        const modelPartsCount = partCountByModelIdMap.get(String(model.id)) || 0;

                        // Compute and sort modelParts ONLY when this specific Model Bar is opened via +
                        const modelParts = isModelOpen
                          ? parts
                              .filter(p => {
                                const pMdl = resolvePartModelObj(p); if ((pMdl ? String(pMdl.id) : String(p.modelId || '').trim()) !== String(model.id)) return false;
                                if (adminStockFilter === 'IN_STOCK' && p.stock <= 0) return false;
                                if (adminStockFilter === 'LOW_STOCK' && (p.stock <= 0 || p.stock > (Number(p.lowStockThreshold) || 5))) return false;
                                if (adminStockFilter === 'OUT_OF_STOCK' && p.stock > 0) return false;
                                if (searchQ !== '') {
                                  const modelMatches = `${model.brand} ${model.name} ${model.aliases || ''}`.toLowerCase().includes(searchQ);
                                  if (!modelMatches) {
                                    return `${p.name} ${p.sku} ${p.category} ${p.qualityGrade}`.toLowerCase().includes(searchQ);
                                  }
                                }
                                return true;
                              })
                              .sort((a, b) => {
                                if (adminCatalogSort === 'name_asc') return a.name.localeCompare(b.name, 'ar');
                                if (adminCatalogSort === 'stock_desc') return b.stock - a.stock;
                                if (adminCatalogSort === 'stock_asc') return a.stock - b.stock;
                                if (adminCatalogSort === 'price_desc') return b.basePrice - a.basePrice;
                                if (adminCatalogSort === 'price_asc') return a.basePrice - b.basePrice;
                                const aCustom = a._isCustomUploaded ? 1 : 0;
                                const bCustom = b._isCustomUploaded ? 1 : 0;
                                if (aCustom !== bCustom) return bCustom - aCustom;
                                return (b.createdAt || '').localeCompare(a.createdAt || '');
                              })
                          : [];

                        return (
                          <div key={model.id} className="bg-surface rounded-xl border border-line overflow-hidden shadow-xs">
                            {/* Collapsible Model Bar Header (High Contrast in Light & Dark Mode!) */}
                            <div className="p-3 bg-surface text-fg border-b border-line flex flex-wrap items-center justify-between gap-2.5">
                              <div
                                onClick={() => toggleModelBar(model.id)}
                                className="flex items-center gap-2.5 cursor-pointer select-none flex-1 min-w-[180px]"
                              >
                                <button
                                  type="button"
                                  className={`w-8 h-8 rounded-lg font-mono font-extrabold text-base flex items-center justify-center transition ${
                                    isModelOpen
                                      ? 'bg-accent text-accent-ink'
                                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                                  }`}
                                  title={isModelOpen ? 'إغلاق شريط الموديل (−)' : 'فتح شريط الموديل وعرض المنتجات (+)'}
                                >
                                  {isModelOpen ? '−' : '+'}
                                </button>

                                <div className="w-9 h-9 rounded-lg overflow-hidden border border-line bg-surface2 shrink-0">
                                  <BlurFitImage src={model.image || PART_IMAGES.screen} alt={model.name} />
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-black text-sm text-fg">{model.name}</span>
                                    <span className="px-2 py-0.5 rounded bg-accent/15 text-accent-text border border-accent/30 font-extrabold text-[10px]">
                                      {modelPartsCount} منتج
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-muted font-bold">
                                    {isModelOpen ? 'اضغط (−) لإخفاء المنتجات' : 'اضغط (+) لإظهار وتعديل منتجات الموديل'}
                                  </div>
                                </div>
                              </div>

                              {/* Model Bar Action Buttons (Hide/Show, Star, + إضافة منتج, التمبلت, تعديل, حذف) */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => toggleHideModel(model, e)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 border transition ${
                                    isModelHidden(model)
                                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                      : 'bg-surface2 hover:border-go text-go border-line'
                                  }`}
                                  title={isModelHidden(model) ? 'الموديل مخفي عن العميل (اضغط لإظهاره)' : 'الموديل ظاهر للعميل (اضغط لإخفائه من واجهة العميل والـ Popup)'}
                                >
                                  <span>{isModelHidden(model) ? '🚫 مخفي' : '👁️ ظاهر'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => handleToggleTargetedAdModel(model, e)}
                                  className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition ${
                                    model.isPromotedAd
                                      ? 'bg-amber-400 text-fg shadow-xs'
                                      : 'bg-nav2 hover:bg-nav2 text-amber-300 border border-amber-400/30'
                                  }`}
                                  title="تعليم الموديل بنجمة ليظهر في قائمة ربط الإعلانات"
                                >
                                  <span>{model.isPromotedAd ? '⭐ مميز للإعلان ✓' : '⭐ للإعلان'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setAddingPartToModel({
                                      model,
                                      sku: `PRT-${model.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}-${Math.floor(10 + Math.random() * 89)}`,
                                      category: 'شاشات كاملة',
                                      name: `قطعة غيار ${model.name} `,
                                      qualityGrade: 'أصلي توكيل Service Pack',
                                      colorsText: 'أسود, أبيض',
                                      compatibleText: model.name,
                                      warrantyText: 'ضمان معاينة وتجربة 14 يوم بحالته الأصلية',
                                      imageKey: 'screen',
                                      customImage: '',
                                      imagesList: [],
                                      description: '',
                                      stock: 12,
                                      lowStockThreshold: 4,
                                      maxOrderQty: 6,
                                      costPrice: 1000,
                                      basePrice: 1350
                                    })
                                  }
                                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-fg text-xs font-extrabold flex items-center gap-1 shadow-xs"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  إضافة منتج
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleInjectMissingTemplatesIntoModel(model)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-600 hover:bg-slate-500 text-white text-xs font-bold flex items-center gap-1"
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                  التمبلت
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setEditingModelObj({ ...model })}
                                  className="px-2.5 py-1.5 rounded-lg bg-nav2 hover:bg-nav2 text-nav-fg text-xs font-bold flex items-center gap-1"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  تعديل
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteModel(model)}
                                  className="px-2 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold flex items-center gap-1 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Level 3: Products Table inside Model (Mounted ONLY when Model Bar is opened via +) */}
                            {isModelOpen && (
                              <div className="p-4 overflow-x-auto bg-surface">
                                {modelParts.length === 0 ? (
                                  <div className="py-6 text-center text-xs text-muted space-y-2">
                                    <div>لا توجد منتجات مضافة داخل هذا الموديل حالياً.</div>
                                    <button
                                      type="button"
                                      onClick={() => handleInjectMissingTemplatesIntoModel(model)}
                                      className="px-3.5 py-1.5 rounded-xl bg-slate-600 text-white font-bold"
                                    >
                                      + توليد وتنزيل قطع الغيار من التمبلت الآن
                                    </button>
                                  </div>
                                ) : (
                                  <table className="w-full text-right text-xs">
                                    <thead>
                                      <tr className="text-muted border-b border-line">
                                        <th className="pb-2">الصورة والكود</th>
                                        <th className="pb-2">اسم القطعة والتصنيف</th>
                                        <th className="pb-2">الكمية بالمخزن</th>
                                        <th className="pb-2">التكلفة</th>
                                        <th className="pb-2">السعر الأساسي</th>
                                        {displayedGroupsInTable.map(g => (
                                          <th key={g.id} className="pb-2 text-accent-text">
                                            سعر ({g.name})
                                          </th>
                                        ))}
                                        <th className="pb-2">كل المجموعات ({nonDefaultGroups.length})</th>
                                        <th className="pb-2 text-left">إجراءات</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-line">
                                      {modelParts.map(part => (
                                        <tr key={part.id} className="hover:bg-surface2">
                                          <td className="py-2.5">
                                            <div className="flex items-center gap-2">
                                              <div className="w-10 h-10 rounded-lg overflow-hidden border border-line bg-nav2 shrink-0">
                                                <BlurFitImage src={part.image} alt={part.name} />
                                              </div>
                                              <div>
                                                <div className="font-mono font-bold text-[11px] text-muted">{part.sku}</div>
                                                <div className="text-[10px] text-muted">{part.createdAt || '2026-10-30'}</div>
                                              </div>
                                            </div>
                                          </td>
                                          <td className="py-2.5 font-bold text-fg">
                                            <div>{part.name}</div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface2 text-accent-text">
                                                {part.category}
                                              </span>
                                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface2 text-muted">
                                                {part.qualityGrade}
                                              </span>
                                            </div>
                                          </td>
                                          <td className="py-2.5">
                                            <input
                                              type="number"
                                              min={0}
                                              value={part.stock}
                                              onChange={e => {
                                                const val = Math.max(0, Number(e.target.value));
                                                setParts(prev =>
                                                  prev.map(p => (p.id === part.id ? { ...p, stock: val } : p))
                                                );
                                              }}
                                              className={`w-16 px-2 py-1 rounded-lg border font-extrabold ${
                                                part.stock === 0
                                                  ? 'border-rose-500 bg-bg text-fg'
                                                  : part.stock <= (Number(part.lowStockThreshold) || 5)
                                                  ? 'border-amber-500 bg-bg text-fg'
                                                  : 'border-line'
                                              }`}
                                            />
                                          </td>
                                          <td className="py-2.5">
                                            <input
                                              type="number"
                                              min={0}
                                              value={part.costPrice}
                                              onChange={e => {
                                                const val = Math.max(0, Number(e.target.value));
                                                setParts(prev =>
                                                  prev.map(p => (p.id === part.id ? { ...p, costPrice: val } : p))
                                                );
                                              }}
                                              className="w-20 px-2 py-1 rounded-lg border border-line font-mono text-fg font-bold bg-bg"
                                            />
                                          </td>
                                          <td className="py-2.5">
                                            <input
                                              type="number"
                                              min={0}
                                              value={part.basePrice}
                                              onChange={e => {
                                                const val = Math.max(0, Number(e.target.value));
                                                setParts(prev =>
                                                  prev.map(p => (p.id === part.id ? { ...p, basePrice: val } : p))
                                                );
                                              }}
                                              className="w-20 px-2 py-1 rounded-lg border border-line font-extrabold text-fg"
                                            />
                                          </td>
                                          {displayedGroupsInTable.map(g => {
                                            const calc = calculatePartPrice(part, g);
                                            return (
                                              <td key={g.id} className="py-2.5">
                                                <input
                                                  type="number"
                                                  value={
                                                    part.customGroupPrices?.[g.id] !== undefined
                                                      ? part.customGroupPrices[g.id]
                                                      : calc.baseEgpPrice
                                                  }
                                                  onChange={e => {
                                                    const val = Number(e.target.value);
                                                    setParts(prev =>
                                                      prev.map(p =>
                                                        p.id === part.id
                                                          ? {
                                                              ...p,
                                                              customGroupPrices: {
                                                                ...(p.customGroupPrices || {}),
                                                                [g.id]: val
                                                              }
                                                            }
                                                          : p
                                                      )
                                                    );
                                                  }}
                                                  className={`w-20 px-2 py-1 rounded border text-xs font-bold ${
                                                    calc.isBelowCost
                                                      ? 'border-rose-500 bg-bg text-fg'
                                                      : calc.hasCustomOverride
                                                      ? 'border-accent bg-bg text-fg'
                                                      : 'border-line'
                                                  }`}
                                                />
                                                {calc.isBelowCost && (
                                                  <div className="text-[10px] text-rose-600 font-bold">
                                                    أقل من التكلفة!
                                                  </div>
                                                )}
                                              </td>
                                            );
                                          })}
                                          <td className="py-2.5">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setGroupModalSearchQuery('');
                                                setPartGroupPricesModalPart(part.id);
                                              }}
                                              className="px-2.5 py-1.5 rounded-lg bg-surface2 hover:border-accent text-accent-text border border-line font-extrabold text-[11px] flex items-center gap-1"
                                            >
                                              <Tag className="w-3 h-3" />
                                              تسعير {groups.length} مجموعات
                                            </button>
                                          </td>
                                          <td className="py-2.5 text-left">
                                              <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                  type="button"
                                                  onClick={(e) => toggleHidePart(part, e)}
                                                  className={`px-2 py-1 rounded-lg text-[11px] font-extrabold border transition ${
                                                    isPartHidden(part)
                                                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                                      : 'bg-surface2 hover:border-go text-go border-line'
                                                  }`}
                                                  title={isPartHidden(part) ? 'المنتج مخفي عن العميل (اضغط لإظهاره)' : 'المنتج ظاهر للعميل (اضغط لإخفائه)'}
                                                >
                                                  {isPartHidden(part) ? '🚫 مخفي' : '👁️ ظاهر'}
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={(e) => togglePartCashback(part, e)}
                                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-black border transition ${
                                                    isPartCashbackEnabled(part)
                                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                                      : 'bg-surface2 hover:border-emerald-500 text-muted border-line'
                                                  }`}
                                                  title={isPartCashbackEnabled(part) ? `الكاش باك مفعّل (${getPartCashbackPct(part)}%) — اضغط لإيقافه فوراً` : 'الكاش باك متوقف عن هذا المنتج (اضغط لتفعيله فوراً)'}
                                                >
                                                  {isPartCashbackEnabled(part) ? `💰 كاش باك ${getPartCashbackPct(part)}% ✓` : '💰 بدون كاش باك'}
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={(e) => togglePartVipOnly(part, e)}
                                                  className={`px-2 py-1 rounded-lg text-[11px] font-extrabold border transition ${
                                                    isPartVipOnly(part)
                                                      ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-xs'
                                                      : 'bg-surface2 hover:border-amber-400 text-muted border-line'
                                                  }`}
                                                  title="تخصيص المنتج للرابط السري للـ VIP فقط"
                                                >
                                                  {isPartVipOnly(part) ? '👑 VIP ✓' : '👑 VIP'}
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={(e) => togglePartCashierPin(part, e)}
                                                  className={`px-2 py-1 rounded-lg text-[11px] font-extrabold border transition ${
                                                    isPartPinnedToCashier(part)
                                                      ? 'bg-[#0071E3] text-slate-950 border-[#0071E3] shadow-xs'
                                                      : 'bg-surface2 hover:border-[#0071E3] text-muted border-line'
                                                  }`}
                                                  title="إظهار أو تثبيت هذا المنتج في رف الكاشير السريع داخل السلة والدفع"
                                                >
                                                  {isPartPinnedToCashier(part) ? '🛒 رف الكاشير ✓' : '🛒 كاشير'}
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={(e) => { e.stopPropagation(); setAdminRestockWhatsappPart(part); }}
                                                  className="px-2 py-1 rounded-lg text-[11px] font-extrabold border bg-surface2 hover:border-[#0071E3] text-[#0066CC] border-line"
                                                  title="إرسال رسالة واتساب للعملاء المنتظرين توفر هذا المنتج"
                                                >
                                                  📲 منتظرين ({(Array.isArray(siteSettings.restockWaitlist) ? siteSettings.restockWaitlist.filter(w => String(w.partId) === String(part.id)).length : 0) || part.waitlistCount || 0})
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={(e) => handleToggleTargetedAdPart(part, e)}
                                                className={`px-2 py-1 rounded-lg text-[11px] font-extrabold border transition ${
                                                  part.isPromotedAd
                                                    ? 'bg-amber-400 text-fg border-amber-500 shadow-xs'
                                                    : 'bg-surface2 hover:border-amber-400 text-amber-600 dark:text-amber-300 border-line'
                                                }`}
                                                title="تعليم المنتج بنجمة ليظهر في قائمة الإعلانات والبارات"
                                              >
                                                {part.isPromotedAd ? '⭐ مميز ✓' : '⭐ للإعلان'}
                                              </button>
                                              <button
                                                  onClick={() =>
                                                      setEditingPartObj({
                                                        ...part,
                                                        oldPrice: part.oldPrice || part.customGroupPrices?._oldPrice || siteSettings?.partExtraMeta?.[part.id]?.oldPrice || '',
                                                        cashbackEnabled: isPartCashbackEnabled(part),
                                                        cashbackPct: getPartCashbackPct(part),
                                                        isVipOnly: isPartVipOnly(part),
                                                        vipPrice: part.vipPrice || part.customGroupPrices?._vipPrice || siteSettings?.partExtraMeta?.[part.id]?.vipPrice || '',
                                                        tierFirstClassPrice: part.tierFirstClassPrice || part.customGroupPrices?._tierFirstClassPrice || '',
                                                        tierEconomyPrice: part.tierEconomyPrice || part.customGroupPrices?._tierEconomyPrice || '',
                                                        hidden: isPartHidden(part),
                                                        colorsText: (part.colors || []).join(', '),
                                                        compatibleText: (part.compatibleModels || []).join(', '),
                                                        imagesList: getPartImagesList(part)
                                                      })
                                                  }
                                                className="p-1.5 rounded-lg bg-surface2 hover:bg-surface text-muted hover:text-accent-text transition"
                                                title="تعديل بيانات وصورة القطعة"
                                              >
                                                <Edit3 className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                onClick={() => handleDeletePart(part)}
                                                className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-500 hover:text-white transition"
                                                title="حذف القطعة"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  
}

export function renderAdminQuickStock(ctx) {
  const { askConfirmDelete, brands, bulkPriceMode, bulkPriceRound5, bulkPriceToolOpen, bulkPriceValue, getPartCashbackPct, handleDeletePart, handleToggleTargetedAdPart, isPartCashbackEnabled, isPartPinnedToCashier, lastBulkPriceSnapshot, markLocalUpsert, models, parts, quickStockBrand, quickStockCat, quickStockModel, quickStockPage, quickStockSearch, quickStockSort, setBulkPriceMode, setBulkPriceRound5, setBulkPriceToolOpen, setBulkPriceValue, setLastBulkPriceSnapshot, setParts, setQuickStockBrand, setQuickStockCat, setQuickStockModel, setQuickStockPage, setQuickStockSearch, setQuickStockSort, showToast, togglePartCashback, togglePartCashierPin, togglePartSoldOut } = ctx;
    const QUICK_STOCK_MAX_PER_PAGE = 40;
    const categoriesList = ['ALL', ...Array.from(new Set(parts.map(p => p.category)))];
    const quickStockModelsForBrand = models.filter(m => quickStockBrand === 'ALL' || m.brand === quickStockBrand);
    const brandModelIdsSet = new Set(quickStockModelsForBrand.map(m => String(m.id)));

    const filteredAuditParts = parts
      .filter(p => {
        if (quickStockBrand !== 'ALL' && !brandModelIdsSet.has(String(p.modelId))) return false;
        if (quickStockModel !== 'ALL' && String(p.modelId) !== String(quickStockModel)) return false;
        if (quickStockCat !== 'ALL' && p.category !== quickStockCat) return false;
        if (quickStockSearch.trim() !== '') {
          const q = quickStockSearch.trim().toLowerCase();
          return `${p.name} ${p.sku} ${p.category} ${p.qualityGrade}`.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => {
        if (quickStockSort === 'stock_asc') return a.stock - b.stock;
        if (quickStockSort === 'stock_desc') return b.stock - a.stock;
        if (quickStockSort === 'name_asc') return a.name.localeCompare(b.name, 'ar');
        if (quickStockSort === 'price_desc') return b.basePrice - a.basePrice;
        if (quickStockSort === 'date_desc') return (b.createdAt || '').localeCompare(a.createdAt || '');
        return 0;
      });

    const totalStockItems = filteredAuditParts.length;
    const totalStockPages = Math.max(1, Math.ceil(totalStockItems / QUICK_STOCK_MAX_PER_PAGE));
    const currentStockPage = Math.min(Math.max(1, quickStockPage), totalStockPages);
    const startIdx = (currentStockPage - 1) * QUICK_STOCK_MAX_PER_PAGE;
    const pagedAuditParts = filteredAuditParts.slice(startIdx, startIdx + QUICK_STOCK_MAX_PER_PAGE);

    return (
      <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden space-y-0">
        <div className="p-4 bg-surface2 border-b border-line space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-fg">
                جدول الجرد وتحديث المخزن والأسعار السريع
              </h2>
              <p className="text-xs text-muted">
                اختر البراند والموديل والتصنيف والترتيب من القوائم المنسدلة وعدّل الكميات والأسعار مباشرة
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-accent-text bg-surface2 px-3 py-1 rounded-lg border border-line">
                معروض {totalStockItems > 0 ? startIdx + 1 : 0} – {Math.min(totalStockItems, startIdx + pagedAuditParts.length)} من {totalStockItems} صنف
              </span>
              <button
                type="button"
                onClick={() => setBulkPriceToolOpen(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition flex items-center gap-1.5 ${
                  bulkPriceToolOpen
                    ? 'bg-[#0071E3] text-white border-[#0071E3]'
                    : 'bg-[#0071E3]/10 hover:bg-[#0071E3] text-[#0066CC] dark:text-[#2997FF] hover:text-white border-[#0071E3]/30'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>📈 تسعير جماعي سريع (% / ج.م)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const shortages = filteredAuditParts.filter(p => p.stock <= (Number(p.lowStockThreshold) || 5));
                  if (shortages.length === 0) {
                    showToast('ممتاز! لا توجد نواقص حالياً ضمن الفلتر المحدد.', 'info');
                    return;
                  }
                  const lines = shortages.map((p, idx) => `${idx + 1}. ${p.name} [${p.sku}] — المتبقي: ${p.stock}`);
                  const fullTxt = `📋 *كشف نواقص ومشتريات المخزن (${shortages.length} صنف) — ${new Date().toISOString().slice(0, 10)}*\n━━━━━━━━━━━━━━\n${lines.join('\n')}`;
                  navigator.clipboard?.writeText(fullTxt);
                  showToast(`📋 تم نسخ كشف النواقص (${shortages.length} صنف) للحافظة! يمكنك لصقه مباشرة لموردك على واتساب.`, 'success');
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-600 dark:text-amber-400 hover:text-slate-950 border border-amber-500/35 text-xs font-extrabold transition"
                title="نسخ قائمة الأصناف المنتهية أو القريبة من النفاد لإرسالها للمورد"
              >
                📋 نسخ كشف النواقص للمورد
              </button>
            </div>
          </div>

          {/* Merchant Bulk Market Price Adjuster (Instant % or Fixed EGP across filtered Brand/Category + Undo!) */}
          {bulkPriceToolOpen && (
            <div className="p-3.5 rounded-2xl bg-surface border-2 border-[#0071E3]/35 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-black text-fg">📈 أداة تعديل الأسعار الجماعي للسوق (تُطبّق على الأصناف المفلترة حالياً: {filteredAuditParts.length} صنف)</span>
                  <p className="text-[11px] text-muted">اختر براند أو تصنيف من الفلاتر بالأسفل (أو الكل)، وحدد نسبة الزيادة/الخصم لمواكبة تغير أسعار الموردين في ثانية واحدة مع حماية عدم البيع بأقل من التكلفة!</p>
                </div>
                {lastBulkPriceSnapshot && (
                  <button
                    type="button"
                    onClick={() => {
                      const snap = lastBulkPriceSnapshot;
                      setParts(prev => prev.map(p => {
                        if (snap[p.id] === undefined) return p;
                        const restored = { ...p, basePrice: snap[p.id] };
                        markLocalUpsert('parts', restored);
                        return restored;
                      }));
                      setLastBulkPriceSnapshot(null);
                      showToast('↩️ تم التراجع واستعادة الأسعار السابقة بنجاح!', 'info');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-500 hover:text-white font-extrabold text-xs transition"
                  >
                    ↩️ تراجع عن آخر تعديل جماعي
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <select
                  value={bulkPriceMode}
                  onChange={e => setBulkPriceMode(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-line bg-bg font-extrabold text-fg"
                >
                  <option value="pct_up">⬆️ زيادة بنسبة مئوية (%)</option>
                  <option value="pct_down">⬇️ تخفيض بنسبة مئوية (%)</option>
                  <option value="fixed_up">➕ زيادة بمبلغ ثابت (ج.م)</option>
                  <option value="fixed_down">➖ تخفيض بمبلغ ثابت (ج.م)</option>
                </select>

                <input
                  type="number"
                  min="1"
                  value={bulkPriceValue}
                  onChange={e => setBulkPriceValue(Math.max(0, Number(e.target.value)))}
                  className="w-24 px-3 py-2 rounded-xl border border-line bg-bg font-mono font-black text-center"
                />

                <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-bg border border-line font-bold cursor-pointer">
                  <input type="checkbox" checked={bulkPriceRound5} onChange={e => setBulkPriceRound5(e.target.checked)} className="w-4 h-4 accent-[#0071E3]" />
                  <span>تقريب السعر لأقرب 5 ج.م</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (!bulkPriceValue || filteredAuditParts.length === 0) return;
                    askConfirmDelete(
                      'تطبيق تسعير جماعي',
                      `سيتم تعديل سعر ${filteredAuditParts.length} صنف دفعة واحدة حسب الإعدادات الحالية.${bulkPriceMode === 'pct_down' && bulkPriceValue > 90 ? ' ملحوظة: أقصى خصم مسموح 90% وسيتم تطبيق 90% فقط مهما كانت النسبة المدخلة أكبر.' : ''} هل أنت متأكد؟`,
                      () => {
                    const targetIds = new Set(filteredAuditParts.map(p => p.id));
                    const snapshot = {};
                    parts.forEach(p => { if (targetIds.has(p.id)) snapshot[p.id] = p.basePrice; });
                    setLastBulkPriceSnapshot(snapshot);
                    setParts(prev =>
                      prev.map(p => {
                        if (!targetIds.has(p.id)) return p;
                        const cur = Number(p.basePrice) || 0;
                        let nextP = cur;
                        if (bulkPriceMode === 'pct_up') nextP = cur * (1 + bulkPriceValue / 100);
                        else if (bulkPriceMode === 'pct_down') nextP = cur * Math.max(0.1, 1 - bulkPriceValue / 100);
                        else if (bulkPriceMode === 'fixed_up') nextP = cur + bulkPriceValue;
                        else if (bulkPriceMode === 'fixed_down') nextP = cur - bulkPriceValue;
                        if (bulkPriceRound5) nextP = Math.round(nextP / 5) * 5;
                        else nextP = Math.round(nextP);
                        const floorPrice = Math.max(10, Number(p.costPrice) || 0);
                        const updated = { ...p, basePrice: Math.max(floorPrice, nextP) };
                        markLocalUpsert('parts', updated);
                        return updated;
                      })
                    );
                    showToast(`✅ تم تحديث أسعار ${targetIds.size} صنف بنجاح! اضغط «حفظ التعديلات» بالأعلى لمزامنتها للسيرفر.`, 'success');
                      },
                      'نعم، طبّق على الكل'
                    );
                  }}
                  className="px-5 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-black shadow-sm transition"
                >
                  تطبيق على الـ ({filteredAuditParts.length}) صنف الآن ✓
                </button>
              </div>
            </div>
          )}

          {/* Search Input + 4 Dropdown Menus: Brand -> Model -> Category -> Sort */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
            <input
              type="text"
              value={quickStockSearch}
              onChange={e => setQuickStockSearch(e.target.value)}
              placeholder="ابحث باسم القطعة أو الكود SKU..."
              className="px-3 py-2.5 rounded-xl border border-line bg-surface font-bold"
            />

            <select
              value={quickStockBrand}
              onChange={e => {
                setQuickStockBrand(e.target.value);
                setQuickStockModel('ALL');
              }}
              className="px-3 py-2.5 rounded-xl border border-line bg-surface font-extrabold text-fg"
            >
              <option value="ALL">البراند: الكل ({brands.length})</option>
              {brands.map(b => (
                <option key={b} value={b}>البراند: {b}</option>
              ))}
            </select>

            <select
              value={quickStockModel}
              onChange={e => setQuickStockModel(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-line bg-surface font-extrabold text-fg"
            >
              <option value="ALL">
                {quickStockBrand === 'ALL'
                  ? `الموديل: الكل (${quickStockModelsForBrand.length})`
                  : `موديلات ${quickStockBrand} (${quickStockModelsForBrand.length})`}
              </option>
              {quickStockModelsForBrand.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>

            <select
              value={quickStockCat}
              onChange={e => setQuickStockCat(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-line bg-surface font-extrabold text-fg"
            >
              {categoriesList.map(c => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'التصنيف: الكل' : `التصنيف: ${c}`}
                </option>
              ))}
            </select>

            <select
              value={quickStockSort}
              onChange={e => setQuickStockSort(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-line bg-surface font-extrabold text-fg"
            >
              <option value="stock_asc">الترتيب: الأقل كمية أولاً (النواقص)</option>
              <option value="stock_desc">الترتيب: الأكثر كمية أولاً</option>
              <option value="date_desc">الترتيب: الأحدث أولاً</option>
              <option value="name_asc">الترتيب: الاسم (أ - ي)</option>
              <option value="price_desc">الترتيب: الأعلى سعراً</option>
            </select>
          </div>

          {totalStockPages > 1 && (
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-muted font-bold">صفحة {currentStockPage} من {totalStockPages}</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={currentStockPage <= 1}
                  onClick={() => setQuickStockPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 rounded-lg bg-surface border border-line hover:bg-surface2 font-extrabold disabled:opacity-40"
                >
                  السابق
                </button>
                <button
                  type="button"
                  disabled={currentStockPage >= totalStockPages}
                  onClick={() => setQuickStockPage(p => Math.min(totalStockPages, p + 1))}
                  className="px-3 py-1 rounded-lg bg-nav2 text-white font-extrabold disabled:opacity-40"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full table-auto text-right text-xs">
            <thead>
              <tr className="bg-surface2 text-muted border-b border-line text-[11px]">
                <th className="py-2.5 px-2 w-10">#</th>
                <th className="py-2.5 px-2 w-28">SKU</th>
                <th className="py-2.5 px-2 min-w-[150px]">اسم المنتج</th>
                <th className="py-2.5 px-1.5 w-20 text-center">الكمية</th>
                <th className="py-2.5 px-1.5 w-16 text-center">النواقص</th>
                <th className="py-2.5 px-1.5 w-24 text-center">التكلفة (ج.م)</th>
                <th className="py-2.5 px-1.5 w-24 text-center">البيع (ج.م)</th>
                <th className="py-2.5 px-2 w-24 text-center">صافي الربح</th>
                <th className="py-2.5 px-2 text-center">مميزات سريعة (كاش باك / كاشير / إعلان)</th>
                <th className="py-2.5 px-1.5 w-20 text-center">الحالة</th>
                <th className="py-2.5 px-2 w-12 text-center">حذف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {pagedAuditParts.map((part, idx) => {
                const margin = part.basePrice - part.costPrice;
                return (
                  <tr key={part.id} className="hover:bg-surface2/70 transition">
                    <td className="py-2 px-2 font-mono text-[11px] text-muted">{startIdx + idx + 1}</td>
                    <td className="py-2 px-2 font-mono text-[11px] font-bold text-muted truncate max-w-[115px]" title={part.sku}>{part.sku}</td>
                    <td className="py-2 px-2 font-extrabold text-fg text-xs leading-snug">{part.name}</td>
                    <td className="py-2 px-1.5 text-center">
                      <input
                        type="number"
                        min={0}
                        value={part.stock}
                        onChange={e => {
                          const val = Math.max(0, Number(e.target.value));
                          setParts(prev => prev.map(p => (p.id === part.id ? { ...p, stock: val } : p)));
                        }}
                        onBlur={() => markLocalUpsert('parts', part)}
                        className={`w-16 px-2 py-1 text-center rounded-lg border font-extrabold ${
                          part.stock === 0
                            ? 'border-rose-500 bg-rose-500/10 text-rose-500'
                            : part.stock <= (Number(part.lowStockThreshold) || 5)
                            ? 'border-amber-500 bg-amber-500/10 text-amber-500'
                            : 'border-line bg-bg text-fg'
                        }`}
                      />
                    </td>
                    <td className="py-2 px-1.5 text-center">
                      <input
                        type="number"
                        min={1}
                        value={part.lowStockThreshold}
                        onChange={e => {
                          const val = Math.max(1, Number(e.target.value));
                          setParts(prev =>
                            prev.map(p => (p.id === part.id ? { ...p, lowStockThreshold: val } : p))
                          );
                        }}
                        onBlur={() => markLocalUpsert('parts', part)}
                        className="w-14 px-1.5 py-1 text-center rounded-lg border border-line bg-bg text-fg font-bold"
                      />
                    </td>
                    <td className="py-2 px-1.5 text-center">
                      <input
                        type="number"
                        min={0}
                        value={part.costPrice}
                        onChange={e => {
                          const val = Math.max(0, Number(e.target.value));
                          setParts(prev =>
                            prev.map(p => (p.id === part.id ? { ...p, costPrice: val } : p))
                          );
                        }}
                        onBlur={() => markLocalUpsert('parts', part)}
                        className="w-20 px-2 py-1 text-center rounded-lg border border-line bg-bg text-fg font-mono"
                      />
                    </td>
                    <td className="py-2 px-1.5 text-center">
                      <input
                        type="number"
                        min={0}
                        value={part.basePrice}
                        onChange={e => {
                          const val = Math.max(0, Number(e.target.value));
                          setParts(prev =>
                            prev.map(p => (p.id === part.id ? { ...p, basePrice: val } : p))
                          );
                        }}
                        onBlur={() => markLocalUpsert('parts', part)}
                        className="w-20 px-2 py-1 text-center rounded-lg border border-line bg-bg text-fg font-extrabold"
                      />
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded-lg font-extrabold text-[11px] whitespace-nowrap ${
                          margin > 0
                            ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                            : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                        }`}
                      >
                        {margin > 0 ? `+${margin}` : margin} ج.م
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        <button
                          type="button"
                          onClick={(e) => togglePartCashback(part, e)}
                          className={`px-2 py-1 rounded-lg border text-[11px] font-black whitespace-nowrap transition ${
                            isPartCashbackEnabled(part)
                              ? 'bg-emerald-600 text-white border-emerald-500'
                              : 'bg-surface text-muted border-line hover:border-emerald-500'
                          }`}
                        >
                          {isPartCashbackEnabled(part) ? `💰 ${getPartCashbackPct(part)}% ✓` : '💰 كاش باك'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => togglePartCashierPin(part, e)}
                          className={`px-2 py-1 rounded-lg border text-[11px] font-extrabold whitespace-nowrap transition ${
                            isPartPinnedToCashier(part)
                              ? 'bg-[#0071E3] text-white border-[#0071E3]'
                              : 'bg-surface text-muted border-line hover:border-[#0071E3]'
                          }`}
                          title="تثبيت في رف الكاشير السريع"
                        >
                          {isPartPinnedToCashier(part) ? '🛒 كاشير ✓' : '🛒 كاشير'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleToggleTargetedAdPart(part, e)}
                          className={`px-2 py-1 rounded-lg border text-[11px] font-extrabold whitespace-nowrap transition ${
                            part.isPromotedAd
                              ? 'bg-amber-400 text-slate-950 border-amber-500'
                              : 'bg-surface text-muted border-line hover:border-amber-500'
                          }`}
                          title="تعليم بنجمة ليظهر في الإعلانات والبارات"
                        >
                          {part.isPromotedAd ? '⭐ مميز ✓' : '⭐ نجمة'}
                        </button>
                      </div>
                    </td>
                    <td className="py-2 px-1.5 text-center">
                      {(() => {
                        const isOut = part.soldOut || Number(part.stock || 0) <= 0;
                        return (
                          <button
                            type="button"
                            onClick={() => togglePartSoldOut(part)}
                            title={Number(part.stock || 0) <= 0 && !part.soldOut ? 'المخزون صفر — الحالة تتبع المخزون تلقائياً' : 'تبديل حالة التوفر يدوياً'}
                            className={`px-2 py-1 rounded-lg border text-[11px] font-extrabold whitespace-nowrap ${
                              isOut
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-surface text-emerald-500 border-emerald-500/30 hover:bg-surface2'
                            }`}
                          >
                            {isOut ? 'نفد ✓' : 'متاح'}
                          </button>
                        );
                      })()}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <button
                        onClick={() => handleDeletePart(part)}
                        className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-500 hover:text-white transition"
                        title="حذف الصنف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalStockPages > 1 && (
          <div className="p-4 bg-surface2 border-t border-line flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-muted">
              صفحة {currentStockPage} من {totalStockPages}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                disabled={currentStockPage <= 1}
                onClick={() => setQuickStockPage(p => Math.max(1, p - 1))}
                className="px-3.5 py-2 rounded-xl border border-line bg-surface hover:bg-surface2 font-extrabold disabled:opacity-40"
              >
                السابق
              </button>
              {Array.from({ length: totalStockPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalStockPages || Math.abs(p - currentStockPage) <= 2)
                .map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuickStockPage(p)}
                    className={`w-8 h-8 rounded-xl font-extrabold ${
                      currentStockPage === p
                        ? 'bg-blue-600 text-white'
                        : 'bg-surface border border-line text-muted hover:bg-surface2'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              <button
                type="button"
                disabled={currentStockPage >= totalStockPages}
                onClick={() => setQuickStockPage(p => Math.min(totalStockPages, p + 1))}
                className="px-3.5 py-2 rounded-xl bg-nav2 text-white font-extrabold disabled:opacity-40"
              >
                التالي ←
              </button>
            </div>
          </div>
        )}
      </div>
    );
  
}

export function renderAdminGroups(ctx) {
  const { adminGroupSearch, askConfirmDelete, clients, currencies, groupDrafts, groups, handleApplyGroupModifier, handleCreateGroup, newGroupCurrency, newGroupDeliveryFee, newGroupModType, newGroupModVal, newGroupName, setAdminGroupSearch, setClients, setGroupDrafts, setGroups, setNewGroupCurrency, setNewGroupDeliveryFee, setNewGroupModType, setNewGroupModVal, setNewGroupName, showToast } = ctx;
    const filteredGroups = groups.filter(g =>
      !adminGroupSearch.trim() ||
      `${g.name} ${g.currency} ${g.description}`.toLowerCase().includes(adminGroupSearch.trim().toLowerCase())
    );

    return (
      <div className="space-y-6">
        {/* Create Group Form */}
        <form
          onSubmit={handleCreateGroup}
          className="bg-surface rounded-2xl p-5 border border-line shadow-xs space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-fg">
                إنشاء وإدارة مجموعات التسعير والعملات ورسوم التوصيل ({groups.length} مجموعات)
              </h3>
              <p className="text-xs text-muted">
                اختر نوع التعديل الجماعي (نسبة مئوية، مبلغ ثابت، أو لا شيء لتخصيص الأسعار يدوياً) وحدد رسوم الدليفري الخاصة بكل مجموعة
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
            <input
              type="text"
              required
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="اسم المجموعة (مثال: تجار المحافظات فئة B)..."
              className="lg:col-span-2 px-3 py-2.5 rounded-xl border border-line font-bold"
            />
            <select
              value={newGroupCurrency}
              onChange={e => setNewGroupCurrency(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-line font-bold"
            >
              {Object.values(currencies).map(c => (
                <option key={c.code} value={c.code}>
                  العملة: {c.name} ({c.symbol})
                </option>
              ))}
            </select>
            <select
              value={newGroupModType}
              onChange={e => setNewGroupModType(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-line font-bold"
            >
              <option value="none">التعديل الجماعي: لا شيء (بدون تعديل)</option>
              <option value="percentage">نسبة مئوية (-100% إلى +100%)</option>
              <option value="flat">مبلغ ثابت (+ أو - بالجنيه)</option>
            </select>
            <input
              type="number"
              disabled={newGroupModType === 'none'}
              value={newGroupModType === 'none' ? 0 : newGroupModVal}
              onChange={e => setNewGroupModVal(e.target.value)}
              placeholder="قيمة الخصم/الزيادة"
              className="px-3 py-2.5 rounded-xl border border-line font-extrabold disabled:bg-surface2"
            />
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                value={newGroupDeliveryFee}
                onChange={e => setNewGroupDeliveryFee(e.target.value)}
                placeholder="الدليفري (ج.م)"
                title="سعر التوصيل الخاص بهذه المجموعة"
                className="w-24 px-3 py-2.5 rounded-xl border border-line bg-bg font-extrabold text-fg"
              />
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold"
              >
                + إنشاء
              </button>
            </div>
          </div>
        </form>

        {/* Search Bar for 20+ Groups */}
        <div className="bg-surface rounded-2xl p-4 border border-line flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={adminGroupSearch}
              onChange={e => setAdminGroupSearch(e.target.value)}
              placeholder="ابحث عن أي مجموعة تسعير بالاسم أو العملة (يدعم البحث السريع وسط +20 مجموعة)..."
              className="w-full pr-9 pl-3 py-2 rounded-xl border border-line"
            />
          </div>
          <span className="font-bold text-muted">
            المجموعات المعروضة: {filteredGroups.length} من {groups.length}
          </span>
        </div>

        {/* Existing Groups Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGroups.map(grp => {
            const draft = groupDrafts[grp.id] || {
              currency: grp.currency,
              modifierType: grp.modifierType || 'none',
              modifierValue: grp.modifierValue || 0,
              deliveryFeeBase: grp.deliveryFeeBase !== undefined ? grp.deliveryFeeBase : 65
            };

            return (
              <div key={grp.id} className="bg-surface rounded-2xl p-5 border border-line shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-fg">{grp.name}</h4>
                      {grp.isDefault && (
                        <span className="px-2 py-0.5 rounded bg-nav2 text-white text-[10px] font-bold">
                          افتراضية
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-0.5">{grp.description}</p>
                  </div>
                  <div className="text-left">
                    <span className="px-2.5 py-1 rounded-lg bg-surface2 text-accent-text font-bold text-xs block">
                      {grp.currency} ({currencies[grp.currency]?.symbol})
                    </span>
                    <span className="text-[11px] font-extrabold text-accent-text mt-1 block">
                      توصيل: {(Number(grp.deliveryFeeBase) || 0) === 0 && grp.deliveryFeeBase !== undefined ? 'مجاني' : `${Number(grp.deliveryFeeBase) || 65} ج.م`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-2 border-t border-line">
                  <div>
                    <label className="text-[11px] text-muted block mb-1">عملة المجموعة:</label>
                    <select
                      value={draft.currency}
                      onChange={e =>
                        setGroupDrafts(prev => ({
                          ...prev,
                          [grp.id]: { ...draft, currency: e.target.value }
                        }))
                      }
                      className="w-full p-2 rounded-lg border border-line font-bold"
                    >
                      {Object.values(currencies).map(c => (
                        <option key={c.code} value={c.code}>
                          {c.name} ({c.symbol})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-muted block mb-1">نوع التعديل الجماعي:</label>
                    <select
                      value={draft.modifierType}
                      onChange={e =>
                        setGroupDrafts(prev => ({
                          ...prev,
                          [grp.id]: {
                            ...draft,
                            modifierType: e.target.value,
                            modifierValue: e.target.value === 'none' ? 0 : draft.modifierValue
                          }
                        }))
                      }
                      className="w-full p-2 rounded-lg border border-line font-bold"
                    >
                      <option value="none">لا شيء (بدون تعديل)</option>
                      <option value="percentage">نسبة مئوية (%)</option>
                      <option value="flat">مبلغ ثابت (+ / -)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-muted block mb-1">
                      القيمة ({draft.modifierType === 'percentage' ? '%' : draft.modifierType === 'flat' ? 'ج.م' : 'لا شيء'}):
                    </label>
                    <input
                      type="number"
                      disabled={draft.modifierType === 'none'}
                      value={draft.modifierType === 'none' ? 0 : draft.modifierValue}
                      onChange={e =>
                        setGroupDrafts(prev => ({
                          ...prev,
                          [grp.id]: { ...draft, modifierValue: e.target.value }
                        }))
                      }
                      className="w-full p-2 rounded-lg border border-line font-extrabold disabled:bg-surface2"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-accent-text font-bold block mb-1">
                      رسوم الدليفري (ج.م):
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={draft.deliveryFeeBase}
                      onChange={e =>
                        setGroupDrafts(prev => ({
                          ...prev,
                          [grp.id]: { ...draft, deliveryFeeBase: e.target.value }
                        }))
                      }
                      className="w-full p-2 rounded-lg border border-line bg-bg font-extrabold text-fg"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <span className="text-[11px] text-muted">
                    التجار المسجلون بالمجموعة: <b>{clients.filter(c => c.groupId === grp.id).length}</b>
                  </span>
                  <div className="flex items-center gap-2">
                    {!grp.isDefault && (
                      <button
                        type="button"
                        onClick={() =>
                          askConfirmDelete(
                            'حذف مجموعة التسعير',
                            `هل أنت متأكد من حذف مجموعة التسعير "${grp.name}" نهائياً؟`,
                            () => {
                              const fallbackGroupId = (groups.find(g => g.isDefault && g.id !== grp.id) || groups.find(g => g.id !== grp.id))?.id;
                              setGroups(prev => prev.filter(g => g.id !== grp.id));
                              if (fallbackGroupId) {
                                setClients(prev => prev.map(c => (c.groupId === grp.id ? { ...c, groupId: fallbackGroupId } : c)));
                              }
                              showToast(`تم حذف المجموعة "${grp.name}" ونقل عملائها للمجموعة الافتراضية.`, 'info');
                            }
                          )
                        }
                        className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-600 text-rose-500 hover:text-white transition"
                        title="حذف المجموعة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() =>
                        handleApplyGroupModifier(
                          grp.id,
                          draft.currency,
                          draft.modifierType,
                          draft.modifierValue,
                          draft.deliveryFeeBase,
                          false
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-nav2 hover:bg-nav2 text-white text-xs font-extrabold"
                    >
                      حفظ وتطبيق على المجموعة
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  
}

export function renderProfitProtectionShieldCard(ctx) {
  const { openFeatureSections, saveSiteSettingsImmediate, siteSettings, toggleFeatureSection } = ctx;
  return (<div className="bg-surface rounded-3xl p-5 border border-[#0071E3]/40 shadow-sm space-y-4 text-xs">
      <div
        onClick={() => toggleFeatureSection('profit_shield')}
        className="flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">🛡️</span>
            <h3 className="text-sm sm:text-base font-black text-fg">
              درع حماية الأرباح: التحكم الموحد في (الحد الأدنى + الحد الأقصى + نسبة % أو مبلغ ثابت ج.م) لجميع الخصومات والشحن المجاني
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-[#0071E3]/15 text-[#0066CC] dark:text-[#2997FF] font-black text-[11px]">
              حماية كاملة من الخسارة ✓
            </span>
          </div>
          <p className="text-[11px] text-muted">
            حدد سقفاً أقصى بالجنيه وحدّاً أدنى للطلب لكل ميزة ولكل خصم حتى لا تُخصم نسبة مئوية مفتوحة من الفواتير الكبيرة أبداً
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); toggleFeatureSection('profit_shield'); }}
          className={`w-9 h-9 rounded-xl font-black text-base flex items-center justify-center border transition shrink-0 ${
            openFeatureSections.profit_shield
              ? 'bg-[#0071E3] text-white border-[#0071E3]'
              : 'bg-surface2 text-fg border-line hover:border-[#0071E3]'
          }`}
        >
          {openFeatureSections.profit_shield ? '−' : '+'}
        </button>
      </div>

      {openFeatureSections.profit_shield && (
        <div className="space-y-4 pt-3 border-t border-line">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {/* 1. Master Invoice Cap & Free Shipping */}
            <div className="p-4 rounded-2xl bg-surface2/70 border border-line space-y-2.5">
              <div className="font-black text-fg flex items-center gap-1.5">
                <span>🚚</span>
                <span>1. الشحن المجاني والسقف العام للفاتورة</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-muted mb-1">أقل فاتورة للشحن المجاني (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={siteSettings.freeShippingTargetBase ?? 2000}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, freeShippingTargetBase: Number(e.target.value) || 0 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted mb-1">أقصى دعم شحن مجاني (0 = كامل):</label>
                  <input
                    type="number"
                    min="0"
                    value={siteSettings.freeShippingMaxSubsidyCap ?? 0}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, freeShippingMaxSubsidyCap: Number(e.target.value) || 0 }))}
                    placeholder="0 = إعفاء كامل"
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-rose-500 mb-1">🛡️ أقصى إجمالي خصم مسموح في أي فاتورة (ج.م):</label>
                <input
                  type="number"
                  min="0"
                  value={siteSettings.masterMaxDiscountPerOrderEgp ?? 0}
                  onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, masterMaxDiscountPerOrderEgp: Number(e.target.value) || 0 }))}
                  placeholder="اتركه 0 لعدم التقييد أو اكتب مثلاً 500 ج.م"
                  className="w-full p-2 rounded-xl border border-line font-mono font-black"
                />
              </div>
            </div>

            {/* 2. Buy More Save More (خصم الكميات) */}
            <div className="p-4 rounded-2xl bg-surface2/70 border border-line space-y-2.5">
              <div className="font-black text-fg flex items-center gap-1.5">
                <span>🏷️</span>
                <span>2. خصم الكميات (اشتري أكتر ووفّر)</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-muted mb-1">نوع الخصم:</label>
                  <select
                    value={siteSettings.qtyDiscountType || 'percentage'}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, qtyDiscountType: e.target.value }))}
                    className="w-full p-2 rounded-xl border border-line font-bold"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت للقطعة (ج.م)</option>
                  </select>
                </div>
                {siteSettings.qtyDiscountType === 'fixed' ? (
                  <div>
                    <label className="block text-[10px] font-bold text-muted mb-1">خصم (2 قطع / 3 قطع) ج.م:</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={siteSettings.qtyTier2FixedEgp ?? 25}
                        onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, qtyTier2FixedEgp: Number(e.target.value) || 0 }))}
                        className="w-1/2 p-2 rounded-xl border border-line font-mono font-black"
                      />
                      <input
                        type="number"
                        value={siteSettings.qtyTier3FixedEgp ?? 50}
                        onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, qtyTier3FixedEgp: Number(e.target.value) || 0 }))}
                        className="w-1/2 p-2 rounded-xl border border-line font-mono font-black"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-bold text-muted mb-1">نسبة (2 قطع / 3 قطع) %:</label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        value={siteSettings.qtyTier2DiscountPct ?? 5}
                        onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, qtyTier2DiscountPct: Number(e.target.value) || 0 }))}
                        className="w-1/2 p-2 rounded-xl border border-line font-mono font-black"
                      />
                      <input
                        type="number"
                        value={siteSettings.qtyTier3DiscountPct ?? 10}
                        onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, qtyTier3DiscountPct: Number(e.target.value) || 0 }))}
                        className="w-1/2 p-2 rounded-xl border border-line font-mono font-black"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-muted mb-1">الحد الأدنى للطلب (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={siteSettings.qtyDiscountMinOrder ?? 0}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, qtyDiscountMinOrder: Number(e.target.value) || 0 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-rose-500 mb-1">الحد الأقصى للخصم (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={siteSettings.qtyDiscountMaxCap ?? 250}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, qtyDiscountMaxCap: Number(e.target.value) || 0 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
              </div>
            </div>

            {/* 3. Smart Cross-Sell Bundle Discount */}
            <div className="p-4 rounded-2xl bg-surface2/70 border border-line space-y-2.5">
              <div className="font-black text-fg flex items-center gap-1.5">
                <span>🎁</span>
                <span>3. خصم الباقة الذكية داخل السلة</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-muted mb-1">نوع الخصم:</label>
                  <select
                    value={siteSettings.crossSellDiscountType || 'percentage'}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, crossSellDiscountType: e.target.value }))}
                    className="w-full p-2 rounded-xl border border-line font-bold"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (ج.م)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted mb-1">القيمة ({siteSettings.crossSellDiscountType === 'fixed' ? 'ج.م' : '%'}):</label>
                  <input
                    type="number"
                    min="0"
                    value={siteSettings.crossSellDiscountType === 'fixed' ? (siteSettings.crossSellFixedEgp ?? 30) : (siteSettings.crossSellBundleDiscountPct ?? 10)}
                    onChange={e => {
                      const v = Number(e.target.value) || 0;
                      saveSiteSettingsImmediate(prev => (prev.crossSellDiscountType === 'fixed' ? { ...prev, crossSellFixedEgp: v } : { ...prev, crossSellBundleDiscountPct: v }));
                    }}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-muted mb-1">الحد الأدنى للطلب (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={siteSettings.crossSellMinOrder ?? 0}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, crossSellMinOrder: Number(e.target.value) || 0 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-rose-500 mb-1">الحد الأقصى للخصم (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={siteSettings.crossSellMaxCap ?? 200}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, crossSellMaxCap: Number(e.target.value) || 0 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
              </div>
            </div>

            {/* 4. Wallet Cashback Limits */}
            <div className="p-4 rounded-2xl bg-surface2/70 border border-line space-y-2.5">
              <div className="font-black text-fg flex items-center gap-1.5">
                <span>💰</span>
                <span>4. نظام الكاش باك في المحفظة</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-muted mb-1">نوع الكاش باك:</label>
                  <select
                    value={siteSettings.cashbackCalcType || 'percentage'}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, cashbackCalcType: e.target.value }))}
                    className="w-full p-2 rounded-xl border border-line font-bold"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت للقطعة (ج.م)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted mb-1">القيمة ({siteSettings.cashbackCalcType === 'fixed' ? 'ج.م' : '%'}):</label>
                  <input
                    type="number"
                    min="0"
                    value={siteSettings.cashbackCalcType === 'fixed' ? (siteSettings.cashbackFixedEgp ?? 15) : (siteSettings.defaultCashbackPct ?? 2)}
                    onChange={e => {
                      const v = Number(e.target.value) || 0;
                      saveSiteSettingsImmediate(prev => (prev.cashbackCalcType === 'fixed' ? { ...prev, cashbackFixedEgp: v } : { ...prev, defaultCashbackPct: v }));
                    }}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-muted mb-1">الحد الأدنى للطلب (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={siteSettings.cashbackMinOrder ?? 0}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, cashbackMinOrder: Number(e.target.value) || 0 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-rose-500 mb-1">أقصى كاش باك بالطلب (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={siteSettings.cashbackMaxOrderCap ?? 150}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, cashbackMaxOrderCap: Number(e.target.value) || 0 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
              </div>
            </div>

            {/* 5. Loyalty Tiers Discount Limits */}
            <div className="p-4 rounded-2xl bg-surface2/70 border border-line space-y-2.5">
              <div className="font-black text-fg flex items-center gap-1.5">
                <span>🏆</span>
                <span>5. خصومات مستويات الولاء</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-muted mb-1">نوع خصم الولاء:</label>
                  <select
                    value={siteSettings.loyaltyDiscountType || 'percentage'}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, loyaltyDiscountType: e.target.value }))}
                    className="w-full p-2 rounded-xl border border-line font-bold"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (ج.م)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-muted mb-1">المبلغ الثابت (لو مختار ثابت):</label>
                  <input
                    type="number"
                    min="0"
                    value={siteSettings.loyaltyFixedDiscountEgp ?? 50}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, loyaltyFixedDiscountEgp: Number(e.target.value) || 0 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-muted mb-1">الحد الأدنى للطلب (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={siteSettings.loyaltyMinOrderAmount ?? 0}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, loyaltyMinOrderAmount: Number(e.target.value) || 0 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-rose-500 mb-1">الحد الأقصى للخصم (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={siteSettings.loyaltyMaxDiscountCap ?? 250}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, loyaltyMaxDiscountCap: Number(e.target.value) || 0 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
              </div>
            </div>

            {/* 6. Birthday & Seasonal Coupons Limits */}
            <div className="p-4 rounded-2xl bg-surface2/70 border border-line space-y-2.5">
              <div className="font-black text-fg flex items-center gap-1.5">
                <span>🎂</span>
                <span>6. قسائم أعياد الميلاد والمواسم وعجلة الحظ</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-muted mb-1">أقل طلب لقسيمة الميلاد (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={siteSettings.birthdayMinOrderAmount ?? 300}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, birthdayMinOrderAmount: Number(e.target.value) || 0 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-rose-500 mb-1">أقصى خصم للميلاد/المواسم (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={siteSettings.birthdayMaxDiscountCap ?? 200}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, birthdayMaxDiscountCap: Number(e.target.value) || 0 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-muted mb-1">أقل طلب لكوبون العجلة (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={siteSettings.spinMinOrderAmount ?? 250}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, spinMinOrderAmount: Number(e.target.value) || 0 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-rose-500 mb-1">أقصى خصم لكوبون العجلة (ج.م):</label>
                  <input
                    type="number"
                    min="0"
                    value={siteSettings.spinMaxDiscountCap ?? 150}
                    onChange={e => saveSiteSettingsImmediate(prev => ({ ...prev, spinMaxDiscountCap: Number(e.target.value) || 0 }))}
                    className="w-full p-2 rounded-xl border border-line font-mono font-black"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>);
}
