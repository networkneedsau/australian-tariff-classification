import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

try { db.exec('ALTER TABLE trade_desc_regs ADD COLUMN content TEXT'); } catch { /* exists */ }

const updates: Record<string, string> = {
  '1': `This is the Commerce (Trade Descriptions) Regulation 2016.`,

  '3': `This instrument is made under the Commerce (Trade Descriptions) Act 1905.\n\nNote: The Act is incorporated and read as one with the Customs Act 1901: see section 2 of the Act.`,

  '5': `Note: A number of expressions used in this instrument are defined in the Act, including the following:\n (a) covering;\n (b) label;\n (c) officer;\n (d) trade description.\n\nIn this instrument:\n\nAct means the Commerce (Trade Descriptions) Act 1905.\n\nanalyst means a person appointed under section 22.\n\narticle includes quantity of a substance.\n\ndrug means a substance used as a medicine or in the composition or preparation of a medicine.\n\nexaminable goods means:\n (a) goods to which a trade description is applied; or\n (b) goods covered by Subdivision B of Division 1 of Part 2 (which is about goods whose import is prohibited unless certain trade descriptions are applied); or\n (c) goods covered by Subdivision C of Division 1 of Part 2 (which is about goods whose import is not prohibited).\n\npackage means a container in which goods, whether packed or unpacked, are enclosed for import purposes.\n\npriority food has the same meaning as in the Country of Origin Food Labelling Information Standard 2016, as in force or existing from time to time.\n\nshoes includes boots and sandals.`,

  '6': `(1) If this instrument requires or permits the weight or measure of goods to be indicated, the weight or measure must be in metric units.\n\n(2) Two or more goods packed together in a package for the purpose of being imported in that package constitute a package of goods.\n\n(3) Two or more articles of the same kind, tied, bound, wrapped or otherwise fastened together to form one parcel and imported in that form, constitute a bundle of articles.`,

  '7': `This instrument does not apply to goods that are:\n (a) ship\u2019s stores within the meaning of the Customs Act 1901; or\n (b) aircraft\u2019s stores within the meaning of the Customs Act 1901.`,

  '8': `(1) The importation of goods that are covered by Subdivision B is prohibited unless a trade description has been applied to the goods in accordance with Division 2.\n\nNote 1: The prohibition is in subsection 7(2) of the Act.\n\nNote 2: Subdivision C provides that the importation of certain goods is not prohibited under subsection 7(2) of the Act, whether or not a trade description is applied to the goods.`,

  '8A': `An offence against subsection 7(2) of the Act, as it applies in relation to a prohibition under section 8 of this instrument, is an offence of strict liability.\n\nNote: For strict liability, see section 6.1 of the Criminal Code.`,

  '9': `This Subdivision covers the goods specified in the following table:\n\nGeneral goods:\n 1. Food\n 2. Articles made from china, porcelain, earthenware or enamelled hollowware that are: cups, saucers, plates, mugs, dishes, jugs, casseroles, bowls, tea sets, coffee sets, dinner sets, tureens, vases, ornamental figures, egg cups\n 3. Cutlery, non-electric kettles, scissors\n 4. Apparel, headgear, hosiery, knitted goods, undergarments, nightwear, textile fabrics\n 5. Toys\n 6. Candles, detergents, polishes, soaps, cosmetic preparations, toilet preparations\n 7. Fertiliser\n 8. Drugs\n 9. Textile floor coverings\n 10. Footwear\n 11. Goods imported as prepacked articles not covered elsewhere`,

  '10': `This Subdivision also covers goods if more than half the outside area consists of:\n (a) leather or a material resembling leather; or\n (b) fibre or a material resembling fibre; or\n (c) vulcanite or a material resembling vulcanite; or\n (d) plastic.\n\nGoods covered: Attach\u00e9 cases, Belts, Bicycle saddles, Bridles, Brief cases, Cases for musical instruments/radios/gramophones, Document cases, Folio cases, Gloves, Handbags, Harnesses, Hat boxes/cases, Horse collars, Kit bags, Leggings, Machine belting, Pouches, Purses, Saddles, Saddlebags, School satchels, Suit cases, Travelling bags/trunks, Wallets, Watch straps`,

  '11': `(1) Subdivision B does not cover goods that are imported otherwise than as prepacked articles.\n\n(2) Without limiting subsection (1), Subdivision B does not cover:\n (a) goods that are imported in bulk; or\n (b) goods, other than food, that are imported in an unfinished state; or\n (c) goods that are imported as samples.\n\n(3) However, if food is imported in bulk, a trade description must be applied to each container containing the food.\n\nNote: A container is not the same as a package: see the definitions of container and package in section 5.`,

  '12': `This Subdivision does not apply to a package of goods whose content consists only of goods covered by Subdivision C (which is about goods whose import without a trade description is not prohibited).`,

  '15': `A trade description of goods mentioned in Subdivision B of Division 1 of Part 2 must comply with sections 16, 17, 18, 19 and 20. It excepts those goods from the prohibition in subsection 7(2) of the Act.`,

  '16': `(1) The trade description must include a statement of the country in which the goods were produced or manufactured.\n\nStatement about food\n\n(1A) For the purposes of subsection (1), a statement of the country in which goods that are food were produced or manufactured may be:\n (a) a statement as required by the Country of Origin Food Labelling Information Standard 2016; or\n (b) if the goods are food from a single country imported in a package\u2014a statement identifying the country in which the food was produced or manufactured (however, this paragraph is subject to subsection (3)); or\n (c) if the goods are food from more than one country imported in a package\u2014a statement that indicates that the food is of multiple origins or that it is comprised of imported ingredients.\n\nFormat of statement about priority food imported as prepacked articles\n\n(4) A statement described in paragraph (1)(b) or (c) about priority food imported as prepacked articles must be written in a clearly defined text box.`,

  '17': `(1) The trade description must include a true description of the goods, in prominent and legible characters, containing the particulars that an officer would need in order to determine the tariff classification of the goods.\n\n(2) The trade description must include or be accompanied by a statement as to the composition of the goods.\n\n(3) Without limiting subsection (2), if the goods are composed of more than one substance, the statement must also include a statement of:\n (a) the substances that make up 95% or more, by weight or volume, of the goods; and\n (b) the percentage by weight or volume of each of those substances.`,

  '18': `(1) A trade description must be applied in English.\n\n(2) However, a trade description may include a trade mark in a language other than English.`,

  '19': `(1) The trade description must be applied to the goods, or to a covering, label, reel or thing in or with which the goods are imported, in prominent and legible characters.\n\n(2) A statement of the country in which the goods were produced or manufactured must be applied to the goods themselves.\n\nNote: See section 16 for the content of the statement.\n\n(3) However, if it is not practicable or is not the usual practice of the trade or industry to apply the statement to the goods themselves, the statement may be applied to the covering, label, reel or thing in or with which the goods are imported.\n\n(4) If the goods are imported in a package, the statement must also be applied to the outside of the package.`,

  '20': `(1) A trade description for shoes must include the following information:\n (a) a description of the shoes, including the type; and\n (b) the size of the shoes; and\n (c) a statement as to the material of the upper surface; and\n (d) a statement as to the material of the outer sole; and\n (e) whether the shoes are for men, women, boys, girls, children or infants.\n\n(2) The information must be applied, in prominent and legible characters, to the goods, or to a covering, label, reel or thing in or with which the goods are imported.`,

  '21': `(1) An officer may inspect, examine and take samples of examinable goods.\n\n(2) Samples may be taken free of charge and in such quantities as the officer considers reasonably necessary.\n\n(3) A sample may be taken before, or after, delivery of the goods from the control of Customs.`,

  '22': `(1) The Comptroller\u2011General of Customs may, in writing, appoint a person to be an analyst for the purposes of this instrument.\n\n(2) A person may be appointed under subsection (1) only if the person is, in the opinion of the Comptroller\u2011General of Customs, suitably qualified for the appointment.`,

  '23': `(1) A sample of examinable goods taken under section 21 may be submitted for analysis or examination to an analyst.\n\n(2) The analyst may analyse or examine the sample and must give the Comptroller\u2011General of Customs a certificate of the results.`,

  '24': `Anything done under a provision of the Commerce (Imports) Regulations 1940, as in force immediately before the commencement of this instrument, is taken, after that commencement, to have been done under the corresponding provision of this instrument.`,
};

const stmt = db.prepare('UPDATE trade_desc_regs SET content = ? WHERE regulation_number = ?');
db.transaction(() => {
  for (const [num, content] of Object.entries(updates)) {
    const result = stmt.run(content, num);
    if (result.changes === 0) console.log(`  Warning: no match for regulation ${num}`);
  }
})();

// Rebuild FTS
db.exec(`DROP TABLE IF EXISTS trade_desc_regs_fts;
  CREATE VIRTUAL TABLE trade_desc_regs_fts USING fts5(part, part_title, division, division_title, subdivision, regulation_number, regulation_title, content, content='trade_desc_regs', content_rowid='id');
  INSERT INTO trade_desc_regs_fts(trade_desc_regs_fts) VALUES('rebuild');`);

const count = db.prepare("SELECT COUNT(*) as cnt FROM trade_desc_regs WHERE content IS NOT NULL AND content != ''").get() as { cnt: number };
console.log(`Updated ${count.cnt} regulations with full text content`);
db.close();
