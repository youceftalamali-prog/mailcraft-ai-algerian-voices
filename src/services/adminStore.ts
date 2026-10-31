import { AlgiersPersonaId, ALGIERS_PERSONA_REGISTRY } from './algerianPersonaVoiceService';

/**
 * The single, dedicated administrator & platform owner email
 */
export const ADMIN_EMAIL = 'Youceftalamali@gmail.com';

/**
 * Checks whether the given email matches the platform owner / admin (case-insensitive)
 */
export function isAdminUser(email?: string | null): boolean {
  if (!email || typeof email !== 'string') return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export interface AdminSubscription {
  id: string;
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  wilaya: string;
  plan: 'starter' | 'pro' | 'business';
  planLabel: string;
  amountDzd: number;
  paymentMethod: 'baridimob' | 'edahabia';
  transactionId: string;
  status: 'pending' | 'active' | 'rejected';
  createdAt: string;
  activatedAt?: string;
  receiptNote?: string;
  adGenerationsUsed: number;
  adGenerationsLimit: number;
}

export interface ShowcaseAudioSample {
  id: string;
  personaId: AlgiersPersonaId;
  title: string;
  category: string;
  personaTitle: string;
  avatarIcon: string;
  accentBadge: string;
  scriptText: string;
  durationLabel: string;
  voiceName: string;
  customAudioUrl?: string;
  isCustomUpload?: boolean;
  createdAt?: string;
}

export interface AdminAISettings {
  primaryModel: string;
  ttsModel: string;
  visualModel: string;
  apiKey: string;
  theme: 'dark-indigo-emerald' | 'midnight-sapphire' | 'cyber-amber';
  language: 'ar' | 'fr' | 'en';
  enforceCod58Wilayas: boolean;
  moroccanFilterStrictness: 'strict' | 'balanced' | 'relaxed';
}

// Initial Realistic Showcase Samples
export const INITIAL_SHOWCASE_SAMPLES: ShowcaseAudioSample[] = [
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
    createdAt: '2026-10-25',
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
    createdAt: '2026-10-26',
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
    createdAt: '2026-10-27',
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
    createdAt: '2026-10-28',
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
      'شحال فرحانة اليوم! ماما شراتلي هاد الروبة الوردية شحال شابة وعجبتني بزاف! شكراً ماما نحبك بزاف، شوفو شحال جاتني مليحة! كومانداوها دركا لبناتكم والتوصيل لـ 58 ولاية!',
    durationLabel: '12 ثانية',
    voiceName: 'Kore',
    createdAt: '2026-10-28',
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
    createdAt: '2026-10-29',
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
    createdAt: '2026-10-29',
  },
];

// Initial Subscriptions Seed Data with SunVera Jolie and other Algerian stores
export const INITIAL_SUBSCRIPTIONS: AdminSubscription[] = [
  {
    id: 'sub-001',
    storeName: 'متجر SunVera Jolie للموضة النسائية',
    ownerName: 'سارة بوثلجة',
    email: 'contact@sunvera-jolie.dz',
    phone: '0554 12 88 90',
    wilaya: '16 - الجزائر (حيدرة)',
    plan: 'pro',
    planLabel: 'Pro E-Commerce',
    amountDzd: 5900,
    paymentMethod: 'baridimob',
    transactionId: 'BM-98234-DZ',
    status: 'pending',
    createdAt: '2026-10-30 11:24',
    receiptNote: 'تحويل 5,900 دج عبر بريدي موب - إشعار رقم 88921',
    adGenerationsUsed: 0,
    adGenerationsLimit: 9999,
  },
  {
    id: 'sub-002',
    storeName: 'متجر البهجة للإلكترونيات والأجهزة',
    ownerName: 'أمين مداني',
    email: 'elbahdja.tech@gmail.com',
    phone: '0661 44 23 11',
    wilaya: '09 - البليدة',
    plan: 'starter',
    planLabel: 'باقة الانطلاق (Starter)',
    amountDzd: 2900,
    paymentMethod: 'edahabia',
    transactionId: 'SATIM-448102',
    status: 'active',
    createdAt: '2026-10-29 09:15',
    activatedAt: '2026-10-29 09:18',
    receiptNote: 'دفع آلي ناجح عبر البطاقة الذهبية',
    adGenerationsUsed: 14,
    adGenerationsLimit: 50,
  },
  {
    id: 'sub-003',
    storeName: 'دار القفطان العاصمي واللباس التقليدي',
    ownerName: 'حسيبة قادري',
    email: 'dar.caftan.alger@outlook.com',
    phone: '0770 99 18 33',
    wilaya: '16 - الجزائر (القبة)',
    plan: 'business',
    planLabel: 'باقة الوكالات والشركات (Agency)',
    amountDzd: 14500,
    paymentMethod: 'baridimob',
    transactionId: 'BM-11094-ALG',
    status: 'active',
    createdAt: '2026-10-28 16:40',
    activatedAt: '2026-10-28 17:02',
    receiptNote: 'تحويل سنوي كامل عبر بريدي موب مع فاتورة',
    adGenerationsUsed: 82,
    adGenerationsLimit: 9999,
  },
  {
    id: 'sub-004',
    storeName: 'سيرتا كوزميتيكس والزيوت الطبيعية',
    ownerName: 'ياسين بن عيسى',
    email: 'cirta.bio@gmail.com',
    phone: '0550 88 14 77',
    wilaya: '25 - قسنطينة',
    plan: 'pro',
    planLabel: 'Pro E-Commerce',
    amountDzd: 5900,
    paymentMethod: 'baridimob',
    transactionId: 'BM-55219-CS',
    status: 'pending',
    createdAt: '2026-10-30 14:05',
    receiptNote: 'تحويل عبر BaridiMob وصل جديد قيد التدقيق',
    adGenerationsUsed: 0,
    adGenerationsLimit: 9999,
  },
  {
    id: 'sub-005',
    storeName: 'DZ Sport & Sneaker Store',
    ownerName: 'كريم مزيان',
    email: 'karim.sneakers@yahoo.fr',
    phone: '0672 55 90 12',
    wilaya: '31 - وهران',
    plan: 'starter',
    planLabel: 'باقة الانطلاق (Starter)',
    amountDzd: 2900,
    paymentMethod: 'edahabia',
    transactionId: 'SATIM-881290',
    status: 'rejected',
    createdAt: '2026-10-27 18:20',
    receiptNote: 'فشل العملية البنكية - رصيد غير كافٍ أو ملغاة من العميل',
    adGenerationsUsed: 0,
    adGenerationsLimit: 50,
  },
];

// Initial AI & API Settings
export const INITIAL_AI_SETTINGS: AdminAISettings = {
  primaryModel: 'gemini-3.8-flash',
  ttsModel: 'gemini-3.8-flash-lite-tts',
  visualModel: 'gemini-3-pro-image-preview',
  apiKey: '',
  theme: 'dark-indigo-emerald',
  language: 'ar',
  enforceCod58Wilayas: true,
  moroccanFilterStrictness: 'strict',
};

// LocalStorage Persistence Keys
const STORAGE_KEYS = {
  SAMPLES: 'dz_audio_admin_showcase_samples_v1',
  SUBSCRIPTIONS: 'dz_audio_admin_subscriptions_v1',
  SETTINGS: 'dz_audio_admin_ai_settings_v1',
};

export const SAMPLES_UPDATED_EVENT = 'dz_audio_showcase_samples_updated_v1';

// Storage helper functions
export function loadAdminShowcaseSamples(): ShowcaseAudioSample[] {
  try {
    if (typeof localStorage === 'undefined') return INITIAL_SHOWCASE_SAMPLES;
    const raw = localStorage.getItem(STORAGE_KEYS.SAMPLES);
    if (raw === null) {
      // Initialize with factory defaults on first run
      saveAdminShowcaseSamples(INITIAL_SHOWCASE_SAMPLES);
      return INITIAL_SHOWCASE_SAMPLES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    console.warn('Failed to load showcase samples from storage:', e);
  }
  return INITIAL_SHOWCASE_SAMPLES;
}

export function saveAdminShowcaseSamples(samples: ShowcaseAudioSample[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SAMPLES, JSON.stringify(samples));
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SAMPLES_UPDATED_EVENT, { detail: samples }));
    }
  } catch (e) {
    console.warn('Failed to save showcase samples to storage:', e);
  }
}

export function loadAdminSubscriptions(): AdminSubscription[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTIONS);
    if (!raw) return INITIAL_SUBSCRIPTIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch (e) {
    console.warn('Failed to load subscriptions from storage:', e);
  }
  return INITIAL_SUBSCRIPTIONS;
}

export function saveAdminSubscriptions(subs: AdminSubscription[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(subs));
  } catch (e) {
    console.warn('Failed to save subscriptions to storage:', e);
  }
}

export function loadAdminAISettings(): AdminAISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return INITIAL_AI_SETTINGS;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const sanitized = { ...INITIAL_AI_SETTINGS, ...parsed, apiKey: '' };
      // Remove legacy API keys that older versions may have stored in localStorage.
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(sanitized));
      return sanitized;
    }
  } catch (e) {
    console.warn('Failed to load AI settings from storage:', e);
  }
  return INITIAL_AI_SETTINGS;
}

export function saveAdminAISettings(settings: AdminAISettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...settings, apiKey: '' }));
  } catch (e) {
    console.warn('Failed to save AI settings to storage:', e);
  }
}
