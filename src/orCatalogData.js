// Lazy-loaded external OR Catalog data (moved out of main JS bundle to public/data/or-catalog.json)
// Keeps live-binding exports compatible with all existing imports while saving ~1.25 MB from initial bundle.

export let OR_IMPORTED_BRANDS = [];
export let OR_IMPORTED_MODELS = [];
export let OR_IMPORTED_PARTS = [];
export let OR_BRAND_IMAGES = {};

let _loadPromise = null;
let _loaded = false;

export async function loadOrCatalogData() {
  if (_loaded) {
    return { OR_IMPORTED_BRANDS, OR_IMPORTED_MODELS, OR_IMPORTED_PARTS, OR_BRAND_IMAGES };
  }
  if (_loadPromise) return _loadPromise;
  _loadPromise = (async () => {
    try {
      if (typeof fetch !== 'function') return { OR_IMPORTED_BRANDS, OR_IMPORTED_MODELS, OR_IMPORTED_PARTS, OR_BRAND_IMAGES };
      const res = await fetch('/data/or-catalog.json', { cache: 'force-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (Array.isArray(data.OR_IMPORTED_BRANDS)) OR_IMPORTED_BRANDS = data.OR_IMPORTED_BRANDS;
      if (Array.isArray(data.OR_IMPORTED_MODELS)) OR_IMPORTED_MODELS = data.OR_IMPORTED_MODELS;
      if (Array.isArray(data.OR_IMPORTED_PARTS)) OR_IMPORTED_PARTS = data.OR_IMPORTED_PARTS;
      if (data.OR_BRAND_IMAGES && typeof data.OR_BRAND_IMAGES === 'object') OR_BRAND_IMAGES = data.OR_BRAND_IMAGES;
      _loaded = true;
    } catch (err) {
      console.warn('[orCatalogData] Lazy fetch failed, continuing with empty fallback:', err?.message || err);
    } finally {
      _loadPromise = null;
    }
    return { OR_IMPORTED_BRANDS, OR_IMPORTED_MODELS, OR_IMPORTED_PARTS, OR_BRAND_IMAGES };
  })();
  return _loadPromise;
}
