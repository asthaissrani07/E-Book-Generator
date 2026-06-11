import { NextResponse } from 'next/server';
import mjml2html from 'mjml';

export async function POST(request: Request) {
  try {
    const { mjmlTemplate } = await request.json();
    if (!mjmlTemplate) {
      return NextResponse.json({ error: 'mjmlTemplate is required' }, { status: 400 });
    }

    const { html, errors } = await mjml2html(mjmlTemplate, { validationLevel: 'soft' });
    if (errors.length > 0) {
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    return NextResponse.json({ html });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to compile MJML';
    console.error('MJML compilation error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
