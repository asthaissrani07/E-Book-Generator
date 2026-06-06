/** Threshold above which preview renders one page at a time (avoids browser freeze). */
export const LARGE_BOOK_PAGE_THRESHOLD = 15;

/** Prepare an off-screen element so html2canvas can paint it. */
export function prepareElementForPdfCapture(element: HTMLElement): () => void {
  const wrapper = element.parentElement as HTMLElement | null;
  const prevWrapperStyle = wrapper?.getAttribute('style') ?? '';
  const prevElementStyle = element.getAttribute('style') ?? '';

  if (wrapper) {
    wrapper.style.cssText = [
      'position:fixed',
      'left:0',
      'top:0',
      'width:595px',
      'z-index:2147483646',
      'pointer-events:none',
      'overflow:visible',
      'transform:translateX(-200vw)',
      'opacity:1',
      'visibility:visible',
    ].join(';');
  }

  element.style.cssText = [
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'width:595px',
    'background:#fff',
  ].join(';');

  return () => {
    if (wrapper) {
      if (prevWrapperStyle) wrapper.setAttribute('style', prevWrapperStyle);
      else wrapper.removeAttribute('style');
    }
    if (prevElementStyle) element.setAttribute('style', prevElementStyle);
    else element.removeAttribute('style');
  };
}

export async function waitForNextPaint(): Promise<void> {
  await new Promise<void>((r) => requestAnimationFrame(() => r()));
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

/** Poll until the export page element is mounted. */
export async function waitForPageElement(
  getPageElement: () => HTMLElement | null,
  timeoutMs = 4000
): Promise<HTMLElement> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const el = getPageElement();
    if (el) return el;
    await yieldToBrowser(20);
  }
  throw new Error('Export page element not ready — try again.');
}

/** Wait until images inside the export root have loaded (or time out). */
export function waitForExportImages(root: HTMLElement, timeoutMs = 2500): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));
  const pending = images.filter((img) => !img.complete || img.naturalWidth === 0);
  if (pending.length === 0) return Promise.resolve();

  return Promise.race([
    Promise.all(
      pending.map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
              return;
            }
            img.addEventListener('load', () => resolve(), { once: true });
            img.addEventListener('error', () => resolve(), { once: true });
          })
      )
    ).then(() => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

function triggerPdfDownload(doc: { output: (type: string) => Blob }, filename: string): void {
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

export interface PageByPageExportOptions {
  totalPages: number;
  filename: string;
  onRenderPage: (pageIndex: number) => void | Promise<void>;
  onProgress?: (current: number, total: number) => void;
  getPageElement: () => HTMLElement | null;
  signal?: AbortSignal;
}

const EXPORT_CANVAS_SCALE = 1;
const EXPORT_JPEG_QUALITY = 0.82;
const PAGE_CAPTURE_TIMEOUT_MS = 45_000;

/**
 * Export one page at a time — keeps the browser responsive for large books (100+ pages).
 */
export async function exportEbookPageByPage(options: PageByPageExportOptions): Promise<void> {
  const html2pdf = (window as any).html2pdf;
  const jspdf = (window as any).jspdf?.jsPDF;
  if (!html2pdf || !jspdf) {
    throw new Error('PDF libraries not loaded. Please wait and try again.');
  }

  const { totalPages, filename, onRenderPage, onProgress, getPageElement, signal } = options;
  const html2canvasOpts = {
    scale: EXPORT_CANVAS_SCALE,
    useCORS: true,
    allowTaint: false,
    logging: false,
    letterRendering: true,
    width: 595,
    windowWidth: 595,
    scrollX: 0,
    scrollY: 0,
    imageTimeout: 3000,
  };

  let doc: InstanceType<typeof jspdf> | null = null;

  if (document.fonts?.ready) {
    await document.fonts.ready.catch(() => undefined);
  }

  for (let i = 0; i < totalPages; i++) {
    if (signal?.aborted) {
      throw new Error('Export cancelled.');
    }

    onProgress?.(i + 1, totalPages);

    await onRenderPage(i);
    await waitForNextPaint();
    await yieldToBrowser(40);

    const pageEl = await waitForPageElement(getPageElement);
    await waitForExportImages(pageEl, 2500);

    const canvas = await withTimeout(
      html2pdf().set({ html2canvas: html2canvasOpts }).from(pageEl).toCanvas() as Promise<HTMLCanvasElement>,
      PAGE_CAPTURE_TIMEOUT_MS,
      `Page ${i + 1} capture`
    );

    const imgData = canvas.toDataURL('image/jpeg', EXPORT_JPEG_QUALITY);

    if (!doc) {
      doc = new jspdf({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
    } else {
      doc.addPage();
    }

    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    await yieldToBrowser(8);
  }

  if (!doc) {
    throw new Error('No pages were exported.');
  }

  triggerPdfDownload(doc, filename);
}
