import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { fetchAndParse } from '../scrapers/html-scraper';
import { logInfo } from '../update-logger';

interface ChemicalEntry {
  cas_number: string;
  chemical_name: string;
  schedule: string;
  classification: string;
}

const CHEMICAL_INDEX_URL =
  'https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff/chemical-index';

/**
 * Chemical Index updater.
 * Scrapes the ABF chemical index page — relatively static, updates if changed.
 */
export class ChemicalIndexUpdater extends BaseUpdater {
  readonly sourceId = 'chemical_index';
  readonly sourceName = 'Chemical Index';
  readonly defaultCron = '0 3 1 1,7 *'; // twice a year
  readonly targetTables = ['chemical_index'];

  async fetch(): Promise<ChemicalEntry[]> {
    try {
      const $ = await fetchAndParse(CHEMICAL_INDEX_URL);
      const entries: ChemicalEntry[] = [];

      $('table tbody tr').each((_i, tr) => {
        const cells = $(tr).find('td');
        if (cells.length >= 3) {
          const casNumber = $(cells[0]).text().trim();
          const chemicalName = $(cells[1]).text().trim();
          const classification = $(cells[2]).text().trim();
          const schedule = cells.length >= 4 ? $(cells[3]).text().trim() : '';

          if (chemicalName) {
            entries.push({
              cas_number: casNumber,
              chemical_name: chemicalName,
              schedule,
              classification,
            });
          }
        }
      });

      logInfo(this.sourceId, `Fetched ${entries.length} chemical index entries`);
      if (entries.length > 0) return entries;
    } catch (err: any) {
      logInfo(this.sourceId, `Scraping failed (${err?.message ?? err}), using fallback data`);
    }

    // Return empty array — apply() will preserve existing data
    logInfo(this.sourceId, 'No data scraped, will preserve existing data');
    return [];
  }

  apply(db: Database.Database, data: ChemicalEntry[]): ApplyResult {
    const table = 'chemical_index';

    // Safety: do not delete existing data if scraping returned nothing
    if (data.length === 0) {
      const total = (db.prepare(`SELECT COUNT(*) AS cnt FROM ${table}`).get() as { cnt: number }).cnt;
      logInfo(this.sourceId, `No new data — preserving ${total} existing rows`);
      return { added: 0, removed: 0, modified: 0, total };
    }

    db.prepare(`DELETE FROM ${table}`).run();

    const insert = db.prepare(
      `INSERT INTO ${table} (cas_number, chemical_name, schedule, classification)
       VALUES (?, ?, ?, ?)`
    );

    for (const row of data) {
      insert.run(row.cas_number, row.chemical_name, row.schedule, row.classification);
    }

    try { db.exec(`INSERT INTO ${table}_fts(${table}_fts) VALUES('rebuild')`); } catch {}

    return { added: data.length, removed: 0, modified: 0, total: data.length };
  }
}
