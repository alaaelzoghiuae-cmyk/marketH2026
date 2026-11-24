import React from 'react';
import {
  Search, Scale, Sparkles, Wallet, TrendingDown, TrendingUp, Calculator, Globe,
  Smartphone, Bell, ChevronLeft, Check, X, RefreshCw, Shield, Camera, BatteryFull,
  MonitorSmartphone, Gauge, Star, PhoneCall, Cpu, RotateCcw, Share2, ShoppingCart,
  Package, Award, Zap, Tag, Layers, MessageSquare, CheckCircle2, Megaphone, LayoutGrid
} from 'lucide-react';
import {
  KARAMBO_SERVICES,
  mergeKaramboCfg,
  getOrderedKaramboServices,
  resolveKaramboBarStyle
} from '../data/karamboConfig.js';
import { matchesPhoneSearch } from '../services/gsmarenaClient.js';
import GsmarenaCompareView from '../components/GsmarenaCompareView.jsx';
import GsmarenaPhonePicker from '../components/GsmarenaPhonePicker.jsx';
import KaramboLiveGuideView from '../components/KaramboLiveGuideView.jsx';
import KaramboNewsView from '../components/KaramboNewsView.jsx';
import KaramboPhoneHydrator from '../components/KaramboPhoneHydrator.jsx';
import KaramboStoreReviewsView from '../components/KaramboStoreReviewsView.jsx';
import { KaramboLiveAdvisorView, KaramboLiveRadarView, KaramboGulfView, KaramboTradeInView } from '../components/KaramboLiveMarketViews.jsx';
import { renderAdminKarambo } from './KaramboAdmin.jsx';

export { KARAMBO_SERVICES, renderAdminKarambo };

// ===================== كرومبو الشغلانة — Karambo services (v2 Complete) =====================

const ICONS = {
  Smartphone, Scale, Sparkles, Cpu, Wallet, TrendingDown, Calculator, Globe,
  RotateCcw, Zap, Award, Shield, Package, Tag, Layers, Gauge, Megaphone
};

export function valueBand(score) {
  if (score >= 75) return { label: 'صفقة ممتازة', cls: 'bg-emerald-600' };
  if (score >= 55) return { label: 'قيمة كويسة', cls: 'bg-sky-600' };
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
    window.scrollTo({ top: 0 });
  };
  return (
    <div key={phone.id} className="bg-surface border border-line rounded-3xl overflow-hidden flex flex-col hover:border-[#3B82F6] transition group">
      <button type="button" onClick={() => go('phone', { phoneId: phone.id })} className="relative bg-white dark:bg-[#0D1528] aspect-[4/3] flex items-center justify-center overflow-hidden">
        {phone.images && phone.images[0] ? <img src={phone.images[0]} alt={phone.name} loading="lazy" referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain group-hover:scale-105 transition duration-300" /> : <Smartphone className="w-12 h-12 text-muted" />}
        <span className="absolute top-2 start-2 px-2 py-0.5 rounded-full bg-[#2563EB] text-white text-[10px] font-black">{phone.brand}</span>
        {opts.badgeText && <span className="absolute top-2 end-2 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">{opts.badgeText}</span>}
      </button>
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <button type="button" onClick={() => go('phone', { phoneId: phone.id })} className="text-start font-black text-fg leading-snug hover:text-[#2563EB]">{phone.name}</button>
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
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10px] font-bold text-muted">سعر السوق الاسترشادي</div>
              <div className="text-lg font-black text-[#2563EB] dark:text-[#60A5FA]">{formatMoney(phone.price || 0)}</div>
            </div>
            {phone.priceDate ? <div className="text-[10px] text-muted font-bold">آخر مراجعة: {phone.priceDate}</div> : null}
          </div>
          <ValueBadge score={phone.valueScore} />
          <div className="flex gap-1.5 pt-1">
            <button type="button" onClick={() => go('phone', { phoneId: phone.id })} className="flex-1 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-black transition">التفاصيل</button>
            <button type="button" onClick={() => opts.onToggleCompare && opts.onToggleCompare(phone.id)} className={`px-3 py-2 rounded-xl text-xs font-black border transition ${inCompare ? 'bg-violet-600 text-white border-violet-600' : 'bg-surface2 text-fg border-line hover:border-violet-400'}`} title="أضف للمقارنة"><Scale className="w-4 h-4" /></button>
            <button type="button" onClick={() => go('phone', { phoneId: phone.id, alertOpen: true })} className="px-3 py-2 rounded-xl bg-surface2 text-fg border border-line hover:border-amber-400 text-xs font-black transition" title="نبّهني عند نزول السعر"><Bell className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

function matchAccessoriesForPhone(ctx, phone) {
  const parts = ctx.publicParts || [];
  const brandSlug = String(phone.brandSlug || phone.brand || '').toLowerCase();
  const tokens = BRAND_TOKENS[brandSlug] || [brandSlug, String(phone.brand || '').toLowerCase()].filter(Boolean);
  const modelNums = (String(phone.slug || phone.name || '').match(/\d{2,3}/g) || []);
  const isLightning = brandSlug === 'apple' && /iphone\s*(?:1[0-4]|[6-9]|x|se)/i.test(`${phone.name || ''} ${phone.slug || ''}`);
  const neededW = Number(phone.chargeW || 0);

  const modelSpecific = [];
  const chargersAndCables = [];
  const universalExtras = [];

  parts.forEach(part => {
    const hay = `${part.name || ''} ${part.brand || ''} ${part.modelName || ''} ${part.category || ''}`.toLowerCase();
    const isChargerOrCable = /شاحن|كابل|وصل|باور|بطار|charger|cable|adapter|power|type-c|lightning|pd|gan/i.test(hay);
    const isAudioOrWatch = /سماع|إيربود|ايربود|ساع|watch|buds|airpods|earbuds|headphone/i.test(hay);

    let score = 0;
    tokens.forEach(t => { if (t && hay.includes(t)) score += 2; });
    modelNums.forEach(n => { if (hay.includes(n)) score += 2; });

    if (score >= 2 && !isChargerOrCable) {
      modelSpecific.push({ part, score });
    } else if (isChargerOrCable) {
      let cScore = 1;
      if (isLightning && /lightning|لايتن|ايفون|iphone/i.test(hay)) cScore += 3;
      if (!isLightning && /type-c|usb-c|تايب|pd/i.test(hay)) cScore += 2;
      const wMatch = hay.match(/(\d{2,3})\s*(?:w|وات)/i);
      if (wMatch && neededW > 0 && parseInt(wMatch[1], 10) >= neededW) cScore += 2;
      chargersAndCables.push({ part, score: cScore });
    } else if (isAudioOrWatch) {
      universalExtras.push({ part, score: score + 1 });
    }
  });

  return {
    portLabel: isLightning ? 'Lightning' : 'USB Type-C',
    neededW,
    modelSpecific: modelSpecific.sort((a, b) => b.score - a.score).slice(0, 12).map(x => x.part),
    chargersAndCables: chargersAndCables.sort((a, b) => b.score - a.score).slice(0, 8).map(x => x.part),
    universalExtras: universalExtras.sort((a, b) => b.score - a.score).slice(0, 8).map(x => x.part)
  };
}

// ===================== The Strip (home, under the search layer) =====================
export function renderKaramboStrip(ctx) {
  const { karamboCfg, setClientTab, setKaramboUi } = ctx;
  const cfg = mergeKaramboCfg(karamboCfg);
  if (cfg.enabled === false) return null;
  const services = getOrderedKaramboServices(cfg).filter(s => s.enabled);
  if (!services.length) return null;

  const barStyle = resolveKaramboBarStyle(cfg);
  const go = (page) => {
    if (ctx.trackKaramboEvent) ctx.trackKaramboEvent('visit', page);
    setKaramboUi(p => ({ ...p, page }));
    setClientTab('karambo');
    window.scrollTo({ top: 0 });
  };

  if (cfg.layout === 'compact') {
    return (
      <section id="karambo-strip" style={barStyle} className="relative overflow-hidden rounded-[24px] border shadow-[0_14px_40px_-16px_rgba(37,99,235,0.45)] p-3.5 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            {cfg.showMascot !== false && <img src={cfg.mascotUrl || '/karambo.png'} alt="كرومبو" className="w-12 h-12 rounded-2xl object-cover border-2 border-white/50 bg-white/10" />}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg font-black">{cfg.title}</span>
                {cfg.badgeText && <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-black">{cfg.badgeText}</span>}
              </div>
              <div className="text-[11px] font-bold opacity-90 line-clamp-1">{cfg.subtitle}</div>
            </div>
          </div>
          <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {services.map(s => {
              const Icon = ICONS[s.icon] || Sparkles;
              return (
                <button key={s.id} type="button" onClick={() => go(s.id)} className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 backdrop-blur-sm transition">
                  <span className={`w-7 h-7 rounded-lg ${s.color} flex items-center justify-center`}><Icon className="w-4 h-4 text-white" /></span>
                  <span className="text-xs font-black whitespace-nowrap">{s.title}</span>
                  {s.badge && <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[9px] font-black">{s.badge}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="karambo-strip" style={barStyle} className="relative overflow-hidden rounded-[28px] border shadow-[0_18px_50px_-18px_rgba(37,99,235,0.55)]">
      <div className="absolute -top-10 -start-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-14 end-24 w-56 h-56 rounded-full bg-cyan-300/20 blur-3xl pointer-events-none" />
      <div className="relative flex flex-col lg:flex-row gap-4 p-4 sm:p-6">
        <div className="flex lg:flex-col items-center gap-3 lg:w-52 shrink-0">
          {cfg.showMascot !== false && (
            <img src={cfg.mascotUrl || '/karambo.png'} alt="كرومبو" className="w-20 h-20 lg:w-28 lg:h-28 rounded-3xl object-cover border-2 border-white/50 shadow-lg bg-white/10" />
          )}
          <div className="text-start lg:text-center space-y-1">
            {cfg.badgeText && <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black">{cfg.badgeText}</span>}
            <div className="text-xl sm:text-2xl font-black drop-shadow-sm">{cfg.title}</div>
            <div className="text-[11px] sm:text-xs font-bold opacity-90 leading-relaxed">{cfg.subtitle}</div>
          </div>
        </div>
        <div className={`flex-1 grid gap-2.5 content-center ${cfg.layout === 'cards' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-3'}`}>
          {services.map(s => {
            const Icon = ICONS[s.icon] || Sparkles;
            return (
              <button key={s.id} type="button" onClick={() => go(s.id)}
                className="relative group flex items-center gap-2.5 p-3 rounded-2xl bg-white/12 hover:bg-white/22 border border-white/25 backdrop-blur-sm text-start transition hover:-translate-y-0.5">
                {s.badge && <span className="absolute -top-1.5 end-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[9px] font-black shadow">{s.badge}</span>}
                <span className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition`}><Icon className="w-5 h-5 text-white" /></span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-black leading-tight truncate">{s.title}</span>
                  <span className="block text-[10px] font-bold opacity-85 leading-snug line-clamp-2">{s.desc}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {cfg.disclaimer && (
        <div className="relative px-5 py-2 bg-black/15 border-t border-white/15 flex items-center gap-2 text-[10px] font-bold opacity-90">
          <Shield className="w-3.5 h-3.5 shrink-0" />
          <span>{cfg.disclaimer}</span>
        </div>
      )}
    </section>
  );
}

// ===================== Karambo pages =====================
export function renderKaramboPage(ctx) {
  const { karamboCfg, karamboUi, setKaramboUi, setClientTab, guidePhonesView, formatMoney } = ctx;
  const cfg = mergeKaramboCfg(karamboCfg);
  const orderedServices = getOrderedKaramboServices(cfg);
  const ui = karamboUi || {};
  const page = ui.page || 'guide';
  const phones = (guidePhonesView || []).filter(p => p.enabled !== false);
  const set = (patch) => setKaramboUi(p => ({ ...p, ...patch }));
  const go = (pg, extra = {}) => {
    if (ctx.trackKaramboEvent && pg !== page) ctx.trackKaramboEvent('visit', pg);
    set({ page: pg, ...extra });
    window.scrollTo({ top: 0 });
  };
  const maxCompare = (cfg.compareCfg && cfg.compareCfg.maxDevices === 2) ? 2 : 3;
  const toggleCompare = (id) => {
    const cur = ui.compare || [];
    if (cur.includes(id)) set({ compare: cur.filter(x => x !== id) });
    else if (cur.length >= maxCompare) { ctx.showToast && ctx.showToast(`المقارنة لحد ${maxCompare} موبايلات بس — شيل واحد الأول`, 'warning'); }
    else set({ compare: [...cur, id] });
  };

  const enabledServices = orderedServices.filter(s => s.enabled);
  const svc = orderedServices.find(s => s.id === page);
  const title = page === 'hub' ? `كل خدمات ${cfg.title}` : page === 'phone' ? 'تفاصيل الموبايل' : (svc ? svc.title : cfg.title);
  const barStyle = resolveKaramboBarStyle(cfg);

  // Standalone Korombo World Shell — wraps any active service with dedicated Korombo Hero + Sidebar + Mobile Icon Dock
  const wrapKoromboPortal = (contentNode) => (
    <div id="korombo-standalone-hub" className="min-h-[85vh] bg-bg pb-20">
      {/* Dedicated Korombo Top Hero Banner */}
      <div style={barStyle} className="border-b shadow-lg">
        <div className="max-w-[1360px] mx-auto px-3 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <img src={cfg.mascotUrl || '/karambo.png'} alt="كرومبو" className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-white/60 shadow-lg bg-white/10 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black">{cfg.title}</span>
                <span className="text-[10px] font-bold opacity-85">{enabledServices.length} خدمة ذكية</span>
              </div>
              <h1 className="text-lg sm:text-2xl font-black leading-tight truncate mt-0.5">{title}</h1>
              <p className="text-[11px] font-bold opacity-90 line-clamp-1">{(svc && svc.desc) || cfg.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => go('hub')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition ${page === 'hub' ? 'bg-white text-[#1D4ED8] border-white shadow' : 'bg-white/15 hover:bg-white/25 text-white border-white/30'}`}
            >
              <LayoutGrid className="w-4 h-4" /> كل الخدمات
            </button>
            <button
              type="button"
              onClick={() => setClientTab('home')}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-black/25 hover:bg-black/35 text-white border border-white/25 text-xs font-black transition"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" /> العودة للمتجر
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Icon Dock (Quick Access to all 11 Korombo Services) */}
      <div className="lg:hidden bg-surface border-b border-line px-3 py-2.5 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black text-muted">خدمات {cfg.title} ({enabledServices.length})</span>
          <button type="button" onClick={() => set({ mobileNavOpen: !ui.mobileNavOpen })} className="text-[11px] font-black text-[#2563EB]">
            {ui.mobileNavOpen ? 'إغلاق القائمة ▲' : 'عرض الكل بالصور ▼'}
          </button>
        </div>
        {ui.mobileNavOpen ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-1">
            {enabledServices.map(s => {
              const Icon = ICONS[s.icon] || Sparkles;
              const active = page === s.id;
              return (
                <button key={s.id} type="button" onClick={() => { go(s.id, { mobileNavOpen: false }); }} className={`flex items-center gap-2 p-2 rounded-2xl border text-start transition ${active ? 'bg-[#2563EB] text-white border-[#2563EB] shadow' : 'bg-surface2 border-line text-fg'}`}>
                  <span className={`w-8 h-8 rounded-xl ${active ? 'bg-white/20' : s.color} flex items-center justify-center shrink-0`}><Icon className="w-4 h-4 text-white" /></span>
                  <span className="text-[11px] font-black leading-tight line-clamp-2">{s.title}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
            {enabledServices.map(s => {
              const Icon = ICONS[s.icon] || Sparkles;
              const active = page === s.id;
              return (
                <button key={s.id} type="button" onClick={() => go(s.id)} className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border text-[11px] font-black transition ${active ? 'bg-[#2563EB] text-white border-[#2563EB] shadow' : 'bg-surface2 border-line text-fg'}`}>
                  <span className={`w-6 h-6 rounded-lg ${active ? 'bg-white/20' : s.color} flex items-center justify-center`}><Icon className="w-3.5 h-3.5 text-white" /></span>
                  <span className="whitespace-nowrap">{s.title}</span>
                  {s.badge && <span className="px-1 py-0.5 rounded bg-amber-400 text-slate-900 text-[8px] font-black">{s.badge}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Standalone 2-Column Workspace: Sticky Korombo Sidebar + Active Service Stage */}
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6 py-5 grid lg:grid-cols-[275px_1fr] gap-5 items-start">
        {/* Desktop Persistent Korombo Services Sidebar */}
        <aside className="hidden lg:block sticky top-5 bg-surface border border-line rounded-3xl p-3 space-y-1.5 shadow-sm">
          <div className="px-2.5 py-2 flex items-center justify-between border-b border-line mb-1">
            <span className="text-xs font-black text-fg">كل خدمات {cfg.title}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#2563EB]/12 text-[#2563EB] text-[10px] font-black">{enabledServices.length}</span>
          </div>
          {enabledServices.map(s => {
            const Icon = ICONS[s.icon] || Sparkles;
            const active = page === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => go(s.id)}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-2xl text-start transition border ${active ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-md' : 'bg-transparent hover:bg-surface2 border-transparent text-fg'}`}
              >
                <span className={`w-9 h-9 rounded-xl ${active ? 'bg-white/20' : s.color} flex items-center justify-center shrink-0 shadow-sm`}>
                  <Icon className="w-4 h-4 text-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black truncate">{s.title}</span>
                    {s.badge && <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black shrink-0 ${active ? 'bg-white text-[#1D4ED8]' : 'bg-amber-400 text-slate-900'}`}>{s.badge}</span>}
                  </div>
                  <div className={`text-[10px] font-bold truncate ${active ? 'text-blue-100' : 'text-muted'}`}>{s.desc}</div>
                </div>
              </button>
            );
          })}
          {cfg.disclaimer && (
            <div className="mt-2 p-2.5 rounded-2xl bg-surface2/70 border border-line text-[10px] font-bold text-muted leading-relaxed">
              {cfg.disclaimer}
            </div>
          )}
        </aside>

        {/* Active Service Main Canvas */}
        <main className="min-w-0 space-y-4">
          {contentNode}
        </main>
      </div>
      {floatingCompareBar}
    </div>
  );

  const header = null;

  // Floating Compare Bar (Suggestion #5)
  const queuedComparePhones = (ui.compare || []).map(id => phones.find(p => p.id === id)).filter(Boolean);
  const floatingCompareBar = queuedComparePhones.length > 0 && page !== 'compare' ? (
    <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:end-6 z-40 max-w-md bg-surface/95 backdrop-blur-md border-2 border-violet-500 rounded-2xl shadow-2xl p-2.5 flex items-center gap-2.5">
      <div className="flex -space-x-2 rtl:space-x-reverse">
        {queuedComparePhones.map(p => (
          <div key={p.id} className="w-9 h-9 rounded-xl bg-white border border-line overflow-hidden flex items-center justify-center shrink-0">
            {p.images && p.images[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-contain" /> : <Smartphone className="w-4 h-4 text-muted" />}
          </div>
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-black text-fg">جاهز للمقارنة ({queuedComparePhones.length}/{maxCompare})</div>
        <div className="text-[10px] font-bold text-muted truncate">{queuedComparePhones.map(p => p.name).join(' · ')}</div>
      </div>
      <button type="button" onClick={() => go('compare')} className="px-3 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black shrink-0">قارن الآن</button>
      <button type="button" onClick={() => set({ compare: [] })} className="p-1.5 rounded-lg text-muted hover:text-rose-600" title="مسح"><X className="w-4 h-4" /></button>
    </div>
  ) : null;

  if (page !== 'phone' && page !== 'hub' && svc && !svcEnabled(cfg, page)) {
    return wrapKoromboPortal(<div className="bg-surface border border-line rounded-3xl p-10 text-center text-muted font-bold">الخدمة دي متوقفة مؤقتًا من الإدارة</div>);
  }

  // ---------- 0. HUB OVERVIEW (ALL 11 SERVICES VISUAL GRID) ----------
  if (page === 'hub') {
    return wrapKoromboPortal(
      <div className="space-y-4">
        <div className="bg-surface border border-line rounded-3xl p-5 flex items-center gap-4 flex-wrap">
          <img src={cfg.mascotUrl || '/karambo.png'} alt="كرومبو" className="w-16 h-16 rounded-2xl object-cover border border-line bg-[#2563EB]" />
          <div className="flex-1 min-w-[200px]">
            <h2 className="text-lg font-black text-fg">أهلاً بك في عالم {cfg.title} المستقل</h2>
            <p className="text-xs font-bold text-muted mt-0.5">{cfg.subtitle}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {enabledServices.map(s => {
            const Icon = ICONS[s.icon] || Sparkles;
            return (
              <button key={s.id} type="button" onClick={() => go(s.id)} className="relative group bg-surface border border-line hover:border-[#2563EB] rounded-3xl p-4 text-start flex items-start gap-3 transition hover:-translate-y-0.5 shadow-sm">
                {s.badge && <span className="absolute top-3 end-3 px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[9px] font-black">{s.badge}</span>}
                <span className={`w-12 h-12 rounded-2xl ${s.color} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition`}><Icon className="w-6 h-6 text-white" /></span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-sm font-black text-fg group-hover:text-[#2563EB]">{s.title}</div>
                  <div className="text-xs font-bold text-muted leading-relaxed">{s.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------- 0b. STORE & PLATFORM REVIEWS (#11 — ALL 22 IDEAS) ----------
  if (page === 'reviews') {
    return wrapKoromboPortal(
      <KaramboStoreReviewsView
              currentClient={ctx.currentClient}
              onRequireAuth={(tab = 'login') => {
                if (ctx.setAuthModalTab) ctx.setAuthModalTab(tab);
                if (ctx.setLoginModalOpen) ctx.setLoginModalOpen(true);
              }}
              onEnsureStoreEntity={ctx.ensureStoreEntity}
        cfg={cfg}
        entities={ctx.storeReviewEntities || []}
        entries={ctx.storeReviewEntries || []}
        questions={ctx.storeReviewQuestions || []}
        onSubmitReview={ctx.submitStoreReview}
        onVoteHelpful={ctx.voteReviewHelpful}
        onSubmitStore={ctx.submitStoreEntity}
        onSubmitQuestion={ctx.submitStoreQuestion}
        onSubmitAnswer={ctx.submitStoreAnswer}
        onGoToStore={() => { setClientTab('home'); window.scrollTo({ top: 0 }); }}
        showToast={ctx.showToast}
      />
    );
  }

  // ---------- 1. GUIDE LIST (ALL GLOBAL MODELS + LIVE EGYPT PRICE + NEWS BANNER) ----------
  if (page === 'guide') {
    return wrapKoromboPortal(
      <div className="space-y-4">
        <KaramboLiveGuideView
          cfg={cfg}
          localPhones={phones}
          compareIds={ui.compare || []}
          formatMoney={formatMoney}
          showToast={ctx.showToast}
          onOpenPhone={(dev) => {
            if (ctx.trackKaramboEvent) ctx.trackKaramboEvent('phone_view', dev.name);
            go('phone', { phoneId: dev.id, activeGsmPhone: dev, imgIdx: 0 });
          }}
          onToggleCompare={toggleCompare}
          onOpenNews={(article) => go('news', { activeNewsArticle: article || null })}
          onOpenComparePage={(slugs) => go('compare', { compareSlugs: slugs })}
          renderLocalPhoneCard={(p) => PhoneCard(ctx, p, { onToggleCompare: toggleCompare })}
        />
      </div>
    );
  }

  // ---------- 1b. LATEST NEWS ("آخر الأخبار") ----------
  if (page === 'news') {
    return wrapKoromboPortal(
      <div className="space-y-4">
        <KaramboNewsView cfg={cfg} initialArticle={ui.activeNewsArticle || null} />
      </div>
    );
  }

  // ---------- 2. PHONE DETAIL ----------
  if (page === 'phone') {
    const phone = (ui.activeGsmPhone && ui.activeGsmPhone.id === ui.phoneId ? ui.activeGsmPhone : null) || phones.find(p => p.id === ui.phoneId) || ui.activeGsmPhone || phones[0];
    if (!phone) return <div className="max-w-[1100px] mx-auto px-3 py-6 space-y-4">{header}<div className="bg-surface border border-line rounded-3xl p-10 text-center text-muted font-bold">لسه مفيش أجهزة في الدليل</div></div>;
    const imgIdx = Math.min(ui.imgIdx || 0, Math.max(0, (phone.images || []).length - 1));
    const hist = phone.priceHistory || [];
    const accData = matchAccessoriesForPhone(ctx, phone);
    const accessories = [...accData.modelSpecific, ...accData.chargersAndCables].slice(0, 8);
    const similarPhones = phones
      .filter(p => p.id !== phone.id && p.price > 0 && phone.price > 0)
      .sort((a, b) => Math.abs(a.price - phone.price) - Math.abs(b.price - phone.price))
      .slice(0, 4);

    const sharePhoneWhatsApp = () => {
      const msg = `📱 *${phone.name}*\n💰 سعر السوق الاسترشادي: ${formatMoney(phone.price || 0)}\n⭐ تقييم كرومبو: ${phone.valueScore || 0}/100\n🔗 شاهد التفاصيل والمواصفات على ELZOGHBI MARKET`;
      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank', 'noopener,noreferrer');
    };

    return wrapKoromboPortal(
      <div className="space-y-4">
        <KaramboPhoneHydrator
          phone={phone}
          genEditorial={genGuideEditorial}
          onHydrated={(hydrated) => set({ activeGsmPhone: hydrated })}
        />
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="bg-surface border border-line rounded-3xl p-4 space-y-3">
            <div className="relative bg-white dark:bg-[#0D1528] rounded-2xl aspect-[4/3] flex items-center justify-center overflow-hidden">
              {phone.images && phone.images[imgIdx] ? <img src={phone.images[imgIdx]} alt={phone.name} referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="max-h-full max-w-full object-contain" /> : <Smartphone className="w-16 h-16 text-muted" />}
              <span className="absolute top-2 start-2 px-2 py-0.5 rounded-full bg-[#2563EB] text-white text-[10px] font-black">{phone.brand}</span>
            </div>
            {(phone.images || []).length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {phone.images.map((im, i) => (
                  <button key={i} type="button" onClick={() => set({ imgIdx: i })} className={`w-16 h-16 rounded-xl border-2 overflow-hidden bg-white shrink-0 ${i === imgIdx ? 'border-[#2563EB]' : 'border-line'}`}><img src={im} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-contain" /></button>
                ))}
              </div>
            )}
            <div className="rounded-2xl bg-surface2 border border-line p-3.5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-black text-muted">سعر السوق الاسترشادي{phone.priceDate ? ` · آخر مراجعة ${phone.priceDate}` : ''}</span>
                <ValueBadge score={phone.valueScore} />
              </div>
              <div className="space-y-1">
                {(phone.variants || []).length > 0 ? (phone.variants || []).map((v, i) => (
                  <div key={i} className="flex items-center justify-between text-sm font-bold"><span className="text-muted">{v.label}</span><span className="font-black text-[#2563EB] dark:text-[#60A5FA]">{formatMoney(v.price)}</span></div>
                )) : phone.price > 0 ? (
                  <div className="flex items-center justify-between text-sm font-bold"><span className="text-muted">السعر في مصر</span><span className="font-black text-emerald-600 dark:text-emerald-400">{formatMoney(phone.price)}</span></div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-black text-rose-600 dark:text-rose-400">
                    {(cfg.guideCfg && cfg.guideCfg.notInEgyptLabel) || 'غير متوفر في مصر حالياً'}
                  </div>
                )}
              </div>
              {hist.length > 1 && (
                <div className="pt-1 border-t border-line">
                  <div className="text-[11px] font-black text-muted mb-1">تاريخ السعر عندنا</div>
                  {hist.slice(-4).map((h, i) => <div key={i} className="flex justify-between text-[11px] font-bold text-muted"><span>{h.date}</span><span>{formatMoney(h.price)}</span></div>)}
                </div>
              )}
            </div>

            {/* Primary Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {cfg.guideCfg.allowPriceAlerts !== false && (
                <button type="button" onClick={() => set({ alertOpen: !ui.alertOpen })} className="inline-flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-xs font-black transition"><Bell className="w-4 h-4" /> نبّهني لو نزل</button>
              )}
              {cfg.guideCfg.allowImportCta !== false && (
                <button type="button" onClick={() => { ctx.openSourcing && ctx.openSourcing(); setTimeout(() => { ctx.setSrcForm && ctx.setSrcForm(p => ({ ...p, name: phone.name, desc: `طلب استيراد جهاز: ${phone.name} — سعر السوق الاسترشادي حاليًا ${formatMoney(phone.price)}` })); }, 60); }} className="inline-flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-black transition"><PhoneCall className="w-4 h-4" /> اطلبه استيراد</button>
              )}
              <button type="button" onClick={() => { toggleCompare(phone.id); go('compare'); }} className="inline-flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-black transition"><Scale className="w-4 h-4" /> قارن الآن</button>
              <button type="button" onClick={() => go('installment', { instPhoneId: phone.id, instPrice: String(phone.price || '') })} className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-surface2 border border-line hover:border-cyan-500 text-fg text-xs font-black transition"><Calculator className="w-3.5 h-3.5 text-cyan-600" /> احسب قسطه</button>
              <button type="button" onClick={() => go('gulf', { gulfPhoneId: phone.id })} className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-surface2 border border-line hover:border-indigo-500 text-fg text-xs font-black transition"><Globe className="w-3.5 h-3.5 text-indigo-500" /> احسبه من الخليج</button>
              <button type="button" onClick={sharePhoneWhatsApp} className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600/15 hover:bg-emerald-600 hover:text-white text-emerald-700 dark:text-emerald-300 text-xs font-black transition"><Share2 className="w-3.5 h-3.5" /> مشاركة واتساب</button>
            </div>

            {ui.alertOpen && (
              <form onSubmit={async (e) => { e.preventDefault(); const ok = await ctx.submitPriceAlert(phone, ui.alertName || '', ui.alertContact || ''); if (ok) set({ alertOpen: false, alertName: '', alertContact: '' }); }} className="rounded-2xl border border-amber-300/60 bg-amber-50 dark:bg-amber-500/10 p-3.5 space-y-2">
                <div className="text-xs font-black text-fg">سيب بياناتك وهنبعت لك أول ما سعر {phone.name} ينزل في السوق</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  <input required value={ui.alertName || ''} onChange={e => set({ alertName: e.target.value })} placeholder="اسمك" className="px-3 py-2 rounded-xl border border-line bg-surface text-sm font-bold w-full" />
                  <input required value={ui.alertContact || ''} onChange={e => set({ alertContact: e.target.value })} placeholder="رقم واتساب / موبايل" className="px-3 py-2 rounded-xl border border-line bg-surface text-sm font-bold w-full" />
                </div>
                <button type="submit" className="w-full py-2 rounded-xl bg-amber-500 text-white text-xs font-black">فعّل التنبيه</button>
              </form>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-surface border border-line rounded-3xl p-4">
              <h2 className="text-xl font-black text-fg">{phone.name}</h2>
              <p className="text-sm font-bold text-muted mt-1 leading-relaxed">{phone.verdict}</p>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-3">
                  <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mb-1.5">اللي يميّزه</div>
                  <ul className="space-y-1">{(phone.pros || []).map((x, i) => <li key={i} className="flex gap-1.5 text-xs font-bold text-fg"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />{x}</li>)}</ul>
                </div>
                <div className="rounded-2xl bg-rose-500/10 border border-rose-500/25 p-3">
                  <div className="text-xs font-black text-rose-600 dark:text-rose-400 mb-1.5">خد بالك من</div>
                  <ul className="space-y-1">{(phone.cons || []).map((x, i) => <li key={i} className="flex gap-1.5 text-xs font-bold text-fg"><X className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />{x}</li>)}</ul>
                </div>
              </div>
            </div>
            <div className="bg-surface border border-line rounded-3xl p-4 space-y-4">
              <h3 className="font-black text-fg">المواصفات الكاملة</h3>
              {(phone.specs || []).map((grp, gi) => (
                <div key={gi}>
                  <div className="text-xs font-black text-[#2563EB] dark:text-[#60A5FA] mb-1.5">{grp.group}</div>
                  <div className="rounded-xl overflow-hidden border border-line">
                    {grp.rows.map((r, ri) => (
                      <div key={ri} className={`flex justify-between gap-3 px-3 py-1.5 text-xs font-bold ${ri % 2 ? 'bg-surface2/60' : ''}`}><span className="text-muted shrink-0">{r[0]}</span><span className="text-fg text-end">{r[1]}</span></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {accessories.length > 0 && (
          <div className="bg-surface border border-line rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-black text-fg">إكسسواراته عندنا <span className="text-xs text-muted font-bold">— منتجات للبيع فعلًا من متجرنا</span></h3>
              <button type="button" onClick={() => go('compatibility', { compatPhone: phone })} className="text-xs font-black text-teal-600 hover:underline">عرض كل المتوافق مع {phone.name} ←</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {accessories.map((part, i) => (
                <button key={part.id || i} type="button" onClick={() => ctx.setSelectedDetailItem && ctx.setSelectedDetailItem(part)} className="text-start bg-surface2/60 border border-line rounded-2xl p-2.5 hover:border-[#3B82F6] transition">
                  <div className="aspect-square rounded-xl bg-white dark:bg-[#0D1528] flex items-center justify-center overflow-hidden mb-2">{part.image ? <img src={part.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" /> : <Smartphone className="w-8 h-8 text-muted" />}</div>
                  <div className="text-[11px] font-black text-fg line-clamp-2 leading-snug">{part.name}</div>
                  <div className="text-xs font-black text-[#2563EB] dark:text-[#60A5FA] mt-1">{formatMoney(partPrice(ctx, part))}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {similarPhones.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="font-black text-fg">بدائل قريبة في نفس الفئة السعرية</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{similarPhones.map(p => PhoneCard(ctx, p, { onToggleCompare: toggleCompare }))}</div>
          </div>
        )}
      </div>
    );
  }

  // ---------- 3. COMPARE (LIVE GSMARENA + LOCAL) ----------
  if (page === 'compare') {
    return wrapKoromboPortal(
      <div className="space-y-4">
        <GsmarenaCompareView
          cfg={cfg}
          localPhones={phones}
          initialIds={ui.compare || []}
          initialSlugs={ui.compareSlugs || []}
          formatMoney={formatMoney}
          showToast={ctx.showToast}
          onOpenPhoneDetail={(id) => go('phone', { phoneId: id })}
          onOpenCompatibility={(dev) => go('compatibility', { compatPhone: dev })}
          onOpenSourcing={(dev) => {
            ctx.openSourcing && ctx.openSourcing();
            setTimeout(() => {
              ctx.setSrcForm && ctx.setSrcForm(p => ({ ...p, name: dev.name, desc: `طلب استيراد جهاز من مقارنة كرومبو: ${dev.name}` }));
            }, 60);
          }}
          onSyncCompareIds={(ids) => {
            const prevStr = JSON.stringify(ui.compare || []);
            const nextStr = JSON.stringify(ids || []);
            if (prevStr !== nextStr) set({ compare: ids });
          }}
          onTrackEvent={ctx.trackKaramboEvent}
        />
      </div>
    );
  }

  // ---------- 4. CHOOSE (LIVE MARKET ADVISOR) ----------
  if (page === 'choose') {
    return wrapKoromboPortal(
      <div className="space-y-4">
        <KaramboLiveAdvisorView
          cfg={cfg}
          localPhones={phones}
          formatMoney={formatMoney}
          onOpenPhone={(id) => go('phone', { phoneId: id })}
          onToggleCompare={toggleCompare}
          onCompareIds={(ids) => go('compare', { compare: ids })}
          renderLocalPhoneCard={(p) => PhoneCard(ctx, p, { onToggleCompare: toggleCompare })}
        />
      </div>
    );
  }

  // ---------- 5. COMPATIBILITY CHECKER (NEW SERVICE #8 / SUGGESTION #1) ----------
  if (page === 'compatibility') {
    const selectedPhone = ui.compatPhone || (ui.compatPhoneId ? phones.find(p => p.id === ui.compatPhoneId) : null) || null;
    const matched = selectedPhone ? matchAccessoriesForPhone(ctx, selectedPhone) : { modelSpecific: [], chargersAndCables: [], universalExtras: [], portLabel: 'USB Type-C', neededW: 0 };

    const renderPartMini = (part, i) => (
      <div key={part.id || i} className="bg-surface border border-line rounded-2xl p-3 flex flex-col gap-2 hover:border-teal-500 transition">
        <button type="button" onClick={() => ctx.setSelectedDetailItem && ctx.setSelectedDetailItem(part)} className="aspect-square rounded-xl bg-white dark:bg-[#0D1528] flex items-center justify-center overflow-hidden">
          {part.image ? <img src={part.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" /> : <Package className="w-8 h-8 text-muted" />}
        </button>
        <div className="text-xs font-black text-fg line-clamp-2 leading-snug">{part.name}</div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-sm font-black text-teal-600 dark:text-teal-400">{formatMoney(partPrice(ctx, part))}</span>
          <button type="button" onClick={() => ctx.setSelectedDetailItem && ctx.setSelectedDetailItem(part)} className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-black">عرض وشراء</button>
        </div>
      </div>
    );

    return wrapKoromboPortal(
      <div className="space-y-4">
        <div className="bg-surface border border-line rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="text-xs font-black text-muted">اختار موبايلك عشان كرومبو يفلتر لك كل الجرابات والشواحن والاسكرينات والقطع المتوافقة معاه في متجرنا</div>
          <GsmarenaPhonePicker
            value={selectedPhone}
            localPhones={phones}
            fetchFullSpecs={true}
            gsmarenaLive={cfg.compareCfg.gsmarenaLive !== false}
            formatMoney={formatMoney}
            showToast={ctx.showToast}
            placeholder="ابحث عن أي موبايل في العالم لفحص إكسسواراته وشاحنه المناسب..."
            onSelect={(dev) => set({ compatPhoneId: dev.id, compatPhone: dev })}
            onClear={() => set({ compatPhoneId: '', compatPhone: null })}
          />
          {selectedPhone && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-line text-xs font-bold">
              <span className="px-2.5 py-1 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 font-black">المنفذ المتوقع: {matched.portLabel}</span>
              {matched.neededW > 0 && <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black">الشحن المدعوم: {matched.neededW} وات</span>}
              {selectedPhone.screen && <span className="px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 font-black">حجم الشاشة: {selectedPhone.screen} بوصة</span>}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2.5">
            <h3 className="font-black text-fg">جرابات واسكرينات وقطع متوافقة مع {selectedPhone ? selectedPhone.name : 'جهازك'} ({matched.modelSpecific.length})</h3>
            {matched.modelSpecific.length === 0 ? (
              <div className="bg-surface border border-line rounded-2xl p-6 text-center text-xs font-bold text-muted">لا توجد قطع مخصصة بالاسم حالياً — تقدر تطلبها من خدمة «اطلب منتجك» وهنوفرهالك</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{matched.modelSpecific.map(renderPartMini)}</div>
            )}
          </div>

          {matched.chargersAndCables.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="font-black text-fg">شواحن وكابلات مناسبة ({matched.portLabel}{matched.neededW ? ` · ${matched.neededW}W+` : ''})</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{matched.chargersAndCables.map(renderPartMini)}</div>
            </div>
          )}

          {matched.universalExtras.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="font-black text-fg">سماعات وإكسسوارات ذكية متوافقة</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{matched.universalExtras.map(renderPartMini)}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- 6. BUDGET (STORE PRODUCTS + SMART BUNDLE BUILDER) ----------
  if (page === 'budget') {
    const budgets = (cfg.guideCfg && cfg.guideCfg.storeBudgets && cfg.guideCfg.storeBudgets.length) ? cfg.guideCfg.storeBudgets : [500, 1000, 2000, 5000, 10000];
    const budget = Number(ui.storeBudget || budgets[2] || 2000);
    const catFilter = ui.budgetCat || 'ALL';
    const bSort = ui.budgetSort || 'closest';

    const pricedAll = (ctx.publicParts || []).map(p => {
      const info = partPriceInfo(ctx, p);
      return { p, price: Number(info.baseEgpPrice) || 0, oldPrice: Number(info.oldBaseEgpPrice) || 0, hasDiscount: !!info.hasDiscount };
    }).filter(x => x.price > 0 && x.price <= budget);

    const cats = ['ALL', ...new Set(pricedAll.map(x => x.p.category).filter(Boolean))];
    let parts = pricedAll.filter(x => catFilter === 'ALL' || x.p.category === catFilter);
    parts = [...parts].sort((a, b) =>
      bSort === 'cheapest' ? a.price - b.price
        : bSort === 'discount' ? ((b.oldPrice - b.price) - (a.oldPrice - a.price))
        : b.price - a.price
    ).slice(0, 32);

    // Smart Bundle Builder: pick up to 3 items from distinct categories totaling <= budget
    const smartBundle = (() => {
      if (!cfg.guideCfg || cfg.guideCfg.enableBundleBuilder === false) return [];
      const byCat = new Map();
      pricedAll.forEach(item => {
        const c = item.p.category || 'عام';
        if (!byCat.has(c)) byCat.set(c, []);
        byCat.get(c).push(item);
      });
      const picked = [];
      let rem = budget;
      for (const [, arr] of byCat.entries()) {
        if (picked.length >= 3) break;
        const candidate = arr.filter(x => x.price <= rem).sort((a, b) => b.price - a.price)[0];
        if (candidate) { picked.push(candidate); rem -= candidate.price; }
      }
      return picked.length >= 2 ? picked : [];
    })();
    const bundleTotal = smartBundle.reduce((s, x) => s + x.price, 0);

    return wrapKoromboPortal(
      <div className="space-y-4">
        <div className="bg-surface border border-line rounded-3xl p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-muted">ميزانيتك:</span>
              <input type="number" min="50" step="50" value={budget} onChange={e => set({ storeBudget: Math.max(50, Number(e.target.value) || 0) })} className="w-28 px-3 py-1.5 rounded-xl border border-line bg-surface2 text-sm font-black text-fg" />
              <span className="text-xs font-black text-emerald-600">{formatMoney(budget)}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {budgets.map(b => <button key={b} type="button" onClick={() => set({ storeBudget: b })} className={`px-3 py-1.5 rounded-full text-xs font-black transition ${budget === b ? 'bg-emerald-600 text-white' : 'bg-surface2 text-fg border border-line'}`}>لحد {formatMoney(b)}</button>)}
            </div>
            <select value={bSort} onChange={e => set({ budgetSort: e.target.value })} className="ms-auto rounded-xl px-3 py-1.5 bg-surface2 border border-line text-xs font-black text-fg">
              <option value="closest">الأقرب لميزانيتك</option>
              <option value="cheapest">الأرخص أولاً</option>
              <option value="discount">الأعلى خصماً</option>
            </select>
          </div>
          {cats.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-1">
              {cats.map(c => <button key={c} type="button" onClick={() => set({ budgetCat: c })} className={`px-3 py-1 rounded-full text-[11px] font-black shrink-0 border ${catFilter === c ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-surface2 text-fg border-line'}`}>{c === 'ALL' ? `كل الأقسام (${pricedAll.length})` : c}</button>)}
            </div>
          )}
        </div>

        {/* Smart Bundle Suggestion */}
        {smartBundle.length >= 2 && (
          <div className="rounded-3xl bg-gradient-to-l from-emerald-600/15 to-teal-500/10 border border-emerald-500/30 p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="text-xs font-black text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> باكدج كرومبو المقترح على قد ميزانيتك</div>
                <div className="text-[11px] font-bold text-muted">{smartBundle.length} منتجات متنوعة بإجمالي {formatMoney(bundleTotal)} (هيتبقى معاك {formatMoney(Math.max(0, budget - bundleTotal))})</div>
              </div>
              {ctx.updateCartQty && (
                <button
                  type="button"
                  onClick={() => {
                    smartBundle.forEach(x => ctx.updateCartQty(x.p.id, 1));
                    ctx.showToast && ctx.showToast(`تمت إضافة الباكدج (${smartBundle.length} منتجات) للسلة!`, 'success');
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow transition"
                >
                  <ShoppingCart className="w-4 h-4" /> أضف الباكدج كامل للسلة
                </button>
              )}
            </div>
            <div className="grid sm:grid-cols-3 gap-2">
              {smartBundle.map(x => (
                <button key={x.p.id} type="button" onClick={() => ctx.setSelectedDetailItem && ctx.setSelectedDetailItem(x.p)} className="flex items-center gap-2.5 p-2 rounded-2xl bg-surface border border-line text-start">
                  {x.p.image ? <img src={x.p.image} alt="" className="w-10 h-10 object-contain bg-white rounded-lg shrink-0" /> : <Package className="w-8 h-8 text-muted shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-black text-fg truncate">{x.p.name}</div>
                    <div className="text-xs font-black text-emerald-600">{formatMoney(x.price)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {parts.length === 0 ? <div className="bg-surface border border-line rounded-3xl p-10 text-center text-muted font-bold">مفيش منتجات متاحة في الميزانية دي دلوقتي — جرّب تزود الميزانية شوية</div> : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">{parts.map((x, i) => ctx.renderProductCard ? ctx.renderProductCard(x.p, i) : null)}</div>
        )}
      </div>
    );
  }

  // ---------- 7. RADAR (LIVE STOCK-STYLE PRICE RADAR) ----------
  if (page === 'radar') {
    const storeDeals = (ctx.publicParts || []).map(p => {
      const info = partPriceInfo(ctx, p);
      return { p, price: Number(info.baseEgpPrice) || 0, oldPrice: Number(info.oldBaseEgpPrice) || 0, hasDiscount: !!info.hasDiscount };
    }).filter(x => x.hasDiscount && x.oldPrice > x.price).sort((a, b) => ((b.oldPrice - b.price) - (a.oldPrice - a.price))).slice(0, 8);
    return wrapKoromboPortal(
      <div className="space-y-4">
        <KaramboLiveRadarView
          cfg={cfg}
          localPhones={phones}
          storeDeals={storeDeals}
          formatMoney={formatMoney}
          onOpenPhone={(id) => go('phone', { phoneId: id })}
          onSelectStorePart={(part) => ctx.setSelectedDetailItem && ctx.setSelectedDetailItem(part)}
          renderLocalPhoneCard={(p) => PhoneCard(ctx, p, { onToggleCompare: toggleCompare })}
        />
      </div>
    );
  }

  // ---------- 8. INSTALLMENT (PLANS, DOWN PAYMENT, ADMIN FEE & FULL SCHEDULE TABLE) ----------
  if (page === 'installment') {
    const plans = cfg.installmentPlans && cfg.installmentPlans.length ? cfg.installmentPlans : [{ id: 'default', name: 'خطة افتراضية', annualRatePct: cfg.installmentRatePct || 0, adminFeePct: 0, minDownPct: 0, months: [6, 12, 18, 24, 36] }];
    const activePlan = plans.find(pl => pl.id === ui.instPlanId) || plans[0];
    const price = parseFloat(ui.instPrice) || 0;
    const minDown = Math.round(price * ((activePlan.minDownPct || 0) / 100));
    const downPayment = Math.min(price, Math.max(0, ui.instDown !== undefined && ui.instDown !== '' ? (parseFloat(ui.instDown) || 0) : minDown));
    const financed = Math.max(0, price - downPayment);
    const adminFee = Math.round(financed * ((activePlan.adminFeePct || 0) / 100));
    const availMonths = Array.isArray(activePlan.months) && activePlan.months.length ? activePlan.months : [6, 12, 18, 24, 36];
    const months = availMonths.includes(ui.instMonths) ? ui.instMonths : availMonths[0];
    const rate = Number(activePlan.annualRatePct || 0);

    const calcForMonths = (m) => {
      const interest = financed * (rate / 100) * (m / 12);
      const totalFinanced = financed + interest + adminFee;
      const monthly = m > 0 ? totalFinanced / m : 0;
      const grandTotal = downPayment + totalFinanced;
      return { m, interest: Math.round(interest), adminFee, monthly: Math.round(monthly), grandTotal: Math.round(grandTotal) };
    };
    const activeCalc = calcForMonths(months);
    const selectedPhoneObj = ui.instPhoneObj || phones.find(p => p.id === ui.instPhoneId) || null;
    const waNum = storeWhatsappNumber(ctx, cfg.installmentWhatsApp);

    const sendInstallmentWA = () => {
      const itemLabel = selectedPhoneObj ? selectedPhoneObj.name : 'منتج/جهاز';
      const txt = `مرحباً 👋 أرغب في الاستفسار عن التقسيط:\n• المنتج: ${itemLabel}\n• السعر: ${formatMoney(price)}\n• خطة التقسيط: ${activePlan.name}\n• المقدم: ${formatMoney(downPayment)}\n• المدة: ${months} شهر\n• القسط التقريبي: ${formatMoney(activeCalc.monthly)} / شهر`;
      window.open(`https://wa.me/${waNum}?text=${encodeURIComponent(txt)}`, '_blank', 'noopener,noreferrer');
    };

    return wrapKoromboPortal(
      <div className="space-y-4">
        <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
          {/* Plan selector */}
          <div>
            <div className="text-xs font-black text-muted mb-2">اختار جهة / خطة التقسيط</div>
            <div className="flex flex-wrap gap-1.5">
              {plans.map(pl => (
                <button key={pl.id} type="button" onClick={() => set({ instPlanId: pl.id, instDown: '' })} className={`px-3.5 py-2 rounded-2xl text-xs font-black border transition ${activePlan.id === pl.id ? 'bg-cyan-600 text-white border-cyan-600 shadow' : 'bg-surface2 border-line text-fg'}`}>
                  {pl.name} <span className="opacity-80 text-[10px]">({pl.annualRatePct}%)</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <GsmarenaPhonePicker
                label="اختار أي موبايل من الكتالوج العالمي أو الدليل"
                value={selectedPhoneObj}
                localPhones={phones}
                fetchFullSpecs={false}
                gsmarenaLive={cfg.compareCfg.gsmarenaLive !== false}
                formatMoney={formatMoney}
                showToast={ctx.showToast}
                compact={true}
                placeholder="ابحث عن أي موبايل..."
                onSelect={(dev) => set({ instPhoneId: dev.id, instPhoneObj: dev, instPrice: dev.price ? String(dev.price) : (ui.instPrice || ''), instDown: '' })}
                onClear={() => set({ instPhoneId: '', instPhoneObj: null })}
              />
            </div>
            <div>
              <label className="text-xs font-black text-muted block mb-1.5">السعر الكاش (جنيه)</label>
              <input type="number" min="0" value={ui.instPrice || ''} onChange={e => set({ instPrice: e.target.value, instPhoneId: '' })} placeholder="مثال: 25000" className="w-full rounded-2xl px-3 py-2.5 bg-surface2 border border-line text-sm font-black text-fg" />
            </div>
          </div>

          {/* Down Payment */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-black text-muted">المقدم (أقل مقدم للخطة: {activePlan.minDownPct || 0}%)</label>
              <div className="flex gap-1">
                {[0, 10, 20, 30].map(pct => (
                  <button key={pct} type="button" onClick={() => set({ instDown: String(Math.round(price * pct / 100)) })} className="px-2 py-0.5 rounded-lg bg-surface2 border border-line text-[10px] font-black text-fg hover:border-cyan-500">{pct}%</button>
                ))}
              </div>
            </div>
            <input type="number" min="0" max={price || undefined} value={ui.instDown !== undefined ? ui.instDown : (minDown || '')} onChange={e => set({ instDown: e.target.value })} placeholder="0" className="w-full rounded-2xl px-3 py-2.5 bg-surface2 border border-line text-sm font-black text-fg" />
          </div>

          {/* Months selector */}
          <div>
            <div className="text-xs font-black text-muted mb-1.5">عدد الشهور</div>
            <div className="flex flex-wrap gap-1.5">{availMonths.map(m => <button key={m} type="button" onClick={() => set({ instMonths: m })} className={`px-4 py-2 rounded-full text-xs font-black transition ${months === m ? 'bg-cyan-600 text-white' : 'bg-surface2 text-fg border border-line'}`}>{m} شهر</button>)}</div>
          </div>

          {price > 0 && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-cyan-600/10 border border-cyan-600/25 p-4 text-center space-y-1.5">
                <div className="text-xs font-black text-muted">قسطك الشهري التقريبي ({activePlan.name})</div>
                <div className="text-3xl font-black text-cyan-700 dark:text-cyan-300">{formatMoney(activeCalc.monthly)} <span className="text-sm">/ شهر</span></div>
                <div className="flex flex-wrap justify-center gap-3 text-[11px] font-bold text-muted pt-1">
                  <span>المقدم: <strong className="text-fg">{formatMoney(downPayment)}</strong></span>
                  <span>مصاريف إدارية: <strong className="text-fg">{formatMoney(activeCalc.adminFee)}</strong></span>
                  <span>الإجمالي الكلي: <strong className="text-fg">{formatMoney(activeCalc.grandTotal)}</strong></span>
                </div>
                <div className="pt-2">
                  <button type="button" onClick={sendInstallmentWA} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition">
                    <MessageSquare className="w-4 h-4" /> ابعت الحسبة لخدمة العملاء على واتساب
                  </button>
                </div>
              </div>

              {/* Comparison table across all available durations */}
              {availMonths.length > 1 && (
                <div className="rounded-2xl border border-line overflow-x-auto">
                  <table className="w-full text-xs font-bold">
                    <thead>
                      <tr className="bg-surface2 text-muted border-b border-line">
                        <th className="p-2.5 text-start">المدة</th>
                        <th className="p-2.5 text-start">القسط الشهري</th>
                        <th className="p-2.5 text-start">المصاريف + الفوائد</th>
                        <th className="p-2.5 text-start">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availMonths.map(m => {
                        const c = calcForMonths(m);
                        return (
                          <tr key={m} onClick={() => set({ instMonths: m })} className={`cursor-pointer border-t border-line/60 ${m === months ? 'bg-cyan-600/10 font-black' : 'hover:bg-surface2/50'}`}>
                            <td className="p-2.5 text-fg">{m} شهر</td>
                            <td className="p-2.5 text-cyan-700 dark:text-cyan-300 font-black">{formatMoney(c.monthly)}</td>
                            <td className="p-2.5 text-muted">{formatMoney(c.interest + c.adminFee)}</td>
                            <td className="p-2.5 text-fg">{formatMoney(c.grandTotal)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          <p className="text-[11px] font-bold text-muted leading-relaxed">{cfg.installmentDisclaimer}</p>
        </div>
      </div>
    );
  }

  // ---------- 9. GULF VS EGYPT (AUTO UAE/KSA + EGYPT PRICES + CUSTOMS WARNING) ----------
  if (page === 'gulf') {
    const initPh = ui.gulfPhoneObj || (ui.gulfPhoneId ? phones.find(p => p.id === ui.gulfPhoneId) : null) || null;
    return wrapKoromboPortal(
      <div className="space-y-4">
        <KaramboGulfView
          cfg={cfg}
          localPhones={phones}
          initialPhone={initPh}
          formatMoney={formatMoney}
          showToast={ctx.showToast}
          onOpenSourcing={(name, desc) => {
            ctx.openSourcing && ctx.openSourcing();
            setTimeout(() => { ctx.setSrcForm && ctx.setSrcForm(p => ({ ...p, name, desc })); }, 60);
          }}
        />
      </div>
    );
  }

  // ---------- 10. TRADE-IN / SELL YOUR OLD PHONE (AUTO EGYPT PRICE) ----------
  if (page === 'tradein') {
    const waNum = storeWhatsappNumber(ctx, cfg.tradeInCfg && cfg.tradeInCfg.whatsapp);
    return wrapKoromboPortal(
      <div className="space-y-4">
        <KaramboTradeInView
          cfg={cfg}
          localPhones={phones}
          formatMoney={formatMoney}
          showToast={ctx.showToast}
          whatsappNumber={waNum}
        />
      </div>
    );
  }

  return wrapKoromboPortal(<div className="bg-surface border border-line rounded-3xl p-8 text-center text-muted font-bold">اختر أي خدمة من القائمة الجانبية</div>);
}
