import type { EbookSection } from '../utils/pdfParser';
import type { ThemeId } from '../themes/types';

export function generateChapterTemplate(
  section: EbookSection,
  theme: ThemeId,
  pageNum: number,
  totalPages: number
): string {
  const title = section.title || 'New Chapter';
  
  // Parse title to extract "Chapter 1" label and clean title
  const match = title.match(/^(chapter|part|sec|section)\s+([\dIVXLC]+|[0-9]+)[:.-]?\s*(.*)$/i);
  let chapterLabel = '';
  let displayTitle = title;
  
  if (match) {
    chapterLabel = `${match[1].toUpperCase()} ${match[2]}`;
    displayTitle = match[3].trim() || title;
  } else {
    chapterLabel = 'CHAPTER';
    displayTitle = title;
  }

  let themeStyles = '';
  let contentHtml = '';

  if (theme === 'editorial') {
    // Warm Boho
    themeStyles = `
      background-color: #FAF6F0;
      color: #5D4037;
      font-family: 'Playfair Display', Georgia, serif;
    `;
    contentHtml = `
      <!-- Header -->
      <div style="position: absolute; top: 40px; left: 60px; right: 60px; display: flex; justify-content: space-between; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #8D6E63; border-bottom: 1px solid rgba(141, 110, 99, 0.15); padding-bottom: 8px;">
        <span>${section.chapterTitle || 'Boho Business'}</span>
        <span>Overview</span>
      </div>

      <!-- Main Contents -->
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 80px 60px; text-align: center;">
        <span style="font-size: 13px; font-weight: 600; letter-spacing: 4px; color: #8B4513; text-transform: uppercase; margin-bottom: 24px;">
          ${chapterLabel}
        </span>
        <h2 style="font-size: 38px; font-weight: 700; color: #8B4513; margin: 0 0 30px; font-family: 'Playfair Display', serif; line-height: 1.25;">
          ${displayTitle}
        </h2>
        <!-- Decorative Arch SVG Line -->
        <svg width="60" height="30" viewBox="0 0 60 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.8;">
          <path d="M10,30 C10,10 50,10 50,30" stroke="#8B4513" stroke-width="1.5" />
          <circle cx="30" cy="12" r="3" fill="#8B4513" />
        </svg>
      </div>

      <!-- Footer -->
      <div style="position: absolute; bottom: 40px; left: 60px; right: 60px; display: flex; justify-content: center; font-size: 11px; font-family: monospace; color: #8D6E63;">
        ${pageNum} of ${totalPages}
      </div>
    `;
  } else if (theme === 'lavender') {
    // Lavender
    themeStyles = `
      background-color: #F5F3FA;
      color: #4A475A;
      font-family: 'Lora', Georgia, serif;
    `;
    contentHtml = `
      <!-- Header -->
      <div style="position: absolute; top: 40px; left: 60px; right: 60px; display: flex; justify-content: space-between; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #9C8EB9; border-bottom: 1px solid rgba(107, 91, 158, 0.15); padding-bottom: 8px;">
        <span>Lavender Method</span>
        <span>${chapterLabel}</span>
      </div>

      <!-- Main Contents -->
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 80px 60px; text-align: center;">
        <div style="width: 80px; height: 80px; border-radius: 50%; border: 1px dashed #6B5B9E; display: flex; align-items: center; justify-content: center; margin-bottom: 30px;">
          <span style="font-size: 18px; font-weight: 600; color: #6B5B9E; font-family: 'Lora', serif;">
            ${match ? match[2] : pageNum}
          </span>
        </div>
        <h2 style="font-size: 34px; font-weight: 600; color: #6B5B9E; margin: 0 0 20px; line-height: 1.3;">
          ${displayTitle}
        </h2>
        <div style="width: 60px; height: 1px; background-color: #6B5B9E; opacity: 0.4; margin-top: 10px;"></div>
      </div>

      <!-- Footer -->
      <div style="position: absolute; bottom: 40px; left: 60px; right: 60px; display: flex; justify-content: center; font-size: 11px; font-family: monospace; color: #9C8EB9;">
        ${pageNum} of ${totalPages}
      </div>
    `;
  } else if (theme === 'noir') {
    // Dark Noir
    themeStyles = `
      background-color: #0a0a0a;
      color: #f3f4f6;
      font-family: 'Montserrat', sans-serif;
    `;
    contentHtml = `
      <!-- Header -->
      <div style="position: absolute; top: 40px; left: 80px; right: 80px; display: flex; justify-content: space-between; font-size: 9px; font-weight: 500; text-transform: uppercase; letter-spacing: 3px; color: #6b7280; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 8px;">
        <span>Noir Series</span>
        <span>${chapterLabel}</span>
      </div>

      <!-- Main Contents -->
      <div style="display: flex; flex-direction: column; align-items: flex-start; justify-content: center; height: 100%; padding: 80px; text-align: left;">
        <span style="font-size: 16px; font-weight: 600; letter-spacing: 6px; color: #9ca3af; text-transform: uppercase; margin-bottom: 20px;">
          ${chapterLabel}
        </span>
        <h2 style="font-size: 46px; font-weight: 700; color: #ffffff; margin: 0 0 35px; line-height: 1.15; text-transform: uppercase; letter-spacing: -0.5px;">
          ${displayTitle}
        </h2>
        <div style="width: 100px; height: 3px; background-color: #ffffff;"></div>
      </div>

      <!-- Footer -->
      <div style="position: absolute; bottom: 40px; left: 80px; right: 80px; display: flex; justify-content: center; font-size: 11px; font-family: monospace; color: #6b7280;">
        ${pageNum} of ${totalPages}
      </div>
    `;
  } else if (theme === 'rose') {
    // Rose
    themeStyles = `
      background-color: #FDF0F5;
      color: #5A4A4F;
      font-family: 'Playfair Display', Georgia, serif;
    `;
    contentHtml = `
      <!-- Header -->
      <div style="position: absolute; top: 40px; left: 60px; right: 60px; display: flex; justify-content: space-between; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #B38F9D; border-bottom: 1px solid rgba(139, 58, 90, 0.15); padding-bottom: 8px;">
        <span>Rose Journal</span>
        <span>Chapter Opener</span>
      </div>

      <!-- Main Contents -->
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 80px 60px; text-align: center;">
        <div style="font-size: 20px; color: #8B3A5A; margin-bottom: 24px; font-style: italic;">✿</div>
        <span style="font-size: 12px; font-weight: 500; letter-spacing: 3px; color: #8B3A5A; text-transform: uppercase; margin-bottom: 16px;">
          ${chapterLabel}
        </span>
        <h2 style="font-size: 36px; font-weight: 600; color: #8B3A5A; margin: 0 0 20px; line-height: 1.3;">
          ${displayTitle}
        </h2>
        <div style="font-size: 20px; color: #8B3A5A; margin-top: 15px; font-style: italic;">✿</div>
      </div>

      <!-- Footer -->
      <div style="position: absolute; bottom: 40px; left: 60px; right: 60px; display: flex; justify-content: center; font-size: 11px; font-family: monospace; color: #B38F9D;">
        ${pageNum} of ${totalPages}
      </div>
    `;
  } else if (theme === 'wanderlust') {
    // Wanderlust
    themeStyles = `
      background-color: #ffffff;
      color: #2D3748;
      font-family: 'Inter', sans-serif;
    `;
    contentHtml = `
      <!-- Header -->
      <div style="position: absolute; top: 40px; left: 60px; right: 60px; display: flex; justify-content: space-between; font-size: 10px; text-transform: uppercase; letter-spacing: 3px; color: #718096; border-bottom: 1px solid #E2E8F0; padding-bottom: 8px; font-family: 'Montserrat', sans-serif;">
        <span>Travel Guide</span>
        <span>${chapterLabel}</span>
      </div>

      <!-- Main Contents -->
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 80px 60px; text-align: center; border-left: 6px solid #2A9D8F; border-right: 6px solid #2A9D8F; margin: 0 40px;">
        <span style="font-size: 13px; font-weight: 600; letter-spacing: 5px; color: #2A9D8F; text-transform: uppercase; margin-bottom: 20px; font-family: 'Montserrat', sans-serif;">
          ${chapterLabel}
        </span>
        <h2 style="font-size: 38px; font-weight: 800; color: #2D3748; margin: 0; line-height: 1.2; font-family: 'Montserrat', sans-serif;">
          ${displayTitle}
        </h2>
        <div style="width: 40px; height: 4px; background-color: #2A9D8F; margin-top: 30px;"></div>
      </div>

      <!-- Footer -->
      <div style="position: absolute; bottom: 40px; left: 60px; right: 60px; display: flex; justify-content: center; font-size: 11px; font-family: monospace; color: #718096; font-family: 'Montserrat', sans-serif;">
        ${pageNum} of ${totalPages}
      </div>
    `;
  } else {
    // Fallback Boho
    themeStyles = `
      background-color: #FAF6F0;
      color: #5D4037;
      font-family: 'Playfair Display', Georgia, serif;
    `;
    contentHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 60px; text-align: center;">
        <span style="font-size: 14px; text-transform: uppercase; margin-bottom: 10px;">${chapterLabel}</span>
        <h2 style="font-size: 34px; color: #8B4513;">${displayTitle}</h2>
      </div>
    `;
  }

  return `
    <div style="width: 794px; height: 1123px; overflow: hidden; position: relative; box-sizing: border-box; ${themeStyles}">
      ${contentHtml}
    </div>
  `;
}
