import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, Button } from '../ui';
import type { Exercise } from '../../types';
import { categoryConfig } from '../../lib/utils';

interface ExerciseSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: Exercise[];
  selectedExerciseIds: string[];
  onSelect: (exercise: Exercise) => void;
}

export function ExerciseSelector({
  isOpen,
  onClose,
  exercises,
  selectedExerciseIds,
  onSelect,
}: ExerciseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredExercises = useMemo(() => {
    return exercises.filter((e) => {
      const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || e.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [exercises, searchQuery, selectedCategory]);

  const handleSelect = (exercise: Exercise) => {
    if (!selectedExerciseIds.includes(exercise.id)) {
      onSelect(exercise);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add Exercise"
      className="max-w-lg"
    >
      <div className="space-y-4">
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
            autoFocus
            className="w-full pl-10 pr-4 py-3 text-base bg-[var(--color-surface-secondary)] dark:bg-[var(--color-dark-surface-secondary)] border border-transparent rounded-xl text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] placeholder:text-[var(--color-text-muted)] dark:placeholder:text-[var(--color-dark-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] dark:focus:ring-[var(--color-dark-accent)]"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap">
          {['all', 'strength', 'cardio', 'flexibility', 'other'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                selectedCategory === cat
                  ? 'bg-[var(--color-accent)] text-white dark:bg-[var(--color-dark-accent)] dark:text-[var(--color-dark-background)]'
                  : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] dark:bg-[var(--color-dark-surface-secondary)] dark:text-[var(--color-dark-text-secondary)] hover:bg-[var(--color-border)] dark:hover:bg-[var(--color-dark-border)]'
              }`}
            >
              {cat === 'all' ? 'All' : categoryConfig[cat as keyof typeof categoryConfig]?.label || cat}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        <div className="max-h-[40vh] overflow-y-auto space-y-2">
          {filteredExercises.length === 0 ? (
            <p className="text-center py-8 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
              {searchQuery ? `No exercises matching "${searchQuery}"` : 'No exercises in this category'}
            </p>
          ) : (
            <AnimatePresence>
              {filteredExercises.map((exercise) => {
                const isSelected = selectedExerciseIds.includes(exercise.id);
                const category = categoryConfig[exercise.category as keyof typeof categoryConfig] || categoryConfig.other;
                
                return (
                  <motion.button
                    key={exercise.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => handleSelect(exercise)}
                    disabled={isSelected}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                      isSelected
                        ? 'opacity-50 cursor-not-allowed bg-[var(--color-surface-secondary)] dark:bg-[var(--color-dark-surface-secondary)]'
                        : 'hover:bg-[var(--color-surface-secondary)] dark:hover:bg-[var(--color-dark-surface-secondary)]'
                    }`}
                  >
                    <div
                      className="w-1 h-8 rounded-full shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] truncate">
                        {exercise.name}
                      </p>
                      <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
                        {category.label}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="text-xs text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
                        Added
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        <Button variant="secondary" fullWidth onClick={onClose}>
          Done
        </Button>
      </div>
    </Dialog>
  );
}
