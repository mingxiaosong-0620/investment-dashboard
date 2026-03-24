import React, { useState } from 'react';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import clsx from 'clsx';
import type { IndicatorSummary } from '../../types/indicators.js';
import StatusBadge from '../ui/StatusBadge.js';
import Sparkline from './Sparkline.js';
import InfoModal from '../ui/InfoModal.js';

const STATUS_COLOR: Record<string, string> = {
  good: '#22c55e', warning: '#f59e0b', danger: '#ef4444', unknown: '#9ca3af',
};

interface Props {
  indicator: IndicatorSummary;
  onExpand: (seriesId: string) => void;
  insight?: string;
}

export default function IndicatorCard({ indicator, onExpand, insight }: Props): React.ReactElement {
  const [showInfo, setShowInfo] = useState(false);
  const [showInsight, setShowInsight] = useState(false);

  const formatValue = (v: number | null): string => {
    if (v === null) return '—';
    if (indicator.format === 'basis_points') return `${v.toFixed(0)}bps`;
    if (indicator.format === 'percent') return `${v.toFixed(2)}%`;
    if (indicator.unit === 'K') return `${(v / 1000).toFixed(0)}K`;
    return v.toFixed(2);
  };

  const DeltaIcon = indicator.delta === null ? Minus : indicator.delta > 0 ? TrendingUp : TrendingDown;
  const deltaColor = indicator.delta === null ? 'text-gray-400' : indicator.delta > 0 ? 'text-red-500' : 'text-green-500';

  return (
    <>
      <div
        className={clsx(
          'bg-white rounded-xl border p-3 cursor-pointer hover:shadow-md transition-shadow',
          indicator.status === 'danger' && 'border-red-200',
          indicator.status === 'warning' && 'border-amber-200',
          (indicator.status === 'good' || indicator.status === 'unknown') && 'border-gray-100',
        )}
        onClick={() => onExpand(indicator.seriesId)}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-1.5">
          <p className="text-xs font-medium text-gray-500 leading-tight flex-1 pr-1">{indicator.name}</p>
          <button
            className="text-gray-300 hover:text-indigo-400 transition flex-shrink-0"
            onClick={e => { e.stopPropagation(); setShowInfo(true); }}
          >
            <Info size={13} />
          </button>
        </div>

        {/* Value + delta */}
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-xl font-bold text-gray-900">{formatValue(indicator.latestValue)}</span>
          {indicator.delta !== null && (
            <span className={clsx('flex items-center text-xs font-medium', deltaColor)}>
              <DeltaIcon size={11} className="mr-0.5" />
              {Math.abs(indicator.delta).toFixed(2)}
            </span>
          )}
        </div>

        <StatusBadge status={indicator.status} />

        {/* Sparkline */}
        <div className="mt-2 -mx-0.5">
          <Sparkline data={indicator.history} color={STATUS_COLOR[indicator.status]} />
        </div>

        {/* Insight toggle */}
        {insight && (
          <button
            className="mt-1.5 text-xs text-indigo-400 hover:text-indigo-600 transition"
            onClick={e => { e.stopPropagation(); setShowInsight(s => !s); }}
          >
            {showInsight ? '▲ hide' : '▼ analysis'}
          </button>
        )}
        {insight && showInsight && (
          <p className="mt-1 text-xs text-gray-500 leading-relaxed italic border-t border-gray-50 pt-1.5">
            {insight}
          </p>
        )}
      </div>

      {showInfo && (
        <InfoModal
          indicator={indicator}
          onClose={() => setShowInfo(false)}
          onExpand={() => { setShowInfo(false); onExpand(indicator.seriesId); }}
        />
      )}
    </>
  );
}
