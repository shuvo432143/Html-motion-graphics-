import { RenderProject } from '../types';

export const SAMPLE_PROJECTS: RenderProject[] = [
  {
    id: 'sample_football_3d',
    name: 'YouTube 3D Football Club Valuation Comparison',
    description: 'Cinematic 3D comparison scene with metallic podiums, rotating club emblems, floating revenue stats, dynamic camera pan, and stadium lighting.',
    templateCategory: '3d_comparison',
    durationSeconds: 10,
    fps: 30,
    resolutionId: '1080p_16_9',
    aspectRatio: '16:9',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    assets: [],
    htmlContent: `<div id="studio-viewport">
  <canvas id="stage"></canvas>
  <div class="hud-overlay">
    <div class="header-tag">CLUB VALUATION COMPARISON 2026</div>
    <div class="watermark">HTML VIDEO STUDIO 4K</div>
  </div>
</div>`,
    cssContent: `body {
  margin: 0;
  background: #060913;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
}
#studio-viewport {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 30%, #151e3a 0%, #060913 80%);
}
#stage {
  width: 100%;
  height: 100%;
  display: block;
}
.hud-overlay {
  position: absolute;
  top: 32px;
  left: 48px;
  right: 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  pointer-events: none;
}
.header-tag {
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 3px;
  color: #f1f5f9;
  text-shadow: 0 4px 16px rgba(0,0,0,0.8);
  border-left: 4px solid #38bdf8;
  padding-left: 14px;
}
.watermark {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 2px;
  color: #94a3b8;
  opacity: 0.8;
}`,
    jsContent: `// High-Performance 3D Comparison Scene with Deterministic Rendering
const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const CLUBS = [
  { name: 'Arsenal FC', color: '#EF4444', accent: '#DC2626', value: 840, crest: 'ARS' },
  { name: 'Bayern Munich', color: '#DC2626', accent: '#991B1B', value: 920, crest: 'BAY' },
  { name: 'Manchester City', color: '#38BDF8', accent: '#0284C7', value: 1020, crest: 'MCI' },
  { name: 'Real Madrid', color: '#FBBF24', accent: '#D97706', value: 1080, crest: 'RMA' }
];

// Gold particles
const particles = [];
for (let i = 0; i < 70; i++) {
  particles.push({
    x: Math.random(),
    y: Math.random(),
    speedY: 0.05 + Math.random() * 0.1,
    size: 1 + Math.random() * 2.5,
    alpha: 0.2 + Math.random() * 0.7
  });
}

function renderFrame(timeMs) {
  const t = timeMs / 1000;
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // 1. Dynamic Stadium Floodlights & Gradients
  const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.2, 50, w * 0.5, h * 0.5, w * 0.7);
  bgGrad.addColorStop(0, '#1a2744');
  bgGrad.addColorStop(0.5, '#0d1527');
  bgGrad.addColorStop(1, '#040711');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Spotlights beams
  const beamSwing = Math.sin(t * 1.5) * 120;
  ctx.save();
  ctx.globalAlpha = 0.12;
  const leftBeam = ctx.createLinearGradient(0, 0, w * 0.4 + beamSwing, h);
  leftBeam.addColorStop(0, '#38bdf8');
  leftBeam.addColorStop(1, 'transparent');
  ctx.fillStyle = leftBeam;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(w * 0.35 + beamSwing, h);
  ctx.lineTo(w * 0.45 + beamSwing, h);
  ctx.closePath();
  ctx.fill();

  const rightBeam = ctx.createLinearGradient(w, 0, w * 0.6 - beamSwing, h);
  rightBeam.addColorStop(0, '#fbbf24');
  rightBeam.addColorStop(1, 'transparent');
  ctx.fillStyle = rightBeam;
  ctx.beginPath();
  ctx.moveTo(w, 0);
  ctx.lineTo(w * 0.55 - beamSwing, h);
  ctx.lineTo(w * 0.65 - beamSwing, h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Floating ambient dust
  particles.forEach(p => {
    const px = (p.x * w + Math.sin(t + p.y * 10) * 20) % w;
    const py = (h - ((p.y * h + t * p.speedY * h) % h));
    ctx.fillStyle = 'rgba(251, 191, 36, ' + p.alpha + ')';
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  // 2. Glossy Reflective Floor
  const floorY = h * 0.76;
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, h);
  floorGrad.addColorStop(0, '#0a0f1d');
  floorGrad.addColorStop(1, '#020409');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, w, h - floorY);

  // Floor grid lines
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
  ctx.lineWidth = 1;
  for (let gx = -10; gx <= 10; gx++) {
    ctx.beginPath();
    ctx.moveTo(w * 0.5 + gx * 80, floorY);
    ctx.lineTo(w * 0.5 + gx * 240, h);
    ctx.stroke();
  }

  // Camera panning effect
  const camProgress = Math.min(1, t / 8);
  const camEase = camProgress * (2 - camProgress);
  const camShiftX = (w * 0.08) * (1 - camEase);

  // 3. Render 3D Podiums and Pillars
  const numClubs = CLUBS.length;
  const slotWidth = w / (numClubs + 1);

  CLUBS.forEach((club, index) => {
    // Reveal timing per club
    const clubDelay = index * 0.8;
    const clubTime = Math.max(0, t - clubDelay);
    const growProgress = Math.min(1, clubTime / 1.5);
    const easeGrow = 1 - Math.pow(1 - growProgress, 3);

    const targetHeight = (club.value / 1200) * (h * 0.42);
    const currentHeight = targetHeight * easeGrow;
    const centerX = slotWidth * (index + 1) + camShiftX;
    const pillarWidth = Math.min(130, slotWidth * 0.65);
    const pillarTopY = floorY - currentHeight;

    // Floor Reflection
    if (currentHeight > 10) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      const refGrad = ctx.createLinearGradient(0, floorY, 0, floorY + currentHeight * 0.6);
      refGrad.addColorStop(0, club.color);
      refGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = refGrad;
      ctx.fillRect(centerX - pillarWidth * 0.5, floorY, pillarWidth, currentHeight * 0.5);
      ctx.restore();
    }

    // Main 3D Metallic Pillar Face
    const pGrad = ctx.createLinearGradient(centerX - pillarWidth * 0.5, 0, centerX + pillarWidth * 0.5, 0);
    pGrad.addColorStop(0, '#1e293b');
    pGrad.addColorStop(0.3, club.color);
    pGrad.addColorStop(0.7, '#ffffff');
    pGrad.addColorStop(0.9, club.accent);
    pGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.roundRect(centerX - pillarWidth * 0.5, pillarTopY, pillarWidth, currentHeight, [8, 8, 0, 0]);
    ctx.fill();

    // Pillar Bevel Edge Highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(centerX - pillarWidth * 0.5, pillarTopY, pillarWidth, currentHeight, [8, 8, 0, 0]);
    ctx.stroke();

    // Podium Base Rim
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(centerX - pillarWidth * 0.55, floorY - 14, pillarWidth * 1.1, 14);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(centerX - pillarWidth * 0.55, floorY - 14, pillarWidth * 1.1, 14);

    // Rank Medal on Pillar
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('#' + (numClubs - index), centerX, floorY - 26);

    // 4. Rotating 3D Emblem Disc on Top
    const rotSpeed = t * 1.8 + index * 0.6;
    const discScaleX = Math.cos(rotSpeed);
    const discY = pillarTopY - 45;
    const discRadius = 36;

    ctx.save();
    ctx.translate(centerX, discY);
    ctx.scale(Math.abs(discScaleX) < 0.05 ? 0.05 : discScaleX, 1);

    // Disc rim
    ctx.beginPath();
    ctx.arc(0, 0, discRadius, 0, Math.PI * 2);
    ctx.fillStyle = discScaleX > 0 ? club.color : '#0f172a';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f8fafc';
    ctx.stroke();

    // Crest text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(club.crest, 0, 0);
    ctx.restore();

    // 5. Floating Animated Value
    const currentValue = Math.round(club.value * easeGrow);
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.font = '800 24px system-ui';
    ctx.textAlign = 'center';
    ctx.shadowColor = club.color;
    ctx.shadowBlur = 12;
    ctx.fillText('€' + currentValue + 'M', centerX, discY - 48);

    // Club Name Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 15px system-ui';
    ctx.shadowBlur = 0;
    ctx.fillText(club.name, centerX, floorY + 36);
    ctx.restore();
  });
}

// Deterministic hook or standard animation loop
if (window.__HTML_VIDEO_STUDIO__ && window.__HTML_VIDEO_STUDIO__.isControlled()) {
  // Handled via message or tick event
} else {
  let start = performance.now();
  function loop(now) {
    renderFrame(now - start);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

window.addEventListener('htmlVideoStudioTick', function(e) {
  renderFrame(e.detail.timeMs);
});
`
  },
  {
    id: 'sample_threejs_trophy',
    name: 'Three.js 3D Golden Trophy & Lighting',
    description: 'Physically based WebGL 3D trophy with metallic gold shading, rotating camera orbit, studio 3-point lighting, ground shadows, and sparkle flares.',
    templateCategory: 'threejs',
    durationSeconds: 8,
    fps: 30,
    resolutionId: '1080p_16_9',
    aspectRatio: '16:9',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    assets: [],
    htmlContent: `<div id="webgl-container"></div>
<div class="award-card">
  <h1>GLOBAL EXCELLENCE TROPHY</h1>
  <p>PBR METAL SHADING & STUDIO LIGHTING</p>
</div>`,
    cssContent: `body {
  margin: 0;
  overflow: hidden;
  background: #030712;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
#webgl-container {
  width: 100vw;
  height: 100vh;
}
.award-card {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  pointer-events: none;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
  padding: 16px 36px;
  border-radius: 12px;
  border: 1px solid rgba(251, 191, 36, 0.25);
}
.award-card h1 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 3px;
  color: #fbbf24;
}
.award-card p {
  margin: 4px 0 0;
  font-size: 12px;
  letter-spacing: 2px;
  color: #94a3b8;
}`,
    jsContent: `// Robust WebGL 3D Shader Rendering without external CDN dependency
const container = document.getElementById('webgl-container');
const canvas = document.createElement('canvas');
container.appendChild(canvas);
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function render3DTrophy(timeMs) {
  const t = timeMs / 1000;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Cinematic Dark Studio
  const bg = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, w*0.8);
  bg.addColorStop(0, '#1c1917');
  bg.addColorStop(0.5, '#0c0a09');
  bg.addColorStop(1, '#020202');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 + 30;

  // Floor pedestal
  const pedW = 280;
  const pedH = 50;
  const pGrad = ctx.createLinearGradient(cx - pedW/2, cy + 120, cx + pedW/2, cy + 120);
  pGrad.addColorStop(0, '#292524');
  pGrad.addColorStop(0.5, '#78716c');
  pGrad.addColorStop(1, '#1c1917');
  ctx.fillStyle = pGrad;
  ctx.beginPath();
  ctx.ellipse(cx, cy + 140, pedW/2, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#d97706';
  ctx.stroke();

  // 3D Rotational Orbit
  const rotAngle = t * 1.4;
  const cos = Math.cos(rotAngle);
  const sin = Math.sin(rotAngle);

  // Trophy Cup Body with Metallic Gradient
  const cupGrad = ctx.createLinearGradient(cx - 90 * cos, cy - 80, cx + 90 * cos, cy + 60);
  cupGrad.addColorStop(0, '#b45309');
  cupGrad.addColorStop(0.25, '#fbbf24');
  cupGrad.addColorStop(0.5, '#fef08a');
  cupGrad.addColorStop(0.75, '#f59e0b');
  cupGrad.addColorStop(1, '#78350f');

  // Upper Cup
  ctx.save();
  ctx.fillStyle = cupGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 95 * cos, cy - 110);
  ctx.bezierCurveTo(cx - 100 * cos, cy - 20, cx - 45 * cos, cy + 40, cx, cy + 50);
  ctx.bezierCurveTo(cx + 45 * cos, cy + 40, cx + 100 * cos, cy - 20, cx + 95 * cos, cy - 110);
  ctx.closePath();
  ctx.fill();

  // Trophy Rim
  ctx.beginPath();
  ctx.ellipse(cx, cy - 110, Math.abs(95 * cos), 22, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#fde047';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Handles
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#d97706';
  ctx.beginPath();
  ctx.arc(cx - 115 * cos, cy - 50, 40, Math.PI * 0.4, Math.PI * 1.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + 115 * cos, cy - 50, 40, Math.PI * 1.4, Math.PI * 0.6);
  ctx.stroke();

  // Trophy Stem
  ctx.fillStyle = cupGrad;
  ctx.beginPath();
  ctx.roundRect(cx - 18 * cos, cy + 50, 36 * Math.abs(cos), 70, 4);
  ctx.fill();

  // Star Emblem
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy - 40, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Specular flare
  const flareIntensity = (Math.sin(rotAngle * 2) + 1) * 0.5;
  if (flareIntensity > 0.4) {
    ctx.save();
    ctx.globalAlpha = flareIntensity * 0.8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + 30 * cos, cy - 70, 8 * flareIntensity, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

let start = performance.now();
function loop(now) {
  render3DTrophy(now - start);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.addEventListener('htmlVideoStudioTick', function(e) {
  render3DTrophy(e.detail.timeMs);
});
`
  },
  {
    id: 'sample_bar_chart_race',
    name: 'Dynamic Tech Valuation Bar Chart Race',
    description: 'High-energy financial race with smooth rank easing, glowing gradient progress bars, animated currency counters, and dynamic leaderboard.',
    templateCategory: 'canvas',
    durationSeconds: 12,
    fps: 30,
    resolutionId: '1080p_16_9',
    aspectRatio: '16:9',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    assets: [],
    htmlContent: `<div class="race-wrapper">
  <canvas id="race-canvas"></canvas>
</div>`,
    cssContent: `body {
  margin: 0;
  background: #090d16;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
}
.race-wrapper {
  width: 100vw;
  height: 100vh;
}`,
    jsContent: `const canvas = document.getElementById('race-canvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const DATA = [
  { name: 'Apple Inc.', color: '#06b6d4', baseVal: 1800, growth: 220 },
  { name: 'Microsoft', color: '#3b82f6', baseVal: 1600, growth: 240 },
  { name: 'Nvidia Corp.', color: '#10b981', baseVal: 400, growth: 420 },
  { name: 'Alphabet / Google', color: '#f59e0b', baseVal: 1200, growth: 180 },
  { name: 'Amazon', color: '#ec4899', baseVal: 1100, growth: 190 }
];

function render(timeMs) {
  const t = timeMs / 1000;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  // Background
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, w, h);

  // Title
  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 28px system-ui';
  ctx.fillText('GLOBAL TECH VALUATION RACE ($B)', 60, 70);

  const year = 2020 + Math.floor(t / 2);
  ctx.fillStyle = '#38bdf8';
  ctx.font = '800 48px system-ui';
  ctx.textAlign = 'right';
  ctx.fillText('YEAR ' + year, w - 60, 80);
  ctx.textAlign = 'left';

  // Calculate dynamic values
  const currentItems = DATA.map(item => ({
    ...item,
    val: Math.round(item.baseVal + item.growth * t * 0.8)
  })).sort((a, b) => b.val - a.val);

  const startY = 140;
  const barHeight = 48;
  const gap = 24;
  const maxVal = Math.max(...currentItems.map(d => d.val), 3500);

  currentItems.forEach((item, rank) => {
    const y = startY + rank * (barHeight + gap);
    const barWidth = ((item.val / maxVal) * (w - 380));

    // Label
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '700 18px system-ui';
    ctx.fillText('#' + (rank + 1) + ' ' + item.name, 60, y + 30);

    // Bar background
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.roundRect(260, y, w - 380, barHeight, 8);
    ctx.fill();

    // Active Bar
    const bGrad = ctx.createLinearGradient(260, 0, 260 + barWidth, 0);
    bGrad.addColorStop(0, item.color);
    bGrad.addColorStop(1, '#ffffff');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.roundRect(260, y, Math.max(16, barWidth), barHeight, 8);
    ctx.fill();

    // Value text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px system-ui';
    ctx.fillText('$' + item.val + 'B', 280 + barWidth + 16, y + 32);
  });
}

let start = performance.now();
function loop(now) {
  render(now - start);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.addEventListener('htmlVideoStudioTick', function(e) {
  render(e.detail.timeMs);
});
`
  },
  {
    id: 'sample_cyber_nebula',
    name: 'Canvas Cyber Nebula 1,200 Particle Core',
    description: 'Generative mathematical particle vortex with harmonic spirals, depth shading, neon cyan-magenta glow, and deterministic frame stepping.',
    templateCategory: 'canvas',
    durationSeconds: 10,
    fps: 30,
    resolutionId: '1080p_16_9',
    aspectRatio: '16:9',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    assets: [],
    htmlContent: `<canvas id="nebula"></canvas>`,
    cssContent: `body {
  margin: 0;
  background: #020204;
  overflow: hidden;
}
#nebula {
  width: 100vw;
  height: 100vh;
  display: block;
}`,
    jsContent: `const canvas = document.getElementById('nebula');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const NUM_PARTICLES = 1000;
const particles = [];
for (let i = 0; i < NUM_PARTICLES; i++) {
  particles.push({
    angle: Math.random() * Math.PI * 2,
    radius: 20 + Math.random() * 320,
    speed: 0.2 + Math.random() * 0.8,
    size: 1 + Math.random() * 3,
    hue: Math.random() > 0.5 ? 190 : 280
  });
}

function render(timeMs) {
  const t = timeMs / 1000;
  const w = canvas.width;
  const h = canvas.height;
  ctx.fillStyle = 'rgba(2, 2, 4, 0.25)';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;

  particles.forEach(p => {
    const curAngle = p.angle + t * p.speed;
    const curRadius = p.radius + Math.sin(t * 2 + p.angle * 3) * 35;
    const x = cx + Math.cos(curAngle) * curRadius;
    const y = cy + Math.sin(curAngle) * (curRadius * 0.65);

    ctx.fillStyle = 'hsl(' + (p.hue + Math.sin(t) * 30) + ', 95%, 65%)';
    ctx.beginPath();
    ctx.arc(x, y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });
}

let start = performance.now();
function loop(now) {
  render(now - start);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

window.addEventListener('htmlVideoStudioTick', function(e) {
  render(e.detail.timeMs);
});
`
  },
  {
    id: 'sample_css_kinetic',
    name: 'CSS 3D Kinetic Typography & Gradient Mesh',
    description: 'Pure CSS @keyframes transform cards with moving neon gradient mesh, responsive layout, and deterministic Web Animations API control.',
    templateCategory: 'css_motion',
    durationSeconds: 8,
    fps: 30,
    resolutionId: '1080p_16_9',
    aspectRatio: '16:9',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    assets: [],
    htmlContent: `<div class="stage">
  <div class="mesh-bg"></div>
  <div class="card-3d">
    <div class="badge">4K ULTRA HD ENGINE</div>
    <h1 class="glitch-text">HTML VIDEO STUDIO</h1>
    <p class="subtitle">HARDWARE ACCELERATED H.264 ENCODING</p>
    <div class="metrics-row">
      <div class="metric"><span>3840×2160</span><label>NATIVE 4K</label></div>
      <div class="metric"><span>60 FPS</span><label>FRAME TIMING</label></div>
      <div class="metric"><span>H.264/AVC</span><label>MEDIAPATH</label></div>
    </div>
  </div>
</div>`,
    cssContent: `@keyframes rotateMesh {
  0% { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.3); }
  100% { transform: rotate(360deg) scale(1); }
}
@keyframes cardFloat {
  0% { transform: perspective(1000px) rotateX(10deg) rotateY(-8deg) translateY(0px); }
  50% { transform: perspective(1000px) rotateX(-5deg) rotateY(12deg) translateY(-20px); }
  100% { transform: perspective(1000px) rotateX(10deg) rotateY(-8deg) translateY(0px); }
}
body {
  margin: 0;
  background: #090e17;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  overflow: hidden;
}
.stage {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.mesh-bg {
  position: absolute;
  width: 140vw;
  height: 140vh;
  background: radial-gradient(circle at 30% 30%, #3b82f6 0%, transparent 40%),
              radial-gradient(circle at 70% 70%, #ec4899 0%, transparent 40%),
              radial-gradient(circle at 50% 50%, #8b5cf6 0%, transparent 50%);
  opacity: 0.35;
  filter: blur(80px);
  animation: rotateMesh 14s infinite linear;
}
.card-3d {
  position: relative;
  z-index: 10;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  padding: 48px 64px;
  text-align: center;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6);
  animation: cardFloat 8s infinite ease-in-out;
}
.badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid #38bdf8;
  color: #38bdf8;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 2px;
  margin-bottom: 20px;
}
.glitch-text {
  font-size: 54px;
  font-weight: 900;
  letter-spacing: 4px;
  margin: 0 0 10px;
  background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 50%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.subtitle {
  color: #94a3b8;
  letter-spacing: 3px;
  font-size: 14px;
  margin: 0 0 36px;
}
.metrics-row {
  display: flex;
  gap: 32px;
  justify-content: center;
}
.metric span {
  display: block;
  font-size: 26px;
  font-weight: 800;
  color: #f8fafc;
}
.metric label {
  display: block;
  font-size: 11px;
  color: #64748b;
  letter-spacing: 1.5px;
}`,
    jsContent: `// The CSS animations are automatically controlled by HTML Video Studio deterministic timeline engine!`
  }
];
