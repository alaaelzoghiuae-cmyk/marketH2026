import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Palette, Layers,
  Megaphone, BarChart3, Settings, ShieldCheck, History, Search, Sparkles, Tag
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const ADMIN_QUICK_LINKS = [
  { id: 'overview', label: 'الرئيسية والملخص', group: 'نظرة عامة', icon: LayoutDashboard, keywords: 'dashboard home overview رئيسية ملخص' },
  { id: 'orders', label: 'الطلبات والفواتير', group: 'المبيعات', icon: ShoppingCart, keywords: 'orders invoices طلبات فواتير' },
  { id: 'order_workflow', label: 'سير عمل الطلبات (Kanban)', group: 'المبيعات', icon: ShoppingCart, keywords: 'kanban workflow سير عمل' },
  { id: 'catalog', label: 'الكتالوج والموديلات', group: 'المنتجات', icon: Package, keywords: 'catalog products models منتجات كتالوج' },
  { id: 'excel_products', label: 'جدول المنتجات (Excel)', group: 'المنتجات', icon: Package, keywords: 'excel import export اكسل' },
  { id: 'quick_stock', label: 'الجرد السريع للمخزن', group: 'المنتجات', icon: Package, keywords: 'stock inventory مخزن جرد' },
  { id: 'visual_editor', label: 'المحرر المرئي للموقع', group: 'نظام التحكم', icon: Sparkles, keywords: 'visual editor محرر مرئي' },
  { id: 'theme_editor', label: 'محرر الهوية والألوان', group: 'نظام التحكم', icon: Palette, keywords: 'theme colors fonts الوان خطوط مظهر' },
  { id: 'page_builder', label: 'منشئ الصفحات والأقسام', group: 'نظام التحكم', icon: Layers, keywords: 'sections pages اقسام صفحات' },
  { id: 'storefront_cms', label: 'استوديو الواجهة والإعلانات', group: 'نظام التحكم', icon: Megaphone, keywords: 'cms ads banners اعلانات واجهة' },
  { id: 'promos', label: 'الكوبونات وحماية الربح', group: 'التسويق', icon: Tag, keywords: 'promos coupons كوبونات خصم' },
  { id: 'clients', label: 'العملاء والحسابات', group: 'العملاء', icon: Users, keywords: 'clients users عملاء حسابات' },
  { id: 'groups', label: 'شرائح الأسعار والشحن', group: 'العملاء', icon: Users, keywords: 'pricing groups شرائح اسعار شحن' },
  { id: 'reports', label: 'تقارير المدير العام', group: 'التقارير', icon: BarChart3, keywords: 'reports analytics تقارير' },
  { id: 'site_settings', label: 'إعدادات المتجر والدفع', group: 'الإعدادات', icon: Settings, keywords: 'settings config اعدادات متجر' },
  { id: 'version_history', label: 'سجل الإصدارات والنسخ (Rollback)', group: 'الإعدادات', icon: History, keywords: 'versions rollback نسخ سجل' },
  { id: 'team', label: 'فريق العمل والصلاحيات', group: 'الإعدادات', icon: ShieldCheck, keywords: 'team rbac فريق صلاحيات' },
];

/**
 * Glassy Apple-style Command Palette (Ctrl/Cmd + K) for instant navigation across Admin screens.
 */
export function AdminCommandPalette({ setAdminTab, currentTab }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? ADMIN_QUICK_LINKS.filter(
        (item) =>
          item.label.toLowerCase().includes(q) ||
          item.group.toLowerCase().includes(q) ||
          item.keywords.toLowerCase().includes(q)
      )
    : ADMIN_QUICK_LINKS;

  const dir = typeof document !== 'undefined' ? document.documentElement.dir || 'rtl' : 'rtl';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="التنقل السريع (Ctrl+K)"
        className="fixed bottom-5 end-5 z-50 inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-full bg-surface/85 backdrop-blur-xl border border-line shadow-tok-2 text-xs font-semibold text-fg hover:border-accent transition"
      >
        <Search className="w-4 h-4 text-accent" />
        <span className="hidden sm:inline">تنقل سريع</span>
        <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-surface2 text-muted font-mono">⌘K</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent dir={dir} className="max-w-lg p-0 overflow-hidden rounded-[22px] bg-surface/95 backdrop-blur-2xl border border-line">
          <DialogHeader className="px-4 pt-4 pb-2 border-b border-line">
            <DialogTitle className="sr-only">التنقل السريع في لوحة التحكم</DialogTitle>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted shrink-0" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن شاشة في لوحة التحكم (الطلبات، المظهر، المنتجات...)"
                className="border-0 shadow-none focus-visible:ring-0 bg-transparent text-sm"
              />
            </div>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted">لا توجد شاشة مطابقة للبحث</div>
            ) : (
              filtered.map((item) => {
                const Icon = item.icon;
                const active = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (typeof setAdminTab === 'function') setAdminTab(item.id);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-start transition min-h-[44px] ${
                      active
                        ? 'bg-accent/10 text-accent font-bold'
                        : 'hover:bg-surface2 text-fg font-medium'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 text-sm">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    <span className="text-[11px] text-muted">{item.group}</span>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
