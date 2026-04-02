import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import {
  scrapeSchedule3Sections,
  scrapeSchedule3Chapter,
  type TariffRow,
} from '../scrapers/abf-scraper';
import { logInfo, logError } from '../update-logger';

interface ClassificationRow extends TariffRow {
  sectionNumber: string;
  sectionTitle: string;
}

/**
 * Schedule 3 — Tariff Classifications.
 * Scrapes all 21 sections from the ABF site, drills into each chapter,
 * and rebuilds the tariff_classifications table + FTS index.
 */
export class Schedule3Updater extends BaseUpdater {
  readonly sourceId = 'schedule3';
  readonly sourceName = 'Schedule 3 — Tariff Classifications';
  readonly defaultCron = '0 3 1 1,4,7,10 *'; // quarterly
  readonly targetTables = ['tariff_classifications'];

  async fetch(): Promise<ClassificationRow[]> {
    const sections = await scrapeSchedule3Sections();
    const allRows: ClassificationRow[] = [];

    for (const section of sections) {
      try {
        const rows = await scrapeSchedule3Chapter(section.url);
        for (const row of rows) {
          allRows.push({
            ...row,
            sectionNumber: section.sectionNumber,
            sectionTitle: section.title,
          });
        }
      } catch (err: any) {
        logError(
          this.sourceId,
          `Failed to scrape section ${section.sectionNumber}: ${err?.message ?? err}`
        );
      }
    }

    // Safety check: abort if suspiciously low
    if (allRows.length < 5000) {
      throw new Error(
        `Only ${allRows.length} classifications scraped — expected at least 5000. Aborting.`
      );
    }

    logInfo(this.sourceId, `Total classifications fetched: ${allRows.length}`);
    return allRows;
  }

  apply(db: Database.Database, data: ClassificationRow[]): ApplyResult {
    db.prepare('DELETE FROM tariff_classifications').run();

    const insert = db.prepare(
      `INSERT INTO tariff_classifications
         (code, statistical_code, description, unit, duty_rate, section_number, section_title)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    for (const row of data) {
      insert.run(
        row.code,
        row.statisticalCode,
        row.description,
        row.unit,
        row.dutyRate,
        row.sectionNumber,
        row.sectionTitle
      );
    }

    // Rebuild FTS index
    try {
      db.exec(
        `INSERT INTO tariff_fts(tariff_fts) VALUES('rebuild')`
      );
    } catch {
      // FTS table may not exist yet
    }

    return { added: data.length, removed: 0, modified: 0, total: data.length };
  }
}
