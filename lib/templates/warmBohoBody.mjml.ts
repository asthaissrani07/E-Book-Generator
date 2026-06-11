import type { BodyMjmlParams } from './mjmlTypes';
import { contentToParagraphs, escapeHtml } from './mjmlUtils';

export function warmBohoBodyMjml({
  content,
  bookTitle,
  chapterTitle,
  pageNum,
  totalPages,
}: BodyMjmlParams): string {
  const paragraphs = contentToParagraphs(content)
    .map(
      (p) =>
        `<mj-text font-family="Lora, Georgia, serif" font-size="13px" line-height="1.6" color="#4E342E" padding="0 0 10px 0" align="justify">${escapeHtml(p)}</mj-text>`
    )
    .join('\n');

  return `<mjml>
  <mj-head>
    <mj-font name="Playfair Display" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&display=swap" />
    <mj-font name="Lora" href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600&display=swap" />
    <mj-attributes>
      <mj-all font-family="Lora, Georgia, serif" />
      <mj-body width="794px" background-color="#FAF6F0" />
    </mj-attributes>
    <mj-style inline="inline">
      .page-header { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; }
      .page-footer { font-size: 11px; font-family: monospace; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#FAF6F0" width="794px">
    <mj-wrapper padding="60px 50px 0 50px" background-color="#FAF6F0">
      <mj-section padding="0 0 8px 0" border-bottom="1px solid rgba(139, 69, 19, 0.15)">
        <mj-column width="50%">
          <mj-text css-class="page-header" color="#8D6E63" font-family="Playfair Display, Georgia, serif" padding="0">${escapeHtml(bookTitle)}</mj-text>
        </mj-column>
        <mj-column width="50%">
          <mj-text css-class="page-header" align="right" color="#8B4513" font-weight="600" padding="0">${escapeHtml(chapterTitle)}</mj-text>
        </mj-column>
      </mj-section>
      <mj-section padding="24px 0 16px 0">
        <mj-column>
          ${paragraphs || '<mj-text font-size="14px" color="#4E342E" padding="0"> </mj-text>'}
        </mj-column>
      </mj-section>
      <mj-section padding="16px 0 40px 0">
        <mj-column>
          <mj-text css-class="page-footer" align="center" color="#8D6E63" padding="0">${pageNum} of ${totalPages}</mj-text>
        </mj-column>
      </mj-section>
    </mj-wrapper>
  </mj-body>
</mjml>`;
}
