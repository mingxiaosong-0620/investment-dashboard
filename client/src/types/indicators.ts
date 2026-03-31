export type IndicatorStatus = 'good' | 'warning' | 'danger' | 'unknown';

export type IndicatorCategory =
  | 'Monetary Policy'
  | 'Inflation'
  | 'Growth & Activity'
  | 'Labor Market'
  | 'Risk & Sentiment'
  | 'Liquidity & Valuation';

export type RegimeLabel = 'Goldilocks' | 'Inflationary Growth' | 'Stagflation' | 'Risk-Off';

export interface ThresholdRange { min?: number; max?: number; label: string; }

export interface IndicatorSummary {
  seriesId: string;
  name: string;
  category: IndicatorCategory;
  unit: string;
  format: 'percent' | 'basis_points' | 'number' | 'currency';
  description: string;
  educationalText: string;
  historicalContext: string;
  thresholds: { danger: ThresholdRange[]; warning: ThresholdRange[]; good: ThresholdRange[] };
  latestValue: number | null;
  latestDate: string | null;
  previousValue: number | null;
  delta: number | null;
  status: IndicatorStatus;
  history: { date: string; value: number }[];
}

export interface RegimeAlert {
  seriesId: string;
  name: string;
  status: IndicatorStatus;
  message: string;
}

export interface RegimeResponse {
  regime: RegimeLabel;
  description: string;
  recommendedPosture: string;
  alerts: RegimeAlert[];
  computedAt: string;
}

export interface IndicatorInsight {
  content: string;
  generatedAt: string;
}

export interface InsightsResponse {
  overall: { content: string; generated_at: string } | null;
  indicators: Record<string, IndicatorInsight>;
}

// ─── Portfolio types ──────────────────────────────────────────────────────────

export type AssetType = 'stock' | 'etf' | 'bond' | 'crypto' | 'commodity' | 'reit' | 'cash' | 'other';

export interface PortfolioHolding {
  symbol: string;
  name: string;
  assetType: AssetType;
  allocation: number; // percentage 0–100
}

export interface AssetPrice {
  symbol: string;
  latestClose: number | null;
  latestDate: string | null;
  change1d: number | null; // percent
  change1m: number | null; // percent
  history: { date: string; close: number }[];
}

export interface PricesResponse {
  prices: AssetPrice[];
  errors?: string[];
}

export interface PortfolioAssetInsight {
  content: string;
  generatedAt: string;
}

export interface PortfolioInsightsResponse {
  overall: { content: string; generatedAt: string } | null;
  assets: Record<string, PortfolioAssetInsight>;
}
