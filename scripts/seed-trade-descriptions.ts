import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// ── Commerce (Trade Descriptions) Act 1905 ──────────────────────────

db.exec(`
  DROP TABLE IF EXISTS trade_desc_act;
  CREATE TABLE trade_desc_act (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part TEXT NOT NULL,
    part_title TEXT NOT NULL,
    section_number TEXT NOT NULL,
    section_title TEXT NOT NULL,
    content TEXT DEFAULT ''
  );
  CREATE INDEX idx_td_act_part ON trade_desc_act(part);
`);

interface TdActRow { part: string; part_title: string; section_number: string; section_title: string; }

const actRows: TdActRow[] = [
  { part: 'Part I', part_title: 'Preliminary', section_number: '1', section_title: 'Short title and commencement' },
  { part: 'Part I', part_title: 'Preliminary', section_number: '1A', section_title: 'General administration of Act in relation to imports' },
  { part: 'Part I', part_title: 'Preliminary', section_number: '2', section_title: 'Incorporation' },
  { part: 'Part I', part_title: 'Preliminary', section_number: '3', section_title: 'Interpretation' },
  { part: 'Part I', part_title: 'Preliminary', section_number: '4', section_title: 'Application of trade description' },
  { part: 'Part II', part_title: 'Inspection of imports and exports', section_number: '5', section_title: 'Inspection of imports and exports' },
  { part: 'Part II', part_title: 'Inspection of imports and exports', section_number: '6', section_title: 'Notice of intention to export' },
  { part: 'Part III', part_title: 'Imports', section_number: '7', section_title: 'Prohibition of imports not bearing prescribed trade description' },
  { part: 'Part III', part_title: 'Imports', section_number: '8', section_title: 'Imported goods found in Australia without prescribed trade description' },
  { part: 'Part III', part_title: 'Imports', section_number: '9', section_title: 'Importation of falsely marked goods' },
  { part: 'Part III', part_title: 'Imports', section_number: '9A', section_title: 'Imported goods found in Australia with false trade description' },
  { part: 'Part III', part_title: 'Imports', section_number: '10', section_title: 'Forfeiture of falsely marked goods' },
  { part: 'Part III', part_title: 'Imports', section_number: '10AA', section_title: 'Country of origin representations do not contravene certain provisions' },
  { part: 'Part IV', part_title: 'Exports', section_number: '10A', section_title: 'Application of Part' },
  { part: 'Part IV', part_title: 'Exports', section_number: '11', section_title: 'Prohibition of exports not bearing the prescribed trade description' },
  { part: 'Part IV', part_title: 'Exports', section_number: '12', section_title: 'Penalty for applying false trade description to exports' },
  { part: 'Part IV', part_title: 'Exports', section_number: '13', section_title: 'Exportation of falsely marked goods' },
  { part: 'Part IV', part_title: 'Exports', section_number: '14', section_title: 'Marking of goods for export' },
  { part: 'Part V', part_title: 'Miscellaneous', section_number: '15', section_title: 'Review of decisions' },
  { part: 'Part V', part_title: 'Miscellaneous', section_number: '16', section_title: 'Trade description disclosing trade secrets' },
  { part: 'Part V', part_title: 'Miscellaneous', section_number: '17', section_title: 'Regulations' },
];

const insertAct = db.prepare(`INSERT INTO trade_desc_act (part, part_title, section_number, section_title) VALUES (@part, @part_title, @section_number, @section_title)`);
db.transaction(() => { for (const r of actRows) insertAct.run(r); })();

// ── Commerce (Trade Descriptions) Regulations 2016 ──────────────────

db.exec(`
  DROP TABLE IF EXISTS trade_desc_regs;
  CREATE TABLE trade_desc_regs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part TEXT NOT NULL,
    part_title TEXT NOT NULL,
    division TEXT,
    division_title TEXT,
    subdivision TEXT,
    regulation_number TEXT NOT NULL,
    regulation_title TEXT NOT NULL,
    content TEXT DEFAULT ''
  );
  CREATE INDEX idx_td_regs_part ON trade_desc_regs(part);
`);

interface TdRegRow { part: string; part_title: string; division?: string; division_title?: string; subdivision?: string; regulation_number: string; regulation_title: string; }

const regRows: TdRegRow[] = [
  // Part 1
  { part: 'Part 1', part_title: 'Preliminary', regulation_number: '1', regulation_title: 'Name' },
  { part: 'Part 1', part_title: 'Preliminary', regulation_number: '3', regulation_title: 'Authority' },
  { part: 'Part 1', part_title: 'Preliminary', regulation_number: '5', regulation_title: 'Definitions' },
  { part: 'Part 1', part_title: 'Preliminary', regulation_number: '6', regulation_title: 'Interpretation — weights, measures, packages of goods and bundles of articles' },
  { part: 'Part 1', part_title: 'Preliminary', regulation_number: '7', regulation_title: 'This instrument does not apply to ship\'s stores or aircraft\'s stores' },

  // Part 2 — Division 1
  { part: 'Part 2', part_title: 'Trade descriptions of goods imported', division: 'Division 1', division_title: 'Prohibition of imports without trade descriptions', subdivision: 'Subdivision A — Prohibition', regulation_number: '8', regulation_title: 'Prohibition of certain imports unless trade description applied' },
  { part: 'Part 2', part_title: 'Trade descriptions of goods imported', division: 'Division 1', division_title: 'Prohibition of imports without trade descriptions', subdivision: 'Subdivision A — Prohibition', regulation_number: '8A', regulation_title: 'Strict liability offence' },
  { part: 'Part 2', part_title: 'Trade descriptions of goods imported', division: 'Division 1', division_title: 'Prohibition of imports without trade descriptions', subdivision: 'Subdivision B — Goods whose import without trade description is prohibited', regulation_number: '9', regulation_title: 'General goods' },
  { part: 'Part 2', part_title: 'Trade descriptions of goods imported', division: 'Division 1', division_title: 'Prohibition of imports without trade descriptions', subdivision: 'Subdivision B — Goods whose import without trade description is prohibited', regulation_number: '10', regulation_title: 'Goods at least half clad in certain materials' },
  { part: 'Part 2', part_title: 'Trade descriptions of goods imported', division: 'Division 1', division_title: 'Prohibition of imports without trade descriptions', subdivision: 'Subdivision C — Goods whose import without trade description is not prohibited', regulation_number: '11', regulation_title: 'Goods that may be imported without trade description applied' },
  { part: 'Part 2', part_title: 'Trade descriptions of goods imported', division: 'Division 1', division_title: 'Prohibition of imports without trade descriptions', subdivision: 'Subdivision C — Goods whose import without trade description is not prohibited', regulation_number: '12', regulation_title: 'Packages of goods that may be imported without trade description applied' },

  // Part 2 — Division 2
  { part: 'Part 2', part_title: 'Trade descriptions of goods imported', division: 'Division 2', division_title: 'Trade description', regulation_number: '15', regulation_title: 'Trade description of goods to except them from prohibition on import' },
  { part: 'Part 2', part_title: 'Trade descriptions of goods imported', division: 'Division 2', division_title: 'Trade description', regulation_number: '16', regulation_title: 'Content of trade description — source country' },
  { part: 'Part 2', part_title: 'Trade descriptions of goods imported', division: 'Division 2', division_title: 'Trade description', regulation_number: '17', regulation_title: 'Content of trade description — true description of goods' },
  { part: 'Part 2', part_title: 'Trade descriptions of goods imported', division: 'Division 2', division_title: 'Trade description', regulation_number: '18', regulation_title: 'English language trade description' },
  { part: 'Part 2', part_title: 'Trade descriptions of goods imported', division: 'Division 2', division_title: 'Trade description', regulation_number: '19', regulation_title: 'Manner of applying trade description' },
  { part: 'Part 2', part_title: 'Trade descriptions of goods imported', division: 'Division 2', division_title: 'Trade description', regulation_number: '20', regulation_title: 'Extra rules about trade description of shoes' },

  // Part 3
  { part: 'Part 3', part_title: 'Inspection and analysis', regulation_number: '21', regulation_title: 'Goods that may be inspected, examined and sampled by officers' },
  { part: 'Part 3', part_title: 'Inspection and analysis', regulation_number: '22', regulation_title: 'Appointment of analysts' },
  { part: 'Part 3', part_title: 'Inspection and analysis', regulation_number: '23', regulation_title: 'Analysis and examination of samples of examinable goods' },

  // Part 4
  { part: 'Part 4', part_title: 'Transitional matters', regulation_number: '24', regulation_title: 'Commerce (Imports) Regulations 1940 — transition' },
];

const insertReg = db.prepare(`INSERT INTO trade_desc_regs (part, part_title, division, division_title, subdivision, regulation_number, regulation_title) VALUES (@part, @part_title, @division, @division_title, @subdivision, @regulation_number, @regulation_title)`);
db.transaction(() => { for (const r of regRows) insertReg.run({ part: r.part, part_title: r.part_title, division: r.division || null, division_title: r.division_title || null, subdivision: r.subdivision || null, regulation_number: r.regulation_number, regulation_title: r.regulation_title }); })();

// FTS
db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS trade_desc_act_fts USING fts5(part, part_title, section_number, section_title, content, content='trade_desc_act', content_rowid='id');
  INSERT INTO trade_desc_act_fts(trade_desc_act_fts) VALUES('rebuild');
  CREATE VIRTUAL TABLE IF NOT EXISTS trade_desc_regs_fts USING fts5(part, part_title, division, division_title, subdivision, regulation_number, regulation_title, content, content='trade_desc_regs', content_rowid='id');
  INSERT INTO trade_desc_regs_fts(trade_desc_regs_fts) VALUES('rebuild');
`);

const ac = (db.prepare('SELECT COUNT(*) as cnt FROM trade_desc_act').get() as { cnt: number }).cnt;
const rc = (db.prepare('SELECT COUNT(*) as cnt FROM trade_desc_regs').get() as { cnt: number }).cnt;
console.log(`Seeded ${ac} Trade Descriptions Act sections and ${rc} Trade Descriptions Regulation entries`);
db.close();
