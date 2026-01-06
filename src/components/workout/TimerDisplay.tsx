import { motion } from 'framer-motion';

interface TimerDisplayProps {
  formattedTime: string;
  isRunning: boolean;
  onToggle: () => void;
  onReset: () => void;
}

export function TimerDisplay({
  formattedTime,
  isRunning,
  onToggle,
  onReset,
}: TimerDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 rounded-2xl bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)]"
    >
      {/* Timer display */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-[var(--color-accent)]/10 dark:bg-[var(--color-dark-accent)]/10">
          <svg
            className="w-5 h-5 text-[var(--color-accent)] dark:text-[var(--color-dark-accent)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-2xl font-mono font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] tracking-wider">
            {formattedTime}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
            {isRunning ? 'Workout in progress' : 'Paused'}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggle}
          className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
            isRunning
              ? 'bg-[var(--color-warning)] text-white hover:bg-amber-600'
              : 'bg-[var(--color-success)] text-white hover:bg-green-600'
          }`}
        >
          {isRunning ? 'Pause' : 'Resume'}
        </button>
        <button
          onClick={onReset}
          className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] dark:text-[var(--color-dark-text-muted)] dark:hover:text-[var(--color-dark-text-primary)] dark:hover:bg-[var(--color-dark-surface-secondary)] transition-colors"
          title="Reset timer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
