// Client wrapper for /api/store-reviews-live with session caching

const SESSION_CACHE = new Map();

function buildHeaders(apiKey) {
  const h = { Accept: 'application/json' };
  if (apiKey && String(apiKey).trim()) {
    h['x-google-places-key'] = String(apiKey).trim();
  }
  return h;
}

export async function checkLiveStoreReviewsStatus(apiKey = '') {
  try {
    const res = await fetch('/api/store-reviews-live?action=status', { headers: buildHeaders(apiKey) });
    if (!res.ok) return { ok: false, googlePlacesConnected: false };
    return await res.json();
  } catch {
    return { ok: false, googlePlacesConnected: false };
  }
}

export async function searchLiveExternalStores({ q = '', gov = 'الكل', apiKey = '' } = {}) {
  const key = `search:${q.trim().toLowerCase()}:${gov}:${apiKey ? '1' : '0'}`;
  if (SESSION_CACHE.has(key)) return SESSION_CACHE.get(key);
  try {
    const params = new URLSearchParams({ action: 'search', q: q.trim(), gov });
    const res = await fetch(`/api/store-reviews-live?${params.toString()}`, { headers: buildHeaders(apiKey) });
    if (!res.ok) return { ok: false, stores: [], googlePlacesConnected: false };
    const data = await res.json();
    if (data && data.ok) SESSION_CACHE.set(key, data);
    return data;
  } catch {
    return { ok: false, stores: [], googlePlacesConnected: false };
  }
}

export async function fetchLiveStoreDetails({ placeId = '', domain = '', name = '', gov = '', apiKey = '' } = {}) {
  const key = `details:${placeId}:${domain}:${name.trim().toLowerCase()}:${apiKey ? '1' : '0'}`;
  if (SESSION_CACHE.has(key)) return SESSION_CACHE.get(key);
  try {
    const params = new URLSearchParams({
      action: 'details',
      ...(placeId ? { placeId } : {}),
      ...(domain ? { domain } : {}),
      ...(name ? { name } : {}),
      ...(gov ? { gov } : {})
    });
    const res = await fetch(`/api/store-reviews-live?${params.toString()}`, { headers: buildHeaders(apiKey) });
    if (!res.ok) return { ok: false, externalReviews: [] };
    const data = await res.json();
    if (data && data.ok) SESSION_CACHE.set(key, data);
    return data;
  } catch {
    return { ok: false, externalReviews: [] };
  }
}

export async function runLiveScamCheck(q) {
  const clean = String(q || '').trim();
  if (clean.length < 3) return { ok: false, riskLevel: 'unknown' };
  const key = `scam:${clean.toLowerCase()}`;
  if (SESSION_CACHE.has(key)) return SESSION_CACHE.get(key);
  try {
    const res = await fetch(`/api/store-reviews-live?action=scam_check&q=${encodeURIComponent(clean)}`);
    if (!res.ok) return { ok: false, riskLevel: 'unknown' };
    const data = await res.json();
    if (data && data.ok) SESSION_CACHE.set(key, data);
    return data;
  } catch {
    return { ok: false, riskLevel: 'unknown' };
  }
}
