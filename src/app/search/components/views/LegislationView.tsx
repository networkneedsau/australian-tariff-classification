'use client';

import { useState, useEffect, useMemo } from 'react';
import AccordionGroup from '../shared/AccordionGroup';
import FilterInput from '../shared/FilterInput';
import LoadingSpinner from '../shared/LoadingSpinner';
import LegalTextRenderer from '@/app/components/LegalTextRenderer';

export interface LegislationViewProps {
  title: string;
  apiEndpoint: string;
  groupByField: string;
  groupTitleField: string;
  itemKeyField: string;
  itemTitleField: string;
  hasContent: boolean;
  colorScheme?: 'blue' | 'green' | 'red' | 'purple' | 'indigo' | 'amber';
  itemPrefix?: string;
}

interface GroupData {
  key: string;
  title: string;
  items: Record<string, any>[];
}

export default function LegislationView({
  title,
  apiEndpoint,
  groupByField,
  groupTitleField,
  itemKeyField,
  itemTitleField,
  hasContent,
  colorScheme = 'blue',
  itemPrefix = 's.',
}: LegislationViewProps) {
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setData([]);
    setExpandedGroup(null);
    setExpandedItem(null);
    setFilter('');

    (async () => {
      try {
        const res = await fetch(apiEndpoint);
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiEndpoint]);

  // Group data
  const groups: GroupData[] = useMemo(() => {
    const result: GroupData[] = [];
    const map = new Map<string, GroupData>();
    for (const item of data) {
      const key = item[groupByField] || 'Other';
      const groupTitle = item[groupTitleField] || key;
      let group = map.get(key);
      if (!group) {
        group = { key, title: groupTitle, items: [] };
        map.set(key, group);
        result.push(group);
      }
      group.items.push(item);
    }
    return result;
  }, [data, groupByField, groupTitleField]);

  // Filter groups
  const filteredGroups = useMemo(() => {
    if (!filter) return groups;
    const lc = filter.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (item) =>
            String(item[itemKeyField] || '')
              .toLowerCase()
              .includes(lc) ||
            String(item[itemTitleField] || '')
              .toLowerCase()
              .includes(lc) ||
            g.key.toLowerCase().includes(lc) ||
            g.title.toLowerCase().includes(lc),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, filter, itemKeyField, itemTitleField]);

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);
  const filteredItems = filteredGroups.reduce(
    (sum, g) => sum + g.items.length,
    0,
  );

  if (loading) {
    return <LoadingSpinner message={`Loading ${title}...`} />;
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
        No data available for {title}.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <p className="text-xs text-gray-500 mt-1">
          {totalItems} provisions across {groups.length} parts
        </p>
      </div>

      {/* Filter */}
      <FilterInput
        value={filter}
        onChange={setFilter}
        placeholder={`Filter ${title}...`}
        count={filteredItems}
        total={totalItems}
      />

      {/* Accordion groups */}
      <div className="space-y-2">
        {filteredGroups.map((group) => (
          <AccordionGroup
            key={group.key}
            title={group.key}
            subtitle={group.title}
            count={group.items.length}
            expanded={expandedGroup === group.key}
            onToggle={() =>
              setExpandedGroup((prev) =>
                prev === group.key ? null : group.key,
              )
            }
            colorScheme={colorScheme}
          >
            <div className="divide-y divide-gray-50">
              {group.items.map((item, idx) => {
                const itemKey = item[itemKeyField] || String(idx);
                const itemTitle = item[itemTitleField] || '';
                const content = item.content || null;
                const uniqueKey = `${group.key}-${itemKey}`;
                const isExpanded = expandedItem === uniqueKey;

                // Sub-structure display (division/subdivision)
                const division = item.division || item.division_title;
                const subdivision =
                  item.subdivision || item.subdivision_title;

                return (
                  <div key={uniqueKey}>
                    <button
                      onClick={() => {
                        if (hasContent && content) {
                          setExpandedItem(isExpanded ? null : uniqueKey);
                        }
                      }}
                      className={`w-full text-left px-4 py-2.5 flex items-start gap-3 transition-colors ${
                        hasContent && content
                          ? 'hover:bg-gray-50 cursor-pointer'
                          : 'cursor-default'
                      } ${isExpanded ? 'bg-gray-50' : ''}`}
                    >
                      {/* Expand chevron for items with content */}
                      {hasContent && content ? (
                        <svg
                          className={`w-3.5 h-3.5 shrink-0 mt-1 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      ) : (
                        <span className="w-3.5 shrink-0" />
                      )}

                      {/* Item number */}
                      <span className="font-mono text-xs font-bold text-gray-600 w-16 shrink-0 pt-0.5">
                        {itemPrefix}
                        {itemKey}
                      </span>

                      {/* Title + sub-structure */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 leading-snug">
                          {itemTitle}
                        </p>
                        {division && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.division_title
                              ? `Division ${item.division}: ${item.division_title}`
                              : `Division: ${division}`}
                          </p>
                        )}
                        {subdivision && (
                          <p className="text-xs text-gray-400">
                            {item.subdivision_title
                              ? `Subdivision ${item.subdivision}: ${item.subdivision_title}`
                              : `Subdivision: ${subdivision}`}
                          </p>
                        )}
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && content && (
                      <div className="px-4 pb-4 pt-1 ml-10 border-l-2 border-gray-200">
                        <LegalTextRenderer content={content} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </AccordionGroup>
        ))}
      </div>
    </div>
  );
}
