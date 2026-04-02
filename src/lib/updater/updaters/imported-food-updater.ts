import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { scrapeActSections, type ActSection } from '../scrapers/legislation-scraper';

/**
 * Imported Food Control Act 1992 and Regulation updater.
 */
export class ImportedFoodUpdater extends BaseUpdater {
  readonly sourceId = 'imported_food';
  readonly sourceName = 'Imported Food Control Act 1992';
  readonly defaultCron = '0 3 1 * *';
  readonly targetTables = ['imported_food_act', 'imported_food_reg'];

  async fetch(): Promise<{ act: ActSection[]; reg: ActSection[] }> {
    const act = await scrapeActSections('Details/C2004A01385');
    let reg: ActSection[] = [];
    try {
      reg = await scrapeActSections('Details/F2016L00387');
    } catch {
      // Regulation may not be separately available
    }
    return { act, reg };
  }

  apply(db: Database.Database, data: { act: ActSection[]; reg: ActSection[] }): ApplyResult {
    let totalAdded = 0;

    // Act — schema: part, part_title, division, division_title, section_number, section_title, content
    const actTable = 'imported_food_act';
    db.prepare(`DELETE FROM ${actTable}`).run();
    const insertAct = db.prepare(
      `INSERT INTO ${actTable} (part, part_title, division, division_title, section_number, section_title, content)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const row of data.act) {
      insertAct.run(row.part, row.part_title, '', '', row.section_number, row.section_title, row.content || '');
    }
    try { db.exec(`INSERT INTO ${actTable}_fts(${actTable}_fts) VALUES('rebuild')`); } catch {}
    totalAdded += data.act.length;

    // Regulation — schema: part, part_title, division, division_title, subdivision, regulation_number, regulation_title, content
    const regTable = 'imported_food_reg';
    db.prepare(`DELETE FROM ${regTable}`).run();
    const insertReg = db.prepare(
      `INSERT INTO ${regTable} (part, part_title, division, division_title, subdivision, regulation_number, regulation_title, content)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const row of data.reg) {
      insertReg.run(row.part, row.part_title, '', '', '', row.section_number, row.section_title, row.content || '');
    }
    try { db.exec(`INSERT INTO ${regTable}_fts(${regTable}_fts) VALUES('rebuild')`); } catch {}
    totalAdded += data.reg.length;

    return { added: totalAdded, removed: 0, modified: 0, total: totalAdded };
  }
}
