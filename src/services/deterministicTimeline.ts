/**
 * Deterministic Timeline Stepping Injection Script
 * Injected into HTML render target iframes to force deterministic frame advancement.
 * Prevents frame drops, clock drifts, and device lag from affecting exported MP4 video.
 */

export const INJECTED_DETERMINISTIC_SCRIPT = `
(function() {
  if (window.__HTML_VIDEO_STUDIO_INITIALIZED__) return;
  window.__HTML_VIDEO_STUDIO_INITIALIZED__ = true;

  // 1. Ensure WebGL maintains drawing buffer for canvas frame capture
  try {
    var origGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, attributes) {
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
        attributes = Object.assign({}, attributes, { preserveDrawingBuffer: true });
      }
      return origGetContext.call(this, type, attributes);
    };
  } catch(e) {}

  var virtualTimeMs = 0;
  var virtualFrameIndex = 0;
  var rafCallbacks = [];
  var rafIdCounter = 1;
  var isControlledMode = false;

  window.__HTML_VIDEO_STUDIO__ = {
    getVirtualTime: function() { return virtualTimeMs; },
    getFrameIndex: function() { return virtualFrameIndex; },
    isControlled: function() { return isControlledMode; },
    setControlledMode: function(controlled) {
      isControlledMode = controlled;
    },
    detectDuration: function() {
      var maxSec = 0;
      if (document.getAnimations) {
        document.getAnimations().forEach(function(a) {
          try {
            var d = a.effect && a.effect.getTiming ? a.effect.getTiming().duration : 0;
            if (typeof d === 'number' && d > 0 && d < 3600000) {
              maxSec = Math.max(maxSec, d / 1000);
            }
          } catch(e) {}
        });
      }
      var v = document.querySelector('video');
      if (v && v.duration && !isNaN(v.duration)) {
        maxSec = Math.max(maxSec, v.duration);
      }
      return maxSec;
    },
    stepTo: function(timeMs, frameIndex) {
      virtualTimeMs = timeMs;
      virtualFrameIndex = frameIndex;

      // Advance CSS Web Animations API
      if (document.getAnimations) {
        var animations = document.getAnimations();
        for (var i = 0; i < animations.length; i++) {
          try {
            animations[i].currentTime = timeMs;
          } catch(e) {}
        }
      }

      // Dispatch Custom Event for Canvas / WebGL / Three.js
      var event = new CustomEvent('htmlVideoStudioTick', {
        detail: {
          timeMs: timeMs,
          timeSec: timeMs / 1000,
          frame: frameIndex,
          fps: window.__HTML_VIDEO_STUDIO_FPS__ || 30
        }
      });
      window.dispatchEvent(event);

      // Direct function hook if user declared window.renderFrame or window.onStudioTick
      if (typeof window.renderFrame === 'function') {
        try { window.renderFrame(timeMs); } catch(e) {}
      }
      if (typeof window.onStudioTick === 'function') {
        try { window.onStudioTick(timeMs, frameIndex); } catch(e) {}
      }

      // Execute queued requestAnimationFrame callbacks
      var currentCallbacks = rafCallbacks.slice();
      rafCallbacks = [];
      for (var j = 0; j < currentCallbacks.length; j++) {
        try {
          currentCallbacks[j].callback(timeMs);
        } catch(err) {
          console.error('[HTML Video Studio] Error in rAF callback:', err);
        }
      }

      // Update any standard HTML5 video elements if present
      var videos = document.querySelectorAll('video');
      for (var v = 0; v < videos.length; v++) {
        try {
          videos[v].currentTime = timeMs / 1000;
        } catch(e) {}
      }

      return true;
    }
  };

  // Intercept requestAnimationFrame when in controlled render mode
  var nativeRaf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function(callback) {
    if (isControlledMode) {
      var id = rafIdCounter++;
      rafCallbacks.push({ id: id, callback: callback });
      return id;
    } else {
      return nativeRaf(callback);
    }
  };

  var nativeCancelRaf = window.cancelAnimationFrame.bind(window);
  window.cancelAnimationFrame = function(id) {
    if (isControlledMode) {
      rafCallbacks = rafCallbacks.filter(function(item) { return item.id !== id; });
    } else {
      nativeCancelRaf(id);
    }
  };

  // Intercept performance.now
  var nativePerfNow = performance.now.bind(performance);
  performance.now = function() {
    if (isControlledMode) {
      return virtualTimeMs;
    }
    return nativePerfNow();
  };

  // Listen for parent messages
  window.addEventListener('message', function(msg) {
    if (!msg.data || msg.data.type !== 'HVS_STEP_FRAME') return;
    var targetMs = msg.data.timeMs;
    var fIndex = msg.data.frameIndex;
    window.__HTML_VIDEO_STUDIO_FPS__ = msg.data.fps || 30;
    window.__HTML_VIDEO_STUDIO__.setControlledMode(true);
    window.__HTML_VIDEO_STUDIO__.stepTo(targetMs, fIndex);

    window.parent.postMessage({
      type: 'HVS_FRAME_READY',
      frameIndex: fIndex,
      timeMs: targetMs
    }, '*');
  });

  // Ensure canvas resize handles properly
  window.addEventListener('load', function() {
    window.dispatchEvent(new Event('resize'));
    if (typeof window.renderFrame === 'function') {
      try { window.renderFrame(0); } catch(e) {}
    }
  });

  console.log('[HTML Video Studio] Deterministic Engine Ready');
})();
`;

/**
 * Builds a bundled HTML document embedding user CSS, JS, and Deterministic Controller
 */
export function buildRenderableHtml(
  htmlContent: string,
  cssContent: string,
  jsContent: string,
  controlledMode: boolean = false,
  fps: number = 30
): string {
  const scriptTag = `<script>\nwindow.__HTML_VIDEO_STUDIO_FPS__ = ${fps};\n${INJECTED_DETERMINISTIC_SCRIPT}\n${controlledMode ? 'window.__HTML_VIDEO_STUDIO__.setControlledMode(true);' : ''}\n</script>`;
  const resetCss = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      outline: none !important;
      width: 100vw !important;
      height: 100vh !important;
      overflow: hidden !important;
      background: #000;
    }
  `;
  const styleTag = `<style>\n${resetCss}\n${cssContent}\n</style>`;
  const userScriptTag = jsContent ? `<script>\n${jsContent}\n</script>` : '';

  if (htmlContent.includes('<head>') || htmlContent.includes('<html>')) {
    let result = htmlContent;
    if (result.includes('<head>')) {
      result = result.replace('<head>', `<head>\n${scriptTag}\n${styleTag}`);
    } else {
      result = scriptTag + styleTag + result;
    }
    if (result.includes('</body>')) {
      result = result.replace('</body>', `${userScriptTag}\n</body>`);
    } else {
      result = result + userScriptTag;
    }
    return result;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Render Stage</title>
  ${scriptTag}
  ${styleTag}
</head>
<body>
  ${htmlContent}
  ${userScriptTag}
</body>
</html>`;
}
