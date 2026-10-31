import React, { useState } from 'react';
import {
  EmailCampaign,
  SubjectLineOption,
} from '../types/index';
import {
  calculateEmailMetrics,
  formatEmailHtml,
} from '../utils/campaign';
import {
  Copy,
  Check,
  Download,
  Eye,
  Code,
  Smartphone,
  Monitor,
  Sparkles,
  Layers,
  Image as ImageIcon,
  RefreshCw,
  Clock,
  ShieldCheck,
  TrendingUp,
  FileText,
  AlertTriangle,
} from 'lucide-react';

interface CampaignDisplayProps {
  campaign: EmailCampaign;
  onUpdateCampaign: (campaign: EmailCampaign) => void;
  onRegenerateVisual: (config: { prompt: string; imageSize: '1K' | '2K' | '4K'; aspectRatio: string; style: string }) => Promise<void>;
  isGeneratingVisual: boolean;
}

export const CampaignDisplay: React.FC<CampaignDisplayProps> = ({
  campaign,
  onUpdateCampaign,
  onRegenerateVisual,
  isGeneratingVisual,
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'structured' | 'html' | 'drip'>('preview');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [copiedSubjectIdx, setCopiedSubjectIdx] = useState<number | null>(null);
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [customImagePrompt, setCustomImagePrompt] = useState(campaign.visual.prompt);
  const [selectedSize, setSelectedSize] = useState<'1K' | '2K' | '4K'>(campaign.visual.imageSize || '2K');

  const activeSubject = campaign.subjectLines[campaign.selectedSubjectIndex]?.text || '';
  const fullHtml = formatEmailHtml(campaign);
  const metrics = calculateEmailMetrics(activeSubject, `${campaign.body.headline} ${campaign.body.mainStory}`);

  const handleCopySubject = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedSubjectIdx(idx);
    setTimeout(() => setCopiedSubjectIdx(null), 2000);
  };

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(fullHtml);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const handleDownloadHtml = () => {
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${campaign.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-email.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadImage = () => {
    if (!campaign.visual.imageUrl) return;
    const link = document.createElement('a');
    link.href = campaign.visual.imageUrl;
    link.download = `hero-banner-${selectedSize}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectSubject = (index: number) => {
    onUpdateCampaign({
      ...campaign,
      selectedSubjectIndex: index,
      preheader: campaign.subjectLines[index]?.preheader || campaign.preheader,
    });
  };

  const triggerVisualRegeneration = () => {
    onRegenerateVisual({
      prompt: customImagePrompt || campaign.visual.prompt,
      imageSize: selectedSize,
      aspectRatio: campaign.visual.aspectRatio,
      style: campaign.visual.style,
    });
  };

  return (
    <div className="space-y-6">
      {/* Campaign Top Status Bar & Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Predicted Open Rate</div>
            <div className="text-lg font-bold text-emerald-400">{metrics.predictedOpenRate}%</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Spam Risk Score</div>
            <div className={`text-lg font-bold ${metrics.spamScore < 30 ? 'text-emerald-400' : metrics.spamScore < 60 ? 'text-amber-400' : 'text-red-400'}`}>
              {metrics.spamScore}/100 {metrics.spamScore < 30 ? '(Clean)' : '(Review)'}
            </div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Read Time</div>
            <div className="text-lg font-bold text-slate-200">~{metrics.readingTimeSeconds}s</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-slate-400 uppercase">Word Count</div>
            <div className="text-lg font-bold text-slate-200">{metrics.wordCount} words</div>
          </div>
        </div>
      </div>

      {/* A/B Subject Lines Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              A/B Test Subject Lines &amp; Preheaders
            </h3>
          </div>
          <span className="text-xs text-slate-400">Select active variant for HTML preview</span>
        </div>

        <div className="space-y-2.5">
          {campaign.subjectLines.map((option, idx) => {
            const isSelected = campaign.selectedSubjectIndex === idx;
            return (
              <div
                key={idx}
                onClick={() => handleSelectSubject(idx)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500/70 shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-950'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'}`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Option {idx + 1}: {option.angle}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {option.openRateScore}% Est. Open
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white pl-6">{option.text}</div>
                  <div className="text-xs text-slate-400 pl-6 mt-0.5">
                    <span className="text-slate-500">Preview:</span> {option.preheader}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center pl-6 sm:pl-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopySubject(option.text, idx);
                    }}
                    aria-label={`Copy subject line option ${idx + 1}`}
                    className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs flex items-center gap-1 border border-slate-700 cursor-pointer"
                  >
                    {copiedSubjectIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSubjectIdx === idx ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Banner Studio Card (with 1K, 2K, 4K controls) */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-pink-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Email Hero Visual Studio (Gemini 3 Pro)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-500/20 text-pink-300 border border-pink-500/30">
                {selectedSize} Ultra-HD
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Resolution affordance configured for 1K, 2K, and 4K commercial marketing fidelity.
            </p>
          </div>

          {/* Size affordance tabs */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(['1K', '2K', '4K'] as const).map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedSize === size
                    ? 'bg-pink-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Banner Preview Frame */}
        <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 mb-4 max-h-[380px] flex items-center justify-center">
          {campaign.visual.imageUrl ? (
            <img
              src={campaign.visual.imageUrl}
              alt="Generated Email Hero Visual"
              className="w-full h-auto object-cover max-h-[360px]"
            />
          ) : (
            <div className="p-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 mx-auto mb-3">
                <ImageIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-300">Visual Banner Ready for Generation</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Click Regenerate Visual below to forge this hero asset in {selectedSize} resolution.
              </p>
            </div>
          )}

          {isGeneratingVisual && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
              <p className="text-xs font-bold text-pink-300">Rendering {selectedSize} Visual with Gemini 3 Pro...</p>
            </div>
          )}
        </div>

        {/* Prompt tweaking and regenerate button */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={customImagePrompt}
              onChange={(e) => setCustomImagePrompt(e.target.value)}
              placeholder="Visual banner prompt..."
              className="flex-1 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <button
              onClick={triggerVisualRegeneration}
              disabled={isGeneratingVisual}
              aria-label={`Generate visual in ${selectedSize}`}
              className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-pink-600/30 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingVisual ? 'animate-spin' : ''}`} />
              <span>Generate ({selectedSize})</span>
            </button>
            {campaign.visual.imageUrl && (
              <button
                onClick={handleDownloadImage}
                aria-label="Download generated image"
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                title="Download Visual"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Email Content Viewer Tabs */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* View Mode Toolbar */}
        <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'preview'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>
            <button
              onClick={() => setViewMode('structured')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'structured'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Copy Breakdown</span>
            </button>
            <button
              onClick={() => setViewMode('drip')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'drip'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>3-Step Sequence</span>
            </button>
            <button
              onClick={() => setViewMode('html')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'html'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>HTML Source</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === 'preview' && (
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  aria-label="Desktop preview mode"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${previewDevice === 'desktop' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400'}`}
                  title="Desktop View (600px)"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  aria-label="Mobile preview mode"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${previewDevice === 'mobile' ? 'bg-slate-800 text-indigo-400' : 'text-slate-400'}`}
                  title="Mobile View (375px)"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={handleCopyHtml}
              aria-label="Copy Email HTML"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer"
            >
              {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedHtml ? 'Copied HTML!' : 'Copy HTML'}</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              aria-label="Download complete HTML template"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .HTML</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Live Interactive Email Frame */}
        {viewMode === 'preview' && (
          <div className="p-4 sm:p-8 bg-slate-950 flex justify-center min-h-[600px] overflow-auto">
            <div
              className={`transition-all duration-300 rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-white ${
                previewDevice === 'mobile' ? 'w-[375px] my-4 ring-12 ring-slate-800' : 'w-full max-w-[640px]'
              }`}
            >
              <iframe
                title="Email Campaign Live Render"
                srcDoc={fullHtml}
                className="w-full min-h-[700px] border-0 bg-slate-100"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Structured Copy Breakdown */}
        {viewMode === 'structured' && (
          <div className="p-6 space-y-6 text-slate-200">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">Hero Greeting &amp; Headline</div>
              <h4 className="text-2xl font-extrabold text-white">{campaign.body.headline}</h4>
              <p className="text-sm text-slate-400 mt-1">{campaign.body.subheadline}</p>
            </div>

            {campaign.body.urgencyBanner && (
              <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl flex items-center gap-2 text-red-300 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{campaign.body.urgencyBanner}</span>
              </div>
            )}

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1.5">Core Story Narrative</div>
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-sm leading-relaxed text-slate-300 whitespace-pre-line">
                {campaign.body.mainStory}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">High-Impact Value Bullets</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {campaign.body.bulletPoints.map((b, i) => (
                  <div key={i} className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800">
                    <div className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                      <span className="text-indigo-400">✦</span>
                      <span>{b.title}</span>
                    </div>
                    <div className="text-xs text-slate-400 leading-relaxed">{b.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1.5">Primary Call To Action (CTA)</div>
                <div className="text-base font-bold text-white">{campaign.body.cta.text} &rarr;</div>
                <div className="text-xs text-slate-500 break-all mt-0.5">{campaign.body.cta.url}</div>
                {campaign.body.cta.secondaryText && (
                  <div className="text-xs text-slate-400 mt-2 italic">{campaign.body.cta.secondaryText}</div>
                )}
              </div>

              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1.5">Social Proof / Testimonial</div>
                <blockquote className="text-xs italic text-slate-300">"{campaign.body.socialProof.quote}"</blockquote>
                <div className="text-xs font-bold text-white mt-2">
                  — {campaign.body.socialProof.author} <span className="text-slate-400 font-normal">({campaign.body.socialProof.role})</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: 3-Step Drip Sequence Funnel */}
        {viewMode === 'drip' && (
          <div className="p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h4 className="text-base font-bold text-white">Full Nurture Campaign Drip Sequence</h4>
              <p className="text-xs text-slate-400">
                How this generated email connects to follow-up touchpoints for maximum conversion rate.
              </p>
            </div>

            <div className="space-y-3">
              {campaign.dripSequence.map((step) => (
                <div
                  key={step.step}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-xs font-black text-indigo-300 shrink-0">
                      #{step.step}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{step.title}</span>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-indigo-300">
                          {step.sendDelay}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-300 mt-1">
                        <span className="text-slate-500">Subject:</span> {step.subject}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{step.summary}</div>
                    </div>
                  </div>

                  <div className="self-end md:self-center shrink-0">
                    <span className="text-xs px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                      Goal: {step.keyAction}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: Clean HTML Source Code */}
        {viewMode === 'html' && (
          <div className="p-4 bg-slate-950 font-mono text-xs text-indigo-200 overflow-auto max-h-[600px]">
            <pre className="whitespace-pre-wrap">{fullHtml}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
