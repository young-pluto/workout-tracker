import { useState, useEffect } from 'react';
import { Dialog, Button, Input, Select } from '../ui';
import type { Exercise, ExerciseCategory } from '../../types';
import { addExercise, updateExercise } from '../../lib/db';
import { useAuth } from '../../contexts/AuthContext';

const categoryOptions = [
  { value: 'strength', label: 'Strength' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'flexibility', label: 'Flexibility' },
  { value: 'other', label: 'Other' },
];

interface ExerciseFormProps {
  isOpen: boolean;
  onClose: () => void;
  exercise?: Exercise | null; // null for add, Exercise for edit
}

export function ExerciseForm({ isOpen, onClose, exercise }: ExerciseFormProps) {
  const { user } = useAuth();
  const isEditing = !!exercise;

  const [name, setName] = useState('');
  const [category, setCategory] = useState<ExerciseCategory>('strength');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or exercise changes
  useEffect(() => {
    if (isOpen) {
      if (exercise) {
        setName(exercise.name);
        setCategory(exercise.category);
        setDescription(exercise.description || '');
      } else {
        setName('');
        setCategory('strength');
        setDescription('');
      }
      setError(null);
    }
  }, [isOpen, exercise]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: name required (per spec)
    if (!name.trim()) {
      setError('Exercise name is required');
      return;
    }

    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      if (isEditing && exercise) {
        await updateExercise(user.uid, exercise.id, {
          name: name.trim(),
          category,
          description: description.trim(),
        });
      } else {
        await addExercise(
          user.uid,
          name.trim(),
          category,
          description.trim()
        );
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save exercise');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Exercise' : 'Add Exercise'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-[var(--color-error-muted)] text-[var(--color-error)] text-sm">
            {error}
          </div>
        )}

        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Bench Press"
          required
          autoFocus
        />

        <Select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as ExerciseCategory)}
          options={categoryOptions}
        />

        <Input
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Any notes about this exercise..."
        />

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            className="flex-1"
          >
            {isEditing ? 'Save Changes' : 'Add Exercise'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
