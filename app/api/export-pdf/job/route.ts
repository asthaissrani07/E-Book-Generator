import { NextResponse } from 'next/server';
import { isRedisAvailable } from '@/lib/queue/connection';
import { getPdfExportQueue } from '@/lib/queue/pdfExportQueue';
import type { PdfExportJobData } from '@/lib/queue/pdfExportTypes';
import type { ThemeId } from '@/lib/themes/types';
import type { EbookSection } from '@/lib/utils/pdfParser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const redisOk = await isRedisAvailable();
    if (!redisOk) {
      return NextResponse.json(
        {
          error:
            'Redis is not running. Start Redis and run `npm run worker` to export large PDFs.',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { sections, selectedTheme, bookTitle, customThemeStyles, dimensions } = body;

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return NextResponse.json({ error: 'sections array is required' }, { status: 400 });
    }

    const jobData: PdfExportJobData = {
      sections: sections as EbookSection[],
      bookTitle: bookTitle || 'My E-Book',
      selectedTheme: (selectedTheme || 'editorial') as ThemeId,
      customThemeStyles,
      dimensions: dimensions || 'a4',
    };

    const queue = getPdfExportQueue();
    const job = await queue.add('export', jobData);

    return NextResponse.json({
      jobId: job.id,
      status: 'queued',
      progress: 0,
    });
  } catch (error: unknown) {
    console.error('[export-pdf/job] enqueue error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
