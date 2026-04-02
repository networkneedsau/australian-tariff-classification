import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { scrapeActSections, type ActSection } from '../scrapers/legislation-scraper';

/**
 * Customs (Prohibited Imports) Regulations 1956 updater.
 */
export class ProhibitedImportsUpdater extends BaseUpdater {
  readonly sourceId = 'prohibited_imports';
  readonly sourceName = 'Customs (Prohibited Imports) Regulations 1956';
  readonly defaultCron = '0 3 1 * *';
  readonly targetTables = ['prohibited_imports_regs'];

  async fetch(): Promise<ActSection[]> {
    return scrapeActSections('Details/F1996B02827');
  }

  apply(db: Database.Database, data: ActSection[]): ApplyResult {
    const table = 'prohibited_imports_regs';
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
