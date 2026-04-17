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

    -- Users and sessions
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login_at TEXT
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

    -- Audit trail
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      tariff_code TEXT,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

    -- Exchange rates
    CREATE TABLE IF NOT EXISTS exchange_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      currency_code TEXT NOT NULL,
      currency_name TEXT NOT NULL,
      rate_to_aud REAL NOT NULL,
      effective_date TEXT NOT NULL,
      period_start TEXT,
      period_end TEXT,
      source TEXT DEFAULT 'ABF',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_exchange_rate_unique ON exchange_rates(currency_code, effective_date);
    CREATE INDEX IF NOT EXISTS idx_exchange_rate_code ON exchange_rates(currency_code);

    -- Prohibited goods mapping
    CREATE TABLE IF NOT EXISTS prohibited_goods_map (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tariff_code_start TEXT NOT NULL,
      tariff_code_end TEXT,
      regulation_type TEXT NOT NULL,
      regulation_ref TEXT NOT NULL,
      description TEXT,
      severity TEXT DEFAULT 'prohibited',
      permit_required TEXT,
      notes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_prohibited_tariff ON prohibited_goods_map(tariff_code_start);

    -- Permit requirements
    CREATE TABLE IF NOT EXISTS permit_requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tariff_code_start TEXT NOT NULL,
      tariff_code_end TEXT,
      agency TEXT NOT NULL,
      permit_type TEXT NOT NULL,
      description TEXT,
      link_url TEXT,
      notes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_permit_tariff ON permit_requirements(tariff_code_start);

    -- Change alerts
    CREATE TABLE IF NOT EXISTS change_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source_id TEXT NOT NULL,
      change_type TEXT NOT NULL,
      tariff_code TEXT,
      summary TEXT NOT NULL,
      details TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_alert_unread ON change_alerts(is_read, created_at);
    CREATE INDEX IF NOT EXISTS idx_alert_source ON change_alerts(source_id);

    -- Rules of origin
    CREATE TABLE IF NOT EXISTS roo_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fta_schedule TEXT NOT NULL,
      fta_name TEXT NOT NULL,
      chapter_start INTEGER,
      chapter_end INTEGER,
      hs_code_start TEXT,
      hs_code_end TEXT,
      rule_type TEXT NOT NULL,
      rule_description TEXT NOT NULL,
      rvc_threshold REAL,
      ctc_level TEXT,
      specific_requirements TEXT,
      notes TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_roo_fta ON roo_rules(fta_schedule);
    CREATE INDEX IF NOT EXISTS idx_roo_hs ON roo_rules(hs_code_start);

    -- International HS code descriptions (from GitHub/UN Comtrade)
    CREATE TABLE IF NOT EXISTS hs_descriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section TEXT,
      hs_code TEXT NOT NULL,
      hs_code_formatted TEXT,
      description TEXT NOT NULL,
      parent_code TEXT,
      level INTEGER NOT NULL DEFAULT 6,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_hs_desc_code ON hs_descriptions(hs_code);
    CREATE INDEX IF NOT EXISTS idx_hs_desc_level ON hs_descriptions(level);

    -- Preference schemes (FTA / trade agreements)
    CREATE TABLE IF NOT EXISTS preference_schemes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scheme_code TEXT NOT NULL UNIQUE,
      scheme_name TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      source TEXT DEFAULT 'ABF-PRSPSNAP',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_pref_scheme_code ON preference_schemes(scheme_code);

    -- ABF permit requirements (from PRMTRQMT reference file)
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

    -- Tariff concordance HS2017 <-> HS2022 (from TRFCCONC reference file)
    CREATE TABLE IF NOT EXISTS tariff_concordance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      new_code TEXT NOT NULL,
      old_code TEXT NOT NULL,
      new_code_formatted TEXT,
      old_code_formatted TEXT,
      created_at TEXT,
      source TEXT DEFAULT 'TRFCCONC'
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_concordance_pair ON tariff_concordance(new_code, old_code);
    CREATE INDEX IF NOT EXISTS idx_concordance_new ON tariff_concordance(new_code);
    CREATE INDEX IF NOT EXISTS idx_concordance_old ON tariff_concordance(old_code);
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
