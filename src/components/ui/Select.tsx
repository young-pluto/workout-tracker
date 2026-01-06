import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              `w-full px-4 py-3 text-base appearance-none
              bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)]
              border border-[var(--color-border)] dark:border-[var(--color-dark-border)]
              rounded-xl
              text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] dark:focus:ring-[var(--color-dark-accent)]
              focus:border-transparent
              disabled:opacity-50 disabled:cursor-not-allowed
              cursor-pointer`,
              error && 'border-[var(--color-error)] focus:ring-[var(--color-error)]',
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg
              className="w-5 h-5 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        {error && (
          <p className="text-sm text-[var(--color-error)]">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
