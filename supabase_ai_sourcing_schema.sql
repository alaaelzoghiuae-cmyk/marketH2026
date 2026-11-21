-- ============================================================================
-- ELZOGHBI MARKET — AI Product Sourcing & Smart Import Agent Schema (v19)
-- Safe, additive migration: preserves all existing tables & data.
-- Run in Supabase SQL Editor.
-- ============================================================================

-- 1. Optional additive metadata columns on existing public.spare_parts table
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS source_url TEXT DEFAULT '';
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS source_sku TEXT DEFAULT '';
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS gtin TEXT DEFAULT '';
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS brand_name TEXT DEFAULT '';
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS model_name TEXT DEFAULT '';
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS specs_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS seo_title TEXT DEFAULT '';
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS seo_description TEXT DEFAULT '';
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS url_slug TEXT DEFAULT '';
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false;
ALTER TABLE public.spare_parts ADD COLUMN IF NOT EXISTS sourcing_task_id TEXT DEFAULT '';

-- 2. Saved Source Profiles (Phase 1B)
CREATE TABLE IF NOT EXISTS public.ai_sourcing_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT NOT NULL,
  extraction_method TEXT DEFAULT 'auto',
  default_currency TEXT DEFAULT 'USD',
  default_pricing_rule JSONB DEFAULT '{}'::jsonb,
  default_image_handling TEXT DEFAULT 'keep_external_urls',
  notes TEXT DEFAULT '',
  verified_capability BOOLEAN DEFAULT false,
  last_tested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Saved Task & Filter Presets (Phase 4 & 10)
CREATE TABLE IF NOT EXISTS public.ai_sourcing_presets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  instruction TEXT NOT NULL,
  filter_rules JSONB DEFAULT '{}'::jsonb,
  pricing_rules JSONB DEFAULT '{}'::jsonb,
  mode TEXT DEFAULT 'import_new',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Sourcing Task History & Audit Logs (Phase 13 & 15)
CREATE TABLE IF NOT EXISTS public.ai_sourcing_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  mode TEXT DEFAULT 'import_new',
  instructions TEXT NOT NULL,
  source_urls JSONB DEFAULT '[]'::jsonb,
  selected_filters JSONB DEFAULT '{}'::jsonb,
  pricing_rules JSONB DEFAULT '{}'::jsonb,
  counts JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'planned',
  execution_logs JSONB DEFAULT '[]'::jsonb,
  errors JSONB DEFAULT '[]'::jsonb,
  approved_changes JSONB DEFAULT '[]'::jsonb,
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 5. Staged Candidate Items with Idempotency Keys (Phase 12)
CREATE TABLE IF NOT EXISTS public.ai_sourcing_items (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES public.ai_sourcing_tasks(id) ON DELETE CASCADE,
  idempotency_key TEXT UNIQUE,
  source_url TEXT,
  product_url TEXT,
  raw_payload JSONB DEFAULT '{}'::jsonb,
  enriched_payload JSONB DEFAULT '{}'::jsonb,
  pricing_breakdown JSONB DEFAULT '{}'::jsonb,
  duplicate_analysis JSONB DEFAULT '{}'::jsonb,
  approval_status TEXT DEFAULT 'pending',
  import_status TEXT DEFAULT 'staged',
  imported_part_id TEXT,
  error_message TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_sourcing_tasks_created ON public.ai_sourcing_tasks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_sourcing_items_task ON public.ai_sourcing_items (task_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_source_sku ON public.spare_parts (source_sku);
CREATE INDEX IF NOT EXISTS idx_spare_parts_gtin ON public.spare_parts (gtin);
