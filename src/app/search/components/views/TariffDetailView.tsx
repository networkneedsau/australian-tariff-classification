'use client';

import { useState, useEffect, useCallback } from 'react';
import { isBookmarked, addBookmark, removeBookmark } from '@/lib/bookmarks';
import IcsExportButton from '@/app/components/IcsExportButton';
import Field from '../shared/Field';
import type { EntryResponse, CustomsEntryFields } from '../../types';

interface TariffDetailViewProps {
  entry: EntryResponse | null;
  customsFields: CustomsEntryFields | null;
  onSelectCode?: (code: string) => void;
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

export default function TariffDetailView({
  entry,
  customsFields,
  onSelectCode,
}: TariffDetailViewProps) {
  const [, setRender] = useState(0);
  const [customsValue, setCustomsValue] = useState('');
  const [expandedTco, setExpandedTco] = useState<string | null>(null);
  const [tcoLinkedTariffs, setTcoLinkedTariffs] = useState<any[]>([]);
  const [tcoLinkLoading, setTcoLinkLoading] = useState(false);

  // ABF reference file data
  const [abfPermits, setAbfPermits] = useState<any[]>([]);
  const [concordance, setConcordance] = useState<{old_codes: any[]; new_codes: any[]} | null>(null);

  // Reset when entry changes + fetch ABF permits and concordance
  useEffect(() => {
    setCustomsValue('');
    setExpandedTco(null);
    setTcoLinkedTariffs([]);
    setAbfPermits([]);
    setConcordance(null);

    if (!entry?.tariff_code) return;

    const code = entry.tariff_code;
    // Fetch ABF permits (from PRMTRQMT)
    fetch(`/api/tariff/abf-permits?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data) => setAbfPermits(data.abf_permits || []))
      .catch(() => setAbfPermits([]));

    // Fetch tariff concordance (HS2017 ↔ HS2022)
    fetch(`/api/tariff/concordance?code=${encodeURIComponent(code)}`)
      .then((r) => r.json())
      .then((data) => setConcordance({ old_codes: data.old_codes || [], new_codes: data.new_codes || [] }))
      .catch(() => setConcordance(null));
  }, [entry?.tariff_code]);

  // Duty calculations
  const dutyPayable = customsFields?.duty_payable ?? null;
  const gstRate = customsFields?.gst_rate ?? 10;
  const cv = parseFloat(customsValue) || 0;
  const gstAmount =
    dutyPayable !== null && cv > 0 ? (cv + dutyPayable) * (gstRate / 100) : null;
  const totalPayable =
    dutyPayable !== null && gstAmount !== null ? cv + dutyPayable + gstAmount : null;

  const toggleBookmark = useCallback(() => {
    if (!entry) return;
    if (isBookmarked(entry.tariff_code)) {
      removeBookmark(entry.tariff_code);
    } else {
      addBookmark({
        code: entry.tariff_code,
        description: entry.description,
        duty_rate: entry.duty_rate || 'Free',
        unit: entry.unit_of_measure || '',
        notes: '',
      });
    }
    window.dispatchEvent(new Event('bookmarks-changed'));
    setRender((n) => n + 1);
  }, [entry]);

  const handleTcoClick = async (tco: string) => {
    if (expandedTco === tco) {
      setExpandedTco(null);
      setTcoLinkedTariffs([]);
      return;
    }
    setExpandedTco(tco);
    setTcoLinkLoading(true);
    try {
      const res = await fetch(
        `/api/tariff/tco-links?tco=${encodeURIComponent(tco)}`,
      );
      const data = await res.json();
      setTcoLinkedTariffs(data.tariff_codes || []);
    } catch {
      setTcoLinkedTariffs([]);
    }
    setTcoLinkLoading(false);
  };

  if (!entry) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-400">
        Select a tariff code to populate customs entry fields
      </div>
    );
  }

  const bookmarked = isBookmarked(entry.tariff_code);

  return (
    <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
      {/* Header with full hierarchy */}
      <div className="p-4 bg-blue-50 border-b-2 border-blue-200">
        <div className="flex items-start justify-between">
          <h3 className="font-mono font-bold text-blue-900 text-lg flex items-center gap-2">
            <span
              role="button"
              tabIndex={0}
              onClick={toggleBookmark}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') toggleBookmark();
              }}
              className={`cursor-pointer text-xl leading-none ${
                bookmarked
                  ? 'text-yellow-500'
                  : 'text-blue-300 hover:text-yellow-400'
              }`}
              title={bookmarked ? 'Remove bookmark' : 'Bookmark this code'}
            >
              {bookmarked ? '\u2605' : '\u2606'}
            </span>
            {entry.tariff_code}
            {entry.statistical_code && (
              <span className="text-blue-600 text-sm font-normal ml-2">
                (Stat: {entry.statistical_code})
              </span>
            )}
          </h3>
          <span
            className={`inline-block px-3 py-1 rounded text-sm font-bold ${
              entry.is_free
                ? 'bg-green-100 text-green-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {entry.is_free ? 'Free' : entry.duty_rate || 'N/A'}
          </span>
        </div>
        <p className="text-sm text-blue-800 mt-2 leading-snug font-medium">
          {entry.description}
        </p>

        {/* Full hierarchy breadcrumb */}
        <div className="mt-3 bg-blue-100/50 rounded p-2.5 text-xs text-blue-700 space-y-1">
          {entry.section && (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-blue-500 w-16 shrink-0">
                Section
              </span>
              <span>
                {entry.section.number ? toRoman(entry.section.number) : '—'}
                {entry.section.title ? `: ${entry.section.title}` : ''}
              </span>
            </div>
          )}
          {entry.chapter && (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-blue-500 w-16 shrink-0">
                Chapter
              </span>
              <span>
                {entry.chapter.number ?? '—'}
                {entry.chapter.title ? `: ${entry.chapter.title}` : ''}
              </span>
            </div>
          )}
          {entry.heading && (
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-blue-500 w-16 shrink-0">
                Heading
              </span>
              <span>
                {entry.heading.code}: {entry.heading.description}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Prohibited goods warning */}
      {entry.prohibited_flags && entry.prohibited_flags.length > 0 && (
        <div className="p-4">
          {entry.prohibited_flags.map((pf, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg mb-2 border flex items-start gap-2 ${
                pf.severity === 'prohibited'
                  ? 'bg-red-50 border-red-300'
                  : pf.severity === 'restricted'
                    ? 'bg-orange-50 border-orange-300'
                    : 'bg-yellow-50 border-yellow-300'
              }`}
            >
              <svg
                className={`w-5 h-5 shrink-0 mt-0.5 ${
                  pf.severity === 'prohibited'
                    ? 'text-red-600'
                    : pf.severity === 'restricted'
                      ? 'text-orange-600'
                      : 'text-yellow-600'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div className="flex-1">
                <div
                  className={`text-xs font-bold uppercase ${
                    pf.severity === 'prohibited'
                      ? 'text-red-800'
                      : pf.severity === 'restricted'
                        ? 'text-orange-800'
                        : 'text-yellow-800'
                  }`}
                >
                  {pf.severity} &mdash; {pf.regulation_ref}
                </div>
                <p className="text-xs text-gray-700 mt-0.5">
                  {pf.description}
                </p>
                {pf.permit_required && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    Permit: {pf.permit_required}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Permit requirements */}
      {entry.permit_requirements && entry.permit_requirements.length > 0 && (
        <div className="p-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-blue-800 uppercase mb-1.5 flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Permits Required
            </h4>
            {entry.permit_requirements.map((pr, i) => (
              <div
                key={i}
                className="text-xs text-blue-700 py-1 flex items-center gap-2"
              >
                <span className="font-semibold shrink-0">{pr.agency}</span>
                <span>
                  {pr.permit_type}: {pr.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ABF Official Permits (from PRMTRQMT reference file) */}
      {abfPermits.length > 0 && (
        <div className="p-4">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-indigo-800 uppercase mb-2 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              ABF Official Permit Requirements ({abfPermits.length})
              <span className="text-[10px] font-normal text-indigo-500 ml-1">from PRMTRQMT</span>
            </h4>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {abfPermits.map((p, i) => (
                <div key={i} className="text-xs text-indigo-700 py-1 flex items-center gap-2 border-b border-indigo-100 last:border-0">
                  <span className={`font-semibold shrink-0 px-1.5 py-0.5 rounded font-mono text-[10px] ${
                    p.required_flag === 'Y' ? 'bg-red-100 text-red-700' :
                    p.required_flag === 'M' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {p.agency_code}
                  </span>
                  <span className="flex-1">{p.agency_name || p.agency_code}</span>
                  {p.required_flag === 'Y' && <span className="text-[10px] text-red-600 font-semibold">REQUIRED</span>}
                  {p.required_flag === 'M' && <span className="text-[10px] text-amber-600 font-semibold">MAY REQUIRE</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HS2017 ↔ HS2022 Concordance (from TRFCCONC) */}
      {concordance && (concordance.old_codes.length > 0 || concordance.new_codes.length > 0) && (
        <div className="p-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              HS Code Concordance
              <span className="text-[10px] font-normal text-slate-500 ml-1">from TRFCCONC</span>
            </h4>
            {concordance.old_codes.length > 0 && (
              <div className="text-xs text-slate-700 mb-1.5">
                <span className="text-slate-500">Previously known as (HS2017):</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {concordance.old_codes.map((c: any, i: number) => (
                    <span key={i} onClick={() => onSelectCode && onSelectCode(c.old_code_formatted || c.old_code)} className="font-mono bg-white border border-slate-300 text-slate-700 px-1.5 py-0.5 rounded cursor-pointer hover:bg-blue-50 hover:border-blue-300">
                      {c.old_code_formatted || c.old_code}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {concordance.new_codes.length > 0 && (
              <div className="text-xs text-slate-700">
                <span className="text-slate-500">Now replaced by (HS2022):</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {concordance.new_codes.map((c: any, i: number) => (
                    <span key={i} onClick={() => onSelectCode && onSelectCode(c.new_code_formatted || c.new_code)} className="font-mono bg-white border border-blue-300 text-blue-700 px-1.5 py-0.5 rounded cursor-pointer hover:bg-blue-50">
                      {c.new_code_formatted || c.new_code}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auto-populated fields */}
      {customsFields && (
        <div className="p-4 space-y-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Auto-Populated Fields
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Tariff Code"
              value={customsFields.tariff_classification_code}
            />
            <Field
              label="Statistical Code"
              value={customsFields.tariff_stat_code || '\u2014'}
            />
            <Field
              label="Unit of Quantity"
              value={customsFields.unit_of_quantity}
            />
            <Field
              label="General Duty Rate"
              value={customsFields.general_duty_rate}
              highlight={customsFields.general_duty_rate === 'Free'}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">
              Goods Description
            </label>
            <textarea
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded bg-gray-50 text-sm text-gray-800"
              rows={2}
              value={customsFields.goods_description}
              readOnly
            />
          </div>

          {/* Additional classification info */}
          <div className="grid grid-cols-3 gap-3">
            <Field
              label="GST Applicable"
              value={customsFields.gst_applicable ? 'Yes' : 'No'}
            />
            <Field label="GST Rate" value={`${customsFields.gst_rate}%`} />
            <Field
              label="Concessions"
              value={
                entry.tco_references.length > 0
                  ? `${entry.tco_references.length} TCO(s)`
                  : 'None'
              }
            />
          </div>
        </div>
      )}

      {/* FTA Exclusions / Preferential Rates */}
      {entry.fta_exclusions.length > 0 && (
        <div className="p-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-indigo-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            FTA Preferential Rates ({entry.fta_exclusions.length})
          </h4>
          <div className="border border-gray-200 rounded overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-3 py-1.5 font-semibold text-gray-600">
                    Schedule
                  </th>
                  <th className="px-3 py-1.5 font-semibold text-gray-600">
                    FTA Agreement
                  </th>
                  <th className="px-3 py-1.5 font-semibold text-gray-600 text-right">
                    Rate
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entry.fta_exclusions.map((f, i) => (
                  <tr key={i} className="hover:bg-blue-50">
                    <td className="px-3 py-1.5 font-mono text-gray-500">
                      {f.schedule}
                    </td>
                    <td className="px-3 py-1.5 text-gray-700">
                      {f.fta_name || f.schedule}
                    </td>
                    <td className="px-3 py-1.5 text-right font-mono font-medium text-amber-700">
                      {f.duty_rate || '\u2014'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TCO References */}
      {entry.tco_references.length > 0 && (
        <div className="p-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-purple-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Tariff Concession Orders ({entry.tco_references.length})
          </h4>
          <p className="text-[10px] text-gray-400 mb-2">
            Click a TCO to see linked tariff items
          </p>
          <div className="flex flex-wrap gap-1.5">
            {entry.tco_references.map((tco, i) => (
              <button
                key={i}
                onClick={() => handleTcoClick(tco)}
                className={`text-xs px-2.5 py-1 rounded border font-mono transition-colors cursor-pointer ${
                  expandedTco === tco
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                }`}
              >
                {tco}
              </button>
            ))}
          </div>

          {/* Expanded TCO: show linked tariff items */}
          {expandedTco && (
            <div className="mt-3 bg-purple-50/50 border border-purple-200 rounded-lg p-3">
              <div className="text-xs font-semibold text-purple-800 mb-2">
                TCO {expandedTco} &mdash; Linked Tariff Items
              </div>
              {tcoLinkLoading ? (
                <div className="text-xs text-gray-400 py-2">Loading...</div>
              ) : tcoLinkedTariffs.length === 0 ? (
                <div className="text-xs text-gray-400 py-2">
                  No tariff items linked to this TCO yet.
                  <br />
                  <span className="text-purple-600">
                    Use the link button below to connect tariff codes.
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {tcoLinkedTariffs.map((link: any, li: number) => (
                    <button
                      key={li}
                      onClick={() => onSelectCode?.(link.tariff_code)}
                      className="w-full text-left text-xs bg-white rounded p-2 border border-purple-100 hover:border-purple-300 hover:bg-purple-50 transition-colors flex items-start gap-2"
                    >
                      <span className="font-mono font-bold text-purple-700 shrink-0">
                        {link.tariff_code}
                      </span>
                      <span className="text-gray-600 flex-1">
                        {link.tariff_description || link.description || ''}
                      </span>
                      {link.duty_rate && (
                        <span
                          className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            link.is_free
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {link.is_free ? 'Free' : link.duty_rate}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Duty calculator removed — available at /calculator */}

      {/* ICS XML Export */}
      {customsFields && (
        <div className="p-4 border-t border-gray-100">
          <IcsExportButton
            entryFields={{
              tariffCode: entry.tariff_code,
              statisticalCode: entry.statistical_code || '',
              goodsDescription: entry.description,
              countryOfOrigin: '',
              customsValue: cv || 0,
              currency: 'AUD',
              dutyRate: entry.duty_rate || 'Free',
              dutyAmount: dutyPayable || 0,
              gstAmount: gstAmount || 0,
              unitOfQuantity: customsFields.unit_of_quantity || 'NO',
              quantity: 1,
            }}
            disabled={false}
          />
        </div>
      )}
    </div>
  );
}
