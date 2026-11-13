/**
 * Israetel / Renaissance Periodization volume landmarks, in direct hard sets
 * per muscle per week. These are population starting points; the dose–response
 * module estimates personal ranges once the logs support it.
 *
 * mv  = maintenance volume, mev = minimum effective, mav = maximum adaptive
 * (a range), mrv = maximum recoverable.
 */
export interface Landmarks {
  mv: number;
  mev: number;
  mav: [number, number];
  mrv: number;
}

const DEFAULTS: Record<string, Landmarks> = {
  Chest: { mv: 8, mev: 10, mav: [12, 20], mrv: 22 },
  Back: { mv: 8, mev: 10, mav: [14, 22], mrv: 25 },
  Traps: { mv: 0, mev: 0, mav: [12, 20], mrv: 26 },
  'Front Delts': { mv: 0, mev: 0, mav: [6, 8], mrv: 12 },
  'Side Delts': { mv: 0, mev: 8, mav: [16, 22], mrv: 26 },
  'Rear Delts': { mv: 0, mev: 6, mav: [12, 18], mrv: 22 },
  Shoulders: { mv: 0, mev: 8, mav: [16, 22], mrv: 26 },
  Biceps: { mv: 5, mev: 8, mav: [14, 20], mrv: 26 },
  Triceps: { mv: 4, mev: 6, mav: [10, 14], mrv: 18 },
  Forearms: { mv: 0, mev: 2, mav: [6, 14], mrv: 20 },
  Core: { mv: 0, mev: 0, mav: [16, 20], mrv: 25 },
  Quads: { mv: 6, mev: 8, mav: [12, 18], mrv: 20 },
  Hamstrings: { mv: 3, mev: 4, mav: [10, 16], mrv: 20 },
  Glutes: { mv: 0, mev: 0, mav: [4, 12], mrv: 16 },
  Calves: { mv: 6, mev: 8, mav: [12, 16], mrv: 20 },
};

export function landmarksFor(muscle: string): Landmarks | null {
  return DEFAULTS[muscle] ?? null;
}

export type VolumeZone = 'none' | 'below-mev' | 'maintenance' | 'productive' | 'high' | 'over-mrv';

export function volumeZone(sets: number, lm: Landmarks): VolumeZone {
  if (sets <= 0) return 'none';
  if (sets > lm.mrv) return 'over-mrv';
  if (sets > lm.mav[1]) return 'high';
  if (sets >= lm.mav[0]) return 'productive';
  if (sets >= lm.mev) return 'maintenance';
  return 'below-mev';
}

export const ZONE_LABEL: Record<VolumeZone, string> = {
  none: 'Not trained',
  'below-mev': 'Below MEV',
  maintenance: 'MEV – MAV',
  productive: 'In MAV',
  high: 'Near MRV',
  'over-mrv': 'Above MRV',
};

/** Display order for muscles (roughly upper → lower body). */
export const MUSCLE_ORDER = [
  'Chest',
  'Back',
  'Traps',
  'Front Delts',
  'Side Delts',
  'Rear Delts',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Core',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
];

export function muscleRank(m: string): number {
  const i = MUSCLE_ORDER.indexOf(m);
  return i === -1 ? MUSCLE_ORDER.length : i;
}
