import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const db = getDb();
  const q = request.nextUrl.searchParams.get('q');

  if (q && q.length >= 2) {
    const like = `%${q}%`;
    const results = db.prepare(`
      SELECT * FROM cp_questions
      WHERE question_text LIKE ? OR cp_number LIKE ? OR category LIKE ? OR applies_to LIKE ? OR notes LIKE ?
      ORDER BY id LIMIT 50
    `).all(like, like, like, like, like);
    return NextResponse.json(results);
  }

  return NextResponse.json(db.prepare('SELECT * FROM cp_questions ORDER BY id').all());
}
