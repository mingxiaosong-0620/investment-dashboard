import React from 'react';
import { X } from 'lucide-react';
import type { IndicatorSummary } from '../../types/indicators.js';
import StatusBadge from './StatusBadge.js';

interface Props {
  indicator: IndicatorSummary;
  onClose: () => void;
  onExpand: () => void;
}

export default function InfoModal({ indicator, onClose, onExpand }: Props): React.ReactElement {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{indicator.name}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{indicator.category}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <StatusBadge status={indicator.status} />

        <p className="mt-4 text-sm text-gray-700 leading-relaxed">{indicator.educationalText}</p>

        <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
          <p className="text-xs font-medium text-indigo-700 mb-1">Historical Context</p>
          <p className="text-xs text-indigo-600 leading-relaxed">{indicator.historicalContext}</p>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          {indicator.thresholds.good.map((t, i) => (
            <div key={i} className="bg-green-50 rounded p-2">
              <span className="text-green-600 font-medium block">🟢 Good</span>
              <span className="text-green-700">{t.label}</span>
            </div>
          ))}
          {indicator.thresholds.warning.map((t, i) => (
            <div key={i} className="bg-amber-50 rounded p-2">
              <span className="text-amber-600 font-medium block">🟡 Watch</span>
              <span className="text-amber-700">{t.label}</span>
            </div>
          ))}
          {indicator.thresholds.danger.map((t, i) => (
            <div key={i} className="bg-red-50 rounded p-2">
              <span className="text-red-600 font-medium block">🔴 Danger</span>
              <span className="text-red-700">{t.label}</span>
            </div>
          ))}
        </div>

        <button
          onClick={onExpand}
          className="mt-5 w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          View Full Chart →
        </button>
      </div>
    </div>
  );
}
