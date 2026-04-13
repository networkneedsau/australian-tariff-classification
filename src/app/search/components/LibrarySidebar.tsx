'use client';

import { useState, useMemo } from 'react';
import type { ActiveView } from '../types';
import { LIBRARY_TREE } from '../constants/library-tree';
import LibraryTree from './LibraryTree';

interface LibrarySidebarProps {
  activeView: ActiveView;
  onSelectView: (view: string) => void;
  searchQuery?: string;
}

export default function LibrarySidebar({
  activeView,
  onSelectView,
  searchQuery,
}: LibrarySidebarProps) {
  const [filter, setFilter] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

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

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        <LibraryTree
          nodes={LIBRARY_TREE}
          activeView={activeView}
          onSelect={onSelectView}
          expandedNodes={effectiveExpanded}
          onToggleNode={handleToggleNode}
          filter={filter || undefined}
        />
      </div>
    </div>
  );
}
