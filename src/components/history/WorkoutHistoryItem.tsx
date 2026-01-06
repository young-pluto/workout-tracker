import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Workout } from '../../types';
import { formatDateDisplay } from '../../lib/utils';

interface WorkoutHistoryItemProps {
  workout: Workout;
  onEdit: (workout: Workout) => void;
}

export function WorkoutHistoryItem({ workout, onEdit }: WorkoutHistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const exerciseEntries = Object.entries(workout.exercises || {});
  const exerciseCount = exerciseEntries.length;
  
  // Calculate total sets
  const totalSets = exerciseEntries.reduce((acc, [, data]) => {
    return acc + Object.keys(data.sets || {}).length;
  }, 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] overflow-hidden card-interactive"
    >
      {/* Header - Tappable area */}
      <button
        className="w-full text-left p-4 tap-target"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Top row: Title + Expand indicator */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-[15px] text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] truncate leading-tight">
              {workout.name || 'Workout'}
            </h3>
            <p className="text-[13px] text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] mt-0.5">
              {formatDateDisplay(workout.date)}
            </p>
          </div>
          
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] mt-0.5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-[13px]">
            <svg className="w-4 h-4 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
            </svg>
            <span className="text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
              {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 text-[13px]">
            <svg className="w-4 h-4 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 6.878V6a2.25 2.25 0 012.25-2.25h7.5A2.25 2.25 0 0118 6v.878m-12 0c.235-.083.487-.128.75-.128h10.5c.263 0 .515.045.75.128m-12 0A2.25 2.25 0 004.5 9v.878m13.5-3A2.25 2.25 0 0119.5 9v.878m0 0a2.246 2.246 0 00-.75-.128H5.25c-.263 0-.515.045-.75.128m15 0A2.25 2.25 0 0121 12v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6c0-.98.626-1.813 1.5-2.122" />
            </svg>
            <span className="text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
              {totalSets} set{totalSets !== 1 ? 's' : ''}
            </span>
          </div>
          
          {workout.bodyWeight && (
            <div className="flex items-center gap-1.5 text-[13px]">
              <svg className="w-4 h-4 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971z" />
              </svg>
              <span className="text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
                {workout.bodyWeight}kg
              </span>
            </div>
          )}
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
              {/* Exercises list */}
              <div className="divide-y divide-[var(--color-border-subtle)] dark:divide-[var(--color-dark-border)]">
                {exerciseEntries.map(([id, data]) => {
                  const sets = Object.entries(data.sets || {}).sort(([a], [b]) => {
                    const numA = parseInt(a.replace('set', ''), 10);
                    const numB = parseInt(b.replace('set', ''), 10);
                    return numA - numB;
                  });

                  return (
                    <div key={id} className="px-4 py-3">
                      <h4 className="font-medium text-[14px] text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] mb-2">
                        {data.name}
                      </h4>
                      
                      {/* Sets as inline text - cleaner than badges */}
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
                        {sets.map(([setKey, setData], i) => (
                          <span key={setKey} className="inline-flex items-center">
                            <span className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] mr-1">
                              {i + 1}.
                            </span>
                            <span className="font-medium text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
                              {setData.weight && `${setData.weight}kg`}
                              {setData.weight && setData.reps && ' × '}
                              {setData.reps && `${setData.reps}`}
                            </span>
                            {setData.remarks && (
                              <span className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] ml-1 italic">
                                ({setData.remarks})
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer actions */}
              <div className="px-4 py-3 bg-[var(--color-surface-secondary)] dark:bg-[var(--color-dark-surface-secondary)]">
                <button
                  onClick={(e) => { e.stopPropagation(); onEdit(workout); }}
                  className="text-[13px] font-medium text-[var(--color-accent)] dark:text-[var(--color-dark-accent)] tap-target"
                >
                  Edit workout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
