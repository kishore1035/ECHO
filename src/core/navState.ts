// ============================================================
// NAVIGATION STATE — Real-time camera heading & player position
// Lightweight mutable telemetry decoupled from React re-renders.
// ============================================================

export interface NavState {
  yaw: number;        // Camera horizontal angle in radians
  playerX: number;
  playerY: number;
  playerZ: number;
  cameraX: number;
  cameraY: number;
  cameraZ: number;
}

export const navState: NavState = {
  yaw: Math.PI,
  playerX: 0,
  playerY: 0,
  playerZ: 0,
  cameraX: 0,
  cameraY: 0,
  cameraZ: 0,
};

export interface CompassMarker {
  id: string;
  label: string;
  x: number;
  z: number;
  isObjective?: boolean;
  priority?: number;
}

// Fixed iconic world landmarks for exploration
export const WORLD_LANDMARK_MARKERS: CompassMarker[] = [
  { id: 'mill', label: 'OLD MILL', x: 2, z: 6, priority: 2 },
  { id: 'stones', label: 'WHISPERING STONES', x: -4, z: 9, priority: 3 },
  { id: 'bridge', label: 'STONE BRIDGE', x: -8, z: 5, priority: 2 },
  { id: 'castle', label: 'SUNCREST CASTLE', x: 18, z: -14, priority: 3 },
  { id: 'shadowfang', label: 'SHADOWFANG', x: -28, z: 24, priority: 3 },
];

/**
 * Calculates bearing angle in degrees [0, 360) from origin (ox, oz) to target (tx, tz).
 * North (0°) is along -Z axis.
 * East (90°) is along +X axis.
 * South (180°) is along +Z axis.
 * West (270°) is along -X axis.
 */
export function calculateBearing(ox: number, oz: number, tx: number, tz: number): number {
  const dx = tx - ox;
  const dz = tz - oz;
  // atan2(dx, -dz) gives angle where North (-Z) is 0 rad
  let deg = (Math.atan2(dx, -dz) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg;
}

/**
 * Calculates signed angular difference between a target bearing and camera heading in degrees.
 * Returns value in [-180, 180]. Negative is left of center, positive is right of center.
 */
export function getRelativeAngle(targetBearingDeg: number, cameraHeadingDeg: number): number {
  let diff = (targetBearingDeg - cameraHeadingDeg) % 360;
  if (diff < -180) diff += 360;
  if (diff > 180) diff -= 360;
  return diff;
}
