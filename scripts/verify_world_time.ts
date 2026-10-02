// ============================================================
// VERIFY WORLD TIME SCRIPT — Authoritative Progression & Pause Test
// Validates:
// 1. Authoritative time scaling: 60s real = 1 in-game hour (24m full day)
// 2. Time scale options (0.5x, 1.0x, 2.0x)
// 3. Auto-pause on dialogue active
// 4. Auto-pause on cinematic / title / intro
// 5. Auto-pause on pause menu
// 6. Auto-pause on save/load
// 7. Auto-pause on timeline rewind transition
// 8. Resumption when normal gameplay active
// ============================================================

import {
  REAL_SECONDS_PER_IN_GAME_HOUR,
  BASE_HOURS_PER_REAL_SECOND,
  DEFAULT_TIME_SCALE,
  TIME_SCALE_OPTIONS,
} from '../src/core/timeConfig';
import {
  calculateDeltaGameHours,
  shouldWorldTimeProgress,
  isSaveLoadActive,
  setSaveLoadActive,
  getDayNightPhase,
  getNpcSchedulePeriod,
} from '../src/core/timeSystem';
import { useWorldStore } from '../src/core/WorldState';
import { useCampaignStore } from '../src/campaign/CampaignSystem';
import { useTimelineStore } from '../src/systems/TimelineSystem';
import { useSettingsStore } from '../src/core/settingsStore';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${msg}`);
}

console.log('\n--- VERIFYING AUTHORITATIVE WORLD-TIME SCALING & AUTO-PAUSE ---\n');

// 1. Authoritative Math: 60 real seconds = 1 in-game hour
assert(REAL_SECONDS_PER_IN_GAME_HOUR === 60, '1 in-game hour = 60 real seconds');
assert(BASE_HOURS_PER_REAL_SECOND === 1 / 60, 'Base rate is 1/60 hr/sec');

const delta1s = calculateDeltaGameHours(1.0, 1.0);
assert(Math.abs(delta1s - (1 / 60)) < 1e-9, '1 real second = 1/60 in-game hour (1 in-game minute)');

const delta60s = calculateDeltaGameHours(60.0, 1.0);
assert(Math.abs(delta60s - 1.0) < 1e-9, '60 real seconds = exactly 1 in-game hour');

const delta24m = calculateDeltaGameHours(24 * 60, 1.0);
assert(Math.abs(delta24m - 24.0) < 1e-9, '24 real minutes = exactly 24 in-game hours (full day)');

// 2. Time Scale options (0.5x, 1.0x, 2.0x)
const delta05x = calculateDeltaGameHours(60.0, 0.5);
assert(Math.abs(delta05x - 0.5) < 1e-9, '0.5x time scale advances 0.5 hours per real minute');

const delta2x = calculateDeltaGameHours(60.0, 2.0);
assert(Math.abs(delta2x - 2.0) < 1e-9, '2.0x time scale advances 2.0 hours per real minute');

// 3. Settings store integration
useSettingsStore.getState().updateSettings({ timeScale: 2.0 });
assert(useSettingsStore.getState().timeScale === 2.0, 'Settings store accepts 2.0x time scale');
assert(useWorldStore.getState().time.speed === 2.0, 'WorldStore time.speed stays in lockstep');

useSettingsStore.getState().updateSettings({ timeScale: 1.0 });
assert(useSettingsStore.getState().timeScale === 1.0, 'Settings store reset to 1.0x');

// 4. Auto-pause: Save/Load
assert(!isSaveLoadActive(), 'Save/load initially not active');
setSaveLoadActive(true);
assert(isSaveLoadActive(), 'Save/load active flag set');
assert(!shouldWorldTimeProgress(), 'Time progress blocked while save/load is active');
setSaveLoadActive(false);

// 5. Auto-pause: Dialogue
useCampaignStore.setState({ activeDialogue: null });
useWorldStore.getState().setTime({ isPaused: false });
useTimelineStore.setState({ isTransitioning: false });
assert(shouldWorldTimeProgress(), 'Time progresses during normal gameplay');

useCampaignStore.setState({
  activeDialogue: {
    id: 'test_diag',
    lines: [{ speaker: 'Rowan', text: 'Hello', speakerRole: 'Miller' }],
  },
});
assert(!shouldWorldTimeProgress(), 'Time automatically pauses when dialogue is active');
useCampaignStore.setState({ activeDialogue: null });
assert(shouldWorldTimeProgress(), 'Time resumes when dialogue closes');

// 6. Auto-pause: Timeline transition
useTimelineStore.setState({ isTransitioning: true });
assert(!shouldWorldTimeProgress(), 'Time automatically pauses during timeline rewind/branch transition');
useTimelineStore.setState({ isTransitioning: false });
assert(shouldWorldTimeProgress(), 'Time resumes after timeline transition completes');

// 7. Auto-pause: gameState checks (cinematic / title / intro / pause menu)
assert(!shouldWorldTimeProgress('title'), 'Time is paused on title screen');
assert(!shouldWorldTimeProgress('intro'), 'Time is paused during story intro cinematic');
assert(!shouldWorldTimeProgress('paused'), 'Time is paused when pause menu is open');
assert(shouldWorldTimeProgress('playing'), 'Time progresses when playing');

// 8. Day/Night phase & NPC schedules
assert(getDayNightPhase(12) === 'day', '12:00 is daytime');
assert(getDayNightPhase(23) === 'night', '23:00 is nighttime');
assert(getDayNightPhase(6) === 'dawn', '6:00 is dawn');
assert(getDayNightPhase(19) === 'dusk', '19:00 is dusk');

const daySchedule = getNpcSchedulePeriod(12);
assert(daySchedule.isAwake === true, 'NPCs are awake during day');

const nightSchedule = getNpcSchedulePeriod(2);
assert(nightSchedule.isAwake === false, 'NPCs are resting at night');

console.log('\n🎉 ALL WORLD-TIME VERIFICATION TESTS PASSED SUCCESSFULLY!\n');
