import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  DROP TABLE IF EXISTS tariff_concession_orders;
  CREATE TABLE tariff_concession_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    category_title TEXT NOT NULL,
    item_title TEXT NOT NULL,
    description TEXT,
    detail TEXT,
    reference TEXT,
    notes TEXT
  );
  CREATE INDEX idx_tco_category ON tariff_concession_orders(category);
`);

interface TCO { category: string; category_title: string; item_title: string; description?: string; detail?: string; reference?: string; notes?: string; }

const items: TCO[] = [
  // Overview
  { category: 'Overview', category_title: 'TCO System Overview', item_title: 'What is a TCO?', description: 'A revenue concession enabling duty-free entry of imported goods where no substitutable goods are produced in Australia', detail: 'Approximately 15,000 TCOs currently exist. At least 50 new TCOs are made each month. Goods must precisely match both the tariff classification and the TCO description.', reference: 'Customs Act 1901, Part XVA', notes: 'Item 50 in Schedule 4 of the Customs Tariff Act 1995 provides for TCOs' },
  { category: 'Overview', category_title: 'TCO System Overview', item_title: 'Two conditions for claiming a TCO', description: '1. Goods must be classifiable to the tariff classification to which the TCO applies; 2. Goods must precisely meet the description given to the TCO', detail: 'Penalties apply if goods do not precisely match the TCO description or tariff classification', reference: 'ss 269P, 269Q' },
  { category: 'Overview', category_title: 'TCO System Overview', item_title: 'TCO Number Format', description: 'Format: Year/Sequential Number (e.g., 25/13, 24/42) or extended: ADF2017/73340', detail: 'The TCO number serves as a unique identifier published in the weekly Gazette', reference: 'Gazette' },
  { category: 'Overview', category_title: 'TCO System Overview', item_title: 'Schedule of Concessional Instruments (SCI)', description: 'Contains all existing TCOs (Part 1) and concessional items under Schedule 4 (Part 2)', detail: 'Available at ABF Regional Offices and online. Published by chapter covering 20+ sections.', reference: 'Schedule 4, Customs Tariff Act 1995' },

  // Application Process
  { category: 'Application', category_title: 'Application Process', item_title: 'Form B443 — TCO Application', description: 'Application form for a new Tariff Concession Order', detail: 'Must include: statement of tariff classification, detailed goods description, documentary evidence of searches for local manufacturers, copies of correspondence with manufacturers', reference: 'Form B443' },
  { category: 'Application', category_title: 'Application Process', item_title: 'Form B444 — Objection to TCO', description: 'Form for local manufacturers to object to a TCO being made', detail: 'Objections must be lodged within 50 days of gazettal. Unsuccessful objectors are not identified (privacy protection).', reference: 'Form B444' },
  { category: 'Application', category_title: 'Application Process', item_title: 'Form B441 — Revocation Request', description: 'Form for requesting revocation of an existing TCO', detail: 'Manufacturer must demonstrate they produce substitutable goods in Australia', reference: 'Form B441, s 269SB' },
  { category: 'Application', category_title: 'Application Process', item_title: 'Stage 1: Screening (28 days)', description: 'ABF screens application for completeness within 28 days', detail: 'Incomplete applications may be delayed or rejected', reference: 's 269H' },
  { category: 'Application', category_title: 'Application Process', item_title: 'Stage 2: Gazette & Objection (50 days)', description: 'Application published in weekly Gazette; public objection period opens for minimum 50 days', detail: 'Submissions must be lodged within 50 days of gazettal to be considered', reference: 's 269K' },
  { category: 'Application', category_title: 'Application Process', item_title: 'Stage 3: Decision (50-150 days after Gazette)', description: 'ABF determines whether to make the TCO; notifications published in Gazette', detail: 'TCO comes into force on date the application was lodged (s 269S)', reference: 'ss 269P, 269Q, 269S' },
  { category: 'Application', category_title: 'Application Process', item_title: 'Pre-Application Due Diligence', description: 'Check if suitable TCO already exists in SCI; verify no substitutable goods are produced in Australia', detail: 'Acceptable evidence: Industrial Supplies Office letters, trade directory searches (Kompass), correspondence with industry bodies and manufacturers', reference: 'Home Affairs Notice 2019/21' },

  // Key Legislation
  { category: 'Legislation', category_title: 'Key Customs Act Sections (Part XVA)', item_title: 's 269B — Interpretation', description: 'Defines key terms: goods produced in Australia, ordinary course of business, substitutable goods, repair', reference: 'Customs Act 1901' },
  { category: 'Legislation', category_title: 'Key Customs Act Sections (Part XVA)', item_title: 's 269C — Core Criteria', description: 'Core criteria met if no substitutable goods produced in Australia on application date', reference: 'Customs Act 1901' },
  { category: 'Legislation', category_title: 'Key Customs Act Sections (Part XVA)', item_title: 's 269F — Making a TCO Application', description: 'Requirements for lodging TCO applications', reference: 'Customs Act 1901' },
  { category: 'Legislation', category_title: 'Key Customs Act Sections (Part XVA)', item_title: 's 269G — Applicant\'s Obligation', description: 'Obligations of applicant in the application process', reference: 'Customs Act 1901' },
  { category: 'Legislation', category_title: 'Key Customs Act Sections (Part XVA)', item_title: 's 269P — Making Standard TCO', description: 'Standard TCO approval process for goods with no local substitutes', reference: 'Customs Act 1901' },
  { category: 'Legislation', category_title: 'Key Customs Act Sections (Part XVA)', item_title: 's 269Q — Making TCO for Repair Goods', description: 'Approval for TCO covering goods requiring repair or renovation', reference: 'Customs Act 1901' },
  { category: 'Legislation', category_title: 'Key Customs Act Sections (Part XVA)', item_title: 's 269SB-SC — Revocation Requests', description: 'Procedures for requesting and mandatory revocation when local substitutes exist', detail: 'Revocation comes into force on date the request was lodged', reference: 'Customs Act 1901' },
  { category: 'Legislation', category_title: 'Key Customs Act Sections (Part XVA)', item_title: 's 269SD — CEO Discretionary Revocation', description: 'CEO may revoke TCOs not quoted in import declarations for at least 2 years (unused TCO rule)', reference: 'Customs Act 1901' },
  { category: 'Legislation', category_title: 'Key Customs Act Sections (Part XVA)', item_title: 's 269SK — International Agreement Compliance', description: 'CEO must not make TCO contravening international treaty obligations (WTO, bilateral agreements)', reference: 'Customs Act 1901' },

  // Corresponding Use
  { category: 'Corresponding Use', category_title: 'Corresponding Use & Legal Precedents', item_title: 'Corresponding Use Test', description: 'Five-step analysis to determine if local goods are substitutable for imported TCO goods', detail: '1. What are the TCO goods? 2. What uses can they serve? 3. What are the claimed substitutable goods? 4. What uses can those goods serve? 5. Do the uses correspond?', reference: 'Nufarm framework' },
  { category: 'Corresponding Use', category_title: 'Corresponding Use & Legal Precedents', item_title: 'Downer EDI Rail', description: 'Corresponding use does not mean identical — goods need at least one matching use', reference: 'Legal precedent' },
  { category: 'Corresponding Use', category_title: 'Corresponding Use & Legal Precedents', item_title: 'Zetco', description: 'Substitutable goods is a reference to the ultimate use of the goods', reference: 'Legal precedent' },
  { category: 'Corresponding Use', category_title: 'Corresponding Use & Legal Precedents', item_title: 'Toyota', description: 'Reasonable uses rather than sensible commercial uses — broader interpretation', reference: 'Legal precedent' },
  { category: 'Corresponding Use', category_title: 'Corresponding Use & Legal Precedents', item_title: 'Vestas', description: 'Made-to-order capital equipment and substitutability criteria', reference: 'Legal precedent' },

  // Gazette
  { category: 'Gazette', category_title: 'TCO Gazette', item_title: 'Publication Schedule', description: 'Tariff Concessions Gazette published every Wednesday by ABF', detail: 'Pauses during public holidays; contains TCO applications, TCOs made, revocation requests', reference: 'Commonwealth of Australia Tariff Concessions Gazette' },
  { category: 'Gazette', category_title: 'TCO Gazette', item_title: 'Gazette TC 25/03', description: 'Gazette issue — 22 January 2025', reference: '2025' },
  { category: 'Gazette', category_title: 'TCO Gazette', item_title: 'Gazette TC 24/42', description: 'Gazette issue — 23 October 2024', reference: '2024' },
  { category: 'Gazette', category_title: 'TCO Gazette', item_title: 'Gazette TC 24/46', description: 'Gazette issue — 20 November 2024', reference: '2024' },

  // Excluded Categories
  { category: 'Excluded', category_title: 'Excluded Categories', item_title: 'Foodstuffs', description: 'Generally not eligible for TCOs', notes: 'Most food items have local production or are excluded by policy' },
  { category: 'Excluded', category_title: 'Excluded Categories', item_title: 'Clothing', description: 'Excluded from TCO eligibility', notes: 'Textile and clothing articles generally excluded' },
  { category: 'Excluded', category_title: 'Excluded Categories', item_title: 'Passenger Vehicles', description: 'Excluded from TCO eligibility', notes: 'Motor vehicles for passenger transport excluded' },
];

const insert = db.prepare(`INSERT INTO tariff_concession_orders (category, category_title, item_title, description, detail, reference, notes) VALUES (@category, @category_title, @item_title, @description, @detail, @reference, @notes)`);
db.transaction(() => { for (const i of items) insert.run({ ...i, description: i.description || null, detail: i.detail || null, reference: i.reference || null, notes: i.notes || null }); })();

db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS tco_fts USING fts5(item_title, category, description, detail, reference, notes, content='tariff_concession_orders', content_rowid='id');
  INSERT INTO tco_fts(tco_fts) VALUES('rebuild');
`);

const count = (db.prepare('SELECT COUNT(*) as cnt FROM tariff_concession_orders').get() as { cnt: number }).cnt;
console.log(`Seeded ${count} TCO entries`);
db.close();
