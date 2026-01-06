import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
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
  const { resolvedTheme, toggleTheme } = useTheme();
  
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
      {/* Theme toggle - fixed top left to avoid timer overlap */}
      <button
        onClick={toggleTheme}
        className="fixed top-4 left-4 z-50 p-2 rounded-xl bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] text-[var(--color-text-muted)] active:text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-muted)] dark:active:text-[var(--color-dark-text-primary)] transition-colors shadow-sm"
        title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {resolvedTheme === 'dark' ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
          </svg>
        )}
      </button>

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
