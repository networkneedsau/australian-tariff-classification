import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hsCode: string }> }
) {
  const { hsCode } = await params;
  const db = getDb();

  const exclusions = db.prepare(`
    SELECT * FROM tariff_fta_exclusions
    WHERE hs_code LIKE ?
    ORDER BY schedule
  `).all(hsCode + '%');

  return NextResponse.json(exclusions);
}
