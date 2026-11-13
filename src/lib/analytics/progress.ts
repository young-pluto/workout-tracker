/**
 * Strength-in-context: Nuñez's surplus-vs-deficit velocity, Israetel's
 * empirical dose–response (personal landmarks) and Alberts' minimum
 * effective dose efficiency.
 */
import { mean, median, weekOf } from './core';
import type { Dataset } from './dataset';
import type { Phase } from './bodyweight';
import { emptyVelocity, forEachProgressPair, velocityPct, type LiftSummary, type VelocityAccumulator } from './strength';
import type { VolumeAnalysis } from './volume';

export interface PhaseVelocity {
  phase: Phase;
  pctPerMonth: number | null;
  weeks: number;
}

export interface DosePoint {
  muscle: string;
  endWeek: number;
  setsPerWeek: number;
  changePct: number;
  lifts: number;
  phase: Phase | null;
}

export interface PersonalLandmarks {
  sweetSpot: [number, number];
  sweetSpotGain: number;
  mevEstimate: number | null;
  mrvEstimate: number | null;
  bins: Array<{ from: number; to: number; meanChange: number; blocks: number }>;
  blocks: number;
}

export interface MuscleEfficiency {
  muscle: string;
  pctPerMonth: number;
  setsPerWeek: number;
  /** setsPerWeek counts synergist sets at 0.5 (fractional volume) */
  /** %/month gained per 10 weekly sets */
  perTenSets: number;
}

export interface ProgressAnalysis {
  phaseVelocity: PhaseVelocity[];
  dose: Map<string, DosePoint[]>;
  personal: Map<string, PersonalLandmarks>;
  efficiency: MuscleEfficiency[];
  muscleTrend4w: Map<string, number>; // last 4 weeks vs previous 4, %
}

const BLOCK_WEEKS = 4;

export function analyzeProgress(
  ds: Dataset,
  lifts: LiftSummary[],
  volume: VolumeAnalysis,
  phaseByWeek: Map<number, Phase>
): ProgressAnalysis {
  const { currentWeek, today } = ds;

  // Nuñez: velocity by nutrition phase.
  const byPhase: Record<Phase, VelocityAccumulator> = {
    surplus: emptyVelocity(),
    maintenance: emptyVelocity(),
    deficit: emptyVelocity(),
  };
  forEachProgressPair(lifts, (_lift, _from, to, logChange, days) => {
    const phase = phaseByWeek.get(weekOf(to.day));
    if (!phase) return;
    byPhase[phase].logChange += logChange;
    byPhase[phase].days += days;
    byPhase[phase].pairs += 1;
  });
  const phaseWeeks: Record<Phase, number> = { surplus: 0, maintenance: 0, deficit: 0 };
  for (const p of phaseByWeek.values()) phaseWeeks[p]++;
  const phaseVelocity: PhaseVelocity[] = (['surplus', 'maintenance', 'deficit'] as Phase[]).map((phase) => ({
    phase,
    pctPerMonth: velocityPct(byPhase[phase]),
    weeks: phaseWeeks[phase],
  }));

  // Israetel: dose–response in 4-week blocks, per muscle.
  const lastComplete = currentWeek - 1;
  const firstWeek = ds.workouts.length ? ds.workouts[0].week : currentWeek;
  const blockEnds: number[] = [];
  for (let end = lastComplete; end - BLOCK_WEEKS + 1 >= firstWeek; end -= BLOCK_WEEKS) blockEnds.unshift(end);

  const liftsByMuscle = new Map<string, LiftSummary[]>();
  for (const l of lifts) {
    const list = liftsByMuscle.get(l.muscle) ?? [];
    list.push(l);
    liftsByMuscle.set(l.muscle, list);
  }

  const blockMedian = (lift: LiftSummary, endWeek: number): number | null => {
    const fromDay = (endWeek - BLOCK_WEEKS + 1) * 7 + 4;
    const toDay = endWeek * 7 + 10;
    const values = lift.points.filter((p) => !p.outlier && p.day >= fromDay && p.day <= toDay).map((p) => p.best);
    return values.length ? median(values) : null;
  };

  const dose = new Map<string, DosePoint[]>();
  for (const muscle of volume.muscles) {
    const muscleLifts = liftsByMuscle.get(muscle) ?? [];
    const points: DosePoint[] = [];
    for (let i = 1; i < blockEnds.length; i++) {
      const end = blockEnds[i];
      const prevEnd = blockEnds[i - 1];
      let direct = 0;
      for (let w = end - BLOCK_WEEKS + 1; w <= end; w++) direct += volume.weeklyByMuscle.get(w)?.get(muscle)?.direct ?? 0;
      const changes: number[] = [];
      for (const lift of muscleLifts) {
        const a = blockMedian(lift, prevEnd);
        const b = blockMedian(lift, end);
        if (a !== null && b !== null) changes.push(Math.log(b / a) * 100);
      }
      if (changes.length === 0 || direct === 0) continue;
      const phaseCounts = new Map<Phase, number>();
      for (let w = end - BLOCK_WEEKS + 1; w <= end; w++) {
        const p = phaseByWeek.get(w);
        if (p) phaseCounts.set(p, (phaseCounts.get(p) ?? 0) + 1);
      }
      let phase: Phase | null = null;
      let top = 0;
      for (const [p, c] of phaseCounts) if (c > top) [phase, top] = [p, c];
      points.push({ muscle, endWeek: end, setsPerWeek: direct / BLOCK_WEEKS, changePct: median(changes), lifts: changes.length, phase });
    }
    dose.set(muscle, points);
  }

  // Personal landmarks once there is enough spread in weekly sets.
  const personal = new Map<string, PersonalLandmarks>();
  for (const [muscle, points] of dose) {
    if (points.length < 8) continue;
    const xs = points.map((p) => p.setsPerWeek);
    const lo = Math.min(...xs);
    const hi = Math.max(...xs);
    if (hi - lo < 6) continue;
    const width = hi - lo >= 16 ? 4 : 3;
    const start = Math.floor(lo / width) * width;
    const bins: PersonalLandmarks['bins'] = [];
    for (let from = start; from <= hi; from += width) {
      const inBin = points.filter((p) => p.setsPerWeek >= from && p.setsPerWeek < from + width);
      if (inBin.length >= 2) bins.push({ from, to: from + width, meanChange: mean(inBin.map((p) => p.changePct)), blocks: inBin.length });
    }
    if (bins.length < 2) continue;
    let bestBin = bins[0];
    for (const b of bins) if (b.meanChange > bestBin.meanChange) bestBin = b;
    if (bestBin.meanChange <= 0) continue;
    const below = bins.filter((b) => b.to <= bestBin.from);
    const above = bins.filter((b) => b.from >= bestBin.to);
    const mev = below.some((b) => b.meanChange <= 0.25)
      ? (below.find((b) => b.meanChange > 0.25)?.from ?? bestBin.from)
      : null;
    const mrvBin = above.find((b) => b.meanChange < 0);
    personal.set(muscle, {
      sweetSpot: [bestBin.from, bestBin.to],
      sweetSpotGain: bestBin.meanChange,
      mevEstimate: mev,
      mrvEstimate: mrvBin ? mrvBin.from : null,
      bins,
      blocks: points.length,
    });
  }

  // Alberts: minimum effective dose — progress per unit of weekly volume (last 52 weeks).
  const efficiency: MuscleEfficiency[] = [];
  const windowStart = today - 364;
  const recentLifts = lifts.map((l) => ({ ...l, points: l.points.filter((p) => p.day > windowStart) }));
  for (const muscle of volume.muscles) {
    const acc = emptyVelocity();
    forEachProgressPair(
      recentLifts.filter((l) => l.muscle === muscle),
      (_l, _a, _b, logChange, days) => {
        acc.logChange += logChange;
        acc.days += days;
        acc.pairs += 1;
      }
    );
    const pct = velocityPct(acc);
    if (pct === null) continue;
    let direct = 0;
    let weeks = 0;
    for (let w = currentWeek - 52; w < currentWeek; w++) {
      if (w < firstWeek) continue;
      weeks++;
      const v = volume.weeklyByMuscle.get(w)?.get(muscle);
      direct += (v?.direct ?? 0) + (v?.indirect ?? 0);
    }
    const setsPerWeek = weeks ? direct / weeks : 0;
    if (setsPerWeek < 1) continue;
    efficiency.push({ muscle, pctPerMonth: pct, setsPerWeek, perTenSets: (pct / setsPerWeek) * 10 });
  }
  efficiency.sort((a, b) => b.perTenSets - a.perTenSets);

  // Muscle trend: last 4 weeks vs the 4 before (median over its lifts).
  const muscleTrend4w = new Map<string, number>();
  for (const [muscle, muscleLifts] of liftsByMuscle) {
    const changes: number[] = [];
    for (const lift of muscleLifts) {
      const pts = lift.points.filter((p) => !p.outlier);
      const a = pts.filter((p) => p.day > today - 56 && p.day <= today - 28).map((p) => p.best);
      const b = pts.filter((p) => p.day > today - 28).map((p) => p.best);
      if (a.length && b.length) changes.push((median(b) / median(a) - 1) * 100);
    }
    if (changes.length) muscleTrend4w.set(muscle, median(changes));
  }

  return { phaseVelocity, dose, personal, efficiency, muscleTrend4w };
}
