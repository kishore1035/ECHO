// ============================================================
// AUTHORITATIVE WORLD TIME CONTROLLER & SYSTEM
// Single source of truth driving:
// - sun position, moon position, lighting, day/night state
// - weather timing, NPC schedules, story/event timing, quest timing
//
// Automatically pauses when:
// - dialogue is active
// - a cinematic / story intro sequence is active
// - the pause menu is open
// - save / load is occurring
// - a timeline rewind / branch transition is occurring
//
// Resumes smoothly during normal gameplay.
// ============================================================

import { useWorldStore } from './WorldState';
import { useCampaignStore } from '../campaign/CampaignSystem';
import { useTimelineStore } from '../systems/TimelineSystem';
import { useSettingsStore } from './settingsStore';
import {
  BASE_HOURS_PER_REAL_SECOND,
  DEFAULT_TIME_SCALE,
  type TimeScale,
} from './timeConfig';

// ─── Save / Load Activity Tracker ────────────────────────────
let _isSaveLoadActive = false;

export function isSaveLoadActive(): boolean {
  return _isSaveLoadActive;
}

export function setSaveLoadActive(active: boolean): void {
  _isSaveLoadActive = active;
  // Sync immediately to world store
  useWorldStore.getState().setTime({
    isPaused: !shouldWorldTimeProgress(),
  });
}

// ─── Authoritative Pause Evaluation ───────────────────────────
export interface TimePauseReasons {
  isDialogueActive: boolean;
  isCinematicActive: boolean;
  isPauseMenuOpen: boolean;
  isSaveLoadActive: boolean;
  isTimelineTransitioning: boolean;
  isManuallyPaused: boolean;
}

export function getTimePauseReasons(gameState?: string): TimePauseReasons {
  const worldTime = useWorldStore.getState().time;
  const isDialogueActive = Boolean(useCampaignStore.getState().activeDialogue);
  const isTimelineTransitioning = Boolean(useTimelineStore.getState().isTransitioning);
  const isSavingLoading = _isSaveLoadActive;
  const isCinematicActive = gameState ? (gameState === 'splash' || gameState === 'title' || gameState === 'intro') : false;
  const isPauseMenuOpen = gameState ? gameState === 'paused' : worldTime.isPaused;
  const isManuallyPaused = worldTime.isPaused;

  return {
    isDialogueActive,
    isCinematicActive,
    isPauseMenuOpen,
    isSaveLoadActive: isSavingLoading,
    isTimelineTransitioning,
    isManuallyPaused,
  };
}

/**
 * Returns true ONLY if normal gameplay is active and NO pause conditions apply.
 */
export function shouldWorldTimeProgress(gameState?: string): boolean {
  // If dialogue is open
  if (useCampaignStore.getState().activeDialogue) return false;

  // If timeline rewind / branch switch is in progress
  if (useTimelineStore.getState().isTransitioning) return false;

  // If save/load modal is open or saving/loading
  if (_isSaveLoadActive) return false;

  // If explicit gameState passed and it's not active playing
  if (gameState && gameState !== 'playing') return false;

  // If store time is paused
  if (useWorldStore.getState().time.isPaused) return false;

  return true;
}

/**
 * Calculates in-game hours advanced for a given real-world delta in seconds.
 */
export function calculateDeltaGameHours(realDeltaSeconds: number, customScale?: TimeScale): number {
  const settingsScale = useSettingsStore.getState().timeScale ?? DEFAULT_TIME_SCALE;
  const scale = customScale ?? settingsScale;
  return realDeltaSeconds * BASE_HOURS_PER_REAL_SECOND * scale;
}

/**
 * Phase of day based on current hour
 */
export type DayNightPhase = 'dawn' | 'day' | 'dusk' | 'night';

export function getDayNightPhase(hours: number): DayNightPhase {
  if (hours >= 5.5 && hours < 7.0) return 'dawn';
  if (hours >= 7.0 && hours < 18.0) return 'day';
  if (hours >= 18.0 && hours < 20.0) return 'dusk';
  return 'night';
}

/**
 * NPC routine / schedule description based on authoritative world time
 */
export function getNpcSchedulePeriod(hours: number): {
  phase: DayNightPhase;
  isAwake: boolean;
  activityLabel: string;
} {
  const phase = getDayNightPhase(hours);
  switch (phase) {
    case 'dawn':
      return { phase, isAwake: true, activityLabel: 'Rising & Morning Duties' };
    case 'day':
      return { phase, isAwake: true, activityLabel: 'Daily Labor & Patrol' };
    case 'dusk':
      return { phase, isAwake: true, activityLabel: 'Evening Hearth & Rest' };
    case 'night':
      return { phase, isAwake: false, activityLabel: 'Night Rest / Night Watch' };
  }
}
