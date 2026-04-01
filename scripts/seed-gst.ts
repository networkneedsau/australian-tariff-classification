import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// ── GST Act 1999 ────────────────────────────────────────────────────

db.exec(`
  DROP TABLE IF EXISTS gst_act;
  CREATE TABLE gst_act (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter TEXT NOT NULL,
    chapter_title TEXT NOT NULL,
    part TEXT,
    part_title TEXT,
    division TEXT NOT NULL,
    division_title TEXT NOT NULL
  );
  CREATE INDEX idx_gst_act_chapter ON gst_act(chapter);
  CREATE INDEX idx_gst_act_division ON gst_act(division);
`);

interface GstActRow {
  chapter: string; chapter_title: string;
  part?: string; part_title?: string;
  division: string; division_title: string;
}

const actRows: GstActRow[] = [
  // Chapter 1
  { chapter: 'Chapter 1', chapter_title: 'Introduction', part: 'Part 1-1', part_title: 'Preliminary', division: 'Division 1', division_title: 'Preliminary' },
  { chapter: 'Chapter 1', chapter_title: 'Introduction', part: 'Part 1-2', part_title: 'Using this Act', division: 'Division 2', division_title: 'Overview of the GST legislation' },
  { chapter: 'Chapter 1', chapter_title: 'Introduction', part: 'Part 1-2', part_title: 'Using this Act', division: 'Division 3', division_title: 'Defined terms' },
  { chapter: 'Chapter 1', chapter_title: 'Introduction', part: 'Part 1-2', part_title: 'Using this Act', division: 'Division 4', division_title: 'Status of Guides and other non-operative material' },

  // Chapter 2
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', division: 'Division 5', division_title: 'Introduction' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-1', part_title: 'The central provisions', division: 'Division 7', division_title: 'The central provisions' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-2', part_title: 'Supplies and acquisitions', division: 'Division 9', division_title: 'Taxable supplies' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-2', part_title: 'Supplies and acquisitions', division: 'Division 11', division_title: 'Creditable acquisitions' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-3', part_title: 'Importations', division: 'Division 13', division_title: 'Taxable importations' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-3', part_title: 'Importations', division: 'Division 15', division_title: 'Creditable importations' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-4', part_title: 'Net amounts and adjustments', division: 'Division 17', division_title: 'Net amounts and adjustments' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-4', part_title: 'Net amounts and adjustments', division: 'Division 19', division_title: 'Adjustment events' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-4', part_title: 'Net amounts and adjustments', division: 'Division 21', division_title: 'Bad debts' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-5', part_title: 'Registration', division: 'Division 23', division_title: 'Who is required to be registered' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-5', part_title: 'Registration', division: 'Division 25', division_title: 'Registration procedures' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-6', part_title: 'Tax periods', division: 'Division 27', division_title: 'Tax period determination' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-6', part_title: 'Tax periods', division: 'Division 29', division_title: 'Attribution to tax periods' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-7', part_title: 'Returns, payments and refunds', division: 'Division 31', division_title: 'GST returns' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-7', part_title: 'Returns, payments and refunds', division: 'Division 33', division_title: 'Payments of GST' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-7', part_title: 'Returns, payments and refunds', division: 'Division 35', division_title: 'Refunds' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-8', part_title: 'Checklist of special rules', division: 'Division 37', division_title: 'Checklist of special rules' },

  // Chapter 3
  { chapter: 'Chapter 3', chapter_title: 'The Exemptions', part: 'Part 3-1', part_title: 'Supplies that are not taxable supplies', division: 'Division 38', division_title: 'GST-free supplies' },
  { chapter: 'Chapter 3', chapter_title: 'The Exemptions', part: 'Part 3-1', part_title: 'Supplies that are not taxable supplies', division: 'Division 40', division_title: 'Input taxed supplies' },

  // Chapter 4
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', division: 'Division 45', division_title: 'Introduction to the special rules' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-1', part_title: 'Special rules mainly about particular ways entities are organised', division: 'Division 48', division_title: 'GST groups' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-1', part_title: 'Special rules mainly about particular ways entities are organised', division: 'Division 49', division_title: 'GST religious groups' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-1', part_title: 'Special rules mainly about particular ways entities are organised', division: 'Division 51', division_title: 'GST joint ventures' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-1', part_title: 'Special rules mainly about particular ways entities are organised', division: 'Division 54', division_title: 'GST branches' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-1', part_title: 'Special rules mainly about particular ways entities are organised', division: 'Division 58', division_title: 'Representatives of incapacitated entities' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-1', part_title: 'Special rules mainly about particular ways entities are organised', division: 'Division 63', division_title: 'Non-profit sub-entities' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 66', division_title: 'Second-hand goods' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 69', division_title: 'Non-deductible expenses' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 70', division_title: 'Financial supplies — reduced credit acquisitions' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 72', division_title: 'Associates' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 75', division_title: 'Sale of freehold interests etc.' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 78', division_title: 'Insurance' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 79', division_title: 'Compulsory third party schemes' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 81', division_title: 'Payments of taxes, fees and charges' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 84', division_title: 'Offshore supplies other than goods or real property' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 87', division_title: 'Long-term accommodation in commercial residential premises' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 90', division_title: 'Company amalgamations' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 93', division_title: 'Time limit on entitlements to input tax credits' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 96', division_title: 'Supplies partly connected with Australia' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 99', division_title: 'Deposits as security' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 102', division_title: 'Cancelled lay-by sales' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 105', division_title: 'Supplies in satisfaction of debts' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 108', division_title: 'Valuation of taxable supplies of goods in bond' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 111', division_title: 'Reimbursement of employees etc.' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 113', division_title: 'PAYG voluntary agreements' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-3', part_title: 'Special rules mainly about importations', division: 'Division 114', division_title: 'Importations without entry for home consumption' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-3', part_title: 'Special rules mainly about importations', division: 'Division 117', division_title: 'Goods exported for repair or renovation' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-4', part_title: 'Special rules mainly about net amounts and adjustments', division: 'Division 123', division_title: 'Excess GST' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-4', part_title: 'Special rules mainly about net amounts and adjustments', division: 'Division 126', division_title: 'Gambling supplies' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-4', part_title: 'Special rules mainly about net amounts and adjustments', division: 'Division 129', division_title: 'Changes in the extent of creditable purpose' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-4', part_title: 'Special rules mainly about net amounts and adjustments', division: 'Division 131', division_title: 'Supplies of going concerns and farmland' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-4', part_title: 'Special rules mainly about net amounts and adjustments', division: 'Division 134', division_title: 'Third party payments' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-4', part_title: 'Special rules mainly about net amounts and adjustments', division: 'Division 137', division_title: 'Stock on hand on becoming registered etc.' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-4', part_title: 'Special rules mainly about net amounts and adjustments', division: 'Division 138', division_title: 'Cessation of registration' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-4', part_title: 'Special rules mainly about net amounts and adjustments', division: 'Division 139', division_title: 'Distributions from deceased estates' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-4', part_title: 'Special rules mainly about net amounts and adjustments', division: 'Division 142', division_title: 'Excess payments etc.' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-5', part_title: 'Special rules mainly about registration', division: 'Division 144', division_title: 'Taxis and ride-sourcing' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-5', part_title: 'Special rules mainly about registration', division: 'Division 149', division_title: 'Government entities' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-6', part_title: 'Special rules mainly about tax periods', division: 'Division 151', division_title: 'Annual tax periods' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-6', part_title: 'Special rules mainly about tax periods', division: 'Division 153', division_title: 'Agents' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-6', part_title: 'Special rules mainly about tax periods', division: 'Division 156', division_title: 'Supplies and acquisitions on a progressive or periodic basis' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-6', part_title: 'Special rules mainly about tax periods', division: 'Division 157', division_title: 'Accounting basis of charities' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-6', part_title: 'Special rules mainly about tax periods', division: 'Division 158', division_title: 'Hire purchase agreements' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-6', part_title: 'Special rules mainly about tax periods', division: 'Division 159', division_title: 'Changing your accounting basis' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-7', part_title: 'Special rules mainly about returns, payments and refunds', division: 'Division 162', division_title: 'Payment of GST by instalments' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-7', part_title: 'Special rules mainly about returns, payments and refunds', division: 'Division 165', division_title: 'Anti-avoidance' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-7', part_title: 'Special rules mainly about returns, payments and refunds', division: 'Division 168', division_title: 'Tourist refund scheme' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-7', part_title: 'Special rules mainly about returns, payments and refunds', division: 'Division 171', division_title: 'Customs security etc.' },

  // Chapter 5
  { chapter: 'Chapter 5', chapter_title: 'Miscellaneous', part: 'Part 5-1', part_title: 'Miscellaneous', division: 'Division 176', division_title: 'Endorsement of charities etc.' },
  { chapter: 'Chapter 5', chapter_title: 'Miscellaneous', part: 'Part 5-1', part_title: 'Miscellaneous', division: 'Division 177', division_title: 'Miscellaneous' },

  // Chapter 6
  { chapter: 'Chapter 6', chapter_title: 'Interpreting this Act', part: 'Part 6-1', part_title: 'Rules for interpreting this Act', division: 'Division 182', division_title: 'Rules for interpreting this Act' },
  { chapter: 'Chapter 6', chapter_title: 'Interpreting this Act', part: 'Part 6-2', part_title: 'Meaning of some important concepts', division: 'Division 184', division_title: 'Meaning of entity' },
  { chapter: 'Chapter 6', chapter_title: 'Interpreting this Act', part: 'Part 6-2', part_title: 'Meaning of some important concepts', division: 'Division 188', division_title: 'Meaning of GST turnover' },
  { chapter: 'Chapter 6', chapter_title: 'Interpreting this Act', part: 'Part 6-2', part_title: 'Meaning of some important concepts', division: 'Division 189', division_title: 'Exceeding the financial acquisitions threshold' },
  { chapter: 'Chapter 6', chapter_title: 'Interpreting this Act', part: 'Part 6-2', part_title: 'Meaning of some important concepts', division: 'Division 190', division_title: '90% owned groups of companies' },
];

const insertAct = db.prepare(`
  INSERT INTO gst_act (chapter, chapter_title, part, part_title, division, division_title)
  VALUES (@chapter, @chapter_title, @part, @part_title, @division, @division_title)
`);

db.transaction(() => {
  for (const r of actRows) {
    insertAct.run({ chapter: r.chapter, chapter_title: r.chapter_title, part: r.part || null, part_title: r.part_title || null, division: r.division, division_title: r.division_title });
  }
})();

// ── GST Regulations 2019 ────────────────────────────────────────────

db.exec(`
  DROP TABLE IF EXISTS gst_regs;
  CREATE TABLE gst_regs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter TEXT NOT NULL,
    chapter_title TEXT NOT NULL,
    part TEXT,
    part_title TEXT,
    division TEXT NOT NULL,
    division_title TEXT NOT NULL,
    subdivision TEXT
  );
  CREATE INDEX idx_gst_regs_chapter ON gst_regs(chapter);
  CREATE INDEX idx_gst_regs_division ON gst_regs(division);
`);

interface GstRegRow {
  chapter: string; chapter_title: string;
  part?: string; part_title?: string;
  division: string; division_title: string;
  subdivision?: string;
}

const regRows: GstRegRow[] = [
  // Chapter 1
  { chapter: 'Chapter 1', chapter_title: 'Introduction', part: 'Part 1', part_title: 'Preliminary', division: 'Regulation 1', division_title: 'Name' },
  { chapter: 'Chapter 1', chapter_title: 'Introduction', part: 'Part 1', part_title: 'Preliminary', division: 'Regulation 2', division_title: 'Commencement' },
  { chapter: 'Chapter 1', chapter_title: 'Introduction', part: 'Part 1', part_title: 'Preliminary', division: 'Regulation 3', division_title: 'Authority' },
  { chapter: 'Chapter 1', chapter_title: 'Introduction', part: 'Part 1', part_title: 'Preliminary', division: 'Regulation 4', division_title: 'Definitions' },

  // Chapter 2
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-2', part_title: 'Supplies and acquisitions', division: 'Division 9', division_title: 'Taxable supplies', subdivision: 'Subdivision 9-A — Meaning of supply' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-3', part_title: 'Importations', division: 'Division 13', division_title: 'Taxable importations' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-3', part_title: 'Importations', division: 'Division 15', division_title: 'Creditable importations' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-5', part_title: 'Registration', division: 'Division 23', division_title: 'Who is required to be registered and who may be registered' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-6', part_title: 'Tax periods', division: 'Division 27', division_title: 'Tax period determination' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-6', part_title: 'Tax periods', division: 'Division 29', division_title: 'Attribution to tax periods', subdivision: 'Subdivision 29-C — Tax invoices and adjustment notes' },
  { chapter: 'Chapter 2', chapter_title: 'The Basic Rules', part: 'Part 2-7', part_title: 'Returns, payments and refunds', division: 'Division 33', division_title: 'Payments of GST' },

  // Chapter 3
  { chapter: 'Chapter 3', chapter_title: 'The Exemptions', part: 'Part 3-1', part_title: 'Supplies that are not taxable supplies', division: 'Division 38', division_title: 'GST-free supplies', subdivision: 'Subdivision 38-A — Food' },
  { chapter: 'Chapter 3', chapter_title: 'The Exemptions', part: 'Part 3-1', part_title: 'Supplies that are not taxable supplies', division: 'Division 38', division_title: 'GST-free supplies — Health', subdivision: 'Subdivision 38-B — Health' },
  { chapter: 'Chapter 3', chapter_title: 'The Exemptions', part: 'Part 3-1', part_title: 'Supplies that are not taxable supplies', division: 'Division 38', division_title: 'GST-free supplies — Exports', subdivision: 'Subdivision 38-E — Exports and similar' },
  { chapter: 'Chapter 3', chapter_title: 'The Exemptions', part: 'Part 3-1', part_title: 'Supplies that are not taxable supplies', division: 'Division 40', division_title: 'Input taxed supplies', subdivision: 'Subdivision 40-A — Financial supplies' },

  // Chapter 4
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-1', part_title: 'Special rules mainly about particular ways entities are organised', division: 'Division 48', division_title: 'GST groups' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-1', part_title: 'Special rules mainly about particular ways entities are organised', division: 'Division 51', division_title: 'GST joint ventures' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 70', division_title: 'Financial supplies — reduced credit acquisitions' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 78', division_title: 'Insurance' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 79', division_title: 'Compulsory third party schemes' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-2', part_title: 'Special rules mainly about supplies and acquisitions', division: 'Division 81', division_title: 'Payments of taxes, fees and charges' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-3', part_title: 'Special rules mainly about importations', division: 'Division 114', division_title: 'Importations without entry for home consumption' },
  { chapter: 'Chapter 4', chapter_title: 'The Special Rules', part: 'Part 4-7', part_title: 'Special rules mainly about returns, payments and refunds', division: 'Division 168', division_title: 'Tourist refund scheme' },
];

const insertReg = db.prepare(`
  INSERT INTO gst_regs (chapter, chapter_title, part, part_title, division, division_title, subdivision)
  VALUES (@chapter, @chapter_title, @part, @part_title, @division, @division_title, @subdivision)
`);

db.transaction(() => {
  for (const r of regRows) {
    insertReg.run({ chapter: r.chapter, chapter_title: r.chapter_title, part: r.part || null, part_title: r.part_title || null, division: r.division, division_title: r.division_title, subdivision: r.subdivision || null });
  }
})();

// FTS indexes
db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS gst_act_fts USING fts5(
    chapter, chapter_title, part, part_title, division, division_title,
    content='gst_act', content_rowid='id'
  );
  INSERT INTO gst_act_fts(gst_act_fts) VALUES('rebuild');

  CREATE VIRTUAL TABLE IF NOT EXISTS gst_regs_fts USING fts5(
    chapter, chapter_title, part, part_title, division, division_title, subdivision,
    content='gst_regs', content_rowid='id'
  );
  INSERT INTO gst_regs_fts(gst_regs_fts) VALUES('rebuild');
`);

const actCount = (db.prepare('SELECT COUNT(*) as cnt FROM gst_act').get() as { cnt: number }).cnt;
const regCount = (db.prepare('SELECT COUNT(*) as cnt FROM gst_regs').get() as { cnt: number }).cnt;
console.log(`Seeded ${actCount} GST Act divisions and ${regCount} GST Regulations divisions`);
db.close();
