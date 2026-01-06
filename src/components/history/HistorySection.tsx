import { AnimatePresence } from 'framer-motion';
import { WorkoutHistoryItem } from './WorkoutHistoryItem';
import { WorkoutHistorySkeleton, Button } from '../ui';
import { useWorkoutHistory } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import { getGreeting } from '../../lib/utils';
import type { Workout } from '../../types';

interface HistorySectionProps {
  onEditWorkout: (workout: Workout) => void;
}

export function HistorySection({ onEditWorkout }: HistorySectionProps) {
  const { userData } = useAuth();
  const { workouts, loading, error, refresh } = useWorkoutHistory();

  const greeting = getGreeting();
  const firstName = userData?.name?.split(' ')[0] || 'there';

  return (
    <div className="flex flex-col h-full">
      {/* Header with greeting (per spec: personalized with user's name) */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
              {greeting}, {firstName}
            </p>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
              Workout History
            </h1>
          </div>
          <Button variant="ghost" size="sm" onClick={refresh}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </Button>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
          {loading ? 'Loading...' : `${workouts.length} workout${workouts.length !== 1 ? 's' : ''} recorded`}
        </p>
      </div>

      {/* Workout List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 pb-20">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <WorkoutHistorySkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              className="w-12 h-12 text-[var(--color-error)] mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-[var(--color-error)] font-medium mb-1">
              Error loading history
            </p>
            <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] mb-3">
              {error}
            </p>
            <Button variant="secondary" size="sm" onClick={refresh}>
              Try Again
            </Button>
          </div>
        ) : workouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              className="w-12 h-12 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
              No workouts recorded yet
            </p>
            <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] mt-1">
              Start a workout to see your history
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {workouts.map((workout) => (
                <WorkoutHistoryItem
                  key={workout.id}
                  workout={workout}
                  onEdit={onEditWorkout}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
