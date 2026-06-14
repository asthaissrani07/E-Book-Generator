export type PrintDimensions = 'letter' | 'a4' | 'legal';

export function getPageDimensions(dimensions: PrintDimensions = 'a4') {
  if (dimensions === 'letter') return { w: 612, h: 792 };
  if (dimensions === 'legal') return { w: 612, h: 1008 };
  return { w: 794, h: 1123 };
}
