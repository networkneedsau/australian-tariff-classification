import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();

  try {
    // Get all preference schemes with a count of countries using each schedule
    const schemes = db.prepare(`
      SELECT
        ps.id,
        ps.scheme_code,
        ps.scheme_name,
        ps.start_date,
        ps.end_date,
        ps.source,
        ps.updated_at,
        COALESCE(cc.country_count, 0) as country_count
      FROM preference_schemes ps
      LEFT JOIN (
        SELECT schedule, COUNT(*) as country_count
        FROM tariff_countries
        GROUP BY schedule
      ) cc ON cc.schedule = ps.scheme_code
      ORDER BY ps.scheme_code
    `).all() as {
      id: number;
      scheme_code: string;
      scheme_name: string;
      start_date: string | null;
      end_date: string | null;
      source: string;
      updated_at: string;
      country_count: number;
    }[];

    return NextResponse.json({ schemes, total: schemes.length });
  } catch {
    return NextResponse.json({ schemes: [], total: 0 });
  }
}
