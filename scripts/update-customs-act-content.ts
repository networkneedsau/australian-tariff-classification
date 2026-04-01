import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

try { db.exec('ALTER TABLE customs_act_sections ADD COLUMN content TEXT'); } catch { /* exists */ }

// Load extracted sections
const jsonPath = path.join(process.cwd(), 'scripts', 'customs-act-sections.json');
const sections: Record<string, string> = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

console.log(`Loaded ${Object.keys(sections).length} sections from JSON`);

// Get all section numbers from the database
const dbSections = db.prepare('SELECT id, section_number FROM customs_act_sections').all() as { id: number; section_number: string }[];
console.log(`Database has ${dbSections.length} sections`);

const stmt = db.prepare('UPDATE customs_act_sections SET content = ? WHERE section_number = ?');
let updated = 0;

db.transaction(() => {
  for (const dbSec of dbSections) {
    const content = sections[dbSec.section_number];
    if (content) {
      stmt.run(content, dbSec.section_number);
      updated++;
    }
  }
})();

// Rebuild FTS
db.exec(`DROP TABLE IF EXISTS customs_act_sections_fts;
  CREATE VIRTUAL TABLE customs_act_sections_fts USING fts5(
    part, part_title, division, division_title, subdivision, subdivision_title,
    section_number, section_title, content,
    content='customs_act_sections', content_rowid='id'
  );
  INSERT INTO customs_act_sections_fts(customs_act_sections_fts) VALUES('rebuild');`);

console.log(`Updated ${updated} of ${dbSections.length} sections with full text content`);
db.close();
