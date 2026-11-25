import React, { useState } from 'react';
import {
  Search, Scale, Sparkles, Wallet, TrendingDown, Calculator, Globe, Smartphone, Bell,
  ChevronDown, Check, X, RefreshCw, Download, Trash2, Eye, EyeOff, Shield, Cpu,
  Gauge, Save, Plus, RotateCcw, Award, Package, Tag, Layers, Zap, MessageSquare, FileText, Megaphone
} from 'lucide-react';
import {
  KARAMBO_SERVICES,
  KARAMBO_THEMES,
  KARAMBO_ICON_OPTIONS,
  KARAMBO_COLOR_OPTIONS,
  DEFAULT_KARAMBO_CFG,
  mergeKaramboCfg,
  getOrderedKaramboServices,
  resolveKaramboBarStyle
} from '../data/karamboConfig.js';
import { searchGsmarenaPhones, fetchGsmarenaDevice } from '../services/gsmarenaClient.js';

const ICON_MAP = {
  Smartphone, Scale, Sparkles, Cpu, Wallet, TrendingDown, Calculator, Globe,
  RotateCcw, Zap, Award, Shield, Package, Tag, Layers, Gauge, Megaphone
};

function KaramboAdminPanel({ ctx }) {
  const {
    karamboCfg, saveKaramboCfg, guidePhonesAdmin, guideSyncState, syncGuideLive,
    importGuideSeed, toggleGuidePhone, updateGuidePhone, deleteGuidePhone, addGuidePhone,
    priceAlertsAdmin, loadPriceAlerts, deletePriceAlert, updatePriceAlertStatus,
    karamboStats, resetKaramboStats, formatMoney, showToast, computeValueScore,
    storeReviewEntities, storeReviewEntries, moderateStoreReview, deleteStoreReview, submitStoreEntity, updateStoreEntity, deleteStoreEntity
  } = ctx;

  const cfg = mergeKaramboCfg(karamboCfg);
  const orderedServices = getOrderedKaramboServices(cfg);
  const phones = guidePhonesAdmin || [];
  const sync = guideSyncState || { status: 'idle' };
  const lastSync = cfg.lastSync || null;

  const [subTab, setSubTab] = useState('bar');
  const [priceDrafts, setPriceDrafts] = useState({});
  const [phoneSearch, setPhoneSearch] = useState('');
  const [expandedSvcId, setExpandedSvcId] = useState(null);

  // GSMArena Admin Importer state
  const [gsmQuery, setGsmQuery] = useState('');
  const [gsmSearching, setGsmSearching] = useState(false);
  const [gsmResults, setGsmResults] = useState([]);
  const [gsmPriceDrafts, setGsmPriceDrafts] = useState({});
  const [gsmImportingSlug, setGsmImportingSlug] = useState('');

  // Quick Manual Add Phone state
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', brand: 'سامسونج', price: '', screen: '', camera: '', battery: '', ramMax: '', storageMax: '', image: '' });

  // Quick Comparison Preset Add state
  const [newQc, setNewQc] = useState({ label: '', slug1: '', slug2: '' });

  // New Installment Plan state
  const [newPlan, setNewPlan] = useState({ name: '', annualRatePct: 18, adminFeePct: 3, minDownPct: 10, months: '6,12,18,24' });

  const patchCfg = (patch) => saveKaramboCfg({ ...cfg, ...patch });

  const toggleSvc = (id) => {
    const services = { ...(cfg.services || {}) };
    services[id] = services[id] === false ? true : false;
    patchCfg({ services });
  };

  const moveSvc = (id, dir) => {
    const order = orderedServices.map(s => s.id);
    const idx = order.indexOf(id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= order.length) return;
    [order[idx], order[target]] = [order[target], order[idx]];
    patchCfg({ serviceOrder: order });
  };

  const updateSvcOverride = (id, patch) => {
    const prev = (cfg.serviceOverrides && cfg.serviceOverrides[id]) || {};
    patchCfg({ serviceOverrides: { ...(cfg.serviceOverrides || {}), [id]: { ...prev, ...patch } } });
  };

  const handleGsmAdminSearch = async (e) => {
    e && e.preventDefault();
    if (!gsmQuery.trim()) return;
    setGsmSearching(true);
    const r = await searchGsmarenaPhones(gsmQuery.trim(), []);
    setGsmSearching(false);
    setGsmResults(r.results || []);
    if (!r.live && (!r.results || !r.results.length)) {
      showToast && showToast('تعذر البحث الحي حالياً — يمكنك استخدام «إضافة جهاز يدوياً».', 'info');
    }
  };

  const handleImportFromGsm = async (item) => {
    setGsmImportingSlug(item.slug);
    const res = await fetchGsmarenaDevice(item.slug);
    setGsmImportingSlug('');
    if (!res.ok || !res.device) {
      showToast && showToast(res.error || 'تعذر جلب مواصفات الجهاز حالياً', 'error');
      return;
    }
    const egpPrice = parseFloat(gsmPriceDrafts[item.slug]) || 0;
    const d = res.device;
    const cheapest = Math.min(...phones.map(p => p.price || Infinity).filter(isFinite), egpPrice || 10000);
    const newPhone = {
      id: 'gp_' + d.slug,
      slug: d.slug,
      name: d.name,
      brand: d.brand || 'موبايل',
      brandSlug: d.brandSlug || 'other',
      images: d.images || (item.img ? [item.img] : []),
      specs: d.specs || [],
      variants: egpPrice ? [{ label: 'السعر الاسترشادي', price: Math.round(egpPrice) }] : [],
      price: Math.round(egpPrice),
      priceDate: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' }),
      priceHistory: egpPrice ? [{ date: new Date().toISOString().slice(0, 10), price: Math.round(egpPrice) }] : [],
      battery: d.battery,
      camera: d.camera,
      selfieCamera: d.selfieCamera,
      refresh: d.refresh,
      weight: d.weight,
      screen: d.screen,
      ramMax: d.ramMax,
      storageMax: d.storageMax,
      chargeW: d.chargeW,
      chipset: d.chipset,
      os: d.os,
      sim: d.sim,
      ip: d.ip,
      usb: d.usb,
      has5G: d.has5G,
      enabled: true,
      source: 'gsmarena'
    };
    if (computeValueScore) newPhone.valueScore = computeValueScore(newPhone, cheapest, cfg.guideCfg?.valueWeights);
    if (addGuidePhone) await addGuidePhone(newPhone);
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!manualForm.name.trim()) return;
    const price = Math.round(parseFloat(manualForm.price) || 0);
    const slug = manualForm.name.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, '-') + '-' + Date.now().toString(36);
    const ph = {
      id: 'gp_' + slug,
      slug,
      name: manualForm.name.trim(),
      brand: manualForm.brand.trim() || 'عام',
      brandSlug: manualForm.brand.trim().toLowerCase(),
      images: manualForm.image.trim() ? [manualForm.image.trim()] : [],
      specs: [],
      variants: price ? [{ label: 'السعر الاسترشادي', price }] : [],
      price,
      priceDate: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' }),
      priceHistory: price ? [{ date: new Date().toISOString().slice(0, 10), price }] : [],
      screen: parseFloat(manualForm.screen) || null,
      camera: parseFloat(manualForm.camera) || null,
      battery: parseFloat(manualForm.battery) || null,
      ramMax: parseFloat(manualForm.ramMax) || null,
      storageMax: parseFloat(manualForm.storageMax) || null,
      enabled: true
    };
    if (computeValueScore) ph.valueScore = computeValueScore(ph, Math.min(...phones.map(p => p.price || Infinity).filter(isFinite), price || 10000), cfg.guideCfg?.valueWeights);
    if (addGuidePhone) await addGuidePhone(ph);
    setManualForm({ name: '', brand: 'سامسونج', price: '', screen: '', camera: '', battery: '', ramMax: '', storageMax: '', image: '' });
    setManualOpen(false);
  };

  const exportAlertsCsv = () => {
    const rows = [['الجهاز', 'الاسم', 'الرقم', 'السعر وقت الطلب', 'الحالة', 'التاريخ']];
    (priceAlertsAdmin || []).forEach(a => {
      rows.push([a.phoneName || a.phoneId || '', a.name || '', a.contact || '', String(a.priceAt || 0), a.status || 'new', String(a.createdAt || '').slice(0, 10)]);
    });
    const csv = '\uFEFF' + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `karambo_price_alerts_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredPhones = phones.filter(ph => {
    if (!phoneSearch.trim()) return true;
    const q = phoneSearch.trim().toLowerCase();
    return `${ph.name || ''} ${ph.brand || ''} ${ph.slug || ''}`.toLowerCase().includes(q);
  });

  const barStyle = resolveKaramboBarStyle(cfg);
  const stats = karamboStats || { visits: {}, topPhones: {} };
  const totalVisits = Object.values(stats.visits || {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const topPhonesArr = Object.entries(stats.topPhones || {}).sort((a, b) => b[1] - a[1]).slice(0, 8);

  const TABS = [
    { id: 'bar', label: 'مظهر الشريط والمعاينة' },
    { id: 'services', label: `الخدمات والترتيب (${orderedServices.filter(s => s.enabled).length}/${orderedServices.length})` },
    { id: 'rules', label: 'أسس وقواعد كل خدمة' },
    { id: 'phones', label: `دليل الموبايلات (${phones.length})` },
    { id: 'reviews_mgr', label: `تقييم المحلات (${(storeReviewEntries || []).filter(r => r.status === 'pending').length} معلق)` },
    { id: 'alerts', label: `التنبيهات والتحليلات (${(priceAlertsAdmin || []).length})` }
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <img src={cfg.mascotUrl || '/karambo.png'} alt="كرومبو" className="w-12 h-12 rounded-2xl object-cover border border-line bg-[#0071E3]" />
        <div>
          <h2 className="text-xl font-black text-fg">كرومبو الشغلانة — مركز التحكم الكامل</h2>
          <p className="text-xs font-bold text-muted">تحكم شامل في الشريط، ألوانه، ترتيب وتخصيص الـ 11 خدمة، أسس الحسابات، الكتالوج العالمي، الأخبار، والرادار</p>
        </div>
        <label className="ms-auto inline-flex items-center gap-2 cursor-pointer bg-surface border border-line rounded-2xl px-3.5 py-2">
          <span className="text-xs font-black text-fg">الشريط ظاهر في المتجر</span>
          <input type="checkbox" checked={cfg.enabled !== false} onChange={e => patchCfg({ enabled: e.target.checked })} className="w-4 h-4 accent-[#0071E3]" />
        </label>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSubTab(t.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black shrink-0 transition border ${subTab === t.id ? 'bg-[#0071E3] text-white border-[#0071E3] shadow' : 'bg-surface border-line text-fg hover:border-[#0071E3]'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ================= TAB 1: BAR DESIGNER & LIVE PREVIEW ================= */}
      {subTab === 'bar' && (
        <div className="space-y-4">
          {/* Live Preview */}
          <div className="bg-surface border border-line rounded-3xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-muted">معاينة حية لشريط كرومبو كما سيظهر للعميل</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white ${cfg.enabled !== false ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                {cfg.enabled !== false ? 'ظاهر في المتجر' : 'مخفي حالياً'}
              </span>
            </div>
            <div style={barStyle} className="rounded-3xl border p-4 shadow-lg">
              <div className={`flex ${cfg.layout === 'compact' ? 'flex-row items-center' : 'flex-col sm:flex-row'} gap-3`}>
                <div className="flex items-center gap-3 shrink-0">
                  {cfg.showMascot !== false && (
                    <img src={cfg.mascotUrl || '/karambo.png'} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-white/50 bg-white/10" />
                  )}
                  <div>
                    {cfg.badgeText && <span className="inline-block px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-black mb-1">{cfg.badgeText}</span>}
                    <div className="text-lg font-black leading-tight">{cfg.title || 'كرومبو الشغلانة'}</div>
                    <div className="text-[11px] font-bold opacity-90">{cfg.subtitle}</div>
                  </div>
                </div>
                <div className="flex-1 flex flex-wrap gap-1.5 items-center content-center">
                  {orderedServices.filter(s => s.enabled).map(s => {
                    const Icon = ICON_MAP[s.icon] || Sparkles;
                    return (
                      <span key={s.id} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/15 border border-white/25 text-[11px] font-black">
                        <span className={`w-5 h-5 rounded-md ${s.color} flex items-center justify-center`}><Icon className="w-3 h-3 text-white" /></span>
                        <span>{s.title}</span>
                        {s.badge && <span className="px-1 py-0.5 rounded bg-amber-400 text-slate-900 text-[8px] font-black">{s.badge}</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
              {cfg.disclaimer && <div className="mt-2 pt-2 border-t border-white/20 text-[10px] font-bold opacity-85">{cfg.disclaimer}</div>}
            </div>
          </div>

          {/* Bar Content & Layout Settings */}
          <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
            <h3 className="font-black text-fg">النصوص والمظهر</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-black text-muted block mb-1">اسم الشريط</label>
                <input defaultValue={cfg.title} onBlur={e => patchCfg({ title: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line bg-surface2 text-sm font-bold" />
              </div>
              <div>
                <label className="text-[11px] font-black text-muted block mb-1">الشارة العلوية (Badge)</label>
                <input defaultValue={cfg.badgeText || ''} onBlur={e => patchCfg({ badgeText: e.target.value })} placeholder="مثال: أدوات ذكية مجانية" className="w-full px-3 py-2 rounded-xl border border-line bg-surface2 text-sm font-bold" />
              </div>
              <div>
                <label className="text-[11px] font-black text-muted block mb-1">نمط عرض الشريط</label>
                <select value={cfg.layout || 'full'} onChange={e => patchCfg({ layout: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line bg-surface2 text-sm font-black text-fg">
                  <option value="full">كامل (شخصية كرومبو + شبكة بطاقات)</option>
                  <option value="compact">مدمج أفقي (شريط سريع موفر للمساحة)</option>
                  <option value="cards">بطاقات كبيرة بارزة</option>
                </select>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-[11px] font-black text-muted block mb-1">الوصف اللي تحت الاسم</label>
                <input defaultValue={cfg.subtitle || ''} onBlur={e => patchCfg({ subtitle: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line bg-surface2 text-sm font-bold" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-black text-muted block mb-1">نص التنويه الاسترشادي (يظهر داخل الشريط والصفحات)</label>
                <input defaultValue={cfg.disclaimer || ''} onBlur={e => patchCfg({ disclaimer: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line bg-surface2 text-sm font-bold" />
              </div>
              <div>
                <label className="text-[11px] font-black text-muted block mb-1">رابط صورة شخصية كرومبو</label>
                <input defaultValue={cfg.mascotUrl || '/karambo.png'} onBlur={e => patchCfg({ mascotUrl: e.target.value || '/karambo.png' })} className="w-full px-3 py-2 rounded-xl border border-line bg-surface2 text-sm font-bold" />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-line">
              <label className="inline-flex items-center gap-2 text-xs font-black text-fg cursor-pointer">
                <input type="checkbox" checked={cfg.showMascot !== false} onChange={e => patchCfg({ showMascot: e.target.checked })} className="w-4 h-4 accent-[#0071E3]" />
                <span>إظهار صورة شخصية كرومبو في الشريط</span>
              </label>
            </div>

            {/* Theme Presets & Custom Colors */}
            <div className="space-y-2.5 pt-2 border-t border-line">
              <div className="text-xs font-black text-muted">ثيم وألوان الشريط</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(KARAMBO_THEMES).map(([key, th]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => patchCfg({ theme: key })}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black transition ${cfg.theme === key ? 'border-[#0071E3] ring-2 ring-[#0071E3]/30 bg-surface2' : 'border-line bg-surface'}`}
                  >
                    <span className="w-5 h-5 rounded-full border border-white/50 shadow" style={{ background: `linear-gradient(to left, ${th.from}, ${th.to})` }} />
                    <span>{th.label}</span>
                  </button>
                ))}
              </div>
              {cfg.theme === 'custom' && (
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <label className="inline-flex items-center gap-2 text-xs font-black text-fg">
                    <span>لون البداية:</span>
                    <input type="color" value={cfg.customFrom || '#163B6B'} onChange={e => patchCfg({ customFrom: e.target.value })} className="w-10 h-8 rounded cursor-pointer border border-line" />
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs font-black text-fg">
                    <span>لون النهاية:</span>
                    <input type="color" value={cfg.customTo || '#2F6BB3'} onChange={e => patchCfg({ customTo: e.target.value })} className="w-10 h-8 rounded cursor-pointer border border-line" />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: SERVICES STUDIO (ORDER, TITLES, ICONS, COLORS, BADGES) ================= */}
      {subTab === 'services' && (
        <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-black text-fg">استوديو خدمات كرومبو (11 خدمة)</h3>
              <p className="text-[11px] font-bold text-muted">رتّب الخدمات، فعّل أو أوقف أي خدمة، وعدّل اسمها ووصفها ولونها وأيقونتها والشارة بتاعتها</p>
            </div>
            <button
              type="button"
              onClick={() => { if (window.confirm('إعادة ترتيب وأسماء وألوان الخدمات للوضع الافتراضي؟')) patchCfg({ serviceOrder: KARAMBO_SERVICES.map(s => s.id), serviceOverrides: {}, services: {} }); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface2 border border-line text-xs font-black text-fg hover:border-rose-400 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> إعادة الضبط الافتراضي
            </button>
          </div>

          <div className="space-y-2.5">
            {orderedServices.map((s, idx) => {
              const Icon = ICON_MAP[s.icon] || Sparkles;
              const isExp = expandedSvcId === s.id;
              return (
                <div key={s.id} className={`rounded-2xl border transition ${s.enabled ? 'border-line bg-surface2/40' : 'border-line bg-surface2/15 opacity-65'}`}>
                  <div className="flex items-center gap-2.5 p-3 flex-wrap">
                    <div className="flex flex-col gap-0.5">
                      <button type="button" disabled={idx === 0} onClick={() => moveSvc(s.id, -1)} className="px-1.5 py-0.5 rounded bg-surface border border-line text-[10px] font-black disabled:opacity-30" title="تحريك لأعلى">▲</button>
                      <button type="button" disabled={idx === orderedServices.length - 1} onClick={() => moveSvc(s.id, 1)} className="px-1.5 py-0.5 rounded bg-surface border border-line text-[10px] font-black disabled:opacity-30" title="تحريك لأسفل">▼</button>
                    </div>
                    <span className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center shrink-0 shadow`}>
                      <Icon className="w-5 h-5 text-white" />
                    </span>
                    <div className="flex-1 min-w-[160px]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-black text-fg">{s.title}</span>
                        {s.badge && <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black">{s.badge}</span>}
                      </div>
                      <div className="text-[11px] font-bold text-muted">{s.desc}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => setExpandedSvcId(isExp ? null : s.id)} className="px-3 py-1.5 rounded-xl bg-surface border border-line text-xs font-black text-fg hover:border-[#0071E3]">
                        {isExp ? 'إغلاق التخصيص' : 'تخصيص'}
                      </button>
                      <button type="button" onClick={() => toggleSvc(s.id)} className={`px-3 py-1.5 rounded-xl text-xs font-black text-white ${s.enabled ? 'bg-emerald-600' : 'bg-slate-400'}`}>
                        {s.enabled ? 'شغالة' : 'مقفولة'}
                      </button>
                    </div>
                  </div>
                  {isExp && (
                    <div className="p-3.5 border-t border-line bg-surface rounded-b-2xl grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] font-black text-muted block mb-1">اسم الخدمة</label>
                        <input defaultValue={s.title} onBlur={e => updateSvcOverride(s.id, { title: e.target.value })} className="w-full px-2.5 py-1.5 rounded-xl border border-line bg-surface2 text-xs font-bold" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-black text-muted block mb-1">الوصف المختصر</label>
                        <input defaultValue={s.desc} onBlur={e => updateSvcOverride(s.id, { desc: e.target.value })} className="w-full px-2.5 py-1.5 rounded-xl border border-line bg-surface2 text-xs font-bold" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-muted block mb-1">شارة مميزة (اختياري)</label>
                        <input defaultValue={s.badge || ''} onBlur={e => updateSvcOverride(s.id, { badge: e.target.value })} placeholder="مثال: جديد / مباشر" className="w-full px-2.5 py-1.5 rounded-xl border border-line bg-surface2 text-xs font-bold" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-black text-muted block mb-1">الأيقونة</label>
                        <div className="flex flex-wrap gap-1.5">
                          {KARAMBO_ICON_OPTIONS.map(ic => {
                            const Ic = ICON_MAP[ic] || Sparkles;
                            return (
                              <button key={ic} type="button" onClick={() => updateSvcOverride(s.id, { icon: ic })} className={`p-1.5 rounded-lg border ${s.icon === ic ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-surface2 text-fg border-line'}`}>
                                <Ic className="w-4 h-4" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-black text-muted block mb-1">لون الأيقونة</label>
                        <div className="flex flex-wrap gap-1.5">
                          {KARAMBO_COLOR_OPTIONS.map(c => (
                            <button key={c.id} type="button" onClick={() => updateSvcOverride(s.id, { color: c.id })} className={`w-7 h-7 rounded-lg ${c.id} border-2 ${s.color === c.id ? 'border-fg scale-110' : 'border-transparent'}`} title={c.label} />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: SERVICE FOUNDATIONS & RULES ================= */}
      {subTab === 'rules' && (
        <div className="space-y-4">
          {/* 3.1 GSMArena Comparison Rules */}
          <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
            <h3 className="font-black text-fg flex items-center gap-2"><Scale className="w-4 h-4 text-slate-500" /> أسس خدمة «قارن بنفسك» (الكتالوج العالمي)</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface2 border border-line text-xs font-black cursor-pointer">
                <input type="checkbox" checked={cfg.compareCfg.gsmarenaLive !== false} onChange={e => patchCfg({ compareCfg: { ...cfg.compareCfg, gsmarenaLive: e.target.checked } })} className="w-4 h-4 accent-[#0071E3]" />
                <span>تفعيل البحث الحي في الكتالوج العالمي</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface2 border border-line text-xs font-black cursor-pointer">
                <input type="checkbox" checked={!!cfg.compareCfg.defaultDiffOnly} onChange={e => patchCfg({ compareCfg: { ...cfg.compareCfg, defaultDiffOnly: e.target.checked } })} className="w-4 h-4 accent-[#0071E3]" />
                <span>إظهار الاختلافات فقط افتراضياً</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface2 border border-line text-xs font-black cursor-pointer">
                <input type="checkbox" checked={cfg.compareCfg.showVerdict !== false} onChange={e => patchCfg({ compareCfg: { ...cfg.compareCfg, showVerdict: e.target.checked } })} className="w-4 h-4 accent-[#0071E3]" />
                <span>إظهار «حكم كرومبو النهائي»</span>
              </label>
              <div className="p-2.5 rounded-2xl bg-surface2 border border-line">
                <label className="text-[10px] font-black text-muted block mb-1">أقصى عدد أجهزة للمقارنة</label>
                <select value={cfg.compareCfg.maxDevices || 3} onChange={e => patchCfg({ compareCfg: { ...cfg.compareCfg, maxDevices: Number(e.target.value) } })} className="w-full bg-surface rounded-lg px-2 py-1 text-xs font-black text-fg border border-line">
                  <option value={2}>جهازين (2)</option>
                  <option value={3}>3 أجهزة (موصى به)</option>
                </select>
              </div>
            </div>
            {/* Quick comparisons presets */}
            <div className="space-y-2 pt-2 border-t border-line">
              <div className="text-xs font-black text-muted">المقارنات السريعة المقترحة للعميل</div>
              <div className="space-y-1.5">
                {(cfg.compareCfg.quickComparisons || []).map(q => (
                  <div key={q.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-surface2 border border-line text-xs font-bold">
                    <span className="font-black text-fg flex-1">{q.label}</span>
                    <span className="text-[10px] text-muted hidden sm:inline">{(q.slugs || []).join(' vs ')}</span>
                    <button type="button" onClick={() => patchCfg({ compareCfg: { ...cfg.compareCfg, quickComparisons: (cfg.compareCfg.quickComparisons || []).filter(x => x.id !== q.id) } })} className="p-1.5 rounded-lg bg-rose-600 text-white"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
              <div className="grid sm:grid-cols-4 gap-2 pt-1">
                <input value={newQc.label} onChange={e => setNewQc(p => ({ ...p, label: e.target.value }))} placeholder="عنوان المقارنة (مثال: S25 Ultra vs 16 Pro Max)" className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
                <input value={newQc.slug1} onChange={e => setNewQc(p => ({ ...p, slug1: e.target.value }))} placeholder="معرّف الجهاز الأول" className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
                <input value={newQc.slug2} onChange={e => setNewQc(p => ({ ...p, slug2: e.target.value }))} placeholder="معرّف الجهاز الثاني" className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
                <button
                  type="button"
                  onClick={() => {
                    if (!newQc.label.trim() || !newQc.slug1.trim() || !newQc.slug2.trim()) return;
                    const next = [...(cfg.compareCfg.quickComparisons || []), { id: 'qc_' + Date.now(), label: newQc.label.trim(), slugs: [newQc.slug1.trim(), newQc.slug2.trim()] }];
                    patchCfg({ compareCfg: { ...cfg.compareCfg, quickComparisons: next } });
                    setNewQc({ label: '', slug1: '', slug2: '' });
                  }}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-600 text-white text-xs font-black"
                >
                  <Plus className="w-3.5 h-3.5" /> إضافة مقارنة سريعة
                </button>
              </div>
            </div>
          </div>

          {/* 3.2 Installment Plans */}
          <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
            <h3 className="font-black text-fg flex items-center gap-2"><Calculator className="w-4 h-4 text-slate-600" /> أسس «حاسبة التقسيط» والخطط</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black text-muted block mb-1">رقم واتساب لاستقبال طلبات التقسيط (بالكود الدولي مثل 2010...)</label>
                <input defaultValue={cfg.installmentWhatsApp || ''} onBlur={e => patchCfg({ installmentWhatsApp: e.target.value })} placeholder="اتركه فارغاً لاستخدام رقم المتجر الرئيسي" className="w-full px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
              </div>
              <div>
                <label className="text-[11px] font-black text-muted block mb-1">ملاحظة شروط التقسيط للعميل</label>
                <input defaultValue={cfg.installmentDisclaimer || ''} onBlur={e => patchCfg({ installmentDisclaimer: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-xs font-black text-muted">خطط وجهات التقسيط المتاحة للعميل</div>
              {(cfg.installmentPlans || []).map((pl, idx) => (
                <div key={pl.id || idx} className="grid sm:grid-cols-6 gap-2 items-center p-2.5 rounded-2xl bg-surface2 border border-line text-xs font-bold">
                  <div className="sm:col-span-2 font-black text-fg">{pl.name}</div>
                  <div>فائدة: <span className="text-slate-600 font-black">{pl.annualRatePct}%</span>/سنة</div>
                  <div>إدارية: <span className="font-black">{pl.adminFeePct || 0}%</span></div>
                  <div>أقل مقدم: <span className="font-black">{pl.minDownPct || 0}%</span></div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => patchCfg({ installmentPlans: (cfg.installmentPlans || []).filter((_, i) => i !== idx) })}
                      className="p-1.5 rounded-lg bg-rose-600 text-white"
                      title="حذف الخطة"
                    ><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
              <div className="grid sm:grid-cols-6 gap-2 pt-2">
                <input value={newPlan.name} onChange={e => setNewPlan(p => ({ ...p, name: e.target.value }))} placeholder="اسم الجهة/الخطة" className="sm:col-span-2 px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
                <input type="number" min="0" step="0.5" value={newPlan.annualRatePct} onChange={e => setNewPlan(p => ({ ...p, annualRatePct: parseFloat(e.target.value) || 0 }))} placeholder="فائدة سنوية %" className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
                <input type="number" min="0" step="0.5" value={newPlan.adminFeePct} onChange={e => setNewPlan(p => ({ ...p, adminFeePct: parseFloat(e.target.value) || 0 }))} placeholder="مصاريف إدارية %" className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
                <input type="number" min="0" max="90" value={newPlan.minDownPct} onChange={e => setNewPlan(p => ({ ...p, minDownPct: parseFloat(e.target.value) || 0 }))} placeholder="أقل مقدم %" className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
                <button
                  type="button"
                  onClick={() => {
                    if (!newPlan.name.trim()) return;
                    const months = String(newPlan.months || '6,12,18,24').split(',').map(n => parseInt(n.trim(), 10)).filter(n => n > 0);
                    const next = [...(cfg.installmentPlans || []), { id: 'pl_' + Date.now(), name: newPlan.name.trim(), annualRatePct: newPlan.annualRatePct, adminFeePct: newPlan.adminFeePct, minDownPct: newPlan.minDownPct, months: months.length ? months : [6, 12, 18, 24] }];
                    patchCfg({ installmentPlans: next });
                    setNewPlan({ name: '', annualRatePct: 18, adminFeePct: 3, minDownPct: 10, months: '6,12,18,24' });
                  }}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-600 text-white text-xs font-black"
                ><Plus className="w-3.5 h-3.5" /> إضافة خطة</button>
              </div>
            </div>
          </div>

          {/* 3.3 Gulf vs Egypt Rules */}
          <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
            <h3 className="font-black text-fg flex items-center gap-2"><Globe className="w-4 h-4 text-slate-500" /> أسس حاسبة «من الخليج ولا مصر؟»</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-black text-muted block mb-1">نسبة ضريبة NTRA الافتراضية %</label>
                <input type="number" step="0.1" defaultValue={cfg.gulfCfg.defaultTaxPct} onBlur={e => patchCfg({ gulfCfg: { ...cfg.gulfCfg, defaultTaxPct: parseFloat(e.target.value) || 38.5 } })} className="w-full px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
              </div>
              <div>
                <label className="text-[11px] font-black text-muted block mb-1">تكلفة الشحن الافتراضية (جنيه)</label>
                <input type="number" min="0" defaultValue={cfg.gulfCfg.defaultShippingEgp || 0} onBlur={e => patchCfg({ gulfCfg: { ...cfg.gulfCfg, defaultShippingEgp: parseFloat(e.target.value) || 0 } })} className="w-full px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
              </div>
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface2 border border-line text-xs font-black cursor-pointer self-end">
                <input type="checkbox" checked={cfg.gulfCfg.enableLiveFx !== false} onChange={e => patchCfg({ gulfCfg: { ...cfg.gulfCfg, enableLiveFx: e.target.checked } })} className="w-4 h-4 accent-[#0071E3]" />
                <span>تفعيل زر «تحديث سعر الصرف الحي»</span>
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {Object.entries(cfg.gulfCfg.fxRates || {}).map(([cur, rate]) => (
                <div key={cur}>
                  <label className="text-[10px] font-black text-muted block mb-1">صرف {cur}</label>
                  <input type="number" step="0.01" defaultValue={rate} onBlur={e => patchCfg({ gulfCfg: { ...cfg.gulfCfg, fxRates: { ...cfg.gulfCfg.fxRates, [cur]: parseFloat(e.target.value) || rate } } })} className="w-full px-2.5 py-1.5 rounded-xl border border-line bg-surface2 text-xs font-black" />
                </div>
              ))}
            </div>
          </div>

          {/* 3.4 Guide, Value Score Weights & Budget Rules */}
          <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
            <h3 className="font-black text-fg flex items-center gap-2"><Gauge className="w-4 h-4 text-emerald-600" /> أسس الدليل ومعادلة «قيمة مقابل السعر» والميزانية</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface2 border border-line text-xs font-black cursor-pointer">
                <input type="checkbox" checked={cfg.guideCfg.allowImportCta !== false} onChange={e => patchCfg({ guideCfg: { ...cfg.guideCfg, allowImportCta: e.target.checked } })} className="w-4 h-4 accent-[#0071E3]" />
                <span>إظهار زر «اطلبه استيراد»</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface2 border border-line text-xs font-black cursor-pointer">
                <input type="checkbox" checked={cfg.guideCfg.allowPriceAlerts !== false} onChange={e => patchCfg({ guideCfg: { ...cfg.guideCfg, allowPriceAlerts: e.target.checked } })} className="w-4 h-4 accent-[#0071E3]" />
                <span>إظهار زر «نبّهني لو سعره نزل»</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface2 border border-line text-xs font-black cursor-pointer">
                <input type="checkbox" checked={cfg.guideCfg.enableBundleBuilder !== false} onChange={e => patchCfg({ guideCfg: { ...cfg.guideCfg, enableBundleBuilder: e.target.checked } })} className="w-4 h-4 accent-[#0071E3]" />
                <span>تفعيل «اقترحلي باكدج» في الميزانية</span>
              </label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[['camera', 'وزن الكاميرا %'], ['battery', 'وزن البطارية %'], ['screen', 'وزن الشاشة %'], ['ram', 'وزن الرام %']].map(([k, lbl]) => (
                <div key={k}>
                  <label className="text-[10px] font-black text-muted block mb-1">{lbl}</label>
                  <input type="number" min="0" max="100" defaultValue={cfg.guideCfg.valueWeights[k]} onBlur={e => patchCfg({ guideCfg: { ...cfg.guideCfg, valueWeights: { ...cfg.guideCfg.valueWeights, [k]: parseFloat(e.target.value) || 0 } } })} className="w-full px-3 py-1.5 rounded-xl border border-line bg-surface2 text-xs font-black" />
                </div>
              ))}
            </div>
            <div>
              <label className="text-[11px] font-black text-muted block mb-1">شرائح «على قد ميزانيتك» السريعة (مفصولة بفاصلة)</label>
              <input defaultValue={(cfg.guideCfg.storeBudgets || [500, 1000, 2000, 5000, 10000]).join(', ')} onBlur={e => {
                const arr = e.target.value.split(',').map(x => parseInt(x.trim(), 10)).filter(n => n > 0);
                if (arr.length) patchCfg({ guideCfg: { ...cfg.guideCfg, storeBudgets: arr } });
              }} className="w-full px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
            </div>
          </div>

          {/* 3.4b News & Live Market / Gulf Customs Controls */}
          <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
            <h3 className="font-black text-fg flex items-center gap-2"><Megaphone className="w-4 h-4 text-blue-600" /> أسس خدمة «آخر الأخبار» وربط الكتالوج والأسعار الحية</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface2 border border-line text-xs font-black cursor-pointer">
                <input type="checkbox" checked={cfg.guideCfg.enableGlobalCatalog !== false} onChange={e => patchCfg({ guideCfg: { ...cfg.guideCfg, enableGlobalCatalog: e.target.checked } })} className="w-4 h-4 accent-[#0071E3]" />
                <span>عرض كل الموديلات العالمية في الدليل</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface2 border border-line text-xs font-black cursor-pointer">
                <input type="checkbox" checked={cfg.guideCfg.autoFetchEgyptPrice !== false} onChange={e => patchCfg({ guideCfg: { ...cfg.guideCfg, autoFetchEgyptPrice: e.target.checked } })} className="w-4 h-4 accent-[#0071E3]" />
                <span>جلب السعر المصري تلقائياً تحت كل جهاز</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface2 border border-line text-xs font-black cursor-pointer">
                <input type="checkbox" checked={cfg.guideCfg.showNewsBannerInGuide !== false} onChange={e => patchCfg({ guideCfg: { ...cfg.guideCfg, showNewsBannerInGuide: e.target.checked } })} className="w-4 h-4 accent-[#0071E3]" />
                <span>إظهار شريط «آخر الأخبار» داخل الدليل</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface2 border border-line text-xs font-black cursor-pointer">
                <input type="checkbox" checked={cfg.newsCfg.enabledLive !== false} onChange={e => patchCfg({ newsCfg: { ...cfg.newsCfg, enabledLive: e.target.checked } })} className="w-4 h-4 accent-[#0071E3]" />
                <span>تفعيل الجلب الحي لـ «آخر الأخبار»</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface2 border border-line text-xs font-black cursor-pointer">
                <input type="checkbox" checked={cfg.marketCfg.enableLiveAdvisor !== false} onChange={e => patchCfg({ marketCfg: { ...cfg.marketCfg, enableLiveAdvisor: e.target.checked } })} className="w-4 h-4 accent-[#0071E3]" />
                <span>تفعيل السوق الحي في «ساعدني أختار»</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface2 border border-line text-xs font-black cursor-pointer">
                <input type="checkbox" checked={cfg.marketCfg.enableLiveRadar !== false} onChange={e => patchCfg({ marketCfg: { ...cfg.marketCfg, enableLiveRadar: e.target.checked } })} className="w-4 h-4 accent-[#0071E3]" />
                <span>تفعيل بورصة الأسعار الحية في «الرادار»</span>
              </label>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-black text-muted block mb-1">نص عدم التوفر في مصر (يظهر تحت الجهاز لو غير متاح)</label>
                <input defaultValue={cfg.guideCfg.notInEgyptLabel || 'غير متوفر في مصر حالياً'} onBlur={e => patchCfg({ guideCfg: { ...cfg.guideCfg, notInEgyptLabel: e.target.value } })} className="w-full px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
              </div>
              <div>
                <label className="text-[11px] font-black text-muted block mb-1">عنوان شريط الأخبار داخل الدليل</label>
                <input defaultValue={cfg.newsCfg.bannerTitle || 'آخر أخبار الموبايلات'} onBlur={e => patchCfg({ newsCfg: { ...cfg.newsCfg, bannerTitle: e.target.value } })} className="w-full px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] font-black text-muted block mb-1">نص تنبيه ضريبة الجمارك الـ 38.5% في خدمة «من الخليج ولا مصر؟»</label>
                <input defaultValue={cfg.gulfCfg.customsWarningText || ''} onBlur={e => patchCfg({ gulfCfg: { ...cfg.gulfCfg, customsWarningText: e.target.value } })} className="w-full px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
              </div>
            </div>
            {/* Admin Custom News Publisher */}
            <div className="space-y-2 pt-2 border-t border-line">
              <div className="text-xs font-black text-muted">إضافة خبر / مقال مخصص من الإدارة (يظهر في أعلى «آخر الأخبار» وشريط الدليل)</div>
              {(cfg.newsCfg.customArticles || []).map(art => (
                <div key={art.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-surface2 border border-line text-xs font-bold">
                  <span className="font-black text-fg flex-1 truncate">{art.title}</span>
                  <span className="text-[10px] text-muted">{art.date}</span>
                  <button type="button" onClick={() => patchCfg({ newsCfg: { ...cfg.newsCfg, customArticles: (cfg.newsCfg.customArticles || []).filter(x => x.id !== art.id) } })} className="p-1.5 rounded-lg bg-rose-600 text-white"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const title = String(fd.get('title') || '').trim();
                  const excerpt = String(fd.get('excerpt') || '').trim();
                  const image = String(fd.get('image') || '').trim();
                  if (!title) return;
                  const newArt = { id: 'cnews_' + Date.now(), title, excerpt, content: excerpt, image, category: 'أخبار ELZOGHBI', date: new Date().toISOString().slice(0, 10) };
                  patchCfg({ newsCfg: { ...cfg.newsCfg, customArticles: [newArt, ...(cfg.newsCfg.customArticles || [])] } });
                  e.currentTarget.reset();
                }}
                className="grid sm:grid-cols-4 gap-2"
              >
                <input name="title" required placeholder="عنوان الخبر أو الإعلان *" className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
                <input name="excerpt" placeholder="تفاصيل الخبر..." className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
                <input name="image" placeholder="رابط صورة (اختياري)" className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
                <button type="submit" className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-blue-600 text-white text-xs font-black"><Plus className="w-3.5 h-3.5" /> نشر الخبر</button>
              </form>
            </div>
          </div>

          {/* 3.5 Trade-in Rules */}
          <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
            <h3 className="font-black text-fg flex items-center gap-2"><RotateCcw className="w-4 h-4 text-orange-500" /> أسس خدمة «قيّم موبايلك القديم / الاستبدال»</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[['mint', 'ممتاز كالزيرو (%)'], ['good', 'جيد جداً (%)'], ['fair', 'خدوش ظاهرة (%)'], ['cracked', 'شاشة مكسورة (%)']].map(([k, lbl]) => (
                <div key={k}>
                  <label className="text-[10px] font-black text-muted block mb-1">{lbl}</label>
                  <input type="number" min="10" max="95" defaultValue={Math.round((cfg.tradeInCfg.condMult[k] || 0.6) * 100)} onBlur={e => patchCfg({ tradeInCfg: { ...cfg.tradeInCfg, condMult: { ...cfg.tradeInCfg.condMult, [k]: Math.min(0.95, Math.max(0.1, (parseFloat(e.target.value) || 50) / 100)) } } })} className="w-full px-3 py-1.5 rounded-xl border border-line bg-surface2 text-xs font-black" />
                </div>
              ))}
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-black text-muted block mb-1">خصم عدم وجود العلبة %</label>
                <input type="number" min="0" max="30" defaultValue={cfg.tradeInCfg.noBoxPenaltyPct} onBlur={e => patchCfg({ tradeInCfg: { ...cfg.tradeInCfg, noBoxPenaltyPct: parseFloat(e.target.value) || 0 } })} className="w-full px-3 py-1.5 rounded-xl border border-line bg-surface2 text-xs font-black" />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted block mb-1">خصم ضعف البطارية (&lt;80%) %</label>
                <input type="number" min="0" max="30" defaultValue={cfg.tradeInCfg.lowBatteryPenaltyPct} onBlur={e => patchCfg({ tradeInCfg: { ...cfg.tradeInCfg, lowBatteryPenaltyPct: parseFloat(e.target.value) || 0 } })} className="w-full px-3 py-1.5 rounded-xl border border-line bg-surface2 text-xs font-black" />
              </div>
              <div>
                <label className="text-[10px] font-black text-muted block mb-1">واتساب عروض البيع والاستبدال</label>
                <input defaultValue={cfg.tradeInCfg.whatsapp || ''} onBlur={e => patchCfg({ tradeInCfg: { ...cfg.tradeInCfg, whatsapp: e.target.value } })} placeholder="رقم الواتساب (اختياري)" className="w-full px-3 py-1.5 rounded-xl border border-line bg-surface2 text-xs font-bold" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: PHONES MANAGER + GSMARENA IMPORTER ================= */}
      {subTab === 'phones' && (
        <div className="space-y-4">
          {/* GSMArena Direct Importer */}
          <div className="bg-surface border border-line rounded-3xl p-5 space-y-3">
            <h3 className="font-black text-fg flex items-center gap-2"><Globe className="w-4 h-4 text-slate-600" /> استيراد أي جهاز مباشرة من الكتالوج العالمي إلى دليل المتجر</h3>
            <form onSubmit={handleGsmAdminSearch} className="flex gap-2">
              <input value={gsmQuery} onChange={e => setGsmQuery(e.target.value)} placeholder="ابحث عن أي موبايل (مثال: iPhone 16 Pro Max أو Galaxy S25 Ultra أو ايفون 15)..." className="flex-1 px-3.5 py-2.5 rounded-xl border border-line bg-surface2 text-xs font-bold" />
              <button type="submit" disabled={gsmSearching} className="px-4 py-2.5 rounded-xl bg-slate-600 hover:bg-slate-500 text-white text-xs font-black inline-flex items-center gap-1.5 shrink-0">
                <Search className="w-4 h-4" /> {gsmSearching ? 'بيبحث...' : 'بحث عالمي'}
              </button>
            </form>
            {gsmResults.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto pe-1">
                {gsmResults.slice(0, 10).map(item => (
                  <div key={item.slug} className="flex items-center gap-2.5 p-2 rounded-2xl bg-surface2 border border-line">
                    {item.img ? <img src={item.img} alt="" referrerPolicy="no-referrer" className="w-10 h-10 object-contain bg-white rounded-lg shrink-0" /> : <Smartphone className="w-6 h-6 text-muted shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-fg truncate">{item.name}</div>
                      <div className="text-[10px] font-bold text-muted">{item.slug}</div>
                    </div>
                    <input type="number" min="0" value={gsmPriceDrafts[item.slug] || ''} onChange={e => setGsmPriceDrafts(p => ({ ...p, [item.slug]: e.target.value }))} placeholder="السعر بمصر" className="w-24 px-2 py-1.5 rounded-lg border border-line bg-surface text-xs font-black" />
                    <button type="button" disabled={gsmImportingSlug === item.slug} onClick={() => handleImportFromGsm(item)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-black shrink-0">
                      {gsmImportingSlug === item.slug ? 'بيستورد...' : '+ للدليل'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seed / Live Sync / Manual Add */}
          <div className="bg-surface border border-line rounded-3xl p-5 space-y-3">
            <h3 className="font-black text-fg">المزامنة وإضافة الأجهزة</h3>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => importGuideSeed()} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-black transition"><Download className="w-4 h-4" /> استيراد البيانات المرفقة (30 جهاز)</button>
              <button type="button" disabled={sync.status === 'running'} onClick={() => syncGuideLive()} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white text-xs font-black transition"><RefreshCw className={`w-4 h-4 ${sync.status === 'running' ? 'animate-spin' : ''}`} /> {sync.status === 'running' ? (sync.msg || 'بيزامن...') : 'مزامنة حية من المصدر'}</button>
              <button type="button" onClick={() => setManualOpen(v => !v)} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition"><Plus className="w-4 h-4" /> إضافة جهاز يدوياً</button>
            </div>
            {manualOpen && (
              <form onSubmit={handleManualAdd} className="grid sm:grid-cols-3 gap-2.5 p-3.5 rounded-2xl bg-surface2 border border-line">
                <input required value={manualForm.name} onChange={e => setManualForm(p => ({ ...p, name: e.target.value }))} placeholder="اسم الجهاز *" className="px-3 py-2 rounded-xl border border-line bg-surface text-xs font-bold" />
                <input value={manualForm.brand} onChange={e => setManualForm(p => ({ ...p, brand: e.target.value }))} placeholder="الماركة" className="px-3 py-2 rounded-xl border border-line bg-surface text-xs font-bold" />
                <input type="number" value={manualForm.price} onChange={e => setManualForm(p => ({ ...p, price: e.target.value }))} placeholder="سعر السوق الاسترشادي (ج.م)" className="px-3 py-2 rounded-xl border border-line bg-surface text-xs font-bold" />
                <input type="number" step="0.1" value={manualForm.screen} onChange={e => setManualForm(p => ({ ...p, screen: e.target.value }))} placeholder="حجم الشاشة (بوصة)" className="px-3 py-2 rounded-xl border border-line bg-surface text-xs font-bold" />
                <input type="number" value={manualForm.camera} onChange={e => setManualForm(p => ({ ...p, camera: e.target.value }))} placeholder="الكاميرا (ميجا)" className="px-3 py-2 rounded-xl border border-line bg-surface text-xs font-bold" />
                <input type="number" value={manualForm.battery} onChange={e => setManualForm(p => ({ ...p, battery: e.target.value }))} placeholder="البطارية (mAh)" className="px-3 py-2 rounded-xl border border-line bg-surface text-xs font-bold" />
                <input type="number" value={manualForm.ramMax} onChange={e => setManualForm(p => ({ ...p, ramMax: e.target.value }))} placeholder="الرام (جيجا)" className="px-3 py-2 rounded-xl border border-line bg-surface text-xs font-bold" />
                <input type="number" value={manualForm.storageMax} onChange={e => setManualForm(p => ({ ...p, storageMax: e.target.value }))} placeholder="التخزين (جيجا)" className="px-3 py-2 rounded-xl border border-line bg-surface text-xs font-bold" />
                <input value={manualForm.image} onChange={e => setManualForm(p => ({ ...p, image: e.target.value }))} placeholder="رابط الصورة (اختياري)" className="px-3 py-2 rounded-xl border border-line bg-surface text-xs font-bold" />
                <button type="submit" className="sm:col-span-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black">حفظ الجهاز في الدليل</button>
              </form>
            )}
            {sync.status === 'done' && sync.report && (
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-3 text-xs font-bold text-fg space-y-1">
                <div>المزامنة خلصت: لقينا {sync.report.found} جهاز — جديد {sync.report.added} · اتحدّث {sync.report.updated} · أسعار اتغيرت {sync.report.priceChanges.length}</div>
                {sync.report.priceChanges.slice(0, 8).map((c, i) => <div key={i} className="text-muted">• {c.name}: من {formatMoney(c.from)} لـ {formatMoney(c.to)}</div>)}
              </div>
            )}
            {sync.status === 'error' && <div className="rounded-2xl bg-rose-500/10 border border-rose-500/25 p-3 text-xs font-bold text-rose-600">{sync.msg}</div>}
            {lastSync && <div className="text-[11px] font-bold text-muted">آخر مزامنة محفوظة: {lastSync.at} — جديد {lastSync.added} · اتحدّث {lastSync.updated} · أسعار اتغيرت {(lastSync.priceChanges || []).length}</div>}
          </div>

          {/* Phones list */}
          <div className="bg-surface border border-line rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-black text-fg">أجهزة الدليل ({filteredPhones.length} / {phones.length})</h3>
              <input value={phoneSearch} onChange={e => setPhoneSearch(e.target.value)} placeholder="فلترة الأجهزة..." className="px-3 py-1.5 rounded-xl border border-line bg-surface2 text-xs font-bold w-56" />
            </div>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pe-1">
              {filteredPhones.map(ph => (
                <div key={ph.id} className={`flex items-center gap-3 p-2.5 rounded-2xl border border-line ${ph.enabled === false ? 'opacity-55' : ''}`}>
                  {ph.images && ph.images[0] ? <img src={ph.images[0]} alt="" referrerPolicy="no-referrer" className="w-11 h-11 object-contain bg-white rounded-xl shrink-0" /> : <span className="w-11 h-11 rounded-xl bg-surface2 flex items-center justify-center shrink-0"><Smartphone className="w-5 h-5 text-muted" /></span>}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-fg truncate">{ph.name}</div>
                    <div className="text-[10px] font-bold text-muted">{ph.brand} · قيمة مقابل السعر: {ph.valueScore || '—'}{ph.priceDate ? ` · آخر مراجعة ${ph.priceDate}` : ''}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input type="number" min="0" value={priceDrafts[ph.id] !== undefined ? priceDrafts[ph.id] : (ph.price || '')} onChange={e => setPriceDrafts(p => ({ ...p, [ph.id]: e.target.value }))} className="w-24 px-2 py-1.5 rounded-lg border border-line bg-surface2 text-xs font-black text-fg" title="سعر السوق الاسترشادي" />
                    <button type="button" onClick={() => updateGuidePhone(ph.id, { price: parseFloat(priceDrafts[ph.id]) || ph.price })} className="p-2 rounded-lg bg-[#0071E3] text-white" title="حفظ السعر"><Save className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => toggleGuidePhone(ph.id)} className={`p-2 rounded-lg text-white ${ph.enabled === false ? 'bg-slate-400' : 'bg-emerald-600'}`} title={ph.enabled === false ? 'إظهار' : 'إخفاء'}>{ph.enabled === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                    <button type="button" onClick={() => { if (window.confirm(`حذف ${ph.name} من الدليل؟`)) deleteGuidePhone(ph.id); }} className="p-2 rounded-lg bg-rose-600 text-white" title="حذف"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
              {filteredPhones.length === 0 && <div className="text-center text-muted font-bold py-6">لا توجد أجهزة مطابقة</div>}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 6: STORE & PLATFORM REVIEWS MODERATION ================= */}
      {subTab === 'reviews_mgr' && (
        <div className="space-y-4">
          {/* Moderation & Policy Settings */}
          <div className="bg-surface border border-line rounded-3xl p-5 space-y-3">
            <h3 className="font-black text-fg flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-600" /> إعدادات خدمة تقييم المحلات والمنصات</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface2 border border-line text-xs font-black cursor-pointer">
                <input type="checkbox" checked={cfg.reviewsCfg.requireLoginToReview !== false} onChange={e => patchCfg({ reviewsCfg: { ...cfg.reviewsCfg, requireLoginToReview: e.target.checked } })} className="w-4 h-4 accent-[#0071E3]" />
                <span>إجبار العميل على تسجيل الدخول لكتابة تقييم أو سؤال</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface2 border border-line text-xs font-black cursor-pointer">
                <input type="checkbox" checked={cfg.reviewsCfg.requireApproval !== false} onChange={e => patchCfg({ reviewsCfg: { ...cfg.reviewsCfg, requireApproval: e.target.checked } })} className="w-4 h-4 accent-[#0071E3]" />
                <span>مراجعة التقييم قبل النشر (موصى به)</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface2 border border-line text-xs font-black cursor-pointer">
                <input type="checkbox" checked={cfg.reviewsCfg.allowNewStoreSubmission !== false} onChange={e => patchCfg({ reviewsCfg: { ...cfg.reviewsCfg, allowNewStoreSubmission: e.target.checked } })} className="w-4 h-4 accent-[#0071E3]" />
                <span>السماح للزوار باقتراح محل جديد</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface2 border border-line text-xs font-black cursor-pointer">
                <input type="checkbox" checked={cfg.reviewsCfg.allowProofUpload !== false} onChange={e => patchCfg({ reviewsCfg: { ...cfg.reviewsCfg, allowProofUpload: e.target.checked } })} className="w-4 h-4 accent-[#0071E3]" />
                <span>السماح برفع فاتورة للتوثيق</span>
              </label>
              <label className="flex items-center gap-2 p-3 rounded-2xl bg-surface2 border border-line text-xs font-black cursor-pointer">
                <input type="checkbox" checked={cfg.reviewsCfg.showStoreCta !== false} onChange={e => patchCfg({ reviewsCfg: { ...cfg.reviewsCfg, showStoreCta: e.target.checked } })} className="w-4 h-4 accent-[#0071E3]" />
                <span>إظهار شريط إكسسوارات ELZOGHBI</span>
              </label>
            </div>
            <div>
              <label className="text-[11px] font-black text-muted block mb-1">رسالة التحفيز / نقاط الولاء في نموذج كتابة التقييم</label>
              <input defaultValue={cfg.reviewsCfg.loyaltyRewardNote || ''} onBlur={e => patchCfg({ reviewsCfg: { ...cfg.reviewsCfg, loyaltyRewardNote: e.target.value } })} className="w-full px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
            </div>
            <div className="rounded-2xl bg-slate-500/10 border border-slate-500/30 p-4 space-y-2">
              <div className="text-xs font-black text-slate-800 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-4 h-4" /> ربط خرائط جوجل (Google Places API) لجلب آلاف المحلات والتقييمات الحقيقية تلقائياً
              </div>
              <p className="text-[11px] font-bold text-muted leading-relaxed">
                البحث الحي شغال تلقائياً ومجاناً عبر خرائط مصر المفتوحة (OpenStreetMap) وتقييمات Trustpilot، وتقدر كمان تضيف مفتاح Google Maps Places API (الباقة المجانية الشهرية من Google Cloud) هنا أو في متغيرات Vercel باسم <code className="px-1 py-0.5 rounded bg-surface">GOOGLE_PLACES_API_KEY</code> عشان يجيب كل محلات مصر بتقييمات وتعليقات خرائط جوجل الحقيقية فوراً:
              </p>
              <input
                type="password"
                defaultValue={cfg.reviewsCfg.googlePlacesApiKey || ''}
                onBlur={e => patchCfg({ reviewsCfg: { ...cfg.reviewsCfg, googlePlacesApiKey: e.target.value.trim() } })}
                placeholder="AIzaSy... (اختياري — يُحفظ تلقائياً عند الخروج من الخانة)"
                className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-xs font-bold"
              />
            </div>
          </div>

          {/* Reviews Moderation Queue */}
          <div className="bg-surface border border-line rounded-3xl p-5 space-y-3">
            <h3 className="font-black text-fg">طابور مراجعة تجارب العملاء ({(storeReviewEntries || []).length})</h3>
            <div className="space-y-2.5 max-h-[460px] overflow-y-auto pe-1">
              {(storeReviewEntries || []).map(r => {
                const ent = (storeReviewEntities || []).find(e => e.id === r.entityId);
                return (
                  <div key={r.id} className={`p-3.5 rounded-2xl border space-y-2 ${r.status === 'pending' ? 'border-amber-400 bg-amber-500/5' : 'border-line bg-surface2/40'}`}>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-fg">{ent ? ent.name : r.entityId}</span>
                        <span className="text-[11px] font-bold text-muted">· {r.authorName} {r.authorPhone ? `(${r.authorPhone})` : ''}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black text-white ${r.status === 'approved' ? 'bg-emerald-600' : r.status === 'rejected' ? 'bg-rose-600' : 'bg-amber-500'}`}>
                          {r.status === 'approved' ? 'منشور' : r.status === 'rejected' ? 'مرفوض' : 'بانتظار الموافقة'}
                        </span>
                        {r.verifiedPurchase && <span className="px-2 py-0.5 rounded-full bg-[#0071E3] text-white text-[9px] font-black">موثّق ✓</span>}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {r.status !== 'approved' && <button type="button" onClick={() => moderateStoreReview && moderateStoreReview(r.id, { status: 'approved' })} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black">موافقة ونشر</button>}
                        <button type="button" onClick={() => moderateStoreReview && moderateStoreReview(r.id, { verifiedPurchase: !r.verifiedPurchase })} className="px-2.5 py-1 rounded-lg bg-[#0071E3] text-white text-[10px] font-black">{r.verifiedPurchase ? 'إلغاء التوثيق' : 'توثيق ✓'}</button>
                        <button type="button" onClick={() => moderateStoreReview && moderateStoreReview(r.id, { resolved: !r.resolved })} className="px-2.5 py-1 rounded-lg bg-slate-600 text-white text-[10px] font-black">{r.resolved ? 'إلغاء الحل' : 'تم حل الشكوى'}</button>
                        <button type="button" onClick={() => deleteStoreReview && deleteStoreReview(r.id)} className="p-1.5 rounded-lg bg-rose-600 text-white"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-fg">{r.comment}</div>
                    {r.proofImage && (
                      <div className="pt-1">
                        <a href={r.proofImage} target="_blank" rel="noopener noreferrer" className="text-[11px] font-black text-[#0066CC] underline">عرض صورة إثبات الشراء المرفقة (سرية للإدارة فقط)</a>
                      </div>
                    )}
                    <div className="flex gap-1.5 pt-1">
                      <input
                        defaultValue={r.officialReply || ''}
                        onBlur={e => { if (e.target.value !== (r.officialReply || '')) moderateStoreReview && moderateStoreReview(r.id, { officialReply: e.target.value }); }}
                        placeholder="أضف رداً رسمياً من المحل أو الإدارة (يُحفظ تلقائياً عند الخروج)..."
                        className="flex-1 px-2.5 py-1.5 rounded-xl border border-line bg-surface text-xs font-bold"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stores & Platforms Directory Manager */}
          <div className="bg-surface border border-line rounded-3xl p-5 space-y-3">
            <h3 className="font-black text-fg">إدارة المحلات والمنصات ({(storeReviewEntities || []).length})</h3>
            <div className="space-y-2 max-h-[380px] overflow-y-auto pe-1">
              {(storeReviewEntities || []).map(ent => (
                <div key={ent.id} className={`flex items-center gap-2.5 p-2.5 rounded-2xl border flex-wrap ${ent.approved === false ? 'border-amber-400 bg-amber-500/5' : 'border-line'}`}>
                  <div className="flex-1 min-w-[180px]">
                    <div className="text-xs font-black text-fg">{ent.name}</div>
                    <div className="text-[10px] font-bold text-muted">{ent.governorate} · تقييم جوجل: {ent.googleRating || '—'}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {ent.approved === false && <button type="button" onClick={() => updateStoreEntity && updateStoreEntity(ent.id, { approved: true })} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black">اعتماد المحل</button>}
                    <button type="button" onClick={() => updateStoreEntity && updateStoreEntity(ent.id, { featured: !ent.featured })} className={`px-2.5 py-1 rounded-lg text-[10px] font-black ${ent.featured ? 'bg-amber-500 text-white' : 'bg-surface2 border border-line text-fg'}`}>{ent.featured ? '★ مثبت وموثوق' : 'تثبيت كموثوق'}</button>
                    <button type="button" onClick={() => { if (window.confirm(`حذف ${ent.name}؟`)) deleteStoreEntity && deleteStoreEntity(ent.id); }} className="p-1.5 rounded-lg bg-rose-600 text-white"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: ALERTS & ANALYTICS ================= */}
      {subTab === 'alerts' && (
        <div className="space-y-4">
          {/* Analytics */}
          <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-black text-fg">تحليلات استخدام خدمات كرومبو</h3>
                <p className="text-[11px] font-bold text-muted">تتبع أكثر الخدمات والأجهزة التي يهتم بها زوارك لتوفير إكسسواراتها وقطع غيارها</p>
              </div>
              {resetKaramboStats && (
                <button type="button" onClick={() => resetKaramboStats()} className="px-3 py-1.5 rounded-xl bg-surface2 border border-line text-[11px] font-black text-muted hover:text-rose-600">تصفير العدادات</button>
              )}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-surface2/60 border border-line p-3.5 space-y-2">
                <div className="text-xs font-black text-fg">الزيارات حسب الخدمة (الإجمالي: {totalVisits})</div>
                {orderedServices.map(s => {
                  const cnt = Number((stats.visits || {})[s.id] || 0);
                  const pct = totalVisits > 0 ? Math.round((cnt / totalVisits) * 100) : 0;
                  return (
                    <div key={s.id} className="space-y-0.5">
                      <div className="flex justify-between text-[11px] font-bold"><span className="text-fg">{s.title}</span><span className="text-muted">{cnt} ({pct}%)</span></div>
                      <div className="h-1.5 rounded-full bg-surface overflow-hidden"><div className={`h-full ${s.color}`} style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-2xl bg-surface2/60 border border-line p-3.5 space-y-2">
                <div className="text-xs font-black text-fg">أكثر الأجهزة بحثاً ومقارنةً</div>
                {topPhonesArr.length === 0 ? (
                  <div className="text-xs font-bold text-muted py-6 text-center">ستظهر هنا أكثر الأجهزة التي يفتحها أو يقارنها العملاء تلقائياً</div>
                ) : (
                  topPhonesArr.map(([name, cnt], i) => (
                    <div key={name} className="flex items-center justify-between text-xs font-bold py-1 border-b border-line/60 last:border-0">
                      <span className="text-fg truncate">{i + 1}. {name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#0071E3]/15 text-[#0066CC] dark:text-[#2997FF] text-[10px] font-black">{cnt} مرة</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Price Alerts */}
          <div className="bg-surface border border-line rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-fg">طلبات «نبّهني عند نزول السعر» ({(priceAlertsAdmin || []).length})</h3>
              <div className="ms-auto flex gap-1.5">
                <button type="button" onClick={exportAlertsCsv} disabled={!(priceAlertsAdmin || []).length} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 disabled:opacity-40 text-white text-[11px] font-black"><FileText className="w-3.5 h-3.5" /> تصدير CSV</button>
                <button type="button" onClick={() => loadPriceAlerts()} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface2 border border-line text-[11px] font-black text-fg"><RefreshCw className="w-3.5 h-3.5" /> تحديث</button>
              </div>
            </div>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pe-1">
              {(priceAlertsAdmin || []).map(a => {
                const ph = phones.find(p => p.id === a.phoneId);
                const cleanPhone = String(a.contact || '').replace(/\D+/g, '');
                const waNum = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
                const waMsg = `أهلاً ${a.name || ''} 👋 من ELZOGHBI MARKET — بخصوص تنبيه السعر لجهاز ${a.phoneName || ''}${ph && ph.price ? `، السعر الاسترشادي حالياً ${formatMoney(ph.price)}` : ''}.`;
                return (
                  <div key={a.id} className="flex items-center gap-3 p-3 rounded-2xl border border-line flex-wrap">
                    <Bell className={`w-4 h-4 shrink-0 ${a.status === 'contacted' ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <div className="flex-1 min-w-[180px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black text-fg truncate">{a.phoneName || a.phoneId}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black text-white ${a.status === 'contacted' ? 'bg-emerald-600' : 'bg-amber-500'}`}>
                          {a.status === 'contacted' ? 'تم التواصل' : 'جديد'}
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-muted">{a.name || '—'} · {a.contact || '—'} · عند {formatMoney(a.priceAt || 0)}{a.createdAt ? ` · ${String(a.createdAt).slice(0, 10)}` : ''}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {waNum && (
                        <a href={`https://wa.me/${waNum}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-black" title="مراسلة واتساب">
                          <MessageSquare className="w-3.5 h-3.5" /> واتساب
                        </a>
                      )}
                      {updatePriceAlertStatus && (
                        <button type="button" onClick={() => updatePriceAlertStatus(a.id, a.status === 'contacted' ? 'new' : 'contacted')} className="p-2 rounded-lg bg-surface2 border border-line text-fg" title="تغيير الحالة">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button type="button" onClick={() => deletePriceAlert(a.id)} className="p-2 rounded-lg bg-rose-600 text-white shrink-0" title="حذف"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              })}
              {(priceAlertsAdmin || []).length === 0 && <div className="text-center text-muted font-bold py-4 text-sm">مفيش طلبات تنبيه لسه — هتظهر هنا أول ما زائر يفعّل تنبيه من صفحة أي جهاز</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function renderAdminKarambo(ctx) {
  return <KaramboAdminPanel ctx={ctx} />;
}
