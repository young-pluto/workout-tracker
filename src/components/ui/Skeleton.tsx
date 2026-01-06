import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const variantStyles = {
    text: 'rounded-md h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  };

  return (
    <div
      className={cn('skeleton', variantStyles[variant], className)}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

// Common skeleton patterns
export function CardSkeleton() {
  return (
    <div className="p-4 rounded-2xl bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-3/4 h-5" />
          <Skeleton variant="text" className="w-1/2 h-4" />
        </div>
        <Skeleton variant="circular" width={40} height={40} />
      </div>
    </div>
  );
}

export function ExerciseCardSkeleton() {
  return (
    <div className="p-4 rounded-2xl bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
      <div className="flex items-center gap-3">
        <Skeleton variant="rectangular" width={4} height={48} className="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-2/3 h-5" />
          <div className="flex gap-2">
            <Skeleton variant="text" className="w-16 h-4" />
            <Skeleton variant="text" className="w-24 h-4" />
          </div>
        </div>
        <div className="flex gap-1">
          <Skeleton variant="circular" width={36} height={36} />
          <Skeleton variant="circular" width={36} height={36} />
          <Skeleton variant="circular" width={36} height={36} />
        </div>
      </div>
    </div>
  );
}

export function WorkoutHistorySkeleton() {
  return (
    <div className="p-4 rounded-2xl bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="w-1/3 h-5" />
          <Skeleton variant="text" className="w-1/4 h-4" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="text" className="w-20 h-6 rounded-full" />
          <Skeleton variant="text" className="w-20 h-6 rounded-full" />
          <Skeleton variant="text" className="w-20 h-6 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
