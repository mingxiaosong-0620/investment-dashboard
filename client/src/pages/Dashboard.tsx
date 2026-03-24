import React, { useState } from 'react';
import { useIndicators } from '../hooks/useIndicators.js';
import { useRegime } from '../hooks/useRegime.js';
import Sidebar from '../components/layout/Sidebar.js';
import MacroRegimeCard from '../components/analysis/MacroRegimeCard.js';
import IndicatorGroup from '../components/indicators/IndicatorGroup.js';
import IndicatorChart from '../components/indicators/IndicatorChart.js';
import type { IndicatorCategory } from '../types/indicators.js';

const CATEGORY_ORDER: IndicatorCategory[] = [
  'Monetary Policy',
  'Inflation',
  'Growth & Activity',
  'Labor Market',
  'Risk & Sentiment',
  'Liquidity & Valuation',
];

export default function Dashboard(): React.ReactElement {
  const { data: indicators, loading: indLoading } = useIndicators();
  const { data: regime, loading: regLoading } = useRegime();
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);

  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    indicators: indicators.filter(i => i.category === cat),
  }));

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Macro Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          {/* Regime banner */}
          <MacroRegimeCard regime={regime} loading={regLoading} />

          {/* Indicator groups */}
          {indLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="h-40 bg-white rounded-2xl border animate-pulse" />
              ))}
            </div>
          ) : (
            grouped.map(({ category, indicators: groupIndicators }) =>
              groupIndicators.length > 0 ? (
                <IndicatorGroup
                  key={category}
                  category={category}
                  indicators={groupIndicators}
                  onExpand={setExpandedSeries}
                  defaultOpen={true}
                />
              ) : null
            )
          )}
        </div>
      </main>

      {/* Expanded chart modal */}
      {expandedSeries && (
        <IndicatorChart
          seriesId={expandedSeries}
          onClose={() => setExpandedSeries(null)}
        />
      )}
    </div>
  );
}
