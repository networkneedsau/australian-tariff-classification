'use client';

import { useState, useCallback } from 'react';
import { isBookmarked, addBookmark, removeBookmark } from '@/lib/bookmarks';
import type {
  TariffResult,
  ActSectionRow,
  RegulationRow,
  ChemicalRow,
  AHECCRow,
} from '../../types';
import type { ActiveView } from '../../types';

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
  onExportCsv?: () => void;
}

function toRoman(num: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) {
      result += syms[i];
      num -= vals[i];
    }
  }
  return result;
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
  onExportCsv,
}: SearchResultsViewProps) {
  const [, setRender] = useState(0);

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

  const noResults =
    results.length === 0 &&
    actResults.length === 0 &&
    regsResults.length === 0 &&
    chemsResults.length === 0 &&
    aheccResults.length === 0;

  if (noResults && searchQuery.length >= 2 && !loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No results found for &ldquo;{searchQuery}&rdquo;
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-[70vh] overflow-y-auto">
      {/* Tariff classification results */}
      {results.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Tariff Classifications ({totalResults})
            </p>
            {onExportCsv && (
              <button
                onClick={onExportCsv}
                className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export CSV
              </button>
            )}
          </div>
          {results.map((r) => {
            const bookmarked = isBookmarked(r.code);
            return (
              <button
                key={r.id}
                onClick={() => onSelectTariffCode(r.code)}
                className={`w-full text-left bg-white rounded-lg shadow-sm p-4 mb-2 hover:bg-blue-50 hover:border-blue-300 border-2 transition-colors ${
                  selectedTariffCode === r.code
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-transparent'
                }`}
              >
                {/* Row 1: Code + Bookmark + Stat + Badges */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => toggleBookmark(r, e)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ')
                          toggleBookmark(
                            r,
                            e as unknown as React.MouseEvent,
                          );
                      }}
                      className={`cursor-pointer text-lg leading-none ${
                        bookmarked
                          ? 'text-yellow-500'
                          : 'text-gray-300 hover:text-yellow-400'
                      }`}
                      title={
                        bookmarked
                          ? 'Remove bookmark'
                          : 'Bookmark this code'
                      }
                    >
                      {bookmarked ? '\u2605' : '\u2606'}
                    </span>
                    <span className="font-mono font-bold text-blue-700 text-base">
                      {r.code}
                    </span>
                    {r.statistical_code && (
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600 font-mono">
                        Stat: {r.statistical_code}
                      </span>
                    )}
                    {r.unit && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                        {r.unit}
                      </span>
                    )}
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold max-w-[140px] truncate ${
                        r.is_free
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                      title={r.duty_rate || 'N/A'}
                    >
                      {r.is_free ? 'Free' : r.duty_rate || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Row 2: Description */}
                <p className="text-sm text-gray-800 mt-2 leading-snug">
                  {r.description}
                </p>

                {/* Row 3: Heading description */}
                {r.heading_description &&
                  r.heading_description !== r.description && (
                    <p className="text-xs text-gray-500 mt-1 italic">
                      Heading {r.heading_code}: {r.heading_description}
                    </p>
                  )}

                {/* Row 4: Hierarchy breadcrumb + indicators */}
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400">
                    <span className="text-gray-500">
                      Section {toRoman(r.section_number)}
                    </span>
                    {' \u203A '}
                    <span>Ch.{r.chapter_number}</span>
                    {r.chapter_title && (
                      <span> &mdash; {r.chapter_title}</span>
                    )}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {r.tco_references && r.tco_references.length > 0 && (
                      <span
                        className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium"
                        title={`${r.tco_references.length} TCO(s)`}
                      >
                        TCO
                      </span>
                    )}
                    {!r.is_free &&
                      r.duty_rate &&
                      r.duty_rate.length > 10 && (
                        <span
                          className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded font-medium"
                          title="Multiple/compound rate"
                        >
                          FTA
                        </span>
                      )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Customs Act results */}
      {actResults.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Customs Act 1901 ({actTotal})
          </p>
          {actResults.map((s) => (
            <button
              key={s.id}
              onClick={() => onNavigateToSource('act')}
              className="w-full text-left bg-white rounded-lg shadow p-3 mb-2 hover:bg-green-50 border-2 border-transparent hover:border-green-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-green-700 w-16 shrink-0 pt-0.5">
                  s.{s.section_number}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{s.section_title}</p>
                  <p className="text-xs text-gray-400">
                    {s.part} &mdash; {s.part_title}
                  </p>
                </div>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded shrink-0">
                  Act
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Prohibited Imports Regulations results */}
      {regsResults.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Prohibited Imports Regulations 1956 ({regsTotal})
          </p>
          {regsResults.map((r) => (
            <button
              key={r.id}
              onClick={() => onNavigateToSource('regulations')}
              className="w-full text-left bg-white rounded-lg shadow p-3 mb-2 hover:bg-purple-50 border-2 border-transparent hover:border-purple-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-purple-700 w-16 shrink-0 pt-0.5">
                  r.{r.regulation_number}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">
                    {r.regulation_title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {r.part} &mdash; {r.part_title}
                  </p>
                </div>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded shrink-0">
                  Regs
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Chemical Index results */}
      {chemsResults.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            Chemical Index &mdash; CWC ({chemsTotal})
          </p>
          {chemsResults.map((c) => {
            const color =
              c.cwc_schedule === '1'
                ? 'red'
                : c.cwc_schedule === '2'
                  ? 'orange'
                  : 'yellow';
            return (
              <button
                key={c.id}
                onClick={() => onNavigateToSource('chemicals')}
                className={`w-full text-left bg-white rounded-lg shadow p-3 mb-2 hover:bg-${color}-50 border-2 border-transparent hover:border-${color}-300 transition-colors`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`font-mono text-xs font-bold text-${color}-700 w-16 shrink-0 pt-0.5`}
                  >
                    S{c.cwc_schedule}.{c.item_number}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-gray-700">
                      {c.chemical_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {c.cas_number ? `CAS: ${c.cas_number}` : ''}{' '}
                      {c.category}
                    </p>
                  </div>
                  <span
                    className={`text-xs bg-${color}-100 text-${color}-700 px-2 py-0.5 rounded shrink-0`}
                  >
                    CWC {c.cwc_schedule}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* AHECC results */}
      {aheccResults.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">
            AHECC Export Classification ({aheccTotal})
          </p>
          {aheccResults.map((a) => (
            <button
              key={a.id}
              onClick={() => onNavigateToSource('ahecc')}
              className="w-full text-left bg-white rounded-lg shadow p-3 mb-2 hover:bg-teal-50 border-2 border-transparent hover:border-teal-300 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-teal-700 w-16 shrink-0 pt-0.5">
                  Ch.{a.chapter_number}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{a.chapter_title}</p>
                  <p className="text-xs text-gray-400">
                    Section {a.section_number} &mdash; {a.section_title}
                  </p>
                </div>
                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded shrink-0">
                  AHECC
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
