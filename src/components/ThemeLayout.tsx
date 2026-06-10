import React from 'react';
import type { EbookSection } from '../utils/pdfParser';
import type { ThemeId } from '../themes/types';
import type { EditorialImageSet } from '../utils/imageHelper';
import { ResolvedImage } from './ResolvedImage';
import { WarmStickers } from './WarmStickers';

interface ThemeLayoutProps {
  themeId: ThemeId;
  section: EbookSection;
  pageIndex: number;
  bookTitle: string;
  imageSlots: EditorialImageSet;
  imageVersion: number;
  isActive: boolean;
  shouldShowImage: boolean;
  shouldShowChapterHeading: boolean;
  chapterHeadingText: string;
  onTextChange: (field: 'title' | 'content', val: string) => void;
  pdfExportMode?: boolean;
}

function splitContent(content: string) {
  if (!content) return { lead: '', body: '' };

  const normalized = content
    .replace(/<br\s*\/?>\s*<br\s*\/?>/gi, '<!--split-->')
    .replace(/<\/div>\s*<div>/gi, '<!--split-->')
    .replace(/<\/p>\s*<p>/gi, '<!--split-->')
    .replace(/\n\n+/g, '<!--split-->');

  const paragraphs = normalized.split('<!--split-->').filter((p) => p.trim());

  return {
    lead: paragraphs[0] || content,
    body: paragraphs.length > 1 ? paragraphs.slice(1).join('<br><br>') : '',
  };
}

const Img: React.FC<{
  slot: { prompt: string; seed: number };
  alt: string;
  className: string;
  imageVersion: number;
  isActive: boolean;
  pdfExportMode?: boolean;
  id?: string;
}> = ({ slot, alt, className, imageVersion, isActive, pdfExportMode, id }) => (
  <ResolvedImage
    key={`${id || alt}-${imageVersion}-${slot.seed}`}
    prompt={slot.prompt}
    seed={slot.seed}
    alt={alt}
    className={className}
    eager={isActive || pdfExportMode}
    exportMode={pdfExportMode}
  />
);

/* ── COVER PAGES ─────────────────────────────────────────── */

export const ThemeCover: React.FC<{
  themeId: ThemeId;
  section: EbookSection;
  imgSrc: string;
  imgLoading: boolean;
  isGeneratingImage: boolean;
  onTitleChange: (val: string) => void;
  onImgLoad: () => void;
  onImgError: () => void;
  shouldShowImage: boolean;
  imageSlots: EditorialImageSet;
  imageVersion: number;
  isActive: boolean;
  pdfExportMode?: boolean;
}> = ({
  themeId,
  section,
  imgSrc,
  imgLoading,
  isGeneratingImage,
  onTitleChange,
  onImgLoad,
  onImgError,
  shouldShowImage,
  imageSlots,
  imageVersion,
  isActive,
  pdfExportMode,
}) => {
  const title = section.title;

  if (themeId === 'comic') {
    return (
      <div className="layout-comic-cover">
        <div className="comic-cover-burst" aria-hidden />
        {shouldShowImage && (
          <div className="comic-cover-art-block">
            {(imgLoading || isGeneratingImage) && <div className="comic-img-loading" />}
            <Img
              slot={imageSlots.primary}
              alt="Comic cover"
              className="comic-cover-art"
              imageVersion={imageVersion}
              isActive={isActive}
              pdfExportMode={pdfExportMode}
            />
          </div>
        )}
        <h1
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onTitleChange(e.currentTarget.innerText)}
          className="comic-cover-title"
        >
          {title}
        </h1>
        <p className="comic-cover-kicker">E-BOOK EDITION</p>
        <div className="comic-cover-stripe" />
      </div>
    );
  }

  if (themeId === 'wanderlust') {
    return (
      <div className="layout-wanderlust-cover">
        <h1
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onTitleChange(e.currentTarget.innerText)}
          className="wl-cover-title"
        >
          {title}
        </h1>
        <p className="wl-cover-sub">A Journey Through Travel</p>
        {shouldShowImage && (
          <div className="wl-cover-photo">
            <Img slot={imageSlots.primary} alt="Travel cover" className="wl-cover-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
          </div>
        )}
      </div>
    );
  }

  if (themeId === 'softpink') {
    return (
      <div className="layout-softpink-cover">
        <div className="sp-cover-box">
          {shouldShowImage && (
            <div className="sp-cover-photo">
              <Img slot={imageSlots.primary} alt="Pink cover" className="sp-cover-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
            </div>
          )}
          <h1
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTitleChange(e.currentTarget.innerText)}
            className="sp-cover-title"
          >
            {title}
          </h1>
          <p className="sp-cover-tag">Your Only Limit Is Your Mind</p>
        </div>
      </div>
    );
  }

  if (themeId === 'sporty') {
    return (
      <div className="layout-sporty-cover">
        <div className="sporty-cover-red-bar">
          <span className="sporty-cover-vertical">SPORTS</span>
        </div>
        <div className="sporty-cover-main">
          {shouldShowImage && (
            <div className="sporty-cover-photo">
              <Img slot={imageSlots.primary} alt="Sports cover" className="sporty-cover-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
            </div>
          )}
          <h1
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTitleChange(e.currentTarget.innerText)}
            className="sporty-cover-title"
          >
            {title}
          </h1>
        </div>
      </div>
    );
  }



  if (themeId === 'newspaper') {
    return (
      <div className="layout-newspaper-cover">
        <div className="nyt-masthead">The Editorial Times</div>
        <div className="nyt-rule" />
        <h1
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onTitleChange(e.currentTarget.innerText)}
          className="nyt-cover-headline"
        >
          {title}
        </h1>
        {shouldShowImage && (
          <div className="nyt-cover-circles">
            {[imageSlots.primary, ...imageSlots.extras.slice(0, 2)].map((slot, i) => (
              <div key={i} className={`nyt-circle nyt-circle-${i}`}>
                <Img slot={slot} alt={`Cover ${i}`} className="nyt-circle-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (themeId === 'wellness') {
    return (
      <div className="layout-wellness-cover">
        <span className="wellness-cover-vertical">Emocalm</span>
        <div className="wellness-cover-main">
          {shouldShowImage && (
            <Img slot={imageSlots.primary} alt="Wellness cover" className="wellness-cover-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
          )}
          <h1
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTitleChange(e.currentTarget.innerText)}
            className="wellness-cover-title"
          >
            {title}
          </h1>
        </div>
      </div>
    );
  }

  if (themeId === 'bloodred') {
    return (
      <div className="layout-bloodred-cover">
        <div className="bloodred-cover-chapter-badge">
          <span className="bloodred-cover-num">01</span>
          <span className="bloodred-cover-label">CHAPTER</span>
        </div>
        <h1
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onTitleChange(e.currentTarget.innerText)}
          className="bloodred-cover-title focus:outline-none focus:bg-white/10 rounded px-1 min-w-[100px] text-center"
        >
          {title}
        </h1>
        <div className="bloodred-cover-sub uppercase tracking-wider text-xs opacity-75 mt-2">E-Book Edition</div>
      </div>
    );
  }

  // Default cover (editorial + legacy themes)
  return (
    <div className="layout-cover flex flex-col items-center justify-center py-6">
      {themeId === 'editorial' && <WarmStickers />}
      {shouldShowImage && (
        <div className="ebook-cover-image relative">
          {(imgLoading || isGeneratingImage) && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 rounded-full" />
          )}
          <img src={imgSrc} alt="Ebook Cover" onLoad={onImgLoad} onError={onImgError} />
        </div>
      )}
      <h1
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onTitleChange(e.currentTarget.innerText)}
        className="ebook-h1 focus:outline-none focus:bg-black/5 rounded px-1 min-w-[100px] text-center"
      >
        {title}
      </h1>
      <div className="ebook-subtitle">E-Book Edition</div>
    </div>
  );
};

/* ── INNER PAGE LAYOUTS ──────────────────────────────────── */

export const ThemeEditorial: React.FC<ThemeLayoutProps> = (props) => {
  const {
    themeId,
    section,
    pageIndex,
    bookTitle,
    imageSlots,
    imageVersion,
    isActive,
    shouldShowImage,
    shouldShowChapterHeading,
    chapterHeadingText,
    onTextChange,
    pdfExportMode,
  } = props;

  const { lead, body } = splitContent(section.content);
  const pageNum = String(pageIndex).padStart(2, '0');
  const chNum = String(pageIndex).padStart(2, '0');
  const extras = imageSlots.extras;

  const bodyEditor = (className: string, mergeLead = false) => (
    <div
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) =>
        onTextChange('content', mergeLead ? `${lead}<br><br>${e.currentTarget.innerHTML}` : e.currentTarget.innerHTML)
      }
      dangerouslySetInnerHTML={{ __html: mergeLead ? body : lead }}
      className={className}
    />
  );



  // ── POP ART COMIC ──
  if (themeId === 'comic') {
    return (
      <div className="layout-comic">
        <div className="comic-halftone" aria-hidden />
        <div className="comic-starburst comic-starburst-tl" aria-hidden />
        <div className="comic-starburst comic-starburst-br" aria-hidden />

        {shouldShowChapterHeading ? (
          <div className="comic-chapter-banner">
            <span className="comic-chapter-label">CHAPTER</span>
            <span className="comic-chapter-num">{chNum}</span>
          </div>
        ) : (
          <div className="comic-chapter-side">
            <span>CH. {chNum}</span>
          </div>
        )}

        {shouldShowImage && (
          <div className="comic-hero-panel">
            <Img slot={imageSlots.primary} alt={chapterHeadingText} className="comic-hero-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
          </div>
        )}

        {shouldShowChapterHeading && (
          <h2
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
            className="comic-page-title"
          >
            {chapterHeadingText}
          </h2>
        )}

        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onTextChange('content', body ? `${e.currentTarget.innerHTML}<br><br>${body}` : e.currentTarget.innerHTML)}
          dangerouslySetInnerHTML={{ __html: lead }}
          className="comic-body-text"
        />

        {body && bodyEditor('comic-body-cols', true)}

        <div className="comic-divider" />

        <div className="comic-panel-grid">
          {extras.slice(0, 4).map((slot, i) => (
            <div key={i} className={`comic-panel comic-panel-${i}`}>
              <Img slot={slot} alt={`Panel ${i + 1}`} className="comic-panel-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
              <span className="comic-panel-cap">PANEL {i + 1}</span>
            </div>
          ))}
        </div>

        <div className="comic-quote-bar">
          <span>Color is a power that affects the soul.</span>
        </div>

        {extras[4] && shouldShowImage && (
          <div className="comic-footer-strip">
            <Img slot={extras[4]} alt="Comic footer" className="comic-footer-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
          </div>
        )}
      </div>
    );
  }

  // ── WANDERLUST TRAVEL ──
  if (themeId === 'wanderlust') {
    return (
      <div className="layout-wanderlust">
        <div className="wl-grid">
          {shouldShowImage && (
            <div className="wl-photo-col">
              <Img slot={imageSlots.primary} alt={chapterHeadingText} className="wl-hero-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
            </div>
          )}
          <div className="wl-text-col">
            {shouldShowChapterHeading && (
              <h2
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
                className="wl-heading"
              >
                {chapterHeadingText}
              </h2>
            )}
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTextChange('content', body ? `${e.currentTarget.innerHTML}<br><br>${body}` : e.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: lead }}
              className="wl-lead"
            />
            {body && bodyEditor('wl-columns', true)}
            <div className="wl-thumb-row">
              {extras.slice(0, 3).map((slot, i) => (
                <div key={i} className="wl-thumb">
                  <Img slot={slot} alt={`Travel ${i}`} className="wl-thumb-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <span className="wl-page-num">{pageNum}</span>
      </div>
    );
  }

  // ── SOFT PINK ──
  if (themeId === 'softpink') {
    return (
      <div className="layout-softpink">
        <div className="sp-blob sp-blob-1" aria-hidden />
        <div className="sp-blob sp-blob-2" aria-hidden />
        {shouldShowChapterHeading && (
          <h2
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
            className="sp-heading"
          >
            {chapterHeadingText}
          </h2>
        )}
        <div className="sp-content-box">
          <div className="sp-row">
            {shouldShowImage && (
              <div className="sp-portrait">
                <Img slot={imageSlots.primary} alt={chapterHeadingText} className="sp-portrait-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
              </div>
            )}
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTextChange('content', body ? `${e.currentTarget.innerHTML}<br><br>${body}` : e.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: lead }}
              className="sp-lead"
            />
          </div>
          {body && bodyEditor('sp-columns', true)}
        </div>
        <div className="sp-collage">
          {extras.slice(0, 4).map((slot, i) => (
            <div key={i} className={`sp-collage-item sp-collage-${i}`}>
              <Img slot={slot} alt={`Pink ${i}`} className="sp-collage-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── SPORTY EDITORIAL ──
  if (themeId === 'sporty') {
    return (
      <div className="layout-sporty">
        <div className="sporty-vertical-title">
          {shouldShowChapterHeading ? chapterHeadingText : `PAGE ${pageNum}`}
        </div>
        <div className="sporty-main">
          {shouldShowImage && (
            <div className="sporty-hero-frame">
              <Img slot={imageSlots.primary} alt={chapterHeadingText} className="sporty-hero-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
            </div>
          )}
          <div className="sporty-text-box">
            {shouldShowChapterHeading && (
              <h2
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
                className="sporty-heading"
              >
                {chapterHeadingText}
              </h2>
            )}
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTextChange('content', body ? `${e.currentTarget.innerHTML}<br><br>${body}` : e.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: lead }}
              className="sporty-lead"
            />
            {body && bodyEditor('sporty-columns', true)}
          </div>
          <div className="sporty-gallery">
            {extras.slice(0, 3).map((slot, i) => (
              <div key={i} className="sporty-gallery-item">
                <Img slot={slot} alt={`Sport ${i}`} className="sporty-gallery-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── WELLNESS ──
  if (themeId === 'wellness') {
    const accentClass = `wellness-accent-${pageIndex % 4}`;
    return (
      <div className={`layout-wellness ${accentClass}`}>
        <div className="wellness-botanical-bg" aria-hidden />
        {shouldShowChapterHeading && (
          <h2
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
            className="wellness-heading"
          >
            {chapterHeadingText}
          </h2>
        )}
        <div className="wellness-split">
          {shouldShowImage && (
            <div className="wellness-photo">
              <Img slot={imageSlots.primary} alt={chapterHeadingText} className="wellness-photo-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
            </div>
          )}
          <div className="wellness-text">
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTextChange('content', body ? `${e.currentTarget.innerHTML}<br><br>${body}` : e.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: lead }}
              className="wellness-lead"
            />
            {body && bodyEditor('wellness-columns', true)}
          </div>
        </div>
        <div className="wellness-callout">
          <span>Key Benefits — {bookTitle || 'Wellness Guide'}</span>
        </div>
        <div className="wellness-thumbs">
          {extras.slice(0, 3).map((slot, i) => (
            <div key={i} className="wellness-thumb">
              <Img slot={slot} alt={`Wellness ${i}`} className="wellness-thumb-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
            </div>
          ))}
        </div>
      </div>
    );
  }



  // ── NEWSPAPER ──
  if (themeId === 'newspaper') {
    const circleColors = ['nyt-pastel-yellow', 'nyt-pastel-pink', 'nyt-pastel-blue', 'nyt-pastel-green'];
    return (
      <div className="layout-newspaper">
        <div className="nyt-section-label">National</div>
        <div className="nyt-rule" />
        {shouldShowChapterHeading && (
          <h2
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
            className="nyt-headline"
          >
            {chapterHeadingText}
          </h2>
        )}
        <p className="nyt-deck">Researchers explore how changing conditions reshape the story of {bookTitle || 'our world'}.</p>

        <div className="nyt-infographic">
          {[imageSlots.primary, ...extras.slice(0, 4)].map((slot, i) => (
            <div key={i} className={`nyt-bird-circle ${circleColors[i % 4]}`}>
              <Img slot={slot} alt={`Feature ${i}`} className="nyt-bird-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
            </div>
          ))}
        </div>

        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onTextChange('content', e.currentTarget.innerHTML)}
          dangerouslySetInnerHTML={{ __html: section.content }}
          className="nyt-columns"
        />

        <div className="nyt-sidebar">
          <span className="nyt-sidebar-head">Related Coverage</span>
          <p className="nyt-sidebar-text">Sit-In Protest Closes Border Bridge — developing story on page {pageNum}.</p>
        </div>
      </div>
    );
  }

  // ── BLOOD RED ──
  if (themeId === 'bloodred') {
    return (
      <div className="layout-bloodred">
        {shouldShowChapterHeading && (
          <div className="bloodred-chapter-header">
            <div className="bloodred-chapter-badge-wrapper">
              {shouldShowImage ? (
                <div className="bloodred-hero-container">
                  <Img slot={imageSlots.primary} alt={chapterHeadingText} className="bloodred-hero-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
                  <div className="bloodred-hero-overlay">
                    <span className="bloodred-overlay-num">{chNum}</span>
                    <span className="bloodred-overlay-label">CHAPTER</span>
                  </div>
                </div>
              ) : (
                <div className="bloodred-chapter-badge">
                  <span className="bloodred-chapter-num">{chNum}</span>
                  <span className="bloodred-chapter-label">CHAPTER</span>
                </div>
              )}
            </div>
            <h2
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
              className="bloodred-page-title"
            >
              {chapterHeadingText}
            </h2>
          </div>
        )}

        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onTextChange('content', body ? `${e.currentTarget.innerHTML}<br><br>${body}` : e.currentTarget.innerHTML)}
          dangerouslySetInnerHTML={{ __html: lead }}
          className="bloodred-body-lead focus:outline-none focus:bg-black/5"
        />

        {body && bodyEditor('bloodred-body-cols focus:outline-none focus:bg-black/5 rounded p-1 whitespace-pre-line', true)}

        <div className="bloodred-gallery">
          {extras.slice(0, 3).map((slot, i) => (
            <div key={i} className="bloodred-gallery-item">
              <Img slot={slot} alt={`Gallery ${i}`} className="bloodred-gallery-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── BOTANICAL / MODERN / NOIR (classic magazine) ──
  if (themeId === 'botanical' || themeId === 'modern' || themeId === 'noir') {
    return (
      <div className="layout-generic-theme">
        {shouldShowImage && (
          <div className="ebook-image-frame !mt-0 !mb-4 relative">
            <Img slot={imageSlots.primary} alt={chapterHeadingText} className="generic-hero-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
          </div>
        )}
        {shouldShowChapterHeading && (
          <h2
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
            className="ebook-h1 focus:outline-none focus:bg-black/5 rounded px-1"
          >
            {chapterHeadingText}
          </h2>
        )}
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onTextChange('content', e.currentTarget.innerHTML)}
          dangerouslySetInnerHTML={{ __html: section.content }}
          className="ebook-columns focus:outline-none focus:bg-black/5 rounded p-1 whitespace-pre-line"
        />
        <div className="generic-thumb-row">
          {extras.slice(0, 3).map((slot, i) => (
            <div key={i} className="generic-thumb">
              <Img slot={slot} alt={`Thumb ${i}`} className="generic-thumb-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── WARM BOHO (default editorial) ──
  const checklistLines = (body || lead)
    .split(/[.\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12)
    .slice(0, 4);

  return (
    <div className="layout-warm-boho">
      <WarmStickers />
      <span className="warm-watermark" aria-hidden>{pageNum}</span>
      <div className="warm-section-header">
        <span className="warm-vertical-label">{shouldShowChapterHeading ? 'Overview' : 'Contents'}</span>
        {shouldShowChapterHeading && (
          <h2
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
            className="warm-title focus:outline-none focus:bg-black/5 rounded px-1"
          >
            {chapterHeadingText}
          </h2>
        )}
        {!shouldShowChapterHeading && <span className="warm-continued-tag">continued</span>}
      </div>
      <div className="warm-hero-row">
        {shouldShowImage && (
          <div className="warm-arch-frame">
            <Img slot={imageSlots.primary} alt={chapterHeadingText} className="warm-arch-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
          </div>
        )}
        <div className="warm-intro-block">
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('content', body ? `${e.currentTarget.innerHTML}<br><br>${body}` : e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: lead }}
            className="warm-lead focus:outline-none focus:bg-black/5 rounded px-1"
          />
          {checklistLines.length > 0 && (
            <ul className="warm-checklist">
              {checklistLines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {body && bodyEditor('warm-body-columns focus:outline-none focus:bg-black/5 rounded p-1 whitespace-pre-line', true)}
      <div className="warm-gallery-row">
        {extras.slice(0, 3).map((slot, i) => (
          <div key={i} className={`warm-gallery-card warm-gallery-card-${i}`}>
            <Img slot={slot} alt={`Gallery ${i}`} className="warm-gallery-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
          </div>
        ))}
      </div>
      <div className="warm-cta-band">
        <div className="warm-cta-blob">
          <Img slot={extras[3]} alt="CTA" className="warm-cta-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
        </div>
        <div className="warm-cta-text">
          <span className="warm-cta-kicker">Call to Action</span>
          <span className="warm-cta-title">Discover more in {bookTitle || 'this edition'}</span>
        </div>
      </div>
      <div className="warm-footer-arch">
        <Img slot={extras[4]} alt="Footer" className="warm-footer-arch-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
      </div>
    </div>
  );
};

interface ThemeMinimalBlackProps extends ThemeLayoutProps {
  layout: EbookSection['layout'];
}

export const ThemeMinimalBlack: React.FC<ThemeMinimalBlackProps> = (props) => {
  const {
    layout,
    section,
    pageIndex,
    bookTitle,
    imageSlots,
    imageVersion,
    isActive,
    shouldShowImage,
    shouldShowChapterHeading,
    chapterHeadingText,
    onTextChange,
    pdfExportMode,
  } = props;

  const pageNum = String(pageIndex).padStart(2, '0');

  if (layout === 'cover') {
    return (
      <div className="layout-minblack-cover">
        <div className="minblack-cover-kicker">
          {bookTitle || 'Ebook Edition'}
        </div>
        <div className="minblack-cover-main">
          <h1
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
            className="minblack-cover-title"
          >
            {section.title}
          </h1>
          <div className="minblack-cover-divider" />
          <p className="minblack-cover-author">
            By Author
          </p>
        </div>
        <div className="minblack-cover-footer">
          Minimalism Press
        </div>
      </div>
    );
  }

  if (layout === 'editorial') {
    return (
      <div className="layout-minblack-opener">
        <div className="minblack-opener-header">
          <span>{bookTitle}</span>
          <span>Chapter {pageNum}</span>
        </div>
        
        <div className="minblack-opener-main">
          {/* Huge background number */}
          <div className="minblack-opener-bg-num">
            {pageNum}
          </div>
          
          <div className="minblack-opener-overlay">
            <span className="minblack-opener-kicker">
              Chapter {pageNum}
            </span>
            <h2
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
              className="minblack-opener-title"
            >
              {chapterHeadingText}
            </h2>
          </div>
        </div>

        <div className="minblack-opener-footer">
          — {pageNum} —
        </div>
      </div>
    );
  }

  if (layout === 'split') {
    return (
      <div className="layout-minblack-split">
        <div className="minblack-split-header">
          <span>{bookTitle}</span>
          <span>{chapterHeadingText}</span>
        </div>

        <div className="minblack-split-main">
          <div className="minblack-split-left">
            {shouldShowImage && (
              <Img
                slot={imageSlots.primary}
                alt={chapterHeadingText}
                className="minblack-split-img"
                imageVersion={imageVersion}
                isActive={isActive}
                pdfExportMode={pdfExportMode}
              />
            )}
          </div>
          <div className="minblack-split-right">
            {shouldShowChapterHeading && (
              <h3
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
                className="minblack-split-title"
              >
                {chapterHeadingText}
              </h3>
            )}
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTextChange('content', e.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: section.content }}
              className="minblack-split-content"
            />
          </div>
        </div>

        <div className="minblack-split-footer">
          {pageNum}
        </div>
      </div>
    );
  }

  if (layout === 'magazine') {
    return (
      <div className="layout-minblack-quote">
        <div className="minblack-quote-header">
          {bookTitle}
        </div>

        <div className="minblack-quote-main">
          <span className="minblack-quote-mark">“</span>
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('content', e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: section.content }}
            className="minblack-quote-content"
          />
          <span className="minblack-quote-mark">”</span>
        </div>

        <div className="minblack-quote-footer">
          {pageNum}
        </div>
      </div>
    );
  }

  if (layout === 'toc') {
    const tocItems = section.content && section.content.trim() !== ''
      ? section.content.split(/<br\s*\/?>|<\/?p>/).filter(item => item.replace(/&nbsp;/g, '').trim())
      : [
          'Introduction',
          'First Chapter: Setting the Scene',
          'Second Chapter: The Climax',
          'Third Chapter: Conclusion & Takeaways'
        ];

    return (
      <div className="layout-minblack-toc">
        <div className="minblack-toc-header">
          {bookTitle}
        </div>

        <div className="minblack-toc-main">
          <h2
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
            className="minblack-toc-title"
          >
            {chapterHeadingText || 'Table of Contents'}
          </h2>

          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('content', e.currentTarget.innerHTML)}
            className="minblack-toc-list"
          >
            {tocItems.map((item, idx) => {
              const cleanText = item.replace(/<[^>]*>/g, '').trim();
              if (!cleanText) return null;
              const num = String(idx + 1).padStart(2, '0');
              return (
                <div key={idx} className="minblack-toc-item">
                  <span className="minblack-toc-num">{num}</span>
                  <span className="minblack-toc-label">{cleanText}</span>
                  <div className="minblack-toc-dots" />
                  <span className="minblack-toc-page">{String(idx * 4 + 5).padStart(2, '0')}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="minblack-toc-footer">
          {pageNum}
        </div>
      </div>
    );
  }

  // standard / text layout
  return (
    <div className="layout-minblack-text">
      <div className="minblack-text-header">
        <span>{bookTitle}</span>
        <span>{chapterHeadingText}</span>
      </div>

      <div className="minblack-text-main">
        <div className="minblack-text-left">
          {shouldShowChapterHeading && (
            <h2
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
              className="minblack-text-title"
            >
              {chapterHeadingText}
            </h2>
          )}
        </div>
        <div className="minblack-text-right">
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('content', e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: section.content }}
            className="minblack-text-content"
          />
          {shouldShowImage && (
            <div className="minblack-text-img-frame">
              <Img
                slot={imageSlots.primary}
                alt={chapterHeadingText}
                className="minblack-text-img"
                imageVersion={imageVersion}
                isActive={isActive}
                pdfExportMode={pdfExportMode}
              />
            </div>
          )}
        </div>
      </div>

      <div className="minblack-text-footer">
        {pageNum}
      </div>
    </div>
  );
};


// ── 14. ROSE THEME LAYOUTS ──────────────────────────────────
interface ThemeRoseProps extends ThemeLayoutProps {
  layout: EbookSection['layout'];
}

export const ThemeRose: React.FC<ThemeRoseProps> = (props) => {
  const {
    layout,
    section,
    pageIndex,
    bookTitle,
    imageSlots,
    imageVersion,
    isActive,
    shouldShowImage,
    shouldShowChapterHeading,
    chapterHeadingText,
    onTextChange,
    pdfExportMode,
  } = props;

  const pageNum = String(pageIndex).padStart(2, '0');
  const items = section.content && section.content.trim() !== ''
    ? section.content.split(/<br\s*\/?>|<\/?p>/).map(t => t.replace(/<[^>]*>/g, '').trim()).filter(Boolean)
    : [
        'Eat well for your body',
        'Move well for your health',
        'Make the best lifestyle choices',
        'Change your mindset around aging',
        'Prioritize self-care and sleep'
      ];

  if (layout === 'cover') {
    return (
      <div className="layout-rose-cover">
        <div className="rose-cover-floral-top">
          <svg viewBox="0 0 100 30" className="rose-floral-svg" style={{ width: '80px', height: '30px', stroke: 'var(--eb-accent, #8a2846)', fill: 'none' }}>
            <path d="M10,15 C30,5 70,5 90,15 C70,25 30,25 10,15" strokeWidth="0.5" strokeDasharray="1 1" />
            <circle cx="50" cy="15" r="2" fill="var(--eb-accent, #8a2846)" />
          </svg>
        </div>
        <div className="rose-cover-center">
          <div className="rose-cover-kicker">{bookTitle || 'Ebook Edition'}</div>
          <h1
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
            className="rose-cover-title"
          >
            {section.title}
          </h1>
          <div className="rose-cover-divider" />
          <p className="rose-cover-author">By Author Name</p>
        </div>
        <div className="rose-cover-floral-bottom">
          <svg viewBox="0 0 100 10" className="rose-floral-svg-mini" style={{ width: '40px', height: '10px', stroke: 'var(--eb-accent, #8a2846)' }}>
            <line x1="10" y1="5" x2="90" y2="5" strokeWidth="0.5" />
          </svg>
        </div>
      </div>
    );
  }

  if (layout === 'editorial') {
    // Checklist Layout
    return (
      <div className="layout-rose-checklist">
        <div className="rose-checklist-header">
          <span>{bookTitle}</span>
          <span>Checklist</span>
        </div>
        <div className="rose-checklist-main">
          <h2
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
            className="rose-checklist-title"
          >
            {chapterHeadingText}
          </h2>
          <div className="rose-checklist-list">
            {items.map((item, idx) => (
              <div key={idx} className="rose-checklist-item">
                <div className="rose-checklist-checkbox">
                  <svg viewBox="0 0 24 24" className="rose-check-icon" style={{ width: '12px', height: '12px', stroke: 'currentColor', strokeWidth: '3', fill: 'none' }}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span className="rose-checklist-text">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rose-checklist-footer">{pageNum}</div>
      </div>
    );
  }

  if (layout === 'toc') {
    // Step-by-step layout
    return (
      <div className="layout-rose-steps">
        <div className="rose-steps-header">{bookTitle}</div>
        <div className="rose-steps-main">
          <h2
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
            className="rose-steps-title"
          >
            {chapterHeadingText}
          </h2>
          <div className="rose-steps-grid">
            {items.slice(0, 5).map((item, idx) => (
              <div key={idx} className="rose-step-card">
                <div className="rose-step-num">0{idx + 1}</div>
                <div className="rose-step-content">
                  <div className="rose-step-label">Step {idx + 1}</div>
                  <div className="rose-step-text">{item}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rose-steps-footer">{pageNum}</div>
      </div>
    );
  }

  if (layout === 'magazine') {
    // Quote with floral decoration
    return (
      <div className="layout-rose-quote">
        <div className="rose-quote-header">{bookTitle}</div>
        <div className="rose-quote-container">
          <div className="rose-quote-floral-decor">✿</div>
          <div className="rose-quote-mark">“</div>
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('content', e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: section.content }}
            className="rose-quote-text"
          />
          <div className="rose-quote-mark">”</div>
          <div className="rose-quote-floral-decor">✿</div>
        </div>
        <div className="rose-quote-footer">{pageNum}</div>
      </div>
    );
  }

  if (layout === 'split') {
    // Two-column content layout with image
    return (
      <div className="layout-rose-split">
        <div className="rose-split-header">
          <span>{bookTitle}</span>
          <span>{chapterHeadingText}</span>
        </div>
        <div className="rose-split-main">
          <div className="rose-split-left">
            {shouldShowImage && (
              <div className="rose-split-img-frame">
                <Img
                  slot={imageSlots.primary}
                  alt={chapterHeadingText}
                  className="rose-split-img"
                  imageVersion={imageVersion}
                  isActive={isActive}
                  pdfExportMode={pdfExportMode}
                />
              </div>
            )}
          </div>
          <div className="rose-split-right">
            {shouldShowChapterHeading && (
              <h3
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
                className="rose-split-title"
              >
                {chapterHeadingText}
              </h3>
            )}
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTextChange('content', e.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: section.content }}
              className="rose-split-content"
            />
          </div>
        </div>
        <div className="rose-split-footer">{pageNum}</div>
      </div>
    );
  }

  // standard / text layout - Empowering Affirmations
  return (
    <div className="layout-rose-text">
      <div className="rose-text-header">
        <span>{bookTitle}</span>
        <span>{chapterHeadingText}</span>
      </div>
      <div className="rose-text-main">
        <div className="rose-text-frame">
          {shouldShowChapterHeading && (
            <h2
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
              className="rose-text-title"
            >
              {chapterHeadingText}
            </h2>
          )}
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('content', e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: section.content }}
            className="rose-text-content"
          />
        </div>
      </div>
      <div className="rose-text-footer">{pageNum}</div>
    </div>
  );
};


// ── 15. LAVENDER THEME LAYOUTS ──────────────────────────────
interface ThemeLavenderProps extends ThemeLayoutProps {
  layout: EbookSection['layout'];
}

export const ThemeLavender: React.FC<ThemeLavenderProps> = (props) => {
  const {
    layout,
    section,
    pageIndex,
    bookTitle,
    imageSlots,
    imageVersion,
    isActive,
    shouldShowImage,
    shouldShowChapterHeading,
    chapterHeadingText,
    onTextChange,
    pdfExportMode,
  } = props;

  const pageNum = String(pageIndex).padStart(2, '0');
  const items = section.content && section.content.trim() !== ''
    ? section.content.split(/<br\s*\/?>|<\/?p>/).map(t => t.replace(/<[^>]*>/g, '').trim()).filter(Boolean)
    : [
        'Introduction to the Lavender Method',
        'Aesthetic Lavender Fields Design',
        'Rotated Chapter Opener Grid Styling',
        'Serene Two-Column Spreads & Dropcaps',
        'Interactive Diagram and Step funnels'
      ];

  const header = (
    <div className="lavender-header">
      <span>{bookTitle || 'E-Book'}</span>
      <span>{chapterHeadingText}</span>
    </div>
  );

  const footer = (
    <div className="lavender-footer-band">
      <span>Artistic E-Book Series</span>
      <span>{pageNum}</span>
    </div>
  );

  if (layout === 'cover') {
    // Top-half image / bottom-half lavender text block cover
    return (
      <div className="layout-lavender-cover">
        <div className="lavender-cover-top">
          {shouldShowImage ? (
            <Img
              slot={imageSlots.primary}
              alt={bookTitle}
              className="lavender-cover-bg-img"
              imageVersion={imageVersion}
              isActive={isActive}
              pdfExportMode={pdfExportMode}
            />
          ) : (
            <div className="lavender-cover-top-placeholder" />
          )}
        </div>
        <div className="lavender-cover-bottom">
          <div className="lavender-cover-kicker">{bookTitle || 'Ebook Collection'}</div>
          <h1
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
            className="lavender-cover-title"
          >
            {section.title}
          </h1>
          <svg className="lavender-cover-decor" viewBox="0 0 100 20" fill="none" stroke="currentColor" strokeWidth="1.2">
            <line x1="5" y1="10" x2="42" y2="10" />
            <polygon points="50,6 54,10 50,14 46,10" fill="currentColor" />
            <line x1="58" y1="10" x2="95" y2="10" />
          </svg>
          <p className="lavender-cover-author">By Author Name</p>
        </div>
      </div>
    );
  }

  if (layout === 'editorial') {
    // Chapter opener layout (sidebar removed, full width with unified header/footer & botanical divider)
    return (
      <div className="layout-lavender-opener">
        {header}
        <div className="lavender-opener-main">
          <div className="lavender-opener-circle">{pageNum}</div>
          <h2
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
            className="lavender-opener-title"
          >
            {chapterHeadingText}
          </h2>
          <div className="lavender-opener-divider" />
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('content', e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: section.content }}
            className="lavender-opener-desc"
          />
          <div className="lavender-opener-decor-section">
            <svg className="lavender-flower-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M12 22V10M12 10C10.5 8 9.5 8 9 9.5C8.5 11 9.5 12 12 10ZM12 10C13.5 8 14.5 8 15 9.5C15.5 11 14.5 12 12 10ZM12 14C10.5 12.5 9.5 12.5 9 13.5C8.5 14.5 9.5 15.5 12 14ZM12 14C13.5 12.5 14.5 12.5 15 13.5C15.5 14.5 14.5 15.5 12 14ZM12 18C10.5 17 9.5 17 9 17.8C8.5 18.5 9.5 19.2 12 18ZM12 18C13.5 17 14.5 17 15 17.8C15.5 18.5 14.5 19.2 12 18Z" />
            </svg>
          </div>
        </div>
        {footer}
      </div>
    );
  }

  if (layout === 'split') {
    // Two-column magazine layout (dropcap removed, 40% width image)
    const splitText = splitContent(section.content);
    return (
      <div className="layout-lavender-split">
        {header}
        <div className="lavender-split-main">
          <div className="lavender-split-columns">
            <div className="lavender-split-left-col">
              {shouldShowChapterHeading && (
                <h2
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
                  className="lavender-split-title"
                >
                  {chapterHeadingText}
                </h2>
              )}
              {splitText.lead && (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onTextChange('content', e.currentTarget.innerHTML)}
                  className="lavender-split-lead"
                  dangerouslySetInnerHTML={{ __html: splitText.lead }}
                />
              )}
              {splitText.body && (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onTextChange('content', e.currentTarget.innerHTML)}
                  dangerouslySetInnerHTML={{ __html: splitText.body }}
                  className="lavender-split-body"
                />
              )}
            </div>
            <div className="lavender-split-right-col">
              {shouldShowImage && (
                <div className="lavender-split-img-container">
                  <Img
                    slot={imageSlots.primary}
                    alt={chapterHeadingText}
                    className="lavender-split-img"
                    imageVersion={imageVersion}
                    isActive={isActive}
                    pdfExportMode={pdfExportMode}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        {footer}
      </div>
    );
  }

  if (layout === 'magazine') {
    // Funnel Chart Layout
    return (
      <div className="layout-lavender-funnel">
        {header}
        <div className="lavender-funnel-main">
          <div className="lavender-funnel-grid">
            <div className="lavender-funnel-visual">
              <div className="lavender-funnel-tier tier-1"><span>01. ATTRACTION</span></div>
              <div className="lavender-funnel-tier tier-2"><span>02. INTEREST</span></div>
              <div className="lavender-funnel-tier tier-3"><span>03. DECISION</span></div>
              <div className="lavender-funnel-tier tier-4"><span>04. ACTION</span></div>
            </div>
            <div className="lavender-funnel-content-block">
              {shouldShowChapterHeading && (
                <h2
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
                  className="lavender-funnel-title"
                >
                  {chapterHeadingText || 'Funnel Strategy'}
                </h2>
              )}
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => onTextChange('content', e.currentTarget.innerHTML)}
                dangerouslySetInnerHTML={{ __html: section.content }}
                className="lavender-funnel-text"
              />
            </div>
          </div>
        </div>
        {footer}
      </div>
    );
  }

  if (layout === 'toc') {
    // Numbered list layout
    return (
      <div className="layout-lavender-list">
        {header}
        <div className="lavender-list-main">
          <h2
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
            className="lavender-list-title"
          >
            {chapterHeadingText}
          </h2>
          <div className="lavender-list-items">
            {items.map((item, idx) => (
              <div key={idx} className="lavender-list-item">
                <div className="lavender-list-num">{String(idx + 1).padStart(2, '0')}</div>
                <div className="lavender-list-text">{item}</div>
              </div>
            ))}
          </div>
        </div>
        {footer}
      </div>
    );
  }

  // standard / text layout (borders removed, consistent margins/padding)
  return (
    <div className="layout-lavender-text">
      {header}
      <div className="lavender-text-main">
        {shouldShowChapterHeading && (
          <h2
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
            className="lavender-text-title"
          >
            {chapterHeadingText}
          </h2>
        )}
        <div
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => onTextChange('content', e.currentTarget.innerHTML)}
          dangerouslySetInnerHTML={{ __html: section.content }}
          className="lavender-text-content"
        />
      </div>
      {footer}
    </div>
  );
};


// ── 16. BOLD DARK THEME LAYOUTS ─────────────────────────────
interface ThemeBoldDarkProps extends ThemeLayoutProps {
  layout: EbookSection['layout'];
}

export const ThemeBoldDark: React.FC<ThemeBoldDarkProps> = (props) => {
  const {
    layout,
    section,
    pageIndex,
    bookTitle,
    imageSlots,
    imageVersion,
    isActive,
    shouldShowImage,
    shouldShowChapterHeading,
    chapterHeadingText,
    onTextChange,
    pdfExportMode,
  } = props;

  const pageNum = String(pageIndex).padStart(2, '0');
  const items = section.content && section.content.trim() !== ''
    ? section.content.split(/<br\s*\/?>|<\/?p>/).map(t => t.replace(/<[^>]*>/g, '').trim()).filter(Boolean)
    : [
        'Strategic Consultation: $150',
        'Layout Redesign Package: $499',
        'High-End Typography Audit: $250',
        'Custom Design Services: $999',
        'Full PDF Branding Guidelines: $599'
      ];

  if (layout === 'cover') {
    // Dark cover with 2x2 grid of B&W images
    return (
      <div className="layout-bolddark-cover">
        {shouldShowImage && (
          <div className="bolddark-cover-grid">
            <div className="bolddark-grid-item">
              <Img slot={imageSlots.primary} alt="g1" className="bolddark-grid-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
            </div>
            <div className="bolddark-grid-item">
              <Img slot={imageSlots.extras[0] || imageSlots.primary} alt="g2" className="bolddark-grid-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
            </div>
            <div className="bolddark-grid-item">
              <Img slot={imageSlots.extras[1] || imageSlots.primary} alt="g3" className="bolddark-grid-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
            </div>
            <div className="bolddark-grid-item">
              <Img slot={imageSlots.extras[2] || imageSlots.primary} alt="g4" className="bolddark-grid-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
            </div>
          </div>
        )}
        <div className="bolddark-cover-card">
          <div className="bolddark-cover-kicker">{bookTitle || 'LTD EDITION'}</div>
          <h1
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
            className="bolddark-cover-title"
          >
            {section.title}
          </h1>
          <div className="bolddark-cover-line" />
          <p className="bolddark-cover-author">By Author Name</p>
        </div>
      </div>
    );
  }

  if (layout === 'editorial') {
    // Call to Action Page
    return (
      <div className="layout-bolddark-cta">
        <div className="bolddark-cta-header">{bookTitle}</div>
        <div className="bolddark-cta-main">
          {shouldShowChapterHeading && (
            <h2
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
              className="bolddark-cta-title"
            >
              {chapterHeadingText || 'Ready to Start?'}
            </h2>
          )}
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('content', e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: section.content }}
            className="bolddark-cta-desc"
          />
          <div className="bolddark-cta-button">
            GET STARTED NOW
          </div>
        </div>
        <div className="bolddark-cta-footer">{pageNum}</div>
      </div>
    );
  }

  if (layout === 'split') {
    // Services / pricing grid layout
    return (
      <div className="layout-bolddark-services">
        <div className="bolddark-services-header">
          <span>{bookTitle}</span>
          <span>Services & Pricing</span>
        </div>
        <div className="bolddark-services-main">
          {shouldShowChapterHeading && (
            <h2
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
              className="bolddark-services-title"
            >
              {chapterHeadingText}
            </h2>
          )}
          <div className="bolddark-services-list">
            {items.map((item, idx) => {
              const parts = item.split(/[:\-–]/);
              const name = parts[0] || 'Service Option';
              const price = parts[1] || `$${(idx + 1) * 99}`;
              return (
                <div key={idx} className="bolddark-service-row">
                  <span className="bolddark-service-name">{name.trim()}</span>
                  <div className="bolddark-service-dots" />
                  <span className="bolddark-service-price">{price.trim()}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bolddark-services-footer">{pageNum}</div>
      </div>
    );
  }

  if (layout === 'magazine') {
    // Quote page with large quotation mark
    return (
      <div className="layout-bolddark-quote">
        <div className="bolddark-quote-header">{bookTitle}</div>
        <div className="bolddark-quote-main">
          <span className="bolddark-quote-mark">“</span>
          <div
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('content', e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: section.content }}
            className="bolddark-quote-content"
          />
        </div>
        <div className="bolddark-quote-footer">{pageNum}</div>
      </div>
    );
  }

  if (layout === 'toc') {
    // Three-column numbered layout
    return (
      <div className="layout-bolddark-steps">
        <div className="bolddark-steps-header">{bookTitle}</div>
        <div className="bolddark-steps-main">
          {shouldShowChapterHeading && (
            <h2
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
              className="bolddark-steps-title"
            >
              {chapterHeadingText}
            </h2>
          )}
          <div className="bolddark-steps-grid">
            {items.slice(0, 3).map((item, idx) => (
              <div key={idx} className="bolddark-step-col">
                <div className="bolddark-step-num">0{idx + 1}</div>
                <div className="bolddark-step-divider" />
                <div className="bolddark-step-text">{item}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bolddark-steps-footer">{pageNum}</div>
      </div>
    );
  }

  // standard / text layout - Checklist Page
  return (
    <div className="layout-bolddark-checklist">
      <div className="bolddark-checklist-header">
        <span>{bookTitle}</span>
        <span>Checklist</span>
      </div>
      <div className="bolddark-checklist-main">
        {shouldShowChapterHeading && (
          <h2
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
            className="bolddark-checklist-title"
          >
            {chapterHeadingText}
          </h2>
        )}
        <div className="bolddark-checklist-list">
          {items.map((item, idx) => (
            <div key={idx} className="bolddark-checklist-item">
              <div className="bolddark-checklist-box" />
              <span className="bolddark-checklist-text">{item}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bolddark-checklist-footer">{pageNum}</div>
    </div>
  );
};

