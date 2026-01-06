import { motion } from 'framer-motion';
import type { Exercise } from '../../types';
import { categoryConfig } from '../../lib/utils';

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit: (exercise: Exercise) => void;
  onDelete: (exercise: Exercise) => void;
  onViewProgress: (exercise: Exercise) => void;
}

export function ExerciseCard({
  exercise,
  onEdit,
  onDelete,
  onViewProgress,
}: ExerciseCardProps) {
  const category = categoryConfig[exercise.category as keyof typeof categoryConfig] || categoryConfig.other;
  const usageCount = exercise.usageCount ?? 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group p-4 rounded-2xl bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] hover:border-[var(--color-accent-muted)] dark:hover:border-[var(--color-dark-border-subtle)] transition-colors"
    >
      <div className="flex items-center gap-3">
        {/* Category indicator */}
        <div
          className="w-1 h-12 rounded-full shrink-0"
          style={{ backgroundColor: category.color }}
        />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] truncate">
            {exercise.name}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${category.color}20`,
                color: category.color,
              }}
            >
              {category.label}
            </span>
            <span className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
              Used in {usageCount} workout{usageCount !== 1 ? 's' : ''}
            </span>
          </div>
          {exercise.description && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] truncate">
              {exercise.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Progress chart */}
          <button
            onClick={() => onViewProgress(exercise)}
            className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-secondary)] dark:text-[var(--color-dark-text-muted)] dark:hover:text-[var(--color-dark-accent)] dark:hover:bg-[var(--color-dark-surface-secondary)] transition-colors"
            title="View progress"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(exercise)}
            className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-secondary)] dark:text-[var(--color-dark-text-muted)] dark:hover:text-[var(--color-dark-accent)] dark:hover:bg-[var(--color-dark-surface-secondary)] transition-colors"
            title="Edit exercise"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(exercise)}
            className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-muted)] dark:text-[var(--color-dark-text-muted)] transition-colors"
            title="Delete exercise"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
