// ============================================================
// ECHO TREE — The Singular Physical Timeline Anchor in ECHO
// An enormous, ancient sovereign tree in a secluded western grove.
// Connects the player's reality to fractured alternate timelines.
//
// Visual Direction:
// - Enormous old trunk with organic knots and weathered fissures
// - Massive twisted buttress roots grasping into the earth
// - Broad, sweeping ancient canopy with layered foliage clusters
// - Subtle leaf/material variations reflecting the active reality branch
// - Faint atmospheric chronal particles drifting near roots & canopy
// - Broken ancient stone fragments left by The Architect
// ============================================================

import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../core/WorldState';
import { useTimelineStore } from '../systems/TimelineSystem';
import { ECHO_TREE_COORDS, useEchoTreeStore } from '../core/echoTreeState';
import { getTerrainHeight } from '../core/terrain';
import { registerObstacle, unregisterObstacle } from '../core/collision';
import {
  getStylizedWoodTexture,
  getStylizedStoneTexture,
  getToonGradient3,
  getToonGradient4,
} from './StylizedMaterials';

export default function EchoTree() {
  const toonRamp3 = useMemo(() => getToonGradient3(), []);
  const toonRamp4 = useMemo(() => getToonGradient4(), []);
  const barkTex = useMemo(() => getStylizedWoodTexture('#3e2615', '#22140a'), []);
  const stoneTex = useMemo(() => getStylizedStoneTexture('#565c66', '#353a42'), []);

  const activeBranchId = useTimelineStore((s) => s.activeBranchId);
  const branches = useTimelineStore((s) => s.branches);
  const isTransitioning = useTimelineStore((s) => s.isTransitioning);

  const activeBranch = branches[activeBranchId];
  const branchColor = activeBranch?.color || '#38bdf8';

  const treeX = ECHO_TREE_COORDS.x;
  const treeZ = ECHO_TREE_COORDS.z;
  const treeY = getTerrainHeight(treeX, treeZ);

  // Register physical trunk collider
  useEffect(() => {
    registerObstacle('echo_tree_trunk', treeX, treeZ, 2.2);
    return () => {
      unregisterObstacle('echo_tree_trunk');
    };
  }, [treeX, treeZ]);

  // Leaf color palette driven by active timeline reality
  const leafTheme = useMemo(() => {
    if (activeBranchId === 'branch_prime') {
      return {
        base: '#2a5a48', // Deep ancient sage emerald
        emissive: '#16382e',
        glow: '#38bdf8', // Subtle cyan chronal sheen
        particleColor: '#67e8f9',
      };
    }
    // Divergence / Conflict / War
    if (branchColor === '#ef4444' || branchColor === '#ec4899') {
      return {
        base: '#4a2c24', // Dusk bronze autumn
        emissive: '#2a1612',
        glow: '#f43f5e',
        particleColor: '#fda4af',
      };
    }
    // Accord / Golden Timeline
    if (branchColor === '#f59e0b') {
      return {
        base: '#345e36', // Radiant jade-gold
        emissive: '#1a361c',
        glow: '#f59e0b',
        particleColor: '#fde047',
      };
    }
    // Mystery / Void Timeline
    return {
      base: '#26384a', // Twilight celestial indigo
      emissive: '#141e2a',
      glow: '#a855f7',
      particleColor: '#c084fc',
    };
  }, [activeBranchId, branchColor]);

  // Particles: Faint floating chronal motes / spores
  const particlesRef = useRef<THREE.Points>(null!);
  const particleCount = 72;
  const particleData = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vels = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 1.8 + Math.random() * 5.5;
      const angle = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = 0.4 + Math.random() * 8.5;
      pos[i * 3 + 2] = Math.sin(angle) * radius;

      vels[i * 3] = (Math.random() - 0.5) * 0.15;
      vels[i * 3 + 1] = 0.2 + Math.random() * 0.35;
      vels[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
    }
    return { pos, vels };
  }, []);

  // Twisted buttress roots anchoring into the mossy glade
  const roots = useMemo(
    () => [
      { angle: 0.15, len: 4.8, rBase: 0.85, rTip: 0.28, lift: 0.45 },
      { angle: 1.15, len: 4.2, rBase: 0.78, rTip: 0.24, lift: 0.38 },
      { angle: 2.10, len: 5.2, rBase: 0.92, rTip: 0.30, lift: 0.52 },
      { angle: 3.25, len: 4.5, rBase: 0.82, rTip: 0.26, lift: 0.42 },
      { angle: 4.30, len: 5.0, rBase: 0.88, rTip: 0.28, lift: 0.48 },
      { angle: 5.35, len: 4.0, rBase: 0.75, rTip: 0.22, lift: 0.35 },
    ],
    []
  );

  // Large canopy foliage clusters
  const canopyNodes = useMemo(
    () => [
      // Central high crown
      { x: 0, y: 10.8, z: 0, s: 3.4 },
      { x: 0.6, y: 12.0, z: -0.4, s: 2.6 },
      // Mid spreading tier
      { x: -2.6, y: 9.4, z: 1.2, s: 3.2 },
      { x: 2.8, y: 9.6, z: -1.0, s: 3.1 },
      { x: 1.2, y: 9.2, z: 2.8, s: 3.0 },
      { x: -1.4, y: 9.0, z: -2.6, s: 2.9 },
      // Low sweeping outer boughs
      { x: -3.8, y: 7.2, z: -1.2, s: 2.8 },
      { x: 3.6, y: 7.4, z: 1.6, s: 2.7 },
      { x: -1.8, y: 7.0, z: 3.6, s: 2.6 },
      { x: 2.2, y: 6.8, z: -3.4, s: 2.8 },
      // Lower sheltered clusters
      { x: -0.8, y: 5.6, z: -1.8, s: 2.2 },
      { x: 1.4, y: 5.8, z: 1.6, s: 2.3 },
    ],
    []
  );

  // Weathered monolithic stone fragments left around root perimeter
  const monoliths = useMemo(
    () => [
      { angle: 0.65, dist: 4.6, h: 1.6, lean: 0.12, w: 0.75 },
      { angle: 1.85, dist: 5.0, h: 2.1, lean: -0.16, w: 0.85 },
      { angle: 3.60, dist: 4.4, h: 1.4, lean: 0.08, w: 0.65 },
      { angle: 4.95, dist: 4.8, h: 1.9, lean: -0.14, w: 0.80 },
    ],
    []
  );

  // Animation frame loop: proximity tracking & atmospheric particles
  useFrame((_, delta) => {
    // 1. Proximity check with player
    const player = useWorldStore.getState().player;
    const distToTree = Math.hypot(player.position.x - treeX, player.position.z - treeZ);
    useEchoTreeStore.getState().setNear(distToTree <= ECHO_TREE_COORDS.interactionRadius);

    // 2. Particle drift & spiraling
    if (particlesRef.current) {
      const geo = particlesRef.current.geometry;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      // Accelerated spiral when switching realities / rewinding
      const speedMult = isTransitioning ? 3.5 : 1.0;

      for (let i = 0; i < particleCount; i++) {
        // Slow lazy orbit around trunk
        const ix = i * 3;
        const iy = i * 3 + 1;
        const iz = i * 3 + 2;

        const currentX = arr[ix];
        const currentZ = arr[iz];
        const angle = Math.atan2(currentZ, currentX) + (isTransitioning ? -1.8 : 0.28) * delta * speedMult;
        const rad = Math.hypot(currentX, currentZ);

        arr[ix] = Math.cos(angle) * rad;
        arr[iy] += (isTransitioning ? -1.2 : particleData.vels[iy]) * delta * speedMult;
        arr[iz] = Math.sin(angle) * rad;

        // Wrap particles when reaching ceiling or floor
        if (arr[iy] > 12.0) {
          arr[iy] = 0.5;
        } else if (arr[iy] < 0.2) {
          arr[iy] = 11.5;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group position={[treeX, treeY, treeZ]}>
      {/* ── 1. Sacred Moss Ground Disk (Clearing Floor) ── */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[6.4, 24]} />
        <meshToonMaterial color="#2d402b" gradientMap={toonRamp3} />
      </mesh>

      {/* Subtle Chronal Root Haze / Shimmer Ring */}
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 4.2, 24]} />
        <meshBasicMaterial
          color={leafTheme.glow}
          transparent
          opacity={isTransitioning ? 0.45 : 0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ── 2. Massive Gnarled Trunk (Tapered & Weathered) ── */}
      {/* Lower Trunk Base */}
      <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.75, 2.45, 4.4, 12]} />
        <meshToonMaterial map={barkTex} gradientMap={toonRamp4} />
      </mesh>
      {/* Mid Trunk & Bough Junction */}
      <mesh position={[0.1, 5.8, -0.1]} rotation={[0.08, 0.25, -0.06]} castShadow receiveShadow>
        <cylinderGeometry args={[1.35, 1.75, 4.0, 10]} />
        <meshToonMaterial map={barkTex} gradientMap={toonRamp4} />
      </mesh>
      {/* Upper Crown Bough Structure */}
      <mesh position={[-0.1, 8.8, 0.15]} rotation={[-0.05, 0.4, 0.08]} castShadow>
        <cylinderGeometry args={[0.95, 1.35, 3.6, 9]} />
        <meshToonMaterial map={barkTex} gradientMap={toonRamp4} />
      </mesh>

      {/* Heavy Spreading Boughs */}
      {[
        { pos: [-1.4, 6.8, 0.8], rot: [0.35, 0.4, -0.65], len: 3.4, r: 0.65 },
        { pos: [1.5, 7.0, -0.7], rot: [-0.3, -0.5, 0.6], len: 3.2, r: 0.62 },
        { pos: [0.6, 7.2, 1.5], rot: [0.6, 0.2, 0.3], len: 3.0, r: 0.58 },
        { pos: [-0.8, 7.1, -1.4], rot: [-0.6, 0.3, -0.4], len: 3.1, r: 0.60 },
      ].map((b, i) => (
        <mesh key={`bough-${i}`} position={b.pos as [number, number, number]} rotation={b.rot as [number, number, number]} castShadow>
          <cylinderGeometry args={[b.r * 0.65, b.r, b.len, 7]} />
          <meshToonMaterial map={barkTex} gradientMap={toonRamp4} />
        </mesh>
      ))}

      {/* ── 3. Twisted Buttress Roots Grasping into Soil ── */}
      {roots.map((r, i) => {
        const rootMidX = Math.cos(r.angle) * (r.len * 0.45);
        const rootMidZ = Math.sin(r.angle) * (r.len * 0.45);
        return (
          <group key={`root-${i}`} position={[0, 0, 0]}>
            {/* Primary root arch */}
            <mesh
              position={[rootMidX, r.lift * 0.5, rootMidZ]}
              rotation={[Math.sin(r.angle) * 0.25, r.angle, Math.cos(r.angle) * -0.28]}
              castShadow
              receiveShadow
            >
              <cylinderGeometry args={[r.rTip, r.rBase, r.len, 6]} />
              <meshToonMaterial map={barkTex} gradientMap={toonRamp4} />
            </mesh>
          </group>
        );
      })}

      {/* ── 4. Ancient Weathered Monoliths (The Architect's Markers) ── */}
      {monoliths.map((m, i) => {
        const mx = Math.cos(m.angle) * m.dist;
        const mz = Math.sin(m.angle) * m.dist;
        return (
          <group key={`monolith-${i}`} position={[mx, 0, mz]} rotation={[m.lean, m.angle, 0]}>
            <mesh position={[0, m.h * 0.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[m.w, m.h, m.w * 0.7]} />
              <meshToonMaterial map={stoneTex} gradientMap={toonRamp3} />
            </mesh>
            {/* Ancient worn glyph band */}
            <mesh position={[0, m.h * 0.6, m.w * 0.36]}>
              <boxGeometry args={[m.w * 0.4, 0.45, 0.04]} />
              <meshToonMaterial
                color={leafTheme.glow}
                emissive={leafTheme.glow}
                emissiveIntensity={0.65}
                gradientMap={toonRamp3}
              />
            </mesh>
          </group>
        );
      })}

      {/* ── 5. Layered Cel-Shaded Canopy Clusters ── */}
      {canopyNodes.map((cn, i) => (
        <mesh
          key={`canopy-${i}`}
          position={[cn.x, cn.y, cn.z]}
          rotation={[0.15 * i, 0.45 * i, 0]}
          castShadow
          receiveShadow
        >
          <dodecahedronGeometry args={[cn.s, 1]} />
          <meshToonMaterial
            color={leafTheme.base}
            emissive={leafTheme.emissive}
            emissiveIntensity={0.25}
            gradientMap={toonRamp3}
          />
        </mesh>
      ))}

      {/* ── 6. Atmospheric Floating Chronal Particles (Spore Drift) ── */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particleData.pos, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={leafTheme.particleColor}
          size={0.16}
          transparent
          opacity={isTransitioning ? 0.85 : 0.55}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* ── 7. Soft Ambient Reality Anchor Light ── */}
      <pointLight
        position={[0, 4.5, 0]}
        color={leafTheme.glow}
        intensity={isTransitioning ? 2.2 : 0.85}
        distance={12}
      />
    </group>
  );
}
