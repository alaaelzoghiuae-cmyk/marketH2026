import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'elzoghbi_site_control_v1';
const DRAFT_KEY = 'elzoghbi_site_control_draft_v1';
const VERSIONS_KEY = 'elzoghbi_site_control_versions_v1';

// Strict whitelist of allowed fonts & validators (never allow raw CSS or JS injection)
export const ALLOWED_ARABIC_FONTS = [
  'IBM Plex Sans Arabic',
  'Cairo',
  'Noto Sans Arabic',
  'SF Arabic',
];

export const ALLOWED_LATIN_FONTS = [
  'Inter',
  '-apple-system',
  'SF Pro Text',
  'Segoe UI',
  'Roboto',
];

export const DEFAULT_SITE_CONFIG = {
  version: 1,
  theme: {
    tokens_light: {
      bg: '#fafafc',
      surface: '#ffffff',
      surface2: '#f5f5f7',
      fg: '#1d1d1f',
      muted: '#6e6e73',
      line: '#d2d2d7',
      accent: '#0071e3',
      accentText: '#0066cc',
    },
    tokens_dark: {
      bg: '#161617',
      surface: '#1d1d1f',
      surface2: '#2c2c2e',
      fg: '#f5f5f7',
      muted: '#a1a1a6',
      line: '#38383a',
      accent: '#0071e3',
      accentText: '#2997ff',
    },
    typography: {
      arabicFont: 'IBM Plex Sans Arabic',
      latinFont: 'Inter',
      baseSizePx: 16,
      arabicLineHeight: 1.65,
      latinLineHeight: 1.5,
    },
    layout: {
      maxWidthPx: 1200,
      cardRadiusPx: 18,
      controlRadiusPx: 12,
      pillRadiusPx: 980,
      productsPerPage: 24,
    },
  },
  blocks: {
    'home.hero.badge': { ar: 'جودة مضمونة وأسعار تنافسية ⚡', en: 'Guaranteed quality & competitive prices ⚡' },
    'home.hero.title': { ar: 'تسوق بذكاء .. عيش تجربة أفضل', en: 'Shop smarter.. live a better experience' },
    'home.hero.subtitle': {
      ar: 'تشكيلة متكاملة من أحدث المنتجات والأجهزة ومستلزماتها بضمان حقيقي وشحن سريع لكل المحافظات',
      en: 'Complete selection of original parts & accessories with real warranty and fast delivery',
    },
    'home.hero.cta': { ar: 'تصفح كل المنتجات', en: 'Browse all products' },
  },
  sections: [],
  navigation: [],
  banners: [],
  seo: null,
};

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isValidHex(val) {
  return typeof val === 'string' && HEX_RE.test(val.trim());
}

export function sanitizePlainText(input, maxLen = 600) {
  return String(input ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .trim()
    .slice(0, maxLen);
}

export function hexToRgb(hex) {
  if (!isValidHex(hex)) return null;
  let c = hex.trim().slice(1);
  if (c.length === 3) c = c.split('').map((ch) => ch + ch).join('');
  const n = parseInt(c, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function relativeLuminance([r, g, b]) {
  const toLin = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

/**
 * WCAG 2.1 contrast ratio calculator (minimum 4.5:1 recommended for normal text).
 */
export function computeContrastRatio(hexA, hexB) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  if (!a || !b) return 0;
  const l1 = relativeLuminance(a);
  const l2 = relativeLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function validateThemeContrast(themeTokens) {
  const warnings = [];
  const check = (label, fg, bg) => {
    const ratio = computeContrastRatio(fg, bg);
    if (ratio > 0 && ratio < 4.5) {
      warnings.push({ label, fg, bg, ratio, message: `تباين ${label} ضعيف (${ratio}:1) — يُنصح بـ 4.5:1 على الأقل` });
    }
  };
  const lt = themeTokens?.tokens_light || {};
  const dk = themeTokens?.tokens_dark || {};
  check('النص الأساسي (فاتح)', lt.fg || '#1d1d1f', lt.bg || '#fafafc');
  check('النص الثانوي (فاتح)', lt.muted || '#6e6e73', lt.bg || '#fafafc');
  check('الروابط (فاتح)', lt.accentText || '#0066cc', lt.surface || '#ffffff');
  check('النص الأساسي (داكن)', dk.fg || '#f5f5f7', dk.bg || '#161617');
  check('الروابط (داكن)', dk.accentText || '#2997ff', dk.surface || '#1d1d1f');
  return warnings;
}

export function applyWhitelistedThemeVars(theme) {
  if (typeof document === 'undefined' || !theme) return;
  const root = document.documentElement;
  const isDark = root.classList.contains('dark');
  const palette = isDark ? theme.tokens_dark : theme.tokens_light;
  if (palette && typeof palette === 'object') {
    const map = {
      bg: '--bg',
      surface: '--surface',
      surface2: '--surface2',
      fg: '--fg',
      muted: '--muted',
      line: '--line',
      accent: '--accent',
      accentText: '--accent-text',
    };
    Object.entries(map).forEach(([k, cssVar]) => {
      const rgb = hexToRgb(palette[k]);
      if (rgb) root.style.setProperty(cssVar, `${rgb[0]} ${rgb[1]} ${rgb[2]}`);
    });
  }
  const lay = theme.layout || {};
  const clamp = (v, min, max, fb) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fb;
  };
  root.style.setProperty('--r-lg', `${clamp(lay.cardRadiusPx, 8, 28, 18)}px`);
  root.style.setProperty('--r-md', `${clamp(lay.controlRadiusPx, 4, 20, 12)}px`);
  root.style.setProperty('--container', `${clamp(lay.maxWidthPx, 960, 1440, 1200)}px`);
}

function readLocalJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const SiteConfigContext = createContext({
  config: DEFAULT_SITE_CONFIG,
  draft: null,
  versions: [],
  isDraftPreview: false,
  setDraftPreview: () => {},
  saveDraft: () => {},
  publishDraft: () => {},
  rollbackVersion: () => {},
  resetToDefaults: () => {},
  exportConfigJson: () => '{}',
  importConfigJson: () => ({ ok: false }),
  tBlock: (key, fb) => fb || '',
});

export function SiteConfigProvider({ children }) {
  const [config, setConfig] = useState(() => {
    const cached = readLocalJson(STORAGE_KEY, null);
    return cached ? { ...DEFAULT_SITE_CONFIG, ...cached } : DEFAULT_SITE_CONFIG;
  });
  const [draft, setDraft] = useState(() => readLocalJson(DRAFT_KEY, null));
  const [versions, setVersions] = useState(() => readLocalJson(VERSIONS_KEY, []));
  const [isDraftPreview, setDraftPreview] = useState(false);

  const activeConfig = isDraftPreview && draft ? draft : config;

  // Apply whitelisted CSS variables whenever active config or dark mode changes
  useEffect(() => {
    applyWhitelistedThemeVars(activeConfig.theme);
    const observer = new MutationObserver(() => applyWhitelistedThemeVars(activeConfig.theme));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, [activeConfig]);

  // Cross-tab live sync when Admin publishes changes
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setConfig({ ...DEFAULT_SITE_CONFIG, ...JSON.parse(e.newValue) });
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Background fetch of published config from Supabase RPC (non-blocking, safe fallback)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rawSettings = readLocalJson('elzoghbi_v2_siteSettings', null);
        const sbUrl = rawSettings?.supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '';
        const sbKey = rawSettings?.supabaseKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
        if (!sbUrl || !sbKey) return;
        const res = await fetch(`${sbUrl.replace(/\/+$/, '')}/rest/v1/rpc/get_published_site_config`, {
          method: 'POST',
          headers: {
            apikey: sbKey,
            Authorization: `Bearer ${sbKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ p_page_slug: 'home' }),
        });
        if (!res.ok) return;
        const remote = await res.json();
        if (cancelled || !remote || typeof remote !== 'object') return;
        const merged = {
          ...DEFAULT_SITE_CONFIG,
          ...(remote.theme ? { theme: { ...DEFAULT_SITE_CONFIG.theme, ...remote.theme } } : {}),
          blocks: { ...DEFAULT_SITE_CONFIG.blocks, ...(remote.blocks || {}) },
          sections: Array.isArray(remote.sections) ? remote.sections : [],
          navigation: Array.isArray(remote.navigation) ? remote.navigation : [],
          banners: Array.isArray(remote.banners) ? remote.banners : [],
          seo: remote.seo || null,
          version: Number(remote.theme?.version || Date.now()),
        };
        setConfig(merged);
        try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
      } catch {
        // Silent fallback to defaults/cache
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const saveDraft = useCallback((nextPartial) => {
    setDraft((prev) => {
      const merged = { ...(prev || config), ...nextPartial };
      try { window.localStorage.setItem(DRAFT_KEY, JSON.stringify(merged)); } catch {}
      return merged;
    });
  }, [config]);

  const publishDraft = useCallback((note = 'نشر تحديث من لوحة التحكم') => {
    const toPublish = draft || config;
    const nextVersion = {
      id: `v_${Date.now()}`,
      note: sanitizePlainText(note, 140),
      createdAt: new Date().toISOString(),
      snapshot: config,
    };
    const nextVersions = [nextVersion, ...versions].slice(0, 25);
    setVersions(nextVersions);
    setConfig(toPublish);
    setDraft(null);
    setDraftPreview(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toPublish));
      window.localStorage.setItem(VERSIONS_KEY, JSON.stringify(nextVersions));
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {}
    return { ok: true, warnings: validateThemeContrast(toPublish.theme) };
  }, [draft, config, versions]);

  const rollbackVersion = useCallback((versionId) => {
    const target = versions.find((v) => v.id === versionId);
    if (!target?.snapshot) return false;
    setConfig(target.snapshot);
    setDraft(null);
    setDraftPreview(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(target.snapshot));
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {}
    return true;
  }, [versions]);

  const resetToDefaults = useCallback(() => {
    setConfig(DEFAULT_SITE_CONFIG);
    setDraft(null);
    setDraftPreview(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SITE_CONFIG));
      window.localStorage.removeItem(DRAFT_KEY);
    } catch {}
  }, []);

  const exportConfigJson = useCallback(() => JSON.stringify(activeConfig, null, 2), [activeConfig]);

  const importConfigJson = useCallback((rawJson) => {
    try {
      const parsed = JSON.parse(rawJson);
      if (!parsed || typeof parsed !== 'object') return { ok: false, error: 'ملف JSON غير صالح' };
      saveDraft(parsed);
      return { ok: true, warnings: validateThemeContrast(parsed.theme) };
    } catch {
      return { ok: false, error: 'تعذّر قراءة ملف JSON' };
    }
  }, [saveDraft]);

  const tBlock = useCallback((key, fallbackAr = '', fallbackEn = '') => {
    const isEn = typeof document !== 'undefined' && document.documentElement.dir === 'ltr';
    const entry = activeConfig?.blocks?.[key];
    if (entry) {
      return sanitizePlainText(isEn ? (entry.en || entry.ar || fallbackEn || fallbackAr) : (entry.ar || fallbackAr));
    }
    return isEn ? (fallbackEn || fallbackAr) : fallbackAr;
  }, [activeConfig]);

  const value = useMemo(() => ({
    config: activeConfig,
    draft,
    versions,
    isDraftPreview,
    setDraftPreview,
    saveDraft,
    publishDraft,
    rollbackVersion,
    resetToDefaults,
    exportConfigJson,
    importConfigJson,
    tBlock,
  }), [activeConfig, draft, versions, isDraftPreview, saveDraft, publishDraft, rollbackVersion, resetToDefaults, exportConfigJson, importConfigJson, tBlock]);

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
}

export function useSiteConfig() {
  return useContext(SiteConfigContext);
}

/**
 * Drop-in component to replace hardcoded copy with live Site Control blocks safely.
 */
export function Editable({ id, fallback = '', fallbackEn = '', as: Tag = 'span', className = '' }) {
  const { tBlock } = useSiteConfig();
  return <Tag className={className} data-editable-key={id}>{tBlock(id, fallback, fallbackEn)}</Tag>;
}
