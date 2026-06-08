import React, { useState } from 'react';
import { PageLayout } from './PageLayout';
import type { EbookSection } from '../utils/pdfParser';
import type { ThemeId } from '../themes/types';
import { LARGE_BOOK_PAGE_THRESHOLD } from '../utils/pdfExport';
import {
  FileText,
  Printer,
  Columns,
  Square,
  Plus,
  Sparkles,
  BookOpen,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
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
  onNavigateToDashboard,
  activePageIndex,
  onSelectPage,
}) => {
  const [viewMode, setViewMode] = useState<'single' | 'spread'>('single');
  const isLargeBook = sections.length > LARGE_BOOK_PAGE_THRESHOLD;
  const useCompactPreview = isLargeBook || viewMode === 'single';

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

  const renderPage = (section: EbookSection, idx: number) => (
    <div
      key={section.id}
      className="ebook-page-wrapper page-break cursor-pointer"
      onClick={() => onSelectPage(idx)}
      style={section.layout === 'cover' ? undefined : customThemeStyles}
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
  );

  return (
    <div className="flex flex-col h-full relative">
      {/* Viewer Header Menu */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border-b border-slate-800 no-print">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={onNavigateToDashboard}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs flex items-center gap-1.5 transition font-semibold shrink-0"
            title="Return to Dashboard"
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </button>

          <BookOpen className="text-indigo-400 hidden sm:inline shrink-0" size={18} />
          <span className="font-semibold text-slate-200 text-sm hidden sm:inline">E-Book Preview</span>
          <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full border border-slate-700/60">
            {sections.length} Page{sections.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isLargeBook && (
            <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 mr-2">
              <button
                onClick={() => setViewMode('single')}
                className={`p-1.5 rounded-md transition ${
                  viewMode === 'single' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Single Page Scroll"
              >
                <Square size={14} />
              </button>
              <button
                onClick={() => setViewMode('spread')}
                className={`p-1.5 rounded-md transition hidden sm:inline-block ${
                  viewMode === 'spread' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Two-Page Spread Layout"
              >
                <Columns size={14} />
              </button>
            </div>
          )}

          <button
            onClick={onAddSection}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 text-xs flex items-center gap-1.5 transition"
            title="Add Page"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Add Page</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-lg border border-slate-700 text-xs flex items-center gap-1.5 transition"
            title="Saves Vector Quality PDF"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Print PDF</span>
          </button>

          <button
            onClick={onDownloadPDF}
            disabled={isExporting}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-lg text-xs flex items-center gap-1.5 font-medium shadow-md shadow-indigo-600/10 transition disabled:opacity-75"
            title="Download PDF"
          >
            {isExporting ? (
              <>
                <Sparkles size={14} className="animate-spin" />
                <span className="hidden sm:inline">
                  {exportProgress.total > 0
                    ? `Exporting ${exportProgress.current}/${exportProgress.total}...`
                    : 'Exporting...'}
                </span>
              </>
            ) : (
              <>
                <FileText size={14} />
                <span className="hidden sm:inline">Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isLargeBook && (
        <div className="flex items-center justify-center gap-3 py-2.5 px-4 bg-slate-950/80 border-b border-slate-800 no-print">
          <button
            type="button"
            onClick={goToPrev}
            disabled={activePageIndex === 0}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs text-slate-400 font-medium tabular-nums">
            Page {activePageIndex + 1} of {sections.length}
          </span>
          <button
            type="button"
            onClick={goToNext}
            disabled={activePageIndex >= sections.length - 1}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
          <span className="text-[10px] text-slate-500 ml-1 hidden sm:inline">
            Large book mode — one page at a time for speed
          </span>
        </div>
      )}

      <div className="ebook-preview-scroll-container p-4 sm:p-8 flex justify-center items-start no-print">
        <div
          id="ebook-print-area"
          className={`print-container theme-${selectedTheme} ${
            !useCompactPreview && viewMode === 'spread'
              ? 'grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1240px]'
              : 'ebook-preview-container'
          }`}
        >
          {useCompactPreview
            ? sections[activePageIndex] && renderPage(sections[activePageIndex], activePageIndex)
            : sections.map((section, idx) => renderPage(section, idx))}
        </div>
      </div>

      {/* Print area: active page only for large books */}
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
