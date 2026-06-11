import { generateCoverTemplate } from './cover';
import { generateChapterTemplate } from './chapter';
import { generateBodyTemplate } from './body';

export { generateCoverTemplate, generateChapterTemplate, generateBodyTemplate };
export { warmBohoBodyMjml } from './warmBohoBody.mjml';
export { lavenderBodyMjml } from './lavenderBody.mjml';
export { darkNoirBodyMjml } from './darkNoirBody.mjml';
export { getBodyMjmlTemplate, compileBodyMjml, compileMjmlTemplate } from './bodyMjml';
export type { BodyMjmlParams } from './mjmlTypes';
