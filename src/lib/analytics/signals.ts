/**
 * One red-flag check per coach lens, condensed for the Overview.
 */
import { formatDay } from './core';
import type { Dataset } from './dataset';
import type { LongevityAnalysis } from './longevity';
import type { ProgressAnalysis } from './progress';
import type { LiftSummary } from './strength';
import { SESSION_CEILING, type VolumeAnalysis } from './volume';

export type Lens = 'Helms' | 'Israetel' | 'Henselmans' | 'Nuñez' | 'Alberts';
export type SignalLevel = 'clear' | 'watch' | 'flag';
export type AnalysisTab = 'overview' | 'volume' | 'lifts' | 'longevity';

export interface Signal {
  lens: Lens;
  check: string;
  level: SignalLevel;
  summary: string;
  target: AnalysisTab;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function buildSignals(
  ds: Dataset,
  lifts: LiftSummary[],
  volume: VolumeAnalysis,
  progress: ProgressAnalysis,
  longevity: LongevityAnalysis
): Signal[] {
  const { today } = ds;
  const signals: Signal[] = [];

  // Helms — load went up while RIR dropped.
  const events = lifts.flatMap((l) => l.loadUpEvents).filter((e) => e.day > today - 28).sort((a, b) => b.day - a.day);
  signals.push(
    events.length > 0
      ? {
          lens: 'Helms',
          check: 'Load up, RIR down',
          level: events.length >= 2 ? 'flag' : 'watch',
          summary: `${plural(events.length, 'load jump')} in 4 weeks came from grinding closer to failure, e.g. ${events[0].exercise} ${events[0].fromLoad}→${events[0].toLoad} kg at RPE ${events[0].fromRpe}→${events[0].toRpe} (${formatDay(events[0].day, today)}).`,
          target: 'lifts',
        }
      : {
          lens: 'Helms',
          check: 'Load up, RIR down',
          level: 'clear',
          summary:
            volume.ratedRecentShare < 0.3
              ? `No load jump bought with effort, but only ${pct(volume.ratedRecentShare)} of recent sets carry an RPE, so this check is partly blind.`
              : 'Load increases in the last 4 weeks held their RPE.',
          target: 'lifts',
        }
  );

  // Israetel — performance dropping while volume climbs, or volume past MRV.
  const overMrv = volume.rows.filter((r) => r.zone4w === 'over-mrv').map((r) => r.muscle);
  const dropping: string[] = [];
  for (const r of volume.rows) {
    const trend = progress.muscleTrend4w.get(r.muscle);
    if (trend === undefined || trend > -1.5) continue;
    let prev = 0;
    for (let w = ds.currentWeek - 8; w < ds.currentWeek - 4; w++) prev += volume.weeklyByMuscle.get(w)?.get(r.muscle)?.direct ?? 0;
    if (r.avg4w.direct >= prev / 4 + 1.5) dropping.push(`${r.muscle} (${trend.toFixed(1)}%)`);
  }
  signals.push({
    lens: 'Israetel',
    check: 'Performance drop at high sets',
    level: dropping.length ? 'flag' : overMrv.length ? 'watch' : 'clear',
    summary: dropping.length
      ? `Sets went up while strength fell: ${dropping.join(', ')}. Likely past your recoverable volume.`
      : overMrv.length
        ? `${overMrv.join(', ')} averaged above the textbook MRV for 4 weeks, but strength is holding. Watch for a drop.`
        : 'No muscle is losing strength while its weekly sets rise.',
    target: 'volume',
  });

  // Henselmans — per-session ceiling.
  const recentOver = volume.ceiling
    .map((r) => ({ muscle: r.muscle, count: r.sessions.filter((s) => s.day > today - 28 && s.fractional > SESSION_CEILING).length }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
  signals.push({
    lens: 'Henselmans',
    check: 'Session ceiling',
    level: recentOver.length === 0 ? 'clear' : recentOver[0].count >= 3 ? 'flag' : 'watch',
    summary: recentOver.length
      ? `${recentOver.map((r) => `${r.muscle} ${r.count}×`).join(', ')} in the last 4 weeks. Sets past ~10 in one session add fatigue faster than growth; split them across another day.`
      : 'Every muscle stayed under ~10 fractional sets per session in the last 4 weeks.',
    target: 'volume',
  });

  // Nuñez — execution breakdown on accessories.
  const recentSets = ds.sessions.filter((s) => s.day > today - 28).flatMap((s) => s.sets);
  const priorSets = ds.sessions.filter((s) => s.day <= today - 28 && s.day > today - 112).flatMap((s) => s.sets);
  const recentRate = recentSets.length ? recentSets.filter((x) => x.execution).length / recentSets.length : 0;
  const priorRate = priorSets.length ? priorSets.filter((x) => x.execution).length / priorSets.length : 0;
  const creep = lifts.filter((l) => l.momentumCreep).map((l) => l.name);
  const execRising = recentSets.filter((x) => x.execution).length >= 3 && recentRate >= priorRate + 0.04;
  signals.push({
    lens: 'Nuñez',
    check: 'Form breakdown',
    level: creep.length ? 'flag' : execRising ? 'watch' : 'clear',
    summary: creep.length
      ? `Load is climbing with more partials/momentum notes on ${creep.slice(0, 2).join(' and ')}. Check that the progress is clean.`
      : execRising
        ? `Partials, momentum or cut ROM noted on ${pct(recentRate)} of sets this month, up from ${pct(priorRate)}.`
        : `Execution notes steady (${pct(recentRate)} of sets this month vs ${pct(priorRate)} before).`,
    target: 'longevity',
  });

  // Alberts — axial fatigue and joint mentions creeping up.
  const axialNow = longevity.last90Total ? longevity.last90.axial / longevity.last90Total : 0;
  const axialBefore = longevity.prior90Total ? longevity.prior90.axial / longevity.prior90Total : 0;
  const axialUp = axialNow >= 0.1 && axialNow >= axialBefore + 0.05;
  const painUp = longevity.painRecent >= 3 && longevity.painRecent > longevity.painPrior;
  signals.push({
    lens: 'Alberts',
    check: 'Axial & joint wear',
    level: axialUp && painUp ? 'flag' : axialUp || painUp ? 'watch' : 'clear',
    summary: [
      `Spinal-loaded work is ${pct(axialNow)} of sets (90 days)${axialUp ? `, up from ${pct(axialBefore)}` : ''}.`,
      longevity.painRecent > 0
        ? `${plural(longevity.painRecent, 'pain/injury note')} in 90 days${longevity.painPrior ? ` vs ${longevity.painPrior} before` : ''}.`
        : 'No pain or injury notes in 90 days.',
    ].join(' '),
    target: 'longevity',
  });

  return signals;
}
