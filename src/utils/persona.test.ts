import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ALGIERS_PERSONA_REGISTRY,
  resolvePersonaEmotionConflict,
  buildPersonaStylePrompt,
} from '../services/algerianPersonaVoiceService.ts';

test('ALGIERS_PERSONA_REGISTRY contains all 7 required preset profiles', () => {
  const keys = Object.keys(ALGIERS_PERSONA_REGISTRY);
  assert.equal(keys.length, 7, 'Should have exactly 7 personas in registry');
  assert.ok(keys.includes('zephyr_warm'), 'Should contain zephyr_warm');
  assert.ok(keys.includes('young_woman_ad'), 'Should contain young_woman_ad');
  assert.ok(keys.includes('storyteller_man'), 'Should contain storyteller_man');
  assert.ok(keys.includes('child_boy'), 'Should contain child_boy');
  assert.ok(keys.includes('child_girl'), 'Should contain child_girl');
  assert.ok(keys.includes('elderly_man'), 'Should contain elderly_man');
  assert.ok(keys.includes('elderly_woman'), 'Should contain elderly_woman');
});

test('Conflict Resolution Engine masks incompatible emotion for child_boy', () => {
  // Requesting deep_sorrow or elderly_authoritative for a child must be masked
  const res = resolvePersonaEmotionConflict('child_boy', 'deep_sorrow' as any);
  assert.equal(res.isConflictDetected, true, 'Conflict should be detected');
  assert.equal(res.resolvedEmotion, 'laughter_smile', 'Should auto-fallback to child safe default');
  assert.ok(res.resolutionReason?.includes('Incompatible emotion'), 'Reason must explain the masking');
});

test('Conflict Resolution Engine permits valid emotion for child_boy', () => {
  const res = resolvePersonaEmotionConflict('child_boy', 'wonder_awe');
  assert.equal(res.isConflictDetected, false, 'No conflict should be detected');
  assert.equal(res.resolvedEmotion, 'wonder_awe', 'Should keep wonder_awe');
});

test('Conflict Resolution Engine masks hyper fast excitement for elderly_man', () => {
  const res = resolvePersonaEmotionConflict('elderly_man', 'fast_hyper_excitement' as any);
  assert.equal(res.isConflictDetected, true, 'Elderly fast hyper excitement should conflict');
  assert.equal(res.resolvedEmotion, 'calm_paternal_advice', 'Should fallback to calm_paternal_advice');
});

test('Conflict Resolution Engine masks childish giggles for storyteller_man', () => {
  const res = resolvePersonaEmotionConflict('storyteller_man', 'childish_giggle' as any);
  assert.equal(res.isConflictDetected, true, 'Storyteller childish giggle should conflict');
  assert.equal(res.resolvedEmotion, 'nostalgia_warmth', 'Should fallback to default nostalgia_warmth');
});

test('Conflict Resolution Engine masks elderly authoritative tone for young_woman_ad', () => {
  const res = resolvePersonaEmotionConflict('young_woman_ad', 'elderly_authoritative' as any);
  assert.equal(res.isConflictDetected, true, 'Young woman elderly tone should conflict');
  assert.equal(res.resolvedEmotion, 'warm_persuasion', 'Should fallback to warm_persuasion');
});

test('buildPersonaStylePrompt includes persona modeling, resolved emotion, and negative constraints', () => {
  const persona = ALGIERS_PERSONA_REGISTRY.child_girl;
  const prompt = buildPersonaStylePrompt(persona, 'sweet_joy');

  assert.ok(prompt.includes('Pure Central Algiers Darija'), 'Must enforce Central Algiers Darija');
  assert.ok(prompt.includes('NEGATIVE ACOUSTIC CONSTRAINTS'), 'Must include negative acoustic constraints');
  assert.ok(prompt.includes('دابا'), 'Must forbid Moroccan token دابا');
  assert.ok(prompt.includes('Zephyr'), 'Must use Zephyr base voice');
  assert.ok(prompt.includes('Sweet, tender'), 'Must include persona vocal texture');
});
