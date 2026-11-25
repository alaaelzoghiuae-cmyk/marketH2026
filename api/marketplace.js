// =============================================================================
// /api/marketplace — بيع عندنا (server side)
// Vercel serverless function:  export default async function handler(req, res)
//
// Env (Vercel → Settings → Environment Variables):
//   SUPABASE_URL                 (أو VITE_SUPABASE_URL)
//   SUPABASE_ANON_KEY            (أو VITE_SUPABASE_ANON_KEY)  — لتحقق تسجيل دخول العميل/المدير
//   SUPABASE_SERVICE_ROLE_KEY    — سرّي، على السيرفر فقط. يُستخدم لرفع الصور وتنفيذ دوال mp_*
//   MARKETPLACE_TOKEN_SECRET     — (اختياري) سر توقيع جلسة البائع؛ الافتراضي مشتق من service key
//
// الأفعال:
//   Public/Seller: auth · submit · mine · update · report (POST) | contact (GET)
//   Admin (JWT or verified Owner/RBAC): admin_list · admin_history · admin_review · admin_handle_report (POST)
// =============================================================================
import crypto from 'node:crypto';
import {
  validateListingPayload, inspectImage, decodeDataUrl, buildWhatsAppUrl, REPORT_REASONS
} from './_lib/marketplaceValidate.js';

const SB_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://pomuumsgsujcgvamaxmr.supabase.co').replace(/\/$/, '');
const ANON = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Y4XbNsaCNXR9_VUctCpimg_P2C7Cu_Q';
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SECRET = process.env.MARKETPLACE_TOKEN_SECRET || (SERVICE ? crypto.createHash('sha256').update('mp:' + SERVICE).digest('hex') : '');
const TERMS_VERSION = 'mp-2026-11-draft-1';

// ---- tiny in-memory rate limiter (per instance; DB enforces the hard limits) ----
const hits = new Map();
function allow(key, max, windowMs) {
  const now = Date.now();
  const b = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (b.length >= max) return false;
  b.push(now); hits.set(key, b);
  if (hits.size > 8000) hits.clear();
  return true;
}
const ipOf = (req) => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim() || 'unknown';
const ipHash = (req) => crypto.createHash('sha256').update(ipOf(req) + '|' + (SECRET || 'salt')).digest('hex').slice(0, 32);

function sameOrigin(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase();
  const src = String(req.headers.origin || req.headers.referer || '');
  if (!src) return true; // server-to-server / same-origin GET without Origin
  try { return new URL(src).host.toLowerCase() === host; } catch { return false; }
}

// ---- stateless seller session token (HMAC) ----
function signToken(cid) {
  const body = Buffer.from(JSON.stringify({ cid, exp: Date.now() + 12 * 3600 * 1000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}
function verifyToken(tok) {
  try {
    const [body, sig] = String(tok || '').split('.');
    if (!body || !sig || !SECRET) return null;
    const exp = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
    if (exp.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(exp), Buffer.from(sig))) return null;
    const j = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return j && j.exp > Date.now() && j.cid ? String(j.cid) : null;
  } catch { return null; }
}

async function rest(path, { method = 'GET', body, key = SERVICE, authToken = null, headers = {} } = {}) {
  const r = await fetch(`${SB_URL}${path}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${authToken || key}`,
      'Content-Type': 'application/json',
      ...headers
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const txt = await r.text();
  let json = null; try { json = txt ? JSON.parse(txt) : null; } catch { /* keep text */ }
  return { ok: r.ok, status: r.status, json, text: txt };
}
const rpc = (name, args) => rest(`/rest/v1/rpc/${name}`, { method: 'POST', body: args });

// ---- Server-side Admin Verification (Supabase Auth JWT OR verified Owner/RBAC RPC) ----
async function verifyAdminRequest(req, body) {
  const authHeader = String(req.headers.authorization || '');
  if (authHeader.startsWith('Bearer ')) {
    const jwt = authHeader.slice(7).trim();
    if (jwt) {
      const prof = await rest('/rest/v1/rpc/my_admin_profile', { method: 'POST', key: ANON, authToken: jwt, body: {} });
      if (prof.ok && prof.json && prof.json.role) {
        return { ok: true, mode: 'jwt', jwt, actor: prof.json.display_name || prof.json.role, role: prof.json.role };
      }
    }
  }
  const creds = body && body.adminAuth && typeof body.adminAuth === 'object' ? body.adminAuth : null;
  const u = String(creds?.username || '').trim().toLowerCase();
  const p = String(creds?.password || '');
  if (!u || !p) return { ok: false };

  // 1) Owner login via server-side verify_admin_login RPC
  const ownerRes = await rest('/rest/v1/rpc/verify_admin_login', {
    method: 'POST',
    key: ANON,
    body: { p_username: u, p_password: p }
  });
  if (ownerRes.ok && ownerRes.json === true) {
    return { ok: true, mode: 'owner', actor: u, role: 'owner' };
  }

  // 2) Staff RBAC login via server-side admin_user_login RPC (must have marketplace permission)
  const staffRes = await rest('/rest/v1/rpc/admin_user_login', {
    method: 'POST',
    key: ANON,
    body: { p_username: u, p_password: p }
  });
  if (staffRes.ok && staffRes.json && staffRes.json.ok) {
    const perms = Array.isArray(staffRes.json.permissions) ? staffRes.json.permissions : [];
    if (perms.includes('*') || perms.includes('marketplace')) {
      return { ok: true, mode: 'staff', actor: staffRes.json.display_name || staffRes.json.username, role: staffRes.json.role_label || 'staff' };
    }
  }
  return { ok: false };
}

const ERR_MAP = {
  rate_limited: [429, 'وصلت للحد الأقصى المسموح حاليًا — حاول لاحقًا'],
  too_many_pending: [429, 'عندك 3 إعلانات قيد المراجعة بالفعل — انتظر مراجعتها'],
  duplicate_listing: [409, 'الإعلان ده متكرر — عندك إعلان مطابق بالفعل'],
  terms_required: [400, 'لازم توافق على كل البنود الـ 12 قبل النشر'],
  image_required: [400, 'الصورة مطلوبة'],
  unauthorized: [401, 'بيانات الحساب غير صحيحة'],
  not_found: [404, 'الإعلان غير موجود'],
  invalid_transition: [409, 'الإجراء ده غير متاح لحالة الإعلان الحالية'],
  unknown_action: [400, 'إجراء غير معروف']
};
function mapDbError(resp) {
  const msg = String(resp.json?.message || resp.text || '');
  for (const k of Object.keys(ERR_MAP)) if (msg.includes(k)) return ERR_MAP[k];
  if (/check constraint|violates/i.test(msg)) return [400, 'بيانات الإعلان غير صالحة — راجع الحقول'];
  return [500, 'تعذر تنفيذ العملية الآن'];
}

async function clientFromCredentials(phone, password) {
  const r = await rest('/rest/v1/rpc/client_login', { method: 'POST', key: ANON, body: { p_phone: String(phone || ''), p_password: String(password || '') } });
  if (!r.ok || !r.json || !r.json.id) return null;
  return { id: String(r.json.id), name: r.json.name || '' };
}

async function uploadImage(clientId, dataUrl) {
  const buf = decodeDataUrl(dataUrl);
  if (!buf) return { error: 'صيغة الصورة غير صالحة' };
  const info = inspectImage(buf);
  if (!info.ok) return { error: info.error };
  const path = `${clientId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40)}/${crypto.randomUUID()}.${info.ext}`;
  const r = await fetch(`${SB_URL}/storage/v1/object/marketplace/${path}`, {
    method: 'POST',
    headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'Content-Type': info.type, 'Cache-Control': '31536000', 'x-upsert': 'false' },
    body: buf
  });
  if (!r.ok) return { error: 'تعذر رفع الصورة — تأكد من وجود bucket باسم marketplace' };
  return { path, url: `${SB_URL}/storage/v1/object/public/marketplace/${path}` };
}
const removeImage = (path) => path && fetch(`${SB_URL}/storage/v1/object/marketplace/${path}`, { method: 'DELETE', headers: { apikey: SERVICE, Authorization: `Bearer ${SERVICE}` } }).catch(() => {});

const MINE_COLS = 'id,public_id,title,brand,model,storage,condition,battery_health,screen_condition,body_condition,has_repairs,defects,description,price,city,area,contact_phone,show_contact,image_url,status,hidden_by,is_featured,reject_reason,published_at,expires_at,sold_at,created_at,updated_at';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const send = (code, obj) => res.status(code).json(obj);
  try {
    const action = String((req.query && req.query.action) || (req.body && req.body.action) || '');
    const ip = ipOf(req);

    // ---------------- GET contact → WhatsApp URL (phone never sent raw) ----------------
    if (req.method === 'GET' && action === 'contact') {
      if (!SERVICE) return send(503, { ok: false, error: 'الخدمة غير مهيأة على السيرفر' });
      if (!allow('c:' + ip, 30, 60_000)) return send(429, { ok: false, error: 'محاولات كثيرة' });
      const id = Number(req.query.id);
      if (!Number.isInteger(id) || id <= 0) return send(400, { ok: false, error: 'رقم إعلان غير صالح' });
      const r = await rpc('mp_get_contact', { p_public_id: id });
      const c = r.ok ? r.json : null;
      if (!c || !c.phone) return send(404, { ok: false, error: 'التواصل غير متاح لهذا الإعلان' });
      const url = buildWhatsAppUrl({ phone: c.phone, title: c.title, publicId: c.public_id, price: c.price });
      if (!url) return send(422, { ok: false, error: 'رقم التواصل غير صالح' });
      return send(200, { ok: true, url });
    }

    if (req.method !== 'POST') return send(405, { ok: false, error: 'Method not allowed' });
    if (!sameOrigin(req)) return send(403, { ok: false, error: 'Forbidden origin' });
    if (!SERVICE || !SECRET) return send(503, { ok: false, error: 'الخدمة غير مهيأة: ضبط SUPABASE_SERVICE_ROLE_KEY مطلوب على السيرفر' });
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    // =========================================================================
    // ADMIN ACTIONS (Verified via Supabase Auth JWT OR Owner/RBAC Server RPC)
    // Solves the blocker where Owner/RBAC login could not moderate ads!
    // =========================================================================
    if (action.startsWith('admin_')) {
      if (!allow('adm:' + ip, 120, 60_000)) return send(429, { ok: false, error: 'طلبات كثيرة — انتظر لحظة' });
      const admin = await verifyAdminRequest(req, body);
      if (!admin.ok) return send(401, { ok: false, error: 'غير مصرح — تحقق من تسجيل دخول الإدارة', needAdminAuth: true });

      if (action === 'admin_list') {
        await rpc('mp_expire_stale', {});
        const [a, b] = await Promise.all([
          rest('/rest/v1/marketplace_listings?select=*&deleted_at=is.null&order=created_at.desc&limit=500'),
          rest('/rest/v1/marketplace_reports?select=*,marketplace_listings(title,public_id,status)&order=created_at.desc&limit=200')
        ]);
        if (!a.ok) return send(a.status === 404 ? 404 : 500, { ok: false, error: a.status === 404 ? 'جداول بيع عندنا غير موجودة — شغّل sql/08_marketplace.sql' : 'تعذر جلب الإعلانات' });
        return send(200, { ok: true, listings: a.json || [], reports: b.ok ? (b.json || []) : [], actor: admin.actor });
      }

      if (action === 'admin_history') {
        const lid = String(body.listingId || '').trim();
        if (!lid) return send(400, { ok: false, error: 'معرّف الإعلان مطلوب' });
        const h = await rest(`/rest/v1/marketplace_listing_status_history?listing_id=eq.${encodeURIComponent(lid)}&order=created_at.desc&limit=100`);
        return send(200, { ok: true, history: h.ok ? (h.json || []) : [] });
      }

      if (action === 'admin_review') {
        const lid = String(body.listingId || '').trim();
        const op = String(body.op || '').trim();
        const reason = body.reason ? String(body.reason).slice(0, 500) : null;
        const patch = body.patch && typeof body.patch === 'object' ? body.patch : null;
        if (!lid || !op) return send(400, { ok: false, error: 'بيانات الإجراء ناقصة' });

        // If authenticated with a real Supabase JWT, delegate directly to mp_admin_review RPC
        if (admin.mode === 'jwt' && admin.jwt) {
          const r = await rest('/rest/v1/rpc/mp_admin_review', {
            method: 'POST',
            key: ANON,
            authToken: admin.jwt,
            body: { p_listing_id: lid, p_action: op, p_reason: reason, p_patch: patch }
          });
          if (!r.ok) { const [c, m] = mapDbError(r); return send(c, { ok: false, error: m }); }
          return send(200, { ok: true });
        }

        // Verified Owner/RBAC server-side audited execution via SERVICE role
        const nowIso = new Date().toISOString();
        const expIso = new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString();
        const updates = { reviewed_at: nowIso, updated_at: nowIso };
        let histAction = op;

        if (op === 'approve') {
          updates.status = 'published'; updates.published_at = nowIso; updates.expires_at = expIso; updates.reject_reason = null; updates.hidden_by = null;
        } else if (op === 'approve_hold') {
          updates.status = 'approved'; updates.reject_reason = null; histAction = 'approve';
        } else if (op === 'publish') {
          updates.status = 'published'; updates.published_at = nowIso; updates.expires_at = expIso; updates.hidden_by = null;
        } else if (op === 'reject') {
          if (!reason) return send(400, { ok: false, error: 'سبب الرفض مطلوب' });
          updates.status = 'rejected'; updates.reject_reason = reason;
        } else if (op === 'hide') {
          updates.status = 'hidden'; updates.hidden_by = 'admin'; histAction = 'admin_hide';
        } else if (op === 'unhide') {
          updates.status = 'published'; updates.hidden_by = null; histAction = 'admin_unhide';
        } else if (op === 'feature') {
          updates.is_featured = true;
        } else if (op === 'unfeature') {
          updates.is_featured = false;
        } else if (op === 'mark_sold') {
          updates.status = 'sold'; updates.sold_at = nowIso; histAction = 'admin_mark_sold';
        } else if (op === 'delete') {
          if (!reason) return send(400, { ok: false, error: 'سبب الحذف مطلوب' });
          updates.deleted_at = nowIso; updates.status = 'hidden'; updates.reject_reason = reason; histAction = 'admin_delete';
        } else if (op === 'edit' && patch) {
          if (patch.title !== undefined) updates.title = String(patch.title).trim().slice(0, 140);
          if (patch.price !== undefined && Number(patch.price) > 0) updates.price = Number(patch.price);
          if (patch.city !== undefined) updates.city = String(patch.city).trim().slice(0, 80);
          if (patch.area !== undefined) updates.area = String(patch.area).trim().slice(0, 120);
          if (patch.description !== undefined) updates.description = String(patch.description).slice(0, 2000);
          if (patch.defects !== undefined) updates.defects = String(patch.defects).slice(0, 1000);
          if (patch.admin_note !== undefined) updates.admin_note = String(patch.admin_note).slice(0, 1000);
          histAction = 'admin_edit';
        } else {
          return send(400, { ok: false, error: 'إجراء غير معروف' });
        }

        const uRes = await rest(`/rest/v1/marketplace_listings?id=eq.${encodeURIComponent(lid)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: updates
        });
        if (!uRes.ok) { const [c, m] = mapDbError(uRes); return send(c, { ok: false, error: m }); }

        await rest('/rest/v1/marketplace_listing_status_history', {
          method: 'POST',
          body: {
            listing_id: lid,
            action: histAction,
            actor_type: 'admin',
            reason: reason || `بواسطة ${admin.actor}`
          }
        }).catch(() => {});

        return send(200, { ok: true });
      }

      if (action === 'admin_handle_report') {
        const rid = String(body.reportId || '').trim();
        const st = body.status === 'dismissed' ? 'dismissed' : 'resolved';
        const hideListing = !!body.hideListing;
        if (!rid) return send(400, { ok: false, error: 'معرّف البلاغ مطلوب' });

        if (admin.mode === 'jwt' && admin.jwt) {
          const r = await rest('/rest/v1/rpc/mp_admin_handle_report', {
            method: 'POST',
            key: ANON,
            authToken: admin.jwt,
            body: { p_report_id: rid, p_status: st, p_hide_listing: hideListing }
          });
          if (!r.ok) return send(500, { ok: false, error: 'تعذر تحديث البلاغ' });
          return send(200, { ok: true });
        }

        const repRes = await rest(`/rest/v1/marketplace_reports?id=eq.${encodeURIComponent(rid)}`, {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: { status: st, resolved_at: new Date().toISOString() }
        });
        if (!repRes.ok) return send(500, { ok: false, error: 'تعذر تحديث البلاغ' });
        const repRow = Array.isArray(repRes.json) ? repRes.json[0] : repRes.json;
        if (hideListing && repRow && repRow.listing_id) {
          await rest(`/rest/v1/marketplace_listings?id=eq.${encodeURIComponent(repRow.listing_id)}`, {
            method: 'PATCH',
            body: { status: 'hidden', hidden_by: 'admin', updated_at: new Date().toISOString() }
          });
          await rest('/rest/v1/marketplace_listing_status_history', {
            method: 'POST',
            body: { listing_id: repRow.listing_id, action: 'admin_hide', actor_type: 'admin', reason: `إخفاء بسبب بلاغ (${admin.actor})` }
          }).catch(() => {});
        }
        return send(200, { ok: true });
      }

      return send(400, { ok: false, error: 'إجراء إداري غير معروف' });
    }

    // ---------------- auth: credentials → short-lived token ----------------
    if (action === 'auth') {
      if (!allow('a:' + ip, 10, 10 * 60_000)) return send(429, { ok: false, error: 'محاولات دخول كثيرة — حاول بعد قليل' });
      const c = await clientFromCredentials(body.phone, body.password);
      if (!c) return send(401, { ok: false, error: 'رقم الموبايل أو كلمة المرور غير صحيحة' });
      return send(200, { ok: true, token: signToken(c.id), name: c.name });
    }

    // ---------------- report (anonymous allowed, rate limited) ----------------
    if (action === 'report') {
      if (!allow('r:' + ip, 6, 60 * 60_000)) return send(429, { ok: false, error: 'عدد البلاغات كبير — حاول لاحقًا' });
      const kind = body.kind === 'seller' ? 'seller' : 'listing';
      const reason = REPORT_REASONS.includes(body.reason) ? body.reason : null;
      const id = Number(body.id);
      if (!reason || !Number.isInteger(id) || id <= 0) return send(400, { ok: false, error: 'بيانات البلاغ غير مكتملة' });
      const details = String(body.details || '').replace(/[\u0000-\u001f<>]/g, ' ').slice(0, 600);
      const cid = verifyToken(body.token) || null;
      const r = await rpc('mp_report', { p_public_id: id, p_kind: kind, p_reason: reason, p_details: details, p_client_id: cid, p_ip_hash: ipHash(req) });
      if (!r.ok) { const [c, m] = mapDbError(r); return send(c, { ok: false, error: m }); }
      return send(200, { ok: true });
    }

    // ---------------- everything below needs a seller token ----------------
    const cid = verifyToken(body.token);
    if (!cid) return send(401, { ok: false, error: 'سجّل دخولك لتأكيد هويتك أولًا', needAuth: true });

    if (action === 'mine') {
      await rpc('mp_expire_stale', {});
      const r = await rest(`/rest/v1/marketplace_listings?seller_client_id=eq.${encodeURIComponent(cid)}&deleted_at=is.null&select=${MINE_COLS}&order=created_at.desc&limit=100`);
      return send(r.ok ? 200 : 500, r.ok ? { ok: true, listings: r.json } : { ok: false, error: 'تعذر جلب إعلاناتك' });
    }

    if (action === 'submit') {
      if (!allow('s:' + cid, 6, 60 * 60_000)) return send(429, { ok: false, error: 'محاولات نشر كثيرة — حاول لاحقًا' });
      const v = validateListingPayload(body.payload || {});
      if (!v.ok) return send(400, { ok: false, error: v.errors[0], errors: v.errors });
      if (!body.image) return send(400, { ok: false, error: 'صورة الجهاز مطلوبة' });
      const up = await uploadImage(cid, body.image);
      if (up.error) return send(400, { ok: false, error: up.error });
      const terms = { version: TERMS_VERSION, marketplace_version: TERMS_VERSION, clauses: Array.isArray(body.clauses) ? body.clauses.map((x) => x === true) : [] };
      const r = await rpc('mp_create_listing', {
        p_client_id: cid, p_payload: v.value, p_image_path: up.path, p_image_url: up.url, p_terms: terms,
        p_ip_hash: ipHash(req), p_ua: String(req.headers['user-agent'] || '')
      });
      if (!r.ok) { removeImage(up.path); const [c, m] = mapDbError(r); return send(c, { ok: false, error: m }); }
      return send(200, { ok: true, listing: r.json });
    }

    if (action === 'update') {
      const op = String(body.op || '');
      if (!['edit', 'mark_sold', 'request_hide', 'reactivate'].includes(op)) return send(400, { ok: false, error: 'إجراء غير معروف' });
      if (!allow('u:' + cid, 30, 60 * 60_000)) return send(429, { ok: false, error: 'محاولات كثيرة' });
      let patch = {}; let img = { path: null, url: null };
      if (op === 'edit') {
        const v = validateListingPayload(body.patch || {}, { partial: true });
        if (!v.ok) return send(400, { ok: false, error: v.errors[0], errors: v.errors });
        patch = v.value;
        if (body.image) {
          const up = await uploadImage(cid, body.image);
          if (up.error) return send(400, { ok: false, error: up.error });
          img = up;
        }
      }
      const r = await rpc('mp_seller_update', { p_client_id: cid, p_listing_id: String(body.listingId || ''), p_action: op, p_patch: patch, p_image_path: img.path, p_image_url: img.url });
      if (!r.ok) { removeImage(img.path); const [c, m] = mapDbError(r); return send(c, { ok: false, error: m }); }
      return send(200, { ok: true, result: r.json });
    }

    return send(400, { ok: false, error: 'إجراء غير معروف' });
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'خطأ داخلي في السيرفر' });
  }
}
