import React from 'react';
import {
  Search, Scale, Sparkles, Wallet, TrendingDown, TrendingUp, Calculator, Globe,
  Smartphone, Bell, ChevronLeft, Check, X, RefreshCw, Shield, Camera, BatteryFull,
  MonitorSmartphone, Gauge, Star, PhoneCall, Cpu, RotateCcw, Share2, ShoppingCart,
  Package, Award, Zap, Tag, Layers, MessageSquare, CheckCircle2, Megaphone, LayoutGrid, Watch, Headphones
} from 'lucide-react';
import {
  KARAMBO_SERVICES,
  mergeKaramboCfg,
  getOrderedKaramboServices,
  resolveKaramboBarStyle
} from '../data/karamboConfig.js';
import { matchesPhoneSearch } from '../services/gsmarenaClient.js';
import { QuickServicesBar } from '../components/QuickServices.jsx';
import EgyptPriceReveal from '../components/EgyptPriceReveal.jsx';
import { modelsForPhone, partMatchLevel } from '../lib/accessoryMatch.js';
import { renderAdminKarambo } from './KaramboAdmin.jsx';

export { KARAMBO_SERVICES, renderAdminKarambo };

// ===================== كرومبو الشغلانة — Karambo services (v2 Complete) =====================

const ICONS = {
  Smartphone, Scale, Sparkles, Cpu, Wallet, TrendingDown, Calculator, Globe,
  RotateCcw, Zap, Award, Shield, Package, Tag, Layers, Gauge, Megaphone, Watch, Headphones
};

export function valueBand(score) {
  if (score >= 75) return { label: 'صفقة ممتازة', cls: 'bg-emerald-600' };
  if (score >= 55) return { label: 'قيمة كويسة', cls: 'bg-slate-600' };
  if (score >= 40) return { label: 'قيمة متوسطة', cls: 'bg-amber-500' };
  return { label: 'غالي على مواصفاته', cls: 'bg-rose-600' };
}

const BRAND_TOKENS = {
  apple: ['iphone', 'apple', 'airpods', 'آيفون', 'ايفون', 'ابل'],
  samsung: ['samsung', 'galaxy', 'سامسونج', 'جالاكسي'],
  xiaomi: ['xiaomi', 'redmi', 'poco', 'mi ', 'شاومي', 'ريدمي', 'بوكو'],
  honor: ['honor', 'هونر'],
  oppo: ['oppo', 'reno', 'أوبو', 'اوبو'],
  vivo: ['vivo', 'فيفو'],
  realme: ['realme', 'ريلمي'],
  infinix: ['infinix', 'إنفينيكس', 'انفنكس'],
  huawei: ['huawei', 'هواوي'],
  nothing: ['nothing', 'نوثينج'],
  google: ['pixel', 'google', 'بيكسل', 'جوجل'],
  oneplus: ['oneplus', 'ون بلس'],
  tecno: ['tecno', 'تكنو']
};

// ---------- Editorial generator (ELZOGHBI voice, from spec facts) ----------
export function genGuideEditorial(p) {
  const pros = [], cons = [];
  if (p.battery >= 6000) pros.push(`بطارية ضخمة ${Number(p.battery).toLocaleString('en-US')} مللي أمبير — من أقوى البطاريات في فئته`);
  else if (p.battery >= 5000) pros.push(`بطارية ${Number(p.battery).toLocaleString('en-US')} مللي أمبير تكمل معاك يوم كامل براحة`);
  if (p.chargeW >= 80) pros.push(`شحن سريع ${p.chargeW} وات يختصر وقت الشحن جدًا`);
  else if (p.chargeW >= 45) pros.push(`شحن سريع ${p.chargeW} وات`);
  if (p.camera >= 200) pros.push(`كاميرا رئيسية ${p.camera} ميجا بتفاصيل استثنائية`);
  else if (p.camera >= 108) pros.push(`كاميرا رئيسية ${p.camera} ميجا بتصوير حاد وواضح`);
  else if (p.camera >= 50) pros.push(`كاميرا رئيسية ${p.camera} ميجا محترمة في فئته`);
  if (p.refresh >= 120) pros.push(`شاشة ${p.refresh} هرتز — سلاسة ملحوظة في التصفح والألعاب`);
  if (p.screen >= 6.7) pros.push(`شاشة كبيرة ${p.screen} بوصة ممتعة للفيديو واللعب`);
  if (p.weight && p.weight <= 185) pros.push(`خفيف في الإيد (${p.weight} جرام)`);
  if (p.storageMax >= 1024) pros.push('مساحات تخزين لحد 1 تيرا وأكتر — انسى هم المساحة');
  else if (p.storageMax >= 512) pros.push(`تخزين لحد ${p.storageMax} جيجا`);
  if ((p.ip || '').includes('IP68')) pros.push('مقاومة مية وتراب IP68');
  if (p.weight >= 225) cons.push(`وزنه تقيل نسبيًا (${p.weight} جرام) هتحس بيه في الاستخدام الطويل`);
  if (p.refresh && p.refresh <= 60) cons.push('الشاشة 60 هرتز بس — أقل سلاسة من المنافسين');
  if (p.battery && p.battery < 4500) cons.push(`البطارية ${Number(p.battery).toLocaleString('en-US')} مللي أمبير أقل من متوسط فئته`);
  if ((p.sim || '').includes('eSIM') && ((p.sim || '').includes('فقط') || (p.sim || '').includes('بس'))) cons.push('بيعتمد على eSIM من غير خانة شريحة عادية — اتأكد إن شركتك بتدعمها');
  if (!cons.length) cons.push('سعره محتاج مقارنة كويسة مع بدائل نفس الفئة قبل ما تقرر');
  const pr = p.price || 0;
  const verdict = pr && pr < 12000 ? 'مناسب لو بتدور على موبايل اقتصادي يعتمد عليه في الاستخدام اليومي والمكالمات والسوشيال.'
    : pr && pr < 30000 ? 'مناسب لو عايز توازن كويس بين الأداء والكاميرا والسعر في الفئة المتوسطة.'
    : pr ? 'مناسب للي عايز تجربة رائدة كاملة ومش بيبص للسعر كأول عامل.' : 'راجع المواصفات وقارنه ببدائل فئته قبل القرار.';
  return { pros: pros.slice(0, 5), cons: cons.slice(0, 3), verdict };
}

export function computeValueScore(p, cheapest, weights) {
  const w = weights || { camera: 30, battery: 25, screen: 20, ram: 25 };
  const wSum = Math.max(1, (Number(w.camera) || 0) + (Number(w.battery) || 0) + (Number(w.screen) || 0) + (Number(w.ram) || 0));
  const camN = Math.min((p.camera || 0) / 200, 1);
  const batN = Math.min(Math.max(((p.battery || 3000) - 3000) / 4000, 0), 1);
  const refN = Math.min(Math.max(((p.refresh || 60) - 60) / 84, 0), 1);
  const ramN = Math.min((p.ramMax || 0) / 24, 1);
  const s = ((Number(w.camera) || 0) * camN + (Number(w.battery) || 0) * batN + (Number(w.screen) || 0) * refN + (Number(w.ram) || 0) * ramN) / wSum;
  const vf = p.price ? Math.pow(Math.max(1, cheapest) / p.price, 0.5) : 0.5;
  return Math.max(5, Math.min(99, Math.round(s * 70 + 30 * vf)));
}

// ---------- Live-sync parsers ----------
export function parseGuideSitemap(xml) {
  return [...String(xml || '').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]).filter(u => u.includes('/phone/'));
}

const BRAND_AR = { apple: 'آبل', samsung: 'سامسونج', xiaomi: 'شاومي', honor: 'هونر', oppo: 'أوبو', vivo: 'فيفو', realme: 'ريلمي', infinix: 'إنفينيكس', huawei: 'هواوي', nothing: 'نوثينج', google: 'جوجل', oneplus: 'ون بلس', tecno: 'تكنو', itel: 'آيتل', motorola: 'موتورولا', nokia: 'نوكيا', sony: 'سوني', asus: 'أسوس', zte: 'زد تي إي' };
const numOf = (s) => { const m = String(s || '').replace(/٬/g, ',').match(/[\d][\d,]*\.?\d*/); return m ? parseFloat(m[0].replace(/,/g, '')) : null; };

export function parseGuidePhoneHtml(html, url) {
  try {
    const slug = url.replace(/\/$/, '').split('/').pop();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    let name = null, lowPrice = null;
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(sc => {
      try {
        const data = JSON.parse(sc.textContent || '');
        (Array.isArray(data) ? data : [data]).forEach(it => {
          if (it && it['@type'] === 'Product') { name = it.name || name; const off = it.offers || {}; lowPrice = off.lowPrice || off.price || lowPrice; }
        });
      } catch (e) {}
    });
    if (!name) name = slug;
    const imgs = [];
    (html.match(new RegExp(`https://mobi3araby\\.com/wp-content/uploads/mobi-phones/${slug}/[A-Za-z0-9._-]+\\.webp`, 'g')) || []).forEach(v => {
      if (!/-\d+x\d+\.webp$/.test(v) && !imgs.includes(v)) imgs.push(v);
    });
    imgs.sort((a, b) => ((parseInt((a.match(/-(\d+)\.webp$/) || [])[1] || '99', 10)) - (parseInt((b.match(/-(\d+)\.webp$/) || [])[1] || '99', 10))));
    const section = (id) => {
      const h = doc.querySelector(`h2#${id}`); if (!h) return [];
      const out = []; let el = h.nextElementSibling;
      while (el && el.tagName !== 'H2') { out.push(el); el = el.nextElementSibling; }
      return out;
    };
    const specs = [], flat = {};
    let pendingGroup = null;
    section('specs').forEach(el => {
      if (el.tagName === 'H3') pendingGroup = el.textContent.trim();
      if (el.tagName === 'TABLE' && pendingGroup) {
        const rows = [];
        el.querySelectorAll('tr').forEach(tr => {
          const cells = [...tr.querySelectorAll('td,th')].map(c => c.textContent.trim());
          if (cells.length >= 2 && cells[0]) { rows.push([cells[0], cells[1]]); flat[cells[0]] = cells[1]; }
        });
        if (rows.length) specs.push({ group: pendingGroup, rows });
        pendingGroup = null;
      }
    });
    const variants = []; let priceDate = '';
    const pEls = section('price');
    const tbl = pEls.find(e => e.tagName === 'TABLE') || (pEls[0] && pEls[0].querySelector ? [...pEls].map(e => e.querySelector('table')).find(Boolean) : null);
    if (tbl) {
      [...tbl.querySelectorAll('tr')].slice(1).forEach(tr => {
        const cells = [...tr.querySelectorAll('td,th')].map(c => c.textContent.trim());
        if (cells.length >= 2) {
          const p = numOf(cells[1]);
          const dm = cells[1].match(/(\d{1,2})\s+(يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر)/);
          if (dm && !priceDate) priceDate = dm[0];
          if (p) variants.push({ label: cells[0], price: Math.round(p) });
        }
      });
    }
    if (!variants.length && lowPrice) variants.push({ label: '—', price: Math.round(parseFloat(lowPrice)) });
    if (!specs.length || !variants.length) return null;
    const g = (...keys) => { for (const k of keys) { for (const fk in flat) { if (fk.includes(k)) return flat[fk]; } } return ''; };
    const brandSlug = slug.split('-')[0];
    const p = {
      id: 'gp_' + slug, slug, name, brand: BRAND_AR[brandSlug] || brandSlug, brandSlug,
      images: imgs.slice(0, 6), specs, variants,
      price: Math.min(...variants.map(v => v.price)), priceDate,
      battery: numOf(g('السعة')), camera: numOf(g('الكاميرا الرئيسية')), refresh: numOf(g('معدل التحديث')),
      weight: numOf(g('الوزن')), screen: numOf(g('حجم الشاشة')),
      ramMax: Math.max(0, ...(String(g('الرام')).match(/\d+/g) || []).map(Number)),
      storageMax: Math.max(0, ...(String(g('التخزين')).match(/\d+/g) || []).map(Number)),
      chargeW: numOf(g('الشحن السلكي')), sim: g('الشرائح'), ip: g('مقاومة'),
      has5G: /5g|الجيل الخامس/i.test(JSON.stringify(flat)),
      enabled: true
    };
    const ed = genGuideEditorial(p);
    p.pros = ed.pros; p.cons = ed.cons; p.verdict = ed.verdict;
    return p;
  } catch (e) { return null; }
}

// ---------- Shared helpers ----------
function svcEnabled(cfg, id) { return !cfg || !cfg.services || cfg.services[id] !== false; }

function partPrice(ctx, p) {
  if (ctx.calculatePartPrice) {
    try { return Number(ctx.calculatePartPrice(p, ctx.currentGroup).baseEgpPrice) || 0; } catch (e) { return Number(p.basePrice) || 0; }
  }
  return Number(p.basePrice) || 0;
}

function partPriceInfo(ctx, p) {
  if (ctx.calculatePartPrice) {
    try { return ctx.calculatePartPrice(p, ctx.currentGroup); } catch (e) {}
  }
  return { baseEgpPrice: Number(p.basePrice) || 0, oldBaseEgpPrice: Number(p.oldPrice) || 0, hasDiscount: (Number(p.oldPrice) || 0) > (Number(p.basePrice) || 0) };
}

function storeWhatsappNumber(ctx, override) {
  const raw = override || (ctx.siteSettings && (ctx.siteSettings.whatsappNumber || ctx.siteSettings.phone)) || '';
  const digits = String(raw).replace(/\D+/g, '');
  if (!digits) return '';
  return digits.startsWith('0') ? '2' + digits : digits;
}


// Scroll only as far as the services content (never to the very top) so tapping inside the Karambo services keeps the user's place.
export function keepKaramboInView() {
  try {
    const el = document.getElementById('korombo-content-top');
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 120;
    if (window.scrollY > y) window.scrollTo({ top: Math.max(0, y) });
  } catch (e) {}
}

function ValueBadge({ score }) {
  const b = valueBand(score || 0);
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black text-white ${b.cls}`}><Gauge className="w-3 h-3" /> قيمة مقابل السعر: {score || 0} — {b.label}</span>;
}

function PhoneCard(ctx, phone, opts = {}) {
  const { formatMoney, karamboUi, setKaramboUi } = ctx;
  const inCompare = (karamboUi.compare || []).includes(phone.id);
  const go = (page, extra = {}) => {
    if (ctx.trackKaramboEvent && page === 'phone') ctx.trackKaramboEvent('phone_view', phone.name);
    setKaramboUi(p => ({ ...p, page, ...extra }));
    keepKaramboInView();
  };
  return (
    <div key={phone.id} className="bg-surface border border-line rounded-3xl overflow-hidden flex flex-col hover:border-[#0071E3] transition group">
      <button type="button" onClick={() => go('phone', { phoneId: phone.id })} className="relative bg-white dark:bg-[#1D1D1F] aspect-[4/3] flex items-center justify-center overflow-hidden">
        {phone.images && phone.images[0] ? <img src={phone.images[0]} alt={phone.name} loading="lazy" referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300" /> : <Smartphone className="w-12 h-12 text-muted" />}
        <span className="absolute top-2 start-2 px-2 py-0.5 rounded-full bg-[#0071E3] text-white text-[10px] font-black">{phone.brand}</span>
        {opts.badgeText && <span className="absolute top-2 end-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">{opts.badgeText}</span>}
      </button>
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <button type="button" onClick={() => go('phone', { phoneId: phone.id })} className="text-start font-black text-fg leading-snug hover:text-[#0066CC]">{phone.name}</button>
        <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-muted">
          {phone.camera ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface2 border border-line"><Camera className="w-3 h-3" /> {phone.camera} ميجا</span> : null}
          {phone.battery ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface2 border border-line"><BatteryFull className="w-3 h-3" /> {Number(phone.battery).toLocaleString('en-US')}</span> : null}
          {phone.screen ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface2 border border-line"><MonitorSmartphone className="w-3 h-3" /> {phone.screen}&quot;</span> : null}
        </div>
        {opts.reasons && opts.reasons.length > 0 && (
          <ul className="space-y-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 rounded-xl p-2">
            {opts.reasons.map((r, ri) => <li key={ri} className="flex items-start gap-1"><Check className="w-3 h-3 shrink-0 mt-0.5" /><span>{r}</span></li>)}
          </ul>
        )}
        <div className="mt-auto space-y-1.5">
          <EgyptPriceReveal compact name={phone.name} curatedPrice={phone.price} curatedDate={phone.priceDate} formatMoney={formatMoney} />
          <ValueBadge score={phone.valueScore} />
          <div className="flex gap-1.5 pt-1">
            <button type="button" onClick={() => go('phone', { phoneId: phone.id })} className="flex-1 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-black transition">التفاصيل</button>
            <button type="button" onClick={() => opts.onToggleCompare && opts.onToggleCompare(phone.id)} className={`px-3 py-2 rounded-xl text-xs font-black border transition ${inCompare ? 'bg-slate-600 text-white border-slate-600' : 'bg-surface2 text-fg border-line hover:border-slate-400'}`} title="أضف للمقارنة"><Scale className="w-4 h-4" /></button>
            <button type="button" onClick={() => go('phone', { phoneId: phone.id, alertOpen: true })} className="px-3 py-2 rounded-xl bg-surface2 text-fg border border-line hover:border-amber-400 text-xs font-black transition" title="نبّهني عند نزول السعر"><Bell className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function matchAccessoriesForPhone(ctx, phone) {
  const parts = ctx.publicParts || [];
  const models = ctx.models || [];
  const modelById = new Map(models.map(m => [String(m.id), m]));
  const brandSlug = String(phone.brandSlug || phone.brand || '').toLowerCase();
  const isLightning = brandSlug === 'apple' && /iphone\s*(?:1[0-4]|[6-9]|x|se)/i.test(`${phone.name || ''} ${phone.slug || ''}`);
  const neededW = Number(phone.chargeW || 0);

  const modelSpecific = [];
  const chargersAndCables = [];
  const universalExtras = [];

  parts.forEach(part => {
    const level = partMatchLevel(part, phone, models, modelById);
    const hay = `${part.name || ''} ${part.category || ''}`.toLowerCase();
    const isChargerOrCable = /شاحن|كابل|وصل|باور|بطار|charger|cable|adapter|power|type-c|lightning|pd|gan/i.test(hay);
    const isAudioOrWatch = /سماع|إيربود|ايربود|ساع|watch|buds|airpods|earbuds|headphone/i.test(hay);

    if (level) {
      // Real relation (model id / compatible list / exact model in title) → model-specific
      modelSpecific.push({ part, score: level === 'model' ? 3 : level === 'list' ? 2 : 1 });
    } else if (isChargerOrCable) {
      // Generic charger / cable: only port-compatible ones, clearly separated from model-specific items
      const wantsLightning = isLightning;
      const hasLightning = /lightning|لايتن/i.test(hay);
      const hasUsbC = /type-c|usb-c|تايب|usb c/i.test(hay);
      if ((wantsLightning && hasLightning) || (!wantsLightning && hasUsbC)) {
        let cScore = 2;
        const wMatch = hay.match(/(\d{2,3})\s*(?:w|وات)/i);
        if (wMatch && neededW > 0 && parseInt(wMatch[1], 10) >= neededW) cScore += 2;
        chargersAndCables.push({ part, score: cScore });
      }
    } else if (isAudioOrWatch) {
      universalExtras.push({ part, score: 1 });
    }
  });

  return {
    portLabel: isLightning ? 'Lightning' : 'USB Type-C',
    neededW,
    modelSpecific: modelSpecific.sort((a, b) => b.score - a.score).slice(0, 12).map(x => x.part),
    chargersAndCables: chargersAndCables.sort((a, b) => b.score - a.score).slice(0, 8).map(x => x.part),
    universalExtras: universalExtras.slice(0, 8).map(x => x.part)
  };
}

// ===================== The Strip (home, under the search layer) =====================
export { ICONS, svcEnabled, partPrice, partPriceInfo, storeWhatsappNumber, ValueBadge, PhoneCard, matchAccessoriesForPhone };

export function renderKaramboStrip(ctx) {
  const { karamboCfg, setClientTab, setKaramboUi } = ctx;
  const cfg = mergeKaramboCfg(karamboCfg);
  if (cfg.enabled === false) return null;
  const services = getOrderedKaramboServices(cfg).filter(s => s.enabled);
  if (!services.length) return null;

  const go = (page) => {
    if (ctx.trackKaramboEvent) ctx.trackKaramboEvent('visit', page);
    setKaramboUi(p => ({ ...p, page }));
    setClientTab('karambo');
    window.scrollTo({ top: 0 });
  };

  const rtlUi = !(ctx.i18nActive);
  return (
    <section id="karambo-strip" aria-label={cfg.title} className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <button type="button" onClick={() => go('hub')} aria-label={`كل خدمات ${cfg.title}`} className="flex items-center gap-4 min-w-0 text-start cursor-pointer group">
          {cfg.showMascot !== false && (
            <img src={cfg.mascotUrl || '/karambo.png'} alt="" className="w-14 h-14 sm:w-16 sm:h-16 rounded-[20px] object-cover bg-surface shrink-0" />
          )}
          <div className="min-w-0">
            {cfg.badgeText && <div className="text-[12px] font-semibold text-[#0066CC] dark:text-[#2997FF]">{cfg.badgeText}</div>}
            <h3 className="elz-h3 text-fg leading-tight">{cfg.title}</h3>
            {cfg.subtitle && <p className="text-[13px] sm:text-[15px] text-muted mt-0.5 line-clamp-2">{cfg.subtitle}</p>}
          </div>
        </button>
      <button type="button" onClick={() => go('hub')} className="shrink-0 text-[14px] font-medium text-[#0066CC] dark:text-[#2997FF] hover:underline">{rtlUi ? 'كل الخدمات ›' : 'All services ›'}</button>
      </div>
      <div className="elz-rail-track flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {services.map(s => {
          const Icon = ICONS[s.icon] || Sparkles;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => go(s.id)}
              className="group snap-start shrink-0 w-[220px] sm:w-[250px] min-h-[190px] rounded-[24px] bg-surface hover:bg-surface2 p-5 text-start flex flex-col transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-14px_rgba(0,0,0,0.25)]"
            >
              <span className="flex items-start justify-between">
                <span className={`w-12 h-12 rounded-2xl ${s.color} flex items-center justify-center shadow-sm`}><Icon className="w-6 h-6 text-white" strokeWidth={1.75} /></span>
                {s.badge && <span className="px-2.5 py-0.5 rounded-full bg-[#FF9F0A]/15 text-[#b86e00] dark:text-[#ffb340] text-[11px] font-semibold">{s.badge}</span>}
              </span>
              <span className="mt-4 block text-[17px] font-semibold text-fg leading-snug">{s.title}</span>
              <span className="mt-1 block text-[13px] text-muted leading-snug line-clamp-3">{s.desc}</span>
              <span className="mt-auto pt-3 text-[14px] font-medium text-[#0066CC] dark:text-[#2997FF] group-hover:underline">{rtlUi ? 'افتح ›' : 'Open ›'}</span>
            </button>
          );
        })}
      </div>
      {cfg.disclaimer && (
        <p className="flex items-center gap-2 text-[12px] text-muted"><Shield className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /><span>{cfg.disclaimer}</span></p>
      )}
      <QuickServicesBar ctx={ctx} cfg={cfg} services={getOrderedKaramboServices(cfg).filter(s => s.enabled)} icons={ICONS} renderEmbedded={(id, ui, setUi) => (ctx.renderKaramboPage ? ctx.renderKaramboPage({ ...ctx, karamboUi: ui, setKaramboUi: setUi, __embedded: true }) : null)} />
    </section>
  );
}

// ===================== Karambo pages =====================