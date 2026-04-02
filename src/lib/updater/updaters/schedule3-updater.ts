import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import {
  scrapeSchedule3Sections,
  scrapeSchedule3ChapterLinks,
  scrapeSchedule3Chapter,
  type Schedule3Row,
} from '../scrapers/abf-scraper';
import { logInfo, logError } from '../update-logger';

interface ClassificationRow extends Schedule3Row {
  sectionNumber: string;
  sectionTitle: string;
}

/**
 * Schedule 3 — Tariff Classifications.
 * Follows the ABF 3-level hierarchy:
 *   /schedule-3 → /schedule-3/section-i → /schedule-3/section-i/chapter-1
 * Rebuilds tariff_classifications + FTS index.
 */
export class Schedule3Updater extends BaseUpdater {
  readonly sourceId = 'schedule3';
  readonly sourceName = 'Schedule 3 — Tariff Classifications';
  readonly defaultCron = '0 3 1 1,4,7,10 *'; // quarterly
  readonly targetTables = ['tariff_classifications'];

  async fetch(): Promise<ClassificationRow[]> {
    // Level 1: get all section links
    const sections = await scrapeSchedule3Sections();
    logInfo(this.sourceId, `Found ${sections.length} sections`);
    const allRows: ClassificationRow[] = [];

    for (const section of sections) {
      try {
        // Level 2: get chapter links within this section
        const chapterUrls = await scrapeSchedule3ChapterLinks(section.url);
        logInfo(this.sourceId, `Section ${section.sectionNumber}: ${chapterUrls.length} chapters`);

        for (const chapterUrl of chapterUrls) {
          try {
            // Level 3: scrape actual classification tables from the chapter page
            const rows = await scrapeSchedule3Chapter(chapterUrl);
            for (const row of rows) {
              allRows.push({
                ...row,
                sectionNumber: section.sectionNumber,
                sectionTitle: section.title,
              });
            }
          } catch (err: any) {
            logError(this.sourceId, `Failed to scrape chapter ${chapterUrl}: ${err?.message ?? err}`);
          }
        }
      } catch (err: any) {
        logError(this.sourceId, `Failed to scrape section ${section.sectionNumber}: ${err?.message ?? err}`);
      }
    }

    // Safety check: abort if suspiciously low
    if (allRows.length < 5000) {
      throw new Error(
        `Only ${allRows.length} classifications scraped — expected at least 5000. Aborting to preserve existing data.`
      );
    }

    logInfo(this.sourceId, `Total classifications fetched: ${allRows.length}`);
    return allRows;
  }

  apply(db: Database.Database, data: ClassificationRow[]): ApplyResult {
    const beforeCount = (db.prepare('SELECT COUNT(*) as c FROM tariff_classifications').get() as any)?.c || 0;

    db.prepare('DELETE FROM tariff_classifications').run();

    const insert = db.prepare(
      `INSERT INTO tariff_classifications
         (section_number, section_title, chapter_number, chapter_title,
          heading_code, heading_description, code, statistical_code,
          description, unit, duty_rate, duty_rate_numeric, is_free)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const row of data) {
      // Parse numeric duty rate
      const rateMatch = row.dutyRate?.match(/(\d+(?:\.\d+)?)\s*%/);
      const dutyRateNumeric = rateMatch ? parseFloat(rateMatch[1]) : null;
      const isFree = !row.dutyRate || row.dutyRate.toLowerCase() === 'free' || dutyRateNumeric === 0;

      // Convert section roman numeral to number
      const sectionNum = romanToInt(row.sectionNumber) || 0;

      insert.run(
        sectionNum,
        row.sectionTitle,
        parseInt(row.chapterNumber) || 0,
        row.chapterTitle,
        row.headingCode,
        row.headingDescription,
        row.code,
        row.statisticalCode,
        row.description,
        row.unit,
        row.dutyRate,
        dutyRateNumeric,
        isFree ? 1 : 0
      );
    }

    // Rebuild FTS index
    try {
      db.exec(`INSERT INTO tariff_fts(tariff_fts) VALUES('rebuild')`);
    } catch {
      // FTS table may not exist yet
    }

    return { added: data.length, removed: beforeCount, modified: 0, total: data.length };
  }
}

function romanToInt(s: string): number {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let result = 0;
  const upper = s.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const curr = map[upper[i]] || 0;
    const next = i + 1 < upper.length ? map[upper[i + 1]] || 0 : 0;
    result += curr < next ? -curr : curr;
  }
  return result;
}
