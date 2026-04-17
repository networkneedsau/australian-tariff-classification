import * as cheerio from 'cheerio';
import { fetchAndParse } from './html-scraper';
import { logInfo } from '../update-logger';

// ---------- constants ----------

export const LEGISLATION_BASE = 'https://www.legislation.gov.au';

const SRC = 'legislation';

// ---------- types ----------

export interface ActSection {
  part: string;
  part_title: string;
  section_number: string;
  section_title: string;
  content: string;
}

export interface LegislationStructure {
  title: string;
  slug: string;
  parts: ActSection[];
}

// ---------- helpers ----------

/**
 * Build the URL for the "latest" compilation of an act or regulation.
 * Slugs look like  "Details/C2004A01234"  or  "Series/C2004A01234".
 */
function latestUrl(slug: string): string {
  // If the slug already looks like a full path, use it directly
  if (slug.startsWith('http')) return slug;
  return `${LEGISLATION_BASE}/${slug}`;
}

// ---------- public API ----------

/**
 * Scrape the latest version of an act/regulation identified by `slug` and
 * return its structural outline (parts and sections).
 */
export async function scrapeLegislation(
  slug: string
): Promise<LegislationStructure> {
  const url = latestUrl(slug);
  logInfo(SRC, `Fetching legislation from ${url}`);
  const $ = await fetchAndParse(url);

  const title =
    $('h1').first().text().trim() ||
    $('title').text().trim() ||
    slug;

  const parts = parseSections($);

  logInfo(SRC, `Legislation "${title}" — ${parts.length} sections parsed`);

  return { title, slug, parts };
}

/**
 * Convenience: scrape an act and return just the flat array of sections.
 */
export async function scrapeActSections(slug: string): Promise<ActSection[]> {
  const structure = await scrapeLegislation(slug);
  return structure.parts;
}

// ---------- internal parsing ----------

/**
 * Walk the page DOM and extract Part / Section structure.
 *
 * legislation.gov.au uses a relatively consistent pattern:
 *   <h2> Part X — Title </h2>
 *   <h3> Section N  Title </h3>
 *   <p> ... body ... </p>
 */
function parseSections($: ReturnType<typeof cheerio.load>): ActSection[] {
  const sections: ActSection[] = [];

  let currentPart = '';
  let currentPartTitle = '';

  // Iterate over headings and following siblings
  $('h2, h3, h4').each((_i, el) => {
    const tag = (el as any).tagName?.toLowerCase?.() ?? '';
    const text = $(el).text().trim();

    if (tag === 'h2') {
      // Part heading — e.g. "Part 2—Interpretation"
      const partMatch = text.match(/Part\s+(\S+)\s*[—–-]\s*(.*)/i);
      if (partMatch) {
        currentPart = partMatch[1];
        currentPartTitle = partMatch[2].trim();
      } else {
        currentPart = text;
        currentPartTitle = '';
      }
      return; // continue
    }

    // Section heading (h3 / h4)
    const secMatch = text.match(/(\d+[A-Za-z]*)\s+(.*)/);
    const sectionNumber = secMatch ? secMatch[1] : text;
    const sectionTitle = secMatch ? secMatch[2].trim() : '';

    // Collect content — siblings until the next heading
    let content = '';
    let sibling = $(el).next();
    while (sibling.length && !sibling.is('h2, h3, h4')) {
      const t = sibling.text().trim();
      if (t) content += (content ? '\n' : '') + t;
      sibling = sibling.next();
    }

    sections.push({
      part: currentPart,
      part_title: currentPartTitle,
      section_number: sectionNumber,
      section_title: sectionTitle,
      content,
    });
  });

  return sections;
}
