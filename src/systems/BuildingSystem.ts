import { useWorldStore } from '../core/WorldState';
import { getTerrainHeight, isWater } from '../core/terrain';
import type { BuildStructureCommand, StructureType } from '../core/types';
import { record } from './MemorySystem';
import { TimelineSystem } from './TimelineSystem';

const STRUCTURE_DEFAULT_NAMES: Record<StructureType, string[]> = {
  tower: ['Watchtower', 'High Bastion', 'Spire of the Wind', 'Stone Lookout'],
  house: ['Timber Cottage', 'Woodcutter House', 'Hearth Cottage', 'Meadow Lodge'],
  windmill: ['Old Windmill', 'Breeze Mill', 'Valley Grain Mill'],
  castle: ['High Fortress', 'Citadel of Stone', 'Royal Keep', 'Iron Bastion'],
  village: ['Oak Haven', 'Green River Settlement', 'Fairhaven', 'Silverford'],
  bridge: ['The River Bridge', 'Stone Span', 'Timber Crossing'],
};

function pickName(type: StructureType): string {
  const list = STRUCTURE_DEFAULT_NAMES[type] || ['Structure'];
  return list[Math.floor(Math.random() * list.length)];
}

export function handleBuildStructure(cmd: BuildStructureCommand): string {
  const store = useWorldStore.getState();

  const x = cmd.position.x;
  const z = cmd.position.z;

  // Prevent building underwater
  if (isWater(x, z)) {
    console.warn('[BuildingSystem] Cannot build submerged underwater at', x, z);
  }

  const y = getTerrainHeight(x, z) + 0.05;
  const name = cmd.name?.trim() ? cmd.name : pickName(cmd.structureType);

  const entityId = store.addEntity({
    type: cmd.structureType,
    name,
    position: { x, y, z },
    rotationY: Math.random() * Math.PI * 2,
    health: cmd.structureType === 'castle' ? 500 : 200,
    maxHealth: cmd.structureType === 'castle' ? 500 : 200,
    factionId: null,
    category: 'structure',
  });

  if (cmd.structureType === 'bridge' || name.toLowerCase().includes('bridge')) {
    store.setBridgeDestroyed(false);
    store.addStoryLog('The Voice reconstructed the River Bridge.');
  }

  // M3: Record construction in world memory
  record({
    type: 'structure_built',
    actorId: 'player',
    actorName: 'The Voice',
    targetId: entityId,
    targetName: name,
    description: `The Voice raised a ${cmd.structureType} — "${name}" — in the valley.`,
    significance: cmd.structureType === 'castle' ? 2 : 1,
  });

  // M4: Record construction checkpoint
  TimelineSystem.createCheckpoint({
    name: `Constructed ${name}`,
    description: `Player raised ${name} (${cmd.structureType}) at (${x.toFixed(0)}, ${z.toFixed(0)}).`,
    significance: cmd.structureType === 'castle' ? 'story' : 'command',
  });

  return entityId;
}
