/**
 * Normalizes raw Firebase workouts into a typed, chronological dataset that
 * every analysis module reads from.
 */
import type { Exercise, Workout } from '../../types';
import { orderedSets } from '../history';
import { isSetValid } from '../utils';
import { dayNumber, median, round, toNumber, weekOf } from './core';
import { e10rm, hasExecutionFlag, hasPainMention, parseEffort, type EffortSource } from './effort';
import { inferMuscle, profileExercise, type ExerciseProfile } from './profile';

export interface NSet {
  load: number | null;
  reps: number;
  rpe: number | null;
  rir: number;
  source: EffortSource;
  /** e10RM @ 2 RIR using this set's (logged or assumed) RIR */
  e10: number | null;
  /** Same formula with the typical RIR for every set: raw performance */
  perf: number | null;
  remarks: string;
  pain: boolean;
  execution: boolean;
  /** Counts toward hard-set volume (RPE ≥ 6 or unrated) */
  hard: boolean;
}

export interface NSession {
  workoutId: string;
  workoutName: string;
  date: string;
  day: number;
  week: number;
  exerciseId: string;
  name: string;
  muscle: string;
  profile: ExerciseProfile;
  bodyWeight: number | null;
  sets: NSet[];
  /** Best e10RM of the session (top set), null when no set has a load */
  best: number | null;
  bestPerf: number | null;
  topLoad: number | null;
}

export interface NWorkout {
  id: string;
  name: string;
  date: string;
  day: number;
  week: number;
  bodyWeight: number | null;
  sessions: NSession[];
}

export interface Dataset {
  today: number;
  currentWeek: number;
  firstDay: number;
  workouts: NWorkout[]; // oldest first, only workouts with ≥1 logged set
  sessions: NSession[]; // oldest first
  /** RIR assumed for sets without any effort information */
  typicalRir: number;
  ratedShare: number;
  totalSets: number;
}

export function buildDataset(rawWorkouts: Workout[], exercises: Exercise[], today: number): Dataset {
  const defs = new Map(exercises.map((e) => [e.id, e]));

  // First pass: parse effort everywhere to learn the lifter's typical RIR.
  const ratedRirs: number[] = [];
  for (const w of rawWorkouts) {
    for (const entry of Object.values(w.exercises || {})) {
      for (const s of orderedSets(entry.sets)) {
        const effort = parseEffort(s.rpe, s.remarks || '');
        if (effort && effort.source !== 'failure') ratedRirs.push(10 - effort.rpe);
      }
    }
  }
  const typicalRir = ratedRirs.length >= 20 ? round(median(ratedRirs), 0.5) : 2;

  const workouts: NWorkout[] = [];
  const sessions: NSession[] = [];
  let totalSets = 0;
  let ratedSets = 0;

  const sorted = [...rawWorkouts]
    .map((w) => ({ w, day: dayNumber(w.date) }))
    .filter(({ day }) => Number.isFinite(day) && day <= today)
    .sort((a, b) => a.day - b.day || (Number(a.w.timestamp) || 0) - (Number(b.w.timestamp) || 0));

  for (const { w, day } of sorted) {
    const bw = toNumber(w.bodyWeight);
    const bodyWeight = Number.isFinite(bw) && bw >= 30 && bw <= 300 ? bw : null;
    const nw: NWorkout = {
      id: w.id || '',
      name: w.name || '',
      date: w.date,
      day,
      week: weekOf(day),
      bodyWeight,
      sessions: [],
    };

    for (const [exerciseId, entry] of Object.entries(w.exercises || {})) {
      const def = defs.get(exerciseId);
      const name = def?.name || entry.name || 'Exercise';
      const category = def?.category || entry.category;
      if (category === 'cardio' || category === 'flexibility') continue;
      const muscle = def?.muscleGroup || entry.muscleGroup || inferMuscle(name) || 'Unassigned';
      const profile = profileExercise(name, muscle);

      const sets: NSet[] = [];
      for (const raw of orderedSets(entry.sets)) {
        if (!isSetValid({ weight: raw.weight ?? '', reps: raw.reps ?? '' })) continue;
        const reps = toNumber(raw.reps);
        const weight = toNumber(raw.weight);
        if (!Number.isFinite(reps) || reps <= 0) continue;

        let load: number | null = Number.isFinite(weight) && weight > 0 ? weight : null;
        if (profile.assisted) load = load !== null && bodyWeight !== null ? Math.max(bodyWeight - load, 0) || null : null;
        else if (profile.bodyweight && load === null) load = bodyWeight;

        const remarks = (raw.remarks || '').trim();
        const effort = parseEffort(raw.rpe, remarks);
        const rpe = effort ? effort.rpe : null;
        const rir = effort ? 10 - effort.rpe : typicalRir;
        sets.push({
          load,
          reps,
          rpe,
          rir,
          source: effort ? effort.source : 'assumed',
          e10: load !== null ? e10rm(load, reps, rir) : null,
          perf: load !== null ? e10rm(load, reps, typicalRir) : null,
          remarks,
          pain: hasPainMention(remarks),
          execution: hasExecutionFlag(remarks),
          hard: rpe === null || rpe >= 6,
        });
        totalSets++;
        if (effort) ratedSets++;
      }
      if (sets.length === 0) continue;

      let best: number | null = null;
      let bestPerf: number | null = null;
      let topLoad: number | null = null;
      for (const s of sets) {
        if (s.e10 !== null && (best === null || s.e10 > best)) best = s.e10;
        if (s.perf !== null && (bestPerf === null || s.perf > bestPerf)) bestPerf = s.perf;
        if (s.load !== null && (topLoad === null || s.load > topLoad)) topLoad = s.load;
      }

      const session: NSession = {
        workoutId: nw.id,
        workoutName: nw.name,
        date: w.date,
        day,
        week: nw.week,
        exerciseId,
        name,
        muscle,
        profile,
        bodyWeight,
        sets,
        best,
        bestPerf,
        topLoad,
      };
      nw.sessions.push(session);
      sessions.push(session);
    }

    if (nw.sessions.length > 0) workouts.push(nw);
  }

  return {
    today,
    currentWeek: weekOf(today),
    firstDay: workouts.length > 0 ? workouts[0].day : today,
    workouts,
    sessions,
    typicalRir,
    ratedShare: totalSets > 0 ? ratedSets / totalSets : 0,
    totalSets,
  };
}
