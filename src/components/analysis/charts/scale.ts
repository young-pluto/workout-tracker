import { useLayoutEffect, useRef, useState } from 'react';

/** Width of an element, tracked with ResizeObserver (charts draw at real pixel size). */
export function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setWidth((prev) => (Math.abs(prev - w) > 0.5 ? w : prev));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}

export function linear(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (v: number) => r0 + ((v - d0) / span) * (r1 - r0);
}

/** About `count` round tick values covering [min, max]. */
export function niceTicks(min: number, max: number, count = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [];
  if (min === max) {
    const pad = Math.abs(min) * 0.1 || 1;
    min -= pad;
    max += pad;
  }
  const raw = (max - min) / Math.max(1, count);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const ticks: number[] = [];
  for (let v = Math.floor(min / step) * step; ticks.length < 50; v += step) {
    ticks.push(Math.round(v * 1e6) / 1e6);
    if (v >= max - step * 1e-6) break;
  }
  return ticks;
}

/** Domain padded to the outer nice ticks. */
export function niceDomain(values: number[], count = 4, includeZero = false): { domain: [number, number]; ticks: number[] } {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return { domain: [0, 1], ticks: [0, 1] };
  let lo = Math.min(...finite);
  const hi = Math.max(...finite);
  if (includeZero) lo = Math.min(0, lo);
  const ticks = niceTicks(lo, hi, count);
  return { domain: [ticks[0], ticks[ticks.length - 1]], ticks };
}

export const AXIS_FONT = 10;
