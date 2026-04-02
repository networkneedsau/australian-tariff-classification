import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  DROP TABLE IF EXISTS tariff_precedents;
  CREATE TABLE tariff_precedents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    goods_description TEXT NOT NULL,
    tariff_classification TEXT,
    reasoning TEXT,
    scope TEXT,
    chapter TEXT
  );
  CREATE INDEX idx_prec_category ON tariff_precedents(category);
  CREATE INDEX idx_prec_chapter ON tariff_precedents(chapter);
`);

interface Prec { category: string; goods_description: string; tariff_classification?: string; reasoning?: string; scope?: string; chapter?: string; }

const precedents: Prec[] = [
  // Food & Beverages (Chapters 1-24)
  { category: 'Food Preparations', goods_description: 'Food preparations with protein concentrates', tariff_classification: '2106.10', reasoning: 'Classification to 2106.10 when protein concentrates form bulk of ingredients', chapter: 'Ch.21', scope: 'Protein-based food supplements and preparations' },
  { category: 'Dairy', goods_description: 'Fresh cheese classification', tariff_classification: '0406.10.00', reasoning: '"Fresh" refers to whether the cheese is cured or ripened, not storage duration or temperature', chapter: 'Ch.04', scope: 'Unripened/uncured cheese including cottage cheese, cream cheese' },
  { category: 'Beverages', goods_description: 'Cider and perry products', tariff_classification: '2206.00.30', reasoning: 'Classification restricted to products as defined in Additional Note 5 to Chapter 22', chapter: 'Ch.22', scope: 'Fermented apple and pear beverages' },
  { category: 'Meat', goods_description: 'Seasoned or marinated meat', tariff_classification: '0210 / 1602', reasoning: 'Distinction between seasoned meat (Ch.02) and prepared meat (Ch.16) based on degree of preparation', chapter: 'Ch.02/16', scope: 'Meat with added seasonings, marinades, or coatings' },
  { category: 'Food Preparations', goods_description: 'Meal replacement shakes and powders', tariff_classification: '2106.90', reasoning: 'Complete meal replacements classified as food preparations not elsewhere specified', chapter: 'Ch.21', scope: 'Nutritional shakes, meal replacement products' },
  { category: 'Confectionery', goods_description: 'Chocolate-coated products', tariff_classification: '1806 / 1905', reasoning: 'Classification depends on whether chocolate or the substrate is the essential character', chapter: 'Ch.18/19', scope: 'Chocolate-coated biscuits, wafers, confectionery' },

  // Chemicals (Chapters 28-38)
  { category: 'Chemicals', goods_description: 'Chemical mixtures and preparations', tariff_classification: '3824', reasoning: 'Chemical products and preparations not elsewhere specified or included', chapter: 'Ch.38', scope: 'Mixed chemical products, industrial chemical preparations' },
  { category: 'Chemicals', goods_description: 'Essential oils and resinoids', tariff_classification: '3301', reasoning: 'Classification based on extraction method and concentration', chapter: 'Ch.33', scope: 'Plant-derived essential oils, oleoresins' },
  { category: 'Pharmaceuticals', goods_description: 'Pharmaceutical preparations in measured doses', tariff_classification: '3004', reasoning: 'Medicaments in measured doses or for retail sale classified here regardless of active ingredient', chapter: 'Ch.30', scope: 'Tablets, capsules, measured dose medicines' },

  // Plastics & Rubber (Chapters 39-40)
  { category: 'Plastics', goods_description: 'Composite plastic articles', tariff_classification: '3926', reasoning: 'Articles of plastics not elsewhere specified — essential character determines classification', chapter: 'Ch.39', scope: 'Plastic articles combining multiple materials' },
  { category: 'Plastics', goods_description: 'Self-adhesive plastic sheets and films', tariff_classification: '3919', reasoning: 'Self-adhesive plates, sheets, film, foil, tape, strip of plastics', chapter: 'Ch.39', scope: 'Adhesive-backed plastic films and labels' },

  // Textiles (Chapters 50-63)
  { category: 'Textiles', goods_description: 'Composite textile articles', tariff_classification: 'Ch.50-63', reasoning: 'Classification based on predominant fibre content by weight at the heading level', chapter: 'Ch.50-63', scope: 'Mixed-fibre textiles and garments' },
  { category: 'Textiles', goods_description: 'Knitted vs woven garments', tariff_classification: 'Ch.61/62', reasoning: 'Chapter 61 for knitted/crocheted, Chapter 62 for woven — based on fabric construction method', chapter: 'Ch.61/62', scope: 'Garments and clothing accessories' },

  // Machinery (Chapters 84-85)
  { category: 'Machinery', goods_description: 'Functional units of machines', tariff_classification: '8479 / 8428', reasoning: 'Functional units classified according to their principal function per Note 4 to Section XVI', chapter: 'Ch.84', scope: 'Combined machinery performing multiple operations' },
  { category: 'Machinery', goods_description: 'Parts and accessories of machinery', tariff_classification: '8466 / 8473', reasoning: 'Parts suitable for use solely or principally with particular machines classified with those machines', chapter: 'Ch.84/85', scope: 'Machine parts, components, and accessories' },
  { category: 'Electrical', goods_description: 'Multifunctional electronic devices', tariff_classification: '8471 / 8517', reasoning: 'Classification based on principal function — ADP machines vs communication apparatus', chapter: 'Ch.84/85', scope: 'Tablets, smartphones, multi-function devices' },
  { category: 'Electrical', goods_description: 'LED lighting apparatus', tariff_classification: '9405', reasoning: 'LED lamps and lighting fittings classified in Chapter 94, not Chapter 85', chapter: 'Ch.94', scope: 'LED bulbs, tubes, panels, and luminaires' },

  // Vehicles (Chapter 87)
  { category: 'Vehicles', goods_description: 'Incomplete vehicles', tariff_classification: '8706', reasoning: 'Chassis fitted with engines classified as incomplete vehicles per ABF classification guide', chapter: 'Ch.87', scope: 'Vehicle chassis, incomplete motor vehicles' },
  { category: 'Vehicles', goods_description: 'Tractors — agricultural vs industrial', tariff_classification: '8701', reasoning: 'Classification depends on design and intended use per ABF tractor classification guide', chapter: 'Ch.87', scope: 'Agricultural tractors, road tractors, industrial tractors' },
  { category: 'Vehicles', goods_description: 'Electric vehicles and hybrids', tariff_classification: '8703', reasoning: 'Motor vehicles for transport of persons — electric and hybrid classified by principal propulsion', chapter: 'Ch.87', scope: 'Battery electric vehicles, plug-in hybrids' },

  // Instruments (Chapters 90-92)
  { category: 'Instruments', goods_description: 'Medical devices and instruments', tariff_classification: '9018', reasoning: 'Instruments and appliances used in medical/surgical/dental/veterinary sciences', chapter: 'Ch.90', scope: 'Surgical instruments, diagnostic equipment' },

  // Tariff Advice System
  { category: 'Advice System', goods_description: 'Tariff Advice (Advance Ruling)', tariff_classification: 'N/A', reasoning: 'Binding administrative ruling for specific goods — valid 5 years, binding on ABF and applicant', scope: 'Apply via Form B102, free service, 30-day standard', chapter: 'System' },
  { category: 'Advice System', goods_description: 'Tariff Precedent (Public Guidance)', tariff_classification: 'N/A', reasoning: 'Non-binding public guidance expressing ABF current thinking on classification issues', scope: '344 precedents published by ABF as of January 2022', chapter: 'System' },
  { category: 'Advice System', goods_description: 'Tariff Classification Guide', tariff_classification: 'N/A', reasoning: 'Addresses complex classification issues spanning multiple tariff classifications', scope: 'Guides available for: Incomplete Vehicles, Functional Units, Tractors, and others', chapter: 'System' },

  // Classification Rules
  { category: 'Classification Rules', goods_description: 'General Interpretive Rule 1 (GIR 1)', tariff_classification: 'N/A', reasoning: 'Classification determined by the terms of the headings and any relative Section or Chapter Notes', chapter: 'Rules', scope: 'Primary rule — headings and notes have legal force' },
  { category: 'Classification Rules', goods_description: 'General Interpretive Rule 2(a)', tariff_classification: 'N/A', reasoning: 'Incomplete or unfinished articles classified as complete if they have the essential character', chapter: 'Rules', scope: 'Applies to unassembled, disassembled, or incomplete goods' },
  { category: 'Classification Rules', goods_description: 'General Interpretive Rule 2(b)', tariff_classification: 'N/A', reasoning: 'Mixtures and combinations of materials classified by the material giving essential character', chapter: 'Rules', scope: 'Mixed materials, composite goods' },
  { category: 'Classification Rules', goods_description: 'General Interpretive Rule 3(a)', tariff_classification: 'N/A', reasoning: 'When two or more headings apply, the most specific description prevails', chapter: 'Rules', scope: 'Specificity rule for competing headings' },
  { category: 'Classification Rules', goods_description: 'General Interpretive Rule 3(b)', tariff_classification: 'N/A', reasoning: 'Composite goods classified by the component giving essential character', chapter: 'Rules', scope: 'Sets, composite goods, goods put up in sets for retail sale' },
  { category: 'Classification Rules', goods_description: 'General Interpretive Rule 3(c)', tariff_classification: 'N/A', reasoning: 'When 3(a) and 3(b) cannot determine classification, use the heading which occurs last in numerical order', chapter: 'Rules', scope: 'Last resort rule for competing headings' },
  { category: 'Classification Rules', goods_description: 'General Interpretive Rule 4', tariff_classification: 'N/A', reasoning: 'Goods which cannot be classified under Rules 1-3 are classified under the heading for goods most akin', chapter: 'Rules', scope: 'Novel or unusual goods not described in any heading' },
  { category: 'Classification Rules', goods_description: 'General Interpretive Rule 5', tariff_classification: 'N/A', reasoning: 'Cases, containers, and packing materials classified with the goods they contain (with exceptions)', chapter: 'Rules', scope: 'Containers presented with goods, packing materials' },
  { category: 'Classification Rules', goods_description: 'General Interpretive Rule 6', tariff_classification: 'N/A', reasoning: 'Classification at subheading level determined by the terms of the subheadings and related notes', chapter: 'Rules', scope: 'Rules 1-5 apply mutatis mutandis at subheading level' },
];

const insert = db.prepare(`INSERT INTO tariff_precedents (category, goods_description, tariff_classification, reasoning, scope, chapter) VALUES (@category, @goods_description, @tariff_classification, @reasoning, @scope, @chapter)`);
db.transaction(() => { for (const p of precedents) insert.run({ ...p, tariff_classification: p.tariff_classification || null, reasoning: p.reasoning || null, scope: p.scope || null, chapter: p.chapter || null }); })();

db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS tariff_precedents_fts USING fts5(goods_description, category, tariff_classification, reasoning, scope, chapter, content='tariff_precedents', content_rowid='id');
  INSERT INTO tariff_precedents_fts(tariff_precedents_fts) VALUES('rebuild');
`);

const count = (db.prepare('SELECT COUNT(*) as cnt FROM tariff_precedents').get() as { cnt: number }).cnt;
console.log(`Seeded ${count} tariff precedents and classification rules`);
db.close();
