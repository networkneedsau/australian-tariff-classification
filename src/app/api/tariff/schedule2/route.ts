import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Fallback rules when table is empty or doesn't exist
const FALLBACK_RULES = [
  { rule_number: '1', title: 'Rule 1 — Classification by heading', content: 'Classification is determined by the terms of the headings and any relative Section or Chapter Notes. Classification by other rules applies only when headings or Notes do not otherwise require.' },
  { rule_number: '2', title: 'Rule 2 — Incomplete articles and mixtures', content: '(a) References to an article include that article incomplete or unfinished, provided it has the essential character of the complete article, including articles presented unassembled or disassembled. (b) References to a material or substance include mixtures or combinations of that material with other materials or substances. Goods of two or more materials are classified per Rule 3.' },
  { rule_number: '3', title: 'Rule 3 — Multiple heading classification', content: 'When goods are classifiable under two or more headings: (a) the most specific description is preferred; (b) mixtures, composite goods, and goods in sets are classified by the material or component giving essential character; (c) when (a) and (b) do not apply, classify under the last in numerical order.' },
  { rule_number: '4', title: 'Rule 4 — Most akin goods', content: 'Goods which cannot be classified under Rules 1 to 3 shall be classified under the heading appropriate to the goods to which they are most akin.' },
  { rule_number: '5', title: 'Rule 5 — Containers and packing', content: '(a) Camera cases, musical instrument cases, and similar containers specially shaped for specific articles are classified with those articles when presented with them and of a kind normally sold therewith. (b) Packing materials and containers presented with goods are classified with those goods if they are of a kind normally used for packing, unless clearly suitable for repetitive use.' },
  { rule_number: '6', title: 'Rule 6 — Subheading classification', content: 'Classification at the subheading level is determined by the terms of those subheadings and any related Subheading Notes, applying Rules 1 to 5 mutatis mutandis. Only subheadings at the same level are comparable.' },
];

export async function GET() {
  const db = getDb();

  try {
    const rules = db.prepare(`
      SELECT rule_number, title, content, updated_at
      FROM schedule2_rules
      ORDER BY rule_number
    `).all() as { rule_number: string; title: string; content: string | null; updated_at: string }[];

    if (rules.length > 0) {
      return NextResponse.json({ rules, source: 'database' });
    }
  } catch {
    // Table may not exist yet
  }

  // Return fallback data
  return NextResponse.json({ rules: FALLBACK_RULES, source: 'fallback' });
}
