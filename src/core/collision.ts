// ============================================================
// COLLISION & PHYSICS — Lightweight spatial collision system
// Prevents player & NPCs from passing through structures and rocks
// ============================================================

export interface Obstacle {
  id: string;
  x: number;
  z: number;
  radius: number;
}

// In-memory registered obstacle colliders
const obstacles = new Map<string, Obstacle>();

export function registerObstacle(id: string, x: number, z: number, radius: number): void {
  obstacles.set(id, { id, x, z, radius });
}

export function unregisterObstacle(id: string): void {
  obstacles.delete(id);
}

export function clearObstacles(): void {
  obstacles.clear();
}

/**
 * Resolves 2D circle-circle collision against registered solid obstacles.
 * Returns pushed-out (x, z) coordinates.
 */
export function resolveCollision(
  x: number,
  z: number,
  colliderRadius = 0.55
): { x: number; z: number } {
  let resolvedX = x;
  let resolvedZ = z;

  // Clamp inside 200x200 playable world borders
  resolvedX = Math.max(-98, Math.min(98, resolvedX));
  resolvedZ = Math.max(-98, Math.min(98, resolvedZ));

  // Push out from any intersecting obstacles
  for (const obs of obstacles.values()) {
    const dx = resolvedX - obs.x;
    const dz = resolvedZ - obs.z;
    const distSq = dx * dx + dz * dz;
    const minDist = obs.radius + colliderRadius;

    if (distSq < minDist * minDist && distSq > 0.0001) {
      const dist = Math.sqrt(distSq);
      const overlap = minDist - dist;
      resolvedX += (dx / dist) * overlap;
      resolvedZ += (dz / dist) * overlap;
    }
  }

  return { x: resolvedX, z: resolvedZ };
}
