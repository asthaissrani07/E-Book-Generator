import { useRef, useState, useEffect } from 'react';
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
import { ExportProgressOverlay } from './components/ExportProgressOverlay';
import {
  estimateExportMinutes,
  exportStyledEbookPdf,
  preloadExportImages,
  prepareElementForPdfCapture,
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
  const [customBgColor, setCustomBgColor] = useState('');
  const [customTextColor, setCustomTextColor] = useState('');
  const [customAccentColor, setCustomAccentColor] = useState('');
  const [customFontHeader, setCustomFontHeader] = useState('');
  const [customFontBody, setCustomFontBody] = useState('');
  const [customFontSizeMult, setCustomFontSizeMult] = useState(1.0);

  // Load custom Google Fonts dynamically
  useEffect(() => {
    const fontsToLoad = [customFontHeader, customFontBody].filter(Boolean) as string[];
    if (fontsToLoad.length === 0) return;
    
    // De-duplicate and filter out system fallbacks
    const uniqueFonts = Array.from(new Set(fontsToLoad)).filter(f => !['serif', 'sans-serif', 'monospace', 'cursive'].includes(f.toLowerCase()));
    if (uniqueFonts.length === 0) return;

    const fontUrl = `https://fonts.googleapis.com/css2?family=${uniqueFonts.map(f => f.replace(/\s+/g, '+')).join('&family=')}&display=swap`;
    const existingLink = document.querySelector(`link[href="${fontUrl}"]`);
    if (!existingLink) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontUrl;
      document.head.appendChild(link);
    }
  }, [customFontHeader, customFontBody]);

  const customThemeStyles = {
    ...(customBgColor ? { '--eb-bg': customBgColor } : {}),
    ...(customTextColor ? { '--eb-text': customTextColor } : {}),
    ...(customAccentColor ? { '--eb-accent': customAccentColor } : {}),
    ...(customFontHeader ? { '--eb-font-header': `"${customFontHeader}", sans-serif` } : {}),
    ...(customFontBody ? { '--eb-font-body': `"${customFontBody}", sans-serif` } : {}),
    '--eb-font-size-mult': String(customFontSizeMult),
  } as React.CSSProperties;

  const [isStyling, setIsStyling] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [exportStatus, setExportStatus] = useState('');
  const [pdfExportPageIndex, setPdfExportPageIndex] = useState<number | null>(null);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isGeneratingImageMap, setIsGeneratingImageMap] = useState<{ [key: number]: boolean }>({});
  const [activeMobileView, setActiveMobileView] = useState<'controls' | 'preview'>('controls');
  const exportAbortRef = useRef<AbortController | null>(null);

  const handleDownloadPDF = async () => {
    if (sections.length === 0) {
      alert('Import a PDF first before exporting.');
      return;
    }

    if (sections.length > 30) {
      const minutes = estimateExportMinutes(sections.length);
      const proceed = window.confirm(
        `Exporting ${sections.length} pages in high quality usually takes about ${minutes} minutes. The PDF will match your preview with sharp text and images. Keep this tab open. Continue?`
      );
      if (!proceed) return;
    }

    const element = document.getElementById('ebook-download-area') as HTMLElement | null;
    if (!element) {
      alert('Export area not found. Please reload the page and try again.');
      return;
    }

    const filename = `${(bookTitle || 'ebook').toLowerCase().replace(/\s+/g, '_')}_ebook.pdf`;
    const abort = new AbortController();
    exportAbortRef.current = abort;
    setIsExporting(true);
    setExportProgress({ current: 0, total: sections.length });
    setExportStatus('Preparing images…');
    document.body.classList.add('pdf-exporting');

    const restoreCaptureStyles = prepareElementForPdfCapture(element);

    try {
      await preloadExportImages(sections, bookTitle, selectedTheme, (loaded, total) => {
        setExportStatus(`Preparing images… (${loaded}/${total})`);
      });

      if (abort.signal.aborted) {
        throw new Error('Export cancelled.');
      }

      setExportStatus('');

      await exportStyledEbookPdf({
        totalPages: sections.length,
        filename,
        signal: abort.signal,
        onProgress: (current, total) => setExportProgress({ current, total }),
        onRenderPage: (pageIndex) => {
          flushSync(() => {
            setPdfExportPageIndex(pageIndex);
            setActivePageIndex(pageIndex);
          });
        },
        getPageElement: () =>
          element.querySelector('.ebook-page') as HTMLElement | null,
      });
    } catch (err) {
      console.error('PDF generation failed: ', err);
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('cancelled')) {
        alert('PDF export cancelled.');
      } else {
        alert(`Could not export PDF${message ? ` (${message})` : ''}. Please try again.`);
      }
    } finally {
      exportAbortRef.current = null;
      flushSync(() => setPdfExportPageIndex(null));
      restoreCaptureStyles();
      document.body.classList.remove('pdf-exporting');
      setIsExporting(false);
      setExportProgress({ current: 0, total: 0 });
      setExportStatus('');
    }
  };

  const handleCancelExport = () => {
    exportAbortRef.current?.abort();
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

  const handleLoadDemo = () => {
    const title = 'Whispers of the Cosmos';
    const demoSections: EbookSection[] = [
      {
        id: 'demo-1',
        title: 'Front Cover',
        chapterTitle: 'Front Cover',
        showChapterHeading: false,
        showImage: true,
        content: 'Whispers of the Cosmos\n\nAn Editorial Journey through Stars and Silence\n\nBy Sarah Penrose',
        imagePrompt: 'Minimal editorial layout cover, celestial map with thin gold lines, dark navy background, stargazing aesthetic',
        imageUrl: buildImageUrl('Minimal editorial layout cover, celestial map with thin gold lines, dark navy background, stargazing aesthetic', 7),
        layout: 'cover',
      },
      {
        id: 'demo-2',
        title: 'Chapter 1: The First Star',
        chapterTitle: 'The First Star',
        showChapterHeading: true,
        showImage: true,
        content: 'It was an evening of quiet wonders when we first noticed the shift. In the high desert, far from city glows, the sky turned a deep, velvety shade of indigo.\n\n"Look," she said, pointing toward the eastern horizon. A single pinprick of light flickered with intense gold warmth. It did not match any star chart. We sat in the cold silence of the dune, listening to the wind and watching the visitor rise slowly, as if deciding whether to stay.',
        imagePrompt: 'Warm boho business ebook photo, chapter title page, starry sky golden light terracotta beige aesthetic',
        imageUrl: buildImageUrl('Starry sky golden light terracotta beige aesthetic', 42),
        extraImageUrls: buildEditorialImageSet('The First Star', 'Whispers of the Cosmos', 2).extras,
        layout: 'editorial',
      },
      {
        id: 'demo-3',
        title: 'Chapter 2: Beyond the Horizon',
        chapterTitle: 'Beyond the Horizon',
        showChapterHeading: true,
        showImage: true,
        content: 'To travel beyond what is known requires more than just map and compass. It requires a willingness to lose sight of the shore.\n\nOur instruments hummed in the stillness. Every reading pointed to a region of space that theoretically should not exist. A pocket of silence, a cosmic shelter. As we drew nearer, the stars ahead began to dim, swallowed by a gentle shadow that felt less like darkness and more like a warm embrace.',
        imagePrompt: 'Desert dunes and starlight, minimal space explorer, warm terracotta beige gold colors',
        imageUrl: buildImageUrl('Desert dunes and starlight, minimal space explorer, warm terracotta beige gold colors', 83),
        layout: 'split',
      }
    ];

    setBookTitle(title);
    setSections(ensureSectionImageUrls(demoSections, title));
    setActivePageIndex(0);
    setAppView('studio');
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
            current.layout === 'cover' ? 'editorial' : selectedTheme
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
          current.layout === 'cover' ? 'editorial' : selectedTheme
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
        onLoadDemo={handleLoadDemo}
        isParsing={isParsing}
        parseError={parseError}
      />
    );
  }

  return (
    <div className="app-shell flex flex-col h-screen w-screen overflow-hidden select-none">
      {/* Mobile Top Navigation Toggle (hidden on desktop screens >= 768px) */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 no-print shrink-0">
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

      <div className="flex-1 flex flex-col md:flex-row w-full h-full overflow-hidden">
        {/* 1. Dashboard Control Panel Wrapper */}
        <div className={`${activeMobileView === 'controls' ? 'flex' : 'hidden'} md:flex w-full md:w-[400px] h-full overflow-hidden shrink-0`}>
          <Dashboard
            bookTitle={bookTitle}
            onChangeTitle={setBookTitle}
            sections={sections}
            groqConfig={groqConfig}
            selectedTheme={selectedTheme}
            onChangeTheme={setSelectedTheme}
            customBgColor={customBgColor}
            onChangeBgColor={setCustomBgColor}
            customTextColor={customTextColor}
            onChangeTextColor={setCustomTextColor}
            customAccentColor={customAccentColor}
            onChangeAccentColor={setCustomAccentColor}
            customFontHeader={customFontHeader}
            onChangeFontHeader={setCustomFontHeader}
            customFontBody={customFontBody}
            onChangeFontBody={setCustomFontBody}
            customFontSizeMult={customFontSizeMult}
            onChangeFontSizeMult={setCustomFontSizeMult}
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
        <div className={`${activeMobileView === 'preview' ? 'flex' : 'hidden'} md:flex flex-1 h-full overflow-hidden flex flex-col relative`}>
          <EbookViewer
            sections={sections}
            bookTitle={bookTitle}
            selectedTheme={selectedTheme}
            customThemeStyles={customThemeStyles}
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

      {isExporting && exportProgress.total > 0 && (
        <ExportProgressOverlay
          current={exportProgress.current}
          total={exportProgress.total}
          statusMessage={exportStatus || undefined}
          onCancel={handleCancelExport}
        />
      )}

      <div
        id="ebook-download-wrapper"
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          width: 595,
          zIndex: 1,
          pointerEvents: 'none',
          visibility: pdfExportPageIndex !== null ? 'visible' : 'hidden',
        }}
        aria-hidden={pdfExportPageIndex === null}
      >
        <div
          id="ebook-download-area"
          className={`theme-${selectedTheme} ebook-preview-container`}
          style={{
            width: 595,
            maxWidth: 595,
            overflow: 'hidden',
            ...(pdfExportPageIndex !== null && sections[pdfExportPageIndex]?.layout === 'cover' ? {} : customThemeStyles)
          }}
        >
          {pdfExportPageIndex !== null && sections[pdfExportPageIndex] && (
            <div
              className="ebook-page-wrapper page-break"
              style={sections[pdfExportPageIndex]?.layout === 'cover' ? undefined : customThemeStyles}
            >
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
