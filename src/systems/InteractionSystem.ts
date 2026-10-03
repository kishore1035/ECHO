// ============================================================
// INTERACTION SYSTEM (M3) — Handles INTERACT_ENTITY command
//
// "Help / attack [entity name]" — the primary way the player
// creates memories with individual characters and factions.
// ============================================================

import { useWorldStore } from '../core/WorldState';
import { useCampaignStore } from '../campaign/CampaignSystem';
import type { InteractEntityCommand } from '../core/types';
import { record } from './MemorySystem';
import { TimelineSystem } from './TimelineSystem';

export function handleInteractEntity(cmd: InteractEntityCommand): void {
  const store = useWorldStore.getState();

  // Find entity by name (case-insensitive)
  const target = Object.values(store.entities).find(
    (e) => e.name.toLowerCase().includes(cmd.entityName.toLowerCase())
  );

  if (cmd.action === 'shield') {
    const shieldTarget = target || Object.values(store.entities).find((e) => e.name.toLowerCase().includes('rowan'));
    if (!shieldTarget) {
      store.addStoryLog(`No target found to shield.`);
      return;
    }

    store.updateEntity(shieldTarget.id, {
      health: shieldTarget.maxHealth,
      dialogBark: 'The air around me... it holds! The strikes cannot touch me!',
      aiState: 'cheering',
    });

    useCampaignStore.getState().setStoryFlag('rowan_shielded', true);
    useCampaignStore.getState().setStoryFlag('resolution_method', 'shield');

    record({
      type: 'player_helped',
      actorId: 'player',
      actorName: 'The Voice',
      targetId: shieldTarget.id,
      targetName: shieldTarget.name,
      factionId: shieldTarget.factionId ?? undefined,
      description: `The Voice manifested an impenetrable chronal shield around ${shieldTarget.name}.`,
      significance: 3,
    });

    store.addStoryLog(`A chronal barrier envelops ${shieldTarget.name}. The Echo holds.`);

    TimelineSystem.createCheckpoint({
      name: `Shielded ${shieldTarget.name}`,
      description: `Player manifested an impenetrable chronal barrier around ${shieldTarget.name}.`,
      significance: 'story',
    });
    return;
  }

  if (cmd.action === 'retreat' || cmd.action === 'flee') {
    const isSoldiersGeneral =
      cmd.entityName.toLowerCase().includes('soldier') ||
      cmd.entityName.toLowerCase().includes('shadowfang') ||
      cmd.entityName.toLowerCase().includes('raider') ||
      cmd.entityName.toLowerCase().includes('them') ||
      cmd.entityName.toLowerCase().includes('all');

    const targets = isSoldiersGeneral
      ? Object.values(store.entities).filter(
          (e) =>
            e.name.toLowerCase().includes('raider') ||
            e.name.toLowerCase().includes('scout') ||
            e.factionId === 'shadowfang'
        )
      : target ? [target] : [];

    if (targets.length === 0) {
      store.addStoryLog(`No soldiers found to retreat.`);
      return;
    }

    targets.forEach((ent) => {
      store.updateEntity(ent.id, {
        aiState: 'fleeing',
        dialogBark: 'The Voice commands it! Fall back!',
      });
      setTimeout(() => {
        useWorldStore.getState().removeEntity(ent.id);
      }, 3500);
    });

    useCampaignStore.getState().setStoryFlag('raiders_retreated', true);
    useCampaignStore.getState().setStoryFlag('resolution_method', 'retreat');

    store.addStoryLog(`The soldiers broke ranks and fled from the Echo command.`);
    TimelineSystem.createCheckpoint({
      name: 'Soldiers Retreated',
      description: 'Player commanded the Shadowfang vanguard to retreat.',
      significance: 'command',
    });
    return;
  }

  if (!target) {
    console.warn(`[InteractionSystem] No entity found matching "${cmd.entityName}"`);
    store.addStoryLog(`No one named "${cmd.entityName}" could be found.`);
    return;
  }

  if (cmd.action === 'help') {
    // Restore a bit of health as a tangible "help" signal
    const newHealth = Math.min(target.maxHealth, target.health + 30);
    store.updateEntity(target.id, {
      health: newHealth,
      dialogBark: getHelpedBark(target.name, target.type as string),
      aiState: 'cheering',
    });

    record({
      type: 'player_helped',
      actorId: 'player',
      actorName: 'The Voice',
      targetId: target.id,
      targetName: target.name,
      factionId: target.factionId ?? undefined,
      description: `The Voice aided ${target.name}${target.factionId ? ` of the ${target.factionId}` : ''}.`,
      significance: target.isVIP ? 2 : 1,
    });

    store.addStoryLog(`You aided ${target.name}. They will remember this.`);

  } else if (cmd.action === 'attack') {
    const damage = target.isVIP ? 20 : 35;
    const newHealth = Math.max(0, target.health - damage);

    store.updateEntity(target.id, {
      health: newHealth,
      dialogBark: getAttackedBark(target.name, target.type as string),
      aiState: 'alert',
    });

    store.addChaos(target.isVIP ? 15 : 5);

    record({
      type: 'player_attacked',
      actorId: 'player',
      actorName: 'The Voice',
      targetId: target.id,
      targetName: target.name,
      factionId: target.factionId ?? undefined,
      description: `The Voice attacked ${target.name}${target.factionId ? ` of the ${target.factionId}` : ''}.`,
      significance: target.isVIP ? 3 : 1,
    });

    store.addStoryLog(
      `You attacked ${target.name}. ${target.factionId ? `The ${target.factionId} will remember this.` : 'They will not forget.'}`
    );
  }

  // M4: Record interaction checkpoint
  TimelineSystem.createCheckpoint({
    name: cmd.action === 'help' ? `Aided ${target.name}` : `Struck ${target.name}`,
    description:
      cmd.action === 'help'
        ? `Player aided ${target.name}${target.factionId ? ` (${target.factionId})` : ''}.`
        : `Player assaulted ${target.name}${target.factionId ? ` (${target.factionId})` : ''}.`,
    significance: target.isVIP ? 'story' : 'command',
  });
}

// ─── Contextual barks ─────────────────────────────────────────

function getHelpedBark(name: string, type: string): string {
  if (name.includes('Aldric')) return 'Your kindness honors Suncrest. We shall not forget.';
  if (name.includes('Vorn')) return '...Even Vorn acknowledges generosity. This is... unexpected.';
  if (name.includes('Rowan')) return 'Thank you, friend! The Miller is in your debt.';
  if (name.includes('Mira')) return 'The threads of reality hum when you touch them. Thank you, Voice.';
  if (name.includes('Gareth')) return 'My strength is restored! For Suncrest and the Voice!';
  if (name.includes('Korg')) return 'You have the strength of a Shadowfang. My respect.';
  if (name.includes('Elspeth')) return 'I can feel the herbs working. Bless you.';

  switch (type) {
    case 'villager': return 'Oh! Bless you, kind voice!';
    case 'knight': return 'My strength returns! I am yours to command.';
    case 'guard': return 'I stand ready again. Thank you.';
    case 'king': return 'A ruler does not forget acts of valor.';
    case 'mage': return 'Your power resonates with mine. Curious.';
    case 'merchant': return 'Gratitude! Your generosity will be repaid in trade.';
    default: return 'Thank you...';
  }
}

function getAttackedBark(name: string, type: string): string {
  if (name.includes('Aldric')) return 'Treachery! Suncrest Paladins, to arms!';
  if (name.includes('Vorn')) return 'BLOOD FOR BLOOD! Shadowfang, rally!';
  if (name.includes('Rowan')) return 'Why?! I trusted you...';
  if (name.includes('Mira')) return 'You fracture what is already broken! Even the Architect did not strike blindly!';
  if (name.includes('Gareth')) return 'This... is not the last you\'ll see of me, Voice.';
  if (name.includes('Korg')) return 'You dare strike Korg?! I\'ll remember that.';
  if (name.includes('Elspeth')) return 'I heal wounds, not seek them! How could you!';

  switch (type) {
    case 'villager': return 'Please! I am no warrior!';
    case 'knight': return 'You\'ll pay for that, Voice!';
    case 'guard': return 'Stand down! ... I mean, you stand down!';
    case 'king': return 'This is an act of WAR!';
    case 'mage': return 'Your aggression is noted. And remembered.';
    default: return 'Aagh!';
  }
}
