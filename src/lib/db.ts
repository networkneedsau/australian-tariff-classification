import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  const dbPath = path.join(process.cwd(), 'tariff.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Auto-initialize update tracking tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS update_status (
      source_id TEXT PRIMARY KEY,
      source_name TEXT NOT NULL,
      last_checked_at TEXT,
      last_updated_at TEXT,
      last_status TEXT NOT NULL DEFAULT 'never_run',
      last_error TEXT,
      record_count INTEGER DEFAULT 0,
      records_added INTEGER DEFAULT 0,
      records_removed INTEGER DEFAULT 0,
      schedule_cron TEXT,
      schedule_enabled INTEGER DEFAULT 1,
      version_hash TEXT
    );
    CREATE TABLE IF NOT EXISTS update_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      completed_at TEXT,
      status TEXT NOT NULL,
      records_before INTEGER,
      records_after INTEGER,
      records_added INTEGER DEFAULT 0,
      records_removed INTEGER DEFAULT 0,
      records_modified INTEGER DEFAULT 0,
      error_message TEXT,
      details TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_update_log_source ON update_log(source_id);
    CREATE INDEX IF NOT EXISTS idx_update_log_started ON update_log(started_at);

    -- TCO to tariff bidirectional linking
    CREATE TABLE IF NOT EXISTS tco_tariff_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tco_number TEXT NOT NULL,
      tariff_code TEXT NOT NULL,
      tariff_description TEXT,
      linked_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_tco_link_unique ON tco_tariff_links(tco_number, tariff_code);
    CREATE INDEX IF NOT EXISTS idx_tco_link_tco ON tco_tariff_links(tco_number);
    CREATE INDEX IF NOT EXISTS idx_tco_link_tariff ON tco_tariff_links(tariff_code);
  `);

  // Auto-populate tco_tariff_links from existing tco_references in tariff_classifications
  const linkCount = (db.prepare('SELECT COUNT(*) as c FROM tco_tariff_links').get() as any)?.c || 0;
  if (linkCount === 0) {
    try {
      const rows = db.prepare(`
        SELECT code, description, tco_references FROM tariff_classifications
        WHERE tco_references IS NOT NULL AND tco_references != '[]'
      `).all() as any[];
      const insert = db.prepare(
        'INSERT OR IGNORE INTO tco_tariff_links (tco_number, tariff_code, tariff_description) VALUES (?, ?, ?)'
      );
      const tx = db.transaction(() => {
        for (const row of rows) {
          try {
            const refs: string[] = JSON.parse(row.tco_references);
            for (const tco of refs) {
              if (tco && tco.length > 1) insert.run(tco.trim(), row.code, row.description);
            }
          } catch { /* skip malformed */ }
        }
      });
      tx();
    } catch { /* table may not exist yet */ }
  }

  return db;
}

export interface TariffClassification {
  id: number;
  section_number: number;
  section_title: string;
  chapter_number: number;
  chapter_title: string;
  heading_code: string;
  heading_description: string;
  code: string;
  statistical_code: string | null;
  description: string;
  unit: string | null;
  duty_rate: string | null;
  duty_rate_numeric: number | null;
  is_free: boolean;
  tco_references: string | null;
}

export interface TariffCountry {
  id: number;
  country: string;
  abbreviation: string;
  schedule: string;
  category: string;
}

export interface FtaExclusion {
  id: number;
  schedule: string;
  fta_name: string;
  hs_code: string;
  description: string;
  duty_rate: string | null;
}
