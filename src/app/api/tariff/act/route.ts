import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const db = getDb();
  const q = request.nextUrl.searchParams.get('q');

  if (q && q.length >= 2) {
    // Search using FTS
    const terms = q.trim().split(/\s+/).map(t => `"${t}"*`).join(' AND ');
    try {
      const results = db.prepare(`
        SELECT s.* FROM customs_act_fts f
        JOIN customs_act_sections s ON s.id = f.rowid
        WHERE customs_act_fts MATCH ?
        ORDER BY rank
        LIMIT 50
      `).all(terms);
      return NextResponse.json(results);
    } catch {
      // Fallback to LIKE if FTS fails
      const like = `%${q}%`;
      const results = db.prepare(`
        SELECT * FROM customs_act_sections
        WHERE section_title LIKE ? OR section_number LIKE ? OR part_title LIKE ? OR division_title LIKE ?
        ORDER BY id
        LIMIT 50
      `).all(like, like, like, like);
      return NextResponse.json(results);
    }
  }

  // Return all sections grouped by part
  const sections = db.prepare(`
    SELECT * FROM customs_act_sections ORDER BY id
  `).all();

  return NextResponse.json(sections);
}
