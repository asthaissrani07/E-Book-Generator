import type { EbookSection } from '../utils/pdfParser';
import type { ThemeId } from '../themes/types';

export function generateBodyTemplate(
  section: EbookSection,
  theme: ThemeId,
  pageNum: number,
  totalPages: number,
  content: string,
  bookTitle?: string
): string {
  const displayBookTitle = bookTitle || 'My E-Book'; // Fallback if not custom
  const chapterTitle = section.chapterTitle || section.title || '';

  // Parse paragraphs and wrap in styled <p> tags
  const paragraphsHtml = content
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p style="margin: 0 0 10px 0; line-height: 1.6; font-size: 13px; text-align: justify; text-justify: inter-word;">${p}</p>`)
    .join('');

  let themeStyles = '';
  let headerStyles = '';
  let footerStyles = '';
  let bodyFontStyles = '';
  let headingColor = '';

  if (theme === 'editorial') {
    // Warm Boho
    themeStyles = 'background-color: #FAF6F0; color: #4E342E;';
    headerStyles = 'border-bottom: 1px solid rgba(139, 69, 19, 0.15); color: #8D6E63; font-family: "Playfair Display", Georgia, serif;';
    footerStyles = 'color: #8D6E63; font-family: monospace;';
    bodyFontStyles = 'font-family: "Lora", Georgia, serif; font-size: 13px; line-height: 1.6;';
    headingColor = '#8B4513';
  } else if (theme === 'lavender') {
    // Lavender
    themeStyles = 'background-color: #F5F3FA; color: #3D3A4A;';
    headerStyles = 'border-bottom: 1px solid rgba(107, 91, 158, 0.15); color: #9C8EB9; font-family: "Lora", Georgia, serif;';
    footerStyles = 'color: #9C8EB9; font-family: monospace;';
    bodyFontStyles = 'font-family: "Lora", Georgia, serif; font-size: 13px; line-height: 1.6;';
    headingColor = '#6B5B9E';
  } else if (theme === 'noir') {
    // Dark Noir
    themeStyles = 'background-color: #0a0a0a; color: #f3f4f6;';
    headerStyles = 'border-bottom: 1px solid rgba(255, 255, 255, 0.08); color: #9ca3af; font-family: "Montserrat", sans-serif;';
    footerStyles = 'color: #9ca3af; font-family: monospace;';
    bodyFontStyles = 'font-family: "Inter", sans-serif; font-size: 13px; line-height: 1.6;';
    headingColor = '#ffffff';
  } else if (theme === 'rose') {
    // Rose
    themeStyles = 'background-color: #FDF0F5; color: #4A353B;';
    headerStyles = 'border-bottom: 1px solid rgba(139, 58, 90, 0.15); color: #B38F9D; font-family: "Playfair Display", Georgia, serif;';
    footerStyles = 'color: #B38F9D; font-family: monospace;';
    bodyFontStyles = 'font-family: "Lora", Georgia, serif; font-size: 13px; line-height: 1.6;';
    headingColor = '#8B3A5A';
  } else if (theme === 'wanderlust') {
    // Wanderlust
    themeStyles = 'background-color: #ffffff; color: #2D3748;';
    headerStyles = 'border-bottom: 1px solid #E2E8F0; color: #718096; font-family: "Montserrat", sans-serif;';
    footerStyles = 'color: #718096; font-family: "Montserrat", sans-serif;';
    bodyFontStyles = 'font-family: "Inter", sans-serif; font-size: 13px; line-height: 1.6;';
    headingColor = '#2A9D8F';
  } else {
    // Fallback Boho
    themeStyles = 'background-color: #FAF6F0; color: #4E342E;';
    headerStyles = 'border-bottom: 1px solid rgba(139, 69, 19, 0.15); color: #8D6E63;';
    footerStyles = 'color: #8D6E63;';
    bodyFontStyles = 'font-family: "Lora", Georgia, serif; font-size: 13px; line-height: 1.6;';
    headingColor = '#8B4513';
  }

  return `
    <div style="width: 794px; height: 1123px; overflow: hidden; position: relative; box-sizing: border-box; padding: 60px 50px; display: flex; flex-direction: column; justify-content: space-between; ${themeStyles}">
      <!-- Header Zone (60px height container) -->
      <div style="position: absolute; top: 50px; left: 50px; right: 50px; height: 32px; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; padding-bottom: 4px; box-sizing: border-box; ${headerStyles}">
        <span style="font-weight: 500;">${displayBookTitle}</span>
        <span style="font-weight: 600; color: ${headingColor};">${chapterTitle}</span>
      </div>

      <div style="flex-grow: 1; margin-top: 48px; margin-bottom: 36px; box-sizing: border-box; overflow: hidden; text-rendering: optimizeLegibility; -webkit-font-smoothing: antialiased; ${bodyFontStyles}">
        ${paragraphsHtml}
      </div>

      <!-- Footer Zone (80px height container) -->
      <div style="position: absolute; bottom: 50px; left: 50px; right: 50px; height: 24px; display: flex; justify-content: center; align-items: center; font-size: 11px; ${footerStyles}">
        <span>${pageNum} of ${totalPages}</span>
      </div>
    </div>
  `;
}
