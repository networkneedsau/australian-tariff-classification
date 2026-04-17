import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function isAuthorized(request: NextRequest): boolean {
  const key = process.env.ADMIN_API_KEY;
  // Dev mode: if ADMIN_API_KEY is not set, allow all requests
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

  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || undefined;
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 500);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    const db = getDb();

    let query = 'SELECT * FROM audit_log';
    const params: any[] = [];

    if (action) {
      query += ' WHERE action = ?';
      params.push(action);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.prepare(query).all(...params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM audit_log';
    const countParams: any[] = [];
    if (action) {
      countQuery += ' WHERE action = ?';
      countParams.push(action);
    }
    const totalRow = db.prepare(countQuery).get(...countParams) as any;

    return NextResponse.json({
      logs: rows,
      total: totalRow?.total || 0,
      limit,
      offset,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
