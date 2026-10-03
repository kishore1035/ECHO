// ============================================================
// NARRATIVE ENGINE (M3) — Systematic story trigger evaluator
//
// Each NarrativeTrigger is a pure condition + effect pair.
// NarrativeEngine.evaluate() is called after every MemorySystem.record().
// Triggers that have already fired are skipped (once=true).
//
// This is a second layer alongside the existing StorySystem — it
// does not replace it. StorySystem still handles faction relation changes.
// ============================================================

import { useWorldStore } from '../core/WorldState';
import type { WorldStateData } from '../core/types';
import { hasSummonedMalice, getAttackCountAgainst, getNearbyVIPs } from './MemorySystem';

// ─── Trigger type ─────────────────────────────────────────────

interface NarrativeTrigger {
  id: string;
  once: boolean;    // if true, fires only one time ever
  condition: (state: WorldStateData) => boolean;
  effect: () => void;
}

// ─── Fired trigger tracker (runtime, not persisted) ───────────
// For M4 save/load this would move into WorldStateData.
const firedTriggers = new Set<string>();

// ─── Helper: update a named entity's bark ─────────────────────
function setEntityBark(name: string, bark: string, aiState?: string): void {
  const { entities, updateEntity } = useWorldStore.getState();
  const entity = Object.values(entities).find(
    (e) => e.name.toLowerCase() === name.toLowerCase()
  );
  if (!entity) return;
  updateEntity(entity.id, {
    dialogBark: bark,
    ...(aiState ? { aiState: aiState as any } : {}),
  });
}

// ─── The Story Trigger Table ──────────────────────────────────

const TRIGGERS: NarrativeTrigger[] = [
  // ── MALICE AWAKENS ─────────────────────────────────────────
  // Fires the first time the player summons a dragon.
  {
    id: 'malice_awakens',
    once: true,
    condition: (s) => hasSummonedMalice() && s.chaosScore >= 20,
    effect: () => {
      const store = useWorldStore.getState();

      store.setStory({
        currentAct: 'ACT II: THE SHADOW SPREADS',
        branch: 'MALICE',
        tension: 80,
        title: 'The Malice Between Crowns',
        objective:
          'Something dark stirs in the world. The factions have noticed the shadow you cast...',
      });

      store.addStoryLog(
        'The Malice stirs. An ancient shadow answers your voice. The world watches.'
      );

      // VIPs near the player react
      const player = store.player;
      const witnesses = getNearbyVIPs(player.position.x, player.position.z, 30);
      for (const vip of witnesses) {
        const entity = store.entities[vip.id];
        if (!entity) continue;

        let bark = 'What dark power is this?!';
        if (entity.name.includes('Aldric')) bark = 'Gods preserve us... a dragon walks the earth.';
        else if (entity.name.includes('Vorn')) bark = 'Even Vorn\'s hand trembles at this sight.';
        else if (entity.name.includes('Rowan')) bark = 'The sky... it darkens. What have you done?';

        store.updateEntity(vip.id, { dialogBark: bark, aiState: 'alert' });

        // This VIP is now a "witness" — record it
        store.recordEvent({
          gameHour: store.time.hours,
          type: 'vip_witnessed',
          actorId: vip.id,
          actorName: vip.name,
          description: `${vip.name} witnessed the summoning of a dragon and will not forget.`,
          significance: 2,
        });
      }

      // Storm the world
      store.setWeather({ type: 'storm', intensity: 0.7 });

      console.log('[NarrativeEngine] Trigger fired: malice_awakens');
    },
  },

  // ── BLOOD PACT ─────────────────────────────────────────────
  // Fires if the player has attacked ALL three factions.
  {
    id: 'blood_pact',
    once: true,
    condition: () =>
      getAttackCountAgainst('suncrest') >= 1 &&
      getAttackCountAgainst('shadowfang') >= 1 &&
      getAttackCountAgainst('neutral') >= 1,
    effect: () => {
      const store = useWorldStore.getState();

      store.setStory({
        currentAct: 'ACT III: THE PACT OF ASH',
        title: 'Enemy of All Crowns',
        objective:
          'All three factions have felt your aggression. They whisper of uniting against you...',
        tension: 100,
      });

      store.addStoryLog(
        'Word spreads: the voice that walks the land strikes without allegiance. The crowns consider a joint response.'
      );

      // Each faction's leader is now hostile toward the player
      setEntityBark(
        'King Aldric the Just',
        'This outsider strikes our people! Suncrest will not stand idle.',
        'alert'
      );
      setEntityBark(
        'Warlord Vorn the Ironclast',
        'Even Shadowfang has bled at this voice\'s command. Unacceptable.',
        'alert'
      );
      setEntityBark(
        'Rowan the Miller',
        'I thought you were a protector. I was wrong.',
        'alert'
      );

      console.log('[NarrativeEngine] Trigger fired: blood_pact');
    },
  },

  // ── ROWAN REMEMBERS ────────────────────────────────────────
  // Fires if player helped a neutral entity AND then brokered peace.
  {
    id: 'rowan_remembers',
    once: true,
    condition: (s) => {
      const helpedNeutral = s.events.some(
        (ev) => ev.type === 'player_helped' && ev.factionId === 'neutral'
      );
      return helpedNeutral && s.story.branch === 'ALLIANCE';
    },
    effect: () => {
      setEntityBark(
        'Rowan the Miller',
        'You helped us before you brokered peace. I won\'t forget that. You are a true friend of the Meadowlands.',
        'cheering'
      );

      useWorldStore.getState().addStoryLog(
        'Rowan the Miller: "You helped us before you brokered peace. The Meadowlands remembers its friends."'
      );

      console.log('[NarrativeEngine] Trigger fired: rowan_remembers');
    },
  },

  // ── ALDRIC REMEMBERS BETRAYAL ─────────────────────────────
  // Fires if player attacked Suncrest AND then brokered an alliance.
  {
    id: 'aldric_remembers_betrayal',
    once: true,
    condition: (s) => {
      const attackedSuncrest = s.events.some(
        (ev) => ev.type === 'player_attacked' && ev.factionId === 'suncrest'
      );
      return attackedSuncrest && s.story.branch === 'ALLIANCE';
    },
    effect: () => {
      setEntityBark(
        'King Aldric the Just',
        'I will uphold this treaty. But I have not forgotten what you did to my men. Trust is earned slowly, voice.',
        'idle'
      );

      useWorldStore.getState().addStoryLog(
        'King Aldric: "I will uphold this treaty. But I have not forgotten what you did to my men."'
      );

      console.log('[NarrativeEngine] Trigger fired: aldric_remembers_betrayal');
    },
  },

  // ── MALICE RECOGNIZED IN WAR ──────────────────────────────
  // If war was declared AND the Malice was summoned before it.
  {
    id: 'war_shadow_recognized',
    once: true,
    condition: (s) =>
      s.story.branch === 'WAR' &&
      s.events.some((ev) => ev.type === 'malice_summoned'),
    effect: () => {
      setEntityBark(
        'Warlord Vorn the Ironclast',
        'War AND shadow? This voice courts total annihilation. We must end this quickly.',
        'alert'
      );

      useWorldStore.getState().addStoryLog(
        'Warlord Vorn: "War AND shadow? This voice courts total annihilation."'
      );

      console.log('[NarrativeEngine] Trigger fired: war_shadow_recognized');
    },
  },

  // ── ELSPETH HERBALIST HEALER ──────────────────────────────
  // A simpler witness event: Elspeth speaks if any structure is built near center
  {
    id: 'elspeth_notices_construction',
    once: true,
    condition: (s) =>
      s.events.some((ev) => ev.type === 'structure_built'),
    effect: () => {
      setEntityBark(
        'Elspeth the Herbalist',
        'New structures in the valley? The land is changing. I wonder who guides this hand...',
        'idle'
      );

      console.log('[NarrativeEngine] Trigger fired: elspeth_notices_construction');
    },
  },
];

// ─── Engine class ─────────────────────────────────────────────

class NarrativeEngineClass {
  /**
   * Evaluate all triggers. Called by MemorySystem.record() after each event.
   * Safe to call frequently — conditions are pure, effects only run once.
   */
  evaluate(): void {
    const state = useWorldStore.getState();

    for (const trigger of TRIGGERS) {
      if (trigger.once && firedTriggers.has(trigger.id)) continue;

      try {
        if (trigger.condition(state)) {
          firedTriggers.add(trigger.id);
          trigger.effect();
        }
      } catch (err) {
        console.error(`[NarrativeEngine] Error in trigger "${trigger.id}":`, err);
      }
    }
  }

  /** Get list of fired trigger IDs for timeline snapshots */
  getFiredTriggers(): string[] {
    return Array.from(firedTriggers);
  }

  /** Restore list of fired trigger IDs from timeline snapshot */
  setFiredTriggers(triggerIds: string[]): void {
    firedTriggers.clear();
    for (const id of triggerIds) {
      firedTriggers.add(id);
    }
  }

  /** Reset fired triggers (e.g., for a new game). */
  reset(): void {
    firedTriggers.clear();
  }
}

export const NarrativeEngine = new NarrativeEngineClass();
