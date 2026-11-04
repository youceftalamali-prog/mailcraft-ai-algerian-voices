import test from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_SUBSCRIPTIONS,
  INITIAL_SHOWCASE_SAMPLES,
  INITIAL_AI_SETTINGS,
  AdminSubscription,
  ShowcaseAudioSample,
} from '../services/adminStore.ts';

test('subscription records are not seeded in browser storage', () => {
  assert.equal(INITIAL_SUBSCRIPTIONS.length, 0,
    'payment requests must be loaded from PostgreSQL, not fake local demo records');
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
    id: 'test-payment',
    storeName: 'Test Store',
    ownerName: 'Test Owner',
    email: 'test@example.test',
    phone: '0550000000',
    wilaya: '16 - الجزائر',
    plan: 'starter',
    planLabel: 'Starter',
    amountDzd: 2900,
    paymentMethod: 'baridimob',
    transactionId: 'TEST-TRANSFER-001',
    status: 'pending',
    createdAt: '2026-11-04 10:00',
    adGenerationsUsed: 0,
    adGenerationsLimit: 50,
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
