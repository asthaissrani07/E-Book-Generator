import type { EbookSection } from './pdfParser';
import type { ThemeId } from '../themes/types';

/**
 * Returns the character limit for a section based on its layout and theme.
 * - Single column layouts: 1200 characters
 * - Two column layouts: 800 characters
 * - Pages with large images: 600 characters
 */
export function getCharacterLimit(section: EbookSection, _themeId: ThemeId, _pageIndex: number): number {
  const showImage = section.showImage !== false;

  // Cover pages have a large image (if showImage is true)
  if (section.layout === 'cover') {
    return showImage ? 1500 : 3500;
  }

  // Split layout has a text column and an image column (if showImage is true).
  if (section.layout === 'split') {
    return showImage ? 1500 : 2500;
  }

  // Magazine layout has two columns
  if (section.layout === 'magazine') {
    return showImage ? 1500 : 2500;
  }

  // Editorial layouts typically feature large hero images when showImage is true.
  if (section.layout === 'editorial') {
    return showImage ? 1500 : 3500;
  }

  // Standard layouts have an image at the bottom if showImage is true.
  if (section.layout === 'standard') {
    return showImage ? 1500 : 3500;
  }

  // Text or TOC layouts are typically text-only single column
  return 3500;
}

/**
 * Parses content into individual sentences. A sentence is terminated by . ! or ?
 * followed by space, newline, or the end of the string.
 */
function getSentences(text: string): string[] {
  // This matches a sentence including its trailing punctuation and whitespace.
  const sentenceRegex = /.*?[.!?]+(?=\s+|$)/gs;
  const matches = Array.from(text.matchAll(sentenceRegex)).map((m) => m[0]);

  const matchedLength = matches.reduce((sum, s) => sum + s.length, 0);
  if (matchedLength < text.length) {
    const remaining = text.substring(matchedLength);
    if (remaining.trim()) {
      matches.push(remaining);
    }
  }

  return matches;
}

/**
 * Splits text content into multiple pages at sentence boundaries.
 */
export function splitContentIntoPages(
  content: string,
  limit: number
): string[] {
  if (!content) return [''];

  const sentences = getSentences(content);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk && (currentChunk + sentence).length > limit) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [''];
}

/**
 * Sanitizes text content by removing any word longer than 30 characters
 * while preserving HTML tags and formatting.
 */
export function sanitizeContent(text: string): string {
  if (!text) return '';
  return text.replace(/(<[^>]+>)|(\S+)/g, (match, tag, word) => {
    if (tag) return tag;
    if (word && word.length > 30) return '';
    return match;
  });
}

/**
 * Splits a section into multiple sections if its content exceeds the layout limit.
 */
export function splitSection(
  section: EbookSection,
  themeId: ThemeId,
  pageIndex: number
): EbookSection[] {
  // Sanitize the content to filter out corrupted words
  const sanitizedContent = sanitizeContent(section.content || '');
  const sectionWithSanitized = {
    ...section,
    content: sanitizedContent,
  };

  const limit = getCharacterLimit(sectionWithSanitized, themeId, pageIndex);
  const chunks = splitContentIntoPages(sanitizedContent, limit);

  if (chunks.length <= 1) {
    return [sectionWithSanitized];
  }

  return chunks.map((chunk, idx) => {
    if (idx === 0) {
      return {
        ...sectionWithSanitized,
        content: chunk,
      };
    }

    // Continuation page inherits layout, theme, header/footer details,
    // but hides chapter title heading and images as requested by the user.
    return {
      ...sectionWithSanitized,
      id: `${section.id}-cont-${idx}-${Date.now()}`,
      title: section.title, // Clean title, no "(cont.)"
      showChapterHeading: false,
      showImage: false,
      content: chunk,
      drawings: [], // Clear canvas drawings on continuation pages
    };
  });
}
