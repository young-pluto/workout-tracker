import type { Workout, WorkoutSet } from '../types';
import { isSetValid } from './utils';

/** One exercise as it was logged in one workout. */
export interface ExerciseSession {
  workoutId: string;
  workoutName: string;
  date: string; // YYYY-MM-DD
  bodyWeight: number | null;
  sets: WorkoutSet[];
}

/** set1, set2, … set10 in numeric order (Firebase returns set10 before set2). */
export function orderedSets(sets: { [key: string]: WorkoutSet } | undefined): WorkoutSet[] {
  return Object.entries(sets || {})
    .sort(([a], [b]) => parseInt(a.replace('set', ''), 10) - parseInt(b.replace('set', ''), 10))
    .map(([, set]) => set);
}

/**
 * Sessions of one exercise, newest first. Expects workouts already sorted
 * newest first (see getAllWorkouts). Sessions with no logged sets are dropped.
 */
export function toExerciseSessions(
  workouts: Workout[],
  exerciseId: string,
  excludeWorkoutId?: string | null
): ExerciseSession[] {
  const sessions: ExerciseSession[] = [];
  for (const workout of workouts) {
    if (excludeWorkoutId && workout.id === excludeWorkoutId) continue;
    const entry = workout.exercises?.[exerciseId];
    if (!entry) continue;
    const sets = orderedSets(entry.sets).filter((s) =>
      isSetValid({ weight: s.weight ?? '', reps: s.reps ?? '' })
    );
    if (sets.length === 0) continue;
    sessions.push({
      workoutId: workout.id || '',
      workoutName: workout.name || '',
      date: workout.date,
      bodyWeight: workout.bodyWeight ?? null,
      sets,
    });
  }
  return sessions;
}

/** Parse YYYY-MM-DD as a local calendar date (new Date('YYYY-MM-DD') is UTC). */
export function parseLocalDate(date: string): Date {
  const [y, m, d] = (date || '').split('-').map(Number);
  if (!y || !m || !d) return new Date(date);
  return new Date(y, m - 1, d);
}

/** "Tue, Nov 11", with the year added when it isn't this year. */
export function formatSessionDate(date: string): string {
  const d = parseLocalDate(date);
  if (isNaN(d.getTime())) return date;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

/** "Today", "Yesterday", "5d ago", "3w ago", "4mo ago", "2y ago". */
export function relativeDay(date: string): string {
  const d = parseLocalDate(date);
  if (isNaN(d.getTime())) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 14) return `${days}d ago`;
  if (days < 60) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

/** "November 2026" — used for month headers in the full history. */
export function monthLabel(date: string): string {
  const d = parseLocalDate(date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function hasWeight(set: WorkoutSet): boolean {
  return set.weight !== '' && set.weight !== 0 && set.weight !== '0' && set.weight != null;
}

export function hasReps(set: WorkoutSet): boolean {
  return set.reps !== '' && set.reps !== 0 && set.reps !== '0' && set.reps != null;
}

/** Heaviest logged weight across sessions, with the reps and date it was done. */
export function topSet(sessions: ExerciseSession[]): { weight: number; reps: number; date: string } | null {
  let best: { weight: number; reps: number; date: string } | null = null;
  for (const session of sessions) {
    for (const set of session.sets) {
      const weight = Number(set.weight);
      if (!hasWeight(set) || isNaN(weight)) continue;
      const reps = Number(set.reps) || 0;
      if (!best || weight > best.weight || (weight === best.weight && reps > best.reps)) {
        best = { weight, reps, date: session.date };
      }
    }
  }
  return best;
}
