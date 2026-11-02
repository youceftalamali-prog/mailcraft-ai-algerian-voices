import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Play,
  Pause,
  Download,
  Sparkles,
  Volume2,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Flame,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Zap,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  AlertCircle,
  Truck,
  Banknote,
  PhoneCall,
  LogIn,
  UserPlus,
  Layers,
  Star,
} from 'lucide-react';
import {
  AlgiersPersonaId,
  ALGIERS_PERSONA_REGISTRY,
} from '../services/algerianPersonaVoiceService';
import { createPersonaFallbackWav } from '../utils/audioFallback';
import { speakAdScript, stopAdSpeech } from '../utils/speechSynthesisService';
import {
  ShowcaseAudioSample,
  loadAdminShowcaseSamples,
  isAdminUser,
  SAMPLES_UPDATED_EVENT,
} from '../services/adminStore';

interface PublicPricingWithAudioPreviewProps {
  onEnterStudio: () => void;
  onLoginSuccess?: (userEmail: string) => void;
  showcaseSamples?: ShowcaseAudioSample[];
  onNavigateToAdmin?: () => void;
  currentUserEmail?: string | null;
}

const SHOWCASE_SAMPLES: ShowcaseAudioSample[] = [
  {
    id: 'sample-commercial',
    personaId: 'zephyr_warm',
    title: 'فلاش سيل وتخفيضات نهاية الأسبوع',
    category: 'إلكترونيات وأجهزة كهرومنزلية',
    personaTitle: 'الشاب الإعلاني التجاري',
    avatarIcon: '🎙️',
    accentBadge: 'الأكثر استخداماً في إعلانات Meta و TikTok',
    scriptText:
      'يا خاوتي الفلاش سيل راهو بدا! بري شوك وتخفيض 40% على كامل لا كوليكسيون الجديدة. الستوك راهو محدود بزاف، ديرو لا كوموند تاعكم دركا قبل ما يخلاص، ولا ليفريزون متوفرة لـ 58 ولاية والدفع عند الاستلام!',
    durationLabel: '14 ثانية',
    voiceName: 'Zephyr',
  },
  {
    id: 'sample-cosmetics',
    personaId: 'young_woman_ad',
    title: 'مستحضرات التجميل والأناقة العصرية',
    category: 'كوسميتيك وموضة نسائية',
    personaTitle: 'خبيرة الإعلانات والموضة',
    avatarIcon: '👩‍💼',
    accentBadge: 'إقناع عصري وأسلوب ناعم للمنتجات النسائية',
    scriptText:
      'سلام لي فيم! جبتلكم اليوم هاد السيروم الفوقاني في لا كاليتي. حاجة طوب للبشرة ونضارة تهبل من أول سمانة! بري فور بزاف وديرو لا كوموند تاعكم دركا خياتي، التوصيل متوفر لـ 58 ولاية والدفع بعد المعاينة عند الاستلام!',
    durationLabel: '15 ثانية',
    voiceName: 'Kore',
  },
  {
    id: 'sample-storyteller',
    personaId: 'storyteller_man',
    title: 'سرد قصصي درامي للعلامة التجارية',
    category: 'بناء الهوية والعلامات الصاعدة',
    personaTitle: 'راوي قصص تجارية - Storyteller',
    avatarIcon: '📖',
    accentBadge: 'سرد سينمائي مؤثر وبناء مصداقية عالية',
    scriptText:
      'الحكاية بدات نهار حوسنا على منتج أصيل يخدم العائلات الجزائرية بحرفية وإتقان.. واليوم رانا فخورين نقدمولكم هاد التحفة. ماشي مجرد سلعة عادية، هادي حكاية ثقة وراحة تدوم. اطلبوه دركا، والتوصيل واصل لباب داركم في 58 ولاية.',
    durationLabel: '18 ثانية',
    voiceName: 'Fenrir',
  },
  {
    id: 'sample-kids',
    personaId: 'child_boy',
    title: 'فرحة طفل بألعاب تعليمية ودراجات',
    category: 'ألعاب وأطفال ودراجات',
    personaTitle: 'طفل عاصمي مرح',
    avatarIcon: '👦',
    accentBadge: 'عفوية وفرحة طفولية تخاطب الأولياء',
    scriptText:
      'ياي شوفوا بابا واش شرالي! هاد البيسيكلات شحال شابة وتهبل بزاف بزاف! سريعة وفور، ميرسي بابا ربي يحفظك، دوك نلعب بيها مع ولاد الحومة! كومانداوها دركا لوليداتكم، والتوصيل واصل لباب داركم!',
    durationLabel: '13 ثانية',
    voiceName: 'Zephyr',
  },
  {
    id: 'sample-girl',
    personaId: 'child_girl',
    title: 'براءة طفلة وفرحة ملابس العيد',
    category: 'ملابس أطفال وهدايا',
    personaTitle: 'طفلة صغيرة بريئة',
    avatarIcon: '👧',
    accentBadge: 'نبرة لطيفة ولمسة عاطفية مؤثرة',
    scriptText:
      'شحال فرحانة اليوم! ماما شراتلي هاد الروبة الوردية شحال شابة وعجبتني بزاف! شكراً ماما نحبك بزاف، شوفو شحال جاتني مليحة! اطلبوها لبناتكم والتوصيل لـ 58 ولاية!',
    durationLabel: '12 ثانية',
    voiceName: 'Kore',
  },
  {
    id: 'sample-heritage',
    personaId: 'elderly_man',
    title: 'بركة وأصالة المنتجات والسلع',
    category: 'عسل حر، تمور وسلع تقليدية',
    personaTitle: 'عمي الشيخ الوقور',
    avatarIcon: '👴',
    accentBadge: 'ثقة ووقار وصدق تجاري لكبار السن والعائلات',
    scriptText:
      'يا وليداتي، كما يقولوا ناس زمان، البركة في القليل والتجارة بالصدق والنية الصافية هي اللي تعيش. سلعة نقية ومضمونة، والتوصيل واصل حتال عندكم في 58 ولاية، والدفع كي تلحقكم السلعة، ربي يثبت أجركم.',
    durationLabel: '17 ثانية',
    voiceName: 'Fenrir',
  },
  {
    id: 'sample-maternal',
    personaId: 'elderly_woman',
    title: 'دفء ودعاء الحاجة الحنينة',
    category: 'أفرشة، أواني وطبخ تقليدي',
    personaTitle: 'لالة / الحاجة الحنينة',
    avatarIcon: '👵',
    accentBadge: 'دفء عائلي ودعاء التوفيق وبركة الدار',
    scriptText:
      'ربي يحفظكم ليا يا وليداتي وعميراتي، سعاية مبروكة إن شاء الله! هاد القش تاع الشتا دافي بزاف وحنين، تلبسوه بالصحة والراحة والهنا. ديرو لا كوموند تاعكم، التوصيل واصل لـ 58 ولاية وبصحتكم مسبقاً!',
    durationLabel: '16 ثانية',
    voiceName: 'Kore',
  },
];

export const PublicPricingWithAudioPreview: React.FC<PublicPricingWithAudioPreviewProps> = ({
  onEnterStudio,
  onLoginSuccess,
  showcaseSamples,
  onNavigateToAdmin,
  currentUserEmail,
}) => {
  const isAdmin = isAdminUser(currentUserEmail);

  // Billing cycle toggle: monthly vs annual
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  // Resolved dynamic active samples with instant live synchronization
  const [liveSamples, setLiveSamples] = useState<ShowcaseAudioSample[]>(() =>
    showcaseSamples || loadAdminShowcaseSamples()
  );

  useEffect(() => {
    if (showcaseSamples) {
      setLiveSamples(showcaseSamples);
    }
  }, [showcaseSamples]);

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<ShowcaseAudioSample[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setLiveSamples(customEvent.detail);
      }
    };
    window.addEventListener(SAMPLES_UPDATED_EVENT, handleSync);
    return () => window.removeEventListener(SAMPLES_UPDATED_EVENT, handleSync);
  }, []);

  const activeSamples = liveSamples;

  // Showcase Samples playback state
  const [activePlayingSampleId, setActivePlayingSampleId] = useState<string | null>(null);
  const [sampleAudioProgress, setSampleAudioProgress] = useState<number>(0);
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);

  // Auth Modal & Form State
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authRememberMe, setAuthRememberMe] = useState(true);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);
  const [copiedRip, setCopiedRip] = useState(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (sampleAudioRef.current) {
        sampleAudioRef.current.pause();
      }
    };
  }, []);

  // Handle Play/Pause of Showcase Samples (supports speech audio WAV/MP3 or speech synthesis fallback)
  const handleToggleSamplePlay = (sample: ShowcaseAudioSample) => {
    if (activePlayingSampleId === sample.id) {
      if (sampleAudioRef.current) {
        sampleAudioRef.current.pause();
      }
      stopAdSpeech();
      setActivePlayingSampleId(null);
      return;
    }

    if (sampleAudioRef.current) {
      sampleAudioRef.current.pause();
    }
    stopAdSpeech();

    // Use custom speech audio or vocal fallback
    const audioDataUri = sample.customAudioUrl || createPersonaFallbackWav(sample.personaId, 6);
    const audio = new Audio(audioDataUri);
    sampleAudioRef.current = audio;

    audio.ontimeupdate = () => {
      if (audio.duration) {
        setSampleAudioProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    audio.onended = () => {
      setActivePlayingSampleId(null);
      setSampleAudioProgress(0);
    };

    audio
      .play()
      .then(() => {
        setActivePlayingSampleId(sample.id);
      })
      .catch((err) => {
        console.warn('Audio play error, falling back to speech synthesis:', err);
        setActivePlayingSampleId(sample.id);
        speakAdScript(sample.scriptText, sample.personaId, {
          onEnd: () => setActivePlayingSampleId(null),
          onError: () => setActivePlayingSampleId(null),
        });
      });
  };

  // Email registration/login: only show success after the server confirms it.
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword) return;
    setIsSubmittingAuth(true);
    setAuthSuccessMessage(null);

    try {
      const isOwner = isAdminUser(authEmail);
      const endpoint = isOwner ? '/api/auth/admin-login' : '/api/auth/login';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmail.trim(),
          password: authPassword,
          ...(isOwner ? {} : { mode: authMode }),
        }),
      });
      const data = await response.json().catch(() => ({})) as EmailAuthResponse;
      if (!response.ok || !data.success || !data.user) {
        setAuthSuccessMessage(data.message || 'تعذر تسجيل الدخول. تحقق من البيانات وحاول مجدداً.');
        setIsSubmittingAuth(false);
        return;
      }

      setAuthSuccessMessage(isOwner
        ? 'تم التحقق من حساب المالك بنجاح.'
        : authMode === 'signup'
          ? 'تم إنشاء حسابك بنجاح! لديك تجربة إعلان مجانية واحدة.'
          : 'أهلاً بعودتك! تم تسجيل الدخول بنجاح.');
      onLoginSuccess?.(data.user.email);
      setTimeout(() => {
        if (isOwner && onNavigateToAdmin) onNavigateToAdmin();
        else onEnterStudio();
      }, 700);
    } catch {
      setAuthSuccessMessage('تعذر الاتصال بالخادم. لم يتم تسجيل الدخول.');
    } finally {
      setIsSubmittingAuth(false);
    }
  };

  const handleCopyRip = () => {
    navigator.clipboard.writeText('00799999002345678921');
    setCopiedRip(true);
    setTimeout(() => setCopiedRip(false), 2500);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      className="min-h-screen bg-[#070a12] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white"
      dir="rtl"
    >
      {/* Top Navbar for Public Page */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/85 border-b border-indigo-500/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-emerald-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-2 ring-white/10 shrink-0">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-white via-indigo-100 to-emerald-300 bg-clip-text text-transparent">
                  صوت التجارة DZ
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  صوتي حصراً 🎙️
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                استوديو الإعلانات الصوتية بالتجارة الإلكترونية باللهجة العاصمية
              </p>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={() => scrollToSection('samples')}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              نماذج الأصوات 🎧
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="hover:text-indigo-400 transition-colors cursor-pointer"
            >
              باقات الأسعار (دج)
            </button>
            <button
              onClick={() => scrollToSection('payment-methods')}
              className="hover:text-emerald-400 transition-colors cursor-pointer"
            >
              بريدي موب والذهبية
            </button>
            <button
              onClick={() => scrollToSection('auth-section')}
              className="hover:text-indigo-400 transition-colors cursor-pointer"
            >
              التسجيل المجاني
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              الأسئلة الشائعة
            </button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {onNavigateToAdmin && isAdmin && (
              <button
                onClick={onNavigateToAdmin}
                aria-label="الانتقال إلى لوحة الإدارة [Admin ⚙️]"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black text-amber-300 hover:text-white bg-slate-900 border border-amber-500/40 hover:border-amber-300 transition-all cursor-pointer shadow-md hover:scale-105 active:scale-95"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>لوحة الإدارة [Admin ⚙️]</span>
                <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-400/30 text-amber-200">
                  👑
                </span>
              </button>
            )}

            <button
              onClick={() => scrollToSection('auth-section')}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4 text-indigo-400" />
              <span>تسجيل الدخول</span>
            </button>

            <button
              onClick={() => scrollToSection('auth-section')}
              type="button"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 shadow-lg shadow-indigo-600/30 ring-1 ring-white/20 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>ابدأ مجاناً (1 تجربة كاملة)</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 right-1/2 translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Trust Banner Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs sm:text-sm font-bold shadow-xl mb-6 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>نظام الإعلانات الصوتية العاصمية رقم #1 للتجارة والتوصيل في الجزائر</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-5xl mx-auto">
            حوّل زوار متجرك إلى مشترين حقيقيين{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              بأصوات إعلانية عاصمية أصيلة 🎙️🇩🇿
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            تخصص حصري ومطلق في <strong>الهندسة الصوتية والإعلانات المسموعة</strong> بلهجة وسط
            الجزائر العاصمية الصافية، مع دمج المصطلحات الفرنسية التجارية (Code-Switching) وضمانات
            التوصيل لـ 58 ولاية والدفع عند الاستلام (COD).
          </p>

          {/* Key Value Highlights */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs sm:text-sm text-slate-300">
            <span className="flex items-center gap-2 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800 shadow-md">
              <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>توصيل مضمون لـ 58 ولاية</span>
            </span>
            <span className="flex items-center gap-2 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800 shadow-md">
              <Banknote className="w-4 h-4 text-amber-400 shrink-0" />
              <span>الدفع عند الاستلام (COD)</span>
            </span>
            <span className="flex items-center gap-2 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800 shadow-md">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>حظر كامل للكلمات والنبرات الدخيلة</span>
            </span>
            <span className="flex items-center gap-2 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800 shadow-md">
              <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>دفع محلي عبر بريدي موب والذهبية</span>
            </span>
          </div>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => scrollToSection('samples')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-extrabold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 shadow-xl shadow-indigo-600/30 ring-2 ring-white/20 transition-all cursor-pointer hover:scale-105"
            >
              <Volume2 className="w-5 h-5 text-amber-300" />
              <span>استمع لنماذج الأصوات المعتمدة 🎧</span>
            </button>

            <button
              onClick={() => scrollToSection('auth-section')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl text-base font-extrabold text-emerald-300 bg-slate-900 border border-emerald-500/50 hover:bg-slate-800 hover:text-white shadow-xl shadow-emerald-500/10 transition-all cursor-pointer hover:scale-105"
            >
              <Zap className="w-5 h-5 text-amber-400" />
              <span>سجّل واحصل على تجربة مجانية كاملة (0 دج)</span>
            </button>

            <button
              onClick={() => scrollToSection('pricing')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-base font-bold text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:text-white transition-all cursor-pointer"
            >
              <Banknote className="w-5 h-5 text-emerald-400" />
              <span>باقات الأسعار (دج DZD)</span>
            </button>
          </div>

          {/* Social Proof Metrics */}
          <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-around gap-6 text-slate-400 text-xs sm:text-sm max-w-4xl mx-auto">
            <div>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">+12,500</div>
              <div className="text-slate-400 text-xs mt-0.5">إعلان صوتي تم إنتاجه</div>
            </div>
            <div className="w-px h-8 bg-slate-800 hidden sm:block" />
            <div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">58 ولاية</div>
              <div className="text-slate-400 text-xs mt-0.5">تغطية شبكات التوصيل</div>
            </div>
            <div className="w-px h-8 bg-slate-800 hidden sm:block" />
            <div>
              <div className="text-xl sm:text-2xl font-black text-indigo-400 font-mono">100%</div>
              <div className="text-slate-400 text-xs mt-0.5">دارجة عاصمية صافية</div>
            </div>
            <div className="w-px h-8 bg-slate-800 hidden sm:block" />
            <div>
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">0 دج</div>
              <div className="text-slate-400 text-xs mt-0.5">تجربة مجانية بعد التسجيل</div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: Pre-recorded & Preset Interactive Audio Samples */}
      <section id="samples" className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/80">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-3">
            <Volume2 className="w-4 h-4 text-amber-400" />
            <span>نماذج صوتية مسجلة ومجهزة للاستماع الفوري</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            استمع للشخصيات الإعلانية العاصمية بنقرة واحدة 🎙️
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mt-2.5 max-w-2xl mx-auto">
            انقر على زر <strong>"استمع الآن 🎧"</strong> في أي بطاقة للاستماع الفوري للعينات الصوتية المعتمدة
            للإعلانات والتسويق الإلكتروني الجزائري.
          </p>
        </div>

        {/* Samples Grid */}
        {activeSamples.length === 0 ? (
          <div className="rounded-3xl p-10 bg-slate-900/60 border border-dashed border-slate-700 text-center max-w-xl mx-auto">
            <Volume2 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">لا توجد عينات صوتية معروضة حالياً</h3>
            <p className="text-xs text-slate-400">
              يمكن لمدير المنصة إضافة وتخصيص نماذج صوتية جديدة في أي وقت عبر لوحة الإدارة المركزية.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSamples.map((sample) => {
              const isPlaying = activePlayingSampleId === sample.id;

            return (
              <div
                key={sample.id}
                className={`rounded-3xl p-6 border transition-all duration-300 relative flex flex-col justify-between ${
                  isPlaying
                    ? 'bg-gradient-to-b from-indigo-950/95 to-slate-900 border-indigo-500 shadow-2xl shadow-indigo-600/30 ring-2 ring-indigo-500/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div>
                  {/* Top Header Card */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl shadow-inner">
                        {sample.avatarIcon}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-white">
                          {sample.personaTitle}
                        </h3>
                        <span className="text-xs text-indigo-400 font-medium">
                          {sample.category}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {sample.durationLabel}
                    </span>
                  </div>

                  {/* Accent Badge */}
                  <div className="mb-3">
                    <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      {sample.accentBadge}
                    </span>
                  </div>

                  {/* Script Excerpt */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-4">
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      "{sample.scriptText}"
                    </p>
                  </div>
                </div>

                {/* Audio Interactive Bar & Play Button */}
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  {/* Sound Wave Animation when active */}
                  {isPlaying ? (
                    <div className="flex items-center justify-center gap-1.5 h-6">
                      <span className="w-1.5 bg-emerald-400 rounded-full animate-bounce h-4" />
                      <span className="w-1.5 bg-indigo-400 rounded-full animate-bounce h-6 delay-75" />
                      <span className="w-1.5 bg-teal-400 rounded-full animate-bounce h-3 delay-150" />
                      <span className="w-1.5 bg-emerald-300 rounded-full animate-bounce h-5 delay-200" />
                      <span className="w-1.5 bg-indigo-300 rounded-full animate-bounce h-6 delay-100" />
                      <span className="w-1.5 bg-amber-400 rounded-full animate-bounce h-4 delay-150" />
                    </div>
                  ) : (
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="bg-indigo-600 h-1.5 rounded-full w-0" />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSamplePlay(sample)}
                      className={`flex-1 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/30 ring-2 ring-white/20'
                          : 'bg-gradient-to-r from-indigo-600 to-emerald-600 text-white hover:from-indigo-500 hover:to-emerald-500 shadow-md shadow-indigo-600/30'
                      }`}
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="w-4 h-4" />
                          <span>إيقاف مؤقت ⏸️</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-white" />
                          <span>استمع الآن 🎧</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => scrollToSection('auth-section')}
                      title="سجل وجرب هذا النمط مجاناً"
                      className="px-3.5 py-3 rounded-xl text-xs font-bold bg-slate-800/90 text-slate-200 hover:text-white hover:bg-slate-700 transition-all cursor-pointer flex items-center gap-1 border border-slate-700"
                    >
                      <span>توليد إعلاني</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}

        {/* Free trial callout banner under samples */}
        <div className="mt-12 p-6 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-emerald-950/80 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>أعجبتك النماذج الصوتية؟ جرّب إعلان متجرك بنفسك مجاناً!</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              سجّل حسابك في ثوانٍ لتحصل فوراً على <strong>1 تجربة إعلان مجانية كاملة</strong> (أقل من 500 حرف) في الاستوديو مع إمكانية التحميل.
            </p>
          </div>
          <button
            onClick={() => scrollToSection('auth-section')}
            className="px-6 py-3 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/25 transition-all cursor-pointer shrink-0"
          >
            سجّل وجرّب إعلانك مجاناً الآن
          </button>
        </div>
      </section>

      {/* SECTION 2: Algerian DZD Pricing (باقات الاشتراك بالدينار الجزائري) */}
      <section id="pricing" className="py-20 bg-slate-950/90 border-t border-slate-800/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30 mb-3">
              <Banknote className="w-4 h-4 text-emerald-400" />
              <span>اشتراكات واضحة ومحلية بالدينار الجزائري (DZD)</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              اختر الخطة المناسبة لحجم متجرك ومبيعاتك 💳
            </h2>
            <p className="text-sm sm:text-base text-slate-300 mt-2.5 max-w-2xl mx-auto">
              بدون الحاجة لبطاقات فيزا أو ماستركارد دولية! ادفع مباشرة عبر بريدي موب (BaridiMob) أو البطاقة
              الذهبية (Edahabia) بأسعار واضحة بالدينار الجزائري.
            </p>

            {/* Monthly / Annual Toggle Switch */}
            <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                الدفع الشهري
              </button>

              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  billingCycle === 'annual'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>الدفع السنوي</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950">
                  وفّر شهرين مجاناً 🎁
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* Plan 1: Free Trial on Signup */}
            <div className="rounded-3xl p-6 bg-slate-900/70 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                  البداية بعد التسجيل
                </div>
                <h3 className="text-xl font-black text-white">الخطة المجانية التجريبية</h3>
                <p className="text-xs text-slate-400 mt-1">تمنح تلقائياً عند إنشاء الحساب</p>

                <div className="mt-6 mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white font-mono">0</span>
                    <span className="text-base font-bold text-slate-400">دج</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">1 تجربة كاملة مجاناً بدون بطاقة</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>1 إعلان صوتي كامل</strong> مجاناً</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>سكريبت حتى <strong>500 حرف</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>استماع وتحميل بصيغة WAV</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>كافة الشخصيات العاصمية السبعة</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>دعم استخراج المنتجات من الروابط (URL)</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => scrollToSection('auth-section')}
                  className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/50 transition-all cursor-pointer"
                >
                  سجّل وابدأ تجربتك المجانية
                </button>
              </div>
            </div>

            {/* Plan 2: Starter / Dropshipper */}
            <div className="rounded-3xl p-6 bg-slate-900/70 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
                  للتجار والمبتدئين
                </div>
                <h3 className="text-xl font-black text-white">باقة الانطلاق (Starter)</h3>
                <p className="text-xs text-slate-400 mt-1">للمتاجر المستقلة ودروب شيبينغ</p>

                <div className="mt-6 mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white font-mono">
                      {billingCycle === 'monthly' ? '2,900' : '29,000'}
                    </span>
                    <span className="text-base font-bold text-slate-400">دج</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {billingCycle === 'monthly' ? 'تدفع شهرياً' : 'تدفع سنوياً (وفرت 5,800 دج)'}
                  </span>
                </div>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>50 إعلان صوتي</strong> شهرياً</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>كافة الشخصيات الصوتية السبعة</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>محرك استخراج بيانات المنتجات (URL)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>سكريبتات حتى 2,500 حرف</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>ترخيص تجاري لإعلانات Meta و TikTok</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => scrollToSection('payment-methods')}
                  className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl text-xs font-bold text-indigo-300 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 transition-all cursor-pointer"
                >
                  الدفع بـ بريدي موب (2,900 دج)
                </button>
              </div>
            </div>

            {/* Plan 3: Pro E-Commerce (Popular / Recommended) */}
            <div className="rounded-3xl p-6 bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15 flex flex-col justify-between relative transform lg:-translate-y-2">
              <div className="absolute -top-3.5 right-1/2 translate-x-1/2 px-4 py-1 rounded-full bg-emerald-500 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                <span>الخيار الأكثر طلباً من متاجر الجزائر</span>
              </div>

              <div>
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 mt-2">
                  للمحترفين وفرق التسويق
                </div>
                <h3 className="text-2xl font-black text-white">باقة Pro E-Commerce</h3>
                <p className="text-xs text-slate-300 mt-1">سرعة مضاعفة وإعلانات غير محدودة</p>

                <div className="mt-6 mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-emerald-300 font-mono">
                      {billingCycle === 'monthly' ? '5,900' : '59,000'}
                    </span>
                    <span className="text-lg font-bold text-slate-300">دج</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">
                    {billingCycle === 'monthly' ? 'شهرياً (شامل كل الميزات)' : 'سنوياً (شهرين مجاناً)'}
                  </span>
                </div>

                <ul className="space-y-3 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>توليد إعلانات غير محدود</strong> (Fair Use)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>محرك المشاعر الخالي من التضارب</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>صياغة سكريبتات فورية من روابط المتاجر</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>أولوية المعالجة بأقصى سرعة للخوادم</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>دعم فني مخصص عبر WhatsApp</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => scrollToSection('payment-methods')}
                  className="w-full inline-flex items-center justify-center py-3.5 px-4 rounded-xl text-sm font-extrabold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/30 transition-all cursor-pointer"
                >
                  اشترك الآن في Pro (5,900 دج)
                </button>
              </div>
            </div>

            {/* Plan 4: Agency / Enterprise */}
            <div className="rounded-3xl p-6 bg-slate-900/70 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all">
              <div>
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                  للوكالات والشركات
                </div>
                <h3 className="text-xl font-black text-white">باقة الشركات (Agency)</h3>
                <p className="text-xs text-slate-400 mt-1">تراخيص متعددة وحسابات الفريق</p>

                <div className="mt-6 mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white font-mono">
                      {billingCycle === 'monthly' ? '14,500' : '145,000'}
                    </span>
                    <span className="text-base font-bold text-slate-400">دج</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {billingCycle === 'monthly' ? 'تدفع شهرياً' : 'تدفع سنوياً'}
                  </span>
                </div>

                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>كل ميزات Pro E-Commerce</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>حتى 5 أعضاء فريق (Multi-Seats)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>فواتير رسمية للشركات والضرائب</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>ربط برمجي وتكامل API خاص</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => scrollToSection('payment-methods')}
                  className="w-full inline-flex items-center justify-center py-3 px-4 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  طلب اشتراك وكالة (14,500 دج)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Algerian Local Payment Methods (بريدي موب والبطاقة الذهبية) */}
      <section id="payment-methods" className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 border border-indigo-500/30 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold border border-emerald-500/30 mb-3">
              <CreditCard className="w-3.5 h-3.5" />
              <span>طرق الدفع الجزائرية المعتمدة (100% محلي)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              الدفع الفوري السهل عبر بريدي موب (BaridiMob) والبطاقة الذهبية 💳🇩🇿
            </h2>
            <p className="text-sm text-slate-300 mt-2">
              نوفر للتجار في الجزائر إمكانية التفعيل الفوري لاشتراكاتهم عبر الوسائل المحلية الموثوقة بدون تعقيدات البنوك الأجنبية.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* BaridiMob Card */}
            <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-lg">
                    📱
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">تطبيق بريدي موب (BaridiMob)</h3>
                    <p className="text-xs text-slate-400">تحويل فوري برقم الـ RIP</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  تفعيل سريع
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400">رقم الحساب البريدي الجاري RIP:</div>
                  <div className="text-sm font-mono font-bold text-emerald-400 mt-0.5" dir="ltr">
                    00799999002345678921
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyRip}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  {copiedRip ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ RIP</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                بعد التحويل عبر تطبيق BaridiMob، أرسل صورة الإشعار (Reçu) مع إيميل حسابك عبر WhatsApp أو إلى الدعم ليتم تفعيل باقتك مباشرة خلال أقل من 15 دقيقة.
              </p>
            </div>

            {/* Edahabia Card */}
            <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center font-bold text-lg">
                    💳
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">البطاقة الذهبية (Edahabia)</h3>
                    <p className="text-xs text-slate-400">دفع آمن عبر موزع بريد الجزائر SATIM</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  تأكيد آلي
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                <div className="text-xs text-slate-300">
                  معاملات مشفرة 100% مع نظام الحماية الثلاثي OTP عبر الرسائل النصية القصيرة (SMS).
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                ادخل رقم بطاقتك وتاريخ الصلاحية ورمز التحقق عبر بوابة الدفع الوطنية، ويتم تجديد اشتراكك الصوتي فوراً وبشكل تلقائي.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Two Authentication Methods (التسجيل السريع عبر Google أو البريد) */}
      <section id="auth-section" className="py-20 bg-slate-950/90 border-t border-slate-800/80">
        <div className="max-w-xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/15 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-3">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>انضم إلى آلاف تجار التوصيل في الجزائر</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {authMode === 'signup' ? 'أنشئ حسابك المجاني في دقيقة' : 'تسجيل الدخول إلى حسابك'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5">
              احصل تلقائياً على <strong>1 تجربة إعلان مجانية كاملة</strong> في الاستوديو فور التسجيل!
            </p>
          </div>

          {/* Auth Card */}
          <div className="rounded-3xl bg-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl relative">
            {/* Mode Switcher Tabs */}
            <div className="flex rounded-2xl bg-slate-950 p-1 mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthSuccessMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                إنشاء حساب جديد
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthSuccessMessage(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                تسجيل الدخول
              </button>
            </div>

            {/* Success Feedback Notification */}
            {authSuccessMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-amber-950/50 border border-amber-500/40 text-amber-100 text-xs sm:text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-amber-300 shrink-0" />
                <span>{authSuccessMessage}</span>
              </div>
            )}

            <div className="mb-5 p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs leading-6">
              تسجيل الدخول عبر Google والدخول السريع للمالك متوقفان مؤقتاً إلى حين إعداد OAuth والتحقق الآمن. استعمل البريد الإلكتروني وكلمة المرور.
            </div>

            {/* Method 2: Traditional Email & Password Form */}
            <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    الاسم الكامل / اسم المتجر:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute top-3.5 right-3.5" />
                    <input
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="مثال: متجر البهجة للإلكترونيات"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  البريد الإلكتروني:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute top-3.5 right-3.5" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300">كلمة المرور:</label>
                  {authMode === 'login' && (
                    <a href="#forgot" className="text-[11px] text-indigo-400 hover:underline">
                      نسيت كلمة المرور؟
                    </a>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute top-3.5 right-3.5" />
                  <input
                    type="password"
                    required
                    minLength={10}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    رقم الهاتف الجزائري (اختياري للإشعارات):
                  </label>
                  <div className="relative">
                    <PhoneCall className="w-4 h-4 text-slate-500 absolute top-3.5 right-3.5" />
                    <input
                      type="tel"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="0550 00 00 00"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={authRememberMe}
                    onChange={(e) => setAuthRememberMe(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>تذكرني على هذا الجهاز</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 transition-all cursor-pointer shadow-lg shadow-indigo-600/30 ring-1 ring-white/10"
              >
                {isSubmittingAuth ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>جاري المعالجة...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {authMode === 'signup'
                        ? 'إنشاء الحساب وبدء التجربة المجانية ⚡'
                        : 'تسجيل الدخول إلى الاستوديو'}
                    </span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* SECTION 5: FAQ Accordion */}
      <section id="faq" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            الأسئلة الشائعة حول الخدمة والأصوات 💬
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            كل ما تحتاج لمعرفته حول التسويق الصوتي الإعلاني بالتجارة الإلكترونية في الجزائر
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'كيف يمكنني الاستماع إلى نماذج الأصوات قبل الاشتراك؟',
              a: 'يمكنك الاستماع إلى العينات الصوتية المعتمدة لجميع الشخصيات العاصمية السبعة مباشرة من قسم "نماذج الأصوات 🎧" في هذه الصفحة بنقرة واحدة على زر "استمع الآن 🎧" بدون الحاجة للتسجيل.',
            },
            {
              q: 'كيف تعمل التجربة المجانية بعد التسجيل في الاستوديو؟',
              a: 'بمجرد تسجيل حسابك الجديد مجاناً (عبر Google أو البريد)، تبدأ تلقائياً في "الخطة المجانية التجريبية". تمنحك هذه الخطة 1 تجربة إعلان مجانية كاملة: يمكنك كتابة أو توليد سكريبت حتى 500 حرف، وتوليد الصوت والاستماع إليه وتحميله بصيغة WAV مجاناً لفحص الجودة.',
            },
            {
              q: 'ماذا يحدث بعد استهلاك تجربة الإعلان المجانية الأولى؟',
              a: 'بعد استهلاك تجربتك المجانية الأولى بنجاح، يمكنك الترقية إلى باقة Starter (2,900 دج) أو باقة Pro E-Commerce (5,900 دج) عبر الدفع المحلي بـ بريدي موب أو البطاقة الذهبية لمواصلة إنتاج الإعلانات بدون قيود.',
            },
            {
              q: 'لماذا يعتبر الصوت العاصمي الصافي الأفضل لإعلانات التجارة الإلكترونية في الجزائر؟',
              a: 'لأن اللهجة العاصمية البيضاء (وسط الجزائر) تُعتبر اللهجة الأكثر فهماً وقبولاً في كامل ربوع الوطن عبر 58 ولاية. كما أنها اللهجة المعتمدة في الإعلانات التلفزيونية والإذاعية الوطنية، وتمنح المتجر مصداقية وثقة فورية لدى المشتري.',
            },
            {
              q: 'كيف يمنع النظام تداخل الكلمات المغربية أو المشرقية؟',
              a: 'نقوم بفرض قيود صوتية سلبية (Negative Acoustic Constraints) صارمة تمنع النموذج الذكي من استعمال كلمات مثل "دابا"، "واخا"، "مزيان"، "ديال"، وتوجيهه حصراً إلى المفردات العاصمية مثل "تاعكم"، "هايل"، "بزاف"، مع دمج مصطلحات التجارة الفرنسية (Prix, Livraison, Stock, COD).',
            },
            {
              q: 'كيف يتم الدفع عبر بريدي موب (BaridiMob)؟',
              a: 'يمكنك إرسال مبلغ الاشتراك مباشرة إلى رقم الحساب البريدي الجاري (RIP: 00799999002345678921) عبر تطبيق بريدي موب، ثم إرسال صورة وصل التحويل للدعم ليتم تفعيل حسابك مباشرة خلال 15 دقيقة.',
            },
            {
              q: 'هل يُسمح باستخدام الملفات الصوتية في إعلانات ممولة على فيسبوك وتيك توك؟',
              a: 'نعم! جميع الملفات الصوتية المولدة في الباقات تأتي مع تراخيص تجارية كاملة للاستخدام في الحملات الإعلانية الممولة (Sponsored Ads) على Meta و TikTok و YouTube وبدون أي حقوق ملكية فكرية مقيدة.',
            },
          ].map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-right font-extrabold text-sm sm:text-base text-white flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/50"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-indigo-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Global Landing Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-10 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
              🎙️
            </div>
            <div>
              <div className="text-slate-200 font-extrabold">صوت التجارة DZ • Voice Studio</div>
              <div className="text-[11px] text-slate-500">منظومة الإعلانات الصوتية العاصمية للتجارة الإلكترونية</div>
            </div>
          </div>

          <div className="flex items-center gap-6 text-slate-400">
            <button
              onClick={() => scrollToSection('samples')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              نماذج الأصوات
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              الأسعار بالدينار الجزائري
            </button>
            <button
              onClick={() => scrollToSection('payment-methods')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              بريدي موب والذهبية
            </button>
            <button onClick={onEnterStudio} className="text-emerald-400 hover:underline cursor-pointer">
              الاستوديو المباشر
            </button>
            {onNavigateToAdmin && isAdmin && (
              <button
                onClick={onNavigateToAdmin}
                className="text-amber-300 hover:text-white hover:underline cursor-pointer font-bold inline-flex items-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>لوحة الإدارة [Admin ⚙️]</span>
              </button>
            )}
          </div>

          <div className="text-slate-500 text-[11px]">
            جميع الحقوق محفوظة © 2026 • تخصص حصري للصوتيات الإعلانية (Audio Only)
          </div>
        </div>
      </footer>
    </div>
  );
};
