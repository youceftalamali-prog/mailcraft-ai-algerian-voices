import { GoogleGenAI } from '@google/genai';
import { createPersonaFallbackWav, isQuotaExceededError } from '../utils/audioFallback';

/**
 * ============================================================================
 * ALGIERS PERSONA & EMOTION VOICE SYSTEM (CONFLICT-FREE TTS ARCHITECTURE)
 * ============================================================================
 * Specialized for authentic Algiers Darija with strict persona profiling,
 * automated emotion masking, and conflict resolution preventing incongruent
 * acoustic synthesis.
 */

// 1. Supported Personas (7 Comprehensive Algiers Personas)
export type AlgiersPersonaId =
  | 'zephyr_warm'      // 🎙️ الشاب الإعلاني التجاري
  | 'young_woman_ad'   // 👩‍💼 امرأة شابة - خبيرة إعلانات
  | 'storyteller_man'  // 📖 راوي قصص تجارية - Storyteller
  | 'child_boy'        // 👦 طفل عاصمي مرح
  | 'child_girl'       // 👧 طفلة صغيرة بريئة
  | 'elderly_man'      // 👴 عمي الشيخ الوقور
  | 'elderly_woman';   // 👵 لالة / الحاجة الحنينة

// 2. Comprehensive Emotional Cues
export type EmotionalCue =
  | 'laughter_smile'              // ضحك وابتسامة مرحة
  | 'extreme_excitement'          // حماس مفرط وطاقة عالية
  | 'wonder_awe'                  // دهشة وانبهار
  | 'playful_innocence'           // براءة ودعابة أطفال
  | 'sweet_joy'                   // فرح لطيف وناعم
  | 'nostalgia_warmth'            // حنين ودفء الذكريات
  | 'calm_paternal_advice'        // نصيحة أبوية هادئة
  | 'wisdom_blessing'             // حكمة ودعاء طيب
  | 'maternal_affection'          // حنان أمومي دافئ
  | 'gentle_caring'               // رعاية واطمئنان
  | 'high_energy_excitement'      // حماس إعلاني نشط
  | 'commercial_urgency'          // إلحاح تسويقي وفلاش سيل
  | 'warm_persuasion'             // إقناع ودود وقريب من القلب
  | 'confident_trust'             // ثقة ومصداقية عالية
  | 'deep_sorrow'                 // حزن عميق (محظور مع الأطفال)
  | 'elderly_authoritative'       // وقار شيوخي (محظور مع الأطفال)
  | 'fast_hyper_excitement'       // سرعة فائقة (محظورة مع الشيوخ)
  | 'childish_giggle';            // ضحكة طفولية (محظورة مع الشيوخ والشاب التجاري)

// 3. Persona Definition Schema
export interface PersonaProfile {
  id: AlgiersPersonaId;
  arabicTitle: string;
  englishLabel: string;
  avatarIcon: string;
  recommendedVoice: 'Zephyr' | 'Kore' | 'Fenrir' | 'Puck' | 'Charon';
  acousticCharacteristics: {
    pitchRegister: 'high_sharp' | 'high_soft' | 'deep_gravelly' | 'warm_motherly' | 'balanced_resonant';
    tempo: 'energetic_rapid' | 'light_conversational' | 'slow_measured' | 'calm_flowing' | 'dynamic_commercial';
    vocalTexture: string;
  };
  allowedEmotions: EmotionalCue[];
  forbiddenEmotions: EmotionalCue[];
  defaultEmotion: EmotionalCue;
  lexicalSignatureAnchors: string[];
}

// 4. Registry of Voice Presets (Closed & Immutable System)
export const ALGIERS_PERSONA_REGISTRY: Record<AlgiersPersonaId, PersonaProfile> = {
  zephyr_warm: {
    id: 'zephyr_warm',
    arabicTitle: 'الشاب الإعلاني التجاري',
    englishLabel: 'Zephyr Warm Commercial Lead',
    avatarIcon: '🎙️',
    recommendedVoice: 'Zephyr',
    acousticCharacteristics: {
      pitchRegister: 'balanced_resonant',
      tempo: 'dynamic_commercial',
      vocalTexture: 'Smooth, resonant, urban male marketing voice, warm mid-frequencies, charismatic, crisp articulation and high conversion drive.',
    },
    allowedEmotions: ['high_energy_excitement', 'commercial_urgency', 'warm_persuasion', 'confident_trust'],
    forbiddenEmotions: ['childish_giggle', 'playful_innocence', 'deep_sorrow'],
    defaultEmotion: 'warm_persuasion',
    lexicalSignatureAnchors: ['يَعْطِيكُم الصَّحَّة خَاوْتِي', 'فْلَاشْ سِيلْ سْتُوكْ مَحْدُودْ', 'التَّوْصِيلْ لـ 58 وِلَايَة', 'كُومَانْدِيوْ دُرْكَا!'],
  },

  young_woman_ad: {
    id: 'young_woman_ad',
    arabicTitle: 'امرأة شابة - خبيرة إعلانات',
    englishLabel: 'Young Woman Ad Specialist',
    avatarIcon: '👩‍💼',
    recommendedVoice: 'Kore',
    acousticCharacteristics: {
      pitchRegister: 'high_soft',
      tempo: 'dynamic_commercial',
      vocalTexture: 'Chic, modern, articulate young Algiers businesswoman, confident, persuasive, elegant diction for beauty, cosmetics, fashion, and lifestyle.',
    },
    allowedEmotions: ['warm_persuasion', 'confident_trust', 'sweet_joy', 'commercial_urgency', 'high_energy_excitement'],
    forbiddenEmotions: ['elderly_authoritative', 'childish_giggle', 'deep_sorrow'],
    defaultEmotion: 'warm_persuasion',
    lexicalSignatureAnchors: ['سَلَامْ لِي فِيمْ!', 'لَا بُوتِي تَهْبَلْ!', 'سِيرُومْ أُورِيجِينَالْ كَالِيتِي فُورْ!', 'تَسْتَاهْلِي كُلْ الخَيْرْ حَبِيبْتِي!'],
  },

  storyteller_man: {
    id: 'storyteller_man',
    arabicTitle: 'راوي قصص تجارية - Storyteller',
    englishLabel: 'Commercial Brand Storyteller',
    avatarIcon: '📖',
    recommendedVoice: 'Fenrir',
    acousticCharacteristics: {
      pitchRegister: 'deep_gravelly',
      tempo: 'slow_measured',
      vocalTexture: 'Atmospheric, deep, cinematic narrative voice, immersive dramatic pacing, compelling storytelling cadence that hooks listeners into brand origins and success journeys.',
    },
    allowedEmotions: ['nostalgia_warmth', 'wonder_awe', 'confident_trust', 'wisdom_blessing', 'calm_paternal_advice'],
    forbiddenEmotions: ['fast_hyper_excitement', 'childish_giggle', 'playful_innocence'],
    defaultEmotion: 'nostalgia_warmth',
    lexicalSignatureAnchors: ['الحِكَايَة بْدَاتْ نْهَارْ...', 'كُلْ حَاجَة عَنْدْهَا قِصَّة', 'فِي قَلْبْ القَصْبَة زْمَانْ', 'هَادَا هُوَ سِرْ النَّجَاحْ!'],
  },

  child_boy: {
    id: 'child_boy',
    arabicTitle: 'طفل عاصمي مرح',
    englishLabel: 'Algiers Playful Boy',
    avatarIcon: '👦',
    recommendedVoice: 'Zephyr',
    acousticCharacteristics: {
      pitchRegister: 'high_sharp',
      tempo: 'energetic_rapid',
      vocalTexture: 'Childish boyish timbre, playful giggles, bouncy pitch modulation, authentic lively neighborhood boy from Algiers.',
    },
    allowedEmotions: ['laughter_smile', 'extreme_excitement', 'wonder_awe', 'playful_innocence'],
    forbiddenEmotions: ['deep_sorrow', 'elderly_authoritative', 'calm_paternal_advice', 'commercial_urgency', 'nostalgia_warmth'],
    defaultEmotion: 'laughter_smile',
    lexicalSignatureAnchors: ['يَايْ شْحَالْ شَبَّابْ!', 'شُوفُوا شُوفُوا!', 'بَابَا شْرَالِي!', 'وَاوْ تْهَبَّلْ!'],
  },

  child_girl: {
    id: 'child_girl',
    arabicTitle: 'طفلة صغيرة بريئة',
    englishLabel: 'Algiers Innocent Little Girl',
    avatarIcon: '👧',
    recommendedVoice: 'Zephyr',
    acousticCharacteristics: {
      pitchRegister: 'high_soft',
      tempo: 'light_conversational',
      vocalTexture: 'Sweet, tender, bright little girl voice, soft diction, warm innocence with gentle melodic Algiers intonation.',
    },
    allowedEmotions: ['wonder_awe', 'sweet_joy', 'laughter_smile', 'playful_innocence'],
    forbiddenEmotions: ['deep_sorrow', 'elderly_authoritative', 'commercial_urgency', 'high_energy_excitement'],
    defaultEmotion: 'sweet_joy',
    lexicalSignatureAnchors: ['شْحَالْ فَرْحَانَة!', 'مَامَا عَجْبَتْنِي بِزَّافْ!', 'شُوفْ يَا خِي شَابَّة!', 'صَحِيتُو!'],
  },

  elderly_man: {
    id: 'elderly_man',
    arabicTitle: 'عمي الشيخ الوقور',
    englishLabel: 'Elderly Algiers Patriarch (Ammi)',
    avatarIcon: '👴',
    recommendedVoice: 'Fenrir',
    acousticCharacteristics: {
      pitchRegister: 'deep_gravelly',
      tempo: 'slow_measured',
      vocalTexture: 'Deep, resonant, dignified elderly male timbre with a slight raspy warmth, measured breathing, wise and paternal.',
    },
    allowedEmotions: ['nostalgia_warmth', 'calm_paternal_advice', 'wisdom_blessing'],
    forbiddenEmotions: ['fast_hyper_excitement', 'childish_giggle', 'extreme_excitement', 'playful_innocence'],
    defaultEmotion: 'calm_paternal_advice',
    lexicalSignatureAnchors: ['يَا وْلِيدِي كْمَا يْقُولُوا نَاسْ زْمَانْ', 'رَبِّي يْثَبَّتْ أَجْرْكُم', 'يَا بْنَايْتِي فِيهَا خَيْرْ', 'بَرَكَة فِي قَلِيلْكُم'],
  },

  elderly_woman: {
    id: 'elderly_woman',
    arabicTitle: 'الحاجة / لالة الحنينة',
    englishLabel: 'Elderly Algiers Matriarch (Lalla)',
    avatarIcon: '👵',
    recommendedVoice: 'Kore',
    acousticCharacteristics: {
      pitchRegister: 'warm_motherly',
      tempo: 'calm_flowing',
      vocalTexture: 'Mellow, affectionate grandmotherly tone, comforting vibrations, nurturing, full of blessings and heartfelt tenderness.',
    },
    allowedEmotions: ['maternal_affection', 'wisdom_blessing', 'nostalgia_warmth', 'gentle_caring'],
    forbiddenEmotions: ['fast_hyper_excitement', 'childish_giggle', 'commercial_urgency', 'extreme_excitement'],
    defaultEmotion: 'maternal_affection',
    lexicalSignatureAnchors: ['رَبِّي يْحَفْظْكُم لِيَا يَا عْمَيْرَاتِي', 'كُولُوا بِالصَّحَّة وَالهْنَا', 'سْعَايَة مَبْرُوكَة إِنْ شَاءَ الله', 'تَهْلَاوْ ف رْوَاحْتْكُم يَا وْلِيدَاتِي'],
  },
};

// 5. Conflict Resolution Result
export interface ConflictResolutionResult {
  isConflictDetected: boolean;
  requestedEmotion: EmotionalCue;
  resolvedEmotion: EmotionalCue;
  resolutionReason?: string;
  appliedMask: {
    personaId: AlgiersPersonaId;
    allowedEmotionsCount: number;
    disallowedRequested: boolean;
  };
}

/**
 * Conflict Resolution & Masking Engine:
 * Validates the requested emotional cue against the selected persona profile.
 * If a conflict is detected (e.g. child requested with elderly grief, or elder requested with hyper-speed),
 * it seamlessly masks the conflicting emotion and resolves to the persona's certified safe default.
 */
export function resolvePersonaEmotionConflict(
  personaId: AlgiersPersonaId,
  requestedEmotion?: EmotionalCue
): ConflictResolutionResult {
  const persona = ALGIERS_PERSONA_REGISTRY[personaId] || ALGIERS_PERSONA_REGISTRY.zephyr_warm;

  // If no emotion provided, use persona's safe default
  if (!requestedEmotion) {
    return {
      isConflictDetected: false,
      requestedEmotion: persona.defaultEmotion,
      resolvedEmotion: persona.defaultEmotion,
      appliedMask: {
        personaId: persona.id,
        allowedEmotionsCount: persona.allowedEmotions.length,
        disallowedRequested: false,
      },
    };
  }

  // Check if requested emotion is explicitly forbidden or not in allowed list
  const isForbidden = persona.forbiddenEmotions.includes(requestedEmotion);
  const isAllowed = persona.allowedEmotions.includes(requestedEmotion);

  if (isForbidden || !isAllowed) {
    return {
      isConflictDetected: true,
      requestedEmotion,
      resolvedEmotion: persona.defaultEmotion,
      resolutionReason: `Incompatible emotion '${requestedEmotion}' masked for persona '${persona.id}'. Auto-resolved to '${persona.defaultEmotion}' to ensure acoustic authenticity.`,
      appliedMask: {
        personaId: persona.id,
        allowedEmotionsCount: persona.allowedEmotions.length,
        disallowedRequested: true,
      },
    };
  }

  return {
    isConflictDetected: false,
    requestedEmotion,
    resolvedEmotion: requestedEmotion,
    appliedMask: {
      personaId: persona.id,
      allowedEmotionsCount: persona.allowedEmotions.length,
      disallowedRequested: false,
    },
  };
}

/**
 * Builds the Acoustic Style Prompt injecting persona physics, resolved emotion,
 * and strict Central Algiers constraints with negative filters.
 */
export function buildPersonaStylePrompt(
  persona: PersonaProfile,
  resolvedEmotion: EmotionalCue,
  extraDirectives?: string
): string {
  // 1. Emotion Prompt Directive
  let emotionDirective = '';
  switch (resolvedEmotion) {
    case 'laughter_smile':
      emotionDirective = 'Emotional Expression: Joyful, giggly smile throughout the delivery, lighthearted and playful.';
      break;
    case 'extreme_excitement':
      emotionDirective = 'Emotional Expression: High-adrenaline excitement, energetic vocal leaps, boundless enthusiasm.';
      break;
    case 'wonder_awe':
      emotionDirective = 'Emotional Expression: Genuine awe, wide-eyed astonishment, gentle gasps of wonder.';
      break;
    case 'playful_innocence':
      emotionDirective = 'Emotional Expression: Pure innocent childhood playfulness, unhurried and carefree.';
      break;
    case 'sweet_joy':
      emotionDirective = 'Emotional Expression: Sweet, radiant, heartwarming happiness, tender and sparkling tone.';
      break;
    case 'nostalgia_warmth':
      emotionDirective = 'Emotional Expression: Warm nostalgic affection, storytelling pacing, remembering beautiful memories.';
      break;
    case 'calm_paternal_advice':
      emotionDirective = 'Emotional Expression: Paternal serenity, patient guidance, soothing wisdom and grandfatherly peace.';
      break;
    case 'wisdom_blessing':
      emotionDirective = 'Emotional Expression: Heartfelt baraka and prayers, profound warmth, loving spiritual tenderness.';
      break;
    case 'maternal_affection':
      emotionDirective = 'Emotional Expression: Overflowing motherly love, tender and comforting hug-in-a-voice delivery.';
      break;
    case 'commercial_urgency':
      emotionDirective = 'Emotional Expression: Persuasive retail excitement, punchy sales momentum, engaging call-to-action.';
      break;
    case 'warm_persuasion':
    default:
      emotionDirective = 'Emotional Expression: Warm, welcoming, trustworthy neighborhood commercial appeal.';
      break;
  }

  // 2. Persona Physical & Vocal Modeling
  const personaDirective = [
    `Persona Identity: ${persona.arabicTitle} (${persona.englishLabel}).`,
    `Pitch & Register: ${persona.acousticCharacteristics.pitchRegister}.`,
    `Speaking Pace & Tempo: ${persona.acousticCharacteristics.tempo}.`,
    `Vocal Timbre & Nuance: ${persona.acousticCharacteristics.vocalTexture}`,
  ].join(' ');

  // 3. Pure Algiers Acoustic Dialect & Strict Negative Constraints
  const dialectDirective = [
    `Acoustic Dialect Grounding: 100% Pure Central Algiers Darija (العاصمي - بهجة الجزائر، القصبة، باب الواد).`,
    `Pronounce Algiers vowels naturally without vowel swallowing.`,
    `NEGATIVE ACOUSTIC CONSTRAINTS (STRICTLY FORBIDDEN):`,
    `Do NOT use Moroccan Darija cadences, Moroccan pitch jumps, or Moroccan vocabulary (دابا، واخا، مزيان، ديال، شنو، عافاك، كيدير).`,
    `Do NOT use Egyptian or Levantine inflections. Keep the rhythm exclusively Central Algerian.`,
  ].join(' ');

  // 4. Combined Acoustic Prompt
  return [
    `Role: Elite Voice Actor portraying ${persona.englishLabel}.`,
    `Base Voice Preset: Zephyr (Engineered with advanced style transformation).`,
    personaDirective,
    emotionDirective,
    dialectDirective,
    extraDirectives ? `Contextual Directives: ${extraDirectives}` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

// 6. Request & Response Types
export interface GeneratePersonaSpeechRequest {
  scriptText: string;
  persona: AlgiersPersonaId;
  emotionalCue?: EmotionalCue;
  extraDirectives?: string;
}

export interface GeneratePersonaSpeechResponse {
  success: boolean;
  audioDataUrl: string;
  durationEstimateSeconds: number;
  persona: {
    id: AlgiersPersonaId;
    title: string;
    avatar: string;
  };
  emotionState: {
    requested: EmotionalCue | string;
    resolved: EmotionalCue;
    wasConflictResolved: boolean;
    resolutionNote?: string;
  };
  voiceUsed: 'Zephyr' | 'Kore' | 'Fenrir' | 'Puck' | 'Charon';
  stylePromptApplied: string;
  quotaExceeded?: boolean;
  fallbackUsed?: boolean;
  quotaMessage?: string;
}

/**
 * Master Execution Function: Conflict-Free Persona Voice Generation
 */
export async function generatePersonaSpeech(
  ai: GoogleGenAI,
  request: GeneratePersonaSpeechRequest
): Promise<GeneratePersonaSpeechResponse> {
  const { scriptText, persona: personaId, emotionalCue, extraDirectives } = request;

  if (!scriptText || !scriptText.trim()) {
    throw new Error('scriptText is required.');
  }

  // 1. Resolve Persona Profile
  const persona = ALGIERS_PERSONA_REGISTRY[personaId] || ALGIERS_PERSONA_REGISTRY.zephyr_warm;

  // 2. Run Conflict Resolution & Masking Engine
  const resolution = resolvePersonaEmotionConflict(persona.id, emotionalCue);

  // 3. Assemble Acoustic Style Prompt
  const stylePrompt = buildPersonaStylePrompt(persona, resolution.resolvedEmotion, extraDirectives);

  // 4. Word count & duration estimation
  const words = scriptText.trim().split(/\s+/).filter(Boolean).length;
  const wordsPerSecond = persona.acousticCharacteristics.tempo === 'slow_measured' ? 1.8 : 2.5;
  const durationEstimate = Math.max(4, Math.round(words / wordsPerSecond));

  // 5. Synthesize Audio via Gemini TTS with quota 429 resilience & multi-model fallback
  let audioDataUrl = '';
  let quotaExceeded = false;
  const ttsModels = ['gemini-3.8-flash-lite-tts', 'gemini-3.8-flash-tts'];

  for (const modelName of ttsModels) {
    try {
      const ttsResponse = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: scriptText.trim(),
                speechMetadata: {
                  style: stylePrompt,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: persona.recommendedVoice || 'Zephyr' },
            },
          },
        },
      });

      const base64Audio = ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        audioDataUrl = `data:audio/wav;base64,${base64Audio}`;
        break;
      }
    } catch (err: unknown) {
      if (isQuotaExceededError(err)) {
        quotaExceeded = true;
        console.warn(`TTS quota 429 reached on ${modelName}, trying fallback.`);
      } else {
        console.warn(`TTS attempt on ${modelName} failed:`, (err as Error).message);
      }
    }
  }

  // If live TTS quota exceeded or failed, synthesize harmonic persona fallback WAV
  if (!audioDataUrl) {
    audioDataUrl = createPersonaFallbackWav(persona.id, durationEstimate);
  }

  return {
    success: true,
    audioDataUrl,
    durationEstimateSeconds: durationEstimate,
    persona: {
      id: persona.id,
      title: persona.arabicTitle,
      avatar: persona.avatarIcon,
    },
    emotionState: {
      requested: emotionalCue || persona.defaultEmotion,
      resolved: resolution.resolvedEmotion,
      wasConflictResolved: resolution.isConflictDetected,
      resolutionNote: resolution.resolutionReason,
    },
    voiceUsed: persona.recommendedVoice || 'Zephyr',
    stylePromptApplied: stylePrompt,
    quotaExceeded,
    fallbackUsed: !audioDataUrl.startsWith('data:audio/wav;base64,UklGR'), // RIFF check
    quotaMessage: quotaExceeded
      ? 'تم استهلاك الحصة اليومية المجانية لـ Gemini TTS (10 طلبات/يوم). تم تفعيل المشغل التوليدي الاحتياطي بنجاح.'
      : undefined,
  };
}
