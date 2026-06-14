import type { ThemeId } from '@/lib/themes/types';

/** Event published by blog_service when a blog post should become a PDF. */
export interface BlogPdfGenerateEvent {
  eventType: 'blog.pdf.generate';
  /** Unique id for this export request (used as job id + filename key). */
  eventId: string;
  /** Blog post id in blog_service. */
  blogId: string;
  title: string;
  author?: string;
  /** HTML or plain text body from the blog. */
  content: string;
  excerpt?: string;
  coverImageUrl?: string;
  theme?: ThemeId;
  dimensions?: 'letter' | 'a4' | 'legal';
  requestedAt?: string;
}

/** Event published back to blog_service when PDF export succeeds. */
export interface BlogPdfCompletedEvent {
  eventType: 'blog.pdf.completed';
  eventId: string;
  blogId: string;
  filename: string;
  pageCount: number;
  downloadUrl: string;
  completedAt: string;
}

/** Event published back to blog_service when PDF export fails. */
export interface BlogPdfFailedEvent {
  eventType: 'blog.pdf.failed';
  eventId: string;
  blogId: string;
  error: string;
  failedAt: string;
}

export function isBlogPdfGenerateEvent(value: unknown): value is BlogPdfGenerateEvent {
  if (!value || typeof value !== 'object') return false;
  const e = value as Record<string, unknown>;
  return (
    e.eventType === 'blog.pdf.generate' &&
    typeof e.eventId === 'string' &&
    typeof e.blogId === 'string' &&
    typeof e.title === 'string' &&
    typeof e.content === 'string'
  );
}

export const VALID_THEME_IDS: ThemeId[] = [
  'editorial',
  'botanical',
  'modern',
  'noir',
  'wanderlust',
  'softpink',
  'comic',
  'sporty',
  'wellness',
  'newspaper',
  'bloodred',
  'minimalblack',
  'rose',
  'lavender',
  'bolddark',
];

export function resolveBlogTheme(theme?: string): ThemeId {
  if (!theme) return 'editorial';
  if (VALID_THEME_IDS.includes(theme as ThemeId)) return theme as ThemeId;
  throw new Error(
    `Unknown theme "${theme}". Available: ${VALID_THEME_IDS.join(', ')}`
  );
}
