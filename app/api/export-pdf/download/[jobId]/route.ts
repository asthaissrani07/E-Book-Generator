import { readFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import { getPdfExportQueue } from '@/lib/queue/pdfExportQueue';
import { getExportFilePath } from '@/lib/utils/serverPdfExport';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    const queue = getPdfExportQueue();
    const job = await queue.getJob(jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    const state = await job.getState();
    if (state !== 'completed') {
      return NextResponse.json({ error: 'PDF is not ready yet' }, { status: 409 });
    }

    const filePath = getExportFilePath(jobId);
    const pdf = await readFile(filePath);
    const filename = job.returnvalue?.filename || 'ebook.pdf';

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    console.error('[export-pdf/download] error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
