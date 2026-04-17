import crypto from 'crypto';
import type Database from 'better-sqlite3';
import { getDb } from '@/lib/db';
import { logInfo, logError, logWarn } from './update-logger';

export interface ApplyResult {
  added: number;
  removed: number;
  modified: number;
  total: number;
}

/**
 * Abstract base class for all tariff data updaters.
 *
 * Subclasses must implement:
 *   - sourceId, sourceName, defaultCron, targetTables
 *   - fetch()   — retrieve raw data from the remote source
 *   - apply()   — write the fetched data into the database
 */
export abstract class BaseUpdater {
  /** Unique identifier stored in update_status.source_id */
  abstract readonly sourceId: string;
  /** Human-readable name */
  abstract readonly sourceName: string;
  /** Default cron expression (5-field) */
  abstract readonly defaultCron: string;
  /** Database tables this updater writes to */
  abstract readonly targetTables: string[];

  /**
   * Fetch data from the remote source.
   * Return whatever shape the concrete apply() expects.
   */
  abstract fetch(): Promise<any>;

  /**
   * Apply fetched data to the database inside an existing transaction.
   * The caller manages BEGIN / COMMIT / ROLLBACK.
   */
  abstract apply(db: Database.Database, data: any): ApplyResult;

  // ---------- helpers ----------

  /** SHA-256 hex digest of the canonical JSON representation of `data`. */
  computeHash(data: any): string {
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
  }

  /**
   * Ensure this source has a row in update_status.
   * Uses INSERT OR IGNORE so it is safe to call repeatedly.
   */
  ensureRegistered(): void {
    const db = getDb();
    db.prepare(
      `INSERT OR IGNORE INTO update_status
         (source_id, source_name, schedule_cron, last_status)
       VALUES (?, ?, ?, 'never_run')`
    ).run(this.sourceId, this.sourceName, this.defaultCron);
  }

  // ---------- main lifecycle ----------

  /**
   * Run the full update lifecycle.
   *
   * @param force  If true, skip the hash-based "nothing changed" check.
   */
  async run(force = false): Promise<void> {
    const db = getDb();
    this.ensureRegistered();

    // 1. Check if already running
    const status = db
      .prepare('SELECT last_status FROM update_status WHERE source_id = ?')
      .get(this.sourceId) as { last_status: string } | undefined;

    if (status?.last_status === 'running') {
      logWarn(this.sourceId, 'Update already running — skipping');
      return;
    }

    // 2. Mark as running
    const startedAt = new Date().toISOString();
    db.prepare(
      `UPDATE update_status
         SET last_status = 'running', last_checked_at = ?
       WHERE source_id = ?`
    ).run(startedAt, this.sourceId);

    // 3. Log start
    const logStmt = db.prepare(
      `INSERT INTO update_log (source_id, started_at, status)
       VALUES (?, ?, 'running')`
    );
    const logResult = logStmt.run(this.sourceId, startedAt);
    const logId = logResult.lastInsertRowid;

    logInfo(this.sourceId, 'Update started');

    let data: any;

    // 4. Fetch
    try {
      data = await this.fetch();
    } catch (err: any) {
      const errMsg = err?.message ?? String(err);
      logError(this.sourceId, `Fetch failed: ${errMsg}`);
      this.recordFailure(db, logId, startedAt, errMsg);
      return;
    }

    // 5. Hash check (unless forced)
    if (!force) {
      const newHash = this.computeHash(data);
      const row = db
        .prepare('SELECT version_hash FROM update_status WHERE source_id = ?')
        .get(this.sourceId) as { version_hash: string | null } | undefined;

      if (row?.version_hash === newHash) {
        logInfo(this.sourceId, 'Data unchanged (hash match) — skipping apply');
        const completedAt = new Date().toISOString();
        db.prepare(
          `UPDATE update_status
             SET last_status = 'skipped', last_checked_at = ?
           WHERE source_id = ?`
        ).run(completedAt, this.sourceId);
        db.prepare(
          `UPDATE update_log
             SET completed_at = ?, status = 'skipped', details = 'Hash unchanged'
           WHERE id = ?`
        ).run(completedAt, logId);
        return;
      }
    }

    // 6. Apply inside a transaction
    let result: ApplyResult;
    try {
      const txn = db.transaction(() => {
        return this.apply(db, data);
      });
      result = txn();
    } catch (err: any) {
      const errMsg = err?.message ?? String(err);
      logError(this.sourceId, `Apply failed: ${errMsg}`);
      this.recordFailure(db, logId, startedAt, errMsg);
      return;
    }

    // 7. Record success
    const completedAt = new Date().toISOString();
    const newHash = this.computeHash(data);

    db.prepare(
      `UPDATE update_status
         SET last_status    = 'success',
             last_updated_at = ?,
             last_checked_at = ?,
             record_count    = ?,
             records_added   = ?,
             records_removed = ?,
             version_hash    = ?,
             last_error      = NULL
       WHERE source_id = ?`
    ).run(
      completedAt,
      completedAt,
      result.total,
      result.added,
      result.removed,
      newHash,
      this.sourceId
    );

    db.prepare(
      `UPDATE update_log
         SET completed_at     = ?,
             status           = 'success',
             records_after    = ?,
             records_added    = ?,
             records_removed  = ?,
             records_modified = ?
       WHERE id = ?`
    ).run(completedAt, result.total, result.added, result.removed, result.modified, logId);

    // Insert change alert if there were meaningful changes
    if (result.added > 0 || result.removed > 0) {
      try {
        db.prepare(
          `INSERT INTO change_alerts (source_id, change_type, summary, details)
           VALUES (?, ?, ?, ?)`
        ).run(
          this.sourceId,
          'data_update',
          `${this.sourceName}: ${result.added} added, ${result.removed} removed, ${result.modified} modified`,
          JSON.stringify(result)
        );
      } catch {
        // Non-fatal: don't fail the update if alert insert fails
        logWarn(this.sourceId, 'Failed to insert change alert');
      }
    }

    logInfo(
      this.sourceId,
      `Update complete — added: ${result.added}, removed: ${result.removed}, modified: ${result.modified}, total: ${result.total}`
    );
  }

  // ---------- internal ----------

  private recordFailure(
    db: Database.Database,
    logId: number | bigint,
    startedAt: string,
    errorMessage: string
  ): void {
    const completedAt = new Date().toISOString();
    db.prepare(
      `UPDATE update_status
         SET last_status = 'error', last_error = ?, last_checked_at = ?
       WHERE source_id = ?`
    ).run(errorMessage, completedAt, this.sourceId);
    db.prepare(
      `UPDATE update_log
         SET completed_at = ?, status = 'error', error_message = ?
       WHERE id = ?`
    ).run(completedAt, errorMessage, logId);
  }
}
