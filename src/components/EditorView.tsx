import React, { useState } from 'react';
import { Code, FileCode, Palette, Zap, Sparkles, Download, Upload, AlertCircle, Check, Plus, Trash2 } from 'lucide-react';
import { ProjectAsset, RenderProject } from '../types';

interface EditorViewProps {
  project: RenderProject;
  onUpdateProject: (updated: Partial<RenderProject>) => void;
  onNavigateToPreview: () => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  project,
  onUpdateProject,
  onNavigateToPreview,
}) => {
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js' | 'assets'>('html');
  const [htmlCode, setHtmlCode] = useState(project.htmlContent);
  const [cssCode, setCssCode] = useState(project.cssContent);
  const [jsCode, setJsCode] = useState(project.jsContent);
  const [projectName, setProjectName] = useState(project.name);
  const [duration, setDuration] = useState(project.durationSeconds);
  const [fps, setFps] = useState(project.fps);
  const [hasSaved, setHasSaved] = useState(false);

  const handleSave = () => {
    onUpdateProject({
      name: projectName,
      htmlContent: htmlCode,
      cssContent: cssCode,
      jsContent: jsCode,
      durationSeconds: duration,
      fps: fps,
      updatedAt: Date.now(),
    });
    setHasSaved(true);
    setTimeout(() => setHasSaved(false), 2000);
  };

  const handleInsertDeterministicHook = () => {
    const hookSnippet = `\n// HTML Video Studio Deterministic Render Hook\nwindow.addEventListener('htmlVideoStudioTick', function(e) {\n  var timeMs = e.detail.timeMs;\n  var frame = e.detail.frame;\n  // Advance custom animation or Three.js renderer here:\n  // renderScene(timeMs);\n});\n`;
    setJsCode((prev) => prev + hookSnippet);
  };

  const handleExportHtmlFile = () => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${projectName}</title>
  <style>
${cssCode}
  </style>
</head>
<body>
${htmlCode}
  <script>
${jsCode}
  </script>
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const newAsset: ProjectAsset = {
          id: 'asset_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'font',
          dataUrl,
          sizeBytes: file.size,
        };
        const updatedAssets = [...(project.assets || []), newAsset];
        onUpdateProject({ assets: updatedAssets });
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleDeleteAsset = (id: string) => {
    const updated = (project.assets || []).filter((a) => a.id !== id);
    onUpdateProject({ assets: updated });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Settings */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="text-xl font-bold text-white bg-transparent border-b border-transparent hover:border-slate-700 focus:border-sky-500 focus:outline-none px-1 py-0.5 rounded"
          />
          <p className="text-xs text-slate-400">
            Integrated code editor with deterministic timeline hooks and multi-asset bundling
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
            <span className="text-slate-400">Duration:</span>
            <input
              type="number"
              min={1}
              max={600}
              value={duration}
              onChange={(e) => setDuration(Math.max(1, Number(e.target.value)))}
              className="w-12 bg-slate-800 text-white text-center rounded px-1 py-0.5 font-mono focus:outline-none"
            />
            <span className="text-slate-400">s</span>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
            <span className="text-slate-400">FPS:</span>
            <select
              value={fps}
              onChange={(e) => setFps(Number(e.target.value) as any)}
              className="bg-slate-800 text-white rounded px-2 py-0.5 font-mono focus:outline-none"
            >
              <option value={24}>24</option>
              <option value={30}>30</option>
              <option value={60}>60</option>
            </select>
          </div>

          <button
            onClick={handleExportHtmlFile}
            title="Download Standalone HTML"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-xs transition-colors shadow-sm ${
              hasSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-sky-600 hover:bg-sky-500 text-white'
            }`}
          >
            {hasSaved ? <Check className="w-4 h-4" /> : <Code className="w-4 h-4" />}
            <span>{hasSaved ? 'Saved!' : 'Save Code'}</span>
          </button>
        </div>
      </div>

      {/* Editor Main Section */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Editor Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5 bg-slate-950/70">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('html')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'html'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>HTML Document</span>
            </button>
            <button
              onClick={() => setActiveTab('css')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'css'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
              <span>CSS Stylesheet</span>
            </button>
            <button
              onClick={() => setActiveTab('js')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'js'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>JavaScript Logic</span>
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'assets'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <span>Supporting Assets ({project.assets?.length || 0})</span>
            </button>
          </div>

          {activeTab === 'js' && (
            <button
              onClick={handleInsertDeterministicHook}
              className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium px-2 py-1 rounded bg-sky-950/60 border border-sky-800/60 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Insert Deterministic Tick Hook</span>
            </button>
          )}
        </div>

        {/* Code Inputs */}
        <div className="p-4 sm:p-6 bg-slate-950 min-h-[440px]">
          {activeTab === 'html' && (
            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              placeholder="Paste or write HTML markup here..."
              className="w-full h-[440px] bg-transparent text-slate-100 font-mono text-sm leading-relaxed p-2 focus:outline-none resize-none selection:bg-sky-500/30"
              spellCheck={false}
            />
          )}

          {activeTab === 'css' && (
            <textarea
              value={cssCode}
              onChange={(e) => setCssCode(e.target.value)}
              placeholder="Paste or write CSS rules and @keyframes here..."
              className="w-full h-[440px] bg-transparent text-slate-100 font-mono text-sm leading-relaxed p-2 focus:outline-none resize-none selection:bg-sky-500/30"
              spellCheck={false}
            />
          )}

          {activeTab === 'js' && (
            <textarea
              value={jsCode}
              onChange={(e) => setJsCode(e.target.value)}
              placeholder="Paste or write JavaScript, Canvas, or Three.js code here..."
              className="w-full h-[440px] bg-transparent text-slate-100 font-mono text-sm leading-relaxed p-2 focus:outline-none resize-none selection:bg-sky-500/30"
              spellCheck={false}
            />
          )}

          {activeTab === 'assets' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Project Local Assets</h3>
                  <p className="text-xs text-slate-400">
                    Images, logos, fonts, or audio files bundled directly into the HTML renderer
                  </p>
                </div>
                <label className="flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-sm">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Asset</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleAssetUpload}
                  />
                </label>
              </div>

              {(!project.assets || project.assets.length === 0) ? (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl">
                  <p className="text-xs text-slate-500">
                    No local assets uploaded yet. Upload images to reference them in your HTML.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {project.assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="truncate">
                        <span className="text-xs font-semibold text-white block truncate">
                          {asset.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {Math.round(asset.sizeBytes / 1024)} KB · {asset.type}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteAsset(asset.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete Asset"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Helper */}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-sky-400" />
          <span>Animations automatically synchronize with our deterministic clock during MP4 export.</span>
        </div>
        <button
          onClick={onNavigateToPreview}
          className="text-sky-400 hover:text-sky-300 font-semibold underline"
        >
          Preview with Saved Changes →
        </button>
      </div>
    </div>
  );
};
