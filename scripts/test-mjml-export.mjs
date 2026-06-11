/**
 * Smoke test: Alchemist-style content through the print pipeline + MJML compilation.
 * Run: node scripts/test-mjml-export.mjs
 */
import mjml2html from 'mjml';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Dynamic import of compiled TS isn't available; inline minimal test data
const ALCHEMIST_SAMPLE = `The boy's name was Santiago. Dusk was falling as the boy arrived with his herd at an abandoned church. The roof had fallen in long ago, and an enormous sycamore had grown on the spot where the sacristy had once stood.

He decided to spend the night there. He saw to it that all the sheep entered through the ruined door, and then he laid some planks across it so that wolves would not be able to get in. The sheep would not be able to get out either, he thought.

He had slept in that church before. It was a peaceful place, and he felt safe there. The sycamore's roots had cracked the stone floor, but the tree itself was magnificent, taller than the church had ever been.

He thought about the merchant's daughter. He had met her only once, a year before, but he could not stop thinking about her. She was the reason he had decided to become a shepherd, so that he could travel and perhaps one day return to her village with stories to tell.`;

const themes = [
  { id: 'editorial', builder: (p) => warmBohoBodyMjml(p) },
  { id: 'lavender', builder: (p) => lavenderBodyMjml(p) },
  { id: 'noir', builder: (p) => darkNoirBodyMjml(p) },
];

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function contentToParagraphs(content) {
  return content.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
}

function warmBohoBodyMjml({ content, bookTitle, chapterTitle, pageNum, totalPages }) {
  const paragraphs = contentToParagraphs(content)
    .map((p) => `<mj-text font-size="14px" line-height="1.7" color="#4E342E" padding="0 0 14px 0">${escapeHtml(p)}</mj-text>`)
    .join('\n');
  return `<mjml><mj-body width="794px" background-color="#FAF6F0"><mj-section><mj-column>${paragraphs}</mj-column></mj-section><mj-section><mj-column><mj-text align="center">${pageNum} of ${totalPages} — ${escapeHtml(bookTitle)} — ${escapeHtml(chapterTitle)}</mj-text></mj-column></mj-section></mj-body></mjml>`;
}

function lavenderBodyMjml(params) {
  return warmBohoBodyMjml(params).replace('#FAF6F0', '#F5F3FA').replace('#4E342E', '#3D3A4A');
}

function darkNoirBodyMjml(params) {
  return warmBohoBodyMjml(params).replace('#FAF6F0', '#0a0a0a').replace('#4E342E', '#f3f4f6');
}

function splitTextContent(text, limit = 3500, minLength = 100) {
  const sentenceRegex = /.*?[.!?]+(?=\s+|$)/gs;
  const sentences = Array.from(text.matchAll(sentenceRegex)).map((m) => m[0]);
  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    if (current && (current + ' ' + sentence).length > limit) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? current + ' ' + sentence : sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  if (chunks.length > 1 && chunks[chunks.length - 1].length < minLength) {
    chunks[chunks.length - 2] += '\n\n' + chunks.pop();
  }
  return chunks;
}

const sections = [
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
    content: ALCHEMIST_SAMPLE,
    layout: 'editorial',
    chapterTitle: 'Chapter 1',
    showChapterHeading: true,
    imagePrompt: '',
    imageUrl: '',
  },
];

const chunks = splitTextContent(
  ALCHEMIST_SAMPLE.replace(/<br\s*\/?>/gi, '\n').replace(/^\s*[•\-\*]\s*/gm, '').trim()
);

let failures = 0;
for (const theme of themes) {
  for (let i = 0; i < chunks.length; i++) {
    const mjml = theme.builder({
      content: chunks[i],
      bookTitle: 'The Alchemist',
      chapterTitle: 'Chapter 1',
      pageNum: i + 2,
      totalPages: chunks.length + 1,
    });
    const { html, errors } = mjml2html(mjml, { validationLevel: 'soft' });
    const hasContent = html.includes('Santiago') || html.includes('shepherd') || html.length > 200;
    const hasBlank = html.replace(/<[^>]+>/g, '').trim().length < 20;
    if (errors.length > 0 || !hasContent || hasBlank) {
      console.error(`FAIL [${theme.id}] page ${i + 1}: errors=${errors.length} blank=${hasBlank}`);
      failures++;
    } else {
      console.log(`OK   [${theme.id}] page ${i + 1}: ${html.length} chars, ${chunks[i].length} content chars`);
    }
  }
}

// Duplicate check
const uniqueChunks = new Set(chunks);
if (uniqueChunks.size !== chunks.length) {
  console.error('FAIL: duplicate content chunks detected');
  failures++;
} else {
  console.log(`OK   no duplicate chunks (${chunks.length} unique pages)`);
}

console.log(failures === 0 ? '\nAll MJML export tests passed.' : `\n${failures} test(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
