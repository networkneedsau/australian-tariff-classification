import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();

  // Join with preference_schemes to include scheme_name alongside country data
  const countries = db.prepare(`
    SELECT tc.*, ps.scheme_name
    FROM tariff_countries tc
    LEFT JOIN preference_schemes ps ON ps.scheme_code = tc.schedule
    ORDER BY tc.country
  `).all();

  return NextResponse.json(countries);
}
