'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Rule {
  rule_number: string;
  title: string;
  content: string | null;
  updated_at?: string;
}

export default function Schedule2Page() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>('');

  useEffect(() => {
    fetch('/api/tariff/schedule2')
      .then((r) => r.json())
      .then((data) => {
        setRules(data.rules || []);
        setSource(data.source || '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navy header */}
      <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Schedule 2 — Interpretative Rules</h1>
              <p className="text-blue-200 text-sm mt-1">
                General Interpretative Rules for classifying goods under the Customs Tariff
              </p>
            </div>
            <Link
              href="/search"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors"
            >
              Back to Search
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                These 6 General Interpretative Rules (GIRs) govern how goods are classified within
                Schedule 3 of the Customs Tariff Act 1995. They must be applied in order — Rule 1
                first, then Rule 2, and so on — until a classification is determined.
              </p>
              {source === 'fallback' && (
                <p className="text-xs text-amber-600 mt-2">
                  Showing cached rules. Run the Schedule 2 updater to fetch the latest from ABF.
                </p>
              )}
            </div>

            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.rule_number} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  <div className="flex items-start">
                    <div className="bg-blue-900 text-white px-4 py-4 flex flex-col items-center justify-center min-w-[80px]">
                      <span className="text-2xl font-bold">{rule.rule_number}</span>
                      <span className="text-xs text-blue-200 mt-0.5">GIR</span>
                    </div>
                    <div className="p-4 flex-1">
                      <h3 className="text-lg font-semibold text-gray-800">{rule.title}</h3>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed whitespace-pre-line">
                        {rule.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {rules.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <p>No interpretative rules found.</p>
                <p className="text-sm mt-1">Run the Schedule 2 updater from the admin dashboard.</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
