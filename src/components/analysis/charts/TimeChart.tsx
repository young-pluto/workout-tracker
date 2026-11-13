import { useMemo, useState, type ReactNode } from 'react';
import { AXIS_FONT, linear, niceDomain, useWidth } from './scale';

export interface TimeSeries {
  key: string;
  label: string;
  values: Array<number | null>;
  kind: 'line' | 'column';
  color: string;
  /** Per-point color override (columns only), e.g. deload weeks */
  colors?: Array<string | undefined>;
  /** Points drawn hollow and left out of the line (e.g. outlier sessions) */
  hollow?: boolean[];
  /** Draw a dot at every point (sparse series) */
  dots?: boolean;
}

export interface TimeBand {
  from: number; // day
  to: number; // day (exclusive)
  fill: string;
  label?: string;
}

interface TimeChartProps {
  xs: number[]; // day numbers, ascending, one per point
  series: TimeSeries[];
  bands?: TimeBand[];
  height?: number;
  includeZero?: boolean;
  yDomain?: [number, number];
  yTickCount?: number;
  formatY: (v: number) => string;
  xTickLabel: (day: number) => string;
  /** Header line above the plot for the point under the finger (defaults to the last point) */
  readout: (index: number) => ReactNode;
  /** Shown instead of the last point's readout while nothing is touched */
  idle?: ReactNode;
  refLine?: { y: number; label: string };
  ariaLabel: string;
  table: { columns: string[]; row: (index: number) => string[] };
}

const M = { top: 6, right: 8, bottom: 18 };

export function TimeChart({
  xs,
  series,
  bands = [],
  height = 132,
  includeZero = false,
  yDomain,
  yTickCount = 3,
  formatY,
  xTickLabel,
  readout,
  idle,
  refLine,
  ariaLabel,
  table,
}: TimeChartProps) {
  const [wrapRef, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const bandTop = bands.some((b) => b.label) ? 14 : 0;

  const { domain, ticks } = useMemo(() => {
    if (yDomain) return { domain: yDomain, ticks: niceDomain(yDomain, yTickCount).ticks.filter((t) => t >= yDomain[0] && t <= yDomain[1]) };
    const values = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
    if (refLine) values.push(refLine.y);
    return niceDomain(values, yTickCount, includeZero || series.some((s) => s.kind === 'column'));
  }, [series, yDomain, yTickCount, includeZero, refLine]);

  const left = Math.max(22, Math.max(...ticks.map((t) => formatY(t).length)) * 5.8 + 6);
  const plotW = Math.max(0, width - left - M.right);
  const plotH = height;
  const top = M.top + bandTop;
  const svgH = top + plotH + M.bottom;

  const hasColumns = series.some((s) => s.kind === 'column');
  const minGap = xs.length > 1 ? Math.min(...xs.slice(1).map((x, i) => x - xs[i])) : 7;
  const pad = hasColumns ? minGap / 2 : 0;
  const x0 = xs.length ? xs[0] - pad : 0;
  const x1 = xs.length ? xs[xs.length - 1] + pad : 1;
  const sx = linear([x0, x1 === x0 ? x0 + 1 : x1], [left, left + plotW]);
  const sy = linear(domain, [top + plotH, top]);
  const colW = hasColumns ? Math.max(1.5, Math.min(24, ((plotW / Math.max(1, (x1 - x0) / minGap)) * 0.72))) : 0;

  // Month ticks, thinned to fit.
  const xTicks = useMemo(() => {
    const out: number[] = [];
    let lastLabel = '';
    xs.forEach((d, i) => {
      const label = xTickLabel(d);
      if (label !== lastLabel) {
        out.push(i);
        lastLabel = label;
      }
    });
    const maxTicks = Math.max(2, Math.floor(plotW / 54));
    const step = Math.ceil(out.length / maxTicks);
    return out.filter((_, i) => i % step === 0);
  }, [xs, xTickLabel, plotW]);

  const nearest = (clientX: number, rect: DOMRect) => {
    const px = clientX - rect.left;
    let best = 0;
    let bestDist = Infinity;
    xs.forEach((d, i) => {
      const dist = Math.abs(sx(d) - px);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    });
    return best;
  };

  const shown = active ?? xs.length - 1;

  return (
    <div>
      <div className="min-h-[38px] mb-1">{xs.length > 0 && (active === null && idle ? idle : readout(shown))}</div>
      <div ref={wrapRef} className="relative w-full" style={{ height: svgH }}>
        {width > 0 && xs.length > 0 && (
          <svg
            width={width}
            height={svgH}
            role="img"
            aria-label={ariaLabel}
            className="block select-none"
            style={{ touchAction: 'pan-y' }}
            onPointerDown={(e) => setActive(nearest(e.clientX, e.currentTarget.getBoundingClientRect()))}
            onPointerMove={(e) => {
              if (e.pointerType === 'mouse' || e.buttons) setActive(nearest(e.clientX, e.currentTarget.getBoundingClientRect()));
            }}
            onPointerLeave={() => setActive(null)}
            onPointerCancel={() => setActive(null)}
          >
            {bands.map((b, i) => {
              const bx0 = Math.max(left, sx(b.from));
              const bx1 = Math.min(left + plotW, sx(b.to));
              if (bx1 - bx0 < 1) return null;
              return (
                <g key={i}>
                  <rect x={bx0} y={top} width={bx1 - bx0} height={plotH} fill={b.fill} />
                  {b.label && bx1 - bx0 > b.label.length * 5.5 + 6 && (
                    <text x={bx0 + 3} y={M.top + 9} fontSize={AXIS_FONT} fill="var(--viz-ink-muted)">
                      {b.label}
                    </text>
                  )}
                </g>
              );
            })}

            {ticks.map((t) => (
              <g key={t}>
                <line x1={left} x2={left + plotW} y1={sy(t)} y2={sy(t)} stroke="var(--viz-grid)" strokeWidth={1} />
                <text x={left - 6} y={sy(t) + 3.5} fontSize={AXIS_FONT} textAnchor="end" fill="var(--viz-ink-muted)" className="tabular-nums">
                  {formatY(t)}
                </text>
              </g>
            ))}

            {refLine && (
              <g>
                <line x1={left} x2={left + plotW} y1={sy(refLine.y)} y2={sy(refLine.y)} stroke="var(--viz-axis)" strokeWidth={1} />
              </g>
            )}

            {series.map((s) => {
              if (s.kind === 'column') {
                const base = sy(Math.max(domain[0], 0));
                return (
                  <g key={s.key}>
                    {s.values.map((v, i) => {
                      if (v === null || v <= 0) return null;
                      const cx = sx(xs[i]);
                      const y = sy(v);
                      const h = Math.max(1, base - y);
                      const r = Math.min(4, colW / 2, h);
                      const xL = cx - colW / 2;
                      const d = `M${xL},${base} V${y + r} Q${xL},${y} ${xL + r},${y} H${xL + colW - r} Q${xL + colW},${y} ${xL + colW},${y + r} V${base} Z`;
                      return <path key={i} d={d} fill={s.colors?.[i] ?? s.color} opacity={active !== null && active !== i ? 0.55 : 1} />;
                    })}
                  </g>
                );
              }
              const segs: string[] = [];
              let cur = '';
              s.values.forEach((v, i) => {
                if (v === null || s.hollow?.[i]) {
                  if (v === null && cur) {
                    segs.push(cur);
                    cur = '';
                  }
                  return;
                }
                cur += `${cur ? 'L' : 'M'}${sx(xs[i]).toFixed(1)},${sy(v).toFixed(1)}`;
              });
              if (cur) segs.push(cur);
              const lastIdx = s.values.map((v, i) => (v !== null && !s.hollow?.[i] ? i : -1)).filter((i) => i >= 0).pop();
              return (
                <g key={s.key}>
                  {segs.map((d, i) => (
                    <path key={i} d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                  ))}
                  {s.values.map((v, i) =>
                    v !== null && s.hollow?.[i] ? (
                      <circle key={`h${i}`} cx={sx(xs[i])} cy={sy(v)} r={3} fill="var(--viz-surface)" stroke={s.color} strokeWidth={1.5} opacity={0.7} />
                    ) : v !== null && s.dots ? (
                      <circle key={`d${i}`} cx={sx(xs[i])} cy={sy(v)} r={3} fill={s.color} stroke="var(--viz-surface)" strokeWidth={1.5} />
                    ) : null
                  )}
                  {lastIdx !== undefined && active === null && (
                    <circle cx={sx(xs[lastIdx])} cy={sy(s.values[lastIdx] as number)} r={4} fill={s.color} stroke="var(--viz-surface)" strokeWidth={2} />
                  )}
                </g>
              );
            })}

            {active !== null && (
              <g pointerEvents="none">
                <line x1={sx(xs[active])} x2={sx(xs[active])} y1={top} y2={top + plotH} stroke="var(--viz-axis)" strokeWidth={1} />
                {series
                  .filter((s) => s.kind === 'line' && s.values[active] !== null)
                  .map((s) => (
                    <circle key={s.key} cx={sx(xs[active])} cy={sy(s.values[active] as number)} r={4.5} fill={s.color} stroke="var(--viz-surface)" strokeWidth={2} />
                  ))}
              </g>
            )}

            <line x1={left} x2={left + plotW} y1={top + plotH} y2={top + plotH} stroke="var(--viz-axis)" strokeWidth={1} />
            {xTicks.map((i) => (
              <text
                key={i}
                x={Math.min(Math.max(sx(xs[i]), left + 12), left + plotW - 12)}
                y={top + plotH + 13}
                fontSize={AXIS_FONT}
                textAnchor="middle"
                fill="var(--viz-ink-muted)"
              >
                {xTickLabel(xs[i])}
              </text>
            ))}
          </svg>
        )}
      </div>
      {/* Screen-reader table view; the wrapper (not the table) clips, so it never widens the page. */}
      <div className="sr-only">
      <table>
        <caption>{ariaLabel}</caption>
        <thead>
          <tr>
            {table.columns.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {xs.map((_, i) => (
            <tr key={i}>
              {table.row(i).map((c, j) => (
                <td key={j}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
