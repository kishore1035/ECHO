// ============================================================
// FACTION SYSTEM — Handles SET_FACTION_RELATION commands
// ============================================================

import { useWorldStore } from '../core/WorldState';
import type { SetFactionRelationCommand } from '../core/types';
import { StorySystem } from './StorySystem';
import { record } from './MemorySystem';
import { TimelineSystem } from './TimelineSystem';

export function handleSetFactionRelation(cmd: SetFactionRelationCommand): void {
  const store = useWorldStore.getState();

  const fA = cmd.factionA.toLowerCase();
  const fB = cmd.factionB.toLowerCase();
  const relation = cmd.relation;

  store.setFactionRelation(fA, fB, relation);

  console.log(`[FactionSystem] Relationship between ${fA} and ${fB} set to ${relation}`);

  // M3: Record this as a world memory event
  const factionNames: Record<string, string> = {
    suncrest: 'Suncrest Realm',
    shadowfang: 'Shadowfang Legion',
    neutral: 'Meadowlands Enclave',
  };
  const nameA = factionNames[fA] ?? fA;
  const nameB = factionNames[fB] ?? fB;

  record({
    type: 'faction_shift',
    actorId: 'player',
    actorName: 'The Voice',
    factionId: fA,
    description:
      relation === 'allied'
        ? `By decree of the Voice, ${nameA} and ${nameB} have sworn brotherhood.`
        : relation === 'hostile'
        ? `The Voice has cast ${nameA} and ${nameB} into open war.`
        : `The Voice has settled ${nameA} and ${nameB} to an uneasy truce.`,
    significance: 3,
  });

  // Trigger story reactions (existing M2 system, unchanged)
  StorySystem.onFactionRelationChanged(fA, fB, relation);

  // M4: Record timeline checkpoint
  TimelineSystem.createCheckpoint({
    name: relation === 'allied' ? `Accord: ${nameA} & ${nameB}` : `War: ${nameA} vs ${nameB}`,
    description:
      relation === 'allied'
        ? `Brotherhood sworn between ${nameA} and ${nameB}.`
        : `Open war unleashed between ${nameA} and ${nameB}.`,
    significance: 'faction',
  });
}
