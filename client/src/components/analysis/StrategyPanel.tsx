import React, { useState } from 'react';
import type { InsightsResponse } from '../../types/indicators.js';

interface Props {
  insights: InsightsResponse | null;
  loading: boolean;
}

export default function StrategyPanel({ insights, loading }: Props): React.ReactElement | null {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
        <div className="h-3 bg-gray-100 rounded w-full mb-2" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
      </div>
    );
  }

  if (!insights?.overall) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-5 mb-6 text-center">
        <p className="text-sm text-gray-400 font-medium">No strategy analysis yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Run <code className="bg-gray-100 px-1 rounded">/investment-analysis</code> locally to generate a strategy and push it to the dashboard.
        </p>
      </div>
    );
  }

  const { content, generated_at } = insights.overall;
  const lines = content.split('\n').filter(Boolean);
  const preview = lines.slice(0, 6).join('\n');
  const hasMore = lines.length > 6;

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    return 'just now';
  };

  return (
    <div className="bg-white rounded-2xl border border-indigo-100 p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <span className="text-base">📊</span> Investment Strategy Analysis
        </h2>
        <span className="text-xs text-gray-400">Last run: {timeAgo(generated_at)}</span>
      </div>
      <pre className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
        {expanded ? content : preview}
      </pre>
      {hasMore && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-2 text-xs text-indigo-500 hover:text-indigo-700 font-medium"
        >
          {expanded ? '▲ Show less' : '▼ Show full analysis'}
        </button>
      )}
    </div>
  );
}
