import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Sparkles,
  Volume2,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Wand2,
  AlertTriangle,
  Info,
  Flame,
  Clock,
  Send,
  Link2,
  Globe,
  ShoppingBag,
  Tag,
  ExternalLink,
  CreditCard,
  X,
  Zap,
  Lock,
  ArrowRight,
  HelpCircle,
  Building2,
  PhoneCall
} from 'lucide-react';
import {
  AlgiersPersonaId,
  EmotionalCue,
  ALGIERS_PERSONA_REGISTRY,
} from '../services/algerianPersonaVoiceService';
import { ExtractedProductData } from '../services/productScraperService';

export type UserPlanTier = 'free_trial' | 'starter' | 'pro' | 'business';

interface PersonaVoiceGeneratorProps {
  onUseInCampaign?: (text: string) => void;
  currentUserEmail?: string | null;
  onNavigateToPricing?: () => void;
}

// Preset store URLs for 1-click test
const SAMPLE_STORE_URLS = [
  { label: '⌚ ساعة ذكية مقاومة للماء', url: 'https://algeria-tech-store.dz/products/smartwatch-ultra-dz' },
  { label: '👟 حذاء رياضي أصلي ومريح', url: 'https://sport-fashion.dz/products/sneakers-air-pro' },
  { label: '👗 قفطان عاصمي تقليدي راقي', url: 'https://dar-el-bahdja.dz/products/caftan-algerois-prestige' },
  { label: '🎧 سماعات لاسلكية عازلة للضوضاء', url: 'https://dz-gadgets.com/products/wireless-earbuds-pro' },
];

// Preset quick samples for each persona
const PERSONA_SAMPLE_SCRIPTS: Record<AlgiersPersonaId, { title: string; script: string }> = {
  zephyr_warm: {
    title: 'فلاش سيل وتخفيضات 40%',
    script:
      'يا خاوتي الفلاش سيل راهو بدا! بري شوك وتخفيض 40% على كامل لا كوليكسيون الجديدة. الستوك راهو محدود بزاف، ديرو لا كوموند تاعكم دركا قبل ما يخلاص، ولا ليفريزون حتال باب الدار والدفع عند الاستلام!',
  },
  young_woman_ad: {
    title: 'مستحضرات التجميل والأناقة العصرية',
    script:
      'سلام لي فيم! جبتلكم اليوم هاد السيروم الفوقاني في لا كاليتي. حاجة طوب للبشرة ونضارة تهبل من أول سمانة! بري فور بزاف وديرو لا كوموند تاعكم دركا خياتي، التوصيل متوفر لـ 58 ولاية والدفع بعد المعاينة عند الاستلام!',
  },
  storyteller_man: {
    title: 'سرد درامي ملهم وقصة نجاح المنتج',
    script:
      'الحكاية بدات نهار حوسنا على منتج أصيل يخدم العائلات الجزائرية بحرفية وإتقان.. واليوم رانا فخورين نقدمولكم هاد التحفة. ماشي مجرد سلعة، هادي حكاية ثقة وراحة تدوم. اطلبوه دركا، والتوصيل واصل لباب داركم في 58 ولاية.',
  },
  child_boy: {
    title: 'فرحة طفل بلعبة جديدة',
    script:
      'ياي شوفوا بابا واش شرالي! هاد البيسيكلات شحال شابة وتهبل بزاف بزاف! سريعة وفور، ميرسي بابا ربي يحفظك، دوك نلعب بيها مع ولاد الحومة! اطلبوها لوليداتكم، والتوصيل واصل لباب الدار!',
  },
  child_girl: {
    title: 'طفلة فرحانة بملابس العيد',
    script:
      'شحال فرحانة اليوم! ماما شراتلي هاد الروبة الوردية شحال شابة وعجبتني بزاف! شكراً ماما نحبك بزاف، شوفو شحال جاتني مليحة! كومانداوها دركا لبناتكم والتوصيل لـ 58 ولاية!',
  },
  elderly_man: {
    title: 'نصيحة وبركة عمي الشيخ',
    script:
      'يا وليداتي، كما يقولوا ناس زمان، البركة في القليل والتجارة بالصدق والنية الصافية هي اللي تعيش. سلعة نقية ومضمونة، والتوصيل واصل حتال عندكم في 58 ولاية والدفع عند الاستلام، ربي يثبت أجركم.',
  },
  elderly_woman: {
    title: 'دعاء وبركة الحاجة الحنينة',
    script:
      'ربي يحفظكم ليا يا وليداتي وعميراتي، سعاية مبروكة إن شاء الله! هاد القش تاع الشتا دافي بزاف وحنين، تلبسوه بالصحة والراحة والهنا، وتهلاو في رواحتكم. التوصيل متوفر لـ 58 ولاية وبصحتكم مسبقاً!',
  },
};

// Emotion labels in Arabic with emojis
const EMOTION_LABELS: Record<EmotionalCue, { label: string; icon: string; desc: string }> = {
  laughter_smile: { label: 'ضحكة وابتسامة مرحة', icon: '😂', desc: 'نبرة ضاحكة ومرحة ومبتهجة' },
  extreme_excitement: { label: 'حماس مفرط وطاقة عالية', icon: '⚡', desc: 'قفزات صوتية وطاقة متفجرة' },
  wonder_awe: { label: 'دهشة وانبهار', icon: '🤩', desc: 'شهقات انبهار وعيون مفتوحة' },
  playful_innocence: { label: 'براءة ودعابة أطفال', icon: '🎈', desc: 'براءة طفولية عفوية دون استعجال' },
  sweet_joy: { label: 'فرح لطيف وناعم', icon: '🌸', desc: 'فرح رقيق دافئ يلمس القلب' },
  nostalgia_warmth: { label: 'حنين ودفء الذكريات', icon: '📻', desc: 'نبرة الحكواتي وذكريات زمان' },
  calm_paternal_advice: { label: 'نصيحة أبوية هادئة', icon: '🕊️', desc: 'وقار وهدوء وسكينة شيوخ' },
  wisdom_blessing: { label: 'حكمة ودعاء طيب', icon: '🤲', desc: 'بركة ودعاء من القلب' },
  maternal_affection: { label: 'حنان أمومي دافئ', icon: '💖', desc: 'حضن صوتي مفعم بالعاطفة' },
  gentle_caring: { label: 'رعاية واطمئنان', icon: '🌿', desc: 'صوت مريح يبعث الأمان' },
  high_energy_excitement: { label: 'حماس إعلاني نشط', icon: '🔥', desc: 'طاقة تسويقية وبيع فوري' },
  commercial_urgency: { label: 'إلحاح تسويقي وفلاش سيل', icon: '⏳', desc: 'تسارع وإلحاح لنفاد المخزون' },
  warm_persuasion: { label: 'إقناع ودود (ولاد الحومة)', icon: '🤝', desc: 'قريب من القلب وموثوق' },
  confident_trust: { label: 'ثقة ومصداقية عالية', icon: '🛡️', desc: 'نبرة علامة تجارية رائدة' },
  deep_sorrow: { label: 'حزن عميق (محظور مع الأطفال)', icon: '😢', desc: 'نبرة حزينة' },
  elderly_authoritative: { label: 'وقار شيوخي (محظور مع الأطفال)', icon: '🏛️', desc: 'سلطة ووقار' },
  fast_hyper_excitement: { label: 'سرعة فائقة (محظورة مع الشيوخ)', icon: '🏎️', desc: 'سرعة قياسية' },
  childish_giggle: { label: 'ضحكة طفولية (محظورة مع الشيوخ)', icon: '👶', desc: 'ضحكة رضيع' },
};

export const PersonaVoiceGenerator: React.FC<PersonaVoiceGeneratorProps> = ({
  onUseInCampaign,
  currentUserEmail,
  onNavigateToPricing,
}) => {
  // Plan & Trial State Management
  const [userPlan, setUserPlan] = useState<UserPlanTier>(() => {
    const saved = localStorage.getItem('dz_audio_user_plan');
    return (saved as UserPlanTier) || 'free_trial';
  });

  const [freeTrialUsed, setFreeTrialUsed] = useState<boolean>(() => {
    return localStorage.getItem('dz_audio_free_trial_used') === 'true';
  });

  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [copiedRipModal, setCopiedRipModal] = useState(false);

  // Form State
  const [selectedPersonaId, setSelectedPersonaId] = useState<AlgiersPersonaId>('zephyr_warm');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionalCue>('warm_persuasion');
  const [scriptText, setScriptText] = useState<string>(PERSONA_SAMPLE_SCRIPTS.zephyr_warm.script);
  const [extraDirectives, setExtraDirectives] = useState<string>('');

  // Product URL Scraper State
  const [productUrl, setProductUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedProduct, setScrapedProduct] = useState<ExtractedProductData | null>(null);
  const [scrapingError, setScrapingError] = useState<string | null>(null);

  // Generation & Status State
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [justFinishedFreeTrial, setJustFinishedFreeTrial] = useState(false);

  // Result State
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const [resultMetadata, setResultMetadata] = useState<{
    personaTitle: string;
    personaAvatar: string;
    requestedEmotion: string;
    resolvedEmotion: EmotionalCue;
    wasConflictResolved: boolean;
    resolutionNote?: string;
    durationSeconds: number;
    voiceUsed: string;
    quotaExceeded?: boolean;
    quotaMessage?: string;
  } | null>(null);

  // Audio Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(15);
  const [copiedScript, setCopiedScript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentPersona = ALGIERS_PERSONA_REGISTRY[selectedPersonaId];

  // Max characters allowed based on plan
  const maxScriptCharacters = userPlan === 'free_trial' ? 500 : 2500;
  const isScriptTooLong = scriptText.length > maxScriptCharacters;

  // Auto-update emotion to default when persona changes
  const handlePersonaSelect = (personaId: AlgiersPersonaId) => {
    setSelectedPersonaId(personaId);
    const newPersona = ALGIERS_PERSONA_REGISTRY[personaId];
    setSelectedEmotion(newPersona.defaultEmotion);

    // Auto-suggest sample script if current script is empty or was previous sample
    const isCurrentSample = Object.values(PERSONA_SAMPLE_SCRIPTS).some(
      (s) => s.script === scriptText
    );
    if (!scriptText.trim() || isCurrentSample) {
      setScriptText(PERSONA_SAMPLE_SCRIPTS[personaId].script);
    }
  };

  // Handle URL scraping and automated AI ad script generation
  const handleScrapeAndGenerateScript = async (targetUrl?: string) => {
    const urlToUse = (targetUrl || productUrl).trim();
    if (!urlToUse || isScraping) return;

    // Check if free trial already consumed
    if (userPlan === 'free_trial' && freeTrialUsed) {
      setShowUpgradeModal(true);
      return;
    }

    if (targetUrl) {
      setProductUrl(targetUrl);
    }

    setIsScraping(true);
    setScrapingError(null);

    try {
      const res = await fetch('/api/generate-script-from-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productUrl: urlToUse,
          persona: selectedPersonaId,
          campaignType: 'ecommerce_flash_sale',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `خطأ أثناء استخراج تفاصيل المنتج (${res.status})`);
      }

      const data = await res.json();
      setScrapedProduct(data.extractedProduct);

      // Ensure script respects free trial length
      let cleanScript = data.generatedScript || '';
      if (userPlan === 'free_trial' && cleanScript.length > 500) {
        cleanScript = cleanScript.slice(0, 495) + '...';
      }
      setScriptText(cleanScript);

      // If suggested emotion is allowed by persona, set it
      if (data.suggestedEmotion && currentPersona.allowedEmotions.includes(data.suggestedEmotion)) {
        setSelectedEmotion(data.suggestedEmotion);
      }
    } catch (err: unknown) {
      console.error('URL scraping error:', err);
      setScrapingError(
        err instanceof Error
          ? err.message
          : 'تعذر جلب تفاصيل المنتج من الرابط. يرجى التأكد من صحة الرابط.'
      );
    } finally {
      setIsScraping(false);
    }
  };

  // Generate Audio Handler with Free Trial Gate
  const handleGenerateVoice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!scriptText.trim() || isGenerating) return;

    // Gate: Check if user is on free trial and has already used it
    if (userPlan === 'free_trial' && freeTrialUsed) {
      setShowUpgradeModal(true);
      return;
    }

    // Gate: Check script character limit
    if (isScriptTooLong) {
      setErrorMessage(
        `نص السكريبت يتجاوز الحد الأقصى للخطة المجانية (${scriptText.length} من أصل ${maxScriptCharacters} حرف). يرجى تقصير السكريبت أو الترقية.`
      );
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setJustFinishedFreeTrial(false);

    try {
      const response = await fetch('/api/generate-persona-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptText: scriptText.trim(),
          persona: selectedPersonaId,
          emotionalCue: selectedEmotion,
          extraDirectives: extraDirectives.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `خطأ في الخادم (${response.status})`);
      }

      const data = await response.json();

      setGeneratedAudioUrl(data.audioDataUrl);
      setResultMetadata({
        personaTitle: data.persona.title,
        personaAvatar: data.persona.avatar,
        requestedEmotion: data.emotionState.requested,
        resolvedEmotion: data.emotionState.resolved,
        wasConflictResolved: data.emotionState.wasConflictResolved,
        resolutionNote: data.emotionState.resolutionNote,
        durationSeconds: data.durationEstimateSeconds,
        voiceUsed: data.voiceUsed,
        quotaExceeded: data.quotaExceeded,
        quotaMessage: data.quotaMessage,
      });

      // If user was on free trial, mark it as consumed now!
      if (userPlan === 'free_trial' && !freeTrialUsed) {
        setFreeTrialUsed(true);
        localStorage.setItem('dz_audio_free_trial_used', 'true');
        setJustFinishedFreeTrial(true);
      }

      // Initialize audio playback
      if (data.audioDataUrl) {
        if (audioRef.current) {
          audioRef.current.pause();
        }
        const audio = new Audio(data.audioDataUrl);
        audio.onloadedmetadata = () => {
          if (audio.duration && !isNaN(audio.duration)) {
            setAudioDuration(audio.duration);
          }
        };
        audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
        audio.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };
        audioRef.current = audio;
        audio.play().catch(() => {});
        setIsPlaying(true);
      }
    } catch (err: unknown) {
      console.error('Error generating persona speech:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'فشل في معالجة وتوليد الصوت. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleAudio = () => {
    if (!audioRef.current && generatedAudioUrl) {
      const audio = new Audio(generatedAudioUrl);
      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) setAudioDuration(audio.duration);
      };
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      audioRef.current = audio;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleDownloadWav = () => {
    if (!generatedAudioUrl) return;
    const a = document.createElement('a');
    a.href = generatedAudioUrl;
    a.download = `algiers-ad-${selectedPersonaId}-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(scriptText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleUpgradeToProSimulated = () => {
    setUserPlan('pro');
    localStorage.setItem('dz_audio_user_plan', 'pro');
    setShowUpgradeModal(false);
  };

  const handleResetDemoTrial = () => {
    setUserPlan('free_trial');
    setFreeTrialUsed(false);
    localStorage.removeItem('dz_audio_free_trial_used');
    localStorage.removeItem('dz_audio_user_plan');
    setJustFinishedFreeTrial(false);
    setShowUpgradeModal(false);
  };

  const handleCopyRip = () => {
    navigator.clipboard.writeText('00799999002345678921');
    setCopiedRipModal(true);
    setTimeout(() => setCopiedRipModal(false), 2500);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <div className="space-y-8" dir="rtl">
      {/* Studio Header Banner with Account Plan Status */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          
          {/* Top Status & Plan Pill Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-sm font-bold">
                🎙️
              </span>
              <span className="text-xs font-bold text-slate-300">
                استوديو الإعلانات الصوتية العاصمية
              </span>
              {currentUserEmail && (
                <span className="text-xs font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                  {currentUserEmail}
                </span>
              )}
            </div>

            {/* Plan Badge & Action */}
            <div className="flex items-center gap-2">
              {userPlan === 'free_trial' ? (
                freeTrialUsed ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      <span>تم استهلاك التجربة المجانية (1/1)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowUpgradeModal(true)}
                      className="px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 shadow-md cursor-pointer transition-all"
                    >
                      ترقية الخطة الآن 💳
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>الخطة المجانية: متبقي 1 تجربة إعلان كاملة (أقل من 500 حرف)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowUpgradeModal(true)}
                      className="text-[11px] text-indigo-300 hover:text-white underline cursor-pointer"
                    >
                      باقات الترقية
                    </button>
                  </div>
                )
              ) : (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>باقة نشطة: {userPlan === 'starter' ? 'Starter (50 إعلان)' : userPlan === 'pro' ? 'Pro E-Commerce (غير محدود)' : 'Agency (شركات)'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleResetDemoTrial}
                    title="الرجوع للوضع التجريبي للاختبار"
                    className="text-[10px] text-slate-400 hover:text-amber-400 underline cursor-pointer"
                  >
                    إعادة ضبط الخطة
                  </button>
                </div>
              )}
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-sans">
            استوديو إعلانات التجارة الإلكترونية العاصمية 🎙️🇩🇿
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-2.5 leading-relaxed font-sans max-w-3xl">
            اختر شخصيتك الإعلانية المفضلة من بين 7 شخصيات احترافية لتوليد صوت إعلاني حقيقي باللهجة الجزائرية
            العاصمية الصافية، مع دمج المصطلحات الفرنسية التجارية (Code-Switching) وضمانات التوصيل لـ 58 ولاية.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-indigo-200">
            <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-indigo-700/40">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>محرك حجب المشاعر المتعارضة آلياً (Conflict-Free)</span>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-indigo-700/40">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>أصوات Gemini المتخصصة (Zephyr / Kore / Fenrir)</span>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-indigo-700/40">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>حظر كامل للكلمات والنبرات الدخيلة (Negative Moroccan Filters)</span>
            </span>
          </div>
        </div>
      </div>

      {/* Trial Exhausted Persistent Banner in Studio */}
      {userPlan === 'free_trial' && freeTrialUsed && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/80 via-slate-900 to-indigo-950/80 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3 text-right">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 text-xl font-bold">
              ⏳
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white">
                تم استهلاك التجربة المجانية الممنوحة لحسابك (1 إعلان صوتي كامل)
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                يمكنك الاستماع للإعلان المحمّل أعلاه في أي وقت. لإنتاج المزيد من الإعلانات الصوتية بدون قيود، قم بالترقية عبر بريدي موب أو البطاقة الذهبية.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowUpgradeModal(true)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-extrabold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              ترقية الحساب الآن 💳
            </button>
            <button
              type="button"
              onClick={handleResetDemoTrial}
              className="px-3 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 transition-all cursor-pointer"
              title="إعادة تعيين التجربة للمطور والمختبر"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Celebratory Banner after using the 1 Free Trial */}
      {justFinishedFreeTrial && (
        <div className="p-4 sm:p-5 rounded-3xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-between gap-3 text-emerald-200 text-xs sm:text-sm animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              <strong>🎉 مبروك!</strong> قمت بتوليد إعلانك التجريبي المجاني الأول بنجاح، يمكنك الآن الاستماع إليه وتحميله مجاناً بصيغة WAV أدناه.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setJustFinishedFreeTrial(false)}
            className="text-xs text-emerald-400 underline cursor-pointer shrink-0"
          >
            حسناً
          </button>
        </div>
      )}

      {/* Main Studio Interface Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-7">
        
        {/* Section 1: Persona Selection Cards (7 Personas) */}
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <label className="text-sm font-extrabold text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-mono">1</span>
              <span>اختر الشخصية الصوتية الإعلانية (7 Voice Personas):</span>
            </label>
            <span className="text-xs text-slate-400 font-semibold">
              شخصية نشطة: <strong className="text-indigo-300">{currentPersona.arabicTitle}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3.5">
            {(Object.values(ALGIERS_PERSONA_REGISTRY) as Array<typeof currentPersona>).map((persona) => {
              const isSelected = selectedPersonaId === persona.id;

              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => handlePersonaSelect(persona.id)}
                  className={`text-right p-4 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? 'bg-gradient-to-b from-indigo-950/90 to-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/40'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  {/* Active Indicator Pip */}
                  {isSelected && (
                    <div className="absolute top-2.5 left-2.5 w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                  )}

                  <div>
                    <div className="text-3xl mb-2.5 transform group-hover:scale-110 transition-transform">
                      {persona.avatarIcon}
                    </div>

                    <h3 className="text-sm font-extrabold text-white">
                      {persona.arabicTitle}
                    </h3>

                    <div className="text-[11px] font-mono text-indigo-400 font-semibold mt-0.5">
                      {persona.id}
                    </div>

                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {persona.acousticCharacteristics.vocalTexture}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                      {persona.acousticCharacteristics.tempo === 'energetic_rapid'
                        ? 'إيقاع سريع'
                        : persona.acousticCharacteristics.tempo === 'slow_measured'
                        ? 'إيقاع وقور'
                        : 'إيقاع تجاري'}
                    </span>
                    <span className="text-indigo-400 font-bold">
                      {isSelected ? 'محدد حالياً ✓' : 'اختيار'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Dynamic Emotion Selection */}
        <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label htmlFor="emotion-dropdown" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-mono">2</span>
                <span>تحديد النبرة العاطفية الإعلانية (Emotional Cue):</span>
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                الشخصيات مبرمجة لحظر التناقضات تلقائياً (مثلاً: حظر الوقار المفرط مع الأطفال، وحظر الهستيريا الطفولية مع الشيوخ).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">المشاعر المتاحة للشخصية:</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {currentPersona.allowedEmotions.length} نبرات معتمدة
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {currentPersona.allowedEmotions.map((emotionKey) => {
              const info = EMOTION_LABELS[emotionKey] || {
                label: emotionKey,
                icon: '🎙️',
                desc: 'نبرة صوتية متوافقة',
              };
              const isSelected = selectedEmotion === emotionKey;

              return (
                <button
                  key={emotionKey}
                  type="button"
                  onClick={() => setSelectedEmotion(emotionKey)}
                  className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-md shadow-indigo-600/30 ring-1 ring-indigo-500'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">{info.icon}</span>
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{info.label}</span>
                      {isSelected && <span className="text-emerald-400 text-[10px]">✓</span>}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                      {info.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Product Store URL Scraper & AI Ad Generator */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label htmlFor="product-url-input" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-mono">3</span>
                <span>استخراج تفاصيل المنتج وصياغة السكريبت آلياً من الرابط (URL Scraper):</span>
              </label>
              <p className="text-[11px] text-slate-400 mt-0.5">
                ضع رابط منتج من أي متجر جزائري (Shopify, WooCommerce, YouCan) ليقوم الذكاء الاصطناعي باستخراج السعر والمميزات وصياغة سكريبت عاصمي متكامل.
              </p>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/40">
              ⚡ توليد فوري + 58 ولاية + COD
            </span>
          </div>

          {/* Quick Preset Sample Store URLs */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-400 font-semibold">روابط تجريبية سريعة:</span>
            {SAMPLE_STORE_URLS.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleScrapeAndGenerateScript(sample.url)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 hover:bg-indigo-600/30 border border-slate-700/80 hover:border-indigo-500/50 text-slate-200 transition-all cursor-pointer flex items-center gap-1"
              >
                <span>{sample.label}</span>
              </button>
            ))}
          </div>

          {/* URL Input Form */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <div className="relative flex-1">
              <Link2 className="w-4 h-4 text-slate-500 absolute top-3.5 right-3.5 pointer-events-none" />
              <input
                id="product-url-input"
                type="url"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                placeholder="https://yourstore.dz/products/air-fryer-pro"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>

            <button
              type="button"
              onClick={() => handleScrapeAndGenerateScript()}
              disabled={isScraping || !productUrl.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md shadow-emerald-600/30 shrink-0"
            >
              {isScraping ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>جاري السحب وصياغة الإعلان...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>جلب وصياغة السكريبت آلياً</span>
                </>
              )}
            </button>
          </div>

          {/* Scraping Error Notice */}
          {scrapingError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center justify-between">
              <span>{scrapingError}</span>
              <button
                type="button"
                onClick={() => setScrapingError(null)}
                className="underline text-red-300 hover:text-white cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          )}

          {/* Scraped Product Badge */}
          {scrapedProduct && (
            <div className="p-3.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
                  🛍️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{scrapedProduct.title}</span>
                    {scrapedProduct.price && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {scrapedProduct.price}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                    {scrapedProduct.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> تم سحب البيانات وصياغة السكريبت بنجاح!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Script Input Field with Real-Time Limit Enforcement */}
        <form onSubmit={handleGenerateVoice} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="ad-script-textarea" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-mono">4</span>
                <span>النص الإعلاني بالدارجة العاصمية (مع دمج الكلمات الفرنسية التجارية):</span>
              </label>

              {/* Sample loader */}
              <button
                type="button"
                onClick={() => setScriptText(PERSONA_SAMPLE_SCRIPTS[selectedPersonaId].script)}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>إدراج نموذج تقليدي ({PERSONA_SAMPLE_SCRIPTS[selectedPersonaId].title})</span>
              </button>
            </div>

            <textarea
              id="ad-script-textarea"
              rows={4}
              maxLength={maxScriptCharacters}
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="اكتب سكريبت الإعلان هنا بالدارجة العاصمية... مثلاً: يا خاوتي الفلاش سيل راهو بدا! بري شوك وتخفيض 40%، لا ليفريزون متوفرة لـ 58 ولاية والدفع عند الاستلام..."
              required
              className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-4 text-sm sm:text-base text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y min-h-[110px] leading-relaxed"
            />

            {/* Character & Plan Limit Counter */}
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-2">
                <span>الكلمات: {scriptText.trim().split(/\s+/).filter(Boolean).length}</span>
                <span>•</span>
                <span>المدة المتوقعة: ~{Math.max(5, Math.round(scriptText.trim().split(/\s+/).filter(Boolean).length / 2.5))} ثانية</span>
              </span>

              {/* Character Limit Badge */}
              <div className="flex items-center gap-2">
                <span className="text-indigo-400 font-semibold hidden sm:inline">
                  يدعم المصطلحات: Livraison, Prix, Stock, Commande
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md font-mono font-bold ${
                    scriptText.length > maxScriptCharacters * 0.9
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {scriptText.length} / {maxScriptCharacters} حرف {userPlan === 'free_trial' && '(خطة تجريبية)'}
                </span>
              </div>
            </div>
          </div>

          {/* Optional Directives Field */}
          <div>
            <label htmlFor="extra-directives-input" className="block text-xs font-bold text-slate-400 mb-1">
              تعليمات نطق إضافية (اختياري - Phonetic Directives):
            </label>
            <input
              id="extra-directives-input"
              type="text"
              value={extraDirectives}
              onChange={(e) => setExtraDirectives(e.target.value)}
              placeholder="مثال: ركز على كلمة 'بزاف' بنبرة حماسية، وخفف السرعة عند ذكر رقم الهاتف أو التوصيل"
              className="w-full bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Error Alert if any */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="underline text-red-300 hover:text-white cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isGenerating || !scriptText.trim()}
            className="w-full py-4 px-6 rounded-2xl font-extrabold text-sm sm:text-base text-slate-950 bg-gradient-to-r from-indigo-400 via-teal-300 to-emerald-400 hover:from-indigo-300 hover:to-emerald-300 shadow-xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGenerating ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-3 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                <span>جاري معالجة الصوت العاصمي وضبط المشاعر عبر Gemini TTS...</span>
              </div>
            ) : userPlan === 'free_trial' && freeTrialUsed ? (
              <>
                <Lock className="w-5 h-5 text-slate-950" />
                <span>استهلكت التجربة المجانية • انقر هنا لترقية الخطة 💳</span>
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5 text-slate-950" />
                <span>
                  توليد الصوت الإعلاني ({currentPersona.arabicTitle})
                  {userPlan === 'free_trial' ? ' • التجربة المجانية 🎁' : ''}
                </span>
                <Sparkles className="w-4 h-4 text-slate-950" />
              </>
            )}
          </button>
        </form>

        {/* Section 5: Output Audio Player & Actions */}
        {generatedAudioUrl && resultMetadata && (
          <div className="mt-6 pt-6 border-t border-slate-800 space-y-5 animate-fadeIn">
            {/* Conflict Resolution Note Alert (If conflict occurred) */}
            {resultMetadata.wasConflictResolved && (
              <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-amber-300 mb-0.5">
                    تنبيه محرك فض الاشتباك الصوتي (Conflict Masking Applied):
                  </strong>
                  <span>{resultMetadata.resolutionNote}</span>
                </div>
              </div>
            )}

            {/* Quota Exceeded / Fallback Synthesizer Notice */}
            {resultMetadata.quotaExceeded && (
              <div className="p-4 rounded-2xl bg-indigo-950/70 border border-indigo-500/50 text-indigo-200 text-xs flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-indigo-300 mb-0.5">
                    ملاحظة الحصة المجانية لمحرك Gemini TTS (Rate Limit Notice):
                  </strong>
                  <span>
                    تم استهلاك الحد اليومي المجاني (10 طلبات/يوم لنموذج flash-lite-tts). تم تشغيل مشغل الاستوديو الصوتي التوليدي الاحتياطي بنجاح لضمان استمرار عمل الإعلانات وتشغيل وتحميل ملف WAV دون توقف الخدمة.
                  </span>
                </div>
              </div>
            )}

            {/* Audio Header & Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-2xl">
                  {resultMetadata.personaAvatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">
                      صوت الإعلان جاهز: {resultMetadata.personaTitle}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      WAV 24kHz
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    النبرة المطبقة: <strong className="text-amber-300">{EMOTION_LABELS[resultMetadata.resolvedEmotion]?.label || resultMetadata.resolvedEmotion}</strong> • الصوت الأساسي: {resultMetadata.voiceUsed}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Download & Copy */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadWav}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل ملف الإعلان (WAV) مجاناً</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer border border-slate-700"
                >
                  {copiedScript ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedScript ? 'تم النسخ' : 'نسخ النص'}</span>
                </button>
              </div>
            </div>

            {/* Interactive Waveform / Playback Bar */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>{Math.floor(currentTime)}s</span>
                <span className="text-indigo-400 font-sans font-bold text-[11px]">
                  {isPlaying ? 'جاري التشغيل...' : 'متوقف'}
                </span>
                <span>{Math.round(audioDuration)}s</span>
              </div>

              <input
                type="range"
                min={0}
                max={audioDuration || 15}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={toggleAudio}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-400/30 transition-all cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-slate-950" />
                      <span>إيقاف مؤقت</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>استماع للإعلان الآن</span>
                    </>
                  )}
                </button>

                {onUseInCampaign && (
                  <button
                    type="button"
                    onClick={() => onUseInCampaign(scriptText)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/50 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إدراج في حملة البريد</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* UPGRADE MODAL (النافذة المنبثقة لترقية الخطة بالدينار الجزائري) */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="relative w-full max-w-3xl rounded-3xl bg-slate-900 border border-indigo-500/40 p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
            
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 mb-3">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>انتهت التجربة المجانية (1 إعلان تم استهلاكه)</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                قم بترقية باقتك لمواصلة إنتاج الإعلانات الصوتية 🚀
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-xl mx-auto">
                اختر الباقة المناسبة لمتجرك مع إمكانية الدفع المحلي السهل بالدينار الجزائري عبر بريدي موب (BaridiMob) أو البطاقة الذهبية (Edahabia).
              </p>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Starter */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase">للمبتدئين</span>
                  <h3 className="text-base font-extrabold text-white">باقة الانطلاق (Starter)</h3>
                  <div className="my-3">
                    <span className="text-2xl font-black text-white font-mono">2,900</span>
                    <span className="text-xs text-slate-400 mr-1">دج / شهرياً</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>50 إعلان صوتي شهرياً</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>جميع الشخصيات السبعة</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>استخراج المنتجات من الروابط</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Pro (Highlighted) */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-indigo-950 to-slate-900 border-2 border-emerald-500 shadow-xl flex flex-col justify-between relative">
                <span className="absolute -top-2.5 right-1/2 translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-slate-950 uppercase">
                  الأكثر طلباً ⭐
                </span>
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">للمحترفين</span>
                  <h3 className="text-base font-extrabold text-white">باقة Pro E-Commerce</h3>
                  <div className="my-3">
                    <span className="text-2xl font-black text-emerald-300 font-mono">5,900</span>
                    <span className="text-xs text-slate-300 mr-1">دج / شهرياً</span>
                  </div>
                  <ul className="text-xs text-slate-200 space-y-2">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span><strong>توليد إعلانات غير محدود</strong></span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>أولوية سرعة قصوى للخوادم</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>دعم فني خاص عبر WhatsApp</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Agency */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase">للشركات</span>
                  <h3 className="text-base font-extrabold text-white">باقة الوكالات (Agency)</h3>
                  <div className="my-3">
                    <span className="text-2xl font-black text-white font-mono">14,500</span>
                    <span className="text-xs text-slate-400 mr-1">دج / شهرياً</span>
                  </div>
                  <ul className="text-xs text-slate-300 space-y-2">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>كل ميزات باقة Pro</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>حتى 5 حسابات فريق</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>فواتير رسمية للضرائب</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Local Payment Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">الدفع المحلي عبر تطبيق بريدي موب (BaridiMob):</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">تفعيل خلال 15 دقيقة</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-400">رقم الـ RIP للتحويل:</div>
                  <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5" dir="ltr">
                    00799999002345678921
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRip}
                  className="px-3 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  {copiedRipModal ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRipModal ? 'تم النسخ' : 'نسخ RIP'}</span>
                </button>
              </div>

              <p className="text-[11px] text-slate-400">
                بعد إتمام التحويل، يرجى إرسال صورة الوصل مع إيميل حسابك للدعم ليتم تفعيل حسابك مباشرة.
              </p>
            </div>

            {/* Action buttons inside modal */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
              {/* Simulation button so the user can easily test unlimited generation right away */}
              <button
                type="button"
                onClick={handleUpgradeToProSimulated}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all cursor-pointer shadow-lg shadow-emerald-500/30"
              >
                تفعيل تجريبي فوري لباقة Pro (اختبار الميزات الآن) ⚡
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleResetDemoTrial}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  إعادة تعيين التجربة المجانية (Reset Demo)
                </button>

                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
