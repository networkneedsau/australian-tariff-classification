'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import type { ActiveView, TreeNode } from '../types';
import { LIBRARY_TREE } from '../constants/library-tree';
import LibraryTree from './LibraryTree';

interface LibrarySidebarProps {
  activeView: ActiveView;
  onSelectView: (view: string) => void;
  searchQuery?: string;
  /** Map of sourceId → match count for current search (empty when no search) */
  sourceCounts?: Record<string, number>;
}

const SOURCES_STORAGE_KEY = 'tariff_search_sources';

/** Collect every leaf viewKey in the library tree. */
function collectAllLeafViewKeys(nodes: TreeNode[]): string[] {
  const keys: string[] = [];
  const walk = (list: TreeNode[]) => {
    for (const node of list) {
      if (node.children && node.children.length > 0) {
        walk(node.children);
      } else if (node.viewKey) {
        keys.push(node.viewKey);
      }
    }
  };
  walk(nodes);
  return keys;
}

const ALL_LEAF_KEYS = collectAllLeafViewKeys(LIBRARY_TREE);

export default function LibrarySidebar({
  activeView,
  onSelectView,
  sourceCounts = {},
}: LibrarySidebarProps) {
  const [filter, setFilter] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Search-source selection — default: everything checked.
  const [selectedSources, setSelectedSources] = useState<Set<string>>(
    () => new Set(ALL_LEAF_KEYS)
  );
  const [sourcesHydrated, setSourcesHydrated] = useState(false);

  // Load persisted selection on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(SOURCES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSelectedSources(new Set(parsed.filter((v): v is string => typeof v === 'string')));
        }
      }
    } catch {
      /* ignore */
    }
    setSourcesHydrated(true);
  }, []);

  // Persist on change (only after initial hydration to avoid overwriting stored value).
  useEffect(() => {
    if (!sourcesHydrated) return;
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        SOURCES_STORAGE_KEY,
        JSON.stringify(Array.from(selectedSources))
      );
    } catch {
      /* ignore */
    }
  }, [selectedSources, sourcesHydrated]);

  const handleToggleNode = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleToggleSource = useCallback((viewKey: string) => {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      if (next.has(viewKey)) {
        next.delete(viewKey);
      } else {
        next.add(viewKey);
      }
      return next;
    });
  }, []);

  const handleToggleCategory = useCallback((node: TreeNode) => {
    setSelectedSources((prev) => {
      const leaves: string[] = [];
      const walk = (n: TreeNode) => {
        if (!n.children || n.children.length === 0) {
          if (n.viewKey) leaves.push(n.viewKey);
        } else {
          n.children.forEach(walk);
        }
      };
      walk(node);
      if (leaves.length === 0) return prev;

      const allSelected = leaves.every((k) => prev.has(k));
      const next = new Set(prev);
      if (allSelected) {
        // Uncheck all
        leaves.forEach((k) => next.delete(k));
      } else {
        // Check all
        leaves.forEach((k) => next.add(k));
      }
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedSources((prev) => {
      const allChecked = ALL_LEAF_KEYS.every((k) => prev.has(k));
      return allChecked ? new Set() : new Set(ALL_LEAF_KEYS);
    });
  }, []);

  // Auto-expand all categories when filtering
  const effectiveExpanded = useMemo(() => {
    if (filter) {
      const allIds = new Set<string>();
      const collectIds = (nodes: typeof LIBRARY_TREE) => {
        for (const node of nodes) {
          allIds.add(node.id);
          if (node.children) collectIds(node.children);
        }
      };
      collectIds(LIBRARY_TREE);
      return allIds;
    }
    return expandedNodes;
  }, [filter, expandedNodes]);

  const totalSources = ALL_LEAF_KEYS.length;
  const checkedCount = useMemo(
    () => ALL_LEAF_KEYS.filter((k) => selectedSources.has(k)).length,
    [selectedSources]
  );
  const allChecked = checkedCount === totalSources;
  const someChecked = checkedCount > 0 && checkedCount < totalSources;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          Library
        </h2>
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Find in library..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
          {filter && (
            <button
              onClick={() => setFilter('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Select all for search */}
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <span
            role="checkbox"
            aria-checked={allChecked}
            tabIndex={0}
            onClick={handleSelectAll}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                handleSelectAll();
              }
            }}
            className={`inline-flex items-center justify-center w-4 h-4 shrink-0 rounded border cursor-pointer transition-colors ${
              allChecked
                ? 'bg-blue-600 border-blue-600 text-white'
                : someChecked
                  ? 'bg-blue-100 border-blue-500 text-blue-700'
                  : 'bg-white border-gray-300 hover:border-blue-500'
            }`}
          >
            {allChecked && (
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {someChecked && (
              <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <rect x="4" y="9" width="12" height="2" rx="1" />
              </svg>
            )}
          </span>
          <span className="text-xs font-medium text-gray-700" onClick={handleSelectAll}>
            Select all for search
          </span>
          <span className="ml-auto text-[10px] text-gray-500">
            {checkedCount}/{totalSources}
          </span>
        </label>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        <LibraryTree
          nodes={LIBRARY_TREE}
          activeView={activeView}
          onSelect={onSelectView}
          expandedNodes={effectiveExpanded}
          onToggleNode={handleToggleNode}
          filter={filter || undefined}
          selectedSources={selectedSources}
          onToggleSource={handleToggleSource}
          onToggleCategory={handleToggleCategory}
          sourceCounts={sourceCounts}
        />
      </div>
    </div>
  );
}
