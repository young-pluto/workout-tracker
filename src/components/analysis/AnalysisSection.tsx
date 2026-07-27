import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type TooltipItem,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Skeleton } from '../ui';
import { useAnalysis } from '../../hooks';
import { useTheme } from '../../contexts/ThemeContext';
import { muscleGroupColor } from '../../lib/utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function AnalysisSection() {
  const { resolvedTheme } = useTheme();
  const { loading, summary, refresh } = useAnalysis();

  const isDark = resolvedTheme === 'dark';
  const textColor = isDark ? '#a1a1aa' : '#71717a';
  const gridColor = isDark ? '#27272a' : '#e4e4e7';

  const stats = summary?.stats ?? [];
  const labels = stats.map((s) => s.muscleGroup);
  const colors = stats.map((s) => muscleGroupColor(s.muscleGroup));

  const barOptions = (unit: string, stepSize?: number) => ({
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark ? '#27272a' : '#ffffff',
        titleColor: isDark ? '#fafafa' : '#09090b',
        bodyColor: isDark ? '#a1a1aa' : '#71717a',
        borderColor: isDark ? '#3f3f46' : '#e4e4e7',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => `${ctx.parsed.x ?? 0}${unit}`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: gridColor },
        ticks: { color: textColor, precision: 0 as const, stepSize },
      },
      y: {
        grid: { display: false },
        ticks: { color: textColor },
      },
    },
  });

  const volumeData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Sets',
          data: stats.map((s) => s.sets),
          backgroundColor: colors.map((c) => `${c}cc`),
          borderColor: colors,
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    }),
    [summary, isDark]
  );

  const frequencyData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: 'Days',
          data: stats.map((s) => s.frequency),
          backgroundColor: colors.map((c) => `${c}cc`),
          borderColor: colors,
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    }),
    [summary, isDark]
  );

  const tiles = summary
    ? [
        { label: 'Workouts', value: summary.workouts },
        { label: 'Days trained', value: summary.daysTrained },
        { label: 'Total sets', value: summary.totalSets },
        { label: 'Muscle groups', value: summary.muscleGroupsHit },
      ]
    : [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
            Analysis
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
            Last 7 days by muscle group
          </p>
        </div>
        <button
          onClick={() => refresh()}
          className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] dark:text-[var(--color-dark-text-muted)] dark:hover:text-[var(--color-dark-text-primary)] dark:hover:bg-[var(--color-dark-surface-secondary)] transition-colors"
          title="Refresh"
          aria-label="Refresh analysis"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-2 pb-20 space-y-6">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-56 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        ) : !summary || stats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              className="w-12 h-12 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            <p className="text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
              No sets logged in the last 7 days
            </p>
            <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] mt-1">
              Log a workout — and tag exercises with a muscle group — to see your breakdown here
            </p>
          </div>
        ) : (
          <>
            {/* Summary tiles */}
            <div className="grid grid-cols-4 gap-2">
              {tiles.map((t) => (
                <div
                  key={t.label}
                  className="p-3 rounded-2xl bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)] text-center"
                >
                  <div className="text-2xl font-bold tabular-nums text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
                    {t.value}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide font-medium text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] mt-0.5">
                    {t.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Volume chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)]"
            >
              <h3 className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] mb-4">
                Volume — Sets per muscle group
              </h3>
              <div style={{ height: `${Math.max(160, stats.length * 40)}px` }}>
                <Bar data={volumeData} options={barOptions(' sets')} />
              </div>
            </motion.div>

            {/* Frequency chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-2xl bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)]"
            >
              <h3 className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] mb-4">
                Frequency — Days trained per muscle group
              </h3>
              <div style={{ height: `${Math.max(160, stats.length * 40)}px` }}>
                <Bar data={frequencyData} options={barOptions(' days', 1)} />
              </div>
            </motion.div>

            {/* Per-group cards */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map((s) => (
                <div
                  key={s.muscleGroup}
                  className="p-4 rounded-2xl bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)]"
                  style={{ borderLeft: `4px solid ${muscleGroupColor(s.muscleGroup)}` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: muscleGroupColor(s.muscleGroup) }}
                    />
                    <span className="font-semibold text-sm text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] truncate">
                      {s.muscleGroup}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <div className="text-xl font-bold tabular-nums text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
                        {s.sets}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide font-medium text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
                        set{s.sets === 1 ? '' : 's'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xl font-bold tabular-nums text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
                        {s.frequency}
                      </div>
                      <div className="text-[10px] uppercase tracking-wide font-medium text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
                        day{s.frequency === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
