// ============================================================
// CAMPAIGN SYSTEM — Reactive Story Engine for ECHO
// Evaluates real simulation state against mission objectives
// Updates character bonds, dialogue scenes, and story acts
// ============================================================

import { create } from 'zustand';
import { useWorldStore } from '../core/WorldState';
import { CAMPAIGN_MISSIONS } from './missions';
import {
  buildRowanAndMiraDialogue,
  buildMission1CompleteDialogue,
  buildMission2StartDialogue,
  buildMission2CompleteDialogue,
  buildMission3StartDialogue,
  buildMission3CompleteDialogue,
} from './dialogues';
import type { CampaignAct, CampaignState, DialogueSequence, Mission } from './types';
import { playMenuSelect } from '../core/soundFX';
import { registerCampaignTimelineHooks } from '../systems/TimelineSystem';
import { useEchoTreeStore } from '../core/echoTreeState';

interface CampaignStore extends CampaignState {
  missions: Mission[];

  // Actions
  evaluate: () => void;
  advanceDialogue: () => void;
  triggerDialogue: (dialogue: DialogueSequence) => void;
  closeDialogue: () => void;
  setStoryFlag: (flag: string, value: boolean | string | number) => void;
  adjustBond: (character: string, delta: number) => void;

  // Snapshot restoration (for M4 timeline rewinds & save/load)
  getSnapshot: () => {
    currentAct: CampaignAct;
    activeMissionId: string;
    completedMissionIds: string[];
    storyFlags: Record<string, boolean | string | number>;
    characterBonds: Record<string, number>;
    missions: Mission[];
  };
  restoreSnapshot: (snap: {
    currentAct: CampaignAct;
    activeMissionId: string;
    completedMissionIds: string[];
    storyFlags: Record<string, boolean | string | number>;
    characterBonds: Record<string, number>;
    missions: Mission[];
  }) => void;
}

export const useCampaignStore = create<CampaignStore>((set, get) => ({
  currentAct: 'prologue',
  activeMissionId: 'm1_first_resonance',
  completedMissionIds: [],
  storyFlags: {
    rowan_found: false,
    echo_demonstrated: false,
    mira_found: false,
    architect_lore_revealed: false,
  },
  characterBonds: {
    rowan: 10,
    mira: 0,
    aldric: 0,
    vorn: 0,
  },
  activeDialogue: CAMPAIGN_MISSIONS[0].dialogueOnStart || null,
  dialogueLineIndex: 0,
  missions: JSON.parse(JSON.stringify(CAMPAIGN_MISSIONS)),

  // ── Advance Active Dialogue Line ─────────────────────────────
  advanceDialogue: () => {
    const { activeDialogue, dialogueLineIndex } = get();
    if (!activeDialogue) return;

    if (dialogueLineIndex < activeDialogue.lines.length - 1) {
      playMenuSelect();
      set({ dialogueLineIndex: dialogueLineIndex + 1 });
    } else {
      // Completed dialogue sequence
      if (activeDialogue.onCompleteFlag) {
        get().setStoryFlag(activeDialogue.onCompleteFlag, true);
      }
      set({ activeDialogue: null, dialogueLineIndex: 0 });
    }
  },

  triggerDialogue: (dialogue) => {
    set({ activeDialogue: dialogue, dialogueLineIndex: 0 });
  },

  closeDialogue: () => {
    set({ activeDialogue: null, dialogueLineIndex: 0 });
  },

  setStoryFlag: (flag, value) => {
    set((s) => ({ storyFlags: { ...s.storyFlags, [flag]: value } }));
    console.log(`[CampaignSystem] Flag set: ${flag} =`, value);
  },

  adjustBond: (character, delta) => {
    set((s) => {
      const curr = s.characterBonds[character] || 0;
      const next = Math.max(-100, Math.min(100, curr + delta));
      return { characterBonds: { ...s.characterBonds, [character]: next } };
    });
  },

  // ── Reactive Simulation Evaluator ────────────────────────────
  // Evaluates actual game world coordinates, entity health, events ledger,
  // and faction relations against mission goals.
  evaluate: () => {
    const world = useWorldStore.getState();
    const { missions, activeMissionId, storyFlags } = get();

    const activeMission = missions.find((m) => m.id === activeMissionId);
    if (!activeMission || activeMission.status !== 'active') return;

    let missionModified = false;
    const playerPos = world.player.position;

    // Global exploration check: Discover Whispering Stones
    if (!storyFlags['discovered_whispering_stones']) {
      const distToStones = Math.hypot(playerPos.x - (-4), playerPos.z - 9);
      if (distToStones <= 6.5) {
        get().setStoryFlag('discovered_whispering_stones', true);
        world.addStoryLog('🔍 Discovered: The Whispering Stones (ancient basalt chronal monoliths)');
      }
    }

    // Global exploration check: Discover the ancient Echo Tree
    if (!storyFlags['discovered_echo_tree']) {
      const distToTree = Math.hypot(playerPos.x - (-13.0), playerPos.z - (-1.5));
      if (distToTree <= 7.0) {
        get().setStoryFlag('discovered_echo_tree', true);
        world.addStoryLog('🔍 Discovered: The Echo Tree (ancient chronal anchor of the Architect)');
      }
    }

    // ── MISSION 1: The First Resonance (Prologue) ─────────────
    if (activeMission.id === 'm1_first_resonance') {
      const rowanEntity = Object.values(world.entities).find((e) => e.name.includes('Rowan'));
      const distToRowan = rowanEntity
        ? Math.hypot(playerPos.x - rowanEntity.position.x, playerPos.z - rowanEntity.position.z)
        : Math.hypot(playerPos.x - (-2), playerPos.z - 4);

      // Obj 1: Approach Rowan near mill
      const objRowan = activeMission.objectives.find((o) => o.id === 'obj_approach_rowan');
      if (objRowan && !objRowan.completed) {
        if (distToRowan <= 8.5) {
          objRowan.completed = true;
          missionModified = true;
          get().setStoryFlag('rowan_found', true);
          get().adjustBond('rowan', 15);
          world.addStoryLog('📜 Mission Objective Complete: Approached Rowan the Miller.');

          // Trigger state-aware dialogue between Rowan and Mira if not conversed yet
          if (!get().storyFlags['rowan_conversed'] && !get().activeDialogue) {
            get().triggerDialogue(buildRowanAndMiraDialogue());
          }
        }
      }

      // Obj 2: Demonstrate the Echo (weather change, interaction, structure built, or voice command)
      const objEcho = activeMission.objectives.find((o) => o.id === 'obj_demonstrate_echo');
      if (objEcho && !objEcho.completed && objRowan?.completed) {
        const hasEchoAction =
          world.weather.type !== 'clear' ||
          Boolean(world.voice.lastCommand) ||
          world.events.some(
            (e) =>
              e.type === 'player_helped' ||
              e.type === 'player_attacked' ||
              e.type === 'structure_built' ||
              e.type === 'malice_summoned' ||
              e.type === 'faction_shift'
          ) ||
          Boolean(get().storyFlags['echo_demonstrated']);

        if (hasEchoAction) {
          objEcho.completed = true;
          missionModified = true;
          get().setStoryFlag('echo_demonstrated', true);
          get().adjustBond('rowan', 20);
          world.addStoryLog('✨ Mission Objective Complete: Demonstrated the Echo.');

          // Trigger awe-struck reaction dialogue
          if (!get().storyFlags['m1_reaction_triggered'] && !get().activeDialogue) {
            get().setStoryFlag('m1_reaction_triggered', true);
            get().triggerDialogue(buildMission1CompleteDialogue());
          }
        }
      }

      // Obj 3: Listen to Rowan
      const objListen = activeMission.objectives.find((o) => o.id === 'obj_listen_rowan');
      if (objListen && !objListen.completed && objEcho?.completed && objRowan?.completed) {
        if (get().storyFlags['m1_reaction_triggered']) {
          objListen.completed = true;
          missionModified = true;
        }
      }

      // Check Mission 1 completion
      if (activeMission.objectives.every((o) => o.completed)) {
        activeMission.status = 'completed';
        activeMission.consequences.push({
          id: 'c_rowan_befriended',
          description: 'Rowan the Miller witnessed the Echo and regards you as a supernatural benefactor.',
          echoUsed: true,
        });

        // Unlock Mission 2: The Whispering Stones
        const nextMission = missions.find((m) => m.id === 'm2_whispering_stones');
        if (nextMission) {
          nextMission.status = 'active';
          set({
            activeMissionId: 'm2_whispering_stones',
          });
        }
        world.addStoryLog('🏆 Mission Complete: The First Resonance!');
      }
    }

    // ── MISSION 2: The Whispering Stones (Prologue) ────────────
    if (activeMission.id === 'm2_whispering_stones') {
      const miraEntity = Object.values(world.entities).find((e) => e.name.includes('Mira'));
      const distToMira = miraEntity
        ? Math.hypot(playerPos.x - miraEntity.position.x, playerPos.z - miraEntity.position.z)
        : Math.hypot(playerPos.x - (-4), playerPos.z - 9);

      // Obj 1: Find Mira the Seer (x=-4, z=9)
      const objMira = activeMission.objectives.find((o) => o.id === 'obj_find_mira');
      if (objMira && !objMira.completed) {
        if (distToMira <= 8.5) {
          objMira.completed = true;
          missionModified = true;
          get().setStoryFlag('mira_found', true);
          get().adjustBond('mira', 15);
          world.addStoryLog('📜 Mission Objective Complete: Located Mira the Seer at the Whispering Stones.');

          // Trigger state-aware start dialogue with Mira
          if (!get().storyFlags['m2_start_dialogue_triggered'] && !get().activeDialogue) {
            get().setStoryFlag('m2_start_dialogue_triggered', true);
            get().triggerDialogue(buildMission2StartDialogue());
          }
        }
      }

      // Obj 2: Hear warning / learn about the Architect
      const objWarning = activeMission.objectives.find((o) => o.id === 'obj_hear_mira_warning');
      if (objWarning && !objWarning.completed) {
        if (get().storyFlags['mira_lore_learned'] || get().storyFlags['architect_lore_revealed']) {
          objWarning.completed = true;
          missionModified = true;
        }
      }

      // Obj 3: Witness chronal scar / commune with Echo Tree / save checkpoint / rewind
      const objScar = activeMission.objectives.find((o) => o.id === 'obj_witness_chronal_scar');
      if (objScar && !objScar.completed && objWarning?.completed) {
        const hasUsedTimeline =
          useEchoTreeStore.getState().isInteracting ||
          world.timelineRestoreVersion > 0 ||
          world.events.some((ev) => ev.significance >= 2) ||
          Boolean(world.voice.lastCommand.includes('CHECKPOINT') || world.voice.lastCommand.includes('REWIND'));

        if (hasUsedTimeline) {
          objScar.completed = true;
          missionModified = true;
          world.addStoryLog('✨ Mission Objective Complete: Communed with the Echo Tree.');

          if (!get().storyFlags['m2_complete_dialogue_triggered'] && !get().activeDialogue) {
            get().setStoryFlag('m2_complete_dialogue_triggered', true);
            get().triggerDialogue(buildMission2CompleteDialogue());
          }
        }
      }

      // Check Mission 2 completion
      if (activeMission.objectives.every((o) => o.completed)) {
        activeMission.status = 'completed';
        activeMission.consequences.push({
          id: 'c_architect_unveiled',
          description: 'Mira revealed the mystery of The Architect and past reality fractures.',
          echoUsed: true,
        });

        // Advance to Act I
        const nextMission = missions.find((m) => m.id === 'm3_shadows_meadowlands');
        if (nextMission) {
          nextMission.status = 'active';
          set({
            currentAct: 'act1',
            activeMissionId: 'm3_shadows_meadowlands',
          });
        }
        world.addStoryLog('🏆 Act Complete: Prologue • Beginning Act I: The Gathering Clouds!');
      }
    }

    // ── MISSION 3: Shadows Over the Meadowlands (Act I) ───────
    if (activeMission.id === 'm3_shadows_meadowlands') {
      // 1. Spawn vanguard raiders if not spawned yet
      if (!get().storyFlags['raiders_spawned']) {
        get().setStoryFlag('raiders_spawned', true);
        world.addEntity({
          name: 'Shadowfang Raider',
          type: 'knight',
          category: 'character',
          factionId: 'shadowfang',
          position: { x: -14, y: 0, z: 4 },
          rotationY: 1.5,
          health: 80,
          maxHealth: 80,
          aiState: 'advancing',
          moveSpeed: 1.8,
          dialogBark: 'Burn the mill! Seize the crossing!',
        });
        world.addEntity({
          name: 'Shadowfang Scout',
          type: 'wolf',
          category: 'creature',
          factionId: 'shadowfang',
          position: { x: -12, y: 0, z: 2 },
          rotationY: 1.4,
          health: 60,
          maxHealth: 60,
          aiState: 'advancing',
          moveSpeed: 2.2,
          dialogBark: 'Grrr... forward!',
        });
        world.addStoryLog('⚔️ Shadowfang Raiders have crossed the ridge and are advancing toward Rowan\'s Mill!');

        if (!get().storyFlags['m3_start_dialogue_triggered'] && !get().activeDialogue) {
          get().setStoryFlag('m3_start_dialogue_triggered', true);
          get().triggerDialogue(buildMission3StartDialogue());
        }
      }

      const objProtectRowan = activeMission.objectives.find((o) => o.id === 'obj_protect_rowan');
      const objStopRaid = activeMission.objectives.find((o) => o.id === 'obj_stop_raid');

      // Check Rowan survival
      const rowan = Object.values(world.entities).find((e) => e.name.includes('Rowan'));

      // Check if raid is repelled / stopped by any Echo interference
      const raiders = Object.values(world.entities).filter(
        (e) => e.name.includes('Shadowfang Raider') || e.name.includes('Shadowfang Scout')
      );
      const bridgeExists = Object.values(world.entities).some((e) => e.type === 'bridge');
      const isBridgeDestroyed = !bridgeExists;
      const isWeatherHostile = world.weather.type === 'rain' || world.weather.type === 'storm';
      const isAllied = world.relations['suncrest']?.['shadowfang'] === 'allied';
      const raidersSpawned = Boolean(get().storyFlags['raiders_spawned']);
      const raidersRouted = raiders.length > 0 && raiders.every((r) => r.aiState === 'fleeing');

      const raidStopped = raidersSpawned && (isBridgeDestroyed || isWeatherHostile || isAllied || raidersRouted);

      if (objStopRaid && !objStopRaid.completed && raidStopped) {
        objStopRaid.completed = true;
        missionModified = true;
        world.addStoryLog('✨ Mission Objective Complete: Repelled the Shadowfang raid using the Echo!');
      }

      // Track Rowan's fate dynamically (saved, wounded, or dead)
      if (raidStopped && !get().storyFlags['rowan_fate']) {
        if (!rowan || rowan.health <= 0) {
          get().setStoryFlag('rowan_fate', 'dead');
          get().setStoryFlag('rowan_dead', true);
          get().adjustBond('rowan', -100);
          world.addStoryLog('💀 Rowan the Miller has fallen in the raid on the mill.');
          if (objProtectRowan) objProtectRowan.completed = false;
        } else if (rowan.health < 60) {
          get().setStoryFlag('rowan_fate', 'wounded');
          get().setStoryFlag('rowan_wounded', true);
          get().adjustBond('rowan', -15);
          world.addStoryLog('🩹 Rowan the Miller survived, but sustained serious wounds.');
          if (objProtectRowan) objProtectRowan.completed = true;
        } else {
          get().setStoryFlag('rowan_fate', 'saved');
          get().setStoryFlag('rowan_saved', true);
          get().adjustBond('rowan', 30);
          world.addStoryLog('🛡️ Rowan the Miller was saved unscathed by your Echo!');
          if (objProtectRowan) objProtectRowan.completed = true;
        }
        missionModified = true;
      }

      // Check Mission 3 completion
      if (activeMission.objectives.every((o) => o.completed || o.optional)) {
        activeMission.status = 'completed';
        activeMission.consequences.push({
          id: 'c_valley_fate_sealed',
          description: isAllied
            ? 'By your Echo, eternal brotherhood was sworn between Suncrest and Shadowfang.'
            : isBridgeDestroyed
            ? 'By your Echo, the river crossing was severed, safeguarding the valley from invasion.'
            : 'By your Echo, the Shadowfang vanguard was broken and forced to retreat.',
          echoUsed: true,
        });

        if (!get().storyFlags['m3_complete_dialogue_triggered'] && !get().activeDialogue) {
          get().setStoryFlag('m3_complete_dialogue_triggered', true);
          get().triggerDialogue(buildMission3CompleteDialogue());
        }

        // Unlock Mission 4: The Anchor of the Architect (Act IV)
        const nextMission = missions.find((m) => m.id === 'm4_anchor_architect');
        if (nextMission) {
          nextMission.status = 'active';
          set({
            currentAct: 'act4',
            activeMissionId: 'm4_anchor_architect',
          });
        }

        world.addStoryLog('🏆 Mission Complete: The Battle for the Mill!');
      }
    }

    if (missionModified) {
      set({ missions: [...missions] });
    }
  },

  // ── Snapshots for M4 Timeline Rewinds & Save/Load ─────────────
  getSnapshot: () => {
    const s = get();
    return {
      currentAct: s.currentAct,
      activeMissionId: s.activeMissionId,
      completedMissionIds: [...s.completedMissionIds],
      storyFlags: { ...s.storyFlags },
      characterBonds: { ...s.characterBonds },
      missions: JSON.parse(JSON.stringify(s.missions)),
    };
  },

  restoreSnapshot: (snap) => {
    if (!snap) return;
    set({
      currentAct: snap.currentAct || 'prologue',
      activeMissionId: snap.activeMissionId || 'm1_first_resonance',
      completedMissionIds: snap.completedMissionIds || [],
      storyFlags: snap.storyFlags || {},
      characterBonds: snap.characterBonds || {},
      missions: snap.missions || JSON.parse(JSON.stringify(CAMPAIGN_MISSIONS)),
      activeDialogue: null,
      dialogueLineIndex: 0,
    });
  },
}));

// Register campaign hooks into timeline snapshot & restore pipeline
registerCampaignTimelineHooks(
  () => useCampaignStore.getState().getSnapshot(),
  (snap) => useCampaignStore.getState().restoreSnapshot(snap)
);

export const CampaignSystem = {
  evaluate: () => useCampaignStore.getState().evaluate(),
  advanceDialogue: () => useCampaignStore.getState().advanceDialogue(),
  triggerDialogue: (d: DialogueSequence) => useCampaignStore.getState().triggerDialogue(d),
  closeDialogue: () => useCampaignStore.getState().closeDialogue(),
  getSnapshot: () => useCampaignStore.getState().getSnapshot(),
  restoreSnapshot: (snap: any) => useCampaignStore.getState().restoreSnapshot(snap),
};
