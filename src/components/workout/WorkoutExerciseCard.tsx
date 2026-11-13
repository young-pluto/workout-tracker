import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SetItem } from './SetItem';
import { SessionBlock } from '../history/SetLine';
import { ExerciseHistorySheet } from '../history/ExerciseHistorySheet';
import type { WorkoutEditorExercise } from '../../types';
import { getExerciseSessions } from '../../lib/db';
import type { ExerciseSession } from '../../lib/history';
import { useAuth } from '../../contexts/AuthContext';

/** How many recent sessions the inline "Previous" panel shows */
const RECENT_SESSIONS = 2;

interface WorkoutExerciseCardProps {
  exercise: WorkoutEditorExercise;
  /** Workout being edited from History, kept out of its own "Previous" */
  excludeWorkoutId?: string | null;
  onToggleCollapse: () => void;
  onToggleHistory: () => void;
  onRemove: () => void;
  onAddSet: () => void;
  onUpdateSet: (setId: string, data: any) => void;
  onSaveSet: (setId: string) => void;
  onDeleteSet: (setId: string) => void;
}

export function WorkoutExerciseCard({
  exercise,
  excludeWorkoutId,
  onToggleCollapse,
  onToggleHistory,
  onRemove,
  onAddSet,
  onUpdateSet,
  onSaveSet,
  onDeleteSet,
}: WorkoutExerciseCardProps) {
  const { user } = useAuth();

  // Every past session of this exercise (all of history, newest first).
  // null = not loaded yet.
  const [sessions, setSessions] = useState<ExerciseSession[] | null>(null);
  const [historyError, setHistoryError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);

  // (Re)load whenever the panel opens; reads are cached, so this is cheap.
  useEffect(() => {
    if (!exercise.showHistory || !user) return;
    let cancelled = false;
    getExerciseSessions(user.uid, exercise.exerciseId, excludeWorkoutId)
      .then((result) => {
        if (cancelled) return;
        setSessions(result);
        setHistoryError(false);
      })
      .catch((err) => {
        console.error('Failed to load exercise history:', err);
        if (!cancelled) setHistoryError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [exercise.showHistory, exercise.exerciseId, excludeWorkoutId, user, reloadKey]);

  const retryHistory = () => {
    setHistoryError(false);
    setReloadKey((k) => k + 1);
  };

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  // Count saved sets for display
  const savedSetsCount = exercise.sets.filter(s => s.isSaved).length;
  const totalSetsCount = exercise.sets.length;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] rounded-xl overflow-hidden"
    >
      {/* Header - Tappable to expand/collapse */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-[var(--color-surface-secondary)] dark:active:bg-[var(--color-dark-surface-secondary)] transition-colors"
        onClick={onToggleCollapse}
      >
        {/* Left accent bar */}
        <div className="w-1 h-8 rounded-full bg-[var(--color-accent)] dark:bg-[var(--color-dark-accent)] shrink-0" />
        
        {/* Title + progress */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[15px] text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] truncate">
            {exercise.name}
          </h3>
          {savedSetsCount > 0 && (
            <p className="text-[13px] text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
              {savedSetsCount}/{totalSetsCount} sets logged
            </p>
          )}
        </div>

        {/* Collapse chevron */}
        <motion.div
          animate={{ rotate: exercise.isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.15 }}
          className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {!exercise.isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Previous sessions - Optional toggle */}
            <AnimatePresence initial={false}>
              {exercise.showHistory && (
                <motion.div
                  key="previous"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pt-2 pb-2.5 bg-[var(--color-surface-secondary)]/50 dark:bg-[var(--color-dark-surface-secondary)]/50">
                    <div className="flex items-center justify-between min-h-[32px]">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
                        Previous
                      </p>
                      {sessions && sessions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setSheetOpen(true)}
                          aria-label={`Full history, ${sessions.length} sessions`}
                          className="-mr-2 h-8 px-2 flex items-center gap-1.5 rounded-lg text-[12px] font-medium text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)] active:bg-[var(--color-border)] dark:active:bg-[var(--color-dark-border-subtle)] transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                          <span className="tabular-nums">
                            {sessions.length} session{sessions.length !== 1 ? 's' : ''}
                          </span>
                          <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </button>
                      )}
                    </div>

                    {historyError ? (
                      <div className="flex items-center justify-between py-1.5">
                        <p className="text-[13px] text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
                          Couldn’t load history
                        </p>
                        <button
                          type="button"
                          onClick={retryHistory}
                          className="h-8 px-2 -mr-2 text-[13px] font-medium text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] active:opacity-60"
                        >
                          Retry
                        </button>
                      </div>
                    ) : sessions === null ? (
                      <div className="space-y-2 py-1" aria-label="Loading history">
                        <div className="skeleton h-3.5 w-24" />
                        <div className="skeleton h-3.5 w-40" />
                        <div className="skeleton h-3.5 w-36" />
                      </div>
                    ) : sessions.length === 0 ? (
                      <p className="py-1.5 text-[13px] text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
                        No previous sessions yet
                      </p>
                    ) : (
                      <div className="divide-y divide-[var(--color-border)]/60 dark:divide-[var(--color-dark-border)]">
                        {sessions.slice(0, RECENT_SESSIONS).map((session) => (
                          <SessionBlock
                            key={session.workoutId}
                            session={session}
                            notes="toggle"
                            className="py-2 first:pt-0.5 last:pb-0"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sets list */}
            <div className="px-4 py-2 space-y-1">
              {exercise.sets.map((set, index) => (
                <SetItem
                  key={set.id}
                  set={set}
                  setNumber={index + 1}
                  onUpdate={(data) => onUpdateSet(set.id, data)}
                  onSave={() => onSaveSet(set.id)}
                  onDelete={() => onDeleteSet(set.id)}
                  canDelete={exercise.sets.length > 1}
                />
              ))}
            </div>

            {/* Bottom actions row */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-[var(--color-border)]/50 dark:border-[var(--color-dark-border)]/50">
              {/* Add Set - Primary inline action */}
              <button
                onClick={onAddSet}
                className="flex items-center gap-1.5 py-1.5 text-[13px] font-medium text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] active:opacity-70"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Set
              </button>

              {/* Secondary actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleHistory}
                  className={`p-1.5 rounded-md text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] ${
                    exercise.showHistory ? 'bg-[var(--color-surface-secondary)] dark:bg-[var(--color-dark-surface-secondary)]' : ''
                  }`}
                  title="History"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  onClick={onRemove}
                  className="p-1.5 rounded-md text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] active:text-[var(--color-error)]"
                  title="Remove"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ExerciseHistorySheet
        isOpen={sheetOpen}
        onClose={closeSheet}
        exerciseName={exercise.name}
        muscleGroup={exercise.muscleGroup}
        sessions={sessions ?? []}
      />
    </motion.div>
  );
}
