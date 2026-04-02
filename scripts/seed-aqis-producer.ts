import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  DROP TABLE IF EXISTS aqis_producers;
  CREATE TABLE aqis_producers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    category_title TEXT NOT NULL,
    item_type TEXT NOT NULL,
    item_title TEXT NOT NULL,
    description TEXT,
    requirements TEXT,
    notes TEXT
  );
  CREATE INDEX idx_aqis_category ON aqis_producers(category);
`);

interface AP { category: string; category_title: string; item_type: string; item_title: string; description?: string; requirements?: string; notes?: string; }

const items: AP[] = [
  // Commodity Programmes
  { category: 'Commodity Programmes', category_title: 'Export Commodity Programmes', item_type: 'Programme', item_title: 'Meat', description: 'Red meat, poultry, game, and meat products', requirements: 'Export registered establishment, documented food safety management system, AQIS inspection', notes: 'Includes abattoirs, boning rooms, cold stores, and meat processing facilities' },
  { category: 'Commodity Programmes', category_title: 'Export Commodity Programmes', item_type: 'Programme', item_title: 'Fish', description: 'Fish, shellfish, crustaceans, and seafood products', requirements: 'Export registered establishment, HACCP-based food safety plan', notes: 'Covers processing, storage, and packing of fish products for export' },
  { category: 'Commodity Programmes', category_title: 'Export Commodity Programmes', item_type: 'Programme', item_title: 'Dairy', description: 'Milk, cheese, butter, cream, and dairy products', requirements: 'Export registered establishment, approved food safety management system', notes: 'Factory registration and product certification required' },
  { category: 'Commodity Programmes', category_title: 'Export Commodity Programmes', item_type: 'Programme', item_title: 'Grain', description: 'Cereals, pulses, oilseeds, and grain products', requirements: 'Export registration, phytosanitary certification', notes: 'Includes bulk and containerised grain exports' },
  { category: 'Commodity Programmes', category_title: 'Export Commodity Programmes', item_type: 'Programme', item_title: 'Horticulture', description: 'Fresh fruit, vegetables, cut flowers, nursery stock', requirements: 'Approved treatment facility, phytosanitary certification', notes: 'Protocol treatments may be required for certain markets' },
  { category: 'Commodity Programmes', category_title: 'Export Commodity Programmes', item_type: 'Programme', item_title: 'Live Animals', description: 'Live cattle, sheep, goats, and other livestock', requirements: 'ESCAS compliance, approved exporter, pre-export quarantine', notes: 'Exporter Supply Chain Assurance System (ESCAS) mandatory' },
  { category: 'Commodity Programmes', category_title: 'Export Commodity Programmes', item_type: 'Programme', item_title: 'Eggs', description: 'Table eggs, egg products, and processed eggs', requirements: 'Export registered establishment, food safety management system', notes: 'Separate registration from meat and dairy' },
  { category: 'Commodity Programmes', category_title: 'Export Commodity Programmes', item_type: 'Programme', item_title: 'Organics', description: 'Certified organic products across all commodity types', requirements: 'Approved certifying organisation, National Standard for Organic and Bio-Dynamic Produce', notes: 'Third-party certification required' },

  // Establishment Types
  { category: 'Establishment Types', category_title: 'Registered Establishment Types', item_type: 'Type', item_title: 'Processing Establishment', description: 'Facilities that process products for export', requirements: 'Registration number, food safety management system, regular audit', notes: 'Includes slaughter, boning, processing, canning, freezing' },
  { category: 'Establishment Types', category_title: 'Registered Establishment Types', item_type: 'Type', item_title: 'Storage Establishment', description: 'Facilities that store prepared products for export', requirements: 'Registration number, temperature control documentation', notes: 'Cold stores, dry stores, bonded stores' },
  { category: 'Establishment Types', category_title: 'Registered Establishment Types', item_type: 'Type', item_title: 'Treatment Facility', description: 'Facilities for horticulture protocol treatments', requirements: 'Approved facility status, treatment protocol compliance', notes: 'Heat treatment, fumigation, irradiation, cold treatment' },
  { category: 'Establishment Types', category_title: 'Registered Establishment Types', item_type: 'Type', item_title: 'Packing Establishment', description: 'Facilities that pack products for export', requirements: 'Registration, traceability systems', notes: 'Product identification and lot tracing capability required' },

  // Approved Arrangements
  { category: 'Approved Arrangements', category_title: 'Approved Arrangement Categories', item_type: 'Arrangement', item_title: 'Import Clearance (Class 1)', description: 'Operators who assess and clear imported goods at own premises', requirements: 'Australian legal entity, biosecurity management plan, compliance history', notes: 'Reduces need for government intervention at the border' },
  { category: 'Approved Arrangements', category_title: 'Approved Arrangement Categories', item_type: 'Arrangement', item_title: 'Import Clearance (Class 2)', description: 'Operators managing biosecurity risks for specific commodity types', requirements: 'Commodity-specific approval, documented procedures', notes: 'Covers specific product categories with tailored requirements' },
  { category: 'Approved Arrangements', category_title: 'Approved Arrangement Categories', item_type: 'Arrangement', item_title: 'Transitional Facility', description: 'Premises approved to receive biosecurity-controlled goods', requirements: 'Facility standards, pest management, containment procedures', notes: 'Goods must remain under biosecurity control until cleared' },
  { category: 'Approved Arrangements', category_title: 'Approved Arrangement Categories', item_type: 'Arrangement', item_title: 'Export Documentation', description: 'Operators who prepare export documentation', requirements: 'Authorised officer delegation, document control systems', notes: 'May issue health certificates and phytosanitary certificates' },

  // Key Data Elements
  { category: 'Data Elements', category_title: 'Producer Registration Data', item_type: 'Field', item_title: 'Establishment Registration Number', description: 'Unique AQIS/DAFF registration number assigned to each approved establishment', requirements: 'Mandatory for all registered establishments', notes: 'Format varies by commodity programme' },
  { category: 'Data Elements', category_title: 'Producer Registration Data', item_type: 'Field', item_title: 'Business Name and ABN', description: 'Legal name of the business entity and Australian Business Number', requirements: 'Must be an Australian legal entity for domestic establishments', notes: 'ABN required for all registrations' },
  { category: 'Data Elements', category_title: 'Producer Registration Data', item_type: 'Field', item_title: 'Product Category', description: 'Commodity type the establishment is approved to handle', requirements: 'Must match registered commodity programme', notes: 'Meat, dairy, fish, grain, horticulture, live animals, eggs, organics' },
  { category: 'Data Elements', category_title: 'Producer Registration Data', item_type: 'Field', item_title: 'Country of Origin', description: 'Country where the establishment is located', requirements: 'Required for overseas establishments', notes: 'Must have bilateral agreement with Australia' },
  { category: 'Data Elements', category_title: 'Producer Registration Data', item_type: 'Field', item_title: 'Food Safety Management System', description: 'Documented system describing food safety and traceability procedures', requirements: 'HACCP-based system mandatory', notes: 'Subject to annual audit by DAFF' },
  { category: 'Data Elements', category_title: 'Producer Registration Data', item_type: 'Field', item_title: 'Compliance History', description: 'Record of audit results, non-conformances, and corrective actions', requirements: 'Maintained by DAFF', notes: 'Determines inspection rate for future consignments' },

  // Import Systems
  { category: 'Import Systems', category_title: 'Import Management Systems', item_type: 'System', item_title: 'BICON', description: 'Biosecurity Import Conditions system — houses import conditions for 20,000+ products', requirements: 'Used by importers to determine biosecurity requirements', notes: 'Available at bicon.agriculture.gov.au' },
  { category: 'Import Systems', category_title: 'Import Management Systems', item_type: 'System', item_title: 'Import Permit System', description: 'System for applying for and managing import permits', requirements: 'Required for goods needing specific biosecurity permits', notes: 'Linked to BICON conditions' },
  { category: 'Import Systems', category_title: 'Import Management Systems', item_type: 'System', item_title: 'ICS (Integrated Cargo System)', description: 'ABF system for managing cargo clearance including biosecurity holds', requirements: 'Used by brokers and importers for cargo declarations', notes: 'Interfaces with DAFF biosecurity systems' },
];

const insert = db.prepare(`INSERT INTO aqis_producers (category, category_title, item_type, item_title, description, requirements, notes) VALUES (@category, @category_title, @item_type, @item_title, @description, @requirements, @notes)`);
db.transaction(() => { for (const i of items) insert.run({ ...i, description: i.description || null, requirements: i.requirements || null, notes: i.notes || null }); })();

db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS aqis_producers_fts USING fts5(item_title, category, description, requirements, notes, content='aqis_producers', content_rowid='id');
  INSERT INTO aqis_producers_fts(aqis_producers_fts) VALUES('rebuild');
`);

const count = (db.prepare('SELECT COUNT(*) as cnt FROM aqis_producers').get() as { cnt: number }).cnt;
console.log(`Seeded ${count} AQIS producer entries`);
db.close();
