import React from 'react';
import { Film, Code, Play, Download, Smartphone, History, Plus } from 'lucide-react';

export type ActiveTab = 'dashboard' | 'editor' | 'preview' | 'export' | 'android' | 'history';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  projectName: string;
  onNewProject: () => void;
  onTriggerExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  projectName,
  onNewProject,
  onTriggerExport,
}) => {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 md:gap-8 px-4 md:px-8 py-3.5 bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-md">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onTabChange('dashboard')}
          className="flex items-center gap-2.5 text-left group"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 group-hover:bg-sky-500/30 transition-colors">
            <Film className="w-4 h-4" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap block">
              HTML Video Studio
            </span>
          </div>
        </button>
        <span className="hidden sm:inline-block text-xs font-semibold text-sky-400/90 border border-sky-400/30 px-2 py-0.5 rounded tracking-wider">
          4K MP4
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="flex items-center gap-1 md:gap-4 text-xs md:text-sm font-medium text-slate-400 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => onTabChange('dashboard')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'dashboard'
              ? 'text-white bg-slate-800/80'
              : 'hover:text-slate-200'
          }`}
        >
          <span>Studio</span>
        </button>
        <button
          onClick={() => onTabChange('preview')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'preview'
              ? 'text-white bg-slate-800/80'
              : 'hover:text-slate-200'
          }`}
        >
          <Play className="w-3.5 h-3.5 text-sky-400" />
          <span>Preview</span>
        </button>
        <button
          onClick={() => onTabChange('editor')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'editor'
              ? 'text-white bg-slate-800/80'
              : 'hover:text-slate-200'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Editor</span>
        </button>
        <button
          onClick={() => onTabChange('export')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'export'
              ? 'text-white bg-slate-800/80'
              : 'hover:text-slate-200'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export 4K</span>
        </button>
        <button
          onClick={() => onTabChange('android')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'android'
              ? 'text-white bg-slate-800/80'
              : 'hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
          <span>Android Native</span>
        </button>
        <button
          onClick={() => onTabChange('history')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap transition-colors ${
            activeTab === 'history'
              ? 'text-white bg-slate-800/80'
              : 'hover:text-slate-200'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>History</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onNewProject}
          title="Create New Blank Project"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
        <button
          onClick={onTriggerExport}
          className="flex items-center gap-2 px-3.5 md:px-4 py-2 text-xs md:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-sky-600/30"
        >
          <Film className="w-4 h-4" />
          <span>Render MP4</span>
        </button>
      </div>
    </header>
  );
};
