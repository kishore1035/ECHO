// ============================================================
// PHYSICS WORLD — Lightweight World Physics & Water Simulation
// Handles water depth, river current drift, slope sliding,
// dynamic prop collisions, impulse transfer, and destruction.
// ============================================================

import * as THREE from 'three';
import { getTerrainHeight, isWater } from './terrain';
import type { DynamicProp, WaterDepthState, Vec3 } from './types';
import { soundFX } from './soundFX';

// ─── 1. Water System & Depth Calculation ──────────────────────

export const WATER_SURFACE_Y = 0.0;

/**
 * Returns water depth at world coordinates (x, z).
 * If terrain is above water level, depth is 0.
 */
export function getWaterDepth(x: number, z: number): number {
  const groundY = getTerrainHeight(x, z);
  if (groundY >= WATER_SURFACE_Y) return 0;
  return WATER_SURFACE_Y - groundY;
}

/**
 * Classifies water depth state for a point at (x, y, z).
 */
export function getWaterState(x: number, y: number, z: number): WaterDepthState {
  const depth = getWaterDepth(x, z);
  if (depth <= 0.05) return 'none';

  // Shallow wading: water reaches feet/shins
  if (depth < 1.1) return 'shallow';

  // Deep water:
  // If player's head/eyes are below the water plane (with small tolerance)
  if (y < WATER_SURFACE_Y - 0.75) {
    return 'underwater';
  }

  // Floating / swimming on the surface
  return 'swimming';
}

/**
 * Calculates river current velocity vector at (x, z).
 * Flows generally from North to South down the diagonal river trench.
 */
export function getRiverCurrent(x: number, z: number): { vx: number; vz: number } {
  if (!isWater(x, z)) return { vx: 0, vz: 0 };
  const depth = getWaterDepth(x, z);
  if (depth < 0.2) return { vx: 0, vz: 0 };

  // Trench line: (x + 8) * 0.4 - (z - 5) * 0.15
  // Current flows downhill along the riverbed channel towards positive Z
  const speed = Math.min(1.1, depth * 0.55); // deeper water has slightly swifter current
  const dirX = 0.18;
  const dirZ = 0.98;
  const len = Math.hypot(dirX, dirZ) || 1;

  return {
    vx: (dirX / len) * speed,
    vz: (dirZ / len) * speed,
  };
}

// ─── 2. Terrain Slope & Slide Vector ──────────────────────────

/**
 * Calculates terrain slope gradient at (x, z).
 * Returns { slopeAngleDeg, slideX, slideZ }
 */
export function getTerrainSlope(x: number, z: number): {
  slopeAngleDeg: number;
  slideX: number;
  slideZ: number;
} {
  const step = 0.4;
  const hC = getTerrainHeight(x, z);
  const hR = getTerrainHeight(x + step, z);
  const hF = getTerrainHeight(x, z + step);

  const dhdx = (hR - hC) / step;
  const dhdz = (hF - hC) / step;

  const gradLen = Math.hypot(dhdx, dhdz);
  const slopeAngleDeg = (Math.atan(gradLen) * 180) / Math.PI;

  // Slide vector points in direction of steepest downhill gradient (-gradient)
  const slideX = gradLen > 0.001 ? -dhdx / gradLen : 0;
  const slideZ = gradLen > 0.001 ? -dhdz / gradLen : 0;

  return { slopeAngleDeg, slideX, slideZ };
}

// ─── 3. Dynamic Physical Props ─────────────────────────────────

export function createInitialProps(): Record<string, DynamicProp> {
  return {
    // Village wooden crates & barrels
    prop_crate_1: {
      id: 'prop_crate_1',
      name: 'Flour Crate',
      propType: 'crate',
      position: { x: 2.2, y: getTerrainHeight(2.2, 8.8) + 0.35, z: 8.8 },
      rotation: { x: 0, y: 0.1, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      radius: 0.5,
      mass: 14,
      health: 40,
      isBroken: false,
    },
    prop_crate_2: {
      id: 'prop_crate_2',
      name: 'Supply Crate',
      propType: 'crate',
      position: { x: 2.8, y: getTerrainHeight(2.8, 9.0) + 0.35, z: 9.0 },
      rotation: { x: 0, y: 0.3, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      radius: 0.45,
      mass: 12,
      health: 40,
      isBroken: false,
    },
    prop_barrel_1: {
      id: 'prop_barrel_1',
      name: 'Old Mill Grain Barrel',
      propType: 'barrel',
      position: { x: 1.4, y: getTerrainHeight(1.4, 1.6) + 0.4, z: 1.6 },
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      radius: 0.4,
      mass: 18,
      health: 50,
      isBroken: false,
    },
    prop_barrel_2: {
      id: 'prop_barrel_2',
      name: 'River Dock Barrel',
      propType: 'barrel',
      position: { x: -5.6, y: getTerrainHeight(-5.6, 4.2) + 0.4, z: 4.2 },
      rotation: { x: 0, y: 0.2, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      radius: 0.4,
      mass: 18,
      health: 50,
      isBroken: false,
    },
    // Loose boulders on paths / slopes
    prop_rock_1: {
      id: 'prop_rock_1',
      name: 'Loose River Boulder',
      propType: 'rock',
      position: { x: -6.5, y: getTerrainHeight(-6.5, 3.2) + 0.35, z: 3.2 },
      rotation: { x: 0.1, y: 0.4, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      radius: 0.55,
      mass: 35,
      health: 120,
      isBroken: false,
    },
    prop_rock_2: {
      id: 'prop_rock_2',
      name: 'Ridge Stone',
      propType: 'rock',
      position: { x: 11.5, y: getTerrainHeight(11.5, 6.5) + 0.35, z: 6.5 },
      rotation: { x: 0, y: 0.8, z: 0.1 },
      velocity: { x: 0, y: 0, z: 0 },
      radius: 0.5,
      mass: 30,
      health: 120,
      isBroken: false,
    },
  };
}

/**
 * Steps the physics simulation for all dynamic props.
 * Handles gravity, friction, player collisions/pushing, and terrain bounds.
 */
export function stepDynamicProps(
  props: Record<string, DynamicProp>,
  dt: number,
  playerPos: Vec3,
  playerRadius: number,
  playerVel: Vec3
): Record<string, DynamicProp> {
  const updated = { ...props };
  const friction = 6.5;

  for (const [id, prop] of Object.entries(updated)) {
    if (prop.isBroken) continue;

    let px = prop.position.x;
    let py = prop.position.y;
    let pz = prop.position.z;
    let vx = prop.velocity.x;
    let vy = prop.velocity.y;
    let vz = prop.velocity.z;

    // Apply friction deceleration
    vx = THREE.MathUtils.lerp(vx, 0, friction * dt);
    vz = THREE.MathUtils.lerp(vz, 0, friction * dt);

    // Gravity
    vy -= 18 * dt;

    // ── Player pushing prop interaction ──
    const dx = px - playerPos.x;
    const dz = pz - playerPos.z;
    const distSq = dx * dx + dz * dz;
    const minDist = prop.radius + playerRadius;

    if (distSq < minDist * minDist && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const nx = dx / dist;
      const nz = dz / dist;
      const overlap = minDist - dist;

      // Displace prop away from player
      px += nx * overlap;
      pz += nz * overlap;

      // Transfer momentum from player
      const pushSpeed = Math.hypot(playerVel.x, playerVel.z);
      if (pushSpeed > 0.4) {
        vx += (nx * pushSpeed * 0.45) / (prop.mass * 0.05);
        vz += (nz * pushSpeed * 0.45) / (prop.mass * 0.05);
        soundFX.playPropImpact();
      }
    }

    // Integrate position
    px += vx * dt;
    py += vy * dt;
    pz += vz * dt;

    // Grounding on terrain or floating in water
    const groundY = getTerrainHeight(px, pz);
    const inWater = groundY < WATER_SURFACE_Y;

    // Props float or rest on ground
    const targetY = inWater && prop.propType !== 'rock' ? WATER_SURFACE_Y - 0.1 : groundY + prop.radius * 0.7;

    if (py <= targetY) {
      py = targetY;
      vy = 0;
    }

    // River current drift if floating in water
    if (inWater && prop.propType !== 'rock') {
      const current = getRiverCurrent(px, pz);
      px += current.vx * dt * 0.8;
      pz += current.vz * dt * 0.8;
    }

    // Tumble rotation based on velocity
    const speed = Math.hypot(vx, vz);
    const rotSpeed = speed * dt * 2.0;

    updated[id] = {
      ...prop,
      position: { x: px, y: py, z: pz },
      rotation: {
        x: prop.rotation.x + rotSpeed * 0.8,
        y: prop.rotation.y + rotSpeed * 0.3,
        z: prop.rotation.z,
      },
      velocity: { x: vx, y: vy, z: vz },
    };
  }

  return updated;
}

/**
 * Handles attack slashes against physical props.
 * Applies impulse and fracture if health drops to 0.
 */
export function applyAttackToProps(
  props: Record<string, DynamicProp>,
  origin: Vec3,
  forwardX: number,
  forwardZ: number,
  reach = 2.6
): { updatedProps: Record<string, DynamicProp>; hitCount: number } {
  const updated = { ...props };
  let hitCount = 0;

  for (const [id, prop] of Object.entries(updated)) {
    if (prop.isBroken) continue;

    const dx = prop.position.x - origin.x;
    const dz = prop.position.z - origin.z;
    const distSq = dx * dx + dz * dz;

    if (distSq < reach * reach) {
      const dot = dx * forwardX + dz * forwardZ;
      if (dot > 0.2) {
        // Hit prop!
        hitCount++;
        const newHealth = prop.health - 25;
        const impulse = 6.5 / (prop.mass * 0.05);

        soundFX.playPropImpact();

        if (newHealth <= 0 && prop.propType !== 'rock') {
          // Break prop into debris
          updated[id] = {
            ...prop,
            health: 0,
            isBroken: true,
          };
          soundFX.playDestructionSound();
        } else {
          // Launch prop with impulse
          updated[id] = {
            ...prop,
            health: newHealth,
            velocity: {
              x: forwardX * impulse,
              y: 2.8,
              z: forwardZ * impulse,
            },
          };
        }
      }
    }
  }

  return { updatedProps: updated, hitCount };
}
