// =============================================================================
// /api/notify — server-side Telegram push (keeps the bot token OFF the client).
//
// Why: the old flow stored `telegramBotToken` inside `site_settings`, which every
// storefront visitor downloads with the public Supabase key — anyone could read the
// token and hijack the bot. Configure these env vars in Vercel instead:
//   TELEGRAM_BOT_TOKEN   (from @BotFather)
//   TELEGRAM_CHAT_ID     (your chat / admin group id)
// and then clear the token field in the dashboard.
// =============================================================================

const WINDOW_MS = 60_000;
const MAX_REQ = 20;
const hits = new Map();

function allow(ip) {
  const now = Date.now();
  const bucket = (hits.get(ip) || []).filter(t => now - t < WINDOW_MS);
  if (bucket.length >= MAX_REQ) return false;
  bucket.push(now);
  hits.set(ip, bucket);
  if (hits.size > 5000) hits.clear();
  return true;
}

function sameOrigin(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  const src = String(req.headers.origin || req.headers.referer || '');
  if (!host || !src) return false;
  try { return new URL(src).host.toLowerCase() === host; } catch { return false; }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'POST only' });
  if (!sameOrigin(req)) return res.status(403).json({ ok: false, error: 'forbidden origin' });

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (!allow(ip)) return res.status(429).json({ ok: false, error: 'rate limited' });

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return res.status(200).json({ ok: true, sent: false, reason: 'not_configured' });

  let payload = req.body;
  if (typeof payload === 'string') { try { payload = JSON.parse(payload); } catch { payload = {}; } }
  const title = String(payload?.title || '').slice(0, 200);
  const body = String(payload?.body || '').slice(0, 1500);
  const link = String(payload?.link || '').slice(0, 300);
  if (!title && !body) return res.status(400).json({ ok: false, error: 'empty message' });

  const text = `${title}\n━━━━━━━━━━━━━━\n${body}${link ? `\n\n🔗 ${link}` : ''}`;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true })
    });
    return res.status(200).json({ ok: true, sent: r.ok });
  } catch {
    return res.status(200).json({ ok: true, sent: false });
  }
}
