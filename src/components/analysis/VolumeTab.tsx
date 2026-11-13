import { useMemo, useState } from 'react';
import type { Analytics } from '../../lib/analytics';
import { formatDay, weekStartDay } from '../../lib/analytics/core';
import { ZONE_LABEL, type VolumeZone } from '../../lib/analytics/landmarks';
import { SESSION_CAUTION, SESSION_CEILING } from '../../lib/analytics/volume';
import { cn } from '../../lib/utils';
import { TimeChart } from './charts/TimeChart';
import { LandmarkBar, Legend } from './charts/Figures';
import { DotStrip, Heatmap, Scatter } from './charts/Grid';
import { Card, ChartHint, Empty, MuscleChips, MuscleDot, Note, Segmented, StatusTag, type Tone } from './ui';
import { fmt, hairline, ink, ink2, muted } from './styles';
import { PHASE_COLOR, PHASE_LABEL, monthTick, weekLabel } from './shared';

export function VolumeTab({ a }: { a: Analytics }) {
  return (
    <div className="space-y-3">
      <LandmarksCard a={a} />
      <SawtoothCard a={a} />
      <SpecializationCard a={a} />
      <CeilingCard a={a} />
      <DoseResponseCard a={a} />
    </div>
  );
}

const ZONE_TONE: Record<VolumeZone, Tone | null> = {
  none: null,
  'below-mev': null,
  maintenance: null,
  productive: 'good',
  high: 'warning',
  'over-mrv': 'critical',
};

function LandmarksCard({ a }: { a: Analytics }) {
  const [view, setView] = useState<'7d' | '4w'>('7d');
  const rows = a.volume.rows.filter((r) => r.landmarks);
  const max = Math.max(24, ...rows.map((r) => Math.max(r.landmarks!.mrv + 2, r.last7.direct + 1, r.avg4w.direct + 1)));
  const anyPersonal = rows.some((r) => a.progress.personal.has(r.muscle));
  const belowCount = rows.filter((r) => (view === '7d' ? r.zone7 : r.zone4w) === 'below-mev').length;
  const nearFailure = a.volume.nearFailureShare;

  return (
    <Card
      eyebrow="Israetel · Volume landmarks"
      title="Weekly sets vs MEV → MRV"
      info={
        <>
          <p>
            Direct hard sets per muscle (sets at RPE 6+ or unrated) against Renaissance Periodization's population landmarks: <b>MEV</b> is the
            least that grows muscle, <b>MAV</b> the most productive range, <b>MRV</b> the most you can recover from.
          </p>
          <p>The filled dot is the selected window; the ring is the other one. Synergist sets (e.g. biceps on rows) are listed as “+ indirect”.</p>
          {anyPersonal && <p>The blue line under a bar is the weekly-set range of your own best 4-week blocks (see Dose–response).</p>}
        </>
      }
    >
      <div className="mb-3">
        <Segmented
          size="sm"
          layoutId="landmark-view"
          value={view}
          onChange={setView}
          options={[
            { value: '7d', label: 'Last 7 days' },
            { value: '4w', label: '4-week average' },
          ]}
        />
      </div>
      <div className="mb-3">
        <Legend
          items={[
            { label: 'Below MEV', color: 'var(--viz-grid)' },
            { label: 'MEV–MRV', color: 'var(--viz-seq-1)' },
            { label: 'MAV', color: 'var(--viz-seq-3)' },
            { label: 'Past MRV', color: 'color-mix(in srgb, var(--viz-critical) 30%, transparent)' },
            ...(anyPersonal ? [{ label: 'Your best blocks', color: 'var(--viz-1)', shape: 'line' as const }] : []),
          ]}
        />
      </div>
      {rows.length === 0 ? (
        <Empty>Tag exercises with a muscle group to see weekly volume.</Empty>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const v = view === '7d' ? r.last7 : r.avg4w;
            const other = view === '7d' ? r.avg4w.direct : r.last7.direct;
            const zone = view === '7d' ? r.zone7 : r.zone4w;
            const tone = ZONE_TONE[zone];
            const personal = a.progress.personal.get(r.muscle);
            return (
              <li key={r.muscle}>
                <div className="flex items-baseline gap-2 mb-1">
                  <MuscleDot muscle={r.muscle} className="self-center" />
                  <span className={cn('text-[13px] font-medium', ink)}>{r.muscle}</span>
                  <span className={cn('text-[13px] font-semibold tabular-nums ml-auto', ink)}>
                    {fmt.num(v.direct, view === '7d' ? 0 : 1)}
                  </span>
                  <span className={cn('text-[11.5px] tabular-nums', muted)}>
                    {v.indirect > 0 ? `+ ${fmt.num(v.indirect, 1)} indirect` : 'sets'}
                  </span>
                  <span className="w-[86px] text-right shrink-0">
                    {tone ? <StatusTag tone={tone}>{ZONE_LABEL[zone]}</StatusTag> : <span className={cn('text-[12px]', muted)}>{ZONE_LABEL[zone]}</span>}
                  </span>
                </div>
                <LandmarkBar
                  value={v.direct}
                  average={other}
                  landmarks={r.landmarks!}
                  max={max}
                  personal={personal ? personal.sweetSpot : null}
                />
              </li>
            );
          })}
        </ul>
      )}
      {belowCount >= Math.ceil(rows.length / 2) && nearFailure !== null && nearFailure > 0.7 && (
        <Note>
          Most muscles sit under the textbook MEV, but {fmt.pct(nearFailure)} of your rated sets are at RPE 9+. RP's ranges assume sets that start
          around 3 RIR, and sets this close to failure usually need fewer of them, so trust your Dose–response results over these defaults.
        </Note>
      )}
    </Card>
  );
}

function SawtoothCard({ a }: { a: Analytics }) {
  const today = a.dataset.today;
  const weeks = a.volume.weekTotals.slice(-26);
  const meso = a.volume.mesocycles;
  const avgLen = meso.length ? meso.reduce((s, m) => s + m.weeks, 0) / meso.length : null;
  const hasRpe = weeks.some((w) => w.avgRpe !== null);
  const xs = weeks.map((w) => weekStartDay(w.week));
  const nf = a.volume.nearFailureShare;
  const rated = weeks.map((w) => w.avgRpe).filter((v): v is number => v !== null);
  const rpeFloor = rated.length ? Math.max(5, Math.min(8, Math.floor(Math.min(...rated)))) : 6;

  return (
    <Card
      eyebrow="Israetel · Mesocycle sawtooth"
      title="Weekly volume & effort"
      info={
        <>
          <p>
            A productive mesocycle ramps sets up while RIR falls (RPE rises), then deloads. A week under 60% of your recent normal volume is
            marked as a deload or break.
          </p>
          <p>The classic mistake this catches: training at ~0 RIR from the first week, which piles up fatigue before volume can climb.</p>
        </>
      }
    >
      <div className="grid grid-cols-3 gap-3 mb-3">
        <MiniStat label="Current block" value={a.volume.currentBlockWeeks !== null ? `wk ${a.volume.currentBlockWeeks}` : '—'} />
        <MiniStat label="Typical block" value={avgLen !== null ? `${fmt.num(avgLen, 0)} wk` : '—'} />
        <MiniStat
          label="Last deload"
          value={a.volume.lastDeloadWeek !== null ? formatDay(weekStartDay(a.volume.lastDeloadWeek), today) : 'None'}
        />
      </div>
      <TimeChart
        xs={xs}
        series={[
          {
            key: 'sets',
            label: 'Hard sets',
            kind: 'column',
            color: 'var(--viz-1)',
            values: weeks.map((w) => w.hardSets),
            colors: weeks.map((w) => (w.partial ? 'var(--viz-deemph)' : w.deload ? 'var(--viz-seq-1)' : undefined)),
          },
        ]}
        height={84}
        yTickCount={3}
        formatY={(v) => fmt.num(v)}
        xTickLabel={monthTick}
        ariaLabel="Hard sets per week, last 26 weeks"
        idle={<ChartHint>Hard sets per week, last 26 weeks · lighter = deload</ChartHint>}
        table={{
          columns: ['Week', 'Hard sets', 'Average RPE', 'Deload'],
          row: (i) => [weekLabel(weeks[i].week, today), String(weeks[i].hardSets), weeks[i].avgRpe?.toFixed(1) ?? '', weeks[i].deload ? 'yes' : ''],
        }}
        readout={(i) => {
          const w = weeks[i];
          return (
            <div className="text-[12px] tabular-nums">
              <span className={cn('font-semibold text-[15px] mr-1.5', ink)}>{w.hardSets} sets</span>
              <span className={ink2}>{weekLabel(w.week, today)}</span>
              <div className={muted}>
                {w.avgRpe !== null ? `avg RPE ${w.avgRpe.toFixed(1)}` : 'no RPE logged'}
                {w.deload ? ' · deload / break' : w.partial ? ' · this week so far' : ''}
              </div>
            </div>
          );
        }}
      />
      {hasRpe && (
        <div className={cn('mt-3 pt-3 border-t', hairline)}>
          <p className={cn('text-[11px] font-medium mb-1', muted)}>Average RPE per week</p>
          <TimeChart
            xs={xs}
            series={[{ key: 'rpe', label: 'Avg RPE', kind: 'line', color: 'var(--viz-2)', values: weeks.map((w) => w.avgRpe), dots: true }]}
            yDomain={[rpeFloor, 10]}
            height={56}
            yTickCount={2}
            formatY={(v) => fmt.num(v)}
            xTickLabel={monthTick}
            ariaLabel="Average RPE per week, last 26 weeks"
            table={{ columns: ['Week', 'Average RPE'], row: (i) => [weekLabel(weeks[i].week, today), weeks[i].avgRpe?.toFixed(1) ?? ''] }}
            readout={(i) => (
              <div className="text-[12px] tabular-nums">
                <span className={cn('font-semibold mr-1.5', ink)}>{weeks[i].avgRpe !== null ? `RPE ${weeks[i].avgRpe!.toFixed(1)}` : 'No RPE'}</span>
                <span className={muted}>
                  {weeks[i].ratedSets} rated set{weeks[i].ratedSets === 1 ? '' : 's'}
                </span>
              </div>
            )}
          />
        </div>
      )}
      {nf !== null && nf > 0.8 && (
        <Note>
          {fmt.pct(nf)} of your rated sets are at RPE 9 or higher, every week. Effort doesn't ramp across a block, so the deload is doing all
          the fatigue management. If a lift stalls, starting a block at RPE 7–8 is the lever to try.
        </Note>
      )}
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className={cn('text-[11px] font-medium', muted)}>{label}</p>
      <p className={cn('text-[15px] font-semibold mt-0.5 truncate', ink)}>{value}</p>
    </div>
  );
}

const BIN_EDGES = [1, 4, 7, 10, 15]; // sets/week: 0 | 1–3 | 4–6 | 7–9 | 10–14 | 15+
const BIN_LABELS = ['0', '1–3', '4–6', '7–9', '10–14', '15+'];
const BIN_COLORS = ['var(--viz-grid)', 'var(--viz-seq-1)', 'var(--viz-seq-2)', 'var(--viz-seq-3)', 'var(--viz-seq-4)', 'var(--viz-seq-5)'];

function SpecializationCard({ a }: { a: Analytics }) {
  const today = a.dataset.today;
  const current = a.dataset.currentWeek;
  const first = a.dataset.workouts.length ? a.dataset.workouts[0].week : current;
  const weeks = useMemo(() => {
    const out: number[] = [];
    for (let w = Math.max(first, current - 51); w <= current; w++) out.push(w);
    return out;
  }, [first, current]);
  const rows = a.volume.muscles;
  const value = (m: string, w: number) => a.volume.weeklyByMuscle.get(w)?.get(m)?.direct ?? 0;
  const bin = (v: number) => {
    let i = 0;
    while (i < BIN_EDGES.length && v >= BIN_EDGES[i]) i++;
    return i;
  };

  return (
    <Card
      eyebrow="Israetel & Nuñez · Specialization map"
      title="Where your volume went"
      info={
        <>
          <p>
            Direct sets per muscle per week over the last year. Darker runs are a muscle's high-volume push phases; lighter runs are maintenance.
            Productive specialization keeps 2–3 muscles in a push while the rest hold at maintenance.
          </p>
          <p>The thin strip on top is the inferred nutrition phase. Tap any cell for the numbers.</p>
        </>
      }
    >
      {rows.length === 0 ? (
        <Empty>No tagged volume yet.</Empty>
      ) : (
        <>
          <Heatmap
            rows={rows}
            weeks={weeks}
            value={value}
            bin={bin}
            binColors={BIN_COLORS}
            ribbon={(w) => {
              const p = a.bodyweight.phaseByWeek.get(w);
              return p && p !== 'maintenance' ? PHASE_COLOR[p] : p ? 'var(--viz-grid)' : null;
            }}
            idle={<span className={muted}>Last 52 weeks · tap a cell</span>}
            readout={(m, w) => {
              const p = a.bodyweight.phaseByWeek.get(w);
              return (
                <>
                  <span className={cn('font-semibold', ink)}>
                    {m} · {fmt.num(value(m, w))} sets
                  </span>{' '}
                  · {weekLabel(w, today)}
                  {p ? ` · ${PHASE_LABEL[p]}` : ''}
                </>
              );
            }}
            ariaLabel="Direct sets per muscle per week for the last 52 weeks"
          />
          <div className="mt-2.5 flex items-center gap-1.5 text-[10.5px]">
            <span className={muted}>sets/wk</span>
            {BIN_LABELS.map((l, i) => (
              <span key={l} className="inline-flex items-center gap-1">
                <span className="w-3 h-2.5 rounded-[2px]" style={{ background: BIN_COLORS[i] }} />
                <span className={ink2}>{l}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

function CeilingCard({ a }: { a: Analytics }) {
  const rows = a.volume.ceiling;
  const max = Math.max(12, Math.ceil(Math.max(0, ...rows.map((r) => r.max)) + 1));
  const over = rows.reduce((s, r) => s + r.over, 0);
  return (
    <Card
      eyebrow="Henselmans · Session ceiling"
      title="Fractional sets per session"
      info={
        <>
          <p>
            Each dot is one session in the last 8 weeks. Sets count fully for the target muscle and 0.5 for real synergists: a row is 1 set
            of back plus 0.5 for biceps and rear delts; a press is 0.5 for triceps and front delts.
          </p>
          <p>
            Past roughly {SESSION_CAUTION}–{SESSION_CEILING} fractional sets for one muscle in one session, extra sets add fatigue faster than
            growth. Moving them to another day (more frequency) is the fix.
          </p>
        </>
      }
    >
      {rows.length === 0 ? (
        <Empty>No sessions in the last 8 weeks.</Empty>
      ) : (
        <>
          <DotStrip
            rows={rows.map((r) => ({
              label: r.muscle,
              values: r.sessions.map((s) => s.fractional),
              note: `avg ${fmt.num(r.avg, 1)} · max ${fmt.num(r.max, 1)}`,
            }))}
            max={max}
            caution={SESSION_CAUTION}
            ceiling={SESSION_CEILING}
            ariaLabel="Fractional sets per muscle per session over the last 8 weeks"
          />
          <div className="mt-2">
            <Legend
              items={[
                { label: `${SESSION_CAUTION}–${SESSION_CEILING} caution`, color: 'color-mix(in srgb, var(--viz-warning) 40%, transparent)' },
                { label: `>${SESSION_CEILING} junk-volume zone`, color: 'color-mix(in srgb, var(--viz-critical) 35%, transparent)' },
              ]}
            />
          </div>
          <Note>
            {over === 0
              ? 'No muscle crossed the ceiling in a single session in the last 8 weeks.'
              : `${over} session${over === 1 ? '' : 's'} crossed ~${SESSION_CEILING} sets for one muscle in the last 8 weeks.`}
          </Note>
        </>
      )}
    </Card>
  );
}

function DoseResponseCard({ a }: { a: Analytics }) {
  const muscles = a.volume.muscles.filter((m) => (a.progress.dose.get(m)?.length ?? 0) > 0);
  const [muscle, setMuscle] = useState<string>(() => muscles.find((m) => a.progress.personal.has(m)) ?? muscles[0] ?? '');
  const points = a.progress.dose.get(muscle) ?? [];
  const personal = a.progress.personal.get(muscle) ?? null;
  const today = a.dataset.today;
  const eff = a.progress.efficiency.find((e) => e.muscle === muscle);
  const inSweet = personal ? points.filter((p) => p.setsPerWeek >= personal.sweetSpot[0] && p.setsPerWeek < personal.sweetSpot[1]) : [];
  const sweetSurplus = inSweet.length ? inSweet.filter((p) => p.phase === 'surplus').length / inSweet.length : 0;

  return (
    <Card
      eyebrow="Israetel · Dose–response"
      title="Your personal volume landmarks"
      info={
        <>
          <p>
            Each dot is a 4-week block: average direct sets per week (x) against the change in e10RM for that muscle's lifts versus the block
            before (y). Where the dots sit highest is your most productive volume; where they fall off is where you outran recovery.
          </p>
          <p>
            Personal ranges appear once a muscle has 8+ blocks spread over 6+ sets/week. Early-career blocks progress faster at any volume, and
            phase matters too (colors), so read this as a guide.
          </p>
        </>
      }
    >
      {muscles.length === 0 ? (
        <Empty>Needs at least two 4-week blocks of tagged lifts.</Empty>
      ) : (
        <>
          <div className="mb-3">
            <MuscleChips muscles={muscles} value={muscle} onChange={setMuscle} />
          </div>
          <Scatter
            points={points.map((p) => ({
              x: p.setsPerWeek,
              y: p.changePct,
              color: p.phase ? PHASE_COLOR[p.phase] : 'var(--viz-ink-muted)',
              key: String(p.endWeek),
            }))}
            band={personal ? personal.sweetSpot : null}
            xLabel="direct sets per week"
            formatY={(v) => `${v > 0 ? '+' : ''}${fmt.num(v)}%`}
            idle={<span className={muted}>{points.length} blocks · tap a dot</span>}
            readout={(p) => {
              const end = Number(p.key);
              const d = points.find((q) => q.endWeek === end);
              return (
                <>
                  <span className={cn('font-semibold', ink)}>
                    {fmt.signed(p.y)} at {fmt.num(p.x, 1)} sets/wk
                  </span>{' '}
                  · block to {formatDay(weekStartDay(end) + 6, today)}
                  {d?.phase ? ` · ${PHASE_LABEL[d.phase]}` : ''}
                </>
              );
            }}
            ariaLabel={`${muscle}: strength change per 4-week block against weekly sets`}
          />
          <div className="mt-2">
            <Legend
              shape="dot"
              items={[
                { label: 'Gaining', color: PHASE_COLOR.surplus },
                { label: 'Maintenance', color: PHASE_COLOR.maintenance },
                { label: 'Cutting', color: PHASE_COLOR.deficit },
              ]}
            />
          </div>
          <div className={cn('mt-3 pt-3 border-t text-[12.5px] leading-relaxed', hairline, ink2)}>
            {personal ? (
              <p>
                <span className={cn('font-semibold', ink)}>
                  Best blocks: {personal.sweetSpot[0]}–{personal.sweetSpot[1]} sets/week
                </span>{' '}
                ({fmt.signed(personal.sweetSpotGain)} per block on average, {personal.blocks} blocks).
                {personal.mevEstimate !== null && ` Below ~${personal.mevEstimate} sets, blocks mostly stalled.`}
                {personal.mrvEstimate !== null
                  ? ` Above ~${personal.mrvEstimate} sets, progress turned negative.`
                  : ' You haven\'t yet run enough volume to find where it turns negative.'}
                {sweetSurplus >= 0.6 && ' Most of those blocks were in a surplus, so food explains part of the gain.'}
              </p>
            ) : (
              <p>
                Not enough spread yet to personalize {muscle}: your weekly sets have stayed in a narrow band. Varying volume between blocks will
                reveal where you respond best.
              </p>
            )}
            {eff && (
              <p className="mt-1">
                Last 12 months: {fmt.signed(eff.pctPerMonth)} per month on {fmt.num(eff.setsPerWeek, 1)} sets/week (incl. indirect).
              </p>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
