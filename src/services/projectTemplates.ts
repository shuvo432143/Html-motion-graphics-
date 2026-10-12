import { RenderProject } from '../types';

export const DEFAULT_FULL_HTML_SCRIPT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Kinetic Cyber Core 46s</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #02040a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #canvas {
      width: 100%;
      height: 100%;
      display: block;
    }
    .hud {
      position: absolute;
      top: 24px;
      left: 28px;
      right: 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      pointer-events: none;
      color: #fff;
    }
    .title {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: 3px;
      color: #38bdf8;
      text-shadow: 0 0 20px rgba(56, 189, 248, 0.6);
    }
    .tag {
      font-size: 12px;
      font-family: monospace;
      color: #94a3b8;
      background: rgba(15, 23, 42, 0.8);
      padding: 4px 10px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <div class="hud">
    <div class="title">CYBER KINETIC CORE</div>
    <div class="tag">46s ULTRA HD RENDER</div>
  </div>

  <script>
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth || 1920;
      canvas.height = window.innerHeight || 1080;
    }
    window.addEventListener('resize', resize);
    resize();

    // 800 Organic Particle Nodes
    const particles = [];
    for (let i = 0; i < 400; i++) {
      particles.push({
        baseAngle: (i / 400) * Math.PI * 2,
        distance: 80 + Math.random() * 320,
        speed: 0.3 + Math.random() * 0.7,
        size: 1.2 + Math.random() * 2.5,
        hue: Math.random() > 0.5 ? 190 : 280
      });
    }

    function renderFrame(timeMs) {
      if (canvas.width <= 0 || canvas.height <= 0) resize();
      const t = timeMs / 1000;
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      // Dark Space Gradient
      ctx.fillStyle = '#02040a';
      ctx.fillRect(0, 0, w, h);

      // Central Harmonic Glow
      const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 420);
      glow.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
      glow.addColorStop(0.4, 'rgba(168, 85, 247, 0.15)');
      glow.addColorStop(1, 'rgba(2, 4, 10, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // Rotating Concentric Cyber Rings
      for (let r = 1; r <= 4; r++) {
        const ringRadius = 100 + r * 65;
        const ringRot = t * (r % 2 === 0 ? 0.8 : -0.6);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ringRot);

        ctx.strokeStyle = r === 2 ? '#38bdf8' : r === 3 ? '#c084fc' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = r === 2 ? 3 : 1.5;
        ctx.setLineDash([20 * r, 12, 6, 12]);
        ctx.beginPath();
        ctx.arc(0, 0, ringRadius + Math.sin(t * 2 + r) * 10, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Floating Particle Swarm
      particles.forEach((p) => {
        const angle = p.baseAngle + t * p.speed * 0.6;
        const dist = p.distance + Math.sin(t * 1.5 + p.baseAngle * 4) * 35;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * (dist * 0.75);

        ctx.fillStyle = 'hsl(' + (p.hue + Math.sin(t + angle) * 30) + ', 95%, 65%)';
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Central Orb Pulse
      const orbRadius = 45 + Math.sin(t * 3) * 8;
      const orbGrad = ctx.createRadialGradient(cx - 10, cy - 10, 5, cx, cy, orbRadius);
      orbGrad.addColorStop(0, '#ffffff');
      orbGrad.addColorStop(0.3, '#38bdf8');
      orbGrad.addColorStop(0.8, '#6366f1');
      orbGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, orbRadius, 0, Math.PI * 2);
      ctx.fill();

      // Time Progress Ring
      const progress = (t % 46) / 46;
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 65, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // Live Timestamp readout
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(t.toFixed(1) + 's / 46s', cx, cy);
    }

    // Expose render function for frame scanner
    window.renderFrame = renderFrame;

    // Real-time animation loop
    let startTime = performance.now();
    function loop(now) {
      if (!window.__HTML_VIDEO_STUDIO__ || !window.__HTML_VIDEO_STUDIO__.isControlled()) {
        renderFrame(now - startTime);
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    window.addEventListener('htmlVideoStudioTick', function(e) {
      renderFrame(e.detail.timeMs);
    });

    renderFrame(0);
  </script>
</body>
</html>`;

export const SAMPLE_PROJECTS: RenderProject[] = [
  {
    id: 'sample_cyber_kinetic',
    name: 'Cyber Kinetic Core Animation',
    description: 'Generative mathematical particle vortex and pulsing concentric rings with 46-second locked timeline.',
    templateCategory: 'canvas',
    durationSeconds: 46,
    fps: 30,
    resolutionId: '1080p_16_9',
    aspectRatio: '16:9',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    assets: [],
    htmlContent: DEFAULT_FULL_HTML_SCRIPT,
    cssContent: '',
    jsContent: '',
  }
];
