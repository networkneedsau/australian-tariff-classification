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
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        No results found for &ldquo;{searchQuery}&rdquo;
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Tariff Classifications — BorderWise-style table ───────── */}
      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">
              Schedule 3 — Classification of Goods ({totalResults})
            </h3>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0C2340] text-white text-left text-xs">
                  <th className="px-3 py-2 w-8"></th>
                  <th className="px-3 py-2 font-medium">Heading</th>
                  <th className="px-2 py-2 font-medium w-16">Stat Code</th>
                  <th className="px-2 py-2 font-medium w-10">UQ</th>
                  <th className="px-3 py-2 font-medium">Description</th>
                  <th className="px-2 py-2 font-medium w-24">Duty</th>
                  <th className="px-2 py-2 font-medium w-16">TCO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((r) => {
                  const isSelected = selectedTariffCode === r.code;
                  const bookmarked = isBookmarked(r.code);
                  const isHeading = !r.statistical_code && r.code.length <= 7;
                  const isSubheading = !r.statistical_code && r.code.length > 7 && r.code.length <= 10;

                  return (
                    <tr
                      key={r.id}
                      onClick={() => onSelectTariffCode(r.code)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 border-l-4 border-l-blue-500'
                          : isHeading
                            ? 'bg-gray-50 hover:bg-blue-50'
                            : 'hover:bg-blue-50'
                      }`}
                    >
                      {/* Bookmark */}
                      <td className="px-2 py-1.5 text-center">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => toggleBookmark(r, e)}
                          className={`cursor-pointer text-sm ${bookmarked ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`}
                        >
                          {bookmarked ? '\u2605' : '\u2606'}
                        </span>
                      </td>

                      {/* Heading code */}
                      <td className={`px-3 py-1.5 font-mono whitespace-nowrap ${isHeading ? 'font-bold text-gray-900' : isSubheading ? 'font-semibold text-blue-800' : 'text-blue-700'}`}>
                        {r.code}
                      </td>

                      {/* Stat code */}
                      <td className="px-2 py-1.5 font-mono text-gray-500 text-xs">
                        {r.statistical_code || ''}
                      </td>

                      {/* Unit of quantity */}
                      <td className="px-2 py-1.5 text-gray-500 text-xs italic">
                        {r.unit || '..'}
                      </td>

                      {/* Description */}
                      <td className={`px-3 py-1.5 ${isHeading ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {r.description}
                      </td>

                      {/* Duty rate */}
                      <td className="px-2 py-1.5 text-xs font-medium whitespace-nowrap">
                        {r.is_free ? (
                          <span className="text-green-700">Free</span>
                        ) : r.duty_rate ? (
                          <span className="text-amber-800">{r.duty_rate}</span>
                        ) : (
                          ''
                        )}
                      </td>

                      {/* TCO */}
                      <td className="px-2 py-1.5 text-xs">
                        {(r.tco_references?.length > 0 || (r as any).tco_count > 0) && (
                          <span className="text-purple-600 hover:text-purple-800 cursor-pointer">
                            View TCOs
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Legislation results ──────────────────────────────────── */}
      {actResults.length > 0 && (
        <div>
          <button
            onClick={() => onNavigateToSource('act')}
            className="text-sm font-semibold text-gray-700 hover:text-blue-700 mb-2 flex items-center gap-1"
          >
            Customs Act 1901 ({actTotal})
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
            {actResults.map((s: ActSectionRow) => (
              <div key={s.id} onClick={() => onNavigateToSource('act')} className="px-4 py-2 hover:bg-green-50 cursor-pointer flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-green-700 w-12 shrink-0">s.{s.section_number}</span>
                <div>
                  <span className="text-sm text-gray-700">{s.section_title}</span>
                  <span className="text-xs text-gray-400 ml-2">{s.part_title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Regulations results ──────────────────────────────────── */}
      {regsResults.length > 0 && (
        <div>
          <button
            onClick={() => onNavigateToSource('regulations')}
            className="text-sm font-semibold text-gray-700 hover:text-blue-700 mb-2 flex items-center gap-1"
          >
            Prohibited Imports Regulations ({regsTotal})
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
            {regsResults.map((r: RegulationRow) => (
              <div key={r.id} onClick={() => onNavigateToSource('regulations')} className="px-4 py-2 hover:bg-purple-50 cursor-pointer flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-purple-700 w-12 shrink-0">r.{r.regulation_number}</span>
                <span className="text-sm text-gray-700">{r.regulation_title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Chemical Index results ───────────────────────────────── */}
      {chemsResults.length > 0 && (
        <div>
          <button
            onClick={() => onNavigateToSource('chemicals')}
            className="text-sm font-semibold text-gray-700 hover:text-blue-700 mb-2 flex items-center gap-1"
          >
            Chemical Index ({chemsTotal})
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
            {chemsResults.map((c: ChemicalRow) => (
              <div key={c.id} onClick={() => onNavigateToSource('chemicals')} className="px-4 py-2 hover:bg-orange-50 cursor-pointer flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-orange-700 w-16 shrink-0">S{c.cwc_schedule}.{c.item_number}</span>
                <div>
                  <span className="text-sm text-gray-700">{c.chemical_name}</span>
                  {c.cas_number && <span className="text-xs text-gray-400 ml-2">CAS: {c.cas_number}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AHECC results ────────────────────────────────────────── */}
      {aheccResults.length > 0 && (
        <div>
          <button
            onClick={() => onNavigateToSource('ahecc')}
            className="text-sm font-semibold text-gray-700 hover:text-blue-700 mb-2 flex items-center gap-1"
          >
            AHECC Export Classification ({aheccTotal})
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100">
            {aheccResults.map((a: AHECCRow) => (
              <div key={a.id} onClick={() => onNavigateToSource('ahecc')} className="px-4 py-2 hover:bg-teal-50 cursor-pointer flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-teal-700 w-12 shrink-0">Ch.{a.chapter_number}</span>
                <span className="text-sm text-gray-700">{a.chapter_title}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
