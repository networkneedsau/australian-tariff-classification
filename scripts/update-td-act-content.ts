import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Add content column if not exists
try { db.exec('ALTER TABLE trade_desc_act ADD COLUMN content TEXT'); } catch { /* already exists */ }

const updates: Record<string, string> = {
  '1': `This Act may be cited as the Commerce (Trade Descriptions) Act 1905 and shall commence on a day to be fixed by proclamation not being earlier than six months after the passing of this Act.`,

  '1A': `The Comptroller\u2011General of Customs has the general administration of this Act in so far as it relates to imports.`,

  '2': `This Act shall be incorporated and read as one with the Customs Act 1901.\n\nNote: Chapter 2 of the Criminal Code applies to this Act in the way described in section 5AA of the Customs Act 1901.`,

  '3': `In this Act, unless the contrary intention appears:\n\nComptroller\u2011General of Customs means the person who is the Comptroller\u2011General of Customs in accordance with subsection 11(3) or 14(2) of the Australian Border Force Act 2015.\n\nOfficer means an officer of Customs.\n\nTrade description, in relation to any goods, means any description, statement, indication, or suggestion, direct or indirect:\n\n (a) as to the nature, number, quantity, quality, purity, class, grade, measure, gauge, size, or weight of the goods; or\n (b) as to the country or place in or at which the goods were made or produced; or\n (c) as to the manufacturer or producer of the goods or the person by whom they were selected, packed, or in any way prepared for the market; or\n (d) as to the mode of manufacturing, producing, selecting, packing, or otherwise preparing the goods; or\n (e) as to the material or ingredients of which the goods are composed, or from which they are derived; or\n (f) as to the goods being the subject of an existing patent, privilege, or copyright;\n\nand the use of any figure, word, or mark which, according to the custom of the trade, is commonly taken to be an indication of any of the above matters shall be deemed to be a trade description within the meaning of this Act.\n\nNote: For rules about representations as to the country of origin of goods, see section 10AA.`,

  '4': `(1) A trade description shall be deemed to be applied to goods if it is:\n\n (a) applied to the goods themselves; or\n (b) applied to any covering, label, reel, or thing used in connexion with the goods; or\n (c) used in any manner likely to lead to the belief that it describes or designates the goods.\n\n(2) A trade description shall be deemed to be applied to goods whether it is woven, impressed, stamped, branded, printed, marked, attached to, or in any manner used in connexion with the goods.`,

  '5': `(1) All imported goods and all goods for export shall before delivery from the control of the Customs be subject to examination and inspection by an officer for the purpose of verifying the trade description (if any) applied to the goods and for the purposes of any regulations under this Act.\n\n(2) If, in the opinion of an officer, goods submitted for examination under this section are goods whose correct description is uncertain, or goods in respect of which a false trade description may have been applied, the officer may take or cause to be taken samples of those goods.\n\n(3) Samples may be taken under subsection (2) free of charge and in such quantities as the officer considers reasonably necessary.`,

  '6': `(1) Every person who intends to export any goods to which this Part applies shall, before packing or labelling such goods for export, give notice in writing to the Comptroller\u2011General of Customs of his intention to export those goods.\n\n(2) The notice must state the nature of the goods, the number of packages (if any), and the port from which the goods are to be exported.\n\n(3) A person who contravenes subsection (1) is guilty of an offence punishable on conviction by a fine not exceeding 10 penalty units.`,

  '7': `(1) The regulations may prohibit the importation of any goods unless a trade description is applied to those goods.\n\n(2) If the regulations prohibit the importation of any goods unless a trade description is applied to those goods, a person must not import those goods unless a trade description, being a trade description of the kind required by the regulations, is applied to those goods.\n\nPenalty: 100 penalty units.\n\n(3) Subsection (2) is an offence of strict liability.\n\nNote: For strict liability, see section 6.1 of the Criminal Code.\n\n(4) An offence against subsection (2) may be dealt with as if it were an offence against the Customs Act 1901.\n\nNote: For rules about representations as to the country of origin of goods, see section 10AA.\n\n(5) In a prosecution for an offence against subsection (2), the question whether a trade description applied to the imported goods is a trade description of the kind required by the regulations must be decided having regard only to:\n\n (a) the trade description applied to the goods; and\n (b) such samples (if any) as have been obtained under section 5.`,

  '8': `All goods of a kind the importation of which is prohibited unless a prescribed trade description is applied, found in Australia without such trade description, shall until the contrary is proved be deemed, subject to the regulations, to have been imported in contravention of the regulations.`,

  '9': `(1) A person shall not import any goods to which a false trade description is applied.\n\nPenalty: 100 penalty units.\n\n(2) In a prosecution for an offence against subsection (1) it is a defence if the defendant proves that he or she did not intentionally import the goods in contravention of that subsection.\n\nNote: For rules about representations as to the country of origin of goods, see section 10AA.`,

  '9A': `All imported goods found in Australia which bear a false trade description shall, until the contrary is proved, be deemed to have been imported in contravention of this Act.\n\nNote: For rules about representations as to the country of origin of goods, see section 10AA.`,

  '10': `(1) Goods to which a false trade description is applied are prohibited to be imported.\n\nNote: For rules about representations as to the country of origin of goods, see section 10AA.\n\n(2) Subject to subsection (3), goods imported in contravention of subsection (1) are forfeited to the Crown.\n\n(3) If the Comptroller\u2011General of Customs is satisfied that the contravention was not intentional or reckless:\n\n (a) the Comptroller\u2011General of Customs may, by notice in writing given to the owner or importer of the goods concerned, require the owner or importer to correct the false trade description within a period specified in the notice; and\n (b) if the owner or importer complies with the notice, subsection (2) does not apply in respect of the goods.`,

  '10AA': `(1) For the purposes of sections 9, 9A and 10, goods:\n\n (a) to which a representation has been applied as to the country of origin of the goods; and\n (b) in respect of which the representation is a country of origin representation within the meaning of Part 5\u20113 of the Competition and Consumer Act 2010;\n\ndo not bear a false trade description, to the extent that the trade description relates to the country of origin of the goods, merely because of that country of origin representation.\n\n(2) For the purposes of subsections 7(2) and (5), a trade description that relates to the country of origin of goods is taken to be of the kind required by the regulations if, and only if:\n\n (a) a representation has been applied to the goods as to the country of origin of the goods; and\n (b) the representation would be a country of origin representation within the meaning of Part 5\u20113 of the Competition and Consumer Act 2010.`,

  '10A': `This Part applies to such goods or classes of goods as are prescribed.`,

  '11': `(1) Where a trade description is prescribed in respect of any goods, those goods shall not be exported unless the prescribed trade description is applied to them.\n\nPenalty: 100 penalty units.\n\n(2) An offence against subsection (1) is an offence of strict liability.\n\nNote: For strict liability, see section 6.1 of the Criminal Code.`,

  '12': `A person shall not apply a false trade description to goods for export.\n\nPenalty: 100 penalty units.`,

  '13': `Goods for export to which a false trade description is applied shall be forfeited to the Crown.`,

  '14': `(1) The regulations may require goods for export to be marked, branded, or labelled with such trade description as is prescribed.\n\n(2) A person who fails to comply with any such regulations is guilty of an offence punishable on conviction by a fine not exceeding 10 penalty units.`,

  '15': `(1) Applications may be made to the Administrative Appeals Tribunal for review of a decision of the Comptroller\u2011General of Customs under subsection 10(3).\n\n(2) In subsection (1), decision has the same meaning as in the Administrative Appeals Tribunal Act 1975.`,

  '16': `Where a trade description applied to goods in accordance with this Act or the regulations would disclose a trade secret, the Comptroller\u2011General of Customs may, on the application of the owner or consignee of the goods, permit such modification of the trade description as may be necessary to prevent the disclosure of the trade secret.`,

  '17': `The Governor\u2011General may make regulations, not inconsistent with this Act, prescribing all matters which by this Act are required or permitted to be prescribed, or which are necessary or convenient to be prescribed for giving effect to this Act.`,
};

const stmt = db.prepare('UPDATE trade_desc_act SET content = ? WHERE section_number = ?');
db.transaction(() => {
  for (const [num, content] of Object.entries(updates)) {
    stmt.run(content, num);
  }
})();

// Rebuild FTS
db.exec(`DROP TABLE IF EXISTS trade_desc_act_fts;
  CREATE VIRTUAL TABLE trade_desc_act_fts USING fts5(part, part_title, section_number, section_title, content, content='trade_desc_act', content_rowid='id');
  INSERT INTO trade_desc_act_fts(trade_desc_act_fts) VALUES('rebuild');`);

const count = db.prepare("SELECT COUNT(*) as cnt FROM trade_desc_act WHERE content IS NOT NULL AND content != ''").get() as { cnt: number };
console.log(`Updated ${count.cnt} sections with full text content`);
db.close();
