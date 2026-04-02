import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { scrapeActSections, type ActSection } from '../scrapers/legislation-scraper';

/**
 * Commerce (Trade Descriptions) Act 1905 and Regulations updater.
 */
export class TradeDescUpdater extends BaseUpdater {
  readonly sourceId = 'trade_desc';
  readonly sourceName = 'Commerce (Trade Descriptions) Act 1905';
  readonly defaultCron = '0 3 1 * *';
  readonly targetTables = ['trade_desc_act', 'trade_desc_regs'];

  async fetch(): Promise<{ act: ActSection[]; regs: ActSection[] }> {
    const act = await scrapeActSections('Details/C2004A07524');
    let regs: ActSection[] = [];
    try {
      regs = await scrapeActSections('Details/F1996B02829');
    } catch {
      // Regulations may not be separately available
    }
    return { act, regs };
  }

  apply(db: Database.Database, data: { act: ActSection[]; regs: ActSection[] }): ApplyResult {
    let totalAdded = 0;

    // Act
    const actTable = 'trade_desc_act';
    db.prepare(`DELETE FROM ${actTable}`).run();
    const insertAct = db.prepare(
      `INSERT INTO ${actTable} (part, part_title, section_number, section_title, content)
       VALUES (?, ?, ?, ?, ?)`
    );
    for (const row of data.act) {
      insertAct.run(row.part, row.part_title, row.section_number, row.section_title, row.content || '');
    }
    try { db.exec(`INSERT INTO ${actTable}_fts(${actTable}_fts) VALUES('rebuild')`); } catch {}
    totalAdded += data.act.length;

    // Regulations — schema: part, part_title, division, division_title, subdivision, regulation_number, regulation_title, content
    const regsTable = 'trade_desc_regs';
    db.prepare(`DELETE FROM ${regsTable}`).run();
    const insertRegs = db.prepare(
      `INSERT INTO ${regsTable} (part, part_title, division, division_title, subdivision, regulation_number, regulation_title, content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const row of data.regs) {
      insertRegs.run(row.part, row.part_title, '', '', '', row.section_number, row.section_title, row.content || '');
    }
    try { db.exec(`INSERT INTO ${regsTable}_fts(${regsTable}_fts) VALUES('rebuild')`); } catch {}
    totalAdded += data.regs.length;

    return { added: totalAdded, removed: 0, modified: 0, total: totalAdded };
  }
}
