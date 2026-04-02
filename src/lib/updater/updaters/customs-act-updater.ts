import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { scrapeActSections, type ActSection } from '../scrapers/legislation-scraper';

/**
 * Customs Act 1901 updater.
 */
export class CustomsActUpdater extends BaseUpdater {
  readonly sourceId = 'customs_act';
  readonly sourceName = 'Customs Act 1901';
  readonly defaultCron = '0 3 1 * *';
  readonly targetTables = ['customs_act_sections'];

  async fetch(): Promise<ActSection[]> {
    return scrapeActSections('Details/C2004A01001');
  }

  apply(db: Database.Database, data: ActSection[]): ApplyResult {
    // Safety: don't delete existing data if scrape returned nothing
    if (data.length === 0) {
      return { added: 0, removed: 0, modified: 0, total: 0 };
    }

    const table = 'customs_act_sections';
    db.prepare(`DELETE FROM ${table}`).run();

    const insert = db.prepare(
      `INSERT INTO ${table} (part, part_title, section_number, section_title, content)
       VALUES (?, ?, ?, ?, ?)`
    );

    for (const row of data) {
      insert.run(row.part, row.part_title, row.section_number, row.section_title, row.content || '');
    }

    try { db.exec(`INSERT INTO ${table}_fts(${table}_fts) VALUES('rebuild')`); } catch {}

    return { added: data.length, removed: 0, modified: 0, total: data.length };
  }
}
