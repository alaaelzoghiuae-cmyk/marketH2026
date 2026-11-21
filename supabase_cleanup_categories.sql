-- ============================================================================
-- ELZOGHBI VVIP v17 — Unified Category Cleanup Migration for Existing Supabase Rows
-- Run once in Supabase SQL Editor to unify overlapping/duplicate categories
-- ============================================================================
BEGIN;

UPDATE public.spare_parts SET category = 'باور بانك' WHERE category IN ('OR - باور بانك');
UPDATE public.spare_parts SET category = 'كابلات ومحولات' WHERE category IN ('OR - كابلات ومحولات');
UPDATE public.spare_parts SET category = 'شواحن' WHERE category IN ('OR - شواحن سريعة ولاسلكية', 'شواحن وكابلات', 'شواحن وكابلات أصلية');
UPDATE public.spare_parts SET category = 'اسكرينات وحماية كاميرا' WHERE category IN ('OR - اسكرينات وحماية كاميرا');
UPDATE public.spare_parts SET category = 'جرابات الموبايل' WHERE category IN ('OR - جرابات الموبايل', 'جرابات وإكسسوارات حماية', 'جرابات واكسسوارات حماية', 'جرابات وحمايات');
UPDATE public.spare_parts SET category = 'سماعات ومايكات' WHERE category IN ('OR - سماعات ومايكات', 'سماعات', 'سماعات وساعات ذكية');
UPDATE public.spare_parts SET category = 'سبيكر ومكبرات صوت' WHERE category IN ('OR - سبيكر ومكبرات صوت');
UPDATE public.spare_parts SET category = 'ساعات وأساور ذكية' WHERE category IN ('OR - ساعات وأساور ذكية');
UPDATE public.spare_parts SET category = 'إكسسوارات سيارة وحوامل وتصوير' WHERE category IN ('OR - إكسسوارات سيارة وحوامل وتصوير');
UPDATE public.spare_parts SET category = 'ماوس وكيبورد وجيمنج' WHERE category IN ('OR - ماوس وكيبورد وجيمنج');
UPDATE public.spare_parts SET category = 'مشتركات وأجهزة ذكية ومكتبية' WHERE category IN ('OR - مشتركات وأجهزة ذكية ومكتبية');
UPDATE public.spare_parts SET category = 'ماكينات حلاقة وعناية' WHERE category IN ('OR - ماكينات حلاقة وعناية', 'إكسسوارات وعناية');
UPDATE public.spare_parts SET category = 'شاشات كاملة' WHERE category IN ('شاشات أصلية');

COMMIT;
