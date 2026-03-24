import type { SnapshotRow } from '../db/queries.js';
import { computeStatus as computeStatusFromConfig, INDICATOR_MAP, type IndicatorStatus } from '../config/indicators.js';
import { getRecentSnapshots } from '../db/queries.js';
import type { Pool } from 'pg';

// Re-export computeStatus so tests can import from this module
export { computeStatusFromConfig as computeStatus };

export type RegimeLabel = 'Goldilocks' | 'Inflationary Growth' | 'Stagflation' | 'Risk-Off';

export function evaluateSahmRule(readings: SnapshotRow[]): IndicatorStatus {
  if (readings.length < 13) return 'unknown';
  const sorted = [...readings].sort((a, b) => a.date.localeCompare(b.date));
  const recent3 = sorted.slice(-3).map(r => r.value);
  const prior12 = sorted.slice(-13, -1).map(r => r.value);
  const avg3 = recent3.reduce((s, v) => s + v, 0) / 3;
  const min12 = Math.min(...prior12);
  const diff = avg3 - min12;
  if (diff >= 0.5) return 'danger';
  if (diff >= 0.3) return 'warning';
  return 'good';
}

export function evaluateYieldCurveStreak(rows: SnapshotRow[]): IndicatorStatus {
  if (rows.length === 0) return 'unknown';
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  const recent5 = sorted.slice(-5).map(r => r.value);
  if (recent5.length >= 5 && recent5.every(v => v < 0)) return 'danger';
  if (sorted.some(r => r.value < 0)) return 'warning';
  return 'good';
}

export function classifyRegime(signals: Map<string, number>): RegimeLabel {
  const pmi = signals.get('NAPM') ?? 50;
  const cpi = signals.get('CPILFESL') ?? 2;
  const spreadsBps = signals.get('BAMLH0A0HYM2') ?? 300;
  const yieldCurve = signals.get('T10Y2Y') ?? 0.5;

  const isGrowing = pmi >= 50;
  const isInflationary = cpi >= 3.0;
  const isStressed = spreadsBps >= 500 || yieldCurve < 0;

  if (!isGrowing && isInflationary) return 'Stagflation';
  if (isStressed && !isGrowing) return 'Risk-Off';
  if (isGrowing && isInflationary) return 'Inflationary Growth';
  return 'Goldilocks';
}

const REGIME_DESCRIPTIONS: Record<RegimeLabel, { description: string; posture: string }> = {
  'Goldilocks':          { description: 'Growth expanding, inflation contained — best environment for equities.', posture: 'Overweight equities, underweight bonds and cash.' },
  'Inflationary Growth': { description: 'Economy growing but inflation is elevated — commodities and cyclicals outperform.', posture: 'Tilt toward commodities, cyclicals, TIPS. Reduce long-duration bonds.' },
  'Stagflation':         { description: 'Growth slowing while inflation remains high — the hardest environment.', posture: 'Hold cash, short-duration bonds, and real assets (gold, energy). Avoid equities.' },
  'Risk-Off':            { description: 'Growth contracting with credit stress — defensive posture warranted.', posture: 'Overweight Treasuries and defensives (utilities, staples). Reduce equity exposure.' },
};

export interface RegimeResult {
  regime: RegimeLabel;
  description: string;
  recommendedPosture: string;
  alerts: { seriesId: string; name: string; status: IndicatorStatus; message: string }[];
  computedAt: string;
}

export async function computeRegime(_pool: Pool): Promise<RegimeResult> {
  const alerts: RegimeResult['alerts'] = [];
  const signals = new Map<string, number>();

  for (const config of INDICATOR_MAP.values()) {
    const rows = await getRecentSnapshots(config.seriesId, 15);
    if (rows.length === 0) continue;

    const latest = rows[0];
    signals.set(config.seriesId, latest.value);

    let status: IndicatorStatus;
    if (config.seriesId === 'UNRATE') {
      const monthlyRows = await getRecentSnapshots('UNRATE', 13);
      status = evaluateSahmRule(monthlyRows);
    } else if (config.seriesId === 'T10Y2Y') {
      status = evaluateYieldCurveStreak(rows.slice(0, 10));
    } else {
      status = computeStatusFromConfig(latest.value, config.thresholds);
    }

    if (status === 'danger' || status === 'warning') {
      const unit = config.unit;
      const formattedValue = unit === 'bps'
        ? `${latest.value.toFixed(0)}bps`
        : unit === '%'
          ? `${latest.value.toFixed(2)}%`
          : latest.value.toFixed(2);
      alerts.push({
        seriesId: config.seriesId,
        name: config.name,
        status,
        message: `${config.name} at ${formattedValue} — ${status}`,
      });
    }
  }

  const regime = classifyRegime(signals);
  const { description, posture } = REGIME_DESCRIPTIONS[regime];

  return {
    regime,
    description,
    recommendedPosture: posture,
    alerts,
    computedAt: new Date().toISOString(),
  };
}
