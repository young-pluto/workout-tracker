import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WorkoutHistoryItem } from './WorkoutHistoryItem';
import { WorkoutHistorySkeleton, Button } from '../ui';
import { useWorkoutHistory } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getGreeting } from '../../lib/utils';
import type { Workout } from '../../types';

interface HistorySectionProps {
  onEditWorkout: (workout: Workout) => void;
}

export function HistorySection({ onEditWorkout }: HistorySectionProps) {
  const { user, userData, logout } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { workouts, loading, error, refresh } = useWorkoutHistory();
  const [showProfile, setShowProfile] = useState(false);

  const greeting = getGreeting();
  const firstName = userData?.name?.split(' ')[0] || 'there';
  const userEmail = user?.email || '';

  return (
    <div className="flex flex-col h-full">
      {/* Header with greeting + profile button */}
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
          
          {/* Profile button */}
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="w-10 h-10 rounded-full bg-[var(--color-accent)] dark:bg-[var(--color-dark-accent)] flex items-center justify-center text-white dark:text-[var(--color-dark-background)] font-semibold text-sm"
          >
            {firstName.charAt(0).toUpperCase()}
          </button>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
          {loading ? 'Loading...' : `${workouts.length} workout${workouts.length !== 1 ? 's' : ''} recorded`}
        </p>
      </div>

      {/* Profile dropdown */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="mx-4 mb-3 p-4 rounded-xl bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
              {/* User info */}
              <div className="flex items-center gap-3 pb-3 border-b border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                <div className="w-12 h-12 rounded-full bg-[var(--color-accent)] dark:bg-[var(--color-dark-accent)] flex items-center justify-center text-white dark:text-[var(--color-dark-background)] font-bold text-lg">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] truncate">
                    {userData?.name || 'User'}
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] truncate">
                    {userEmail}
                  </p>
                </div>
              </div>

              {/* Settings */}
              <div className="pt-3 space-y-1">
                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg active:bg-[var(--color-surface-secondary)] dark:active:bg-[var(--color-dark-surface-secondary)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {resolvedTheme === 'dark' ? (
                      <svg className="w-5 h-5 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                      </svg>
                    )}
                    <span className="text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
                      {resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
                    </span>
                  </div>
                  <svg className="w-4 h-4 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>

                {/* Sign out */}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[var(--color-error)] active:bg-[var(--color-error-bg)] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
