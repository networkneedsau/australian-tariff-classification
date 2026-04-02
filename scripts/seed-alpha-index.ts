import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  DROP TABLE IF EXISTS alpha_index;
  CREATE TABLE alpha_index (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goods_description TEXT NOT NULL,
    hs_code TEXT NOT NULL,
    chapter TEXT,
    section TEXT,
    notes TEXT
  );
  CREATE INDEX idx_alpha_desc ON alpha_index(goods_description);
  CREATE INDEX idx_alpha_hs ON alpha_index(hs_code);
`);

interface AI { goods_description: string; hs_code: string; chapter?: string; section?: string; notes?: string; }

const items: AI[] = [
  // A
  { goods_description: 'Abrasives, natural or artificial', hs_code: '6804-6805', chapter: 'Ch.68', section: 'XIII' },
  { goods_description: 'Accumulators, electric', hs_code: '8507', chapter: 'Ch.85', section: 'XVI' },
  { goods_description: 'Acids, inorganic', hs_code: '2806-2811', chapter: 'Ch.28', section: 'VI' },
  { goods_description: 'Adhesives, prepared', hs_code: '3506', chapter: 'Ch.35', section: 'VI' },
  { goods_description: 'Air conditioning machines', hs_code: '8415', chapter: 'Ch.84', section: 'XVI' },
  { goods_description: 'Aircraft', hs_code: '8802', chapter: 'Ch.88', section: 'XVII' },
  { goods_description: 'Alarm systems', hs_code: '8531', chapter: 'Ch.85', section: 'XVI' },
  { goods_description: 'Alcohol, ethyl (undenatured)', hs_code: '2207', chapter: 'Ch.22', section: 'IV' },
  { goods_description: 'Aluminium and articles thereof', hs_code: '7601-7616', chapter: 'Ch.76', section: 'XV' },
  { goods_description: 'Ammunition', hs_code: '9306', chapter: 'Ch.93', section: 'XIX' },
  { goods_description: 'Antibiotics', hs_code: '2941', chapter: 'Ch.29', section: 'VI' },
  { goods_description: 'Apparatus, electrical signalling', hs_code: '8530-8531', chapter: 'Ch.85', section: 'XVI' },
  { goods_description: 'Apparel, knitted or crocheted', hs_code: '6101-6114', chapter: 'Ch.61', section: 'XI' },
  { goods_description: 'Apparel, not knitted', hs_code: '6201-6211', chapter: 'Ch.62', section: 'XI' },
  { goods_description: 'Asbestos', hs_code: '2524', chapter: 'Ch.25', section: 'V', notes: 'Import prohibited under Prohibited Imports Regs' },
  // B
  { goods_description: 'Bags and sacks, textile', hs_code: '6305', chapter: 'Ch.63', section: 'XI' },
  { goods_description: 'Bakery products', hs_code: '1905', chapter: 'Ch.19', section: 'IV' },
  { goods_description: 'Batteries, primary cells', hs_code: '8506', chapter: 'Ch.85', section: 'XVI' },
  { goods_description: 'Beer', hs_code: '2203', chapter: 'Ch.22', section: 'IV' },
  { goods_description: 'Bicycles', hs_code: '8712', chapter: 'Ch.87', section: 'XVII' },
  { goods_description: 'Bolts, nuts, screws (iron/steel)', hs_code: '7318', chapter: 'Ch.73', section: 'XV' },
  { goods_description: 'Books, printed', hs_code: '4901', chapter: 'Ch.49', section: 'X' },
  { goods_description: 'Bricks, building', hs_code: '6901-6904', chapter: 'Ch.69', section: 'XIII' },
  { goods_description: 'Butter', hs_code: '0405', chapter: 'Ch.04', section: 'I' },
  // C
  { goods_description: 'Cables, electric', hs_code: '8544', chapter: 'Ch.85', section: 'XVI' },
  { goods_description: 'Cameras, digital', hs_code: '8525', chapter: 'Ch.85', section: 'XVI' },
  { goods_description: 'Carpets and floor coverings', hs_code: '5701-5705', chapter: 'Ch.57', section: 'XI' },
  { goods_description: 'Cement', hs_code: '2523', chapter: 'Ch.25', section: 'V' },
  { goods_description: 'Cereals', hs_code: '1001-1008', chapter: 'Ch.10', section: 'II' },
  { goods_description: 'Cheese', hs_code: '0406', chapter: 'Ch.04', section: 'I' },
  { goods_description: 'Chemicals, organic', hs_code: '2901-2942', chapter: 'Ch.29', section: 'VI' },
  { goods_description: 'Chocolate', hs_code: '1806', chapter: 'Ch.18', section: 'IV' },
  { goods_description: 'Cigarettes', hs_code: '2402', chapter: 'Ch.24', section: 'IV' },
  { goods_description: 'Clocks and watches', hs_code: '9101-9114', chapter: 'Ch.91', section: 'XVIII' },
  { goods_description: 'Coal', hs_code: '2701', chapter: 'Ch.27', section: 'V' },
  { goods_description: 'Coffee', hs_code: '0901', chapter: 'Ch.09', section: 'II' },
  { goods_description: 'Computers', hs_code: '8471', chapter: 'Ch.84', section: 'XVI' },
  { goods_description: 'Copper and articles thereof', hs_code: '7401-7419', chapter: 'Ch.74', section: 'XV' },
  { goods_description: 'Cosmetics and toilet preparations', hs_code: '3303-3307', chapter: 'Ch.33', section: 'VI' },
  { goods_description: 'Cotton', hs_code: '5201-5212', chapter: 'Ch.52', section: 'XI' },
  // D
  { goods_description: 'Dairy products', hs_code: '0401-0406', chapter: 'Ch.04', section: 'I' },
  { goods_description: 'Detergents', hs_code: '3402', chapter: 'Ch.34', section: 'VI' },
  { goods_description: 'Diamonds', hs_code: '7102', chapter: 'Ch.71', section: 'XIV' },
  { goods_description: 'Drugs, medicaments', hs_code: '3003-3004', chapter: 'Ch.30', section: 'VI' },
  { goods_description: 'Dyes and pigments', hs_code: '3204-3206', chapter: 'Ch.32', section: 'VI' },
  // E
  { goods_description: 'Eggs', hs_code: '0407-0408', chapter: 'Ch.04', section: 'I' },
  { goods_description: 'Engines, internal combustion', hs_code: '8407-8408', chapter: 'Ch.84', section: 'XVI' },
  { goods_description: 'Essential oils', hs_code: '3301', chapter: 'Ch.33', section: 'VI' },
  { goods_description: 'Explosives', hs_code: '3601-3604', chapter: 'Ch.36', section: 'VI' },
  // F
  { goods_description: 'Fabrics, woven', hs_code: '5007-5516', chapter: 'Ch.50-55', section: 'XI' },
  { goods_description: 'Fertilizers', hs_code: '3101-3105', chapter: 'Ch.31', section: 'VI' },
  { goods_description: 'Fish, fresh or chilled', hs_code: '0302', chapter: 'Ch.03', section: 'I' },
  { goods_description: 'Flour, wheat', hs_code: '1101', chapter: 'Ch.11', section: 'II' },
  { goods_description: 'Footwear', hs_code: '6401-6405', chapter: 'Ch.64', section: 'XII' },
  { goods_description: 'Fruit, fresh', hs_code: '0801-0810', chapter: 'Ch.08', section: 'II' },
  { goods_description: 'Furniture', hs_code: '9401-9404', chapter: 'Ch.94', section: 'XX' },
  // G
  { goods_description: 'Glass and glassware', hs_code: '7001-7020', chapter: 'Ch.70', section: 'XIII' },
  { goods_description: 'Gloves', hs_code: '6116/6216', chapter: 'Ch.61/62', section: 'XI' },
  { goods_description: 'Gold', hs_code: '7108', chapter: 'Ch.71', section: 'XIV' },
  // H
  { goods_description: 'Handbags', hs_code: '4202', chapter: 'Ch.42', section: 'VIII' },
  { goods_description: 'Headgear', hs_code: '6501-6507', chapter: 'Ch.65', section: 'XII' },
  { goods_description: 'Honey', hs_code: '0409', chapter: 'Ch.04', section: 'I' },
  // I
  { goods_description: 'Ice cream', hs_code: '2105', chapter: 'Ch.21', section: 'IV' },
  { goods_description: 'Insecticides', hs_code: '3808', chapter: 'Ch.38', section: 'VI' },
  { goods_description: 'Iron and steel', hs_code: '7201-7229', chapter: 'Ch.72', section: 'XV' },
  // J-K
  { goods_description: 'Jewellery', hs_code: '7113', chapter: 'Ch.71', section: 'XIV' },
  { goods_description: 'Juice, fruit or vegetable', hs_code: '2009', chapter: 'Ch.20', section: 'IV' },
  // L
  { goods_description: 'Lamps and lighting fittings', hs_code: '9405', chapter: 'Ch.94', section: 'XX' },
  { goods_description: 'Leather', hs_code: '4101-4115', chapter: 'Ch.41', section: 'VIII' },
  { goods_description: 'Lubricants', hs_code: '2710', chapter: 'Ch.27', section: 'V' },
  // M
  { goods_description: 'Machinery, industrial', hs_code: '8401-8487', chapter: 'Ch.84', section: 'XVI' },
  { goods_description: 'Mattresses', hs_code: '9404', chapter: 'Ch.94', section: 'XX' },
  { goods_description: 'Meat, fresh or chilled', hs_code: '0201-0205', chapter: 'Ch.02', section: 'I' },
  { goods_description: 'Medicines (see Drugs)', hs_code: '3003-3004', chapter: 'Ch.30', section: 'VI' },
  { goods_description: 'Milk and cream', hs_code: '0401-0402', chapter: 'Ch.04', section: 'I' },
  { goods_description: 'Motors, electric', hs_code: '8501', chapter: 'Ch.85', section: 'XVI' },
  // N-O
  { goods_description: 'Nails, screws (iron/steel)', hs_code: '7317', chapter: 'Ch.73', section: 'XV' },
  { goods_description: 'Oils, petroleum', hs_code: '2709-2710', chapter: 'Ch.27', section: 'V' },
  { goods_description: 'Optical instruments', hs_code: '9001-9013', chapter: 'Ch.90', section: 'XVIII' },
  // P
  { goods_description: 'Paint', hs_code: '3208-3210', chapter: 'Ch.32', section: 'VI' },
  { goods_description: 'Paper and paperboard', hs_code: '4801-4823', chapter: 'Ch.48', section: 'X' },
  { goods_description: 'Perfumes', hs_code: '3303', chapter: 'Ch.33', section: 'VI' },
  { goods_description: 'Petroleum products', hs_code: '2709-2715', chapter: 'Ch.27', section: 'V' },
  { goods_description: 'Pharmaceuticals', hs_code: '3001-3006', chapter: 'Ch.30', section: 'VI' },
  { goods_description: 'Plastics and articles thereof', hs_code: '3901-3926', chapter: 'Ch.39', section: 'VII' },
  { goods_description: 'Plywood', hs_code: '4412', chapter: 'Ch.44', section: 'IX' },
  { goods_description: 'Pumps for liquids', hs_code: '8413', chapter: 'Ch.84', section: 'XVI' },
  // R
  { goods_description: 'Radio apparatus', hs_code: '8527', chapter: 'Ch.85', section: 'XVI' },
  { goods_description: 'Rice', hs_code: '1006', chapter: 'Ch.10', section: 'II' },
  { goods_description: 'Rubber and articles thereof', hs_code: '4001-4017', chapter: 'Ch.40', section: 'VII' },
  // S
  { goods_description: 'Salt', hs_code: '2501', chapter: 'Ch.25', section: 'V' },
  { goods_description: 'Seeds for sowing', hs_code: '1209', chapter: 'Ch.12', section: 'II' },
  { goods_description: 'Silk', hs_code: '5001-5007', chapter: 'Ch.50', section: 'XI' },
  { goods_description: 'Soap', hs_code: '3401', chapter: 'Ch.34', section: 'VI' },
  { goods_description: 'Solar cells/panels', hs_code: '8541', chapter: 'Ch.85', section: 'XVI' },
  { goods_description: 'Spirits (whisky, rum, gin, etc.)', hs_code: '2208', chapter: 'Ch.22', section: 'IV' },
  { goods_description: 'Steel (see Iron and steel)', hs_code: '7201-7229', chapter: 'Ch.72', section: 'XV' },
  { goods_description: 'Sugar', hs_code: '1701', chapter: 'Ch.17', section: 'IV' },
  { goods_description: 'Sunglasses', hs_code: '9004', chapter: 'Ch.90', section: 'XVIII' },
  // T
  { goods_description: 'Tea', hs_code: '0902', chapter: 'Ch.09', section: 'II' },
  { goods_description: 'Telecommunications equipment', hs_code: '8517', chapter: 'Ch.85', section: 'XVI' },
  { goods_description: 'Television receivers', hs_code: '8528', chapter: 'Ch.85', section: 'XVI' },
  { goods_description: 'Textiles (see Fabrics)', hs_code: '5001-6310', chapter: 'Ch.50-63', section: 'XI' },
  { goods_description: 'Timber/wood', hs_code: '4401-4421', chapter: 'Ch.44', section: 'IX' },
  { goods_description: 'Tobacco', hs_code: '2401-2403', chapter: 'Ch.24', section: 'IV' },
  { goods_description: 'Tools, hand', hs_code: '8201-8215', chapter: 'Ch.82', section: 'XV' },
  { goods_description: 'Toys', hs_code: '9503', chapter: 'Ch.95', section: 'XX' },
  { goods_description: 'Transformers, electric', hs_code: '8504', chapter: 'Ch.85', section: 'XVI' },
  { goods_description: 'Tyres, pneumatic', hs_code: '4011', chapter: 'Ch.40', section: 'VII' },
  // U-V
  { goods_description: 'Umbrellas', hs_code: '6601', chapter: 'Ch.66', section: 'XII' },
  { goods_description: 'Vaccines', hs_code: '3002', chapter: 'Ch.30', section: 'VI' },
  { goods_description: 'Valves (taps, cocks)', hs_code: '8481', chapter: 'Ch.84', section: 'XVI' },
  { goods_description: 'Vegetables, fresh or chilled', hs_code: '0701-0709', chapter: 'Ch.07', section: 'II' },
  { goods_description: 'Vehicles, motor (passenger)', hs_code: '8703', chapter: 'Ch.87', section: 'XVII' },
  { goods_description: 'Vitamins', hs_code: '2936', chapter: 'Ch.29', section: 'VI' },
  // W
  { goods_description: 'Washing machines', hs_code: '8450', chapter: 'Ch.84', section: 'XVI' },
  { goods_description: 'Watches', hs_code: '9101-9102', chapter: 'Ch.91', section: 'XVIII' },
  { goods_description: 'Wheat', hs_code: '1001', chapter: 'Ch.10', section: 'II' },
  { goods_description: 'Wine', hs_code: '2204', chapter: 'Ch.22', section: 'IV' },
  { goods_description: 'Wire, iron or steel', hs_code: '7217', chapter: 'Ch.72', section: 'XV' },
  { goods_description: 'Wood (see Timber)', hs_code: '4401-4421', chapter: 'Ch.44', section: 'IX' },
  { goods_description: 'Wool', hs_code: '5101-5113', chapter: 'Ch.51', section: 'XI' },
  // X-Z
  { goods_description: 'X-ray apparatus', hs_code: '9022', chapter: 'Ch.90', section: 'XVIII' },
  { goods_description: 'Yarn, textile', hs_code: '5004-5511', chapter: 'Ch.50-55', section: 'XI' },
  { goods_description: 'Zinc and articles thereof', hs_code: '7901-7907', chapter: 'Ch.79', section: 'XV' },
];

const insert = db.prepare(`INSERT INTO alpha_index (goods_description, hs_code, chapter, section, notes) VALUES (@goods_description, @hs_code, @chapter, @section, @notes)`);
db.transaction(() => { for (const i of items) insert.run({ ...i, chapter: i.chapter || null, section: i.section || null, notes: i.notes || null }); })();

db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS alpha_index_fts USING fts5(goods_description, hs_code, chapter, section, notes, content='alpha_index', content_rowid='id');
  INSERT INTO alpha_index_fts(alpha_index_fts) VALUES('rebuild');
`);

const count = (db.prepare('SELECT COUNT(*) as cnt FROM alpha_index').get() as { cnt: number }).cnt;
console.log(`Seeded ${count} alphabetical index entries`);
db.close();
