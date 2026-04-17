import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

try { db.exec('ALTER TABLE prohibited_imports_regs ADD COLUMN content TEXT'); } catch { /* exists */ }

const updates: Record<string, string> = {
  '1': `These Regulations are the Customs (Prohibited Imports) Regulations 1956.`,

  '2': `(1) In these Regulations, unless the contrary intention appears:\n\nadjustable stock has the meaning given in subregulation 4F(4).\n\nasbestos has the same meaning as in the Work Health and Safety Regulations 2011.\n\nauthorised person means a person appointed as an authorised person under the relevant regulation.\n\ncounterfeit credit card, debit card or charge card means a card that purports to be a credit card, debit card or charge card but is not.\n\nCWC means the Convention on the Prohibition of the Development, Production, Stockpiling and Use of Chemical Weapons and on their Destruction.\n\nminister includes an authorised person.`,

  '3': `(1) The importation of goods specified in Schedule 1 is prohibited absolutely.`,

  '3AA': `(1) The importation of a device designed or customised to be used by a person to commit suicide, or to be used by a person to assist another person to commit suicide, is prohibited absolutely.\n\n(2) The importation of the following documents is prohibited absolutely:\n (a) a document that promotes the use of a device mentioned in subregulation (1);\n (b) a document that counsels or incites a person to commit suicide using one of those devices;\n (c) a document that instructs a person how to commit suicide using one of those devices.`,

  '3A': `(1) For the purposes of the application of regulation 4 in relation to the importation of goods specified in items 12A and 12AA of Part 2 of Schedule 2, the criteria in relation to the defence forces of a country are:\n (a) the country is a party to a bilateral or multilateral defence cooperation arrangement with Australia;\n (b) the goods are for the use of the defence forces of the country.`,

  '3C': `For the purposes of the application of regulation 4 in relation to the importation of goods specified in item 12A of Part 2 of Schedule 2, the criteria in relation to an air security officer are that the officer is performing duties as an air security officer on an aircraft.`,

  '4': `(1) The importation of goods specified in Schedule 2 is prohibited unless the Minister or an authorised person has granted the person seeking to import the goods a permission, in writing, to import the goods and the goods are imported in accordance with any conditions or restrictions specified in the permission.\n\n(2) The importation of goods specified in Schedule 3 is prohibited unless certain conditions and restrictions are complied with (see Schedule 3).\n\nApplication for permission\n\n(3) An applicant for a permission under subregulation (1) must:\n (a) lodge a written application with the Minister or an authorised person; and\n (b) give to the Minister or authorised person such information relevant to the application as is requested.`,

  '4A': `(1) In this regulation, unless the contrary intention appears:\n\nauthorised person means a person appointed to be an authorised person under subregulation (2A).\n\ncomputer game means a computer program and associated data capable of generating a display on a computer monitor, television screen, liquid crystal display or similar medium that allows the playing of an interactive game.\n\nobjectionable goods means goods that:\n (a) describe, depict, express or otherwise deal with matters of sex, drug misuse or addiction, crime, cruelty, violence or revolting or abhorrent phenomena in such a way that they offend against the standards of morality, decency and propriety generally accepted by reasonable adults; or\n (b) describe or depict a person under 18, or a person who appears to be under 18, in a way that is likely to cause offence to a reasonable adult; or\n (c) promote, incite or instruct in matters of crime or violence.\n\n(2) The importation of objectionable goods is prohibited unless the Minister or an authorised person has granted permission.`,

  '4AA': `The importation of plastic explosives that do not contain a detection agent is prohibited unless the Minister has granted permission in writing.`,

  '4AB': `The importation of polychlorinated biphenyls (PCBs) and polychlorinated terphenyls (PCTs) is prohibited unless the Minister has granted permission in writing.`,

  '4AC': `The importation of mercury is prohibited unless the Minister has granted permission in writing. This implements Australia\u2019s obligations under the Minamata Convention on Mercury.`,

  '4B': `(1) The importation of fish is prohibited unless:\n (a) the importer holds a permission granted by the Minister or an authorised person; and\n (b) the fish are imported in accordance with any conditions or restrictions specified in the permission.`,

  '4BA': `The importation of toothfish (Dissostichus species) is prohibited unless the requirements of Schedule 3A are met. This implements Australia\u2019s obligations under the Convention on the Conservation of Antarctic Marine Living Resources (CCAMLR).`,

  '4C': `(1) The importation of asbestos is prohibited absolutely.\n\n(2) However, subregulation (1) does not apply if:\n (a) the asbestos is in a sample that is imported solely for the purpose of identification or analysis; and\n (b) the sample is not larger than is reasonably necessary for that purpose; and\n (c) the sample is destroyed as soon as practicable after the identification or analysis has been completed.\n\n(3) Subregulation (1) does not apply to the importation of goods that contain asbestos if the goods are for personal use and are not for sale or commercial use.`,

  '4D': `The importation of unmanufactured tobacco, tobacco refuse, and tobacco stems is prohibited unless:\n (a) the importer holds a permission granted by the Minister or an authorised person; and\n (b) the tobacco is imported in accordance with conditions specified in the permission.`,

  '4DA': `The importation of tobacco products (within the meaning of the Excise Act 1901) is prohibited unless the importer holds a permission granted by the Minister or an authorised person and the products comply with all applicable requirements.`,

  '4F': `(1) The importation into Australia of a firearm, firearm accessory, firearm part, firearm magazine, ammunition or ammunition component is prohibited unless:\n (a) the person importing the item is the holder of a permission to import the item granted by the Minister or an authorised person under this regulation; and\n (b) the item is imported in accordance with any conditions or restrictions specified in the permission.\n\n(2) Without limiting subregulation (1), Schedule 6 sets out requirements that must be met before a permission may be granted.\n\n(3) The Minister or authorised person must not grant a permission unless satisfied that the public safety test in regulation 4FA is met.\n\n(4) In this regulation:\n\nadjustable stock means a stock that allows the length of pull to be adjusted.\n\nfirearm means a device designed or adapted to discharge shot, a bullet or other projectile by means of an explosive, compressed gas or other propellant.`,

  '4FA': `The public safety test for firearms: The Minister or authorised person must, in deciding whether to grant a permission under regulation 4F, have regard to:\n (a) whether the importation of the firearm would be likely to raise concerns about public safety; and\n (b) whether there is a genuine reason for the importation.`,

  '4H': `(1) The importation into Australia of a weapon or weapon part is prohibited unless the person importing the item holds a permission granted by the Minister or an authorised person.\n\n(2) Schedule 13 sets out requirements for the importation of weapons and weapon parts.`,

  '4HA': `The public safety test for weapons: The Minister or authorised person must, in deciding whether to grant a permission under regulation 4H, have regard to whether the importation would be likely to raise concerns about public safety.`,

  '4I': `The importation of ice pipes (pipes designed or intended for use in smoking methamphetamine) is prohibited absolutely.`,

  '4MA': `The importation of rough diamonds is prohibited unless the diamonds are accompanied by a Kimberley Process certificate.`,

  '4R': `The importation of radioactive substances is prohibited unless the importer holds a permission granted by the Minister or an authorised person.`,

  '4T': `The importation of counterfeit credit cards, debit cards or charge cards is prohibited absolutely.`,

  '4U': `The importation of goods that are subject to a permanent ban under section 109 of Schedule 2 to the Competition and Consumer Act 2010 is prohibited.`,

  '4V': `The importation of goods bearing the word \u201cAnzac\u201d or a word resembling \u201cAnzac\u201d is prohibited unless the Minister for Veterans\u2019 Affairs has given written permission.`,

  '4W': `The importation of goods made from cat fur or dog fur is prohibited absolutely.`,

  '4X': `The importation of security sensitive ammonium nitrate is prohibited unless the importer holds a permission granted by the Minister or an authorised person.`,

  '4XA': `The importation of goods covered by autonomous sanctions regulations is prohibited unless the Minister has granted written permission.`,

  '4Y': `The importation of goods from the Democratic People\u2019s Republic of Korea is prohibited in accordance with UN Security Council resolutions.`,

  '4Z': `The importation of certain goods from Iran is prohibited in accordance with UN Security Council resolutions and Australian autonomous sanctions.`,

  '4ZB': `The importation of certain goods from the Libyan Arab Jamahiriya is prohibited in accordance with UN Security Council resolutions.`,

  '4ZC': `The importation of certain goods from Somalia is prohibited in accordance with UN Security Council resolutions.`,

  '5': `(1) Subject to subregulations (2) and (2A), the importation into Australia of a drug is prohibited unless:\n (a) the person importing the drug is the holder of:\n   (i) a licence to import drugs granted by the Secretary or an authorised person under this regulation; and\n   (ii) a permission to import the drug granted by the Secretary or an authorised person under this regulation;\n (b) the permission, or a copy, is produced to the Collector;\n (c) the drug is imported within the period specified in the permission; and\n (d) the quantity of the drug imported does not exceed the quantity specified in the permission.\n\n(2) Subregulation (1) does not apply to a drug imported by a traveller for personal use in a quantity not exceeding that reasonably required for that purpose.`,

  '5A': `The importation of vaping goods is prohibited unless the importer holds a valid permission. This regulation was introduced by the Customs Legislation Amendment (Vaping Goods) Regulations 2023.`,

  '5K': `The importation of ozone depleting substances and synthetic greenhouse gases listed in Schedules 1 and 2 of the Ozone Protection and Synthetic Greenhouse Gas Management Act 1989 is prohibited unless the importer holds a licence and permission.`,

  '5M': `The importation of engineered stone benchtops, panels or slabs is prohibited absolutely. This regulation was introduced effective from 1 July 2024.`,

  '6': `These Regulations do not derogate from any law of the Commonwealth, a State or a Territory.`,

  '7': `The Secretary of the Department of Foreign Affairs and Trade may, in writing, delegate to an SES employee or acting SES employee in the Department all or any of the Secretary\u2019s powers under these Regulations.`,
};

const stmt = db.prepare('UPDATE prohibited_imports_regs SET content = ? WHERE regulation_number = ?');
let updated = 0;
db.transaction(() => {
  for (const [num, content] of Object.entries(updates)) {
    const result = stmt.run(content, num);
    if (result.changes > 0) updated++;
  }
})();

// Also update schedules
const schedUpdates: Record<string, string> = {
  'Schedule 1': 'Goods the importation of which is absolutely prohibited, including: objectionable material, seditious material, goods infringing intellectual property, goods produced by prison labour.',
  'Schedule 2': 'Goods the importation of which is prohibited unless written permission from the Minister has been obtained. Covers firearms, weapons, body armour, and other restricted items.',
  'Schedule 3': 'Goods the importation of which is prohibited unless specified conditions and restrictions are complied with.',
  'Schedule 4': 'Lists of drugs and substances whose importation is controlled under regulation 5.',
  'Schedule 6': 'Requirements relating to the importation of firearms, firearm accessories, parts, magazines, ammunition and components.',
  'Schedule 7': 'Methods for testing glazed ceramic ware.',
  'Schedule 7A': 'Substances whose importation requires permission under regulation 5G.',
  'Schedule 8': 'Goods whose importation requires permission under regulation 5H.',
  'Schedule 9': 'Certain organochlorine chemicals whose importation is controlled.',
  'Schedule 11': 'Chemical compounds controlled under the Chemical Weapons Convention (CWC Schedules 1-3).',
  'Schedule 12': 'Goods subject to permanent bans under the Competition and Consumer Act 2010.',
  'Schedule 13': 'Requirements relating to the importation of weapons and weapon parts.',
};

for (const [num, content] of Object.entries(schedUpdates)) {
  const result = stmt.run(content, num);
  if (result.changes > 0) updated++;
}

// Rebuild FTS
db.exec(`DROP TABLE IF EXISTS prohibited_imports_fts;
  CREATE VIRTUAL TABLE prohibited_imports_fts USING fts5(regulation_number, regulation_title, part, part_title, category, content, content='prohibited_imports_regs', content_rowid='id');
  INSERT INTO prohibited_imports_fts(prohibited_imports_fts) VALUES('rebuild');`);

console.log(`Updated ${updated} regulations/schedules with content`);
db.close();
