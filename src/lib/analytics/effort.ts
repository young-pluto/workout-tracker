/**
 * Effort (RPE / RIR) and remark parsing.
 *
 * RPE comes from the set's slider when present. Older sets often carry it in
 * the remark instead ("@ rpe 9.5", "2 rir", "1 in the tank"), and remarks that
 * describe failure ("failed", "partials", "rest pause") imply 0 RIR.
 */

export type EffortSource = 'logged' | 'remark' | 'failure' | 'assumed';

export interface ParsedEffort {
  rpe: number;
  source: Exclude<EffortSource, 'assumed'>;
}

const RPE_AFTER = /\brpe\s*[:@=-]?\s*(\d{1,2}(?:\.\d+)?)/i;
const RPE_BEFORE = /(\d{1,2}(?:\.\d+)?)\s*rpe\b/i;
const RIR_BEFORE = /(\d(?:\.\d+)?)\s*rir\b/i;
const RIR_AFTER = /\brir\s*[:@=-]?\s*(\d(?:\.\d+)?)/i;
const IN_TANK = /(\d)\s*(?:more\s*)?(?:reps?\s*)?(?:left\s*)?in\s*(?:the\s*)?tank/i;
const FAILURE = /\bfail(?:ed|ure|ing)?\b|\bpartials?\b|\bimpartial\b|rest[- ]?pause|\bincomplete\b|\bbarely\b|\bto failure\b/i;

function validRpe(v: number): number | null {
  return Number.isFinite(v) && v >= 5 && v <= 10 ? v : null;
}

export function parseEffort(rawRpe: unknown, remarks: string): ParsedEffort | null {
  const logged = validRpe(typeof rawRpe === 'number' ? rawRpe : parseFloat(String(rawRpe ?? '')));
  if (logged !== null) return { rpe: logged, source: 'logged' };
  if (!remarks) return null;

  const rpeMatch = remarks.match(RPE_AFTER) || remarks.match(RPE_BEFORE);
  if (rpeMatch) {
    const v = validRpe(parseFloat(rpeMatch[1]));
    if (v !== null) return { rpe: v, source: 'remark' };
  }
  const rirMatch = remarks.match(RIR_BEFORE) || remarks.match(RIR_AFTER) || remarks.match(IN_TANK);
  if (rirMatch) {
    const rir = parseFloat(rirMatch[1]);
    if (Number.isFinite(rir) && rir >= 0 && rir <= 5) return { rpe: 10 - rir, source: 'remark' };
  }
  if (FAILURE.test(remarks)) return { rpe: 10, source: 'failure' };
  return null;
}

/**
 * Remarks that point at joint or injury trouble. "Painful" alone is left out:
 * in these logs it usually describes effort, not a joint.
 */
const PAIN = /\binjur\w*|\bhurt\w*|\bpain(?!ful)\w*|\btweak\w*|\bniggl\w*|\bstrain(?:ed)?\b|\bflared?\b|\baching\b|\bache\b|\bsprain\w*/i;

/** Remarks that describe an execution breakdown (form drift, momentum, cut ROM). */
const EXECUTION = /\bpartials?\b|\bimpartial\b|\bincomplete\b|\bhalf (?:rep|done|completed)|\bonly half\b|\bmomentum\b|\bcheat\w*|\bswing\w*|\bsloppy\b|form (?:suffered|sucked|broke|breakdown|was off|got worse)|\blacked rom\b|\bshort(?:ened)? rom\b|\bkipping\b|\bego lift/i;

export function hasPainMention(remarks: string): boolean {
  return !!remarks && PAIN.test(remarks);
}

export function hasExecutionFlag(remarks: string): boolean {
  return !!remarks && EXECUTION.test(remarks);
}

const BODY_PARTS: Array<[string, RegExp]> = [
  ['Shoulder', /shoulder|rotator|\bac joint/i],
  ['Elbow', /elbow|tendon/i],
  ['Wrist & hand', /wrist|\bhands?\b|finger|grip/i],
  ['Biceps', /bicep/i],
  ['Neck', /\bneck\b|trap/i],
  ['Lower back', /lower back|back pain|\bspine\b|\blumbar/i],
  ['Chest & ribs', /\bchest\b|\bpec|\brib/i],
  ['Knee', /\bknee/i],
  ['Hip', /\bhip\b/i],
];

/** Body parts named in a pain remark ("Unspecified" when none is named). */
export function bodyPartsIn(remarks: string): string[] {
  const parts = BODY_PARTS.filter(([, re]) => re.test(remarks)).map(([label]) => label);
  return parts.length > 0 ? parts : ['Unspecified'];
}

/**
 * Helms-style normalization: the load you could lift for 10 reps with 2 in
 * reserve (= a 12-rep max), from load × reps at a given RIR, via Epley.
 *   e1RM = load × (1 + RTF/30),  e10RM@2RIR = e1RM / (1 + 12/30)
 */
export function e10rm(load: number, reps: number, rir: number): number {
  const rtf = Math.min(reps + Math.max(0, rir), 30);
  return (load * (30 + rtf)) / 42;
}
