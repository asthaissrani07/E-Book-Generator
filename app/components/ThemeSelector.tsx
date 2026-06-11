import React from 'react';
import { EBOOK_THEMES } from '@/lib/themes/themeConfig';
import type { ThemeId } from '@/lib/themes/types';
import { PageLayout } from './PageLayout';
import type { EbookSection } from '@/lib/utils/pdfParser';


export type { ThemeId };
export type ThemeOption = (typeof EBOOK_THEMES)[number];

const renderThemePreview = (
  theme: ThemeOption,
  section?: EbookSection,
  bookTitle?: string,
  totalPages?: number,
  pageIndex?: number
) => {
  if (section) {
    return (
      <div className="celestial-theme-preview" style={{ position: 'relative', overflow: 'hidden', padding: 0 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', borderRadius: 'inherit' }}>
          <div
            className={`theme-${theme.id}`}
            style={{
              width: '595px',
              height: '842px',
              transform: 'scale(0.235)',
              transformOrigin: 'top left',
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none'
            }}
          >
            <PageLayout
              section={section}
              pageIndex={pageIndex ?? 1}
              totalPages={totalPages ?? 1}
              bookTitle={bookTitle ?? ''}
              selectedTheme={theme.id as ThemeId}
              onUpdateSection={() => {}}
              onDeleteSection={() => {}}
              onRegenerateImage={async () => {}}
              isGeneratingImage={false}
              isActive={false}
            />
          </div>
        </div>
      </div>
    );
  }

  const previewStyle = {
    backgroundColor: theme.bgColor,
    color: theme.textColor,
    borderColor: theme.accentColor,
    '--theme-accent': theme.accentColor,
    '--theme-bg': theme.bgColor,
  } as React.CSSProperties;

  const fontHeaderStyle = { fontFamily: `${theme.fontHeader}, serif` };
  const fontBodyStyle = { fontFamily: `${theme.fontBody}, sans-serif` };

  switch (theme.id) {
    case 'editorial':
      return (
        <div className="celestial-theme-preview" style={previewStyle}>
          <div className="mini-layout" style={fontBodyStyle}>
            <div className="mini-sticker" />
            <div className="mini-arch" />
            <h4 style={{ ...fontHeaderStyle, fontSize: '0.82rem', fontWeight: 'bold', margin: '0 auto 4px', textAlign: 'center', lineHeight: 1.1 }}>Cosmos</h4>
            <p style={{ ...fontBodyStyle, fontSize: '0.52rem', opacity: 0.85, textAlign: 'center', lineHeight: 1.3, padding: '0 4px' }}>Terracotta margins & organic boho elements.</p>
          </div>
        </div>
      );
    case 'wanderlust':
      return (
        <div className="celestial-theme-preview" style={previewStyle}>
          <div className="mini-layout" style={fontBodyStyle}>
            <div className="mini-wl-grid">
              <div className="mini-wl-photo" />
              <div className="mini-wl-content" style={{ padding: '2px 0' }}>
                <h4 style={{ ...fontHeaderStyle, fontSize: '0.8rem', fontWeight: 'bold', margin: '0 0 4px', lineHeight: 1.1 }}>Explore</h4>
                <p style={{ ...fontBodyStyle, fontSize: '0.5rem', opacity: 0.85, lineHeight: 1.25 }}>Teal headings & custom editorial travel spreads.</p>
              </div>
            </div>
          </div>
        </div>
      );
    case 'softpink':
      return (
        <div className="celestial-theme-preview" style={previewStyle}>
          <div className="mini-layout" style={fontBodyStyle}>
            <div className="mini-sp-island">
              <div className="mini-sp-photo" />
              <h4 style={{ ...fontHeaderStyle, fontSize: '0.8rem', fontWeight: 'bold', margin: '2px 0', lineHeight: 1.1, textAlign: 'center' }}>Dreams</h4>
              <p style={{ ...fontBodyStyle, fontSize: '0.48rem', opacity: 0.85, lineHeight: 1.2, textAlign: 'center' }}>Feminine lifestyle with blush rose accents.</p>
            </div>
          </div>
        </div>
      );
    case 'comic':
      return (
        <div className="celestial-theme-preview" style={previewStyle}>
          <div className="mini-layout" style={fontBodyStyle}>
            <div className="mini-comic-grid">
              <div className="mini-comic-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2px' }}>
                <span style={{ ...fontHeaderStyle, fontSize: '0.55rem', fontWeight: '900', color: '#1a1a1a', transform: 'rotate(-5deg)' }}>POW!</span>
              </div>
              <div className="mini-comic-panel">
                <div className="mini-comic-burst" />
              </div>
              <div className="mini-comic-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4px', gridColumn: 'span 2' }}>
                <h4 style={{ ...fontHeaderStyle, fontSize: '0.75rem', fontWeight: '900', margin: '0 0 2px', color: '#fff', textTransform: 'uppercase', lineHeight: 1 }}>Action!</h4>
                <p style={{ ...fontBodyStyle, fontSize: '0.48rem', opacity: 0.9, color: '#fff', lineHeight: 1.2 }}>Bold action banners & halftone retro grids.</p>
              </div>
            </div>
          </div>
        </div>
      );
    case 'sporty':
      return (
        <div className="celestial-theme-preview" style={previewStyle}>
          <div className="mini-layout" style={fontBodyStyle}>
            <div className="mini-sporty-bar" />
            <div className="mini-sporty-content">
              <div className="mini-sporty-photo" />
              <div style={{ paddingBottom: '4px' }}>
                <h4 style={{ ...fontHeaderStyle, fontSize: '0.8rem', fontWeight: 'bold', margin: '0 0 2px', lineHeight: 1 }}>Athletes</h4>
                <p style={{ ...fontBodyStyle, fontSize: '0.48rem', opacity: 0.85, lineHeight: 1.2 }}>High energy sports editorial alignments.</p>
              </div>
            </div>
          </div>
        </div>
      );
    case 'wellness':
      return (
        <div className="celestial-theme-preview" style={previewStyle}>
          <div className="mini-layout mini-wellness-layout" style={fontBodyStyle}>
            <div className="mini-wellness-banner" style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }}>
              <span style={{ fontSize: '0.42rem', fontWeight: 'bold', opacity: 0.7 }}>EMOCALM</span>
            </div>
            <h4 style={{ ...fontHeaderStyle, fontSize: '0.8rem', fontWeight: 'bold', margin: '2px 0 0', lineHeight: 1.1 }}>Serene</h4>
            <div className="mini-wellness-grid">
              <div className="mini-wellness-leaf" />
              <div style={{ flex: 1 }}>
                <p style={{ ...fontBodyStyle, fontSize: '0.48rem', opacity: 0.85, lineHeight: 1.2 }}>Botanical leaves & emerald wellness guidelines.</p>
              </div>
            </div>
          </div>
        </div>
      );
    case 'newspaper':
      return (
        <div className="celestial-theme-preview" style={previewStyle}>
          <div className="mini-layout" style={fontBodyStyle}>
            <div className="mini-news-header" style={fontHeaderStyle}>THE GAZETTE</div>
            <div className="mini-news-circles">
              <div className="mini-news-circle" />
              <div className="mini-news-circle" style={{ backgroundColor: '#fde68a' }} />
              <div className="mini-news-circle" style={{ backgroundColor: '#fbcfe8' }} />
            </div>
            <div className="mini-news-cols" style={{ padding: '0 2px' }}>
              <div>
                <h5 style={{ ...fontHeaderStyle, fontSize: '0.52rem', fontWeight: 'bold', margin: '0 0 1px' }}>Editorial</h5>
                <p style={{ ...fontBodyStyle, fontSize: '0.4rem', opacity: 0.8, lineHeight: 1.2 }}>Classic double column grid layout styles.</p>
              </div>
              <div>
                <h5 style={{ ...fontHeaderStyle, fontSize: '0.52rem', fontWeight: 'bold', margin: '0 0 1px' }}>Latest</h5>
                <p style={{ ...fontBodyStyle, fontSize: '0.4rem', opacity: 0.8, lineHeight: 1.2 }}>Traditional rule dividers and alignments.</p>
              </div>
            </div>
          </div>
        </div>
      );
    case 'botanical':
      return (
        <div className="celestial-theme-preview" style={previewStyle}>
          <div className="mini-layout" style={fontBodyStyle}>
            <div className="mini-botanical-border" />
            <div className="mini-botanical-content" style={{ padding: '8px' }}>
              <h4 style={{ ...fontHeaderStyle, fontSize: '0.8rem', fontWeight: 'bold', margin: '0 0 4px', lineHeight: 1.1, textAlign: 'center' }}>Foliage</h4>
              <div style={{ height: '52px', backgroundColor: theme.paletteColors[1] || '#a3b19b', opacity: 0.6, borderRadius: '4px', marginBottom: '6px' }} />
              <p style={{ ...fontBodyStyle, fontSize: '0.48rem', opacity: 0.85, lineHeight: 1.25, textAlign: 'center' }}>Double border styling with organic greens.</p>
            </div>
          </div>
        </div>
      );
    case 'modern':
      return (
        <div className="celestial-theme-preview" style={previewStyle}>
          <div className="mini-layout" style={fontBodyStyle}>
            <div className="mini-modern-header" />
            <h4 style={{ ...fontHeaderStyle, fontSize: '0.8rem', fontWeight: 'bold', margin: '0 0 4px', lineHeight: 1.1 }}>Concept</h4>
            <p style={{ ...fontBodyStyle, fontSize: '0.48rem', opacity: 0.85, lineHeight: 1.25, marginBottom: '6px' }}>Clean minimalist canvas & sans-serif body.</p>
            <div className="mini-modern-grid">
              <div className="mini-modern-card" />
              <div className="mini-modern-card" />
            </div>
          </div>
        </div>
      );
    case 'noir':
      return (
        <div className="celestial-theme-preview" style={previewStyle}>
          <div className="mini-layout" style={fontBodyStyle}>
            <div className="mini-noir-border" />
            <div className="mini-noir-dots">
              <div className="mini-noir-dot" />
              <div className="mini-noir-dot" />
            </div>
            <div style={{ padding: '12px 8px 8px', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ ...fontHeaderStyle, fontSize: '0.8rem', fontWeight: 'bold', margin: '0 0 2px', lineHeight: 1.1, color: '#d4af37' }}>Midnight</h4>
                <p style={{ ...fontBodyStyle, fontSize: '0.46rem', opacity: 0.8, lineHeight: 1.2 }}>High contrast noir design with gold borders.</p>
              </div>
              <div style={{ height: '40px', backgroundColor: '#1e202b', border: '0.5px solid #d4af37', opacity: 0.8, borderRadius: '2px' }} />
            </div>
          </div>
        </div>
      );
    case 'bloodred':
      return (
        <div className="celestial-theme-preview" style={previewStyle}>
          <div className="mini-layout" style={fontBodyStyle}>
            <div className="mini-bloodred-header">
              <span className="mini-bloodred-num">01</span>
              <span className="mini-bloodred-label">CH</span>
            </div>
            <h4 style={{ ...fontHeaderStyle, fontSize: '0.75rem', fontWeight: 'bold', margin: '4px 0 2px', lineHeight: 1.1, color: theme.accentColor }}>Scarlet</h4>
            <p style={{ ...fontBodyStyle, fontSize: '0.46rem', opacity: 0.85, lineHeight: 1.2 }}>Crimson headers, large chapter digits, serif spreads.</p>
          </div>
        </div>
      );
    case 'minimalblack':
      return (
        <div className="celestial-theme-preview" style={{ ...previewStyle, backgroundColor: '#000000', color: '#ffffff', borderColor: '#333333' }}>
          <div className="mini-layout" style={{ ...fontBodyStyle, justifyContent: 'space-between', padding: '8px 4px 6px', alignItems: 'center', height: '100%' }}>
            <span style={{ fontSize: '0.4rem', fontWeight: 'bold', letterSpacing: '0.15em', opacity: 0.6 }}>MINIMAL</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
              <h4 style={{ ...fontHeaderStyle, fontSize: '0.72rem', fontWeight: 'bold', margin: 0, textAlign: 'center', color: '#ffffff', lineHeight: 1.1 }}>Book Title</h4>
              <div style={{ width: '12px', height: '1px', backgroundColor: 'rgba(255,255,255,0.4)' }} />
              <span style={{ fontSize: '0.42rem', letterSpacing: '0.1em', opacity: 0.8 }}>AUTHOR</span>
            </div>
            <span style={{ fontSize: '0.4rem', letterSpacing: '0.1em', opacity: 0.4 }}>EDITION</span>
          </div>
        </div>
      );
    case 'rose':
      return (
        <div className="celestial-theme-preview" style={{ ...previewStyle, backgroundColor: '#fef9fa', color: '#2e1018', borderColor: '#f3d2c1' }}>
          <div className="mini-layout" style={{ ...fontBodyStyle, justifyContent: 'space-between', padding: '8px 4px 6px', alignItems: 'center', height: '100%' }}>
            <span style={{ fontSize: '0.42rem', fontWeight: 'bold', color: 'var(--theme-accent)', opacity: 0.8 }}>✿ ROSE ✿</span>
            <h4 style={{ ...fontHeaderStyle, fontSize: '0.8rem', fontWeight: 'bold', margin: '2px 0', textAlign: 'center', lineHeight: 1.1 }}>Feminine</h4>
            <p style={{ ...fontBodyStyle, fontSize: '0.45rem', opacity: 0.85, textAlign: 'center', lineHeight: 1.25 }}>Burgundy accents, script fonts, and floral graphics.</p>
          </div>
        </div>
      );
    case 'lavender':
      return (
        <div className="celestial-theme-preview" style={{ ...previewStyle, backgroundColor: '#f3f0f7', color: '#1f1633', borderColor: '#b39ddb' }}>
          <div className="mini-layout" style={{ ...fontBodyStyle, justifyContent: 'space-between', padding: '8px 4px 6px', alignItems: 'center', height: '100%' }}>
            <span style={{ fontSize: '0.4rem', fontWeight: 'bold', letterSpacing: '0.1em', opacity: 0.6 }}>LAVENDER</span>
            <h4 style={{ ...fontHeaderStyle, fontSize: '0.82rem', fontWeight: 'bold', margin: '2px 0', textAlign: 'center', color: 'var(--theme-accent)', lineHeight: 1.1 }}>Serene</h4>
            <p style={{ ...fontBodyStyle, fontSize: '0.45rem', opacity: 0.85, textAlign: 'center', lineHeight: 1.25 }}>Elegant serif headings, diagrams, and soft purple spreads.</p>
          </div>
        </div>
      );
    case 'bolddark':
      return (
        <div className="celestial-theme-preview" style={{ ...previewStyle, backgroundColor: '#000000', color: '#ffffff', borderColor: '#262626' }}>
          <div className="mini-layout" style={{ ...fontBodyStyle, justifyContent: 'space-between', padding: '8px 4px 6px', alignItems: 'center', height: '100%' }}>
            <span style={{ fontSize: '0.42rem', fontWeight: 'bold', letterSpacing: '0.15em' }}>GRID</span>
            <h4 style={{ ...fontHeaderStyle, fontSize: '0.82rem', fontWeight: 'bold', margin: '2px 0', textAlign: 'center', color: '#ffffff', lineHeight: 1.1 }}>Bold Dark</h4>
            <p style={{ ...fontBodyStyle, fontSize: '0.45rem', opacity: 0.8, textAlign: 'center', lineHeight: 1.25 }}>Pure black theme, sans-serif titles, and pricing tables.</p>
          </div>
        </div>
      );

    default:
      return (
        <div className="celestial-theme-preview" style={previewStyle}>
          <div className="mini-layout" style={fontBodyStyle}>
            <h4 style={{ ...fontHeaderStyle, fontSize: '0.8rem', fontWeight: 'bold', margin: '0 0 4px' }}>E-Book</h4>
            <p style={{ ...fontBodyStyle, fontSize: '0.48rem', opacity: 0.85, lineHeight: 1.2 }}>Standard layout style and typography preview.</p>
          </div>
        </div>
      );
}
};

const HEADING_FONTS = [
  { name: 'Theme Default', value: '' },
  { name: 'Playfair Display (Serif)', value: 'Playfair Display' },
  { name: 'Lora (Serif)', value: 'Lora' },
  { name: 'Cinzel (Serif)', value: 'Cinzel' },
  { name: 'Cormorant Garamond (Serif)', value: 'Cormorant Garamond' },
  { name: 'EB Garamond (Serif)', value: 'EB Garamond' },
  { name: 'Montserrat (Sans-Serif)', value: 'Montserrat' },
  { name: 'Outfit (Sans-Serif)', value: 'Outfit' },
  { name: 'Poppins (Sans-Serif)', value: 'Poppins' },
  { name: 'Pacifico (Cursive)', value: 'Pacifico' },
  { name: 'Dancing Script (Cursive)', value: 'Dancing Script' },
  { name: 'Sacramento (Cursive)', value: 'Sacramento' },
];

const BODY_FONTS = [
  { name: 'Theme Default', value: '' },
  { name: 'Lora (Serif)', value: 'Lora' },
  { name: 'Merriweather (Serif)', value: 'Merriweather' },
  { name: 'EB Garamond (Serif)', value: 'EB Garamond' },
  { name: 'Cormorant Garamond (Serif)', value: 'Cormorant Garamond' },
  { name: 'Inter (Sans-Serif)', value: 'Inter' },
  { name: 'Roboto (Sans-Serif)', value: 'Roboto' },
  { name: 'Poppins (Sans-Serif)', value: 'Poppins' },
  { name: 'Outfit (Sans-Serif)', value: 'Outfit' },
];

const COLOR_PRESETS = [
  { name: 'Vintage Beige', bg: '#faf6f0', text: '#3d2314', accent: '#c96f4a' },
  { name: 'Botanical Green', bg: '#edf0ea', text: '#1e291e', accent: '#556b2f' },
  { name: 'Clean Indigo', bg: '#ffffff', text: '#0f172a', accent: '#2563eb' },
  { name: 'Midnight Noir', bg: '#0d0e12', text: '#e2e8f0', accent: '#d4af37' },
  { name: 'Soft Rose', bg: '#fff5f5', text: '#2d1515', accent: '#e05a5a' },
];

interface ThemeSelectorProps {
  selectedTheme: string;
  onChangeTheme: (themeId: ThemeId) => void;
  sections?: EbookSection[];
  activePageIndex?: number;
  bookTitle?: string;

  // Customizer props
  customBgColor: string;
  onChangeBgColor: (color: string) => void;
  customTextColor: string;
  onChangeTextColor: (color: string) => void;
  customAccentColor: string;
  onChangeAccentColor: (color: string) => void;
  customFontHeader: string;
  onChangeFontHeader: (font: string) => void;
  customFontBody: string;
  onChangeFontBody: (font: string) => void;
  customFontSizeMult: number;
  onChangeFontSizeMult: (mult: number) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  selectedTheme,
  onChangeTheme,
  sections,
  activePageIndex = 0,
  bookTitle = '',
  customBgColor,
  onChangeBgColor,
  customTextColor,
  onChangeTextColor,
  customAccentColor,
  onChangeAccentColor,
  customFontHeader,
  onChangeFontHeader,
  customFontBody,
  onChangeFontBody,
  customFontSizeMult,
  onChangeFontSizeMult,
}) => {
  // Show the fourth page of the PDF (index 3) in the theme preview if available,
  // otherwise fallback to the last page (respecting activePageIndex if within range).
  const previewIndex = sections && sections.length >= 4
    ? 3
    : (sections && sections.length > 0 ? Math.min(activePageIndex, sections.length - 1) : 0);
  const currentSection = sections && sections[previewIndex];
  const totalPages = sections ? sections.length : 1;
  const pageIndex = previewIndex + 1;

  return (
    <div className="celestial-theme-grid">
      {EBOOK_THEMES.map((theme) => {
        const isSelected = selectedTheme === theme.id;
        return (
          <div
            key={theme.id}
            onClick={() => {
              if (!isSelected) onChangeTheme(theme.id);
            }}
            className={`celestial-theme-card flex-col !h-auto${isSelected ? ' selected' : ''}`}
            style={{ cursor: isSelected ? 'default' : 'pointer' }}
          >
            {/* Top clickable row / header info */}
            <div className="flex w-full items-stretch justify-between gap-3 min-h-[160px]">
              <div className="flex-1 flex flex-col justify-between min-w-0 pr-1">
                <div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="celestial-theme-card-name truncate">{theme.name}</span>
                    {isSelected && <span className="celestial-theme-card-badge flex-shrink-0">Active</span>}
                  </div>
                  <p className="celestial-theme-card-desc">{theme.description}</p>
                </div>

                <div>
                  <div className="celestial-theme-swatches">
                    {theme.paletteColors.map((color, idx) => (
                      <div
                        key={idx}
                        className="celestial-theme-swatch"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="celestial-theme-fonts">
                    <span className="truncate">{theme.fontHeader}</span>
                    <span style={{ opacity: 0.35 }}>|</span>
                    <span className="truncate">{theme.fontBody}</span>
                  </div>
                </div>
              </div>

              {renderThemePreview(theme, currentSection, bookTitle, totalPages, pageIndex)}
            </div>

            {/* Customizer controls rendered if selected */}
            {isSelected && (
              <div
                className="w-full mt-4 pt-4 border-t border-slate-200/50 space-y-4 animate-fade-in"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Colors overrides */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">Color Palette Overrides</span>
                  
                  {/* Swatches */}
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {COLOR_PRESETS.map((preset) => {
                      const isPresetActive = customBgColor === preset.bg && customTextColor === preset.text && customAccentColor === preset.accent;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            onChangeBgColor(preset.bg);
                            onChangeTextColor(preset.text);
                            onChangeAccentColor(preset.accent);
                          }}
                          title={preset.name}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border flex items-center gap-1 transition-all ${
                            isPresetActive
                              ? 'border-slate-800 bg-slate-900 text-white shadow-sm'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block" style={{ backgroundColor: preset.bg }} />
                          <span>{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Color Inputs */}
                  <div className="grid grid-cols-1 gap-3">
                    {/* Background Color */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-500">Background Color</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customBgColor || theme.bgColor}
                          onChange={(e) => onChangeBgColor(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 shrink-0"
                          style={{ padding: 0, outline: 'none' }}
                        />
                        <input
                          type="text"
                          value={customBgColor}
                          onChange={(e) => onChangeBgColor(e.target.value)}
                          placeholder={`Default: ${theme.bgColor}`}
                          className="celestial-studio-input flex-1 py-1 px-2 text-xs"
                          style={{ fontFamily: 'var(--cel-sans)', height: '2rem' }}
                        />
                      </div>
                    </div>

                    {/* Text Color */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-500">Text Color</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customTextColor || theme.textColor}
                          onChange={(e) => onChangeTextColor(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 shrink-0"
                          style={{ padding: 0, outline: 'none' }}
                        />
                        <input
                          type="text"
                          value={customTextColor}
                          onChange={(e) => onChangeTextColor(e.target.value)}
                          placeholder={`Default: ${theme.textColor}`}
                          className="celestial-studio-input flex-1 py-1 px-2 text-xs"
                          style={{ fontFamily: 'var(--cel-sans)', height: '2rem' }}
                        />
                      </div>
                    </div>

                    {/* Accent Color */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-500">Accent / Meta Color</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={customAccentColor || theme.accentColor}
                          onChange={(e) => onChangeAccentColor(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 shrink-0"
                          style={{ padding: 0, outline: 'none' }}
                        />
                        <input
                          type="text"
                          value={customAccentColor}
                          onChange={(e) => onChangeAccentColor(e.target.value)}
                          placeholder={`Default: ${theme.accentColor}`}
                          className="celestial-studio-input flex-1 py-1 px-2 text-xs"
                          style={{ fontFamily: 'var(--cel-sans)', height: '2rem' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-t border-slate-100" style={{ margin: '0.75rem 0' }} />

                {/* Typography overrides */}
                <div className="space-y-3">
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block">Typography Overrides</span>
                  
                  {/* Size scaling */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-500">Font Size Multiplier</span>
                    <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200/50">
                      {[
                        { label: 'Small', val: 0.85 },
                        { label: 'Normal', val: 1.0 },
                        { label: 'Large', val: 1.2 },
                        { label: 'XL', val: 1.4 },
                      ].map((size) => (
                        <button
                          key={size.label}
                          type="button"
                          onClick={() => onChangeFontSizeMult(size.val)}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                            customFontSizeMult === size.val
                              ? 'bg-slate-900 text-white shadow'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {size.label} ({size.val}x)
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Header Font style */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-500">Heading Font Style</span>
                    <select
                      value={customFontHeader}
                      onChange={(e) => onChangeFontHeader(e.target.value)}
                      className="celestial-studio-input text-xs"
                      style={{ fontFamily: 'var(--cel-sans)', fontSize: '0.78rem' }}
                    >
                      {HEADING_FONTS.map(f => (
                        <option key={f.value} value={f.value}>{f.value === '' ? `Default (${theme.fontHeader})` : f.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Body Font style */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-500">Body Font Style</span>
                    <select
                      value={customFontBody}
                      onChange={(e) => onChangeFontBody(e.target.value)}
                      className="celestial-studio-input text-xs"
                      style={{ fontFamily: 'var(--cel-sans)', fontSize: '0.78rem' }}
                    >
                      {BODY_FONTS.map(f => (
                        <option key={f.value} value={f.value}>{f.value === '' ? `Default (${theme.fontBody})` : f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reset Button */}
                {(customBgColor || customTextColor || customAccentColor || customFontHeader || customFontBody || customFontSizeMult !== 1.0) && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onChangeBgColor('');
                        onChangeTextColor('');
                        onChangeAccentColor('');
                        onChangeFontHeader('');
                        onChangeFontBody('');
                        onChangeFontSizeMult(1.0);
                      }}
                      className="w-full text-center py-2 text-[10px] font-semibold tracking-wider uppercase text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-200/50"
                    >
                      Reset Style Overrides
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
