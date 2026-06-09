import React, { useState } from 'react';
import { PageLayout } from './PageLayout';
import type { EbookSection } from '../utils/pdfParser';
import type { ThemeId } from '../themes/types';
import { ThemeSelector } from './ThemeSelector';
import { LARGE_BOOK_PAGE_THRESHOLD } from '../utils/pdfExport';
import {
  FileText,
  Columns,
  Square,
  Plus,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Grid,
  Image as ImageIcon,
  Type,
  Smile,
  PenTool,
  Table,
  MessageSquare,
  Sliders,
  RefreshCw,
  Palette,
  Undo2,
  Redo2,
  Bot,
  Layers
} from 'lucide-react';

interface EbookViewerProps {
  sections: EbookSection[];
  bookTitle: string;
  selectedTheme: ThemeId;
  customThemeStyles?: React.CSSProperties;
  onUpdateSection: (index: number, updated: EbookSection) => void;
  onDeleteSection: (index: number) => void;
  onAddSection: () => void;
  onRegenerateImage: (index: number, customPrompt?: string) => Promise<void>;
  isGeneratingImageMap: { [key: number]: boolean };
  onDownloadPDF: () => void;
  isExporting: boolean;
  exportProgress: { current: number; total: number };
  onNavigateToDashboard: () => void;
  activePageIndex: number;
  onSelectPage: (idx: number) => void;

  // Customizer state and actions
  onChangeTheme: (themeId: ThemeId) => void;
  customBgColor: string;
  onChangeBgColor: (color: string) => void;
  customTextColor: string;
  onChangeTextColor: (color: string) => void;
  customAccentColor: string;
  onChangeAccentColor: (color: string) => void;
  customFontHeader: string;
  onChangeFontHeader: (font: string) => void;
  customFontBody: string;
  onChangeFontBody: (font: string) => void;
  customFontSizeMult: number;
  onChangeFontSizeMult: (mult: number) => void;
  onStyleChapters?: (style: string) => Promise<void>;
  isStyling?: boolean;

  // Dashboard Toggle Actions
  isDashboardVisible: boolean;
  onToggleDashboard: () => void;
}

export const EbookViewer: React.FC<EbookViewerProps> = ({
  sections,
  bookTitle,
  selectedTheme,
  customThemeStyles,
  onUpdateSection,
  onDeleteSection,
  onAddSection,
  onRegenerateImage,
  isGeneratingImageMap,
  onDownloadPDF,
  isExporting,
  exportProgress,
  activePageIndex,
  onSelectPage,

  // Customizer actions
  onChangeTheme,
  customBgColor,
  onChangeBgColor,
  onChangeTextColor,
  customFontHeader,
  onChangeFontHeader,
  customFontSizeMult,
  onChangeFontSizeMult,
  onStyleChapters,
  isStyling = false,

  isDashboardVisible,
  onToggleDashboard,
}) => {
  const [viewMode, setViewMode] = useState<'single' | 'spread' | 'grid'>('single');
  const [zoom, setZoom] = useState<number>(75);
  const [activeRightSidebarTab, setActiveRightSidebarTab] = useState<'chat' | 'design' | 'details' | 'assets' | 'animate' | null>('chat');
  const [isPagesPanelOpen, setIsPagesPanelOpen] = useState<boolean>(true);
  const [dottedGrid, setDottedGrid] = useState<boolean>(true);
  const [dimensions, setDimensions] = useState<'letter' | 'a4' | 'legal'>('a4');
  const [stickersOpen, setStickersOpen] = useState<boolean>(false);
  const [drawMode, setDrawMode] = useState<boolean>(false);
  const [drawColor, setDrawColor] = useState<string>('#e91e8c');

  // AI chat states
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'moda', text: string }>>([
    { sender: 'moda', text: "Hi! I'm Moda, your AI E-Book designer. Let's build a gorgeous, premium layout! What style or theme would you like to apply today?" }
  ]);
  const [chatTasks, setChatTasks] = useState<Array<{ id: number, label: string, status: 'done' | 'pending' }>>([
    { id: 1, label: 'Generating design elements...', status: 'done' },
    { id: 2, label: 'Create A4 PDF pages', status: 'done' },
    { id: 3, label: 'Generate custom illustrations (AI)', status: 'pending' },
    { id: 4, label: 'Style headings & margins', status: 'pending' },
    { id: 5, label: 'Final layout polish', status: 'pending' },
  ]);

  const [shareToast, setShareToast] = useState<boolean>(false);

  const isLargeBook = sections.length > LARGE_BOOK_PAGE_THRESHOLD;
  const useCompactPreview = isLargeBook || viewMode === 'single';

  // Aspect ratio sizes
  const pageDims = dimensions === 'letter' 
    ? { w: 612, h: 792 } 
    : dimensions === 'legal' 
      ? { w: 612, h: 1008 } 
      : { w: 595, h: 842 }; // standard A4

  const handlePrint = () => {
    if (isLargeBook) {
      const ok = window.confirm(
        `This book has ${sections.length} pages. Browser print works best with smaller books. Use Download PDF for the full export. Print current view anyway?`
      );
      if (!ok) return;
    }
    window.print();
  };

  const goToPrev = () => {
    if (activePageIndex > 0) onSelectPage(activePageIndex - 1);
  };

  const goToNext = () => {
    if (activePageIndex < sections.length - 1) onSelectPage(activePageIndex + 1);
  };

  const triggerShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 2500);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);

    // Simulate agent response
    setTimeout(async () => {
      const textLower = userText.toLowerCase();
      let responseText = "I'm on it! I will scan the book pages and suggest visual enhancements matching your prompt.";
      let matchedTheme: ThemeId | null = null;

      if (textLower.includes('boho') || textLower.includes('editorial')) {
        matchedTheme = 'editorial';
      } else if (textLower.includes('wander') || textLower.includes('travel')) {
        matchedTheme = 'wanderlust';
      } else if (textLower.includes('pink') || textLower.includes('rose')) {
        matchedTheme = 'softpink';
      } else if (textLower.includes('comic') || textLower.includes('art')) {
        matchedTheme = 'comic';
      } else if (textLower.includes('sport') || textLower.includes('athlet')) {
        matchedTheme = 'sporty';
      } else if (textLower.includes('wellness') || textLower.includes('calm')) {
        matchedTheme = 'wellness';
      } else if (textLower.includes('construct') || textLower.includes('zine')) {
        matchedTheme = 'construct';
      } else if (textLower.includes('news') || textLower.includes('paper')) {
        matchedTheme = 'newspaper';
      } else if (textLower.includes('botanical') || textLower.includes('garden')) {
        matchedTheme = 'botanical';
      } else if (textLower.includes('modern') || textLower.includes('clean')) {
        matchedTheme = 'modern';
      } else if (textLower.includes('noir') || textLower.includes('dark')) {
        matchedTheme = 'noir';
      }

      if (matchedTheme) {
        responseText = `Adjusting theme to "${matchedTheme.toUpperCase()}" and applying aesthetic guidelines to all pages...`;
        onChangeTheme(matchedTheme);
        setChatMessages(prev => [...prev, { sender: 'moda', text: responseText }]);
        setChatTasks(prev => prev.map((t, idx) => idx < 3 ? { ...t, status: 'done' } : t));
      } else if (textLower.includes('style') && onStyleChapters) {
        responseText = "Applying AI Writing Stylist and prompt generation to all pages. Initiating Groq and Pollinations tasks...";
        setChatMessages(prev => [...prev, { sender: 'moda', text: responseText }]);
        try {
          await onStyleChapters('Poetic & Artistic');
          setChatMessages(prev => [...prev, { sender: 'moda', text: 'All chapters styled successfully! How does it look?' }]);
          setChatTasks(prev => prev.map(t => ({ ...t, status: 'done' })));
        } catch (err) {
          setChatMessages(prev => [...prev, { sender: 'moda', text: 'Styling encountered an error: ' + (err as Error).message }]);
        }
      } else {
        setChatMessages(prev => [...prev, { sender: 'moda', text: responseText }]);
      }
    }, 800);
  };

  const addTableToActivePage = () => {
    const activeSection = sections[activePageIndex];
    if (!activeSection) return;

    const tableHtml = `
<table style="width: 100%; border-collapse: collapse; margin-top: 1rem; font-size: 0.8rem;">
  <thead>
    <tr style="border-bottom: 2px solid var(--eb-accent); text-align: left;">
      <th style="padding: 6px;">Category</th>
      <th style="padding: 6px;">Details</th>
    </tr>
  </thead>
  <tbody>
    <tr style="border-bottom: 1px solid var(--eb-border);">
      <td style="padding: 6px; font-weight: 600;">Concept</td>
      <td style="padding: 6px;">Custom generated content node</td>
    </tr>
    <tr style="border-bottom: 1px solid var(--eb-border);">
      <td style="padding: 6px; font-weight: 600;">Status</td>
      <td style="padding: 6px;">Verified layout</td>
    </tr>
  </tbody>
</table>
`;
    onUpdateSection(activePageIndex, {
      ...activeSection,
      content: activeSection.content + '\n' + tableHtml
    });
  };

  const addStickerToActivePage = (stickerText: string) => {
    const activeSection = sections[activePageIndex];
    if (!activeSection) return;

    const stickerHtml = `
<span class="inline-block px-3 py-1 bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold uppercase tracking-wider rounded-xl select-none" style="transform: rotate(-3deg); margin: 0.5rem 0.25rem;">
  ${stickerText}
</span>
`;
    onUpdateSection(activePageIndex, {
      ...activeSection,
      content: activeSection.content + '\n' + stickerHtml
    });
    setStickersOpen(false);
  };

  const renderPage = (section: EbookSection, idx: number) => {
    const scale = zoom / 100;
    return (
      <div
        key={section.id}
        className="editor-page-outer-container relative flex-shrink-0"
        style={{
          width: `${pageDims.w * scale}px`,
          height: `${pageDims.h * scale}px`,
          margin: viewMode === 'grid' ? '12px' : '0 auto',
        }}
      >
        <div
          className="ebook-page-wrapper page-break cursor-pointer"
          onClick={() => onSelectPage(idx)}
          style={{
            width: `${pageDims.w}px`,
            height: `${pageDims.h}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
            boxShadow: idx === activePageIndex ? '0 0 0 3px #8b5cf6, 0 10px 25px rgba(0,0,0,0.18)' : '0 4px 14px rgba(0,0,0,0.06)',
            ...(section.layout === 'cover' ? {} : customThemeStyles)
          }}
        >
          <PageLayout
            section={section}
            pageIndex={idx + 1}
            totalPages={sections.length}
            bookTitle={bookTitle}
            selectedTheme={selectedTheme}
            onUpdateSection={(updated) => onUpdateSection(idx, updated)}
            onDeleteSection={() => onDeleteSection(idx)}
            onRegenerateImage={(customPrompt) => onRegenerateImage(idx, customPrompt)}
            isGeneratingImage={isGeneratingImageMap[idx] || false}
            isActive={idx === activePageIndex}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-100 text-slate-800 font-sans overflow-hidden relative select-none">
      
      {/* 1. TOP HEADER */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200 shrink-0 z-30 no-print">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleDashboard}
            className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-800 transition shadow-sm"
          >
            <ArrowLeft size={13} />
            <span>{isDashboardVisible ? 'Hide Dashboard' : 'Dashboard'}</span>
          </button>
          
          <div className="w-[1.5px] h-5 bg-slate-200" />
          
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-rose-500 text-white flex items-center justify-center font-bold text-xs shadow-sm shadow-rose-500/20">
              PDF
            </span>
            <div className="flex flex-col">
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => onUpdateSection(activePageIndex, { ...sections[activePageIndex], title: e.target.value })}
                className="font-bold text-slate-900 text-xs bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:outline-none py-0 px-1 font-serif"
                style={{ width: '180px' }}
              />
              <div className="flex items-center gap-2.5 text-[10px] text-slate-400 font-medium px-1 mt-0.5">
                <span>File</span>
                <span>Edit</span>
                <span>View</span>
                <span>Insert</span>
                <span>Format</span>
                <span>Arrange</span>
                <span>Page</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {shareToast && (
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-lg animate-fade-in">
              Copied link to clipboard!
            </span>
          )}
          
          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-sm"
            title="Print PDF"
          >
            <span>Print</span>
          </button>

          <button 
            type="button" 
            onClick={triggerShare}
            className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition shadow-sm"
          >
            <span>Share</span>
          </button>
          <button
            onClick={onDownloadPDF}
            disabled={isExporting}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-md transition disabled:opacity-75"
          >
            {isExporting ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <FileText size={13} />
                <span>Export</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 2. CUSTOMIZATION TOOLBAR */}
      <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 border-b border-slate-200 shrink-0 overflow-x-auto no-scrollbar z-20 no-print">
        <button
          onClick={onAddSection}
          className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 hover:text-slate-900 transition flex items-center gap-1 shadow-sm text-[11px] font-semibold"
          title="Add Page"
        >
          <Plus size={14} />
          <span>Add page</span>
        </button>

        <div className="w-[1px] h-5 bg-slate-200 shrink-0" />

        {/* Undo/Redo */}
        <div className="flex bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden shrink-0">
          <button className="p-1.5 text-slate-400 hover:text-slate-600 transition" title="Undo">
            <Undo2 size={13} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-600 transition border-l border-slate-100" title="Redo">
            <Redo2 size={13} />
          </button>
        </div>

        <div className="w-[1px] h-5 bg-slate-200 shrink-0" />

        {/* Zoom */}
        <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm shrink-0">
          <span className="text-[11px] font-semibold text-slate-500 mr-1.5">Zoom</span>
          <select
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="text-[11px] font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value={25}>25%</option>
            <option value={50}>50%</option>
            <option value={60}>60%</option>
            <option value={75}>75%</option>
            <option value={100}>100%</option>
            <option value={125}>125%</option>
          </select>
        </div>

        {/* Layout Mode */}
        <div className="flex bg-white rounded-lg border border-slate-200 shadow-sm p-0.5 shrink-0">
          <button
            onClick={() => setViewMode('single')}
            className={`p-1 rounded-md transition ${viewMode === 'single' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
            title="Single page list"
          >
            <Square size={13} />
          </button>
          <button
            onClick={() => setViewMode('spread')}
            className={`p-1 rounded-md transition ${viewMode === 'spread' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
            title="Two page spreads"
          >
            <Columns size={13} />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1 rounded-md transition ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
            title="Grid board overview"
          >
            <LayoutGrid size={13} />
          </button>
        </div>

        {/* Grid Align Guidelines */}
        <button
          onClick={() => setDottedGrid(!dottedGrid)}
          className={`p-1.5 rounded-lg border shadow-sm transition shrink-0 ${dottedGrid ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
          title="Toggle alignment grid guidelines"
        >
          <Grid size={13} />
        </button>

        <div className="w-[1px] h-5 bg-slate-200 shrink-0" />

        {/* Insert Shortcuts */}
        <div className="flex bg-white rounded-lg border border-slate-200 shadow-sm p-0.5 shrink-0 relative">
          <button 
            onClick={() => setActiveRightSidebarTab('details')}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded transition" 
            title="Insert Illustration"
          >
            <ImageIcon size={13} />
          </button>
          <button 
            onClick={() => setActiveRightSidebarTab('details')}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded transition" 
            title="Insert Text Box"
          >
            <Type size={13} />
          </button>
          
          {/* Sticker picker */}
          <div className="relative">
            <button 
              onClick={() => setStickersOpen(!stickersOpen)}
              className={`p-1.5 rounded transition ${stickersOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`} 
              title="Add Sticker Deco"
            >
              <Smile size={13} />
            </button>
            {stickersOpen && (
              <div className="absolute top-8 left-0 bg-white border border-slate-200 p-2.5 rounded-xl shadow-xl z-50 flex flex-wrap gap-1.5 w-48 text-[10px] animate-fade-in font-semibold">
                {['Cosmos', 'Artistic', 'Explore', 'Wellness', 'Organic', 'Shapes', 'POW!'].map(st => (
                  <button
                    key={st}
                    onClick={() => addStickerToActivePage(st)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded text-slate-600 cursor-pointer"
                  >
                    {st}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Draw mode */}
          <div className="relative">
            <button 
              onClick={() => setDrawMode(!drawMode)}
              className={`p-1.5 rounded transition ${drawMode ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`} 
              title="Toggle Pen tool"
            >
              <PenTool size={13} />
            </button>
            {drawMode && (
              <div className="absolute top-8 left-0 bg-white border border-slate-200 p-2 rounded-lg shadow-xl z-50 flex items-center gap-1">
                {['#e91e8c', '#ff6b35', '#00b4d8', '#ffd700', '#22c55e'].map(col => (
                  <button
                    key={col}
                    onClick={() => setDrawColor(col)}
                    className="w-3.5 h-3.5 rounded-full border border-black/10"
                    style={{ backgroundColor: col, outline: drawColor === col ? '1.5px solid #000' : 'none' }}
                  />
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={addTableToActivePage}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded transition" 
            title="Insert Table Grid"
          >
            <Table size={13} />
          </button>
          <button 
            onClick={() => setActiveRightSidebarTab('chat')}
            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded transition" 
            title="Add Comment"
          >
            <MessageSquare size={13} />
          </button>
        </div>

        <div className="w-[1px] h-5 bg-slate-200 shrink-0" />

        {/* Swatch Background Color Picker */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm shrink-0">
          <span className="text-[10px] font-semibold text-slate-400">Page Color</span>
          <div className="relative flex items-center justify-center">
            <button
              onClick={() => document.getElementById('color-picker-tool')?.click()}
              className="w-4.5 h-4.5 rounded-full border border-slate-300 shadow-inner flex-shrink-0 cursor-pointer"
              style={{ backgroundColor: customBgColor || '#faf6f0' }}
            />
            <input
              id="color-picker-tool"
              type="color"
              value={customBgColor || '#ffffff'}
              onChange={(e) => onChangeBgColor(e.target.value)}
              className="absolute opacity-0 w-0 h-0 pointer-events-none"
            />
          </div>
        </div>

        {/* Page Dimensions */}
        <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm shrink-0">
          <span className="text-[10px] font-semibold text-slate-400 mr-1.5">Size</span>
          <select
            value={dimensions}
            onChange={(e) => setDimensions(e.target.value as any)}
            className="text-[10px] font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          >
            <option value="a4">A4 (794 x 1123)</option>
            <option value="letter">Letter (816 x 1056)</option>
            <option value="legal">Legal (816 x 1344)</option>
          </select>
        </div>

      </div>

      {/* 3. MAIN WORKSPACE CONTAINER */}
      <div className="flex-1 flex overflow-hidden relative w-full h-full">
        
        {/* 3.1 LEFT PAGES THUMBNAILS DRAWER */}
        {isPagesPanelOpen && (
          <aside className="w-[160px] bg-white border-r border-slate-200 flex flex-col h-full shrink-0 z-10 animate-fade-in no-print">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5">
                <Layers size={11} />
                <span>Pages Panel</span>
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded-full">
                {sections.length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/45">
              {sections.map((sec, idx) => {
                const isActive = activePageIndex === idx;
                return (
                  <button
                    key={sec.id}
                    onClick={() => onSelectPage(idx)}
                    className={`w-full group text-left p-2 bg-white rounded-xl border transition-all text-xs font-semibold flex flex-col items-center gap-1.5 shadow-sm hover:border-indigo-400 ${isActive ? 'border-indigo-600 ring-2 ring-indigo-500/10' : 'border-slate-200'}`}
                  >
                    <div className="w-[100px] h-[135px] border border-slate-100 bg-slate-50 rounded-lg overflow-hidden relative flex items-center justify-center flex-shrink-0 shadow-inner">
                      {/* Mini Preview inside thumbnail */}
                      <div className={`theme-${selectedTheme}`} style={{ width: '595px', height: '842px', transform: 'scale(0.168)', transformOrigin: 'top left', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                        <PageLayout
                          section={sec}
                          pageIndex={idx + 1}
                          totalPages={sections.length}
                          bookTitle={bookTitle}
                          selectedTheme={selectedTheme}
                          onUpdateSection={() => {}}
                          onDeleteSection={() => {}}
                          onRegenerateImage={async () => {}}
                          isGeneratingImage={false}
                          isActive={false}
                        />
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">Page {idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* 3.2 CENTER WORKSPACE CANVAS */}
        <main className={`flex-1 overflow-auto p-12 flex flex-col justify-start items-center relative ${dottedGrid ? 'canvas-grid-dots' : ''}`}>
          
          <div
            className={`print-container theme-${selectedTheme} ${
              viewMode === 'spread'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1240px]'
                : viewMode === 'grid'
                  ? 'flex flex-wrap justify-center items-start gap-6 w-full'
                  : 'flex flex-col gap-8'
            }`}
          >
            {useCompactPreview && viewMode !== 'grid'
              ? sections[activePageIndex] && renderPage(sections[activePageIndex], activePageIndex)
              : sections.map((section, idx) => renderPage(section, idx))}
          </div>

          {/* Canvas Bottom Navigator */}
          <div className="mt-8 flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-md text-xs font-semibold tabular-nums no-print z-10 shrink-0">
            <button
              onClick={goToPrev}
              disabled={activePageIndex === 0}
              className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-slate-600">Page {activePageIndex + 1} of {sections.length}</span>
            <button
              onClick={goToNext}
              disabled={activePageIndex >= sections.length - 1}
              className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </main>

        {/* 3.3 RIGHT SIDEBAR PANEL */}
        {activeRightSidebarTab && (
          <aside className="w-[320px] bg-white border-l border-slate-200 flex flex-col h-full shrink-0 z-10 no-print animate-fade-in">
            {/* Sidebar Tabs */}
            <div className="flex bg-slate-50 border-b border-slate-200 p-1 shrink-0">
              {[
                { id: 'chat', label: 'Chat', icon: Bot },
                { id: 'design', label: 'Design', icon: Palette },
                { id: 'details', label: 'Details', icon: Sliders },
                { id: 'assets', label: 'Assets', icon: ImageIcon },
              ].map(tb => {
                const IsActive = activeRightSidebarTab === tb.id;
                const Icon = tb.icon;
                return (
                  <button
                    key={tb.id}
                    onClick={() => setActiveRightSidebarTab(tb.id as any)}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold tracking-wider uppercase flex flex-col items-center gap-1 transition ${IsActive ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/40' : 'text-slate-400 hover:text-slate-700'}`}
                  >
                    <Icon size={14} />
                    <span>{tb.label}</span>
                  </button>
                );
              })}
              <button
                onClick={() => setActiveRightSidebarTab(null)}
                className="p-1 text-slate-400 hover:text-slate-600 self-center rounded-lg"
                title="Collapse sidebar"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Sidebar content container */}
            <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
              
              {/* CHAT TAB */}
              {activeRightSidebarTab === 'chat' && (
                <div className="flex-1 flex flex-col min-h-0 bg-slate-50/20">
                  {/* Assistant Header */}
                  <div className="p-3 bg-white border-b border-slate-100 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black shadow shadow-indigo-500/10">
                      M
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Moda Designer</h4>
                      <p className="text-[9px] text-emerald-500 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse" />
                        <span>Online &amp; Active</span>
                      </p>
                    </div>
                  </div>

                  {/* Checklist and Logs */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Status checklist */}
                    <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm space-y-2.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Designer Checklist</span>
                      <div className="space-y-1.5">
                        {chatTasks.map(t => (
                          <div key={t.id} className="flex items-center gap-2 text-[10px] font-semibold text-slate-600">
                            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${t.status === 'done' ? 'bg-indigo-50 border border-indigo-200 text-indigo-600 font-mono text-[8px]' : 'border border-slate-300'}`}>
                              {t.status === 'done' ? '✓' : ''}
                            </span>
                            <span className={t.status === 'done' ? 'line-through opacity-50' : ''}>{t.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chat Bubbles */}
                    <div className="space-y-3">
                      {chatMessages.map((msg, idx) => {
                        const isModa = msg.sender === 'moda';
                        return (
                          <div key={idx} className={`flex ${isModa ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed font-semibold shadow-sm ${isModa ? 'bg-white border border-slate-100 text-slate-700 rounded-tl-none' : 'bg-slate-900 text-white rounded-tr-none'}`}>
                              {msg.text}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Input Chat form */}
                  <form onSubmit={handleChatSubmit} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type style overrides (e.g. 'make it rose pink')..."
                      className="flex-1 py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 focus:bg-white transition"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shrink-0 shadow-sm"
                    >
                      Send
                    </button>
                  </form>
                </div>
              )}

              {/* DESIGN TAB */}
              {activeRightSidebarTab === 'design' && (
                <div className="p-4 space-y-4 flex-1">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Book Fonts &amp; Colors</span>
                    
                    {/* Background preset swatches */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      {[
                        { bg: '#faf6f0', text: '#3d2314' },
                        { bg: '#f8fafb', text: '#1a2a32' },
                        { bg: '#fdf2f4', text: '#3d1f2a' },
                        { bg: '#0d0e12', text: '#e2e8f0' },
                      ].map((sw, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            onChangeBgColor(sw.bg);
                            onChangeTextColor(sw.text);
                          }}
                          className="h-8 rounded-lg border border-slate-200 shadow-sm flex items-center justify-center cursor-pointer hover:border-slate-400"
                          style={{ backgroundColor: sw.bg }}
                        >
                          <span className="text-[9px] font-bold" style={{ color: sw.text }}>Aa</span>
                        </button>
                      ))}
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-500">Size Multiplier</span>
                        <select
                          value={customFontSizeMult}
                          onChange={(e) => onChangeFontSizeMult(Number(e.target.value))}
                          className="border border-slate-200 rounded px-1.5 py-0.5 text-[10px]"
                        >
                          <option value={0.85}>0.85x (Small)</option>
                          <option value={1.0}>1.0x (Normal)</option>
                          <option value={1.2}>1.2x (Large)</option>
                          <option value={1.4}>1.4x (XL)</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-500">Header Font</span>
                        <select
                          value={customFontHeader}
                          onChange={(e) => onChangeFontHeader(e.target.value)}
                          className="border border-slate-200 rounded px-1.5 py-0.5 text-[10px] max-w-[140px]"
                        >
                          <option value="">Theme Default</option>
                          <option value="Playfair Display">Playfair Display</option>
                          <option value="Lora">Lora</option>
                          <option value="Cinzel">Cinzel</option>
                          <option value="Montserrat">Montserrat</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <hr className="border-t border-slate-100" />

                  <div className="flex-1 min-h-0 flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Layout Themes</span>
                    <div className="flex-1 overflow-y-auto pr-1">
                      <ThemeSelector
                        selectedTheme={selectedTheme}
                        onChangeTheme={onChangeTheme}
                        sections={sections}
                        activePageIndex={activePageIndex}
                        bookTitle={bookTitle}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* DETAILS TAB */}
              {activeRightSidebarTab === 'details' && (
                <div className="p-4 space-y-4 flex-1">
                  {sections[activePageIndex] && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Page Title / Chapter</span>
                        <input
                          type="text"
                          value={sections[activePageIndex].title}
                          onChange={(e) => onUpdateSection(activePageIndex, { ...sections[activePageIndex], title: e.target.value })}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs font-semibold bg-slate-50 focus:bg-white"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Page Layout Mode</span>
                        <select
                          value={sections[activePageIndex].layout}
                          onChange={(e) => onUpdateSection(activePageIndex, { ...sections[activePageIndex], layout: e.target.value as any })}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs font-semibold bg-slate-50 focus:bg-white"
                        >
                          <option value="cover">Cover Page</option>
                          <option value="split">Split Layout</option>
                          <option value="editorial">Editorial Margins</option>
                          <option value="magazine">Magazine columns</option>
                          <option value="standard">Standard textbook</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Content Text</span>
                        <textarea
                          value={sections[activePageIndex].content}
                          onChange={(e) => onUpdateSection(activePageIndex, { ...sections[activePageIndex], content: e.target.value })}
                          rows={8}
                          className="w-full border border-slate-200 rounded-lg p-2 text-xs leading-relaxed font-sans bg-slate-50 focus:bg-white resize-y"
                        />
                      </div>

                      <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3.5 space-y-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Image Illustration Settings</span>
                        
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                          <span>Show Image on Page</span>
                          <input
                            type="checkbox"
                            checked={sections[activePageIndex].showImage !== false}
                            onChange={(e) => onUpdateSection(activePageIndex, { ...sections[activePageIndex], showImage: e.target.checked })}
                            className="cursor-pointer w-4 h-4 accent-indigo-600"
                          />
                        </div>

                        {sections[activePageIndex].showImage !== false && (
                          <div className="pt-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Illustration Prompt</span>
                            <textarea
                              value={sections[activePageIndex].imagePrompt}
                              onChange={(e) => onUpdateSection(activePageIndex, { ...sections[activePageIndex], imagePrompt: e.target.value })}
                              rows={3}
                              className="w-full border border-slate-200 rounded-lg p-1.5 text-[10px] leading-normal font-sans bg-white resize-none"
                            />
                            <button
                              type="button"
                              onClick={() => onRegenerateImage(activePageIndex, sections[activePageIndex].imagePrompt)}
                              className="mt-2 w-full py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-1 shadow-sm"
                            >
                              <RefreshCw size={11} className={isGeneratingImageMap[activePageIndex] ? 'animate-spin' : ''} />
                              <span>Regenerate Image</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ASSETS TAB */}
              {activeRightSidebarTab === 'assets' && (
                <div className="p-4 space-y-4 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Book Visual Assets</span>
                  <div className="grid grid-cols-2 gap-2">
                    {sections.filter(s => s.imageUrl).map((s, idx) => (
                      <div key={idx} className="border border-slate-100 rounded-xl overflow-hidden bg-slate-50 relative group shadow-sm">
                        <img src={s.imageUrl} alt={s.title} className="w-full h-20 object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center p-1.5">
                          <button
                            onClick={() => {
                              const activeSec = sections[activePageIndex];
                              if (activeSec) {
                                onUpdateSection(activePageIndex, { ...activeSec, imageUrl: s.imageUrl });
                              }
                            }}
                            className="bg-white text-slate-900 text-[9px] font-bold px-2 py-1 rounded shadow cursor-pointer hover:bg-slate-100"
                          >
                            Apply to active
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ANIMATE TAB */}
              {activeRightSidebarTab === 'animate' && (
                <div className="p-4 space-y-4 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Transition Animations</span>
                  
                  <div className="space-y-2">
                    {['Fade transition', 'Slide transition', 'Zoom transition', 'No transition'].map((an, idx) => (
                      <button
                        key={idx}
                        className={`w-full text-left p-3 border rounded-xl text-xs font-semibold transition ${idx === 1 ? 'border-indigo-600 bg-indigo-50/20 text-indigo-700 font-bold shadow-sm' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      >
                        {an}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </aside>
        )}

      </div>

      {/* 4. PAGES BOTTOM BAR */}
      <footer className="h-10 bg-white border-t border-slate-200 flex items-center justify-between px-4 shrink-0 z-20 no-print">
        <button
          onClick={() => setIsPagesPanelOpen(!isPagesPanelOpen)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${isPagesPanelOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <Layers size={13} />
          <span>Pages ({sections.length})</span>
        </button>

        <span className="text-[10px] text-slate-400 font-medium tracking-wide">
          Double-click layout boxes to customize titles &amp; text in real-time
        </span>
      </footer>

      {/* 5. BOTTOM FLOATING STATUS PILL */}
      {(isStyling || isExporting) && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-semibold tracking-wide animate-pulse no-print">
          <RefreshCw className="animate-spin text-white shrink-0" size={13} />
          <span>
            {isStyling 
              ? 'Moda is designing — please wait to edit' 
              : `Exporting PDF (${exportProgress.current}/${exportProgress.total}) — please wait...`}
          </span>
        </div>
      )}

      {/* Print area: active page only for printing */}
      <div className="hidden print-container print:block">
        <div
          id="ebook-print-area-native"
          className={`theme-${selectedTheme}`}
          style={sections[activePageIndex]?.layout === 'cover' ? undefined : customThemeStyles}
        >
          {sections[activePageIndex] && (
            <PageLayout
              key={`print-${sections[activePageIndex].id}`}
              section={sections[activePageIndex]}
              pageIndex={activePageIndex + 1}
              totalPages={sections.length}
              bookTitle={bookTitle}
              selectedTheme={selectedTheme}
              onUpdateSection={() => {}}
              onDeleteSection={() => {}}
              onRegenerateImage={async () => {}}
              isGeneratingImage={false}
              isActive={true}
            />
          )}
        </div>
      </div>

    </div>
  );
};
