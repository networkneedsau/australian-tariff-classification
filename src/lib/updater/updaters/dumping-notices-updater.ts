import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { fetchAndParse } from '../scrapers/html-scraper';
import { logInfo } from '../update-logger';

interface DumpingNotice {
  notice_number: string;
  title: string;
  date_published: string;
  url: string;
  category: string;
}

const ABF_DUMPING_URL =
  'https://www.abf.gov.au/importing-exporting-and-manufacturing/anti-dumping';

/**
 * Anti-Dumping Notices updater.
 * Scrapes the ABF anti-dumping page and appends new notices.
 */
export class DumpingNoticesUpdater extends BaseUpdater {
  readonly sourceId = 'dumping_notices';
  readonly sourceName = 'Anti-Dumping Notices';
  readonly defaultCron = '0 3 * * 1'; // weekly on Monday
  readonly targetTables = ['dumping_notices'];

  async fetch(): Promise<DumpingNotice[]> {
    const $ = await fetchAndParse(ABF_DUMPING_URL);
    const notices: DumpingNotice[] = [];

    $('table tbody tr').each((_i, tr) => {
      const cells = $(tr).find('td');
      if (cells.length >= 3) {
        const noticeNumber = $(cells[0]).text().trim();
        const titleEl = $(cells[1]).find('a').first();
        const title = titleEl.text().trim() || $(cells[1]).text().trim();
        const href = titleEl.attr('href') || '';
        const url = href.startsWith('http')
          ? href
          : href
            ? `https://www.abf.gov.au${href}`
            : '';
        const datePublished = $(cells[2]).text().trim();

        if (noticeNumber) {
          notices.push({
            notice_number: noticeNumber,
            title,
            date_published: datePublished,
            url,
            category: 'anti-dumping',
          });
        }
      }
    });

    logInfo(this.sourceId, `Fetched ${notices.length} dumping notices`);
    return notices;
  }

  apply(db: Database.Database, data: DumpingNotice[]): ApplyResult {
    const table = 'dumping_notices';

    // Get existing notice numbers for dedup
    const existing = new Set<string>(
      (db.prepare(`SELECT notice_number FROM ${table}`).all() as { notice_number: string }[])
        .map((r) => r.notice_number)
    );

    const insert = db.prepare(
      `INSERT INTO ${table} (notice_number, title, date_published, url, category)
       VALUES (?, ?, ?, ?, ?)`
    );

    let added = 0;
    for (const row of data) {
      if (!existing.has(row.notice_number)) {
        insert.run(row.notice_number, row.title, row.date_published, row.url, row.category);
        added++;
      }
    }

    const total = (db.prepare(`SELECT COUNT(*) AS cnt FROM ${table}`).get() as { cnt: number }).cnt;

    try { db.exec(`INSERT INTO ${table}_fts(${table}_fts) VALUES('rebuild')`); } catch {}

    return { added, removed: 0, modified: 0, total };
  }
}
