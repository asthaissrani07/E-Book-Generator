import type { EbookSection } from './pdfParser';

/** Fetch a remote or local image URL and return a base64 data URI. */
export async function urlToBase64DataUri(url: string): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  try {
    const response = await fetch(url, {
      headers: { Accept: 'image/*,*/*' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      console.warn(`Image fetch failed (${response.status}): ${url.slice(0, 80)}`);
      return url;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg';
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.warn('Image base64 conversion failed:', url.slice(0, 80), err);
    return url;
  }
}

export function collectImageUrls(sections: EbookSection[]): string[] {
  const urls = new Set<string>();
  for (const section of sections) {
    if (section.imageUrl) urls.add(section.imageUrl);
    section.extraImageUrls?.forEach((u) => {
      if (u) urls.add(u);
    });
  }
  return [...urls];
}

/** Print export only needs the cover image — avoid fetching every section image. */
export function collectCoverImageUrls(sections: EbookSection[]): string[] {
  const cover = sections.find((s, i) => i === 0 || s.layout === 'cover');
  return cover?.imageUrl ? [cover.imageUrl] : [];
}

export async function buildImageBase64Map(urls: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  await Promise.all(
    urls.map(async (url) => {
      const dataUri = await urlToBase64DataUri(url);
      map.set(url, dataUri);
    })
  );
  return map;
}

/** Replace every img src and CSS url() reference with inlined base64 data URIs. */
export function inlineImagesInHtml(html: string, imageMap: Map<string, string>): string {
  let result = html;
  for (const [url, dataUri] of imageMap) {
    if (!dataUri || dataUri === url) continue;
    result = result.split(url).join(dataUri);
  }
  return result;
}

export function resolveImageSrc(url: string | undefined, imageMap: Map<string, string>): string {
  if (!url) return '';
  return imageMap.get(url) || url;
}
