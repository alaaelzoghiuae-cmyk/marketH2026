import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Check, X, EyeOff, Eye, Star, Trash2, Save, Clock, Flag, ShieldCheck, LogIn } from 'lucide-react';
import { ensureFreshAdminJwt } from '../lib/sbAuth.js';
import { PhoneStage, StatusBadge, STATUS_META, COND, SCREEN, BODY } from './Marketplace.jsx';

const money = (n) => `${Number(n || 0).toLocaleString('ar-EG')} ج.م`;
const when = (d) => { try { return new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return ''; } };
const ACTION_AR = { submitted: 'إرسال الإعلان', approve: 'موافقة', publish: 'نشر', reject: 'رفض', admin_hide: 'إخفاء (إدارة)', admin_unhide: 'إظهار', seller_hide: 'إخفاء (بائع)', seller_reactivate: 'إعادة تفعيل (بائع)', mark_sold: 'تم البيع (بائع)', admin_mark_sold: 'تم البيع (إدارة)', admin_expire: 'انتهاء', feature: 'تمييز', unfeature: 'إلغاء التمييز', admin_edit: 'تعديل إداري', admin_delete: 'حذف', edit_minor: 'تعديل بسيط (بائع)', edit_sensitive: 'تعديل جوهري → مراجعة', auto_hide_reports: 'إخفاء تلقائي (بلاغات)' };
const REPORT_AR = { scam: 'احتيال', fake_device: 'مقلد', stolen: 'مسروق', wrong_info: 'بيانات خاطئة', spam: 'مزعج', abusive: 'مسيء', other: 'آخر' };
const inp = 'rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold text-fg outline-none focus:border-[#0071E3]';

export default function AdminMarketplace({ sbUrl, sbKey, showToast }) {
  const [jwt, setJwt] = useState(null);
  const [rows, setRows] = useState([]); const [reports, setReports] = useState([]); const [loading, setLoading] = useState(false);
  const [view, setView] = useState('listings'); const [status, setStatus] = useState('pending_review'); const [brand, setBrand] = useState('ALL'); const [city, setCity] = useState('ALL'); const [q, setQ] = useState('');
  const [sel, setSel] = useState(null); const [hist, setHist] = useState([]); const [reason, setReason] = useState(''); const [edit, setEdit] = useState({});

  const hdr = useCallback((t) => ({ apikey: sbKey, Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }), [sbKey]);
  const load = useCallback(async () => {
    const t = await ensureFreshAdminJwt(sbUrl, sbKey); setJwt(t || '');
    if (!t) return;
    setLoading(true);
    try {
      await fetch(`${sbUrl}/rest/v1/rpc/mp_expire_stale`, { method: 'POST', headers: hdr(t), body: '{}' });
      const [a, b] = await Promise.all([
        fetch(`${sbUrl}/rest/v1/marketplace_listings?select=*&deleted_at=is.null&order=created_at.desc&limit=500`, { headers: hdr(t) }),
        fetch(`${sbUrl}/rest/v1/marketplace_reports?select=*,marketplace_listings(title,public_id,status)&order=created_at.desc&limit=200`, { headers: hdr(t) })
      ]);
      if (a.ok) setRows(await a.json()); else if (a.status === 404) showToast && showToast('جداول بيع عندنا غير موجودة — شغّل sql/08_marketplace.sql', 'error');
      else showToast && showToast('تعذر جلب الإعلانات — تأكد أن حسابك مدير ولديه صلاحية marketplace', 'error');
      if (b.ok) setReports(await b.json());
    } catch (e) { showToast && showToast('خطأ في الاتصال', 'error'); }
    setLoading(false);
  }, [sbUrl, sbKey, hdr, showToast]);
  useEffect(() => { load(); const i = setInterval(load, 90_000); return () => clearInterval(i); }, [load]);

  const openRow = async (r) => {
    setSel(r); setReason(''); setEdit({ title: r.title, price: r.price, city: r.city, area: r.area || '', description: r.description || '', defects: r.defects || '', admin_note: r.admin_note || '' });
    const t = await ensureFreshAdminJwt(sbUrl, sbKey);
    const h = await fetch(`${sbUrl}/rest/v1/marketplace_listing_status_history?listing_id=eq.${r.id}&order=created_at.desc&limit=100`, { headers: hdr(t) });
    setHist(h.ok ? await h.json() : []);
  };
  const act = async (action, patch) => {
    if (!sel) return;
    if (['reject', 'delete'].includes(action) && !reason.trim()) { showToast && showToast('اكتب السبب أولًا', 'warning'); return; }
    if (action === 'delete' && !window.confirm('حذف الإعلان (حذف ناعم قابل للاسترجاع من قاعدة البيانات)؟')) return;
    const t = await ensureFreshAdminJwt(sbUrl, sbKey);
    const r = await fetch(`${sbUrl}/rest/v1/rpc/mp_admin_review`, { method: 'POST', headers: hdr(t), body: JSON.stringify({ p_listing_id: sel.id, p_action: action, p_reason: reason || null, p_patch: patch || null }) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); showToast && showToast(`فشل الإجراء: ${j.message || r.status}`, 'error'); return; }
    showToast && showToast('تم تنفيذ الإجراء وتسجيله', 'success');
    setSel(null); load();
  };
  const handleReport = async (id, st, hide) => {
    const t = await ensureFreshAdminJwt(sbUrl, sbKey);
    const r = await fetch(`${sbUrl}/rest/v1/rpc/mp_admin_handle_report`, { method: 'POST', headers: hdr(t), body: JSON.stringify({ p_report_id: id, p_status: st, p_hide_listing: !!hide }) });
    if (r.ok) { showToast && showToast('تم', 'success'); load(); } else showToast && showToast('تعذر التنفيذ', 'error');
  };

  const counts = useMemo(() => { const c = {}; rows.forEach((r) => { c[r.status] = (c[r.status] || 0) + 1; }); return c; }, [rows]);
  const brands = useMemo(() => [...new Set(rows.map((r) => r.brand))], [rows]);
  const cities = useMemo(() => [...new Set(rows.map((r) => r.city))], [rows]);
  const list = rows.filter((r) => (status === 'ALL' || r.status === status) && (brand === 'ALL' || r.brand === brand) && (city === 'ALL' || r.city === city)
    && (!q || `${r.title} ${r.model} ${r.public_id} ${r.contact_phone}`.toLowerCase().includes(q.toLowerCase())));

  if (jwt === '') return (
    <div className="max-w-xl mx-auto bg-surface border border-line rounded-3xl p-8 text-center space-y-3">
      <LogIn className="w-10 h-10 mx-auto text-[#0071E3]" />
      <h3 className="font-black text-lg">هذا القسم يحتاج تسجيل دخول Supabase Auth</h3>
      <p className="text-sm font-semibold text-muted">لأسباب أمنية، مراجعة الإعلانات لا تعمل بكلمة مرور اللوحة القديمة. اخرج وسجّل دخول من شاشة اللوحة بإيميلك (حساب مدير موجود في admin_profiles).</p>
    </div>);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-black flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-500" /> إعلانات بيع الموبايلات</h2>
        <div className="flex gap-2">
          {[['listings', 'الإعلانات'], ['reports', `البلاغات (${reports.filter((r) => r.status === 'open').length})`]].map(([k, l]) => <button key={k} type="button" onClick={() => setView(k)} className={`px-4 py-2 rounded-xl text-xs font-black border ${view === k ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-surface border-line'}`}>{l}</button>)}
          <button type="button" onClick={load} className="px-3 py-2 rounded-xl bg-surface2 text-xs font-black inline-flex items-center gap-1"><RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> تحديث</button>
        </div>
      </div>

      {view === 'listings' && (<>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {['ALL', ...Object.keys(STATUS_META)].map((s) => <button key={s} type="button" onClick={() => setStatus(s)} className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-black border ${status === s ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-surface border-line'}`}>{s === 'ALL' ? 'الكل' : STATUS_META[s].label} ({s === 'ALL' ? rows.length : counts[s] || 0})</button>)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث: اسم / رقم إعلان / هاتف" className={`${inp} col-span-2`} />
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className={inp}><option value="ALL">كل الماركات</option>{brands.map((b) => <option key={b}>{b}</option>)}</select>
          <select value={city} onChange={(e) => setCity(e.target.value)} className={inp}><option value="ALL">كل المدن</option>{cities.map((b) => <option key={b}>{b}</option>)}</select>
        </div>
        {list.length === 0 && <div className="rounded-2xl bg-surface border border-line p-10 text-center font-bold text-muted">لا توجد إعلانات.</div>}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {list.map((r) => (
            <button key={r.id} type="button" onClick={() => openRow(r)} className="text-start rounded-2xl bg-surface border border-line hover:border-[#0071E3] p-3 flex gap-3 transition">
              <div className="w-24 shrink-0"><PhoneStage src={r.image_url} alt={r.title} ratio="aspect-square" /></div>
              <div className="min-w-0 flex-1 space-y-1"><div className="flex justify-between gap-2"><span className="font-black text-sm line-clamp-2">{r.title}</span><StatusBadge status={r.status} /></div>
                <div className="font-black text-[#0066CC]">{money(r.price)} {r.is_featured && <Star className="inline w-3.5 h-3.5 text-amber-500" />}</div>
                <div className="text-[11px] font-bold text-muted">#{r.public_id} · {r.brand} · {r.city} · <Clock className="inline w-3 h-3" /> {when(r.created_at)}</div></div>
            </button>))}
        </div>
      </>)}

      {view === 'reports' && (
        <div className="space-y-2">
          {reports.length === 0 && <div className="rounded-2xl bg-surface border border-line p-10 text-center font-bold text-muted">لا توجد بلاغات.</div>}
          {reports.map((r) => (
            <div key={r.id} className="rounded-2xl bg-surface border border-line p-3 flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5"><div className="font-black text-sm flex items-center gap-2"><Flag className="w-4 h-4 text-rose-500" /> {r.kind === 'seller' ? 'بلاغ عن بائع' : 'بلاغ عن إعلان'} — {REPORT_AR[r.reason] || r.reason} <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface2">{r.status}</span></div>
                <div className="text-[12px] font-bold text-muted">الإعلان #{r.marketplace_listings && r.marketplace_listings.public_id} {r.marketplace_listings && r.marketplace_listings.title} · {when(r.created_at)}</div>
                {r.details && <div className="text-[12px] font-semibold">{r.details}</div>}</div>
              {r.status !== 'resolved' && r.status !== 'dismissed' && (<div className="flex gap-1.5">
                <button type="button" onClick={() => handleReport(r.id, 'resolved', true)} className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-black">إخفاء الإعلان + حل</button>
                <button type="button" onClick={() => handleReport(r.id, 'resolved', false)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-black">تم الحل</button>
                <button type="button" onClick={() => handleReport(r.id, 'dismissed', false)} className="px-3 py-1.5 rounded-lg bg-surface2 text-xs font-black">تجاهل</button></div>)}
            </div>))}
        </div>
      )}

      {sel && (
        <div className="fixed inset-0 z-[96] bg-black/60 flex justify-end" onMouseDown={(e) => { if (e.target === e.currentTarget) setSel(null); }}>
          <div className="bg-bg text-fg w-full max-w-2xl h-full overflow-y-auto p-5 space-y-4 border-s border-line">
            <div className="flex items-center justify-between"><h3 className="font-black text-lg">إعلان #{sel.public_id}</h3><button type="button" onClick={() => setSel(null)} className="w-9 h-9 rounded-full bg-surface2 flex items-center justify-center"><X className="w-4 h-4" /></button></div>
            <PhoneStage src={sel.image_url} alt={sel.title} />
            <div className="flex items-center gap-2 flex-wrap"><StatusBadge status={sel.status} /><span className="text-xs font-bold text-muted">أُنشئ {when(sel.created_at)}{sel.reviewed_at ? ` · آخر مراجعة ${when(sel.reviewed_at)}` : ''}</span></div>
            <div className="rounded-2xl border border-line bg-surface divide-y divide-line text-[13px]">
              {[['الجهاز', `${sel.brand} ${sel.model} · ${sel.storage}`], ['الحالة', `${COND[sel.condition]} · شاشة: ${SCREEN[sel.screen_condition]} · هيكل: ${BODY[sel.body_condition]}`], ['البطارية', sel.battery_health ? `${sel.battery_health}%` : '—'], ['إصلاحات', sel.has_repairs ? 'نعم' : 'لا'], ['السعر', money(sel.price)], ['الموقع', `${sel.city} ${sel.area || ''}`], ['البائع (معرّف العميل)', sel.seller_client_id], ['هاتف التواصل', `${sel.contact_phone} ${sel.show_contact ? '' : '(مخفي عن الجمهور)'}`], ['إصدار الشروط', sel.terms_version], ['سبب الرفض', sel.reject_reason || '—']].map(([k, v]) => <div key={k} className="flex justify-between gap-3 px-3 py-2"><span className="font-bold text-muted">{k}</span><span className="font-black text-end" dir="auto">{v}</span></div>)}
            </div>
            {(sel.defects || sel.description) && <div className="rounded-2xl bg-surface border border-line p-3 text-[13px] space-y-1">{sel.defects && <p><b>العيوب:</b> {sel.defects}</p>}{sel.description && <p><b>الوصف:</b> {sel.description}</p>}</div>}

            <div className="rounded-2xl border border-line p-3 space-y-2">
              <div className="text-xs font-black text-muted">سبب الإجراء (إلزامي للرفض والحذف)</div>
              <input value={reason} onChange={(e) => setReason(e.target.value)} className={`${inp} w-full`} placeholder="مثال: صورة غير واضحة / سعر غير منطقي" />
              <div className="flex flex-wrap gap-2">
                {['pending_review', 'rejected', 'hidden'].includes(sel.status) && <button type="button" onClick={() => act('approve')} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black inline-flex items-center gap-1"><Check className="w-4 h-4" /> موافقة ونشر</button>}
                {['pending_review', 'rejected'].includes(sel.status) && <button type="button" onClick={() => act('approve_hold')} className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-black">موافقة بدون نشر</button>}
                {sel.status === 'approved' && <button type="button" onClick={() => act('publish')} className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black">نشر الآن</button>}
                {sel.status !== 'sold' && sel.status !== 'rejected' && <button type="button" onClick={() => act('reject')} className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-black inline-flex items-center gap-1"><X className="w-4 h-4" /> رفض</button>}
                {['published', 'approved'].includes(sel.status) && <button type="button" onClick={() => act('hide')} className="px-4 py-2 rounded-xl bg-slate-600 text-white text-xs font-black inline-flex items-center gap-1"><EyeOff className="w-4 h-4" /> إخفاء</button>}
                {sel.status === 'hidden' && <button type="button" onClick={() => act('unhide')} className="px-4 py-2 rounded-xl bg-slate-600 text-white text-xs font-black inline-flex items-center gap-1"><Eye className="w-4 h-4" /> إظهار</button>}
                <button type="button" onClick={() => act(sel.is_featured ? 'unfeature' : 'feature')} className="px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-black inline-flex items-center gap-1"><Star className="w-4 h-4" /> {sel.is_featured ? 'إلغاء التمييز' : 'تمييز'}</button>
                {['published', 'approved', 'hidden'].includes(sel.status) && <button type="button" onClick={() => act('mark_sold')} className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-black">تم البيع</button>}
                <button type="button" onClick={() => act('delete')} className="px-4 py-2 rounded-xl bg-surface2 text-rose-600 text-xs font-black inline-flex items-center gap-1"><Trash2 className="w-4 h-4" /> حذف مخالف</button>
              </div>
            </div>

            <div className="rounded-2xl border border-line p-3 space-y-2">
              <div className="text-xs font-black text-muted">تعديل إداري (يُسجَّل في السجل)</div>
              <div className="grid grid-cols-2 gap-2">
                {[['title', 'العنوان'], ['price', 'السعر'], ['city', 'المدينة'], ['area', 'المنطقة']].map(([k, l]) => <input key={k} value={edit[k] ?? ''} onChange={(e) => setEdit((p) => ({ ...p, [k]: e.target.value }))} placeholder={l} className={inp} />)}
                <textarea value={edit.description ?? ''} onChange={(e) => setEdit((p) => ({ ...p, description: e.target.value }))} placeholder="الوصف" rows={2} className={`${inp} col-span-2`} />
                <input value={edit.admin_note ?? ''} onChange={(e) => setEdit((p) => ({ ...p, admin_note: e.target.value }))} placeholder="ملاحظة داخلية (لا تظهر للعميل)" className={`${inp} col-span-2`} />
              </div>
              <button type="button" onClick={() => act('edit', { ...edit, price: Number(edit.price) })} className="px-4 py-2 rounded-xl bg-[#0071E3] text-white text-xs font-black inline-flex items-center gap-1"><Save className="w-4 h-4" /> حفظ التعديل</button>
            </div>

            <div className="space-y-1.5"><div className="text-xs font-black text-muted">سجل الإجراءات</div>
              {hist.map((h) => <div key={h.id} className="rounded-xl bg-surface border border-line px-3 py-2 text-[12px] font-bold flex flex-wrap justify-between gap-2"><span>{ACTION_AR[h.action] || h.action} · {h.actor_type === 'admin' ? 'إدارة' : h.actor_type === 'seller' ? 'بائع' : 'نظام'}{h.reason ? ` — ${h.reason}` : ''}</span><span className="text-muted">{when(h.created_at)}</span></div>)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
