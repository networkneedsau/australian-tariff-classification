import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const currency = searchParams.get('currency');
  const date = searchParams.get('date');
  const days = parseInt(searchParams.get('days') || '30');
  const db = getDb();

  try {
    if (currency) {
      // Return historical rates for a specific currency
      const rows = db.prepare(`
        SELECT currency_code, currency_name, rate_to_aud,
               effective_date, period_start, period_end, source
        FROM exchange_rates
        WHERE currency_code = ?
        ORDER BY effective_date DESC
        LIMIT ?
      `).all(currency.toUpperCase(), days) as any[];

      return NextResponse.json({
        currency: currency.toUpperCase(),
        rates: rows,
        count: rows.length,
      });
    }

    if (date) {
      // Return all rates for a specific date
      // Match exact date or the closest date before it
      const rows = db.prepare(`
        SELECT e1.currency_code, e1.currency_name, e1.rate_to_aud,
               e1.effective_date, e1.period_start, e1.period_end, e1.source
        FROM exchange_rates e1
        INNER JOIN (
          SELECT currency_code, MAX(effective_date) as max_date
          FROM exchange_rates
          WHERE effective_date <= ?
          GROUP BY currency_code
        ) e2 ON e1.currency_code = e2.currency_code AND e1.effective_date = e2.max_date
        ORDER BY e1.currency_code
      `).all(date) as any[];

      return NextResponse.json({
        date,
        rates: rows,
        count: rows.length,
      });
    }

    // Default: return all distinct currencies with their latest rate
    const rows = db.prepare(`
      SELECT e1.currency_code, e1.currency_name, e1.rate_to_aud,
             e1.effective_date, e1.period_start, e1.period_end, e1.source,
             (SELECT COUNT(*) FROM exchange_rates e2 WHERE e2.currency_code = e1.currency_code) as history_count
      FROM exchange_rates e1
      INNER JOIN (
        SELECT currency_code, MAX(effective_date) as max_date
        FROM exchange_rates
        GROUP BY currency_code
      ) e2 ON e1.currency_code = e2.currency_code AND e1.effective_date = e2.max_date
      ORDER BY e1.currency_code
    `).all() as any[];

    return NextResponse.json({
      rates: rows,
      count: rows.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, rates: [], count: 0 }, { status: 500 });
  }
}
