import '../lib/utils/bootstrapEnv';

import { Worker } from 'bullmq';
import { getRedisConnectionOptions } from '../lib/queue/connection';
import {
  PDF_EXPORT_QUEUE_NAME,
  type PdfExportJobData,
  type PdfExportJobResult,
} from '../lib/queue/pdfExportTypes';
import { generateServerPdf } from '../lib/utils/serverPdfExport';
import { getAppBaseUrl } from '../lib/utils/exportRenderAuth';

const worker = new Worker<PdfExportJobData, PdfExportJobResult>(
  PDF_EXPORT_QUEUE_NAME,
  async (job) => {
    const { sections, bookTitle, selectedTheme, customThemeStyles, dimensions } = job.data;

    const result = await generateServerPdf(job.id!, {
      sections,
      bookTitle,
      selectedTheme,
      customThemeStyles,
      dimensions,
      onProgress: async (progress, message) => {
        await job.updateProgress(progress);
        console.log(`[pdf-worker] ${job.id} ${progress}% — ${message}`);
      },
    });

    return {
      filename: result.filename,
      pageCount: result.pageCount,
    };
  },
  {
    connection: getRedisConnectionOptions(),
    concurrency: 1,
    lockDuration: 3_600_000,
  }
);

worker.on('completed', (job) => {
  console.log(`[pdf-worker] Job ${job.id} completed (${job.returnvalue?.pageCount} pages)`);
});

worker.on('failed', (job, err) => {
  console.error(`[pdf-worker] Job ${job?.id} failed:`, err.message);
});

console.log('[pdf-worker] Preview-accurate export worker started (long timeouts enabled)');
console.log(`[pdf-worker] App URL: ${getAppBaseUrl()}`);
console.log('[pdf-worker] Listening for PDF export jobs…');
