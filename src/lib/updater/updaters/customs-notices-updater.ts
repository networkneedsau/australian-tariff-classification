import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { fetchAndParse } from '../scrapers/html-scraper';
import { logInfo } from '../update-logger';

interface CustomsNotice {
  notice_number: string;
  title: string;
  date_published: string;
  url: string;
  category: string;
}

const ABF_NOTICES_URL =
  'https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/customs-notices';

/**
 * Customs Notices updater.
 * Scrapes the ABF customs notices page and appends new notices.
 */
export class CustomsNoticesUpdater extends BaseUpdater {
  readonly sourceId = 'customs_notices';
  readonly sourceName = 'Customs Notices';
  readonly defaultCron = '0 3 * * 1'; // weekly on Monday
  readonly targetTables = ['customs_notices'];

  async fetch(): Promise<CustomsNotice[]> {
    const $ = await fetchAndParse(ABF_NOTICES_URL);
    const notices: CustomsNotice[] = [];

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
            category: 'customs',
          });
        }
      }
    });

    logInfo(this.sourceId, `Fetched ${notices.length} customs notices`);
    return notices;
  }

  apply(db: Database.Database, data: CustomsNotice[]): ApplyResult {
    const table = 'customs_notices';

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
