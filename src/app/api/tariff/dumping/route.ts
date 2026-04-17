import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const db = getDb();
  const q = request.nextUrl.searchParams.get('q');

  if (q && q.length >= 2) {
    const like = `%${q}%`;
    const results = db.prepare(`
      SELECT * FROM dumping_notices
      WHERE commodity LIKE ? OR countries LIKE ? OR measure_type LIKE ? OR category LIKE ? OR notes LIKE ? OR tariff_chapters LIKE ?
      ORDER BY id LIMIT 50
    `).all(like, like, like, like, like, like);
    return NextResponse.json(results);
  }

  return NextResponse.json(db.prepare('SELECT * FROM dumping_notices ORDER BY category, id').all());
}
