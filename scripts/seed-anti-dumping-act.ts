import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  DROP TABLE IF EXISTS anti_dumping_act;
  CREATE TABLE anti_dumping_act (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part TEXT NOT NULL,
    part_title TEXT NOT NULL,
    section_number TEXT NOT NULL,
    section_title TEXT NOT NULL,
    content TEXT
  );
  CREATE INDEX idx_ada_part ON anti_dumping_act(part);
`);

interface ADARow { part: string; part_title: string; section_number: string; section_title: string; content?: string; }

const rows: ADARow[] = [
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '1', section_title: 'Short title', content: 'This Act may be cited as the Customs Tariff (Anti-Dumping) Act 1975.' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '2', section_title: 'Commencement', content: 'This Act shall come into operation on a date to be fixed by Proclamation.' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '3', section_title: 'Definitions' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '4', section_title: 'Interpretation' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '5', section_title: 'Incorporation with Customs Act' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '6', section_title: 'Incorporation', content: 'This Act is incorporated and shall be read as one with the Customs Act 1901.' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '6A', section_title: 'Act does not extend to Norfolk Island' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '7', section_title: 'Imposition of duties of Customs', content: 'Duties of Customs are imposed in accordance with this Act on goods imported into Australia that are the subject of a dumping duty notice, a countervailing duty notice, or both.' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '8', section_title: 'Dumping duties', content: 'Where the Minister has published a dumping duty notice under Part XVB of the Customs Act 1901 in respect of goods, there is imposed on those goods, in addition to any other duty of Customs, a special duty of Customs (dumping duty). The amount of the dumping duty is the amount by which the normal value of the goods exceeds the export price of the goods.' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '9', section_title: 'Third country dumping duties', content: 'Where the Minister has published a third country dumping duty notice, there is imposed on the goods a special duty of Customs (third country dumping duty). This applies where goods are exported to Australia from a country other than the country of origin at a price less than the normal value.' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '10', section_title: 'Countervailing duties', content: 'Where the Minister has published a countervailing duty notice under Part XVB of the Customs Act 1901 in respect of goods, there is imposed on those goods a special duty of Customs (countervailing duty). The amount of the countervailing duty is determined by the amount of the countervailable subsidy received in respect of the goods.' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '11', section_title: 'Third country countervailing duties', content: 'Where the Minister has published a third country countervailing duty notice, there is imposed on the goods a special duty of Customs (third country countervailing duty).' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '12', section_title: 'Interim duty not to exceed security taken', content: 'The amount of interim dumping duty or interim countervailing duty payable on any goods must not exceed the amount of the security taken in respect of those goods.' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '13', section_title: 'Application of dumping duties' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '14', section_title: 'Application of countervailing duties' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '15', section_title: 'Exemptions from duties' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '16', section_title: 'Duties to be charged separately', content: 'Where both dumping duty and countervailing duty are imposed on goods, each duty is to be charged and collected separately.' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '17', section_title: 'Variation of dumping duty notice' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '18', section_title: 'Revocation of dumping duty notice' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '19', section_title: 'Duration of measures' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '20', section_title: 'Review of measures' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '21', section_title: 'Special duties to be additional to ordinary duties', content: 'A special duty of Customs imposed by this Act on goods is in addition to any duty of Customs imposed on those goods by any other Act.' },
  { part: 'Main', part_title: 'Customs Tariff (Anti-Dumping) Act 1975', section_number: '22', section_title: 'Regulations', content: 'The Governor-General may make regulations, not inconsistent with this Act, prescribing all matters required or permitted to be prescribed, or necessary or convenient to be prescribed for carrying out or giving effect to this Act.' },
];

const insert = db.prepare(`INSERT INTO anti_dumping_act (part, part_title, section_number, section_title, content) VALUES (@part, @part_title, @section_number, @section_title, @content)`);
db.transaction(() => { for (const r of rows) insert.run({ ...r, content: r.content || null }); })();

db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS anti_dumping_act_fts USING fts5(part, part_title, section_number, section_title, content, content='anti_dumping_act', content_rowid='id');
  INSERT INTO anti_dumping_act_fts(anti_dumping_act_fts) VALUES('rebuild');
`);

const count = (db.prepare('SELECT COUNT(*) as cnt FROM anti_dumping_act').get() as { cnt: number }).cnt;
console.log(`Seeded ${count} Anti-Dumping Act sections`);
db.close();
