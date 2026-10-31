import { AlgiersPersonaId, ALGIERS_PERSONA_REGISTRY } from '../services/algerianPersonaVoiceService';

export interface PersonaSpeechVoiceConfig {
  gender: 'female' | 'male' | 'child';
  pitch: number;
  rate: number;
  lang: string;
}

export const PERSONA_SPEECH_CONFIGS: Record<AlgiersPersonaId, PersonaSpeechVoiceConfig> = {
  zephyr_warm: {
    gender: 'male',
    pitch: 0.98,
    rate: 1.02,
    lang: 'ar-DZ',
  },
  young_woman_ad: {
    gender: 'female',
    pitch: 1.18,
    rate: 1.0,
    lang: 'ar-DZ',
  },
  storyteller_man: {
    gender: 'male',
    pitch: 0.88,
    rate: 0.92,
    lang: 'ar-DZ',
  },
  child_boy: {
    gender: 'child',
    pitch: 1.32,
    rate: 1.05,
    lang: 'ar-DZ',
  },
  child_girl: {
    gender: 'child',
    pitch: 1.38,
    rate: 1.05,
    lang: 'ar-DZ',
  },
  elderly_man: {
    gender: 'male',
    pitch: 0.82,
    rate: 0.88,
    lang: 'ar-DZ',
  },
  elderly_woman: {
    gender: 'female',
    pitch: 0.90,
    rate: 0.88,
    lang: 'ar-DZ',
  },
};

/**
 * Returns the best available Arabic SpeechSynthesisVoice matching gender preferences.
 */
export function getBestArabicVoice(gender: 'female' | 'male' | 'child'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  // Filter all Arabic voices
  const arabicVoices = voices.filter(
    (v) =>
      v.lang.toLowerCase().startsWith('ar') ||
      v.lang.toLowerCase().includes('ara') ||
      v.name.toLowerCase().includes('arabic') ||
      v.name.toLowerCase().includes('عربي')
  );

  if (arabicVoices.length === 0) {
    // If no Arabic voice is installed, fallback to the default voice
    return voices[0] || null;
  }

  // Check for explicit Algerian dialect
  const dzVoice = arabicVoices.find((v) => v.lang.toLowerCase() === 'ar-dz' || v.name.toLowerCase().includes('algeria'));
  if (dzVoice) return dzVoice;

  // Female voice names / markers
  const femalePattern = /female|woman|laila|salma|zari|mageda|hoda|fatima|mariam|aya|zeina|sana/i;
  // Male voice names / markers
  const malePattern = /male|man|tarik|maged|shakir|hamed|ahmed|omar|youssef|karim/i;

  if (gender === 'female' || gender === 'child') {
    const femaleVoice = arabicVoices.find((v) => femalePattern.test(v.name));
    if (femaleVoice) return femaleVoice;
    // Prefer non-male if available
    const nonMale = arabicVoices.find((v) => !malePattern.test(v.name));
    if (nonMale) return nonMale;
  } else {
    const maleVoice = arabicVoices.find((v) => malePattern.test(v.name));
    if (maleVoice) return maleVoice;
  }

  // Return the first Arabic voice (e.g. ar-XA, ar-SA, Google العربية)
  return arabicVoices[0];
}

/**
 * Speaks an ad script aloud using the browser's standard Web Speech API (window.speechSynthesis).
 * Strictly focused on reading human speech with natural Arabic cadence and persona profiling.
 */
export function speakAdScript(
  text: string,
  personaId: AlgiersPersonaId = 'zephyr_warm',
  options?: {
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: unknown) => void;
  }
): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('SpeechSynthesis API not supported in this browser environment.');
      options?.onEnd?.();
      resolve();
      return;
    }

    try {
      // Cancel any ongoing or stuck speech
      window.speechSynthesis.cancel();

      const cleanText = text.trim();
      if (!cleanText) {
        options?.onEnd?.();
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const config = PERSONA_SPEECH_CONFIGS[personaId] || PERSONA_SPEECH_CONFIGS.zephyr_warm;

      const voice = getBestArabicVoice(config.gender);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || 'ar-DZ';
      } else {
        utterance.lang = 'ar-DZ';
      }

      utterance.pitch = config.pitch;
      utterance.rate = config.rate;

      let hasResolved = false;
      const finish = () => {
        if (!hasResolved) {
          hasResolved = true;
          options?.onEnd?.();
          resolve();
        }
      };

      utterance.onstart = () => {
        options?.onStart?.();
      };

      utterance.onend = () => {
        finish();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        options?.onError?.(e);
        finish();
      };

      // Safety timeout: in case speechSynthesis event doesn't fire
      const wordCount = cleanText.split(/\s+/).length;
      const expectedDurationMs = Math.max(3000, (wordCount / 2.2) * 1000 + 1500);
      setTimeout(finish, expectedDurationMs);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Failed to trigger speech synthesis:', err);
      options?.onError?.(err);
      options?.onEnd?.();
      resolve();
    }
  });
}

/**
 * Stops any active speech in the browser immediately.
 */
export function stopAdSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}
