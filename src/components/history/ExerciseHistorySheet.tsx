import { useMemo } from 'react';
import { SessionBlock } from './SetLine';
import { BottomSheet } from '../ui/BottomSheet';
import { cn } from '../../lib/utils';
import { monthLabel, parseLocalDate, topSet, type ExerciseSession } from '../../lib/history';

interface ExerciseHistorySheetProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  muscleGroup?: string;
  sessions: ExerciseSession[];
}

const muted = 'text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]';

/**
 * Bottom sheet with every logged session of one exercise, grouped by month.
 * Swipe down on the header, tap outside, press Esc or tap × to close.
 */
export function ExerciseHistorySheet({
  isOpen,
  onClose,
  exerciseName,
  muscleGroup,
  sessions,
}: ExerciseHistorySheetProps) {
  const months = useMemo(() => {
    const groups: Array<{ key: string; label: string; sessions: ExerciseSession[] }> = [];
    for (const session of sessions) {
      const key = (session.date || '').slice(0, 7);
      const last = groups[groups.length - 1];
      if (last && last.key === key) last.sessions.push(session);
      else groups.push({ key, label: monthLabel(session.date), sessions: [session] });
    }
    return groups;
  }, [sessions]);

  const best = useMemo(() => topSet(sessions), [sessions]);
  const first = sessions.length > 0 ? sessions[sessions.length - 1].date : null;
  const firstLabel = first
    ? parseLocalDate(first).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : '—';

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={exerciseName}
      subtitle={`${muscleGroup ? `${muscleGroup} · ` : ''}Full history`}
      ariaLabel={`${exerciseName} history`}
    >
      {/* Summary */}
      <div className="mx-5 mb-2 grid grid-cols-3 rounded-xl bg-[var(--color-surface-secondary)] dark:bg-[var(--color-dark-surface-secondary)] divide-x divide-[var(--color-border)] dark:divide-[var(--color-dark-border-subtle)]">
        <Stat label="Top set" value={best ? `${best.weight} kg` : '—'} sub={best && best.reps ? `× ${best.reps}` : undefined} />
        <Stat label="Sessions" value={String(sessions.length)} />
        <Stat label="Since" value={firstLabel} />
      </div>

      {sessions.length === 0 ? (
        <p className={cn('px-5 py-10 text-center text-[14px]', muted)}>No sessions logged yet.</p>
      ) : (
        months.map((month) => (
          <section key={month.key}>
            <h3
              className={cn(
                'sticky top-0 z-10 px-5 pt-3 pb-1.5 text-[11px] font-medium uppercase tracking-wider',
                'bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]',
                muted
              )}
            >
              {month.label}
            </h3>
            <div className="px-5 divide-y divide-[var(--color-border-subtle)] dark:divide-[var(--color-dark-border)]">
              {month.sessions.map((session) => (
                <SessionBlock key={session.workoutId} session={session} notes="inline" detailed className="py-3" />
              ))}
            </div>
          </section>
        ))
      )}
      <div className="h-4" />
    </BottomSheet>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="px-3 py-2.5 min-w-0">
      <p className={cn('text-[11px] font-medium uppercase tracking-wider', muted)}>{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold tabular-nums truncate text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
        {value}
        {sub && <span className={cn('ml-1 text-[13px] font-normal', muted)}>{sub}</span>}
      </p>
    </div>
  );
}
