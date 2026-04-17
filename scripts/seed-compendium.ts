import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  DROP TABLE IF EXISTS classification_compendium;
  CREATE TABLE classification_compendium (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section TEXT NOT NULL,
    section_title TEXT NOT NULL,
    chapters TEXT NOT NULL,
    example_opinion TEXT,
    example_code TEXT,
    example_reasoning TEXT,
    notes TEXT
  );
  CREATE INDEX idx_comp_section ON classification_compendium(section);
`);

interface CompRow { section: string; section_title: string; chapters: string; example_opinion?: string; example_code?: string; example_reasoning?: string; notes?: string; }

const rows: CompRow[] = [
  { section: 'Section I', section_title: 'Live animals; animal products', chapters: 'Chapters 1-5', example_opinion: 'Live fish for ornamental purposes', example_code: '0301.11', example_reasoning: 'Ornamental fish classified separately from food fish', notes: 'Covers live animals, meat, fish, dairy, eggs, honey' },
  { section: 'Section II', section_title: 'Vegetable products', chapters: 'Chapters 6-14', example_opinion: 'Dried herbs for culinary use vs medicinal', example_code: '0910/1211', example_reasoning: 'Classification depends on primary intended use and presentation', notes: 'Plants, vegetables, fruit, cereals, seeds, gums' },
  { section: 'Section III', section_title: 'Animal, vegetable or microbial fats and oils', chapters: 'Chapter 15', example_opinion: 'Blended vegetable oils', example_code: '1517', example_reasoning: 'Mixtures of edible oils classified based on composition', notes: 'Fats, oils, waxes, and their cleavage products' },
  { section: 'Section IV', section_title: 'Prepared foodstuffs; beverages; tobacco', chapters: 'Chapters 16-24', example_opinion: 'Mozzarella cheese with pepperoni in sealed bag', example_code: '0406.10', example_reasoning: 'Fresh cheese component gives essential character despite mixed presentation', notes: 'Prepared foods, beverages, spirits, vinegar, tobacco' },
  { section: 'Section V', section_title: 'Mineral products', chapters: 'Chapters 25-27', example_opinion: 'Natural mineral water with added minerals', example_code: '2201/2202', example_reasoning: 'Added minerals may change classification from natural to processed water', notes: 'Salt, stone, ores, mineral fuels, oils' },
  { section: 'Section VI', section_title: 'Products of the chemical or allied industries', chapters: 'Chapters 28-38', example_opinion: 'Pharmaceutical preparations in measured doses', example_code: '3004', example_reasoning: 'Medicaments in measured doses classified here regardless of active ingredient origin', notes: 'Chemicals, pharmaceuticals, fertilizers, dyes, soaps, explosives' },
  { section: 'Section VII', section_title: 'Plastics and articles thereof; rubber', chapters: 'Chapters 39-40', example_opinion: 'Self-adhesive plastic films and tapes', example_code: '3919', example_reasoning: 'Self-adhesive characteristic is the defining feature for classification', notes: 'Plastics in primary forms, plates, sheets, tubes; rubber articles' },
  { section: 'Section VIII', section_title: 'Raw hides and skins, leather, furskins', chapters: 'Chapters 41-43', example_opinion: 'Composite leather/textile goods', example_code: '4202/6307', example_reasoning: 'Classification by outer surface material for travel goods and bags', notes: 'Leather, saddlery, travel goods, furskins' },
  { section: 'Section IX', section_title: 'Wood and articles of wood; cork; basketware', chapters: 'Chapters 44-46', example_opinion: 'Laminated wood panels with decorative surface', example_code: '4411/4412', example_reasoning: 'Substrate material determines heading, not decorative layer', notes: 'Wood, charcoal, cork, straw, esparto plaiting materials' },
  { section: 'Section X', section_title: 'Pulp of wood; paper and paperboard', chapters: 'Chapters 47-49', example_opinion: 'Printed paper products with functional use', example_code: '4901/4911', example_reasoning: 'Distinction between printed books/newspapers and other printed matter', notes: 'Paper pulp, paper, paperboard, printed books, newspapers' },
  { section: 'Section XI', section_title: 'Textiles and textile articles', chapters: 'Chapters 50-63', example_opinion: 'Knitted vs woven garments determination', example_code: 'Ch.61/62', example_reasoning: 'Fabric construction method (knit vs weave) determines chapter, fibre content determines heading', notes: 'Fibres, yarn, fabrics, made-up textiles, garments; classification by fibre content weight' },
  { section: 'Section XII', section_title: 'Footwear, headgear, umbrellas, walking sticks', chapters: 'Chapters 64-67', example_opinion: 'Sports footwear classification', example_code: '6404', example_reasoning: 'Outer sole and upper material determine classification, not sport type', notes: 'Shoes, hats, umbrellas, artificial flowers, feathers' },
  { section: 'Section XIII', section_title: 'Articles of stone, plaster, cement, ceramic, glass', chapters: 'Chapters 68-70', example_opinion: 'Ceramic articles for technical use', example_code: '6909', example_reasoning: 'Technical ceramics classified separately from household ceramics', notes: 'Stone, asbestos, ceramics, glass articles' },
  { section: 'Section XIV', section_title: 'Natural or cultured pearls, precious metals', chapters: 'Chapter 71', example_opinion: 'Imitation jewellery vs precious metal articles', example_code: '7113/7117', example_reasoning: 'Base metal content and precious metal cladding determine classification', notes: 'Pearls, precious stones, precious metals, coins' },
  { section: 'Section XV', section_title: 'Base metals and articles of base metal', chapters: 'Chapters 72-83', example_opinion: 'Stainless steel articles for kitchen use', example_code: '7323/8215', example_reasoning: 'Distinction between table/kitchen utensils and other articles of steel', notes: 'Iron, steel, copper, aluminium, zinc, tin; articles thereof' },
  { section: 'Section XVI', section_title: 'Machinery and mechanical appliances; electrical equipment', chapters: 'Chapters 84-85', example_opinion: 'Multifunctional machines and functional units', example_code: '8471/8517', example_reasoning: 'Note 4 to Section XVI — functional units classified by principal function', notes: 'Most complex section; computers, phones, machinery, parts. Note 2 governs parts classification' },
  { section: 'Section XVII', section_title: 'Vehicles, aircraft, vessels', chapters: 'Chapters 86-89', example_opinion: 'Electric vehicles and incomplete vehicles', example_code: '8703/8706', example_reasoning: 'ABF classification guides for vehicles, tractors; propulsion type determines subheading', notes: 'Railway, motor vehicles, aircraft, ships; parts and accessories' },
  { section: 'Section XVIII', section_title: 'Optical, photographic, medical instruments; clocks', chapters: 'Chapters 90-92', example_opinion: 'Medical diagnostic equipment', example_code: '9018/9027', example_reasoning: 'Medical instruments vs laboratory instruments — classification by intended use', notes: 'Optical, measuring, medical, musical instruments' },
  { section: 'Section XIX', section_title: 'Arms and ammunition', chapters: 'Chapter 93', example_opinion: 'Parts and accessories of weapons', example_code: '9305', example_reasoning: 'Parts solely for weapons classified here, dual-use parts may be elsewhere', notes: 'Weapons, ammunition, parts and accessories' },
  { section: 'Section XX', section_title: 'Miscellaneous manufactured articles', chapters: 'Chapters 94-96', example_opinion: 'LED lighting apparatus', example_code: '9405', example_reasoning: 'LED lamps classified in Ch.94 as lighting fittings, not Ch.85 as electrical apparatus', notes: 'Furniture, lighting, prefab buildings, toys, games, miscellaneous' },
  { section: 'Section XXI', section_title: 'Works of art, collectors pieces and antiques', chapters: 'Chapter 97', example_opinion: 'Original artwork vs reproductions', example_code: '9701/4911', example_reasoning: 'Original works classified in Ch.97, reproductions may be in Ch.49 as printed matter', notes: 'Paintings, sculptures, stamps, antiques over 100 years old' },
];

const insert = db.prepare(`INSERT INTO classification_compendium (section, section_title, chapters, example_opinion, example_code, example_reasoning, notes) VALUES (@section, @section_title, @chapters, @example_opinion, @example_code, @example_reasoning, @notes)`);
db.transaction(() => { for (const r of rows) insert.run({ ...r, example_opinion: r.example_opinion || null, example_code: r.example_code || null, example_reasoning: r.example_reasoning || null, notes: r.notes || null }); })();

db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS classification_compendium_fts USING fts5(section, section_title, chapters, example_opinion, example_reasoning, notes, content='classification_compendium', content_rowid='id');
  INSERT INTO classification_compendium_fts(classification_compendium_fts) VALUES('rebuild');
`);

const count = (db.prepare('SELECT COUNT(*) as cnt FROM classification_compendium').get() as { cnt: number }).cnt;
console.log(`Seeded ${count} compendium sections`);
db.close();
