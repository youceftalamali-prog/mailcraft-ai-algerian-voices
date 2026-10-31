import { test, describe } from 'node:test';
import assert from 'node:assert';
import { PERSONA_SPEECH_CONFIGS } from './speechSynthesisService.js';
import { ALGIERS_PERSONA_REGISTRY } from '../services/algerianPersonaVoiceService.js';

describe('SpeechSynthesisService Configuration', () => {
  test('all 7 personas have tailored speech configurations with ar-DZ language', () => {
    const personaIds = Object.keys(ALGIERS_PERSONA_REGISTRY);
    assert.strictEqual(personaIds.length, 7, 'Expected 7 Algiers personas');

    for (const id of personaIds) {
      const config = PERSONA_SPEECH_CONFIGS[id as keyof typeof PERSONA_SPEECH_CONFIGS];
      assert.ok(config, `Persona ${id} must have a speech config`);
      assert.strictEqual(config.lang, 'ar-DZ');
      assert.ok(config.pitch > 0.5 && config.pitch < 1.8, `Pitch for ${id} should be within natural human range`);
      assert.ok(config.rate > 0.6 && config.rate < 1.5, `Rate for ${id} should be within natural human tempo`);
    }
  });

  test('gender mappings correctly separate female and male voices', () => {
    assert.strictEqual(PERSONA_SPEECH_CONFIGS.young_woman_ad.gender, 'female');
    assert.strictEqual(PERSONA_SPEECH_CONFIGS.elderly_woman.gender, 'female');
    assert.strictEqual(PERSONA_SPEECH_CONFIGS.zephyr_warm.gender, 'male');
    assert.strictEqual(PERSONA_SPEECH_CONFIGS.storyteller_man.gender, 'male');
    assert.strictEqual(PERSONA_SPEECH_CONFIGS.elderly_man.gender, 'male');
    assert.strictEqual(PERSONA_SPEECH_CONFIGS.child_boy.gender, 'child');
    assert.strictEqual(PERSONA_SPEECH_CONFIGS.child_girl.gender, 'child');
  });

  test('female young woman voice has higher pitch than male commercial lead', () => {
    assert.ok(
      PERSONA_SPEECH_CONFIGS.young_woman_ad.pitch > PERSONA_SPEECH_CONFIGS.zephyr_warm.pitch,
      'Young woman pitch should be higher than Zephyr male lead'
    );
  });
});
