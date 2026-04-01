import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'tariff.db');
const dataDir = path.join(process.cwd(), 'data');

// Delete old DB
if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('Creating tables...');

db.exec(`
  CREATE TABLE tariff_classifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_number INTEGER NOT NULL,
    section_title TEXT NOT NULL,
    chapter_number INTEGER NOT NULL,
    chapter_title TEXT NOT NULL,
    heading_code TEXT NOT NULL,
    heading_description TEXT NOT NULL,
    code TEXT NOT NULL,
    statistical_code TEXT,
    description TEXT NOT NULL,
    unit TEXT,
    duty_rate TEXT,
    duty_rate_numeric REAL,
    is_free INTEGER NOT NULL DEFAULT 0,
    tco_references TEXT
  );

  CREATE INDEX idx_class_code ON tariff_classifications(code);
  CREATE INDEX idx_class_heading ON tariff_classifications(heading_code);
  CREATE INDEX idx_class_chapter ON tariff_classifications(chapter_number);
  CREATE INDEX idx_class_section ON tariff_classifications(section_number);
  CREATE INDEX idx_class_description ON tariff_classifications(description);

  CREATE TABLE tariff_countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    country TEXT NOT NULL,
    abbreviation TEXT NOT NULL,
    schedule TEXT NOT NULL,
    category TEXT NOT NULL
  );

  CREATE INDEX idx_country_abbr ON tariff_countries(abbreviation);
  CREATE INDEX idx_country_name ON tariff_countries(country);

  CREATE TABLE tariff_fta_exclusions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    schedule TEXT NOT NULL,
    fta_name TEXT NOT NULL,
    hs_code TEXT NOT NULL,
    description TEXT NOT NULL,
    duty_rate TEXT
  );

  CREATE INDEX idx_fta_hs ON tariff_fta_exclusions(hs_code);
  CREATE INDEX idx_fta_schedule ON tariff_fta_exclusions(schedule);
`);

// ── Seed Schedule 1 (Countries) ──────────────────────────
console.log('Seeding countries...');
const schedule1 = JSON.parse(fs.readFileSync(path.join(dataDir, 'tariff-schedule1.json'), 'utf-8'));

const insertCountry = db.prepare(
  'INSERT INTO tariff_countries (country, abbreviation, schedule, category) VALUES (?, ?, ?, ?)'
);

let countryCount = 0;
const insertCountries = db.transaction(() => {
  for (const entry of schedule1) {
    insertCountry.run(entry.country, entry.abbreviation, 'Schedule 1', entry.part || '');
    countryCount++;
  }
});
insertCountries();
console.log(`  ${countryCount} countries`);

// ── Seed Schedule 3 (Classifications) ────────────────────
console.log('Seeding classifications...');
const schedule3 = JSON.parse(fs.readFileSync(path.join(dataDir, 'tariff-schedule3.json'), 'utf-8'));

function clean(s: string): string {
  return (s || '').replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '').trim();
}

const SECTION_TITLES: Record<string, string> = {
  'I': 'Live animals; animal products',
  'II': 'Vegetable products',
  'III': 'Animal, vegetable or microbial fats and oils',
  'IV': 'Prepared foodstuffs; beverages, spirits and vinegar; tobacco',
  'V': 'Mineral products',
  'VI': 'Products of the chemical or allied industries',
  'VII': 'Plastics and articles thereof; rubber and articles thereof',
  'VIII': 'Raw hides and skins, leather, furskins and articles thereof',
  'IX': 'Wood and articles of wood; cork; plaiting materials',
  'X': 'Pulp of wood; paper and paperboard and articles thereof',
  'XI': 'Textiles and textile articles',
  'XII': 'Footwear, headgear, umbrellas, walking sticks, feathers',
  'XIII': 'Articles of stone, plaster, cement; ceramic products; glass',
  'XIV': 'Natural or cultured pearls, precious stones, precious metals',
  'XV': 'Base metals and articles of base metal',
  'XVI': 'Machinery and mechanical appliances; electrical equipment',
  'XVII': 'Vehicles, aircraft, vessels and associated transport equipment',
  'XVIII': 'Optical, photographic, cinematographic, measuring instruments',
  'XIX': 'Arms and ammunition; parts and accessories thereof',
  'XX': 'Miscellaneous manufactured articles',
  'XXI': 'Works of art, collectors\' pieces and antiques',
};

const ROMAN_TO_INT: Record<string, number> = {
  'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7,
  'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12, 'XIII': 13,
  'XIV': 14, 'XV': 15, 'XVI': 16, 'XVII': 17, 'XVIII': 18,
  'XIX': 19, 'XX': 20, 'XXI': 21,
};

function parseDutyRate(rate: string | null): { numeric: number | null; isFree: boolean } {
  if (!rate) return { numeric: null, isFree: false };
  const cleaned = rate.trim().toUpperCase();
  if (cleaned === 'FREE' || cleaned === 'FREE FREE') return { numeric: 0, isFree: true };
  const pctMatch = cleaned.match(/^(\d+(?:\.\d+)?)\s*%/);
  if (pctMatch) return { numeric: parseFloat(pctMatch[1]), isFree: false };
  return { numeric: null, isFree: false };
}

const insertClass = db.prepare(`
  INSERT INTO tariff_classifications
    (section_number, section_title, chapter_number, chapter_title,
     heading_code, heading_description, code, statistical_code,
     description, unit, duty_rate, duty_rate_numeric, is_free, tco_references)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let classCount = 0;
const insertClassifications = db.transaction(() => {
  for (const section of schedule3) {
    const sectionNum = ROMAN_TO_INT[section.number] || 0;
    const sectionTitle = SECTION_TITLES[section.number] || section.title || '';
    for (const chapter of section.chapters) {
      for (const heading of chapter.headings) {
        const seenCodes = new Set<string>();
        for (const cls of heading.classifications) {
          if (!cls.referenceNumber) continue;
          const code = clean(cls.referenceNumber);
          const statCode = clean(cls.statisticalCode || '') || null;
          const key = `${code}|${statCode}`;
          if (seenCodes.has(key)) continue;
          seenCodes.add(key);

          const { numeric, isFree } = parseDutyRate(cls.dutyRate);
          const tcoRefs = (cls.tcoReferences || []).filter(
            (t: string) => !['View', 'TCOs', 'for'].includes(t) && !/^\d{4}\.\d{2}/.test(t)
          );

          insertClass.run(
            sectionNum, sectionTitle,
            chapter.number, chapter.title || '',
            clean(heading.code), heading.description || '',
            code, statCode,
            cls.description || '', cls.unit || null,
            cls.dutyRate || null, numeric, isFree ? 1 : 0,
            tcoRefs.length > 0 ? JSON.stringify(tcoRefs) : null
          );
          classCount++;
        }
      }
    }
  }
});
insertClassifications();
console.log(`  ${classCount} classifications`);

// ── Seed FTA Exclusions ──────────────────────────────────
console.log('Seeding FTA exclusions...');
const ftaData = JSON.parse(fs.readFileSync(path.join(dataDir, 'tariff-schedules-fta.json'), 'utf-8'));

const insertFta = db.prepare(
  'INSERT INTO tariff_fta_exclusions (schedule, fta_name, hs_code, description, duty_rate) VALUES (?, ?, ?, ?, ?)'
);

let ftaCount = 0;
const insertFtas = db.transaction(() => {
  for (const [schedule, entries] of Object.entries(ftaData)) {
    for (const e of entries as any[]) {
      insertFta.run(e.schedule || schedule, e.ftaName || '', e.hsCode || '', e.description || '', e.dutyRate || null);
      ftaCount++;
    }
  }
});
insertFtas();
console.log(`  ${ftaCount} FTA exclusions`);

// ── Create FTS5 virtual table for full-text search ───────
console.log('Creating full-text search index...');
db.exec(`
  CREATE VIRTUAL TABLE tariff_fts USING fts5(
    code, description, heading_description, chapter_title, section_title,
    content='tariff_classifications',
    content_rowid='id'
  );

  INSERT INTO tariff_fts(rowid, code, description, heading_description, chapter_title, section_title)
  SELECT id, code, description, heading_description, chapter_title, section_title
  FROM tariff_classifications;
`);

console.log('\n✅ Database seeded successfully!');
console.log(`   ${countryCount} countries | ${classCount} classifications | ${ftaCount} FTA exclusions`);

db.close();
