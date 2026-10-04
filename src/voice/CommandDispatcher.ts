// ============================================================
// COMMAND DISPATCHER — Routes typed GameCommand to correct system
// Adding a new system = adding one case here. Nothing else changes.
// ============================================================

import type { GameCommand, TalkCommand } from '../core/types';
import { useWorldStore } from '../core/WorldState';
import { useCampaignStore, CampaignSystem } from '../campaign/CampaignSystem';
import { useEchoTreeStore } from '../core/echoTreeState';
import { buildRowanAndMiraDialogue } from '../campaign/dialogues';
import { handleSpawnEntity, handleDespawnEntity } from '../systems/SpawnSystem';
import { handleBuildStructure } from '../systems/BuildingSystem';
import { handleWorldModify } from '../systems/WorldModifySystem';
import { handleSetFactionRelation } from '../systems/FactionSystem';
import { handleInteractEntity } from '../systems/InteractionSystem';
import { TimelineSystem } from '../systems/TimelineSystem';

function handleVoiceTalk(cmd: TalkCommand): void {
  const world = useWorldStore.getState();
  const echoTree = useEchoTreeStore.getState();
  const pPos = world.player.position;

  const nameLower = (cmd.entityName || '').toLowerCase().trim();

  // 1. If near Echo Tree or command mentions tree / anchor / commune
  if (
    echoTree.isNear ||
    nameLower.includes('tree') ||
    nameLower.includes('anchor') ||
    nameLower.includes('commune')
  ) {
    echoTree.toggleInteraction();
    world.addStoryLog('The Voice communed with the ancient Echo Tree.');
    return;
  }

  // 2. Look for target entity by name, or find nearest character
  let target = Object.values(world.entities).find(
    (e) => nameLower && e.name.toLowerCase().includes(nameLower)
  );

  if (!target) {
    // Find closest character/creature within 12 meters
    let closestDist = 12.0;
    for (const ent of Object.values(world.entities)) {
      if (ent.category === 'structure') continue;
      const d = Math.hypot(pPos.x - ent.position.x, pPos.z - ent.position.z);
      if (d < closestDist) {
        closestDist = d;
        target = ent;
      }
    }
  }

  if (target) {
    if (target.name.includes('Rowan') || target.name.includes('Mira')) {
      CampaignSystem.triggerDialogue(buildRowanAndMiraDialogue());
    } else {
      world.updateEntity(target.id, {
        dialogBark: target.dialogBark || `${target.name} turns and listens to the Voice.`,
        aiState: 'alert',
      });
      world.addStoryLog(`You spoke with ${target.name}.`);
    }
  } else {
    world.addStoryLog('Your voice echoes across the valley, but no one is close enough to answer.');
  }
}

export function dispatchCommand(command: GameCommand): void {
  if (import.meta.env?.DEV) console.log('[Dispatcher]', command.type, command);

  // Mark Echo demonstrated for campaign objectives
  useCampaignStore.getState().setStoryFlag('echo_demonstrated', true);

  switch (command.type) {
    case 'JUMP': {
      if (typeof window !== 'undefined' && (window as any).__ECHO_PERFORM_JUMP__) {
        (window as any).__ECHO_PERFORM_JUMP__();
      }
      useWorldStore.getState().addStoryLog('The Voice bids you leap.');
      break;
    }

    case 'ATTACK': {
      if (typeof window !== 'undefined' && (window as any).__ECHO_PERFORM_ATTACK__) {
        (window as any).__ECHO_PERFORM_ATTACK__();
      }
      useWorldStore.getState().addStoryLog('The Voice bids you strike.');
      break;
    }

    case 'TALK': {
      handleVoiceTalk(command);
      break;
    }

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
      console.warn('[Dispatcher] Unknown command type:', (command as any).type);
  }
}
