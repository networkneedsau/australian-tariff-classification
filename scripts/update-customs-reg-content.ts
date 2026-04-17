import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Content descriptions for Customs Regulation 2015
const contentMap: Record<string, string> = {
  // Part 1 — Preliminary
  '1': 'Provides the formal name of the regulation: the Customs Regulation 2015. This regulation supports the operation of the Customs Act 1901.',
  '3': 'States the legislative authority under which this regulation is made, being the Customs Act 1901.',
  '4': 'Defines key terms used throughout the Customs Regulation 2015, including references to the Customs Act, tariff classifications, and other expressions used in customs procedures.',
  '5': 'Provides additional definitions that supplement the main definitions section, covering specialised terms relating to customs operations, goods classification, and regulatory processes.',
  '6': 'Defines what constitutes prohibited goods for the purposes of the Customs Act, including goods whose importation or exportation is restricted or forbidden under Australian law.',
  '7': 'Clarifies the meaning of ship and aircraft as used in the regulation, including vessels and aircraft of all types used for the carriage of goods or passengers into or out of Australia.',
  '8': 'Defines the meaning of owner in relation to goods, covering importers, exporters, consignees, and any person having a beneficial interest in goods subject to customs control.',
  '9': 'Defines what constitutes a place for customs purposes, including wharves, airports, depots, warehouses, and other locations relevant to the movement and storage of goods.',
  '10': 'Defines the meaning of document broadly to include electronic records, paper documents, and any other form of recorded information relevant to customs transactions.',

  // Part 2 — Administration
  '11': 'Prescribes the customs flag to be displayed at customs offices and other locations where customs operations are conducted.',
  '12': 'Sets out the official days and hours during which customs business may be conducted, including provisions for after-hours services and associated fees.',
  '13': 'Establishes the fee framework for customs services, including charges for processing outside normal business hours and other special services provided by the Australian Border Force.',

  // Part 3 — Customs Control, Examination and Securities
  '14': 'Prescribes approved places where goods may be prepared and packed for export, ensuring goods remain under customs control until cleared for departure from Australia.',

  // Part 4 — Importation of Goods
  '15': 'Sets out general requirements for lodging cargo reports with customs when goods arrive in Australia, including timeframes, format, and information to be included.',
  '16': 'Specifies cargo reporting requirements for air cargo, including advance reporting obligations for airlines and freight forwarders bringing goods into Australia by air.',
  '17': 'Specifies cargo reporting requirements for sea cargo, including advance reporting obligations for shipping lines bringing goods into Australia by sea.',
  '18': 'Sets out cargo reporting requirements for postal articles arriving in Australia, including thresholds and exemptions for mail items.',
  '19': 'Requires outturn reports to be lodged detailing discrepancies between cargo reported as arriving and cargo actually landed, including short-shipped and over-landed goods.',
  '20': 'Requires passenger and crew reports to be provided for arriving ships and aircraft, detailing all persons on board and their personal effects.',
  '21': 'Requires impending arrival reports to be lodged before a ship or aircraft arrives in Australia, giving customs advance notice of the conveyance and its cargo.',
  '22': 'Prescribes the specific information that must be included in various reports and declarations required under the importation provisions.',
  '23': 'Lists exemptions from cargo reporting requirements, including goods in transit, certain diplomatic consignments, and other categories not requiring standard reporting.',
  '24': 'Establishes the special reporter registration system, allowing approved entities to lodge cargo reports on behalf of carriers and freight forwarders.',

  // Division 3 — Entry, unshipment, landing and examination
  '25': 'Sets out requirements for entering goods for home consumption or warehousing, including the information required and the forms of entry available.',
  '26': 'Establishes the self-assessed clearance declaration process for low-risk consignments, allowing expedited customs clearance without full import declaration.',
  '27': 'Prescribes requirements for import declarations (previously known as Customs entries), including mandatory data elements and supporting documentation.',
  '28': 'Sets out requirements for warehouse declarations, used when imported goods are to be stored in a licensed customs warehouse before duty is paid.',
  '29': 'Covers transhipment requests for goods arriving in Australia that are destined for another country or another Australian port without entering the domestic market.',
  '30': 'Defines prescribed low-value goods thresholds below which simplified customs clearance procedures apply, reducing compliance burden for minor imports.',
  '31': 'Governs the unshipment and landing of imported goods, including requirements for moving goods from the carrying vessel to an approved place under customs control.',
  '32': 'Sets out powers and procedures for the examination of imported goods by customs officers, including circumstances requiring physical inspection.',

  // Part 5 — Depot Licences
  '33': 'Provides for the recovery of travelling expenses incurred by customs officers when attending depot premises for customs purposes.',
  '34': 'Sets out the process and conditions for transferring a depot licence from one person or entity to another.',

  // Part 6 — Warehouses
  '35': 'Prescribes conditions that apply to customs warehouse licences, including security, record-keeping, and access requirements for licensed warehouse operators.',
  '36': 'Sets out the process for renewing a customs warehouse licence, including application requirements and the criteria for renewal.',
  '37': 'Establishes the process and conditions for transferring a customs warehouse licence from one licensee to another.',
  '39': 'Provides for permission to sell goods duty free in outwards duty free shops at international departure points.',
  '40': 'Sets out how to apply for permission to operate an outwards duty free shop, including the information and documentation required.',
  '41': 'Establishes the criteria and process for granting permission to operate an outwards duty free shop.',
  '42': 'Prescribes conditions that apply to permissions to operate outwards duty free shops, including stock control and reporting obligations.',
  '43': 'Sets out general operating conditions for outwards duty free shops, including requirements for managing stock, sales records, and customer eligibility.',
  '44': 'Prescribes record-keeping requirements for outwards duty free shop operators, including transaction records and inventory management.',
  '45': 'Requires outwards duty free shop operators to submit periodic returns to customs detailing sales, stock movements, and other operational data.',
  '58': 'Sets out requirements for providing proof of export of duty free goods, ensuring goods sold duty free have actually left Australia.',
  '60': 'Provides for permission to operate inwards duty free shops at international arrival points, allowing arriving passengers to purchase duty free goods.',
  '66': 'Covers general provisions relating to warehoused goods, including movement, blending, packaging, and other operations permitted within a customs warehouse.',
  '71': 'Sets out warehouse rent provisions, including charges for goods stored in government warehouses and circumstances where rent applies.',

  // Part 7 — Cargo Terminals
  '72': 'Requires particulars of persons entering cargo terminal areas to be recorded, supporting security and access control at customs-controlled cargo facilities.',

  // Part 8 — Special Beverage Provisions
  '73': 'Defines customable beverages and sets out special provisions for the customs treatment of alcoholic and non-alcoholic beverages subject to excise-equivalent duties.',

  // Part 9 — Information About Departing Persons
  '74': 'Prescribes the kinds of ships for which passenger and crew departure information must be provided to customs.',

  // Part 10 — Exportation of Goods
  '75': 'Prescribes goods subject to military end-use export controls, restricting the export of items that could be used for military purposes in certain countries.',
  '76': 'Lists countries to which military end-use export controls apply, restricting exports of prescribed goods to these destinations without permission.',
  '77': 'Sets out how to apply for permission to export goods subject to military end-use controls, including information and assessment requirements.',
  '78': 'Establishes the criteria and process for granting permission to export military end-use controlled goods.',
  '79': 'Prescribes requirements for export declarations, including the information that must be provided when goods are entered for export from Australia.',
  '80': 'Details the specific information that must be included in export declarations, including commodity codes, values, and destination details.',
  '81': 'Lists goods that do not require an export declaration, including personal effects, low-value consignments, and other exempt categories.',
  '92': 'Sets out the process for clearing goods for export, including the conditions that must be met before goods may be loaded onto an outgoing vessel.',

  // Part 11 — Ships' Stores, Drugs, Aircraft Stores
  '93': 'Regulates ship stores provisions, covering the supply and management of stores (food, fuel, equipment) for vessels departing Australia.',
  '94': 'Addresses the transit of prohibited drugs through Australia, including controls on narcotic substances carried on vessels passing through Australian ports.',

  // Part 12 — The Duties
  '94A': 'Establishes the Australian Trusted Trader programme, providing trade facilitation benefits to accredited businesses that demonstrate secure and compliant supply chains.',
  '95': 'Sets out the classification system for alcoholic beverages for customs duty purposes, including strength thresholds and beverage categories.',
  '96': 'Defines factory costs for the purpose of calculating customs value, covering direct manufacturing expenses attributable to the production of goods.',
  '97': 'Defines factory overhead costs for customs valuation purposes, covering indirect manufacturing costs such as utilities, depreciation, and administrative expenses.',
  '98': 'Sets out rules for determining the customs value of imported goods, implementing the WTO Agreement on Customs Valuation methods.',
  '99': 'Provides for delivery of goods on security, allowing importers to take possession of goods before final duty assessment by providing an appropriate security or guarantee.',
  '102': 'Prescribes circumstances in which refunds, rebates, or remissions of customs duty may be granted, including goods re-exported, damaged, or not conforming to order.',
  '112': 'Sets out how the amount of a customs duty refund is calculated, including time limits and conditions for claiming refunds.',

  // Part 13 — Agents and Customs Brokers
  '113': 'Prescribes requirements for obtaining and holding a customs broker licence, including qualifications, character requirements, and corporate nominee provisions.',
  '114': 'Establishes continuing professional development requirements for licensed customs brokers, ensuring brokers maintain current knowledge of customs law and practice.',
  '117': 'Provides for the National Customs Brokers Licensing Advisory Committee, which advises the Comptroller-General on customs broker licensing matters.',

  // Part 14 — Officers
  '118': 'Sets out the general powers of customs officers, including authority to question persons, examine documents, and direct the movement of goods under customs control.',
  '125': 'Establishes powers for customs officers to detain and search persons suspected of carrying prohibited items or concealing dutiable goods.',

  // Part 15 — Penal Provisions
  '129': 'Sets out forfeiture provisions for goods involved in customs offences, including the circumstances under which goods become forfeit to the Crown.',
  '133': 'Establishes an infringement notice scheme as an alternative to prosecution for certain customs offences, allowing penalties to be paid without court proceedings.',

  // Part 16 — Tariff Concession Orders
  '144': 'Prescribes organisations that may object to or comment on applications for Tariff Concession Orders (TCOs), ensuring industry input into concessional duty decisions.',
  '145': 'Identifies goods excluded from the Tariff Concession Order system, including goods that are produced in Australia and goods in certain tariff classifications.',

  // Part 17 — Other Matters
  '146': 'Lists prescribed Customs-related laws for the purposes of the Customs Act, identifying other legislation that interacts with customs administration.',
  '147': 'Sets out measurement standards for liquefied petroleum gas and other gases, prescribing how quantities are determined for duty calculation purposes.',
  '148': 'Prescribes the minimum bid amount for Collector sales of forfeited, abandoned, or unclaimed goods held by customs.',
  '150': 'Sets out requirements for customs documents, including approved forms, electronic lodgement standards, and document retention obligations.',

  // Schedules
  'Schedule 1': 'Lists tariff subheadings for excise-equivalent goods and customable goods, identifying products subject to excise-equivalent customs duties such as alcohol, tobacco, and fuel.',
  'Schedule 2': 'Identifies prescribed laws for which passenger information may be accessed, allowing specified agencies to receive passenger data for law enforcement and border security purposes.',
  'Schedule 3': 'Sets out the Australian Harmonized Export Commodity Classification (AHECC) codes used for classifying goods being exported from Australia.',
  'Schedule 4': 'Prescribes the export particulars required for goods that do not need a formal export declaration, ensuring minimum reporting for exempt export consignments.',
  'Schedule 5': 'Lists factory overhead cost categories used in customs valuation calculations, providing guidance on allowable overhead expenses.',
  'Schedule 6': 'Details the specific circumstances under which duty refunds, rebates, and remissions are available, cross-referenced to the relevant provisions of the Customs Act.',
  'Schedule 7': 'Classifies goods into Tier 1 and Tier 2 categories for the purposes of the tobacco and alcohol border enforcement provisions.',
  'Schedule 8': 'Contains provisions relating to the infringement notice scheme, including penalty amounts and prescribed offences eligible for infringement notices.',
  'Schedule 9': 'Lists goods excluded from the Tariff Concession Order (TCO) system, being goods for which concessional duty rates are not available through the TCO process.',
};

const stmt = db.prepare(`UPDATE customs_regulation SET content = ? WHERE regulation_number = ? AND (content IS NULL OR content = '')`);
let updated = 0;

db.transaction(() => {
  for (const [regNum, content] of Object.entries(contentMap)) {
    const result = stmt.run(content, regNum);
    if (result.changes > 0) updated++;
  }
})();

console.log(`Updated ${updated} of 90 customs_regulation rows with content descriptions`);
db.close();
