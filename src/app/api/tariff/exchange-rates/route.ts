import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// ── Fallback rates (AUD equivalents) ─────────────────────────────────

const FALLBACK_RATES: Record<string, { name: string; rate: number }> = {
  USD: { name: 'United States Dollar', rate: 0.65 },
  EUR: { name: 'Euro', rate: 0.58 },
  GBP: { name: 'British Pound', rate: 0.50 },
  JPY: { name: 'Japanese Yen', rate: 95.0 },
  CNY: { name: 'Chinese Yuan', rate: 4.70 },
  NZD: { name: 'New Zealand Dollar', rate: 1.08 },
  SGD: { name: 'Singapore Dollar', rate: 0.87 },
  THB: { name: 'Thai Baht', rate: 22.5 },
  KRW: { name: 'South Korean Won', rate: 870.0 },
  MYR: { name: 'Malaysian Ringgit', rate: 2.90 },
  IDR: { name: 'Indonesian Rupiah', rate: 10200.0 },
  HKD: { name: 'Hong Kong Dollar', rate: 5.10 },
  TWD: { name: 'Taiwan Dollar', rate: 20.5 },
  INR: { name: 'Indian Rupee', rate: 54.0 },
  CAD: { name: 'Canadian Dollar', rate: 0.88 },
  CHF: { name: 'Swiss Franc', rate: 0.57 },
};

// ── GET handler ──────────────────────────────────────────────────────

export async function GET() {
  const db = getDb();

  // Get the most recent rate per currency
  const rows = db.prepare(`
    SELECT e1.currency_code, e1.currency_name, e1.rate_to_aud,
           e1.effective_date, e1.period_start, e1.period_end, e1.source
    FROM exchange_rates e1
    INNER JOIN (
      SELECT currency_code, MAX(effective_date) as max_date
      FROM exchange_rates
      GROUP BY currency_code
    ) e2 ON e1.currency_code = e2.currency_code AND e1.effective_date = e2.max_date
    ORDER BY e1.currency_code
  `).all() as {
    currency_code: string;
    currency_name: string;
    rate_to_aud: number;
    effective_date: string;
    period_start: string | null;
    period_end: string | null;
    source: string;
  }[];

  if (rows.length === 0) {
    // Return fallback rates
    const fallback = Object.entries(FALLBACK_RATES).map(([code, info]) => ({
      currency_code: code,
      currency_name: info.name,
      rate_to_aud: info.rate,
      effective_date: null,
      period_start: null,
      period_end: null,
      source: 'fallback',
    }));

    return NextResponse.json({
      rates: fallback,
      source: 'fallback',
      updated_at: null,
    });
  }

  return NextResponse.json({
    rates: rows,
    source: 'database',
    updated_at: rows[0]?.effective_date || null,
  });
}
