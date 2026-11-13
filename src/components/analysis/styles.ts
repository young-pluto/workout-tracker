/** Shared class strings and number formatting for the Analysis tab. */
export const ink = 'text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]';
export const ink2 = 'text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]';
export const muted = 'text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]';
export const hairline = 'border-[var(--color-border-subtle)] dark:border-[var(--color-dark-border)]';
/** For divide-y lists (divide color, not border color). */
export const divider = 'divide-[var(--color-border-subtle)] dark:divide-[var(--color-dark-border)]';
export const subtleBg = 'bg-[var(--color-surface-secondary)] dark:bg-[var(--color-dark-surface-secondary)]';

export const fmt = {
  kg: (v: number | null | undefined, digits = 1) => (v === null || v === undefined || !Number.isFinite(v) ? '—' : `${v.toFixed(digits)} kg`),
  signed: (v: number | null | undefined, digits = 1, unit = '%') =>
    v === null || v === undefined || !Number.isFinite(v) ? '—' : `${v > 0 ? '+' : v < 0 ? '−' : '±'}${Math.abs(v).toFixed(digits)}${unit}`,
  num: (v: number, digits = 0) => (Number.isFinite(v) ? v.toFixed(digits).replace(/\.0+$/, '') : '—'),
  pct: (v: number) => `${Math.round(v * 100)}%`,
};
