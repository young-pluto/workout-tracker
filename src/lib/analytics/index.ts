import type { Exercise, Workout } from '../../types';
import { localToday } from './core';
import { buildDataset, type Dataset } from './dataset';
import { analyzeBodyweight, type BodyweightAnalysis } from './bodyweight';
import { analyzeVolume, type VolumeAnalysis } from './volume';
import { analyzeLifts, type LiftSummary } from './strength';
import { analyzeProgress, type ProgressAnalysis } from './progress';
import { analyzeLongevity, type LongevityAnalysis } from './longevity';
import { analyzeConsistency, type ConsistencyAnalysis } from './consistency';
import { buildSignals, type Signal } from './signals';

export interface Analytics {
  dataset: Dataset;
  bodyweight: BodyweightAnalysis;
  volume: VolumeAnalysis;
  lifts: LiftSummary[];
  progress: ProgressAnalysis;
  longevity: LongevityAnalysis;
  consistency: ConsistencyAnalysis;
  signals: Signal[];
}

/** Every analysis module, computed from raw workouts and the current exercise list. */
export function computeAnalytics(workouts: Workout[], exercises: Exercise[], today: number = localToday()): Analytics {
  const dataset = buildDataset(workouts, exercises, today);
  const bodyweight = analyzeBodyweight(dataset);
  const volume = analyzeVolume(dataset);
  const lifts = analyzeLifts(dataset);
  const progress = analyzeProgress(dataset, lifts, volume, bodyweight.phaseByWeek);
  const longevity = analyzeLongevity(dataset, lifts);
  const consistency = analyzeConsistency(dataset, volume.weekTotals);
  const signals = buildSignals(dataset, lifts, volume, progress, longevity);
  return { dataset, bodyweight, volume, lifts, progress, longevity, consistency, signals };
}

export type { Dataset } from './dataset';
export type { BodyweightAnalysis, Phase, PhaseSegment } from './bodyweight';
export type { VolumeAnalysis, MuscleLandmarkRow, SessionCeilingRow, WeekTotal } from './volume';
export type { LiftSummary, LiftStatus, LiftPoint, Note } from './strength';
export type { ProgressAnalysis, DosePoint, PersonalLandmarks, MuscleEfficiency } from './progress';
export type { LongevityAnalysis, LifespanRow, LifespanState, WearPart } from './longevity';
export type { ConsistencyAnalysis } from './consistency';
export type { Signal, SignalLevel, Lens, AnalysisTab } from './signals';
