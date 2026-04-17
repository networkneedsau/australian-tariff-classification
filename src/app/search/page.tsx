'use client';

import { useState, useCallback, useMemo } from 'react';
import ThreePanelLayout from './components/ThreePanelLayout';
import TopBar from './components/TopBar';
import LibrarySidebar from './components/LibrarySidebar';
import CenterPanel from './components/CenterPanel';
import CrossReferencePanel from './components/CrossReferencePanel';
import BookmarkPanel from '@/app/components/BookmarkPanel';
import { useSearch } from './hooks/useSearch';
import { useCrossReference } from './hooks/useCrossReference';
import { buildSourceCounts } from './utils/cross-ref-mapping';
import type { ActiveView, EntryResponse, CustomsEntryFields, ScheduleInfo } from './types';

export default function SearchPage() {
  // ── Core state ─────────────────────────────────────────────────
  const [activeView, setActiveView] = useState<ActiveView>('search');
  const [selectedEntry, setSelectedEntry] = useState<EntryResponse | null>(null);
  const [customsFields, setCustomsFields] = useState<CustomsEntryFields | null>(null);
  const [activeSchedule, setActiveSchedule] = useState<ScheduleInfo | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  // ── Search state (via hooks) ───────────────────────────────────
  const {
    query,
    setQuery,
    results,
    total,
    loading,
    search,
    actResults,
    actTotal,
    regsResults,
    regsTotal,
    chemsResults,
    chemsTotal,
    aheccResults,
    aheccTotal,
  } = useSearch();

  const { sources: crossRefSources, loading: crossRefLoading } = useCrossReference(query);

  // Map cross-reference source IDs to viewKeys used by the library tree
  const sourceCounts = useMemo(() => buildSourceCounts(crossRefSources), [crossRefSources]);

  // ── Select a tariff code — fetch entry details ─────────────────
  const selectTariffCode = useCallback(async (code: string) => {
    try {
      const res = await fetch(`/api/tariff/for-entry/${encodeURIComponent(code)}`);
      const data = await res.json();
      setSelectedEntry(data);
      setCustomsFields(data.customs_entry_fields);
      // Switch to search view so the detail panel shows
      setActiveView('search');
    } catch {
      /* silently ignore */
    }
  }, []);

  // ── Navigate to a view from library tree or cross-reference ────
  const handleNavigateToView = useCallback((view: ActiveView, schedule?: ScheduleInfo) => {
    setActiveView(view);
    if (schedule) setActiveSchedule(schedule);
  }, []);

  // ── Render ─────────────────────────────────────────────────────
  return (
    <>
      <ThreePanelLayout
        leftCollapsed={leftCollapsed}
        rightCollapsed={rightCollapsed}
        onToggleLeft={() => setLeftCollapsed(!leftCollapsed)}
        onToggleRight={() => setRightCollapsed(!rightCollapsed)}
        topBar={
          <TopBar
            searchQuery={query}
            onSearchChange={setQuery}
            onSearch={search}
          />
        }
        leftPanel={
          <LibrarySidebar
            activeView={activeView}
            onSelectView={(viewKey) => handleNavigateToView(viewKey as ActiveView)}
            searchQuery={query}
            sourceCounts={sourceCounts}
          />
        }
        centerPanel={
          <CenterPanel
            activeView={activeView}
            searchQuery={query}
            searchResults={results}
            searchTotal={total}
            searchLoading={loading}
            selectedEntry={selectedEntry}
            customsFields={customsFields}
            activeSchedule={activeSchedule}
            onSelectTariffCode={selectTariffCode}
            onNavigateToView={handleNavigateToView}
            actResults={actResults}
            actTotal={actTotal}
            regsResults={regsResults}
            regsTotal={regsTotal}
            chemsResults={chemsResults}
            chemsTotal={chemsTotal}
            aheccResults={aheccResults}
            aheccTotal={aheccTotal}
          />
        }
        rightPanel={
          <CrossReferencePanel
            searchQuery={query}
            results={crossRefSources}
            loading={crossRefLoading}
            onSelectSource={(sourceId) => handleNavigateToView(sourceId as ActiveView)}
            onApplySuggestion={(s) => {
              setQuery(s);
              search();
            }}
          />
        }
      />
      <BookmarkPanel onSelect={selectTariffCode} />
    </>
  );
}
