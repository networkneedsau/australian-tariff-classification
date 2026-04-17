import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const db = getDb();
  const q = request.nextUrl.searchParams.get('q');

  if (q && q.length >= 2) {
    const like = `%${q}%`;
    const results = db.prepare(`
      SELECT * FROM abf_reference_files
      WHERE file_code LIKE ? OR file_name LIKE ? OR category LIKE ? OR description LIKE ?
      ORDER BY id LIMIT 50
    `).all(like, like, like, like);
    return NextResponse.json(results);
  }

  return NextResponse.json(db.prepare('SELECT * FROM abf_reference_files ORDER BY id').all());
}
