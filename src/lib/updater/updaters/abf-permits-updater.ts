import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { downloadRefFile, splitFields } from '../scrapers/abf-reference-files';
import { logInfo, logWarn } from '../update-logger';

// ── Types ────────────────────────────────────────────────────────────

interface PermitEntry {
  tariff_code: string;            // formatted: "0101.10.20"
  agency_code: string;            // raw 3-char code, e.g. "PIL"
  agency_name: string;            // friendly name
  start_date: string | null;      // YYYY-MM-DD
  end_date: string | null;        // YYYY-MM-DD or null
  required_flag: string;          // "Y", "M", "N"
  is_active: 0 | 1;
}

// ── Constants ────────────────────────────────────────────────────────

const SRC = 'abf_permits';

/**
 * Agency code -> friendly name. Codes that are not in this map fall
 * back to their raw code value.
 */
const AGENCY_NAMES: Record<string, string> = {
  PIL: 'Permit — Import Licence',
  PIF: 'Permit — Import/Food',
  PIE: 'Permit — Export',
  ACS: 'Australian Customs Service',
  BIO: 'Biosecurity',
  DAF: 'Department of Agriculture, Forestry and Fisheries',
  DEF: 'Defence',
  ENV: 'Department of the Environment',
  HLT: 'Health (TGA)',
  OCS: 'Office of Chemical Safety',
  RAD: 'Radiation (ARPANSA)',
  ICC: 'International Classification Council',
  IND: 'Industry',
  TRE: 'Treasury',
};

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Format an 8-digit tariff code with dots: "01011020" -> "0101.10.20"
 */
function formatTariffCode(raw: string): string {
  if (raw.length !== 8) return raw;
  return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
}

/**
 * Format a YYYYMMDD string as YYYY-MM-DD, or null if not valid.
 */
function formatDate(yyyymmdd: string): string | null {
  if (!yyyymmdd || !/^\d{8}$/.test(yyyymmdd)) return null;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

/**
 * Return today's date as YYYYMMDD.
 */
function todayYYYYMMDD(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${dd}`;
}

// ── Updater ──────────────────────────────────────────────────────────

/**
 * ABF Permits updater — pulls the PRMTRQMT reference file which lists
 * agency permit requirements per tariff code.
 *
 * PRMTRQMT line format (whitespace-separated):
 *   Field 0: tariff_code    (8 digits)
 *   Field 1: agency_code    (3 chars)
 *   Field 2: start_date     (YYYYMMDD)
 *   Field 3: end_date       (YYYYMMDD, optional)
 *   Field 4: required_flag  (Y / M / N)
 *
 * When the end_date is missing the required_flag shifts to field 3.
 * We detect that by checking whether field 3 looks like a date.
 */
export class AbfPermitsUpdater extends BaseUpdater {
  readonly sourceId = 'abf_permits';
  readonly sourceName = 'ABF Permit Requirements (PRMTRQMT)';
  readonly defaultCron = '0 3 * * 1'; // weekly Monday 3 AM
  readonly targetTables = ['permit_requirements_abf'];

  async fetch(): Promise<PermitEntry[]> {
    logInfo(SRC, 'Downloading PRMTRQMT reference file');
    const lines = await downloadRefFile('PRMTRQMT');
    logInfo(SRC, `PRMTRQMT: ${lines.length} lines`);

    const today = todayYYYYMMDD();
    const results: PermitEntry[] = [];
    let parsed = 0;
    let skipped = 0;

    for (const line of lines) {
      const fields = splitFields(line);
      if (fields.length < 4) {
        skipped++;
        continue;
      }

      const rawCode = fields[0];
      const agencyCode = fields[1];
      const startDate = fields[2];

      if (!/^\d{8}$/.test(rawCode)) {
        skipped++;
        continue;
      }
      if (!/^[A-Z]{2,4}$/.test(agencyCode)) {
        skipped++;
        continue;
      }
      if (!/^\d{8}$/.test(startDate)) {
        skipped++;
        continue;
      }

      // Detect whether end_date is present
      const f3 = fields[3] ?? '';
      const hasEndDate = /^\d{8}$/.test(f3);
      const endDate = hasEndDate ? f3 : '';
      const requiredFlag = hasEndDate ? (fields[4] ?? '') : f3;

      if (!/^[YMN]$/i.test(requiredFlag)) {
        skipped++;
        continue;
      }

      // is_active: no end_date, or end_date is today/future
      const isActive: 0 | 1 = !endDate || endDate >= today ? 1 : 0;

      parsed++;
      results.push({
        tariff_code: formatTariffCode(rawCode),
        agency_code: agencyCode.toUpperCase(),
        agency_name:
          AGENCY_NAMES[agencyCode.toUpperCase()] || agencyCode.toUpperCase(),
        start_date: formatDate(startDate),
        end_date: endDate ? formatDate(endDate) : null,
        required_flag: requiredFlag.toUpperCase(),
        is_active: isActive,
      });
    }

    logInfo(SRC, `Parsed ${parsed} permits, skipped ${skipped}`);

    if (results.length < 1000) {
      throw new Error(
        `Only ${results.length} permit rows parsed — expected at least 1000. ` +
          'PRMTRQMT file may be corrupt or format changed.'
      );
    }

    return results;
  }

  apply(db: Database.Database, data: PermitEntry[]): ApplyResult {
    // Safety: do not wipe the existing table if the parse clearly failed
    if (data.length < 1000) {
      logWarn(
        SRC,
        `Aborting apply — only ${data.length} rows parsed (min 1000). ` +
          'Existing data preserved.'
      );
      return { added: 0, removed: 0, modified: 0, total: 0 };
    }

    // Ensure table exists (db.ts also creates it on init)
    db.exec(`
      CREATE TABLE IF NOT EXISTS permit_requirements_abf (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tariff_code TEXT NOT NULL,
        agency_code TEXT NOT NULL,
        agency_name TEXT,
        start_date TEXT,
        end_date TEXT,
        required_flag TEXT,
        is_active INTEGER DEFAULT 1,
        source TEXT DEFAULT 'PRMTRQMT'
      );
      CREATE INDEX IF NOT EXISTS idx_permit_abf_code ON permit_requirements_abf(tariff_code);
      CREATE INDEX IF NOT EXISTS idx_permit_abf_agency ON permit_requirements_abf(agency_code);
      CREATE INDEX IF NOT EXISTS idx_permit_abf_active ON permit_requirements_abf(is_active);
    `);

    const beforeCount = (
      db.prepare('SELECT COUNT(*) as c FROM permit_requirements_abf').get() as any
    )?.c || 0;

    db.prepare('DELETE FROM permit_requirements_abf').run();

    const insert = db.prepare(`
      INSERT INTO permit_requirements_abf
        (tariff_code, agency_code, agency_name, start_date, end_date,
         required_flag, is_active, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'PRMTRQMT')
    `);

    for (const row of data) {
      insert.run(
        row.tariff_code,
        row.agency_code,
        row.agency_name,
        row.start_date,
        row.end_date,
        row.required_flag,
        row.is_active
      );
    }

    logInfo(SRC, `Inserted ${data.length} permit rows`);

    return {
      added: data.length,
      removed: beforeCount,
      modified: 0,
      total: data.length,
    };
  }
}
