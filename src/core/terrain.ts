// ============================================================
// TERRAIN — Shared height function + named world locations
// Used by: Terrain renderer, SpawnSystem (Y correction), CommandParser (LLM context)
// ============================================================

/**
 * Returns terrain height (Y) at world position (x, z).
 * Pure function — same input always gives same output.
 * Must stay in sync with Terrain.tsx vertex displacement.
 */
export function getTerrainHeight(x: number, z: number): number {
  let h = 0;

  // 1. Organic Base Rolling Hills
  h += Math.sin(x * 0.05) * Math.cos(z * 0.06) * 2.0;
  h += Math.sin(x * 0.11 + 0.8) * Math.cos(z * 0.10 + 0.3) * 1.0;
  h += Math.sin(x * 0.22) * Math.cos(z * 0.20) * 0.4;
  h += 1.8;

  // 2. Village Basin (Peaceful lower valley around 4, 7)
  const vDist = Math.hypot(x - 4, z - 7);
  if (vDist < 12) {
    const vFactor = Math.cos((vDist / 12) * (Math.PI / 2));
    h = h * (1 - vFactor * 0.7) + 2.2 * (vFactor * 0.7);
  }

  // 3. Central Crossroads (0, 0)
  const cDist = Math.hypot(x, z);
  if (cDist < 8) {
    const cFactor = Math.cos((cDist / 8) * (Math.PI / 2));
    h = h * (1 - cFactor * 0.5) + 2.0 * (cFactor * 0.5);
  }

  // 4. Natural Curved River Trench (Silverflow) passing under bridge at (-8, 5)
  const riverCenterX = -8.0 - (z - 5) * 0.08 + Math.sin((z - 5) * 0.12) * 0.6;
  const distToRiver = Math.abs(x - riverCenterX);

  if (distToRiver < 2.5 && z > -40 && z < 45) {
    const t = distToRiver / 2.5; // 0 at river center, 1 at bank
    const troughDepth = (1 - t * t) * 2.5;
    h -= troughDepth;
  }

  // 5. Whispering Stones Sanctuary (sacred mound east of river)
  const wsDist = Math.hypot(x - (-4.5), z - 9.5);
  if (wsDist < 7) {
    const wsFactor = Math.cos((wsDist / 7) * (Math.PI / 2));
    h = h * (1 - wsFactor * 0.5) + 2.3 * (wsFactor * 0.5);
  }

  // 6. Secondary Craggy Hill (Northwest - Shadow Pass & Bastion)
  const spDist = Math.hypot(x - (-20), z - (-12));
  if (spDist < 16) {
    const spFactor = Math.cos((spDist / 16) * (Math.PI / 2));
    h = h * (1 - spFactor * 0.75) + 7.5 * (spFactor * 0.75);
  }

  // 7. BROAD MOUNTAIN PLATEAU & FRAMING MOUNTAIN RIDGES
  // A. Grand Elevated Plateau Shelf (x: 10..22, z: -7..-18)
  // Broad, stable fortress terrace centered around (15.5, -12.0)
  const dxPlat = (x - 15.5) / 9.5;
  const dzPlat = (z - (-12.0)) / 8.0;
  const platEllipticalDist = Math.hypot(dxPlat, dzPlat);

  let plateauWeight = 0;
  if (platEllipticalDist < 1.0) {
    const t = platEllipticalDist;
    plateauWeight = Math.cos(t * (Math.PI / 2));
  }

  // B. Winding Mountain Road (Gradual switchback incline from valley floor to plateau gate)
  const roadWaypoints = [
    { x: 3.0, z: 2.0, y: 2.0 },
    { x: 4.5, z: 0.0, y: 3.2 },
    { x: 7.0, z: -2.0, y: 5.2 },
    { x: 9.2, z: -4.2, y: 7.2 },
    { x: 11.2, z: -6.5, y: 9.0 },
    { x: 13.0, z: -8.8, y: 10.6 },
    { x: 14.5, z: -10.5, y: 11.4 },
    { x: 15.5, z: -11.5, y: 11.8 },
  ];

  let minRoadDist = 999;
  let targetRoadY = 0;
  for (let i = 0; i < roadWaypoints.length - 1; i++) {
    const p1 = roadWaypoints[i];
    const p2 = roadWaypoints[i + 1];
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const lenSq = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (z - p1.z) * dz) / lenSq));
    const projX = p1.x + t * dx;
    const projZ = p1.z + t * dz;
    const d = Math.hypot(x - projX, z - projZ);
    if (d < minRoadDist) {
      minRoadDist = d;
      targetRoadY = p1.y + t * (p2.y - p1.y);
    }
  }

  // C. Higher Mountain Ridges Framing the Castle from Behind (Northeast Crescent)
  const p1Dist = Math.hypot(x - 32, z - (-30));
  const p2Dist = Math.hypot(x - 22, z - (-40));
  const p3Dist = Math.hypot(x - 40, z - (-20));

  let mountainMass = 0;
  if (p1Dist < 26) {
    const t = 1 - p1Dist / 26;
    mountainMass = Math.max(mountainMass, Math.pow(t, 1.4) * 54.0);
  }
  if (p2Dist < 24) {
    const t = 1 - p2Dist / 24;
    mountainMass = Math.max(mountainMass, Math.pow(t, 1.3) * 46.0);
  }
  if (p3Dist < 25) {
    const t = 1 - p3Dist / 25;
    mountainMass = Math.max(mountainMass, Math.pow(t, 1.3) * 44.0);
  }

  // Crag and rocky ridge detail
  if (mountainMass > 2) {
    const crag = Math.sin(x * 0.22) * Math.cos(z * 0.25) * 3.0 + Math.sin(x * 0.45 + z * 0.38) * 1.5;
    mountainMass += crag * Math.min(1, mountainMass / 14);
  }

  // Natural mountain shoulder rising from valley to the plateau
  const shoulderDist = Math.hypot(x - 18, z - (-15));
  if (shoulderDist < 18) {
    const st = 1 - shoulderDist / 18;
    h += (st * st) * 10.0;
  }

  h += mountainMass;

  // Flatten the broad plateau terrace around 11.8m
  if (plateauWeight > 0) {
    const pBlend = Math.pow(plateauWeight, 0.7);
    h = h * (1 - pBlend) + 11.8 * pBlend;
  }

  // Carve road ramp smoothly into mountain shoulder
  if (minRoadDist < 5.2 && x > 1.5 && z < 6.0) {
    const roadBlend = Math.cos((minRoadDist / 5.2) * (Math.PI / 2));
    const smoothBlend = roadBlend * roadBlend * (3 - 2 * roadBlend);
    h = h * (1 - smoothBlend * 0.90) + targetRoadY * (smoothBlend * 0.90);
  }

  // ── Echo Tree Ancient Grove Glade (x: -13.0, z: -1.5) ─────────────
  // A tranquil, ancient mossy clearing nestled above the river bank
  const dEchoTree = Math.hypot(x - (-13.0), z - (-1.5));
  if (dEchoTree < 6.8) {
    const gladeT = 1.0 - Math.min(1.0, dEchoTree / 6.8);
    const smoothGlade = gladeT * gladeT * (3 - 2 * gladeT);
    const targetGladeY = 2.4;
    h = h * (1.0 - smoothGlade * 0.85) + targetGladeY * (smoothGlade * 0.85);
  }

  // 8. Natural Boundary Enclosure (Perimeter Cliffs)
  const edgeDist = Math.max(Math.abs(x), Math.abs(z));
  if (edgeDist > 65) {
    const t = Math.min(1, (edgeDist - 65) / 45);
    const smoothT = t * t * (3 - 2 * t);
    const cliffHeight = smoothT * 36;
    const cliffNoise = (Math.sin(x * 0.11) * Math.cos(z * 0.11) + Math.sin(x * 0.23 + 1.2) * 0.5) * 6 * t;
    h += cliffHeight + cliffNoise;
  }

  return h;
}

/**
 * Returns true if this position is deep enough to be covered by the water plane.
 */
export function isWater(x: number, z: number): boolean {
  return getTerrainHeight(x, z) < 0;
}

/**
 * Calculates the horizontal distance in meters from (x, z) to the edge of the river.
 * Returns 0 if the position is directly within or over the river channel.
 */
export function getDistanceToRiver(x: number, z: number): number {
  if (z < -42) {
    const endX = -8.0 - (-42 - 5) * 0.08 + Math.sin((-42 - 5) * 0.12) * 0.6;
    return Math.hypot(x - endX, z - (-42));
  }
  if (z > 48) {
    const endX = -8.0 - (48 - 5) * 0.08 + Math.sin((48 - 5) * 0.12) * 0.6;
    return Math.hypot(x - endX, z - 48);
  }
  const riverCenterX = -8.0 - (z - 5) * 0.08 + Math.sin((z - 5) * 0.12) * 0.6;
  const distToCenter = Math.abs(x - riverCenterX);
  return Math.max(0, distToCenter - 2.5);
}

/**
 * Named locations for LLM context injection and fallback parser.
 * These are the canonical world landmarks covering all 7 interconnected zones.
 */
export const NAMED_LOCATIONS: Record<string, { x: number; z: number }> = {
  // Echo Tree (Ancient Timeline Anchor)
  'echo tree':       { x: -13, z: -1.5 },
  'the echo tree':   { x: -13, z: -1.5 },
  'ancient tree':    { x: -13, z: -1.5 },
  'timeline tree':   { x: -13, z: -1.5 },

  // Village Zone
  'village':      { x: 4,   z: 7  },
  'the village':  { x: 4,   z: 7  },
  'mill':         { x: 7,   z: 6  },
  'the mill':     { x: 7,   z: 6  },
  'cottage':      { x: 3,   z: 8  },
  'the cottage':  { x: 3,   z: 8  },

  // River & Bridge Zones
  'bridge':       { x: -8,  z: 5  },
  'the bridge':   { x: -8,  z: 5  },
  'river':        { x: -8,  z: 5  },
  'the river':    { x: -8,  z: 5  },

  // Ruins Zone (The Whispering Stones)
  'ruins':        { x: -6,  z: 12 },
  'the ruins':    { x: -6,  z: 12 },
  'whispering stones': { x: -4, z: 9 },
  'the whispering stones': { x: -4, z: 9 },
  'stones':       { x: -4,  z: 9  },

  // Forest Zone
  'forest':       { x: -18, z: -14 },
  'the forest':   { x: -18, z: -14 },
  'woods':        { x: -18, z: -14 },
  'the woods':    { x: -18, z: -14 },

  // Castle Zone (Suncrest Ridge)
  'castle':       { x: 18,  z: -14 },
  'the castle':   { x: 18,  z: -14 },
  'citadel':      { x: 18,  z: -14 },
  'mountain':     { x: 22,  z: -22 },
  'the mountain': { x: 22,  z: -22 },

  // Battle Area & Plains
  'battlefield':  { x: 12,  z: 10 },
  'battle area':  { x: 12,  z: 10 },
  'plains':       { x: 12,  z: 10 },
  'the plains':   { x: 12,  z: 10 },
  'clearing':     { x: 5,   z: -5 },

  // Western Pass & Hills
  'hill':         { x: -16, z: -10 },
  'the hill':     { x: -16, z: -10 },
  'shadow pass':  { x: -16, z: -10 },
  'valley':       { x: -10, z: 16 },
  'the valley':   { x: -10, z: 16 },

  // Cardinal Directions & Shortcuts
  'center':       { x: 0,   z: 0  },
  'the center':   { x: 0,   z: 0  },
  'north':        { x: 0,   z: -35 },
  'south':        { x: 0,   z: 35  },
  'east':         { x: 35,  z: 0   },
  'west':         { x: -35, z: 0   },
  'here':         { x: 0,   z: 0   },
  'there':        { x: 8,   z: -8  },
};

/** Simple deterministic pseudo-random number generator (LCG). */
export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) | 0;
    return (s >>> 0) / 4294967296;
  };
}
