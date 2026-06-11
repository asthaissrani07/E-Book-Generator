import { NextResponse } from 'next/server';
import { 
  reconstructParagraphs, 
  looksLikeChapterHeading, 
  extractChapterKey, 
  isDecorativeOnlyLine, 
  isLikelyPageNumberLine,
  EbookSection
} from '@/lib/utils/pdfParser';
import { buildImageUrl, buildEditorialImageSet } from '@/lib/utils/imageHelper';

// Polyfill Promise.withResolvers for Node.js v20 (needed for pdfjs-dist on older Node versions)
if (typeof Promise.withResolvers === 'undefined') {
  Promise.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: any) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();

    // Legacy build is required for Node.js (standard build expects browser APIs like DOMMatrix)
    await import('pdfjs-dist/legacy/build/pdf.worker.mjs');
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');

    const loadingTask = getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const docTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

    interface PDFTextItem {
      str: string;
      fontSize: number;
      y: number;
      x: number;
      width: number;
    }

    const allItems: PDFTextItem[] = [];
    const pageBreaks: number[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });

      const pageItems: PDFTextItem[] = textContent.items
        .map((item: any) => {
          const transform = item.transform;
          const fontSize = Math.abs(transform[3]) || 12;
          const y = viewport.height - transform[5];
          const x = transform[4];
          const width = item.width || 0;
          return { str: item.str, fontSize, y, x, width };
        })
        .filter((item: any) => item.str.trim().length > 0);

      const tolerance = 4;
      const linesMap: { [key: number]: PDFTextItem[] } = {};

      pageItems.forEach((item) => {
        const foundLineY = Object.keys(linesMap).find(
          (lineY) => Math.abs(Number(lineY) - item.y) <= tolerance
        );
        if (foundLineY) {
          linesMap[Number(foundLineY)].push(item);
        } else {
          linesMap[item.y] = [item];
        }
      });

      const sortedLinesY = Object.keys(linesMap).map(Number).sort((a, b) => a - b);
      const reconstructedPageItems: PDFTextItem[] = [];

      sortedLinesY.forEach((lineY) => {
        const elements = linesMap[lineY].sort((a, b) => a.x - b.x);
        
        let combinedText = "";
        if (elements.length > 0) {
          combinedText = elements[0].str;
          for (let i = 1; i < elements.length; i++) {
            const prev = elements[i - 1];
            const curr = elements[i];
            const gapThreshold = prev.fontSize * 0.22;
            const expectedEnd = prev.x + prev.width;
            if (curr.x > expectedEnd + gapThreshold) {
              combinedText += " " + curr.str;
            } else {
              combinedText += curr.str;
            }
          }
        }

        const maxFontSize = Math.max(...elements.map((el) => el.fontSize));
        reconstructedPageItems.push({
          str: combinedText,
          fontSize: maxFontSize,
          y: lineY,
          x: elements[0].x,
          width: elements.length > 0
            ? elements[elements.length - 1].x + elements[elements.length - 1].width - elements[0].x
            : 0,
        });
      });

      if (reconstructedPageItems.length > 0) {
        pageBreaks.push(allItems.length);
        allItems.push(...reconstructedPageItems);
      }
    }

    if (allItems.length === 0) {
      return NextResponse.json({ error: "No text content could be extracted from this PDF. It might be scanned or image-based." }, { status: 400 });
    }

    // Build per-page line arrays using actual PDF page boundaries
    const pagesLines: string[][] = [];
    for (let p = 0; p < pageBreaks.length; p++) {
      const start = pageBreaks[p];
      const end = p + 1 < pageBreaks.length ? pageBreaks[p + 1] : allItems.length;
      pagesLines.push(allItems.slice(start, end).map((item) => item.str));
    }

    // Detect running headers/footers: lines that repeat on many pages
    const lineFrequency = new Map<string, number>();
    pagesLines.forEach((lines) => {
      const uniqueOnPage = new Set(lines.map((l) => l.trim()).filter(Boolean));
      uniqueOnPage.forEach((line) => {
        lineFrequency.set(line, (lineFrequency.get(line) || 0) + 1);
      });
    });

    const repeatThreshold = Math.max(3, Math.floor(pagesLines.length * 0.2));
    const repeatedLines = new Set(
      Array.from(lineFrequency.entries())
        .filter(([, count]) => count >= repeatThreshold)
        .map(([line]) => line)
    );

    const shouldSkipLine = (line: string): boolean => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (repeatedLines.has(trimmed)) return true;
      if (isLikelyPageNumberLine(trimmed)) return true;
      if (isDecorativeOnlyLine(trimmed)) return true;
      // Book title often appears as a running header on every page
      if (trimmed.toLowerCase() === docTitle.toLowerCase()) return true;
      return false;
    };

    const sections: EbookSection[] = [];
    let currentChapterTitle = "Introduction";
    let currentChapterKey: string | null = null;

    for (let p = 0; p < pagesLines.length; p++) {
      const rawLines = pagesLines[p];
      let lines = rawLines.filter((l) => !shouldSkipLine(l));

      let showChapterHeading = false;
      const chapterHeadingIdx = lines.findIndex((l) => looksLikeChapterHeading(l));

      if (chapterHeadingIdx >= 0) {
        const headingText = lines[chapterHeadingIdx].trim();
        const headingKey = extractChapterKey(headingText);

        if (headingKey !== currentChapterKey) {
          currentChapterTitle = headingText;
          currentChapterKey = headingKey;
          showChapterHeading = true;
        }

        lines.splice(chapterHeadingIdx, 1);
      }

      // Remove duplicate decorative chapter lines that match the current chapter
      lines = lines.filter((l) => {
        const trimmed = l.trim();
        if (looksLikeChapterHeading(trimmed) && extractChapterKey(trimmed) === currentChapterKey) {
          return false;
        }
        return true;
      });

      const content = reconstructParagraphs(lines).trim();
      if (!content && p > 0) continue;

      const pageNum = p + 1;
      const sidebarTitle = showChapterHeading
        ? currentChapterTitle
        : `${currentChapterTitle} (p. ${pageNum})`;

      const layout: EbookSection['layout'] = p === 0 ? 'cover' : 'editorial';
      const imageSet = buildEditorialImageSet(currentChapterTitle, docTitle, pageNum);
      const imagePrompt = `Warm boho business ebook photo, ${currentChapterTitle}, ${docTitle}, terracotta beige sunflowers aesthetic`;

      sections.push({
        id: `section-${pageNum}`,
        title: sidebarTitle,
        chapterTitle: currentChapterTitle,
        showChapterHeading,
        showImage: true,
        content: content || (p === 0 ? docTitle : ''),
        imagePrompt,
        imageUrl: imageSet.primary,
        extraImageUrls: imageSet.extras,
        layout,
      });
    }

    if (sections.length === 0) {
      sections.push({
        id: "section-1",
        title: "Title Page",
        content: "Welcome to your E-Book.",
        imagePrompt: "An elegant blank e-book cover, minimal design",
        imageUrl: buildImageUrl("An elegant blank e-book cover, minimal design", 1),
        layout: "cover",
        showChapterHeading: true,
      });
    }

    return NextResponse.json({
      title: docTitle,
      sections,
    });
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    return NextResponse.json({ error: error.message || 'Failed to parse PDF file' }, { status: 500 });
  }
}
