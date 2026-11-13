/**
 * Volume: Israetel's weekly landmarks and mesocycle structure, plus
 * Henselmans' fractional set ledger and per-session ceiling.
 */
import { mean, median } from './core';
import type { Dataset, NSession } from './dataset';
import { landmarksFor, muscleRank, volumeZone, type Landmarks, type VolumeZone } from './landmarks';

export interface MuscleVolume {
  direct: number;
  indirect: number;
}

export interface MuscleLandmarkRow {
  muscle: string;
  landmarks: Landmarks | null;
  last7: MuscleVolume;
  avg4w: MuscleVolume;
  zone7: VolumeZone;
  zone4w: VolumeZone;
}

export interface SessionLoad {
  workoutId: string;
  date: string;
  day: number;
  name: string;
  fractional: number;
  direct: number;
}

export interface SessionCeilingRow {
  muscle: string;
  sessions: SessionLoad[]; // last 8 weeks, sessions that touched the muscle
  avg: number;
  max: number;
  over: number; // sessions above the ceiling
  caution: number; // sessions in the 8–10 band
}

export interface WeekTotal {
  week: number;
  sessions: number;
  hardSets: number;
  avgRpe: number | null;
  ratedSets: number;
  deload: boolean;
  partial: boolean; // current, unfinished week
}

export interface Mesocycle {
  startWeek: number;
  endWeek: number;
  weeks: number;
}

export interface VolumeAnalysis {
  muscles: string[]; // trained in the last 26 weeks, display order
  weeklyByMuscle: Map<number, Map<string, MuscleVolume>>;
  rows: MuscleLandmarkRow[];
  ceiling: SessionCeilingRow[];
  weekTotals: WeekTotal[];
  mesocycles: Mesocycle[];
  lastDeloadWeek: number | null;
  currentBlockWeeks: number | null;
  nearFailureShare: number | null; // rated sets at RPE ≥ 9 (last 26 weeks)
  ratedRecentShare: number; // rated share of sets in the last 8 weeks
}

export const SESSION_CEILING = 10;
export const SESSION_CAUTION = 8;

function addVolume(map: Map<string, MuscleVolume>, muscle: string, direct: number, indirect: number) {
  const v = map.get(muscle) ?? { direct: 0, indirect: 0 };
  v.direct += direct;
  v.indirect += indirect;
  map.set(muscle, v);
}

/** Direct and synergist (fractional) sets a session contributes, per muscle. */
export function sessionContribution(s: NSession): Map<string, MuscleVolume> {
  const out = new Map<string, MuscleVolume>();
  const hard = s.sets.filter((x) => x.hard).length;
  if (hard === 0) return out;
  addVolume(out, s.muscle, hard, 0);
  for (const syn of s.profile.synergists) addVolume(out, syn.muscle, 0, hard * syn.factor);
  return out;
}

export function analyzeVolume(ds: Dataset): VolumeAnalysis {
  const { today, currentWeek } = ds;

  const weeklyByMuscle = new Map<number, Map<string, MuscleVolume>>();
  const last7 = new Map<string, MuscleVolume>();
  const last28 = new Map<string, MuscleVolume>();
  const recentMuscles = new Set<string>();

  for (const s of ds.sessions) {
    const contrib = sessionContribution(s);
    const week = weeklyByMuscle.get(s.week) ?? new Map<string, MuscleVolume>();
    weeklyByMuscle.set(s.week, week);
    for (const [m, v] of contrib) {
      addVolume(week, m, v.direct, v.indirect);
      if (s.day > today - 7) addVolume(last7, m, v.direct, v.indirect);
      if (s.day > today - 28) addVolume(last28, m, v.direct, v.indirect);
    }
    if (s.week > currentWeek - 26 && s.muscle !== 'Unassigned') recentMuscles.add(s.muscle);
  }

  const muscles = [...recentMuscles].sort((a, b) => muscleRank(a) - muscleRank(b) || a.localeCompare(b));

  const rows: MuscleLandmarkRow[] = muscles.map((muscle) => {
    const lm = landmarksFor(muscle);
    const l7 = last7.get(muscle) ?? { direct: 0, indirect: 0 };
    const l28 = last28.get(muscle) ?? { direct: 0, indirect: 0 };
    const avg4w = { direct: l28.direct / 4, indirect: l28.indirect / 4 };
    return {
      muscle,
      landmarks: lm,
      last7: l7,
      avg4w,
      zone7: lm ? volumeZone(l7.direct, lm) : 'none',
      zone4w: lm ? volumeZone(avg4w.direct, lm) : 'none',
    };
  });

  // Henselmans: fractional sets per muscle per session, last 8 weeks.
  const ceilingMap = new Map<string, SessionLoad[]>();
  for (const w of ds.workouts) {
    if (w.day <= today - 56) continue;
    const perMuscle = new Map<string, MuscleVolume>();
    for (const s of w.sessions) {
      for (const [m, v] of sessionContribution(s)) addVolume(perMuscle, m, v.direct, v.indirect);
    }
    for (const [m, v] of perMuscle) {
      if (!recentMuscles.has(m)) continue;
      const list = ceilingMap.get(m) ?? [];
      list.push({ workoutId: w.id, date: w.date, day: w.day, name: w.name, fractional: v.direct + v.indirect, direct: v.direct });
      ceilingMap.set(m, list);
    }
  }
  const ceiling: SessionCeilingRow[] = muscles
    .map((muscle) => {
      const sessions = (ceilingMap.get(muscle) ?? []).filter((x) => x.direct > 0);
      const values = sessions.map((x) => x.fractional);
      return {
        muscle,
        sessions,
        avg: values.length ? mean(values) : 0,
        max: values.length ? Math.max(...values) : 0,
        over: values.filter((v) => v > SESSION_CEILING).length,
        caution: values.filter((v) => v >= SESSION_CAUTION && v <= SESSION_CEILING).length,
      };
    })
    .filter((r) => r.sessions.length > 0);

  // Weekly totals, effort and deload detection (sawtooth audit).
  const firstWeek = ds.workouts.length > 0 ? ds.workouts[0].week : currentWeek;
  const weekTotals: WeekTotal[] = [];
  const byWeek = new Map<number, { sessions: Set<string>; hard: number; rpes: number[] }>();
  for (const w of ds.workouts) {
    const entry = byWeek.get(w.week) ?? { sessions: new Set<string>(), hard: 0, rpes: [] };
    entry.sessions.add(w.date);
    for (const s of w.sessions) {
      for (const set of s.sets) {
        if (set.hard) entry.hard++;
        if (set.rpe !== null && set.source !== 'failure') entry.rpes.push(set.rpe);
      }
    }
    byWeek.set(w.week, entry);
  }
  for (let week = firstWeek; week <= currentWeek; week++) {
    const e = byWeek.get(week);
    weekTotals.push({
      week,
      sessions: e ? e.sessions.size : 0,
      hardSets: e ? e.hard : 0,
      avgRpe: e && e.rpes.length >= 3 ? mean(e.rpes) : null,
      ratedSets: e ? e.rpes.length : 0,
      deload: false,
      partial: week === currentWeek,
    });
  }
  // A week under 60% of the recent normal (median of the 4 prior normal weeks) is a deload/break.
  const normal: number[] = [];
  for (const wt of weekTotals) {
    if (wt.partial) continue;
    if (normal.length >= 3) {
      const baseline = median(normal.slice(-4));
      if (wt.hardSets < baseline * 0.6) {
        wt.deload = true;
        continue;
      }
    }
    normal.push(wt.hardSets);
  }

  const mesocycles: Mesocycle[] = [];
  let start: number | null = null;
  for (const wt of weekTotals) {
    if (wt.partial) break;
    if (wt.deload) {
      if (start !== null && wt.week - start >= 3) mesocycles.push({ startWeek: start, endWeek: wt.week - 1, weeks: wt.week - start });
      start = null;
    } else if (start === null) {
      start = wt.week;
    }
  }
  const deloads = weekTotals.filter((w) => w.deload);
  const lastDeloadWeek = deloads.length ? deloads[deloads.length - 1].week : null;
  const currentBlockWeeks = start !== null ? currentWeek - start + 1 : null;

  const recentRated = ds.sessions
    .filter((s) => s.week > currentWeek - 26)
    .flatMap((s) => s.sets)
    .filter((x) => x.rpe !== null && x.source !== 'failure');
  const nearFailureShare = recentRated.length >= 20 ? recentRated.filter((x) => (x.rpe as number) >= 9).length / recentRated.length : null;

  const last8 = ds.sessions.filter((s) => s.day > today - 56).flatMap((s) => s.sets);
  const ratedRecentShare = last8.length ? last8.filter((x) => x.source !== 'assumed').length / last8.length : 0;

  return {
    muscles,
    weeklyByMuscle,
    rows,
    ceiling,
    weekTotals,
    mesocycles,
    lastDeloadWeek,
    currentBlockWeeks,
    nearFailureShare,
    ratedRecentShare,
  };
}
