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
  Download,
  CheckCircle2,
  XCircle,
  Share2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AspectRatio, ExportSettings, FrameRate, RenderJobProgress, RenderProject, ResolutionConfig } from '../types';
import { buildRenderableHtml } from '../services/deterministicTimeline';
import { RESOLUTION_PRESETS } from '../constants/resolutions';
import { DirectFrameCaptureEngine } from '../services/htmlRendererEngine';
import { videoExportPipeline } from '../services/videoEncoder';
import { saveExportHistoryItem } from '../services/storageService';

interface PreviewViewProps {
  project: RenderProject;
  onNavigateToExport: () => void;
  onNavigateToEditor: () => void;
  onUpdateProject?: (updated: Partial<RenderProject>) => void;
}

export const PreviewView: React.FC<PreviewViewProps> = ({
  project,
  onNavigateToExport,
  onNavigateToEditor,
  onUpdateProject,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(project.aspectRatio || '16:9');
  const [frameIndex, setFrameIndex] = useState<number>(0);

  // Video Settings
  const [duration, setDuration] = useState<number>(project.durationSeconds || 15);
  const [fps, setFps] = useState<FrameRate>(project.fps || 30);
  const [selectedResolution, setSelectedResolution] = useState<ResolutionConfig>(
    RESOLUTION_PRESETS.find((r) => r.id === project.resolutionId) || RESOLUTION_PRESETS[1]
  );

  // In-Place Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<RenderJobProgress | null>(null);
  const [completedBlobUrl, setCompletedBlobUrl] = useState<string | null>(null);
  const [completedFileSize, setCompletedFileSize] = useState<number>(0);

  const totalDurationMs = duration * 1000;
  const frameIntervalMs = 1000 / fps;
  const totalFrames = Math.max(1, Math.round(duration * fps));

  // Build bundled HTML
  const bundledHtml = buildRenderableHtml(
    project.htmlContent,
    project.cssContent,
    project.jsContent,
    isGenerating,
    fps
  );

  // Sync duration changes to project
  const handleDurationChange = (newSec: number) => {
    const val = Math.max(1, Math.min(1800, newSec));
    setDuration(val);
    if (onUpdateProject) {
      onUpdateProject({ durationSeconds: val });
    }
  };

  // Playback timer loop
  useEffect(() => {
    if (isGenerating || completedBlobUrl) return;

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
  }, [isPlaying, totalDurationMs, isGenerating, completedBlobUrl]);

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
          fps: fps,
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

  // In-Place Video Generator
  const handleStartInPlaceGeneration = async () => {
    setIsGenerating(true);
    setIsPlaying(false);
    setCompletedBlobUrl(null);
    setRenderProgress({
      status: 'preparing',
      currentFrame: 0,
      totalFrames,
      percent: 0,
      currentFps: 0,
      timeElapsedMs: 0,
      estimatedRemainingMs: 0,
      activeStepText: 'Initializing video encoder...',
    });

    const exportSettings: ExportSettings = {
      filename: `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${selectedResolution.width}p`,
      resolution: selectedResolution,
      aspectRatio,
      fps,
      durationSeconds: duration,
      startTimeSeconds: 0,
      qualityPreset: 'high',
      bitrateMbps: selectedResolution.recommendedBitrateMbps,
      codec: 'avc',
      deterministicStepping: true,
      saveToMediaStore: true,
    };

    const engine = new DirectFrameCaptureEngine();

    try {
      // Use the visible active iframe directly for 100% layout and zero blank screens!
      await engine.init(
        project.htmlContent,
        project.cssContent,
        project.jsContent,
        selectedResolution.width,
        selectedResolution.height,
        fps,
        iframeRef.current
      );

      const result = await videoExportPipeline.renderFramesToMp4(
        async (timeMs, fIndex) => {
          return await engine.captureFrame(timeMs, fIndex);
        },
        exportSettings,
        (progress) => {
          setRenderProgress(progress);
        }
      );

      const blobUrl = URL.createObjectURL(result.blob);
      setCompletedBlobUrl(blobUrl);
      setCompletedFileSize(result.fileSizeBytes);

      // Save to export history
      saveExportHistoryItem({
        id: 'export_' + Date.now(),
        projectName: project.name,
        filename: exportSettings.filename,
        resolution: selectedResolution.name,
        dimensions: { width: selectedResolution.width, height: selectedResolution.height },
        fps: fps,
        durationSeconds: duration,
        fileSizeBytes: result.fileSizeBytes,
        completedAt: Date.now(),
        blobUrl: blobUrl,
      });
    } catch (err: any) {
      console.error('In-place generation error:', err);
      if (err.message !== 'Export cancelled by user') {
        alert('Render failed: ' + (err.message || String(err)));
      }
    } finally {
      setIsGenerating(false);
      setRenderProgress(null);
      engine.destroy();

      // Restore iframe to interactive mode
      if (iframeRef.current && iframeRef.current.contentWindow) {
        try {
          const win = iframeRef.current.contentWindow as any;
          if (win && win.__HTML_VIDEO_STUDIO__) {
            win.__HTML_VIDEO_STUDIO__.setControlledMode(false);
          }
        } catch (e) {}
      }
    }
  };

  const handleCancelGeneration = () => {
    videoExportPipeline.cancel();
    setIsGenerating(false);
    setRenderProgress(null);
  };

  const handleDownloadMp4 = () => {
    if (!completedBlobUrl) return;
    const a = document.createElement('a');
    a.href = completedBlobUrl;
    a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${selectedResolution.width}p.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[72vh] max-w-[420px]';
      case '1:1':
        return 'aspect-square max-h-[72vh] max-w-[620px]';
      case '4:3':
        return 'aspect-[4/3] max-h-[72vh] max-w-[800px]';
      case '16:9':
      default:
        return 'aspect-video max-h-[72vh] max-w-[960px]';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4">
      {/* All-in-One Studio Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center flex-wrap gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">
              {project.name}
            </span>
          </div>

          {/* Aspect Ratio Buttons */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setAspectRatio('16:9')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded ${
                aspectRatio === '16:9' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>16:9</span>
            </button>
            <button
              onClick={() => setAspectRatio('9:16')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded ${
                aspectRatio === '9:16' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>9:16</span>
            </button>
            <button
              onClick={() => setAspectRatio('1:1')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded ${
                aspectRatio === '1:1' ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>1:1</span>
            </button>
          </div>

          {/* Resolution Selector */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs">
            <span className="text-slate-400 hidden sm:inline">Res:</span>
            <select
              value={selectedResolution.id}
              onChange={(e) => {
                const found = RESOLUTION_PRESETS.find((r) => r.id === e.target.value);
                if (found) setSelectedResolution(found);
              }}
              className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
            >
              {RESOLUTION_PRESETS.filter((r) => r.aspectRatio === aspectRatio || r.aspectRatio === '16:9').map((r) => (
                <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {/* FPS Selector */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs">
            <span className="text-slate-400 hidden sm:inline">FPS:</span>
            <select
              value={fps}
              onChange={(e) => setFps(Number(e.target.value) as FrameRate)}
              className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
            >
              <option value={24} className="bg-slate-900 text-white">24 FPS</option>
              <option value={30} className="bg-slate-900 text-white">30 FPS</option>
              <option value={60} className="bg-slate-900 text-white">60 FPS</option>
            </select>
          </div>

          {/* Arbitrary Duration Presets & Input */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
            <Clock className="w-3.5 h-3.5 text-sky-400 ml-1" />
            <div className="flex items-center gap-1">
              {[5, 10, 15, 30, 60].map((sec) => (
                <button
                  key={sec}
                  onClick={() => handleDurationChange(sec)}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
                    duration === sec ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
            <div className="flex items-center pl-1 border-l border-slate-800">
              <input
                type="number"
                min={1}
                max={1800}
                value={duration}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="w-12 bg-slate-900 text-white text-center rounded px-1 py-0.5 font-mono text-xs focus:outline-none"
                title="Custom Duration in Seconds"
              />
              <span className="text-slate-400 text-[11px] px-1">s</span>
            </div>
          </div>
        </div>

        {/* Primary Action Button: In-Place Generation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartInPlaceGeneration}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 text-white text-xs sm:text-sm font-bold rounded-lg transition-colors shadow-md shadow-sky-600/30 whitespace-nowrap"
          >
            <Film className="w-4 h-4" />
            <span>{isGenerating ? 'Rendering...' : 'Generate & Export MP4'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Stage Viewport (Full Bleed, Zero Border, Zero Edge) */}
      <div
        ref={containerRef}
        className="relative w-full bg-black flex items-center justify-center overflow-hidden min-h-[380px] sm:min-h-[520px] rounded-xl border border-slate-900"
      >
        {completedBlobUrl ? (
          /* Completed Video Player View (In Place) */
          <div className={`relative w-full ${getAspectClass()} bg-black flex items-center justify-center`}>
            <video
              src={completedBlobUrl}
              controls
              autoPlay
              loop
              playsInline
              className="w-full h-full object-contain border-0 p-0 m-0 block"
            />
          </div>
        ) : (
          /* Live Interactive Animation Stage (In Place) */
          <div className={`relative w-full ${getAspectClass()} bg-black flex items-center justify-center`}>
            <iframe
              ref={iframeRef}
              srcDoc={bundledHtml}
              title="Studio Canvas"
              className="w-full h-full border-0 p-0 m-0 block bg-black"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        )}

        {/* Real-time In-Place Rendering Progress Overlay */}
        {isGenerating && renderProgress && (
          <div className="absolute inset-0 z-30 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-sky-400 animate-pulse" />
                  <span className="text-sm font-bold text-white">Rendering MP4 Video</span>
                </div>
                <span className="text-lg font-black font-mono text-sky-400">
                  {renderProgress.percent}%
                </span>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-sky-600 to-sky-400 h-full transition-all duration-100 rounded-full"
                    style={{ width: `${renderProgress.percent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span>Frame {renderProgress.currentFrame} / {renderProgress.totalFrames}</span>
                  <span className="text-sky-400">{renderProgress.currentFps} FPS</span>
                </div>
              </div>

              <div className="text-xs text-slate-300 font-mono">
                {renderProgress.activeStepText}
              </div>

              <button
                onClick={handleCancelGeneration}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancel Render</span>
              </button>
            </div>
          </div>
        )}

        {/* Viewport Floating Info (When Not Generating and Not in Completed State) */}
        {!isGenerating && !completedBlobUrl && (
          <div className="absolute top-3 left-3 flex items-center gap-2 text-xs text-slate-400 pointer-events-none">
            <span className="bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded font-mono text-[11px] text-white">
              {Math.floor(currentTimeMs / 1000)}.
              {String(Math.floor((currentTimeMs % 1000) / 10)).padStart(2, '0')}s / {duration}s
            </span>
            <span className="bg-slate-950/80 backdrop-blur px-2 py-1 rounded font-mono text-[11px] text-sky-400">
              Frame {frameIndex + 1}/{totalFrames}
            </span>
          </div>
        )}

        {!isGenerating && !completedBlobUrl && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            <button
              onClick={() => {
                if (iframeRef.current) iframeRef.current.srcdoc = bundledHtml;
              }}
              title="Reload Stage"
              className="p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleFullscreen}
              title="Fullscreen"
              className="p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Completed Video Actions Bar (Appears in-place right below stage) */}
      {completedBlobUrl && (
        <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">MP4 Video Ready for Download!</span>
              <span className="text-xs text-slate-300 font-mono">
                {selectedResolution.width}×{selectedResolution.height} · {fps} FPS · {duration}s · {Math.round((completedFileSize / (1024 * 1024)) * 10) / 10} MB
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMp4}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-lg transition-colors shadow-md shadow-emerald-600/30"
            >
              <Download className="w-4 h-4" />
              <span>Download MP4 File</span>
            </button>
            <button
              onClick={() => setCompletedBlobUrl(null)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
            >
              Back to Live Preview
            </button>
          </div>
        </div>
      )}

      {/* Playback Transport & Timeline Controller */}
      {!completedBlobUrl && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 sm:p-4 space-y-3">
          {/* Timeline Scrubber */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>00:00.00</span>
              <span className="text-sky-400 font-semibold">
                Frame {frameIndex + 1} ({Math.round(currentTimeMs)} ms)
              </span>
              <span>
                00:{String(duration).padStart(2, '0')}.00
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
          <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
            <div className="flex items-center gap-1.5">
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
                className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-2 transition-colors shadow-sm"
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

            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span>Res: <strong className="text-white">{selectedResolution.width}×{selectedResolution.height}</strong></span>
              <span>Total: <strong className="text-white">{totalFrames} Frames</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
