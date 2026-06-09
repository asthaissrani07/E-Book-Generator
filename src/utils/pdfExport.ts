import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { EbookSection } from './pdfParser';
import type { ThemeId } from '../themes/types';
import {
  cacheExportImageDataUrl,
  clearExportImageCache,
  getExportSafeImageUrl,
  getPlaceholderImageUrl,
  getStockFallbackUrl,
  getThemeImageSlotsForPage,
} from './imageHelper';

/** Threshold above which preview renders one page at a time (avoids browser freeze). */
export const LARGE_BOOK_PAGE_THRESHOLD = 15;

/** A4 page width in CSS pixels — must match .ebook-page max-width. */
const PAGE_CSS_WIDTH = 595;
const PAGE_CSS_HEIGHT = 842;

interface CaptureSettings {
  scale: number;
  jpegQuality: number;
  imageFormat: 'JPEG' | 'PNG';
  imageWaitMs: number;
  pageTimeoutMs: number;
  yieldMs: number;
}

/** High-quality capture — same settings for all book sizes (no quality downgrade). */
function getCaptureSettings(totalPages: number): CaptureSettings {
  // PNG is sharper but huge for 100+ pages; use lossless PNG only for smaller books.
  const usePng = totalPages <= 40;
  return {
    scale: 2,
    jpegQuality: 0.96,
    imageFormat: usePng ? 'PNG' : 'JPEG',
    imageWaitMs: 3000,
    pageTimeoutMs: 90_000,
    yieldMs: 120,
  };
}

/** Rough export ETA — quality mode is slower but readable. */
export function estimateExportMinutes(totalPages: number): number {
  if (totalPages > 100) return Math.max(10, Math.round(totalPages * 0.16));
  if (totalPages > 30) return Math.max(5, Math.round(totalPages * 0.2));
  return Math.max(2, Math.round(totalPages * 0.35));
}

/** Make the export container paintable — must stay in the viewport (no off-screen transform). */
export function prepareElementForPdfCapture(element: HTMLElement): () => void {
  const wrapper = element.parentElement as HTMLElement | null;
  const prevWrapperStyle = wrapper?.getAttribute('style') ?? '';
  const prevElementStyle = element.getAttribute('style') ?? '';
  const prevWrapperAria = wrapper?.getAttribute('aria-hidden') ?? null;

  if (wrapper) {
    wrapper.removeAttribute('aria-hidden');
    wrapper.style.cssText = [
      'position:fixed',
      'left:-9999px',
      'top:0',
      `width:${PAGE_CSS_WIDTH}px`,
      'z-index:-9999',
      'pointer-events:none',
      'overflow:visible',
      'opacity:1',
      'visibility:visible',
    ].join(';');
  }

  element.style.cssText = [
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    `width:${PAGE_CSS_WIDTH}px`,
    'background:#fff',
  ].join(';');

  return () => {
    if (wrapper) {
      if (prevWrapperStyle) wrapper.setAttribute('style', prevWrapperStyle);
      else wrapper.removeAttribute('style');
      if (prevWrapperAria !== null) wrapper.setAttribute('aria-hidden', prevWrapperAria);
      else wrapper.setAttribute('aria-hidden', 'true');
    }
    if (prevElementStyle) element.setAttribute('style', prevElementStyle);
    else element.removeAttribute('style');
  };
}

export async function waitForNextPaint(): Promise<void> {
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
}

/** Yield to the browser so the tab stays responsive during long exports. */
export function yieldToBrowser(ms = 16): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/** Poll until the export page is mounted and laid out with real dimensions. */
export async function waitForPageElement(
  getPageElement: () => HTMLElement | null,
  timeoutMs = 8000
): Promise<HTMLElement> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const el = getPageElement();
    if (el && el.offsetWidth >= 400 && el.offsetHeight >= 400) {
      return el;
    }
    await yieldToBrowser(20);
  }
  throw new Error('Export page element not ready — try again.');
}

/** Wait until images inside the export root have loaded (or time out). */
export async function waitForExportImages(root: HTMLElement, timeoutMs = 5000): Promise<void> {
  // Yield for a small paint cycle to allow React's DOM changes to apply.
  await yieldToBrowser(40);

  const images = Array.from(root.querySelectorAll('img'));
  if (images.length === 0) return;

  const promises = images.map((img) => {
    return new Promise<void>((resolve) => {
      // Helper to decode the image and resolve
      const tryDecode = () => {
        if (typeof img.decode === 'function') {
          img.decode()
            .then(() => resolve())
            .catch(() => resolve());
        } else {
          resolve();
        }
      };

      const checkComplete = () => {
        if (img.complete && img.naturalWidth > 0) {
          tryDecode();
          return true;
        }
        return false;
      };

      // Already loaded?
      if (img.src && checkComplete()) {
        return;
      }

      let observer: MutationObserver | null = null;
      let cleanedUp = false;

      const cleanup = () => {
        if (cleanedUp) return;
        cleanedUp = true;
        if (observer) {
          observer.disconnect();
        }
        img.removeEventListener('load', onLoad);
        img.removeEventListener('error', onError);
      };

      const onLoad = () => {
        cleanup();
        tryDecode();
      };

      const onError = () => {
        cleanup();
        resolve(); // Continue on error
      };

      img.addEventListener('load', onLoad);
      img.addEventListener('error', onError);

      if (!img.src) {
        observer = new MutationObserver(() => {
          if (img.src) {
            observer?.disconnect();
            observer = null;
            if (checkComplete()) {
              cleanup();
            }
          }
        });
        observer.observe(img, { attributes: true, attributeFilter: ['src'] });
      }
    });
  });

  await Promise.race([
    Promise.all(promises).then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

function loadImageElement(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!url.startsWith('blob:') && !url.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

/** Embed full-resolution images as data URLs for sharp, instant paint during capture. */
async function toExportDataUrl(url: string, maxEdge = 800): Promise<string> {
  if (url.startsWith('data:')) return url;

  try {
    const img = await loadImageElement(url);
    const scale = Math.min(maxEdge / img.naturalWidth, maxEdge / img.naturalHeight, 1);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return url;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/png');
  } catch {
    return getPlaceholderImageUrl('image', 0);
  }
}

interface ImageSlotRef {
  prompt: string;
  seed: number;
}

function collectExportImageSlots(
  sections: EbookSection[],
  bookTitle: string,
  themeId: ThemeId
): ImageSlotRef[] {
  const seen = new Set<string>();
  const slots: ImageSlotRef[] = [];

  const add = (prompt: string, seed: number) => {
    const key = `${seed}::${prompt}`;
    if (seen.has(key)) return;
    seen.add(key);
    slots.push({ prompt, seed });
  };

  sections.forEach((section, index) => {
    const pageIndex = index + 1;
    const chapterTitle = section.chapterTitle || section.title;
    const themeSlots = getThemeImageSlotsForPage(
      section.layout === 'cover' ? 'editorial' : themeId,
      chapterTitle,
      bookTitle,
      pageIndex
    );
    add(themeSlots.primary.prompt, themeSlots.primary.seed);
    themeSlots.extras.forEach((slot) => add(slot.prompt, slot.seed));
    add(section.imagePrompt || chapterTitle, pageIndex);
  });

  return slots;
}

/** Convert all export images to embedded data URLs before capture. */
export async function preloadExportImages(
  sections: EbookSection[],
  bookTitle: string,
  themeId: ThemeId,
  onPreloadProgress?: (loaded: number, total: number) => void,
  signal?: AbortSignal
): Promise<void> {
  clearExportImageCache();
  const slots = collectExportImageSlots(sections, bookTitle, themeId);
  const batchSize = 20;
  let loaded = 0;

  for (let i = 0; i < slots.length; i += batchSize) {
    if (signal?.aborted) {
      throw new Error('Export cancelled.');
    }
    await Promise.all(
      slots.slice(i, i + batchSize).map(async ({ prompt, seed }) => {
        if (signal?.aborted) return;
        const sourceUrl = getExportSafeImageUrl(prompt, seed);
        const fullResUrl = sourceUrl.includes('picsum.photos')
          ? getStockFallbackUrl(prompt, seed, 800, 600)
          : sourceUrl;
        const dataUrl = await toExportDataUrl(fullResUrl, 800);
        if (signal?.aborted) return;
        cacheExportImageDataUrl(prompt, seed, dataUrl);
        loaded++;
        onPreloadProgress?.(loaded, slots.length);
      })
    );
    await yieldToBrowser(4);
  }
}

function triggerPdfDownload(doc: jsPDF, filename: string): void {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function canvasToDataUrl(
  canvas: HTMLCanvasElement,
  format: 'JPEG' | 'PNG',
  jpegQuality: number
): Promise<string> {
  const mime = format === 'PNG' ? 'image/png' : 'image/jpeg';

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas encoding failed'));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Canvas read failed'));
        reader.readAsDataURL(blob);
      },
      mime,
      format === 'JPEG' ? jpegQuality : undefined
    );
  });
}

export interface PageByPageExportOptions {
  totalPages: number;
  filename: string;
  onRenderPage: (pageIndex: number) => void | Promise<void>;
  onProgress?: (current: number, total: number) => void;
  getPageElement: () => HTMLElement | null;
  signal?: AbortSignal;
}

const EXPORT_FIT_MARGIN = 0.97;

function applyExportCloneStyles(page: HTMLElement, exportScale: number): void {
  page.style.boxShadow = 'none';
  page.style.width = `${PAGE_CSS_WIDTH}px`;
  page.style.maxWidth = `${PAGE_CSS_WIDTH}px`;
  page.style.height = `${PAGE_CSS_HEIGHT}px`;
  page.style.minHeight = `${PAGE_CSS_HEIGHT}px`;
  page.style.maxHeight = `${PAGE_CSS_HEIGHT}px`;
  page.style.overflow = 'hidden';
  page.style.setProperty('-webkit-font-smoothing', 'antialiased');
  page.style.setProperty('text-rendering', 'optimizeLegibility');

  const bodyEl = page.querySelector('.ebook-page-body') as HTMLElement | null;
  if (bodyEl) {
    if (exportScale < 0.995) {
      bodyEl.style.transformOrigin = 'top center';
      bodyEl.style.transform = `scale(${exportScale})`;
    } else {
      bodyEl.style.transform = 'none';
    }
  }
}

/**
 * Measure natural page height, then scale the page body content to fit A4 (matches preview, no clipping).
 */
export function fitPageForExport(pageEl: HTMLElement): { restore: () => void; scale: number } {
  const bodyEl = pageEl.querySelector('.ebook-page-body') as HTMLElement | null;

  const prevPage = {
    zoom: pageEl.style.zoom,
    height: pageEl.style.height,
    minHeight: pageEl.style.minHeight,
    maxHeight: pageEl.style.maxHeight,
    width: pageEl.style.width,
    maxWidth: pageEl.style.maxWidth,
    overflow: pageEl.style.overflow,
  };

  const prevBody = bodyEl ? {
    transform: bodyEl.style.transform,
    transformOrigin: bodyEl.style.transformOrigin,
    height: bodyEl.style.height,
  } : null;

  pageEl.style.zoom = '';
  pageEl.style.width = `${PAGE_CSS_WIDTH}px`;
  pageEl.style.maxWidth = `${PAGE_CSS_WIDTH}px`;
  pageEl.style.setProperty('height', 'auto', 'important');
  pageEl.style.setProperty('min-height', `${PAGE_CSS_HEIGHT}px`, 'important');
  pageEl.style.maxHeight = 'none';
  pageEl.style.overflow = 'visible';

  if (bodyEl) {
    bodyEl.style.transform = 'none';
    bodyEl.style.height = 'auto';
  }

  const naturalH = Math.max(pageEl.scrollHeight, pageEl.getBoundingClientRect().height);
  const naturalW = pageEl.scrollWidth;

  const bodyH = bodyEl ? Math.max(bodyEl.scrollHeight, bodyEl.getBoundingClientRect().height) : 0;
  const nonBodyH = Math.max(0, naturalH - bodyH);
  const targetBodyH = PAGE_CSS_HEIGHT - nonBodyH;

  let scaleH = 1;
  if (bodyH > 0 && targetBodyH < bodyH) {
    scaleH = (targetBodyH / bodyH) * EXPORT_FIT_MARGIN;
  }

  const scaleW = naturalW > PAGE_CSS_WIDTH ? (PAGE_CSS_WIDTH / naturalW) * EXPORT_FIT_MARGIN : 1;
  const scale = Math.min(scaleH, scaleW, 1);

  pageEl.style.setProperty('height', `${PAGE_CSS_HEIGHT}px`, 'important');
  pageEl.style.setProperty('min-height', `${PAGE_CSS_HEIGHT}px`, 'important');
  pageEl.style.setProperty('max-height', `${PAGE_CSS_HEIGHT}px`, 'important');
  pageEl.style.overflow = 'hidden';

  if (bodyEl && scale < 0.995) {
    bodyEl.style.transformOrigin = 'top center';
    bodyEl.style.transform = `scale(${scale})`;
  }

  return {
    scale,
    restore: () => {
      pageEl.style.zoom = prevPage.zoom;
      pageEl.style.height = prevPage.height;
      pageEl.style.minHeight = prevPage.minHeight;
      pageEl.style.maxHeight = prevPage.maxHeight;
      pageEl.style.width = prevPage.width;
      pageEl.style.maxWidth = prevPage.maxWidth;
      pageEl.style.overflow = prevPage.overflow;

      if (bodyEl && prevBody) {
        bodyEl.style.transform = prevBody.transform;
        bodyEl.style.transformOrigin = prevBody.transformOrigin;
        bodyEl.style.height = prevBody.height;
      }
    },
  };
}

async function renderPageCanvas(
  pageEl: HTMLElement,
  pageNum: number,
  settings: CaptureSettings,
  exportScale: number,
  useForeignObject: boolean,
  windowWidth: number,
  windowHeight: number
): Promise<HTMLCanvasElement> {
  return withTimeout(
    html2canvas(pageEl, {
      scale: settings.scale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: PAGE_CSS_WIDTH,
      height: PAGE_CSS_HEIGHT,
      windowWidth,
      windowHeight,
      scrollX: 0,
      scrollY: 0,
      imageTimeout: 8000,
      foreignObjectRendering: useForeignObject,
      onclone: (clonedDoc, clonedPage) => {
        clonedDoc.querySelectorAll('.no-print').forEach((node) => {
          (node as HTMLElement).style.display = 'none';
        });
        const clonedWrapper = clonedDoc.getElementById('ebook-download-wrapper');
        if (clonedWrapper) {
          clonedWrapper.style.left = '0';
          clonedWrapper.style.zIndex = '9000';
        }
        applyExportCloneStyles(clonedPage as HTMLElement, exportScale);
      },
    }),
    settings.pageTimeoutMs,
    `Page ${pageNum} capture`
  );
}

async function capturePageElement(
  pageEl: HTMLElement,
  pageNum: number,
  settings: CaptureSettings,
  exportScale: number
): Promise<{ canvas: HTMLCanvasElement; format: 'JPEG' | 'PNG' }> {
  let canvas: HTMLCanvasElement;
  const windowWidth = pageEl.offsetWidth || PAGE_CSS_WIDTH;
  const windowHeight = pageEl.offsetHeight || PAGE_CSS_HEIGHT;

  try {
    canvas = await renderPageCanvas(pageEl, pageNum, settings, exportScale, true, windowWidth, windowHeight);
  } catch (foreignObjectErr) {
    console.warn(`Page ${pageNum}: foreignObject capture failed, retrying…`, foreignObjectErr);
    canvas = await renderPageCanvas(pageEl, pageNum, settings, exportScale, false, windowWidth, windowHeight);
  }

  if (canvas.width < 100 || canvas.height < 100) {
    throw new Error(`Page ${pageNum} capture produced an empty canvas`);
  }

  return { canvas, format: settings.imageFormat };
}

const PDF_W_MM = 210;
const PDF_H_MM = 297;

/** One styled preview page → one PDF page (no arbitrary slicing). */
async function addSinglePageToPdf(
  doc: jsPDF,
  canvas: HTMLCanvasElement,
  format: 'JPEG' | 'PNG',
  jpegQuality: number,
  isFirstPdfPage: { value: boolean }
): Promise<void> {
  if (!isFirstPdfPage.value) {
    doc.addPage();
  }
  isFirstPdfPage.value = false;

  const dataUrl = await canvasToDataUrl(canvas, format, jpegQuality);
  doc.addImage(dataUrl, format, 0, 0, PDF_W_MM, PDF_H_MM);
}

/**
 * Export styled pages one at a time — matches the preview design (themes, images, layout).
 */
export async function exportStyledEbookPdf(options: PageByPageExportOptions): Promise<void> {
  const { totalPages, filename, onRenderPage, onProgress, getPageElement, signal } = options;
  const settings = getCaptureSettings(totalPages);

  if (document.fonts?.ready) {
    await document.fonts.ready.catch(() => undefined);
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  let failedPages = 0;
  const isFirstPdfPage = { value: true };

  for (let i = 0; i < totalPages; i++) {
    if (signal?.aborted) {
      throw new Error('Export cancelled.');
    }

    onProgress?.(i + 1, totalPages);

    let pageCapture: { canvas: HTMLCanvasElement; format: 'JPEG' | 'PNG' } | null = null;

    try {
      await onRenderPage(i);
      if (document.fonts?.ready) {
        await document.fonts.ready.catch(() => undefined);
      }
      await waitForNextPaint();
      await waitForNextPaint();
      await yieldToBrowser(settings.yieldMs);
      if (i === 0) {
        await yieldToBrowser(350); // Extra delay specifically for the cover page
      }

      const pageEl = await waitForPageElement(getPageElement);
      await waitForExportImages(pageEl, settings.imageWaitMs);
      await waitForNextPaint();
      await yieldToBrowser(60);

      // Stabilize scrollHeight by checking twice with a 100ms gap
      let prevHeight = pageEl.scrollHeight;
      for (let attempt = 0; attempt < 30; attempt++) {
        await yieldToBrowser(100);
        const currHeight = pageEl.scrollHeight;
        if (currHeight === prevHeight) {
          break;
        }
        prevHeight = currHeight;
      }

      const { restore: restoreFit, scale: exportScale } = fitPageForExport(pageEl);
      await waitForNextPaint();
      await waitForNextPaint();
      try {
        pageCapture = await capturePageElement(pageEl, i + 1, settings, exportScale);
      } finally {
        restoreFit();
      }
    } catch (pageErr) {
      if (signal?.aborted || (pageErr instanceof Error && pageErr.message.includes('cancelled'))) {
        throw pageErr;
      }
      failedPages++;
      console.warn(`PDF export skipped page ${i + 1}:`, pageErr);
    }

    if (pageCapture) {
      await addSinglePageToPdf(
        doc,
        pageCapture.canvas,
        pageCapture.format,
        settings.jpegQuality,
        isFirstPdfPage
      );
    } else {
      if (!isFirstPdfPage.value) {
        doc.addPage();
      }
      isFirstPdfPage.value = false;
      doc.setFontSize(14);
      doc.setTextColor(40, 40, 40);
      doc.text(`Page ${i + 1}`, 20, 30);
      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text('This page could not be rendered — re-export to retry.', 20, 42);
    }

    if (i % 2 === 0) {
      await yieldToBrowser(8);
    }
  }

  triggerPdfDownload(doc, filename);
  clearExportImageCache();

  if (failedPages > 0) {
    console.warn(`PDF export finished with ${failedPages} page(s) using fallback placeholders.`);
  }
}

/** @deprecated Use exportStyledEbookPdf */
export const exportEbookPageByPage = exportStyledEbookPdf;
