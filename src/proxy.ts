import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
];

const PUBLIC_PREFIXES = [
  '/api/auth/',
  '/_next/',
  '/favicon.ico',
];

const ADMIN_PATHS = ['/admin'];
const ADMIN_PREFIXES = ['/api/admin/'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow public prefixes
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return NextResponse.next();
    }
  }

  // Check for session cookie
  const sessionToken = request.cookies.get('tariff_session')?.value;
  if (!sessionToken) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Since proxy runs on Node.js runtime in Next.js 16, we can validate directly with SQLite
  const db = getDb();
  const session = db.prepare(`
    SELECT u.id as userId, u.email, u.name, u.role
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).get(sessionToken) as { userId: string; email: string; name: string; role: string } | undefined;

  if (!session) {
    // Invalid or expired session - clear cookie and redirect
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('tariff_session');
    return response;
  }

  // Check admin routes
  const isAdminRoute = ADMIN_PATHS.includes(pathname) || ADMIN_PREFIXES.some(p => pathname.startsWith(p));
  if (isAdminRoute && session.role !== 'admin') {
    const searchUrl = new URL('/search', request.url);
    return NextResponse.redirect(searchUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
