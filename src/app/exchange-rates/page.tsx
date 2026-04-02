'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface Rate {
  currency_code: string;
  currency_name: string;
  rate_to_aud: number;
  effective_date: string | null;
  period_start: string | null;
  period_end: string | null;
  source: string;
}

export default function ExchangeRatesPage() {
  const [rates, setRates] = useState<Rate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [source, setSource] = useState<string>('');

  useEffect(() => {
    fetch('/api/tariff/exchange-rates')
      .then((r) => r.json())
      .then((data) => {
        setRates(data.rates || []);
        setSource(data.source || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!filter) return rates;
    const q = filter.toLowerCase();
    return rates.filter(
      (r) =>
        r.currency_code.toLowerCase().includes(q) ||
        r.currency_name.toLowerCase().includes(q)
    );
  }, [rates, filter]);

  const effectiveDate = rates[0]?.effective_date || null;
  const periodInfo = rates[0]?.period_start && rates[0]?.period_end
    ? `${rates[0].period_start} to ${rates[0].period_end}`
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navy header */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Exchange Rates</h1>
              <p className="text-blue-200 text-sm mt-1">
                ABF foreign exchange rates for customs valuation
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/calculator"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
              >
                Calculator
              </Link>
              <Link
                href="/search"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
              >
                Back to Search
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Info bar */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6 flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by currency code or name..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filtered.length} of {rates.length} currencies
          </div>
          {effectiveDate && (
            <div className="text-sm text-gray-500">
              Effective: <span className="font-medium text-gray-700">{effectiveDate}</span>
            </div>
          )}
          {periodInfo && (
            <div className="text-sm text-gray-500">
              Period: <span className="font-medium text-gray-700">{periodInfo}</span>
            </div>
          )}
          {source === 'fallback' && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
              Fallback rates
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700" />
          </div>
        ) : rates.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p>No exchange rates found.</p>
            <p className="text-sm mt-1">Run the exchange rates updater from the admin dashboard.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Code</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Currency</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">Rate to AUD</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-700">1 AUD =</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Effective Date</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Source</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.currency_code} className="border-b border-gray-100 hover:bg-blue-50/50">
                    <td className="px-4 py-2 font-mono font-bold text-blue-700">{r.currency_code}</td>
                    <td className="px-4 py-2 text-gray-700">{r.currency_name}</td>
                    <td className="px-4 py-2 text-right font-mono text-gray-800">
                      {r.rate_to_aud.toFixed(4)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-600">
                      {r.rate_to_aud > 0 ? (1 / r.rate_to_aud).toFixed(4) : '-'}
                    </td>
                    <td className="px-4 py-2 text-gray-500">{r.effective_date || '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        r.source === 'ABF' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {r.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
