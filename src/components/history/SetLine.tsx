import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { WorkoutSet } from '../../types';
import { cn, rpeColor, rpeTint } from '../../lib/utils';
import { formatSessionDate, hasReps, hasWeight, relativeDay, type ExerciseSession } from '../../lib/history';

/**
 * How a set's remark is shown:
 * - 'toggle': hidden behind an info button (compact, used mid-workout)
 * - 'inline': always visible under the set (logs and full history)
 */
type NotesMode = 'toggle' | 'inline';

const muted = 'text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]';
const strong = 'font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]';

function SetLoad({ set }: { set: WorkoutSet }) {
  const w = hasWeight(set);
  const r = hasReps(set);
  return (
    <span className="flex items-baseline gap-1 min-w-0 tabular-nums text-[14px]">
      {w && (
        <span className={strong}>
          {set.weight}
          <span className={cn('ml-0.5 text-[12px] font-normal', muted)}>kg</span>
        </span>
      )}
      {w && r && <span className={cn('px-0.5', muted)}>×</span>}
      {r && (
        <span className={strong}>
          {set.reps}
          {!w && <span className={cn('ml-1 text-[12px] font-normal', muted)}>reps</span>}
        </span>
      )}
    </span>
  );
}

export function RpeTag({ value }: { value: number }) {
  return (
    <span
      className="px-1.5 py-0.5 rounded-md text-[11px] font-semibold tabular-nums shrink-0"
      style={{ backgroundColor: rpeTint(value), color: rpeColor(value) }}
    >
      RPE {value}
    </span>
  );
}

function InfoGlyph({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'w-7 h-7 -mr-1 flex items-center justify-center rounded-full shrink-0 transition-colors duration-150',
        active
          ? 'bg-[var(--color-border)] text-[var(--color-text-primary)] dark:bg-[var(--color-dark-border-subtle)] dark:text-[var(--color-dark-text-primary)]'
          : muted
      )}
    >
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.6}
          d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
        />
      </svg>
    </span>
  );
}

interface SetLineProps {
  set: WorkoutSet;
  index: number;
  notes: NotesMode;
}

export function SetLine({ set, index, notes }: SetLineProps) {
  const [open, setOpen] = useState(false);
  const remark = String(set.remarks ?? '').trim();
  const rpe = set.rpe !== undefined && set.rpe !== '' ? Number(set.rpe) : NaN;
  const toggleable = notes === 'toggle' && remark !== '';
  const showRemark = remark !== '' && (notes === 'inline' || open);

  const content = (
    <>
      <span className={cn('w-4 text-right text-[12px] tabular-nums shrink-0', muted)}>{index + 1}</span>
      <span className="flex-1 min-w-0">
        <SetLoad set={set} />
      </span>
      {!isNaN(rpe) && <RpeTag value={rpe} />}
      {/* Keep a fixed slot so RPE tags line up whether or not a row has a remark */}
      {notes === 'toggle' && (toggleable ? <InfoGlyph active={open} /> : <span className="w-6 shrink-0" />)}
    </>
  );

  return (
    <div>
      {toggleable ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`Set ${index + 1}${open ? ', hide remark' : ', show remark'}`}
          className="w-full min-h-[36px] flex items-center gap-3 py-1 text-left rounded-lg active:opacity-60 transition-opacity"
        >
          {content}
        </button>
      ) : (
        <div className="min-h-[32px] flex items-center gap-3 py-1">{content}</div>
      )}

      <AnimatePresence initial={false}>
        {showRemark && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="ml-7 mb-1.5 pl-2.5 border-l-2 border-[var(--color-border)] dark:border-[var(--color-dark-border-subtle)] text-[13px] leading-snug text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)] whitespace-pre-wrap break-words">
              {remark}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SessionBlockProps {
  session: ExerciseSession;
  notes: NotesMode;
  /** Show body weight and workout name (full history) */
  detailed?: boolean;
  className?: string;
}

export function SessionBlock({ session, notes, detailed = false, className }: SessionBlockProps) {
  return (
    <div className={className}>
      <div className="flex items-baseline gap-2 min-w-0">
        <span className="text-[13px] font-medium text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] shrink-0">
          {formatSessionDate(session.date)}
        </span>
        <span className={cn('text-[12px] shrink-0', muted)}>{relativeDay(session.date)}</span>
        {detailed && session.workoutName && (
          <span className={cn('text-[12px] truncate', muted)}>· {session.workoutName}</span>
        )}
        {detailed && session.bodyWeight ? (
          <span className={cn('ml-auto pl-2 text-[12px] tabular-nums shrink-0', muted)}>
            BW {session.bodyWeight} kg
          </span>
        ) : null}
      </div>
      <div className="mt-0.5">
        {session.sets.map((set, i) => (
          <SetLine key={i} set={set} index={i} notes={notes} />
        ))}
      </div>
    </div>
  );
}
