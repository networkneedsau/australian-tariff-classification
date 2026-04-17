import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { fetchPage } from '../scrapers/html-scraper';
import { logInfo, logWarn } from '../update-logger';

// ── Types ────────────────────────────────────────────────────────────

interface HsEntry {
  section: string;
  hsCode: string;       // Raw code: "010121" (6-digit) or "0101" (4-digit) or "01" (2-digit)
  description: string;
  parent: string;
  level: number;         // 2=chapter, 4=heading, 6=subheading
}

// ── Constants ────────────────────────────────────────────────────────

const GITHUB_CSV_URL =
  'https://raw.githubusercontent.com/datasets/harmonized-system/main/data/harmonized-system.csv';

const SRC = 'hs_descriptions';

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Parse a CSV line handling quoted fields with commas.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Normalize an HS code to 6 digits with dots: "010121" → "0101.21"
 */
function formatHsCode(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 2) return digits; // chapter
  if (digits.length <= 4) return `${digits.slice(0, 2)}${digits.slice(2)}`; // heading
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}`; // subheading
}

// ── Updater ──────────────────────────────────────────────────────────

/**
 * HS Descriptions — International Harmonized System nomenclature.
 *
 * Downloads the freely available HS code dataset from GitHub (sourced
 * from UN Comtrade). Provides descriptions for ~5,351 six-digit codes
 * plus 323 four-digit headings and 55 two-digit chapters.
 *
 * These descriptions form the base layer for Australian tariff
 * classifications (first 6 digits are identical to the international HS).
 * Australian-specific 8-digit codes inherit the closest matching description.
 */
export class HsDescriptionsUpdater extends BaseUpdater {
  readonly sourceId = 'hs_descriptions';
  readonly sourceName = 'HS Nomenclature Descriptions (International)';
  readonly defaultCron = '0 4 1 * *'; // monthly on the 1st
  readonly targetTables = ['hs_descriptions'];

  async fetch(): Promise<HsEntry[]> {
    logInfo(SRC, `Downloading HS dataset from ${GITHUB_CSV_URL}`);
    const csv = await fetchPage(GITHUB_CSV_URL, { timeoutMs: 30_000 });

    const lines = csv.split(/\r?\n/);
    logInfo(SRC, `CSV has ${lines.length} lines`);

    // Skip header: section,hscode,description,parent,level
    const entries: HsEntry[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const fields = parseCsvLine(line);
      if (fields.length < 5) continue;

      const [section, hsCode, description, parent, levelStr] = fields;
      const level = parseInt(levelStr) || 0;

      // Only keep codes with digits (skip "TOTAL" etc.)
      if (!/^\d+$/.test(hsCode.replace(/\D/g, ''))) continue;

      entries.push({
        section: section.trim(),
        hsCode: hsCode.trim(),
        description: description.trim(),
        parent: parent.trim(),
        level,
      });
    }

    logInfo(SRC, `Parsed ${entries.length} HS entries`);

    // Validation: expect at least 5000 entries
    if (entries.length < 4000) {
      throw new Error(
        `Only ${entries.length} HS entries parsed — expected > 4000. CSV format may have changed.`
      );
    }

    return entries;
  }

  apply(db: Database.Database, data: HsEntry[]): ApplyResult {
    // Ensure table exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS hs_descriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        section TEXT,
        hs_code TEXT NOT NULL,
        hs_code_formatted TEXT,
        description TEXT NOT NULL,
        parent_code TEXT,
        level INTEGER NOT NULL DEFAULT 6,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_hs_desc_code ON hs_descriptions(hs_code);
      CREATE INDEX IF NOT EXISTS idx_hs_desc_level ON hs_descriptions(level);
    `);

    const beforeCount = (db.prepare('SELECT COUNT(*) as c FROM hs_descriptions').get() as any)?.c || 0;

    db.prepare('DELETE FROM hs_descriptions').run();

    const insert = db.prepare(
      `INSERT OR IGNORE INTO hs_descriptions
         (section, hs_code, hs_code_formatted, description, parent_code, level)
       VALUES (?, ?, ?, ?, ?, ?)`
    );

    for (const entry of data) {
      insert.run(
        entry.section,
        entry.hsCode,
        formatHsCode(entry.hsCode),
        entry.description,
        entry.parent,
        entry.level,
      );
    }

    // Also update tariff_classifications descriptions where they're missing
    // Match Australian 8-digit codes to their 6-digit HS parent description
    const updated = db.prepare(`
      UPDATE tariff_classifications
      SET description = (
        SELECT h.description FROM hs_descriptions h
        WHERE h.hs_code = REPLACE(REPLACE(tariff_classifications.code, '.', ''), ' ', '')
        LIMIT 1
      )
      WHERE (description IS NULL OR description = '')
      AND EXISTS (
        SELECT 1 FROM hs_descriptions h
        WHERE h.hs_code = REPLACE(REPLACE(tariff_classifications.code, '.', ''), ' ', '')
      )
    `).run();

    // Also try matching 6-digit prefix for 8-digit Australian codes
    const updated6 = db.prepare(`
      UPDATE tariff_classifications
      SET description = (
        SELECT h.description FROM hs_descriptions h
        WHERE h.hs_code = SUBSTR(REPLACE(REPLACE(tariff_classifications.code, '.', ''), ' ', ''), 1, 6)
        AND h.level = 6
        LIMIT 1
      )
      WHERE (description IS NULL OR description = '')
      AND EXISTS (
        SELECT 1 FROM hs_descriptions h
        WHERE h.hs_code = SUBSTR(REPLACE(REPLACE(tariff_classifications.code, '.', ''), ' ', ''), 1, 6)
        AND h.level = 6
      )
    `).run();

    // Also fill heading descriptions from 4-digit HS codes
    const updatedHeadings = db.prepare(`
      UPDATE tariff_classifications
      SET heading_description = (
        SELECT h.description FROM hs_descriptions h
        WHERE h.hs_code = SUBSTR(REPLACE(REPLACE(tariff_classifications.code, '.', ''), ' ', ''), 1, 4)
        AND h.level = 4
        LIMIT 1
      )
      WHERE (heading_description IS NULL OR heading_description = '')
      AND EXISTS (
        SELECT 1 FROM hs_descriptions h
        WHERE h.hs_code = SUBSTR(REPLACE(REPLACE(tariff_classifications.code, '.', ''), ' ', ''), 1, 4)
        AND h.level = 4
      )
    `).run();

    logInfo(SRC, `Updated ${updated.changes + updated6.changes} classification descriptions, ${updatedHeadings.changes} heading descriptions from HS data`);

    return {
      added: data.length,
      removed: beforeCount,
      modified: updated.changes + updated6.changes + updatedHeadings.changes,
      total: data.length,
    };
  }
}
