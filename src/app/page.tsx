'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ── Types ──────────────────────────────────────────────────────────

interface TariffResult {
  id: number;
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
  tco_references: string[];
}

interface CustomsEntryFields {
  tariff_classification_code: string;
  tariff_stat_code: string;
  goods_description: string;
  unit_of_quantity: string;
  general_duty_rate: string;
  duty_payable: number | null;
  gst_applicable: boolean;
  gst_rate: number;
}

interface EntryResponse {
  tariff_code: string;
  statistical_code: string | null;
  description: string;
  unit_of_measure: string | null;
  duty_rate: string | null;
  duty_rate_numeric: number | null;
  is_free: boolean;
  section: { number: number; title: string };
  chapter: { number: number; title: string };
  heading: { code: string; description: string };
  tco_references: string[];
  fta_exclusions: { schedule: string; fta_name: string; hs_code: string; duty_rate: string | null }[];
  customs_entry_fields: CustomsEntryFields;
}

interface ScheduleInfo {
  id: string;
  label: string;
  title: string;
  dataSource: 'countries' | 'sections' | 'fta' | 'external';
  abfUrl: string;
  ftaScheduleKey?: string;
}

interface SectionData {
  number: number;
  title: string;
  chapters: { number: number; title: string }[];
}

interface CountryData {
  id: number;
  country: string;
  abbreviation: string;
  schedule: string;
  category: string;
}

interface FtaExclusionRow {
  hs_code: string;
  description: string;
  fta_name: string;
  duty_rate: string | null;
}

// ── Customs Act 1901 Parts ─────────────────────────────────────────

const LEGISLATION_BASE = 'https://www.legislation.gov.au/C1901A00006/latest/text';

interface ActPartData {
  part: string;
  title: string;
}

const CUSTOMS_ACT_PARTS: ActPartData[] = [
  { part: 'Part I', title: 'Introductory' },
  { part: 'Part II', title: 'Administration' },
  { part: 'Part III', title: 'Customs control examination and securities generally' },
  { part: 'Part IV', title: 'The importation of goods' },
  { part: 'Part IVA', title: 'Depots' },
  { part: 'Part V', title: 'Warehouses' },
  { part: 'Part VAAA', title: 'Cargo terminals' },
  { part: 'Part VA', title: 'Special provisions relating to beverages' },
  { part: 'Part VAA', title: 'Special provisions relating to excise-equivalent goods' },
  { part: 'Part VB', title: 'Information about persons departing Australia' },
  { part: 'Part VI', title: 'The exportation of goods' },
  { part: 'Part VIA', title: 'Electronic communications' },
  { part: 'Part VII', title: "Ships' stores and aircraft's stores" },
  { part: 'Part VIII', title: 'The duties' },
  { part: 'Part IX', title: 'Drawbacks' },
  { part: 'Part X', title: 'The coasting trade' },
  { part: 'Part XA', title: 'Australian Trusted Trader Programme' },
  { part: 'Part XI', title: 'Agents and customs brokers' },
  { part: 'Part XII', title: 'Officers' },
  { part: 'Part XIIA', title: 'Special provisions relating to prohibited items' },
  { part: 'Part XIII', title: 'Penal provisions' },
];

// ── Schedule Definitions ───────────────────────────────────────────

const ABF_BASE = 'https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff';

const SCHEDULES: ScheduleInfo[] = [
  { id: '1', label: 'Schedule 1', title: 'Countries and places — preferential duty rates', dataSource: 'countries', abfUrl: `${ABF_BASE}/schedule-1` },
  { id: '2', label: 'Schedule 2', title: 'Interpretative Rules', dataSource: 'external', abfUrl: `${ABF_BASE}/schedule-2` },
  { id: '3', label: 'Schedule 3', title: 'Classification of goods and rates of duty', dataSource: 'sections', abfUrl: `${ABF_BASE}/schedule-3` },
  { id: '4', label: 'Schedule 4', title: 'Concessional duty rate goods', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-4`, ftaScheduleKey: 'Schedule 4' },
  { id: '4a', label: 'Schedule 4A', title: 'Singapore — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-4a`, ftaScheduleKey: 'Schedule 4A' },
  { id: '5', label: 'Schedule 5', title: 'United States — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-5`, ftaScheduleKey: 'Schedule 5' },
  { id: '6', label: 'Schedule 6', title: 'Thailand — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-6`, ftaScheduleKey: 'Schedule 6' },
  { id: '6a', label: 'Schedule 6A', title: 'Peru — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-6a`, ftaScheduleKey: 'Schedule 6A' },
  { id: '7', label: 'Schedule 7', title: 'Chile — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-7`, ftaScheduleKey: 'Schedule 7' },
  { id: '8', label: 'Schedule 8', title: 'AANZFTA — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-8`, ftaScheduleKey: 'Schedule 8' },
  { id: '8a', label: 'Schedule 8A', title: 'Pacific Island — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-8a`, ftaScheduleKey: 'Schedule 8A' },
  { id: '8b', label: 'Schedule 8B', title: 'CPTPP — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-8b`, ftaScheduleKey: 'Schedule 8B' },
  { id: '9', label: 'Schedule 9', title: 'Malaysia — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-9`, ftaScheduleKey: 'Schedule 9' },
  { id: '9a', label: 'Schedule 9A', title: 'Indonesia — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-9a`, ftaScheduleKey: 'Schedule 9A' },
  { id: '10', label: 'Schedule 10', title: 'Korea — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-10`, ftaScheduleKey: 'Schedule 10' },
  { id: '10a', label: 'Schedule 10A', title: 'India — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-10a`, ftaScheduleKey: 'Schedule 10A' },
  { id: '11', label: 'Schedule 11', title: 'Japan — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-11`, ftaScheduleKey: 'Schedule 11' },
  { id: '12', label: 'Schedule 12', title: 'China — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-12`, ftaScheduleKey: 'Schedule 12' },
  { id: '13', label: 'Schedule 13', title: 'Hong Kong — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-13`, ftaScheduleKey: 'Schedule 13' },
  { id: '14', label: 'Schedule 14', title: 'RCEP — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-14`, ftaScheduleKey: 'Schedule 14' },
  { id: '15', label: 'Schedule 15', title: 'United Kingdom — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-15`, ftaScheduleKey: 'Schedule 15' },
  { id: '16', label: 'Schedule 16', title: 'UAE — FTA exclusions', dataSource: 'fta', abfUrl: `${ABF_BASE}/schedule-16`, ftaScheduleKey: 'Schedule 16' },
];

// ── Component ──────────────────────────────────────────────────────

export default function TariffSearchPage() {
  // Search state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TariffResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<EntryResponse | null>(null);
  const [customsFields, setCustomsFields] = useState<CustomsEntryFields | null>(null);
  const [customsValue, setCustomsValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Schedule browse state
  const [activeView, setActiveView] = useState<'search' | 'schedule' | 'act'>('search');
  const [activeSchedule, setActiveSchedule] = useState<ScheduleInfo | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Schedule data
  const [sections, setSections] = useState<SectionData[]>([]);
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [countryFilter, setCountryFilter] = useState('');
  const [ftaExclusions, setFtaExclusions] = useState<FtaExclusionRow[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Search logic ─────────────────────────────────────────────────

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setTotal(0); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/tariff/search?q=${encodeURIComponent(q)}&limit=30`);
      const data = await res.json();
      setResults(data.results || []);
      setTotal(data.total || 0);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 300);
  };

  const selectTariff = async (code: string) => {
    const res = await fetch(`/api/tariff/for-entry/${encodeURIComponent(code)}`);
    if (!res.ok) return;
    const data: EntryResponse = await res.json();
    setSelectedEntry(data);
    setCustomsFields(data.customs_entry_fields);
    setCustomsValue('');
  };

  // Recalculate duty when customs value changes
  useEffect(() => {
    if (!customsFields || !customsValue) {
      if (customsFields) setCustomsFields(f => f ? { ...f, duty_payable: null } : null);
      return;
    }
    const cv = parseFloat(customsValue);
    if (isNaN(cv)) return;
    const rate = customsFields.general_duty_rate;
    let duty = 0;
    if (rate !== 'Free' && rate !== 'Free Free') {
      const m = rate.match(/^(\d+(?:\.\d+)?)\s*%/);
      if (m) duty = cv * (parseFloat(m[1]) / 100);
    }
    setCustomsFields(f => f ? { ...f, duty_payable: Math.round(duty * 100) / 100 } : null);
  }, [customsValue]);

  const gstAmount = customsValue && customsFields?.duty_payable !== null && customsFields?.duty_payable !== undefined
    ? (parseFloat(customsValue) + customsFields.duty_payable) * 0.1
    : null;
  const totalPayable = customsFields?.duty_payable !== null && customsFields?.duty_payable !== undefined && gstAmount !== null
    ? customsFields.duty_payable + gstAmount
    : null;

  // ── Schedule selection ───────────────────────────────────────────

  const selectSchedule = async (schedule: ScheduleInfo) => {
    setDropdownOpen(false);
    setActiveSchedule(schedule);
    setActiveView('schedule');
    setScheduleLoading(true);

    try {
      if (schedule.dataSource === 'countries') {
        const res = await fetch('/api/tariff/countries');
        const data = await res.json();
        setCountries(data);
        setCountryFilter('');
      } else if (schedule.dataSource === 'sections') {
        const res = await fetch('/api/tariff/sections');
        const data = await res.json();
        setSections(data);
        setExpandedSection(null);
      } else if (schedule.dataSource === 'fta' && schedule.ftaScheduleKey) {
        const res = await fetch(`/api/tariff/fta/schedule/${encodeURIComponent(schedule.ftaScheduleKey)}`);
        const data = await res.json();
        setFtaExclusions(data);
      }
    } catch {
      // If fetch fails, user can still view ABF link
    } finally {
      setScheduleLoading(false);
    }
  };

  const goHome = () => {
    setActiveView('search');
    setActiveSchedule(null);
  };

  const browseChapter = (chapterNum: number) => {
    const prefix = String(chapterNum).padStart(2, '0');
    setActiveView('search');
    setActiveSchedule(null);
    setQuery(prefix);
    search(prefix);
  };

  // ── Filtered countries ───────────────────────────────────────────

  const filteredCountries = countryFilter
    ? countries.filter(c =>
        c.country.toLowerCase().includes(countryFilter.toLowerCase()) ||
        c.abbreviation.toLowerCase().includes(countryFilter.toLowerCase()) ||
        c.category.toLowerCase().includes(countryFilter.toLowerCase())
      )
    : countries;

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#003366] text-white py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1
              className={`text-2xl font-bold ${activeView !== 'search' ? 'cursor-pointer hover:text-blue-200' : ''}`}
              onClick={activeView !== 'search' ? goHome : undefined}
            >
              Australian Tariff Classification
            </h1>
            <p className="text-sm text-blue-200">
              {activeView === 'act'
                ? 'Customs Act 1901 — Table of Contents'
                : activeView === 'schedule' && activeSchedule
                  ? `${activeSchedule.label} — ${activeSchedule.title}`
                  : 'Search the Combined Australian Customs Tariff Nomenclature'}
            </p>
          </div>

          {/* Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              Browse Schedules
              <svg className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[80vh] overflow-y-auto">
                {/* Customs Act 1901 */}
                <div className="px-3 pt-3 pb-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Legislation</p>
                </div>
                <button
                  onClick={() => { setDropdownOpen(false); setActiveView('act'); setActiveSchedule(null); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
                >
                  <span className="font-mono text-xs font-bold text-blue-700 w-24 shrink-0 pt-0.5">Act</span>
                  <span className="text-sm text-gray-700">Customs Act 1901</span>
                </button>

                <div className="border-t border-gray-100 mx-3" />

                {/* Main Schedules */}
                <div className="px-3 pt-3 pb-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Main Schedules</p>
                </div>
                {SCHEDULES.filter(s => ['1','2','3','4'].includes(s.id)).map(s => (
                  <ScheduleMenuItem key={s.id} schedule={s} onClick={() => selectSchedule(s)} />
                ))}

                <div className="border-t border-gray-100 mx-3" />

                {/* FTA Exclusion Schedules */}
                <div className="px-3 pt-3 pb-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">FTA Exclusion Schedules</p>
                </div>
                {SCHEDULES.filter(s => !['1','2','3','4'].includes(s.id)).map(s => (
                  <ScheduleMenuItem key={s.id} schedule={s} onClick={() => selectSchedule(s)} />
                ))}

                {/* ABF Link */}
                <div className="border-t border-gray-100 mx-3" />
                <a
                  href={ABF_BASE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                >
                  View all on ABF website
                  <ExternalIcon />
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeView === 'search' ? (
          // ── Search View ──────────────────────────────────────────
          <>
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by HS Code or Description
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder='e.g. 0101.21 or "live horses" or "salmon"...'
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  autoFocus
                />
                {loading && (
                  <div className="absolute right-3 top-3.5">
                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
                  </div>
                )}
              </div>
              {total > 0 && <p className="mt-2 text-sm text-gray-500">{total} results found</p>}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Results Panel */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Search Results</h2>
                {results.length === 0 && query.length >= 2 && !loading && (
                  <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                    No results found for &ldquo;{query}&rdquo;
                  </div>
                )}
                <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                  {results.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => selectTariff(r.code)}
                      className={`w-full text-left bg-white rounded-lg shadow p-4 hover:bg-blue-50 hover:border-blue-300 border-2 transition-colors ${
                        selectedEntry?.tariff_code === r.code ? 'border-blue-500 bg-blue-50' : 'border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-blue-700">{r.code}</span>
                            {r.statistical_code && (
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
                                Stat: {r.statistical_code}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 mt-1">{r.description}</p>
                          <p className="text-xs text-gray-400 mt-1">Ch.{r.chapter_number} &mdash; {r.chapter_title}</p>
                        </div>
                        <div className="text-right ml-4 shrink-0">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            r.is_free ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.duty_rate || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Customs Entry Panel */}
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">Customs Entry Fields</h2>
                {!selectedEntry ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center text-gray-400">
                    Select a tariff code to populate customs entry fields
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
                    {/* Header */}
                    <div className="p-4 bg-blue-50">
                      <h3 className="font-semibold text-blue-900">
                        {selectedEntry.tariff_code}
                        {selectedEntry.statistical_code && ` (Stat: ${selectedEntry.statistical_code})`}
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">{selectedEntry.description}</p>
                      <p className="text-xs text-blue-500 mt-1">
                        Section {selectedEntry.section.number}: {selectedEntry.section.title} &rarr; Ch.{selectedEntry.chapter.number}: {selectedEntry.chapter.title}
                      </p>
                    </div>

                    {/* Auto-populated fields */}
                    {customsFields && (
                      <div className="p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Auto-Populated Fields</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Tariff Code" value={customsFields.tariff_classification_code} />
                          <Field label="Statistical Code" value={customsFields.tariff_stat_code || '\u2014'} />
                          <Field label="Unit of Quantity" value={customsFields.unit_of_quantity} />
                          <Field label="Duty Rate" value={customsFields.general_duty_rate} highlight={customsFields.general_duty_rate === 'Free'} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500">Goods Description</label>
                          <textarea
                            className="w-full mt-1 px-3 py-2 border border-gray-200 rounded bg-gray-50 text-sm text-gray-800"
                            rows={2}
                            value={customsFields.goods_description}
                            readOnly
                          />
                        </div>

                        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider pt-2">Duty Calculation</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500">Customs Value (AUD)</label>
                            <input
                              type="number"
                              value={customsValue}
                              onChange={(e) => setCustomsValue(e.target.value)}
                              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded text-sm text-gray-900"
                              placeholder="Enter value..."
                            />
                          </div>
                          <Field
                            label="Duty Payable"
                            value={customsFields.duty_payable !== null ? `$${customsFields.duty_payable.toFixed(2)}` : '\u2014'}
                            highlight={customsFields.duty_payable === 0}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="GST Rate" value={`${customsFields.gst_rate}%`} />
                          <Field label="GST Amount" value={gstAmount !== null ? `$${gstAmount.toFixed(2)}` : '\u2014'} />
                        </div>

                        {totalPayable !== null && (
                          <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-2">
                            <div className="text-sm font-semibold text-amber-900">Total Payable</div>
                            <div className="text-2xl font-bold text-amber-700">${totalPayable.toFixed(2)}</div>
                            <div className="text-xs text-amber-600 mt-1">
                              Duty ${customsFields.duty_payable!.toFixed(2)} + GST ${gstAmount!.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* FTA Exclusions */}
                    {selectedEntry.fta_exclusions.length > 0 && (
                      <div className="p-4">
                        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                          FTA Exclusions ({selectedEntry.fta_exclusions.length})
                        </h4>
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {selectedEntry.fta_exclusions.map((f, i) => (
                            <div key={i} className="text-xs flex justify-between p-2 bg-gray-50 rounded">
                              <span className="text-gray-600">{f.fta_name || f.schedule}</span>
                              <span className="font-mono">{f.duty_rate || '\u2014'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TCO References */}
                    {selectedEntry.tco_references.length > 0 && (
                      <div className="p-4">
                        <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-2">
                          Tariff Concession Orders
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedEntry.tco_references.map((tco, i) => (
                            <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                              {tco}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : activeView === 'act' ? (
          // ── Customs Act 1901 TOC ─────────────────────────────────
          <div>
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Search
              </button>
              <a
                href={LEGISLATION_BASE}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View full Act on legislation.gov.au <ExternalIcon />
              </a>
            </div>

            <div className="bg-white rounded-lg shadow p-6 mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Customs Act 1901</h2>
              <p className="text-sm text-gray-500 mt-1">Act No. 6 of 1901 — Federal Register of Legislation</p>
            </div>

            <div className="space-y-2">
              {CUSTOMS_ACT_PARTS.map((p) => (
                <a
                  key={p.part}
                  href={LEGISLATION_BASE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white rounded-lg shadow px-4 py-3 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-blue-700 w-28 shrink-0">{p.part}</span>
                    <span className="text-gray-800">{p.title}</span>
                    <ExternalIcon className="shrink-0 ml-auto" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : activeSchedule ? (
          // ── Schedule Browse View ─────────────────────────────────
          <div>
            {/* Back + ABF link bar */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome} className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Search
              </button>
              <a
                href={activeSchedule.abfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View on ABF website <ExternalIcon />
              </a>
            </div>

            {scheduleLoading ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-500 mt-4">Loading schedule data...</p>
              </div>
            ) : activeSchedule.dataSource === 'external' ? (
              // ── External only ────────────────────────────────────
              <div className="bg-white rounded-lg shadow p-8 text-center">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{activeSchedule.label}</h2>
                <p className="text-gray-600 mb-4">{activeSchedule.title}</p>
                <p className="text-gray-500 mb-6">This schedule is available on the Australian Border Force website.</p>
                <a
                  href={activeSchedule.abfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
                >
                  Open {activeSchedule.label} on ABF <ExternalIcon />
                </a>
              </div>
            ) : activeSchedule.dataSource === 'countries' ? (
              // ── Schedule 1: Countries ────────────────────────────
              <div>
                <div className="bg-white rounded-lg shadow p-4 mb-4">
                  <input
                    type="text"
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                    placeholder="Filter countries..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                  <p className="text-xs text-gray-400 mt-2">{filteredCountries.length} of {countries.length} countries</p>
                </div>
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Country</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Code</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Schedule</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCountries.map((c) => (
                        <tr key={c.id} className="hover:bg-blue-50">
                          <td className="px-4 py-2 text-gray-800">{c.country}</td>
                          <td className="px-4 py-2 font-mono text-gray-600">{c.abbreviation}</td>
                          <td className="px-4 py-2 text-gray-600">{c.schedule}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs">{c.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : activeSchedule.dataSource === 'sections' ? (
              // ── Schedule 3: Sections & Chapters ──────────────────
              <div className="space-y-3">
                {sections.map((section) => (
                  <div key={section.number} className="bg-white rounded-lg shadow overflow-hidden">
                    <button
                      onClick={() => setExpandedSection(expandedSection === section.number ? null : section.number)}
                      className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-blue-50 transition-colors"
                    >
                      <div>
                        <span className="font-mono font-bold text-blue-700 mr-3">Section {toRoman(section.number)}</span>
                        <span className="text-gray-800">{section.title}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-4">
                        <span className="text-xs text-gray-400">{section.chapters.length} chapters</span>
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expandedSection === section.number ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>
                    {expandedSection === section.number && (
                      <div className="border-t border-gray-100 divide-y divide-gray-50">
                        {section.chapters.map((ch) => (
                          <button
                            key={ch.number}
                            onClick={() => browseChapter(ch.number)}
                            className="w-full text-left px-6 py-2 hover:bg-blue-50 flex items-center gap-3 text-sm transition-colors"
                          >
                            <span className="font-mono text-blue-600 font-medium w-8">
                              {String(ch.number).padStart(2, '0')}
                            </span>
                            <span className="text-gray-700">{ch.title}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : activeSchedule.dataSource === 'fta' ? (
              // ── FTA Exclusion Schedules ──────────────────────────
              <div>
                {ftaExclusions.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-500 mb-4">No local exclusion data available for {activeSchedule.label}.</p>
                    <a
                      href={activeSchedule.abfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors"
                    >
                      View on ABF website <ExternalIcon />
                    </a>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <p className="text-sm text-gray-500">{ftaExclusions.length} exclusions</p>
                    </div>
                    <div className="max-h-[70vh] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                          <tr>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">HS Code</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Description</th>
                            <th className="text-left px-4 py-3 font-medium text-gray-600">Duty Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {ftaExclusions.map((ex, i) => (
                            <tr key={i} className="hover:bg-blue-50">
                              <td className="px-4 py-2 font-mono text-blue-700 whitespace-nowrap">{ex.hs_code}</td>
                              <td className="px-4 py-2 text-gray-700">{ex.description}</td>
                              <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{ex.duty_rate || '\u2014'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </main>
    </div>
  );
}

// ── Helper Components ──────────────────────────────────────────────

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500">{label}</label>
      <div className={`mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono ${
        highlight ? 'text-green-700 bg-green-50 border-green-200' : 'text-gray-800'
      }`}>
        {value}
      </div>
    </div>
  );
}

function ScheduleMenuItem({ schedule, onClick }: { schedule: ScheduleInfo; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-start gap-3 transition-colors"
    >
      <span className="font-mono text-xs font-bold text-blue-700 w-24 shrink-0 pt-0.5">{schedule.label}</span>
      <span className="text-sm text-gray-700">{schedule.title}</span>
      {schedule.dataSource === 'external' && (
        <ExternalIcon className="shrink-0 mt-0.5 ml-auto" />
      )}
    </button>
  );
}

function ExternalIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={`w-3.5 h-3.5 text-gray-400 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function toRoman(num: number): string {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (num >= vals[i]) {
      result += syms[i];
      num -= vals[i];
    }
  }
  return result;
}
