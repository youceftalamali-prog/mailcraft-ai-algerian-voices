import React, { useState, useRef, useEffect } from 'react';

type AudioGenerationResponse = { audioDataUrl?: string; error?: string; message?: string; details?: string };
type ApiVerificationResponse = {
  success: boolean;
  latencyMs?: number;
  message?: string;
  modelUsed?: string;
};
import {
  ShieldCheck,
  CreditCard,
  Volume2,
  Settings,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  Filter,
  Plus,
  Trash2,
  Edit3,
  Play,
  Pause,
  Upload,
  RefreshCw,
  Key,
  Eye,
  EyeOff,
  Zap,
  Globe,
  Sliders,
  Building2,
  FileText,
  Copy,
  Check,
  ArrowRight,
  ExternalLink,
  Store,
  DollarSign,
  ChevronDown,
  Info,
  Layers,
  Lock,
  Phone,
  Mail,
  MapPin,
  X
} from 'lucide-react';
import {
  AdminSubscription,
  ShowcaseAudioSample,
  AdminAISettings,
  loadAdminSubscriptions,
  saveAdminSubscriptions,
  loadAdminShowcaseSamples,
  saveAdminShowcaseSamples,
  loadAdminAISettings,
  saveAdminAISettings,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_SHOWCASE_SAMPLES,
  INITIAL_AI_SETTINGS,
  ADMIN_EMAIL,
  isAdminUser,
  SAMPLES_UPDATED_EVENT,
} from '../services/adminStore';
import {
  AlgiersPersonaId,
  ALGIERS_PERSONA_REGISTRY,
} from '../services/algerianPersonaVoiceService';
import { speakAdScript, stopAdSpeech } from '../utils/speechSynthesisService';

interface AdminMasterDashboardProps {
  onNavigateToLanding: () => void;
  onNavigateToStudio: () => void;
  currentUserEmail?: string | null;
  showcaseSamples?: ShowcaseAudioSample[];
  onUpdateShowcaseSamples?: (samples: ShowcaseAudioSample[]) => void;
}

export const AdminMasterDashboard: React.FC<AdminMasterDashboardProps> = ({
  onNavigateToLanding,
  onNavigateToStudio,
  currentUserEmail,
  showcaseSamples,
  onUpdateShowcaseSamples,
}) => {
  // Active Tab inside Admin Dashboard
  const [adminTab, setAdminTab] = useState<'subscriptions' | 'samples' | 'ai_settings' | 'overview'>('subscriptions');

  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>(() => loadAdminSubscriptions());
  const [subSearchQuery, setSubSearchQuery] = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');
  const [subMethodFilter, setSubMethodFilter] = useState<'all' | 'baridimob' | 'edahabia'>('all');
  const [selectedReceiptSub, setSelectedReceiptSub] = useState<AdminSubscription | null>(null);
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [copiedTxnId, setCopiedTxnId] = useState<string | null>(null);

  // New Subscription Form State
  const [newStoreName, setNewStoreName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newWilaya, setNewWilaya] = useState('16 - الجزائر العاصمة');
  const [newPlan, setNewPlan] = useState<'starter' | 'pro' | 'business'>('pro');
  const [newMethod, setNewMethod] = useState<'baridimob' | 'edahabia'>('baridimob');
  const [newTxnId, setNewTxnId] = useState('');
  const [newNote, setNewNote] = useState('');

  // Voice Samples State (with live synchronization)
  const [samples, setSamples] = useState<ShowcaseAudioSample[]>(() =>
    showcaseSamples || loadAdminShowcaseSamples()
  );
  const [activePlayingSampleId, setActivePlayingSampleId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [editingSample, setEditingSample] = useState<ShowcaseAudioSample | null>(null);
  const [editSampleAudioUrl, setEditSampleAudioUrl] = useState<string | null>(null);
  const [editSampleFileName, setEditSampleFileName] = useState<string | null>(null);
  const [showAddSampleModal, setShowAddSampleModal] = useState(false);
  const [sampleActionToast, setSampleActionToast] = useState<string | null>(null);

  // New Sample Form State
  const [newSampleTitle, setNewSampleTitle] = useState('');
  const [newSamplePersonaId, setNewSamplePersonaId] = useState<AlgiersPersonaId>('zephyr_warm');
  const [newSampleCategory, setNewSampleCategory] = useState('إلكترونيات وأجهزة');
  const [newSampleBadge, setNewSampleBadge] = useState('إعلان عاصمي نشط');
  const [newSampleScript, setNewSampleScript] = useState('');
  const [newSampleDuration, setNewSampleDuration] = useState('15 ثانية');
  const [uploadedAudioDataUrl, setUploadedAudioDataUrl] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isGeneratingSampleAudio, setIsGeneratingSampleAudio] = useState(false);
  const [isSpeakingInEdit, setIsSpeakingInEdit] = useState(false);
  const [isSpeakingInAdd, setIsSpeakingInAdd] = useState(false);

  // AI & API Settings State
  const [aiSettings, setAiSettings] = useState<AdminAISettings>(() => loadAdminAISettings());
  const [showApiKey, setShowApiKey] = useState(false);
  const [isVerifyingApiKey, setIsVerifyingApiKey] = useState(false);
  const [apiVerificationResult, setApiVerificationResult] = useState<{
    success: boolean;
    latencyMs?: number;
    message?: string;
    modelUsed?: string;
  } | null>(null);
  const [saveSettingsSuccess, setSaveSettingsSuccess] = useState(false);

  // System Stats State
  const [systemStats, setSystemStats] = useState<{
    uptimeSeconds?: number;
    memoryUsageMb?: number;
    serverTime?: string;
    nodeVersion?: string;
  } | null>(null);

  // Fetch live system stats on mount
  useEffect(() => {
    fetch('/api/admin/system-stats')
      .then((res) => (res.ok ? res.json() as Promise<NonNullable<typeof systemStats>> : null))
      .then((data) => {
        if (data) setSystemStats(data);
      })
      .catch(() => {});
  }, []);

  // Live synchronization with parent props & window custom events
  useEffect(() => {
    if (showcaseSamples) {
      setSamples(showcaseSamples);
    }
  }, [showcaseSamples]);

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<ShowcaseAudioSample[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setSamples(customEvent.detail);
      }
    };
    window.addEventListener(SAMPLES_UPDATED_EVENT, handleSync);
    return () => window.removeEventListener(SAMPLES_UPDATED_EVENT, handleSync);
  }, []);

  // Sync showcase samples changes to parent & storage
  const updateSamplesState = (newSamples: ShowcaseAudioSample[]) => {
    setSamples(newSamples);
    saveAdminShowcaseSamples(newSamples);
    if (onUpdateShowcaseSamples) {
      onUpdateShowcaseSamples(newSamples);
    }
  };

  // Sync subscriptions changes to storage
  const updateSubscriptionsState = (newSubs: AdminSubscription[]) => {
    setSubscriptions(newSubs);
    saveAdminSubscriptions(newSubs);
  };

  // Stop audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      stopAdSpeech();
    };
  }, []);

  // Action: Activate Subscription
  const handleActivateSubscription = (subId: string) => {
    const updated = subscriptions.map((s) => {
      if (s.id === subId) {
        return {
          ...s,
          status: 'active' as const,
          activatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };
      }
      return s;
    });
    updateSubscriptionsState(updated);
  };

  // Action: Reject Subscription
  const handleRejectSubscription = (subId: string) => {
    const updated = subscriptions.map((s) => {
      if (s.id === subId) {
        return {
          ...s,
          status: 'rejected' as const,
        };
      }
      return s;
    });
    updateSubscriptionsState(updated);
  };

  // Action: Reset Subscription to Pending
  const handleResetSubscription = (subId: string) => {
    const updated = subscriptions.map((s) => {
      if (s.id === subId) {
        return {
          ...s,
          status: 'pending' as const,
        };
      }
      return s;
    });
    updateSubscriptionsState(updated);
  };

  // Action: Add New Manual Subscription
  const handleAddNewSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;

    const planPrices = {
      starter: 2900,
      pro: 5900,
      business: 14500,
    };
    const planLabels = {
      starter: 'باقة الانطلاق (Starter)',
      pro: 'Pro E-Commerce',
      business: 'باقة الوكالات والشركات (Agency)',
    };

    const newSub: AdminSubscription = {
      id: `sub-${Date.now().toString().slice(-4)}`,
      storeName: newStoreName.trim(),
      ownerName: newOwnerName.trim() || 'صاحب المتجر',
      email: newEmail.trim() || 'client@store.dz',
      phone: newPhone.trim() || '0550 00 00 00',
      wilaya: newWilaya,
      plan: newPlan,
      planLabel: planLabels[newPlan],
      amountDzd: planPrices[newPlan],
      paymentMethod: newMethod,
      transactionId: newTxnId.trim() || (newMethod === 'baridimob' ? `BM-${Math.floor(10000 + Math.random() * 90000)}` : `SATIM-${Math.floor(100000 + Math.random() * 900000)}`),
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      receiptNote: newNote.trim() || 'معاملة يدوية مسجلة من لوحة الإدارة',
      adGenerationsUsed: 0,
      adGenerationsLimit: newPlan === 'starter' ? 50 : 9999,
    };

    updateSubscriptionsState([newSub, ...subscriptions]);
    setShowAddSubModal(false);
    // Reset form
    setNewStoreName('');
    setNewOwnerName('');
    setNewEmail('');
    setNewPhone('');
    setNewTxnId('');
    setNewNote('');
  };

  // Play a real custom recording when one exists; otherwise read the sample script.
  // Never use the synthetic fallback WAV here because it contains no intelligible words.
  const handleTogglePlaySample = (sample: ShowcaseAudioSample) => {
    if (activePlayingSampleId === sample.id) {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      stopAdSpeech();
      setActivePlayingSampleId(null);
      return;
    }

    audioRef.current?.pause();
    audioRef.current = null;
    stopAdSpeech();

    const speakSampleText = () => {
      setActivePlayingSampleId(sample.id);
      void speakAdScript(sample.scriptText, sample.personaId, {
        onEnd: () => setActivePlayingSampleId(null),
        onError: (err) => {
          console.warn('Admin showcase speech synthesis failed:', err);
          setActivePlayingSampleId(null);
        },
      });
    };

    if (!sample.customAudioUrl) {
      speakSampleText();
      return;
    }

    const audio = new Audio(sample.customAudioUrl);
    audioRef.current = audio;
    let speechFallbackStarted = false;
    const fallbackToScriptSpeech = () => {
      if (speechFallbackStarted) return;
      speechFallbackStarted = true;
      audioRef.current = null;
      speakSampleText();
    };

    audio.onended = () => setActivePlayingSampleId(null);
    audio.onerror = fallbackToScriptSpeech;
    audio.play()
      .then(() => setActivePlayingSampleId(sample.id))
      .catch((err) => {
        console.warn('Admin showcase audio failed; reading its script instead:', err);
        fallbackToScriptSpeech();
      });
  };

  // Action: Handle Audio File Upload (WAV / MP3)
  const handleAudioFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUploadedAudioDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Action: Speak & Synthesize Voice for New Sample (Web Speech API + Backend Voice Recording)
  const handleSpeakAndSynthesizeInAdd = async () => {
    const textToSpeak = newSampleScript.trim();
    if (!textToSpeak) {
      setSampleActionToast('يرجى كتابة نص السكريبت الإعلاني أولاً ليتم نطقه وتوليده ✍️');
      setTimeout(() => setSampleActionToast(null), 3500);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    setActivePlayingSampleId(null);
    stopAdSpeech();

    setIsGeneratingSampleAudio(true);
    setIsSpeakingInAdd(true);

    // 1. Immediately speak using browser SpeechSynthesis in natural Arabic
    speakAdScript(textToSpeak, newSamplePersonaId, {
      onEnd: () => {
        setIsSpeakingInAdd(false);
      },
      onError: () => {
        setIsSpeakingInAdd(false);
      },
    });

    // 2. Concurrently generate & record the human voice audio WAV from AI server
    try {
      const res = await fetch('/api/generate-persona-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptText: textToSpeak,
          persona: newSamplePersonaId,
        }),
      });

      const data = await res.json() as AudioGenerationResponse;
      if (!res.ok || !data.audioDataUrl) {
        throw new Error(data.details || data.message || data.error || `TTS request failed: ${res.status}`);
      }
      setUploadedAudioDataUrl(data.audioDataUrl);
      setUploadedFileName(`ai-voice-${newSamplePersonaId}.wav`);
      setSampleActionToast('تم توليد التسجيل الصوتي الحقيقي بنجاح وهو جاهز للنشر 🎙️');
      setTimeout(() => setSampleActionToast(null), 4000);
    } catch (err) {
      console.warn('Backend TTS failed; no placeholder audio was saved:', err);
      setSampleActionToast('تعذر إنشاء ملف صوتي حقيقي من Gemini. لم يتم حفظ صوت وهمي؛ ستقرأ معاينة العينة النص عبر صوت المتصفح.');
      setTimeout(() => setSampleActionToast(null), 5000);
    } finally {
      setIsGeneratingSampleAudio(false);
    }
  };

  // Action: Speak & Synthesize Voice for Editing Sample (Web Speech API + Recording Pipeline)
  const handleSpeakAndSynthesizeInEdit = async () => {
    if (!editingSample) return;
    const textToSpeak = editingSample.scriptText.trim();
    if (!textToSpeak) {
      setSampleActionToast('يرجى كتابة النص الإعلاني أولاً ليتم نطقه وتوليده ✍️');
      setTimeout(() => setSampleActionToast(null), 3500);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    setActivePlayingSampleId(null);
    stopAdSpeech();

    setIsSpeakingInEdit(true);

    // 1. Immediately read aloud with Web Speech API in authentic Arabic
    speakAdScript(textToSpeak, editingSample.personaId, {
      onEnd: () => {
        setIsSpeakingInEdit(false);
      },
      onError: () => {
        setIsSpeakingInEdit(false);
      },
    });

    // 2. Concurrently generate and record the audio file from AI server
    try {
      const res = await fetch('/api/generate-persona-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptText: textToSpeak,
          persona: editingSample.personaId,
        }),
      });

      const data = await res.json() as AudioGenerationResponse;
      if (!res.ok || !data.audioDataUrl) {
        throw new Error(data.details || data.message || data.error || `TTS request failed: ${res.status}`);
      }
      setEditSampleAudioUrl(data.audioDataUrl);
      setEditSampleFileName(`ai-speech-${editingSample.personaId}.wav`);
      setEditingSample((prev) =>
        prev
          ? {
              ...prev,
              customAudioUrl: data.audioDataUrl,
              isCustomUpload: true,
            }
          : null
      );
      setSampleActionToast('تم توليد التسجيل الصوتي الحقيقي بنجاح وهو جاهز للنشر في الصفحة الرئيسية! 🎙️');
      setTimeout(() => setSampleActionToast(null), 4000);
    } catch (err) {
      console.warn('Backend TTS failed; no placeholder audio was saved:', err);
      setSampleActionToast('تعذر إنشاء ملف صوتي حقيقي من Gemini. لم يتم حفظ صوت وهمي؛ يمكنك معاينة النص بصوت المتصفح.');
      setTimeout(() => setSampleActionToast(null), 5000);
    }
  };

  // Action: Add New Showcase Sample
  const handleAddNewSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSampleTitle.trim() || !newSampleScript.trim()) return;

    const persona = ALGIERS_PERSONA_REGISTRY[newSamplePersonaId];
    const newSample: ShowcaseAudioSample = {
      id: `sample-${Date.now()}`,
      personaId: newSamplePersonaId,
      title: newSampleTitle.trim(),
      category: newSampleCategory.trim() || 'تجارة عامة',
      personaTitle: persona.arabicTitle,
      avatarIcon: persona.avatarIcon,
      accentBadge: newSampleBadge.trim() || 'نبرة عاصمية مميزة',
      scriptText: newSampleScript.trim(),
      durationLabel: newSampleDuration.trim() || '15 ثانية',
      voiceName: persona.recommendedVoice,
      ...(uploadedAudioDataUrl ? { customAudioUrl: uploadedAudioDataUrl } : {}),
      isCustomUpload: Boolean(uploadedAudioDataUrl),
      createdAt: new Date().toISOString().slice(0, 10),
    };

    updateSamplesState([newSample, ...samples]);
    setShowAddSampleModal(false);

    // Reset Form
    setNewSampleTitle('');
    setNewSampleScript('');
    setUploadedAudioDataUrl(null);
    setUploadedFileName(null);
    setSampleActionToast(`تمت إضافة عينة "${newSample.title}" ونشرها بالواجهة بنجاح 🚀`);
    setTimeout(() => setSampleActionToast(null), 4000);
  };

  // Action: Delete Sample (instant deletion with zero blocking dialogs)
  const handleDeleteSample = (sampleId: string) => {
    if (activePlayingSampleId === sampleId) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setActivePlayingSampleId(null);
    }

    const target = samples.find((s) => s.id === sampleId);
    const filtered = samples.filter((s) => s.id !== sampleId);
    updateSamplesState(filtered);

    setSampleActionToast(`تم حذف عينة "${target?.title || 'العينة الصوتية'}" فوراً من لوحة الإدارة والواجهة الرئيسية 🗑️`);
    setTimeout(() => setSampleActionToast(null), 4000);
  };

  // Action: Save Edited Sample
  const handleSaveEditedSample = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSample) return;

    const persona = ALGIERS_PERSONA_REGISTRY[editingSample.personaId] || ALGIERS_PERSONA_REGISTRY.zephyr_warm;
    const updatedSample: ShowcaseAudioSample = {
      ...editingSample,
      personaTitle: persona.arabicTitle,
      avatarIcon: persona.avatarIcon,
      voiceName: persona.recommendedVoice,
      customAudioUrl: editSampleAudioUrl || editingSample.customAudioUrl,
      isCustomUpload: Boolean(editSampleAudioUrl || editingSample.isCustomUpload),
    };

    const updated = samples.map((s) => (s.id === editingSample.id ? updatedSample : s));
    updateSamplesState(updated);
    setEditingSample(null);
    setEditSampleAudioUrl(null);
    setEditSampleFileName(null);

    setSampleActionToast(`تم تحديث بيانات العينة "${updatedSample.title}" وحفظها فوراً ✨`);
    setTimeout(() => setSampleActionToast(null), 4000);
  };

  // Action: Reset Samples to Factory Defaults (non-blocking)
  const handleResetToFactorySamples = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setActivePlayingSampleId(null);
    updateSamplesState(INITIAL_SHOWCASE_SAMPLES);
    setSampleActionToast('تمت استعادة كافة النماذج الصوتية الافتراضية بنجاح 🔄');
    setTimeout(() => setSampleActionToast(null), 4000);
  };

  // Action: Test / Verify Gemini API Key
  const handleTestApiKey = async () => {
    setIsVerifyingApiKey(true);
    setApiVerificationResult(null);

    try {
      const res = await fetch('/api/admin/verify-api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: aiSettings.apiKey,
          model: aiSettings.primaryModel,
        }),
      });

      const data = await res.json() as ApiVerificationResponse;
      setApiVerificationResult(data);
    } catch (err: unknown) {
      setApiVerificationResult({
        success: false,
        message: 'تعذر الاتصال بالسيرفر لفحص المفتاح.',
      });
    } finally {
      setIsVerifyingApiKey(false);
    }
  };

  // Action: Save AI Settings
  const handleSaveAISettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveAdminAISettings(aiSettings);
    setAiSettings((current) => ({ ...current, apiKey: '' }));
    setSaveSettingsSuccess(true);
    setTimeout(() => setSaveSettingsSuccess(false), 3000);
  };

  // Copy Transaction ID Helper
  const handleCopyTxn = (txnId: string) => {
    navigator.clipboard.writeText(txnId);
    setCopiedTxnId(txnId);
    setTimeout(() => setCopiedTxnId(null), 2000);
  };

  // Computed Subscriptions Filter
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.storeName.toLowerCase().includes(subSearchQuery.toLowerCase()) ||
      sub.ownerName.toLowerCase().includes(subSearchQuery.toLowerCase()) ||
      sub.transactionId.toLowerCase().includes(subSearchQuery.toLowerCase()) ||
      sub.phone.includes(subSearchQuery) ||
      sub.email.toLowerCase().includes(subSearchQuery.toLowerCase());

    const matchesStatus = subStatusFilter === 'all' || sub.status === subStatusFilter;
    const matchesMethod = subMethodFilter === 'all' || sub.paymentMethod === subMethodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  // Calculate Metrics
  const totalSubscribers = subscriptions.length;
  const pendingCount = subscriptions.filter((s) => s.status === 'pending').length;
  const activeCount = subscriptions.filter((s) => s.status === 'active').length;
  const totalRevenueDzd = subscriptions
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + s.amountDzd, 0);

  return (
    <div className="space-y-8 min-h-screen text-slate-100 font-sans pb-16" dir="rtl">
      {/* Top Operations Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/90 to-slate-900 border border-indigo-500/40 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>غرفة العمليات الإدارية المركزية (Admin Master Console)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm">
                <span>👑 المالك المعتمد:</span>
                <span className="font-mono text-white underline">{ADMIN_EMAIL}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>خوادم الجزائر متصلة 58 ولاية</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              لوحة التحكم والإعدادات المتقدمة ⚙️🇩🇿
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
              إدارة طلبات واشتراكات المتاجر (بريدي موب والذهبية)، نشر وتعديل العينات الصوتية للواجهة
              الرئيسية، وضبط مفاتيح ونماذج محرك الذكاء الاصطناعي الصوتي.
            </p>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onNavigateToLanding}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 hover:text-white transition-all cursor-pointer shadow-md"
            >
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>معاينة الواجهة كزائر</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={onNavigateToStudio}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 transition-all cursor-pointer shadow-lg shadow-indigo-600/30 ring-1 ring-white/10"
            >
              <Volume2 className="w-4 h-4" />
              <span>استوديو الصوت العاصمي</span>
            </button>
          </div>
        </div>

        {/* Global Stats Mini Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">إجمالي المتاجر المشتركة</span>
            <span className="text-lg font-black text-white font-mono mt-0.5 block">{totalSubscribers} متاجر</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-amber-400 block text-[11px] font-bold">بانتظار التأكيد (بريدي موب)</span>
            <span className="text-lg font-black text-amber-300 font-mono mt-0.5 block">{pendingCount} طلبات</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-emerald-400 block text-[11px] font-bold">الاشتراكات المفعلة</span>
            <span className="text-lg font-black text-emerald-300 font-mono mt-0.5 block">{activeCount} متجر</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-indigo-400 block text-[11px] font-bold">إجمالي الإيرادات المقبوضة</span>
            <span className="text-lg font-black text-white font-mono mt-0.5 block">
              {totalRevenueDzd.toLocaleString('fr-DZ')} <span className="text-xs text-slate-400">دج</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto shadow-lg">
        <button
          type="button"
          onClick={() => setAdminTab('subscriptions')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer shrink-0 ${
            adminTab === 'subscriptions'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/40 ring-1 ring-white/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-300" />
          <span>إدارة الاشتراكات والمدفوعات</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-black bg-amber-400 text-slate-950">
              {pendingCount} جديد
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('samples')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer shrink-0 ${
            adminTab === 'samples'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/40 ring-1 ring-white/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Volume2 className="w-4 h-4 text-emerald-400" />
          <span>عينات الواجهة الرئيسية ({samples.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('ai_settings')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer shrink-0 ${
            adminTab === 'ai_settings'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/40 ring-1 ring-white/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4 text-amber-400" />
          <span>إعدادات الذكاء الاصطناعي والـ API</span>
        </button>

        <button
          type="button"
          onClick={() => setAdminTab('overview')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer shrink-0 ${
            adminTab === 'overview'
              ? 'bg-gradient-to-r from-slate-800 to-slate-700 text-white shadow-md ring-1 ring-white/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>حالة النظام والخوادم</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: Subscriptions Manager (قسم إدارة الاشتراكات وتأكيد المدفوعات) */}
      {/* ========================================================================= */}
      {adminTab === 'subscriptions' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Action & Filter Toolbar */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-500 absolute top-3.5 right-3.5 pointer-events-none" />
              <input
                type="text"
                value={subSearchQuery}
                onChange={(e) => setSubSearchQuery(e.target.value)}
                placeholder="ابحث باسم المتجر (مثل SunVera Jolie)، الـ Transaction ID، أو رقم الهاتف..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pr-10 pl-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
              <div className="flex items-center p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setSubStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    subStatusFilter === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  الكل ({subscriptions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSubStatusFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    subStatusFilter === 'pending'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-amber-400 hover:text-white'
                  }`}
                >
                  <span>بانتظار التأكيد</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                </button>
                <button
                  type="button"
                  onClick={() => setSubStatusFilter('active')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    subStatusFilter === 'active' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:text-white'
                  }`}
                >
                  المفعلة
                </button>
                <button
                  type="button"
                  onClick={() => setSubStatusFilter('rejected')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    subStatusFilter === 'rejected' ? 'bg-rose-600 text-white' : 'text-rose-400 hover:text-white'
                  }`}
                >
                  المرفوضة
                </button>
              </div>

              {/* Add Manual Sub Button */}
              <button
                type="button"
                onClick={() => setShowAddSubModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all cursor-pointer shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة معاملة يدوياً</span>
              </button>
            </div>
          </div>

          {/* Subscriptions Table Card */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-4 sm:px-6">المتجر والعميل</th>
                    <th className="p-4">الخطة والمبلغ</th>
                    <th className="p-4">وسيلة الدفع وكود المرجع (Transaction ID)</th>
                    <th className="p-4">تاريخ الطلب</th>
                    <th className="p-4">حالة الحساب</th>
                    <th className="p-4 text-center">إجراءات المراجعة الفورية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-sans">
                  {filteredSubscriptions.map((sub) => {
                    const isPending = sub.status === 'pending';
                    const isActive = sub.status === 'active';
                    const isRejected = sub.status === 'rejected';

                    return (
                      <tr
                        key={sub.id}
                        className={`hover:bg-slate-850/50 transition-colors ${
                          isPending ? 'bg-amber-950/10' : ''
                        }`}
                      >
                        {/* Store & Client Details */}
                        <td className="p-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-base shrink-0">
                              🛍️
                            </div>
                            <div>
                              <div className="font-extrabold text-sm text-white flex items-center gap-1.5">
                                <span>{sub.storeName}</span>
                                {sub.storeName.includes('SunVera') && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-pink-500/20 text-pink-300 border border-pink-500/40">
                                    موضة نسائية VIP
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                <span>{sub.ownerName}</span>
                                <span>•</span>
                                <span className="text-slate-500">{sub.wilaya}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {sub.phone} | {sub.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Plan & Amount */}
                        <td className="p-4">
                          <div className="font-extrabold text-white">
                            {sub.planLabel}
                          </div>
                          <div className="text-emerald-400 font-mono font-bold text-sm mt-0.5">
                            {sub.amountDzd.toLocaleString('fr-DZ')}{' '}
                            <span className="text-xs text-slate-400 font-sans">دج</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            استهلاك: {sub.adGenerationsUsed} / {sub.adGenerationsLimit === 9999 ? 'غير محدود' : sub.adGenerationsLimit} إعلان
                          </div>
                        </td>

                        {/* Payment & Transaction ID */}
                        <td className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            {sub.paymentMethod === 'baridimob' ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                <span>📱 بريدي موب (BaridiMob)</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 flex items-center gap-1">
                                <span>💳 الذهبية (Edahabia SATIM)</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <code className="text-xs font-mono font-bold text-indigo-300 bg-slate-950 px-2 py-1 rounded border border-slate-800" dir="ltr">
                              {sub.transactionId}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopyTxn(sub.transactionId)}
                              title="نسخ كود المعاملة"
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                            >
                              {copiedTxnId === sub.transactionId ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="p-4 font-mono text-[11px] text-slate-400">
                          <div>{sub.createdAt}</div>
                          {sub.activatedAt && (
                            <div className="text-emerald-400 text-[10px]">
                              تم التفعيل: {sub.activatedAt}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>بانتظار التأكيد</span>
                            </span>
                          )}
                          {isActive && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>مفعل ونشط ✓</span>
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              <XCircle className="w-3.5 h-3.5 text-rose-400" />
                              <span>ملغي / مرفوض</span>
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleActivateSubscription(sub.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md shadow-emerald-500/30 transition-all cursor-pointer"
                                  title="تأكيد الدفع وتفعيل الباقة فوراً"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>تفعيل الحساب ✓</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRejectSubscription(sub.id)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-300 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 transition-all cursor-pointer"
                                  title="رفض المعاملة لعدم ثبوت الدفع"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>رفض ✕</span>
                                </button>
                              </>
                            )}

                            {isActive && (
                              <>
                                <span className="text-[11px] text-emerald-400 font-bold px-2 py-1 bg-emerald-950/50 rounded-lg border border-emerald-800/40">
                                  تم التفعيل بنجاح
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleResetSubscription(sub.id)}
                                  className="text-[10px] text-slate-400 hover:text-amber-400 underline cursor-pointer px-1"
                                  title="إعادة للانتظار للتدقيق"
                                >
                                  تعديل
                                </button>
                              </>
                            )}

                            {isRejected && (
                              <button
                                type="button"
                                onClick={() => handleActivateSubscription(sub.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 transition-all cursor-pointer"
                              >
                                إعادة تفعيل ✓
                              </button>
                            )}

                            {/* View Receipt Proof Modal trigger */}
                            <button
                              type="button"
                              onClick={() => setSelectedReceiptSub(sub)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                              title="عرض إشعار وتفاصيل الدفع"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredSubscriptions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        لا توجد نتائج مطابقة لبحثك في قائمة المشتركين.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: Voice Samples Manager (قسم إدارة العينات الصوتية للواجهة) */}
      {/* ========================================================================= */}
      {adminTab === 'samples' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Action Bar */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-emerald-400" />
                <span>إدارة نماذج الأصوات المعروضة في الصفحة الرئيسية</span>
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                أي عينة صوتية ترفعها أو تعدلها أو تحذفها هنا تظهر فوراً للزوار في صفحة الهبوط للاستماع إليها قبل التسجيل.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-stretch sm:self-auto">
              <button
                type="button"
                onClick={handleResetToFactorySamples}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
              >
                استعادة الافتراضية
              </button>

              <button
                type="button"
                onClick={() => setShowAddSampleModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>رفع / إضافة عينة صوتية جديدة</span>
              </button>
            </div>
          </div>

          {/* Action Feedback Notification */}
          {sampleActionToast && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{sampleActionToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setSampleActionToast(null)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Empty State if all samples deleted */}
          {samples.length === 0 && (
            <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <Volume2 className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-extrabold text-white">لا توجد عينات صوتية حالياً</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                تم حذف كافة العينات من القائمة. يمكنك إضافة عينات جديدة أو استعادة النماذج الافتراضية بنقرة واحدة.
              </p>
              <button
                type="button"
                onClick={handleResetToFactorySamples}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>استعادة العينات الصوتية الافتراضية</span>
              </button>
            </div>
          )}

          {/* Showcase Samples Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {samples.map((sample) => {
              const isPlaying = activePlayingSampleId === sample.id;

              return (
                <div
                  key={sample.id}
                  className={`rounded-3xl p-6 border transition-all duration-300 relative flex flex-col justify-between ${
                    isPlaying
                      ? 'bg-gradient-to-b from-indigo-950/95 to-slate-900 border-indigo-500 shadow-xl shadow-indigo-600/30 ring-2 ring-indigo-500/50'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-2xl shadow-inner">
                          {sample.avatarIcon}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">{sample.personaTitle}</h4>
                          <span className="text-xs text-indigo-400 font-medium">{sample.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {sample.isCustomUpload && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            ملف مرفوع
                          </span>
                        )}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {sample.durationLabel}
                        </span>
                      </div>
                    </div>

                    {/* Title & Badge */}
                    <div className="mb-2.5">
                      <h5 className="text-xs font-bold text-white line-clamp-1">{sample.title}</h5>
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 mt-1">
                        {sample.accentBadge}
                      </span>
                    </div>

                    {/* Script Excerpt */}
                    <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 mb-4">
                      <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3">
                        "{sample.scriptText}"
                      </p>
                    </div>
                  </div>

                  {/* Playback & Admin Actions */}
                  <div className="pt-3 border-t border-slate-800/80 space-y-3">
                    {/* Audio wave indicator if active */}
                    {isPlaying && (
                      <div className="flex items-center justify-center gap-1.5 h-5">
                        <span className="w-1 bg-emerald-400 rounded-full animate-bounce h-3" />
                        <span className="w-1 bg-indigo-400 rounded-full animate-bounce h-5 delay-75" />
                        <span className="w-1 bg-teal-400 rounded-full animate-bounce h-3 delay-150" />
                        <span className="w-1 bg-emerald-300 rounded-full animate-bounce h-4 delay-200" />
                        <span className="w-1 bg-amber-400 rounded-full animate-bounce h-5 delay-100" />
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTogglePlaySample(sample)}
                        className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                          isPlaying
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300/40'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30'
                        }`}
                      >
                        {isPlaying ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>إيقاف ⏸️</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>استماع الآن 🎧</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingSample({ ...sample });
                          setEditSampleAudioUrl(null);
                          setEditSampleFileName(null);
                        }}
                        className="p-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
                        title="تعديل بيانات وسكريبت العينة"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSample(sample.id)}
                        className="p-2.5 rounded-xl bg-rose-950/60 text-rose-300 hover:text-white hover:bg-rose-900 border border-rose-800/40 transition-all cursor-pointer active:scale-90"
                        title="حذف من الصفحة الرئيسية فوراً"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: AI & API Settings (قسم إعدادات الذكاء الاصطناعي واللغات) */}
      {/* ========================================================================= */}
      {adminTab === 'ai_settings' && (
        <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
          {saveSettingsSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>تم حفظ وتحديث إعدادات الذكاء الاصطناعي والمنصة بنجاح!</span>
            </div>
          )}

          <form onSubmit={handleSaveAISettings} className="space-y-6">
            {/* Card 1: AI Model Configuration */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xl font-bold">
                  🧠
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    تحديد نماذج الذكاء الاصطناعي (AI Models Engine)
                  </h3>
                  <p className="text-xs text-slate-400">
                    التحكم في النماذج المستخدمة لصياغة السكريبتات الإعلانية وتوليد الأصوات العاصمية.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Primary Scriptwriting Model */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    نموذج كتابة السكريبتات الإعلانية (Copywriting Model):
                  </label>
                  <select
                    value={aiSettings.primaryModel}
                    onChange={(e) => setAiSettings({ ...aiSettings, primaryModel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  >
                    <option value="gemini-3.8-flash">gemini-3.8-flash (الموصى به - أقصى ذكاء وسرعة)</option>
                    <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (خفيف وسريع جداً)</option>
                    <option value="gemini-2.5-pro">gemini-2.5-pro (استنتاج معمق للإعلانات المعقدة)</option>
                  </select>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    يستخدم لصياغة سكريبتات إعلانات التجارة الإلكترونية وتوليد خواتم الفيديوهات.
                  </span>
                </div>

                {/* TTS Audio Model */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    محرك التوليد الصوتي (TTS Audio Engine Model):
                  </label>
                  <select
                    value={aiSettings.ttsModel}
                    onChange={(e) => setAiSettings({ ...aiSettings, ttsModel: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  >
                    <option value="gemini-3.8-flash-lite-tts">gemini-3.8-flash-lite-tts (محرك الكلام الرسمي)</option>
                    <option value="gemini-speech-v1">gemini-speech-v1 (نظام نبرات بديل)</option>
                  </select>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    يولد الترددات الصوتية للشخصيات العاصمية السبعة (Zephyr / Kore / Fenrir).
                  </span>
                </div>
              </div>

              {/* Visual Banner Model */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  نموذج توليد صور وبنرات الحملات (Image Model):
                </label>
                <select
                  value={aiSettings.visualModel}
                  onChange={(e) => setAiSettings({ ...aiSettings, visualModel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                >
                  <option value="gemini-3-pro-image-preview">gemini-3-pro-image-preview (دقة عالية 1K/2K/4K)</option>
                  <option value="gemini-3.1-flash-lite-image">gemini-3.1-flash-lite-image (سريع)</option>
                </select>
              </div>
            </div>

            {/* Card 2: Safe API Key Management */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-xl font-bold">
                  🔑
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    إدارة مفتاح الـ API الخاص بـ Google AI Studio (`GEMINI_API_KEY`)
                  </h3>
                  <p className="text-xs text-slate-400">
                    يمكن فحص مفتاح مؤقت هنا، لكنه لا يُحفظ في المتصفح. لتغيير مفتاح الإنتاج حدّث GEMINI_API_KEY في أسرار الخادم.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>مفتاح الـ API (Google Gemini API Key):</span>
                  <span className="text-[11px] text-emerald-400 font-normal">
                    {aiSettings.apiKey ? 'مفتاح مؤقت للفحص فقط' : 'مفتاح الخادم من إعدادات البيئة'}
                  </span>
                </label>

                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute top-3.5 right-3.5 pointer-events-none" />
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={aiSettings.apiKey}
                    onChange={(e) => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
                    placeholder="مفتاح مؤقت للفحص فقط"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-24 py-2.5 text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                      title={showApiKey ? 'إخفاء' : 'إظهار'}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] text-slate-400">
                    اترك الحقل فارغاً لاستخدام المفتاح المدمج بالسيرفر، أو ضع مفتاح مشروعك الخاص لزيادة الحصة اليومية.
                  </p>

                  <button
                    type="button"
                    onClick={handleTestApiKey}
                    disabled={isVerifyingApiKey}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 transition-all cursor-pointer shadow-md shadow-indigo-600/30"
                  >
                    {isVerifyingApiKey ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>جاري فحص الاتصال...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>اختبار الاتصال ⚡ (Test API Key)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* API Key Verification Status Alert */}
                {apiVerificationResult && (
                  <div
                    className={`mt-4 p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-3 animate-fadeIn ${
                      apiVerificationResult.success
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                        : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                    }`}
                  >
                    {apiVerificationResult.success ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                    )}
                    <div className="flex-1">
                      <div className="font-bold">
                        {apiVerificationResult.success ? 'الاتصال سليم 100%' : 'فشل فحص المفتاح'}
                      </div>
                      <div className="text-xs opacity-90 mt-0.5">
                        {apiVerificationResult.message}
                        {apiVerificationResult.latencyMs && (
                          <span className="font-mono mr-1">
                            (زمن الاستجابة: {apiVerificationResult.latencyMs}ms عبر {apiVerificationResult.modelUsed})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Platform Language & Aesthetic Themes */}
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-5 shadow-2xl">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-xl font-bold">
                  🎨
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    لغة الواجهة والسمات الجمالية للمنصة (Themes & Localization)
                  </h3>
                  <p className="text-xs text-slate-400">
                    تخصيص المظهر المرئي وقواعد اللغة واللهجة العاصمية.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Theme Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    السمة البصرية (Aesthetic Palette):
                  </label>
                  <select
                    value={aiSettings.theme}
                    onChange={(e) =>
                      setAiSettings({ ...aiSettings, theme: e.target.value as AdminAISettings['theme'] })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="dark-indigo-emerald">Dark Indigo & Emerald (المظهر العاصمي الاحترافي)</option>
                    <option value="midnight-sapphire">Midnight Sapphire & Cyan (أزرق ليلي ملكي)</option>
                    <option value="cyber-amber">Cyber Amber & Obsidian (عنبري تجاري فخم)</option>
                  </select>
                </div>

                {/* Language Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    لغة الواجهة الرئيسية (Language Direction):
                  </label>
                  <select
                    value={aiSettings.language}
                    onChange={(e) =>
                      setAiSettings({ ...aiSettings, language: e.target.value as AdminAISettings['language'] })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ar">العربية (Algerian E-Commerce Standard - RTL)</option>
                    <option value="fr">Français (Commercial Code-Switching Mode)</option>
                    <option value="en">English (International Agency Mode)</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aiSettings.enforceCod58Wilayas}
                    onChange={(e) =>
                      setAiSettings({ ...aiSettings, enforceCod58Wilayas: e.target.checked })
                    }
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      فرض عبارات التوصيل لـ 58 ولاية والدفع عند الاستلام (COD)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      يضمن احتواء كافة السكريبتات الإعلانية المولدة على تأكيد التوصيل والدفع عند المعاينة.
                    </span>
                  </div>
                </label>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      مستوى حظر الكلمات المغربية والمشرقية (Moroccan Negative Filter):
                    </span>
                    <span className="text-[11px] text-slate-400">
                      منع كلمات "دابا"، "واخا"، "مزيان"، "ديال" وتثبيت مفردات وسط الجزائر الصافية.
                    </span>
                  </div>
                  <select
                    value={aiSettings.moroccanFilterStrictness}
                    onChange={(e) =>
                      setAiSettings({
                        ...aiSettings,
                        moroccanFilterStrictness: e.target.value as AdminAISettings['moroccanFilterStrictness'],
                      })
                    }
                    className="bg-slate-900 border border-slate-700 text-emerald-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none"
                  >
                    <option value="strict">صارم (Strict 100%)</option>
                    <option value="balanced">معتدل (Balanced)</option>
                    <option value="relaxed">مرن (Relaxed)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="submit"
                className="px-8 py-3.5 rounded-2xl text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 shadow-xl shadow-emerald-500/25 transition-all cursor-pointer hover:scale-[1.02]"
              >
                حفظ وتطبيق جميع الإعدادات 💾
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: Platform Overview & System Stats */}
      {/* ========================================================================= */}
      {adminTab === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-indigo-400 uppercase">الخوادم والبنية التحتية</span>
              <h4 className="text-lg font-black text-white">بيئة التشغيل (Runtime)</h4>
              <div className="space-y-2 text-xs text-slate-300 font-mono">
                <div className="flex justify-between">
                  <span>Node.js:</span>
                  <span className="text-emerald-400">{systemStats?.nodeVersion || 'v20.x'}</span>
                </div>
                <div className="flex justify-between">
                  <span>منفذ السيرفر:</span>
                  <span className="text-emerald-400">3000 (Express + Vite)</span>
                </div>
                <div className="flex justify-between">
                  <span>استهلاك الذاكرة:</span>
                  <span className="text-white">{systemStats?.memoryUsageMb || '64'} MB</span>
                </div>
                <div className="flex justify-between">
                  <span>وقت التشغيل:</span>
                  <span className="text-white">{systemStats?.uptimeSeconds ? `${systemStats.uptimeSeconds}s` : 'نشط'}</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase">اللهجة العاصمية والـ COD</span>
              <h4 className="text-lg font-black text-white">تغطية الولايات (Wilayas)</h4>
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>عدد الولايات المدعومة:</span>
                  <span className="font-bold text-emerald-400">58 ولاية كاملة</span>
                </div>
                <div className="flex justify-between">
                  <span>نمط التسليم:</span>
                  <span className="font-bold text-white">الدفع عند الاستلام (COD)</span>
                </div>
                <div className="flex justify-between">
                  <span>دعم الكلمات الفرنسية:</span>
                  <span className="font-bold text-indigo-300">Code-Switching نشط</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase">الأصوات والشخصيات</span>
              <h4 className="text-lg font-black text-white">معجم الشخصيات (7 Personas)</h4>
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <span>🎙️ الشاب التجاري</span>
                  <span className="text-slate-500">•</span>
                  <span>👩‍💼 خبيرة الإعلانات</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📖 راوي القصص Storyteller</span>
                  <span className="text-slate-500">•</span>
                  <span>👦 طفل عاصمي</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>👧 طفلة بريئة</span>
                  <span className="text-slate-500">•</span>
                  <span>👴 عمي الشيخ</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>👵 لالة الحنينة</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: View Receipt & Subscription Details Modal */}
      {/* ========================================================================= */}
      {selectedReceiptSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-indigo-500/40 p-6 sm:p-8 shadow-2xl space-y-5">
            <button
              type="button"
              onClick={() => setSelectedReceiptSub(null)}
              className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-2xl font-bold">
                📄
              </div>
              <div>
                <h3 className="text-base font-black text-white">إشعار تفاصيل الدفع والمعاملة</h3>
                <span className="text-xs text-slate-400 font-mono">
                  معرّف الطلب: #{selectedReceiptSub.id}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs text-slate-300">
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-400">اسم المتجر:</span>
                <strong className="text-white">{selectedReceiptSub.storeName}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-400">صاحب المتجر:</span>
                <span className="text-white">{selectedReceiptSub.ownerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-400">الهاتف والولاية:</span>
                <span className="text-white">{selectedReceiptSub.phone} ({selectedReceiptSub.wilaya})</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-400">الباقة المختارة:</span>
                <span className="text-indigo-300 font-bold">{selectedReceiptSub.planLabel}</span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-400">المبلغ المدفوع:</span>
                <span className="text-emerald-400 font-bold font-mono text-sm">
                  {selectedReceiptSub.amountDzd.toLocaleString('fr-DZ')} دج
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-850 pb-2">
                <span className="text-slate-400">كود مرجع المعاملة (Txn ID):</span>
                <span className="text-indigo-400 font-mono font-bold" dir="ltr">
                  {selectedReceiptSub.transactionId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ملاحظة الوصل:</span>
                <span className="text-slate-200">{selectedReceiptSub.receiptNote || 'لا توجد ملاحظات'}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              {selectedReceiptSub.status === 'pending' ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      handleActivateSubscription(selectedReceiptSub.id);
                      setSelectedReceiptSub(null);
                    }}
                    className="flex-1 py-3 rounded-xl text-xs sm:text-sm font-extrabold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-md transition-all cursor-pointer"
                  >
                    تأكيد وتفعيل الحساب فوراً ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleRejectSubscription(selectedReceiptSub.id);
                      setSelectedReceiptSub(null);
                    }}
                    className="px-4 py-3 rounded-xl text-xs font-bold text-rose-300 bg-rose-950 border border-rose-800 hover:bg-rose-900 transition-all cursor-pointer"
                  >
                    رفض ✕
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setSelectedReceiptSub(null)}
                  className="w-full py-3 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  إغلاق الإشعار
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: Add Manual Subscription Modal */}
      {/* ========================================================================= */}
      {showAddSubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-indigo-500/40 p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowAddSubModal(false)}
              className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-black text-white">إضافة معاملة اشتراك محلية يدوياً</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                سجّل أي تحويل وصلك عبر الهاتف أو WhatsApp من متجر جديد.
              </p>
            </div>

            <form onSubmit={handleAddNewSubscription} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم المتجر المشترك:</label>
                <input
                  type="text"
                  required
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="مثال: متجر البهجة للإلكترونيات"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم المسؤول:</label>
                  <input
                    type="text"
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="أمين مداني"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم الهاتف:</label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="0550 12 34 56"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="store@domain.dz"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الولاية:</label>
                  <input
                    type="text"
                    value={newWilaya}
                    onChange={(e) => setNewWilaya(e.target.value)}
                    placeholder="16 - الجزائر"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الباقة:</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="starter">Starter (2,900 دج)</option>
                    <option value="pro">Pro E-Commerce (5,900 دج)</option>
                    <option value="business">Agency (14,500 دج)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">طريقة الدفع:</label>
                  <select
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="baridimob">بريدي موب (BaridiMob)</option>
                    <option value="edahabia">البطاقة الذهبية (Edahabia)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  كود مرجع المعاملة (Transaction ID):
                </label>
                <input
                  type="text"
                  value={newTxnId}
                  onChange={(e) => setNewTxnId(e.target.value)}
                  placeholder="BM-98234-DZ أو رقم الوصل"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">ملاحظة حول الوصل:</label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="تم إرسال صورة الوصل عبر واتساب"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-xl text-xs font-black text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-all cursor-pointer shadow-lg"
              >
                تسجيل المعاملة وإضافتها للقائمة ➕
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: Add / Upload New Voice Sample Modal */}
      {/* ========================================================================= */}
      {showAddSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-indigo-500/40 p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowAddSampleModal(false)}
              className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-emerald-400" />
                <span>إضافة عينة صوتية جديدة للواجهة الرئيسية</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ستظهر هذه العينة فوراً لجميع زوار الصفحة الرئيسية بنقرة "استمع الآن 🎧".
              </p>
            </div>

            <form onSubmit={handleAddNewSample} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">عنوان العينة الإعلانية:</label>
                <input
                  type="text"
                  required
                  value={newSampleTitle}
                  onChange={(e) => setNewSampleTitle(e.target.value)}
                  placeholder="مثال: فلاش سيل عطور فاخرة وهدايا رجالية"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الشخصية العاصمية:</label>
                  <select
                    value={newSamplePersonaId}
                    onChange={(e) => setNewSamplePersonaId(e.target.value as AlgiersPersonaId)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {Object.values(ALGIERS_PERSONA_REGISTRY).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.avatarIcon} {p.arabicTitle}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">تصنيف المنتج / السلعة:</label>
                  <input
                    type="text"
                    value={newSampleCategory}
                    onChange={(e) => setNewSampleCategory(e.target.value)}
                    placeholder="كوسميتيك، إلكترونيات، تمور"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">شارة التميز (Badge):</label>
                  <input
                    type="text"
                    value={newSampleBadge}
                    onChange={(e) => setNewSampleBadge(e.target.value)}
                    placeholder="إعلان TikTok الأكثر مبيعاً"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">مدة الإعلان التقديرية:</label>
                  <input
                    type="text"
                    value={newSampleDuration}
                    onChange={(e) => setNewSampleDuration(e.target.value)}
                    placeholder="14 ثانية"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  نص السكريبت الإعلاني بالدارجة العاصمية:
                </label>
                <textarea
                  rows={3}
                  required
                  value={newSampleScript}
                  onChange={(e) => setNewSampleScript(e.target.value)}
                  placeholder="يا خاوتي الفلاش سيل راهو بدا! بري شوك وتخفيض 40%..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white leading-relaxed"
                />
              </div>

              {/* Audio Source: File Upload OR AI Synthesis */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <label className="block font-bold text-slate-300">مصدر الصوت (WAV / MP3):</label>

                <div className="flex flex-col sm:flex-row gap-2">
                  {/* File Upload Input */}
                  <label className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-indigo-500/50 hover:border-indigo-400 bg-indigo-950/20 text-indigo-300 hover:text-white cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    <span>{uploadedFileName ? uploadedFileName : 'اختر ملف صوتي من جهازك (WAV/MP3)'}</span>
                    <input
                      type="file"
                      accept="audio/wav,audio/mp3,audio/mpeg,audio/ogg"
                      onChange={handleAudioFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* Speak and Synthesize Speech Button */}
                  <button
                    type="button"
                    onClick={handleSpeakAndSynthesizeInAdd}
                    disabled={isGeneratingSampleAudio || isSpeakingInAdd}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-black transition-all cursor-pointer shadow-md shadow-emerald-600/30 shrink-0"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isSpeakingInAdd ? 'animate-pulse text-amber-300' : 'text-emerald-200'}`} />
                    <span>
                      {isSpeakingInAdd
                        ? '🎙️ جاري النطق وتوليد الصوت...'
                        : '🎙️ نطق وتوليد النص الصوتي بالذكاء الاصطناعي'}
                    </span>
                  </button>
                </div>

                {uploadedAudioDataUrl && (
                  <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تم نطق وتوليد الصوت البشري بنجاح وهو جاهز للنشر في الواجهة!</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all cursor-pointer shadow-lg"
              >
                نشر العينة في الصفحة الرئيسية فوراً 🚀
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: Edit Existing Sample Modal */}
      {/* ========================================================================= */}
      {editingSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn" dir="rtl">
          <div className="relative w-full max-w-lg rounded-3xl bg-slate-900 border border-indigo-500/40 p-6 sm:p-8 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setEditingSample(null);
                setEditSampleAudioUrl(null);
                setEditSampleFileName(null);
              }}
              className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{editingSample.avatarIcon}</span>
                <h3 className="text-base font-black text-white">تعديل العينة الصوتية</h3>
              </div>
              <p className="text-xs text-slate-400">
                تحديث بيانات وسكريبت والشخصية الإعلانية للظهور الفوري بالواجهة.
              </p>
            </div>

            <form onSubmit={handleSaveEditedSample} className="space-y-3.5 text-xs">
              {/* Persona Selector */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">الشخصية الإعلانية (Voice Persona):</label>
                <select
                  value={editingSample.personaId}
                  onChange={(e) => {
                    const pId = e.target.value as AlgiersPersonaId;
                    const persona = ALGIERS_PERSONA_REGISTRY[pId];
                    setEditingSample({
                      ...editingSample,
                      personaId: pId,
                      personaTitle: persona.arabicTitle,
                      avatarIcon: persona.avatarIcon,
                      voiceName: persona.recommendedVoice,
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {Object.values(ALGIERS_PERSONA_REGISTRY).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.avatarIcon} {p.arabicTitle} ({p.recommendedVoice})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">عنوان العينة الإعلانية:</label>
                <input
                  type="text"
                  required
                  value={editingSample.title}
                  onChange={(e) => setEditingSample({ ...editingSample, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Category & Badge */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">التصنيف والسلع:</label>
                  <input
                    type="text"
                    value={editingSample.category}
                    onChange={(e) => setEditingSample({ ...editingSample, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الشارة الإعلانية:</label>
                  <input
                    type="text"
                    value={editingSample.accentBadge}
                    onChange={(e) => setEditingSample({ ...editingSample, accentBadge: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Duration Label */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">المدة التقريبية:</label>
                <input
                  type="text"
                  value={editingSample.durationLabel}
                  onChange={(e) => setEditingSample({ ...editingSample, durationLabel: e.target.value })}
                  placeholder="15 ثانية"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Script Text */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">النص الإعلاني المنطوق (اللهجة العاصمية):</label>
                <textarea
                  rows={4}
                  required
                  value={editingSample.scriptText}
                  onChange={(e) => setEditingSample({ ...editingSample, scriptText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Audio Controls inside Edit Modal */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-300 font-bold">حالة الصوت المنطوق:</span>
                  <span className="text-emerald-400 font-bold font-mono">
                    {editSampleFileName || (editingSample.isCustomUpload ? 'تسجيل صوتي بشري جاهز' : 'نطق صوتي ذكي (Speech Synthesis)')}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const testUrl = editSampleAudioUrl || editingSample.customAudioUrl;
                      if (testUrl && testUrl.startsWith('data:audio')) {
                        const a = new Audio(testUrl);
                        a.play().catch(() => {
                          speakAdScript(editingSample.scriptText, editingSample.personaId);
                        });
                      } else {
                        speakAdScript(editingSample.scriptText, editingSample.personaId);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/30 text-indigo-200 hover:bg-indigo-600 hover:text-white border border-indigo-500/40 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>استماع تجريبي 🎧</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSpeakAndSynthesizeInEdit}
                    disabled={isSpeakingInEdit}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-600/30 ring-1 ring-white/10"
                  >
                    <Volume2 className={`w-3.5 h-3.5 ${isSpeakingInEdit ? 'animate-pulse text-amber-300' : 'text-emerald-200'}`} />
                    <span>
                      {isSpeakingInEdit
                        ? '🎙️ جاري النطق وتوليد الصوت...'
                        : '🎙️ نطق وتوليد النص الصوتي بالذكاء الاصطناعي'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3.5 rounded-xl text-xs sm:text-sm font-black text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  حفظ التعديلات والتحديث الفوري بالواجهة ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSample(null);
                    setEditSampleAudioUrl(null);
                    setEditSampleFileName(null);
                  }}
                  className="px-5 py-3.5 rounded-xl text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
