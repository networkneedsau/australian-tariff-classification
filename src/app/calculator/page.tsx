'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  type Scenario,
  getScenarios,
  saveScenario,
  deleteScenario,
} from '@/lib/scenarios';

// ── Types ────────────────────────────────────────────────────────────

interface TariffResult {
  id: number;
  code: string;
  description: string;
  unit: string | null;
  duty_rate: string | null;
  duty_rate_numeric: number | null;
  is_free: boolean;
}

interface CountryOption {
  id: number;
  country: string;
  abbreviation: string;
  schedule: string;
  category: string;
}

interface ExchangeRate {
  currency_code: string;
  currency_name: string;
  rate_to_aud: number;
  source: string;
}

interface FtaRateRow {
  fta_name: string;
  schedule: string;
  duty_rate_text: string;
  duty_rate_numeric: number;
  duty_amount: number;
  gst_amount: number;
  total: number;
  savings_vs_general: number;
  is_best: boolean;
}

interface GeneralRate {
  duty_rate_text: string;
  duty_rate_numeric: number;
  duty_amount: number;
  gst_amount: number;
  total: number;
}

interface FtaCompareResponse {
  tariff_code: string;
  description: string;
  unit: string | null;
  customs_value: number;
  general_rate: GeneralRate;
  fta_rates: FtaRateRow[];
  best_rate: FtaRateRow | null;
}

// ── Helpers ──────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('en-AU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ── Component ────────────────────────────────────────────────────────

export default function CalculatorPage() {
  // ── Section 1: Tariff Code Input ─────────────────────────────────
  const [hsQuery, setHsQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TariffResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState<TariffResult | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ── Section 2: FTA Comparison ────────────────────────────────────
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState('AUD');
  const [customsValueInput, setCustomsValueInput] = useState('');
  const [ftaLoading, setFtaLoading] = useState(false);
  const [ftaData, setFtaData] = useState<FtaCompareResponse | null>(null);
  const [selectedFtaIndex, setSelectedFtaIndex] = useState<number>(-1); // -1 = general rate

  // ── Section 3: Landed Cost ───────────────────────────────────────
  const [freight, setFreight] = useState('');
  const [insurance, setInsurance] = useState('');
  const [brokerFee, setBrokerFee] = useState('200');
  const [quarantineFee, setQuarantineFee] = useState('0');
  const [terminalHandling, setTerminalHandling] = useState('0');
  const [otherCharges, setOtherCharges] = useState('0');
  const [quantity, setQuantity] = useState('1');

  // ── Section 4: Scenarios ─────────────────────────────────────────
  const [scenarioName, setScenarioName] = useState('');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // ── Load countries, exchange rates, and scenarios on mount ────────
  useEffect(() => {
    fetch('/api/tariff/countries')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCountries(data);
      })
      .catch(() => {});

    fetch('/api/tariff/exchange-rates')
      .then((r) => r.json())
      .then((data) => {
        if (data?.rates) setExchangeRates(data.rates);
      })
      .catch(() => {});

    setScenarios(getScenarios());
  }, []);

  // ── Close dropdown on outside click ──────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ── Section 1: Debounced tariff search ───────────────────────────

  const searchTariff = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/tariff/search?q=${encodeURIComponent(q)}&limit=15&scope=tariff`);
        const data = await res.json();
        setSearchResults(data.results || []);
        setShowDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, []);

  function handleSelectTariff(t: TariffResult) {
    setSelectedTariff(t);
    setHsQuery(t.code);
    setShowDropdown(false);
    setFtaData(null);
    setSelectedFtaIndex(-1);
  }

  // ── Section 2: FTA Comparison ────────────────────────────────────

  function getCustomsValueAUD(): number {
    const raw = parseFloat(customsValueInput) || 0;
    if (selectedCurrency === 'AUD') return raw;
    const rate = exchangeRates.find((r) => r.currency_code === selectedCurrency);
    if (!rate || rate.rate_to_aud === 0) return raw;
    return raw / rate.rate_to_aud;
  }

  async function handleCompareFta() {
    if (!selectedTariff) return;
    const valueAUD = getCustomsValueAUD();
    if (valueAUD <= 0) return;

    setFtaLoading(true);
    setFtaData(null);
    try {
      const params = new URLSearchParams({
        code: selectedTariff.code,
        value: valueAUD.toFixed(2),
      });
      if (selectedCountry) params.set('country', selectedCountry);

      const res = await fetch(`/api/tariff/fta-compare?${params}`);
      const data = await res.json();
      if (res.ok) {
        setFtaData(data);
        // Auto-select best rate
        if (data.fta_rates?.length > 0) {
          setSelectedFtaIndex(0); // Already sorted cheapest first
        } else {
          setSelectedFtaIndex(-1);
        }
      }
    } catch {
      // ignore
    } finally {
      setFtaLoading(false);
    }
  }

  // ── Section 3: Landed Cost Calculations ──────────────────────────

  const customsValueAUD = getCustomsValueAUD();

  const activeDutyRate =
    selectedFtaIndex >= 0 && ftaData?.fta_rates?.[selectedFtaIndex]
      ? ftaData.fta_rates[selectedFtaIndex].duty_rate_numeric
      : ftaData?.general_rate?.duty_rate_numeric ?? (selectedTariff?.duty_rate_numeric ?? 0);

  const dutyAmount = customsValueAUD * (activeDutyRate / 100);
  const freightVal = parseFloat(freight) || 0;
  const insuranceVal = parseFloat(insurance) || 0;
  const brokerVal = parseFloat(brokerFee) || 0;
  const quarantineVal = parseFloat(quarantineFee) || 0;
  const terminalVal = parseFloat(terminalHandling) || 0;
  const otherVal = parseFloat(otherCharges) || 0;
  const qty = Math.max(parseInt(quantity) || 1, 1);

  // VoTI = customs value + duty + freight + insurance
  const voti = customsValueAUD + dutyAmount + freightVal + insuranceVal;
  const gstAmount = voti * 0.10;
  const totalLanded =
    customsValueAUD +
    dutyAmount +
    gstAmount +
    freightVal +
    insuranceVal +
    brokerVal +
    quarantineVal +
    terminalVal +
    otherVal;
  const perUnit = totalLanded / qty;

  // ── Section 4: Scenario CRUD ─────────────────────────────────────

  function handleSaveScenario() {
    if (!scenarioName.trim()) return;
    const saved = saveScenario({
      name: scenarioName.trim(),
      tariff_code: selectedTariff?.code || '',
      description: selectedTariff?.description || '',
      origin_country: selectedCountry,
      currency: selectedCurrency,
      customs_value: customsValueAUD,
      fta_selected:
        selectedFtaIndex >= 0 && ftaData?.fta_rates?.[selectedFtaIndex]
          ? ftaData.fta_rates[selectedFtaIndex].fta_name
          : 'General Rate',
      duty_rate: activeDutyRate,
      duty_amount: dutyAmount,
      freight: freightVal,
      insurance: insuranceVal,
      broker_fee: brokerVal,
      quarantine_fee: quarantineVal,
      terminal_handling: terminalVal,
      other_charges: otherVal,
      gst_amount: gstAmount,
      total_landed_cost: totalLanded,
      per_unit_cost: perUnit,
      quantity: qty,
    });
    setScenarios(getScenarios());
    setScenarioName('');
  }

  function handleDeleteScenario(id: string) {
    deleteScenario(id);
    setScenarios(getScenarios());
    setCompareIds((prev) => prev.filter((cid) => cid !== id));
  }

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((cid) => cid !== id);
      if (prev.length >= 4) return prev; // max 4
      return [...prev, id];
    });
  }

  const compareScenarios = scenarios.filter((s) => compareIds.includes(s.id));

  // ── Render ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <header className="bg-gradient-to-r from-[#001a33] to-[#003366] text-white py-2 px-6 shadow-lg">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Duty &amp; Cost Calculator</h1>
            <p className="text-sm text-blue-200">
              FTA comparison, landed cost &amp; what-if scenarios
            </p>
          </div>
          <Link
            href="/search"
            className="text-sm text-blue-200 hover:text-white transition-colors"
          >
            &larr; Back to Tariff Search
          </Link>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 py-6 space-y-6">
        {/* ================================================================
            SECTION 1: Tariff Code Input
            ================================================================ */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-[#003366] mb-4">
            1. Select Tariff Code
          </h2>

          <div className="relative" ref={dropdownRef}>
            <input
              type="text"
              value={hsQuery}
              onChange={(e) => {
                setHsQuery(e.target.value);
                searchTariff(e.target.value);
                if (selectedTariff) setSelectedTariff(null);
              }}
              placeholder="Search by HS code or description..."
              className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchLoading && (
              <div className="absolute right-3 top-3 text-gray-400 text-xs">
                Searching...
              </div>
            )}

            {/* Dropdown results */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleSelectTariff(r)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-gray-100 last:border-0"
                  >
                    <span className="font-mono text-sm text-[#003366] font-semibold">
                      {r.code}
                    </span>
                    <span className="ml-2 text-sm text-gray-600 line-clamp-1">
                      {r.description}
                    </span>
                    {r.duty_rate && (
                      <span className="ml-2 text-xs text-gray-400">
                        ({r.duty_rate})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected tariff details */}
          {selectedTariff && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Code</span>
                  <p className="font-mono font-semibold text-[#003366]">
                    {selectedTariff.code}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-gray-500">Description</span>
                  <p className="font-medium text-gray-800">
                    {selectedTariff.description}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">General Duty Rate</span>
                  <p className="font-semibold text-gray-800">
                    {selectedTariff.duty_rate || 'Free'}
                  </p>
                </div>
                {selectedTariff.unit && (
                  <div>
                    <span className="text-gray-500">Unit</span>
                    <p className="text-gray-800">{selectedTariff.unit}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ================================================================
            SECTION 2: FTA Comparison
            ================================================================ */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-[#003366] mb-4">
            2. FTA Rate Comparison
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Origin Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select country --</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.abbreviation}>
                    {c.country} ({c.abbreviation})
                  </option>
                ))}
              </select>
            </div>

            {/* Customs value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customs Value
              </label>
              <input
                type="number"
                value={customsValueInput}
                onChange={(e) => setCustomsValueInput(e.target.value)}
                placeholder="e.g. 10000"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="AUD">AUD - Australian Dollar</option>
                {exchangeRates.map((r) => (
                  <option key={r.currency_code} value={r.currency_code}>
                    {r.currency_code} - {r.currency_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Compare button */}
            <div className="flex items-end">
              <button
                onClick={handleCompareFta}
                disabled={!selectedTariff || ftaLoading || !customsValueInput}
                className="w-full bg-[#003366] text-white rounded px-4 py-2 text-sm font-medium hover:bg-[#004488] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {ftaLoading ? 'Comparing...' : 'Compare FTA Rates'}
              </button>
            </div>
          </div>

          {selectedCurrency !== 'AUD' && customsValueInput && (
            <p className="text-xs text-gray-500 mb-3">
              Converted to AUD: ${fmt(getCustomsValueAUD())}
            </p>
          )}

          {/* FTA Results Table */}
          {ftaData && (
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-medium text-gray-600">
                      Select
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">
                      Rate Type
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">
                      Schedule
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">
                      Duty Rate
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">
                      Duty Amount
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">
                      GST
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">
                      Total
                    </th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">
                      Savings
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* General rate row */}
                  <tr
                    className={`border-b border-gray-100 cursor-pointer ${
                      selectedFtaIndex === -1
                        ? 'bg-blue-50 ring-1 ring-blue-300'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedFtaIndex(-1)}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="radio"
                        checked={selectedFtaIndex === -1}
                        onChange={() => setSelectedFtaIndex(-1)}
                        className="accent-blue-600"
                      />
                    </td>
                    <td className="px-3 py-2 font-medium text-gray-800">
                      General Rate
                    </td>
                    <td className="px-3 py-2 text-gray-500">Schedule 3</td>
                    <td className="px-3 py-2 text-right font-mono">
                      {ftaData.general_rate.duty_rate_text}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      ${fmt(ftaData.general_rate.duty_amount)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      ${fmt(ftaData.general_rate.gst_amount)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">
                      ${fmt(ftaData.general_rate.total)}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400">
                      --
                    </td>
                  </tr>

                  {/* FTA rate rows */}
                  {ftaData.fta_rates.map((fta, idx) => (
                    <tr
                      key={`${fta.schedule}-${idx}`}
                      className={`border-b border-gray-100 cursor-pointer ${
                        fta.is_best
                          ? 'bg-green-50'
                          : ''
                      } ${
                        selectedFtaIndex === idx
                          ? 'ring-1 ring-blue-300 bg-blue-50'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedFtaIndex(idx)}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="radio"
                          checked={selectedFtaIndex === idx}
                          onChange={() => setSelectedFtaIndex(idx)}
                          className="accent-blue-600"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-gray-800">
                        {fta.fta_name}
                        {fta.is_best && (
                          <span className="ml-2 inline-block bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                            Best Rate
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-500">{fta.schedule}</td>
                      <td className="px-3 py-2 text-right font-mono">
                        {fta.duty_rate_text}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        ${fmt(fta.duty_amount)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        ${fmt(fta.gst_amount)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-semibold">
                        ${fmt(fta.total)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-green-600 font-semibold">
                        {fta.savings_vs_general > 0
                          ? `$${fmt(fta.savings_vs_general)}`
                          : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {ftaData.fta_rates.length === 0 && (
                <p className="text-sm text-gray-500 mt-3 italic">
                  No FTA exclusions found for this tariff code. Only the general
                  rate applies.
                </p>
              )}
            </div>
          )}
        </section>

        {/* ================================================================
            SECTION 3: Landed Cost Calculator
            ================================================================ */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-[#003366] mb-4">
            3. Landed Cost Breakdown
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Freight (AUD)
              </label>
              <input
                type="number"
                value={freight}
                onChange={(e) => setFreight(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Insurance (AUD)
              </label>
              <input
                type="number"
                value={insurance}
                onChange={(e) => setInsurance(e.target.value)}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Broker Fee (AUD)
              </label>
              <input
                type="number"
                value={brokerFee}
                onChange={(e) => setBrokerFee(e.target.value)}
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Quarantine (AUD)
              </label>
              <input
                type="number"
                value={quarantineFee}
                onChange={(e) => setQuarantineFee(e.target.value)}
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Terminal (AUD)
              </label>
              <input
                type="number"
                value={terminalHandling}
                onChange={(e) => setTerminalHandling(e.target.value)}
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Other (AUD)
              </label>
              <input
                type="number"
                value={otherCharges}
                onChange={(e) => setOtherCharges(e.target.value)}
                min="0"
                step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                step="1"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Breakdown card */}
          <div className="bg-gradient-to-br from-[#001a33] to-[#003366] text-white rounded-lg p-6">
            <h3 className="text-base font-semibold mb-4 text-blue-200">
              Cost Breakdown
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3 gap-x-6 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-200">Customs Value</span>
                <span className="font-mono">${fmt(customsValueAUD)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">
                  Duty ({activeDutyRate}%)
                </span>
                <span className="font-mono">${fmt(dutyAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Freight</span>
                <span className="font-mono">${fmt(freightVal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Insurance</span>
                <span className="font-mono">${fmt(insuranceVal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">VoTI</span>
                <span className="font-mono">${fmt(voti)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">GST (10%)</span>
                <span className="font-mono">${fmt(gstAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Broker Fee</span>
                <span className="font-mono">${fmt(brokerVal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Other Charges</span>
                <span className="font-mono">
                  ${fmt(quarantineVal + terminalVal + otherVal)}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-blue-400/30 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-blue-200 text-xs uppercase tracking-wide">
                  Total Landed Cost
                </p>
                <p className="text-3xl font-bold mt-1">${fmt(totalLanded)}</p>
              </div>
              <div className="text-center">
                <p className="text-blue-200 text-xs uppercase tracking-wide">
                  Per Unit Cost ({qty} units)
                </p>
                <p className="text-3xl font-bold mt-1">${fmt(perUnit)}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================
            SECTION 4: Scenarios
            ================================================================ */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-[#003366] mb-4">
            4. What-If Scenarios
          </h2>

          {/* Save form */}
          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              placeholder="Scenario name (e.g. Option A - China FTA)"
              className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSaveScenario}
              disabled={!scenarioName.trim() || customsValueAUD <= 0}
              className="bg-[#003366] text-white rounded px-5 py-2 text-sm font-medium hover:bg-[#004488] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save Scenario
            </button>
          </div>

          {/* Compare toggle */}
          {scenarios.length >= 2 && (
            <div className="flex items-center gap-3 mb-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={compareMode}
                  onChange={(e) => {
                    setCompareMode(e.target.checked);
                    if (!e.target.checked) setCompareIds([]);
                  }}
                  className="accent-blue-600"
                />
                Compare Mode
              </label>
              {compareMode && (
                <span className="text-xs text-gray-500">
                  Select 2-4 scenarios to compare side by side
                </span>
              )}
            </div>
          )}

          {/* Scenario list */}
          {scenarios.length > 0 ? (
            <div className="space-y-2">
              {scenarios.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between border rounded-lg px-4 py-3 text-sm ${
                    compareIds.includes(s.id)
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {compareMode && (
                      <input
                        type="checkbox"
                        checked={compareIds.includes(s.id)}
                        onChange={() => toggleCompare(s.id)}
                        disabled={
                          !compareIds.includes(s.id) && compareIds.length >= 4
                        }
                        className="accent-blue-600 flex-shrink-0"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {s.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {s.tariff_code} | {s.fta_selected} | Total: $
                        {fmt(s.total_landed_cost)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteScenario(s.id)}
                    className="text-red-500 hover:text-red-700 text-xs ml-3 flex-shrink-0"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">
              No saved scenarios yet. Fill in the calculator above and save one.
            </p>
          )}

          {/* Side-by-side comparison */}
          {compareMode && compareScenarios.length >= 2 && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-medium text-gray-600">
                      Field
                    </th>
                    {compareScenarios.map((s) => (
                      <th
                        key={s.id}
                        className="text-right px-3 py-2 font-medium text-gray-600"
                      >
                        {s.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Tariff Code', key: 'tariff_code' },
                    { label: 'FTA', key: 'fta_selected' },
                    { label: 'Duty Rate', key: 'duty_rate', suffix: '%' },
                    { label: 'Customs Value', key: 'customs_value', dollar: true },
                    { label: 'Duty Amount', key: 'duty_amount', dollar: true },
                    { label: 'Freight', key: 'freight', dollar: true },
                    { label: 'Insurance', key: 'insurance', dollar: true },
                    { label: 'Broker Fee', key: 'broker_fee', dollar: true },
                    { label: 'GST', key: 'gst_amount', dollar: true },
                    {
                      label: 'Total Landed Cost',
                      key: 'total_landed_cost',
                      dollar: true,
                      bold: true,
                    },
                    {
                      label: 'Per Unit Cost',
                      key: 'per_unit_cost',
                      dollar: true,
                      bold: true,
                    },
                    { label: 'Quantity', key: 'quantity' },
                  ].map((row) => {
                    // Find the minimum total for highlighting
                    const values = compareScenarios.map(
                      (s) => (s as any)[row.key]
                    );
                    const minVal =
                      row.dollar && row.bold
                        ? Math.min(
                            ...values.filter((v: any) => typeof v === 'number')
                          )
                        : null;

                    return (
                      <tr
                        key={row.key}
                        className={`border-b border-gray-100 ${
                          row.bold ? 'bg-gray-50 font-semibold' : ''
                        }`}
                      >
                        <td className="px-3 py-2 text-gray-600">{row.label}</td>
                        {compareScenarios.map((s) => {
                          const val = (s as any)[row.key];
                          const isMin =
                            minVal !== null &&
                            typeof val === 'number' &&
                            val === minVal;
                          return (
                            <td
                              key={s.id}
                              className={`px-3 py-2 text-right font-mono ${
                                isMin ? 'text-green-600' : ''
                              }`}
                            >
                              {row.dollar && typeof val === 'number'
                                ? `$${fmt(val)}`
                                : row.suffix && typeof val === 'number'
                                  ? `${val}${row.suffix}`
                                  : val ?? '--'}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
