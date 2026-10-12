import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { ExportSettings, RenderJobProgress } from '../types';

export interface FrameCaptureSource {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export class VideoExportPipeline {
  private isCancelled: boolean = false;

  public cancel() {
    this.isCancelled = true;
  }

  public async renderFramesToMp4(
    captureFrameAtTime: (timeMs: number, frameIndex: number) => Promise<HTMLCanvasElement | ImageBitmap>,
    settings: ExportSettings,
    onProgress: (progress: RenderJobProgress) => void
  ): Promise<{ blob: Blob; fileSizeBytes: number }> {
    this.isCancelled = false;
    const width = settings.resolution.width;
    const height = settings.resolution.height;
    const fps = settings.fps;
    const duration = settings.durationSeconds;
    const totalFrames = Math.max(1, Math.round(duration * fps));
    const bitrate = Math.round(settings.bitrateMbps * 1_000_000);

    const startTime = performance.now();

    onProgress({
      status: 'preparing',
      currentFrame: 0,
      totalFrames,
      percent: 0,
      currentFps: 0,
      timeElapsedMs: 0,
      estimatedRemainingMs: 0,
      activeStepText: 'Initializing H.264 MP4 encoder and allocation buffers...',
    });

    const isWebCodecsSupported =
      typeof window !== 'undefined' &&
      typeof (window as any).VideoEncoder !== 'undefined' &&
      typeof (window as any).VideoFrame !== 'undefined';

    if (isWebCodecsSupported) {
      return this.encodeWithWebCodecs(
        captureFrameAtTime,
        settings,
        width,
        height,
        fps,
        totalFrames,
        bitrate,
        startTime,
        onProgress
      );
    } else {
      console.warn('[HTML Video Studio] WebCodecs not detected. Falling back to MediaRecorder MP4 pipeline.');
      return this.encodeWithMediaRecorderFallback(
        captureFrameAtTime,
        settings,
        width,
        height,
        fps,
        totalFrames,
        startTime,
        onProgress
      );
    }
  }

  private async encodeWithWebCodecs(
    captureFrameAtTime: (timeMs: number, frameIndex: number) => Promise<HTMLCanvasElement | ImageBitmap>,
    settings: ExportSettings,
    width: number,
    height: number,
    fps: number,
    totalFrames: number,
    bitrate: number,
    startTime: number,
    onProgress: (progress: RenderJobProgress) => void
  ): Promise<{ blob: Blob; fileSizeBytes: number }> {
    // 1. Initialize MP4 Muxer
    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: {
        codec: 'avc',
        width,
        height,
      },
      fastStart: 'in-memory',
    });

    // Determine AVC profile string based on resolution
    // Main profile (avc1.4d002a for 1080p), High profile (avc1.640033 for 1440p/4K)
    let avcCodec = 'avc1.4d002a';
    if (width >= 2560 || height >= 1440) {
      avcCodec = 'avc1.640033'; // High Profile Level 5.1
    } else if (width <= 1280 && height <= 720) {
      avcCodec = 'avc1.42001f'; // Baseline
    }

    let encoderError: Error | null = null;

    const encoder = new (window as any).VideoEncoder({
      output: (chunk: any, meta: any) => {
        try {
          muxer.addVideoChunk(chunk, meta);
        } catch (err) {
          console.error('[HTML Video Studio] Error adding video chunk:', err);
        }
      },
      error: (e: any) => {
        console.error('[HTML Video Studio] VideoEncoder error:', e);
        encoderError = new Error(e.message || 'Hardware VideoEncoder error occurred');
      },
    });

    try {
      encoder.configure({
        codec: avcCodec,
        width,
        height,
        bitrate,
        framerate: fps,
        hardwareAcceleration: 'prefer-hardware',
      });
    } catch (err) {
      console.warn('[HTML Video Studio] Hardware acceleration config failed, falling back to basic profile:', err);
      encoder.configure({
        codec: 'avc1.42001e',
        width,
        height,
        bitrate: Math.min(bitrate, 15_000_000),
        framerate: fps,
      });
    }

    const frameDurationMicrosec = Math.round(1_000_000 / fps);
    const keyFrameInterval = Math.round(fps * 2); // Keyframe every 2 seconds

    let lastProgressUpdate = performance.now();
    let sampleThumbnail: string | undefined;

    // 2. Render and encode frame by frame with strict bounded memory
    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (this.isCancelled) {
        encoder.close();
        throw new Error('Export cancelled by user');
      }

      if (encoderError) {
        throw encoderError;
      }

      const frameTimeMs = (frameIndex / fps) * 1000;

      // Capture frame from render engine
      const frameSource = await captureFrameAtTime(frameTimeMs, frameIndex);

      // Extract a thumbnail periodically for progress visual feedback
      if (frameIndex === 0 || frameIndex % Math.round(fps * 2) === 0) {
        if (frameSource instanceof HTMLCanvasElement) {
          try {
            sampleThumbnail = frameSource.toDataURL('image/jpeg', 0.6);
          } catch (e) {}
        }
      }

      const timestampMicrosec = Math.round((frameIndex / fps) * 1_000_000);
      const isKeyFrame = frameIndex % keyFrameInterval === 0;

      // Create VideoFrame
      const videoFrame = new (window as any).VideoFrame(frameSource, {
        timestamp: timestampMicrosec,
        duration: frameDurationMicrosec,
      });

      // Encode frame
      encoder.encode(videoFrame, { keyFrame: isKeyFrame });

      // CRITICAL MEMORY STEP: Close VideoFrame and close ImageBitmap immediately
      videoFrame.close();
      if ('close' in frameSource && typeof (frameSource as any).close === 'function') {
        (frameSource as any).close();
      }

      // Memory backpressure protection: If encoder queue piles up, yield briefly
      if (encoder.encodeQueueSize > 4) {
        await new Promise((r) => setTimeout(r, 8));
      }

      const now = performance.now();
      if (now - lastProgressUpdate > 100 || frameIndex === totalFrames - 1) {
        lastProgressUpdate = now;
        const elapsedSec = (now - startTime) / 1000;
        const currentFps = elapsedSec > 0 ? (frameIndex + 1) / elapsedSec : 0;
        const remainingFrames = totalFrames - (frameIndex + 1);
        const estimatedRemainingMs = currentFps > 0 ? (remainingFrames / currentFps) * 1000 : 0;
        const percent = Math.round(((frameIndex + 1) / totalFrames) * 90); // 0-90% for rendering

        onProgress({
          status: 'rendering',
          currentFrame: frameIndex + 1,
          totalFrames,
          percent,
          currentFps: Math.round(currentFps * 10) / 10,
          timeElapsedMs: Math.round(now - startTime),
          estimatedRemainingMs: Math.round(estimatedRemainingMs),
          currentThumbnail: sampleThumbnail,
          activeStepText: `Rendering frame ${frameIndex + 1} of ${totalFrames} (${Math.round(currentFps)} FPS)`,
        });
      }
    }

    // 3. Flush encoder
    onProgress({
      status: 'encoding',
      currentFrame: totalFrames,
      totalFrames,
      percent: 92,
      currentFps: 0,
      timeElapsedMs: Math.round(performance.now() - startTime),
      estimatedRemainingMs: 1500,
      currentThumbnail: sampleThumbnail,
      activeStepText: 'Flushing H.264 macroblock bitstream...',
    });

    await encoder.flush();
    encoder.close();

    // 4. Finalize MP4 Container
    onProgress({
      status: 'muxing',
      currentFrame: totalFrames,
      totalFrames,
      percent: 96,
      currentFps: 0,
      timeElapsedMs: Math.round(performance.now() - startTime),
      estimatedRemainingMs: 500,
      currentThumbnail: sampleThumbnail,
      activeStepText: 'Muxing MP4 ISO container and moov atom...',
    });

    muxer.finalize();
    const buffer = muxer.target.buffer;
    const blob = new Blob([buffer], { type: 'video/mp4' });

    onProgress({
      status: 'completed',
      currentFrame: totalFrames,
      totalFrames,
      percent: 100,
      currentFps: 0,
      timeElapsedMs: Math.round(performance.now() - startTime),
      estimatedRemainingMs: 0,
      currentThumbnail: sampleThumbnail,
      activeStepText: 'Export completed successfully!',
      renderedBlob: blob,
      renderedBlobUrl: URL.createObjectURL(blob),
      fileSizeBytes: blob.size,
    });

    return { blob, fileSizeBytes: blob.size };
  }

  private async encodeWithMediaRecorderFallback(
    captureFrameAtTime: (timeMs: number, frameIndex: number) => Promise<HTMLCanvasElement | ImageBitmap>,
    settings: ExportSettings,
    width: number,
    height: number,
    fps: number,
    totalFrames: number,
    startTime: number,
    onProgress: (progress: RenderJobProgress) => void
  ): Promise<{ blob: Blob; fileSizeBytes: number }> {
    // Canvas stream fallback with high bitrate
    const offscreen = document.createElement('canvas');
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    const stream = offscreen.captureStream(fps);
    const mimeTypes = [
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=h264',
      'video/webm;codecs=vp9',
      'video/webm',
    ];
    let selectedMime = '';
    for (const m of mimeTypes) {
      if (MediaRecorder.isTypeSupported(m)) {
        selectedMime = m;
        break;
      }
    }

    const recordedChunks: Blob[] = [];
    const recorder = new MediaRecorder(stream, {
      mimeType: selectedMime || undefined,
      videoBitsPerSecond: Math.round(settings.bitrateMbps * 1_000_000),
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    recorder.start(100);

    const frameDurationMs = 1000 / fps;
    let sampleThumbnail: string | undefined;

    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
      if (this.isCancelled) {
        recorder.stop();
        throw new Error('Export cancelled by user');
      }

      const frameTimeMs = (frameIndex / fps) * 1000;
      const frameSource = await captureFrameAtTime(frameTimeMs, frameIndex);

      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(frameSource as any, 0, 0, width, height);

      if (frameIndex === 0) {
        sampleThumbnail = offscreen.toDataURL('image/jpeg', 0.6);
      }

      // Yield frame duration to allow recorder to capture frame
      await new Promise((r) => setTimeout(r, Math.min(30, frameDurationMs)));

      const now = performance.now();
      const elapsedSec = (now - startTime) / 1000;
      const currentFps = elapsedSec > 0 ? (frameIndex + 1) / elapsedSec : 0;
      const remainingFrames = totalFrames - (frameIndex + 1);

      onProgress({
        status: 'rendering',
        currentFrame: frameIndex + 1,
        totalFrames,
        percent: Math.round(((frameIndex + 1) / totalFrames) * 90),
        currentFps: Math.round(currentFps * 10) / 10,
        timeElapsedMs: Math.round(now - startTime),
        estimatedRemainingMs: Math.round(currentFps > 0 ? (remainingFrames / currentFps) * 1000 : 0),
        currentThumbnail: sampleThumbnail,
        activeStepText: `Rendering frame ${frameIndex + 1} of ${totalFrames} (Fallback recorder)`,
      });
    }

    return new Promise((resolve, reject) => {
      recorder.onstop = () => {
        const finalBlob = new Blob(recordedChunks, { type: selectedMime || 'video/mp4' });
        onProgress({
          status: 'completed',
          currentFrame: totalFrames,
          totalFrames,
          percent: 100,
          currentFps: 0,
          timeElapsedMs: Math.round(performance.now() - startTime),
          estimatedRemainingMs: 0,
          activeStepText: 'Export completed!',
          renderedBlob: finalBlob,
          renderedBlobUrl: URL.createObjectURL(finalBlob),
          fileSizeBytes: finalBlob.size,
        });
        resolve({ blob: finalBlob, fileSizeBytes: finalBlob.size });
      };
      recorder.onerror = (e) => reject(new Error('MediaRecorder error: ' + String(e)));
      recorder.stop();
    });
  }
}

export const videoExportPipeline = new VideoExportPipeline();
