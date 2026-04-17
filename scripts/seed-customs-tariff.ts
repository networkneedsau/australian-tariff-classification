import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// ── Customs Tariff Act 1995 ─────────────────────────────────────────

db.exec(`
  DROP TABLE IF EXISTS customs_tariff_act;
  CREATE TABLE customs_tariff_act (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part TEXT NOT NULL,
    part_title TEXT NOT NULL,
    section_number TEXT NOT NULL,
    section_title TEXT NOT NULL,
    content TEXT
  );
  CREATE INDEX idx_cta_part ON customs_tariff_act(part);
`);

interface CTARow { part: string; part_title: string; section_number: string; section_title: string; content?: string; }

const actRows: CTARow[] = [
  // Part 1
  { part: 'Part 1', part_title: 'Preliminary', section_number: '1', section_title: 'Short title' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '2', section_title: 'Commencement' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '3', section_title: 'Definitions' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '3A', section_title: 'Act does not extend to Norfolk Island' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '4', section_title: 'Headings in Schedule 3' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '5', section_title: 'Items in Schedule 4' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '6', section_title: 'Tariff classification' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '7', section_title: 'Rules for classifying goods in Schedule 3' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '8', section_title: 'Application of Schedule 4' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '9', section_title: 'Rates of duty — ad valorem duties' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '10', section_title: 'Certain words etc. are rates of duty' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '11', section_title: 'Rates of duty — phasing rates' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '12', section_title: 'Classes of countries and places for special rates' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13', section_title: 'When goods are the produce or manufacture of a particular country' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13A', section_title: 'Singaporean originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13B', section_title: 'US originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13C', section_title: 'Thai originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13D', section_title: 'New Zealand originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13E', section_title: 'Chilean originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13EA', section_title: 'Peruvian originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13F', section_title: 'ASEAN-Australia-New Zealand originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13G', section_title: 'Malaysian originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13H', section_title: 'Korean originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13I', section_title: 'Japanese originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13J', section_title: 'Chinese originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13K', section_title: 'Pacific Islands originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13L', section_title: 'TPP originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13LA', section_title: 'Indonesian originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13LB', section_title: 'Hong Kong originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13LC', section_title: 'RCEP originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13M', section_title: 'UK originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13N', section_title: 'UAE originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '13NA', section_title: 'Indian originating goods' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '14', section_title: 'Application of rates of duty in relation to countries and places' },
  // Part 2
  { part: 'Part 2', part_title: 'Duties of Customs', section_number: '15', section_title: 'Imposition of duties' },
  { part: 'Part 2', part_title: 'Duties of Customs', section_number: '16', section_title: 'Calculation of duty' },
  { part: 'Part 2', part_title: 'Duties of Customs', section_number: '16A', section_title: 'Preferential tariff suspension' },
  { part: 'Part 2', part_title: 'Duties of Customs', section_number: '16B', section_title: 'Preferential tariff suspension — cessation' },
  { part: 'Part 2', part_title: 'Duties of Customs', section_number: '17', section_title: 'Rates for goods with constituents' },
  { part: 'Part 2', part_title: 'Duties of Customs', section_number: '18', section_title: 'Calculation of concessional duty' },
  { part: 'Part 2', part_title: 'Duties of Customs', section_number: '18A', section_title: 'Temporary duty — Russia and Belarus' },
  { part: 'Part 2', part_title: 'Duties of Customs', section_number: '18B', section_title: 'Temporary duty — Ukraine support' },
  { part: 'Part 2', part_title: 'Duties of Customs', section_number: '19', section_title: 'Indexation of CPI indexed rates' },
  { part: 'Part 2', part_title: 'Duties of Customs', section_number: '19AAA', section_title: 'Fuel duty provisions' },
  { part: 'Part 2', part_title: 'Duties of Customs', section_number: '19AD', section_title: 'Liquefied gas duty changes' },
  { part: 'Part 2', part_title: 'Duties of Customs', section_number: '20', section_title: 'Duty for containers and contents' },
  // Part 3
  { part: 'Part 3', part_title: 'Miscellaneous', section_number: '20A', section_title: 'Regulations' },
  { part: 'Part 3', part_title: 'Miscellaneous', section_number: '21', section_title: 'Repeal of the Customs Tariff Act 1987' },
  { part: 'Part 3', part_title: 'Miscellaneous', section_number: '22', section_title: 'Transitional' },
  // Schedules
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 2', section_title: 'General rules for the interpretation of Schedule 3' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 3', section_title: 'Classification of goods and general and special rates of duty' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 4', section_title: 'Concessional rates of duty' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 4A', section_title: 'Singaporean originating goods rates' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 5', section_title: 'US originating goods rates' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 6', section_title: 'Thai originating goods rates' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 6A', section_title: 'Peruvian originating goods rates' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 7', section_title: 'Chilean originating goods rates' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 8', section_title: 'AANZ originating goods rates' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 8A', section_title: 'Pacific Islands originating goods rates' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 8B', section_title: 'TPP originating goods rates' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 9', section_title: 'Malaysian originating goods rates' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 9A', section_title: 'Indonesian originating goods rates' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 10', section_title: 'Korean originating goods rates' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 10A', section_title: 'Indian originating goods rates' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 11', section_title: 'Japanese originating goods rates' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 12', section_title: 'Chinese originating goods rates' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 13', section_title: 'Hong Kong originating goods rates' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 14', section_title: 'RCEP originating goods rates' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 15', section_title: 'UK originating goods rates' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 16', section_title: 'UAE originating goods rates' },
];

const insertAct = db.prepare(`INSERT INTO customs_tariff_act (part, part_title, section_number, section_title, content) VALUES (@part, @part_title, @section_number, @section_title, @content)`);
db.transaction(() => { for (const r of actRows) insertAct.run({ ...r, content: r.content || null }); })();

// ── Customs Tariff Regulations 2004 ─────────────────────────────────

db.exec(`
  DROP TABLE IF EXISTS customs_tariff_regs;
  CREATE TABLE customs_tariff_regs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part TEXT NOT NULL,
    part_title TEXT NOT NULL,
    section_number TEXT NOT NULL,
    section_title TEXT NOT NULL,
    content TEXT
  );
  CREATE INDEX idx_ctr_part ON customs_tariff_regs(part);
`);

const regRows: CTARow[] = [
  { part: 'Main', part_title: 'Regulations', section_number: '1', section_title: 'Name of Regulations' },
  { part: 'Main', part_title: 'Regulations', section_number: '3', section_title: 'Definitions' },
  { part: 'Main', part_title: 'Regulations', section_number: '4', section_title: 'Classes of countries and places for which preferential rates apply' },
  { part: 'Main', part_title: 'Regulations', section_number: '4A', section_title: 'Peruvian originating goods — prescribed goods' },
  { part: 'Main', part_title: 'Regulations', section_number: '5A', section_title: 'TPP originating goods — prescribed goods' },
  { part: 'Main', part_title: 'Regulations', section_number: '5AA', section_title: 'Indian originating goods — prescribed goods' },
  { part: 'Main', part_title: 'Regulations', section_number: '5B', section_title: 'RCEP originating goods — prescribed goods' },
  { part: 'Main', part_title: 'Regulations', section_number: '6', section_title: 'Saving provision — Customs Tariff Amendment Regulations 2017' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 1', section_title: 'Classes of countries and places for preferential rates' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 1A', section_title: 'Peruvian originating goods' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 3', section_title: 'TPP originating goods' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 3A', section_title: 'Indian originating goods' },
  { part: 'Schedules', part_title: 'Schedules', section_number: 'Schedule 4', section_title: 'RCEP originating goods' },
];

const insertReg = db.prepare(`INSERT INTO customs_tariff_regs (part, part_title, section_number, section_title, content) VALUES (@part, @part_title, @section_number, @section_title, @content)`);
db.transaction(() => { for (const r of regRows) insertReg.run({ ...r, content: r.content || null }); })();

// FTS
db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS customs_tariff_act_fts USING fts5(part, part_title, section_number, section_title, content, content='customs_tariff_act', content_rowid='id');
  INSERT INTO customs_tariff_act_fts(customs_tariff_act_fts) VALUES('rebuild');
  CREATE VIRTUAL TABLE IF NOT EXISTS customs_tariff_regs_fts USING fts5(part, part_title, section_number, section_title, content, content='customs_tariff_regs', content_rowid='id');
  INSERT INTO customs_tariff_regs_fts(customs_tariff_regs_fts) VALUES('rebuild');
`);

const ac = (db.prepare('SELECT COUNT(*) as cnt FROM customs_tariff_act').get() as { cnt: number }).cnt;
const rc = (db.prepare('SELECT COUNT(*) as cnt FROM customs_tariff_regs').get() as { cnt: number }).cnt;
console.log(`Seeded ${ac} Customs Tariff Act sections and ${rc} Customs Tariff Regulation entries`);
db.close();
