import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToExercises } from '../lib/db';
import type { Exercise } from '../types';

/**
 * Hook for managing exercises with REALTIME sync
 * Per spec: exercises use on('value') realtime listener
 */
export function useExercises() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setExercises([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Subscribe to realtime updates (per spec: exercises use realtime listener)
    const unsubscribe = subscribeToExercises(user.uid, (updatedExercises) => {
      setExercises(updatedExercises);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const getExerciseById = useCallback(
    (id: string): Exercise | undefined => {
      return exercises.find((e) => e.id === id);
    },
    [exercises]
  );

  return {
    exercises,
    loading,
    getExerciseById,
  };
}
