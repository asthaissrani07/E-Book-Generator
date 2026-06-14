'use client';

import React from 'react';
import { PageLayout } from '@/app/components/PageLayout';
import type { EbookSection } from '@/lib/utils/pdfParser';
import type { ThemeId } from '@/lib/themes/types';
import type { PrintDimensions } from '@/lib/utils/printPageDimensions';
import { getPageDimensions } from '@/lib/utils/printPageDimensions';

export const PRINT_EXPORT_ROOT_ID = 'ebook-print-export-root';
const PRINT_EXPORT_ROOT_SELECTOR = '[data-print-export-root]';

export interface PrintPagesExportProps {
  sections: EbookSection[];
  bookTitle: string;
  selectedTheme: ThemeId;
  customThemeStyles?: React.CSSProperties;
  dimensions?: PrintDimensions;
  /** When set (browser print), styles target this element id. */
  rootId?: string;
  /** Use the same image pipeline as the editor preview (not stock export cache). */
  matchPreview?: boolean;
}

export function getPrintExportRootElement(): HTMLElement | null {
  return document.querySelector(PRINT_EXPORT_ROOT_SELECTOR);
}

export function PrintPagesExport({
  sections,
  bookTitle,
  selectedTheme,
  customThemeStyles,
  dimensions = 'a4',
  rootId,
  matchPreview = false,
}: PrintPagesExportProps) {
  const { w: pageW, h: pageH } = getPageDimensions(dimensions);
  const rootSelector = rootId ? `#${rootId}` : PRINT_EXPORT_ROOT_SELECTOR;
  const pdfExportMode = !matchPreview;
  const noop = () => {};
  const noopAsync = async () => {};

  return (
    <>
      <style>{`
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        ${rootSelector} {
          width: ${pageW}px;
          margin: 0;
          padding: 0;
        }
        ${rootSelector} .ebook-page-wrapper {
          page-break-after: always;
          break-after: page;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        ${rootSelector} .ebook-page,
        ${rootSelector} .pdf-export-page {
          width: ${pageW}px !important;
          min-height: ${pageH}px !important;
          height: ${pageH}px !important;
          box-shadow: none !important;
          margin: 0 !important;
          print-color-adjust: exact !important;
          -webkit-print-color-adjust: exact !important;
        }
        @media print {
          @page { size: ${pageW}px ${pageH}px; margin: 0; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
      <div
        id={rootId}
        data-print-export-root
        className={`print-container print-export-root theme-${selectedTheme}`}
      >
        {sections.map((section, idx) => (
          <div
            key={section.id || `page-${idx}`}
            className="ebook-page-wrapper page-break"
            style={{
              width: `${pageW}px`,
              height: `${pageH}px`,
              pageBreakAfter: 'always',
              breakAfter: 'page',
              overflow: 'hidden',
              position: 'relative',
              boxSizing: 'border-box',
              ...(section.layout === 'cover' ? {} : customThemeStyles),
            }}
          >
            <PageLayout
              section={section}
              pageIndex={idx + 1}
              totalPages={sections.length}
              bookTitle={bookTitle}
              selectedTheme={selectedTheme}
              onUpdateSection={noop}
              onDeleteSection={noop}
              onRegenerateImage={noopAsync}
              isGeneratingImage={false}
              isActive={true}
              pdfExportMode={pdfExportMode}
              drawMode={false}
              drawColor="#000"
            />
          </div>
        ))}
      </div>
    </>
  );
}
