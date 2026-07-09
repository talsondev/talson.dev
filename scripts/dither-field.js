import * as THREE from 'three';

const vertexShader = `
void main() {
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform vec3  uColor;
uniform vec2  uResolution;
uniform vec4  uMouse;
uniform float uTime;
uniform float uPixelSize;

uniform int   uShapeType;
const int SHAPE_DIAMOND  = 0;

const int   MAX_WAKE = 24;

uniform vec2  uWakePos      [MAX_WAKE];
uniform vec2  uWakeVel      [MAX_WAKE];
uniform float uWakeTimes    [MAX_WAKE];
uniform float uWakeStrengths[MAX_WAKE];

out vec4 fragColor;

float Bayer2(vec2 a) {
    a = floor(a);
    return fract(a.x / 2. + a.y * a.y * .75);
}

#define Bayer4(a) (Bayer2(.5*(a))*0.25 + Bayer2(a))
#define Bayer8(a) (Bayer4(.5*(a))*0.25 + Bayer2(a))

#define FBM_OCTAVES     5
#define FBM_LACUNARITY  1.25
#define FBM_GAIN        1.
#define FBM_SCALE       4.0

float hash11(float n) { return fract(sin(n)*43758.5453); }

float vnoise(vec3 p)
{
    vec3 ip = floor(p);
    vec3 fp = fract(p);

    float n000 = hash11(dot(ip + vec3(0.0,0.0,0.0), vec3(1.0,57.0,113.0)));
    float n100 = hash11(dot(ip + vec3(1.0,0.0,0.0), vec3(1.0,57.0,113.0)));
    float n010 = hash11(dot(ip + vec3(0.0,1.0,0.0), vec3(1.0,57.0,113.0)));
    float n110 = hash11(dot(ip + vec3(1.0,1.0,0.0), vec3(1.0,57.0,113.0)));
    float n001 = hash11(dot(ip + vec3(0.0,0.0,1.0), vec3(1.0,57.0,113.0)));
    float n101 = hash11(dot(ip + vec3(1.0,0.0,1.0), vec3(1.0,57.0,113.0)));
    float n011 = hash11(dot(ip + vec3(0.0,1.0,1.0), vec3(1.0,57.0,113.0)));
    float n111 = hash11(dot(ip + vec3(1.0,1.0,1.0), vec3(1.0,57.0,113.0)));

    vec3 w = fp*fp*fp*(fp*(fp*6.0-15.0)+10.0);

    float x00 = mix(n000, n100, w.x);
    float x10 = mix(n010, n110, w.x);
    float x01 = mix(n001, n101, w.x);
    float x11 = mix(n011, n111, w.x);

    float y0  = mix(x00, x10, w.y);
    float y1  = mix(x01, x11, w.y);

    return mix(y0, y1, w.z) * 2.0 - 1.0;
}

float fbm2(vec2 uv, float t)
{
    vec3 p   = vec3(uv * FBM_SCALE, t);
    float amp  = 1.;
    float freq = 1.;
    float sum  = 1.;

    for (int i = 0; i < FBM_OCTAVES; ++i)
    {
        sum  += amp * vnoise(p * freq);
        freq *= FBM_LACUNARITY;
        amp  *= FBM_GAIN;
    }

    return sum * 0.5 + 0.5;
}


float maskTriangle(vec2 p, vec2 id, float cov) {
    bool flip = mod(id.x + id.y, 2.0) > 0.5;
    if (flip) p.x = 1.0 - p.x;
    float r = sqrt(cov);
    float d  = p.y - r*(1.0 - p.x);
    float aa = fwidth(d);
    return cov * clamp(0.5 - d/aa, 0.0, 1.0);
}

float maskDiamond(vec2 p, float cov) {
    float r = sqrt(cov) * 0.564;
    return step(abs(p.x - 0.49) + abs(p.y - 0.49), r);
}

void main() {
    float pixelSize = uPixelSize;
    vec2 fragCoord = gl_FragCoord.xy - uResolution * .5;

    float aspectRatio = uResolution.x / uResolution.y;

    vec2 pixelId = floor(fragCoord / pixelSize);
    vec2 pixelUV = fract(fragCoord / pixelSize);

    float cellPixelSize =  2. * pixelSize;
    vec2 cellId = floor(fragCoord / cellPixelSize);

    vec2 cellCoord = cellId * cellPixelSize;
    vec2 uv = cellCoord / uResolution * vec2(aspectRatio, 1.0);

    vec2 mouseUv = (((uMouse.xy - uResolution * .5 - cellPixelSize * .5) / uResolution)) * vec2(aspectRatio, 1.0);
    vec2 warpedUv = uv;
    float wakeField = 0.0;
    float turbulence = 0.0;

    const float wakeLength      = 5.5;
    const float wakeWidth       = 0.035;
    const float wakeSideSpread  = 0.12;
    const float wakeAgeDecay    = 2.2;
    const float vortexFrequency = 46.0;
    const float vortexSpin      = 7.5;
    const float warpStrength    = 0.06;

    for (int i = 0; i < MAX_WAKE; ++i) {
        vec2 pos = uWakePos[i];
        vec2 vel = uWakeVel[i];
        if (pos.x < 0.0 || length(vel) < 0.001) continue;

        vec2 cuv = (((pos - uResolution * .5 - cellPixelSize * .5) / uResolution)) * vec2(aspectRatio, 1.0);
        vec2 dir = normalize(vec2(vel.x * aspectRatio, vel.y));
        vec2 side = vec2(-dir.y, dir.x);

        float age = max(uTime - uWakeTimes[i], 0.0);
        vec2 q = uv - cuv;
        float behind = dot(q, -dir);
        float across = dot(q, side);

        float trailDistance = max(behind, 0.0);
        float activeMask = smoothstep(0.0, 0.02, behind);
        float width = wakeWidth + trailDistance * wakeSideSpread;
        float lateral = exp(-(across * across) / max(width * width, 0.0001));
        float tail = exp(-trailDistance * wakeLength);
        float temporal = exp(-age * wakeAgeDecay);
        float wake = activeMask * lateral * tail * temporal * uWakeStrengths[i];

        float vortex = sin(behind * vortexFrequency - age * vortexSpin);
        float shear = -across / max(width, 0.001);

        warpedUv += side * vortex * wake * warpStrength;
        warpedUv += side * shear * wake * 0.015;
        warpedUv -= dir * wake * 0.025;

        wakeField += wake;
        turbulence += abs(vortex) * wake;
    }

    vec2 cursorVel = vec2(uMouse.z * aspectRatio, uMouse.w);
    vec2 cursorDir = normalize(cursorVel + vec2(0.0001));
    vec2 cursorSide = vec2(-cursorDir.y, cursorDir.x);
    float cursorSpeed = clamp(length(uMouse.zw) / 1800.0, 0.0, 1.0);
    float cursorDist = distance(uv, mouseUv);
    float cursorWake = exp(-cursorDist * 26.0) * cursorSpeed;
    warpedUv += cursorSide * sin(dot(uv - mouseUv, cursorSide) * 120.0 + uTime * 8.0) * cursorWake * 0.012;

    float feed = fbm2(warpedUv, uTime * 0.05 + turbulence * 0.08);
    feed = feed * 0.65 - 0.42;

    float wakeMask = clamp(wakeField * 0.7 + cursorWake * 0.25, 0.0, 1.0);
    float wakeRim = smoothstep(0.03, 0.18, wakeMask) * (1.0 - smoothstep(0.32, 0.75, wakeMask));
    feed += wakeRim * 0.35;
    feed = mix(feed, -0.85, smoothstep(0.16, 0.9, wakeMask));

    float bayer = Bayer8(fragCoord / uPixelSize) - 0.5;
    float bw    = step(0.5, feed + bayer);

    float coverage = bw;
    float M;
    if      (uShapeType == SHAPE_DIAMOND)  M = maskDiamond(pixelUV, coverage);
    else                                   M = coverage;

    vec3 color = uColor;
    fragColor = vec4(color, M);
}
`;

const SHAPE_MAP = {
  diamond: 0,
};

const bg = document.getElementById('hero_bg');

if (!bg) {
  throw new Error('Missing #hero_bg element.');
}

const shapeAttr = bg.dataset.shape ?? 'square';
const pixelSizeAttr = bg.dataset.pixelSize ?? '4';
const inkAttr = bg.dataset.ink ?? '#ffffff';

const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
  bg.innerHTML = '<p class="webgl-error">WebGL 2 is not available in this browser.</p>';
  throw new Error('WebGL 2 is not available.');
}

const renderer = new THREE.WebGLRenderer({ canvas, context: gl, antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
bg.appendChild(canvas);

const MAX_WAKE = 24;
const uniforms = {
  uResolution: { value: new THREE.Vector2() },
  uTime: { value: 0 },
  uColor: { value: new THREE.Color(inkAttr) },
  uMouse: { value: new THREE.Vector4(-1, -1, 0, 0) },
  uWakePos: { value: Array.from({ length: MAX_WAKE }, () => new THREE.Vector2(-1, -1)) },
  uWakeVel: { value: Array.from({ length: MAX_WAKE }, () => new THREE.Vector2(0, 0)) },
  uWakeTimes: { value: new Float32Array(MAX_WAKE) },
  uWakeStrengths: { value: new Float32Array(MAX_WAKE) },
  uShapeType: { value: SHAPE_MAP[shapeAttr] ?? 0 },
  uPixelSize: { value: Number.parseFloat(pixelSizeAttr) || 4 },
};

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms,
  glslVersion: THREE.GLSL3,
  transparent: true,
});

scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

function resize() {
  const width = bg.clientWidth || window.innerWidth;
  const height = bg.clientHeight || window.innerHeight;

  renderer.setSize(width, height, false);
  uniforms.uResolution.value.set(canvas.width, canvas.height);
}

window.addEventListener('resize', resize);
resize();

let wakeIndex = 0;
let lastPointer = null;
let lastEmitTime = -Infinity;

function getCanvasPointer(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (rect.height - (event.clientY - rect.top)) * (canvas.height / rect.height),
  };
}

function emitWake(x, y, vx, vy, strength) {
  uniforms.uWakePos.value[wakeIndex].set(x, y);
  uniforms.uWakeVel.value[wakeIndex].set(vx, vy);
  uniforms.uWakeTimes.value[wakeIndex] = uniforms.uTime.value;
  uniforms.uWakeStrengths.value[wakeIndex] = strength;
  wakeIndex = (wakeIndex + 1) % MAX_WAKE;
}

document.addEventListener('pointermove', (event) => {
  const rect = canvas.getBoundingClientRect();

  // Only track if pointer is over the canvas area
  if (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  ) {
    return;
  }

  const pointer = {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (rect.height - (event.clientY - rect.top)) * (canvas.height / rect.height),
  };

  const now = uniforms.uTime.value;

  if (lastPointer) {
    const dx = pointer.x - lastPointer.x;
    const dy = pointer.y - lastPointer.y;
    const distance = Math.hypot(dx, dy);
    const dt = Math.max(now - lastPointer.time, 1 / 60);
    const vx = dx / dt;
    const vy = dy / dt;
    const speed = distance / dt;

    uniforms.uMouse.value.set(pointer.x, pointer.y, vx, vy);

    if (distance > 1 && now - lastEmitTime > 0.005) {
      emitWake(pointer.x, pointer.y, vx, vy, THREE.MathUtils.clamp(speed / 5000, 0.04, 0.3));
      lastEmitTime = now;
    }
  } else {
    uniforms.uMouse.value.set(pointer.x, pointer.y, 0, 0);
  }

  lastPointer = { ...pointer, time: now };
});

document.addEventListener('pointerleave', () => {
  lastPointer = null;
  uniforms.uMouse.value.set(-1, -1, 0, 0);
});

const clock = new THREE.Clock();

// Performance monitoring
let frameCount = 0;
let lastTime = performance.now();
const stats = {
  fps: 0,
  renderTime: 0,
  resolution: '0x0',
  pixels: 0,
};

// Add stats display to page
const statsDiv = document.createElement('div');
statsDiv.id = 'dither-stats';
statsDiv.style.cssText = `
  position: fixed;
  top: 10px;
  left: 10px;
  background: rgba(0, 0, 0, 0.7);
  color: #0f0;
  font-family: monospace;
  font-size: 12px;
  padding: 8px;
  z-index: 9999;
  display: none;
  white-space: pre;
  line-height: 1.4;
`;
document.body.appendChild(statsDiv);

// Toggle stats with 'S' key
document.addEventListener('keydown', (e) => {
  if (e.key === 's' || e.key === 'S') {
    statsDiv.style.display = statsDiv.style.display === 'none' ? 'block' : 'none';
  }
  // Debug: Press M to toggle marquee
  if (e.key === 'm' || e.key === 'M') {
    const marquee = document.querySelector('[data-tech-stack-marquee]');
    if (marquee) {
      marquee.style.display = marquee.style.display === 'none' ? 'block' : 'none';
      console.log('[DEBUG] Marquee toggled:', marquee.style.display !== 'none');
    }
  }
  // Debug: Press A to toggle Motion animations
  if (e.key === 'a' || e.key === 'A') {
    const animated = document.querySelectorAll('[style*="will-change"]');
    animated.forEach(el => {
      el.style.willChange = el.style.willChange === 'none' ? 'opacity, transform' : 'none';
    });
    console.log('[DEBUG] Animations toggled');
  }
});

function animate() {
  const frameStart = performance.now();

  uniforms.uTime.value = clock.getElapsedTime();
  renderer.render(scene, camera);

  const frameEnd = performance.now();
  stats.renderTime = frameEnd - frameStart;

  frameCount++;
  const elapsed = frameEnd - lastTime;

  if (elapsed >= 1000) {
    stats.fps = Math.round((frameCount * 1000) / elapsed);
    stats.resolution = `${canvas.width}x${canvas.height}`;
    stats.pixels = (canvas.width * canvas.height / 1000000).toFixed(2);

    statsDiv.textContent = `FPS: ${stats.fps}
Render: ${stats.renderTime.toFixed(2)}ms
Res: ${stats.resolution}
Mpx: ${stats.pixels}`;

    frameCount = 0;
    lastTime = frameEnd;
  }

  requestAnimationFrame(animate);
}

animate();
