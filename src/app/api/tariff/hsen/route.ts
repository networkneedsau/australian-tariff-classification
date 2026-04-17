import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const db = getDb();
  const q = request.nextUrl.searchParams.get('q');
  if (q && q.length >= 2) {
    const like = `%${q}%`;
    return NextResponse.json(db.prepare(`SELECT * FROM hsen WHERE section_title LIKE ? OR chapters LIKE ? OR scope LIKE ? OR key_notes LIKE ? OR classification_guidance LIKE ? ORDER BY id LIMIT 50`).all(like, like, like, like, like));
  }
  return NextResponse.json(db.prepare('SELECT * FROM hsen ORDER BY id').all());
}
