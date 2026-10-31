import React, { useState, useRef, useEffect } from 'react';
import { AlgerianOutroItem, GeneratedVoiceScriptResult } from '../types/index';
import {
  ALGERIAN_OUTRO_COLLECTION,
  ALGERIAN_DIALECTS,
  filterAlgerianOutros,
} from '../utils/campaign';
import {
  Mic,
  Play,
  Pause,
  Download,
  Copy,
  Check,
  Sparkles,
  Volume2,
  Wand2,
  Search,
  CheckCircle2,
  Send,
  RefreshCw,
  Sliders,
  Radio,
  FileAudio,
  Mail,
  Flame,
  Clock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface AlgerianOutroStudioProps {
  onUseInCampaign?: (text: string) => void;
  onNavigateToTab?: (tab: 'campaign' | 'chat') => void;
}

export const AlgerianOutroStudio: React.FC<AlgerianOutroStudioProps> = ({
  onUseInCampaign,
  onNavigateToTab,
}) => {
  // Preset outro cards state
  const [outros, setOutros] = useState<AlgerianOutroItem[]>(ALGERIAN_OUTRO_COLLECTION);
  const [selectedPresetRegion, setSelectedPresetRegion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingPresetId, setPlayingPresetId] = useState<string | null>(null);
  const [generatingPresetVoiceId, setGeneratingPresetVoiceId] = useState<string | null>(null);

  // Single-action Automated Pipeline State
  const [promptInput, setPromptInput] = useState('');
  const [selectedDialect, setSelectedDialect] = useState<string>('general');
  const [selectedVoice, setSelectedVoice] = useState<'Zephyr' | 'Puck' | 'Fenrir' | 'Kore' | 'Charon'>('Zephyr');
  const [selectedAudience, setSelectedAudience] = useState<string>('ريلز وتيك توك');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<number>(0);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Active Generated Result & History
  const [activeResult, setActiveResult] = useState<GeneratedVoiceScriptResult | null>(null);
  const [history, setHistory] = useState<GeneratedVoiceScriptResult[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState(false);
  const [usedInCampaignToast, setUsedInCampaignToast] = useState(false);

  // Audio Player State for Active Result
  const [isPlayingActive, setIsPlayingActive] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(15);

  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const presetAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sync recommended voice when dialect changes (if user hasn't explicitly changed it)
  const handleDialectChange = (dialectId: string) => {
    setSelectedDialect(dialectId);
    const dialectData = ALGERIAN_DIALECTS.find((d) => d.id === dialectId);
    if (dialectData) {
      setSelectedVoice(dialectData.recommendedVoice);
    }
  };

  // Automated Single-Click Pipeline Handler
  const handleGenerateScriptAndAudio = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const prompt = promptInput.trim();
    if (!prompt || isGenerating) return;

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationStep(1); // Step 1: Script generation

    try {
      // Step timer for visual feedback
      const stepTimer = setTimeout(() => {
        setGenerationStep(2); // Step 2: Gemini TTS synthesis
      }, 1200);

      const res = await fetch('/api/generate-voice-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          dialect: selectedDialect,
          voice: selectedVoice,
          targetAudience: selectedAudience,
        }),
      });

      clearTimeout(stepTimer);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${res.status})`);
      }

      setGenerationStep(3); // Step 3: Finalizing WAV & Player

      const data: GeneratedVoiceScriptResult = await res.json();
      setActiveResult(data);
      setHistory((prev) => [data, ...prev.slice(0, 9)]);

      // Auto-play audio if returned
      if (data.audioDataUrl) {
        if (activeAudioRef.current) {
          activeAudioRef.current.pause();
        }
        const audio = new Audio(data.audioDataUrl);
        audio.playbackRate = playbackSpeed;
        audio.onloadedmetadata = () => {
          if (audio.duration && !isNaN(audio.duration)) {
            setDuration(audio.duration);
          }
        };
        audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
        audio.onended = () => {
          setIsPlayingActive(false);
          setCurrentTime(0);
        };
        activeAudioRef.current = audio;
        audio.play().catch(() => {});
        setIsPlayingActive(true);
      }
    } catch (err: unknown) {
      console.error('Unified voice script pipeline error:', err);
      setGenerationError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء معالجة الصوت والسكريبت. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setIsGenerating(false);
      setGenerationStep(0);
    }
  };

  const toggleActiveAudio = () => {
    if (!activeResult?.audioDataUrl) return;

    if (!activeAudioRef.current) {
      const audio = new Audio(activeResult.audioDataUrl);
      audio.playbackRate = playbackSpeed;
      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration)) setDuration(audio.duration);
      };
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
      audio.onended = () => {
        setIsPlayingActive(false);
        setCurrentTime(0);
      };
      activeAudioRef.current = audio;
    }

    if (isPlayingActive) {
      activeAudioRef.current.pause();
      setIsPlayingActive(false);
    } else {
      if (presetAudioRef.current) presetAudioRef.current.pause();
      setPlayingPresetId(null);
      activeAudioRef.current.play().catch(() => {});
      setIsPlayingActive(true);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (activeAudioRef.current) {
      activeAudioRef.current.playbackRate = speed;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setCurrentTime(val);
    if (activeAudioRef.current) {
      activeAudioRef.current.currentTime = val;
    }
  };

  const handleCopyText = (text: string, isMainScript = false, id = '') => {
    navigator.clipboard.writeText(text);
    if (isMainScript) {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDownloadWav = (audioUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${filename}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleSendToCampaign = (text: string) => {
    if (onUseInCampaign) {
      onUseInCampaign(text);
    }
    setUsedInCampaignToast(true);
    setTimeout(() => setUsedInCampaignToast(false), 3000);
  };

  const handlePlayPresetAudio = async (item: AlgerianOutroItem) => {
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      setIsPlayingActive(false);
    }

    if (playingPresetId === item.id) {
      if (presetAudioRef.current) {
        presetAudioRef.current.pause();
        setPlayingPresetId(null);
      }
      return;
    }

    if (item.audioDataUrl) {
      if (presetAudioRef.current) presetAudioRef.current.pause();
      const audio = new Audio(item.audioDataUrl);
      audio.playbackRate = playbackSpeed;
      audio.onended = () => setPlayingPresetId(null);
      presetAudioRef.current = audio;
      audio.play().catch(() => {});
      setPlayingPresetId(item.id);
      return;
    }

    // Generate speech for preset
    setGeneratingPresetVoiceId(item.id);
    try {
      const res = await fetch('/api/generate-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: item.phoneticGuide || item.arabicText,
          voiceName: item.recommendedVoice,
          speechStyle: `Friendly lively Algerian Darija outro: ${item.vibe}`,
        }),
      });
      const data = await res.json();
      if (data.audioDataUrl) {
        setOutros((prev) =>
          prev.map((o) => (o.id === item.id ? { ...o, audioDataUrl: data.audioDataUrl } : o))
        );

        if (presetAudioRef.current) presetAudioRef.current.pause();
        const audio = new Audio(data.audioDataUrl);
        audio.playbackRate = playbackSpeed;
        audio.onended = () => setPlayingPresetId(null);
        presetAudioRef.current = audio;
        audio.play().catch(() => {});
        setPlayingPresetId(item.id);
      }
    } catch (err) {
      console.error('Failed to generate preset speech:', err);
    } finally {
      setGeneratingPresetVoiceId(null);
    }
  };

  const handleLoadPresetIntoStudio = (item: AlgerianOutroItem) => {
    setPromptInput(item.arabicText);
    const matchedDialect =
      item.region.includes('العاصمي')
        ? 'algiers'
        : item.region.includes('الوهراني')
        ? 'western'
        : item.region.includes('القسنطيني')
        ? 'eastern'
        : item.region.includes('تراثي')
        ? 'sahara'
        : 'general';
    setSelectedDialect(matchedDialect);
    setSelectedVoice(item.recommendedVoice);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const filteredPresets = filterAlgerianOutros(outros, selectedPresetRegion, searchQuery);

  const PROMPT_SUGGESTIONS = [
    { label: '🚀 فلوق سفر واستكشاف', text: 'فلوق استكشاف مدينة وهران ومعالمها السياحية، أطلب من المتابعين التعليق بأحسن مكان يزوروه والاشتراك في القناة' },
    { label: '🛍️ متجر إلكتروني وتوصيل 58 ولاية', text: 'إعلان متجر إلكتروني للملابس والأحذية، التوصيل متوفر لـ 58 ولاية والدفع عند الاستلام مع تخفيض 30% لنهاية الأسبوع' },
    { label: '📱 مراجعة هاتف وتقنية', text: 'خاتمة فيديو مراجعة هاتف سامسونج جديد، تطلب من المشاهدين لايك وكومنت برأيهم في الكاميرا، وتفعيل الجرس' },
    { label: '🍲 طبخ ووصفات تقليدية', text: 'فيديو طبخ الكسكس الجزائري الأصيل، خاتمة دافئة تدعو بالصحة والهنا للمتابعين والاشتراك لطلب وصفات جديدة' },
  ];

  return (
    <div className="space-y-8" dir="rtl">
      {/* Algerian Outro Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border border-emerald-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>محرك التوليد الآلي الموحّد: سكريبت دارجة + صوت Gemini TTS في نقرة واحدة</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-sans">
            استوديو الأصوات والخواتم الجزائرية 🇩🇿
          </h1>
          <div className="text-emerald-400 font-bold text-sm sm:text-base tracking-wide mt-1">
            Algerian Video Outros, Dialect Signatures &amp; TTS Studio
          </div>
          <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed font-sans max-w-3xl">
            أول منصة متكاملة تجمع بين صياغة السكريبت الإعلاني بالدارجة الجزائرية الدقيقة (العاصمية، الوهرانية، الشرقية، الصحراوية، والعامة) وتوليد الأداء الصوتي الحقيقي فورياً بصيغة WAV جاهزة للاستعمال في فيديوهاتك وحملاتك!
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-emerald-200">
            <span className="flex items-center gap-1.5 bg-emerald-950/70 px-3 py-1.5 rounded-xl border border-emerald-700/50">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 5 لهجات جزائرية مدعومة بدقة
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-950/70 px-3 py-1.5 rounded-xl border border-emerald-700/50">
              <Volume2 className="w-4 h-4 text-emerald-400" /> أصوات Gemini TTS (Zephyr, Puck, Kore, Fenrir, Charon)
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-950/70 px-3 py-1.5 rounded-xl border border-emerald-700/50">
              <Download className="w-4 h-4 text-emerald-400" /> تحميل فوري بصيغة WAV نقية وعالية الجودة
            </span>
          </div>
        </div>
      </div>

      {/* CORE FEATURE: Single-Action Automated Voice & Script Generation Pipeline */}
      <div className="rounded-3xl bg-slate-900/95 border-2 border-emerald-500/40 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30 ring-1 ring-white/20">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <span>توليد السكريبت والصوت بالدارجة فوريًا</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  1-Click Pipeline
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                اختر اللهجة ونموذج الصوت واكتب فكرة الفيديو لتوليد السكريبت المشكّل والملف الصوتي دفعة واحدة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-400 font-semibold">سرعة المشغل:</span>
            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              {[0.8, 1, 1.25, 1.5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => handleSpeedChange(spd)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold cursor-pointer transition-all ${
                    playbackSpeed === spd
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Suggestion Chips */}
        <div className="mb-5">
          <label className="text-xs font-bold text-slate-300 block mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>أفكار جاهزة لتجربة سريعة:</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {PROMPT_SUGGESTIONS.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPromptInput(item.text)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-emerald-950/60 hover:text-emerald-200 text-slate-300 border border-slate-700/80 hover:border-emerald-500/50 transition-all text-right cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleGenerateScriptAndAudio} className="space-y-5">
          {/* Main Prompt / Script Draft */}
          <div>
            <label htmlFor="voice-prompt-input" className="block text-xs font-bold uppercase tracking-wider text-slate-200 mb-1.5">
              موضوع الفيديو أو مسوّدة السكريبت المطلوب <span className="text-emerald-400">*</span>
            </label>
            <textarea
              id="voice-prompt-input"
              rows={3}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="اكتب فكرة الفيديو، مثلاً: خاتمة حماسية لفيديو تيك توك حول أسرار التصوير بالهاتف مع طلب الاشتراك واللايك ومشاركة الفيديو مع الصحاب..."
              required
              className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y min-h-[95px] leading-relaxed"
            />
          </div>

          {/* Dialect and Voice Selectors (The 5 Specified Algerian Dialects) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Dialect Selector Dropdown (Requirement 2) */}
            <div>
              <label htmlFor="dialect-select-dropdown" className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Radio className="w-3.5 h-3.5 text-emerald-400" />
                <span>اللهجة الجزائرية المحددة <span className="text-emerald-400">*</span></span>
              </label>
              <select
                id="dialect-select-dropdown"
                value={selectedDialect}
                onChange={(e) => handleDialectChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {ALGERIAN_DIALECTS.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-900 text-slate-100">
                    {d.label} ({d.englishLabel})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-1">
                {ALGERIAN_DIALECTS.find((d) => d.id === selectedDialect)?.description}
              </p>
            </div>

            {/* Voice Model Selector (Gemini TTS) */}
            <div>
              <label htmlFor="voice-model-select" className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>نموذج الصوت (Gemini TTS)</span>
              </label>
              <select
                id="voice-model-select"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="Zephyr" className="bg-slate-900 text-slate-100">
                  Zephyr (صوت دافئ متوازن - عاصمي وشبابي)
                </option>
                <option value="Puck" className="bg-slate-900 text-slate-100">
                  Puck (صوت حيوي شبابي مفعم بالحماس - وهراني وتيك توك)
                </option>
                <option value="Fenrir" className="bg-slate-900 text-slate-100">
                  Fenrir (صوت رخيم عميق وفخم - شرقي ووثائقي)
                </option>
                <option value="Kore" className="bg-slate-900 text-slate-100">
                  Kore (صوت أنثوي احترافي ومقنع - تسويقي وتجاري)
                </option>
                <option value="Charon" className="bg-slate-900 text-slate-100">
                  Charon (صوت حكيم وشعبي دافئ - تراثي وصحراوي)
                </option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5">
                يدعم نطق الكلمات الشعبية وتشكيل المخارج الصوتية.
              </p>
            </div>

            {/* Target Video Style */}
            <div>
              <label htmlFor="target-audience-select" className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-pink-400" />
                <span>نوع ونبرة الفيديو</span>
              </label>
              <select
                id="target-audience-select"
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-semibold focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
              >
                <option value="ريلز وتيك توك سريعة">ريلز وتيك توك سريعة ومثيرة</option>
                <option value="يوتيوب وفلوقات عفوية">يوتيوب وفلوقات عفوية ودية</option>
                <option value="إعلانات تجارية ومتاجر 58 ولاية">إعلانات تجارية ومتاجر إلكترونية</option>
                <option value="بودكاست ومقابلات حوارية">بودكاست ومقابلات حوارية رزينة</option>
                <option value="فيديوهات تعليمية وتطوير الذات">فيديوهات تعليمية وتقنية</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5">
                تحديد الهدف يضبط نبرة الـ Call To Action بدقة.
              </p>
            </div>
          </div>

          {/* Error Message if Any */}
          {generationError && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs flex items-center justify-between">
              <span>{generationError}</span>
              <button
                type="button"
                onClick={() => setGenerationError(null)}
                className="underline text-red-300 hover:text-white"
              >
                إغلاق
              </button>
            </div>
          )}

          {/* Success Toast when transferred to Campaign */}
          {usedInCampaignToast && (
            <div className="p-3.5 rounded-xl bg-indigo-950/80 border border-indigo-500/60 text-indigo-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>تم إرسال الخاتمة الجزائرية بنجاح إلى مسوّدة حملة البريد الإلكتروني!</span>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isGenerating || !promptInput.trim()}
            aria-label="Generate script and audio in Algerian Darija"
            className="w-full py-4 px-6 rounded-2xl font-extrabold text-sm sm:text-base text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGenerating ? (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-3 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                <span>
                  {generationStep === 1 && 'جاري صياغة السكريبت بالدارجة المختارة...'}
                  {generationStep === 2 && 'جاري توليد الصوت عبر محرك Gemini TTS...'}
                  {generationStep === 3 && 'جاري تجهيز مشغل الصوت وملف WAV...'}
                  {generationStep === 0 && 'جاري المعالجة...'}
                </span>
              </div>
            ) : (
              <>
                <Volume2 className="w-5 h-5 text-slate-950" />
                <span>توليد السكريبت والصوت بالدارجة فوريًا</span>
                <Sparkles className="w-4 h-4 text-slate-950" />
              </>
            )}
          </button>
        </form>

        {/* Generated Active Result Box */}
        {activeResult && (
          <div className="mt-8 pt-6 border-t border-slate-800 space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-white">{activeResult.catchyTitle}</h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {activeResult.dialectLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  الصوت: {activeResult.voice} • الأداء: {activeResult.deliveryStyle} • المدة: {activeResult.durationEstimate}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {activeResult.audioDataUrl && (
                  <button
                    onClick={() => handleDownloadWav(activeResult.audioDataUrl!, `algerian-outro-${activeResult.dialect}`)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل WAV</span>
                  </button>
                )}

                <button
                  onClick={() => handleCopyText(activeResult.scriptText, true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
                >
                  {copiedScript ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedScript ? 'تم نسخ السكريبت!' : 'نسخ السكريبت'}</span>
                </button>

                <button
                  onClick={() => handleSendToCampaign(activeResult.scriptText)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-600/90 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 cursor-pointer"
                  title="نقل هذا النص إلى مسودة حملة البريد"
                >
                  <Mail className="w-4 h-4" />
                  <span>استعمال في الحملة</span>
                </button>
              </div>
            </div>

            {/* High-Fidelity Audio Player Widget */}
            {activeResult.audioDataUrl && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-emerald-500/40 shadow-inner flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleActiveAudio}
                      aria-label={isPlayingActive ? 'Pause generated audio' : 'Play generated audio'}
                      className="w-12 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all cursor-pointer shrink-0"
                    >
                      {isPlayingActive ? (
                        <Pause className="w-6 h-6 fill-current" />
                      ) : (
                        <Play className="w-6 h-6 fill-current translate-x-0.5" />
                      )}
                    </button>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>مشغل الصوت الجزائري (WAV 24kHz)</span>
                        {isPlayingActive && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')} / {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
                      </div>
                    </div>
                  </div>

                  {/* Soundwave bars animation */}
                  <div className="flex items-center gap-1 h-8 px-3">
                    {[16, 24, 32, 18, 28, 14, 30, 22, 15, 26, 32, 19, 25].map((height, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-200 ${
                          isPlayingActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'
                        }`}
                        style={{
                          height: isPlayingActive ? `${Math.max(6, (height * (i % 2 === 0 ? 1 : 0.7)))}px` : '8px',
                          animationDelay: `${i * 0.08}s`,
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Progress Scrubber */}
                <input
                  type="range"
                  min="0"
                  max={duration || 15}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  aria-label="Audio scrubber"
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            )}

            {/* Script Display Card */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 pb-2 border-b border-slate-800/80">
                <span>نص السكريبت للإلقاء:</span>
                <span className="text-emerald-400">إجراء المتابع: {activeResult.callToAction}</span>
              </div>

              <p className="text-base sm:text-lg font-bold text-white leading-relaxed font-sans select-all">
                {activeResult.scriptText}
              </p>

              {activeResult.phoneticText && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-slate-400 leading-relaxed">
                  <span className="text-amber-400 font-bold ml-1">دليل النطق والتشكيل الصوتي:</span>
                  <span className="text-slate-300 font-sans">{activeResult.phoneticText}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Preset Library & Outros Explorer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Region Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {[
            { id: 'all', label: 'جميع الخواتم الجاهزة' },
            { id: 'العاصمي (الوسط)', label: 'العاصمي' },
            { id: 'الوهراني (الغرب)', label: 'الوهراني' },
            { id: 'القسنطيني (الشرق)', label: 'الشرقي' },
            { id: 'تسويقي تجاري (Business & E-Commerce)', label: 'تسويقي وتجاري' },
            { id: 'شبابي لصناع المحتوى (Creator & Vlog)', label: 'يوتيوب وريلز' },
            { id: 'تراثي وشعبي (Traditional)', label: 'تراثي وشعبي' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedPresetRegion(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPresetRegion === tab.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالكلمات أو اللهجة..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPresets.map((item) => {
          const isPlaying = playingPresetId === item.id;
          const isGeneratingThis = generatingPresetVoiceId === item.id;

          return (
            <div
              key={item.id}
              className={`rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                isPlaying
                  ? 'bg-slate-900/95 border-emerald-500/80 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/40'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700/80'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <Mic className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{item.title}</span>
                    </h3>
                    <div className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      {item.englishSubtitle}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {item.region}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
                        الصوت: {item.voiceLabel}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800/80 text-amber-300 border border-amber-500/20 shrink-0">
                    {item.vibe}
                  </span>
                </div>

                {/* Main Script */}
                <div className="my-3 p-4 rounded-xl bg-slate-950 border border-slate-800/90 text-slate-100 text-sm leading-relaxed font-sans select-all">
                  <p className="font-semibold text-white">{item.arabicText}</p>
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                    <span className="text-emerald-400 font-bold ml-1">دليل النطق:</span>
                    <span>{item.phoneticGuide}</span>
                  </div>
                </div>

                <div className="text-xs text-slate-400 mb-4">
                  <span className="text-slate-500 font-semibold">مناسب لـ:</span> {item.bestFor}
                </div>
              </div>

              {/* Bottom Card Actions */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlayPresetAudio(item)}
                    disabled={isGeneratingThis}
                    aria-label={`Play audio for ${item.title}`}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isPlaying
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                    } disabled:opacity-50`}
                  >
                    {isGeneratingThis ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>جاري توليد الصوت...</span>
                      </>
                    ) : isPlaying ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>إيقاف</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>استماع</span>
                      </>
                    )}
                  </button>

                  {item.audioDataUrl && (
                    <button
                      onClick={() => handleDownloadWav(item.audioDataUrl!, `algerian-outro-${item.id}`)}
                      aria-label="Download Outro WAV"
                      className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                      title="تحميل الملف الصوتي WAV"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleLoadPresetIntoStudio(item)}
                    aria-label="Load preset into studio"
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="تعديل في المولد الصوتي"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>تعديل</span>
                  </button>

                  <button
                    onClick={() => handleCopyText(item.arabicText, false, item.id)}
                    aria-label="Copy outro text"
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === item.id ? 'تم!' : 'نسخ'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
