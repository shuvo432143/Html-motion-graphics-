import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Maximize2,
  RefreshCw,
  Film,
  Monitor,
  Smartphone,
  Square,
  Sparkles,
} from 'lucide-react';
import { AspectRatio, RenderProject } from '../types';
import { buildRenderableHtml } from '../services/deterministicTimeline';

interface PreviewViewProps {
  project: RenderProject;
  onNavigateToExport: () => void;
  onNavigateToEditor: () => void;
}

export const PreviewView: React.FC<PreviewViewProps> = ({
  project,
  onNavigateToExport,
  onNavigateToEditor,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(project.aspectRatio || '16:9');
  const [fitMode, setFitMode] = useState<'fit' | 'actual'>('fit');
  const [frameIndex, setFrameIndex] = useState<number>(0);
  const [isReady, setIsReady] = useState<boolean>(false);

  const totalDurationMs = project.durationSeconds * 1000;
  const frameIntervalMs = 1000 / project.fps;
  const totalFrames = Math.max(1, Math.round(project.durationSeconds * project.fps));

  // Build HTML srcdoc
  const bundledHtml = buildRenderableHtml(
    project.htmlContent,
    project.cssContent,
    project.jsContent,
    false, // preview plays smoothly
    project.fps
  );

  // Playback timer loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      if (isPlaying) {
        setCurrentTimeMs((prev) => {
          const next = prev + delta;
          if (next >= totalDurationMs) {
            return 0; // loop
          }
          return next;
        });
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, totalDurationMs]);

  // Sync frameIndex
  useEffect(() => {
    const f = Math.floor(currentTimeMs / frameIntervalMs);
    setFrameIndex(Math.min(totalFrames - 1, Math.max(0, f)));
  }, [currentTimeMs, frameIntervalMs, totalFrames]);

  // Send tick message to iframe
  const sendTickToIframe = (timeMs: number, fIdx: number) => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    try {
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'HVS_STEP_FRAME',
          timeMs: Math.round(timeMs),
          frameIndex: fIdx,
          fps: project.fps,
        },
        '*'
      );
    } catch (e) {}
  };

  const handleSeek = (newTimeMs: number) => {
    setCurrentTimeMs(newTimeMs);
    const f = Math.floor(newTimeMs / frameIntervalMs);
    sendTickToIframe(newTimeMs, f);
  };

  const handleStepFrame = (deltaFrames: number) => {
    setIsPlaying(false);
    const newFrame = Math.max(0, Math.min(totalFrames - 1, frameIndex + deltaFrames));
    const newTime = newFrame * frameIntervalMs;
    setCurrentTimeMs(newTime);
    setFrameIndex(newFrame);
    sendTickToIframe(newTime, newFrame);
  };

  const handleRestart = () => {
    setCurrentTimeMs(0);
    setFrameIndex(0);
    sendTickToIframe(0, 0);
    setIsPlaying(true);
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-w-[360px]';
      case '1:1':
        return 'aspect-square max-w-[540px]';
      case '4:3':
        return 'aspect-[4/3] max-w-[720px]';
      case '16:9':
      default:
        return 'aspect-video max-w-4xl';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top control bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">{project.name}</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800 font-mono">
              PREVIEW MODE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time interactive viewport · Export resolution set separately (1080p, 1440p, or 4K)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Aspect ratio selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setAspectRatio('16:9')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded ${
                aspectRatio === '16:9' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="16:9 Landscape"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>16:9</span>
            </button>
            <button
              onClick={() => setAspectRatio('9:16')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded ${
                aspectRatio === '9:16' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="9:16 Shorts/Reels"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>9:16</span>
            </button>
            <button
              onClick={() => setAspectRatio('1:1')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded ${
                aspectRatio === '1:1' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="1:1 Square"
            >
              <Square className="w-3.5 h-3.5" />
              <span>1:1</span>
            </button>
          </div>

          <button
            onClick={onNavigateToExport}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Film className="w-4 h-4" />
            <span>Go to 4K Export</span>
          </button>
        </div>
      </div>

      {/* Main Preview Viewport */}
      <div
        ref={containerRef}
        className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-center p-2 sm:p-6 min-h-[460px]"
      >
        <div
          className={`relative w-full ${getAspectClass()} rounded-xl overflow-hidden shadow-2xl border border-slate-800/80 bg-black flex items-center justify-center transition-all`}
        >
          <iframe
            ref={iframeRef}
            srcDoc={bundledHtml}
            title="Preview Canvas"
            className="w-full h-full border-none block"
            sandbox="allow-scripts allow-same-origin"
            onLoad={() => setIsReady(true)}
          />
        </div>

        {/* Viewport Floating Info */}
        <div className="absolute top-4 left-6 flex items-center gap-3 text-xs text-slate-400 pointer-events-none">
          <span className="bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded border border-slate-800 font-mono">
            {Math.floor(currentTimeMs / 1000)}.
            {String(Math.floor((currentTimeMs % 1000) / 10)).padStart(2, '0')}s / {project.durationSeconds}s
          </span>
          <span className="bg-slate-900/80 backdrop-blur px-2.5 py-1 rounded border border-slate-800 font-mono text-sky-400">
            Frame {frameIndex + 1} / {totalFrames}
          </span>
        </div>

        <div className="absolute top-4 right-6 flex items-center gap-2">
          <button
            onClick={() => {
              if (iframeRef.current) iframeRef.current.srcdoc = bundledHtml;
            }}
            title="Reload Scene"
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleFullscreen}
            title="Toggle Fullscreen"
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrubbing & Playback Controller */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4">
        {/* Timeline Scrubber */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>00:00.00</span>
            <span className="text-sky-400 font-semibold">
              Frame {frameIndex + 1} ({Math.round(currentTimeMs)} ms)
            </span>
            <span>
              00:{String(project.durationSeconds).padStart(2, '0')}.00
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={totalDurationMs}
            step={frameIntervalMs}
            value={currentTimeMs}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
          />
        </div>

        {/* Transport Controls */}
        <div className="flex items-center justify-between flex-wrap gap-4 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={handleRestart}
              title="Restart"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleStepFrame(-1)}
              title="Step 1 Frame Back"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              onClick={() => handleStepFrame(1)}
              title="Step 1 Frame Forward"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span>FPS: <strong className="text-white font-mono">{project.fps}</strong></span>
            <span>Duration: <strong className="text-white font-mono">{project.durationSeconds}s</strong></span>
            <span>Total Frames: <strong className="text-white font-mono">{totalFrames}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
