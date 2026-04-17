import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  DROP TABLE IF EXISTS cbp_rulings;
  CREATE TABLE cbp_rulings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    category_title TEXT NOT NULL,
    item_title TEXT NOT NULL,
    description TEXT,
    detail TEXT,
    reference TEXT,
    notes TEXT
  );
  CREATE INDEX idx_cbp_category ON cbp_rulings(category);
`);

interface CBP { category: string; category_title: string; item_title: string; description?: string; detail?: string; reference?: string; notes?: string; }

const items: CBP[] = [
  // Overview
  { category: 'Overview', category_title: 'CROSS System Overview', item_title: 'What is CROSS?', description: 'Customs Rulings Online Search System — CBP database of 220,000+ binding administrative rulings', detail: 'Searchable by keyword, ruling number, HTS code, or date range. Covers classification, valuation, marking, origin, and trade program rulings.', reference: 'https://rulings.cbp.gov/', notes: 'Rulings are binding on all CBP personnel until modified or revoked' },
  { category: 'Overview', category_title: 'CROSS System Overview', item_title: 'Ruling Authority — New York (NY)', description: 'National Commodity Specialist Division (NCSD) rulings — prefix N followed by 6-digit code', detail: 'Limited to tariff classification matters. Day-to-day classification questions. Over 200,000 rulings from 1989-present.', reference: 'Example: NY N340984', notes: 'Most common ruling type for classification questions' },
  { category: 'Overview', category_title: 'CROSS System Overview', item_title: 'Ruling Authority — Headquarters (HQ)', description: 'Office of Trade, Washington D.C. rulings — prefix H followed by 6-digit code', detail: 'Broader scope covering all customs-related topics. Carries greater weight than NY rulings. Includes reconsiderations and modifications.', reference: 'Example: HQ H340949', notes: 'HQ rulings supersede NY rulings on the same subject' },

  // Ruling Types
  { category: 'Ruling Types', category_title: 'Types of CBP Rulings', item_title: 'Classification Rulings', description: 'Determine which Harmonized Tariff Schedule (HTS) provisions apply to specific goods', detail: 'Most common ruling type. Based on General Rules of Interpretation (GRI), Section/Chapter Notes, and Explanatory Notes.', reference: '19 CFR Part 177' },
  { category: 'Ruling Types', category_title: 'Types of CBP Rulings', item_title: 'Valuation Rulings', description: 'Define the appraised value of imported goods used to assess import duty amounts', detail: 'Based on transaction value, deductive value, computed value, or fallback methods under 19 USC 1401a.', reference: '19 CFR Part 177' },
  { category: 'Ruling Types', category_title: 'Types of CBP Rulings', item_title: 'Country of Origin Rulings', description: 'Determine where goods originate for marking, quota, and trade program purposes', detail: 'Based on substantial transformation test or tariff shift rules under specific trade agreements.', reference: '19 CFR Part 134' },
  { category: 'Ruling Types', category_title: 'Types of CBP Rulings', item_title: 'Marking Rulings', description: 'Specify the appropriate method of marking goods with country of origin', detail: 'All imported goods must be marked with country of origin unless excepted. Marking must be conspicuous, legible, and permanent.', reference: '19 USC 1304' },
  { category: 'Ruling Types', category_title: 'Types of CBP Rulings', item_title: 'Trade Program/Agreement Rulings', description: 'Determine eligibility under USMCA, NAFTA, GSP, AGOA, AUSFTA, and other trade programs', detail: 'Rulings on whether goods qualify for preferential tariff treatment under specific trade agreements.', reference: 'Various FTA implementing legislation' },
  { category: 'Ruling Types', category_title: 'Types of CBP Rulings', item_title: 'Internal Advice Decisions', description: 'Cover current import and carrier transactions — issued internally within CBP', detail: 'Address questions from CBP field offices about pending transactions.', reference: '19 CFR 177.11' },
  { category: 'Ruling Types', category_title: 'Types of CBP Rulings', item_title: 'Protest Review Decisions', description: 'Appeals of CBP determinations on completed transactions', detail: 'Importers can protest CBP decisions within 180 days of liquidation.', reference: '19 USC 1514' },

  // Request Process
  { category: 'Request Process', category_title: 'How to Request a Ruling', item_title: 'Electronic Filing (eRulings)', description: 'Recommended method — file via eRulings Template at erulings.cbp.gov', detail: 'Acknowledgement within 1 business day with control number. Available for classification, marking, origin, NAFTA, trade program rulings.', reference: 'https://erulings.cbp.gov/s/' },
  { category: 'Request Process', category_title: 'How to Request a Ruling', item_title: 'Required Information', description: 'Complete statement of all relevant facts, applicant details, product description', detail: 'For classification: full product description, chief use in US, commercial/technical designation. For composite goods: relative quantity by weight and volume of each material.', reference: '19 CFR 177.2' },
  { category: 'Request Process', category_title: 'How to Request a Ruling', item_title: 'Processing Timeline', description: 'General: 30 calendar days from receipt. HQ referral: within 90 days.', detail: 'May extend if laboratory reports or inter-agency consultation required. eRuling acknowledgement within 1 business day.', reference: '19 CFR Part 177' },
  { category: 'Request Process', category_title: 'How to Request a Ruling', item_title: 'Who Can Request', description: 'Any importer, exporter, or authorized agent with direct interest in a transaction', detail: 'Must have a direct and demonstrable interest in the question presented. Governed by 19 CFR Part 177.', reference: '19 CFR 177.1' },

  // Recent Examples
  { category: 'Recent Rulings', category_title: 'Recent Ruling Examples', item_title: 'NY N340984 — Stand-Up All-Terrain Vehicle', description: 'Tariff classification of a stand-up all-terrain vehicle', detail: 'Issued July 11, 2024 by National Commodity Specialist Division', reference: 'NY N340984' },
  { category: 'Recent Rulings', category_title: 'Recent Ruling Examples', item_title: 'HQ H340949 — Affirmation of ATV Classification', description: 'Headquarters affirmation of NY N340984 regarding ATV classification', detail: 'Issued October 21, 2024 — confirmed NY ruling on tariff classification', reference: 'HQ H340949' },
  { category: 'Recent Rulings', category_title: 'Recent Ruling Examples', item_title: 'HQ H300226 — Electric Motors Country of Origin', description: 'Modification of NY N299096 regarding country of origin of electric motors from Mexico', detail: 'Issued September 13, 2018 — addressed substantial transformation analysis for motors', reference: 'HQ H300226' },

  // US Tariff Context
  { category: 'US Tariff Context', category_title: 'US Tariff & Trade Context', item_title: 'Section 232 Tariffs', description: 'National security tariffs on steel (25%), aluminium (10-25%), copper, automobiles', detail: 'Additional duties imposed under Section 232 of the Trade Expansion Act of 1962. Applies globally with limited exemptions.', reference: 'Trade Expansion Act 1962, s.232' },
  { category: 'US Tariff Context', category_title: 'US Tariff & Trade Context', item_title: 'Section 301 Tariffs', description: 'Retaliatory tariffs on imports from China and Nicaragua', detail: 'Additional duties of 7.5-100% on various Chinese goods. Based on unfair trade practices findings.', reference: 'Trade Act 1974, s.301' },
  { category: 'US Tariff Context', category_title: 'US Tariff & Trade Context', item_title: 'AUSFTA (Australia-US FTA)', description: 'Australia-United States Free Trade Agreement — preferential tariff treatment', detail: 'CBP issues advance rulings on tariff classification, customs valuation, country of origin, and FTA originating qualification for AUSFTA goods.', reference: 'https://www.cbp.gov/trade/free-trade-agreements/australia' },
  { category: 'US Tariff Context', category_title: 'US Tariff & Trade Context', item_title: 'USMCA (US-Mexico-Canada)', description: 'United States-Mexico-Canada Agreement replacing NAFTA', detail: 'Rules of origin, tariff preference levels, and advance ruling provisions for North American trade.', reference: 'USMCA Implementation Act' },

  // Australian Relevance
  { category: 'Australian Relevance', category_title: 'Relevance to Australian Importers', item_title: 'Researching US Tariff Treatment', description: 'Australian exporters can search CROSS for precedents on how CBP classifies similar products', detail: 'Useful for understanding US tariff treatment before exporting to the US. Rulings are publicly available and searchable.', notes: 'Search at rulings.cbp.gov' },
  { category: 'Australian Relevance', category_title: 'Relevance to Australian Importers', item_title: 'HS Code Cross-Reference', description: 'US HTS codes share the first 6 digits with Australian tariff codes (both based on WCO HS)', detail: 'CBP classification reasoning for 6-digit HS codes can inform Australian classification decisions, though national extensions (7-8 digits) differ.', notes: 'First 6 digits are internationally standardized' },
  { category: 'Australian Relevance', category_title: 'Relevance to Australian Importers', item_title: 'Requesting AUSFTA Advance Rulings', description: 'Australian exporters can request binding advance rulings from CBP for US-bound goods', detail: 'Covers tariff classification, customs valuation, country of origin, and AUSFTA originating qualification. Free service.', reference: '19 CFR Part 177', notes: 'Apply via erulings.cbp.gov' },

  // Legal Framework
  { category: 'Legal Framework', category_title: 'Legal & Regulatory Framework', item_title: '19 CFR Part 177 — Administrative Rulings', description: 'Federal regulation governing the CBP binding ruling program', detail: 'Establishes procedures for requesting, issuing, modifying, and revoking binding rulings.', reference: 'Code of Federal Regulations, Title 19, Part 177' },
  { category: 'Legal Framework', category_title: 'Legal & Regulatory Framework', item_title: '19 USC 1625 — Interpretive Rulings and Decisions', description: 'Statutory authority for CBP to issue binding interpretive rulings', detail: 'Requires notice and comment before modifying or revoking published rulings or treatment.', reference: 'Title 19 United States Code, Section 1625' },
  { category: 'Legal Framework', category_title: 'Legal & Regulatory Framework', item_title: 'Harmonized Tariff Schedule of the US (HTSUS)', description: 'US tariff classification system based on WCO Harmonized System', detail: '99 chapters, extended to 10-digit codes for US statistical purposes. First 6 digits match international HS codes.', reference: 'https://hts.usitc.gov/' },
];

const insert = db.prepare(`INSERT INTO cbp_rulings (category, category_title, item_title, description, detail, reference, notes) VALUES (@category, @category_title, @item_title, @description, @detail, @reference, @notes)`);
db.transaction(() => { for (const i of items) insert.run({ ...i, description: i.description || null, detail: i.detail || null, reference: i.reference || null, notes: i.notes || null }); })();

db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS cbp_rulings_fts USING fts5(item_title, category, description, detail, reference, notes, content='cbp_rulings', content_rowid='id');
  INSERT INTO cbp_rulings_fts(cbp_rulings_fts) VALUES('rebuild');
`);

const count = (db.prepare('SELECT COUNT(*) as cnt FROM cbp_rulings').get() as { cnt: number }).cnt;
console.log(`Seeded ${count} CBP CROSS ruling entries`);
db.close();
