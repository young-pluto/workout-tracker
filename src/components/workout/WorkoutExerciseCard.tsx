import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SetItem } from './SetItem';
import type { WorkoutEditorExercise, WorkoutSet } from '../../types';
import { getExerciseHistory } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

interface WorkoutExerciseCardProps {
  exercise: WorkoutEditorExercise;
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
  onToggleCollapse,
  onToggleHistory,
  onRemove,
  onAddSet,
  onUpdateSet,
  onSaveSet,
  onDeleteSet,
}: WorkoutExerciseCardProps) {
  const { user } = useAuth();
  
  // History state
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<Array<{
    date: string;
    bodyWeight: number | null;
    sets: WorkoutSet[];
  }>>([]);

  // Load history when toggled
  useEffect(() => {
    if (exercise.showHistory && user && historyData.length === 0) {
      setHistoryLoading(true);
      getExerciseHistory(user.uid, exercise.exerciseId, 10)
        .then((workouts) => {
          const history = workouts.map((w) => ({
            date: w.date,
            bodyWeight: w.bodyWeight,
            sets: Object.values(w.exercises[exercise.exerciseId]?.sets || {}),
          }));
          setHistoryData(history);
        })
        .catch(console.error)
        .finally(() => setHistoryLoading(false));
    }
  }, [exercise.showHistory, exercise.exerciseId, user]);

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
            {/* Previous history - Optional toggle */}
            {exercise.showHistory && (
              <div className="px-4 py-2 bg-[var(--color-surface-secondary)]/50 dark:bg-[var(--color-dark-surface-secondary)]/50">
                <p className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] mb-2">
                  Previous
                </p>
                {historyLoading ? (
                  <p className="text-[13px] text-[var(--color-text-muted)]">Loading...</p>
                ) : historyData.length === 0 ? (
                  <p className="text-[13px] text-[var(--color-text-muted)]">No previous data</p>
                ) : (
                  <div className="space-y-1.5">
                    {historyData.slice(0, 3).map((entry, i) => (
                      <div key={i} className="flex items-center gap-2 text-[13px]">
                        <span className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] shrink-0">
                          {entry.date.slice(5)}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {entry.sets.map((set, j) => (
                            <span
                              key={j}
                              className="text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]"
                            >
                              {set.weight}×{set.reps}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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
    </motion.div>
  );
}
