// ============================================================
// MEMORY SYSTEM (M3) — World's long-term memory ledger
//
// Writers: other systems call record() after their mutations.
// Readers: NarrativeEngine + MemoryPanel query aggregated data.
//
// Nothing in here rewrites M0–M2 logic.
// ============================================================

import { useWorldStore } from '../core/WorldState';
import type { EventType, WorldEvent } from '../core/types';
import { NarrativeEngine } from './NarrativeEngine';

// ─── Public record API ────────────────────────────────────────

export interface RecordOptions {
  type: EventType;
  actorId: string;
  actorName: string;
  targetId?: string;
  targetName?: string;
  factionId?: string;
  description: string;
  significance: 1 | 2 | 3;
}

export function record(opts: RecordOptions): void {
  const store = useWorldStore.getState();

  const event: Omit<WorldEvent, 'id'> = {
    gameHour: store.time.hours,
    ...opts,
  };

  store.recordEvent(event);

  // Log significant events to the story chronicle
  if (opts.significance >= 2) {
    store.addStoryLog(opts.description);
  }

  // Fire narrative triggers after every event
  NarrativeEngine.evaluate();

  if (import.meta.env?.DEV) console.log(`[MemorySystem] Recorded: ${opts.type} — ${opts.description}`);
}

// ─── Query helpers ────────────────────────────────────────────

/**
 * Returns a trust score for how an entity (or faction) feels about the player.
 * Positive = friendly, Negative = hostile.
 * Scale: –100 to +100.
 */
export function getEntityTrust(entityId: string): number {
  const events = useWorldStore.getState().events;
  let score = 0;

  for (const ev of events) {
    if (ev.targetId !== entityId) continue;

    if (ev.type === 'player_helped') score += ev.significance * 15;
    if (ev.type === 'player_attacked') score -= ev.significance * 20;
  }

  return Math.max(-100, Math.min(100, score));
}

/**
 * Returns a trust score for an entire faction toward the player.
 * Aggregates from all events targeting members of that faction.
 */
export function getFactionTrust(factionId: string): number {
  const { events, entities } = useWorldStore.getState();
  let score = 0;

  for (const ev of events) {
    // Direct faction events (like SET_FACTION_RELATION)
    if (ev.factionId === factionId && ev.type === 'faction_shift') {
      score += ev.significance * 5;
    }

    // Events on members of the faction
    if (ev.targetId) {
      const target = entities[ev.targetId];
      if (target?.factionId !== factionId) continue;

      if (ev.type === 'player_helped') score += ev.significance * 10;
      if (ev.type === 'player_attacked') score -= ev.significance * 18;
    }
  }

  return Math.max(-100, Math.min(100, score));
}

/**
 * Returns all VIP entities within `radius` world-units of `position`.
 * Used by NarrativeEngine to check if a VIP "witnessed" an event.
 */
export function getNearbyVIPs(
  x: number,
  z: number,
  radius: number
): { id: string; name: string }[] {
  const entities = useWorldStore.getState().entities;
  const result: { id: string; name: string }[] = [];

  for (const e of Object.values(entities)) {
    if (!e.isVIP) continue;
    const dx = e.position.x - x;
    const dz = e.position.z - z;
    if (Math.sqrt(dx * dx + dz * dz) <= radius) {
      result.push({ id: e.id, name: e.name });
    }
  }

  return result;
}

/**
 * Returns recent events filtered by type, optionally scoped to a faction.
 */
export function getRecentEvents(
  type?: EventType,
  factionId?: string,
  limit = 10
): WorldEvent[] {
  const events = useWorldStore.getState().events;
  return events
    .filter((ev) => {
      if (type && ev.type !== type) return false;
      if (factionId && ev.factionId !== factionId) return false;
      return true;
    })
    .slice(-limit);
}

/**
 * How many times has the player attacked a specific faction?
 */
export function getAttackCountAgainst(factionId: string): number {
  const { events, entities } = useWorldStore.getState();
  let count = 0;

  for (const ev of events) {
    if (ev.type !== 'player_attacked') continue;
    if (ev.factionId === factionId) { count++; continue; }
    if (ev.targetId && entities[ev.targetId]?.factionId === factionId) count++;
  }

  return count;
}

/**
 * Has the player ever summoned the Malice (dragon/hostile creature)?
 */
export function hasSummonedMalice(): boolean {
  return useWorldStore.getState().events.some((ev) => ev.type === 'malice_summoned');
}

export const MemorySystem = {
  record,
  getEntityTrust,
  getFactionTrust,
  getNearbyVIPs,
  getRecentEvents,
  getAttackCountAgainst,
  hasSummonedMalice,
};
