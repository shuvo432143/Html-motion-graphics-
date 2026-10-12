/**
 * Deterministic Timeline Stepping Injection Script
 * Injected into HTML render target iframes to force deterministic frame advancement.
 * Prevents frame drops, clock drifts, and device lag from affecting exported MP4 video.
 */

export const INJECTED_DETERMINISTIC_SCRIPT = `
(function() {
  if (window.__HTML_VIDEO_STUDIO_INITIALIZED__) return;
  window.__HTML_VIDEO_STUDIO_INITIALIZED__ = true;

  // Preserve WebGL buffer so canvas.drawImage or toDataURL never captures blank frames
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
    stepTo: function(timeMs, frameIndex) {
      virtualTimeMs = timeMs;
      virtualFrameIndex = frameIndex;

      // 1. Advance CSS Web Animations API
      if (document.getAnimations) {
        var animations = document.getAnimations();
        for (var i = 0; i < animations.length; i++) {
          try {
            animations[i].currentTime = timeMs;
          } catch(e) {}
        }
      }

      // 2. Dispatch Custom Event for Canvas / WebGL / Three.js
      var event = new CustomEvent('htmlVideoStudioTick', {
        detail: {
          timeMs: timeMs,
          timeSec: timeMs / 1000,
          frame: frameIndex,
          fps: window.__HTML_VIDEO_STUDIO_FPS__ || 30
        }
      });
      window.dispatchEvent(event);

      // 3. Direct function hook if declared
      if (typeof window.renderFrame === 'function') {
        try { window.renderFrame(timeMs); } catch(e) {}
      }
      if (typeof window.onStudioTick === 'function') {
        try { window.onStudioTick(timeMs, frameIndex); } catch(e) {}
      }

      // 4. Execute queued requestAnimationFrame callbacks
      var currentCallbacks = rafCallbacks.slice();
      rafCallbacks = [];
      for (var j = 0; j < currentCallbacks.length; j++) {
        try {
          currentCallbacks[j].callback(timeMs);
        } catch(err) {
          console.error('[HTML Video Studio] Error in rAF callback:', err);
        }
      }

      // 5. Update HTML5 video elements if present
      var videos = document.querySelectorAll('video');
      for (var v = 0; v < videos.length; v++) {
        try {
          videos[v].currentTime = timeMs / 1000;
        } catch(e) {}
      }

      return true;
    }
  };

  // Intercept requestAnimationFrame when controlled mode is active
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

  // Ensure canvas resize handles properly on startup
  window.addEventListener('load', function() {
    window.dispatchEvent(new Event('resize'));
    if (typeof window.renderFrame === 'function') {
      try { window.renderFrame(0); } catch(e) {}
    }
  });

  console.log('[HTML Video Studio] Full-Script Engine Active');
})();
`;

/**
 * Builds a bundled HTML document from a single full script
 */
export function buildRenderableHtml(
  fullHtmlScript: string,
  cssContent: string = '',
  jsContent: string = '',
  controlledMode: boolean = false,
  fps: number = 30
): string {
  const scriptTag = `<script>\nwindow.__HTML_VIDEO_STUDIO_FPS__ = ${fps};\n${INJECTED_DETERMINISTIC_SCRIPT}\n${controlledMode ? 'window.__HTML_VIDEO_STUDIO__.setControlledMode(true);' : ''}\n</script>`;

  // Enforce zero margins/borders across full scripts
  const resetCss = `<style>
    * { box-sizing: border-box; }
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
  </style>`;

  let code = fullHtmlScript.trim();

  // If user pasted or uploaded a full HTML document:
  if (code.includes('<head>')) {
    return code.replace('<head>', `<head>\n${scriptTag}\n${resetCss}`);
  } else if (code.includes('<html>')) {
    return code.replace('<html>', `<html>\n<head>\n${scriptTag}\n${resetCss}\n</head>`);
  } else {
    // If user provided HTML fragment, wrap in complete document
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Stage</title>
  ${scriptTag}
  ${resetCss}
</head>
<body>
  ${code}
</body>
</html>`;
  }
}
