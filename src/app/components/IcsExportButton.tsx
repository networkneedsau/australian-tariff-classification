'use client';

import { useState } from 'react';
import type { IcsEntryFields } from '@/lib/ics-xml-generator';

interface IcsExportButtonProps {
  entryFields: IcsEntryFields | null;
  disabled?: boolean;
}

export default function IcsExportButton({ entryFields, disabled }: IcsExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDisabled = disabled || !entryFields;

  async function fetchXml(): Promise<string | null> {
    if (!entryFields) return null;
    setError(null);
    const res = await fetch('/api/tariff/ics-xml', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entryFields),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ error: 'Unknown error' }));
      setError(errData.error || 'Failed to generate XML');
      return null;
    }
    return res.text();
  }

  async function handleDownload() {
    setLoading(true);
    try {
      const xml = await fetchXml();
      if (!xml) return;

      const blob = new Blob([xml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ICS-N10-${timestamp}.xml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    setLoading(true);
    try {
      const xml = await fetchXml();
      if (!xml) return;
      await navigator.clipboard.writeText(xml);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Download XML button */}
      <button
        onClick={handleDownload}
        disabled={isDisabled || loading}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isDisabled || loading
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
            : 'bg-blue-900 text-white hover:bg-blue-800 active:bg-blue-950'
        }`}
        title="Download ICS N10 XML"
      >
        {/* Document icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {loading ? 'Generating...' : 'Export ICS XML'}
      </button>

      {/* Copy XML button */}
      <button
        onClick={handleCopy}
        disabled={isDisabled || loading}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isDisabled || loading
            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
            : 'bg-slate-700 text-white hover:bg-slate-600 active:bg-slate-800'
        }`}
        title="Copy XML to clipboard"
      >
        {/* Clipboard icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
          />
        </svg>
        {copied ? 'Copied!' : 'Copy XML'}
      </button>

      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  );
}
