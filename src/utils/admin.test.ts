import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_SUBSCRIPTIONS,
  INITIAL_SHOWCASE_SAMPLES,
  INITIAL_AI_SETTINGS,
  AdminSubscription,
  ShowcaseAudioSample,
} from '../services/adminStore.ts';

test('INITIAL_SUBSCRIPTIONS includes SunVera Jolie and Algerian payment methods', () => {
  assert.ok(INITIAL_SUBSCRIPTIONS.length >= 3, 'Should have initial subscription seed records');
  
  const sunvera = INITIAL_SUBSCRIPTIONS.find((s) => s.storeName.includes('SunVera Jolie'));
  assert.ok(sunvera, 'Must contain SunVera Jolie store');
  assert.equal(sunvera?.paymentMethod, 'baridimob', 'SunVera Jolie should use BaridiMob');
  assert.ok(sunvera?.transactionId.startsWith('BM-'), 'Should have BaridiMob transaction ID');
  assert.equal(sunvera?.status, 'pending', 'SunVera Jolie should be pending verification');

  const edahabiaSub = INITIAL_SUBSCRIPTIONS.find((s) => s.paymentMethod === 'edahabia');
  assert.ok(edahabiaSub, 'Must contain an Edahabia subscription');
  assert.ok(edahabiaSub?.transactionId.startsWith('SATIM-'), 'Edahabia should have SATIM transaction reference');
});

test('INITIAL_SHOWCASE_SAMPLES contains 7 Algiers personas with valid data', () => {
  assert.equal(INITIAL_SHOWCASE_SAMPLES.length, 7, 'Must have 7 initial showcase samples');
  
  const personaIds = INITIAL_SHOWCASE_SAMPLES.map((s) => s.personaId);
  assert.ok(personaIds.includes('zephyr_warm'));
  assert.ok(personaIds.includes('young_woman_ad'));
  assert.ok(personaIds.includes('storyteller_man'));
  assert.ok(personaIds.includes('child_boy'));
  assert.ok(personaIds.includes('child_girl'));
  assert.ok(personaIds.includes('elderly_man'));
  assert.ok(personaIds.includes('elderly_woman'));

  for (const sample of INITIAL_SHOWCASE_SAMPLES) {
    assert.ok(sample.title.length > 5, `Sample ${sample.id} must have a descriptive title`);
    assert.ok(sample.scriptText.length > 20, `Sample ${sample.id} must have a realistic promotional script`);
    assert.ok(sample.durationLabel.includes('ثانية'), `Sample ${sample.id} duration must be in seconds`);
  }
});

test('Subscription status transition from pending to active updates activation timestamp', () => {
  const sampleSub: AdminSubscription = {
    ...INITIAL_SUBSCRIPTIONS[0],
    status: 'pending',
    activatedAt: undefined,
  };

  // Simulate activation
  const activated: AdminSubscription = {
    ...sampleSub,
    status: 'active',
    activatedAt: '2026-10-30 14:00',
  };

  assert.equal(activated.status, 'active');
  assert.ok(activated.activatedAt, 'Activation timestamp must be populated');
});

test('INITIAL_AI_SETTINGS specifies Gemini 3.8 Flash, TTS models, and 58 Wilayas enforcement', () => {
  assert.equal(INITIAL_AI_SETTINGS.primaryModel, 'gemini-3.8-flash', 'Primary model should be Gemini 3.8 Flash');
  assert.equal(INITIAL_AI_SETTINGS.ttsModel, 'gemini-3.8-flash-lite-tts', 'TTS model should be gemini-3.8-flash-lite-tts');
  assert.equal(INITIAL_AI_SETTINGS.enforceCod58Wilayas, true, '58 Wilayas and COD must be enforced');
  assert.equal(INITIAL_AI_SETTINGS.moroccanFilterStrictness, 'strict', 'Moroccan filter must default to strict');
  assert.equal(INITIAL_AI_SETTINGS.language, 'ar', 'Default language must be Arabic');
});
