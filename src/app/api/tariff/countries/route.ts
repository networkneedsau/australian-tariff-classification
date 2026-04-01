import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const countries = db.prepare(`
    SELECT * FROM tariff_countries ORDER BY country
  `).all();
  return NextResponse.json(countries);
}
