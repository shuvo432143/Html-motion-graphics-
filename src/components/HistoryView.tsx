import React from 'react';
import { ExportHistoryRecord } from '../types';
import { Film, Trash2, Download, Play, Calendar, HardDrive, Smartphone } from 'lucide-react';

interface HistoryViewProps {
  history: ExportHistoryRecord[];
  onDeleteHistoryItem: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onDeleteHistoryItem,
  onClearAll,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Export History</h1>
          <p className="text-xs text-slate-400 mt-1">
            Log of previously encoded MP4 videos and device storage files
          </p>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-red-400 hover:text-red-300 font-semibold px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-900/60 transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl bg-slate-900/40">
          <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-white">No Exports Yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Render your first animation using the Export 4K tab. Rendered MP4 files will appear here
            for easy re-download and tracking.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map((item) => {
            const dateStr = new Date(item.completedAt).toLocaleString();
            const sizeMb = Math.round((item.fileSizeBytes / (1024 * 1024)) * 100) / 100;

            return (
              <div
                key={item.id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 hover:border-slate-700 transition-all shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-sky-400 block truncate">
                      {item.projectName}
                    </span>
                    <h3 className="text-sm font-bold text-white font-mono truncate">
                      {item.filename}.mp4
                    </h3>
                  </div>
                  <button
                    onClick={() => onDeleteHistoryItem(item.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    title="Remove from history"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 font-mono">
                  <div>
                    <span className="text-slate-500 block">RES</span>
                    <span className="text-white">{item.resolution}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">FPS/TIME</span>
                    <span className="text-white">{item.fps}fps · {item.durationSeconds}s</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">SIZE</span>
                    <span className="text-sky-400">{sizeMb} MB</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{dateStr}</span>
                  </div>

                  {item.blobUrl && (
                    <a
                      href={item.blobUrl}
                      download={`${item.filename}.mp4`}
                      className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
