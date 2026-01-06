import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../ui';

type AuthMode = 'login' | 'signup';

export function AuthScreen() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<AuthMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
      // Clear form on success (per spec)
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      // Pass Firebase error messages to user via alert (per spec mentions alert, using UI instead)
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-background)] dark:bg-[var(--color-dark-background)]">
      {/* Logo/Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-hover)] dark:from-[var(--color-dark-accent)] dark:to-[var(--color-dark-accent-hover)] flex items-center justify-center">
          <svg className="w-8 h-8 text-white dark:text-[var(--color-dark-background)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M3 12h18m-9 6h9" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
          WorkoutTracker
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)] mt-1">
          Track your fitness journey
        </p>
      </motion.div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-sm"
      >
        <div className="bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] rounded-2xl border border-[var(--color-border)] dark:border-[var(--color-dark-border)] p-6 shadow-lg">
          {/* Mode Toggle */}
          <div className="flex mb-6 p-1 bg-[var(--color-surface-secondary)] dark:bg-[var(--color-dark-surface-secondary)] rounded-xl">
            {(['login', 'signup'] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`relative flex-1 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  mode === m
                    ? 'text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]'
                    : 'text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]'
                }`}
              >
                {mode === m && (
                  <motion.div
                    layoutId="auth-mode-bg"
                    className="absolute inset-0 bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] rounded-lg shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative">{m === 'login' ? 'Log In' : 'Sign Up'}</span>
              </button>
            ))}
          </div>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-xl bg-[var(--color-error-muted)] text-[var(--color-error)] text-sm"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="name"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Input
                    label="Name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                    autoComplete="name"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />

            <Button type="submit" fullWidth isLoading={isLoading} className="mt-6">
              {mode === 'login' ? 'Log In' : 'Create Account'}
            </Button>
          </form>
        </div>

        {/* Toggle text */}
        <p className="text-center mt-4 text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            onClick={toggleMode}
            className="font-medium text-[var(--color-accent)] dark:text-[var(--color-dark-accent)] hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
