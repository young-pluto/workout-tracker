import { useState, useRef, useEffect, useCallback } from 'react';
import { formatTime } from '../lib/utils';

/**
 * Workout Timer Hook
 * Per spec: Timer is MEMORY-ONLY (not persisted to Firebase)
 * Uses Date.now() for background tab catchup
 */
export function useTimer() {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  const startTimeRef = useRef(0);
  const pausedTimeRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateElapsed = useCallback(() => {
    if (startTimeRef.current) {
      setElapsedTime(Date.now() - startTimeRef.current);
    }
  }, []);

  const start = useCallback(() => {
    if (pausedTimeRef.current > 0) {
      // Resume from paused state
      startTimeRef.current = Date.now() - pausedTimeRef.current;
      pausedTimeRef.current = 0;
    } else {
      // Fresh start
      startTimeRef.current = Date.now();
    }
    
    setIsRunning(true);
    
    // Start interval (1 second updates per spec)
    intervalRef.current = setInterval(updateElapsed, 1000);
  }, [updateElapsed]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Store elapsed time for resume
    pausedTimeRef.current = Date.now() - startTimeRef.current;
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    startTimeRef.current = 0;
    pausedTimeRef.current = 0;
    setElapsedTime(0);
    setIsRunning(false);
  }, []);

  const toggle = useCallback(() => {
    if (isRunning) {
      pause();
    } else {
      start();
    }
  }, [isRunning, pause, start]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    elapsedTime,
    isRunning,
    formattedTime: formatTime(elapsedTime),
    start,
    pause,
    reset,
    toggle,
  };
}
