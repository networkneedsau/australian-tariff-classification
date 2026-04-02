import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { fetchAndParse } from '../scrapers/html-scraper';
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
const EXCHANGE_RATES_URL =
  'https://www.abf.gov.au/importing-exporting-and-manufacturing/importing/cost-of-importing-goods/exchange-rates';

/**
 * Common currency name -> ISO code mapping for ABF exchange rate table.
 */
const CURRENCY_MAP: Record<string, string> = {
  'united states dollar': 'USD',
  'us dollar': 'USD',
  'euro': 'EUR',
  'british pound': 'GBP',
  'pound sterling': 'GBP',
  'japanese yen': 'JPY',
  'chinese yuan': 'CNY',
  'chinese renminbi': 'CNY',
  'new zealand dollar': 'NZD',
  'singapore dollar': 'SGD',
  'thai baht': 'THB',
  'south korean won': 'KRW',
  'korean won': 'KRW',
  'malaysian ringgit': 'MYR',
  'indonesian rupiah': 'IDR',
  'hong kong dollar': 'HKD',
  'taiwan dollar': 'TWD',
  'new taiwan dollar': 'TWD',
  'indian rupee': 'INR',
  'canadian dollar': 'CAD',
  'swiss franc': 'CHF',
  'swedish krona': 'SEK',
  'norwegian krone': 'NOK',
  'danish krone': 'DKK',
  'philippine peso': 'PHP',
  'vietnamese dong': 'VND',
  'pakistan rupee': 'PKR',
  'bangladeshi taka': 'BDT',
  'sri lankan rupee': 'LKR',
  'uae dirham': 'AED',
  'saudi riyal': 'SAR',
  'kuwaiti dinar': 'KWD',
  'south african rand': 'ZAR',
  'papua new guinea kina': 'PGK',
  'fijian dollar': 'FJD',
  'chilean peso': 'CLP',
  'peruvian sol': 'PEN',
  'mexican peso': 'MXN',
  'brazilian real': 'BRL',
};

/**
 * Attempt to map a currency name to its ISO code.
 */
function resolveCurrencyCode(name: string): string | null {
  const lower = name.toLowerCase().trim();
  if (CURRENCY_MAP[lower]) return CURRENCY_MAP[lower];
  // Try partial match
  for (const [key, code] of Object.entries(CURRENCY_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return code;
  }
  return null;
}

// ── Updater ──────────────────────────────────────────────────────────

export class ExchangeRatesUpdater extends BaseUpdater {
  readonly sourceId = 'exchange_rates';
  readonly sourceName = 'ABF Exchange Rates';
  readonly defaultCron = '0 4 * * 1'; // 4 AM every Monday
  readonly targetTables = ['exchange_rates'];

  async fetch(): Promise<ExchangeRateEntry[]> {
    logInfo(SRC, `Fetching exchange rates from ${EXCHANGE_RATES_URL}`);
    const $ = await fetchAndParse(EXCHANGE_RATES_URL);

    const rates: ExchangeRateEntry[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Look for tables on the page containing exchange rate data
    $('table').each((_tableIdx, table) => {
      const headers: string[] = [];
      $(table)
        .find('thead tr th, thead tr td, tr:first-child th, tr:first-child td')
        .each((_i, th) => {
          headers.push($(th).text().trim().toLowerCase());
        });

      // Try to identify which columns hold currency name and rate
      let currencyCol = -1;
      let rateCol = -1;
      let periodCol = -1;

      for (let i = 0; i < headers.length; i++) {
        const h = headers[i];
        if (h.includes('currency') || h.includes('country')) currencyCol = i;
        else if (h.includes('rate') || h.includes('exchange') || h.includes('value') || h.includes('aud'))
          rateCol = i;
        else if (h.includes('period') || h.includes('date') || h.includes('effective'))
          periodCol = i;
      }

      // If we could not identify columns from headers, try positional
      if (currencyCol === -1 && headers.length >= 2) currencyCol = 0;
      if (rateCol === -1 && headers.length >= 2) rateCol = 1;

      // Skip header row, iterate data rows
      const rows = $(table).find('tr').toArray();
      const startRow = headers.length > 0 ? 1 : 0;

      for (let r = startRow; r < rows.length; r++) {
        const cells = $(rows[r]).find('td').toArray();
        if (cells.length < 2) continue;

        const currencyText = $(cells[currencyCol >= 0 ? currencyCol : 0])
          .text()
          .trim();
        const rateText = $(cells[rateCol >= 0 ? rateCol : 1])
          .text()
          .trim();

        if (!currencyText || !rateText) continue;

        // Parse the rate value
        const rateValue = parseFloat(rateText.replace(/[^0-9.]/g, ''));
        if (isNaN(rateValue) || rateValue <= 0) continue;

        // Resolve currency code
        const code = resolveCurrencyCode(currencyText);
        if (!code) {
          logWarn(SRC, `Could not resolve currency code for: ${currencyText}`);
          continue;
        }

        let periodStart: string | null = null;
        let periodEnd: string | null = null;
        if (periodCol >= 0 && cells[periodCol]) {
          const periodText = $(cells[periodCol]).text().trim();
          // Try to parse period range like "1 Jan - 31 Jan 2025"
          const parts = periodText.split(/\s*[-–]\s*/);
          if (parts.length === 2) {
            periodStart = parts[0].trim();
            periodEnd = parts[1].trim();
          }
        }

        rates.push({
          currency_code: code,
          currency_name: currencyText,
          rate_to_aud: rateValue,
          effective_date: today,
          period_start: periodStart,
          period_end: periodEnd,
        });
      }
    });

    logInfo(SRC, `Parsed ${rates.length} exchange rates`);
    return rates;
  }

  apply(db: Database.Database, data: ExchangeRateEntry[]): ApplyResult {
    // Delete old rates
    const deleted = db.prepare('DELETE FROM exchange_rates').run();

    // Insert new rates
    const insert = db.prepare(`
      INSERT INTO exchange_rates
        (currency_code, currency_name, rate_to_aud, effective_date, period_start, period_end, source)
      VALUES (?, ?, ?, ?, ?, ?, 'ABF')
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
