import React, { useRef } from 'react';
import { Moon, Sparkles, UploadCloud, Palette, BookOpen, Download, Star } from 'lucide-react';
import './landing.css';

interface LandingPageProps {
  onImportPdf: (file: File) => void;
  onLoadDemo?: () => void;
  isParsing: boolean;
  parseError: string | null;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onImportPdf,
  onLoadDemo,
  isParsing,
  parseError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImportPdf(file);
    e.target.value = '';
  };

  return (
    <div className="celestial-landing">
      <div className="celestial-bg-blob celestial-bg-blob-1" aria-hidden />
      <div className="celestial-bg-blob celestial-bg-blob-2" aria-hidden />
      <div className="celestial-bg-blob celestial-bg-blob-3" aria-hidden />

      <header className="celestial-header">
        <div className="celestial-logo" onClick={() => scrollTo('hero')} role="button" tabIndex={0}>
          <Moon size={18} strokeWidth={1.5} />
          <span>E-Book Generator</span>
        </div>

        <nav className="celestial-nav">
          <button type="button" onClick={() => scrollTo('features')}>Features</button>
          <button type="button" onClick={() => scrollTo('how-it-works')}>How It Works</button>
          <button type="button" onClick={() => scrollTo('about')}>About</button>
        </nav>
      </header>

      <main className="celestial-main">
        {/* Hero */}
        <section id="hero" className="celestial-hero">
          <div className="celestial-hero-left">
            <span className="celestial-sparkle celestial-sparkle-1" aria-hidden><Star size={14} fill="currentColor" /></span>
            <span className="celestial-sparkle celestial-sparkle-2" aria-hidden><Sparkles size={12} /></span>
            <span className="celestial-sparkle celestial-sparkle-3" aria-hidden><Star size={10} fill="currentColor" /></span>

            <p className="celestial-eyebrow">Celestial Style</p>
            <h1 className="celestial-headline">
              E Book
              <br />
              Generator
            </h1>
            <p className="celestial-tagline">You can do it</p>
          </div>

          <div className="celestial-hero-center">
            <div className="celestial-arch-frame">
              <img
                src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&q=80"
                alt="Open book with soft aesthetic lighting"
                className="celestial-arch-img"
              />
            </div>
          </div>

          <div className="celestial-hero-right">
            <p className="celestial-body">
              Give an aesthetic look to your e-book. Transform plain PDFs into beautifully
              styled pages with warm themes, editorial layouts, and AI-powered illustrations.
            </p>
            <p className="celestial-body-secondary">
              Import your manuscript, choose a design theme, style your chapters, and export
              a polished e-book — all in one calm, creative workspace.
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="celestial-btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing}
            >
              {isParsing ? (
                <>
                  <Sparkles size={16} className="animate-spin" />
                  <span>Reading your PDF…</span>
                </>
              ) : (
                <>
                  <UploadCloud size={18} />
                  <span>Import PDF</span>
                </>
              )}
            </button>

            {onLoadDemo && (
              <button
                type="button"
                className="celestial-btn-primary mt-2"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#e2e8f0',
                  marginTop: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  width: '100%',
                }}
                onClick={onLoadDemo}
                disabled={isParsing}
              >
                <Sparkles size={16} className="text-indigo-400" />
                <span>Load Demo Book</span>
              </button>
            )}

            {parseError && (
              <p className="celestial-error">{parseError}</p>
            )}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="celestial-section">
          <h2 className="celestial-section-title">Everything you need</h2>
          <div className="celestial-features-grid">
            <article className="celestial-feature-card">
              <UploadCloud size={22} strokeWidth={1.5} />
              <h3>PDF Import</h3>
              <p>Upload any PDF and we extract chapters, headings, and page content automatically.</p>
            </article>
            <article className="celestial-feature-card">
              <Palette size={22} strokeWidth={1.5} />
              <h3>Aesthetic Themes</h3>
              <p>Warm boho, botanical, modern, and noir themes — each with unique typography and layouts.</p>
            </article>
            <article className="celestial-feature-card">
              <Sparkles size={22} strokeWidth={1.5} />
              <h3>AI Stylist</h3>
              <p>Rewrite chapters and generate custom illustration prompts that match your chosen theme.</p>
            </article>
            <article className="celestial-feature-card">
              <Download size={22} strokeWidth={1.5} />
              <h3>Export</h3>
              <p>Download your finished e-book as a full PDF, ready to share or print.</p>
            </article>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="celestial-section celestial-section-alt">
          <h2 className="celestial-section-title">How it works</h2>
          <ol className="celestial-steps">
            <li>
              <span className="celestial-step-num">01</span>
              <div>
                <strong>Import your PDF</strong>
                <p>Drop your book or document on the landing page or inside the studio.</p>
              </div>
            </li>
            <li>
              <span className="celestial-step-num">02</span>
              <div>
                <strong>Choose a theme &amp; style</strong>
                <p>Pick warm editorial, botanical, or other aesthetics and apply AI styling.</p>
              </div>
            </li>
            <li>
              <span className="celestial-step-num">03</span>
              <div>
                <strong>Preview &amp; export</strong>
                <p>Edit pages, regenerate images, and download your beautiful e-book.</p>
              </div>
            </li>
          </ol>
        </section>

        {/* About */}
        <section id="about" className="celestial-section">
          <div className="celestial-about-grid">
            <div>
              <h2 className="celestial-section-title">About the studio</h2>
              <p className="celestial-about-text">
                E Book Generator is a creative workspace for authors, educators, and makers who
                want their documents to feel as good as they read. No design skills required —
                just import, style, and publish.
              </p>
            </div>
            <div className="celestial-about-stat">
              <BookOpen size={32} strokeWidth={1.2} />
              <span className="celestial-stat-label">Designed for long-form content</span>
            </div>
          </div>
        </section>

        {/* Contact / CTA */}
        <section id="contact" className="celestial-section celestial-cta-section">
          <h2 className="celestial-section-title">Ready to begin?</h2>
          <p className="celestial-cta-text">Take a deep breath — then import your PDF and start creating.</p>
          <button
            type="button"
            className="celestial-btn-primary celestial-btn-large"
            onClick={() => fileInputRef.current?.click()}
            disabled={isParsing}
          >
            <UploadCloud size={20} />
            <span>Import PDF &amp; Open Studio</span>
          </button>
        </section>
      </main>

      <footer className="celestial-footer">
        <span>© {new Date().getFullYear()} E Book Generator</span>
        <span className="celestial-footer-tag">Give aesthetic look to your e-book</span>
      </footer>
    </div>
  );
};
