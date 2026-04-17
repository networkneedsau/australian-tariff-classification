import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { downloadRefFile, splitFields } from '../scrapers/abf-reference-files';
import { logInfo, logWarn } from '../update-logger';

// ── Types ────────────────────────────────────────────────────────────

interface ConcordanceEntry {
  new_code: string;              // raw 8-digit HS2022 code
  old_code: string;              // raw 8-digit HS2017 code
  new_code_formatted: string;    // "0101.21.00"
  old_code_formatted: string;    // "0101.10.00"
  created_at: string | null;     // parsed timestamp
}

// ── Constants ────────────────────────────────────────────────────────

const SRC = 'tariff_concordance';

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Format an 8-digit tariff code with dots: "01012100" -> "0101.21.00"
 */
function formatTariffCode(raw: string): string {
  if (raw.length !== 8) return raw;
  return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
}

/**
 * Parse an ABF 20-digit creation timestamp (YYYYMMDDHHMMSSNNNNNN) to
 * an ISO-8601 string, or null if not valid.
 */
function parseTimestamp(raw: string): string | null {
  if (!/^\d{14,20}$/.test(raw)) return null;
  const y = raw.slice(0, 4);
  const mo = raw.slice(4, 6);
  const d = raw.slice(6, 8);
  const h = raw.slice(8, 10);
  const mi = raw.slice(10, 12);
  const s = raw.slice(12, 14);
  return `${y}-${mo}-${d}T${h}:${mi}:${s}Z`;
}

// ── Updater ──────────────────────────────────────────────────────────

/**
 * Tariff Concordance updater — pulls the TRFCCONC reference file which
 * maps between HS2017 and HS2022 tariff codes.
 *
 * TRFCCONC line format (whitespace-separated):
 *   Field 0: new_code           (HS2022, 8 digits)
 *   Field 1: old_code           (HS2017, 8 digits)
 *   Field 2: creation timestamp (20 digits)
 */
export class TariffConcordanceUpdater extends BaseUpdater {
  readonly sourceId = 'tariff_concordance';
  readonly sourceName = 'Tariff Concordance HS2017↔HS2022 (TRFCCONC)';
  readonly defaultCron = '0 3 1 * *'; // 3 AM on 1st of each month
  readonly targetTables = ['tariff_concordance'];

  async fetch(): Promise<ConcordanceEntry[]> {
    logInfo(SRC, 'Downloading TRFCCONC reference file');
    const lines = await downloadRefFile('TRFCCONC');
    logInfo(SRC, `TRFCCONC: ${lines.length} lines`);

    // Dedupe by (new_code, old_code) pair — keep latest timestamp
    const map = new Map<string, ConcordanceEntry>();
    let parsed = 0;
    let skipped = 0;

    for (const line of lines) {
      const fields = splitFields(line);
      if (fields.length < 2) {
        skipped++;
        continue;
      }

      const newCode = fields[0];
      const oldCode = fields[1];
      const ts = fields[2] ?? '';

      if (!/^\d{8}$/.test(newCode) || !/^\d{8}$/.test(oldCode)) {
        skipped++;
        continue;
      }

      parsed++;
      const key = `${newCode}|${oldCode}`;
      const existing = map.get(key);
      if (!existing || (ts && ts > (existing.created_at ?? ''))) {
        map.set(key, {
          new_code: newCode,
          old_code: oldCode,
          new_code_formatted: formatTariffCode(newCode),
          old_code_formatted: formatTariffCode(oldCode),
          created_at: parseTimestamp(ts),
        });
      }
    }

    logInfo(SRC, `Parsed ${parsed} concordance pairs, skipped ${skipped}`);
    logInfo(SRC, `Unique pairs: ${map.size}`);

    const results = [...map.values()];
    if (results.length < 500) {
      throw new Error(
        `Only ${results.length} concordance pairs parsed — expected at least 500. ` +
          'TRFCCONC file may be corrupt or format changed.'
      );
    }

    return results;
  }

  apply(db: Database.Database, data: ConcordanceEntry[]): ApplyResult {
    // Safety: do not wipe existing data if the parse looks too small
    if (data.length < 500) {
      logWarn(
        SRC,
        `Aborting apply — only ${data.length} rows parsed (min 500). ` +
          'Existing data preserved.'
      );
      return { added: 0, removed: 0, modified: 0, total: 0 };
    }

    // Ensure table exists (db.ts also creates it on init)
    db.exec(`
      CREATE TABLE IF NOT EXISTS tariff_concordance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        new_code TEXT NOT NULL,
        old_code TEXT NOT NULL,
        new_code_formatted TEXT,
        old_code_formatted TEXT,
        created_at TEXT,
        source TEXT DEFAULT 'TRFCCONC'
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_concordance_pair ON tariff_concordance(new_code, old_code);
      CREATE INDEX IF NOT EXISTS idx_concordance_new ON tariff_concordance(new_code);
      CREATE INDEX IF NOT EXISTS idx_concordance_old ON tariff_concordance(old_code);
    `);

    const beforeCount = (
      db.prepare('SELECT COUNT(*) as c FROM tariff_concordance').get() as any
    )?.c || 0;

    db.prepare('DELETE FROM tariff_concordance').run();

    const insert = db.prepare(`
      INSERT INTO tariff_concordance
        (new_code, old_code, new_code_formatted, old_code_formatted,
         created_at, source)
      VALUES (?, ?, ?, ?, ?, 'TRFCCONC')
    `);

    for (const row of data) {
      insert.run(
        row.new_code,
        row.old_code,
        row.new_code_formatted,
        row.old_code_formatted,
        row.created_at
      );
    }

    logInfo(SRC, `Inserted ${data.length} concordance rows`);

    return {
      added: data.length,
      removed: beforeCount,
      modified: 0,
      total: data.length,
    };
  }
}
