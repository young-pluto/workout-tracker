/**
 * Exercise profiling from the exercise's name and muscle group.
 *
 * The database stores only a primary muscle group per exercise. Movement
 * pattern, equipment, loading class and synergist muscles are inferred here
 * from the name, so nothing extra has to be tagged by hand.
 */

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'smith' | 'bodyweight' | 'unknown';

export type Pattern =
  | 'horizontal-push'
  | 'vertical-push'
  | 'fly'
  | 'horizontal-pull'
  | 'vertical-pull'
  | 'straight-arm'
  | 'raise'
  | 'rear-fly'
  | 'curl'
  | 'extension'
  | 'shrug'
  | 'core'
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'leg-isolation'
  | 'calf'
  | 'other';

/**
 * Alberts' loading classes:
 * - axial: free weight loading the spine (barbell rows, shrugs, squats, deadlifts…)
 * - free: free weight / bodyweight without heavy spinal load (DB press, dips, pull-ups)
 * - supported: machine, cable, Smith or chest/bench-supported
 */
export type LoadingClass = 'axial' | 'free' | 'supported';

export interface Synergist {
  muscle: string;
  factor: number;
}

export interface ExerciseProfile {
  equipment: Equipment;
  pattern: Pattern;
  loading: LoadingClass;
  synergists: Synergist[];
  /** Logged weight is total body weight (pull-ups, dips) */
  bodyweight: boolean;
  /** Logged weight is machine assistance: effective load = body weight − weight */
  assisted: boolean;
}

function detectEquipment(n: string): Equipment {
  if (/smith/.test(n)) return 'smith';
  if (/machine|pec ?deck|hammer strength|leg press|hack squat|leg (extension|curl)/.test(n)) return 'machine';
  if (/cable|rope|pulley|pushdown|pull ?down|crossover|cross ?over|v-?bar|straight bar|handle|station|face ?pull/.test(n)) return 'cable';
  if (/\bdbs?\b|dumbbell|hammer curl|incline bench .*curl/.test(n)) return 'dumbbell';
  if (/barbell|\bbb\b|\bez\b|ez[- ]?bar|bench press|deadlift|squat|\brdl\b|good ?morning|military/.test(n)) return 'barbell';
  if (/pull[- ]?ups?|chin[- ]?ups?|\bdips?\b|push[- ]?ups?|bodyweight|inverted row|hanging/.test(n)) return 'bodyweight';
  return 'unknown';
}

function detectPattern(n: string, muscle: string): Pattern {
  if (/shrug/.test(n)) return 'shrug';
  if (/lat pushdown|straight[- ]arm|pullover/.test(n)) return 'straight-arm';
  if (/pull[- ]?ups?|chin[- ]?ups?|pull ?downs?|pulldowns?/.test(n)) return 'vertical-pull';
  if (/\brows?\b|rowing/.test(n)) return 'horizontal-pull';
  if (/rear ?delt|reverse (fly|pec)|face ?pull/.test(n) || muscle === 'Rear Delts') return 'rear-fly';
  if (/raise/.test(n) || muscle === 'Side Delts') return 'raise';
  if (/fly|flys|flies|crossover|cross ?over|pec ?deck/.test(n)) return 'fly';
  if (/curl/.test(n) && !/leg curl|hamstring/.test(n)) return 'curl';
  if (/tricep|skull|pushdown|kickback/.test(n) || (muscle === 'Triceps' && /extension/.test(n))) return 'extension';
  if (/crunch|\babs?\b|plank|leg raise|sit-?up|ab wheel/.test(n) || muscle === 'Core') return 'core';
  if (/squat|leg press|hack/.test(n)) return 'squat';
  if (/deadlift|\brdl\b|romanian|good ?morning|hip thrust|glute bridge|back extension|hyperextension/.test(n)) return 'hinge';
  if (/lunge|split squat|step-?up/.test(n)) return 'lunge';
  if (/leg (extension|curl)|hamstring curl/.test(n)) return 'leg-isolation';
  if (/calf/.test(n)) return 'calf';
  if (/overhead press|shoulder press|military|\bohp\b|arnold/.test(n) || (muscle === 'Front Delts' && /press/.test(n))) return 'vertical-push';
  if (/press|\bdips?\b|push[- ]?up/.test(n)) return 'horizontal-push';
  return 'other';
}

function detectLoading(n: string, equipment: Equipment, pattern: Pattern): LoadingClass {
  if (equipment === 'machine' || equipment === 'cable') return 'supported';
  const supportedByBench = /chest[- ]supported|seated|incline bench|preacher|lying|prone/.test(n);
  // A standing bar load pins the spine on hinges, rows, shrugs, squats and overhead presses.
  const spinal =
    pattern === 'horizontal-pull' ||
    pattern === 'shrug' ||
    pattern === 'squat' ||
    pattern === 'hinge' ||
    pattern === 'lunge' ||
    (pattern === 'vertical-push' && !/seated/.test(n));
  if ((equipment === 'barbell' || equipment === 'smith') && spinal && !supportedByBench) return 'axial';
  if (equipment === 'smith') return 'supported';
  if (supportedByBench && pattern !== 'horizontal-push') return 'supported';
  if (equipment === 'unknown') return 'supported';
  return 'free';
}

/**
 * Henselmans-style fractional volume: the prime mover gets 1 set, meaningful
 * synergists 0.5 (e.g. a horizontal row is 0.5 sets for biceps and rear delts).
 */
function detectSynergists(n: string, pattern: Pattern, muscle: string): Synergist[] {
  const s: Synergist[] = [];
  const add = (m: string, f = 0.5) => {
    if (m !== muscle) s.push({ muscle: m, factor: f });
  };
  switch (pattern) {
    case 'horizontal-push':
      add('Triceps');
      add('Front Delts');
      break;
    case 'vertical-push':
      add('Triceps');
      add('Side Delts');
      break;
    case 'horizontal-pull':
      add('Biceps');
      add('Rear Delts');
      break;
    case 'vertical-pull':
      add('Biceps');
      break;
    case 'curl':
      if (/hammer|reverse/.test(n)) add('Forearms');
      break;
    case 'squat':
    case 'lunge':
      add('Glutes');
      break;
    case 'hinge':
      add(muscle === 'Glutes' ? 'Hamstrings' : 'Glutes');
      break;
    default:
      break;
  }
  return s;
}

const cache = new Map<string, ExerciseProfile>();

export function profileExercise(name: string, muscle: string): ExerciseProfile {
  const key = `${name}\u0000${muscle}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const n = (name || '').toLowerCase();
  const assisted = /assist/.test(n);
  // Assisted pull-ups/dips run on a machine with a counterweight.
  const equipment = assisted ? 'machine' : detectEquipment(n);
  const pattern = detectPattern(n, muscle);
  const profile: ExerciseProfile = {
    equipment,
    pattern,
    loading: detectLoading(n, equipment, pattern),
    synergists: detectSynergists(n, pattern, muscle),
    bodyweight: equipment === 'bodyweight' && !assisted,
    assisted,
  };
  cache.set(key, profile);
  return profile;
}

/** Best-effort muscle group from a name, for exercises that were never tagged. */
export function inferMuscle(name: string): string | null {
  const n = (name || '').toLowerCase();
  if (/shrug/.test(n)) return 'Traps';
  if (/rear ?delt|reverse (fly|pec)|face ?pull/.test(n)) return 'Rear Delts';
  if (/lateral|side raise|side raises|\by[- ]raise/.test(n)) return 'Side Delts';
  if (/overhead press|shoulder press|military|\bohp\b|front raise|arnold/.test(n)) return 'Front Delts';
  if (/curl/.test(n) && !/leg curl|hamstring/.test(n)) return 'Biceps';
  if (/tricep|skull|pushdown|kickback/.test(n)) return 'Triceps';
  if (/pull[- ]?up|chin[- ]?up|pull ?down|\brows?\b|pullover|lat /.test(n)) return 'Back';
  if (/bench|chest|pec|fly|flys|crossover|\bdips?\b|push[- ]?up/.test(n)) return 'Chest';
  if (/crunch|\babs?\b|plank|sit[- ]?up/.test(n)) return 'Core';
  if (/squat|leg press|leg extension|hack/.test(n)) return 'Quads';
  if (/rdl|romanian|leg curl|hamstring|good ?morning/.test(n)) return 'Hamstrings';
  if (/hip thrust|glute/.test(n)) return 'Glutes';
  if (/calf/.test(n)) return 'Calves';
  if (/wrist|forearm/.test(n)) return 'Forearms';
  return null;
}

export const LOADING_LABEL: Record<LoadingClass, string> = {
  axial: 'Spinal-loaded',
  free: 'Free weight',
  supported: 'Machine & cable',
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: 'Barbell',
  dumbbell: 'Dumbbell',
  machine: 'Machine',
  cable: 'Cable',
  smith: 'Smith',
  bodyweight: 'Bodyweight',
  unknown: 'Machine/cable',
};
