import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Content descriptions for Illegal Logging Prohibition Act 2012
const actContent: Record<string, string> = {
  '1': 'Provides the short title of the Act: the Illegal Logging Prohibition Act 2012.',
  '2': 'Sets out the commencement provisions for the Act and its various amendments.',
  '3': 'States that the Crown in each of its capacities is bound by the Act.',
  '4': 'States that the Act does not extend to external Territories of Australia.',
  '5': 'Provides that the Act is not intended to exclude the concurrent operation of State and Territory laws dealing with illegal logging.',
  '6': 'Provides a simplified outline of the Act, summarising its key provisions for prohibiting the importation of illegally logged timber and timber products.',
  '7': 'Defines key terms used throughout the Act, including illegally logged, raw log, regulated timber product, timber, and timber legality framework.',

  // Part 2 — Importing
  '7A': 'Provides a simplified outline of Part 2, which deals with importing illegally logged timber and the due diligence requirements for importers.',
  '8': 'Creates a criminal offence for intentionally importing timber that was illegally logged in the country of harvest. Penalties apply for knowingly importing timber harvested in contravention of the laws of the country of origin.',
  '9': 'Creates a criminal offence for importing regulated timber products that contain illegally logged timber. This extends the prohibition to manufactured products containing illegal timber.',
  '10': 'Provides for the forfeiture of timber or timber products that have been imported in contravention of the illegal logging prohibitions.',
  '11': 'Applies relevant provisions of the Customs Act 1901 to the forfeiture and seizure of illegally imported timber products.',
  '12': 'Creates offences and civil penalties for importing regulated timber products without conducting due diligence to assess the risk that the products contain illegally logged timber.',
  '13': 'Requires importers to include a customs declaration when importing regulated timber products, declaring compliance with due diligence requirements.',
  '13A': 'Establishes the due diligence system requirement, requiring importers to have and comply with a due diligence system that includes information gathering, risk assessment, and risk mitigation.',
  '14': 'Allows additional due diligence requirements to be prescribed by rules, providing flexibility to adapt requirements to changing circumstances.',

  // Part 3 — Processing
  '14A': 'Provides a simplified outline of Part 3, which deals with processing illegally logged raw logs and the due diligence requirements for processors.',
  '15': 'Creates a criminal offence for processing raw logs that were illegally logged, applying to domestic timber processors.',
  '16': 'Provides for the forfeiture of illegally logged raw logs and products made from them.',
  '17': 'Creates offences and civil penalties for processing raw logs without conducting due diligence to assess the risk that the logs were illegally harvested.',
  '17A': 'Establishes the due diligence system requirement for processors, requiring them to have and comply with a due diligence system for assessing the legality of raw logs.',
  '18': 'Allows additional due diligence requirements for processors to be prescribed by rules.',

  // Part 3A — Notice requirements
  '18A': 'Provides a simplified outline of Part 3A, dealing with notice requirements for regulated timber products and processing of raw logs.',
  '18B': 'Requires importers to give notice of regulated timber products to be unloaded in Australia, providing advance information for compliance monitoring.',
  '18C': 'Requires processors to give notice when processing a raw log into something other than a raw log, supporting monitoring of the domestic processing chain.',

  // Part 3B — Information-gathering powers
  '18D': 'Provides a simplified outline of Part 3B, which establishes information-gathering powers for the Secretary.',
  '18E': 'Empowers the Secretary to require importers to provide information or documents relevant to compliance with the Act.',
  '18F': 'Empowers the Secretary to require processors to provide information or documents relevant to compliance with the Act.',

  // Part 4 — Monitoring, Investigation and Enforcement
  '19': 'Provides for the appointment of inspectors to monitor and enforce compliance with the Act.',
  '21': 'Establishes monitoring powers for inspectors, including powers to enter premises and inspect records to verify compliance with due diligence requirements.',
  '22': 'Establishes investigation powers for inspectors to investigate suspected contraventions of the Act, including powers of search and seizure.',
  '23': 'Sets out the civil penalty framework for contraventions of the Act, providing financial penalties as an alternative to criminal prosecution.',
  '24': 'Provides for infringement notices for certain less serious contraventions, allowing penalties to be paid without court proceedings.',
  '25': 'Establishes the enforceable undertakings framework, allowing the Secretary to accept undertakings from persons to take specified compliance actions.',
  '26': 'Provides for injunctions to prevent or restrain contraventions of the Act.',
  '27': 'Addresses the interaction between the Act and biosecurity or customs control of regulated timber products, ensuring coordinated enforcement.',
  '28': 'Empowers the Secretary to require importers and processors to have audits carried out of their due diligence systems.',
  '29': 'Specifies who is qualified to carry out an audit of a due diligence system under the Act.',
  '30': 'Allows the rules to specify requirements for how audits are to be conducted.',
  '31': 'Sets out how an audit of a due diligence system must be conducted, including the scope and methodology.',
  '32': 'Requires persons subject to an audit to provide all reasonable facilities and assistance to the auditor.',

  // Part 4A — Information management
  '33': 'Provides a simplified outline of Part 4A, which governs the use and disclosure of information obtained under the Act.',
  '34': 'Authorises the use or disclosure of information for the purposes of administering and enforcing this Act.',
  '35': 'Authorises the use or disclosure of information for the purposes of other Commonwealth Acts.',
  '36': 'Authorises disclosure of information to foreign governments and international organisations for export, trade, and other purposes related to combating illegal logging.',
  '37': 'Authorises disclosure of information to Commonwealth entities for the performance of their functions.',
  '38': 'Authorises disclosure of information to State or Territory bodies for the performance of their functions.',
  '39': 'Authorises disclosure of information for law enforcement purposes.',
  '40': 'Authorises disclosure of information to a court, tribunal, or other body exercising judicial or quasi-judicial functions.',
  '41': 'Authorises use or disclosure of information for research, policy development, or data analysis purposes.',
  '42': 'Authorises use or disclosure of statistics derived from information obtained under the Act.',
  '43': 'Authorises use or disclosure of information that is already publicly available.',
  '44': 'Authorises disclosure of information to the person to whom it relates.',
  '45': 'Authorises use or disclosure of information with the consent of the person to whom it relates.',
  '46': 'Authorises disclosure of information to the person who originally provided it.',
  '47': 'Authorises use or disclosure of information to manage severe and immediate threats to health, safety, or the environment.',
  '48': 'Allows the rules to authorise additional uses or disclosures of information.',

  // Part 5 — Miscellaneous
  '81': 'Provides a simplified outline of Part 5, which contains miscellaneous provisions.',
  '82': 'Addresses the privilege against self-incrimination in the context of information-gathering powers under the Act.',
  '83': 'Empowers the Secretary to publish reports about compliance with the Act and the timber legality framework.',
  '83A': 'Requires periodic reviews of the operation of the Act to assess its effectiveness in combating illegal logging.',
  '84': 'Creates civil penalty provisions for providing false or misleading information or documents under the Act.',
  '84A': 'Empowers the Secretary to publish details of contraventions of the Act, supporting transparency and deterrence.',
  '85': 'Provides for the delegation of the Secretary\'s powers and functions under the Act.',
  '85B': 'Sets out how partnerships are treated for the purposes of the Act, including liability for contraventions.',
  '85C': 'Sets out how trusts are treated for the purposes of the Act, including the obligations and liabilities of trustees.',
  '85D': 'Sets out how unincorporated bodies or associations are treated for the purposes of the Act.',
  '85E': 'Provides protection from civil proceedings for persons acting in good faith in the exercise of powers under the Act.',
  '86': 'Provides for the making of rules by the Minister to give effect to the Act.',
};

// Content descriptions for Illegal Logging Prohibition Regulation 2012
const regContent: Record<string, string> = {
  '1': 'Provides the formal name of the regulation.',
  '3': 'Defines key terms used in the Regulation, supplementing the definitions in the Act.',
  '5': 'Prescribes the timber products that are regulated timber products for the purposes of the Act, identifying the specific product types subject to due diligence requirements.',
  '6': 'Identifies regulated timber products that are exempt from the due diligence requirements, such as products covered by recognised certification schemes.',
  '6A': 'Identifies regulated timber products that are partially exempt from certain requirements, such as products from low-risk sources.',
  '7': 'Prescribes the information that must be included in customs declarations for regulated timber products.',
  '8': 'States the purpose of Division 2, which sets out detailed due diligence requirements for importers of regulated timber products.',
  '9': 'Requires importers to establish and maintain a due diligence system that meets prescribed standards for assessing the legality of timber in imported products.',
  '10': 'Sets out the information-gathering requirements for importers, including the types of information that must be collected about the source and legality of timber.',
  '11': 'Requires importers to identify and assess the risk that timber products contain illegally logged timber, using the timber legality framework of the country of harvest.',
  '12': 'Provides an alternative risk assessment pathway using country-specific guidelines published by the Department, where available.',
  '13': 'Provides an alternative process for identifying and assessing risk, allowing importers to use recognised third-party certification or verification systems.',
  '14': 'Sets out risk mitigation requirements, prescribing actions importers must take when risk assessment identifies a non-negligible risk of illegal logging.',
  '15': 'Requires importers to provide information about their due diligence activities to the Secretary upon request.',
  '16': 'Prescribes record-keeping requirements for importers, including the types of records to be maintained and retention periods.',
  '17': 'States the purpose of Division 1 of Part 3, which sets out due diligence requirements for processors of raw logs.',
  '18': 'Requires processors to establish and maintain a due diligence system for assessing the legality of raw logs they process.',
  '19': 'Sets out information-gathering requirements for processors, including the types of information to be collected about the source and legality of raw logs.',
  '20': 'Requires processors to identify and assess the risk that raw logs were illegally harvested, using the timber legality framework of the jurisdiction of harvest.',
  '21': 'Provides an alternative risk assessment pathway for processors using State-specific guidelines.',
  '22': 'Provides an alternative process for processors to identify and assess risk using recognised certification or verification systems.',
  '23': 'Sets out risk mitigation requirements for processors when risk assessment identifies a non-negligible risk of illegal logging.',
  '24': 'Requires processors to provide information about their due diligence activities to the Secretary upon request.',
  '25': 'Prescribes record-keeping requirements for processors, including the types of records to be maintained and retention periods.',
  '27': 'Contains application provisions for amendments relating to the definition and scope of regulated timber products.',
  '28': 'Contains transitional provisions for the 2021 amendments to the Regulation.',
};

const actStmt = db.prepare(`UPDATE illegal_logging_act SET content = ? WHERE section_number = ? AND (content IS NULL OR content = '')`);
const regStmt = db.prepare(`UPDATE illegal_logging_reg SET content = ? WHERE regulation_number = ? AND (content IS NULL OR content = '')`);

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

console.log(`Updated ${actUpdated} of 69 illegal_logging_act rows with content descriptions`);
console.log(`Updated ${regUpdated} of 26 illegal_logging_reg rows with content descriptions`);
db.close();
