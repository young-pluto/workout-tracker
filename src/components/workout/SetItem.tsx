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
  // Handle keyboard done button on iOS
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
      onSave();
    }
  };

  // Handle blur - auto-save if valid data
  const handleBlur = () => {
    if (set.weight || set.reps) {
      setTimeout(() => onSave(), 100);
    }
  };

  if (set.isSaved) {
    // Saved state - Compact, tappable to edit
    return (
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        type="button"
        onClick={() => onUpdate({ isSaved: false })}
        className="w-full flex items-center gap-3 py-2 px-3 rounded-lg bg-[var(--color-surface-secondary)] dark:bg-[var(--color-dark-surface-secondary)] active:bg-[var(--color-border)] dark:active:bg-[var(--color-dark-border)] transition-colors text-left"
      >
        {/* Set number */}
        <span className="w-5 h-5 flex items-center justify-center text-xs font-medium text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] rounded-full">
          {setNumber}
        </span>
        
        {/* Weight × Reps */}
        <div className="flex-1 flex items-center gap-2 text-[14px]">
          {set.weight && (
            <span className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
              {set.weight}<span className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] font-normal ml-0.5">kg</span>
            </span>
          )}
          {set.weight && set.reps && (
            <span className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">×</span>
          )}
          {set.reps && (
            <span className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
              {set.reps}
            </span>
          )}
          {set.remarks && (
            <span className="text-[13px] text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] truncate">
              • {set.remarks}
            </span>
          )}
        </div>
        
        {/* Edit indicator */}
        <svg className="w-4 h-4 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
        </svg>
      </motion.button>
    );
  }

  // Edit state - Focused inputs
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 py-1"
    >
      {/* Set number */}
      <span className="w-5 h-5 flex items-center justify-center text-xs font-medium text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] bg-[var(--color-surface-secondary)] dark:bg-[var(--color-dark-surface-secondary)] rounded-full shrink-0">
        {setNumber}
      </span>

      {/* Weight input */}
      <input
        type="number"
        inputMode="decimal"
        enterKeyHint="done"
        step="0.5"
        value={set.weight}
        onChange={(e) => onUpdate({ weight: e.target.value })}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="kg"
        className="w-20 px-2.5 py-2 text-[14px] text-center font-medium bg-[var(--color-background)] dark:bg-[var(--color-dark-background)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-lg text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] dark:focus:ring-[var(--color-dark-accent)]"
      />

      {/* × separator */}
      <span className="text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">×</span>

      {/* Reps input */}
      <input
        type="number"
        inputMode="numeric"
        enterKeyHint="done"
        value={set.reps}
        onChange={(e) => onUpdate({ reps: e.target.value })}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="reps"
        className="w-20 px-2.5 py-2 text-[14px] text-center font-medium bg-[var(--color-background)] dark:bg-[var(--color-dark-background)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-lg text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] dark:focus:ring-[var(--color-dark-accent)]"
      />

      {/* Spacer */}
      <div className="flex-1" />

      {/* Save button */}
      <button
        onClick={onSave}
        className="p-2 rounded-lg bg-[var(--color-success)] text-white active:scale-95 transition-transform"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </button>

      {/* Delete button */}
      {canDelete && (
        <button
          onClick={onDelete}
          className="p-2 rounded-lg text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] active:text-[var(--color-error)] active:bg-[var(--color-error-bg)] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </motion.div>
  );
}
