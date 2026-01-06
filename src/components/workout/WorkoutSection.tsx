import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { WorkoutExerciseCard } from './WorkoutExerciseCard';
import { ExerciseSelector } from './ExerciseSelector';
import { SavedEntriesDialog } from './SavedEntriesDialog';
import { ConfirmDialog } from '../ui';
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
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // On first mount, load saved entries
  useEffect(() => {
    if (!initialized) {
      workout.loadSavedEntriesList().then(() => setInitialized(true));
    }
  }, [initialized, workout]);

  // Show saved entries dialog after loading
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
  };

  const handleFinishWorkout = async () => {
    const success = await workout.endWorkout();
    if (success) {
      timer.reset();
    }
    setShowEndConfirm(false);
  };

  const handleDiscard = () => {
    workout.resetWorkout();
    timer.reset();
    setShowDiscardConfirm(false);
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
  const isActive = workout.state.isActive;
  const hasExercises = workout.state.exercises.length > 0;

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)] dark:bg-[var(--color-dark-background)]">
      
      {/* ═══════════════════════════════════════════════════════════════
          WORKOUT HEADER - Consolidated state + timer + metadata
          ═══════════════════════════════════════════════════════════════ */}
      <div className="shrink-0 px-4 pt-4 pb-3">
        {isActive ? (
          // Active workout header
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-success)]">
                  Workout in Progress
                </p>
                <h1 className="text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] mt-0.5">
                  {workout.state.name || 'Workout'}
                </h1>
              </div>
              {/* Timer - Large and prominent */}
              <div className="text-right">
                <p className="text-3xl font-mono font-bold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] tabular-nums">
                  {timer.formattedTime}
                </p>
              </div>
            </div>
            
            {/* Session info bar */}
            <div className="flex items-center gap-4 text-[13px] text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
              <span>{workout.state.date}</span>
              {workout.state.bodyWeight && (
                <span>{workout.state.bodyWeight} kg</span>
              )}
              <span>{workout.state.exercises.length} exercise{workout.state.exercises.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
        ) : (
          // Setup header
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
              New Workout
            </h1>
            
            {/* Compact form row */}
            <div className="flex gap-3">
              <input
                type="date"
                value={workout.state.date}
                onChange={(e) => workout.setWorkoutDate(e.target.value)}
                className="flex-1 px-3 py-2.5 text-sm bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-xl text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
              />
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={workout.state.bodyWeight}
                onChange={(e) => workout.setBodyWeight(e.target.value)}
                placeholder="BW kg"
                className="w-24 px-3 py-2.5 text-sm bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-xl text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
              />
            </div>
            
            {/* Workout name - Optional */}
            <input
              type="text"
              value={workout.state.name}
              onChange={(e) => workout.setWorkoutName(e.target.value)}
              placeholder="Workout name (optional)"
              className="w-full px-3 py-2.5 text-sm bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-xl text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
            />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          EXERCISE LOG - Main scrollable content
          ═══════════════════════════════════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto px-4 pb-24">
        {/* Section header with Add Exercise */}
        <div className="flex items-center justify-between py-3 sticky top-0 bg-[var(--color-background)] dark:bg-[var(--color-dark-background)] z-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
            Exercises
          </h2>
          <button
            onClick={() => setIsExerciseSelectorOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] rounded-full active:scale-95 transition-transform"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </button>
        </div>

        {/* Exercise list */}
        {!hasExercises ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)] mb-1">
              No exercises yet
            </p>
            <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
              Tap "Add" to get started
            </p>
          </div>
        ) : (
          <div className="space-y-3">
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
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          FIXED BOTTOM ACTION BAR - Stable, intentional, non-intrusive
          ═══════════════════════════════════════════════════════════════ */}
      <div className="shrink-0 border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)] bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] px-4 py-3 pb-safe">
        {!isActive ? (
          // Pre-workout state
          <div className="flex gap-3">
            <button
              onClick={() => workout.saveCurrentEntry()}
              className="flex-1 py-3 text-[14px] font-medium text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)] bg-[var(--color-surface-secondary)] dark:bg-[var(--color-dark-surface-secondary)] rounded-xl active:scale-[0.98] transition-transform"
            >
              Save Draft
            </button>
            <button
              onClick={handleStartWorkout}
              disabled={!hasExercises}
              className="flex-[2] py-3 text-[14px] font-semibold text-white bg-[var(--color-accent)] dark:bg-[var(--color-dark-accent)] dark:text-[var(--color-dark-background)] rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Workout
            </button>
          </div>
        ) : (
          // Active workout state
          <div className="flex gap-3">
            {/* Pause/Resume - Secondary, subtle */}
            <button
              onClick={() => timer.isRunning ? timer.pause() : timer.start()}
              className="px-4 py-3 text-[14px] font-medium text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)] bg-[var(--color-surface-secondary)] dark:bg-[var(--color-dark-surface-secondary)] rounded-xl active:scale-[0.98] transition-transform"
            >
              {timer.isRunning ? 'Pause' : 'Resume'}
            </button>
            
            {/* Finish Workout - Primary action */}
            <button
              onClick={() => setShowEndConfirm(true)}
              className="flex-1 py-3 text-[14px] font-semibold text-white bg-[var(--color-success)] rounded-xl active:scale-[0.98] transition-transform"
            >
              Finish Workout
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          DIALOGS
          ═══════════════════════════════════════════════════════════════ */}
      
      {/* Exercise Selector */}
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

      {/* Finish Workout Confirmation */}
      <ConfirmDialog
        isOpen={showEndConfirm}
        onConfirm={handleFinishWorkout}
        onCancel={() => setShowEndConfirm(false)}
        title="Finish Workout"
        message="Save this workout to your history?"
        confirmText="Save Workout"
        cancelText="Cancel"
      />

      {/* Discard Confirmation */}
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        onConfirm={handleDiscard}
        onCancel={() => setShowDiscardConfirm(false)}
        title="Discard Workout"
        message="Are you sure? This cannot be undone."
        confirmText="Discard"
        cancelText="Keep Workout"
      />
    </div>
  );
}
