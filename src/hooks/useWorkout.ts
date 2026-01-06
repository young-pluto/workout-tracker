import { useState, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { saveEntry, saveWorkout, deleteSavedEntry, getSavedEntries, incrementExerciseUsageCount } from '../lib/db';
import { debounce, formatDateYMD, generateId, isSetValid } from '../lib/utils';
import { toast } from '../components/ui';
import type { Exercise, WorkoutEditorState, WorkoutEditorExercise, WorkoutEditorSet, Workout, WorkoutExercise } from '../types';

const AUTOSAVE_DEBOUNCE_MS = 500; // Per spec: 500ms debounce

interface UseWorkoutReturn {
  state: WorkoutEditorState;
  // Actions
  setWorkoutName: (name: string) => void;
  setWorkoutDate: (date: string) => void;
  setBodyWeight: (weight: string) => void;
  addExercise: (exercise: Exercise) => void;
  removeExercise: (exerciseId: string) => void;
  addSet: (exerciseId: string) => void;
  updateSet: (exerciseId: string, setId: string, data: Partial<WorkoutEditorSet>) => void;
  saveSet: (exerciseId: string, setId: string) => void;
  deleteSet: (exerciseId: string, setId: string) => void;
  toggleExerciseCollapse: (exerciseId: string) => void;
  toggleExerciseHistory: (exerciseId: string) => void;
  startWorkout: () => void;
  endWorkout: () => Promise<boolean>;
  saveCurrentEntry: () => Promise<void>;
  loadSavedEntry: (entry: Workout) => void;
  loadWorkoutForEdit: (workout: Workout) => void;
  resetWorkout: () => void;
  // State
  savedEntries: Workout[];
  loadingSavedEntries: boolean;
  loadSavedEntriesList: () => Promise<void>;
}

const initialState: WorkoutEditorState = {
  name: '',
  date: formatDateYMD(),
  bodyWeight: '',
  exercises: [],
  isActive: false,
  editingWorkoutId: null,
  editingSavedEntryId: null,
};

export function useWorkout(): UseWorkoutReturn {
  const { user } = useAuth();
  const [state, setState] = useState<WorkoutEditorState>(initialState);
  const [savedEntries, setSavedEntries] = useState<Workout[]>([]);
  const [loadingSavedEntries, setLoadingSavedEntries] = useState(false);
  
  // Track if we've performed initial save for new entry
  const savedEntryIdRef = useRef<string | null>(null);

  // Auto-save function (silent, errors only logged per spec)
  const autoSaveEntry = useCallback(async () => {
    if (!user) return;
    
    // Build workout data from current state
    const exercises: { [exerciseId: string]: WorkoutExercise } = {};
    
    state.exercises.forEach((ex) => {
      const sets: { [key: string]: any } = {};
      ex.sets.forEach((set, index) => {
        const setKey = `set${index + 1}`;
        sets[setKey] = {
          weight: set.weight,
          reps: set.reps,
          remarks: set.remarks,
        };
      });
      
      exercises[ex.exerciseId] = {
        name: ex.name,
        category: ex.category,
        sets,
      };
    });

    const entryData = {
      name: state.name,
      date: state.date,
      bodyWeight: state.bodyWeight ? parseFloat(state.bodyWeight) : null,
      exercises,
    };

    try {
      const entryId = await saveEntry(
        user.uid,
        entryData,
        savedEntryIdRef.current || state.editingSavedEntryId
      );
      
      // Store the entry ID for future updates
      if (!savedEntryIdRef.current && !state.editingSavedEntryId) {
        savedEntryIdRef.current = entryId;
        setState(prev => ({ ...prev, editingSavedEntryId: entryId }));
      }
      
      // Show subtle auto-save indicator (green toast per spec)
      toast('Auto-saved', 'success');
    } catch (err) {
      // Per spec: errors only logged to console in silent mode
      console.error('Auto-save failed:', err);
    }
  }, [user, state.name, state.date, state.bodyWeight, state.exercises, state.editingSavedEntryId]);

  // Debounced auto-save (500ms per spec)
  const debouncedAutoSave = useMemo(
    () => debounce(autoSaveEntry, AUTOSAVE_DEBOUNCE_MS),
    [autoSaveEntry]
  );

  // Actions
  const setWorkoutName = useCallback((name: string) => {
    setState(prev => ({ ...prev, name }));
  }, []);

  const setWorkoutDate = useCallback((date: string) => {
    setState(prev => ({ ...prev, date }));
  }, []);

  const setBodyWeight = useCallback((weight: string) => {
    setState(prev => ({ ...prev, bodyWeight: weight }));
  }, []);

  const addExercise = useCallback((exercise: Exercise) => {
    setState(prev => {
      // Check if already added
      if (prev.exercises.some(e => e.exerciseId === exercise.id)) {
        return prev;
      }

      // Collapse other exercises (per spec: auto-collapse older exercises)
      const updatedExercises = prev.exercises.map(e => ({
        ...e,
        isCollapsed: true,
      }));

      const newExercise: WorkoutEditorExercise = {
        exerciseId: exercise.id,
        name: exercise.name,
        category: exercise.category,
        sets: [
          {
            id: generateId(),
            weight: '',
            reps: '',
            remarks: '',
            isSaved: false,
          },
        ],
        isCollapsed: false,
        showHistory: false,
      };

      return {
        ...prev,
        exercises: [...updatedExercises, newExercise],
      };
    });
  }, []);

  const removeExercise = useCallback((exerciseId: string) => {
    setState(prev => ({
      ...prev,
      exercises: prev.exercises.filter(e => e.exerciseId !== exerciseId),
    }));
  }, []);

  const addSet = useCallback((exerciseId: string) => {
    setState(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => {
        if (ex.exerciseId !== exerciseId) return ex;
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              id: generateId(),
              weight: '',
              reps: '',
              remarks: '',
              isSaved: false,
            },
          ],
        };
      }),
    }));
  }, []);

  const updateSet = useCallback((exerciseId: string, setId: string, data: Partial<WorkoutEditorSet>) => {
    setState(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => {
        if (ex.exerciseId !== exerciseId) return ex;
        return {
          ...ex,
          sets: ex.sets.map(set => {
            if (set.id !== setId) return set;
            return { ...set, ...data };
          }),
        };
      }),
    }));
  }, []);

  const saveSet = useCallback((exerciseId: string, setId: string) => {
    setState(prev => {
      const exercise = prev.exercises.find(e => e.exerciseId === exerciseId);
      const set = exercise?.sets.find(s => s.id === setId);
      
      // Validation: requires at least weight OR reps (per spec)
      if (!set || !isSetValid({ weight: set.weight, reps: set.reps })) {
        toast('Please enter at least weight or reps', 'error');
        return prev;
      }

      return {
        ...prev,
        exercises: prev.exercises.map(ex => {
          if (ex.exerciseId !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.map(s => {
              if (s.id !== setId) return s;
              return { ...s, isSaved: true };
            }),
          };
        }),
      };
    });

    // Trigger auto-save after saving set (per spec)
    debouncedAutoSave();
  }, [debouncedAutoSave]);

  const deleteSet = useCallback((exerciseId: string, setId: string) => {
    setState(prev => {
      const exercise = prev.exercises.find(e => e.exerciseId === exerciseId);
      
      // Per spec: cannot delete last set
      if (!exercise || exercise.sets.length <= 1) {
        toast('Cannot delete the last set', 'error');
        return prev;
      }

      return {
        ...prev,
        exercises: prev.exercises.map(ex => {
          if (ex.exerciseId !== exerciseId) return ex;
          return {
            ...ex,
            sets: ex.sets.filter(s => s.id !== setId),
          };
        }),
      };
    });
  }, []);

  const toggleExerciseCollapse = useCallback((exerciseId: string) => {
    setState(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => {
        if (ex.exerciseId !== exerciseId) return ex;
        return { ...ex, isCollapsed: !ex.isCollapsed };
      }),
    }));
  }, []);

  const toggleExerciseHistory = useCallback((exerciseId: string) => {
    setState(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => {
        if (ex.exerciseId !== exerciseId) return ex;
        return { ...ex, showHistory: !ex.showHistory };
      }),
    }));
  }, []);

  const startWorkout = useCallback(() => {
    setState(prev => ({ ...prev, isActive: true }));
  }, []);

  const endWorkout = useCallback(async (): Promise<boolean> => {
    if (!user) return false;

    // Validations per spec
    if (state.exercises.length === 0) {
      toast('Add at least one exercise', 'error');
      return false;
    }

    if (!state.date) {
      toast('Please set a workout date', 'error');
      return false;
    }

    // Check at least one set with weight or reps per spec
    let hasValidSet = false;
    state.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (isSetValid({ weight: set.weight, reps: set.reps })) {
          hasValidSet = true;
        }
      });
    });

    if (!hasValidSet) {
      toast('Add at least one set with weight or reps', 'error');
      return false;
    }

    try {
      // Build workout data - only sets with weight OR reps (per spec)
      const exercises: { [exerciseId: string]: WorkoutExercise } = {};
      
      state.exercises.forEach((ex) => {
        const sets: { [key: string]: any } = {};
        let setNumber = 1;
        
        ex.sets.forEach((set) => {
          if (isSetValid({ weight: set.weight, reps: set.reps })) {
            const setKey = `set${setNumber}`;
            sets[setKey] = {
              weight: set.weight,
              reps: set.reps,
              remarks: set.remarks,
            };
            setNumber++;
          }
        });
        
        if (Object.keys(sets).length > 0) {
          exercises[ex.exerciseId] = {
            name: ex.name,
            category: ex.category,
            sets,
          };
        }
      });

      const workoutData = {
        name: state.name,
        date: state.date,
        bodyWeight: state.bodyWeight ? parseFloat(state.bodyWeight) : null,
        exercises,
      };

      // Save workout
      await saveWorkout(user.uid, workoutData, state.editingWorkoutId || undefined);

      // Increment usage count for each exercise (per spec)
      for (const exerciseId of Object.keys(exercises)) {
        await incrementExerciseUsageCount(user.uid, exerciseId);
      }

      // Remove saved entry if exists (per spec)
      const entryId = savedEntryIdRef.current || state.editingSavedEntryId;
      if (entryId) {
        await deleteSavedEntry(user.uid, entryId);
      }

      toast('Workout saved!', 'success');

      // Reset state
      setState(initialState);
      savedEntryIdRef.current = null;

      return true;
    } catch (err) {
      console.error('Failed to save workout:', err);
      toast('Failed to save workout', 'error');
      return false;
    }
  }, [user, state]);

  const saveCurrentEntry = useCallback(async () => {
    await autoSaveEntry();
  }, [autoSaveEntry]);

  const loadSavedEntriesList = useCallback(async () => {
    if (!user) return;

    setLoadingSavedEntries(true);
    try {
      const entries = await getSavedEntries(user.uid);
      setSavedEntries(entries);
    } catch (err) {
      console.error('Failed to load saved entries:', err);
    } finally {
      setLoadingSavedEntries(false);
    }
  }, [user]);

  const loadSavedEntry = useCallback((entry: Workout) => {
    // Convert Firebase data to editor state
    const exercises: WorkoutEditorExercise[] = Object.entries(entry.exercises || {}).map(
      ([exerciseId, data]) => {
        const sets: WorkoutEditorSet[] = Object.entries(data.sets || {})
          .sort(([a], [b]) => {
            const numA = parseInt(a.replace('set', ''), 10);
            const numB = parseInt(b.replace('set', ''), 10);
            return numA - numB;
          })
          .map(([_, setData]) => ({
            id: generateId(),
            weight: String(setData.weight || ''),
            reps: String(setData.reps || ''),
            remarks: setData.remarks || '',
            isSaved: !!(setData.weight || setData.reps),
          }));

        // Ensure at least one set
        if (sets.length === 0) {
          sets.push({
            id: generateId(),
            weight: '',
            reps: '',
            remarks: '',
            isSaved: false,
          });
        }

        return {
          exerciseId,
          name: data.name,
          category: data.category,
          sets,
          isCollapsed: false,
          showHistory: false,
        };
      }
    );

    setState({
      name: entry.name || '',
      date: entry.date || formatDateYMD(),
      bodyWeight: entry.bodyWeight ? String(entry.bodyWeight) : '',
      exercises,
      isActive: false,
      editingWorkoutId: null,
      editingSavedEntryId: entry.id || null,
    });

    savedEntryIdRef.current = entry.id || null;
  }, []);

  const loadWorkoutForEdit = useCallback((workout: Workout) => {
    // Similar to loadSavedEntry but for workout editing
    const exercises: WorkoutEditorExercise[] = Object.entries(workout.exercises || {}).map(
      ([exerciseId, data]) => {
        const sets: WorkoutEditorSet[] = Object.entries(data.sets || {})
          .sort(([a], [b]) => {
            const numA = parseInt(a.replace('set', ''), 10);
            const numB = parseInt(b.replace('set', ''), 10);
            return numA - numB;
          })
          .map(([_, setData]) => ({
            id: generateId(),
            weight: String(setData.weight || ''),
            reps: String(setData.reps || ''),
            remarks: setData.remarks || '',
            isSaved: !!(setData.weight || setData.reps),
          }));

        if (sets.length === 0) {
          sets.push({
            id: generateId(),
            weight: '',
            reps: '',
            remarks: '',
            isSaved: false,
          });
        }

        return {
          exerciseId,
          name: data.name,
          category: data.category,
          sets,
          isCollapsed: false,
          showHistory: false,
        };
      }
    );

    setState({
      name: workout.name || '',
      date: workout.date || formatDateYMD(),
      bodyWeight: workout.bodyWeight ? String(workout.bodyWeight) : '',
      exercises,
      isActive: false,
      editingWorkoutId: workout.id || null,
      editingSavedEntryId: null,
    });

    savedEntryIdRef.current = null;
  }, []);

  const resetWorkout = useCallback(() => {
    setState(initialState);
    savedEntryIdRef.current = null;
  }, []);

  return {
    state,
    setWorkoutName,
    setWorkoutDate,
    setBodyWeight,
    addExercise,
    removeExercise,
    addSet,
    updateSet,
    saveSet,
    deleteSet,
    toggleExerciseCollapse,
    toggleExerciseHistory,
    startWorkout,
    endWorkout,
    saveCurrentEntry,
    loadSavedEntry,
    loadWorkoutForEdit,
    resetWorkout,
    savedEntries,
    loadingSavedEntries,
    loadSavedEntriesList,
  };
}
