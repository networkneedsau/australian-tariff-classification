import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { scrapeActSections, type ActSection } from '../scrapers/legislation-scraper';

/**
 * Illegal Logging Prohibition Act 2012 and Regulation updater.
 */
export class IllegalLoggingUpdater extends BaseUpdater {
  readonly sourceId = 'illegal_logging';
  readonly sourceName = 'Illegal Logging Prohibition Act 2012';
  readonly defaultCron = '0 3 1 * *';
  readonly targetTables = ['illegal_logging_act', 'illegal_logging_reg'];

  async fetch(): Promise<{ act: ActSection[]; reg: ActSection[] }> {
    const act = await scrapeActSections('Details/C2012A00166');
    const reg = await scrapeActSections('Details/F2012L02240');
    return { act, reg };
  }

  apply(db: Database.Database, data: { act: ActSection[]; reg: ActSection[] }): ApplyResult {
    // Safety: don't delete existing data if scrape returned nothing
    if (data.act.length === 0 && data.reg.length === 0) {
      return { added: 0, removed: 0, modified: 0, total: 0 };
    }

    let totalAdded = 0;

    // Act — schema: part, part_title, division, division_title, subdivision, section_number, section_title, content
    const actTable = 'illegal_logging_act';
    if (data.act.length > 0) db.prepare(`DELETE FROM ${actTable}`).run();
    const insertAct = db.prepare(
      `INSERT INTO ${actTable} (part, part_title, division, division_title, subdivision, section_number, section_title, content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const row of data.act) {
      insertAct.run(row.part, row.part_title, '', '', '', row.section_number, row.section_title, row.content || '');
    }
    try { db.exec(`INSERT INTO ${actTable}_fts(${actTable}_fts) VALUES('rebuild')`); } catch {}
    totalAdded += data.act.length;

    // Regulation — schema: part, part_title, division, division_title, regulation_number, regulation_title, content
    const regTable = 'illegal_logging_reg';
    if (data.reg.length > 0) db.prepare(`DELETE FROM ${regTable}`).run();
    const insertReg = db.prepare(
      `INSERT INTO ${regTable} (part, part_title, division, division_title, regulation_number, regulation_title, content)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const row of data.reg) {
      insertReg.run(row.part, row.part_title, '', '', row.section_number, row.section_title, row.content || '');
    }
    try { db.exec(`INSERT INTO ${regTable}_fts(${regTable}_fts) VALUES('rebuild')`); } catch {}
    totalAdded += data.reg.length;

    return { added: totalAdded, removed: 0, modified: 0, total: totalAdded };
  }
}
