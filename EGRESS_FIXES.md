# Egress fixes applied — 2026-11-22 (on top of v19.4 "low_egress")

Build verified: `npm run build` succeeds with these changes.

## Live measurements behind the fixes (taken 2026-11-22 with the app's own publishable key)
- spare_parts: **8,580 rows**; mobile_models 563; orders 3; clients 12.
- Storefront parts pull (light columns): **~1 KB/row → 850 rows ≈ 878 KB** per cold load.
- site_settings single row: **~81 KB** (settings + credentials + currencies JSON).
- app_state_sync `visit_stats` payload: ~1 KB (negligible — left alone).
- Supabase bill pattern (owner screenshots): 9.96/5 GB used, spikes Nov 1 (~4.2 GB),
  Nov 5–6 (~3.9 GB) = bulk-edit days; near-zero after Nov 11.

## Changes (2 files)

### 1. `src/App.jsx` — Realtime WebSocket is now admin-only
The realtime effect connected **every storefront visitor** to postgres_changes on
8 tables (orders, spare_parts, mobile_models, store_ads, ...). During bulk catalog
edits/imports, every change broadcast the full row to every open shop tab, and each
event invalidated that tab's table caches → refetch storms. This is the most likely
multiplier behind the GB-sized spike days.
Now `connectRealtime()` only runs when `appPortal === 'admin' || adminAuthenticated`
(the effect already re-runs on those deps, so admin login still connects instantly).
Storefront loses nothing: it never used realtime data for shopping, and admin alerts
also have the 5-minute poll + 60s delta check as backup.

### 2. `src/App.jsx` — Phase C background catalog wave (+650 rows) is admin-only
Storefront visitors were downloading 650 extra spare_parts rows (~665 KB) in the
background on every cold visit, on top of the 200 from Phase B. All storefront
brand/model/category/search navigation already fetches its slice server-side via
`fetchSparePartsSliceOnDemand`, so the wave was redundant for shoppers.
Estimated saving: **~665 KB of Supabase egress per cold storefront visit (~2/3 of
the visit's parts traffic).**

### 3. `vercel.json` — real cache headers for static assets
Before: no Cache-Control rules at all (assets went out with max-age=14400/4h).
Added:
- `/assets/*` → `public, max-age=31536000, immutable` (filenames are content-hashed)
- images/fonts (`webp|svg|png|jpg|jpeg|ico|woff2`) → `public, max-age=2592000` (30 days)
This cuts Vercel bandwidth and repeat-visit load time; Cloudflare can now also hold
assets at the edge for a year.

## Deliberately NOT changed
- visit_stats sync (~1 KB/day/device — negligible).
- sbFetchTable caching/dedup and light-column maps (already good in v19.4).
- pushToSupabaseCloud / flushPendingDiffs (already delta-based, return=minimal).

## ⚠️ Security finding (separate from egress — act on this)
Using only the app's **public publishable key** (visible to any visitor), I verified:
- `clients` is readable (an id-only probe returned HTTP 200 + a row). The app's own
  light-column list for clients includes the **`password`** column.
- `site_settings` is readable including the **`credentials`** column (the app's Phase A
  request for id,settings,credentials,currencies,notifications returned 200, ~81 KB).
Anyone who opens DevTools on the store can extract the key and read these tables if
row-level security stays permissive. Proper fix: move admin access behind Supabase
Auth (or a server-side admin endpoint) and tighten RLS so `anon` cannot select
clients/site_settings.credentials. Do NOT just rotate the key — it is public by design.

## Deploy & verify
1. Replace `src/App.jsx` and `vercel.json` with the patched versions, redeploy.
2. Watch Supabase → Reports → Egress daily for a week; bulk-edit days are the test:
   spikes should collapse now that storefront tabs no longer receive broadcasts.
3. If egress still spikes on import days, next step is server-side import
   (Edge Function upserting diffs) instead of client-driven sync.
