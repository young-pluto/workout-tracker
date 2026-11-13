import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Skeleton } from '../ui';
import { useAnalytics } from '../../hooks/useAnalytics';
import type { AnalysisTab } from '../../lib/analytics';
import { formatMonth } from '../../lib/analytics/core';
import { cn } from '../../lib/utils';
import { Segmented } from './ui';
import { ink, ink2, muted } from './styles';
import { OverviewTab } from './OverviewTab';
import { VolumeTab } from './VolumeTab';
import { LiftsTab } from './LiftsTab';
import { LongevityTab } from './LongevityTab';

const TABS: Array<{ value: AnalysisTab; label: string }> = [
  { value: 'overview', label: 'Overview' },
  { value: 'volume', label: 'Volume' },
  { value: 'lifts', label: 'Lifts' },
  { value: 'longevity', label: 'Longevity' },
];

/**
 * Longitudinal training analysis built on Helms, Israetel, Henselmans,
 * Nuñez and Alberts: every workout ever logged, read as a
 * stimulus-to-fatigue ledger.
 */
export function AnalysisSection() {
  const { analytics: a, loading, refreshing, error, refresh } = useAnalytics();
  const [tab, setTab] = useState<AnalysisTab>('overview');

  const navigate = (next: AnalysisTab) => {
    setTab(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const subtitle = a
    ? a.dataset.workouts.length > 0
      ? `${formatMonth(a.dataset.firstDay)} – today · ${a.dataset.workouts.length} sessions`
      : 'No workouts yet'
    : ' ';

  return (
    <div className="pb-24">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="min-w-0">
          <h1 className={cn('text-xl font-bold', ink)}>Analysis</h1>
          <p className={cn('text-sm truncate', ink2)}>{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className={cn(
            'w-10 h-10 -mr-1 flex items-center justify-center rounded-xl transition-colors',
            muted,
            'active:bg-[var(--color-surface-secondary)] dark:active:bg-[var(--color-dark-surface-secondary)]'
          )}
          aria-label="Refresh analysis"
        >
          <svg className={cn('w-5 h-5', refreshing && 'animate-spin')} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      <div className="sticky top-0 z-20 px-4 py-2 bg-[var(--color-background)]/90 dark:bg-[var(--color-dark-background)]/90 backdrop-blur-md">
        <Segmented layoutId="analysis-tab" value={tab} onChange={navigate} options={TABS} />
      </div>

      <div className={cn('px-4 pt-2 transition-opacity duration-200', refreshing && 'opacity-60')}>
        {error && !a ? (
          <div className="py-16 text-center">
            <p className={ink2}>{error}</p>
            <button type="button" onClick={refresh} className={cn('mt-3 font-medium underline underline-offset-4', ink)}>
              <span className="text-sm">Try again</span>
            </button>
          </div>
        ) : loading || !a ? (
          <div className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : a.dataset.workouts.length === 0 ? (
          <div className="py-16 text-center">
            <p className={ink2}>Nothing to analyse yet</p>
            <p className={cn('text-sm mt-1', muted)}>Log a few workouts and the analysis builds itself.</p>
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            >
              {tab === 'overview' && <OverviewTab a={a} onNavigate={navigate} />}
              {tab === 'volume' && <VolumeTab a={a} />}
              {tab === 'lifts' && <LiftsTab a={a} />}
              {tab === 'longevity' && <LongevityTab a={a} />}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
