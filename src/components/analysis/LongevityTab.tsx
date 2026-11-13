import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Analytics, LifespanState } from '../../lib/analytics';
import { formatDay } from '../../lib/analytics/core';
import { LOADING_LABEL, type LoadingClass } from '../../lib/analytics/profile';
import { cn } from '../../lib/utils';
import { Legend, SegmentedBar, ShareColumns } from './charts/Figures';
import { Card, Delta, Empty, MuscleDot, Note, StatusTag, type Tone } from './ui';
import { fmt, hairline, ink, ink2, muted, subtleBg, divider } from './styles';

const LOADING_KEYS: LoadingClass[] = ['supported', 'free', 'axial'];
const LOADING_COLOR: Record<LoadingClass, string> = {
  supported: 'var(--viz-1)',
  free: 'var(--viz-2)',
  axial: 'var(--viz-3)',
};

export function LongevityTab({ a }: { a: Analytics }) {
  return (
    <div className="space-y-3">
      <LoadingCard a={a} />
      <EfficiencyCard a={a} />
      <LifespanCard a={a} />
      <WearCard a={a} />
    </div>
  );
}

function LoadingCard({ a }: { a: Analytics }) {
  const L = a.longevity;
  const share = (k: LoadingClass, src = L.last90, total = L.last90Total) => (total ? src[k] / total : 0);
  const axialNow = share('axial');
  const axialBefore = share('axial', L.prior90, L.prior90Total);
  return (
    <Card
      eyebrow="Alberts · Axial-to-supported ratio"
      title="Where the load lands"
      info={
        <>
          <p>
            Hard sets in the last 90 days by how they load you. <b>Spinal-loaded</b>: standing barbell or Smith rows, shrugs, squats, hinges
            and overhead presses. <b>Free weight</b>: dumbbells, bodyweight and bench-supported bar work. <b>Machine & cable</b>: everything
            where a machine or cable carries the path, including chest-supported rows.
          </p>
          <p>
            A creeping spinal share is the classic way lower backs and elbows wear out over years. Classes are inferred from exercise names.
          </p>
        </>
      }
    >
      {L.last90Total === 0 ? (
        <Empty>No sets in the last 90 days.</Empty>
      ) : (
        <>
          <SegmentedBar
            ariaLabel="Hard sets by loading type, last 90 days"
            parts={LOADING_KEYS.map((k) => ({ key: k, label: LOADING_LABEL[k], value: L.last90[k], color: LOADING_COLOR[k] }))}
          />
          <div className="mt-2">
            <Legend items={LOADING_KEYS.map((k) => ({ label: LOADING_LABEL[k], color: LOADING_COLOR[k], value: fmt.pct(share(k)) }))} />
          </div>
          <p className={cn('text-[12.5px] leading-relaxed mt-3', ink2)}>
            {axialNow < 0.05
              ? 'Almost no spinal loading: your back recovers between sessions and the cost of each set lands on the target muscle.'
              : axialNow >= axialBefore + 0.05
                ? `Spinal loading rose from ${fmt.pct(axialBefore)} to ${fmt.pct(axialNow)} of sets. Pair heavy rows with chest-supported or cable work.`
                : `Spinal loading is ${fmt.pct(axialNow)} of sets and steady.`}
          </p>
          {L.months.length > 1 && (
            <div className={cn('mt-3 pt-3 border-t', hairline)}>
              <ShareColumns
                ariaLabel="Share of sets by loading type per month, last 12 months"
                keys={LOADING_KEYS.map((k) => ({ label: LOADING_LABEL[k], color: LOADING_COLOR[k] }))}
                columns={L.months.map((m) => {
                  const d = new Date(m.monthStartDay * 86_400_000);
                  return {
                    label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
                    short: d.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }),
                    values: LOADING_KEYS.map((k) => m.counts[k]),
                  };
                })}
              />
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function EfficiencyCard({ a }: { a: Analytics }) {
  const rows = a.progress.efficiency;
  const maxAbs = Math.max(0.5, ...rows.map((r) => Math.abs(r.pctPerMonth)));
  return (
    <Card
      eyebrow="Alberts · Minimum effective dose"
      title="Progress per set"
      info={
        <>
          <p>
            Last 12 months, per muscle: average strength change per month (e10RM across its lifts) next to the weekly sets it took, counting
            synergist sets at half. Getting a gain on 8 sets beats getting the same gain on 20, because the spare recovery goes to everything else.
          </p>
          <p>Sorted by return per set.</p>
        </>
      }
    >
      {rows.length === 0 ? (
        <Empty>Needs a few months of repeated lifts.</Empty>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => {
            const w = (Math.abs(r.pctPerMonth) / maxAbs) * 50;
            return (
              <li key={r.muscle}>
                <div className="flex items-baseline gap-2">
                  <MuscleDot muscle={r.muscle} className="self-center" />
                  <span className={cn('text-[13px] font-medium', ink)}>{r.muscle}</span>
                  <span className={cn('ml-auto text-[12px] tabular-nums', muted)}>{fmt.num(r.setsPerWeek, 1)} sets/wk</span>
                  <Delta value={r.pctPerMonth} unit="%/mo" className="text-[12.5px] w-[76px] justify-end" />
                </div>
                <div className="relative h-1.5 mt-1.5 rounded-full bg-[var(--viz-grid)]">
                  <span className="absolute top-0 bottom-0 left-1/2 w-px bg-[var(--viz-axis)]" />
                  <span
                    className="absolute top-0 bottom-0 rounded-full"
                    style={{
                      left: r.pctPerMonth >= 0 ? '50%' : `${50 - w}%`,
                      width: `${w}%`,
                      background: r.pctPerMonth >= 0 ? 'var(--viz-1)' : 'var(--viz-2)',
                    }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {rows.length > 1 && rows[0].pctPerMonth > 0 && (
        <Note>
          Best return: {rows[0].muscle} ({fmt.signed(rows[0].pctPerMonth)}/mo on {fmt.num(rows[0].setsPerWeek, 1)} sets).
          {rows[rows.length - 1].pctPerMonth <= 0.1 && ` Least: ${rows[rows.length - 1].muscle}, where more sets aren't buying progress.`}
        </Note>
      )}
    </Card>
  );
}

const LIFESPAN_META: Record<LifespanState, { label: string; tone: Tone }> = {
  productive: { label: 'Productive', tone: 'good' },
  rebuilding: { label: 'Climbing back', tone: 'info' },
  holding: { label: 'Holding', tone: 'neutral' },
  stale: { label: 'Stale', tone: 'warning' },
  regressing: { label: 'Regressing', tone: 'critical' },
  creep: { label: 'Momentum creep', tone: 'serious' },
  rotated: { label: 'Rotated out', tone: 'neutral' },
};

function LifespanCard({ a }: { a: Analytics }) {
  const [showAll, setShowAll] = useState(false);
  const rows = a.longevity.lifespan;
  const active = rows.filter((r) => r.state !== 'rotated');
  const shown = showAll ? rows : active;
  const stale = active.filter((r) => r.state === 'stale').length;
  return (
    <Card
      eyebrow="Alberts & Nuñez · Exercise lifespan"
      title="How long staples stay productive"
      info={
        <>
          <p>
            Every movement with 6+ sessions, with the same verdicts as the Lifts tab. <b>Stale</b>: flat with no new best for 8+ weeks, a
            candidate to rotate. <b>Climbing back</b>: rising again but still under an older best. <b>Momentum creep</b>: load rising together with more partials/momentum notes, so the "progress"
            may be form drift.
          </p>
        </>
      }
    >
      {shown.length === 0 ? (
        <Empty>No staple lifts yet.</Empty>
      ) : (
        <ul className={cn('-mx-1 divide-y', divider)}>
          {shown.map((r) => {
            const meta = LIFESPAN_META[r.state];
            return (
              <li key={r.lift.exerciseId} className="px-1 py-2.5 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className={cn('text-[13.5px] font-medium truncate', ink)}>{r.lift.name}</p>
                  <p className={cn('text-[11.5px] mt-0.5 truncate', muted)}>
                    {fmt.num(r.months, r.months < 10 ? 1 : 0)} mo · {r.lift.sessionCount} sessions
                    {r.lift.weeksSincePr !== null && r.state !== 'rotated' ? ` · best ${r.lift.weeksSincePr === 0 ? 'this week' : `${r.lift.weeksSincePr} wk ago`}` : ''}
                    {r.lift.painNotes.length > 0 ? ` · ${r.lift.painNotes.length} pain note${r.lift.painNotes.length === 1 ? '' : 's'}` : ''}
                  </p>
                </div>
                <StatusTag tone={meta.tone}>{meta.label}</StatusTag>
              </li>
            );
          })}
        </ul>
      )}
      <div className="flex items-center justify-between mt-2">
        <p className={cn('text-[12px]', muted)}>{stale > 0 ? `${stale} active staple${stale === 1 ? ' is' : 's are'} stale` : 'No stale staples'}</p>
        {rows.length > active.length && (
          <button type="button" onClick={() => setShowAll((v) => !v)} className={cn('font-medium px-2 py-1.5 -mr-2 rounded-lg', ink)}>
            <span className="text-[12.5px]">{showAll ? 'Active only' : `Show rotated (${rows.length - active.length})`}</span>
          </button>
        )}
      </div>
    </Card>
  );
}

function WearCard({ a }: { a: Analytics }) {
  const [open, setOpen] = useState<string | null>(null);
  const L = a.longevity;
  const today = a.dataset.today;
  return (
    <Card
      eyebrow="Alberts · Joint wear"
      title="Pain & injury notes"
      info={
        <p>
          Remarks that mention pain, injury, a tweak or a flare-up, grouped by the body part they name. "Painful" alone is skipped since it usually
          describes effort. Tap a row to read the notes.
        </p>
      }
    >
      <div className="flex items-baseline gap-2 mb-2">
        <span className={cn('text-[19px] font-semibold', ink)}>{L.painRecent}</span>
        <span className={cn('text-[12.5px]', ink2)}>
          in the last 90 days{L.painPrior > 0 || L.painRecent > 0 ? ` · ${L.painPrior} in the 90 before` : ''}
        </span>
      </div>
      {L.wear.length === 0 ? (
        <Empty>No pain or injury notes in your remarks.</Empty>
      ) : (
        <ul className={cn('-mx-1 divide-y', divider)}>
          {L.wear.map((w) => {
            const isOpen = open === w.part;
            return (
              <li key={w.part}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : w.part)}
                  aria-expanded={isOpen}
                  className="w-full px-1 py-2.5 flex items-center gap-3 text-left"
                >
                  <span className={cn('flex-1 text-[13.5px] font-medium', ink)}>{w.part}</span>
                  {w.recent > 0 && <StatusTag tone="warning">{w.recent} recent</StatusTag>}
                  <span className={cn('text-[12px] tabular-nums w-[52px] text-right', muted)}>{w.total} total</span>
                  <svg className={cn('w-4 h-4 transition-transform duration-200', muted, isOpen && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden space-y-1.5 px-1"
                    >
                      {w.notes.slice(0, 6).map((n, i) => (
                        <li key={i} className={cn('rounded-lg px-2.5 py-2 text-[12.5px] leading-snug', subtleBg, ink2, i === Math.min(5, w.notes.length - 1) && 'mb-2.5')}>
                          <span className={cn('block text-[11px] mb-0.5', muted)}>
                            {formatDay(n.day, today)} · {n.exercise}
                          </span>
                          {n.text}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
