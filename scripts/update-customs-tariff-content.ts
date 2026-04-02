import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Content descriptions for Customs Tariff Act 1995
const contentMap: Record<string, string> = {
  // Part 1 — Preliminary
  '1': 'Provides the short title of the Act: the Customs Tariff Act 1995.',
  '2': 'Sets out the commencement provisions for the Customs Tariff Act 1995 and its various amendments.',
  '3': 'Defines key terms used throughout the Act, including customs duty, goods, rate of duty, tariff classification, and references to the Harmonized System.',
  '3A': 'States that the Customs Tariff Act 1995 does not extend to Norfolk Island, which has its own customs arrangements.',
  '4': 'Explains how headings in Schedule 3 (the Working Tariff) are to be interpreted, including the role of Section and Chapter notes.',
  '5': 'Explains how items in Schedule 4 (Concessional rates) are structured and how they interact with the general tariff classification.',
  '6': 'Establishes the rules for tariff classification of goods, requiring goods to be classified to the most specific heading that applies under the Harmonized System.',
  '7': 'Incorporates the General Interpretive Rules (GIR) from the Harmonized System for classifying goods in Schedule 3, including rules for mixtures, sets, and goods classifiable under multiple headings.',
  '8': 'Explains how Schedule 4 concessional items apply to imported goods, including the relationship between concessional rates and general rates of duty.',
  '9': 'Sets out how ad valorem (percentage-based) customs duties are calculated on the customs value of imported goods.',
  '10': 'Clarifies that certain words and expressions in the tariff schedules constitute rates of duty, including Free, specific rates, and compound rates.',
  '11': 'Governs phasing rates of duty, which are transitional rates that gradually reduce over time as part of trade agreement implementation.',
  '12': 'Establishes classes of countries and places that qualify for special (preferential) rates of duty under Australia\'s free trade agreements and other arrangements.',
  '13': 'Sets out the rules for determining when goods are the produce or manufacture of a particular country, which is the basis for claiming preferential tariff treatment.',
  '13A': 'Defines Singaporean originating goods for the purposes of the Singapore-Australia Free Trade Agreement (SAFTA) preferential rates.',
  '13B': 'Defines US originating goods for the purposes of the Australia-United States Free Trade Agreement (AUSFTA) preferential rates.',
  '13C': 'Defines Thai originating goods for the purposes of the Thailand-Australia Free Trade Agreement (TAFTA) preferential rates.',
  '13D': 'Defines New Zealand originating goods for the purposes of the Australia-New Zealand Closer Economic Relations (ANZCERTA) preferential rates.',
  '13E': 'Defines Chilean originating goods for the purposes of the Australia-Chile Free Trade Agreement (AClFTA) preferential rates.',
  '13EA': 'Defines Peruvian originating goods for the purposes of the Peru-Australia Free Trade Agreement (PAFTA) preferential rates.',
  '13F': 'Defines ASEAN-Australia-New Zealand originating goods for the purposes of the AANZFTA preferential rates.',
  '13G': 'Defines Malaysian originating goods for the purposes of the Malaysia-Australia Free Trade Agreement (MAFTA) preferential rates.',
  '13H': 'Defines Korean originating goods for the purposes of the Korea-Australia Free Trade Agreement (KAFTA) preferential rates.',
  '13I': 'Defines Japanese originating goods for the purposes of the Japan-Australia Economic Partnership Agreement (JAEPA) preferential rates.',
  '13J': 'Defines Chinese originating goods for the purposes of the China-Australia Free Trade Agreement (ChAFTA) preferential rates.',
  '13K': 'Defines Pacific Islands originating goods for the purposes of Pacific Island Countries trade arrangements.',
  '13L': 'Defines TPP originating goods for the purposes of the Comprehensive and Progressive Agreement for Trans-Pacific Partnership (CPTPP) preferential rates.',
  '13LA': 'Defines Indonesian originating goods for the purposes of the Indonesia-Australia Comprehensive Economic Partnership Agreement (IA-CEPA) preferential rates.',
  '13LB': 'Defines Hong Kong originating goods for the purposes of the Australia-Hong Kong Free Trade Agreement (A-HKFTA) preferential rates.',
  '13LC': 'Defines RCEP originating goods for the purposes of the Regional Comprehensive Economic Partnership (RCEP) preferential rates.',
  '13M': 'Defines UK originating goods for the purposes of the Australia-United Kingdom Free Trade Agreement (A-UKFTA) preferential rates.',
  '13N': 'Defines UAE originating goods for the purposes of the Australia-UAE trade arrangement preferential rates.',
  '13NA': 'Defines Indian originating goods for the purposes of the Australia-India Economic Cooperation and Trade Agreement (AI-ECTA) preferential rates.',
  '14': 'Sets out how preferential rates of duty are applied based on the country of origin, including the order of preference when multiple rates may apply.',

  // Part 2 — Duties of Customs
  '15': 'Imposes duties of customs on goods imported into Australia, establishing the legal basis for collecting customs duties under the tariff schedules.',
  '16': 'Sets out how the amount of customs duty payable on imported goods is calculated, including the interaction between general rates, preferential rates, and concessional rates.',
  '16A': 'Provides for the temporary suspension of preferential tariff rates where a surge in imports under a trade agreement causes or threatens serious injury to domestic industry.',
  '16B': 'Sets out the conditions under which a preferential tariff suspension ceases to apply, restoring the preferential rate of duty.',
  '17': 'Addresses how duty is calculated for goods that contain constituents subject to different rates, including mixed goods and composite articles.',
  '18': 'Sets out how concessional duty under Schedule 4 is calculated, including the interaction with By-law and Tariff Concession Order rates.',
  '18A': 'Imposes temporary additional customs duties on goods originating from Russia and Belarus in response to international sanctions.',
  '18B': 'Provides additional temporary duty measures in support of Ukraine, complementing the Russia and Belarus sanctions provisions.',
  '19': 'Provides for the indexation of CPI-indexed rates of duty (primarily on alcohol and tobacco), adjusting specific duty amounts in line with consumer price changes.',
  '19AAA': 'Sets out special fuel duty provisions for excise-equivalent customs duties on imported fuel products.',
  '19AD': 'Addresses changes to customs duty on liquefied petroleum gas and other gas products.',
  '20': 'Sets out how duty is calculated when goods are imported in containers, including whether duty applies to the container separately from its contents.',

  // Part 3 — Miscellaneous
  '20A': 'Provides for the making of regulations to give effect to the Customs Tariff Act, including matters of detail not specified in the Act itself.',
  '21': 'Provides for the repeal of the previous Customs Tariff Act 1987, which was replaced by this Act.',
  '22': 'Contains transitional provisions for the changeover from the 1987 Act to the 1995 Act, preserving the effect of existing tariff instruments and decisions.',

  // Schedules
  'Schedule 2': 'Contains the General Interpretive Rules (GIR) for classifying goods in Schedule 3, based on the World Customs Organization Harmonized System rules. These six rules determine how goods are classified when they could fall under multiple headings.',
  'Schedule 3': 'The Working Tariff — contains the complete classification of goods into tariff subheadings with corresponding general and special (preferential) rates of duty. This is the primary schedule used by customs brokers to determine the tariff classification and duty rate for imported goods.',
  'Schedule 4': 'Contains concessional rates of duty (By-law items), providing reduced or free rates for goods imported for specific purposes such as manufacturing inputs, scientific equipment, and goods not produced in Australia.',
  'Schedule 4A': 'Sets out preferential duty rates for Singaporean originating goods under SAFTA, listing the tariff subheadings and corresponding concessional rates.',
  'Schedule 5': 'Sets out preferential duty rates for US originating goods under AUSFTA, listing the tariff subheadings and corresponding concessional rates.',
  'Schedule 6': 'Sets out preferential duty rates for Thai originating goods under TAFTA, listing the tariff subheadings and corresponding concessional rates.',
  'Schedule 6A': 'Sets out preferential duty rates for Peruvian originating goods under PAFTA, listing the tariff subheadings and corresponding concessional rates.',
  'Schedule 7': 'Sets out preferential duty rates for Chilean originating goods under AClFTA, listing the tariff subheadings and corresponding concessional rates.',
  'Schedule 8': 'Sets out preferential duty rates for AANZFTA originating goods, listing the tariff subheadings and corresponding concessional rates.',
  'Schedule 8A': 'Sets out preferential duty rates for Pacific Islands originating goods, listing the tariff subheadings and corresponding concessional rates.',
  'Schedule 8B': 'Sets out preferential duty rates for CPTPP (TPP) originating goods, listing the tariff subheadings and corresponding concessional rates.',
  'Schedule 9': 'Sets out preferential duty rates for Malaysian originating goods under MAFTA, listing the tariff subheadings and corresponding concessional rates.',
  'Schedule 9A': 'Sets out preferential duty rates for Indonesian originating goods under IA-CEPA, listing the tariff subheadings and corresponding concessional rates.',
  'Schedule 10': 'Sets out preferential duty rates for Korean originating goods under KAFTA, listing the tariff subheadings and corresponding concessional rates.',
  'Schedule 10A': 'Sets out preferential duty rates for Indian originating goods under AI-ECTA, listing the tariff subheadings and corresponding concessional rates.',
  'Schedule 11': 'Sets out preferential duty rates for Japanese originating goods under JAEPA, listing the tariff subheadings and corresponding concessional rates.',
  'Schedule 12': 'Sets out preferential duty rates for Chinese originating goods under ChAFTA, listing the tariff subheadings and corresponding concessional rates.',
  'Schedule 13': 'Sets out preferential duty rates for Hong Kong originating goods under A-HKFTA, listing the tariff subheadings and corresponding concessional rates.',
  'Schedule 14': 'Sets out preferential duty rates for RCEP originating goods, listing the tariff subheadings and corresponding concessional rates.',
  'Schedule 15': 'Sets out preferential duty rates for UK originating goods under A-UKFTA, listing the tariff subheadings and corresponding concessional rates.',
  'Schedule 16': 'Sets out preferential duty rates for UAE originating goods, listing the tariff subheadings and corresponding concessional rates.',
};

const stmt = db.prepare(`UPDATE customs_tariff_act SET content = ? WHERE section_number = ? AND (content IS NULL OR content = '')`);
let updated = 0;

db.transaction(() => {
  for (const [secNum, content] of Object.entries(contentMap)) {
    const result = stmt.run(content, secNum);
    if (result.changes > 0) updated++;
  }
})();

console.log(`Updated ${updated} of 70 customs_tariff_act rows with content descriptions`);
db.close();
