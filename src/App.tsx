import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/auth';
import { ExercisesSection } from './components/exercises';
import { WorkoutSection } from './components/workout';
import { HistorySection } from './components/history';
import { ProgressSection } from './components/progress';
import { BottomNav } from './components/ui/BottomNav';
import { ToastContainer, Skeleton } from './components/ui';
import type { AppSection, Exercise } from './types';

function App() {
  const { user, loading: authLoading } = useAuth();
  
  const [activeSection, setActiveSection] = useState<AppSection>('exercises');
  const [viewingExercise, setViewingExercise] = useState<Exercise | null>(null);

  // Handle viewing exercise progress
  const handleViewProgress = (exercise: Exercise) => {
    setViewingExercise(exercise);
  };

  // Handle back from progress
  const handleBackFromProgress = () => {
    setViewingExercise(null);
  };

  // Handle editing workout from history
  const handleEditWorkout = () => {
    setActiveSection('workout');
  };

  // Handle section change
  const handleSectionChange = (section: AppSection) => {
    setActiveSection(section);
    setViewingExercise(null);
  };

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-background)] dark:bg-[var(--color-dark-background)]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--color-surface-secondary)] dark:bg-[var(--color-dark-surface-secondary)] animate-pulse" />
          <Skeleton variant="text" className="w-32 h-4 mx-auto" />
        </div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--color-background)] dark:bg-[var(--color-dark-background)]">

      {/* Main content area */}
      <main className="flex-1 pb-16">
        <AnimatePresence mode="wait">
          {viewingExercise ? (
            <motion.div
              key="progress"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <ProgressSection
                exercise={viewingExercise}
                onBack={handleBackFromProgress}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeSection === 'exercises' && (
                <ExercisesSection onViewProgress={handleViewProgress} />
              )}
              {activeSection === 'workout' && (
                <WorkoutSection onViewProgress={() => {
                  // Workout section progress view could be enhanced later
                }} />
              )}
              {activeSection === 'history' && (
                <HistorySection onEditWorkout={handleEditWorkout} />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom navigation */}
      <BottomNav
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}

export default App;
