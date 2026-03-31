import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PortfolioHolding } from '../../types/indicators.js';

const TYPE_COLORS: Record<string, string> = {
  stock:     '#6366f1',
  etf:       '#0ea5e9',
  bond:      '#10b981',
  crypto:    '#f59e0b',
  commodity: '#ef4444',
  reit:      '#8b5cf6',
  cash:      '#94a3b8',
  other:     '#64748b',
};

interface Props {
  holdings: PortfolioHolding[];
  targetAllocations?: Record<string, number>;
}

export default function AllocationPieChart({ holdings, targetAllocations }: Props): React.ReactElement {
  const data = holdings.map(h => ({
    name: h.symbol,
    value: h.allocation,
    color: TYPE_COLORS[h.assetType] ?? TYPE_COLORS.other,
    type: h.assetType,
  }));

  const targetData = targetAllocations
    ? holdings.map(h => ({
        name: h.symbol,
        value: targetAllocations[h.symbol] ?? h.allocation,
        color: TYPE_COLORS[h.assetType] ?? TYPE_COLORS.other,
      }))
    : null;

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-xs">
        <div className="font-semibold text-gray-900">{payload[0].name}</div>
        <div className="text-gray-500">{payload[0].value.toFixed(1)}%</div>
      </div>
    );
  };

  return (
    <div className="flex gap-4">
      <div className="flex-1">
        <p className="text-xs font-semibold text-gray-500 text-center mb-1">Current</p>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={46} paddingAngle={2}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              formatter={(value) => <span className="text-xs text-gray-700">{value}</span>}
              iconSize={8}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {targetData && (
        <div className="flex-1">
          <p className="text-xs font-semibold text-indigo-500 text-center mb-1">Target</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={targetData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={46} paddingAngle={2}>
                {targetData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} stroke="white" strokeWidth={2} opacity={0.7} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                formatter={(value) => <span className="text-xs text-gray-700">{value}</span>}
                iconSize={8}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
