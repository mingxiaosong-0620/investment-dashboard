import React, { useState } from 'react';
import { Plus, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import type { PortfolioHolding, AssetType } from '../../types/indicators.js';
import { saveHoldings } from '../../hooks/usePortfolio.js';

const ASSET_TYPES: AssetType[] = ['stock', 'etf', 'bond', 'crypto', 'commodity', 'reit', 'cash', 'other'];

interface Props {
  holdings: PortfolioHolding[];
  onSaved: () => void;
}

export default function AllocationEditor({ holdings, onSaved }: Props): React.ReactElement {
  const [rows, setRows] = useState<PortfolioHolding[]>(holdings.length ? holdings : []);
  const [saving, setSaving] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const total = rows.reduce((s, r) => s + (Number(r.allocation) || 0), 0);
  const totalOk = Math.abs(total - 100) < 0.1;

  function addRow() {
    setRows(r => [...r, { symbol: '', name: '', assetType: 'stock', allocation: 0 }]);
  }

  function updateRow(i: number, field: keyof PortfolioHolding, val: string | number) {
    setRows(r => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));
  }

  function removeRow(i: number) {
    setRows(r => r.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    if (!adminKey) { setMsg({ type: 'err', text: 'Enter admin key' }); return; }
    if (!totalOk) { setMsg({ type: 'err', text: `Total is ${total.toFixed(1)}% — must be 100%` }); return; }
    const valid = rows.filter(r => r.symbol.trim() && r.name.trim() && r.allocation > 0);
    setSaving(true);
    setMsg(null);
    try {
      await saveHoldings(valid, adminKey);
      setMsg({ type: 'ok', text: `Saved ${valid.length} holdings` });
      onSaved();
    } catch (e: any) {
      setMsg({ type: 'err', text: e.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Edit Holdings</h3>
        <div className={`text-xs font-semibold px-2 py-1 rounded-full ${totalOk ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {total.toFixed(1)}% / 100%
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-gray-400 border-b border-gray-100">
              <th className="text-left pb-2 font-medium w-20">Symbol</th>
              <th className="text-left pb-2 font-medium">Name</th>
              <th className="text-left pb-2 font-medium w-24">Type</th>
              <th className="text-right pb-2 font-medium w-16">Alloc %</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="py-1.5 pr-2">
                  <input
                    value={row.symbol}
                    onChange={e => updateRow(i, 'symbol', e.target.value.toUpperCase())}
                    placeholder="AAPL"
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs font-mono uppercase focus:outline-none focus:border-indigo-400"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    value={row.name}
                    onChange={e => updateRow(i, 'name', e.target.value)}
                    placeholder="Apple Inc."
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-indigo-400"
                  />
                </td>
                <td className="py-1.5 pr-2">
                  <select
                    value={row.assetType}
                    onChange={e => updateRow(i, 'assetType', e.target.value)}
                    className="w-full border border-gray-200 rounded px-1 py-1 text-xs focus:outline-none focus:border-indigo-400 bg-white"
                  >
                    {ASSET_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </td>
                <td className="py-1.5 pr-2">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={row.allocation}
                    onChange={e => updateRow(i, 'allocation', parseFloat(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:border-indigo-400"
                  />
                </td>
                <td className="py-1.5 text-center">
                  <button onClick={() => removeRow(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={addRow}
        className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 mb-4 transition-colors"
      >
        <Plus size={13} /> Add asset
      </button>

      {/* Save row */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <input
          type="password"
          value={adminKey}
          onChange={e => setAdminKey(e.target.value)}
          placeholder="Admin key"
          className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-400"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Save size={12} /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {msg && (
        <div className={`flex items-center gap-1.5 mt-2 text-xs ${msg.type === 'ok' ? 'text-emerald-600' : 'text-red-500'}`}>
          {msg.type === 'ok' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
          {msg.text}
        </div>
      )}
    </div>
  );
}
