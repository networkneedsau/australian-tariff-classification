import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const db = getDb();
  const q = request.nextUrl.searchParams.get('q');
  if (q && q.length >= 2) {
    const like = `%${q}%`;
    return NextResponse.json(db.prepare(`SELECT * FROM tariff_precedents WHERE goods_description LIKE ? OR category LIKE ? OR tariff_classification LIKE ? OR reasoning LIKE ? OR scope LIKE ? OR chapter LIKE ? ORDER BY id LIMIT 50`).all(like, like, like, like, like, like));
  }
  return NextResponse.json(db.prepare('SELECT * FROM tariff_precedents ORDER BY id').all());
}
