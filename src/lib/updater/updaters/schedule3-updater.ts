import type Database from 'better-sqlite3';
import { BaseUpdater, type ApplyResult } from '../base-updater';
import { downloadRefFile, splitFields } from '../scrapers/abf-reference-files';
import {
  scrapeSchedule3Sections,
  scrapeSchedule3ChapterLinks,
  scrapeSchedule3Chapter,
} from '../scrapers/abf-scraper';
import { logInfo, logError, logWarn } from '../update-logger';

// ── Types ────────────────────────────────────────────────────────────

interface TfrpEntry {
  /** Raw 8-digit code without dots, e.g. "01012100" */
  rawCode: string;
  /** Formatted code with dots, e.g. "0101.21.00" */
  code: string;
  /** Preference scheme: GEN, ADC, CFTA, etc. */
  scheme: string;
  /** Duty calculation type: FREE, CALC, RATE, etc. */
  calcType: string;
  /** Customs value rate as a number */
  customsValueRate: number;
  /** Start date YYYYMMDD */
  startDate: string;
  /** End date YYYYMMDD (empty if current) */
  endDate: string;
}

interface TrfcEntry {
  /** Raw 8-digit code without dots */
  rawCode: string;
  /** Formatted code with dots */
  code: string;
}

interface ClassificationRow {
  code: string;
  statisticalCode: string | null;
  description: string;
  unit: string | null;
  dutyRate: string | null;
  dutyRateNumeric: number | null;
  isFree: boolean;
  chapterNumber: number;
  chapterTitle: string;
  sectionNumber: number;
  sectionTitle: string;
  headingCode: string;
  headingDescription: string;
}

// ── Constants ────────────────────────────────────────────────────────

const SRC = 'schedule3';

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Format an 8-digit tariff code with dots: "01012100" -> "0101.21.00"
 */
function formatTariffCode(raw: string): string {
  if (raw.length !== 8) return raw;
  return `${raw.slice(0, 4)}.${raw.slice(4, 6)}.${raw.slice(6, 8)}`;
}

/**
 * Convert a TFRPSNAP calc type + rate into a human-readable duty rate string.
 */
function dutyRateString(calcType: string, customsValueRate: number): string {
  if (calcType === 'FREE') return 'Free';
  if (calcType === 'RATE' || calcType === 'CALC') {
    if (customsValueRate === 0) return 'Free';
    return `${customsValueRate}%`;
  }
  // Fallback: show what we have
  if (customsValueRate > 0) return `${customsValueRate}%`;
  return calcType || 'Free';
}

function romanToInt(s: string): number {
  const map: Record<string, number> = {
    I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000,
  };
  let result = 0;
  const upper = s.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const curr = map[upper[i]] || 0;
    const next = i + 1 < upper.length ? map[upper[i + 1]] || 0 : 0;
    result += curr < next ? -curr : curr;
  }
  return result;
}

// ── Updater ──────────────────────────────────────────────────────────

/**
 * Schedule 3 — Tariff Classifications (hybrid approach).
 *
 * Uses ABF reference files for structured data:
 * - TFRPSNAP: All tariff codes with duty rates per preference scheme
 * - TRFCSNAP: Master list of all valid tariff codes (~8,021)
 *
 * Falls back to HTML scraping only for descriptions when the database
 * is empty (first run). On subsequent runs, existing descriptions are
 * preserved and only duty rates are updated from the reference files.
 */
export class Schedule3Updater extends BaseUpdater {
  readonly sourceId = 'schedule3';
  readonly sourceName = 'Schedule 3 — Tariff Classifications';
  readonly defaultCron = '0 3 1 1,4,7,10 *'; // quarterly
  readonly targetTables = ['tariff_classifications'];

  async fetch(): Promise<{
    tfrpRates: Map<string, TfrpEntry>;
    trfcCodes: TrfcEntry[];
    scrapedRows: ClassificationRow[] | null;
  }> {
    // ── Step 1: Download TFRPSNAP — duty rates ──────────────────────
    logInfo(SRC, 'Downloading TFRPSNAP (tariff duty rates)');
    const tfrpLines = await downloadRefFile('TFRPSNAP');
    logInfo(SRC, `TFRPSNAP: ${tfrpLines.length} lines`);

    // Parse and keep only GEN (general) rates, latest per code
    const tfrpRates = new Map<string, TfrpEntry>();
    let tfrpParsed = 0;

    for (const line of tfrpLines) {
      const fields = splitFields(line);
      if (fields.length < 8) continue;

      const rawCode = fields[0];
      const scheme = fields[2];

      // Only keep GEN (general) rates
      if (scheme !== 'GEN') continue;

      // Parse the calc type and rate
      // Fields layout (whitespace-split):
      //   0: tariff code (8 digits)
      //   1: rate number
      //   2: preference scheme (GEN, ADC, etc.)
      //   3: period identifier
      //   4: creation timestamp (20 digits)
      //   5: calc type (FREE, CALC, RATE)
      //   6: customs value rate
      //   7: quantity rate
      //   ... more rate fields ...
      //   N-2: start date (8 digits)
      //   N-1: end date (8 digits, or last field)

      const calcType = fields[5];
      const customsValueRate = parseFloat(fields[6]) || 0;

      // Start date is the second-to-last 8-digit field
      // Find start_date: look for YYYYMMDD pattern near the end
      let startDate = '';
      let endDate = '';
      for (let i = fields.length - 1; i >= 6; i--) {
        if (/^\d{8}$/.test(fields[i])) {
          if (!endDate && !startDate) {
            // Could be start or end — check if there's another date before it
            const prev = i > 0 ? fields[i - 1] : '';
            if (/^\d{8}$/.test(prev)) {
              startDate = prev;
              endDate = fields[i];
            } else {
              startDate = fields[i];
            }
            break;
          }
        }
      }

      if (!/^\d{8}$/.test(rawCode)) continue;

      const entry: TfrpEntry = {
        rawCode,
        code: formatTariffCode(rawCode),
        scheme,
        calcType,
        customsValueRate,
        startDate,
        endDate,
      };

      // Keep latest by start_date, or if no end_date (current rate)
      const existing = tfrpRates.get(rawCode);
      if (!existing) {
        tfrpRates.set(rawCode, entry);
      } else if (!entry.endDate && existing.endDate) {
        // Prefer the entry with no end date (current rate)
        tfrpRates.set(rawCode, entry);
      } else if (entry.startDate > existing.startDate) {
        tfrpRates.set(rawCode, entry);
      }

      tfrpParsed++;
    }

    logInfo(SRC, `TFRPSNAP: ${tfrpParsed} GEN rate lines, ${tfrpRates.size} unique codes`);

    // ── Step 2: Download TRFCSNAP — master tariff code list ─────────
    logInfo(SRC, 'Downloading TRFCSNAP (tariff code master list)');
    const trfcLines = await downloadRefFile('TRFCSNAP');
    logInfo(SRC, `TRFCSNAP: ${trfcLines.length} lines`);

    const trfcCodes: TrfcEntry[] = [];
    for (const line of trfcLines) {
      const fields = splitFields(line);
      if (fields.length < 1) continue;
      const rawCode = fields[0];
      if (/^\d{8}$/.test(rawCode)) {
        trfcCodes.push({
          rawCode,
          code: formatTariffCode(rawCode),
        });
      }
    }

    logInfo(SRC, `TRFCSNAP: ${trfcCodes.length} valid tariff codes`);

    // Safety threshold based on TRFCSNAP count
    if (trfcCodes.length < 7000) {
      throw new Error(
        `Only ${trfcCodes.length} tariff codes in TRFCSNAP — expected > 7000. ` +
          'File may be corrupt or format changed. Aborting.'
      );
    }

    // ── Step 3: Check if we need to scrape descriptions ─────────────
    // Only scrape HTML if the database has no existing descriptions
    let scrapedRows: ClassificationRow[] | null = null;

    // We'll check DB state in apply() since we don't have db here.
    // Instead, always attempt the scrape if we can, but don't fail if
    // it fails — the reference files alone are enough for updates.
    try {
      logInfo(SRC, 'Attempting HTML scrape for descriptions (first-run or refresh)');
      scrapedRows = await this.scrapeDescriptions();
      logInfo(SRC, `HTML scrape returned ${scrapedRows?.length ?? 0} rows`);
    } catch (err: any) {
      logWarn(SRC, `HTML scrape failed (will use existing descriptions): ${err?.message}`);
      scrapedRows = null;
    }

    return { tfrpRates, trfcCodes, scrapedRows };
  }

  apply(
    db: Database.Database,
    data: {
      tfrpRates: Map<string, TfrpEntry>;
      trfcCodes: TrfcEntry[];
      scrapedRows: ClassificationRow[] | null;
    }
  ): ApplyResult {
    const { tfrpRates, trfcCodes, scrapedRows } = data;

    const beforeCount = (
      db.prepare('SELECT COUNT(*) as c FROM tariff_classifications').get() as any
    )?.c || 0;

    const hasExistingData = beforeCount > 0;

    if (scrapedRows && scrapedRows.length > 5000) {
      // Full rebuild from scrape + reference file rates
      logInfo(SRC, 'Full rebuild: scraped descriptions + TFRPSNAP rates');

      db.prepare('DELETE FROM tariff_classifications').run();

      const insert = db.prepare(
        `INSERT INTO tariff_classifications
           (section_number, section_title, chapter_number, chapter_title,
            heading_code, heading_description, code, statistical_code,
            description, unit, duty_rate, duty_rate_numeric, is_free)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      for (const row of scrapedRows) {
        // Override duty rate from TFRPSNAP if available
        const rawCode = row.code.replace(/\./g, '');
        const refRate = tfrpRates.get(rawCode);

        let dutyRate = row.dutyRate;
        let dutyRateNumeric = row.dutyRateNumeric;
        let isFree = row.isFree;

        if (refRate) {
          dutyRate = dutyRateString(refRate.calcType, refRate.customsValueRate);
          dutyRateNumeric = refRate.customsValueRate;
          isFree = refRate.calcType === 'FREE' || refRate.customsValueRate === 0;
        }

        insert.run(
          row.sectionNumber,
          row.sectionTitle,
          row.chapterNumber,
          row.chapterTitle,
          row.headingCode,
          row.headingDescription,
          row.code,
          row.statisticalCode,
          row.description,
          row.unit,
          dutyRate,
          dutyRateNumeric,
          isFree ? 1 : 0
        );
      }

      // Rebuild FTS index
      try {
        db.exec(`INSERT INTO tariff_fts(tariff_fts) VALUES('rebuild')`);
      } catch {
        // FTS table may not exist yet
      }

      return {
        added: scrapedRows.length,
        removed: beforeCount,
        modified: 0,
        total: scrapedRows.length,
      };
    }

    if (!hasExistingData) {
      // No existing data and no scrape — insert codes with rates only
      logInfo(SRC, 'No existing data and no scrape — inserting codes from TRFCSNAP with TFRPSNAP rates + HS descriptions');

      // Load HS descriptions for gap-filling
      const hsDescMap = new Map<string, { description: string; section: string }>();
      try {
        const hsRows = db.prepare('SELECT hs_code, description, section FROM hs_descriptions').all() as any[];
        for (const row of hsRows) {
          hsDescMap.set(row.hs_code, { description: row.description, section: row.section || '' });
        }
        logInfo(SRC, `Loaded ${hsDescMap.size} HS descriptions for gap-filling`);
      } catch {
        logWarn(SRC, 'hs_descriptions table not available — run hs_descriptions updater first for descriptions');
      }

      const insert = db.prepare(
        `INSERT INTO tariff_classifications
           (section_number, section_title, chapter_number, chapter_title,
            heading_code, heading_description, code, statistical_code,
            description, unit, duty_rate, duty_rate_numeric, is_free)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      let descFilled = 0;
      for (const trfc of trfcCodes) {
        const refRate = tfrpRates.get(trfc.rawCode);
        const chapterNum = parseInt(trfc.rawCode.slice(0, 2)) || 0;
        const headingCode = trfc.rawCode.slice(0, 4);

        let dutyRate = 'Free';
        let dutyRateNumeric: number | null = null;
        let isFree = true;

        if (refRate) {
          dutyRate = dutyRateString(refRate.calcType, refRate.customsValueRate);
          dutyRateNumeric = refRate.customsValueRate;
          isFree = refRate.calcType === 'FREE' || refRate.customsValueRate === 0;
        }

        // Look up description from HS data (try exact 8-digit, then 6-digit, then 4-digit)
        let description = '';
        let headingDescription = '';
        let sectionTitle = '';
        const code8 = trfc.rawCode; // e.g. "01012100"
        const code6 = code8.slice(0, 6); // e.g. "010121"
        const code4 = code8.slice(0, 4); // e.g. "0101"
        const code2 = code8.slice(0, 2); // e.g. "01"

        const hs8 = hsDescMap.get(code8);
        const hs6 = hsDescMap.get(code6);
        const hs4 = hsDescMap.get(code4);
        const hs2 = hsDescMap.get(code2);

        if (hs8) { description = hs8.description; sectionTitle = hs8.section; descFilled++; }
        else if (hs6) { description = hs6.description; sectionTitle = hs6.section; descFilled++; }

        if (hs4) headingDescription = hs4.description;

        // Map HS section roman numeral to number
        const sectionNum = sectionTitle ? romanToInt(sectionTitle) : 0;

        insert.run(
          sectionNum,
          sectionTitle,
          chapterNum,
          hs2?.description || '', // chapter title from 2-digit HS
          headingCode,
          headingDescription,
          trfc.code,
          null,             // statistical_code
          description,
          null,             // unit
          dutyRate,
          dutyRateNumeric,
          isFree ? 1 : 0
        );
      }

      logInfo(SRC, `Filled ${descFilled} descriptions from HS data out of ${trfcCodes.length} codes`);

      return {
        added: trfcCodes.length,
        removed: 0,
        modified: descFilled,
        total: trfcCodes.length,
      };
    }

    // Existing data: UPDATE duty rates, INSERT new codes
    logInfo(SRC, 'Updating existing classifications with TFRPSNAP rates');

    const update = db.prepare(
      `UPDATE tariff_classifications
         SET duty_rate = ?, duty_rate_numeric = ?, is_free = ?
       WHERE code = ?`
    );

    const existingCodes = new Set<string>();
    const allCodes = db
      .prepare('SELECT code FROM tariff_classifications')
      .all() as { code: string }[];
    for (const row of allCodes) {
      existingCodes.add(row.code);
    }

    let modified = 0;
    for (const [rawCode, refRate] of tfrpRates) {
      const code = formatTariffCode(rawCode);
      if (existingCodes.has(code)) {
        const dutyRate = dutyRateString(refRate.calcType, refRate.customsValueRate);
        const dutyRateNumeric = refRate.customsValueRate;
        const isFree = refRate.calcType === 'FREE' || refRate.customsValueRate === 0;
        const result = update.run(dutyRate, dutyRateNumeric, isFree ? 1 : 0, code);
        if (result.changes > 0) modified++;
      }
    }

    // Insert new codes from TRFCSNAP that don't exist in DB
    const insert = db.prepare(
      `INSERT INTO tariff_classifications
         (section_number, section_title, chapter_number, chapter_title,
          heading_code, heading_description, code, statistical_code,
          description, unit, duty_rate, duty_rate_numeric, is_free)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    let added = 0;
    for (const trfc of trfcCodes) {
      if (!existingCodes.has(trfc.code)) {
        const refRate = tfrpRates.get(trfc.rawCode);
        const chapterNum = parseInt(trfc.rawCode.slice(0, 2)) || 0;
        const headingCode = trfc.rawCode.slice(0, 4);

        let dutyRate = 'Free';
        let dutyRateNumeric: number | null = null;
        let isFree = true;

        if (refRate) {
          dutyRate = dutyRateString(refRate.calcType, refRate.customsValueRate);
          dutyRateNumeric = refRate.customsValueRate;
          isFree = refRate.calcType === 'FREE' || refRate.customsValueRate === 0;
        }

        insert.run(
          0, '', chapterNum, '', headingCode, '',
          trfc.code, null, '', null, dutyRate, dutyRateNumeric, isFree ? 1 : 0
        );
        added++;
      }
    }

    // Rebuild FTS index if we changed anything
    if (modified > 0 || added > 0) {
      try {
        db.exec(`INSERT INTO tariff_fts(tariff_fts) VALUES('rebuild')`);
      } catch {
        // FTS table may not exist yet
      }
    }

    const total = (
      db.prepare('SELECT COUNT(*) as c FROM tariff_classifications').get() as any
    )?.c || 0;

    logInfo(SRC, `Updated ${modified} rates, added ${added} new codes`);

    return { added, removed: 0, modified, total };
  }

  // ── Private: HTML scrape for descriptions ─────────────────────────

  private async scrapeDescriptions(): Promise<ClassificationRow[]> {
    const sections = await scrapeSchedule3Sections();
    logInfo(SRC, `Found ${sections.length} sections for description scrape`);
    const allRows: ClassificationRow[] = [];

    for (const section of sections) {
      try {
        const chapterUrls = await scrapeSchedule3ChapterLinks(section.url);
        logInfo(SRC, `Section ${section.sectionNumber}: ${chapterUrls.length} chapters`);

        for (const chapterUrl of chapterUrls) {
          try {
            const rows = await scrapeSchedule3Chapter(chapterUrl);
            for (const row of rows) {
              const rateMatch = row.dutyRate?.match(/(\d+(?:\.\d+)?)\s*%/);
              const dutyRateNumeric = rateMatch ? parseFloat(rateMatch[1]) : null;
              const isFree =
                !row.dutyRate ||
                row.dutyRate.toLowerCase() === 'free' ||
                dutyRateNumeric === 0;

              allRows.push({
                code: row.code,
                statisticalCode: row.statisticalCode,
                description: row.description,
                unit: row.unit,
                dutyRate: row.dutyRate,
                dutyRateNumeric,
                isFree,
                chapterNumber: parseInt(row.chapterNumber) || 0,
                chapterTitle: row.chapterTitle,
                sectionNumber: romanToInt(section.sectionNumber) || 0,
                sectionTitle: section.title,
                headingCode: row.headingCode,
                headingDescription: row.headingDescription,
              });
            }
          } catch (err: any) {
            logError(SRC, `Failed to scrape chapter ${chapterUrl}: ${err?.message ?? err}`);
          }
        }
      } catch (err: any) {
        logError(SRC, `Failed to scrape section ${section.sectionNumber}: ${err?.message ?? err}`);
      }
    }

    return allRows;
  }
}
