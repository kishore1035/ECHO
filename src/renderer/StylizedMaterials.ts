// ============================================================
// STYLIZED MATERIALS & TEXTURE GENERATOR
// Creates cohesive hand-painted / stylized procedural textures
// for wood, stone, metal, cloth, and glowing runes.
// Uses fast in-memory HTML5 Canvas textures cached as THREE.CanvasTexture.
// ============================================================

import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();

function getOrCreateTexture(key: string, draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void, size = 256): THREE.CanvasTexture {
  if (textureCache.has(key)) {
    return textureCache.get(key)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  draw(ctx, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, texture);
  return texture;
}

// ─── 1. Stylized Wood Texture (Warm fibrous grain & plank lines) ─

export function getStylizedWoodTexture(baseColor = '#6b4628', darkColor = '#4a2f18'): THREE.CanvasTexture {
  const key = `wood_${baseColor}_${darkColor}`;
  return getOrCreateTexture(key, (ctx, w, h) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    // Subtle grain lines
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2.5;
    for (let y = 0; y < h; y += 8) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < w; x += 16) {
        const offset = Math.sin((x + y * 0.5) * 0.08) * 3;
        ctx.lineTo(x, y + offset);
      }
      ctx.globalAlpha = 0.35;
      ctx.stroke();
    }

    // Occasional subtle wood knot
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    ctx.ellipse(w * 0.4, h * 0.5, 8, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1.0;
  });
}

// ─── 2. Stylized Stone / Masonry Texture (Faceted stone with bevel crevice) ─

export function getStylizedStoneTexture(baseColor = '#656b73', edgeColor = '#454a52'): THREE.CanvasTexture {
  const key = `stone_${baseColor}_${edgeColor}`;
  return getOrCreateTexture(key, (ctx, w, h) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    // Stone block grid pattern
    const rows = 6;
    const cols = 4;
    const rowH = h / rows;
    const colW = w / cols;

    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 3.5;
    ctx.globalAlpha = 0.65;

    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * rowH);
      ctx.lineTo(w, r * rowH);
      ctx.stroke();
    }

    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (colW * 0.5);
      for (let c = 0; c <= cols + 1; c++) {
        const x = c * colW - offset;
        ctx.beginPath();
        ctx.moveTo(x, r * rowH);
        ctx.lineTo(x, (r + 1) * rowH);
        ctx.stroke();
      }
    }

    // Organic speckled noise
    ctx.globalAlpha = 0.12;
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
      ctx.fillRect(rx, ry, 2, 2);
    }
    ctx.globalAlpha = 1.0;
  });
}

// ─── 3. Stylized Roof Shingle Texture ──────────────────────────

export function getStylizedRoofTexture(baseColor = '#8c3d2e', darkColor = '#5e2318'): THREE.CanvasTexture {
  const key = `roof_${baseColor}_${darkColor}`;
  return getOrCreateTexture(key, (ctx, w, h) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    const rows = 8;
    const cols = 6;
    const rowH = h / rows;
    const colW = w / cols;

    ctx.lineWidth = 3;
    for (let r = 0; r < rows; r++) {
      const y = (r + 1) * rowH;
      const offset = (r % 2) * (colW * 0.5);

      // Shingle shadow underline
      ctx.strokeStyle = darkColor;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();

      // Vertical separation cuts
      for (let c = 0; c <= cols + 1; c++) {
        const x = c * colW - offset;
        ctx.beginPath();
        ctx.moveTo(x, y - rowH);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  });
}

// ─── 4. Stylized Fabric / Tunic Texture ────────────────────────

export function getStylizedFabricTexture(color = '#2d5ea8'): THREE.CanvasTexture {
  const key = `fabric_${color}`;
  return getOrCreateTexture(key, (ctx, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);

    // Soft crosshatch weave
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.08;
    ctx.lineWidth = 1.2;

    for (let i = 0; i < w; i += 6) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let j = 0; j < h; j += 6) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(w, j);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  });
}

// ─── 5. Stylized Face Eyes Texture ─────────────────────────────

export function getStylizedFaceTexture(
  eyeColor = '#2464b8',
  expression: 'neutral' | 'determined' | 'wise' | 'fierce' | 'kind' = 'neutral'
): THREE.CanvasTexture {
  const key = `face_${eyeColor}_${expression}`;
  return getOrCreateTexture(key, (ctx, w, h) => {
    // Transparent background
    ctx.clearRect(0, 0, w, h);

    // Left and Right Eye Centers
    const eyeY = h * 0.45;
    const leftEyeX = w * 0.32;
    const rightEyeX = w * 0.68;
    const eyeRadiusX = w * 0.11;
    const eyeRadiusY = h * 0.13;

    [leftEyeX, rightEyeX].forEach((x, idx) => {
      // 1. Eye white sclera
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(x, eyeY, eyeRadiusX, eyeRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Iris
      ctx.fillStyle = eyeColor;
      ctx.beginPath();
      ctx.ellipse(x, eyeY, eyeRadiusX * 0.72, eyeRadiusY * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();

      // 3. Dark Pupil
      ctx.fillStyle = '#10141a';
      ctx.beginPath();
      ctx.ellipse(x, eyeY, eyeRadiusX * 0.38, eyeRadiusY * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. Stylized Catchlight / Specular Glint (Top-left)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(x - eyeRadiusX * 0.28, eyeY - eyeRadiusY * 0.32, eyeRadiusX * 0.24, eyeRadiusY * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();

      // 5. Stylized Eyelash / Upper Lid Line
      ctx.strokeStyle = '#221a14';
      ctx.lineWidth = 4.0;
      ctx.beginPath();
      ctx.ellipse(x, eyeY, eyeRadiusX * 1.05, eyeRadiusY * 1.05, 0, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // 6. Eyebrows
      ctx.strokeStyle = '#322419';
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      const browY = eyeY - eyeRadiusY * 1.6;
      const tilt = expression === 'determined' || expression === 'fierce'
        ? (idx === 0 ? 6 : -6)
        : expression === 'kind' ? (idx === 0 ? -3 : 3) : 0;

      ctx.moveTo(x - eyeRadiusX * 1.1, browY - tilt);
      ctx.lineTo(x + eyeRadiusX * 1.1, browY + tilt);
      ctx.stroke();
    });

    // Stylized subtle nose shadow / bridge
    ctx.fillStyle = '#c89e7c';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.62, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stylized mouth
    ctx.strokeStyle = '#6e3c28';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    if (expression === 'kind') {
      ctx.arc(w * 0.5, h * 0.74, 14, 0.15 * Math.PI, 0.85 * Math.PI);
    } else if (expression === 'fierce') {
      ctx.moveTo(w * 0.42, h * 0.8);
      ctx.lineTo(w * 0.58, h * 0.78);
    } else {
      ctx.moveTo(w * 0.44, h * 0.78);
      ctx.lineTo(w * 0.56, h * 0.78);
    }
    ctx.stroke();
  }, 256);
}

// ─── 6. Chronal Echo Rune Texture (Glowing ancient symbols) ───

export function getChronalRuneTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('chronal_rune', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#40f8e0';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Stylized chronal concentric glyph
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.5, w * 0.36, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.5, w * 0.22, 0, Math.PI * 2);
    ctx.stroke();

    // Cross-axis runic ticks
    const rad = w * 0.36;
    [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].forEach((a) => {
      ctx.beginPath();
      ctx.moveTo(w * 0.5 + Math.cos(a) * (rad - 12), h * 0.5 + Math.sin(a) * (rad - 12));
      ctx.lineTo(w * 0.5 + Math.cos(a) * (rad + 12), h * 0.5 + Math.sin(a) * (rad + 12));
      ctx.stroke();
    });

    // Central prism
    ctx.fillStyle = '#40f8e0';
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.5, 8, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }, 256);
}

// ─── 7. Stylized Flowing River Caustic Texture ────────────────
export function getStylizedWaterTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('stylized_water_caustics', (ctx, w, h) => {
    // Deep crystal azure gradient base
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#1a5f9c');
    grad.addColorStop(0.5, '#2078b8');
    grad.addColorStop(1, '#1b5a94');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Stylized caustic ribbon loops
    ctx.strokeStyle = '#5cd4f4';
    ctx.lineWidth = 4.0;
    ctx.globalAlpha = 0.55;

    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      const startY = (i / 7) * h;
      ctx.moveTo(0, startY);
      for (let x = 0; x <= w; x += 32) {
        const cy = startY + Math.sin((x * 0.04) + i * 1.5) * 18 + Math.cos(x * 0.08) * 6;
        ctx.lineTo(x, cy);
      }
      ctx.stroke();
    }

    // Stylized specular water sparkle nodes
    ctx.fillStyle = '#e8faff';
    ctx.globalAlpha = 0.75;
    for (let j = 0; j < 14; j++) {
      const sx = ((j * 53) % w) + 12;
      const sy = ((j * 71) % h) + 10;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 5, 2.5, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1.0;
  }, 256);
}

// ─── 8. Stylized Shoreline Foam Texture ────────────────────────
export function getStylizedWaterFoamTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('stylized_water_foam', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.0;
    ctx.globalAlpha = 0.85;

    // Organic wavy foam ring
    for (let r = 20; r < w * 0.45; r += 24) {
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += 0.15) {
        const rad = r + Math.sin(a * 8) * 4;
        const px = w * 0.5 + Math.cos(a) * rad;
        const py = h * 0.5 + Math.sin(a) * rad;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    }
  }, 256);
}

// ─── 9. Stylized Golden Straw Texture ─────────────────────────
export function getStylizedStrawTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('stylized_straw', (ctx, w, h) => {
    ctx.fillStyle = '#caa546';
    ctx.fillRect(0, 0, w, h);

    // Cross straw stalks
    ctx.strokeStyle = '#9e7d28';
    ctx.lineWidth = 2.0;
    ctx.globalAlpha = 0.45;
    for (let y = 0; y < h; y += 7) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y + (Math.sin(y * 0.2) * 5));
      ctx.stroke();
    }

    // Fiber glints
    ctx.strokeStyle = '#fae48e';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.35;
    for (let x = 0; x < w; x += 12) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + (Math.cos(x * 0.3) * 6), h);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }, 256);
}

// ─── 10. Stylized Hand-Painted Metal Texture ──────────────────
export function getStylizedMetalTexture(baseColor = '#828c98', edgeColor = '#dbe5f0'): THREE.CanvasTexture {
  const key = `metal_${baseColor}_${edgeColor}`;
  return getOrCreateTexture(key, (ctx, w, h) => {
    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, w, h);

    // Beveled perimeter highlight rim
    ctx.strokeStyle = edgeColor;
    ctx.lineWidth = 4.0;
    ctx.strokeRect(4, 4, w - 8, h - 8);

    // Diagonal specular gleam band
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0)');
    grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.45)');
    grad.addColorStop(0.55, 'rgba(255, 255, 255, 0.55)');
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Corner rivet bolts
    ctx.fillStyle = '#2c333c';
    [[14, 14], [w - 14, 14], [14, h - 14], [w - 14, h - 14]].forEach(([rx, ry]) => {
      ctx.beginPath();
      ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }, 256);
}

// ─── 11. Cel-Shading Stepped Lighting Gradient Maps ───────────

let toonRamp3: THREE.DataTexture | null = null;
export function getToonGradient3(): THREE.DataTexture {
  if (toonRamp3) return toonRamp3;
  // 3-step discrete cel ramp: shadow (80), midtone (175), highlight (255)
  const data = new Uint8Array([80, 175, 255]);
  toonRamp3 = new THREE.DataTexture(data, 3, 1, THREE.RedFormat);
  toonRamp3.minFilter = THREE.NearestFilter;
  toonRamp3.magFilter = THREE.NearestFilter;
  toonRamp3.needsUpdate = true;
  return toonRamp3;
}

let toonRamp4: THREE.DataTexture | null = null;
export function getToonGradient4(): THREE.DataTexture {
  if (toonRamp4) return toonRamp4;
  // 4-step discrete cel ramp for terrain & organic surfaces
  const data = new Uint8Array([55, 120, 190, 255]);
  toonRamp4 = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
  toonRamp4.minFilter = THREE.NearestFilter;
  toonRamp4.magFilter = THREE.NearestFilter;
  toonRamp4.needsUpdate = true;
  return toonRamp4;
}

let toonRamp2: THREE.DataTexture | null = null;
export function getToonGradient2(): THREE.DataTexture {
  if (toonRamp2) return toonRamp2;
  // 2-step graphic anime shadow ramp
  const data = new Uint8Array([110, 255]);
  toonRamp2 = new THREE.DataTexture(data, 2, 1, THREE.RedFormat);
  toonRamp2.minFilter = THREE.NearestFilter;
  toonRamp2.magFilter = THREE.NearestFilter;
  toonRamp2.needsUpdate = true;
  return toonRamp2;
}

// ─── 12. Inverted Hull Cartoon Silhouette Outline Material ─────
const outlineMaterialCache = new Map<string, THREE.MeshBasicMaterial>();

export function getInvertedHullOutlineMaterial(color = '#181420'): THREE.MeshBasicMaterial {
  if (outlineMaterialCache.has(color)) {
    return outlineMaterialCache.get(color)!;
  }
  const mat = new THREE.MeshBasicMaterial({
    color,
    side: THREE.BackSide,
    depthWrite: true,
  });
  outlineMaterialCache.set(color, mat);
  return mat;
}

// ─── 13. Stylized River Caustics Texture ──────────────────────
// Concentric ring-pattern with radial brightness falloff,
// used as an additive scrolling projector on the riverbed.
export function getStylizedCausticsTexture(): THREE.CanvasTexture {
  return getOrCreateTexture('stylized_caustics', (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    // Multiple offset caustic rings for organic look
    const centers = [
      { cx: w * 0.30, cy: h * 0.35 },
      { cx: w * 0.65, cy: h * 0.28 },
      { cx: w * 0.50, cy: h * 0.68 },
      { cx: w * 0.20, cy: h * 0.72 },
      { cx: w * 0.80, cy: h * 0.60 },
    ];

    for (const { cx, cy } of centers) {
      for (let r = 6; r < 48; r += 10) {
        const alpha = Math.max(0, 0.85 - r / 52);
        ctx.strokeStyle = `rgba(100, 220, 255, ${alpha})`;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = alpha * 0.9;
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2; a += 0.12) {
          const wobble = r + Math.sin(a * 5.5 + r * 0.3) * 3.5;
          const px = cx + Math.cos(a) * wobble * 1.6;
          const py = cy + Math.sin(a) * wobble;
          if (a < 0.01) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }

    ctx.globalAlpha = 1.0;
  }, 256);
}
