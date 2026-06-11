import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  getExportImageForCapture,
  getPlaceholderImageUrl,
  getStockFallbackUrl,
  resolveImageUrl,
} from '@/lib/utils/imageHelper';

interface ResolvedImageProps {
  prompt: string;
  seed: number;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  eager?: boolean;
  /** PDF export: use cached/stock images only — no slow AI fetches. */
  exportMode?: boolean;
}

export const ResolvedImage: React.FC<ResolvedImageProps> = ({
  prompt,
  seed,
  alt,
  className = '',
  style,
  eager = false,
  exportMode = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instantSrc = useMemo(
    () => (exportMode ? getExportImageForCapture(prompt, seed) : getStockFallbackUrl(prompt, seed)),
    [exportMode, prompt, seed]
  );
  const [src, setSrc] = useState(instantSrc);
  const [upgrading, setUpgrading] = useState(false);
  const [visible, setVisible] = useState(eager || exportMode);

  useEffect(() => {
    setSrc(instantSrc);
  }, [instantSrc]);

  useEffect(() => {
    if (exportMode || eager) return;
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: eager ? '0px' : '120px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [eager]);

  useEffect(() => {
    if (exportMode || !visible) return;

    let cancelled = false;
    setUpgrading(true);

    resolveImageUrl(prompt, seed)
      .then((url) => {
        if (!cancelled && url) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc(getPlaceholderImageUrl(alt, seed));
      })
      .finally(() => {
        if (!cancelled) setUpgrading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [exportMode, visible, prompt, seed, alt]);

  const needsCrossOrigin = exportMode && !src.startsWith('blob:') && !src.startsWith('data:');

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {upgrading && !exportMode && (
        <div className="absolute top-1 right-1 z-10 bg-black/40 rounded-full p-0.5">
          <RefreshCw size={10} className="animate-spin text-white/90" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        style={style}
        crossOrigin={needsCrossOrigin ? 'anonymous' : undefined}
        onError={() => setSrc(getPlaceholderImageUrl(alt, seed))}
      />
    </div>
  );
};
