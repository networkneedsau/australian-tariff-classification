import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface SourceConfig {
  id: string;
  table: string;
  label: string;
  searchCols: string[];
}

const SOURCES: SourceConfig[] = [
  { id: 'schedule3', table: 'tariff_classifications', label: 'Schedule 3 — Classification of Goods', searchCols: ['code', 'description'] },
  { id: 'tco', table: 'tariff_concession_orders', label: 'Tariff Concession Orders', searchCols: ['item_title', 'description', 'detail'] },
  { id: 'customs_act', table: 'customs_act_sections', label: 'Customs Act 1901', searchCols: ['section_title', 'content'] },
  { id: 'customs_reg', table: 'customs_regulation', label: 'Customs Regulation 2015', searchCols: ['regulation_title', 'content'] },
  { id: 'customs_tariff_act', table: 'customs_tariff_act', label: 'Customs Tariff Act 1995', searchCols: ['section_title', 'content'] },
  { id: 'pir', table: 'prohibited_imports_regs', label: 'Prohibited Imports Regulations 1956', searchCols: ['regulation_title', 'content'] },
  { id: 'per', table: 'prohibited_exports_regs', label: 'Prohibited Exports Regulations 1958', searchCols: ['regulation_title', 'content'] },
  { id: 'gst_act', table: 'gst_act', label: 'GST Act 1999', searchCols: ['division_title', 'content'] },
  { id: 'anti_dumping', table: 'anti_dumping_act', label: 'Anti-Dumping Act 1975', searchCols: ['section_title', 'content'] },
  { id: 'dumping_notices', table: 'dumping_notices', label: 'Anti-Dumping Notices', searchCols: ['commodity', 'countries', 'duty_info'] },
  { id: 'customs_notices', table: 'customs_notices', label: 'Australian Customs Notices', searchCols: ['title', 'summary'] },
  { id: 'chemicals', table: 'chemical_index', label: 'Chemical Index', searchCols: ['chemical_name', 'cas_number'] },
  { id: 'ahecc', table: 'ahecc_chapters', label: 'AHECC Export Classification', searchCols: ['chapter_title', 'section_title'] },
  { id: 'biosecurity', table: 'biosecurity_act', label: 'Biosecurity Act 2015', searchCols: ['part_title', 'content'] },
  { id: 'illegal_logging', table: 'illegal_logging_act', label: 'Illegal Logging Act 2012', searchCols: ['section_title', 'content'] },
  { id: 'imported_food', table: 'imported_food_act', label: 'Imported Food Control Act 1992', searchCols: ['section_title', 'content'] },
  { id: 'trade_desc', table: 'trade_desc_act', label: 'Trade Descriptions Act 1905', searchCols: ['section_title', 'content'] },
  { id: 'precedents', table: 'tariff_precedents', label: 'Tariff Precedents', searchCols: ['goods_description', 'tariff_classification', 'reasoning'] },
  { id: 'compendium', table: 'classification_compendium', label: 'Classification Compendium', searchCols: ['section_title', 'example_opinion'] },
  { id: 'alpha_index', table: 'alpha_index', label: 'HS Alphabetical Index', searchCols: ['goods_description', 'hs_code'] },
  { id: 'hsen', table: 'hsen', label: 'HS Explanatory Notes', searchCols: ['section_title', 'scope', 'key_notes'] },
  { id: 'cbp_rulings', table: 'cbp_rulings', label: 'US CBP CROSS Rulings', searchCols: ['item_title', 'description'] },
  { id: 'aqis', table: 'aqis_producers', label: 'AQIS Approved Establishments', searchCols: ['item_title', 'description'] },
  { id: 'cp_questions', table: 'cp_questions', label: 'Community Protection Questions', searchCols: ['question_text', 'category'] },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim();
  const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 50);

  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 });
  }

  const db = getDb();
  const like = `%${q}%`;

  const results: { id: string; label: string; count: number }[] = [];

  for (const source of SOURCES) {
    try {
      const whereClauses = source.searchCols.map((col) => `${col} LIKE ?`).join(' OR ');
      const params = source.searchCols.map(() => like);
      const sql = `SELECT COUNT(*) as count FROM ${source.table} WHERE ${whereClauses}`;
      const row = db.prepare(sql).get(...params) as { count: number } | undefined;
      const count = row?.count ?? 0;
      if (count > 0) {
        results.push({ id: source.id, label: source.label, count });
      }
    } catch {
      // Table may not exist — skip silently
    }
  }

  // Sort by count descending
  results.sort((a, b) => b.count - a.count);

  // Apply limit
  const limited = limit > 0 ? results.slice(0, limit) : results;

  return NextResponse.json({
    query: q,
    sources: limited,
  });
}
