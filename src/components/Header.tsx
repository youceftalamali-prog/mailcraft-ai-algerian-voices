import React from 'react';
import { Mail, Mic, MessageSquare, Sparkles, Wand2, ShieldCheck, Settings, Crown, LogIn } from 'lucide-react';
import { isAdminUser, ADMIN_EMAIL } from '../services/adminStore';

export type AppTab = 'landing' | 'persona_studio' | 'admin' | 'algerian_outros' | 'campaign' | 'chat';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onOpenSample?: () => void;
  currentUserEmail?: string | null;
  onSignOut?: () => void;
  onQuickAdminLogin?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSample,
  currentUserEmail,
  onSignOut,
  onQuickAdminLogin,
}) => {
  const isAdmin = isAdminUser(currentUserEmail);

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand */}
        <div
          onClick={() => setActiveTab('landing')}
          className="flex items-center gap-2.5 shrink-0 cursor-pointer group"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-emerald-500 to-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-1 ring-white/20 shrink-0 group-hover:scale-105 transition-transform">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent">
                صوت التجارة DZ
              </span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                صوتي حصراً 🎙️
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden md:block">
              إعلانات صوتية عاصمية • توصيل 58 ولاية • دفع عند الاستلام (COD)
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center p-0.5 sm:p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('landing')}
            aria-label="Landing Page and Pricing tab"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'landing'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>الرئيسية والأسعار</span>
          </button>

          <button
            onClick={() => setActiveTab('persona_studio')}
            aria-label="Algiers E-Commerce Persona Voice Studio tab"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 relative ${
              activeTab === 'persona_studio'
                ? 'bg-gradient-to-r from-indigo-600 to-teal-500 text-white shadow-sm shadow-indigo-600/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <span>استوديو الشخصيات العاصمية</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-amber-400/20 text-amber-300 border border-amber-400/40">
              7 أصوات
            </span>
          </button>

          {/* Admin Navigation Tab: EXCLUSIVELY VISIBLE TO ADMIN (Youceftalamali@gmail.com) */}
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              aria-label="لوحة الإدارة [Admin ⚙️]"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all shrink-0 cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 text-white shadow-lg shadow-purple-600/40 ring-2 ring-emerald-400/50 scale-[1.02]'
                  : 'text-amber-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-300 shadow-sm'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>لوحة الإدارة [Admin ⚙️]</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-400/30 text-amber-200">
                المالك
              </span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('algerian_outros')}
            aria-label="Algerian Outros and Voice Studio tab"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 relative ${
              activeTab === 'algerian_outros'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <span>خواتم الولايات</span>
          </button>

          <button
            onClick={() => setActiveTab('chat')}
            aria-label="Gemini AI Chatbot tab"
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'chat'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>المساعد الصوتي</span>
          </button>
        </nav>

        {/* User state / Quick Action Button */}
        <div className="flex items-center gap-2">
          {/* Direct Admin Quick Action Button: EXCLUSIVELY VISIBLE TO ADMIN */}
          {isAdmin ? (
            <button
              onClick={() => setActiveTab('admin')}
              aria-label="سريع: لوحة الإدارة [Admin ⚙️]"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md ${
                activeTab === 'admin'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/60'
                  : 'bg-gradient-to-r from-amber-500/20 via-indigo-600/30 to-emerald-500/20 text-amber-300 hover:text-white border border-amber-500/40 hover:border-amber-300 hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden xl:inline">لوحة الإدارة</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-amber-400/25 text-amber-200 border border-amber-400/40">
                Admin 👑
              </span>
            </button>
          ) : (
            onQuickAdminLogin && (
              <button
                type="button"
                onClick={onQuickAdminLogin}
                title={`تسجيل دخول المالك (${ADMIN_EMAIL})`}
                className="hidden xl:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-amber-300/80 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all cursor-pointer"
              >
                <Crown className="w-3 h-3 text-amber-400" />
                <span>دخول المالك</span>
              </button>
            )
          )}

          {currentUserEmail ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                {isAdmin && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    <Crown className="w-3 h-3 text-amber-400" />
                    <span>المالك</span>
                  </span>
                )}
                <span className="text-xs text-slate-300 font-mono hidden sm:inline-block">
                  {currentUserEmail}
                </span>
              </div>
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="text-xs text-slate-400 hover:text-red-400 underline cursor-pointer px-1"
                >
                  خروج
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('persona_studio')}
              aria-label="Go to Studio"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
            >
              <span>دخول الاستوديو</span>
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
            </button>
          )}
          <button
            onClick={onOpenSample}
            aria-label="Load Instant Demo Preset"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800/90 text-slate-300 border border-slate-700/80 hover:bg-slate-700/80 hover:text-white transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Load Demo Campaign</span>
          </button>
        </div>
      </div>
    </header>
  );
};
