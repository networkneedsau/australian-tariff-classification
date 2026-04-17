import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export type UpdateStream = 'daily' | 'library';

export interface DailyUpdateRow {
  id: string;
  owner: string;
  topic: string;
  topic_href: string | null;
  date: string; // ISO yyyy-mm-dd or full timestamp — UI sorts on this string
  comments: string;
  source: string; // logical source id: customs_notices | dumping_notices | change_alerts | update_log | customs_act_sections
  stream: UpdateStream;
}

interface SqliteRow {
  [column: string]: unknown;
}

const toISODate = (value: unknown): string => {
  if (!value) return '';
  const s = String(value);
  // normalise 'YYYY-MM-DD HH:MM:SS' -> 'YYYY-MM-DDTHH:MM:SSZ'
  return s.includes(' ') ? s.replace(' ', 'T') : s;
};

const iso = (d: Date) => d.toISOString().slice(0, 10);

function clampLimit(v: string | null, fallback: number, max: number): number {
  const n = v ? parseInt(v, 10) : NaN;
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

/**
 * GET /api/daily-updates
 * Returns a combined, chronological feed of recent activity across sources.
 *
 * Query params:
 *   ?from=YYYY-MM-DD       — earliest date (inclusive)
 *   ?to=YYYY-MM-DD         — latest date (inclusive)
 *   ?owner=DAFF            — filter by owner column
 *   ?topic=chicken         — LIKE match against topic
 *   ?limit=100             — max rows (default 100, max 500)
 *   ?stream=daily|library  — default 'daily'. 'library' only surfaces library (update_log) activity
 */
export async function GET(request: NextRequest) {
  const db = getDb();
  const params = request.nextUrl.searchParams;

  const streamParam = (params.get('stream') || 'daily').toLowerCase();
  const stream: UpdateStream = streamParam === 'library' ? 'library' : 'daily';
  const from = params.get('from'); // YYYY-MM-DD
  const to = params.get('to');     // YYYY-MM-DD
  const owner = params.get('owner');
  const topic = params.get('topic');
  const limit = clampLimit(params.get('limit'), 100, 500);

  // Default window: last 30 days if no from/to is supplied.
  const defaultFrom = new Date();
  defaultFrom.setDate(defaultFrom.getDate() - 30);
  const effectiveFrom = from || iso(defaultFrom);
  const effectiveTo = to || iso(new Date());

  const rows: DailyUpdateRow[] = [];

  // Helper: build LIKE patterns safely.
  const ownerLike = owner ? `%${owner}%` : null;
  const topicLike = topic ? `%${topic}%` : null;

  const inRange = (dateIso: string): boolean => {
    if (!dateIso) return false;
    const d = dateIso.slice(0, 10);
    return d >= effectiveFrom && d <= effectiveTo;
  };

  const passesFilters = (row: DailyUpdateRow): boolean => {
    if (ownerLike && !row.owner.toLowerCase().includes(owner!.toLowerCase())) return false;
    if (topicLike && !row.topic.toLowerCase().includes(topic!.toLowerCase())) return false;
    return inRange(row.date);
  };

  // ── update_log (always shown — canonical library-update feed) ─────
  try {
    const logRows = db.prepare(`
      SELECT id, source_id, started_at, completed_at, status,
             records_added, records_removed, records_modified, details
      FROM update_log
      WHERE started_at >= ? AND started_at <= ?
      ORDER BY started_at DESC
      LIMIT ?
    `).all(effectiveFrom, effectiveTo + 'T23:59:59', limit) as SqliteRow[];

    for (const r of logRows) {
      const added = Number(r.records_added ?? 0);
      const removed = Number(r.records_removed ?? 0);
      const modified = Number(r.records_modified ?? 0);
      const bits: string[] = [];
      if (added) bits.push(`${added} added`);
      if (removed) bits.push(`${removed} removed`);
      if (modified) bits.push(`${modified} modified`);
      const summary = bits.length > 0
        ? bits.join(', ')
        : (r.status ? `Status: ${r.status}` : 'Update recorded');

      rows.push({
        id: `log:${r.id}`,
        owner: 'SYSTEM',
        topic: `Library update — ${r.source_id}`,
        topic_href: null,
        date: toISODate(r.started_at),
        comments: summary,
        source: 'update_log',
        stream: 'library',
      });
    }
  } catch {
    /* table absent or empty — skip */
  }

  if (stream === 'daily') {
    // ── change_alerts ───────────────────────────────────────────────
    try {
      const alertRows = db.prepare(`
        SELECT id, source_id, change_type, tariff_code, summary, details, created_at
        FROM change_alerts
        WHERE created_at >= ? AND created_at <= ?
        ORDER BY created_at DESC
        LIMIT ?
      `).all(effectiveFrom, effectiveTo + 'T23:59:59', limit) as SqliteRow[];

      for (const r of alertRows) {
        rows.push({
          id: `alert:${r.id}`,
          owner: 'ABF',
          topic: String(r.summary ?? r.change_type ?? 'Change alert'),
          topic_href: null,
          date: toISODate(r.created_at),
          comments: String(r.details ?? r.source_id ?? ''),
          source: 'change_alerts',
          stream: 'daily',
        });
      }
    } catch {
      /* skip */
    }

    // ── customs_notices (ACN) — owner = ABF ────────────────────────
    try {
      // customs_notices has no created_at timestamp, but effective_date works.
      // Fall back to year if no effective_date is supplied.
      const noticeRows = db.prepare(`
        SELECT id, notice_number, title, year, category, summary, effective_date
        FROM customs_notices
        ORDER BY COALESCE(effective_date, year || '-01-01') DESC
        LIMIT ?
      `).all(limit) as SqliteRow[];

      for (const r of noticeRows) {
        const dateStr = String(r.effective_date || `${r.year}-01-01`);
        rows.push({
          id: `acn:${r.id}`,
          owner: 'ABF',
          topic: `ACN ${r.notice_number}: ${r.title}`,
          topic_href: null,
          date: dateStr,
          comments: String(r.summary ?? r.category ?? ''),
          source: 'customs_notices',
          stream: 'daily',
        });
      }
    } catch {
      /* skip */
    }

    // ── dumping_notices — owner = ADC ──────────────────────────────
    try {
      const dumpingRows = db.prepare(`
        SELECT id, commodity, countries, measure_type, status, category, notes, expiry_info
        FROM dumping_notices
        ORDER BY id DESC
        LIMIT ?
      `).all(limit) as SqliteRow[];

      const today = iso(new Date());
      for (const r of dumpingRows) {
        rows.push({
          id: `dumping:${r.id}`,
          owner: 'ADC',
          topic: `${r.measure_type}: ${r.commodity} (${r.countries})`,
          topic_href: null,
          // dumping_notices has no timestamp — pin to today so it always shows
          date: today,
          comments: String(r.status ?? r.notes ?? r.expiry_info ?? ''),
          source: 'dumping_notices',
          stream: 'daily',
        });
      }
    } catch {
      /* skip */
    }

    // ── customs_act_sections — surface a few recent entries as DAFF feed filler ──
    try {
      const actRows = db.prepare(`
        SELECT id, section_number, section_title, part_title
        FROM customs_act_sections
        ORDER BY id DESC
        LIMIT 25
      `).all() as SqliteRow[];

      const today = iso(new Date());
      for (const r of actRows) {
        rows.push({
          id: `cas:${r.id}`,
          owner: 'DAFF',
          topic: `Customs Act s.${r.section_number} — ${r.section_title}`,
          topic_href: null,
          date: today,
          comments: String(r.part_title ?? ''),
          source: 'customs_act_sections',
          stream: 'daily',
        });
      }
    } catch {
      /* skip */
    }
  }

  // Apply filters & sort
  const filtered = rows
    .filter(passesFilters)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, limit);

  return NextResponse.json({
    rows: filtered,
    total: filtered.length,
    from: effectiveFrom,
    to: effectiveTo,
    stream,
  });
}
