import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { scrapeActSections, type ActSection } from '../scrapers/legislation-scraper';

/**
 * Customs (Prohibited Exports) Regulations 1958 updater.
 */
export class ProhibitedExportsUpdater extends BaseUpdater {
  readonly sourceId = 'prohibited_exports';
  readonly sourceName = 'Customs (Prohibited Exports) Regulations 1958';
  readonly defaultCron = '0 3 1 * *';
  readonly targetTables = ['prohibited_exports_regs'];

  async fetch(): Promise<ActSection[]> {
    return scrapeActSections('Details/F1997B01434');
  }

  apply(db: Database.Database, data: ActSection[]): ApplyResult {
    // Safety: don't delete existing data if scrape returned nothing
    if (data.length === 0) {
      return { added: 0, removed: 0, modified: 0, total: 0 };
    }

    const table = 'prohibited_exports_regs';
    db.prepare(`DELETE FROM ${table}`).run();

    const insert = db.prepare(
      `INSERT INTO ${table} (part, part_title, division, division_title, regulation_number, regulation_title, content)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    for (const row of data) {
      insert.run(row.part, row.part_title, '', '', row.section_number, row.section_title, row.content || '');
    }

    try { db.exec(`INSERT INTO ${table}_fts(${table}_fts) VALUES('rebuild')`); } catch {}

    return { added: data.length, removed: 0, modified: 0, total: data.length };
  }
}
