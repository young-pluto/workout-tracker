import type { LiftSummary, Note as LiftNote, Phase, PhaseSegment } from '../../lib/analytics';
import { formatDay, formatMonth, weekOf, weekStartDay } from '../../lib/analytics/core';
import { EQUIPMENT_LABEL, LOADING_LABEL } from '../../lib/analytics/profile';
import { cn } from '../../lib/utils';
import { BottomSheet } from '../ui/BottomSheet';
import { TimeChart, type TimeBand } from './charts/TimeChart';
import { Legend } from './charts/Figures';
import { Delta, StatusTag } from './ui';
import { fmt, hairline, ink, ink2, muted, subtleBg } from './styles';
import { PHASE_LABEL, PHASE_WASH, STATUS_META, monthTick } from './shared';

export function LiftSheet({
  lift,
  today,
  phaseByWeek,
  segments,
  onClose,
}: {
  lift: LiftSummary | null;
  today: number;
  phaseByWeek: Map<number, Phase>;
  segments: PhaseSegment[];
  onClose: () => void;
}) {
  return (
    <BottomSheet
      isOpen={!!lift}
      onClose={onClose}
      title={lift?.name ?? ''}
      subtitle={lift ? `${lift.muscle} · ${EQUIPMENT_LABEL[lift.profile.equipment]} · ${LOADING_LABEL[lift.profile.loading]}` : ''}
      ariaLabel={lift ? `${lift.name} analysis` : 'Lift analysis'}
    >
      {lift && <LiftDetail lift={lift} today={today} phaseByWeek={phaseByWeek} segments={segments} />}
    </BottomSheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={cn('px-5 py-4 border-t', hairline)}>
      <h3 className={cn('text-[11px] font-medium uppercase tracking-[0.08em] mb-2.5', muted)}>{title}</h3>
      {children}
    </section>
  );
}

function LiftDetail({ lift, today, phaseByWeek, segments }: { lift: LiftSummary; today: number; phaseByWeek: Map<number, Phase>; segments: PhaseSegment[] }) {
  const meta = STATUS_META[lift.status];
  const pts = lift.points;
  const xs = pts.map((p) => p.day);
  const bands: TimeBand[] = segments
    .filter((s) => weekStartDay(s.endWeek) + 7 >= (xs[0] ?? 0))
    .map((s) => ({ from: weekStartDay(s.startWeek), to: weekStartDay(s.endWeek) + 7, fill: PHASE_WASH[s.phase] }));
  const outliers = pts.filter((p) => p.outlier).length;

  return (
    <div className="pb-2">
      <div className="px-5 pb-4 grid grid-cols-3 gap-3">
        <div>
          <p className={cn('text-[11px] font-medium', muted)}>e10RM now</p>
          <p className={cn('text-[19px] font-semibold mt-0.5', ink)}>{fmt.kg(lift.current)}</p>
          <StatusTag tone={meta.tone} className="mt-0.5 !text-[11.5px]">
            {meta.label}
          </StatusTag>
        </div>
        <div>
          <p className={cn('text-[11px] font-medium', muted)}>Trend</p>
          <p className="text-[19px] font-semibold mt-0.5">
            <Delta value={lift.velocity} className="text-[17px]" />
          </p>
          <p className={cn('text-[11.5px] mt-0.5', ink2)}>per month, 12 wk</p>
        </div>
        <div>
          <p className={cn('text-[11px] font-medium', muted)}>Best</p>
          <p className={cn('text-[19px] font-semibold mt-0.5', ink)}>{fmt.kg(lift.best?.value ?? null)}</p>
          <p className={cn('text-[11.5px] mt-0.5', ink2)}>
            {lift.best ? formatDay(lift.best.day, today) : '—'}
            {lift.weeksSincePr !== null && lift.weeksSincePr > 0 ? ` · ${lift.weeksSincePr} wk ago` : ''}
          </p>
        </div>
      </div>

      <div className="px-5 pb-4">
        <TimeChart
          xs={xs}
          series={[
            { key: 'load', label: 'Top-set load', kind: 'line', color: 'var(--viz-deemph)', values: pts.map((p) => p.topLoad), hollow: pts.map((p) => p.outlier) },
            { key: 'e10', label: 'e10RM @ 2 RIR', kind: 'line', color: 'var(--viz-1)', values: pts.map((p) => p.best), hollow: pts.map((p) => p.outlier) },
          ]}
          bands={bands}
          height={130}
          formatY={(v) => fmt.num(v)}
          xTickLabel={monthTick}
          ariaLabel={`${lift.name}: e10RM and top-set load per session`}
          table={{
            columns: ['Date', 'e10RM (kg)', 'Top-set load (kg)', 'Sets'],
            row: (i) => [pts[i].date, pts[i].best.toFixed(1), pts[i].topLoad?.toString() ?? '', setsText(pts[i].sets)],
          }}
          readout={(i) => {
            const p = pts[i];
            const phase = phaseByWeek.get(weekOf(p.day));
            return (
              <div className="text-[12px] tabular-nums">
                <span className={cn('font-semibold text-[15px] mr-1.5', ink)}>{fmt.kg(p.best)}</span>
                <span className={ink2}>
                  {formatDay(p.day, today)}
                  {p.pr ? ' · new best' : ''}
                  {p.outlier ? ' · off-trend, not counted' : ''}
                </span>
                <div className={cn('truncate', muted)}>
                  {setsText(p.sets)}
                  {phase ? ` · ${PHASE_LABEL[phase]}` : ''}
                </div>
              </div>
            );
          }}
        />
        <div className="mt-2">
          <Legend
            shape="line"
            items={[
              { label: 'e10RM @ 2 RIR', color: 'var(--viz-1)' },
              { label: 'Top-set load', color: 'var(--viz-deemph)' },
            ]}
          />
        </div>
        {outliers > 0 && (
          <p className={cn('text-[11.5px] mt-2', muted)}>
            {outliers} session{outliers === 1 ? '' : 's'} far off the trend (hollow), likely a different gym's stack, so left out of the trend.
          </p>
        )}
      </div>

      {lift.bracket && (
        <Section title="Double progression">
          <Bracket lift={lift} />
        </Section>
      )}

      <Section title="Realization vs adaptation">
        {lift.realization ? (
          <Realization r={lift.realization} />
        ) : (
          <p className={cn('text-[12.5px] leading-relaxed', ink2)}>
            Needs RPE on at least half the sets in both of the last two 6-week windows, and two sessions in each. Keep logging RPE on this lift.
          </p>
        )}
        {lift.loadUpEvents.length > 0 && (
          <div className="mt-3 space-y-1">
            {lift.loadUpEvents.slice(-3).map((e) => (
              <StatusTag key={e.day} tone="warning" className="!whitespace-normal">
                {formatDay(e.day, today)}: {e.fromLoad}→{e.toLoad} kg, RPE {e.fromRpe}→{e.toRpe} without a real gain
              </StatusTag>
            ))}
          </div>
        )}
      </Section>

      <Section title="Fatigue & effort">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className={cn('text-[11px] font-medium', muted)}>Rep drop-off</p>
            <p className={cn('text-[17px] font-semibold mt-0.5', ink)}>{lift.dropOff ? `−${fmt.num(lift.dropOff.pct)}%` : '—'}</p>
            <p className={cn('text-[11.5px] mt-0.5', ink2)}>
              {lift.dropOff ? `set 1 → ${lift.dropOff.sets} at the same load` : 'needs repeated loads'}
            </p>
          </div>
          <div>
            <p className={cn('text-[11px] font-medium', muted)}>RIR accuracy</p>
            <p className={cn('text-[17px] font-semibold mt-0.5', ink)}>
              {lift.calibration ? fmt.pct(1 - (lift.calibration.understated + lift.calibration.overstated) / lift.calibration.pairs) : '—'}
            </p>
            <p className={cn('text-[11.5px] mt-0.5', ink2)}>{lift.calibration ? `${lift.calibration.pairs} rated set pairs` : 'needs rated sets'}</p>
          </div>
        </div>
      </Section>

      <Section title="Lifespan">
        <p className={cn('text-[13px] leading-relaxed', ink2)}>
          In rotation since {formatMonth(lift.firstDay)} · {lift.sessionCount} sessions
          {lift.changeSinceStartPct !== null && (
            <>
              {' · '}
              <Delta value={lift.changeSinceStartPct} digits={0} /> since starting
            </>
          )}
          .
          {lift.momentumCreep && ' Load is rising alongside more partials/momentum notes, so check that the progress is clean.'}
        </p>
        <Notes title="Pain & injury notes" notes={lift.painNotes} today={today} />
        <Notes title="Execution notes" notes={lift.execNotes} today={today} />
      </Section>
    </div>
  );
}

function setsText(sets: LiftSummary['lastSession']): string {
  return sets.map((s) => `${s.load !== null ? fmt.num(s.load, 1) : 'BW'}×${s.reps}${s.rpe !== null && s.source !== 'failure' ? ` @${s.rpe}` : ''}`).join(', ');
}

function Bracket({ lift }: { lift: LiftSummary }) {
  const { low, high } = lift.bracket!;
  const sets = lift.lastSession;
  const top = Math.max(...sets.map((s) => s.load ?? 0));
  const lo = Math.max(0, low - 3);
  const hi = high + 3;
  const pos = (r: number) => `${((Math.min(Math.max(r, lo), hi) - lo) / (hi - lo)) * 100}%`;
  return (
    <div>
      <p className={cn('text-[13px] leading-relaxed mb-3', ink2)}>
        Your usual range is <span className={cn('font-semibold', ink)}>{low}–{high} reps</span>.{' '}
        {lift.readyForLoad
          ? 'Every top-load set last time reached the top of it, so add load next session.'
          : `Add load once every set at ${fmt.num(top, 1)} kg reaches ${high}.`}
      </p>
      <div className="relative h-8">
        <div className="absolute inset-x-0 top-[13px] h-1.5 rounded-full bg-[var(--viz-grid)]" />
        <div className="absolute top-[13px] h-1.5 rounded-full" style={{ left: pos(low), width: `calc(${pos(high)} - ${pos(low)})`, background: 'var(--viz-seq-2)' }} />
        {sets.map((s, i) => {
          // Sets with the same rep count sit side by side instead of on top of each other.
          const same = sets.slice(0, i).filter((q) => q.reps === s.reps).length;
          return (
            <span
              key={i}
              className="absolute top-[9px] w-3.5 h-3.5 rounded-full"
              style={{
                left: pos(s.reps),
                transform: `translateX(calc(-50% + ${same * 9}px))`,
                background: s.load === top ? 'var(--viz-ink)' : 'var(--viz-surface)',
                boxShadow: s.load === top ? '0 0 0 2px var(--viz-surface)' : 'inset 0 0 0 2px var(--viz-ink-2)',
              }}
              title={`Set ${i + 1}: ${s.reps} reps`}
            />
          );
        })}
      </div>
      <div className={cn('flex justify-between text-[10.5px] tabular-nums', muted)}>
        <span>{lo} reps</span>
        <span>{hi} reps</span>
      </div>
      <p className={cn('text-[11.5px] mt-1', muted)}>Last session: {setsText(sets)}</p>
    </div>
  );
}

function Realization({ r }: { r: NonNullable<LiftSummary['realization']> }) {
  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <p className={cn('text-[11px] font-medium', muted)}>Performance</p>
          <Delta value={r.performancePct} className="text-[16px]" />
          <p className={cn('text-[11px] mt-0.5', ink2)}>load × reps</p>
        </div>
        <div>
          <p className={cn('text-[11px] font-medium', muted)}>Adaptation</p>
          <Delta value={r.adaptationPct} className="text-[16px]" />
          <p className={cn('text-[11px] mt-0.5', ink2)}>at equal RIR</p>
        </div>
        <div>
          <p className={cn('text-[11px] font-medium', muted)}>Effort</p>
          <span className={cn('text-[16px] font-medium tabular-nums', ink)}>{fmt.signed(r.realizationPct)}</span>
          <p className={cn('text-[11px] mt-0.5', ink2)}>
            RIR {r.rirBefore.toFixed(1)} → {r.rirAfter.toFixed(1)}
          </p>
        </div>
      </div>
      <p className={cn('text-[12.5px] leading-relaxed mt-2.5', ink2)}>
        {Math.abs(r.realizationPct) < 0.5
          ? 'Last 6 weeks vs the 6 before: effort held steady, so the change is real adaptation.'
          : r.realizationPct > 0
            ? 'Part of the gain came from pushing closer to failure (expressing strength), not new muscle.'
            : 'You trained further from failure, so true strength rose more than the raw numbers show.'}
      </p>
    </div>
  );
}

function Notes({ title, notes, today }: { title: string; notes: LiftNote[]; today: number }) {
  if (notes.length === 0) return null;
  const recent = [...notes].sort((a, b) => b.day - a.day).slice(0, 4);
  return (
    <div className="mt-3">
      <p className={cn('text-[11.5px] font-medium mb-1.5', muted)}>
        {title} · {notes.length}
      </p>
      <ul className="space-y-1.5">
        {recent.map((n, i) => (
          <li key={i} className={cn('rounded-lg px-2.5 py-2 text-[12.5px] leading-snug', subtleBg, ink2)}>
            <span className={cn('text-[11px] tabular-nums mr-1.5', muted)}>{formatDay(n.day, today)}</span>
            {n.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
