/**
 * Debounce utility
 * Used for auto-save with 500ms delay (per spec)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateYMD(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display
 */
export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time elapsed (for timer)
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':');
}

/**
 * Get time-based greeting (per spec)
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Generate unique ID for local state
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get next set key (set1, set2, etc.)
 * Per spec: Sets named set1, set2, etc.
 */
export function getNextSetKey(existingSets: { [key: string]: any }): string {
  const existingNumbers = Object.keys(existingSets)
    .map(key => parseInt(key.replace('set', ''), 10))
    .filter(n => !isNaN(n));
  
  const maxNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 0;
  return `set${maxNumber + 1}`;
}

/**
 * Convert sets object to array for UI
 */
export function setsObjectToArray(sets: { [key: string]: any }): Array<{ key: string; data: any }> {
  return Object.entries(sets)
    .sort(([a], [b]) => {
      const numA = parseInt(a.replace('set', ''), 10);
      const numB = parseInt(b.replace('set', ''), 10);
      return numA - numB;
    })
    .map(([key, data]) => ({ key, data }));
}

/**
 * Check if a set has valid data (per spec: requires at least weight OR reps)
 */
export function isSetValid(set: { weight: string | number; reps: string | number }): boolean {
  const hasWeight = set.weight !== '' && set.weight !== 0 && set.weight !== '0';
  const hasReps = set.reps !== '' && set.reps !== 0 && set.reps !== '0';
  return hasWeight || hasReps;
}

/**
 * Category display config
 */
export const categoryConfig = {
  strength: { label: 'Strength', color: 'var(--color-strength)' },
  cardio: { label: 'Cardio', color: 'var(--color-cardio)' },
  flexibility: { label: 'Flexibility', color: 'var(--color-flexibility)' },
  other: { label: 'Other', color: 'var(--color-other)' },
} as const;

/**
 * cn - Classname utility for conditional classes
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Muscle groups available to tag exercises with.
 */
export const MUSCLE_GROUPS = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Forearms',
  'Core',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Full Body',
  'Cardio',
  'Other',
] as const;

/** Fallback label used when an exercise has no muscle group assigned */
export const UNASSIGNED_MUSCLE = 'Unassigned';

/**
 * A stable, distinct color per muscle group (used in badges & charts)
 */
export const muscleGroupColors: Record<string, string> = {
  Chest: '#2563eb',
  Back: '#0ea5e9',
  Shoulders: '#06b6d4',
  Biceps: '#10b981',
  Triceps: '#84cc16',
  Forearms: '#eab308',
  Core: '#f59e0b',
  Quads: '#f97316',
  Hamstrings: '#ef4444',
  Glutes: '#ec4899',
  Calves: '#a855f7',
  'Full Body': '#8b5cf6',
  Cardio: '#14b8a6',
  Other: '#64748b',
  [UNASSIGNED_MUSCLE]: '#94a3b8',
};

/** Resolve a color for any muscle group string, with a sensible default */
export function muscleGroupColor(mg: string): string {
  return muscleGroupColors[mg] || '#64748b';
}

/**
 * Compute RPE gradient color (green -> amber -> red across 6..10)
 */
export function rpeColor(value: number): string {
  if (isNaN(value)) return 'var(--color-text-muted)';
  const t = Math.max(0, Math.min(1, (value - 6) / 4));
  const hue = 145 - t * 145; // 145 green -> 0 red
  return `hsl(${hue}, 70%, 45%)`;
}

/**
 * Number of logged sets (weight OR reps present) in a Firebase sets object
 */
export function countLoggedSets(sets: { [key: string]: { weight?: string | number; reps?: string | number } } | undefined): number {
  if (!sets) return 0;
  return Object.values(sets).filter((s) => isSetValid({ weight: s.weight ?? '', reps: s.reps ?? '' })).length;
}
