import React, { useRef, useState, useEffect } from 'react';
import { Film, Play, Code, Download, Upload, Cpu, Layers, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { RenderProject } from '../types';
import { SAMPLE_PROJECTS } from '../services/projectTemplates';
import JSZip from 'jszip';

interface DashboardViewProps {
  currentProject: RenderProject;
  projects: RenderProject[];
  onSelectProject: (project: RenderProject) => void;
  onNavigate: (tab: any) => void;
  onImportHtml: (file: File) => void;
  onImportZip: (file: File) => void;
  onCreateBlank: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentProject,
  projects,
  onSelectProject,
  onNavigate,
  onImportHtml,
  onImportZip,
  onCreateBlank,
}) => {
  const htmlInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const [deviceStats, setDeviceStats] = useState({
    webCodecs: false,
    webgl: false,
    hardwareConcurrency: 4,
    deviceMemoryGb: 8,
    maxRecommendedResolution: '1080p Full HD',
  });

  useEffect(() => {
    // Detect hardware capabilities
    const hasWebCodecs =
      typeof window !== 'undefined' &&
      typeof (window as any).VideoEncoder !== 'undefined' &&
      typeof (window as any).VideoFrame !== 'undefined';

    let hasWebGL = false;
    try {
      const c = document.createElement('canvas');
      hasWebGL = !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) {}

    const cores = navigator.hardwareConcurrency || 4;
    const mem = (navigator as any).deviceMemory || 8;

    let maxRes = '1080p Full HD';
    if (cores >= 8 && mem >= 6) {
      maxRes = '2160p 4K UHD';
    } else if (cores >= 6 || mem >= 4) {
      maxRes = '1440p 2K QHD';
    }

    setDeviceStats({
      webCodecs: hasWebCodecs,
      webgl: hasWebGL,
      hardwareConcurrency: cores,
      deviceMemoryGb: mem,
      maxRecommendedResolution: maxRes,
    });
  }, []);

  const handleHtmlFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportHtml(file);
      e.target.value = '';
    }
  };

  const handleZipFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportZip(file);
      e.target.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={htmlInputRef}
        accept=".html,.htm"
        className="hidden"
        onChange={handleHtmlFileChange}
      />
      <input
        type="file"
        ref={zipInputRef}
        accept=".zip"
        className="hidden"
        onChange={handleZipFileChange}
      />

      {/* Hero Studio Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 tracking-wider uppercase mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Deterministic Video Studio · Android MP4 Engine</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Turn HTML, CSS, Canvas & 3D WebGL into High-Quality MP4 Video
              </h1>
              <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
                Hardware-accelerated H.264 rendering engineered for Android phones and tablets.
                Eliminates frame drops with deterministic clock-stepping. Produces authentic,
                downloadable MP4 files for YouTube comparisons, reels, and video productions.
              </p>
            </div>

            {/* Quick action bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('preview')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm transition-colors shadow-lg shadow-sky-500/25"
              >
                <Play className="w-4 h-4" />
                <span>Preview Animation</span>
              </button>
              <button
                onClick={() => htmlInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors border border-slate-700/80"
              >
                <Upload className="w-4 h-4 text-sky-400" />
                <span>Import .HTML</span>
              </button>
              <button
                onClick={() => zipInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm transition-colors border border-slate-700/80"
              >
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Import ZIP</span>
              </button>
            </div>

            {/* Active project pill metadata */}
            <div className="pt-2 border-t border-slate-800 flex items-center gap-3 text-xs text-slate-400">
              <span className="text-slate-300 font-medium truncate max-w-xs">
                Active: {currentProject.name}
              </span>
              <span aria-hidden="true">·</span>
              <span>{currentProject.durationSeconds}s @ {currentProject.fps} FPS</span>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => onNavigate('editor')}
                className="text-sky-400 hover:text-sky-300 underline font-medium"
              >
                Open in Editor
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full overflow-hidden bg-slate-950 flex items-center justify-center border-t lg:border-t-0 lg:border-l border-slate-800">
            <img
              src="/src/assets/images/template_football_comparison_1791811144411.jpg"
              alt="3D Football Club Podium Comparison Preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center brightness-95 contrast-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 right-4 text-left pointer-events-none">
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">
                Featured 3D Template
              </span>
              <span className="text-sm font-bold text-white block">
                YouTube 3D Club Valuation Comparison
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Hardware Diagnostics Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Android & Web Hardware Engine Diagnostics</h2>
              <p className="text-xs text-slate-400">
                Verified hardware capabilities for deterministic frame rendering
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-4 text-xs font-medium text-slate-300">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>WebCodecs H.264: {deviceStats.webCodecs ? 'Hardware Enabled' : 'Canvas Fallback'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>WebGL 3D: {deviceStats.webgl ? 'Active' : 'Software'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sky-400">
              <span>Max Safe Profile: {deviceStats.maxRecommendedResolution}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Production Template Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Production Templates</h2>
            <p className="text-sm text-slate-400">
              Battle-tested animations with verified deterministic timelines and 4K MP4 export readiness
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {SAMPLE_PROJECTS.map((tpl) => {
            const isSelected = tpl.id === currentProject.id;
            return (
              <div
                key={tpl.id}
                className={`flex flex-col justify-between rounded-xl border p-5 transition-all ${
                  isSelected
                    ? 'border-sky-500 bg-slate-900 shadow-lg shadow-sky-500/10'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                      {tpl.templateCategory?.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {tpl.durationSeconds}s · {tpl.fps} FPS
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <button
                    onClick={() => {
                      onSelectProject(tpl);
                      onNavigate('preview');
                    }}
                    className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-sky-500 text-white'
                        : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>{isSelected ? 'Currently Loaded' : 'Load & Preview'}</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectProject(tpl);
                      onNavigate('export');
                    }}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-400 font-medium transition-colors"
                  >
                    <span>Export</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Android Device Native Architecture Banner */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <span>Kotlin & Jetpack Compose Native Package</span>
          </div>
          <h3 className="text-lg font-bold text-white">
            Need to build the standalone Android APK in Android Studio?
          </h3>
          <p className="text-xs text-slate-300 max-w-2xl">
            We include the complete Android Studio project with Kotlin MediaCodec hardware video encoding,
            Offscreen WebView pipeline, and Storage Access Framework MediaStore saving.
          </p>
        </div>
        <button
          onClick={() => onNavigate('android')}
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
        >
          <span>View Native Android Code & ZIP</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
