import type { ThemeId } from '../themes/types';

export const THEME_PAGE_INLINE: Partial<Record<ThemeId, string>> = {
  editorial: 'background-color: #FAF6F0; color: #3d2314; font-family: "Playfair Display", Georgia, serif;',
  lavender: 'background-color: #F5F3FA; color: #4A475A; font-family: "Lora", Georgia, serif;',
  noir: 'background-color: #0a0a0a; color: #f3f4f6; font-family: "Montserrat", sans-serif;',
  rose: 'background-color: #FDF0F5; color: #5A4A4F; font-family: "Playfair Display", Georgia, serif;',
  wanderlust: 'background-color: #ffffff; color: #2D3748; font-family: "Inter", sans-serif;',
  botanical: 'background-color: #edf0ea; color: #1e291e; font-family: "Cormorant Garamond", Georgia, serif;',
  modern: 'background-color: #ffffff; color: #0f172a; font-family: "Montserrat", sans-serif;',
  softpink: 'background-color: #fdf2f4; color: #3d1f2a; font-family: "Playfair Display", Georgia, serif;',
  comic: 'background-color: #ffffff; color: #1a1a1a; font-family: "Anton", sans-serif;',
  sporty: 'background-color: #ffffff; color: #121212; font-family: "DM Serif Display", Georgia, serif;',
  wellness: 'background-color: #fafafa; color: #2d2d2d; font-family: "Montserrat", sans-serif;',
  newspaper: 'background-color: #fffef8; color: #1a1a1a; font-family: "Lora", Georgia, serif;',
  bloodred: 'background-color: #fdfbf7; color: #2b0808; font-family: "Playfair Display", Georgia, serif;',
  minimalblack: 'background-color: #000000; color: #ffffff; font-family: "Playfair Display", Georgia, serif;',
  bolddark: 'background-color: #000000; color: #ffffff; font-family: "Montserrat", sans-serif;',
};

export function getThemePageInlineStyle(theme: ThemeId): string {
  return THEME_PAGE_INLINE[theme] || THEME_PAGE_INLINE.editorial!;
}

export const GOOGLE_FONTS_LINK =
  'https://fonts.googleapis.com/css2?family=Anton&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@400;500;600;700;800&family=Outfit:wght@300;400;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Poppins:wght@400;500;600;700&display=swap';
