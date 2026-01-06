import { motion } from 'framer-motion';
import { Dialog, Button, Skeleton } from '../ui';
import type { Workout } from '../../types';
import { formatDateDisplay } from '../../lib/utils';

interface SavedEntriesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  entries: Workout[];
  loading: boolean;
  onSelectEntry: (entry: Workout) => void;
  onCreateNew: () => void;
}

export function SavedEntriesDialog({
  isOpen,
  onClose,
  entries,
  loading,
  onSelectEntry,
  onCreateNew,
}: SavedEntriesDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Resume Workout?"
      showCloseButton={false}
    >
      <div className="space-y-4">
        <p className="text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
          You have saved workout entries. Would you like to resume one?
        </p>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {entries.map((entry) => {
              const exerciseCount = Object.keys(entry.exercises || {}).length;
              return (
                <motion.button
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => onSelectEntry(entry)}
                  className="w-full p-4 text-left rounded-xl bg-[var(--color-surface-secondary)] dark:bg-[var(--color-dark-surface-secondary)] hover:bg-[var(--color-border)] dark:hover:bg-[var(--color-dark-border)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
                        {entry.name || 'Untitled Workout'}
                      </p>
                      <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
                        {formatDateDisplay(entry.date)} • {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <svg
                      className="w-5 h-5 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onCreateNew} className="flex-1">
            Create New
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
