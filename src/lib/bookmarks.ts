/**
 * localStorage bookmark CRUD for tariff codes.
 */

const STORAGE_KEY = 'tariff_bookmarks';

export interface Bookmark {
  code: string;
  description: string;
  duty_rate: string;
  unit: string;
  notes: string;
  created_at: string;
}

function readStore(): Bookmark[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Bookmark[];
  } catch {
    return [];
  }
}

function writeStore(bookmarks: Bookmark[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

export function getBookmarks(): Bookmark[] {
  return readStore();
}

export function addBookmark(b: Omit<Bookmark, 'created_at'>): void {
  const bookmarks = readStore();
  // Prevent duplicates
  if (bookmarks.some((bk) => bk.code === b.code)) return;
  bookmarks.push({
    ...b,
    created_at: new Date().toISOString(),
  });
  writeStore(bookmarks);
}

export function removeBookmark(code: string): void {
  const bookmarks = readStore().filter((b) => b.code !== code);
  writeStore(bookmarks);
}

export function isBookmarked(code: string): boolean {
  return readStore().some((b) => b.code === code);
}

export function updateBookmarkNotes(code: string, notes: string): void {
  const bookmarks = readStore();
  const target = bookmarks.find((b) => b.code === code);
  if (target) {
    target.notes = notes;
    writeStore(bookmarks);
  }
}
