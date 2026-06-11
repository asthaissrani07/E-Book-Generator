import { getThemeImageSlots } from '../themes/themeImagePrompts';
import type { ThemeId } from '../themes/types';

/** Truncate and sanitize text for use inside an SVG label. */
function sanitizeLabel(text: string, maxLen = 48): string {
  return text
    .replace(/[<>&"']/g, '')
    .trim()
    .slice(0, maxLen);
}

function hashCode(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function truncatePrompt(prompt: string, maxLen = 380): string {
  return prompt.replace(/\s+/g, ' ').trim().slice(0, maxLen);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function placeholderSubtitle(): string {
  if (!hasPollinationsApiKey()) {
    return 'Add VITE_POLLINATIONS_API_KEY to your .env file';
  }
  if (lastPollinationsError?.includes('402') || lastPollinationsError?.includes('PAYMENT_REQUIRED')) {
    return 'Add Pollen credits at enter.pollinations.ai';
  }
  return 'Image unavailable — click refresh on the page';
}

let lastPollinationsError: string | null = null;
/** After a 402/401, skip slow Pollinations calls for the rest of this session. */
let pollinationsExhausted = false;

export function getLastPollinationsError(): string | null {
  return lastPollinationsError;
}

export function isPollinationsExhausted(): boolean {
  return pollinationsExhausted;
}

function isNonRetryablePollinationsError(message: string): boolean {
  return (
    message.includes('402') ||
    message.includes('401') ||
    message.includes('403') ||
    message.includes('PAYMENT_REQUIRED') ||
    message.includes('UNAUTHORIZED')
  );
}

/** Local SVG placeholder — always loads, works in preview and PDF export. */
export function getPlaceholderImageUrl(label: string, seed = 0, subtitle?: string): string {
  const palette = ['#c96f4a', '#d4845a', '#b45309', '#8b5cf6', '#059669', '#0369a1'];
  const color = palette[Math.abs(seed) % palette.length];
  const title = sanitizeLabel(label || 'Illustration');
  const sub = sanitizeLabel(subtitle || placeholderSubtitle(), 72);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0.04"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#bg)"/>
  <rect x="48" y="48" width="704" height="504" rx="16" fill="none" stroke="${color}" stroke-width="2" stroke-opacity="0.35"/>
  <circle cx="400" cy="230" r="48" fill="${color}" fill-opacity="0.15"/>
  <path d="M380 230 L400 210 L420 230 L400 250 Z" fill="${color}" fill-opacity="0.5"/>
  <text x="400" y="320" text-anchor="middle" font-family="Georgia,serif" font-size="22" fill="${color}">${title}</text>
  <text x="400" y="355" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#64748b">${sub}</text>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function hasPollinationsApiKey(): boolean {
  return Boolean(process.env.VITE_POLLINATIONS_API_KEY);
}

export interface ImageSlot {
  prompt: string;
  seed: number;
}

export interface EditorialImageSet {
  primary: ImageSlot;
  extras: ImageSlot[];
  prompts: string[];
}

/** @deprecated Use getThemeImageSlots with a theme id */
export function getEditorialImageSlots(
  chapterTitle: string,
  bookTitle: string,
  pageIndex: number
): EditorialImageSet {
  return getThemeImageSlots('editorial', chapterTitle, bookTitle, pageIndex);
}

export function getThemeImageSlotsForPage(
  themeId: ThemeId,
  chapterTitle: string,
  bookTitle: string,
  pageIndex: number
): EditorialImageSet {
  return getThemeImageSlots(themeId, chapterTitle, bookTitle, pageIndex);
}

/** Stock photo fallback — stable per prompt/seed, works without Pollen credits. */
export function getStockFallbackUrl(prompt: string, seed: number, width = 800, height = 600): string {
  const id = hashCode(`${prompt}|${seed}`);
  return `https://picsum.photos/seed/${id}/${width}/${height}`;
}

class RequestQueue {
  private pending: Array<() => Promise<void>> = [];
  private active = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
  }

  add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.pending.push(async () => {
        try {
          resolve(await task());
        } catch (err) {
          reject(err);
        }
      });
      this.pump();
    });
  }

  private pump(): void {
    while (this.active < this.maxConcurrent && this.pending.length > 0) {
      const job = this.pending.shift();
      if (!job) return;
      this.active++;
      job().finally(() => {
        this.active--;
        this.pump();
      });
    }
  }
}

const imageQueue = new RequestQueue(5);
const resolvedCache = new Map<string, string>();
const blobUrls = new Set<string>();
/** In-memory JPEG data URLs for instant PDF capture (no network/CORS during export). */
const exportDataUrlCache = new Map<string, string>();

export function clearExportImageCache(): void {
  exportDataUrlCache.clear();
}

export function cacheExportImageDataUrl(prompt: string, seed: number, dataUrl: string): void {
  exportDataUrlCache.set(cacheKey(prompt, seed), dataUrl);
}

export function getExportImageForCapture(prompt: string, seed = 0): string {
  const cached = exportDataUrlCache.get(cacheKey(prompt, seed));
  if (cached) return cached;
  return getExportSafeImageUrl(prompt, seed);
}

export function invalidateImageCache(prompt: string, seed: number): void {
  resolvedCache.delete(cacheKey(prompt, seed));
}

export function invalidateEditorialCache(
  chapterTitle: string,
  bookTitle: string,
  pageIndex: number,
  themeId: ThemeId = 'editorial'
): void {
  const slots = getThemeImageSlots(themeId, chapterTitle, bookTitle, pageIndex);
  invalidateImageCache(slots.primary.prompt, slots.primary.seed);
  slots.extras.forEach((slot) => invalidateImageCache(slot.prompt, slot.seed));
}

function cacheKey(prompt: string, seed: number): string {
  return `${seed}::${truncatePrompt(prompt)}`;
}

async function fetchPollinationsBlob(prompt: string, seed: number): Promise<Blob> {
  const apiKey = process.env.VITE_POLLINATIONS_API_KEY as string | undefined;
  if (!apiKey) {
    throw new Error('No Pollinations API key configured');
  }

  const safePrompt = truncatePrompt(prompt);
  const params = new URLSearchParams({
    model: 'flux',
    width: '800',
    height: '600',
    seed: String(seed),
    nologo: 'true',
  });

  const url = `https://gen.pollinations.ai/image/${encodeURIComponent(safePrompt)}?${params.toString()}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!response.ok) {
    const body = await response.text();
    lastPollinationsError = `${response.status}: ${body.slice(0, 200)}`;
    if (isNonRetryablePollinationsError(lastPollinationsError)) {
      pollinationsExhausted = true;
    }
    throw new Error(lastPollinationsError);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    const body = await response.text();
    lastPollinationsError = `Invalid response type: ${contentType} — ${body.slice(0, 120)}`;
    throw new Error(lastPollinationsError);
  }

  lastPollinationsError = null;
  return response.blob();
}

/**
 * Resolve an illustration to a displayable URL.
 * Queues Pollinations requests, retries on failure, and falls back to stock photos
 * so every image slot always renders a real photograph.
 */
/** Fast, CORS-safe URL for PDF export — never triggers async Pollinations calls. */
export function getExportSafeImageUrl(prompt: string, seed = 0): string {
  const key = cacheKey(prompt, seed);
  const cached = resolvedCache.get(key);
  if (
    cached &&
    (cached.startsWith('blob:') ||
      cached.startsWith('data:') ||
      cached.includes('picsum.photos'))
  ) {
    return cached;
  }
  return getStockFallbackUrl(prompt, seed);
}

export async function resolveImageUrl(prompt: string, seed = 0): Promise<string> {
  const key = cacheKey(prompt, seed);
  const cached = resolvedCache.get(key);
  if (cached) return cached;

  return imageQueue.add(async () => {
    const again = resolvedCache.get(key);
    if (again) return again;

    if (hasPollinationsApiKey() && !pollinationsExhausted) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const blob = await fetchPollinationsBlob(prompt, seed + attempt);
          const blobUrl = URL.createObjectURL(blob);
          blobUrls.add(blobUrl);
          resolvedCache.set(key, blobUrl);
          return blobUrl;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn(`Pollinations attempt ${attempt + 1} failed:`, err);
          if (isNonRetryablePollinationsError(msg)) break;
          if (attempt < 1) await delay(800);
        }
      }
    }

    const fallback = getStockFallbackUrl(prompt, seed);
    resolvedCache.set(key, fallback);
    return fallback;
  });
}

/** Synchronous URL builder kept for section state — actual display uses resolveImageUrl. */
export function buildImageUrl(prompt: string, seed = 0): string {
  if (hasPollinationsApiKey()) {
    const params = new URLSearchParams({
      model: 'flux',
      width: '800',
      height: '600',
      seed: String(seed),
      nologo: 'true',
      key: process.env.VITE_POLLINATIONS_API_KEY as string,
    });
    return `https://gen.pollinations.ai/image/${encodeURIComponent(truncatePrompt(prompt))}?${params.toString()}`;
  }
  return getStockFallbackUrl(prompt, seed);
}

/** Build URL references for all editorial slots (resolved lazily at render time). */
export function buildEditorialImageSet(
  chapterTitle: string,
  bookTitle: string,
  pageIndex: number
): { primary: string; extras: string[] } {
  const slots = getEditorialImageSlots(chapterTitle, bookTitle, pageIndex);
  return {
    primary: buildImageUrl(slots.primary.prompt, slots.primary.seed),
    extras: slots.extras.map((slot) => buildImageUrl(slot.prompt, slot.seed)),
  };
}

/** Ensure every section has a full set of editorial image URLs. */
export function ensureSectionImageUrls<T extends {
  layout: string;
  chapterTitle?: string;
  title: string;
  imageUrl: string;
  extraImageUrls?: string[];
  showImage?: boolean;
}>(
  sections: T[],
  bookTitle: string
): T[] {
  return sections.map((section, index) => {
    const pageIndex = index + 1;
    const imageSet = buildEditorialImageSet(
      section.chapterTitle || section.title,
      bookTitle,
      pageIndex
    );

    const extras = section.extraImageUrls?.length === 5
      ? section.extraImageUrls
      : imageSet.extras;

    return {
      ...section,
      showImage: section.showImage !== false,
      imageUrl: section.imageUrl || imageSet.primary,
      extraImageUrls: extras,
    };
  });
}
