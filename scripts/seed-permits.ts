import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Ensure table exists (matches schema in db.ts)
db.exec(`
  CREATE TABLE IF NOT EXISTS permit_requirements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tariff_code_start TEXT NOT NULL,
    tariff_code_end TEXT,
    agency TEXT NOT NULL,
    permit_type TEXT NOT NULL,
    description TEXT,
    link_url TEXT,
    notes TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_permit_tariff ON permit_requirements(tariff_code_start);
`);

// Clear existing data
db.exec('DELETE FROM permit_requirements');

interface PermitEntry {
  tariff_code_start: string;
  tariff_code_end: string | null;
  agency: string;
  permit_type: string;
  description: string;
  link_url: string | null;
  notes: string | null;
}

const entries: PermitEntry[] = [
  // Chapters 01-05: DAFF — Biosecurity Import Permit (animal products)
  {
    tariff_code_start: '01',
    tariff_code_end: '05',
    agency: 'Department of Agriculture, Fisheries and Forestry (DAFF)',
    permit_type: 'Biosecurity Import Permit',
    description: 'Live animals, meat, fish, dairy, eggs, animal products — biosecurity clearance required for all animal-origin goods',
    link_url: 'https://www.agriculture.gov.au/biosecurity-trade/import/goods/animal-products',
    notes: 'Consult BICON (Biosecurity Import Conditions) database for species/product-specific requirements. Pre-arrival documentation and inspection mandatory.',
  },
  // Chapters 06-14: DAFF — Biosecurity Import Permit (plant products)
  {
    tariff_code_start: '06',
    tariff_code_end: '14',
    agency: 'Department of Agriculture, Fisheries and Forestry (DAFF)',
    permit_type: 'Biosecurity Import Permit',
    description: 'Live plants, cut flowers, vegetables, fruit, cereals, seeds, plant products — biosecurity clearance required',
    link_url: 'https://www.agriculture.gov.au/biosecurity-trade/import/goods/plant-products',
    notes: 'Phytosanitary certificate from exporting country generally required. BICON conditions apply. Fumigation or treatment may be required on arrival.',
  },
  // Chapter 15: DAFF — Biosecurity (animal-origin fats/oils)
  {
    tariff_code_start: '15',
    tariff_code_end: '15',
    agency: 'Department of Agriculture, Fisheries and Forestry (DAFF)',
    permit_type: 'Biosecurity Import Permit',
    description: 'Animal or vegetable fats and oils — biosecurity requirements apply for animal-origin products',
    link_url: 'https://www.agriculture.gov.au/biosecurity-trade/import',
    notes: 'Animal-origin fats/oils require biosecurity clearance and may need heat treatment certification. Vegetable oils generally lower risk but still subject to BICON.',
  },
  // Chapters 16-24: DAFF — Imported Food Inspection
  {
    tariff_code_start: '16',
    tariff_code_end: '24',
    agency: 'Department of Agriculture, Fisheries and Forestry (DAFF)',
    permit_type: 'Imported Food Inspection Scheme (IFIS)',
    description: 'Prepared foods, sugar, cocoa, beverages, tobacco — subject to imported food inspection under IFIS',
    link_url: 'https://www.agriculture.gov.au/biosecurity-trade/import/goods/food',
    notes: 'Risk-based inspection rates apply. Food must comply with FSANZ Food Standards Code. Failing inspection may result in re-export, destruction, or re-labelling at importer cost.',
  },
  // 2844: ARPANSA — Radiation Apparatus Licence
  {
    tariff_code_start: '2844',
    tariff_code_end: '2844',
    agency: 'Australian Radiation Protection and Nuclear Safety Agency (ARPANSA)',
    permit_type: 'Radiation Source Licence',
    description: 'Radioactive chemical elements and radioactive isotopes — requires ARPANSA licence for import, possession and use',
    link_url: 'https://www.arpansa.gov.au/regulation-and-licensing',
    notes: 'Licence application required before import. Must demonstrate safe storage, handling and disposal arrangements. Additional requirements under Nuclear Non-Proliferation Act 1987 for fissile material.',
  },
  // 3002: TGA — Therapeutic Goods Import Permit (blood/vaccines)
  {
    tariff_code_start: '3002',
    tariff_code_end: '3002',
    agency: 'Therapeutic Goods Administration (TGA)',
    permit_type: 'Therapeutic Goods Import Permit',
    description: 'Human blood, animal blood prepared for therapeutic use, antisera, vaccines, toxins, cultures of micro-organisms',
    link_url: 'https://www.tga.gov.au/resources/resource/guidance/importing-therapeutic-goods-personal-use',
    notes: 'Must be entered on ARTG or covered by exemption. Cold chain compliance documentation required. Animal-origin products also require DAFF biosecurity permit.',
  },
  // 3003-3004: TGA — Therapeutic Goods Import Permit (medicines)
  {
    tariff_code_start: '3003',
    tariff_code_end: '3004',
    agency: 'Therapeutic Goods Administration (TGA)',
    permit_type: 'Therapeutic Goods Import Permit',
    description: 'Medicaments — mixed or unmixed products for therapeutic/prophylactic use in measured doses or retail sale',
    link_url: 'https://www.tga.gov.au/importing-exporting-and-manufacturing',
    notes: 'Commercial import: product must be on ARTG. Personal import: limited to 3 months supply with valid prescription under Personal Import Scheme. GMP compliance required for manufacturers.',
  },
  // 3808: APVMA — Agricultural Chemical Permit
  {
    tariff_code_start: '3808',
    tariff_code_end: '3808',
    agency: 'Australian Pesticides and Veterinary Medicines Authority (APVMA)',
    permit_type: 'Agricultural Chemical Registration / Research Permit',
    description: 'Insecticides, rodenticides, fungicides, herbicides, disinfectants and similar products',
    link_url: 'https://www.apvma.gov.au/registrations-and-permits',
    notes: 'All agricultural/veterinary chemicals must be APVMA-registered before commercial import and sale. Research permits available for unregistered chemicals. Label must comply with APVMA requirements.',
  },
  // Chapter 36: Dept Home Affairs — Explosives Import Permit
  {
    tariff_code_start: '36',
    tariff_code_end: '36',
    agency: 'Department of Home Affairs',
    permit_type: 'Explosives Import Permit',
    description: 'Explosives, pyrotechnic products, matches, pyrophoric alloys, combustible preparations',
    link_url: 'https://www.homeaffairs.gov.au/help-and-support/how-to-engage-us/permits-and-applications',
    notes: 'Import permit from Dept Home Affairs required. Must also hold state/territory explosives licence for storage and handling. Transport approvals under Australian Dangerous Goods Code.',
  },
  // Chapter 93: Dept Home Affairs — Firearms Import Permit
  {
    tariff_code_start: '93',
    tariff_code_end: '93',
    agency: 'Department of Home Affairs',
    permit_type: 'Firearms Import Permit (B709A)',
    description: 'Arms and ammunition — firearms, weapons, parts, accessories and ammunition',
    link_url: 'https://www.homeaffairs.gov.au/help-and-support/how-to-engage-us/permits-and-applications',
    notes: 'B709A import permit required. Must also hold valid firearms licence in destination state/territory. Police Commissioner approval in destination jurisdiction. Separate permit for each consignment.',
  },
  // 8525-8527: ACMA — Radiocommunications Licence
  {
    tariff_code_start: '8525',
    tariff_code_end: '8527',
    agency: 'Australian Communications and Media Authority (ACMA)',
    permit_type: 'Radiocommunications Licence / Equipment Compliance',
    description: 'Transmission apparatus for radio-broadcasting/television, radio navigation, reception apparatus',
    link_url: 'https://www.acma.gov.au/equipment-regulation',
    notes: 'Radio transmitting devices must comply with ACMA Radiocommunications (Electromagnetic Compatibility) Standard. Supplier must hold compliance records. Signal jammers/blockers are prohibited devices.',
  },
  // 4401-4421: DAFF — Illegal Logging Declaration
  {
    tariff_code_start: '4401',
    tariff_code_end: '4421',
    agency: 'Department of Agriculture, Fisheries and Forestry (DAFF)',
    permit_type: 'Illegal Logging Due Diligence / Declaration',
    description: 'Wood and articles of wood — regulated timber products require illegal logging due diligence',
    link_url: 'https://www.agriculture.gov.au/agriculture-land/forestry/policies/illegal-logging',
    notes: 'Importers of regulated timber products must lodge an Illegal Logging Declaration and maintain timber due diligence records for 5 years. Raw/unprocessed timber also requires biosecurity inspection and treatment.',
  },
  // Chapter 71: No permit but customs reporting
  {
    tariff_code_start: '71',
    tariff_code_end: '71',
    agency: 'Australian Border Force (ABF) / AUSTRAC',
    permit_type: 'Customs Reporting (no permit required)',
    description: 'Precious metals, precious stones, jewellery — no permit but customs value reporting and AML/CTF obligations apply',
    link_url: 'https://www.austrac.gov.au/business/how-comply-guidance-and-resources/reporting/threshold-transaction-reports',
    notes: 'No import permit required. Physical currency/bearer negotiable instruments over AUD 10,000 must be declared. High-value precious metal imports may trigger AUSTRAC threshold transaction reporting.',
  },
  // Chapters 84-85: Energy efficiency labelling
  {
    tariff_code_start: '84',
    tariff_code_end: '85',
    agency: 'Department of Climate Change, Energy, the Environment and Water (DCCEEW)',
    permit_type: 'GEMS Registration / Energy Rating Label',
    description: 'Machinery and electrical equipment — certain products require energy efficiency registration and labelling',
    link_url: 'https://www.energyrating.gov.au/',
    notes: 'Products covered by GEMS (Greenhouse and Energy Minimum Standards) must meet MEPS and carry energy rating labels before sale. Includes air conditioners, motors, transformers, televisions, lighting, refrigerators. Registration via energyrating.gov.au.',
  },
  // CITES-listed species
  {
    tariff_code_start: '0106',
    tariff_code_end: '0106',
    agency: 'Department of Climate Change, Energy, the Environment and Water (DCCEEW)',
    permit_type: 'CITES Import Permit',
    description: 'Live animals not elsewhere specified — CITES permit required for listed species',
    link_url: 'https://www.dcceew.gov.au/environment/wildlife-trade/cites',
    notes: 'CITES-listed species require both an export permit from the country of origin and an Australian import permit. Pre-arrival quarantine facility approval required for live animals.',
  },
  // Ozone depleting substances
  {
    tariff_code_start: '2903',
    tariff_code_end: '2903',
    agency: 'Department of Climate Change, Energy, the Environment and Water (DCCEEW)',
    permit_type: 'Ozone Protection Licence',
    description: 'Halogenated hydrocarbons — ozone depleting substances and synthetic greenhouse gases',
    link_url: 'https://www.dcceew.gov.au/environment/protection/ozone',
    notes: 'Import of ODS and SGGs requires a controlled substances licence under the Ozone Protection and Synthetic Greenhouse Gas Management Act 1989. Quota system applies. HFCs subject to phase-down schedule.',
  },
  // Defence/strategic goods
  {
    tariff_code_start: '9301',
    tariff_code_end: '9307',
    agency: 'Department of Defence — Defence Export Controls',
    permit_type: 'Defence and Strategic Goods Import Notification',
    description: 'Military weapons and parts — may require defence strategic goods notification in addition to Home Affairs firearms permit',
    link_url: 'https://www.defence.gov.au/business-industry/export-controls',
    notes: 'Items on the Defence and Strategic Goods List (DSGL) may have additional import controls. Dual-use goods in Parts 2 and 3 of DSGL also require assessment.',
  },
];

const insert = db.prepare(`
  INSERT INTO permit_requirements
    (tariff_code_start, tariff_code_end, agency, permit_type, description, link_url, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const tx = db.transaction(() => {
  for (const e of entries) {
    insert.run(
      e.tariff_code_start,
      e.tariff_code_end,
      e.agency,
      e.permit_type,
      e.description,
      e.link_url,
      e.notes
    );
  }
});

tx();
const count = (db.prepare('SELECT COUNT(*) as c FROM permit_requirements').get() as any).c;
console.log(`Seeded ${count} permit requirement entries.`);
db.close();
