import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'ref'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-xl
    transition-colors duration-200
    focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    active:scale-[0.98]
  `;

  const variants = {
    primary: `
      bg-[var(--color-accent)] text-white
      hover:bg-[var(--color-accent-hover)]
      focus-visible:ring-[var(--color-accent)]
      dark:bg-[var(--color-dark-accent)] dark:text-[var(--color-dark-background)]
      dark:hover:bg-[var(--color-dark-accent-hover)]
    `,
    secondary: `
      bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)]
      hover:bg-[var(--color-border)]
      border border-[var(--color-border)]
      focus-visible:ring-[var(--color-accent)]
      dark:bg-[var(--color-dark-surface-secondary)] dark:text-[var(--color-dark-text-primary)]
      dark:border-[var(--color-dark-border)]
      dark:hover:bg-[var(--color-dark-border)]
    `,
    ghost: `
      bg-transparent text-[var(--color-text-secondary)]
      hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]
      focus-visible:ring-[var(--color-accent)]
      dark:text-[var(--color-dark-text-secondary)]
      dark:hover:bg-[var(--color-dark-surface-secondary)] dark:hover:text-[var(--color-dark-text-primary)]
    `,
    danger: `
      bg-[var(--color-error)] text-white
      hover:bg-red-600
      focus-visible:ring-[var(--color-error)]
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm min-h-[32px]',
    md: 'px-4 py-2.5 text-sm min-h-[44px]', // 44px for touch targets
    lg: 'px-6 py-3 text-base min-h-[52px]',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
