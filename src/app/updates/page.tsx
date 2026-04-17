'use client';

import { useState, useCallback, useMemo } from 'react';
import ThreePanelLayout from '@/app/search/components/ThreePanelLayout';
import TopBar from '@/app/search/components/TopBar';
import LibrarySidebar from '@/app/search/components/LibrarySidebar';
import CenterPanel from '@/app/search/components/CenterPanel';
import CrossReferencePanel from '@/app/search/components/CrossReferencePanel';
import BookmarkPanel from '@/app/components/BookmarkPanel';
import { useSearch } from '@/app/search/hooks/useSearch';
import { useCrossReference } from '@/app/search/hooks/useCrossReference';
import { buildSourceCounts } from '@/app/search/utils/cross-ref-mapping';
import type {
  ActiveView,
  EntryResponse,
  CustomsEntryFields,
  ScheduleInfo,
} from '@/app/search/types';

export default function UpdatesPage() {
  // Reuse the three-panel search shell but default to the Daily Updates view.
  const [activeView, setActiveView] = useState<ActiveView>('updates');
  const [selectedEntry, setSelectedEntry] = useState<EntryResponse | null>(null);
  const [customsFields, setCustomsFields] = useState<CustomsEntryFields | null>(null);
  const [activeSchedule, setActiveSchedule] = useState<ScheduleInfo | null>(null);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

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
  const sourceCounts = useMemo(() => buildSourceCounts(crossRefSources), [crossRefSources]);

  const selectTariffCode = useCallback(async (code: string) => {
    try {
      const res = await fetch(`/api/tariff/for-entry/${encodeURIComponent(code)}`);
      const data = await res.json();
      setSelectedEntry(data);
      setCustomsFields(data.customs_entry_fields);
      setActiveView('search');
    } catch {
      /* silently ignore */
    }
  }, []);

  const handleNavigateToView = useCallback(
    (view: ActiveView, schedule?: ScheduleInfo) => {
      setActiveView(view);
      if (schedule) setActiveSchedule(schedule);
    },
    []
  );

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
