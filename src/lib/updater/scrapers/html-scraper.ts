import * as cheerio from 'cheerio';

// ---------- rate-limiting ----------

/** Domain -> epoch-ms of the last completed request */
const lastRequestByDomain = new Map<string, number>();
const MIN_INTERVAL_MS = 1000; // 1 second between requests to the same domain

function domainOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

async function enforceRateLimit(url: string): Promise<void> {
  const domain = domainOf(url);
  const last = lastRequestByDomain.get(domain);
  if (last !== undefined) {
    const elapsed = Date.now() - last;
    if (elapsed < MIN_INTERVAL_MS) {
      await new Promise((r) => setTimeout(r, MIN_INTERVAL_MS - elapsed));
    }
  }
}

function recordRequest(url: string): void {
  lastRequestByDomain.set(domainOf(url), Date.now());
}

// ---------- public API ----------

export interface FetchPageOptions {
  /** Maximum number of retry attempts (default 3). */
  retries?: number;
  /** Timeout per request in ms (default 30 000). */
  timeoutMs?: number;
  /** Extra headers merged onto the request. */
  headers?: Record<string, string>;
}

const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * Fetch a page with retries, exponential back-off, rate-limiting and a
 * browser-like User-Agent header. Returns the raw HTML string.
 */
export async function fetchPage(
  url: string,
  options: FetchPageOptions = {}
): Promise<string> {
  const { retries = 3, timeoutMs = 30_000, headers = {} } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    await enforceRateLimit(url);

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(url, {
        signal: controller.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': DEFAULT_UA,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-AU,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0',
          ...headers,
        },
      });

      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const html = await res.text();
      recordRequest(url);
      return html;
    } catch (err: any) {
      recordRequest(url); // still count toward rate limit

      if (attempt === retries) {
        throw new Error(
          `fetchPage failed after ${retries} attempts for ${url}: ${err?.message ?? err}`
        );
      }

      // Exponential back-off: 1s, 2s, 4s ...
      const delay = Math.pow(2, attempt - 1) * 1000;
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  // unreachable, but keeps TS happy
  throw new Error(`fetchPage: unexpected exit for ${url}`);
}

/**
 * Parse an HTML string and return a cheerio root instance.
 */
export function parsePage(html: string): cheerio.CheerioAPI {
  return cheerio.load(html);
}

/**
 * Convenience: fetch + parse in one call.
 */
export async function fetchAndParse(
  url: string,
  options?: FetchPageOptions
): Promise<cheerio.CheerioAPI> {
  const html = await fetchPage(url, options);
  return parsePage(html);
}
