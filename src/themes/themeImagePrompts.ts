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
    construct: [
      `Black and white high contrast photograph, constructivist editorial style, geometric composition, ${ch}`,
      `Grayscale dramatic portrait photograph, Russian constructivism zine aesthetic, bold contrast, ${ch}`,
      `B&W architectural photograph, constructivist magazine layout, ${book}`,
      `Small B&W documentary photo, constructivist grid panel, ${ch}`,
      `Wide grayscale editorial photograph, bold red constructivist zine style, ${ch}`,
      `Black white street photography, high contrast constructivist aesthetic, ${ch}`,
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
    pinterest: [
      `Aesthetic Pinterest classic photo, warm terracotta beige, ${ch}, white peony flower, desaturated lifestyle photography`,
      `Hands typing on classic keyboard, laptop, coffee cup, Pinterest moodboard, warm neutral tones, ${ch}`,
      `Girl holding flowers, soft linen dress, terracotta clay aesthetic, warm studio lighting, ${book}`,
      `Aesthetic round circle thumbnail, soft pastel terracotta rose, dried flower close-up, ${ch}`,
      `Arched frame, aesthetic photography, books and coffee on linen sheet, warm beige palette, ${ch}`,
      `Minimalist moodboard layout, terracotta clay brown tones, warm aesthetic flatlay, ${ch}`,
    ],
    pinterest_teal: [
      `Professional business brochure cover, skyscraper skyline photography with teal color overlay, corporate branding, modern architecture, ${ch}`,
      `Professional corporate headshot of CEO business founder, black and white portrait, modern executive, ${ch}`,
      `Modern glass skyscraper architecture, wide cityscape, teal and navy tone, professional, ${book}`,
      `Corporate headshot portrait of a team member, professional leader, business card photo, ${ch}`,
      `Minimalist corporate icon illustration, suitcase folder symbol, teal and navy palette, professional business, ${ch}`,
      `Modern office desk flatlay, laptop and teal coffee cup, corporate branding guidelines, professional aesthetic, ${ch}`,
    ],
    pinterest_pink: [
      `Aesthetic fashion book cover, model walking in city street, vertical portrait, muted colors, soft pink grading, ${ch}`,
      `Aesthetic pink moodboard photo, dried rose flower petals on linen sheet, cup of tea, desaturated lifestyle photography, ${ch}`,
      `Aesthetic polaroid frame mockup, retro photo style, dusty rose background, lifestyle details, ${book}`,
      `Cute polaroid picture of two friends laughing, pink frame, warm soft lighting, portrait, ${ch}`,
      `Minimalist pastel pink graphic illustration, heart star outline shapes, aesthetic flatlay, ${ch}`,
      `Hands flipping through fashion magazine, coffee cup, white roses on table, warm aesthetic lifestyle, ${ch}`,
    ],
  };

  return buildSlots(promptSets[themeId], baseSeed);
}
