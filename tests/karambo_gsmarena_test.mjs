import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  translateArabicPhoneQuery,
  parseQuicksearchIndex,
  parseGsmarenaSearchHtml,
  parseGsmarenaDeviceHtml
} from '../api/gsmarena.js';
import {
  scrubExternalBrands,
  buildCleanPhoneQuery,
  pickBestPhonePriceHit,
  parseShopifyProductsJson,
  extractRegionalPricesFromText,
  rewriteAndAnalyzeArticle,
  parseKanbkamHtml
} from '../api/karambo-live.js';
import {
  KARAMBO_SERVICES,
  mergeKaramboCfg,
  getOrderedKaramboServices,
  resolveKaramboBarStyle
} from '../src/data/karamboConfig.js';

let passed = 0;
async function test(name, fn) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

console.log('=== ELZOGHBI MARKET v24 — KARAMBO OPEN LIVE CATALOG ENGINE TESTS ===');

await test('Shopify Live Catalog Parser: parses real phones, drops, % & filters accessories', () => {
  const sample = {
    products: [
      {
        id: 1001,
        title: 'Samsung Galaxy S25 Ultra 256GB 5G - Dream 2000',
        vendor: 'Samsung',
        updated_at: '2026-11-24T05:00:00Z',
        images: [{ src: 'https://cdn.shopify.com/s/files/s25u.jpg' }],
        variants: [{ price: '59850.00', compare_at_price: '69500.00', available: true }]
      },
      {
        id: 1002,
        title: 'Silicone Case Cover for Galaxy S25 Ultra',
        vendor: 'Generic',
        variants: [{ price: '299.00', available: true }]
      },
      {
        id: 1003,
        title: 'Apple iPhone 16 Pro Max 256GB',
        vendor: 'Apple',
        variants: [{ price: '68999.00', compare_at_price: '74000.00', available: true }]
      }
    ]
  };
  const items = parseShopifyProductsJson(sample, 2200);
  assert.equal(items.length, 2);
  assert.equal(items[0].price, 59850);
  assert.equal(items[0].oldPrice, 69500);
  assert.equal(items[0].trend, 'down');
  assert.equal(items[0].pct, 14);
  assert.equal(/dream\s*2000/i.test(items[0].name), false);
});

await test('Strict Model-Number Matcher: iPhone 16 matches 16 only (never 15 or 17) & rejects accessories', () => {
  const catalog = [
    { name: 'Apple iPhone 15 Pro Max 256GB', price: 54000 },
    { name: 'Apple iPhone 16 Pro Max 256GB', price: 68999 },
    { name: 'Apple iPhone 16 128GB', price: 46500 },
    { name: 'Screen Protector for iPhone 16', price: 150 }
  ];
  const m1 = pickBestPhonePriceHit(catalog, 'Apple iPhone 16 (2024) 5G', 2200);
  assert.equal(m1.price, 46500);
  const m2 = pickBestPhonePriceHit(catalog, 'Apple iPhone 16 Pro Max', 2200);
  assert.equal(m2.price, 68999);
  const m3 = pickBestPhonePriceHit(catalog, 'Apple iPhone 18 Pro', 2200);
  assert.equal(m3, null);
});

await test('Regional Price Text Extractor & White-Label Brand Scrubber', () => {
  const p = extractRegionalPricesFromText('السعر في مصر 24,600 جنيه وفي الإمارات 1,899 درهم وفي السعودية 1,950 ريال');
  assert.equal(p.eg, 24600);
  assert.equal(p.ae, 1899);
  assert.equal(p.sa, 1950);
  const cleaned = scrubExternalBrands('Dream 2000 Ecity Techorbit Playgame GSMArena Noon Amazon Kanbkam موبيزيل');
  assert.equal(cleaned, '');
});

await test('Editorial News Rewriter & Kanbkam Parser', () => {
  const art = rewriteAndAnalyzeArticle({
    id: 'n1',
    rawTitle: 'إطلاق هاتف جديد ببطارية 6000 مللي أمبير — موبيزيل',
    rawHtml: '<h2>المواصفات</h2><p>يأتي بشاشة 6.8 بوصة 120 هرتز وكاميرا 200 ميجا بكسل وشحن 80 وات.</p>',
    category: 'أخبار',
    date: '2026-11-24'
  });
  assert.ok(art && art.highlights.length >= 3 && art.karamboAnalysis.includes('تحليل كرومبو'));

  const k = parseKanbkamHtml('<div class="x"><h3>Samsung Galaxy A55 256GB</h3><span>19,500 جنية مصرى</span><span>-10%</span></div>', 2200);
  assert.equal(k.length, 1);
  assert.equal(k[0].trend, 'down');
});

await test('Translator, Config (10 services) & Static Icon Integrity', () => {
  assert.equal(translateArabicPhoneQuery('ايفون ١٦ برو ماكس'), 'iphone 16 pro max');
  assert.equal(buildCleanPhoneQuery('Samsung Galaxy S25 Ultra (2025) 5G'), 'Galaxy S25 Ultra');
  assert.equal(KARAMBO_SERVICES.length, 11);
  assert.equal(getOrderedKaramboServices(mergeKaramboCfg({})).length, 11);
  assert.ok(fs.existsSync('public/karambo.png'));
  assert.ok(resolveKaramboBarStyle(mergeKaramboCfg({})).background.includes('linear-gradient'));
  const idx = parseQuicksearchIndex(JSON.stringify([{ '9': 'Samsung' }, [[9, 13322, 'Galaxy S25 Ultra', '', 's25.jpg']]]));
  assert.equal(idx.length, 1);
});

console.log(`\nALL ${passed} KARAMBO v24 TESTS PASSED SUCCESSFULLY!`);
