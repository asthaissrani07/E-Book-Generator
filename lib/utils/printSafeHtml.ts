/** Exact print-color-adjust rules — required for Save as PDF to keep backgrounds/images. */
export const PRINT_COLOR_ADJUST_CSS = `
* {
  -webkit-print-color-adjust: exact !important;
  print-color-adjust: exact !important;
  color-adjust: exact !important;
}

@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }
  body {
    margin: 0 !important;
    padding: 0 !important;
  }
}
`;

export const PRINT_SAFE_HEAD_STYLES = `${PRINT_COLOR_ADJUST_CSS}
@page { size: 794px 1123px; margin: 0; }
html, body { margin: 0 !important; padding: 0 !important; box-sizing: border-box !important; }
`;

/** Remove class attributes so print/PDF cannot depend on stylesheet selectors. */
export function stripHtmlClasses(html: string): string {
  return html
    .replace(/\sclass="[^"]*"/gi, '')
    .replace(/\sclass='[^']*'/gi, '');
}

/** Remove embedded <style> blocks from body only — preserve <head> print CSS. */
export function stripContentStyleTags(html: string): string {
  const headClose = html.search(/<\/head>/i);
  if (headClose === -1) {
    return html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  }
  const headPart = html.slice(0, headClose + 7);
  const bodyPart = html.slice(headClose + 7);
  return headPart + bodyPart.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
}

/** Extract non-data image URLs from HTML (img src and css url()). */
export function extractImageUrlsFromHtml(html: string): string[] {
  const urls = new Set<string>();
  const patterns = [
    /src=["']((?!data:)[^"']+)["']/gi,
    /url\(["']?((?!data:)[^"')]+)["']?\)/gi,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) !== null) {
      const url = match[1]?.trim();
      if (url && !url.startsWith('data:')) {
        urls.add(decodeURIComponent(url));
        urls.add(url);
      }
    }
  }
  return [...urls];
}

export function inlineImagesInHtml(html: string, imageMap: Map<string, string>): string {
  let result = html;
  for (const [url, dataUri] of imageMap) {
    if (!dataUri || !dataUri.startsWith('data:')) continue;
    if (url === dataUri) continue;
    result = result.split(url).join(dataUri);
    const encoded = encodeURIComponent(url);
    if (encoded !== url) {
      result = result.split(encoded).join(dataUri);
    }
  }
  return result;
}

/** Strip external stylesheet links from page body content only. */
export function stripExternalStylesheets(html: string): string {
  return html.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, '');
}

export function makePageContentPrintSafe(html: string, imageMap: Map<string, string>): string {
  let safe = stripContentStyleTags(html);
  safe = stripExternalStylesheets(safe);
  safe = stripHtmlClasses(safe);
  safe = inlineImagesInHtml(safe, imageMap);
  return safe;
}
