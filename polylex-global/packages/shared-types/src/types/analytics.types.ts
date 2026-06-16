import type { HeatmapEntry, RetentionRateDto, VelocityEntry } from '../index';

export type AnalyticsHeatmapEntry = HeatmapEntry;
export type AnalyticsVelocityEntry = VelocityEntry;
export type AnalyticsRetentionRate = RetentionRateDto;

export interface HeatmapQueryParams {
  days?: number;
}

export interface VelocityQueryParams {
  weeks?: number;
}