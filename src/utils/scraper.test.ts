import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ExtractedProductData,
  scrapeProductUrl,
  generateAdScriptFromProduct,
  assertPublicHttpUrl,
  isPrivateAddress,
} from '../services/productScraperService.ts';

test('scrapeProductUrl rejects invalid protocols gracefully', async () => {
  await assert.rejects(
    async () => {
      await scrapeProductUrl('ftp://invalid-url.com');
    },
    {
      message: /غير صالح|غير مسموح/i,
    }
  );
});

test('scrapeProductUrl handles offline / mocked URLs with fallback product metadata', async () => {
  const result = await scrapeProductUrl('https://example.com/products/smart-watch-ultra-black');
  assert.ok(result.title, 'Should have a product title');
  assert.ok(result.features.length > 0, 'Should have product features');
  assert.equal(result.sourceUrl, 'https://example.com/products/smart-watch-ultra-black');
});

test('generateAdScriptFromProduct fallback contains authentic Algiers dialect and COD', async () => {
  // Pass mock GoogleGenAI client with throwing model to exercise deterministic generator
  const mockAi: any = {
    models: {
      generateContent: async () => {
        throw new Error('Offline fallback test');
      },
    },
  };

  const productData: ExtractedProductData = {
    title: 'ساعة ذكية رياضية فائقة',
    price: '4800 دج',
    description: 'ساعة مقاومة للماء مع شاشة أموليد وبطارية تدوم 7 أيام',
    features: ['مقاومة للماء', 'توصيل لـ 58 ولاية', 'دفع عند الاستلام'],
    sourceUrl: 'https://store.dz/products/smartwatch',
  };

  const response = await generateAdScriptFromProduct(
    mockAi,
    productData,
    'ecommerce_flash_sale',
    'zephyr_warm'
  );

  assert.ok(response.script.length > 20, 'Script must be generated');
  assert.ok(response.script.includes('58 ولاية'), 'Must include 58 wilayas guarantee');
  assert.ok(response.script.includes('الدفع عند الاستلام'), 'Must include Cash on Delivery');
  assert.ok(response.script.includes('لا كوموند'), 'Must include French commercial code-switching');

  // Verify negative constraints (No Moroccan words)
  const forbidden = ['دابا', 'واخا', 'مزيان', 'ديال', 'شنو'];
  for (const word of forbidden) {
    assert.equal(response.script.includes(word), false, `Script must not contain Moroccan word: ${word}`);
  }
});

test('product scraper blocks loopback, private, and reserved network addresses', async () => {
  for (const address of ['127.0.0.1', '10.0.0.8', '192.168.1.10', '169.254.169.254', '::1', '::ffff:127.0.0.1']) {
    assert.equal(isPrivateAddress(address), true, `Must block ${address}`);
  }
  await assert.rejects(assertPublicHttpUrl('http://127.0.0.1/admin'));
  await assert.rejects(assertPublicHttpUrl('http://localhost/'));
});

test('product scraper rejects reserved documentation and multicast IPv6 ranges', () => {
  for (const address of ['0.0.0.0', '224.0.0.1', '198.51.100.1', '203.0.113.9', 'fc00::1', 'fe80::1', 'ff02::1']) {
    assert.equal(isPrivateAddress(address), true, `Must block ${address}`);
  }
});

test('product scraper rejects malformed and internal hostnames without DNS resolution', async () => {
  await assert.rejects(assertPublicHttpUrl('https://metadata.google.internal/computeMetadata/v1'));
  await assert.rejects(assertPublicHttpUrl('https://bad..hostname.example/product'));
});
