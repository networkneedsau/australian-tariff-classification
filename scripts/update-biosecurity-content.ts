import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Add content column to both tables if not present
try { db.exec('ALTER TABLE biosecurity_act ADD COLUMN content TEXT'); } catch { /* exists */ }
try { db.exec('ALTER TABLE biosecurity_regs ADD COLUMN content TEXT'); } catch { /* exists */ }

// Content descriptions for Biosecurity Act 2015 — keyed by id
const actContent: Record<number, string> = {
  1: 'Preliminary provisions including the short title, commencement, objects, and simplified outline of the Biosecurity Act 2015, which establishes Australia\'s framework for managing biosecurity risks to human, animal, and plant health.',
  2: 'Defines key terms used throughout the Act, including biosecurity risk, goods, conveyance, biosecurity measures, and the various classes of regulated articles and activities.',
  3: 'Introduction to constitutional and international law provisions that underpin the Act\'s operation across Commonwealth, State, and Territory jurisdictions.',
  4: 'Sets out the constitutional basis for the Act and its relationship with international obligations, including the International Health Regulations and the SPS Agreement under the WTO.',
  5: 'Establishes the principles that guide decision-making under the Act, including that the level of biosecurity risk must be assessed based on scientific evidence and that the measures taken must be appropriate and adapted to the level of risk.',
  6: 'Introduction to provisions for managing biosecurity risks to human health, including the listing of human diseases of biosecurity concern.',
  7: 'Sets out protections for individuals relating to human health biosecurity measures, including rights to information, consent requirements, and limits on the exercise of powers.',
  8: 'Provides for the listing of human diseases of biosecurity concern by the Health Minister, enabling biosecurity measures to be applied to manage the risk of listed diseases entering Australia.',
  9: 'Establishes entry and exit requirements for managing human health biosecurity risks, including health screening and reporting obligations for persons arriving in or departing Australia.',
  10: 'Requires operators of incoming aircraft and vessels to provide contact information, supporting human health biosecurity risk management.',
  11: 'Governs pratique (health clearance) for vessels and aircraft arriving in Australia, which must be granted before passengers and crew may disembark.',
  12: 'Provides for preventative biosecurity measures to manage human health risks, including vaccination and prophylaxis requirements.',
  13: 'Sets out information-gathering powers for human health biosecurity purposes, including the power to require individuals to answer questions and provide documents.',
  14: 'Establishes the framework for imposing human biosecurity control orders on individuals who may pose a biosecurity risk, including the types of measures that may be imposed.',
  15: 'Details the biosecurity measures that may be included in a human biosecurity control order, such as isolation, medical examination, vaccination, and movement restrictions.',
  16: 'Contains other provisions relating to human biosecurity control orders, including variation, revocation, review, and compliance requirements.',
  17: 'Provides for managing deceased individuals who may pose a biosecurity risk, including powers to prevent the spread of listed human diseases.',
  18: 'Establishes human health response zones to manage biosecurity emergencies affecting human health in defined geographic areas.',
  19: 'Establishes when imported goods become subject to biosecurity control upon arrival in Australian territory.',
  20: 'Requires notice to be given of goods to be unloaded from vessels and aircraft in Australia, supporting biosecurity risk assessment before goods are released.',
  21: 'Sets out the framework for assessing the biosecurity risk of imported goods, including inspection, testing, and the application of biosecurity risk profiles.',
  22: 'Provides for biosecurity measures to manage the risk posed by imported goods, including treatment, holding, re-exportation, and destruction.',
  23: 'Governs the unloading of goods at approved landing places and ports, including requirements for biosecurity clearance before unloading.',
  24: 'Addresses the unloading of goods from vessels displaying a quarantine signal, requiring special biosecurity procedures.',
  25: 'Establishes reporting requirements for biosecurity incidents involving goods, including contamination, pest detection, and disease outbreaks.',
  26: 'Covers goods exposed to biosecurity risks while under biosecurity control, including provisions for managing contaminated or suspect goods.',
  27: 'Sets out the conditions and process for releasing goods from biosecurity control, including biosecurity clearance and any conditions that may be imposed.',
  28: 'Establishes the Biosecurity Import Risk Analysis (BIRA) process for assessing the biosecurity risks associated with importing new categories of goods into Australia.',
  29: 'Defines prohibited and conditionally non-prohibited goods for biosecurity purposes, including goods whose importation is absolutely prohibited and goods that may be imported subject to conditions.',
  30: 'Governs the biosecurity permit system, including applications for permits to import conditionally non-prohibited goods and the conditions that may be attached to permits.',
  31: 'Provides for suspended goods that are temporarily prohibited from importation due to an identified biosecurity risk.',
  32: 'Sets out offences and civil penalties for breaches of the prohibited goods provisions, including importing prohibited goods and failing to comply with permit conditions.',
  33: 'Establishes when conveyances (ships and aircraft) entering Australian territory become subject to biosecurity control.',
  34: 'Requires pre-arrival reporting for conveyances entering Australia, including advance notice of arrival and biosecurity-relevant information.',
  35: 'Sets out the framework for assessing the biosecurity risk of incoming conveyances, including inspection and the application of risk profiles.',
  36: 'Provides for biosecurity measures to be applied to conveyances, including treatment, quarantine, and restrictions on movement.',
  37: 'Governs first points of entry and biosecurity entry points for conveyances, designating approved locations where vessels and aircraft may enter Australia.',
  38: 'Establishes ship sanitation provisions, including international ship sanitation certificates and requirements for maintaining vessels in a sanitary condition.',
  39: 'Sets out the application and interpretation provisions for ballast water and sediment management, implementing Australia\'s obligations under the Ballast Water Management Convention.',
  40: 'Requires notice of planned ballast water discharge in Australian waters, supporting management of biosecurity risks from marine organisms in ballast water.',
  41: 'Governs the management of ballast water discharge, including approved methods, exchange zones, and exemptions.',
  42: 'Provides for ballast water management plans and certificates for vessels, ensuring compliance with discharge management requirements.',
  43: 'Requires vessels to maintain ballast water records documenting all ballast water operations.',
  44: 'Creates offences for improper disposal of sediment from ballast tanks and other vessel spaces.',
  45: 'Establishes compliance and enforcement mechanisms specific to ballast water management.',
  46: 'Contains miscellaneous provisions for ballast water management, including delegations and transitional arrangements.',
  47: 'Provides powers for locating prohibited or suspended goods within Australian territory, supporting enforcement of import restrictions.',
  48: 'Establishes the framework for assessing the level of biosecurity risk in Australian territory, including monitoring, surveillance, and risk analysis.',
  49: 'Provides for biosecurity measures to manage biosecurity risks identified within Australian territory, including treatment, movement restrictions, and destruction of affected material.',
  50: 'Establishes biosecurity control orders for managing biosecurity risks associated with premises, goods, or conveyances within Australian territory.',
  51: 'Provides for the declaration of biosecurity response zones in areas where a biosecurity risk has been identified, enabling coordinated response measures.',
  52: 'Establishes biosecurity monitoring zones for ongoing surveillance of biosecurity risks in defined areas.',
  53: 'Provides for preventative biosecurity measures within Australian territory, including measures to prevent the establishment or spread of pests and diseases.',
  54: 'Establishes biosecurity activity zones where specific biosecurity activities may be conducted to manage identified risks.',
  55: 'Governs the approval process for proposed biosecurity arrangements, allowing businesses to manage certain biosecurity risks under an approved system.',
  56: 'Provides for variation of approved arrangements to accommodate changes in operations or biosecurity requirements.',
  57: 'Sets out the grounds and process for suspending an approved arrangement where biosecurity risks are not being adequately managed.',
  58: 'Provides for the revocation or expiry of approved arrangements, including the circumstances in which an arrangement ceases to have effect.',
  59: 'Establishes powers and obligations of holders of approved arrangements, including responsibilities for managing biosecurity risks and reporting incidents.',
  60: 'Contains other provisions relating to approved arrangements, including cost recovery, record-keeping, and audit requirements.',
  61: 'Establishes the framework for declaring and managing biosecurity emergencies, providing extraordinary powers to respond to major biosecurity threats.',
  62: 'Provides for human biosecurity emergencies, enabling the Health Minister to declare an emergency and exercise special powers to manage serious threats to human health.',
  63: 'Sets out monitoring powers for biosecurity officers and enforcement officers, including powers to enter premises and inspect goods, conveyances, and documents.',
  64: 'Establishes investigation powers for enforcement officers to investigate suspected breaches of the Act, including powers of search and seizure.',
  65: 'Provides for the issue of warrants to support monitoring and investigation activities, including the grounds for issuing warrants and the conditions that apply.',
  66: 'Sets out general rules applying to entry under warrant or with consent, including obligations to minimise disruption and protect property.',
  67: 'Provides for entry to premises without a warrant or consent in specified urgent circumstances, such as when there is an immediate biosecurity risk.',
  68: 'Establishes the civil penalty framework for contraventions of the Act, providing for financial penalties as an alternative to criminal prosecution.',
  69: 'Provides for infringement notices for certain less serious contraventions, allowing penalties to be paid without court proceedings.',
  70: 'Establishes the enforceable undertakings framework, allowing the Director of Biosecurity to accept undertakings from persons to take specified actions.',
  71: 'Provides for injunctions to prevent or restrain contraventions of the Act.',
  72: 'Contains miscellaneous compliance and enforcement provisions, including evidentiary matters, legal proceedings, and cost recovery for enforcement activities.',
  73: 'Establishes the role and functions of the Director of Biosecurity, who is responsible for biosecurity policy and operations.',
  74: 'Establishes the role and functions of the Director of Human Biosecurity, responsible for human health biosecurity measures.',
  75: 'Provides for the appointment and powers of biosecurity officers and enforcement officers who exercise powers under the Act.',
  76: 'Provides for Chief Human Biosecurity Officers and human biosecurity officers who exercise powers in relation to human health biosecurity measures.',
  77: 'Establishes the Inspector-General of Biosecurity, an independent oversight role reviewing the administration and operation of the biosecurity system.',
  78: 'Contains miscellaneous governance provisions, including delegations, annual reporting, and review of the Act.',
};

// Content descriptions for Biosecurity Regulation 2016
const regsContent: Record<number, string> = {
  1: 'Preliminary provisions including the name, commencement, and authority for the Biosecurity Regulation 2016.',
  2: 'Defines key terms used in the Regulation, supplementing the definitions in the Biosecurity Act 2015.',
  3: 'Introduction to provisions relating to notice of goods to be unloaded in Australian territory.',
  4: 'Sets out requirements for providing notice of goods to be unloaded from conveyances in Australian territory, including timeframes and information to be provided.',
  5: 'Addresses notice requirements for goods to be unloaded in external territories.',
  6: 'Provides exceptions to the notice requirements for certain categories of goods.',
  7: 'Governs various matters relating to goods brought into Australian territory, including conditions for biosecurity clearance and release from biosecurity control.',
  8: 'Sets out provisions for the release of goods from biosecurity control, including the conditions that must be met and documentation required.',
  9: 'Establishes the detailed BIRA (Biosecurity Import Risk Analysis) process, including application requirements, assessment methodology, stakeholder consultation, and decision-making timeframes.',
  10: 'Provides for reviews by the Inspector-General of Biosecurity of BIRA processes and decisions.',
  11: 'Governs the biosecurity permit system, including application requirements, assessment criteria, permit conditions, and duration.',
  12: 'Sets out pre-arrival reporting requirements for conveyances entering Australian territory, including timeframes and the information that must be provided.',
  13: 'Addresses requirements for conveyances entering Australian territory, including biosecurity clearance procedures and conditions.',
  14: 'Governs first points of entry requirements for conveyances, including the designation and operation of approved entry points.',
  15: 'Contains monitoring, control and response provisions supporting the Act\'s framework for managing biosecurity risks within Australian territory.',
  16: 'Sets out requirements for the approval of biosecurity arrangements, including application criteria and assessment processes.',
  17: 'Governs the suspension of approved arrangements, including grounds for suspension and procedural requirements.',
  18: 'Addresses the revocation of approved arrangements, including the circumstances in which revocation may occur.',
  19: 'Contains general provisions relating to approved arrangements, including record-keeping, reporting, and compliance obligations.',
  20: 'Establishes compliance and enforcement provisions supporting the regulatory framework.',
  21: 'Preliminary provisions for governance and officials under the Regulation.',
  22: 'Establishes the annual review program for the Inspector-General of Biosecurity.',
  23: 'Sets out the review process for Inspector-General reviews, including methodology and stakeholder engagement.',
  24: 'Governs review reports prepared by the Inspector-General, including content requirements and publication.',
  25: 'Contains other matters relating to the Inspector-General\'s functions and operations.',
  26: 'Establishes the cost recovery framework for biosecurity services, including prescribed fees for inspections, permits, and other activities.',
  27: 'Sets out payment requirements for biosecurity fees and charges, including invoicing, payment terms, and debt recovery.',
  28: 'Provides for compensation where biosecurity measures result in loss or damage to goods or property.',
  29: 'Contains special provisions for biosecurity management in the Torres Strait, recognising the unique cross-border movement patterns in the region.',
  30: 'Contains transitional matters for the changeover from previous quarantine legislation to the Biosecurity Act framework.',
};

const actStmt = db.prepare(`UPDATE biosecurity_act SET content = ? WHERE id = ?`);
const regsStmt = db.prepare(`UPDATE biosecurity_regs SET content = ? WHERE id = ?`);

let actUpdated = 0;
let regsUpdated = 0;

db.transaction(() => {
  for (const [id, content] of Object.entries(actContent)) {
    const result = actStmt.run(content, Number(id));
    if (result.changes > 0) actUpdated++;
  }
  for (const [id, content] of Object.entries(regsContent)) {
    const result = regsStmt.run(content, Number(id));
    if (result.changes > 0) regsUpdated++;
  }
})();

console.log(`Updated ${actUpdated} of 78 biosecurity_act rows with content descriptions`);
console.log(`Updated ${regsUpdated} of 30 biosecurity_regs rows with content descriptions`);
db.close();
