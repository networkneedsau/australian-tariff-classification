'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { downloadCsv } from '@/lib/csv-export';

interface BulkResult {
  code: string;
  statistical_code: string | null;
  description: string;
  unit: string | null;
  duty_rate: string | null;
  duty_rate_numeric: number | null;
  is_free: boolean;
  section_number: number;
  section_title: string;
  chapter_number: number;
  chapter_title: string;
  heading_code: string;
  heading_description: string;
}

interface BulkResponse {
  results: BulkResult[];
  notFound: string[];
}

const CSV_COLUMNS = [
  { key: 'code', header: 'HS Code' },
  { key: 'statistical_code', header: 'Stat Code' },
  { key: 'description', header: 'Description' },
  { key: 'unit', header: 'Unit' },
  { key: 'duty_rate', header: 'Duty Rate' },
  { key: 'section_number', header: 'Section' },
  { key: 'section_title', header: 'Section Title' },
  { key: 'chapter_number', header: 'Chapter' },
  { key: 'chapter_title', header: 'Chapter Title' },
];

function parseCodes(text: string): string[] {
  return text
    .split(/[,\n\r]+/)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
}

export default function BulkLookupPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BulkResponse | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    // Parse first column from CSV
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    const codes = lines.map((line) => {
      // Take first column (handle quoted values)
      const match = line.match(/^"?([^",]+)"?/);
      return match ? match[1].trim() : line.split(',')[0].trim();
    });
    // Skip header if first row doesn't look like a code
    const filtered =
      codes.length > 0 && !/^\d/.test(codes[0]) ? codes.slice(1) : codes;
    setInput(filtered.join('\n'));

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit() {
    const codes = parseCodes(input);
    if (codes.length === 0) {
      setError('Please enter at least one HS code.');
      return;
    }
    if (codes.length > 500) {
      setError('Maximum 500 codes per lookup.');
      return;
    }

    setError('');
    setLoading(true);
    setData(null);

    try {
      const res = await fetch('/api/tariff/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Bulk lookup failed');
      }

      const json: BulkResponse = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  }

  function handleExportCsv() {
    if (!data?.results.length) return;
    downloadCsv('bulk-tariff-lookup', data.results, CSV_COLUMNS);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#0C2340] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Bulk Tariff Lookup</h1>
            <p className="text-sm text-blue-200">
              Look up multiple HS codes at once
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded transition-colors"
            >
              &larr; Tariff Search
            </Link>
            <Link
              href="/admin"
              className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Input area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Textarea input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste HS Codes
                <span className="text-gray-400 font-normal ml-1">
                  (comma or newline separated)
                </span>
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={"0101.21.00\n0201.10.00\n0301.11.00\n..."}
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
              />
              <p className="text-xs text-gray-400 mt-1">
                {parseCodes(input).length} code(s) entered (max 500)
              </p>
            </div>

            {/* File upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or Upload CSV
                <span className="text-gray-400 font-normal ml-1">
                  (first column = HS codes)
                </span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className="cursor-pointer"
                >
                  <div className="text-gray-400 text-4xl mb-2">&#128196;</div>
                  <p className="text-sm text-gray-600 font-medium">
                    Click to upload CSV file
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    .csv or .txt, first column parsed as codes
                  </p>
                </label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleSubmit}
              disabled={loading || parseCodes(input).length === 0}
              className="bg-[#0C2340] hover:bg-[#163a5f] disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Looking up...
                </>
              ) : (
                'Look Up Codes'
              )}
            </button>

            {data && data.results.length > 0 && (
              <button
                onClick={handleExportCsv}
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
              >
                Export CSV ({data.results.length} results)
              </button>
            )}

            <button
              onClick={() => {
                setInput('');
                setData(null);
                setError('');
              }}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear
            </button>
          </div>

          {error && (
            <div className="mt-3 bg-red-50 text-red-700 text-sm px-4 py-2 rounded border border-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {data && (
          <>
            {/* Summary */}
            <div className="flex gap-4 mb-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 border-l-4 border-l-green-500">
                <span className="text-2xl font-bold text-green-700">
                  {data.results.length}
                </span>
                <span className="text-sm text-gray-500 ml-2">Found</span>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3 border-l-4 border-l-red-500">
                <span className="text-2xl font-bold text-red-700">
                  {data.notFound.length}
                </span>
                <span className="text-sm text-gray-500 ml-2">Not Found</span>
              </div>
            </div>

            {/* Not-found codes */}
            {data.notFound.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
                <p className="text-sm font-medium text-red-700 mb-1">
                  Codes not found:
                </p>
                <p className="text-xs text-red-600 font-mono">
                  {data.notFound.join(', ')}
                </p>
              </div>
            )}

            {/* Results table */}
            {data.results.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#0C2340] text-white text-left">
                        <th className="px-4 py-3 font-medium">#</th>
                        <th className="px-4 py-3 font-medium">HS Code</th>
                        <th className="px-4 py-3 font-medium">Stat Code</th>
                        <th className="px-4 py-3 font-medium min-w-[300px]">
                          Description
                        </th>
                        <th className="px-4 py-3 font-medium">Unit</th>
                        <th className="px-4 py-3 font-medium">Duty Rate</th>
                        <th className="px-4 py-3 font-medium">Section</th>
                        <th className="px-4 py-3 font-medium">Chapter</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.results.map((r, i) => (
                        <tr
                          key={r.code + '-' + i}
                          className={`border-t border-gray-100 ${
                            i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          } hover:bg-blue-50 transition-colors`}
                        >
                          <td className="px-4 py-2.5 text-gray-400 text-xs">
                            {i + 1}
                          </td>
                          <td className="px-4 py-2.5 font-mono font-bold text-blue-700">
                            <Link href={`/?code=${r.code}`} className="hover:underline">
                              {r.code}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5 font-mono text-gray-600">
                            {r.statistical_code || '-'}
                          </td>
                          <td className="px-4 py-2.5 text-gray-700">
                            {r.description}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600">
                            {r.unit || '-'}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                r.is_free
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {r.duty_rate || 'Free'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-500">
                            S{r.section_number}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-gray-500">
                            Ch {r.chapter_number}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
