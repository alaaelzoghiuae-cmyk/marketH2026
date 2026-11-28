/**
 * Centralized CORS allowlist for ELZOGHBI Market Vercel Serverless APIs.
 * Allows:
 *  - https://elzoghbi.market-h.com (and www)
 *  - *.vercel.app preview & production deployments
 *  - localhost / 127.0.0.1 for local development
 *  - Any extra origins configured in ALLOWED_ORIGINS env var (comma-separated)
 */

const STATIC_ALLOWED = new Set([
  'https://elzoghbi.market-h.com',
  'https://www.elzoghbi.market-h.com',
]);

export function resolveAllowedOrigin(origin) {
  if (!origin || typeof origin !== 'string') return 'https://elzoghbi.market-h.com';
  const clean = origin.trim().replace(/\/+$/, '');
  if (STATIC_ALLOWED.has(clean)) return clean;

  // Extra env-configured origins if needed
  const extra = String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  if (extra.includes(clean)) return clean;

  try {
    const u = new URL(clean);
    const host = u.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1') return clean;
    if (u.protocol === 'https:' && (host === 'elzoghbi.market-h.com' || host.endsWith('.elzoghbi.market-h.com') || host.endsWith('.vercel.app'))) {
      return clean;
    }
  } catch {
    // ignore malformed origin
  }
  return 'https://elzoghbi.market-h.com';
}

export function applyCors(req, res, methods = 'GET, POST, OPTIONS', headers = 'Content-Type') {
  const origin = req?.headers?.origin || '';
  const allowed = resolveAllowedOrigin(origin);
  res.setHeader('Access-Control-Allow-Origin', allowed);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', headers);
}
