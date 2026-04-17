'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface SourceStatus {
  source_id: string;
  source_name: string;
  last_checked_at: string | null;
  last_updated_at: string | null;
  last_status: string;
  last_error: string | null;
  record_count: number;
  records_added: number;
  records_removed: number;
  schedule_cron: string | null;
  schedule_enabled: number;
  version_hash: string | null;
}

interface LogEntry {
  id: number;
  source_id: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  records_before: number | null;
  records_after: number | null;
  records_added: number;
  records_removed: number;
  records_modified: number;
  error_message: string | null;
  details: string | null;
}

const API_KEY = 'tariff-admin-dev-key-2026';
const headers = { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' };

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  const d = new Date(dateStr);
  const now = Date.now();
  const diffMs = now - d.getTime();
  if (diffMs < 60_000) return 'Just now';
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return `${Math.floor(diffMs / 86_400_000)}d ago`;
}

function cronToHuman(cron: string | null): string {
  if (!cron) return 'No schedule';
  const parts = cron.split(' ');
  if (parts.length !== 5) return cron;
  const [, hour, dom, month, dow] = parts;
  if (dow !== '*' && dow !== '?') {
    const days: Record<string, string> = { '0': 'Sun', '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat' };
    return `Weekly (${days[dow] || dow}) at ${hour}:00`;
  }
  if (month !== '*') return `${month.includes(',') ? 'Quarterly' : 'Monthly'} (day ${dom}) at ${hour}:00`;
  if (dom !== '*') return `Monthly (day ${dom}) at ${hour}:00`;
  return `Daily at ${hour}:00`;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  success: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  error: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  running: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500 animate-pulse' },
  skipped: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
  never_run: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-400' },
};

const SOURCE_CATEGORIES: Record<string, string[]> = {
  'ABF Reference Files (Official Data)': [
    'hs_descriptions', 'schedule3', 'exchange_rates', 'instruments', 'preference_schemes',
    'statistical_units', 'abf_permits', 'tariff_concordance',
  ],
  'Tariff Schedules (1-16)': ['schedule1', 'schedule2', 'fta_schedules'],
  'Legislation': ['customs_act', 'customs_tariff_act', 'gst_act', 'customs_regs', 'anti_dumping_act', 'prohibited_imports', 'prohibited_exports'],
  'Trade & Compliance': ['dumping_notices', 'customs_notices', 'trade_desc', 'biosecurity', 'illegal_logging', 'imported_food'],
  'Reference': ['chemical_index', 'ahecc'],
};

export default function AdminPage() {
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'status' | 'logs'>('status');
  const [logFilter, setLogFilter] = useState('');
  const [expandedError, setExpandedError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/update', { headers });
      const data = await res.json();
      setSources(Array.isArray(data) ? data : data.sources || []);
    } catch (e) {
      console.error('Failed to fetch status:', e);
    }
    setLoading(false);
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const url = logFilter
        ? `/api/admin/update-log?source=${logFilter}&limit=50`
        : '/api/admin/update-log?limit=50';
      const res = await fetch(url, { headers });
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : data.logs || []);
    } catch (e) {
      console.error('Failed to fetch logs:', e);
    }
  }, [logFilter]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);
  useEffect(() => { if (activeTab === 'logs') fetchLogs(); }, [activeTab, fetchLogs]);

  // Auto-refresh every 5s when any source is running
  useEffect(() => {
    const hasRunning = sources.some(s => s.last_status === 'running') || updating.size > 0;
    if (!hasRunning) return;
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, [sources, updating, fetchStatus]);

  async function triggerUpdate(sourceId: string) {
    setUpdating(prev => new Set(prev).add(sourceId));
    try {
      await fetch('/api/admin/update', {
        method: 'POST',
        headers,
        body: JSON.stringify({ source: sourceId, force: true }),
      });
      // Poll status until it's no longer running
      const poll = setInterval(async () => {
        await fetchStatus();
        const current = sources.find(s => s.source_id === sourceId);
        if (current && current.last_status !== 'running') {
          clearInterval(poll);
          setUpdating(prev => { const n = new Set(prev); n.delete(sourceId); return n; });
          if (activeTab === 'logs') fetchLogs();
        }
      }, 3000);
      // Safety timeout after 5 minutes
      setTimeout(() => {
        clearInterval(poll);
        setUpdating(prev => { const n = new Set(prev); n.delete(sourceId); return n; });
        fetchStatus();
      }, 300_000);
    } catch (e) {
      setUpdating(prev => { const n = new Set(prev); n.delete(sourceId); return n; });
    }
  }

  async function triggerAll() {
    setUpdating(new Set(sources.map(s => s.source_id)));
    await fetch('/api/admin/update', {
      method: 'POST',
      headers,
      body: JSON.stringify({ source: 'all', force: true }),
    });
    const poll = setInterval(async () => {
      await fetchStatus();
    }, 5000);
    setTimeout(() => { clearInterval(poll); setUpdating(new Set()); fetchStatus(); }, 600_000);
  }

  const stats = {
    total: sources.length,
    success: sources.filter(s => s.last_status === 'success').length,
    error: sources.filter(s => s.last_status === 'error').length,
    neverRun: sources.filter(s => s.last_status === 'never_run').length,
    totalRecords: sources.reduce((sum, s) => sum + (s.record_count || 0), 0),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#0C2340] text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Data Update Administration</h1>
            <p className="text-sm text-blue-200">Manage programmatic updates for all tariff data sources</p>
          </div>
          <Link href="/search" className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded transition-colors">
            &larr; Back to Tariff Search
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Data Pipeline Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Data Pipeline</p>
              <div className="grid grid-cols-3 gap-4 text-xs text-blue-700">
                <div>
                  <span className="font-medium">Layer 1 — Descriptions:</span> GitHub/UN Comtrade HS dataset (6,939 codes, monthly)
                </div>
                <div>
                  <span className="font-medium">Layer 2 — Codes + Rates:</span> ABF reference files TRFCSNAP + TFRPSNAP (8,021 codes, daily)
                </div>
                <div>
                  <span className="font-medium">Layer 3 — Schedules:</span> ABF website HTML scrape for FTA exclusions (19 schedules)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500 uppercase font-medium">Data Sources</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-700">{stats.success}</div>
            <div className="text-xs text-gray-500 uppercase font-medium">Up to Date</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
            <div className="text-2xl font-bold text-red-700">{stats.error}</div>
            <div className="text-xs text-gray-500 uppercase font-medium">Errors</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
            <div className="text-2xl font-bold text-yellow-700">{stats.neverRun}</div>
            <div className="text-xs text-gray-500 uppercase font-medium">Never Updated</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-indigo-500">
            <div className="text-2xl font-bold text-indigo-700">{stats.totalRecords.toLocaleString()}</div>
            <div className="text-xs text-gray-500 uppercase font-medium">Total Records</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex bg-white rounded-lg shadow-sm border">
            <button
              onClick={() => setActiveTab('status')}
              className={`px-5 py-2.5 text-sm font-medium rounded-l-lg transition-colors ${
                activeTab === 'status' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Source Status
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-5 py-2.5 text-sm font-medium rounded-r-lg transition-colors ${
                activeTab === 'logs' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Update Logs
            </button>
          </div>
          <div className="flex-1" />
          <button
            onClick={triggerAll}
            disabled={updating.size > 0}
            className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {updating.size > 0 ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                Updating {updating.size} sources...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Update All Sources
              </>
            )}
          </button>
          <button
            onClick={() => { fetchStatus(); if (activeTab === 'logs') fetchLogs(); }}
            className="px-3 py-2.5 bg-white border text-sm text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-400">Loading...</div>
        ) : activeTab === 'status' ? (
          /* ── Status Dashboard ───────────────────────────────────── */
          <div className="space-y-6">
            {Object.entries(SOURCE_CATEGORIES).map(([category, sourceIds]) => {
              const categorySources = sources.filter(s => sourceIds.includes(s.source_id));
              if (categorySources.length === 0) return null;
              return (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{category}</h3>
                  <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b text-left text-xs font-semibold text-gray-500 uppercase">
                          <th className="px-4 py-3 w-8">Status</th>
                          <th className="px-4 py-3">Source</th>
                          <th className="px-4 py-3 text-right">Records</th>
                          <th className="px-4 py-3">Last Updated</th>
                          <th className="px-4 py-3">Schedule</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {categorySources.map((s) => {
                          const colors = STATUS_COLORS[s.last_status] || STATUS_COLORS.never_run;
                          const isRunning = s.last_status === 'running' || updating.has(s.source_id);
                          return (
                            <tr key={s.source_id} className={`${isRunning ? 'bg-blue-50/50' : 'hover:bg-gray-50'} transition-colors`}>
                              <td className="px-4 py-3">
                                <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} title={s.last_status} />
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium text-sm text-gray-900">{s.source_name}</div>
                                <div className="text-xs text-gray-400 font-mono">{s.source_id}</div>
                                {s.last_status === 'error' && s.last_error && (
                                  <button
                                    onClick={() => setExpandedError(expandedError === s.source_id ? null : s.source_id)}
                                    className="text-xs text-red-600 hover:text-red-800 mt-0.5 flex items-center gap-1"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    {expandedError === s.source_id ? 'Hide error' : 'View error'}
                                  </button>
                                )}
                                {expandedError === s.source_id && s.last_error && (
                                  <div className="mt-1 text-xs text-red-600 bg-red-50 rounded p-2 max-w-md break-all">
                                    {s.last_error}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="font-mono text-sm text-gray-700">{s.record_count.toLocaleString()}</span>
                                {s.records_added > 0 && (
                                  <span className="text-xs text-green-600 ml-1">+{s.records_added}</span>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-gray-700">{timeAgo(s.last_updated_at)}</div>
                                {s.last_checked_at && (
                                  <div className="text-xs text-gray-400">Checked {timeAgo(s.last_checked_at)}</div>
                                )}
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-xs text-gray-600">{cronToHuman(s.schedule_cron)}</div>
                                <div className={`text-[10px] ${s.schedule_enabled ? 'text-green-600' : 'text-gray-400'}`}>
                                  {s.schedule_enabled ? 'Enabled' : 'Disabled'}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  onClick={() => triggerUpdate(s.source_id)}
                                  disabled={isRunning}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                    isRunning
                                      ? 'bg-blue-100 text-blue-600 cursor-not-allowed'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  {isRunning ? (
                                    <>
                                      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                      Update
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Update Logs ────────────────────────────────────────── */
          <div>
            <div className="mb-4 flex items-center gap-3">
              <select
                value={logFilter}
                onChange={(e) => setLogFilter(e.target.value)}
                className="px-3 py-2 bg-white border rounded-lg text-sm text-gray-700"
              >
                <option value="">All sources</option>
                {sources.map(s => (
                  <option key={s.source_id} value={s.source_id}>{s.source_name}</option>
                ))}
              </select>
              <button onClick={fetchLogs} className="px-3 py-2 bg-white border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Refresh
              </button>
            </div>
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b text-left text-xs font-semibold text-gray-500 uppercase">
                    <th className="px-4 py-3 w-8">Status</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Started</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3 text-right">Before</th>
                    <th className="px-4 py-3 text-right">After</th>
                    <th className="px-4 py-3 text-right">+Added</th>
                    <th className="px-4 py-3 text-right">-Removed</th>
                    <th className="px-4 py-3">Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.length === 0 ? (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-400">No update logs yet</td></tr>
                  ) : logs.map((log) => {
                    const colors = STATUS_COLORS[log.status] || STATUS_COLORS.never_run;
                    const duration = log.completed_at && log.started_at
                      ? ((new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000).toFixed(1) + 's'
                      : '\u2014';
                    return (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${colors.bg} ${colors.text}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-sm font-mono text-gray-600">{log.source_id}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500">
                          {new Date(log.started_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-gray-500 font-mono">{duration}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500 text-right font-mono">{log.records_before ?? '\u2014'}</td>
                        <td className="px-4 py-2.5 text-xs text-gray-500 text-right font-mono">{log.records_after ?? '\u2014'}</td>
                        <td className="px-4 py-2.5 text-xs text-right font-mono text-green-600">
                          {log.records_added > 0 ? `+${log.records_added}` : '\u2014'}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-right font-mono text-red-600">
                          {log.records_removed > 0 ? `-${log.records_removed}` : '\u2014'}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-red-500 max-w-xs truncate" title={log.error_message || ''}>
                          {log.error_message || '\u2014'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
