import type { EbookSection } from '@/lib/utils/pdfParser';
import type { ThemeId } from '@/lib/themes/types';

export const PDF_EXPORT_QUEUE_NAME = 'pdf-export';

/** Books with more pages than this use the BullMQ server export. */
export const LARGE_PDF_PAGE_THRESHOLD = 30;

export interface PdfExportJobData {
  sections: EbookSection[];
  bookTitle: string;
  selectedTheme: ThemeId;
  customThemeStyles?: Record<string, string>;
  dimensions?: 'letter' | 'a4' | 'legal';
}

export interface PdfExportJobResult {
  filename: string;
  pageCount: number;
}

export type PdfExportJobStatus =
  | 'queued'
  | 'active'
  | 'completed'
  | 'failed'
  | 'unknown';

export interface PdfExportJobStatusResponse {
  jobId: string;
  status: PdfExportJobStatus;
  progress: number;
  error?: string;
  downloadUrl?: string;
  filename?: string;
  pageCount?: number;
}
