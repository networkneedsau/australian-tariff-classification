import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAllUpdaters, getUpdater, runAll, getStatus } from '@/lib/updater/update-registry';

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

  try {
    // Ensure all sources are registered in the database
    const updaters = getAllUpdaters();
    for (const updater of updaters) {
      updater.ensureRegistered();
    }

    const statuses = getStatus();
    return NextResponse.json(statuses);
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
    const { source, force = false } = body as { source: string; force?: boolean };

    if (!source) {
      return NextResponse.json(
        { error: 'Missing required field: source' },
        { status: 400 }
      );
    }

    if (source === 'all') {
      // Fire and forget -- don't await
      runAll(force).catch((err) => {
        console.error('[admin/update] runAll error:', err);
      });
      return NextResponse.json({ status: 'started', source: 'all' });
    }

    const updater = getUpdater(source);
    if (!updater) {
      return NextResponse.json(
        { error: `Unknown source: ${source}` },
        { status: 404 }
      );
    }

    // Fire and forget -- don't await
    updater.run(force).catch((err) => {
      console.error(`[admin/update] ${source} error:`, err);
    });

    return NextResponse.json({ status: 'started', source });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'Internal server error' },
      { status: 500 }
    );
  }
}
