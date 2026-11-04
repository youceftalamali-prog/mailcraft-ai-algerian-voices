import React, { useState } from 'react';
import { Header, AppTab } from './components/Header';
import { PublicPricingWithAudioPreview } from './components/PublicPricingWithAudioPreview';
import { CampaignForm } from './components/CampaignForm';
import { CampaignDisplay } from './components/CampaignDisplay';
import { AlgerianOutroStudio } from './components/AlgerianOutroStudio';
import { PersonaVoiceGenerator } from './components/PersonaVoiceGenerator';
import { ChatbotInterface } from './components/ChatbotInterface';
import { AdminMasterDashboard } from './components/AdminMasterDashboard';
import { EmailCampaign } from './types/index';
import { generateDefaultCampaign } from './utils/campaign';
import {
  ShowcaseAudioSample,
  ADMIN_EMAIL,
  isAdminUser,
} from './services/adminStore';
import { loadShowcaseSamplesFromServer } from './services/showcaseSamplesApi';
import { Sparkles, AlertCircle, Wand2, Mic, MessageSquare, ShieldCheck, Lock, ShieldAlert, KeyRound, Crown, ArrowRight, CheckCircle2 } from 'lucide-react';

type SessionUser = { email: string; role: 'admin' | 'user' };
type SessionResponse = { authenticated: boolean; user?: SessionUser | null };
type AuthResponse = { success?: boolean; user?: SessionUser; message?: string };
type ImageGenerationResponse = { imageUrl?: string };

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('landing');
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem('dz_user_email');
    } catch {
      return null;
    }
  });
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'user' | null>(null);
  const [adminLoginFormEmail, setAdminLoginFormEmail] = useState(ADMIN_EMAIL);
  const [adminLoginFormPassword, setAdminLoginFormPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [showcaseSamples, setShowcaseSamples] = useState<ShowcaseAudioSample[]>([]);
  const [showcaseSamplesReady, setShowcaseSamplesReady] = useState(false);
  const [showcaseSamplesLoadError, setShowcaseSamplesLoadError] = useState<string | null>(null);

  // Showcase samples are shared server data, not per-browser localStorage.
  React.useEffect(() => {
    let active = true;
    loadShowcaseSamplesFromServer()
      .then((samples) => {
        if (active) {
          setShowcaseSamples(samples);
          setShowcaseSamplesLoadError(null);
        }
      })
      .catch((error: unknown) => {
        console.warn('Could not load shared showcase samples:', error);
        if (active) setShowcaseSamplesLoadError('تعذر تحميل العينات المحفوظة. لم نعرض بيانات افتراضية حتى لا يتم استبدال بياناتك الحقيقية بالخطأ.');
      })
      .finally(() => {
        if (active) setShowcaseSamplesReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleRetryShowcaseSamples = async () => {
    setShowcaseSamplesReady(false);
    setShowcaseSamplesLoadError(null);
    try {
      const samples = await loadShowcaseSamplesFromServer();
      setShowcaseSamples(samples);
    } catch (error) {
      console.warn('Could not reload shared showcase samples:', error);
      setShowcaseSamplesLoadError('تعذر تحميل العينات المحفوظة. حاول مرة أخرى بعد التأكد من اتصال قاعدة البيانات.');
    } finally {
      setShowcaseSamplesReady(true);
    }
  };

  // Restore the server-side session and take authenticated users back to
  // their workspace after a full page reload.
  React.useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((res) => {
        if (!res.ok) throw new Error(`Session check failed: ${res.status}`);
        return res.json() as Promise<SessionResponse>;
      })
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUserEmail(data.user.email);
          setCurrentUserRole(data.user.role);
          setActiveTab(data.user.role === 'admin' ? 'admin' : 'persona_studio');
          try {
            localStorage.setItem('dz_user_email', data.user.email);
          } catch {}
        } else {
          setCurrentUserEmail(null);
          setCurrentUserRole(null);
          setActiveTab('landing');
          try {
            localStorage.removeItem('dz_user_email');
          } catch {}
        }
      })
      .catch((error: unknown) => {
        console.warn('Server session restore failed:', error);
        setCurrentUserEmail(null);
        setCurrentUserRole(null);
        setActiveTab('landing');
        try {
          localStorage.removeItem('dz_user_email');
        } catch {}
      });
  }, []);

  const [campaign, setCampaign] = useState<EmailCampaign>(() =>
    generateDefaultCampaign('SaaS Product Launch with 30% Lifetime Discount')
  );
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);
  const [isGeneratingVisual, setIsGeneratingVisual] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUserLogin = async (email: string) => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      const data = await res.json() as SessionResponse;
      if (res.ok && data.authenticated && data.user && data.user.email.toLowerCase() === email.trim().toLowerCase()) {
        setCurrentUserEmail(data.user.email);
        setCurrentUserRole(data.user.role);
        localStorage.setItem('dz_user_email', data.user.email);
      } else {
        setCurrentUserEmail(null);
        setCurrentUserRole(null);
      }
    } catch (err) {
      console.warn('Server session verification failed:', err);
      setCurrentUserEmail(null);
      setCurrentUserRole(null);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setCurrentUserEmail(null);
    setCurrentUserRole(null);
    try {
      localStorage.removeItem('dz_user_email');
    } catch {}
    if (activeTab === 'admin') {
      setActiveTab('landing');
    }
  };

  const handleQuickAdminLogin = async () => {
    setAdminLoginError('الدخول السريع للمدير غير متاح. أدخل كلمة مرور المدير السرية للتحقق من هويتك.');
  };

  const handleAdminFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminLoginFormEmail.trim()) {
      setAdminLoginError('يرجى إدخال البريد الإلكتروني');
      return;
    }
    if (adminLoginFormEmail.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setAdminLoginError(`عذراً، البريد المدخل غير مصرح له بالإدارة. الوصول محصور حصرياً للمالك: ${ADMIN_EMAIL}`);
      return;
    }

    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminLoginFormEmail.trim(),
          password: adminLoginFormPassword.trim(),
        }),
      });
      const data = await res.json() as AuthResponse;
      if (data.success && data.user) {
        setAdminLoginError(null);
        setCurrentUserEmail(data.user.email);
        setCurrentUserRole('admin');
        try {
          localStorage.setItem('dz_user_email', data.user.email);
        } catch {}
        setActiveTab('admin');
      } else {
        setAdminLoginError(data.message || 'فشل التحقق من هوية المالك.');
      }
    } catch {
      setAdminLoginError('حدث خطأ أثناء الاتصال بالخادم للتحقق من هوية المالك.');
    }
  };

  // Strictly require server-side verified admin role AND verified email
  const isAdmin = currentUserRole === 'admin' && isAdminUser(currentUserEmail);

  const handleGenerateCampaign = async (formData: {
    prompt: string;
    tone: string;
    audience: string;
    goal: string;
    imageSize: '1K' | '2K' | '4K';
    aspectRatio: '16:9' | '1:1' | '4:3' | '3:4' | '9:16';
    visualStyle: string;
  }) => {
    setIsGeneratingCampaign(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: formData.prompt,
          tone: formData.tone,
          audience: formData.audience,
          goal: formData.goal,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned error ${res.status}`);
      }

      const newCampaign: EmailCampaign = await res.json();
      newCampaign.visual.imageSize = formData.imageSize;
      newCampaign.visual.aspectRatio = formData.aspectRatio;
      newCampaign.visual.style = formData.visualStyle;

      setCampaign(newCampaign);

      // Now generate the visual banner with the requested resolution affordance (1K, 2K, 4K)
      generateVisualForCampaign(newCampaign, formData.imageSize, formData.aspectRatio, formData.visualStyle);
    } catch (err: unknown) {
      console.error('Error generating campaign:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to generate campaign. Please verify connection and try again.'
      );
    } finally {
      setIsGeneratingCampaign(false);
    }
  };

  const generateVisualForCampaign = async (
    targetCampaign: EmailCampaign,
    size: '1K' | '2K' | '4K',
    aspectRatio: string,
    style: string
  ) => {
    setIsGeneratingVisual(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: targetCampaign.visual.prompt,
          imageSize: size,
          aspectRatio,
          style,
        }),
      });

      const data = await res.json() as ImageGenerationResponse;
      if (data.imageUrl) {
        setCampaign((prev) => ({
          ...prev,
          visual: {
            ...prev.visual,
            imageUrl: data.imageUrl,
            imageSize: size,
          },
        }));
      }
    } catch (err) {
      console.warn('Visual generation error:', err);
    } finally {
      setIsGeneratingVisual(false);
    }
  };

  const handleRegenerateVisual = async (config: {
    prompt: string;
    imageSize: '1K' | '2K' | '4K';
    aspectRatio: string;
    style: string;
  }) => {
    setIsGeneratingVisual(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: config.prompt,
          imageSize: config.imageSize,
          aspectRatio: config.aspectRatio,
          style: config.style,
        }),
      });

      const data = await res.json() as ImageGenerationResponse;
      if (data.imageUrl) {
        setCampaign((prev) => ({
          ...prev,
          visual: {
            ...prev.visual,
            imageUrl: data.imageUrl,
            imageSize: config.imageSize,
            prompt: config.prompt,
          },
        }));
      }
    } catch (err) {
      console.error('Failed to regenerate visual:', err);
    } finally {
      setIsGeneratingVisual(false);
    }
  };

  const handleUseAlgerianOutroInCampaign = (outroText: string) => {
    setCampaign((prev) => ({
      ...prev,
      body: {
        ...prev.body,
        signoff: `${prev.body.signoff}\n\n🇩🇿 لمسة ختامية جزائرية: "${outroText}"`,
      },
    }));
    setActiveTab('campaign');
  };

  const handleInsertChatIntoCampaign = (text: string) => {
    setCampaign((prev) => ({
      ...prev,
      body: {
        ...prev.body,
        mainStory: `${prev.body.mainStory}\n\n${text}`,
      },
    }));
    setActiveTab('campaign');
  };

  const handleLoadDemo = () => {
    setCampaign(generateDefaultCampaign('AI Creative Suite & Algerian Outro Voiceover'));
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSample={handleLoadDemo}
        currentUserEmail={currentUserEmail}
        isAdmin={isAdmin}
        onSignOut={handleSignOut}
        onQuickAdminLogin={handleQuickAdminLogin}
      />

      {/* When active tab is Landing Page / Public Pricing */}
      {activeTab === 'landing' ? (
        <PublicPricingWithAudioPreview
          onEnterStudio={() => setActiveTab('persona_studio')}
          onLoginSuccess={(email) => {
            handleUserLogin(email);
            if (isAdminUser(email)) {
              setActiveTab('admin');
            } else {
              setActiveTab('persona_studio');
            }
          }}
          showcaseSamples={showcaseSamples}
          onNavigateToAdmin={() => setActiveTab('admin')}
          currentUserEmail={currentUserEmail}
        />
      ) : (
        /* Main Studio Container */
        <>
          <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-red-950/60 border border-red-500/50 flex items-center justify-between gap-3 text-red-200 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-xs underline text-red-300 hover:text-white cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Tab 1: Email Campaign Studio */}
          {activeTab === 'campaign' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form & Generator */}
              <div className="lg:col-span-5 space-y-6">
                <CampaignForm
                  onGenerate={handleGenerateCampaign}
                  isLoading={isGeneratingCampaign}
                />

                {/* Quick Feature Callouts */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    What CampaignForge Generates:
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-2">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span><strong>A/B Subject Lines:</strong> Open rate predictions &amp; psychological angles</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                      <span><strong>1K/2K/4K Visuals:</strong> Powered by Gemini 3 Pro with custom aspect ratios</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span><strong>Complete HTML Copy:</strong> Hero banner, stories, bullets, social proof, CTA</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span><strong>Algerian Audio Outros:</strong> 5 regional dialects with instant WAV generation</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Right Column: Campaign Output & Interactive Preview */}
              <div className="lg:col-span-7">
                <CampaignDisplay
                  campaign={campaign}
                  onUpdateCampaign={setCampaign}
                  onRegenerateVisual={handleRegenerateVisual}
                  isGeneratingVisual={isGeneratingVisual}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Algiers E-Commerce Persona Voice Studio */}
        {activeTab === 'persona_studio' && (
          <PersonaVoiceGenerator
            onUseInCampaign={handleUseAlgerianOutroInCampaign}
            currentUserEmail={currentUserEmail}
            onNavigateToPricing={() => setActiveTab('landing')}
          />
        )}

        {/* Tab 3: Algerian Outro & Voice Studio */}
        {activeTab === 'algerian_outros' && (
          <AlgerianOutroStudio
            onUseInCampaign={handleUseAlgerianOutroInCampaign}
            onNavigateToTab={setActiveTab}
          />
        )}

        {/* Tab 4: Gemini Chatbot */}
        {activeTab === 'chat' && (
          <ChatbotInterface
            onInsertToCampaign={handleInsertChatIntoCampaign}
          />
        )}

        {/* Tab 5: Admin Master Dashboard & Settings Protected by Strict Admin Guard */}
        {activeTab === 'admin' && (
          !showcaseSamplesReady ? (
            <div className="max-w-2xl mx-auto py-16 text-center text-sm text-slate-300" dir="rtl">
              جاري تحميل العينات الصوتية المحفوظة...
            </div>
          ) : showcaseSamplesLoadError ? (
            <div className="max-w-2xl mx-auto py-16 px-4 text-center text-sm text-amber-200" dir="rtl">
              <p>{showcaseSamplesLoadError}</p>
              <button type="button" onClick={handleRetryShowcaseSamples} className="mt-4 rounded-xl bg-indigo-600 px-5 py-2 font-bold text-white hover:bg-indigo-500">
                إعادة تحميل العينات
              </button>
            </div>
          ) : isAdmin ? (
            <AdminMasterDashboard
              onNavigateToLanding={() => setActiveTab('landing')}
              onNavigateToStudio={() => setActiveTab('persona_studio')}
              currentUserEmail={currentUserEmail}
              showcaseSamples={showcaseSamples}
              onUpdateShowcaseSamples={setShowcaseSamples}
            />
          ) : (
            /* Admin Guard Security Gate */
            <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6" dir="rtl">
              <div className="relative overflow-hidden rounded-3xl bg-slate-900/95 border-2 border-amber-500/40 p-6 sm:p-10 shadow-2xl shadow-indigo-950/60 backdrop-blur-xl">
                {/* Ambient Glows */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 text-center space-y-6">
                  {/* Security Lock Badge & Icon */}
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-indigo-600/30 to-amber-400/20 border border-amber-500/40 text-amber-300 shadow-xl shadow-amber-500/10">
                    <Lock className="w-10 h-10 text-amber-400 animate-pulse" />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 mb-3 shadow-sm">
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                      <span>منطقة أمنية مقيدة (Admin Guard Active) 🛡️</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                      لوحة التحكم الإدارية محصورة بالمالك
                    </h2>
                    <p className="text-sm text-slate-300 mt-2.5 max-w-lg mx-auto leading-relaxed">
                      هذه الصفحة وغرفة العمليات الإدارية المركزية مخصصة حصرياً للمالك المصرح له:
                      <br />
                      <span className="font-mono font-bold text-amber-300 text-base underline decoration-amber-400/60 underline-offset-4">
                        {ADMIN_EMAIL}
                      </span>
                    </p>
                  </div>

                  {/* Current User Session Status */}
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs sm:text-sm text-slate-300 flex items-center justify-between gap-3 text-right">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                      <span className="text-slate-400">حالة الجلسة الحالية:</span>
                    </div>
                    <div>
                      {currentUserEmail ? (
                        <span className="font-mono text-amber-300 font-bold">
                          {currentUserEmail} <span className="text-red-400 font-normal">(غير مصرح بالإدارة)</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">زائر (لم يتم تسجيل الدخول)</span>
                      )}
                    </div>
                  </div>

                  {/* Quick 1-Click Owner Access Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleQuickAdminLogin}
                      className="w-full inline-flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl text-sm sm:text-base font-black text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 transition-all cursor-pointer shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Crown className="w-5 h-5 text-slate-950" />
                      <span>دخول سريع كمالك المنصة ({ADMIN_EMAIL}) 👑</span>
                    </button>
                    <p className="text-[11px] text-slate-400 mt-2">
                      مفتاح وصول سريع مباشر للمالك يوسف للتجربة وتيسير الإشراف
                    </p>
                  </div>

                  {/* Owner Login Form */}
                  <div className="pt-4 border-t border-slate-800/80">
                    <form onSubmit={handleAdminFormSubmit} className="space-y-3 text-right">
                      <label className="block text-xs font-bold text-slate-300">
                        أو تسجيل الدخول اليدوي ببريد المالك:
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={adminLoginFormEmail}
                          onChange={(e) => {
                            setAdminLoginFormEmail(e.target.value);
                            setAdminLoginError(null);
                          }}
                          placeholder={ADMIN_EMAIL}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400 font-mono"
                        />
                      </div>
                      <div className="relative">
                        <input
                          type="password"
                          value={adminLoginFormPassword}
                          onChange={(e) => setAdminLoginFormPassword(e.target.value)}
                          placeholder="كلمة المرور الإدارية"
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                      </div>

                      {adminLoginError && (
                        <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                          <span>{adminLoginError}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-600 transition-all cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4 text-amber-400" />
                        <span>تحقق وتأكيد الدخول الإداري</span>
                      </button>
                    </form>
                  </div>

                  {/* Fallback Navigation */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-center gap-4 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setActiveTab('landing')}
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>العودة إلى الصفحة الرئيسية</span>
                    </button>
                    <span className="text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('persona_studio')}
                      className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      استوديو الأصوات العاصمية
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
        </main>

        {/* Global Studio Footer */}
        <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 mt-12 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200">صوت التجارة DZ • Voice Studio</span>
              <span>•</span>
              <span>استوديو الإعلانات الصوتية والشخصيات العاصمية</span>
            </div>
            <div className="flex items-center gap-4 text-slate-500">
              <span>تغطية 58 ولاية</span>
              <span>•</span>
              <span>الدفع عند الاستلام (COD)</span>
              <span>•</span>
              <span>Gemini TTS Audio</span>
            </div>
          </div>
        </footer>
      </>
    )}
  </div>
);
}
