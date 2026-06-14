import { NextResponse } from 'next/server';
import { getPdfExportQueue } from '@/lib/queue/pdfExportQueue';
import type { PdfExportJobStatus, PdfExportJobStatusResponse } from '@/lib/queue/pdfExportTypes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function mapState(state: string): PdfExportJobStatus {
  if (state === 'waiting' || state === 'delayed' || state === 'prioritized') return 'queued';
  if (state === 'active') return 'active';
  if (state === 'completed') return 'completed';
  if (state === 'failed') return 'failed';
  return 'unknown';
}

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
    const status = mapState(state);
    const progress = typeof job.progress === 'number' ? job.progress : 0;

    const response: PdfExportJobStatusResponse = {
      jobId,
      status,
      progress,
    };

    if (status === 'failed') {
      response.error = job.failedReason || 'Export failed';
    }

    if (status === 'completed') {
      const result = job.returnvalue;
      response.downloadUrl = `/api/export-pdf/download/${jobId}`;
      response.filename = result?.filename || 'ebook.pdf';
      response.pageCount = result?.pageCount;
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('[export-pdf/job] status error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
