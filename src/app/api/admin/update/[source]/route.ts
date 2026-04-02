import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getUpdater } from '@/lib/updater/update-registry';

function isAuthorized(request: NextRequest): boolean {
  const key = process.env.ADMIN_API_KEY;
  if (!key) return true;

  const auth = request.headers.get('Authorization');
  if (!auth) return false;

  const [scheme, token] = auth.split(' ');
  return scheme === 'Bearer' && token === key;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { source } = await params;

  try {
    const db = getDb();
    const row = db
      .prepare('SELECT * FROM update_status WHERE source_id = ?')
      .get(source);

    if (!row) {
      return NextResponse.json(
        { error: `Source not found: ${source}` },
        { status: 404 }
      );
    }

    return NextResponse.json(row);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { source } = await params;

  try {
    const updater = getUpdater(source);
    if (!updater) {
      return NextResponse.json(
        { error: `Unknown source: ${source}` },
        { status: 404 }
      );
    }

    let force = false;
    try {
      const body = await request.json();
      force = body?.force ?? false;
    } catch {
      // No body or invalid JSON -- default force=false
    }

    // Fire and forget -- don't await
    updater.run(force).catch((err) => {
      console.error(`[admin/update/${source}] error:`, err);
    });

    return NextResponse.json({ status: 'started', source });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
