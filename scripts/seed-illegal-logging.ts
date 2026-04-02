import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// ── Illegal Logging Prohibition Act 2012 ──────────────────────────

db.exec(`
  DROP TABLE IF EXISTS illegal_logging_act;
  CREATE TABLE illegal_logging_act (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part TEXT NOT NULL,
    part_title TEXT NOT NULL,
    division TEXT,
    division_title TEXT,
    subdivision TEXT,
    section_number TEXT NOT NULL,
    section_title TEXT NOT NULL,
    content TEXT
  );
  CREATE INDEX idx_il_act_part ON illegal_logging_act(part);
`);

interface ILActRow { part: string; part_title: string; division?: string; division_title?: string; subdivision?: string; section_number: string; section_title: string; content?: string; }

const actRows: ILActRow[] = [
  // Part 1
  { part: 'Part 1', part_title: 'Preliminary', section_number: '1', section_title: 'Short title' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '2', section_title: 'Commencement' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '3', section_title: 'Crown to be bound' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '4', section_title: 'Act does not extend to external Territories' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '5', section_title: 'Concurrent operation of State and Territory laws' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '6', section_title: 'Simplified outline of this Act' },
  { part: 'Part 1', part_title: 'Preliminary', section_number: '7', section_title: 'Definitions' },

  // Part 2 — Importing
  { part: 'Part 2', part_title: 'Importing', division: 'Division 1A', division_title: 'Introduction', section_number: '7A', section_title: 'Simplified outline of this Part' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 1', division_title: 'Importing illegally logged timber', section_number: '8', section_title: 'Importing illegally logged timber' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 1', division_title: 'Importing illegally logged timber', section_number: '9', section_title: 'Importing illegally logged timber in regulated timber products' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 1', division_title: 'Importing illegally logged timber', section_number: '10', section_title: 'Forfeiture' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 1', division_title: 'Importing illegally logged timber', section_number: '11', section_title: 'Application of the Customs Act 1901' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 2', division_title: "Importers' due diligence", subdivision: 'Subdivision A — Offences and civil penalties', section_number: '12', section_title: 'Importing regulated timber products' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 2', division_title: "Importers' due diligence", subdivision: 'Subdivision A — Offences and civil penalties', section_number: '13', section_title: 'Customs declaration' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 2', division_title: "Importers' due diligence", subdivision: 'Subdivision B — Due diligence requirements', section_number: '13A', section_title: 'Due diligence requirement — due diligence system' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 2', division_title: "Importers' due diligence", subdivision: 'Subdivision B — Due diligence requirements', section_number: '14', section_title: 'Due diligence requirements — other requirements prescribed by rules' },

  // Part 3 — Processing
  { part: 'Part 3', part_title: 'Processing', division: 'Division 1A', division_title: 'Introduction', section_number: '14A', section_title: 'Simplified outline of this Part' },
  { part: 'Part 3', part_title: 'Processing', division: 'Division 1', division_title: 'Processing illegally logged raw logs', section_number: '15', section_title: 'Processing illegally logged raw logs' },
  { part: 'Part 3', part_title: 'Processing', division: 'Division 1', division_title: 'Processing illegally logged raw logs', section_number: '16', section_title: 'Forfeiture' },
  { part: 'Part 3', part_title: 'Processing', division: 'Division 2', division_title: "Processors' due diligence", subdivision: 'Subdivision A — Offences and civil penalties', section_number: '17', section_title: 'Processing raw logs' },
  { part: 'Part 3', part_title: 'Processing', division: 'Division 2', division_title: "Processors' due diligence", subdivision: 'Subdivision B — Due diligence requirements', section_number: '17A', section_title: 'Due diligence requirement — due diligence system' },
  { part: 'Part 3', part_title: 'Processing', division: 'Division 2', division_title: "Processors' due diligence", subdivision: 'Subdivision B — Due diligence requirements', section_number: '18', section_title: 'Due diligence requirements — other requirements prescribed by rules' },

  // Part 3A — Notice
  { part: 'Part 3A', part_title: 'Notice of regulated timber products / processing of raw logs', division: 'Division 1', division_title: 'Introduction', section_number: '18A', section_title: 'Simplified outline of this Part' },
  { part: 'Part 3A', part_title: 'Notice of regulated timber products / processing of raw logs', division: 'Division 2', division_title: 'Notice of regulated timber products to be unloaded', section_number: '18B', section_title: 'Notice of regulated timber products to be unloaded in Australia' },
  { part: 'Part 3A', part_title: 'Notice of regulated timber products / processing of raw logs', division: 'Division 3', division_title: 'Notice of processing of a raw log', section_number: '18C', section_title: 'Notice of the processing of a raw log into something other than a raw log' },

  // Part 3B — Information-gathering powers
  { part: 'Part 3B', part_title: 'Information-gathering powers', division: 'Division 1', division_title: 'Introduction', section_number: '18D', section_title: 'Simplified outline of this Part' },
  { part: 'Part 3B', part_title: 'Information-gathering powers', division: 'Division 2', division_title: 'Importers', section_number: '18E', section_title: 'Requirement to give information or documents to Secretary — importers' },
  { part: 'Part 3B', part_title: 'Information-gathering powers', division: 'Division 3', division_title: 'Processors', section_number: '18F', section_title: 'Requirement to give information or documents to Secretary — processors' },

  // Part 4 — Monitoring, Investigation and Enforcement
  { part: 'Part 4', part_title: 'Monitoring, Investigation and Enforcement', division: 'Division 1', division_title: 'Inspectors', section_number: '19', section_title: 'Appointment of inspectors' },
  { part: 'Part 4', part_title: 'Monitoring, Investigation and Enforcement', division: 'Division 2', division_title: 'Monitoring', section_number: '21', section_title: 'Monitoring powers' },
  { part: 'Part 4', part_title: 'Monitoring, Investigation and Enforcement', division: 'Division 3', division_title: 'Investigation', section_number: '22', section_title: 'Investigation powers' },
  { part: 'Part 4', part_title: 'Monitoring, Investigation and Enforcement', division: 'Division 4', division_title: 'Civil penalties', section_number: '23', section_title: 'Civil penalty provisions' },
  { part: 'Part 4', part_title: 'Monitoring, Investigation and Enforcement', division: 'Division 5', division_title: 'Infringement notices', section_number: '24', section_title: 'Infringement notices' },
  { part: 'Part 4', part_title: 'Monitoring, Investigation and Enforcement', division: 'Division 6', division_title: 'Enforceable undertakings', section_number: '25', section_title: 'Enforceable undertakings' },
  { part: 'Part 4', part_title: 'Monitoring, Investigation and Enforcement', division: 'Division 7', division_title: 'Injunctions', section_number: '26', section_title: 'Injunctions' },
  { part: 'Part 4', part_title: 'Monitoring, Investigation and Enforcement', division: 'Division 8', division_title: 'Regulated timber products subject to biosecurity/customs control', section_number: '27', section_title: 'Regulated timber products subject to biosecurity control or customs control' },
  { part: 'Part 4', part_title: 'Monitoring, Investigation and Enforcement', division: 'Division 9', division_title: 'Audits', section_number: '28', section_title: 'Secretary may require audits to be carried out' },
  { part: 'Part 4', part_title: 'Monitoring, Investigation and Enforcement', division: 'Division 9', division_title: 'Audits', section_number: '29', section_title: 'Who can carry out an audit?' },
  { part: 'Part 4', part_title: 'Monitoring, Investigation and Enforcement', division: 'Division 9', division_title: 'Audits', section_number: '30', section_title: 'Rules may specify requirements' },
  { part: 'Part 4', part_title: 'Monitoring, Investigation and Enforcement', division: 'Division 9', division_title: 'Audits', section_number: '31', section_title: 'Conduct of audit' },
  { part: 'Part 4', part_title: 'Monitoring, Investigation and Enforcement', division: 'Division 9', division_title: 'Audits', section_number: '32', section_title: 'Requirement to provide all reasonable facilities and assistance' },

  // Part 4A — Information management
  { part: 'Part 4A', part_title: 'Information management', section_number: '33', section_title: 'Simplified outline of this Part' },
  { part: 'Part 4A', part_title: 'Information management', section_number: '34', section_title: 'Use or disclosure for the purposes of this Act' },
  { part: 'Part 4A', part_title: 'Information management', section_number: '35', section_title: 'Use or disclosure for the purposes of other Acts' },
  { part: 'Part 4A', part_title: 'Information management', section_number: '36', section_title: 'Disclosure to foreign governments etc. for export, trade and other purposes' },
  { part: 'Part 4A', part_title: 'Information management', section_number: '37', section_title: 'Disclosure to a Commonwealth entity' },
  { part: 'Part 4A', part_title: 'Information management', section_number: '38', section_title: 'Disclosure to State or Territory body' },
  { part: 'Part 4A', part_title: 'Information management', section_number: '39', section_title: 'Disclosure for the purposes of law enforcement' },
  { part: 'Part 4A', part_title: 'Information management', section_number: '40', section_title: 'Disclosure to a court, tribunal etc.' },
  { part: 'Part 4A', part_title: 'Information management', section_number: '41', section_title: 'Use or disclosure for research, policy development or data analysis' },
  { part: 'Part 4A', part_title: 'Information management', section_number: '42', section_title: 'Use or disclosure of statistics' },
  { part: 'Part 4A', part_title: 'Information management', section_number: '43', section_title: 'Use or disclosure of publicly available information' },
  { part: 'Part 4A', part_title: 'Information management', section_number: '44', section_title: 'Disclosure to person to whom information relates' },
  { part: 'Part 4A', part_title: 'Information management', section_number: '45', section_title: 'Use or disclosure with consent' },
  { part: 'Part 4A', part_title: 'Information management', section_number: '46', section_title: 'Disclosure to person who provided information' },
  { part: 'Part 4A', part_title: 'Information management', section_number: '47', section_title: 'Use or disclosure to manage severe and immediate threats' },
  { part: 'Part 4A', part_title: 'Information management', section_number: '48', section_title: 'Use or disclosure authorised by rules' },

  // Part 5 — Miscellaneous
  { part: 'Part 5', part_title: 'Miscellaneous', section_number: '81', section_title: 'Simplified outline of this Part' },
  { part: 'Part 5', part_title: 'Miscellaneous', section_number: '82', section_title: 'Privilege against self-incrimination etc.' },
  { part: 'Part 5', part_title: 'Miscellaneous', section_number: '83', section_title: 'Publishing reports' },
  { part: 'Part 5', part_title: 'Miscellaneous', section_number: '83A', section_title: 'Review of the operation of this Act' },
  { part: 'Part 5', part_title: 'Miscellaneous', section_number: '84', section_title: 'Civil penalty provisions for false or misleading information or documents' },
  { part: 'Part 5', part_title: 'Miscellaneous', section_number: '84A', section_title: 'Publishing details of contraventions of this Act' },
  { part: 'Part 5', part_title: 'Miscellaneous', section_number: '85', section_title: 'Delegation by Secretary' },
  { part: 'Part 5', part_title: 'Miscellaneous', section_number: '85B', section_title: 'Treatment of partnerships' },
  { part: 'Part 5', part_title: 'Miscellaneous', section_number: '85C', section_title: 'Treatment of trusts' },
  { part: 'Part 5', part_title: 'Miscellaneous', section_number: '85D', section_title: 'Treatment of unincorporated bodies or associations' },
  { part: 'Part 5', part_title: 'Miscellaneous', section_number: '85E', section_title: 'Protection from civil proceedings' },
  { part: 'Part 5', part_title: 'Miscellaneous', section_number: '86', section_title: 'Rules' },
];

const insertAct = db.prepare(`INSERT INTO illegal_logging_act (part, part_title, division, division_title, subdivision, section_number, section_title, content) VALUES (@part, @part_title, @division, @division_title, @subdivision, @section_number, @section_title, @content)`);
db.transaction(() => { for (const r of actRows) insert(r); })();
function insert(r: ILActRow) { insertAct.run({ part: r.part, part_title: r.part_title, division: r.division || null, division_title: r.division_title || null, subdivision: r.subdivision || null, section_number: r.section_number, section_title: r.section_title, content: r.content || null }); }

// ── Illegal Logging Prohibition Regulation 2012 ──────────────────

db.exec(`
  DROP TABLE IF EXISTS illegal_logging_reg;
  CREATE TABLE illegal_logging_reg (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part TEXT NOT NULL,
    part_title TEXT NOT NULL,
    division TEXT,
    division_title TEXT,
    regulation_number TEXT NOT NULL,
    regulation_title TEXT NOT NULL,
    content TEXT
  );
  CREATE INDEX idx_il_reg_part ON illegal_logging_reg(part);
`);

interface ILRegRow { part: string; part_title: string; division?: string; division_title?: string; regulation_number: string; regulation_title: string; }

const regRows: ILRegRow[] = [
  // Part 1
  { part: 'Part 1', part_title: 'Preliminary', regulation_number: '1', regulation_title: 'Name of regulation' },
  { part: 'Part 1', part_title: 'Preliminary', regulation_number: '3', regulation_title: 'Definition' },

  // Part 2 — Importing
  { part: 'Part 2', part_title: 'Importing', division: 'Division 1', division_title: 'Importing illegally logged timber', regulation_number: '5', regulation_title: 'Regulated timber products' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 1', division_title: 'Importing illegally logged timber', regulation_number: '6', regulation_title: 'Regulated timber products that are exempt' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 1', division_title: 'Importing illegally logged timber', regulation_number: '6A', regulation_title: 'Regulated timber products that are partially exempt' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 1', division_title: 'Importing illegally logged timber', regulation_number: '7', regulation_title: 'Customs declaration' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 2', division_title: 'Due diligence requirements for importing', regulation_number: '8', regulation_title: 'Purpose of Division 2' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 2', division_title: 'Due diligence requirements for importing', regulation_number: '9', regulation_title: 'Importer to have due diligence system' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 2', division_title: 'Due diligence requirements for importing', regulation_number: '10', regulation_title: 'Gathering information' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 2', division_title: 'Due diligence requirements for importing', regulation_number: '11', regulation_title: 'Identifying and assessing risk against timber legality framework' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 2', division_title: 'Due diligence requirements for importing', regulation_number: '12', regulation_title: 'Identifying and assessing risk against country specific guidelines' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 2', division_title: 'Due diligence requirements for importing', regulation_number: '13', regulation_title: 'Identifying and assessing risk (alternative process)' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 2', division_title: 'Due diligence requirements for importing', regulation_number: '14', regulation_title: 'Risk mitigation' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 2', division_title: 'Due diligence requirements for importing', regulation_number: '15', regulation_title: 'Provision of information to Secretary' },
  { part: 'Part 2', part_title: 'Importing', division: 'Division 2', division_title: 'Due diligence requirements for importing', regulation_number: '16', regulation_title: 'Records' },

  // Part 3 — Processing
  { part: 'Part 3', part_title: 'Processing', division: 'Division 1', division_title: 'Due diligence requirements for processing raw logs', regulation_number: '17', regulation_title: 'Purpose of Division 1' },
  { part: 'Part 3', part_title: 'Processing', division: 'Division 1', division_title: 'Due diligence requirements for processing raw logs', regulation_number: '18', regulation_title: 'Processor to have due diligence system' },
  { part: 'Part 3', part_title: 'Processing', division: 'Division 1', division_title: 'Due diligence requirements for processing raw logs', regulation_number: '19', regulation_title: 'Gathering information' },
  { part: 'Part 3', part_title: 'Processing', division: 'Division 1', division_title: 'Due diligence requirements for processing raw logs', regulation_number: '20', regulation_title: 'Identifying and assessing risk against timber legality framework' },
  { part: 'Part 3', part_title: 'Processing', division: 'Division 1', division_title: 'Due diligence requirements for processing raw logs', regulation_number: '21', regulation_title: 'Identifying and assessing risk against State specific guidelines' },
  { part: 'Part 3', part_title: 'Processing', division: 'Division 1', division_title: 'Due diligence requirements for processing raw logs', regulation_number: '22', regulation_title: 'Identifying and assessing risk (alternative process)' },
  { part: 'Part 3', part_title: 'Processing', division: 'Division 1', division_title: 'Due diligence requirements for processing raw logs', regulation_number: '23', regulation_title: 'Risk mitigation' },
  { part: 'Part 3', part_title: 'Processing', division: 'Division 1', division_title: 'Due diligence requirements for processing raw logs', regulation_number: '24', regulation_title: 'Provision of information to Secretary' },
  { part: 'Part 3', part_title: 'Processing', division: 'Division 1', division_title: 'Due diligence requirements for processing raw logs', regulation_number: '25', regulation_title: 'Records' },

  // Part 5 — Application and transitional
  { part: 'Part 5', part_title: 'Application and transitional provisions', regulation_number: '27', regulation_title: 'Application of amendments relating to regulated timber products' },
  { part: 'Part 5', part_title: 'Application and transitional provisions', regulation_number: '28', regulation_title: 'Application of 2021 amendments' },
];

const insertReg = db.prepare(`INSERT INTO illegal_logging_reg (part, part_title, division, division_title, regulation_number, regulation_title, content) VALUES (@part, @part_title, @division, @division_title, @regulation_number, @regulation_title, @content)`);
db.transaction(() => { for (const r of regRows) insertReg.run({ part: r.part, part_title: r.part_title, division: r.division || null, division_title: r.division_title || null, regulation_number: r.regulation_number, regulation_title: r.regulation_title, content: null }); })();

// FTS indexes
db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS illegal_logging_act_fts USING fts5(section_number, section_title, part, part_title, division_title, content, content='illegal_logging_act', content_rowid='id');
  INSERT INTO illegal_logging_act_fts(illegal_logging_act_fts) VALUES('rebuild');
  CREATE VIRTUAL TABLE IF NOT EXISTS illegal_logging_reg_fts USING fts5(regulation_number, regulation_title, part, part_title, division_title, content, content='illegal_logging_reg', content_rowid='id');
  INSERT INTO illegal_logging_reg_fts(illegal_logging_reg_fts) VALUES('rebuild');
`);

const actCount = (db.prepare('SELECT COUNT(*) as cnt FROM illegal_logging_act').get() as { cnt: number }).cnt;
const regCount = (db.prepare('SELECT COUNT(*) as cnt FROM illegal_logging_reg').get() as { cnt: number }).cnt;
console.log(`Seeded ${actCount} Act sections and ${regCount} Regulation entries for Illegal Logging Prohibition`);
db.close();
