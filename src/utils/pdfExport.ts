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
export function yieldToBrowser(ms = 12): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Wait until images inside the export root have loaded (or time out). */
export function waitForExportImages(root: HTMLElement, timeoutMs = 8000): Promise<void> {
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

export interface PageByPageExportOptions {
  totalPages: number;
  filename: string;
  onRenderPage: (pageIndex: number) => void | Promise<void>;
  onProgress?: (current: number, total: number) => void;
  getPageElement: () => HTMLElement | null;
}

/**
 * Export one page at a time — keeps the browser responsive for large books (100+ pages).
 */
export async function exportEbookPageByPage(options: PageByPageExportOptions): Promise<void> {
  const html2pdf = (window as any).html2pdf;
  const jspdf = (window as any).jspdf?.jsPDF;
  if (!html2pdf || !jspdf) {
    throw new Error('PDF libraries not loaded. Please wait and try again.');
  }

  const { totalPages, filename, onRenderPage, onProgress, getPageElement } = options;
  const html2canvasOpts = {
    scale: 1.35,
    useCORS: true,
    allowTaint: false,
    logging: false,
    letterRendering: true,
    width: 595,
    windowWidth: 595,
    scrollX: 0,
    scrollY: 0,
  };

  let doc: InstanceType<typeof jspdf> | null = null;

  for (let i = 0; i < totalPages; i++) {
    await onRenderPage(i);
    await waitForNextPaint();

    const pageEl = getPageElement();
    if (!pageEl) {
      throw new Error(`Export page element missing at index ${i}`);
    }

    await waitForExportImages(pageEl, 6000);

    const canvas = await html2pdf()
      .set({ html2canvas: html2canvasOpts })
      .from(pageEl)
      .toCanvas();

    const imgData = canvas.toDataURL('image/jpeg', 0.88);

    if (!doc) {
      doc = new jspdf({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    } else {
      doc.addPage();
    }

    doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    onProgress?.(i + 1, totalPages);
    await yieldToBrowser();
  }

  if (!doc) {
    throw new Error('No pages were exported.');
  }

  doc.save(filename);
}
