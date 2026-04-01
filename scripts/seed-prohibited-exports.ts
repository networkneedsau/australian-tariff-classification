import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  DROP TABLE IF EXISTS prohibited_exports_regs;
  CREATE TABLE prohibited_exports_regs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part TEXT NOT NULL,
    part_title TEXT NOT NULL,
    division TEXT,
    division_title TEXT,
    regulation_number TEXT NOT NULL,
    regulation_title TEXT NOT NULL,
    content TEXT
  );
  CREATE INDEX idx_per_part ON prohibited_exports_regs(part);
`);

interface PEReg { part: string; part_title: string; division?: string; division_title?: string; regulation_number: string; regulation_title: string; content?: string; }

const regs: PEReg[] = [
  // Part 1
  { part: 'Part 1', part_title: 'Preliminary', regulation_number: '1', regulation_title: 'Name of Regulations', content: 'These Regulations are the Customs (Prohibited Exports) Regulations 1958.' },
  { part: 'Part 1', part_title: 'Preliminary', regulation_number: '2', regulation_title: 'Interpretation', content: 'Definitions of key terms used throughout the Regulations.' },

  // Part 2
  { part: 'Part 2', part_title: 'Exemptions', regulation_number: '2A', regulation_title: 'Exemption of goods specified in Schedule 3', content: 'The Minister may, by legislative instrument, exempt goods specified in Schedule 3 from the prohibition on exportation.' },

  // Part 3 Division 1
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 1', division_title: 'Miscellaneous prohibited exports', regulation_number: '3', regulation_title: 'Exportation of objectionable goods', content: 'The exportation of objectionable goods (goods that describe, depict or deal with matters of sex, drug misuse, crime, cruelty or violence in an offensive manner) is prohibited unless the Minister or an authorised person has granted permission.' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 1', division_title: 'Miscellaneous prohibited exports', regulation_number: '4', regulation_title: 'Exportation of asbestos or certain goods containing asbestos', content: 'The exportation of asbestos or goods containing asbestos specified in Schedule 1 is prohibited unless the Minister has granted permission in writing.' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 1', division_title: 'Miscellaneous prohibited exports', regulation_number: '4A', regulation_title: 'Exportation of chemicals', content: 'The exportation of chemicals specified in Schedule 2 is prohibited unless the Minister or an authorised person has granted permission. Implements Australia\u2019s obligations under the Chemical Weapons Convention.' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 1', division_title: 'Miscellaneous prohibited exports', regulation_number: '5', regulation_title: 'Exportation of goods specified in Schedule 3 (primary produce)', content: 'The exportation of goods specified in Schedule 3 (primary produce and related goods) is prohibited unless the approval of the Minister or an authorised officer is produced to the Collector.' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 1', division_title: 'Miscellaneous prohibited exports', regulation_number: '6', regulation_title: 'Exportation of goods specified in Schedule 4 (toothfish)', content: 'The exportation of toothfish (Dissostichus species) is prohibited unless permission has been granted. Implements Australia\u2019s obligations under CCAMLR.' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 1', division_title: 'Miscellaneous prohibited exports', regulation_number: '8', regulation_title: 'Exportation of goods specified in Schedule 6 (human substances)', content: 'The exportation of human body tissue, blood, blood products and other human substances specified in Schedule 6 is prohibited unless permission has been granted.' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 1', division_title: 'Miscellaneous prohibited exports', regulation_number: '8A', regulation_title: 'Exportation of viable material derived from human embryo clones', content: 'The exportation of viable material derived from human embryo clones is prohibited absolutely.' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 1', division_title: 'Miscellaneous prohibited exports', regulation_number: '9', regulation_title: 'Exportation of goods specified in Schedule 7 (nuclear material)', content: 'The exportation of nuclear material and equipment specified in Schedule 7 is prohibited unless the Minister or authorised person has granted permission.' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 1', division_title: 'Miscellaneous prohibited exports', regulation_number: '9AA', regulation_title: 'Exportation of rough diamonds', content: 'The exportation of rough diamonds is prohibited unless accompanied by a Kimberley Process certificate.' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 1', division_title: 'Miscellaneous prohibited exports', regulation_number: '9AB', regulation_title: 'Exportation of cat and dog fur', content: 'The exportation of goods made from cat fur or dog fur is prohibited absolutely.' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 1', division_title: 'Miscellaneous prohibited exports', regulation_number: '9AC', regulation_title: 'Exportation of security sensitive ammonium nitrate', content: 'The exportation of security sensitive ammonium nitrate is prohibited unless the exporter holds a permission granted by the Minister or an authorised person.' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 1', division_title: 'Miscellaneous prohibited exports', regulation_number: '9AD', regulation_title: 'Exportation of goods specified in Schedule 7A (high activity radioactive sources)', content: 'The exportation of high activity radioactive sources specified in Schedule 7A is prohibited unless permission has been granted.' },

  // Part 3 Division 2
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 2', division_title: 'Drugs and precursor substances', regulation_number: '9A', regulation_title: 'Definitions for Division 2' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 2', division_title: 'Drugs and precursor substances', regulation_number: '10', regulation_title: 'Exportation of goods specified in Schedule 8 (drugs)', content: 'The exportation of drugs specified in Schedule 8 is prohibited unless the exporter holds a licence and permission, and complies with specified conditions and restrictions.' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 2', division_title: 'Drugs and precursor substances', regulation_number: '10AA', regulation_title: 'Drugs that may be exported \u2014 Ministerial approval' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 2', division_title: 'Drugs and precursor substances', regulation_number: '10AB', regulation_title: 'Exportation of goods specified in Schedule 9 (precursor substances)', content: 'The exportation of precursor substances specified in Schedule 9 is prohibited unless the exporter holds a licence and permission.' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 2', division_title: 'Drugs and precursor substances', regulation_number: '10A', regulation_title: 'Licensed exporters' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 2', division_title: 'Drugs and precursor substances', regulation_number: '10B', regulation_title: 'Conditions of licences under regulation 10A' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 2', division_title: 'Drugs and precursor substances', regulation_number: '10C', regulation_title: 'Requirements appropriate to drugs' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 2', division_title: 'Drugs and precursor substances', regulation_number: '10CA', regulation_title: 'Requirements appropriate to precursor substances' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 2', division_title: 'Drugs and precursor substances', regulation_number: '10D', regulation_title: 'Drugs deemed to be narcotic drugs' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 2', division_title: 'Drugs and precursor substances', regulation_number: '10E', regulation_title: 'Exercise of powers by Secretary, Comptroller General of Customs or authorised person' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 2', division_title: 'Drugs and precursor substances', regulation_number: '10F', regulation_title: 'Review of decisions \u2014 exportation of Schedule 8 drugs and precursor substances' },

  // Part 3 Division 2A
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 2A', division_title: 'Autonomous sanctions', regulation_number: '11', regulation_title: 'Exportation of export sanctioned goods to countries under autonomous sanctions', content: 'The exportation of goods to countries subject to Australian autonomous sanctions is prohibited unless the Minister has granted permission.' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 2A', division_title: 'Autonomous sanctions', regulation_number: '11A', regulation_title: 'Exportation of goods to designated persons and entities under autonomous sanctions' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 2A', division_title: 'Autonomous sanctions', regulation_number: '11B', regulation_title: 'Exportation of controlled assets under autonomous sanctions' },

  // Part 3 Division 3
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 3', division_title: 'Exportation of goods to certain countries', regulation_number: '13CI', regulation_title: 'Exportation of arms or related mat\u00e9riel to Afghanistan' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 3', division_title: 'Exportation of goods to certain countries', regulation_number: '13CJ', regulation_title: 'Exportation of acetic anhydride' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 3', division_title: 'Exportation of goods to certain countries', regulation_number: '13CK', regulation_title: 'Exportation of arms or related mat\u00e9riel to Liberia' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 3', division_title: 'Exportation of goods to certain countries', regulation_number: '13CL', regulation_title: 'Exportation of arms or related mat\u00e9riel to the Democratic Republic of the Congo' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 3', division_title: 'Exportation of goods to certain countries', regulation_number: '13CM', regulation_title: 'Exportation of arms or related mat\u00e9riel to Sudan' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 3', division_title: 'Exportation of goods to certain countries', regulation_number: '13CN', regulation_title: 'Exportation of certain goods to C\u00f4te d\u2019Ivoire' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 3', division_title: 'Exportation of goods to certain countries', regulation_number: '13CO', regulation_title: 'Exportation of goods to Democratic People\u2019s Republic of Korea' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 3', division_title: 'Exportation of goods to certain countries', regulation_number: '13CP', regulation_title: 'Exportation of arms or related mat\u00e9riel to Lebanon' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 3', division_title: 'Exportation of goods to certain countries', regulation_number: '13CQ', regulation_title: 'Exportation of certain goods to Iran' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 3', division_title: 'Exportation of goods to certain countries', regulation_number: '13CR', regulation_title: 'Exportation of certain goods to Eritrea' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 3', division_title: 'Exportation of goods to certain countries', regulation_number: '13CS', regulation_title: 'Exportation of certain goods to the Libyan Arab Jamahiriya' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 3', division_title: 'Exportation of goods to certain countries', regulation_number: '13CT', regulation_title: 'Exportation of certain goods to the Central African Republic' },

  // Part 3 Division 4
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 4', division_title: 'Financial goods', regulation_number: '13D', regulation_title: 'Exportation of counterfeit credit, debit and charge cards', content: 'The exportation of counterfeit credit cards, debit cards or charge cards is prohibited absolutely.' },

  // Part 3 Division 4A
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 4A', division_title: 'Defence and strategic goods', regulation_number: '13E', regulation_title: 'Exportation of defence and strategic goods \u2014 general', content: 'The exportation of defence and strategic goods listed in the Defence and Strategic Goods List (DSGL) is prohibited unless the Defence Minister or authorised person has granted permission.' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 4A', division_title: 'Defence and strategic goods', regulation_number: '13EA', regulation_title: 'No permission required under regulation 13E' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 4A', division_title: 'Defence and strategic goods', regulation_number: '13EB', regulation_title: 'Application for permission' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 4A', division_title: 'Defence and strategic goods', regulation_number: '13EC', regulation_title: 'Changing permission conditions' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 4A', division_title: 'Defence and strategic goods', regulation_number: '13ED', regulation_title: 'Revocation of permission' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 4A', division_title: 'Defence and strategic goods', regulation_number: '13EE', regulation_title: 'Internal review of decisions' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 4A', division_title: 'Defence and strategic goods', regulation_number: '13EF', regulation_title: 'Review by the Administrative Appeals Tribunal' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 4A', division_title: 'Defence and strategic goods', regulation_number: '13EG', regulation_title: 'Notification of decisions \u2014 service and receipt' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 4A', division_title: 'Defence and strategic goods', regulation_number: '13EH', regulation_title: 'Disclosure of reasons for decisions' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 4A', division_title: 'Defence and strategic goods', regulation_number: '13EI', regulation_title: 'Disclosure of information and documents' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 4A', division_title: 'Defence and strategic goods', regulation_number: '13EJ', regulation_title: 'Delegations by Defence Minister' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 4A', division_title: 'Defence and strategic goods', regulation_number: '13EK', regulation_title: 'Delegations by Secretary' },

  // Part 3 Division 4B
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 4B', division_title: 'Environmental goods', regulation_number: '13F', regulation_title: 'Exportation of ozone depleting substances and synthetic greenhouse gases', content: 'The exportation of ozone depleting substances and synthetic greenhouse gases listed in Schedule 15 is prohibited unless the exporter holds a licence.' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 4B', division_title: 'Environmental goods', regulation_number: '13G', regulation_title: 'Exportation of radioactive waste', content: 'The exportation of radioactive waste is prohibited unless the Minister has granted permission.' },

  // Part 3 Division 5
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 5', division_title: 'Devices and documents relating to suicide', regulation_number: '13GA', regulation_title: 'Exportation of devices and documents relating to suicide', content: 'The exportation of devices designed for use in committing suicide, and documents that promote, counsel or instruct in the use of such devices, is prohibited absolutely.' },

  // Part 3 Division 6
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 6', division_title: 'Liquefied natural gas', regulation_number: '13GB', regulation_title: 'Definitions' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 6', division_title: 'Liquefied natural gas', regulation_number: '13GC', regulation_title: 'Export prohibited during domestic shortfall quarters', content: 'The exportation of LNG is prohibited during domestic shortfall quarters unless the exporter holds a permission.' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 6', division_title: 'Liquefied natural gas', regulation_number: '13GD', regulation_title: 'Assignment of permissions' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 6', division_title: 'Liquefied natural gas', regulation_number: '13GE', regulation_title: 'Determining a domestic shortfall quarter' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 6', division_title: 'Liquefied natural gas', regulation_number: '13GF', regulation_title: 'Resources Minister may publish guidelines' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 6', division_title: 'Liquefied natural gas', regulation_number: '13GG', regulation_title: 'Review of Division' },
  { part: 'Part 3', part_title: 'Prohibited Exports', division: 'Division 6', division_title: 'Liquefied natural gas', regulation_number: '13GH', regulation_title: 'Repeal of Division' },

  // Part 4
  { part: 'Part 4', part_title: 'Miscellaneous', regulation_number: '13H', regulation_title: 'Certain applications to be referred' },
  { part: 'Part 4', part_title: 'Miscellaneous', regulation_number: '14', regulation_title: 'Regulations do not derogate from any other law', content: 'These Regulations do not derogate from any law of the Commonwealth, a State or a Territory.' },

  // Part 5
  { part: 'Part 5', part_title: 'Transitional Matters', regulation_number: '17', regulation_title: 'Transitional \u2014 Australian Border Force Regulation 2015' },
  { part: 'Part 5', part_title: 'Transitional Matters', regulation_number: '18', regulation_title: 'Transitional \u2014 Defence and Strategic Goods Regulations 2018' },
  { part: 'Part 5', part_title: 'Transitional Matters', regulation_number: '19', regulation_title: 'Transitional \u2014 Asbestos Regulations 2019' },
  { part: 'Part 5', part_title: 'Transitional Matters', regulation_number: '20', regulation_title: 'Transitional \u2014 Objectionable Goods Regulations 2020' },
  { part: 'Part 5', part_title: 'Transitional Matters', regulation_number: '21', regulation_title: 'Transitional \u2014 Minamata Convention Regulations 2021' },
  { part: 'Part 5', part_title: 'Transitional Matters', regulation_number: '22', regulation_title: 'Transitional \u2014 LNG Regulations 2023' },

  // Schedules
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 1', regulation_title: 'Goods containing asbestos', content: 'List of goods containing asbestos whose exportation is prohibited under regulation 4.' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 2', regulation_title: 'Chemicals \u2014 exportation prohibited without permission (CWC)', content: 'Chemicals whose exportation requires permission under regulation 4A, implementing Chemical Weapons Convention obligations.' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 3', regulation_title: 'Primary produce \u2014 exportation requires approval', content: 'Primary produce and related goods whose exportation requires ministerial approval.' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 4', regulation_title: 'Toothfish \u2014 exportation requires permission', content: 'Toothfish (Dissostichus species) whose exportation requires permission under regulation 6.' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 6', regulation_title: 'Human substances \u2014 exportation requires permission', content: 'Human body tissue, blood, blood products and other human substances whose exportation requires permission.' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 7', regulation_title: 'Nuclear material \u2014 exportation requires permission', content: 'Nuclear material and equipment whose exportation requires ministerial permission.' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 7A', regulation_title: 'High activity radioactive sources', content: 'High activity radioactive sources whose exportation requires permission under regulation 9AD.' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 8', regulation_title: 'Drugs \u2014 exportation conditions', content: 'Drugs whose exportation is prohibited unless specified conditions, restrictions or requirements are complied with.' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 9', regulation_title: 'Precursor substances', content: 'Precursor substances whose exportation is controlled under regulation 10AB.' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 15', regulation_title: 'Ozone depleting substances', content: 'Ozone depleting substances and synthetic greenhouse gases whose exportation is controlled under regulation 13F.' },
];

const insert = db.prepare(`INSERT INTO prohibited_exports_regs (part, part_title, division, division_title, regulation_number, regulation_title, content) VALUES (@part, @part_title, @division, @division_title, @regulation_number, @regulation_title, @content)`);
db.transaction(() => { for (const r of regs) insert.run({ part: r.part, part_title: r.part_title, division: r.division || null, division_title: r.division_title || null, regulation_number: r.regulation_number, regulation_title: r.regulation_title, content: r.content || null }); })();

db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS prohibited_exports_fts USING fts5(part, part_title, division, division_title, regulation_number, regulation_title, content, content='prohibited_exports_regs', content_rowid='id');
  INSERT INTO prohibited_exports_fts(prohibited_exports_fts) VALUES('rebuild');
`);

const count = (db.prepare('SELECT COUNT(*) as cnt FROM prohibited_exports_regs').get() as { cnt: number }).cnt;
console.log(`Seeded ${count} Prohibited Exports regulations`);
db.close();
