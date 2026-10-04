// ============================================================
// COMMAND DISPATCHER — Routes typed GameCommand to correct system
// Adding a new system = adding one case here. Nothing else changes.
// ============================================================

import type { GameCommand } from '../core/types';
import { handleSpawnEntity, handleDespawnEntity } from '../systems/SpawnSystem';
import { handleBuildStructure } from '../systems/BuildingSystem';
import { handleWorldModify } from '../systems/WorldModifySystem';
import { handleSetFactionRelation } from '../systems/FactionSystem';
import { handleInteractEntity } from '../systems/InteractionSystem';
import { TimelineSystem } from '../systems/TimelineSystem';

export function dispatchCommand(command: GameCommand): void {
  if (import.meta.env?.DEV) console.log('[Dispatcher]', command.type, command);

  switch (command.type) {
    case 'SPAWN_ENTITY':
      handleSpawnEntity(command);
      break;

    case 'DESPAWN_ENTITY':
      handleDespawnEntity(command);
      break;

    case 'BUILD_STRUCTURE':
      handleBuildStructure(command);
      break;

    case 'WORLD_MODIFY':
      handleWorldModify(command);
      break;

    case 'SET_FACTION_RELATION':
      handleSetFactionRelation(command);
      break;

    case 'INTERACT_ENTITY':
      handleInteractEntity(command);
      break;

    case 'REWIND':
      TimelineSystem.rewind(command.target);
      break;

    case 'SWITCH_BRANCH':
      TimelineSystem.switchBranch(command.branchIdOrName);
      break;

    case 'CREATE_CHECKPOINT':
      TimelineSystem.createCheckpoint({
        name: command.name || 'Voice Bookmark',
        description: 'Manual bookmark created by player command.',
        significance: 'manual',
      });
      break;

    default:
      console.warn('[Dispatcher] Unknown command type:', (command as GameCommand).type);
  }
}
