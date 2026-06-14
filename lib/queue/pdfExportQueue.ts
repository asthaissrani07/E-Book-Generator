import { Queue } from 'bullmq';
import { getRedisConnectionOptions } from './connection';
import { PDF_EXPORT_QUEUE_NAME, type PdfExportJobData } from './pdfExportTypes';

let queue: Queue<PdfExportJobData> | null = null;

export function getPdfExportQueue(): Queue<PdfExportJobData> {
  if (!queue) {
    queue = new Queue<PdfExportJobData>(PDF_EXPORT_QUEUE_NAME, {
      connection: getRedisConnectionOptions(),
      defaultJobOptions: {
        removeOnComplete: { age: 3600, count: 50 },
        removeOnFail: { age: 86400, count: 20 },
        attempts: 2,
        backoff: { type: 'exponential', delay: 5000 },
      },
    });
  }
  return queue;
}
