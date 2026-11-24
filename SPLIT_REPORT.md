
---

## Addendum — 2026-11-23: three fixes from the owner's local test

1. **Login / register modal too small on desktop** — the panel was capped at `max-w-md` (448px). Now `max-w-md sm:max-w-2xl lg:max-w-3xl` with `sm:max-h-[88vh]`. Verified in a headless browser at 1400px viewport: panel width 768px (was 448px).
2. **Checkout proportions reversed** — the invoice summary was the narrow column (1 of 3) while the checkout steps took 2 of 3. Grid is now `lg:grid-cols-5` with the steps at `lg:col-span-2` and the summary at `lg:col-span-3`; page container widened to `max-w-7xl`. Verified: summary column 739px vs steps 485px at 1400px viewport.
3. **Ticker / banner edits from the dashboard did not stick (root cause found)** — the announcements text fields saved the ENTIRE settings object to Supabase on EVERY keystroke (`saveSiteSettingsImmediate` inside `onChange`). Dozens of concurrent upserts to the same `site_settings` row raced, and an early/empty snapshot could land last — the server ended with `tickerEnabled=true` but `tickerText=''` (confirmed live), so the ticker/banner vanished for customers. Fix: the network post inside `saveSiteSettingsImmediate` is now coalesced — local state, localStorage and cross-tab broadcast still update instantly, but the server receives only the LATEST snapshot, 900ms after the burst settles. Verified against a local Supabase stub holding the real server fixtures: typing 22 characters produced 2 POSTs (one per pause-separated burst), the stub's stored row holds the full final text, and a fresh storefront load renders the ticker with that text.

Note: the live server's ticker/banner texts are currently EMPTY (a casualty of the race), so the texts must be typed once more in the dashboard on the fixed build — they will persist now.

---

## Addendum 2 — 2026-11-23: employee dashboard accounts with per-user permissions (RBAC)

Requested by the owner: create dashboard users for employees, with the access of each one defined by him.

**Server side — `sql/04_admin_users_rbac.sql` (owner runs it in Supabase, like the previous steps):**
- New table `public.admin_users` (username, display name, role label, permissions jsonb = list of dashboard tab ids, is_active, last_login_at). Passwords are stored as salted SHA-256 hashes — never readable, only resettable.
- The table is fully locked for the public key (RLS on, all grants revoked). Access exists only through security-definer RPCs: `admin_user_login` (returns the user's permissions and stamps last_login_at; inactive accounts are refused) and owner-gated `admin_users_list` / `admin_user_save` / `admin_user_delete` (they verify the owner's own credentials server-side, the same pattern as `admin_client_passwords`). The owner's account is untouched and cannot be duplicated as an employee username.

**App side:**
- Login tries the owner RPC first; on mismatch it tries `admin_user_login`. An employee session stores `{username, displayName, roleLabel, permissions}` — and the owner's credentials are cleared from that device, so owner-gated data (customer passwords) can never load in an employee session.
- The sidebar shows only the granted sections (empty groups disappear); navigation to a non-granted tab auto-redirects to the first granted tab, with a "not your permission" panel as a second layer. The credentials ("الدخول") button is owner-only, and logout clears the session.
- New owner-only tab **«فريق العمل والصلاحيات»**: employee list (status, role, permission chips, last login), add/edit form with 6 role presets (sales, stock, accountant, support, marketing, full) that pre-fill a permission matrix grouped by the dashboard's 5 areas with per-group select-all, activate/deactivate, and two-step delete.

**Verification (headless browser against a local Supabase stub serving the real fixtures + RBAC RPC fixtures):** employee login lands on a dashboard showing exactly his 3 granted sections and nothing else, forbidden navigation bounces back, owner credentials are absent from the device; owner login shows all sections + the team tab, the fixture employees list correctly (inactive one badged موقوف), the sales preset checks its 5 permissions, and saving fires exactly one `admin_user_save` carrying the owner credentials, the new username and the 5-permission matrix; the owner session survives a reload. Project tests still 12/12, zero page errors throughout.

**Honest scope note:** permissions govern the dashboard workspace (sections, screens, owner secrets). The store's underlying data still loads through the public key as it does for any visitor — the full data-layer lockdown (RLS write/delete) remains the separate staged item already tracked in the master issue list (#1/#5).
