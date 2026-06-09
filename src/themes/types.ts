export type ThemeId =
  | 'editorial'
  | 'botanical'
  | 'modern'
  | 'noir'
  | 'wanderlust'
  | 'softpink'
  | 'comic'
  | 'sporty'
  | 'wellness'
  | 'construct'
  | 'newspaper';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  bgColor: string;
  accentColor: string;
  textColor: string;
  fontHeader: string;
  fontBody: string;
  paletteColors: string[];
}
