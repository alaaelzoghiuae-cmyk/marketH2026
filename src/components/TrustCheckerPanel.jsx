import React, { useState } from 'react';
import { Shield, Phone, Search, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Info, ExternalLink } from 'lucide-react';
import { checkTrust } from '../services/karamboLiveClient.js';

const LEVEL = {
  good: { Icon: CheckCircle2, cls: 'text-emerald-600' },
  info: { Icon: Info, cls: 'text-muted' },
  warn: { Icon: AlertTriangle, cls: 'text-amber-600' },
  bad: { Icon: XCircle, cls: 'text-rose-600' }
};
const VERDICT = {
  high: { label: 'خطر مرتفع', box: 'border-rose-500/40 bg-rose-500/5', bar: 'bg-rose-600', txt: 'text-rose-700 dark:text-rose-300' },
  medium: { label: 'غير موثّق — احذر', box: 'border-amber-500/40 bg-amber-500/5', bar: 'bg-amber-500', txt: 'text-amber-700 dark:text-amber-300' },
  low: { label: 'لا مؤشرات خطر ظاهرة', box: 'border-emerald-500/40 bg-emerald-500/5', bar: 'bg-emerald-600', txt: 'text-emerald-700 dark:text-emerald-300' },
  unknown: { label: 'بيانات غير كافية', box: 'border-line bg-surface2', bar: 'bg-slate-400', txt: 'text-muted' }
};

/** Phone / social page / website checker before sending any deposit. Calls /api/trust-check. */
export default function TrustCheckerPanel({ query, setQuery, localMatches = [], renderStoreCard }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const run = async (e) => {
    e && e.preventDefault();
    if (query.trim().length < 3 || loading) return;
    setLoading(true);
    setResult(null);
    const r = await checkTrust(query);
    setResult(r);
    setLoading(false);
  };
  const v = result && result.ok ? VERDICT[result.verdict] || VERDICT.unknown : null;

  return (
    <div className="bg-surface border border-line rounded-xl p-5 space-y-4">
      <div className="space-y-1">
        <h3 className="font-black text-fg flex items-center gap-2"><Shield className="w-5 h-5 text-amber-600" /> فاحص الأرقام وصفحات السوشيال قبل تحويل أي عربون</h3>
        <p className="text-xs font-bold text-muted leading-relaxed">اكتب رقم الموبايل/المحفظة، أو الصق رابط صفحة فيسبوك أو إنستجرام أو موقع. بنفحص صيغة الرقم، عمر الموقع، بيانات الصفحة المعلنة، وذكر الاسم بجانب كلمات النصب على الإنترنت — وبنقارنه بسجل تحريات كرومبو.</p>
      </div>
      <form onSubmit={run} className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-lg px-3.5 py-2.5 bg-surface2 border border-line focus-within:border-amber-500">
          <Phone className="w-4 h-4 text-amber-600 shrink-0" />
          <input value={query} onChange={e => setQuery(e.target.value)} dir="auto" placeholder="رقم تليفون، رابط صفحة، أو اسم المحل..." className="flex-1 bg-transparent border-0 text-sm font-bold focus:outline-none" />
        </div>
        <button type="submit" disabled={loading || query.trim().length < 3} className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white text-xs font-black disabled:opacity-50">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} {loading ? 'جاري الفحص...' : 'افحص الآن'}
        </button>
      </form>

      {result && !result.ok && <div className="rounded-lg border border-line bg-surface2 p-3 text-xs font-bold text-muted">{result.error || 'تعذّر الفحص'}</div>}

      {v && (
        <div className={`rounded-xl border ${v.box} p-4 space-y-3`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className={`text-base font-black ${v.txt}`}>{v.label}</div>
              <div className="text-xs font-bold text-muted mt-0.5">{result.verdictText}</div>
            </div>
            <div className="text-end">
              <div className="text-[10px] font-bold text-muted">مؤشر الخطورة</div>
              <div className={`text-2xl font-black ${v.txt}`}>{result.riskScore}<span className="text-xs text-muted">/100</span></div>
            </div>
          </div>
          <div className="h-1.5 rounded-full bg-line overflow-hidden"><div className={`h-full ${v.bar}`} style={{ width: `${result.riskScore}%` }} /></div>

          {result.meta && (
            <div className="flex items-start gap-3 rounded-lg bg-surface border border-line p-3">
              {result.meta.image && <img src={result.meta.image} alt="" referrerPolicy="no-referrer" className="w-12 h-12 rounded-lg object-cover bg-surface2 shrink-0" onError={e => { e.currentTarget.style.display = 'none'; }} />}
              <div className="min-w-0 text-xs">
                <div className="font-black text-fg truncate">{result.meta.title || result.normalized}</div>
                {result.meta.description && <div className="font-bold text-muted line-clamp-2 mt-0.5">{result.meta.description}</div>}
              </div>
            </div>
          )}

          <ul className="space-y-1.5">
            {(result.signals || []).map((s, i) => {
              const L = LEVEL[s.level] || LEVEL.info;
              return (
                <li key={i} className="flex items-start gap-2 text-xs font-bold text-fg leading-relaxed">
                  <L.Icon className={`w-4 h-4 shrink-0 mt-0.5 ${L.cls}`} /> <span>{s.text}</span>
                </li>
              );
            })}
          </ul>

          {result.snippets && result.snippets.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="text-[11px] font-black text-muted">نتائج بحث عامة ذات صلة</div>
              {result.snippets.map((s, i) => (
                <a key={i} href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="block rounded-lg bg-surface border border-line p-2.5 hover:border-slate-400 transition">
                  <div className="flex items-center gap-1 text-xs font-black text-fg"><ExternalLink className="w-3 h-3 shrink-0" /> <span className="truncate">{s.title}</span></div>
                  <div className="text-[11px] font-bold text-muted line-clamp-2 mt-0.5">{s.text}</div>
                </a>
              ))}
            </div>
          )}
          <div className="text-[10px] font-bold text-muted">الفحص آلي ويعتمد على بيانات عامة — لا يغني عن المعاينة والدفع عند الاستلام.</div>
        </div>
      )}

      {query.trim().length >= 3 && (
        <div className="space-y-2">
          <div className="text-xs font-black text-fg">سجل تحريات كرومبو (محلات ومنصات مسجّلة عندنا)</div>
          {localMatches.length === 0 ? (
            <div className="rounded-lg bg-surface2 border border-line p-3 text-xs font-bold text-muted">مفيش سجل لهذا الرقم أو الصفحة عندنا — ولو عندك تجربة معاهم أضفهم من زر «أضف محل / منصة» لتحذير غيرك.</div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">{localMatches.map(renderStoreCard)}</div>
          )}
        </div>
      )}
    </div>
  );
}
