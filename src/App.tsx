import { useState } from 'react';
import { flushSync } from 'react-dom';
import { Dashboard } from './components/Dashboard';
import { EbookViewer } from './components/EbookViewer';
import { parsePdf } from './utils/pdfParser';
import type { EbookSection } from './utils/pdfParser';
import { rewriteChapterText, generateChapterImagePrompt } from './utils/groqHelper';
import {
  buildImageUrl,
  buildEditorialImageSet,
  ensureSectionImageUrls,
  hasPollinationsApiKey,
  resolveImageUrl,
  getLastPollinationsError,
  invalidateEditorialCache,
  invalidateImageCache,
} from './utils/imageHelper';
import type { GroqConfig } from './utils/groqHelper';
import { Compass, Sparkles } from 'lucide-react';
import { PageLayout } from './components/PageLayout';
import { LandingPage } from './components/LandingPage';
import type { ThemeId } from './themes/types';
import {
  prepareElementForPdfCapture,
  exportEbookPageByPage,
} from './utils/pdfExport';

function App() {
  const [appView, setAppView] = useState<'landing' | 'studio'>('landing');
  const [bookTitle, setBookTitle] = useState('');
  const [sections, setSections] = useState<EbookSection[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  
  // Load Groq configuration strictly from the local environment variable
  const groqConfig: GroqConfig = {
    apiKey: import.meta.env.VITE_GROQ_API_KEY || '',
    model: 'llama-3.3-70b-versatile'
  };

  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('editorial');
  const [isStyling, setIsStyling] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [pdfExportPageIndex, setPdfExportPageIndex] = useState<number | null>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isGeneratingImageMap, setIsGeneratingImageMap] = useState<{ [key: number]: boolean }>({});
  const [activeMobileView, setActiveMobileView] = useState<'controls' | 'preview'>('controls');



  const handleDownloadPDF = async () => {
    if (sections.length === 0) {
      alert('Import a PDF first before exporting.');
      return;
    }

    const html2pdf = (window as any).html2pdf;
    if (!html2pdf) {
      alert('PDF converter library is still loading. Please wait a moment and try again.');
      return;
    }

    const element = document.getElementById('ebook-download-area') as HTMLElement | null;
    if (!element) {
      alert('Export area not found. Please reload the page and try again.');
      return;
    }

    const filename = `${(bookTitle || 'ebook').toLowerCase().replace(/\s+/g, '_')}_ebook.pdf`;
    setIsExporting(true);
    setExportProgress({ current: 0, total: sections.length });

    const restoreCaptureStyles = prepareElementForPdfCapture(element);

    try {
      await exportEbookPageByPage({
        totalPages: sections.length,
        filename,
        onProgress: (current, total) => setExportProgress({ current, total }),
        onRenderPage: (pageIndex) => {
          flushSync(() => setPdfExportPageIndex(pageIndex));
        },
        getPageElement: () =>
          element.querySelector('.ebook-page') as HTMLElement | null,
      });
    } catch (err) {
      console.error('PDF generation failed: ', err);
      alert(
        'Could not export PDF. For very large books this may take several minutes — try again, or use Print PDF.'
      );
    } finally {
      flushSync(() => setPdfExportPageIndex(null));
      restoreCaptureStyles();
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0 });
    }
  };

  const handleUploadPdf = async (file: File) => {
    setIsParsing(true);
    setParseError(null);
    try {
      const result = await parsePdf(file);
      setBookTitle(result.title);
      setSections(ensureSectionImageUrls(result.sections, result.title));
      setActivePageIndex(0);
      setAppView('studio');
    } catch (err: any) {
      console.error(err);
      setParseError(err.message || 'An unexpected error occurred while parsing the PDF.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleUpdateSection = (index: number, updated: EbookSection) => {
    const copy = [...sections];
    copy[index] = updated;
    setSections(copy);
  };

  const handleDeleteSection = (index: number) => {
    if (sections.length <= 1) return;
    const copy = sections.filter((_, idx) => idx !== index);
    setSections(copy);
    if (activePageIndex >= copy.length) {
      setActivePageIndex(copy.length - 1);
    }
  };

  const handleAddSection = () => {
    const pageNum = sections.length + 1;
    const imageSet = buildEditorialImageSet('New Chapter', bookTitle || 'Garden', pageNum);
    const newSection: EbookSection = {
      id: `section-added-${Date.now()}`,
      title: 'New Artistic Chapter',
      content: 'Write your content here. Double-click or select this block to customize the text layout.',
      imagePrompt: 'Editorial magazine photograph, garden newspaper style',
      imageUrl: imageSet.primary,
      extraImageUrls: imageSet.extras,
      showImage: true,
      layout: 'editorial',
    };
    setSections([...sections, newSection]);
    setActivePageIndex(sections.length);
  };

  // Rewrite all sections using Groq API
  const handleStyleChapters = async (styleOption: string) => {
    if (!groqConfig.apiKey) {
      alert('Please configure your Groq API Key first.');
      return;
    }

    setIsStyling(true);
    const updatedSections = [...sections];

    try {
      for (let i = 0; i < sections.length; i++) {
        const current = sections[i];
        
        // Don't rewrite the cover page summary, but do generate its prompt
        let rewrittenContent = current.content;
        if (current.layout !== 'cover') {
          try {
            rewrittenContent = await rewriteChapterText(groqConfig, current.content, styleOption);
          } catch (e) {
            console.warn(`Failed text rewrite for chapter ${i + 1}:`, e);
          }
        }

        // Generate customized prompt for images matching the active design theme
        let generatedPrompt = current.imagePrompt;
        try {
          generatedPrompt = await generateChapterImagePrompt(
            groqConfig,
            current.title,
            rewrittenContent,
            selectedTheme
          );
        } catch (e) {
          console.warn(`Failed image prompt generation for chapter ${i + 1}:`, e);
        }

        const randomSeed = Math.floor(Math.random() * 1000);
        let newImageUrl = current.imageUrl;
        let extraImageUrls = current.extraImageUrls;

        if (current.layout === 'editorial') {
          const imageSet = buildEditorialImageSet(
            current.chapterTitle || current.title,
            bookTitle,
            i + 1
          );
          extraImageUrls = imageSet.extras;
        } else {
          newImageUrl = buildImageUrl(generatedPrompt, randomSeed);
        }

        updatedSections[i] = {
          ...current,
          content: rewrittenContent,
          imagePrompt: generatedPrompt,
          imageUrl: newImageUrl,
          extraImageUrls,
          showImage: true,
        };
      }
      setSections(ensureSectionImageUrls(updatedSections, bookTitle));
      alert(`Successfully styled ${sections.length} page(s) using AI!`);
    } catch (err: any) {
      console.error(err);
      alert(`Styling error: ${err.message}`);
    } finally {
      setIsStyling(false);
    }
  };

  // Regenerate illustration for a single chapter
  const handleRegenerateImage = async (index: number, customPrompt?: string) => {
    setIsGeneratingImageMap((prev) => ({ ...prev, [index]: true }));
    const current = sections[index];
    
    let targetPrompt = customPrompt || current.imagePrompt;

    // If no custom prompt provided, and Groq is configured, generate a fresh prompt based on current text
    if (!customPrompt && groqConfig.apiKey) {
      try {
        targetPrompt = await generateChapterImagePrompt(
          groqConfig,
          current.title,
          current.content,
          selectedTheme
        );
      } catch (e: any) {
        console.error("Could not generate prompt using Groq: ", e);
      }
    }

    if (!hasPollinationsApiKey()) {
      alert(
        'AI image generation requires a Pollinations API key. Add VITE_POLLINATIONS_API_KEY to your .env file (get one at enter.pollinations.ai).'
      );
    } else {
      console.info('Requesting image from Pollinations API — generation may take 30–60 seconds.');
    }

    invalidateImageCache(targetPrompt, index + 1);
    if (current.layout === 'editorial') {
      invalidateEditorialCache(current.chapterTitle || current.title, bookTitle, index + 1, selectedTheme);
    }

    const randomSeed = Math.floor(Math.random() * 10000);
    let newImageUrl = await resolveImageUrl(targetPrompt, randomSeed);
    let extraImageUrls = current.extraImageUrls;

    if (current.layout === 'editorial') {
      const imageSet = buildEditorialImageSet(
        current.chapterTitle || current.title,
        bookTitle,
        index + 1
      );
      if (customPrompt) {
        newImageUrl = await resolveImageUrl(targetPrompt, randomSeed);
      } else {
        newImageUrl = await resolveImageUrl(
          `Warm boho business ebook hero photo, ${current.chapterTitle || current.title}, sunflowers terracotta beige aesthetic`,
          (index + 1) * 41
        );
      }
      extraImageUrls = imageSet.extras;
    }

    const pollinationsErr = getLastPollinationsError();
    if (pollinationsErr?.includes('402') || pollinationsErr?.includes('PAYMENT_REQUIRED')) {
      console.warn('Pollinations balance empty — using stock photo fallback for this slot.');
    }

    handleUpdateSection(index, {
      ...current,
      imagePrompt: targetPrompt,
      imageUrl: newImageUrl,
      extraImageUrls,
      showImage: true,
    });

    setIsGeneratingImageMap((prev) => ({ ...prev, [index]: false }));
  };

  const handleSelectPage = (idx: number) => {
    setActivePageIndex(idx);
    // On mobile/narrow screens the preview is hidden until explicitly opened
    setActiveMobileView('preview');

    const scrollToPage = () => {
      const container = document.getElementById('ebook-print-area');
      const pages = container?.querySelectorAll('.ebook-page-wrapper');
      if (pages && pages[idx]) {
        pages[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // Wait for the preview panel to become visible before scrolling
    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToPage);
    });
  };

  if (appView === 'landing') {
    return (
      <LandingPage
        onImportPdf={handleUploadPdf}
        isParsing={isParsing}
        parseError={parseError}
      />
    );
  }

  return (
    <div className="app-shell flex flex-col h-screen w-screen overflow-hidden select-none">
      {/* Mobile Top Navigation Toggle (hidden on desktop screens >= 1024px) */}
      <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 no-print shrink-0">
        <div className="flex items-center gap-2">
          <div className="wk-brand-icon">
            <Compass size={18} />
          </div>
          <span className="font-bold text-slate-100 text-sm">
            E-Book <span className="font-script text-indigo-400">Studio</span>
          </span>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveMobileView('controls')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMobileView === 'controls'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveMobileView('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeMobileView === 'preview'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row w-full h-full overflow-hidden">
        {/* 1. Dashboard Control Panel Wrapper */}
        <div className={`${activeMobileView === 'controls' ? 'flex' : 'hidden'} lg:flex w-full lg:w-[420px] h-full overflow-hidden shrink-0`}>
          <Dashboard
            bookTitle={bookTitle}
            onChangeTitle={setBookTitle}
            sections={sections}
            groqConfig={groqConfig}
            selectedTheme={selectedTheme}
            onChangeTheme={setSelectedTheme}
            onStyleChapters={handleStyleChapters}
            isStyling={isStyling}
            onAddPage={handleAddSection}
            activePageIndex={activePageIndex}
            onSelectPage={handleSelectPage}
            onUpdateSection={handleUpdateSection}
            onDownloadPDF={handleDownloadPDF}
            isExporting={isExporting}
            exportProgress={exportProgress}
          />
        </div>

        {/* 2. Scrollable Book Preview Workspace Wrapper */}
        <div className={`${activeMobileView === 'preview' ? 'flex' : 'hidden'} lg:flex flex-1 h-full overflow-hidden flex flex-col relative`}>
          <EbookViewer
            sections={sections}
            bookTitle={bookTitle}
            selectedTheme={selectedTheme}
            onUpdateSection={handleUpdateSection}
            onDeleteSection={handleDeleteSection}
            onAddSection={handleAddSection}
            onRegenerateImage={handleRegenerateImage}
            isGeneratingImageMap={isGeneratingImageMap}
            onDownloadPDF={handleDownloadPDF}
            isExporting={isExporting}
            exportProgress={exportProgress}
            onNavigateToDashboard={() => setActiveMobileView('controls')}
            activePageIndex={activePageIndex}
            onSelectPage={handleSelectPage}
          />
          
          {/* Progress Overlay during AI styling */}
          {isStyling && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4 no-print animate-fade-in">
              <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl flex flex-col items-center space-y-4 max-w-sm text-center">
                <div className="relative">
                  <Compass className="text-indigo-500 animate-spin" size={44} />
                  <Sparkles className="text-amber-400 absolute -top-1 -right-1 animate-pulse" size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">AI Stylist at Work</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Rewriting book chapters, optimizing syntax, and generating custom scenes matching your selected theme colors. This may take a few moments.
                  </p>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full w-2/3 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dedicated off-screen container for PDF download generation to prevent display:none failures on mobile */}
      <div
        id="ebook-download-wrapper"
        style={{ position: 'fixed', left: 0, top: 0, zIndex: -1, pointerEvents: 'none', opacity: 0 }}
        className="no-print"
        aria-hidden
      >
        <div id="ebook-download-area" className={`theme-${selectedTheme} ebook-preview-container`}>
          {pdfExportPageIndex !== null && sections[pdfExportPageIndex] && (
            <div className="ebook-page-wrapper page-break">
              <PageLayout
                section={sections[pdfExportPageIndex]}
                pageIndex={pdfExportPageIndex + 1}
                totalPages={sections.length}
                bookTitle={bookTitle}
                selectedTheme={selectedTheme}
                onUpdateSection={() => {}}
                onDeleteSection={() => {}}
                onRegenerateImage={async () => {}}
                isGeneratingImage={false}
                isActive={true}
                pdfExportMode
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
