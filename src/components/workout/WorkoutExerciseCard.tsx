import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SetItem } from './SetItem';
import type { WorkoutEditorExercise, WorkoutSet } from '../../types';
import { categoryConfig } from '../../lib/utils';
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
  const category = categoryConfig[exercise.category as keyof typeof categoryConfig] || categoryConfig.other;
  
  // History state
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyData, setHistoryData] = useState<Array<{
    date: string;
    bodyWeight: number | null;
    sets: WorkoutSet[];
  }>>([]);

  // Load history when toggled (per spec: limited to 10 workouts)
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

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={onToggleCollapse}
      >
        <div
          className="w-1 h-10 rounded-full shrink-0"
          style={{ backgroundColor: category.color }}
        />
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] truncate">
            {exercise.name}
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
            {exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* History toggle */}
          <button
            onClick={onToggleHistory}
            className={`p-2 rounded-lg transition-colors ${
              exercise.showHistory
                ? 'text-[var(--color-accent)] bg-[var(--color-surface-secondary)] dark:text-[var(--color-dark-accent)] dark:bg-[var(--color-dark-surface-secondary)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] dark:text-[var(--color-dark-text-muted)] dark:hover:text-[var(--color-dark-text-primary)] dark:hover:bg-[var(--color-dark-surface-secondary)]'
            }`}
            title="View history"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Remove exercise */}
          <button
            onClick={onRemove}
            className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-muted)] dark:text-[var(--color-dark-text-muted)] transition-colors"
            title="Remove exercise"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Collapse indicator */}
          <motion.div
            animate={{ rotate: exercise.isCollapsed ? 0 : 180 }}
            className="p-2 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Collapsible content */}
      <AnimatePresence>
        {!exercise.isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* History panel */}
            {exercise.showHistory && (
              <div className="px-4 py-3 bg-[var(--color-surface-secondary)]/50 dark:bg-[var(--color-dark-surface-secondary)]/50 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                <h4 className="text-xs font-medium text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)] uppercase tracking-wider mb-2">
                  Previous Workouts
                </h4>
                {historyLoading ? (
                  <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
                    Loading...
                  </p>
                ) : historyData.length === 0 ? (
                  <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
                    No previous data
                  </p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {historyData.slice(0, 5).map((entry, i) => (
                      <div key={i} className="text-sm">
                        <span className="text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
                          {entry.date}
                          {entry.bodyWeight && (
                            <span className="ml-2 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
                              @ {entry.bodyWeight}kg
                            </span>
                          )}
                        </span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {entry.sets.map((set, j) => (
                            <span
                              key={j}
                              className="px-2 py-0.5 rounded bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] text-xs"
                            >
                              {set.weight}kg × {set.reps}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sets */}
            <div className="px-4 pb-4 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
              <div className="pt-2 space-y-1">
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

              {/* Add set button */}
              <button
                onClick={onAddSet}
                className="w-full mt-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)] hover:text-[var(--color-text-primary)] dark:hover:text-[var(--color-dark-text-primary)] border border-dashed border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-xl hover:border-[var(--color-accent)] dark:hover:border-[var(--color-dark-accent)] transition-colors"
              >
                + Add Set
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
