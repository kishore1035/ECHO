// ============================================================
// SAVE SYSTEM — 3-Slot Game Persistence (M4 Architecture)
// Saves complete world snapshot + timeline tree to localStorage.
// Zero conflicting state systems: reuses WorldSnapshot directly.
// ============================================================

import { useWorldStore } from './WorldState';
import { useTimelineStore, captureSnapshot } from '../systems/TimelineSystem';
import { NarrativeEngine } from '../systems/NarrativeEngine';
import { useCampaignStore } from '../campaign/CampaignSystem';
import type { WorldSnapshot, TimelineBranch, TimelineCheckpoint } from './types';

export interface SaveSlotData {
  slotId: 1 | 2 | 3;
  name: string;
  savedAt: number;
  worldSnapshot: WorldSnapshot;
  timeline: {
    branches: Record<string, TimelineBranch>;
    checkpoints: Record<string, TimelineCheckpoint>;
    activeBranchId: string;
    activeCheckpointId: string;
  };
  summary: {
    actTitle: string;
    gameHour: number;
    weather: string;
    branchName: string;
    entityCount: number;
  };
}

const STORAGE_PREFIX = 'echo_save_slot_';

export function getSaveSlot(slotId: 1 | 2 | 3): SaveSlotData | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${slotId}`);
    if (!raw) return null;
    return JSON.parse(raw) as SaveSlotData;
  } catch (err) {
    console.warn(`[SaveSystem] Failed reading slot ${slotId}:`, err);
    return null;
  }
}

export function getAllSaveSlots(): (SaveSlotData | null)[] {
  return [getSaveSlot(1), getSaveSlot(2), getSaveSlot(3)];
}

export function hasAnySave(): boolean {
  return getAllSaveSlots().some((s) => s !== null);
}

export function getMostRecentSave(): SaveSlotData | null {
  const slots = getAllSaveSlots().filter((s): s is SaveSlotData => s !== null);
  if (slots.length === 0) return null;
  return slots.sort((a, b) => b.savedAt - a.savedAt)[0];
}

import { setSaveLoadActive } from './timeSystem';

export function saveToSlot(slotId: 1 | 2 | 3, customName?: string): boolean {
  setSaveLoadActive(true);
  try {
    const worldStore = useWorldStore.getState();
    const timelineStore = useTimelineStore.getState();

    const worldSnapshot = captureSnapshot();
    const activeBranch = timelineStore.branches[timelineStore.activeBranchId];

    const slotName =
      customName?.trim() ||
      `${worldStore.story.currentAct.split(':')[0]} • ${activeBranch?.name.split(':')[0] || 'Prime'}`;

    const saveData: SaveSlotData = {
      slotId,
      name: slotName,
      savedAt: Date.now(),
      worldSnapshot,
      timeline: {
        branches: timelineStore.branches,
        checkpoints: timelineStore.checkpoints,
        activeBranchId: timelineStore.activeBranchId,
        activeCheckpointId: timelineStore.activeCheckpointId,
      },
      summary: {
        actTitle: worldStore.story.title,
        gameHour: worldStore.time.hours,
        weather: worldStore.weather.type,
        branchName: activeBranch?.name || 'Prime Timeline',
        entityCount: Object.keys(worldStore.entities).length,
      },
    };

    localStorage.setItem(`${STORAGE_PREFIX}${slotId}`, JSON.stringify(saveData));
    worldStore.addStoryLog(`Game saved to Slot ${slotId}: "${slotName}".`);
    console.log(`[SaveSystem] Successfully saved to Slot ${slotId}`);
    return true;
  } catch (err) {
    console.error(`[SaveSystem] Failed saving to Slot ${slotId}:`, err);
    return false;
  } finally {
    setSaveLoadActive(false);
  }
}

export function loadFromSlot(slotId: 1 | 2 | 3): boolean {
  setSaveLoadActive(true);
  try {
    const data = getSaveSlot(slotId);
    if (!data) {
      console.warn(`[SaveSystem] Slot ${slotId} is empty`);
      return false;
    }

    // 1. Restore Timeline store
    useTimelineStore.setState({
      branches: data.timeline.branches,
      checkpoints: data.timeline.checkpoints,
      activeBranchId: data.timeline.activeBranchId,
      activeCheckpointId: data.timeline.activeCheckpointId,
      isTransitioning: false,
    });

    // 2. Restore World simulation state
    useWorldStore.getState().restoreSnapshot(data.worldSnapshot);
    NarrativeEngine.setFiredTriggers(data.worldSnapshot.firedTriggers || []);
    if (data.worldSnapshot.campaign) {
      useCampaignStore.getState().restoreSnapshot(data.worldSnapshot.campaign);
    }

    useWorldStore.getState().addStoryLog(
      `Loaded Save Slot ${slotId}: "${data.name}" [${data.summary.actTitle}]`
    );

    console.log(`[SaveSystem] Successfully loaded Slot ${slotId}`);
    return true;
  } catch (err) {
    console.error(`[SaveSystem] Failed loading Slot ${slotId}:`, err);
    return false;
  } finally {
    setSaveLoadActive(false);
  }
}

export function deleteSaveSlot(slotId: 1 | 2 | 3): boolean {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${slotId}`);
    return true;
  } catch {
    return false;
  }
}
