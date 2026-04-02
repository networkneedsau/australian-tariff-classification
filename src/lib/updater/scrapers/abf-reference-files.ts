/**
 * ABF Reference File Downloader & Parser
 *
 * The ABF publishes structured fixed-width text files at
 * https://www.ccf.customs.gov.au/reference/production/main/
 * These are updated daily, require no authentication, and are far more
 * reliable than scraping the ABF HTML pages.
 */

import { fetchPage } from './html-scraper';
import { logInfo, logWarn } from '../update-logger';

const SRC = 'abf-ref';

export const ABF_REF_BASE =
  'https://www.ccf.customs.gov.au/reference/production/main/';

// ── Types ────────────────────────────────────────────────────────────

export interface FieldSpec {
  /** Field name (used as key in the returned record) */
  name: string;
  /** 1-based start position in the line */
  start: number;
  /** Number of characters */
  length: number;
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Fetch the ABF reference directory listing and find the file matching
 * `prefix`. Each prefix (e.g. "TFRPSNAP", "XCHGRATE") has ONE file in
 * the main directory. Returns the full URL to that file.
 */
export async function findLatestFile(prefix: string): Promise<string> {
  logInfo(SRC, `Looking up latest file for prefix "${prefix}"`);

  const html = await fetchPage(ABF_REF_BASE, { timeoutMs: 60_000 });

  // Directory listings are plain HTML with <a href="FILENAME"> links
  const pattern = new RegExp(
    `href=["']?(${prefix}[^"'\\s<>]*)["']?`,
    'gi'
  );

  let match: RegExpExecArray | null;
  const candidates: string[] = [];

  while ((match = pattern.exec(html)) !== null) {
    candidates.push(match[1]);
  }

  if (candidates.length === 0) {
    throw new Error(
      `No file found for prefix "${prefix}" in ABF reference directory`
    );
  }

  // If multiple matches, take the last one (often sorted alphabetically/by date)
  const filename = candidates[candidates.length - 1];
  const fullUrl = `${ABF_REF_BASE}${filename}`;

  logInfo(SRC, `Found file: ${filename}`);
  return fullUrl;
}

/**
 * Download the reference file for the given prefix and return its
 * non-empty, trimmed lines.
 */
export async function downloadRefFile(prefix: string): Promise<string[]> {
  const url = await findLatestFile(prefix);
  logInfo(SRC, `Downloading ${url}`);

  const text = await fetchPage(url, { timeoutMs: 120_000 });
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  logInfo(SRC, `Downloaded ${lines.length} lines for ${prefix}`);
  return lines;
}

/**
 * Parse a fixed-width line using the given field specifications.
 * Positions in `fields` are 1-based (matching ABF documentation).
 * Returns an object with trimmed string values.
 */
export function parseFixedWidth(
  line: string,
  fields: FieldSpec[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const f of fields) {
    const start = f.start - 1; // convert to 0-based
    result[f.name] = line.substring(start, start + f.length).trim();
  }
  return result;
}

/**
 * Split a line on whitespace and return the resulting tokens.
 * This is the simpler alternative to parseFixedWidth for files
 * where fields are space-padded and column positions can vary.
 */
export function splitFields(line: string): string[] {
  return line.trim().split(/\s+/);
}
