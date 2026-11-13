/**
 * Strength: Helms' RIR-normalized progression (e10RM @ 2 RIR), double
 * progression, realization vs adaptation, plus Henselmans' rep drop-off and
 * RIR calibration, per lift.
 */
import { mean, median, quantile, robustSlope } from './core';
import type { Dataset, NSession, NSet } from './dataset';
import type { ExerciseProfile } from './profile';

export type LiftStatus = 'progressing' | 'rebuilding' | 'plateau' | 'regressing' | 'new' | 'rotated';

export interface LiftPoint {
  day: number;
  date: string;
  best: number;
  bestPerf: number | null;
  topLoad: number | null;
  sets: NSet[];
  pr: boolean;
  /** Far off its neighbours (different gym/equipment, technique day): kept on charts, left out of trends */
  outlier: boolean;
}

export interface Note {
  day: number;
  date: string;
  exercise: string;
  text: string;
}

export interface Realization {
  performancePct: number;
  adaptationPct: number;
  realizationPct: number;
  rirBefore: number;
  rirAfter: number;
}

export interface LoadUpEvent {
  date: string;
  day: number;
  exercise: string;
  fromLoad: number;
  toLoad: number;
  fromRpe: number;
  toRpe: number;
}

export interface LiftSummary {
  exerciseId: string;
  name: string;
  muscle: string;
  profile: ExerciseProfile;
  points: LiftPoint[]; // chronological sessions that have a load
  sessionCount: number;
  firstDay: number;
  lastDay: number;
  current: number | null; // median e10RM of the last 3 sessions
  best: { value: number; day: number } | null;
  lastPrDay: number | null;
  weeksSincePr: number | null;
  velocity: number | null; // %/month over the last 12 weeks
  status: LiftStatus;
  bracket: { low: number; high: number } | null;
  lastSession: NSet[];
  readyForLoad: boolean;
  realization: Realization | null;
  loadUpEvents: LoadUpEvent[];
  dropOff: { pct: number; sets: number; sessions: number } | null;
  calibration: { pairs: number; overstated: number; understated: number } | null;
  painNotes: Note[];
  execNotes: Note[];
  execRateRecent: number;
  execRatePrior: number | null;
  momentumCreep: boolean;
  changeSinceStartPct: number | null;
}

const ROTATED_DAYS = 42;

function topLoadRpe(sets: NSet[], load: number): number | null {
  const r = sets.filter((s) => s.load === load && s.rpe !== null && s.source !== 'failure').map((s) => s.rpe as number);
  return r.length ? mean(r) : null;
}

function ratedShare(sets: NSet[]): number {
  return sets.length ? sets.filter((s) => s.source !== 'assumed').length / sets.length : 0;
}

export function summarizeLift(sessions: NSession[], today: number): LiftSummary {
  const first = sessions[0];
  const latest = sessions[sessions.length - 1];

  const allPoints: LiftPoint[] = sessions
    .filter((s) => s.best !== null)
    .map((s) => ({
      day: s.day,
      date: s.date,
      best: s.best as number,
      bestPerf: s.bestPerf,
      topLoad: s.topLoad,
      sets: s.sets,
      pr: false,
      outlier: false,
    }));
  // More than ~28% off the local median of up to 4 sessions either side.
  allPoints.forEach((p, i) => {
    const near = allPoints
      .slice(Math.max(0, i - 4), i)
      .concat(allPoints.slice(i + 1, i + 5))
      .map((q) => q.best);
    if (near.length >= 3 && Math.abs(Math.log(p.best / median(near))) > 0.25) p.outlier = true;
  });

  let runningBest = -Infinity;
  let best: { value: number; day: number } | null = null;
  let lastPrDay: number | null = null;
  let seen = 0;
  for (const p of allPoints) {
    if (p.outlier) continue;
    p.pr = seen > 0 && p.best > runningBest * 1.005;
    if (p.best > runningBest) runningBest = p.best;
    if (!best || p.best > best.value) best = { value: p.best, day: p.day };
    if (p.pr) lastPrDay = p.day;
    seen++;
  }
  const points = allPoints;
  const clean = allPoints.filter((p) => !p.outlier);
  if (lastPrDay === null && clean.length > 0) lastPrDay = clean[0].day;

  const recentPts = clean.filter((p) => p.day > today - 84);
  let velocity: number | null = null;
  if (recentPts.length >= 4 && recentPts[recentPts.length - 1].day - recentPts[0].day >= 21) {
    const slope = robustSlope(
      recentPts.map((p) => p.day),
      recentPts.map((p) => p.best)
    );
    if (slope !== null) velocity = ((slope * 30) / median(recentPts.map((p) => p.best))) * 100;
  }

  const current = clean.length ? median(clean.slice(-3).map((p) => p.best)) : null;
  const weeksSincePr = lastPrDay !== null ? Math.floor((today - lastPrDay) / 7) : null;
  const nearBest = current !== null && best !== null && current >= best.value * 0.99;

  let status: LiftStatus;
  if (today - latest.day > ROTATED_DAYS) status = 'rotated';
  else if (clean.length < 4) status = 'new';
  else if (velocity !== null && velocity <= -1.5) status = 'regressing';
  else if ((weeksSincePr !== null && weeksSincePr < 6) || (velocity !== null && velocity >= 1 && nearBest)) status = 'progressing';
  else if (velocity !== null && velocity >= 1) status = 'rebuilding';
  else status = 'plateau';

  // Double progression: the lifter's own rep bracket from the last 12 weeks.
  const recentSets = sessions.filter((s) => s.day > today - 84).flatMap((s) => s.sets);
  const bracketSource = recentSets.length >= 6 ? recentSets : sessions.flatMap((s) => s.sets);
  let bracket: { low: number; high: number } | null = null;
  if (bracketSource.length >= 6) {
    const reps = bracketSource.map((s) => s.reps);
    let low = Math.round(quantile(reps, 0.2));
    let high = Math.round(quantile(reps, 0.8));
    if (high - low < 2) {
      low = Math.max(1, low - 1);
      high = low + 3;
    }
    bracket = { low, high };
  }
  const lastSession = latest.sets;
  const lastTop = latest.topLoad;
  const topSets = lastTop !== null ? lastSession.filter((s) => s.load === lastTop) : lastSession;
  const readyForLoad = !!bracket && topSets.length > 0 && topSets.every((s) => s.reps >= bracket.high);

  // Realization vs adaptation: last 6 weeks vs the 6 before.
  const winA = sessions.filter((s) => s.day > today - 42 && s.best !== null);
  const winB = sessions.filter((s) => s.day > today - 84 && s.day <= today - 42 && s.best !== null);
  let realization: Realization | null = null;
  const setsA = winA.flatMap((s) => s.sets);
  const setsB = winB.flatMap((s) => s.sets);
  if (winA.length >= 2 && winB.length >= 2 && ratedShare(setsA) >= 0.5 && ratedShare(setsB) >= 0.5) {
    const perfA = median(winA.map((s) => s.bestPerf as number));
    const perfB = median(winB.map((s) => s.bestPerf as number));
    const adaptA = median(winA.map((s) => s.best as number));
    const adaptB = median(winB.map((s) => s.best as number));
    const rirOf = (sets: NSet[]) => mean(sets.filter((s) => s.source !== 'assumed').map((s) => s.rir));
    const performancePct = (perfA / perfB - 1) * 100;
    const adaptationPct = (adaptA / adaptB - 1) * 100;
    realization = {
      performancePct,
      adaptationPct,
      realizationPct: performancePct - adaptationPct,
      rirBefore: rirOf(setsB),
      rirAfter: rirOf(setsA),
    };
  }

  // Red flag: load went up, but only because RIR dropped.
  const loadUpEvents: LoadUpEvent[] = [];
  for (let i = 1; i < sessions.length; i++) {
    const a = sessions[i - 1];
    const b = sessions[i];
    if (b.day <= today - 42 || a.topLoad === null || b.topLoad === null || b.topLoad <= a.topLoad) continue;
    const ra = topLoadRpe(a.sets, a.topLoad);
    const rb = topLoadRpe(b.sets, b.topLoad);
    if (ra === null || rb === null || rb - ra < 1) continue;
    if (a.best !== null && b.best !== null && b.best > a.best * 1.01) continue;
    loadUpEvents.push({ date: b.date, day: b.day, exercise: b.name, fromLoad: a.topLoad, toLoad: b.topLoad, fromRpe: ra, toRpe: rb });
  }

  // Henselmans: rep drop-off across sets held at the opening load.
  const dropWindow = sessions.filter((s) => s.day > today - 84);
  const dropSource = dropWindow.length >= 3 ? dropWindow : sessions.slice(-8);
  const drops: number[] = [];
  const runLengths: number[] = [];
  let pairs = 0;
  let overstated = 0;
  let understated = 0;
  for (const s of dropSource) {
    const sets = s.sets;
    if (sets.length < 2 || sets[0].load === null) continue;
    let k = 1;
    while (k < sets.length && k < 4 && sets[k].load === sets[0].load) k++;
    if (k >= 2) {
      drops.push((sets[0].reps - sets[k - 1].reps) / sets[0].reps);
      runLengths.push(k);
    }
    for (let i = 0; i + 1 < k; i++) {
      const cur = sets[i];
      const next = sets[i + 1];
      if (cur.rpe === null || cur.source === 'failure') continue;
      pairs++;
      // Logged at ~failure, yet matched or beat it on the next set at the same load.
      if (cur.rpe >= 9.5 && next.reps >= cur.reps) understated++;
      // Logged with 2+ in reserve, yet lost 3+ reps on the next set.
      if (cur.rpe <= 8 && next.reps <= cur.reps - 3) overstated++;
    }
  }
  const dropOff = drops.length >= 3 ? { pct: mean(drops) * 100, sets: Math.round(median(runLengths)), sessions: drops.length } : null;
  const calibration = pairs >= 3 ? { pairs, overstated, understated } : null;

  const painNotes: Note[] = [];
  const execNotes: Note[] = [];
  for (const s of sessions) {
    for (const set of s.sets) {
      if (set.pain) painNotes.push({ day: s.day, date: s.date, exercise: s.name, text: set.remarks });
      if (set.execution) execNotes.push({ day: s.day, date: s.date, exercise: s.name, text: set.remarks });
    }
  }
  const recentAll = sessions.filter((s) => s.day > today - 84).flatMap((s) => s.sets);
  const priorAll = sessions.filter((s) => s.day <= today - 84 && s.day > today - 252).flatMap((s) => s.sets);
  const execRateRecent = recentAll.length ? recentAll.filter((x) => x.execution).length / recentAll.length : 0;
  const execRatePrior = priorAll.length >= 6 ? priorAll.filter((x) => x.execution).length / priorAll.length : null;
  const momentumCreep =
    velocity !== null &&
    velocity > 0.5 &&
    execRatePrior !== null &&
    execRateRecent >= execRatePrior + 0.1 &&
    recentAll.filter((x) => x.execution).length >= 3;

  const changeSinceStartPct =
    clean.length >= 6 ? (median(clean.slice(-3).map((p) => p.best)) / median(clean.slice(0, 3).map((p) => p.best)) - 1) * 100 : null;

  return {
    exerciseId: latest.exerciseId,
    name: latest.name,
    muscle: latest.muscle,
    profile: latest.profile,
    points,
    sessionCount: sessions.length,
    firstDay: first.day,
    lastDay: latest.day,
    current,
    best,
    lastPrDay,
    weeksSincePr,
    velocity,
    status,
    bracket,
    lastSession,
    readyForLoad,
    realization,
    loadUpEvents,
    dropOff,
    calibration,
    painNotes,
    execNotes,
    execRateRecent,
    execRatePrior,
    momentumCreep,
    changeSinceStartPct,
  };
}

export function analyzeLifts(ds: Dataset): LiftSummary[] {
  const byExercise = new Map<string, NSession[]>();
  for (const s of ds.sessions) {
    const list = byExercise.get(s.exerciseId) ?? [];
    list.push(s);
    byExercise.set(s.exerciseId, list);
  }
  return [...byExercise.values()].map((sessions) => summarizeLift(sessions, ds.today));
}

/**
 * Average strength velocity (%/month) over a set of lifts, from consecutive
 * sessions of the same lift no more than 3 weeks apart. Telescoping log
 * changes make this robust to exercise rotation.
 */
export interface VelocityAccumulator {
  logChange: number;
  days: number;
  pairs: number;
}

export function emptyVelocity(): VelocityAccumulator {
  return { logChange: 0, days: 0, pairs: 0 };
}

export function velocityPct(acc: VelocityAccumulator): number | null {
  if (acc.pairs < 4 || acc.days < 28) return null;
  return (Math.exp((acc.logChange / acc.days) * 30) - 1) * 100;
}

export function forEachProgressPair(
  lifts: LiftSummary[],
  visit: (lift: LiftSummary, from: LiftPoint, to: LiftPoint, logChange: number, days: number) => void
) {
  for (const lift of lifts) {
    const pts = lift.points.filter((p) => !p.outlier);
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const days = b.day - a.day;
      if (days <= 0 || days > 21) continue;
      visit(lift, a, b, Math.log(b.best / a.best), days);
    }
  }
}
