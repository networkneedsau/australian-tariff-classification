import Database from 'better-sqlite3';
import path from 'path';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  const dbPath = path.join(process.cwd(), 'tariff.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
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
