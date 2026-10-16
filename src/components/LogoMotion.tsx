'use client';

import { useId, useState, type CSSProperties } from 'react';
import { BRAND } from '@/lib/brand';
import '@/styles/logo-motion.css';

/**
 * شعار مَسرى المتحرك — بلا توهّج أو حلقة ضوء خلف الدائرة.
 * - size: عرض الشعار بالبكسل
 * - theme: 'dark' على خلفية داكنة (الافتراضي)، 'light' على خلفية فاتحة
 * - showWordmark: إظهار «مَسرى» وMASRA تحت الشعار (مخفي حاليًا)
 * - replayOnClick: إعادة الحركة عند الضغط
 */
interface LogoMotionProps {
  size?: number;
  theme?: 'light' | 'dark';
  showWordmark?: boolean;
  replayOnClick?: boolean;
  className?: string;
}

export default function LogoMotion({
  size = 160,
  theme = 'dark',
  showWordmark = false,
  replayOnClick = false,
  className,
}: LogoMotionProps) {
  const gradId = `ml-grad-${useId().replace(/:/g, '')}`;
  const [playKey, setPlayKey] = useState(0);

  return (
    <div
      key={playKey}
      className={`ml-root${className ? ` ${className}` : ''}`}
      data-theme={theme}
      data-clickable={replayOnClick ? 'true' : 'false'}
      style={{ '--ml-size': `${size}px` } as CSSProperties}
      onClick={replayOnClick ? () => setPlayKey((k) => k + 1) : undefined}
    >
      <svg className="ml-mark" viewBox="18 22 64 54" role="img" aria-label={BRAND.ar.name}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--ml-ink-2)" />
            <stop offset="100%" stopColor="var(--ml-ink)" />
          </linearGradient>
        </defs>

        <path className="ml-leg ml-leg--a" d="M 38.91 53.19 L 38.91 70.91 L 24.21 70.91 L 24.21 49.41 L 24.28 49.41 C 25.10 49.41 25.92 49.44 26.73 49.51 C 31.13 49.87 35.25 51.16 38.91 53.19" />
        <path className="ml-leg ml-leg--b" d="M 75.78 49.41 L 75.78 70.91 L 61.21 70.91 L 61.21 53.09 C 64.82 51.12 68.88 49.86 73.20 49.51 C 74.01 49.44 74.83 49.41 75.66 49.41 Z M 75.78 49.41" />
        <path
          className="ml-wings"
          pathLength={1}
          fill={`url(#${gradId})`}
          d="M 75.69 36.60 C 70.46 36.60 65.55 37.93 61.28 40.28 C 57.78 42.19 54.71 44.78 52.24 47.87 C 51.82 48.39 51.43 48.92 51.05 49.47 C 50.68 50.00 50.33 50.53 50 51.08 C 49.66 50.53 49.31 50.00 48.94 49.47 C 48.56 48.92 48.17 48.39 47.75 47.87 C 45.31 44.82 42.28 42.25 38.84 40.35 C 34.53 37.96 29.58 36.60 24.30 36.60 L 24.21 36.60 L 24.21 47.87 L 24.31 47.87 C 27.70 47.87 30.96 48.43 34 49.47 C 35.68 50.05 37.30 50.76 38.84 51.62 C 41.33 53.00 43.60 54.73 45.60 56.73 C 45.73 56.87 45.87 57.01 46.00 57.14 C 46.02 57.16 46.03 57.18 46.05 57.20 C 46.07 57.22 46.09 57.25 46.11 57.26 C 46.16 57.32 46.21 57.36 46.25 57.41 C 46.35 57.51 46.44 57.62 46.53 57.72 C 46.64 57.83 46.74 57.94 46.83 58.05 C 46.85 58.08 46.87 58.10 46.89 58.12 C 46.98 58.21 47.06 58.31 47.14 58.40 C 47.24 58.51 47.33 58.64 47.43 58.75 C 47.55 58.90 47.67 59.05 47.79 59.19 C 47.80 59.20 47.80 59.21 47.80 59.21 C 47.91 59.34 48.01 59.47 48.11 59.60 C 48.12 59.61 48.12 59.61 48.12 59.62 C 48.17 59.68 48.23 59.75 48.28 59.82 C 48.40 59.98 48.52 60.15 48.64 60.31 C 48.65 60.33 48.67 60.35 48.67 60.36 C 48.68 60.37 48.69 60.38 48.70 60.39 C 48.83 60.58 48.96 60.76 49.08 60.94 C 49.12 61.00 49.16 61.05 49.19 61.10 C 49.33 61.30 49.45 61.5 49.58 61.69 C 49.72 61.91 49.86 62.14 50.00 62.36 C 50.13 62.14 50.27 61.91 50.41 61.69 C 51.22 60.44 52.12 59.25 53.10 58.13 L 53.10 58.12 C 53.52 57.65 53.95 57.18 54.40 56.73 C 56.40 54.71 58.69 52.98 61.20 51.60 C 61.23 51.58 61.25 51.56 61.28 51.55 C 62.78 50.73 64.35 50.03 66 49.47 C 69.04 48.43 72.30 47.87 75.69 47.87 L 75.78 47.87 L 75.78 36.60 Z M 75.69 36.60"
        />
        <circle className="ml-dot" cx="50" cy="35.8" r="6.73" />
      </svg>

      {showWordmark && (
        <div className="ml-word">
          <span className="ml-word-ar">{BRAND.ar.name}</span>
          <span className="ml-word-en">{BRAND.en.name}</span>
        </div>
      )}
    </div>
  );
}
