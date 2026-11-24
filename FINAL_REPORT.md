# ELZOGHBI — Final Project Report (2026-11-23)

Base: the currently deployed code (Round 8) + vercel.json with the
immutable cache rule intact. Nothing in this package is deployed —
it is for local testing first, per your approval rule.

## Verification performed on THIS package
- Production build: PASSES.
- Project test suite (tests/ai_sourcing_test.mjs): 12/12 PASS.
  (Note: the currently deployed engine FAILS the pricing test —
  in ai_suggested mode it auto-applies the +15% suggestion as the
  final price. This package fixes that: the suggestion is kept
  separate until the admin approves it in the review screen.)
- Headless runtime load test: storefront renders, zero page errors.
- NOT covered: full click-through against your live Supabase from a
  local server (your local test), and the Stage C SQL (you run it).

## Fixed in code in this package
- #4  Order/return IDs now carry a random suffix (INV-…-XXXX,
      RET-…-XXXX) — collision/overwrite risk closed.
- #7  New orders now write their real total into orders.total.
- #10 No more silent '123' passwords: approving a request or creating
      a client without a password generates a random 6-digit one;
      the create form no longer comes pre-filled with '123'.
- #11 Parts persistence no longer skips entirely above 2,000 items —
      it warm-caches the 2,000 most recently updated parts.
- #13 Seed group id 'grp_vip_ flat' space removed (was inert).
- #14 Visible EN / عربي language toggle added to the header
      (the full EN dictionary already existed; the button didn't).
- #15 Cart quantity now respects each product's maxOrderQty
      (stepper, direct typing, and checkout).
- #18 Ticker fix from Gemini v19.5 ported (seamless loop, instant
      save, custom colors, reduced-motion handling).
- #19–#24 The six v19.5 component reversions were NOT taken: this
      package keeps the deployed (audited) components and only adds
      the new sourcing features on top of them.
- #25 Sourcing merge done by three-way merge (v19.4 base):
      Gemini's features (27 task templates, site explorer,
      browser-extractor import, NextData/Woo extraction, WhatsApp
      supplier-list parsing, Arabic CSV headers) + all deployed
      audit fixes kept (currency-aware price filter, exchange-rate
      pair guard). One real conflict (workflow pricing re-parse)
      resolved keeping the exchangeRatePair. api/ai-sourcing.js
      adopted as an expanded superset (verified: deployed == base).
- #29 'Up to 4 images' label: already fixed in the current code
      (all labels say 8) — verified, nothing to change.
- #30 Customer tracking stepper now uses your friendly stages
      (استلمنا طلبك ← بيتجهز ← اتجهز ← خرج مع المندوب ← اتسلّم),
      and every admin status change automatically opens a prefilled
      WhatsApp message to the customer with the new stage.
      Honest limit: the admin still taps "Send" inside WhatsApp —
      fully automatic sending needs a WhatsApp Business API account,
      which is not connected.

## Ships as SQL for you to run (folder sql/)
- #2  01_cleanup_leaked_secrets.sql — steps 0–3 (prepared earlier,
      still not confirmed as run; the leaked OTP stays readable
      until it runs).
- #9  02_admin_update_credentials.sql — dashboard password change.
- #3  03_stageC_account_requests_lock.sql — deploy this code first,
      then run it; approvals keep working through the new gated
      function added in this package.

## Not closed by this package (honest list)
- #1/#5 Public key can still write/delete store tables. Needs the
      staged RLS/RPC migration described in sql/SQL_README.md —
      doing it blind inside this zip could take the live store down.
- #6  OTP self-service reset stays as-is (it was already broken by
      the column lock; admins reset any customer password directly
      from the dashboard, which you required to keep).
- #8  Admin password remains in localStorage — inherent to the
      gated-RPC design you approved (it is how the dashboard loads
      customer passwords). No session expiry added.
- #12 Remaining ~144 empty catches are localStorage/audio/parse
      fallbacks; every customer submit path already awaits the
      server and shows failures (fixed in Rounds 5–7, re-verified).
- #16 Product images are a content matter (97% hotlinked,
      128/200 sampled products imageless) — not a code fix.
- #17 Demo/maintenance banners — your deferred decision.
- #26 Customer passwords are plaintext inside the DB itself
      (no longer publicly readable). Hashing/Auth migration is
      future work.
- #27 commitCustomerCloudTransaction still ignores its mutator
      argument, but its callers were replaced in Rounds 7–8;
      it is dead weight, not a live path.
- #28 One unconfirmed QA observation (new client card showing the
      default group) — never reproduced; left as a watch item.
- #31 Monolith split: per the agreed sequencing, it starts on top
      of this stable version as its own phase (one module at a
      time, each built + runtime-tested + approved separately) —
      deliberately not mixed into this package.

## How to test locally
1) Unzip. 2) Either serve the ready build: any static server on the
   `dist/` folder — or run the source: `npm install` then
   `npm run dev`. 3) The app talks to your live Supabase, so test
   with test data and delete it afterwards. 4) Run the sql/ files
   only when you are ready, in order, after deploying this code.

## Addendum (2026-11-23, after your local test)
- Crash on opening the AI Sourcing agent — FIXED in this zip.
  Cause: Gemini's v19.5 agent reads filters.includeTypes, but the
  instruction parser returns filters.productTypes; the field was
  never set, so the agent crashed on open (this bug also exists in
  Gemini's v19.5 as delivered). Fix: every workflow entering the
  agent's state is normalized (includeTypes mapped from
  productTypes, all filter lists coerced to arrays) and the render
  reads are hardened. Verified by re-running the exact reproduction
  that crashed before the fix: the agent now opens and renders.
  Note: my original runtime test loaded the storefront only and did
  not open this tab — that gap is on me.
