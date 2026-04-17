import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const db = getDb();
  const q = request.nextUrl.searchParams.get('q');
  if (q && q.length >= 2) {
    const like = `%${q}%`;
    return NextResponse.json(db.prepare(`SELECT * FROM alpha_index WHERE goods_description LIKE ? OR hs_code LIKE ? OR chapter LIKE ? OR section LIKE ? ORDER BY goods_description LIMIT 50`).all(like, like, like, like));
  }
  return NextResponse.json(db.prepare('SELECT * FROM alpha_index ORDER BY goods_description').all());
}
