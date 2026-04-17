'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import AccordionGroup from '../shared/AccordionGroup';
import FilterInput from '../shared/FilterInput';
import LoadingSpinner from '../shared/LoadingSpinner';
import LegalTextRenderer from '@/app/components/LegalTextRenderer';
import type { ActiveView } from '../../types';

// ── Per-view configuration ───────────────────────────────────────

interface ViewConfig {
  title: string;
  apiEndpoint: string;
  groupByField: string;
  groupKeyExtractor?: (item: Record<string, any>) => string;
  groupSorter?: (a: GroupData, b: GroupData) => number;
  filterFields: string[];
  colorScheme: 'blue' | 'green' | 'red' | 'purple' | 'indigo' | 'amber';
  renderItem: (item: Record<string, any>, expanded: boolean) => React.ReactNode;
}

const VIEW_CONFIGS: Partial<Record<ActiveView, ViewConfig>> = {
  chemicals: {
    title: 'Chemical Index (CWC Schedules 1-3)',
    apiEndpoint: '/api/tariff/chemicals',
    groupByField: 'cwc_schedule',
    filterFields: ['chemical_name', 'cas_number', 'item_number', 'category'],
    colorScheme: 'red',
    renderItem: (item) => (
      <div className="flex items-start gap-3">
        <span className="font-mono text-xs font-bold text-red-700 w-16 shrink-0 pt-0.5">
          S{item.cwc_schedule}.{item.item_number}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700">{item.chemical_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {item.cas_number && (
              <span className="text-xs text-gray-400 font-mono">
                CAS: {item.cas_number}
              </span>
            )}
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              {item.category}
            </span>
          </div>
          {item.notes && (
            <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
          )}
        </div>
      </div>
    ),
  },

  ahecc: {
    title: 'AHECC Export Classification Codes',
    apiEndpoint: '/api/tariff/ahecc',
    groupByField: 'section_number',
    filterFields: ['section_title', 'chapter_number', 'chapter_title'],
    colorScheme: 'green',
    renderItem: (item) => (
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs font-bold text-green-700 w-12 shrink-0">
          Ch.{item.chapter_number}
        </span>
        <span className="text-sm text-gray-700 flex-1">{item.chapter_title}</span>
      </div>
    ),
  },

  dumping: {
    title: 'Anti-Dumping & Countervailing Notices',
    apiEndpoint: '/api/tariff/dumping',
    groupByField: 'category',
    filterFields: ['commodity', 'countries', 'measure_type', 'duty_info'],
    colorScheme: 'amber',
    renderItem: (item) => (
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-800">{item.commodity}</p>
          <span
            className={`text-xs px-2 py-0.5 rounded shrink-0 ${
              item.status === 'Active'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {item.status}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {item.countries} &mdash; {item.measure_type}
        </p>
        {item.duty_info && (
          <p className="text-xs text-amber-700 mt-0.5">{item.duty_info}</p>
        )}
        {item.tariff_chapters && (
          <p className="text-xs text-gray-400 mt-0.5 font-mono">
            Chapters: {item.tariff_chapters}
          </p>
        )}
      </div>
    ),
  },

  aqis: {
    title: 'AQIS Quarantine Requirements',
    apiEndpoint: '/api/tariff/aqis',
    groupByField: 'category',
    filterFields: ['category_title', 'item_type', 'item_title', 'description'],
    colorScheme: 'green',
    renderItem: (item) => (
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded shrink-0">
            {item.item_type}
          </span>
          <p className="text-sm text-gray-700">{item.item_title}</p>
        </div>
        {item.description && (
          <p className="text-xs text-gray-500 mt-1">{item.description}</p>
        )}
        {item.requirements && (
          <p className="text-xs text-blue-600 mt-0.5">{item.requirements}</p>
        )}
      </div>
    ),
  },

  reffiles: {
    title: 'ABF Reference Files',
    apiEndpoint: '/api/tariff/reffiles',
    groupByField: 'category',
    filterFields: ['file_code', 'file_name', 'description'],
    colorScheme: 'indigo',
    renderItem: (item) => (
      <div className="flex items-start gap-3">
        <span className="font-mono text-xs font-bold text-indigo-700 w-20 shrink-0 pt-0.5">
          {item.file_code}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700">{item.file_name}</p>
          {item.description && (
            <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
          )}
        </div>
      </div>
    ),
  },

  cpquestions: {
    title: 'Community Protection Questions',
    apiEndpoint: '/api/tariff/cpquestions',
    groupByField: 'category',
    filterFields: ['cp_number', 'question_text', 'applies_to'],
    colorScheme: 'purple',
    renderItem: (item, expanded) => (
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <span className="font-mono text-xs font-bold text-purple-700 shrink-0">
            {item.cp_number}
          </span>
          <p className="text-sm text-gray-700 flex-1">{item.question_text}</p>
        </div>
        {item.applies_to && (
          <p className="text-xs text-gray-400 mt-0.5 ml-16">
            Applies to: {item.applies_to}
          </p>
        )}
        {expanded && (
          <div className="mt-2 ml-16 space-y-1">
            {item.answer_y && (
              <div className="text-xs">
                <span className="font-medium text-green-700">Yes:</span>{' '}
                <span className="text-gray-600">{item.answer_y}</span>
              </div>
            )}
            {item.answer_n && (
              <div className="text-xs">
                <span className="font-medium text-red-700">No:</span>{' '}
                <span className="text-gray-600">{item.answer_n}</span>
              </div>
            )}
          </div>
        )}
      </div>
    ),
  },

  precedents: {
    title: 'Classification Precedents',
    apiEndpoint: '/api/tariff/precedents',
    groupByField: 'category',
    filterFields: ['title', 'description', 'tariff_code', 'category'],
    colorScheme: 'indigo',
    renderItem: (item) => (
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-gray-800">
            {item.title || item.description}
          </p>
          {item.tariff_code && (
            <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded shrink-0">
              {item.tariff_code}
            </span>
          )}
        </div>
        {item.description && item.title && (
          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
        )}
      </div>
    ),
  },

  compendium: {
    title: 'Compendium of Classification Opinions',
    apiEndpoint: '/api/tariff/compendium',
    groupByField: 'section',
    filterFields: ['title', 'description', 'tariff_code', 'section'],
    colorScheme: 'blue',
    renderItem: (item) => (
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-gray-700">
            {item.title || item.description}
          </p>
          {item.tariff_code && (
            <span className="font-mono text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded shrink-0">
              {item.tariff_code}
            </span>
          )}
        </div>
      </div>
    ),
  },

  tco: {
    title: 'Tariff Concession Orders',
    apiEndpoint: '/api/tariff/tco',
    groupByField: 'category',
    filterFields: ['tco_number', 'description', 'tariff_code', 'category'],
    colorScheme: 'purple',
    renderItem: (item) => (
      <div className="flex items-start gap-3">
        <span className="font-mono text-xs font-bold text-purple-700 w-20 shrink-0 pt-0.5">
          {item.tco_number || item.id}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700">{item.description}</p>
          {item.tariff_code && (
            <p className="text-xs text-gray-400 mt-0.5 font-mono">
              Tariff: {item.tariff_code}
            </p>
          )}
        </div>
      </div>
    ),
  },

  'alpha-index': {
    title: 'HS Alphabetical Index',
    apiEndpoint: '/api/tariff/alpha-index',
    groupByField: '_alpha',
    groupKeyExtractor: (item) =>
      (item.goods_description || 'A').charAt(0).toUpperCase(),
    groupSorter: (a, b) => a.key.localeCompare(b.key),
    filterFields: ['goods_description', 'tariff_code'],
    colorScheme: 'blue',
    renderItem: (item) => (
      <div className="flex items-start gap-3">
        {item.tariff_code && (
          <span className="font-mono text-xs font-bold text-blue-700 w-24 shrink-0 pt-0.5">
            {item.tariff_code}
          </span>
        )}
        <p className="text-sm text-gray-700 flex-1">
          {item.goods_description}
        </p>
      </div>
    ),
  },

  hsen: {
    title: 'HS Explanatory Notes',
    apiEndpoint: '/api/tariff/hsen',
    groupByField: 'section',
    filterFields: ['title', 'description', 'section', 'chapter'],
    colorScheme: 'indigo',
    renderItem: (item) => (
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700">{item.title || item.description}</p>
        {item.chapter && (
          <p className="text-xs text-gray-400 mt-0.5">Chapter: {item.chapter}</p>
        )}
      </div>
    ),
  },

  'cbp-rulings': {
    title: 'CBP Rulings Reference',
    apiEndpoint: '/api/tariff/cbp-rulings',
    groupByField: 'category',
    filterFields: ['ruling_number', 'description', 'tariff_code', 'category'],
    colorScheme: 'amber',
    renderItem: (item) => (
      <div className="flex items-start gap-3">
        <span className="font-mono text-xs font-bold text-amber-700 w-20 shrink-0 pt-0.5">
          {item.ruling_number || item.id}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700">{item.description}</p>
          {item.tariff_code && (
            <p className="text-xs text-gray-400 mt-0.5 font-mono">
              HS: {item.tariff_code}
            </p>
          )}
        </div>
      </div>
    ),
  },

  acn: {
    title: 'Australian Customs Notices',
    apiEndpoint: '/api/tariff/customs-notices',
    groupByField: 'year',
    filterFields: ['notice_number', 'title', 'summary', 'category'],
    colorScheme: 'blue',
    groupSorter: (a, b) => Number(b.key) - Number(a.key),
    renderItem: (item) => (
      <div className="flex items-start gap-3">
        <span className="font-mono text-xs font-bold text-blue-700 w-16 shrink-0 pt-0.5">
          {item.notice_number}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-700">{item.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
              {item.category}
            </span>
            {item.effective_date && (
              <span className="text-xs text-gray-400">
                {item.effective_date}
              </span>
            )}
          </div>
          {item.summary && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {item.summary}
            </p>
          )}
        </div>
      </div>
    ),
  },
};

// ── Component ────────────────────────────────────────────────────

interface GenericCategoryViewProps {
  viewKey: ActiveView;
}

interface GroupData {
  key: string;
  title: string;
  items: Record<string, any>[];
}

export default function GenericCategoryView({
  viewKey,
}: GenericCategoryViewProps) {
  const config = VIEW_CONFIGS[viewKey];

  const [data, setData] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    if (!config) return;
    let cancelled = false;
    setLoading(true);
    setData([]);
    setFilter('');
    setCollapsedGroups(new Set());
    setExpandedItem(null);

    (async () => {
      try {
        const res = await fetch(config.apiEndpoint);
        if (!res.ok) throw new Error('Failed');
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
  }, [config?.apiEndpoint]);

  // Group data
  const groups: GroupData[] = useMemo(() => {
    if (!config) return [];
    const result: GroupData[] = [];
    const map = new Map<string, GroupData>();

    for (const item of data) {
      const key = config.groupKeyExtractor
        ? config.groupKeyExtractor(item)
        : String(item[config.groupByField] || 'General');
      let group = map.get(key);
      if (!group) {
        group = { key, title: key, items: [] };
        map.set(key, group);
        result.push(group);
      }
      group.items.push(item);
    }

    if (config.groupSorter) {
      result.sort(config.groupSorter);
    }

    return result;
  }, [data, config]);

  // Filter
  const filteredGroups = useMemo(() => {
    if (!config || !filter) return groups;
    const lc = filter.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (item) =>
            g.key.toLowerCase().includes(lc) ||
            config.filterFields.some((field) =>
              String(item[field] || '')
                .toLowerCase()
                .includes(lc),
            ),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, filter, config]);

  const totalItems = groups.reduce((sum, g) => sum + g.items.length, 0);
  const filteredItems = filteredGroups.reduce(
    (sum, g) => sum + g.items.length,
    0,
  );

  if (!config) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
        View configuration not found for &quot;{viewKey}&quot;.
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message={`Loading ${config.title}...`} />;
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
        No data available for {config.title}.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-gray-800">{config.title}</h2>
        <p className="text-xs text-gray-500 mt-1">
          {totalItems} items across {groups.length} categories
        </p>
      </div>

      {/* Filter */}
      <FilterInput
        value={filter}
        onChange={setFilter}
        placeholder={`Filter ${config.title}...`}
        count={filteredItems}
        total={totalItems}
      />

      {/* Accordion groups */}
      <div className="space-y-2">
        {filteredGroups.map((group) => (
          <AccordionGroup
            key={group.key}
            title={group.title}
            count={group.items.length}
            expanded={!collapsedGroups.has(group.key)}
            onToggle={() =>
              setCollapsedGroups((prev) => {
                const next = new Set(prev);
                if (next.has(group.key)) next.delete(group.key);
                else next.add(group.key);
                return next;
              })
            }
            colorScheme={config.colorScheme}
          >
            <div className="divide-y divide-gray-50">
              {group.items.map((item, idx) => {
                const uniqueKey = `${group.key}-${item.id || idx}`;
                const isExpanded = expandedItem === uniqueKey;

                return (
                  <button
                    key={uniqueKey}
                    onClick={() =>
                      setExpandedItem(isExpanded ? null : uniqueKey)
                    }
                    className={`w-full text-left px-4 py-2.5 flex items-start gap-2 transition-colors hover:bg-gray-50 ${
                      isExpanded ? 'bg-gray-50' : ''
                    }`}
                  >
                    {config.renderItem(item, isExpanded)}
                  </button>
                );
              })}
            </div>
          </AccordionGroup>
        ))}
      </div>
    </div>
  );
}
