'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getBookmarks,
  removeBookmark,
  updateBookmarkNotes,
  type Bookmark,
} from '@/lib/bookmarks';

interface BookmarkPanelProps {
  onSelect: (code: string) => void;
}

export default function BookmarkPanel({ onSelect }: BookmarkPanelProps) {
  const [open, setOpen] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [search, setSearch] = useState('');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');

  const refresh = useCallback(() => {
    setBookmarks(getBookmarks());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, open]);

  // Listen for external bookmark changes (e.g. from main page)
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener('bookmarks-changed', handler);
    return () => window.removeEventListener('bookmarks-changed', handler);
  }, [refresh]);

  const filtered = bookmarks.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.code.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q)
    );
  });

  function handleRemove(code: string) {
    removeBookmark(code);
    refresh();
    window.dispatchEvent(new Event('bookmarks-changed'));
  }

  function handleSaveNotes(code: string) {
    updateBookmarkNotes(code, notesDraft);
    setEditingNotes(null);
    refresh();
  }

  function startEditNotes(bookmark: Bookmark) {
    setEditingNotes(bookmark.code);
    setNotesDraft(bookmark.notes || '');
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-0 top-1/3 z-50 bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-4 rounded-l-lg shadow-lg transition-colors"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        title="Bookmarks"
      >
        {open ? 'Close' : 'Bookmarks'} ({bookmarks.length})
      </button>

      {/* Panel */}
      <div
        className={`fixed right-0 top-0 h-full z-40 bg-white shadow-2xl border-l border-indigo-200 transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ width: '380px' }}
      >
        {/* Header */}
        <div className="bg-indigo-700 text-white px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">Bookmarked Tariffs</h2>
            <button
              onClick={() => setOpen(false)}
              className="text-indigo-200 hover:text-white text-xl leading-none"
            >
              &times;
            </button>
          </div>
          <input
            type="text"
            placeholder="Search bookmarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 rounded bg-indigo-600 text-white placeholder-indigo-300 border border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm"
          />
        </div>

        {/* Bookmark list */}
        <div className="overflow-y-auto" style={{ height: 'calc(100% - 120px)' }}>
          {filtered.length === 0 ? (
            <div className="text-center text-gray-400 py-12 px-4">
              {bookmarks.length === 0
                ? 'No bookmarks yet. Bookmark tariff codes from the main search.'
                : 'No bookmarks match your search.'}
            </div>
          ) : (
            filtered.map((b) => (
              <div
                key={b.code}
                className="border-b border-gray-100 px-4 py-3 hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => onSelect(b.code)}
                      className="text-indigo-700 hover:text-indigo-900 font-mono font-bold text-sm hover:underline text-left"
                    >
                      {b.code}
                    </button>
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                      {b.description}
                    </p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        Duty: <span className="font-medium text-gray-700">{b.duty_rate || 'Free'}</span>
                      </span>
                      {b.unit && (
                        <span className="text-xs text-gray-500">
                          Unit: <span className="font-medium text-gray-700">{b.unit}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemove(b.code)}
                    className="text-red-400 hover:text-red-600 text-xs flex-shrink-0 mt-0.5"
                    title="Remove bookmark"
                  >
                    Remove
                  </button>
                </div>

                {/* Notes */}
                <div className="mt-2">
                  {editingNotes === b.code ? (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveNotes(b.code);
                          if (e.key === 'Escape') setEditingNotes(null);
                        }}
                        className="flex-1 text-xs border border-indigo-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                        placeholder="Add a note..."
                        autoFocus
                      />
                      <button
                        onClick={() => handleSaveNotes(b.code)}
                        className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNotes(null)}
                        className="text-xs text-gray-500 hover:text-gray-700 px-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditNotes(b)}
                      className="text-xs text-indigo-500 hover:text-indigo-700"
                    >
                      {b.notes ? (
                        <span className="italic text-gray-500">
                          Note: {b.notes}
                        </span>
                      ) : (
                        '+ Add note'
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
