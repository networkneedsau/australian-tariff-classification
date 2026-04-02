import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/tariff/tco-links?tco=25/13         → tariff codes for a TCO number
// GET /api/tariff/tco-links?code=8471.30.00   → TCO numbers for a tariff code
// POST /api/tariff/tco-links                  → create a new link { tco_number, tariff_code }
// DELETE /api/tariff/tco-links                → remove a link { tco_number, tariff_code }

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tco = searchParams.get('tco');
  const code = searchParams.get('code');
  const db = getDb();

  if (tco) {
    // Find all tariff codes linked to this TCO number
    const links = db.prepare(`
      SELECT l.tariff_code, l.tariff_description, l.linked_at,
             c.duty_rate, c.unit, c.is_free, c.section_number, c.section_title,
             c.chapter_number, c.chapter_title, c.heading_code, c.statistical_code
      FROM tco_tariff_links l
      LEFT JOIN tariff_classifications c ON c.code = l.tariff_code
      WHERE l.tco_number = ?
      ORDER BY l.tariff_code
    `).all(tco);

    return NextResponse.json({
      tco_number: tco,
      tariff_codes: links,
      count: links.length,
    });
  }

  if (code) {
    // Find all TCO numbers linked to this tariff code
    const links = db.prepare(`
      SELECT l.tco_number, l.linked_at
      FROM tco_tariff_links l
      WHERE l.tariff_code = ?
      ORDER BY l.tco_number
    `).all(code);

    // Also get the classification info
    const classification = db.prepare(`
      SELECT code, description, duty_rate, unit, section_number, section_title,
             chapter_number, chapter_title
      FROM tariff_classifications WHERE code = ? LIMIT 1
    `).get(code);

    return NextResponse.json({
      tariff_code: code,
      classification,
      tco_numbers: links,
      count: links.length,
    });
  }

  // No params: return summary of all links
  const summary = db.prepare(`
    SELECT tco_number, COUNT(*) as tariff_count
    FROM tco_tariff_links
    GROUP BY tco_number
    ORDER BY tco_number
  `).all();

  const totalLinks = db.prepare('SELECT COUNT(*) as c FROM tco_tariff_links').get() as any;

  return NextResponse.json({
    total_links: totalLinks?.c || 0,
    tco_summary: summary,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { tco_number, tariff_code } = body as { tco_number: string; tariff_code: string };

  if (!tco_number || !tariff_code) {
    return NextResponse.json({ error: 'tco_number and tariff_code are required' }, { status: 400 });
  }

  const db = getDb();

  // Get description from classification
  const cls = db.prepare('SELECT description FROM tariff_classifications WHERE code = ? LIMIT 1').get(tariff_code) as any;

  try {
    db.prepare(
      'INSERT OR IGNORE INTO tco_tariff_links (tco_number, tariff_code, tariff_description) VALUES (?, ?, ?)'
    ).run(tco_number.trim(), tariff_code.trim(), cls?.description || null);

    // Also update tco_references in the classification
    const existing = db.prepare('SELECT tco_references FROM tariff_classifications WHERE code = ?').get(tariff_code) as any;
    if (existing) {
      const refs: string[] = existing.tco_references ? JSON.parse(existing.tco_references) : [];
      if (!refs.includes(tco_number.trim())) {
        refs.push(tco_number.trim());
        db.prepare('UPDATE tariff_classifications SET tco_references = ? WHERE code = ?')
          .run(JSON.stringify(refs), tariff_code);
      }
    }

    return NextResponse.json({ status: 'linked', tco_number, tariff_code });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const body = await request.json();
  const { tco_number, tariff_code } = body as { tco_number: string; tariff_code: string };

  if (!tco_number || !tariff_code) {
    return NextResponse.json({ error: 'tco_number and tariff_code are required' }, { status: 400 });
  }

  const db = getDb();

  db.prepare('DELETE FROM tco_tariff_links WHERE tco_number = ? AND tariff_code = ?')
    .run(tco_number.trim(), tariff_code.trim());

  // Also update tco_references in the classification
  const existing = db.prepare('SELECT tco_references FROM tariff_classifications WHERE code = ?').get(tariff_code) as any;
  if (existing?.tco_references) {
    const refs: string[] = JSON.parse(existing.tco_references).filter((r: string) => r !== tco_number.trim());
    db.prepare('UPDATE tariff_classifications SET tco_references = ? WHERE code = ?')
      .run(refs.length > 0 ? JSON.stringify(refs) : null, tariff_code);
  }

  return NextResponse.json({ status: 'unlinked', tco_number, tariff_code });
}
