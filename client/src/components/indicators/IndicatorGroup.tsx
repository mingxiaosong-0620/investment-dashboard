import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { IndicatorSummary } from '../../types/indicators.js';
import IndicatorCard from './IndicatorCard.js';

interface Props {
  category: string;
  indicators: IndicatorSummary[];
  onExpand: (seriesId: string) => void;
  insights?: Record<string, { content: string; generatedAt: string }>;
  defaultOpen?: boolean;
}

export default function IndicatorGroup({ category, indicators, onExpand, insights = {}, defaultOpen = true }: Props): React.ReactElement {
  const [open, setOpen] = useState(defaultOpen);
  const dangerCount = indicators.filter(i => i.status === 'danger').length;
  const warningCount = indicators.filter(i => i.status === 'warning').length;

  return (
    <section id={category.replace(/[\s&]+/g, '-').toLowerCase()} className="mb-4">
      <button
        className="flex items-center gap-2 w-full text-left mb-2 group"
        onClick={() => setOpen(o => !o)}
      >
        {open ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
        <h2 className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition">{category}</h2>
        <div className="flex gap-1 ml-1">
          {dangerCount > 0 && (
            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">{dangerCount} alert</span>
          )}
          {warningCount > 0 && (
            <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">{warningCount} watch</span>
          )}
        </div>
      </button>

      {open && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5">
          {indicators.map(ind => (
            <IndicatorCard
              key={ind.seriesId}
              indicator={ind}
              onExpand={onExpand}
              insight={insights[ind.seriesId]?.content}
            />
          ))}
        </div>
      )}
    </section>
  );
}
