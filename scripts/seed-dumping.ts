import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  DROP TABLE IF EXISTS dumping_notices;
  CREATE TABLE dumping_notices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    commodity TEXT NOT NULL,
    countries TEXT NOT NULL,
    measure_type TEXT NOT NULL,
    duty_info TEXT,
    tariff_chapters TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    expiry_info TEXT,
    category TEXT NOT NULL,
    notes TEXT
  );
  CREATE INDEX idx_dump_commodity ON dumping_notices(commodity);
  CREATE INDEX idx_dump_category ON dumping_notices(category);
`);

interface DumpNotice {
  commodity: string;
  countries: string;
  measure_type: string;
  duty_info?: string | null;
  tariff_chapters?: string | null;
  status?: string;
  expiry_info?: string | null;
  category: string;
  notes?: string | null;
}

const notices: DumpNotice[] = [
  // Steel Products
  { commodity: 'Aluminium Zinc Coated (Galvanised) Steel', countries: 'China, Korea, Vietnam', measure_type: 'Dumping duty', tariff_chapters: 'Ch.72-73', category: 'Steel', notes: 'Flat-rolled products of iron or non-alloy steel, coated with aluminium-zinc alloy' },
  { commodity: 'Deep Drawn Stainless Steel Sinks', countries: 'China', measure_type: 'Dumping duty', tariff_chapters: 'Ch.73', category: 'Steel', duty_info: 'Revoked for exporters generally from 25 June 2024; some individual measures remain', notes: 'Kitchen/laundry sinks of stainless steel' },
  { commodity: 'Hollow Structural Sections', countries: 'China, Korea, Malaysia, Chinese Taipei', measure_type: 'Dumping duty', tariff_chapters: 'Ch.73', category: 'Steel', notes: 'HSS — rectangular, square, and circular hollow sections of carbon steel' },
  { commodity: 'Hot Rolled Coil Steel', countries: 'Chinese Taipei', measure_type: 'Dumping duty', tariff_chapters: 'Ch.72', category: 'Steel', notes: 'Hot rolled coils/sheets/strip of iron or non-alloy steel' },
  { commodity: 'Hot Rolled Structural Steel Sections', countries: 'Japan, Korea, Chinese Taipei, Thailand', measure_type: 'Dumping duty', tariff_chapters: 'Ch.72', category: 'Steel', notes: 'I-beams, H-beams, channels, angles of hot rolled structural steel' },
  { commodity: 'Painted Steel Strapping', countries: 'China', measure_type: 'Dumping duty', tariff_chapters: 'Ch.73', category: 'Steel', notes: 'Steel strapping coated or covered with paint, lacquer, or plastic' },
  { commodity: 'Precision Pipe and Tube Steel', countries: 'China, Korea', measure_type: 'Dumping duty', tariff_chapters: 'Ch.73', category: 'Steel', notes: 'Electric resistance welded precision steel tube and pipe' },
  { commodity: 'Quenched and Tempered Steel Plate', countries: 'Finland, Japan, Sweden', measure_type: 'Dumping duty', tariff_chapters: 'Ch.72', category: 'Steel', notes: 'Q&T steel plate with minimum yield strength' },
  { commodity: 'Rod in Coils', countries: 'China', measure_type: 'Dumping duty & Countervailing duty', tariff_chapters: 'Ch.72', category: 'Steel', notes: 'Hot-rolled steel rod in coils' },
  { commodity: 'Steel Pallet Racking', countries: 'China, Malaysia', measure_type: 'Dumping duty', tariff_chapters: 'Ch.73, Ch.94', category: 'Steel', notes: 'Selective pallet racking of steel' },
  { commodity: 'Steel Reinforcing Bar', countries: 'China, Greece, Indonesia, Korea, Spain, Chinese Taipei', measure_type: 'Dumping duty', tariff_chapters: 'Ch.72', category: 'Steel', notes: 'Deformed steel reinforcing bar (rebar) for construction' },
  { commodity: 'Zinc Coated (Galvanised) Steel', countries: 'China, India, Korea, Malaysia, Chinese Taipei, Vietnam', measure_type: 'Dumping duty', tariff_chapters: 'Ch.72', category: 'Steel', notes: 'Flat-rolled products of iron or non-alloy steel, zinc coated' },
  { commodity: 'Flat Rolled Steel Products', countries: 'China, Korea', measure_type: 'Dumping duty', tariff_chapters: 'Ch.72-73', category: 'Steel', notes: 'Case 688 — certain flat rolled steel products' },

  // Aluminium Products
  { commodity: 'Aluminium Extrusions', countries: 'China', measure_type: 'Dumping duty & Countervailing duty', tariff_chapters: 'Ch.76', category: 'Aluminium', expiry_info: 'Measures until 28 October 2025', notes: 'Extruded profiles and sections of aluminium alloy' },
  { commodity: 'Aluminium Extrusions (Mill Finish & Surface Finish)', countries: 'Malaysia', measure_type: 'Dumping duty', tariff_chapters: 'Ch.76', category: 'Aluminium', expiry_info: 'Measures until 2 June 2026', notes: 'Mill finish and surface finish aluminium extrusions' },
  { commodity: 'Aluminium Extrusions', countries: 'Vietnam', measure_type: 'Dumping duty', tariff_chapters: 'Ch.76', category: 'Aluminium', expiry_info: 'Measures until 27 June 2027', notes: 'Extruded profiles and sections of aluminium alloy from Vietnam' },

  // Chemicals
  { commodity: 'Ammonium Nitrate', countries: 'Various', measure_type: 'Dumping duty', tariff_chapters: 'Ch.31', category: 'Chemicals', notes: 'Ammonium nitrate fertiliser — anti-dumping measures in place' },
  { commodity: '2,4-Dichlorophenoxyacetic Acid (2,4-D)', countries: 'China', measure_type: 'Dumping duty', tariff_chapters: 'Ch.29, Ch.38', category: 'Chemicals', notes: 'Herbicide — 2,4-D and its salts and esters' },
  { commodity: 'Silicon Metal', countries: 'China', measure_type: 'Dumping duty & Countervailing duty', tariff_chapters: 'Ch.28', category: 'Chemicals', duty_info: 'Provisional AD rate 16.2%, CVD rate 29.4%, combined 45.6%', notes: 'Second sunset review completed 2025' },

  // Glass & Building Materials
  { commodity: 'Clear Float Glass', countries: 'Indonesia', measure_type: 'Dumping duty', tariff_chapters: 'Ch.70', category: 'Building Materials', notes: 'Clear float/drawn/cast glass in sheets' },
  { commodity: 'Concrete Underlay Film', countries: 'Malaysia', measure_type: 'Dumping duty', tariff_chapters: 'Ch.39', category: 'Building Materials', notes: 'Polyethylene film for use as concrete underlay' },

  // Industrial Equipment
  { commodity: 'Power Transformers', countries: 'Indonesia, Chinese Taipei', measure_type: 'Dumping duty', tariff_chapters: 'Ch.85', category: 'Industrial Equipment', notes: 'Liquid dielectric power transformers' },
  { commodity: 'Railway Wheels', countries: 'China', measure_type: 'Dumping duty', tariff_chapters: 'Ch.86', category: 'Industrial Equipment', duty_info: 'AD rate 13.3% continuing from 17 July 2024', notes: 'Certain railway wheels of carbon or alloy steel' },
  { commodity: 'Wire Rope', countries: 'South Africa', measure_type: 'Dumping duty', tariff_chapters: 'Ch.73', category: 'Industrial Equipment', notes: 'Wire rope and cable of iron or steel' },

  // Other Products
  { commodity: 'A4 Copy Paper', countries: 'Various', measure_type: 'Dumping duty', tariff_chapters: 'Ch.48', category: 'Paper', notes: 'A4 copy/offset paper in reams' },
  { commodity: 'Chrome Bars', countries: 'Romania', measure_type: 'Dumping duty', tariff_chapters: 'Ch.73', category: 'Metals', notes: 'Chrome-plated steel bars for hydraulic cylinders' },
  { commodity: 'PVC Flat Electric Cables', countries: 'China', measure_type: 'Dumping duty', tariff_chapters: 'Ch.85', category: 'Electrical', notes: 'PVC insulated flat electric cables for building wiring' },
];

const insert = db.prepare(`
  INSERT INTO dumping_notices (commodity, countries, measure_type, duty_info, tariff_chapters, status, expiry_info, category, notes)
  VALUES (@commodity, @countries, @measure_type, @duty_info, @tariff_chapters, @status, @expiry_info, @category, @notes)
`);

db.transaction(() => {
  for (const n of notices) {
    insert.run({
      commodity: n.commodity,
      countries: n.countries,
      measure_type: n.measure_type,
      duty_info: n.duty_info || null,
      tariff_chapters: n.tariff_chapters || null,
      status: n.status || 'Active',
      expiry_info: n.expiry_info || null,
      category: n.category,
      notes: n.notes || null,
    });
  }
})();

db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS dumping_fts USING fts5(
    commodity, countries, measure_type, category, notes, tariff_chapters,
    content='dumping_notices', content_rowid='id'
  );
  INSERT INTO dumping_fts(dumping_fts) VALUES('rebuild');
`);

const count = (db.prepare('SELECT COUNT(*) as cnt FROM dumping_notices').get() as { cnt: number }).cnt;
console.log(`Seeded ${count} anti-dumping/countervailing duty notices`);
db.close();
