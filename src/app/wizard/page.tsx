'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';

// ── Types ──────────────────────────────────────────────────────────

interface FtaOption {
  fta_schedule: string;
  fta_name: string;
}

interface TariffResult {
  id: number;
  code: string;
  description: string;
  unit: string | null;
  duty_rate: string | null;
  duty_rate_numeric: number | null;
  is_free: boolean;
  chapter_number: number;
  chapter_title: string;
  heading_code: string;
  heading_description: string;
}

interface MaterialInput {
  id: number;
  hsCode: string;
  description: string;
  value: number;
  isOriginating: boolean;
}

interface RooRule {
  id: number;
  fta_schedule: string;
  fta_name: string;
  chapter_start: number;
  chapter_end: number;
  rule_type: string;
  rule_description: string;
  rvc_threshold: number | null;
  ctc_level: string | null;
  specific_requirements: string | null;
  notes: string | null;
}

interface RuleAssessment {
  rule: RooRule;
  passed: boolean | null; // null = unanswered
}

// ── FTA descriptions (fallback) ─────────────────────────────────────

const FTA_DESCRIPTIONS_FALLBACK: Record<string, string> = {
  ChAFTA: 'China-Australia Free Trade Agreement. Covers goods traded between Australia and China with preferential tariff rates.',
  KAFTA: 'Korea-Australia Free Trade Agreement. Provides preferential access for goods traded between Australia and South Korea.',
  JAEPA: 'Japan-Australia Economic Partnership Agreement. Comprehensive EPA covering goods, services, and investment.',
  AANZFTA: 'ASEAN-Australia-New Zealand Free Trade Agreement. Regional FTA covering 10 ASEAN nations plus Australia and New Zealand.',
  CPTPP: 'Comprehensive and Progressive Agreement for Trans-Pacific Partnership. Multilateral FTA among 11 Pacific Rim countries.',
  'A-UKFTA': 'Australia-United Kingdom Free Trade Agreement. Bilateral FTA providing preferential trade access.',
};

// ── Helpers ─────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

let nextMatId = 1;

// ── Component ──────────────────────────────────────────────────────

export default function WizardPage() {
  const [step, setStep] = useState(1);

  // Step 1: FTA selection
  const [ftas, setFtas] = useState<FtaOption[]>([]);
  const [selectedFta, setSelectedFta] = useState<FtaOption | null>(null);
  const [ftaLoading, setFtaLoading] = useState(false);

  // Step 2: Product details
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TariffResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<TariffResult | null>(null);
  const [fobValue, setFobValue] = useState<string>('');
  const [materials, setMaterials] = useState<MaterialInput[]>([]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 3: Rules check
  const [rules, setRules] = useState<RooRule[]>([]);
  const [preferenceRate, setPreferenceRate] = useState<string | null>(null);
  const [assessments, setAssessments] = useState<RuleAssessment[]>([]);
  const [rulesLoading, setRulesLoading] = useState(false);

  // Dynamic FTA descriptions from preference_schemes API
  const [ftaDescriptions, setFtaDescriptions] = useState<Record<string, string>>(FTA_DESCRIPTIONS_FALLBACK);

  // ── Step 1: Load FTAs ──────────────────────────────────────────

  useEffect(() => {
    setFtaLoading(true);
    fetch('/api/tariff/roo')
      .then((r) => r.json())
      .then((data) => {
        if (data.ftas) setFtas(data.ftas);
      })
      .catch(() => {})
      .finally(() => setFtaLoading(false));

    // Load preference scheme descriptions (enrich FTA names)
    fetch('/api/tariff/preference-schemes')
      .then((r) => r.json())
      .then((data) => {
        if (data.schemes && data.schemes.length > 0) {
          const map: Record<string, string> = { ...FTA_DESCRIPTIONS_FALLBACK };
          for (const s of data.schemes) {
            if (s.scheme_code && s.scheme_name) {
              map[s.scheme_code] = s.scheme_name;
            }
          }
          setFtaDescriptions(map);
        }
      })
      .catch(() => { /* keep fallback */ });
  }, []);

  // ── Step 2: Product search (debounced) ─────────────────────────

  const doSearch = useCallback((q: string) => {
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    fetch(`/api/tariff/search?q=${encodeURIComponent(q)}&limit=10&scope=tariff`)
      .then((r) => r.json())
      .then((data) => setSearchResults(data.results || []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  }, []);

  function handleSearchChange(val: string) {
    setSearchQuery(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(val), 300);
  }

  function selectProduct(p: TariffResult) {
    setSelectedProduct(p);
    setSearchResults([]);
    setSearchQuery(p.code + ' — ' + p.description.substring(0, 60));
  }

  function addMaterial() {
    setMaterials((prev) => [
      ...prev,
      { id: nextMatId++, hsCode: '', description: '', value: 0, isOriginating: false },
    ]);
  }

  function updateMaterial(id: number, field: keyof MaterialInput, value: string | number | boolean) {
    setMaterials((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );
  }

  function removeMaterial(id: number) {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }

  // ── Step 3: Fetch rules ────────────────────────────────────────

  async function loadRules() {
    if (!selectedFta || !selectedProduct) return;
    setRulesLoading(true);
    try {
      const res = await fetch(
        `/api/tariff/roo?fta=${encodeURIComponent(selectedFta.fta_schedule)}&code=${encodeURIComponent(selectedProduct.code)}`,
      );
      const data = await res.json();
      const fetchedRules: RooRule[] = data.rules || [];
      setRules(fetchedRules);
      setPreferenceRate(data.preferenceRate || null);

      // Build assessments, auto-calculating RVC
      const fob = parseFloat(fobValue) || 0;
      const nonOrigValue = materials
        .filter((m) => !m.isOriginating)
        .reduce((sum, m) => sum + (m.value || 0), 0);
      const rvcPercent = fob > 0 ? ((fob - nonOrigValue) / fob) * 100 : 0;

      setAssessments(
        fetchedRules.map((rule) => {
          let passed: boolean | null = null;
          if (rule.rule_type === 'RVC' && rule.rvc_threshold != null && fob > 0) {
            passed = rvcPercent >= rule.rvc_threshold;
          }
          return { rule, passed };
        }),
      );
    } catch {
      setRules([]);
      setAssessments([]);
    } finally {
      setRulesLoading(false);
    }
  }

  function setRulePassed(ruleId: number, passed: boolean) {
    setAssessments((prev) =>
      prev.map((a) => (a.rule.id === ruleId ? { ...a, passed } : a)),
    );
  }

  // ── Derived values ─────────────────────────────────────────────

  const fob = parseFloat(fobValue) || 0;
  const nonOrigValue = materials
    .filter((m) => !m.isOriginating)
    .reduce((sum, m) => sum + (m.value || 0), 0);
  const rvcPercent = fob > 0 ? ((fob - nonOrigValue) / fob) * 100 : 0;

  // Step 4: Determination — eligible if ANY rule passes
  const allAssessed = assessments.length > 0 && assessments.every((a) => a.passed !== null);
  const anyPassed = assessments.some((a) => a.passed === true);

  // ── Export assessment as text ──────────────────────────────────

  function exportAssessment() {
    const lines: string[] = [];
    lines.push('RULES OF ORIGIN ASSESSMENT');
    lines.push('='.repeat(50));
    lines.push(`Date: ${new Date().toLocaleDateString('en-AU')}`);
    lines.push(`FTA: ${selectedFta?.fta_name} (${selectedFta?.fta_schedule})`);
    lines.push(`Product: ${selectedProduct?.code} — ${selectedProduct?.description}`);
    lines.push(`FOB Value: AUD ${fmt(fob)}`);
    lines.push(`Non-originating Materials Value: AUD ${fmt(nonOrigValue)}`);
    lines.push(`RVC: ${rvcPercent.toFixed(1)}%`);
    if (preferenceRate) lines.push(`Preferential Rate: ${preferenceRate}`);
    lines.push('');
    lines.push('RULES ASSESSED:');
    lines.push('-'.repeat(50));
    for (const a of assessments) {
      const status = a.passed === true ? 'PASS' : a.passed === false ? 'FAIL' : 'N/A';
      lines.push(`[${status}] ${a.rule.rule_type}: ${a.rule.rule_description}`);
      if (a.rule.rvc_threshold != null) {
        lines.push(`       Threshold: ${a.rule.rvc_threshold}% | Calculated: ${rvcPercent.toFixed(1)}%`);
      }
    }
    lines.push('');
    lines.push(`RESULT: ${anyPassed ? 'ELIGIBLE for preferential treatment' : 'NOT ELIGIBLE'}`);
    lines.push('');
    lines.push('DISCLAIMER: This is an indicative assessment only. Consult ABF for binding determinations.');

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ROO-Assessment-${selectedProduct?.code}-${selectedFta?.fta_name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function startOver() {
    setStep(1);
    setSelectedFta(null);
    setSelectedProduct(null);
    setSearchQuery('');
    setFobValue('');
    setMaterials([]);
    setRules([]);
    setAssessments([]);
    setPreferenceRate(null);
  }

  // ── Render ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-950 text-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold tracking-tight hover:text-blue-200 transition-colors">
              Australian Tariff
            </Link>
            <span className="text-blue-300">/</span>
            <h1 className="text-lg font-semibold">Rules of Origin Wizard</h1>
          </div>
          <Link
            href="/calculator"
            className="text-sm text-blue-200 hover:text-white transition-colors"
          >
            Duty Calculator
          </Link>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    s < step
                      ? 'bg-green-600 text-white'
                      : s === step
                        ? 'bg-blue-900 text-white'
                        : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {s < step ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s
                  )}
                </div>
                <span
                  className={`text-sm font-medium hidden sm:inline ${
                    s === step ? 'text-blue-900' : 'text-slate-400'
                  }`}
                >
                  {s === 1 ? 'Select FTA' : s === 2 ? 'Product Details' : s === 3 ? 'Rules Check' : 'Result'}
                </span>
                {s < 4 && <div className={`flex-1 h-0.5 ${s < step ? 'bg-green-500' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* ── Step 1: Select FTA ──────────────────────────────────── */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-blue-950 mb-1">Step 1: Select Free Trade Agreement</h2>
            <p className="text-sm text-slate-500 mb-6">
              Choose the FTA you want to assess origin eligibility against.
            </p>

            {ftaLoading ? (
              <div className="text-slate-400 text-sm py-8 text-center">Loading available FTAs...</div>
            ) : ftas.length === 0 ? (
              <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                No rules of origin data found. Run the seed script:{' '}
                <code className="bg-amber-100 px-1 rounded">npx tsx scripts/seed-roo.ts</code>
              </div>
            ) : (
              <div className="space-y-3">
                {ftas.map((f) => (
                  <button
                    key={f.fta_schedule}
                    onClick={() => setSelectedFta(f)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedFta?.fta_schedule === f.fta_schedule
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-blue-950">{f.fta_name}</span>
                        <span className="text-xs text-slate-400 ml-2">({f.fta_schedule.replace('SCHEDULE_', 'Schedule ')})</span>
                      </div>
                      {selectedFta?.fta_schedule === f.fta_schedule && (
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    {ftaDescriptions[f.fta_name] && (
                      <p className="text-sm text-slate-500 mt-1">{ftaDescriptions[f.fta_name]}</p>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedFta}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  selectedFta
                    ? 'bg-blue-900 text-white hover:bg-blue-800'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Next: Product Details
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Product Details ─────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-blue-950 mb-1">Step 2: Product Details</h2>
              <p className="text-sm text-slate-500 mb-6">
                Search for and select the HS code, then enter FOB value and material inputs.
              </p>

              {/* HS Code Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">HS Code / Product Search</label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Type HS code or product description..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {searchLoading && (
                    <div className="absolute right-3 top-3 text-slate-400 text-xs">Searching...</div>
                  )}
                </div>

                {/* Search results dropdown */}
                {searchResults.length > 0 && (
                  <div className="mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {searchResults.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => selectProduct(r)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 border-b border-slate-100 last:border-0"
                      >
                        <span className="font-mono text-sm text-blue-900 font-semibold">{r.code}</span>
                        <span className="text-sm text-slate-600 ml-2">
                          {r.description.length > 80 ? r.description.substring(0, 80) + '...' : r.description}
                        </span>
                        {r.duty_rate && (
                          <span className="text-xs text-slate-400 ml-2">({r.duty_rate})</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected product card */}
              {selectedProduct && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-sm font-bold text-blue-900">{selectedProduct.code}</span>
                      <p className="text-sm text-slate-700 mt-1">{selectedProduct.description}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Chapter {selectedProduct.chapter_number}: {selectedProduct.chapter_title}
                        {selectedProduct.duty_rate && ` | General rate: ${selectedProduct.duty_rate}`}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProduct(null);
                        setSearchQuery('');
                      }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* FOB Value */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">FOB Value (AUD)</label>
                <input
                  type="number"
                  value={fobValue}
                  onChange={(e) => setFobValue(e.target.value)}
                  placeholder="e.g. 50000"
                  min="0"
                  step="0.01"
                  className="w-64 px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Materials table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-blue-950">Input Materials</h3>
                  <p className="text-sm text-slate-500">
                    List non-originating materials used to produce the goods (for RVC calculation).
                  </p>
                </div>
                <button
                  onClick={addMaterial}
                  className="px-4 py-2 bg-blue-900 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors"
                >
                  + Add Material
                </button>
              </div>

              {materials.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  No materials added. Click &quot;Add Material&quot; to add input materials for RVC calculation.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 pr-2 text-slate-600 font-medium">HS Code</th>
                        <th className="text-left py-2 pr-2 text-slate-600 font-medium">Description</th>
                        <th className="text-right py-2 pr-2 text-slate-600 font-medium">Value (AUD)</th>
                        <th className="text-center py-2 pr-2 text-slate-600 font-medium">Originating?</th>
                        <th className="w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((m) => (
                        <tr key={m.id} className="border-b border-slate-100">
                          <td className="py-2 pr-2">
                            <input
                              type="text"
                              value={m.hsCode}
                              onChange={(e) => updateMaterial(m.id, 'hsCode', e.target.value)}
                              placeholder="e.g. 7208.10"
                              className="w-28 px-2 py-1.5 border border-slate-300 rounded text-sm"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="text"
                              value={m.description}
                              onChange={(e) => updateMaterial(m.id, 'description', e.target.value)}
                              placeholder="Material description"
                              className="w-full px-2 py-1.5 border border-slate-300 rounded text-sm"
                            />
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              type="number"
                              value={m.value || ''}
                              onChange={(e) => updateMaterial(m.id, 'value', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              className="w-28 px-2 py-1.5 border border-slate-300 rounded text-sm text-right"
                            />
                          </td>
                          <td className="py-2 pr-2 text-center">
                            <input
                              type="checkbox"
                              checked={m.isOriginating}
                              onChange={(e) => updateMaterial(m.id, 'isOriginating', e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="py-2">
                            <button
                              onClick={() => removeMaterial(m.id)}
                              className="text-slate-400 hover:text-red-500"
                              title="Remove"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* RVC summary */}
              {fob > 0 && materials.length > 0 && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg text-sm">
                  <span className="text-slate-600">
                    FOB: <strong>AUD {fmt(fob)}</strong> | Non-originating:{' '}
                    <strong>AUD {fmt(nonOrigValue)}</strong> | RVC:{' '}
                    <strong className={rvcPercent >= 40 ? 'text-green-700' : 'text-amber-700'}>
                      {rvcPercent.toFixed(1)}%
                    </strong>
                  </span>
                </div>
              )}
            </div>

            {/* Nav buttons */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2.5 rounded-lg font-medium text-sm text-slate-600 hover:text-slate-800 border border-slate-300 hover:border-slate-400 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => {
                  loadRules();
                  setStep(3);
                }}
                disabled={!selectedProduct}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  selectedProduct
                    ? 'bg-blue-900 text-white hover:bg-blue-800'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Next: Rules Check
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Rules Check ─────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-blue-950 mb-1">Step 3: Rules of Origin Check</h2>
              <p className="text-sm text-slate-500 mb-6">
                Review each applicable rule for <strong>{selectedFta?.fta_name}</strong> and indicate
                whether your goods satisfy it. Goods are eligible if <em>any</em> applicable rule is met.
              </p>

              {rulesLoading ? (
                <div className="text-slate-400 text-sm py-8 text-center">Loading applicable rules...</div>
              ) : assessments.length === 0 ? (
                <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm">
                  No rules of origin found for Chapter {selectedProduct?.chapter_number} under{' '}
                  {selectedFta?.fta_name}. This chapter may not have specific rules in the seed data.
                </div>
              ) : (
                <div className="space-y-4">
                  {assessments.map((a) => (
                    <div
                      key={a.rule.id}
                      className={`border-2 rounded-lg p-4 transition-colors ${
                        a.passed === true
                          ? 'border-green-300 bg-green-50'
                          : a.passed === false
                            ? 'border-red-300 bg-red-50'
                            : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold ${
                                a.rule.rule_type === 'WO'
                                  ? 'bg-purple-100 text-purple-800'
                                  : a.rule.rule_type === 'CTC'
                                    ? 'bg-blue-100 text-blue-800'
                                    : a.rule.rule_type === 'RVC'
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {a.rule.rule_type}
                            </span>
                            {a.rule.ctc_level && (
                              <span className="text-xs text-slate-500">({a.rule.ctc_level} level)</span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-800">{a.rule.rule_description}</p>

                          {/* Rule-specific prompts */}
                          {a.rule.rule_type === 'CTC' && (
                            <p className="text-sm text-slate-600 mt-2 italic">
                              Were all non-originating materials classified under a different{' '}
                              {a.rule.ctc_level || 'heading'} than the finished good?
                            </p>
                          )}
                          {a.rule.rule_type === 'WO' && (
                            <p className="text-sm text-slate-600 mt-2 italic">
                              Were the goods wholly obtained or produced in the FTA partner country?
                            </p>
                          )}
                          {a.rule.rule_type === 'SP' && a.rule.specific_requirements && (
                            <p className="text-sm text-slate-600 mt-2 italic">
                              {a.rule.specific_requirements}
                            </p>
                          )}
                          {a.rule.rule_type === 'RVC' && a.rule.rvc_threshold != null && (
                            <div className="mt-2 p-2 bg-white/70 rounded border border-slate-200 text-sm">
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                  <div className="text-slate-500 text-xs">Threshold</div>
                                  <div className="font-bold text-slate-800">{a.rule.rvc_threshold}%</div>
                                </div>
                                <div>
                                  <div className="text-slate-500 text-xs">Your RVC</div>
                                  <div
                                    className={`font-bold ${
                                      rvcPercent >= a.rule.rvc_threshold ? 'text-green-700' : 'text-red-700'
                                    }`}
                                  >
                                    {fob > 0 ? rvcPercent.toFixed(1) + '%' : 'N/A'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-slate-500 text-xs">Status</div>
                                  <div
                                    className={`font-bold ${
                                      fob > 0 && rvcPercent >= a.rule.rvc_threshold
                                        ? 'text-green-700'
                                        : 'text-red-700'
                                    }`}
                                  >
                                    {fob > 0
                                      ? rvcPercent >= a.rule.rvc_threshold
                                        ? 'Met'
                                        : 'Not met'
                                      : 'Enter FOB'}
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                Formula: (FOB - Non-originating) / FOB x 100 = ({fmt(fob)} - {fmt(nonOrigValue)}) / {fmt(fob)} x 100
                              </p>
                            </div>
                          )}
                          {a.rule.notes && (
                            <p className="text-xs text-slate-500 mt-2">{a.rule.notes}</p>
                          )}
                        </div>

                        {/* Pass/Fail toggle — auto for RVC, manual for others */}
                        {a.rule.rule_type !== 'RVC' && (
                          <div className="flex flex-col items-center gap-1 min-w-[80px]">
                            <span className="text-xs text-slate-500 mb-1">Satisfied?</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setRulePassed(a.rule.id, true)}
                                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                                  a.passed === true
                                    ? 'bg-green-600 text-white'
                                    : 'bg-slate-100 text-slate-500 hover:bg-green-100'
                                }`}
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setRulePassed(a.rule.id, false)}
                                className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                                  a.passed === false
                                    ? 'bg-red-600 text-white'
                                    : 'bg-slate-100 text-slate-500 hover:bg-red-100'
                                }`}
                              >
                                No
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-lg font-medium text-sm text-slate-600 hover:text-slate-800 border border-slate-300 hover:border-slate-400 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={assessments.length === 0 || !allAssessed}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors ${
                  assessments.length > 0 && allAssessed
                    ? 'bg-blue-900 text-white hover:bg-blue-800'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                Next: View Result
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Result ──────────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-6">
            {/* Result card */}
            <div
              className={`rounded-xl shadow-sm border-2 p-8 text-center ${
                anyPassed
                  ? 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-300'
              }`}
            >
              <div className="mb-4">
                {anyPassed ? (
                  <svg className="w-16 h-16 mx-auto text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-16 h-16 mx-auto text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>

              <h2 className={`text-2xl font-bold mb-2 ${anyPassed ? 'text-green-800' : 'text-red-800'}`}>
                {anyPassed
                  ? `Your goods appear to qualify for preferential treatment under ${selectedFta?.fta_name}`
                  : `Your goods do not appear to meet the rules of origin for ${selectedFta?.fta_name}`}
              </h2>

              {preferenceRate && anyPassed && (
                <p className="text-lg text-green-700 mt-2">
                  Applicable preferential duty rate: <strong>{preferenceRate}</strong>
                </p>
              )}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-blue-950 mb-4">Assessment Summary</h3>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <span className="text-slate-500">FTA:</span>{' '}
                  <strong>{selectedFta?.fta_name}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Product:</span>{' '}
                  <strong className="font-mono">{selectedProduct?.code}</strong>
                </div>
                <div>
                  <span className="text-slate-500">FOB Value:</span>{' '}
                  <strong>AUD {fmt(fob)}</strong>
                </div>
                <div>
                  <span className="text-slate-500">RVC:</span>{' '}
                  <strong>{rvcPercent.toFixed(1)}%</strong>
                </div>
              </div>

              <div className="space-y-2">
                {assessments.map((a) => (
                  <div
                    key={a.rule.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      a.passed ? 'bg-green-50' : 'bg-red-50'
                    }`}
                  >
                    {a.passed ? (
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    <div className="flex-1">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold mr-2 ${
                          a.rule.rule_type === 'WO'
                            ? 'bg-purple-100 text-purple-800'
                            : a.rule.rule_type === 'CTC'
                              ? 'bg-blue-100 text-blue-800'
                              : a.rule.rule_type === 'RVC'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {a.rule.rule_type}
                      </span>
                      <span className="text-sm text-slate-700">{a.rule.rule_description}</span>
                    </div>
                    <span
                      className={`text-xs font-bold ${a.passed ? 'text-green-700' : 'text-red-700'}`}
                    >
                      {a.passed ? 'PASS' : 'FAIL'}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-xs text-slate-500 italic">
                Disclaimer: This is an indicative assessment only and does not constitute legal advice.
                Consult the Australian Border Force for binding origin determinations.
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between">
              <button
                onClick={startOver}
                className="px-6 py-2.5 rounded-lg font-medium text-sm text-slate-600 hover:text-slate-800 border border-slate-300 hover:border-slate-400 transition-colors"
              >
                Start Over
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 rounded-lg font-medium text-sm text-slate-600 hover:text-slate-800 border border-slate-300 hover:border-slate-400 transition-colors"
                >
                  Back to Rules
                </button>
                <button
                  onClick={exportAssessment}
                  className="px-6 py-2.5 rounded-lg font-medium text-sm bg-blue-900 text-white hover:bg-blue-800 transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Assessment
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
