import React, { useState } from 'react';
import { Film, Settings, AlertTriangle, ShieldCheck, HardDrive, Cpu, Check, Layers } from 'lucide-react';
import { ExportSettings, FrameRate, QualityPreset, RenderProject, ResolutionConfig } from '../types';
import { RESOLUTION_PRESETS } from '../constants/resolutions';

interface ExportViewProps {
  project: RenderProject;
  onStartExport: (settings: ExportSettings) => void;
  onNavigateToPreview: () => void;
}

export const ExportView: React.FC<ExportViewProps> = ({
  project,
  onStartExport,
  onNavigateToPreview,
}) => {
  const [selectedResolution, setSelectedResolution] = useState<ResolutionConfig>(
    RESOLUTION_PRESETS.find((r) => r.id === project.resolutionId) || RESOLUTION_PRESETS[1]
  );
  const [isCustomResolution, setIsCustomResolution] = useState(false);
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);

  const [fps, setFps] = useState<FrameRate>(project.fps || 30);
  const [duration, setDuration] = useState(project.durationSeconds || 10);
  const [startTime, setStartTime] = useState(0);
  const [qualityPreset, setQualityPreset] = useState<QualityPreset>('high');
  const [filename, setFilename] = useState(
    `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${selectedResolution.width}p`
  );
  const [codec, setCodec] = useState<'avc' | 'hevc'>('avc');
  const [deterministicStepping, setDeterministicStepping] = useState(true);

  // Bitrate calculations
  const baseBitrate = selectedResolution.recommendedBitrateMbps;
  const qualityMultiplier = qualityPreset === 'maximum' ? 1.5 : qualityPreset === 'standard' ? 0.75 : 1.0;
  const effectiveBitrateMbps = Math.round(baseBitrate * qualityMultiplier);

  // Workload estimates
  const totalFrames = Math.max(1, Math.round(duration * fps));
  const estimatedSizeBytes = Math.round(((effectiveBitrateMbps * 1_000_000) / 8) * duration);
  const estimatedSizeMb = Math.round((estimatedSizeBytes / (1024 * 1024)) * 10) / 10;
  const memoryPerFrameMb = selectedResolution.memoryPerFrameMb;

  const is4K = selectedResolution.width >= 3840 || selectedResolution.height >= 2160;

  const handleLaunchExport = () => {
    const finalRes: ResolutionConfig = isCustomResolution
      ? {
          id: 'custom',
          name: `Custom (${customWidth} × ${customHeight})`,
          width: customWidth,
          height: customHeight,
          aspectRatio: 'custom',
          category: 'high',
          recommendedBitrateMbps: effectiveBitrateMbps,
          memoryPerFrameMb: Math.round(((customWidth * customHeight * 4) / (1024 * 1024)) * 10) / 10,
          description: 'User-defined custom resolution',
        }
      : selectedResolution;

    const settings: ExportSettings = {
      filename: filename.trim() || 'rendered_animation',
      resolution: finalRes,
      aspectRatio: finalRes.aspectRatio,
      fps,
      durationSeconds: duration,
      startTimeSeconds: startTime,
      qualityPreset,
      bitrateMbps: effectiveBitrateMbps,
      codec,
      deterministicStepping,
      saveToMediaStore: true,
    };

    onStartExport(settings);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          MP4 Export Studio & Video Encoder
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure native rendering resolution, hardware H.264 profile, frame rate, and deterministic clock settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Settings */}
        <div className="lg:col-span-2 space-y-8">
          {/* 1. Resolution Selection */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Target Resolution</h2>
                <p className="text-xs text-slate-400">
                  Rendered at genuine native canvas dimensions without upscaling artifacts
                </p>
              </div>
              <button
                onClick={() => setIsCustomResolution(!isCustomResolution)}
                className="text-xs text-sky-400 hover:text-sky-300 font-medium underline"
              >
                {isCustomResolution ? 'Select Standard Preset' : 'Custom Dimensions'}
              </button>
            </div>

            {isCustomResolution ? (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Width (px)</label>
                  <input
                    type="number"
                    min={320}
                    max={7680}
                    value={customWidth}
                    onChange={(e) => setCustomWidth(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Height (px)</label>
                  <input
                    type="number"
                    min={240}
                    max={4320}
                    value={customHeight}
                    onChange={(e) => setCustomHeight(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {RESOLUTION_PRESETS.map((res) => {
                  const isSelected = selectedResolution.id === res.id;
                  return (
                    <button
                      key={res.id}
                      onClick={() => {
                        setSelectedResolution(res);
                        setFilename(
                          `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${res.width}p`
                        );
                      }}
                      className={`text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-sky-500 bg-sky-950/30 shadow-md shadow-sky-500/10'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{res.name}</span>
                        {isSelected && <Check className="w-4 h-4 text-sky-400" />}
                      </div>
                      <span className="text-xs text-slate-400 block mt-1 line-clamp-1">
                        {res.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {is4K && (
              <div className="p-3.5 bg-amber-950/30 border border-amber-800/60 rounded-xl flex items-start gap-3 text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <strong className="block font-semibold">4K UHD High-VRAM Notice</strong>
                  Rendering 3840 × 2160 frames uses ~33.2 MB per frame buffer. Our bounded pipeline
                  releases memory immediately, but ensure your Android device has at least 6 GB RAM.
                </div>
              </div>
            )}
          </div>

          {/* 2. Frame Rate & Quality */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-white">Frame Rate & Codec Profile</h2>
              <p className="text-xs text-slate-400">
                Maintains locked timestamps (e.g. exactly 33.33ms per frame at 30 FPS)
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* FPS */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Frame Rate</label>
                <div className="grid grid-cols-3 gap-2">
                  {[24, 30, 60].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setFps(rate as FrameRate)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        fps === rate
                          ? 'bg-sky-600 border-sky-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {rate} FPS
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Preset */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">Quality Preset</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['standard', 'high', 'maximum'] as QualityPreset[]).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setQualityPreset(preset)}
                      className={`py-2 rounded-xl text-xs font-bold capitalize border transition-colors ${
                        qualityPreset === preset
                          ? 'bg-sky-600 border-sky-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Duration Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
                <span>Video Duration: {duration} Seconds</span>
                <span className="text-slate-400 font-mono">{totalFrames} Total Frames</span>
              </div>
              <input
                type="range"
                min={3}
                max={60}
                step={1}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between text-[11px] text-slate-500 mt-1 font-mono">
                <span>3s (Test)</span>
                <span>10s</span>
                <span>30s</span>
                <span>60s (Long)</span>
              </div>
            </div>

            {/* Filename */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Output Filename (.mp4)
              </label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Right 1 Column: Workload Summary & Primary CTA */}
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl sticky top-20">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Render Workload Estimator
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Target Dimensions</span>
                <span className="text-white font-mono font-semibold">
                  {selectedResolution.width} × {selectedResolution.height}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Total Workload</span>
                <span className="text-white font-mono font-semibold">
                  {totalFrames} Frames
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Target Bitrate</span>
                <span className="text-white font-mono font-semibold">
                  {effectiveBitrateMbps} Mbps
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Est. Video File Size</span>
                <span className="text-sky-400 font-mono font-bold">
                  ~{estimatedSizeMb} MB
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Memory Per Frame</span>
                <span className="text-slate-300 font-mono">
                  {memoryPerFrameMb} MB (Bounded)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Container Format</span>
                <span className="text-emerald-400 font-mono font-semibold">
                  Playable .MP4 (H.264)
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleLaunchExport}
                className="w-full py-4 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-base transition-colors shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 group"
              >
                <Film className="w-5 h-5 group-hover:scale-105 transition-transform" />
                <span>Render & Download MP4</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 text-center leading-relaxed">
              No manual screen recording required. Generates an authentic, hardware-encoded MP4 file
              saved straight to your device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
