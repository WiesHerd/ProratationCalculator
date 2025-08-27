export interface MarketData {
  id: string;
  name: string;
  specialty: string;
  year: number;
  fte: number;
  userFte: number;
  percentiles: {
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  createdAt: number;
  updatedAt: number;
}

export interface PercentileResult {
  currentValue: number;
  percentile: number;
  position: 'below_25' | '25_50' | '50_75' | '75_90' | 'above_90';
  marketData: MarketData;
  gapToNext?: number;
  nextPercentile?: number;
}

export type CalculatorMode = 'tcc' | 'wrvu';
