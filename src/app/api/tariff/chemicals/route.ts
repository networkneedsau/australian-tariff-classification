import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const db = getDb();
  const q = request.nextUrl.searchParams.get('q');

  if (q && q.length >= 2) {
    const terms = q.trim().split(/\s+/).map(t => `"${t}"*`).join(' AND ');
    try {
      const results = db.prepare(`
        SELECT c.* FROM chemical_fts f
        JOIN chemical_index c ON c.id = f.rowid
        WHERE chemical_fts MATCH ?
        ORDER BY rank
        LIMIT 50
      `).all(terms);
      return NextResponse.json(results);
    } catch {
      const like = `%${q}%`;
      const results = db.prepare(`
        SELECT * FROM chemical_index
        WHERE chemical_name LIKE ? OR cas_number LIKE ? OR category LIKE ? OR notes LIKE ?
        ORDER BY id
        LIMIT 50
      `).all(like, like, like, like);
      return NextResponse.json(results);
    }
  }

  const chems = db.prepare('SELECT * FROM chemical_index ORDER BY cwc_schedule, id').all();
  return NextResponse.json(chems);
}
