import AdminLookPanel from '../components/AdminLookPanel.jsx';
import { AdminThemeToggle } from '../components/AdminThemeGuard.jsx';
import AdminMarketplace from './AdminMarketplace.jsx';
import AdminVisualEditor from '../components/AdminVisualEditor.jsx';
import AdminThemeEditor from '../components/AdminThemeEditor.jsx';
import AdminPageSectionBuilder from '../components/AdminPageSectionBuilder.jsx';
import { AdminVersionHistoryPanel, AdminAdvancedRolesStudio } from '../components/AdminVersionAndRbac.jsx';
import AdminSiteControl from '../components/AdminSiteControl.jsx';
import AdminDashboardCustomizer from '../components/AdminDashboardCustomizer.jsx';
import { GLOBAL_CONTROL_SEARCH_INDEX, readVersionHistory } from '../lib/adminControlCenter.js';
import { User, Lock, Shield, TrendingUp, Palette, History, MousePointerClick, FileText, Printer, ClipboardList, LayoutGrid, Globe, RotateCcw, Layers, DollarSign, Upload, Camera, Database, Bell, Sparkles, Zap, Percent, Users, Tag, Building2, Cpu, X, Search, ChevronLeft, LogOut, Menu, RefreshCw, Save, Eye, AlertTriangle, Trash2, Plus, Phone, SlidersHorizontal } from 'lucide-react';
import { BusinessIntelligenceView, OrderWorkflowBoard, AdminCommandPalette, SmartNotificationsPopover } from '../components/OrderWorkflowAndBI';
import ExcelProductManager from '../components/ExcelProductManager';
import SmartPricingEngine from '../components/SmartPricingEngine';
import AiProductSourcingAgent from '../components/AiProductSourcingAgent';
import BulkProductImporter from '../components/BulkProductImporter';
import ProductQualityAndImages from '../components/ProductQualityAndImages';
import AiCommandCenter from '../components/AiCommandCenter';
import { ELZOGHBI_LOGO, ORDER_STATUSES, VISIT_SOURCE_LABELS } from '../data/constants.jsx';
import { PasswordInput } from '../components/widgets.jsx';
import { normalizePartCategory } from '../lib/catalogUtils.js';
import { Edit3, generateAiProductDetails, localDayKey, normalizeDigits } from '../lib/utils.jsx';

export function renderAdminSubTabBar(ctx, tabs, activeId, onSelect) {
  const {  } = ctx;
    const tabPalettes = [
      { idle: 'border-blue-500/25 bg-blue-500/5 text-fg hover:border-blue-500/60', act: 'bg-[#0071E3] text-white border-[#0071E3] shadow-md shadow-blue-600/20' },
      { idle: 'border-slate-500/25 bg-slate-500/5 text-fg hover:border-slate-500/60', act: 'bg-slate-600 text-white border-slate-600 shadow-md shadow-slate-600/20' },
      { idle: 'border-emerald-500/25 bg-emerald-500/5 text-fg hover:border-emerald-500/60', act: 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20' },
      { idle: 'border-amber-500/30 bg-amber-500/5 text-fg hover:border-amber-500/60', act: 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20' },
      { idle: 'border-slate-500/25 bg-slate-500/5 text-fg hover:border-slate-500/60', act: 'bg-slate-600 text-white border-slate-600 shadow-md shadow-slate-600/20' },
      { idle: 'border-rose-500/25 bg-rose-500/5 text-fg hover:border-rose-500/60', act: 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20' },
      { idle: 'border-slate-500/25 bg-slate-500/5 text-fg hover:border-slate-500/60', act: 'bg-slate-600 text-white border-slate-600 shadow-md shadow-slate-600/20' }
    ];
    return (
      <div className="bg-surface rounded-2xl p-2.5 border border-line shadow-xs flex flex-wrap items-center gap-2">
        {tabs.map((tb, idx) => {
          const isAct = activeId === tb.id;
          const pal = tabPalettes[idx % tabPalettes.length];
          return (
            <button
              key={tb.id}
              type="button"
              onClick={() => onSelect(tb.id)}
              className={`px-3.5 py-2.5 rounded-xl border text-xs font-extrabold flex items-center gap-2 transition-all ${
                isAct ? pal.act : pal.idle
              }`}
            >
              {tb.icon && <span className="text-sm">{tb.icon}</span>}
              <span>{tb.label}</span>
              {tb.badge !== undefined && tb.badge !== null && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isAct ? 'bg-black/20 text-current' : 'bg-surface text-fg border border-line'
                  }`}
                >
                  {tb.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  
}

export function renderAdminDashboard(ctx) {
  const { accountRequests, adminAuthenticated, adminCredentials, adminLoginPass, adminLoginUser, adminMenuOpen, adminNotifPanelOpen, adminSidebarMode, adminSidebarSearch, adminTab, aiCommandOpen, brands, clients, cloudSyncStatus, cmdPaletteOpen, complaints, floatingBottomMenuOpen, groups, handleAdminLoginSubmit, handleToggleSoundAndRequestPermission, handleUpdateOrderStatus, i18nActive, markLocalUpsert, models, notifications, openSidebarGroups, orders, parts, promoCodes, pullFromSupabaseCloud, pushToSupabaseCloud, renderAdminCatalog, renderAdminClients, renderAdminDatabaseSchema, renderAdminExecutiveReportsView, renderAdminFeatureFlagsDashboard, renderAdminGroups, renderAdminOrders, renderAdminOverview, renderAdminPromoCodes, renderAdminQuickStock, renderAdminRestockAlertsView, renderAdminReturnsAndComplaints, renderAdminSiteSettings, renderAdminSourcing, renderAdminStorefrontCms, returnsList, saveSiteSettingsImmediate, sbUpsert, setAdminAuthenticated, setAdminCmsSubTab, setAdminFlagsSubTab, setAdminLoginPass, setAdminLoginUser, setAdminMenuOpen, setAdminNewPassword, setAdminNewUsername, setAdminNotifPanelOpen, setAdminReturnsSubTab, setAdminSecurityModalOpen, setAdminSettingsSubTab, setAdminSidebarMode, setAdminSidebarSearch, setAdminSourcingSubTab, setAdminTab, setAiCommandOpen, setBulkPriceToolOpen, setCmdPaletteOpen, setFloatingBottomMenuOpen, setNotifications, setOpenAdminCards, setOpenSidebarGroups, setParts, setSmartNotifsOpen, showToast, siteSettings, smartNotifsOpen, soundAlertsEnabled, sourcingRequests, storeAds, switchPortal, toggleUiTheme, uiTheme } = ctx;
  const { adminSession, isAdminOwner, canAdmin, renderAdminTeam, renderAdminKarambo, setAdminSession } = ctx;
    const pendingReqCount = accountRequests.filter(r => r.status === 'pending').length;
    const pendingRetCount = returnsList.filter(r => r.status === 'قيد المراجعة' && !r.closed).length;
    const openComplaintsCount = complaints.filter(c => c.status !== 'مغلق').length;
    const newOrdersCount = orders.filter(o => o.status === 'تم الاستلام').length;
    const newSourcingCount = sourcingRequests.filter(r => r.status === 'جديد' && !r.closed).length;

    if (!adminAuthenticated) {
      return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
          <div className="bg-surface border border-line rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 text-fg">
            <div className="text-center space-y-2">
              <img
                src={ELZOGHBI_LOGO}
                alt="ELZOGHBI Logo"
                className="w-16 h-16 rounded-2xl object-contain mx-auto bg-[#161617] p-1 border border-[#0071E3]/50 shadow-lg"
              />
              <h1 className="text-xl font-black tracking-tight text-fg">
                بوابة الإدارة المركزية — ELZOGHBI ERP
              </h1>
              <p className="text-xs text-muted">أدخل بيانات المدير للوصول إلى لوحة التحكم</p>
            </div>

            <form onSubmit={handleAdminLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-muted block mb-1.5">اسم المستخدم:</label>
                <div className="relative">
                  <User className="w-4 h-4 text-muted absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={adminLoginUser}
                    onChange={e => setAdminLoginUser(e.target.value)}
                    placeholder="admin"
                    className="w-full pe-10 ps-4 py-3 rounded-xl bg-bg border border-line text-fg font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-muted block mb-1.5">كلمة المرور:</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-muted absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <PasswordInput
                    type="password"
                    required
                    value={adminLoginPass}
                    onChange={e => setAdminLoginPass(e.target.value)}
                    placeholder="••••••"
                    className="w-full pe-10 ps-4 py-3 rounded-xl bg-bg border border-line text-fg font-mono focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-black text-xs shadow-lg flex items-center justify-center gap-2 transition"
              >
                <Shield className="w-4 h-4" />
                <span>دخول لوحة التحكم</span>
              </button>

              <button
                type="button"
                onClick={() => switchPortal('storefront')}
                className="w-full py-2.5 rounded-xl bg-surface2 hover:border-[#0071E3] border border-line text-fg font-bold text-xs transition"
              >
                العودة إلى واجهة المتجر
              </button>
            </form>
          </div>
        </div>
      );
    }

    // Single source of truth for waitlist demand (sidebar badge + waitlist
    // page header): registered entries plus anonymous per-part counters
    // that exceed the registered entries for the same part.
    const totalRestockAlertsCount = (() => {
      const wl = Array.isArray(siteSettings.restockWaitlist) ? siteSettings.restockWaitlist : [];
      const entriesByPart = {};
      wl.forEach(w => { const k = String(w.partId || ''); entriesByPart[k] = (entriesByPart[k] || 0) + 1; });
      let total = wl.length;
      parts.forEach(p => {
        const c = Number(p.waitlistCount) || 0;
        const e = entriesByPart[String(p.id)] || 0;
        if (c > e) total += c - e;
      });
      return total;
    })();

    const navGroups = [
      {
        groupTitle: 'الملخص والتقارير',
        items: [
          {
            id: 'overview',
            label: 'الرئيسية والملخص',
            desc: 'مؤشرات الأداء والتنبيهات العاجلة والزيارات',
            keywords: 'ملخص احصائيات زيارات ارباح رئيسية',
            icon: TrendingUp,
            badge: null,
            urgent: false
          },
          {
            id: 'bi_analytics',
            label: 'تحليلات الأعمال (BI)',
            desc: 'مبيعات فعلية، متوسط الطلب، أداء التصنيفات، وتوصيات AI',
            keywords: 'تحليلات bi ارباح مبيعات احصائيات ذكاء اصطناعي',
            icon: TrendingUp,
            badge: 'BI',
            urgent: false
          },
          {
            id: 'reports',
            label: 'تقارير المدير العام',
            desc: 'بناء وطباعة تقارير A4 PDF وتصدير Excel',
            keywords: 'تقارير طباعة pdf excel مبيعات جرد مديونيات',
            icon: Printer,
            badge: 'PDF',
            urgent: false
          }
        ]
      },
      {
        groupTitle: 'المبيعات والطلبات',
        items: [
          {
            id: 'orders',
            label: 'الطلبات والفواتير',
            desc: 'مراجعة وتجهيز وطباعة طلبات العملاء',
            keywords: 'طلبات فواتير اوردرات شحن تسليم',
            icon: ClipboardList,
            badge: newOrdersCount > 0 ? `${newOrdersCount} جديد` : orders.length,
            urgent: newOrdersCount > 0
          },
          {
            id: 'order_workflow',
            label: 'سير عمل الطلبات (Kanban)',
            desc: 'عرض المراحل Kanban والجدول وتحديث الحالات وتصدير CSV',
            keywords: 'كانبان kanban مراحل شحن تجهيز طلبات',
            icon: LayoutGrid,
            badge: 'Kanban',
            urgent: false
          },
          {
            id: 'sourcing',
            label: 'طلبات الاستيراد (من برّه)',
            desc: 'الطلبات الخاصة من الخارج ومحادثات العملاء',
            keywords: 'استيراد الصين من بره عربون طلب خاص',
            icon: Globe,
            badge: newSourcingCount > 0 ? `${newSourcingCount} جديد` : sourcingRequests.length || null,
            urgent: newSourcingCount > 0
          },
          {
            id: 'returns',
            label: 'المرتجعات والشكاوى',
            desc: 'طلبات الضمان والاستبدال وتذاكر الشكاوى',
            keywords: 'مرتجعات ضمان استبدال شكاوى تذاكر',
            icon: RotateCcw,
            badge: pendingRetCount + openComplaintsCount > 0 ? pendingRetCount + openComplaintsCount : null,
            urgent: pendingRetCount > 0
          }
        ]
      },
      {
        groupTitle: 'المنتجات والمخازن',
        items: [
          {
            id: 'catalog',
            label: 'الكتالوج والموديلات',
            desc: 'إدارة البراندات والموديلات والمنتجات والصور',
            keywords: 'منتجات موديلات براندات ماركات صور اضافة قسم',
            icon: Layers,
            badge: models.length,
            urgent: false
          },
          {
            id: 'excel_products',
            label: 'جدول المنتجات (Excel)',
            desc: 'تعديل مباشر للأسعار والمخزون والتصنيف وتعديلات جماعية مع تراجع',
            keywords: 'اكسل excel جدول منتجات تعديل جماعي اسعار مخزون',
            icon: LayoutGrid,
            badge: 'Excel',
            urgent: false
          },
          {
            id: 'smart_pricing',
            label: 'محرك التسعير الذكي (AI)',
            desc: 'حساب الهوامش ومحاكاة قواعد التسعير قبل الاعتماد',
            keywords: 'تسعير هامش ربح تكلفة smart pricing ai',
            icon: DollarSign,
            badge: 'AI',
            urgent: false
          },
          {
            id: 'ai_product_sourcing',
            label: 'وكيل الاستيراد الذكي (AI Sourcing)',
            desc: 'اكتشاف، فلترة، كشف تكرار، إثراء عربي، تسعير، واستيراد كمسودات',
            keywords: 'وكيل استيراد ذكي ai product sourcing مواقع موردين مسودات google pixel',
            icon: Globe,
            badge: 'Agent',
            urgent: false
          },
          {
            id: 'bulk_importer',
            label: 'المستورد الذكي بالروابط',
            desc: 'استيراد منتجات جماعي عبر لصق روابط الصور أو CSV',
            keywords: 'استيراد روابط صور csv bulk importer',
            icon: Upload,
            badge: 'Bulk',
            urgent: false
          },
          {
            id: 'quality_images',
            label: 'جودة الكتالوج والصور',
            desc: 'فحص جودة المنتجات وإدارة روابط الصور المتعددة وكشف المعطوب',
            keywords: 'جودة صور روابط معطوبة وصف تحسين',
            icon: Camera,
            badge: 'Audit',
            urgent: false
          },
          {
            id: 'quick_stock',
            label: 'الجرد السريع للمخزن',
            desc: 'تعديل الأسعار والكميات والكاش باك في جدول واحد',
            keywords: 'مخزن جرد سريع كميات اسعار ستوك',
            icon: Database,
            badge: parts.length,
            urgent: false
          },
          {
            id: 'restock_alerts',
            label: 'قائمة الانتظار (نبّهني)',
            desc: 'العملاء المنتظرون للمنتجات النافدة عبر واتساب',
            keywords: 'نبهني انتظار نفاد نواقص واتساب',
            icon: Bell,
            badge: totalRestockAlertsCount > 0 ? totalRestockAlertsCount : null,
            urgent: totalRestockAlertsCount > 0
          }
        ]
      },
      {
        groupTitle: 'تصميم المتجر والتسويق',
        items: [
          {
            id: 'visual_editor',
            label: 'المحرر المرئي للموقع',
            desc: 'تعديل مباشر للبانرات والأقسام والنصوص مع معاينة حية',
            keywords: 'محرر مرئي visual editor بانر تصميم معاينة تعديل مباشر',
            icon: MousePointerClick,
            badge: 'Live',
            urgent: false
          },
          {
            id: 'theme_editor',
            label: 'محرر الهوية والألوان',
            desc: 'ألوان الوضع النهاري والليلي والخطوط والمكونات (Design Tokens)',
            keywords: 'الوان ثيم theme هوية بصرية خطوط dark mode light mode هيدر',
            icon: Palette,
            badge: 'Theme',
            urgent: false
          },
          {
            id: 'page_builder',
            label: 'منشئ الصفحات والأقسام',
            desc: 'ترتيب الأقسام بالسحب والإفلات، إنشاء صفحات SEO، وأدوات التحكم المكتشفة',
            keywords: 'منشئ صفحات اقسام page builder section builder seo شارات نصوص',
            icon: FileText,
            badge: 'CMS',
            urgent: false
          },
          {
            id: 'site_control',
            label: 'التحكم الشامل في الموقع',
            desc: 'محرك Site Control: ثيمات ونصوص وأقسام — مسودة ومعاينة ونشر واسترجاع',
            keywords: 'site control تحكم شامل ثيم نصوص اقسام نشر مسودة استرجاع',
            icon: SlidersHorizontal,
            badge: 'جديد',
            urgent: false
          },
          {
            id: 'storefront_cms',
            label: 'استوديو الواجهة والإعلانات',
            desc: 'تصميم البنرات، التحكم الدقيق بالصور، الاختصارات، والنشرة',
            keywords: 'اعلانات بنرات صور واجهة اختصارات بارات نشرة بريدية',
            icon: Sparkles,
            badge: storeAds.length,
            urgent: false
          },
          {
            id: 'karambo',
            label: 'كرومبو الشغلانة',
            desc: 'دليل الموبايلات، أدوات كرومبو، المزامنة والتنبيهات',
            keywords: 'كرومبو دليل موبايلات اسعار سوق مقارنة تقسيط',
            icon: Search,
            badge: 'جديد',
            urgent: false
          },
          {
            id: 'marketplace',
            label: 'إعلانات بيع الموبايلات',
            desc: 'مراجعة وقبول ورفض إعلانات «بيع عندنا» والبلاغات',
            keywords: 'بيع عندنا اعلانات موبايلات مستعملة مراجعة بلاغات marketplace',
            icon: Sparkles,
            badge: 'جديد',
            urgent: false
          },
          {
            id: 'feature_flags',
            label: 'محرك المبيعات والولاء (18)',
            desc: 'الكاش باك، عجلة الحظ، الجودة، الكاشير، والواتساب',
            keywords: 'مميزات كاش باك عجلة الحظ جودة ولاء عيد ميلاد احالة vip ضمان',
            icon: Zap,
            badge: '18',
            urgent: false
          },
          {
            id: 'promos',
            label: 'الكوبونات وحماية الربح',
            desc: 'أكواد الخصم وسقف الخصومات والحد الأدنى للطلب',
            keywords: 'كوبونات خصم اكواد حماية الربح شحن مجاني',
            icon: Percent,
            badge: promoCodes.length,
            urgent: false
          }
        ]
      },
      {
        groupTitle: 'العملاء والإعدادات',
        items: [
          {
            id: 'clients',
            label: 'العملاء والحسابات',
            desc: 'ملفات العملاء، المحفظة، المديونيات، واستعادة كلمة السر',
            keywords: 'عملاء حسابات تجار مديونيات محفظة اجل باسورد otp',
            icon: Users,
            badge: pendingReqCount > 0 ? `${pendingReqCount} طلب` : clients.length,
            urgent: pendingReqCount > 0
          },
          {
            id: 'groups',
            label: 'شرائح الأسعار والشحن',
            desc: 'مجموعات التسعير (جملة/قطاعي) وأسعار توصيل المحافظات',
            keywords: 'مجموعات شرائح جملة قطاعي شحن محافظات عملات',
            icon: Tag,
            badge: groups.length,
            urgent: false
          },
          {
            id: 'site_settings',
            label: 'إعدادات المتجر والدفع',
            desc: 'بيانات التواصل، الشريط المتحرك، طرق الدفع، والشروط',
            keywords: 'اعدادات دفع فودافون انستاباي شروط سياسة تواصل شريط متحرك',
            icon: Building2,
            badge: null,
            urgent: false
          },
          {
            id: 'version_history',
            label: 'سجل الإصدارات والنسخ',
            desc: 'سجل التعديلات، مقارنة الفروقات، والنسخ الاحتياطي والاستعادة',
            keywords: 'سجل تعديلات اصدارات نسخ احتياطي استعادة تراجع version backup',
            icon: History,
            badge: null,
            urgent: false
          },
          {
            id: 'schema',
            label: 'قاعدة البيانات السحابية',
            desc: 'حالة الربط مع Supabase وأكواد الجداول SQL',
            keywords: 'قاعدة بيانات سيرفر supabase sql جداول',
            icon: Cpu,
            badge: null,
            urgent: false
          }
        ]
      }
    ];

    // RBAC: employees only see the sections they were granted; the owner sees all.
    if (!isAdminOwner) {
      for (const g of navGroups) g.items = g.items.filter(it => canAdmin(it.id));
    }
    if (isAdminOwner) {
      const lastGroup = navGroups[navGroups.length - 1];
      if (lastGroup && !lastGroup.items.some(it => it.id === 'team')) {
        lastGroup.items = [...lastGroup.items, {
          id: 'team',
          label: 'فريق العمل والصلاحيات',
          desc: 'حسابات الموظفين وصلاحيات كل واحد في أقسام الداشبورد',
          keywords: 'موظفين فريق صلاحيات مستخدمين حسابات دخول',
          icon: Users,
          badge: null,
          urgent: false
        }];
      }
    }
    const visibleNavGroups = navGroups.filter(g => g.items.length > 0);
    const allNavItems = visibleNavGroups.flatMap(g => g.items.map(it => ({ ...it, groupTitle: g.groupTitle })));
    const currentNavItem = allNavItems.find(n => n.id === adminTab) || allNavItems[0];

    // Quick Deep-Search Shortcuts (jumps directly to Sub-Tabs too!)
    const quickToolsIndex = [
      { label: 'التحكم الكامل في الهيدر والشعار والروابط', tab: 'storefront_cms', sub: () => setAdminCmsSubTab('header_studio'), kw: 'هيدر شعار لوجو قوائم بحث' },
      { label: 'التحكم الكامل في الفوتر (الجزء السفلي للموقع)', tab: 'storefront_cms', sub: () => setAdminCmsSubTab('footer_studio'), kw: 'فوتر اسفل الموقع حقوق تواصل دفع' },
      { label: 'تفعيل إشعارات الموبايل الفورية (والموقع مقفول)', tab: 'site_settings', sub: () => setAdminSettingsSubTab('mobile_push'), kw: 'اشعار موبايل اوردر تليجرام ntfy' },
      { label: 'ضغط جميع صور الموقع لـ WebP وتقليل Egress', tab: 'site_settings', sub: () => setAdminSettingsSubTab('cloud'), kw: 'ضغط صور webp egress باقة سيرفر' },
      { label: 'تعديل جماعي للأسعار وكشف النواقص للمورد', tab: 'quick_stock', sub: () => setBulkPriceToolOpen(true), kw: 'تسعير جماعي زيادة خصم نواقص مورد' },
      { label: 'إضافة وتعديل البنرات وصور الإعلانات', tab: 'storefront_cms', sub: () => setAdminCmsSubTab('ads'), kw: 'اعلان بنر صورة تمبلت' },
      { label: 'إظهار/إخفاء أقسام الرئيسية والـ 8 اختصارات', tab: 'storefront_cms', sub: () => setAdminCmsSubTab('home_layout'), kw: 'رئيسية اختصارات ايقونات شريط' },
      { label: 'بارات عرض المنتجات والتصنيفات', tab: 'storefront_cms', sub: () => setAdminCmsSubTab('bars_cats'), kw: 'بارات عروض تصنيفات اقسام' },
      { label: 'تصميم بانر الاستيراد من الخارج', tab: 'storefront_cms', sub: () => setAdminCmsSubTab('sourcing_banner'), kw: 'بانر الصين بره استيراد' },
      { label: 'النشرة البريدية وإرسال الإيميلات', tab: 'storefront_cms', sub: () => setAdminCmsSubTab('newsletter'), kw: 'نشرة ايميل مشتركين' },
      { label: 'الكاش باك الانتقائي وسقف الـ 1500 ج.م وحارس المبيعات', tab: 'feature_flags', sub: () => setAdminFlagsSubTab('cashback_cap'), kw: 'كاش باك محفظة سقف مبيعات خروج' },
      { label: 'درجات الجودة الثلاث ورف الكاشير وخصم الكميات', tab: 'feature_flags', sub: () => setAdminFlagsSubTab('cart_tiers'), kw: 'جودة فرز اول اصلي كاشير كميات' },
      { label: 'عجلة الحظ وإشعارات المبيعات الحية', tab: 'feature_flags', sub: () => setAdminFlagsSubTab('spin_social'), kw: 'عجلة حظ اشعارات مبيعات' },
      { label: 'مستويات الولاء والـ VIP وأعياد الميلاد والواتساب', tab: 'feature_flags', sub: () => setAdminFlagsSubTab('loyalty_wa'), kw: 'ولاء vip ميلاد احالة هات صاحبك عائلة' },
      { label: 'طرق الدفع وشروط تسجيل العملاء', tab: 'site_settings', sub: () => setAdminSettingsSubTab('payments_auth'), kw: 'دفع كاش انستا باي تسجيل' }
    ];

    const searchQ = adminSidebarSearch.trim().toLowerCase();
    const allQuickTools = [
      ...GLOBAL_CONTROL_SEARCH_INDEX.map(g => ({
        label: g.label,
        tab: g.tab,
        sub: g.subTab ? () => { if (g.tab === 'storefront_cms') setAdminCmsSubTab(g.subTab); else if (g.tab === 'site_settings') setAdminSettingsSubTab(g.subTab); } : null,
        kw: g.kw
      })),
      ...quickToolsIndex
    ];
    const scrollAdminTop = () => {
      const el = document.getElementById('elz-admin-main-scroll');
      if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
      else scrollAdminTop();
    };
    const matchedQuickTools = searchQ
      ? allQuickTools.filter(t => `${t.label} ${t.kw}`.toLowerCase().includes(searchQ)).slice(0, 7)
      : [];

    const unreadAdminNotifs = notifications.filter(n => n.target === 'admin' && !n.read).length + pendingReqCount;

    // Coordinated Palette for the 5 Main Groups (Makes Distinguishing Sections Instant & Calm!)
    const groupThemes = [
      {
        titleIcon: '📊',
        headerCls: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25',
        iconBoxIdle: 'bg-blue-500/12 text-blue-600 dark:text-blue-400 border-blue-500/25',
        activeRow: 'bg-[#0071E3] text-white shadow-md shadow-blue-600/25 border-[#0071E3]',
        dot: 'bg-blue-500'
      },
      {
        titleIcon: '🛒',
        headerCls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
        iconBoxIdle: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
        activeRow: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 border-emerald-600',
        dot: 'bg-emerald-500'
      },
      {
        titleIcon: '📦',
        headerCls: 'bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-500/30',
        iconBoxIdle: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        activeRow: 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 border-amber-500',
        dot: 'bg-amber-500'
      },
      {
        titleIcon: '🎨',
        headerCls: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25',
        iconBoxIdle: 'bg-slate-500/12 text-slate-600 dark:text-slate-400 border-slate-500/25',
        activeRow: 'bg-slate-600 text-white shadow-md shadow-slate-600/25 border-slate-600',
        dot: 'bg-slate-500'
      },
      {
        titleIcon: '⚙️',
        headerCls: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/25',
        iconBoxIdle: 'bg-slate-500/12 text-slate-600 dark:text-slate-400 border-slate-500/25',
        activeRow: 'bg-slate-600 text-white shadow-md shadow-slate-600/25 border-slate-600',
        dot: 'bg-slate-500'
      }
    ];

    const activeGroupIdx = Math.max(0, visibleNavGroups.findIndex(g => g.items.some(it => it.id === adminTab)));
    const activeGroupTheme = groupThemes[activeGroupIdx % groupThemes.length];

    // Full Expanded Sidebar Content (Fits 100vh Cleanly + Zero Vertical or Horizontal Scrollbars Ever!)
    const renderExpandedSidebar = (isMobileDrawer = false) => (
      <div className="flex flex-col min-h-full w-full max-w-full justify-between select-none">
        <div className="space-y-2 p-2.5 w-full max-w-full">
          {/* Top Brand + 1-Click Tuck/Collapse Button */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-line">
            <div
              onClick={() => { setAdminTab('overview'); if (isMobileDrawer) setAdminMenuOpen(false); scrollAdminTop(); }}
              className="flex items-center gap-2 min-w-0 cursor-pointer"
            >
              <img
                src={ELZOGHBI_LOGO}
                alt="ELZOGHBI"
                className="w-9 h-9 rounded-xl object-contain bg-[#1D1D1F] p-0.5 border border-[#2997FF]/50 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-black tracking-wide text-fg truncate leading-tight">ELZOGHBI ERP</div>
                <div className="text-[9.5px] text-[#0066CC] dark:text-[#2997FF] font-extrabold truncate">لوحة الإدارة الذكية</div>
              </div>
            </div>

            {isMobileDrawer ? (
              <button
                type="button"
                onClick={() => setAdminMenuOpen(false)}
                className="w-8 h-8 rounded-lg bg-surface2 hover:bg-rose-600 text-fg hover:text-white border border-line flex items-center justify-center transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAdminSidebarMode('docked')}
                className="px-2.5 py-1.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-[10.5px] font-black flex items-center gap-1 shadow-sm transition shrink-0"
                title="ضم الشريط الجانبي للداخل"
              >
                <span>ضم</span>
                <span>{i18nActive ? '◀' : '▶'}</span>
              </button>
            )}
          </div>

          {/* Compact Instant Search */}
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={adminSidebarSearch}
              onChange={e => setAdminSidebarSearch(e.target.value)}
              placeholder="ابحث عن صفحة أو أداة..."
              className="w-full pe-8 ps-6 py-1.5 rounded-xl bg-bg border border-line focus:border-[#0071E3] text-[11px] font-bold text-fg placeholder:text-muted focus:outline-none"
            />
            {adminSidebarSearch && (
              <button
                type="button"
                onClick={() => setAdminSidebarSearch('')}
                className="absolute left-2 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Direct Sub-Tool Jump Matches */}
          {matchedQuickTools.length > 0 && (
            <div className="p-1.5 rounded-xl bg-[#0071E3]/10 border border-[#0071E3]/30 space-y-0.5">
              {matchedQuickTools.map((qt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAdminTab(qt.tab);
                    if (qt.sub) qt.sub();
                    setAdminSidebarSearch('');
                    if (isMobileDrawer) setAdminMenuOpen(false);
                    scrollAdminTop();
                  }}
                  className="w-full text-right px-2 py-1 rounded-lg hover:bg-[#0071E3] text-fg hover:text-white text-[10.5px] font-bold transition flex items-center justify-between gap-1"
                >
                  <span className="truncate">⚡ {qt.label}</span>
                  <ChevronLeft className="w-3 h-3 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* 5 Color-Coordinated Compact Collapsible Groups (All 15 Pages Fit Without Scrollbar!) */}
          <div className="space-y-1.5 w-full">
            {visibleNavGroups.map((grp, gIdx) => {
              const gTheme = groupThemes[gIdx % groupThemes.length];
              const visibleItems = searchQ
                ? grp.items.filter(it => `${it.label} ${it.desc} ${it.keywords}`.toLowerCase().includes(searchQ))
                : grp.items;
              if (visibleItems.length === 0) return null;
              const isGrpOpen = searchQ ? true : openSidebarGroups[gIdx] !== false;

              return (
                <div key={gIdx} className="rounded-xl border border-line/75 bg-bg/50 overflow-hidden w-full">
                  <button
                    type="button"
                    onClick={() => setOpenSidebarGroups(prev => ({ ...prev, [gIdx]: !isGrpOpen }))}
                    className={`w-full px-2.5 py-1 flex items-center justify-between gap-1.5 text-[10.5px] font-black border-b ${
                      isGrpOpen ? gTheme.headerCls : 'bg-surface2/60 text-fg border-transparent'
                    } transition`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <span>{gTheme.titleIcon}</span>
                      <span className="truncate">{grp.groupTitle}</span>
                    </span>
                    <span className="w-4 h-4 rounded bg-black/10 dark:bg-white/10 flex items-center justify-center font-mono text-[11px] leading-none shrink-0">
                      {isGrpOpen ? '−' : '+'}
                    </span>
                  </button>

                  {isGrpOpen && (
                    <div className="p-1 space-y-0.5">
                      {visibleItems.map(item => {
                        const IconComp = item.icon;
                        const active = adminTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setAdminTab(item.id);
                              if (isMobileDrawer) setAdminMenuOpen(false);
                              scrollAdminTop();
                            }}
                            className={`w-full px-2 py-1.5 rounded-lg text-right border transition-all flex items-center justify-between gap-1.5 ${
                              active
                                ? gTheme.activeRow
                                : 'bg-surface hover:bg-surface2 text-fg border-transparent hover:border-line font-bold'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 transition ${
                                  active ? 'bg-white/20 text-current border-white/25' : gTheme.iconBoxIdle
                                }`}
                              >
                                <IconComp className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-[11.5px] font-extrabold truncate">{item.label}</span>
                            </div>
                            {item.badge !== null && (
                              <span
                                className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-black shrink-0 ${
                                  active
                                    ? 'bg-black/20 text-current'
                                    : item.urgent
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-surface2 text-muted border border-line'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Credentials & Logout Row */}
        <div className={"p-2.5 border-t border-line bg-surface grid gap-1.5 w-full " + (isAdminOwner ? "grid-cols-2" : "grid-cols-1")}>
          {isAdminOwner && (
          <button
            type="button"
            onClick={() => {
              setAdminNewUsername(adminCredentials.username);
              setAdminNewPassword(adminCredentials.password);
              setAdminSecurityModalOpen(true);
            }}
            className="py-1.5 px-2 rounded-xl bg-surface2 hover:border-[#0071E3] border border-line text-fg text-[10.5px] font-extrabold flex items-center justify-center gap-1 transition"
          >
            <Lock className="w-3 h-3 text-[#0066CC]" />
            <span>الدخول</span>
          </button>
          )}
          <button
            type="button"
            onClick={() => {
              try { window.localStorage.setItem('elzoghbi_v2_adminAuth', 'false'); window.localStorage.removeItem('elzoghbi_v2_adminSession'); } catch (e) {}
              setAdminSession(null);
            setAdminAuthenticated(false);
              switchPortal('storefront');
              showToast('تم قفل لوحة التحكم والعودة للمتجر.', 'info');
            }}
            className="py-1.5 px-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white text-[10.5px] font-extrabold flex items-center justify-center gap-1 transition"
          >
            <LogOut className="w-3 h-3" />
            <span>خروج</span>
          </button>
        </div>
      </div>
    );

    // Tucked / Collapsed Slim Icon Rail (70px wide, fixed full height, 1-click Expand 'فرد')
    const renderDockedIconRail = () => (
      <div className="flex flex-col items-center justify-between min-h-full w-full py-2.5 px-1.5 select-none">
        <div className="flex flex-col items-center gap-1 w-full">
          <button
            type="button"
            onClick={() => setAdminSidebarMode('expanded')}
            className="w-12 h-10 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-md flex flex-col items-center justify-center gap-0.5 transition"
            title="فرد الشريط الجانبي الكامل"
          >
            <span className="text-xs font-black leading-none">{i18nActive ? '▶' : '◀'}</span>
            <span className="text-[8.5px] font-extrabold leading-none">فرد</span>
          </button>

          <div className="w-8 h-px bg-line my-0.5" />

          {visibleNavGroups.map((grp, gIdx) => {
            const gTheme = groupThemes[gIdx % groupThemes.length];
            return (
              <div key={`rail_g_${gIdx}`} className="flex flex-col items-center gap-1 w-full pb-1 border-b border-line/50 last:border-b-0">
                {grp.items.map(item => {
                  const IconComp = item.icon;
                  const active = adminTab === item.id;
                  return (
                    <button
                      key={`rail_${item.id}`}
                      type="button"
                      onClick={() => {
                        setAdminTab(item.id);
                        scrollAdminTop();
                      }}
                      title={`${grp.groupTitle} — ${item.label}${item.badge !== null ? ` (${item.badge})` : ''}`}
                      className={`relative w-10 h-8 rounded-lg border flex items-center justify-center transition-all ${
                        active ? gTheme.activeRow : `${gTheme.iconBoxIdle} hover:scale-105`
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                      {item.urgent && (
                        <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-rose-600 border border-surface" />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            try { window.localStorage.setItem('elzoghbi_v2_adminAuth', 'false'); window.localStorage.removeItem('elzoghbi_v2_adminSession'); } catch (e) {}
            setAdminSession(null);
            setAdminAuthenticated(false);
            switchPortal('storefront');
          }}
          className="w-10 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-600 text-rose-500 hover:text-white flex items-center justify-center transition"
          title="خروج للمتجر"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    );

    // 3 Primary Shortcuts for the Bottom Floating Bar
    const bottomPrimaryShortcuts = [
      { id: 'orders', label: 'الطلبات', badge: orders.length, icon: ClipboardList, activeCls: 'bg-emerald-500 text-white' },
      { id: 'quick_stock', label: 'الجرد والتسعير', badge: null, icon: Database, activeCls: 'bg-amber-400 text-slate-950' },
      { id: 'storefront_cms', label: 'الواجهة والإعلانات', badge: null, icon: Sparkles, activeCls: 'bg-slate-500 text-white' }
    ];

    const isDocked = adminSidebarMode === 'docked';
    const desktopContentMarginCls = isDocked
      ? (i18nActive ? 'lg:ms-[70px]' : 'lg:me-[70px]')
      : (i18nActive ? 'lg:ms-[272px]' : 'lg:me-[272px]');

    return (
      <div className="elz-admin-shell">
        {/* Full-Viewport Flex Sidebar (100dvh, zero overlapping fixed offset bugs) */}
        <aside
          id="elz-admin-sidebar"
          className={`hidden lg:flex flex-col elz-admin-sidebar-desktop ${i18nActive ? 'border-r' : 'border-l'} z-40 bg-surface dark:bg-[#161617] border-line transition-[width] duration-300 ${
            isDocked ? 'w-[70px]' : 'w-[268px]'
          }`}
        >
          {isDocked ? renderDockedIconRail() : renderExpandedSidebar(false)}
        </aside>

        {/* Mobile / Tablet Slide-Over Drawer */}
        {adminMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setAdminMenuOpen(false)} />
            <aside
              id="elz-admin-sidebar-mobile"
              className="relative z-10 w-[280px] max-w-[86vw] h-full bg-surface dark:bg-[#161617] border-l border-line overflow-y-auto overflow-x-hidden shadow-2xl"
            >
              {renderExpandedSidebar(true)}
            </aside>
          </div>
        )}

        {/* Main Workspace Column — 100dvh Flex Column with ONE Single Main Scroll Container */}
        <div className="elz-admin-workspace">
          {/* Fixed-Top Header Bar (shrink-0, never scrolls away) */}
          <header className="shrink-0 z-30 bg-surface/95 dark:bg-[#161617]/95 backdrop-blur-xl border-b border-line px-3 sm:px-6 py-2.5 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Right: Tuck/Expand Toggle + Colored Active Section Title */}
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => setAdminMenuOpen(true)}
                  className="lg:hidden w-9 h-9 rounded-xl bg-surface2 border border-line text-fg flex items-center justify-center shrink-0"
                  title="فتح القائمة"
                >
                  <Menu className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setAdminSidebarMode(prev => (prev === 'docked' ? 'expanded' : 'docked'))}
                  className="hidden lg:flex h-9 px-3 rounded-xl bg-surface2 hover:border-[#0071E3] border border-line text-fg text-xs font-extrabold items-center gap-1.5 transition shrink-0"
                  title={isDocked ? 'فرد القائمة الجانبية' : 'ضم القائمة الجانبية للداخل'}
                >
                  <Menu className="w-3.5 h-3.5 text-[#0066CC]" />
                  <span>{isDocked ? '◀ فرد القائمة' : 'ضم القائمة ▶'}</span>
                </button>

                <div className="min-w-0 flex flex-col">
                  <div className="hidden sm:flex items-center gap-1.5 text-[10.5px] font-bold text-muted">
                    <span>مركز التحكم</span>
                    <span>/</span>
                    <span className="truncate">{currentNavItem.groupTitle}</span>
                    <span>/</span>
                    <span className="text-[#0071E3] font-extrabold truncate">{currentNavItem.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm sm:text-base font-black text-fg truncate">{currentNavItem.label}</h1>
                    {adminSession?.displayName && (
                      <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface2 border border-line text-[10px] font-bold text-muted">
                        👤 {adminSession.displayName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Left: Clean Color-Differentiated Action Buttons + Global Ctrl+K + AI Command Center + Smart Alerts */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs flex-wrap">
                <button
                  type="button"
                  onClick={() => setCmdPaletteOpen(true)}
                  className="h-9 px-2.5 sm:px-3 rounded-xl bg-surface2 hover:border-[#0071E3] border border-line text-fg font-extrabold flex items-center gap-1.5 transition"
                  title="بحث شامل وأوامر سريعة (Ctrl+K)"
                >
                  <Search className="w-3.5 h-3.5 text-[#0066CC]" />
                  <span className="hidden md:inline">بحث سريع</span>
                  <span className="hidden lg:inline text-[10px] px-1.5 py-0.5 rounded bg-surface border border-line text-muted font-mono">Ctrl+K</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSmartNotifsOpen(prev => !prev)}
                  className="relative h-9 w-9 rounded-xl bg-surface2 hover:border-[#0071E3] border border-line text-fg flex items-center justify-center transition"
                  title="التنبيهات الذكية للمتجر"
                >
                  <Bell className="w-4 h-4 text-amber-500" />
                  {(newOrdersCount > 0 || parts.some(p => Number(p.stock || 0) <= 0)) && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-600 border-2 border-surface" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setAiCommandOpen(true)}
                  className="h-9 px-2.5 sm:px-3 rounded-xl bg-gradient-to-l from-slate-600 to-[#0071E3] hover:opacity-95 text-white font-black flex items-center gap-1.5 shadow-sm transition"
                  title="مركز الأوامر الذكي (AI Command Center)"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden sm:inline">مساعد AI</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdminTab('storefront_cms');
                    setAdminCmsSubTab('header_studio');
                    scrollAdminTop();
                  }}
                  className="h-9 px-2.5 rounded-xl bg-slate-500/10 hover:bg-slate-600 text-slate-700 dark:text-slate-300 hover:text-white border border-slate-500/30 font-extrabold flex items-center gap-1 transition"
                  title="التحكم الكامل في الهيدر العلوي"
                >
                  <span>🎛️</span>
                  <span className="hidden xl:inline">الهيدر</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdminTab('storefront_cms');
                    setAdminCmsSubTab('footer_studio');
                    scrollAdminTop();
                  }}
                  className="h-9 px-2.5 rounded-xl bg-slate-500/10 hover:bg-slate-600 text-slate-700 dark:text-slate-300 hover:text-white border border-slate-500/30 font-extrabold flex items-center gap-1 transition"
                  title="التحكم الكامل في الفوتر (الجزء السفلي للموقع)"
                >
                  <span>🦶</span>
                  <span className="hidden xl:inline">الفوتر</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAdminTab('site_settings');
                    setAdminSettingsSubTab('mobile_push');
                    scrollAdminTop();
                  }}
                  className="h-9 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 hover:text-white border border-emerald-500/30 font-extrabold flex items-center gap-1 transition"
                  title="إشعارات الموبايل الفورية للطلبات"
                >
                  <span>📲</span>
                  <span className="hidden xl:inline">إشعار الموبايل</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleSoundAndRequestPermission}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center border transition ${
                    soundAlertsEnabled ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-surface2 text-muted border-line'
                  }`}
                  title="التنبيه الصوتي"
                >
                  <span>{soundAlertsEnabled ? '🔊' : '🔇'}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleUiTheme}
                  className="w-9 h-9 rounded-xl flex items-center justify-center border border-line bg-surface2 hover:border-[#0071E3] transition"
                  title={uiTheme === 'dark' ? 'الوضع الفاتح' : 'الوضع الليلي'}
                >
                  <span>{uiTheme === 'dark' ? '🌙' : '☀️'}</span>
                </button>

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setAdminNotifPanelOpen(prev => !prev)}
                    className={`h-9 px-3 rounded-xl font-extrabold flex items-center gap-1.5 border transition ${
                      unreadAdminNotifs > 0
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                        : 'bg-surface2 hover:border-[#0071E3] text-fg border-line'
                    }`}
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>{unreadAdminNotifs}</span>
                  </button>

                  {adminNotifPanelOpen && (
                    <>
                      <div className="fixed inset-0 z-[55] bg-black/40 sm:bg-transparent" onClick={() => setAdminNotifPanelOpen(false)} />
                      <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-x-auto sm:top-auto sm:left-0 sm:mt-2 sm:w-96 rounded-2xl bg-surface border border-line shadow-2xl z-[60] overflow-hidden">
                        <div className="p-3 bg-nav2 text-white flex items-center justify-between">
                          <span className="font-extrabold text-xs">الإشعارات والتنبيهات</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setNotifications(prev => prev.map(n => (n.target === 'admin' ? { ...n, read: true } : n)))}
                              className="text-[11px] text-[#2997FF] hover:underline font-bold"
                            >
                              تحديد كمقروء
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdminNotifPanelOpen(false)}
                              className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="max-h-80 overflow-y-auto divide-y divide-line">
                          {pendingReqCount > 0 && (
                            <div
                              onClick={() => { setAdminTab('clients'); setAdminNotifPanelOpen(false); }}
                              className="p-3 bg-rose-500/10 hover:bg-rose-500/20 cursor-pointer transition flex items-start gap-2.5"
                            >
                              <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                                <Users className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-black text-fg text-xs">يوجد ({pendingReqCount}) طلب فتح حساب عميل جديد</div>
                                <div className="text-[11px] text-rose-500 mt-0.5">اضغط للمراجعة والتفعيل</div>
                              </div>
                            </div>
                          )}
                          {notifications.filter(n => n.target === 'admin').slice(0, 15).map(n => (
                            <div
                              key={n.id}
                              onClick={() => {
                                setNotifications(prev => prev.map(x => (x.id === n.id ? { ...x, read: true } : x)));
                                if (n.type === 'sourcing') {
                                  setAdminTab('sourcing');
                                  setAdminSourcingSubTab('requests');
                                  if (n.srcId) setOpenAdminCards(prev => ({ ...prev, [`src_${n.srcId}`]: true }));
                                } else if (n.type === 'account_request' || n.type === 'password_reset' || n.type === 'new_client' || n.reqId) {
                                  setAdminTab('clients');
                                } else if (n.type === 'return' || n.type === 'complaint') {
                                  setAdminTab('returns');
                                  setAdminReturnsSubTab(n.type === 'complaint' ? 'complaints' : 'returns');
                                } else if (n.type === 'restock_waitlist') {
                                  setAdminTab('restock_alerts');
                                } else {
                                  setAdminTab('orders');
                                }
                                setAdminNotifPanelOpen(false);
                              }}
                              className={`p-3 cursor-pointer hover:bg-surface2 transition ${!n.read ? 'bg-[#0071E3]/5' : 'bg-surface'}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-extrabold text-fg text-xs">{n.title}</span>
                                <span className="text-[10px] text-muted shrink-0">{n.time}</span>
                              </div>
                              <p className="text-[11px] text-muted mt-1 leading-relaxed">{n.msg}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => pullFromSupabaseCloud(true)}
                  className="h-9 px-2.5 rounded-xl bg-surface2 hover:border-[#0071E3] text-fg font-bold flex items-center gap-1 border border-line transition"
                  title="تحديث البيانات من السيرفر"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#0066CC]" />
                  <span className="hidden md:inline">تحديث</span>
                </button>

                <button
                  type="button"
                  onClick={() => pushToSupabaseCloud(null, true)}
                  className="h-9 px-3.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-extrabold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{cloudSyncStatus === 'syncing' ? 'يحفظ...' : 'حفظ التعديلات'}</span>
                </button>

                <AdminThemeToggle />
                <button
                  type="button"
                  onClick={() => switchPortal('storefront')}
                  className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">معاينة المتجر</span>
                </button>
              </div>
            </div>
          </header>

          {/* SINGLE MAIN SCROLL AREA (100% remaining viewport height, zero competing scrollbars) */}
          <div id="elz-admin-main-scroll" className="elz-admin-main-scroll">
            <div className="w-full max-w-[1480px] mx-auto p-3 sm:p-5 pb-24 min-w-0">
            {adminTab === 'team' && isAdminOwner && renderAdminTeam()}
            {adminTab === 'karambo' && canAdmin('karambo') && renderAdminKarambo()}
            {adminTab === 'marketplace' && canAdmin('marketplace') && (() => { const sc = ctx.getSupabaseConfig(); return <AdminMarketplace sbUrl={sc.sbUrl} sbKey={sc.sbKey} showToast={ctx.showToast} adminCredentials={adminCredentials} adminSession={adminSession} />; })()}
            {adminTab === 'visual_editor' && canAdmin('visual_editor') && (
              <AdminVisualEditor
                siteSettings={siteSettings}
                setSiteSettings={ctx.setSiteSettings}
                saveSiteSettingsImmediate={saveSiteSettingsImmediate}
                storeAds={storeAds}
                parts={parts}
                adminSession={adminSession}
                showToast={showToast}
                onOpenStorefront={() => switchPortal('storefront')}
                onNavigateTab={(t) => { setAdminTab(t); scrollAdminTop(); }}
              />
            )}
            {adminTab === 'theme_editor' && canAdmin('theme_editor') && (
              <div className="space-y-4">
              <AdminLookPanel siteSettings={siteSettings} setSiteSettings={ctx.setSiteSettings} />
              <AdminThemeEditor
                siteSettings={siteSettings}
                setSiteSettings={ctx.setSiteSettings}
                saveSiteSettingsImmediate={saveSiteSettingsImmediate}
                adminSession={adminSession}
                showToast={showToast}
              />
              </div>
            )}
            {adminTab === 'page_builder' && canAdmin('page_builder') && (
              <AdminPageSectionBuilder
                siteSettings={siteSettings}
                setSiteSettings={ctx.setSiteSettings}
                saveSiteSettingsImmediate={saveSiteSettingsImmediate}
                adminSession={adminSession}
                showToast={showToast}
              />
            )}
            {adminTab === 'site_control' && canAdmin('site_control') && (() => { const sc = ctx.getSupabaseConfig(); return (
              <AdminSiteControl
                showToast={showToast}
                adminCredentials={adminCredentials}
                sbUrl={sc.sbUrl}
                sbKey={sc.sbKey}
              />
            ); })()}
            {adminTab === 'version_history' && canAdmin('version_history') && (
              <AdminVersionHistoryPanel
                siteSettings={siteSettings}
                setSiteSettings={ctx.setSiteSettings}
                saveSiteSettingsImmediate={saveSiteSettingsImmediate}
                adminSession={adminSession}
                showToast={showToast}
              />
            )}
            {adminTab !== 'team' && !canAdmin(adminTab) && (
              <div className="bg-surface border border-line rounded-3xl p-10 text-center space-y-3">
                <Shield className="w-10 h-10 mx-auto text-rose-500" />
                <p className="font-extrabold text-fg">القسم ده مش من صلاحيات حسابك</p>
                <p className="text-xs text-muted">الصلاحيات بيحددها مالك المتجر لكل موظف. لو محتاج القسم ده، كلّمه يفعّلهولك من «فريق العمل والصلاحيات».</p>
              </div>
            )}
            {adminTab === 'overview' && renderAdminOverview()}
            {adminTab === 'bi_analytics' && (
              <BusinessIntelligenceView
                parts={parts}
                orders={orders}
                clients={clients}
                normalizePartCategory={normalizePartCategory}
              />
            )}
            {adminTab === 'order_workflow' && (
              <OrderWorkflowBoard
                orders={orders}
                onUpdateOrderStatus={(orderId, nextStatus) => {
                  handleUpdateOrderStatus(orderId, nextStatus, false);
                }}
                showToast={showToast}
              />
            )}
            {adminTab === 'excel_products' && (
              <ExcelProductManager
                parts={parts}
                categories={Array.from(new Set(parts.map(p => normalizePartCategory(p.category, p.name)).filter(Boolean)))}
                hiddenPartIds={siteSettings.hiddenPartIds || []}
                normalizePartCategory={normalizePartCategory}
                onUpdatePart={(partId, patch) => {
                  let updatedObj = null;
                  setParts(prev => prev.map(p => {
                    if (String(p.id) !== String(partId)) return p;
                    updatedObj = { ...p, ...patch };
                    return updatedObj;
                  }));
                  if (updatedObj) {
                    markLocalUpsert('parts', updatedObj);
                    sbUpsert('spare_parts', updatedObj);
                  }
                }}
                onBulkUpdateParts={(patchMap) => {
                  const synced = [];
                  setParts(prev => prev.map(p => {
                    if (!patchMap[p.id]) return p;
                    const u = { ...p, ...patchMap[p.id] };
                    synced.push(u);
                    return u;
                  }));
                  synced.forEach(u => {
                    markLocalUpsert('parts', u);
                    sbUpsert('spare_parts', u);
                  });
                }}
                onToggleHideParts={(ids, shouldHide) => {
                  const idSet = new Set(ids.map(String));
                  saveSiteSettingsImmediate(prev => {
                    const cur = new Set((prev.hiddenPartIds || []).map(String));
                    if (shouldHide) idSet.forEach(x => cur.add(x));
                    else idSet.forEach(x => cur.delete(x));
                    return { ...prev, hiddenPartIds: Array.from(cur) };
                  });
                  showToast(shouldHide ? `تم إخفاء ${ids.length} منتج` : `تم إظهار ${ids.length} منتج`, 'info');
                }}
                onDuplicateParts={(ids) => {
                  const idSet = new Set(ids.map(String));
                  const usedSkus = new Set(parts.map(x => String(x.sku || '')));
                  const clones = parts.filter(p => idSet.has(String(p.id))).map((p, i) => {
                    const baseSku = `${p.sku || 'SKU'}-COPY`;
                    let candidate = baseSku;
                    let n = 2;
                    while (usedSkus.has(candidate)) {
                      candidate = `${baseSku}${n}`;
                      n++;
                    }
                    usedSkus.add(candidate);
                    return {
                      ...p,
                      id: `dup_${Date.now()}_${i}`,
                      sku: candidate,
                      name: `${p.name} (نسخة)`
                    };
                  });
                  setParts(prev => [...clones, ...prev]);
                  clones.forEach(c => {
                    markLocalUpsert('parts', c);
                    sbUpsert('spare_parts', c);
                  });
                  showToast(`تم نسخ ${clones.length} منتج ومزامنتها بنجاح ✓`, 'success');
                }}
                showToast={showToast}
              />
            )}
            {adminTab === 'smart_pricing' && (
              <SmartPricingEngine
                parts={parts}
                categories={Array.from(new Set(parts.map(p => normalizePartCategory(p.category, p.name)).filter(Boolean)))}
                normalizePartCategory={normalizePartCategory}
                onApplyPricingMap={async (priceMap) => {
                  const synced = [];
                  setParts(prev => prev.map(p => {
                    if (!priceMap[p.id]) return p;
                    const u = { ...p, ...priceMap[p.id] };
                    synced.push(u);
                    return u;
                  }));
                  synced.forEach(u => markLocalUpsert('parts', u));
                  if (synced.length === 0) return true;
                  const results = await Promise.all(synced.map(u => sbUpsert('spare_parts', u).catch(() => false)));
                  return results.every(r => r !== false);
                }}
                showToast={showToast}
              />
            )}
            {adminTab === 'ai_product_sourcing' && (
              <AiProductSourcingAgent
                parts={parts}
                brands={brands}
                models={models}
                categories={Array.from(new Set(parts.map(p => normalizePartCategory(p.category, p.name)).filter(Boolean)))}
                normalizePartCategory={normalizePartCategory}
                onConfirmImportParts={async (newParts, opts = {}) => {
                  const asDraft = opts.asDraft !== false;
                  setParts(prev => [...newParts, ...prev]);
                  newParts.forEach(np => markLocalUpsert('parts', np));
                  const savedOk = await sbUpsert('spare_parts', newParts).catch(() => false);
                  if (savedOk === false) throw new Error('Supabase save failed');
                  if (asDraft && newParts.length > 0) {
                    saveSiteSettingsImmediate(prev => {
                      const cur = new Set((prev.hiddenPartIds || []).map(String));
                      newParts.forEach(np => cur.add(String(np.id)));
                      return { ...prev, hiddenPartIds: Array.from(cur) };
                    });
                  }
                }}
                onApplyCatalogUpdates={async (patchMap) => {
                  const synced = [];
                  setParts(prev => prev.map(p => {
                    if (!patchMap[p.id]) return p;
                    const u = { ...p, ...patchMap[p.id] };
                    synced.push(u);
                    return u;
                  }));
                  synced.forEach(u => markLocalUpsert('parts', u));
                  if (synced.length === 0) return true;
                  const results = await Promise.all(synced.map(u => sbUpsert('spare_parts', u).catch(() => false)));
                  return results.every(r => r !== false);
                }}
                showToast={showToast}
              />
            )}
            {adminTab === 'bulk_importer' && (
              <BulkProductImporter
                brands={brands}
                models={models}
                categories={Array.from(new Set(parts.map(p => normalizePartCategory(p.category, p.name)).filter(Boolean)))}
                normalizePartCategory={normalizePartCategory}
                generateAiDetails={generateAiProductDetails}
                onConfirmImport={(newParts) => {
                  setParts(prev => [...newParts, ...prev]);
                  newParts.forEach(np => markLocalUpsert('parts', np));
                  sbUpsert('spare_parts', newParts);
                  showToast(`تم استيراد وحفظ ${newParts.length} منتج جديد ومزامنتها مع قاعدة البيانات ✓`, 'success');
                }}
                showToast={showToast}
              />
            )}
            {adminTab === 'quality_images' && (
              <ProductQualityAndImages
                parts={parts}
                normalizePartCategory={normalizePartCategory}
                generateAiDetails={generateAiProductDetails}
                onUpdatePart={(partId, patch) => {
                  let updatedObj = null;
                  setParts(prev => prev.map(p => {
                    if (String(p.id) !== String(partId)) return p;
                    updatedObj = { ...p, ...patch };
                    return updatedObj;
                  }));
                  if (updatedObj) {
                    markLocalUpsert('parts', updatedObj);
                    sbUpsert('spare_parts', updatedObj);
                  }
                }}
                showToast={showToast}
              />
            )}
            {adminTab === 'reports' && renderAdminExecutiveReportsView()}
            {adminTab === 'feature_flags' && renderAdminFeatureFlagsDashboard()}
            {adminTab === 'restock_alerts' && renderAdminRestockAlertsView()}
            {adminTab === 'site_settings' && renderAdminSiteSettings()}
            {adminTab === 'storefront_cms' && renderAdminStorefrontCms()}
            {adminTab === 'promos' && renderAdminPromoCodes()}
            {adminTab === 'orders' && renderAdminOrders()}
            {adminTab === 'catalog' && renderAdminCatalog()}
            {adminTab === 'quick_stock' && renderAdminQuickStock()}
            {adminTab === 'groups' && renderAdminGroups()}
            {adminTab === 'clients' && renderAdminClients()}
            {adminTab === 'returns' && renderAdminReturnsAndComplaints()}
            {adminTab === 'sourcing' && renderAdminSourcing()}
            {adminTab === 'schema' && renderAdminDatabaseSchema()}
            </div>
          </div>
        </div>

        {/* Persistent Executive Overlays: AI Command Center, Ctrl+K Command Palette & Smart Notifications */}
        <AiCommandCenter
          open={aiCommandOpen}
          onClose={() => setAiCommandOpen(false)}
          parts={parts}
          orders={orders}
          clients={clients}
          models={models}
          brands={brands}
          normalizePartCategory={normalizePartCategory}
          onNavigateTab={(t) => { setAdminTab(t); scrollAdminTop(); }}
          onCreateProductFromAi={(payload) => {
            const targetModel = models[0] || { id: 'or_mdl_001', brand: brands[0] || 'OR - Majentik' };
            const created = {
              id: `ai_prt_${Date.now()}`,
              sku: `AI-${Date.now().toString().slice(-5)}`,
              modelId: targetModel.id,
              brand: targetModel.brand,
              category: payload.category || 'شواحن',
              name: payload.name,
              qualityGrade: 'أصلي معتمد',
              colors: ['قياسي'],
              compatibleModels: [targetModel.brand],
              description: `${payload.name} — تمت إضافته عبر مركز الأوامر الذكي بضمان متجر ELZOGHBI.`,
              warrantyText: 'ضمان استبدال ومعاينة معتمد من متجر الزغبي',
              image: payload.image || '',
              imageUrl: payload.image || '',
              images: payload.image ? [payload.image] : [],
              stock: Number(payload.stock) || 5,
              lowStockThreshold: 2,
              maxOrderQty: 5,
              costPrice: Number(payload.costPrice) || 0,
              basePrice: Number(payload.basePrice) || 350,
              customGroupPrices: { _images: payload.image ? [payload.image] : [] },
              createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
              waitlistCount: 0
            };
            setParts(prev => [created, ...prev]);
            markLocalUpsert('parts', created);
            sbUpsert('spare_parts', created);
          }}
          onApplyBulkPriceChange={(ids, pct) => {
            const idSet = new Set(ids.map(String));
            const synced = [];
            setParts(prev => prev.map(p => {
              if (!idSet.has(String(p.id))) return p;
              const u = { ...p, basePrice: Math.max(1, Math.round(Number(p.basePrice || 0) * (1 + Number(pct) / 100))) };
              synced.push(u);
              return u;
            }));
            synced.forEach(u => {
              markLocalUpsert('parts', u);
              sbUpsert('spare_parts', u);
            });
          }}
          showToast={showToast}
        />

        <AdminCommandPalette
          open={cmdPaletteOpen}
          onClose={() => setCmdPaletteOpen(false)}
          parts={parts}
          orders={orders}
          clients={clients}
          onNavigateTab={(t) => { setAdminTab(t); scrollAdminTop(); }}
          onOpenAi={() => setAiCommandOpen(true)}
        />

        <SmartNotificationsPopover
          open={smartNotifsOpen}
          onClose={() => setSmartNotifsOpen(false)}
          parts={parts}
          orders={orders}
          onNavigateTab={(t) => { setAdminTab(t); scrollAdminTop(); }}
        />

        {/* Sleek Responsive Floating Bottom Bar & Scrollable Mobile Popup (Zero Clipping on Any Phone!) */}
        <div className="fixed bottom-3 inset-x-0 px-2.5 z-40 flex flex-col items-center pointer-events-none">
          {/* Pop-up Directory of All Pages — Bounded Height & Scrollable on Mobile */}
          {floatingBottomMenuOpen && (
            <>
              <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-[-1] pointer-events-auto" onClick={() => setFloatingBottomMenuOpen(false)} />
              <div className="pointer-events-auto mb-2 w-full max-w-[660px] max-h-[70vh] rounded-3xl bg-surface dark:bg-[#1D1D1F] border-2 border-[#0071E3]/50 shadow-2xl flex flex-col overflow-hidden">
                <div className="shrink-0 flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-line bg-surface dark:bg-[#1D1D1F]">
                  <span className="font-black text-xs sm:text-sm text-fg truncate">🧭 جميع صفحات الداشبورد</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        scrollAdminTop();
                        setFloatingBottomMenuOpen(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-[#0071E3] text-white text-[10px] sm:text-[11px] font-extrabold"
                    >
                      ↑ أعلى الصفحة
                    </button>
                    <button
                      type="button"
                      onClick={() => setFloatingBottomMenuOpen(false)}
                      className="w-7 h-7 rounded-lg bg-rose-500/15 text-rose-500 hover:bg-rose-600 hover:text-white flex items-center justify-center transition"
                      title="إغلاق"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {visibleNavGroups.map((grp, gIdx) => {
                    const gTheme = groupThemes[gIdx % groupThemes.length];
                    return (
                      <div key={`pop_g_${gIdx}`} className="p-2.5 rounded-2xl bg-bg border border-line space-y-1.5">
                        <div className={`px-2 py-1 rounded-lg border text-[10px] font-black flex items-center gap-1.5 ${gTheme.headerCls}`}>
                          <span>{gTheme.titleIcon}</span>
                          <span>{grp.groupTitle}</span>
                        </div>
                        {grp.items.map(it => {
                          const IconC = it.icon;
                          const isAct = adminTab === it.id;
                          return (
                            <button
                              key={`pop_it_${it.id}`}
                              type="button"
                              onClick={() => {
                                setAdminTab(it.id);
                                setFloatingBottomMenuOpen(false);
                                scrollAdminTop();
                              }}
                              className={`w-full px-2.5 py-1.5 rounded-xl text-right text-[11px] font-extrabold flex items-center justify-between gap-1.5 transition ${
                                isAct ? gTheme.activeRow : 'hover:bg-surface2 text-fg'
                              }`}
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <IconC className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{it.label}</span>
                              </span>
                              {it.badge !== null && (
                                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${isAct ? 'bg-black/20 text-current' : 'bg-surface2 text-muted'}`}>
                                  {it.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Compact Responsive 4-Button Dock: Always 100% Visible on Mobile Without Clipping */}
          <div className="pointer-events-auto w-full max-w-[430px] sm:w-auto sm:max-w-none px-1.5 sm:px-2.5 py-1.5 rounded-2xl sm:rounded-full bg-[#161617]/95 text-white border border-[#0071E3]/50 shadow-2xl backdrop-blur-xl grid grid-cols-4 sm:flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-extrabold">
            {bottomPrimaryShortcuts.map(sc => {
              const IconC = sc.icon;
              const isAct = adminTab === sc.id;
              const shortMobileLabel = sc.id === 'quick_stock' ? 'الجرد' : sc.id === 'storefront_cms' ? 'الواجهة' : sc.label;
              return (
                <button
                  key={`bshort_${sc.id}`}
                  type="button"
                  onClick={() => {
                    setAdminTab(sc.id);
                    setFloatingBottomMenuOpen(false);
                    scrollAdminTop();
                  }}
                  className={`px-1.5 sm:px-3 py-1.5 rounded-xl sm:rounded-full flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 transition min-w-0 ${
                    isAct ? `${sc.activeCls} shadow` : 'bg-white/10 hover:bg-white/20 text-slate-100'
                  }`}
                >
                  <span className="relative flex items-center justify-center">
                    <IconC className="w-3.5 h-3.5 shrink-0" />
                    {sc.badge !== null && (
                      <span className="sm:hidden absolute -top-1.5 -right-2.5 px-1 rounded-full bg-rose-600 text-white text-[8px] font-black leading-tight">{sc.badge}</span>
                    )}
                  </span>
                  <span className="sm:hidden truncate max-w-full">{shortMobileLabel}</span>
                  <span className="hidden sm:inline whitespace-nowrap">{sc.label}</span>
                  {sc.badge !== null && (
                    <span className="hidden sm:inline px-1.5 rounded-full bg-black/25 text-[9px] font-black">{sc.badge}</span>
                  )}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setFloatingBottomMenuOpen(prev => !prev)}
              className={`px-1.5 sm:px-3.5 py-1.5 rounded-xl sm:rounded-full flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 transition border min-w-0 ${
                floatingBottomMenuOpen
                  ? 'bg-[#0071E3] text-white border-[#2997FF]'
                  : 'bg-[#0071E3]/25 hover:bg-[#0071E3] text-[#93C5FD] hover:text-white border-[#0071E3]/40'
              }`}
            >
              <Menu className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">القائمة</span>
            </button>
          </div>
        </div>
      </div>
    );
  
}

export function renderVisitorStats(ctx) {
  const { loadVisitStats, orders, visitInfo, visitStats } = ctx;
    const days = (visitStats && visitStats.days) || {};
    const get = off => ({ visits: 0, uniq: 0, newU: 0, ...(days[localDayKey(off)] || {}) });
    const sum = n => {
      let v = 0, u = 0, nw = 0;
      for (let i = 0; i < n; i++) { const d = get(i); v += d.visits; u += d.uniq; nw += d.newU; }
      return { v, u, nw };
    };
    const t = get(0);
    const y = get(1);
    const w = sum(7);
    const m = sum(30);
    let totalVisits = (visitStats && visitStats.totals && visitStats.totals.visits) || 0;
    if (!totalVisits) Object.values(days).forEach(d => { totalVisits += d.visits || 0; });
    const totalUniq = (visitStats && visitStats.totals && visitStats.totals.uniq) || 0;
    const keys7 = Array.from({ length: 7 }, (_, i) => localDayKey(i));
    const orders7 = orders.filter(o => keys7.includes(String(o.createdAt || '').slice(0, 10))).length;
    const conv = w.u > 0 ? ((orders7 / w.u) * 100).toFixed(1) : '0';
    const bars = Array.from({ length: 14 }, (_, i) => {
      const k = localDayKey(13 - i);
      return { k, u: (days[k] || {}).uniq || 0 };
    });
    const maxU = Math.max(1, ...bars.map(b => b.u));
    // Merge legacy alias keys (e.g. 'ig') into their canonical source so
    // historical counters display as one channel.
    const srcAlias = { ig: 'instagram', insta: 'instagram', fb: 'facebook', wa: 'whatsapp', tt: 'tiktok', yt: 'youtube', x: 'twitter' };
    const mergedSources = {};
    Object.entries((visitStats && visitStats.sources) || {}).forEach(([k, n]) => {
      const ck = srcAlias[k] || k;
      mergedSources[ck] = (mergedSources[ck] || 0) + n;
    });
    const src = Object.entries(mergedSources).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const srcTotal = src.reduce((a, [, n]) => a + n, 0) || 1;
    const retW = Math.max(0, w.u - w.nw);
    return (
      <div className="bg-surface rounded-2xl p-5 border border-line shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="text-sm font-extrabold text-fg">👁️ زوار الموقع</h3>
            <p className="text-[11px] text-muted">
              {visitInfo.cloud ? 'الأرقام من السيرفر (كل زوار الموقع).' : 'الأرقام محلية على الجهاز ده بس. اربط Supabase عشان تشوف كل الزوار.'}
              {' '}بنستثني زياراتك إنت من الجهاز اللي دخلت منه الأدمن.
            </p>
          </div>
          <button type="button" onClick={loadVisitStats} className="px-3 py-1.5 rounded-lg bg-surface2 hover:bg-surface2 text-xs font-bold text-muted">
            {visitInfo.loading ? 'بحدّث...' : 'تحديث'}
          </button>
        </div>
        {visitInfo.error && <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-bold">{visitInfo.error}</div>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-center">
          {[
            ['النهاردة', t.uniq, `${t.visits} زيارة`],
            ['إمبارح', y.uniq, `${y.visits} زيارة`],
            ['آخر 7 أيام', w.u, `${w.v} زيارة`],
            ['آخر 30 يوم', m.u, `${m.v} زيارة`]
          ].map(([label, n, sub]) => (
            <div key={label} className="rounded-xl bg-surface2 border border-line p-3">
              <div className="text-2xl font-black text-accent-text">{n}</div>
              <div className="text-xs font-extrabold text-fg">{label} (زائر فريد)</div>
              <div className="text-[10px] text-muted">{sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-extrabold text-muted mb-2">الزوار الفريدين في آخر 14 يوم</div>
            <div className="flex items-end gap-1 h-28">
              {bars.map(b => (
                <div key={b.k} className="flex-1 flex flex-col items-center justify-end gap-1" title={`${b.k}: ${b.u}`}>
                  <span className="text-[9px] text-muted font-bold">{b.u || ''}</span>
                  <div className="w-full rounded-t bg-gradient-to-t from-[#0077ED] to-[#2997FF]" style={{ height: `${Math.max(3, (b.u / maxU) * 80)}px` }} />
                  <span className="text-[8px] text-muted">{b.k.slice(8)}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-extrabold text-muted mb-2">الزوار جايين منين؟</div>
            {src.length === 0 && <div className="text-xs text-muted">لسه مفيش بيانات.</div>}
            <div className="space-y-1.5">
              {src.map(([k, n]) => (
                <div key={k} className="text-xs">
                  <div className="flex justify-between font-bold text-muted">
                    <span>{VISIT_SOURCE_LABELS[k] || k}</span>
                    <span>{n} ({Math.round((n / srcTotal) * 100)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface2 overflow-hidden">
                    <div className="h-full bg-slate-500 rounded-full" style={{ width: `${(n / srcTotal) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-center text-xs">
          <div className="rounded-xl bg-surface2 border border-line p-3"><div className="text-lg font-black text-fg">{w.nw}</div><div className="font-bold text-muted">زوار جداد (7 أيام)</div></div>
          <div className="rounded-xl bg-surface2 border border-line p-3"><div className="text-lg font-black text-fg">{retW}</div><div className="font-bold text-muted">زوار راجعين (7 أيام)</div></div>
          <div className="rounded-xl bg-surface2 border border-line p-3"><div className="text-lg font-black text-fg">{orders7}</div><div className="font-bold text-muted">طلبات آخر 7 أيام</div></div>
          <div className="rounded-xl bg-accent/10 border border-accent/30 p-3"><div className="text-lg font-black text-accent-text">{conv}%</div><div className="font-bold text-fg">نسبة التحويل (طلبات ÷ زوار)</div></div>
        </div>
        <p className="text-[11px] text-muted leading-relaxed">
          عشان تعرف الحملة الإعلانية جابت كام زائر، حط في لينك الإعلان بتاعك <span className="font-mono bg-surface2 px-1 rounded">?utm_source=facebook</span> (أو instagram / tiktok). الإجمالي من أول ما اتفعّل العدّاد: {totalVisits} زيارة{totalUniq ? ` (${totalUniq} زائر فريد في إجمالي الأيام)` : ''} — العدّاد مفيش له نهاية.
        </p>
      </div>
    );
  
}

export function renderAdminOverview(ctx) {
  const { accountRequests, adminKpis, clients, markLocalUpsert, orders, parts, renderVisitorStats, returnsList, sbUpsert, setAdminTab, setParts, showToast, siteSettings, sourcingRequests } = ctx;
    const individualsCount = clients.filter(c => c.accountType === 'individual').length;
    const shopsCount = clients.length - individualsCount;
    const newOrdersCount = orders.filter(o => o.status === 'تم الاستلام').length;
    const pendingRegCount = accountRequests.filter(r => r.status === 'pending').length;
    const reviewRetCount = returnsList.filter(r => r.status === 'قيد المراجعة' && !r.closed).length;
    const lowStockCount = parts.filter(pt => (Number(pt.stock) || 0) <= (Number(pt.lowStockThreshold) || 5)).length;
    const restockAlertsCount = (() => {
      const wl = Array.isArray(siteSettings.restockWaitlist) ? siteSettings.restockWaitlist : [];
      const entriesByPart = {};
      wl.forEach(w => { const k = String(w.partId || ''); entriesByPart[k] = (entriesByPart[k] || 0) + 1; });
      let total = wl.length;
      parts.forEach(p => {
        const c = Number(p.waitlistCount) || 0;
        const e = entriesByPart[String(p.id)] || 0;
        if (c > e) total += c - e;
      });
      return total;
    })();
    const shortcuts = [
      { tab: 'orders', label: 'طلبات جديدة', n: newOrdersCount, hint: 'محتاجة تجهيز', tone: 'blue' },
      { tab: 'restock_alerts', label: '🔔 نبهني عند التوفر', n: restockAlertsCount, hint: 'عملاء منتظرين منتجات', tone: 'amber' },
      { tab: 'clients', label: 'طلبات فتح حساب', n: pendingRegCount, hint: 'مستنية موافقتك', tone: 'amber' },
      { tab: 'returns', label: 'مرتجعات وضمان', n: reviewRetCount, hint: 'محتاجة مراجعة', tone: 'rose' },
      { tab: 'quick_stock', label: 'نواقص المخزن', n: lowStockCount, hint: 'خلصت أو قربت تخلص', tone: 'violet' },
      { tab: 'sourcing', label: 'طلبات من برّه', n: sourcingRequests.filter(r => r.status === 'جديد' && !r.closed).length, hint: 'مستنية ردك', tone: 'cyan' }
    ];
    const toneCls = {
      blue: 'border-blue-500/40 bg-blue-500/12 text-blue-700 dark:text-blue-300',
      amber: 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300',
      rose: 'border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300',
      violet: 'border-slate-500/40 bg-slate-500/12 text-slate-700 dark:text-slate-300',
      cyan: 'border-slate-500/40 bg-slate-500/12 text-slate-700 dark:text-slate-300'
    };
    const adminKey = (ctx.adminSession && ctx.adminSession.username) || 'owner';
    const quickNavItems = [
      { id: 'overview', label: 'الرئيسية', icon: TrendingUp },
      { id: 'visual_editor', label: 'المحرر المرئي', icon: MousePointerClick },
      { id: 'theme_editor', label: 'الهوية والألوان', icon: Palette },
      { id: 'page_builder', label: 'الصفحات والأقسام', icon: FileText },
      { id: 'site_control', label: 'التحكم الشامل', icon: SlidersHorizontal },
      { id: 'orders', label: 'الطلبات', icon: ClipboardList },
      { id: 'marketplace', label: 'مراجعة الإعلانات', icon: Sparkles },
      { id: 'catalog', label: 'الكتالوج', icon: Layers },
      { id: 'version_history', label: 'سجل الإصدارات', icon: History }
    ];
    return (
    <div className="space-y-5">
      <AdminDashboardCustomizer
        adminKey={adminKey}
        allNavItems={quickNavItems}
        onNavigateTab={(t) => { setAdminTab(t); const el = document.getElementById('elz-admin-main-scroll'); if (el) el.scrollTo({ top: 0, behavior: 'smooth' }); }}
        versionHistory={readVersionHistory(siteSettings)}
        showToast={showToast}
      />
      {/* Executive General Manager Report Banner */}
      <div className="bg-gradient-to-r from-nav via-nav2 to-nav text-white rounded-2xl p-5 border-2 border-amber-400/50 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black">
            <span>📊 جديد للمدير العام</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-[#2997FF]">
            مركز تقارير المدير العام والطباعة (تقرير يومي أو بتحديد التواريخ)
          </h3>
          <p className="text-xs text-slate-300">
            حدّد الفترة الزمنية، اختر الأقسام التي تريدها في التقرير (المبيعات، صافي الربح، طرق الدفع، الأكثر مبيعاً، المديونيات، جرد المخزن، النواقص، الكوبونات)، واطبعه فوراً بصيغة A4 أو صدّره لملف Excel!
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setAdminTab('reports'); window.scrollTo({ top: 0 }); }}
          className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md shrink-0"
        >
          <Printer className="w-4 h-4" />
          <span>فتح وتخصيص وطباعة التقرير الآن ←</span>
        </button>
      </div>

      {renderVisitorStats()}

      {/* Quick Shortcuts */}
      <div>
        <div className="text-sm font-extrabold text-fg mb-2">محتاج اهتمامك دلوقتي</div>
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {shortcuts.map(sc => (
            <button
              key={sc.tab}
              type="button"
              onClick={() => { setAdminTab(sc.tab); window.scrollTo({ top: 0 }); }}
              className={`p-4 rounded-2xl border-2 text-right transition hover:shadow-md ${sc.n > 0 ? toneCls[sc.tone] : 'border-line bg-surface text-muted'}`}
            >
              <div className="text-3xl font-black">{sc.n}</div>
              <div className="text-sm font-extrabold mt-1">{sc.label}</div>
              <div className="text-[11px] font-medium opacity-80">{sc.n > 0 ? sc.hint : 'مفيش حاجة'}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Clients Summary */}
      <div className="bg-surface p-5 rounded-2xl border border-slate-200 shadow-sm ">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-xs text-fg font-semibold flex items-center gap-1.5">
              <Users className="w-4 h-4" /> إجمالي العملاء
            </div>
            <div className="text-3xl font-extrabold text-fg mt-1">{clients.length}</div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center min-w-[220px] flex-1 sm:flex-none">
            <div className="rounded-xl bg-surface2 border border-line p-3">
              <div className="text-2xl font-extrabold text-accent-text">{shopsCount}</div>
              <div className="text-[11px] font-bold text-fg">متاجر ومحلات</div>
            </div>
            <div className="rounded-xl bg-accent/10 border border-accent/30 p-3">
              <div className="text-2xl font-extrabold text-accent-text">{individualsCount}</div>
              <div className="text-[11px] font-bold text-fg">عاديين (أفراد)</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-2xl border border-line shadow-sm">
          <div className="text-xs text-muted font-semibold">إجمالي المبيعات المعتمدة</div>
          <div className="text-2xl font-extrabold text-fg mt-1">
            {adminKpis.totalRevenueBase.toLocaleString()} ج.م
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">
            محولة للعملة الأساسية (EGP)
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-emerald-200 shadow-sm ">
          <div className="text-xs text-accent-text font-semibold">صافي الربح الفعلي (بعد خصم التكلفة)</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            +{adminKpis.netProfitBase.toLocaleString()} ج.م
          </div>
          <div className="text-[11px] text-muted mt-1">
            سعر البيع ناقص سعر التكلفة المخفي
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-line shadow-sm">
          <div className="text-xs text-muted font-semibold">إجمالي مديونيات التجار الآجلة بالسوق</div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            {adminKpis.totalReceivablesBase.toLocaleString()} ج.م
          </div>
          <div className="text-[11px] text-muted mt-1">
            مستحقات آجلة مسجلة في كشوف الحساب
          </div>
        </div>

        <div className="bg-surface p-5 rounded-2xl border border-amber-200 shadow-sm">
          <div className="text-xs text-amber-600 dark:text-amber-300 font-semibold">نواقص المخزن وطلبات الانتظار</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">
            {adminKpis.lowStockParts.length + adminKpis.outOfStockParts.length} أصناف
          </div>
          <div className="text-[11px] text-muted mt-1">
            إجمالي طلبات "أبلغني عند التوفر": <span className="font-bold">{adminKpis.totalWaitlist} محل</span>
          </div>
        </div>
      </div>

      {/* Low Stock & Out-of-Stock Waitlist Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert Table */}
        <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
          <div className="p-4 bg-amber-500/15 border-b border-amber-500/30 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-fg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              تنبيهات نواقص المخزن (وصلت لحد النواقص)
            </h3>
            <button
              onClick={() => setAdminTab('quick_stock')}
              className="text-xs font-bold text-amber-600 dark:text-amber-300 underline"
            >
              تغذية المخزن سريعاً
            </button>
          </div>
          <div className="divide-y divide-line">
            {adminKpis.lowStockParts.map(p => (
              <div key={p.id} className="p-3.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-fg">{p.name}</div>
                  <div className="text-muted">
                    الكود: {p.sku} • حد النواقص التنبيهي: {p.lowStockThreshold}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-300 font-extrabold">
                    متبقي {p.stock} فقط
                  </span>
                  <button
                    onClick={() => {
                      setParts(prev =>
                        prev.map(item => (item.id === p.id ? { ...item, stock: item.stock + 10 } : item))
                      );
                      showToast(`تمت إضافة 10 قطع إلى رصيد "${p.name}" بنجاح!`, 'success');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-nav2 text-white font-bold"
                  >
                    +10 للمخزن
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Out of Stock Waitlist Table */}
        <div className="bg-surface rounded-2xl border border-line shadow-sm overflow-hidden">
          <div className="p-4 bg-rose-500/15 border-b border-rose-500/30 flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-fg flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-600" />
              قائمة الطلبات المنتظرة من المحلات (Out-of-Stock Waitlist)
            </h3>
          </div>
          <div className="divide-y divide-line">
            {adminKpis.outOfStockParts.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted">
                لا توجد أصناف نافذة حالياً!
              </div>
            ) : (
              adminKpis.outOfStockParts.map(p => (
                <div key={p.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-fg">{p.name}</div>
                    <div className="text-rose-600 font-bold mt-0.5">
                      عدد المحلات المنتظرة للصنف: {p.waitlistCount} محل تجاري
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setParts(prev =>
                        prev.map(item => {
                          if (item.id !== p.id) return item;
                          const up = { ...item, stock: 15, soldOut: false };
                          markLocalUpsert('parts', up);
                          sbUpsert('spare_parts', up);
                          return up;
                        })
                      );
                      showToast(`تم تزويد مخزون "${p.name}" إلى 15 قطعة ✓ — ابعت للمحلات المنتظرة من صفحة «نبّهني عند التوفر».`, 'success');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold"
                  >
                    توفير 15 قطعة
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
}

export function renderAdminOrders(ctx) {
  const { adminAddPartId, adminOrderSearch, adminOrderSort, adminOrderStatusFilter, askConfirmDelete, clients, editingOrder, filteredAdminOrders, handleSaveLiveInvoiceEdit, handleUpdateOrderStatus, invoicePartSearchQuery, parts, sbDelete, setAdminAddPartId, setAdminOrderSearch, setAdminOrderSort, setAdminOrderStatusFilter, setEditingOrder, setInvoicePartSearchQuery, setOrders, setPrintModalOrder, showToast, siteSettings } = ctx;
  return (<div className="space-y-5">
      <div className="bg-surface rounded-2xl p-4 border border-line space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-fg">
              إدارة الطلبات ومحرر الفواتير اللحظي (Live Invoice Editor)
            </h2>
            <p className="text-xs text-muted">
              عدّل أسعار أو كميات أي فاتورة نشطة وسيقوم النظام تلقائياً بتحديث المخزون وكشف حساب التاجر ومزامنة شاشة العميل
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-surface2 text-fg text-xs font-extrabold">
            إجمالي الفواتير المعروضة: {filteredAdminOrders.length}
          </span>
        </div>

        {/* Orders Filter & Sort Bar */}
        <div className="pt-3 border-t border-line flex flex-wrap items-center gap-2.5 text-xs">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={adminOrderSearch}
              onChange={e => setAdminOrderSearch(e.target.value)}
              placeholder="بحث برقم الفاتورة، اسم المحل/التاجر، العنوان، أو التاريخ..."
              className="w-full pe-9 ps-3 py-2 rounded-xl border border-line"
            />
          </div>

          <select
            value={adminOrderStatusFilter}
            onChange={e => setAdminOrderStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-line bg-surface2 font-bold"
          >
            <option value="ALL">حالة الطلب: جميع الحالات</option>
            {ORDER_STATUSES.map(st => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>

          <select
            value={adminOrderSort}
            onChange={e => setAdminOrderSort(e.target.value)}
            className="px-3 py-2 rounded-xl border border-line bg-surface2 font-bold"
          >
            <option value="date_desc">الترتيب بالتاريخ: الأحدث أولاً</option>
            <option value="date_asc">الترتيب بالتاريخ: الأقدم أولاً</option>
            <option value="total_desc">الترتيب بالقيمة: الأعلى سعراً</option>
            <option value="total_asc">الترتيب بالقيمة: الأقل سعراً</option>
            <option value="qty_desc">الترتيب بالعدد: الأكثر قطعاً</option>
            <option value="name_asc">الترتيب باسم التاجر (أ - ي)</option>
          </select>
        </div>
      </div>

      {/* Active Live Invoice Editor Panel */}
      {editingOrder && (
        <div className="bg-surface2 border-2 border-amber-500 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200 pb-3">
            <div>
              <span className="px-2.5 py-1 rounded bg-amber-500 text-fg font-extrabold text-xs">
                وضع التعديل اللحظي للفاتورة: {editingOrder.id}
              </span>
              <span className="me-3 text-sm font-extrabold text-fg">
                العميل: {editingOrder.clientName}
              </span>
            </div>
            <button
              onClick={() => setEditingOrder(null)}
              className="px-3 py-1 rounded-lg bg-surface text-muted text-xs font-bold border border-line"
            >
              إلغاء التعديل
            </button>
          </div>

          <div className="bg-surface rounded-xl p-4 border border-amber-200 overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="text-muted border-b border-line">
                  <th className="pb-2">الصنف</th>
                  <th className="pb-2">سعر التكلفة (للمرجع)</th>
                  <th className="pb-2">سعر البيع للوحدة (ج.م)</th>
                  <th className="pb-2">الكمية</th>
                  <th className="pb-2">إجمالي السطر</th>
                  <th className="pb-2">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {editingOrder.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 font-bold text-fg">{item.name}</td>
                    <td className="py-2.5 text-muted font-mono">{item.costPriceBase} ج.م</td>
                    <td className="py-2.5">
                      <input
                        type="number"
                        value={item.unitPriceBase}
                        onChange={e => {
                          const raw = e.target.value;
                          setEditingOrder(prev => {
                            const nextItems = [...prev.items];
                            nextItems[idx] = { ...nextItems[idx], unitPriceBase: raw === '' ? '' : Number(raw) };
                            return { ...prev, items: nextItems };
                          });
                        }}
                        onBlur={e => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setEditingOrder(prev => {
                            const nextItems = [...prev.items];
                            nextItems[idx] = { ...nextItems[idx], unitPriceBase: val };
                            return { ...prev, items: nextItems };
                          });
                        }}
                        className="w-28 px-2.5 py-1.5 rounded-lg border border-line font-bold"
                      />
                    </td>
                    <td className="py-2.5">
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={e => {
                          const raw = e.target.value;
                          setEditingOrder(prev => {
                            const nextItems = [...prev.items];
                            nextItems[idx] = { ...nextItems[idx], qty: raw === '' ? '' : Number(raw) };
                            return { ...prev, items: nextItems };
                          });
                        }}
                        onBlur={e => {
                          const val = Math.max(1, Number(e.target.value) || 1);
                          setEditingOrder(prev => {
                            const nextItems = [...prev.items];
                            nextItems[idx] = { ...nextItems[idx], qty: val };
                            return { ...prev, items: nextItems };
                          });
                        }}
                        className="w-20 px-2.5 py-1.5 rounded-lg border border-line font-bold"
                      />
                    </td>
                    <td className="py-2.5 font-extrabold text-fg">
                      {(item.qty * item.unitPriceBase).toLocaleString()} ج.م
                    </td>
                    <td className="py-2.5">
                      <button
                        onClick={() => {
                          setEditingOrder(prev => ({
                            ...prev,
                            items: prev.items.filter((_, i) => i !== idx)
                          }));
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/15 text-rose-500 hover:bg-rose-500/25"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Searchable Add Another Item to Invoice (Built for 3,000+ Parts!) */}
            <div className="mt-4 pt-3 border-t border-line space-y-2">
              <div className="text-xs font-extrabold text-fg flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-blue-600" />
                إدراج صنف في الفاتورة (ابحث بالاسم أو الكود SKU أو الموديل لتصفية القائمة فوراً):
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={invoicePartSearchQuery}
                  onChange={e => {
                    const q = e.target.value;
                    setInvoicePartSearchQuery(q);
                    const matches = parts.filter(p =>
                      `${p.name} ${p.sku} ${p.category} ${p.searchAliases || ''}`
                        .toLowerCase()
                        .includes(q.trim().toLowerCase())
                    );
                    setAdminAddPartId(matches.length > 0 ? matches[0].id : '');
                  }}
                  placeholder="ابحث هنا لتصفية الأصناف (مثال: شاشة 15 أو S24 أو بطارية)..."
                  className="w-64 px-3 py-2 rounded-xl border border-line bg-bg text-fg text-xs font-bold"
                />

                <select
                  value={adminAddPartId}
                  onChange={e => setAdminAddPartId(e.target.value)}
                  className="flex-1 min-w-[240px] p-2 rounded-xl border border-line text-xs font-bold bg-surface"
                >
                  {parts
                    .filter(p =>
                      !invoicePartSearchQuery.trim() ||
                      `${p.name} ${p.sku} ${p.category} ${p.searchAliases || ''}`
                        .toLowerCase()
                        .includes(invoicePartSearchQuery.trim().toLowerCase())
                    )
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.sku}] {p.name} — (المتاح: {p.stock} • السعر: {p.basePrice} ج.م)
                      </option>
                    ))}
                </select>

                <button
                  type="button"
                  disabled={!adminAddPartId}
                  onClick={() => {
                    const p = parts.find(x => x.id === adminAddPartId);
                    if (!p) return;
                    setEditingOrder(prev => {
                      const exists = (prev.items || []).some(i => i.partId === p.id);
                      return {
                        ...prev,
                        items: exists
                          ? prev.items.map(i => (i.partId === p.id ? { ...i, qty: (Number(i.qty) || 0) + 1 } : i))
                          : [
                              ...prev.items,
                              {
                                partId: p.id,
                                sku: p.sku,
                                name: p.name,
                                qualityGrade: p.qualityGrade,
                                color: (p.colors && p.colors[0]) || 'قياسي',
                                qty: 1,
                                costPriceBase: p.costPrice || 0,
                                unitPriceBase: p.basePrice
                              }
                            ]
                      };
                    });
                    showToast(`تم إدراج "${p.name}" في الفاتورة!`, 'info');
                  }}
                  className="px-4 py-2 rounded-xl bg-nav2 hover:bg-nav2 text-white text-xs font-extrabold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  + إدراج الصنف في الفاتورة
                </button>
              </div>
            </div>
          </div>

          <div className="bg-surface rounded-xl p-4 border border-amber-200 space-y-3">
            <div className="text-xs font-extrabold text-fg">
              خيارات التحكم في المحفظة والإشعارات عند حفظ تعديل الفاتورة (تحت سيطرتك بالكامل):
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-bold text-fg">
              <label className="flex items-start gap-2 p-2.5 rounded-xl bg-surface2 border border-line cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingOrder.manualRefundToWallet || false}
                  onChange={e => setEditingOrder(prev => ({ ...prev, manualRefundToWallet: e.target.checked }))}
                  className="w-4 h-4 mt-0.5 accent-emerald-600 rounded"
                />
                <div>
                  <div className="text-fg font-extrabold">ترحيل الفارق المالي للمحفظة</div>
                  <div className="text-[10px] text-muted font-normal">اتركه غير مفعل لأن العميل يدفع كاش ولم يدفع بعد</div>
                </div>
              </label>

              <label className="flex items-start gap-2 p-2.5 rounded-xl bg-surface2 border border-line cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingOrder.sendClientNotif || false}
                  onChange={e => setEditingOrder(prev => ({ ...prev, sendClientNotif: e.target.checked }))}
                  className="w-4 h-4 mt-0.5 accent-blue-600 rounded"
                />
                <div>
                  <div className="text-fg font-extrabold">إرسال إشعار جرس للعميل</div>
                  <div className="text-[10px] text-muted font-normal">لا يرسل أي إشعار للعميل إلا إذا فعلت هذا الخيار</div>
                </div>
              </label>

              <label className="flex items-start gap-2 p-2.5 rounded-xl bg-surface2 border border-line cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingOrder.showClientBanner || false}
                  onChange={e => setEditingOrder(prev => ({ ...prev, showClientBanner: e.target.checked }))}
                  className="w-4 h-4 mt-0.5 accent-amber-600 rounded"
                />
                <div>
                  <div className="text-fg font-extrabold">إظهار ملاحظة التعديل في فاتورة العميل</div>
                  <div className="text-[10px] text-muted font-normal">إظهار النص الذي تكتبه بالأسفل داخل صفحة طلبات العميل</div>
                </div>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <input
                type="text"
                value={editingOrder.adminEditNote || ''}
                onChange={e => setEditingOrder(prev => ({ ...prev, adminEditNote: e.target.value }))}
                placeholder="اكتب ملاحظة اختيارية للعميل (لن تظهر للعميل إلا إذا قمت بتفعيل خيار الإظهار أو الإشعار أعلاه)..."
                className="flex-1 min-w-[240px] px-3.5 py-2.5 rounded-xl border border-line bg-surface2 text-xs font-bold"
              />
              <button
                type="button"
                onClick={() => handleSaveLiveInvoiceEdit(true)}
                className="px-6 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-extrabold flex items-center gap-2 shadow-md transition"
              >
                <Save className="w-4 h-4" />
                حفظ الفاتورة الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="space-y-4">
        {filteredAdminOrders.map(order => {
          const totalRev =
            order.items.reduce((s, i) => s + i.qty * i.unitPriceBase, 0) +
            order.deliveryFeeBase -
            order.discountBase;
          const totalCost = order.items.reduce((s, i) => s + i.qty * i.costPriceBase, 0);
          const orderProfit = totalRev - totalCost;
          const totalPieces = order.items.reduce((s, i) => s + i.qty, 0);

          return (
            <div key={order.id} className="bg-surface rounded-2xl border border-line p-4 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-nav2 text-white font-mono font-extrabold text-xs">
                    {order.id}
                  </span>
                  <div>
                    <div className="text-sm font-extrabold text-fg">{order.clientName}</div>
                    <div className="text-xs text-muted flex flex-wrap items-center gap-2">
                      <span>{order.createdAt} • إجمالي القطع: <b>{totalPieces}</b> • الدفع: {order.paymentMethod} • {order.address}</span>
                      {Number(order.cashbackAmountBase) > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 font-black text-[10px]">
                          💰 أُضيف كاش باك للمحفظة: +{order.cashbackAmountBase} ج.م ✓
                        </span>
                      )}
                      {Number(order.expectedCashbackBase) > 0 && !order.cashbackAwarded && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 font-black text-[10px]">
                          ⏳ كاش باك منتظر عند التسليم: +{order.expectedCashbackBase} ج.م
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Switcher & Dual Print Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={order.status}
                    onChange={e => handleUpdateOrderStatus(order.id, e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-line bg-surface2 text-xs font-extrabold text-fg"
                  >
                    {ORDER_STATUSES.map(st => (
                      <option key={st} value={st}>
                        الحالة: {st}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => setEditingOrder(JSON.parse(JSON.stringify(order)))}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-fg text-xs font-extrabold flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    تعديل الفاتورة لحظياً
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const cliObj = clients.find(c => String(c.id) === String(order.clientId));
                      const rawPhone = normalizeDigits(order.clientPhone || cliObj?.phone || '').replace(/[^0-9]/g, '');
                      const intlPhone = rawPhone.startsWith('0') ? `2${rawPhone}` : rawPhone;
                      const msg = `مرحباً *${order.clientName}* 👋\nبخصوص فاتورتك رقم *#${order.id}* من متجر *${siteSettings.storeName || 'ELZOGHBI'}*:\n📌 الحالة الحالية: *${order.status}*\n📦 عدد القطع: ${totalPieces} قطعة\n💰 الإجمالي: *${totalRev.toLocaleString()} ج.م* (${order.paymentMethod})\nشكراً لثقتك بنا! 🌟`;
                      window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1 shadow-xs transition"
                    title="إرسال تفاصيل وحالة الفاتورة للعميل على واتساب بضغطة زر"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>واتساب العميل</span>
                  </button>

                  <button
                    onClick={() => setPrintModalOrder({ order, mode: 'invoice' })}
                    className="px-3 py-1.5 rounded-xl bg-surface2 hover:bg-surface2 text-fg text-xs font-bold flex items-center gap-1"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    فاتورة مالية
                  </button>

                  <button
                    onClick={() => setPrintModalOrder({ order, mode: 'picking' })}
                    className="px-3 py-1.5 rounded-xl bg-surface2 hover:border-accent text-fg text-xs font-bold flex items-center gap-1"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    إذن تحضير مخزني (بدون أسعار)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      askConfirmDelete(
                        'حذف الطلب نهائياً من السيستم',
                        `هل أنت متأكد من حذف الطلب رقم #${order.id} للعميل "${order.clientName}" بشكل نهائي؟`,
                        () => {
                          // Deleting a live order must first run the exact
                          // cancellation reversal (restore stock + refund
                          // wallet) so inventory and balances stay correct.
                          if (order.status !== 'ملغي') {
                            handleUpdateOrderStatus(order.id, 'ملغي');
                          }
                          setOrders(prev => prev.filter(o => o.id !== order.id));
                          sbDelete('orders', order.id);
                          showToast(`تم حذف الطلب #${order.id} نهائياً بنجاح.`, 'info');
                        }
                      );
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-1 border border-rose-200 transition"
                    title="حذف الطلب بشكل نهائي"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف الطلب</span>
                  </button>
                </div>
              </div>

              {/* Order Items & Profit Pill */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap gap-2">
                  {order.items.map((item, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-surface2 text-fg font-medium"
                    >
                      {item.name} × <b>{item.qty}</b> ({item.unitPriceBase} ج.م)
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-accent/15 text-accent-text font-extrabold border border-accent/30">
                    صافي ربح الفاتورة: +{orderProfit.toLocaleString()} ج.م
                  </span>
                  <span className="text-sm font-extrabold text-fg">
                    الإجمالي: {totalRev.toLocaleString()} ج.م
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>);
}

// ============================================================
// Team & Permissions (RBAC) — owner-only management UI.
// Employee accounts live server-side in public.admin_users and are
// managed exclusively through owner-gated RPCs (see sql/04).
// ============================================================
const TEAM_PERMISSION_GROUPS = [
  { title: 'الملخص والتقارير', tabs: [['overview', 'الرئيسية والملخص'], ['bi_analytics', 'تحليلات الأعمال (BI)'], ['reports', 'تقارير المدير العام']] },
  { title: 'المبيعات والطلبات', tabs: [['orders', 'الطلبات والفواتير'], ['order_workflow', 'سير عمل الطلبات (Kanban)'], ['sourcing', 'طلبات الاستيراد (من برّه)'], ['returns', 'المرتجعات والشكاوى']] },
  { title: 'المنتجات والمخازن', tabs: [['catalog', 'الكتالوج والموديلات'], ['excel_products', 'جدول المنتجات (Excel)'], ['smart_pricing', 'محرك التسعير الذكي (AI)'], ['ai_product_sourcing', 'وكيل الاستيراد الذكي (AI)'], ['bulk_importer', 'المستورد الذكي بالروابط'], ['quality_images', 'جودة الكتالوج والصور'], ['quick_stock', 'الجرد السريع للمخزن'], ['restock_alerts', 'قائمة الانتظار (نبّهني)']] },
  { title: 'تصميم المتجر والتسويق', tabs: [['visual_editor', 'المحرر المرئي للموقع'], ['theme_editor', 'محرر الهوية والألوان'], ['page_builder', 'منشئ الصفحات والأقسام'], ['site_control', 'التحكم الشامل في الموقع (Site Control)'], ['storefront_cms', 'استوديو الواجهة والإعلانات'], ['feature_flags', 'محرك المبيعات والولاء'], ['marketplace', 'إعلانات بيع الموبايلات (بيع عندنا)'], ['promos', 'الكوبونات وحماية الربح'], ['karambo', 'كرومبو الشغلانة']] },
  { title: 'العملاء والإعدادات', tabs: [['clients', 'العملاء والحسابات'], ['groups', 'شرائح الأسعار والشحن'], ['site_settings', 'إعدادات المتجر والدفع'], ['version_history', 'سجل الإصدارات والنسخ'], ['schema', 'قاعدة البيانات السحابية']] }
];
const TEAM_ALL_TABS = TEAM_PERMISSION_GROUPS.flatMap(g => g.tabs.map(t => t[0]));
const TEAM_TAB_LABELS = Object.fromEntries(TEAM_PERMISSION_GROUPS.flatMap(g => g.tabs));
const TEAM_ROLE_PRESETS = [
  { id: 'sales', label: 'مسؤول مبيعات وطلبات', permissions: ['overview', 'orders', 'order_workflow', 'returns', 'clients'] },
  { id: 'stock', label: 'مسؤول مخزن وكتالوج', permissions: ['catalog', 'excel_products', 'quick_stock', 'quality_images', 'restock_alerts', 'bulk_importer'] },
  { id: 'accountant', label: 'محاسب — تقارير ومبيعات', permissions: ['overview', 'bi_analytics', 'reports'] },
  { id: 'support', label: 'دعم ومتابعة عملاء', permissions: ['orders', 'returns', 'sourcing', 'clients'] },
  { id: 'marketing', label: 'تسويق وواجهة المتجر', permissions: ['overview', 'storefront_cms', 'promos', 'feature_flags', 'karambo'] },
  { id: 'full', label: 'كل الأقسام (صلاحيات كاملة)', permissions: TEAM_ALL_TABS }
];

export function renderAdminTeam(ctx) {
  const { teamUsers, teamLoading, teamForm, setTeamForm, teamDeleteId, setTeamDeleteId, loadTeamUsers, saveTeamUser, deleteTeamUser, toggleTeamUserActive } = ctx;
  const blankForm = { id: '', username: '', displayName: '', roleLabel: '', permissions: [], isActive: true, newPassword: '' };
  const togglePerm = (tabId) => {
    const cur = Array.isArray(teamForm.permissions) ? teamForm.permissions : [];
    setTeamForm({ ...teamForm, permissions: cur.includes(tabId) ? cur.filter(t => t !== tabId) : [...cur, tabId] });
  };
  const toggleGroup = (grp) => {
    const ids = grp.tabs.map(t => t[0]);
    const cur = Array.isArray(teamForm.permissions) ? teamForm.permissions : [];
    const allOn = ids.every(id => cur.includes(id));
    setTeamForm({ ...teamForm, permissions: allOn ? cur.filter(t => !ids.includes(t)) : Array.from(new Set([...cur, ...ids])) });
  };
  const fmtDate = (iso) => {
    if (!iso) return 'لسه مدخلش';
    try { return new Date(iso).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return String(iso); }
  };
  const inputCls = 'w-full p-2.5 rounded-xl border border-line bg-surface text-fg text-xs font-bold';

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-line rounded-3xl p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-black text-fg flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" />
            فريق العمل والصلاحيات
          </h2>
          <p className="text-[11px] text-muted mt-1">اعمل حساب دخول لكل موظف وحدد بنفسك الأقسام اللي يقدر يشوفها ويشتغل عليها في الداشبورد. حسابك انت (المالك) صلاحياته كاملة دايمًا وبرّه النظام ده.</p>
        </div>
        {!teamForm && (
          <button
            type="button"
            onClick={() => setTeamForm(blankForm)}
            className="px-4 py-2.5 rounded-xl bg-slate-600 hover:bg-slate-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            إضافة موظف
          </button>
        )}
      </div>

      <AdminAdvancedRolesStudio
        siteSettings={ctx.siteSettings}
        setSiteSettings={ctx.setSiteSettings}
        saveSiteSettingsImmediate={ctx.saveSiteSettingsImmediate}
        showToast={ctx.showToast}
        onApplyRoleToEmployeeForm={(role) => setTeamForm({
          ...blankForm,
          roleLabel: role.nameAr,
          permissions: role.pages.includes('*') ? [...TEAM_ALL_TABS] : [...role.pages]
        })}
      />
      <div className="bg-slate-500/10 border border-slate-500/25 rounded-2xl px-4 py-3 text-[11px] text-fg flex items-start gap-2">
        <Shield className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <span>كلمات مرور الموظفين بتتخزن <b>مشفرة</b> ومحدش يقدر يشوفها — ولا حتى انت. لو موظف نسي كلمته، غيّرهاله من «تعديل». وكلمات مرور <b>العملاء</b> بتفضل ظاهرة ليك انت بس زي ما هي، لأن إدارة الفريق مقفولة ببيانات المالك.</span>
      </div>

      {teamForm ? (
        <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
          <h3 className="text-sm font-black text-fg">{teamForm.id ? 'تعديل موظف' : 'موظف جديد'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-muted">الاسم الظاهر (مثال: أحمد — المبيعات)</label>
              <input value={teamForm.displayName} onChange={e => setTeamForm({ ...teamForm, displayName: e.target.value })} className={inputCls} placeholder="اسم الموظف" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-muted">اسم الدخول (إنجليزي — بيستخدمه في تسجيل الدخول)</label>
              <input value={teamForm.username} onChange={e => setTeamForm({ ...teamForm, username: e.target.value })} className={inputCls} placeholder="ahmed.sales" dir="ltr" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-muted">{teamForm.id ? 'كلمة مرور جديدة (سيبها فاضية لو مش هتغيّرها)' : 'كلمة المرور'}</label>
              <input type="text" value={teamForm.newPassword} onChange={e => setTeamForm({ ...teamForm, newPassword: e.target.value })} className={inputCls} placeholder={teamForm.id ? '•••••• (بدون تغيير)' : 'كلمة مرور قوية'} dir="ltr" autoComplete="off" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-muted">قالب جاهز (بيملأ الصلاحيات — وتقدر تعدّلها بعدها)</label>
              <select
                value=""
                onChange={e => {
                  const preset = TEAM_ROLE_PRESETS.find(r => r.id === e.target.value);
                  if (preset) setTeamForm({ ...teamForm, roleLabel: preset.label, permissions: [...preset.permissions] });
                }}
                className={inputCls}
              >
                <option value="">— اختار قالب أو حدّد يدوي —</option>
                {TEAM_ROLE_PRESETS.map(r => (<option key={r.id} value={r.id}>{r.label}</option>))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-extrabold text-muted">المسمى الوظيفي (بيظهر جنب اسمه)</label>
              <input value={teamForm.roleLabel} onChange={e => setTeamForm({ ...teamForm, roleLabel: e.target.value })} className={inputCls} placeholder="مسؤول مبيعات" />
            </div>
            <label className="flex items-center gap-2 text-xs font-extrabold text-fg cursor-pointer self-end pb-2">
              <input type="checkbox" checked={teamForm.isActive !== false} onChange={e => setTeamForm({ ...teamForm, isActive: e.target.checked })} className="w-4 h-4 accent-emerald-600" />
              الحساب نشط (يقدر يدخل)
            </label>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-extrabold text-muted">الصلاحيات — الأقسام اللي هيشوفها في القائمة الجانبية ({(teamForm.permissions || []).length} من {TEAM_ALL_TABS.length}):</p>
            {TEAM_PERMISSION_GROUPS.map(grp => {
              const ids = grp.tabs.map(t => t[0]);
              const cur = Array.isArray(teamForm.permissions) ? teamForm.permissions : [];
              const allOn = ids.every(id => cur.includes(id));
              return (
                <div key={grp.title} className="border border-line rounded-2xl p-3 bg-surface2/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-fg">{grp.title}</span>
                    <button type="button" onClick={() => toggleGroup(grp)} className="text-[10.5px] font-extrabold text-slate-500 hover:text-slate-400">
                      {allOn ? 'إلغاء الكل' : 'تحديد الكل'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
                    {grp.tabs.map(([tabId, label]) => (
                      <label key={tabId} className={"flex items-center gap-2 px-2.5 py-2 rounded-xl border text-[11px] font-bold cursor-pointer transition " + (cur.includes(tabId) ? 'border-slate-500/60 bg-slate-500/10 text-fg' : 'border-line bg-surface text-muted')}>
                        <input type="checkbox" checked={cur.includes(tabId)} onChange={() => togglePerm(tabId)} className="w-3.5 h-3.5 accent-slate-600" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button type="button" disabled={teamLoading} onClick={saveTeamUser} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 transition">
              <Save className="w-4 h-4" />
              {teamLoading ? 'بيحفظ...' : 'حفظ'}
            </button>
            <button type="button" onClick={() => setTeamForm(null)} className="px-4 py-2.5 rounded-xl bg-surface2 border border-line text-fg text-xs font-extrabold flex items-center gap-1.5">
              <X className="w-4 h-4" />
              إلغاء
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {teamLoading && teamUsers.length === 0 && (
            <div className="bg-surface border border-line rounded-3xl p-8 text-center text-xs text-muted font-bold">بيحمّل فريق العمل...</div>
          )}
          {!teamLoading && teamUsers.length === 0 && (
            <div className="bg-surface border border-line rounded-3xl p-8 text-center space-y-2">
              <Users className="w-8 h-8 mx-auto text-muted" />
              <p className="text-xs font-bold text-muted">لسه مفيش حسابات موظفين. اعمل أول حساب من زرار «إضافة موظف».</p>
              <p className="text-[10.5px] text-muted">لو القائمة دي فضلت فاضية بعد ما تضيف، اتأكد إن خطوة SQL رقم 04 اتنفذت في Supabase.</p>
            </div>
          )}
          {teamUsers.map(user => {
            const perms = Array.isArray(user.permissions) ? user.permissions : [];
            return (
              <div key={user.id} className="bg-surface border border-line rounded-3xl p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-600/15 border border-slate-500/30 flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-fg">{user.display_name || user.username}</p>
                      <p className="text-[10.5px] text-muted" dir="ltr">@{user.username}{user.role_label ? ` · ${user.role_label}` : ''}</p>
                    </div>
                  </div>
                  <span className={"text-[10px] px-2 py-1 rounded-full font-black " + (user.is_active ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-500')}>
                    {user.is_active ? 'نشط' : 'موقوف'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {perms.slice(0, 8).map(tabId => (
                    <span key={tabId} className="text-[10px] px-2 py-0.5 rounded-full bg-surface2 border border-line text-muted font-bold">{TEAM_TAB_LABELS[tabId] || tabId}</span>
                  ))}
                  {perms.length > 8 && (<span className="text-[10px] px-2 py-0.5 rounded-full bg-surface2 border border-line text-muted font-bold">+{perms.length - 8} قسم</span>)}
                  {perms.length === 0 && (<span className="text-[10px] text-rose-500 font-bold">من غير أي صلاحيات — مش هيشوف حاجة</span>)}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-line">
                  <span className="text-[10.5px] text-muted">آخر دخول: {fmtDate(user.last_login_at)}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTeamForm({ id: user.id, username: user.username, displayName: user.display_name || '', roleLabel: user.role_label || '', permissions: [...perms], isActive: user.is_active !== false, newPassword: '' })}
                      className="px-3 py-1.5 rounded-lg bg-surface2 border border-line text-fg text-[10.5px] font-extrabold"
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      disabled={teamLoading}
                      onClick={() => toggleTeamUserActive(user)}
                      className={"px-3 py-1.5 rounded-lg border text-[10.5px] font-extrabold disabled:opacity-50 " + (user.is_active ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500')}
                    >
                      {user.is_active ? 'إيقاف' : 'تفعيل'}
                    </button>
                    {teamDeleteId === user.id ? (
                      <button
                        type="button"
                        disabled={teamLoading}
                        onClick={() => deleteTeamUser(user.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-[10.5px] font-extrabold disabled:opacity-50 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        أكّد الحذف
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setTeamDeleteId(user.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[10.5px] font-extrabold"
                      >
                        حذف
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {teamUsers.length > 0 && (
            <button type="button" onClick={loadTeamUsers} className="text-[11px] font-extrabold text-slate-500 hover:text-slate-400 flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" />
              تحديث القائمة
            </button>
          )}
        </div>
      )}
    </div>
  );
}
