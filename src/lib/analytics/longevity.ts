/**
 * Alberts & Nuñez: longevity. Spinal vs supported loading, joint mentions in
 * remarks, and how long each staple movement stays productive.
 */
import type { Dataset } from './dataset';
import { bodyPartsIn } from './effort';
import type { LoadingClass } from './profile';
import type { LiftSummary, Note } from './strength';

export type LoadingShare = Record<LoadingClass, number>;

export interface LoadingMonth {
  monthStartDay: number;
  label: string;
  counts: LoadingShare;
  total: number;
}

export interface WearPart {
  part: string;
  recent: number; // last 90 days
  total: number;
  notes: Note[]; // newest first
}

export type LifespanState = 'productive' | 'rebuilding' | 'holding' | 'stale' | 'regressing' | 'creep' | 'rotated';

export interface LifespanRow {
  lift: LiftSummary;
  months: number;
  state: LifespanState;
}

export interface LongevityAnalysis {
  last90: LoadingShare;
  prior90: LoadingShare;
  last90Total: number;
  prior90Total: number;
  months: LoadingMonth[];
  wear: WearPart[];
  painRecent: number;
  painPrior: number; // the 90 days before
  lifespan: LifespanRow[];
}

function emptyShare(): LoadingShare {
  return { axial: 0, free: 0, supported: 0 };
}

export function analyzeLongevity(ds: Dataset, lifts: LiftSummary[]): LongevityAnalysis {
  const { today } = ds;
  const last90 = emptyShare();
  const prior90 = emptyShare();
  const monthMap = new Map<string, LoadingMonth>();

  for (const s of ds.sessions) {
    const n = s.sets.filter((x) => x.hard).length;
    if (n === 0) continue;
    if (s.day > today - 90) last90[s.profile.loading] += n;
    else if (s.day > today - 180) prior90[s.profile.loading] += n;
    if (s.day > today - 365) {
      const key = s.date.slice(0, 7);
      let m = monthMap.get(key);
      if (!m) {
        const [y, mo] = key.split('-').map(Number);
        const monthStartDay = Math.round(Date.UTC(y, mo - 1, 1) / 86_400_000);
        m = { monthStartDay, label: key, counts: emptyShare(), total: 0 };
        monthMap.set(key, m);
      }
      m.counts[s.profile.loading] += n;
      m.total += n;
    }
  }
  const sum = (x: LoadingShare) => x.axial + x.free + x.supported;
  const months = [...monthMap.values()].sort((a, b) => a.monthStartDay - b.monthStartDay);

  // Joint / injury mentions, grouped by body part.
  const parts = new Map<string, WearPart>();
  let painRecent = 0;
  let painPrior = 0;
  for (const s of ds.sessions) {
    for (const set of s.sets) {
      if (!set.pain) continue;
      if (s.day > today - 90) painRecent++;
      else if (s.day > today - 180) painPrior++;
      for (const part of bodyPartsIn(set.remarks)) {
        const p = parts.get(part) ?? { part, recent: 0, total: 0, notes: [] };
        p.total++;
        if (s.day > today - 90) p.recent++;
        p.notes.push({ day: s.day, date: s.date, exercise: s.name, text: set.remarks });
        parts.set(part, p);
      }
    }
  }
  const wear = [...parts.values()]
    .map((p) => ({ ...p, notes: p.notes.sort((a, b) => b.day - a.day) }))
    .sort((a, b) => b.recent - a.recent || b.total - a.total);

  // Exercise lifespan: staples with at least 6 sessions.
  const lifespan: LifespanRow[] = lifts
    .filter((l) => l.sessionCount >= 6 && l.points.length >= 4)
    .map((lift) => {
      const months = Math.max(0, (lift.lastDay - lift.firstDay) / 30.44);
      let state: LifespanState;
      // Same verdicts as the Lifts tab, plus the two longevity-only states.
      if (lift.status === 'rotated') state = 'rotated';
      else if (lift.momentumCreep) state = 'creep';
      else if (lift.status === 'progressing') state = 'productive';
      else if (lift.status === 'rebuilding') state = 'rebuilding';
      else if (lift.status === 'regressing') state = 'regressing';
      else if (lift.status === 'plateau' && lift.weeksSincePr !== null && lift.weeksSincePr >= 8) state = 'stale';
      else state = 'holding';
      return { lift, months, state };
    })
    .sort((a, b) => {
      const rotA = a.state === 'rotated' ? 1 : 0;
      const rotB = b.state === 'rotated' ? 1 : 0;
      return rotA - rotB || b.lift.sessionCount - a.lift.sessionCount;
    });

  return {
    last90,
    prior90,
    last90Total: sum(last90),
    prior90Total: sum(prior90),
    months,
    wear,
    painRecent,
    painPrior,
    lifespan,
  };
}

