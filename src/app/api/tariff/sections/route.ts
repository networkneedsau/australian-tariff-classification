import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();

  const sections = db.prepare(`
    SELECT DISTINCT section_number, section_title
    FROM tariff_classifications
    ORDER BY section_number
  `).all();

  const result = (sections as any[]).map(s => {
    const chapters = db.prepare(`
      SELECT DISTINCT chapter_number, chapter_title
      FROM tariff_classifications
      WHERE section_number = ?
      ORDER BY chapter_number
    `).all(s.section_number);

    return {
      number: s.section_number,
      title: s.section_title,
      chapters: (chapters as any[]).map(c => ({
        number: c.chapter_number,
        title: c.chapter_title,
      })),
    };
  });

  return NextResponse.json(result);
}
