import React, { useState } from 'react';
import { useIndicators } from '../hooks/useIndicators.js';
import { useRegime } from '../hooks/useRegime.js';
import { useInsights } from '../hooks/useIndicators.js';
import MacroRegimeCard from '../components/analysis/MacroRegimeCard.js';
import StrategyPanel from '../components/analysis/StrategyPanel.js';
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
  const { data: insights, loading: insightsLoading } = useInsights();
  const [expandedSeries, setExpandedSeries] = useState<string | null>(null);

  const grouped = CATEGORY_ORDER.map(cat => ({
    category: cat,
    indicators: indicators.filter(i => i.category === cat),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-screen-2xl mx-auto px-6 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Macro Dashboard</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {' · '}Data: FRED API · Refreshes 6am UTC
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-gray-400">Live</span>
          </div>
        </div>

        {/* Regime banner */}
        <MacroRegimeCard regime={regime} loading={regLoading} />

        {/* Strategy analysis */}
        <StrategyPanel insights={insights} loading={insightsLoading} />

        {/* Indicator groups */}
        {indLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2.5">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="h-32 bg-white rounded-xl border animate-pulse" />
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
                insights={insights?.indicators}
                defaultOpen={true}
              />
            ) : null
          )
        )}
      </main>

      {expandedSeries && (
        <IndicatorChart
          seriesId={expandedSeries}
          onClose={() => setExpandedSeries(null)}
        />
      )}
    </div>
  );
}
