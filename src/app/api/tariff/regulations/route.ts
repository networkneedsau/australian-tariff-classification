import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const db = getDb();
  const q = request.nextUrl.searchParams.get('q');

  if (q && q.length >= 2) {
    const terms = q.trim().split(/\s+/).map(t => `"${t}"*`).join(' AND ');
    try {
      const results = db.prepare(`
        SELECT r.* FROM prohibited_imports_fts f
        JOIN prohibited_imports_regs r ON r.id = f.rowid
        WHERE prohibited_imports_fts MATCH ?
        ORDER BY rank
        LIMIT 50
      `).all(terms);
      return NextResponse.json(results);
    } catch {
      const like = `%${q}%`;
      const results = db.prepare(`
        SELECT * FROM prohibited_imports_regs
        WHERE regulation_title LIKE ? OR regulation_number LIKE ? OR category LIKE ?
        ORDER BY id
        LIMIT 50
      `).all(like, like, like);
      return NextResponse.json(results);
    }
  }

  const regs = db.prepare('SELECT * FROM prohibited_imports_regs ORDER BY id').all();
  return NextResponse.json(regs);
}
