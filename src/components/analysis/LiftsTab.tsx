import { useMemo, useState } from 'react';
import type { Analytics, LiftStatus, LiftSummary } from '../../lib/analytics';
import { formatDay, mean } from '../../lib/analytics/core';
import { cn } from '../../lib/utils';
import { Sparkline } from './charts/Figures';
import { Card, Delta, Empty, MuscleDot, Note, Segmented, StatusTag } from './ui';
import { fmt, hairline, ink, ink2, muted, subtleBg, divider } from './styles';
import { STATUS_META } from './shared';
import { LiftSheet } from './LiftSheet';

const ACTIVE_ORDER: LiftStatus[] = ['regressing', 'plateau', 'rebuilding', 'progressing', 'new'];

export function LiftsTab({ a }: { a: Analytics }) {
  const [view, setView] = useState<'active' | 'rotated'>('active');
  const [openId, setOpenId] = useState<string | null>(null);

  const withLoad = useMemo(() => a.lifts.filter((l) => l.points.length > 0), [a.lifts]);
  const active = useMemo(
    () =>
      withLoad
        .filter((l) => l.status !== 'rotated')
        .sort((x, y) => ACTIVE_ORDER.indexOf(x.status) - ACTIVE_ORDER.indexOf(y.status) || y.sessionCount - x.sessionCount),
    [withLoad]
  );
  const rotated = useMemo(() => withLoad.filter((l) => l.status === 'rotated').sort((x, y) => y.lastDay - x.lastDay), [withLoad]);
  const list = view === 'active' ? active : rotated;
  const open = openId ? a.lifts.find((l) => l.exerciseId === openId) ?? null : null;

  const counts = (['progressing', 'rebuilding', 'plateau', 'regressing'] as LiftStatus[]).map((s) => ({
    status: s,
    n: active.filter((l) => l.status === s).length,
  }));

  return (
    <div className="space-y-3">
      <Card
        eyebrow="Helms · RIR-normalized progression"
        title="Your lifts"
        info={
          <>
            <p>
              Strength is tracked as <b>e10RM @ 2 RIR</b>: the load you could lift for 10 reps with 2 in reserve, estimated from every set's
              load, reps and RPE (Epley). It means adding weight only counts when it wasn't bought by grinding closer to failure.
            </p>
            <p>
              Sets without an RPE use RPE written in the remark ("rpe 9", "2 rir", "1 in the tank"), treat "failed / partials / rest pause" as
              0 RIR, and otherwise assume your typical RPE ({10 - a.dataset.typicalRir}). {fmt.pct(a.dataset.ratedShare)} of all sets carry real
              effort data.
            </p>
            <p>
              <b>Progressing</b>: a new best in the last 6 weeks or rising at your best. <b>Climbing back</b>: rising but still under an older
              best. <b>Plateau</b>: no new best for 6+ weeks. <b>Regressing</b>: trending down more than 1.5% a month.
            </p>
          </>
        }
      >
        <div className="grid grid-cols-4 gap-2">
          {counts.map((c) => (
            <div key={c.status} className={cn('rounded-xl px-2 py-2 text-center', subtleBg)}>
              <p className={cn('text-[18px] font-semibold leading-tight', ink)}>{c.n}</p>
              <p className={cn('text-[10.5px] mt-0.5 leading-tight', ink2)}>{STATUS_META[c.status].label}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="px-0.5">
        <Segmented
          layoutId="lifts-view"
          value={view}
          onChange={setView}
          options={[
            { value: 'active', label: `Active · ${active.length}` },
            { value: 'rotated', label: `Rotated out · ${rotated.length}` },
          ]}
        />
      </div>

      <div className="rounded-2xl bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] overflow-hidden">
        {list.length === 0 ? (
          <Empty>{view === 'active' ? 'No lifts trained in the last 6 weeks.' : 'Nothing rotated out yet.'}</Empty>
        ) : (
          <ul className={cn('divide-y', divider)}>
            {list.map((l) => (
              <LiftRow key={l.exerciseId} lift={l} today={a.dataset.today} onOpen={() => setOpenId(l.exerciseId)} />
            ))}
          </ul>
        )}
      </div>

      <CalibrationCard a={a} />

      <LiftSheet lift={open} today={a.dataset.today} phaseByWeek={a.bodyweight.phaseByWeek} segments={a.bodyweight.segments} onClose={() => setOpenId(null)} />
    </div>
  );
}

function LiftRow({ lift, today, onOpen }: { lift: LiftSummary; today: number; onOpen: () => void }) {
  const meta = STATUS_META[lift.status];
  const clean = lift.points.filter((p) => !p.outlier);
  const spark = clean.slice(-12).map((p) => p.best);
  return (
    <li>
      <button type="button" onClick={onOpen} className="w-full text-left px-4 py-3 flex items-center gap-3 active:bg-[var(--color-surface-secondary)] dark:active:bg-[var(--color-dark-surface-secondary)] transition-colors">
        <div className="flex-1 min-w-0">
          <p className={cn('text-[14px] font-medium truncate', ink)}>{lift.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
            {lift.status === 'rotated' ? (
              <span className={cn('text-[12px] truncate', muted)}>Last done {formatDay(lift.lastDay, today)}</span>
            ) : (
              <StatusTag tone={meta.tone} className="!text-[11.5px]">
                {lift.status === 'plateau' && lift.weeksSincePr !== null ? `Plateau ${lift.weeksSincePr} wk` : meta.label}
              </StatusTag>
            )}
            {lift.readyForLoad && lift.status !== 'rotated' && (
              <span className={cn('text-[11px] px-1.5 py-[1px] rounded-md font-medium shrink-0', subtleBg, ink)}>Add load</span>
            )}
            <span className={cn('text-[12px] truncate inline-flex items-center gap-1 min-w-0', muted)}>
              <span aria-hidden="true">·</span>
              <MuscleDot muscle={lift.muscle} />
              <span className="truncate">{lift.muscle}</span>
            </span>
          </div>
        </div>
        <Sparkline values={spark} />
        <div className="w-[70px] text-right shrink-0">
          <p className={cn('text-[14px] font-semibold tabular-nums', ink)}>{fmt.kg(lift.current, 1)}</p>
          <p className="text-[11.5px]">
            {lift.status === 'rotated' ? <span className={muted}>{lift.sessionCount} sessions</span> : <Delta value={lift.velocity} unit="%/mo" />}
          </p>
        </div>
        <svg className={cn('w-4 h-4 shrink-0 -mr-1', muted)} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </li>
  );
}

function CalibrationCard({ a }: { a: Analytics }) {
  const active = a.lifts.filter((l) => l.status !== 'rotated');
  const byMuscle = new Map<string, number[]>();
  for (const l of active) {
    if (!l.dropOff) continue;
    const list = byMuscle.get(l.muscle) ?? [];
    list.push(l.dropOff.pct);
    byMuscle.set(l.muscle, list);
  }
  const rows = [...byMuscle.entries()].map(([muscle, v]) => ({ muscle, pct: mean(v) })).sort((x, y) => y.pct - x.pct);
  const maxPct = Math.max(30, ...rows.map((r) => r.pct));
  const pairs = active.reduce((s, l) => s + (l.calibration?.pairs ?? 0), 0);
  const under = active.reduce((s, l) => s + (l.calibration?.understated ?? 0), 0);
  const over = active.reduce((s, l) => s + (l.calibration?.overstated ?? 0), 0);
  const accuracy = pairs ? 1 - (under + over) / pairs : null;

  return (
    <Card
      eyebrow="Henselmans · Fatigue decay"
      title="Rep drop-off & RIR accuracy"
      info={
        <>
          <p>
            Drop-off is how many reps you lose from the first set to the last set held at the same load (up to 4 sets), last 12 weeks. A bigger
            drop means sets are closer to failure or rest is shorter; it's your personal work capacity.
          </p>
          <p>
            RIR accuracy checks consecutive sets at the same load: logging RPE 9.5+ and then matching or beating it on the next set means there
            was more in the tank; logging RPE 8 or less and then losing 3+ reps means it was harder than logged.
          </p>
        </>
      }
    >
      {rows.length === 0 ? (
        <Empty>Needs a few sessions with 2+ sets at the same load.</Empty>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.muscle} className="flex items-center gap-3">
              <span className={cn('w-[86px] text-[12.5px] truncate inline-flex items-center gap-1.5', ink2)}>
                <MuscleDot muscle={r.muscle} />
                {r.muscle}
              </span>
              <span className="flex-1 h-2 rounded-full overflow-hidden bg-[var(--viz-grid)]">
                <span className="block h-full rounded-full" style={{ width: `${Math.min(100, (r.pct / maxPct) * 100)}%`, background: 'var(--viz-1)' }} />
              </span>
              <span className={cn('w-[44px] text-right text-[12.5px] font-semibold tabular-nums', ink)}>−{fmt.num(r.pct)}%</span>
            </li>
          ))}
        </ul>
      )}
      {accuracy !== null && (
        <div className={cn('mt-3 pt-3 border-t flex items-baseline gap-2', hairline)}>
          <span className={cn('text-[19px] font-semibold', ink)}>{fmt.pct(accuracy)}</span>
          <span className={cn('text-[12.5px]', ink2)}>
            of {pairs} rated set pairs are consistent
            {under > 0 && ` · ${under} near-failure set${under === 1 ? '' : 's'} had reps left`}
            {over > 0 && ` · ${over} easy-logged set${over === 1 ? '' : 's'} were harder`}
          </span>
        </div>
      )}
      {accuracy !== null && under > over && under >= 3 && (
        <Note>When the next set matches a "9.5", that set probably had another rep in it. Pushing those last reps is free stimulus.</Note>
      )}
    </Card>
  );
}
