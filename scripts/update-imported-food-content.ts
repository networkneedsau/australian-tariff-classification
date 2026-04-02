import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Content descriptions for Imported Food Control Act 1992
const actContent: Record<string, string> = {
  '1': 'Provides the short title of the Act: the Imported Food Control Act 1992.',
  '2': 'Sets out the commencement provisions for the Act.',
  '2A': 'States the object of the Act, which is to provide for the inspection and control of food imported into Australia to ensure it meets Australian food safety standards.',
  '3': 'Defines key terms used throughout the Act, including examinable food, failing food, food control certificate, holding order, and imported food inspection advice.',
  '4': 'Extends the application of the Act to certain external Territories of Australia.',
  '5': 'States that the Crown in each of its capacities is bound by the Act.',
  '6': 'Provides that the Act does not affect the operation of other Commonwealth, State, or Territory laws relating to food safety.',
  '6A': 'Applies the Criminal Code to offences under the Act, incorporating general principles of criminal responsibility.',
  '7': 'Defines the food to which the Act applies, including all food imported for sale in Australia and food that may pose a risk to public health.',

  // Part 2 — Control
  '8': 'Creates an offence for importing food that does not comply with Australian food standards, including food that is adulterated, contaminated, or otherwise unfit for human consumption.',
  '8A': 'Creates an offence for importing food that is not correctly labelled in accordance with Australian food labelling requirements.',
  '9': 'Creates offences for dealing with examinable food (food selected for inspection) before it has been cleared, including selling, moving, or altering food under examination.',
  '10': 'Provides that certain provisions of the Customs Act 1901 may be expressed to be subject to this Act, ensuring coordination between customs and food safety controls.',
  '11': 'Sets out the requirements for applying for a food control certificate, which is needed to bring certain categories of food into the Australian market.',
  '12': 'Establishes the conditions under which a food control certificate is issued, including that the food has passed inspection or is exempt from inspection.',
  '13': 'Prescribes the form and content of food control certificates.',
  '14': 'Provides for imported food inspection advice to be given by authorised officers, directing food for inspection or clearing it for release.',
  '15': 'Empowers authorised officers to make holding orders for food that may pose a risk to public health, preventing the food from being released until it has been examined.',

  // Division 2 — The Food Inspection Scheme
  '16': 'Establishes the Food Inspection Scheme, which sets out the framework for inspecting imported food, including risk-based inspection rates and categories of food.',
  '17': 'Requires consultation with Food Standards Australia New Zealand (FSANZ) on matters relating to the Food Inspection Scheme, ensuring food safety expertise informs inspection decisions.',
  '18': 'Provides for foreign government certificates to be recognised for the purposes of the Food Inspection Scheme, allowing reduced inspection rates for food from countries with equivalent food safety systems.',
  '19': 'Provides for quality assurance certificates issued by approved bodies, which may qualify food for reduced inspection rates under the Scheme.',
  '19A': 'Creates offences for forging or uttering false food safety certificates, including foreign government certificates and quality assurance certificates.',

  // Division 3 — Treatment, destruction or re-exportation
  '20': 'Sets out the requirements for dealing with food that fails inspection (failing food), including options for treatment, destruction, or re-exportation at the importer\'s expense.',

  // Part 3 — Enforcement
  '21': 'Establishes monitoring powers for authorised officers, including powers to enter premises and inspect food, records, and equipment used in food handling.',
  '22': 'Establishes investigation powers for authorised officers to investigate suspected contraventions of the Act.',
  '23': 'Sets out the civil penalty framework for contraventions of the Act.',
  '24': 'Provides for infringement notices for certain less serious contraventions.',
  '25': 'Establishes the enforceable undertakings framework for the Act.',
  '26': 'Provides for injunctions to prevent or restrain contraventions of the Act.',
  '27': 'Provides for the forfeiture of food that contravenes the Act, including food imported without required certificates or food that fails inspection.',
  '28': 'Addresses the liability of directors, employees, and agents for offences committed by corporations under the Act.',
  '29': 'Sets out evidentiary provisions for the certificate of an analyst regarding the condition or composition of food samples.',
  '30': 'Empowers the Secretary to publish the names of persons who have been convicted of offences or found to have contravened civil penalty provisions under the Act.',

  // Part 4 — Miscellaneous
  '35A': 'Provides for compliance agreements between importers and the Department, allowing tailored arrangements for managing food safety compliance.',
  '36': 'Establishes the framework for fees payable for inspections, analyses, and other services under the Act.',
  '37': 'Provides for the recovery of expenses incurred by the Commonwealth in dealing with food that fails inspection, including treatment, storage, and destruction costs.',
  '38': 'Provides exemption from civil suit for authorised officers and other persons acting in good faith under the Act.',
  '39': 'Provides for compensation where acquisition of property occurs under the Act, as required by the Constitution.',
  '40': 'Provides for the appointment of authorised officers to exercise powers under the Act.',
  '41': 'Provides for the delegation of the Secretary\'s powers and functions under the Act.',
  '42': 'Establishes the process for review of decisions made under the Act, including internal review and review by the Administrative Appeals Tribunal.',
  '43': 'Provides for the making of regulations to give effect to the Act.',
};

// Content descriptions for Imported Food Control Regulation 2019
const regContent: Record<string, string> = {
  '1': 'Provides the formal name of the regulation: the Imported Food Control Regulation 2019.',
  '3': 'States the legislative authority under which this regulation is made.',
  '5': 'Defines key terms used in the Regulation, including risk food, surveillance food, compliance agreement food, and other categories relevant to the Food Inspection Scheme.',
  '6': 'Identifies food from New Zealand to which the Act does not apply, reflecting the joint food standards framework between Australia and New Zealand.',
  '7': 'Identifies food imported for private consumption (not for sale) to which the Act does not apply, including personal-use quantities brought in by travellers.',
  '8': 'Prescribes the requirements for applying for a food control certificate, including the information and documentation that must be provided.',
  '9': 'Establishes the Food Inspection Scheme as the operational framework for inspecting imported food at the border.',
  '10': 'Empowers the Minister to make orders prescribing food categories, inspection rates, and related matters under the Food Inspection Scheme.',
  '11': 'Defines risk food, being food that poses an identified risk to public health and is subject to mandatory inspection at prescribed rates.',
  '12': 'Defines compliance agreement food, being food imported under a compliance agreement that may qualify for reduced inspection rates.',
  '13': 'Defines surveillance food, being food subject to random inspection to monitor ongoing compliance with food safety standards.',
  '14': 'Sets out how customs officers refer risk food for inspection under the Food Inspection Scheme.',
  '15': 'Sets out how customs officers refer surveillance food for inspection under the Food Inspection Scheme.',
  '16': 'Prescribes the rates at which risk food must be inspected, based on the risk category and the importer\'s compliance history.',
  '17': 'Sets out the initial rate at which risk food is inspected when first imported or when a new risk is identified.',
  '18': 'Establishes the conditions under which the rate of inspection for risk food may be varied, including reduction for good compliance or increase for failures.',
  '19': 'Sets out requirements for holding risk food that is subject to inspection, including storage conditions and access for authorised officers.',
  '20': 'Provides for testing the reliability of recognised foreign government certificates and quality assurance certificates through verification inspections.',
  '21': 'Prescribes inspection rates for surveillance food, which is subject to random inspection to monitor compliance.',
  '22': 'Prescribes inspection rates for food that is the subject of a holding order, typically requiring 100% inspection until the risk is resolved.',
  '23': 'Sets out procedures for taking samples of food for inspection and analysis, including sample size and handling requirements.',
  '24': 'Prescribes requirements for marking food that is being held for inspection, ensuring it is identifiable and not released prematurely.',
  '25': 'Sets out how analysis of food samples is to be conducted, including approved methods and the role of accredited laboratories.',
  '26': 'Defines when food is failing food, being food that does not meet the applicable Australian food standard or poses a risk to public health.',
  '27': 'Sets out how failing food must be dealt with when it is part of a larger lot, including whether the entire lot or only the failed portion must be treated.',
  '28': 'Provides for presenting failing food for inspection again after treatment, allowing importers to have treated food re-assessed for compliance.',
  '29': 'Prescribes the powers of authorised officers under the Food Inspection Scheme, including powers to inspect, sample, and direct the handling of food.',
  '30': 'Establishes payable amounts for chargeable services under the Act, including inspection fees, analysis charges, and other cost-recovery amounts.',
  '30A': 'Provides for the indexation of charges to keep pace with cost increases over time.',
  '31': 'Provides for reimbursement of amounts paid for food analysis where the food is subsequently found to comply with food safety standards.',
  '32': 'Establishes the conditions under which payable amounts may be waived, such as hardship or administrative error.',
  '33': 'Prescribes chargeable services for cost recovery purposes.',
  '34': 'Contains transitional provisions for Ministerial orders made under previous regulations.',
  '35': 'Contains transitional provisions preserving the effect of things done under the old Imported Food Control Regulations 1993.',
};

const actStmt = db.prepare(`UPDATE imported_food_act SET content = ? WHERE section_number = ? AND (content IS NULL OR content = '')`);
const regStmt = db.prepare(`UPDATE imported_food_reg SET content = ? WHERE regulation_number = ? AND (content IS NULL OR content = '')`);

let actUpdated = 0;
let regUpdated = 0;

db.transaction(() => {
  for (const [secNum, content] of Object.entries(actContent)) {
    const result = actStmt.run(content, secNum);
    if (result.changes > 0) actUpdated++;
  }
  for (const [regNum, content] of Object.entries(regContent)) {
    const result = regStmt.run(content, regNum);
    if (result.changes > 0) regUpdated++;
  }
})();

console.log(`Updated ${actUpdated} of 43 imported_food_act rows with content descriptions`);
console.log(`Updated ${regUpdated} of 34 imported_food_reg rows with content descriptions`);
db.close();
