import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Missing ?code= parameter' }, { status: 400 });
  }

  const cleanCode = code.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '').trim();
  const db = getDb();

  // Extract chapter prefix
  const chapter = cleanCode.replace(/\D/g, '').substring(0, 2);

  // Range match + chapter-level prefix match
  const rows = db.prepare(`
    SELECT * FROM permit_requirements
    WHERE
      (? >= tariff_code_start AND (tariff_code_end IS NULL OR ? <= tariff_code_end))
      OR (? LIKE tariff_code_start || '%')
      OR (? LIKE tariff_code_start || '%')
  `).all(cleanCode, cleanCode, cleanCode, chapter) as any[];

  // Deduplicate by id
  const seen = new Set<number>();
  const permits = rows.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  }).map(r => ({
    agency: r.agency,
    permit_type: r.permit_type,
    description: r.description,
    link_url: r.link_url,
    notes: r.notes,
  }));

  return NextResponse.json({ permits });
}
