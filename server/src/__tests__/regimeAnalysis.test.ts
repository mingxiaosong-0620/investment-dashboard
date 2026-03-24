import { describe, it, expect } from 'vitest';
import { computeStatus, evaluateSahmRule, evaluateYieldCurveStreak, classifyRegime } from '../services/regimeAnalysis.js';
import { INDICATOR_MAP } from '../config/indicators.js';

describe('computeStatus', () => {
  const yieldCurve = INDICATOR_MAP.get('T10Y2Y')!;

  it('returns danger when yield curve is inverted', () => {
    expect(computeStatus(-0.5, yieldCurve.thresholds)).toBe('danger');
  });
  it('returns warning when yield curve is flat', () => {
    expect(computeStatus(0.2, yieldCurve.thresholds)).toBe('warning');
  });
  it('returns good when yield curve is normal', () => {
    expect(computeStatus(1.5, yieldCurve.thresholds)).toBe('good');
  });
  it('returns unknown for null', () => {
    expect(computeStatus(null, yieldCurve.thresholds)).toBe('unknown');
  });
});

describe('evaluateSahmRule', () => {
  const makeReadings = (values: number[]) =>
    values.map((v, i) => ({ date: `2024-${String(i + 1).padStart(2, '0')}-01`, value: v }));

  it('returns danger when 3-month avg is 0.5%+ above 12-month min', () => {
    // 10 months at 3.5%, then 3 months at 4.1% → avg 4.1, min 3.5, diff 0.6 → danger
    const readings = makeReadings([3.5,3.5,3.5,3.5,3.5,3.5,3.5,3.5,3.5,3.5,4.1,4.1,4.1]);
    expect(evaluateSahmRule(readings)).toBe('danger');
  });

  it('returns good when unemployment is stable', () => {
    const readings = makeReadings(Array(13).fill(3.8));
    expect(evaluateSahmRule(readings)).toBe('good');
  });

  it('returns unknown when fewer than 13 readings', () => {
    expect(evaluateSahmRule([])).toBe('unknown');
    expect(evaluateSahmRule(makeReadings([3.5, 3.6]))).toBe('unknown');
  });
});

describe('evaluateYieldCurveStreak', () => {
  it('returns danger when 5 most recent are all negative', () => {
    const rows = [-0.5,-0.4,-0.3,-0.2,-0.1].map((v, i) => ({ date: `2024-01-0${i+1}`, value: v }));
    expect(evaluateYieldCurveStreak(rows)).toBe('danger');
  });
  it('returns warning when some are negative', () => {
    const rows = [0.5, 0.2, -0.1, -0.2, 0.1].map((v, i) => ({ date: `2024-01-0${i+1}`, value: v }));
    expect(evaluateYieldCurveStreak(rows)).toBe('warning');
  });
  it('returns good when all positive', () => {
    const rows = [1.0, 0.8, 0.9, 1.1, 1.2].map((v, i) => ({ date: `2024-01-0${i+1}`, value: v }));
    expect(evaluateYieldCurveStreak(rows)).toBe('good');
  });
  it('returns unknown for empty array', () => {
    expect(evaluateYieldCurveStreak([])).toBe('unknown');
  });
});

describe('classifyRegime', () => {
  it('classifies Goldilocks: growing + low inflation', () => {
    const signals = new Map([['NAPM', 54], ['CPILFESL', 2.0], ['T10Y2Y', 1.0], ['BAMLH0A0HYM2', 250]]);
    expect(classifyRegime(signals)).toBe('Goldilocks');
  });
  it('classifies Stagflation: contracting + high inflation', () => {
    const signals = new Map([['NAPM', 47], ['CPILFESL', 4.0], ['T10Y2Y', -0.5], ['BAMLH0A0HYM2', 600]]);
    expect(classifyRegime(signals)).toBe('Stagflation');
  });
  it('classifies Inflationary Growth: growing + high inflation', () => {
    const signals = new Map([['NAPM', 55], ['CPILFESL', 3.5], ['T10Y2Y', 0.5], ['BAMLH0A0HYM2', 280]]);
    expect(classifyRegime(signals)).toBe('Inflationary Growth');
  });
  it('classifies Risk-Off: contracting + low inflation + stressed credit', () => {
    const signals = new Map([['NAPM', 46], ['CPILFESL', 1.5], ['T10Y2Y', -0.3], ['BAMLH0A0HYM2', 550]]);
    expect(classifyRegime(signals)).toBe('Risk-Off');
  });
});
