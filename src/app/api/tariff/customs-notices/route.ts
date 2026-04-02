import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const db = getDb();
  const q = request.nextUrl.searchParams.get('q');
  if (q && q.length >= 2) {
    const like = `%${q}%`;
    return NextResponse.json(db.prepare(`SELECT * FROM customs_notices WHERE title LIKE ? OR notice_number LIKE ? OR category LIKE ? OR summary LIKE ? ORDER BY year DESC, id DESC LIMIT 50`).all(like, like, like, like));
  }
  return NextResponse.json(db.prepare('SELECT * FROM customs_notices ORDER BY year DESC, id DESC').all());
}
