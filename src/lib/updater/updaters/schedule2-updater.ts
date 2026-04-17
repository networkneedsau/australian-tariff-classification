import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { fetchAndParse } from '../scrapers/html-scraper';
import { ABF_BASE } from '../scrapers/abf-scraper';
import { logInfo } from '../update-logger';

interface Rule {
  ruleNumber: string;
  title: string;
  content: string;
}

/**
 * Schedule 2 — Interpretative Rules for classifying goods in Schedule 3.
 * These are the 6 General Interpretative Rules (GIRs) that determine
 * how tariff classification is applied.
 */
export class Schedule2Updater extends BaseUpdater {
  readonly sourceId = 'schedule2';
  readonly sourceName = 'Schedule 2 — Interpretative Rules';
  readonly defaultCron = '0 3 1 1,7 *'; // twice a year (very stable)
  readonly targetTables = ['schedule2_rules'];

  async fetch(): Promise<Rule[]> {
    const url = `${ABF_BASE}/schedule-2`;
    logInfo(this.sourceId, `Fetching Schedule 2 from ${url}`);
    const $ = await fetchAndParse(url);

    const rules: Rule[] = [];

    // Schedule 2 contains the 6 GIRs as structured content
    // Look for headings and their following content
    $('h2, h3, h4, strong').each((_i, el) => {
      const text = $(el).text().trim();
      const ruleMatch = text.match(/Rule\s+(\d[a-z]?)/i);
      if (ruleMatch) {
        const ruleNumber = ruleMatch[1];
        // Get the content after this heading
        let content = '';
        let next = $(el).next();
        while (next.length && !next.is('h2, h3, h4')) {
          content += next.text().trim() + '\n';
          next = next.next();
        }
        rules.push({
          ruleNumber,
          title: text,
          content: content.trim(),
        });
      }
    });

    // If structured parsing didn't work, get all text content
    if (rules.length === 0) {
      const pageText = $('main, .content-area, .field-content').first().text().trim();
      if (pageText.length > 100) {
        rules.push({
          ruleNumber: 'all',
          title: 'General Interpretative Rules',
          content: pageText,
        });
      }
    }

    logInfo(this.sourceId, `Scraped ${rules.length} rules`);
    return rules;
  }

  apply(db: Database.Database, data: Rule[]): ApplyResult {
    if (data.length === 0) return { added: 0, removed: 0, modified: 0, total: 0 };

    // Ensure table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS schedule2_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        rule_number TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    db.prepare('DELETE FROM schedule2_rules').run();

    const insert = db.prepare(
      'INSERT INTO schedule2_rules (rule_number, title, content) VALUES (?, ?, ?)'
    );

    for (const rule of data) {
      insert.run(rule.ruleNumber, rule.title, rule.content);
    }

    return { added: data.length, removed: 0, modified: 0, total: data.length };
  }
}
