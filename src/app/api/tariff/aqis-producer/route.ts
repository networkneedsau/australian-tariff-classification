import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const db = getDb();
  const q = request.nextUrl.searchParams.get('q');
  if (q && q.length >= 2) {
    const like = `%${q}%`;
    return NextResponse.json(db.prepare(`SELECT * FROM aqis_producers WHERE item_title LIKE ? OR category LIKE ? OR description LIKE ? OR requirements LIKE ? OR notes LIKE ? ORDER BY id LIMIT 50`).all(like, like, like, like, like));
  }
  return NextResponse.json(db.prepare('SELECT * FROM aqis_producers ORDER BY id').all());
}
