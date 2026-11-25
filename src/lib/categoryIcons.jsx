import React from 'react';
import {
  Smartphone, Laptop, Tablet, Headphones, Watch, Cable, Plug, Battery, Monitor, Camera, Speaker, Gamepad2,
  Shield, Package, Wrench, Cpu, Tv, Keyboard, Mouse, HardDrive, Zap, Sparkles
} from 'lucide-react';

// One consistent icon set (Lucide, 1.75 stroke — Apple-like line style).
export const CATEGORY_ICONS = {
  smartphone: { Icon: Smartphone, label: 'موبايل' },
  laptop: { Icon: Laptop, label: 'لابتوب' },
  tablet: { Icon: Tablet, label: 'تابلت' },
  headphones: { Icon: Headphones, label: 'سماعات' },
  watch: { Icon: Watch, label: 'ساعة' },
  cable: { Icon: Cable, label: 'إكسسوارات / كابلات' },
  charger: { Icon: Plug, label: 'شواحن' },
  battery: { Icon: Battery, label: 'بطاريات / باور بانك' },
  screen: { Icon: Monitor, label: 'شاشات' },
  camera: { Icon: Camera, label: 'كاميرا' },
  speaker: { Icon: Speaker, label: 'سبيكر' },
  gaming: { Icon: Gamepad2, label: 'ألعاب' },
  protection: { Icon: Shield, label: 'جرابات وحماية' },
  parts: { Icon: Wrench, label: 'قطع غيار' },
  chip: { Icon: Cpu, label: 'مكونات' },
  tv: { Icon: Tv, label: 'تلفزيون' },
  keyboard: { Icon: Keyboard, label: 'كيبورد' },
  mouse: { Icon: Mouse, label: 'ماوس' },
  storage: { Icon: HardDrive, label: 'تخزين' },
  power: { Icon: Zap, label: 'طاقة' },
  sparkles: { Icon: Sparkles, label: 'مميز' },
  package: { Icon: Package, label: 'عام' }
};

// Ordered rules: first match wins. Works with Arabic + English category names.
const RULES = [
  [/tablet|تابلت|ايباد|آيباد|ipad|لوحي|لوحية/i, 'tablet'],
  [/laptop|notebook|macbook|لابتوب|لاب توب|ماك ?بوك/i, 'laptop'],
  [/headphone|earbud|airpod|buds|سماع|ايربود|إيربود|هيدفون/i, 'headphones'],
  [/watch|smart ?band|ساع|اسوره|أسورة|سوار ذكي/i, 'watch'],
  [/power ?bank|باور ?بانك|battery|بطار/i, 'battery'],
  [/charger|adapter|شاحن|محول|وصلة شحن/i, 'charger'],
  [/cable|كابل|كيبل|اكسسوار|إكسسوار|accessor/i, 'cable'],
  [/case|cover|protector|glass|جراب|كفر|حماية|سكرين|زجاج/i, 'protection'],
  [/screen|display|lcd|oled|شاشة|شاشه/i, 'screen'],
  [/camera|كاميرا|كاميره/i, 'camera'],
  [/speaker|سبيكر|مكبر/i, 'speaker'],
  [/game|gaming|play ?station|ألعاب|العاب|جيم/i, 'gaming'],
  [/keyboard|كيبورد|لوحة مفاتيح/i, 'keyboard'],
  [/mouse|ماوس/i, 'mouse'],
  [/ssd|hdd|flash|memory|storage|فلاش|ميموري|هارد/i, 'storage'],
  [/tv|تلفزيون|تليفزيون/i, 'tv'],
  [/spare|part|قطع|غيار|فلاتة|فلات|مكونات/i, 'parts'],
  [/phone|mobile|iphone|galaxy|redmi|موبايل|هاتف|تليفون|ايفون|آيفون|سامسونج|شاومي/i, 'smartphone']
];

export function resolveCategoryIconKey(category, overrides) {
  const name = String(category || '').trim();
  if (overrides && overrides[name] && CATEGORY_ICONS[overrides[name]]) return overrides[name];
  for (const [re, key] of RULES) if (re.test(name)) return key;
  return 'package';
}

export function CategoryIcon({ category, overrides, className = 'w-8 h-8 sm:w-9 sm:h-9', strokeWidth = 1.6 }) {
  const { Icon } = CATEGORY_ICONS[resolveCategoryIconKey(category, overrides)] || CATEGORY_ICONS.package;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}

// Dashboard: pick the icon for any category (auto-detected by default, override per category).
export function CategoryIconsAdmin({ categories = [], overrides = {}, onChange }) {
  const list = [...new Set(categories.filter(Boolean))];
  if (!list.length) return null;
  return (
    <div className="bg-surface border border-line rounded-3xl p-5 space-y-3">
      <div><h3 className="font-black text-fg">أيقونات التصنيفات (اكتشف ما تحب)</h3><p className="text-[11px] font-bold text-muted">الأيقونة تُحدَّد تلقائيًا من اسم التصنيف. اختر أيقونة يدويًا لأي تصنيف جديد أو غير مطابق.</p></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {list.map((cat) => {
          const cur = overrides[cat] || '';
          return (
            <label key={cat} className="flex items-center gap-2 rounded-2xl bg-bg border border-line p-2">
              <span className="w-10 h-10 rounded-full bg-surface2 flex items-center justify-center text-fg shrink-0"><CategoryIcon category={cat} overrides={overrides} className="w-5 h-5" /></span>
              <span className="min-w-0 flex-1"><span className="block text-xs font-black text-fg truncate">{cat}</span>
                <select value={cur} onChange={(e) => { const n = { ...overrides }; if (e.target.value) n[cat] = e.target.value; else delete n[cat]; onChange && onChange(n); }} className="mt-1 w-full rounded-lg border border-line bg-surface text-[11px] font-bold py-1 px-1.5">
                  <option value="">تلقائي ({CATEGORY_ICONS[resolveCategoryIconKey(cat, {})].label})</option>
                  {Object.entries(CATEGORY_ICONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select></span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
