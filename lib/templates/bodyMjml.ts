import mjml2html from 'mjml';
import type { ThemeId } from '../themes/types';
import type { BodyMjmlParams } from './mjmlTypes';
import { warmBohoBodyMjml } from './warmBohoBody.mjml';
import { lavenderBodyMjml } from './lavenderBody.mjml';
import { darkNoirBodyMjml } from './darkNoirBody.mjml';
const MJML_BODY_THEMES: Partial<Record<ThemeId, (params: BodyMjmlParams) => string>> = {
  editorial: warmBohoBodyMjml,
  lavender: lavenderBodyMjml,
  noir: darkNoirBodyMjml,
};

export function getBodyMjmlTemplate(theme: ThemeId, params: BodyMjmlParams): string | null {
  const builder = MJML_BODY_THEMES[theme];
  return builder ? builder(params) : null;
}

export async function compileBodyMjml(theme: ThemeId, params: BodyMjmlParams): Promise<string> {
  const mjmlTemplate = getBodyMjmlTemplate(theme, params);
  if (!mjmlTemplate) {
    throw new Error(`No MJML body template for theme: ${theme}`);
  }

  const { html, errors } = await mjml2html(mjmlTemplate, { validationLevel: 'soft' });
  if (errors.length > 0) {
    const messages = errors.map((e: { formattedMessage?: string; message: string }) => e.formattedMessage || e.message).join('; ');
    throw new Error(`MJML compilation failed: ${messages}`);
  }

  return html;
}

export async function compileMjmlTemplate(mjmlTemplate: string) {
  return mjml2html(mjmlTemplate, { validationLevel: 'soft' });
}
