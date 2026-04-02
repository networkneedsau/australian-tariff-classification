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
 */
export async function scrapeSchedule3Sections(): Promise<SectionLink[]> {
  const url = `${ABF_BASE}/schedule-3`;
  logInfo(SRC, `Fetching Schedule 3 sections from ${url}`);
  const $ = await fetchAndParse(url);

  const links: SectionLink[] = [];

  $('a[href*="schedule-3"]').each((_i, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    if (href && text) {
      // Try to extract a section number from the link text
      const match = text.match(/Section\s+(\S+)/i);
      const sectionNumber = match ? match[1] : text;
      const fullUrl = href.startsWith('http')
        ? href
        : `https://www.abf.gov.au${href}`;
      links.push({ sectionNumber, title: text, url: fullUrl });
    }
  });

  logInfo(SRC, `Schedule 3 — ${links.length} section links found`);
  return links;
}

/**
 * Scrape a single Schedule 3 chapter page and return tariff row data.
 */
export async function scrapeSchedule3Chapter(
  url: string
): Promise<TariffRow[]> {
  logInfo(SRC, `Fetching chapter from ${url}`);
  const $ = await fetchAndParse(url);

  const rows: TariffRow[] = [];

  $('table')
    .find('tbody tr')
    .each((_i, tr) => {
      const cells = $(tr).find('td');
      if (cells.length >= 3) {
        const code = $(cells[0]).text().trim();
        const statisticalCode =
          cells.length >= 5 ? $(cells[1]).text().trim() || null : null;

        // Depending on column count, description / unit / duty are offset
        const descIdx = cells.length >= 5 ? 2 : 1;
        const unitIdx = cells.length >= 5 ? 3 : 2;
        const dutyIdx = cells.length >= 5 ? 4 : cells.length - 1;

        const description = $(cells[descIdx]).text().trim();
        const unit =
          unitIdx < cells.length
            ? $(cells[unitIdx]).text().trim() || null
            : null;
        const dutyRate =
          dutyIdx < cells.length
            ? $(cells[dutyIdx]).text().trim() || null
            : null;

        if (code) {
          rows.push({ code, statisticalCode, description, unit, dutyRate });
        }
      }
    });

  logInfo(SRC, `Chapter scraped — ${rows.length} rows`);
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
