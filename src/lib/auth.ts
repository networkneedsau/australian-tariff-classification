import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb } from './db';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'tariff_session';
const SESSION_EXPIRY_HOURS = 24;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createSession(userId: string): string {
  const db = getDb();
  const token = crypto.randomBytes(32).toString('hex');
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  // Clean up expired sessions periodically
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();

  db.prepare(
    'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)'
  ).run(sessionId, userId, token, expiresAt);

  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_EXPIRY_HOURS * 60 * 60,
  });
}

export function verifySession(token: string): { userId: string; email: string; name: string; role: string } | null {
  const db = getDb();

  const row = db.prepare(`
    SELECT u.id as userId, u.email, u.name, u.role
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).get(token) as { userId: string; email: string; name: string; role: string } | undefined;

  return row || null;
}

export async function getCurrentUser(): Promise<{ id: string; email: string; name: string; role: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  if (!sessionCookie?.value) return null;

  const session = verifySession(sessionCookie.value);
  if (!session) return null;

  return { id: session.userId, email: session.email, name: session.name, role: session.role };
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME);

  if (sessionCookie?.value) {
    const db = getDb();
    db.prepare('DELETE FROM sessions WHERE token = ?').run(sessionCookie.value);
  }

  cookieStore.delete(COOKIE_NAME);
}

export function generateId(): string {
  return crypto.randomUUID();
}
