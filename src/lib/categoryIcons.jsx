import React from 'react';
import {
  Smartphone, Laptop, Tablet, Headphones, Watch, Cable, Plug, Battery, Monitor, Camera, Speaker, Gamepad2,
  Shield, Package, Wrench, Cpu, Tv, Keyboard, Mouse, HardDrive, Zap, Sparkles, Scissors, Lightbulb, Aperture, Car, Layers, Mic
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
  grooming: { Icon: Scissors, label: 'عناية وحلاقة' },
  light: { Icon: Lightbulb, label: 'إضاءة' },
  lens: { Icon: Aperture, label: 'عدسات' },
  car: { Icon: Car, label: 'إكسسوارات سيارة' },
  glass: { Icon: Layers, label: 'زجاج / ظهر' },
  headset: { Icon: Mic, label: 'ميكروفون / هيدسيت' },
  package: { Icon: Package, label: 'عام' }
};

// Ordered rules: first match wins. Works with Arabic + English category names.
const RULES = [
  [/ring ?light|اضاءة|إضاءة|لمبة|رينج/i, 'light'],
  [/tablet|تابلت|ايباد|آيباد|ipad|لوحي|لوحية/i, 'tablet'],
  [/laptop|notebook|macbook|لابتوب|لاب توب|ماك ?بوك/i, 'laptop'],
  [/shav|trimmer|groom|حلاقة|حلاقه|ماكينات|عناية/i, 'grooming'],
  [/smart ?watch|apple ?watch|fitness|tracker|smart ?band|ساع|اسوره|أسورة|اسورة|اساور|أساور|(^|\s)سوار/i, 'watch'],
  [/headset|هيدست|ميكروفون/i, 'headset'],
  [/اسكرين|سكرين|screen ?protector|جراب|كفر|\bcase\b|\bcover\b/i, 'protection'],
  [/game|gaming|play ?station|ألعاب|العاب|جيم|ماوس|mouse|keyboard|كيبورد/i, 'gaming'],
  [/headphone|earbud|airpod|buds|سماع|ايربود|إيربود|هيدفون/i, 'headphones'],
  [/speaker|سبيكر|مكبر/i, 'speaker'],
  [/power ?bank|باور ?بانك/i, 'battery'],
  [/batter|بطار/i, 'battery'],
  [/back ?glass|ظهر|شاسيه|بصمة|بصمه/i, 'glass'],
  [/lens|عدس/i, 'lens'],
  [/camera|كاميرا|كاميره|كاميرات/i, 'camera'],
  [/car|سيارة|سيارات|حوامل/i, 'car'],
  [/flex|فلات|فالات|بوردة|بورد شحن|ماذر|housing|هاوسينج|باغات|بوتم|تتشات|touch/i, 'parts'],
  [/charger|adapter|شاحن|شواحن|شحن/i, 'charger'],
  [/cable|كابل|كيبل|محول|اكسسوار|إكسسوار|accessor|مشتركات|اجهزة ذكية|أجهزة ذكية/i, 'cable'],
  [/screen|display|lcd|oled|شاشة|شاشه|شاشات/i, 'screen'],
  [/case|cover|protector|glass|جراب|كفر|حماية|اسكرين|سكرين|زجاج/i, 'protection'],
  [/ssd|hdd|flash|memory|storage|فلاش|ميموري|هارد/i, 'storage'],
  [/\btv\b|تلفزيون|تليفزيون/i, 'tv'],
  [/tool|عدة|spare|part|قطع|غيار|مكونات/i, 'parts'],
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
