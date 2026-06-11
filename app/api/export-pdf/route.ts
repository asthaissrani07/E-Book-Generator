import { NextResponse } from 'next/server';
import { processSectionsForPrint } from '@/lib/utils/processSectionsForPrint';
import { buildAllPrintPagesHtml } from '@/lib/utils/buildPrintPagesHtml';
import { getThemePageInlineStyle } from '@/lib/templates/themeInlineStyles';
import {
  buildImageBase64Map,
  collectCoverImageUrls,
  resolveImageSrc,
} from '@/lib/utils/exportImageUtils';
import {
  extractImageUrlsFromHtml,
  makePageContentPrintSafe,
  PRINT_SAFE_HEAD_STYLES,
} from '@/lib/utils/printSafeHtml';
import type { ThemeId } from '@/lib/themes/types';
import type { EbookSection } from '@/lib/utils/pdfParser';

export async function POST(request: Request) {
  console.log('[export-pdf] Request received');
  try {
    const { sections, selectedTheme, bookTitle, customThemeStyles, coverImageBase64 } =
      await request.json();

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: 'sections array is required' }, { status: 400 });
    }

    const theme = (selectedTheme || 'editorial') as ThemeId;
    const typedSections = sections as EbookSection[];

    let imageMap = await buildImageBase64Map(collectCoverImageUrls(typedSections));

    const coverSection = typedSections.find((s, i) => i === 0 || s.layout === 'cover');
    let coverImageSrc = coverImageBase64 as string | undefined;
    if (!coverImageSrc && coverSection?.imageUrl) {
      coverImageSrc = resolveImageSrc(coverSection.imageUrl, imageMap);
    }
    if (coverImageSrc?.startsWith('data:') && coverSection?.imageUrl) {
      imageMap.set(coverSection.imageUrl, coverImageSrc);
    }

    const processedPages = processSectionsForPrint(typedSections);
    console.log(`[export-pdf] Processing ${processedPages.length} pages for theme "${theme}"`);

    const rawPagesHtml = buildAllPrintPagesHtml(
      processedPages,
      theme,
      bookTitle || 'My E-Book',
      coverImageSrc
    );

    const extraUrls = extractImageUrlsFromHtml(rawPagesHtml).filter(
      (u) => !u.startsWith('data:') && (!imageMap.has(u) || !imageMap.get(u)?.startsWith('data:'))
    );
    if (extraUrls.length > 0) {
      const extraMap = await buildImageBase64Map(extraUrls.slice(0, 5));
      imageMap = new Map([...imageMap, ...extraMap]);
    }

    const pagesHtml = makePageContentPrintSafe(rawPagesHtml, imageMap);

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
    <style>${PRINT_SAFE_HEAD_STYLES}</style>
  </head>
  <body style="${bodyStyle}">
    <div style="width: 794px; margin: 0 auto; display: block;">
      ${pagesHtml}
    </div>
  </body>
</html>`;

    console.log(`[export-pdf] Success: ${processedPages.length} pages, HTML length ${html.length}`);

    return NextResponse.json({ html });
  } catch (error: unknown) {
    console.error('Export PDF error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
