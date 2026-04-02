import { getDb } from '@/lib/db';
import type { BaseUpdater } from './base-updater';
import { logInfo, logError } from './update-logger';

// ---------------------------------------------------------------------------
// Import concrete updater classes
// ---------------------------------------------------------------------------
import { Schedule1Updater } from './updaters/schedule1-updater';
import { Schedule3Updater } from './updaters/schedule3-updater';
import { FtaSchedulesUpdater } from './updaters/fta-schedules-updater';
import { CustomsActUpdater } from './updaters/customs-act-updater';
import { CustomsTariffActUpdater } from './updaters/customs-tariff-act-updater';
import { GstActUpdater } from './updaters/gst-act-updater';
import { ProhibitedImportsUpdater } from './updaters/prohibited-imports-updater';
import { DumpingNoticesUpdater } from './updaters/dumping-notices-updater';
import { CustomsNoticesUpdater } from './updaters/customs-notices-updater';
import { ChemicalIndexUpdater } from './updaters/chemical-index-updater';
import { AheccUpdater } from './updaters/ahecc-updater';
import { BiosecurityUpdater } from './updaters/biosecurity-updater';
import { IllegalLoggingUpdater } from './updaters/illegal-logging-updater';
import { ImportedFoodUpdater } from './updaters/imported-food-updater';
import { TradeDescUpdater } from './updaters/trade-desc-updater';
import { CustomsRegsUpdater } from './updaters/customs-regs-updater';
import { AntiDumpingActUpdater } from './updaters/anti-dumping-act-updater';
import { ProhibitedExportsUpdater } from './updaters/prohibited-exports-updater';
import { ExchangeRatesUpdater } from './updaters/exchange-rates-updater';
import { InstrumentsUpdater } from './updaters/instruments-updater';
import { PreferenceSchemesUpdater } from './updaters/preference-schemes-updater';

const SRC = 'registry';

// ---------------------------------------------------------------------------
// Registry singleton
// ---------------------------------------------------------------------------

let registry: Map<string, BaseUpdater> | null = null;

/**
 * Build (or return the cached) map of sourceId -> updater instance.
 */
export function getUpdaterRegistry(): Map<string, BaseUpdater> {
  if (registry) return registry;

  registry = new Map<string, BaseUpdater>();

  // ---- register all 21 updaters ----
  const updaters: BaseUpdater[] = [
    new Schedule1Updater(),          // 1.  Countries
    new Schedule3Updater(),          // 2.  Tariff Classifications
    new FtaSchedulesUpdater(),       // 3.  FTA Exclusions
    new CustomsActUpdater(),         // 4.  Customs Act 1901
    new CustomsTariffActUpdater(),   // 5.  Customs Tariff Act 1995
    new GstActUpdater(),             // 6.  GST Act 1999
    new ProhibitedImportsUpdater(),  // 7.  Prohibited Imports Regs
    new DumpingNoticesUpdater(),     // 8.  Anti-Dumping Notices
    new CustomsNoticesUpdater(),     // 9.  Customs Notices
    new ChemicalIndexUpdater(),      // 10. Chemical Index
    new AheccUpdater(),              // 11. AHECC Export Chapters
    new BiosecurityUpdater(),        // 12. Biosecurity Act & Regs
    new IllegalLoggingUpdater(),     // 13. Illegal Logging Act & Reg
    new ImportedFoodUpdater(),       // 14. Imported Food Act & Reg
    new TradeDescUpdater(),          // 15. Trade Descriptions Act & Regs
    new CustomsRegsUpdater(),        // 16. Customs Regulations
    new AntiDumpingActUpdater(),     // 17. Anti-Dumping Act
    new ProhibitedExportsUpdater(),  // 18. Prohibited Exports Regs
    new ExchangeRatesUpdater(),      // 19. ABF Exchange Rates
    new InstrumentsUpdater(),        // 20. ABF Instruments (TCO/AD/CV)
    new PreferenceSchemesUpdater(),  // 21. ABF Preference Schemes (FTA)
  ];

  for (const u of updaters) {
    registry.set(u.sourceId, u);
  }

  // Ensure every registered updater has a row in update_status
  for (const updater of registry.values()) {
    updater.ensureRegistered();
  }

  return registry;
}

/** Return all registered updater instances. */
export function getAllUpdaters(): BaseUpdater[] {
  return [...getUpdaterRegistry().values()];
}

/** Look up a single updater by its sourceId. */
export function getUpdater(sourceId: string): BaseUpdater | undefined {
  return getUpdaterRegistry().get(sourceId);
}

// ---------------------------------------------------------------------------
// Batch operations
// ---------------------------------------------------------------------------

/**
 * Run every registered updater sequentially.
 * Errors in one updater do not prevent the others from running.
 */
export async function runAll(force = false): Promise<void> {
  const updaters = getAllUpdaters();
  logInfo(SRC, `Running all updaters (${updaters.length} registered, force=${force})`);

  for (const updater of updaters) {
    try {
      await updater.run(force);
    } catch (err: any) {
      logError(SRC, `Updater ${updater.sourceId} threw: ${err?.message ?? err}`);
    }
  }

  logInfo(SRC, 'All updaters finished');
}

// ---------------------------------------------------------------------------
// Status query
// ---------------------------------------------------------------------------

export interface SourceStatus {
  source_id: string;
  source_name: string;
  last_checked_at: string | null;
  last_updated_at: string | null;
  last_status: string;
  last_error: string | null;
  record_count: number;
  records_added: number;
  records_removed: number;
  schedule_cron: string | null;
  schedule_enabled: number;
  version_hash: string | null;
}

/** Query update_status for every registered source. */
export function getStatus(): SourceStatus[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM update_status ORDER BY source_id')
    .all() as SourceStatus[];
}
