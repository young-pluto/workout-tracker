/**
 * Helms' pyramid base: adherence. No training plan is stored, so the
 * "planned" week is the lifter's own median weekly session count (last 26 weeks).
 */
import { mean, median } from './core';
import type { Dataset } from './dataset';
import type { WeekTotal } from './volume';

export interface ConsistencyAnalysis {
  typicalWeek: number;
  recentAvg: number | null; // last 8 complete weeks
  priorAvg: number | null; // the 26 weeks before those
  onPlanPct: number | null; // last 52 complete weeks at ≥ typical − 1
  onPlanWeeks: number;
  weeksCounted: number;
  zeroWeeks: number;
  longestBreakDays: number;
  longestBreakEndDay: number | null;
  daysSinceLast: number | null;
  streakWeeks: number;
}

export function analyzeConsistency(ds: Dataset, weekTotals: WeekTotal[]): ConsistencyAnalysis {
  const complete = weekTotals.filter((w) => !w.partial);
  const last26 = complete.slice(-26).filter((w) => w.sessions > 0);
  const typicalWeek = last26.length ? Math.round(median(last26.map((w) => w.sessions))) : 0;

  const recent = complete.slice(-8);
  const prior = complete.slice(-34, -8);
  const year = complete.slice(-52);
  const threshold = Math.max(1, typicalWeek - 1);
  const onPlanWeeks = year.filter((w) => w.sessions >= threshold).length;

  let streakWeeks = 0;
  for (let i = complete.length - 1; i >= 0 && complete[i].sessions >= threshold; i--) streakWeeks++;

  const days = [...new Set(ds.workouts.map((w) => w.day))].sort((a, b) => a - b);
  let longestBreakDays = 0;
  let longestBreakEndDay: number | null = null;
  for (let i = 1; i < days.length; i++) {
    if (days[i] <= ds.today - 364) continue;
    const gap = days[i] - days[i - 1] - 1;
    if (gap > longestBreakDays) {
      longestBreakDays = gap;
      longestBreakEndDay = days[i];
    }
  }

  return {
    typicalWeek,
    recentAvg: recent.length ? mean(recent.map((w) => w.sessions)) : null,
    priorAvg: prior.length >= 4 ? mean(prior.map((w) => w.sessions)) : null,
    onPlanPct: year.length >= 4 ? (onPlanWeeks / year.length) * 100 : null,
    onPlanWeeks,
    weeksCounted: year.length,
    zeroWeeks: year.filter((w) => w.sessions === 0).length,
    longestBreakDays,
    longestBreakEndDay,
    daysSinceLast: days.length ? ds.today - days[days.length - 1] : null,
    streakWeeks,
  };
}
