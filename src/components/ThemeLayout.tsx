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

  let normalized = content
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

  if (themeId === 'construct') {
    return (
      <div className="layout-construct-cover">
        <div className="construct-cover-red">
          <h1
            contentEditable
            suppressContentEditableWarning
            onBlur={(e) => onTitleChange(e.currentTarget.innerText)}
            className="construct-cover-title"
          >
            {title}
          </h1>
        </div>
        {shouldShowImage && (
          <div className="construct-cover-photo">
            <Img slot={imageSlots.primary} alt="Construct cover" className="construct-cover-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
          </div>
        )}
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

  // ── CONSTRUCTIVIST ──
  if (themeId === 'construct') {
    return (
      <div className="layout-construct">
        <div className="construct-red-bar">
          <span className="construct-page-num">{pageNum}</span>
        </div>
        <div className="construct-body">
          {shouldShowChapterHeading && (
            <h2
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTextChange('title', e.currentTarget.innerText)}
              className="construct-title"
            >
              {chapterHeadingText}
            </h2>
          )}
          <div className="construct-grid">
            {shouldShowImage && (
              <div className="construct-photo">
                <Img slot={imageSlots.primary} alt={chapterHeadingText} className="construct-photo-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
              </div>
            )}
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => onTextChange('content', body ? `${e.currentTarget.innerHTML}<br><br>${body}` : e.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: lead }}
              className="construct-text"
            />
          </div>
          {body && bodyEditor('construct-columns', true)}
          <div className="construct-panels">
            {extras.slice(0, 4).map((slot, i) => (
              <div key={i} className="construct-panel">
                <Img slot={slot} alt={`Panel ${i}`} className="construct-panel-img" imageVersion={imageVersion} isActive={isActive} pdfExportMode={pdfExportMode} />
              </div>
            ))}
          </div>
        </div>
        <div className="construct-side-text">{shouldShowChapterHeading ? 'SUMARIO' : 'CONT.'}</div>
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
