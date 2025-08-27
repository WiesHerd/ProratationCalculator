import { MarketData, PercentileResult } from '../types/percentile-types';

/**
 * Calculate percentile position using linear interpolation
 */
export function calculatePercentile(currentValue: number, marketData: MarketData): PercentileResult {
  // Apply FTE adjustment to market percentiles
  const userFte = marketData.userFte || 1.0;
  const p25 = marketData.percentiles.p25 * userFte;
  const p50 = marketData.percentiles.p50 * userFte;
  const p75 = marketData.percentiles.p75 * userFte;
  const p90 = marketData.percentiles.p90 * userFte;
  
  let percentile: number;
  let position: PercentileResult['position'];
  let nextPercentile: number | undefined;
  let gapToNext: number | undefined;

  // Determine position and calculate percentile
  if (currentValue < p25) {
    position = 'below_25';
    // Linear interpolation from 0 to 25th percentile
    percentile = (currentValue / p25) * 25;
    nextPercentile = 25;
    gapToNext = p25 - currentValue;
  } else if (currentValue < p50) {
    position = '25_50';
    // Linear interpolation from 25th to 50th percentile
    percentile = 25 + ((currentValue - p25) / (p50 - p25)) * 25;
    nextPercentile = 50;
    gapToNext = p50 - currentValue;
  } else if (currentValue < p75) {
    position = '50_75';
    // Linear interpolation from 50th to 75th percentile
    percentile = 50 + ((currentValue - p50) / (p75 - p50)) * 25;
    nextPercentile = 75;
    gapToNext = p75 - currentValue;
  } else if (currentValue < p90) {
    position = '75_90';
    // Linear interpolation from 75th to 90th percentile
    percentile = 75 + ((currentValue - p75) / (p90 - p75)) * 15;
    nextPercentile = 90;
    gapToNext = p90 - currentValue;
  } else {
    position = 'above_90';
    // Linear extrapolation beyond 90th percentile
    percentile = 90 + ((currentValue - p90) / (p90 - p75)) * 10;
    // Cap at 99th percentile for display purposes
    percentile = Math.min(percentile, 99);
  }

  return {
    currentValue,
    percentile: Math.round(percentile * 10) / 10, // Round to 1 decimal place
    position,
    nextPercentile,
    gapToNext,
    marketData,
  };
}

/**
 * Get position description for display
 */
export function getPositionDescription(position: PercentileResult['position']): string {
  switch (position) {
    case 'below_25':
      return 'Below 25th percentile';
    case '25_50':
      return '25th to 50th percentile';
    case '50_75':
      return '50th to 75th percentile';
    case '75_90':
      return '75th to 90th percentile';
    case 'above_90':
      return 'Above 90th percentile';
    default:
      return 'Unknown position';
  }
}

/**
 * Get color for position indicator
 */
export function getPositionColor(position: PercentileResult['position']): string {
  switch (position) {
    case 'below_25':
      return '#ef4444'; // red
    case '25_50':
      return '#f97316'; // orange
    case '50_75':
      return '#eab308'; // yellow
    case '75_90':
      return '#22c55e'; // green
    case 'above_90':
      return '#3b82f6'; // blue
    default:
      return '#6b7280'; // gray
  }
}

/**
 * Format gap to next percentile
 */
export function formatGapToNext(gapToNext: number | undefined, mode: 'tcc' | 'wrvu'): string {
  if (gapToNext === undefined) return '';
  
  if (mode === 'tcc') {
    return `$${gapToNext.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  } else {
    return `${gapToNext.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} wRVUs`;
  }
}
