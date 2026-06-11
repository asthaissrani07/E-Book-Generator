'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Dashboard } from '@/app/components/Dashboard';
import { EbookViewer } from '@/app/components/EbookViewer';
import { parsePdf } from '@/lib/utils/pdfParser';
import type { EbookSection } from '@/lib/utils/pdfParser';
import { splitSection } from '@/lib/utils/contentSplitter';
import { rewriteChapterText, generateChapterImagePrompt } from '@/lib/utils/groqHelper';
import {
  buildImageUrl,
  buildEditorialImageSet,
  ensureSectionImageUrls,
  hasPollinationsApiKey,
  resolveImageUrl,
  getLastPollinationsError,
  invalidateEditorialCache,
  invalidateImageCache,
} from '@/lib/utils/imageHelper';
import type { GroqConfig } from '@/lib/utils/groqHelper';
import { Compass, Sparkles } from 'lucide-react';
import { LandingPage } from '@/app/components/LandingPage';
import type { ThemeId } from '@/lib/themes/types';
import { ExportProgressOverlay } from '@/app/components/ExportProgressOverlay';
import {
  estimateExportMinutes,
  preloadExportImages,
} from '@/lib/utils/pdfExport';
import { exportPrintPdf } from '@/lib/utils/printPdfExport';

function App() {
  const [appView, setAppView] = useState<'landing' | 'studio'>('landing');
  const [bookTitle, setBookTitle] = useState('');
  const [sections, setSections] = useState<EbookSection[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Undo/Redo History States
  const [past, setPast] = useState<EbookSection[][]>([]);
  const [future, setFuture] = useState<EbookSection[][]>([]);

  const updateSections = (newSections: EbookSection[]) => {
    if (JSON.stringify(newSections) !== JSON.stringify(sections)) {
      setPast(prev => [...prev, sections]);
      setFuture([]);
      setSections(newSections);
    }
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setFuture(prev => [sections, ...prev]);
    setSections(previous);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setPast(prev => [...prev, sections]);
    setFuture(newFuture);
    setSections(next);
  };

  // Load Groq configuration strictly from Next.js environment variables
  const groqConfig: GroqConfig = {
    apiKey: process.env.VITE_GROQ_API_KEY || '',
    model: 'llama-3.3-70b-versatile'
  };

  const [selectedTheme, setSelectedTheme] = useState<ThemeId>('editorial');
  const [dimensions, setDimensions] = useState<'letter' | 'a4' | 'legal'>('a4');

  // Storing theme overrides per theme
  const [themeOverrides, setThemeOverrides] = useState<Partial<Record<ThemeId, {
    bgColor?: string;
    textColor?: string;
    accentColor?: string;
    fontHeader?: string;
    fontBody?: string;
    fontSizeMult?: number;
  }>>>({});

  const customBgColor = themeOverrides[selectedTheme]?.bgColor ?? '';
  const customTextColor = themeOverrides[selectedTheme]?.textColor ?? '';
  const customAccentColor = themeOverrides[selectedTheme]?.accentColor ?? '';
  const customFontHeader = themeOverrides[selectedTheme]?.fontHeader ?? '';
  const customFontBody = themeOverrides[selectedTheme]?.fontBody ?? '';
  const customFontSizeMult = themeOverrides[selectedTheme]?.fontSizeMult ?? 1.0;

  const setCustomBgColor = (color: string) => {
    setThemeOverrides(prev => ({
      ...prev,
      [selectedTheme]: { ...prev[selectedTheme], bgColor: color }
    }));
  };
  const setCustomTextColor = (color: string) => {
    setThemeOverrides(prev => ({
      ...prev,
      [selectedTheme]: { ...prev[selectedTheme], textColor: color }
    }));
  };
  const setCustomAccentColor = (color: string) => {
    setThemeOverrides(prev => ({
      ...prev,
      [selectedTheme]: { ...prev[selectedTheme], accentColor: color }
    }));
  };
  const setCustomFontHeader = (font: string) => {
    setThemeOverrides(prev => ({
      ...prev,
      [selectedTheme]: { ...prev[selectedTheme], fontHeader: font }
    }));
  };
  const setCustomFontBody = (font: string) => {
    setThemeOverrides(prev => ({
      ...prev,
      [selectedTheme]: { ...prev[selectedTheme], fontBody: font }
    }));
  };
  const setCustomFontSizeMult = (mult: number) => {
    setThemeOverrides(prev => ({
      ...prev,
      [selectedTheme]: { ...prev[selectedTheme], fontSizeMult: mult }
    }));
  };

  const [isDashboardVisible, setIsDashboardVisible] = useState(true);

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

  // Split sections into pages using character-based contentSplitter
  const formattedPages = useMemo(() => {
    console.log('splitting content');
    const result: EbookSection[] = [];
    sections.forEach((sec, idx) => {
      const splitPages = splitSection(sec, selectedTheme, idx);
      splitPages.forEach(p => {
        (p as any).originalIndex = idx;
      });
      result.push(...splitPages);
    });
    return result;
  }, [sections, selectedTheme]);

  const [isStyling, setIsStyling] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrintReady, setIsPrintReady] = useState(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0 });
  const [exportStatus, setExportStatus] = useState('');
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isGeneratingImageMap, setIsGeneratingImageMap] = useState<{ [key: number]: boolean }>({});
  const [activeMobileView, setActiveMobileView] = useState<'controls' | 'preview'>('controls');
  const exportAbortRef = useRef<AbortController | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (formattedPages.length > 0) {
      setToastMessage(`Your book has been formatted into ${formattedPages.length} pages`);
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 4000);

      if (activePageIndex >= formattedPages.length) {
        setActivePageIndex(formattedPages.length - 1);
      }

      return () => clearTimeout(timer);
    }
  }, [formattedPages.length, activePageIndex]);

  const handleDownloadPDF = async () => {
    if (formattedPages.length === 0) {
      alert('Import a PDF first before exporting.');
      return;
    }

    if (formattedPages.length > 30) {
      const minutes = estimateExportMinutes(formattedPages.length);
      const proceed = window.confirm(
        `Exporting ${formattedPages.length} pages in high quality usually takes about ${minutes} minutes. The PDF will match your preview with sharp text and images. Keep this tab open. Continue?`
      );
      if (!proceed) return;
    }

    const abort = new AbortController();
    exportAbortRef.current = abort;
    setIsExporting(true);
    setIsPrintReady(false);
    setExportProgress({ current: 0, total: formattedPages.length });
    setExportStatus('Preparing images…');
    document.body.classList.add('pdf-exporting');

    try {
      await preloadExportImages(formattedPages, bookTitle, selectedTheme, (loaded, total) => {
        setExportStatus(`Preparing images… (${loaded}/${total})`);
      }, abort.signal);

      if (abort.signal.aborted) {
        throw new Error('Export cancelled.');
      }

      setExportStatus('');
      setIsPrintReady(true);
    } catch (err) {
      console.error('Image preloading failed: ', err);
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('cancelled') || abort.signal.aborted) {
        alert('PDF export cancelled.');
      } else {
        alert(`Could not preload images (${message}). Please try again.`);
      }
      setIsExporting(false);
      setIsPrintReady(false);
      setExportProgress({ current: 0, total: 0 });
      setExportStatus('');
      document.body.classList.remove('pdf-exporting');
    }
  };

  const handleTriggerPrint = async () => {
    try {
      setExportStatus('Opening print preview...');
      setIsPrintReady(false); // hide button once clicked

      await exportPrintPdf({
        sections: formattedPages,
        bookTitle,
        selectedTheme,
        customThemeStyles,
        onProgress: (current, total) => setExportProgress({ current, total }),
        signal: exportAbortRef.current?.signal,
        dimensions,
      });
    } catch (err) {
      console.error('PDF printing failed: ', err);
      const message = err instanceof Error ? err.message : String(err);
      alert(`Could not open print preview: ${message}`);
    } finally {
      exportAbortRef.current = null;
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
      setPast([]);
      setFuture([]);
      setActivePageIndex(0);
      setIsDashboardVisible(true);
      setActiveMobileView('controls');
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
    setPast([]);
    setFuture([]);
    setActivePageIndex(0);
    setIsDashboardVisible(true);
    setActiveMobileView('controls');
    setAppView('studio');
  };

  const handleUpdateSection = (formattedIndex: number, updated: EbookSection) => {
    const targetPage = formattedPages[formattedIndex];
    if (!targetPage) return;

    const originalIdx = (targetPage as any).originalIndex;
    if (originalIdx === undefined) return;

    const siblingPages = formattedPages.filter(p => (p as any).originalIndex === originalIdx);
    const relativeIdx = siblingPages.findIndex(p => p.id === targetPage.id);

    if (relativeIdx === -1) return;

    siblingPages[relativeIdx] = updated;

    // Join sibling page text contents
    const newContent = siblingPages.map(p => p.content).join('');

    const newSections = [...sections];
    newSections[originalIdx] = {
      ...newSections[originalIdx],
      title: updated.title,
      content: newContent,
      layout: updated.layout,
      showImage: updated.showImage,
      imagePrompt: updated.imagePrompt,
      imageUrl: updated.imageUrl,
      drawings: updated.drawings,
    };

    updateSections(newSections);
  };

  const handleDeleteSection = (formattedIndex: number) => {
    if (formattedPages.length <= 1) return;
    const targetPage = formattedPages[formattedIndex];
    if (!targetPage) return;

    const originalIdx = (targetPage as any).originalIndex;
    if (originalIdx === undefined) return;

    const copy = sections.filter((_, idx) => idx !== originalIdx);
    updateSections(copy);
    if (activePageIndex >= copy.length) {
      setActivePageIndex(Math.max(0, copy.length - 1));
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
    const newSectionsList = [...sections, newSection];
    updateSections(newSectionsList);
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
      updateSections(ensureSectionImageUrls(updatedSections, bookTitle));
      alert(`Successfully styled ${sections.length} page(s) using AI!`);
    } catch (err: any) {
      console.error(err);
      alert(`Styling error: ${err.message}`);
    } finally {
      setIsStyling(false);
    }
  };

  // Regenerate illustration for a single chapter
  const handleRegenerateImage = async (formattedIndex: number, customPrompt?: string) => {
    setIsGeneratingImageMap((prev) => ({ ...prev, [formattedIndex]: true }));
    const targetPage = formattedPages[formattedIndex];
    if (!targetPage) {
      setIsGeneratingImageMap((prev) => ({ ...prev, [formattedIndex]: false }));
      return;
    }

    const originalIdx = (targetPage as any).originalIndex;
    if (originalIdx === undefined) {
      setIsGeneratingImageMap((prev) => ({ ...prev, [formattedIndex]: false }));
      return;
    }

    const current = sections[originalIdx];
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

    invalidateImageCache(targetPrompt, originalIdx + 1);
    if (current.layout === 'editorial') {
      invalidateEditorialCache(current.chapterTitle || current.title, bookTitle, originalIdx + 1, selectedTheme);
    }

    const randomSeed = Math.floor(Math.random() * 10000);
    let newImageUrl = await resolveImageUrl(targetPrompt, randomSeed);
    let extraImageUrls = current.extraImageUrls;

    if (current.layout === 'editorial') {
      const imageSet = buildEditorialImageSet(
        current.chapterTitle || current.title,
        bookTitle,
        originalIdx + 1
      );
      if (customPrompt) {
        newImageUrl = await resolveImageUrl(targetPrompt, randomSeed);
      } else {
        newImageUrl = await resolveImageUrl(
          `Warm boho business ebook hero photo, ${current.chapterTitle || current.title}, sunflowers terracotta beige aesthetic`,
          (originalIdx + 1) * 41
        );
      }
      extraImageUrls = imageSet.extras;
    }

    const pollinationsErr = getLastPollinationsError();
    if (pollinationsErr?.includes('402') || pollinationsErr?.includes('PAYMENT_REQUIRED')) {
      console.warn('Pollinations balance empty — using stock photo fallback for this slot.');
    }

    const copy = [...sections];
    copy[originalIdx] = {
      ...current,
      imagePrompt: targetPrompt,
      imageUrl: newImageUrl,
      extraImageUrls,
      showImage: true,
    };
    updateSections(copy);

    setIsGeneratingImageMap((prev) => ({ ...prev, [formattedIndex]: false }));
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
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeMobileView === 'controls'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveMobileView('preview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeMobileView === 'preview'
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
        <div className={`${isDashboardVisible && activeMobileView === 'controls' ? 'flex' : (isDashboardVisible ? 'hidden md:flex' : 'hidden')} w-full md:w-[400px] h-full overflow-hidden shrink-0 border-r border-slate-200/40 z-10`}>
          <Dashboard
            bookTitle={bookTitle}
            onChangeTitle={setBookTitle}
            sections={formattedPages}
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
            sections={formattedPages}
            bookTitle={bookTitle}
            dimensions={dimensions}
            setDimensions={setDimensions}
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

            // Customizer state and actions
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

            // Dashboard toggle actions
            isDashboardVisible={isDashboardVisible}
            onToggleDashboard={() => setIsDashboardVisible(!isDashboardVisible)}

            // Undo/Redo integration
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={past.length > 0}
            canRedo={future.length > 0}
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
          isPrintReady={isPrintReady}
          onPrint={handleTriggerPrint}
        />
      )}

      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-slate-900/90 text-slate-100 rounded-xl border border-slate-700/80 shadow-2xl backdrop-blur-md animate-fade-in no-print text-xs font-semibold">
          <Sparkles className="text-amber-400 shrink-0" size={14} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return <App />;
}
