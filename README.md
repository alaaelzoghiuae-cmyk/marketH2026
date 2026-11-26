# ELZOGHBI — marketH2026

React + Vite storefront and admin dashboard for elzoghbi.market-h.com (Vercel + Supabase).

- `src/` — app source (App.jsx orchestrator + sections/, components/, lib/, data/, services/)
- `api/` — Vercel serverless endpoints (ai-sourcing, gsmarena, karambo-live, marketplace, ...)
- `public/` — static assets
- `sql/` — numbered Supabase migrations, run manually in order
- `tests/` — node test suites
- `tools/` — maintenance scripts (catalog scrape, site build helper)
- `supabase/functions/` — Supabase edge functions

Build: `npm install && npm run build`. Deploy: push to `main` (Vercel auto-deploys).
