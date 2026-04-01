import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');
  const scope = searchParams.get('scope') || 'all'; // 'all' | 'tariff' | 'act' | 'regulations'

  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  const db = getDb();

  const isCodeSearch = /^\d/.test(q);

  // ── Tariff classification results ──────────────────────────────
  let tariffResults: any[] = [];
  let tariffTotal = 0;

  if (scope === 'all' || scope === 'tariff') {
    if (isCodeSearch) {
      const pattern = q.replace(/\./g, '') + '%';
      const codePattern = q + '%';

      tariffTotal = (db.prepare(`
        SELECT COUNT(*) as count FROM tariff_classifications
        WHERE code LIKE ? OR replace(code, '.', '') LIKE ?
      `).get(codePattern, pattern) as any).count;

      tariffResults = db.prepare(`
        SELECT id, section_number, section_title, chapter_number, chapter_title,
               heading_code, heading_description, code, statistical_code,
               description, unit, duty_rate, duty_rate_numeric, is_free, tco_references
        FROM tariff_classifications
        WHERE code LIKE ? OR replace(code, '.', '') LIKE ?
        ORDER BY code
        LIMIT ? OFFSET ?
      `).all(codePattern, pattern, limit, offset) as any[];
    } else {
      const ftsQuery = q.split(/\s+/).map(w => `"${w}"*`).join(' ');

      try {
        tariffTotal = (db.prepare(`
          SELECT COUNT(*) as count FROM tariff_fts WHERE tariff_fts MATCH ?
        `).get(ftsQuery) as any).count;

        tariffResults = db.prepare(`
          SELECT c.id, c.section_number, c.section_title, c.chapter_number, c.chapter_title,
                 c.heading_code, c.heading_description, c.code, c.statistical_code,
                 c.description, c.unit, c.duty_rate, c.duty_rate_numeric, c.is_free, c.tco_references
          FROM tariff_fts f
          JOIN tariff_classifications c ON f.rowid = c.id
          WHERE tariff_fts MATCH ?
          ORDER BY rank
          LIMIT ? OFFSET ?
        `).all(ftsQuery, limit, offset) as any[];
      } catch {
        // fallback
      }
    }
  }

  // ── Customs Act results ────────────────────────────────────────
  let actResults: any[] = [];
  let actTotal = 0;

  if ((scope === 'all' || scope === 'act') && !isCodeSearch) {
    const like = `%${q}%`;
    try {
      actTotal = (db.prepare(`
        SELECT COUNT(*) as count FROM customs_act_sections
        WHERE section_title LIKE ? OR section_number LIKE ? OR part_title LIKE ? OR division_title LIKE ?
      `).get(like, like, like, like) as any).count;

      actResults = db.prepare(`
        SELECT * FROM customs_act_sections
        WHERE section_title LIKE ? OR section_number LIKE ? OR part_title LIKE ? OR division_title LIKE ?
        ORDER BY id
        LIMIT ?
      `).all(like, like, like, like, 10) as any[];
    } catch {
      // table may not exist
    }
  }

  // ── Prohibited Imports Regulations results ─────────────────────
  let regsResults: any[] = [];
  let regsTotal = 0;

  if ((scope === 'all' || scope === 'regulations') && !isCodeSearch) {
    const like = `%${q}%`;
    try {
      regsTotal = (db.prepare(`
        SELECT COUNT(*) as count FROM prohibited_imports_regs
        WHERE regulation_title LIKE ? OR regulation_number LIKE ? OR category LIKE ? OR part_title LIKE ?
      `).get(like, like, like, like) as any).count;

      regsResults = db.prepare(`
        SELECT * FROM prohibited_imports_regs
        WHERE regulation_title LIKE ? OR regulation_number LIKE ? OR category LIKE ? OR part_title LIKE ?
        ORDER BY id
        LIMIT ?
      `).all(like, like, like, like, 10) as any[];
    } catch {
      // table may not exist
    }
  }

  // ── Chemical Index results ──────────────────────────────────────
  let chemsResults: any[] = [];
  let chemsTotal = 0;

  if ((scope === 'all' || scope === 'chemicals') && !isCodeSearch) {
    const like = `%${q}%`;
    try {
      chemsTotal = (db.prepare(`
        SELECT COUNT(*) as count FROM chemical_index
        WHERE chemical_name LIKE ? OR cas_number LIKE ? OR category LIKE ? OR notes LIKE ?
      `).get(like, like, like, like) as any).count;

      chemsResults = db.prepare(`
        SELECT * FROM chemical_index
        WHERE chemical_name LIKE ? OR cas_number LIKE ? OR category LIKE ? OR notes LIKE ?
        ORDER BY cwc_schedule, id
        LIMIT ?
      `).all(like, like, like, like, 10) as any[];
    } catch {
      // table may not exist
    }
  }

  return NextResponse.json({
    query: q,
    total: tariffTotal,
    limit,
    offset,
    results: tariffResults.map((r: any) => ({
      ...r,
      is_free: !!r.is_free,
      tco_references: r.tco_references ? JSON.parse(r.tco_references) : [],
    })),
    actResults,
    actTotal,
    regsResults,
    regsTotal,
    chemsResults,
    chemsTotal,
  });
}
