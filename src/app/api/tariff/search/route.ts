import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  const db = getDb();

  // Determine if searching by code or description
  const isCodeSearch = /^\d/.test(q);

  let results;
  let total: number;

  if (isCodeSearch) {
    // Search by HS code prefix
    const pattern = q.replace(/\./g, '') + '%';
    const codePattern = q + '%';

    total = (db.prepare(`
      SELECT COUNT(*) as count FROM tariff_classifications
      WHERE code LIKE ? OR replace(code, '.', '') LIKE ?
    `).get(codePattern, pattern) as any).count;

    results = db.prepare(`
      SELECT id, section_number, section_title, chapter_number, chapter_title,
             heading_code, heading_description, code, statistical_code,
             description, unit, duty_rate, duty_rate_numeric, is_free, tco_references
      FROM tariff_classifications
      WHERE code LIKE ? OR replace(code, '.', '') LIKE ?
      ORDER BY code
      LIMIT ? OFFSET ?
    `).all(codePattern, pattern, limit, offset);
  } else {
    // Full-text search on description
    const ftsQuery = q.split(/\s+/).map(w => `"${w}"*`).join(' ');

    total = (db.prepare(`
      SELECT COUNT(*) as count FROM tariff_fts WHERE tariff_fts MATCH ?
    `).get(ftsQuery) as any).count;

    results = db.prepare(`
      SELECT c.id, c.section_number, c.section_title, c.chapter_number, c.chapter_title,
             c.heading_code, c.heading_description, c.code, c.statistical_code,
             c.description, c.unit, c.duty_rate, c.duty_rate_numeric, c.is_free, c.tco_references
      FROM tariff_fts f
      JOIN tariff_classifications c ON f.rowid = c.id
      WHERE tariff_fts MATCH ?
      ORDER BY rank
      LIMIT ? OFFSET ?
    `).all(ftsQuery, limit, offset);
  }

  return NextResponse.json({
    query: q,
    total,
    limit,
    offset,
    results: (results as any[]).map(r => ({
      ...r,
      is_free: !!r.is_free,
      tco_references: r.tco_references ? JSON.parse(r.tco_references) : [],
    })),
  });
}
