-- ============================================================
-- ELZOGHBI — خطوة 07b: دالة النشر على السيرفر لنظام التحكم الشامل (Site Control)
-- ============================================================
-- • تعتمد على 07_site_control_system.sql — شغّله الأول.
-- • إضافية بالكامل وقابلة للتشغيل أكثر من مرة بدون أخطاء (Idempotent).
-- • النشر مقصور على مالك المتجر فقط: الدالة تتحقق من اسم المستخدم وكلمة
--   مرور الأدمن بنفس طريقة admin_client_passwords (من site_settings).
-- • عند النشر: تُحدّث theme_tokens المنشورة + content_blocks المنشورة +
--   page_sections المنشورة، وتُحفظ نسخة كاملة في settings_versions
--   للاسترجاع، ويُسجّل الحدث في site_control_audit_logs.
--
-- طريقة التشغيل: انسخ الملف والصقه في Supabase SQL Editor واضغط Run.
-- ============================================================

create or replace function public.admin_publish_site_config(
  p_username text,
  p_password text,
  p_config jsonb,
  p_note text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  creds jsonb;
  v_theme jsonb;
  v_blocks jsonb;
  v_sections jsonb;
  k text;
  item jsonb;
  v_new_version int;
  v_block_count int := 0;
begin
  -- Owner-only check (same source as admin_client_passwords / verify flow)
  select credentials into creds from public.site_settings where id = 'main';
  if creds is null
     or lower(trim(coalesce(creds->>'username', ''))) <> lower(trim(coalesce(p_username, '')))
     or coalesce(creds->>'password', '') <> coalesce(p_password, '') then
    return jsonb_build_object('ok', false, 'error', 'بيانات الأدمن غير صحيحة');
  end if;

  if p_config is null or jsonb_typeof(p_config) <> 'object' then
    return jsonb_build_object('ok', false, 'error', 'إعدادات غير صالحة');
  end if;

  -- 1) Theme tokens (single published row, id = 'default')
  v_theme := coalesce(p_config->'theme', '{}'::jsonb);
  select coalesce(max(version), 0) + 1 into v_new_version
    from public.theme_tokens where id = 'default';

  insert into public.theme_tokens (id, status, version, tokens_light, tokens_dark, typography, layout, updated_by, updated_at)
  values (
    'default', 'published', v_new_version,
    coalesce(v_theme->'tokens_light', '{}'::jsonb),
    coalesce(v_theme->'tokens_dark', '{}'::jsonb),
    coalesce(v_theme->'typography', '{}'::jsonb),
    coalesce(v_theme->'layout', '{}'::jsonb),
    p_username, now()
  )
  on conflict (id) do update set
    status = 'published',
    version = excluded.version,
    tokens_light = excluded.tokens_light,
    tokens_dark = excluded.tokens_dark,
    typography = excluded.typography,
    layout = excluded.layout,
    updated_by = excluded.updated_by,
    updated_at = now();

  -- 2) Content blocks (published)
  v_blocks := coalesce(p_config->'blocks', '{}'::jsonb);
  for k in select jsonb_object_keys(v_blocks) loop
    insert into public.content_blocks (block_key, status, page_slug, value_ar, value_en, updated_by, updated_at)
    values (
      k, 'published',
      case when k like 'home.%' then 'home' else 'global' end,
      coalesce(v_blocks->k->>'ar', ''),
      coalesce(v_blocks->k->>'en', ''),
      p_username, now()
    )
    on conflict (block_key, status) do update set
      value_ar = excluded.value_ar,
      value_en = excluded.value_en,
      updated_by = excluded.updated_by,
      updated_at = now();
    v_block_count := v_block_count + 1;
  end loop;

  -- 3) Page sections (only well-formed rows that came from the server shape)
  v_sections := coalesce(p_config->'sections', '[]'::jsonb);
  if jsonb_typeof(v_sections) = 'array' then
    for item in select * from jsonb_array_elements(v_sections) loop
      if coalesce(item->>'section_key', '') <> '' then
        insert into public.page_sections (id, page_slug, section_key, section_type, sort_order, is_visible, status, config, updated_by, updated_at)
        values (
          coalesce(nullif(item->>'id', ''), coalesce(item->>'page_slug', 'home') || ':' || (item->>'section_key') || ':published'),
          coalesce(nullif(item->>'page_slug', ''), 'home'),
          item->>'section_key',
          coalesce(nullif(item->>'section_type', ''), 'builtin'),
          coalesce((item->>'sort_order')::int, 0),
          coalesce((item->>'is_visible')::boolean, true),
          'published',
          coalesce(item->'config', '{}'::jsonb),
          p_username, now()
        )
        on conflict (page_slug, section_key, status) do update set
          sort_order = excluded.sort_order,
          is_visible = excluded.is_visible,
          config = excluded.config,
          updated_by = excluded.updated_by,
          updated_at = now();
      end if;
    end loop;
  end if;

  -- 4) Version snapshot for rollback + audit log
  insert into public.settings_versions (version_tag, note, snapshot, created_by)
  values (
    'site_control_' || to_char(now(), 'YYYYMMDD_HH24MISS'),
    coalesce(nullif(trim(p_note), ''), 'نشر من لوحة التحكم الشامل'),
    p_config,
    p_username
  );

  insert into public.site_control_audit_logs (actor, action, target_table, target_key, diff_summary)
  values (
    p_username, 'publish', 'site_config', 'default',
    jsonb_build_object('version', v_new_version, 'blocks', v_block_count)
  );

  return jsonb_build_object('ok', true, 'version', v_new_version, 'blocks', v_block_count);
end;
$$;

grant execute on function public.admin_publish_site_config(text, text, jsonb, text) to anon, authenticated;
