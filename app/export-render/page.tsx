'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PrintPagesExport } from '@/app/components/PrintPagesExport';
import { getPrintExportRootElement } from '@/app/components/PrintPagesExport';
import type { EbookSection } from '@/lib/utils/pdfParser';
import type { ThemeId } from '@/lib/themes/types';
import type { PrintDimensions } from '@/lib/utils/printPageDimensions';
import { preloadPreviewImagesForExport } from '@/lib/utils/pdfExport';

interface RenderPayload {
  sections: EbookSection[];
  bookTitle: string;
  selectedTheme: ThemeId;
  customThemeStyles?: Record<string, string>;
  dimensions: PrintDimensions;
}

async function waitForImages(container: HTMLElement, timeoutMs: number): Promise<void> {
  const imgs = Array.from(container.querySelectorAll('img'));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          const done = () => resolve();
          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
          setTimeout(done, timeoutMs);
        })
    )
  );
}

function ExportRenderContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const token = searchParams.get('token');

  const [payload, setPayload] = useState<RenderPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Loading job…');

  useEffect(() => {
    if (!jobId || !token) {
      setError('Missing jobId or token');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/export-pdf/job/${encodeURIComponent(jobId)}/render-data?token=${encodeURIComponent(token)}`
        );
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || `Failed to load job (${res.status})`);
        }
        const data = (await res.json()) as RenderPayload;
        if (cancelled) return;

        setPayload(data);

        // Warm image cache in the background while React paints pages.
        void preloadPreviewImagesForExport(
          data.sections,
          data.bookTitle,
          data.selectedTheme,
          (loaded, total) => setStatus(`Loading preview images… (${loaded}/${total})`)
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [jobId, token]);

  useEffect(() => {
    if (!payload) return;

    let cancelled = false;
    const pageCount = payload.sections.length;
    const imageWaitMs = Math.min(90_000, Math.max(20_000, pageCount * 1_500));

    (async () => {
      setStatus('Rendering preview pages…');
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );
      if (cancelled) return;

      const mountDeadline = Date.now() + 120_000;
      while (Date.now() < mountDeadline && !cancelled) {
        const root = getPrintExportRootElement();
        const mounted = root?.querySelectorAll('.ebook-page-wrapper').length ?? 0;
        if (mounted >= pageCount) break;
        await new Promise<void>((r) => setTimeout(r, 300));
      }
      if (cancelled) return;

      const root = getPrintExportRootElement();
      if (root) {
        setStatus('Waiting for images to paint…');
        await waitForImages(root, imageWaitMs);
      }

      if ('fonts' in document) {
        try {
          await document.fonts.ready;
        } catch {
          /* ignore */
        }
      }

      await new Promise<void>((resolve) => setTimeout(resolve, 1500));
      if (cancelled) return;

      document.body.setAttribute('data-export-ready', 'true');
      setStatus('Ready for PDF capture');
    })();

    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (error) {
    return (
      <div data-export-error="true" style={{ padding: 24, fontFamily: 'sans-serif' }}>
        Export render failed: {error}
      </div>
    );
  }

  if (!payload) {
    return <div data-export-loading="true">{status}</div>;
  }

  const customThemeStyles = payload.customThemeStyles as React.CSSProperties | undefined;

  return (
    <>
      <div data-export-loading="false" style={{ display: 'none' }}>
        {status}
      </div>
      <PrintPagesExport
        sections={payload.sections}
        bookTitle={payload.bookTitle}
        selectedTheme={payload.selectedTheme}
        customThemeStyles={customThemeStyles}
        dimensions={payload.dimensions}
        matchPreview={true}
      />
    </>
  );
}

export default function ExportRenderPage() {
  return (
    <Suspense fallback={<div data-export-loading="true">Loading…</div>}>
      <ExportRenderContent />
    </Suspense>
  );
}
