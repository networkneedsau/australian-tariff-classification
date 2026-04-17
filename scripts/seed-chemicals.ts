import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

db.exec(`
  DROP TABLE IF EXISTS chemical_index;
  CREATE TABLE chemical_index (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cwc_schedule TEXT NOT NULL,
    item_number TEXT NOT NULL,
    chemical_name TEXT NOT NULL,
    cas_number TEXT,
    category TEXT NOT NULL,
    notes TEXT
  );
  CREATE INDEX idx_chem_schedule ON chemical_index(cwc_schedule);
  CREATE INDEX idx_chem_cas ON chemical_index(cas_number);
`);

interface Chem {
  cwc_schedule: string;
  item_number: string;
  chemical_name: string;
  cas_number: string | null;
  category: string;
  notes?: string | null;
}

const chemicals: Chem[] = [
  // ═══ CWC SCHEDULE 1 ═══
  // A. Toxic Chemicals
  { cwc_schedule: '1', item_number: '1', chemical_name: 'O-Alkyl (≤C10, incl. cycloalkyl) alkyl (Me, Et, n-Pr or i-Pr) phosphonofluoridates', cas_number: null, category: 'Toxic chemical', notes: 'e.g. Sarin, Soman' },
  { cwc_schedule: '1', item_number: '1a', chemical_name: 'Sarin: O-Isopropyl methylphosphonofluoridate', cas_number: '107-44-8', category: 'Toxic chemical', notes: null },
  { cwc_schedule: '1', item_number: '1b', chemical_name: 'Soman: O-Pinacolyl methylphosphonofluoridate', cas_number: '96-64-0', category: 'Toxic chemical', notes: null },
  { cwc_schedule: '1', item_number: '2', chemical_name: 'O-Alkyl (≤C10, incl. cycloalkyl) N,N-dialkyl (Me, Et, n-Pr or i-Pr) phosphoramidocyanidates', cas_number: null, category: 'Toxic chemical', notes: 'e.g. Tabun' },
  { cwc_schedule: '1', item_number: '2a', chemical_name: 'Tabun: O-Ethyl N,N-dimethyl phosphoramidocyanidate', cas_number: '77-81-6', category: 'Toxic chemical', notes: null },
  { cwc_schedule: '1', item_number: '3', chemical_name: 'O-Alkyl (H or ≤C10, incl. cycloalkyl) S-2-dialkyl (Me, Et, n-Pr or i-Pr)-aminoethyl alkyl (Me, Et, n-Pr or i-Pr) phosphonothiolates', cas_number: null, category: 'Toxic chemical', notes: 'e.g. VX' },
  { cwc_schedule: '1', item_number: '3a', chemical_name: 'VX: O-Ethyl S-2-diisopropylaminoethyl methyl phosphonothiolate', cas_number: '50782-69-9', category: 'Toxic chemical', notes: null },
  { cwc_schedule: '1', item_number: '4', chemical_name: 'Sulfur mustards', cas_number: null, category: 'Toxic chemical', notes: 'Class of compounds' },
  { cwc_schedule: '1', item_number: '4a', chemical_name: '2-Chloroethylchloromethylsulfide', cas_number: '2625-76-5', category: 'Toxic chemical', notes: 'Sulfur mustard' },
  { cwc_schedule: '1', item_number: '4b', chemical_name: 'Mustard gas: Bis(2-chloroethyl)sulfide', cas_number: '505-60-2', category: 'Toxic chemical', notes: 'Sulfur mustard' },
  { cwc_schedule: '1', item_number: '4c', chemical_name: 'Bis(2-chloroethylthio)methane', cas_number: '63869-13-6', category: 'Toxic chemical', notes: 'Sulfur mustard' },
  { cwc_schedule: '1', item_number: '4d', chemical_name: 'Sesquimustard: 1,2-Bis(2-chloroethylthio)ethane', cas_number: '3563-36-8', category: 'Toxic chemical', notes: 'Sulfur mustard' },
  { cwc_schedule: '1', item_number: '4e', chemical_name: '1,3-Bis(2-chloroethylthio)-n-propane', cas_number: '63905-10-2', category: 'Toxic chemical', notes: 'Sulfur mustard' },
  { cwc_schedule: '1', item_number: '4f', chemical_name: '1,4-Bis(2-chloroethylthio)-n-butane', cas_number: '142868-93-7', category: 'Toxic chemical', notes: 'Sulfur mustard' },
  { cwc_schedule: '1', item_number: '4g', chemical_name: '1,5-Bis(2-chloroethylthio)-n-pentane', cas_number: '142868-94-8', category: 'Toxic chemical', notes: 'Sulfur mustard' },
  { cwc_schedule: '1', item_number: '4h', chemical_name: 'Bis(2-chloroethylthiomethyl)ether', cas_number: '63918-90-1', category: 'Toxic chemical', notes: 'Sulfur mustard' },
  { cwc_schedule: '1', item_number: '4i', chemical_name: 'O-Mustard: Bis(2-chloroethylthioethyl)ether', cas_number: '63918-89-8', category: 'Toxic chemical', notes: 'Sulfur mustard' },
  { cwc_schedule: '1', item_number: '5', chemical_name: 'Lewisites', cas_number: null, category: 'Toxic chemical', notes: 'Class of compounds' },
  { cwc_schedule: '1', item_number: '5a', chemical_name: 'Lewisite 1: 2-Chlorovinyldichloroarsine', cas_number: '541-25-3', category: 'Toxic chemical', notes: 'Lewisite' },
  { cwc_schedule: '1', item_number: '5b', chemical_name: 'Lewisite 2: Bis(2-chlorovinyl)chloroarsine', cas_number: '40334-69-8', category: 'Toxic chemical', notes: 'Lewisite' },
  { cwc_schedule: '1', item_number: '5c', chemical_name: 'Lewisite 3: Tris(2-chlorovinyl)arsine', cas_number: '40334-70-1', category: 'Toxic chemical', notes: 'Lewisite' },
  { cwc_schedule: '1', item_number: '6', chemical_name: 'Nitrogen mustards', cas_number: null, category: 'Toxic chemical', notes: 'Class of compounds' },
  { cwc_schedule: '1', item_number: '6a', chemical_name: 'HN1: Bis(2-chloroethyl)ethylamine', cas_number: '538-07-8', category: 'Toxic chemical', notes: 'Nitrogen mustard' },
  { cwc_schedule: '1', item_number: '6b', chemical_name: 'HN2: Bis(2-chloroethyl)methylamine', cas_number: '51-75-2', category: 'Toxic chemical', notes: 'Nitrogen mustard' },
  { cwc_schedule: '1', item_number: '6c', chemical_name: 'HN3: Tris(2-chloroethyl)amine', cas_number: '555-77-1', category: 'Toxic chemical', notes: 'Nitrogen mustard' },
  { cwc_schedule: '1', item_number: '7', chemical_name: 'Saxitoxin', cas_number: '35523-89-8', category: 'Toxic chemical', notes: null },
  { cwc_schedule: '1', item_number: '8', chemical_name: 'Ricin', cas_number: '9009-86-3', category: 'Toxic chemical', notes: null },
  { cwc_schedule: '1', item_number: '13', chemical_name: 'P-alkyl (H or ≤C10, incl. cycloalkyl) N-(1-(dialkyl(≤C10, incl. cycloalkyl)amino))alkylidene(H or ≤C10, incl. cycloalkyl) phosphonamidic fluorides', cas_number: null, category: 'Toxic chemical', notes: 'Novichok-type agents' },
  { cwc_schedule: '1', item_number: '13a', chemical_name: 'A-230', cas_number: '2387495-99-8', category: 'Toxic chemical', notes: 'Novichok' },
  { cwc_schedule: '1', item_number: '13b', chemical_name: 'A-232', cas_number: '2387496-12-8', category: 'Toxic chemical', notes: 'Novichok' },
  { cwc_schedule: '1', item_number: '14', chemical_name: 'O-alkyl (H or ≤C10, incl. cycloalkyl) N-(1-(dialkyl(≤C10, incl. cycloalkyl)amino))alkylidene(H or ≤C10, incl. cycloalkyl) phosphoramidofluoridates', cas_number: null, category: 'Toxic chemical', notes: 'Novichok-type agents' },
  { cwc_schedule: '1', item_number: '14a', chemical_name: 'A-234', cas_number: '2387496-00-4', category: 'Toxic chemical', notes: 'Novichok' },
  { cwc_schedule: '1', item_number: '14b', chemical_name: 'Compound from 14 family (variant 1)', cas_number: '2387496-04-8', category: 'Toxic chemical', notes: 'Novichok' },
  { cwc_schedule: '1', item_number: '14c', chemical_name: 'Compound from 14 family (variant 2)', cas_number: '2387496-06-0', category: 'Toxic chemical', notes: 'Novichok' },
  { cwc_schedule: '1', item_number: '15', chemical_name: 'Methyl-(bis(diethylamino)methylene)phosphonamidofluoridate', cas_number: '2387496-14-0', category: 'Toxic chemical', notes: 'Novichok-type' },
  { cwc_schedule: '1', item_number: '16', chemical_name: 'Carbamates (quaternaries and bisquaternaries of dimethylcarbamoyloxypyridines)', cas_number: null, category: 'Toxic chemical', notes: 'Class of compounds' },
  { cwc_schedule: '1', item_number: '16a', chemical_name: 'Carbamate variant 1', cas_number: '77104-62-2', category: 'Toxic chemical', notes: null },
  { cwc_schedule: '1', item_number: '16b', chemical_name: 'Carbamate variant 2', cas_number: '77104-00-8', category: 'Toxic chemical', notes: null },
  // B. Precursors
  { cwc_schedule: '1', item_number: '9', chemical_name: 'Alkyl (Me, Et, n-Pr or i-Pr) phosphonyldifluorides', cas_number: null, category: 'Precursor', notes: 'e.g. DF' },
  { cwc_schedule: '1', item_number: '9a', chemical_name: 'DF: Methylphosphonyldifluoride', cas_number: '676-99-3', category: 'Precursor', notes: null },
  { cwc_schedule: '1', item_number: '10', chemical_name: 'O-Alkyl (H or ≤C10, incl. cycloalkyl) O-2-dialkyl (Me, Et, n-Pr or i-Pr)-aminoethyl alkyl (Me, Et, n-Pr or i-Pr) phosphonites', cas_number: null, category: 'Precursor', notes: 'e.g. QL' },
  { cwc_schedule: '1', item_number: '10a', chemical_name: 'QL: O-Ethyl O-2-diisopropylaminoethyl methylphosphonite', cas_number: '57856-11-8', category: 'Precursor', notes: null },
  { cwc_schedule: '1', item_number: '11', chemical_name: 'Chlorosarin: O-Isopropyl methylphosphonochloridate', cas_number: '1445-76-7', category: 'Precursor', notes: null },
  { cwc_schedule: '1', item_number: '12', chemical_name: 'Chlorosoman: O-Pinacolyl methylphosphonochloridate', cas_number: '7040-57-5', category: 'Precursor', notes: null },

  // ═══ CWC SCHEDULE 2 ═══
  // A. Toxic Chemicals
  { cwc_schedule: '2', item_number: '1', chemical_name: 'Amiton: O,O-Diethyl S-[2-(diethylamino)ethyl] phosphorothiolate', cas_number: '78-53-5', category: 'Toxic chemical', notes: 'and corresponding alkylated or protonated salts' },
  { cwc_schedule: '2', item_number: '2', chemical_name: 'PFIB: 1,1,3,3,3-Pentafluoro-2-(trifluoromethyl)-1-propene', cas_number: '382-21-8', category: 'Toxic chemical', notes: null },
  { cwc_schedule: '2', item_number: '3', chemical_name: 'BZ: 3-Quinuclidinyl benzilate', cas_number: '6581-06-2', category: 'Toxic chemical', notes: null },
  // B. Precursors
  { cwc_schedule: '2', item_number: '4', chemical_name: 'Methylphosphonyl dichloride', cas_number: '676-97-1', category: 'Precursor', notes: 'Chemicals, except those listed in Schedule 1, containing a phosphorus atom bonded to one methyl, ethyl or propyl (normal or iso) group' },
  { cwc_schedule: '2', item_number: '5', chemical_name: 'Dimethyl methylphosphonate', cas_number: '756-79-6', category: 'Precursor', notes: null },
  { cwc_schedule: '2', item_number: '6', chemical_name: 'Dialkyl (Me, Et, n-Pr or i-Pr) N,N-dialkyl (Me, Et, n-Pr or i-Pr)-phosphoramidates', cas_number: null, category: 'Precursor', notes: 'Class of compounds' },
  { cwc_schedule: '2', item_number: '7', chemical_name: 'Arsenic trichloride (2,2-Diphenyl-2-hydroxyacetic acid)', cas_number: '7784-34-1', category: 'Precursor', notes: null },
  { cwc_schedule: '2', item_number: '8', chemical_name: '2,2-Diphenyl-2-hydroxyacetic acid', cas_number: '76-93-7', category: 'Precursor', notes: null },
  { cwc_schedule: '2', item_number: '9', chemical_name: 'Quinuclidin-3-ol', cas_number: '1619-34-7', category: 'Precursor', notes: null },
  { cwc_schedule: '2', item_number: '10', chemical_name: 'N,N-Dialkyl (Me, Et, n-Pr or i-Pr) aminoethyl-2-chlorides', cas_number: null, category: 'Precursor', notes: 'and corresponding protonated salts' },
  { cwc_schedule: '2', item_number: '11', chemical_name: 'N,N-Dialkyl (Me, Et, n-Pr or i-Pr) aminoethane-2-ols', cas_number: null, category: 'Precursor', notes: 'and corresponding protonated salts. Exemptions: N,N-Dimethylaminoethanol (108-01-0) and N,N-Diethylaminoethanol (100-37-8)' },
  { cwc_schedule: '2', item_number: '12', chemical_name: 'N,N-Dialkyl (Me, Et, n-Pr or i-Pr) aminoethane-2-thiols', cas_number: null, category: 'Precursor', notes: 'and corresponding protonated salts' },
  { cwc_schedule: '2', item_number: '13', chemical_name: 'Thiodiglycol: Bis(2-hydroxyethyl)sulfide', cas_number: '111-48-8', category: 'Precursor', notes: null },
  { cwc_schedule: '2', item_number: '14', chemical_name: 'Pinacolyl alcohol: 3,3-Dimethylbutan-2-ol', cas_number: '464-07-3', category: 'Precursor', notes: null },

  // ═══ CWC SCHEDULE 3 ═══
  // A. Toxic Chemicals
  { cwc_schedule: '3', item_number: '1', chemical_name: 'Phosgene: Carbonyl dichloride', cas_number: '75-44-5', category: 'Toxic chemical', notes: null },
  { cwc_schedule: '3', item_number: '2', chemical_name: 'Cyanogen chloride', cas_number: '506-77-4', category: 'Toxic chemical', notes: null },
  { cwc_schedule: '3', item_number: '3', chemical_name: 'Hydrogen cyanide', cas_number: '74-90-8', category: 'Toxic chemical', notes: null },
  { cwc_schedule: '3', item_number: '4', chemical_name: 'Chloropicrin: Trichloronitromethane', cas_number: '76-06-2', category: 'Toxic chemical', notes: null },
  // B. Precursors
  { cwc_schedule: '3', item_number: '5', chemical_name: 'Phosphorus oxychloride', cas_number: '10025-87-3', category: 'Precursor', notes: null },
  { cwc_schedule: '3', item_number: '6', chemical_name: 'Phosphorus trichloride', cas_number: '7719-12-2', category: 'Precursor', notes: null },
  { cwc_schedule: '3', item_number: '7', chemical_name: 'Phosphorus pentachloride', cas_number: '10026-13-8', category: 'Precursor', notes: null },
  { cwc_schedule: '3', item_number: '8', chemical_name: 'Trimethyl phosphite', cas_number: '121-45-9', category: 'Precursor', notes: null },
  { cwc_schedule: '3', item_number: '9', chemical_name: 'Triethyl phosphite', cas_number: '122-52-1', category: 'Precursor', notes: null },
  { cwc_schedule: '3', item_number: '10', chemical_name: 'Dimethyl phosphite', cas_number: '868-85-9', category: 'Precursor', notes: null },
  { cwc_schedule: '3', item_number: '11', chemical_name: 'Diethyl phosphite', cas_number: '762-04-9', category: 'Precursor', notes: null },
  { cwc_schedule: '3', item_number: '12', chemical_name: 'Sulfur monochloride', cas_number: '10025-67-9', category: 'Precursor', notes: null },
  { cwc_schedule: '3', item_number: '13', chemical_name: 'Sulfur dichloride', cas_number: '10545-99-0', category: 'Precursor', notes: null },
  { cwc_schedule: '3', item_number: '14', chemical_name: 'Thionyl chloride', cas_number: '7719-09-7', category: 'Precursor', notes: null },
  { cwc_schedule: '3', item_number: '15', chemical_name: 'Ethyldiethanolamine', cas_number: '139-87-7', category: 'Precursor', notes: null },
  { cwc_schedule: '3', item_number: '16', chemical_name: 'Methyldiethanolamine', cas_number: '105-59-9', category: 'Precursor', notes: null },
  { cwc_schedule: '3', item_number: '17', chemical_name: 'Triethanolamine', cas_number: '102-71-6', category: 'Precursor', notes: null },
];

const insert = db.prepare(`
  INSERT INTO chemical_index (cwc_schedule, item_number, chemical_name, cas_number, category, notes)
  VALUES (@cwc_schedule, @item_number, @chemical_name, @cas_number, @category, @notes)
`);

const insertMany = db.transaction((items: Chem[]) => {
  for (const item of items) {
    insert.run({
      cwc_schedule: item.cwc_schedule,
      item_number: item.item_number,
      chemical_name: item.chemical_name,
      cas_number: item.cas_number || null,
      category: item.category,
      notes: item.notes || null,
    });
  }
});

insertMany(chemicals);

// Create FTS index
db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS chemical_fts USING fts5(
    chemical_name,
    cas_number,
    cwc_schedule,
    category,
    notes,
    content='chemical_index',
    content_rowid='id'
  );
  INSERT INTO chemical_fts(chemical_fts) VALUES('rebuild');
`);

const count = db.prepare('SELECT COUNT(*) as cnt FROM chemical_index').get() as { cnt: number };
console.log(`Seeded ${count.cnt} chemicals into the chemical index (CWC Schedules 1-3)`);

db.close();
