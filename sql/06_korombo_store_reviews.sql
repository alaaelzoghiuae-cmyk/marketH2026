-- ============================================================
-- ELZOGHBI — Korombo Store & Platform Reviews — SQL 06
-- Run ONCE in Supabase SQL Editor to enable cloud persistence
-- for Store/Platform directory, Customer Reviews, and Q&A.
-- Idempotent: safe to re-run.
-- ============================================================

create table if not exists public.store_review_entities (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_review_entries (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_review_questions (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.store_review_entities to anon, authenticated;
grant select, insert, update, delete on public.store_review_entries to anon, authenticated;
grant select, insert, update, delete on public.store_review_questions to anon, authenticated;
