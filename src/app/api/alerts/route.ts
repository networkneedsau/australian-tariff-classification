import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

function isAuthorized(request: NextRequest): boolean {
  const key = process.env.ADMIN_API_KEY;
  if (!key) return true; // Dev mode
  const auth = request.headers.get('Authorization');
  if (!auth) return false;
  const [scheme, token] = auth.split(' ');
  return scheme === 'Bearer' && token === key;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  const unread = request.nextUrl.searchParams.get('unread');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20', 10);
  const offset = parseInt(request.nextUrl.searchParams.get('offset') || '0', 10);

  let whereClause = '';
  if (unread === 'true') {
    whereClause = 'WHERE is_read = 0';
  }

  const total = (db.prepare(
    `SELECT COUNT(*) as c FROM change_alerts ${whereClause}`
  ).get() as any).c;

  const alerts = db.prepare(
    `SELECT * FROM change_alerts ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all(limit, offset);

  return NextResponse.json({ alerts, total, limit, offset });
}

export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const ids: number[] = body.ids;

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'Body must contain ids: number[]' }, { status: 400 });
  }

  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  const result = db.prepare(
    `UPDATE change_alerts SET is_read = 1 WHERE id IN (${placeholders})`
  ).run(...ids);

  return NextResponse.json({ updated: result.changes });
}
