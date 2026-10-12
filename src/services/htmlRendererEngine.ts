import html2canvas from 'html2canvas';
import { buildRenderableHtml } from './deterministicTimeline';

export interface FrameCaptureEngine {
  init(
    fullHtmlScript: string,
    width: number,
    height: number,
    fps: number,
    existingIframe?: HTMLIFrameElement | null
  ): Promise<HTMLIFrameElement>;
  captureFrame(timeMs: number, frameIndex: number): Promise<HTMLCanvasElement | ImageBitmap>;
  destroy(): void;
}

export class DirectFrameCaptureEngine implements FrameCaptureEngine {
  private iframe: HTMLIFrameElement | null = null;
  private masterCanvas: HTMLCanvasElement | null = null;
  private masterCtx: CanvasRenderingContext2D | null = null;
  private width: number = 1920;
  private height: number = 1080;
  private isExternalIframe: boolean = false;

  async init(
    fullHtmlScript: string,
    width: number,
    height: number,
    fps: number,
    existingIframe?: HTMLIFrameElement | null
  ): Promise<HTMLIFrameElement> {
    this.width = width;
    this.height = height;

    this.destroy();

    this.masterCanvas = document.createElement('canvas');
    this.masterCanvas.width = width;
    this.masterCanvas.height = height;
    this.masterCtx = this.masterCanvas.getContext('2d', { willReadFrequently: true });
    if (this.masterCtx) {
      this.masterCtx.imageSmoothingEnabled = true;
      this.masterCtx.imageSmoothingQuality = 'high';
    }

    if (existingIframe && existingIframe.contentDocument) {
      this.isExternalIframe = true;
      this.iframe = existingIframe;
      const win = existingIframe.contentWindow as any;
      if (win && win.__HTML_VIDEO_STUDIO__) {
        win.__HTML_VIDEO_STUDIO__.setControlledMode(true);
        win.__HTML_VIDEO_STUDIO_FPS__ = fps;
      }
      return this.iframe;
    }

    this.isExternalIframe = false;
    this.iframe = document.createElement('iframe');
    this.iframe.style.position = 'fixed';
    this.iframe.style.top = '0';
    this.iframe.style.left = '0';
    this.iframe.style.width = `${width}px`;
    this.iframe.style.height = `${height}px`;
    this.iframe.style.zIndex = '-999';
    this.iframe.style.opacity = '0.01';
    this.iframe.style.border = 'none';
    this.iframe.style.pointerEvents = 'none';
    document.body.appendChild(this.iframe);

    const bundledHtml = buildRenderableHtml(fullHtmlScript, '', '', true, fps);

    await new Promise<void>((resolve) => {
      if (!this.iframe) return resolve();
      this.iframe.onload = () => {
        setTimeout(resolve, 200);
      };
      this.iframe.srcdoc = bundledHtml;
    });

    if (this.iframe && this.iframe.contentWindow) {
      try {
        const win = this.iframe.contentWindow as any;
        win.dispatchEvent(new Event('resize'));
        if (win.__HTML_VIDEO_STUDIO__ && typeof win.__HTML_VIDEO_STUDIO__.stepTo === 'function') {
          win.__HTML_VIDEO_STUDIO__.stepTo(0, 0);
        }
      } catch (e) {}
    }

    await new Promise((r) => setTimeout(r, 150));
    return this.iframe!;
  }

  async captureFrame(timeMs: number, frameIndex: number): Promise<HTMLCanvasElement | ImageBitmap> {
    if (!this.iframe || !this.iframe.contentWindow) {
      throw new Error('Capture iframe not initialized');
    }

    const win = this.iframe.contentWindow as any;
    const doc = this.iframe.contentDocument;

    // 1. Advance deterministic clock
    if (win.__HTML_VIDEO_STUDIO__ && typeof win.__HTML_VIDEO_STUDIO__.stepTo === 'function') {
      win.__HTML_VIDEO_STUDIO__.stepTo(timeMs, frameIndex);
    }

    if (!doc || !this.masterCtx || !this.masterCanvas) {
      throw new Error('Render context unavailable');
    }

    this.masterCtx.clearRect(0, 0, this.width, this.height);

    // 2. Check for canvas in the document (2D, WebGL, Three.js)
    const stageCanvas = doc.querySelector('canvas') as HTMLCanvasElement | null;
    let frameDrawn = false;

    if (stageCanvas) {
      if (stageCanvas.width <= 0 || stageCanvas.height <= 0) {
        stageCanvas.width = win.innerWidth || this.width;
        stageCanvas.height = win.innerHeight || this.height;
      }

      if (typeof win.renderFrame === 'function') {
        try { win.renderFrame(timeMs); } catch (e) {}
      }

      if (stageCanvas.width > 0 && stageCanvas.height > 0) {
        try {
          this.masterCtx.drawImage(stageCanvas, 0, 0, this.width, this.height);
          frameDrawn = true;
        } catch (err) {
          console.warn('[HTML Video Studio] Canvas draw failed:', err);
        }
      }
    }

    // 3. If no canvas, capture DOM using html2canvas
    if (!frameDrawn && doc.body) {
      try {
        const domCanvas = await html2canvas(doc.body, {
          width: win.innerWidth || this.width,
          height: win.innerHeight || this.height,
          scale: this.width / (win.innerWidth || this.width),
          useCORS: true,
          logging: false,
          backgroundColor: '#000000',
        });
        this.masterCtx.drawImage(domCanvas, 0, 0, this.width, this.height);
        frameDrawn = true;
      } catch (domErr) {
        console.warn('[HTML Video Studio] html2canvas capture failed:', domErr);
      }
    }

    return this.masterCanvas;
  }

  destroy(): void {
    if (this.iframe && !this.isExternalIframe) {
      this.iframe.remove();
    }
    this.iframe = null;
    this.masterCanvas = null;
    this.masterCtx = null;
  }
}

export const directFrameCaptureEngine = new DirectFrameCaptureEngine();
