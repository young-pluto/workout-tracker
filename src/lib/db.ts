/**
 * Firebase Data Access Layer
 * 
 * CRITICAL: All paths and data shapes MUST match the original spec exactly.
 * This file handles all Firebase Realtime Database operations.
 * 
 * Path Reference:
 * - /users/{userId} - User profile (once read)
 * - /users/{userId}/exercises - Exercises (realtime listener)
 * - /users/{userId}/workouts - Completed workouts (once read)
 * - /users/{userId}/savedWorkoutEntries - In-progress entries (once read)
 */

import {
  ref,
  get,
  set,
  push,
  update,
  remove,
  onValue,
  off,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/database';
import { database } from './firebase';
import { toExerciseSessions, type ExerciseSession } from './history';
import type { UserData, Exercise, Workout, ExerciseCategory } from '../types';

// ==========================================
// USER OPERATIONS
// Path: /users/{userId}
// Read: once (after auth)
// Write: once (signup only)
// ==========================================

/**
 * Create user profile on signup
 */
export async function createUserProfile(
  userId: string,
  name: string,
  email: string
): Promise<void> {
  const userRef = ref(database, `users/${userId}`);
  await set(userRef, {
    name,
    email,
    createdAt: serverTimestamp(),
  });
}

/**
 * Get user profile (one-time read)
 */
export async function getUserProfile(userId: string): Promise<UserData | null> {
  const userRef = ref(database, `users/${userId}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? (snapshot.val() as UserData) : null;
}

// ==========================================
// EXERCISE OPERATIONS
// Path: /users/{userId}/exercises/{exerciseId}
// Read: REALTIME listener (on('value'))
// Write: push (new), update (edit), remove (delete)
// ==========================================

/**
 * Subscribe to exercises (REALTIME)
 * Returns unsubscribe function
 */
export function subscribeToExercises(
  userId: string,
  callback: (exercises: Exercise[]) => void
): Unsubscribe {
  const exercisesRef = ref(database, `users/${userId}/exercises`);
  
  onValue(exercisesRef, (snapshot) => {
    const exercises: Exercise[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        exercises.push({
          id: child.key!,
          ...child.val(),
          // Default usageCount to 0 if not present (per spec)
          usageCount: child.val().usageCount ?? 0,
        });
      });
    }
    // Sort alphabetically by name (per spec)
    exercises.sort((a, b) => a.name.localeCompare(b.name));
    callback(exercises);
  });
  
  return () => off(exercisesRef);
}

/**
 * Add a new exercise
 */
export async function addExercise(
  userId: string,
  name: string,
  category: ExerciseCategory,
  description: string,
  muscleGroup: string = ''
): Promise<string> {
  const exercisesRef = ref(database, `users/${userId}/exercises`);
  const newRef = push(exercisesRef);
  await set(newRef, {
    name,
    category,
    muscleGroup,
    description,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    usageCount: 0,
  });
  return newRef.key!;
}

/**
 * Update an existing exercise
 */
export async function updateExercise(
  userId: string,
  exerciseId: string,
  data: { name?: string; category?: ExerciseCategory; description?: string; muscleGroup?: string }
): Promise<void> {
  const exerciseRef = ref(database, `users/${userId}/exercises/${exerciseId}`);
  await update(exerciseRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete an exercise
 */
export async function deleteExercise(
  userId: string,
  exerciseId: string
): Promise<void> {
  const exerciseRef = ref(database, `users/${userId}/exercises/${exerciseId}`);
  await remove(exerciseRef);
}

/**
 * Increment exercise usage count
 * Called when completing a workout
 */
export async function incrementExerciseUsageCount(
  userId: string,
  exerciseId: string
): Promise<void> {
  const exerciseRef = ref(database, `users/${userId}/exercises/${exerciseId}`);
  const snapshot = await get(exerciseRef);
  if (snapshot.exists()) {
    const currentCount = snapshot.val().usageCount ?? 0;
    await update(exerciseRef, {
      usageCount: currentCount + 1,
      updatedAt: serverTimestamp(),
    });
  }
}

// ==========================================
// WORKOUT OPERATIONS
// Path: /users/{userId}/workouts/{workoutId}
// Read: ONE-TIME with limits (once('value'))
// Write: push (new), update (edit)
// ==========================================

/**
 * Newest first by the workout's own date. `timestamp` is rewritten whenever an
 * old workout is edited, so it only breaks ties between same-day workouts.
 */
function byWorkoutDateDesc(a: Workout, b: Workout): number {
  return (
    (b.date || '').localeCompare(a.date || '') ||
    (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0)
  );
}

/**
 * Get workout history (one-time, limited to 50)
 * NOTE: We fetch all and sort client-side to avoid requiring Firebase index
 */
export async function getWorkoutHistory(
  userId: string,
  limit: number = 50
): Promise<Workout[]> {
  const workoutsRef = ref(database, `users/${userId}/workouts`);
  
  const snapshot = await get(workoutsRef);
  const workouts: Workout[] = [];
  
  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      workouts.push({
        id: child.key!,
        ...child.val(),
      });
    });
  }
  
  // Newest workout date first (editing an old workout must not move it to the top), then limit
  workouts.sort(byWorkoutDateDesc);

  return workouts.slice(0, limit);
}

/**
 * All completed workouts, newest first by workout date.
 *
 * Shared by every exercise card's "Previous" panel and the full history sheet,
 * so opening several cards in a row costs one read. The cache is short-lived
 * and dropped whenever a workout is saved.
 */
const WORKOUTS_CACHE_MS = 60_000;
let workoutsCache: { userId: string; fetchedAt: number; promise: Promise<Workout[]> } | null = null;

export function invalidateWorkoutsCache(): void {
  workoutsCache = null;
}

export function getAllWorkouts(userId: string): Promise<Workout[]> {
  const now = Date.now();
  if (
    workoutsCache &&
    workoutsCache.userId === userId &&
    now - workoutsCache.fetchedAt < WORKOUTS_CACHE_MS
  ) {
    return workoutsCache.promise;
  }

  const promise = (async () => {
    const snapshot = await get(ref(database, `users/${userId}/workouts`));
    const workouts: Workout[] = [];
    if (snapshot.exists()) {
      snapshot.forEach((child) => {
        workouts.push({ id: child.key!, ...child.val() });
      });
    }
    return workouts.sort(byWorkoutDateDesc);
  })();

  workoutsCache = { userId, fetchedAt: now, promise };
  promise.catch(() => {
    if (workoutsCache?.promise === promise) workoutsCache = null;
  });
  return promise;
}

/**
 * Every logged session of one exercise across all history, newest first.
 * `excludeWorkoutId` keeps a workout that is being edited out of its own history.
 */
export async function getExerciseSessions(
  userId: string,
  exerciseId: string,
  excludeWorkoutId?: string | null
): Promise<ExerciseSession[]> {
  const workouts = await getAllWorkouts(userId);
  return toExerciseSessions(workouts, exerciseId, excludeWorkoutId);
}

/**
 * Get all workouts for progress charts (no limit)
 * NOTE: We fetch all and sort client-side to avoid requiring Firebase index
 */
export async function getAllWorkoutsForProgress(
  userId: string
): Promise<Workout[]> {
  const workoutsRef = ref(database, `users/${userId}/workouts`);
  
  const snapshot = await get(workoutsRef);
  const workouts: Workout[] = [];
  
  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      workouts.push({
        id: child.key!,
        ...child.val(),
      });
    });
  }
  
  // Sort by timestamp (oldest first for charts)
  workouts.sort((a, b) => {
    const timeA = a.timestamp || 0;
    const timeB = b.timestamp || 0;
    return (typeof timeA === 'number' ? timeA : 0) - (typeof timeB === 'number' ? timeB : 0);
  });
  
  return workouts;
}

/**
 * Save a completed workout
 */
export async function saveWorkout(
  userId: string,
  workout: Omit<Workout, 'id' | 'timestamp'>,
  existingId?: string
): Promise<string> {
  const workoutData = {
    ...workout,
    timestamp: serverTimestamp(),
  };

  if (existingId) {
    // Update existing workout
    const workoutRef = ref(database, `users/${userId}/workouts/${existingId}`);
    await set(workoutRef, workoutData);
    invalidateWorkoutsCache();
    return existingId;
  } else {
    // Create new workout
    const workoutsRef = ref(database, `users/${userId}/workouts`);
    const newRef = push(workoutsRef);
    await set(newRef, workoutData);
    invalidateWorkoutsCache();
    return newRef.key!;
  }
}

// ==========================================
// SAVED ENTRIES OPERATIONS (IN-PROGRESS WORKOUTS)
// Path: /users/{userId}/savedWorkoutEntries/{entryId}
// Read: ONE-TIME (once('value'))
// Write: push (new), update (existing), remove (after complete)
// ==========================================

/**
 * Get all saved entries (one-time)
 * NOTE: We fetch all and sort client-side to avoid requiring Firebase index
 */
export async function getSavedEntries(userId: string): Promise<Workout[]> {
  const entriesRef = ref(database, `users/${userId}/savedWorkoutEntries`);
  
  const snapshot = await get(entriesRef);
  const entries: Workout[] = [];
  
  if (snapshot.exists()) {
    snapshot.forEach((child) => {
      entries.push({
        id: child.key!,
        ...child.val(),
      });
    });
  }
  
  // Sort by timestamp (newest first)
  entries.sort((a, b) => {
    const timeA = a.timestamp || 0;
    const timeB = b.timestamp || 0;
    return (typeof timeB === 'number' ? timeB : 0) - (typeof timeA === 'number' ? timeA : 0);
  });
  
  return entries;
}

/**
 * Save entry (auto-save in-progress workout)
 * Creates new or updates existing based on entryId
 */
export async function saveEntry(
  userId: string,
  entry: Omit<Workout, 'id' | 'timestamp'>,
  existingId?: string | null
): Promise<string> {
  const entryData = {
    ...entry,
    timestamp: serverTimestamp(),
  };
  
  if (existingId) {
    // Update existing entry
    const entryRef = ref(database, `users/${userId}/savedWorkoutEntries/${existingId}`);
    await set(entryRef, entryData);
    return existingId;
  } else {
    // Create new entry
    const entriesRef = ref(database, `users/${userId}/savedWorkoutEntries`);
    const newRef = push(entriesRef);
    await set(newRef, entryData);
    return newRef.key!;
  }
}

/**
 * Delete a saved entry (after completing workout)
 */
export async function deleteSavedEntry(
  userId: string,
  entryId: string
): Promise<void> {
  const entryRef = ref(database, `users/${userId}/savedWorkoutEntries/${entryId}`);
  await remove(entryRef);
}
