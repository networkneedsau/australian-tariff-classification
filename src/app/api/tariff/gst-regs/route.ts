import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const db = getDb();
  const q = request.nextUrl.searchParams.get('q');

  if (q && q.length >= 2) {
    const like = `%${q}%`;
    const results = db.prepare(`
      SELECT * FROM gst_regs
      WHERE division_title LIKE ? OR division LIKE ? OR chapter_title LIKE ? OR part_title LIKE ? OR subdivision LIKE ?
      ORDER BY id LIMIT 50
    `).all(like, like, like, like, like);
    return NextResponse.json(results);
  }

  return NextResponse.json(db.prepare('SELECT * FROM gst_regs ORDER BY id').all());
}
