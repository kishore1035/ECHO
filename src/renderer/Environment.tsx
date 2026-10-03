// ============================================================
// ENVIRONMENT DRESSING — Stylized Cel-Shaded World Dressing
// Adds rocks, grass tufts, wildflowers, ferns, river details,
// and distant mountain silhouettes using discrete toon shading.
// All scatter meshes use instancing for high 60fps performance.
// ============================================================

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { getTerrainHeight, isWater, seededRandom } from '../core/terrain';

import ZoneLandmarks from './ZoneLandmarks';
import EchoVFX from './EchoVFX';
import PhysicalProps from './PhysicalProps';
import { useWorldStore } from '../core/WorldState';
import {
  getStylizedWaterTexture,
  getStylizedWaterFoamTexture,
  getStylizedCausticsTexture,
  getStylizedStoneTexture,
  getStylizedWoodTexture,
  getToonGradient3,
  getToonGradient4,
} from './StylizedMaterials';

// ─── Scatter Helper ────────────────────────────────────────────

interface Datum { x: number; y: number; z: number; scale: number; ry: number }

function useScatter(seed: number, count: number, minH: number, maxH: number, clearRadius = 5): Datum[] {
  return useMemo(() => {
    const rng = seededRandom(seed);
    const result: Datum[] = [];
    for (let i = 0; i < count * 5 && result.length < count; i++) {
      const x = (rng() - 0.5) * 185;
      const z = (rng() - 0.5) * 185;
      if (isWater(x, z)) continue;
      const h = getTerrainHeight(x, z);
      if (h < minH || h > maxH) continue;
      if (Math.sqrt(x * x + z * z) < clearRadius) continue;
      result.push({ x, y: h, z, scale: 0.4 + rng() * 1.0, ry: rng() * Math.PI * 2 });
    }
    return result;
  }, [seed, count, minH, maxH, clearRadius]);
}

// ─── Cel-Shaded Rocks ──────────────────────────────────────────

function RockField() {
  const rocks = useScatter(11111, 140, 0.5, 14, 5);
  const toonRamp = useMemo(() => getToonGradient4(), []);
  return (
    <Instances limit={150} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshToonMaterial color="#7a7468" gradientMap={toonRamp} />
      {rocks.map((r, i) => (
        <Instance
          key={i}
          position={[r.x, r.y + r.scale * 0.28, r.z]}
          rotation={[0.2, r.ry, 0.1]}
          scale={[r.scale * 0.9, r.scale * 0.6, r.scale]}
        />
      ))}
    </Instances>
  );
}

// ─── Small Rocks (clusters) ─────────────────────────────────────

function SmallRocks() {
  const rocks = useScatter(22222, 220, 0, 12, 4);
  const toonRamp = useMemo(() => getToonGradient4(), []);
  return (
    <Instances limit={240} receiveShadow>
      <dodecahedronGeometry args={[0.22, 0]} />
      <meshToonMaterial color="#6b645e" gradientMap={toonRamp} />
      {rocks.map((r, i) => (
        <Instance
          key={i}
          position={[r.x, r.y + 0.1, r.z]}
          rotation={[r.ry * 0.5, r.ry, 0]}
          scale={[r.scale * 0.5 + 0.2, r.scale * 0.3 + 0.1, r.scale * 0.5 + 0.2]}
        />
      ))}
    </Instances>
  );
}

// ─── Grass Tufts ───────────────────────────────────────────────

function GrassTufts() {
  const tufts = useScatter(33333, 320, 0.5, 6, 6);
  const toonRamp = useMemo(() => getToonGradient3(), []);
  const color = '#3d6b32';
  return (
    <Instances limit={340}>
      <boxGeometry args={[0.65, 0.55, 0.04]} />
      <meshToonMaterial color={color} gradientMap={toonRamp} side={THREE.DoubleSide} />
      {tufts.map((t, i) => (
        <Instance
          key={i}
          position={[t.x, t.y + 0.24, t.z]}
          rotation={[0, t.ry, 0]}
          scale={[0.6 + t.scale * 0.4, 0.7 + t.scale * 0.4, 1]}
        />
      ))}
    </Instances>
  );
}

// ─── Wildflowers (colorful painterly dots in grassland) ─────────

const FLOWER_COLORS = ['#e85c7a', '#f9c440', '#6ec6f5', '#f5a0d5', '#fffac0'];

function Wildflowers() {
  const flowers = useScatter(44444, 200, 1, 5.5, 8);
  const toonRamp = useMemo(() => getToonGradient3(), []);
  return (
    <>
      {FLOWER_COLORS.map((col, ci) => (
        <Instances key={ci} limit={60}>
          <sphereGeometry args={[0.12, 5, 4]} />
          <meshToonMaterial color={col} emissive={col} emissiveIntensity={0.25} gradientMap={toonRamp} />
          {flowers
            .filter((_, fi) => fi % FLOWER_COLORS.length === ci)
            .map((f, i) => (
              <Instance
                key={i}
                position={[f.x + (Math.sin(f.ry) * 0.4), f.y + 0.4, f.z + (Math.cos(f.ry) * 0.4)]}
                scale={0.7 + f.scale * 0.5}
              />
            ))}
        </Instances>
      ))}
    </>
  );
}

// ─── Mountain Silhouettes (distant, far-clip cartoon backdrop) ─

function MountainBackdrop() {
  const toonRamp = useMemo(() => getToonGradient4(), []);
  const peaks = useMemo(() => {
    const rng = seededRandom(55555);
    return Array.from({ length: 22 }, (_, i) => {
      const angle = (i / 22) * Math.PI * 2;
      const dist = 145 + rng() * 25;
      return {
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        height: 38 + rng() * 32,
        scale: 24 + rng() * 16,
        ry: rng() * Math.PI,
      };
    });
  }, []);

  return (
    <group>
      {peaks.map((p, i) => (
        <mesh key={i} position={[p.x, p.height * 0.42, p.z]} rotation={[0, p.ry, 0]}>
          <coneGeometry args={[p.scale, p.height, 5]} />
          <meshToonMaterial color="#2d3444" gradientMap={toonRamp} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Cel-Shaded Flowing River Surface with Wave Displacement ───

// Sine-wave vertex shader — displaces Y based on world position + time.
// Keeps the cel-shaded look while giving the river visible life.
const waterVertexShader = /* glsl */`
  uniform float uTime;
  uniform float uStormMult;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 pos = position;
    float wave1 = sin(pos.x * 0.18 + uTime * 1.1) * 0.055;
    float wave2 = sin(pos.y * 0.22 + uTime * 0.85 + 1.4) * 0.035;
    float wave3 = cos((pos.x + pos.y) * 0.14 + uTime * 0.65) * 0.025;
    pos.z += (wave1 + wave2 + wave3) * (1.0 + uStormMult * 1.6);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const waterFragmentShader = /* glsl */`
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec4 texColor = texture2D(uMap, vUv);
    gl_FragColor = vec4(mix(uColor, texColor.rgb, 0.55), uOpacity);
  }
`;

function AnimatedWater() {
  const waveMatRef = useRef<THREE.ShaderMaterial>(null!);
  const foamMatRef = useRef<THREE.MeshBasicMaterial>(null!);
  const causticsMatRef = useRef<THREE.MeshBasicMaterial>(null!);
  const weatherType = useWorldStore((s) => s.weather.type);
  const isStormOrRain = weatherType === 'rain' || weatherType === 'storm';

  const waterTex = useMemo(() => {
    const t = getStylizedWaterTexture();
    t.repeat.set(20, 20);
    return t;
  }, []);

  const foamTex = useMemo(() => {
    const t = getStylizedWaterFoamTexture();
    t.repeat.set(12, 12);
    return t;
  }, []);

  const causticsTex = useMemo(() => {
    const t = getStylizedCausticsTexture();
    t.repeat.set(8, 8);
    return t;
  }, []);

  const waterUniforms = useMemo(() => ({
    uTime: { value: 0 },
    uStormMult: { value: 0 },
    uMap: { value: waterTex },
    uColor: { value: new THREE.Color('#2274b8') },
    uOpacity: { value: 0.88 },
  }), [waterTex]);

  useFrame((_, delta) => {
    const speedMult = isStormOrRain ? 2.4 : 1.0;
    waterUniforms.uTime.value += delta;
    waterUniforms.uStormMult.value = THREE.MathUtils.lerp(
      waterUniforms.uStormMult.value,
      isStormOrRain ? 1.0 : 0.0,
      delta * 1.5
    );
    waterUniforms.uColor.value.set(isStormOrRain ? '#1a5c95' : '#2274b8');

    if (waterTex) {
      waterTex.offset.x += delta * 0.025 * speedMult;
      waterTex.offset.y += delta * 0.015 * speedMult;
    }
    if (foamTex) {
      foamTex.offset.x -= delta * 0.012 * speedMult;
      foamTex.offset.y += delta * 0.018 * speedMult;
    }
    if (causticsTex) {
      // Caustics scroll perpendicular to flow — gives shimmering dapple
      causticsTex.offset.x += delta * 0.018 * speedMult;
      causticsTex.offset.y -= delta * 0.022 * speedMult;
    }
  });

  return (
    <group position={[0, -0.05, 0]}>
      {/* ── Main Flowing Wave-Displaced River Surface ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <planeGeometry args={[250, 250, 18, 18]} />
        <shaderMaterial
          ref={waveMatRef}
          vertexShader={waterVertexShader}
          fragmentShader={waterFragmentShader}
          uniforms={waterUniforms}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* ── Riverbed Caustics Projector (y = -0.5, additive) ── */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={0}>
        <planeGeometry args={[250, 250, 1, 1]} />
        <meshBasicMaterial
          ref={causticsMatRef}
          map={causticsTex}
          color="#60c8f8"
          transparent
          opacity={isStormOrRain ? 0.08 : 0.14}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ── Shoreline Foam Shimmer Layer ── */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
        <planeGeometry args={[250, 250, 1, 1]} />
        <meshBasicMaterial
          ref={foamMatRef}
          map={foamTex}
          color="#d8f8ff"
          transparent
          opacity={isStormOrRain ? 0.60 : 0.38}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Player Water Wake ──────────────────────────────────────────
// Spawns expanding ring meshes when player wades or swims.
// Each ring grows outward and fades over ~1.2s, then resets.

const WAKE_RINGS = 3;

function PlayerWake() {
  const ringRefs = useRef<(THREE.Mesh | null)[]>(Array(WAKE_RINGS).fill(null));
  const ringStates = useRef(
    Array.from({ length: WAKE_RINGS }, (_, i) => ({
      active: false,
      x: 0,
      z: 0,
      age: 0,
      delay: i * 0.4,
      nextSpawn: i * 0.4,
    }))
  );

  useFrame((_, delta) => {
    const player = useWorldStore.getState().player;
    const waterState = player.waterState || 'none';
    const inWater = waterState === 'swimming' || waterState === 'shallow' || waterState === 'underwater';
    const px = player.position.x;
    const pz = player.position.z;
    const WATER_Y = 0.04;

    for (let i = 0; i < WAKE_RINGS; i++) {
      const st = ringStates.current[i];
      const mesh = ringRefs.current[i];
      if (!mesh) continue;

      if (!st.active) {
        if (inWater) {
          st.nextSpawn -= delta;
          if (st.nextSpawn <= 0) {
            st.active = true;
            st.x = px;
            st.z = pz;
            st.age = 0;
            st.nextSpawn = 1.2;
          }
        }
        mesh.visible = false;
        continue;
      }

      st.age += delta;
      const life = 1.2;
      const t = Math.min(st.age / life, 1.0);
      const scale = 0.3 + t * 2.8;
      const opacity = (1 - t) * 0.55;

      mesh.position.set(st.x, WATER_Y, st.z);
      mesh.scale.set(scale, 1, scale);
      mesh.visible = true;
      (mesh.material as THREE.MeshBasicMaterial).opacity = opacity;

      if (t >= 1.0) {
        st.active = false;
        st.nextSpawn = inWater ? 0 : 1.2;
        mesh.visible = false;
      }
    }
  });

  return (
    <group>
      {Array.from({ length: WAKE_RINGS }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => { ringRefs.current[i] = el; }}
          rotation={[-Math.PI / 2, 0, 0]}
          visible={false}
        >
          <ringGeometry args={[0.85, 1.0, 24]} />
          <meshBasicMaterial
            color="#b8eeff"
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}


// ─── Firefly Particles (night only) ────────────────────────────

const FIREFLY_COUNT = 80;

function Fireflies() {
  const pointsRef = useRef<THREE.Points>(null!);
  const t = useRef(0);

  const positions = useMemo(() => {
    const p = new Float32Array(FIREFLY_COUNT * 3);
    const rng = seededRandom(66666);
    for (let i = 0; i < FIREFLY_COUNT; i++) {
      p[i * 3]     = (rng() - 0.5) * 60;
      p[i * 3 + 1] = rng() * 3 + 0.5;
      p[i * 3 + 2] = (rng() - 0.5) * 60;
    }
    return p;
  }, []);

  useFrame((_, delta) => {
    t.current += delta;
    if (!pointsRef.current) return;
    pointsRef.current.position.y = Math.sin(t.current * 0.8) * 0.35;
    pointsRef.current.rotation.y += delta * 0.04;
    if (pointsRef.current.material) {
      (pointsRef.current.material as THREE.PointsMaterial).opacity =
        0.5 + Math.sin(t.current * 3) * 0.3;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#b0ff70"
        size={0.18}
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// ─── Fern Bushes ───────────────────────────────────────────────

function Ferns() {
  const ferns = useScatter(77777, 120, 1, 5, 7);
  const toonRamp = useMemo(() => getToonGradient3(), []);
  return (
    <Instances limit={130} receiveShadow>
      <sphereGeometry args={[0.5, 6, 4]} />
      <meshToonMaterial color="#2a5c22" gradientMap={toonRamp} side={THREE.DoubleSide} />
      {ferns.map((f, i) => (
        <Instance
          key={i}
          position={[f.x, f.y + 0.3, f.z]}
          rotation={[0, f.ry, 0]}
          scale={[0.8 + f.scale * 0.4, 0.5 + f.scale * 0.3, 0.8 + f.scale * 0.4]}
        />
      ))}
    </Instances>
  );
}

// ─── Natural Riverbanks & Riverside Props ─────────────────────

function RiverDetails() {
  const toonRamp = useMemo(() => getToonGradient3(), []);
  const woodTex = useMemo(() => getStylizedWoodTexture('#5c381c', '#38200d'), []);

  const riverPebbles = [
    { x: -7.2, z: 2.2, s: 0.45 },
    { x: -6.8, z: 3.5, s: 0.35 },
    { x: -9.5, z: 2.8, s: 0.5 },
    { x: -8.8, z: 7.2, s: 0.4 },
    { x: -6.5, z: 8.5, s: 0.55 },
    { x: -10.2, z: 9.8, s: 0.38 },
    { x: -5.8, z: 12.0, s: 0.42 },
    { x: -9.2, z: 14.5, s: 0.48 },
  ];

  const reedClusters = [
    { x: -6.4, z: 1.5 },
    { x: -9.8, z: 1.8 },
    { x: -6.2, z: 6.8 },
    { x: -10.0, z: 7.5 },
    { x: -5.5, z: 10.5 },
    { x: -9.5, z: 12.8 },
  ];

  const lilyPads = [
    { x: -7.6, z: 1.8, rot: 0.2 },
    { x: -8.4, z: 2.4, rot: 1.1 },
    { x: -7.8, z: 7.8, rot: 2.3 },
    { x: -8.6, z: 8.6, rot: 0.7 },
  ];

  return (
    <group>
      {/* ── Riverbank Rounded Stones ── */}
      {riverPebbles.map((p, i) => (
        <mesh
          key={`r-peb-${i}`}
          position={[p.x, getTerrainHeight(p.x, p.z) + p.s * 0.2, p.z]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[p.s, 1]} />
          <meshToonMaterial color="#505660" gradientMap={toonRamp} />
        </mesh>
      ))}

      {/* ── River Reeds / Cattails ── */}
      {reedClusters.map((rc, i) => {
        const y = getTerrainHeight(rc.x, rc.z);
        return (
          <group key={`reed-${i}`} position={[rc.x, y, rc.z]}>
            {[-0.15, 0, 0.15].map((off, ri) => (
              <group key={`stk-${ri}`} position={[off, 0, (ri % 2) * 0.1]} rotation={[0.05 * ri, ri * 0.8, -0.04 * ri]}>
                <mesh position={[0, 0.5, 0]} castShadow>
                  <cylinderGeometry args={[0.02, 0.03, 1.0, 4]} />
                  <meshToonMaterial color="#3b6828" gradientMap={toonRamp} />
                </mesh>
                <mesh position={[0, 0.9, 0]} castShadow>
                  <cylinderGeometry args={[0.04, 0.04, 0.28, 5]} />
                  <meshToonMaterial color="#4a2e16" gradientMap={toonRamp} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}

      {/* ── Floating Water Lily Pads ── */}
      {lilyPads.map((lp, i) => (
        <group key={`lily-${i}`} position={[lp.x, 0.02, lp.z]} rotation={[0, lp.rot, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.35, 7, 0, Math.PI * 1.85]} />
            <meshToonMaterial color="#2d7a36" gradientMap={toonRamp} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0.08, 0.04, 0.06]}>
            <coneGeometry args={[0.08, 0.1, 5]} />
            <meshToonMaterial color="#fff0f5" gradientMap={toonRamp} />
          </mesh>
        </group>
      ))}

      {/* ── Rustic Riverside Boat Dock & Rowboat ── */}
      <group position={[-6.2, 0.2, 3.8]} rotation={[0, -0.25, 0]}>
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.16, 3.2]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        {[-0.65, 0.65].map((px, pi) => (
          <group key={`dock-p-${pi}`}>
            <mesh position={[px, 0.4, -1.4]} castShadow>
              <cylinderGeometry args={[0.08, 0.1, 1.2, 6]} />
              <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
            </mesh>
            <mesh position={[px, 0.4, 1.4]} castShadow>
              <cylinderGeometry args={[0.08, 0.1, 1.2, 6]} />
              <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
            </mesh>
          </group>
        ))}
        {/* Rowboat tied to dock */}
        <group position={[-1.4, -0.15, 0.4]} rotation={[0, 0.2, 0.08]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[1.1, 0.45, 2.2]} />
            <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[0.95, 0.06, 0.35]} />
            <meshToonMaterial color="#422915" gradientMap={toonRamp} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ─── Mountain Waterfall & Foothill Cascade ────────────────────

function MountainCascade() {
  const toonRamp = useMemo(() => getToonGradient3(), []);
  const foamTex = useMemo(() => {
    const t = getStylizedWaterFoamTexture();
    t.repeat.set(2, 6);
    return t;
  }, []);
  const foamMatRef = useRef<THREE.MeshBasicMaterial>(null!);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (foamTex) {
      foamTex.offset.y -= delta * 1.8;
    }
  });

  // Mountain stream waterfall at northern gorge entering the river valley
  const cascX = -7.5;
  const cascZ = -22.0;
  const cascY = getTerrainHeight(cascX, cascZ);

  return (
    <group position={[cascX, cascY, cascZ]} rotation={[0, 0.1, 0]}>
      {/* ── Stepped Mossy Waterfall Boulders ── */}
      {[-1.4, 0, 1.4].map((bx, i) => (
        <mesh key={`casc-b-${i}`} position={[bx, 0.4, -0.6]} castShadow receiveShadow>
          <dodecahedronGeometry args={[1.1 + (i % 2) * 0.3, 0]} />
          <meshToonMaterial color="#4a5246" gradientMap={toonRamp} />
        </mesh>
      ))}

      {/* ── Cascading Rushing Water Sheet ── */}
      <mesh position={[0, 0.8, 0.2]} rotation={[0.7, 0, 0]}>
        <planeGeometry args={[2.8, 3.2]} />
        <meshToonMaterial
          color="#388ec4"
          gradientMap={toonRamp}
          transparent
          opacity={0.88}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* ── Frothing White Foam Spill ── */}
      <mesh position={[0, 0.82, 0.22]} rotation={[0.7, 0, 0]}>
        <planeGeometry args={[2.8, 3.2]} />
        <meshBasicMaterial
          ref={foamMatRef}
          map={foamTex}
          color="#e8f8ff"
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Splash pool foam circle at base */}
      <mesh position={[0, 0.05, 1.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.8, 10]} />
        <meshBasicMaterial
          color="#d2f2ff"
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─── Mountain Geological Crags & Road Cairns ──────────────────

function MountainGeology() {
  const toonRamp = useMemo(() => getToonGradient4(), []);
  const stoneTex = useMemo(() => getStylizedStoneTexture('#5a554c', '#38342e'), []);

  // Geological rock outcroppings lining the towering mountain massif behind the castle
  const mountainCrags = [
    { x: 23.5, z: -17.0, s: 3.5, rx: 0.3, ry: 0.8, rz: -0.2 },
    { x: 26.5, z: -21.0, s: 4.5, rx: -0.4, ry: 1.2, rz: 0.1 },
    { x: 21.0, z: -24.5, s: 4.2, rx: 0.2, ry: 0.4, rz: -0.3 },
    { x: 30.0, z: -26.0, s: 6.0, rx: 0.5, ry: 1.5, rz: 0.2 },
    { x: 34.0, z: -30.0, s: 7.2, rx: -0.3, ry: 0.9, rz: -0.1 },
    { x: 26.0, z: -14.0, s: 3.2, rx: 0.2, ry: 0.5, rz: 0.1 },
    { x: 29.0, z: -18.0, s: 4.8, rx: -0.2, ry: 1.1, rz: 0.3 },
  ];

  // Stone Trail Markers / Cairns guiding along the mountain switchback road
  const roadCairns = [
    { x: 4.8,  z: 0.0 },
    { x: 7.2,  z: -2.0 },
    { x: 9.8,  z: -4.8 },
    { x: 12.2, z: -7.5 },
    { x: 13.2, z: -8.6 },
  ];

  return (
    <group>
      {/* ── Massive Geological Crags on Mountain Massif ── */}
      {mountainCrags.map((c, i) => {
        const y = getTerrainHeight(c.x, c.z);
        return (
          <mesh
            key={`mtn-crag-${i}`}
            position={[c.x, y + c.s * 0.25, c.z]}
            rotation={[c.rx, c.ry, c.rz]}
            castShadow
            receiveShadow
          >
            <dodecahedronGeometry args={[c.s, 0]} />
            <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
          </mesh>
        );
      })}

      {/* ── Mountain Road Trail Cairns with Guiding Lanterns ── */}
      {roadCairns.map((rn, i) => {
        const y = getTerrainHeight(rn.x, rn.z);
        return (
          <group key={`cairn-${i}`} position={[rn.x, y, rn.z]}>
            {/* Base stones */}
            <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
              <dodecahedronGeometry args={[0.38, 0]} />
              <meshToonMaterial color="#655e54" gradientMap={toonRamp} />
            </mesh>
            {/* Middle stone */}
            <mesh position={[0.04, 0.6, 0.02]} castShadow receiveShadow>
              <dodecahedronGeometry args={[0.26, 0]} />
              <meshToonMaterial color="#736b60" gradientMap={toonRamp} />
            </mesh>
            {/* Top stone */}
            <mesh position={[-0.02, 0.9, 0.01]} castShadow>
              <dodecahedronGeometry args={[0.18, 0]} />
              <meshToonMaterial color="#82786c" gradientMap={toonRamp} />
            </mesh>
            {/* Guiding Warm Torch / Lantern atop Cairn */}
            <mesh position={[0, 1.15, 0]}>
              <boxGeometry args={[0.15, 0.22, 0.15]} />
              <meshToonMaterial color="#ffc455" emissive="#ff9812" emissiveIntensity={0.8} gradientMap={toonRamp} />
            </mesh>
            {/* Single representative waypoint point light along the trail */}
            {i === 2 && (
              <pointLight position={[0, 1.25, 0]} color="#ffa835" intensity={0.8} distance={10} />
            )}
          </group>
        );
      })}
    </group>
  );
}

// ─── Landmarks & Interconnected Trails ─────────────────────────

function Landmarks() {
  const toonRamp = useMemo(() => getToonGradient3(), []);
  const stoneTex = useMemo(() => getStylizedStoneTexture('#5e646c', '#3c4046'), []);

  const pathTiles = [
    [-0.5, 6.5], [-2.5, 6.0], [-4.5, 5.5], [-6.5, 5.2],
    [-9.5, 4.8], [-11.0, 3.8],
    [-12.5, 1.5], [-14.0, -1.5], [-15.5, -5.0], [-17.0, -9.0], [-18.0, -13.0],
    [-9.0, 7.5], [-7.5, 9.5], [-6.5, 11.5],
    [4.0, 5.5], [6.5, 4.5], [9.0, 3.0], [11.5, 1.5],
    // Mountain Castle Switchback Ascent Trail (Village to Castle Barbican)
    [3.5, 1.5], [4.5, 0.0], [5.8, -1.0], [7.2, -2.0], [8.8, -3.4],
    [10.2, -5.0], [11.8, -6.8], [12.8, -8.2], [13.5, -8.8],
    [8.5, 8.0], [11.0, 10.5], [13.5, 13.0],
  ];

  const bridgeDestroyed = useWorldStore((s) => s.bridgeDestroyed);

  return (
    <group>
      {!bridgeDestroyed ? (
        /* ── Medieval Arched Stone Bridge over River at (-8, 5) ── */
        <group position={[-8, 0.45, 5]} rotation={[0, -0.2, 0]}>
          <mesh position={[0, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[4.4, 0.4, 9.2]} />
            <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
          </mesh>

          {[-3.2, 3.2].map((offZ, pi) => (
            <group key={`pier-${pi}`} position={[0, -0.85, offZ]}>
              <mesh position={[-1.7, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.9, 1.8, 2.2]} />
                <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
              </mesh>
              <mesh position={[1.7, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.9, 1.8, 2.2]} />
                <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
              </mesh>
            </group>
          ))}

          <mesh position={[-2.15, 0.55, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, 0.75, 9.2]} />
            <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
          </mesh>
          <mesh position={[2.15, 0.55, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.3, 0.75, 9.2]} />
            <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
          </mesh>

          {[-3.8, -1.9, 0, 1.9, 3.8].map((cz, ci) => (
            <group key={`coping-${ci}`}>
              <mesh position={[-2.15, 0.98, cz]} castShadow>
                <boxGeometry args={[0.38, 0.15, 0.65]} />
                <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
              </mesh>
              <mesh position={[2.15, 0.98, cz]} castShadow>
                <boxGeometry args={[0.38, 0.15, 0.65]} />
                <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
              </mesh>
            </group>
          ))}

          {[
            { x: -2.15, z: -4.4 },
            { x: 2.15, z: -4.4 },
            { x: -2.15, z: 4.4 },
            { x: 2.15, z: 4.4 },
          ].map((lp, li) => (
            <group key={`br-pylon-${li}`} position={[lp.x, 0.8, lp.z]}>
              <mesh position={[0, 0, 0]} castShadow>
                <boxGeometry args={[0.42, 1.1, 0.42]} />
                <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
              </mesh>
              <mesh position={[0, 0.72, 0]}>
                <boxGeometry args={[0.22, 0.32, 0.22]} />
                <meshToonMaterial color="#ffbe55" emissive="#ff9510" emissiveIntensity={0.8} gradientMap={toonRamp} />
              </mesh>
            </group>
          ))}
          {/* Single unified warm illumination source for the bridge */}
          <pointLight position={[0, 1.4, 0]} color="#ffaa35" intensity={0.9} distance={10} />
        </group>
      ) : (
        /* ── Collapsed / Shattered Stone Bridge Rubble ── */
        <group position={[-8, 0.45, 5]} rotation={[0, -0.2, 0]}>
          {/* Shattered West Bank Pier Stump */}
          <group position={[-1.8, -0.3, 0]}>
            <mesh position={[-0.4, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.4, 1.1, 3.8]} />
              <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
            </mesh>
            <mesh position={[0.3, 0.3, 0.5]} rotation={[0.2, 0.4, 0.1]} castShadow>
              <dodecahedronGeometry args={[0.48, 0]} />
              <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
            </mesh>
          </group>

          {/* Shattered East Bank Pier Stump */}
          <group position={[1.8, -0.3, 0]}>
            <mesh position={[0.4, 0, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.4, 1.1, 3.8]} />
              <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
            </mesh>
            <mesh position={[-0.3, 0.3, -0.4]} rotation={[-0.3, 0.2, -0.2]} castShadow>
              <dodecahedronGeometry args={[0.52, 0]} />
              <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
            </mesh>
          </group>

          {/* Collapsed Bridge Span Rubble Submerged in Riverbed */}
          <group position={[0, -1.1, 0]} rotation={[0.08, 0.04, 0.12]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[2.6, 0.38, 3.6]} />
              <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
            </mesh>
            {[-1.1, 0.1, 1.2].map((rx, ri) => (
              <mesh key={`rubble-${ri}`} position={[rx, 0.28, (ri - 1) * 0.85]} rotation={[ri * 0.4, ri * 0.6, 0.2]} castShadow>
                <dodecahedronGeometry args={[0.42, 0]} />
                <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* Interconnected Stepping Stone Paths */}
      {pathTiles.map(([x, z], i) => (
        <mesh
          key={`path-${i}`}
          position={[x, getTerrainHeight(x, z) + 0.04, z]}
          rotation={[0, (i * 0.4) % Math.PI, 0]}
          receiveShadow
        >
          <boxGeometry args={[1.4, 0.08, 1.1]} />
          <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Floating Sunlight Dust Motes / Atmospheric Pollen ─────────

const DUST_MOTE_COUNT = 90;

function DustMotes() {
  const pointsRef = useRef<THREE.Points>(null!);
  const t = useRef(0);

  const positions = useMemo(() => {
    const p = new Float32Array(DUST_MOTE_COUNT * 3);
    const rng = seededRandom(88888);
    for (let i = 0; i < DUST_MOTE_COUNT; i++) {
      p[i * 3]     = (rng() - 0.5) * 55;
      p[i * 3 + 1] = rng() * 4 + 0.8;
      p[i * 3 + 2] = (rng() - 0.5) * 55;
    }
    return p;
  }, []);

  useFrame((_, delta) => {
    t.current += delta;
    if (!pointsRef.current) return;
    pointsRef.current.position.y = Math.sin(t.current * 0.5) * 0.25;
    pointsRef.current.rotation.y += delta * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#fff4c8"
        size={0.14}
        transparent
        opacity={0.45}
        depthWrite={false}
      />
    </points>
  );
}

// ─── Export ─────────────────────────────────────────────────────

export default function Environment() {
  return (
    <group>
      <MountainBackdrop />
      <MountainGeology />
      <MountainCascade />
      <AnimatedWater />
      <PlayerWake />
      <RiverDetails />
      <Landmarks />
      <ZoneLandmarks />
      <EchoVFX />
      <PhysicalProps />
      <RockField />
      <SmallRocks />
      <GrassTufts />
      <Wildflowers />
      <Ferns />
      <Fireflies />
      <DustMotes />
    </group>
  );
}
