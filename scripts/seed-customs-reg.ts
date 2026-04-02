import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  DROP TABLE IF EXISTS customs_regulation;
  CREATE TABLE customs_regulation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part TEXT NOT NULL,
    part_title TEXT NOT NULL,
    division TEXT,
    division_title TEXT,
    regulation_number TEXT NOT NULL,
    regulation_title TEXT NOT NULL,
    content TEXT
  );
  CREATE INDEX idx_cr_part ON customs_regulation(part);
`);

interface CReg { part: string; part_title: string; division?: string; division_title?: string; regulation_number: string; regulation_title: string; }

const regs: CReg[] = [
  // Part 1
  { part: 'Part 1', part_title: 'Preliminary', division: 'Division 1', division_title: 'Introduction', regulation_number: '1', regulation_title: 'Name' },
  { part: 'Part 1', part_title: 'Preliminary', division: 'Division 1', division_title: 'Introduction', regulation_number: '3', regulation_title: 'Authority' },
  { part: 'Part 1', part_title: 'Preliminary', division: 'Division 2', division_title: 'Definitions', regulation_number: '4', regulation_title: 'Definitions' },
  { part: 'Part 1', part_title: 'Preliminary', division: 'Division 2', division_title: 'Definitions', regulation_number: '5', regulation_title: 'Additional definitions' },
  { part: 'Part 1', part_title: 'Preliminary', division: 'Division 3', division_title: 'Provisions relating to definitions', regulation_number: '6', regulation_title: 'Meaning of prohibited goods' },
  { part: 'Part 1', part_title: 'Preliminary', division: 'Division 3', division_title: 'Provisions relating to definitions', regulation_number: '7', regulation_title: 'Meaning of ship and aircraft' },
  { part: 'Part 1', part_title: 'Preliminary', division: 'Division 3', division_title: 'Provisions relating to definitions', regulation_number: '8', regulation_title: 'Meaning of owner' },
  { part: 'Part 1', part_title: 'Preliminary', division: 'Division 3', division_title: 'Provisions relating to definitions', regulation_number: '9', regulation_title: 'Meaning of place' },
  { part: 'Part 1', part_title: 'Preliminary', division: 'Division 3', division_title: 'Provisions relating to definitions', regulation_number: '10', regulation_title: 'Meaning of document' },
  // Part 2
  { part: 'Part 2', part_title: 'Administration', regulation_number: '11', regulation_title: 'Flag' },
  { part: 'Part 2', part_title: 'Administration', regulation_number: '12', regulation_title: 'Days and hours of business' },
  { part: 'Part 2', part_title: 'Administration', regulation_number: '13', regulation_title: 'Fees for services' },
  // Part 3
  { part: 'Part 3', part_title: 'Customs Control, Examination and Securities', regulation_number: '14', regulation_title: 'Prescribed places for export preparation' },
  // Part 4
  { part: 'Part 4', part_title: 'Importation of Goods', division: 'Division 1', division_title: 'General reporting', regulation_number: '15', regulation_title: 'Cargo reports — general' },
  { part: 'Part 4', part_title: 'Importation of Goods', division: 'Division 1', division_title: 'General reporting', regulation_number: '16', regulation_title: 'Cargo reports — air cargo' },
  { part: 'Part 4', part_title: 'Importation of Goods', division: 'Division 1', division_title: 'General reporting', regulation_number: '17', regulation_title: 'Cargo reports — sea cargo' },
  { part: 'Part 4', part_title: 'Importation of Goods', division: 'Division 1', division_title: 'General reporting', regulation_number: '18', regulation_title: 'Cargo reports — postal articles' },
  { part: 'Part 4', part_title: 'Importation of Goods', division: 'Division 1', division_title: 'General reporting', regulation_number: '19', regulation_title: 'Outturn reports' },
  { part: 'Part 4', part_title: 'Importation of Goods', division: 'Division 1', division_title: 'General reporting', regulation_number: '20', regulation_title: 'Passenger and crew reports' },
  { part: 'Part 4', part_title: 'Importation of Goods', division: 'Division 1', division_title: 'General reporting', regulation_number: '21', regulation_title: 'Impending arrival reports' },
  { part: 'Part 4', part_title: 'Importation of Goods', division: 'Division 1', division_title: 'General reporting', regulation_number: '22', regulation_title: 'Prescribed information' },
  { part: 'Part 4', part_title: 'Importation of Goods', division: 'Division 1', division_title: 'General reporting', regulation_number: '23', regulation_title: 'Exemptions from reporting' },
  { part: 'Part 4', part_title: 'Importation of Goods', division: 'Division 2', division_title: 'Special reporter registration', regulation_number: '24', regulation_title: 'Special reporters' },
  { part: 'Part 4', part_title: 'Importation of Goods', division: 'Division 3', division_title: 'Entry, unshipment, landing and examination', regulation_number: '25', regulation_title: 'Entry of goods' },
  { part: 'Part 4', part_title: 'Importation of Goods', division: 'Division 3', division_title: 'Entry, unshipment, landing and examination', regulation_number: '26', regulation_title: 'Self-assessed clearance declarations' },
  { part: 'Part 4', part_title: 'Importation of Goods', division: 'Division 3', division_title: 'Entry, unshipment, landing and examination', regulation_number: '27', regulation_title: 'Import declarations' },
  { part: 'Part 4', part_title: 'Importation of Goods', division: 'Division 3', division_title: 'Entry, unshipment, landing and examination', regulation_number: '28', regulation_title: 'Warehouse declarations' },
  { part: 'Part 4', part_title: 'Importation of Goods', division: 'Division 3', division_title: 'Entry, unshipment, landing and examination', regulation_number: '29', regulation_title: 'Transhipment requests' },
  { part: 'Part 4', part_title: 'Importation of Goods', division: 'Division 3', division_title: 'Entry, unshipment, landing and examination', regulation_number: '30', regulation_title: 'Prescribed goods — low value' },
  { part: 'Part 4', part_title: 'Importation of Goods', division: 'Division 3', division_title: 'Entry, unshipment, landing and examination', regulation_number: '31', regulation_title: 'Unshipment and landing' },
  { part: 'Part 4', part_title: 'Importation of Goods', division: 'Division 3', division_title: 'Entry, unshipment, landing and examination', regulation_number: '32', regulation_title: 'Examination of goods' },
  // Part 5
  { part: 'Part 5', part_title: 'Depot Licences', regulation_number: '33', regulation_title: 'Travelling expenses' },
  { part: 'Part 5', part_title: 'Depot Licences', regulation_number: '34', regulation_title: 'Transfer of depot licence' },
  // Part 6
  { part: 'Part 6', part_title: 'Warehouses', division: 'Division 1', division_title: 'Warehouse licences', regulation_number: '35', regulation_title: 'Warehouse licence conditions' },
  { part: 'Part 6', part_title: 'Warehouses', division: 'Division 1', division_title: 'Warehouse licences', regulation_number: '36', regulation_title: 'Warehouse licence renewal' },
  { part: 'Part 6', part_title: 'Warehouses', division: 'Division 1', division_title: 'Warehouse licences', regulation_number: '37', regulation_title: 'Transfer of warehouse licence' },
  { part: 'Part 6', part_title: 'Warehouses', division: 'Division 2', division_title: 'Outwards duty free shops — permission', regulation_number: '39', regulation_title: 'Permission to sell duty free goods' },
  { part: 'Part 6', part_title: 'Warehouses', division: 'Division 2', division_title: 'Outwards duty free shops — permission', regulation_number: '40', regulation_title: 'Application for permission' },
  { part: 'Part 6', part_title: 'Warehouses', division: 'Division 2', division_title: 'Outwards duty free shops — permission', regulation_number: '41', regulation_title: 'Grant of permission' },
  { part: 'Part 6', part_title: 'Warehouses', division: 'Division 2', division_title: 'Outwards duty free shops — permission', regulation_number: '42', regulation_title: 'Permission conditions' },
  { part: 'Part 6', part_title: 'Warehouses', division: 'Division 3', division_title: 'Outwards duty free shop conditions', regulation_number: '43', regulation_title: 'General conditions' },
  { part: 'Part 6', part_title: 'Warehouses', division: 'Division 3', division_title: 'Outwards duty free shop conditions', regulation_number: '44', regulation_title: 'Record keeping' },
  { part: 'Part 6', part_title: 'Warehouses', division: 'Division 3', division_title: 'Outwards duty free shop conditions', regulation_number: '45', regulation_title: 'Returns' },
  { part: 'Part 6', part_title: 'Warehouses', division: 'Division 6', division_title: 'Proof of export', regulation_number: '58', regulation_title: 'Proof of export — duty free goods' },
  { part: 'Part 6', part_title: 'Warehouses', division: 'Division 7', division_title: 'Inwards duty free shops', regulation_number: '60', regulation_title: 'Inwards duty free shops — permission' },
  { part: 'Part 6', part_title: 'Warehouses', division: 'Division 8', division_title: 'Other warehouse matters', regulation_number: '66', regulation_title: 'Warehoused goods' },
  { part: 'Part 6', part_title: 'Warehouses', division: 'Division 8', division_title: 'Other warehouse matters', regulation_number: '71', regulation_title: 'Warehouse rent' },
  // Part 7
  { part: 'Part 7', part_title: 'Cargo Terminals', regulation_number: '72', regulation_title: 'Particulars of persons entering cargo terminals' },
  // Part 8
  { part: 'Part 8', part_title: 'Special Beverage Provisions', regulation_number: '73', regulation_title: 'Customable beverages' },
  // Part 9
  { part: 'Part 9', part_title: 'Information About Departing Persons', regulation_number: '74', regulation_title: 'Kinds of ships' },
  // Part 10
  { part: 'Part 10', part_title: 'Exportation of Goods', division: 'Division 1', division_title: 'Military end-use export controls', regulation_number: '75', regulation_title: 'Goods prescribed for military end-use' },
  { part: 'Part 10', part_title: 'Exportation of Goods', division: 'Division 1', division_title: 'Military end-use export controls', regulation_number: '76', regulation_title: 'Prescribed countries' },
  { part: 'Part 10', part_title: 'Exportation of Goods', division: 'Division 1', division_title: 'Military end-use export controls', regulation_number: '77', regulation_title: 'Application for permission' },
  { part: 'Part 10', part_title: 'Exportation of Goods', division: 'Division 1', division_title: 'Military end-use export controls', regulation_number: '78', regulation_title: 'Grant of permission' },
  { part: 'Part 10', part_title: 'Exportation of Goods', division: 'Division 2', division_title: 'Entry and clearance', regulation_number: '79', regulation_title: 'Export declarations' },
  { part: 'Part 10', part_title: 'Exportation of Goods', division: 'Division 2', division_title: 'Entry and clearance', regulation_number: '80', regulation_title: 'Export declaration information' },
  { part: 'Part 10', part_title: 'Exportation of Goods', division: 'Division 2', division_title: 'Entry and clearance', regulation_number: '81', regulation_title: 'Goods not requiring export declaration' },
  { part: 'Part 10', part_title: 'Exportation of Goods', division: 'Division 2', division_title: 'Entry and clearance', regulation_number: '92', regulation_title: 'Clearance of goods for export' },
  // Part 11
  { part: 'Part 11', part_title: 'Ships\u2019 Stores, Drugs, Aircraft Stores', regulation_number: '93', regulation_title: 'Ship\u2019s stores' },
  { part: 'Part 11', part_title: 'Ships\u2019 Stores, Drugs, Aircraft Stores', regulation_number: '94', regulation_title: 'Prohibited drugs in transit' },
  // Part 12
  { part: 'Part 12', part_title: 'The Duties', division: 'Division 1A', division_title: 'Trusted traders', regulation_number: '94A', regulation_title: 'Trusted trader programme' },
  { part: 'Part 12', part_title: 'The Duties', division: 'Division 1', division_title: 'Alcoholic beverages', regulation_number: '95', regulation_title: 'Classification of alcoholic beverages' },
  { part: 'Part 12', part_title: 'The Duties', division: 'Division 2', division_title: 'Factory expenditure', regulation_number: '96', regulation_title: 'Factory costs' },
  { part: 'Part 12', part_title: 'The Duties', division: 'Division 2', division_title: 'Factory expenditure', regulation_number: '97', regulation_title: 'Factory overhead costs' },
  { part: 'Part 12', part_title: 'The Duties', division: 'Division 3', division_title: 'Value of goods', regulation_number: '98', regulation_title: 'Customs value' },
  { part: 'Part 12', part_title: 'The Duties', division: 'Division 4', division_title: 'Delivery on security', regulation_number: '99', regulation_title: 'Security for duty' },
  { part: 'Part 12', part_title: 'The Duties', division: 'Division 5', division_title: 'Refunds, rebates and remissions', regulation_number: '102', regulation_title: 'Circumstances for refunds' },
  { part: 'Part 12', part_title: 'The Duties', division: 'Division 5', division_title: 'Refunds, rebates and remissions', regulation_number: '112', regulation_title: 'Amount of refund' },
  // Part 13
  { part: 'Part 13', part_title: 'Agents and Customs Brokers', division: 'Division 1', division_title: 'Broker licences', regulation_number: '113', regulation_title: 'Customs broker licence requirements' },
  { part: 'Part 13', part_title: 'Agents and Customs Brokers', division: 'Division 1', division_title: 'Broker licences', regulation_number: '114', regulation_title: 'Continuing professional development' },
  { part: 'Part 13', part_title: 'Agents and Customs Brokers', division: 'Division 2', division_title: 'National Customs Brokers Licensing Advisory Committee', regulation_number: '117', regulation_title: 'Advisory Committee' },
  // Part 14
  { part: 'Part 14', part_title: 'Officers', division: 'Division 1', division_title: 'Officer powers', regulation_number: '118', regulation_title: 'Officer powers — general' },
  { part: 'Part 14', part_title: 'Officers', division: 'Division 2', division_title: 'Detention and search', regulation_number: '125', regulation_title: 'Detention powers' },
  // Part 15
  { part: 'Part 15', part_title: 'Penal Provisions', division: 'Division 1', division_title: 'Non-infringement matters', regulation_number: '129', regulation_title: 'Forfeiture' },
  { part: 'Part 15', part_title: 'Penal Provisions', division: 'Division 2', division_title: 'Infringement notices', regulation_number: '133', regulation_title: 'Infringement notice scheme' },
  // Part 16
  { part: 'Part 16', part_title: 'Tariff Concession Orders', regulation_number: '144', regulation_title: 'Prescribed organisations' },
  { part: 'Part 16', part_title: 'Tariff Concession Orders', regulation_number: '145', regulation_title: 'Excluded goods' },
  // Part 17
  { part: 'Part 17', part_title: 'Other Matters', regulation_number: '146', regulation_title: 'Prescribed Customs-related laws' },
  { part: 'Part 17', part_title: 'Other Matters', regulation_number: '147', regulation_title: 'LPG and gas measurements' },
  { part: 'Part 17', part_title: 'Other Matters', regulation_number: '148', regulation_title: 'Collector\u2019s sales — minimum bid' },
  { part: 'Part 17', part_title: 'Other Matters', regulation_number: '150', regulation_title: 'Customs documents' },
  // Schedules
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 1', regulation_title: 'Tariff subheadings — excise-equivalent and customable goods' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 2', regulation_title: 'Access to passenger information — prescribed laws' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 3', regulation_title: 'Goods under AHECC classification' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 4', regulation_title: 'Export particulars for non-entered goods' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 5', regulation_title: 'Factory overhead costs' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 6', regulation_title: 'Duty refunds, rebates, remissions — circumstances' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 7', regulation_title: 'Tier 1 and Tier 2 goods' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 8', regulation_title: 'Infringement notice provisions' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 9', regulation_title: 'TCO-excluded goods' },
];

const insert = db.prepare(`INSERT INTO customs_regulation (part, part_title, division, division_title, regulation_number, regulation_title, content) VALUES (@part, @part_title, @division, @division_title, @regulation_number, @regulation_title, @content)`);
db.transaction(() => { for (const r of regs) insert.run({ ...r, division: r.division || null, division_title: r.division_title || null, content: null }); })();

db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS customs_reg_fts USING fts5(part, part_title, division, division_title, regulation_number, regulation_title, content, content='customs_regulation', content_rowid='id');
  INSERT INTO customs_reg_fts(customs_reg_fts) VALUES('rebuild');
`);

const count = (db.prepare('SELECT COUNT(*) as cnt FROM customs_regulation').get() as { cnt: number }).cnt;
console.log(`Seeded ${count} Customs Regulation 2015 entries`);
db.close();
