// ============================================================
// STYLIZED CEL-SHADED STRUCTURE MESHES — Authored Fantasy Architecture
// Detailed timber-frame cottages, medieval water/windmill with
// canvas sails, fortified stone towers, arched bridges, and castles.
// Rendered with discrete toon stepped shading and hand-painted textures.
// ============================================================

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Entity } from '../core/types';
import {
  getStylizedWoodTexture,
  getStylizedStoneTexture,
  getStylizedRoofTexture,
  getStylizedFabricTexture,
  getToonGradient3,
  getToonGradient4,
} from './StylizedMaterials';

// ─── Fortified Watchtower ─────────────────────────────────────

function TowerMesh() {
  const toonRamp = useMemo(() => getToonGradient4(), []);
  const stoneTex = useMemo(() => getStylizedStoneTexture('#5a6068', '#383d44'), []);
  const roofTex = useMemo(() => getStylizedRoofTexture('#782a24', '#4a1512'), []);

  return (
    <group>
      {/* Stone base cylinder with masonry texture */}
      <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.7, 2.2, 6.4, 12]} />
        <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
      </mesh>

      {/* Flared Corbel Arches / Machicolations */}
      <mesh position={[0, 6.5, 0]} castShadow>
        <cylinderGeometry args={[2.3, 1.7, 0.7, 12]} />
        <meshToonMaterial color="#4a5058" gradientMap={toonRamp} />
      </mesh>

      {/* Upper Parapet & Platform */}
      <mesh position={[0, 7.0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.35, 2.35, 0.5, 12]} />
        <meshToonMaterial color="#3f454d" gradientMap={toonRamp} />
      </mesh>

      {/* Crenellations (Battlements with Embrasures) */}
      {[0, 0.78, 1.57, 2.35, 3.14, 3.92, 4.71, 5.49].map((ang, i) => (
        <mesh
          key={i}
          position={[Math.cos(ang) * 2.15, 7.55, Math.sin(ang) * 2.15]}
          rotation={[0, -ang, 0]}
          castShadow
        >
          <boxGeometry args={[0.65, 0.65, 0.35]} />
          <meshToonMaterial color="#484e56" gradientMap={toonRamp} />
        </mesh>
      ))}

      {/* Conical Shingled Roof */}
      <mesh position={[0, 9.4, 0]} castShadow>
        <coneGeometry args={[2.1, 3.8, 12]} />
        <meshToonMaterial map={roofTex} gradientMap={toonRamp} />
      </mesh>

      {/* Finial / Spire */}
      <mesh position={[0, 11.5, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.08, 0.8, 6]} />
        <meshToonMaterial color="#cfa84e" gradientMap={toonRamp} />
      </mesh>

      {/* Warm Watchtower Lantern Light */}
      <pointLight position={[0, 7.4, 0]} color="#ff9030" intensity={1.6} distance={10} />
    </group>
  );
}

// ─── Half-Timbered Fantasy Cottage ────────────────────────────

function HouseMesh() {
  const toonRamp = useMemo(() => getToonGradient3(), []);
  const stoneTex = useMemo(() => getStylizedStoneTexture('#6c7075', '#45484c'), []);
  const woodTex = useMemo(() => getStylizedWoodTexture('#5c381c', '#38200d'), []);
  const roofTex = useMemo(() => getStylizedRoofTexture('#8b3528', '#5a1d14'), []);

  const smokeRef = useRef<THREE.Points>(null!);
  const smokeCount = 18;

  const smokePositions = useMemo(() => {
    const p = new Float32Array(smokeCount * 3);
    for (let i = 0; i < smokeCount; i++) {
      p[i * 3]     = 1.1 + (Math.random() - 0.5) * 0.2;
      p[i * 3 + 1] = 4.2 + (i / smokeCount) * 2.2;
      p[i * 3 + 2] = 0.6 + (Math.random() - 0.5) * 0.2;
    }
    return p;
  }, []);

  useFrame((_, delta) => {
    if (!smokeRef.current) return;
    smokeRef.current.position.y += delta * 0.45;
    if (smokeRef.current.position.y > 1.6) {
      smokeRef.current.position.y = 0;
    }
  });

  return (
    <group>
      {/* ── Masonry Stone Foundation Base ── */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 0.9, 3.2]} />
        <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
      </mesh>

      {/* ── Timber-Framed Upper Story (Cream Plaster with Dark Oak Beams) ── */}
      <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 1.8, 3.0]} />
        <meshToonMaterial color="#ece5d8" gradientMap={toonRamp} />
      </mesh>

      {/* Vertical & Horizontal Dark Timber Framing Beams */}
      {[
        [-1.8, 1.8, 1.51], [1.8, 1.8, 1.51], [-1.8, 1.8, -1.51], [1.8, 1.8, -1.51],
      ].map(([x, y, z], i) => (
        <mesh key={`post-${i}`} position={[x, y, z]} castShadow>
          <boxGeometry args={[0.16, 1.82, 0.16]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
      ))}

      {/* Timber lintel beam */}
      <mesh position={[0, 2.7, 1.52]} castShadow>
        <boxGeometry args={[3.65, 0.16, 0.14]} />
        <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
      </mesh>

      {/* ── Gabled Shingled Roof with Overhang ── */}
      <mesh position={[0, 3.4, 0]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[3.2, 1.9, 4]} />
        <meshToonMaterial map={roofTex} gradientMap={toonRamp} />
      </mesh>

      {/* Wooden Front Door with Iron Knocker */}
      <group position={[0, 1.0, 1.52]}>
        <mesh castShadow>
          <boxGeometry args={[0.9, 1.4, 0.08]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0.28, 0, 0.05]}>
          <sphereGeometry args={[0.04, 6, 5]} />
          <meshToonMaterial color="#2d2d30" gradientMap={toonRamp} />
        </mesh>
      </group>

      {/* Glowing Warm Paned Windows */}
      <group position={[-1.0, 1.9, 1.52]}>
        <mesh>
          <boxGeometry args={[0.65, 0.65, 0.04]} />
          <meshToonMaterial color="#ffc455" emissive="#ff9515" emissiveIntensity={0.85} gradientMap={toonRamp} />
        </mesh>
        {/* Window Wooden Mullions */}
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.65, 0.06, 0.02]} />
          <meshToonMaterial color="#3a2212" gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.06, 0.65, 0.02]} />
          <meshToonMaterial color="#3a2212" gradientMap={toonRamp} />
        </mesh>
        <pointLight position={[0, 0, 0.4]} color="#ffa835" intensity={0.65} distance={5} />
      </group>

      <group position={[1.0, 1.9, 1.52]}>
        <mesh>
          <boxGeometry args={[0.65, 0.65, 0.04]} />
          <meshToonMaterial color="#ffc455" emissive="#ff9515" emissiveIntensity={0.85} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.65, 0.06, 0.02]} />
          <meshToonMaterial color="#3a2212" gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <boxGeometry args={[0.06, 0.65, 0.02]} />
          <meshToonMaterial color="#3a2212" gradientMap={toonRamp} />
        </mesh>
        <pointLight position={[0, 0, 0.4]} color="#ffa835" intensity={0.65} distance={5} />
      </group>

      {/* ── Stone Masonry Chimney with Gentle Smoke ── */}
      <mesh position={[1.1, 3.6, 0.6]} castShadow>
        <boxGeometry args={[0.65, 1.8, 0.65]} />
        <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
      </mesh>

      {/* Chimney Smoke Particles */}
      <points ref={smokeRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[smokePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#d2d5dc"
          size={0.45}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

// ─── Authentic Old Medieval Mill (Rotating Lattice Sails) ─────

function WindmillMesh() {
  const sailsRef = useRef<THREE.Group>(null!);
  const toonRamp = useMemo(() => getToonGradient3(), []);
  const stoneTex = useMemo(() => getStylizedStoneTexture('#626870', '#3e434a'), []);
  const woodTex = useMemo(() => getStylizedWoodTexture('#5a3618', '#38200d'), []);
  const sailClothTex = useMemo(() => getStylizedFabricTexture('#ede6d4'), []);
  const waterwheelRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    if (sailsRef.current) {
      sailsRef.current.rotation.z += 0.9 * delta;
    }
    if (waterwheelRef.current) {
      waterwheelRef.current.rotation.x += 1.2 * delta;
    }
  });

  return (
    <group>
      {/* ── Tapered Stone Tower Base ── */}
      <mesh position={[0, 3.8, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.7, 2.5, 7.6, 10]} />
        <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
      </mesh>

      {/* Timber Gallery Walkway */}
      <mesh position={[0, 6.8, 0]} castShadow>
        <cylinderGeometry args={[2.3, 2.3, 0.25, 10]} />
        <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
      </mesh>

      {/* Wooden Mill Cap */}
      <mesh position={[0, 8.2, 0]} castShadow>
        <coneGeometry args={[1.9, 1.8, 10]} />
        <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
      </mesh>

      {/* Heavy Timber Axle Hub */}
      <mesh position={[0, 7.7, 1.8]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.28, 0.9, 8]} />
        <meshToonMaterial color="#2d1d12" gradientMap={toonRamp} />
      </mesh>

      {/* ── 4 Windmill Sails (Timber Lattice + Linen Cloth) ── */}
      <group ref={sailsRef} position={[0, 7.7, 2.3]}>
        {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((ang, i) => (
          <group key={i} rotation={[0, 0, ang]}>
            {/* Timber Main Spar */}
            <mesh position={[0, 2.5, 0]} castShadow>
              <boxGeometry args={[0.12, 5.0, 0.1]} />
              <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
            </mesh>
            {/* Linen Sailcloth Sheet */}
            <mesh position={[0.48, 2.7, 0.04]} castShadow>
              <boxGeometry args={[0.85, 3.8, 0.02]} />
              <meshToonMaterial map={sailClothTex} gradientMap={toonRamp} side={THREE.DoubleSide} />
            </mesh>
            {/* Sail Lattice Ribs */}
            {[-1.2, 0, 1.2].map((offY, ri) => (
              <mesh key={`rib-${ri}`} position={[0.48, 2.7 + offY, 0.06]}>
                <boxGeometry args={[0.85, 0.05, 0.03]} />
                <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
              </mesh>
            ))}
          </group>
        ))}
      </group>

      {/* ── Rotating Riverside Waterwheel on Mill Flank ── */}
      <group position={[-2.4, 1.4, 0]}>
        {/* Axle entering stone wall */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, 0.8, 6]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        {/* Rotating Wheel & Paddles */}
        <group ref={waterwheelRef}>
          {/* Wheel rims */}
          <mesh rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[1.2, 0.06, 6, 12]} />
            <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
          </mesh>
          <mesh position={[-0.4, 0, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <torusGeometry args={[1.2, 0.06, 6, 12]} />
            <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
          </mesh>
          {/* 8 Paddle Blades */}
          {[0, 0.78, 1.57, 2.35, 3.14, 3.92, 4.71, 5.49].map((ang, pi) => (
            <mesh
              key={`paddle-${pi}`}
              position={[-0.2, Math.cos(ang) * 1.15, Math.sin(ang) * 1.15]}
              rotation={[ang, 0, 0]}
              castShadow
            >
              <boxGeometry args={[0.45, 0.35, 0.04]} />
              <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Flour Sacks & Wooden Barrels at Mill Door */}
      <group position={[1.4, 0.4, 1.6]}>
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.26, 0.24, 0.65, 7]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0.45, 0, 0.1]} castShadow>
          <cylinderGeometry args={[0.24, 0.22, 0.6, 7]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Suncrest Stronghold Citadel (Majestic Mountain Fortress) ─

function CastleMesh() {
  const toonRamp = useMemo(() => getToonGradient4(), []);
  const stoneTex = useMemo(() => getStylizedStoneTexture('#656c75', '#3e434b'), []);
  const darkStoneTex = useMemo(() => getStylizedStoneTexture('#4e535a', '#2d3137'), []);
  const roofTex = useMemo(() => getStylizedRoofTexture('#224478', '#142848'), []);
  const fabricBlueTex = useMemo(() => getStylizedFabricTexture('#1e4c96'), []);
  const woodTex = useMemo(() => getStylizedWoodTexture('#452b16', '#261608'), []);

  return (
    <group scale={1.15}>
      {/* ── Massive Bedrock Foundation Plinth (anchored into mountain) ── */}
      <mesh position={[0, 0.9, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[8.4, 1.8, 8.4]} />
        <meshToonMaterial map={darkStoneTex} gradientMap={toonRamp} />
      </mesh>

      {/* ── Central Grand Keep (Multi-tiered Citadel) ── */}
      {/* Tier 1: Sturdy lower keep hall */}
      <mesh position={[0, 4.8, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[6.4, 5.2, 6.4]} />
        <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
      </mesh>

      {/* Tier 2: Upper keep sanctuary */}
      <mesh position={[0, 8.8, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[5.2, 3.4, 5.2]} />
        <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
      </mesh>

      {/* Keep Machicolations & Battlements */}
      <mesh position={[0, 10.7, -0.5]} castShadow>
        <boxGeometry args={[5.8, 0.6, 5.8]} />
        <meshToonMaterial map={darkStoneTex} gradientMap={toonRamp} />
      </mesh>
      {[-2.6, 0, 2.6].map((cx, i) => (
        <mesh key={`k-cren-f-${i}`} position={[cx, 11.3, 2.3]} castShadow>
          <boxGeometry args={[0.7, 0.7, 0.4]} />
          <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
        </mesh>
      ))}

      {/* ── High Spire Tower (Dominant Mountain Pinnacle Landmark) ── */}
      <group position={[0, 10.5, -0.5]}>
        {/* Tower cylinder */}
        <mesh position={[0, 2.6, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.5, 1.7, 5.2, 10]} />
          <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
        </mesh>
        {/* Upper gallery */}
        <mesh position={[0, 5.4, 0]} castShadow>
          <cylinderGeometry args={[1.9, 1.5, 0.6, 10]} />
          <meshToonMaterial map={darkStoneTex} gradientMap={toonRamp} />
        </mesh>
        {/* Soaring conical slate roof */}
        <mesh position={[0, 8.4, 0]} castShadow>
          <coneGeometry args={[2.0, 5.4, 10]} />
          <meshToonMaterial map={roofTex} gradientMap={toonRamp} />
        </mesh>
        {/* Golden Crown Finial / Spire Tip */}
        <mesh position={[0, 11.4, 0]}>
          <octahedronGeometry args={[0.3, 0]} />
          <meshToonMaterial color="#f5c242" gradientMap={toonRamp} />
        </mesh>
      </group>

      {/* ── 4 Stout Corner Bastion Towers ── */}
      {[
        { x: -3.8, z: -3.8, h: 10.5, r: 1.4 },
        { x: 3.8,  z: -3.8, h: 10.5, r: 1.4 },
        { x: -4.0, z: 2.8,  h: 9.0,  r: 1.3 },
        { x: 4.0,  z: 2.8,  h: 9.0,  r: 1.3 },
      ].map((tw, i) => (
        <group key={`bastion-${i}`} position={[tw.x, 0, tw.z]}>
          {/* Tower shaft */}
          <mesh position={[0, tw.h * 0.5, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[tw.r * 0.9, tw.r * 1.05, tw.h, 8]} />
            <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
          </mesh>
          {/* Corbelled parapet platform */}
          <mesh position={[0, tw.h + 0.3, 0]} castShadow>
            <cylinderGeometry args={[tw.r * 1.25, tw.r * 0.95, 0.6, 8]} />
            <meshToonMaterial map={darkStoneTex} gradientMap={toonRamp} />
          </mesh>
          {/* Conical roof */}
          <mesh position={[0, tw.h + 2.5, 0]} castShadow>
            <coneGeometry args={[tw.r * 1.3, 3.8, 8]} />
            <meshToonMaterial map={roofTex} gradientMap={toonRamp} />
          </mesh>
          {/* Tower Flagpole */}
          <mesh position={[0, tw.h + 4.9, 0]} castShadow>
            <cylinderGeometry args={[0.04, 0.05, 1.4, 5]} />
            <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
          </mesh>
          {/* Pennant flag */}
          <mesh position={[0.3, tw.h + 5.2, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.6, 0.35, 0.02]} />
            <meshToonMaterial map={fabricBlueTex} gradientMap={toonRamp} />
          </mesh>
        </group>
      ))}

      {/* ── Heavy Connecting Curtain Walls ── */}
      {/* West Curtain Wall */}
      <mesh position={[-3.8, 4.2, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 6.0, 5.6]} />
        <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
      </mesh>
      {/* East Curtain Wall */}
      <mesh position={[3.8, 4.2, -0.5]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 6.0, 5.6]} />
        <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
      </mesh>
      {/* North Back Wall */}
      <mesh position={[0, 4.5, -3.8]} castShadow receiveShadow>
        <boxGeometry args={[7.0, 6.5, 1.2]} />
        <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
      </mesh>

      {/* ── Fortified Gatehouse Barbican & Portcullis Portal ── */}
      <group position={[0, 0, 3.6]}>
        {/* Gatehouse masonry body */}
        <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.4, 5.2, 2.0]} />
          <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
        </mesh>
        {/* Gatehouse battlements */}
        {[-1.6, 0, 1.6].map((bx, i) => (
          <mesh key={`gh-cr-${i}`} position={[bx, 6.1, 0.9]} castShadow>
            <boxGeometry args={[0.65, 0.7, 0.35]} />
            <meshToonMaterial map={darkStoneTex} gradientMap={toonRamp} />
          </mesh>
        ))}
        {/* Vaulted Arch Entrance Portal */}
        <mesh position={[0, 1.6, 1.02]}>
          <boxGeometry args={[2.2, 3.0, 0.3]} />
          <meshToonMaterial color="#1a1c22" gradientMap={toonRamp} />
        </mesh>
        {/* Iron Portcullis Grate */}
        <mesh position={[0, 1.8, 0.9]}>
          <boxGeometry args={[2.0, 2.6, 0.08]} />
          <meshToonMaterial color="#2d3138" gradientMap={toonRamp} />
        </mesh>
        {/* Heavy Oak Timber Door Wings */}
        <mesh position={[-0.55, 1.4, 0.7]} rotation={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[1.0, 2.6, 0.12]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0.55, 1.4, 0.7]} rotation={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[1.0, 2.6, 0.12]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>

        {/* Grand Suncrest Heraldic Tapestry Banner over Portal */}
        <group position={[0, 4.4, 1.05]}>
          <mesh castShadow>
            <boxGeometry args={[1.5, 2.2, 0.04]} />
            <meshToonMaterial map={fabricBlueTex} gradientMap={toonRamp} />
          </mesh>
          {/* Golden Sun Emblem in Center of Banner */}
          <mesh position={[0, 0.2, 0.03]}>
            <circleGeometry args={[0.42, 8]} />
            <meshToonMaterial color="#f0c030" gradientMap={toonRamp} />
          </mesh>
        </group>

        {/* Stepped Stone Approach Stairs leading out to the courtyard/road */}
        {[0, 1, 2].map((st) => (
          <mesh key={`step-${st}`} position={[0, 0.18 + st * 0.22, 1.6 + st * 0.45]} castShadow receiveShadow>
            <boxGeometry args={[3.2 - st * 0.3, 0.25, 0.55]} />
            <meshToonMaterial map={darkStoneTex} gradientMap={toonRamp} />
          </mesh>
        ))}
      </group>

      {/* ── Glowing Castle Paned Windows & Beacon Lights ── */}
      {/* Front Keep Stained Glass Windows */}
      {[-1.5, 1.5].map((wx, i) => (
        <group key={`win-k-${i}`} position={[wx, 7.8, 2.75]}>
          <mesh>
            <boxGeometry args={[0.55, 1.2, 0.06]} />
            <meshToonMaterial color="#ffd055" emissive="#ffaa20" emissiveIntensity={0.8} gradientMap={toonRamp} />
          </mesh>
          <pointLight color="#ffbb44" intensity={0.6} distance={6} />
        </group>
      ))}

      {/* High Spire Lantern Beacon */}
      <pointLight position={[0, 16.5, -0.5]} color="#ffaa30" intensity={1.5} distance={14} />
      {/* Gate Entrance Warm Lantern */}
      <pointLight position={[0, 3.4, 4.8]} color="#ffb845" intensity={1.6} distance={9} />
    </group>
  );
}

// ─── Village Settlement ───────────────────────────────────────

function VillageMesh() {
  return (
    <group>
      <group position={[-1.8, 0, 0]} scale={0.85}>
        <HouseMesh />
      </group>
      <group position={[2.2, 0, 1.4]} rotation={[0, -0.6, 0]} scale={0.75}>
        <HouseMesh />
      </group>
      <group position={[0.4, 0, -2.4]} rotation={[0, 0.8, 0]} scale={0.7}>
        <HouseMesh />
      </group>
    </group>
  );
}

// ─── Structure Dispatcher Component ───────────────────────────

export default function StructureMesh({ entity }: { entity: Entity }) {
  return (
    <group rotation={[0, entity.rotationY, 0]}>
      {entity.type === 'tower' && <TowerMesh />}
      {entity.type === 'house' && <HouseMesh />}
      {entity.type === 'windmill' && <WindmillMesh />}
      {entity.type === 'castle' && <CastleMesh />}
      {entity.type === 'village' && <VillageMesh />}
    </group>
  );
}
