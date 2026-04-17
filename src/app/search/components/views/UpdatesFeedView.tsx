'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

interface UpdateRow {
  id: string;
  owner: string;
  topic: string;
  topic_href: string | null;
  date: string;
  comments: string;
  source: string;
  stream: 'daily' | 'library';
}

interface FeedResponse {
  rows: UpdateRow[];
  total: number;
  from: string;
  to: string;
  stream: string;
}

interface UpdatesFeedViewProps {
  stream: 'daily' | 'library';
}

function FilterFunnel() {
  return (
    <svg
      className="w-3 h-3 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L14 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 018 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
      />
    </svg>
  );
}

export default function UpdatesFeedView({ stream }: UpdatesFeedViewProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'library'>(stream);

  // Filters (per-column). Date column uses from/to, others use substring match.
  const [ownerFilter, setOwnerFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [commentsFilter, setCommentsFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [rows, setRows] = useState<UpdateRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync internal tab when the `stream` prop changes (route navigation).
  useEffect(() => {
    setActiveTab(stream);
  }, [stream]);

  // Fetch rows from /api/daily-updates whenever tab / server-side filters change.
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        qs.set('stream', activeTab);
        qs.set('limit', '200');
        if (fromDate) qs.set('from', fromDate);
        if (toDate) qs.set('to', toDate);
        if (ownerFilter.trim()) qs.set('owner', ownerFilter.trim());
        if (topicFilter.trim()) qs.set('topic', topicFilter.trim());

        const res = await fetch(`/api/daily-updates?${qs.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: FeedResponse = await res.json();
        setRows(Array.isArray(data.rows) ? data.rows : []);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError((err as Error).message);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [activeTab, fromDate, toDate, ownerFilter, topicFilter]);

  // Client-side comments filter (not sent to server).
  const filtered = useMemo(() => {
    if (!commentsFilter.trim()) return rows;
    const needle = commentsFilter.trim().toLowerCase();
    return rows.filter((r) => r.comments.toLowerCase().includes(needle));
  }, [rows, commentsFilter]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Tab bar */}
      <div className="border-b border-gray-200 bg-white">
        <nav className="flex px-4" aria-label="Updates tabs">
          <Link
            href="/updates"
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'daily'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Daily Updates
          </Link>
          <Link
            href="/updates/library"
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'library'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Library Updates
          </Link>
        </nav>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-50 z-10">
            <tr className="border-b border-gray-200 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <th className="px-4 py-2 w-32">Owner</th>
              <th className="px-4 py-2">Topic</th>
              <th className="px-4 py-2 w-64">Date</th>
              <th className="px-4 py-2">Comments</th>
            </tr>
            {/* Filter row */}
            <tr className="border-b border-gray-200 bg-white">
              <th className="px-4 py-2 align-top">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2">
                    <FilterFunnel />
                  </span>
                  <input
                    type="text"
                    value={ownerFilter}
                    onChange={(e) => setOwnerFilter(e.target.value)}
                    placeholder="Filter owner..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-normal"
                  />
                </div>
              </th>
              <th className="px-4 py-2 align-top">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2">
                    <FilterFunnel />
                  </span>
                  <input
                    type="text"
                    value={topicFilter}
                    onChange={(e) => setTopicFilter(e.target.value)}
                    placeholder="Filter topic..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-normal"
                  />
                </div>
              </th>
              <th className="px-4 py-2 align-top">
                <div className="flex items-center gap-1">
                  <div className="relative flex-1">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2">
                      <FilterFunnel />
                    </span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      aria-label="From date"
                      className="w-full pl-7 pr-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-normal"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 uppercase">to</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    aria-label="To date"
                    className="flex-1 px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-normal"
                  />
                </div>
              </th>
              <th className="px-4 py-2 align-top">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2">
                    <FilterFunnel />
                  </span>
                  <input
                    type="text"
                    value={commentsFilter}
                    onChange={(e) => setCommentsFilter(e.target.value)}
                    placeholder="Filter comments..."
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-normal"
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Loading updates...
                </td>
              </tr>
            )}
            {!loading && error && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-red-600">
                  Failed to load updates: {error}
                </td>
              </tr>
            )}
            {!loading && !error && filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No updates match the current filters.
                </td>
              </tr>
            )}
            {!loading &&
              !error &&
              filtered.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800">
                      {row.owner}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {row.topic_href ? (
                      <a
                        href={row.topic_href}
                        className="text-blue-700 hover:underline"
                        target={row.topic_href.startsWith('http') ? '_blank' : undefined}
                        rel={row.topic_href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      >
                        {row.topic}
                      </a>
                    ) : (
                      <span className="text-gray-800">{row.topic}</span>
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                    {row.date ? row.date.slice(0, 10) : '—'}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{row.comments || '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
