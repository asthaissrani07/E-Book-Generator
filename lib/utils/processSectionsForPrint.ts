import type { EbookSection } from './pdfParser';

export interface ProcessedPage {
  type: 'cover' | 'chapter' | 'body';
  section: EbookSection;
  content?: string;
}

function sanitizeContent(text: string): string {
  if (!text) return '';
  return text.replace(/(<[^>]+>)|(\S+)/g, (match, tag, word) => {
    if (tag) return tag;
    if (word && word.length > 30) return '';
    return match;
  });
}

function splitTextContent(text: string, limit: number = 4000, minLength: number = 100): string[] {
  if (!text) return [];

  const sentenceRegex = /.*?[.!?]+(?=\s+|$)/gs;
  const sentences: string[] = [];
  let lastIndex = 0;
  let match;

  while ((match = sentenceRegex.exec(text)) !== null) {
    sentences.push(match[0]);
    lastIndex = sentenceRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex);
    if (remaining.trim()) {
      sentences.push(remaining);
    }
  }

  if (sentences.length === 0) {
    const parts = text.split(/(\s+)/);
    let current = '';
    for (const part of parts) {
      if ((current + part).length > limit) {
        if (current.trim()) sentences.push(current);
        current = part;
      } else {
        current += part;
      }
    }
    if (current.trim()) {
      sentences.push(current);
    }
  }

  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    if (currentChunk && (currentChunk + ' ' + sentence).length > limit) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      if (currentChunk) {
        currentChunk += ' ' + sentence;
      } else {
        currentChunk = sentence;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  if (chunks.length > 1) {
    const lastIdx = chunks.length - 1;
    if (chunks[lastIdx].length < minLength) {
      chunks[lastIdx - 1] = chunks[lastIdx - 1] + '\n\n' + chunks[lastIdx];
      chunks.pop();
    }
  }

  return chunks;
}

/** Runs sections through a content pipeline to prepare pages (legacy API route). */
export function processSectionsForPrint(sections: EbookSection[]): ProcessedPage[] {
  const pages: ProcessedPage[] = [];

  sections.forEach((section, index) => {
    const isCoverLayout = index === 0 || section.layout === 'cover';

    if (isCoverLayout) {
      pages.push({ type: 'cover', section });
    }

    if (isCoverLayout && index > 0) {
      return;
    }

    if (isCoverLayout && index === 0) {
      const titleTrim = (section.title || '').trim();
      const contentTrim = (section.content || '').trim();
      if (!contentTrim || contentTrim === titleTrim) {
        return;
      }
    }

    const isContinuation = section.id && (section.id.includes('-cont-') || section.showChapterHeading === false);
    const title = section.title || '';
    const titleLower = title.toLowerCase();
    const romanRegex = /\b(i|ii|iii|iv|v|vi|vii|viii|ix|x|xi|xii|xiii|xiv|xv)\b/i;

    const isChapterStart = !isContinuation && (
      titleLower.includes('chapter') ||
      titleLower.includes('part') ||
      romanRegex.test(title)
    );

    if (isChapterStart) {
      pages.push({ type: 'chapter', section });
    }

    let content = section.content || '';

    content = content
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    content = content.replace(/\r\n/g, '\n');
    content = content.replace(/(?<!\n)\n(?!\n)/g, '\n\n');
    content = content.replace(/<\/?(ul|ol|li)>/gi, '\n');
    content = content.replace(/^\s*[•\-\*\u2022]\s*/gm, '');

    const sanitizedContent = sanitizeContent(content.trim());
    const chunks = splitTextContent(sanitizedContent, 4000, 100);

    if (chunks.length > 0) {
      chunks.forEach((chunk) => {
        pages.push({ type: 'body', section, content: chunk });
      });
    } else if (!isChapterStart) {
      pages.push({ type: 'body', section, content: '' });
    }
  });

  const dedupedPages: ProcessedPage[] = [];
  pages.forEach((page) => {
    if (dedupedPages.length === 0) {
      dedupedPages.push(page);
      return;
    }
    const lastPage = dedupedPages[dedupedPages.length - 1];

    if (page.type === 'body' && lastPage.type === 'body' && page.content === lastPage.content) {
      return;
    }

    if (page.type === 'chapter' && lastPage.type === 'chapter' && page.section.id === lastPage.section.id) {
      return;
    }

    dedupedPages.push(page);
  });

  return dedupedPages;
}
