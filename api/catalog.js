// ============================================================================
// ELZOGHBI — GET /api/catalog
// Public catalog endpoint: returns storefront-visible products only, with the
// admin's hide rules (hidden brands / models / categories / parts, VIP-only
// items, zero-price items) applied ON THE SERVER, paginated, and cached at
// the edge for 300s (s-maxage) so repeated visitor loads do not hit Supabase.
//
// Query: ?limit=60 (1..200, default 60) &offset=0
// Response: { ok, items: [rows in PostgREST shape], scanned, nextOffset }
// `nextOffset` is the offset to pass for the following page (it accounts for
// hidden rows skipped while scanning).
// ============================================================================

const SB_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://pomuumsgsujcgvamaxmr.supabase.co').replace(/\/$/, '');
const ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Y4XbNsaCNXR9_VUctCpimg_P2C7Cu_Q';

const PART_COLUMNS = 'id,sku,model_id,category,name,quality_grade,colors,image,stock,low_stock_threshold,max_order_qty,base_price,custom_group_prices,waitlist_count,sold_out,created_at,data';
const MAX_SCAN = 1000;

async function sbGet(path) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, Accept: 'application/json' }
  });
  if (!r.ok) throw new Error(`supabase ${r.status}`);
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'GET only' });
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');

  const limit = Math.max(1, Math.min(200, parseInt(req.query?.limit || '60', 10) || 60));
  const offset = Math.max(0, parseInt(req.query?.offset || '0', 10) || 0);

  try {
    const [settingsRows, models] = await Promise.all([
      sbGet('site_settings?select=settings&id=eq.main&limit=1'),
      sbGet('mobile_models?select=id,brand&limit=2000')
    ]);
    let settings = (settingsRows && settingsRows[0] && settingsRows[0].settings) || {};
    if (typeof settings === 'string') { try { settings = JSON.parse(settings); } catch (e) { settings = {}; } }
    const hiddenBrands = new Set(settings.hiddenBrands || []);
    const hiddenModels = new Set(settings.hiddenModelIds || []);
    const hiddenCategories = new Set(settings.hiddenCategories || []);
    const hiddenParts = new Set(settings.hiddenPartIds || []);
    const brandByModel = new Map((models || []).map(m => [String(m.id), m.brand]));

    const items = [];
    let scanned = 0;
    let cursor = offset;
    while (items.length < limit && scanned < MAX_SCAN) {
      const batchSize = Math.min(200, MAX_SCAN - scanned);
      const rows = await sbGet(`spare_parts?select=${PART_COLUMNS}&order=created_at.desc&limit=${batchSize}&offset=${cursor}`);
      if (!Array.isArray(rows) || rows.length === 0) break;
      cursor += rows.length;
      scanned += rows.length;
      for (const row of rows) {
        if (items.length >= limit) break;
        const d = (row && typeof row.data === 'object' && row.data) || {};
        if (hiddenParts.has(String(row.id))) continue;
        if (row.model_id && hiddenModels.has(String(row.model_id))) continue;
        const brand = brandByModel.get(String(row.model_id || ''));
        if (brand && hiddenBrands.has(brand)) continue;
        if (row.category && hiddenCategories.has(row.category)) continue;
        if (!(Number(row.base_price) > 0)) continue;
        if (d.vipOnly || d.vip_only || d.hidden) continue;
        items.push(row);
      }
      if (rows.length < batchSize) break;
    }

    return res.status(200).json({ ok: true, items, scanned, nextOffset: offset + scanned });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'catalog upstream error' });
  }
}
