// Karambo service PAGES (guide / compare / chooser / budget / radar /
// calculators / live views) — split from Karambo.jsx on the hardening branch
// so the home page only ships the strip; these pages load on demand via
// React.lazy in App.jsx. Shared helpers live in ./Karambo.jsx.
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
import EgyptPriceReveal from '../components/EgyptPriceReveal.jsx';
import AccessoryPreloader from '../components/AccessoryPreloader.jsx';
import GsmarenaCompareView from '../components/GsmarenaCompareView.jsx';
import GsmarenaPhonePicker from '../components/GsmarenaPhonePicker.jsx';
import KaramboLiveGuideView from '../components/KaramboLiveGuideView.jsx';
import KaramboNewsView from '../components/KaramboNewsView.jsx';
import KaramboWearablesView from '../components/KaramboWearablesView.jsx';
import KaramboPhoneHydrator from '../components/KaramboPhoneHydrator.jsx';
import KaramboStoreReviewsView from '../components/KaramboStoreReviewsView.jsx';
import { KaramboLiveAdvisorView, KaramboLiveRadarView, KaramboGulfView, KaramboTradeInView } from '../components/KaramboLiveMarketViews.jsx';
import { ICONS, svcEnabled, partPrice, partPriceInfo, storeWhatsappNumber, ValueBadge, PhoneCard, matchAccessoriesForPhone, genGuideEditorial, keepKaramboInView } from './Karambo.jsx';

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
    keepKaramboInView();
  };
  const maxCompare = (cfg.compareCfg && cfg.compareCfg.maxDevices === 2) ? 2 : 3;
  const toggleCompare = (id) => {
    const cur = ui.compare || [];
    if (cur.includes(id)) set({ compare: cur.filter(x => x !== id) });
    else if (cur.length >= maxCompare) { ctx.showToast && ctx.showToast(`المقارنة لحد ${maxCompare} موبايلات بس — شيل واحد الأول`, 'warning'); }
    else set({ compare: [...cur, id] });
  };

  // One shared "order this for me" flow: opens the existing sourcing request prefilled with the device + indicative price
  const requestImport = (name, price) => {
    if (ctx.trackKaramboEvent) ctx.trackKaramboEvent('import_request', name);
    ctx.openSourcing && ctx.openSourcing();
    setTimeout(() => {
      ctx.setSrcForm && ctx.setSrcForm(p => ({ ...p, name, desc: `طلب من كرومبو: ${name}${price > 0 ? ` — السعر الاسترشادي الحالي ${formatMoney(price)}` : ''}. برجاء تأكيد التوفر والسعر النهائي والمدة.` }));
    }, 60);
  };

  const enabledServices = orderedServices.filter(s => s.enabled);
  const svc = orderedServices.find(s => s.id === page);
  const title = page === 'hub' ? `كل خدمات ${cfg.title}` : page === 'phone' ? 'تفاصيل الموبايل' : (svc ? svc.title : cfg.title);
  const barStyle = resolveKaramboBarStyle(cfg);

  // Standalone Korombo World Shell — wraps any active service with dedicated Korombo Hero + Sidebar + Mobile Icon Dock
  const wrapKoromboPortal = (contentNode) => ctx.__embedded ? (<div className="space-y-3">{contentNode}</div>) : (
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
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black border transition ${page === 'hub' ? 'bg-white text-[#004F9F] border-white shadow' : 'bg-white/15 hover:bg-white/25 text-white border-white/30'}`}
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
          <button type="button" onClick={() => set({ mobileNavOpen: !ui.mobileNavOpen })} className="text-[11px] font-black text-[#0066CC]">
            {ui.mobileNavOpen ? 'إغلاق القائمة ▲' : 'عرض الكل بالصور ▼'}
          </button>
        </div>
        {ui.mobileNavOpen ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-1">
            {enabledServices.map(s => {
              const Icon = ICONS[s.icon] || Sparkles;
              const active = page === s.id;
              return (
                <button key={s.id} type="button" onClick={() => { go(s.id, { mobileNavOpen: false }); }} className={`flex items-center gap-2 p-2 rounded-2xl border text-start transition ${active ? 'bg-[#0071E3] text-white border-[#0071E3] shadow' : 'bg-surface2 border-line text-fg'}`}>
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
                <button key={s.id} type="button" onClick={() => go(s.id)} className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl border text-[11px] font-black transition ${active ? 'bg-[#0071E3] text-white border-[#0071E3] shadow' : 'bg-surface2 border-line text-fg'}`}>
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
      <div id="korombo-content-top" aria-hidden="true" />
      <div className="max-w-[1360px] mx-auto px-3 sm:px-6 py-5 grid lg:grid-cols-[275px_1fr] gap-5 items-start">
        {/* Desktop Persistent Korombo Services Sidebar */}
        <aside className="hidden lg:block sticky top-5 bg-surface border border-line rounded-3xl p-3 space-y-1.5 shadow-sm">
          <div className="px-2.5 py-2 flex items-center justify-between border-b border-line mb-1">
            <span className="text-xs font-black text-fg">كل خدمات {cfg.title}</span>
            <span className="px-2 py-0.5 rounded-full bg-[#0071E3]/12 text-[#0066CC] text-[10px] font-black">{enabledServices.length}</span>
          </div>
          {enabledServices.map(s => {
            const Icon = ICONS[s.icon] || Sparkles;
            const active = page === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => go(s.id)}
                className={`w-full flex items-center gap-2.5 p-2.5 rounded-2xl text-start transition border ${active ? 'bg-[#0071E3] text-white border-[#0071E3] shadow-md' : 'bg-transparent hover:bg-surface2 border-transparent text-fg'}`}
              >
                <span className={`w-9 h-9 rounded-xl ${active ? 'bg-white/20' : s.color} flex items-center justify-center shrink-0 shadow-sm`}>
                  <Icon className="w-4 h-4 text-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black truncate">{s.title}</span>
                    {s.badge && <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black shrink-0 ${active ? 'bg-white text-[#004F9F]' : 'bg-amber-400 text-slate-900'}`}>{s.badge}</span>}
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
    <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:end-6 z-40 max-w-md bg-surface/95 backdrop-blur-md border-2 border-slate-500 rounded-2xl shadow-2xl p-2.5 flex items-center gap-2.5">
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
      <button type="button" onClick={() => go('compare')} className="px-3 py-2 rounded-xl bg-slate-600 hover:bg-slate-500 text-white text-xs font-black shrink-0">قارن الآن</button>
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
          <img src={cfg.mascotUrl || '/karambo.png'} alt="كرومبو" className="w-16 h-16 rounded-2xl object-cover border border-line bg-[#0071E3]" />
          <div className="flex-1 min-w-[200px]">
            <h2 className="text-lg font-black text-fg">أهلاً بك في عالم {cfg.title} المستقل</h2>
            <p className="text-xs font-bold text-muted mt-0.5">{cfg.subtitle}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {enabledServices.map(s => {
            const Icon = ICONS[s.icon] || Sparkles;
            return (
              <button key={s.id} type="button" onClick={() => go(s.id)} className="relative group bg-surface border border-line hover:border-[#0071E3] rounded-3xl p-4 text-start flex items-start gap-3 transition hover:-translate-y-0.5 shadow-sm">
                {s.badge && <span className="absolute top-3 end-3 px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 text-[9px] font-black">{s.badge}</span>}
                <span className={`w-12 h-12 rounded-2xl ${s.color} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition`}><Icon className="w-6 h-6 text-white" /></span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-sm font-black text-fg group-hover:text-[#0066CC]">{s.title}</div>
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
          onRequestImport={requestImport}
          renderLocalPhoneCard={(p) => PhoneCard(ctx, p, { onToggleCompare: toggleCompare })}
        />
      </div>
    );
  }

  // ---------- 1a. SMART WATCHES & EARBUDS ----------
  if (page === 'wearables') {
    return wrapKoromboPortal(
      <KaramboWearablesView ctx={ctx} cfg={cfg} formatMoney={formatMoney} onRequestOrder={requestImport} />
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
    const accessories = accData.modelSpecific.slice(0, 8);
    const generalPicks = accData.chargersAndCables.slice(0, 4);
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
            <div className="relative bg-white dark:bg-[#1D1D1F] rounded-2xl aspect-[4/3] flex items-center justify-center overflow-hidden">
              {phone.images && phone.images[imgIdx] ? <img src={phone.images[imgIdx]} alt={phone.name} referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="max-h-full max-w-full object-contain" /> : <Smartphone className="w-16 h-16 text-muted" />}
              <span className="absolute top-2 start-2 px-2 py-0.5 rounded-full bg-[#0071E3] text-white text-[10px] font-black">{phone.brand}</span>
            </div>
            {(phone.images || []).length > 1 && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {phone.images.map((im, i) => (
                  <button key={i} type="button" onClick={() => set({ imgIdx: i })} className={`w-16 h-16 rounded-xl border-2 overflow-hidden bg-white shrink-0 ${i === imgIdx ? 'border-[#0071E3]' : 'border-line'}`}><img src={im} alt="" loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-contain" /></button>
                ))}
              </div>
            )}
            <div className="rounded-2xl bg-surface2 border border-line p-3.5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-black text-muted">سعر السوق الاسترشادي{phone.priceDate ? ` · آخر مراجعة ${phone.priceDate}` : ''}</span>
                <ValueBadge score={phone.valueScore} />
              </div>
              <EgyptPriceReveal key={phone.id || phone.name} name={phone.name} curatedPrice={phone.price} curatedDate={phone.priceDate} formatMoney={formatMoney} unavailableLabel={(cfg.guideCfg && cfg.guideCfg.notInEgyptLabel) || 'غير متوفر في مصر حالياً'}>
                {(phone.variants || []).length > 0 && (<div className="space-y-1 pt-1">{(phone.variants || []).map((v, i) => (
                  <div key={i} className="flex items-center justify-between text-sm font-bold"><span className="text-muted">{v.label}</span><span className="font-black text-[#0066CC] dark:text-[#2997FF]">{formatMoney(v.price)}</span></div>
                ))}</div>)}
              </EgyptPriceReveal>
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
                <button type="button" onClick={() => { ctx.openSourcing && ctx.openSourcing(); setTimeout(() => { ctx.setSrcForm && ctx.setSrcForm(p => ({ ...p, name: phone.name, desc: `طلب استيراد جهاز: ${phone.name} — سعر السوق الاسترشادي حاليًا ${formatMoney(phone.price)}` })); }, 60); }} className="inline-flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-black transition"><PhoneCall className="w-4 h-4" /> اطلبه استيراد</button>
              )}
              <button type="button" onClick={() => { toggleCompare(phone.id); go('compare'); }} className="inline-flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-slate-600 hover:bg-slate-500 text-white text-xs font-black transition"><Scale className="w-4 h-4" /> قارن الآن</button>
              <button type="button" onClick={() => go('installment', { instPhoneId: phone.id, instPrice: String(phone.price || '') })} className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-surface2 border border-line hover:border-slate-500 text-fg text-xs font-black transition"><Calculator className="w-3.5 h-3.5 text-slate-600" /> احسب قسطه</button>
              <button type="button" onClick={() => go('gulf', { gulfPhoneId: phone.id })} className="inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-surface2 border border-line hover:border-slate-500 text-fg text-xs font-black transition"><Globe className="w-3.5 h-3.5 text-slate-500" /> احسبه من الخليج</button>
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
                  <div className="text-xs font-black text-[#0066CC] dark:text-[#2997FF] mb-1.5">{grp.group}</div>
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

        <AccessoryPreloader phone={phone} models={ctx.models || []} fetchSlice={ctx.fetchSparePartsSliceOnDemand} />
        {(
          <div className="bg-surface border border-line rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="font-black text-fg">إكسسواراته عندنا <span className="text-xs text-muted font-bold">— منتجات للبيع فعلًا من متجرنا</span></h3>
              <button type="button" onClick={() => go('compatibility', { compatPhone: phone })} className="text-xs font-black text-slate-600 hover:underline">عرض كل المتوافق مع {phone.name} ←</button>
            </div>
            {accessories.length === 0 && <div className="rounded-2xl bg-surface2 border border-line p-4 text-center text-xs font-bold text-muted">لا توجد إكسسوارات متوافقة متاحة حاليًا</div>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {accessories.map((part, i) => (
                <button key={part.id || i} type="button" onClick={() => ctx.setSelectedDetailItem && ctx.setSelectedDetailItem(part)} className="text-start bg-surface2/60 border border-line rounded-2xl p-2.5 hover:border-[#0071E3] transition">
                  <div className="aspect-square rounded-xl bg-white dark:bg-[#1D1D1F] flex items-center justify-center overflow-hidden mb-2">{part.image ? <img src={part.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" /> : <Smartphone className="w-8 h-8 text-muted" />}</div>
                  <div className="text-[11px] font-black text-fg line-clamp-2 leading-snug">{part.name}</div>
                  <div className="text-xs font-black text-[#0066CC] dark:text-[#2997FF] mt-1">{formatMoney(partPrice(ctx, part))}</div>
            {generalPicks.length > 0 && (<div className="pt-2 border-t border-line space-y-2"><div className="text-xs font-black text-muted">منتجات عامة تناسب منفذ الشحن ({accData.portLabel}) — غير مخصصة لهذا الموديل</div><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{generalPicks.map((part, i) => (<button key={part.id || i} type="button" onClick={() => ctx.setSelectedDetailItem && ctx.setSelectedDetailItem(part)} className="text-start bg-surface2/60 border border-line rounded-2xl p-2.5 hover:border-[#0071E3] transition"><div className="elz-pstage aspect-[4/3] flex items-center justify-center overflow-hidden mb-2 p-2">{part.image ? <img src={part.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain mix-blend-multiply" /> : null}</div><div className="text-[11px] font-black text-fg line-clamp-2 leading-snug">{part.name}</div></button>))}</div></div>)}
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
      <div key={part.id || i} className="bg-surface border border-line rounded-2xl p-3 flex flex-col gap-2 hover:border-slate-500 transition">
        <button type="button" onClick={() => ctx.setSelectedDetailItem && ctx.setSelectedDetailItem(part)} className="aspect-square rounded-xl bg-white dark:bg-[#1D1D1F] flex items-center justify-center overflow-hidden">
          {part.image ? <img src={part.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="max-h-full max-w-full object-contain" /> : <Package className="w-8 h-8 text-muted" />}
        </button>
        <div className="text-xs font-black text-fg line-clamp-2 leading-snug">{part.name}</div>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <span className="text-sm font-black text-slate-600 dark:text-slate-400">{formatMoney(partPrice(ctx, part))}</span>
          <button type="button" onClick={() => ctx.setSelectedDetailItem && ctx.setSelectedDetailItem(part)} className="px-2.5 py-1.5 rounded-xl bg-slate-600 hover:bg-slate-500 text-white text-[11px] font-black">عرض وشراء</button>
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
              <span className="px-2.5 py-1 rounded-full bg-slate-500/15 text-slate-700 dark:text-slate-300 font-black">المنفذ المتوقع: {matched.portLabel}</span>
              {matched.neededW > 0 && <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black">الشحن المدعوم: {matched.neededW} وات</span>}
              {selectedPhone.screen && <span className="px-2.5 py-1 rounded-full bg-slate-500/15 text-slate-700 dark:text-slate-300 font-black">حجم الشاشة: {selectedPhone.screen} بوصة</span>}
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
              {cats.map(c => <button key={c} type="button" onClick={() => set({ budgetCat: c })} className={`px-3 py-1 rounded-full text-[11px] font-black shrink-0 border ${catFilter === c ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-surface2 text-fg border-line'}`}>{c === 'ALL' ? `كل الأقسام (${pricedAll.length})` : c}</button>)}
            </div>
          )}
        </div>

        {/* Smart Bundle Suggestion */}
        {smartBundle.length >= 2 && (
          <div className="rounded-3xl bg-gradient-to-l from-emerald-600/15 to-slate-500/10 border border-emerald-500/30 p-4 space-y-3">
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
                <button key={pl.id} type="button" onClick={() => set({ instPlanId: pl.id, instDown: '' })} className={`px-3.5 py-2 rounded-2xl text-xs font-black border transition ${activePlan.id === pl.id ? 'bg-slate-600 text-white border-slate-600 shadow' : 'bg-surface2 border-line text-fg'}`}>
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
                  <button key={pct} type="button" onClick={() => set({ instDown: String(Math.round(price * pct / 100)) })} className="px-2 py-0.5 rounded-lg bg-surface2 border border-line text-[10px] font-black text-fg hover:border-slate-500">{pct}%</button>
                ))}
              </div>
            </div>
            <input type="number" min="0" max={price || undefined} value={ui.instDown !== undefined ? ui.instDown : (minDown || '')} onChange={e => set({ instDown: e.target.value })} placeholder="0" className="w-full rounded-2xl px-3 py-2.5 bg-surface2 border border-line text-sm font-black text-fg" />
          </div>

          {/* Months selector */}
          <div>
            <div className="text-xs font-black text-muted mb-1.5">عدد الشهور</div>
            <div className="flex flex-wrap gap-1.5">{availMonths.map(m => <button key={m} type="button" onClick={() => set({ instMonths: m })} className={`px-4 py-2 rounded-full text-xs font-black transition ${months === m ? 'bg-slate-600 text-white' : 'bg-surface2 text-fg border border-line'}`}>{m} شهر</button>)}</div>
          </div>

          {price > 0 && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-600/10 border border-slate-600/25 p-4 text-center space-y-1.5">
                <div className="text-xs font-black text-muted">قسطك الشهري التقريبي ({activePlan.name})</div>
                <div className="text-3xl font-black text-slate-700 dark:text-slate-300">{formatMoney(activeCalc.monthly)} <span className="text-sm">/ شهر</span></div>
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
                          <tr key={m} onClick={() => set({ instMonths: m })} className={`cursor-pointer border-t border-line/60 ${m === months ? 'bg-slate-600/10 font-black' : 'hover:bg-surface2/50'}`}>
                            <td className="p-2.5 text-fg">{m} شهر</td>
                            <td className="p-2.5 text-slate-700 dark:text-slate-300 font-black">{formatMoney(c.monthly)}</td>
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
          onSell={() => window.dispatchEvent(new CustomEvent('elz:sell-open', { detail: {} }))}
        />
      </div>
    );
  }

  return wrapKoromboPortal(<div className="bg-surface border border-line rounded-3xl p-8 text-center text-muted font-bold">اختر أي خدمة من القائمة الجانبية</div>);
}
