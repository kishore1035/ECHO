// ============================================================
// STORY SYSTEM — Narrative State Machine & Dynamic Story Graph
// Voice commands alter the world, which alters the story unfolding.
// ============================================================

import { useWorldStore } from '../core/WorldState';
import type { FactionRelation } from '../core/types';

export class StorySystemClass {
  onFactionRelationChanged(
    factionA: string,
    factionB: string,
    relation: FactionRelation
  ): void {
    const store = useWorldStore.getState();

    // Check if relation change involves the two primary kingdoms
    const isPrimaryStandoff =
      (factionA === 'suncrest' && factionB === 'shadowfang') ||
      (factionA === 'shadowfang' && factionB === 'suncrest');

    if (!isPrimaryStandoff) return;

    if (relation === 'allied') {
      // ── Story Branch: The Great Accord ──────────────────────
      store.setStory({
        currentAct: 'ACT II: THE ACCORD OF KINGS',
        branch: 'ALLIANCE',
        tension: 0,
        title: 'The Great Accord of the Two Thrones',
        objective: 'Peace has triumphed! Join King Aldric and Warlord Vorn at the Meadowlands festival.',
      });

      store.addStoryLog(
        'By voice decree, the Suncrest Realm and Shadowfang Legion have sworn a treaty of perpetual brotherhood!'
      );

      // Make skies clear and sunny
      store.setWeather({ type: 'clear', intensity: 1 });

      // Visually react in the world: NPCs cheer and update dialog barks
      for (const [id, entity] of Object.entries(store.entities)) {
        if (entity.factionId === 'suncrest' || entity.factionId === 'shadowfang') {
          let bark = 'Peace at last!';
          if (entity.name.includes('Aldric')) {
            bark = 'A glorious day! The peace treaty is sealed.';
          } else if (entity.name.includes('Vorn')) {
            bark = 'Our combined might shall shield the realm.';
          } else if (entity.type === 'knight') {
            bark = 'Brothers in arms, forever!';
          }

          store.updateEntity(id, {
            aiState: 'cheering',
            dialogBark: bark,
          });
        }
      }

      console.log('[StorySystem] Story branched to: ALLIANCE (Tension: 0)');
    } else if (relation === 'hostile') {
      // ── Story Branch: The Outbreak of War ───────────────────
      store.setStory({
        currentAct: 'ACT II: THE DRUMS OF WAR',
        branch: 'WAR',
        tension: 100,
        title: 'The War of the Two Thrones',
        objective: 'War has erupted! The armies march to clash at the River Crossing.',
      });

      store.addStoryLog(
        'War has been unleashed! King Aldric and Warlord Vorn have sounded the drums of battle.'
      );

      // Make skies stormy
      store.setWeather({ type: 'storm', intensity: 1 });

      // Visually react in the world: soldiers draw swords, sound alerts, march to border
      for (const [id, entity] of Object.entries(store.entities)) {
        if (entity.factionId === 'suncrest') {
          const isLeader = entity.name.includes('Aldric');
          store.updateEntity(id, {
            aiState: 'alert',
            dialogBark: isLeader ? 'Suncrest Paladins, to arms! Defend the ridge!' : 'For the King! Charge!',
            targetPos: { x: 4, y: 0, z: -2 }, // March toward river
          });
        } else if (entity.factionId === 'shadowfang') {
          const isLeader = entity.name.includes('Vorn');
          store.updateEntity(id, {
            aiState: 'alert',
            dialogBark: isLeader ? 'Tear down their banners! The valley is ours!' : 'Blood and steel!',
            targetPos: { x: -4, y: 0, z: -2 }, // March toward river
          });
        }
      }

      console.log('[StorySystem] Story branched to: WAR (Tension: 100)');
    }
  }
}

export const StorySystem = new StorySystemClass();
