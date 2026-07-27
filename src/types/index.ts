// ==========================================
// FIREBASE DATA TYPES - PRESERVE EXACTLY
// ==========================================

/**
 * User profile stored at /users/{userId}
 * Created on signup, never updated afterwards
 */
export interface UserData {
  name: string;
  email: string;
  createdAt: number; // Firebase ServerTimestamp
}

/**
 * Exercise category enum
 */
export type ExerciseCategory = "strength" | "cardio" | "flexibility" | "other";

/**
 * Exercise stored at /users/{userId}/exercises/{exerciseId}
 * Realtime synced
 */
export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  muscleGroup?: string; // e.g. "Chest", "Back"; optional (unassigned if absent)
  description: string;
  createdAt: number;
  updatedAt: number;
  usageCount?: number; // defaults to 0 if not present
}

/**
 * Set data - NOTE: weight/reps kept as string|number
 * to match original spec inconsistency
 */
export interface WorkoutSet {
  weight: string | number;
  reps: string | number;
  rpe?: string | number; // Rate of Perceived Exertion (6-10), optional
  remarks: string;
}

/**
 * Exercise within a workout
 * Sets are stored as { set1: {}, set2: {}, ... } NOT an array
 */
export interface WorkoutExercise {
  name: string;
  category: string;
  muscleGroup?: string; // denormalized from Exercise at save time
  sets: { [key: string]: WorkoutSet }; // set1, set2, etc.
}

/**
 * Workout stored at /users/{userId}/workouts/{workoutId}
 * or /users/{userId}/savedWorkoutEntries/{entryId}
 */
export interface Workout {
  id?: string;
  name: string;
  date: string; // "YYYY-MM-DD"
  bodyWeight: number | null;
  timestamp: number; // Firebase ServerTimestamp
  exercises: { [exerciseId: string]: WorkoutExercise };
}

// ==========================================
// UI STATE TYPES
// ==========================================

/**
 * Current workout in-progress state
 */
export interface WorkoutEditorState {
  name: string;
  date: string;
  bodyWeight: string;
  exercises: WorkoutEditorExercise[];
  isActive: boolean;
  editingWorkoutId: string | null;
  editingSavedEntryId: string | null;
}

/**
 * Exercise in the workout editor with UI state
 */
export interface WorkoutEditorExercise {
  exerciseId: string;
  name: string;
  category: string;
  muscleGroup?: string;
  sets: WorkoutEditorSet[];
  isCollapsed: boolean;
  showHistory: boolean;
}

/**
 * Set in the workout editor with UI state
 */
export interface WorkoutEditorSet {
  id: string; // local unique id for React key
  weight: string;
  reps: string;
  rpe: string; // '' when unset, otherwise "6"-"10" in 0.5 steps
  remarks: string;
  isSaved: boolean;
}

/**
 * Tab/section navigation
 */
export type AppSection = 'exercises' | 'workout' | 'history' | 'analysis';

/**
 * Theme preference
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Toast notification
 */
export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ==========================================
// CHART DATA TYPES
// ==========================================

export interface ProgressDataPoint {
  date: string;
  maxWeight: number;
  totalVolume: number;
  bodyWeightRatio: number | null;
  bodyWeight: number | null;
}

export interface ExerciseHistoryEntry {
  date: string;
  workoutName: string;
  bodyWeight: number | null;
  sets: WorkoutSet[];
}

// ==========================================
// ANALYSIS TYPES
// ==========================================

/**
 * Per-muscle-group aggregate over a date window (last 7 days)
 */
export interface MuscleGroupStat {
  muscleGroup: string;
  sets: number; // total logged sets (volume)
  frequency: number; // distinct days trained
}

/**
 * Full last-7-days analysis summary
 */
export interface AnalysisSummary {
  stats: MuscleGroupStat[]; // sorted by sets desc
  workouts: number; // workouts in range
  daysTrained: number; // distinct training days
  totalSets: number;
  muscleGroupsHit: number;
}
