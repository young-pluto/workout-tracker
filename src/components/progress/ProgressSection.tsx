import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { Skeleton } from '../ui';
import { useExerciseProgress } from '../../hooks';
import { useTheme } from '../../contexts/ThemeContext';
import { formatDateDisplay } from '../../lib/utils';
import type { Exercise } from '../../types';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ProgressSectionProps {
  exercise: Exercise | null;
  onBack: () => void;
}

export function ProgressSection({ exercise, onBack }: ProgressSectionProps) {
  const { resolvedTheme } = useTheme();
  const { loading, progressData, historyEntries } = useExerciseProgress(exercise?.id || null);

  const isDark = resolvedTheme === 'dark';
  const textColor = isDark ? '#a1a1aa' : '#71717a';
  const gridColor = isDark ? '#27272a' : '#e4e4e7';
  const accentColor = isDark ? '#e4e4e7' : '#3f3f46';

  const commonOptions = useMemo(
    () => ({
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
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, maxTicksLimit: 6 },
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor },
        },
      },
    }),
    [isDark, textColor, gridColor]
  );

  // Weight progression chart data
  const weightChartData = useMemo(
    () => ({
      labels: progressData.map((d) => d.date),
      datasets: [
        {
          label: 'Max Weight (kg)',
          data: progressData.map((d) => d.maxWeight),
          borderColor: accentColor,
          backgroundColor: `${accentColor}20`,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    }),
    [progressData, accentColor]
  );

  // Volume chart data
  const volumeChartData = useMemo(
    () => ({
      labels: progressData.map((d) => d.date),
      datasets: [
        {
          label: 'Total Volume',
          data: progressData.map((d) => d.totalVolume),
          backgroundColor: `${accentColor}80`,
          borderRadius: 6,
        },
      ],
    }),
    [progressData, accentColor]
  );

  // Body weight ratio chart data (per spec: only shows where body weight was recorded)
  const ratioData = progressData.filter((d) => d.bodyWeightRatio !== null);
  const ratioChartData = useMemo(
    () => ({
      labels: ratioData.map((d) => d.date),
      datasets: [
        {
          label: 'Weight / Body Weight',
          data: ratioData.map((d) => d.bodyWeightRatio),
          borderColor: '#6366f1',
          backgroundColor: '#6366f120',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    }),
    [ratioData]
  );

  if (!exercise) {
    return (
      <div className="flex items-center justify-center h-full text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
        No exercise selected
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] dark:text-[var(--color-dark-text-muted)] dark:hover:text-[var(--color-dark-text-primary)] dark:hover:bg-[var(--color-dark-surface-secondary)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
              {exercise.name}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
              Progress over time
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-2 pb-20 space-y-6">
        {loading ? (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : progressData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <svg
              className="w-12 h-12 text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
            </svg>
            <p className="text-[var(--color-text-secondary)] dark:text-[var(--color-dark-text-secondary)]">
              No data for this exercise yet
            </p>
            <p className="text-sm text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)] mt-1">
              Complete a workout with this exercise to see progress
            </p>
          </div>
        ) : (
          <>
            {/* Weight Progression Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)]"
            >
              <h3 className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] mb-4">
                Weight Progression
              </h3>
              <div className="h-48">
                <Line data={weightChartData} options={commonOptions} />
              </div>
            </motion.div>

            {/* Volume Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-2xl bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)]"
            >
              <h3 className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] mb-4">
                Volume (Weight × Reps)
              </h3>
              <div className="h-48">
                <Bar data={volumeChartData} options={commonOptions} />
              </div>
            </motion.div>

            {/* Body Weight Ratio Chart (only if data exists) */}
            {ratioData.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-2xl bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)]"
              >
                <h3 className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] mb-4">
                  Strength to Body Weight Ratio
                </h3>
                <div className="h-48">
                  <Line data={ratioChartData} options={commonOptions} />
                </div>
              </motion.div>
            )}

            {/* History Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-2xl bg-[var(--color-surface)] dark:bg-[var(--color-dark-surface)] border border-[var(--color-border)] dark:border-[var(--color-dark-border)]"
            >
              <h3 className="font-semibold text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)] mb-4">
                Detailed History
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
                      <th className="pb-3 pr-4 font-medium">Date</th>
                      <th className="pb-3 pr-4 font-medium">Body Wt</th>
                      <th className="pb-3 font-medium">Sets</th>
                    </tr>
                  </thead>
                  <tbody className="text-[var(--color-text-primary)] dark:text-[var(--color-dark-text-primary)]">
                    {historyEntries.slice(0, 20).map((entry, i) => (
                      <tr key={i} className="border-t border-[var(--color-border)] dark:border-[var(--color-dark-border)]">
                        <td className="py-3 pr-4 whitespace-nowrap">
                          {formatDateDisplay(entry.date)}
                        </td>
                        <td className="py-3 pr-4 whitespace-nowrap text-[var(--color-text-muted)] dark:text-[var(--color-dark-text-muted)]">
                          {entry.bodyWeight ? `${entry.bodyWeight}kg` : '-'}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {entry.sets.map((set, j) => (
                              <span
                                key={j}
                                className="px-2 py-0.5 rounded bg-[var(--color-surface-secondary)] dark:bg-[var(--color-dark-surface-secondary)] text-xs"
                              >
                                {set.weight}×{set.reps}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
