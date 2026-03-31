import React, { useState } from 'react';
import Dashboard from './pages/Dashboard.js';
import PortfolioPage from './pages/PortfolioPage.js';
import { BarChart2, Briefcase } from 'lucide-react';

type Tab = 'macro' | 'portfolio';

export default function App(): React.ReactElement {
  const [tab, setTab] = useState<Tab>('macro');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation bar */}
      <nav className="bg-white border-b border-gray-200 px-6 py-0 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto flex items-center gap-1">
          <button
            onClick={() => setTab('macro')}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
              tab === 'macro'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart2 size={13} />
            Macro Dashboard
          </button>
          <button
            onClick={() => setTab('portfolio')}
            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium border-b-2 transition-colors ${
              tab === 'portfolio'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Briefcase size={13} />
            My Portfolio
          </button>
        </div>
      </nav>

      {/* Page content */}
      {tab === 'macro' && <Dashboard />}
      {tab === 'portfolio' && <PortfolioPage />}
    </div>
  );
}
