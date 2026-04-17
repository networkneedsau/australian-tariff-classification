import { NextRequest, NextResponse } from 'next/server';
import {
  type IcsEntryFields,
  type DeclarationInfo,
  generateIcsXml,
  generateMultiLineIcsXml,
} from '@/lib/ics-xml-generator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const download = new URL(request.url).searchParams.get('download') === 'true';

    let xml: string;

    // Multi-line format: { lines: IcsEntryFields[], declarationInfo: DeclarationInfo }
    if (Array.isArray(body.lines)) {
      const lines: IcsEntryFields[] = body.lines;
      const info: DeclarationInfo = body.declarationInfo ?? {};

      if (lines.length === 0) {
        return NextResponse.json({ error: 'At least one goods line is required' }, { status: 400 });
      }

      xml = generateMultiLineIcsXml(lines, info);
    } else {
      // Single-line format: IcsEntryFields at top level
      const fields = body as IcsEntryFields;
      if (!fields.tariffCode || !fields.goodsDescription) {
        return NextResponse.json(
          { error: 'Missing required fields: tariffCode, goodsDescription' },
          { status: 400 },
        );
      }
      xml = generateIcsXml(fields);
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/xml; charset=utf-8',
    };

    if (download) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      headers['Content-Disposition'] = `attachment; filename="ICS-N10-${timestamp}.xml"`;
    }

    return new NextResponse(xml, { status: 200, headers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid request body';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
