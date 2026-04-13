'use client';

import { useState, useCallback } from 'react';
import { isBookmarked, addBookmark, removeBookmark } from '@/lib/bookmarks';
import type {
  TariffResult,
  ActSectionRow,
  RegulationRow,
  ChemicalRow,
  AHECCRow,
  ActiveView,
} from '../../types';

interface SearchResultsViewProps {
  searchQuery: string;
  results: TariffResult[];
  totalResults: number;
  actResults: ActSectionRow[];
  actTotal: number;
  regsResults: RegulationRow[];
  regsTotal: number;
  chemsResults: ChemicalRow[];
  chemsTotal: number;
  aheccResults: AHECCRow[];
  aheccTotal: number;
  loading: boolean;
  onSelectTariffCode: (code: string) => void;
  onNavigateToSource: (view: ActiveView) => void;
  selectedTariffCode?: string;
}

// Filter pill data — matches BorderWise's pill layout
const FILTER_PILLS: { label: string; view?: ActiveView; color: string }[] = [
  { label: 'Schedule 3', view: 'schedule-3', color: 'bg-blue-600 text-white' },
  { label: 'Schedules 4A to 16 Originating Goods', color: 'bg-green-600 text-white' },
  { label: 'Tariff Concessions', view: 'tco', color: 'bg-blue-600 text-white' },
  { label: 'CP Questions', view: 'cpquestions', color: 'bg-teal-100 text-teal-800 border border-teal-300' },
  { label: 'WCO HSEN', view: 'hsen', color: 'bg-teal-100 text-teal-800 border border-teal-300' },
  { label: 'Legal Notes', view: 'act', color: 'bg-teal-100 text-teal-800 border border-teal-300' },
  { label: 'Schedule 1', view: 'schedule-1', color: 'bg-teal-100 text-teal-800 border border-teal-300' },
  { label: 'Schedule 2', view: 'schedule-2', color: 'bg-teal-100 text-teal-800 border border-teal-300' },
  { label: 'Schedule 4', view: 'schedule-4', color: 'bg-teal-100 text-teal-800 border border-teal-300' },
  { label: 'Commodity Index', view: 'chemicals', color: 'bg-teal-100 text-teal-800 border border-teal-300' },
  { label: 'US Customs Rulings', view: 'cbp-rulings', color: 'bg-gray-100 text-gray-700 border border-gray-300' },
  { label: 'HS Alphabetical Index', view: 'alpha-index', color: 'bg-gray-100 text-gray-700 border border-gray-300' },
  { label: 'Prohibited Imports', view: 'regulations', color: 'bg-red-100 text-red-700 border border-red-300' },
  { label: 'Biosecurity', view: 'bio-act', color: 'bg-green-100 text-green-700 border border-green-300' },
];

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function SearchResultsView({
  searchQuery,
  results,
  totalResults,
  actResults,
  actTotal,
  regsResults,
  regsTotal,
  chemsResults,
  chemsTotal,
  aheccResults,
  aheccTotal,
  loading,
  onSelectTariffCode,
  onNavigateToSource,
  selectedTariffCode,
}: SearchResultsViewProps) {
  const [, setRender] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const toggleBookmark = useCallback(
    (r: TariffResult, e: React.MouseEvent) => {
      e.stopPropagation();
      if (isBookmarked(r.code)) {
        removeBookmark(r.code);
      } else {
        addBookmark({
          code: r.code,
          description: r.description,
          duty_rate: r.duty_rate || 'Free',
          unit: r.unit || '',
          notes: '',
        });
      }
      window.dispatchEvent(new Event('bookmarks-changed'));
      setRender((n) => n + 1);
    },
    [],
  );

  const handleCopy = useCallback((code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    copyToClipboard(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  }, []);

  const noResults =
    results.length === 0 &&
    actResults.length === 0 &&
    regsResults.length === 0 &&
    chemsResults.length === 0 &&
    aheccResults.length === 0;

  if (noResults && searchQuery.length >= 2 && !loading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No results found for &ldquo;{searchQuery}&rdquo;
      </div>
    );
  }

  // Derive breadcrumb from first result
  const firstResult = results[0];
  const heading4 = firstResult?.code?.substring(0, 7) || searchQuery;
  const heading2 = firstResult?.code?.substring(0, 4) || '';

  return (
    <div>
      {/* ── Breadcrumb ───────────────────────────────────────────── */}
      {results.length > 0 && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className="font-medium text-gray-700">HS 2022</span>
            <span className="text-gray-400">&rsaquo;</span>
            <span className="text-gray-600">Heading {heading2}</span>
            <span className="text-gray-400">&rsaquo;</span>
            <span className="text-gray-600">Schedule 3 - Classification of Goods</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      )}

      {/* ── Filter Pills ─────────────────────────────────────────── */}
      {results.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {FILTER_PILLS.map((pill) => (
            <button
              key={pill.label}
              onClick={() => pill.view && onNavigateToSource(pill.view)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-opacity hover:opacity-80 ${pill.color}`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Tariff Table — BorderWise layout ─────────────────────── */}
      {results.length > 0 && (
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-3 py-2 font-semibold text-gray-600 w-28">Heading</th>
                <th className="px-2 py-2 font-semibold text-gray-600 w-16 text-center">Stat Code</th>
                <th className="px-2 py-2 font-semibold text-gray-600 w-10 text-center">UQ</th>
                <th className="px-3 py-2 font-semibold text-gray-600">Description</th>
                <th className="px-2 py-2 font-semibold text-gray-600 w-24 text-center">Duty</th>
                <th className="px-2 py-2 font-semibold text-gray-600 w-16 text-center">TCO</th>
                <th className="px-2 py-2 font-semibold text-gray-600 w-8 text-center">
                  <span className="sr-only">Copy</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => {
                const isSelected = selectedTariffCode === r.code;
                const isHeading = !r.statistical_code && r.code.replace(/\./g, '').length <= 4;
                const isSubheading = !r.statistical_code && r.code.replace(/\./g, '').length > 4 && r.code.replace(/\./g, '').length <= 6;
                const hasTco = (r.tco_references?.length > 0 || (r as any).tco_count > 0);

                return (
                  <tr
                    key={r.id}
                    onClick={() => onSelectTariffCode(r.code)}
                    className={`border-b border-gray-100 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50'
                        : isHeading
                          ? 'bg-white hover:bg-gray-50'
                          : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Heading code */}
                    <td className={`px-3 py-2 font-mono whitespace-nowrap ${
                      isHeading ? 'font-bold text-gray-900 text-sm' : 'text-blue-700'
                    }`}>
                      {r.code}
                    </td>

                    {/* Stat code */}
                    <td className="px-2 py-2 font-mono text-gray-500 text-center text-xs">
                      {r.statistical_code || ''}
                    </td>

                    {/* Unit of quantity */}
                    <td className="px-2 py-2 text-gray-400 text-center text-xs italic">
                      {r.unit || '..'}
                    </td>

                    {/* Description */}
                    <td className={`px-3 py-2 ${
                      isHeading
                        ? 'font-bold text-gray-900'
                        : isSubheading
                          ? 'font-medium text-gray-800'
                          : 'text-gray-700'
                    }`}>
                      {r.description}
                    </td>

                    {/* Duty rate */}
                    <td className="px-2 py-2 text-xs text-center whitespace-nowrap">
                      {r.is_free ? (
                        <span className="text-green-700 font-medium">Free</span>
                      ) : r.duty_rate ? (
                        <span className="text-gray-800">{r.duty_rate}</span>
                      ) : (
                        ''
                      )}
                    </td>

                    {/* TCO */}
                    <td className="px-2 py-2 text-xs text-center">
                      {hasTco && (
                        <span className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-medium">
                          View<br />TCOs
                        </span>
                      )}
                    </td>

                    {/* Copy icon */}
                    <td className="px-2 py-2 text-center">
                      <button
                        onClick={(e) => handleCopy(r.code, e)}
                        className="text-gray-300 hover:text-gray-600 transition-colors"
                        title={`Copy ${r.code}`}
                      >
                        {copiedCode === r.code ? (
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Other source results (below the tariff table) ────────── */}
      <div className="mt-4 space-y-3">
        {actResults.length > 0 && (
          <button
            onClick={() => onNavigateToSource('act')}
            className="w-full text-left bg-white border border-gray-200 rounded px-4 py-3 hover:bg-green-50 transition-colors flex items-center justify-between"
          >
            <div>
              <span className="text-sm font-semibold text-gray-700">Customs Act 1901</span>
              <span className="text-xs text-gray-400 ml-2">{actTotal} results</span>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        )}

        {regsResults.length > 0 && (
          <button
            onClick={() => onNavigateToSource('regulations')}
            className="w-full text-left bg-white border border-gray-200 rounded px-4 py-3 hover:bg-purple-50 transition-colors flex items-center justify-between"
          >
            <div>
              <span className="text-sm font-semibold text-gray-700">Prohibited Imports Regulations 1956</span>
              <span className="text-xs text-gray-400 ml-2">{regsTotal} results</span>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        )}

        {chemsResults.length > 0 && (
          <button
            onClick={() => onNavigateToSource('chemicals')}
            className="w-full text-left bg-white border border-gray-200 rounded px-4 py-3 hover:bg-orange-50 transition-colors flex items-center justify-between"
          >
            <div>
              <span className="text-sm font-semibold text-gray-700">Chemical Index</span>
              <span className="text-xs text-gray-400 ml-2">{chemsTotal} results</span>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        )}

        {aheccResults.length > 0 && (
          <button
            onClick={() => onNavigateToSource('ahecc')}
            className="w-full text-left bg-white border border-gray-200 rounded px-4 py-3 hover:bg-teal-50 transition-colors flex items-center justify-between"
          >
            <div>
              <span className="text-sm font-semibold text-gray-700">AHECC Export Classification</span>
              <span className="text-xs text-gray-400 ml-2">{aheccTotal} results</span>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}
