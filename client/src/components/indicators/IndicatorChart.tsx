import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { format, parseISO } from 'date-fns';
import type { IndicatorSummary } from '../../types/indicators.js';
import { useIndicatorDetail } from '../../hooks/useIndicators.js';
import StatusBadge from '../ui/StatusBadge.js';

interface Props {
  seriesId: string;
  onClose: () => void;
}

const TIME_RANGES = [
  { label: '1Y', months: 12 },
  { label: '2Y', months: 24 },
  { label: '5Y', months: 60 },
  { label: '10Y', months: 120 },
];

// Wider modal for longer time horizons
const MODAL_WIDTH: Record<number, string> = {
  12: 'max-w-2xl',
  24: 'max-w-3xl',
  60: 'max-w-4xl',
  120: 'max-w-5xl',
};

export default function IndicatorChart({ seriesId, onClose }: Props): React.ReactElement {
  const [months, setMonths] = useState(60);
  const { data, loading } = useIndicatorDetail(seriesId, months);

  if (loading || !data) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl p-8 text-gray-500">Loading chart...</div>
      </div>
    );
  }

  const chartData = data.history.map(r => ({
    date: r.date,
    value: r.value,
    label: format(parseISO(r.date), months <= 24 ? 'MMM yy' : 'MMM yyyy'),
  }));

  const allValues = data.history.map(r => r.value);
  const minVal = allValues.length > 0 ? Math.min(...allValues) : 0;
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 1;
  const pad = (maxVal - minVal) * 0.12 || 0.5;

  const formatValue = (v: number) => {
    if (data.format === 'basis_points') return `${v.toFixed(0)}bps`;
    if (data.format === 'percent') return `${v.toFixed(2)}%`;
    return v.toFixed(2);
  };

  // Compute x-axis tick interval to avoid crowding (~10 ticks max)
  const xInterval = Math.max(1, Math.floor(chartData.length / 10));

  // Build threshold reference lines (unique boundary values)
  type ThresholdLine = { y: number; label: string; color: string; strokeDash: string; meaning: string };
  const thresholdLines: ThresholdLine[] = [];
  const seen = new Set<number>();

  const addLines = (
    ranges: typeof data.thresholds.good,
    color: string,
    strokeDash: string,
    meaning: string
  ) => {
    for (const r of ranges) {
      if (r.min !== undefined && !seen.has(r.min)) {
        seen.add(r.min);
        thresholdLines.push({ y: r.min, label: r.label, color, strokeDash, meaning });
      }
      if (r.max !== undefined && !seen.has(r.max)) {
        seen.add(r.max);
        thresholdLines.push({ y: r.max, label: r.label, color, strokeDash, meaning });
      }
    }
  };

  addLines(data.thresholds.warning, '#f59e0b', '5 3', `Watch: ${data.thresholds.warning.map(r => r.label).join(', ')}`);
  addLines(data.thresholds.danger, '#ef4444', '4 2', `Alert: ${data.thresholds.danger.map(r => r.label).join(', ')}`);

  const modalWidth = MODAL_WIDTH[months] ?? 'max-w-4xl';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${modalWidth} transition-all duration-200`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start p-5 pb-3 border-b">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{data.name}</h2>
            <p className="text-xs text-gray-500">{data.category}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={data.status} />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
        </div>

        {/* Time range toggle + current value */}
        <div className="flex items-center gap-1 px-5 pt-3">
          {TIME_RANGES.map(r => (
            <button
              key={r.months}
              onClick={() => setMonths(r.months)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                months === r.months ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {r.label}
            </button>
          ))}
          <div className="ml-auto">
            <span className="font-bold text-xl text-gray-900">
              {data.latestValue !== null ? formatValue(data.latestValue) : '—'}
            </span>
            <span className="ml-1.5 text-xs text-gray-400">{data.latestDate}</span>
          </div>
        </div>

        {/* Chart */}
        <div className="px-5 py-3">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                tickLine={false}
                interval={xInterval}
              />
              <YAxis
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                domain={[minVal - pad, maxVal + pad]}
                tickFormatter={formatValue}
                width={60}
              />
              <Tooltip
                formatter={(v: number) => [formatValue(v), data.name]}
                labelStyle={{ fontSize: 10, color: '#64748b' }}
                contentStyle={{ borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11 }}
              />

              {thresholdLines.map((line, i) => (
                <ReferenceLine
                  key={i}
                  y={line.y}
                  stroke={line.color}
                  strokeDasharray={line.strokeDash}
                  strokeWidth={1.5}
                />
              ))}

              {seriesId === 'T10Y2Y' && (
                <ReferenceLine y={0} stroke="#ef4444" strokeWidth={1.5}
                  label={{ value: 'Inversion ▶', fontSize: 9, fill: '#ef4444', position: 'insideTopLeft' }}
                />
              )}

              <Line
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Threshold legend — explains what each line means and when to act */}
        {thresholdLines.length > 0 && (
          <div className="mx-5 mb-3 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Threshold Guide</p>
            <div className="space-y-1">
              {data.thresholds.warning.map((t, i) => (
                <div key={`w${i}`} className="flex items-start gap-2 text-xs">
                  <span className="mt-0.5 flex-shrink-0">
                    <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#f59e0b" strokeWidth="2" strokeDasharray="5,3"/></svg>
                  </span>
                  <span className="text-amber-700">
                    <strong>{t.label}</strong> — When the line crosses here, consider monitoring closely and reducing risk in affected positions.
                  </span>
                </div>
              ))}
              {data.thresholds.danger.map((t, i) => (
                <div key={`d${i}`} className="flex items-start gap-2 text-xs">
                  <span className="mt-0.5 flex-shrink-0">
                    <svg width="16" height="4"><line x1="0" y1="2" x2="16" y2="2" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,2"/></svg>
                  </span>
                  <span className="text-red-700">
                    <strong>{t.label}</strong> — Danger zone. Review portfolio allocation and consider defensive positioning.
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Educational panel */}
        <div className="mx-5 mb-5 p-3 bg-slate-50 rounded-xl">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">About this indicator</p>
          <p className="text-xs text-slate-700 leading-relaxed">{data.educationalText}</p>
          <p className="text-xs text-indigo-600 mt-1.5 font-medium">{data.historicalContext}</p>
        </div>
      </div>
    </div>
  );
}
