import { test, describe } from 'node:test';
import assert from 'node:assert';
import { createPersonaFallbackWav, isQuotaExceededError } from './audioFallback.js';

describe('audioFallback Utility', () => {
  test('creates valid WAV base64 data URI for each persona', () => {
    const personas = [
      'zephyr_warm',
      'young_woman_ad',
      'storyteller_man',
      'child_boy',
      'child_girl',
      'elderly_man',
      'elderly_woman',
    ];

    for (const persona of personas) {
      const dataUri = createPersonaFallbackWav(persona, 1);
      assert.ok(dataUri.startsWith('data:audio/wav;base64,'), `URI for ${persona} must be valid data URI`);
      const base64Data = dataUri.replace('data:audio/wav;base64,', '');
      assert.ok(base64Data.length > 100, `Base64 audio payload for ${persona} should not be empty`);

      // Verify WAV header magic bytes
      const binary = Buffer.from(base64Data, 'base64');
      assert.strictEqual(binary.subarray(0, 4).toString(), 'RIFF');
      assert.strictEqual(binary.subarray(8, 12).toString(), 'WAVE');
      assert.strictEqual(binary.subarray(12, 16).toString(), 'fmt ');
      assert.strictEqual(binary.subarray(36, 40).toString(), 'data');
    }
  });

  test('isQuotaExceededError identifies 429 quota errors correctly', () => {
    assert.strictEqual(isQuotaExceededError(new Error('Resource has been exhausted (e.g. check quota) - 429')), true);
    assert.strictEqual(isQuotaExceededError({ message: 'Quota exceeded for metric' }), true);
    assert.strictEqual(isQuotaExceededError(new Error('Network timeout')), false);
  });
});
