'use client';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import {
  PrintPagesExport,
  PRINT_EXPORT_ROOT_ID,
  getPrintExportRootElement,
} from '@/app/components/PrintPagesExport';
import { getPageDimensions } from '@/lib/utils/printPageDimensions';
import type { EbookSection } from './pdfParser';
import type { ThemeId } from '../themes/types';

export interface PrintPdfExportOptions {
  sections: EbookSection[];
  bookTitle: string;
  selectedTheme: ThemeId;
  customThemeStyles?: React.CSSProperties;
  onProgress?: (current: number, total: number) => void;
  signal?: AbortSignal;
  dimensions?: 'letter' | 'a4' | 'legal';
}

const PRINT_STYLE_ID = 'ebook-print-export-styles';

function injectPrintStyles(pageW: number, pageH: number): void {
  if (document.getElementById(PRINT_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    #${PRINT_EXPORT_ROOT_ID} {
      position: fixed;
      left: -9999px;
      top: 0;
      width: ${pageW}px;
      pointer-events: none;
      z-index: -1;
    }
    @media print {
      @page { size: ${pageW}px ${pageH}px; margin: 0; }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        width: ${pageW}px !important;
        background: white !important;
      }
      body * {
        visibility: hidden !important;
      }
      #${PRINT_EXPORT_ROOT_ID},
      #${PRINT_EXPORT_ROOT_ID} * {
        visibility: visible !important;
      }
      #${PRINT_EXPORT_ROOT_ID} {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: ${pageW}px !important;
        pointer-events: auto !important;
      }
      #${PRINT_EXPORT_ROOT_ID} .ebook-page-wrapper {
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      #${PRINT_EXPORT_ROOT_ID} .ebook-page,
      #${PRINT_EXPORT_ROOT_ID} .pdf-export-page {
        width: ${pageW}px !important;
        min-height: ${pageH}px !important;
        height: ${pageH}px !important;
        box-shadow: none !important;
        margin: 0 !important;
        print-color-adjust: exact !important;
        -webkit-print-color-adjust: exact !important;
      }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function removePrintStyles(): void {
  document.getElementById(PRINT_STYLE_ID)?.remove();
}

async function waitForFonts(): Promise<void> {
  if ('fonts' in document) {
    try {
      await document.fonts.ready;
    } catch {
      /* ignore */
    }
  }
}

async function waitForImages(container: HTMLElement, timeoutMs = 10_000): Promise<void> {
  const imgs = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
          setTimeout(done, timeoutMs);
        })
    )
  );
}

function cleanupPrintRoot(
  root: ReturnType<typeof createRoot> | null,
  mountPoint: HTMLElement | null
): void {
  root?.unmount();
  mountPoint?.remove();
  removePrintStyles();
}

export async function exportPrintPdf(options: PrintPdfExportOptions): Promise<void> {
  const {
    sections,
    bookTitle,
    selectedTheme,
    customThemeStyles,
    onProgress,
    signal,
    dimensions = 'a4',
  } = options;

  if (sections.length === 0) {
    throw new Error('No pages to export.');
  }

  if (signal?.aborted) {
    throw new Error('Export cancelled.');
  }

  const { w: pageW, h: pageH } = getPageDimensions(dimensions);
  const total = sections.length;
  onProgress?.(0, total);

  injectPrintStyles(pageW, pageH);

  const mountPoint = document.createElement('div');
  document.body.appendChild(mountPoint);

  const root = createRoot(mountPoint);
  const pagesElement = (
    <PrintPagesExport
      sections={sections}
      bookTitle={bookTitle}
      selectedTheme={selectedTheme}
      customThemeStyles={customThemeStyles}
      dimensions={dimensions}
      rootId={PRINT_EXPORT_ROOT_ID}
    />
  );

  flushSync(() => {
    root.render(pagesElement);
  });

  // Let React effects (image src resolution) run before print
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  onProgress?.(Math.min(1, total), total);

  const imageTimeout = total > 50 ? 20_000 : total > 20 ? 15_000 : 10_000;
  const exportRoot = getPrintExportRootElement() ?? mountPoint;
  await waitForImages(exportRoot, imageTimeout);
  await waitForFonts();
  await new Promise<void>((resolve) => setTimeout(resolve, total > 30 ? 1200 : 400));

  if (signal?.aborted) {
    cleanupPrintRoot(root, mountPoint);
    throw new Error('Export cancelled.');
  }

  onProgress?.(total, total);

  // Print from the same document so all theme CSS stays applied (no about:blank)
  await new Promise<void>((resolve, reject) => {
    const finish = () => {
      cleanupPrintRoot(root, mountPoint);
      resolve();
    };

    const onAfterPrint = () => {
      window.removeEventListener('afterprint', onAfterPrint);
      finish();
    };

    window.addEventListener('afterprint', onAfterPrint);

    setTimeout(() => {
      if (signal?.aborted) {
        window.removeEventListener('afterprint', onAfterPrint);
        cleanupPrintRoot(root, mountPoint);
        reject(new Error('Export cancelled.'));
        return;
      }
      window.focus();
      window.print();
      // Fallback cleanup if afterprint never fires (some browsers)
      setTimeout(() => {
        if (document.getElementById(PRINT_EXPORT_ROOT_ID)) {
          window.removeEventListener('afterprint', onAfterPrint);
          finish();
        }
      }, 120_000);
    }, total > 30 ? 800 : 300);
  });
}
