import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { scrapeFtaSchedule, type FtaExclusionRow } from '../scrapers/abf-scraper';
import { logInfo, logError } from '../update-logger';

/**
 * FTA Schedules (4-16 including sub-schedules) — Free Trade Agreement exclusion tables.
 * Scrapes each FTA schedule from ABF and rebuilds tariff_fta_exclusions.
 *
 * All 21 Australian FTA schedules:
 * 4: Concessional goods           4a: SAFTA (Singapore)
 * 5: AUSFTA (US)                  6: TAFTA (Thailand)
 * 6A: Peru FTA                    7: ACI-FTA (Chile)
 * 8: AANZFTA (ASEAN)              8A: PACER Plus (Pacific Islands)
 * 8B: CPTPP (Trans-Pacific)       9: MAFTA (Malaysia)
 * 9A: IA-CEPA (Indonesia)         10: KAFTA (Korea)
 * 10A: AI-ECTA (India)            11: JAEPA (Japan)
 * 12: ChAFTA (China)              13: HK-FTA (Hong Kong)
 * 14: RCEP                        15: A-UKFTA (UK)
 * 16: UAE-CEPA (UAE)
 */
export class FtaSchedulesUpdater extends BaseUpdater {
  readonly sourceId = 'fta_schedules';
  readonly sourceName = 'FTA Schedules 4-16 — All FTA Exclusions';
  readonly defaultCron = '0 3 15 * *'; // 3 AM on the 15th of every month
  readonly targetTables = ['tariff_fta_exclusions'];

  /** All schedule identifiers including sub-schedules (4a, 6A, 8A, 8B, 9A, 10A). */
  private readonly scheduleIds: (string | number)[] = [
    4, '4a', 5, 6, '6a', 7, 8, '8a', '8b', 9, '9a', 10, '10a', 11, 12, 13, 14, 15, 16,
  ];

  async fetch(): Promise<FtaExclusionRow[]> {
    const allRows: FtaExclusionRow[] = [];

    for (const id of this.scheduleIds) {
      try {
        const rows = await scrapeFtaSchedule(id);
        allRows.push(...rows);
      } catch (err: any) {
        logError(
          this.sourceId,
          `Failed to scrape FTA schedule ${id}: ${err?.message ?? err}`
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
