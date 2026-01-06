import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseForm } from './ExerciseForm';
import { ConfirmDialog, ExerciseCardSkeleton, Button } from '../ui';
import { useExercises } from '../../hooks/useExercises';
import { useAuth } from '../../contexts/AuthContext';
import { deleteExercise } from '../../lib/db';
import type { Exercise } from '../../types';

interface ExercisesSectionProps {
  onViewProgress: (exercise: Exercise) => void;
}

export function ExercisesSection({ onViewProgress }: ExercisesSectionProps) {
  const { user } = useAuth();
  const { exercises, loading } = useExercises();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Exercise | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = exercises.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setIsFormOpen(true);
  };

  const handleDelete = async (exercise: Exercise) => {
    if (!user) return;
    try {
      await deleteExercise(user.uid, exercise.id);
    } catch (err) {
      console.error('Failed to delete exercise:', err);
    }
    setDeleteConfirm(null);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingExercise(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
              Exercises
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
              {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} in your library
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} size="sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises..."
            className="w-full pl-10 pr-4 py-3 text-base bg-[var(--color-surface-secondary)] dark:bg-[var(--color-dark-surface-secondary)] border border-transparent rounded-xl text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] placeholder:text-[var(--color-text-muted)] dark:placeholder:text-[var(--color-dark-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] dark:focus:ring-[var(--color-dark-accent)] transition-colors"
          />
        </div>
      </div>

      {/* Exercise List */}
      <div className="flex-1 overflow-y-auto px-4 py-2 pb-20">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <ExerciseCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {searchQuery ? (
              <>
                <svg className="w-12 h-12 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <p className="text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
                  No exercises matching "{searchQuery}"
                </p>
              </>
            ) : (
              <>
                <svg className="w-12 h-12 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <p className="text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)] mb-3">
                  No exercises yet
                </p>
                <Button onClick={() => setIsFormOpen(true)} variant="secondary" size="sm">
                  Add your first exercise
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredExercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onEdit={handleEdit}
                  onDelete={() => setDeleteConfirm(exercise)}
                  onViewProgress={onViewProgress}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Exercise Form Dialog */}
      <ExerciseForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        exercise={editingExercise}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        onCancel={() => setDeleteConfirm(null)}
        title="Delete Exercise"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
