import { ExportHistoryRecord, RenderProject } from '../types';
import { SAMPLE_PROJECTS } from './projectTemplates';

const PROJECTS_KEY = 'hvs_projects_v1';
const HISTORY_KEY = 'hvs_export_history_v1';
const ACTIVE_PROJECT_ID_KEY = 'hvs_active_project_id_v1';

export function loadStoredProjects(): RenderProject[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) {
      // Seed with sample projects on first launch
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(SAMPLE_PROJECTS));
      return SAMPLE_PROJECTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SAMPLE_PROJECTS;
  } catch (e) {
    console.error('Failed to load projects from localStorage:', e);
    return SAMPLE_PROJECTS;
  }
}

export function saveProjects(projects: RenderProject[]): void {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error('Failed to save projects to localStorage:', e);
  }
}

export function getActiveProjectId(): string {
  try {
    const id = localStorage.getItem(ACTIVE_PROJECT_ID_KEY);
    return id || SAMPLE_PROJECTS[0].id;
  } catch {
    return SAMPLE_PROJECTS[0].id;
  }
}

export function setActiveProjectId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_PROJECT_ID_KEY, id);
  } catch (e) {}
}

export function loadExportHistory(): ExportHistoryRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveExportHistoryItem(item: ExportHistoryRecord): void {
  try {
    const existing = loadExportHistory();
    const updated = [item, ...existing].slice(0, 30); // Keep last 30 exports
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save export history:', e);
  }
}

export function deleteExportHistoryItem(id: string): ExportHistoryRecord[] {
  try {
    const existing = loadExportHistory();
    const filtered = existing.filter((item) => item.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
    return filtered;
  } catch {
    return [];
  }
}
