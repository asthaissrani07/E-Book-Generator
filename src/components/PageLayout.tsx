import React, { useMemo, useState, useEffect } from 'react';
import { Layout, Image, Trash2, RefreshCw, ArrowRight } from 'lucide-react';
import type { EbookSection } from '../utils/pdfParser';
import type { ThemeId } from '../themes/types';
import {
  getThemeImageSlotsForPage,
  getPlaceholderImageUrl,
  getExportSafeImageUrl,
  resolveImageUrl,
} from '../utils/imageHelper';
import { ThemeCover, ThemeEditorial } from './ThemeLayout';

interface PageLayoutProps {
  section: EbookSection;
  pageIndex: number;
  totalPages: number;
  bookTitle: string;
  selectedTheme: ThemeId;
  onUpdateSection: (updated: EbookSection) => void;
  onDeleteSection: () => void;
  onRegenerateImage: (customPrompt?: string) => Promise<void>;
  isGeneratingImage: boolean;
  isActive: boolean;
  /** When true, load all images immediately for PDF export capture. */
  pdfExportMode?: boolean;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
  section,
  pageIndex,
  totalPages,
  bookTitle,
  selectedTheme,
  onUpdateSection,
  onDeleteSection,
  onRegenerateImage,
  isGeneratingImage,
  isActive,
  pdfExportMode = false,
}) => {
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [promptText, setPromptText] = useState(section.imagePrompt);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState(section.imageUrl);
  const [imageVersion, setImageVersion] = useState(0);
  const chapterHeadingText = section.chapterTitle || section.title;

  const imageSlots = useMemo(
    () => getThemeImageSlotsForPage(selectedTheme, chapterHeadingText, bookTitle, pageIndex),
    [selectedTheme, chapterHeadingText, bookTitle, pageIndex]
  );

  // Sync state if prompt changes externally
  useEffect(() => {
    setPromptText(section.imagePrompt);
    const prompt = section.imagePrompt || chapterHeadingText;

    if (pdfExportMode) {
      setImgSrc(getExportSafeImageUrl(prompt, pageIndex));
      setImgLoading(false);
      return;
    }

    setImgLoading(true);
    let cancelled = false;
    resolveImageUrl(prompt, pageIndex)
      .then((url) => {
        if (!cancelled) setImgSrc(url);
      })
      .catch(() => {
        if (!cancelled) setImgSrc(getPlaceholderImageUrl(prompt, pageIndex));
      });

    return () => {
      cancelled = true;
    };
  }, [
    section.imagePrompt,
    section.imageUrl,
    imageVersion,
    chapterHeadingText,
    pageIndex,
    pdfExportMode,
  ]);

  const handleTextChange = (field: 'title' | 'content', val: string) => {
    onUpdateSection({
      ...section,
      [field]: val,
    });
  };

  const cycleLayout = () => {
    const layouts: EbookSection['layout'][] = ['cover', 'split', 'editorial', 'magazine', 'standard'];
    const currentIdx = layouts.indexOf(section.layout);
    const nextIdx = (currentIdx + 1) % layouts.length;
    onUpdateSection({
      ...section,
      layout: layouts[nextIdx],
    });
  };

  const handleCustomPromptRegen = () => {
    onRegenerateImage(promptText);
    setShowPromptEditor(false);
    setImageVersion((v) => v + 1);
  };

  const shouldShowChapterHeading =
    section.layout !== 'cover' &&
    (section.showChapterHeading ?? true) &&
    Boolean(chapterHeadingText);
  const shouldShowImage = section.showImage !== false;

  const handleImgError = () => {
    setImgLoading(false);
    setImgSrc(getPlaceholderImageUrl(section.imagePrompt || chapterHeadingText, pageIndex));
  };

  const renderImage = (style?: React.CSSProperties) => (
    <>
      {(imgLoading || isGeneratingImage) && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
          <RefreshCw size={24} className="animate-spin text-white" />
        </div>
      )}
      <img
        src={imgSrc}
        alt={chapterHeadingText}
        crossOrigin={
          pdfExportMode && !imgSrc.startsWith('blob:') && !imgSrc.startsWith('data:')
            ? 'anonymous'
            : undefined
        }
        onLoad={() => setImgLoading(false)}
        onError={handleImgError}
        style={style}
      />
    </>
  );

  return (
    <div className={`ebook-page layout-${section.layout} group relative ${isActive ? 'active-page-ring' : ''}`}>
      {/* Interactive Controls Overlay (Hidden on Print) */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 no-print bg-slate-900/95 backdrop-blur border border-slate-700/60 p-1.5 rounded-lg shadow-xl">
        <button
          onClick={cycleLayout}
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition"
          title={`Change Layout (Current: ${section.layout})`}
        >
          <Layout size={14} />
        </button>

        <button
          onClick={() => setShowPromptEditor(!showPromptEditor)}
          className={`p-1.5 hover:bg-slate-800 rounded transition ${
            showPromptEditor ? 'text-indigo-400 bg-slate-800' : 'text-slate-300 hover:text-white'
          }`}
          title="Edit Image Prompt"
        >
          <Image size={14} />
        </button>

        <button
          onClick={() => {
            onRegenerateImage();
            setImageVersion((v) => v + 1);
          }}
          disabled={isGeneratingImage}
          className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition disabled:opacity-40"
          title="Regenerate Image (AI or Seed shift)"
        >
          <RefreshCw size={14} className={isGeneratingImage ? 'animate-spin' : ''} />
        </button>

        {totalPages > 1 && (
          <button
            onClick={onDeleteSection}
            className="p-1.5 hover:bg-red-950 text-slate-300 hover:text-red-400 rounded transition"
            title="Delete Page"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Floating Prompt Editor Card */}
      {showPromptEditor && (
        <div className="absolute top-12 right-2 w-72 bg-slate-900/98 border border-slate-700 p-3 rounded-lg shadow-2xl z-40 no-print animate-fade-in text-xs">
          <div className="font-semibold text-slate-200 mb-1.5 flex items-center justify-between">
            <span>Illustrative Scene Prompt</span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">AI Picture</span>
          </div>
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="w-full h-20 bg-slate-950 border border-slate-700/80 rounded p-1.5 text-slate-300 focus:outline-none focus:border-indigo-500 mb-2 resize-none leading-relaxed"
            placeholder="Describe the illustration style, theme, colors, and subject matter..."
          />
          <div className="flex justify-end gap-1.5">
            <button
              onClick={() => setShowPromptEditor(false)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCustomPromptRegen}
              disabled={isGeneratingImage}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition flex items-center gap-1 disabled:opacity-50"
            >
              Generate <ArrowRight size={10} />
            </button>
          </div>
        </div>
      )}

      {/* 1. Page Header (Theme/Book details) */}
      <div className="ebook-page-header">
        <span>{bookTitle || 'My E-Book'}</span>
        <span className="font-semibold">
          {section.layout === 'cover'
            ? 'Front Cover'
            : section.chapterTitle || `Page ${pageIndex}`}
        </span>
      </div>

      {/* 2. Page Body Content */}
      <div className="ebook-page-body">
        {section.layout === 'cover' ? (
          <ThemeCover
            themeId={selectedTheme}
            section={section}
            imgSrc={imgSrc}
            imgLoading={imgLoading}
            isGeneratingImage={isGeneratingImage}
            onTitleChange={(val) => handleTextChange('title', val)}
            onImgLoad={() => setImgLoading(false)}
            onImgError={handleImgError}
            shouldShowImage={shouldShowImage}
            imageSlots={imageSlots}
            imageVersion={imageVersion}
            isActive={isActive || pdfExportMode}
            pdfExportMode={pdfExportMode}
          />
        ) : section.layout === 'split' ? (
          // SPLIT LAYOUT TEMPLATE (Text Left, Image Right)
          <div className={shouldShowImage ? 'layout-split-grid h-full' : 'h-full'}>
            <div className={`flex flex-col justify-center ${shouldShowImage ? 'pr-2' : ''}`}>
              {shouldShowChapterHeading && (
                <h2
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => handleTextChange('title', e.currentTarget.innerText)}
                  className="ebook-h1 focus:outline-none focus:bg-black/5 rounded px-1"
                >
                  {chapterHeadingText}
                </h2>
              )}
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('content', e.currentTarget.innerText)}
                className="ebook-p focus:outline-none focus:bg-black/5 rounded p-1 whitespace-pre-wrap text-sm"
              >
                {section.content}
              </div>
            </div>
            
            {shouldShowImage && (
              <div className="ebook-image-frame h-full min-h-[300px] flex items-center relative">
                {renderImage({ height: '100%', minHeight: '300px' })}
              </div>
            )}
          </div>
        ) : section.layout === 'editorial' ? (
          <ThemeEditorial
            themeId={selectedTheme}
            section={section}
            pageIndex={pageIndex}
            bookTitle={bookTitle}
            imageSlots={imageSlots}
            imageVersion={imageVersion}
            isActive={isActive}
            shouldShowImage={shouldShowImage}
            shouldShowChapterHeading={shouldShowChapterHeading}
            chapterHeadingText={chapterHeadingText}
            onTextChange={handleTextChange}
            pdfExportMode={pdfExportMode}
          />
        ) : section.layout === 'magazine' ? (
          // MAGAZINE LAYOUT TEMPLATE (Multi-columns + Top Header Graphic)
          <div>
            {shouldShowImage && (
              <div className="ebook-image-frame !mt-0 !mb-4 relative">
                {renderImage({ height: '180px' })}
              </div>
            )}
            
            {shouldShowChapterHeading && (
              <h2
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('title', e.currentTarget.innerText)}
                className="ebook-h1 focus:outline-none focus:bg-black/5 rounded px-1"
              >
                {chapterHeadingText}
              </h2>
            )}
            
            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('content', e.currentTarget.innerText)}
              className="ebook-columns focus:outline-none focus:bg-black/5 rounded p-1 whitespace-pre-wrap"
            >
              {section.content}
            </div>
          </div>
        ) : (
          // STANDARD TEXTBOOK LAYOUT (Image in the middle, content flows above and below)
          <div>
            {shouldShowChapterHeading && (
              <h2
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('title', e.currentTarget.innerText)}
                className="ebook-h1 focus:outline-none focus:bg-black/5 rounded px-1"
              >
                {chapterHeadingText}
              </h2>
            )}

            <div
              contentEditable
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('content', e.currentTarget.innerText)}
              className="ebook-p focus:outline-none focus:bg-black/5 rounded p-1 whitespace-pre-wrap"
            >
              {section.content}
            </div>

            {shouldShowImage && (
              <div className="ebook-image-frame relative">
                {renderImage()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Page Footer (Page numbering) */}
      <div className="ebook-page-footer">
        <span>Artistic E-Book Series</span>
        <span className="font-mono text-xs">{pageIndex} of {totalPages}</span>
      </div>
    </div>
  );
};
