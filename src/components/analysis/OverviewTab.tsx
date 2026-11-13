import type { Analytics, AnalysisTab, SignalLevel } from '../../lib/analytics';
import { formatDay, weekStartDay } from '../../lib/analytics/core';
import { cn } from '../../lib/utils';
import { TimeChart, type TimeBand } from './charts/TimeChart';
import { Legend } from './charts/Figures';
import { Card, ChartHint, Delta, Note, Stat, StatusTag, type Tone } from './ui';
import { fmt, ink, ink2, muted, divider } from './styles';
import { PHASE_COLOR, PHASE_LABEL, PHASE_WASH, monthTick, weekLabel } from './shared';

const LEVEL_TONE: Record<SignalLevel, Tone> = { clear: 'good', watch: 'warning', flag: 'critical' };
const LEVEL_LABEL: Record<SignalLevel, string> = { clear: 'Clear', watch: 'Watch', flag: 'Flag' };

export function OverviewTab({ a, onNavigate }: { a: Analytics; onNavigate: (tab: AnalysisTab) => void }) {
  return (
    <div className="space-y-3">
      <SignalsCard a={a} onNavigate={onNavigate} />
      <PhaseCard a={a} />
      <PhaseVelocityCard a={a} />
      <ConsistencyCard a={a} />
    </div>
  );
}

function SignalsCard({ a, onNavigate }: { a: Analytics; onNavigate: (tab: AnalysisTab) => void }) {
  const flagged = a.signals.filter((s) => s.level !== 'clear').length;
  return (
    <Card
      eyebrow="Five lenses"
      title={flagged === 0 ? 'No red flags right now' : `${flagged} thing${flagged === 1 ? '' : 's'} to look at`}
      info={
        <>
          <p>Each coach's red-flag trigger, checked against your recent logs:</p>
          <p>
            <b>Helms</b>: load up while RIR drops. <b>Israetel</b>: performance falling as sets rise. <b>Henselmans</b>: more than ~10 sets
            for one muscle in a session. <b>Nuñez</b>: form breaking down (partials, momentum, cut ROM in your remarks). <b>Alberts</b>: spinal
            loading and joint complaints creeping up.
          </p>
        </>
      }
    >
      <ul className={cn('-mx-1 divide-y', divider)}>
        {a.signals.map((s) => (
          <li key={s.lens}>
            <button
              type="button"
              onClick={() => onNavigate(s.target)}
              className="w-full text-left px-1 py-2.5 flex items-start gap-3 active:opacity-70 transition-opacity"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('text-[13px] font-semibold', ink)}>{s.lens}</span>
                  <span className={cn('text-[12px] truncate', muted)}>{s.check}</span>
                </div>
                <p className={cn('text-[12.5px] leading-snug mt-0.5', ink2)}>{s.summary}</p>
              </div>
              <StatusTag tone={LEVEL_TONE[s.level]} className="mt-0.5">
                {LEVEL_LABEL[s.level]}
              </StatusTag>
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PhaseCard({ a }: { a: Analytics }) {
  const { bodyweight: bw, dataset } = a;
  const today = dataset.today;
  const cur = bw.current;
  const weeks = bw.weeks.filter((w) => w.week > dataset.currentWeek - 52);
  const firstWithKg = weeks.findIndex((w) => w.kg !== null);
  const shown = firstWithKg >= 0 ? weeks.slice(firstWithKg) : [];

  if (!cur || shown.length < 2) {
    return (
      <Card eyebrow="Nuñez · Seasonal context" title="Bodyweight & phase">
        <Note>Log bodyweight with your workouts to see gaining, maintenance and cutting phases here.</Note>
      </Card>
    );
  }

  const bands: TimeBand[] = bw.segments
    .filter((s) => s.endWeek >= shown[0].week)
    .map((s) => ({
      from: weekStartDay(Math.max(s.startWeek, shown[0].week)) - 3.5,
      to: weekStartDay(s.endWeek) + 3.5,
      fill: PHASE_WASH[s.phase],
      label: s.phase === 'maintenance' ? undefined : PHASE_LABEL[s.phase],
    }));
  const kgPerWeek = cur.ratePct !== null ? (cur.ratePct / 100) * cur.kg : null;

  return (
    <Card
      eyebrow="Nuñez · Seasonal context"
      title="Bodyweight & phase"
      info={
        <>
          <p>
            Phase is inferred from the bodyweight logged with your workouts: an 8-week trend, smoothed so a single heavy or light weigh-in
            can't flip it. Faster than ±0.1% of bodyweight per week counts as gaining or cutting.
          </p>
          <p>Strength numbers only mean something in this context: holding a lift through a cut is a win; stalling in a surplus is a programming problem.</p>
          {bw.rejected.length > 0 && (
            <p>
              Ignored {bw.rejected.length === 1 ? 'one reading' : `${bw.rejected.length} readings`} that look like typos:{' '}
              {bw.rejected.map((p) => `${p.kg} kg (${formatDay(p.day, today)})`).join(', ')}.
            </p>
          )}
          <p>Once food logging is connected, real intake will replace this estimate.</p>
        </>
      }
    >
      <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-3 mb-3">
        <Stat
          label="Phase"
          value={
            <span className="inline-flex items-center gap-1.5">
              {cur.phase && <span className="w-2.5 h-2.5 rounded-full" style={{ background: PHASE_COLOR[cur.phase] }} />}
              <span className="text-[16px]">{cur.phase ? PHASE_LABEL[cur.phase] : '—'}</span>
            </span>
          }
          sub={
            cur.stale
              ? `Last weigh-in ${formatDay(cur.day, today)}`
              : cur.phase === 'maintenance' && cur.ratePct !== null && Math.abs(cur.ratePct) >= 0.1
                ? cur.ratePct > 0
                  ? 'edging up lately'
                  : 'edging down lately'
                : '8-week trend'
          }
        />
        <Stat label="Bodyweight" value={fmt.kg(cur.kg)} sub="7-day average" />
        <Stat
          label="Rate"
          value={<span className="text-[17px]">{fmt.signed(cur.ratePct, 2, '%')}</span>}
          sub={kgPerWeek !== null ? `${fmt.signed(kgPerWeek, 2, ' kg')} / week` : undefined}
        />
      </div>
      <TimeChart
        xs={shown.map((w) => weekStartDay(w.week))}
        series={[{ key: 'kg', label: 'Bodyweight', kind: 'line', color: 'var(--viz-ink-2)', values: shown.map((w) => w.kg) }]}
        bands={bands}
        height={96}
        formatY={(v) => fmt.num(v, 0)}
        xTickLabel={monthTick}
        ariaLabel="Weekly average bodyweight over the last year, shaded by inferred phase"
        idle={<ChartHint>Weekly average, last 52 weeks · drag across to inspect</ChartHint>}
        table={{
          columns: ['Week', 'Bodyweight (kg)', 'Trend (%/week)', 'Phase'],
          row: (i) => [
            weekLabel(shown[i].week, today),
            shown[i].kg !== null ? (shown[i].kg as number).toFixed(1) : '',
            shown[i].ratePct !== null ? (shown[i].ratePct as number).toFixed(2) : '',
            shown[i].phase ? PHASE_LABEL[shown[i].phase!] : '',
          ],
        }}
        readout={(i) => {
          const w = shown[i];
          return (
            <div className="text-[12px] tabular-nums">
              <span className={cn('font-semibold text-[15px] mr-1.5', ink)}>{w.kg !== null ? fmt.kg(w.kg) : 'No weigh-in'}</span>
              <span className={ink2}>{weekLabel(w.week, today)}</span>
              <div className={muted}>
                {w.phase ? PHASE_LABEL[w.phase] : '—'}
                {w.ratePct !== null && ` · trend ${fmt.signed(w.ratePct, 2)}/wk`}
              </div>
            </div>
          );
        }}
      />
      <div className="mt-2">
        <Legend
          items={[
            { label: 'Gaining', color: 'color-mix(in srgb, var(--viz-surplus) 35%, transparent)' },
            { label: 'Maintenance', color: 'var(--viz-grid)' },
            { label: 'Cutting', color: 'color-mix(in srgb, var(--viz-deficit) 35%, transparent)' },
          ]}
        />
      </div>
    </Card>
  );
}

function PhaseVelocityCard({ a }: { a: Analytics }) {
  const rows = a.progress.phaseVelocity;
  const surplus = rows.find((r) => r.phase === 'surplus')?.pctPerMonth ?? null;
  const deficit = rows.find((r) => r.phase === 'deficit')?.pctPerMonth ?? null;
  const maintenance = rows.find((r) => r.phase === 'maintenance')?.pctPerMonth ?? null;
  let takeaway: string | null = null;
  if (deficit !== null && deficit > -0.5) takeaway = 'You hold strength through cuts: muscle is being kept.';
  else if (deficit !== null && deficit < -2) takeaway = 'Strength drops quickly in a deficit. A slower cut or keeping intensity high usually protects it.';
  if (surplus !== null && maintenance !== null && surplus < maintenance) takeaway = 'Surplus blocks aren\'t out-progressing maintenance, which points to programming rather than food as the limiter.';

  return (
    <Card
      eyebrow="Nuñez · Surplus vs deficit velocity"
      title="Strength velocity by phase"
      info={
        <>
          <p>
            Average monthly change in e10RM (your RIR-normalized strength, see Lifts) across every lift, split by the phase each session fell
            in. Session pairs more than 3 weeks apart are skipped, so rotating exercises doesn't skew it.
          </p>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-3">
        {rows.map((r) => (
          <div key={r.phase} className="min-w-0">
            <p className={cn('text-[11px] font-medium inline-flex items-center gap-1.5', muted)}>
              <span className="w-2 h-2 rounded-full" style={{ background: PHASE_COLOR[r.phase] }} />
              {PHASE_LABEL[r.phase]}
            </p>
            <p className="mt-0.5 text-[19px] font-semibold leading-tight">
              {r.pctPerMonth === null ? <span className={muted}>—</span> : <Delta value={r.pctPerMonth} className="text-[17px]" />}
            </p>
            <p className={cn('text-[11.5px] mt-0.5', ink2)}>{r.pctPerMonth === null ? 'Not enough data' : `per month · ${r.weeks} wk`}</p>
          </div>
        ))}
      </div>
      {takeaway && <Note>{takeaway}</Note>}
    </Card>
  );
}

function ConsistencyCard({ a }: { a: Analytics }) {
  const c = a.consistency;
  const today = a.dataset.today;
  const weeks = a.volume.weekTotals.slice(-52);
  const threshold = Math.max(1, c.typicalWeek - 1);
  return (
    <Card
      eyebrow="Helms · Pyramid base"
      title="Consistency"
      info={
        <>
          <p>
            Adherence sits at the base of the pyramid: nothing above it matters if weeks go missing. With no plan stored, your plan is taken as
            your typical week (median of the last 26 weeks: {c.typicalWeek} sessions). A week counts as on plan at {threshold}+ sessions.
          </p>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-3 mb-3">
        <Stat
          label="Per week"
          value={c.recentAvg !== null ? fmt.num(c.recentAvg, 1) : '—'}
          sub={
            c.priorAvg !== null && c.recentAvg !== null ? (
              <span>
                last 8 wk · <Delta value={c.recentAvg - c.priorAvg} digits={1} unit="" />
              </span>
            ) : (
              'last 8 weeks'
            )
          }
        />
        <Stat
          label="On-plan weeks"
          value={c.onPlanPct !== null ? `${Math.round(c.onPlanPct)}%` : '—'}
          sub={`${c.onPlanWeeks} of ${c.weeksCounted} · ${c.streakWeeks} in a row`}
        />
        <Stat
          label="Longest break"
          value={`${c.longestBreakDays} d`}
          sub={c.zeroWeeks === 0 ? 'no missed weeks' : `${c.zeroWeeks} empty week${c.zeroWeeks === 1 ? '' : 's'}`}
        />
      </div>
      <TimeChart
        xs={weeks.map((w) => weekStartDay(w.week))}
        series={[
          {
            key: 'sessions',
            label: 'Sessions',
            kind: 'column',
            color: 'var(--viz-1)',
            values: weeks.map((w) => w.sessions),
            colors: weeks.map((w) => (w.partial ? 'var(--viz-deemph)' : w.sessions < threshold ? 'var(--viz-seq-2)' : undefined)),
          },
        ]}
        refLine={{ y: c.typicalWeek, label: `typical ${c.typicalWeek}` }}
        height={80}
        yTickCount={2}
        formatY={(v) => fmt.num(v)}
        xTickLabel={monthTick}
        ariaLabel="Training sessions per week over the last year"
        idle={<ChartHint>Sessions per week · line = your typical {c.typicalWeek} · drag across to inspect</ChartHint>}
        table={{
          columns: ['Week', 'Sessions', 'Hard sets'],
          row: (i) => [weekLabel(weeks[i].week, today), String(weeks[i].sessions), String(weeks[i].hardSets)],
        }}
        readout={(i) => {
          const w = weeks[i];
          return (
            <div className="text-[12px] tabular-nums">
              <span className={cn('font-semibold text-[15px] mr-1.5', ink)}>
                {w.sessions} session{w.sessions === 1 ? '' : 's'}
              </span>
              <span className={ink2}>{weekLabel(w.week, today)}</span>
              <div className={muted}>
                {w.hardSets} hard sets · {w.partial ? 'this week so far' : w.sessions < threshold ? 'below plan' : 'on plan'} · line = typical {c.typicalWeek}
              </div>
            </div>
          );
        }}
      />
    </Card>
  );
}
