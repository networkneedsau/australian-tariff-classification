import { fetchAndParse, fetchPage, parsePage } from './html-scraper';
import { logInfo } from '../update-logger';

// ---------- constants ----------

export const ABF_BASE =
  'https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff';

const SRC = 'abf';

// ---------- types ----------

export interface CountryEntry {
  country: string;
  abbreviation: string;
  schedule: string;
  category: string;
}

export interface SectionLink {
  sectionNumber: string;
  title: string;
  url: string;
}

export interface TariffRow {
  code: string;
  statisticalCode: string | null;
  description: string;
  unit: string | null;
  dutyRate: string | null;
}

export interface FtaExclusionRow {
  schedule: string;
  ftaName: string;
  hsCode: string;
  description: string;
  dutyRate: string | null;
}

// ---------- scrapers ----------

/**
 * Scrape Schedule 1 (country/treaty tables) from the ABF current-tariff page.
 */
export async function scrapeSchedule1(): Promise<CountryEntry[]> {
  const url = `${ABF_BASE}/schedule-1`;
  logInfo(SRC, `Fetching Schedule 1 from ${url}`);
  const $ = await fetchAndParse(url);

  const entries: CountryEntry[] = [];

  $('table').each((_i, table) => {
    // Determine schedule/category from the heading preceding the table
    const heading = $(table).prevAll('h2, h3').first().text().trim();
    const schedule = 'Schedule 1';
    const category = heading || 'General';

    $(table)
      .find('tbody tr')
      .each((_j, tr) => {
        const cells = $(tr).find('td');
        if (cells.length >= 2) {
          const country = $(cells[0]).text().trim();
          const abbreviation = $(cells[1]).text().trim();
          if (country) {
            entries.push({ country, abbreviation, schedule, category });
          }
        }
      });
  });

  logInfo(SRC, `Schedule 1 scraped — ${entries.length} country entries`);
  return entries;
}

/**
 * Scrape Schedule 3 index page and return section links.
 * The ABF structure is: /schedule-3 → section-i through section-xxi
 */
export async function scrapeSchedule3Sections(): Promise<SectionLink[]> {
  const url = `${ABF_BASE}/schedule-3`;
  logInfo(SRC, `Fetching Schedule 3 sections from ${url}`);
  const $ = await fetchAndParse(url);

  const links: SectionLink[] = [];
  const seen = new Set<string>();

  // Find links to section pages (e.g. /schedule-3/section-i)
  $('a[href*="schedule-3/section-"]').each((_i, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    if (!href || !text) return;
    const fullUrl = href.startsWith('http') ? href : `https://www.abf.gov.au${href}`;
    if (seen.has(fullUrl)) return;
    seen.add(fullUrl);

    // Extract roman numeral from URL (section-i, section-ii, etc.)
    const sectionMatch = fullUrl.match(/section-([ivxlcdm]+)$/i);
    const sectionNumber = sectionMatch ? sectionMatch[1].toUpperCase() : text;
    links.push({ sectionNumber, title: text, url: fullUrl });
  });

  logInfo(SRC, `Schedule 3 — ${links.length} section links found`);
  return links;
}

/**
 * For a section page, find all chapter links within it.
 * Section pages contain links like /schedule-3/section-i/chapter-1
 */
export async function scrapeSchedule3ChapterLinks(sectionUrl: string): Promise<string[]> {
  logInfo(SRC, `Fetching chapter links from section: ${sectionUrl}`);
  const $ = await fetchAndParse(sectionUrl);

  const chapterUrls: string[] = [];
  const seen = new Set<string>();

  $('a[href*="chapter-"]').each((_i, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const fullUrl = href.startsWith('http') ? href : `https://www.abf.gov.au${href}`;
    if (seen.has(fullUrl)) return;
    seen.add(fullUrl);
    chapterUrls.push(fullUrl);
  });

  logInfo(SRC, `Section has ${chapterUrls.length} chapter links`);
  return chapterUrls;
}

export interface Schedule3Row extends TariffRow {
  chapterNumber: string;
  chapterTitle: string;
  headingCode: string;
  headingDescription: string;
}

/**
 * Scrape a single Schedule 3 chapter page and return tariff row data.
 * Chapter pages have the actual classification tables with columns:
 * Reference Number | Statistical Code | Unit | Goods | Rate# | Tariff concession orders
 */
export async function scrapeSchedule3Chapter(
  url: string
): Promise<Schedule3Row[]> {
  logInfo(SRC, `Fetching chapter from ${url}`);
  const $ = await fetchAndParse(url);

  const rows: Schedule3Row[] = [];

  // Extract chapter info from the page heading
  const pageTitle = $('h1, h2').first().text().trim();
  const chapterMatch = pageTitle.match(/Chapter\s+(\d+)\s*[-–—]\s*(.*)/i);
  const chapterNumber = chapterMatch ? chapterMatch[1] : '';
  const chapterTitle = chapterMatch ? chapterMatch[2].trim() : pageTitle;

  let currentHeadingCode = '';
  let currentHeadingDesc = '';

  // Process all tables on the page (each heading group has its own table)
  $('table').each((_ti, table) => {
    $(table).find('tr').each((_i, tr) => {
      const cells = $(tr).find('td, th');
      if (cells.length < 2) return;

      // Check if this is a header row (th cells or dark background)
      const isHeader = $(tr).find('th').length > 0;
      if (isHeader) return;

      const firstCell = $(cells[0]).text().replace(/[\u200B-\u200D\uFEFF\u00AD\u2605]/g, '').trim();

      // Skip empty rows
      if (!firstCell) return;

      // Check if this is a heading row (4-digit code like "0101" with no stat code)
      if (/^\d{4}$/.test(firstCell.replace(/\./g, '').substring(0, 4)) && firstCell.length <= 7 && !firstCell.includes('.')) {
        currentHeadingCode = firstCell;
        // Description is in a later cell
        for (let ci = 1; ci < cells.length; ci++) {
          const txt = $(cells[ci]).text().trim();
          if (txt && txt.length > 2) { currentHeadingDesc = txt; break; }
        }
        return;
      }

      // Check if this is a subheading or classification row (has dots like "0101.21.00")
      if (/^\d{4}\./.test(firstCell)) {
        // This is a classification row
        // ABF table structure: Reference Number | Statistical Code | Unit | Goods | Rate# | TCOs
        const code = firstCell;

        let statisticalCode: string | null = null;
        let description = '';
        let unit: string | null = null;
        let dutyRate: string | null = null;

        if (cells.length >= 6) {
          // Full row: RefNum | Stat | Unit | Goods | Rate | TCO
          statisticalCode = $(cells[1]).text().trim() || null;
          unit = $(cells[2]).text().trim() || null;
          description = $(cells[3]).text().trim();
          dutyRate = $(cells[4]).text().trim() || null;
        } else if (cells.length >= 4) {
          // Shorter row: RefNum | Stat? | Goods | Rate
          const secondCell = $(cells[1]).text().trim();
          if (/^\d{1,3}$/.test(secondCell)) {
            statisticalCode = secondCell;
            description = $(cells[2]).text().trim();
            dutyRate = cells.length >= 4 ? $(cells[3]).text().trim() || null : null;
          } else {
            description = secondCell;
            dutyRate = $(cells[2]).text().trim() || null;
          }
        } else if (cells.length >= 2) {
          // Minimal row: RefNum | Goods
          description = $(cells[1]).text().trim();
        }

        if (code && (description || statisticalCode)) {
          // Clean up zero-width characters
          const cleanCode = code.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '').trim();
          rows.push({
            code: cleanCode,
            statisticalCode: statisticalCode?.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '').trim() || null,
            description,
            unit: unit === 'No' || unit === 'Kg' || unit === 'L' || unit === 'M' || unit === 'M2' || unit === 'M3' ? unit : unit,
            dutyRate,
            chapterNumber,
            chapterTitle,
            headingCode: currentHeadingCode || cleanCode.substring(0, 4),
            headingDescription: currentHeadingDesc,
          });
        }
      }
    });
  });

  logInfo(SRC, `Chapter ${chapterNumber} scraped — ${rows.length} classifications`);
  return rows;
}

/**
 * Scrape an FTA exclusion schedule (Schedule 4, 5, etc.) and return the
 * exclusion table rows.
 */
export async function scrapeFtaSchedule(
  scheduleNum: number
): Promise<FtaExclusionRow[]> {
  const url = `${ABF_BASE}/schedule-${scheduleNum}`;
  logInfo(SRC, `Fetching FTA schedule ${scheduleNum} from ${url}`);
  const $ = await fetchAndParse(url);

  const rows: FtaExclusionRow[] = [];
  const scheduleName = `Schedule ${scheduleNum}`;

  // Try to find the FTA name from a heading
  const ftaName =
    $('h1').first().text().trim() || `FTA Schedule ${scheduleNum}`;

  $('table')
    .find('tbody tr')
    .each((_i, tr) => {
      const cells = $(tr).find('td');
      if (cells.length >= 2) {
        const hsCode = $(cells[0]).text().trim();
        const description = $(cells[1]).text().trim();
        const dutyRate =
          cells.length >= 3 ? $(cells[2]).text().trim() || null : null;

        if (hsCode) {
          rows.push({
            schedule: scheduleName,
            ftaName,
            hsCode,
            description,
            dutyRate,
          });
        }
      }
    });

  logInfo(SRC, `FTA schedule ${scheduleNum} — ${rows.length} exclusion rows`);
  return rows;
}
