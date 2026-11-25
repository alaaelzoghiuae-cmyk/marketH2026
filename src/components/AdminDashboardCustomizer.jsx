import React, { useState } from 'react';
import { SlidersHorizontal, Eye, EyeOff, ArrowUp, ArrowDown, Star, Clock, Sparkles, X, RotateCcw } from 'lucide-react';
import { DEFAULT_ADMIN_WIDGETS, loadAdminUiPrefs, saveAdminUiPrefs } from '../lib/adminControlCenter.js';

export default function AdminDashboardCustomizer({
  adminKey,
  allNavItems = [],
  onNavigateTab,
  versionHistory = [],
  showToast
}) {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(() => loadAdminUiPrefs(adminKey));

  const persist = (next) => {
    setPrefs(next);
    saveAdminUiPrefs(adminKey, next);
  };

  const toggleWidget = (id) => {
    const hidden = Array.isArray(prefs.hiddenWidgets) ? prefs.hiddenWidgets : [];
    const nextHidden = hidden.includes(id) ? hidden.filter((x) => x !== id) : [...hidden, id];
    persist({ ...prefs, hiddenWidgets: nextHidden });
  };

  const moveWidget = (idx, dir) => {
    const order = Array.isArray(prefs.widgetOrder) && prefs.widgetOrder.length > 0
      ? [...prefs.widgetOrder]
      : DEFAULT_ADMIN_WIDGETS.map((w) => w.id);
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= order.length) return;
    const [item] = order.splice(idx, 1);
    order.splice(nextIdx, 0, item);
    persist({ ...prefs, widgetOrder: order });
  };

  const toggleFavorite = (tabId) => {
    const favs = Array.isArray(prefs.favoritePages) ? prefs.favoritePages : [];
    const nextFavs = favs.includes(tabId) ? favs.filter((x) => x !== tabId) : [...favs, tabId];
    persist({ ...prefs, favoritePages: nextFavs });
  };

  const resetPrefs = () => {
    const defaults = {
      widgetOrder: DEFAULT_ADMIN_WIDGETS.map((w) => w.id),
      hiddenWidgets: [],
      favoritePages: ['overview', 'visual_editor', 'theme_editor', 'orders', 'marketplace'],
      recentlyEdited: [],
      tableDensity: 'comfortable'
    };
    persist(defaults);
    showToast && showToast('تمت استعادة تفضيلات لوحة التحكم الافتراضية لهذا المدير', 'info');
  };

  const favItems = (prefs.favoritePages || [])
    .map((id) => allNavItems.find((n) => n.id === id))
    .filter(Boolean);

  const orderedWidgets = (prefs.widgetOrder || DEFAULT_ADMIN_WIDGETS.map((w) => w.id))
    .map((id) => DEFAULT_ADMIN_WIDGETS.find((w) => w.id === id))
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {/* Compact Favorites & Recent Activity Strip */}
      <div className="elz-admin-card !p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <span className="text-xs font-black text-muted inline-flex items-center gap-1 shrink-0">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> المفضلة السريعة:
          </span>
          {favItems.map((it) => {
            const Icon = it.icon;
            return (
              <button
                key={it.id}
                type="button"
                onClick={() => onNavigateTab && onNavigateTab(it.id)}
                className="px-3 py-1.5 rounded-xl bg-surface2 hover:bg-[#0071E3] text-fg hover:text-white border border-line text-[11px] font-extrabold inline-flex items-center gap-1.5 transition"
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{it.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setOpen((p) => !p)}
          className="px-3 py-1.5 rounded-xl bg-[#0071E3]/10 hover:bg-[#0071E3] text-[#0071E3] hover:text-white border border-[#0071E3]/30 text-[11px] font-black inline-flex items-center gap-1.5 transition shrink-0"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span>تخصيص لوحة التحكم</span>
        </button>
      </div>

      {/* Recent Activity Mini Bar */}
      {Array.isArray(versionHistory) && versionHistory.length > 0 && !(prefs.hiddenWidgets || []).includes('recent_activity') && (
        <div className="elz-admin-card !p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-[#0071E3] shrink-0" />
            <span className="font-black text-fg shrink-0">آخر تعديل إداري:</span>
            <span className="text-muted font-bold truncate">{versionHistory[0].label} — بواسطة {versionHistory[0].actorName}</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab && onNavigateTab('version_history')}
            className="text-[11px] font-black text-[#0071E3] hover:underline shrink-0"
          >
            عرض سجل الإصدارات ←
          </button>
        </div>
      )}

      {/* Customization Drawer Panel */}
      {open && (
        <div className="elz-admin-card border-2 border-[#0071E3]/40 space-y-4">
          <div className="flex items-center justify-between border-b border-line pb-2.5">
            <div>
              <h3 className="text-sm font-black text-fg flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#0071E3]" /> تخصيص تجربة لوحة التحكم (خاص بحسابك فقط)
              </h3>
              <p className="text-[11px] text-muted">تفضيلات العرض والاختصارات هنا محفوظة لحسابك الإداري ولا تؤثر على واجهة الموقع العامة</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={resetPrefs} className="px-2.5 py-1 rounded-lg bg-surface2 border border-line text-[11px] font-bold text-muted hover:text-fg inline-flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> افتراضي
              </button>
              <button type="button" onClick={() => setOpen(false)} className="w-7 h-7 rounded-lg bg-surface2 flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Widgets Order & Visibility */}
            <div className="space-y-2">
              <div className="font-black text-muted">ترتيب وإظهار Widgets الصفحة الرئيسية:</div>
              {orderedWidgets.map((w, idx) => {
                const isHidden = (prefs.hiddenWidgets || []).includes(w.id);
                return (
                  <div key={w.id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-surface2 border border-line">
                    <span className={`font-bold ${isHidden ? 'line-through text-muted' : 'text-fg'}`}>{w.label}</span>
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => moveWidget(idx, -1)} disabled={idx === 0} className="p-1 rounded bg-surface border border-line disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                      <button type="button" onClick={() => moveWidget(idx, 1)} disabled={idx === orderedWidgets.length - 1} className="p-1 rounded bg-surface border border-line disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                      <button type="button" onClick={() => toggleWidget(w.id)} className="p-1 rounded bg-surface border border-line">
                        {isHidden ? <EyeOff className="w-3.5 h-3.5 text-rose-500" /> : <Eye className="w-3.5 h-3.5 text-emerald-500" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Favorite Pages Picker */}
            <div className="space-y-2">
              <div className="font-black text-muted">الصفحات المثبتة في شريط المفضلة السريعة:</div>
              <div className="flex flex-wrap gap-1.5">
                {allNavItems.map((it) => {
                  const pinned = (prefs.favoritePages || []).includes(it.id);
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => toggleFavorite(it.id)}
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold transition ${
                        pinned ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-300' : 'bg-surface2 border-line text-muted'
                      }`}
                    >
                      {pinned ? '★ ' : '+ '} {it.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
