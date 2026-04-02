import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface HsNode {
  hs_code: string;
  hs_code_formatted: string | null;
  description: string;
  level: number;
  children?: HsNode[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section');
  const chapter = searchParams.get('chapter');
  const db = getDb();

  try {
    // Build WHERE clause based on filters
    let whereClause = '';
    const params: string[] = [];

    if (chapter) {
      // Return headings (level 4) and subheadings (level 6) for a chapter
      const chapterCode = chapter.replace(/\D/g, '').padStart(2, '0');
      whereClause = `WHERE (hs_code = ? OR parent_code = ? OR hs_code LIKE ?)`;
      params.push(chapterCode, chapterCode, chapterCode + '%');
    } else if (section) {
      // Return all codes in a section
      whereClause = `WHERE section = ?`;
      params.push(section.toUpperCase());
    }

    const rows = db.prepare(`
      SELECT hs_code, hs_code_formatted, description, level, parent_code, section
      FROM hs_descriptions
      ${whereClause}
      ORDER BY hs_code
    `).all(...params) as {
      hs_code: string;
      hs_code_formatted: string | null;
      description: string;
      level: number;
      parent_code: string | null;
      section: string | null;
    }[];

    // Build tree structure
    const chapters: HsNode[] = [];
    const chapterMap = new Map<string, HsNode>();
    const headingMap = new Map<string, HsNode>();

    for (const row of rows) {
      const node: HsNode = {
        hs_code: row.hs_code,
        hs_code_formatted: row.hs_code_formatted,
        description: row.description,
        level: row.level,
      };

      if (row.level === 2) {
        // Chapter level
        node.children = [];
        chapters.push(node);
        chapterMap.set(row.hs_code, node);
      } else if (row.level === 4) {
        // Heading level
        node.children = [];
        headingMap.set(row.hs_code, node);
        const parent = chapterMap.get(row.parent_code || '');
        if (parent) {
          parent.children!.push(node);
        } else {
          chapters.push(node);
        }
      } else if (row.level === 6) {
        // Subheading level
        const parent = headingMap.get(row.parent_code || '');
        if (parent) {
          parent.children!.push(node);
        }
      }
    }

    return NextResponse.json({
      hierarchy: chapters,
      total: rows.length,
      filter: { section: section || null, chapter: chapter || null },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, hierarchy: [], total: 0 }, { status: 500 });
  }
}
