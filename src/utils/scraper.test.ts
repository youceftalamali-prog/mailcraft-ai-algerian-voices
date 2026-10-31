import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ExtractedProductData,
  scrapeProductUrl,
  generateAdScriptFromProduct,
} from '../services/productScraperService.ts';

test('scrapeProductUrl rejects invalid protocols gracefully', async () => {
  await assert.rejects(
    async () => {
      await scrapeProductUrl('ftp://invalid-url.com');
    },
    {
      message: /غير صالح/i,
    }
  );
});

test('scrapeProductUrl handles offline / mocked URLs with fallback product metadata', async () => {
  const result = await scrapeProductUrl('https://my-store.dz/products/smart-watch-ultra-black');
  assert.ok(result.title, 'Should have a product title');
  assert.ok(result.features.length > 0, 'Should have product features');
  assert.equal(result.sourceUrl, 'https://my-store.dz/products/smart-watch-ultra-black');
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
