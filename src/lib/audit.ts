/**
 * Server-side audit logger.
 * Inserts audit events into the audit_log table.
 */

import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export function logAudit(
  action: string,
  details: Record<string, any>,
  request?: NextRequest
): void {
  try {
    const db = getDb();

    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    if (request) {
      // Extract IP: prefer x-forwarded-for, fall back to other headers
      ipAddress =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        null;

      userAgent = request.headers.get('user-agent') || null;
    }

    // Extract tariff_code from details if present
    const tariffCode =
      details.code || details.tariff_code || details.query || null;

    db.prepare(
      `INSERT INTO audit_log (action, tariff_code, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)`
    ).run(
      action,
      typeof tariffCode === 'string' ? tariffCode : null,
      JSON.stringify(details),
      ipAddress,
      userAgent
    );
  } catch (err) {
    // Never let audit logging break the request
    console.error('[audit] Failed to log:', err);
  }
}
