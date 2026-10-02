// ============================================================
// VERIFY PLAYABLE ROUTE — Village to Mountain Castle
// Validates continuous walkable navigation, slope limits,
// mountain silhouette visibility, and NPC safety.
// ============================================================

import { getTerrainHeight, isWater } from '../src/core/terrain';
import { getTerrainSlope } from '../src/core/physicsWorld';
import { resolveCollision } from '../src/core/collision';

console.log('──────────────────────────────────────────────────────');
console.log('⛰️  VERIFYING PLAYABLE ROUTE & VISUAL HIERARCHY');
console.log('──────────────────────────────────────────────────────\n');

let allPassed = true;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`✅ ${msg}`);
  } else {
    console.error(`❌ FAILED: ${msg}`);
    allPassed = false;
  }
}

// ─── 1. Check Key World Landmarks Elevations ────────────────
console.log('📍 [Step 1] Inspecting Landmark Elevations & Visual Hierarchy:');
const villageH = getTerrainHeight(4, 7);
const castleH = getTerrainHeight(18, -14);
const mountainPeakH = getTerrainHeight(32, -30);
const shadowPassH = getTerrainHeight(-20, -12);
const bridgeH = getTerrainHeight(-8, 5);

console.log(`   Village Valley Center (4, 7):     ${villageH.toFixed(2)}m`);
console.log(`   River Bed at Bridge (-8, 5):      ${bridgeH.toFixed(2)}m`);
console.log(`   Shadow Pass Bastion (-20, -12):    ${shadowPassH.toFixed(2)}m`);
console.log(`   Suncrest Castle Plateau (18, -14): ${castleH.toFixed(2)}m`);
console.log(`   Framing Mountain Massif (32, -30): ${mountainPeakH.toFixed(2)}m`);

assert(villageH >= 1.8 && villageH <= 2.6, 'Village sits in gentle lower valley (1.8m - 2.6m)');
assert(castleH >= 11.5 && castleH <= 12.8, 'Castle sits firmly on broad elevated mountain plateau shelf (11.5m - 12.8m)');
assert(mountainPeakH >= 50.0, 'Mountain peak dominates horizon behind the castle with soaring summit (> 50m)');
assert(mountainPeakH > castleH + 35.0, 'Mountain massif towers high behind castle to naturally frame the fortress');

// ─── 2. Line of Sight / Skyline Check from Village ──────────
console.log('\n👁️ [Step 2] Testing Horizon Landmark Visibility from Village:');
// From village (4, 7) looking at Mountain Peak (32, -30):
// Sample heights along ray to ensure intermediate terrain doesn't occlude peak
let rayOccluded = false;
for (let t = 0.1; t < 0.95; t += 0.05) {
  const rx = 4 + t * (32 - 4);
  const rz = 7 + t * (-30 - 7);
  const groundY = getTerrainHeight(rx, rz);
  // Line of sight ray from eye at village (villageH + 1.7) to mountain peak (mountainPeakH)
  const rayY = (villageH + 1.7) + t * (mountainPeakH - (villageH + 1.7));
  if (groundY > rayY) {
    rayOccluded = true;
    break;
  }
}
assert(!rayOccluded, 'Mountain peak is visible from the village above intermediate terrain');

// ─── 3. Continuous Walkable Route from Village to Castle ────
console.log('\n🚶 [Step 3] Testing Walkable Route from Village to Mountain Castle:');

// Key waypoints along the route:
// Village Center -> Village North Road -> Valley Crossroads -> Mountain Trailhead -> Switchbacks -> Barbican Gate -> Bailey Courtyard -> Keep
const routeWaypoints = [
  { x: 4.0, z: 7.0, desc: 'Village Center' },
  { x: 3.5, z: 4.5, desc: 'Village North Road' },
  { x: 3.0, z: 2.0, desc: 'Valley Crossroads' },
  { x: 4.5, z: 0.0, desc: 'Mountain Trailhead' },
  { x: 7.0, z: -2.0, desc: 'Lower Mountain Shoulder' },
  { x: 9.2, z: -4.2, desc: 'Switchback Curve 1' },
  { x: 11.2, z: -6.5, desc: 'Switchback Curve 2' },
  { x: 13.0, z: -8.8, desc: 'Upper Mountain Ascent' },
  { x: 13.8, z: -9.0, desc: 'Grand Barbican Gatehouse' },
  { x: 14.5, z: -11.0, desc: 'Inner Bailey Courtyard' },
  { x: 16.8, z: -12.8, desc: 'Keep Approach Steps' },
  { x: 18.0, z: -14.0, desc: 'Suncrest Citadel Keep' },
];

let maxSlopeOnRoute = 0;
let maxStepDelta = 0;
let routeBlockedByWater = false;
let routeBlockedByObstacle = false;

for (let s = 0; s < routeWaypoints.length - 1; s++) {
  const pA = routeWaypoints[s];
  const pB = routeWaypoints[s + 1];
  const dist = Math.hypot(pB.x - pA.x, pB.z - pA.z);
  const steps = Math.ceil(dist / 0.4); // Sample every 0.4 meters

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = pA.x + t * (pB.x - pA.x);
    const z = pA.z + t * (pB.z - pA.z);

    if (isWater(x, z)) routeBlockedByWater = true;

    const slope = getTerrainSlope(x, z);
    if (slope.slopeAngleDeg > maxSlopeOnRoute) {
      maxSlopeOnRoute = slope.slopeAngleDeg;
    }

    // Check step delta with previous position
    if (i > 0) {
      const prevX = pA.x + ((i - 1) / steps) * (pB.x - pA.x);
      const prevZ = pA.z + ((i - 1) / steps) * (pB.z - pA.z);
      const deltaY = Math.abs(getTerrainHeight(x, z) - getTerrainHeight(prevX, prevZ));
      if (deltaY > maxStepDelta) maxStepDelta = deltaY;
    }

    // Verify collisions don't push player off the road
    const resolved = resolveCollision(x, z, 0.45);
    const displacement = Math.hypot(resolved.x - x, resolved.z - z);
    if (displacement > 0.8) {
      routeBlockedByObstacle = true;
    }
  }
}

console.log(`   Maximum Slope Angle encountered: ${maxSlopeOnRoute.toFixed(1)}° (Threshold < 40°)`);
console.log(`   Maximum Step Delta per 0.4m:     ${maxStepDelta.toFixed(3)}m (Threshold < 0.35m)`);

assert(!routeBlockedByWater, 'No water blocks the mountain route');
assert(maxSlopeOnRoute < 40.0, 'Mountain road slopes remain below sliding threshold (< 40°)');
assert(maxStepDelta < 0.35, 'Vertical step climbing is smooth and walkable (< 0.35m per step)');
assert(!routeBlockedByObstacle, 'Roadway is clear of impassable obstacle colliders');

// ─── 4. Verify NPC Safety & Non-Breaking Coordinates ────────
console.log('\n👥 [Step 4] Verifying Critical NPC Grounding:');
const npcs = [
  { name: 'Rowan the Miller', x: 5, z: 5 },
  { name: 'Elspeth the Herbalist', x: 2, z: 6 },
  { name: 'Mira the Seer', x: -4, z: 9 },
  { name: 'King Aldric the Just', x: 14, z: -12 },
  { name: 'Sir Gareth', x: 12, z: -10 },
  { name: 'Suncrest Vanguard', x: 16, z: -9 },
  { name: 'Shadow Bastion King Vorn', x: -16, z: -10 },
];

for (const npc of npcs) {
  const y = getTerrainHeight(npc.x, npc.z);
  const water = isWater(npc.x, npc.z);
  assert(!water, `${npc.name} at (${npc.x}, ${npc.z}) is on solid ground (Y = ${y.toFixed(2)}m)`);
}

console.log('\n──────────────────────────────────────────────────────');
if (allPassed) {
  console.log('🎉 ALL PLAYABLE ROUTE & ENVIRONMENT TESTS PASSED 100%!');
} else {
  console.error('❌ SOME TESTS FAILED — CHECK ERRORS ABOVE');
  process.exit(1);
}
console.log('──────────────────────────────────────────────────────');
