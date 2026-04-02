import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { downloadRefFile, splitFields } from '../scrapers/abf-reference-files';
import { logInfo, logWarn } from '../update-logger';

// ── Types ────────────────────────────────────────────────────────────

interface InstrumentEntry {
  instrument_type: string;
  instrument_number: string;
  tariff_code: string;
  start_date: string;
  end_date: string;
}

// ── Constants ────────────────────────────────────────────────────────

const SRC = 'instruments';

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Format an 8-digit tariff code with dots: "01012100" -> "0101.21.00"
 */
function formatTariffCode(raw: string): string {
  if (raw.length !== 8) return raw;
  return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
}

/**
 * Format a YYYYMMDD string as YYYY-MM-DD.
 * Returns null if the input is "00010101" (sentinel for "no date").
 */
function formatDate(yyyymmdd: string): string | null {
  if (!yyyymmdd || yyyymmdd === '00010101' || !/^\d{8}$/.test(yyyymmdd)) {
    return null;
  }
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

// ── Updater ──────────────────────────────────────────────────────────

/**
 * Instruments updater — pulls the INSTRMNT reference file from
 * the ABF CCF server.
 *
 * The INSTRMNT file contains instrument records such as:
 * - TCO: Tariff Concession Orders
 * - AD:  Anti-Dumping duties
 * - CV:  Countervailing duties
 * - BYL: By-laws
 *
 * Line format (whitespace-separated fields):
 *   Field 0: instrument_type (TCO, AD, CV, BYL, etc.)
 *   Field 1: instrument_number (e.g. "0101210001")
 *   Field 2+: varies by type — contains tariff chapter, dates, etc.
 *
 * For TCO lines specifically:
 *   Field 0: "TCO"
 *   Field 1: instrument_number (10 digits — first 8 are tariff code)
 *   Field 2: sequence / category
 *   Field 3: start_date (YYYYMMDD)
 *   Field 4: end_date (YYYYMMDD, may be empty or "00010101" sentinel)
 *   Field 5: another date
 *
 * We extract TCO records and store them in tco_tariff_links.
 */
export class InstrumentsUpdater extends BaseUpdater {
  readonly sourceId = 'instruments';
  readonly sourceName = 'ABF Instruments (TCO / AD / CV)';
  readonly defaultCron = '0 3 * * 1'; // weekly Monday 3 AM
  readonly targetTables = ['tco_tariff_links'];

  async fetch(): Promise<InstrumentEntry[]> {
    logInfo(SRC, 'Downloading INSTRMNT reference file');
    const lines = await downloadRefFile('INSTRMNT');
    logInfo(SRC, `INSTRMNT: ${lines.length} lines`);

    const entries: InstrumentEntry[] = [];
    let skipped = 0;

    for (const line of lines) {
      const fields = splitFields(line);
      if (fields.length < 4) {
        skipped++;
        continue;
      }

      const instrumentType = fields[0];
      const instrumentNumber = fields[1];

      // We are interested in TCO records primarily
      // TCO instrument numbers are 10 digits: first 8 = tariff code
      if (instrumentType === 'TCO' && /^\d{10}$/.test(instrumentNumber)) {
        const rawTariffCode = instrumentNumber.slice(0, 8);
        const tariffCode = formatTariffCode(rawTariffCode);

        // Find dates in the remaining fields
        let startDate = '';
        let endDate = '';
        for (let i = 2; i < fields.length; i++) {
          if (/^\d{8}$/.test(fields[i])) {
            if (!startDate) {
              startDate = fields[i];
            } else if (!endDate) {
              endDate = fields[i];
              break;
            }
          }
        }

        entries.push({
          instrument_type: instrumentType,
          instrument_number: instrumentNumber,
          tariff_code: tariffCode,
          start_date: startDate,
          end_date: endDate,
        });
      } else if (
        instrumentType === 'AD' ||
        instrumentType === 'CV' ||
        instrumentType === 'BYL'
      ) {
        // For AD/CV/BYL, the instrument_number structure differs
        // First 8 chars may be a tariff code, but format varies
        const rawCode = instrumentNumber.slice(0, 8);
        let tariffCode = '';
        if (/^\d{8}$/.test(rawCode)) {
          tariffCode = formatTariffCode(rawCode);
        }

        let startDate = '';
        let endDate = '';
        for (let i = 2; i < fields.length; i++) {
          if (/^\d{8}$/.test(fields[i])) {
            if (!startDate) {
              startDate = fields[i];
            } else if (!endDate) {
              endDate = fields[i];
              break;
            }
          }
        }

        entries.push({
          instrument_type: instrumentType,
          instrument_number: instrumentNumber,
          tariff_code: tariffCode,
          start_date: startDate,
          end_date: endDate,
        });
      } else {
        skipped++;
      }
    }

    logInfo(SRC, `Parsed ${entries.length} instrument entries (skipped ${skipped})`);

    const tcoCount = entries.filter((e) => e.instrument_type === 'TCO').length;
    logInfo(SRC, `TCO entries: ${tcoCount}`);

    return entries;
  }

  apply(db: Database.Database, data: InstrumentEntry[]): ApplyResult {
    // Ensure the tco_tariff_links table exists (it's created in db.ts)
    const beforeCount = (
      db.prepare('SELECT COUNT(*) as c FROM tco_tariff_links').get() as any
    )?.c || 0;

    // Clear and rebuild TCO links
    db.prepare('DELETE FROM tco_tariff_links').run();

    const insertTco = db.prepare(
      `INSERT OR IGNORE INTO tco_tariff_links
         (tco_number, tariff_code, tariff_description, linked_at)
       VALUES (?, ?, ?, datetime('now'))`
    );

    let tcoAdded = 0;
    for (const entry of data) {
      if (entry.instrument_type === 'TCO' && entry.tariff_code) {
        // Format TCO number for display: "0101210001" -> "0101.21.00/01"
        const tcoDisplay = entry.instrument_number.length === 10
          ? `${formatTariffCode(entry.instrument_number.slice(0, 8))}/${entry.instrument_number.slice(8)}`
          : entry.instrument_number;

        const startFormatted = formatDate(entry.start_date);
        const endFormatted = formatDate(entry.end_date);

        // Only include current TCOs (no end date or end date in future)
        const isExpired =
          endFormatted !== null &&
          endFormatted < new Date().toISOString().split('T')[0];

        if (!isExpired) {
          insertTco.run(
            tcoDisplay,
            entry.tariff_code,
            startFormatted
              ? `Active from ${startFormatted}`
              : null
          );
          tcoAdded++;
        }
      }
    }

    logInfo(SRC, `Inserted ${tcoAdded} active TCO links`);

    return {
      added: tcoAdded,
      removed: beforeCount,
      modified: 0,
      total: tcoAdded,
    };
  }
}
