import { motion } from 'framer-motion';
import type { WorkoutEditorSet } from '../../types';

interface SetItemProps {
  set: WorkoutEditorSet;
  setNumber: number;
  onUpdate: (data: Partial<WorkoutEditorSet>) => void;
  onSave: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function SetItem({
  set,
  setNumber,
  onUpdate,
  onSave,
  onDelete,
  canDelete,
}: SetItemProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave();
    }
  };

  if (set.isSaved) {
    // Saved state - show static values, click to edit
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-secondary)] dark:bg-[var(--color-dark-surface-secondary)] cursor-pointer hover:bg-[var(--color-border)] dark:hover:bg-[var(--color-dark-border)] transition-colors"
        onClick={() => onUpdate({ isSaved: false })}
      >
        <span className="w-6 text-center text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
          {setNumber}
        </span>
        <div className="flex-1 flex items-center gap-3 text-sm">
          {set.weight && (
            <span className="text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
              <span className="font-semibold">{set.weight}</span>
              <span className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] ml-1">kg</span>
            </span>
          )}
          {set.reps && (
            <span className="text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
              <span className="font-semibold">{set.reps}</span>
              <span className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] ml-1">reps</span>
            </span>
          )}
          {set.remarks && (
            <span className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] italic truncate">
              {set.remarks}
            </span>
          )}
        </div>
        <svg className="w-4 h-4 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
        </svg>
      </motion.div>
    );
  }

  // Edit state - show inputs
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 p-2"
    >
      <span className="w-6 text-center text-sm font-medium text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
        {setNumber}
      </span>

      {/* Weight input */}
      <div className="flex-1 min-w-0">
        <input
          type="number"
          inputMode="decimal"
          step="0.5"
          value={set.weight}
          onChange={(e) => onUpdate({ weight: e.target.value })}
          onKeyDown={handleKeyDown}
          placeholder="Weight"
          className="w-full px-3 py-2.5 text-sm bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-lg text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] placeholder:text-[var(--color-text-muted)] dark:placeholder:text-[var(--color-dark-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] dark:focus:ring-[var(--color-dark-accent)]"
        />
      </div>

      {/* Reps input */}
      <div className="flex-1 min-w-0">
        <input
          type="number"
          inputMode="numeric"
          value={set.reps}
          onChange={(e) => onUpdate({ reps: e.target.value })}
          onKeyDown={handleKeyDown}
          placeholder="Reps"
          className="w-full px-3 py-2.5 text-sm bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-lg text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] placeholder:text-[var(--color-text-muted)] dark:placeholder:text-[var(--color-dark-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] dark:focus:ring-[var(--color-dark-accent)]"
        />
      </div>

      {/* Save button */}
      <button
        onClick={onSave}
        className="p-2.5 rounded-lg bg-[var(--color-success)] text-white hover:bg-green-600 transition-colors shrink-0"
        title="Save set"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </button>

      {/* Delete button */}
      <button
        onClick={onDelete}
        disabled={!canDelete}
        className="p-2.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error-muted)] dark:text-[var(--color-dark-text-muted)] transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-[var(--color-text-muted)] disabled:hover:bg-transparent"
        title={canDelete ? 'Delete set' : 'Cannot delete last set'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}
