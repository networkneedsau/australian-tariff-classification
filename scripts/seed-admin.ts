import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb } from '../src/lib/db';

const db = getDb();

const ADMIN_EMAIL = 'admin@tariff.local';
const ADMIN_NAME = 'Administrator';
const ADMIN_PASSWORD = 'Admin123!';
const ADMIN_ROLE = 'admin';

async function seedAdmin() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const id = crypto.randomUUID();

  db.prepare(`
    INSERT OR IGNORE INTO users (id, email, name, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, ADMIN_EMAIL, ADMIN_NAME, passwordHash, ADMIN_ROLE);

  const existing = db.prepare('SELECT id, email FROM users WHERE email = ?').get(ADMIN_EMAIL) as { id: string; email: string } | undefined;

  if (existing) {
    console.log(`Admin user ready: ${existing.email} (${existing.id})`);
  } else {
    console.error('Failed to create admin user');
  }

  db.close();
}

seedAdmin().catch(console.error);
