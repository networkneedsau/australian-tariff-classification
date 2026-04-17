'use client';

import { useState, useEffect, useMemo } from 'react';
import AccordionGroup from '../shared/AccordionGroup';
import FilterInput from '../shared/FilterInput';
import LoadingSpinner from '../shared/LoadingSpinner';
import type {
  ScheduleInfo,
  SectionData,
  CountryData,
  FtaExclusionRow,
  RuleData,
} from '../../types';

interface ScheduleBrowseViewProps {
  schedule: ScheduleInfo;
  onNavigateToCode?: (code: string) => void;
}

export default function ScheduleBrowseView({
  schedule,
  onNavigateToCode,
}: ScheduleBrowseViewProps) {
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [ftaExclusions, setFtaExclusions] = useState<FtaExclusionRow[]>([]);
  const [rules, setRules] = useState<RuleData[]>([]);
  const [filter, setFilter] = useState('');
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  // Fetch data based on schedule type
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFilter('');
    setExpandedSection(null);

    (async () => {
      try {
        if (schedule.dataSource === 'countries') {
          const res = await fetch('/api/tariff/countries');
          const data = await res.json();
          if (!cancelled) setCountries(data);
        } else if (schedule.dataSource === 'sections') {
          const res = await fetch('/api/tariff/sections');
          const data = await res.json();
          if (!cancelled) setSections(data);
        } else if (
          schedule.dataSource === 'fta' &&
          schedule.ftaScheduleKey
        ) {
          const res = await fetch(
            `/api/tariff/fta/schedule/${encodeURIComponent(schedule.ftaScheduleKey)}`,
          );
          const data = await res.json();
          if (!cancelled) setFtaExclusions(data);
        } else if (schedule.dataSource === 'rules') {
          const res = await fetch('/api/tariff/rules');
          const data = await res.json();
          if (!cancelled) setRules(data);
        }
      } catch {
        // User can still view ABF link
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [schedule.id, schedule.dataSource, schedule.ftaScheduleKey]);

  // Filtered countries
  const filteredCountries = useMemo(() => {
    if (!filter) return countries;
    const lc = filter.toLowerCase();
    return countries.filter(
      (c) =>
        c.country.toLowerCase().includes(lc) ||
        c.abbreviation.toLowerCase().includes(lc) ||
        c.category.toLowerCase().includes(lc),
    );
  }, [countries, filter]);

  // Filtered FTA exclusions
  const filteredFta = useMemo(() => {
    if (!filter) return ftaExclusions;
    const lc = filter.toLowerCase();
    return ftaExclusions.filter(
      (f) =>
        f.hs_code.toLowerCase().includes(lc) ||
        f.description.toLowerCase().includes(lc) ||
        f.fta_name.toLowerCase().includes(lc),
    );
  }, [ftaExclusions, filter]);

  // Filtered sections
  const filteredSections = useMemo(() => {
    if (!filter) return sections;
    const lc = filter.toLowerCase();
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(lc) ||
        String(s.number).includes(lc) ||
        s.chapters.some(
          (ch) =>
            ch.title.toLowerCase().includes(lc) ||
            String(ch.number).includes(lc),
        ),
    );
  }, [sections, filter]);

  if (loading) {
    return <LoadingSpinner message={`Loading ${schedule.title}...`} />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800">{schedule.title}</h2>
          <p className="text-xs text-gray-500 mt-1">{schedule.label}</p>
        </div>
        <a
          href={schedule.abfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 shrink-0"
        >
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
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
          View on ABF
        </a>
      </div>

      {/* Countries view */}
      {schedule.dataSource === 'countries' && (
        <>
          <FilterInput
            value={filter}
            onChange={setFilter}
            placeholder="Filter countries..."
            count={filteredCountries.length}
            total={countries.length}
          />
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-4 py-2">Country</th>
                  <th className="px-4 py-2">Abbreviation</th>
                  <th className="px-4 py-2">Schedule</th>
                  <th className="px-4 py-2">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCountries.map((c) => (
                  <tr key={c.id} className="hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-2 text-gray-800">{c.country}</td>
                    <td className="px-4 py-2 font-mono text-gray-600">
                      {c.abbreviation}
                    </td>
                    <td className="px-4 py-2 text-gray-500">{c.schedule}</td>
                    <td className="px-4 py-2">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                        {c.category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCountries.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">
                No countries match your filter.
              </div>
            )}
          </div>
        </>
      )}

      {/* Sections view (Schedule 3) */}
      {schedule.dataSource === 'sections' && (
        <>
          <FilterInput
            value={filter}
            onChange={setFilter}
            placeholder="Filter sections or chapters..."
            count={filteredSections.reduce(
              (sum, s) => sum + s.chapters.length,
              0,
            )}
            total={sections.reduce((sum, s) => sum + s.chapters.length, 0)}
          />
          <div className="space-y-2">
            {filteredSections.map((section) => (
              <AccordionGroup
                key={section.number}
                title={`Section ${toRoman(section.number)}`}
                subtitle={section.title}
                count={section.chapters.length}
                expanded={expandedSection === section.number}
                onToggle={() =>
                  setExpandedSection((prev) =>
                    prev === section.number ? null : section.number,
                  )
                }
                colorScheme="blue"
              >
                <div className="divide-y divide-gray-50">
                  {section.chapters.map((ch) => (
                    <button
                      key={ch.number}
                      onClick={() => {
                        const prefix = String(ch.number).padStart(2, '0');
                        onNavigateToCode?.(prefix);
                      }}
                      className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-blue-50 transition-colors"
                    >
                      <span className="font-mono text-xs font-bold text-blue-700 w-12 shrink-0">
                        Ch.{ch.number}
                      </span>
                      <span className="text-sm text-gray-700 flex-1">
                        {ch.title}
                      </span>
                      <svg
                        className="w-4 h-4 text-gray-400 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  ))}
                </div>
              </AccordionGroup>
            ))}
          </div>
        </>
      )}

      {/* FTA Exclusions view */}
      {schedule.dataSource === 'fta' && (
        <>
          <FilterInput
            value={filter}
            onChange={setFilter}
            placeholder="Filter exclusions by HS code, description, or FTA..."
            count={filteredFta.length}
            total={ftaExclusions.length}
          />
          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="px-4 py-2">HS Code</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">FTA</th>
                  <th className="px-4 py-2 text-right">Duty Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFta.map((f, i) => (
                  <tr
                    key={i}
                    className="hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() => onNavigateToCode?.(f.hs_code)}
                  >
                    <td className="px-4 py-2 font-mono text-blue-700 font-medium">
                      {f.hs_code}
                    </td>
                    <td className="px-4 py-2 text-gray-700">
                      {f.description}
                    </td>
                    <td className="px-4 py-2 text-gray-500">{f.fta_name}</td>
                    <td className="px-4 py-2 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          f.duty_rate === 'Free' || f.duty_rate === null
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {f.duty_rate || 'Free'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredFta.length === 0 && (
              <div className="p-6 text-center text-gray-400 text-sm">
                No exclusions match your filter.
              </div>
            )}
          </div>
        </>
      )}

      {/* Rules view (Schedule 2) */}
      {schedule.dataSource === 'rules' && (
        <div className="space-y-3">
          {rules.map((r, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow border border-gray-200 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-sm font-bold text-indigo-700 shrink-0">
                  {r.rule}
                </span>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-800">
                    {r.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">
                    {r.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {rules.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
              No interpretative rules data available. Visit the ABF website for
              the official rules.
            </div>
          )}
        </div>
      )}

      {/* External data source fallback */}
      {schedule.dataSource === 'external' && (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-3">
            This schedule is maintained externally by the Australian Border
            Force.
          </p>
          <a
            href={schedule.abfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            View on ABF Website
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
      )}
    </div>
  );
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
