import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { updateSchedule } from '@/lib/updater/update-scheduler';

function isAuthorized(request: NextRequest): boolean {
  const key = process.env.ADMIN_API_KEY;
  if (!key) return true;

  const auth = request.headers.get('Authorization');
  if (!auth) return false;

  const [scheme, token] = auth.split(' ');
  return scheme === 'Bearer' && token === key;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const rows = db
      .prepare(
        'SELECT source_id, schedule_cron, schedule_enabled FROM update_status ORDER BY source_id'
      )
      .all();

    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { source, cron, enabled } = body as {
      source: string;
      cron?: string;
      enabled?: boolean;
    };

    if (!source) {
      return NextResponse.json(
        { error: 'Missing required field: source' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check the source exists
    const existing = db
      .prepare('SELECT source_id FROM update_status WHERE source_id = ?')
      .get(source);

    if (!existing) {
      return NextResponse.json(
        { error: `Source not found: ${source}` },
        { status: 404 }
      );
    }

    // Update schedule fields in database
    if (cron !== undefined) {
      db.prepare('UPDATE update_status SET schedule_cron = ? WHERE source_id = ?').run(
        cron,
        source
      );
    }
    if (enabled !== undefined) {
      db.prepare(
        'UPDATE update_status SET schedule_enabled = ? WHERE source_id = ?'
      ).run(enabled ? 1 : 0, source);
    }

    // Read back the current state
    const row = db
      .prepare(
        'SELECT source_id, schedule_cron, schedule_enabled FROM update_status WHERE source_id = ?'
      )
      .get(source) as { source_id: string; schedule_cron: string | null; schedule_enabled: number };

    // Update the live scheduler
    updateSchedule(
      row.source_id,
      row.schedule_cron ?? undefined,
      row.schedule_enabled === 1
    );

    return NextResponse.json({
      status: 'updated',
      source: row.source_id,
      schedule_cron: row.schedule_cron,
      schedule_enabled: row.schedule_enabled === 1,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
