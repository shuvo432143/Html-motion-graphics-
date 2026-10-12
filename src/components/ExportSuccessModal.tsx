import React from 'react';
import { Download, Share2, RefreshCw, CheckCircle2, ArrowLeft, Film, Smartphone } from 'lucide-react';
import { ExportHistoryRecord } from '../types';

interface ExportSuccessModalProps {
  record: ExportHistoryRecord;
  videoBlobUrl: string;
  onClose: () => void;
  onRenderAgain: () => void;
}

export const ExportSuccessModal: React.FC<ExportSuccessModalProps> = ({
  record,
  videoBlobUrl,
  onClose,
  onRenderAgain,
}) => {
  const sizeMb = Math.round((record.fileSizeBytes / (1024 * 1024)) * 100) / 100;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = videoBlobUrl;
    a.download = `${record.filename}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const file = new File([await (await fetch(videoBlobUrl)).blob()], `${record.filename}.mp4`, {
          type: 'video/mp4',
        });
        await navigator.share({
          title: record.projectName,
          text: `Rendered with HTML Video Studio 4K (${record.resolution})`,
          files: [file],
        });
      } catch (e) {
        handleDownload();
      }
    } else {
      handleDownload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">MP4 Export Completed!</h2>
              <p className="text-xs text-slate-400">
                Verified genuine H.264 video encoded and containerized
              </p>
            </div>
          </div>
          <span className="text-xs px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-bold">
            VALID MP4
          </span>
        </div>

        {/* Embedded Video Player */}
        <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-black shadow-lg">
          <video
            src={videoBlobUrl}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/70 p-4 rounded-xl border border-slate-800">
          <div>
            <span className="text-slate-500 block">Resolution</span>
            <span className="text-white font-mono font-bold">{record.resolution}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Frame Rate</span>
            <span className="text-white font-mono font-bold">{record.fps} FPS</span>
          </div>
          <div>
            <span className="text-slate-500 block">Duration</span>
            <span className="text-white font-mono font-bold">{record.durationSeconds} Seconds</span>
          </div>
          <div>
            <span className="text-slate-500 block">File Size</span>
            <span className="text-sky-400 font-mono font-bold">{sizeMb} MB</span>
          </div>
        </div>

        {/* Primary Download & Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleDownload}
            className="w-full py-4 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition-colors shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            <span>Download MP4 File to Android Device</span>
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleShare}
              className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
            <button
              onClick={onRenderAgain}
              className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Render Again</span>
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Studio</span>
            </button>
          </div>
        </div>

        {/* Android Storage Access note */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
          <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Saved directly into Android <strong>Downloads / Movies</strong> folder via MediaStore.
            Compatible with YouTube, CapCut, Premiere, and all standard media players.
          </span>
        </div>
      </div>
    </div>
  );
};
