import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { scrapeActSections, type ActSection } from '../scrapers/legislation-scraper';

/**
 * A New Tax System (Goods and Services Tax) Act 1999 updater.
 */
export class GstActUpdater extends BaseUpdater {
  readonly sourceId = 'gst_act';
  readonly sourceName = 'GST Act 1999';
  readonly defaultCron = '0 3 1 * *';
  readonly targetTables = ['gst_act'];

  async fetch(): Promise<ActSection[]> {
    return scrapeActSections('Details/C2004A00446');
  }

  apply(db: Database.Database, data: ActSection[]): ApplyResult {
    const table = 'gst_act';
    db.prepare(`DELETE FROM ${table}`).run();

    const insert = db.prepare(
      `INSERT INTO ${table} (chapter, chapter_title, part, part_title, division, division_title, content)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    for (const row of data) {
      // Map scraped part as chapter if no separate chapter data available
      insert.run(row.part, row.part_title, row.part, row.part_title, '', '', row.content || '');
    }

    try { db.exec(`INSERT INTO gst_act_fts(gst_act_fts) VALUES('rebuild')`); } catch {}

    return { added: data.length, removed: 0, modified: 0, total: data.length };
  }
}
