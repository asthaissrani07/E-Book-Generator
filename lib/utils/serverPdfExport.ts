import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import puppeteer, { type Page } from 'puppeteer';
import { buildExportRenderUrl } from '@/lib/utils/exportRenderAuth';
import { getPageDimensions } from '@/lib/utils/printPageDimensions';
import type { GeneratePrintHtmlOptions } from '@/lib/utils/generatePrintHtml';

export const EXPORTS_DIR = path.join(process.cwd(), 'exports');

const CHROME_NOT_FOUND_MSG =
  'Chrome not found for PDF export. Run: npm run install:chrome — then restart the worker.';

export function getExportFilePath(jobId: string): string {
  return path.join(EXPORTS_DIR, `${jobId}.pdf`);
}

function resolveChromeExecutable(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH && existsSync(process.env.PUPPETEER_EXECUTABLE_PATH)) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  try {
    const bundled = puppeteer.executablePath();
    if (bundled && existsSync(bundled)) return bundled;
  } catch {
    /* bundled Chrome not installed yet */
  }

  const localAppData = process.env.LOCALAPPDATA || '';
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  const candidates = [
    path.join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    path.join(programFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
  ];

  return candidates.find((p) => existsSync(p));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getExportTimeouts(pageCount: number) {
  const navTimeout = Math.max(900_000, pageCount * 20_000);
  const pdfTimeout = Math.max(1_200_000, pageCount * 12_000);
  return { navTimeout, pdfTimeout };
}

async function waitForExportRender(
  page: Page,
  pageCount: number,
  timeoutMs: number
): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const state = await page.evaluate(() => ({
      ready: document.body.getAttribute('data-export-ready') === 'true',
      pages: document.querySelectorAll('.ebook-page-wrapper').length,
      error: document.querySelector('[data-export-error="true"]')?.textContent?.trim() ?? null,
      status: document.querySelector('[data-export-loading="true"]')?.textContent?.trim() ?? null,
    }));

    if (state.error) {
      throw new Error(state.error);
    }

    if (state.ready && state.pages >= pageCount) {
      return;
    }

    await delay(2000);
  }

  const final = await page.evaluate(() => ({
    ready: document.body.getAttribute('data-export-ready') === 'true',
    pages: document.querySelectorAll('.ebook-page-wrapper').length,
    status: document.querySelector('[data-export-loading="true"]')?.textContent?.trim() ?? null,
  }));

  throw new Error(
    `Export render timed out after ${Math.round(timeoutMs / 1000)}s ` +
      `(pages ${final.pages}/${pageCount}, ready=${final.ready}). ` +
      `${final.status ? `Status: ${final.status}. ` : ''}` +
      `Stop the worker (Ctrl+C) and run "npm run worker" again to pick up the latest code.`
  );
}

async function waitForMostImages(page: Page, timeoutMs: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ratio = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('[data-print-export-root] img'));
      if (!imgs.length) return 1;
      const loaded = imgs.filter((img) => img.complete && img.naturalWidth > 0).length;
      return loaded / imgs.length;
    });
    if (ratio >= 0.9) return;
    await delay(1500);
  }
}

/** Puppeteer opens the same React preview page the editor uses, then saves a PDF. */
export async function renderPdfFromPreviewUrl(
  url: string,
  pageW: number,
  pageH: number,
  pageCount: number,
  onProgress?: (progress: number, message: string) => void | Promise<void>
): Promise<Buffer> {
  const executablePath = resolveChromeExecutable();
  if (!executablePath) {
    throw new Error(CHROME_NOT_FOUND_MSG);
  }

  const { navTimeout, pdfTimeout } = getExportTimeouts(pageCount);
  console.log(`[pdf-export] Timeouts for ${pageCount} pages: nav=${navTimeout}ms pdf=${pdfTimeout}ms`);

  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  });

  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(pdfTimeout);
    page.setDefaultNavigationTimeout(navTimeout);
    await page.setViewport({ width: pageW, height: pageH, deviceScaleFactor: 2 });

    await onProgress?.(15, 'Loading preview pages…');
    await page.goto(url, { waitUntil: 'load', timeout: navTimeout });

    await onProgress?.(35, 'Waiting for preview pages…');
    await waitForExportRender(page, pageCount, navTimeout);

    await onProgress?.(55, 'Waiting for images…');
    await waitForMostImages(page, Math.min(300_000, pageCount * 4_000));

    await page.evaluateHandle('document.fonts.ready');

    const renderedPages = await page.evaluate(
      () => document.querySelectorAll('.ebook-page-wrapper').length
    );
    if (renderedPages === 0) {
      throw new Error('No pages rendered for PDF export');
    }

    await onProgress?.(70, 'Rendering PDF…');
    await page.emulateMediaType('print');

    const pdf = await page.pdf({
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      timeout: pdfTimeout,
    });

    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function generateServerPdf(
  jobId: string,
  options: GeneratePrintHtmlOptions
): Promise<{ filePath: string; filename: string; pageCount: number }> {
  const pageCount = options.sections.length;
  const { w: pageW, h: pageH } = getPageDimensions(options.dimensions);
  const renderUrl = buildExportRenderUrl(jobId);

  await options.onProgress?.(5, 'Starting preview-accurate export…');
  const pdfBuffer = await renderPdfFromPreviewUrl(
    renderUrl,
    pageW,
    pageH,
    pageCount,
    options.onProgress
  );

  await mkdir(EXPORTS_DIR, { recursive: true });
  const safeTitle = (options.bookTitle || 'ebook').replace(/[^\w\-]+/g, '_').slice(0, 80);
  const filename = `${safeTitle}.pdf`;
  const filePath = getExportFilePath(jobId);

  await writeFile(filePath, pdfBuffer);
  await options.onProgress?.(100, 'PDF ready');

  return { filePath, filename, pageCount };
}
