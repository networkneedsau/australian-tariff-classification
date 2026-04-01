'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

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

export default function TariffSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TariffResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<EntryResponse | null>(null);
  const [customsFields, setCustomsFields] = useState<CustomsEntryFields | null>(null);
  const [customsValue, setCustomsValue] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#003366] text-white py-4 px-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">Australian Tariff Classification</h1>
          <p className="text-sm text-blue-200">Search the Combined Australian Customs Tariff Nomenclature</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6">
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
      </main>
    </div>
  );
}

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
