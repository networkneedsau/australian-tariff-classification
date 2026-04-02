import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const MAX_CODES = 500;

export async function POST(request: NextRequest) {
  let body: { codes?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { codes } = body;
  if (!codes || !Array.isArray(codes) || codes.length === 0) {
    return NextResponse.json(
      { error: 'Request body must include a non-empty "codes" array' },
      { status: 400 }
    );
  }

  if (codes.length > MAX_CODES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_CODES} codes allowed per request` },
      { status: 400 }
    );
  }

  const db = getDb();

  const stmt = db.prepare(`
    SELECT id, section_number, section_title, chapter_number, chapter_title,
           heading_code, heading_description, code, statistical_code,
           description, unit, duty_rate, duty_rate_numeric, is_free
    FROM tariff_classifications
    WHERE code = ? OR replace(code, '.', '') = ?
    LIMIT 1
  `);

  const results: any[] = [];
  const notFound: string[] = [];

  for (const rawCode of codes) {
    const cleanCode = rawCode
      .replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
      .trim();

    if (!cleanCode) continue;

    const item = stmt.get(cleanCode, cleanCode.replace(/\./g, '')) as any;

    if (item) {
      results.push({
        code: item.code,
        statistical_code: item.statistical_code,
        description: item.description,
        unit: item.unit,
        duty_rate: item.duty_rate,
        duty_rate_numeric: item.duty_rate_numeric,
        is_free: !!item.is_free,
        section_number: item.section_number,
        section_title: item.section_title,
        chapter_number: item.chapter_number,
        chapter_title: item.chapter_title,
        heading_code: item.heading_code,
        heading_description: item.heading_description,
      });
    } else {
      notFound.push(cleanCode);
    }
  }

  return NextResponse.json({ results, notFound });
}
