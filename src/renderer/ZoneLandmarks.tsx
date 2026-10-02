// ============================================================
// ZONE LANDMARKS — Stylized Cel-Shaded Adventure Map
// 7 Interconnected Zones:
// 1. Village (Meadowlands Enclave)
// 2. River (Silverflow)
// 3. Bridge (The River Crossing)
// 4. Ruins (The Whispering Stones Sanctuary)
// 5. Forest (The Whispering Woods)
// 6. Castle (Suncrest Stronghold Ridge)
// 7. Open Area for Battles (The Standoff Plains)
// Rendered with discrete toon shading and hand-painted materials.
// ============================================================

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useWorldStore } from '../core/WorldState';
import { playFireHiss } from '../core/soundFX';
import { getTerrainHeight } from '../core/terrain';
import { registerObstacle, unregisterObstacle } from '../core/collision';
import {
  getStylizedWoodTexture,
  getStylizedStoneTexture,
  getStylizedStrawTexture,
  getStylizedFabricTexture,
  getStylizedRoofTexture,
  getChronalRuneTexture,
  getToonGradient3,
  getToonGradient4,
} from './StylizedMaterials';

// ────────────────────────────────────────────────────────────
// 1. VILLAGE ZONE (Meadowlands Enclave around x: 4, z: 7)
// ────────────────────────────────────────────────────────────

function VillageZone() {
  const toonRamp = useMemo(() => getToonGradient3(), []);
  const stoneTex = useMemo(() => getStylizedStoneTexture('#656b73', '#454a52'), []);
  const woodTex = useMemo(() => getStylizedWoodTexture('#6b4628', '#4a2f18'), []);
  const strawTex = useMemo(() => getStylizedStrawTexture(), []);
  const marketAwningTex = useMemo(() => getStylizedFabricTexture('#b83828'), []);

  const wellX = 4.2;
  const wellZ = 6.8;
  const wellY = getTerrainHeight(wellX, wellZ);

  useEffect(() => {
    registerObstacle('village_well', wellX, wellZ, 1.2);
    registerObstacle('village_crate_stack', 2.2, 8.8, 1.0);
    registerObstacle('village_handcart', 5.2, 9.2, 1.1);
    registerObstacle('village_market_stall', 1.8, 6.2, 1.4);
    registerObstacle('village_farm_plot', 7.8, 4.6, 2.2);
    return () => {
      unregisterObstacle('village_well');
      unregisterObstacle('village_crate_stack');
      unregisterObstacle('village_handcart');
      unregisterObstacle('village_market_stall');
      unregisterObstacle('village_farm_plot');
    };
  }, []);

  return (
    <group>
      {/* ── Stone Village Well ── */}
      <group position={[wellX, wellY, wellZ]}>
        {/* Well stone cylinder base */}
        <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.9, 0.95, 0.9, 8]} />
          <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
        </mesh>
        {/* Well water interior */}
        <mesh position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.7, 8]} />
          <meshToonMaterial color="#1a4d6d" gradientMap={toonRamp} />
        </mesh>
        {/* Well wooden roof supports */}
        <mesh position={[-0.7, 1.2, 0]} castShadow>
          <boxGeometry args={[0.12, 1.5, 0.12]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0.7, 1.2, 0]} castShadow>
          <boxGeometry args={[0.12, 1.5, 0.12]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        {/* Crossbeam */}
        <mesh position={[0, 1.85, 0]} castShadow>
          <boxGeometry args={[1.55, 0.12, 0.12]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        {/* Wooden peaked roof */}
        <mesh position={[0, 2.15, 0]} rotation={[0, 0, 0]} castShadow>
          <coneGeometry args={[1.2, 0.65, 4]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        {/* Hanging bucket */}
        <mesh position={[0.15, 1.15, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.12, 0.25, 6]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
      </group>

      {/* ── Village Resting Bench near Well ── */}
      <group position={[3.2, getTerrainHeight(3.2, 5.5), 5.5]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.3, 0.08, 0.42]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        {[-0.5, 0.5].map((lx, i) => (
          <mesh key={`b-leg-${i}`} position={[lx, 0.2, 0]} castShadow>
            <boxGeometry args={[0.1, 0.4, 0.35]} />
            <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
          </mesh>
        ))}
      </group>

      {/* ── Village Market Stall with Striped Awning ── */}
      <group position={[1.8, getTerrainHeight(1.8, 6.2), 6.2]} rotation={[0, 0.65, 0]}>
        {/* Stall Counter Table */}
        <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.0, 0.14, 0.95]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        {/* Table Legs */}
        {[-0.85, 0.85].map((tx, ti) =>
          [-0.35, 0.35].map((tz, zi) => (
            <mesh key={`t-leg-${ti}-${zi}`} position={[tx, 0.32, tz]} castShadow>
              <boxGeometry args={[0.09, 0.64, 0.09]} />
              <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
            </mesh>
          ))
        )}
        {/* Roof Awning Posts */}
        {[-0.9, 0.9].map((rx, ri) => (
          <mesh key={`r-post-${ri}`} position={[rx, 1.4, -0.38]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 1.5, 5]} />
            <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
          </mesh>
        ))}
        {/* Slanted Fabric Awning Canopy */}
        <mesh position={[0, 2.05, 0.05]} rotation={[0.22, 0, 0]} castShadow>
          <boxGeometry args={[2.2, 0.05, 1.3]} />
          <meshToonMaterial map={marketAwningTex} gradientMap={toonRamp} />
        </mesh>
        {/* Produce Crates & Baskets on Counter */}
        <mesh position={[-0.55, 0.82, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.55, 0.22, 0.45]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        {/* Apples/Produce spheres */}
        {[-0.12, 0.12].map((ax, ai) => (
          <mesh key={`apple-${ai}`} position={[-0.55 + ax, 0.96, 0]}>
            <sphereGeometry args={[0.07, 6, 5]} />
            <meshToonMaterial color="#d43828" gradientMap={toonRamp} />
          </mesh>
        ))}
        <mesh position={[0.45, 0.82, 0.05]} castShadow receiveShadow>
          <cylinderGeometry args={[0.22, 0.18, 0.22, 7]} />
          <meshToonMaterial color="#baa068" gradientMap={toonRamp} />
        </mesh>
      </group>

      {/* ── Small Village Vegetable & Crop Farm Plot ── */}
      <group position={[7.8, getTerrainHeight(7.8, 4.6), 4.6]} rotation={[0, -0.15, 0]}>
        {/* Tilled Earth Bed */}
        <mesh position={[0, 0.05, 0]} receiveShadow>
          <boxGeometry args={[3.2, 0.12, 2.6]} />
          <meshToonMaterial color="#352618" gradientMap={toonRamp} />
        </mesh>
        {/* Split-rail Farm Perimeter Fencing */}
        {[-1.5, 1.5].map((fx, i) => (
          <mesh key={`f-side-${i}`} position={[fx, 0.35, 0]} castShadow>
            <boxGeometry args={[0.08, 0.55, 2.6]} />
            <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
          </mesh>
        ))}
        {[-1.2, 1.2].map((fz, i) => (
          <mesh key={`f-end-${i}`} position={[0, 0.35, fz]} castShadow>
            <boxGeometry args={[3.0, 0.55, 0.08]} />
            <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
          </mesh>
        ))}
        {/* Rows of Farm Crops (Cabbages & Pumpkins) */}
        {[-0.8, 0, 0.8].map((rowX, ri) =>
          [-0.7, 0, 0.7].map((rowZ, zi) => {
            const isPumpkin = (ri + zi) % 2 === 0;
            return (
              <group key={`crop-${ri}-${zi}`} position={[rowX, 0.18, rowZ]}>
                <mesh castShadow>
                  {isPumpkin ? (
                    <sphereGeometry args={[0.18, 7, 6]} />
                  ) : (
                    <dodecahedronGeometry args={[0.16, 0]} />
                  )}
                  <meshToonMaterial
                    color={isPumpkin ? '#e27218' : '#3e8832'}
                    gradientMap={toonRamp}
                  />
                </mesh>
              </group>
            );
          })
        )}
      </group>

      {/* ── Woodcutter's Chopping Block & Split Logs ── */}
      <group position={[4.8, getTerrainHeight(4.8, 8.2), 8.2]} rotation={[0, 0.7, 0]}>
        {/* Oak Stump Block */}
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.38, 0.42, 0.7, 8]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        {/* Iron Axe in Stump */}
        <mesh position={[0, 0.82, 0]} rotation={[0.4, 0, 0]} castShadow>
          <boxGeometry args={[0.04, 0.48, 0.06]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, 0.98, 0.08]} castShadow>
          <boxGeometry args={[0.05, 0.12, 0.18]} />
          <meshToonMaterial color="#42454a" gradientMap={toonRamp} />
        </mesh>
        {/* Split Firewood Stack */}
        {[-0.55, -0.7].map((lx, i) => (
          <mesh key={`split-${i}`} position={[lx, 0.14, 0.15 * i]} rotation={[0, 0.3 * i, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.1, 0.1, 0.6, 5]} />
            <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
          </mesh>
        ))}
      </group>

      {/* ── Wooden Village Directional Signpost ── */}
      <group position={[1.5, getTerrainHeight(1.5, 5.2), 5.2]} rotation={[0, 0.3, 0]}>
        <mesh position={[0, 0.9, 0]} castShadow>
          <boxGeometry args={[0.14, 1.8, 0.14]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        {/* Plank pointing to River/Ruins (West) */}
        <mesh position={[-0.45, 1.45, 0.05]} rotation={[0, 0, 0.04]} castShadow>
          <boxGeometry args={[0.9, 0.2, 0.05]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        {/* Plank pointing to Castle (East) */}
        <mesh position={[0.42, 1.15, -0.05]} rotation={[0, 0, -0.03]} castShadow>
          <boxGeometry args={[0.85, 0.2, 0.05]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
      </group>

      {/* ── Village Crates & Barrels near Cottage ── */}
      <group position={[2.2, getTerrainHeight(2.2, 8.8), 8.8]}>
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.7, 0.7, 0.7]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0.55, 0.25, 0.2]} castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[-0.45, 0.35, 0.15]} castShadow receiveShadow>
          <cylinderGeometry args={[0.3, 0.28, 0.7, 7]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
      </group>

      {/* ── Wooden Farm Handcart near Cottage ── */}
      <group position={[5.2, getTerrainHeight(5.2, 9.2), 9.2]} rotation={[0, 0.35, 0]}>
        {/* Cart Bed */}
        <mesh position={[0, 0.35, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.15, 1.8]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        {/* Cart Side Rails */}
        <mesh position={[-0.52, 0.52, 0]} castShadow>
          <boxGeometry args={[0.08, 0.25, 1.8]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0.52, 0.52, 0]} castShadow>
          <boxGeometry args={[0.08, 0.25, 1.8]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        {/* Cart Spoked Wheels */}
        <mesh position={[-0.62, 0.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.12, 10]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0.62, 0.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.35, 0.35, 0.12, 10]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        {/* Produce Barrel inside cart */}
        <mesh position={[0, 0.58, 0.2]} castShadow>
          <cylinderGeometry args={[0.24, 0.22, 0.5, 7]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
      </group>

      {/* ── Golden Hay Bales near Mill ── */}
      <group position={[8.5, getTerrainHeight(8.5, 7.5), 7.5]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 0.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.45, 0.45, 0.9, 8]} />
          <meshToonMaterial map={strawTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0.3, 0.3, 0.7]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
          <cylinderGeometry args={[0.45, 0.45, 0.9, 8]} />
          <meshToonMaterial map={strawTex} gradientMap={toonRamp} />
        </mesh>
      </group>

      {/* ── Village Lantern Posts (Warm Ambient Streetlamps) ── */}
      {[
        { x: 1.8, z: 4.8 },
        { x: 4.2, z: 5.6 },
        { x: 5.5, z: 8.5 },
        { x: 6.8, z: 7.2 },
      ].map((pt, i) => {
        const y = getTerrainHeight(pt.x, pt.z);
        return (
          <group key={`v-lantern-${i}`} position={[pt.x, y, pt.z]}>
            <mesh position={[0, 1.1, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.09, 2.2, 5]} />
              <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
            </mesh>
            <mesh position={[0.22, 1.95, 0]} castShadow>
              <boxGeometry args={[0.45, 0.08, 0.08]} />
              <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
            </mesh>
            <mesh position={[0.38, 1.75, 0]}>
              <boxGeometry args={[0.2, 0.28, 0.2]} />
              <meshToonMaterial color="#ffbe55" emissive="#ff9510" emissiveIntensity={0.8} gradientMap={toonRamp} />
            </mesh>
            <pointLight position={[0.38, 1.75, 0]} color="#ffaa44" intensity={0.9} distance={8} />
          </group>
        );
      })}
    </group>
  );
}

// ────────────────────────────────────────────────────────────
// 2. RUINS ZONE (The Whispering Stones Sanctuary at x: -4..-12, z: 8..18)
// ────────────────────────────────────────────────────────────

function RuinsZone() {
  const pulseLightRef = useRef<THREE.PointLight>(null!);
  const runeMatRef = useRef<THREE.MeshToonMaterial>(null!);

  const toonRamp = useMemo(() => getToonGradient4(), []);
  const stoneTex = useMemo(() => getStylizedStoneTexture('#464c54', '#2c3138'), []);
  const runeTex = useMemo(() => getChronalRuneTexture(), []);

  const centerX = -7.5;
  const centerZ = 12.5;

  // 6 Basalt Standing Monoliths in a mysterious circle
  const monoliths = [
    { angle: 0.1,  height: 3.4, scale: 0.75, lean: 0.08 },
    { angle: 1.15, height: 4.1, scale: 0.85, lean: -0.05 },
    { angle: 2.15, height: 3.0, scale: 0.70, lean: 0.15 },
    { angle: 3.25, height: 3.8, scale: 0.80, lean: -0.06 },
    { angle: 4.30, height: 4.4, scale: 0.90, lean: 0.04 },
    { angle: 5.35, height: 3.2, scale: 0.75, lean: -0.12 },
  ];

  useEffect(() => {
    monoliths.forEach((m, i) => {
      const radius = 5.2;
      const x = centerX + Math.cos(m.angle) * radius;
      const z = centerZ + Math.sin(m.angle) * radius;
      registerObstacle(`ruin_stone_${i}`, x, z, 1.1);
    });
    registerObstacle('ruin_altar', centerX, centerZ, 1.4);

    return () => {
      monoliths.forEach((_, i) => unregisterObstacle(`ruin_stone_${i}`));
      unregisterObstacle('ruin_altar');
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const pulse = 0.5 + Math.sin(t * 1.8) * 0.4;
    if (pulseLightRef.current) {
      pulseLightRef.current.intensity = 0.8 + pulse * 0.6;
    }
    if (runeMatRef.current) {
      runeMatRef.current.emissiveIntensity = 0.6 + pulse * 0.8;
    }
  });

  const centerY = getTerrainHeight(centerX, centerZ);

  return (
    <group>
      {/* ── Central Chronal Altar / Pedestal ── */}
      <group position={[centerX, centerY, centerZ]}>
        {/* Hexagonal stone dais */}
        <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.6, 1.9, 0.4, 6]} />
          <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
        </mesh>
        {/* Inner carved runic table */}
        <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.0, 1.1, 0.35, 6]} />
          <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
        </mesh>
        {/* Chronal core crystal / echo focal orb */}
        <mesh position={[0, 0.82, 0]}>
          <octahedronGeometry args={[0.26, 0]} />
          <meshToonMaterial
            ref={runeMatRef}
            color="#38f0d8"
            emissive="#20c0b0"
            emissiveIntensity={0.8}
            gradientMap={toonRamp}
          />
        </mesh>
        {/* Mystic teal chronal light */}
        <pointLight
          ref={pulseLightRef}
          position={[0, 1.2, 0]}
          color="#38f0d8"
          intensity={1.0}
          distance={10}
        />
      </group>

      {/* ── Standing Monoliths (The Whispering Stones) ── */}
      {monoliths.map((m, i) => {
        const radius = 5.2;
        const x = centerX + Math.cos(m.angle) * radius;
        const z = centerZ + Math.sin(m.angle) * radius;
        const y = getTerrainHeight(x, z);
        return (
          <group key={`monolith-${i}`} position={[x, y, z]} rotation={[m.lean, m.angle, 0]}>
            {/* Basalt stone pillar */}
            <mesh position={[0, m.height * 0.5, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.85 * m.scale, m.height, 0.65 * m.scale]} />
              <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
            </mesh>
            {/* Runic glowing band on inner face */}
            <mesh position={[0, m.height * 0.6, 0.34 * m.scale]}>
              <boxGeometry args={[0.28, 0.65, 0.04]} />
              <meshToonMaterial
                map={runeTex}
                color="#4af0e0"
                emissive="#2ce0d0"
                emissiveIntensity={0.8}
                gradientMap={toonRamp}
              />
            </mesh>
          </group>
        );
      })}

      {/* ── Broken Stone Archway at Ruins entrance (facing River/Bridge) ── */}
      <group position={[-5.0, getTerrainHeight(-5.0, 9.5), 9.5]} rotation={[0, -0.6, 0]}>
        <mesh position={[-1.2, 1.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.55, 3.2, 0.55]} />
          <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[1.2, 1.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.55, 3.2, 0.55]} />
          <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, 3.35, 0]} rotation={[0, 0, 0.05]} castShadow>
          <boxGeometry args={[3.1, 0.45, 0.65]} />
          <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
        </mesh>
      </group>

      {/* ── Fallen / Half-buried Columns ── */}
      <group position={[-11, getTerrainHeight(-11, 14.5), 14.5]} rotation={[0.4, 0.8, 1.2]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.4, 0.42, 2.8, 7]} />
          <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
        </mesh>
      </group>
    </group>
  );
}

// ────────────────────────────────────────────────────────────
// 3. CASTLE ZONE (Suncrest Stronghold Fortress on Broad Mountain Plateau)
// Elevated Shoulder x: 10..22, z: -7..-18, elevation: ~11.8m
// ────────────────────────────────────────────────────────────

function CastleZone() {
  const toonRamp = useMemo(() => getToonGradient4(), []);
  const stoneTex = useMemo(() => getStylizedStoneTexture('#626870', '#3c4046'), []);
  const darkStoneTex = useMemo(() => getStylizedStoneTexture('#484c52', '#2a2d32'), []);
  const woodTex = useMemo(() => getStylizedWoodTexture('#452b16', '#261608'), []);
  const roofTex = useMemo(() => getStylizedRoofTexture('#224478', '#142848'), []);
  const fabricBlueTex = useMemo(() => getStylizedFabricTexture('#245bb8'), []);
  const strawTex = useMemo(() => getStylizedStrawTexture(), []);

  useEffect(() => {
    registerObstacle('castle_gate_west', 12.6, -8.9, 1.2);
    registerObstacle('castle_gate_east', 15.0, -9.2, 1.2);
    registerObstacle('castle_sw_tower', 10.5, -8.2, 1.4);
    registerObstacle('castle_armory', 11.8, -12.0, 1.6);
    registerObstacle('castle_stables', 16.6, -8.8, 1.6);
    registerObstacle('castle_well', 14.8, -10.8, 0.8);
    registerObstacle('castle_west_wall', 10.5, -12.5, 1.4);
    return () => {
      unregisterObstacle('castle_gate_west');
      unregisterObstacle('castle_gate_east');
      unregisterObstacle('castle_sw_tower');
      unregisterObstacle('castle_armory');
      unregisterObstacle('castle_stables');
      unregisterObstacle('castle_well');
      unregisterObstacle('castle_west_wall');
    };
  }, []);

  const gateX = 13.8;
  const gateZ = -9.0;
  const gateY = getTerrainHeight(gateX, gateZ);

  // Courtyard flagstone pavers connecting gate, armory, well, dais, and keep
  const courtyardPavers = [
    // Gate to center bailey
    { x: 13.8, z: -9.2, w: 2.4, l: 1.2 },
    { x: 14.0, z: -10.0, w: 2.2, l: 1.2 },
    { x: 14.4, z: -10.8, w: 2.4, l: 1.2 },
    // Branch to King Aldric's dais
    { x: 14.2, z: -11.6, w: 2.0, l: 1.2 },
    { x: 14.0, z: -12.2, w: 2.2, l: 1.2 },
    // Branch to Garrison Armory & Sir Gareth
    { x: 13.2, z: -10.6, w: 1.6, l: 1.4 },
    { x: 12.4, z: -11.0, w: 1.6, l: 1.4 },
    { x: 11.8, z: -11.4, w: 1.8, l: 1.4 },
    // Branch to Citadel Keep approach
    { x: 15.4, z: -11.2, w: 1.8, l: 1.4 },
    { x: 16.2, z: -11.8, w: 2.0, l: 1.4 },
    { x: 16.8, z: -12.5, w: 2.2, l: 1.4 },
  ];

  return (
    <group>
      {/* ── 1. Flagstone Paved Courtyard Ground ── */}
      {courtyardPavers.map((pv, i) => {
        const y = getTerrainHeight(pv.x, pv.z);
        return (
          <mesh
            key={`paver-${i}`}
            position={[pv.x, y + 0.04, pv.z]}
            rotation={[-Math.PI / 2, 0, 0.15 * ((i % 3) - 1)]}
            receiveShadow
          >
            <planeGeometry args={[pv.w, pv.l]} />
            <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
          </mesh>
        );
      })}

      {/* ── 2. Outer Defensive Curtain Walls & Southwest Watchtower Bastion ── */}
      {/* Southwest Bastion Watchtower (overlooking mountain switchback road) */}
      <group position={[10.5, getTerrainHeight(10.5, -8.2), -8.2]}>
        <mesh position={[0, 2.6, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.4, 1.6, 5.2, 8]} />
          <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, 5.4, 0]} castShadow>
          <cylinderGeometry args={[1.75, 1.4, 0.6, 8]} />
          <meshToonMaterial map={darkStoneTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, 7.2, 0]} castShadow>
          <coneGeometry args={[1.8, 3.2, 8]} />
          <meshToonMaterial map={roofTex} gradientMap={toonRamp} />
        </mesh>
        <pointLight position={[0, 5.6, 0]} color="#ffa835" intensity={0.7} distance={7} />
      </group>

      {/* West Curtain Wall along Plateau Cliff Edge (x: 10.5, z: -8.5 to -15.5) */}
      <group position={[10.5, getTerrainHeight(10.5, -12.2), -12.2]}>
        <mesh position={[0, 2.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 4.6, 7.6]} />
          <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
        </mesh>
        {[-3.0, -1.5, 0, 1.5, 3.0].map((cz, i) => (
          <mesh key={`w-cren-${i}`} position={[0, 4.85, cz]} castShadow>
            <boxGeometry args={[1.15, 0.6, 0.7]} />
            <meshToonMaterial map={darkStoneTex} gradientMap={toonRamp} />
          </mesh>
        ))}
      </group>

      {/* South Curtain Wall (West segment: SW Bastion to Barbican Gate) */}
      <group position={[12.0, getTerrainHeight(12.0, -8.6), -8.6]} rotation={[0, -0.3, 0]}>
        <mesh position={[0, 2.1, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.4, 4.2, 1.1]} />
          <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
        </mesh>
        {[-0.7, 0.7].map((cx, i) => (
          <mesh key={`sw-cren-${i}`} position={[cx, 4.45, 0]} castShadow>
            <boxGeometry args={[0.65, 0.6, 1.15]} />
            <meshToonMaterial map={darkStoneTex} gradientMap={toonRamp} />
          </mesh>
        ))}
      </group>

      {/* South Curtain Wall (East segment: Barbican Gate toward Mountain Crags) */}
      <group position={[17.5, getTerrainHeight(17.5, -9.6), -9.6]} rotation={[0, 0.28, 0]}>
        <mesh position={[0, 2.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.2, 4.4, 1.1]} />
          <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
        </mesh>
        {[-1.8, -0.6, 0.6, 1.8].map((cx, i) => (
          <mesh key={`se-cren-${i}`} position={[cx, 4.65, 0]} castShadow>
            <boxGeometry args={[0.65, 0.6, 1.15]} />
            <meshToonMaterial map={darkStoneTex} gradientMap={toonRamp} />
          </mesh>
        ))}
      </group>

      {/* ── 3. Grand Barbican Gatehouse (Main Fortress Entrance at Road Head) ── */}
      <group position={[gateX, gateY, gateZ]} rotation={[0, -0.22, 0]}>
        {/* West Flanking Gate Tower */}
        <group position={[-1.4, 0, 0]}>
          <mesh position={[0, 2.6, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.95, 1.15, 5.2, 8]} />
            <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, 5.4, 0]} castShadow>
            <cylinderGeometry args={[1.25, 0.95, 0.5, 8]} />
            <meshToonMaterial map={darkStoneTex} gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, 6.9, 0]} castShadow>
            <coneGeometry args={[1.3, 2.6, 8]} />
            <meshToonMaterial map={roofTex} gradientMap={toonRamp} />
          </mesh>
          <pointLight position={[0, 3.2, 1.1]} color="#ffaa30" intensity={0.8} distance={6} />
        </group>

        {/* East Flanking Gate Tower */}
        <group position={[1.4, 0, 0]}>
          <mesh position={[0, 2.6, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.95, 1.15, 5.2, 8]} />
            <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, 5.4, 0]} castShadow>
            <cylinderGeometry args={[1.25, 0.95, 0.5, 8]} />
            <meshToonMaterial map={darkStoneTex} gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, 6.9, 0]} castShadow>
            <coneGeometry args={[1.3, 2.6, 8]} />
            <meshToonMaterial map={roofTex} gradientMap={toonRamp} />
          </mesh>
          <pointLight position={[0, 3.2, 1.1]} color="#ffaa30" intensity={0.8} distance={6} />
        </group>

        {/* Gatehouse Archway Lintel & Parapet */}
        <mesh position={[0, 3.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.1, 1.4, 1.3]} />
          <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, 4.75, 0]} castShadow>
          <boxGeometry args={[2.2, 0.5, 1.35]} />
          <meshToonMaterial map={darkStoneTex} gradientMap={toonRamp} />
        </mesh>

        {/* Raised Heavy Iron Portcullis Grating overhead */}
        <mesh position={[0, 2.9, 0]}>
          <boxGeometry args={[1.8, 1.4, 0.08]} />
          <meshToonMaterial color="#2d3138" gradientMap={toonRamp} />
        </mesh>

        {/* Open Heavy Oak Timber Gate Doors (folded back against jambs) */}
        <mesh position={[-0.85, 1.5, 0.2]} rotation={[0, 1.2, 0]} castShadow>
          <boxGeometry args={[0.85, 3.0, 0.1]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0.85, 1.5, 0.2]} rotation={[0, -1.2, 0]} castShadow>
          <boxGeometry args={[0.85, 3.0, 0.1]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>

        {/* Grand Suncrest Heraldic Tapestry Banner over Barbican Portal */}
        <group position={[0, 4.3, 0.7]}>
          <mesh castShadow>
            <boxGeometry args={[1.2, 1.8, 0.03]} />
            <meshToonMaterial map={fabricBlueTex} gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, 0.1, 0.02]}>
            <circleGeometry args={[0.32, 8]} />
            <meshToonMaterial color="#f0c030" gradientMap={toonRamp} />
          </mesh>
        </group>

        {/* Stepped Stone Approach Apron (linking switchback road to portal) */}
        {[0, 1, 2].map((st) => (
          <mesh key={`gate-step-${st}`} position={[0, 0.1 + st * 0.16, 0.9 + st * 0.45]} receiveShadow>
            <boxGeometry args={[2.5 - st * 0.2, 0.18, 0.5]} />
            <meshToonMaterial map={darkStoneTex} gradientMap={toonRamp} />
          </mesh>
        ))}
      </group>

      {/* ── 4. Garrison Armory & Guard Post (West Bailey, near Sir Gareth at 12, -10) ── */}
      <group position={[11.8, getTerrainHeight(11.8, -11.8), -11.8]} rotation={[0, 0.35, 0]}>
        {/* Armory Building Stone Masonry Body */}
        <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.2, 3.2, 2.4]} />
          <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
        </mesh>
        {/* Pitched Slate Roof */}
        <mesh position={[0, 3.7, 0]} rotation={[0, 0, 0]} castShadow>
          <coneGeometry args={[2.5, 1.4, 4]} />
          <meshToonMaterial map={roofTex} gradientMap={toonRamp} />
        </mesh>
        {/* Sturdy Studded Oak Door */}
        <mesh position={[0.7, 1.1, 1.22]}>
          <boxGeometry args={[0.85, 2.1, 0.08]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        {/* Outdoor Covered Weapon Rack */}
        <group position={[-0.9, 0.65, 1.3]}>
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[1.1, 1.3, 0.3]} />
            <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
          </mesh>
          {/* Standing Halberds & Speartips */}
          {[-0.35, 0, 0.35].map((wx, i) => (
            <mesh key={`spear-${i}`} position={[wx, 0.8, 0]} castShadow>
              <cylinderGeometry args={[0.02, 0.03, 1.6, 5]} />
              <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
            </mesh>
          ))}
        </group>
        {/* Knight Training Quintain / Straw Target Dummy */}
        <group position={[1.8, 0, 0.6]}>
          <mesh position={[0, 0.7, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.08, 1.4, 6]} />
            <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, 1.3, 0]} castShadow>
            <cylinderGeometry args={[0.26, 0.22, 0.75, 7]} />
            <meshToonMaterial map={strawTex} gradientMap={toonRamp} />
          </mesh>
          <mesh position={[0, 1.8, 0]} castShadow>
            <sphereGeometry args={[0.16, 6, 5]} />
            <meshToonMaterial color="#c2b090" gradientMap={toonRamp} />
          </mesh>
          {/* Target Shield on Dummy */}
          <mesh position={[0, 1.25, 0.26]}>
            <boxGeometry args={[0.38, 0.5, 0.04]} />
            <meshToonMaterial map={fabricBlueTex} gradientMap={toonRamp} />
          </mesh>
        </group>
      </group>

      {/* ── 5. Fortress Stables & Supply Lean-to (East Bailey, near Vanguard at 16, -9) ── */}
      <group position={[16.5, getTerrainHeight(16.5, -8.8), -8.8]} rotation={[0, -0.4, 0]}>
        {/* Timber Support Posts */}
        {[-1.4, 1.4].map((px, i) =>
          [-0.9, 0.9].map((pz, j) => (
            <mesh key={`st-post-${i}-${j}`} position={[px, 1.2, pz]} castShadow>
              <boxGeometry args={[0.14, 2.4, 0.14]} />
              <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
            </mesh>
          ))
        )}
        {/* Angled Timber Shake Lean-to Roof */}
        <mesh position={[0, 2.5, 0]} rotation={[0.15, 0, 0]} castShadow>
          <boxGeometry args={[3.4, 0.12, 2.4]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        {/* Stacked Hay Bales for Cavalry Mounts */}
        {[
          { x: -0.8, y: 0.25, z: -0.2 },
          { x: -0.8, y: 0.65, z: -0.2 },
          { x: -0.1, y: 0.25, z: -0.3 },
        ].map((hb, i) => (
          <mesh key={`hay-${i}`} position={[hb.x, hb.y, hb.z]} castShadow receiveShadow>
            <boxGeometry args={[0.7, 0.4, 0.5]} />
            <meshToonMaterial map={strawTex} gradientMap={toonRamp} />
          </mesh>
        ))}
        {/* Water Trough & Supply Barrels */}
        <mesh position={[0.7, 0.25, -0.2]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.4, 0.45]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0.9, 0.35, 0.5]} castShadow>
          <cylinderGeometry args={[0.26, 0.24, 0.65, 7]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
      </group>

      {/* ── 6. Royal Courtyard Stone Well / Cistern (x: 14.8, z: -10.8) ── */}
      <group position={[14.8, getTerrainHeight(14.8, -10.8), -10.8]}>
        {/* Dressed Stone Well Wall Ring */}
        <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.85, 0.95, 0.84, 9]} />
          <meshToonMaterial map={stoneTex} gradientMap={toonRamp} />
        </mesh>
        {/* Inner Water Surface */}
        <mesh position={[0, 0.65, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.72, 8]} />
          <meshToonMaterial color="#254d72" gradientMap={toonRamp} />
        </mesh>
        {/* Timber Roof Posts */}
        {[-0.7, 0.7].map((px, i) => (
          <mesh key={`well-p-${i}`} position={[px, 1.25, 0]} castShadow>
            <boxGeometry args={[0.1, 1.7, 0.1]} />
            <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
          </mesh>
        ))}
        {/* Crossbeam with Windlass Crank */}
        <mesh position={[0, 1.95, 0]} castShadow>
          <boxGeometry args={[1.55, 0.1, 0.1]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        {/* Pitched Timber Well Canopy */}
        <mesh position={[0, 2.3, 0]} castShadow>
          <coneGeometry args={[1.15, 0.75, 4]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
      </group>

      {/* ── 7. King Aldric's Royal Dais & Royal Standards (behind King at 14, -12) ── */}
      <group position={[14.0, getTerrainHeight(14.0, -12.4), -12.4]}>
        {/* Low Carved Stone Dais Platform */}
        <mesh position={[0, 0.12, 0]} receiveShadow>
          <cylinderGeometry args={[1.6, 1.8, 0.24, 8]} />
          <meshToonMaterial map={darkStoneTex} gradientMap={toonRamp} />
        </mesh>
        {/* Flanking Tall Royal Standard Banners */}
        {[-1.3, 1.3].map((bx, i) => (
          <group key={`k-std-${i}`} position={[bx, 0, -0.4]}>
            <mesh position={[0, 2.5, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.07, 5.0, 6]} />
              <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
            </mesh>
            <mesh position={[0.45, 3.8, 0]} castShadow>
              <boxGeometry args={[0.85, 1.8, 0.03]} />
              <meshToonMaterial map={fabricBlueTex} gradientMap={toonRamp} />
            </mesh>
            <mesh position={[0.45, 3.8, 0.02]}>
              <boxGeometry args={[0.4, 0.45, 0.02]} />
              <meshToonMaterial color="#f0c030" gradientMap={toonRamp} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ── 8. Flickering Iron Fire-Basket Braziers ── */}
      {[
        { x: 12.2, z: -9.5 },
        { x: 15.4, z: -9.6 },
        { x: 11.2, z: -11.0 },
        { x: 15.8, z: -11.2 },
      ].map((br, i) => {
        const y = getTerrainHeight(br.x, br.z);
        return (
          <group key={`brazier-${i}`} position={[br.x, y, br.z]}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.18, 0.24, 0.9, 6]} />
              <meshToonMaterial color="#30343a" gradientMap={toonRamp} />
            </mesh>
            <mesh position={[0, 0.95, 0]}>
              <cylinderGeometry args={[0.38, 0.18, 0.3, 7]} />
              <meshToonMaterial color="#24262a" gradientMap={toonRamp} />
            </mesh>
            <mesh position={[0, 1.18, 0]}>
              <coneGeometry args={[0.2, 0.42, 5]} />
              <meshToonMaterial color="#ff7711" emissive="#ff5500" emissiveIntensity={1.2} gradientMap={toonRamp} />
            </mesh>
            <pointLight position={[0, 1.25, 0]} color="#ff7722" intensity={1.1} distance={7} />
          </group>
        );
      })}
    </group>
  );
}

// ─── Interactive War Campfire with Rain Suppression ────────────

function InteractiveCampfire() {
  const toonRamp = useMemo(() => getToonGradient3(), []);
  const isCampfireBurning = useWorldStore((s) => s.isCampfireBurning);
  const weatherType = useWorldStore((s) => s.weather.type);
  const flameRef = useRef<THREE.Mesh>(null!);
  const steamRef = useRef<THREE.Points>(null!);
  const lightRef = useRef<THREE.PointLight>(null!);
  const flameScale = useRef(isCampfireBurning ? 1.0 : 0.0);

  // Steam particle positions
  const steamPositions = useMemo(() => {
    const p = new Float32Array(16 * 3);
    for (let i = 0; i < 16; i++) {
      p[i * 3] = (Math.random() - 0.5) * 0.4;
      p[i * 3 + 1] = 0.2 + (i / 16) * 1.2;
      p[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    }
    return p;
  }, []);

  // Suppress fire when raining / storming
  useEffect(() => {
    if ((weatherType === 'rain' || weatherType === 'storm') && isCampfireBurning) {
      playFireHiss();
      useWorldStore.getState().setCampfireBurning(false);
    }
  }, [weatherType, isCampfireBurning]);

  useFrame((state, delta) => {
    // Smooth transition between burning and extinguished
    const targetScale = isCampfireBurning ? 1.0 : 0.0;
    flameScale.current = THREE.MathUtils.lerp(flameScale.current, targetScale, 0.08);

    if (flameRef.current) {
      const flicker = 1.0 + Math.sin(state.clock.elapsedTime * 12.0) * 0.12;
      flameRef.current.scale.set(
        flameScale.current * flicker,
        flameScale.current * (flicker + 0.1),
        flameScale.current * flicker
      );
      flameRef.current.visible = flameScale.current > 0.02;
    }

    if (lightRef.current) {
      lightRef.current.intensity = flameScale.current * (0.8 + Math.sin(state.clock.elapsedTime * 9.0) * 0.2);
    }

    if (steamRef.current) {
      // Steam rises when recently extinguished or during rain
      const showSteam = !isCampfireBurning && (weatherType === 'rain' || weatherType === 'storm');
      steamRef.current.visible = showSteam;
      if (showSteam) {
        const attr = steamRef.current.geometry.attributes.position as THREE.BufferAttribute;
        const arr = attr.array as Float32Array;
        for (let i = 0; i < 16; i++) {
          arr[i * 3 + 1] += delta * 0.8;
          if (arr[i * 3 + 1] > 1.8) {
            arr[i * 3 + 1] = 0.2;
            arr[i * 3] = (Math.random() - 0.5) * 0.35;
            arr[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
          }
        }
        attr.needsUpdate = true;
      }
    }
  });

  const posX = 14.0;
  const posZ = 16.0;
  const posY = getTerrainHeight(posX, posZ);

  return (
    <group position={[posX, posY, posZ]}>
      {/* Scorched Earth Circle */}
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.1, 8]} />
        <meshToonMaterial color="#22201e" gradientMap={toonRamp} />
      </mesh>

      {/* Ring of Charcoal Stones */}
      {Array.from({ length: 6 }).map((_, si) => {
        const a = (si / 6) * Math.PI * 2;
        return (
          <mesh key={`fire-st-${si}`} position={[Math.cos(a) * 0.75, 0.12, Math.sin(a) * 0.75]} castShadow>
            <dodecahedronGeometry args={[0.16, 0]} />
            <meshToonMaterial color="#45423e" gradientMap={toonRamp} />
          </mesh>
        );
      })}

      {/* Charred Wood Logs in Center */}
      {[-0.2, 0.2].map((lx, i) => (
        <mesh key={`log-${i}`} position={[lx, 0.08, 0]} rotation={[0, i * 0.9, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.07, 0.08, 0.7, 5]} />
          <meshToonMaterial color="#1a1816" gradientMap={toonRamp} />
        </mesh>
      ))}

      {/* Dynamic Animated Flame Cone */}
      <mesh ref={flameRef} position={[0, 0.25, 0]}>
        <coneGeometry args={[0.32, 0.55, 5]} />
        <meshToonMaterial color="#ff5511" emissive="#dd3300" emissiveIntensity={0.9} gradientMap={toonRamp} />
      </mesh>

      {/* Warm Fire Point Light */}
      <pointLight ref={lightRef} position={[0, 0.45, 0]} color="#ff7711" intensity={0.8} distance={8} />

      {/* Steam Puffs when extinguished by Rain/Water */}
      <points ref={steamRef} visible={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[steamPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#d4e8f0" size={0.16} transparent opacity={0.65} depthWrite={false} />
      </points>
    </group>
  );
}

// ────────────────────────────────────────────────────────────
// 4. OPEN AREA FOR BATTLES (Standoff Plains at x: 8..24, z: 2..22)
// ────────────────────────────────────────────────────────────

function BattleZone() {
  const toonRamp = useMemo(() => getToonGradient3(), []);
  const woodTex = useMemo(() => getStylizedWoodTexture('#4a3018', '#2a1a0c'), []);
  const strawTex = useMemo(() => getStylizedStrawTexture(), []);
  const fabricRedTex = useMemo(() => getStylizedFabricTexture('#9e1e1e'), []);

  useEffect(() => {
    registerObstacle('battle_barricade_1', 12.0, 8.5, 1.5);
    registerObstacle('battle_barricade_2', 15.5, 12.0, 1.5);
    return () => {
      unregisterObstacle('battle_barricade_1');
      unregisterObstacle('battle_barricade_2');
    };
  }, []);

  return (
    <group>
      {/* ── Spiked Wooden Chevron Barricades (Anti-Cavalry) ── */}
      {[
        { x: 12.0, z: 8.5, rot: 0.35 },
        { x: 15.5, z: 12.0, rot: -0.2 },
      ].map((bar, i) => {
        const y = getTerrainHeight(bar.x, bar.z);
        return (
          <group key={`barricade-${i}`} position={[bar.x, y + 0.5, bar.z]} rotation={[0, bar.rot, 0]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[3.2, 0.25, 0.25]} />
              <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
            </mesh>
            {[-1.1, -0.4, 0.4, 1.1].map((sx, si) => (
              <group key={`stake-${si}`} position={[sx, 0, 0]}>
                <mesh rotation={[0.65, 0, 0]} castShadow>
                  <coneGeometry args={[0.1, 1.5, 5]} />
                  <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
                </mesh>
                <mesh rotation={[-0.65, 0, 0]} castShadow>
                  <coneGeometry args={[0.1, 1.5, 5]} />
                  <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}

      {/* ── Training Combat Dummy & Weapon Rack ── */}
      <group position={[18.5, getTerrainHeight(18.5, 7.5), 7.5]} rotation={[0, -0.5, 0]}>
        <mesh position={[0, 1.0, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.12, 2.0, 6]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, 1.25, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.3, 0.9, 7]} />
          <meshToonMaterial map={strawTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0, 1.45, 0]} castShadow>
          <boxGeometry args={[1.3, 0.14, 0.14]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0.55, 1.35, 0.1]} rotation={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.45, 0.6, 0.08]} />
          <meshToonMaterial color="#7a3424" gradientMap={toonRamp} />
        </mesh>
      </group>

      {/* ── Interactive War Campfire with Rain Suppression ── */}
      <InteractiveCampfire />

      {/* ── Shadowfang War Standard (Crimson / Iron) ── */}
      <group position={[10.5, getTerrainHeight(10.5, 19.0), 19.0]} rotation={[0, 0.2, 0]}>
        <mesh position={[0, 2.5, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.09, 5.0, 6]} />
          <meshToonMaterial map={woodTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0.5, 3.8, 0]} castShadow>
          <boxGeometry args={[0.9, 1.6, 0.04]} />
          <meshToonMaterial map={fabricRedTex} gradientMap={toonRamp} />
        </mesh>
        <mesh position={[0.5, 3.8, 0.03]}>
          <boxGeometry args={[0.4, 0.4, 0.02]} />
          <meshToonMaterial color="#202020" gradientMap={toonRamp} />
        </mesh>
      </group>
    </group>
  );
}

// ────────────────────────────────────────────────────────────
// 5. BOUNDARY ENCLOSURE (Cliffs & Natural Perimeter Formations)
// ────────────────────────────────────────────────────────────

function BoundaryCliffs() {
  const toonRamp = useMemo(() => getToonGradient4(), []);
  const cliffClusters = [
    { x: 0,   z: -85, scale: 6.5, ry: 0.2 },
    { x: 80,  z: -65, scale: 7.2, ry: 1.1 },
    { x: 88,  z: 0,   scale: 6.8, ry: 2.3 },
    { x: 75,  z: 75,  scale: 7.0, ry: 0.7 },
    { x: 0,   z: 88,  scale: 6.5, ry: 1.8 },
    { x: -78, z: 72,  scale: 7.5, ry: 2.9 },
    { x: -88, z: 0,   scale: 6.6, ry: 0.5 },
    { x: -75, z: -70, scale: 7.4, ry: 1.6 },
  ];

  return (
    <group>
      {cliffClusters.map((c, i) => {
        const y = getTerrainHeight(c.x, c.z);
        return (
          <group key={`cliff-${i}`} position={[c.x, y + c.scale * 0.2, c.z]} rotation={[0.1, c.ry, 0]}>
            <mesh castShadow receiveShadow>
              <dodecahedronGeometry args={[c.scale, 0]} />
              <meshToonMaterial color="#5e574e" gradientMap={toonRamp} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ────────────────────────────────────────────────────────────
// COMBINED ZONES EXPORT
// ────────────────────────────────────────────────────────────

export default function ZoneLandmarks() {
  return (
    <group>
      <VillageZone />
      <RuinsZone />
      <CastleZone />
      <BattleZone />
      <BoundaryCliffs />
    </group>
  );
}
