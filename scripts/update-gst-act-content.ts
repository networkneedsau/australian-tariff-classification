import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

try { db.exec('ALTER TABLE gst_act ADD COLUMN content TEXT'); } catch { /* exists */ }

const jsonPath = path.join(process.cwd(), 'scripts', 'gst-act-divisions.json');
const divisions: Record<string, string> = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
console.log(`Loaded ${Object.keys(divisions).length} divisions from JSON`);

const dbRows = db.prepare('SELECT id, division FROM gst_act').all() as { id: number; division: string }[];
console.log(`Database has ${dbRows.length} entries`);

const stmt = db.prepare('UPDATE gst_act SET content = ? WHERE division = ?');
let updated = 0;

db.transaction(() => {
  for (const row of dbRows) {
    // Extract division number from "Division 7" -> "7"
    const match = row.division.match(/Division\s+(\d+)/);
    if (match) {
      const divNum = match[1];
      const content = divisions[divNum];
      if (content) {
        stmt.run(content, row.division);
        updated++;
      }
    }
  }
})();

// Rebuild FTS
db.exec(`DROP TABLE IF EXISTS gst_act_fts;
  CREATE VIRTUAL TABLE gst_act_fts USING fts5(
    chapter, chapter_title, part, part_title, division, division_title, content,
    content='gst_act', content_rowid='id'
  );
  INSERT INTO gst_act_fts(gst_act_fts) VALUES('rebuild');`);

console.log(`Updated ${updated} of ${dbRows.length} divisions with full text content`);
db.close();
