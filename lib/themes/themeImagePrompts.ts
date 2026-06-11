import type { ThemeId } from './types';
import type { EditorialImageSet } from '../utils/imageHelper';

function buildSlots(prompts: string[], baseSeed: number): EditorialImageSet {
  return {
    primary: { prompt: prompts[0], seed: baseSeed },
    extras: prompts.slice(1).map((prompt, i) => ({ prompt, seed: baseSeed + i + 1 })),
    prompts,
  };
}

export function getThemeImageSlots(
  themeId: ThemeId,
  chapterTitle: string,
  bookTitle: string,
  pageIndex: number
): EditorialImageSet {
  const baseSeed = pageIndex * 41;
  const ch = chapterTitle;
  const book = bookTitle;

  const promptSets: Record<ThemeId, string[]> = {
    editorial: [
      `Warm boho business ebook hero photo, ${ch}, sunflowers terracotta beige aesthetic, soft lifestyle photography`,
      `Arched frame botanical close-up, dried flowers and sunflowers, warm tan tones, ${ch}`,
      `Minimalist organic office lifestyle, ${book}, cream and burnt orange palette, professional`,
      `Small aesthetic thumbnail, warm neutral boho, sunflower accent, ${ch}`,
      `Wide warm editorial spread, terracotta peach beige, ${ch}, business ebook template style`,
      `Soft organic blob-framed photo, neutral clothing, warm desaturated grade, ${ch}`,
    ],
    wanderlust: [
      `Travel magazine hero photo, iconic world landmark architecture, ${ch}, pale teal sky, wanderlust aesthetic`,
      `Vertical travel landmark photograph, Eiffel Tower or cathedral, teal muted tones, editorial`,
      `Cityscape travel photo, European architecture, clean minimal composition, ${book}`,
      `Small rounded travel thumbnail, landmark detail, soft blue sky, ${ch}`,
      `Wide travel editorial spread, adventure journey, teal and white palette, ${ch}`,
      `Travel street scene photograph, wanderlust magazine style, desaturated teal grade, ${ch}`,
    ],
    softpink: [
      `Soft pink lifestyle hero photo, feminine elegant aesthetic, ${ch}, blush rose tones, silk texture`,
      `Pastel pink editorial portrait, lifestyle wellness, dusty rose palette, ${ch}`,
      `Minimal feminine workspace photo, soft pink accents, ${book}, magazine layout`,
      `Small rounded pink lifestyle thumbnail, elegant feminine, ${ch}`,
      `Wide blush pink editorial spread, lifestyle guide aesthetic, ${ch}`,
      `Soft pink marble or fabric texture photo, feminine professional, ${ch}`,
    ],
    comic: [
      `Pop art comic book portrait illustration, bold black outlines, vibrant flat magenta orange cyan colors, halftone dots background, ${ch}`,
      `Comic book style illustration, thick black outlines, bright pop art colors, halftone pattern, stylized portrait, ${ch}`,
      `Pop art object illustration, lightning bolt or bold graphic, flat vibrant colors, comic book aesthetic, ${book}`,
      `Small comic panel illustration, pop art style, bold outlines, halftone dots, ${ch}`,
      `Wide pop art comic spread illustration, vibrant magenta yellow orange, action lines starburst, ${ch}`,
      `Pop art landscape illustration, bold colors thick outlines, comic book thanks page style, ${ch}`,
    ],
    sporty: [
      `Dynamic sports action photograph, athlete in motion, high contrast, maroon red accents, ${ch}`,
      `Sports magazine action photo, football or athletics, dramatic lighting, ${ch}`,
      `Athletic competition photograph, editorial sports spread, deep red accent, ${book}`,
      `Sports action close-up photo, intense energy, maroon color grade, ${ch}`,
      `Wide sports editorial photograph, stadium action, bold maroon borders aesthetic, ${ch}`,
      `Sports portrait photograph, determined athlete, high contrast black white red, ${ch}`,
    ],
    wellness: [
      `Herbal wellness product photograph, botanical ingredients, clean white background, ${ch}`,
      `Natural supplement ingredients photo, lavender or mint leaves, professional wellness brochure, ${ch}`,
      `Organic herbs and botanical close-up, soft natural lighting, wellness aesthetic, ${book}`,
      `Small botanical wellness thumbnail, herbal ingredients, clean medical style, ${ch}`,
      `Wide wellness product spread, supplement bottles and herbs, purple green accents, ${ch}`,
      `Botanical line art style wellness photo, dried herbs flowers, professional clean, ${ch}`,
    ],
    newspaper: [
      `Editorial nature photograph birds on branches, soft pastel yellow pink blue green circle backgrounds, NYT magazine style, ${ch}`,
      `Scientific nature illustration style photo, birds wildlife, pastel colored circles, newspaper infographic, ${ch}`,
      `Documentary photograph for newspaper feature, ${book}, classic editorial`,
      `Small nature thumbnail photo, pastel circle frame, birds or wildlife, ${ch}`,
      `Wide newspaper feature photograph, climate nature story, serif editorial layout, ${ch}`,
      `Birds habitat nature photo, soft pastel infographic circles, broadsheet magazine, ${ch}`,
    ],
    botanical: [
      `Botanical garden watercolor illustration, sage green, organic frames, ${ch}`,
      `Hand-drawn botanical close-up, garden magazine style, ${ch}`,
      `Organic garden lifestyle photo, sage green palette, ${book}`,
      `Botanical thumbnail, leaves and flowers, ${ch}`,
      `Wide garden editorial spread, botanical magazine, ${ch}`,
      `Watercolor botanical illustration, soft green tones, ${ch}`,
    ],
    modern: [
      `Minimal corporate photograph, clean blue gray palette, professional, ${ch}`,
      `Business editorial photo, geometric clean composition, ${ch}`,
      `Corporate lifestyle minimal photo, ${book}`,
      `Small business thumbnail, clean minimal, ${ch}`,
      `Wide corporate spread, blue accents, ${ch}`,
      `Professional office photograph, minimalist, ${ch}`,
    ],
    noir: [
      `Dark cinematic moody photograph, gold accents, noir atmosphere, ${ch}`,
      `Mysterious night scene, high contrast shadows, gold lighting, ${ch}`,
      `Noir editorial photograph, dark elegant, ${book}`,
      `Dark moody thumbnail, gold border aesthetic, ${ch}`,
      `Wide noir cinematic spread, deep shadows gold highlights, ${ch}`,
      `Mysterious atmospheric photograph, midnight noir style, ${ch}`,
    ],
    bloodred: [
      `Rich blood-red editorial fashion photo, ${ch}, high contrast, deep crimson background, luxury aesthetic`,
      `High-contrast dramatic portrait, crimson lighting, fashion editorial, ${ch}`,
      `Luxury lifestyle close-up, gold chains and deep red silk, ${book}`,
      `Small editorial detail thumbnail, dark crimson roses, luxury aesthetic, ${ch}`,
      `Wide luxury fashion spread, blood-red and warm cream color palette, ${ch}`,
      `Editorial close-up fashion photography, rich textures, deep red color grade, ${ch}`,
    ],
    minimalblack: [
      `Minimalist high-fashion black and white editorial photography, stark contrast, clean compositions, ${ch}`,
      `Stark minimalist black and white architecture photograph, elegant lines, shadow play, ${ch}`,
      `High-end minimalist aesthetic flatlay, black white grey color palette, book and tea, ${book}`,
      `Small high-contrast black and white graphic design element, minimal border, ${ch}`,
      `Wide high-contrast black and white editorial landscape photograph, minimalism, ${ch}`,
      `Minimalist abstract graphic composition, black and white ink style, high-end look, ${ch}`,
    ],
    rose: [
      `Beautiful elegant pink rose watercolor floral frame, ${ch}, soft feminine background, pastel burgundy palette`,
      `Vertical rose bouquet photography, lifestyle floral, soft pastel cream mauve background, ${ch}`,
      `Feminine organic flatlay with notebook, rose petals and leaves, ${book}`,
      `Decorative line art floral drawing, soft pink blush background, minimal, ${ch}`,
      `Wide elegant rose garden editorial spread, soft focus floral photography, ${ch}`,
      `Watercolor flower pattern texture, soft mauve pink, aesthetic, ${ch}`,
    ],
    lavender: [
      `Beautiful purple lavender fields lifestyle photograph, ${ch}, clean serene lavender color palette, editorial`,
      `Serene lavender watercolor vertical border, soft purple aesthetic, lavender flower illustration, ${ch}`,
      `Minimalist lavender-scented wellness setup, lavender bundle and candle on white, ${book}`,
      `Rotated chapter section label graphic, lavender color gradient, modern layout, ${ch}`,
      `Wide lavender fields landscape, soft focus travel/wellness magazine style, ${ch}`,
      `Lavender botanical illustration, watercolor purple wash background, elegant, ${ch}`,
    ],
    bolddark: [
      `Minimalist bold black and white architecture grid photography, strong contrast, dark grid style, ${ch}`,
      `Stark modern abstract photography, high-contrast shadows, pure black background, white lines, ${ch}`,
      `Bold dark corporate lifestyle flatlay, black desk workspace with coffee cup, ${book}`,
      `Clean geometric minimalist B&W outline pattern, stark contrast background, ${ch}`,
      `Wide high-contrast dark urban architectural landscape, white neon lines, ${ch}`,
      `Modern high-contrast B&W typographic graphic, abstract dark style, ${ch}`,
    ],
  };

  return buildSlots(promptSets[themeId], baseSeed);
}
