import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Returns all fields needed to populate a customs entry line
// when a tariff code is selected
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const db = getDb();

  // Find exact match or prefix match
  const cleanCode = code.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '').trim();

  const item = db.prepare(`
    SELECT * FROM tariff_classifications
    WHERE code = ? OR (code || '.' || COALESCE(statistical_code, '')) = ?
    LIMIT 1
  `).get(cleanCode, cleanCode) as any;

  if (!item) {
    return NextResponse.json({ error: 'Tariff code not found' }, { status: 404 });
  }

  // Get FTA exclusions for this code
  const codePrefix = cleanCode.substring(0, 7); // e.g. "0101.21"
  const ftaExclusions = db.prepare(`
    SELECT schedule, fta_name, hs_code, duty_rate
    FROM tariff_fta_exclusions
    WHERE hs_code LIKE ?
    ORDER BY schedule
  `).all(codePrefix + '%');

  // Get country of origin data for preference rates
  const countries = db.prepare(`
    SELECT country, abbreviation, schedule, category
    FROM tariff_countries
    ORDER BY country
  `).all();

  return NextResponse.json({
    // Core tariff fields for customs entry
    tariff_code: item.code,
    statistical_code: item.statistical_code,
    description: item.description,
    unit_of_measure: item.unit,
    duty_rate: item.duty_rate,
    duty_rate_numeric: item.duty_rate_numeric,
    is_free: !!item.is_free,

    // Classification hierarchy
    section: { number: item.section_number, title: item.section_title },
    chapter: { number: item.chapter_number, title: item.chapter_title },
    heading: { code: item.heading_code, description: item.heading_description },

    // TCO references
    tco_references: item.tco_references ? JSON.parse(item.tco_references) : [],

    // FTA information for preference rate selection
    fta_exclusions: ftaExclusions,

    // Customs entry fields to auto-populate
    customs_entry_fields: {
      tariff_classification_code: item.code,
      tariff_stat_code: item.statistical_code || '',
      goods_description: item.description,
      unit_of_quantity: item.unit || 'NO',
      general_duty_rate: item.duty_rate || 'Free',
      duty_payable: item.is_free ? 0 : null, // null = needs calculation
      gst_applicable: true,
      gst_rate: 10, // Standard AU GST rate
    },
  });
}
