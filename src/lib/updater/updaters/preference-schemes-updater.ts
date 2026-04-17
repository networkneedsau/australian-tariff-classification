import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { downloadRefFile } from '../scrapers/abf-reference-files';
import { logInfo, logWarn } from '../update-logger';

// ── Types ────────────────────────────────────────────────────────────

interface PreferenceSchemeEntry {
  scheme_code: string;
  scheme_name: string;
  start_date: string | null;
  end_date: string | null;
}

// ── Constants ────────────────────────────────────────────────────────

const SRC = 'preference_schemes';

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Format a YYYYMMDD string as YYYY-MM-DD.
 */
function formatDate(yyyymmdd: string): string | null {
  if (!yyyymmdd || !/^\d{8}$/.test(yyyymmdd)) return null;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

// ── Updater ──────────────────────────────────────────────────────────

/**
 * Preference Schemes updater — pulls the PRSPSNAP reference file from
 * the ABF CCF server.
 *
 * PRSPSNAP line format:
 *   The scheme code is at the start of the line (4 chars, left-aligned).
 *   After whitespace-separated numeric fields (period ID, timestamp,
 *   start date, end date, sequence), the rest of the line is the
 *   scheme name.
 *
 * Example lines:
 *   AANZ    1 20211104150413339075 20100101 20211231   12 ASEAN - AUSTRALIA - NEW ZEALAND FREE TRADE AGREEMENT
 *   CFTA    1 20151210143354425986 20151220             1 CHINA-AUSTRALIA ECONOMIC PARTNERSHIP AGREEMENT
 *   GEN     1 20040101000000000000 20050101             1 GENERAL TARIFF
 *
 * We keep the latest period for each scheme code (highest period ID or
 * most recent timestamp).
 */
export class PreferenceSchemesUpdater extends BaseUpdater {
  readonly sourceId = 'preference_schemes';
  readonly sourceName = 'ABF Preference Schemes (FTA)';
  readonly defaultCron = '0 3 1 * *'; // 3 AM on 1st of each month
  readonly targetTables = ['preference_schemes'];

  async fetch(): Promise<PreferenceSchemeEntry[]> {
    logInfo(SRC, 'Downloading PRSPSNAP reference file');
    const lines = await downloadRefFile('PRSPSNAP');
    logInfo(SRC, `PRSPSNAP: ${lines.length} lines`);

    // Parse and deduplicate: keep latest per scheme code
    const schemeMap = new Map<string, PreferenceSchemeEntry>();
    let parsed = 0;
    let skipped = 0;

    for (const line of lines) {
      if (line.trim().length < 10) {
        skipped++;
        continue;
      }

      // Scheme code is the first non-whitespace token (up to 8 chars)
      const schemeCode = line.trim().split(/\s+/)[0];
      if (!schemeCode || schemeCode.length > 8) {
        skipped++;
        continue;
      }

      // Find dates: look for YYYYMMDD patterns
      const datePattern = /\b(\d{8})\b/g;
      const dates: string[] = [];
      let match: RegExpExecArray | null;
      while ((match = datePattern.exec(line)) !== null) {
        const d = match[1];
        // Filter out the 20-digit creation timestamp by checking if
        // adjacent chars are also digits
        const pos = match.index;
        const before = pos > 0 ? line[pos - 1] : ' ';
        const after = pos + 8 < line.length ? line[pos + 8] : ' ';
        if (/\d/.test(before) || /\d/.test(after)) continue;
        dates.push(d);
      }

      // Extract the scheme name: everything after the last numeric/date field
      // Strategy: find the position after the last number sequence
      const nameMatch = line.match(
        /\d{8}\s+\d+\s+(.+)$/
      );
      let schemeName = '';
      if (nameMatch) {
        schemeName = nameMatch[1].trim();
      } else {
        // Fallback: everything after the last number
        const parts = line.trim().split(/\s+/);
        // Find where the text name starts (first token that isn't numeric)
        let nameStart = -1;
        for (let i = 1; i < parts.length; i++) {
          if (!/^\d/.test(parts[i]) && parts[i].length > 1) {
            nameStart = i;
            break;
          }
        }
        if (nameStart > 0) {
          schemeName = parts.slice(nameStart).join(' ');
        }
      }

      if (!schemeName) {
        schemeName = schemeCode;
      }

      const startDate = dates.length > 0 ? dates[0] : '';
      const endDate = dates.length > 1 ? dates[1] : '';

      parsed++;

      // Keep the entry with the longest/most descriptive name per code
      const existing = schemeMap.get(schemeCode);
      if (!existing || schemeName.length > existing.scheme_name.length) {
        schemeMap.set(schemeCode, {
          scheme_code: schemeCode,
          scheme_name: schemeName,
          start_date: formatDate(startDate),
          end_date: formatDate(endDate),
        });
      }
    }

    logInfo(SRC, `Parsed ${parsed} lines, ${schemeMap.size} unique schemes`);

    const results = [...schemeMap.values()];
    if (results.length < 2) {
      throw new Error(
        `Only ${results.length} preference schemes found — expected at least 2. ` +
          'PRSPSNAP file may be corrupt or format changed.'
      );
    }

    return results;
  }

  apply(db: Database.Database, data: PreferenceSchemeEntry[]): ApplyResult {
    // Ensure the table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS preference_schemes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        scheme_code TEXT NOT NULL UNIQUE,
        scheme_name TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT,
        source TEXT DEFAULT 'ABF-PRSPSNAP',
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);

    const beforeCount = (
      db.prepare('SELECT COUNT(*) as c FROM preference_schemes').get() as any
    )?.c || 0;

    db.prepare('DELETE FROM preference_schemes').run();

    const insert = db.prepare(`
      INSERT INTO preference_schemes
        (scheme_code, scheme_name, start_date, end_date, source)
      VALUES (?, ?, ?, ?, 'ABF-PRSPSNAP')
    `);

    for (const entry of data) {
      insert.run(
        entry.scheme_code,
        entry.scheme_name,
        entry.start_date,
        entry.end_date
      );
    }

    logInfo(SRC, `Inserted ${data.length} preference schemes`);

    return {
      added: data.length,
      removed: beforeCount,
      modified: 0,
      total: data.length,
    };
  }
}
