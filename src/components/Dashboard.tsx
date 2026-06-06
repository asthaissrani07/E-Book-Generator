import React, { useState } from 'react';
import { ThemeSelector } from './ThemeSelector';
import type { ThemeId } from '../themes/types';
import type { GroqConfig } from '../utils/groqHelper';
import type { EbookSection } from '../utils/pdfParser';
import {
  Sparkles,
  Palette,
  Plus,
  Moon,
  ArrowRight,
  HelpCircle,
  CheckCircle,
  BookOpen,
} from 'lucide-react';
import './landing.css';

interface DashboardProps {
  bookTitle: string;
  onChangeTitle: (title: string) => void;
  sections: EbookSection[];
  groqConfig: GroqConfig;
  selectedTheme: ThemeId;
  onChangeTheme: (themeId: ThemeId) => void;
  onStyleChapters: (style: string) => Promise<void>;
  isStyling: boolean;
  onAddPage: () => void;
  activePageIndex: number;
  onSelectPage: (idx: number) => void;
  onUpdateSection: (index: number, updated: EbookSection) => void;
  onDownloadPDF: () => void;
  isExporting: boolean;
  exportProgress?: { current: number; total: number };
}

export const Dashboard: React.FC<DashboardProps> = ({
  bookTitle,
  onChangeTitle,
  sections,
  groqConfig,
  selectedTheme,
  onChangeTheme,
  onStyleChapters,
  isStyling,
  onAddPage,
  activePageIndex,
  onSelectPage,
  onUpdateSection,
  onDownloadPDF,
  isExporting,
  exportProgress,
}) => {
  const [activeTab, setActiveTab] = useState<'style' | 'outline'>('style');
  const [selectedStyle, setSelectedStyle] = useState('Poetic & Artistic');

  const STYLING_PRESETS = [
    { name: 'Poetic & Artistic', desc: 'Flowery, imagery-rich, descriptive prose.' },
    { name: 'Dramatic Novel', desc: 'Engaging, narrative-driven novel pacing.' },
    { name: 'Vintage Journal', desc: 'Old-world tone resembling a 19th-century explorer.' },
    { name: 'Minimalist Clean', desc: 'Punchy, brief, impactful statements.' },
    { name: 'Academic / Informative', desc: 'Clear, objective, and analytically structured.' },
  ];

  return (
    <div className="celestial-studio w-full lg:w-[420px] flex flex-col h-full overflow-hidden no-print">
      {/* Header */}
      <div className="celestial-studio-header flex items-center justify-between gap-3">
        <div className="hidden lg:block min-w-0">
          <div className="celestial-studio-brand flex items-center gap-2">
            <Moon size={16} strokeWidth={1.5} />
            <span>
              E-Book <em>Studio</em>
            </span>
          </div>
          <p className="celestial-studio-sub">Import, style &amp; publish your stories</p>
        </div>
        <div className="lg:hidden">
          <span className="celestial-studio-brand text-sm">Dashboard</span>
        </div>

        <div className="celestial-studio-status shrink-0">
          <span
            className={`celestial-studio-status-dot${sections.length > 0 ? ' ready' : ''}`}
          />
          <span>{sections.length > 0 ? 'Ready' : 'Empty'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="celestial-studio-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('style')}
          disabled={sections.length === 0}
          className={`celestial-studio-tab${activeTab === 'style' ? ' active' : ''}`}
        >
          <Palette size={13} />
          <span className="hidden sm:inline">Stylist</span>
          <span className="inline sm:hidden">Style</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('outline')}
          disabled={sections.length === 0}
          className={`celestial-studio-tab${activeTab === 'outline' ? ' active' : ''}`}
        >
          <BookOpen size={13} />
          <span>Pages ({sections.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="celestial-studio-content space-y-6">
        {activeTab === 'style' && (
          <div className="space-y-6 animate-fade-in">
            {sections.length > 0 && (
              <div className="celestial-studio-banner">
                <CheckCircle size={15} className="shrink-0" />
                <span className="truncate">
                  Loaded {sections.length} pages — choose your theme below
                </span>
              </div>
            )}

            {sections.length > 0 && (
              <div className="celestial-studio-section">
                <label className="celestial-studio-label">Book Title</label>
                <div className="celestial-studio-panel">
                  <input
                    type="text"
                    value={bookTitle}
                    onChange={(e) => onChangeTitle(e.target.value)}
                    className="celestial-studio-input"
                    placeholder="Your e-book title"
                  />
                </div>
              </div>
            )}

            <div className="celestial-studio-section">
              <label className="celestial-studio-label">
                <Palette size={13} />
                <span>E-Book Design Theme</span>
              </label>
              <ThemeSelector selectedTheme={selectedTheme} onChangeTheme={onChangeTheme} />
            </div>

            {/* AI Prose Styling */}
            <div className="celestial-studio-section">
              <hr className="celestial-studio-divider" />
              <label className="celestial-studio-label">
                <Sparkles size={13} />
                <span>AI Writing Stylist</span>
              </label>

              <div className="celestial-studio-panel space-y-4">
                <div className="space-y-1.5">
                  <span className="celestial-studio-sub block">Target Writing Style</span>
                  <select
                    value={selectedStyle}
                    onChange={(e) => setSelectedStyle(e.target.value)}
                    className="celestial-studio-input text-sm"
                    style={{ fontFamily: 'var(--cel-sans)', fontSize: '0.78rem' }}
                  >
                    {STYLING_PRESETS.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <p
                    className="celestial-studio-sub italic mt-1 leading-normal"
                    style={{ letterSpacing: '0.02em' }}
                  >
                    {STYLING_PRESETS.find((p) => p.name === selectedStyle)?.desc}
                  </p>
                </div>

                {!import.meta.env.VITE_POLLINATIONS_API_KEY && (
                  <div
                    className="p-3 rounded-xl flex items-start gap-2.5 text-[11px]"
                    style={{
                      background: 'rgba(254, 243, 199, 0.55)',
                      border: '1px solid rgba(217, 119, 6, 0.25)',
                      color: '#92400e',
                    }}
                  >
                    <HelpCircle size={15} className="shrink-0 mt-0.5" />
                    <span>
                      AI illustrations require <strong>VITE_POLLINATIONS_API_KEY</strong> in your
                      `.env` file. Without it, pages use stock photo fallbacks.
                    </span>
                  </div>
                )}
                {import.meta.env.VITE_POLLINATIONS_API_KEY && (
                  <div
                    className="p-3 rounded-xl flex items-start gap-2.5 text-[11px]"
                    style={{
                      background: 'rgba(237, 233, 254, 0.55)',
                      border: '1px solid rgba(124, 58, 237, 0.2)',
                      color: '#5b21b6',
                    }}
                  >
                    <HelpCircle size={15} className="shrink-0 mt-0.5" />
                    <span>
                      Pollinations AI images need <strong>Pollen credits</strong> on your account at{' '}
                      <strong>enter.pollinations.ai</strong>. If balance is empty, stock photos are
                      used automatically so every image slot still fills.
                    </span>
                  </div>
                )}

                {!groqConfig.apiKey ? (
                  <div
                    className="p-3 rounded-xl flex items-start gap-2.5 text-[11px]"
                    style={{
                      background: 'rgba(237, 233, 254, 0.55)',
                      border: '1px solid rgba(124, 58, 237, 0.2)',
                      color: '#5b21b6',
                    }}
                  >
                    <HelpCircle size={15} className="shrink-0 mt-0.5" />
                    <span>
                      Set <strong>VITE_GROQ_API_KEY</strong> in your `.env` to activate the AI
                      copywriter.
                    </span>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onStyleChapters(selectedStyle)}
                      disabled={isStyling}
                      className="celestial-studio-btn-dark w-full"
                    >
                      {isStyling ? (
                        <>
                          <Sparkles size={14} className="animate-spin" />
                          <span>Stylizing Book Pages...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} />
                          <span>Apply AI Styling &amp; Image Prompts</span>
                        </>
                      )}
                    </button>
                    <div className="celestial-studio-banner" style={{ fontSize: '0.65rem' }}>
                      <CheckCircle size={13} className="shrink-0" />
                      <span>Local API Key Active (VITE_GROQ_API_KEY detected)</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('outline')}
                className="celestial-studio-btn-dark"
              >
                <span>Next: E-Book Pages</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'outline' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <label className="celestial-studio-label">Book Pages</label>
              <button
                type="button"
                onClick={onAddPage}
                className="celestial-studio-btn-dark"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.62rem' }}
              >
                <Plus size={13} />
                <span>Add Page</span>
              </button>
            </div>

            <p className="celestial-studio-sub leading-relaxed">
              Select a page to view and edit its content. On smaller screens, the preview opens
              automatically.
            </p>

            <div className="space-y-2">
              {sections.map((sec, idx) => {
                const isActive = activePageIndex === idx;
                return (
                  <button
                    key={sec.id}
                    onClick={() => onSelectPage(idx)}
                    type="button"
                    className="celestial-studio-panel w-full text-left flex items-center justify-between transition-all"
                    style={
                      isActive
                        ? {
                            borderColor: 'var(--cel-text)',
                            background: 'rgba(255,255,255,0.78)',
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded shrink-0"
                        style={{
                          background: 'rgba(255,255,255,0.6)',
                          border: '1px solid rgba(28,28,28,0.08)',
                          color: 'var(--cel-muted)',
                        }}
                      >
                        P. {idx + 1}
                      </span>
                      <div className="truncate">
                        <span
                          className="font-semibold text-xs block truncate"
                          style={{ fontFamily: 'var(--cel-serif)' }}
                        >
                          {sec.title || 'Untitled Page'}
                        </span>
                        <span className="celestial-studio-sub truncate block mt-0.5 italic lowercase">
                          layout: {sec.layout}
                        </span>
                      </div>
                    </div>
                    <ArrowRight
                      size={12}
                      style={{
                        color: 'var(--cel-muted)',
                        transform: isActive ? 'translateX(2px)' : undefined,
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {sections[activePageIndex] && (
              <div className="celestial-studio-panel space-y-3">
                <div className="flex items-center justify-between">
                  <span className="celestial-studio-label" style={{ margin: 0 }}>
                    Page {activePageIndex + 1} Content
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectPage(activePageIndex)}
                    className="celestial-studio-sub font-semibold flex items-center gap-1"
                    style={{ color: 'var(--cel-text)', letterSpacing: '0.06em' }}
                  >
                    <span>Open Preview</span>
                    <ArrowRight size={10} />
                  </button>
                </div>
                <div>
                  <span className="celestial-studio-sub block mb-1">Chapter Title</span>
                  <input
                    type="text"
                    value={sections[activePageIndex].title}
                    onChange={(e) =>
                      onUpdateSection(activePageIndex, {
                        ...sections[activePageIndex],
                        title: e.target.value,
                      })
                    }
                    className="celestial-studio-input"
                    style={{ fontSize: '0.82rem' }}
                    placeholder="Chapter title"
                  />
                </div>
                <div>
                  <span className="celestial-studio-sub block mb-1">Chapter Text</span>
                  <textarea
                    value={sections[activePageIndex].content}
                    onChange={(e) =>
                      onUpdateSection(activePageIndex, {
                        ...sections[activePageIndex],
                        content: e.target.value,
                      })
                    }
                    rows={6}
                    className="celestial-studio-input resize-y leading-relaxed"
                    style={{ fontFamily: 'var(--cel-sans)', fontSize: '0.78rem' }}
                    placeholder="Chapter content..."
                  />
                </div>
              </div>
            )}

            <div className="celestial-studio-section">
              <hr className="celestial-studio-divider" />
              <label className="celestial-studio-label">
                <Sparkles size={13} />
                <span>Export E-Book</span>
              </label>

              <div className="celestial-studio-panel space-y-3">
                <p className="celestial-studio-sub leading-normal">
                  Download a high-quality PDF matching your preview — sharp text, theme, images, and layout.
                </p>
                <button
                  type="button"
                  onClick={onDownloadPDF}
                  disabled={isExporting}
                  className="celestial-studio-btn-dark w-full"
                >
                  {isExporting ? (
                    <>
                      <Sparkles size={14} className="animate-spin" />
                      <span>
                        {exportProgress && exportProgress.total > 0
                          ? `Exporting ${exportProgress.current}/${exportProgress.total}...`
                          : 'Exporting E-Book...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Download PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-start pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('style')}
                className="celestial-studio-tab"
                style={{ flex: 'none', padding: '0.5rem 1rem' }}
              >
                <span>Back to Stylist</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="celestial-studio-footer flex items-center justify-between no-print">
        <span className="celestial-studio-footer-brand">E-Book Studio</span>
        <span>Professional PDF Publisher</span>
      </div>
    </div>
  );
};
