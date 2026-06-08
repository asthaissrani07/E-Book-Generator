import { buildImageUrl, buildEditorialImageSet } from './imageHelper';

interface PDFTextItem {
  str: string;
  fontSize: number;
  y: number;
  x: number;
  width: number;
}

function reconstructParagraphs(lines: string[]): string {
  if (lines.length === 0) return "";

  const paragraphs: string[] = [];
  let currentParagraph = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (currentParagraph === "") {
      currentParagraph = line;
    } else {
      if (currentParagraph.endsWith("-")) {
        currentParagraph = currentParagraph.slice(0, -1) + line;
      } else if (currentParagraph.endsWith("-\u00ad")) {
        currentParagraph = currentParagraph.slice(0, -2) + line;
      } else {
        currentParagraph += " " + line;
      }
    }

    const isParagraphEnd = /[.!?]['"]?$/.test(line);
    if (isParagraphEnd) {
      paragraphs.push(currentParagraph);
      currentParagraph = "";
    }
  }

  if (currentParagraph) {
    paragraphs.push(currentParagraph);
  }

  return paragraphs.join("\n\n");
}

export interface EbookSection {
  id: string;
  title: string;
  content: string;
  imagePrompt: string;
  imageUrl: string;
  layout: 'split' | 'editorial' | 'magazine' | 'cover' | 'standard';
  /** Actual book chapter this page belongs to (from PDF headings). */
  chapterTitle?: string;
  /** When false, the large in-page chapter heading is hidden (continuation page). */
  showChapterHeading?: boolean;
  /** When false, decorative illustration slots are hidden (typical for imported PDF pages). */
  showImage?: boolean;
  /** Additional editorial/newspaper images for multi-photo spreads. */
  extraImageUrls?: string[];
}

function looksLikeChapterHeading(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 120) return false;
  return (
    /^chapter\s+[\dIVXLC]+[.:]?\s*$/i.test(trimmed) ||
    /^chapter\s+[\dIVXLC]+[.:]?\s+\S/i.test(trimmed) ||
    /^ch\.?\s*[\dIVXLC]+/i.test(trimmed) ||
    /^part\s+[\dIVXLC]+/i.test(trimmed) ||
    /^section\s+[\dIVXLC]+/i.test(trimmed) ||
    /^(introduction|preface|prologue|epilogue|conclusion|appendix)\b/i.test(trimmed) ||
    (/^\d+(\.\d+)*\s+\S/.test(trimmed) && trimmed.length < 80)
  );
}

function extractChapterKey(text: string): string | null {
  const trimmed = text.trim();
  const match = trimmed.match(/^chapter\s+([\dIVXLC]+)/i);
  if (match) return match[1].toUpperCase();
  const named = trimmed.match(/^(introduction|preface|prologue|epilogue|conclusion|appendix)\b/i);
  if (named) return named[1].toLowerCase();
  return trimmed.toLowerCase();
}

function isDecorativeOnlyLine(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (/^[\u2660-\u2667\u2615\u2694\u2721\u273F\u2744\u2764\u2726\u2736❦♦♠♣♥•·]+$/u.test(trimmed)) return true;
  if (trimmed.length <= 3 && !/\w{2,}/.test(trimmed)) return true;
  return false;
}

function isLikelyPageNumberLine(text: string): boolean {
  const trimmed = text.trim();
  return (
    /^\d{1,4}$/.test(trimmed) ||
    /^\d+\s+of\s+\d+$/i.test(trimmed) ||
    /^page\s+\d+/i.test(trimmed) ||
    /^p\.?\s*\d+$/i.test(trimmed)
  );
}

export async function parsePdf(file: File): Promise<{ title: string; sections: EbookSection[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfjsLib = (window as any).pdfjsLib;

  if (!pdfjsLib) {
    throw new Error("PDF.js library is not loaded. Please ensure you have an active internet connection and reload the page.");
  }

  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const docTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

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
    throw new Error("No text content could be extracted from this PDF. It might be scanned or image-based.");
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
    [...lineFrequency.entries()]
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

  return {
    title: docTitle,
    sections,
  };
}
