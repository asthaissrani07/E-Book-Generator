import type { PdfExportJobData } from '@/lib/queue/pdfExportTypes';
import { generateServerPdf } from '@/lib/utils/serverPdfExport';
import { getAppBaseUrl } from '@/lib/utils/exportRenderAuth';
import { blogEventToFormattedPages } from './blogEventToSections';
import { publishBlogPdfCompleted, publishBlogPdfFailed } from './producer';
import { deleteRenderJob, saveRenderJob } from './renderJobStore';
import type { BlogPdfGenerateEvent } from './types';
import { resolveBlogTheme } from './types';

export async function handleBlogPdfEvent(event: BlogPdfGenerateEvent): Promise<void> {
  const jobId = event.eventId;
  const theme = resolveBlogTheme(event.theme);
  const dimensions = event.dimensions || 'a4';
  const bookTitle = event.title.trim() || 'Blog Post';

  console.log(`[kafka-blog] Processing blog ${event.blogId} (event ${jobId})`);

  const sections = blogEventToFormattedPages(event, theme);
  if (sections.length === 0) {
    throw new Error('No pages generated from blog content');
  }

  const jobData: PdfExportJobData = {
    sections,
    bookTitle,
    selectedTheme: theme,
    dimensions,
  };

  await saveRenderJob(jobId, jobData);

  try {
    const result = await generateServerPdf(jobId, {
      ...jobData,
      onProgress: async (progress, message) => {
        console.log(`[kafka-blog] ${jobId} ${progress}% — ${message}`);
      },
    });

    const baseUrl = getAppBaseUrl().replace(/\/$/, '');
    const downloadUrl = `${baseUrl}/api/blog-pdf/download/${jobId}`;

    await publishBlogPdfCompleted({
      eventType: 'blog.pdf.completed',
      eventId: jobId,
      blogId: event.blogId,
      filename: result.filename,
      pageCount: result.pageCount,
      downloadUrl,
      completedAt: new Date().toISOString(),
    });

    console.log(`[kafka-blog] Completed ${jobId} → ${downloadUrl}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    await publishBlogPdfFailed({
      eventType: 'blog.pdf.failed',
      eventId: jobId,
      blogId: event.blogId,
      error: message,
      failedAt: new Date().toISOString(),
    });

    throw err;
  } finally {
    await deleteRenderJob(jobId).catch(() => {});
  }
}
