import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// ── Reference Files ──────────────────────────────────────────────

db.exec(`
  DROP TABLE IF EXISTS abf_reference_files;
  CREATE TABLE abf_reference_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_code TEXT NOT NULL,
    file_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL
  );
  CREATE INDEX idx_ref_code ON abf_reference_files(file_code);
  CREATE INDEX idx_ref_category ON abf_reference_files(category);
`);

interface RefFile {
  file_code: string;
  file_name: string;
  category: string;
  description: string;
}

const refFiles: RefFile[] = [
  // Community Protection
  { file_code: 'LGMNTQST', file_name: 'Lodgement Question', category: 'Community Protection', description: 'Contains questions presented during cargo declaration lodgement processes' },
  { file_code: 'CMNPRPRF', file_name: 'Community Protection Profile', category: 'Community Protection', description: 'Defines risk assessment profiles for community safety screening' },
  { file_code: 'CMNPTRSK', file_name: 'Community Protection Risk', category: 'Community Protection', description: 'Details identified risk categories requiring intervention' },
  { file_code: 'CMNPTRMA', file_name: 'Community Protection Risk Message Advice', category: 'Community Protection', description: 'Automated messaging and guidance for CP risk detection' },

  // Tariff & Trade
  { file_code: 'TRFCSNAP', file_name: 'Tariff Classification Snapshot', category: 'Tariff & Trade', description: 'Tariff classification data with effective dates' },
  { file_code: 'TRFCCHAR', file_name: 'Tariff Classification Characteristics', category: 'Tariff & Trade', description: 'Product characteristics used in tariff determination' },
  { file_code: 'TRFCCONC', file_name: 'Tariff Classification Concordance', category: 'Tariff & Trade', description: 'Mappings between tariff codes' },
  { file_code: 'TRFCMSAD', file_name: 'Tariff Classification Message Advisories', category: 'Tariff & Trade', description: 'Guidance and notices for tariff classification' },
  { file_code: 'TFRPSNAP', file_name: 'Tariff Rate Period Snapshot', category: 'Tariff & Trade', description: 'Duty rate information by period' },
  { file_code: 'TFRPCHAR', file_name: 'Tariff Rate Period Characteristics', category: 'Tariff & Trade', description: 'Tariff rate characteristics by period' },
  { file_code: 'TRRPMSAD', file_name: 'Tariff/Treatment Rate Period Message Advisories', category: 'Tariff & Trade', description: 'Message advisories for tariff and treatment rate periods' },
  { file_code: 'TRRPADDC', file_name: 'Tariff/Treatment Rate Period Additional Duty Calculations', category: 'Tariff & Trade', description: 'Additional duty calculation rules' },
  { file_code: 'TRETSNAP', file_name: 'Treatment Snapshot', category: 'Tariff & Trade', description: 'Treatment type snapshot data' },
  { file_code: 'TRETSCTY', file_name: 'Treatment Snapshot Country Data', category: 'Tariff & Trade', description: 'Country-specific treatment data' },
  { file_code: 'TRETSTGP', file_name: 'Treatment Snapshot Tariff Groups', category: 'Tariff & Trade', description: 'Tariff group data for treatments' },

  // Preference & Origin
  { file_code: 'PRSCHRUL', file_name: 'Preference Scheme Rules', category: 'Preference & Origin', description: 'Rules governing FTA preference schemes' },
  { file_code: 'PRSRMSAD', file_name: 'Preference Scheme Rule Message Advisories', category: 'Preference & Origin', description: 'Message advisories for preference scheme rules' },
  { file_code: 'PRSPSNAP', file_name: 'Preference Scheme Period Snapshot', category: 'Preference & Origin', description: 'Preference scheme period data' },
  { file_code: 'PRSPCTRY', file_name: 'Preference Scheme Period Country Data', category: 'Preference & Origin', description: 'Country eligibility for preference schemes' },
  { file_code: 'PRRPSNAP', file_name: 'Preference Rule Period Snapshot', category: 'Preference & Origin', description: 'Preference rule period data' },
  { file_code: 'PRRPCHAR', file_name: 'Preference Rule Period Characteristics', category: 'Preference & Origin', description: 'Characteristics for preference rule periods' },
  { file_code: 'PRRPCTRY', file_name: 'Preference Rule Period Country Data', category: 'Preference & Origin', description: 'Country-specific preference rule data' },
  { file_code: 'PRRPTRFG', file_name: 'Preference Rule Period Tariff Groups', category: 'Preference & Origin', description: 'Tariff group assignments for preference rules' },

  // AQIS / Biosecurity
  { file_code: 'AQSCMDTY', file_name: 'AQIS Commodity Classification', category: 'Biosecurity (AQIS)', description: 'Commodity classification for quarantine assessment' },
  { file_code: 'AQSCMSTC', file_name: 'AQIS Commodity Statistical Classification', category: 'Biosecurity (AQIS)', description: 'Statistical classification for AQIS commodities' },
  { file_code: 'AQSCNCRN', file_name: 'AQIS Concern Categories', category: 'Biosecurity (AQIS)', description: 'Concern categories for biosecurity risk' },
  { file_code: 'AQSDCMNT', file_name: 'AQIS Document Type Specifications', category: 'Biosecurity (AQIS)', description: 'Document types required for biosecurity clearance' },
  { file_code: 'AQSENTIT', file_name: 'AQIS Entity Identifiers', category: 'Biosecurity (AQIS)', description: 'Entity identifiers for AQIS processes' },
  { file_code: 'AQSPREMS', file_name: 'AQIS Premises Approval Data', category: 'Biosecurity (AQIS)', description: 'Approved premises data for quarantine' },
  { file_code: 'AQSPROCS', file_name: 'AQIS Processing Type Classifications', category: 'Biosecurity (AQIS)', description: 'Processing type classifications' },
  { file_code: 'AQSPRDCR', file_name: 'AQIS Producer Registration', category: 'Biosecurity (AQIS)', description: 'Registered producer data' },

  // Permits & Restrictions
  { file_code: 'PRMTRQMT', file_name: 'Permit Requirement Specifications', category: 'Permits & Restrictions', description: 'Specifies permit requirements for goods' },
  { file_code: 'PRMTRQEX', file_name: 'Permit Requirement Exclusions', category: 'Permits & Restrictions', description: 'Exclusions from permit requirements' },

  // Operational
  { file_code: 'AHECCSS', file_name: 'AHECC Export Classification', category: 'Operational', description: 'Australian Harmonised Export Commodity Classification codes' },
  { file_code: 'BERTH', file_name: 'Port Berth Codes', category: 'Operational', description: 'Australian port berth identification codes' },
  { file_code: 'CHRCTRST', file_name: 'Characteristic Definitions', category: 'Operational', description: 'Definitions of characteristics used in tariff/trade' },
  { file_code: 'ESTABMNT', file_name: 'Establishment Codes', category: 'Operational', description: 'Establishment identification codes' },
  { file_code: 'XCHGRATE', file_name: 'Daily Exchange Rates', category: 'Operational', description: 'Daily exchange rates for customs valuation' },
  { file_code: 'INSTRMNT', file_name: 'Instrument Definitions', category: 'Operational', description: 'Instrument type definitions (TCOs, By-laws etc.)' },
  { file_code: 'INSCTGRY', file_name: 'Instrument Category Classifications', category: 'Operational', description: 'Category classifications for instruments' },
  { file_code: 'INSCTCHR', file_name: 'Instrument Category Characteristics', category: 'Operational', description: 'Characteristics for instrument categories' },
  { file_code: 'INSCTCRY', file_name: 'Instrument Category Country Data', category: 'Operational', description: 'Country data for instrument categories' },
  { file_code: 'INSCTMSA', file_name: 'Instrument Category Message Advisories', category: 'Operational', description: 'Message advisories for instrument categories' },
  { file_code: 'INSCTPRS', file_name: 'Instrument Category Preference Scheme Rules', category: 'Operational', description: 'Preference scheme rules for instrument categories' },
  { file_code: 'INSCTTRG', file_name: 'Instrument Category Tariff Groupings', category: 'Operational', description: 'Tariff groupings for instrument categories' },
  { file_code: 'INSTRCHR', file_name: 'Instrument Characteristic Mappings', category: 'Operational', description: 'Characteristic mappings for instruments' },
  { file_code: 'INSTRCRY', file_name: 'Instrument Country-Specific Rules', category: 'Operational', description: 'Country-specific rules for instruments' },
  { file_code: 'INSTRMSA', file_name: 'Instrument Message Advisories', category: 'Operational', description: 'Message advisories for instruments' },
  { file_code: 'INSTRPRS', file_name: 'Instrument Preference Scheme Rules', category: 'Operational', description: 'Preference scheme rules for instruments' },
  { file_code: 'INSTRTRG', file_name: 'Instrument Tariff Group Assignments', category: 'Operational', description: 'Tariff group assignments for instruments' },
  { file_code: 'MSGADVCE', file_name: 'Message Advice Text & Codes', category: 'Operational', description: 'Message advice text and codes used in ICS' },
  { file_code: 'QNTUTCNV', file_name: 'Quantity Unit Conversion Factors', category: 'Operational', description: 'Conversion factors between quantity units' },
  { file_code: 'RFNRSNTP', file_name: 'Refund Reason Classifications', category: 'Operational', description: 'Reason classifications for duty refunds' },
  { file_code: 'SEAIMPAR', file_name: 'Sea Arrival Port Information', category: 'Operational', description: 'Australian sea import arrival port codes' },
  { file_code: 'STCPCHAR', file_name: 'Statistical Classification Period Characteristics', category: 'Operational', description: 'Characteristics for statistical classification periods' },
  { file_code: 'STCPMSAD', file_name: 'Statistical Classification Period Message Advisories', category: 'Operational', description: 'Message advisories for statistical classification periods' },
  { file_code: 'STCPSNAP', file_name: 'Statistical Classification Period Snapshot', category: 'Operational', description: 'Statistical classification period snapshot data' },
  { file_code: 'VESSEL', file_name: 'Customs Ship Register', category: 'Operational', description: 'Registered vessel data for customs' },
];

const insertRef = db.prepare(`
  INSERT INTO abf_reference_files (file_code, file_name, category, description)
  VALUES (@file_code, @file_name, @category, @description)
`);

db.transaction(() => {
  for (const f of refFiles) insertRef.run(f);
})();

// ── CP Questions ─────────────────────────────────────────────────

db.exec(`
  DROP TABLE IF EXISTS cp_questions;
  CREATE TABLE cp_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cp_number TEXT NOT NULL,
    question_text TEXT NOT NULL,
    category TEXT NOT NULL,
    applies_to TEXT,
    answer_y TEXT,
    answer_n TEXT,
    effective_date TEXT,
    notes TEXT
  );
  CREATE INDEX idx_cp_number ON cp_questions(cp_number);
  CREATE INDEX idx_cp_category ON cp_questions(category);
`);

interface CPQuestion {
  cp_number: string;
  question_text: string;
  category: string;
  applies_to?: string | null;
  answer_y?: string | null;
  answer_n?: string | null;
  effective_date?: string | null;
  notes?: string | null;
}

const cpQuestions: CPQuestion[] = [
  // Asbestos
  { cp_number: '420', question_text: 'Does this ship or resource installation contain asbestos?', category: 'Asbestos', applies_to: 'Ships, resource installations', answer_y: 'Goods contain asbestos — may be prohibited', answer_n: 'Goods do not contain asbestos', effective_date: null, notes: 'Regulation 4C of Customs (Prohibited Imports) Regulations 1956' },
  { cp_number: '460', question_text: 'Are these goods, or do they contain, chrysotile as described in Regulation 4C of the Customs (Prohibited Imports) Regulations 1956 relating to asbestos?', category: 'Asbestos', applies_to: 'All goods potentially containing chrysotile', answer_y: 'Goods contain chrysotile asbestos — prohibited', answer_n: 'Goods do not contain chrysotile', effective_date: null, notes: 'Chrysotile (white asbestos) is a prohibited import' },
  { cp_number: '521', question_text: 'Do these goods contain asbestos or a powder substance that contains asbestos, as described in Regulation 4C of the Customs (Prohibited Imports) Regulations 1956 relating to asbestos?', category: 'Asbestos', applies_to: 'All goods potentially containing asbestos', answer_y: 'Goods contain asbestos — prohibited', answer_n: 'Goods verified asbestos-free', effective_date: null, notes: 'Broader asbestos question covering all forms' },

  // Biosecurity — Wood & Timber
  { cp_number: 'BIO-WOOD', question_text: 'Do the goods contain any wood (excluding reconstituted wood, densified wood or wood plastic), and are not accompanied by appropriate documentation to verify that they have undergone an acceptable treatment/manufacturing process as required by BICON?', category: 'Biosecurity', applies_to: 'Wooden furniture (9401.61, 9403.60), timber products', answer_y: 'Goods contain untreated wood without documentation', answer_n: 'Goods have appropriate documentation OR contain no wood', effective_date: '2023-06-26', notes: 'Requires verification against BICON import conditions database' },

  // Biosecurity — General
  { cp_number: 'BIO-PLANT', question_text: 'Do these goods contain or are they derived from plant material that may pose a biosecurity risk?', category: 'Biosecurity', applies_to: 'Plant products, seeds, plant-derived goods', answer_y: 'Goods require biosecurity inspection', answer_n: 'No plant material biosecurity risk', effective_date: null, notes: 'Department of Agriculture assessment required if Y' },
  { cp_number: 'BIO-ANIMAL', question_text: 'Do these goods contain or are they derived from animal material that may pose a biosecurity risk?', category: 'Biosecurity', applies_to: 'Animal products, animal-derived goods', answer_y: 'Goods require biosecurity inspection', answer_n: 'No animal material biosecurity risk', effective_date: null, notes: 'Department of Agriculture assessment required if Y' },
  { cp_number: 'BIO-FOOD', question_text: 'Are these goods food or food ingredients intended for human consumption?', category: 'Biosecurity', applies_to: 'Food products', answer_y: 'Subject to imported food inspection scheme', answer_n: 'Not food for human consumption', effective_date: null, notes: 'May require food safety inspection' },

  // Ozone-Depleting Substances
  { cp_number: 'ODS-LIC', question_text: 'Does the importer have a licence to import ozone depleting substances as required under Regulation 5K of the Customs (Prohibited Imports) Regulations?', category: 'Ozone-Depleting Substances', applies_to: 'Refrigerants, aerosols, solvents containing ODS', answer_y: 'Importer holds valid ODS import licence', answer_n: 'No licence held — importation may be prohibited', effective_date: null, notes: 'Regulation 5K — requires valid licence from Department of Climate Change' },

  // Hazardous Chemicals
  { cp_number: 'CHEM-CWC', question_text: 'Do these goods contain chemical compounds listed in Schedule 11 of the Customs (Prohibited Imports) Regulations 1956?', category: 'Hazardous Chemicals', applies_to: 'Chemical products, industrial chemicals', answer_y: 'Goods require ASNO permit for CWC chemicals', answer_n: 'Goods do not contain CWC-scheduled chemicals', effective_date: null, notes: 'CWC Schedules 1-3. Contact ASNO for permits.' },
  { cp_number: 'CHEM-PCB', question_text: 'Do these goods contain polychlorinated biphenyls (PCBs) or polychlorinated terphenyls (PCTs)?', category: 'Hazardous Chemicals', applies_to: 'Electrical equipment, oils, chemicals', answer_y: 'Goods contain PCBs/PCTs — prohibited under Regulation 4AB', answer_n: 'Goods verified free of PCBs/PCTs', effective_date: null, notes: 'Regulation 4AB of Customs (Prohibited Imports) Regulations 1956' },
  { cp_number: 'CHEM-MERC', question_text: 'Do these goods contain mercury or mercury compounds as described in Regulation 4AC?', category: 'Hazardous Chemicals', applies_to: 'Products potentially containing mercury', answer_y: 'Goods contain mercury — may require permit', answer_n: 'Goods verified mercury-free', effective_date: null, notes: 'Regulation 4AC — Minamata Convention on Mercury' },

  // Weapons & Firearms
  { cp_number: 'WEAP-FIRE', question_text: 'Are these goods firearms, firearm parts, firearm accessories, magazines, or ammunition as described in Regulation 4F?', category: 'Weapons & Firearms', applies_to: 'Firearms, accessories, parts, ammunition', answer_y: 'Import permit required from state/territory police', answer_n: 'Goods are not firearms or related items', effective_date: null, notes: 'Regulation 4F and Schedule 6 of PI Regulations' },
  { cp_number: 'WEAP-OTHER', question_text: 'Are these goods weapons or weapon parts as described in Regulation 4H of the Customs (Prohibited Imports) Regulations 1956?', category: 'Weapons & Firearms', applies_to: 'Knives, crossbows, body armour, other weapons', answer_y: 'Import may be prohibited or require permit', answer_n: 'Goods are not weapons or weapon parts', effective_date: null, notes: 'Includes crossbows, body armour, martial arts weapons etc.' },

  // Tobacco & Vaping
  { cp_number: 'TOB-PROD', question_text: 'Are these goods tobacco products as described in Regulation 4DA?', category: 'Tobacco & Vaping', applies_to: 'Cigarettes, cigars, tobacco products', answer_y: 'Subject to tobacco import restrictions and excise', answer_n: 'Not tobacco products', effective_date: null, notes: 'Regulation 4DA — tobacco product import restrictions' },
  { cp_number: 'VAPE-PROD', question_text: 'Are these goods vaping goods as described in Regulation 5A of the Customs (Prohibited Imports) Regulations 1956?', category: 'Tobacco & Vaping', applies_to: 'E-cigarettes, vaping devices, e-liquids', answer_y: 'Vaping goods — prohibited without TGA approval', answer_n: 'Not vaping goods', effective_date: null, notes: 'Regulation 5A — vaping goods are prohibited imports unless approved by TGA' },

  // Engineered Stone
  { cp_number: 'ENG-STONE', question_text: 'Are these goods engineered stone benchtops, panels or slabs as described in Regulation 5M of the Customs (Prohibited Imports) Regulations 1956?', category: 'Engineered Stone', applies_to: 'Engineered stone benchtops, panels, slabs', answer_y: 'Goods are prohibited — engineered stone ban effective 1 Jan 2025', answer_n: 'Not engineered stone benchtops/panels/slabs', effective_date: '2025-01-01', notes: 'Regulation 5M — absolute prohibition on engineered stone due to silicosis risk' },

  // Drugs & Precursors
  { cp_number: 'DRUG-IMP', question_text: 'Are these goods drugs or drug precursors as described in Regulation 5 of the Customs (Prohibited Imports) Regulations 1956?', category: 'Drugs & Precursors', applies_to: 'Pharmaceutical products, chemical precursors', answer_y: 'Import permit required — contact Office of Drug Control', answer_n: 'Not drugs or drug precursors', effective_date: null, notes: 'Regulation 5 and Schedule 4' },
  { cp_number: 'DRUG-TAB', question_text: 'Are these goods tablet presses or encapsulators as described in Regulation 4G?', category: 'Drugs & Precursors', applies_to: 'Tablet presses, encapsulating equipment', answer_y: 'Import permit required from Attorney-General', answer_n: 'Not tablet presses or encapsulators', effective_date: null, notes: 'Regulation 4G — controlled equipment' },

  // CITES / Wildlife
  { cp_number: 'CITES-SP', question_text: 'Do these goods contain or are they derived from species listed under CITES (Convention on International Trade in Endangered Species)?', category: 'Wildlife & CITES', applies_to: 'Animal products, traditional medicines, timber, leather', answer_y: 'CITES permit required from Department of Climate Change', answer_n: 'No CITES-listed species involved', effective_date: null, notes: 'Includes ivory, exotic leathers, traditional medicines, certain timbers' },
  { cp_number: 'CITES-LIVE', question_text: 'Are these goods live animals or live plants that require a CITES permit?', category: 'Wildlife & CITES', applies_to: 'Live animals, live plants', answer_y: 'CITES import permit required', answer_n: 'Not live CITES-listed species', effective_date: null, notes: 'Live specimen imports have additional quarantine requirements' },

  // Consumer Safety
  { cp_number: 'SAFE-TOY', question_text: 'Do these toy products comply with the lead content restrictions under the Competition and Consumer Act 2010?', category: 'Consumer Safety', applies_to: 'Children\'s toys, novelty items', answer_y: 'Goods comply with lead content standards', answer_n: 'Goods may not comply — subject to permanent ban', effective_date: null, notes: 'Regulation 4U — goods subject to permanent ban under Competition and Consumer Act' },
  { cp_number: 'SAFE-LIGHT', question_text: 'Are these goods incandescent lamps as described in Regulation 4VA?', category: 'Consumer Safety', applies_to: 'Light bulbs, incandescent lamps', answer_y: 'Import restricted — energy efficiency standards apply', answer_n: 'Not incandescent lamps', effective_date: null, notes: 'Regulation 4VA — restricted incandescent lamp imports' },

  // Sanctions
  { cp_number: 'SANC-DPRK', question_text: 'Are these goods originating from or destined for the Democratic People\'s Republic of Korea (North Korea)?', category: 'Sanctions', applies_to: 'All goods from/to DPRK', answer_y: 'Import prohibited — DPRK sanctions', answer_n: 'Not related to DPRK', effective_date: null, notes: 'Regulation 4Y — comprehensive sanctions on DPRK' },
  { cp_number: 'SANC-AUTO', question_text: 'Are these goods subject to autonomous sanctions under Regulation 4XA?', category: 'Sanctions', applies_to: 'Goods from sanctioned entities/countries', answer_y: 'Import may be prohibited — check sanctions list', answer_n: 'Not subject to autonomous sanctions', effective_date: null, notes: 'Regulation 4XA — Australian autonomous sanctions regime' },

  // Diamonds
  { cp_number: 'DIAM-ROUGH', question_text: 'Are these goods rough diamonds as described in Regulation 4MA?', category: 'Rough Diamonds', applies_to: 'Rough (uncut) diamonds', answer_y: 'Kimberley Process Certificate required', answer_n: 'Not rough diamonds', effective_date: null, notes: 'Regulation 4MA — Kimberley Process Certification Scheme' },

  // Ammonium Nitrate
  { cp_number: 'SSAAN', question_text: 'Are these goods security sensitive ammonium nitrate as described in Regulation 4X?', category: 'Security Sensitive', applies_to: 'Ammonium nitrate, fertilisers', answer_y: 'Licence required for SSAN import', answer_n: 'Not security sensitive ammonium nitrate', effective_date: null, notes: 'Regulation 4X — COAG agreement on SSAN controls' },

  // Counterfeit Cards
  { cp_number: 'CARD-FAKE', question_text: 'Are these goods counterfeit credit, debit, or charge cards as described in Regulation 4T?', category: 'Prohibited Items', applies_to: 'Credit cards, debit cards, charge cards', answer_y: 'Goods are prohibited — counterfeit financial instruments', answer_n: 'Not counterfeit cards', effective_date: null, notes: 'Regulation 4T — absolute prohibition' },

  // Anzac Goods
  { cp_number: 'ANZAC', question_text: 'Are these goods Anzac goods that use the word "Anzac" in connection with trade as described in Regulation 4V?', category: 'Prohibited Items', applies_to: 'Goods bearing "Anzac" branding', answer_y: 'Import requires Ministerial approval', answer_n: 'Not Anzac-branded goods', effective_date: null, notes: 'Regulation 4V — protection of the word "Anzac"' },
];

const insertCP = db.prepare(`
  INSERT INTO cp_questions (cp_number, question_text, category, applies_to, answer_y, answer_n, effective_date, notes)
  VALUES (@cp_number, @question_text, @category, @applies_to, @answer_y, @answer_n, @effective_date, @notes)
`);

db.transaction(() => {
  for (const q of cpQuestions) {
    insertCP.run({
      cp_number: q.cp_number,
      question_text: q.question_text,
      category: q.category,
      applies_to: q.applies_to || null,
      answer_y: q.answer_y || null,
      answer_n: q.answer_n || null,
      effective_date: q.effective_date || null,
      notes: q.notes || null,
    });
  }
})();

// FTS indexes
db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS abf_ref_fts USING fts5(
    file_code, file_name, category, description,
    content='abf_reference_files', content_rowid='id'
  );
  INSERT INTO abf_ref_fts(abf_ref_fts) VALUES('rebuild');

  CREATE VIRTUAL TABLE IF NOT EXISTS cp_fts USING fts5(
    cp_number, question_text, category, applies_to, notes,
    content='cp_questions', content_rowid='id'
  );
  INSERT INTO cp_fts(cp_fts) VALUES('rebuild');
`);

const refCount = (db.prepare('SELECT COUNT(*) as cnt FROM abf_reference_files').get() as { cnt: number }).cnt;
const cpCount = (db.prepare('SELECT COUNT(*) as cnt FROM cp_questions').get() as { cnt: number }).cnt;
console.log(`Seeded ${refCount} ABF reference files and ${cpCount} CP questions`);

db.close();
