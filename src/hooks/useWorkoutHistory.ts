import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getWorkoutHistory } from '../lib/db';
import type { Workout } from '../types';

/**
 * Hook for workout history
 * Per spec: Uses once() not realtime, limited to 50 workouts
 */
export function useWorkoutHistory() {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!user) {
      setWorkouts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Per spec: limited to 50 workouts, ordered by timestamp
      const history = await getWorkoutHistory(user.uid, 50);
      console.log('[useWorkoutHistory] Loaded', history.length, 'workouts');
      setWorkouts(history);
    } catch (err: any) {
      console.error('[useWorkoutHistory] Failed to load workout history:', err);
      setError(err?.message || 'Failed to load workout history');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    workouts,
    loading,
    error,
    refresh: loadHistory,
  };
}
