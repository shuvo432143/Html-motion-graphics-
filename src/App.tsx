/**
 * HTML Video Studio — 4K MP4 Renderer
 * Production-quality Android & Web Video Renderer App
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ActiveTab, Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PreviewView } from './components/PreviewView';
import { EditorView } from './components/EditorView';
import { ExportView } from './components/ExportView';
import { AndroidNativeView } from './components/AndroidNativeView';
import { HistoryView } from './components/HistoryView';
import { RenderProgressModal } from './components/RenderProgressModal';
import { ExportSuccessModal } from './components/ExportSuccessModal';
import {
  ExportHistoryRecord,
  ExportSettings,
  RenderJobProgress,
  RenderProject,
} from './types';
import {
  deleteExportHistoryItem,
  getActiveProjectId,
  loadExportHistory,
  loadStoredProjects,
  saveExportHistoryItem,
  saveProjects,
  setActiveProjectId,
} from './services/storageService';
import { IFrameFrameCaptureEngine } from './services/htmlRendererEngine';
import { videoExportPipeline } from './services/videoEncoder';
import { SAMPLE_PROJECTS } from './services/projectTemplates';
import JSZip from 'jszip';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [projects, setProjects] = useState<RenderProject[]>(() => loadStoredProjects());
  const [activeProjectId, setActiveId] = useState<string>(() => getActiveProjectId());
  const [history, setHistory] = useState<ExportHistoryRecord[]>(() => loadExportHistory());

  // Render State
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderProgress, setRenderProgress] = useState<RenderJobProgress | null>(null);
  const [completedRecord, setCompletedRecord] = useState<ExportHistoryRecord | null>(null);
  const [completedBlobUrl, setCompletedBlobUrl] = useState<string | null>(null);

  const captureEngineRef = useRef<IFrameFrameCaptureEngine | null>(null);

  // Active Project reference
  const currentProject =
    projects.find((p) => p.id === activeProjectId) || projects[0] || SAMPLE_PROJECTS[0];

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  useEffect(() => {
    setActiveProjectId(activeProjectId);
  }, [activeProjectId]);

  const handleSelectProject = (project: RenderProject) => {
    setActiveId(project.id);
  };

  const handleUpdateProject = (updatedFields: Partial<RenderProject>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === currentProject.id ? { ...p, ...updatedFields } : p))
    );
  };

  const handleCreateBlankProject = () => {
    const newProj: RenderProject = {
      id: 'proj_' + Date.now(),
      name: 'Untitled Animation ' + (projects.length + 1),
      description: 'Custom HTML animation project',
      htmlContent: `<div class="wrapper">\n  <h1 class="title">HELLO WORLD</h1>\n</div>`,
      cssContent: `body {\n  margin: 0;\n  background: #020617;\n  color: #fff;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  height: 100vh;\n  font-family: sans-serif;\n}\n.title {\n  font-size: 48px;\n  color: #38bdf8;\n  animation: pulse 2s infinite ease-in-out;\n}\n@keyframes pulse {\n  0%, 100% { transform: scale(1); opacity: 0.8; }\n  50% { transform: scale(1.1); opacity: 1; }\n}`,
      jsContent: `// JavaScript logic here`,
      assets: [],
      durationSeconds: 5,
      fps: 30,
      resolutionId: '1080p_16_9',
      aspectRatio: '16:9',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProjects([newProj, ...projects]);
    setActiveId(newProj.id);
    setActiveTab('editor');
  };

  const handleImportHtml = async (file: File) => {
    try {
      const text = await file.text();
      const projName = file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

      // Parse HTML
      let html = text;
      let css = '';
      let js = '';

      const styleMatches = text.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
      if (styleMatches) {
        css = styleMatches.map((m) => m.replace(/<style[^>]*>|<\/style>/gi, '')).join('\n');
      }

      const scriptMatches = text.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
      if (scriptMatches) {
        js = scriptMatches
          .filter((m) => !m.includes('src='))
          .map((m) => m.replace(/<script[^>]*>|<\/script>/gi, ''))
          .join('\n');
      }

      const importedProject: RenderProject = {
        id: 'import_' + Date.now(),
        name: projName,
        description: `Imported from ${file.name}`,
        htmlContent: html,
        cssContent: css,
        jsContent: js,
        assets: [],
        durationSeconds: 10,
        fps: 30,
        resolutionId: '1080p_16_9',
        aspectRatio: '16:9',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setProjects([importedProject, ...projects]);
      setActiveId(importedProject.id);
      setActiveTab('preview');
    } catch (e) {
      console.error('Failed to import HTML:', e);
      alert('Could not parse the selected HTML file.');
    }
  };

  const handleImportZip = async (file: File) => {
    try {
      const zip = await JSZip.loadAsync(file);
      let html = '';
      let css = '';
      let js = '';
      const assets: any[] = [];

      for (const [filename, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue;
        const lower = filename.toLowerCase();
        if (lower.endsWith('.html') || lower.endsWith('.htm')) {
          if (!html) html = await zipEntry.async('string');
        } else if (lower.endsWith('.css')) {
          css += (await zipEntry.async('string')) + '\n';
        } else if (lower.endsWith('.js')) {
          js += (await zipEntry.async('string')) + '\n';
        } else if (
          lower.endsWith('.png') ||
          lower.endsWith('.jpg') ||
          lower.endsWith('.jpeg') ||
          lower.endsWith('.svg') ||
          lower.endsWith('.webp')
        ) {
          const base64 = await zipEntry.async('base64');
          const ext = lower.split('.').pop();
          const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
          assets.push({
            id: 'asset_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
            name: filename.split('/').pop() || filename,
            type: 'image',
            dataUrl: `data:${mime};base64,${base64}`,
            sizeBytes: base64.length,
          });
        }
      }

      const importedProject: RenderProject = {
        id: 'zip_' + Date.now(),
        name: file.name.replace(/\.zip$/i, ''),
        description: `Imported from ZIP archive ${file.name}`,
        htmlContent: html || '<div>No index.html found</div>',
        cssContent: css,
        jsContent: js,
        assets,
        durationSeconds: 10,
        fps: 30,
        resolutionId: '1080p_16_9',
        aspectRatio: '16:9',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setProjects([importedProject, ...projects]);
      setActiveId(importedProject.id);
      setActiveTab('preview');
    } catch (e) {
      console.error('Failed to import ZIP:', e);
      alert('Could not extract ZIP project.');
    }
  };

  const handleStartExport = async (settings: ExportSettings) => {
    setIsRendering(true);

    const engine = new IFrameFrameCaptureEngine();
    captureEngineRef.current = engine;

    try {
      await engine.init(
        currentProject.htmlContent,
        currentProject.cssContent,
        currentProject.jsContent,
        settings.resolution.width,
        settings.resolution.height,
        settings.fps
      );

      const result = await videoExportPipeline.renderFramesToMp4(
        async (timeMs, frameIndex) => {
          return await engine.captureFrame(timeMs, frameIndex);
        },
        settings,
        (progress) => {
          setRenderProgress(progress);
        }
      );

      const record: ExportHistoryRecord = {
        id: 'export_' + Date.now(),
        projectName: currentProject.name,
        filename: settings.filename,
        resolution: settings.resolution.name,
        dimensions: { width: settings.resolution.width, height: settings.resolution.height },
        fps: settings.fps,
        durationSeconds: settings.durationSeconds,
        fileSizeBytes: result.fileSizeBytes,
        completedAt: Date.now(),
        blobUrl: URL.createObjectURL(result.blob),
      };

      saveExportHistoryItem(record);
      setHistory(loadExportHistory());

      setCompletedRecord(record);
      setCompletedBlobUrl(record.blobUrl || null);
    } catch (err: any) {
      console.error('Export error:', err);
      if (err.message !== 'Export cancelled by user') {
        alert('Render failed: ' + (err.message || String(err)));
      }
    } finally {
      setIsRendering(false);
      setRenderProgress(null);
      if (captureEngineRef.current) {
        captureEngineRef.current.destroy();
        captureEngineRef.current = null;
      }
    }
  };

  const handleCancelRender = () => {
    videoExportPipeline.cancel();
    if (captureEngineRef.current) {
      captureEngineRef.current.destroy();
      captureEngineRef.current = null;
    }
    setIsRendering(false);
    setRenderProgress(null);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteExportHistoryItem(id);
    setHistory(updated);
  };

  const handleClearHistory = () => {
    localStorage.removeItem('hvs_export_history_v1');
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-white">
      {/* Top Bar Contract compliant Navigation */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        projectName={currentProject.name}
        onNewProject={handleCreateBlankProject}
        onTriggerExport={() => setActiveTab('export')}
      />

      {/* Main View Container */}
      <main className="flex-1 pb-16">
        {activeTab === 'dashboard' && (
          <DashboardView
            currentProject={currentProject}
            projects={projects}
            onSelectProject={handleSelectProject}
            onNavigate={setActiveTab}
            onImportHtml={handleImportHtml}
            onImportZip={handleImportZip}
            onCreateBlank={handleCreateBlankProject}
          />
        )}

        {activeTab === 'preview' && (
          <PreviewView
            project={currentProject}
            onNavigateToExport={() => setActiveTab('export')}
            onNavigateToEditor={() => setActiveTab('editor')}
          />
        )}

        {activeTab === 'editor' && (
          <EditorView
            project={currentProject}
            onUpdateProject={handleUpdateProject}
            onNavigateToPreview={() => setActiveTab('preview')}
          />
        )}

        {activeTab === 'export' && (
          <ExportView
            project={currentProject}
            onStartExport={handleStartExport}
            onNavigateToPreview={() => setActiveTab('preview')}
          />
        )}

        {activeTab === 'android' && <AndroidNativeView />}

        {activeTab === 'history' && (
          <HistoryView
            history={history}
            onDeleteHistoryItem={handleDeleteHistoryItem}
            onClearAll={handleClearHistory}
          />
        )}
      </main>

      {/* Render Progress Modal */}
      {isRendering && renderProgress && (
        <RenderProgressModal
          progress={renderProgress}
          onCancel={handleCancelRender}
        />
      )}

      {/* Export Success Modal */}
      {completedRecord && completedBlobUrl && (
        <ExportSuccessModal
          record={completedRecord}
          videoBlobUrl={completedBlobUrl}
          onClose={() => {
            setCompletedRecord(null);
            setCompletedBlobUrl(null);
          }}
          onRenderAgain={() => {
            setCompletedRecord(null);
            setCompletedBlobUrl(null);
            setActiveTab('export');
          }}
        />
      )}
    </div>
  );
}
