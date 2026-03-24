import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { IndicatorSummary } from '../../types/indicators.js';
import IndicatorCard from './IndicatorCard.js';

interface Props {
  category: string;
  indicators: IndicatorSummary[];
  onExpand: (seriesId: string) => void;
  defaultOpen?: boolean;
}

export default function IndicatorGroup({ category, indicators, onExpand, defaultOpen = true }: Props): React.ReactElement {
  const [open, setOpen] = useState(defaultOpen);
  const dangerCount = indicators.filter(i => i.status === 'danger').length;
  const warningCount = indicators.filter(i => i.status === 'warning').length;

  return (
    <section id={category.replace(/[\s&]+/g, '-').toLowerCase()} className="mb-8">
      <button
        className="flex items-center gap-3 w-full text-left mb-4 group"
        onClick={() => setOpen(o => !o)}
      >
        {open ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
        <h2 className="text-base font-semibold text-gray-800 group-hover:text-indigo-600 transition">{category}</h2>
        <div className="flex gap-1 ml-2">
          {dangerCount > 0 && (
            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">{dangerCount} alert</span>
          )}
          {warningCount > 0 && (
            <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">{warningCount} watch</span>
          )}
        </div>
      </button>

      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {indicators.map(ind => (
            <IndicatorCard key={ind.seriesId} indicator={ind} onExpand={onExpand} />
          ))}
        </div>
      )}
    </section>
  );
}
