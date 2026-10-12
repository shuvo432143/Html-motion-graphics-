import { buildRenderableHtml } from './deterministicTimeline';

export interface FrameCaptureEngine {
  init(html: string, css: string, js: string, width: number, height: number, fps: number): Promise<void>;
  captureFrame(timeMs: number, frameIndex: number): Promise<HTMLCanvasElement | ImageBitmap>;
  destroy(): void;
}

export class IFrameFrameCaptureEngine implements FrameCaptureEngine {
  private iframe: HTMLIFrameElement | null = null;
  private offscreenContainer: HTMLDivElement | null = null;
  private width: number = 1920;
  private height: number = 1080;
  private fps: number = 30;
  private renderCanvas: HTMLCanvasElement | null = null;
  private renderCtx: CanvasRenderingContext2D | null = null;

  async init(
    html: string,
    css: string,
    js: string,
    width: number,
    height: number,
    fps: number
  ): Promise<void> {
    this.width = width;
    this.height = height;
    this.fps = fps;

    this.destroy();

    // Create offscreen container
    this.offscreenContainer = document.createElement('div');
    this.offscreenContainer.style.position = 'fixed';
    this.offscreenContainer.style.left = '-99999px';
    this.offscreenContainer.style.top = '-99999px';
    this.offscreenContainer.style.width = `${width}px`;
    this.offscreenContainer.style.height = `${height}px`;
    this.offscreenContainer.style.overflow = 'hidden';
    this.offscreenContainer.style.pointerEvents = 'none';
    this.offscreenContainer.style.zIndex = '-9999';
    document.body.appendChild(this.offscreenContainer);

    this.iframe = document.createElement('iframe');
    this.iframe.width = `${width}px`;
    this.iframe.height = `${height}px`;
    this.iframe.style.width = `${width}px`;
    this.iframe.style.height = `${height}px`;
    this.iframe.style.border = 'none';
    this.iframe.style.display = 'block';
    this.offscreenContainer.appendChild(this.iframe);

    this.renderCanvas = document.createElement('canvas');
    this.renderCanvas.width = width;
    this.renderCanvas.height = height;
    this.renderCtx = this.renderCanvas.getContext('2d', { willReadFrequently: true });

    const fullHtml = buildRenderableHtml(html, css, js, true, fps);

    // Wait for iframe load
    await new Promise<void>((resolve) => {
      if (!this.iframe) return resolve();
      this.iframe.onload = () => {
        // Small delay to ensure WebGL/Canvas context is fully ready
        setTimeout(resolve, 150);
      };
      this.iframe.srcdoc = fullHtml;
    });

    // Give iframe a moment to execute initial scripts
    await new Promise((r) => setTimeout(r, 100));
  }

  async captureFrame(timeMs: number, frameIndex: number): Promise<HTMLCanvasElement | ImageBitmap> {
    if (!this.iframe || !this.iframe.contentWindow) {
      throw new Error('Capture iframe not initialized');
    }

    const win = this.iframe.contentWindow as any;
    const doc = this.iframe.contentDocument;

    // 1. Advance deterministic clock inside iframe
    if (win.__HTML_VIDEO_STUDIO__ && typeof win.__HTML_VIDEO_STUDIO__.stepTo === 'function') {
      win.__HTML_VIDEO_STUDIO__.stepTo(timeMs, frameIndex);
    }

    // 2. Locate any canvas in the document
    const stageCanvas = doc ? doc.querySelector('canvas') : null;

    if (stageCanvas && stageCanvas.width > 0 && stageCanvas.height > 0) {
      // If the stage canvas has matching or native resolution, grab it directly!
      try {
        if ('createImageBitmap' in window) {
          const bmp = await createImageBitmap(stageCanvas);
          return bmp;
        }
      } catch (err) {
        // Fallback to 2D context copy
      }

      if (this.renderCtx && this.renderCanvas) {
        this.renderCtx.clearRect(0, 0, this.width, this.height);
        this.renderCtx.drawImage(stageCanvas, 0, 0, this.width, this.height);
        return this.renderCanvas;
      }
    }

    // 3. Fallback: Draw through canvas or html2canvas proxy
    if (this.renderCtx && this.renderCanvas) {
      // Draw background and placeholder
      this.renderCtx.fillStyle = '#0f172a';
      this.renderCtx.fillRect(0, 0, this.width, this.height);
      this.renderCtx.fillStyle = '#ffffff';
      this.renderCtx.font = '32px sans-serif';
      this.renderCtx.fillText(`Frame ${frameIndex} (${Math.round(timeMs)}ms)`, 40, 60);
      return this.renderCanvas;
    }

    throw new Error('Unable to capture frame bitmap');
  }

  destroy(): void {
    if (this.iframe && this.offscreenContainer) {
      this.iframe.srcdoc = 'about:blank';
      this.offscreenContainer.remove();
      this.iframe = null;
      this.offscreenContainer = null;
    }
    this.renderCanvas = null;
    this.renderCtx = null;
  }
}
