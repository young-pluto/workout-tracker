import { useState, type ReactNode } from 'react';
import { linear, niceTicks, useWidth } from './scale';

/**
 * Muscle × week heatmap (specialization timeline). Cells use one sequential
 * hue; an optional top ribbon shows the nutrition phase per week.
 */
export function Heatmap({
  rows,
  weeks,
  value,
  bin,
  binColors,
  ribbon,
  readout,
  idle,
  ariaLabel,
}: {
  rows: string[];
  weeks: number[];
  value: (row: string, week: number) => number;
  bin: (v: number) => number;
  binColors: string[];
  ribbon?: (week: number) => string | null;
  readout: (row: string, week: number) => ReactNode;
  idle: ReactNode;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<{ row: string; week: number } | null>(null);
  const labelW = 74;
  const cellH = 14;
  const gap = 1;
  const ribbonH = ribbon ? 5 : 0;
  const ribbonGap = ribbon ? 4 : 0;
  const plotW = Math.max(0, width - labelW);
  const cellW = weeks.length ? plotW / weeks.length : 0;
  const H = ribbonH + ribbonGap + rows.length * (cellH + gap);

  const pick = (clientX: number, clientY: number, rect: DOMRect) => {
    const x = clientX - rect.left - labelW;
    const y = clientY - rect.top - ribbonH - ribbonGap;
    if (x < 0 || y < 0) return;
    const wi = Math.min(weeks.length - 1, Math.floor(x / cellW));
    const ri = Math.min(rows.length - 1, Math.floor(y / (cellH + gap)));
    if (wi >= 0 && ri >= 0) setActive({ row: rows[ri], week: weeks[wi] });
  };

  return (
    <div>
      <div className="min-h-[18px] mb-2 text-[12px] text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)] tabular-nums">
        {active ? readout(active.row, active.week) : idle}
      </div>
      <div ref={ref} className="w-full" style={{ height: H }}>
        {width > 0 && (
          <svg
            width={width}
            height={H}
            role="img"
            aria-label={ariaLabel}
            className="block select-none"
            style={{ touchAction: 'pan-y' }}
            onPointerDown={(e) => pick(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
            onPointerMove={(e) => (e.pointerType === 'mouse' || e.buttons) && pick(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
            onPointerLeave={() => setActive(null)}
          >
            {ribbon &&
              weeks.map((w, i) => {
                const fill = ribbon(w);
                return fill ? <rect key={w} x={labelW + i * cellW} y={0} width={cellW + 0.5} height={ribbonH} fill={fill} /> : null;
              })}
            {rows.map((row, ri) => {
              const y = ribbonH + ribbonGap + ri * (cellH + gap);
              return (
                <g key={row}>
                  <text x={0} y={y + cellH - 3.5} fontSize={11} fill="var(--viz-ink-2)">
                    {row}
                  </text>
                  {weeks.map((w, wi) => {
                    const isActive = active?.row === row && active.week === w;
                    return (
                      <rect
                        key={w}
                        x={labelW + wi * cellW}
                        y={y}
                        width={Math.max(0.5, cellW - gap)}
                        height={cellH}
                        rx={Math.min(2, cellW / 3)}
                        fill={binColors[bin(value(row, w))]}
                        stroke={isActive ? 'var(--viz-ink)' : 'none'}
                        strokeWidth={isActive ? 1.5 : 0}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        )}
      </div>
    </div>
  );
}

/** Per-row dot strip: one dot per session along a shared axis with ceiling zones. */
export function DotStrip({
  rows,
  max,
  caution,
  ceiling,
  ariaLabel,
}: {
  rows: Array<{ label: string; values: number[]; note: string }>;
  max: number;
  caution: number;
  ceiling: number;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const labelW = 74;
  const rowH = 30;
  const plotW = Math.max(0, width - labelW - 6);
  const sx = linear([0, max], [labelW, labelW + plotW]);
  const ticks = niceTicks(0, max, 4).filter((t) => t <= max);
  const H = rows.length * rowH + 16;
  return (
    <div ref={ref} className="w-full" style={{ height: H }}>
      {width > 0 && (
        <svg width={width} height={H} role="img" aria-label={ariaLabel} className="block">
          <rect x={sx(caution)} y={0} width={sx(ceiling) - sx(caution)} height={rows.length * rowH} fill="color-mix(in srgb, var(--viz-warning) 16%, transparent)" />
          <rect x={sx(ceiling)} y={0} width={sx(max) - sx(ceiling)} height={rows.length * rowH} fill="color-mix(in srgb, var(--viz-critical) 14%, transparent)" />
          {rows.map((r, ri) => {
            const cy = ri * rowH + rowH / 2;
            return (
              <g key={r.label}>
                <text x={0} y={cy - 2} fontSize={11} fill="var(--viz-ink-2)">
                  {r.label}
                </text>
                <text x={0} y={cy + 10} fontSize={9.5} fill="var(--viz-ink-muted)" className="tabular-nums">
                  {r.note}
                </text>
                <line x1={labelW} x2={labelW + plotW} y1={cy} y2={cy} stroke="var(--viz-grid)" strokeWidth={1} />
                {r.values.map((v, i) => (
                  <circle
                    key={i}
                    cx={sx(Math.min(v, max))}
                    cy={cy + ((i % 3) - 1) * 3}
                    r={4}
                    fill="var(--viz-1)"
                    fillOpacity={0.55}
                    stroke="var(--viz-surface)"
                    strokeWidth={1}
                  />
                ))}
              </g>
            );
          })}
          {ticks.map((t) => (
            <text key={t} x={sx(t)} y={rows.length * rowH + 12} fontSize={10} textAnchor="middle" fill="var(--viz-ink-muted)">
              {t}
            </text>
          ))}
        </svg>
      )}
    </div>
  );
}

export interface ScatterPoint {
  x: number;
  y: number;
  color: string;
  key: string;
}

/** Dose–response scatter: nearest-point tap target, zero line, optional highlight band. */
export function Scatter({
  points,
  xLabel,
  formatY,
  band,
  readout,
  idle,
  ariaLabel,
}: {
  points: ScatterPoint[];
  xLabel: string;
  formatY: (v: number) => string;
  band?: [number, number] | null;
  readout: (p: ScatterPoint) => ReactNode;
  idle: ReactNode;
  ariaLabel: string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<string | null>(null);
  const H = 150;
  const left = 34;
  const bottom = 30;
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const xTicks = niceTicks(Math.min(0, ...xs), Math.max(4, ...xs), 4);
  const yAbs = Math.max(2, ...ys.map((v) => Math.abs(v)));
  const yTicks = niceTicks(-yAbs, yAbs, 4);
  const sx = linear([xTicks[0], xTicks[xTicks.length - 1]], [left, width - 8]);
  const sy = linear([yTicks[0], yTicks[yTicks.length - 1]], [H - bottom, 6]);
  const activePoint = points.find((p) => p.key === active) ?? null;

  const pick = (clientX: number, clientY: number, rect: DOMRect) => {
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    let best: ScatterPoint | null = null;
    let bestD = Infinity;
    for (const p of points) {
      const d = (sx(p.x) - px) ** 2 + (sy(p.y) - py) ** 2;
      if (d < bestD) {
        bestD = d;
        best = p;
      }
    }
    if (best && bestD < 40 * 40) setActive(best.key);
  };

  return (
    <div>
      <div className="min-h-[18px] mb-2 text-[12px] text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)] tabular-nums">
        {activePoint ? readout(activePoint) : idle}
      </div>
      <div ref={ref} className="w-full" style={{ height: H }}>
        {width > 0 && (
          <svg
            width={width}
            height={H}
            role="img"
            aria-label={ariaLabel}
            className="block select-none"
            style={{ touchAction: 'pan-y' }}
            onPointerDown={(e) => pick(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect())}
            onPointerLeave={() => setActive(null)}
          >
            {band && (
              <rect x={sx(band[0])} y={6} width={Math.max(0, sx(band[1]) - sx(band[0]))} height={H - bottom - 6} fill="color-mix(in srgb, var(--viz-1) 10%, transparent)" />
            )}
            {yTicks.map((t) => (
              <g key={t}>
                <line x1={left} x2={width - 8} y1={sy(t)} y2={sy(t)} stroke={t === 0 ? 'var(--viz-axis)' : 'var(--viz-grid)'} strokeWidth={1} />
                <text x={left - 5} y={sy(t) + 3.5} fontSize={10} textAnchor="end" fill="var(--viz-ink-muted)" className="tabular-nums">
                  {formatY(t)}
                </text>
              </g>
            ))}
            {xTicks.map((t) => (
              <text key={t} x={sx(t)} y={H - bottom + 13} fontSize={10} textAnchor="middle" fill="var(--viz-ink-muted)" className="tabular-nums">
                {t}
              </text>
            ))}
            <text x={(left + width - 8) / 2} y={H - 3} fontSize={10} textAnchor="middle" fill="var(--viz-ink-muted)">
              {xLabel}
            </text>
            {points.map((p) => (
              <circle
                key={p.key}
                cx={sx(p.x)}
                cy={sy(p.y)}
                r={p.key === active ? 6 : 4.5}
                fill={p.color}
                stroke="var(--viz-surface)"
                strokeWidth={2}
                opacity={active && p.key !== active ? 0.45 : 1}
              />
            ))}
          </svg>
        )}
      </div>
    </div>
  );
}
