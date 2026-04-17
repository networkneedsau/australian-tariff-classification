import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const db = getDb();
  const q = request.nextUrl.searchParams.get('q');

  if (q && q.length >= 2) {
    const terms = q.trim().split(/\s+/).map(t => `"${t}"*`).join(' AND ');
    try {
      const results = db.prepare(`
        SELECT a.* FROM ahecc_fts f
        JOIN ahecc_chapters a ON a.id = f.rowid
        WHERE ahecc_fts MATCH ?
        ORDER BY rank
        LIMIT 50
      `).all(terms);
      return NextResponse.json(results);
    } catch {
      const like = `%${q}%`;
      const results = db.prepare(`
        SELECT * FROM ahecc_chapters
        WHERE chapter_title LIKE ? OR chapter_number LIKE ? OR section_title LIKE ? OR section_number LIKE ?
        ORDER BY id
        LIMIT 50
      `).all(like, like, like, like);
      return NextResponse.json(results);
    }
  }

  const chapters = db.prepare('SELECT * FROM ahecc_chapters ORDER BY id').all();
  return NextResponse.json(chapters);
}
