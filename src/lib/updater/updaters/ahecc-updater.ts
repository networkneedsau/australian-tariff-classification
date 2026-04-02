import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { fetchAndParse } from '../scrapers/html-scraper';
import { logInfo } from '../update-logger';

interface AheccChapter {
  chapter_code: string;
  chapter_title: string;
  section: string;
  notes: string;
}

const AHECC_URL =
  'https://www.abf.gov.au/importing-exporting-and-manufacturing/tariff-classification/current-tariff/ahecc';

/**
 * AHECC (Australian Harmonized Export Commodity Classification) updater.
 * Scrapes the ABF AHECC page — relatively static, updates if changed.
 */
export class AheccUpdater extends BaseUpdater {
  readonly sourceId = 'ahecc';
  readonly sourceName = 'AHECC Export Chapters';
  readonly defaultCron = '0 3 1 1,7 *'; // twice a year
  readonly targetTables = ['ahecc_chapters'];

  async fetch(): Promise<AheccChapter[]> {
    const $ = await fetchAndParse(AHECC_URL);
    const chapters: AheccChapter[] = [];

    $('table tbody tr').each((_i, tr) => {
      const cells = $(tr).find('td');
      if (cells.length >= 2) {
        const chapterCode = $(cells[0]).text().trim();
        const chapterTitle = $(cells[1]).text().trim();
        const section = cells.length >= 3 ? $(cells[2]).text().trim() : '';
        const notes = cells.length >= 4 ? $(cells[3]).text().trim() : '';

        if (chapterCode) {
          chapters.push({
            chapter_code: chapterCode,
            chapter_title: chapterTitle,
            section,
            notes,
          });
        }
      }
    });

    logInfo(this.sourceId, `Fetched ${chapters.length} AHECC chapters`);
    return chapters;
  }

  apply(db: Database.Database, data: AheccChapter[]): ApplyResult {
    const table = 'ahecc_chapters';
    db.prepare(`DELETE FROM ${table}`).run();

    const insert = db.prepare(
      `INSERT INTO ${table} (chapter_code, chapter_title, section, notes)
       VALUES (?, ?, ?, ?)`
    );

    for (const row of data) {
      insert.run(row.chapter_code, row.chapter_title, row.section, row.notes);
    }

    try { db.exec(`INSERT INTO ${table}_fts(${table}_fts) VALUES('rebuild')`); } catch {}

    return { added: data.length, removed: 0, modified: 0, total: data.length };
  }
}
