export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | 'custom';

export interface ResolutionConfig {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: AspectRatio;
  category: 'standard' | 'high' | 'ultra';
  recommendedBitrateMbps: number;
  memoryPerFrameMb: number;
  description: string;
}

export type FrameRate = 24 | 30 | 60;

export type QualityPreset = 'standard' | 'high' | 'maximum';

export interface ExportSettings {
  filename: string;
  resolution: ResolutionConfig;
  customWidth?: number;
  customHeight?: number;
  aspectRatio: AspectRatio;
  fps: FrameRate;
  customFps?: number;
  durationSeconds: number;
  startTimeSeconds: number;
  qualityPreset: QualityPreset;
  bitrateMbps: number;
  codec: 'avc' | 'hevc';
  deterministicStepping: boolean;
  saveToMediaStore: boolean;
}

export interface ProjectAsset {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'font' | 'js';
  dataUrl: string;
  sizeBytes: number;
}

export interface RenderProject {
  id: string;
  name: string;
  description: string;
  htmlContent: string;
  cssContent: string;
  jsContent: string;
  assets: ProjectAsset[];
  durationSeconds: number;
  fps: FrameRate;
  resolutionId: string;
  aspectRatio: AspectRatio;
  createdAt: number;
  updatedAt: number;
  templateCategory?: '3d_comparison' | 'threejs' | 'canvas' | 'css_motion' | 'custom';
}

export type RenderStatus =
  | 'idle'
  | 'preparing'
  | 'rendering'
  | 'encoding'
  | 'muxing'
  | 'finalizing'
  | 'completed'
  | 'error'
  | 'cancelled';

export interface RenderJobProgress {
  status: RenderStatus;
  currentFrame: number;
  totalFrames: number;
  percent: number;
  currentFps: number;
  timeElapsedMs: number;
  estimatedRemainingMs: number;
  currentThumbnail?: string;
  activeStepText: string;
  error?: string;
  renderedBlob?: Blob;
  renderedBlobUrl?: string;
  fileSizeBytes?: number;
}

export interface ExportHistoryRecord {
  id: string;
  projectName: string;
  filename: string;
  resolution: string;
  dimensions: { width: number; height: number };
  fps: number;
  durationSeconds: number;
  fileSizeBytes: number;
  completedAt: number;
  blobUrl?: string;
  downloadUrl?: string;
}
