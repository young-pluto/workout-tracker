import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn, muscleGroupColor } from '../../lib/utils';
import { ink, ink2, muted, subtleBg, fmt } from './styles';

export function Card({
  eyebrow,
  title,
  info,
  action,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  info?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section
      className={cn(
        'rounded-2xl p-4 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)]',
        className
      )}
    >
      <header className="flex items-start gap-2 mb-3">
        <div className="flex-1 min-w-0">
          {eyebrow && <p className={cn('text-[10.5px] font-medium uppercase tracking-[0.08em] mb-0.5', muted)}>{eyebrow}</p>}
          <h3 className={cn('text-[15px] font-semibold leading-snug', ink)}>{title}</h3>
        </div>
        {action}
        {info && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Hide how this is calculated' : 'How this is calculated'}
            className={cn(
              'w-8 h-8 -mr-1.5 -mt-1 flex items-center justify-center rounded-full shrink-0 transition-colors duration-150',
              open ? cn(subtleBg, ink) : muted
            )}
          >
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          </button>
        )}
      </header>
      <AnimatePresence initial={false}>
        {open && info && (
          <motion.div
            key="info"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className={cn('mb-3 rounded-xl px-3 py-2.5 text-[12.5px] leading-relaxed space-y-1.5', subtleBg, ink2)}>{info}</div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </section>
  );
}

export function Stat({ label, value, sub, className }: { label: string; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className={cn('text-[11px] font-medium', muted)}>{label}</p>
      <p className={cn('mt-0.5 text-[19px] font-semibold leading-tight truncate', ink)}>{value}</p>
      {sub && <p className={cn('text-[11.5px] mt-0.5 truncate', ink2)}>{sub}</p>}
    </div>
  );
}

export type Tone = 'good' | 'warning' | 'serious' | 'critical' | 'neutral' | 'info';

const TONE_COLOR: Record<Tone, string> = {
  good: 'var(--viz-good)',
  warning: 'var(--viz-warning)',
  serious: 'var(--viz-serious)',
  critical: 'var(--viz-critical)',
  neutral: 'var(--viz-ink-muted)',
  info: 'var(--viz-1)',
};

function ToneIcon({ tone }: { tone: Tone }) {
  const color = TONE_COLOR[tone];
  if (tone === 'good') {
    return (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" aria-hidden="true">
        <circle cx="8" cy="8" r="7" fill={color} />
        <path d="M5 8.2l2 2 4-4.2" stroke="#fff" strokeWidth="1.7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (tone === 'warning' || tone === 'serious' || tone === 'critical') {
    return (
      <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M8 1.5l6.8 12a.8.8 0 01-.7 1.2H1.9a.8.8 0 01-.7-1.2L8 1.5z" fill={color} />
        <path d="M8 6v3.6" stroke={tone === 'warning' ? '#0b0b0b' : '#fff'} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="8" cy="11.9" r=".95" fill={tone === 'warning' ? '#0b0b0b' : '#fff'} />
      </svg>
    );
  }
  return <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} aria-hidden="true" />;
}

/** Status label: icon + text, never color alone. */
export function StatusTag({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[12px] font-medium whitespace-nowrap', ink2, className)}>
      <ToneIcon tone={tone} />
      {children}
    </span>
  );
}

export function Delta({ value, digits = 1, unit = '%', goodWhenUp = true, className }: { value: number | null; digits?: number; unit?: string; goodWhenUp?: boolean; className?: string }) {
  if (value === null || !Number.isFinite(value)) return <span className={cn(muted, className)}>—</span>;
  const flat = Math.abs(value) < 0.05;
  const good = flat ? null : (value > 0) === goodWhenUp;
  return (
    <span
      className={cn('inline-flex items-center gap-0.5 tabular-nums font-medium', className)}
      style={{ color: good === null ? undefined : good ? 'var(--viz-good-ink)' : 'var(--viz-critical-ink)' }}
    >
      {!flat && (
        <svg className="w-3 h-3" viewBox="0 0 12 12" aria-hidden="true">
          <path d={value > 0 ? 'M6 2.5l3.5 4.5h-7z' : 'M6 9.5L2.5 5h7z'} fill="currentColor" />
        </svg>
      )}
      {fmt.signed(value, digits, unit)}
    </span>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  size = 'md',
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  layoutId: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div role="tablist" className={cn('flex p-0.5 rounded-[10px]', subtleBg)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'relative flex-1 rounded-[8px] font-medium transition-colors duration-150',
              size === 'sm' ? 'h-7 px-2.5' : 'h-8 px-2',
              active ? ink : ink2
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-[8px] bg-[var(--color-surface)] dark:bg-[var(--color-dark-border-subtle)] shadow-[0_1px_3px_rgb(0_0_0/0.1)]"
                transition={{ type: 'spring', stiffness: 520, damping: 40 }}
              />
            )}
            <span className={cn('relative', size === 'sm' ? 'text-[12px]' : 'text-[13px]')}>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Horizontally scrolling muscle chips. */
export function MuscleChips({ muscles, value, onChange }: { muscles: string[]; value: string; onChange: (m: string) => void }) {
  return (
    <div className="-mx-4 px-4 flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
      {muscles.map((m) => {
        const active = m === value;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            aria-pressed={active}
            className={cn(
              'h-8 px-3 rounded-full font-medium whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 border transition-colors duration-150',
              active
                ? 'bg-[var(--color-accent)] text-white border-transparent dark:bg-[var(--color-dark-accent)] dark:text-[var(--color-dark-background)]'
                : cn('border-[var(--color-border)] dark:border-[var(--color-dark-border-subtle)]', ink2)
            )}
          >
            <MuscleDot muscle={m} />
            <span className="text-[12.5px]">{m}</span>
          </button>
        );
      })}
    </div>
  );
}

export function MuscleDot({ muscle, className }: { muscle: string; className?: string }) {
  return <span className={cn('w-2 h-2 rounded-full shrink-0', className)} style={{ background: muscleGroupColor(muscle) }} aria-hidden="true" />;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className={cn('text-[13px] py-4 text-center', muted)}>{children}</p>;
}

export function Note({ children }: { children: ReactNode }) {
  return <p className={cn('text-[12px] leading-relaxed mt-3', muted)}>{children}</p>;
}

/** Idle header line for a chart, aligned with where the scrub readout sits. */
export function ChartHint({ children }: { children: ReactNode }) {
  return <p className={cn('text-[12px] pt-[18px]', muted)}>{children}</p>;
}
