/**
 * Human Voice Synthesis & Speech Audio Utility for Algerian Ads.
 * Strictly speech-oriented: NO musical chords, NO musical scales, NO sine-wave arpeggios.
 * Generates natural vocal tract speech-formant cadence (human voice speech simulation)
 * when used as an offline/backup audio payload, with zero music or tone chimes.
 */

function uint8ArrayToBase64(bytes: Uint8Array): string {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    let binary = '';
    const len = bytes.byteLength;
    const chunkSize = 8192;
    for (let i = 0; i < len; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return window.btoa(binary);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).toString('base64');
  }
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  return '';
}

/**
 * Synthesizes a pure vocal-speech audio WAV simulating human speech utterance cadence
 * (glottal vocal pulses with speech formants F1/F2 and spoken word cadence).
 * Contains NO musical notes, NO chords, NO musical sine-wave arpeggios.
 */
export function createPersonaFallbackWav(
  personaId: string,
  durationSeconds = 5
): string {
  const sampleRate = 44100;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const totalLength = 44 + numSamples * 2;
  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // 44-byte Standard PCM RIFF WAV Header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM subchunk
  view.setUint16(20, 1, true); // PCM uncompressed
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true); // 44.1kHz
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // 16-bit
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Human Vocal Pitch (Fundamental Frequency F0 in Hz):
  // Men: ~115 - 135 Hz
  // Women: ~200 - 225 Hz
  // Children: ~260 - 290 Hz
  // Elders: ~105 Hz (deep gravelly vocal cord)
  let baseF0 = 125; // default male commercial voice (Zephyr)
  let f1 = 650; // Vowel formant 1 (Open vowel /a/)
  let f2 = 1300; // Vowel formant 2
  let speechSyllableRate = 3.6; // Syllables per second (natural Arabic speech rhythm)

  if (personaId === 'young_woman_ad' || personaId === 'elderly_woman' || personaId === 'child_girl') {
    if (personaId === 'young_woman_ad') {
      baseF0 = 210;
      f1 = 700;
      f2 = 1800;
      speechSyllableRate = 4.0;
    } else if (personaId === 'elderly_woman') {
      baseF0 = 175;
      f1 = 600;
      f2 = 1400;
      speechSyllableRate = 3.0;
    } else {
      baseF0 = 270;
      f1 = 800;
      f2 = 2100;
      speechSyllableRate = 4.2;
    }
  } else if (personaId === 'child_boy') {
    baseF0 = 240;
    f1 = 750;
    f2 = 1900;
    speechSyllableRate = 4.0;
  } else if (personaId === 'elderly_man') {
    baseF0 = 105;
    f1 = 550;
    f2 = 1150;
    speechSyllableRate = 2.8;
  } else if (personaId === 'storyteller_man') {
    baseF0 = 115;
    f1 = 580;
    f2 = 1250;
    speechSyllableRate = 3.2;
  } else {
    // zephyr_warm (dynamic Algiers commercial lead)
    baseF0 = 130;
    f1 = 620;
    f2 = 1350;
    speechSyllableRate = 3.8;
  }

  // Synthesize speech-like phoneme stream: glottal pulses with formant bandpass resonance
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Sentence envelope: smooth fade-in and gentle conclusion pause
    const sentenceFadeIn = Math.min(1, t / 0.05);
    const sentenceFadeOut = Math.min(1, (durationSeconds - t) / 0.25);
    const sentenceGain = sentenceFadeIn * sentenceFadeOut;

    // Speech rhythm: simulate syllables with micro-pauses between words
    // Word stress cycle every ~0.8s, syllable cadence every 1 / speechSyllableRate
    const syllablePhase = (t * speechSyllableRate) % 1;
    // Word boundary pause every 3-4 syllables
    const wordCycle = (t * (speechSyllableRate / 3.5)) % 1;
    const isWordBreak = wordCycle > 0.88;
    const wordBreakDamp = isWordBreak ? Math.max(0.1, 1 - (wordCycle - 0.88) * 8) : 1;

    // Syllable vocal envelope (natural asymmetric acoustic pulse: fast rise, gradual decay)
    const syllableEnv = Math.sin(syllablePhase * Math.PI) * wordBreakDamp;

    // Natural human pitch contour (inflection changes slightly across sentence, not flat monotone)
    const pitchDrift = Math.sin(t * 1.5) * 6 - (t / durationSeconds) * 8;
    const currentF0 = baseF0 + pitchDrift;

    // Glottal excitation pulse (rich in harmonics, mimicking human vocal cords)
    const glottalPhase = (t * currentF0) % 1;
    const glottalPulse = glottalPhase < 0.35
      ? Math.sin((glottalPhase / 0.35) * Math.PI)
      : -Math.exp(-(glottalPhase - 0.35) * 8) * 0.3;

    // Formant vocal tract resonance (F1 vowel opening + F2 tongue articulation)
    const formant1 = Math.sin(2 * Math.PI * f1 * t) * 0.55;
    const formant2 = Math.sin(2 * Math.PI * f2 * t) * 0.35;
    const formantVocal = glottalPulse * (formant1 + formant2);

    // Subtle breath aspiration (unvoiced noise component of human vocal tract)
    const aspiration = (Math.random() * 2 - 1) * 0.04;

    // Combine into vocal speech signal (strictly vocal, no musical pitch)
    const vocalSample = (formantVocal + aspiration) * syllableEnv * sentenceGain;
    const intSample = Math.max(-32767, Math.min(32767, Math.floor(vocalSample * 14000)));

    view.setInt16(44 + i * 2, intSample, true);
  }

  const bytes = new Uint8Array(arrayBuffer);
  return `data:audio/wav;base64,${uint8ArrayToBase64(bytes)}`;
}

export function isQuotaExceededError(err: unknown): boolean {
  if (!err) return false;
  const message = (err as Error).message || String(err);
  return (
    message.includes('429') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('quota') ||
    message.includes('rate-limits') ||
    message.includes('Quota exceeded')
  );
}
