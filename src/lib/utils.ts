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
