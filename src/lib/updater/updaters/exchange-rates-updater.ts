import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { downloadRefFile, splitFields } from '../scrapers/abf-reference-files';
import { logInfo, logWarn } from '../update-logger';

// ── Types ────────────────────────────────────────────────────────────

interface ExchangeRateEntry {
  currency_code: string;
  currency_name: string;
  rate_to_aud: number;
  effective_date: string;
  period_start: string | null;
  period_end: string | null;
}

// ── Constants ────────────────────────────────────────────────────────

const SRC = 'exchange_rates';

/**
 * ISO currency code -> human-readable name.
 * The XCHGRATE file only contains ISO codes, so we map them to names
 * for the currency_name column.
 */
const CURRENCY_NAMES: Record<string, string> = {
  USD: 'United States Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  JPY: 'Japanese Yen',
  CNY: 'Chinese Yuan',
  NZD: 'New Zealand Dollar',
  SGD: 'Singapore Dollar',
  THB: 'Thai Baht',
  KRW: 'South Korean Won',
  MYR: 'Malaysian Ringgit',
  IDR: 'Indonesian Rupiah',
  HKD: 'Hong Kong Dollar',
  TWD: 'New Taiwan Dollar',
  INR: 'Indian Rupee',
  CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc',
  SEK: 'Swedish Krona',
  NOK: 'Norwegian Krone',
  DKK: 'Danish Krone',
  PHP: 'Philippine Peso',
  VND: 'Vietnamese Dong',
  PKR: 'Pakistan Rupee',
  BDT: 'Bangladeshi Taka',
  LKR: 'Sri Lankan Rupee',
  AED: 'UAE Dirham',
  SAR: 'Saudi Riyal',
  KWD: 'Kuwaiti Dinar',
  ZAR: 'South African Rand',
  PGK: 'Papua New Guinea Kina',
  FJD: 'Fijian Dollar',
  CLP: 'Chilean Peso',
  PEN: 'Peruvian Sol',
  MXN: 'Mexican Peso',
  BRL: 'Brazilian Real',
};

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Format a YYYYMMDD string as YYYY-MM-DD.
 */
function formatDate(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

// ── Updater ──────────────────────────────────────────────────────────

/**
 * Exchange Rates updater — pulls the XCHGRATE reference file from
 * the ABF CCF server instead of scraping the ABF website HTML.
 *
 * XCHGRATE line format (whitespace-separated):
 *   Field 0: currency_code  (3 chars, e.g. "USD")
 *   Field 1: creation_ts    (20 digits)
 *   Field 2: period_id      (20 digits)
 *   Field 3: rate_to_aud    (decimal number)
 *   Field 4: start_date     (YYYYMMDD)
 *   Field 5: end_date       (YYYYMMDD, optional — blank for current)
 *
 * The file is ~11.6 MB / 155K lines because it contains historical
 * rates. We only keep the latest rate per currency (highest start_date).
 */
export class ExchangeRatesUpdater extends BaseUpdater {
  readonly sourceId = 'exchange_rates';
  readonly sourceName = 'ABF Exchange Rates';
  readonly defaultCron = '0 4 * * 1'; // 4 AM every Monday
  readonly targetTables = ['exchange_rates'];

  async fetch(): Promise<ExchangeRateEntry[]> {
    logInfo(SRC, 'Downloading XCHGRATE reference file');
    const lines = await downloadRefFile('XCHGRATE');
    logInfo(SRC, `XCHGRATE: ${lines.length} total lines`);

    // Parse every line and keep only the latest rate per currency
    const latestByCurrency = new Map<
      string,
      { rate: number; startDate: string; endDate: string }
    >();

    let parsed = 0;
    let skipped = 0;

    for (const line of lines) {
      const fields = splitFields(line);
      if (fields.length < 5) {
        skipped++;
        continue;
      }

      const currencyCode = fields[0];
      const rate = parseFloat(fields[3]);
      const startDate = fields[4];
      const endDate = fields.length >= 6 ? fields[5] : '';

      // Validate
      if (!/^[A-Z]{3}$/.test(currencyCode)) {
        skipped++;
        continue;
      }
      if (isNaN(rate) || rate <= 0) {
        skipped++;
        continue;
      }
      if (!/^\d{8}$/.test(startDate)) {
        skipped++;
        continue;
      }

      parsed++;

      const existing = latestByCurrency.get(currencyCode);
      if (!existing || startDate > existing.startDate) {
        latestByCurrency.set(currencyCode, {
          rate,
          startDate,
          endDate,
        });
      }
    }

    logInfo(SRC, `Parsed ${parsed} rate lines, skipped ${skipped}`);
    logInfo(SRC, `Unique currencies with latest rate: ${latestByCurrency.size}`);

    // Build output
    const results: ExchangeRateEntry[] = [];
    for (const [code, data] of latestByCurrency) {
      results.push({
        currency_code: code,
        currency_name: CURRENCY_NAMES[code] || code,
        rate_to_aud: data.rate,
        effective_date: formatDate(data.startDate),
        period_start: formatDate(data.startDate),
        period_end: data.endDate ? formatDate(data.endDate) : null,
      });
    }

    if (results.length < 10) {
      throw new Error(
        `Only ${results.length} currencies found — expected at least 10. ` +
          'XCHGRATE file may be corrupt or the format has changed.'
      );
    }

    logInfo(SRC, `Returning ${results.length} exchange rates`);
    return results;
  }

  apply(db: Database.Database, data: ExchangeRateEntry[]): ApplyResult {
    const deleted = db.prepare('DELETE FROM exchange_rates').run();

    const insert = db.prepare(`
      INSERT INTO exchange_rates
        (currency_code, currency_name, rate_to_aud, effective_date,
         period_start, period_end, source)
      VALUES (?, ?, ?, ?, ?, ?, 'ABF-XCHGRATE')
    `);

    for (const row of data) {
      insert.run(
        row.currency_code,
        row.currency_name,
        row.rate_to_aud,
        row.effective_date,
        row.period_start,
        row.period_end
      );
    }

    return {
      added: data.length,
      removed: deleted.changes,
      modified: 0,
      total: data.length,
    };
  }
}
