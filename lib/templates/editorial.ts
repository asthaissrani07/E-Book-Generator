import type { EbookSection } from '../utils/pdfParser';
import type { ThemeId } from '../themes/types';
import { getExportImageForCapture, getThemeImageSlotsForPage } from '../utils/imageHelper';

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

export function generateEditorialTemplate(
  section: EbookSection,
  theme: ThemeId,
  options: {
    bookTitle?: string;
    pageIndex: number;
    totalPages: number;
  }
): string {
  const pageNum = String(options.pageIndex).padStart(2, '0');
  const chNum = String(options.pageIndex).padStart(2, '0');
  const bookTitle = options.bookTitle || 'My E-Book';
  const pageIndex = options.pageIndex;
  const totalPages = options.totalPages;

  const imageSlots = getThemeImageSlotsForPage(theme, section.chapterTitle || section.title, bookTitle, pageIndex);
  const primarySrc = getExportImageForCapture(imageSlots.primary.prompt, imageSlots.primary.seed);
  const shouldShowImage = section.showImage !== false;
  const shouldShowChapterHeading = (section.showChapterHeading ?? true) && Boolean(section.chapterTitle || section.title);
  const chapterHeadingText = section.chapterTitle || section.title || '';

  let pageBodyContent = '';

  // 1. MINIMAL BLACK
  if (theme === 'minimalblack') {
    if (section.layout === 'editorial') {
      pageBodyContent = `
        <div class="layout-minblack-opener">
          <div class="minblack-opener-header">
            <span>${bookTitle}</span>
            <span>Chapter ${pageNum}</span>
          </div>
          <div class="minblack-opener-main">
            <div class="minblack-opener-bg-num">${pageNum}</div>
            <div class="minblack-opener-overlay">
              <span class="minblack-opener-kicker">Chapter ${pageNum}</span>
              <h2 class="minblack-opener-title">${chapterHeadingText}</h2>
            </div>
          </div>
          <div class="minblack-opener-footer">— ${pageNum} —</div>
        </div>
      `;
    } else if (section.layout === 'split') {
      pageBodyContent = `
        <div class="layout-minblack-split">
          <div class="minblack-split-header">
            <span>${bookTitle}</span>
            <span>${chapterHeadingText}</span>
          </div>
          <div class="minblack-split-main">
            <div class="minblack-split-left">
              ${shouldShowImage ? `<img src="${primarySrc}" alt="${chapterHeadingText}" class="minblack-split-img" />` : ''}
            </div>
            <div class="minblack-split-right">
              ${shouldShowChapterHeading ? `<h3 class="minblack-split-title">${chapterHeadingText}</h3>` : ''}
              <div class="minblack-split-content">${section.content}</div>
            </div>
          </div>
          <div class="minblack-split-footer">${pageNum}</div>
        </div>
      `;
    } else if (section.layout === 'magazine') {
      pageBodyContent = `
        <div class="layout-minblack-quote">
          <div class="minblack-quote-header">${bookTitle}</div>
          <div class="minblack-quote-main">
            <span class="minblack-quote-mark">“</span>
            <div class="minblack-quote-content">${section.content}</div>
            <span class="minblack-quote-mark">”</span>
          </div>
          <div class="minblack-quote-footer">${pageNum}</div>
        </div>
      `;
    } else if (section.layout === 'toc') {
      const tocItems = section.content && section.content.trim() !== ''
        ? section.content.split(/<br\s*\/?>|<\/?p>/).filter(item => item.replace(/&nbsp;/g, '').trim())
        : [
            'Introduction',
            'First Chapter: Setting the Scene',
            'Second Chapter: The Climax',
            'Third Chapter: Conclusion & Takeaways'
          ];
      pageBodyContent = `
        <div class="layout-minblack-toc">
          <div class="minblack-toc-header">${bookTitle}</div>
          <div class="minblack-toc-main">
            <h2 class="minblack-toc-title">${chapterHeadingText || 'Table of Contents'}</h2>
            <div class="minblack-toc-list">
              ${tocItems.map((item, idx) => {
                const cleanText = item.replace(/<[^>]*>/g, '').trim();
                if (!cleanText) return '';
                const num = String(idx + 1).padStart(2, '0');
                return `
                  <div class="minblack-toc-item">
                    <span class="minblack-toc-num">${num}</span>
                    <span class="minblack-toc-label">${cleanText}</span>
                    <div class="minblack-toc-dots"></div>
                    <span class="minblack-toc-page">${String(idx * 4 + 5).padStart(2, '0')}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          <div class="minblack-toc-footer">${pageNum}</div>
        </div>
      `;
    } else {
      pageBodyContent = `
        <div class="layout-minblack-text">
          <div class="minblack-text-header">
            <span>${bookTitle}</span>
            <span>${chapterHeadingText}</span>
          </div>
          <div class="minblack-text-main">
            <div class="minblack-text-left">
              ${shouldShowChapterHeading ? `<h2 class="minblack-text-title">${chapterHeadingText}</h2>` : ''}
            </div>
            <div class="minblack-text-right">
              <div class="minblack-text-content">${section.content}</div>
              ${shouldShowImage ? `
                <div class="minblack-text-img-frame">
                  <img src="${primarySrc}" alt="${chapterHeadingText}" class="minblack-text-img" />
                </div>
              ` : ''}
            </div>
          </div>
          <div class="minblack-text-footer">${pageNum}</div>
        </div>
      `;
    }
  }

  // 2. ROSE
  else if (theme === 'rose') {
    const items = section.content && section.content.trim() !== ''
      ? section.content.split(/<br\s*\/?>|<\/?p>/).map(t => t.replace(/<[^>]*>/g, '').trim()).filter(Boolean)
      : [
          'Eat well for your body',
          'Move well for your health',
          'Make the best lifestyle choices',
          'Change your mindset around aging',
          'Prioritize self-care and sleep'
        ];

    if (section.layout === 'editorial') {
      pageBodyContent = `
        <div class="layout-rose-checklist">
          <div class="rose-checklist-header">
            <span>${bookTitle}</span>
            <span>Checklist</span>
          </div>
          <div class="rose-checklist-main">
            <h2 class="rose-checklist-title">${chapterHeadingText}</h2>
            <div class="rose-checklist-list">
              ${items.map((item) => `
                <div class="rose-checklist-item">
                  <div class="rose-checklist-checkbox">
                    <svg viewBox="0 0 24 24" class="rose-check-icon" style="width: 12px; height: 12px; stroke: currentColor; stroke-width: 3; fill: none;">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <span class="rose-checklist-text">${item}</span>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="rose-checklist-footer">${pageNum}</div>
        </div>
      `;
    } else if (section.layout === 'toc') {
      pageBodyContent = `
        <div class="layout-rose-steps">
          <div class="rose-steps-header">${bookTitle}</div>
          <div class="rose-steps-main">
            <h2 class="rose-steps-title">${chapterHeadingText}</h2>
            <div class="rose-steps-grid">
              ${items.slice(0, 5).map((item, idx) => `
                <div class="rose-step-card">
                  <div class="rose-step-num">0${idx + 1}</div>
                  <div class="rose-step-content">
                    <div class="rose-step-label">Step ${idx + 1}</div>
                    <div class="rose-step-text">${item}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="rose-steps-footer">${pageNum}</div>
        </div>
      `;
    } else if (section.layout === 'magazine') {
      pageBodyContent = `
        <div class="layout-rose-quote">
          <div class="rose-quote-header">${bookTitle}</div>
          <div class="rose-quote-container">
            <div class="rose-quote-floral-decor">✿</div>
            <div class="rose-quote-mark">“</div>
            <div class="rose-quote-text">${section.content}</div>
            <div class="rose-quote-mark">”</div>
            <div class="rose-quote-floral-decor">✿</div>
          </div>
          <div class="rose-quote-footer">${pageNum}</div>
        </div>
      `;
    } else if (section.layout === 'split') {
      pageBodyContent = `
        <div class="layout-rose-split">
          <div class="rose-split-header">
            <span>${bookTitle}</span>
            <span>${chapterHeadingText}</span>
          </div>
          <div class="rose-split-main">
            <div class="rose-split-left">
              ${shouldShowImage ? `
                <div class="rose-split-img-frame">
                  <img src="${primarySrc}" alt="${chapterHeadingText}" class="rose-split-img" />
                </div>
              ` : ''}
            </div>
            <div class="rose-split-right">
              ${shouldShowChapterHeading ? `<h3 class="rose-split-title">${chapterHeadingText}</h3>` : ''}
              <div class="rose-split-content">${section.content}</div>
            </div>
          </div>
          <div class="rose-split-footer">${pageNum}</div>
        </div>
      `;
    } else {
      pageBodyContent = `
        <div class="layout-rose-text">
          <div class="rose-text-header">
            <span>${bookTitle}</span>
            <span>${chapterHeadingText}</span>
          </div>
          <div class="rose-text-main">
            <div class="rose-text-frame">
              ${shouldShowChapterHeading ? `<h2 class="rose-text-title">${chapterHeadingText}</h2>` : ''}
              <div class="rose-text-content">${section.content}</div>
            </div>
          </div>
          <div class="rose-text-footer">${pageNum}</div>
        </div>
      `;
    }
  }

  // 3. LAVENDER
  else if (theme === 'lavender') {
    const items = section.content && section.content.trim() !== ''
      ? section.content.split(/<br\s*\/?>|<\/?p>/).map(t => t.replace(/<[^>]*>/g, '').trim()).filter(Boolean)
      : [
          'Introduction to the Lavender Method',
          'Aesthetic Lavender Fields Design',
          'Rotated Chapter Opener Grid Styling',
          'Serene Two-Column Spreads & Dropcaps',
          'Interactive Diagram and Step funnels'
        ];

    const header = `
      <div class="lavender-header">
        <span>${bookTitle}</span>
        <span>${chapterHeadingText}</span>
      </div>
    `;

    const footer = `
      <div class="lavender-footer-band">
        <span>Artistic E-Book Series</span>
        <span>${pageNum}</span>
      </div>
    `;

    if (section.layout === 'editorial') {
      pageBodyContent = `
        <div class="layout-lavender-opener">
          ${header}
          <div class="lavender-opener-main">
            <div class="lavender-opener-circle">${pageNum}</div>
            <h2 class="lavender-opener-title">${chapterHeadingText}</h2>
            <div class="lavender-opener-divider"></div>
            <div class="lavender-opener-desc">${section.content}</div>
            <div class="lavender-opener-decor-section">
              <svg class="lavender-flower-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                <path d="M12 22V10M12 10C10.5 8 9.5 8 9 9.5C8.5 11 9.5 12 12 10ZM12 10C13.5 8 14.5 8 15 9.5C15.5 11 14.5 12 12 10ZM12 14C10.5 12.5 9.5 12.5 9 13.5C8.5 14.5 9.5 15.5 12 14ZM12 14C13.5 12.5 14.5 12.5 15 13.5C15.5 14.5 14.5 15.5 12 14ZM12 18C10.5 17 9.5 17 9 17.8C8.5 18.5 9.5 19.2 12 18ZM12 18C13.5 17 14.5 17 15 17.8C15.5 18.5 14.5 19.2 12 18Z" />
              </svg>
            </div>
          </div>
          ${footer}
        </div>
      `;
    } else if (section.layout === 'split') {
      const splitText = splitContent(section.content);
      pageBodyContent = `
        <div class="layout-lavender-split">
          ${header}
          <div class="lavender-split-main">
            <div class="lavender-split-columns">
              <div class="lavender-split-left-col">
                ${shouldShowChapterHeading ? `<h2 class="lavender-split-title">${chapterHeadingText}</h2>` : ''}
                ${splitText.lead ? `<div class="lavender-split-lead">${splitText.lead}</div>` : ''}
                ${splitText.body ? `<div class="lavender-split-body">${splitText.body}</div>` : ''}
              </div>
              <div class="lavender-split-right-col">
                ${shouldShowImage ? `
                  <div class="lavender-split-img-container">
                    <img src="${primarySrc}" alt="${chapterHeadingText}" class="lavender-split-img" />
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
          ${footer}
        </div>
      `;
    } else if (section.layout === 'magazine') {
      pageBodyContent = `
        <div class="layout-lavender-funnel">
          ${header}
          <div class="lavender-funnel-main">
            <div class="lavender-funnel-grid">
              <div class="lavender-funnel-visual">
                <div class="lavender-funnel-tier tier-1"><span>01. ATTRACTION</span></div>
                <div class="lavender-funnel-tier tier-2"><span>02. INTEREST</span></div>
                <div class="lavender-funnel-tier tier-3"><span>03. DECISION</span></div>
                <div class="lavender-funnel-tier tier-4"><span>04. ACTION</span></div>
              </div>
              <div class="lavender-funnel-content-block">
                ${shouldShowChapterHeading ? `<h2 class="lavender-funnel-title">${chapterHeadingText}</h2>` : ''}
                <div class="lavender-funnel-text">${section.content}</div>
              </div>
            </div>
          </div>
          ${footer}
        </div>
      `;
    } else if (section.layout === 'toc') {
      pageBodyContent = `
        <div class="layout-lavender-list">
          ${header}
          <div class="lavender-list-main">
            <h2 class="lavender-list-title">${chapterHeadingText}</h2>
            <div class="lavender-list-items">
              ${items.map((item, idx) => `
                <div class="lavender-list-item">
                  <div class="lavender-list-num">${String(idx + 1).padStart(2, '0')}</div>
                  <div class="lavender-list-text">${item}</div>
                </div>
              `).join('')}
            </div>
          </div>
          ${footer}
        </div>
      `;
    } else {
      pageBodyContent = `
        <div class="layout-lavender-text">
          ${header}
          <div class="lavender-text-main">
            ${shouldShowChapterHeading ? `<h2 class="lavender-text-title">${chapterHeadingText}</h2>` : ''}
            <div class="lavender-text-content">${section.content}</div>
          </div>
          ${footer}
        </div>
      `;
    }
  }

  // 4. BOLD DARK
  else if (theme === 'bolddark') {
    const items = section.content && section.content.trim() !== ''
      ? section.content.split(/<br\s*\/?>|<\/?p>/).map(t => t.replace(/<[^>]*>/g, '').trim()).filter(Boolean)
      : [
          'Strategic Consultation: $150',
          'Layout Redesign Package: $499',
          'High-End Typography Audit: $250',
          'Custom Design Services: $999',
          'Full PDF Branding Guidelines: $599'
        ];

    if (section.layout === 'editorial') {
      pageBodyContent = `
        <div class="layout-bolddark-cta">
          <div class="bolddark-cta-header">${bookTitle}</div>
          <div class="bolddark-cta-main">
            ${shouldShowChapterHeading ? `<h2 class="bolddark-cta-title">${chapterHeadingText}</h2>` : ''}
            <div class="bolddark-cta-desc">${section.content}</div>
            <div class="bolddark-cta-button">GET STARTED NOW</div>
          </div>
          <div class="bolddark-cta-footer">${pageNum}</div>
        </div>
      `;
    } else if (section.layout === 'split') {
      pageBodyContent = `
        <div class="layout-bolddark-services">
          <div class="bolddark-services-header">
            <span>${bookTitle}</span>
            <span>Services & Pricing</span>
          </div>
          <div class="bolddark-services-main">
            ${shouldShowChapterHeading ? `<h2 class="bolddark-services-title">${chapterHeadingText}</h2>` : ''}
            <div class="bolddark-services-list">
              ${items.map((item, idx) => {
                const parts = item.split(/[:\-–]/);
                const name = parts[0] || 'Service Option';
                const price = parts[1] || `$${(idx + 1) * 99}`;
                return `
                  <div class="bolddark-service-row">
                    <span class="bolddark-service-name">${name.trim()}</span>
                    <div class="bolddark-service-dots"></div>
                    <span class="bolddark-service-price">${price.trim()}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          <div class="bolddark-services-footer">${pageNum}</div>
        </div>
      `;
    } else if (section.layout === 'magazine') {
      pageBodyContent = `
        <div class="layout-bolddark-quote">
          <div class="bolddark-quote-header">${bookTitle}</div>
          <div class="bolddark-quote-main">
            <span class="bolddark-quote-mark">“</span>
            <div class="bolddark-quote-content">${section.content}</div>
          </div>
          <div class="bolddark-quote-footer">${pageNum}</div>
        </div>
      `;
    } else if (section.layout === 'toc') {
      pageBodyContent = `
        <div class="layout-bolddark-steps">
          <div class="bolddark-steps-header">${bookTitle}</div>
          <div class="bolddark-steps-main">
            ${shouldShowChapterHeading ? `<h2 class="bolddark-steps-title">${chapterHeadingText}</h2>` : ''}
            <div class="bolddark-steps-grid">
              ${items.slice(0, 3).map((item, idx) => `
                <div class="bolddark-step-col">
                  <div class="bolddark-step-num">0${idx + 1}</div>
                  <div class="bolddark-step-divider"></div>
                  <div class="bolddark-step-text">${item}</div>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="bolddark-steps-footer">${pageNum}</div>
        </div>
      `;
    } else {
      pageBodyContent = `
        <div class="layout-bolddark-checklist">
          <div class="bolddark-checklist-header">
            <span>${bookTitle}</span>
            <span>Checklist</span>
          </div>
          <div class="bolddark-checklist-main">
            ${shouldShowChapterHeading ? `<h2 class="bolddark-checklist-title">${chapterHeadingText}</h2>` : ''}
            <div class="bolddark-checklist-list">
              ${items.map((item) => `
                <div class="bolddark-checklist-item">
                  <div class="bolddark-checklist-box"></div>
                  <span class="bolddark-checklist-text">${item}</span>
                </div>
              `).join('')}
            </div>
          </div>
          <div class="bolddark-checklist-footer">${pageNum}</div>
        </div>
      `;
    }
  }

  // 5. COMIC
  else if (theme === 'comic') {
    pageBodyContent = `
      <div class="layout-comic">
        <div class="comic-halftone" aria-hidden="true"></div>
        <div class="comic-starburst comic-starburst-tl" aria-hidden="true"></div>
        <div class="comic-starburst comic-starburst-br" aria-hidden="true"></div>
        ${shouldShowChapterHeading ? `
          <div class="comic-chapter-banner">
            <span class="comic-chapter-label">CHAPTER</span>
            <span class="comic-chapter-num">${chNum}</span>
          </div>
        ` : `
          <div class="comic-chapter-side">
            <span>CH. ${chNum}</span>
          </div>
        `}
        ${shouldShowImage ? `
          <div class="comic-hero-panel">
            <img src="${primarySrc}" alt="${chapterHeadingText}" class="comic-hero-img" />
          </div>
        ` : ''}
        ${shouldShowChapterHeading ? `<h2 class="comic-page-title">${chapterHeadingText}</h2>` : ''}
        <div class="comic-body-text">${splitContent(section.content).lead}</div>
        ${splitContent(section.content).body ? `
          <div class="comic-body-cols">${splitContent(section.content).body}</div>
        ` : ''}
        <div class="comic-divider"></div>
        ${shouldShowImage ? `
          <div class="comic-panel-grid">
            ${imageSlots.extras.slice(0, 4).map((slot, i) => `
              <div class="comic-panel comic-panel-${i}">
                <img src="${getExportImageForCapture(slot.prompt, slot.seed)}" alt="Panel ${i + 1}" class="comic-panel-img" />
                <span class="comic-panel-cap">PANEL ${i + 1}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
        <div class="comic-quote-bar">
          <span>Color is a power that affects the soul.</span>
        </div>
        ${imageSlots.extras[4] && shouldShowImage ? `
          <div class="comic-footer-strip">
            <img src="${getExportImageForCapture(imageSlots.extras[4].prompt, imageSlots.extras[4].seed)}" alt="Comic footer" class="comic-footer-img" />
          </div>
        ` : ''}
      </div>
    `;
  }

  // 6. WANDERLUST
  else if (theme === 'wanderlust') {
    const isOdd = pageIndex % 2 !== 0;
    const isLayoutB = !isOdd && Math.floor(pageIndex / 2) % 2 !== 0;
    const splitText = splitContent(section.content);

    if (isOdd) {
      pageBodyContent = `
        <div class="layout-wanderlust wl-layout-a">
          ${shouldShowImage ? `
            <div class="wl-photo-top">
              <img src="${primarySrc}" alt="${chapterHeadingText}" class="wl-hero-img-top" />
            </div>
          ` : ''}
          <div class="wl-text-bottom">
            ${shouldShowChapterHeading ? `<h2 class="wl-heading">${chapterHeadingText}</h2>` : ''}
            <div class="wl-lead">${splitText.lead}</div>
            ${splitText.body ? `<div class="wl-single-column">${splitText.body}</div>` : ''}
            <div class="wl-thumb-row">
              ${imageSlots.extras.slice(0, 3).map((slot, i) => `
                <div class="wl-thumb">
                  <img src="${getExportImageForCapture(slot.prompt, slot.seed)}" alt="Travel ${i}" class="wl-thumb-img" />
                </div>
              `).join('')}
            </div>
          </div>
          <div class="wl-bottom-band"></div>
          <span class="wl-page-num">${pageNum}</span>
        </div>
      `;
    } else if (isLayoutB) {
      pageBodyContent = `
        <div class="layout-wanderlust wl-layout-b">
          <div class="wl-grid-b">
            ${shouldShowImage ? `
              <div class="wl-photo-left">
                <img src="${primarySrc}" alt="${chapterHeadingText}" class="wl-hero-img-side" />
              </div>
            ` : ''}
            <div class="wl-text-right">
              ${shouldShowChapterHeading ? `<h2 class="wl-heading">${chapterHeadingText}</h2>` : ''}
              <div class="wl-lead">${splitText.lead}</div>
              ${splitText.body ? `<div class="wl-single-column">${splitText.body}</div>` : ''}
              <div class="wl-thumb-row">
                ${imageSlots.extras.slice(0, 3).map((slot, i) => `
                  <div class="wl-thumb">
                    <img src="${getExportImageForCapture(slot.prompt, slot.seed)}" alt="Travel ${i}" class="wl-thumb-img" />
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
          <div class="wl-bottom-band"></div>
          <span class="wl-page-num">${pageNum}</span>
        </div>
      `;
    } else {
      pageBodyContent = `
        <div class="layout-wanderlust wl-layout-c">
          <div class="wl-watermark">${chNum}</div>
          <div class="wl-grid-c">
            <div class="wl-text-left">
              ${shouldShowChapterHeading ? `<h2 class="wl-heading">${chapterHeadingText}</h2>` : ''}
              <div class="wl-lead">${splitText.lead}</div>
              ${splitText.body ? `<div class="wl-single-column">${splitText.body}</div>` : ''}
              <div class="wl-thumb-row">
                ${imageSlots.extras.slice(0, 3).map((slot, i) => `
                  <div class="wl-thumb">
                    <img src="${getExportImageForCapture(slot.prompt, slot.seed)}" alt="Travel ${i}" class="wl-thumb-img" />
                  </div>
                `).join('')}
              </div>
            </div>
            ${shouldShowImage ? `
              <div class="wl-photo-right">
                <img src="${primarySrc}" alt="${chapterHeadingText}" class="wl-hero-img-side" />
              </div>
            ` : ''}
          </div>
          <div class="wl-bottom-band"></div>
          <span class="wl-page-num">${pageNum}</span>
        </div>
      `;
    }
  }

  // 7. SOFT PINK
  else if (theme === 'softpink') {
    pageBodyContent = `
      <div class="layout-softpink">
        <div class="sp-blob sp-blob-1" aria-hidden="true"></div>
        <div class="sp-blob sp-blob-2" aria-hidden="true"></div>
        ${shouldShowChapterHeading ? `<h2 class="sp-heading">${chapterHeadingText}</h2>` : ''}
        <div class="sp-content-box">
          <div class="sp-row">
            ${shouldShowImage ? `
              <div class="sp-portrait">
                <img src="${primarySrc}" alt="${chapterHeadingText}" class="sp-portrait-img" />
              </div>
            ` : ''}
            <div class="sp-lead">${splitContent(section.content).lead}</div>
          </div>
          ${splitContent(section.content).body ? `
            <div class="sp-columns">${splitContent(section.content).body}</div>
          ` : ''}
        </div>
        <div class="sp-collage">
          ${imageSlots.extras.slice(0, 4).map((slot, i) => `
            <div class="sp-collage-item sp-collage-${i}">
              <img src="${getExportImageForCapture(slot.prompt, slot.seed)}" alt="Pink ${i}" class="sp-collage-img" />
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 8. SPORTY
  else if (theme === 'sporty') {
    pageBodyContent = `
      <div class="layout-sporty">
        <div class="sporty-vertical-title">
          ${shouldShowChapterHeading ? chapterHeadingText : `PAGE ${pageNum}`}
        </div>
        <div class="sporty-main">
          ${shouldShowImage ? `
            <div class="sporty-hero-frame">
              <img src="${primarySrc}" alt="${chapterHeadingText}" class="sporty-hero-img" />
            </div>
          ` : ''}
          <div class="sporty-text-box">
            ${shouldShowChapterHeading ? `<h2 class="sporty-heading">${chapterHeadingText}</h2>` : ''}
            <div class="sporty-lead">${splitContent(section.content).lead}</div>
            ${splitContent(section.content).body ? `
              <div class="sporty-columns">${splitContent(section.content).body}</div>
            ` : ''}
          </div>
          <div class="sporty-gallery">
            ${imageSlots.extras.slice(0, 3).map((slot, i) => `
              <div class="sporty-gallery-item">
                <img src="${getExportImageForCapture(slot.prompt, slot.seed)}" alt="Sport ${i}" class="sporty-gallery-img" />
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // 9. WELLNESS
  else if (theme === 'wellness') {
    pageBodyContent = `
      <div class="layout-wellness wellness-accent-${pageIndex % 4}">
        <div class="wellness-botanical-bg" aria-hidden="true"></div>
        ${shouldShowChapterHeading ? `<h2 class="wellness-heading">${chapterHeadingText}</h2>` : ''}
        <div class="wellness-split">
          ${shouldShowImage ? `
            <div class="wellness-photo">
              <img src="${primarySrc}" alt="${chapterHeadingText}" class="wellness-photo-img" />
            </div>
          ` : ''}
          <div class="wellness-text">
            <div class="wellness-lead">${splitContent(section.content).lead}</div>
            ${splitContent(section.content).body ? `
              <div class="wellness-columns">${splitContent(section.content).body}</div>
            ` : ''}
          </div>
        </div>
        <div class="wellness-callout">
          <span>Key Benefits — ${bookTitle}</span>
        </div>
        <div class="wellness-thumbs">
          ${imageSlots.extras.slice(0, 3).map((slot, i) => `
            <div class="wellness-thumb">
              <img src="${getExportImageForCapture(slot.prompt, slot.seed)}" alt="Wellness ${i}" class="warm-gallery-img" />
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 10. NEWSPAPER
  else if (theme === 'newspaper') {
    pageBodyContent = `
      <div class="layout-newspaper">
        <div class="nyt-section-label">National</div>
        <div class="nyt-rule"></div>
        ${shouldShowChapterHeading ? `<h2 class="nyt-headline">${chapterHeadingText}</h2>` : ''}
        <p class="nyt-deck">Researchers explore how changing conditions reshape the story of ${bookTitle}.</p>
        <div class="nyt-infographic">
          ${[imageSlots.primary, ...imageSlots.extras.slice(0, 4)].map((slot, i) => {
            const circleColors = ['nyt-pastel-yellow', 'nyt-pastel-pink', 'nyt-pastel-blue', 'nyt-pastel-green'];
            return `
              <div class="nyt-bird-circle ${circleColors[i % 4]}">
                <img src="${getExportImageForCapture(slot.prompt, slot.seed)}" alt="Feature ${i}" class="nyt-bird-img" />
              </div>
            `;
          }).join('')}
        </div>
        <div class="nyt-columns">${section.content}</div>
        <div class="nyt-sidebar">
          <span class="nyt-sidebar-head">Related Coverage</span>
          <p class="nyt-sidebar-text">Sit-In Protest Closes Border Bridge — developing story on page ${pageNum}.</p>
        </div>
      </div>
    `;
  }

  // 11. BLOOD RED
  else if (theme === 'bloodred') {
    pageBodyContent = `
      <div class="layout-bloodred">
        ${shouldShowChapterHeading ? `
          <div class="bloodred-chapter-header">
            <div class="bloodred-chapter-badge-wrapper">
              ${shouldShowImage ? `
                <div class="bloodred-hero-container">
                  <img src="${primarySrc}" alt="${chapterHeadingText}" class="bloodred-hero-img" />
                  <div class="bloodred-hero-overlay">
                    <span class="bloodred-overlay-num">${chNum}</span>
                    <span class="bloodred-overlay-label">CHAPTER</span>
                  </div>
                </div>
              ` : `
                <div class="bloodred-chapter-badge">
                  <span class="bloodred-chapter-num">${chNum}</span>
                  <span class="bloodred-chapter-label">CHAPTER</span>
                </div>
              `}
            </div>
            <h2 class="bloodred-page-title">${chapterHeadingText}</h2>
          </div>
        ` : ''}
        <div class="bloodred-body-lead">${splitContent(section.content).lead}</div>
        ${splitContent(section.content).body ? `
          <div class="bloodred-body-cols">${splitContent(section.content).body}</div>
        ` : ''}
        <div class="bloodred-gallery">
          ${imageSlots.extras.slice(0, 3).map((slot, i) => `
            <div class="bloodred-gallery-item">
              <img src="${getExportImageForCapture(slot.prompt, slot.seed)}" alt="Gallery ${i}" class="bloodred-gallery-img" />
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 12. GENERIC: BOTANICAL / MODERN / NOIR
  else if (theme === 'botanical' || theme === 'modern' || theme === 'noir') {
    pageBodyContent = `
      <div class="layout-generic-theme">
        ${shouldShowImage ? `
          <div class="ebook-image-frame !mt-0 !mb-4 relative">
            <img src="${primarySrc}" alt="${chapterHeadingText}" class="generic-hero-img" />
          </div>
        ` : ''}
        ${shouldShowChapterHeading ? `<h2 class="ebook-h1">${chapterHeadingText}</h2>` : ''}
        <div class="ebook-columns">${section.content}</div>
        <div class="generic-thumb-row">
          ${imageSlots.extras.slice(0, 3).map((slot, i) => `
            <div class="generic-thumb">
              <img src="${getExportImageForCapture(slot.prompt, slot.seed)}" alt="Thumb ${i}" class="generic-thumb-img" />
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // 13. DEFAULT / BOHO / EDITORIAL
  else if (theme === 'editorial') {
    pageBodyContent = `
      <div class="layout-warm-boho">
        ${shouldShowImage ? `
          <div class="absolute top-8 left-8 flex flex-col gap-2 pointer-events-none select-none z-10 no-print">
            <div class="text-xs font-semibold px-2.5 py-1 uppercase tracking-wider bg-amber-100 border border-amber-200 text-amber-800 rounded-full -rotate-3">
              Boho Style
            </div>
            <div class="text-[10px] px-2 py-0.5 border border-amber-300 text-amber-900 rounded-full rotate-6 bg-white/40 backdrop-blur-sm self-start">
              Business Edition
            </div>
          </div>
        ` : ''}
        <span class="warm-watermark" aria-hidden="true">${pageNum}</span>
        <div class="warm-section-header">
          <span class="warm-vertical-label">${shouldShowChapterHeading ? 'Overview' : 'Contents'}</span>
          ${shouldShowChapterHeading ? `<h2 class="warm-title">${chapterHeadingText}</h2>` : ''}
        </div>
        <div class="warm-hero-row">
          ${shouldShowImage ? `
            <div class="warm-arch-frame">
              <img src="${primarySrc}" alt="${chapterHeadingText}" class="warm-arch-img" />
            </div>
          ` : ''}
          <div class="warm-intro-block">
            <div class="warm-lead">${splitContent(section.content).lead}</div>
          </div>
        </div>
        ${splitContent(section.content).body ? `
          <div class="warm-body-columns">${splitContent(section.content).body}</div>
        ` : ''}
        ${shouldShowImage ? `
          <div class="warm-gallery-row">
            ${imageSlots.extras.slice(0, 3).map((slot, i) => `
              <div class="warm-gallery-card warm-gallery-card-${i}">
                <img src="${getExportImageForCapture(slot.prompt, slot.seed)}" alt="Gallery ${i}" class="warm-gallery-img" />
              </div>
            `).join('')}
          </div>
        ` : ''}
        ${shouldShowImage ? `
          <div class="warm-cta-band">
            <div class="warm-cta-blob">
              <img src="${getExportImageForCapture(imageSlots.extras[3].prompt, imageSlots.extras[3].seed)}" alt="CTA" class="warm-cta-img" />
            </div>
            <div class="warm-cta-text">
              <span class="warm-cta-kicker">Call to Action</span>
              <span class="warm-cta-title">Discover more in ${bookTitle}</span>
            </div>
          </div>
        ` : ''}
        ${shouldShowImage ? `
          <div class="warm-footer-arch">
            <img src="${getExportImageForCapture(imageSlots.extras[4].prompt, imageSlots.extras[4].seed)}" alt="Footer" class="warm-footer-arch-img" />
          </div>
        ` : ''}
      </div>
    `;
  }

  // 14. DEFAULT SECTION-SPECIFIC LAYOUTS (split, magazine, standard textbook)
  else {
    if (section.layout === 'split') {
      pageBodyContent = `
        <div class="${shouldShowImage ? 'layout-split-grid h-full' : 'h-full'}">
          <div class="flex flex-col justify-center ${shouldShowImage ? 'pr-2' : ''}">
            ${shouldShowChapterHeading ? `<h2 class="ebook-h1">${chapterHeadingText}</h2>` : ''}
            <div class="ebook-columns">${section.content}</div>
          </div>
          ${shouldShowImage ? `
            <div class="ebook-image-frame h-full min-h-[300px] flex items-center relative">
              <img src="${primarySrc}" alt="${chapterHeadingText}" style="height: 100%; min-height: 300px;" />
            </div>
          ` : ''}
        </div>
      `;
    } else if (section.layout === 'magazine') {
      pageBodyContent = `
        <div>
          ${shouldShowImage ? `
            <div class="ebook-image-frame !mt-0 !mb-4 relative">
              <img src="${primarySrc}" alt="${chapterHeadingText}" style="height: 180px;" />
            </div>
          ` : ''}
          ${shouldShowChapterHeading ? `<h2 class="ebook-h1">${chapterHeadingText}</h2>` : ''}
          <div class="ebook-columns">${section.content}</div>
        </div>
      `;
    } else {
      pageBodyContent = `
        <div>
          ${shouldShowChapterHeading ? `<h2 class="ebook-h1">${chapterHeadingText}</h2>` : ''}
          <div class="ebook-p">${section.content}</div>
          ${shouldShowImage ? `
            <div class="ebook-image-frame relative">
              <img src="${primarySrc}" alt="${chapterHeadingText}" />
            </div>
          ` : ''}
        </div>
      `;
    }
  }

  return `
    <div class="ebook-page pdf-export-page">
      <div class="ebook-page-header">
        <span>${bookTitle}</span>
        <span class="font-semibold">${section.chapterTitle || `Page ${pageIndex}`}</span>
      </div>
      <div class="ebook-page-body">
        ${pageBodyContent}
      </div>
      <div class="ebook-page-footer">
        <span>Artistic E-Book Series</span>
        <span class="font-mono text-xs">${pageIndex} of ${totalPages}</span>
      </div>
    </div>
  `;
}
