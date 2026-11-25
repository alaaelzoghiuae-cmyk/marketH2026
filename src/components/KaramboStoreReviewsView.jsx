import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Shield, Star, CheckCircle2, AlertTriangle, MapPin, Phone, Globe,
  Scale, Plus, Share2, MessageSquare, Award, TrendingUp, TrendingDown,
  ChevronLeft, X, Check, Upload, Building2, Tag, ShoppingCart, Sparkles, Clock,
  Lock, User, RefreshCw
} from 'lucide-react';
import {
  REVIEW_GOVERNORATES,
  REVIEW_ENTITY_TYPES,
  REVIEW_QUICK_TAGS,
  REVIEW_BRAND_TIERS,
  STORE_REVIEW_ENTITIES_SEED,
  containsProfanity
} from '../data/storeReviewsSeed.js';
import {
  searchLiveExternalStores,
  fetchLiveStoreDetails,
  runLiveScamCheck
} from '../services/storeReviewsLiveClient.js';

/**
 * Compute Trust Score (0–100), 4-axis averages, 90-day trend, warranty rate, and tag counts
 * for any Store/Platform entity (combining local member reviews + live external ratings).
 */
export function computeEntityTrustMetrics(entity, allEntries, liveOverride = null) {
  const approved = (allEntries || []).filter(r => r.entityId === entity.id && r.status === 'approved');
  const count = approved.length;

  let authSum = 0, priceSum = 0, delivSum = 0, warSum = 0;
  let warTested = 0, warOk = 0;
  let posCount = 0, negCount = 0;
  const tagCounts = {};

  const now = Date.now();
  const d90 = 90 * 24 * 60 * 60 * 1000;
  let recentSum = 0, recentCnt = 0, oldSum = 0, oldCnt = 0;

  approved.forEach(r => {
    const ax = r.axes || {};
    const a = Number(ax.authenticity || 3);
    const p = Number(ax.pricing || 3);
    const d = Number(ax.delivery || 3);
    const w = Number(ax.warranty || 3);
    authSum += a; priceSum += p; delivSum += d; warSum += w;
    const avg = (a + p + d + w) / 4;
    if (r.sentiment === 'positive') posCount++;
    if (r.sentiment === 'negative') negCount++;
    if (r.testedWarranty) { warTested++; if (r.warrantySatisfied) warOk++; }
    (r.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; });

    const ts = new Date(r.createdAt || Date.now()).getTime();
    if (now - ts <= d90) { recentSum += avg; recentCnt++; }
    else { oldSum += avg; oldCnt++; }
  });

  const liveRating = Number((liveOverride && liveOverride.liveRating) || entity.googleRating || 0);
  const liveCount = Number((liveOverride && liveOverride.liveReviewCount) || entity.googleReviewCount || 0);

  const axes = count > 0
    ? {
        authenticity: Number((authSum / count).toFixed(1)),
        pricing: Number((priceSum / count).toFixed(1)),
        delivery: Number((delivSum / count).toFixed(1)),
        warranty: Number((warSum / count).toFixed(1))
      }
    : {
        authenticity: liveRating || 4.0,
        pricing: liveRating || 4.0,
        delivery: liveRating || 4.0,
        warranty: liveRating || 4.0
      };

  const communityAvg = count > 0 ? (axes.authenticity + axes.pricing + axes.delivery + axes.warranty) / 4 : 0;
  const blended = count > 0
    ? (liveRating > 0 ? ((communityAvg * Math.min(count, 10) + liveRating * 2) / (Math.min(count, 10) + 2)) : communityAvg)
    : (liveRating || 3.8);
  const trustScore = Math.max(10, Math.min(100, Math.round((blended / 5) * 100)));

  let trend90 = 'stable';
  if (recentCnt > 0 && oldCnt > 0) {
    const rAvg = recentSum / recentCnt;
    const oAvg = oldSum / oldCnt;
    if (rAvg - oAvg >= 0.35) trend90 = 'up';
    else if (oAvg - rAvg >= 0.35) trend90 = 'down';
  }

  const topPros = REVIEW_QUICK_TAGS.filter(t => t.positive && tagCounts[t.id] > 0)
    .sort((a, b) => (tagCounts[b.id] || 0) - (tagCounts[a.id] || 0))
    .slice(0, 4)
    .map(t => ({ ...t, count: tagCounts[t.id] }));

  const topCons = REVIEW_QUICK_TAGS.filter(t => !t.positive && tagCounts[t.id] > 0)
    .sort((a, b) => (tagCounts[b.id] || 0) - (tagCounts[a.id] || 0))
    .slice(0, 4)
    .map(t => ({ ...t, count: tagCounts[t.id] }));

  return {
    trustScore,
    reviewCount: count,
    liveRating,
    liveCount,
    axes,
    posCount,
    negCount,
    warTested,
    warPct: warTested > 0 ? Math.round((warOk / warTested) * 100) : null,
    trend90,
    topPros,
    topCons,
    tagCounts
  };
}

function trustBand(score) {
  if (score >= 80) return { label: 'موثوق وتجارب ممتازة', cls: 'bg-emerald-600', textCls: 'text-emerald-600', ringCls: 'border-emerald-500/40 bg-emerald-500/10' };
  if (score >= 55) return { label: 'جيد — راجع الملاحظات', cls: 'bg-amber-500', textCls: 'text-amber-600', ringCls: 'border-amber-500/40 bg-amber-500/10' };
  return { label: 'تحذير — شكاوى متكررة', cls: 'bg-rose-600', textCls: 'text-rose-600', ringCls: 'border-rose-500/40 bg-rose-500/10' };
}

function extractDomainFromUrl(url) {
  if (!url) return '';
  return String(url).trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].split('?')[0];
}

export default function KaramboStoreReviewsView({
  cfg,
  currentClient = null,
  onRequireAuth,
  onEnsureStoreEntity,
  entities = [],
  entries = [],
  questions = [],
  onSubmitReview,
  onVoteHelpful,
  onSubmitStore,
  onSubmitQuestion,
  onSubmitAnswer,
  onGoToStore,
  showToast
}) {
  const rCfg = (cfg && cfg.reviewsCfg) || {};
  const requireLogin = rCfg.requireLoginToReview !== false;
  const googleApiKey = String(rCfg.googlePlacesApiKey || '').trim();
  const isLoggedIn = Boolean(currentClient && currentClient.id);
  const clientDisplayName = currentClient ? (currentClient.name || currentClient.owner || 'عميل مسجل') : '';
  const clientPhone = currentClient ? String(currentClient.phone || '') : '';

  const approvedEntities = useMemo(() => {
    const base = (Array.isArray(entities) && entities.length > 0) ? entities : STORE_REVIEW_ENTITIES_SEED;
    return base.filter(e => e && e.approved !== false);
  }, [entities]);

  const metricsMap = useMemo(() => {
    const m = {};
    approvedEntities.forEach(e => { m[e.id] = computeEntityTrustMetrics(e, entries); });
    return m;
  }, [approvedEntities, entries]);

  // View Mode: 'directory' | 'honor' | 'warning' | 'compare' | 'checker' | 'detail'
  const [tab, setTab] = useState('directory');
  const [activeEntityId, setActiveEntityId] = useState(null);
  const [activeExternalEntity, setActiveExternalEntity] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [govFilter, setGovFilter] = useState('الكل');
  const [sortBy, setSortBy] = useState('trust');

  // Live External Store Discovery State (Google Maps + OpenStreetMap Egypt + Trustpilot)
  const [liveStores, setLiveStores] = useState([]);
  const [liveSearching, setLiveSearching] = useState(false);
  const [liveHasSearched, setLiveHasSearched] = useState(false);
  const [liveGoogleConnected, setLiveGoogleConnected] = useState(false);

  // Live External Reviews for active store detail
  const [liveDetail, setLiveDetail] = useState(null);
  const [liveDetailLoading, setLiveDetailLoading] = useState(false);

  // Compare two stores (#10)
  const [cmpA, setCmpA] = useState('');
  const [cmpB, setCmpB] = useState('');

  // Phone / Social Page Scam Checker (#17) + Live Web/Directory Verification
  const [checkerQuery, setCheckerQuery] = useState('');
  const [scamLoading, setScamLoading] = useState(false);
  const [scamResult, setScamResult] = useState(null);

  const handleRunScamCheck = async (e) => {
    e && e.preventDefault();
    const q = checkerQuery.trim();
    if (q.length < 3) return;
    setScamLoading(true);
    const res = await runLiveScamCheck(q);
    setScamLoading(false);
    setScamResult(res && res.ok ? res : null);
  };

  // Add Store Modal (#6)
  const [addStoreOpen, setAddStoreOpen] = useState(false);
  const [storeForm, setStoreForm] = useState({ name: '', type: 'store', governorate: 'القاهرة', branch: '', phone: '', socialUrl: '', description: '' });

  // Review Form inside Store Detail
  const [revOpen, setRevOpen] = useState(false);
  const [revForm, setRevForm] = useState({
    authorName: '', authorPhone: '', sentiment: 'positive',
    authenticity: 5, pricing: 5, delivery: 5, warranty: 5,
    deviceBought: '', brandTier: 'android', branch: '',
    tags: [], testedWarranty: false, warrantySatisfied: true,
    comment: '', proofDataUrl: ''
  });
  const [revTierFilter, setRevTierFilter] = useState('ALL');
  const [revSentFilter, setRevSentFilter] = useState('ALL');
  const [votedIds, setVotedIds] = useState({});

  // Q&A inside Store Detail (#21)
  const [qaForm, setQaForm] = useState({ question: '' });
  const [ansDrafts, setAnsDrafts] = useState({});

  const runLiveDiscovery = async (qOverride, govOverride) => {
    const qVal = qOverride !== undefined ? qOverride : search;
    const gVal = govOverride !== undefined ? govOverride : govFilter;
    setLiveSearching(true);
    setLiveHasSearched(true);
    const res = await searchLiveExternalStores({ q: qVal, gov: gVal, apiKey: googleApiKey });
    setLiveSearching(false);
    setLiveGoogleConnected(Boolean(res && res.googlePlacesConnected));
    if (res && res.ok && Array.isArray(res.stores)) {
      const localNames = new Set(approvedEntities.map(e => String(e.name || '').toLowerCase()));
      setLiveStores(res.stores.filter(s => !localNames.has(String(s.name || '').toLowerCase())));
    } else {
      setLiveStores([]);
    }
  };

  // Automatic zero-key background discovery when opening the page, switching governorate, or typing a store name
  useEffect(() => {
    if (tab !== 'directory') return;
    const qTrim = search.trim();
    if (qTrim.length > 0 && qTrim.length < 3) return;
    const timer = setTimeout(() => {
      runLiveDiscovery(qTrim, govFilter === 'الكل' && !qTrim ? 'القاهرة' : govFilter);
    }, qTrim ? 550 : 120);
    return () => clearTimeout(timer);
  }, [tab, search, govFilter]);

  // Resolve active entity (either from local DB or discovered live external store)
  const activeEnt = useMemo(() => {
    if (!activeEntityId) return null;
    const local = approvedEntities.find(e => e.id === activeEntityId);
    if (local) return local;
    if (activeExternalEntity && activeExternalEntity.id === activeEntityId) return activeExternalEntity;
    return liveStores.find(s => s.id === activeEntityId) || null;
  }, [activeEntityId, approvedEntities, activeExternalEntity, liveStores]);

  // Auto-fetch live external reviews (Google Maps + Trustpilot) whenever a store detail page opens
  useEffect(() => {
    if (tab !== 'detail' || !activeEnt) {
      setLiveDetail(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLiveDetailLoading(true);
      const dom = activeEnt.domain || extractDomainFromUrl(activeEnt.socialUrl);
      const res = await fetchLiveStoreDetails({
        placeId: activeEnt.googlePlaceId || '',
        domain: dom,
        name: activeEnt.name || '',
        gov: activeEnt.governorate || '',
        apiKey: googleApiKey
      });
      if (!cancelled) {
        setLiveDetail(res && res.ok ? res : null);
        setLiveDetailLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [tab, activeEnt?.id, googleApiKey]);

  const openEntity = (entOrId) => {
    if (typeof entOrId === 'string') {
      setActiveEntityId(entOrId);
      setActiveExternalEntity(null);
    } else if (entOrId && entOrId.id) {
      setActiveEntityId(entOrId.id);
      if (entOrId.isExternal) setActiveExternalEntity(entOrId);
      else setActiveExternalEntity(null);
    }
    setTab('detail');
    setRevOpen(false);
    window.scrollTo({ top: 0 });
  };

  const handleProofFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      showToast && showToast('حجم الصورة كبير — اختار صورة أقل من 3 ميجا', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setRevForm(p => ({ ...p, proofDataUrl: String(reader.result || '') }));
    reader.readAsDataURL(file);
  };

  const renderLoginGateBox = (reasonText) => (
    <div className="rounded-3xl bg-gradient-to-l from-[#0071E3]/10 to-sky-500/10 border-2 border-[#0071E3]/30 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-[#0071E3] text-white flex items-center justify-center shrink-0 shadow">
          <Lock className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="text-sm font-black text-fg">تسجيل الدخول مطلوب لحماية مصداقية التقييمات</div>
          <p className="text-xs font-bold text-muted leading-relaxed">
            {reasonText || 'عشان نضمن إن كل التجارب والأسئلة حقيقية 100% ومن عملاء فعليين، لازم تسجّل دخولك أو تعمل حساب مجاني في ثواني.'}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
        <button
          type="button"
          onClick={() => onRequireAuth && onRequireAuth('login')}
          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0071E3] text-white text-xs font-black shadow"
        >
          تسجيل الدخول
        </button>
        <button
          type="button"
          onClick={() => onRequireAuth && onRequireAuth('register')}
          className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow"
        >
          إنشاء حساب جديد
        </button>
      </div>
    </div>
  );

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (requireLogin && !isLoggedIn) {
      onRequireAuth && onRequireAuth('login');
      showToast && showToast('لازم تسجّل دخولك الأول عشان تضيف تجربتك', 'warning');
      return;
    }
    const finalName = isLoggedIn ? clientDisplayName : revForm.authorName.trim();
    const finalPhone = isLoggedIn ? clientPhone : revForm.authorPhone.trim();

    if (!finalName || !revForm.comment.trim()) {
      showToast && showToast('اكتب تفاصيل تجربتك الأول', 'warning');
      return;
    }
    if (containsProfanity(revForm.comment) || containsProfanity(finalName)) {
      showToast && showToast('يرجى كتابة التجربة بأسلوب لائق بدون ألفاظ مسيئة', 'error');
      return;
    }

    // Duplicate check per userId OR phone + store (#12)
    const cleanPh = finalPhone.replace(/\D+/g, '');
    const dup = (entries || []).some(r => {
      if (r.entityId !== activeEntityId) return false;
      if (isLoggedIn && r.authorUserId && String(r.authorUserId) === String(currentClient.id)) return true;
      if (cleanPh && String(r.authorPhone || '').replace(/\D+/g, '') === cleanPh) return true;
      return false;
    });
    if (dup) {
      showToast && showToast('سبق وسجّلت تقييم لهذا المحل بحسابك بالفعل', 'warning');
      return;
    }

    // If reviewing an external discovered store not yet in our DB, promote/save it first
    if (activeEnt && activeEnt.isExternal && onEnsureStoreEntity) {
      await onEnsureStoreEntity(activeEnt);
    }

    const payload = {
      id: 'rev_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      entityId: activeEntityId,
      authorUserId: isLoggedIn ? currentClient.id : '',
      authorName: finalName,
      authorPhone: finalPhone,
      sentiment: revForm.sentiment,
      axes: {
        authenticity: Number(revForm.authenticity),
        pricing: Number(revForm.pricing),
        delivery: Number(revForm.delivery),
        warranty: Number(revForm.warranty)
      },
      deviceBought: revForm.deviceBought.trim(),
      brandTier: revForm.brandTier,
      branch: revForm.branch.trim(),
      tags: revForm.tags,
      testedWarranty: revForm.testedWarranty,
      warrantySatisfied: revForm.testedWarranty ? revForm.warrantySatisfied : null,
      comment: revForm.comment.trim(),
      proofImage: revForm.proofDataUrl || '',
      verifiedPurchase: false,
      helpfulCount: 0,
      status: rCfg.requireApproval !== false ? 'pending' : 'approved',
      officialReply: '',
      resolved: false,
      createdAt: new Date().toISOString()
    };
    const ok = await onSubmitReview(payload);
    if (ok) {
      setRevOpen(false);
      setRevForm({
        authorName: '', authorPhone: '', sentiment: 'positive',
        authenticity: 5, pricing: 5, delivery: 5, warranty: 5,
        deviceBought: '', brandTier: 'android', branch: '',
        tags: [], testedWarranty: false, warrantySatisfied: true,
        comment: '', proofDataUrl: ''
      });
    }
  };

  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    if (requireLogin && !isLoggedIn) {
      onRequireAuth && onRequireAuth('login');
      return;
    }
    if (!storeForm.name.trim()) return;
    const newEnt = {
      id: 'ent_' + Date.now().toString(36),
      name: storeForm.name.trim(),
      type: storeForm.type,
      governorate: storeForm.governorate,
      branches: storeForm.branch.trim() ? [storeForm.branch.trim()] : [storeForm.governorate],
      phones: storeForm.phone.trim() ? [storeForm.phone.trim()] : [],
      socialUrl: storeForm.socialUrl.trim(),
      domain: extractDomainFromUrl(storeForm.socialUrl),
      mapsQuery: `${storeForm.name.trim()} ${storeForm.governorate} Egypt`,
      featured: false,
      verified: false,
      googleRating: 0,
      googleReviewCount: 0,
      approved: rCfg.requireApproval === false,
      description: storeForm.description.trim() || `تم اقتراحه بواسطة ${clientDisplayName || 'أحد أعضاء كرومبو'}.`
    };
    const ok = await onSubmitStore(newEnt);
    if (ok) {
      setAddStoreOpen(false);
      setStoreForm({ name: '', type: 'store', governorate: 'القاهرة', branch: '', phone: '', socialUrl: '', description: '' });
    }
  };

  const shareEntityWhatsApp = (ent, m) => {
    const b = trustBand(m.trustScore);
    const prosStr = m.topPros.slice(0, 2).map(t => t.label).join(' · ') || 'تجارب إيجابية';
    const consStr = m.topCons.slice(0, 2).map(t => t.label).join(' · ') || 'لا توجد شكاوى بارزة';
    const txt = `🕵️‍♂️ *تقرير تحريات كرومبو — قبل ما تشتري*\n🏪 *${ent.name}*\n🛡️ مؤشر الثقة: *${m.trustScore}/100* (${b.label})\n✅ أبرز المميزات: ${prosStr}\n⚠️ ملاحظات/شكاوى: ${consStr}\n📊 عدد التجارب: ${m.reviewCount} تجربة\n\n— عبر كرومبو الشغلانة · ELZOGHBI MARKET`;
    window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, '_blank', 'noopener,noreferrer');
  };

  // Filtered directory list
  const filteredList = useMemo(() => {
    let list = [...approvedEntities];
    if (typeFilter !== 'ALL') list = list.filter(e => e.type === typeFilter);
    if (govFilter !== 'الكل') list = list.filter(e => e.governorate === govFilter || (e.branches || []).some(b => b.includes(govFilter)));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(e => `${e.name} ${e.governorate} ${(e.branches || []).join(' ')} ${(e.phones || []).join(' ')} ${e.socialUrl || ''}`.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const ma = metricsMap[a.id] || { trustScore: 0, reviewCount: 0, negCount: 0 };
      const mb = metricsMap[b.id] || { trustScore: 0, reviewCount: 0, negCount: 0 };
      if (a.featured && !b.featured && sortBy === 'trust') return -1;
      if (b.featured && !a.featured && sortBy === 'trust') return 1;
      if (sortBy === 'reviews') return (mb.reviewCount - ma.reviewCount) || (mb.trustScore - ma.trustScore);
      if (sortBy === 'complaints') return (mb.negCount - ma.negCount) || (ma.trustScore - mb.trustScore);
      return mb.trustScore - ma.trustScore;
    });
    return list;
  }, [approvedEntities, typeFilter, govFilter, search, sortBy, metricsMap]);

  const honorList = useMemo(() => [...approvedEntities].sort((a, b) => (metricsMap[b.id]?.trustScore || 0) - (metricsMap[a.id]?.trustScore || 0)).slice(0, 8), [approvedEntities, metricsMap]);
  const warningList = useMemo(() => [...approvedEntities].sort((a, b) => ((metricsMap[b.id]?.negCount || 0) - (metricsMap[a.id]?.negCount || 0)) || ((metricsMap[a.id]?.trustScore || 0) - (metricsMap[b.id]?.trustScore || 0))).slice(0, 8), [approvedEntities, metricsMap]);

  // Scam Checker Matches (#17)
  const checkerMatches = useMemo(() => {
    const q = checkerQuery.trim().toLowerCase();
    if (q.length < 3) return [];
    const digits = q.replace(/\D+/g, '');
    return approvedEntities.filter(e => {
      const hay = `${e.name} ${e.socialUrl || ''} ${(e.phones || []).join(' ')}`.toLowerCase();
      if (hay.includes(q)) return true;
      if (digits.length >= 4 && (e.phones || []).some(ph => String(ph).replace(/\D+/g, '').includes(digits))) return true;
      return false;
    });
  }, [checkerQuery, approvedEntities]);

  const renderStoreCard = (ent) => {
    const m = metricsMap[ent.id] || computeEntityTrustMetrics(ent, entries);
    const band = trustBand(m.trustScore);
    const typeLbl = { online: 'منصة أونلاين', store: 'محل / فروع', social: 'صفحة سوشيال' }[ent.type] || 'متجر';
    return (
      <div key={ent.id} className={`bg-surface border rounded-3xl p-4 flex flex-col gap-3 transition hover:border-[#0071E3] ${ent.featured ? 'border-emerald-500/60 ring-1 ring-emerald-500/20' : ent.isExternal ? 'border-sky-500/40' : 'border-line'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className="px-2 py-0.5 rounded-full bg-surface2 border border-line text-[10px] font-black text-muted">{typeLbl}</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-muted"><MapPin className="w-3 h-3" /> {ent.governorate}</span>
              {ent.isExternal && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-sky-600 text-white text-[9px] font-black"><Globe className="w-3 h-3" /> {ent.externalSourceLabel || 'اكتشاف حي'}</span>
              )}
              {(ent.featured || (!ent.isExternal && m.trustScore >= 85)) && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-black"><Award className="w-3 h-3" /> اختيار كرومبو الموثوق</span>
              )}
            </div>
            <button type="button" onClick={() => openEntity(ent)} className="text-start text-sm sm:text-base font-black text-fg hover:text-[#0066CC] leading-snug">
              {ent.name}
            </button>
          </div>
          <div className={`shrink-0 w-14 h-14 rounded-2xl border flex flex-col items-center justify-center ${band.ringCls}`}>
            <span className={`text-lg font-black leading-none ${band.textCls}`}>{m.trustScore}</span>
            <span className="text-[8px] font-black text-muted mt-0.5">ثقة %</span>
          </div>
        </div>

        <p className="text-xs font-bold text-muted line-clamp-2 leading-relaxed">{ent.description}</p>

        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-black">
          {rCfg.showGoogleRatings !== false && ent.googleRating > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/12 text-amber-700 dark:text-amber-300">
              <Star className="w-3 h-3" /> {ent.googleRating} ({Number(ent.googleReviewCount || 0).toLocaleString('en-US')})
            </span>
          )}
          <span className="px-2 py-0.5 rounded-lg bg-surface2 text-fg">{m.reviewCount} تجربة أعضاء</span>
          {m.trend90 === 'up' && <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"><TrendingUp className="w-3 h-3" /> بيتحسن</span>}
          {m.trend90 === 'down' && <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300"><TrendingDown className="w-3 h-3" /> شكاوى حديثة</span>}
          {m.warPct !== null && m.warPct >= 75 && <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-sky-500/15 text-sky-700 dark:text-sky-300"><Shield className="w-3 h-3" /> ملتزم بالضمان</span>}
        </div>

        {(m.topPros.length > 0 || m.topCons.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {m.topPros.slice(0, 2).map(t => <span key={t.id} className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">{t.label} ×{t.count}</span>)}
            {m.topCons.slice(0, 1).map(t => <span key={t.id} className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] font-bold">{t.label} ×{t.count}</span>)}
          </div>
        )}

        <div className="mt-auto pt-2 border-t border-line flex gap-1.5">
          <button type="button" onClick={() => openEntity(ent)} className="flex-1 py-2 rounded-xl bg-[#0071E3] hover:bg-[#0071E3] text-white text-xs font-black transition">عرض التقييمات الحقيقية</button>
          {!ent.isExternal && (
            <button type="button" onClick={() => { setCmpA(ent.id); setTab('compare'); }} className="px-3 py-2 rounded-xl bg-surface2 border border-line hover:border-violet-500 text-fg text-xs font-black transition" title="قارن المحل"><Scale className="w-4 h-4" /></button>
          )}
        </div>
      </div>
    );
  };

  // ================= STORE DETAIL VIEW =================
  if (tab === 'detail' && activeEnt) {
    const ent = activeEnt;
    const m = computeEntityTrustMetrics(ent, entries, liveDetail);
    const band = trustBand(m.trustScore);
    const entReviews = (entries || [])
      .filter(r => r.entityId === ent.id && r.status === 'approved')
      .filter(r => revTierFilter === 'ALL' || r.brandTier === revTierFilter)
      .filter(r => revSentFilter === 'ALL' || r.sentiment === revSentFilter)
      .sort((a, b) => (b.helpfulCount || 0) - (a.helpfulCount || 0));
    const entQuestions = (questions || []).filter(q => q.entityId === ent.id);
    const extReviews = (liveDetail && Array.isArray(liveDetail.externalReviews)) ? liveDetail.externalReviews : [];
    const mapsHref = (liveDetail && liveDetail.googleMapsUri) || ent.googleMapsUri || (ent.mapsQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ent.mapsQuery)}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${ent.name} مصر`)}`);

    const AXES_META = [
      ['authenticity', 'أصالة المنتج والتغليف'],
      ['pricing', 'الالتزام بالسعر والشفافية'],
      ['delivery', 'سرعة التوصيل والاستلام'],
      ['warranty', 'الضمان وخدمة ما بعد البيع']
    ];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" onClick={() => setTab('directory')} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-surface2 border border-line text-xs font-black text-fg hover:border-[#0071E3]">
            <ChevronLeft className="w-4 h-4 rotate-180" /> كل المحلات والمنصات
          </button>
          <div className="ms-auto flex flex-wrap gap-1.5">
            <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-surface2 border border-line hover:border-emerald-500 text-xs font-black text-fg">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> تقييمات خرائط جوجل
            </a>
            {!ent.isExternal && (
              <button type="button" onClick={() => { setCmpA(ent.id); setTab('compare'); }} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-surface2 border border-line hover:border-violet-500 text-xs font-black text-fg">
                <Scale className="w-3.5 h-3.5 text-violet-600" /> قارن مع محل آخر
              </button>
            )}
            <button type="button" onClick={() => shareEntityWhatsApp(ent, m)} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black">
              <Share2 className="w-3.5 h-3.5" /> شارك التقرير واتساب
            </button>
          </div>
        </div>

        {/* Store Header + Trust Meter + 4 Axes */}
        <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className={`w-24 h-24 rounded-3xl border-2 flex flex-col items-center justify-center shrink-0 ${band.ringCls}`}>
              <div className={`text-3xl font-black leading-none ${band.textCls}`}>{m.trustScore}</div>
              <div className="text-[10px] font-black text-muted mt-1">مؤشر الثقة</div>
            </div>
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-fg">{ent.name}</h2>
                {m.liveRating > 0 && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-black">
                    <Star className="w-3.5 h-3.5" /> {m.liveRating} ({Number(m.liveCount || 0).toLocaleString('en-US')} تقييم حقيقي)
                  </span>
                )}
                {(ent.featured || (!ent.isExternal && m.trustScore >= 85)) && <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black"><Award className="w-3 h-3" /> اختيار كرومبو الموثوق</span>}
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black text-white ${band.cls}`}>{band.label}</span>
              </div>
              <p className="text-xs font-bold text-muted">{ent.description}</p>
              <div className="flex flex-wrap gap-2 text-[11px] font-bold text-muted">
                <span><MapPin className="w-3.5 h-3.5 inline text-[#0066CC]" /> العنوان / الفروع: {(liveDetail && liveDetail.address) || (ent.branches || [ent.governorate]).join(' · ')}</span>
                {((liveDetail && liveDetail.phone) || (ent.phones && ent.phones[0])) && (
                  <span>· <Phone className="w-3.5 h-3.5 inline text-emerald-600" /> {(liveDetail && liveDetail.phone) || ent.phones[0]}</span>
                )}
                {m.warPct !== null && <span className="text-sky-600 dark:text-sky-400 font-black">· التزام الضمان: {m.warPct}% ({m.warTested} تجربة)</span>}
              </div>
            </div>
            <button type="button" onClick={() => setRevOpen(v => !v)} className="px-4 py-2.5 rounded-2xl bg-[#0071E3] hover:bg-[#0071E3] text-white text-xs font-black shadow shrink-0">
              {revOpen ? 'إغلاق النموذج' : '+ اكتب تجربتك معاهم'}
            </button>
          </div>

          {/* 4-Axis Progress Bars */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-line">
            {AXES_META.map(([k, lbl]) => {
              const val = m.axes[k] || 0;
              return (
                <div key={k} className="rounded-2xl bg-surface2/70 border border-line p-3 space-y-1.5">
                  <div className="flex justify-between text-xs font-black"><span className="text-muted">{lbl}</span><span className="text-fg">{val} / 5</span></div>
                  <div className="h-2 rounded-full bg-surface overflow-hidden"><div className="h-full bg-[#0071E3]" style={{ width: `${(val / 5) * 100}%` }} /></div>
                </div>
              );
            })}
          </div>

          {/* 2-Column Pros vs Cons Summary */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-3.5 space-y-2">
              <div className="text-xs font-black text-emerald-700 dark:text-emerald-300">أكتر حاجة بيشكروا فيها</div>
              <div className="flex flex-wrap gap-1.5">
                {m.topPros.length > 0 ? m.topPros.map(t => (
                  <span key={t.id} className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-black">{t.label} × {t.count}</span>
                )) : <span className="text-xs font-bold text-muted">كن أول من يضيف مميزات هذا المحل</span>}
              </div>
            </div>
            <div className="rounded-2xl bg-rose-500/10 border border-rose-500/25 p-3.5 space-y-2">
              <div className="text-xs font-black text-rose-700 dark:text-rose-300">أكتر شكاوى وملاحظات متكررة</div>
              <div className="flex flex-wrap gap-1.5">
                {m.topCons.length > 0 ? m.topCons.map(t => (
                  <span key={t.id} className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[11px] font-black">{t.label} × {t.count}</span>
                )) : <span className="text-xs font-bold text-muted">لا توجد شكاوى متكررة مسجلة حالياً</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Write Review Form — Gated by Mandatory Login */}
        {revOpen && (
          requireLogin && !isLoggedIn ? (
            renderLoginGateBox(`سجّل دخولك أو اعمل حساب مجاني عشان تقدر تنشر تجربتك الحقيقية مع «${ent.name}» وتساعد غيرك.`)
          ) : (
            <form onSubmit={handleReviewSubmit} className="bg-surface border-2 border-[#0071E3]/40 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-black text-fg">شارك تجربتك الحقيقية مع {ent.name}</h3>
                {isLoggedIn && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-black">
                    <User className="w-3.5 h-3.5" /> مسجّل بحسابك: {clientDisplayName}
                  </span>
                )}
              </div>
              {rCfg.loyaltyRewardNote && <div className="text-[11px] font-black text-emerald-600">{rCfg.loyaltyRewardNote}</div>}

              <div className="grid sm:grid-cols-3 gap-3">
                {isLoggedIn ? (
                  <div className="px-3 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs font-black text-fg flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">{clientDisplayName}</span>
                  </div>
                ) : (
                  <input required value={revForm.authorName} onChange={e => setRevForm(p => ({ ...p, authorName: e.target.value }))} placeholder="اسمك (سيظهر بجانب التقييم) *" className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
                )}
                <input value={revForm.deviceBought} onChange={e => setRevForm(p => ({ ...p, deviceBought: e.target.value }))} placeholder="الموبايل أو المنتج اللي اشتريته" className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
                <select value={revForm.brandTier} onChange={e => setRevForm(p => ({ ...p, brandTier: e.target.value }))} className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-black text-fg">
                  {REVIEW_BRAND_TIERS.filter(t => t.id !== 'ALL').map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <input value={revForm.branch} onChange={e => setRevForm(p => ({ ...p, branch: e.target.value }))} placeholder="الفرع أو المنطقة (اختياري)" className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
                <div className="sm:col-span-2 flex gap-1.5">
                  {[['positive', 'إيجابية 👍'], ['neutral', 'متوسطة 😐'], ['negative', 'سلبية 👎']].map(([k, l]) => (
                    <button key={k} type="button" onClick={() => setRevForm(p => ({ ...p, sentiment: k }))} className={`flex-1 py-2 rounded-xl text-[11px] font-black border ${revForm.sentiment === k ? (k === 'positive' ? 'bg-emerald-600 text-white border-emerald-600' : k === 'negative' ? 'bg-rose-600 text-white border-rose-600' : 'bg-amber-500 text-white border-amber-500') : 'bg-surface2 border-line text-fg'}`}>{l}</button>
                  ))}
                </div>
              </div>

              {/* 4-Axis Sliders */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {AXES_META.map(([k, lbl]) => (
                  <div key={k} className="rounded-2xl bg-surface2 p-3 space-y-1">
                    <div className="flex justify-between text-[11px] font-black"><span className="text-muted">{lbl}</span><span className="text-[#0066CC]">{revForm[k]}/5</span></div>
                    <input type="range" min="1" max="5" step="1" value={revForm[k]} onChange={e => setRevForm(p => ({ ...p, [k]: Number(e.target.value) }))} className="w-full accent-[#0071E3]" />
                  </div>
                ))}
              </div>

              {/* Quick Tags Selector */}
              <div className="space-y-1.5">
                <div className="text-xs font-black text-muted">اختار الوسوم المناسبة لتجربتك:</div>
                <div className="flex flex-wrap gap-1.5">
                  {REVIEW_QUICK_TAGS.map(t => {
                    const sel = revForm.tags.includes(t.id);
                    return (
                      <button key={t.id} type="button" onClick={() => setRevForm(p => ({ ...p, tags: sel ? p.tags.filter(x => x !== t.id) : [...p.tags, t.id] }))} className={`px-2.5 py-1 rounded-full text-[11px] font-black border transition ${sel ? (t.positive ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-rose-600 text-white border-rose-600') : 'bg-surface2 border-line text-fg'}`}>
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Independent Warranty Question + Proof Upload */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-black text-fg cursor-pointer">
                  <input type="checkbox" checked={revForm.testedWarranty} onChange={e => setRevForm(p => ({ ...p, testedWarranty: e.target.checked }))} className="w-4 h-4 accent-[#0071E3]" />
                  <span>جربت معاهم الضمان أو الاستبدال فعلياً</span>
                </label>
                {revForm.testedWarranty && (
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => setRevForm(p => ({ ...p, warrantySatisfied: true }))} className={`px-2.5 py-1 rounded-lg text-[11px] font-black ${revForm.warrantySatisfied ? 'bg-emerald-600 text-white' : 'bg-surface2 text-fg'}`}>التزموا بالضمان ✓</button>
                    <button type="button" onClick={() => setRevForm(p => ({ ...p, warrantySatisfied: false }))} className={`px-2.5 py-1 rounded-lg text-[11px] font-black ${!revForm.warrantySatisfied ? 'bg-rose-600 text-white' : 'bg-surface2 text-fg'}`}>تهربوا من الضمان ✗</button>
                  </div>
                )}
                {rCfg.allowProofUpload !== false && (
                  <label className="ms-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface2 border border-line text-xs font-black text-fg cursor-pointer hover:border-[#0071E3]">
                    <Upload className="w-3.5 h-3.5 text-[#0066CC]" />
                    <span>{revForm.proofDataUrl ? 'تم إرفاق صورة الفاتورة ✓ (للإدارة فقط)' : 'إرفاق فاتورة لشارة «تجربة موثّقة» (اختياري)'}</span>
                    <input type="file" accept="image/*" onChange={handleProofFile} className="hidden" />
                  </label>
                )}
              </div>

              <textarea required rows={3} value={revForm.comment} onChange={e => setRevForm(p => ({ ...p, comment: e.target.value }))} placeholder="احكي تجربتك بصراحة عشان تفيد غيرك (حالة العلبة، السعر، التعامل، الضمان)..." className="w-full p-3 rounded-2xl border border-line bg-surface2 text-sm font-bold" />
              <button type="submit" className="w-full py-2.5 rounded-2xl bg-[#0071E3] hover:bg-[#0071E3] text-white text-sm font-black shadow">نشر التجربة بحسابي</button>
            </form>
          )
        )}

        {/* LIVE REAL CUSTOMER REVIEWS FROM GOOGLE MAPS & TRUSTPILOT */}
        <div className="bg-surface border border-sky-500/30 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-600" />
              <h3 className="font-black text-fg">تقييمات حقيقية من خرائط جوجل والإنترنت ({extReviews.length})</h3>
            </div>
            <div className="flex items-center gap-2">
              {liveDetailLoading && <span className="inline-flex items-center gap-1 text-[11px] font-black text-sky-600"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> جاري جلب أحدث التقييمات الحية...</span>}
              <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-[11px] font-black">
                كل تقييمات خرائط جوجل ↗
              </a>
            </div>
          </div>

          {liveDetailLoading ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {[1, 2].map(n => <div key={n} className="h-24 rounded-2xl bg-surface2 animate-pulse" />)}
            </div>
          ) : extReviews.length > 0 ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {extReviews.slice(0, 8).map(er => (
                <div key={er.id} className="rounded-2xl bg-surface2/70 border border-line p-3.5 space-y-2 flex flex-col">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-black text-xs text-fg truncate">{er.authorName}</div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white ${er.rating >= 4 ? 'bg-emerald-600' : er.rating <= 2 ? 'bg-rose-600' : 'bg-amber-500'}`}>
                        ★ {er.rating}/5
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md bg-surface border border-line text-[9px] font-black text-muted">{er.source}</span>
                    </div>
                  </div>
                  {er.title && <div className="text-xs font-black text-fg">{er.title}</div>}
                  <p className="text-xs font-bold text-fg/85 leading-relaxed line-clamp-4">{er.text}</p>
                  {er.reply && (
                    <div className="rounded-xl bg-sky-500/10 p-2 text-[11px] font-bold text-fg/80">
                      <span className="font-black text-sky-700 dark:text-sky-300">رد الشركة: </span>{er.reply}
                    </div>
                  )}
                  <div className="mt-auto pt-1 flex items-center justify-between text-[10px] font-bold text-muted">
                    <span>{er.date}</span>
                    {er.sourceUrl && (
                      <a href={er.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#0066CC] font-black hover:underline">المصدر الأصلي ↗</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-surface2/60 border border-line p-4 flex items-center justify-between flex-wrap gap-3 text-xs font-bold text-muted">
              <span>تقدر تشوف آلاف التقييمات الفورية والمباشرة لهذا المحل على خرائط جوجل، أو تضيف أول تجربة موثّقة بحسابك هنا.</span>
              <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 rounded-xl bg-surface border border-line text-fg font-black hover:border-emerald-500">
                افتح صفحة المحل على خرائط جوجل ↗
              </a>
            </div>
          )}
        </div>

        {/* Smart ELZOGHBI Conversion Banner */}
        {rCfg.showStoreCta !== false && ent.id !== 'ent_elzoghbi' && onGoToStore && (
          <div className="rounded-2xl bg-gradient-to-l from-[#0071E3]/15 to-emerald-500/10 border border-[#0071E3]/30 p-3.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs font-black text-fg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0066CC] shrink-0" />
              <span>اشتريت موبايلك من أي مكان؟ احميه بجرابات واسكرينات وشواحن أصلية بضمان من متجر ELZOGHBI</span>
            </div>
            <button type="button" onClick={onGoToStore} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0071E3] text-white text-xs font-black shrink-0">
              <ShoppingCart className="w-3.5 h-3.5" /> تسوق الإكسسوارات
            </button>
          </div>
        )}

        {/* Local Verified Members Reviews List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h3 className="font-black text-fg">تجارب أعضاء الموقع الموثّقين ({entReviews.length})</h3>
            <div className="flex flex-wrap gap-1.5">
              <select value={revTierFilter} onChange={e => setRevTierFilter(e.target.value)} className="px-2.5 py-1.5 rounded-xl bg-surface border border-line text-xs font-black text-fg">
                {REVIEW_BRAND_TIERS.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <select value={revSentFilter} onChange={e => setRevSentFilter(e.target.value)} className="px-2.5 py-1.5 rounded-xl bg-surface border border-line text-xs font-black text-fg">
                <option value="ALL">كل التجارب</option>
                <option value="positive">الإيجابية فقط</option>
                <option value="negative">الشكاوى فقط</option>
              </select>
            </div>
          </div>

          {entReviews.length === 0 ? (
            <div className="bg-surface border border-line rounded-3xl p-8 text-center text-xs font-bold text-muted">مفيش تجارب أعضاء مطابقة للفلتر ده لسه — اضغط «اكتب تجربتك معاهم» وكن أول من يشارك تجربته</div>
          ) : entReviews.map(r => (
            <div key={r.id} className="bg-surface border border-line rounded-3xl p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm text-fg">{r.authorName}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black text-white ${r.sentiment === 'positive' ? 'bg-emerald-600' : r.sentiment === 'negative' ? 'bg-rose-600' : 'bg-amber-500'}`}>
                    {r.sentiment === 'positive' ? 'تجربة إيجابية' : r.sentiment === 'negative' ? 'شكوى / سلبية' : 'تجربة متوسطة'}
                  </span>
                  {r.verifiedPurchase && <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#0071E3] text-white text-[10px] font-black"><CheckCircle2 className="w-3 h-3" /> تجربة موثّقة</span>}
                  {r.resolved && <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-black"><Check className="w-3 h-3" /> تم حل الشكوى</span>}
                </div>
                <span className="text-[10px] font-bold text-muted">{String(r.createdAt || '').slice(0, 10)}</span>
              </div>
              {(r.deviceBought || r.branch) && (
                <div className="text-[11px] font-bold text-muted">{r.deviceBought ? `الجهاز: ${r.deviceBought}` : ''}{r.branch ? ` · الفرع: ${r.branch}` : ''}</div>
              )}
              <p className="text-sm font-bold text-fg leading-relaxed">{r.comment}</p>
              {(r.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {r.tags.map(tid => {
                    const t = REVIEW_QUICK_TAGS.find(x => x.id === tid);
                    return t ? <span key={tid} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.positive ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/10 text-rose-700 dark:text-rose-300'}`}>{t.label}</span> : null;
                  })}
                </div>
              )}
              {r.officialReply && (
                <div className="rounded-2xl bg-sky-500/10 border border-sky-500/25 p-3 text-xs font-bold text-fg space-y-0.5">
                  <div className="text-[10px] font-black text-sky-700 dark:text-sky-300">رد رسمي من المحل / الإدارة:</div>
                  <div>{r.officialReply}</div>
                </div>
              )}
              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  disabled={!!votedIds[r.id]}
                  onClick={() => { setVotedIds(p => ({ ...p, [r.id]: true })); onVoteHelpful && onVoteHelpful(r.id); }}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-black border transition ${votedIds[r.id] ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-surface2 border-line text-fg hover:border-[#0071E3]'}`}
                >
                  التقييم ده فادني ({r.helpfulCount || 0})
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Q&A Section — Gated by Login */}
        <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
          <h3 className="font-black text-fg flex items-center gap-2"><MessageSquare className="w-4 h-4 text-[#0066CC]" /> اسأل اللي اشتروا من {ent.name} ({entQuestions.length})</h3>
          {requireLogin && !isLoggedIn ? (
            renderLoginGateBox('سجّل دخولك عشان تسأل اللي اشتروا من المحل أو ترد على استفساراتهم.')
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!qaForm.question.trim()) return;
                if (ent.isExternal && onEnsureStoreEntity) await onEnsureStoreEntity(ent);
                const ok = await onSubmitQuestion({
                  id: 'qa_' + Date.now().toString(36),
                  entityId: ent.id,
                  authorUserId: isLoggedIn ? currentClient.id : '',
                  authorName: clientDisplayName || 'عضو مسجل',
                  question: qaForm.question.trim(),
                  answers: [],
                  createdAt: new Date().toISOString().slice(0, 10)
                });
                if (ok !== false) setQaForm({ question: '' });
              }}
              className="flex flex-col sm:flex-row gap-2"
            >
              <input required value={qaForm.question} onChange={e => setQaForm({ question: e.target.value })} placeholder="اكتب سؤالك (مثال: هل عندهم تقسيط فاليو أو استبدال فوري؟)" className="flex-1 px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
              <button type="submit" className="px-5 py-2 rounded-xl bg-[#0071E3] text-white text-xs font-black shrink-0">إرسال السؤال بحسابي</button>
            </form>
          )}
          <div className="space-y-3">
            {entQuestions.map(q => (
              <div key={q.id} className="rounded-2xl bg-surface2/60 border border-line p-3.5 space-y-2">
                <div className="text-xs font-black text-fg">س: {q.question} <span className="text-[10px] font-bold text-muted">— {q.authorName} ({q.createdAt})</span></div>
                {(q.answers || []).map(ans => (
                  <div key={ans.id} className="ps-3 border-s-2 border-[#0071E3] text-xs font-bold text-fg/90">
                    <span className="text-[#0066CC] font-black">{ans.author}: </span>{ans.text}
                  </div>
                ))}
                {(!requireLogin || isLoggedIn) && (
                  <div className="flex gap-1.5 pt-1">
                    <input value={ansDrafts[q.id] || ''} onChange={e => setAnsDrafts(p => ({ ...p, [q.id]: e.target.value }))} placeholder="عندك معلومة؟ أضف إجابتك..." className="flex-1 px-2.5 py-1.5 rounded-lg border border-line bg-surface text-xs font-bold" />
                    <button
                      type="button"
                      onClick={async () => {
                        const txt = String(ansDrafts[q.id] || '').trim();
                        if (!txt) return;
                        await onSubmitAnswer(q.id, { id: 'ans_' + Date.now().toString(36), author: clientDisplayName || 'عضو مسجل', isOfficial: false, text: txt, createdAt: new Date().toISOString().slice(0, 10) });
                        setAnsDrafts(p => ({ ...p, [q.id]: '' }));
                      }}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-black"
                    >رد</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ================= TOP NAVIGATION TABS =================
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {[
          ['directory', `دليل المحلات (${approvedEntities.length}+ حي)`],
          ['honor', 'لوحة الشرف'],
          ['warning', 'قائمة التحذير'],
          ['compare', 'مقارنة محلّين'],
          ['checker', 'فاحص الأرقام والصفحات']
        ].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={`px-3.5 py-2 rounded-2xl text-xs font-black border transition ${tab === k ? 'bg-[#0071E3] text-white border-[#0071E3] shadow' : 'bg-surface border-line text-fg hover:border-[#0071E3]'}`}>{l}</button>
        ))}
        {rCfg.allowNewStoreSubmission !== false && (
          <button type="button" onClick={() => setAddStoreOpen(v => !v)} className="ms-auto inline-flex items-center gap-1 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow">
            <Plus className="w-4 h-4" /> أضف محل / منصة مش موجودة
          </button>
        )}
      </div>

      {/* Add Store Form — Gated by Login */}
      {addStoreOpen && (
        requireLogin && !isLoggedIn ? (
          renderLoginGateBox('سجّل دخولك أو اعمل حساب عشان تقدر تضيف محل أو منصة جديدة للدليل.')
        ) : (
          <form onSubmit={handleStoreSubmit} className="bg-surface border-2 border-emerald-500/40 rounded-3xl p-4 grid sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-3 text-xs font-black text-emerald-700 dark:text-emerald-300">أضف محل أو منصة أو صفحة سوشيال عشان الناس تقيّمها</div>
            <input required value={storeForm.name} onChange={e => setStoreForm(p => ({ ...p, name: e.target.value }))} placeholder="اسم المحل أو المنصة *" className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
            <select value={storeForm.type} onChange={e => setStoreForm(p => ({ ...p, type: e.target.value }))} className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-black text-fg">
              {REVIEW_ENTITY_TYPES.filter(t => t.id !== 'ALL').map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <select value={storeForm.governorate} onChange={e => setStoreForm(p => ({ ...p, governorate: e.target.value }))} className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-black text-fg">
              {REVIEW_GOVERNORATES.filter(g => g !== 'الكل').map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <input value={storeForm.branch} onChange={e => setStoreForm(p => ({ ...p, branch: e.target.value }))} placeholder="العنوان / الفرع" className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
            <input value={storeForm.phone} onChange={e => setStoreForm(p => ({ ...p, phone: e.target.value }))} placeholder="رقم التليفون أو الخط الساخن" className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
            <input value={storeForm.socialUrl} onChange={e => setStoreForm(p => ({ ...p, socialUrl: e.target.value }))} placeholder="رابط الموقع أو صفحة فيسبوك/إنستجرام" className="px-3 py-2 rounded-xl border border-line bg-surface2 text-xs font-bold" />
            <button type="submit" className="sm:col-span-3 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-black">إرسال لإضافة المحل</button>
          </form>
        )
      )}

      {/* TAB: DIRECTORY + LIVE EXTERNAL STORE DISCOVERY */}
      {tab === 'directory' && (
        <div className="space-y-4">
          <div className="bg-surface border border-line rounded-3xl p-4 space-y-3">
            <form
              onSubmit={(e) => { e.preventDefault(); runLiveDiscovery(); }}
              className="grid sm:grid-cols-5 gap-2.5"
            >
              <div className="sm:col-span-2 flex items-center gap-2 rounded-2xl px-3 py-2 bg-surface2 border border-line">
                <Search className="w-4 h-4 text-[#0071E3] shrink-0" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="اكتب اسم أي محل في مصر (حتى لو مش مضاف عندنا)..." className="flex-1 bg-transparent border-0 text-xs font-bold focus:outline-none" />
                {search && <button type="button" onClick={() => setSearch('')}><X className="w-3.5 h-3.5 text-muted" /></button>}
              </div>
              <select value={govFilter} onChange={e => setGovFilter(e.target.value)} className="rounded-2xl px-3 py-2 bg-surface2 border border-line text-xs font-black text-fg">
                {REVIEW_GOVERNORATES.map(g => <option key={g} value={g}>{g === 'الكل' ? 'كل المحافظات' : g}</option>)}
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="rounded-2xl px-3 py-2 bg-surface2 border border-line text-xs font-black text-fg">
                <option value="trust">الأعلى ثقة</option>
                <option value="reviews">الأكثر تقييماً</option>
                <option value="complaints">الأكثر شكاوى</option>
              </select>
              <button
                type="submit"
                disabled={liveSearching}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow transition disabled:opacity-60"
              >
                {liveSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                <span>{liveSearching ? 'جاري البحث الحي...' : 'بحث حي في مصر'}</span>
              </button>
            </form>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {REVIEW_ENTITY_TYPES.map(t => (
                  <button key={t.id} type="button" onClick={() => setTypeFilter(t.id)} className={`px-3 py-1 rounded-full text-xs font-black border transition ${typeFilter === t.id ? 'bg-[#0071E3] text-white border-[#0071E3]' : 'bg-surface2 border-line text-fg'}`}>{t.label}</button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => runLiveDiscovery('', govFilter === 'الكل' ? 'القاهرة' : govFilter)}
                className="text-[11px] font-black text-sky-600 hover:underline inline-flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5" /> اكتشف محلات موبايلات حقيقية على الخريطة ({govFilter === 'الكل' ? 'القاهرة' : govFilter})
              </button>
            </div>
          </div>

          {/* LIVE DISCOVERED EXTERNAL STORES SECTION */}
          {(liveSearching || liveHasSearched) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap px-1">
                <div className="text-xs font-black text-sky-700 dark:text-sky-300 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  <span>
                    نتائج الاكتشاف الحي من {liveGoogleConnected ? 'خرائط جوجل ودليل مصر' : 'خريطة محلات مصر والإنترنت'} ({liveStores.length})
                  </span>
                </div>
                {liveStores.length > 0 && (
                  <button type="button" onClick={() => { setLiveStores([]); setLiveHasSearched(false); }} className="text-[11px] font-black text-muted hover:text-fg">إخفاء النتائج الحية</button>
                )}
              </div>
              {liveSearching ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {[1, 2, 3].map(n => <div key={n} className="h-44 rounded-3xl bg-surface border border-line animate-pulse" />)}
                </div>
              ) : liveStores.length > 0 ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                  {liveStores.map(renderStoreCard)}
                </div>
              ) : (
                <div className="rounded-2xl bg-surface border border-line p-4 text-xs font-bold text-muted">
                  مفيش نتائج خارجية إضافية مطابقة لـ «{search || govFilter}» — جرّب تكتب اسم المحل بالإنجليزي أو اختار محافظة تانية، أو أضف المحل للدليل مباشرة.
                </div>
              )}
            </div>
          )}

          {/* MAIN DIRECTORY GRID */}
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredList.map(renderStoreCard)}
          </div>

          {filteredList.length === 0 && !liveSearching && (
            <div className="rounded-3xl bg-surface border border-line p-8 text-center space-y-3">
              <div className="text-sm font-black text-fg">المحل ده مش متسجل في الدليل المحلي لسه</div>
              <p className="text-xs font-bold text-muted">اضغط على «بحث حي في مصر» عشان نجيبهولك مباشرة من الخرائط والإنترنت بتقييماته الحقيقية!</p>
              <button type="button" onClick={() => runLiveDiscovery()} className="px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-black shadow">
                ابحث عن «{search}» حياً على الخرائط
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB: HONOR ROLL */}
      {tab === 'honor' && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs font-black text-emerald-800 dark:text-emerald-300">لوحة شرف كرومبو — أعلى المحلات والمنصات ثقة في مصر بناءً على تقييمات العملاء</div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5">{honorList.map(renderStoreCard)}</div>
        </div>
      )}

      {/* TAB: WARNING LIST */}
      {tab === 'warning' && (
        <div className="space-y-3">
          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs font-black text-rose-800 dark:text-rose-300">قائمة التحذير — المحلات والمنصات التي تحتاج مراجعة ملاحظات وشكاوى العملاء قبل الشراء</div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3.5">{warningList.map(renderStoreCard)}</div>
        </div>
      )}

      {/* TAB: COMPARE TWO STORES */}
      {tab === 'compare' && (() => {
        const allComparable = [...approvedEntities, ...liveStores];
        const eA = allComparable.find(e => e.id === cmpA);
        const eB = allComparable.find(e => e.id === cmpB);
        const mA = eA ? (metricsMap[eA.id] || computeEntityTrustMetrics(eA, entries)) : null;
        const mB = eB ? (metricsMap[eB.id] || computeEntityTrustMetrics(eB, entries)) : null;
        return (
          <div className="bg-surface border border-line rounded-3xl p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <select value={cmpA} onChange={e => setCmpA(e.target.value)} className="rounded-2xl px-3 py-2.5 bg-surface2 border border-line text-xs font-black text-fg">
                <option value="">— اختار المحل / المنصة الأولى —</option>
                {allComparable.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <select value={cmpB} onChange={e => setCmpB(e.target.value)} className="rounded-2xl px-3 py-2.5 bg-surface2 border border-line text-xs font-black text-fg">
                <option value="">— اختار المحل / المنصة الثانية —</option>
                {allComparable.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            {eA && eB && mA && mB ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-bold">
                  <thead>
                    <tr className="border-b border-line bg-surface2">
                      <th className="p-3 text-start text-muted">وجه المقارنة</th>
                      <th className="p-3 text-start text-fg font-black">{eA.name}</th>
                      <th className="p-3 text-start text-fg font-black">{eB.name}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['مؤشر الثقة (من 100)', mA.trustScore, mB.trustScore],
                      ['أصالة المنتج (من 5)', mA.axes.authenticity, mB.axes.authenticity],
                      ['الالتزام بالسعر (من 5)', mA.axes.pricing, mB.axes.pricing],
                      ['سرعة التوصيل (من 5)', mA.axes.delivery, mB.axes.delivery],
                      ['الضمان وخدمة ما بعد البيع (من 5)', mA.axes.warranty, mB.axes.warranty],
                      ['عدد تجارب الأعضاء', mA.reviewCount, mB.reviewCount]
                    ].map(([lbl, vA, vB], i) => (
                      <tr key={i} className={i % 2 ? 'bg-surface2/40' : ''}>
                        <td className="p-3 text-muted font-black">{lbl}</td>
                        <td className={`p-3 ${vA > vB ? 'text-emerald-600 font-black bg-emerald-500/10' : 'text-fg'}`}>{vA} {vA > vB ? '✓' : ''}</td>
                        <td className={`p-3 ${vB > vA ? 'text-emerald-600 font-black bg-emerald-500/10' : 'text-fg'}`}>{vB} {vB > vA ? '✓' : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-xs font-bold text-muted">اختار محلّين أو منصتين عشان كرومبو يقارنلك بينهم في المحاور الأربعة</div>
            )}
          </div>
        );
      })()}

      {/* TAB: PHONE / SOCIAL PAGE SCAM CHECKER */}
      {tab === 'checker' && (
        <div className="bg-surface border border-line rounded-2xl p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="font-black text-fg flex items-center gap-2"><Shield className="w-5 h-5 text-amber-500" /> فاحص الأرقام وصفحات السوشيال قبل تحويل أي عربون</h3>
            <p className="text-xs font-bold text-muted">اكتب رقم الموبايل أو رابط صفحة فيسبوك/إنستجرام أو اسم المحل واضغط «افحص الآن» للبحث الفوري في قاعدة كرومبو والإنترنت ومجتمعات مصر.</p>
          </div>
          <form onSubmit={handleRunScamCheck} className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 rounded-xl px-3.5 py-2.5 bg-surface2 border border-line focus-within:border-amber-500">
              <Phone className="w-4 h-4 text-amber-500 shrink-0" />
              <input value={checkerQuery} onChange={e => setCheckerQuery(e.target.value)} placeholder="مثال: 16942 أو رابط الصفحة أو اسم المتجر..." className="flex-1 bg-transparent border-0 text-sm font-bold focus:outline-none" />
              {checkerQuery && <button type="button" onClick={() => { setCheckerQuery(''); setScamResult(null); }}><X className="w-4 h-4 text-muted" /></button>}
            </div>
            <button type="submit" disabled={scamLoading || checkerQuery.trim().length < 3} className="px-5 py-2.5 rounded-xl bg-[#0071E3] hover:bg-[#0066CC] disabled:opacity-50 text-white text-xs font-black inline-flex items-center justify-center gap-1.5 shrink-0">
              {scamLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>{scamLoading ? 'جاري الفحص الحي...' : 'افحص الآن'}</span>
            </button>
          </form>

          {/* Local Directory Matches */}
          {checkerMatches.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-black text-emerald-700 dark:text-emerald-300">مطابقات في دليل كرومبو ({checkerMatches.length}):</div>
              <div className="grid sm:grid-cols-2 gap-3">{checkerMatches.map(renderStoreCard)}</div>
            </div>
          )}

          {/* Live Web & Community Scam Check Result */}
          {scamResult && (
            <div className="space-y-3">
              <div className={`rounded-2xl border p-4 space-y-1.5 ${
                scamResult.riskLevel === 'high' ? 'bg-rose-500/10 border-rose-500/40 text-rose-800 dark:text-rose-200'
                : scamResult.riskLevel === 'low' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-200'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-800 dark:text-amber-200'
              }`}>
                <div className="text-sm font-black flex items-center gap-2">
                  {scamResult.riskLevel === 'high' ? <AlertTriangle className="w-4 h-4" /> : scamResult.riskLevel === 'low' ? <CheckCircle2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  <span>
                    {scamResult.riskLevel === 'high' ? 'تحذير مرتفع — ظهرت إشارات سلبية أو تحذيرات'
                      : scamResult.riskLevel === 'low' ? 'سجل إيجابي مبدئياً في الأدلة والتجارب'
                      : 'غير موثّق في الأدلة الرسمية — تعامل بحذر'}
                  </span>
                </div>
                <p className="text-xs font-bold leading-relaxed">{scamResult.advice}</p>
              </div>

              {Array.isArray(scamResult.storesFound) && scamResult.storesFound.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-fg">سجلات مطابقة في الأدلة الحية:</div>
                  <div className="grid sm:grid-cols-2 gap-3">{scamResult.storesFound.map(renderStoreCard)}</div>
                </div>
              )}

              {Array.isArray(scamResult.communitySignals) && scamResult.communitySignals.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-fg">تجارب ومنشورات حقيقية من مجتمعات مصر:</div>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {scamResult.communitySignals.map(c => (
                      <div key={c.id} className="rounded-xl bg-surface2 border border-line p-3 space-y-1">
                        <div className="text-xs font-black text-fg line-clamp-1">{c.title}</div>
                        <p className="text-[11px] font-bold text-muted line-clamp-3">{c.text}</p>
                        {c.sourceUrl && <a href={c.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-[#0066CC] hover:underline">اقرأ المنشور الأصلي ↗</a>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Array.isArray(scamResult.webSignals) && scamResult.webSignals.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-black text-fg">نتائج الفحص على الإنترنت:</div>
                  <div className="space-y-2">
                    {scamResult.webSignals.map((w, i) => (
                      <div key={i} className={`rounded-xl border p-3 text-xs space-y-1 ${w.isWarning ? 'bg-rose-500/5 border-rose-500/30' : 'bg-surface2/60 border-line'}`}>
                        <div className="font-black text-fg">{w.title}</div>
                        <div className="text-[11px] font-bold text-muted">{w.snippet}</div>
                        {w.url && <a href={w.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-[#0066CC] hover:underline">فتح المصدر ↗</a>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
