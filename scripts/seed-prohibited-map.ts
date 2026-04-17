import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Ensure table exists (matches schema in db.ts)
db.exec(`
  CREATE TABLE IF NOT EXISTS prohibited_goods_map (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tariff_code_start TEXT NOT NULL,
    tariff_code_end TEXT,
    regulation_type TEXT NOT NULL,
    regulation_ref TEXT NOT NULL,
    description TEXT,
    severity TEXT DEFAULT 'prohibited',
    permit_required TEXT,
    notes TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_prohibited_tariff ON prohibited_goods_map(tariff_code_start);
`);

// Clear existing data
db.exec('DELETE FROM prohibited_goods_map');

interface ProhibitedEntry {
  tariff_code_start: string;
  tariff_code_end: string | null;
  regulation_type: string;
  regulation_ref: string;
  description: string;
  severity: 'prohibited' | 'restricted' | 'conditional';
  permit_required: string | null;
  notes: string | null;
}

const entries: ProhibitedEntry[] = [
  // ─── PROHIBITED ─────────────────────────────────────────────────────
  // Chapter 93 — Weapons and arms (Customs (Prohibited Imports) Regulations 1956, Reg 4F)
  {
    tariff_code_start: '9301',
    tariff_code_end: '9307',
    regulation_type: 'Customs (Prohibited Imports) Regulations 1956',
    regulation_ref: 'Reg 4F — Weapons and firearms',
    description: 'Military weapons, firearms, parts and accessories, ammunition',
    severity: 'prohibited',
    permit_required: 'Dept Home Affairs — Firearms Import Permit (B709A)',
    notes: 'Absolute prohibition unless holder of valid import permit. All firearms require Police Commissioner approval in destination state/territory.',
  },
  // 9306 — Bombs, grenades, torpedoes, mines
  {
    tariff_code_start: '9306',
    tariff_code_end: '9306',
    regulation_type: 'Customs (Prohibited Imports) Regulations 1956',
    regulation_ref: 'Reg 4F — Weapons; Schedule 6',
    description: 'Bombs, grenades, torpedoes, mines, missiles and similar munitions of war; cartridges and other ammunition and projectiles',
    severity: 'prohibited',
    permit_required: 'Dept Home Affairs — Defence and Strategic Goods Import Permit',
    notes: 'Strictly prohibited for civilian import. Defence/government only with ministerial approval.',
  },
  // 3604 — Fireworks, signalling flares, explosives
  {
    tariff_code_start: '3604',
    tariff_code_end: '3604',
    regulation_type: 'Customs (Prohibited Imports) Regulations 1956',
    regulation_ref: 'Reg 4C — Explosives',
    description: 'Fireworks, signalling flares, rain rockets and fog signals; other pyrotechnic articles',
    severity: 'prohibited',
    permit_required: 'Dept Home Affairs — Explosives Import Permit',
    notes: 'Commercial fireworks require Safe Work Australia explosive authorisation plus state/territory approval. Consumer fireworks prohibited in most states.',
  },
  // Narcotic drugs — specific opium/coca codes
  {
    tariff_code_start: '1302.11',
    tariff_code_end: '1302.19',
    regulation_type: 'Customs (Prohibited Imports) Regulations 1956',
    regulation_ref: 'Reg 5 — Narcotic substances; Schedule 4',
    description: 'Opium extracts and concentrates, vegetable saps and extracts used in narcotics production',
    severity: 'prohibited',
    permit_required: 'Office of Drug Control — Licence and Permit',
    notes: 'Import prohibited under Customs Act 1901 s233B. Severe criminal penalties apply including imprisonment.',
  },
  // Narcotic precursors — ephedrine, pseudoephedrine
  {
    tariff_code_start: '2939.41',
    tariff_code_end: '2939.49',
    regulation_type: 'Customs (Prohibited Imports) Regulations 1956',
    regulation_ref: 'Reg 5A — Drug precursors; Schedule 4',
    description: 'Ephedrine, pseudoephedrine and their salts — precursor chemicals for amphetamine-type stimulants',
    severity: 'prohibited',
    permit_required: 'Office of Drug Control — Import Permit',
    notes: 'Border-controlled precursors under Criminal Code Act 1995, Division 306. Strict end-user certificate requirements.',
  },
  // Narcotic precursors — safrole/piperonal
  {
    tariff_code_start: '2932.91',
    tariff_code_end: '2932.99',
    regulation_type: 'Customs (Prohibited Imports) Regulations 1956',
    regulation_ref: 'Reg 5A — Drug precursors; Schedule 8',
    description: 'Safrole, isosafrole, piperonal and other MDMA precursor chemicals',
    severity: 'prohibited',
    permit_required: 'Office of Drug Control — Import Permit',
    notes: 'Tier 1 border-controlled precursors. Import attracts severe penalties.',
  },
  // Objectionable material
  {
    tariff_code_start: '4911',
    tariff_code_end: '4911',
    regulation_type: 'Customs (Prohibited Imports) Regulations 1956',
    regulation_ref: 'Reg 4A — Objectionable goods',
    description: 'Printed or illustrated material that has been classified RC (Refused Classification) by the Classification Board',
    severity: 'prohibited',
    permit_required: null,
    notes: 'Material depicting child exploitation, extreme violence, or instruction in crime. No permit available — absolute prohibition.',
  },
  // Dog/cat fur
  {
    tariff_code_start: '4301.80',
    tariff_code_end: '4301.80',
    regulation_type: 'Customs (Prohibited Imports) Regulations 1956',
    regulation_ref: 'Reg 4EA — Dog and cat fur',
    description: 'Domestic dog and cat fur and products containing such fur',
    severity: 'prohibited',
    permit_required: null,
    notes: 'Absolute prohibition. No permits issued under any circumstances.',
  },

  // ─── RESTRICTED ─────────────────────────────────────────────────────
  // Chapter 97 — Works of art from sanctioned countries
  {
    tariff_code_start: '9701',
    tariff_code_end: '9706',
    regulation_type: 'Protection of Movable Cultural Heritage Act 1986',
    regulation_ref: 'Autonomous Sanctions Regulations 2011',
    description: 'Works of art, collectors pieces, antiques — restricted when originating from sanctioned countries (Iran, DPRK, Syria, Russia, etc.)',
    severity: 'restricted',
    permit_required: 'Dept Foreign Affairs — Sanctions Permit',
    notes: 'Items of cultural property from sanctioned countries require DFAT approval. UNESCO Convention items require provenance documentation.',
  },
  // 2844 — Radioactive elements and isotopes
  {
    tariff_code_start: '2844',
    tariff_code_end: '2844',
    regulation_type: 'Australian Radiation Protection and Nuclear Safety Act 1998',
    regulation_ref: 'ARPANS Act s13 — Controlled material',
    description: 'Radioactive chemical elements, radioactive isotopes, spent fuel elements (cartridges)',
    severity: 'restricted',
    permit_required: 'ARPANSA — Radiation Apparatus Licence / Source Licence',
    notes: 'Import requires ARPANSA licence under ARPANS Act 1998. Additional requirements under Nuclear Non-Proliferation Act 1987 for fissile material.',
  },
  // 1211 — Plants for pharmacy or insecticide use
  {
    tariff_code_start: '1211',
    tariff_code_end: '1211',
    regulation_type: 'Therapeutic Goods Act 1989',
    regulation_ref: 'TGA — Therapeutic Goods (Standard for Medicinal Cannabis) (TGO 93)',
    description: 'Plants and parts of plants used in pharmacy, perfumery, or for insecticidal/fungicidal purposes',
    severity: 'restricted',
    permit_required: 'TGA — Therapeutic Goods Import Permit; DAFF — Biosecurity Import Permit',
    notes: 'Dual permit required: TGA for therapeutic use, DAFF for biosecurity clearance. Cannabis-related plants require ODC licence.',
  },
  // Chapters 28-29 — Certain chemicals (precursors)
  {
    tariff_code_start: '28',
    tariff_code_end: '29',
    regulation_type: 'Customs (Prohibited Imports) Regulations 1956; Industrial Chemicals Act 2019',
    regulation_ref: 'Reg 5A Schedule 8; AICIS registration',
    description: 'Inorganic and organic chemicals — certain precursor chemicals and industrial chemicals requiring assessment',
    severity: 'restricted',
    permit_required: 'OCS (Office of Chemical Safety) / AICIS — Chemical Introduction Permit',
    notes: 'New chemicals must be assessed under AICIS before import. Precursor chemicals listed in Schedule 8 of Prohibited Imports Regs require end-user certificates.',
  },
  // 0106 — Live animals
  {
    tariff_code_start: '0106',
    tariff_code_end: '0106',
    regulation_type: 'Biosecurity Act 2015',
    regulation_ref: 'Chapter 3 — Managing biosecurity risks',
    description: 'Live animals not elsewhere specified — exotic animals, reptiles, birds, insects',
    severity: 'restricted',
    permit_required: 'DAFF — Live Animal Import Permit; CITES Permit (if applicable)',
    notes: 'Strict quarantine requirements. CITES-listed species require export permit from country of origin. Pre-arrival quarantine facility approval required.',
  },
  // 8525-8527 — Radio and TV transmitters
  {
    tariff_code_start: '8525',
    tariff_code_end: '8527',
    regulation_type: 'Radiocommunications Act 1992',
    regulation_ref: 'Part 4.1 — Radiocommunications licences',
    description: 'Transmission apparatus for radio-broadcasting or television; radio navigational aid apparatus; reception apparatus',
    severity: 'restricted',
    permit_required: 'ACMA — Radiocommunications Licence / Equipment Compliance',
    notes: 'Devices capable of radio transmission must comply with ACMA technical standards. Jammers, signal blockers are prohibited devices.',
  },
  // 2403 — Tobacco products
  {
    tariff_code_start: '2403',
    tariff_code_end: '2403',
    regulation_type: 'Customs Act 1901; Excise Act 1901',
    regulation_ref: 'Customs Tariff Act 1995 Schedule 3; Excise Tariff Act 1921',
    description: 'Other manufactured tobacco and manufactured tobacco substitutes; homogenised or reconstituted tobacco; tobacco extracts and essences',
    severity: 'restricted',
    permit_required: 'ABF — Tobacco Import Permit',
    notes: 'Import restricted to licenced tobacco dealers. Personal tobacco allowance: 25 cigarettes or 25g loose tobacco. Excise duty applies. Illicit tobacco attracts severe penalties.',
  },
  // 2401-2402 — Unmanufactured tobacco, cigars, cigarettes
  {
    tariff_code_start: '2401',
    tariff_code_end: '2402',
    regulation_type: 'Customs Act 1901; Excise Act 1901',
    regulation_ref: 'Customs Tariff Act 1995 Schedule 3',
    description: 'Unmanufactured tobacco; cigars, cheroots, cigarillos and cigarettes',
    severity: 'restricted',
    permit_required: 'ABF — Tobacco Import Permit',
    notes: 'Must hold ABF tobacco import permit. Plain packaging requirements under Tobacco Plain Packaging Act 2011. Excise duty payable.',
  },
  // 2204-2208 — Alcohol
  {
    tariff_code_start: '2204',
    tariff_code_end: '2208',
    regulation_type: 'Customs Act 1901; Excise Act 1901',
    regulation_ref: 'Customs Tariff Act 1995 Schedule 3; Wine Equalisation Tax Act 1999',
    description: 'Wine, vermouth, fermented beverages, ethyl alcohol (undenatured), spirits, liqueurs',
    severity: 'restricted',
    permit_required: null,
    notes: 'Subject to excise duty and WET (wine equalisation tax). Customs duty varies by alcohol content and type. Personal allowance: 2.25L per adult traveller. Commercial importers must hold appropriate excise licence.',
  },
  // 3002 — Blood, vaccines, toxins
  {
    tariff_code_start: '3002',
    tariff_code_end: '3002',
    regulation_type: 'Therapeutic Goods Act 1989',
    regulation_ref: 'TGA — Therapeutic Goods (Listing/Registration) requirements',
    description: 'Human blood; animal blood; antisera; vaccines, toxins, cultures of micro-organisms',
    severity: 'restricted',
    permit_required: 'TGA — Therapeutic Goods Import Permit; DAFF — Biosecurity Permit (animal origin)',
    notes: 'Must be TGA-registered or exempt. Cold chain requirements apply. Animal-origin products also need DAFF biosecurity clearance.',
  },
  // 3003-3004 — Medicaments
  {
    tariff_code_start: '3003',
    tariff_code_end: '3004',
    regulation_type: 'Therapeutic Goods Act 1989',
    regulation_ref: 'Part 3-3 — Criminal offences relating to therapeutic goods',
    description: 'Medicaments consisting of mixed/unmixed products for therapeutic or prophylactic uses, put up in measured doses or for retail sale',
    severity: 'restricted',
    permit_required: 'TGA — Therapeutic Goods Import Permit',
    notes: 'Must be listed on ARTG (Australian Register of Therapeutic Goods) or hold SAS/authorised prescriber approval. Personal import scheme limited to 3 months supply.',
  },
  // 3808 — Pesticides, herbicides, disinfectants
  {
    tariff_code_start: '3808',
    tariff_code_end: '3808',
    regulation_type: 'Agricultural and Veterinary Chemicals Code Act 1994',
    regulation_ref: 'APVMA registration requirements',
    description: 'Insecticides, rodenticides, fungicides, herbicides, anti-sprouting products, plant-growth regulators, disinfectants',
    severity: 'restricted',
    permit_required: 'APVMA — Agricultural Chemical Registration; DAFF — Biosecurity',
    notes: 'Agricultural chemicals must be APVMA-registered before sale/use in Australia. Import of unregistered chemicals requires APVMA research permit.',
  },

  // ─── CONDITIONAL ────────────────────────────────────────────────────
  // Chapters 01-05 — Animal products (biosecurity)
  {
    tariff_code_start: '01',
    tariff_code_end: '05',
    regulation_type: 'Biosecurity Act 2015',
    regulation_ref: 'Chapter 3 — Managing biosecurity risks; BICON conditions',
    description: 'Live animals, meat, fish, dairy, animal products — all subject to biosecurity inspection',
    severity: 'conditional',
    permit_required: 'DAFF — Biosecurity Import Permit (species-specific)',
    notes: 'All animal products must meet BICON (Biosecurity Import Conditions) requirements. Mandatory inspection on arrival. Some products require pre-shipment treatment or testing.',
  },
  // Chapters 06-14 — Plant products (biosecurity)
  {
    tariff_code_start: '06',
    tariff_code_end: '14',
    regulation_type: 'Biosecurity Act 2015',
    regulation_ref: 'Chapter 3 — Managing biosecurity risks; BICON conditions',
    description: 'Live plants, vegetables, fruit, cereals, seeds, plant products — all subject to biosecurity inspection',
    severity: 'conditional',
    permit_required: 'DAFF — Biosecurity Import Permit (commodity-specific)',
    notes: 'All plant products must meet BICON requirements. Phytosanitary certificate from country of origin generally required. Subject to inspection and possible fumigation/treatment on arrival.',
  },
  // 0901-0902 — Coffee, tea (food inspection)
  {
    tariff_code_start: '0901',
    tariff_code_end: '0902',
    regulation_type: 'Imported Food Control Act 1992',
    regulation_ref: 'Imported Food Inspection Scheme (IFIS)',
    description: 'Coffee and tea — subject to imported food inspection requirements',
    severity: 'conditional',
    permit_required: null,
    notes: 'Subject to IFIS risk profiling. Certain origins/categories attract higher inspection rates. Must comply with Food Standards Australia New Zealand (FSANZ) Code. Mycotoxin testing may apply.',
  },
  // Chapter 15 — Fats and oils
  {
    tariff_code_start: '15',
    tariff_code_end: '15',
    regulation_type: 'Biosecurity Act 2015; Imported Food Control Act 1992',
    regulation_ref: 'BICON; IFIS',
    description: 'Animal or vegetable fats and oils — biosecurity and food safety requirements',
    severity: 'conditional',
    permit_required: 'DAFF — Biosecurity Import Permit (if animal origin)',
    notes: 'Animal-origin fats require biosecurity clearance. All edible fats/oils subject to IFIS. Must meet FSANZ standards for contaminants.',
  },
  // Chapters 16-24 — Food products
  {
    tariff_code_start: '16',
    tariff_code_end: '24',
    regulation_type: 'Imported Food Control Act 1992; Biosecurity Act 2015',
    regulation_ref: 'IFIS; BICON; FSANZ Code',
    description: 'Prepared foods, beverages, tobacco — subject to imported food inspection and biosecurity',
    severity: 'conditional',
    permit_required: null,
    notes: 'Subject to IFIS risk-based inspection. Must comply with FSANZ Food Standards Code including labelling, composition, and contaminant limits. Some products require biosecurity clearance.',
  },
  // 4401-4421 — Timber products
  {
    tariff_code_start: '4401',
    tariff_code_end: '4421',
    regulation_type: 'Illegal Logging Prohibition Act 2012',
    regulation_ref: 'Illegal Logging Prohibition Regulation 2012',
    description: 'Wood and articles of wood — subject to illegal logging due diligence requirements',
    severity: 'conditional',
    permit_required: 'DAFF — Illegal Logging Declaration (timber due diligence)',
    notes: 'Importers must lodge an Illegal Logging Declaration and maintain due diligence records. Applies to regulated timber products at first point of import. DAFF biosecurity inspection also required for raw timber.',
  },
  // Chapter 71 — Precious metals (reporting)
  {
    tariff_code_start: '71',
    tariff_code_end: '71',
    regulation_type: 'Anti-Money Laundering and Counter-Terrorism Financing Act 2006',
    regulation_ref: 'AML/CTF Act — Bearer negotiable instruments',
    description: 'Precious metals, precious stones, jewellery — customs reporting threshold applies',
    severity: 'conditional',
    permit_required: null,
    notes: 'No import permit required but physical currency and bearer negotiable instruments over AUD 10,000 must be declared. High-value imports may trigger AUSTRAC reporting. No duty on gold bullion.',
  },
  // Chapters 84-85 — Machinery/electrical (energy efficiency)
  {
    tariff_code_start: '84',
    tariff_code_end: '85',
    regulation_type: 'Greenhouse and Energy Minimum Standards Act 2012',
    regulation_ref: 'GEMS Determination',
    description: 'Machinery, electrical equipment — energy efficiency labelling and MEPS may apply',
    severity: 'conditional',
    permit_required: null,
    notes: 'Certain products (air conditioners, motors, transformers, lighting) must meet Minimum Energy Performance Standards (MEPS) and carry energy rating labels. Registration with GEMS regulator required before sale.',
  },
  // Chapter 36 — Explosives
  {
    tariff_code_start: '36',
    tariff_code_end: '36',
    regulation_type: 'Customs (Prohibited Imports) Regulations 1956',
    regulation_ref: 'Reg 4C — Explosives and explosive precursors',
    description: 'Explosives, pyrotechnic products, matches, pyrophoric alloys, certain combustible preparations',
    severity: 'restricted',
    permit_required: 'Dept Home Affairs — Explosives Import Permit',
    notes: 'All explosives require import permit. Additional state/territory storage and handling approvals needed. Must comply with Australian Dangerous Goods Code.',
  },
  // Asbestos
  {
    tariff_code_start: '2524',
    tariff_code_end: '2524',
    regulation_type: 'Customs (Prohibited Imports) Regulations 1956',
    regulation_ref: 'Reg 4C — Asbestos prohibition',
    description: 'Asbestos — all forms',
    severity: 'prohibited',
    permit_required: null,
    notes: 'Total ban on asbestos import into Australia since 31 December 2003. No permits available. Applies to all chrysotile and amphibole asbestos.',
  },
  // Kava
  {
    tariff_code_start: '1211.90',
    tariff_code_end: '1211.90',
    regulation_type: 'Customs (Prohibited Imports) Regulations 1956',
    regulation_ref: 'Reg 5 — Kava restrictions',
    description: 'Kava (Piper methysticum) — import restrictions apply',
    severity: 'restricted',
    permit_required: null,
    notes: 'Personal import allowance of 4kg dried kava per person. Commercial import requires TGA approval. Not to be imported in liquid or concentrate form for personal use.',
  },
  // Steroids/performance enhancers
  {
    tariff_code_start: '2937',
    tariff_code_end: '2937',
    regulation_type: 'Customs (Prohibited Imports) Regulations 1956',
    regulation_ref: 'Reg 5 — Performance and image enhancing drugs',
    description: 'Hormones, prostaglandins, thromboxanes and leukotrienes — including anabolic steroids',
    severity: 'restricted',
    permit_required: 'TGA — Personal Import Scheme (limited); ODC for commercial',
    notes: 'Anabolic steroids are border-controlled drugs. Personal import limited to 3 months supply with valid prescription. Commercial import requires TGA registration.',
  },
  // Electronic cigarettes/vaping
  {
    tariff_code_start: '8543.40',
    tariff_code_end: '8543.40',
    regulation_type: 'Therapeutic Goods Act 1989; Customs (Prohibited Imports) Regulations 1956',
    regulation_ref: 'TGA — Nicotine vaping products',
    description: 'Electronic cigarettes and personal vaporisers containing nicotine',
    severity: 'restricted',
    permit_required: 'TGA — Therapeutic Goods Import Permit with valid prescription',
    notes: 'Nicotine vaping products classified as therapeutic goods. Import requires valid Australian prescription. Commercial importation restricted to licenced entities from 1 January 2024.',
  },
  // Ivory and wildlife products
  {
    tariff_code_start: '0507',
    tariff_code_end: '0507',
    regulation_type: 'Environment Protection and Biodiversity Conservation Act 1999',
    regulation_ref: 'EPBC Act Part 13A — CITES species',
    description: 'Ivory, tortoise-shell, whalebone, horns, hooves, claws — wildlife products',
    severity: 'prohibited',
    permit_required: 'DCCEEW — CITES Permit (limited exemptions for antiques)',
    notes: 'Elephant ivory import effectively banned. CITES-listed species products require import/export permits. Pre-Convention certificates required for antique items.',
  },
];

const insert = db.prepare(`
  INSERT INTO prohibited_goods_map
    (tariff_code_start, tariff_code_end, regulation_type, regulation_ref, description, severity, permit_required, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const tx = db.transaction(() => {
  for (const e of entries) {
    insert.run(
      e.tariff_code_start,
      e.tariff_code_end,
      e.regulation_type,
      e.regulation_ref,
      e.description,
      e.severity,
      e.permit_required,
      e.notes
    );
  }
});

tx();
const count = (db.prepare('SELECT COUNT(*) as c FROM prohibited_goods_map').get() as any).c;
console.log(`Seeded ${count} prohibited goods map entries.`);
db.close();
