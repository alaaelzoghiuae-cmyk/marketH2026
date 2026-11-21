#!/usr/bin/env node
/**
 * ELZOGHBI VVIP v17 — Automated 4-Image CDN URL Enricher (Zero Dependencies, Node 18+)
 * Fetches up to 4 real CDN image URLs per product directly from the 5 source websites:
 *   - majentik.com (Shopify .json)
 *   - trust-egypt.com (Shopify .json)
 *   - three-egypt.com (Shopify .json)
 *   - vontx.com (Shopify .json)
 *   - bia3.net (EasyOrders HTML/JSON extraction)
 *
 * Keeps all prices, stock, and clean categories EXACTLY as is. Zero image downloads / zero Supabase Storage egress.
 * Usage: node fetch_4_images.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  OR_IMPORTED_BRANDS,
  OR_BRAND_IMAGES,
  OR_IMPORTED_MODELS,
  OR_IMPORTED_PARTS
} from './src/orCatalogData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONCURRENCY = 6;
const MAX_IMAGES = 4;

async function fetchProductImages(part) {
  const existing = Array.from(new Set(
    [...(Array.isArray(part.images) ? part.images : []), part.image, part.imageUrl]
      .filter(u => u && String(u).trim().startsWith('http'))
  ));
  if (existing.length >= MAX_IMAGES) return existing.slice(0, MAX_IMAGES);

  const srcUrl = String(part.sourceUrl || '').trim();
  if (!srcUrl) return existing;

  const isShopify = /(majentik\.com|trust-egypt\.com|three-egypt\.com|vontx\.com)/i.test(srcUrl);

  try {
    if (isShopify) {
      const cleanUrl = srcUrl.split('?')[0].replace(/\/$/, '');
      const jsonUrl = `${cleanUrl}.json`;
      const res = await fetch(jsonUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ElzoghbiCatalogSync/1.0)', 'Accept': 'application/json' },
        signal: AbortSignal.timeout(12000)
      });
      if (res.ok) {
        const data = await res.json();
        const imgs = (data?.product?.images || [])
          .map(im => (typeof im === 'string' ? im : im?.src))
          .filter(u => u && String(u).startsWith('http'));
        const merged = Array.from(new Set([...existing, ...imgs])).slice(0, MAX_IMAGES);
        if (merged.length > existing.length) return merged;
      }
    }

    // Fallback (works for bia3.net EasyOrders and Shopify HTML pages)
    const resHtml = await fetch(srcUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(12000)
    });
    if (resHtml.ok) {
      const html = await resHtml.text();
      const found = [];
      const regex = /https:\/\/(?:files\.easy-orders\.net|cdn\.shopify\.com|majentik\.com\/cdn\/shop|trust-egypt\.com\/cdn\/shop|three-egypt\.com\/cdn\/shop|vontx\.com\/cdn\/shop)\/[^\s"'<>\\)]+\.(?:jpg|jpeg|png|webp)(?:\?v=\d+)?/gi;
      let m;
      while ((m = regex.exec(html)) !== null) {
        const u = m[0].replace(/\\u002F/g, '/');
        if (!/(logo|icon|favicon|banner|avatar|badge|payment)/i.test(u)) {
          found.push(u);
        }
      }
      const merged = Array.from(new Set([...existing, ...found])).slice(0, MAX_IMAGES);
      return merged;
    }
  } catch (err) {
    // Keep existing image on timeout or network error
  }
  return existing;
}

async function run() {
  console.log(`🚀 Starting 4-image URL enrichment for ${OR_IMPORTED_PARTS.length} products...`);
  const updatedParts = [...OR_IMPORTED_PARTS];
  let enrichedCount = 0;

  for (let i = 0; i < updatedParts.length; i += CONCURRENCY) {
    const batch = updatedParts.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (part, offset) => {
      const idx = i + offset;
      const imgs = await fetchProductImages(part);
      if (imgs.length > (part.images?.length || 1)) enrichedCount++;
      updatedParts[idx] = {
        ...part,
        image: imgs[0] || part.image,
        imageUrl: imgs[0] || part.imageUrl,
        images: imgs,
        customGroupPrices: {
          ...(part.customGroupPrices || {}),
          _images: imgs
        }
      };
    }));
    process.stdout.write(`\rProgress: ${Math.min(i + CONCURRENCY, updatedParts.length)}/${updatedParts.length} (enriched: ${enrichedCount})`);
  }
  console.log('\n✅ Finished fetching image URLs. Writing src/orCatalogData.js and supabase_or_catalog.sql...');

  const outJs = `// Auto-generated OR Multi-Store Catalog Data (Clean Unified Categories + Multi-Image CDN Links)
// Sources: majentik.com, trust-egypt.com/collections/joyroom-products, bia3.net, three-egypt.com/collections, vontx.com

export const OR_IMPORTED_BRANDS = ${JSON.stringify(OR_IMPORTED_BRANDS, null, 2)};

export const OR_BRAND_IMAGES = ${JSON.stringify(OR_BRAND_IMAGES, null, 2)};

export const OR_IMPORTED_MODELS = ${JSON.stringify(OR_IMPORTED_MODELS, null, 2)};

export const OR_IMPORTED_PARTS = ${JSON.stringify(updatedParts, null, 2)};
`;
  fs.writeFileSync(path.join(__dirname, 'src', 'orCatalogData.js'), outJs, 'utf-8');

  const sqlEscape = (s) => String(s ?? '').replace(/'/g, "''");
  const sqlLines = [
    '-- ============================================================================',
    `-- ELZOGHBI VVIP v17 — Clean Unified OR Multi-Store Catalog Sync SQL (${updatedParts.length} Unique Products)`,
    '-- Direct External CDN Image Links ONLY (Up to 4 images per product | Exact Prices)',
    '-- ============================================================================',
    'BEGIN;',
    ''
  ];
  OR_IMPORTED_BRANDS.forEach((b, idx) => {
    const img = OR_BRAND_IMAGES[b] || '';
    sqlLines.push(`INSERT INTO public.brands (name, sort_order, image_url) VALUES ('${sqlEscape(b)}', ${50 + idx}, '${sqlEscape(img)}') ON CONFLICT (name) DO UPDATE SET image_url = EXCLUDED.image_url;`);
  });
  sqlLines.push('');
  for (const m of OR_IMPORTED_MODELS) {
    sqlLines.push(`INSERT INTO public.phone_models (id, brand, name, aliases, image_url) VALUES ('${sqlEscape(m.id)}', '${sqlEscape(m.brand)}', '${sqlEscape(m.name)}', '${sqlEscape(m.aliases || '')}', '${sqlEscape(m.image || '')}') ON CONFLICT (id) DO UPDATE SET brand = EXCLUDED.brand, name = EXCLUDED.name, aliases = EXCLUDED.aliases, image_url = EXCLUDED.image_url;`);
  }
  sqlLines.push('');
  for (const p of updatedParts) {
    const colorsJson = JSON.stringify(p.colors || ['قياسي']);
    const compatJson = JSON.stringify(p.compatibleModels || []);
    const customJson = JSON.stringify(p.customGroupPrices || {});
    sqlLines.push(
      `INSERT INTO public.spare_parts (id, sku, model_id, category, name, quality_grade, colors, compatible_models, search_aliases, description, warranty_text, image_url, stock, low_stock_threshold, max_order_qty, cost_price, base_price, custom_group_prices, waitlist_count) VALUES (` +
      `'${sqlEscape(p.id)}', '${sqlEscape(p.sku)}', '${sqlEscape(p.modelId)}', '${sqlEscape(p.category)}', '${sqlEscape(p.name)}', '${sqlEscape(p.qualityGrade || '')}', ` +
      `'${sqlEscape(colorsJson)}'::jsonb, '${sqlEscape(compatJson)}'::jsonb, '${sqlEscape(p.searchAliases || '')}', '${sqlEscape(p.description || '')}', '${sqlEscape(p.warrantyText || '')}', ` +
      `'${sqlEscape(p.image || '')}', ${Number(p.stock) || 5}, ${Number(p.lowStockThreshold) || 2}, ${Number(p.maxOrderQty) || 5}, ${Number(p.costPrice) || 0}, ${Number(p.basePrice) || 0}, ` +
      `'${sqlEscape(customJson)}'::jsonb, ${Number(p.waitlistCount) || 0}) ` +
      `ON CONFLICT (id) DO UPDATE SET category = EXCLUDED.category, name = EXCLUDED.name, search_aliases = EXCLUDED.search_aliases, image_url = EXCLUDED.image_url, base_price = EXCLUDED.base_price, custom_group_prices = EXCLUDED.custom_group_prices;`
    );
  }
  sqlLines.push('', 'COMMIT;', '');
  fs.writeFileSync(path.join(__dirname, 'supabase_or_catalog.sql'), sqlLines.join('\n'), 'utf-8');

  const multiCount = updatedParts.filter(p => Array.isArray(p.images) && p.images.length >= 2).length;
  const fourCount = updatedParts.filter(p => Array.isArray(p.images) && p.images.length >= 4).length;
  console.log(`🎉 Done! Products with 2+ images: ${multiCount}/${updatedParts.length} | With 4 images: ${fourCount}/${updatedParts.length}`);
}

run();
