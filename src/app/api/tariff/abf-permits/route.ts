import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * GET /api/tariff/abf-permits?code=XXXX.XX.XX[&includeExpired=1]
 *
 * Returns agency permit requirements for a tariff code from the
 * ABF-sourced `permit_requirements_abf` table (populated by PRMTRQMT),
 * and also joins in any matches from the curated `permit_requirements`
 * table so the caller gets the full picture.
 *
 * Response:
 *   {
 *     code: "0101.10.20",
 *     abf_permits: [ ... ],   // from permit_requirements_abf
 *     curated_permits: [ ... ], // from permit_requirements
 *     total: number
 *   }
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const includeExpired =
    request.nextUrl.searchParams.get('includeExpired') === '1';

  if (!code) {
    return NextResponse.json(
      { error: 'Missing ?code= parameter' },
      { status: 400 }
    );
  }

  const cleanCode = code.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '').trim();
  const db = getDb();

  // ── ABF permits (exact code match, plus 8-digit fallback) ──────────
  const activeClause = includeExpired ? '' : 'AND is_active = 1';

  let abfPermits: any[] = [];
  try {
    abfPermits = db
      .prepare(
        `SELECT
           id,
           tariff_code,
           agency_code,
           agency_name,
           start_date,
           end_date,
           required_flag,
           is_active,
           source
         FROM permit_requirements_abf
         WHERE tariff_code = ?
           ${activeClause}
         ORDER BY agency_code, start_date DESC`
      )
      .all(cleanCode) as any[];
  } catch {
    abfPermits = [];
  }

  // ── Curated permits (range + prefix match, like /permits endpoint) ──
  let curatedPermits: any[] = [];
  try {
    const chapter = cleanCode.replace(/\D/g, '').substring(0, 2);
    const rows = db
      .prepare(
        `SELECT * FROM permit_requirements
         WHERE
           (? >= tariff_code_start AND (tariff_code_end IS NULL OR ? <= tariff_code_end))
           OR (? LIKE tariff_code_start || '%')
           OR (? LIKE tariff_code_start || '%')`
      )
      .all(cleanCode, cleanCode, cleanCode, chapter) as any[];

    const seen = new Set<number>();
    curatedPermits = rows
      .filter((r) => {
        if (seen.has(r.id)) return false;
        seen.add(r.id);
        return true;
      })
      .map((r) => ({
        agency: r.agency,
        permit_type: r.permit_type,
        description: r.description,
        link_url: r.link_url,
        notes: r.notes,
      }));
  } catch {
    curatedPermits = [];
  }

  return NextResponse.json({
    code: cleanCode,
    abf_permits: abfPermits,
    curated_permits: curatedPermits,
    total: abfPermits.length + curatedPermits.length,
  });
}
