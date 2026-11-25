// Real Supabase Auth session for the admin dashboard (GoTrue password grant).
// The access token (JWT) is verified by Supabase/PostgREST on every request; the
// admin role comes from public.admin_profiles (server side) — never from a header.
const KEY = 'elzoghbi_sb_admin_session';

export const readAdminSession = () => {
  try {
    const s = JSON.parse(window.localStorage.getItem(KEY) || 'null');
    return s && s.access_token && s.refresh_token ? s : null;
  } catch (e) { return null; }
};

export const getAdminJwt = () => {
  const s = readAdminSession();
  return s && Number(s.expires_at) * 1000 > Date.now() + 15000 ? s.access_token : '';
};

const save = (d) => {
  const session = {
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    expires_at: d.expires_at || Math.floor(Date.now() / 1000) + Number(d.expires_in || 3600),
    email: (d.user && d.user.email) || (readAdminSession() || {}).email || ''
  };
  try { window.localStorage.setItem(KEY, JSON.stringify(session)); } catch (e) { /* storage full/blocked */ }
  return session;
};

export async function adminSignIn(sbUrl, sbKey, email, password) {
  const r = await fetch(`${sbUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: sbKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: String(email || '').trim(), password: String(password || '') })
  });
  if (!r.ok) return { ok: false, error: r.status === 400 ? 'الإيميل أو كلمة المرور غير صحيحة' : 'تعذر تسجيل الدخول' };
  return { ok: true, session: save(await r.json()) };
}

export async function refreshAdminSession(sbUrl, sbKey) {
  const s = readAdminSession();
  if (!s) return null;
  try {
    const r = await fetch(`${sbUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: sbKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    });
    if (!r.ok) { if (r.status === 400 || r.status === 401) adminSignOut(); return null; }
    return save(await r.json());
  } catch (e) { return null; }
}

export async function ensureFreshAdminJwt(sbUrl, sbKey) {
  const s = readAdminSession();
  if (!s) return '';
  if (Number(s.expires_at) * 1000 > Date.now() + 60000) return s.access_token;
  const n = await refreshAdminSession(sbUrl, sbKey);
  return n ? n.access_token : '';
}

// Role/permissions come from the database (RPC runs with the JWT) — null when not an active admin.
export async function fetchMyAdminProfile(sbUrl, sbKey) {
  const jwt = await ensureFreshAdminJwt(sbUrl, sbKey);
  if (!jwt) return null;
  try {
    const r = await fetch(`${sbUrl}/rest/v1/rpc/my_admin_profile`, {
      method: 'POST',
      headers: { apikey: sbKey, Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
      body: '{}'
    });
    if (!r.ok) return null;
    const j = await r.json();
    return j && j.role ? j : null;
  } catch (e) { return null; }
}

export const adminSignOut = () => { try { window.localStorage.removeItem(KEY); } catch (e) { /* ignore */ } };
