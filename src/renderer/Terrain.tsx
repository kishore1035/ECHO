import { useMemo } from 'react';
import * as THREE from 'three';
import { getTerrainHeight, seededRandom } from '../core/terrain';
import { getToonGradient4 } from './StylizedMaterials';

// ─── Geological & Slope-Aware Cel-Animation Palette ────────────

const ROAD_WAYPOINTS = [
  { x: 3.0, z: 2.0 },
  { x: 4.5, z: 0.0 },
  { x: 7.0, z: -2.0 },
  { x: 9.2, z: -4.2 },
  { x: 11.2, z: -6.5 },
  { x: 13.0, z: -8.8 },
  { x: 14.5, z: -10.5 },
  { x: 15.5, z: -11.5 },
];

function getDistanceToRoad(x: number, z: number): number {
  if (z > 3.0 || x < 1.0 || x > 22.0) return 999;
  let minD = 999;
  for (let i = 0; i < ROAD_WAYPOINTS.length - 1; i++) {
    const p1 = ROAD_WAYPOINTS[i];
    const p2 = ROAD_WAYPOINTS[i + 1];
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const lenSq = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (z - p1.z) * dz) / lenSq));
    const px = p1.x + t * dx;
    const pz = p1.z + t * dz;
    const d = Math.hypot(x - px, z - pz);
    if (d < minD) minD = d;
  }
  return minD;
}

function surfaceToColor(h: number, x: number, z: number, ny: number, rngJitter: number): THREE.Color {
  const c = new THREE.Color();

  // 1. Steep Geological Cliffs & Crags (ny is vertical normal: 1.0 = flat, 0.0 = sheer wall)
  const isSheerCliff = ny < 0.68;
  const isSteepSlope = ny < 0.80;

  if (isSheerCliff) {
    if (h > 36.0) {
      c.set('#484e5a'); // Dark frosted alpine summit rock
    } else if (h > 18.0) {
      // Stratified granite mountain crags
      const strata = Math.sin(h * 1.8) * 0.04;
      c.set(strata > 0 ? '#635e56' : '#544f48');
    } else {
      c.set('#6a6358'); // Warm valley canyon / foothill limestone
    }
    return c;
  }

  // 2. High Alpine Peaks & Snow Caps
  if (h >= 38.0) {
    // Snow caps on highest peaks, frosted rocks on edges
    if (ny > 0.74 && h > 41.0) {
      c.set('#edf4fc'); // Pure high-altitude snow cap
    } else {
      c.set('#8c94a0'); // Frost-dusted alpine scree
    }
    return c;
  }

  // 3. High Mountain Scree & Ridge Transitions
  if (h >= 24.0) {
    c.set('#787268'); // Weathered mountain granite
    return c;
  }

  // 4. Steep Foothills / Mountain Rocky Slopes
  if (isSteepSlope) {
    if (h > 12.0) {
      c.set('#6b6555'); // Castle mountain flank rock
    } else {
      c.set('#5f6b4a'); // Rocky hillside moss
    }
    return c;
  }

  // 5. Authored Mountain Road / Pathway (trampled gravel & stone)
  const roadDist = getDistanceToRoad(x, z);
  if (roadDist < 1.6) {
    c.set('#786b55'); // Warm stone dust road
    return c;
  }

  // 6. Riverbed and Shoreline
  if (h < 0.08) {
    c.set('#24464f'); // Deep river bed stones & silt
    return c;
  }
  if (h < 0.75) {
    c.set('#3a683a'); // Riverbank wetland & lush waterside turf
    return c;
  }

  // 7. Whispering Stones Sanctuary (Ancient sacred knoll)
  if (x > -14 && x < -2 && z > 6 && z < 18) {
    c.set('#3a6a48'); // Sacred moss turf
    return c;
  }

  // 8. Broad Castle Stronghold Plateau (y ~ 11.8m)
  const isPlateauTerrace = h > 10.5 && h < 13.5 && x > 10.0 && x < 22.0 && z < -6.5 && z > -18.5;
  if (isPlateauTerrace) {
    c.set('#6a6c62'); // Fortified stone courtyard & weathered alpine grass
    return c;
  }

  // 9. Highland / Mountain Shoulder Meadows
  if (h > 11.0) {
    c.set('#527042'); // High mountain turf
    return c;
  }

  // 10. Forest & Foothills
  if (h > 5.5) {
    c.set('#366834'); // Pine knolls and shaded forest edge
    return c;
  }

  // 11. Vibrant Lower Valley & Village Meadow
  c.set('#50a042'); // Rich warm meadow grass

  if (rngJitter !== 0) {
    c.r = Math.max(0, Math.min(1, c.r + rngJitter * 0.3));
    c.g = Math.max(0, Math.min(1, c.g + rngJitter * 0.4));
    c.b = Math.max(0, Math.min(1, c.b + rngJitter * 0.2));
  }

  return c;
}

export default function Terrain() {
  const geometry = useMemo(() => {
    // Total boundary 250x250 game units (playable core ~200x200)
    const SEGMENTS = 160;
    const SIZE = 250;

    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position as THREE.BufferAttribute;
    const rng = seededRandom(99);

    // 1. Displace vertices by authoritative height function
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = getTerrainHeight(x, z);
      pos.setY(i, h);
    }

    // 2. Compute accurate vertex normals for steep cliff detection
    geo.computeVertexNormals();

    const norm = geo.attributes.normal as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);

    // 3. Assign rich painterly cel colors based on height, slope angle, and biomes
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const h = pos.getY(i);
      const ny = norm.getY(i);

      const jitter = (rng() - 0.5) * 0.06;
      const col = surfaceToColor(h, x, z, ny, jitter);

      colors[i * 3]     = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    pos.needsUpdate = true;

    return geo;
  }, []);

  const toonRamp = useMemo(() => getToonGradient4(), []);

  return (
    <>
      {/* Main terrain with discrete cel-shading light bands */}
      <mesh geometry={geometry} receiveShadow castShadow={false}>
        <meshToonMaterial
          vertexColors
          gradientMap={toonRamp}
        />
      </mesh>
    </>
  );
}
