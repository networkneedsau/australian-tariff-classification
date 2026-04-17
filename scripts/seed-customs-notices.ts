import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  DROP TABLE IF EXISTS customs_notices;
  CREATE TABLE customs_notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    notice_number TEXT NOT NULL,
    title TEXT NOT NULL,
    year INTEGER NOT NULL,
    category TEXT NOT NULL,
    summary TEXT,
    effective_date TEXT
  );
  CREATE INDEX idx_cn_year ON customs_notices(year);
  CREATE INDEX idx_cn_category ON customs_notices(category);
`);

interface CN { notice_number: string; title: string; year: number; category: string; summary?: string; effective_date?: string; }

const notices: CN[] = [
  // 2025
  { notice_number: 'ACN 2025/05', title: 'Tobacco duty rates indexation', year: 2025, category: 'Duty & Revenue', summary: 'Indexation of customs duty rates for tobacco and tobacco products' },
  { notice_number: 'ACN 2025/16', title: 'Biosecurity cost recovery charge increases', year: 2025, category: 'Charges & Fees', summary: 'Biosecurity cost recovery charges — air: $46, sea: $68 from 1 July 2025', effective_date: '1 July 2025' },
  { notice_number: 'ACN 2025/19', title: 'Indexation of excise-equivalent goods duty rates', year: 2025, category: 'Duty & Revenue', summary: 'Indexation of customs duty rates for excise-equivalent goods', effective_date: '4 August 2025' },
  { notice_number: 'ACN 2025/23', title: 'Spirits and alcohol duty indexation', year: 2025, category: 'Duty & Revenue', summary: 'Indexation of customs duty rates for spirits and other alcoholic beverages' },
  { notice_number: 'ACN 2025/32', title: 'CPD and licensing updates', year: 2025, category: 'Broker Licensing', summary: 'Updates to Continuing Professional Development requirements and customs broker licensing' },

  // 2024
  { notice_number: 'ACN 2024/01', title: 'Indexation of customs duty rates', year: 2024, category: 'Duty & Revenue', summary: 'General indexation of customs duty rates for the period' },
  { notice_number: 'ACN 2024/02', title: 'Excise-equivalent goods duty indexation', year: 2024, category: 'Duty & Revenue', summary: 'Indexation of duty rates for spirits, beers, and fuel', effective_date: '5 February 2024' },
  { notice_number: 'ACN 2024/08', title: 'Tobacco product duty rates', year: 2024, category: 'Duty & Revenue', summary: 'Updated customs duty rates for tobacco products' },
  { notice_number: 'ACN 2024/17', title: 'Extending duty-free rates for Ukrainian goods', year: 2024, category: 'FTA & Preferential', summary: 'Extension of temporary duty reduction for Ukrainian goods to 3 July 2026; 457 tariff subheadings reduced to free', effective_date: '1 July 2024' },
  { notice_number: 'ACN 2024/20', title: 'Application procedures for customs broker licences', year: 2024, category: 'Broker Licensing', summary: 'Updated procedures for applying for customs broker licences' },
  { notice_number: 'ACN 2024/21', title: 'Additional customs broker licence conditions', year: 2024, category: 'Broker Licensing', summary: 'New additional conditions applied to customs broker licences', effective_date: '1 July 2024' },
  { notice_number: 'ACN 2024/24', title: 'Prohibition of certain small air conditioning equipment', year: 2024, category: 'Prohibited Goods', summary: 'Prohibition on importation of certain small air conditioning equipment', effective_date: '1 July 2024' },
  { notice_number: 'ACN 2024/25', title: 'Recycling and Waste Reduction (Export – Paper and Cardboard) Rules 2024', year: 2024, category: 'Prohibited Goods', summary: 'Commencement of export rules for paper and cardboard waste under recycling legislation' },
  { notice_number: 'ACN 2024/29', title: 'Excise-equivalent goods duty rates', year: 2024, category: 'Duty & Revenue', summary: 'Updated duty rates for excise-equivalent goods', effective_date: '5 August 2024' },
  { notice_number: 'ACN 2024/31', title: 'Customs duty rates for tobacco and tobacco products', year: 2024, category: 'Duty & Revenue', summary: 'Updated customs duty rates for tobacco and tobacco products' },
  { notice_number: 'ACN 2024/36', title: 'CPD requirements for licensed customs brokers', year: 2024, category: 'Broker Licensing', summary: 'Continuing Professional Development module for licensed customs brokers', effective_date: '8 October 2024' },
  { notice_number: 'ACN 2024/41', title: 'Remission of excise-equivalent goods duty on imported bunker fuel', year: 2024, category: 'Duty & Revenue', summary: 'Remission of duty on imported bunker fuel', effective_date: '1 January 2025' },
  { notice_number: 'ACN 2024/44', title: 'Preferential rates under RCEP, ECTA, and A-UKFTA', year: 2024, category: 'FTA & Preferential', summary: 'Updated preferential rates under RCEP, EU-Australia, and Australia-UK FTA; suspension of UK steel preferences', effective_date: '24 December 2024' },

  // 2023
  { notice_number: 'ACN 2023/20', title: 'Customs broker qualifications and Diploma of Customs Broking', year: 2023, category: 'Broker Licensing', summary: 'Updated qualifications requirements including the Diploma of Customs Broking' },
  { notice_number: 'ACN 2023/29', title: 'Temporary duty reduction on Ukrainian goods', year: 2023, category: 'FTA & Preferential', summary: 'Temporary reduction of duty on goods from Ukraine', effective_date: '4 July 2023' },
  { notice_number: 'ACN 2023/39', title: 'Alcohol and spirits indexation', year: 2023, category: 'Duty & Revenue', summary: 'Indexation of customs duty rates for alcohol and spirit products' },
  { notice_number: 'ACN 2023/49', title: 'Prohibited imports/exports and scheduled substances', year: 2023, category: 'Prohibited Goods', summary: 'Updates to prohibited imports and exports under international conventions including scheduled substances' },
];

const insert = db.prepare(`INSERT INTO customs_notices (notice_number, title, year, category, summary, effective_date) VALUES (@notice_number, @title, @year, @category, @summary, @effective_date)`);
db.transaction(() => { for (const n of notices) insert.run({ ...n, summary: n.summary || null, effective_date: n.effective_date || null }); })();

// FTS
db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS customs_notices_fts USING fts5(notice_number, title, category, summary, content='customs_notices', content_rowid='id');
  INSERT INTO customs_notices_fts(customs_notices_fts) VALUES('rebuild');
`);

const count = (db.prepare('SELECT COUNT(*) as cnt FROM customs_notices').get() as { cnt: number }).cnt;
console.log(`Seeded ${count} Australian Customs Notices`);
db.close();
