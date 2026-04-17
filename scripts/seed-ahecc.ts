import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  DROP TABLE IF EXISTS ahecc_chapters;
  CREATE TABLE ahecc_chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_number TEXT NOT NULL,
    section_title TEXT NOT NULL,
    chapter_number TEXT NOT NULL,
    chapter_title TEXT NOT NULL
  );
  CREATE INDEX idx_ahecc_section ON ahecc_chapters(section_number);
  CREATE INDEX idx_ahecc_chapter ON ahecc_chapters(chapter_number);
`);

interface AHECCChapter {
  section_number: string;
  section_title: string;
  chapter_number: string;
  chapter_title: string;
}

const chapters: AHECCChapter[] = [
  // Section I — Live Animals; Animal Products
  { section_number: 'I', section_title: 'Live Animals; Animal Products', chapter_number: '01', chapter_title: 'Live animals' },
  { section_number: 'I', section_title: 'Live Animals; Animal Products', chapter_number: '02', chapter_title: 'Meat and edible meat offal' },
  { section_number: 'I', section_title: 'Live Animals; Animal Products', chapter_number: '03', chapter_title: 'Fish and crustaceans, molluscs and other aquatic invertebrates' },
  { section_number: 'I', section_title: 'Live Animals; Animal Products', chapter_number: '04', chapter_title: 'Dairy produce; birds\' eggs; natural honey; edible products of animal origin, not elsewhere specified or included' },
  { section_number: 'I', section_title: 'Live Animals; Animal Products', chapter_number: '05', chapter_title: 'Products of animal origin, not elsewhere specified or included' },

  // Section II — Vegetable Products
  { section_number: 'II', section_title: 'Vegetable Products', chapter_number: '06', chapter_title: 'Live trees and other plants; bulbs, roots and the like; cut flowers and ornamental foliage' },
  { section_number: 'II', section_title: 'Vegetable Products', chapter_number: '07', chapter_title: 'Edible vegetables and certain roots and tubers' },
  { section_number: 'II', section_title: 'Vegetable Products', chapter_number: '08', chapter_title: 'Edible fruit and nuts; peel of citrus fruit or melons' },
  { section_number: 'II', section_title: 'Vegetable Products', chapter_number: '09', chapter_title: 'Coffee, tea, mate and spices' },
  { section_number: 'II', section_title: 'Vegetable Products', chapter_number: '10', chapter_title: 'Cereals' },
  { section_number: 'II', section_title: 'Vegetable Products', chapter_number: '11', chapter_title: 'Products of the milling industry; malt; starches; inulin; wheat gluten' },
  { section_number: 'II', section_title: 'Vegetable Products', chapter_number: '12', chapter_title: 'Oil seeds and oleaginous fruits; miscellaneous grains, seeds and fruit; industrial or medicinal plants; straw and fodder' },
  { section_number: 'II', section_title: 'Vegetable Products', chapter_number: '13', chapter_title: 'Lac; gums, resins and other vegetable saps and extracts' },
  { section_number: 'II', section_title: 'Vegetable Products', chapter_number: '14', chapter_title: 'Vegetable plaiting materials; vegetable products not elsewhere specified or included' },

  // Section III — Animal, Vegetable or Microbial Fats and Oils
  { section_number: 'III', section_title: 'Animal, Vegetable or Microbial Fats and Oils and Their Cleavage Products; Prepared Edible Fats; Animal or Vegetable Waxes', chapter_number: '15', chapter_title: 'Animal, vegetable or microbial fats and oils and their cleavage products; prepared edible fats; animal or vegetable waxes' },

  // Section IV — Prepared Foodstuffs; Beverages, Spirits and Vinegar; Tobacco
  { section_number: 'IV', section_title: 'Prepared Foodstuffs; Beverages, Spirits and Vinegar; Tobacco and Manufactured Tobacco Substitutes', chapter_number: '16', chapter_title: 'Preparations of meat, of fish, of crustaceans, molluscs or other aquatic invertebrates, or of insects' },
  { section_number: 'IV', section_title: 'Prepared Foodstuffs; Beverages, Spirits and Vinegar; Tobacco and Manufactured Tobacco Substitutes', chapter_number: '17', chapter_title: 'Sugars and sugar confectionery' },
  { section_number: 'IV', section_title: 'Prepared Foodstuffs; Beverages, Spirits and Vinegar; Tobacco and Manufactured Tobacco Substitutes', chapter_number: '18', chapter_title: 'Cocoa and cocoa preparations' },
  { section_number: 'IV', section_title: 'Prepared Foodstuffs; Beverages, Spirits and Vinegar; Tobacco and Manufactured Tobacco Substitutes', chapter_number: '19', chapter_title: 'Preparations of cereals, flour, starch or milk; pastrycooks\' products' },
  { section_number: 'IV', section_title: 'Prepared Foodstuffs; Beverages, Spirits and Vinegar; Tobacco and Manufactured Tobacco Substitutes', chapter_number: '20', chapter_title: 'Preparations of vegetables, fruit, nuts or other parts of plants' },
  { section_number: 'IV', section_title: 'Prepared Foodstuffs; Beverages, Spirits and Vinegar; Tobacco and Manufactured Tobacco Substitutes', chapter_number: '21', chapter_title: 'Miscellaneous edible preparations' },
  { section_number: 'IV', section_title: 'Prepared Foodstuffs; Beverages, Spirits and Vinegar; Tobacco and Manufactured Tobacco Substitutes', chapter_number: '22', chapter_title: 'Beverages, spirits and vinegar' },
  { section_number: 'IV', section_title: 'Prepared Foodstuffs; Beverages, Spirits and Vinegar; Tobacco and Manufactured Tobacco Substitutes', chapter_number: '23', chapter_title: 'Residues and waste from the food industries; prepared animal fodder' },
  { section_number: 'IV', section_title: 'Prepared Foodstuffs; Beverages, Spirits and Vinegar; Tobacco and Manufactured Tobacco Substitutes', chapter_number: '24', chapter_title: 'Tobacco and manufactured tobacco substitutes; products, whether or not containing nicotine, intended for inhalation without combustion; other nicotine containing products intended for the intake of nicotine into the human body' },

  // Section V — Mineral Products
  { section_number: 'V', section_title: 'Mineral Products', chapter_number: '25', chapter_title: 'Salt; sulphur; earths and stone; plastering materials, lime and cement' },
  { section_number: 'V', section_title: 'Mineral Products', chapter_number: '26', chapter_title: 'Ores, slag and ash' },
  { section_number: 'V', section_title: 'Mineral Products', chapter_number: '27', chapter_title: 'Mineral fuels, mineral oils and products of their distillation; bituminous substances; mineral waxes' },

  // Section VI — Products of the Chemical or Allied Industries
  { section_number: 'VI', section_title: 'Products of the Chemical or Allied Industries', chapter_number: '28', chapter_title: 'Inorganic chemicals; organic or inorganic compounds of precious metals, of rare-earth metals, of radioactive elements or of isotopes' },
  { section_number: 'VI', section_title: 'Products of the Chemical or Allied Industries', chapter_number: '29', chapter_title: 'Organic chemicals' },
  { section_number: 'VI', section_title: 'Products of the Chemical or Allied Industries', chapter_number: '30', chapter_title: 'Pharmaceutical products' },
  { section_number: 'VI', section_title: 'Products of the Chemical or Allied Industries', chapter_number: '31', chapter_title: 'Fertilisers' },
  { section_number: 'VI', section_title: 'Products of the Chemical or Allied Industries', chapter_number: '32', chapter_title: 'Tanning or dyeing extracts; tannins and their derivatives; dyes, pigments and other colouring matter; paints and varnishes; putty and other mastics; inks' },
  { section_number: 'VI', section_title: 'Products of the Chemical or Allied Industries', chapter_number: '33', chapter_title: 'Essential oils and resinoids; perfumery, cosmetic or toilet preparations' },
  { section_number: 'VI', section_title: 'Products of the Chemical or Allied Industries', chapter_number: '34', chapter_title: 'Soap, organic surface-active agents, washing preparations, lubricating preparations, artificial waxes, prepared waxes, polishing or scouring preparations, candles and similar articles, modelling pastes, "dental waxes" and dental preparations with a basis of plaster' },
  { section_number: 'VI', section_title: 'Products of the Chemical or Allied Industries', chapter_number: '35', chapter_title: 'Albuminoidal substances; modified starches; glues; enzymes' },
  { section_number: 'VI', section_title: 'Products of the Chemical or Allied Industries', chapter_number: '36', chapter_title: 'Explosives; pyrotechnic products; matches; pyrophoric alloys; certain combustible preparations' },
  { section_number: 'VI', section_title: 'Products of the Chemical or Allied Industries', chapter_number: '37', chapter_title: 'Photographic or cinematographic goods' },
  { section_number: 'VI', section_title: 'Products of the Chemical or Allied Industries', chapter_number: '38', chapter_title: 'Miscellaneous chemical products' },

  // Section VII — Plastics and Articles Thereof; Rubber and Articles Thereof
  { section_number: 'VII', section_title: 'Plastics and Articles Thereof; Rubber and Articles Thereof', chapter_number: '39', chapter_title: 'Plastics and articles thereof' },
  { section_number: 'VII', section_title: 'Plastics and Articles Thereof; Rubber and Articles Thereof', chapter_number: '40', chapter_title: 'Rubber and articles thereof' },

  // Section VIII — Raw Hides and Skins, Leather, Furskins and Articles Thereof
  { section_number: 'VIII', section_title: 'Raw Hides and Skins, Leather, Furskins and Articles Thereof; Saddlery and Harness; Travel Goods, Handbags and Similar Containers; Articles of Animal Gut', chapter_number: '41', chapter_title: 'Raw hides and skins (other than furskins) and leather' },
  { section_number: 'VIII', section_title: 'Raw Hides and Skins, Leather, Furskins and Articles Thereof; Saddlery and Harness; Travel Goods, Handbags and Similar Containers; Articles of Animal Gut', chapter_number: '42', chapter_title: 'Articles of leather; saddlery and harness; travel goods, handbags and similar containers; articles of animal gut (other than silkworm gut)' },
  { section_number: 'VIII', section_title: 'Raw Hides and Skins, Leather, Furskins and Articles Thereof; Saddlery and Harness; Travel Goods, Handbags and Similar Containers; Articles of Animal Gut', chapter_number: '43', chapter_title: 'Furskins and artificial fur; manufactures thereof' },

  // Section IX — Wood and Articles of Wood; Wood Charcoal; Cork and Articles of Cork
  { section_number: 'IX', section_title: 'Wood and Articles of Wood; Wood Charcoal; Cork and Articles of Cork; Manufactures of Straw, of Esparto or of Other Plaiting Materials; Basketware and Wickerwork', chapter_number: '44', chapter_title: 'Wood and articles of wood; wood charcoal' },
  { section_number: 'IX', section_title: 'Wood and Articles of Wood; Wood Charcoal; Cork and Articles of Cork; Manufactures of Straw, of Esparto or of Other Plaiting Materials; Basketware and Wickerwork', chapter_number: '45', chapter_title: 'Cork and articles of cork' },
  { section_number: 'IX', section_title: 'Wood and Articles of Wood; Wood Charcoal; Cork and Articles of Cork; Manufactures of Straw, of Esparto or of Other Plaiting Materials; Basketware and Wickerwork', chapter_number: '46', chapter_title: 'Manufactures of straw, of esparto or of other plaiting materials; basketware and wickerwork' },

  // Section X — Pulp of Wood or of Other Fibrous Cellulosic Material
  { section_number: 'X', section_title: 'Pulp of Wood or of Other Fibrous Cellulosic Material; Recovered (Waste and Scrap) Paper or Paperboard; Paper and Paperboard and Articles Thereof', chapter_number: '47', chapter_title: 'Pulp of wood or of other fibrous cellulosic material; recovered (waste and scrap) paper or paperboard' },
  { section_number: 'X', section_title: 'Pulp of Wood or of Other Fibrous Cellulosic Material; Recovered (Waste and Scrap) Paper or Paperboard; Paper and Paperboard and Articles Thereof', chapter_number: '48', chapter_title: 'Paper and paperboard; articles of paper pulp, of paper or of paperboard' },
  { section_number: 'X', section_title: 'Pulp of Wood or of Other Fibrous Cellulosic Material; Recovered (Waste and Scrap) Paper or Paperboard; Paper and Paperboard and Articles Thereof', chapter_number: '49', chapter_title: 'Printed books, newspapers, pictures and other products of the printing industry; manuscripts, typescripts and plans' },

  // Section XI — Textiles and Textile Articles
  { section_number: 'XI', section_title: 'Textiles and Textile Articles', chapter_number: '50', chapter_title: 'Silk' },
  { section_number: 'XI', section_title: 'Textiles and Textile Articles', chapter_number: '51', chapter_title: 'Wool, fine or coarse animal hair; horsehair yarn and woven fabric' },
  { section_number: 'XI', section_title: 'Textiles and Textile Articles', chapter_number: '52', chapter_title: 'Cotton' },
  { section_number: 'XI', section_title: 'Textiles and Textile Articles', chapter_number: '53', chapter_title: 'Other vegetable textile fibres; paper yarn and woven fabrics of paper yarn' },
  { section_number: 'XI', section_title: 'Textiles and Textile Articles', chapter_number: '54', chapter_title: 'Man-made filaments; strip and the like of man-made textile materials' },
  { section_number: 'XI', section_title: 'Textiles and Textile Articles', chapter_number: '55', chapter_title: 'Man-made staple fibres' },
  { section_number: 'XI', section_title: 'Textiles and Textile Articles', chapter_number: '56', chapter_title: 'Wadding, felt and nonwovens; special yarns; twine, cordage, ropes and cables and articles thereof' },
  { section_number: 'XI', section_title: 'Textiles and Textile Articles', chapter_number: '57', chapter_title: 'Carpets and other textile floor coverings' },
  { section_number: 'XI', section_title: 'Textiles and Textile Articles', chapter_number: '58', chapter_title: 'Special woven fabrics; tufted textile fabrics; lace; tapestries; trimmings; embroidery' },
  { section_number: 'XI', section_title: 'Textiles and Textile Articles', chapter_number: '59', chapter_title: 'Impregnated, coated, covered or laminated textile fabrics; textile articles of a kind suitable for industrial use' },
  { section_number: 'XI', section_title: 'Textiles and Textile Articles', chapter_number: '60', chapter_title: 'Knitted or crocheted fabrics' },
  { section_number: 'XI', section_title: 'Textiles and Textile Articles', chapter_number: '61', chapter_title: 'Articles of apparel and clothing accessories, knitted or crocheted' },
  { section_number: 'XI', section_title: 'Textiles and Textile Articles', chapter_number: '62', chapter_title: 'Articles of apparel and clothing accessories, not knitted or crocheted' },
  { section_number: 'XI', section_title: 'Textiles and Textile Articles', chapter_number: '63', chapter_title: 'Other made up textile articles; sets; worn clothing and worn textile articles; rags' },

  // Section XII — Footwear, Headgear, Umbrellas
  { section_number: 'XII', section_title: 'Footwear, Headgear, Umbrellas, Sun Umbrellas, Walking-Sticks, Seat-Sticks, Whips, Riding-Crops and Parts Thereof; Prepared Feathers and Articles Made Therewith; Artificial Flowers; Articles of Human Hair', chapter_number: '64', chapter_title: 'Footwear, gaiters and the like; parts of such articles' },
  { section_number: 'XII', section_title: 'Footwear, Headgear, Umbrellas, Sun Umbrellas, Walking-Sticks, Seat-Sticks, Whips, Riding-Crops and Parts Thereof; Prepared Feathers and Articles Made Therewith; Artificial Flowers; Articles of Human Hair', chapter_number: '65', chapter_title: 'Headgear and parts thereof' },
  { section_number: 'XII', section_title: 'Footwear, Headgear, Umbrellas, Sun Umbrellas, Walking-Sticks, Seat-Sticks, Whips, Riding-Crops and Parts Thereof; Prepared Feathers and Articles Made Therewith; Artificial Flowers; Articles of Human Hair', chapter_number: '66', chapter_title: 'Umbrellas, sun umbrellas, walking-sticks, seat-sticks, whips, riding-crops and parts thereof' },
  { section_number: 'XII', section_title: 'Footwear, Headgear, Umbrellas, Sun Umbrellas, Walking-Sticks, Seat-Sticks, Whips, Riding-Crops and Parts Thereof; Prepared Feathers and Articles Made Therewith; Artificial Flowers; Articles of Human Hair', chapter_number: '67', chapter_title: 'Prepared feathers and down and articles made of feathers or of down; artificial flowers; articles of human hair' },

  // Section XIII — Articles of Stone, Plaster, Cement, Asbestos, Mica; Ceramic Products; Glass and Glassware
  { section_number: 'XIII', section_title: 'Articles of Stone, Plaster, Cement, Asbestos, Mica or Similar Materials; Ceramic Products; Glass and Glassware', chapter_number: '68', chapter_title: 'Articles of stone, plaster, cement, asbestos, mica or similar materials' },
  { section_number: 'XIII', section_title: 'Articles of Stone, Plaster, Cement, Asbestos, Mica or Similar Materials; Ceramic Products; Glass and Glassware', chapter_number: '69', chapter_title: 'Ceramic products' },
  { section_number: 'XIII', section_title: 'Articles of Stone, Plaster, Cement, Asbestos, Mica or Similar Materials; Ceramic Products; Glass and Glassware', chapter_number: '70', chapter_title: 'Glass and glassware' },

  // Section XIV — Natural or Cultured Pearls, Precious or Semi-Precious Stones, Precious Metals
  { section_number: 'XIV', section_title: 'Natural or Cultured Pearls, Precious or Semi-Precious Stones, Precious Metals, Metals Clad with Precious Metal, and Articles Thereof; Imitation Jewellery; Coin', chapter_number: '71', chapter_title: 'Natural or cultured pearls, precious or semi-precious stones, precious metals, metals clad with precious metal, and articles thereof; imitation jewellery; coin' },

  // Section XV — Base Metals and Articles of Base Metal
  { section_number: 'XV', section_title: 'Base Metals and Articles of Base Metal', chapter_number: '72', chapter_title: 'Iron and steel' },
  { section_number: 'XV', section_title: 'Base Metals and Articles of Base Metal', chapter_number: '73', chapter_title: 'Articles of iron or steel' },
  { section_number: 'XV', section_title: 'Base Metals and Articles of Base Metal', chapter_number: '74', chapter_title: 'Copper and articles thereof' },
  { section_number: 'XV', section_title: 'Base Metals and Articles of Base Metal', chapter_number: '75', chapter_title: 'Nickel and articles thereof' },
  { section_number: 'XV', section_title: 'Base Metals and Articles of Base Metal', chapter_number: '76', chapter_title: 'Aluminium and articles thereof' },
  { section_number: 'XV', section_title: 'Base Metals and Articles of Base Metal', chapter_number: '77', chapter_title: 'Reserved for possible future use' },
  { section_number: 'XV', section_title: 'Base Metals and Articles of Base Metal', chapter_number: '78', chapter_title: 'Lead and articles thereof' },
  { section_number: 'XV', section_title: 'Base Metals and Articles of Base Metal', chapter_number: '79', chapter_title: 'Zinc and articles thereof' },
  { section_number: 'XV', section_title: 'Base Metals and Articles of Base Metal', chapter_number: '80', chapter_title: 'Tin and articles thereof' },
  { section_number: 'XV', section_title: 'Base Metals and Articles of Base Metal', chapter_number: '81', chapter_title: 'Other base metals; cermets; articles thereof' },
  { section_number: 'XV', section_title: 'Base Metals and Articles of Base Metal', chapter_number: '82', chapter_title: 'Tools, implements, cutlery, spoons and forks, of base metal; parts thereof of base metal' },
  { section_number: 'XV', section_title: 'Base Metals and Articles of Base Metal', chapter_number: '83', chapter_title: 'Miscellaneous articles of base metal' },

  // Section XVI — Machinery and Mechanical Appliances; Electrical Equipment
  { section_number: 'XVI', section_title: 'Machinery and Mechanical Appliances; Electrical Equipment; Parts Thereof; Sound Recorders and Reproducers, Television Image and Sound Recorders and Reproducers, and Parts and Accessories of Such Articles', chapter_number: '84', chapter_title: 'Nuclear reactors, boilers, machinery and mechanical appliances; parts thereof' },
  { section_number: 'XVI', section_title: 'Machinery and Mechanical Appliances; Electrical Equipment; Parts Thereof; Sound Recorders and Reproducers, Television Image and Sound Recorders and Reproducers, and Parts and Accessories of Such Articles', chapter_number: '85', chapter_title: 'Electrical machinery and equipment and parts thereof; sound recorders and reproducers, television image and sound recorders and reproducers, and parts and accessories of such articles' },

  // Section XVII — Vehicles, Aircraft, Vessels and Associated Transport Equipment
  { section_number: 'XVII', section_title: 'Vehicles, Aircraft, Vessels and Associated Transport Equipment', chapter_number: '86', chapter_title: 'Railway or tramway locomotives, rolling-stock and parts thereof; railway or tramway track fixtures and fittings and parts thereof; mechanical (including electro-mechanical) traffic signalling equipment of all kinds' },
  { section_number: 'XVII', section_title: 'Vehicles, Aircraft, Vessels and Associated Transport Equipment', chapter_number: '87', chapter_title: 'Vehicles other than railway or tramway rolling-stock, and parts and accessories thereof' },
  { section_number: 'XVII', section_title: 'Vehicles, Aircraft, Vessels and Associated Transport Equipment', chapter_number: '88', chapter_title: 'Aircraft, spacecraft, and parts thereof' },
  { section_number: 'XVII', section_title: 'Vehicles, Aircraft, Vessels and Associated Transport Equipment', chapter_number: '89', chapter_title: 'Ships, boats and floating structures' },

  // Section XVIII — Optical, Photographic, Cinematographic, Measuring, Checking, Precision, Medical or Surgical Instruments and Apparatus
  { section_number: 'XVIII', section_title: 'Optical, Photographic, Cinematographic, Measuring, Checking, Precision, Medical or Surgical Instruments and Apparatus; Clocks and Watches; Musical Instruments; Parts and Accessories Thereof', chapter_number: '90', chapter_title: 'Optical, photographic, cinematographic, measuring, checking, precision, medical or surgical instruments and apparatus; parts and accessories thereof' },
  { section_number: 'XVIII', section_title: 'Optical, Photographic, Cinematographic, Measuring, Checking, Precision, Medical or Surgical Instruments and Apparatus; Clocks and Watches; Musical Instruments; Parts and Accessories Thereof', chapter_number: '91', chapter_title: 'Clocks and watches and parts thereof' },
  { section_number: 'XVIII', section_title: 'Optical, Photographic, Cinematographic, Measuring, Checking, Precision, Medical or Surgical Instruments and Apparatus; Clocks and Watches; Musical Instruments; Parts and Accessories Thereof', chapter_number: '92', chapter_title: 'Musical instruments; parts and accessories of such articles' },

  // Section XIX — Arms and Ammunition; Parts and Accessories Thereof
  { section_number: 'XIX', section_title: 'Arms and Ammunition; Parts and Accessories Thereof', chapter_number: '93', chapter_title: 'Arms and ammunition; parts and accessories thereof' },

  // Section XX — Miscellaneous Manufactured Articles
  { section_number: 'XX', section_title: 'Miscellaneous Manufactured Articles', chapter_number: '94', chapter_title: 'Furniture; bedding, mattresses, mattress supports, cushions and similar stuffed furnishings; luminaires and lighting fittings, not elsewhere specified or included; illuminated signs, illuminated name-plates and the like; prefabricated buildings' },
  { section_number: 'XX', section_title: 'Miscellaneous Manufactured Articles', chapter_number: '95', chapter_title: 'Toys, games and sports requisites; parts and accessories thereof' },
  { section_number: 'XX', section_title: 'Miscellaneous Manufactured Articles', chapter_number: '96', chapter_title: 'Miscellaneous manufactured articles' },

  // Section XXI — Works of Art, Collectors' Pieces and Antiques
  { section_number: 'XXI', section_title: 'Works of Art, Collectors\' Pieces and Antiques', chapter_number: '97', chapter_title: 'Works of art, collectors\' pieces and antiques' },
];

const insert = db.prepare(`
  INSERT INTO ahecc_chapters (section_number, section_title, chapter_number, chapter_title)
  VALUES (@section_number, @section_title, @chapter_number, @chapter_title)
`);

const insertMany = db.transaction((items: AHECCChapter[]) => {
  for (const item of items) {
    insert.run(item);
  }
});

insertMany(chapters);

// Create FTS index
db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS ahecc_fts USING fts5(
    section_number,
    section_title,
    chapter_number,
    chapter_title,
    content='ahecc_chapters',
    content_rowid='id'
  );
  INSERT INTO ahecc_fts(ahecc_fts) VALUES('rebuild');
`);

const count = db.prepare('SELECT COUNT(*) as cnt FROM ahecc_chapters').get() as { cnt: number };
console.log(`Seeded ${count.cnt} AHECC chapters across 21 sections`);

db.close();
