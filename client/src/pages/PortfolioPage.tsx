import React, { useState } from 'react';
import { RefreshCw, Info } from 'lucide-react';
import { useHoldings, usePrices, usePortfolioInsights } from '../hooks/usePortfolio.js';
import AllocationEditor from '../components/portfolio/AllocationEditor.js';
import AllocationPieChart from '../components/portfolio/AllocationPieChart.js';
import AssetCard from '../components/portfolio/AssetCard.js';

export default function PortfolioPage(): React.ReactElement {
  const { data: holdings, loading: holdingsLoading, refetch: refetchHoldings } = useHoldings();
  const { data: pricesData, loading: pricesLoading, refetch: refetchPrices } = usePrices(holdings.length > 0);
  const { data: insights } = usePortfolioInsights();
  const [showEditor, setShowEditor] = useState(false);

  const hasHoldings = holdings.length > 0;
  const prices = pricesData?.prices ?? [];
  const priceMap = Object.fromEntries(prices.map(p => [p.symbol, p]));
  const assetMap = insights?.assets ?? {};

  function handleSaved() {
    setShowEditor(false);
    refetchHoldings();
    setTimeout(() => refetchPrices(), 500);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-screen-2xl mx-auto px-6 py-5">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Portfolio</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Personal allocation tracker · Prices via Yahoo Finance · Run /investment-analysis to refresh recommendations
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { refetchPrices(); }}
              disabled={pricesLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              <RefreshCw size={12} className={pricesLoading ? 'animate-spin' : ''} />
              Refresh prices
            </button>
            <button
              onClick={() => setShowEditor(e => !e)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              {showEditor ? 'Hide editor' : 'Edit holdings'}
            </button>
          </div>
        </div>

        {/* Empty state */}
        {!holdingsLoading && !hasHoldings && !showEditor && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📊</div>
            <h2 className="text-base font-semibold text-gray-700 mb-1">No holdings yet</h2>
            <p className="text-sm text-gray-400 mb-4">Add your assets to get personalized recommendations.</p>
            <button
              onClick={() => setShowEditor(true)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add holdings
            </button>
          </div>
        )}

        {/* Editor */}
        {showEditor && (
          <div className="mb-6">
            <AllocationEditor holdings={holdings} onSaved={handleSaved} />
          </div>
        )}

        {hasHoldings && (
          <>
            {/* Overall portfolio strategy banner */}
            {insights?.overall && (
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-xl p-5 mb-5">
                <div className="flex items-start gap-3">
                  <Info size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-indigo-700 mb-1 uppercase tracking-wide">Portfolio Strategy</div>
                    <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">{insights.overall.content}</div>
                    <div className="text-[10px] text-gray-400 mt-2">
                      Updated {new Date(insights.overall.generatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Two-column top: pie chart + allocation table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

              {/* Pie chart */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Allocation</h3>
                <AllocationPieChart holdings={holdings} />
              </div>

              {/* Allocation summary table */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-semibold text-gray-800 mb-4">Holdings Overview</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-100">
                        <th className="text-left pb-2 font-medium">Symbol</th>
                        <th className="text-left pb-2 font-medium">Name</th>
                        <th className="text-right pb-2 font-medium">Price</th>
                        <th className="text-right pb-2 font-medium">1D</th>
                        <th className="text-right pb-2 font-medium">1M</th>
                        <th className="text-right pb-2 font-medium">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map(h => {
                        const p = priceMap[h.symbol];
                        const pct = (v: number | null) => v === null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`;
                        const fmt = (v: number | null) => v === null ? '—' : v >= 1000 ? `$${v.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : `$${v?.toFixed(2)}`;
                        return (
                          <tr key={h.symbol} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="py-2 font-mono font-semibold text-gray-900">{h.symbol}</td>
                            <td className="py-2 text-gray-500 max-w-[120px] truncate">{h.name}</td>
                            <td className="py-2 text-right font-medium text-gray-800">
                              {pricesLoading ? <span className="text-gray-200">···</span> : fmt(p?.latestClose ?? null)}
                            </td>
                            <td className={`py-2 text-right ${(p?.change1d ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {pct(p?.change1d ?? null)}
                            </td>
                            <td className={`py-2 text-right ${(p?.change1m ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {pct(p?.change1m ?? null)}
                            </td>
                            <td className="py-2 text-right font-semibold text-indigo-600">{h.allocation.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {pricesData?.errors && pricesData.errors.length > 0 && (
                  <div className="mt-3 text-[10px] text-amber-500">
                    Price fetch errors: {pricesData.errors.join(', ')}
                  </div>
                )}
              </div>
            </div>

            {/* Asset cards grid */}
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Individual Analysis & Recommendations</h3>
            {pricesLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
                {holdings.map((_, i) => (
                  <div key={i} className="h-48 bg-white rounded-xl border border-gray-100 animate-pulse" />
                ))}
              </div>
            )}
            {!pricesLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {holdings.map(h => (
                  <AssetCard
                    key={h.symbol}
                    holding={h}
                    price={priceMap[h.symbol]}
                    insight={assetMap[h.symbol]}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
