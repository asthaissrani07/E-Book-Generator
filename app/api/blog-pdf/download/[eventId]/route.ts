import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import { getExportFilePath } from '@/lib/utils/serverPdfExport';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    const filePath = getExportFilePath(eventId);

    if (!existsSync(filePath)) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    const pdf = await readFile(filePath);
    const safeName = eventId.replace(/[^\w\-]+/g, '_');

    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
