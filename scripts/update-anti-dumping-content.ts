import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'tariff.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Content descriptions for Customs Tariff (Anti-Dumping) Act 1975 — only missing rows
const contentMap: Record<string, string> = {
  '3': 'Defines key terms used throughout the Act, including dumping duty, countervailing duty, export price, normal value, subsidy, and other expressions central to anti-dumping and countervailing measures.',
  '4': 'Sets out interpretive provisions for the Act, including how to determine whether goods have been dumped or subsidised, and the relationship between this Act and the Customs Act 1901.',
  '5': 'Provides that this Act is incorporated with and read as one with the Customs Act 1901, ensuring the two Acts operate together as a unified framework for customs duties.',
  '6A': 'States that the Act does not extend to Norfolk Island.',
  '13': 'Sets out how dumping duties are applied to imported goods that have been found to be dumped, including the method for calculating the duty amount based on the dumping margin.',
  '14': 'Sets out how countervailing duties are applied to imported goods that have been found to be subsidised by a foreign government, including the method for calculating the duty amount.',
  '15': 'Establishes exemptions from dumping and countervailing duties, including circumstances where duties do not apply such as de minimis dumping margins or negligible import volumes.',
  '17': 'Provides for the variation of dumping duty notices, allowing the Minister to change the scope, rate, or conditions of an existing anti-dumping measure in response to changed circumstances.',
  '18': 'Provides for the revocation of dumping duty notices, setting out the circumstances and process for removing anti-dumping measures when they are no longer warranted.',
  '19': 'Sets out the duration of anti-dumping and countervailing measures, including the standard five-year period and provisions for continuation reviews.',
  '20': 'Provides for the review of anti-dumping and countervailing measures, including periodic reviews to assess whether the measures remain necessary to prevent injury to Australian industry.',
};

const stmt = db.prepare(`UPDATE anti_dumping_act SET content = ? WHERE section_number = ? AND (content IS NULL OR content = '')`);
let updated = 0;

db.transaction(() => {
  for (const [secNum, content] of Object.entries(contentMap)) {
    const result = stmt.run(content, secNum);
    if (result.changes > 0) updated++;
  }
})();

console.log(`Updated ${updated} of 11 missing anti_dumping_act rows with content descriptions`);
db.close();
