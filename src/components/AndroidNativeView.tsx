import React, { useState } from 'react';
import { Download, FileCode, CheckCircle2, Cpu, Smartphone, BookOpen, Copy, Check } from 'lucide-react';
import { ANDROID_STUDIO_SOURCE_FILES, createAndroidProjectZip } from '../services/androidProjectGenerator';

export const AndroidNativeView: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(4); // MainActivity.kt or HtmlVideoRenderer.kt
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const currentFile = ANDROID_STUDIO_SOURCE_FILES[selectedFileIndex] || ANDROID_STUDIO_SOURCE_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zipBlob = await createAndroidProjectZip();
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'HtmlVideoStudio_Android_Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to create ZIP:', e);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title & Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 tracking-wider uppercase mb-1">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Native Android Studio Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Kotlin · MediaCodec · Jetpack Compose Project
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Complete, compilable Android Studio native source code for offscreen WebView deterministic
            frame capture, hardware H.264 MediaCodec encoding, and MediaStore video saving.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-emerald-600/25 shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>{isZipping ? 'Generating ZIP...' : 'Download Project (.ZIP)'}</span>
        </button>
      </div>

      {/* Android Device Hardware Compatibility Matrix */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-sky-400" />
          <span>Android Hardware SoC Compatibility Matrix</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
            <span className="font-bold text-white block">Snapdragon 8 Gen 2 / 3</span>
            <span className="text-emerald-400 font-semibold block">4K UHD @ 60 FPS</span>
            <p className="text-slate-400 text-[11px]">
              Hardware AVC/HEVC MediaCodec encoding up to Level 5.2. Smooth 4K WebGL rendering.
            </p>
          </div>
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
            <span className="font-bold text-white block">Google Tensor G3 / G4</span>
            <span className="text-emerald-400 font-semibold block">4K UHD @ 30 FPS</span>
            <p className="text-slate-400 text-[11px]">
              Reliable MediaCodec hardware encoder. Optimal with deterministic timeline stepping.
            </p>
          </div>
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
            <span className="font-bold text-white block">MediaTek Dimensity 9200+</span>
            <span className="text-emerald-400 font-semibold block">4K UHD @ 30-60 FPS</span>
            <p className="text-slate-400 text-[11px]">
              Mali-G715 / Immortalis GPU support. Fast offscreen WebView surface capture.
            </p>
          </div>
          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
            <span className="font-bold text-white block">Midrange (Snapdragon 6/7)</span>
            <span className="text-sky-400 font-semibold block">1080p Full HD @ 30 FPS</span>
            <p className="text-slate-400 text-[11px]">
              Recommended for 1080p and 720p exports. Memory bounded under 4GB device RAM.
            </p>
          </div>
        </div>
      </div>

      {/* Code Browser */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row min-h-[500px]">
        {/* File tree sidebar */}
        <div className="w-full md:w-72 bg-slate-950/90 border-r border-slate-800 p-4 space-y-2 shrink-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block px-2 mb-2">
            Project Files
          </span>
          {ANDROID_STUDIO_SOURCE_FILES.map((file, idx) => (
            <button
              key={file.path}
              onClick={() => setSelectedFileIndex(idx)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors truncate block ${
                selectedFileIndex === idx
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/80'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {file.path.split('/').pop()}
            </button>
          ))}
        </div>

        {/* Code Content */}
        <div className="flex-1 flex flex-col bg-slate-950">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900/40">
            <span className="text-xs font-mono text-slate-300 font-semibold">
              {currentFile.path}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <pre className="flex-1 p-5 text-slate-200 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre selection:bg-emerald-500/30">
            {currentFile.content}
          </pre>
        </div>
      </div>
    </div>
  );
};
