import { readFileSync } from 'fs';
import path from 'path';
import { processSectionsForPrint } from '@/lib/utils/processSectionsForPrint';
import { buildAllPrintPagesHtml } from '@/lib/utils/buildPrintPagesHtml';
import { getThemePageInlineStyle } from '@/lib/templates/themeInlineStyles';
import {
  buildImageBase64Map,
  collectImageUrls,
  resolveImageSrc,
} from '@/lib/utils/exportImageUtils';
import {
  extractImageUrlsFromHtml,
  makePageContentPrintSafe,
  PRINT_SAFE_HEAD_STYLES,
} from '@/lib/utils/printSafeHtml';
import type { ThemeId } from '@/lib/themes/types';
import type { EbookSection } from '@/lib/utils/pdfParser';
import type { ProcessedPage } from '@/lib/utils/processSectionsForPrint';

export interface GeneratePrintHtmlOptions {
  sections: EbookSection[];
  selectedTheme: ThemeId;
  bookTitle: string;
  customThemeStyles?: Record<string, string>;
  dimensions?: 'letter' | 'a4' | 'legal';
  onProgress?: (progress: number, message: string) => void | Promise<void>;
}

function getPageDimensions(dimensions: 'letter' | 'a4' | 'legal' = 'a4') {
  if (dimensions === 'letter') return { w: 612, h: 792 };
  if (dimensions === 'legal') return { w: 612, h: 1008 };
  return { w: 794, h: 1123 };
}

/** Map editor pages (one section per page) to print template pages. */
export function editorSectionsToProcessedPages(sections: EbookSection[]): ProcessedPage[] {
  return sections.map((section): ProcessedPage => ({
    type: section.layout === 'cover' ? 'cover' : 'body',
    section,
    content: section.content,
  }));
}

function loadThemeStyles(): string {
  try {
    const themesPath = path.join(process.cwd(), 'lib', 'themes', 'themes.css');
    const globalsPath = path.join(process.cwd(), 'app', 'globals.css');
    const themes = readFileSync(themesPath, 'utf8');
    const globals = readFileSync(globalsPath, 'utf8');
    return `${themes}\n${globals}`;
  } catch {
    return '';
  }
}

export async function generatePrintHtml(options: GeneratePrintHtmlOptions): Promise<{
  html: string;
  pageCount: number;
  pageW: number;
  pageH: number;
}> {
  const {
    sections,
    selectedTheme,
    bookTitle,
    customThemeStyles,
    dimensions = 'a4',
    onProgress,
  } = options;

  const theme = selectedTheme || 'editorial';
  const typedSections = sections as EbookSection[];
  const { w: pageW, h: pageH } = getPageDimensions(dimensions);

  await onProgress?.(5, 'Collecting images…');
  let imageMap = await buildImageBase64Map(collectImageUrls(typedSections));

  const coverSection = typedSections.find((s, i) => i === 0 || s.layout === 'cover');
  let coverImageSrc = coverSection?.imageUrl
    ? resolveImageSrc(coverSection.imageUrl, imageMap)
    : undefined;

  await onProgress?.(20, 'Building pages…');
  const processedPages = editorSectionsToProcessedPages(typedSections);

  const rawPagesHtml = buildAllPrintPagesHtml(
    processedPages,
    theme,
    bookTitle || 'My E-Book',
    coverImageSrc
  );

  await onProgress?.(40, 'Inlining images…');
  const extraUrls = extractImageUrlsFromHtml(rawPagesHtml).filter(
    (u) => !u.startsWith('data:') && (!imageMap.has(u) || !imageMap.get(u)?.startsWith('data:'))
  );
  if (extraUrls.length > 0) {
    const extraMap = await buildImageBase64Map(extraUrls);
    imageMap = new Map([...imageMap, ...extraMap]);
  }

  const pagesHtml = makePageContentPrintSafe(rawPagesHtml, imageMap);
  const themeStyles = loadThemeStyles();

  const bodyInlineStyle = customThemeStyles
    ? Object.entries(customThemeStyles)
        .map(([k, v]) => `${k}:${v}`)
        .join(';')
    : '';

  const themeInline = getThemePageInlineStyle(theme);
  const bodyStyle = `margin: 0; padding: 0; width: 100%; ${themeInline}${bodyInlineStyle ? `; ${bodyInlineStyle}` : ''}`;

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${bookTitle || 'ebook'}_ebook</title>
    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lora:ital,wght@0,400;1,400&family=Inter:wght@400;500&family=Montserrat:wght@400;600&family=Cormorant+Garamond:wght@400;600&display=swap" rel="stylesheet">
    <style>${PRINT_SAFE_HEAD_STYLES}</style>
    <style>${themeStyles}</style>
    <style>
      .ebook-page-wrapper { page-break-after: always !important; break-after: page !important; }
      .ebook-page, .pdf-export-page { width: ${pageW}px !important; min-height: ${pageH}px !important; height: ${pageH}px !important; box-shadow: none !important; }
    </style>
  </head>
  <body class="theme-${theme}" style="${bodyStyle}">
    <div style="width:${pageW}px; margin: 0 auto;">
      ${pagesHtml}
    </div>
  </body>
</html>`;

  await onProgress?.(60, 'HTML ready');

  return { html, pageCount: processedPages.length, pageW, pageH };
}
