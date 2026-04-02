import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  DROP TABLE IF EXISTS prohibited_imports_regs;
  CREATE TABLE prohibited_imports_regs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part TEXT,
    part_title TEXT,
    regulation_number TEXT NOT NULL,
    regulation_title TEXT NOT NULL,
    category TEXT,
    content TEXT DEFAULT ''
  );
  CREATE INDEX idx_regs_regulation ON prohibited_imports_regs(regulation_number);
  CREATE INDEX idx_regs_part ON prohibited_imports_regs(part);
`);

interface Reg {
  part?: string;
  part_title?: string;
  regulation_number: string;
  regulation_title: string;
  category?: string;
}

const regs: Reg[] = [
  // Part 1 — Principal Regulations
  { part: 'Part 1', part_title: 'Principal Regulations', regulation_number: '1', regulation_title: 'Name of Regulations', category: 'General' },
  { part: 'Part 1', part_title: 'Principal Regulations', regulation_number: '2', regulation_title: 'Interpretation', category: 'General' },
  { part: 'Part 1', part_title: 'Principal Regulations', regulation_number: '3', regulation_title: 'Goods the importation of which is prohibited absolutely', category: 'General' },

  // Part 2 — Specific Categories
  // Criteria regulations
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '3AA', regulation_title: 'Importation of devices and documents relating to suicide', category: 'Criteria' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '3A', regulation_title: 'Criteria for defence forces of certain overseas countries', category: 'Criteria' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '3C', regulation_title: 'Criteria for air security officers', category: 'Criteria' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '3D', regulation_title: 'Criteria for transhipment of firearms and weapons to foreign countries', category: 'Criteria' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '3E', regulation_title: 'Criteria for importation of firearms used in lawful overseas competitions or hunting', category: 'Criteria' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '3F', regulation_title: 'Criteria for Defense Trade Cooperation Treaty', category: 'Criteria' },

  // Prohibited unless conditions met
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4', regulation_title: 'Goods prohibited unless conditions or restrictions complied with', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4A', regulation_title: 'Importation of objectionable goods', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4AA', regulation_title: 'Importation of plastic explosives', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4AB', regulation_title: 'Importation of polychlorinated biphenyls and terphenyls', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4AC', regulation_title: 'Importation of mercury', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4B', regulation_title: 'Importation of fish', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4BA', regulation_title: 'Importation of toothfish', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4C', regulation_title: 'Importation of asbestos', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4D', regulation_title: 'Importation of unmanufactured tobacco and refuse', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4DA', regulation_title: 'Importation of tobacco products', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4E', regulation_title: 'Importation of glazed ceramic ware', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4F', regulation_title: 'Importation of firearms, accessories, parts, magazines, ammunition, components, imitations', category: 'Firearms & weapons' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4FA', regulation_title: 'Public safety test for firearms', category: 'Firearms & weapons' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4G', regulation_title: 'Importation of tablet presses and encapsulators', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4H', regulation_title: 'Importation of certain weapons and weapon parts', category: 'Firearms & weapons' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4HA', regulation_title: 'Public safety test for weapons', category: 'Firearms & weapons' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4I', regulation_title: 'Importation of ice pipes', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4K', regulation_title: 'Importation of woolpacks', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4MA', regulation_title: 'Importation of rough diamonds', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4R', regulation_title: 'Importation of radioactive substances', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4S', regulation_title: 'Importation of lighters', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4T', regulation_title: 'Importation of counterfeit credit, debit, charge cards', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4U', regulation_title: 'Importation of goods subject to permanent ban under Competition and Consumer Act 2010', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4V', regulation_title: 'Importation of Anzac goods', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4VA', regulation_title: 'Importation of incandescent lamps', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4W', regulation_title: 'Importation of cat or dog fur', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4X', regulation_title: 'Importation of security sensitive ammonium nitrate', category: 'Conditional prohibition' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4XA', regulation_title: 'Importation of goods under autonomous sanctions', category: 'Sanctions' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4Y', regulation_title: 'Importation of goods from Democratic People\'s Republic of Korea', category: 'Sanctions' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4Z', regulation_title: 'Importation of certain goods from Iran', category: 'Sanctions' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4ZB', regulation_title: 'Importation of certain goods from Libyan Arab Jamahiriya', category: 'Sanctions' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '4ZC', regulation_title: 'Importation of certain goods from Somalia', category: 'Sanctions' },

  // Drugs and chemicals
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '5', regulation_title: 'Importation of drugs', category: 'Drugs & chemicals' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '5A', regulation_title: 'Importation of vaping goods', category: 'Drugs & chemicals' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '5F', regulation_title: 'Importation of kava as food', category: 'Drugs & chemicals' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '5G', regulation_title: 'Importation of certain substances', category: 'Drugs & chemicals' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '5H', regulation_title: 'Importation of certain goods', category: 'Drugs & chemicals' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '5HA', regulation_title: 'Review of decisions', category: 'Drugs & chemicals' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '5I', regulation_title: 'Importation of certain organochlorine chemicals', category: 'Drugs & chemicals' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '5J', regulation_title: 'Importation of goods containing certain chemical compounds', category: 'Drugs & chemicals' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '5K', regulation_title: 'Importation of ozone depleting substances and synthetic greenhouse gases', category: 'Drugs & chemicals' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '5L', regulation_title: 'Importation of viable material derived from human embryo clones', category: 'Drugs & chemicals' },
  { part: 'Part 2', part_title: 'Specific Categories of Prohibited/Restricted Goods', regulation_number: '5M', regulation_title: 'Importation of engineered stone benchtops, panels or slabs', category: 'Drugs & chemicals' },

  // Part 3 — General Provisions
  { part: 'Part 3', part_title: 'General Provisions', regulation_number: '6', regulation_title: 'Regulations do not derogate from any other law', category: 'General' },
  { part: 'Part 3', part_title: 'General Provisions', regulation_number: '7', regulation_title: 'Delegation by Foreign Secretary', category: 'General' },

  // Schedules
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 1', regulation_title: 'Absolutely prohibited goods', category: 'Schedule' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 2', regulation_title: 'Goods requiring ministerial permission', category: 'Schedule' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 3', regulation_title: 'Goods requiring specified conditions or restrictions', category: 'Schedule' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 3A', regulation_title: 'Toothfish importation requirements', category: 'Schedule' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 4', regulation_title: 'Drugs', category: 'Schedule' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 6', regulation_title: 'Firearms importation requirements', category: 'Schedule' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 7', regulation_title: 'Glazed ceramic ware testing methods', category: 'Schedule' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 7A', regulation_title: 'Substances requiring permission under regulation 5G', category: 'Schedule' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 8', regulation_title: 'Goods requiring permission under regulation 5H', category: 'Schedule' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 9', regulation_title: 'Organochlorine chemicals', category: 'Schedule' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 11', regulation_title: 'Chemical compounds (CWC Schedules 1-3)', category: 'Schedule' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 12', regulation_title: 'Goods subject to Competition and Consumer Act bans', category: 'Schedule' },
  { part: 'Schedules', part_title: 'Schedules', regulation_number: 'Schedule 13', regulation_title: 'Weapons and weapon parts importation', category: 'Schedule' },
];

const insert = db.prepare(`
  INSERT INTO prohibited_imports_regs (part, part_title, regulation_number, regulation_title, category)
  VALUES (@part, @part_title, @regulation_number, @regulation_title, @category)
`);

const insertMany = db.transaction((items: Reg[]) => {
  for (const item of items) {
    insert.run({
      part: item.part || null,
      part_title: item.part_title || null,
      regulation_number: item.regulation_number,
      regulation_title: item.regulation_title,
      category: item.category || null,
    });
  }
});

insertMany(regs);

// Create FTS index
db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS prohibited_imports_fts USING fts5(
    regulation_number,
    regulation_title,
    part,
    part_title,
    category,
    content,
    content='prohibited_imports_regs',
    content_rowid='id'
  );
  INSERT INTO prohibited_imports_fts(prohibited_imports_fts) VALUES('rebuild');
`);

const count = db.prepare('SELECT COUNT(*) as cnt FROM prohibited_imports_regs').get() as { cnt: number };
console.log(`Seeded ${count.cnt} regulations from Customs (Prohibited Imports) Regulations 1956`);

db.close();
