import type { BodyMjmlParams } from './mjmlTypes';
import { contentToParagraphs, escapeHtml } from './mjmlUtils';

export function darkNoirBodyMjml({
  content,
  bookTitle,
  chapterTitle,
  pageNum,
  totalPages,
}: BodyMjmlParams): string {
  const paragraphs = contentToParagraphs(content)
    .map(
      (p) =>
        `<mj-text font-family="Inter, sans-serif" font-size="13px" line-height="1.6" color="#f3f4f6" padding="0 0 10px 0" align="justify">${escapeHtml(p)}</mj-text>`
    )
    .join('\n');

  return `<mjml>
  <mj-head>
    <mj-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" />
    <mj-font name="Montserrat" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&display=swap" />
    <mj-attributes>
      <mj-all font-family="Inter, sans-serif" />
      <mj-body width="794px" background-color="#0a0a0a" />
    </mj-attributes>
    <mj-style inline="inline">
      .page-header { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; }
      .page-footer { font-size: 11px; font-family: monospace; }
    </mj-style>
  </mj-head>
  <mj-body background-color="#0a0a0a" width="794px">
    <mj-wrapper padding="60px 50px 0 50px" background-color="#0a0a0a">
      <mj-section padding="0 0 8px 0" border-bottom="1px solid rgba(255, 255, 255, 0.08)">
        <mj-column width="50%">
          <mj-text css-class="page-header" color="#9ca3af" font-family="Montserrat, sans-serif" padding="0">${escapeHtml(bookTitle)}</mj-text>
        </mj-column>
        <mj-column width="50%">
          <mj-text css-class="page-header" align="right" color="#ffffff" font-weight="600" padding="0">${escapeHtml(chapterTitle)}</mj-text>
        </mj-column>
      </mj-section>
      <mj-section padding="24px 0 16px 0">
        <mj-column>
          ${paragraphs || '<mj-text font-size="14px" color="#f3f4f6" padding="0"> </mj-text>'}
        </mj-column>
      </mj-section>
      <mj-section padding="16px 0 40px 0">
        <mj-column>
          <mj-text css-class="page-footer" align="center" color="#9ca3af" padding="0">${pageNum} of ${totalPages}</mj-text>
        </mj-column>
      </mj-section>
    </mj-wrapper>
  </mj-body>
</mjml>`;
}
