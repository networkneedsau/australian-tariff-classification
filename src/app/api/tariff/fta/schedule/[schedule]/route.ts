import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ schedule: string }> }
) {
  const { schedule } = await params;
  const scheduleName = decodeURIComponent(schedule);
  const db = getDb();

  const exclusions = db.prepare(`
    SELECT hs_code, description, fta_name, duty_rate
    FROM tariff_fta_exclusions
    WHERE schedule = ?
    ORDER BY hs_code
  `).all(scheduleName);

  return NextResponse.json(exclusions);
}
