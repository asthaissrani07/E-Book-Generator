import { splitSection } from '@/lib/utils/contentSplitter';
import type { EbookSection } from '@/lib/utils/pdfParser';
import { buildImageUrl, ensureSectionImageUrls } from '@/lib/utils/imageHelper';
import type { ThemeId } from '@/lib/themes/types';
import type { BlogPdfGenerateEvent } from './types';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Convert plain text or HTML blog content into section HTML. */
export function normalizeBlogContent(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return '<p></p>';

  const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(trimmed);
  if (looksLikeHtml) return trimmed;

  return trimmed
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block.trim()).replace(/\n/g, '<br/>')}</p>`)
    .join('');
}

export function blogEventToFormattedPages(
  event: BlogPdfGenerateEvent,
  theme: ThemeId = 'editorial'
): EbookSection[] {
  const bookTitle = event.title.trim() || 'Blog Post';
  const bodyHtml = normalizeBlogContent(event.content);
  const coverPrompt = `Elegant ebook cover for "${bookTitle}", warm editorial aesthetic`;
  const bodyPrompt = `Editorial illustration for blog article "${bookTitle}"`;

  const coverImage =
    event.coverImageUrl?.trim() || buildImageUrl(coverPrompt, 1);

  const rawSections: EbookSection[] = [
    {
      id: `cover-${event.eventId}`,
      title: bookTitle,
      chapterTitle: bookTitle,
      content: [
        event.excerpt ? `<p style="text-align:center">${escapeHtml(event.excerpt)}</p>` : '',
        event.author
          ? `<p style="text-align:center"><em>by ${escapeHtml(event.author)}</em></p>`
          : '',
      ]
        .filter(Boolean)
        .join(''),
      imagePrompt: coverPrompt,
      imageUrl: coverImage,
      layout: 'cover',
      showChapterHeading: true,
      showImage: true,
    },
    {
      id: `body-${event.eventId}`,
      title: bookTitle,
      chapterTitle: bookTitle,
      content: bodyHtml,
      imagePrompt: bodyPrompt,
      imageUrl: buildImageUrl(bodyPrompt, 2),
      layout: 'editorial',
      showChapterHeading: true,
      showImage: true,
    },
  ];

  const withImages = ensureSectionImageUrls(rawSections, bookTitle);
  const formatted: EbookSection[] = [];

  withImages.forEach((section, idx) => {
    formatted.push(...splitSection(section, theme, idx));
  });

  return formatted;
}
