import * as cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { getDb } from '@/lib/db';
import { getUpdater } from './update-registry';
import { logInfo, logError, logWarn } from './update-logger';

const SRC = 'scheduler';

/** Map of sourceId -> active cron task */
const jobs = new Map<string, ScheduledTask>();

/**
 * Initialise the scheduler: read all update_status rows and create a cron job
 * for every source that has schedule_enabled = 1 and a valid schedule_cron.
 */
export function initScheduler(): void {
  logInfo(SRC, 'Initialising update scheduler...');

  const db = getDb();
  const rows = db
    .prepare(
      'SELECT source_id, schedule_cron, schedule_enabled FROM update_status'
    )
    .all() as Array<{
    source_id: string;
    schedule_cron: string | null;
    schedule_enabled: number;
  }>;

  let count = 0;
  for (const row of rows) {
    if (row.schedule_enabled === 1 && row.schedule_cron) {
      scheduleJob(row.source_id, row.schedule_cron);
      count++;
    }
  }

  logInfo(SRC, `Scheduler initialised: ${count} jobs created from ${rows.length} sources`);
}

/**
 * Update (or remove) the cron schedule for a specific source.
 * Cancels any existing job, then creates a new one if enabled and cron is valid.
 */
export function updateSchedule(
  sourceId: string,
  cronExpression?: string,
  enabled?: boolean
): void {
  // Cancel existing job if any
  const existing = jobs.get(sourceId);
  if (existing) {
    existing.stop();
    jobs.delete(sourceId);
    logInfo(SRC, `Cancelled existing job for ${sourceId}`);
  }

  // Create new job if enabled and cron expression is provided
  if (enabled && cronExpression) {
    scheduleJob(sourceId, cronExpression);
  }
}

/**
 * Create and register a cron job for the given source.
 */
function scheduleJob(sourceId: string, cronExpression: string): void {
  if (!cron.validate(cronExpression)) {
    logWarn(SRC, `Invalid cron expression for ${sourceId}: "${cronExpression}" -- skipping`);
    return;
  }

  const task = cron.schedule(cronExpression, () => {
    logInfo(SRC, `Cron fired for ${sourceId} (schedule: ${cronExpression})`);

    const updater = getUpdater(sourceId);
    if (!updater) {
      logError(SRC, `No updater found for source ${sourceId}`);
      return;
    }

    updater.run(false).catch((err) => {
      logError(SRC, `Scheduled run of ${sourceId} failed: ${err?.message ?? err}`);
    });
  });

  jobs.set(sourceId, task);
  logInfo(SRC, `Scheduled ${sourceId} with cron "${cronExpression}"`);
}
