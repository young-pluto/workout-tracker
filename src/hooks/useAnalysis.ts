import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useExercises } from './useExercises';
import { getWorkoutsSince } from '../lib/db';
import { formatDateYMD, countLoggedSets, UNASSIGNED_MUSCLE } from '../lib/utils';
import type { AnalysisSummary, Exercise } from '../types';

const WINDOW_DAYS = 7;

/**
 * Last-7-days analysis: frequency (distinct days trained) and volume
 * (number of logged sets) per muscle group.
 *
 * Muscle group is resolved from the CURRENT exercise definition first so
 * tagging exercises retroactively updates past workouts; falls back to the
 * value denormalized onto the workout, then "Unassigned".
 */
export function useAnalysis() {
  const { user } = useAuth();
  const { exercises } = useExercises();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);

  const exerciseMap = useMemo(() => {
    const m = new Map<string, Exercise>();
    exercises.forEach((e) => m.set(e.id, e));
    return m;
  }, [exercises]);

  const load = useCallback(async () => {
    if (!user) {
      setSummary(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Cutoff = local midnight, (WINDOW_DAYS - 1) days ago → 7-day inclusive window
      const cutoffDate = new Date();
      cutoffDate.setHours(0, 0, 0, 0);
      cutoffDate.setDate(cutoffDate.getDate() - (WINDOW_DAYS - 1));
      const cutoff = formatDateYMD(cutoffDate);

      const workouts = await getWorkoutsSince(user.uid, cutoff);

      const statMap = new Map<string, { sets: number; days: Set<string> }>();
      const trainingDays = new Set<string>();
      let totalSets = 0;

      workouts.forEach((w) => {
        if (!w.date) return;
        let workoutHadSets = false;

        Object.entries(w.exercises || {}).forEach(([exId, ex]) => {
          const count = countLoggedSets(ex.sets);
          if (count === 0) return;

          workoutHadSets = true;
          const mg =
            exerciseMap.get(exId)?.muscleGroup ||
            ex.muscleGroup ||
            UNASSIGNED_MUSCLE;

          if (!statMap.has(mg)) statMap.set(mg, { sets: 0, days: new Set() });
          const entry = statMap.get(mg)!;
          entry.sets += count;
          entry.days.add(w.date);
          totalSets += count;
        });

        if (workoutHadSets) trainingDays.add(w.date);
      });

      const stats = Array.from(statMap.entries())
        .map(([muscleGroup, v]) => ({
          muscleGroup,
          sets: v.sets,
          frequency: v.days.size,
        }))
        .sort((a, b) => b.sets - a.sets);

      setSummary({
        stats,
        workouts: workouts.length,
        daysTrained: trainingDays.size,
        totalSets,
        muscleGroupsHit: stats.length,
      });
    } catch (err) {
      console.error('Failed to load analysis:', err);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [user, exerciseMap]);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, summary, refresh: load };
}
