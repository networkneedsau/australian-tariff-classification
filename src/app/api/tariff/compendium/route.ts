import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const db = getDb();
  const q = request.nextUrl.searchParams.get('q');
  if (q && q.length >= 2) {
    const like = `%${q}%`;
    return NextResponse.json(db.prepare(`SELECT * FROM classification_compendium WHERE section_title LIKE ? OR chapters LIKE ? OR example_opinion LIKE ? OR example_reasoning LIKE ? OR notes LIKE ? ORDER BY id LIMIT 50`).all(like, like, like, like, like));
  }
  return NextResponse.json(db.prepare('SELECT * FROM classification_compendium ORDER BY id').all());
}
