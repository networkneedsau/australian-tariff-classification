import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// ── Types ────────────────────────────────────────────────────────────

interface FtaRate {
  fta_name: string;
  schedule: string;
  duty_rate_text: string;
  duty_rate_numeric: number;
  duty_amount: number;
  gst_amount: number;
  total: number;
  savings_vs_general: number;
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Parse a duty rate string like "5%", "Free", "5.0%" into a numeric %.
 * Returns 0 for "Free", null if unparseable.
 */
function parseDutyRate(rate: string | null | undefined): number | null {
  if (!rate) return null;
  const cleaned = rate.trim().toLowerCase();
  if (cleaned === 'free' || cleaned === '0' || cleaned === '0%') return 0;
  const match = cleaned.match(/([\d.]+)\s*%/);
  if (match) return parseFloat(match[1]);
  // Try bare number
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

// ── GET handler ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code')?.trim();
  const country = searchParams.get('country')?.trim();
  const valueStr = searchParams.get('value');

  if (!code) {
    return NextResponse.json({ error: 'Missing required parameter: code' }, { status: 400 });
  }
  if (!valueStr) {
    return NextResponse.json({ error: 'Missing required parameter: value' }, { status: 400 });
  }

  const customsValue = parseFloat(valueStr);
  if (isNaN(customsValue) || customsValue < 0) {
    return NextResponse.json({ error: 'Invalid value parameter' }, { status: 400 });
  }

  const db = getDb();

  // 1. Look up the base tariff
  const tariff = db.prepare(`
    SELECT code, description, duty_rate, duty_rate_numeric, unit
    FROM tariff_classifications
    WHERE code = ?
  `).get(code) as {
    code: string;
    description: string;
    duty_rate: string | null;
    duty_rate_numeric: number | null;
    unit: string | null;
  } | undefined;

  if (!tariff) {
    return NextResponse.json({ error: `Tariff code not found: ${code}` }, { status: 404 });
  }

  // 2. Parse the general duty rate
  const generalRateNumeric = parseDutyRate(tariff.duty_rate) ?? tariff.duty_rate_numeric ?? 0;
  const generalDutyAmount = customsValue * (generalRateNumeric / 100);
  const generalGst = (customsValue + generalDutyAmount) * 0.10;
  const generalTotal = customsValue + generalDutyAmount + generalGst;

  // 3. Find which FTA schedules apply to the country
  let countrySchedules: string[] = [];
  if (country) {
    const countryRows = db.prepare(`
      SELECT schedule FROM tariff_countries
      WHERE abbreviation = ? OR country LIKE ?
    `).all(country, `%${country}%`) as { schedule: string }[];

    countrySchedules = countryRows
      .map((r) => r.schedule)
      .filter((s) => s && s.trim().length > 0);
  }

  // 4. Query FTA exclusions matching the HS code prefix (first 7 chars)
  const hsPrefix = code.replace(/\./g, '').substring(0, 6);
  const codePrefixDotted = code.substring(0, 7); // e.g. "8471.30"

  const ftaExclusions = db.prepare(`
    SELECT schedule, fta_name, hs_code, description, duty_rate
    FROM tariff_fta_exclusions
    WHERE hs_code LIKE ? OR hs_code LIKE ?
    ORDER BY schedule
  `).all(codePrefixDotted + '%', hsPrefix + '%') as {
    schedule: string;
    fta_name: string;
    hs_code: string;
    description: string;
    duty_rate: string | null;
  }[];

  // 5. Calculate rates for each FTA
  const ftaRates: FtaRate[] = [];

  for (const exc of ftaExclusions) {
    const rate = parseDutyRate(exc.duty_rate);
    if (rate === null) continue; // skip unparseable

    const dutyAmount = customsValue * (rate / 100);
    const gst = (customsValue + dutyAmount) * 0.10;
    const total = customsValue + dutyAmount + gst;
    const savings = generalTotal - total;

    ftaRates.push({
      fta_name: exc.fta_name,
      schedule: exc.schedule,
      duty_rate_text: exc.duty_rate || 'Free',
      duty_rate_numeric: rate,
      duty_amount: Math.round(dutyAmount * 100) / 100,
      gst_amount: Math.round(gst * 100) / 100,
      total: Math.round(total * 100) / 100,
      savings_vs_general: Math.round(savings * 100) / 100,
    });
  }

  // Sort cheapest first
  ftaRates.sort((a, b) => a.total - b.total);

  // Mark best rate
  const bestIndex = ftaRates.length > 0 ? 0 : -1;

  return NextResponse.json({
    tariff_code: tariff.code,
    description: tariff.description,
    unit: tariff.unit,
    customs_value: customsValue,
    country: country || null,
    country_schedules: countrySchedules,
    general_rate: {
      duty_rate_text: tariff.duty_rate || 'Free',
      duty_rate_numeric: generalRateNumeric,
      duty_amount: Math.round(generalDutyAmount * 100) / 100,
      gst_amount: Math.round(generalGst * 100) / 100,
      total: Math.round(generalTotal * 100) / 100,
    },
    fta_rates: ftaRates.map((r, i) => ({
      ...r,
      is_best: i === bestIndex,
    })),
    best_rate: bestIndex >= 0 ? ftaRates[bestIndex] : null,
  });
}
