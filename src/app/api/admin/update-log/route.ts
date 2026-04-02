import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

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
    const url = request.nextUrl;
    const source = url.searchParams.get('source');
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 500);
    const offset = parseInt(url.searchParams.get('offset') ?? '0', 10);

    const db = getDb();

    let rows;
    if (source) {
      rows = db
        .prepare(
          'SELECT * FROM update_log WHERE source_id = ? ORDER BY started_at DESC LIMIT ? OFFSET ?'
        )
        .all(source, limit, offset);
    } else {
      rows = db
        .prepare(
          'SELECT * FROM update_log ORDER BY started_at DESC LIMIT ? OFFSET ?'
        )
        .all(limit, offset);
    }

    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
