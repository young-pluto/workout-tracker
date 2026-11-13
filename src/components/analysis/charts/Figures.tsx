import { useState } from 'react';
import type { Landmarks } from '../../../lib/analytics/landmarks';
import { linear, useWidth } from './scale';

/** 12-point trend in the de-emphasis hue with the latest value in the accent. */
export function Sparkline({ values, width = 64, height = 24, color = 'var(--viz-1)' }: { values: number[]; width?: number; height?: number; color?: string }) {
  if (values.length < 2) return <span style={{ width, height }} className="inline-block" />;
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const sx = linear([0, values.length - 1], [3, width - 4]);
  const sy = linear([lo, hi === lo ? lo + 1 : hi], [height - 4, 4]);
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join('');
  const last = values.length - 1;
  return (
    <svg width={width} height={height} aria-hidden="true" className="block shrink-0">
      <path d={d} fill="none" stroke="var(--viz-deemph)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={sx(last)} cy={sy(values[last])} r={3} fill={color} stroke="var(--viz-surface)" strokeWidth={1.5} />
    </svg>
  );
}

/**
 * One muscle's weekly sets against Israetel's landmarks: MEV→MAV and MAV→MRV
 * as lighter steps, MAV as the strongest step, past MRV in the critical tint.
 */
export function LandmarkBar({
  value,
  average,
  landmarks,
  max,
  personal,
}: {
  value: number;
  average: number;
  landmarks: Landmarks;
  max: number;
  personal?: [number, number] | null;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const sx = linear([0, max], [0, width]);
  const { mev, mav, mrv } = landmarks;
  const zones: Array<[number, number, string]> = [
    [0, mev, 'var(--viz-grid)'],
    [mev, mav[0], 'var(--viz-seq-1)'],
    [mav[0], mav[1], 'var(--viz-seq-3)'],
    [mav[1], mrv, 'var(--viz-seq-1)'],
    [mrv, max, 'color-mix(in srgb, var(--viz-critical) 22%, transparent)'],
  ];
  const H = personal ? 22 : 16;
  return (
    <div ref={ref} className="w-full" style={{ height: H }}>
      {width > 0 && (
        <svg width={width} height={H} aria-hidden="true" className="block overflow-visible">
          {zones.map(([a, b, fill], i) =>
            b > a ? <rect key={i} x={sx(a) + (i ? 1 : 0)} y={4} width={Math.max(0, sx(b) - sx(a) - (i ? 1 : 0))} height={8} fill={fill} rx={i === 0 || i === zones.length - 1 ? 4 : 0} /> : null
          )}
          {average > 0 && (
            <circle cx={sx(Math.min(average, max))} cy={8} r={4} fill="var(--viz-surface)" stroke="var(--viz-ink-2)" strokeWidth={1.5} />
          )}
          <circle
            cx={sx(Math.min(value, max))}
            cy={8}
            r={5.5}
            fill="var(--viz-ink)"
            stroke="var(--viz-surface)"
            strokeWidth={2}
          />
          {personal && (
            <g>
              <line x1={sx(personal[0])} x2={sx(Math.min(personal[1], max))} y1={19} y2={19} stroke="var(--viz-1)" strokeWidth={2} strokeLinecap="round" />
            </g>
          )}
        </svg>
      )}
    </div>
  );
}

export interface SegmentPart {
  key: string;
  label: string;
  value: number;
  color: string;
}

/** Tall segmented bar: one whole split into ≤ 6 parts, share printed where it fits. */
export function SegmentedBar({ parts, ariaLabel }: { parts: SegmentPart[]; ariaLabel: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  const visible = parts.filter((p) => p.value > 0);
  const gap = 2;
  const usable = Math.max(0, width - gap * (visible.length - 1));
  const widths = visible.map((p) => (p.value / total) * usable);
  const offsets = widths.map((_, i) => widths.slice(0, i).reduce((s, w) => s + w + gap, 0));
  return (
    <div ref={ref} className="w-full h-7" role="img" aria-label={`${ariaLabel}: ${parts.map((p) => `${p.label} ${Math.round((p.value / total) * 100)}%`).join(', ')}`}>
      {width > 0 && (
        <svg width={width} height={28} className="block" aria-hidden="true">
          {visible.map((p, i) => {
            const w = widths[i];
            const x = offsets[i];
            const pct = `${Math.round((p.value / total) * 100)}%`;
            return (
              <g key={p.key}>
                <rect x={x} y={0} width={Math.max(0, w)} height={28} rx={4} fill={p.color} />
                {w > pct.length * 7 + 10 && (
                  <text x={x + 7} y={18} fontSize={12} fontWeight={600} fill="#ffffff">
                    {pct}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

/** Small legend row: swatch + name (+ optional value), text in ink tokens. */
type LegendShape = 'rect' | 'line' | 'dot';

export function Legend({ items, shape = 'rect' }: { items: Array<{ label: string; color: string; value?: string; hollow?: boolean; shape?: LegendShape }>; shape?: LegendShape }) {
  return (
    <div className="flex flex-wrap gap-x-3.5 gap-y-1 text-[11px] text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          {(it.shape ?? shape) === 'line' ? (
            <span className="w-3 h-[2px] rounded-full" style={{ background: it.color }} />
          ) : (it.shape ?? shape) === 'dot' ? (
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={it.hollow ? { boxShadow: `inset 0 0 0 1.5px ${it.color}` } : { background: it.color }}
            />
          ) : (
            <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: it.color }} />
          )}
          {it.label}
          {it.value && <span className="tabular-nums text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] font-medium">{it.value}</span>}
        </span>
      ))}
    </div>
  );
}

/** 100% stacked columns (e.g. loading share per month), tap a column for its split. */
export function ShareColumns({
  columns,
  keys,
  ariaLabel,
}: {
  columns: Array<{ label: string; short: string; values: number[] }>;
  keys: Array<{ label: string; color: string }>;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const H = 72;
  const slot = columns.length ? width / columns.length : 0;
  const colW = Math.min(24, slot * 0.66);
  const shown = active ?? columns.length - 1;
  const col = columns[shown];
  const total = col ? col.values.reduce((s, v) => s + v, 0) || 1 : 1;
  return (
    <div>
      <div className="min-h-[18px] mb-1.5 text-[12px] text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)] tabular-nums">
        {col && (
          <>
            <span className="font-medium text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">{col.label}</span>
            {' · '}
            {keys.map((k, i) => `${k.label} ${Math.round((col.values[i] / total) * 100)}%`).join(' · ')}
          </>
        )}
      </div>
      <div ref={ref} className="w-full" style={{ height: H + 16 }}>
        {width > 0 && (
          <svg width={width} height={H + 16} role="img" aria-label={ariaLabel} style={{ touchAction: 'pan-y' }} onPointerLeave={() => setActive(null)}>
            {columns.map((c, i) => {
              const sum = c.values.reduce((s, v) => s + v, 0);
              const cx = slot * i + slot / 2;
              let y = H;
              return (
                <g key={c.label} onPointerDown={() => setActive(i)} onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}>
                  <rect x={slot * i} y={0} width={slot} height={H + 16} fill="transparent" />
                  {sum > 0 &&
                    c.values.map((v, k) => {
                      if (v <= 0) return null;
                      const h = (v / sum) * H;
                      y -= h;
                      return (
                        <rect
                          key={k}
                          x={cx - colW / 2}
                          y={y}
                          width={colW}
                          height={Math.max(0, h - 2)}
                          rx={2}
                          fill={keys[k].color}
                          opacity={active !== null && active !== i ? 0.5 : 1}
                        />
                      );
                    })}
                  <text x={cx} y={H + 13} fontSize={10} textAnchor="middle" fill="var(--viz-ink-muted)">
                    {columns.length > 8 && (columns.length - 1 - i) % 2 === 1 ? '' : c.short}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}
