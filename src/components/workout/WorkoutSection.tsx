import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkoutExerciseCard } from './WorkoutExerciseCard';
import { ExerciseSelector } from './ExerciseSelector';
import { TimerDisplay } from './TimerDisplay';
import { SavedEntriesDialog } from './SavedEntriesDialog';
import { Button, ConfirmDialog, Input } from '../ui';
import { useWorkout, useTimer, useExercises } from '../../hooks';
import type { Workout } from '../../types';

interface WorkoutSectionProps {
  onViewProgress: (exerciseId: string) => void;
}

export function WorkoutSection({ onViewProgress: _onViewProgress }: WorkoutSectionProps) {
  const { exercises } = useExercises();
  const workout = useWorkout();
  const timer = useTimer();
  
  const [isExerciseSelectorOpen, setIsExerciseSelectorOpen] = useState(false);
  const [showSavedEntriesDialog, setShowSavedEntriesDialog] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
        setShowActionMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // On first mount, load saved entries (per spec: initNewWorkout shows saved entries dialog)
  useEffect(() => {
    if (!initialized) {
      workout.loadSavedEntriesList().then(() => {
        setInitialized(true);
      });
    }
  }, [initialized, workout]);

  // Show saved entries dialog after loading (separate effect to handle state update)
  useEffect(() => {
    if (initialized && !workout.loadingSavedEntries && workout.savedEntries.length > 0) {
      setShowSavedEntriesDialog(true);
    }
  }, [initialized, workout.loadingSavedEntries, workout.savedEntries.length]);

  const handleStartWorkout = () => {
    if (workout.state.exercises.length === 0) {
      setIsExerciseSelectorOpen(true);
      return;
    }
    workout.startWorkout();
    timer.start();
    setShowActionMenu(false);
  };

  const handleEndWorkout = async () => {
    const success = await workout.endWorkout();
    if (success) {
      timer.reset();
    }
    setShowEndConfirm(false);
  };

  const handleSaveEntry = () => {
    workout.saveCurrentEntry();
    setShowActionMenu(false);
  };

  const handleSelectSavedEntry = (entry: Workout) => {
    workout.loadSavedEntry(entry);
    setShowSavedEntriesDialog(false);
  };

  const handleCreateNew = () => {
    workout.resetWorkout();
    setShowSavedEntriesDialog(false);
  };

  const selectedExerciseIds = workout.state.exercises.map((e) => e.exerciseId);

  return (
    <div className="flex flex-col h-full">
      {/* Header with action menu */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
            {workout.state.editingWorkoutId ? 'Edit Workout' : 'New Workout'}
          </h1>
          
          {/* Action menu dropdown */}
          <div className="relative" ref={actionMenuRef}>
            <button
              onClick={() => setShowActionMenu(!showActionMenu)}
              className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] dark:text-[var(--color-dark-text-muted)] dark:hover:text-[var(--color-dark-text-primary)] dark:hover:bg-[var(--color-dark-surface-secondary)] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>
            </button>
            
            <AnimatePresence>
              {showActionMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 rounded-xl bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] shadow-lg z-50 overflow-hidden"
                >
                  {!workout.state.isActive ? (
                    <>
                      <button
                        onClick={handleStartWorkout}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] hover:bg-[var(--color-surface-secondary)] dark:hover:bg-[var(--color-dark-surface-secondary)] flex items-center gap-3"
                      >
                        <svg className="w-4 h-4 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                        </svg>
                        Start Workout
                      </button>
                      <button
                        onClick={handleSaveEntry}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] hover:bg-[var(--color-surface-secondary)] dark:hover:bg-[var(--color-dark-surface-secondary)] flex items-center gap-3"
                      >
                        <svg className="w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                        </svg>
                        Save for Later
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleEndWorkout}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] hover:bg-[var(--color-surface-secondary)] dark:hover:bg-[var(--color-dark-surface-secondary)] flex items-center gap-3"
                      >
                        <svg className="w-4 h-4 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Save Workout
                      </button>
                      <button
                        onClick={() => { setShowEndConfirm(true); setShowActionMenu(false); }}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error-muted)] flex items-center gap-3"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
                        </svg>
                        Discard Workout
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-2 pb-20 space-y-4">
        {/* Timer (shown when active) */}
        <AnimatePresence>
          {workout.state.isActive && (
            <TimerDisplay
              formattedTime={timer.formattedTime}
              isRunning={timer.isRunning}
              onToggle={timer.toggle}
              onReset={timer.reset}
            />
          )}
        </AnimatePresence>

        {/* Workout details */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={workout.state.date}
            onChange={(e) => workout.setWorkoutDate(e.target.value)}
          />
          <Input
            label="Body Weight (kg)"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={workout.state.bodyWeight}
            onChange={(e) => workout.setBodyWeight(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <Input
          label="Workout Name"
          value={workout.state.name}
          onChange={(e) => workout.setWorkoutName(e.target.value)}
          placeholder="Optional (e.g., Push Day)"
        />

        {/* Exercises */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
              Exercises
            </h2>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setIsExerciseSelectorOpen(true)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </Button>
          </div>

          {workout.state.exercises.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <svg
                className="w-12 h-12 mx-auto text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              <p className="text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)] mb-3">
                No exercises added yet
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsExerciseSelectorOpen(true)}
              >
                Add your first exercise
              </Button>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              {workout.state.exercises.map((exercise) => (
                <WorkoutExerciseCard
                  key={exercise.exerciseId}
                  exercise={exercise}
                  onToggleCollapse={() => workout.toggleExerciseCollapse(exercise.exerciseId)}
                  onToggleHistory={() => workout.toggleExerciseHistory(exercise.exerciseId)}
                  onRemove={() => workout.removeExercise(exercise.exerciseId)}
                  onAddSet={() => workout.addSet(exercise.exerciseId)}
                  onUpdateSet={(setId, data) => workout.updateSet(exercise.exerciseId, setId, data)}
                  onSaveSet={(setId) => workout.saveSet(exercise.exerciseId, setId)}
                  onDeleteSet={(setId) => workout.deleteSet(exercise.exerciseId, setId)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Exercise Selector Dialog */}
      <ExerciseSelector
        isOpen={isExerciseSelectorOpen}
        onClose={() => setIsExerciseSelectorOpen(false)}
        exercises={exercises}
        selectedExerciseIds={selectedExerciseIds}
        onSelect={(exercise) => workout.addExercise(exercise)}
      />

      {/* Saved Entries Dialog */}
      <SavedEntriesDialog
        isOpen={showSavedEntriesDialog}
        onClose={() => setShowSavedEntriesDialog(false)}
        entries={workout.savedEntries}
        loading={workout.loadingSavedEntries}
        onSelectEntry={handleSelectSavedEntry}
        onCreateNew={handleCreateNew}
      />

      {/* End Workout Confirmation */}
      <ConfirmDialog
        isOpen={showEndConfirm}
        onConfirm={handleEndWorkout}
        onCancel={() => setShowEndConfirm(false)}
        title="End Workout"
        message="Do you want to save this workout to your history?"
        confirmText="Yes, Save"
        cancelText="Cancel"
      />
    </div>
  );
}
