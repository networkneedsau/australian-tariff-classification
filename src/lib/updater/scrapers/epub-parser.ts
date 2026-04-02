import * as cheerio from 'cheerio';
import { execSync } from 'child_process';
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  existsSync,
  rmSync,
} from 'fs';
import { join } from 'path';
import os from 'os';
import { fetchPage } from './html-scraper';
import { logInfo, logWarn, logError } from '../update-logger';

const SRC = 'epub-parser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LegislationSection {
  part: string;
  part_title: string;
  division: string;
  division_title: string;
  section_number: string;
  section_title: string;
  content: string;
  schedule: string;
}

// ---------------------------------------------------------------------------
// EPUB download
// ---------------------------------------------------------------------------

/**
 * Resolve the latest compilation date for a legislation Series ID by
 * scraping the legislation.gov.au "latest" redirect or Series page.
 *
 * Returns the date string like "2026-01-22" or null if it cannot be resolved.
 */
async function resolveLatestDate(seriesId: string): Promise<string | null> {
  try {
    // The /latest page usually redirects to /SERIES_ID/DATE/DATE/...
    // We can fetch the Series page and look for the latest date link.
    const url = `https://www.legislation.gov.au/${seriesId}/latest`;
    const html = await fetchPage(url, { retries: 2, timeoutMs: 20_000 });

    // Look for date patterns in the redirected content or links
    // Pattern: /SERIES_ID/YYYY-MM-DD/ in hrefs
    const datePattern = new RegExp(
      `${seriesId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(\\d{4}-\\d{2}-\\d{2})`,
      'g'
    );
    const matches = html.match(datePattern);
    if (matches && matches.length > 0) {
      // Extract the date portion from the last match
      const dateMatch = matches[matches.length - 1].match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) return dateMatch[1];
    }

    // Fallback: look for any YYYY-MM-DD date on the page
    const anyDate = html.match(/(\d{4}-\d{2}-\d{2})/g);
    if (anyDate && anyDate.length > 0) {
      // Return the most recent-looking date
      const sorted = [...new Set(anyDate)].sort().reverse();
      return sorted[0];
    }
  } catch (err: any) {
    logWarn(SRC, `Could not resolve latest date for ${seriesId}: ${err?.message}`);
  }
  return null;
}

/**
 * Download an EPUB from legislation.gov.au and extract its HTML content.
 *
 * Tries multiple URL patterns:
 * 1. Direct EPUB download with known date
 * 2. /latest/downloads/epub endpoint
 * 3. Individual OEBPS HTML documents
 */
export async function downloadLegislationEpub(
  seriesId: string,
  date?: string
): Promise<string> {
  const urls: string[] = [];

  if (date) {
    urls.push(
      `https://www.legislation.gov.au/${seriesId}/${date}/${date}/text/original/epub`
    );
  }

  // Try the /latest/downloads/epub endpoint
  urls.push(
    `https://www.legislation.gov.au/${seriesId}/latest/downloads/epub`
  );

  // Resolve the latest date and try the date-specific URL
  if (!date) {
    const resolvedDate = await resolveLatestDate(seriesId);
    if (resolvedDate) {
      urls.unshift(
        `https://www.legislation.gov.au/${seriesId}/${resolvedDate}/${resolvedDate}/text/original/epub`
      );
    }
  }

  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      logInfo(SRC, `Attempting EPUB download: ${url}`);
      const html = await downloadAndExtract(url);
      if (html && html.trim().length > 100) {
        logInfo(SRC, `Successfully downloaded EPUB (${html.length} chars) from ${url}`);
        return html;
      }
    } catch (err: any) {
      lastError = err;
      logWarn(SRC, `EPUB download failed for ${url}: ${err?.message}`);
    }
  }

  throw lastError ?? new Error(`Failed to download EPUB for ${seriesId}`);
}

/**
 * Download an EPUB file (ZIP) and extract all HTML content from it.
 */
async function downloadAndExtract(url: string): Promise<string> {
  // Fetch the EPUB as binary
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);

  const res = await fetch(url, {
    signal: controller.signal,
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Accept:
        'application/epub+zip,application/zip,application/octet-stream,*/*',
      'Accept-Language': 'en-AU,en;q=0.9',
    },
  });

  clearTimeout(timer);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }

  const contentType = res.headers.get('content-type') || '';

  // If the response is HTML (not an EPUB), it may be the legislation page itself
  if (contentType.includes('text/html') || contentType.includes('application/xhtml')) {
    const text = await res.text();
    // Check if it looks like legislation XHTML content (has CSS classes we know)
    if (
      text.includes('ActHead') ||
      text.includes('subsection') ||
      text.includes('class="section"')
    ) {
      return text;
    }
    throw new Error(`Got HTML page instead of EPUB from ${url}`);
  }

  // It should be a ZIP/EPUB file
  const buffer = Buffer.from(await res.arrayBuffer());
  return extractEpubHtml(buffer);
}

/**
 * Extract HTML content from an EPUB buffer (which is a ZIP file).
 * Uses the system `unzip` command via child_process.
 */
function extractEpubHtml(epubBuffer: Buffer): string {
  const tmpDir = mkdtempSync(join(os.tmpdir(), 'epub-'));

  try {
    const epubPath = join(tmpDir, 'doc.epub');
    writeFileSync(epubPath, epubBuffer);

    // Unzip — use -o to overwrite without prompting
    try {
      execSync(`unzip -o "${epubPath}" -d "${tmpDir}"`, {
        stdio: 'pipe',
        timeout: 30_000,
      });
    } catch (err: any) {
      // unzip may return exit code 1 for warnings but still extract OK
      if (!existsSync(join(tmpDir, 'OEBPS')) && !existsSync(join(tmpDir, 'META-INF'))) {
        // Try PowerShell Expand-Archive as fallback on Windows
        try {
          execSync(
            `powershell -NoProfile -Command "Expand-Archive -Path '${epubPath}' -DestinationPath '${tmpDir}' -Force"`,
            { stdio: 'pipe', timeout: 30_000 }
          );
        } catch {
          throw new Error(`Failed to unzip EPUB: ${err?.message}`);
        }
      }
    }

    // Collect all HTML/XHTML files from the EPUB
    let html = '';

    // Standard EPUB structure: OEBPS/document_N/document_N.html
    const oebpsPath = join(tmpDir, 'OEBPS');
    if (existsSync(oebpsPath)) {
      html = collectHtmlFromDir(oebpsPath);
    }

    // Some EPUBs put HTML at the root or in other dirs
    if (!html) {
      html = collectHtmlFromDir(tmpDir);
    }

    if (!html) {
      throw new Error('No HTML content found in EPUB');
    }

    return html;
  } finally {
    // Clean up temp dir
    try {
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Non-fatal cleanup failure
    }
  }
}

/**
 * Recursively collect all HTML/XHTML file contents from a directory.
 * Sorts files by name to maintain document order.
 */
function collectHtmlFromDir(dir: string): string {
  let html = '';
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true })
  );

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      // Look for HTML files inside subdirectories (e.g., document_1/document_1.html)
      const subHtml = collectHtmlFromDir(fullPath);
      if (subHtml) html += subHtml;
    } else if (
      entry.name.endsWith('.html') ||
      entry.name.endsWith('.xhtml') ||
      entry.name.endsWith('.htm')
    ) {
      // Skip navigation/toc files
      if (
        entry.name === 'toc.html' ||
        entry.name === 'nav.html' ||
        entry.name === 'toc.xhtml' ||
        entry.name === 'nav.xhtml'
      ) {
        continue;
      }
      try {
        html += readFileSync(fullPath, 'utf8');
      } catch {
        // Skip unreadable files
      }
    }
  }

  return html;
}

// ---------------------------------------------------------------------------
// HTML parsing
// ---------------------------------------------------------------------------

/**
 * Parse legislation XHTML (from an EPUB) into structured sections.
 *
 * Recognises the CSS classes used in legislation.gov.au EPUBs:
 *   - ActHead1  -> Schedule heading
 *   - ActHead2  -> Part heading (within schedule or main body)
 *   - ActHead3  -> Division heading
 *   - ActHead4  -> Subdivision heading
 *   - ActHead5  -> Section / Regulation heading
 *   - subsection, paragraph, paragraphsub, Definition, notetext, SubsectionHead
 */
export async function parseLegislationHtml(
  html: string
): Promise<LegislationSection[]> {
  const $ = cheerio.load(html);
  const sections: LegislationSection[] = [];

  // Current context as we walk the DOM
  let currentSchedule = '';
  let currentPart = '';
  let currentPartTitle = '';
  let currentDivision = '';
  let currentDivisionTitle = '';
  let currentSectionNumber = '';
  let currentSectionTitle = '';
  let contentParts: string[] = [];

  // CSS classes that define section boundaries or structure
  const headingClasses = [
    'ActHead1',   // Schedule
    'ActHead2',   // Part
    'ActHead3',   // Division
    'ActHead4',   // Subdivision
    'ActHead5',   // Section/Regulation heading
  ];

  const contentClasses = [
    'subsection',
    'paragraph',
    'paragraphsub',
    'subparagraph',
    'Definition',
    'notetext',
    'SubsectionHead',
    'Bodytext',
    'Tabletext',
    'ScheduleText',
  ];

  /** Flush the current section into the sections array */
  function flushSection(): void {
    if (currentSectionNumber) {
      const content = contentParts
        .join('\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      sections.push({
        part: currentPart,
        part_title: currentPartTitle,
        division: currentDivision,
        division_title: currentDivisionTitle,
        section_number: currentSectionNumber,
        section_title: currentSectionTitle,
        content,
        schedule: currentSchedule,
      });
    }
    contentParts = [];
    currentSectionNumber = '';
    currentSectionTitle = '';
  }

  // Walk all <p> and heading elements in document order
  $('p, h1, h2, h3, h4, h5, h6, tr').each((_i, el) => {
    const $el = $(el);
    const className = ($el.attr('class') || '').trim();
    const text = $el.text().trim();

    if (!text) return;

    // ---- Schedule heading (ActHead1) ----
    if (className.includes('ActHead1')) {
      flushSection();
      const schedMatch = text.match(/Schedule\s+(\S+)/i);
      currentSchedule = schedMatch ? `Schedule ${schedMatch[1]}` : text;
      // Reset sub-context within a new schedule
      currentPart = '';
      currentPartTitle = '';
      currentDivision = '';
      currentDivisionTitle = '';
      return;
    }

    // ---- Part heading (ActHead2) ----
    if (className.includes('ActHead2')) {
      flushSection();
      const partMatch = text.match(/Part\s+(\S+)\s*[—–\-]\s*(.*)/i);
      if (partMatch) {
        currentPart = `Part ${partMatch[1]}`;
        currentPartTitle = partMatch[2].trim();
      } else {
        const simplePart = text.match(/Part\s+(\S+)/i);
        currentPart = simplePart ? `Part ${simplePart[1]}` : text;
        currentPartTitle = simplePart ? text.replace(simplePart[0], '').replace(/^[—–\-\s]+/, '').trim() : '';
      }
      currentDivision = '';
      currentDivisionTitle = '';
      return;
    }

    // ---- Division heading (ActHead3) ----
    if (className.includes('ActHead3')) {
      flushSection();
      const divMatch = text.match(/Division\s+(\S+)\s*[—–\-]\s*(.*)/i);
      if (divMatch) {
        currentDivision = `Division ${divMatch[1]}`;
        currentDivisionTitle = divMatch[2].trim();
      } else {
        const simpleDiv = text.match(/Division\s+(\S+)/i);
        currentDivision = simpleDiv ? `Division ${simpleDiv[1]}` : text;
        currentDivisionTitle = simpleDiv ? text.replace(simpleDiv[0], '').replace(/^[—–\-\s]+/, '').trim() : '';
      }
      return;
    }

    // ---- Subdivision heading (ActHead4) ----
    if (className.includes('ActHead4')) {
      // Track subdivision context but don't flush — it's part of the division
      return;
    }

    // ---- Section / Regulation heading (ActHead5) ----
    if (className.includes('ActHead5')) {
      flushSection();
      // Extract section number and title
      // Patterns: "4F  Importation of firearms..." or "1  Short title" or "12A  Definitions"
      const secMatch = text.match(/^(\d+[A-Za-z]*(?:\.\d+)?)\s+(.*)/);
      if (secMatch) {
        currentSectionNumber = secMatch[1];
        currentSectionTitle = secMatch[2].trim();
      } else {
        // Some headings might just be the number
        currentSectionNumber = text.replace(/\s+/g, ' ');
        currentSectionTitle = '';
      }
      return;
    }

    // ---- Chapter heading (for Acts like GST Act, Biosecurity Act) ----
    if (className.includes('ChapNo') || className.includes('ChapterNo')) {
      // Some Acts use "Chapter N" as the top-level grouping mapped to "part"
      flushSection();
      const chapMatch = text.match(/Chapter\s+(\S+)\s*[—–\-]\s*(.*)/i);
      if (chapMatch) {
        currentPart = `Chapter ${chapMatch[1]}`;
        currentPartTitle = chapMatch[2].trim();
      } else {
        currentPart = text;
        currentPartTitle = '';
      }
      return;
    }

    // ---- Content paragraphs ----
    // Only collect content if we're inside a section
    if (currentSectionNumber) {
      const isContentClass = contentClasses.some((cls) => className.includes(cls));
      // Also capture plain paragraphs that don't have heading classes
      const isHeadingClass = headingClasses.some((cls) => className.includes(cls));

      if (isContentClass || (!isHeadingClass && !className.includes('ActHead'))) {
        // Indent sub-paragraphs for readability
        if (className.includes('paragraph') && !className.includes('sub')) {
          contentParts.push(`  ${text}`);
        } else if (className.includes('paragraphsub') || className.includes('subparagraph')) {
          contentParts.push(`    ${text}`);
        } else if (className.includes('Definition')) {
          contentParts.push(`[Definition] ${text}`);
        } else if (className.includes('notetext')) {
          contentParts.push(`[Note] ${text}`);
        } else {
          contentParts.push(text);
        }
      }
    }
  });

  // Flush the last section
  flushSection();

  logInfo(SRC, `Parsed ${sections.length} sections from legislation HTML`);
  return sections;
}

// ---------------------------------------------------------------------------
// Combined: download + parse
// ---------------------------------------------------------------------------

/**
 * Download legislation EPUB from legislation.gov.au and parse it into
 * structured sections.
 *
 * @param seriesId  The legislation Series ID (e.g. "C1901A00006")
 * @param date      Optional specific compilation date (YYYY-MM-DD)
 */
export async function fetchLegislation(
  seriesId: string,
  date?: string
): Promise<LegislationSection[]> {
  const html = await downloadLegislationEpub(seriesId, date);
  return parseLegislationHtml(html);
}
