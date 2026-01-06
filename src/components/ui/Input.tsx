import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            `w-full px-4 py-3 text-base
            bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]
            border border-[var(--color-border)] dark:border-[var(--color-dark-border)]
            rounded-xl
            text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]
            placeholder:text-[var(--color-text-muted)] dark:placeholder:text-[var(--color-dark-text-muted)]
            transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] dark:focus:ring-[var(--color-dark-accent)]
            focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed`,
            error && 'border-[var(--color-error)] focus:ring-[var(--color-error)]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-[var(--color-error)]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
