import { buildImageUrl, buildEditorialImageSet } from './imageHelper';

interface PDFTextItem {
  str: string;
  fontSize: number;
  y: number;
  x: number;
  width: number;
}

export function reconstructParagraphs(lines: string[]): string {
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
  layout: 'split' | 'editorial' | 'magazine' | 'cover' | 'standard' | 'toc' | 'text';
  /** Actual book chapter this page belongs to (from PDF headings). */
  chapterTitle?: string;
  /** When false, the large in-page chapter heading is hidden (continuation page). */
  showChapterHeading?: boolean;
  /** When false, decorative illustration slots are hidden (typical for imported PDF pages). */
  showImage?: boolean;
  /** Additional editorial/newspaper images for multi-photo spreads. */
  extraImageUrls?: string[];
  /** Vector drawings on the page canvas. */
  drawings?: Array<{ points: string; color: string; width: number }>;
}

export function looksLikeChapterHeading(text: string): boolean {
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

export function extractChapterKey(text: string): string | null {
  const trimmed = text.trim();
  const match = trimmed.match(/^chapter\s+([\dIVXLC]+)/i);
  if (match) return match[1].toUpperCase();
  const named = trimmed.match(/^(introduction|preface|prologue|epilogue|conclusion|appendix)\b/i);
  if (named) return named[1].toLowerCase();
  return trimmed.toLowerCase();
}

export function isDecorativeOnlyLine(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (/^[\u2660-\u2667\u2615\u2694\u2721\u273F\u2744\u2764\u2726\u2736❦♦♠♣♥•·]+$/u.test(trimmed)) return true;
  if (trimmed.length <= 3 && !/\w{2,}/.test(trimmed)) return true;
  return false;
}

export function isLikelyPageNumberLine(text: string): boolean {
  const trimmed = text.trim();
  return (
    /^\d{1,4}$/.test(trimmed) ||
    /^\d+\s+of\s+\d+$/i.test(trimmed) ||
    /^page\s+\d+/i.test(trimmed) ||
    /^p\.?\s*\d+$/i.test(trimmed)
  );
}

export async function parsePdf(file: File): Promise<{ title: string; sections: EbookSection[] }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/parse-pdf', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to parse PDF on the server.');
  }

  return response.json();
}
