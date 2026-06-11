import { generateCoverTemplate } from '@/lib/templates/cover';
import { generateChapterTemplate } from '@/lib/templates/chapter';
import { generateBodyTemplate } from '@/lib/templates/body';
import { getThemePageInlineStyle } from '@/lib/templates/themeInlineStyles';
import type { ThemeId } from '../themes/types';
import type { ProcessedPage } from './processSectionsForPrint';

const PAGE_WRAP_STYLE =
  'width: 794px; height: 1123px; page-break-after: always; page-break-inside: avoid; overflow: hidden; position: relative; box-sizing: border-box;';

function wrapPrintPage(innerHtml: string, theme: ThemeId): string {
  const themeInline = getThemePageInlineStyle(theme);
  return `<div style="${PAGE_WRAP_STYLE} ${themeInline}">${innerHtml}</div>`;
}

/** Build full inline HTML for every processed page (cover, chapter, body). */
export function buildAllPrintPagesHtml(
  processedPages: ProcessedPage[],
  theme: ThemeId,
  bookTitle: string,
  coverImageSrc?: string
): string {
  const totalPages = processedPages.length;

  return processedPages
    .map((page, idx) => {
      const pageIndex = idx + 1;

      if (page.type === 'cover') {
        return wrapPrintPage(
          generateCoverTemplate(page.section, theme, coverImageSrc),
          theme
        );
      }

      if (page.type === 'chapter') {
        return wrapPrintPage(
          generateChapterTemplate(page.section, theme, pageIndex, totalPages),
          theme
        );
      }

      return wrapPrintPage(
        generateBodyTemplate(
          page.section,
          theme,
          pageIndex,
          totalPages,
          page.content || '',
          bookTitle
        ),
        theme
      );
    })
    .join('\n');
}
