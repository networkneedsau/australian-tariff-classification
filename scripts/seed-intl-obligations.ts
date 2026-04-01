import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  DROP TABLE IF EXISTS intl_obligations_regs;
  CREATE TABLE intl_obligations_regs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part TEXT NOT NULL,
    part_title TEXT NOT NULL,
    division TEXT,
    division_title TEXT,
    regulation_number TEXT NOT NULL,
    regulation_title TEXT NOT NULL,
    content TEXT
  );
  CREATE INDEX idx_ior_part ON intl_obligations_regs(part);
`);

interface IOReg { part: string; part_title: string; division?: string; division_title?: string; regulation_number: string; regulation_title: string; content?: string; }

const regs: IOReg[] = [
  // Part 1
  { part: 'Part 1', part_title: 'Preliminary', regulation_number: '1', regulation_title: 'Name', content: 'This regulation is the Customs (International Obligations) Regulation 2015.' },
  { part: 'Part 1', part_title: 'Preliminary', regulation_number: '3', regulation_title: 'Authority', content: 'This regulation is made under the Customs Act 1901.' },
  { part: 'Part 1', part_title: 'Preliminary', regulation_number: '4', regulation_title: 'Definitions', content: 'Definitions of key terms used throughout the regulation including references to various free trade agreements.' },

  // Part 2
  { part: 'Part 2', part_title: 'Exemptions Under Torres Strait Treaty', regulation_number: '5', regulation_title: 'Notices requesting exemption', content: 'Provisions for exemptions under the Torres Strait Treaty for traditional inhabitants.' },

  // Part 3 — Exportation of Goods
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 1', division_title: 'Exportation of goods to Singapore', regulation_number: '7A', regulation_title: 'Record keeping — producer of goods claimed to be Australian originating goods' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 1', division_title: 'Exportation of goods to Singapore', regulation_number: '8A', regulation_title: 'Record keeping — other exporters' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 1', division_title: 'Exportation of goods to Singapore', regulation_number: '9', regulation_title: 'Form in which records are to be kept' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 2', division_title: 'Exportation of goods to Thailand', regulation_number: '10', regulation_title: 'Record keeping by exporters who are not the producer' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 2', division_title: 'Exportation of goods to Thailand', regulation_number: '11', regulation_title: 'Record keeping by the producer' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 2', division_title: 'Exportation of goods to Thailand', regulation_number: '12', regulation_title: 'Form in which records are to be kept' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 3', division_title: 'Exportation of goods to New Zealand', regulation_number: '13', regulation_title: 'Record keeping by exporters who are not the producer or principal manufacturer' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 3', division_title: 'Exportation of goods to New Zealand', regulation_number: '14', regulation_title: 'Record keeping by the producer or principal manufacturer' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 4', division_title: 'Exportation of goods to Chile', regulation_number: '14A', regulation_title: 'Record keeping for Chile FTA' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 5', division_title: 'Exportation of goods to the US', regulation_number: '14B', regulation_title: 'Record keeping for AUSFTA' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 6', division_title: 'Exportation of goods to ASEAN countries', regulation_number: '14C', regulation_title: 'Record keeping for AANZFTA' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 7', division_title: 'Exportation of goods to Japan', regulation_number: '14D', regulation_title: 'Record keeping for JAEPA' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 8', division_title: 'Exportation of goods to Korea', regulation_number: '14E', regulation_title: 'Record keeping for KAFTA' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 9', division_title: 'Exportation of goods to China', regulation_number: '14F', regulation_title: 'Record keeping for ChAFTA' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 10', division_title: 'Exportation of goods to TPP/CPTPP countries', regulation_number: '14G', regulation_title: 'Record keeping for CPTPP' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 11', division_title: 'Exportation of goods to Indonesia', regulation_number: '14H', regulation_title: 'Record keeping for IA-CEPA' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 12', division_title: 'Exportation of goods to Hong Kong', regulation_number: '14J', regulation_title: 'Record keeping for A-HKFTA' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 13', division_title: 'Exportation of goods to RCEP countries', regulation_number: '14K', regulation_title: 'Record keeping for RCEP' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 14', division_title: 'Exportation of goods to the UK', regulation_number: '14L', regulation_title: 'Record keeping for A-UKFTA' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 15', division_title: 'Exportation of goods to India', regulation_number: '14M', regulation_title: 'Record keeping for AI-ECTA' },
  { part: 'Part 3', part_title: 'Exportation of Goods', division: 'Division 16', division_title: 'Exportation of goods to UAE', regulation_number: '14N', regulation_title: 'Record keeping for Australia-UAE CEPA' },

  // Part 4
  { part: 'Part 4', part_title: 'Importation of Goods', regulation_number: '21', regulation_title: 'Dealing with goods brought into Australia on a temporary basis', content: 'Provisions for temporary importation of goods, including conditions and time limits for re-exportation.' },

  // Part 5
  { part: 'Part 5', part_title: 'Refunds, Rebates and Remissions of Duty', division: 'Division 1', division_title: 'Preliminary', regulation_number: '22', regulation_title: 'Definitions for Part 5' },
  { part: 'Part 5', part_title: 'Refunds, Rebates and Remissions of Duty', division: 'Division 2', division_title: 'Circumstances for refund, rebate or remission', regulation_number: '23', regulation_title: 'Circumstances for refunds, rebates and remissions of duty', content: 'Sets out the circumstances under which refunds, rebates and remissions of customs duty may be granted under various FTAs.' },
  { part: 'Part 5', part_title: 'Refunds, Rebates and Remissions of Duty', division: 'Division 3', division_title: 'Conditions for refund, rebate or remission', regulation_number: '24', regulation_title: 'Conditions for refund, rebate or remission of duty' },
  { part: 'Part 5', part_title: 'Refunds, Rebates and Remissions of Duty', division: 'Division 4', division_title: 'Amount of refund, rebate or remission', regulation_number: '31', regulation_title: 'Calculation of refund, rebate or remission of duty' },

  // Part 6
  { part: 'Part 6', part_title: 'UN-Sanctioned Goods', regulation_number: '32', regulation_title: 'UN-sanctioned goods', content: 'Provisions relating to goods that are subject to United Nations Security Council sanctions.' },

  // Part 7
  { part: 'Part 7', part_title: 'Drawback of Import Duty', division: 'Division 1', division_title: 'Drawback of dumping duty', regulation_number: '33', regulation_title: 'Reference to import duty to include relevant dumping duty' },
  { part: 'Part 7', part_title: 'Drawback of Import Duty', division: 'Division 2', division_title: 'Goods for which drawback may be paid', regulation_number: '34', regulation_title: 'Drawback — general' },
  { part: 'Part 7', part_title: 'Drawback of Import Duty', division: 'Division 2', division_title: 'Goods for which drawback may be paid', regulation_number: '35', regulation_title: 'Drawback — manufactured or processed goods' },
  { part: 'Part 7', part_title: 'Drawback of Import Duty', division: 'Division 3', division_title: 'Circumstances when drawback is not payable', regulation_number: '36', regulation_title: 'Circumstances when drawback is not payable' },
  { part: 'Part 7', part_title: 'Drawback of Import Duty', division: 'Division 4', division_title: 'Conditions relating to drawback', regulation_number: '37', regulation_title: 'Conditions for drawback' },
  { part: 'Part 7', part_title: 'Drawback of Import Duty', division: 'Division 4', division_title: 'Conditions relating to drawback', regulation_number: '38', regulation_title: 'Additional conditions for tobacco' },
  { part: 'Part 7', part_title: 'Drawback of Import Duty', division: 'Division 4', division_title: 'Conditions relating to drawback', regulation_number: '39', regulation_title: 'Goods imported more than once' },
  { part: 'Part 7', part_title: 'Drawback of Import Duty', division: 'Division 5', division_title: 'Amount of claim for drawback', regulation_number: '40', regulation_title: 'Amount of claim for drawback' },

  // Part 8
  { part: 'Part 8', part_title: 'Anti-Dumping Duties', division: 'Division 1', division_title: 'Ordinary course of trade', regulation_number: '43', regulation_title: 'Determination of cost of production or manufacture' },
  { part: 'Part 8', part_title: 'Anti-Dumping Duties', division: 'Division 1', division_title: 'Ordinary course of trade', regulation_number: '44', regulation_title: 'Determination of administrative, selling and general costs' },
  { part: 'Part 8', part_title: 'Anti-Dumping Duties', division: 'Division 2', division_title: 'Normal value of goods', regulation_number: '45', regulation_title: 'Determination of profit' },
  { part: 'Part 8', part_title: 'Anti-Dumping Duties', division: 'Division 2', division_title: 'Normal value of goods', regulation_number: '46', regulation_title: 'Determining conditions' },
  { part: 'Part 8', part_title: 'Anti-Dumping Duties', division: 'Division 2', division_title: 'Normal value of goods', regulation_number: '47', regulation_title: 'Determination of value for specified countries' },
  { part: 'Part 8', part_title: 'Anti-Dumping Duties', division: 'Division 3', division_title: 'Circumvention activities', regulation_number: '48', regulation_title: 'Circumvention activities', content: 'Defines circumvention activities for anti-dumping purposes and the criteria for determining whether circumvention has occurred.' },

  // Part 9
  { part: 'Part 9', part_title: 'Transitional Matters', regulation_number: '49', regulation_title: 'Approved forms and approved statements' },
  { part: 'Part 9', part_title: 'Transitional Matters', regulation_number: '50', regulation_title: 'Amendments made by the Australian Border Force Regulation 2015' },
  { part: 'Part 9', part_title: 'Transitional Matters', regulation_number: '51', regulation_title: 'Amendments made by the Anti-Dumping Regulation 2015' },

  // Schedules
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 1', regulation_title: 'UN-sanctioned goods', content: 'List of goods subject to United Nations Security Council sanctions restrictions on importation.' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 2', regulation_title: 'Countries to which subsection 269TAC(5D) of the Act does not apply', content: 'List of countries to which the market economy provisions of the anti-dumping system do not apply.' },
];

const insert = db.prepare(`INSERT INTO intl_obligations_regs (part, part_title, division, division_title, regulation_number, regulation_title, content) VALUES (@part, @part_title, @division, @division_title, @regulation_number, @regulation_title, @content)`);
db.transaction(() => { for (const r of regs) insert.run({ part: r.part, part_title: r.part_title, division: r.division || null, division_title: r.division_title || null, regulation_number: r.regulation_number, regulation_title: r.regulation_title, content: r.content || null }); })();

db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS intl_obligations_fts USING fts5(part, part_title, division, division_title, regulation_number, regulation_title, content, content='intl_obligations_regs', content_rowid='id');
  INSERT INTO intl_obligations_fts(intl_obligations_fts) VALUES('rebuild');
`);

const count = (db.prepare('SELECT COUNT(*) as cnt FROM intl_obligations_regs').get() as { cnt: number }).cnt;
console.log(`Seeded ${count} International Obligations regulations`);
db.close();
