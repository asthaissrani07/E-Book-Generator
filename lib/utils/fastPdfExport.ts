import { jsPDF } from 'jspdf';
import type { EbookSection } from './pdfParser';
import { yieldToBrowser } from './pdfExport';

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BODY_SIZE = 11;
const BODY_LINE = 5.5;
const FOOTER_Y = PAGE_H - 12;

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

function drawPageHeader(doc: jsPDF, bookTitle: string, pageNum: number): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(130, 130, 130);
  doc.text(bookTitle || 'My E-Book', MARGIN, 12);
  doc.text(String(pageNum), PAGE_W - MARGIN, 12, { align: 'right' });
}

function drawPageFooter(doc: jsPDF, bookTitle: string): void {
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(bookTitle || 'My E-Book', PAGE_W / 2, FOOTER_Y, { align: 'center' });
}

function startNewPage(doc: jsPDF, bookTitle: string, pageNum: number): number {
  doc.addPage();
  drawPageHeader(doc, bookTitle, pageNum);
  return 26;
}

function writeLines(
  doc: jsPDF,
  lines: string[],
  startY: number,
  bookTitle: string,
  pageNum: number
): { y: number; pageNum: number } {
  let y = startY;
  let currentPage = pageNum;

  for (const line of lines) {
    if (y > PAGE_H - 24) {
      drawPageFooter(doc, bookTitle);
      y = startNewPage(doc, bookTitle, ++currentPage);
    }
    doc.text(line, MARGIN, y);
    y += BODY_LINE;
  }

  return { y, pageNum: currentPage };
}

export interface FastPdfExportOptions {
  bookTitle: string;
  sections: EbookSection[];
  filename: string;
  onProgress?: (current: number, total: number) => void;
  signal?: AbortSignal;
}

/**
 * Fast text-based PDF — completes large books (100+ pages) in under a minute.
 */
export async function exportFastTextPdf(options: FastPdfExportOptions): Promise<void> {
  const { bookTitle, sections, filename, onProgress, signal } = options;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  let pdfPageNum = 1;

  for (let i = 0; i < sections.length; i++) {
    if (signal?.aborted) {
      throw new Error('Export cancelled.');
    }

    onProgress?.(i + 1, sections.length);

    const section = sections[i];
    if (i > 0) {
      doc.addPage();
      pdfPageNum++;
    }

    drawPageHeader(doc, bookTitle, pdfPageNum);

    if (section.layout === 'cover') {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(26);
      doc.setTextColor(35, 35, 35);
      const coverLines = doc.splitTextToSize(section.title || bookTitle || 'My E-Book', CONTENT_W);
      const blockH = coverLines.length * 10;
      let y = PAGE_H / 2 - blockH / 2;
      for (const line of coverLines) {
        doc.text(line, PAGE_W / 2, y, { align: 'center' });
        y += 10;
      }
      if (section.content.trim()) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.setTextColor(80, 80, 80);
        const subLines = doc.splitTextToSize(section.content.trim(), CONTENT_W - 20);
        let sy = PAGE_H / 2 + 16;
        for (const line of subLines.slice(0, 6)) {
          doc.text(line, PAGE_W / 2, sy, { align: 'center' });
          sy += 6;
        }
      }
      drawPageFooter(doc, bookTitle);
    } else {
      let y = 26;
      const chapterTitle = section.chapterTitle || section.title;
      const showHeading = section.showChapterHeading !== false && Boolean(chapterTitle?.trim());

      if (showHeading) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.setTextColor(30, 30, 30);
        const titleLines = doc.splitTextToSize(chapterTitle, CONTENT_W);
        const result = writeLines(doc, titleLines, y, bookTitle, pdfPageNum);
        y = result.y + 4;
        pdfPageNum = result.pageNum;
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(BODY_SIZE);
      doc.setTextColor(45, 45, 45);

      const paragraphs = section.content.split(/\n\n+/).filter((p) => p.trim());
      const blocks = paragraphs.length > 0 ? paragraphs : [section.content];

      for (let p = 0; p < blocks.length; p++) {
        const lines = doc.splitTextToSize(blocks[p].trim(), CONTENT_W);
        const result = writeLines(doc, lines, y, bookTitle, pdfPageNum);
        y = result.y + 3;
        pdfPageNum = result.pageNum;
      }

      drawPageFooter(doc, bookTitle);
    }

    if (i % 8 === 0) {
      await yieldToBrowser(0);
    }
  }

  triggerPdfDownload(doc, filename);
}
