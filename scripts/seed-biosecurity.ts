import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// ── Biosecurity Act 2015 ────────────────────────────────────────────

db.exec(`
  DROP TABLE IF EXISTS biosecurity_act;
  CREATE TABLE biosecurity_act (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter TEXT NOT NULL,
    chapter_title TEXT NOT NULL,
    part TEXT,
    part_title TEXT,
    division TEXT,
    division_title TEXT,
    section_range TEXT
  );
  CREATE INDEX idx_bio_act_chapter ON biosecurity_act(chapter);
`);

interface BioRow { chapter: string; chapter_title: string; part?: string; part_title?: string; division?: string; division_title?: string; section_range?: string; }

const actRows: BioRow[] = [
  // Chapter 1
  { chapter: 'Chapter 1', chapter_title: 'Preliminary', part: 'Part 1', part_title: 'Preliminary', section_range: 'ss 1-8' },
  { chapter: 'Chapter 1', chapter_title: 'Preliminary', part: 'Part 2', part_title: 'Definitions', section_range: 'ss 9-22' },
  { chapter: 'Chapter 1', chapter_title: 'Preliminary', part: 'Part 3', part_title: 'Constitutional and International Law Provisions', division: 'Division 1', division_title: 'Introduction', section_range: 's 23' },
  { chapter: 'Chapter 1', chapter_title: 'Preliminary', part: 'Part 3', part_title: 'Constitutional and International Law Provisions', division: 'Division 2', division_title: 'Constitutional and international law provisions', section_range: 'ss 24-30' },
  { chapter: 'Chapter 1', chapter_title: 'Preliminary', part: 'Part 4', part_title: 'Principles Affecting Decisions', section_range: 'ss 31-32' },

  // Chapter 2
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Human Health', part: 'Part 1', part_title: 'General Protections and Listing Human Diseases', division: 'Division 1', division_title: 'Introduction', section_range: 's 33' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Human Health', part: 'Part 1', part_title: 'General Protections and Listing Human Diseases', division: 'Division 2', division_title: 'Protections', section_range: 'ss 34-41' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Human Health', part: 'Part 1', part_title: 'General Protections and Listing Human Diseases', division: 'Division 3', division_title: 'Listing human diseases', section_range: 's 42' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Human Health', part: 'Part 2', part_title: 'Preventing Risks to Human Health', division: 'Division 2', division_title: 'Entry and exit requirements', section_range: 'ss 44-46' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Human Health', part: 'Part 2', part_title: 'Preventing Risks to Human Health', division: 'Division 3', division_title: 'Contact information for operators', section_range: 's 47' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Human Health', part: 'Part 2', part_title: 'Preventing Risks to Human Health', division: 'Division 4', division_title: 'Pratique', section_range: 'ss 48-50' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Human Health', part: 'Part 2', part_title: 'Preventing Risks to Human Health', division: 'Division 5', division_title: 'Preventative biosecurity measures', section_range: 'ss 51-52' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Human Health', part: 'Part 2', part_title: 'Preventing Risks to Human Health', division: 'Division 6', division_title: 'Information gathering powers', section_range: 'ss 54-58' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Human Health', part: 'Part 3', part_title: 'Human Biosecurity Control Orders', division: 'Division 2', division_title: 'Imposing orders', section_range: 'ss 60-81' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Human Health', part: 'Part 3', part_title: 'Human Biosecurity Control Orders', division: 'Division 3', division_title: 'Biosecurity measures', section_range: 'ss 82-101' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Human Health', part: 'Part 3', part_title: 'Human Biosecurity Control Orders', division: 'Division 4', division_title: 'Other provisions', section_range: 'ss 102-108' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Human Health', part: 'Part 4', part_title: 'Other Biosecurity Measures', division: 'Division 2', division_title: 'Managing deceased individuals', section_range: 'ss 110-112' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Human Health', part: 'Part 4', part_title: 'Other Biosecurity Measures', division: 'Division 3', division_title: 'Human health response zones', section_range: 'ss 113-116' },

  // Chapter 3
  { chapter: 'Chapter 3', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 1', part_title: 'Goods Brought Into Australian Territory', division: 'Division 2', division_title: 'Goods subject to biosecurity control', section_range: 's 119' },
  { chapter: 'Chapter 3', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 1', part_title: 'Goods Brought Into Australian Territory', division: 'Division 3', division_title: 'Notice of goods to be unloaded', section_range: 'ss 120-122' },
  { chapter: 'Chapter 3', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 1', part_title: 'Goods Brought Into Australian Territory', division: 'Division 4', division_title: 'Assessment of biosecurity risk', section_range: 'ss 123-130' },
  { chapter: 'Chapter 3', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 1', part_title: 'Goods Brought Into Australian Territory', division: 'Division 5', division_title: 'Biosecurity measures to manage risk', section_range: 'ss 131-141' },
  { chapter: 'Chapter 3', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 1', part_title: 'Goods Brought Into Australian Territory', division: 'Division 6', division_title: 'Unloading at landing places and ports', section_range: 'ss 142-149' },
  { chapter: 'Chapter 3', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 1', part_title: 'Goods Brought Into Australian Territory', division: 'Division 7', division_title: 'Unloading from vessel with quarantine signal', section_range: 'ss 150-152' },
  { chapter: 'Chapter 3', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 1', part_title: 'Goods Brought Into Australian Territory', division: 'Division 8', division_title: 'Reporting biosecurity incidents', section_range: 'ss 153-157' },
  { chapter: 'Chapter 3', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 1', part_title: 'Goods Brought Into Australian Territory', division: 'Division 9', division_title: 'Goods exposed to biosecurity control', section_range: 'ss 158-161' },
  { chapter: 'Chapter 3', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 1', part_title: 'Goods Brought Into Australian Territory', division: 'Division 10', division_title: 'Release from biosecurity control', section_range: 'ss 162-164' },
  { chapter: 'Chapter 3', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 2', part_title: 'Biosecurity Import Risk Analyses', section_range: 'ss 165-170' },
  { chapter: 'Chapter 3', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 3', part_title: 'Prohibited Goods', division: 'Division 2', division_title: 'Prohibited and conditionally non-prohibited goods', section_range: 'ss 173-175' },
  { chapter: 'Chapter 3', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 3', part_title: 'Prohibited Goods', division: 'Division 3', division_title: 'Permits', section_range: 'ss 176-181' },
  { chapter: 'Chapter 3', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 3', part_title: 'Prohibited Goods', division: 'Division 4', division_title: 'Suspended goods', section_range: 'ss 182-184' },
  { chapter: 'Chapter 3', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 3', part_title: 'Prohibited Goods', division: 'Division 5', division_title: 'Offences and civil penalties', section_range: 'ss 185-188' },

  // Chapter 4
  { chapter: 'Chapter 4', chapter_title: 'Managing Biosecurity Risks: Conveyances', part: 'Part 2', part_title: 'Conveyances Entering Australian Territory', division: 'Division 2', division_title: 'Conveyances subject to biosecurity control', section_range: 'ss 191-192' },
  { chapter: 'Chapter 4', chapter_title: 'Managing Biosecurity Risks: Conveyances', part: 'Part 2', part_title: 'Conveyances Entering Australian Territory', division: 'Division 3', division_title: 'Pre-arrival reporting', section_range: 'ss 193-195' },
  { chapter: 'Chapter 4', chapter_title: 'Managing Biosecurity Risks: Conveyances', part: 'Part 2', part_title: 'Conveyances Entering Australian Territory', division: 'Division 4', division_title: 'Assessment of biosecurity risk', section_range: 'ss 197-204' },
  { chapter: 'Chapter 4', chapter_title: 'Managing Biosecurity Risks: Conveyances', part: 'Part 2', part_title: 'Conveyances Entering Australian Territory', division: 'Division 5', division_title: 'Biosecurity measures', section_range: 'ss 204A-220' },
  { chapter: 'Chapter 4', chapter_title: 'Managing Biosecurity Risks: Conveyances', part: 'Part 3', part_title: 'First Points of Entry and Biosecurity Entry Points', section_range: 'ss 221-252' },
  { chapter: 'Chapter 4', chapter_title: 'Managing Biosecurity Risks: Conveyances', part: 'Part 5', part_title: 'Ship Sanitation', section_range: 'ss 253-257' },

  // Chapter 5
  { chapter: 'Chapter 5', chapter_title: 'Ballast Water and Sediment', part: 'Part 1', part_title: 'Application and Interpretation', section_range: 'ss 258-265' },
  { chapter: 'Chapter 5', chapter_title: 'Ballast Water and Sediment', part: 'Part 2', part_title: 'Notice of Discharge of Ballast Water', section_range: 'ss 266-268' },
  { chapter: 'Chapter 5', chapter_title: 'Ballast Water and Sediment', part: 'Part 3', part_title: 'Management of Discharge', section_range: 'ss 269-284' },
  { chapter: 'Chapter 5', chapter_title: 'Ballast Water and Sediment', part: 'Part 4', part_title: 'Ballast Water Management Plans and Certificates', section_range: 'ss 285-290A' },
  { chapter: 'Chapter 5', chapter_title: 'Ballast Water and Sediment', part: 'Part 5', part_title: 'Ballast Water Records', section_range: 'ss 291-295' },
  { chapter: 'Chapter 5', chapter_title: 'Ballast Water and Sediment', part: 'Part 6', part_title: 'Offence of Disposing of Sediment', section_range: 'ss 297-299A' },
  { chapter: 'Chapter 5', chapter_title: 'Ballast Water and Sediment', part: 'Part 7', part_title: 'Compliance and Enforcement', section_range: 'ss 300-306' },
  { chapter: 'Chapter 5', chapter_title: 'Ballast Water and Sediment', part: 'Part 8', part_title: 'Miscellaneous', section_range: 'ss 307-308A' },

  // Chapter 6
  { chapter: 'Chapter 6', chapter_title: 'Monitoring, Control and Response', part: 'Part 1A', part_title: 'Locating Prohibited or Suspended Goods', section_range: 'ss 312A-312F' },
  { chapter: 'Chapter 6', chapter_title: 'Monitoring, Control and Response', part: 'Part 2', part_title: 'Assessment of Level of Biosecurity Risk', section_range: 'ss 313-330' },
  { chapter: 'Chapter 6', chapter_title: 'Monitoring, Control and Response', part: 'Part 3', part_title: 'Biosecurity Measures to Manage Risk', section_range: 'ss 331-351' },
  { chapter: 'Chapter 6', chapter_title: 'Monitoring, Control and Response', part: 'Part 4', part_title: 'Biosecurity Control Orders', section_range: 'ss 352-363' },
  { chapter: 'Chapter 6', chapter_title: 'Monitoring, Control and Response', part: 'Part 5', part_title: 'Biosecurity Response Zones', section_range: 'ss 364-376' },
  { chapter: 'Chapter 6', chapter_title: 'Monitoring, Control and Response', part: 'Part 6', part_title: 'Biosecurity Monitoring Zones', section_range: 'ss 377-393' },
  { chapter: 'Chapter 6', chapter_title: 'Monitoring, Control and Response', part: 'Part 6A', part_title: 'Preventative Biosecurity Measures', section_range: 'ss 393A-393C' },
  { chapter: 'Chapter 6', chapter_title: 'Monitoring, Control and Response', part: 'Part 7', part_title: 'Biosecurity Activity Zones', section_range: 'ss 394-403' },

  // Chapter 7
  { chapter: 'Chapter 7', chapter_title: 'Approved Arrangements', part: 'Part 2', part_title: 'Approval of Proposed Arrangement', section_range: 'ss 405-410' },
  { chapter: 'Chapter 7', chapter_title: 'Approved Arrangements', part: 'Part 3', part_title: 'Variation of Approved Arrangement', section_range: 'ss 411-416' },
  { chapter: 'Chapter 7', chapter_title: 'Approved Arrangements', part: 'Part 4', part_title: 'Suspension of Approved Arrangement', section_range: 'ss 417-421' },
  { chapter: 'Chapter 7', chapter_title: 'Approved Arrangements', part: 'Part 5', part_title: 'Revocation or Expiry', section_range: 'ss 422-426' },
  { chapter: 'Chapter 7', chapter_title: 'Approved Arrangements', part: 'Part 6', part_title: 'Powers and Obligations', section_range: 'ss 427-432' },
  { chapter: 'Chapter 7', chapter_title: 'Approved Arrangements', part: 'Part 7', part_title: 'Other Provisions', section_range: 'ss 433-441' },

  // Chapter 8
  { chapter: 'Chapter 8', chapter_title: 'Biosecurity Emergencies and Human Biosecurity Emergencies', part: 'Part 1', part_title: 'Biosecurity Emergencies', section_range: 'ss 442-472' },
  { chapter: 'Chapter 8', chapter_title: 'Biosecurity Emergencies and Human Biosecurity Emergencies', part: 'Part 2', part_title: 'Human Biosecurity Emergencies', section_range: 'ss 473-479' },

  // Chapter 9
  { chapter: 'Chapter 9', chapter_title: 'Compliance and Enforcement', part: 'Part 1', part_title: 'Monitoring', section_range: 'ss 480-482' },
  { chapter: 'Chapter 9', chapter_title: 'Compliance and Enforcement', part: 'Part 2', part_title: 'Investigation', section_range: 'ss 483-485' },
  { chapter: 'Chapter 9', chapter_title: 'Compliance and Enforcement', part: 'Part 3', part_title: 'Warrants', section_range: 'ss 486-495' },
  { chapter: 'Chapter 9', chapter_title: 'Compliance and Enforcement', part: 'Part 4', part_title: 'General Rules — Warrant/Consent Entry', section_range: 'ss 496-508' },
  { chapter: 'Chapter 9', chapter_title: 'Compliance and Enforcement', part: 'Part 5', part_title: 'Entry Without Warrant or Consent', section_range: 'ss 509-517' },
  { chapter: 'Chapter 9', chapter_title: 'Compliance and Enforcement', part: 'Part 6', part_title: 'Civil Penalties', section_range: 'ss 518-521' },
  { chapter: 'Chapter 9', chapter_title: 'Compliance and Enforcement', part: 'Part 7', part_title: 'Infringement Notices', section_range: 'ss 522-524A' },
  { chapter: 'Chapter 9', chapter_title: 'Compliance and Enforcement', part: 'Part 8', part_title: 'Enforceable Undertakings', section_range: 'ss 525-526' },
  { chapter: 'Chapter 9', chapter_title: 'Compliance and Enforcement', part: 'Part 9', part_title: 'Injunctions', section_range: 'ss 527-528' },
  { chapter: 'Chapter 9', chapter_title: 'Compliance and Enforcement', part: 'Part 10', part_title: 'Miscellaneous', section_range: 'ss 529-538' },

  // Chapter 10
  { chapter: 'Chapter 10', chapter_title: 'Governance and Officials', part: 'Part 2', part_title: 'Director of Biosecurity', section_range: 'ss 540-543' },
  { chapter: 'Chapter 10', chapter_title: 'Governance and Officials', part: 'Part 3', part_title: 'Director of Human Biosecurity', section_range: 'ss 544-544A' },
  { chapter: 'Chapter 10', chapter_title: 'Governance and Officials', part: 'Part 4', part_title: 'Biosecurity Officers and Enforcement Officers', section_range: 'ss 545-561' },
  { chapter: 'Chapter 10', chapter_title: 'Governance and Officials', part: 'Part 5', part_title: 'Chief Human Biosecurity Officers and Officers', section_range: 'ss 562-566' },
  { chapter: 'Chapter 10', chapter_title: 'Governance and Officials', part: 'Part 6', part_title: 'Inspector-General of Biosecurity', section_range: 'ss 566A-568' },
  { chapter: 'Chapter 10', chapter_title: 'Governance and Officials', part: 'Part 7', part_title: 'Miscellaneous', section_range: 'ss 569-572' },
];

const insertAct = db.prepare(`INSERT INTO biosecurity_act (chapter, chapter_title, part, part_title, division, division_title, section_range) VALUES (@chapter, @chapter_title, @part, @part_title, @division, @division_title, @section_range)`);
db.transaction(() => { for (const r of actRows) insertAct.run({ chapter: r.chapter, chapter_title: r.chapter_title, part: r.part || null, part_title: r.part_title || null, division: r.division || null, division_title: r.division_title || null, section_range: r.section_range || null }); })();

// ── Biosecurity Regulation 2016 ─────────────────────────────────────

db.exec(`
  DROP TABLE IF EXISTS biosecurity_regs;
  CREATE TABLE biosecurity_regs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter TEXT NOT NULL,
    chapter_title TEXT NOT NULL,
    part TEXT,
    part_title TEXT,
    division TEXT,
    division_title TEXT,
    section_range TEXT
  );
  CREATE INDEX idx_bio_regs_chapter ON biosecurity_regs(chapter);
`);

const regRows: BioRow[] = [
  { chapter: 'Chapter 1', chapter_title: 'Preliminary', part: 'Part 1', part_title: 'Preliminary', section_range: 'ss 1-4' },
  { chapter: 'Chapter 1', chapter_title: 'Preliminary', part: 'Part 2', part_title: 'Definitions', section_range: 'ss 5-8' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 1', part_title: 'Notice of Goods to Be Unloaded', division: 'Division 1', division_title: 'Preliminary', section_range: 's 9' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 1', part_title: 'Notice of Goods to Be Unloaded', division: 'Division 2', division_title: 'Goods in Australian territory', section_range: 'ss 10-14' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 1', part_title: 'Notice of Goods to Be Unloaded', division: 'Division 3', division_title: 'Goods in external territories', section_range: 's 15' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 1', part_title: 'Notice of Goods to Be Unloaded', division: 'Division 4', division_title: 'Exceptions', section_range: 's 16' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 2', part_title: 'Goods Brought Into Australian Territory', section_range: 'ss 17-21' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 3', part_title: 'Release of Goods from Biosecurity Control', section_range: 's 22' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 4', part_title: 'Biosecurity Import Risk Analyses', division: 'Division 1', division_title: 'BIRA process', section_range: 'ss 23-32' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 4', part_title: 'Biosecurity Import Risk Analyses', division: 'Division 2', division_title: 'Reviews by Inspector-General', section_range: 'ss 33-39' },
  { chapter: 'Chapter 2', chapter_title: 'Managing Biosecurity Risks: Goods', part: 'Part 5', part_title: 'Permits', section_range: 'ss 40-45' },
  { chapter: 'Chapter 3', chapter_title: 'Managing Biosecurity Risks: Conveyances', part: 'Part 1', part_title: 'Pre-Arrival Reporting', section_range: 'ss 46-51A' },
  { chapter: 'Chapter 3', chapter_title: 'Managing Biosecurity Risks: Conveyances', part: 'Part 2', part_title: 'Conveyances Entering Australian Territory', section_range: 'ss 52-55' },
  { chapter: 'Chapter 3', chapter_title: 'Managing Biosecurity Risks: Conveyances', part: 'Part 3', part_title: 'First Points of Entry', section_range: 'ss 56-59' },
  { chapter: 'Chapter 5', chapter_title: 'Monitoring, Control and Response', section_range: 's 78' },
  { chapter: 'Chapter 6', chapter_title: 'Approved Arrangements', part: 'Part 1', part_title: 'Approval', section_range: 'ss 79-80' },
  { chapter: 'Chapter 6', chapter_title: 'Approved Arrangements', part: 'Part 2', part_title: 'Suspension', section_range: 'ss 81-82' },
  { chapter: 'Chapter 6', chapter_title: 'Approved Arrangements', part: 'Part 3', part_title: 'Revocation', section_range: 's 83' },
  { chapter: 'Chapter 6', chapter_title: 'Approved Arrangements', part: 'Part 4', part_title: 'General Provisions', section_range: 'ss 84-86' },
  { chapter: 'Chapter 7', chapter_title: 'Compliance and Enforcement', section_range: 'ss 87-88' },
  { chapter: 'Chapter 8', chapter_title: 'Governance and Officials', part: 'Part 1', part_title: 'Preliminary', section_range: 's 89' },
  { chapter: 'Chapter 8', chapter_title: 'Governance and Officials', part: 'Part 2', part_title: 'Annual Review Program', section_range: 'ss 90-92' },
  { chapter: 'Chapter 8', chapter_title: 'Governance and Officials', part: 'Part 3', part_title: 'Review Process', section_range: 'ss 93-95' },
  { chapter: 'Chapter 8', chapter_title: 'Governance and Officials', part: 'Part 4', part_title: 'Review Reports', section_range: 'ss 96-100' },
  { chapter: 'Chapter 8', chapter_title: 'Governance and Officials', part: 'Part 5', part_title: 'Other Matters', section_range: 'ss 101-103' },
  { chapter: 'Chapter 9', chapter_title: 'Miscellaneous', part: 'Part 2', part_title: 'Cost Recovery — Fees', section_range: 'ss 105-107A' },
  { chapter: 'Chapter 9', chapter_title: 'Miscellaneous', part: 'Part 2', part_title: 'Cost Recovery — Payment', section_range: 'ss 108-112' },
  { chapter: 'Chapter 9', chapter_title: 'Miscellaneous', part: 'Part 3', part_title: 'Compensation', section_range: 'ss 113-115' },
  { chapter: 'Chapter 9', chapter_title: 'Miscellaneous', part: 'Part 4', part_title: 'Torres Strait', section_range: 'ss 116-120' },
  { chapter: 'Chapter 10', chapter_title: 'Transitional Matters', section_range: 'ss 121-125' },
];

const insertReg = db.prepare(`INSERT INTO biosecurity_regs (chapter, chapter_title, part, part_title, division, division_title, section_range) VALUES (@chapter, @chapter_title, @part, @part_title, @division, @division_title, @section_range)`);
db.transaction(() => { for (const r of regRows) insertReg.run({ chapter: r.chapter, chapter_title: r.chapter_title, part: r.part || null, part_title: r.part_title || null, division: r.division || null, division_title: r.division_title || null, section_range: r.section_range || null }); })();

// FTS
db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS biosecurity_act_fts USING fts5(chapter, chapter_title, part, part_title, division, division_title, section_range, content='biosecurity_act', content_rowid='id');
  INSERT INTO biosecurity_act_fts(biosecurity_act_fts) VALUES('rebuild');
  CREATE VIRTUAL TABLE IF NOT EXISTS biosecurity_regs_fts USING fts5(chapter, chapter_title, part, part_title, division, division_title, section_range, content='biosecurity_regs', content_rowid='id');
  INSERT INTO biosecurity_regs_fts(biosecurity_regs_fts) VALUES('rebuild');
`);

const ac = (db.prepare('SELECT COUNT(*) as cnt FROM biosecurity_act').get() as { cnt: number }).cnt;
const rc = (db.prepare('SELECT COUNT(*) as cnt FROM biosecurity_regs').get() as { cnt: number }).cnt;
console.log(`Seeded ${ac} Biosecurity Act entries and ${rc} Biosecurity Regulation entries`);
db.close();
