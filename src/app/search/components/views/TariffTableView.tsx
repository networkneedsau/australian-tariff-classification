'use client';

import { useState, useCallback } from 'react';
import { isBookmarked, addBookmark, removeBookmark } from '@/lib/bookmarks';
import type { TariffResult } from '../../types';

interface TariffTableViewProps {
  results: TariffResult[];
  onSelectCode: (code: string) => void;
  selectedCode?: string;
}

/** Determine row type from the code format */
function classifyCode(code: string): 'heading' | 'subheading' | 'classification' {
  const dotless = code.replace(/\./g, '');
  if (dotless.length <= 4) return 'heading';
  if (dotless.length <= 6) return 'subheading';
  return 'classification';
}

/** Determine indentation level from leading dashes in description */
function indentLevel(description: string): number {
  const match = description.match(/^(-+)\s/);
  return match ? match[1].length : 0;
}

export default function TariffTableView({
  results,
  onSelectCode,
  selectedCode,
}: TariffTableViewProps) {
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

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
        No tariff classification results to display.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="px-3 py-2 w-8"></th>
              <th className="px-3 py-2 whitespace-nowrap">Heading</th>
              <th className="px-3 py-2 whitespace-nowrap">Stat Code</th>
              <th className="px-3 py-2 whitespace-nowrap">UQ</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2 whitespace-nowrap">Duty</th>
              <th className="px-3 py-2 whitespace-nowrap">TCO</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {results.map((r) => {
              const rowType = classifyCode(r.code);
              const isSelected = selectedCode === r.code;
              const indent = indentLevel(r.description);
              const bookmarked = isBookmarked(r.code);
              const hasTcos =
                r.tco_references && r.tco_references.length > 0;

              const rowClasses = [
                'transition-colors cursor-pointer',
                isSelected
                  ? 'bg-blue-50 border-l-4 border-l-blue-500'
                  : 'border-l-4 border-l-transparent hover:bg-gray-50',
                rowType === 'heading'
                  ? 'bg-gray-800 text-white font-bold'
                  : '',
                rowType === 'subheading' ? 'bg-gray-50 font-semibold' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <tr
                  key={r.id}
                  className={rowClasses}
                  onClick={() => onSelectCode(r.code)}
                >
                  {/* Bookmark star */}
                  <td className="px-2 py-2 text-center">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => toggleBookmark(r, e)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ')
                          toggleBookmark(r, e as unknown as React.MouseEvent);
                      }}
                      className={`cursor-pointer text-base leading-none ${
                        bookmarked
                          ? 'text-yellow-500'
                          : rowType === 'heading'
                            ? 'text-gray-500 hover:text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-400'
                      }`}
                      title={
                        bookmarked ? 'Remove bookmark' : 'Bookmark this code'
                      }
                    >
                      {bookmarked ? '\u2605' : '\u2606'}
                    </span>
                  </td>

                  {/* Heading / Code */}
                  <td
                    className={`px-3 py-2 font-mono whitespace-nowrap ${
                      rowType === 'heading'
                        ? 'text-white text-sm'
                        : rowType === 'subheading'
                          ? 'text-gray-800 text-sm pl-6'
                          : 'text-blue-700 text-xs pl-9'
                    }`}
                  >
                    {r.code}
                  </td>

                  {/* Stat Code */}
                  <td className="px-3 py-2 font-mono text-xs text-gray-500 whitespace-nowrap">
                    {r.statistical_code || ''}
                  </td>

                  {/* Unit of Quantity */}
                  <td className="px-3 py-2 text-xs text-gray-500 whitespace-nowrap">
                    {r.unit || ''}
                  </td>

                  {/* Description with indentation */}
                  <td
                    className={`px-3 py-2 ${
                      rowType === 'heading'
                        ? 'text-white'
                        : rowType === 'subheading'
                          ? 'text-gray-700'
                          : 'text-gray-800'
                    }`}
                    style={{
                      paddingLeft:
                        rowType === 'classification'
                          ? `${1.25 + indent * 0.75}rem`
                          : undefined,
                    }}
                  >
                    {r.description}
                  </td>

                  {/* Duty */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    {r.duty_rate && (
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium max-w-[140px] truncate ${
                          rowType === 'heading'
                            ? ''
                            : r.is_free
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                        title={r.duty_rate}
                      >
                        {r.is_free ? 'Free' : r.duty_rate}
                      </span>
                    )}
                  </td>

                  {/* TCO */}
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    {hasTcos && (
                      <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-medium cursor-pointer hover:bg-purple-100">
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
  );
}
