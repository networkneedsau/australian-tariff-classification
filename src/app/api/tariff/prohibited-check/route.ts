import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Missing ?code= parameter' }, { status: 400 });
  }

  const cleanCode = code.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '').trim();
  const db = getDb();

  // Extract chapter (first 2 digits) and heading (first 4 digits)
  const chapter = cleanCode.replace(/\D/g, '').substring(0, 2);
  const heading = cleanCode.replace(/\D/g, '').substring(0, 4);

  // Range match: code falls within tariff_code_start..tariff_code_end
  // Also chapter-level match: tariff_code_start is a prefix of the code's chapter/heading
  const rows = db.prepare(`
    SELECT * FROM prohibited_goods_map
    WHERE
      (? >= tariff_code_start AND (tariff_code_end IS NULL OR ? <= tariff_code_end))
      OR (? LIKE tariff_code_start || '%')
      OR (? LIKE tariff_code_start || '%')
  `).all(cleanCode, cleanCode, cleanCode, chapter) as any[];

  // Deduplicate by id
  const seen = new Set<number>();
  const unique = rows.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  const prohibited = unique.filter(r => r.severity === 'prohibited');
  const restricted = unique.filter(r => r.severity === 'restricted');
  const conditional = unique.filter(r => r.severity === 'conditional');

  return NextResponse.json({ prohibited, restricted, conditional });
}
