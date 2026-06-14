import { NextResponse } from 'next/server';
import { generatePrintHtml } from '@/lib/utils/generatePrintHtml';
import type { ThemeId } from '@/lib/themes/types';
import type { EbookSection } from '@/lib/utils/pdfParser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  console.log('[export-pdf] Request received');
  try {
    const { sections, selectedTheme, bookTitle, customThemeStyles, dimensions } =
      await request.json();

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json({ error: 'sections array is required' }, { status: 400 });
    }

    const { html, pageCount } = await generatePrintHtml({
      sections: sections as EbookSection[],
      selectedTheme: (selectedTheme || 'editorial') as ThemeId,
      bookTitle: bookTitle || 'My E-Book',
      customThemeStyles,
      dimensions: dimensions || 'a4',
    });

    console.log(`[export-pdf] Success: ${pageCount} pages, HTML length ${html.length}`);

    return NextResponse.json({ html });
  } catch (error: unknown) {
    console.error('Export PDF error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
