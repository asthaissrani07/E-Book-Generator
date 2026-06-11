import type { EbookSection } from '../utils/pdfParser';
import type { ThemeId } from '../themes/types';

export function generateCoverTemplate(
  section: EbookSection,
  theme: ThemeId,
  coverImageSrc?: string
): string {
  const title = section.title || 'Untitled Book';
  const showImage = section.showImage !== false && Boolean(coverImageSrc);

  const coverImageHtml = showImage
    ? `<div style="width: 180px; height: 200px; border-radius: 50% 50% 0 0; overflow: hidden; margin: 0 auto 28px auto; border: 2px solid; box-shadow: 0 8px 24px rgba(0,0,0,0.12);">
        <img src="${coverImageSrc}" alt="Cover" style="width: 100%; height: 100%; object-fit: cover; display: block; border-radius: 50% 50% 0 0;" />
      </div>`
    : '';

  let themeStyles = '';
  let contentHtml = '';
  let imageBorderColor = '#8B4513';

  if (theme === 'editorial') {
    imageBorderColor = '#8B4513';
    themeStyles = `background-color: #FAF6F0; color: #5D4037; font-family: 'Playfair Display', Georgia, serif;`;
    contentHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 60px 50px; text-align: center; position: relative;">
        ${showImage ? coverImageHtml.replace('border: 2px solid;', `border: 2px solid ${imageBorderColor};`) : ''}
        <div style="width: 80px; height: 4px; background-color: #8B4513; margin-bottom: 32px;"></div>
        <h1 style="font-size: 44px; font-weight: 700; color: #8B4513; margin: 0 0 16px; font-family: 'Playfair Display', serif; line-height: 1.2;">${title}</h1>
        <p style="font-family: 'Lora', serif; font-size: 16px; font-style: italic; color: #795548; margin: 0;">E-Book Edition</p>
        <div style="position: absolute; bottom: 60px; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #8D6E63;">Boho Publishing House</div>
      </div>`;
  } else if (theme === 'lavender') {
    imageBorderColor = '#6B5B9E';
    themeStyles = `background-color: #F5F3FA; color: #4A475A; font-family: 'Lora', Georgia, serif;`;
    contentHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 60px 50px; text-align: center; position: relative;">
        ${showImage ? coverImageHtml.replace('width: 180px; height: 200px; border-radius: 50% 50% 0 0;', 'width: 200px; height: 200px; border-radius: 50%;').replace('border-radius: 50% 50% 0 0;', 'border-radius: 50%;').replace('border: 2px solid;', `border: 1px dashed ${imageBorderColor};`) : `<div style="width: 90px; height: 90px; border-radius: 50%; border: 1px dashed #6B5B9E; display: flex; align-items: center; justify-content: center; margin-bottom: 32px;"><div style="width: 70px; height: 70px; border-radius: 50%; background-color: rgba(107, 91, 158, 0.1);"></div></div>`}
        <h1 style="font-size: 40px; font-weight: 600; color: #6B5B9E; margin: 0 0 16px; line-height: 1.3;">${title}</h1>
        <div style="width: 150px; height: 1px; background-color: #6B5B9E; opacity: 0.5; margin: 16px auto;"></div>
        <p style="font-size: 14px; text-transform: uppercase; letter-spacing: 3px; color: #9C8EB9; margin: 0;">Serene Collection</p>
      </div>`;
  } else if (theme === 'noir') {
    imageBorderColor = '#ffffff';
    themeStyles = `background-color: #0a0a0a; color: #f3f4f6; font-family: 'Montserrat', sans-serif;`;
    contentHtml = `
      <div style="display: flex; flex-direction: column; align-items: flex-start; justify-content: center; height: 100%; padding: 60px 50px; text-align: left; position: relative;">
        ${showImage ? `<div style="width: 100%; height: 280px; overflow: hidden; margin-bottom: 36px; border: 1px solid rgba(255,255,255,0.15);"><img src="${coverImageSrc}" alt="Cover" style="width: 100%; height: 100%; object-fit: cover; display: block; filter: grayscale(30%);" /></div>` : ''}
        <span style="font-size: 11px; font-weight: 600; letter-spacing: 5px; text-transform: uppercase; color: #9ca3af; margin-bottom: 24px;">LTD NOIR PRESS</span>
        <h1 style="font-size: 52px; font-weight: 700; color: #ffffff; margin: 0 0 24px; line-height: 1.1; letter-spacing: -1px; text-transform: uppercase;">${title}</h1>
        <div style="width: 100%; height: 2px; background-color: #ffffff; margin-bottom: 32px;"></div>
        <p style="font-size: 14px; font-weight: 300; letter-spacing: 2px; color: #9ca3af; text-transform: uppercase; margin: 0;">Special Editorial Edition</p>
      </div>`;
  } else if (theme === 'rose') {
    imageBorderColor = '#8B3A5A';
    themeStyles = `background-color: #FDF0F5; color: #5A4A4F; font-family: 'Playfair Display', Georgia, serif;`;
    contentHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 60px 50px; text-align: center; position: relative;">
        ${showImage ? coverImageHtml.replace('border: 2px solid;', `border: 2px solid ${imageBorderColor};`) : '<div style="font-size: 24px; color: #8B3A5A; margin-bottom: 24px; font-style: italic;">❀</div>'}
        <h1 style="font-size: 42px; font-weight: 600; color: #8B3A5A; margin: 0 0 16px; line-height: 1.25;">${title}</h1>
        <div style="width: 40px; height: 1px; background-color: #8B3A5A; margin: 16px auto;"></div>
        <p style="font-size: 15px; font-style: italic; color: #B38F9D; margin: 0;">Selected Prose &amp; Affirmations</p>
      </div>`;
  } else if (theme === 'wanderlust') {
    imageBorderColor = '#2A9D8F';
    themeStyles = `background-color: #ffffff; color: #2D3748; font-family: 'Inter', sans-serif; border: 16px solid #f7fafc; box-sizing: border-box;`;
    contentHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 60px 50px; text-align: center; position: relative;">
        ${showImage ? `<div style="width: 100%; max-width: 420px; height: 240px; overflow: hidden; margin-bottom: 28px; border-radius: 4px; border: 3px solid ${imageBorderColor};"><img src="${coverImageSrc}" alt="Cover" style="width: 100%; height: 100%; object-fit: cover; display: block;" /></div>` : ''}
        <h1 style="font-size: 44px; font-weight: 800; color: #2A9D8F; margin: 0 0 12px; line-height: 1.15; letter-spacing: -0.5px; font-family: 'Montserrat', sans-serif;">${title}</h1>
        <p style="font-size: 13px; font-weight: 500; letter-spacing: 4px; text-transform: uppercase; color: #4A5568; margin: 0;">A Journey Through Discovery</p>
        <div style="width: 50px; height: 3px; background-color: #2A9D8F; margin-top: 28px;"></div>
      </div>`;
  } else {
    themeStyles = `background-color: #FAF6F0; color: #5D4037; font-family: 'Playfair Display', Georgia, serif;`;
    contentHtml = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; padding: 60px 50px; text-align: center;">
        ${showImage ? coverImageHtml : ''}
        <h1 style="font-size: 40px; font-weight: 700; color: #8B4513; margin: 0 0 16px;">${title}</h1>
        <p style="font-size: 16px; font-style: italic; margin: 0;">E-Book Edition</p>
      </div>`;
  }

  return `<div style="width: 794px; height: 1123px; overflow: hidden; position: relative; box-sizing: border-box; ${themeStyles}">${contentHtml}</div>`;
}
