import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// ── Imported Food Control Act 1992 ────────────────────────────────

db.exec(`
  DROP TABLE IF EXISTS imported_food_act;
  CREATE TABLE imported_food_act (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part TEXT NOT NULL,
    part_title TEXT NOT NULL,
    division TEXT,
    division_title TEXT,
    section_number TEXT NOT NULL,
    section_title TEXT NOT NULL,
    content TEXT
  );
  CREATE INDEX idx_ifc_act_part ON imported_food_act(part);
`);

interface Row { part: string; part_title: string; division?: string; division_title?: string; section_number: string; section_title: string; }

const actRows: Row[] = [
  // Part 1
  { part: 'Part 1', part_title: 'Preliminary', section_number: '1', section_title: 'Short title' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '2', section_title: 'Commencement' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '2A', section_title: 'Object of Act' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '3', section_title: 'Interpretation' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '4', section_title: 'Application of Act to certain external Territories' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '5', section_title: 'Crown to be bound' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '6', section_title: 'Saving of other laws' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '6A', section_title: 'Application of the Criminal Code' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '7', section_title: 'Food to which Act applies' },

  // Part 2 Division 1
  { part: 'Part 2', part_title: 'Control', division: 'Division 1', division_title: 'Controls on importation and movement of food', section_number: '8', section_title: 'Importation offence' },
  { part: 'Part 2', part_title: 'Control', division: 'Division 1', division_title: 'Controls on importation and movement of food', section_number: '8A', section_title: 'Labelling offence' },
  { part: 'Part 2', part_title: 'Control', division: 'Division 1', division_title: 'Controls on importation and movement of food', section_number: '9', section_title: 'Offences relating to dealing with examinable food' },
  { part: 'Part 2', part_title: 'Control', division: 'Division 1', division_title: 'Controls on importation and movement of food', section_number: '10', section_title: 'Certain provisions of the Customs Act may be expressed to be subject to this Act' },
  { part: 'Part 2', part_title: 'Control', division: 'Division 1', division_title: 'Controls on importation and movement of food', section_number: '11', section_title: 'Application for food control certificate' },
  { part: 'Part 2', part_title: 'Control', division: 'Division 1', division_title: 'Controls on importation and movement of food', section_number: '12', section_title: 'Issue of food control certificate' },
  { part: 'Part 2', part_title: 'Control', division: 'Division 1', division_title: 'Controls on importation and movement of food', section_number: '13', section_title: 'Form of food control certificate' },
  { part: 'Part 2', part_title: 'Control', division: 'Division 1', division_title: 'Controls on importation and movement of food', section_number: '14', section_title: 'Imported food inspection advice' },
  { part: 'Part 2', part_title: 'Control', division: 'Division 1', division_title: 'Controls on importation and movement of food', section_number: '15', section_title: 'Holding orders for certain food' },

  // Part 2 Division 2
  { part: 'Part 2', part_title: 'Control', division: 'Division 2', division_title: 'The Food Inspection Scheme', section_number: '16', section_title: 'Food Inspection Scheme' },
  { part: 'Part 2', part_title: 'Control', division: 'Division 2', division_title: 'The Food Inspection Scheme', section_number: '17', section_title: 'Consultation with Food Standards Australia New Zealand' },
  { part: 'Part 2', part_title: 'Control', division: 'Division 2', division_title: 'The Food Inspection Scheme', section_number: '18', section_title: 'Foreign government certificates' },
  { part: 'Part 2', part_title: 'Control', division: 'Division 2', division_title: 'The Food Inspection Scheme', section_number: '19', section_title: 'Quality assurance certificates' },
  { part: 'Part 2', part_title: 'Control', division: 'Division 2', division_title: 'The Food Inspection Scheme', section_number: '19A', section_title: 'Forging and uttering' },

  // Part 2 Division 3
  { part: 'Part 2', part_title: 'Control', division: 'Division 3', division_title: 'Treatment, destruction or re-exportation of failing food', section_number: '20', section_title: 'Treatment, destruction or re-exportation of failing food' },

  // Part 3
  { part: 'Part 3', part_title: 'Enforcement', section_number: '21', section_title: 'Monitoring powers' },
  { part: 'Part 3', part_title: 'Enforcement', section_number: '22', section_title: 'Investigation powers' },
  { part: 'Part 3', part_title: 'Enforcement', section_number: '23', section_title: 'Civil penalty provisions' },
  { part: 'Part 3', part_title: 'Enforcement', section_number: '24', section_title: 'Infringement notices' },
  { part: 'Part 3', part_title: 'Enforcement', section_number: '25', section_title: 'Enforceable undertakings' },
  { part: 'Part 3', part_title: 'Enforcement', section_number: '26', section_title: 'Injunctions' },
  { part: 'Part 3', part_title: 'Enforcement', section_number: '27', section_title: 'Forfeiture' },
  { part: 'Part 3', part_title: 'Enforcement', section_number: '28', section_title: 'Conduct of directors, employees and agents' },
  { part: 'Part 3', part_title: 'Enforcement', section_number: '29', section_title: 'Evidence of analyst' },
  { part: 'Part 3', part_title: 'Enforcement', section_number: '30', section_title: 'Publication of names of certain persons' },

  // Part 4
  { part: 'Part 4', part_title: 'Miscellaneous', section_number: '35A', section_title: 'Compliance agreements' },
  { part: 'Part 4', part_title: 'Miscellaneous', section_number: '36', section_title: 'Fees' },
  { part: 'Part 4', part_title: 'Miscellaneous', section_number: '37', section_title: 'Recovery of certain expenses' },
  { part: 'Part 4', part_title: 'Miscellaneous', section_number: '38', section_title: 'Exemption from suit' },
  { part: 'Part 4', part_title: 'Miscellaneous', section_number: '39', section_title: 'Compensation for acquisition of property' },
  { part: 'Part 4', part_title: 'Miscellaneous', section_number: '40', section_title: 'Authorised officers' },
  { part: 'Part 4', part_title: 'Miscellaneous', section_number: '41', section_title: 'Delegation' },
  { part: 'Part 4', part_title: 'Miscellaneous', section_number: '42', section_title: 'Review of decisions' },
  { part: 'Part 4', part_title: 'Miscellaneous', section_number: '43', section_title: 'Regulations' },
];

const insertAct = db.prepare(`INSERT INTO imported_food_act (part, part_title, division, division_title, section_number, section_title, content) VALUES (@part, @part_title, @division, @division_title, @section_number, @section_title, @content)`);
db.transaction(() => { for (const r of actRows) insertAct.run({ ...r, division: r.division || null, division_title: r.division_title || null, content: null }); })();

// ── Imported Food Control Regulation 2019 ─────────────────────────

db.exec(`
  DROP TABLE IF EXISTS imported_food_reg;
  CREATE TABLE imported_food_reg (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part TEXT NOT NULL,
    part_title TEXT NOT NULL,
    division TEXT,
    division_title TEXT,
    subdivision TEXT,
    regulation_number TEXT NOT NULL,
    regulation_title TEXT NOT NULL,
    content TEXT
  );
  CREATE INDEX idx_ifc_reg_part ON imported_food_reg(part);
`);

interface RegRow { part: string; part_title: string; division?: string; division_title?: string; subdivision?: string; regulation_number: string; regulation_title: string; }

const regRows: RegRow[] = [
  // Part 1
  { part: 'Part 1', part_title: 'Preliminary', regulation_number: '1', regulation_title: 'Name' },
  { part: 'Part 1', part_title: 'Preliminary', regulation_number: '3', regulation_title: 'Authority' },
  { part: 'Part 1', part_title: 'Preliminary', regulation_number: '5', regulation_title: 'Definitions' },

  // Part 2
  { part: 'Part 2', part_title: 'Food control', regulation_number: '6', regulation_title: 'Food from New Zealand to which the Act does not apply' },
  { part: 'Part 2', part_title: 'Food control', regulation_number: '7', regulation_title: 'Food imported for private consumption to which the Act does not apply' },
  { part: 'Part 2', part_title: 'Food control', regulation_number: '8', regulation_title: 'Application for food control certificate' },

  // Part 3 Division 1
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 1', division_title: 'Establishment of Food Inspection Scheme', regulation_number: '9', regulation_title: 'Establishment of Food Inspection Scheme' },
  // Part 3 Division 2
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 2', division_title: 'Ministerial Orders', regulation_number: '10', regulation_title: 'Minister may make orders' },
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 2', division_title: 'Ministerial Orders', regulation_number: '11', regulation_title: 'Risk food' },
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 2', division_title: 'Ministerial Orders', regulation_number: '12', regulation_title: 'Compliance agreement food' },
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 2', division_title: 'Ministerial Orders', regulation_number: '13', regulation_title: 'Surveillance food' },
  // Part 3 Division 3
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 3', division_title: 'Referral of Food by Officers of Customs', regulation_number: '14', regulation_title: 'Risk food' },
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 3', division_title: 'Referral of Food by Officers of Customs', regulation_number: '15', regulation_title: 'Surveillance food' },
  // Part 3 Division 4
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 4', division_title: 'Inspection and Analysis of Food', subdivision: 'Subdivision A — Risk Food', regulation_number: '16', regulation_title: 'Rates of inspection for risk food' },
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 4', division_title: 'Inspection and Analysis of Food', subdivision: 'Subdivision A — Risk Food', regulation_number: '17', regulation_title: 'Rate at which risk food is first inspected' },
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 4', division_title: 'Inspection and Analysis of Food', subdivision: 'Subdivision A — Risk Food', regulation_number: '18', regulation_title: 'When the rate of inspection for risk food may be varied' },
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 4', division_title: 'Inspection and Analysis of Food', subdivision: 'Subdivision A — Risk Food', regulation_number: '19', regulation_title: 'Holding risk food that is subject to inspection' },
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 4', division_title: 'Inspection and Analysis of Food', subdivision: 'Subdivision A — Risk Food', regulation_number: '20', regulation_title: 'Testing reliability of recognised foreign government certificate or recognised quality assurance certificate' },
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 4', division_title: 'Inspection and Analysis of Food', subdivision: 'Subdivision B — Surveillance Food', regulation_number: '21', regulation_title: 'Rates of inspection for surveillance food' },
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 4', division_title: 'Inspection and Analysis of Food', subdivision: 'Subdivision C — Food Subject to Holding Order', regulation_number: '22', regulation_title: 'Rates of inspection for food the subject of a holding order' },
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 4', division_title: 'Inspection and Analysis of Food', subdivision: 'Subdivision D — Taking Samples', regulation_number: '23', regulation_title: 'Taking samples of food' },
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 4', division_title: 'Inspection and Analysis of Food', subdivision: 'Subdivision E — Marking of Food', regulation_number: '24', regulation_title: 'Marking of food held for inspection' },
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 4', division_title: 'Inspection and Analysis of Food', subdivision: 'Subdivision F — Analysis of Food', regulation_number: '25', regulation_title: 'Analysis of food' },
  // Part 3 Division 5
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 5', division_title: 'Failing Food', regulation_number: '26', regulation_title: 'When food is failing food' },
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 5', division_title: 'Failing Food', regulation_number: '27', regulation_title: 'Dealing with failing food — lots of food' },
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 5', division_title: 'Failing Food', regulation_number: '28', regulation_title: 'Presenting failing food for inspection again' },
  // Part 3 Division 6
  { part: 'Part 3', part_title: 'Food Inspection Scheme', division: 'Division 6', division_title: 'Powers of Authorised Officers', regulation_number: '29', regulation_title: 'Powers of authorised officers' },

  // Part 4
  { part: 'Part 4', part_title: 'Chargeable services', regulation_number: '30', regulation_title: 'Payable amounts for chargeable services' },
  { part: 'Part 4', part_title: 'Chargeable services', regulation_number: '30A', regulation_title: 'Indexation of charges' },
  { part: 'Part 4', part_title: 'Chargeable services', regulation_number: '31', regulation_title: 'Reimbursement of amount paid for analysis of food' },
  { part: 'Part 4', part_title: 'Chargeable services', regulation_number: '32', regulation_title: 'Waiver of payable amounts' },
  { part: 'Part 4', part_title: 'Chargeable services', regulation_number: '33', regulation_title: 'Prescribed chargeable services' },

  // Part 5
  { part: 'Part 5', part_title: 'Transitional provisions', regulation_number: '34', regulation_title: 'Ministerial orders' },
  { part: 'Part 5', part_title: 'Transitional provisions', regulation_number: '35', regulation_title: 'Things done under the old regulations' },
];

const insertReg = db.prepare(`INSERT INTO imported_food_reg (part, part_title, division, division_title, subdivision, regulation_number, regulation_title, content) VALUES (@part, @part_title, @division, @division_title, @subdivision, @regulation_number, @regulation_title, @content)`);
db.transaction(() => { for (const r of regRows) insertReg.run({ ...r, division: r.division || null, division_title: r.division_title || null, subdivision: r.subdivision || null, content: null }); })();

// FTS
db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS imported_food_act_fts USING fts5(section_number, section_title, part, part_title, division_title, content, content='imported_food_act', content_rowid='id');
  INSERT INTO imported_food_act_fts(imported_food_act_fts) VALUES('rebuild');
  CREATE VIRTUAL TABLE IF NOT EXISTS imported_food_reg_fts USING fts5(regulation_number, regulation_title, part, part_title, division_title, content, content='imported_food_reg', content_rowid='id');
  INSERT INTO imported_food_reg_fts(imported_food_reg_fts) VALUES('rebuild');
`);

const actCount = (db.prepare('SELECT COUNT(*) as cnt FROM imported_food_act').get() as { cnt: number }).cnt;
const regCount = (db.prepare('SELECT COUNT(*) as cnt FROM imported_food_reg').get() as { cnt: number }).cnt;
console.log(`Seeded ${actCount} Act sections and ${regCount} Regulation entries for Imported Food Control`);
db.close();
