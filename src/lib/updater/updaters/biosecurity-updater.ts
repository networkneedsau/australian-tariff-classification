import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { scrapeActSections, type ActSection } from '../scrapers/legislation-scraper';

/**
 * Biosecurity Act 2015 updater.
 * Also covers associated regulations via the same legislation page.
 */
export class BiosecurityUpdater extends BaseUpdater {
  readonly sourceId = 'biosecurity';
  readonly sourceName = 'Biosecurity Act 2015';
  readonly defaultCron = '0 3 1 * *';
  readonly targetTables = ['biosecurity_act', 'biosecurity_regs'];

  async fetch(): Promise<{ act: ActSection[]; regs: ActSection[] }> {
    const act = await scrapeActSections('Details/C2015A00061');
    // Biosecurity Regulation 2016
    let regs: ActSection[] = [];
    try {
      regs = await scrapeActSections('Details/F2016L00595');
    } catch {
      // Regulations may not be available separately
    }
    return { act, regs };
  }

  apply(db: Database.Database, data: { act: ActSection[]; regs: ActSection[] }): ApplyResult {
    // Safety: don't delete existing data if scrape returned nothing
    if (data.act.length === 0 && data.regs.length === 0) {
      return { added: 0, removed: 0, modified: 0, total: 0 };
    }

    let totalAdded = 0;

    // Biosecurity Act
    const actTable = 'biosecurity_act';
    if (data.act.length > 0) db.prepare(`DELETE FROM ${actTable}`).run();
    const insertAct = db.prepare(
      `INSERT INTO ${actTable} (chapter, chapter_title, part, part_title, division, division_title, section_range)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const row of data.act) {
      // Map scraped data: use part as chapter, section_number as section_range (no content column)
      insertAct.run(row.part, row.part_title, row.part, row.part_title, '', '', row.section_number || '');
    }
    try { db.exec(`INSERT INTO ${actTable}_fts(${actTable}_fts) VALUES('rebuild')`); } catch {}
    totalAdded += data.act.length;

    // Biosecurity Regulations
    const regsTable = 'biosecurity_regs';
    if (data.regs.length > 0) db.prepare(`DELETE FROM ${regsTable}`).run();
    const insertRegs = db.prepare(
      `INSERT INTO ${regsTable} (chapter, chapter_title, part, part_title, division, division_title, section_range)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const row of data.regs) {
      insertRegs.run(row.part, row.part_title, row.part, row.part_title, '', '', row.section_number || '');
    }
    try { db.exec(`INSERT INTO ${regsTable}_fts(${regsTable}_fts) VALUES('rebuild')`); } catch {}
    totalAdded += data.regs.length;

    return { added: totalAdded, removed: 0, modified: 0, total: totalAdded };
  }
}
