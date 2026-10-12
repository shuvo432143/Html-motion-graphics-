/**
 * HTML to MP4 Video Converter — Mobile Edition
 * Simple, fast, edge-to-edge deterministic frame scanning & MP4 video exporter.
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Upload,
  Code,
  Play,
  Pause,
  RotateCcw,
  Download,
  CheckCircle2,
  XCircle,
  Sparkles,
  Settings,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { DirectFrameCaptureEngine } from './services/htmlRendererEngine';
import { videoExportPipeline } from './services/videoEncoder';
import { buildRenderableHtml } from './services/deterministicTimeline';
import { RESOLUTION_PRESETS } from './constants/resolutions';
import { AspectRatio, ExportSettings, FrameRate, RenderJobProgress, ResolutionConfig } from './types';
import { SAMPLE_PROJECTS } from './services/projectTemplates';

export default function App() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // HTML Project State
  const [htmlCode, setHtmlCode] = useState<string>(() => SAMPLE_PROJECTS[0].htmlContent);
  const [cssCode, setCssCode] = useState<string>(() => SAMPLE_PROJECTS[0].cssContent);
  const [jsCode, setJsCode] = useState<string>(() => SAMPLE_PROJECTS[0].jsContent);
  const [showCodeEditor, setShowCodeEditor] = useState<boolean>(false);

  // Settings State (Default to 46s as requested)
  const [duration, setDuration] = useState<number>(46);
  const [fps, setFps] = useState<FrameRate>(30);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [selectedResolution, setSelectedResolution] = useState<ResolutionConfig>(RESOLUTION_PRESETS[1]); // 1080p

  // Playback State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);

  // Conversion / Scanning State
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<RenderJobProgress | null>(null);
  const [completedVideoUrl, setCompletedVideoUrl] = useState<string | null>(null);
  const [completedFileSize, setCompletedFileSize] = useState<number>(0);

  const totalDurationMs = duration * 1000;
  const frameIntervalMs = 1000 / fps;
  const totalFrames = Math.max(1, Math.round(duration * fps));

  // Build bundled HTML
  const bundledHtml = buildRenderableHtml(htmlCode, cssCode, jsCode, isScanning, fps);

  // Live Playback Loop
  useEffect(() => {
    if (isScanning || completedVideoUrl) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      if (isPlaying) {
        setCurrentTimeMs((prev) => {
          const next = prev + delta;
          if (next >= totalDurationMs) {
            return 0; // loop seamlessly
          }
          return next;
        });
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, totalDurationMs, isScanning, completedVideoUrl]);

  // Tick the live iframe
  useEffect(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow || isScanning) return;
    try {
      const f = Math.floor(currentTimeMs / frameIntervalMs);
      iframeRef.current.contentWindow.postMessage(
        {
          type: 'HVS_STEP_FRAME',
          timeMs: Math.round(currentTimeMs),
          frameIndex: f,
          fps: fps,
        },
        '*'
      );
    } catch (e) {}
  }, [currentTimeMs, frameIntervalMs, fps, isScanning]);

  // Handle HTML File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      let extractedHtml = text;
      let extractedCss = '';
      let extractedJs = '';

      const styleMatches = text.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
      if (styleMatches) {
        extractedCss = styleMatches.map((m) => m.replace(/<style[^>]*>|<\/style>/gi, '')).join('\n');
      }

      const scriptMatches = text.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      if (scriptMatches) {
        extractedJs = scriptMatches
          .filter((m) => !m.includes('src='))
          .map((m) => m.replace(/<script[^>]*>|<\/script>/gi, ''))
          .join('\n');
      }

      setHtmlCode(extractedHtml);
      setCssCode(extractedCss);
      setJsCode(extractedJs);
      setCompletedVideoUrl(null);
      setCurrentTimeMs(0);
      setShowCodeEditor(false);
    } catch (err) {
      alert('Could not read HTML file');
    }
    e.target.value = '';
  };

  // Load 3D Comparison Demo
  const handleLoadDemo = () => {
    setHtmlCode(SAMPLE_PROJECTS[0].htmlContent);
    setCssCode(SAMPLE_PROJECTS[0].cssContent);
    setJsCode(SAMPLE_PROJECTS[0].jsContent);
    setDuration(46);
    setCompletedVideoUrl(null);
    setCurrentTimeMs(0);
  };

  // Start Frame Scanning & Video Conversion
  const handleStartConversion = async () => {
    if (!iframeRef.current) return;
    setIsScanning(true);
    setIsPlaying(false);
    setCompletedVideoUrl(null);

    const exportSettings: ExportSettings = {
      filename: `html_video_${duration}s_${selectedResolution.width}p`,
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
      // Connect directly to the visible in-place iframe for 100% active layout
      await engine.init(
        htmlCode,
        cssCode,
        jsCode,
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
          setScanProgress(progress);
        }
      );

      // When the exact duration completes, stop scanning and set completed video
      const url = URL.createObjectURL(result.blob);
      setCompletedVideoUrl(url);
      setCompletedFileSize(result.fileSizeBytes);
    } catch (err: any) {
      if (err.message !== 'Export cancelled by user') {
        alert('Conversion failed: ' + (err.message || String(err)));
      }
    } finally {
      setIsScanning(false);
      setScanProgress(null);
      engine.destroy();

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

  const handleCancelScanning = () => {
    videoExportPipeline.cancel();
    setIsScanning(false);
    setScanProgress(null);
  };

  const handleDownloadMp4 = () => {
    if (!completedVideoUrl) return;
    const a = document.createElement('a');
    a.href = completedVideoUrl;
    a.download = `html_video_${duration}s_${selectedResolution.width}p.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getAspectClass = () => {
    switch (aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[65vh] max-w-[340px]';
      case '1:1':
        return 'aspect-square max-h-[65vh] max-w-[500px]';
      case '16:9':
      default:
        return 'aspect-video max-h-[65vh] max-w-full';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500/30">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".html,.htm"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Mobile Header Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-slate-950/95 border-b border-slate-900 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight leading-tight">
              HTML to MP4
            </h1>
            <span className="text-[10px] text-sky-400 font-mono tracking-wider">
              FAST CONVERTER
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700/80"
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>Upload HTML</span>
          </button>
          <button
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors border border-slate-800"
          >
            <Code className="w-3.5 h-3.5" />
            <span>{showCodeEditor ? 'Hide Code' : 'Paste Code'}</span>
          </button>
        </div>
      </header>

      {/* Main Single-Screen Mobile Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-3 sm:px-4 py-3 space-y-3">
        {/* Collapsible HTML / CSS / JS Paste Area */}
        {showCodeEditor && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2.5 shadow-lg animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Paste Raw HTML Code</span>
              <button
                onClick={handleLoadDemo}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-medium underline"
              >
                Load 46s 3D Demo
              </button>
            </div>
            <textarea
              value={htmlCode}
              onChange={(e) => {
                setHtmlCode(e.target.value);
                setCompletedVideoUrl(null);
              }}
              placeholder="Paste HTML, Canvas, or WebGL animation markup here..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
              spellCheck={false}
            />
          </div>
        )}

        {/* Video Settings (Compact Mobile Strip) */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Duration Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Duration:</span>
            <div className="flex items-center gap-1">
              {[10, 30, 46, 60].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    setDuration(sec);
                    setCompletedVideoUrl(null);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-colors ${
                    duration === sec
                      ? 'bg-sky-600 text-white'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
            <div className="flex items-center ml-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5">
              <input
                type="number"
                min={1}
                max={1800}
                value={duration}
                onChange={(e) => {
                  setDuration(Math.max(1, Number(e.target.value)));
                  setCompletedVideoUrl(null);
                }}
                className="w-10 bg-transparent text-white font-mono text-center focus:outline-none text-xs"
              />
              <span className="text-slate-500 text-[10px]">s</span>
            </div>
          </div>

          {/* Resolution & Aspect */}
          <div className="flex items-center gap-2">
            <select
              value={selectedResolution.id}
              onChange={(e) => {
                const found = RESOLUTION_PRESETS.find((r) => r.id === e.target.value);
                if (found) setSelectedResolution(found);
              }}
              className="bg-slate-950 border border-slate-800 text-white rounded px-2 py-1 font-mono text-[11px] focus:outline-none"
            >
              <option value="1080p_16_9">1080p (Full HD)</option>
              <option value="720p_16_9">720p (HD Fast)</option>
              <option value="2160p_16_9">4K UHD</option>
              <option value="1080p_9_16">9:16 (Shorts/Reels)</option>
            </select>

            <select
              value={fps}
              onChange={(e) => setFps(Number(e.target.value) as FrameRate)}
              className="bg-slate-950 border border-slate-800 text-white rounded px-2 py-1 font-mono text-[11px] focus:outline-none"
            >
              <option value={30}>30 FPS</option>
              <option value={60}>60 FPS</option>
              <option value={24}>24 FPS</option>
            </select>
          </div>
        </div>

        {/* Live Stage & Video Scanner (Zero Border, Zero Edge, Pure Video Canvas) */}
        <div className="relative w-full bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center min-h-[260px] sm:min-h-[400px]">
          {completedVideoUrl ? (
            /* Finished Playable Video View */
            <div className={`relative w-full ${getAspectClass()} bg-black flex items-center justify-center`}>
              <video
                src={completedVideoUrl}
                controls
                autoPlay
                loop
                playsInline
                className="w-full h-full object-contain border-0 p-0 m-0 block"
              />
            </div>
          ) : (
            /* Live Running HTML Code Stage */
            <div className={`relative w-full ${getAspectClass()} bg-black flex items-center justify-center`}>
              <iframe
                ref={iframeRef}
                srcDoc={bundledHtml}
                title="HTML Stage"
                className="w-full h-full border-0 p-0 m-0 block bg-black"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          )}

          {/* Active Scanning HUD Overlay */}
          {isScanning && scanProgress && (
            <div className="absolute inset-0 z-20 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
              <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Film className="w-4 h-4 text-sky-400 animate-pulse" />
                    <span className="text-xs font-bold text-white">Scanning Frames...</span>
                  </div>
                  <span className="text-base font-black font-mono text-sky-400">
                    {scanProgress.percent}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-sky-600 to-sky-400 h-full transition-all duration-100 rounded-full"
                    style={{ width: `${scanProgress.percent}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] font-mono text-slate-400">
                  <span>Frame {scanProgress.currentFrame} / {scanProgress.totalFrames}</span>
                  <span className="text-sky-400">
                    {(scanProgress.currentFrame / fps).toFixed(1)}s / {duration}.0s
                  </span>
                </div>

                <button
                  onClick={handleCancelScanning}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-red-950 hover:text-red-300 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          )}

          {/* Current Live Time Badge */}
          {!isScanning && !completedVideoUrl && (
            <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur font-mono text-[10px] text-white pointer-events-none">
              {(currentTimeMs / 1000).toFixed(1)}s / {duration}.0s ({Math.floor(currentTimeMs / frameIntervalMs)} / {totalFrames} f)
            </div>
          )}
        </div>

        {/* Primary Action Button Bar */}
        {completedVideoUrl ? (
          /* Finished State: Big Download Button */
          <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5 text-left w-full sm:w-auto">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">Conversion Finished!</span>
                <span className="text-[11px] text-slate-300 font-mono">
                  {selectedResolution.width}×{selectedResolution.height} · {duration}s · {(completedFileSize / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleDownloadMp4}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-md shadow-emerald-600/30"
              >
                <Download className="w-4 h-4" />
                <span>Download MP4 Video</span>
              </button>
              <button
                onClick={() => setCompletedVideoUrl(null)}
                className="px-3 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Convert Again
              </button>
            </div>
          </div>
        ) : (
          /* Ready to Convert: Big Mobile Button */
          <div className="pt-1">
            <button
              onClick={handleStartConversion}
              disabled={isScanning}
              className="w-full py-4 px-6 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-bold text-sm sm:text-base rounded-xl transition-all shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2.5 active:scale-[0.99]"
            >
              <Film className="w-5 h-5" />
              <span>
                {isScanning
                  ? 'Scanning & Encoding Video...'
                  : `Scan & Convert to MP4 (${duration}s · ${totalFrames} Frames)`}
              </span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
