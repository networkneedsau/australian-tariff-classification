import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const db = getDb();
  const q = request.nextUrl.searchParams.get('q');
  if (q && q.length >= 2) {
    const like = `%${q}%`;
    return NextResponse.json(db.prepare(`SELECT * FROM prohibited_exports_regs WHERE regulation_title LIKE ? OR regulation_number LIKE ? OR part_title LIKE ? OR division_title LIKE ? OR content LIKE ? ORDER BY id LIMIT 50`).all(like, like, like, like, like));
  }
  return NextResponse.json(db.prepare('SELECT * FROM prohibited_exports_regs ORDER BY id').all());
}
