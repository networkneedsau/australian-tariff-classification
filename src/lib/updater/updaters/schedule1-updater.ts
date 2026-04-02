import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { scrapeSchedule1, type CountryEntry } from '../scrapers/abf-scraper';

/**
 * Schedule 1 — Countries and treaty partners.
 * Scrapes the ABF Schedule 1 page for country/abbreviation/category data.
 */
export class Schedule1Updater extends BaseUpdater {
  readonly sourceId = 'schedule1';
  readonly sourceName = 'Schedule 1 — Countries';
  readonly defaultCron = '0 3 1 * *'; // 3 AM on the 1st of every month
  readonly targetTables = ['tariff_countries'];

  async fetch(): Promise<CountryEntry[]> {
    return scrapeSchedule1();
  }

  apply(db: Database.Database, data: CountryEntry[]): ApplyResult {
    db.prepare('DELETE FROM tariff_countries').run();

    const insert = db.prepare(
      `INSERT INTO tariff_countries (country, abbreviation, schedule, category)
       VALUES (?, ?, ?, ?)`
    );

    for (const row of data) {
      insert.run(row.country, row.abbreviation, row.schedule, row.category);
    }

    return { added: data.length, removed: 0, modified: 0, total: data.length };
  }
}
