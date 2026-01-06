import { motion } from 'framer-motion';
import type { AppSection } from '../../types';
import { cn } from '../../lib/utils';

interface BottomNavProps {
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
}

const navItems: Array<{
  id: AppSection;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}> = [
  {
    id: 'exercises',
    label: 'Exercises',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 0 : 1.5}
          d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
        />
      </svg>
    ),
  },
  {
    id: 'workout',
    label: 'Workout',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 0 : 1.5}
          d="M12 4.5v15m7.5-7.5h-15"
        />
        {active && (
          <circle cx="12" cy="12" r="10" fill="currentColor" />
        )}
        {active && (
          <path d="M12 7v10M7 12h10" stroke="white" strokeWidth="2" strokeLinecap="round" />
        )}
        {!active && (
          <circle cx="12" cy="12" r="9" strokeWidth="1.5" fill="none" />
        )}
      </svg>
    ),
  },
  {
    id: 'history',
    label: 'History',
    icon: (active) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={active ? 0 : 1.5}
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

export function BottomNav({ activeSection, onSectionChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface)]/80 dark:bg-[var(--color-dark-surface)]/80 backdrop-blur-xl border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)] pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'relative flex flex-col items-center justify-center w-full h-full px-4 transition-colors',
                isActive
                  ? 'text-[var(--color-accent)] dark:text-[var(--color-dark-accent)]'
                  : 'text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute inset-x-4 top-0 h-0.5 bg-[var(--color-accent)] dark:bg-[var(--color-dark-accent)] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                {item.icon(isActive)}
              </motion.div>
              <span className="mt-1 text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
