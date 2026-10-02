import { useMemo } from 'react';
import { Instances, Instance } from '@react-three/drei';
import { getTerrainHeight, isWater, seededRandom } from '../core/terrain';
import { getToonGradient3, getToonGradient4 } from './StylizedMaterials';

type TreeType = 'pine' | 'oak' | 'birch' | 'autumn_oak';

interface TreeDatum {
  x: number;
  y: number;
  z: number;
  scale: number;
  type: TreeType;
}

const ROAD_WAYPOINTS = [
  { x: 4.0, z: 0.0 },
  { x: 7.0, z: -1.8 },
  { x: 10.0, z: -4.5 },
  { x: 13.0, z: -7.5 },
  { x: 15.5, z: -10.5 },
  { x: 17.5, z: -13.0 },
  { x: 18.0, z: -14.0 },
];

function isNearRoad(x: number, z: number): boolean {
  if (z > 1.0 || x < 1.0 || x > 22.0) return false;
  for (let i = 0; i < ROAD_WAYPOINTS.length - 1; i++) {
    const p1 = ROAD_WAYPOINTS[i];
    const p2 = ROAD_WAYPOINTS[i + 1];
    const dx = p2.x - p1.x;
    const dz = p2.z - p1.z;
    const lenSq = dx * dx + dz * dz;
    const t = Math.max(0, Math.min(1, ((x - p1.x) * dx + (z - p1.z) * dz) / lenSq));
    const px = p1.x + t * dx;
    const pz = p1.z + t * dz;
    if (Math.hypot(x - px, z - pz) < 3.2) return true;
  }
  return false;
}

function generateTrees(): TreeDatum[] {
  const rng = seededRandom(31337);
  const trees: TreeDatum[] = [];

  // Generate varied forest cover across the map
  for (let i = 0; i < 1100 && trees.length < 560; i++) {
    const x = (rng() - 0.5) * 192;
    const z = (rng() - 0.5) * 192;

    if (isWater(x, z)) continue;

    const h = getTerrainHeight(x, z);
    // Don't place trees on high sheer mountain peaks or above alpine line
    if (h > 21) continue;

    // Clear key zone spaces for gameplay, routes, and vistas
    // 1. Village plaza & farm
    if (x > -2 && x < 12 && z > 1 && z < 13) continue;
    // 2. River bridge crossing & river channel
    if (Math.hypot(x - (-8), z - 5) < 7.5) continue;
    const riverCenterX = -8.0 - (z - 5) * 0.08;
    if (Math.abs(x - riverCenterX) < 3.0 && z > -35 && z < 40) continue;
    // 3. Whispering Stones ruins sanctuary
    if (Math.hypot(x - (-4.5), z - 9.5) < 8.0) continue;
    // 4. Suncrest Castle courtyard & plateau
    if (Math.hypot(x - 17.5, z - (-13.5)) < 9.0) continue;
    // 5. Open Battle arena clearing
    if (x > 8 && x < 24 && z > 4 && z < 18) continue;
    // 6. Central crossroads clearing
    if (Math.hypot(x, z) < 6.5) continue;
    // 7. Mountain switchback road
    if (isNearRoad(x, z)) continue;
    // 8. Echo Tree Ancient Glade (only the singular Echo Tree stands here)
    if (Math.hypot(x - (-13.0), z - (-1.5)) < 7.2) continue;

    const edgeDist = Math.max(Math.abs(x), Math.abs(z));
    const isPerimeter = edgeDist >= 68 && edgeDist <= 92;
    const isForestZone = x < -10 && x > -55 && z < -4 && z > -55;

    let spawnProbability = 0.24;
    if (isPerimeter) {
      spawnProbability = 0.85;
    } else if (isForestZone) {
      spawnProbability = 0.80;
    }

    if (rng() > spawnProbability) continue;

    // Species distribution:
    // Higher elevations & perimeter: alpine pines
    // Forest core: mix of ancient oaks, golden oaks, and birch
    // Meadows: scattered birch and flowering oaks
    const typeRoll = rng();
    let type: TreeType = 'pine';
    if (h > 12 || isPerimeter) {
      type = 'pine';
    } else if (isForestZone) {
      if (typeRoll < 0.40) type = 'pine';
      else if (typeRoll < 0.70) type = 'oak';
      else if (typeRoll < 0.88) type = 'birch';
      else type = 'autumn_oak';
    } else {
      if (typeRoll < 0.35) type = 'oak';
      else if (typeRoll < 0.70) type = 'birch';
      else if (typeRoll < 0.88) type = 'autumn_oak';
      else type = 'pine';
    }

    trees.push({
      x,
      y: h,
      z,
      scale: isPerimeter ? 0.9 + rng() * 1.1 : 0.75 + rng() * 0.75,
      type,
    });
  }

  return trees;
}

export default function Trees() {
  const trees = useMemo(generateTrees, []);
  const pines = useMemo(() => trees.filter((t) => t.type === 'pine'), [trees]);
  const oaks = useMemo(() => trees.filter((t) => t.type === 'oak'), [trees]);
  const birches = useMemo(() => trees.filter((t) => t.type === 'birch'), [trees]);
  const autumnOaks = useMemo(() => trees.filter((t) => t.type === 'autumn_oak'), [trees]);

  const toonRamp3 = useMemo(() => getToonGradient3(), []);
  const toonRamp4 = useMemo(() => getToonGradient4(), []);

  return (
    <group>
      {/* ─── 1. Pine Trunks & Canopies ──────────────────────── */}
      <Instances limit={350} receiveShadow>
        <cylinderGeometry args={[0.1, 0.18, 1.6, 6]} />
        <meshToonMaterial color="#3b200c" gradientMap={toonRamp3} />
        {pines.map((t, i) => (
          <Instance key={`pt-${i}`} position={[t.x, t.y + 0.8 * t.scale, t.z]} scale={t.scale} />
        ))}
      </Instances>

      {/* Pine Lower Canopy Tier */}
      <Instances limit={350} castShadow>
        <coneGeometry args={[1.05, 3.0, 7]} />
        <meshToonMaterial color="#1c4520" gradientMap={toonRamp4} />
        {pines.map((t, i) => (
          <Instance key={`pf1-${i}`} position={[t.x, t.y + 2.8 * t.scale, t.z]} scale={t.scale} />
        ))}
      </Instances>

      {/* Pine Upper Canopy Tier */}
      <Instances limit={350} castShadow>
        <coneGeometry args={[0.7, 2.2, 7]} />
        <meshToonMaterial color="#265a2c" gradientMap={toonRamp4} />
        {pines.map((t, i) => (
          <Instance key={`pf2-${i}`} position={[t.x, t.y + 4.2 * t.scale, t.z]} scale={t.scale} />
        ))}
      </Instances>

      {/* ─── 2. Ancient Oak Trunks & Lush Canopies ─────────── */}
      <Instances limit={120} receiveShadow>
        <cylinderGeometry args={[0.2, 0.3, 2.2, 7]} />
        <meshToonMaterial color="#321a08" gradientMap={toonRamp3} />
        {oaks.map((t, i) => (
          <Instance key={`ot-${i}`} position={[t.x, t.y + 1.1 * t.scale, t.z]} scale={t.scale} />
        ))}
      </Instances>

      <Instances limit={120} castShadow>
        <dodecahedronGeometry args={[1.4, 1]} />
        <meshToonMaterial color="#36742c" gradientMap={toonRamp4} />
        {oaks.map((t, i) => (
          <Instance key={`of-${i}`} position={[t.x, t.y + 3.6 * t.scale, t.z]} scale={t.scale} />
        ))}
      </Instances>

      {/* ─── 3. Slender Birch Trunks & Golden Foliage ────────── */}
      {/* Birch Pale Bark Trunk */}
      <Instances limit={120} receiveShadow>
        <cylinderGeometry args={[0.08, 0.12, 2.4, 6]} />
        <meshToonMaterial color="#dbe2d6" gradientMap={toonRamp3} />
        {birches.map((t, i) => (
          <Instance key={`bt-${i}`} position={[t.x, t.y + 1.2 * t.scale, t.z]} scale={t.scale} />
        ))}
      </Instances>

      {/* Birch Lime-Golden Leaves */}
      <Instances limit={120} castShadow>
        <dodecahedronGeometry args={[1.05, 1]} />
        <meshToonMaterial color="#6fa828" gradientMap={toonRamp4} />
        {birches.map((t, i) => (
          <Instance key={`bf-${i}`} position={[t.x, t.y + 3.4 * t.scale, t.z]} scale={t.scale} />
        ))}
      </Instances>

      {/* ─── 4. Warm Autumn Amber Oaks ─────────────────────── */}
      <Instances limit={80} receiveShadow>
        <cylinderGeometry args={[0.18, 0.26, 2.0, 6]} />
        <meshToonMaterial color="#321a08" gradientMap={toonRamp3} />
        {autumnOaks.map((t, i) => (
          <Instance key={`aot-${i}`} position={[t.x, t.y + 1.0 * t.scale, t.z]} scale={t.scale} />
        ))}
      </Instances>

      <Instances limit={80} castShadow>
        <dodecahedronGeometry args={[1.35, 1]} />
        <meshToonMaterial color="#bd7722" gradientMap={toonRamp4} />
        {autumnOaks.map((t, i) => (
          <Instance key={`aof-${i}`} position={[t.x, t.y + 3.4 * t.scale, t.z]} scale={t.scale} />
        ))}
      </Instances>
    </group>
  );
}
