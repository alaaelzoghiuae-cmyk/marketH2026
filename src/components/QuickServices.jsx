import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowUp, ArrowDown, Trash2, Plus, Eye, EyeOff, Sparkles, ExternalLink, Save } from 'lucide-react';

// Dynamic quick-services shelf shown under "كرومبو الشغلانة" (home).
// Everything comes from karamboCfg.quickServices (managed in the dashboard) — nothing hard-coded per service.
export const QUICK_MODES = { inline: 'مفتوحة بالكامل تحت الشريط (تفاعلي)', card: 'كارت مختصر', link: 'رابط مباشر (شريحة)' };
export const DEFAULT_QUICK_SERVICES = {
  enabled: true,
  title: 'اختصارات سريعة',
  items: [{ id: 'qs_tradein', serviceId: 'tradein', enabled: true, label: '', mode: 'inline', showIcon: true, iconUrl: '', order: 0 }]
};
export function getQuickConfig(cfg) {
  const q = cfg && cfg.quickServices && typeof cfg.quickServices === 'object' ? cfg.quickServices : DEFAULT_QUICK_SERVICES;
  const items = Array.isArray(q.items) ? q.items : [];
  return { enabled: q.enabled !== false, title: q.title || 'اختصارات سريعة', items: [...items].sort((a, b) => (a.order || 0) - (b.order || 0)) };
}

function ItemIcon({ item, svc, icons }) {
  if (item.showIcon === false) return null;
  if (item.iconUrl) return <img src={item.iconUrl} alt="" className="w-9 h-9 rounded-xl object-cover bg-surface2 shrink-0" loading="lazy" />;
  const Icon = (icons && icons[svc.icon]) || Sparkles;
  return <span className={`w-9 h-9 rounded-xl ${svc.color || 'bg-slate-700'} flex items-center justify-center shrink-0`}><Icon className="w-[18px] h-[18px] text-white" strokeWidth={1.75} /></span>;
}

function EmbeddedService({ serviceId, ctx, renderEmbedded }) {
  const [local, setLocal] = useState({});
  const realSet = ctx.setKaramboUi;
  const setter = (fn) => {
    const patch = typeof fn === 'function' ? fn({ ...(ctx.karamboUi || {}), page: serviceId, ...local }) : fn;
    if (patch && patch.page && patch.page !== serviceId) { // service wants to navigate elsewhere → go to the real Karambo page
      realSet((p) => ({ ...p, ...patch })); ctx.setClientTab('karambo'); window.scrollTo({ top: 0 });
    } else setLocal((p) => ({ ...p, ...patch }));
  };
  return <div className="qs-embedded">{renderEmbedded(serviceId, { ...(ctx.karamboUi || {}), ...local, page: serviceId }, setter)}</div>;
}

export function QuickServicesBar({ ctx, cfg, services, icons, renderEmbedded }) {
  const q = getQuickConfig(cfg);
  const [closed, setClosed] = useState({});
  if (!q.enabled) return null;
  const byId = new Map(services.map((s) => [s.id, s]));
  const visible = q.items.filter((it) => it.enabled !== false && (byId.get(it.serviceId) || it.serviceId === 'sell'));
  if (!visible.length) return null;
  const svcOf = (it) => byId.get(it.serviceId) || { id: 'sell', title: 'بيع عندنا', desc: 'موبايلات مستعملة من مستخدمين — بعد مراجعة الإدارة', icon: 'Tag', color: 'bg-emerald-600' };
  const open = (it) => {
    if (it.serviceId === 'sell') { window.location.hash = '#/sell'; ctx.setClientTab('sell'); window.scrollTo({ top: 0 }); return; }
    if (ctx.trackKaramboEvent) ctx.trackKaramboEvent('visit', it.serviceId);
    ctx.setKaramboUi((p) => ({ ...p, page: it.serviceId })); ctx.setClientTab('karambo'); window.scrollTo({ top: 0 });
  };
  const inline = visible.filter((it) => it.mode === 'inline' && it.serviceId !== 'sell');
  const strip = visible.filter((it) => it.mode !== 'inline' || it.serviceId === 'sell');

  return (
    <section id="quick-services" aria-label={q.title} className="space-y-3">
      <div className="flex items-center justify-between"><h4 className="text-[15px] font-semibold text-fg">{q.title}</h4></div>
      {strip.length > 0 && (
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          {strip.map((it) => {
            const svc = svcOf(it); const label = it.label || svc.title;
            return it.mode === 'link' ? (
              <button key={it.id} type="button" onClick={() => open(it)} className="snap-start shrink-0 inline-flex items-center gap-2 ps-2 pe-4 py-1.5 rounded-full bg-surface hover:bg-surface2 border border-line text-[13px] font-medium text-fg transition">
                <ItemIcon item={it} svc={svc} icons={icons} />{label}
              </button>
            ) : (
              <button key={it.id} type="button" onClick={() => open(it)} className="snap-start shrink-0 w-[250px] text-start rounded-[20px] bg-surface hover:bg-surface2 p-3.5 flex items-center gap-3 transition">
                <ItemIcon item={it} svc={svc} icons={icons} />
                <span className="min-w-0"><span className="block text-[14px] font-semibold text-fg truncate">{label}</span><span className="block text-[12px] text-muted line-clamp-2">{svc.desc}</span></span>
              </button>
            );
          })}
        </div>
      )}
      {inline.map((it) => {
        const svc = svcOf(it); const label = it.label || svc.title; const isClosed = closed[it.id] !== false;
        return (
          <div key={it.id} className="rounded-[24px] bg-surface border border-line overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <button type="button" onClick={() => setClosed((p) => ({ ...p, [it.id]: p[it.id] === false }))} className="flex items-center gap-3 min-w-0 flex-1 text-start" aria-expanded={!isClosed}>
                <ItemIcon item={it} svc={svc} icons={icons} />
                <span className="min-w-0"><span className="block text-[15px] font-semibold text-fg truncate">{label}</span><span className="block text-[12px] text-muted truncate">{svc.desc}</span></span>
                {isClosed ? <ChevronDown className="w-4 h-4 text-muted shrink-0" /> : <ChevronUp className="w-4 h-4 text-muted shrink-0" />}
              </button>
              <button type="button" onClick={() => open(it)} className="shrink-0 inline-flex items-center gap-1 text-[12px] font-medium text-[#0066CC] dark:text-[#2997FF] hover:underline"><ExternalLink className="w-3.5 h-3.5" /> الصفحة الكاملة</button>
            </div>
            {!isClosed && <div className="px-3 sm:px-4 pb-4"><EmbeddedService serviceId={it.serviceId} ctx={ctx} renderEmbedded={renderEmbedded} /></div>}
          </div>
        );
      })}
    </section>
  );
}

// ------------------------------------------------------------------ dashboard
export function QuickServicesAdmin({ cfg, services, icons, patchCfg }) {
  const q = getQuickConfig(cfg);
  const [draft, setDraft] = useState(() => ({ ...q, items: q.items.map((i) => ({ ...i })) }));
  const [dirty, setDirty] = useState(false);
  const upd = (next) => { setDraft(next); setDirty(true); };
  const setItem = (idx, patch) => upd({ ...draft, items: draft.items.map((it, i) => (i === idx ? { ...it, ...patch } : it)) });
  const move = (idx, d) => { const a = [...draft.items]; const j = idx + d; if (j < 0 || j >= a.length) return; [a[idx], a[j]] = [a[j], a[idx]]; upd({ ...draft, items: a.map((x, i) => ({ ...x, order: i })) }); };
  const add = () => upd({ ...draft, items: [...draft.items, { id: `qs_${Date.now().toString(36)}`, serviceId: services[0] ? services[0].id : 'guide', enabled: true, label: '', mode: 'card', showIcon: true, iconUrl: '', order: draft.items.length }] });
  const del = (idx) => upd({ ...draft, items: draft.items.filter((_, i) => i !== idx).map((x, i) => ({ ...x, order: i })) });
  const save = () => { patchCfg({ quickServices: { ...draft, items: draft.items.map((x, i) => ({ ...x, order: i })) } }); setDirty(false); };
  const all = [...services, { id: 'sell', title: 'بيع عندنا', desc: 'سوق الموبايلات المستعملة', icon: 'Tag', color: 'bg-emerald-600' }];
  const byId = new Map(all.map((s) => [s.id, s]));
  const inp = 'rounded-xl border border-line bg-bg px-3 py-2 text-xs font-semibold text-fg';

  return (
    <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><h3 className="font-black text-fg">اختصارات الخدمات (Quick Services)</h3><p className="text-[11px] font-bold text-muted">تظهر تحت شريط «{(cfg && cfg.title) || 'كرومبو الشغلانة'}» في الرئيسية. الخدمات «المفتوحة» تعمل بكامل حقولها بدون دخول صفحة الخدمة.</p></div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs font-black"><input type="checkbox" checked={draft.enabled} onChange={(e) => upd({ ...draft, enabled: e.target.checked })} /> تفعيل الشريط</label>
          <button type="button" onClick={save} disabled={!dirty} className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#0071E3] disabled:opacity-40 text-white text-xs font-black"><Save className="w-3.5 h-3.5" /> نشر</button>
        </div>
      </div>
      <input value={draft.title} onChange={(e) => upd({ ...draft, title: e.target.value })} className={`${inp} w-full`} placeholder="عنوان الشريط" />
      <div className="space-y-2">
        {draft.items.map((it, idx) => (
          <div key={it.id} className={`rounded-2xl border p-3 grid md:grid-cols-12 gap-2 items-center ${it.enabled !== false ? 'border-line bg-bg' : 'border-line/50 bg-bg/40 opacity-70'}`}>
            <select value={it.serviceId} onChange={(e) => setItem(idx, { serviceId: e.target.value })} className={`${inp} md:col-span-3`}>{all.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}</select>
            <input value={it.label} onChange={(e) => setItem(idx, { label: e.target.value })} placeholder={`الاسم المختصر (الافتراضي: ${(byId.get(it.serviceId) || {}).title || ''})`} className={`${inp} md:col-span-3`} />
            <select value={it.mode} onChange={(e) => setItem(idx, { mode: e.target.value })} className={`${inp} md:col-span-3`}>{Object.entries(QUICK_MODES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <div className="md:col-span-3 flex items-center justify-end gap-1">
              <button type="button" title="ترتيب لأعلى" onClick={() => move(idx, -1)} className="p-1.5 rounded-lg bg-surface2"><ArrowUp className="w-3.5 h-3.5" /></button>
              <button type="button" title="ترتيب لأسفل" onClick={() => move(idx, 1)} className="p-1.5 rounded-lg bg-surface2"><ArrowDown className="w-3.5 h-3.5" /></button>
              <button type="button" title={it.enabled !== false ? 'إخفاء' : 'إظهار'} onClick={() => setItem(idx, { enabled: it.enabled === false })} className="p-1.5 rounded-lg bg-surface2">{it.enabled !== false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</button>
              <button type="button" title="حذف الاختصار (الخدمة نفسها لا تُحذف)" onClick={() => del(idx)} className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <label className="md:col-span-3 flex items-center gap-1.5 text-[11px] font-bold"><input type="checkbox" checked={it.showIcon !== false} onChange={(e) => setItem(idx, { showIcon: e.target.checked })} /> إظهار الأيقونة / الصورة</label>
            <input value={it.iconUrl || ''} onChange={(e) => setItem(idx, { iconUrl: e.target.value })} placeholder="رابط صورة مخصصة (اختياري)" className={`${inp} md:col-span-9`} dir="ltr" />
          </div>
        ))}
        <button type="button" onClick={add} className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-surface2 hover:bg-line text-xs font-black"><Plus className="w-3.5 h-3.5" /> إضافة اختصار</button>
      </div>
      <div className="rounded-2xl bg-bg border border-dashed border-line p-3 space-y-2">
        <div className="text-[11px] font-black text-muted">معاينة قبل النشر (بالنسخة الحالية للمسودة)</div>
        {!draft.enabled ? <div className="text-xs font-bold text-muted">الشريط متوقف — لن يظهر للعملاء.</div> : (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {draft.items.filter((i) => i.enabled !== false).map((it) => {
              const svc = byId.get(it.serviceId) || { title: it.serviceId, icon: 'Sparkles', color: 'bg-slate-700' }; const Ic = (icons && icons[svc.icon]) || Sparkles;
              return (<div key={it.id} className={`shrink-0 flex items-center gap-2 ${it.mode === 'link' ? 'rounded-full ps-1.5 pe-3 py-1' : 'rounded-2xl p-2.5 min-w-[190px]'} bg-surface border border-line`}>
                {it.showIcon !== false && (it.iconUrl ? <img src={it.iconUrl} alt="" className="w-8 h-8 rounded-lg object-cover" /> : <span className={`w-8 h-8 rounded-lg ${svc.color} flex items-center justify-center`}><Ic className="w-4 h-4 text-white" /></span>)}
                <span className="text-xs font-semibold text-fg">{it.label || svc.title}{it.mode === 'inline' ? ' ▾ (مفتوحة)' : ''}</span></div>);
            })}
          </div>)}
      </div>
    </div>
  );
}
