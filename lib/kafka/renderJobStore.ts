import { existsSync } from 'fs';
import { mkdir, readFile, unlink, writeFile } from 'fs/promises';
import path from 'path';
import type { PdfExportJobData } from '@/lib/queue/pdfExportTypes';

const RENDER_JOBS_DIR = path.join(process.cwd(), 'exports', 'render-jobs');

export async function saveRenderJob(jobId: string, data: PdfExportJobData): Promise<void> {
  await mkdir(RENDER_JOBS_DIR, { recursive: true });
  const filePath = path.join(RENDER_JOBS_DIR, `${jobId}.json`);
  await writeFile(filePath, JSON.stringify(data), 'utf8');
}

export async function getRenderJob(jobId: string): Promise<PdfExportJobData | null> {
  const filePath = path.join(RENDER_JOBS_DIR, `${jobId}.json`);
  if (!existsSync(filePath)) return null;
  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw) as PdfExportJobData;
}

export async function deleteRenderJob(jobId: string): Promise<void> {
  const filePath = path.join(RENDER_JOBS_DIR, `${jobId}.json`);
  if (!existsSync(filePath)) return;
  await unlink(filePath);
}
