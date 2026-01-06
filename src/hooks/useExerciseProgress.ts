import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getAllWorkoutsForProgress } from '../lib/db';
import type { ProgressDataPoint, ExerciseHistoryEntry } from '../types';

/**
 * Hook for exercise progress data
 * Per spec: fetches ALL workouts for progress charts (no limit)
 */
export function useExerciseProgress(exerciseId: string | null) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState<ProgressDataPoint[]>([]);
  const [historyEntries, setHistoryEntries] = useState<ExerciseHistoryEntry[]>([]);

  const loadProgress = useCallback(async () => {
    if (!user || !exerciseId) {
      setProgressData([]);
      setHistoryEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Per spec: fetch ALL workouts for progress (no limit)
      const workouts = await getAllWorkoutsForProgress(user.uid);
      
      // Process workouts for this exercise
      const dataByDate: { [date: string]: ProgressDataPoint } = {};
      const entries: ExerciseHistoryEntry[] = [];

      workouts.forEach((workout) => {
        const exerciseData = workout.exercises?.[exerciseId];
        if (!exerciseData) return;

        const sets = Object.values(exerciseData.sets || {});
        
        // Per spec: only include sets with BOTH weight AND reps for charts
        const validSets = sets.filter(
          (s) => s.weight && s.reps && Number(s.weight) > 0 && Number(s.reps) > 0
        );

        if (validSets.length === 0) return;

        // Calculate max weight
        const weights = validSets.map((s) => Number(s.weight));
        const maxWeight = Math.max(...weights);

        // Calculate total volume (weight × reps)
        const totalVolume = validSets.reduce(
          (sum, s) => sum + Number(s.weight) * Number(s.reps),
          0
        );

        // Calculate body weight ratio
        const bodyWeightRatio = workout.bodyWeight
          ? maxWeight / workout.bodyWeight
          : null;

        // Store by date
        if (!dataByDate[workout.date]) {
          dataByDate[workout.date] = {
            date: workout.date,
            maxWeight: 0,
            totalVolume: 0,
            bodyWeightRatio: null,
            bodyWeight: workout.bodyWeight,
          };
        }

        // Keep highest values for each date
        const existing = dataByDate[workout.date];
        dataByDate[workout.date] = {
          ...existing,
          maxWeight: Math.max(existing.maxWeight, maxWeight),
          totalVolume: existing.totalVolume + totalVolume,
          bodyWeightRatio: bodyWeightRatio ?? existing.bodyWeightRatio,
          bodyWeight: workout.bodyWeight ?? existing.bodyWeight,
        };

        // Add to history entries (for table)
        entries.push({
          date: workout.date,
          workoutName: workout.name || 'Untitled',
          bodyWeight: workout.bodyWeight,
          sets: validSets,
        });
      });

      // Convert to sorted arrays
      const sortedProgress = Object.values(dataByDate).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const sortedHistory = entries.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setProgressData(sortedProgress);
      setHistoryEntries(sortedHistory);
    } catch (err) {
      console.error('Failed to load exercise progress:', err);
    } finally {
      setLoading(false);
    }
  }, [user, exerciseId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  return {
    loading,
    progressData,
    historyEntries,
    refresh: loadProgress,
  };
}
