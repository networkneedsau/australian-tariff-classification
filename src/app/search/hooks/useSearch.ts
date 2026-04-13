'use client';

import { useState, useCallback, useRef } from 'react';
import type {
  TariffResult,
  ActSectionRow,
  RegulationRow,
  ChemicalRow,
  AHECCRow,
} from '../types';

interface SearchApiResponse {
  query: string;
  total: number;
  limit: number;
  offset: number;
  results: TariffResult[];
  actResults: ActSectionRow[];
  actTotal: number;
  regsResults: RegulationRow[];
  regsTotal: number;
  chemsResults: ChemicalRow[];
  chemsTotal: number;
  aheccResults: AHECCRow[];
  aheccTotal: number;
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TariffResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Secondary results
  const [actResults, setActResults] = useState<ActSectionRow[]>([]);
  const [actTotal, setActTotal] = useState(0);
  const [regsResults, setRegsResults] = useState<RegulationRow[]>([]);
  const [regsTotal, setRegsTotal] = useState(0);
  const [chemsResults, setChemsResults] = useState<ChemicalRow[]>([]);
  const [chemsTotal, setChemsTotal] = useState(0);
  const [aheccResults, setAheccResults] = useState<AHECCRow[]>([]);
  const [aheccTotal, setAheccTotal] = useState(0);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      setTotal(0);
      setActResults([]);
      setActTotal(0);
      setRegsResults([]);
      setRegsTotal(0);
      setChemsResults([]);
      setChemsTotal(0);
      setAheccResults([]);
      setAheccTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/tariff/search?q=${encodeURIComponent(q.trim())}&limit=50`);
      if (!res.ok) throw new Error('Search failed');
      const data: SearchApiResponse = await res.json();

      setResults(data.results);
      setTotal(data.total);
      setActResults(data.actResults ?? []);
      setActTotal(data.actTotal ?? 0);
      setRegsResults(data.regsResults ?? []);
      setRegsTotal(data.regsTotal ?? 0);
      setChemsResults(data.chemsResults ?? []);
      setChemsTotal(data.chemsTotal ?? 0);
      setAheccResults(data.aheccResults ?? []);
      setAheccTotal(data.aheccTotal ?? 0);
    } catch {
      setResults([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const search = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, 300);
  }, [query, doSearch]);

  // Immediate search (used when pressing Enter)
  const searchImmediate = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    doSearch(query);
  }, [query, doSearch]);

  return {
    query,
    setQuery,
    results,
    total,
    loading,
    search: searchImmediate,
    actResults,
    actTotal,
    regsResults,
    regsTotal,
    chemsResults,
    chemsTotal,
    aheccResults,
    aheccTotal,
  };
}
