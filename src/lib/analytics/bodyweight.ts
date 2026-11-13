/**
 * Nuñez: seasonal context. Until food is logged, the nutrition phase is
 * inferred from the bodyweight trend recorded with each workout.
 */
import { linearFit, mean, median, weekOf, weekStartDay } from './core';
import type { Dataset } from './dataset';

export type Phase = 'surplus' | 'maintenance' | 'deficit';

export const PHASE_LABEL: Record<Phase, string> = {
  surplus: 'Gaining',
  maintenance: 'Maintenance',
  deficit: 'Cutting',
};

export interface BwPoint {
  day: number;
  kg: number;
}

export interface WeekBw {
  week: number;
  kg: number | null; // weekly average
  ratePct: number | null; // trailing 8-week trend, % of bodyweight per week
  phase: Phase | null;
}

export interface PhaseSegment {
  phase: Phase;
  startWeek: number;
  endWeek: number; // inclusive
  ratePct: number;
}

export interface BodyweightAnalysis {
  points: BwPoint[];
  rejected: BwPoint[];
  weeks: WeekBw[];
  segments: PhaseSegment[];
  phaseByWeek: Map<number, Phase>;
  current: { kg: number; day: number; ratePct: number | null; phase: Phase | null; stale: boolean } | null;
}

/** ±0.1 %/week ≈ 0.3 kg a month at 72 kg: slower than that reads as maintenance. */
const RATE_THRESHOLD = 0.1;
const TREND_DAYS = 56;
const MIN_SEGMENT_WEEKS = 4;

function classify(rate: number): Phase {
  if (rate >= RATE_THRESHOLD) return 'surplus';
  if (rate <= -RATE_THRESHOLD) return 'deficit';
  return 'maintenance';
}

export function analyzeBodyweight(ds: Dataset): BodyweightAnalysis {
  // One reading per day.
  const byDay = new Map<number, number[]>();
  for (const w of ds.workouts) {
    if (w.bodyWeight === null) continue;
    const list = byDay.get(w.day) ?? [];
    list.push(w.bodyWeight);
    byDay.set(w.day, list);
  }
  const raw: BwPoint[] = [...byDay.entries()]
    .map(([day, kgs]) => ({ day, kg: mean(kgs) }))
    .sort((a, b) => a.day - b.day);

  // Drop typos (e.g. 721.7 for 72.17): more than 6% off the local median.
  const points: BwPoint[] = [];
  const rejected: BwPoint[] = [];
  raw.forEach((p, i) => {
    const neighbors = raw.slice(Math.max(0, i - 7), i).concat(raw.slice(i + 1, i + 8)).map((q) => q.kg);
    const ref = neighbors.length >= 3 ? median(neighbors) : p.kg;
    if (Math.abs(p.kg - ref) / ref > 0.06) rejected.push(p);
    else points.push(p);
  });

  const weeks: WeekBw[] = [];
  if (points.length === 0) {
    return { points, rejected, weeks, segments: [], phaseByWeek: new Map(), current: null };
  }

  const firstWeek = weekOf(Math.min(points[0].day, ds.firstDay));
  for (let week = firstWeek; week <= ds.currentWeek; week++) {
    const start = weekStartDay(week);
    const end = start + 6;
    const inWeek = points.filter((p) => p.day >= start && p.day <= end);
    const trail = points.filter((p) => p.day > end - TREND_DAYS && p.day <= end);
    let ratePct: number | null = null;
    if (trail.length >= 5 && trail[trail.length - 1].day - trail[0].day >= 21) {
      const fit = linearFit(
        trail.map((p) => p.day),
        trail.map((p) => p.kg)
      );
      if (fit) ratePct = ((fit.slope * 7) / mean(trail.map((p) => p.kg))) * 100;
    }
    weeks.push({
      week,
      kg: inWeek.length > 0 ? mean(inWeek.map((p) => p.kg)) : null,
      ratePct,
      phase: ratePct !== null ? classify(ratePct) : null,
    });
  }

  // Smooth week-to-week flicker: 5-week majority vote, then absorb short runs.
  const rawPhases = weeks.map((w) => w.phase);
  const voted = rawPhases.map((p, i) => {
    if (p === null) return null;
    const counts = new Map<Phase, number>();
    for (let j = Math.max(0, i - 2); j <= Math.min(rawPhases.length - 1, i + 2); j++) {
      const q = rawPhases[j];
      if (q) counts.set(q, (counts.get(q) ?? 0) + 1);
    }
    let bestPhase: Phase = p;
    let bestCount = counts.get(p) ?? 0;
    for (const [q, c] of counts) {
      if (c > bestCount) {
        bestPhase = q;
        bestCount = c;
      }
    }
    return bestPhase;
  });

  type Run = { phase: Phase; from: number; to: number };
  let runs: Run[] = [];
  voted.forEach((p, i) => {
    if (p === null) return;
    const last = runs[runs.length - 1];
    if (last && last.phase === p && last.to === i - 1) last.to = i;
    else runs.push({ phase: p, from: i, to: i });
  });
  // Merge runs shorter than MIN_SEGMENT_WEEKS into the previous one.
  let changed = true;
  while (changed && runs.length > 1) {
    changed = false;
    for (let i = 0; i < runs.length; i++) {
      const r = runs[i];
      if (r.to - r.from + 1 >= MIN_SEGMENT_WEEKS) continue;
      const target = i > 0 ? runs[i - 1] : runs[i + 1];
      if (!target) continue;
      target.from = Math.min(target.from, r.from);
      target.to = Math.max(target.to, r.to);
      runs.splice(i, 1);
      changed = true;
      break;
    }
    // Re-join neighbours that now share a phase.
    runs = runs.reduce<Run[]>((acc, r) => {
      const last = acc[acc.length - 1];
      if (last && last.phase === r.phase) last.to = r.to;
      else acc.push({ ...r });
      return acc;
    }, []);
  }

  const phaseByWeek = new Map<number, Phase>();
  const segments: PhaseSegment[] = runs.map((r) => {
    const rates: number[] = [];
    for (let i = r.from; i <= r.to; i++) {
      weeks[i].phase = r.phase;
      phaseByWeek.set(weeks[i].week, r.phase);
      if (weeks[i].ratePct !== null) rates.push(weeks[i].ratePct as number);
    }
    return { phase: r.phase, startWeek: weeks[r.from].week, endWeek: weeks[r.to].week, ratePct: mean(rates) };
  });

  const last = points[points.length - 1];
  const recent = points.filter((p) => p.day > last.day - 7);
  const lastWeek = weeks[weeks.length - 1];
  const lastRated = [...weeks].reverse().find((w) => w.ratePct !== null);
  return {
    points,
    rejected,
    weeks,
    segments,
    phaseByWeek,
    current: {
      kg: mean(recent.map((p) => p.kg)),
      day: last.day,
      ratePct: lastRated?.ratePct ?? null,
      phase: lastWeek.phase ?? lastRated?.phase ?? null,
      stale: ds.today - last.day > 14,
    },
  };
}
