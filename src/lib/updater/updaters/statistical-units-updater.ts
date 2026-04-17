import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { downloadRefFile, splitFields } from '../scrapers/abf-reference-files';
import { logInfo, logWarn } from '../update-logger';

// ── Types ────────────────────────────────────────────────────────────

interface StatUnitEntry {
  tariff_code: string;      // formatted: "0101.21.00"
  statistical_code: string; // 2-digit stat code: "21"
  unit: string;             // "NO", "KG", "L", etc.
  start_date: string;       // YYYYMMDD
}

// ── Constants ────────────────────────────────────────────────────────

const SRC = 'statistical_units';

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Format an 8-digit tariff code with dots: "01012100" -> "0101.21.00"
 */
function formatTariffCode(raw: string): string {
  if (raw.length !== 8) return raw;
  return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
}

// ── Updater ──────────────────────────────────────────────────────────

/**
 * Statistical Units updater — pulls the STCPSNAP reference file from
 * the ABF CCF server and updates the `unit` column of
 * `tariff_classifications` where it is currently NULL or empty.
 *
 * STCPSNAP line format (whitespace-separated):
 *   Field 0: tariff_code        (8 digits, e.g. "01011000")
 *   Field 1: stat_code          (2 digits, e.g. "25")
 *   Field 2: period_identifier  (numeric)
 *   Field 3: creation timestamp (20 digits)
 *   Field 4: start_date         (YYYYMMDD)
 *   Field 5: end_date           (YYYYMMDD, optional — may be blank)
 *   Field 6: sequence           (numeric)
 *   Field 7: unit_code          (NO, KG, L, M, M2, M3, etc.)
 *   ... trailing decimal statistical fields
 *
 * When `end_date` is missing, the sequence / unit positions shift left by
 * one — we detect this by checking whether field 5 matches the YYYYMMDD
 * pattern. Only the most recent entry per (tariff_code, stat_code) is
 * kept (highest start_date).
 */
export class StatisticalUnitsUpdater extends BaseUpdater {
  readonly sourceId = 'statistical_units';
  readonly sourceName = 'Statistical Units (STCPSNAP)';
  readonly defaultCron = '0 3 * * 1'; // 3 AM every Monday
  readonly targetTables = ['tariff_classifications'];

  async fetch(): Promise<StatUnitEntry[]> {
    logInfo(SRC, 'Downloading STCPSNAP reference file');
    const lines = await downloadRefFile('STCPSNAP');
    logInfo(SRC, `STCPSNAP: ${lines.length} lines`);

    // Keep latest entry per (tariff_code, stat_code) based on start_date
    const latest = new Map<string, StatUnitEntry>();
    let parsed = 0;
    let skipped = 0;

    for (const line of lines) {
      const fields = splitFields(line);
      if (fields.length < 7) {
        skipped++;
        continue;
      }

      const rawCode = fields[0];
      const statCode = fields[1];

      if (!/^\d{8}$/.test(rawCode)) {
        skipped++;
        continue;
      }
      if (!/^\d{1,2}$/.test(statCode)) {
        skipped++;
        continue;
      }

      // Detect whether end_date is present. Field 4 is always start_date
      // (YYYYMMDD). Field 5 is either end_date (YYYYMMDD) or the sequence.
      // If field 5 is 8 digits starting with 19/20, treat it as end_date
      // and the unit lives at field 7; otherwise the unit lives at field 6.
      const startDate = fields[4] ?? '';
      if (!/^\d{8}$/.test(startDate)) {
        skipped++;
        continue;
      }

      const maybeEnd = fields[5] ?? '';
      const hasEndDate =
        /^\d{8}$/.test(maybeEnd) && /^(19|20)\d{6}$/.test(maybeEnd);

      const unitIdx = hasEndDate ? 7 : 6;
      const unit = (fields[unitIdx] ?? '').trim();

      if (!unit || unit.length > 8 || !/^[A-Z0-9]+$/i.test(unit)) {
        skipped++;
        continue;
      }

      parsed++;

      const key = `${rawCode}|${statCode.padStart(2, '0')}`;
      const existing = latest.get(key);
      if (!existing || startDate > existing.start_date) {
        latest.set(key, {
          tariff_code: formatTariffCode(rawCode),
          statistical_code: statCode.padStart(2, '0'),
          unit: unit.toUpperCase(),
          start_date: startDate,
        });
      }
    }

    logInfo(SRC, `Parsed ${parsed} lines, skipped ${skipped}`);
    logInfo(SRC, `Unique (code, stat) pairs with unit: ${latest.size}`);

    const results = [...latest.values()];
    if (results.length < 1000) {
      throw new Error(
        `Only ${results.length} statistical units parsed — expected at least 1000. ` +
          'STCPSNAP file may be corrupt or format changed.'
      );
    }

    return results;
  }

  apply(db: Database.Database, data: StatUnitEntry[]): ApplyResult {
    // Only fill in rows where unit is NULL or empty — never overwrite
    // existing data. We match on both the formatted tariff code and the
    // statistical code.
    const updateWithStat = db.prepare(`
      UPDATE tariff_classifications
         SET unit = ?
       WHERE code = ?
         AND (statistical_code = ? OR statistical_code = ?)
         AND (unit IS NULL OR unit = '')
    `);

    // Fallback: some rows may not have a separate statistical_code and
    // store the full 10-digit code in `code` instead. Try that too.
    const updateByFullCode = db.prepare(`
      UPDATE tariff_classifications
         SET unit = ?
       WHERE code = ?
         AND (unit IS NULL OR unit = '')
    `);

    let modified = 0;

    for (const entry of data) {
      const statPadded = entry.statistical_code;
      const statUnpadded = String(parseInt(entry.statistical_code, 10));

      // 1) Try matching formatted code + statistical_code column
      const r1 = updateWithStat.run(
        entry.unit,
        entry.tariff_code,
        statPadded,
        statUnpadded
      );
      if (r1.changes > 0) {
        modified += r1.changes;
        continue;
      }

      // 2) Try the full code "0101.21.00.21" style
      const fullCode = `${entry.tariff_code}.${statPadded}`;
      const r2 = updateByFullCode.run(entry.unit, fullCode);
      if (r2.changes > 0) {
        modified += r2.changes;
      }
    }

    logInfo(SRC, `Updated unit on ${modified} tariff_classifications rows`);

    const totalRow = db
      .prepare('SELECT COUNT(*) as c FROM tariff_classifications')
      .get() as { c: number } | undefined;
    const total = totalRow?.c ?? 0;

    if (modified === 0) {
      logWarn(
        SRC,
        'No rows were updated — either units are already populated or ' +
          'the code/stat-code format does not match the database.'
      );
    }

    return {
      added: 0,
      removed: 0,
      modified,
      total,
    };
  }
}
