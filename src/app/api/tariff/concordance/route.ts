import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * GET /api/tariff/concordance?code=0101.10.00
 *
 * Bidirectional lookup in the `tariff_concordance` table populated from
 * the ABF TRFCCONC reference file. The file maps HS2022 (new) codes to
 * HS2017 (old) codes. We return matches in both directions so callers
 * can ask "what did this HS2022 code used to be?" and "what does this
 * old HS2017 code map to now?".
 *
 * Accepts either the formatted ("0101.10.00") or raw 8-digit
 * ("01011000") form of the code.
 *
 * Response:
 *   {
 *     code: "0101.10.00",
 *     new_code: "0101.10.00",   // the HS2022 form of the input
 *     old_codes: [ { code, code_raw, created_at } ], // HS2017 codes
 *                                                    //  mapped TO input
 *     new_codes: [ { code, code_raw, created_at } ], // HS2022 codes
 *                                                    //  mapped FROM input
 *   }
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json(
      { error: 'Missing ?code= parameter' },
      { status: 400 }
    );
  }

  const cleanCode = code.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '').trim();
  // Strip dots to get the raw 8-digit form
  const rawCode = cleanCode.replace(/\./g, '');
  const formatted =
    rawCode.length === 8
      ? `${rawCode.slice(0, 4)}.${rawCode.slice(4, 6)}.${rawCode.slice(6, 8)}`
      : cleanCode;

  const db = getDb();

  let oldCodes: any[] = [];
  let newCodes: any[] = [];

  try {
    // Input treated as HS2022 — find HS2017 codes that mapped TO it
    oldCodes = db
      .prepare(
        `SELECT old_code AS code_raw,
                old_code_formatted AS code,
                created_at
           FROM tariff_concordance
          WHERE new_code = ? OR new_code_formatted = ?
          ORDER BY old_code`
      )
      .all(rawCode, formatted) as any[];

    // Input treated as HS2017 — find HS2022 codes it maps FROM
    newCodes = db
      .prepare(
        `SELECT new_code AS code_raw,
                new_code_formatted AS code,
                created_at
           FROM tariff_concordance
          WHERE old_code = ? OR old_code_formatted = ?
          ORDER BY new_code`
      )
      .all(rawCode, formatted) as any[];
  } catch {
    // table may not exist yet
    oldCodes = [];
    newCodes = [];
  }

  return NextResponse.json({
    code: formatted,
    new_code: formatted,
    old_codes: oldCodes,
    new_codes: newCodes,
  });
}
