import assert from 'node:assert/strict';
import fs from 'node:fs';
import { isPrivateOrReservedIp, validateSafePublicUrl } from '../api/ai-sourcing.js';
import {
  DUPLICATE_STATUS,
  DEFAULT_SOURCING_PRESETS,
  ISOLATED_TEST_PRODUCTS,
  parseSourcingInstruction,
  buildExecutionPlan,
  parseStructuredSourceInput,
  detectFilterConflicts,
  applyProductFilters,
  classifyDuplicate,
  enrichProductData,
  analyzeProductImages,
  calculateProductPricing,
  buildCatalogUpdateProposals,
  buildSafeImportPart
} from '../src/services/aiSourcingEngine.js';

let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('=== ELZOGHBI MARKET v19 — AI PRODUCT SOURCING TEST SUITE ===');

// 1. SSRF & URL Security Tests (Phase 15)
await test('SSRF: blocks private IPv4, loopback, link-local, cloud metadata, and private IPv6', async () => {
  const blockedUrls = [
    'http://localhost:3000/api',
    'http://127.0.0.1/admin',
    'http://169.254.169.254/latest/meta-data/',
    'http://10.0.0.1/internal',
    'http://192.168.1.50/',
    'http://172.16.0.10/',
    'http://[::1]/',
    'http://metadata.google.internal/computeMetadata/v1/',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'https://admin:secret@example.com/feed.json'
  ];
  for (const u of blockedUrls) {
    const res = await validateSafePublicUrl(u, { skipDns: true });
    assert.equal(res.ok, false, `Expected blocked URL: ${u}`);
  }
  assert.equal(isPrivateOrReservedIp('::ffff:127.0.0.1'), true);
  assert.equal(isPrivateOrReservedIp('8.8.8.8'), false);
  const okRes = await validateSafePublicUrl('https://majentik.com/products.json', { skipDns: true });
  assert.equal(okRes.ok, true);
});

// 2. NL Instruction Parsing (Arabic & English — Phase 1 & 2)
await test('NL Parser: accurately parses Arabic Google Watches & Pixel Buds +15% + round 50 + draft', async () => {
  const wf = parseSourcingInstruction(DEFAULT_SOURCING_PRESETS[0].instruction, ['https://example-supplier.com/google']);
  assert.equal(wf.mode, 'import_new');
  assert.ok(wf.filters.brands.includes('Google'));
  assert.ok(wf.filters.productTypes.includes('watch'));
  assert.ok(wf.filters.productTypes.includes('earbuds'));
  assert.equal(wf.filters.excludeDuplicates, true);
  assert.equal(wf.pricing.mode, 'percent_increase');
  assert.equal(wf.pricing.value, 15);
  assert.equal(wf.pricing.convertCurrency, true);
  assert.equal(wf.pricing.roundingStep, 50);
  assert.equal(wf.importStatus, 'draft');
  assert.equal(wf.requiresApproval, true);
  assert.equal(wf.pricing.exchangeRate, null); // Never fabricated
  assert.equal(buildExecutionPlan(wf).length, 8);
});

await test('NL Parser: accurately parses Arabic Catalog Update (+10%) & Analyze-Only modes', async () => {
  const wfUpd = parseSourcingInstruction(DEFAULT_SOURCING_PRESETS[1].instruction, ['https://example-supplier.com']);
  assert.equal(wfUpd.mode, 'catalog_update');
  assert.equal(wfUpd.pricing.mode, 'percent_increase');
  assert.equal(wfUpd.pricing.value, 10);

  const wfAn = parseSourcingInstruction(DEFAULT_SOURCING_PRESETS[2].instruction, ['https://example-supplier.com']);
  assert.equal(wfAn.mode, 'analyze_only');
  assert.equal(wfAn.filters.excludeLowQuality, true);
  assert.equal(wfAn.filters.excludeDuplicates, true);
});

await test('Filter Conflict Detection: flags minPrice > maxPrice and overlapping keywords', async () => {
  const conflicts = detectFilterConflicts({
    minPrice: 500,
    maxPrice: 200,
    includeKeywords: ['watch'],
    excludeKeywords: ['watch']
  });
  assert.equal(conflicts.length, 2);
});

// 3. Filtering Engine (Phase 4)
await test('Filtering Engine: includes only Google Pixel Watch 3 & Pixel Buds Pro 2, excludes charger/refurbished/Sony', async () => {
  const wf = parseSourcingInstruction(DEFAULT_SOURCING_PRESETS[0].instruction, ['https://example.test']);
  wf.filters.excludeKeywords.push('refurbished');
  wf.filters.inStockOnly = true;
  const { passed: kept, excluded } = applyProductFilters(ISOLATED_TEST_PRODUCTS, wf.filters);
  assert.equal(kept.length, 2);
  assert.ok(kept.some(p => p.model === 'Pixel Watch 3'));
  assert.ok(kept.some(p => p.model === 'Pixel Buds Pro 2'));
  assert.equal(excluded.length, 3);
  excluded.forEach(ex => assert.ok(ex.exclusionReasons.length > 0));
});

// 4. Smart Duplicate Detection (Phase 5)
await test('Duplicate Detection: classifies NEW, EXACT, NEEDS_UPDATE, VARIANT, POSSIBLE, INSUFFICIENT_DATA', async () => {
  const catalog = [
    { id: 'p1', sku: 'GA05785-US', name: 'Google Pixel Watch 3 (45mm)', basePrice: 399 },
    { id: 'p2', sku: 'GA05760-US', name: 'Google Pixel Buds Pro 2', basePrice: 150 },
    { id: 'p3', sku: 'SONY-1', name: 'Sony WF-1000XM5 Silver', basePrice: 12000 }
  ];
  const dExact = classifyDuplicate(ISOLATED_TEST_PRODUCTS[0], catalog);
  assert.equal(dExact.status, DUPLICATE_STATUS.EXACT_DUPLICATE);

  const dUpdate = classifyDuplicate(ISOLATED_TEST_PRODUCTS[1], catalog);
  assert.equal(dUpdate.status, DUPLICATE_STATUS.EXISTING_NEEDS_UPDATE);

  const dVariant = classifyDuplicate(ISOLATED_TEST_PRODUCTS[4], catalog);
  assert.equal(dVariant.status, DUPLICATE_STATUS.VARIANT_OF_EXISTING);

  const dNew = classifyDuplicate({ name: 'Anker 737 Power Bank 24000mAh', brand: 'Anker', sku: 'ANK-737' }, catalog);
  assert.equal(dNew.status, DUPLICATE_STATUS.NEW_PRODUCT);

  const dInsuff = classifyDuplicate({}, catalog);
  assert.equal(dInsuff.status, DUPLICATE_STATUS.INSUFFICIENT_DATA);
});

// 5. Enrichment Engine (Phase 6)
await test('Enrichment Engine: generates Arabic title/desc/SEO/tags strictly from source with provenance', async () => {
  const enr = enrichProductData(ISOLATED_TEST_PRODUCTS[0], { language: 'ar' });
  assert.ok(enr.titleAr.includes('ساعة ذكية'));
  assert.ok(enr.descriptionAr.includes('Pixel Watch 3'));
  assert.equal(enr.matchedCategory, 'ساعات وأساور ذكية');
  assert.ok(enr.seo.urlSlug.length > 5);
  assert.equal(enr.provenance.completenessScore, 100);
  assert.ok(enr.provenance.unverified.some(u => u.includes('الضمان')));
});

// 6. Image Intelligence (Phase 7)
await test('Image Intelligence: deduplicates, selects main, flags low-res/watermark/invalid URLs', async () => {
  const imgs = analyzeProductImages([
    'https://cdn.test/prod-main.webp',
    'https://cdn.test/prod-main.webp',
    'https://cdn.test/prod_thumb_100x100.jpg',
    'https://cdn.test/promo-watermark-banner.png',
    'ftp://invalid-scheme/img.jpg'
  ]);
  assert.equal(imgs.length, 5);
  assert.equal(imgs[0].isMain, true);
  assert.equal(imgs[1].isDuplicate, true);
  assert.equal(imgs[2].isLowResHint, true);
  assert.equal(imgs[3].isWatermarkHint, true);
  assert.equal(imgs[4].status, 'broken');
});

// 7. Intelligent Pricing Engine (Phase 8)
await test('Pricing Engine: blocks silent currency conversion and computes exact USD->EGP +15% + round 50', async () => {
  const noRate = calculateProductPricing({ price: 100, currency: 'USD' }, { mode: 'percent_increase', value: 15, targetCurrency: 'EGP', roundingStep: 50 });
  assert.equal(noRate.ok, false);

  const withRate = calculateProductPricing(
    { price: 100, currency: 'USD' },
    { mode: 'percent_increase', value: 15, targetCurrency: 'EGP', exchangeRate: 50, exchangeRateSource: 'Manual Test', roundingStep: 50 }
  );
  assert.equal(withRate.ok, true);
  assert.equal(withRate.convertedPrice, 5000);
  assert.equal(withRate.finalPrice, 5750);

  const aiMode = calculateProductPricing(
    { price: 100, currency: 'USD' },
    { mode: 'ai_suggested', targetCurrency: 'EGP', exchangeRate: 50, roundingStep: 50 }
  );
  assert.equal(aiMode.finalPrice, 5000); // AI suggestion NOT auto-applied
  assert.equal(aiMode.aiSuggestedPrice, 5750);
});

// 8. Catalog Update Mode (Phase 11)
await test('Catalog Update Mode: produces per-field unapproved proposals without modifying catalog', async () => {
  const catalog = [{ id: 'p1', sku: 'GA05785-US', name: 'Google Pixel Watch 3', basePrice: 18000, soldOut: false, images: ['https://a.test/1.jpg'] }];
  const proposals = buildCatalogUpdateProposals([ISOLATED_TEST_PRODUCTS[0]], catalog, {
    mode: 'percent_increase', value: 10, targetCurrency: 'EGP', exchangeRate: 50, roundingStep: 50
  });
  assert.equal(proposals.length, 1);
  assert.ok(proposals[0].changes.some(c => c.field === 'basePrice' && c.approved === false));
  assert.ok(proposals[0].changes.some(c => c.field === 'images' && c.approved === false));
});

// 9. Safe Idempotent Draft Import Builder & CSV Parser (Phases 3 & 12)
await test('Draft Import Builder & CSV Parser: builds draft spare_parts payload with deterministic ID', async () => {
  const csv = 'name,brand,model,sku,price,currency,images\nGoogle Pixel Watch 3,Google,Pixel Watch 3,GA05785,399,USD,https://a.test/1.jpg|https://a.test/2.jpg';
  const parsed = parseStructuredSourceInput(csv, 'test.csv');
  assert.equal(parsed.ok, true);
  assert.equal(parsed.products.length, 1);

  const p = parsed.products[0];
  const enriched = enrichProductData(p, { language: 'ar' });
  const analyzedImages = analyzeProductImages(p.images);
  const pricing = calculateProductPricing(p, { mode: 'percent_increase', value: 15, targetCurrency: 'EGP', exchangeRate: 50, roundingStep: 50 });
  const built1 = buildSafeImportPart({ ...p, enriched, analyzedImages, pricing }, 'task_1', { asDraft: true });
  const built2 = buildSafeImportPart({ ...p, enriched, analyzedImages, pricing }, 'task_1', { asDraft: true });
  assert.equal(built1.id, built2.id); // Idempotent
  assert.equal(built1.isDraft, true);
  assert.equal(built1.basePrice, 22950);
  assert.equal(built1.images.length, 2);
});

// 10. Static Verification: Request Product Fix & Tailwind v3 / JSX Safety
await test('Static Audit: Nike placeholder replaced with 40W iPhone charger & zero Tailwind v4 classes', async () => {
  // After the monolith split, app content lives across App.jsx + section modules;
  // the audit reads the combined source (same assertions, wider file set).
  const appSrc = ['../src/App.jsx', '../src/sections/Sourcing.jsx', '../src/sections/AdminMain.jsx']
    .map(u => fs.readFileSync(new URL(u, import.meta.url), 'utf8')).join('\n');
  assert.equal(appSrc.includes('حذاء رياضي نايك'), false);
  assert.equal(appSrc.includes('شاحن أيفون أصلي 40W سريع (USB-C PD)'), true);
  assert.equal(appSrc.includes("id: 'ai_product_sourcing'"), true);

  const compSrc = fs.readFileSync(new URL('../src/components/AiProductSourcingAgent.jsx', import.meta.url), 'utf8');
  assert.equal(/backdrop-blur-xs|shadow-xs|shadow-2xs/.test(compSrc), false);
});

console.log(`\nALL ${passed} TESTS PASSED SUCCESSFULLY!`);
