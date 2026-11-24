import React, { useState, useEffect } from 'react';
import {
  Megaphone, Search, X, RefreshCw, Clock, Share2, ChevronLeft, Sparkles, CheckCircle2, Award, Zap
} from 'lucide-react';
import { fetchLiveNews } from '../services/karamboLiveClient.js';

/**
 * Editorial Magazine-Style "آخر الأخبار" Service (v22 — 100% White-Labeled)
 * Displays rewritten, structured, simplified articles with:
 * - "الخلاصة في 3 نقاط" quick takeaways box
 * - Auto-extracted Spec/Price highlight chips
 * - Cleanly formatted headings, bullets, and short readable paragraphs
 * - "تحليل ونصيحة كرومبو للمشتري المصري" verdict card
 */
export default function KaramboNewsView({ cfg, initialArticle = null }) {
  const nCfg = (cfg && cfg.newsCfg) || {};
  const customArticles = Array.isArray(nCfg.customArticles) ? nCfg.customArticles : [];
  const maxArticles = Number(nCfg.maxArticles || 16);

  const [liveArticles, setLiveArticles] = useState([]);
  const [loading, setLoading] = useState(nCfg.enabledLive !== false);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('ALL');
  const [activeArticle, setActiveArticle] = useState(initialArticle);

  const loadNews = async () => {
    if (nCfg.enabledLive === false) { setLoading(false); return; }
    setLoading(true);
    const r = await fetchLiveNews(maxArticles);
    setLoading(false);
    if (r.ok && Array.isArray(r.articles)) setLiveArticles(r.articles);
  };

  useEffect(() => { loadNews(); }, [nCfg.enabledLive, maxArticles]);

  const allArticles = [...customArticles, ...liveArticles];
  const categories = ['ALL', ...new Set(allArticles.map(a => a.category).filter(Boolean))];
  const filtered = allArticles.filter(a => {
    if (cat !== 'ALL' && a.category !== cat) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      return `${a.title || ''} ${a.excerpt || ''} ${a.category || ''}`.toLowerCase().includes(q);
    }
    return true;
  });

  const shareArticleWA = (art) => {
    const pts = (art.keyPoints || []).slice(0, 2).map(p => `• ${p}`).join('\n');
    const txt = `📰 *${art.title}*\n${pts || art.excerpt || ''}\n\n— تحليل كرومبو الشغلانة · ELZOGHBI MARKET`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank', 'noopener,noreferrer');
  };

  // ================= MAGAZINE ARTICLE READER VIEW =================
  if (activeArticle) {
    const keyPoints = Array.isArray(activeArticle.keyPoints) ? activeArticle.keyPoints : [];
    const highlights = Array.isArray(activeArticle.highlights) ? activeArticle.highlights : [];
    const sections = Array.isArray(activeArticle.sections) && activeArticle.sections.length > 0
      ? activeArticle.sections
      : (activeArticle.content || activeArticle.excerpt || '').split(/\n+/).filter(Boolean).map(t => ({ type: 'paragraph', text: t }));

    return (
      <div className="max-w-[860px] mx-auto space-y-4">
        <button type="button" onClick={() => setActiveArticle(null)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface2 border border-line text-xs font-black text-fg hover:border-[#3B82F6]">
          <ChevronLeft className="w-4 h-4 rotate-180" /> رجوع لكل الأخبار
        </button>

        <article className="bg-surface border border-line rounded-[28px] overflow-hidden shadow-sm">
          {activeArticle.image && (
            <div className="relative bg-surface2 max-h-[380px] overflow-hidden flex items-center justify-center">
              <img src={activeArticle.image} alt={activeArticle.title} referrerPolicy="no-referrer" className="w-full max-h-[380px] object-cover" />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            </div>
          )}

          <div className="p-5 sm:p-8 space-y-6">
            {/* Meta row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-[#2563EB] text-white text-[11px] font-black">{activeArticle.category || 'أخبار الموبايلات'}</span>
              {activeArticle.date && <span className="inline-flex items-center gap-1 text-xs font-bold text-muted"><Clock className="w-3.5 h-3.5" /> {activeArticle.date}</span>}
              {activeArticle.readTimeMin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface2 border border-line text-[11px] font-black text-muted">
                  وقت القراءة: {activeArticle.readTimeMin} دقيقة
                </span>
              )}
              <button type="button" onClick={() => shareArticleWA(activeArticle)} className="ms-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition">
                <Share2 className="w-3.5 h-3.5" /> مشاركة واتساب
              </button>
            </div>

            {/* Headline */}
            <h2 className="text-xl sm:text-3xl font-black text-fg leading-snug">{activeArticle.title}</h2>

            {/* Extracted Spec / Number Highlight Chips */}
            {highlights.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {highlights.map((h, i) => (
                  <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#2563EB]/10 border border-[#2563EB]/25 text-xs font-black">
                    <Zap className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span className="text-muted">{h.label}:</span>
                    <span className="text-[#2563EB] dark:text-[#60A5FA]">{h.val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Summary Box ("الخلاصة السريعة في 3 نقاط") */}
            {keyPoints.length > 0 && (
              <div className="rounded-3xl bg-gradient-to-l from-amber-500/12 via-amber-500/5 to-transparent border border-amber-500/30 p-4 sm:p-5 space-y-2.5">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-amber-700 dark:text-amber-300">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>الخلاصة السريعة من كرومبو</span>
                </div>
                <ul className="space-y-2">
                  {keyPoints.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm font-bold text-fg leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Clean Structured Editorial Body */}
            <div className="space-y-4 border-t border-line pt-5">
              {sections.map((sec, idx) => {
                if (sec.type === 'heading') {
                  return (
                    <h3 key={idx} className="text-base sm:text-lg font-black text-[#2563EB] dark:text-[#60A5FA] pt-2">
                      {sec.text}
                    </h3>
                  );
                }
                if (sec.type === 'bullet') {
                  return (
                    <div key={idx} className="flex items-start gap-2.5 ps-2 text-sm font-bold text-fg/90 leading-relaxed">
                      <span className="w-2 h-2 rounded-full bg-[#2563EB] shrink-0 mt-2" />
                      <span>{sec.text}</span>
                    </div>
                  );
                }
                return (
                  <p key={idx} className="text-sm sm:text-[15px] font-bold text-fg/90 leading-[1.95]">
                    {sec.text}
                  </p>
                );
              })}
            </div>

            {/* Karambo Buyer Analysis Verdict Card */}
            {activeArticle.karamboAnalysis && (
              <div className="rounded-3xl bg-gradient-to-l from-[#1D4ED8]/15 via-[#2563EB]/10 to-emerald-500/10 border border-[#2563EB]/30 p-4 sm:p-5 flex items-start gap-3">
                <Award className="w-6 h-6 text-[#2563EB] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-black text-[#2563EB] dark:text-[#60A5FA]">رأي وتحليل كرومبو للمشتري</div>
                  <p className="text-xs sm:text-sm font-black text-fg leading-relaxed">{activeArticle.karamboAnalysis}</p>
                </div>
              </div>
            )}
          </div>
        </article>
      </div>
    );
  }

  // ================= NEWS FEED GRID =================
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="flex items-center gap-2 flex-1 rounded-2xl px-3.5 py-2 bg-surface border border-line focus-within:border-[#3B82F6]">
          <Search className="w-4 h-4 text-[#3B82F6] shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث في أخبار ومراجعات الموبايلات..." className="flex-1 bg-transparent border-0 text-sm font-bold focus:outline-none py-1" />
          {search && <button type="button" onClick={() => setSearch('')}><X className="w-4 h-4 text-muted" /></button>}
        </div>
        <button type="button" onClick={loadNews} disabled={loading} className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-surface2 border border-line text-xs font-black text-fg hover:border-[#3B82F6] shrink-0">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> تحديث الأخبار
        </button>
      </div>

      {categories.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {categories.map(c => (
            <button key={c} type="button" onClick={() => setCat(c)} className={`px-3.5 py-1.5 rounded-full text-xs font-black shrink-0 border transition ${cat === c ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-surface border-line text-fg'}`}>
              {c === 'ALL' ? `الكل (${allArticles.length})` : c}
            </button>
          ))}
        </div>
      )}

      {loading && allArticles.length === 0 ? (
        <div className="bg-surface border border-line rounded-3xl p-12 text-center space-y-2">
          <RefreshCw className="w-8 h-8 text-[#2563EB] animate-spin mx-auto" />
          <div className="text-sm font-black text-fg">جاري جلب وتنسيق أحدث أخبار الموبايلات...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface border border-line rounded-3xl p-10 text-center space-y-2">
          <Megaphone className="w-10 h-10 text-muted mx-auto" />
          <div className="text-sm font-black text-muted">لا توجد أخبار مطابقة حالياً</div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(art => (
            <article key={art.id} className="bg-surface border border-line rounded-3xl overflow-hidden flex flex-col hover:border-[#3B82F6] transition group">
              <button type="button" onClick={() => setActiveArticle(art)} className="relative aspect-[16/10] bg-surface2 overflow-hidden flex items-center justify-center">
                {art.image
                  ? <img src={art.image} alt={art.title} loading="lazy" referrerPolicy="no-referrer" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                  : <Megaphone className="w-12 h-12 text-muted" />}
                <span className="absolute top-2.5 start-2.5 px-2.5 py-0.5 rounded-full bg-[#2563EB] text-white text-[10px] font-black shadow">{art.category || 'أخبار'}</span>
                {art.readTimeMin && <span className="absolute bottom-2 end-2 px-2 py-0.5 rounded-full bg-black/65 text-white text-[9px] font-black">{art.readTimeMin} د قراءة</span>}
              </button>
              <div className="p-4 flex flex-col gap-2.5 flex-1">
                {art.date && <div className="text-[10px] font-bold text-muted flex items-center gap-1"><Clock className="w-3 h-3" /> {art.date}</div>}
                <button type="button" onClick={() => setActiveArticle(art)} className="text-start font-black text-sm text-fg leading-snug hover:text-[#2563EB] line-clamp-2">{art.title}</button>
                <p className="text-xs font-bold text-muted line-clamp-2 leading-relaxed">{art.excerpt}</p>
                {Array.isArray(art.highlights) && art.highlights.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {art.highlights.slice(0, 3).map((h, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-surface2 border border-line text-[9px] font-black text-fg">{h.label}: {h.val}</span>
                    ))}
                  </div>
                )}
                <div className="mt-auto pt-2 flex items-center gap-2">
                  <button type="button" onClick={() => setActiveArticle(art)} className="flex-1 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-black transition">اقرأ الملخص والتحليل</button>
                  <button type="button" onClick={() => shareArticleWA(art)} className="p-2 rounded-xl bg-surface2 border border-line hover:border-emerald-500 text-fg transition" title="مشاركة"><Share2 className="w-4 h-4" /></button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
