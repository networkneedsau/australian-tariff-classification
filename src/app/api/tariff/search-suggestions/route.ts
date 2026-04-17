import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

/**
 * GET /api/tariff/search-suggestions?q=colage
 * Returns: { suggestions: string[] }
 *
 * Strategy (no extension dependency):
 *   1) Tokenise the query into candidate words.
 *   2) Build a small corpus of tokens from tariff_classifications.description
 *      (limited + cached in-memory) and alpha_index.
 *   3) Rank candidates by a cheap Levenshtein-like distance.
 *   4) Return the top 5 distinct suggestions, excluding the original query.
 */

let CORPUS_CACHE: string[] | null = null;
let CORPUS_CACHE_AT = 0;
const CORPUS_TTL_MS = 5 * 60 * 1000; // 5 minutes

function loadCorpus(): string[] {
  const now = Date.now();
  if (CORPUS_CACHE && now - CORPUS_CACHE_AT < CORPUS_TTL_MS) {
    return CORPUS_CACHE;
  }
  const db = getDb();
  const tokens = new Set<string>();

  const addFrom = (s: unknown) => {
    if (!s || typeof s !== 'string') return;
    for (const raw of s.toLowerCase().split(/[^a-z0-9]+/)) {
      if (raw.length >= 4 && raw.length <= 24) tokens.add(raw);
    }
  };

  try {
    const rows = db.prepare(`
      SELECT description FROM tariff_classifications
      WHERE description IS NOT NULL
      LIMIT 50000
    `).all() as Array<{ description: string }>;
    for (const r of rows) addFrom(r.description);
  } catch {
    /* ignore */
  }

  try {
    const rows = db.prepare(`
      SELECT term FROM alpha_index
      WHERE term IS NOT NULL
      LIMIT 20000
    `).all() as Array<{ term: string }>;
    for (const r of rows) addFrom(r.term);
  } catch {
    /* alpha_index may have a different column name — fall back */
    try {
      const rows = db.prepare(`
        SELECT * FROM alpha_index LIMIT 20000
      `).all() as Array<Record<string, unknown>>;
      for (const r of rows) {
        for (const v of Object.values(r)) {
          if (typeof v === 'string') addFrom(v);
        }
      }
    } catch {
      /* skip */
    }
  }

  CORPUS_CACHE = Array.from(tokens);
  CORPUS_CACHE_AT = now;
  return CORPUS_CACHE;
}

/** Classic bounded Levenshtein distance. Returns >max when exceeded. */
function levenshtein(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (a === b) return 0;
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  let prev = new Array<number>(bl + 1);
  let curr = new Array<number>(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;

  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= bl; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1] + 1,
        prev[j] + 1,
        prev[j - 1] + cost
      );
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > max) return max + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[bl];
}

function scoreToken(query: string, token: string): number {
  // Prefix bonus: ~very similar prefix gets ranked higher.
  const lenDiff = Math.abs(query.length - token.length);
  const maxDist = Math.max(1, Math.floor(query.length / 3) + 1);
  const d = levenshtein(query, token, maxDist);
  if (d > maxDist) return Number.POSITIVE_INFINITY;
  // Tie-break: shorter tokens first, then prefix match.
  const prefixBonus = token.startsWith(query.slice(0, 2)) ? -0.5 : 0;
  return d + lenDiff * 0.05 + prefixBonus;
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') || '').trim().toLowerCase();
  if (q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  // Multi-word queries: suggest on the last word only (common typo-correction pattern).
  const words = q.split(/\s+/);
  const target = words[words.length - 1];
  if (target.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }
  const prefix = words.slice(0, -1).join(' ');

  const corpus = loadCorpus();

  const scored: Array<{ token: string; score: number }> = [];
  for (const token of corpus) {
    if (token === target) continue;
    const score = scoreToken(target, token);
    if (Number.isFinite(score)) {
      scored.push({ token, score });
    }
  }

  scored.sort((a, b) => a.score - b.score);
  const seen = new Set<string>();
  const suggestions: string[] = [];
  for (const { token } of scored) {
    if (suggestions.length >= 5) break;
    const full = prefix ? `${prefix} ${token}` : token;
    if (!seen.has(full) && full !== q) {
      seen.add(full);
      suggestions.push(full);
    }
  }

  return NextResponse.json({ suggestions });
}
