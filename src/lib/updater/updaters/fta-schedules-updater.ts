import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { scrapeFtaSchedule, type FtaExclusionRow } from '../scrapers/abf-scraper';
import { logInfo, logError } from '../update-logger';

/**
 * FTA Schedules (4-16) — Free Trade Agreement exclusion tables.
 * Scrapes each FTA schedule from ABF and rebuilds tariff_fta_exclusions.
 */
export class FtaSchedulesUpdater extends BaseUpdater {
  readonly sourceId = 'fta_schedules';
  readonly sourceName = 'FTA Schedules 4-16 — Exclusions';
  readonly defaultCron = '0 3 15 * *'; // 3 AM on the 15th of every month
  readonly targetTables = ['tariff_fta_exclusions'];

  /** Schedule numbers for FTA exclusion tables. */
  private readonly scheduleNumbers = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];

  async fetch(): Promise<FtaExclusionRow[]> {
    const allRows: FtaExclusionRow[] = [];

    for (const num of this.scheduleNumbers) {
      try {
        const rows = await scrapeFtaSchedule(num);
        allRows.push(...rows);
      } catch (err: any) {
        logError(
          this.sourceId,
          `Failed to scrape FTA schedule ${num}: ${err?.message ?? err}`
        );
      }
    }

    logInfo(this.sourceId, `Total FTA exclusion rows fetched: ${allRows.length}`);
    return allRows;
  }

  apply(db: Database.Database, data: FtaExclusionRow[]): ApplyResult {
    db.prepare('DELETE FROM tariff_fta_exclusions').run();

    const insert = db.prepare(
      `INSERT INTO tariff_fta_exclusions (schedule, fta_name, hs_code, description, duty_rate)
       VALUES (?, ?, ?, ?, ?)`
    );

    for (const row of data) {
      insert.run(row.schedule, row.ftaName, row.hsCode, row.description, row.dutyRate);
    }

    return { added: data.length, removed: 0, modified: 0, total: data.length };
  }
}
