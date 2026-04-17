import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const db = getDb();
  const q = request.nextUrl.searchParams.get('q');
  if (q && q.length >= 2) {
    const like = `%${q}%`;
    return NextResponse.json(db.prepare(`SELECT * FROM customs_tariff_regs WHERE section_title LIKE ? OR section_number LIKE ? OR part_title LIKE ? ORDER BY id LIMIT 50`).all(like, like, like));
  }
  return NextResponse.json(db.prepare('SELECT * FROM customs_tariff_regs ORDER BY id').all());
}
