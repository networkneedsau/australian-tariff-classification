import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Create table
db.exec(`
  DROP TABLE IF EXISTS customs_act_sections;
  CREATE TABLE customs_act_sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part TEXT NOT NULL,
    part_title TEXT NOT NULL,
    division TEXT,
    division_title TEXT,
    subdivision TEXT,
    subdivision_title TEXT,
    section_number TEXT NOT NULL,
    section_title TEXT NOT NULL
  );
  CREATE INDEX idx_act_part ON customs_act_sections(part);
  CREATE INDEX idx_act_section ON customs_act_sections(section_number);
`);

interface ActSection {
  part: string;
  part_title: string;
  division?: string;
  division_title?: string;
  subdivision?: string;
  subdivision_title?: string;
  section_number: string;
  section_title: string;
}

const sections: ActSection[] = [
  // Part I — Introductory
  { part: 'Part I', part_title: 'Introductory', section_number: '1', section_title: 'Short title' },
  { part: 'Part I', part_title: 'Introductory', section_number: '2', section_title: 'Commencement' },
  { part: 'Part I', part_title: 'Introductory', section_number: '4', section_title: 'Definitions' },
  { part: 'Part I', part_title: 'Introductory', section_number: '4AAA', section_title: 'Members of family' },
  { part: 'Part I', part_title: 'Introductory', section_number: '4AA', section_title: 'Act not to apply so as to exceed Commonwealth power' },
  { part: 'Part I', part_title: 'Introductory', section_number: '4AB', section_title: 'Compensation for acquisition of property' },
  { part: 'Part I', part_title: 'Introductory', section_number: '4A', section_title: 'Approved forms and approved statements' },
  { part: 'Part I', part_title: 'Introductory', section_number: '4B', section_title: 'What is a Customs-related law' },
  { part: 'Part I', part_title: 'Introductory', section_number: '4C', section_title: 'Identity cards' },
  { part: 'Part I', part_title: 'Introductory', section_number: '5', section_title: 'Penalties at foot of sections or subsections' },
  { part: 'Part I', part_title: 'Introductory', section_number: '5AA', section_title: 'Application of the Criminal Code' },

  // Part II — Administration
  { part: 'Part II', part_title: 'Administration', section_number: '5A', section_title: 'Attachment of overseas resources installations' },
  { part: 'Part II', part_title: 'Administration', section_number: '5B', section_title: 'Installation of overseas sea installations' },
  { part: 'Part II', part_title: 'Administration', section_number: '5BA', section_title: 'Installation of overseas offshore electricity installations' },
  { part: 'Part II', part_title: 'Administration', section_number: '5C', section_title: 'Certain installations to be part of Australia' },
  { part: 'Part II', part_title: 'Administration', section_number: '6', section_title: 'Act does not extend to external Territories' },
  { part: 'Part II', part_title: 'Administration', section_number: '7', section_title: 'General administration of Act' },
  { part: 'Part II', part_title: 'Administration', section_number: '8', section_title: 'Collectors, States and Northern Territory' },
  { part: 'Part II', part_title: 'Administration', section_number: '8A', section_title: 'Attachment of part of a State or Territory to adjoining State or Territory' },
  { part: 'Part II', part_title: 'Administration', section_number: '9', section_title: 'Delegation' },
  { part: 'Part II', part_title: 'Administration', section_number: '11', section_title: 'Arrangements with States and the Northern Territory' },
  { part: 'Part II', part_title: 'Administration', section_number: '13', section_title: 'Customs seal' },
  { part: 'Part II', part_title: 'Administration', section_number: '14', section_title: 'Flag' },
  { part: 'Part II', part_title: 'Administration', section_number: '15', section_title: 'Appointment of ports etc.' },
  { part: 'Part II', part_title: 'Administration', section_number: '19', section_title: 'Accommodation on wharfs and at airports' },
  { part: 'Part II', part_title: 'Administration', section_number: '20', section_title: 'Waterfront area control' },
  { part: 'Part II', part_title: 'Administration', section_number: '25', section_title: 'Persons before whom declarations may be made' },
  { part: 'Part II', part_title: 'Administration', section_number: '26', section_title: 'Declaration by youths' },
  { part: 'Part II', part_title: 'Administration', section_number: '28', section_title: 'Working days and hours etc.' },

  // Part III — Customs control examination and securities generally
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '30', section_title: 'Customs control of goods' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '30A', section_title: 'Exemptions under Torres Strait Treaty' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '31', section_title: 'Goods on ships and aircraft subject to customs control' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '33', section_title: 'Persons not to move goods subject to customs control' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '33A', section_title: 'Resources installations subject to customs control' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '33B', section_title: 'Sea installations subject to customs control' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '33BA', section_title: 'Offshore electricity installations subject to customs control' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '33C', section_title: 'Obstructing or interfering with Commonwealth property' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '34', section_title: 'No claim for compensation for loss' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '35', section_title: 'Goods imported by post' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '35A', section_title: 'Amount payable for failure to keep dutiable goods safely' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '36', section_title: 'Offences for failure to keep goods safely or account for goods' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '37', section_title: 'Accounting for goods' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '42', section_title: 'Right to require security' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '43', section_title: 'Form of security' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '44', section_title: 'General securities may be given' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '45', section_title: 'Cancellation of securities' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '46', section_title: 'New securities' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '47', section_title: 'Form of security' },
  { part: 'Part III', part_title: 'Customs control examination and securities generally', section_number: '48', section_title: 'Effect of security' },

  // Part IV — The importation of goods
  // Division 1A — Preliminary
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 1A', division_title: 'Preliminary', section_number: '49', section_title: 'Importation' },
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 1A', division_title: 'Preliminary', section_number: '49A', section_title: 'Ships and aircraft deemed to be imported' },
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 1A', division_title: 'Preliminary', section_number: '49B', section_title: 'Installations and goods deemed to be imported' },
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 1A', division_title: 'Preliminary', section_number: '49C', section_title: 'Obligations may be satisfied in accordance with trusted trader agreement' },
  // Division 1 — Prohibited imports
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 1', division_title: 'Prohibited imports', section_number: '50', section_title: 'Prohibition of the importation of goods' },
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 1', division_title: 'Prohibited imports', section_number: '51', section_title: 'Prohibited imports' },
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 1', division_title: 'Prohibited imports', section_number: '51A', section_title: 'Certain controlled substances taken to be prohibited imports' },
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 1', division_title: 'Prohibited imports', section_number: '52', section_title: 'Invalidation of licence, permission etc. for false information' },
  // Division 2 — Boarding of ships and aircraft
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 2', division_title: 'The boarding of ships and aircraft', section_number: '58', section_title: 'Ships and aircraft to enter ports or airports' },
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 2', division_title: 'The boarding of ships and aircraft', section_number: '58A', section_title: 'Direct journeys between installations and external places prohibited' },
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 2', division_title: 'The boarding of ships and aircraft', section_number: '58B', section_title: 'Direct journeys between certain resources installations prohibited' },
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 2', division_title: 'The boarding of ships and aircraft', section_number: '60', section_title: 'Boarding stations' },
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 2', division_title: 'The boarding of ships and aircraft', section_number: '61', section_title: 'Facility for boarding' },
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 2', division_title: 'The boarding of ships and aircraft', section_number: '61A', section_title: 'Owner or operator of port to facilitate boarding' },
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 2', division_title: 'The boarding of ships and aircraft', section_number: '62', section_title: 'Ships to come quickly to place of unlading' },
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 2', division_title: 'The boarding of ships and aircraft', section_number: '63', section_title: 'Ship or aircraft not to be moved without authority' },
  // Division 5 — Detention of goods in the public interest
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 5', division_title: 'Detention of goods in the public interest', section_number: '77EA', section_title: 'Minister may order goods to be detained' },
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 5', division_title: 'Detention of goods in the public interest', section_number: '77EB', section_title: 'Notice to person whose goods are detained' },
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 5', division_title: 'Detention of goods in the public interest', section_number: '77EC', section_title: 'Detention of goods by Collector' },
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 5', division_title: 'Detention of goods in the public interest', section_number: '77ED', section_title: 'Minister may authorise delivery into home consumption' },
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 5', division_title: 'Detention of goods in the public interest', section_number: '77EE', section_title: 'Minister may authorise export of detained goods' },
  { part: 'Part IV', part_title: 'The importation of goods', division: 'Division 5', division_title: 'Detention of goods in the public interest', section_number: '77EF', section_title: 'When goods have been detained for 12 months' },

  // Part IVA — Depots
  { part: 'Part IVA', part_title: 'Depots', section_number: '77F', section_title: 'Interpretation' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77G', section_title: 'Depot licences' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77H', section_title: 'Application for a depot licence' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77J', section_title: 'Comptroller-General may require further information' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77K', section_title: 'Requirements for grant of depot licence' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77L', section_title: 'Granting of a depot licence' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77LA', section_title: 'Variation of places covered by depot licence' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77N', section_title: 'Conditions of a depot licence—general' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77P', section_title: 'Conditions of a depot licence—imported goods' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77Q', section_title: 'Comptroller-General may impose additional conditions' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77R', section_title: 'Breach of conditions of depot licence' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77S', section_title: 'Duration of depot licences' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77T', section_title: 'Renewal of depot licences' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77U', section_title: 'Licence charges' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77V', section_title: 'Notice of intended cancellation etc.' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77VA', section_title: 'Depot must not be used if licence suspended' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77VB', section_title: 'Revocation of suspension of depot licences' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77VC', section_title: 'Cancellation of depot licences' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77W', section_title: 'Refund of depot licence charge on cancellation' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77X', section_title: "Collector's powers where place no longer a depot" },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77Y', section_title: 'Collector may give directions in relation to depot' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77Z', section_title: 'Licences cannot be transferred' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77ZAA', section_title: 'Access to depots' },
  { part: 'Part IVA', part_title: 'Depots', section_number: '77ZA', section_title: 'Giving of notices' },

  // Part V — Warehouses (key sections)
  { part: 'Part V', part_title: 'Warehouses', section_number: '78', section_title: 'Interpretation' },
  { part: 'Part V', part_title: 'Warehouses', section_number: '79', section_title: 'Warehouse licences' },
  { part: 'Part V', part_title: 'Warehouses', section_number: '80', section_title: 'Application for a warehouse licence' },
  { part: 'Part V', part_title: 'Warehouses', section_number: '81', section_title: 'Requirements for grant of warehouse licence' },
  { part: 'Part V', part_title: 'Warehouses', section_number: '81A', section_title: 'Grant of a warehouse licence' },
  { part: 'Part V', part_title: 'Warehouses', section_number: '82', section_title: 'Conditions of a warehouse licence—general' },
  { part: 'Part V', part_title: 'Warehouses', section_number: '83', section_title: 'Duration of warehouse licence' },
  { part: 'Part V', part_title: 'Warehouses', section_number: '84', section_title: 'Renewal of warehouse licences' },
  { part: 'Part V', part_title: 'Warehouses', section_number: '85', section_title: 'Licence charges' },
  { part: 'Part V', part_title: 'Warehouses', section_number: '86', section_title: 'Suspension of warehouse licences' },
  { part: 'Part V', part_title: 'Warehouses', section_number: '87', section_title: 'Cancellation of warehouse licences' },
  { part: 'Part V', part_title: 'Warehouses', section_number: '90', section_title: 'Obligations of holders of warehouse licences' },
  { part: 'Part V', part_title: 'Warehouses', section_number: '91', section_title: 'Access to warehouses' },
  { part: 'Part V', part_title: 'Warehouses', section_number: '96A', section_title: 'Outwards duty free shops' },
  { part: 'Part V', part_title: 'Warehouses', section_number: '96B', section_title: 'Inwards duty free shops' },
  { part: 'Part V', part_title: 'Warehouses', section_number: '99', section_title: 'Entry of warehoused goods' },

  // Part VAAA — Cargo terminals
  { part: 'Part VAAA', part_title: 'Cargo terminals', division: 'Division 1', division_title: 'Preliminary', section_number: '102B', section_title: 'Definitions' },
  { part: 'Part VAAA', part_title: 'Cargo terminals', division: 'Division 1', division_title: 'Preliminary', section_number: '102BA', section_title: 'Meaning of fit and proper person' },
  { part: 'Part VAAA', part_title: 'Cargo terminals', division: 'Division 2', division_title: 'Obligations of cargo terminal operators', section_number: '102C', section_title: 'Notifying Department of cargo terminal' },
  { part: 'Part VAAA', part_title: 'Cargo terminals', division: 'Division 2', division_title: 'Obligations of cargo terminal operators', section_number: '102CA', section_title: 'Physical security of cargo terminal and goods' },
  { part: 'Part VAAA', part_title: 'Cargo terminals', division: 'Division 2', division_title: 'Obligations of cargo terminal operators', section_number: '102CE', section_title: 'Record keeping requirements' },
  { part: 'Part VAAA', part_title: 'Cargo terminals', division: 'Division 3', division_title: 'Obligations of cargo handlers', section_number: '102D', section_title: 'Certain provisions of Division 2 apply' },
  { part: 'Part VAAA', part_title: 'Cargo terminals', division: 'Division 4', division_title: 'Powers of authorised officers', section_number: '102E', section_title: 'General powers' },
  { part: 'Part VAAA', part_title: 'Cargo terminals', division: 'Division 5', division_title: 'Directions to cargo terminal operators or cargo handlers', section_number: '102F', section_title: 'Directions to cargo terminal operators or cargo handlers etc.' },

  // Part VA — Special provisions relating to beverages
  { part: 'Part VA', part_title: 'Special provisions relating to beverages', section_number: '103', section_title: 'Interpretation' },
  { part: 'Part VA', part_title: 'Special provisions relating to beverages', section_number: '104', section_title: 'Customable beverage imported in bulk must be entered for warehousing' },
  { part: 'Part VA', part_title: 'Special provisions relating to beverages', section_number: '105', section_title: 'Certain customable beverage not to be entered for home consumption in bulk containers without approval' },
  { part: 'Part VA', part_title: 'Special provisions relating to beverages', section_number: '105A', section_title: 'Delivery from customs control of brandy, whisky or rum' },

  // Part VAA — Special provisions relating to excise-equivalent goods
  { part: 'Part VAA', part_title: 'Special provisions relating to excise-equivalent goods', section_number: '105B', section_title: 'Extinguishment of duty on excise-equivalent goods' },
  { part: 'Part VAA', part_title: 'Special provisions relating to excise-equivalent goods', section_number: '105C', section_title: 'Returns' },
  { part: 'Part VAA', part_title: 'Special provisions relating to excise-equivalent goods', section_number: '105D', section_title: 'GST matters' },
  { part: 'Part VAA', part_title: 'Special provisions relating to excise-equivalent goods', section_number: '105E', section_title: 'Use of excise-equivalent goods in the manufacture of excisable goods' },

  // Part VB — Information about persons departing Australia
  { part: 'Part VB', part_title: 'Information about persons departing Australia', division: 'Division 1', division_title: 'Reports on departing persons', section_number: '106A', section_title: 'Ships and aircraft to which this Subdivision applies' },
  { part: 'Part VB', part_title: 'Information about persons departing Australia', division: 'Division 1', division_title: 'Reports on departing persons', section_number: '106B', section_title: 'Report 48 hours before ship or aircraft is due to depart' },
  { part: 'Part VB', part_title: 'Information about persons departing Australia', division: 'Division 1', division_title: 'Reports on departing persons', section_number: '106C', section_title: 'Report 4 hours before ship or aircraft is due to depart' },
  { part: 'Part VB', part_title: 'Information about persons departing Australia', division: 'Division 1', division_title: 'Reports on departing persons', section_number: '106G', section_title: 'Reports to be made electronically' },
  { part: 'Part VB', part_title: 'Information about persons departing Australia', division: 'Division 2', division_title: 'Questions about departing persons', section_number: '106J', section_title: 'Officers may question operators about departing persons' },

  // Part VI — The exportation of goods
  { part: 'Part VI', part_title: 'The exportation of goods', division: 'Division 1', division_title: 'Prohibited exports', section_number: '112', section_title: 'Prohibited exports' },
  { part: 'Part VI', part_title: 'The exportation of goods', division: 'Division 1', division_title: 'Prohibited exports', section_number: '112A', section_title: 'Certain controlled substances taken to be prohibited exports' },
  { part: 'Part VI', part_title: 'The exportation of goods', division: 'Division 2', division_title: 'Entry and export declarations', section_number: '113', section_title: 'Entry of goods for export' },
  { part: 'Part VI', part_title: 'The exportation of goods', division: 'Division 2', division_title: 'Entry and export declarations', section_number: '114', section_title: 'Making an export declaration' },
  { part: 'Part VI', part_title: 'The exportation of goods', division: 'Division 2', division_title: 'Entry and export declarations', section_number: '114C', section_title: 'Authority to deal with goods entered for export' },
  { part: 'Part VI', part_title: 'The exportation of goods', division: 'Division 3', division_title: 'Dealing with goods for export', section_number: '115', section_title: 'Goods not to be taken on board without authority to deal' },
  { part: 'Part VI', part_title: 'The exportation of goods', division: 'Division 4', division_title: 'Manifests and Certificates of Clearance', section_number: '118', section_title: 'Certificate of Clearance' },
  { part: 'Part VI', part_title: 'The exportation of goods', division: 'Division 4', division_title: 'Manifests and Certificates of Clearance', section_number: '119', section_title: 'Communication of outward manifest to Department' },
  { part: 'Part VI', part_title: 'The exportation of goods', division: 'Division 6', division_title: 'Examination of goods for export', section_number: '122F', section_title: 'Object of Division' },
  { part: 'Part VI', part_title: 'The exportation of goods', division: 'Division 6', division_title: 'Examination of goods for export', section_number: '122K', section_title: 'Power to search premises for export goods' },
  { part: 'Part VI', part_title: 'The exportation of goods', division: 'Division 7', division_title: 'Boarding and examination of ships and aircraft', section_number: '123', section_title: 'Ship to bring to and aircraft to stop at boarding stations' },
  { part: 'Part VI', part_title: 'The exportation of goods', division: 'Division 7', division_title: 'Boarding and examination of ships and aircraft', section_number: '125', section_title: 'Goods exported to be landed at proper destination' },
  { part: 'Part VI', part_title: 'The exportation of goods', division: 'Division 7', division_title: 'Boarding and examination of ships and aircraft', section_number: '126', section_title: 'Certificate of landing' },
  { part: 'Part VI', part_title: 'The exportation of goods', division: 'Division 7', division_title: 'Boarding and examination of ships and aircraft', section_number: '126C', section_title: 'Size of exporting vessel' },

  // Part VIA — Electronic communications
  { part: 'Part VIA', part_title: 'Electronic communications', section_number: '126DA', section_title: 'Electronic communications' },

  // Part VII — Ships' stores and aircraft's stores
  { part: 'Part VII', part_title: "Ships' stores and aircraft's stores", section_number: '127', section_title: "Use of ships' and aircraft's stores" },
  { part: 'Part VII', part_title: "Ships' stores and aircraft's stores", section_number: '128', section_title: "Unshipment of ships' and aircraft's stores" },
  { part: 'Part VII', part_title: "Ships' stores and aircraft's stores", section_number: '129', section_title: "Ships' and aircraft's stores not to be taken on board without approval" },
  { part: 'Part VII', part_title: "Ships' stores and aircraft's stores", section_number: '130', section_title: "Ship's and aircraft's stores exempt from duty" },
  { part: 'Part VII', part_title: "Ships' stores and aircraft's stores", section_number: '130C', section_title: 'Interpretation' },

  // Part VIII — The duties
  { part: 'Part VIII', part_title: 'The duties', section_number: '131A', section_title: 'Fish caught by Australian ships' },
  { part: 'Part VIII', part_title: 'The duties', section_number: '131AA', section_title: 'No duty on goods for Timor Sea petroleum activities purpose' },
  { part: 'Part VIII', part_title: 'The duties', section_number: '131B', section_title: 'Liability of Commonwealth authorities to pay duties of Customs' },
  { part: 'Part VIII', part_title: 'The duties', section_number: '132', section_title: 'Rate of import duty' },
  { part: 'Part VIII', part_title: 'The duties', section_number: '132AA', section_title: 'When import duty must be paid' },
  { part: 'Part VIII', part_title: 'The duties', section_number: '132A', section_title: 'Prepayment of duty' },
  { part: 'Part VIII', part_title: 'The duties', section_number: '132B', section_title: 'Declared period quotas—effect on rates of import duty' },
  { part: 'Part VIII', part_title: 'The duties', section_number: '133', section_title: 'Export duties' },
  { part: 'Part VIII', part_title: 'The duties', section_number: '134', section_title: 'Weights and measures' },
  { part: 'Part VIII', part_title: 'The duties', section_number: '136', section_title: 'Manner of fixing duty' },
  { part: 'Part VIII', part_title: 'The duties', section_number: '148', section_title: 'Derelict goods dutiable' },
  { part: 'Part VIII', part_title: 'The duties', section_number: '150', section_title: 'Samples' },
  { part: 'Part VIII', part_title: 'The duties', section_number: '154', section_title: 'Valuation of imported goods' },
  { part: 'Part VIII', part_title: 'The duties', section_number: '161L', section_title: 'Valuation provisions' },
  { part: 'Part VIII', part_title: 'The duties', section_number: '162', section_title: 'Payment and recovery of deposits' },
  { part: 'Part VIII', part_title: 'The duties', section_number: '163', section_title: 'Refunds' },
  { part: 'Part VIII', part_title: 'The duties', section_number: '165', section_title: 'Recovery of unpaid duty' },
  { part: 'Part VIII', part_title: 'The duties', section_number: '167', section_title: 'Payments under protest' },

  // Part IX — Drawbacks
  { part: 'Part IX', part_title: 'Drawbacks', section_number: '168', section_title: 'Drawbacks of import duty' },

  // Part X — The coasting trade
  { part: 'Part X', part_title: 'The coasting trade', section_number: '175', section_title: 'Goods not to be transferred between certain vessels' },

  // Part XA — Australian Trusted Trader Programme
  { part: 'Part XA', part_title: 'Australian Trusted Trader Programme', section_number: '176', section_title: 'Establishment of the Australian Trusted Trader Programme' },
  { part: 'Part XA', part_title: 'Australian Trusted Trader Programme', section_number: '176A', section_title: 'Trusted trader agreement may be entered into' },
  { part: 'Part XA', part_title: 'Australian Trusted Trader Programme', section_number: '176B', section_title: 'Nomination process' },
  { part: 'Part XA', part_title: 'Australian Trusted Trader Programme', section_number: '178', section_title: 'Terms and conditions of trusted trader agreements' },
  { part: 'Part XA', part_title: 'Australian Trusted Trader Programme', section_number: '178A', section_title: 'Variation, suspension or termination of trusted trader agreements' },
  { part: 'Part XA', part_title: 'Australian Trusted Trader Programme', section_number: '179', section_title: 'Rules' },

  // Part XI — Agents and customs brokers
  { part: 'Part XI', part_title: 'Agents and customs brokers', section_number: '180', section_title: 'Interpretation' },
  { part: 'Part XI', part_title: 'Agents and customs brokers', section_number: '181', section_title: 'Authorised agents' },
  { part: 'Part XI', part_title: 'Agents and customs brokers', section_number: '183', section_title: 'Agents personally liable' },
  { part: 'Part XI', part_title: 'Agents and customs brokers', section_number: '183C', section_title: 'Grant of licence' },
  { part: 'Part XI', part_title: 'Agents and customs brokers', section_number: '183CG', section_title: 'Licence granted subject to conditions' },
  { part: 'Part XI', part_title: 'Agents and customs brokers', section_number: '183CH', section_title: 'Duration of licence' },
  { part: 'Part XI', part_title: 'Agents and customs brokers', section_number: '183CJ', section_title: 'Renewal of licence' },
  { part: 'Part XI', part_title: 'Agents and customs brokers', section_number: '183D', section_title: 'National Customs Brokers Licensing Advisory Committee' },

  // Part XII — Officers
  { part: 'Part XII', part_title: 'Officers', division: 'Division 1', division_title: 'Powers of Officers', section_number: '186', section_title: 'General powers of examination of goods subject to customs control' },
  { part: 'Part XII', part_title: 'Officers', division: 'Division 1', division_title: 'Powers of Officers', section_number: '187', section_title: 'Power to board and search' },
  { part: 'Part XII', part_title: 'Officers', division: 'Division 1', division_title: 'Powers of Officers', section_number: '195', section_title: 'Power to question passengers etc.' },
  { part: 'Part XII', part_title: 'Officers', division: 'Division 1', division_title: 'Powers of Officers', section_number: '197', section_title: 'Power to stop conveyances about to leave a Customs place' },
  { part: 'Part XII', part_title: 'Officers', division: 'Division 1', division_title: 'Powers of Officers', section_number: '198', section_title: 'When search warrants relating to premises can be issued' },
  { part: 'Part XII', part_title: 'Officers', division: 'Division 1', division_title: 'Powers of Officers', section_number: '203', section_title: 'When seizure warrants for forfeited goods can be issued' },
  { part: 'Part XII', part_title: 'Officers', division: 'Division 1', division_title: 'Powers of Officers', section_number: '203B', section_title: 'Seizure without warrant of special forfeited goods' },
  { part: 'Part XII', part_title: 'Officers', division: 'Division 1', division_title: 'Powers of Officers', section_number: '204', section_title: 'Seized goods to be secured' },
  { part: 'Part XII', part_title: 'Officers', division: 'Division 1', division_title: 'Powers of Officers', section_number: '205', section_title: 'Requirement to serve seizure notices' },
  { part: 'Part XII', part_title: 'Officers', division: 'Division 1', division_title: 'Powers of Officers', section_number: '210', section_title: 'Power of arrest without warrant' },
  { part: 'Part XII', part_title: 'Officers', division: 'Division 2', division_title: 'Protection to Officers', section_number: '220', section_title: 'Reasonable cause for seizure a bar to action' },
  { part: 'Part XII', part_title: 'Officers', division: 'Division 3', division_title: 'Evidence', section_number: '227AA', section_title: 'Evidence may be used in prosecutions etc.' },

  // Part XIIA — Special provisions relating to prohibited items
  { part: 'Part XIIA', part_title: 'Special provisions relating to prohibited items', section_number: '227A', section_title: 'Overview of Part' },
  { part: 'Part XIIA', part_title: 'Special provisions relating to prohibited items', section_number: '227B', section_title: 'Definitions' },
  { part: 'Part XIIA', part_title: 'Special provisions relating to prohibited items', section_number: '227E', section_title: 'Approved storage for prohibited items' },
  { part: 'Part XIIA', part_title: 'Special provisions relating to prohibited items', section_number: '227F', section_title: 'Officer may take custody of items' },

  // Part XIII — Penal provisions
  { part: 'Part XIII', part_title: 'Penal provisions', division: 'Division 1', division_title: 'Forfeitures', section_number: '228', section_title: 'Forfeited ships and aircraft' },
  { part: 'Part XIII', part_title: 'Penal provisions', division: 'Division 1', division_title: 'Forfeitures', section_number: '229', section_title: 'Forfeited goods' },
  { part: 'Part XIII', part_title: 'Penal provisions', division: 'Division 1', division_title: 'Forfeitures', section_number: '230', section_title: 'Forfeited packages and goods' },
  { part: 'Part XIII', part_title: 'Penal provisions', division: 'Division 2', division_title: 'Penalties', section_number: '233', section_title: 'Smuggling and unlawful importation and exportation' },
  { part: 'Part XIII', part_title: 'Penal provisions', division: 'Division 2', division_title: 'Penalties', section_number: '233BAA', section_title: 'Special offence relating to tier 1 goods' },
  { part: 'Part XIII', part_title: 'Penal provisions', division: 'Division 2', division_title: 'Penalties', section_number: '234', section_title: 'Customs offences' },
  { part: 'Part XIII', part_title: 'Penal provisions', division: 'Division 2', division_title: 'Penalties', section_number: '240', section_title: 'Commercial documents to be kept' },
  { part: 'Part XIII', part_title: 'Penal provisions', division: 'Division 4', division_title: 'Provisions relating to certain strict liability offences', section_number: '243T', section_title: 'False or misleading statements resulting in loss of duty' },
  { part: 'Part XIII', part_title: 'Penal provisions', division: 'Division 4', division_title: 'Provisions relating to certain strict liability offences', section_number: '243U', section_title: 'False or misleading statements not resulting in loss of duty' },
  { part: 'Part XIII', part_title: 'Penal provisions', division: 'Division 5', division_title: 'Infringement notices', section_number: '243X', section_title: 'Infringement notices—general' },
];

const insert = db.prepare(`
  INSERT INTO customs_act_sections (part, part_title, division, division_title, subdivision, subdivision_title, section_number, section_title)
  VALUES (@part, @part_title, @division, @division_title, @subdivision, @subdivision_title, @section_number, @section_title)
`);

const insertMany = db.transaction((items: ActSection[]) => {
  for (const item of items) {
    insert.run({
      part: item.part,
      part_title: item.part_title,
      division: item.division || null,
      division_title: item.division_title || null,
      subdivision: item.subdivision || null,
      subdivision_title: item.subdivision_title || null,
      section_number: item.section_number,
      section_title: item.section_title,
    });
  }
});

insertMany(sections);

// Create FTS index
db.exec(`
  CREATE VIRTUAL TABLE IF NOT EXISTS customs_act_fts USING fts5(
    section_number,
    section_title,
    part,
    part_title,
    division_title,
    content='customs_act_sections',
    content_rowid='id'
  );
  INSERT INTO customs_act_fts(customs_act_fts) VALUES('rebuild');
`);

const count = db.prepare('SELECT COUNT(*) as cnt FROM customs_act_sections').get() as { cnt: number };
console.log(`Seeded ${count.cnt} sections of the Customs Act 1901`);

db.close();
