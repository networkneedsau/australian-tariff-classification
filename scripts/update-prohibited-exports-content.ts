import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Content descriptions for Customs (Prohibited Exports) Regulations 1958 — only missing rows
const contentMap: Record<string, string> = {
  // Division 2 — Drugs and precursor substances
  '9A': 'Defines key terms used in Division 2, including drug, precursor substance, Schedule 4 drug, Schedule 8 drug, and other expressions relating to the export control of drugs and chemical precursors.',
  '10AA': 'Provides for Ministerial approval for the export of drugs that would otherwise be prohibited, including the criteria and process for obtaining approval.',
  '10A': 'Establishes a licensing regime for exporters of controlled drugs, requiring exporters to hold a licence and comply with prescribed conditions.',
  '10B': 'Prescribes the conditions that attach to licences for exporting controlled drugs under regulation 10A, including record-keeping, reporting, and security requirements.',
  '10C': 'Sets out specific requirements appropriate to the export of drugs, including documentation, packaging, and consignee verification obligations.',
  '10CA': 'Sets out specific requirements appropriate to the export of precursor substances, including end-user certification and documentation to prevent diversion to illicit manufacture.',
  '10D': 'Deems certain drugs to be narcotic drugs for the purposes of export controls, extending the prohibition to additional substances.',
  '10E': 'Provides for the exercise of powers by the Secretary, Comptroller-General of Customs, or authorised person in administering drug export controls.',
  '10F': 'Establishes review processes for decisions relating to the export of Schedule 8 drugs and precursor substances, including internal review and AAT review.',

  // Division 2A — Autonomous sanctions
  '11A': 'Prohibits the export of goods to designated persons and entities under Australian autonomous sanctions, implementing targeted financial and trade sanctions.',
  '11B': 'Prohibits the export of controlled assets under Australian autonomous sanctions, preventing the transfer of sanctioned assets out of Australia.',

  // Division 3 — Exportation of goods to certain countries
  '13CI': 'Prohibits the export of arms or related materiel to Afghanistan, implementing UN Security Council sanctions and Australian autonomous measures.',
  '13CJ': 'Prohibits the export of acetic anhydride (a heroin precursor) to Afghanistan, supporting international efforts to combat narcotics production.',
  '13CK': 'Prohibits the export of arms or related materiel to Liberia, implementing UN Security Council sanctions.',
  '13CL': 'Prohibits the export of arms or related materiel to the Democratic Republic of the Congo, implementing UN Security Council sanctions.',
  '13CM': 'Prohibits the export of arms or related materiel to Sudan, implementing UN Security Council sanctions.',
  '13CN': 'Prohibits the export of certain goods to Cote d\'Ivoire, implementing UN Security Council sanctions.',
  '13CO': 'Prohibits the export of goods to the Democratic People\'s Republic of Korea (North Korea), implementing comprehensive UN Security Council sanctions covering arms, luxury goods, and dual-use items.',
  '13CP': 'Prohibits the export of arms or related materiel to Lebanon, implementing UN Security Council sanctions.',
  '13CQ': 'Prohibits the export of certain goods to Iran, implementing UN Security Council sanctions covering nuclear-related, missile-related, and other prohibited items.',
  '13CR': 'Prohibits the export of certain goods to Eritrea, implementing UN Security Council sanctions.',
  '13CS': 'Prohibits the export of certain goods to the Libyan Arab Jamahiriya (Libya), implementing UN Security Council sanctions.',
  '13CT': 'Prohibits the export of certain goods to the Central African Republic, implementing UN Security Council sanctions.',

  // Division 4A — Defence and strategic goods
  '13EA': 'Identifies circumstances where permission is not required under regulation 13E for exporting defence and strategic goods, including certain government-to-government transfers.',
  '13EB': 'Sets out the application process for permission to export defence and strategic goods, including the information required and assessment criteria.',
  '13EC': 'Provides for changing the conditions attached to a permission to export defence and strategic goods.',
  '13ED': 'Sets out the grounds and process for revoking a permission to export defence and strategic goods.',
  '13EE': 'Establishes the internal review process for decisions relating to defence and strategic goods export permissions.',
  '13EF': 'Provides for review of defence and strategic goods export decisions by the Administrative Appeals Tribunal.',
  '13EG': 'Sets out requirements for notification of decisions relating to defence and strategic goods exports, including service and deemed receipt provisions.',
  '13EH': 'Governs the disclosure of reasons for decisions relating to defence and strategic goods export permissions, including handling of security-classified information.',
  '13EI': 'Governs the disclosure of information and documents in proceedings relating to defence and strategic goods export decisions.',
  '13EJ': 'Provides for delegations by the Defence Minister of powers and functions under the defence and strategic goods export control provisions.',
  '13EK': 'Provides for delegations by the Secretary of powers and functions under the defence and strategic goods export control provisions.',

  // Division 6 — Liquefied natural gas
  '13GB': 'Defines key terms used in Division 6, including LNG project, domestic shortfall, and other expressions relating to the liquefied natural gas export control framework.',
  '13GD': 'Provides for the assignment of export permissions for liquefied natural gas between LNG projects.',
  '13GE': 'Sets out the process for determining whether a domestic shortfall quarter exists, which triggers the LNG export control mechanism to ensure adequate domestic gas supply.',
  '13GF': 'Empowers the Resources Minister to publish guidelines for the administration of the LNG export control framework.',
  '13GG': 'Requires a review of Division 6 (LNG export controls) to assess the effectiveness and continued need for the framework.',
  '13GH': 'Provides for the repeal of Division 6, setting out the sunset provisions for the LNG export control framework.',

  // Part 4 — Miscellaneous
  '13H': 'Requires certain applications for export permission to be referred to specified bodies for assessment or advice before a decision is made.',

  // Part 5 — Transitional Matters
  '17': 'Contains transitional provisions relating to the Australian Border Force Regulation 2015, preserving the effect of previous regulatory arrangements.',
  '18': 'Contains transitional provisions relating to the Defence and Strategic Goods Regulations 2018, ensuring continuity of export control permissions.',
  '19': 'Contains transitional provisions relating to the Asbestos Regulations 2019, preserving existing export controls on asbestos products.',
  '20': 'Contains transitional provisions relating to the Objectionable Goods Regulations 2020, maintaining export prohibitions on objectionable material.',
  '21': 'Contains transitional provisions relating to the Minamata Convention Regulations 2021, implementing mercury export controls under the Minamata Convention.',
  '22': 'Contains transitional provisions relating to the LNG Regulations 2023, ensuring continuity of the liquefied natural gas export control framework.',
};

const stmt = db.prepare(`UPDATE prohibited_exports_regs SET content = ? WHERE regulation_number = ? AND (content IS NULL OR content = '')`);
let updated = 0;

db.transaction(() => {
  for (const [regNum, content] of Object.entries(contentMap)) {
    const result = stmt.run(content, regNum);
    if (result.changes > 0) updated++;
  }
})();

console.log(`Updated ${updated} of 47 missing prohibited_exports_regs rows with content descriptions`);
db.close();
