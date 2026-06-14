import React from 'react';
import { Sparkles } from 'lucide-react';

interface ExportProgressOverlayProps {
  current: number;
  total: number;
  statusMessage?: string;
  mode?: 'print' | 'queue';
  onCancel?: () => void;
}

export const ExportProgressOverlay: React.FC<ExportProgressOverlayProps> = ({
  current,
  total,
  statusMessage,
  mode = 'print',
  onCancel,
}) => {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const isPreparing = Boolean(statusMessage);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center no-print px-4">
      <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full text-center">
        <Sparkles size={36} className="text-indigo-400 animate-spin" />
        <div>
          <h3 className="text-base font-semibold text-slate-100">
            {mode === 'queue' ? 'Generating PDF' : 'Preparing print export'}
          </h3>
          {isPreparing ? (
            <p className="text-sm text-slate-300 mt-2">{statusMessage}</p>
          ) : (
            <>
              <p className="text-sm text-slate-300 mt-2 tabular-nums">
                Page {current} of {total}
              </p>
              <p className="text-xs text-slate-500 mt-1">{pct}% complete</p>
            </>
          )}
        </div>

        <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`bg-indigo-500 h-full rounded-full transition-all duration-200 ${
              isPreparing ? 'w-2/3 animate-pulse' : ''
            }`}
            style={isPreparing ? undefined : { width: `${Math.max(pct, total > 0 ? 2 : 0)}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-500 leading-relaxed">
          {mode === 'queue'
            ? 'Background export uses the same preview layout as the editor. The PDF downloads automatically when ready.'
            : 'Uses the browser print dialog — choose "Save as PDF" or "Microsoft Print to PDF" to download. Output matches your editor preview.'}
        </p>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2 cursor-pointer"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
