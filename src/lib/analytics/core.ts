/**
 * Calendar and statistics helpers shared by the analytics modules.
 *
 * Dates are handled as "day numbers" (days since 1970-01-01 for the calendar
 * date, independent of time zone) and Monday-based week indexes, so weekly
 * buckets never drift with DST or the device's clock offset.
 */

const DAY_MS = 86_400_000;

/** Days since 1970-01-01 for a YYYY-MM-DD string, or NaN if malformed. */
export function dayNumber(date: string): number {
  const [y, m, d] = (date || '').split('-').map(Number);
  if (!y || !m || !d) return NaN;
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

/** Day number for the device's local calendar date. */
export function localToday(now: Date = new Date()): number {
  return Math.round(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS);
}

/** 1970-01-05 (day 4) was a Monday; weeks run Monday–Sunday. */
export function weekOf(day: number): number {
  return Math.floor((day - 4) / 7);
}

export function weekStartDay(week: number): number {
  return week * 7 + 4;
}

export function dayToDate(day: number): Date {
  const utc = new Date(day * DAY_MS);
  return new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
}

/** "Nov 3" or "Nov 3, 2025" when not in the current year. */
export function formatDay(day: number, today?: number): string {
  const d = dayToDate(day);
  const ref = today !== undefined ? dayToDate(today) : new Date();
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() === ref.getFullYear() ? {} : { year: 'numeric' }),
  });
}

/** "Nov 2025" */
export function formatMonth(day: number): string {
  return dayToDate(day).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** "Nov" or "Jan '26" at a year boundary */
export function formatMonthShort(day: number): string {
  const d = dayToDate(day);
  return d.getMonth() === 0
    ? `Jan '${String(d.getFullYear()).slice(2)}`
    : d.toLocaleDateString('en-US', { month: 'short' });
}

export function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = parseFloat(value.replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

export function mean(values: number[]): number {
  if (values.length === 0) return NaN;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

export function quantile(values: number[], q: number): number {
  if (values.length === 0) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

export function median(values: number[]): number {
  return quantile(values, 0.5);
}

/** Least-squares slope and intercept of y over x. */
export function linearFit(xs: number[], ys: number[]): { slope: number; intercept: number } | null {
  const n = xs.length;
  if (n < 2) return null;
  const mx = mean(xs);
  const my = mean(ys);
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - mx) ** 2;
    sxy += (xs[i] - mx) * (ys[i] - my);
  }
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  return { slope, intercept: my - slope * mx };
}

/**
 * Theil–Sen slope (median of pairwise slopes): one odd session, say on a
 * different gym's cable stack, can't swing the trend the way it would a
 * least-squares fit.
 */
export function robustSlope(xs: number[], ys: number[]): number | null {
  const slopes: number[] = [];
  for (let i = 0; i < xs.length; i++) {
    for (let j = i + 1; j < xs.length; j++) {
      if (xs[j] !== xs[i]) slopes.push((ys[j] - ys[i]) / (xs[j] - xs[i]));
    }
  }
  return slopes.length ? median(slopes) : null;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

export function round(v: number, step = 1): number {
  return Math.round(v / step) * step;
}
