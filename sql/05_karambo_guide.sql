-- ============================================================
-- ELZOGHBI — Karambo (كرمبو الشغلانة) tables — SQL 05
-- Run this ONCE in Supabase SQL Editor before using the Karambo
-- dashboard import/sync (the storefront also works from the
-- bundled seed without it, but admin edits/alerts need the tables).
-- Idempotent: safe to re-run.
-- ============================================================

-- Display-only phone guide (indicative market prices, NOT for sale).
-- The app stores the full record in the data jsonb (same pattern as
-- the other store tables); id is the primary key.
create table if not exists public.guide_phones (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- "Notify me when the market price drops" subscriptions from guide pages.
create table if not exists public.price_alerts (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Match the store's current access pattern (public key reads/writes,
-- same as the other store tables until the staged RLS migration).
grant select, insert, update, delete on public.guide_phones to anon, authenticated;
grant select, insert, update, delete on public.price_alerts to anon, authenticated;
