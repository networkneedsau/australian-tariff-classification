import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fta = searchParams.get('fta')?.trim();
  const code = searchParams.get('code')?.trim();

  const db = getDb();

  // If no params, return list of distinct FTAs for the wizard dropdown
  if (!fta && !code) {
    const ftas = db.prepare(`
      SELECT DISTINCT fta_schedule, fta_name FROM roo_rules ORDER BY fta_name
    `).all() as { fta_schedule: string; fta_name: string }[];

    return NextResponse.json({ ftas });
  }

  if (!fta) {
    return NextResponse.json({ error: 'Missing required parameter: fta' }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: 'Missing required parameter: code' }, { status: 400 });
  }

  // Extract chapter number from HS code (first 2 digits)
  const chapterStr = code.replace(/\./g, '').substring(0, 2);
  const chapter = parseInt(chapterStr, 10);

  if (isNaN(chapter)) {
    return NextResponse.json({ error: 'Invalid code format' }, { status: 400 });
  }

  const rules = db.prepare(`
    SELECT id, fta_schedule, fta_name, chapter_start, chapter_end,
           rule_type, rule_description, rvc_threshold, ctc_level,
           specific_requirements, notes
    FROM roo_rules
    WHERE fta_schedule = ?
      AND chapter_start <= ?
      AND chapter_end >= ?
    ORDER BY rule_type
  `).all(fta, chapter, chapter) as {
    id: number;
    fta_schedule: string;
    fta_name: string;
    chapter_start: number;
    chapter_end: number;
    rule_type: string;
    rule_description: string;
    rvc_threshold: number | null;
    ctc_level: string | null;
    specific_requirements: string | null;
    notes: string | null;
  }[];

  // Also fetch any preferential duty rate from fta_exclusions for this code+schedule
  let preferenceRate: string | null = null;
  try {
    const hsPrefix = code.substring(0, 7); // e.g. "8471.30"
    const exc = db.prepare(`
      SELECT duty_rate FROM tariff_fta_exclusions
      WHERE schedule = ? AND (hs_code LIKE ? OR hs_code LIKE ?)
      LIMIT 1
    `).get(fta, hsPrefix + '%', code.replace(/\./g, '').substring(0, 6) + '%') as { duty_rate: string | null } | undefined;

    if (exc) preferenceRate = exc.duty_rate;
  } catch {
    // table may not exist
  }

  return NextResponse.json({
    fta_schedule: fta,
    code,
    chapter,
    rules,
    preferenceRate,
  });
}
