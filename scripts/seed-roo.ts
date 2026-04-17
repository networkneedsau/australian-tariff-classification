import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Ensure table exists (also created by db.ts auto-init)
db.exec(`
  CREATE TABLE IF NOT EXISTS roo_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fta_schedule TEXT NOT NULL,
    fta_name TEXT NOT NULL,
    chapter_start INTEGER,
    chapter_end INTEGER,
    hs_code_start TEXT,
    hs_code_end TEXT,
    rule_type TEXT NOT NULL,
    rule_description TEXT NOT NULL,
    rvc_threshold REAL,
    ctc_level TEXT,
    specific_requirements TEXT,
    notes TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_roo_fta ON roo_rules(fta_schedule);
  CREATE INDEX IF NOT EXISTS idx_roo_hs ON roo_rules(hs_code_start);
`);

// Clear existing data for a clean seed
db.exec(`DELETE FROM roo_rules`);

interface RooRule {
  fta_schedule: string;
  fta_name: string;
  chapter_start: number;
  chapter_end: number;
  rule_type: string;              // WO | CTC | RVC | SP
  rule_description: string;
  rvc_threshold?: number | null;
  ctc_level?: string | null;      // chapter | heading | subheading
  specific_requirements?: string | null;
  notes?: string | null;
}

const rules: RooRule[] = [
  // ═══════════════════════════════════════════════════════════════════
  // ChAFTA  (Schedule 12 — China-Australia FTA)
  // ═══════════════════════════════════════════════════════════════════

  // Agricultural / Live animals / Food
  { fta_schedule: 'SCHEDULE_12', fta_name: 'ChAFTA', chapter_start: 1, chapter_end: 5,
    rule_type: 'WO', rule_description: 'Wholly obtained or produced in the territory of a Party',
    notes: 'Live animals, meat and edible meat offal — must be born and raised or wholly obtained' },
  { fta_schedule: 'SCHEDULE_12', fta_name: 'ChAFTA', chapter_start: 6, chapter_end: 14,
    rule_type: 'WO', rule_description: 'Wholly obtained or produced in the territory of a Party',
    notes: 'Live trees, vegetables, fruit, cereals — must be harvested or gathered in the territory' },
  { fta_schedule: 'SCHEDULE_12', fta_name: 'ChAFTA', chapter_start: 15, chapter_end: 24,
    rule_type: 'CTC', rule_description: 'Change to the good from any other chapter',
    ctc_level: 'chapter',
    notes: 'Processed food, beverages, tobacco — chapter-level change in tariff classification required' },

  // Minerals
  { fta_schedule: 'SCHEDULE_12', fta_name: 'ChAFTA', chapter_start: 25, chapter_end: 27,
    rule_type: 'WO', rule_description: 'Wholly obtained: extracted or taken from the soil, waters, or seabed',
    notes: 'Salt, stone, ores, mineral fuels — alternative CTC heading rule also available' },
  { fta_schedule: 'SCHEDULE_12', fta_name: 'ChAFTA', chapter_start: 25, chapter_end: 27,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Minerals — heading-level CTC alternative to WO' },

  // Chemicals
  { fta_schedule: 'SCHEDULE_12', fta_name: 'ChAFTA', chapter_start: 28, chapter_end: 38,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Chemicals, pharmaceuticals, fertilisers, plastics in primary form' },
  { fta_schedule: 'SCHEDULE_12', fta_name: 'ChAFTA', chapter_start: 28, chapter_end: 38,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 40%',
    rvc_threshold: 40,
    notes: 'Chemicals — RVC alternative to CTC heading rule' },

  // Plastics & Rubber
  { fta_schedule: 'SCHEDULE_12', fta_name: 'ChAFTA', chapter_start: 39, chapter_end: 40,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Plastics and articles thereof; Rubber and articles thereof' },
  { fta_schedule: 'SCHEDULE_12', fta_name: 'ChAFTA', chapter_start: 39, chapter_end: 40,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 40%',
    rvc_threshold: 40,
    notes: 'Plastics / Rubber — RVC alternative' },

  // Textiles
  { fta_schedule: 'SCHEDULE_12', fta_name: 'ChAFTA', chapter_start: 50, chapter_end: 63,
    rule_type: 'CTC', rule_description: 'Change to the good from any other chapter (yarn forward rule)',
    ctc_level: 'chapter',
    notes: 'Textiles and textile articles — yarn forward: all non-originating yarn must be spun in territory' },
  { fta_schedule: 'SCHEDULE_12', fta_name: 'ChAFTA', chapter_start: 50, chapter_end: 63,
    rule_type: 'SP', rule_description: 'Yarn forward: all non-originating fibre/yarn must undergo spinning in the territory of a Party',
    specific_requirements: 'Spinning of fibre into yarn, or extrusion of filament, must occur in the territory',
    notes: 'Specific process rule for textiles as alternative to CTC' },

  // Machinery & Electrical
  { fta_schedule: 'SCHEDULE_12', fta_name: 'ChAFTA', chapter_start: 84, chapter_end: 85,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Nuclear reactors, boilers, machinery; Electrical machinery and equipment' },
  { fta_schedule: 'SCHEDULE_12', fta_name: 'ChAFTA', chapter_start: 84, chapter_end: 85,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 40%',
    rvc_threshold: 40,
    notes: 'Machinery/Electrical — RVC alternative' },

  // Vehicles
  { fta_schedule: 'SCHEDULE_12', fta_name: 'ChAFTA', chapter_start: 87, chapter_end: 87,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Vehicles other than railway or tramway rolling stock' },
  { fta_schedule: 'SCHEDULE_12', fta_name: 'ChAFTA', chapter_start: 87, chapter_end: 87,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 40%',
    rvc_threshold: 40,
    notes: 'Vehicles — RVC alternative' },

  // ═══════════════════════════════════════════════════════════════════
  // KAFTA  (Schedule 10 — Korea-Australia FTA)
  // ═══════════════════════════════════════════════════════════════════

  { fta_schedule: 'SCHEDULE_10', fta_name: 'KAFTA', chapter_start: 1, chapter_end: 14,
    rule_type: 'WO', rule_description: 'Wholly obtained or produced in the territory of a Party',
    notes: 'Agricultural and animal products' },
  { fta_schedule: 'SCHEDULE_10', fta_name: 'KAFTA', chapter_start: 15, chapter_end: 24,
    rule_type: 'CTC', rule_description: 'Change to the good from any other chapter',
    ctc_level: 'chapter',
    notes: 'Processed food and beverages' },
  { fta_schedule: 'SCHEDULE_10', fta_name: 'KAFTA', chapter_start: 25, chapter_end: 27,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Mineral products' },
  { fta_schedule: 'SCHEDULE_10', fta_name: 'KAFTA', chapter_start: 28, chapter_end: 40,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Chemicals, plastics, rubber' },
  { fta_schedule: 'SCHEDULE_10', fta_name: 'KAFTA', chapter_start: 28, chapter_end: 40,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 35%',
    rvc_threshold: 35,
    notes: 'Chemicals, plastics, rubber — RVC alternative at 35% threshold' },
  { fta_schedule: 'SCHEDULE_10', fta_name: 'KAFTA', chapter_start: 50, chapter_end: 63,
    rule_type: 'CTC', rule_description: 'Change to the good from any other chapter',
    ctc_level: 'chapter',
    notes: 'Textiles and textile articles' },
  { fta_schedule: 'SCHEDULE_10', fta_name: 'KAFTA', chapter_start: 84, chapter_end: 85,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Machinery and electrical equipment' },
  { fta_schedule: 'SCHEDULE_10', fta_name: 'KAFTA', chapter_start: 84, chapter_end: 85,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 35%',
    rvc_threshold: 35,
    notes: 'Machinery/Electrical — RVC alternative at 35%' },
  { fta_schedule: 'SCHEDULE_10', fta_name: 'KAFTA', chapter_start: 87, chapter_end: 87,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Vehicles' },
  { fta_schedule: 'SCHEDULE_10', fta_name: 'KAFTA', chapter_start: 87, chapter_end: 87,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 35%',
    rvc_threshold: 35,
    notes: 'Vehicles — RVC alternative at 35%' },

  // ═══════════════════════════════════════════════════════════════════
  // JAEPA  (Schedule 11 — Japan-Australia EPA)
  // ═══════════════════════════════════════════════════════════════════

  { fta_schedule: 'SCHEDULE_11', fta_name: 'JAEPA', chapter_start: 1, chapter_end: 14,
    rule_type: 'WO', rule_description: 'Wholly obtained or produced in the territory of a Party',
    notes: 'Agricultural products' },
  { fta_schedule: 'SCHEDULE_11', fta_name: 'JAEPA', chapter_start: 1, chapter_end: 14,
    rule_type: 'CTC', rule_description: 'Change to the good from any other chapter',
    ctc_level: 'chapter',
    notes: 'Agricultural — CTC alternative for processed goods' },
  { fta_schedule: 'SCHEDULE_11', fta_name: 'JAEPA', chapter_start: 15, chapter_end: 24,
    rule_type: 'CTC', rule_description: 'Change to the good from any other chapter',
    ctc_level: 'chapter',
    notes: 'Processed food' },
  { fta_schedule: 'SCHEDULE_11', fta_name: 'JAEPA', chapter_start: 25, chapter_end: 27,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Mineral products' },
  { fta_schedule: 'SCHEDULE_11', fta_name: 'JAEPA', chapter_start: 28, chapter_end: 40,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 40%',
    rvc_threshold: 40,
    notes: 'Chemicals, plastics, rubber' },
  { fta_schedule: 'SCHEDULE_11', fta_name: 'JAEPA', chapter_start: 28, chapter_end: 40,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Chemicals — CTC alternative' },
  { fta_schedule: 'SCHEDULE_11', fta_name: 'JAEPA', chapter_start: 50, chapter_end: 63,
    rule_type: 'CTC', rule_description: 'Change to the good from any other chapter',
    ctc_level: 'chapter',
    notes: 'Textiles' },
  { fta_schedule: 'SCHEDULE_11', fta_name: 'JAEPA', chapter_start: 84, chapter_end: 85,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 40%',
    rvc_threshold: 40,
    notes: 'Machinery and electrical' },
  { fta_schedule: 'SCHEDULE_11', fta_name: 'JAEPA', chapter_start: 84, chapter_end: 85,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Machinery — CTC alternative' },
  { fta_schedule: 'SCHEDULE_11', fta_name: 'JAEPA', chapter_start: 87, chapter_end: 87,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 40%',
    rvc_threshold: 40,
    notes: 'Vehicles' },

  // ═══════════════════════════════════════════════════════════════════
  // AANZFTA  (Schedule 8 — ASEAN-Australia-NZ FTA)
  // ═══════════════════════════════════════════════════════════════════

  { fta_schedule: 'SCHEDULE_8', fta_name: 'AANZFTA', chapter_start: 1, chapter_end: 24,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 40%',
    rvc_threshold: 40,
    notes: 'General rule for agricultural and food products' },
  { fta_schedule: 'SCHEDULE_8', fta_name: 'AANZFTA', chapter_start: 1, chapter_end: 24,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'CTC alternative for agricultural products' },
  { fta_schedule: 'SCHEDULE_8', fta_name: 'AANZFTA', chapter_start: 25, chapter_end: 27,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 40%',
    rvc_threshold: 40,
    notes: 'Minerals' },
  { fta_schedule: 'SCHEDULE_8', fta_name: 'AANZFTA', chapter_start: 28, chapter_end: 38,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 40%',
    rvc_threshold: 40,
    notes: 'Chemicals — product-specific rules may apply' },
  { fta_schedule: 'SCHEDULE_8', fta_name: 'AANZFTA', chapter_start: 28, chapter_end: 38,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Chemicals — CTC alternative' },
  { fta_schedule: 'SCHEDULE_8', fta_name: 'AANZFTA', chapter_start: 39, chapter_end: 40,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 40%',
    rvc_threshold: 40,
    notes: 'Plastics and rubber' },
  { fta_schedule: 'SCHEDULE_8', fta_name: 'AANZFTA', chapter_start: 50, chapter_end: 63,
    rule_type: 'CTC', rule_description: 'Change to the good from any other chapter',
    ctc_level: 'chapter',
    notes: 'Textiles — product-specific rules for certain headings' },
  { fta_schedule: 'SCHEDULE_8', fta_name: 'AANZFTA', chapter_start: 50, chapter_end: 63,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 40%',
    rvc_threshold: 40,
    notes: 'Textiles — RVC alternative' },
  { fta_schedule: 'SCHEDULE_8', fta_name: 'AANZFTA', chapter_start: 84, chapter_end: 85,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 40%',
    rvc_threshold: 40,
    notes: 'Machinery and electrical' },
  { fta_schedule: 'SCHEDULE_8', fta_name: 'AANZFTA', chapter_start: 87, chapter_end: 87,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 40%',
    rvc_threshold: 40,
    notes: 'Vehicles' },

  // ═══════════════════════════════════════════════════════════════════
  // CPTPP  (Schedule 8B — Comprehensive and Progressive TPP)
  // ═══════════════════════════════════════════════════════════════════

  { fta_schedule: 'SCHEDULE_8B', fta_name: 'CPTPP', chapter_start: 1, chapter_end: 14,
    rule_type: 'WO', rule_description: 'Wholly obtained or produced in the territory of one or more Parties',
    notes: 'Agricultural products' },
  { fta_schedule: 'SCHEDULE_8B', fta_name: 'CPTPP', chapter_start: 1, chapter_end: 14,
    rule_type: 'CTC', rule_description: 'Change to the good from any other chapter',
    ctc_level: 'chapter',
    notes: 'Agricultural — CTC alternative' },
  { fta_schedule: 'SCHEDULE_8B', fta_name: 'CPTPP', chapter_start: 15, chapter_end: 24,
    rule_type: 'CTC', rule_description: 'Change to the good from any other chapter',
    ctc_level: 'chapter',
    notes: 'Processed food and beverages' },
  { fta_schedule: 'SCHEDULE_8B', fta_name: 'CPTPP', chapter_start: 25, chapter_end: 27,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Minerals' },
  { fta_schedule: 'SCHEDULE_8B', fta_name: 'CPTPP', chapter_start: 28, chapter_end: 38,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Chemicals' },
  { fta_schedule: 'SCHEDULE_8B', fta_name: 'CPTPP', chapter_start: 28, chapter_end: 38,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 45%',
    rvc_threshold: 45,
    notes: 'Chemicals — RVC alternative' },
  { fta_schedule: 'SCHEDULE_8B', fta_name: 'CPTPP', chapter_start: 39, chapter_end: 40,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Plastics and rubber' },
  { fta_schedule: 'SCHEDULE_8B', fta_name: 'CPTPP', chapter_start: 39, chapter_end: 40,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 45%',
    rvc_threshold: 45,
    notes: 'Plastics/rubber — RVC alternative' },
  { fta_schedule: 'SCHEDULE_8B', fta_name: 'CPTPP', chapter_start: 50, chapter_end: 63,
    rule_type: 'CTC', rule_description: 'Change to the good from any other chapter (yarn forward)',
    ctc_level: 'chapter',
    notes: 'Textiles — yarn forward rule' },
  { fta_schedule: 'SCHEDULE_8B', fta_name: 'CPTPP', chapter_start: 50, chapter_end: 63,
    rule_type: 'SP', rule_description: 'Yarn forward: all yarn must be formed in the territory of one or more Parties',
    specific_requirements: 'Spinning of all fibre into yarn, or extrusion of all filament, must occur in the territory of a CPTPP Party',
    notes: 'Textiles specific process rule' },
  { fta_schedule: 'SCHEDULE_8B', fta_name: 'CPTPP', chapter_start: 84, chapter_end: 85,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Machinery and electrical' },
  { fta_schedule: 'SCHEDULE_8B', fta_name: 'CPTPP', chapter_start: 84, chapter_end: 85,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 45%',
    rvc_threshold: 45,
    notes: 'Machinery — RVC alternative' },
  { fta_schedule: 'SCHEDULE_8B', fta_name: 'CPTPP', chapter_start: 87, chapter_end: 87,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 45% using net cost method',
    rvc_threshold: 45,
    notes: 'Automotive — net cost method required for RVC calculation' },
  { fta_schedule: 'SCHEDULE_8B', fta_name: 'CPTPP', chapter_start: 87, chapter_end: 87,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Automotive — CTC alternative' },

  // ═══════════════════════════════════════════════════════════════════
  // A-UKFTA  (Schedule 15 — Australia-United Kingdom FTA)
  // ═══════════════════════════════════════════════════════════════════

  { fta_schedule: 'SCHEDULE_15', fta_name: 'A-UKFTA', chapter_start: 1, chapter_end: 14,
    rule_type: 'WO', rule_description: 'Wholly obtained or produced in the territory of a Party',
    notes: 'Agricultural products' },
  { fta_schedule: 'SCHEDULE_15', fta_name: 'A-UKFTA', chapter_start: 1, chapter_end: 14,
    rule_type: 'CTC', rule_description: 'Change to the good from any other chapter',
    ctc_level: 'chapter',
    notes: 'Agricultural — CTC alternative' },
  { fta_schedule: 'SCHEDULE_15', fta_name: 'A-UKFTA', chapter_start: 15, chapter_end: 24,
    rule_type: 'CTC', rule_description: 'Change to the good from any other chapter',
    ctc_level: 'chapter',
    notes: 'Processed food' },
  { fta_schedule: 'SCHEDULE_15', fta_name: 'A-UKFTA', chapter_start: 25, chapter_end: 27,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Minerals' },
  { fta_schedule: 'SCHEDULE_15', fta_name: 'A-UKFTA', chapter_start: 28, chapter_end: 38,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Chemicals' },
  { fta_schedule: 'SCHEDULE_15', fta_name: 'A-UKFTA', chapter_start: 28, chapter_end: 38,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 45%',
    rvc_threshold: 45,
    notes: 'Chemicals — RVC alternative' },
  { fta_schedule: 'SCHEDULE_15', fta_name: 'A-UKFTA', chapter_start: 39, chapter_end: 40,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Plastics and rubber' },
  { fta_schedule: 'SCHEDULE_15', fta_name: 'A-UKFTA', chapter_start: 39, chapter_end: 40,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 45%',
    rvc_threshold: 45,
    notes: 'Plastics/rubber — RVC alternative' },
  { fta_schedule: 'SCHEDULE_15', fta_name: 'A-UKFTA', chapter_start: 50, chapter_end: 63,
    rule_type: 'CTC', rule_description: 'Change to the good from any other chapter (yarn forward)',
    ctc_level: 'chapter',
    notes: 'Textiles — yarn forward rule' },
  { fta_schedule: 'SCHEDULE_15', fta_name: 'A-UKFTA', chapter_start: 50, chapter_end: 63,
    rule_type: 'SP', rule_description: 'Yarn forward: all yarn must be formed in the territory of a Party',
    specific_requirements: 'Spinning of fibre into yarn must occur in the territory of a Party',
    notes: 'Textiles specific process' },
  { fta_schedule: 'SCHEDULE_15', fta_name: 'A-UKFTA', chapter_start: 84, chapter_end: 85,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Machinery and electrical' },
  { fta_schedule: 'SCHEDULE_15', fta_name: 'A-UKFTA', chapter_start: 84, chapter_end: 85,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 45%',
    rvc_threshold: 45,
    notes: 'Machinery — RVC alternative' },
  { fta_schedule: 'SCHEDULE_15', fta_name: 'A-UKFTA', chapter_start: 87, chapter_end: 87,
    rule_type: 'RVC', rule_description: 'Regional value content of not less than 45%',
    rvc_threshold: 45,
    notes: 'Automotive' },
  { fta_schedule: 'SCHEDULE_15', fta_name: 'A-UKFTA', chapter_start: 87, chapter_end: 87,
    rule_type: 'CTC', rule_description: 'Change to the good from any other heading',
    ctc_level: 'heading',
    notes: 'Automotive — CTC alternative' },
];

// ── Insert all rules ────────────────────────────────────────────────

const insert = db.prepare(`
  INSERT INTO roo_rules (
    fta_schedule, fta_name, chapter_start, chapter_end,
    rule_type, rule_description, rvc_threshold, ctc_level,
    specific_requirements, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const tx = db.transaction(() => {
  for (const r of rules) {
    insert.run(
      r.fta_schedule,
      r.fta_name,
      r.chapter_start,
      r.chapter_end,
      r.rule_type,
      r.rule_description,
      r.rvc_threshold ?? null,
      r.ctc_level ?? null,
      r.specific_requirements ?? null,
      r.notes ?? null,
    );
  }
});

tx();

const count = (db.prepare('SELECT COUNT(*) as c FROM roo_rules').get() as any).c;
console.log(`Seeded ${count} rules of origin across ${new Set(rules.map(r => r.fta_name)).size} FTAs`);

db.close();
