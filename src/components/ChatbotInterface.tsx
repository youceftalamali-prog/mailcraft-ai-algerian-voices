import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/index';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ChatbotInterfaceProps {
  onInsertToCampaign?: (text: string) => void;
}

export const ChatbotInterface: React.FC<ChatbotInterfaceProps> = ({ onInsertToCampaign }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      role: 'model',
      content: `Hello! I am your AI Marketing & Algerian Voice Copilot. 

How can I help you today?
• 📧 Craft conversion-optimized subject lines & email copy
• 🎙️ Suggest authentic Algerian outros & voiceover scripts (بالدارجة الجزائرية)
• 🎨 Design 1K/2K/4K visual prompts for your email hero banners
• ⚡ Audit your campaign for spam risks and deliverability`,
      timestamp: Date.now(),
      model: 'gemini-3.8-flash',
      roleType: 'email_marketer',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<'gemini-3.8-flash' | 'gemini-4-argon' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const [roleType, setRoleType] = useState<'email_marketer' | 'algerian_voice_coach' | 'creative_director'>('email_marketer');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      model,
      roleType,
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setIsLoading(true);

    try {
      // Send conversation history to preserve multi-turn state
      const apiMessages = newHistory.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model,
          roleType,
        }),
      });

      const data = await res.json();
      const reply = data.reply || 'I could not generate a response. Please try again.';

      setMessages((prev) => [
        ...prev,
        {
          id: 'model-' + Date.now(),
          role: 'model',
          content: reply,
          timestamp: Date.now(),
          model,
          roleType,
        },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'err-' + Date.now(),
          role: 'model',
          content: 'An error occurred while connecting to Gemini. Please try again.',
          timestamp: Date.now(),
          model,
          roleType,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'reset-msg',
        role: 'model',
        content: 'Conversation history reset. How can I assist you with your marketing campaign or Algerian voiceover today?',
        timestamp: Date.now(),
        model,
        roleType,
      },
    ]);
  };

  const QUICK_PROMPTS = [
    {
      label: '🇩🇿 أعطني خاتمة جزائرية لفيديو تيك توك وريلز حماسي',
      role: 'algerian_voice_coach' as const,
      text: 'أعطني 3 خواتم جزائرية بالدارجة الوهرانية والعاصمية لفيديوهات ريلز وتيك توك مع Call to Action قوي للمتابعة واللايك.',
    },
    {
      label: '🔥 5 FOMO Subject Lines with Emojis',
      role: 'email_marketer' as const,
      text: 'Write 5 urgent, high-converting subject lines for an e-commerce flash sale ending in 6 hours with estimated open rates.',
    },
    {
      label: '🎨 4K Hero Banner Prompt Generator',
      role: 'creative_director' as const,
      text: 'Write a hyper-detailed 4K image prompt for an ultra-sleek email hero banner promoting a luxury smart watch launch.',
    },
    {
      label: '🛡️ Email Spam Trigger Check',
      role: 'email_marketer' as const,
      text: 'What are the top 7 spam trigger words modern email providers (Gmail, Outlook) penalize in 2026, and what should I replace them with?',
    },
  ];

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl shadow-2xl flex flex-col h-[calc(100vh-140px)] min-h-[550px] max-h-[760px] overflow-hidden">
      {/* Chat Top Controls Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Gemini Multi-Turn Chatbot</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {model}
              </span>
            </div>
            <p className="text-xs text-slate-400">Role-aware assistant with contextual conversation history</p>
          </div>
        </div>

        {/* Model & Role Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Model Selector (Flash, Argon, Flash-Lite) */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <select
              aria-label="Select Gemini model"
              value={model}
              onChange={(e) => setModel(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="gemini-3.8-flash" className="bg-slate-900 text-slate-100">
                gemini-3.8-flash (General Tasks - Default)
              </option>
              <option value="gemini-4-argon" className="bg-slate-900 text-slate-100">
                gemini-4-argon (Complex Tasks &amp; Strategy)
              </option>
              <option value="gemini-3.1-flash-lite" className="bg-slate-900 text-slate-100">
                gemini-3.1-flash-lite (Fast Tasks)
              </option>
            </select>
          </div>

          {/* Role Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1">
            <Layers className="w-3.5 h-3.5 text-pink-400" />
            <select
              aria-label="Select AI role persona"
              value={roleType}
              onChange={(e) => setRoleType(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="email_marketer" className="bg-slate-900 text-slate-100">
                📧 Email Copywriter &amp; Strategist
              </option>
              <option value="algerian_voice_coach" className="bg-slate-900 text-slate-100">
                🎙️ مستشار صناعة المحتوى والصوتيات الجزائرية
              </option>
              <option value="creative_director" className="bg-slate-900 text-slate-100">
                🎨 Creative Director (Visual Prompts)
              </option>
            </select>
          </div>

          <button
            onClick={handleClearHistory}
            aria-label="Clear chat conversation"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 border border-slate-700 transition-all cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Message Thread */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-950/40"
      >
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                  isUser
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gradient-to-tr from-purple-600 to-pink-600 text-white'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line relative group ${
                  isUser
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                }`}
              >
                <div>{m.content}</div>

                <div
                  className={`mt-2 pt-2 flex items-center justify-between text-[10px] ${
                    isUser ? 'border-t border-indigo-500/50 text-indigo-200' : 'border-t border-slate-800 text-slate-500'
                  }`}
                >
                  <span>
                    {isUser ? 'You' : `Gemini (${m.model || model})`} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {!isUser && (
                    <button
                      onClick={() => handleCopyMessage(m.content, m.id)}
                      aria-label="Copy assistant reply"
                      className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <Bot className="w-4 h-4 animate-pulse" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-400 ml-1">Gemini ({model}) is crafting response...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Suggestion Chips */}
      <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2 overflow-x-auto">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="text-[11px] font-semibold text-slate-500 uppercase shrink-0">Prompts:</span>
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setRoleType(qp.role);
              handleSend(qp.text);
            }}
            className="text-xs whitespace-nowrap px-3 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer shrink-0"
          >
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-slate-800 bg-slate-950">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${roleType === 'algerian_voice_coach' ? 'عن الخواتم الجزائرية أو لهجات الفيديو...' : 'about copy, subject lines, 4K visual prompts...'}`}
            disabled={isLoading}
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send message to Gemini chatbot"
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
