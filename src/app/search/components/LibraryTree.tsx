'use client';

import type { ReactNode } from 'react';
import type { TreeNode } from '../types';

interface LibraryTreeProps {
  nodes: TreeNode[];
  activeView: string;
  onSelect: (viewKey: string) => void;
  expandedNodes: Set<string>;
  onToggleNode: (id: string) => void;
  filter?: string;
  depth?: number;
}

function matchesFilter(node: TreeNode, filter: string): boolean {
  const lower = filter.toLowerCase();
  if (node.label.toLowerCase().includes(lower)) return true;
  if (node.children) {
    return node.children.some((child) => matchesFilter(child, lower));
  }
  return false;
}

const ICON_MAP: Record<string, ReactNode> = {
  book: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  scale: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  ),
  shield: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  globe: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  leaf: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  ban: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
  ),
  dollar: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  file: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

export default function LibraryTree({
  nodes,
  activeView,
  onSelect,
  expandedNodes,
  onToggleNode,
  filter,
  depth = 0,
}: LibraryTreeProps) {
  return (
    <ul className={depth === 0 ? 'space-y-0.5' : 'space-y-0.5 ml-3'}>
      {nodes.map((node) => {
        // Filter check
        if (filter && !matchesFilter(node, filter)) return null;

        const hasChildren = node.children && node.children.length > 0;
        const isExpanded = expandedNodes.has(node.id);
        const isActive = node.viewKey === activeView;
        const isLeaf = !hasChildren;

        return (
          <li key={node.id}>
            <button
              onClick={() => {
                if (hasChildren) {
                  onToggleNode(node.id);
                } else if (node.viewKey) {
                  onSelect(node.viewKey);
                }
              }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-sm rounded-md transition-colors ${
                isActive && isLeaf
                  ? 'bg-blue-100 text-blue-800 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {/* Icon for top-level categories */}
              {depth === 0 && node.icon && ICON_MAP[node.icon] && (
                <span className={isActive ? 'text-blue-600' : 'text-gray-400'}>
                  {ICON_MAP[node.icon]}
                </span>
              )}

              {/* Chevron for parents */}
              {hasChildren ? (
                <svg
                  className={`w-3.5 h-3.5 shrink-0 text-gray-400 transition-transform duration-150 ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <span className="w-3.5 shrink-0" />
              )}

              {/* Label */}
              <span className="truncate flex-1">{node.label}</span>
            </button>

            {/* Children */}
            {hasChildren && isExpanded && (
              <LibraryTree
                nodes={node.children!}
                activeView={activeView}
                onSelect={onSelect}
                expandedNodes={expandedNodes}
                onToggleNode={onToggleNode}
                filter={filter}
                depth={depth + 1}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
