-- ============================================================
-- ELZOGHBI — خطوة 07: نظام التحكم الشامل في الموقع (Site Control System)
-- ============================================================
-- • إضافي بالكامل (Additive Only) ولا يحذف أو يعدل أي بيانات حالية.
-- • قابل للتشغيل أكثر من مرة بدون أخطاء (Idempotent).
-- • يدعم المسودة / النشر (draft / published)، تعدد اللغات (ar / en)،
--   سجل النسخ والاسترجاع (Rollback)، وسجل التدقيق (Audit Log).
-- • محمي بـ RLS على مستوى قاعدة البيانات:
--   - الزوار يقرأون فقط النسخ المنشورة (status = 'published').
--   - الكتابة وقراءة المسودات مقصورة على الأدمن فقط عبر دوال SECURITY DEFINER.
--
-- طريقة التشغيل: انسخ الملف والصقه في Supabase SQL Editor واضغط Run.
-- ============================================================

-- 1) توكنز التصميم (Theme Tokens: ألوان، خطوط، مسافات، حواف، ظلال)
create table if not exists public.theme_tokens (
  id           text primary key default 'default',
  status       text not null default 'published' check (status in ('draft', 'published')),
  version      integer not null default 1,
  tokens_light jsonb not null default '{}'::jsonb,
  tokens_dark  jsonb not null default '{}'::jsonb,
  typography   jsonb not null default '{}'::jsonb,
  layout       jsonb not null default '{}'::jsonb,
  updated_by   text not null default 'system',
  updated_at   timestamptz not null default now()
);

-- 2) أقسام الصفحات وترتيبها وإظهارها/إخفائها
create table if not exists public.page_sections (
  id           text primary key,
  page_slug    text not null default 'home',
  section_key  text not null,
  section_type text not null default 'builtin',
  sort_order   integer not null default 0,
  is_visible   boolean not null default true,
  status       text not null default 'published' check (status in ('draft', 'published')),
  config       jsonb not null default '{}'::jsonb,
  updated_by   text not null default 'system',
  updated_at   timestamptz not null default now(),
  unique (page_slug, section_key, status)
);

-- 3) كتل المحتوى (نصوص وصور قابلة للتعديل بمفتاح ثابت + عربي/إنجليزي)
create table if not exists public.content_blocks (
  block_key    text not null,
  status       text not null default 'published' check (status in ('draft', 'published')),
  page_slug    text not null default 'global',
  value_ar     text not null default '',
  value_en     text not null default '',
  media_url    text not null default '',
  meta         jsonb not null default '{}'::jsonb,
  updated_by   text not null default 'system',
  updated_at   timestamptz not null default now(),
  primary key (block_key, status)
);

-- 4) قوائم التنقل (الهيدر والفوتر وترتيبها)
create table if not exists public.navigation_items (
  id           text primary key,
  menu_zone    text not null check (menu_zone in ('header', 'footer_col1', 'footer_col2', 'footer_col3', 'footer_col4', 'mobile')),
  label_ar     text not null,
  label_en     text not null default '',
  href         text not null,
  icon_name    text not null default '',
  sort_order   integer not null default 0,
  is_visible   boolean not null default true,
  status       text not null default 'published' check (status in ('draft', 'published')),
  updated_at   timestamptz not null default now()
);

-- 5) البانرات والإعلانات المجدولة زمنيًا
create table if not exists public.banners_announcements (
  id           text primary key,
  placement    text not null default 'top_bar' check (placement in ('top_bar', 'hero', 'promo_split', 'footer')),
  title_ar     text not null default '',
  title_en     text not null default '',
  body_ar      text not null default '',
  body_en      text not null default '',
  cta_label_ar text not null default '',
  cta_label_en text not null default '',
  cta_href     text not null default '',
  image_url    text not null default '',
  starts_at    timestamptz,
  ends_at      timestamptz,
  is_active    boolean not null default true,
  status       text not null default 'published' check (status in ('draft', 'published')),
  sort_order   integer not null default 0,
  updated_at   timestamptz not null default now()
);

-- 6) إعدادات SEO لكل صفحة
create table if not exists public.seo_settings (
  page_slug    text not null,
  status       text not null default 'published' check (status in ('draft', 'published')),
  title_ar     text not null default '',
  title_en     text not null default '',
  desc_ar      text not null default '',
  desc_en      text not null default '',
  og_image_url text not null default 'https://elzoghbi.market-h.com/og-image.png',
  canonical    text not null default '',
  robots       text not null default 'index, follow',
  updated_at   timestamptz not null default now(),
  primary key (page_slug, status)
);

-- 7) سجل الإصدارات والنسخ (للـ Rollback الفوري)
create table if not exists public.settings_versions (
  id           bigserial primary key,
  version_tag  text not null,
  note         text not null default '',
  snapshot     jsonb not null,
  created_by   text not null default 'admin',
  created_at   timestamptz not null default now()
);

-- 8) سجل التدقيق الأمني (Audit Log لكل عملية كتابة)
create table if not exists public.site_control_audit_logs (
  id           bigserial primary key,
  actor        text not null,
  action       text not null,
  target_table text not null,
  target_key   text not null default '',
  diff_summary jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- تفعيل RLS على جميع الجداول الجديدة
-- ============================================================
alter table public.theme_tokens enable row level security;
alter table public.page_sections enable row level security;
alter table public.content_blocks enable row level security;
alter table public.navigation_items enable row level security;
alter table public.banners_announcements enable row level security;
alter table public.seo_settings enable row level security;
alter table public.settings_versions enable row level security;
alter table public.site_control_audit_logs enable row level security;

-- القراءة العامة فقط للإعدادات المنشورة (status = 'published')
drop policy if exists "public_read_published_theme_tokens" on public.theme_tokens;
create policy "public_read_published_theme_tokens" on public.theme_tokens
  for select using (status = 'published');

drop policy if exists "public_read_published_page_sections" on public.page_sections;
create policy "public_read_published_page_sections" on public.page_sections
  for select using (status = 'published' and is_visible = true);

drop policy if exists "public_read_published_content_blocks" on public.content_blocks;
create policy "public_read_published_content_blocks" on public.content_blocks
  for select using (status = 'published');

drop policy if exists "public_read_published_navigation_items" on public.navigation_items;
create policy "public_read_published_navigation_items" on public.navigation_items
  for select using (status = 'published' and is_visible = true);

drop policy if exists "public_read_published_banners" on public.banners_announcements;
create policy "public_read_published_banners" on public.banners_announcements
  for select using (
    status = 'published'
    and is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  );

drop policy if exists "public_read_published_seo" on public.seo_settings;
create policy "public_read_published_seo" on public.seo_settings
  for select using (status = 'published');

-- منع القراءة والكتابة المباشرة للنسخ وسجل التدقيق من المفتاح العام
revoke all on table public.settings_versions from anon, authenticated;
revoke all on table public.site_control_audit_logs from anon, authenticated;

-- ============================================================
-- دالة RPC مجمّعة سريعة (طلب واحد) لجلب الإعدادات المنشورة للزائر
-- ============================================================
create or replace function public.get_published_site_config(p_page_slug text default 'home')
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'theme', (select to_jsonb(t) from public.theme_tokens t where t.id = 'default' and t.status = 'published' limit 1),
    'sections', coalesce((select jsonb_agg(s order by s.sort_order asc) from public.page_sections s where s.page_slug = p_page_slug and s.status = 'published' and s.is_visible = true), '[]'::jsonb),
    'blocks', coalesce((select jsonb_object_agg(b.block_key, jsonb_build_object('ar', b.value_ar, 'en', b.value_en, 'media', b.media_url, 'meta', b.meta)) from public.content_blocks b where b.status = 'published' and b.page_slug in ('global', p_page_slug)), '{}'::jsonb),
    'navigation', coalesce((select jsonb_agg(n order by n.sort_order asc) from public.navigation_items n where n.status = 'published' and n.is_visible = true), '[]'::jsonb),
    'banners', coalesce((select jsonb_agg(ba order by ba.sort_order asc) from public.banners_announcements ba where ba.status = 'published' and ba.is_active = true and (ba.starts_at is null or ba.starts_at <= now()) and (ba.ends_at is null or ba.ends_at >= now())), '[]'::jsonb),
    'seo', (select to_jsonb(se) from public.seo_settings se where se.page_slug = p_page_slug and se.status = 'published' limit 1)
  );
$$;
grant execute on function public.get_published_site_config(text) to anon, authenticated;

-- ============================================================
-- Seed بالقيم الافتراضية الحالية لمتجر ELZOGHBI (Idempotent)
-- ============================================================
insert into public.theme_tokens (id, status, version, tokens_light, tokens_dark, typography, layout, updated_by)
values (
  'default',
  'published',
  1,
  '{"bg":"#fafafc","surface":"#ffffff","surface2":"#f5f5f7","fg":"#1d1d1f","muted":"#6e6e73","line":"#d2d2d7","accent":"#0071e3","accentText":"#0066cc"}'::jsonb,
  '{"bg":"#161617","surface":"#1d1d1f","surface2":"#2c2c2e","fg":"#f5f5f7","muted":"#a1a1a6","line":"#38383a","accent":"#0071e3","accentText":"#2997ff"}'::jsonb,
  '{"arabicFont":"IBM Plex Sans Arabic","latinFont":"Inter","baseSizePx":16,"arabicLineHeight":1.65,"latinLineHeight":1.5}'::jsonb,
  '{"maxWidthPx":1200,"cardRadiusPx":18,"controlRadiusPx":12,"pillRadiusPx":980,"productsPerPage":24}'::jsonb,
  'seed'
)
on conflict (id) do nothing;

insert into public.seo_settings (page_slug, status, title_ar, title_en, desc_ar, desc_en, og_image_url, canonical)
values
  ('home', 'published', 'ELZOGHBI | منصة الزغبي للتسوق الذكي والمنتجات الأصلية', 'ELZOGHBI | Smart Mobile Spare Parts & Accessories', 'منصة ومتجر ELZOGHBI لقطع غيار الموبايلات الأصلية والشاشات والبطاريات والإكسسوارات بأسعار الجملة والقطاعي.', 'Original mobile spare parts, screens, batteries and accessories with fast delivery across Egypt.', 'https://elzoghbi.market-h.com/og-image.png', 'https://elzoghbi.market-h.com/'),
  ('store', 'published', 'الكتالوج والمنتجات | ELZOGHBI', 'Catalog & Products | ELZOGHBI', 'تصفح جميع قطع الغيار والإكسسوارات الأصلية بأسعار الجملة والقطاعي.', 'Browse all original mobile spare parts and accessories.', 'https://elzoghbi.market-h.com/og-image.png', 'https://elzoghbi.market-h.com/#/store'),
  ('karambo', 'published', 'كرمبو الشغلانة | دليل ومقارنة الهواتف — ELZOGHBI', 'Karambo Phone Guide & Comparison — ELZOGHBI', 'قارن مواصفات وأسعار الهواتف وتقييمات المحلات في مصر.', 'Compare smartphone specs, Egypt prices, and real store reviews.', 'https://elzoghbi.market-h.com/og-image.png', 'https://elzoghbi.market-h.com/#/karambo')
on conflict (page_slug, status) do nothing;

insert into public.content_blocks (block_key, status, page_slug, value_ar, value_en)
values
  ('home.hero.badge', 'published', 'home', 'جودة مضمونة وأسعار تنافسية ⚡', 'Guaranteed quality & competitive prices ⚡'),
  ('home.hero.title', 'published', 'home', 'تسوق بذكاء .. عيش تجربة أفضل', 'Shop smarter.. live a better experience'),
  ('home.hero.subtitle', 'published', 'home', 'تشكيلة متكاملة من أحدث المنتجات والأجهزة ومستلزماتها بضمان حقيقي وشحن سريع لكل المحافظات', 'Complete selection of original parts & accessories with real warranty and fast delivery'),
  ('home.hero.cta', 'published', 'home', 'تصفح كل المنتجات', 'Browse all products')
on conflict (block_key, status) do nothing;
