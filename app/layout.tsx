import type { Metadata } from 'next';
import './globals.css';
import '../lib/themes/themes.css';

export const metadata: Metadata = {
  title: 'E Book Generator — Give aesthetic look to your e-book',
  description: 'Give an aesthetic look to your e-book. Transform plain PDFs into beautifully styled pages.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts for E-book Themes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;700&family=Lora:ital,wght@0,400;0,600;0,700;1,400&family=Montserrat:wght@400;500;700;800;900&family=Outfit:wght@300;400;600;700&family=Pacifico&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Poppins:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
