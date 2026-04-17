import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { fetchAndParse } from '../scrapers/html-scraper';
import { logInfo } from '../update-logger';

interface DumpingNotice {
  commodity: string;
  countries: string;
  measure_type: string;
  duty_info: string;
  tariff_chapters: string;
  status: string;
  expiry_info: string;
  category: string;
  notes: string;
}

const ABF_DUMPING_URL =
  'https://www.industry.gov.au/anti-dumping-commission';

/**
 * Anti-Dumping Notices updater.
 * Scrapes the ABF anti-dumping page and appends new notices.
 */
export class DumpingNoticesUpdater extends BaseUpdater {
  readonly sourceId = 'dumping_notices';
  readonly sourceName = 'Anti-Dumping Notices';
  readonly defaultCron = '0 3 * * 1'; // weekly on Monday
  readonly targetTables = ['dumping_notices'];

  async fetch(): Promise<DumpingNotice[]> {
    const $ = await fetchAndParse(ABF_DUMPING_URL);
    const notices: DumpingNotice[] = [];

    $('table tbody tr').each((_i, tr) => {
      const cells = $(tr).find('td');
      if (cells.length >= 3) {
        const commodity = $(cells[0]).text().trim();
        const countries = $(cells[1]).text().trim();
        const measureType = cells.length >= 3 ? $(cells[2]).text().trim() : '';
        const dutyInfo = cells.length >= 4 ? $(cells[3]).text().trim() : '';
        const tariffChapters = cells.length >= 5 ? $(cells[4]).text().trim() : '';
        const status = cells.length >= 6 ? $(cells[5]).text().trim() : 'Active';
        const expiryInfo = cells.length >= 7 ? $(cells[6]).text().trim() : '';

        if (commodity) {
          notices.push({
            commodity,
            countries,
            measure_type: measureType,
            duty_info: dutyInfo,
            tariff_chapters: tariffChapters,
            status: status || 'Active',
            expiry_info: expiryInfo,
            category: 'anti-dumping',
            notes: '',
          });
        }
      }
    });

    logInfo(this.sourceId, `Fetched ${notices.length} dumping notices`);
    return notices;
  }

  apply(db: Database.Database, data: DumpingNotice[]): ApplyResult {
    const table = 'dumping_notices';

    // Get existing commodities for dedup
    const existing = new Set<string>(
      (db.prepare(`SELECT commodity FROM ${table}`).all() as { commodity: string }[])
        .map((r) => r.commodity)
    );

    const insert = db.prepare(
      `INSERT INTO ${table} (commodity, countries, measure_type, duty_info, tariff_chapters, status, expiry_info, category, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    let added = 0;
    for (const row of data) {
      if (!existing.has(row.commodity)) {
        insert.run(row.commodity, row.countries, row.measure_type, row.duty_info || '', row.tariff_chapters || '', row.status, row.expiry_info || '', row.category, row.notes || '');
        added++;
      }
    }

    const total = (db.prepare(`SELECT COUNT(*) AS cnt FROM ${table}`).get() as { cnt: number }).cnt;

    try { db.exec(`INSERT INTO ${table}_fts(${table}_fts) VALUES('rebuild')`); } catch {}

    return { added, removed: 0, modified: 0, total };
  }
}
