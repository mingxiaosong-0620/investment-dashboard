import React from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import type { PortfolioHolding, AssetPrice, PortfolioAssetInsight } from '../../types/indicators.js';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  holding: PortfolioHolding;
  price?: AssetPrice;
  insight?: PortfolioAssetInsight;
}

const ACTION_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  BUY:      { bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
  ACCUMULATE: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  HOLD:     { bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200' },
  REDUCE:   { bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200' },
  SELL:     { bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200' },
  REBALANCE:{ bg: 'bg-purple-50',   text: 'text-purple-700',  border: 'border-purple-200' },
};

function extractAction(content: string): string {
  const upper = content.toUpperCase();
  for (const action of ['SELL', 'REDUCE', 'REBALANCE', 'ACCUMULATE', 'BUY', 'HOLD']) {
    if (upper.includes(action)) return action;
  }
  return 'HOLD';
}

export default function AssetCard({ holding, price, insight }: Props): React.ReactElement {
  const action = insight ? extractAction(insight.content) : null;
  const actionStyle = action ? ACTION_STYLES[action] ?? ACTION_STYLES.HOLD : null;
  const change1d = price?.change1d ?? null;
  const change1m = price?.change1m ?? null;
  const latestClose = price?.latestClose ?? null;
  const history = price?.history ?? [];

  const chartData = history.slice(-30).map(h => ({ date: h.date, v: h.close }));
  const lineColor = (change1m ?? 0) >= 0 ? '#10b981' : '#ef4444';

  const fmt = (v: number) => v >= 1000 ? `$${v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${v.toFixed(2)}`;
  const pct = (v: number | null) => v === null ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Header row */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-gray-900">{holding.symbol}</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 uppercase">{holding.assetType}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[160px]">{holding.name}</div>
        </div>
        {actionStyle && action && (
          <span className={`text-[11px] font-bold px-2 py-1 rounded-lg border ${actionStyle.bg} ${actionStyle.text} ${actionStyle.border}`}>
            {action}
          </span>
        )}
      </div>

      {/* Price + sparkline */}
      <div className="flex items-end justify-between mb-3">
        <div>
          <div className="text-xl font-bold text-gray-900">
            {latestClose !== null ? fmt(latestClose) : <span className="text-gray-300 text-sm">Loading…</span>}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs flex items-center gap-0.5 ${(change1d ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {(change1d ?? 0) >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {pct(change1d)} 1d
            </span>
            <span className={`text-xs flex items-center gap-0.5 ${(change1m ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {(change1m ?? 0) >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {pct(change1m)} 1m
            </span>
          </div>
        </div>
        <div className="w-28 h-12">
          {chartData.length > 2 && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <Line type="monotone" dataKey="v" stroke={lineColor} strokeWidth={1.5} dot={false} />
                <Tooltip
                  contentStyle={{ fontSize: 11, padding: '4px 8px', border: '1px solid #e5e7eb', borderRadius: 6 }}
                  formatter={(v: number) => [fmt(v), '']}
                  labelFormatter={(l) => l}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Allocation badge */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400">Portfolio weight</span>
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{holding.allocation.toFixed(1)}%</span>
      </div>

      {/* AI insight */}
      {insight ? (
        <div className="text-[11px] text-gray-600 leading-relaxed border-t border-gray-50 pt-3 line-clamp-4">
          {insight.content}
        </div>
      ) : (
        <div className="text-[11px] text-gray-300 border-t border-gray-50 pt-3 italic">
          No analysis yet — run /investment-analysis to generate recommendations.
        </div>
      )}
    </div>
  );
}
