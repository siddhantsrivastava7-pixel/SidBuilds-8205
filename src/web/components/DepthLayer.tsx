// ── DepthLayer ───────────────────────────────────────────────────────────
// Wraps a section. Applies:
//   - fade-in from darkness as section enters viewport
// NOTE: Parallax translate is intentionally removed — it caused gap at bottom.
// Depth feel comes from the star field layers in SystemBackground instead.

import { useEffect, useRef, ReactNode } from 'react';
import { useScrollCamera } from '../hooks/useScrollCamera';

interface Props {
  children: ReactNode;
  fadeIn?: boolean;
  fadeRange?: number;
  id?: string;
  style?: React.CSSProperties;
  speed?: number; // kept for API compat, unused
}

export default function DepthLayer({
  children,
  fadeIn = true,
  fadeRange = 380,
  id,
  style,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useScrollCamera((s) => {
    const el = ref.current;
    if (!el || !fadeIn) return;

    const rect     = el.getBoundingClientRect();
    const vh       = window.innerHeight;
    const entryPx  = vh - rect.top;
    const progress = Math.max(0, Math.min(1, entryPx / fadeRange));
    // Cubic ease-in
    const eased    = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    el.style.opacity = String(Math.max(0, Math.min(1, eased)));
  });

  return (
    <div
      ref={ref}
      id={id}
      style={{
        position: 'relative',
        opacity: fadeIn ? 0 : 1,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
