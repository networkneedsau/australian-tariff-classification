'use client';

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
}

export default function CrossReferencePanel({
  searchQuery,
  results,
  loading = false,
  onSelectSource,
}: CrossReferencePanelProps) {
  if (loading && searchQuery) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-gray-500">Searching across sources...</p>
      </div>
    );
  }

  if (!searchQuery || results.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
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
    );
  }

  // Sort by count descending
  const sorted = [...results].sort((a, b) => b.count - a.count);
  const totalResults = sorted.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Cross-Reference
        </h2>
        <p className="text-sm text-gray-700 mt-1">
          Results for <span className="font-semibold text-blue-700">&ldquo;{searchQuery}&rdquo;</span>
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {totalResults} result{totalResults !== 1 ? 's' : ''} across {sorted.length} source{sorted.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Results list */}
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
