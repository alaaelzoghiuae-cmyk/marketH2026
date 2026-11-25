// Cache versions: one tiny RPC (get_cache_versions) tells us which public tables changed since we cached them.
// Unchanged tables keep their 24h localStorage cache → repeat visits download (almost) nothing.
let _p = null;
export function ensureCacheVersions(sbUrl, sbKey) {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (_p) return _p;
  _p = (async () => {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 2500);
      const r = await fetch(`${sbUrl}/rest/v1/rpc/get_cache_versions`, { method: 'POST', signal: ctl.signal, headers: { apikey: sbKey, Authorization: `Bearer ${sbKey}`, 'Content-Type': 'application/json' }, body: '{}' });
      clearTimeout(t);
      if (r.ok) { const j = await r.json(); if (j && typeof j === 'object') window.__elzCacheVers = j; }
    } catch (e) { /* offline / RPC not installed yet → TTL-only caching */ }
    setTimeout(() => { _p = null; }, 5 * 60 * 1000); // re-check at most every 5 minutes
    return window.__elzCacheVers || null;
  })();
  return _p;
}
