import React from 'react';
import { EBOOK_THEMES } from '../themes/themeConfig';
import type { ThemeId } from '../themes/types';

export type { ThemeId };
export type ThemeOption = (typeof EBOOK_THEMES)[number];

const renderThemePreview = (theme: ThemeOption) => {
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
    case 'construct':
      return (
        <div className="celestial-theme-preview" style={previewStyle}>
          <div className="mini-layout" style={fontBodyStyle}>
            <div className="mini-construct-red">
              <span style={{ ...fontHeaderStyle, fontSize: '0.75rem', letterSpacing: '1px' }}>SHAPES</span>
            </div>
            <div className="mini-construct-photo" />
            <p style={{ ...fontBodyStyle, fontSize: '0.46rem', opacity: 0.9, margin: '4px 0 0', lineHeight: 1.2 }}>Avant-garde geometry & stark industrial contrast.</p>
            <div className="mini-construct-stripe" />
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

interface ThemeSelectorProps {
  selectedTheme: string;
  onChangeTheme: (themeId: ThemeId) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ selectedTheme, onChangeTheme }) => {
  return (
    <div className="celestial-theme-grid">
      {EBOOK_THEMES.map((theme) => {
        const isSelected = selectedTheme === theme.id;
        return (
          <button
            key={theme.id}
            onClick={() => onChangeTheme(theme.id)}
            type="button"
            className={`celestial-theme-card${isSelected ? ' selected' : ''}`}
          >
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

            {renderThemePreview(theme)}
          </button>
        );
      })}
    </div>
  );
};
