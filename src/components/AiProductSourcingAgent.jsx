import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Sparkles, Globe, Search, Filter, Shield, DollarSign, Percent, Package,
  Check, X, AlertTriangle, RefreshCw, Plus, Trash2, Eye, Layers, Upload,
  Download, Clock, CheckCircle2, Ban, ArrowUpRight, Camera, Edit, Save,
  FileText, RotateCcw, Zap, ChevronDown, Info
} from 'lucide-react';
import {
  DUPLICATE_STATUS,
  DUPLICATE_LABELS_AR,
  IMAGE_HANDLING_MODES,
  PRICING_MODES,
  DEFAULT_SOURCE_PROFILES,
  DEFAULT_SOURCING_PRESETS,
  ISOLATED_TEST_PRODUCTS,
  parseSourcingInstruction,
  buildExecutionPlan,
  parseStructuredSourceInput,
  detectFilterConflicts,
  applyProductFilters,
  classifyDuplicate,
  enrichProductData,
  analyzeProductImages,
  calculateProductPricing,
  buildCatalogUpdateProposals,
  computeIdempotencyKey,
  buildSafeImportPart
} from '../services/aiSourcingEngine';

const STORAGE_PROFILES_KEY = 'elzoghbi_ai_sourcing_profiles_v1';
const STORAGE_PRESETS_KEY = 'elzoghbi_ai_sourcing_presets_v1';
const STORAGE_HISTORY_KEY = 'elzoghbi_ai_sourcing_history_v1';

const loadStored = (key, fallback) => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const saveStored = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota errors
  }
};

const DUP_BADGE_CLASS = {
  NEW_PRODUCT: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  EXACT_DUPLICATE: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  POSSIBLE_DUPLICATE: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  EXISTING_NEEDS_UPDATE: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  VARIANT_OF_EXISTING: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  INSUFFICIENT_DATA: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30'
};

export default function AiProductSourcingAgent({
  parts = [],
  brands = [],
  models = [],
  categories = [],
  normalizePartCategory,
  onConfirmImportParts,
  onApplyCatalogUpdates,
  showToast
}) {
  const [activeView, setActiveView] = useState('command'); // command | filters_pricing | review | catalog_update | history
  const [instruction, setInstruction] = useState(DEFAULT_SOURCING_PRESETS[0].instruction);
  const [sourceUrlsText, setSourceUrlsText] = useState('');
  const [structuredFeedText, setStructuredFeedText] = useState('');
  const [showFeedInput, setShowFeedInput] = useState(false);

  // Saved profiles, presets, and history
  const [profiles, setProfiles] = useState(() => loadStored(STORAGE_PROFILES_KEY, DEFAULT_SOURCE_PROFILES));
  const [presets, setPresets] = useState(() => loadStored(STORAGE_PRESETS_KEY, DEFAULT_SOURCING_PRESETS));
  const [history, setHistory] = useState(() => loadStored(STORAGE_HISTORY_KEY, []));

  // Add new profile modal/form
  const [newProfileOpen, setNewProfileOpen] = useState(false);
  const [newProfileForm, setNewProfileForm] = useState({
    name: '',
    website: '',
    extractionMethod: 'auto',
    defaultCurrency: 'USD',
    defaultImageHandling: 'keep_external_urls',
    notes: ''
  });

  // Parsed workflow (editable before execution)
  const [workflow, setWorkflow] = useState(() => parseSourcingInstruction(DEFAULT_SOURCING_PRESETS[0].instruction, []));
  const [planEdited, setPlanEdited] = useState(false);

  // Real execution state (never fabricated)
  const [execState, setExecState] = useState({
    running: false,
    cancelled: false,
    stage: 'idle',
    currentSource: '',
    discovered: 0,
    filteredPassed: 0,
    excluded: 0,
    duplicates: 0,
    enriched: 0,
    prepared: 0,
    errors: [],
    logs: [],
    progressPct: null,
    isIsolatedTest: false,
    activeTaskId: null
  });
  const abortCtrlRef = useRef(null);

  // Staged products, excluded products, and catalog update proposals
  const [stagedItems, setStagedItems] = useState([]);
  const [excludedItems, setExcludedItems] = useState([]);
  const [updateProposals, setUpdateProposals] = useState([]);

  // Review table state
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewDupFilter, setReviewDupFilter] = useState('ALL');
  const [reviewSort, setReviewSort] = useState('quality_desc');
  const [reviewPage, setReviewPage] = useState(1);
  const [inspectItemId, setInspectItemId] = useState(null);
  const [newImageUrlInput, setNewImageUrlInput] = useState('');
  const [validatingImages, setValidatingImages] = useState(false);

  // Exchange rate fetching state
  const [fetchingFx, setFetchingFx] = useState(false);

  // Controlled Import Execution state (Phase 12)
  const [importMode, setImportMode] = useState('draft'); // 'draft' default | 'active' (requires explicit checkbox)
  const [confirmActivePublish, setConfirmActivePublish] = useState(false);
  const [importProgress, setImportProgress] = useState({
    running: false,
    total: 0,
    queued: 0,
    processing: 0,
    imported: 0,
    failed: 0,
    skipped: 0,
    duplicates: 0,
    remaining: 0,
    failedIds: []
  });

  useEffect(() => { saveStored(STORAGE_PROFILES_KEY, profiles); }, [profiles]);
  useEffect(() => { saveStored(STORAGE_PRESETS_KEY, presets); }, [presets]);
  useEffect(() => { saveStored(STORAGE_HISTORY_KEY, history.slice(0, 40)); }, [history]);

  const parsedUrls = useMemo(
    () => sourceUrlsText.split(/\r?\n/).map(s => s.trim()).filter(Boolean),
    [sourceUrlsText]
  );

  const executionPlan = useMemo(() => buildExecutionPlan(workflow), [workflow]);
  const filterConflicts = useMemo(() => detectFilterConflicts(workflow.filters), [workflow.filters]);

  const inspectedItem = useMemo(
    () => stagedItems.find(it => it.stagedId === inspectItemId) || null,
    [stagedItems, inspectItemId]
  );

  // Re-parse NL instruction into structured workflow
  const handleAnalyzeInstruction = (customText, customUrls) => {
    const txt = customText !== undefined ? customText : instruction;
    const urls = customUrls !== undefined ? customUrls : parsedUrls;
    const next = parseSourcingInstruction(txt, urls);
    // Preserve manually configured exchange rate if already set
    if (workflow.pricing?.exchangeRate) {
      next.pricing.exchangeRate = workflow.pricing.exchangeRate;
      next.pricing.exchangeRateSource = workflow.pricing.exchangeRateSource;
      next.pricing.exchangeRateDate = workflow.pricing.exchangeRateDate;
    }
    setWorkflow(next);
    setPlanEdited(false);
    showToast?.('تم تحليل التعليمات وتحويلها إلى خطة عمل مهيكلة قابلة للتعديل ✓', 'success');
  };

  // Apply preset
  const handleSelectPreset = (preset) => {
    setInstruction(preset.instruction);
    const next = parseSourcingInstruction(preset.instruction, parsedUrls);
    next.mode = preset.mode || next.mode;
    if (workflow.pricing?.exchangeRate) {
      next.pricing.exchangeRate = workflow.pricing.exchangeRate;
      next.pricing.exchangeRateSource = workflow.pricing.exchangeRateSource;
      next.pricing.exchangeRateDate = workflow.pricing.exchangeRateDate;
    }
    setWorkflow(next);
    setActiveView('command');
    showToast?.(`تم تحميل القالب: ${preset.title}`, 'info');
  };

  // Save current instruction as reusable preset
  const handleSaveCurrentAsPreset = () => {
    const title = window.prompt('اسم القالب الجديد لحفظه وإعادة استخدامه:');
    if (!title || !title.trim()) return;
    const newPreset = {
      id: `preset_${Date.now()}`,
      title: title.trim(),
      badge: workflow.mode === 'catalog_update' ? 'تحديث' : workflow.mode === 'analyze_only' ? 'تحليل' : 'مخصص',
      mode: workflow.mode,
      instruction: instruction.trim()
    };
    setPresets(prev => [newPreset, ...prev]);
    showToast?.('تم حفظ قالب المهمة بنجاح ✓', 'success');
  };

  // Fetch verified exchange rate from backend API (never fabricated)
  const handleFetchExchangeRate = async (base = 'USD', target = 'EGP') => {
    setFetchingFx(true);
    try {
      const res = await fetch(`/api/ai-sourcing?action=exchange-rate&base=${encodeURIComponent(base)}&target=${encodeURIComponent(target)}`);
      const data = await res.json();
      if (data?.ok && data.rate) {
        setWorkflow(prev => ({
          ...prev,
          pricing: {
            ...prev.pricing,
            exchangeRate: Number(data.rate.toFixed(4)),
            exchangeRateSource: data.source || 'Live Exchange API',
            exchangeRateDate: String(data.conversionDate || new Date().toISOString()).slice(0, 10)
          }
        }));
        showToast?.(`تم جلب سعر الصرف الموثق: 1 ${base} = ${Number(data.rate).toFixed(2)} ${target} ✓`, 'success');
      } else {
        showToast?.(data?.error || 'تعذر جلب سعر الصرف التلقائي؛ يرجى إدخاله يدوياً.', 'warning');
      }
    } catch {
      showToast?.('تعذر الاتصال بخدمة سعر الصرف السحابية حالياً؛ أدخل سعر الصرف يدوياً في تبويب التسعير.', 'warning');
    } finally {
      setFetchingFx(false);
    }
  };

  // Recalculate pricing for all staged items when pricing rules change
  const handleRecalculateAllPricing = (nextPricing = workflow.pricing) => {
    setStagedItems(prev => prev.map(item => {
      const pricing = calculateProductPricing(item, nextPricing, item.editedCategory || item.enriched?.matchedCategory);
      return { ...item, pricing };
    }));
    showToast?.('تم إعادة حساب الأسعار لجميع المنتجات المجهزة بشفافية ✓', 'success');
  };

  // Cancel running task
  const handleCancelExecution = () => {
    if (abortCtrlRef.current) {
      abortCtrlRef.current.abort();
      abortCtrlRef.current = null;
    }
    setExecState(prev => ({
      ...prev,
      running: false,
      cancelled: true,
      stage: 'تم إلغاء المهمة بناءً على طلب المدير',
      logs: [...prev.logs, '⛔ تم إلغاء التنفيذ بواسطة المدير.']
    }));
    showToast?.('تم إلغاء مهمة الاستيراد.', 'info');
  };

  // Core Pipeline Runner (Real URLs via /api/ai-sourcing, Structured Feed CSV/JSON, OR Explicit Isolated Test Mode)
  const runSourcingPipeline = async ({ useIsolatedTest = false } = {}) => {
    // Auto-sync workflow if user edited the instruction text without clicking "تحليل الأمر" first
    let activeWorkflow = workflow;
    if (instruction.trim() !== (workflow.rawInstruction || '').trim() && !planEdited) {
      const reparsed = parseSourcingInstruction(instruction, parsedUrls);
      if (workflow.pricing?.exchangeRate) {
        reparsed.pricing.exchangeRate = workflow.pricing.exchangeRate;
        reparsed.pricing.exchangeRateSource = workflow.pricing.exchangeRateSource;
        reparsed.pricing.exchangeRateDate = workflow.pricing.exchangeRateDate;
      }
      activeWorkflow = reparsed;
      setWorkflow(reparsed);
    }
    if (filterConflicts.length > 0) {
      showToast?.('يوجد تعارض في قواعد الفلترة؛ يرجى تصحيحه أولاً قبل التنفيذ.', 'error');
      setActiveView('filters_pricing');
      return;
    }

    const urlsToScan = activeWorkflow.sourceUrls.length ? activeWorkflow.sourceUrls : parsedUrls;
    const hasFeed = structuredFeedText.trim().length > 0;

    if (!useIsolatedTest && urlsToScan.length === 0 && !hasFeed) {
      showToast?.('أدخل رابط مصدر واحد على الأقل، أو الصق بيانات CSV/JSON، أو استخدم وضع الاختبار المعزول.', 'warning');
      return;
    }

    const taskId = `task_${Date.now()}`;
    const controller = new AbortController();
    abortCtrlRef.current = controller;

    const logs = [];
    const errors = [];
    const pushLog = (msg) => {
      logs.push(`[${new Date().toLocaleTimeString('ar-EG')}] ${msg}`);
    };

    setExecState({
      running: true,
      cancelled: false,
      stage: 'جاري التحقق الأمني من المصدر...',
      currentSource: useIsolatedTest ? 'Isolated Sandbox Test Fixture' : (urlsToScan[0] || 'Structured Feed'),
      discovered: 0,
      filteredPassed: 0,
      excluded: 0,
      duplicates: 0,
      enriched: 0,
      prepared: 0,
      errors: [],
      logs: [],
      progressPct: 10,
      isIsolatedTest: useIsolatedTest,
      activeTaskId: taskId
    });

    let discoveredRaw = [];

    try {
      // STAGE 1: Discovery
      if (useIsolatedTest) {
        pushLog('🧪 تشغيل وضع الاختبار المعزول (Isolated Test Fixture — 5 منتجات اختبارية؛ لا تُنشر تلقائياً).');
        discoveredRaw = ISOLATED_TEST_PRODUCTS.map(p => ({ ...p }));
      } else if (hasFeed) {
        pushLog('📄 تحليل البيانات المنظمة المرفقة (CSV / JSON Feed)...');
        const feedRes = parseStructuredSourceInput(structuredFeedText, 'uploaded_feed');
        if (!feedRes.ok) {
          errors.push(feedRes.error);
          pushLog(`❌ ${feedRes.error}`);
        } else {
          discoveredRaw = feedRes.products;
          pushLog(`✓ تم استخراج ${discoveredRaw.length} منتج من البيانات المنظمة (${feedRes.method}).`);
        }
      } else {
        for (let i = 0; i < urlsToScan.length; i++) {
          if (controller.signal.aborted) return;
          const u = urlsToScan[i];
          setExecState(prev => ({
            ...prev,
            stage: `جاري تحليل المصدر (${i + 1}/${urlsToScan.length})...`,
            currentSource: u,
            progressPct: Math.round(15 + (i / urlsToScan.length) * 30)
          }));
          pushLog(`🔍 فحص المصدر عبر الخادم الآمن: ${u}`);

          try {
            const resp = await fetch('/api/ai-sourcing?action=discover', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: u }),
              signal: controller.signal
            });
            const data = await resp.json();
            if (Array.isArray(data.logs)) data.logs.forEach(l => pushLog(l));
            if (data.ok && Array.isArray(data.products)) {
              discoveredRaw.push(...data.products);
              // Mark profile verified if matched
              setProfiles(prev => prev.map(pr =>
                pr.website && u.startsWith(pr.website.replace(/\/$/, ''))
                  ? { ...pr, verifiedCapability: true, extractionMethod: data.extractionMethod || pr.extractionMethod, lastTestedAt: new Date().toISOString() }
                  : pr
              ));
            } else {
              const errMsg = data?.error || `تعذر استخراج بيانات من ${u}`;
              errors.push(errMsg);
              pushLog(`⚠️ ${errMsg}`);
            }
          } catch (err) {
            if (err?.name === 'AbortError') return;
            const errMsg = `تعذر الاتصال بـ /api/ai-sourcing للرابط (${u}). تأكد من نشر المشروع على Vercel أو استخدم لصق بيانات CSV/JSON كبديل فوري.`;
            errors.push(errMsg);
            pushLog(`❌ ${errMsg}`);
          }
        }
      }

      if (controller.signal.aborted) return;

      setExecState(prev => ({
        ...prev,
        stage: 'تطبيق قواعد الفلترة الذكية...',
        discovered: discoveredRaw.length,
        errors: [...errors],
        logs: [...logs],
        progressPct: 50
      }));

      // STAGE 2: Filtering
      const { passed, excluded } = applyProductFilters(discoveredRaw, activeWorkflow.filters);
      pushLog(`🔎 نتائج الفلترة: ${passed.length} منتج مطابق، ${excluded.length} منتج مستبعد.`);

      setExecState(prev => ({
        ...prev,
        stage: 'مقارنة المنتجات مع كتالوج المتجر وكشف التكرارات...',
        filteredPassed: passed.length,
        excluded: excluded.length,
        logs: [...logs],
        progressPct: 68
      }));

      // STAGE 3: Catalog Update Mode vs New Import / Analyze Mode
      if (activeWorkflow.mode === 'catalog_update') {
        const proposals = buildCatalogUpdateProposals(passed, parts, activeWorkflow.pricing);
        pushLog(`🔄 وضع تحديث الكتالوج: تم رصد ${proposals.length} منتج لديه تغييرات مقترحة (بدون تعديل فعلي حتى الموافقة).`);
        setUpdateProposals(proposals);
        setExcludedItems(excluded);
        setExecState(prev => ({
          ...prev,
          running: false,
          stage: 'مكتمل — بانتظار مراجعة وموافقة المدير على التغييرات',
          prepared: proposals.length,
          errors: [...errors],
          logs: [...logs],
          progressPct: 100
        }));
        setHistory(prev => [{
          id: taskId,
          title: `تحديث كتالوج (${proposals.length} مقترح)`,
          mode: workflow.mode,
          instructions: instruction,
          sourceUrls: useIsolatedTest ? ['isolated_test_fixture'] : urlsToScan,
          filters: workflow.filters,
          pricing: workflow.pricing,
          counts: { discovered: discoveredRaw.length, filtered: passed.length, excluded: excluded.length, imported: 0, skipped: 0, failed: errors.length },
          status: 'awaiting_approval',
          logs: [...logs],
          errors: [...errors],
          createdAt: new Date().toISOString()
        }, ...prev]);
        setActiveView('catalog_update');
        return;
      }

      // STAGE 4: Duplicate detection + Image intelligence + AI Enrichment + Pricing
      let dupCount = 0;
      const staged = [];
      const extraExcluded = [...excluded];

      for (let i = 0; i < passed.length; i++) {
        if (controller.signal.aborted) return;
        const p = passed[i];
        const duplicate = classifyDuplicate(p, parts);
        if (duplicate.status !== DUPLICATE_STATUS.NEW_PRODUCT) dupCount++;

        if (activeWorkflow.filters.excludeDuplicates && duplicate.status === DUPLICATE_STATUS.EXACT_DUPLICATE) {
          extraExcluded.push({ ...p, exclusionReasons: [`مستبعد تلقائياً: ${duplicate.reason}`] });
          continue;
        }

        const analyzedImages = analyzeProductImages(p.images || []);
        const enriched = enrichProductData(p, {
          normalizePartCategory,
          existingCategories: categories,
          language: workflow.enrichment?.language || 'ar'
        });
        const pricing = calculateProductPricing(p, activeWorkflow.pricing, enriched.matchedCategory);
        const idempotencyKey = computeIdempotencyKey({ ...p, enriched });

        staged.push({
          ...p,
          stagedId: `stg_${taskId}_${i}`,
          idempotencyKey,
          selected: workflow.mode !== 'analyze_only' && duplicate.status === DUPLICATE_STATUS.NEW_PRODUCT,
          duplicate,
          duplicateAction: duplicate.recommendedAction,
          analyzedImages,
          enriched,
          pricing,
          editedTitle: enriched.displayTitle,
          editedDescription: enriched.displayDescription,
          editedCategory: enriched.matchedCategory,
          customPrice: null,
          importState: 'prepared' // prepared | approved | imported | skipped | failed
        });
      }

      pushLog(`✨ تم إثراء وتجهيز ${staged.length} منتج للمراجعة (تكرارات مكتشفة: ${dupCount}).`);

      setStagedItems(staged);
      setExcludedItems(extraExcluded);
      setReviewPage(1);

      setExecState(prev => ({
        ...prev,
        running: false,
        stage: workflow.mode === 'analyze_only'
          ? 'اكتمل التحليل والتوصيات (وضع استكشاف بدون استيراد)'
          : 'اكتمل التجهيز — بانتظار مراجعة وموافقة المدير قبل الاستيراد',
        duplicates: dupCount,
        enriched: staged.length,
        prepared: staged.length,
        excluded: extraExcluded.length,
        errors: [...errors],
        logs: [...logs],
        progressPct: 100
      }));

      setHistory(prev => [{
        id: taskId,
        title: `${workflow.filters.brands.join(' / ') || 'استيراد ذكي'} (${staged.length} منتج)`,
        mode: workflow.mode,
        instructions: instruction,
        sourceUrls: useIsolatedTest ? ['isolated_test_fixture'] : urlsToScan,
        filters: workflow.filters,
        pricing: workflow.pricing,
        counts: { discovered: discoveredRaw.length, filtered: passed.length, excluded: extraExcluded.length, duplicates: dupCount, prepared: staged.length, imported: 0, skipped: 0, failed: errors.length },
        status: workflow.mode === 'analyze_only' ? 'analyzed' : 'awaiting_approval',
        logs: [...logs],
        errors: [...errors],
        createdAt: new Date().toISOString()
      }, ...prev]);

      setActiveView('review');
    } catch (err) {
      if (err?.name === 'AbortError') return;
      errors.push(err?.message || 'خطأ غير متوقع');
      setExecState(prev => ({ ...prev, running: false, stage: 'توقف التنفيذ بسبب خطأ', errors: [...errors], logs: [...logs] }));
    }
  };

  // Validate images via server-side SSRF-safe HEAD check
  const handleValidateItemImages = async (item) => {
    if (!item?.analyzedImages?.length) return;
    setValidatingImages(true);
    try {
      const urls = item.analyzedImages.map(im => im.url);
      const res = await fetch('/api/ai-sourcing?action=validate-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
      });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.results)) {
        const resMap = new Map(data.results.map(r => [r.url, r]));
        setStagedItems(prev => prev.map(st => {
          if (st.stagedId !== item.stagedId) return st;
          return {
            ...st,
            analyzedImages: st.analyzedImages.map(im => {
              const check = resMap.get(im.url);
              if (!check) return im;
              return {
                ...im,
                status: check.valid ? 'verified' : 'broken',
                lowResHint: im.isLowResHint || Boolean(check.lowQualityHint),
                warnings: check.valid ? im.warnings : Array.from(new Set([...im.warnings, check.error || `رابط معطوب (HTTP ${check.status})`]))
              };
            })
          };
        }));
        showToast?.('تم فحص روابط الصور عبر الخادم الآمن ✓', 'success');
      } else {
        showToast?.('تعذر التحقق من الصور عبر الخادم؛ تأكد من تشغيل API على Vercel.', 'warning');
      }
    } catch {
      showToast?.('تعذر الوصول لخدمة فحص الصور حالياً.', 'warning');
    } finally {
      setValidatingImages(false);
    }
  };

  // Controlled Import Execution (Phase 12 — Safe, Idempotent, Draft by Default)
  const handleExecuteApprovedImport = async (onlyIds = null) => {
    if (importMode === 'active' && !confirmActivePublish) {
      showToast?.('يجب تفعيل مربع تأكيد النشر المباشر قبل استيراد المنتجات كنشطة.', 'warning');
      return;
    }

    const targets = stagedItems.filter(it =>
      onlyIds ? onlyIds.includes(it.stagedId) : (it.selected && it.importState !== 'imported' && it.duplicateAction !== 'skip')
    );
    if (targets.length === 0) {
      showToast?.('اختر منتجاً واحداً على الأقل جاهزاً للاستيراد.', 'warning');
      return;
    }

    const existingIdSet = new Set(parts.map(p => String(p.id)));
    const defaultModelId = models[0]?.id || 'mdl_general';

    setImportProgress({
      running: true,
      total: targets.length,
      queued: targets.length,
      processing: 0,
      imported: 0,
      failed: 0,
      skipped: 0,
      duplicates: 0,
      remaining: targets.length,
      failedIds: []
    });

    const newPartsToPersist = [];
    const importedIds = new Set();
    const skippedIds = new Set();
    const failedIds = [];
    let dupSkipped = 0;

    for (let i = 0; i < targets.length; i++) {
      const item = targets[i];
      setImportProgress(prev => ({
        ...prev,
        queued: Math.max(0, targets.length - i - 1),
        processing: 1,
        remaining: targets.length - i
      }));

      try {
        const built = buildSafeImportPart(item, execState.activeTaskId, {
          asDraft: importMode === 'draft',
          defaultModelId,
          imageHandling: workflow.imageHandling
        });

        // Idempotency check: prevent duplicate import on retries
        if (existingIdSet.has(built.id)) {
          dupSkipped++;
          skippedIds.add(item.stagedId);
          continue;
        }
        if (!built.name) {
          throw new Error('اسم المنتج فارغ');
        }
        newPartsToPersist.push(built);
        existingIdSet.add(built.id);
        importedIds.add(item.stagedId);
      } catch {
        failedIds.push(item.stagedId);
      }
    }

    // Commit to store state + Supabase (only claim success after callback executes)
    let persistedOk = true;
    if (newPartsToPersist.length > 0 && typeof onConfirmImportParts === 'function') {
      try {
        await Promise.resolve(onConfirmImportParts(newPartsToPersist, { asDraft: importMode === 'draft' }));
      } catch {
        persistedOk = false;
      }
    }

    setStagedItems(prev => prev.map(it => {
      if (importedIds.has(it.stagedId)) return { ...it, importState: persistedOk ? 'imported' : 'failed', selected: false };
      if (skippedIds.has(it.stagedId)) return { ...it, importState: 'skipped', selected: false };
      if (failedIds.includes(it.stagedId)) return { ...it, importState: 'failed' };
      return it;
    }));

    const finalCounts = {
      running: false,
      total: targets.length,
      queued: 0,
      processing: 0,
      imported: persistedOk ? newPartsToPersist.length : 0,
      failed: persistedOk ? failedIds.length : targets.length,
      skipped: skippedIds.size,
      duplicates: dupSkipped,
      remaining: 0,
      failedIds: persistedOk ? failedIds : targets.map(t => t.stagedId)
    };
    setImportProgress(finalCounts);

    // Update task history
    if (execState.activeTaskId) {
      setHistory(prev => prev.map(h => h.id === execState.activeTaskId ? {
        ...h,
        status: finalCounts.failed > 0 ? 'completed_with_errors' : 'completed',
        counts: { ...h.counts, imported: (h.counts?.imported || 0) + finalCounts.imported, skipped: finalCounts.skipped, failed: finalCounts.failed },
        completedAt: new Date().toISOString()
      } : h));
    }

    if (persistedOk && newPartsToPersist.length > 0) {
      showToast?.(
        importMode === 'draft'
          ? `تم استيراد ${newPartsToPersist.length} منتج كـ "مسودة مخفية" ومزامنتها بأمان ✓`
          : `تم استيراد ونشر ${newPartsToPersist.length} منتج بعد موافقتك الصريحة ✓`,
        'success'
      );
    } else if (!persistedOk) {
      showToast?.('حدث خطأ أثناء حفظ المنتجات في قاعدة البيانات؛ يمكنك إعادة المحاولة بأمان (Idempotent).', 'error');
    }
  };

  // Apply approved Catalog Update proposals (Phase 11 — per-field approval)
  const handleApplyApprovedCatalogUpdates = () => {
    const patchMap = {};
    let approvedFields = 0;
    updateProposals.forEach(prop => {
      const partPatch = {};
      prop.changes.forEach(ch => {
        if (ch.approved) {
          partPatch[ch.field] = ch.rawProposed;
          if (ch.field === 'images' && Array.isArray(ch.rawProposed) && ch.rawProposed[0]) {
            partPatch.image = ch.rawProposed[0];
            partPatch.imageUrl = ch.rawProposed[0];
          }
          approvedFields++;
        }
      });
      if (Object.keys(partPatch).length > 0) {
        patchMap[prop.existingPartId] = partPatch;
      }
    });

    if (approvedFields === 0) {
      showToast?.('حدد حقلاً واحداً على الأقل للموافقة قبل تطبيق التحديثات.', 'warning');
      return;
    }

    onApplyCatalogUpdates?.(patchMap);
    setUpdateProposals(prev => prev.map(p => ({
      ...p,
      changes: p.changes.map(c => c.approved ? { ...c, applied: true, approved: false } : c)
    })));
    showToast?.(`تم تطبيق ${approvedFields} تحديث معتمد على الكتالوج ومزامنتها ✓`, 'success');
  };

  // Export staged results as CSV
  const handleExportCsv = () => {
    if (!stagedItems.length) return;
    const headers = ['Title', 'Brand', 'Model', 'SKU', 'Category', 'SourcePrice', 'Currency', 'FinalPriceEGP', 'DuplicateStatus', 'ImagesCount', 'SourceURL'];
    const rows = stagedItems.map(it => [
      `"${String(it.editedTitle || it.name).replace(/"/g, '""')}"`,
      `"${it.brand || ''}"`,
      `"${it.model || ''}"`,
      `"${it.sku || ''}"`,
      `"${it.editedCategory || ''}"`,
      it.price || 0,
      it.currency || '',
      it.customPrice ?? it.pricing?.finalPrice ?? '',
      it.duplicate?.status || '',
      it.analyzedImages?.length || 0,
      `"${it.productUrl || ''}"`
    ].join(','));
    const blob = new Blob(['\uFEFF' + headers.join(',') + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elzoghbi_ai_sourcing_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered & sorted review list
  const filteredReviewItems = useMemo(() => {
    const q = reviewSearch.trim().toLowerCase();
    let list = stagedItems.filter(it => {
      if (reviewDupFilter !== 'ALL' && it.duplicate?.status !== reviewDupFilter) return false;
      if (q) {
        const hay = `${it.editedTitle} ${it.name} ${it.brand} ${it.model} ${it.sku} ${it.editedCategory}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    if (reviewSort === 'price_asc') list = [...list].sort((a, b) => (a.pricing?.finalPrice || 0) - (b.pricing?.finalPrice || 0));
    if (reviewSort === 'price_desc') list = [...list].sort((a, b) => (b.pricing?.finalPrice || 0) - (a.pricing?.finalPrice || 0));
    if (reviewSort === 'quality_desc') list = [...list].sort((a, b) => (b.enriched?.provenance?.completenessScore || 0) - (a.enriched?.provenance?.completenessScore || 0));
    return list;
  }, [stagedItems, reviewSearch, reviewDupFilter, reviewSort]);

  const PAGE_SIZE = 30;
  const totalPages = Math.max(1, Math.ceil(filteredReviewItems.length / PAGE_SIZE));
  const paginatedReviewItems = filteredReviewItems.slice((reviewPage - 1) * PAGE_SIZE, reviewPage * PAGE_SIZE);
  const selectedCount = stagedItems.filter(it => it.selected && it.importState !== 'imported').length;

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Header Command Bar */}
      <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-fg">وكيل الاستيراد الذكي (AI Product Sourcing)</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  مسار شبه آلي محكوم بالموافقة
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                اكتشاف ← استخراج ← فلترة ← كشف التكرار ← إثراء عربي ← ذكاء الصور ← تسعير ← مراجعة ← موافقة ← استيراد كمسودات
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {execState.running ? (
              <button
                type="button"
                onClick={handleCancelExecution}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center gap-1.5 transition"
              >
                <Ban className="w-4 h-4" />
                إلغاء المهمة الجارية
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => runSourcingPipeline({ useIsolatedTest: false })}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition"
                >
                  <Zap className="w-4 h-4" />
                  بدء تنفيذ الخطة
                </button>
                <button
                  type="button"
                  onClick={() => runSourcingPipeline({ useIsolatedTest: true })}
                  className="px-3 py-2 rounded-xl bg-surface2 hover:bg-amber-500/15 text-fg border border-line text-xs font-extrabold flex items-center gap-1.5 transition"
                  title="تجربة مسار العمل بالكامل ببيانات اختبار معزولة بدون اتصال خارجي"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-500" />
                  اختبار معزول
                </button>
              </>
            )}
          </div>
        </div>

        {/* Navigation Sub-tabs */}
        <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-line">
          {[
            { id: 'command', label: '1. مركز الأوامر والمصادر والخطة', icon: Sparkles, count: null },
            { id: 'filters_pricing', label: '2. الفلاتر والتسعير والعملة', icon: Filter, count: filterConflicts.length || null, urgent: filterConflicts.length > 0 },
            { id: 'review', label: '3. مراجعة المنتجات والصور', icon: Package, count: stagedItems.length || null },
            { id: 'catalog_update', label: '4. تحديث الكتالوج والمقارنة', icon: RefreshCw, count: updateProposals.length || null },
            { id: 'history', label: '5. التنفيذ وسجل التدقيق', icon: Clock, count: history.length || null }
          ].map(t => {
            const Icon = t.icon;
            const active = activeView === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveView(t.id)}
                className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-surface2/60 text-fg border-line hover:bg-surface2'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {t.count !== null && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    t.urgent ? 'bg-rose-600 text-white' : active ? 'bg-white/20 text-white' : 'bg-surface text-fg border border-line'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Real-time Backend Execution Progress Panel (Phase 2) */}
      {(execState.running || execState.logs.length > 0) && (
        <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {execState.running ? (
                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              ) : execState.cancelled ? (
                <Ban className="w-4 h-4 text-rose-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
              <span className="text-xs font-black text-fg">{execState.stage}</span>
              {execState.isIsolatedTest && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black">
                  وضع اختبار معزول (بيانات تجريبية غير إنتاجية)
                </span>
              )}
            </div>
            {execState.progressPct !== null && (
              <span className="text-xs font-black text-blue-600">{execState.progressPct}%</span>
            )}
          </div>

          {execState.progressPct !== null && (
            <div className="w-full h-2 rounded-full bg-surface2 overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${execState.progressPct}%` }} />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center">
            {[
              { label: 'تم اكتشافها', val: execState.discovered, cls: 'text-fg' },
              { label: 'طابقت الفلاتر', val: execState.filteredPassed, cls: 'text-blue-600' },
              { label: 'تم استبعادها', val: execState.excluded, cls: 'text-amber-600' },
              { label: 'تكرارات مرصودة', val: execState.duplicates, cls: 'text-violet-600' },
              { label: 'تم إثراؤها وتجهيزها', val: execState.prepared, cls: 'text-emerald-600' },
              { label: 'أخطاء / قيود', val: execState.errors.length, cls: execState.errors.length ? 'text-rose-600' : 'text-muted' }
            ].map((stat, i) => (
              <div key={i} className="p-2 rounded-xl bg-surface2/70 border border-line">
                <div className={`text-base font-black ${stat.cls}`}>{stat.val}</div>
                <div className="text-[10px] font-bold text-muted">{stat.label}</div>
              </div>
            ))}
          </div>

          {execState.errors.length > 0 && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 space-y-1">
              <div className="font-black flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                تنبيهات ومحددات الاستخراج:
              </div>
              {execState.errors.map((e, i) => <div key={i}>• {e}</div>)}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 1: AI COMMAND COMPOSER, SOURCE MANAGER & EXECUTION PLAN         */}
      {/* ==================================================================== */}
      {activeView === 'command' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left/Main Column: Task Composer & Sources */}
          <div className="lg:col-span-7 space-y-4">
            {/* Presets Bar (Phase 10) */}
            <div className="rounded-2xl border border-line bg-surface p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-black text-fg flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  قوالب المهام الجاهزة (Task Presets)
                </h3>
                <button
                  type="button"
                  onClick={handleSaveCurrentAsPreset}
                  className="px-2.5 py-1 rounded-lg bg-surface2 hover:bg-blue-600 hover:text-white text-[11px] font-bold text-fg border border-line transition flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  حفظ الأمر كقالب
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {presets.map(pr => (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => handleSelectPreset(pr)}
                    className="px-2.5 py-1.5 rounded-xl bg-surface2/80 hover:bg-blue-500/15 border border-line text-[11px] font-bold text-fg transition flex items-center gap-1.5"
                  >
                    <span className="px-1.5 py-0.2 rounded bg-blue-600/15 text-blue-700 dark:text-blue-300 text-[9.5px] font-black">{pr.badge}</span>
                    <span>{pr.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Natural-Language Task Input (Phase 1A) */}
            <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-fg">أمر المهمة بلغة طبيعية (عربي أو إنجليزي)</label>
                <span className="text-[10.5px] font-bold text-muted">
                  الوضع المكتشف: <b className="text-blue-600">{workflow.mode === 'catalog_update' ? 'مقارنة وتحديث الكتالوج' : workflow.mode === 'analyze_only' ? 'تحليل واكتشاف فقط' : 'استيراد منتجات جديدة (مسودات)'}</b>
                </span>
              </div>
              <textarea
                rows={5}
                value={instruction}
                onChange={e => setInstruction(e.target.value)}
                placeholder="مثال: عايز أستورد منتجات Google Watches وGoogle Pixel Buds فقط من الرابط ده، تجاهل الإكسسوارات والمنتجات الموجودة، اكتب وصف عربي احترافي، زوّد السعر 15% بعد التحويل للجنيه، قرّب لأقرب 50 جنيه، وجهّزها كمسودات..."
                className="w-full p-3 rounded-xl border border-line bg-bg text-fg text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleAnalyzeInstruction()}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black flex items-center gap-1.5 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  تحليل الأمر وتحديث خطة العمل
                </button>
                <div className="text-[11px] text-muted font-bold">
                  الحالة الافتراضية: <span className="text-emerald-600 font-black">مسودة (Draft) — لا يُنشر أي منتج بدون موافقتك</span>
                </div>
              </div>
            </div>

            {/* Source URLs & Compliant Feed Input (Phase 1B) */}
            <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-black text-fg flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  روابط المصادر المصرح بها (رابط واحد في كل سطر)
                </label>
                <button
                  type="button"
                  onClick={() => setShowFeedInput(v => !v)}
                  className="text-[11px] font-extrabold text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {showFeedInput ? 'إخفاء إدخال CSV/JSON' : 'أو الصق بيانات CSV / JSON Feed'}
                </button>
              </div>
              <textarea
                rows={3}
                dir="ltr"
                value={sourceUrlsText}
                onChange={e => {
                  setSourceUrlsText(e.target.value);
                  const urls = e.target.value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
                  setWorkflow(prev => ({ ...prev, sourceUrls: urls, missingQuestions: urls.length ? [] : prev.missingQuestions }));
                }}
                placeholder="https://example-supplier.com/collections/google&#10;https://example-supplier.com/products.json"
                className="w-full p-2.5 rounded-xl border border-line bg-bg text-fg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {showFeedInput && (
                <div className="space-y-1.5 pt-2 border-t border-line">
                  <label className="text-[11px] font-black text-fg block">
                    بديل متوافق عند وجود حماية Anti-Bot: الصق CSV أو JSON Feed مصرح به
                  </label>
                  <textarea
                    rows={4}
                    dir="ltr"
                    value={structuredFeedText}
                    onChange={e => setStructuredFeedText(e.target.value)}
                    placeholder={'name,brand,model,sku,price,currency,category,images\nGoogle Pixel Watch 3,Google,Pixel Watch 3,GA05785,399,USD,Smartwatches,https://...'}
                    className="w-full p-2.5 rounded-xl border border-line bg-bg text-fg text-[11px] font-mono"
                  />
                </div>
              )}

              {/* Saved Source Profiles */}
              <div className="pt-2 border-t border-line space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-muted">ملفات المصادر المحفوظة (Source Profiles)</span>
                  <button
                    type="button"
                    onClick={() => setNewProfileOpen(v => !v)}
                    className="text-[11px] font-extrabold text-blue-600 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    إضافة مصدر جديد
                  </button>
                </div>

                {newProfileOpen && (
                  <div className="p-3 rounded-xl bg-surface2 border border-line grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <input
                      type="text"
                      placeholder="اسم المورد/الموقع"
                      value={newProfileForm.name}
                      onChange={e => setNewProfileForm(p => ({ ...p, name: e.target.value }))}
                      className="px-2.5 py-1.5 rounded-lg border border-line bg-surface text-fg"
                    />
                    <input
                      type="url"
                      dir="ltr"
                      placeholder="https://supplier.com/collections/..."
                      value={newProfileForm.website}
                      onChange={e => setNewProfileForm(p => ({ ...p, website: e.target.value }))}
                      className="px-2.5 py-1.5 rounded-lg border border-line bg-surface text-fg"
                    />
                    <select
                      value={newProfileForm.defaultCurrency}
                      onChange={e => setNewProfileForm(p => ({ ...p, defaultCurrency: e.target.value }))}
                      className="px-2.5 py-1.5 rounded-lg border border-line bg-surface text-fg"
                    >
                      <option value="USD">USD — دولار أمريكي</option>
                      <option value="EGP">EGP — جنيه مصري</option>
                      <option value="EUR">EUR — يورو</option>
                      <option value="AED">AED — درهم إماراتي</option>
                    </select>
                    <input
                      type="text"
                      placeholder="ملاحظات عن المصدر"
                      value={newProfileForm.notes}
                      onChange={e => setNewProfileForm(p => ({ ...p, notes: e.target.value }))}
                      className="px-2.5 py-1.5 rounded-lg border border-line bg-surface text-fg"
                    />
                    <div className="sm:col-span-2 flex justify-end gap-2">
                      <button type="button" onClick={() => setNewProfileOpen(false)} className="px-3 py-1 rounded-lg bg-surface border border-line font-bold">إلغاء</button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!newProfileForm.name.trim() || !newProfileForm.website.trim()) return;
                          setProfiles(prev => [{
                            id: `prof_${Date.now()}`,
                            ...newProfileForm,
                            defaultPricingRule: workflow.pricing,
                            verifiedCapability: false,
                            lastTestedAt: null
                          }, ...prev]);
                          setNewProfileForm({ name: '', website: '', extractionMethod: 'auto', defaultCurrency: 'USD', defaultImageHandling: 'keep_external_urls', notes: '' });
                          setNewProfileOpen(false);
                          showToast?.('تم حفظ ملف المصدر (بحالة غير مختبر حتى يتم فحصه) ✓', 'success');
                        }}
                        className="px-3 py-1 rounded-lg bg-blue-600 text-white font-black"
                      >
                        حفظ المصدر
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {profiles.map(pr => (
                    <div key={pr.id} className="p-2.5 rounded-xl bg-surface2/60 border border-line flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-fg truncate">{pr.name}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-black ${pr.verifiedCapability ? 'bg-emerald-500/15 text-emerald-600' : 'bg-slate-500/15 text-muted'}`}>
                            {pr.verifiedCapability ? 'تم اختباره ✓' : 'غير مختبر بعد'}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted truncate font-mono" dir="ltr">{pr.website}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSourceUrlsText(prev => prev.includes(pr.website) ? prev : (prev ? `${prev}\n${pr.website}` : pr.website));
                          setWorkflow(prev => ({
                            ...prev,
                            sourceUrls: Array.from(new Set([...prev.sourceUrls, pr.website]))
                          }));
                          showToast?.(`تمت إضافة ${pr.name} لقائمة المصادر`, 'info');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-surface hover:bg-blue-600 hover:text-white border border-line text-[11px] font-black shrink-0 transition"
                      >
                        استخدام
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Structured Execution Plan & Parsed Parameters (Phase 2) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Clarification / Conflict Alerts */}
            {(workflow.missingQuestions.length > 0 || filterConflicts.length > 0) && (
              <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-1.5 text-xs">
                <div className="font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  توضيحات مطلوبة قبل البدء:
                </div>
                {workflow.missingQuestions.map((q, i) => <div key={i} className="text-fg">• {q}</div>)}
                {filterConflicts.map((c, i) => <div key={i} className="text-rose-600 font-bold">• {c}</div>)}
              </div>
            )}

            {/* Parsed Workflow Summary */}
            <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-fg">ملخص سير العمل المستخرج من أمرك</h3>
                <button
                  type="button"
                  onClick={() => setActiveView('filters_pricing')}
                  className="text-[11px] font-black text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Edit className="w-3 h-3" />
                  تعديل القواعد
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-surface2/70 border border-line">
                  <div className="text-muted font-bold">العلامات التجارية</div>
                  <div className="font-black text-fg mt-0.5">{workflow.filters.brands.length ? workflow.filters.brands.join('، ') : 'الكل'}</div>
                </div>
                <div className="p-2 rounded-xl bg-surface2/70 border border-line">
                  <div className="text-muted font-bold">الأنواع المطلوبة</div>
                  <div className="font-black text-fg mt-0.5">{workflow.filters.productTypes.length ? workflow.filters.productTypes.join('، ') : 'الكل'}</div>
                </div>
                <div className="p-2 rounded-xl bg-surface2/70 border border-line">
                  <div className="text-muted font-bold">قاعدة التسعير</div>
                  <div className="font-black text-emerald-600 mt-0.5">
                    {PRICING_MODES.find(m => m.id === workflow.pricing.mode)?.label}
                    {workflow.pricing.value ? ` (${workflow.pricing.value})` : ''}
                    {workflow.pricing.roundingStep ? ` · تقريب ${workflow.pricing.roundingStep}` : ''}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-surface2/70 border border-line">
                  <div className="text-muted font-bold">سعر الصرف</div>
                  <div className="font-black text-fg mt-0.5">
                    {workflow.pricing.exchangeRate ? `${workflow.pricing.exchangeRate} ج.م` : 'غير محدد بعد (اضبطه أو اجلبه)'}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-surface2/70 border border-line col-span-2">
                  <div className="text-muted font-bold">الاستبعادات والشروط</div>
                  <div className="font-bold text-fg mt-0.5">
                    {workflow.filters.excludeKeywords.length ? `استبعاد: ${workflow.filters.excludeKeywords.slice(0, 6).join('، ')}` : 'لا توجد كلمات مستبعدة'}
                    {workflow.filters.excludeDuplicates ? ' · تجاهل المكرر' : ''}
                    {workflow.filters.inStockOnly ? ' · المتوفر فقط' : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Structured Step-by-Step Execution Plan */}
            <div className="rounded-2xl border border-line bg-surface p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-fg">خطة التنفيذ المهيكلة ({executionPlan.length} مراحل)</h3>
                <span className="text-[10px] font-bold text-emerald-600">لا يوجد نشر تلقائي</span>
              </div>
              <ol className="space-y-1.5">
                {executionPlan.map((step, idx) => (
                  <li key={step.id} className="flex items-start gap-2 text-xs p-2 rounded-xl bg-surface2/50 border border-line/60">
                    <span className="w-5 h-5 rounded-full bg-blue-600/15 text-blue-700 dark:text-blue-300 font-black text-[10.5px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-fg font-bold leading-snug">{step.label}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: EDITABLE FILTERS & INTELLIGENT PRICING ENGINE (Phases 4 & 8) */}
      {/* ==================================================================== */}
      {activeView === 'filters_pricing' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Filtering Engine */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-fg flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-blue-600" />
                محرك الفلترة الذكي (قواعد التضمين والاستبعاد)
              </h3>
              <select
                value={workflow.filters.combinator}
                onChange={e => setWorkflow(p => ({ ...p, filters: { ...p.filters, combinator: e.target.value } }))}
                className="px-2.5 py-1 rounded-lg border border-line bg-surface2 text-xs font-black text-fg"
              >
                <option value="AND">تطابق كل الشروط (AND)</option>
                <option value="OR">تطابق أي شرط (OR)</option>
              </select>
            </div>

            {filterConflicts.length > 0 && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 font-bold">
                {filterConflicts.map((c, i) => <div key={i}>⚠️ {c}</div>)}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <label className="space-y-1 font-bold text-muted">
                العلامات التجارية المطلوبة (مفصولة بفاصلة)
                <input
                  type="text"
                  value={workflow.filters.brands.join(', ')}
                  onChange={e => setWorkflow(p => ({ ...p, filters: { ...p.filters, brands: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))}
                  placeholder="Google, Sony, Apple"
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-fg font-bold"
                />
              </label>
              <label className="space-y-1 font-bold text-muted">
                كلمات مطلوبة (Include Keywords)
                <input
                  type="text"
                  value={workflow.filters.includeKeywords.join(', ')}
                  onChange={e => setWorkflow(p => ({ ...p, filters: { ...p.filters, includeKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))}
                  placeholder="Pixel Watch, Pixel Buds"
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-fg font-bold"
                />
              </label>
              <label className="space-y-1 font-bold text-muted sm:col-span-2">
                كلمات مستبعدة (Exclude Keywords)
                <input
                  type="text"
                  value={workflow.filters.excludeKeywords.join(', ')}
                  onChange={e => setWorkflow(p => ({ ...p, filters: { ...p.filters, excludeKeywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))}
                  placeholder="refurbished, charger, case, strap, cable"
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-fg font-bold"
                />
              </label>
              <label className="space-y-1 font-bold text-muted">
                الحد الأدنى لسعر المصدر
                <input
                  type="number"
                  value={workflow.filters.minPrice ?? ''}
                  onChange={e => setWorkflow(p => ({ ...p, filters: { ...p.filters, minPrice: e.target.value === '' ? null : Number(e.target.value) } }))}
                  placeholder="مثال: 100"
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-fg font-bold"
                />
              </label>
              <label className="space-y-1 font-bold text-muted">
                الحد الأقصى لسعر المصدر
                <input
                  type="number"
                  value={workflow.filters.maxPrice ?? ''}
                  onChange={e => setWorkflow(p => ({ ...p, filters: { ...p.filters, maxPrice: e.target.value === '' ? null : Number(e.target.value) } }))}
                  placeholder="مثال: 500"
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-fg font-bold"
                />
              </label>
              <label className="space-y-1 font-bold text-muted">
                الحد الأدنى لعدد الصور
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={workflow.filters.minImages || 0}
                  onChange={e => setWorkflow(p => ({ ...p, filters: { ...p.filters, minImages: Number(e.target.value) || 0 } }))}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-fg font-bold"
                />
              </label>
              <label className="space-y-1 font-bold text-muted">
                سياسة معالجة الصور
                <select
                  value={workflow.imageHandling}
                  onChange={e => setWorkflow(p => ({ ...p, imageHandling: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-fg font-bold"
                >
                  {IMAGE_HANDLING_MODES.map(m => <option key={m.id} value={m.id}>{m.short}</option>)}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-line text-xs">
              {[
                { key: 'inStockOnly', label: 'المتوفر في المخزون فقط (In Stock)' },
                { key: 'excludeDuplicates', label: 'تجاهل المنتجات المكررة الموجودة بالمتجر' },
                { key: 'requireSpecs', label: 'فقط المنتجات التي تحتوي مواصفات تقنية' },
                { key: 'requireVerifiedPrice', label: 'فقط المنتجات ذات سعر مصدر موثق' },
                { key: 'excludeLowQuality', label: 'استبعاد المنتجات منخفضة الجودة/الناقصة' }
              ].map(ch => (
                <label key={ch.key} className="flex items-center gap-2 p-2 rounded-xl bg-surface2/60 border border-line cursor-pointer font-bold text-fg">
                  <input
                    type="checkbox"
                    checked={Boolean(workflow.filters[ch.key])}
                    onChange={e => setWorkflow(p => ({ ...p, filters: { ...p.filters, [ch.key]: e.target.checked } }))}
                    className="w-4 h-4 accent-blue-600"
                  />
                  <span>{ch.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Pricing & Currency Engine */}
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-fg flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                محرك التسعير وتحويل العملات الشفاف
              </h3>
              <button
                type="button"
                disabled={fetchingFx}
                onClick={() => handleFetchExchangeRate('USD', 'EGP')}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black flex items-center gap-1 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${fetchingFx ? 'animate-spin' : ''}`} />
                جلب سعر صرف USD→EGP
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <label className="space-y-1 font-bold text-muted sm:col-span-2">
                وضع التسعير (10 أوضاع مدعومة)
                <select
                  value={workflow.pricing.mode}
                  onChange={e => setWorkflow(p => ({ ...p, pricing: { ...p.pricing, mode: e.target.value } }))}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-fg font-bold"
                >
                  {PRICING_MODES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </label>

              <label className="space-y-1 font-bold text-muted">
                قيمة الزيادة / الخصم (% أو ج.م)
                <input
                  type="number"
                  value={workflow.pricing.value ?? 0}
                  onChange={e => setWorkflow(p => ({ ...p, pricing: { ...p.pricing, value: Number(e.target.value) || 0 } }))}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-fg font-bold"
                />
              </label>

              <label className="space-y-1 font-bold text-muted">
                التقريب (Rounding Step — ج.م)
                <select
                  value={workflow.pricing.roundingStep || 0}
                  onChange={e => setWorkflow(p => ({ ...p, pricing: { ...p.pricing, roundingStep: Number(e.target.value) } }))}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-fg font-bold"
                >
                  <option value={0}>بدون تقريب</option>
                  <option value={5}>لأقرب 5 ج.م</option>
                  <option value={10}>لأقرب 10 ج.م</option>
                  <option value={25}>لأقرب 25 ج.م</option>
                  <option value={50}>لأقرب 50 ج.م</option>
                  <option value={100}>لأقرب 100 ج.م</option>
                </select>
              </label>

              <label className="space-y-1 font-bold text-muted">
                سعر الصرف المحدد (لكل 1 وحدة عملة أجنبية → ج.م)
                <input
                  type="number"
                  step="0.01"
                  value={workflow.pricing.exchangeRate ?? ''}
                  onChange={e => setWorkflow(p => ({
                    ...p,
                    pricing: {
                      ...p.pricing,
                      exchangeRate: e.target.value === '' ? null : Number(e.target.value),
                      exchangeRateSource: 'محدد يدوياً بواسطة المدير',
                      exchangeRateDate: new Date().toISOString().slice(0, 10)
                    }
                  }))}
                  placeholder="أدخل السعر أو اضغط جلب سعر الصرف"
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-fg font-bold"
                />
              </label>

              <label className="space-y-1 font-bold text-muted">
                الحد الأدنى للسعر النهائي (اختياري)
                <input
                  type="number"
                  value={workflow.pricing.minFinalPrice ?? ''}
                  onChange={e => setWorkflow(p => ({ ...p, pricing: { ...p.pricing, minFinalPrice: e.target.value === '' ? null : Number(e.target.value) } }))}
                  placeholder="مثال: 500"
                  className="w-full px-3 py-2 rounded-xl border border-line bg-bg text-fg font-bold"
                />
              </label>
            </div>

            {workflow.pricing.exchangeRate && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">
                المصدر: {workflow.pricing.exchangeRateSource || 'محدد من المدير'} · التاريخ: {workflow.pricing.exchangeRateDate || new Date().toISOString().slice(0, 10)} · لا يتم التحويل الصامت أبداً.
              </div>
            )}

            {stagedItems.length > 0 && (
              <button
                type="button"
                onClick={() => handleRecalculateAllPricing(workflow.pricing)}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition"
              >
                إعادة حساب أسعار الـ {stagedItems.length} منتج المجهزين بهذه القواعد
              </button>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 3: SMART PRODUCT IMPORT REVIEW TABLE & INSPECTOR (Phases 5–9)   */}
      {/* ==================================================================== */}
      {activeView === 'review' && (
        <div className="space-y-4">
          {stagedItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center space-y-2">
              <Package className="w-10 h-10 text-muted mx-auto" />
              <div className="text-sm font-black text-fg">لا توجد منتجات مجهزة للمراجعة بعد</div>
              <p className="text-xs text-muted">ابدأ بتنفيذ خطة الاستيراد من مركز الأوامر (أو جرّب وضع الاختبار المعزول لمعاينة سير العمل الكامل).</p>
            </div>
          ) : (
            <>
              {/* Toolbar: Search, Filter, Sort, Bulk Actions & Controlled Import Gate */}
              <div className="rounded-2xl border border-line bg-surface p-3.5 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-muted absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={reviewSearch}
                      onChange={e => { setReviewSearch(e.target.value); setReviewPage(1); }}
                      placeholder="بحث بالاسم، الموديل، SKU، العلامة..."
                      className="w-full pr-8 pl-3 py-2 rounded-xl border border-line bg-bg text-fg text-xs font-bold"
                    />
                  </div>
                  <select
                    value={reviewDupFilter}
                    onChange={e => { setReviewDupFilter(e.target.value); setReviewPage(1); }}
                    className="px-3 py-2 rounded-xl border border-line bg-bg text-fg text-xs font-bold"
                  >
                    <option value="ALL">كل حالات التكرار ({stagedItems.length})</option>
                    {Object.entries(DUPLICATE_LABELS_AR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <select
                    value={reviewSort}
                    onChange={e => setReviewSort(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-line bg-bg text-fg text-xs font-bold"
                  >
                    <option value="quality_desc">الأعلى جودة بيانات</option>
                    <option value="price_asc">السعر: من الأقل للأعلى</option>
                    <option value="price_desc">السعر: من الأعلى للأقل</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="px-3 py-2 rounded-xl bg-surface2 hover:bg-blue-600 hover:text-white border border-line text-xs font-black flex items-center gap-1 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    تصدير CSV
                  </button>
                </div>

                {/* Controlled Approval & Import Action Bar (Phase 12 & 14) */}
                {workflow.mode !== 'analyze_only' && (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-line bg-surface2/50 p-3 rounded-xl">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      <span className="font-black text-fg">المحدد للاستيراد: <b className="text-blue-600">{selectedCount}</b> منتج</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => { setImportMode('draft'); setConfirmActivePublish(false); }}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-black border ${importMode === 'draft' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-surface text-fg border-line'}`}
                        >
                          مسودة مخفية (الافتراضي الآمن)
                        </button>
                        <button
                          type="button"
                          onClick={() => setImportMode('active')}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-black border ${importMode === 'active' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-surface text-fg border-line'}`}
                        >
                          نشر مباشر (يتطلب تأكيد)
                        </button>
                      </div>
                      {importMode === 'active' && (
                        <label className="flex items-center gap-1.5 text-[11px] font-black text-amber-700 dark:text-amber-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={confirmActivePublish}
                            onChange={e => setConfirmActivePublish(e.target.checked)}
                            className="w-4 h-4 accent-amber-600"
                          />
                          أؤكد موافقتي الصريحة على النشر المباشر للعملاء
                        </label>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {importProgress.failedIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleExecuteApprovedImport(importProgress.failedIds)}
                          className="px-3 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-black flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          إعادة محاولة الفاشل ({importProgress.failedIds.length})
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={importProgress.running || selectedCount === 0}
                        onClick={() => handleExecuteApprovedImport()}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        موافقة واستيراد المحدد ({selectedCount})
                      </button>
                    </div>
                  </div>
                )}

                {importProgress.total > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[11px]">
                    <div className="p-1.5 rounded-lg bg-surface2 border border-line"><b>{importProgress.total}</b><div className="text-muted">إجمالي</div></div>
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300"><b>{importProgress.imported}</b><div>تم استيرادها</div></div>
                    <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300"><b>{importProgress.skipped}</b><div>تم تخطيها</div></div>
                    <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-700 dark:text-violet-300"><b>{importProgress.duplicates}</b><div>مكررة</div></div>
                    <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300"><b>{importProgress.failed}</b><div>فشلت</div></div>
                    <div className="p-1.5 rounded-lg bg-surface2 border border-line"><b>{importProgress.remaining}</b><div className="text-muted">متبقي</div></div>
                  </div>
                )}
              </div>

              {/* Editable Review Table (Phase 9) */}
              <div className="rounded-2xl border border-line bg-surface overflow-x-auto">
                <table className="w-full text-xs text-right">
                  <thead className="bg-surface2 text-muted font-black border-b border-line">
                    <tr>
                      <th className="p-2.5 w-8">
                        <input
                          type="checkbox"
                          checked={paginatedReviewItems.length > 0 && paginatedReviewItems.every(it => it.selected)}
                          onChange={e => {
                            const checked = e.target.checked;
                            const ids = new Set(paginatedReviewItems.map(i => i.stagedId));
                            setStagedItems(prev => prev.map(it => ids.has(it.stagedId) && it.importState !== 'imported' ? { ...it, selected: checked } : it));
                          }}
                        />
                      </th>
                      <th className="p-2.5">المنتج والصورة</th>
                      <th className="p-2.5">العلامة / الموديل / SKU</th>
                      <th className="p-2.5">سعر المصدر</th>
                      <th className="p-2.5">السعر النهائي (ج.م)</th>
                      <th className="p-2.5">التصنيف</th>
                      <th className="p-2.5">حالة التكرار</th>
                      <th className="p-2.5">الجودة والصور</th>
                      <th className="p-2.5">الحالة / معاينة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {paginatedReviewItems.map(it => {
                      const mainImg = (it.analyzedImages || []).find(im => im.isMain)?.url || it.analyzedImages?.[0]?.url || '';
                      const score = it.enriched?.provenance?.completenessScore || 0;
                      const finalPriceVal = it.customPrice ?? it.pricing?.finalPrice ?? '';
                      return (
                        <tr key={it.stagedId} className="hover:bg-surface2/40 transition">
                          <td className="p-2.5">
                            <input
                              type="checkbox"
                              disabled={it.importState === 'imported'}
                              checked={Boolean(it.selected)}
                              onChange={e => setStagedItems(prev => prev.map(x => x.stagedId === it.stagedId ? { ...x, selected: e.target.checked } : x))}
                            />
                          </td>
                          <td className="p-2.5 min-w-[220px]">
                            <div className="flex items-center gap-2.5">
                              {mainImg ? (
                                <img src={mainImg} alt="" className="w-11 h-11 rounded-lg object-cover border border-line bg-surface2 shrink-0" />
                              ) : (
                                <div className="w-11 h-11 rounded-lg border border-dashed border-line flex items-center justify-center text-muted shrink-0"><Camera className="w-4 h-4" /></div>
                              )}
                              <div className="min-w-0 flex-1 space-y-1">
                                <input
                                  type="text"
                                  value={it.editedTitle}
                                  onChange={e => setStagedItems(prev => prev.map(x => x.stagedId === it.stagedId ? { ...x, editedTitle: e.target.value } : x))}
                                  className="w-full px-2 py-1 rounded-lg border border-line bg-bg text-fg font-extrabold text-[11.5px]"
                                />
                                <div className="text-[10px] text-muted truncate">الأصلي: {it.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <div className="font-black text-fg">{it.brand || '—'}</div>
                            <div className="text-[10.5px] text-muted">{it.model || '—'}</div>
                            <div className="text-[10px] font-mono text-muted">{it.sku || 'بدون SKU'}</div>
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <div className="font-black text-fg">{it.price ? `${it.price} ${it.currency}` : 'غير محدد'}</div>
                            <div className="text-[10px] text-muted">{it.pricing?.markupLabel || ''}</div>
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <input
                              type="number"
                              value={finalPriceVal}
                              onChange={e => setStagedItems(prev => prev.map(x => x.stagedId === it.stagedId ? { ...x, customPrice: e.target.value === '' ? null : Number(e.target.value) } : x))}
                              placeholder={it.pricing?.ok ? '' : 'أدخل سعر الصرف'}
                              className="w-24 px-2 py-1 rounded-lg border border-line bg-bg text-emerald-700 dark:text-emerald-400 font-black text-xs"
                            />
                            {!it.pricing?.ok && (
                              <div className="text-[9.5px] text-amber-600 font-bold mt-0.5">يلزم سعر صرف</div>
                            )}
                          </td>
                          <td className="p-2.5">
                            <select
                              value={it.editedCategory}
                              onChange={e => setStagedItems(prev => prev.map(x => x.stagedId === it.stagedId ? { ...x, editedCategory: e.target.value } : x))}
                              className="px-2 py-1 rounded-lg border border-line bg-bg text-fg text-[11px] font-bold max-w-[150px]"
                            >
                              {Array.from(new Set([it.editedCategory, ...categories].filter(Boolean))).map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2.5">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black border ${DUP_BADGE_CLASS[it.duplicate?.status] || ''}`}>
                              {it.duplicate?.labelAr}
                            </span>
                            {it.duplicate?.status !== DUPLICATE_STATUS.NEW_PRODUCT && (
                              <select
                                value={it.duplicateAction}
                                onChange={e => setStagedItems(prev => prev.map(x => x.stagedId === it.stagedId ? { ...x, duplicateAction: e.target.value } : x))}
                                className="mt-1 block w-full px-1.5 py-0.5 rounded border border-line bg-bg text-[10px] font-bold"
                              >
                                <option value="skip">تخطي</option>
                                <option value="import_new">استيراد كجديد</option>
                                <option value="update_existing">تحديث الموجود</option>
                                <option value="add_variant">إضافة كمتغير</option>
                                <option value="manual_review">مراجعة يدوية</option>
                              </select>
                            )}
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <div className="font-black text-fg">{score}% اكتمال</div>
                            <div className="text-[10px] text-muted">{(it.analyzedImages || []).filter(i => i.selected).length} / {(it.analyzedImages || []).length} صور</div>
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInspectItemId(it.stagedId)}
                                className="px-2.5 py-1.5 rounded-lg bg-blue-600/15 hover:bg-blue-600 text-blue-700 dark:text-blue-300 hover:text-white text-[11px] font-black flex items-center gap-1 transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                فحص وتعديل
                              </button>
                              {it.importState === 'imported' && (
                                <span className="px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 text-[10px] font-black">تم الاستيراد ✓</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 text-xs font-bold">
                  <button type="button" disabled={reviewPage <= 1} onClick={() => setReviewPage(p => p - 1)} className="px-3 py-1 rounded-lg border border-line bg-surface disabled:opacity-40">السابق</button>
                  <span>صفحة {reviewPage} من {totalPages}</span>
                  <button type="button" disabled={reviewPage >= totalPages} onClick={() => setReviewPage(p => p + 1)} className="px-3 py-1 rounded-lg border border-line bg-surface disabled:opacity-40">التالي</button>
                </div>
              )}

              {/* Excluded Products Summary */}
              {excludedItems.length > 0 && (
                <details className="rounded-2xl border border-line bg-surface p-3.5 text-xs">
                  <summary className="cursor-pointer font-black text-amber-700 dark:text-amber-300">
                    عرض المنتجات المستبعدة بواسطة الفلاتر ({excludedItems.length} منتج)
                  </summary>
                  <div className="mt-2.5 space-y-1.5">
                    {excludedItems.map((ex, i) => (
                      <div key={i} className="p-2 rounded-xl bg-surface2/60 border border-line flex flex-wrap justify-between gap-2">
                        <span className="font-bold text-fg">{ex.name}</span>
                        <span className="text-rose-600 font-bold">{(ex.exclusionReasons || []).join(' · ')}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 4: SMART CATALOG UPDATE MODE (Phase 11)                         */}
      {/* ==================================================================== */}
      {activeView === 'catalog_update' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-fg">وضع مراجعة وتحديث الكتالوج الحالي (بدون تعديل تلقائي)</h3>
              <p className="text-xs text-muted">اختر التغييرات التي توافق عليها لكل منتج ولكل حقل على حدة قبل تطبيقها.</p>
            </div>
            <button
              type="button"
              disabled={!updateProposals.length}
              onClick={handleApplyApprovedCatalogUpdates}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 disabled:opacity-40"
            >
              <Check className="w-4 h-4" />
              تطبيق التغييرات المعتمدة فقط
            </button>
          </div>

          {updateProposals.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-xs text-muted">
              لا توجد مقترحات تحديث حالياً. اختر قالب «مراجعة ومقارنة أسعار Google» أو «Catalog Refresh» ثم نفّذ الفحص.
            </div>
          ) : (
            <div className="space-y-3">
              {updateProposals.map(prop => (
                <div key={prop.id} className="rounded-2xl border border-line bg-surface p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-line">
                    <div>
                      <div className="text-xs font-black text-fg">{prop.existingPartName}</div>
                      <div className="text-[10.5px] text-muted">سبب المطابقة: {prop.matchReason} · الثقة: {Math.round(prop.confidence * 100)}%</div>
                    </div>
                    <span className="text-[10.5px] font-mono text-muted">SKU: {prop.existingSku || '—'}</span>
                  </div>
                  <div className="space-y-1.5">
                    {prop.changes.map((ch, idx) => (
                      <label key={idx} className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-surface2/60 border border-line text-xs cursor-pointer">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            disabled={ch.applied}
                            checked={Boolean(ch.approved)}
                            onChange={e => {
                              const checked = e.target.checked;
                              setUpdateProposals(prev => prev.map(p => p.id !== prop.id ? p : {
                                ...p,
                                changes: p.changes.map((c, ci) => ci === idx ? { ...c, approved: checked } : c)
                              }));
                            }}
                            className="w-4 h-4 accent-emerald-600"
                          />
                          <span className="font-black text-fg">{ch.fieldLabel}:</span>
                          <span className="text-muted line-through">{ch.existingValue}</span>
                          <span>←</span>
                          <span className="font-black text-emerald-600">{ch.proposedValue}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[10px] font-black">{ch.deltaLabel}</span>
                          {ch.applied && <span className="text-emerald-600 font-black text-[10.5px]">تم التطبيق ✓</span>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 5: IMPORT HISTORY & AUDIT LOGS (Phase 13)                       */}
      {/* ==================================================================== */}
      {activeView === 'history' && (
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-xs text-muted">
              سجل مهام الاستيراد والتدقيق فارغ حتى الآن. ستظهر هنا جميع المهام المنفذة والنتائج وسجلات الأخطاء.
            </div>
          ) : (
            history.map(h => (
              <div key={h.id} className="rounded-2xl border border-line bg-surface p-4 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-black text-fg">{h.title}</div>
                    <div className="text-[10.5px] text-muted">{new Date(h.createdAt).toLocaleString('ar-EG')} · ID: {h.id}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-surface2 border border-line text-[10.5px] font-black text-fg">{h.status}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setInstruction(h.instructions || '');
                        setSourceUrlsText((h.sourceUrls || []).filter(u => u !== 'isolated_test_fixture').join('\n'));
                        handleAnalyzeInstruction(h.instructions || '', (h.sourceUrls || []).filter(u => u !== 'isolated_test_fixture'));
                        setActiveView('command');
                      }}
                      className="px-2.5 py-1 rounded-lg bg-blue-600/15 text-blue-700 dark:text-blue-300 font-black hover:bg-blue-600 hover:text-white transition"
                    >
                      إعادة استخدام المهمة
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-muted">
                  <span>اكتشاف: <b className="text-fg">{h.counts?.discovered || 0}</b></span>
                  <span>مستبعد: <b className="text-fg">{h.counts?.excluded || 0}</b></span>
                  <span>تم استيرادها: <b className="text-emerald-600">{h.counts?.imported || 0}</b></span>
                  <span>أخطاء: <b className="text-rose-600">{h.counts?.failed || 0}</b></span>
                </div>
                {Array.isArray(h.logs) && h.logs.length > 0 && (
                  <details className="pt-1">
                    <summary className="cursor-pointer text-[11px] font-bold text-blue-600">عرض سجل التنفيذ ({h.logs.length} سطر)</summary>
                    <div className="mt-1.5 p-2.5 rounded-xl bg-bg border border-line font-mono text-[10.5px] space-y-0.5 max-h-40 overflow-y-auto">
                      {h.logs.map((l, i) => <div key={i}>{l}</div>)}
                    </div>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* DETAILED PRODUCT INSPECTOR & IMAGE INTELLIGENCE MODAL (Phases 6–9)   */}
      {/* ==================================================================== */}
      {inspectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
          <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-surface border border-line shadow-xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line bg-surface2">
              <div className="min-w-0">
                <div className="text-xs font-black text-fg truncate">فحص وتعديل المنتج قبل الاستيراد: {inspectedItem.editedTitle}</div>
                <div className="text-[10.5px] text-muted truncate" dir="ltr">{inspectedItem.productUrl || inspectedItem.sourceUrl}</div>
              </div>
              <button type="button" onClick={() => setInspectItemId(null)} className="w-8 h-8 rounded-lg bg-surface border border-line flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Image Intelligence Gallery (Phase 7) */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-black text-fg flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-blue-600" />
                    ذكاء وإدارة صور المنتج ({inspectedItem.analyzedImages.length} صور)
                  </h4>
                  <button
                    type="button"
                    disabled={validatingImages}
                    onClick={() => handleValidateItemImages(inspectedItem)}
                    className="px-2.5 py-1 rounded-lg bg-surface2 border border-line font-black text-[11px] flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${validatingImages ? 'animate-spin' : ''}`} />
                    فحص صلاحية الروابط
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {inspectedItem.analyzedImages.map((im, idx) => (
                    <div key={im.id} className={`p-2 rounded-xl border ${im.isMain ? 'border-blue-600 bg-blue-500/5' : 'border-line bg-surface2/50'} space-y-1.5`}>
                      <div className="relative">
                        <img src={im.url} alt="" className="w-full h-24 rounded-lg object-cover bg-bg border border-line" />
                        {im.isMain && (
                          <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9.5px] font-black">رئيسية</span>
                        )}
                      </div>
                      {im.warnings.length > 0 && (
                        <div className="text-[9.5px] text-amber-600 font-bold">{im.warnings[0]}</div>
                      )}
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setStagedItems(prev => prev.map(x => x.stagedId !== inspectedItem.stagedId ? x : {
                            ...x,
                            analyzedImages: x.analyzedImages.map((m, mi) => ({ ...m, isMain: mi === idx, selected: mi === idx ? true : m.selected }))
                          }))}
                          className="px-1.5 py-0.5 rounded bg-surface border border-line font-bold"
                        >
                          تعيين رئيسية
                        </button>
                        <button
                          type="button"
                          onClick={() => setStagedItems(prev => prev.map(x => x.stagedId !== inspectedItem.stagedId ? x : {
                            ...x,
                            analyzedImages: x.analyzedImages.filter((_, mi) => mi !== idx)
                          }))}
                          className="p-1 rounded text-rose-600 hover:bg-rose-500/10"
                          title="حذف الصورة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add manual image URL */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    dir="ltr"
                    value={newImageUrlInput}
                    onChange={e => setNewImageUrlInput(e.target.value)}
                    placeholder="https://... أضف رابط صورة جديد"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-line bg-bg text-fg text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const u = newImageUrlInput.trim();
                      if (!/^https?:\/\//i.test(u)) return;
                      setStagedItems(prev => prev.map(x => x.stagedId !== inspectedItem.stagedId ? x : {
                        ...x,
                        analyzedImages: [...x.analyzedImages, ...analyzeProductImages([u]).map(m => ({ ...m, isMain: x.analyzedImages.length === 0 }))]
                      }));
                      setNewImageUrlInput('');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-black"
                  >
                    إضافة صورة
                  </button>
                </div>
              </div>

              {/* Description & Pricing Calculation Side-by-Side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="font-black text-fg block">الوصف العربي المحسّن (قابل للتعديل)</label>
                  <textarea
                    rows={7}
                    value={inspectedItem.editedDescription}
                    onChange={e => setStagedItems(prev => prev.map(x => x.stagedId === inspectedItem.stagedId ? { ...x, editedDescription: e.target.value } : x))}
                    className="w-full p-2.5 rounded-xl border border-line bg-bg text-fg text-xs leading-relaxed"
                  />
                </div>

                <div className="space-y-3">
                  {/* Transparent Pricing Breakdown */}
                  <div className="p-3 rounded-xl bg-surface2/60 border border-line space-y-1.5">
                    <div className="font-black text-fg">تفاصيل معادلة التسعير</div>
                    {(inspectedItem.pricing?.steps || []).map((st, i) => (
                      <div key={i} className="text-[11px] text-fg">• {st}</div>
                    ))}
                  </div>

                  {/* Provenance & Missing Info (Phase 6G) */}
                  <div className="p-3 rounded-xl bg-surface2/60 border border-line space-y-1.5">
                    <div className="font-black text-fg">شفافية المصدر ومستوى الاكتمال ({inspectedItem.enriched?.provenance?.completenessScore}%)</div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300"><b>موثق من المصدر:</b> {(inspectedItem.enriched?.provenance?.sourceVerified || []).join('، ')}</div>
                    <div className="text-[11px] text-blue-700 dark:text-blue-300"><b>مولّد بالذكاء الاصطناعي من المصدر:</b> {(inspectedItem.enriched?.provenance?.aiGeneratedFromSource || []).join('، ')}</div>
                    {inspectedItem.enriched?.provenance?.missing?.length > 0 && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-300"><b>ناقص:</b> {inspectedItem.enriched.provenance.missing.join('، ')}</div>
                    )}
                    <div className="text-[11px] text-muted"><b>تحليل التكرار:</b> {inspectedItem.duplicate?.reason}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-line bg-surface2 flex justify-end">
              <button type="button" onClick={() => setInspectItemId(null)} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-black">
                حفظ وإغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
