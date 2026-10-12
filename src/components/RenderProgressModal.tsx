import React from 'react';
import { RenderJobProgress } from '../types';
import { AlertCircle, Film, Loader2, XCircle } from 'lucide-react';

interface RenderProgressModalProps {
  progress: RenderJobProgress;
  onCancel: () => void;
}

export const RenderProgressModal: React.FC<RenderProgressModalProps> = ({
  progress,
  onCancel,
}) => {
  const elapsedSec = Math.round(progress.timeElapsedMs / 1000);
  const remainingSec = Math.round(progress.estimatedRemainingMs / 1000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Film className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Rendering MP4 Video</h2>
              <span className="text-xs text-sky-400 font-medium">{progress.activeStepText}</span>
            </div>
          </div>
          <span className="text-2xl font-black font-mono text-white">
            {progress.percent}%
          </span>
        </div>

        {/* Live Frame Preview Thumbnail */}
        {progress.currentThumbnail ? (
          <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center">
            <img
              src={progress.currentThumbnail}
              alt="Live Render Frame"
              className="w-full h-full object-contain"
            />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 text-[10px] font-mono text-white">
              LIVE ENCODING PREVIEW
            </div>
          </div>
        ) : (
          <div className="aspect-video w-full rounded-xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
            <span className="text-xs">Preparing hardware encoder pipeline...</span>
          </div>
        )}

        {/* Accurate Real-Time Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-sky-600 to-sky-400 h-full transition-all duration-150 rounded-full"
              style={{ width: `${progress.percent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>
              Frame <strong className="text-white">{progress.currentFrame}</strong> / {progress.totalFrames}
            </span>
            <span>
              Speed: <strong className="text-sky-400">{progress.currentFps} FPS</strong>
            </span>
          </div>
        </div>

        {/* Timers & Stats */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
          <div>
            <span className="text-slate-500 block">Elapsed Time</span>
            <span className="text-slate-200 font-mono font-semibold">{elapsedSec}s</span>
          </div>
          <div>
            <span className="text-slate-500 block">Est. Remaining</span>
            <span className="text-slate-200 font-mono font-semibold">
              {progress.currentFrame > 5 ? `${remainingSec}s` : 'Calculating...'}
            </span>
          </div>
        </div>

        {/* Cancel Button */}
        <div className="pt-2">
          <button
            onClick={onCancel}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-red-950/60 hover:text-red-300 text-slate-300 font-semibold text-xs transition-colors border border-slate-700/80 flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel & Free Memory</span>
          </button>
        </div>
      </div>
    </div>
  );
};
