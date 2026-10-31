import React, { useState } from 'react';
import { Wand2, Image, Layers, Sparkles, Target, Volume2, ArrowRight } from 'lucide-react';

interface CampaignFormProps {
  onGenerate: (data: {
    prompt: string;
    tone: string;
    audience: string;
    goal: string;
    imageSize: '1K' | '2K' | '4K';
    aspectRatio: '16:9' | '1:1' | '4:3' | '3:4' | '9:16';
    visualStyle: string;
  }) => Promise<void>;
  isLoading: boolean;
}

const PRESET_PROMPTS = [
  {
    label: '🚀 SaaS Flagship Launch',
    prompt: 'Launch an AI productivity tool with 30% discount for early adopters, highlighting automation of tedious marketing workflows.',
    audience: 'Growth marketers, founders, and creative directors',
    tone: 'Confident, inspiring, and conversion-focused',
    goal: 'Drive high-converting early signups before price increases',
    style: 'Cinematic 3D Modern',
  },
  {
    label: '🛍️ Algerian Ramadan / Eid E-Commerce',
    prompt: 'تخفيضات كبرى بمناسبة حلول الشهر الفضيل على الملابس التقليدية والعصرية، توصيل سريع لـ 58 ولاية مع الدفع عند الاستلام.',
    audience: 'العائلات الجزائرية، المتسوقين عبر الإنترنت، ومحبي الأزياء الراقية',
    tone: 'دافئ، احتفالي، ومحفز على الشراء الفوري',
    goal: 'زيادة المبيعات المباشرة ومضاعفة الطلبات',
    style: 'Studio Product Photography',
  },
  {
    label: '⚡ Black Friday Tech Flash Sale',
    prompt: 'Flash sale on noise-cancelling wireless headphones with 45% off for next 48 hours only, emphasizing crystal sound and battery life.',
    audience: 'Tech enthusiasts, remote workers, audiophiles',
    tone: 'Urgent, punchy, and irresistible FOMO',
    goal: 'Clear inventory and trigger rapid impulse checkouts',
    style: 'Cyberpunk Neon Studio',
  },
  {
    label: '💌 Creator VIP Newsletter',
    prompt: 'Weekly masterclass email sharing 3 counter-intuitive copywriting lessons that tripled our client revenue, with invitation to private community.',
    audience: 'Content creators, indie makers, copywriters',
    tone: 'Intimate, transparent, deeply insightful',
    goal: 'Build authority and invite readers to join the Discord circle',
    style: 'Minimalist Swiss Tech',
  },
];

export const CampaignForm: React.FC<CampaignFormProps> = ({ onGenerate, isLoading }) => {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('Persuasive, authoritative, inspiring');
  const [audience, setAudience] = useState('Growth marketers, founders, and decision makers');
  const [goal, setGoal] = useState('Drive immediate conversion and early signups');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('2K');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '1:1' | '4:3' | '3:4' | '9:16'>('16:9');
  const [visualStyle, setVisualStyle] = useState('Cinematic 3D Modern');
  const [showAdvancedVisuals, setShowAdvancedVisuals] = useState(false);

  const applyPreset = (preset: typeof PRESET_PROMPTS[0]) => {
    setPrompt(preset.prompt);
    setAudience(preset.audience);
    setTone(preset.tone);
    setGoal(preset.goal);
    setVisualStyle(preset.style);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onGenerate({
      prompt: prompt.trim(),
      tone,
      audience,
      goal,
      imageSize,
      aspectRatio,
      visualStyle,
    });
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-400" />
            <span>Generate Email Campaign</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Craft high-converting subject lines, HTML body copy, and 1K/2K/4K visuals in seconds.
          </p>
        </div>
      </div>

      {/* Preset Chips */}
      <div className="mb-5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Inspiration Presets</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-indigo-950/60 hover:text-indigo-200 text-slate-300 border border-slate-700/70 hover:border-indigo-500/50 transition-all text-left cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Prompt */}
        <div>
          <label htmlFor="campaign-prompt" className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
            What are you promoting or emailing about? <span className="text-pink-400">*</span>
          </label>
          <textarea
            id="campaign-prompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Announce our new AI email marketing platform with a 30% lifetime discount for the first 200 users, highlighting automated subject lines and hero graphics..."
            required
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-y min-h-[90px]"
          />
        </div>

        {/* Audience and Goal (2 columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="campaign-audience" className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Audience</span>
            </label>
            <input
              id="campaign-audience"
              type="text"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Founders, marketers, e-commerce shoppers"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="campaign-tone" className="block text-xs font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Volume2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Tone of Voice</span>
            </label>
            <select
              id="campaign-tone"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="Persuasive, authoritative, inspiring">Persuasive & High Energy</option>
              <option value="Friendly, empathetic, conversational">Friendly & Conversational</option>
              <option value="Urgent, bold, irresistible FOMO">Urgent FOMO & Scarcity</option>
              <option value="Luxury, minimalist, exclusive">Luxury & Minimalist</option>
              <option value="Professional, data-driven B2B">Professional & Analytical B2B</option>
              <option value="دارجة جزائرية عصرية وتسويقية جذابة">دارجة جزائرية تسويقية (Algerian Marketing)</option>
            </select>
          </div>
        </div>

        {/* Visual Settings Accordion / Affordance */}
        <div className="border border-slate-800 rounded-xl p-3.5 bg-slate-950/40">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowAdvancedVisuals(!showAdvancedVisuals)}>
            <div className="flex items-center gap-2">
              <Image className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-bold text-slate-200">Email Hero Visual Engine</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {imageSize} • {aspectRatio}
              </span>
            </div>
            <button
              type="button"
              aria-label="Toggle visual settings"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              {showAdvancedVisuals ? 'Hide Details' : 'Configure 1K/2K/4K'}
            </button>
          </div>

          {showAdvancedVisuals && (
            <div className="mt-3 pt-3 border-t border-slate-800 space-y-3">
              {/* Image Size (1K, 2K, 4K) - Feature Requirement */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>Image Resolution Size (Gemini 3 Pro)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Supports 1K, 2K, 4K resolution</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['1K', '2K', '4K'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setImageSize(size)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                        imageSize === size
                          ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-600/30'
                          : 'bg-slate-900 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {size} Ultra-HD
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio and Style */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="aspect-ratio-select" className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Banner Aspect Ratio
                  </label>
                  <select
                    id="aspect-ratio-select"
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="16:9">16:9 (Email Header Banner - Recommended)</option>
                    <option value="1:1">1:1 (Square Product Hero)</option>
                    <option value="4:3">4:3 (Classic Editorial Box)</option>
                    <option value="3:4">3:4 (Portrait Card)</option>
                    <option value="9:16">9:16 (Vertical Mobile Story)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="visual-style-select" className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Visual Art Style
                  </label>
                  <select
                    id="visual-style-select"
                    value={visualStyle}
                    onChange={(e) => setVisualStyle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  >
                    <option value="Cinematic 3D Modern">Cinematic 3D Modern</option>
                    <option value="Studio Product Photography">Studio Product Photography</option>
                    <option value="Minimalist Swiss Tech">Minimalist Swiss Tech</option>
                    <option value="Cyberpunk Neon Studio">Cyberpunk Neon Studio</option>
                    <option value="Luxury Matte Black & Gold">Luxury Matte Black & Gold</option>
                    <option value="Warm Algerian Cultural Modern">Warm Algerian Cultural Modern</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          aria-label="Generate complete email campaign"
          className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-pink-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-pink-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Forging Campaign with Gemini AI...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate Complete Campaign & Visuals</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
