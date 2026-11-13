import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useExercises } from './useExercises';
import { getAllWorkouts, invalidateWorkoutsCache } from '../lib/db';
import { computeAnalytics, type Analytics } from '../lib/analytics';
import type { Workout } from '../types';

/**
 * Loads every workout once (shared cache with the workout screen) and derives
 * the full longitudinal analysis. Exercise definitions stay realtime, so a
 * muscle-group change re-buckets past workouts immediately.
 */
export function useAnalytics() {
  const { user } = useAuth();
  const { exercises, loading: exercisesLoading } = useExercises();
  const [workouts, setWorkouts] = useState<Workout[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getAllWorkouts(user.uid)
      .then((list) => {
        if (cancelled) return;
        setWorkouts(list);
        setError(null);
      })
      .catch((err) => {
        console.error('Failed to load workouts for analysis:', err);
        if (!cancelled) setError('Could not load your workouts.');
      })
      .finally(() => {
        if (!cancelled) setRefreshing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, reloadKey]);

  const refresh = useCallback(() => {
    invalidateWorkoutsCache();
    setRefreshing(true);
    setReloadKey((k) => k + 1);
  }, []);

  const analytics: Analytics | null = useMemo(() => {
    if (!workouts || exercisesLoading) return null;
    return computeAnalytics(workouts, exercises);
  }, [workouts, exercises, exercisesLoading]);

  return {
    analytics,
    loading: !analytics && !error,
    refreshing,
    error,
    refresh,
  };
}
