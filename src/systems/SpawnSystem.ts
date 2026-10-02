// ============================================================
// SPAWN SYSTEM — Handles SPAWN_ENTITY and DESPAWN_ENTITY commands
// Only system implemented in M0. M1+ systems follow the same pattern.
// ============================================================

import type { SpawnEntityCommand, DespawnEntityCommand, EntityType } from '../core/types';
import { useWorldStore } from '../core/WorldState';
import { getTerrainHeight } from '../core/terrain';
import { record } from './MemorySystem';
import { TimelineSystem } from './TimelineSystem';

// Base health values per entity type
const BASE_HEALTH: Record<EntityType, number> = {
  player:   200,
  king:     150,
  knight:   100,
  villager:  60,
  mage:      80,
  guard:     90,
  merchant:  70,
  wolf:      50,
  dragon:   500,
  deer:      70,
  sheep:     50,
  fox:       60,
  tower:    300,
  house:    150,
  windmill: 200,
  castle:   500,
  village:  400,
  bridge:   200,
  generic:  100,
};

// Destructiveness score — added to chaosScore when spawning hostile entities
const CHAOS_ON_SPAWN: Partial<Record<EntityType, number>> = {
  dragon: 20,
  wolf: 5,
};

const CREATURE_TYPES = new Set(['wolf', 'dragon', 'deer', 'sheep', 'fox']);
const STRUCTURE_TYPES = new Set(['tower', 'house', 'windmill', 'castle', 'village']);

export function handleSpawnEntity(cmd: SpawnEntityCommand): void {
  const store = useWorldStore.getState();

  // Ground the entity on terrain (y set by parser, but double-check here)
  const groundY = getTerrainHeight(cmd.position.x, cmd.position.z) + 0.05;
  const health = BASE_HEALTH[cmd.entityType] ?? 100;

  const isStructure = STRUCTURE_TYPES.has(cmd.entityType);
  const isCreature = CREATURE_TYPES.has(cmd.entityType);

  const moveSpeed =
    cmd.entityType === 'deer' ? 2.6 :
    cmd.entityType === 'fox' ? 2.4 :
    cmd.entityType === 'sheep' ? 1.2 :
    cmd.entityType === 'wolf' ? 2.8 :
    cmd.entityType === 'dragon' ? 3.5 : 1.8;

  store.addEntity({
    type: cmd.entityType,
    name: cmd.name,
    position: { x: cmd.position.x, y: groundY, z: cmd.position.z },
    rotationY: Math.random() * Math.PI * 2,
    health,
    maxHealth: health,
    factionId: null,
    category: isStructure ? 'structure' : isCreature ? 'creature' : 'character',
    aiState: isStructure ? undefined : 'wandering',
    idleTimer: 2,
    moveSpeed,
  });

  // Adjust chaos score
  const chaosHit = CHAOS_ON_SPAWN[cmd.entityType] ?? 0;
  if (chaosHit > 0) store.addChaos(chaosHit);

  // M3: Record the spawn event in world memory
  const isMalice = cmd.entityType === 'dragon' || cmd.entityType === 'wolf';
  record({
    type: isMalice ? 'malice_summoned' : 'structure_built',
    actorId: 'player',
    actorName: 'The Voice',
    description: isMalice
      ? `The Voice summoned a ${cmd.entityType} upon the land — ${cmd.name}.`
      : `The Voice brought ${cmd.name} (${cmd.entityType}) into the world.`,
    significance: cmd.entityType === 'dragon' ? 3 : cmd.entityType === 'wolf' ? 2 : 1,
  });

  console.log(
    `[SpawnSystem] Spawned ${cmd.entityType} "${cmd.name}" at (${cmd.position.x.toFixed(1)}, ${groundY.toFixed(1)}, ${cmd.position.z.toFixed(1)})`
  );

  // M4: Record timeline checkpoint
  TimelineSystem.createCheckpoint({
    name: `Summoned ${cmd.name} (${cmd.entityType})`,
    description: `Player manifested ${cmd.name} near (${cmd.position.x.toFixed(0)}, ${cmd.position.z.toFixed(0)}).`,
    significance: cmd.entityType === 'dragon' ? 'story' : 'command',
  });
}

export function handleDespawnEntity(cmd: DespawnEntityCommand): void {
  const store = useWorldStore.getState();

  if (cmd.all) {
    store.removeAllEntities();
    console.log('[SpawnSystem] Removed all entities');
    TimelineSystem.createCheckpoint({
      name: 'Despawned All Entities',
      description: 'Player wiped clean all living entities in the valley.',
      significance: 'command',
    });
    return;
  }

  if (cmd.entityId) {
    store.removeEntity(cmd.entityId);
    console.log(`[SpawnSystem] Removed entity id=${cmd.entityId}`);
    TimelineSystem.createCheckpoint({
      name: 'Removed Entity',
      description: `Player banished entity ${cmd.entityId}.`,
      significance: 'command',
    });
    return;
  }

  if (cmd.entityName) {
    store.removeEntityByName(cmd.entityName);
    console.log(`[SpawnSystem] Removed entity name="${cmd.entityName}"`);
    TimelineSystem.createCheckpoint({
      name: `Removed ${cmd.entityName}`,
      description: `Player banished ${cmd.entityName} from the realm.`,
      significance: 'command',
    });
    return;
  }

  console.warn('[SpawnSystem] DESPAWN_ENTITY had no target specified');
}
