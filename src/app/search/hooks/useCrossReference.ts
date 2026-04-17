'use client';

import { useState, useEffect, useRef } from 'react';

interface CrossReferenceResult {
  id: string;
  label: string;
  count: number;
}

interface CrossSearchApiResponse {
  query: string;
  sources: CrossReferenceResult[];
}

export function useCrossReference(query: string) {
  const [sources, setSources] = useState<CrossReferenceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.trim().length < 2) {
      setSources([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/tariff/cross-search?q=${encodeURIComponent(query.trim())}&limit=50`
        );
        if (!res.ok) throw new Error('Cross-search failed');
        const data: CrossSearchApiResponse = await res.json();
        setSources(data.sources);
      } catch {
        setSources([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return { sources, loading };
}
