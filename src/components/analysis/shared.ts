import { formatDay, formatMonthShort, weekStartDay } from '../../lib/analytics/core';
import { PHASE_LABEL, type Phase } from '../../lib/analytics/bodyweight';
import type { LiftStatus } from '../../lib/analytics';
import type { Tone } from './ui';

export const PHASE_COLOR: Record<Phase, string> = {
  surplus: 'var(--viz-surplus)',
  maintenance: 'var(--viz-maintenance)',
  deficit: 'var(--viz-deficit)',
};

/** Faint background wash for phase bands behind time charts. */
export const PHASE_WASH: Record<Phase, string> = {
  surplus: 'color-mix(in srgb, var(--viz-surplus) 11%, transparent)',
  maintenance: 'transparent',
  deficit: 'color-mix(in srgb, var(--viz-deficit) 11%, transparent)',
};

export { PHASE_LABEL };

export function weekLabel(week: number, today: number): string {
  return `Week of ${formatDay(weekStartDay(week), today)}`;
}

export const monthTick = (day: number) => formatMonthShort(day);

export const STATUS_META: Record<LiftStatus, { label: string; tone: Tone }> = {
  progressing: { label: 'Progressing', tone: 'good' },
  rebuilding: { label: 'Climbing back', tone: 'info' },
  plateau: { label: 'Plateau', tone: 'warning' },
  regressing: { label: 'Regressing', tone: 'critical' },
  new: { label: 'New', tone: 'neutral' },
  rotated: { label: 'Rotated out', tone: 'neutral' },
};
