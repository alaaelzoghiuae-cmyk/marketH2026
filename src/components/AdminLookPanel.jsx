import React from 'react';

// "Look" panel: accent colour, tile radius, content width and the big home headline.
// Writes plain siteSettings keys (brandAccent, tileRadius, containerWidth, showHomeStoreHeadline,
// homeStoreTitle, homeStoreSubtitle, showHomeCategoryRow). They apply live on the storefront and are
// saved with the normal "save settings" button of the dashboard.
export default function AdminLookPanel({ siteSettings, setSiteSettings }) {
  const set = (patch) => setSiteSettings((prev) => ({ ...prev, ...patch }));
  const s = siteSettings || {};
  return (
    <div className="space-y-4 text-xs" data-testid="look-panel">
      <div className="rounded-2xl border border-line bg-surface2 p-4 space-y-3">
        <h3 className="text-sm font-extrabold text-fg">عنوان الصفحة الرئيسية (طراز Apple Store)</h3>
        <label className="flex items-center gap-2 font-bold cursor-pointer">
          <input type="checkbox" checked={s.showHomeStoreHeadline !== false} onChange={(e) => set({ showHomeStoreHeadline: e.target.checked })} />
          <span>إظهار العنوان الكبير فوق منتجات الصفحة الرئيسية</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-bold text-muted block mb-1">الجزء الغامق من العنوان:</label>
            <input type="text" value={s.homeStoreTitle ?? 'المتجر.'} onChange={(e) => set({ homeStoreTitle: e.target.value })} className="w-full p-2.5 rounded-xl border border-line font-extrabold bg-bg text-fg" />
          </div>
          <div>
            <label className="font-bold text-muted block mb-1">الجزء الرمادي من العنوان:</label>
            <input type="text" value={s.homeStoreSubtitle ?? 'أفضل طريقة لشراء ما تحب.'} onChange={(e) => set({ homeStoreSubtitle: e.target.value })} className="w-full p-2.5 rounded-xl border border-line font-extrabold bg-bg text-fg" />
          </div>
        </div>
        <label className="flex items-center gap-2 font-bold cursor-pointer">
          <input type="checkbox" checked={s.showHomeCategoryRow !== false} onChange={(e) => set({ showHomeCategoryRow: e.target.checked })} />
          <span>إظهار صف أيقونات التصنيفات تحت العنوان</span>
        </label>
      </div>
      <div className="rounded-2xl border border-line bg-surface2 p-4 space-y-3">
        <h3 className="text-sm font-extrabold text-fg">الألوان والأشكال</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="font-bold text-muted block mb-1">لون الأزرار والروابط:</label>
            <div className="flex items-center gap-2">
              <input type="color" value={s.brandAccent || '#0071e3'} onChange={(e) => set({ brandAccent: e.target.value })} className="w-12 h-10 p-0.5 rounded-xl border border-line" />
              <button type="button" onClick={() => set({ brandAccent: '' })} className="px-3 py-2 rounded-xl bg-surface border border-line font-bold">افتراضي</button>
            </div>
          </div>
          <div>
            <label className="font-bold text-muted block mb-1">استدارة الكروت:</label>
            <select value={String(s.tileRadius ?? 28)} onChange={(e) => set({ tileRadius: Number(e.target.value) })} className="w-full p-2.5 rounded-xl border border-line font-bold bg-bg text-fg">
              <option value="28">ناعمة (28px)</option>
              <option value="18">متوسطة (18px)</option>
              <option value="8">حادة (8px)</option>
            </select>
          </div>
          <div>
            <label className="font-bold text-muted block mb-1">أقصى عرض للمحتوى:</label>
            <select value={String(s.containerWidth ?? 1380)} onChange={(e) => set({ containerWidth: Number(e.target.value) })} className="w-full p-2.5 rounded-xl border border-line font-bold bg-bg text-fg">
              <option value="1180">ضيق (1180px)</option>
              <option value="1380">عادي (1380px)</option>
              <option value="1600">واسع (1600px)</option>
            </select>
          </div>
        </div>
        <p className="text-muted">التغييرات تظهر في معاينة المتجر وتتحفظ بزر حفظ الإعدادات.</p>
      </div>
    </div>
  );
}
