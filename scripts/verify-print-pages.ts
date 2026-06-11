import { processSectionsForPrint } from '../lib/utils/processSectionsForPrint';
import { buildAllPrintPagesHtml } from '../lib/utils/buildPrintPagesHtml';
import type { EbookSection } from '../lib/utils/pdfParser';

const sections: EbookSection[] = [
  {
    id: 'section-1',
    title: 'The Alchemist',
    content: 'The Alchemist',
    layout: 'cover',
    chapterTitle: 'The Alchemist',
    showChapterHeading: true,
    imagePrompt: '',
    imageUrl: '',
  },
  {
    id: 'section-2',
    title: 'Chapter 1',
    content:
      "The boy's name was Santiago. Dusk was falling as the boy arrived with his herd at an abandoned church. The roof had fallen in long ago.",
    layout: 'editorial',
    chapterTitle: 'Chapter 1',
    showChapterHeading: true,
    imagePrompt: '',
    imageUrl: '',
  },
];

const pages = processSectionsForPrint(sections);
const html = buildAllPrintPagesHtml(pages, 'editorial', 'The Alchemist');

console.log('Processed pages:', pages.map((p) => p.type).join(', '));
console.log('HTML length:', html.length);
console.log('Has body template:', html.includes("The boy's name was Santiago"));
console.log('Has placeholder comment:', html.includes('second page'));
if (!html.includes("The boy's name was Santiago")) {
  process.exit(1);
}
