'use client';

import { useEffect, useState } from 'react';

interface CrossReferenceResult {
  id: string;
  label: string;
  count: number;
}

interface CrossReferencePanelProps {
  searchQuery: string;
  results: CrossReferenceResult[];
  loading?: boolean;
  onSelectSource: (sourceId: string) => void;
  onApplySuggestion?: (suggestion: string) => void;
}

const SHOW_ON_SEARCH_KEY = 'tariff_cross_ref_show_on_search';

// Looks "misspelled" if the query has non-alphabetic noise or looks like a
// word (letters only, no space) with <=2 total results across sources.
function looksMisspelled(query: string, totalResults: number): boolean {
  const q = query.trim();
  if (q.length < 4) return false;
  if (totalResults >= 3) return false;
  // Skip pure commodity codes / numeric-heavy queries.
  if (/^[\d.\s]+$/.test(q)) return false;
  // Skip very short multi-word queries — trust the user.
  const words = q.split(/\s+/);
  if (words.length > 3) return false;
  // Must have at least one letter.
  return /[a-zA-Z]/.test(q);
}

export default function CrossReferencePanel({
  searchQuery,
  results,
  loading = false,
  onSelectSource,
  onApplySuggestion,
}: CrossReferencePanelProps) {
  // "Show on search" toggle — persisted.
  const [showOnSearch, setShowOnSearch] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(SHOW_ON_SEARCH_KEY);
      if (raw !== null) setShowOnSearch(raw === '1');
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SHOW_ON_SEARCH_KEY, showOnSearch ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [showOnSearch, hydrated]);

  // "Did you mean" suggestions.
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  // Sort by count descending — used for render + suggestion trigger.
  const sorted = [...results].sort((a, b) => b.count - a.count);
  const totalResults = sorted.reduce((sum, r) => sum + r.count, 0);

  useEffect(() => {
    if (!searchQuery) {
      setSuggestions([]);
      return;
    }
    // Only fetch suggestions when the query looks like it could be misspelled
    // and the cross-ref totals are low.
    if (!looksMisspelled(searchQuery, totalResults)) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const run = async () => {
      setSuggestLoading(true);
      try {
        const res = await fetch(
          `/api/tariff/search-suggestions?q=${encodeURIComponent(searchQuery)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { suggestions?: string[] };
        setSuggestions(Array.isArray(data.suggestions) ? data.suggestions.slice(0, 5) : []);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    };
    const handle = setTimeout(run, 250); // debounce
    return () => {
      clearTimeout(handle);
      controller.abort();
    };
  }, [searchQuery, totalResults]);

  // Header (always rendered so the toggle is available).
  const Header = (
    <div className="p-3 border-b border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Cross-Reference
        </h2>
        {/* Toggle switch */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span className="text-[11px] text-gray-600">Show on search</span>
          <button
            type="button"
            role="switch"
            aria-checked={showOnSearch}
            onClick={() => setShowOnSearch((v) => !v)}
            className={`relative inline-flex items-center h-4 w-7 rounded-full transition-colors ${
              showOnSearch ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block w-3 h-3 transform bg-white rounded-full shadow transition-transform ${
                showOnSearch ? 'translate-x-3.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </label>
      </div>
      {searchQuery && showOnSearch && (
        <>
          <p className="text-sm text-gray-700">
            Results for{' '}
            <span className="font-semibold text-blue-700">&ldquo;{searchQuery}&rdquo;</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {totalResults} result{totalResults !== 1 ? 's' : ''} across {sorted.length} source
            {sorted.length !== 1 ? 's' : ''}
          </p>
        </>
      )}
    </div>
  );

  // "Did you mean" section (shown above results when we have suggestions).
  const DidYouMean =
    suggestions.length > 0 && showOnSearch ? (
      <div className="px-3 py-2 border-b border-gray-200 bg-amber-50">
        <p className="text-xs text-amber-900 font-medium mb-1">Did you mean:</p>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onApplySuggestion?.(s)}
              className="text-xs px-2 py-0.5 rounded-full bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 hover:border-amber-400 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    ) : null;

  // ── Branch: panel hidden via toggle ─────────────────────────────
  if (!showOnSearch) {
    return (
      <div className="h-full flex flex-col">
        {Header}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <svg
            className="w-10 h-10 text-gray-300 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
            />
          </svg>
          <p className="text-sm text-gray-500">Cross-reference hidden — toggle to show</p>
        </div>
      </div>
    );
  }

  // ── Branch: loading ─────────────────────────────────────────────
  if (loading && searchQuery) {
    return (
      <div className="h-full flex flex-col">
        {Header}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-500">Searching across sources...</p>
        </div>
      </div>
    );
  }

  // ── Branch: empty ───────────────────────────────────────────────
  if (!searchQuery || results.length === 0) {
    return (
      <div className="h-full flex flex-col">
        {Header}
        {DidYouMean}
        {suggestLoading && (
          <div className="px-3 py-2 text-[11px] text-gray-400">
            Looking for similar terms...
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <svg
            className="w-12 h-12 text-gray-300 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-sm text-gray-500">
            {searchQuery
              ? 'No cross-references found'
              : 'Search to see results across library sources'}
          </p>
        </div>
      </div>
    );
  }

  // ── Branch: results ─────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {Header}
      {DidYouMean}
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-gray-100">
          {sorted.map((result) => (
            <li key={result.id}>
              <button
                onClick={() => onSelectSource(result.id)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-blue-50 transition-colors group"
              >
                <span className="text-sm text-gray-700 group-hover:text-blue-700 truncate flex-1 mr-2">
                  {result.label}
                </span>
                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full shrink-0">
                  {result.count}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
