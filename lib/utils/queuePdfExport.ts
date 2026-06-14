import type { EbookSection } from './pdfParser';
import type { ThemeId } from '../themes/types';
import type { PdfExportJobStatusResponse } from '../queue/pdfExportTypes';
import { LARGE_PDF_PAGE_THRESHOLD } from '../queue/pdfExportTypes';

export interface QueuePdfExportOptions {
  sections: EbookSection[];
  bookTitle: string;
  selectedTheme: ThemeId;
  customThemeStyles?: Record<string, string>;
  dimensions?: 'letter' | 'a4' | 'legal';
  onProgress?: (progress: number, status: string) => void;
  signal?: AbortSignal;
  pollIntervalMs?: number;
}

export function shouldUseQueueExport(pageCount: number): boolean {
  return pageCount > LARGE_PDF_PAGE_THRESHOLD;
}

export async function enqueueAndWaitForPdf(
  options: QueuePdfExportOptions
): Promise<PdfExportJobStatusResponse> {
  const {
    sections,
    bookTitle,
    selectedTheme,
    customThemeStyles,
    dimensions,
    onProgress,
    signal,
    pollIntervalMs = 2000,
  } = options;

  const enqueueRes = await fetch('/api/export-pdf/job', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sections,
      bookTitle,
      selectedTheme,
      customThemeStyles,
      dimensions,
    }),
    signal,
  });

  if (!enqueueRes.ok) {
    const err = await enqueueRes.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || `Failed to queue export (${enqueueRes.status})`);
  }

  const { jobId } = (await enqueueRes.json()) as { jobId: string };
  onProgress?.(0, 'queued');

  while (true) {
    if (signal?.aborted) {
      throw new Error('Export cancelled.');
    }

    const res = await fetch(`/api/export-pdf/job/${jobId}`, { signal });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || `Status check failed (${res.status})`);
    }

    const status = (await res.json()) as PdfExportJobStatusResponse;
    onProgress?.(status.progress, status.status);

    if (status.status === 'failed') {
      throw new Error(status.error || 'PDF export failed');
    }

    if (status.status === 'completed') {
      return status;
    }

    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }
}

export function triggerPdfDownload(downloadUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
}
