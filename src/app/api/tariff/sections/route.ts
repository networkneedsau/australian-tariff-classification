import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// WCO Harmonized System — Section → Chapter ranges + titles.
// The DB section_number / section_title columns are not reliable
// (many rows are missing / set to 0), so we compute the grouping
// deterministically from chapter numbers.
const SECTIONS: { number: number; title: string; chapters: [number, number] }[] = [
  { number: 1,  title: 'Live animals; animal products', chapters: [1, 5] },
  { number: 2,  title: 'Vegetable products', chapters: [6, 14] },
  { number: 3,  title: 'Animal, vegetable or microbial fats and oils', chapters: [15, 15] },
  { number: 4,  title: 'Prepared foodstuffs; beverages, spirits and vinegar; tobacco', chapters: [16, 24] },
  { number: 5,  title: 'Mineral products', chapters: [25, 27] },
  { number: 6,  title: 'Products of the chemical or allied industries', chapters: [28, 38] },
  { number: 7,  title: 'Plastics and articles thereof; rubber and articles thereof', chapters: [39, 40] },
  { number: 8,  title: 'Raw hides and skins, leather, furskins and articles thereof', chapters: [41, 43] },
  { number: 9,  title: 'Wood and articles of wood; cork; plaiting materials', chapters: [44, 46] },
  { number: 10, title: 'Pulp of wood; paper and paperboard and articles thereof', chapters: [47, 49] },
  { number: 11, title: 'Textiles and textile articles', chapters: [50, 63] },
  { number: 12, title: 'Footwear, headgear, umbrellas, walking sticks, feathers', chapters: [64, 67] },
  { number: 13, title: 'Articles of stone, plaster, cement; ceramic products; glass', chapters: [68, 70] },
  { number: 14, title: 'Natural or cultured pearls, precious stones, precious metals', chapters: [71, 71] },
  { number: 15, title: 'Base metals and articles of base metal', chapters: [72, 83] },
  { number: 16, title: 'Machinery and mechanical appliances; electrical equipment', chapters: [84, 85] },
  { number: 17, title: 'Vehicles, aircraft, vessels and associated transport equipment', chapters: [86, 89] },
  { number: 18, title: 'Optical, photographic, cinematographic, measuring instruments', chapters: [90, 92] },
  { number: 19, title: 'Arms and ammunition; parts and accessories thereof', chapters: [93, 93] },
  { number: 20, title: 'Miscellaneous manufactured articles', chapters: [94, 96] },
  { number: 21, title: "Works of art, collectors' pieces and antiques", chapters: [97, 97] },
  { number: 22, title: 'Special classification provisions', chapters: [98, 99] },
];

const CHAPTER_TITLES: Record<number, string> = {
  1: 'Live animals', 2: 'Meat and edible meat offal', 3: 'Fish and crustaceans, molluscs and other aquatic invertebrates', 4: 'Dairy produce; birds eggs; natural honey; edible products of animal origin', 5: 'Products of animal origin, not elsewhere specified',
  6: 'Live trees and other plants; bulbs, roots; cut flowers and ornamental foliage', 7: 'Edible vegetables and certain roots and tubers', 8: 'Edible fruit and nuts; peel of citrus fruit or melons', 9: 'Coffee, tea, maté and spices', 10: 'Cereals', 11: 'Products of the milling industry; malt; starches; inulin; wheat gluten', 12: 'Oil seeds and oleaginous fruits; miscellaneous grains, seeds and fruit', 13: 'Lac; gums, resins and other vegetable saps and extracts', 14: 'Vegetable plaiting materials; vegetable products not elsewhere specified',
  15: 'Animal, vegetable or microbial fats and oils and their cleavage products',
  16: 'Preparations of meat, of fish, of crustaceans, molluscs or other aquatic invertebrates', 17: 'Sugars and sugar confectionery', 18: 'Cocoa and cocoa preparations', 19: 'Preparations of cereals, flour, starch or milk; pastrycooks products', 20: 'Preparations of vegetables, fruit, nuts or other parts of plants', 21: 'Miscellaneous edible preparations', 22: 'Beverages, spirits and vinegar', 23: 'Residues and waste from the food industries; prepared animal fodder', 24: 'Tobacco and manufactured tobacco substitutes',
  25: 'Salt; sulphur; earths and stone; plastering materials, lime and cement', 26: 'Ores, slag and ash', 27: 'Mineral fuels, mineral oils and products of their distillation',
  28: 'Inorganic chemicals; compounds of precious metals, of rare-earth metals, of radioactive elements or of isotopes', 29: 'Organic chemicals', 30: 'Pharmaceutical products', 31: 'Fertilisers', 32: 'Tanning or dyeing extracts; tannins and their derivatives; dyes, pigments', 33: 'Essential oils and resinoids; perfumery, cosmetic or toilet preparations', 34: 'Soap, organic surface-active agents, washing preparations, lubricating preparations', 35: 'Albuminoidal substances; modified starches; glues; enzymes', 36: 'Explosives; pyrotechnic products; matches; pyrophoric alloys; certain combustible preparations', 37: 'Photographic or cinematographic goods', 38: 'Miscellaneous chemical products',
  39: 'Plastics and articles thereof', 40: 'Rubber and articles thereof',
  41: 'Raw hides and skins (other than furskins) and leather', 42: 'Articles of leather; saddlery and harness; travel goods, handbags and similar containers', 43: 'Furskins and artificial fur; manufactures thereof',
  44: 'Wood and articles of wood; wood charcoal', 45: 'Cork and articles of cork', 46: 'Manufactures of straw, of esparto or of other plaiting materials; basketware and wickerwork',
  47: 'Pulp of wood or of other fibrous cellulosic material; recovered (waste and scrap) paper or paperboard', 48: 'Paper and paperboard; articles of paper pulp, of paper or of paperboard', 49: 'Printed books, newspapers, pictures and other products of the printing industry',
  50: 'Silk', 51: 'Wool, fine or coarse animal hair; horsehair yarn and woven fabric', 52: 'Cotton', 53: 'Other vegetable textile fibres; paper yarn and woven fabrics of paper yarn', 54: 'Man-made filaments; strip and the like of man-made textile materials', 55: 'Man-made staple fibres', 56: 'Wadding, felt and nonwovens; special yarns; twine, cordage, ropes and cables', 57: 'Carpets and other textile floor coverings', 58: 'Special woven fabrics; tufted textile fabrics; lace; tapestries; trimmings; embroidery', 59: 'Impregnated, coated, covered or laminated textile fabrics', 60: 'Knitted or crocheted fabrics', 61: 'Articles of apparel and clothing accessories, knitted or crocheted', 62: 'Articles of apparel and clothing accessories, not knitted or crocheted', 63: 'Other made up textile articles; sets; worn clothing and worn textile articles; rags',
  64: 'Footwear, gaiters and the like; parts of such articles', 65: 'Headgear and parts thereof', 66: 'Umbrellas, sun umbrellas, walking-sticks, seat-sticks, whips, riding-crops', 67: 'Prepared feathers and down and articles made of feathers or of down; artificial flowers',
  68: 'Articles of stone, plaster, cement, asbestos, mica or similar materials', 69: 'Ceramic products', 70: 'Glass and glassware',
  71: 'Natural or cultured pearls, precious or semi-precious stones, precious metals',
  72: 'Iron and steel', 73: 'Articles of iron or steel', 74: 'Copper and articles thereof', 75: 'Nickel and articles thereof', 76: 'Aluminium and articles thereof', 78: 'Lead and articles thereof', 79: 'Zinc and articles thereof', 80: 'Tin and articles thereof', 81: 'Other base metals; cermets; articles thereof', 82: 'Tools, implements, cutlery, spoons and forks, of base metal', 83: 'Miscellaneous articles of base metal',
  84: 'Nuclear reactors, boilers, machinery and mechanical appliances; parts thereof', 85: 'Electrical machinery and equipment and parts thereof; sound recorders and reproducers',
  86: 'Railway or tramway locomotives, rolling-stock and parts thereof', 87: 'Vehicles other than railway or tramway rolling-stock, and parts and accessories thereof', 88: 'Aircraft, spacecraft, and parts thereof', 89: 'Ships, boats and floating structures',
  90: 'Optical, photographic, cinematographic, measuring, checking, precision, medical or surgical instruments', 91: 'Clocks and watches and parts thereof', 92: 'Musical instruments; parts and accessories of such articles',
  93: 'Arms and ammunition; parts and accessories thereof',
  94: 'Furniture; bedding, mattresses, mattress supports, cushions; lamps and lighting fittings', 95: 'Toys, games and sports requisites; parts and accessories thereof', 96: 'Miscellaneous manufactured articles',
  97: "Works of art, collectors' pieces and antiques",
  98: 'Special classification provisions', 99: 'Reserved for special use',
};

export async function GET() {
  const db = getDb();

  const rows = db.prepare(`
    SELECT DISTINCT chapter_number
    FROM tariff_classifications
    WHERE chapter_number IS NOT NULL AND chapter_number > 0
    ORDER BY chapter_number
  `).all() as { chapter_number: number }[];

  const availableChapters = new Set(rows.map(r => r.chapter_number));

  const result = SECTIONS.map(s => {
    const chapters = [];
    for (let n = s.chapters[0]; n <= s.chapters[1]; n++) {
      if (!availableChapters.has(n)) continue;
      chapters.push({ number: n, title: CHAPTER_TITLES[n] || `Chapter ${n}` });
    }
    return { number: s.number, title: s.title, chapters };
  }).filter(s => s.chapters.length > 0);

  return NextResponse.json(result);
}
