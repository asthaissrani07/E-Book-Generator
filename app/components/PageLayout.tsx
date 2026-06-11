import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Layout, Image, Trash2, RefreshCw, ArrowRight } from 'lucide-react';
import type { EbookSection } from '@/lib/utils/pdfParser';
import type { ThemeId } from '@/lib/themes/types';
import {
  getThemeImageSlotsForPage,
  getPlaceholderImageUrl,
  getExportImageForCapture,
  resolveImageUrl,
} from '@/lib/utils/imageHelper';
import { ThemeCover, ThemeEditorial, ThemeMinimalBlack, ThemeRose, ThemeLavender, ThemeBoldDark } from './ThemeLayout';

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
  drawMode?: boolean;
  drawColor?: string;
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
  drawMode = false,
  drawColor = '#e91e8c',
}) => {
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [promptText, setPromptText] = useState(section.imagePrompt);
  const [imgLoading, setImgLoading] = useState(true);
  const [imgSrc, setImgSrc] = useState(section.imageUrl);
  const [imageVersion, setImageVersion] = useState(0);
  const chapterHeadingText = section.chapterTitle || section.title;

  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarCoords, setToolbarCoords] = useState({ top: 0, left: 0 });
  const savedRangeRef = useRef<Range | null>(null);
  const isMouseDownOnToolbar = useRef<boolean>(false);

  useEffect(() => {
    const handleSelectionChange = () => {
      if (isMouseDownOnToolbar.current) {
        return;
      }

      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.toString().trim().length === 0) {
        setShowToolbar(false);
        return;
      }

      const anchorNode = sel.anchorNode;
      if (!anchorNode) return;

      const pageContainer = document.getElementById(`page-container-${pageIndex}`);
      if (!pageContainer || !pageContainer.contains(anchorNode)) {
        setShowToolbar(false);
        return;
      }

      // Check if selection is within a contenteditable container
      const editable = anchorNode.parentElement?.closest('[contenteditable]');
      if (!editable) {
        setShowToolbar(false);
        return;
      }

      try {
        const range = sel.getRangeAt(0);
        savedRangeRef.current = range.cloneRange();

        const rect = range.getBoundingClientRect();

        if (rect.width === 0 || rect.height === 0) {
          setShowToolbar(false);
          return;
        }

        const pageRect = pageContainer.getBoundingClientRect();
        const top = rect.top - pageRect.top - 45;
        const left = rect.left - pageRect.left + (rect.width / 2) - 150;

        setToolbarCoords({
          top: Math.max(10, top),
          left: Math.max(10, Math.min(pageRect.width - 310, left))
        });
        setShowToolbar(true);
      } catch (err) {
        // Selection range temporarily invalid
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [pageIndex, section.layout]);

  const restoreSelection = (): HTMLElement | null => {
    const sel = window.getSelection();
    if (!sel || !savedRangeRef.current) return null;

    sel.removeAllRanges();
    sel.addRange(savedRangeRef.current);

    const anchor = savedRangeRef.current.startContainer;
    const editable = anchor.parentElement?.closest('[contenteditable]') as HTMLElement | null;
    return editable;
  };

  const applyHighlight = (color: string) => {
    const editable = restoreSelection();
    if (!editable) return;

    if (color === '') {
      document.execCommand('backColor', false, 'transparent');
    } else {
      document.execCommand('backColor', false, color);
    }
    editable.blur();

    window.getSelection()?.removeAllRanges();
    savedRangeRef.current = null;
    setShowToolbar(false);
  };

  const applyBold = () => {
    const editable = restoreSelection();
    if (!editable) return;

    document.execCommand('bold', false);
    editable.blur();

    window.getSelection()?.removeAllRanges();
    savedRangeRef.current = null;
    setShowToolbar(false);
  };

  const applyItalic = () => {
    const editable = restoreSelection();
    if (!editable) return;

    document.execCommand('italic', false);
    editable.blur();

    window.getSelection()?.removeAllRanges();
    savedRangeRef.current = null;
    setShowToolbar(false);
  };

  const handleDeleteText = () => {
    const editable = restoreSelection();
    if (!editable) return;

    document.execCommand('delete', false);
    editable.blur();

    window.getSelection()?.removeAllRanges();
    savedRangeRef.current = null;
    setShowToolbar(false);
  };

  const handleInsertText = () => {
    const editable = restoreSelection();
    if (!editable) return;

    const txt = prompt('Enter text to add / replace selection:');
    if (txt !== null) {
      document.execCommand('insertText', false, txt);
      editable.blur();
    }

    window.getSelection()?.removeAllRanges();
    savedRangeRef.current = null;
    setShowToolbar(false);
  };

  const imageSlots = useMemo(
    () => getThemeImageSlotsForPage(
      selectedTheme,
      chapterHeadingText,
      bookTitle,
      pageIndex
    ),
    [selectedTheme, section.layout, chapterHeadingText, bookTitle, pageIndex]
  );

  // Sync state if prompt changes externally
  useEffect(() => {
    setPromptText(section.imagePrompt);
    const prompt = section.imagePrompt || chapterHeadingText;

    if (pdfExportMode) {
      setImgSrc(getExportImageForCapture(prompt, pageIndex));
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
    const layouts: EbookSection['layout'][] = ['cover', 'split', 'editorial', 'magazine', 'standard', 'toc', 'text'];
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

  const pageBodyContent = useMemo(() => {
    if (selectedTheme === 'minimalblack') {
      return (
        <ThemeMinimalBlack
          themeId={selectedTheme}
          layout={section.layout}
          section={section}
          pageIndex={pageIndex}
          bookTitle={bookTitle}
          imageSlots={imageSlots}
          imageVersion={imageVersion}
          isActive={isActive || !!pdfExportMode}
          shouldShowImage={shouldShowImage}
          shouldShowChapterHeading={shouldShowChapterHeading}
          chapterHeadingText={chapterHeadingText}
          onTextChange={handleTextChange}
          pdfExportMode={pdfExportMode}
        />
      );
    }

    if (selectedTheme === 'rose') {
      return (
        <ThemeRose
          themeId={selectedTheme}
          layout={section.layout}
          section={section}
          pageIndex={pageIndex}
          bookTitle={bookTitle}
          imageSlots={imageSlots}
          imageVersion={imageVersion}
          isActive={isActive || !!pdfExportMode}
          shouldShowImage={shouldShowImage}
          shouldShowChapterHeading={shouldShowChapterHeading}
          chapterHeadingText={chapterHeadingText}
          onTextChange={handleTextChange}
          pdfExportMode={pdfExportMode}
        />
      );
    }

    if (selectedTheme === 'lavender') {
      return (
        <ThemeLavender
          themeId={selectedTheme}
          layout={section.layout}
          section={section}
          pageIndex={pageIndex}
          bookTitle={bookTitle}
          imageSlots={imageSlots}
          imageVersion={imageVersion}
          isActive={isActive || !!pdfExportMode}
          shouldShowImage={shouldShowImage}
          shouldShowChapterHeading={shouldShowChapterHeading}
          chapterHeadingText={chapterHeadingText}
          onTextChange={handleTextChange}
          pdfExportMode={pdfExportMode}
        />
      );
    }

    if (selectedTheme === 'bolddark') {
      return (
        <ThemeBoldDark
          themeId={selectedTheme}
          layout={section.layout}
          section={section}
          pageIndex={pageIndex}
          bookTitle={bookTitle}
          imageSlots={imageSlots}
          imageVersion={imageVersion}
          isActive={isActive || !!pdfExportMode}
          shouldShowImage={shouldShowImage}
          shouldShowChapterHeading={shouldShowChapterHeading}
          chapterHeadingText={chapterHeadingText}
          onTextChange={handleTextChange}
          pdfExportMode={pdfExportMode}
        />
      );
    }


    if (section.layout === 'cover') {
      return (
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
          isActive={isActive || !!pdfExportMode}
          pdfExportMode={pdfExportMode}
        />
      );
    }

    if (section.layout === 'split') {
      return (
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
              onBlur={(e) => handleTextChange('content', e.currentTarget.innerHTML)}
              dangerouslySetInnerHTML={{ __html: section.content }}
              className="ebook-p focus:outline-none focus:bg-black/5 rounded p-1 whitespace-pre-line text-sm"
            />
          </div>
          {shouldShowImage && (
            <div className="ebook-image-frame h-full min-h-[300px] flex items-center relative">
              {renderImage({ height: '100%', minHeight: '300px' })}
            </div>
          )}
        </div>
      );
    }

    if (section.layout === 'editorial') {
      return (
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
      );
    }

    if (section.layout === 'magazine') {
      return (
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
            onBlur={(e) => handleTextChange('content', e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: section.content }}
            className="ebook-columns focus:outline-none focus:bg-black/5 rounded p-1 whitespace-pre-line"
          />
        </div>
      );
    }

    // Standard textbook layout
    return (
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
          onBlur={(e) => handleTextChange('content', e.currentTarget.innerHTML)}
          dangerouslySetInnerHTML={{ __html: section.content }}
          className="ebook-p focus:outline-none focus:bg-black/5 rounded p-1 whitespace-pre-line"
        />
        {shouldShowImage && (
          <div className="ebook-image-frame relative">
            {renderImage()}
          </div>
        )}
      </div>
    );
  }, [
    section,
    selectedTheme,
    bookTitle,
    pageIndex,
    imgSrc,
    imgLoading,
    isGeneratingImage,
    imageSlots,
    imageVersion,
    isActive,
    pdfExportMode,
    chapterHeadingText,
    shouldShowChapterHeading,
    shouldShowImage
  ]);

  // SVG Pen Drawing Logic
  const [currentPath, setCurrentPath] = useState<string>('');
  const isDrawingRef = useRef<boolean>(false);

  const getSVGCoords = (e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 794;
    const y = ((e.clientY - rect.top) / rect.height) * 1123;
    return { x, y };
  };

  const handleDrawMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    isDrawingRef.current = true;
    const { x, y } = getSVGCoords(e);
    setCurrentPath(`M ${x.toFixed(1)} ${y.toFixed(1)}`);
  };

  const handleDrawMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawingRef.current) return;
    const { x, y } = getSVGCoords(e);
    setCurrentPath((prev) => `${prev} L ${x.toFixed(1)} ${y.toFixed(1)}`);
  };

  const handleDrawMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    if (currentPath) {
      const newDrawLine = {
        points: currentPath,
        color: drawColor || '#000000',
        width: 3,
      };
      onUpdateSection({
        ...section,
        drawings: [...(section.drawings || []), newDrawLine],
      });
      setCurrentPath('');
    }
  };

  return (
    <div
      id={`page-container-${pageIndex}`}
      className={`ebook-page layout-${section.layout} group relative ${isActive ? 'active-page-ring' : ''} ${pdfExportMode ? 'pdf-export-page' : ''} ${section.layout === 'cover' ? `theme-${selectedTheme}` : ''}`}
    >
      {/* Interactive SVG drawings markup layer */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{
          zIndex: 15,
          pointerEvents: drawMode ? 'auto' : 'none',
          cursor: drawMode ? 'crosshair' : 'default',
        }}
        viewBox="0 0 794 1123"
        onMouseDown={drawMode ? handleDrawMouseDown : undefined}
        onMouseMove={drawMode ? handleDrawMouseMove : undefined}
        onMouseUp={drawMode ? handleDrawMouseUp : undefined}
        onMouseLeave={drawMode ? handleDrawMouseUp : undefined}
      >
        {(section.drawings || []).map((line, idx) => (
          <path
            key={idx}
            d={line.points}
            stroke={line.color}
            strokeWidth={line.width}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        {currentPath && (
          <path
            d={currentPath}
            stroke={drawColor}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
      {/* Floating Toolbar for Highlights & Formatting */}
      {showToolbar && !pdfExportMode && (
        <div
          className="absolute z-50 flex items-center gap-2 px-3 py-1.5 bg-slate-900/95 text-white rounded-xl border border-slate-700/80 shadow-2xl backdrop-blur-md animate-fade-in no-print"
          style={{
            top: `${toolbarCoords.top}px`,
            left: `${toolbarCoords.left}px`,
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            isMouseDownOnToolbar.current = true;
          }}
          onMouseUp={() => {
            isMouseDownOnToolbar.current = false;
          }}
          onMouseLeave={() => {
            isMouseDownOnToolbar.current = false;
          }}
        >
          {/* Highlight options */}
          <div className="flex items-center gap-1 border-r border-slate-700/60 pr-2">
            {[
              { color: '#fef08a', name: 'Yellow' },
              { color: '#bbf7d0', name: 'Green' },
              { color: '#fbcfe8', name: 'Pink' },
              { color: '#bfdbfe', name: 'Blue' },
              { color: '#fed7aa', name: 'Orange' },
            ].map((swatch) => (
              <button
                key={swatch.color}
                type="button"
                onClick={() => applyHighlight(swatch.color)}
                className="w-3.5 h-3.5 rounded-full border border-white/20 hover:scale-110 transition cursor-pointer"
                style={{ backgroundColor: swatch.color }}
                title={`Highlight ${swatch.name}`}
              />
            ))}
            <button
              type="button"
              onClick={() => applyHighlight('')}
              className="w-3.5 h-3.5 rounded-full border border-dashed border-slate-500 hover:scale-110 transition cursor-pointer flex items-center justify-center bg-transparent text-[8px]"
              title="Clear Highlight"
            >
              ❌
            </button>
          </div>

          {/* Format/Edit commands */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={applyBold}
              className="px-1.5 py-0.5 hover:bg-slate-800 rounded font-bold text-[10px]"
              title="Bold"
            >
              B
            </button>
            <button
              type="button"
              onClick={applyItalic}
              className="px-1.5 py-0.5 hover:bg-slate-800 rounded italic text-[10px]"
              title="Italic"
            >
              I
            </button>
            <button
              type="button"
              onClick={handleInsertText}
              className="px-2 py-0.5 hover:bg-slate-800 rounded text-[9px] font-semibold text-slate-200"
              title="Add or replace text"
            >
              + Add Word
            </button>
            <button
              type="button"
              onClick={handleDeleteText}
              className="px-2 py-0.5 hover:bg-red-950 text-red-400 hover:text-red-300 rounded text-[9px] font-semibold"
              title="Delete text"
            >
              Delete
            </button>
          </div>
        </div>
      )}
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
          className={`p-1.5 hover:bg-slate-800 rounded transition ${showPromptEditor ? 'text-indigo-400 bg-slate-800' : 'text-slate-300 hover:text-white'
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
      {section.layout !== 'cover' && (
        <div className="ebook-page-header">
          <span>{bookTitle || 'My E-Book'}</span>
          <span className="font-semibold">
            {section.chapterTitle || `Page ${pageIndex}`}
          </span>
        </div>
      )}

      {/* 2. Page Body Content */}
      <div className="ebook-page-body">
        {pageBodyContent}
      </div>

      {/* 3. Page Footer (Page numbering) */}
      {section.layout !== 'cover' && (
        <div className="ebook-page-footer">
          <span>Artistic E-Book Series</span>
          <span className="font-mono text-xs">{pageIndex} of {totalPages}</span>
        </div>
      )}
    </div>
  );
};
