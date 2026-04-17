import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { logAudit } from '@/lib/audit';

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

  // Query prohibited goods flags for this code
  const chapter = cleanCode.replace(/\D/g, '').substring(0, 2);
  const prohibitedRows = db.prepare(`
    SELECT * FROM prohibited_goods_map
    WHERE
      (? >= tariff_code_start AND (tariff_code_end IS NULL OR ? <= tariff_code_end))
      OR (? LIKE tariff_code_start || '%')
      OR (? LIKE tariff_code_start || '%')
  `).all(cleanCode, cleanCode, cleanCode, chapter) as any[];

  const seenProhibited = new Set<number>();
  const prohibited_flags = prohibitedRows.filter(r => {
    if (seenProhibited.has(r.id)) return false;
    seenProhibited.add(r.id);
    return true;
  });

  // Query permit requirements for this code
  const permitRows = db.prepare(`
    SELECT * FROM permit_requirements
    WHERE
      (? >= tariff_code_start AND (tariff_code_end IS NULL OR ? <= tariff_code_end))
      OR (? LIKE tariff_code_start || '%')
      OR (? LIKE tariff_code_start || '%')
  `).all(cleanCode, cleanCode, cleanCode, chapter) as any[];

  const seenPermit = new Set<number>();
  const permit_requirements = permitRows.filter(r => {
    if (seenPermit.has(r.id)) return false;
    seenPermit.add(r.id);
    return true;
  }).map(r => ({
    agency: r.agency,
    permit_type: r.permit_type,
    description: r.description,
    link_url: r.link_url,
    notes: r.notes,
  }));

  // Look up international HS description from hs_descriptions using 6-digit prefix
  const hsPrefix = cleanCode.replace(/\D/g, '').substring(0, 6);
  let hs_description: string | null = null;
  let hs_section: string | null = null;
  let hs_chapter: string | null = null;

  try {
    const hsRow = db.prepare(`
      SELECT description, section FROM hs_descriptions
      WHERE hs_code = ? AND level = 6
      LIMIT 1
    `).get(hsPrefix) as { description: string; section: string } | undefined;

    if (hsRow) {
      hs_description = hsRow.description;
      hs_section = hsRow.section;
    }

    // Get chapter description
    const chapterCode = hsPrefix.substring(0, 2);
    const chapterRow = db.prepare(`
      SELECT description FROM hs_descriptions
      WHERE hs_code = ? AND level = 2
      LIMIT 1
    `).get(chapterCode) as { description: string } | undefined;

    if (chapterRow) {
      hs_chapter = chapterRow.description;
    }
  } catch { /* hs_descriptions may not be populated */ }

  // Query TCO links from tco_tariff_links table
  let tco_links: { tco_number: string; linked_at: string }[] = [];
  try {
    tco_links = db.prepare(`
      SELECT tco_number, linked_at
      FROM tco_tariff_links
      WHERE tariff_code = ?
      ORDER BY tco_number
    `).all(cleanCode) as { tco_number: string; linked_at: string }[];
  } catch { /* table may not exist */ }

  logAudit('classification_lookup', { code: cleanCode }, request);

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

    // International HS description
    hs_description,
    hs_section,
    hs_chapter,

    // TCO references (legacy JSON field)
    tco_references: item.tco_references ? JSON.parse(item.tco_references) : [],

    // TCO links (from tco_tariff_links table)
    tco_links,

    // FTA information for preference rate selection
    fta_exclusions: ftaExclusions,

    // Prohibited/restricted goods flags
    prohibited_flags,

    // Permit requirements
    permit_requirements,

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
